"""RH — blocos C, D e E e ocorrências: pedido de alteração de dados no Meu RH aprovado pela gestão (a partir do «Hoje»),
painel de pessoas e simulador de custo, objetivos por trimestre, conversas 1:1, competências, certificações com renovação
na agenda, e ocorrências (regulamento confirmado → «Não cumpre» no bónus; o colaborador vê só as confirmadas).
Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-hr-growth')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoRealUser='u1';s.ceoViewingAs=null;
 for(const u of [...s.users,...Object.values(s.employees||{})]){if(u.id==='test_tec')u.hr={...u.hr,admissionDate:'2024-01-15',grossSalary:1200,mealAllowance:6,phone:'912000000',contractType:'Contrato sem termo'}}
 for(const k2 of ['hrDataRequests','hrObjectives','hrOneOnOnes','hrCompetences','hrCertifications','hrIncidents'])delete s[k2];
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:u1',theme);localStorage.setItem('gs-v4-theme:test_tec',theme)}"""
AS = "([k,u])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=u==='u1'?null:u;localStorage.setItem(k,JSON.stringify(s))}"


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)
def as_(p, u): p.evaluate(AS, [K, u]); p.reload(); p.wait_for_function('window.HRGrowthV4&&window.GSHRGrowth'); p.wait_for_timeout(300)
def section(p, key): p.evaluate(f"HRLifecycleV4.openSection('{key}')"); p.wait_for_timeout(600); return p.locator(f'#rh-panel-{key}')


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('tablet', 820, 1180), ('desktop', 1366, 900)]:
            for theme in (['light', 'dark'] if device == 'desktop' else ['light']):
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device != 'desktop', has_touch=device != 'desktop', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); prompts = ['Ouvido o colaborador']
                p.on('dialog', lambda d: d.accept(prompts[0]) if d.type == 'prompt' else d.accept())
                p.clock.install(time=datetime.datetime.fromisoformat('2026-11-10T10:00:00+00:00'))
                p.goto(URL); p.wait_for_function('window.HRGrowthV4&&window.GSHRGrowth')
                p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.HRGrowthV4'); p.wait_for_timeout(300)
                # C — colaborador pede alteração de dados no Meu RH
                as_(p, 'test_tec'); p.evaluate("App.showView('myhr')"); p.wait_for_timeout(600); mine = p.locator('[data-hrg-mine]')
                check('Meu RH shows «Os meus dados e objetivos»', mine.count() == 1 and '912000000' in mine.inner_text())
                mine.locator('[data-hrg-ask]').click(); f = p.locator('[data-hrg-ask-form]')
                f.locator('[name=iban]').fill('PT50 0002 0123 1234 5678 9015 5'); f.locator('[name=address]').fill('Rua SYN 10, Abrantes'); f.locator('button').click(); p.wait_for_timeout(300)
                check('invalid IBAN is refused before reaching HR', not state(p).get('hrDataRequests'))
                f.locator('[name=iban]').fill('PT50 0002 0123 1234 5678 9015 4'); f.locator('button').click(); p.wait_for_timeout(400)
                r = state(p)['hrDataRequests'][0]
                check('request saved as pending with old and new values', r['status'] == 'Pendente' and r['changes']['address'] == 'Rua SYN 10, Abrantes' and 'iban' in r['changes'])
                check('the button is disabled while a request is pending', p.locator('[data-hrg-mine] [data-hrg-ask]').is_disabled() and 'Por decidir' in p.locator('[data-hrg-mine]').inner_text())
                # gestão decide a partir do «Hoje»
                as_(p, 'u1'); p.evaluate("App.showView('today')"); p.wait_for_timeout(400)
                need = p.locator('.today-need')
                check('«Hoje» shows the data change request', '1 pedido de alteração de dados por decidir' in need.inner_text())
                need.locator('[data-today-hr=requests]').click(); p.wait_for_timeout(700); pan = p.locator('#rh-panel-requests')
                check('«Pedidos de dados» shows old → new values', pan.locator('[data-hrg-request]').count() == 1 and 'Rua SYN 10' in pan.inner_text())
                pan.locator('[data-hrg-data-ok]').click(); p.wait_for_timeout(400)
                u = next(x for x in state(p)['users'] if x['id'] == 'test_tec')
                check('approval updates the employee record', u['hr']['address'] == 'Rua SYN 10, Abrantes' and u['hr']['iban'] == 'PT50000201231234567890154')
                # D — painel de pessoas e simulador
                pan = section(p, 'people')
                check('people dashboard with KPIs and per-clinic table', pan.locator('.hrg-kpi').count() == 5 and pan.locator('[data-hrg-dashboard] tbody tr').count() >= 1)
                sf = pan.locator('[data-hrg-sim-form]'); sf.locator('[name=gross]').fill('1000'); sf.locator('button').click(); p.wait_for_timeout(300)
                out = pan.locator('[data-hrg-sim-out]').inner_text().replace('\xa0', ' ').replace('\u202f', ' ')
                check('hiring simulator: 1000 € gross → annual cost with TSU', 'Custo anual para a empresa' in out and '18 917,00 €' in out)
                # E — objetivos, 1:1, competências, certificações
                pan = section(p, 'growth'); fo = pan.locator('[data-hrg-form=objective]')
                fo.locator('[name=employeeId]').select_option('test_tec'); fo.locator('[name=title]').fill('SYN 40 avaliações iniciais'); fo.locator('[name=target]').fill('40'); fo.locator('button').click(); p.wait_for_timeout(400)
                check('objective added for the quarter', state(p)['hrObjectives'][0]['quarter'] == '2026-Q4' and pan.locator('[data-hrg-obj]').count() == 1)
                ft = pan.locator('[data-hrg-form=talk]'); ft.locator('[name=employeeId]').select_option('test_tec'); ft.locator('[name=notes]').fill('SYN conversa trimestral'); ft.locator('[name=actions]').fill('SYN curso de SBV'); ft.locator('button').click(); p.wait_for_timeout(300)
                fc = pan.locator('[data-hrg-form=competence]'); fc.locator('[name=employeeId]').select_option('test_tec'); fc.locator('[name=name]').fill('Drenagem linfática'); fc.locator('[name=level]').select_option('Autónomo'); fc.locator('button').click(); p.wait_for_timeout(300)
                fz = pan.locator('[data-hrg-form=cert]'); fz.locator('[name=employeeId]').select_option('test_tec'); fz.locator('[name=name]').fill('Suporte Básico de Vida'); fz.locator('[name=validUntil]').fill('2026-12-10'); fz.locator('button').click(); p.wait_for_timeout(400)
                check('1:1, competence matrix and certification shown', len(state(p)['hrOneOnOnes']) == 1 and 'Drenagem linfática' in pan.locator('[data-hrg-competences]').inner_text() and 'Renovar até 10/12/2026' in pan.locator('[data-hrg-certs]').inner_text())
                check('certification renewal appears in the agenda list', p.evaluate("()=>GSAgenda.renewalItems(JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'))).some(x=>x.key.startsWith('cert:'))"))
                # Ocorrências
                pan = section(p, 'incidents'); pan.locator('[data-hrg-inc-new] summary').click() if not pan.locator('[data-hrg-inc-new]').get_attribute('open') else None
                fi = pan.locator('[data-hrg-inc-form]'); fi.locator('[name=employeeId]').select_option('test_tec'); fi.locator('[name=date]').fill('2026-11-05'); fi.locator('[name=kind]').select_option('regulation'); fi.locator('[name=description]').fill('SYN atrasos repetidos sem aviso'); fi.locator('button').click(); p.wait_for_timeout(400)
                inc = state(p)['hrIncidents'][0]
                check('incident recorded «Por analisar»', inc['status'] == 'Por analisar' and pan.locator('[data-hrg-incident]').count() == 1)
                pan.locator(f'[data-hrg-inc-status="{inc["id"]}"]').select_option('Confirmada'); p.wait_for_timeout(400)
                check('confirming asks for a reason and keeps history', state(p)['hrIncidents'][0]['status'] == 'Confirmada' and state(p)['hrIncidents'][0]['history'][-1]['reason'] == 'Ouvido o colaborador')
                reg = p.evaluate("()=>GSBonus.compute(JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),'2026-Q4','2026-11-10').people.find(x=>x.id==='test_tec')")
                check('confirmed breach → bonus regulation «Não cumpre»', reg is None or reg['regulation'] == 'Não cumpre')
                # colaborador: objetivos e ocorrências confirmadas
                as_(p, 'test_tec'); p.evaluate("App.showView('myhr')"); p.wait_for_timeout(600); mine = p.locator('[data-hrg-mine]')
                check('employee sees objective, certification and confirmed incident', 'SYN 40 avaliações iniciais' in mine.inner_text() and 'Suporte Básico de Vida' in mine.inner_text() and 'Incumprimento do regulamento interno' in mine.inner_text())
                mine.locator('[data-hrg-myprog]').fill('60'); mine.locator('[data-hrg-myprog]').dispatch_event('change'); p.wait_for_timeout(300)
                check('employee updates own progress', state(p)['hrObjectives'][0]['progress'] == 60)
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'hr-growth-{device}-{theme}.png'), full_page=False); c.close()
    finally:
        (OUT / 'hr-growth-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

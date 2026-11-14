"""Marketing › Assistente IA — plano de ações do mês (demonstração sem chave: exemplo por regras; com a chave no
servidor de testes é o Claude). Só números agregados; CEO/Administração aprovam ou rejeitam cada ação. Dados sintéticos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-marketing-plan')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoRealUser='u1';s.ceoViewingAs=null;delete s.marketingPlans;for(const c of s.clinics)if(c.id==='abranfir'){c.phone='241 000 111';c.nif='500000000';c.ers={...(c.ers||{}),license:'E123456'}}
 const cid=String((s.clinics||[])[0]?.id||'abranfir');s.requests=[...(s.requests||[]).filter(r=>!String(r.id).startsWith('syn-mkp')),...[...Array(12)].map((_,i)=>({id:'syn-mkp'+i,clinic:cid,specialty:i<8?'Fisioterapia':'Osteopatia',created:'2026-10-'+String(i+1).padStart(2,'0')+'T10:00:00Z',stage:i<3?'Marcado':'Por marcar',unmetReason:i>=8?'Sem horário compatível':'',channel:'Instagram',name:'SYN Utente '+i,phone:'91000000'+i}))];
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:u1',theme)}"""


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('desktop', 1366, 900)]:
            for theme in (['light', 'dark'] if device == 'desktop' else ['light']):
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device != 'desktop', has_touch=device != 'desktop', service_workers='block', accept_downloads=True)
                external = []
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') or r.request.url.startswith(('data:', 'blob:')) else (external.append(r.request.url), r.abort()))
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.accept('Fora do orçamento deste mês'))
                p.clock.install(time=datetime.datetime.fromisoformat('2026-11-10T10:00:00+00:00'))
                p.goto(URL); p.wait_for_function('window.MarketingPlanV4&&window.GSMarketingPlan')
                p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.MarketingPlanV4'); p.wait_for_timeout(300)
                p.evaluate("App.showView('marketing')"); p.wait_for_timeout(700); p.locator('[data-mk-tab=assistant]').click(); p.wait_for_timeout(600)
                card = p.locator('[data-mkp]')
                check('«Plano de ações do mês» appears in Assistente IA', card.count() == 1 and 'Demonstração' in card.inner_text())
                card.locator('[data-mkp-generate]').click(); p.wait_for_timeout(600)
                plan = (state(p).get('marketingPlans') or [None])[0]
                check('plan generated from aggregated numbers (example without AI)', plan and plan['source'] == 'example' and len(plan['actions']) >= 2 and plan['month'] == 'novembro de 2026')
                check('no personal data in the plan', 'SYN Utente' not in json.dumps(plan, ensure_ascii=False) and '91000000' not in json.dumps(plan))
                acts = p.locator('[data-mkp-action]')
                check('actions show clinic, channel, budget, why, KPI and steps', acts.count() == len(plan['actions']) and 'Porquê:' in acts.first.inner_text() and 'Medir:' in acts.first.inner_text())
                acts.nth(0).locator('[data-mkp-ok]').click(); p.wait_for_timeout(300)
                p.locator('[data-mkp-action]').nth(1).locator('[data-mkp-no]').click(); p.wait_for_timeout(300)
                a = state(p)['marketingPlans'][0]['actions']
                check('approve and reject (with reason) each action', a[0]['status'] == 'Aprovada' and a[1]['status'] == 'Rejeitada' and a[1]['history'][-1]['note'] == 'Fora do orçamento deste mês')
                img = p.locator('[data-mki]')
                check('«Imagens para publicações» appears with a compliant preview', img.count() == 1 and img.locator('[data-mki-check]').get_attribute('data-mki-check') == 'ok')
                p.locator('[data-mkp-action]').first.locator('[data-mki-from]').click(); p.wait_for_timeout(500)
                img = p.locator('[data-mki]')
                check('«Criar imagem» on a plan action opens the generator with that clinic, specialty and template', img.locator('[name=template]').input_value() == 'specialty' and img.locator('[name=specialty]').input_value() == plan['actions'][0]['specialty'])
                img.locator('[name=specialty]').select_option('Cardiologia'); p.wait_for_timeout(300); img = p.locator('[data-mki]'); img.locator('[name=template]').select_option('tip'); p.wait_for_timeout(300); img = p.locator('[data-mki]'); img.locator('[name=format]').select_option('square'); p.wait_for_timeout(300); img = p.locator('[data-mki]')
                check('cardiology tips offered (hypertension, chest pain, activity)', any('Hipertens' in t for t in img.locator('[name=tip] option').all_inner_texts()) and len(img.locator('[name=tip] option').all_inner_texts()) == 3)
                with p.expect_download() as dl: img.locator('[data-mki-png]').click()
                f = OUT / f'post-{device}-{theme}.png'; dl.value.save_as(str(f)); hd = f.read_bytes()[:24]
                check('square post downloads as 1080×1080 PNG and is logged', hd[:8] == b'\x89PNG\r\n\x1a\n' and int.from_bytes(hd[16:20], 'big') == 1080 and int.from_bytes(hd[20:24], 'big') == 1080 and state(p)['marketingImages'][-1]['format'] == 'square')
                check('no external requests from the browser', not external)
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'marketing-plan-{device}-{theme}.png')); c.close()
    finally:
        (OUT / 'marketing-plan-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

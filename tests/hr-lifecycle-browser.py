"""RH — ciclo de vida e obrigações legais (aprovado): candidato contratado começa com plano de acolhimento,
acolhimento com tarefas por responsável (o colaborador marca as suas a partir do «Hoje»), saída com entrevista e
fecho que inativa a ficha, mapa de férias com sobreposições e registo de afixação, 40 h de formação, seguro de
acidentes de trabalho (renovação na agenda, acidentes por participar no «Hoje») e Relatório Único com dados em falta.
Dados sintéticos; sem pedidos externos."""
import os, json
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-hr-lifecycle')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoRealUser='u1';s.ceoViewingAs=null;
 for(const u of [...s.users,...Object.values(s.employees||{})]){if(u.id==='test_med'){u.profession='SYN Fisioterapeuta';u.hr={...u.hr,contractType:'Contrato a termo certo',admissionDate:'2026-11-02'}}if(u.id==='test_adm'){u.profession='SYN Fisioterapeuta'}if(u.id==='test_tec'){u.profession='SYN Fisioterapeuta';u.hr={...u.hr,contractType:'Contrato sem termo'}}}
 s.leave=[...(s.leave||[]).filter(l=>!String(l.id||'').startsWith('syn-hrl')),{id:'syn-hrl1',user:'test_med',type:'Férias',status:'Aprovado',start:'2027-08-02',end:'2027-08-13'},{id:'syn-hrl2',user:'test_tec',type:'Férias',status:'Pendente',start:'2027-08-09',end:'2027-08-20'},{id:'syn-hrl3',user:'test_adm',type:'Férias',status:'Aprovado',start:'2027-08-10',end:'2027-08-12'}];
 s.hrTraining=[...(s.hrTraining||[]),{recordType:'training',employeeId:'test_med',status:'Validada',allocationYear:2026,validHours:12}];
 s.candidates=[...(s.candidates||[]),{id:'syn-cand',name:'SYN Ana Contratada',email:'syn.ana@example.invalid',phone:'910000000',role:(s.jobRoles||[])[0]?.id||'role',clinic:'abranfir',stage:'Contratado',active:true,history:[],documents:[]}];
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:u1',theme)}"""


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('tablet', 820, 1180), ('desktop', 1366, 900)]:
            for theme in (['light', 'dark'] if device == 'desktop' else ['light']):
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device != 'desktop', has_touch=device != 'desktop', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.accept())
                p.clock.install(time=__import__('datetime').datetime.fromisoformat('2026-11-10T10:00:00+00:00'))
                p.goto(URL); p.wait_for_function('window.HRLifecycleV4&&window.GSHRLifecycle&&window.CommunicationsV4')
                p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.HRLifecycleV4'); p.wait_for_timeout(300)
                # A1 + A2: candidato contratado → colaborador com plano de acolhimento
                emp = p.evaluate("CommunicationsV4.convert('syn-cand','ADMINISTRATIVA')")
                s = state(p)
                check('hiring from Recruitment creates the employee and starts the onboarding plan', s['hrOnboarding'][emp]['tasks'] and s['employees'][emp]['candidateId'] == 'syn-cand')
                p.evaluate("HRLifecycleV4.openSection('lifecycle')"); p.wait_for_timeout(600); pan = p.locator('#rh-panel-lifecycle')
                check('«Entradas e saídas» lists the new plan', pan.locator(f'[data-hrl-plan="{emp}"]').count() == 1)
                pan.locator('[data-hrl-form=start-onboarding] [name=employeeId]').select_option('test_med'); pan.locator('[data-hrl-form=start-onboarding] button').click(); p.wait_for_timeout(300)
                plan = state(p)['hrOnboarding']['test_med']
                check('role template: doctor gets the professional licence task, dates from admission', any('Cédula profissional' in t['title'] for t in plan['tasks']) and plan['start'] == '2026-11-02')
                pan.locator('[data-hrl-plan=test_med] [data-hrl-tick]').first.check(); p.wait_for_timeout(250)
                check('ticking a task is saved with who and when', state(p)['hrOnboarding']['test_med']['tasks'][0]['done']['by'] == 'u1')
                f = pan.locator('[data-hrl-form=add-task][data-emp=test_med]'); f.locator('[name=title]').fill('SYN visita às clínicas'); f.locator('button').click(); p.wait_for_timeout(250)
                check('managers add tasks to a plan', state(p)['hrOnboarding']['test_med']['tasks'][-1]['title'] == 'SYN visita às clínicas')
                p.evaluate("App.showView('today')"); p.wait_for_timeout(300)
                check('«Hoje» groups late onboarding tasks per person', 'Acolhimento de Médico Teste:' in p.locator('.today-need').inner_text() and 'tarefas em atraso' in p.locator('.today-need').inner_text())
                # A3: saída
                p.evaluate("HRLifecycleV4.openSection('lifecycle')"); p.wait_for_timeout(500); pan = p.locator('#rh-panel-lifecycle'); of = pan.locator('[data-hrl-form=start-offboarding]')
                of.locator('[name=employeeId]').select_option('test_tec'); of.locator('[name=lastDay]').fill('2026-12-10'); of.locator('[name=vacationDaysLeft]').fill('6'); of.locator('button').click(); p.wait_for_timeout(300)
                ex = state(p)['hrOffboarding']['test_tec']
                check('exit checklist with vacation days and unemployment declaration', any('6 dias' in t['title'] for t in ex['tasks']) and any('RP 5044' in t['title'] for t in ex['tasks']))
                check('cannot close an exit with tasks open', pan.locator('[data-hrl-close=test_tec]').is_disabled())
                pan.locator('[data-hrl-interview=test_tec]').click(); p.locator('#hrlInterview [name=reason]').select_option('Proposta salarial'); p.locator('#hrlInterview [name=score]').fill('4'); p.locator('#hrlInterview button').click(); p.wait_for_timeout(300)
                for t in state(p)['hrOffboarding']['test_tec']['tasks']:
                    box = p.locator(f'#rh-panel-lifecycle [data-hrl-tick=offboarding][data-emp=test_tec][data-task="{t["id"]}"]')
                    if not box.is_checked(): box.check(); p.wait_for_timeout(150)
                p.locator('#rh-panel-lifecycle [data-hrl-close=test_tec]').click(); p.wait_for_timeout(300)
                s = state(p); tec = next(u for u in s['users'] if u['id'] == 'test_tec')
                check('closing the exit deactivates the record and keeps the reason', tec['active'] is False and tec['hr']['exitReason'] == 'Proposta salarial' and s['hrOffboarding']['test_tec']['closedAt'])
                check('turnover by reason shown', 'Proposta salarial 1' in p.locator('#rh-panel-lifecycle [data-hrl-offboarding]').inner_text())
                # B: obrigações legais
                p.evaluate("HRManagementV4.select('legal')"); p.wait_for_timeout(400); lg = p.locator('#rh-panel-legal')
                check('vacation map for next year with the 15 April deadline', 'Mapa de férias 2027' in lg.inner_text() and '15/04/2027' in lg.inner_text())
                check('overlap in the same function is flagged', lg.locator('[data-hrl-vacmap] .hrl-warn').count() == 1 and 'Administrativa Teste e Médico Teste' in lg.locator('[data-hrl-vacmap]').inner_text() and 'Técnico Teste' not in lg.locator('[data-hrl-vacmap]').inner_text())
                lg.locator('[data-hrl-posted]').click(); p.wait_for_timeout(250)
                check('posting the map is recorded', any(k.endswith(':2027') for k in state(p)['hrVacationMapPosted']))
                check('40 h: doctor with 12 h validated is at risk', 'Médico Teste' in lg.locator('[data-hrl-training]').inner_text() and '12 / 40 h' in lg.locator('[data-hrl-training]').inner_text())
                lg.locator('[data-hrl-form=policy]').evaluate("f=>f.closest('details').open=true"); pf = lg.locator('[data-hrl-form=policy]')
                check('insurance never offered for the internal «Administração» entity', 'Administração' not in pf.locator('[name=clinicId]').inner_text())
                pf.locator('[name=insurer]').fill('SYN Seguradora'); pf.locator('[name=number]').fill('AT-1'); pf.locator('[name=validUntil]').fill('2026-12-31'); pf.locator('[name=covered]').fill('5'); pf.locator('button').click(); p.wait_for_timeout(300)
                check('policy renewal appears in the management agenda', p.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-12-01',end:'2026-12-01'}).rows.some(x=>x.kind==='renewal'&&/seguro de acidentes/.test(x.title))})()"))
                lg.locator('[data-hrl-form=accident]').evaluate("f=>f.closest('details').open=true"); af = lg.locator('[data-hrl-form=accident]')
                af.locator('[name=employeeId]').select_option('test_med'); af.locator('[name=description]').fill('SYN entorse'); af.locator('[name=sickDays]').fill('3'); af.locator('button').click(); p.wait_for_timeout(300)
                p.evaluate("App.showView('today')"); p.wait_for_timeout(300)
                check('accident to report shows in «Hoje»', 'Acidente de trabalho de 10/11/2026 por participar' in p.locator('.today-need').inner_text())
                p.locator('.today-need .today-item', has_text='Acidente de trabalho').click(); p.wait_for_timeout(500); lg = p.locator('#rh-panel-legal')
                check('the «Hoje» item opens «Obrigações legais»', lg.is_visible())
                lg.locator('[data-hrl-report]').first.click(); p.wait_for_timeout(250)
                check('accident marked as reported', state(p)['hrInsurance']['accidents'][-1]['status'] == 'Participado')
                check('Relatório Único lists what is missing with a link to fix', 'dados em falta' in lg.locator('[data-hrl-ru]').inner_text() and lg.locator('[data-hrl-fix]').count() >= 1)
                with p.expect_download() as dl: lg.locator('[data-hrl-csv]').click()
                check('Relatório Único exports a CSV file', dl.value.suggested_filename == 'relatorio-unico-2026.csv')
                # colaborador marca as suas tarefas a partir do «Hoje»
                p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_med';s.ceoViewingAs='test_med';localStorage.setItem(k,JSON.stringify(s))}", K); p.reload(); p.wait_for_function('window.HRLifecycleV4'); p.wait_for_timeout(300)
                p.evaluate("App.showView('today')"); p.wait_for_timeout(300)
                check('the employee sees own onboarding tasks in «Hoje»', 'O meu acolhimento:' in p.locator('.today-need').inner_text())
                p.locator('.today-need [data-today-myplan]').first.click(); p.wait_for_timeout(300); mp = p.locator('[data-hrl-myplan]')
                own = mp.locator('input[data-hrl-tick]:not([disabled])')
                check('only own tasks can be ticked by the employee', own.count() >= 1 and mp.locator('input[data-hrl-tick][disabled]').count() >= 1)
                own.first.check(); p.wait_for_timeout(250)
                check('employee tick saved', any(t['done'] and t['done']['by'] == 'test_med' for t in state(p)['hrOnboarding']['test_med']['tasks']))
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'hr-lifecycle-{device}-{theme}.png')); c.close()
    finally:
        (OUT / 'hr-lifecycle-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

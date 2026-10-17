"""Chromium regression for the authorized stabilization branch, synthetic browser storage only."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = os.environ.get('GS_TEST_URL', (ROOT / 'index.html').as_uri())
ORIGIN = URL.split('/index.html')[0]
KEY = 'grupo_saude_v4_demo_2'
OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-stabilization-artifacts'))
OUT.mkdir(parents=True, exist_ok=True)
rows = []
current = {}

def verify(name, condition):
    rows.append({**current, 'case': name, 'state': 'Aprovada' if condition else 'Falhou'})
    assert condition, name

def open_group(page, title):
    group = page.locator(f'details[data-nav-group="{title}"]')
    if not group.evaluate('(g)=>g.open'):
        group.locator('summary').click()

def stored(page):
    return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', KEY)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        for actor in ['u1', 'test_admin', 'test_adm', 'test_med', 'test_tec', 'test_call']:
            for device, width, height in [('desktop', 1280, 900), ('tablet', 820, 1100), ('mobile', 390, 844)]:
                for theme in ['light', 'dark']:
                    current = {'profile': actor, 'device': device, 'theme': theme}
                    context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
                    context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(ORIGIN + '/') else route.abort())
                    page = context.new_page()
                    page.set_default_timeout(10000)
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.on('dialog', lambda dialog: dialog.accept())
                    page.goto(URL)
                    page.wait_for_function('window.WorkspaceShellV4 && window.CommunicationsV4 && window.HRSeparationV4')
                    page.evaluate('''([key, actor])=>{
                      const s=JSON.parse(localStorage.getItem(key));s.candidates=[];s.currentUser=actor;s.ceoRealUser='u1';s.ceoViewingAs=actor==='u1'?null:actor;
                      for(const u of s.users){u.name='SYNTHETIC '+u.id;u.email=u.id+'@example.invalid';if(s.employees[u.id])s.employees[u.id].name=u.name;}
                      s.stabilizationMarker={preserve:'SYNTHETIC HISTORY'};localStorage.setItem(key,JSON.stringify(s));
                    }''', [KEY, actor])
                    page.reload()
                    page.wait_for_function('window.WorkspaceShellV4 && document.getElementById("themeToggle")')
                    page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
                    if width <= 760:
                        page.locator('#menuBtn').click()
                    verify('My RH has exactly one authorized navigation entry', page.locator('#nav [data-view="myhr"]').count() == 1 and page.evaluate('RoleAccessAdminV4.guard("myhr")'))
                    open_group(page, 'Área pessoal')
                    page.locator('#nav [data-view="myhr"]').click()
                    verify('My RH opens as an independent page with own identity', page.locator('#myhr').evaluate('(e)=>e.classList.contains("active")') and 'SYNTHETIC '+actor in page.locator('#myhrContent').inner_text())
                    verify('My RH does not use the shared modal', not page.locator('#modal').is_visible())
                    active = page.evaluate('document.querySelector(".view.active").id')
                    if width <= 760:
                        page.locator('#menuBtn').click()
                    for title in page.locator('details[data-nav-group]:not([hidden])').evaluate_all('(gs)=>gs.map(g=>g.dataset.navGroup)'):
                        open_group(page, title)
                        page.wait_for_function('document.querySelectorAll("details[data-nav-group][open]").length<=1')
                        verify('Opening group '+title+' keeps the selected page', page.evaluate('document.querySelector(".view.active").id') == active)
                    manager = actor in ['u1', 'test_admin']
                    verify('Management HR is restricted to the configured managers', page.evaluate('RoleAccessAdminV4.guard("hr")') == manager)
                    if manager:
                        open_group(page, 'Recursos Humanos')
                        page.locator('#shortcut_candidates').click()
                        page.wait_for_selector('.candidate-board')
                        verify('Candidates shortcut immediately renders all seven empty columns', page.locator('.candidate-column').count() == 7 and page.locator('.candidate-column').filter(has_text='Sem candidatos').count() == 7)
                        page.wait_for_timeout(250)
                        verify('Legacy renderers do not overwrite the candidate board', page.locator('.candidate-board').count() == 1)
                        cid = page.evaluate('CommunicationsV4.importCV({sourceId:"synthetic-stabilization",name:"SYNTHETIC CANDIDATE",email:"candidate@example.invalid"}).candidateId')
                        page.evaluate('V4ClinicHR.showCandidates()')
                        page.locator('[data-candidate-target]').select_option('Contactado')
                        page.locator('[data-candidate-move]').click()
                        c = next(c for c in stored(page)['candidates'] if c['id'] == cid)
                        verify('Tablet stage selector persists the transition and its history', c['stage'] == 'Contactado' and c['history'][-1]['action'].endswith(' → Contactado'))
                        history = len(c['history'])
                        page.locator('[data-candidate-move]').click()
                        verify('Repeating the same stage does not duplicate history', len(stored(page)['candidates'][0]['history']) == history)
                        if device == 'desktop':
                            page.locator('.candidate-card').drag_to(page.locator('.candidate-column[data-stage="Em análise"]'))
                            verify('Desktop drag uses the canonical transition and history', stored(page)['candidates'][0]['stage'] == 'Em análise')
                        old_stage = stored(page)['candidates'][0]['stage']
                        page.locator('[data-candidate-target]').select_option('Entrevista marcada')
                        page.locator('[data-candidate-move]').click()
                        verify('An interview without its required date does not change the record', stored(page)['candidates'][0]['stage'] == old_stage and page.locator('#modal').is_visible())
                        page.locator('#candidateInterview').fill('2026-10-20T10:30')
                        page.locator('#candidateSave').click()
                        verify('Completing the existing process form persists the interview', stored(page)['candidates'][0]['stage'] == 'Entrevista marcada')
                        page.locator('#modal').evaluate('(e)=>e.close()')
                        page.evaluate('V4ClinicHR.showCandidates()')
                        page.locator('[data-candidate-target]').select_option('Aprovado')
                        page.locator('[data-candidate-move]').click()
                        verify('Approval without its required decision result is refused', stored(page)['candidates'][0]['stage'] == 'Entrevista marcada')
                        page.locator('#candidateResult').fill('SYNTHETIC APPROVAL RESULT')
                        page.locator('#candidateSave').click()
                        verify('Authorized decision uses the existing process history', stored(page)['candidates'][0]['stage'] == 'Aprovado')
                        page.locator('#modal').evaluate('(e)=>e.close()')
                        employee = page.evaluate('(id)=>CommunicationsV4.convert(id)', cid)
                        page.evaluate('V4ClinicHR.showCandidates()')
                        verify('Converted candidates retain a visible process and history', page.locator('.candidate-history .candidate-card').count() == 1 and stored(page)['candidates'][0]['employeeId'] == employee and page.locator('.candidate-history [data-candidate-move]').count() == 0)
                    else:
                        verify('Direct candidate and HR access do not bypass permissions', page.evaluate('()=>{try{CommunicationsV4.candidates();return false}catch{return App.showView("hr")===false&&V4ClinicHR.showCandidates()===false}}'))
                    page.evaluate('document.getElementById("modal").close();App.showView("myhr")')
                    verify('Existing snapshot data is preserved', stored(page)['stabilizationMarker']['preserve'] == 'SYNTHETIC HISTORY')
                    verify('Layout contains its scrollable areas', page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                    page.screenshot(path=str(OUT / f'{actor}-{device}-{theme}.png'), full_page=True)
                    page.evaluate('CEOReservedAreaV4.select("test_med")')
                    page.evaluate('App.showView("myhr")')
                    verify('CEO simulation renders the effective profile only', 'SYNTHETIC test_med' in page.locator('#myhrContent').inner_text() and not page.evaluate('RoleAccessAdminV4.guard("hr")'))
                    verify('No browser exceptions', not errors)
                    context.close()
        browser.close()
finally:
    (OUT / 'results.json').write_text(json.dumps({'scope': 'Synthetic demo Chromium only; no real API/provider/database', 'cases': rows, 'passed': sum(r['state']=='Aprovada' for r in rows), 'failed': sum(r['state']=='Falhou' for r in rows)}, indent=2))
print(json.dumps({'passed': len(rows), 'contexts': 36, 'scope': 'synthetic demo only'}))

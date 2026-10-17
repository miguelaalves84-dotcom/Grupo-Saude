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
                        verify('Candidates shortcut immediately renders all five empty columns', page.locator('.candidate-column').count() == 5 and page.locator('.candidate-column').filter(has_text='Sem candidatos').count() == 5)
                        page.wait_for_timeout(250)
                        verify('Legacy renderers do not overwrite the candidate board', page.locator('.candidate-board').count() == 1)
                        cid = page.evaluate('CommunicationsV4.importCV({sourceId:"synthetic-stabilization",name:"SYNTHETIC CANDIDATE",email:"candidate@example.invalid"}).candidateId')
                        page.evaluate('V4ClinicHR.showCandidates()')
                        page.locator('[data-candidate-target]').select_option('Em análise')
                        page.locator('[data-candidate-move]').click()
                        c = next(c for c in stored(page)['candidates'] if c['id'] == cid)
                        verify('Tablet stage selector persists the transition and its history', c['stage'] == 'Em análise' and c['history'][-1]['action'].endswith(' → Em análise'))
                        history = len(c['history'])
                        page.locator('[data-candidate-move]').click()
                        verify('Repeating the same stage does not duplicate history', len(stored(page)['candidates'][0]['history']) == history)
                        if device == 'desktop':
                            page.locator('.candidate-card').drag_to(page.locator('.candidate-column[data-stage="Candidatos"]'))
                            verify('Desktop drag uses the canonical transition and history '+page.locator('.candidate-drag-status').inner_text(), stored(page)['candidates'][0]['stage'] == 'Candidatos')
                        old_stage = stored(page)['candidates'][0]['stage']
                        page.locator('[data-candidate-target]').select_option('Entrevista marcada')
                        page.locator('[data-candidate-move]').click()
                        verify('Interview movement opens mandatory form before changing the record', stored(page)['candidates'][0]['stage'] == old_stage and page.locator('#modal').is_visible())
                        page.locator('#candidateConfirmMove').click()
                        verify('Missing interview details do not move the candidate', stored(page)['candidates'][0]['stage'] == old_stage)
                        page.locator('#candidateInterview').fill('2026-10-20T10:30')
                        page.locator('#candidateMode').select_option('online')
                        page.locator('#candidateMeeting').fill('https://meet.example.invalid/synthetic')
                        page.locator('#candidateConfirmMove').click()
                        verify('Online interview persists with a pending notification, never fake sent', stored(page)['candidates'][0]['stage'] == 'Entrevista marcada' and stored(page)['candidates'][0]['notifications'][0]['status'] == 'PendingConfig')
                        page.locator('[data-candidate-target]').select_option('Recusado')
                        page.locator('[data-candidate-move]').click()
                        page.locator('#candidateConfirmMove').click()
                        verify('Rejection requires explicit confirmation', stored(page)['candidates'][0]['stage'] == 'Entrevista marcada')
                        page.locator('#candidateConfirm').check()
                        page.locator('#candidateConfirmMove').click()
                        verify('Confirmed rejection preserves notification history', stored(page)['candidates'][0]['stage'] == 'Recusado' and stored(page)['candidates'][0]['notifications'][-1]['kind'] == 'rejection')
                        page.locator('[data-candidate-target]').select_option('Contratado')
                        page.locator('[data-candidate-move]').click()
                        page.locator('#candidateConfirmMove').click()
                        verify('Hiring requires an explicit employee creation choice', stored(page)['candidates'][0]['stage'] == 'Recusado')
                        page.locator('input[name="candidateCreate"][value="no"]').check()
                        page.locator('#candidateConfirmMove').click()
                        verify('Hiring without employee preserves process and does not create access', stored(page)['candidates'][0]['stage'] == 'Contratado' and not stored(page)['candidates'][0].get('employeeId'))
                        page.locator('.candidate-card [data-gs-action="CommunicationsV4.candidate"]').click()
                        page.locator('#candidateName').fill('SYNTHETIC EDITED CANDIDATE')
                        page.locator('#candidateEmail').fill('edited@example.invalid')
                        page.locator('#candidatePhone').fill('912000000')
                        page.locator('#candidateRole').select_option(index=1)
                        page.locator('#candidateClinic').select_option(index=1)
                        page.locator('input[name="candidateCreate"][value="yes"]').check()
                        page.locator('#candidateSave').click()
                        verify('Employee creation opens prefilled confirmation form', page.locator('#candidateName').input_value() == 'SYNTHETIC EDITED CANDIDATE' and page.locator('#candidateCreateEmployee').is_visible())
                        page.locator('#candidateCreateEmployee').click()
                        verify('Converted candidate remains in the hired column with original history', stored(page)['candidates'][0].get('employeeId') and stored(page)['candidates'][0]['stage'] == 'Contratado' and page.locator('.candidate-board .candidate-card').count() == 1)
                        if actor == 'test_admin':
                            page.evaluate('''(key)=>{const s=JSON.parse(localStorage.getItem(key));s.userActionPermissions||={};s.userActionPermissions.test_admin={hrManage:false};localStorage.setItem(key,JSON.stringify(s));RoleAccessAdminV4.apply();document.dispatchEvent(new CustomEvent('gs:permissions-applied'));}''', KEY)
                            verify('Revoking management permission clears the candidate content immediately', not page.evaluate('RoleAccessAdminV4.guard("hr")') and not page.locator('#hrContent').inner_text().strip())
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

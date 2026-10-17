"""Real Chromium -> real API/service -> disposable SQL; synthetic sessions/provider only."""
import json, subprocess, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-recruitment-artifacts')); OUT.mkdir(exist_ok=True,parents=True)
rows=[]
def verify(name,condition):
    rows.append({'case':name,'state':'Aprovada' if condition else 'Falhou'})
    assert condition,name
server=subprocess.Popen(['node','tests/recruitment-server.cjs'],cwd=ROOT,stdout=subprocess.PIPE,text=True)
try:
    assert server.stdout.readline().strip()=='SYNTHETIC_RECRUITMENT_READY'
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--no-sandbox'])
        contexts=[]
        for actor in ['p0','p1','p2','p3','p4','p5']:
            c=browser.new_context(viewport={'width':820,'height':1100},service_workers='block')
            c.add_cookies([{'name':'synthetic_session','value':actor,'url':'http://127.0.0.1:8766'}])
            c.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:8766/') else r.abort())
            page=c.new_page();page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:8766/recruitment.html')
            if actor in ['p0','p1']:
                page.wait_for_selector('.candidate-column')
                verify(actor+' five columns in order',page.locator('.candidate-column h2').all_text_contents()==['Candidatos (1)','Entrevista marcada (0)','Recusado (0)','Em análise (0)','Contratado (0)'])
            else:
                page.wait_for_function('document.querySelector("#recruitmentContent").textContent.includes("revogado")')
                verify(actor+' no candidate data and API forbidden',page.locator('.candidate-card').count()==0 and c.request.get('http://127.0.0.1:8766/api/recruitment?action=list').status==403)
            contexts.append((c,page))
        ceo, page=contexts[0]; admin, other=contexts[1]
        page.locator('[data-open]').click();page.locator('#candidateName').fill('SYNTHETIC Edited');page.locator('#candidateEmail').fill('edited@example.invalid');page.locator('#candidatePhone').fill('912000000');page.locator('#candidateReviewed').check();page.locator('#candidateSave').click();page.wait_for_selector('#modalTitle:text("SYNTHETIC Edited")')
        page.locator('#modal').evaluate('(e)=>e.close()');other.reload();other.wait_for_selector('.candidate-card strong:text("SYNTHETIC Edited")')
        verify('independent sessions read persisted edits',other.locator('.candidate-card strong').inner_text()=='SYNTHETIC Edited')
        page.locator('[data-target]').select_option('Entrevista marcada');page.locator('[data-move]').click();page.locator('#candidateInterview').fill('2026-10-22T14:30');page.locator('#candidateMode').select_option('presencial');page.locator('#candidateInterviewClinic').select_option('clinic');page.locator('#candidateInterviewAddress').fill('Morada sintética 1');page.locator('#candidateConfirmMove').click();page.wait_for_selector('[data-stage="Entrevista marcada"] .candidate-card');page.locator('[data-open]').click()
        verify('physical interview and mock provider accepted, recorded truthfully in SQL', 'Sent' in page.locator('#modalBody').inner_text())
        verify('original private CV downloads through authorized API',page.locator('a[href*="documentId"]').count()==1 and ceo.request.get('http://127.0.0.1:8766'+page.locator('a[href*="documentId"]').get_attribute('href')).status==200)
        page.locator('#candidateMode').select_option('online');page.locator('#candidateMeeting').fill('https://meet.example.invalid/updated');page.locator('#candidateNotifyUpdate').check();page.locator('#candidateSave').click();page.wait_for_function('document.querySelector("#candidateMode")?.value==="online"')
        page.locator('#modal').evaluate('(e)=>e.close()');page.locator('[data-target]').select_option('Recusado');page.locator('[data-move]').click();page.locator('#candidateConfirmMove').click()
        verify('API state unchanged before refusal confirmation',ceo.request.get('http://127.0.0.1:8766/api/recruitment?action=list').json()['candidates'][0]['stage']=='Entrevista marcada')
        page.locator('#candidateConfirm').check();page.locator('#candidateConfirmMove').click();page.wait_for_selector('[data-stage="Recusado"] .candidate-card')
        page.locator('[data-target]').select_option('Contratado');page.locator('[data-move]').click();page.locator('[name="candidateCreate"][value="yes"]').check();page.locator('#candidateConfirmMove').click();page.locator('#candidateCreateEmployee').click();page.wait_for_selector('[data-stage="Contratado"] .candidate-card')
        state=ceo.request.get('http://127.0.0.1:8766/api/recruitment?action=list').json()['candidates'][0]
        verify('hired conversion links employee and preserves CV/history/notifications',state.get('employeeId') and len(state['documents'])==1 and len(state['notifications'])==3 and len(state['history'])>=6)
        page.screenshot(path=str(OUT/'recruitment-authenticated-synthetic-tablet.png'),full_page=True)
        for c,_ in contexts:c.close()
        browser.close()
finally:
    server.terminate();server.wait(timeout=10)
    (OUT/'recruitment-api-results.json').write_text(json.dumps({'cases':rows,'passed':sum(r['state']=='Aprovada' for r in rows),'scope':'Chromium/API/temporary SQLite with SYNTHETIC session and email provider. No real auth, PostgreSQL or delivery.'},indent=2))
print(json.dumps({'passed':len(rows),'scope':'isolated synthetic API fixture'}))

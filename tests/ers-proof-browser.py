"""Ficha do colaborador: «Carregar novo comprovativo» na cédula e na ERS, para cada função clínica (médico e técnico), em computador, tablet e telemóvel."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/ers-proof'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
def state(p):return p.evaluate('k=>JSON.parse(localStorage.getItem(k))',K)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for target in ['test_med','test_tec']:
   for device,w,h in [('desktop',1366,1000),('tablet',1280,800),('mobile',390,844)]:
    for field in ['hrERSProof','hrLicenseProof']:
     scope={'employee':target,'device':device,'field':field};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);p.on('dialog',lambda d:d.accept());p.goto(URL);p.wait_for_function('window.HRMasterV4&&window.EmployeeDocumentsV4');p.wait_for_timeout(400)
     p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoViewingAs=null;s.employeeDocuments={...(s.employeeDocuments||{}),[id]:[]};localStorage.setItem(k,JSON.stringify(s))}''',[K,target]);p.reload();p.wait_for_function('window.HRMasterV4&&window.EmployeeDocumentsV4');p.wait_for_timeout(400)
     p.evaluate('(id)=>HRMasterV4.open(id)',target);p.locator('.hr-subject > summary').filter(has_text='Dados profissionais').click()
     if field=='hrERSProof':p.select_option('#hrERS','yes')
     else:p.locator('#hrLicenseExpiry').fill('2027-11-24')
     btn=p.locator(f'.hr-proof-upload[data-proof-for="{field}"]')
     check('upload button visible next to the field',btn.count()==1 and btn.is_visible())
     check('both proof fields have their own button',p.locator('.hr-proof-upload').count()==2)
     btn.click();p.wait_for_selector('#employeeDocumentFile')
     p.locator('#employeeDocumentFile').set_input_files({'name':'SYN-proof.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nSYN PROOF\n%%EOF'});p.locator('[data-gs-action="EmployeeDocumentsV4.save"]').click()
     p.wait_for_function('([k,id])=>(JSON.parse(localStorage.getItem(k)).employeeDocuments[id]||[]).length>0',arg=[K,target])
     if p.locator('[data-gs-action="EmployeeDocumentsV4.back"]').count():p.locator('[data-gs-action="EmployeeDocumentsV4.back"]').first.click()
     p.wait_for_selector('#'+field)
     new_id=state(p)['employeeDocuments'][target][0]['id']
     check('new document selected automatically in the right field',p.locator('#'+field).input_value()==new_id)
     other='hrLicenseProof' if field=='hrERSProof' else 'hrERSProof'
     check('other field lists it but stays as it was',p.locator(f'#{other} option[value="{new_id}"]').count()==1 and p.locator('#'+other).input_value()=='')
     if field=='hrERSProof':p.locator('#hrERSDate').fill('2026-01-15');p.locator('#hrERSReference').fill('SYN-ERS-1')
     p.locator('[data-gs-action="HRMasterV4.save"]').first.click();p.wait_for_timeout(500)
     hr=state(p)['employees'][target]['hr'];saved=(hr.get('ers') or {}).get('documentId') if field=='hrERSProof' else hr.get('professionalLicenseProof')
     check('association saved',saved==new_id)
     if field=='hrLicenseProof':check('cédula uploaded with its type and the expiry from the record',state(p)['employeeDocuments'][target][0].get('validUntil')=='2027-11-24')
     check('no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
     if device=='tablet':p.screenshot(path=str(OUT/f'{target}-{field}.png'))
     c.close()
 finally:
  (OUT/'ers-proof-results.json').write_text(json.dumps(results,indent=2));b.close()

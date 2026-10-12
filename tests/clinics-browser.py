"""Synthetic clinic compliance and master-table permissions across six profiles."""
import os,json
from playwright.sync_api import sync_playwright,expect
KEY='grupo_saude_v4_demo_2'
ACTORS=['u1','test_admin','test_adm','test_call','test_med','test_tec']
PDF=b'%PDF-1.4\nsynthetic clinic fixture\n%%EOF'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ACTORS:
  c=browser.new_context(viewport={'width':1280,'height':900});page=c.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(os.environ['GS_TEST_URL']);page.wait_for_function('window.GSModuleDemo && window.ClinicDocumentsUIV4')
  page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;localStorage.setItem(key,JSON.stringify(s));}''',[KEY,actor]);page.reload();page.wait_for_function('window.GSModuleDemo && window.ClinicDocumentsUIV4')
  manager=actor in ['u1','test_admin'];has_docs=page.evaluate("RoleAccessAdminV4.guard('clinics')")
  assert page.evaluate('ClinicMasterV4.canManage()')==manager
  if not manager:
   assert page.evaluate("(()=>{try{ClinicMasterV4.create();return false}catch{return true}})()")
  if has_docs:
   page.evaluate("App.showView('clinics')")
   expect(page.locator('#cdClinic')).to_be_visible()
   assert page.locator('#clinicsContent .clinic-master-row').count()==0
   cid=page.locator('#cdClinic').input_value()
   count=int(page.locator('[data-clinic-count]').inner_text());assert count>=1
   page.locator('[data-cd-action="upload"]').first.click()
   page.locator('#cdFile').set_input_files({'name':'synthetic-license.pdf','mimeType':'application/pdf','buffer':PDF})
   page.locator('#cdIssued').fill('2026-10-12');page.locator('#cdExpiry').fill('2099-01-01');page.locator('#cdUploadSave').click()
   expect(page.get_by_text('Pendente de validação',exact=False)).to_be_visible()
   if manager:
    page.locator('[data-cd-action="decide"]').first.click();page.locator('#cdDecisionReason').fill('Validação sintética');page.locator('[data-cd-action="approve"]').click()
    expect(page.locator('#clinicsContent').get_by_text('Válido',exact=True)).to_be_visible()
    with page.expect_download() as downloaded:page.locator('[data-cd-action="download"]').first.click()
    assert open(downloaded.value.path(),'rb').read()==PDF
    page.locator('[data-cd-action="upload"]').first.click();page.locator('#cdFile').set_input_files({'name':'replacement.pdf','mimeType':'application/pdf','buffer':PDF+b'replacement'})
    page.locator('#cdIssued').fill('2026-10-12');page.locator('#cdExpiry').fill('2099-02-01');page.locator('#cdUploadSave').click()
    actual=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).clinicDocuments',KEY)
    assert any(x['status']=='Atual' and x['name']=='synthetic-license.pdf' for x in actual)
    page.locator('[data-cd-action="config"]').click();expect(page.locator('#cmName')).to_be_visible()
    page.locator('#modal .modal-head button').click();page.evaluate("ClinicMasterV4.render()")
    expect(page.locator('#clinicMasterTable')).to_be_visible()
    assert page.locator('#clinicsContent .clinic-master-row').count()==0
   else:assert page.locator('[data-cd-action="decide"]').count()==0
  else:
   assert page.evaluate("App.showView('clinics')") is False
  if actor!='u1':
   assert page.evaluate("GSModuleDemo.clinics().every(c=>GSModuleDemo.actor().clinics.includes(c.id))")
  assert not errors,(actor,errors)
  print(json.dumps({'profile':actor,'master_edit':manager,'documents':has_docs,'failed':0}))
  c.close()
 browser.close()

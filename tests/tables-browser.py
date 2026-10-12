"""Every canonical table destination, role guard and non-destructive catalogue integration."""
import os,json
from playwright.sync_api import sync_playwright,expect
KEY='grupo_saude_v4_demo_2'
ACTORS=['u1','test_admin','test_adm','test_call','test_med','test_tec','test_bas']
DEST={'catalog':'Catálogo Mestre de Documentos','contracts':'Tipos de contrato','specialties':'Especialidades por clínica','structure':'Clínicas · Especialidades · Profissionais','permissions':'Funções','email':'Email','calendars':'Calend'}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ACTORS:
  c=browser.new_context(viewport={'width':1280,'height':900});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(os.environ['GS_TEST_URL']);page.wait_for_function('window.DocumentCatalogV4 && window.GSModuleDemo');page.wait_for_timeout(700)
  page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;localStorage.setItem(key,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'));}''',[KEY,actor]);page.wait_for_timeout(100)
  manager=actor in ['u1','test_admin']
  if not manager:
   assert page.evaluate("TablesCanonicalV4.open()") is False
   for expression in ['DocumentCatalogV4.open()','ContractTypesV4.open()','TablesCanonicalV4.invoke("specialties")','ClinicCalendarsV4.open()']:
    assert page.evaluate('(expr)=>{try{eval(expr);return false}catch{return true}}',expression)
   assert page.locator('[data-table-action]:visible').count()==0
  else:
   page.evaluate('TablesCanonicalV4.open()');page.wait_for_timeout(200)
   keys=page.locator('#tablesContent > .cards > [data-table-key]').evaluate_all('(els)=>els.map(e=>e.dataset.tableKey)');assert len(keys)==len(set(keys))==9,keys
   for key in keys:
    page.evaluate('TablesCanonicalV4.open()');page.locator('[data-table-action="'+key+'"]').click();page.wait_for_timeout(50)
    if key=='clinics':expect(page.locator('#clinicMasterTable')).to_be_visible()
    elif key=='staff':expect(page.locator('#hr')).to_have_class('view active')
    else:
     expect(page.locator('#modal')).to_be_visible();title=page.locator('#modalTitle').inner_text();assert DEST[key].lower() in title.lower(),(key,title);
     if key=='structure':
      expect(page.get_by_role('button',name='Editar especialidades').first).to_be_visible();expect(page.get_by_role('button',name='Gerir médicos / técnicos').first).to_be_visible()
     page.locator('#modal .modal-head button').click()
   page.evaluate('TablesCanonicalV4.open()');page.locator('[data-table-action="catalog"]').click();page.locator('[data-catalog-new]').click()
   form=page.locator('#documentCatalogForm');form.locator('[name="name"]').fill('Documento sintético');form.locator('[name="dateRule"]').select_option('inicio_validade');form.locator('[name="validityDays"]').fill('365');form.locator('[name="warningDays"]').fill('45');form.locator('[name="requirements"]').fill('Cópia assinada');form.locator('[type="submit"]').click()
   did=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).documentCatalog.find(d=>d.name==="Documento sintético").id',KEY);page.locator('#modal .modal-head button').click()
   page.locator('[data-table-action="contracts"]').click();page.locator('#ctNew').fill('Contrato sintético');page.get_by_role('button',name='Adicionar',exact=True).click();cid=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).contractTypes.find(c=>c.name==="Contrato sintético").id',KEY)
   row=page.locator('[data-contract="'+cid+'"]');row.locator('summary').click();row.locator('select').select_option(did);page.wait_for_timeout(50);row.locator('[data-gs-action="ContractTypesV4.required"]').uncheck()
   assert page.evaluate('([key,cid])=>JSON.parse(localStorage.getItem(key)).contractTypes.find(c=>c.id===cid).items[0].required',[KEY,cid]) is False
   page.locator('#modal .modal-head button').click()
   page.evaluate('''([key,cid,did])=>{const s=JSON.parse(localStorage.getItem(key));const u=s.users.find(x=>x.id==='test_tec');u.hr.contractType='Contrato sintético';s.employees.test_tec.hr.contractType='Contrato sintético';s.employeeDocuments.test_tec=[{id:'keep-file',masterDocumentId:did,name:'Documento sintético',status:'Validado',dataUrl:'data:application/pdf;base64,U1lOVEhFVElD',contractGenerated:true}];localStorage.setItem(key,JSON.stringify(s));HRMasterV4.open('test_tec');}''',[KEY,cid,did])
   expect(page.locator('#contractDocsChecklist')).to_contain_text('Documento sintético');expect(page.locator('#contractDocsChecklist')).to_contain_text('Cópia assinada')
   assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).employeeDocuments.test_tec.filter(d=>d.masterDocumentId==='+json.dumps(did)+').length',KEY)==1
   assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).employeeDocuments.test_tec.find(d=>d.id==="keep-file").status',KEY)=='Validado'
   page.locator('#modal .modal-head button').click();page.evaluate('TablesCanonicalV4.open()')
   for width in [820,390]:
    page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
  assert not errors,(actor,errors)
  print(json.dumps({'actor':actor,'destinations':9 if manager else 0,'unauthorized_denied':not manager,'failed':0}));c.close()
 browser.close()

"""Field census in real authorised forms. Mutations use disposable synthetic browser state only."""
from text_editing_helpers import *
import text_editing_helpers as H
import runpy
runpy.run_path(str(Path(__file__).parent/'text-fields-source.py'))
FREE='textarea,input'
scenes=[
 ('Pedido de consulta','app.js','App.openRequestForm()'),
 ('Candidatura manual','recruitment-ui-v4.js','RecruitmentV4.importForm()'),
 ('Tarefa','app.js','App.openTaskForm()'),
 ('Conversa','app.js','App.newConversation()'),
 ('Registo manual de ponto','attendance-ui-v4.js','AttendanceBookV4.manual()'),
 ('Correção de ponto','app.js','App.requestTimeCorrection()'),
 ('Ausência e documento','attendance-dashboard-v4.js','AttendanceV4.uploadForm()'),
 ('Ficha RH','hr-master-v4.js','HRMasterV4.open("test_med","dados")'),
 ('Criar clínica','clinic-master-v4.js','ClinicMasterV4.create()'),
 ('Editar clínica','clinic-master-v4.js','ClinicMasterV4.edit("abranfir")'),
 ('Catálogo de documentos','document-catalog-ui-v4.js','DocumentCatalogV4.edit()'),
 ('Tipos de contrato','contract-types-v4.js','ContractTypesV4.open()'),
 ('Campanha','marketing-ui-v4.js','MarketingUIV4.campaign()'),
 ('Publicação editorial','marketing-ui-v4.js','MarketingUIV4.post()'),
 ('Investimento de marketing','marketing-ui-v4.js','MarketingUIV4.expense("syn-writing-campaign")'),
 ('Objetivo de marketing','marketing-ui-v4.js','MarketingUIV4.target("goal")'),
 ('Contacto marketing','marketing-ui-v4.js','MarketingUIV4.lead("syn-writing-request")'),
 ('Recibo de vencimento','finance-ui-v4.js','await FinanceUIV4.open("payslips");document.querySelector("[data-fin-action=receipt-new]").click()'),
 ('Documento avulso','employee-documents-ui-v4.js','EmployeeDocumentsV4.upload("test_med",undefined,true,true)'),
 ('Fatura','finance-ui-v4.js','await FinanceUIV4.open("invoices");document.querySelector("[data-fin-action=invoice-new]").click()'),
 ('Nova caixa','finance-ui-v4.js','await FinanceUIV4.open("cash");document.querySelector("[data-fin-action=cash-new]").click()'),
 ('Novo produto','stock-ui-v4.js','StockUIV4.open("abranfir");document.querySelector("#stockContent [data-stock-action=product-save]").click()'),
 ('Fornecedor','stock-ui-v4.js','StockUIV4.open("abranfir");document.querySelector("[data-stock-action=tab][data-stock-id=suppliers]").click();document.querySelector("[data-stock-action=supplier-save]").click()'),
 ('Formação','hr-development-ui-v4.js','HRDevelopmentV4.open("test_med","training");document.querySelector("[data-development-action=form]").click()'),
 ('Equipamento','hr-development-ui-v4.js','HRDevelopmentV4.open("test_med","equipment");document.querySelector("[data-development-action=form]").click()'),
 ('Despesa ou deslocação','hr-development-ui-v4.js','HRDevelopmentV4.open("test_med","expenses");document.querySelector("[data-development-action=form]").click()')]
scene_results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  c=b.new_context(viewport={'width':820,'height':1180},has_touch=True,is_mobile=True,locale='pt-PT',permissions=['clipboard-read','clipboard-write'],service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(7000);alerts=[];p.on('dialog',lambda d:(alerts.append(d.message),d.accept()));p.goto(URL);p.wait_for_function('window.GSTestAgentV4?.ready===true')
  p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));GSDemoClinicAssociations.repair(s);s.currentUser='u1';s.ceoViewingAs=null;for(const x of [...s.users,...Object.values(s.employees||{})]){x.name='SYN '+x.id;x.email=x.id+'@example.invalid'}s.candidates=[];s.clinics.find(x=>x.id==='abranfir').address='Rua Sintética';s.marketing||={};s.marketing.campaigns=[{id:'syn-writing-campaign',revision:1,title:'SYN campanha',objective:'SYN objetivo',clinicIds:['abranfir'],specialty:'SYN especialidade',channel:'Website',audience:'Dados sintéticos',start:'2026-10-01',end:'2026-12-31',budgetCents:10000,owner:'u1',body:'SYN texto',status:'Rascunho',history:[]}];s.requests=[{id:'syn-writing-request',clinic:'abranfir',patientRef:'SYN-REF',name:'SYN nome',specialty:'SYN especialidade',created:'2026-10-24T10:00:00Z',stage:'Novo pedido',history:[]}];localStorage.setItem(k,JSON.stringify(s))}''',K);fixture=p.evaluate('(k)=>localStorage.getItem(k)',K)
  for title,source,opener in scenes:
   H.scope={'actor':'u1','device':'tablet','theme':'light','scene':title,'sourceFile':source};p.evaluate('([k,s])=>localStorage.setItem(k,s)',[K,fixture]);p.reload();p.wait_for_function('window.GSTestAgentV4?.ready===true');alerts.clear()
   try:p.evaluate('async()=>{'+opener+'}')
   except Exception as error:
    results.append({**H.scope,'case':'Abrir formulário existente','passed':False});scene_results.append({**H.scope,'status':'Falhou ao abrir','error':str(error)[:1800]});continue
   p.wait_for_timeout(100);dialogs=p.locator('dialog[open]')
   if not dialogs.count():
    scene_results.append({**H.scope,'status':'Não exercitado: formulário não aberto','feedback':alerts});continue
   root=dialogs.last;entry_count=len(fields)
   # Open each existing subject without removing controls or creating a parallel form.
   details=root.locator('details').all();panels=[None]+[i for i,d in enumerate(details) if d.locator(FREE).count()]
   visited=set()
   for panel in panels:
    if panel is not None:
     d=root.locator('details').nth(panel)
     if not d.evaluate('(e)=>e.open'):d.locator(':scope > summary').click()
    inputs=root.locator(FREE)
    for index in range(inputs.count()):
     f=inputs.nth(index)
     if not f.is_visible() or f.evaluate('(e)=>e.tagName!=="TEXTAREA"&&!["text","search","email","tel","url","password","number"].includes(e.type)'):continue
     meta=f.evaluate('(e)=>({id:e.id,name:e.name,type:e.type})');key=meta['id'] or meta['name']+'|'+str(index)
     if key in visited:continue
     visited.add(key)
     try:H.exercise(p,f,c.new_cdp_session(p),ime=False)
     except Exception as error:
      if not results or results[-1].get('passed') is not False:results.append({**H.scope,'case':'Escrita no campo '+key,'passed':False})
      if fields and fields[-1].get('scene')==title:fields[-1]['automated']='Falhou — ver diagnóstico'
      scene_results.append({**H.scope,'status':'Falha durante escrita','field':key,'error':str(error)[:1800]});break
   scene_results.append({**H.scope,'status':'Campos exercitados' if len(fields)>entry_count else 'Sem campo de escrita livre editável nesta abertura','fields':len(fields)-entry_count,'feedback':alerts});close(p)
  c.close()
 finally:
  b.close();(OUT/'text-fields-results.json').write_text(json.dumps({'checks':results,'fields':fields,'scenes':scene_results,'limitations':['Runtime census is limited to the forms explicitly opened; source inventory retains unexercised definitions.','Physical Android keyboard, autocorrection and touch paste remain pending for every field.','Numeric input editing was tested without assuming a physical Portuguese decimal keyboard.']},ensure_ascii=False,indent=2))
assert all(x['passed'] for x in results),'Existing form/typing failures remain; inspect text-fields-results.json'
print(json.dumps({'checks':len(results),'failed':sum(not x['passed'] for x in results),'fieldInstances':len(fields),'scenes':len(scene_results)}))

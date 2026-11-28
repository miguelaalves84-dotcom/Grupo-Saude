"""Documentos do colaborador: separadores só com os documentos exigidos pelo contrato e pela função (+ Todos e Outros)."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/docs-tabs'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  scope={'device':'desktop'};c=b.new_context(viewport={'width':1366,'height':1000},service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
  p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.EmployeeDocumentsV4')
  p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_tec';s.ceoViewingAs='test_tec';s.masterDocuments=[{id:'syn-cc',name:'SYN Cartão de Cidadão',active:true,required:true},{id:'syn-ced',name:'SYN Cédula',active:true,required:true},{id:'syn-crim',name:'SYN Registo criminal',active:true,required:true}];s.documentCatalog=s.masterDocuments;s.jobRoles=[{id:'syn-fisio',name:'SYN Fisioterapeuta',active:true},{id:'syn-rec',name:'SYN Receção',active:true}];s.contractTypes=[{id:'syn-ct',name:'SYN Contrato',active:true,items:[{id:'a',masterDocumentId:'syn-cc',catalogId:'syn-cc',required:true},{id:'b',masterDocumentId:'syn-ced',catalogId:'syn-ced',required:true,roles:['syn-fisio']},{id:'c',masterDocumentId:'syn-crim',catalogId:'syn-crim',required:true,roles:['syn-rec']}]}];for(const u of [...s.users,...Object.values(s.employees||{})])if(u.id==='test_tec'){u.professionId='syn-fisio';u.hr={...(u.hr||{}),contractType:'SYN Contrato'}}s.employeeDocuments={test_tec:[]};localStorage.setItem(k,JSON.stringify(s))}""",K)
  p.reload();p.wait_for_function('window.EmployeeDocumentsV4');p.wait_for_timeout(500);p.evaluate("EmployeeDocumentsV4.open('test_tec')");p.wait_for_selector('#modal[open] .doc-tabs')
  tabs=[x.strip() for x in p.locator('[data-doc-tab]').all_inner_texts()]
  check('separadores: Todos, CC, Cédula (da função), Outros — sem Registo criminal (é de outra função)',tabs==['Todos','SYN Cartão de Cidadão','SYN Cédula','Outros'])
  p.locator('[data-doc-tab="SYN Cédula"]').click();p.wait_for_timeout(300);check('separador filtra a lista',p.locator('[data-doc-tab="SYN Cédula"]').get_attribute('class')=='active' and 'SYN Cartão de Cidadão' not in p.locator('#modalBody').inner_text().split('Os documentos')[-1])
  p.screenshot(path=str(OUT/'docs-tabs.png'));check('sem erros',not errs);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

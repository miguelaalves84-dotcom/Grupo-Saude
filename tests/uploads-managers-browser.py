"""Em todo o programa: um ficheiro carregado por um colaborador pode ser descarregado pela Administração e pelo CEO.
Cada módulo: carregamento real (ficheiro sintético) por quem o faz no dia a dia; depois, como Administração (test_admin)
e como CEO (u1), chama-se a mesma ação do botão «Descarregar/Abrir» e confirma-se que o ficheiro chega."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/uploads-managers'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
PDF=b'%PDF-1.4\nSYN FILE\n%%EOF'
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def close(p):p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);close(p)
def fetched(p,action):
 """Executa a ação do botão e devolve True se o ficheiro chegou (download, nova janela com data:, ou pré-visualização com blob)."""
 p.evaluate("window.__opened=[];window.open=(u)=>{window.__opened.push(String(u));return null};window.__alerts=[];window.alert=m=>window.__alerts.push(String(m))")
 try:
  with p.expect_download(timeout=5000) as d:p.evaluate(action)
  return d.value.suggested_filename or True
 except Exception:
  opened=p.evaluate("window.__opened");p.wait_for_timeout(1500);prev=p.locator('dialog[open] iframe[src^="blob:"],dialog[open] img[src^="blob:"],dialog[open] iframe[src^="data:"],dialog[open] img[src^="data:"],#modalBody a[href^="data:"],dialog[open] a[href^="blob:"]').count()
  if opened and opened[-1].startswith(('data:','blob:')):return 'janela'
  if prev:return 'pré-visualização'
  print('alerts',p.evaluate("window.__alerts"),p.evaluate("[...document.querySelectorAll('dialog[open]')].map(d=>d.id+':'+d.innerText.slice(0,200))"),p.evaluate("[...document.querySelectorAll('[role=status],.toast,.rhm-toast')].map(x=>x.innerText).join('|')"),flush=True);return False
MANAGERS=[('Administração','test_admin'),('CEO','u1')]
def run(name,setup):
 global scope
 with sync_playwright() as pw:
  b=pw.chromium.launch(args=['--no-sandbox'])
  try:
   c=b.new_context(viewport={'width':1366,'height':1000},service_workers='block',accept_downloads=True);c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);p.on('dialog',lambda d:(print('DIALOG',d.message,flush=True),d.dismiss()));p.goto(URL);p.wait_for_function('window.App&&window.EmployeeDocumentsV4');p.wait_for_timeout(800)
   p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));const ids=s.clinics.map(c=>c.id);for(const u of [...s.users,...Object.values(s.employees||{})])if(['test_admin','test_tec'].includes(u.id)){u.clinics=ids.slice();u.clinicIds=ids.slice()}localStorage.setItem(k,JSON.stringify(s))}",K);p.reload();p.wait_for_function('window.App&&window.EmployeeDocumentsV4');p.wait_for_timeout(600)
   action=setup(p)
   for label,uid in MANAGERS:
    scope={'module':name,'manager':label};become(p,uid);p.wait_for_timeout(300);got=fetched(p,action);check(f'{name}: {label} descarrega o ficheiro',got)
    if 'médico' in name:check(f'{name}: abertura por {label} fica na auditoria',any(x.get('action')=='Documento médico aberto' and x.get('userId')==uid for x in state(p).get('audit',[])))
  finally:b.close()

def employee_docs(p):
 actor='test_tec'
 p.evaluate('''([k,actor])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=actor;s.ceoViewingAs=actor;for(const x of [...s.users,...Object.values(s.employees||{})]){x.hr||={};x.hr.contractType='SYN Contract'}s.masterDocuments=[{id:'syn-license',name:'SYN Cédula',dateRule:'validade',active:true,required:true}];s.documentCatalog=s.masterDocuments;s.contractTypes=[{id:'syn-contract',name:'SYN Contract',items:[{id:'syn-item',masterDocumentId:'syn-license',required:true}]}];s.employeeDocuments={};s.employeeDocuments[actor]=[{id:'syn-required',masterDocumentId:'syn-license',name:'SYN Cédula',status:'Em falta',contractGenerated:true,required:true,employeeId:actor}];localStorage.setItem(k,JSON.stringify(s))}''',[K,actor]);p.reload();p.wait_for_function('window.EmployeeDocumentsV4&&window.HRSeparationV4');p.wait_for_timeout(800)
 p.evaluate("App.showView('myhr');HRSeparationV4.documents()");p.locator('[data-gs-action="EmployeeDocumentsV4.upload"]').first.click();p.locator('#employeeDocumentExpiry').fill('2027-12-31');p.locator('#employeeDocumentFile').set_input_files({'name':'SYN-license.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('[data-gs-action="EmployeeDocumentsV4.save"]').click();p.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).employeeDocuments.test_tec[0].status==="Pendente"',arg=K)
 return "EmployeeDocumentsV4.download('test_tec','syn-required')"

def as_employee(p,uid='test_tec'):become(p,uid);p.wait_for_timeout(300)
def absence_medical(p):
 as_employee(p);p.evaluate("App.showView('myhr');AttendanceV4.uploadForm()");p.locator('#avType').select_option('Baixa médica');p.locator('#avStart').fill('2026-11-02');p.locator('#avEnd').fill('2026-11-04');p.locator('#avFile').set_input_files({'name':'SYN-relatorio-medico.pdf','mimeType':'application/pdf','buffer':PDF});p.locator("#modal button.primary",has_text="Enviar para validação").click();p.wait_for_function('(k)=>(JSON.parse(localStorage.getItem(k)).employeeDocuments?.test_tec||[]).some(d=>/relatorio/.test(d.name||d.fileName||""))',arg=K)
 d=[x for x in state(p)['employeeDocuments']['test_tec'] if 'relatorio' in (x.get('name') or x.get('fileName') or '')][0]
 return f"AttendanceV4.openDoc('test_tec','{d['id']}')"
def sick_leave(p):
 as_employee(p);p.evaluate("App.showView('myhr');HRSeparationV4.sickLeave()");p.locator('#slType').select_option('Baixa');p.locator('#slStart').fill('2026-11-09');p.locator('#slEnd').fill('2026-11-10');p.locator('#slFile').set_input_files({'name':'SYN-CIT.pdf','mimeType':'application/pdf','buffer':PDF});p.locator("#modal button.primary",has_text="Enviar").click();p.wait_for_function('(k)=>(JSON.parse(localStorage.getItem(k)).leave||[]).some(x=>x.document?.name==="SYN-CIT.pdf")',arg=K)
 x=[x for x in state(p)['leave'] if (x.get('document') or {}).get('name')=='SYN-CIT.pdf'][0]
 return f"HRLeaveUIV4.open('{x['id']}')"
def clock_proof(p):
 as_employee(p);p.evaluate("App.showView('clock');AttendanceBookV4.manual()");p.locator('#attendanceManualType').select_option('Entrada');p.locator('#attendanceDate').fill('2026-11-19');p.locator('#attendanceTime').fill('09:00');p.locator('#attendanceReason').fill('SYN GPS indisponível');p.locator('#attendanceEvidence').set_input_files({'name':'SYN-proof.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('[data-gs-action="AttendanceBookV4.saveManual"]').click();p.wait_for_function('(k)=>(JSON.parse(localStorage.getItem(k)).timeOccurrences||[]).some(o=>o.evidence)',arg=K)
 o=[o for o in state(p)['timeOccurrences'] if o.get('evidence')][0]
 return f"AttendanceBookV4.proof('{o['id']}')"
def leave_proof(p):
 p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.leave=[{id:'syn-proof',employeeId:'test_tec',type:'Baixa',start:'2026-11-16',end:'2026-11-17',status:'Aprovado'}];localStorage.setItem(k,JSON.stringify(s))}""",K);as_employee(p);p.evaluate("HRLeaveUIV4.open('syn-proof')");p.locator('#leaveProofFile').set_input_files({'name':'SYN-proof.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('[data-leave-action="proof"]').click();p.wait_for_function('k=>JSON.parse(localStorage.getItem(k)).leave[0].document?.synthetic',arg=K)
 return "HRLeaveUIV4.open('syn-proof')"
def clinic_docs(p):
 import base64
 du='data:application/pdf;base64,'+base64.b64encode(PDF).decode()
 p.evaluate("""([k,du])=>{const s=JSON.parse(localStorage.getItem(k));s.masterDocuments=[...(s.masterDocuments||[]).filter(d=>d.id!=='syn-cd'),{id:'syn-cd',name:'SYN Licença clínica',active:true}];s.documentCatalog=s.masterDocuments;const c=s.clinics.find(c=>c.operational!==false&&c.id!=='administracao')||s.clinics[0];c.requiredDocuments=['syn-cd'];c.documents=[{masterDocumentId:'syn-cd',name:'SYN Licença clínica',fileName:'SYN-clinic.pdf',dataUrl:du,uploadedBy:'test_admin',uploadedAt:new Date().toISOString(),versions:[]}];localStorage.setItem(k,JSON.stringify(s))}""",[K,du])
 cid=[c for c in state(p)['clinics'] if c.get('documents')][0]['id']
 return f"ClinicMasterV4.documents('{cid}');document.querySelector('[data-clinic-doc-download]').click()"
def complaints(p):
 become(p,'test_adm');p.wait_for_timeout(300);p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.complaints=[];localStorage.setItem(k,JSON.stringify(s))}""",K);p.evaluate('App.showView("complaints");ComplaintsV4.refresh()');p.wait_for_timeout(400)
 p.locator('#complaintNew').click();p.locator('#complaintTitle').fill('SYN reclamação');p.locator('#complaintName').fill('SYN reclamante');p.locator('#complaintDescription').fill('SYN incidente');p.locator('#complaintReceived').fill('2026-11-19T10:00');cl=p.locator('#complaintClinic option').nth(1).get_attribute('value') or p.locator('#complaintClinic option').first.get_attribute('value');p.locator('#complaintClinic').select_option(cl);p.locator('#complaintInitialFiles').set_input_files({'name':'SYN-original.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('#complaintCreate').click();p.wait_for_selector('#complaintSave');close(p)
 cid=state(p)['complaints'][0]['id']
 return "App.showView('complaints');ComplaintsV4.open('"+cid+"');setTimeout(()=>{document.querySelector('[data-complaint-document]')?.click();setTimeout(()=>document.querySelector('[data-complaint-download]')?.click(),600)},600)"
def recruitment_cv(p):
 become(p,'test_admin');p.wait_for_timeout(300);p.evaluate("App.showView('recruitment');RecruitmentV4.importForm()");p.wait_for_timeout(300)
 p.locator('#candidateName').fill('SYN Candidata');p.locator('#candidateEmail').fill('syn.candidata@example.com')
 p.locator('#cvSource').fill('SYN-origem-'+str(id(p))) if p.locator('#cvSource').evaluate('e=>e.tagName')=='INPUT' else None
 for sel in ['#candidateRole','#candidateClinic']+(['#cvSource'] if p.locator('#cvSource').evaluate('e=>e.tagName')=='SELECT' else []):
  v=p.locator(sel+' option').evaluate_all("o=>o.map(x=>x.value).filter(Boolean)");p.locator(sel).select_option(v[1] if len(v)>1 else v[0])
 p.locator('#cvFile').set_input_files({'name':'SYN-CV.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('#cvImport').click();p.wait_for_function('k=>(JSON.parse(localStorage.getItem(k)).candidates||[]).some(c=>c.name==="SYN Candidata")',arg=K);close(p)
 c=[c for c in state(p)['candidates'] if c['name']=='SYN Candidata'][0]
 return f"RecruitmentV4.candidate('{c['id']}')"
def finance_invoice(p):
 become(p,'test_med');p.reload();p.wait_for_function('window.App&&window.V4Finance');p.wait_for_timeout(700)
 p.evaluate("App.showView('finance')");p.wait_for_timeout(700);p.evaluate("document.querySelector('[data-fin-action=invoices]')?.click()");p.wait_for_timeout(700);p.locator('[data-fin-action="invoice-new"]').click();form=p.locator('#financeDialog form');form.locator('[name=number]').fill('SYN-FT-1');form.locator('[name=value]').fill('75.25');form.locator('[name=document]').set_input_files({'name':'SYN-fatura.pdf','mimeType':'application/pdf','buffer':PDF});form.locator('[type=submit]').click();p.wait_for_timeout(600)
 inv=[x for x in state(p)['financeV2']['invoices'] if x.get('number')=='SYN-FT-1'][0];
 did=inv.get('documentId') or inv.get('document',{}).get('id') or inv['id']
 return "App.showView('finance');setTimeout(()=>{document.querySelector('[data-fin-action=invoices]')?.click();setTimeout(()=>{const b=document.querySelector('[data-fin-action=download][data-id=\""+did+"\"]')||document.querySelector('[data-fin-action=document][data-id=\""+did+"\"]');b?b.click():console.log('NO BUTTON')},900)},900)"
def cash_doc(p):
 p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.clinics=[{id:'syn-cash',name:'SYN Caixa',active:true}];for(const u of [...s.users,...Object.values(s.employees||{})]){u.clinics=['syn-cash'];u.clinicIds=['syn-cash'];u.clinic='syn-cash';u.clinicId='syn-cash'}s.cash=[{clinic:'syn-cash',date:'2026-10-01',total:100,card:25,due:75,deposited:null,status:'A aguardar depósito'}];s.days={};s.financeV2={invoices:[],payslips:[],entries:[],events:[]};s.finance={movements:[]};localStorage.setItem(k,JSON.stringify(s))}""",K)
 become(p,'test_adm');p.reload();p.wait_for_function('window.FinanceUIV4&&window.GSFinanceCash');p.wait_for_timeout(700);p.evaluate("App.showView('finance');FinanceUIV4.open('cash')");p.wait_for_timeout(900)
 p.locator('[data-fin-action="cash-edit"]').first.click();p.locator('#cashForm [name=deposited]').fill('75');p.locator('#cashForm [name=depositDate]').fill('2026-10-23');p.locator('#cashForm [name=document]').set_input_files({'name':'SYN-deposito.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('#cashForm button[type=submit]').click();p.wait_for_timeout(800);close(p)
 return "App.showView('finance');FinanceUIV4.open('cash');setTimeout(()=>{document.querySelector('[data-fin-action=cash-attachments]')?.click();setTimeout(()=>document.querySelector('[data-fin-action=cash-download]')?.click(),900)},1200)"
def candidate_docs(p):
 p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.candidates=[...(s.candidates||[]).filter(c=>c.id!=='syn-cand'),{id:'syn-cand',name:'SYN Contratada',email:'syn.c@example.com',role:(s.jobRoles||[])[0]?.id||'r',clinic:(s.clinics||[])[1]?.id||'c',contract:'ct1',stage:'Contratado',employeeId:'test_tec',documents:[{itemId:'i1',name:'Contrato assinado',required:true,status:'Em falta'}],history:[]}];localStorage.setItem(k,JSON.stringify(s))}""",K)
 become(p,'test_adm');p.reload();p.wait_for_function('window.App');p.wait_for_timeout(600)
 if not p.evaluate("RoleAccessAdminV4.can('hrManage')"):become(p,'test_admin');p.wait_for_timeout(300)
 p.evaluate("App.openCandidate('syn-cand')");p.locator('#doc_0').set_input_files({'name':'SYN-contrato.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('#modalBody button',has_text='Enviar').first.click();p.wait_for_function('k=>JSON.parse(localStorage.getItem(k)).candidates.find(c=>c.id==="syn-cand").documents[0].dataUrl',arg=K);close(p)
 return "App.downloadCandidateDocument('syn-cand',0)"

MODULES={'Documentos do candidato contratado':candidate_docs,'Comprovativo de depósito (caixas)':cash_doc,'Faturas (Financeiro)':finance_invoice,'Currículo (recrutamento)':recruitment_cv,'Reclamações':complaints,'Comprovativo de baixa (48 h)':leave_proof,'Documentos da clínica':clinic_docs,'Documentos pessoais (RH)':employee_docs,'Relatório médico (ausências)':absence_medical,'Baixa / justificação':sick_leave,'Comprovativo do livro de ponto':clock_proof}
import sys
only=sys.argv[1:]
for n,f in MODULES.items():
 if only and not any(o in n for o in only):continue
 run(n,f)
(OUT/'uploads-managers-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

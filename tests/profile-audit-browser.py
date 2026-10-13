"""Explicit results per action; navigation/binding never implies a complete module approval."""
import os,json,csv,time,traceback,base64
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
KEY='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/artifacts'));OUT.mkdir(parents=True,exist_ok=True)
ACTORS={'u1':'CEO','test_admin':'Administração','test_adm':'Administrativo','test_med':'Médico','test_tec':'Técnico','test_call':'Call Center'}
MANAGERS={'u1','test_admin'}
VIEWS={'dashboard':'dashboard','operation':'operation','wait':'waiting','chat':'personal','hr':'hrManage','tasks':'clinicTasks','audit':'audit','clinics':'clinics','stock':'stockRead','reports':'reports','marketing':'marketing','alerts':'alerts','security':'security','tables':'settings','clock':'clock'}
rows=[];current={}
def record(module,action,expected,fn,layer='UI'):
 try:
  result=fn();state='Aprovada';detail=str(result) if result is not None else 'Resultado e estado verificados'
 except Exception as e:
  state='Falhou';detail=str(e)[:1200]
  try:
   active_page.evaluate('document.getElementById("modal")?.close();document.getElementById("financeDialog")?.close()');switch(active_page,current['actor'])
  except Exception:pass
 rows.append({**current,'module':module,'functionality':action,'expected_permission':expected,'effective_result':detail,'state':state,'layer':layer})
 return state=='Aprovada'
def pending(module,action,state,detail):rows.append({**current,'module':module,'functionality':action,'expected_permission':'Dependência externa ou funcionalidade ausente','effective_result':detail,'state':state,'layer':'Integração real'})
def check(value,message='Resultado diferente do esperado'):
 assert value,message
 return 'Confirmado'
def fixture(page,actor):
 return page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k)),cs=s.clinics.filter(c=>c.active!==false&&!c.legacyDemo&&!c.virtual&&c.operational!==false);const ids=cs.slice(0,3).map(c=>c.id);for(const u of s.users.filter(u=>['u1','test_admin','test_adm','test_call','test_med','test_tec'].includes(u.id))){const scope=u.id==='u1'?ids:['test_admin','test_call'].includes(u.id)?ids.slice(0,2):ids.slice(0,1);u.clinics=scope;if(s.employees[u.id]){s.employees[u.id].clinics=scope;s.employees[u.id].hr={...s.employees[u.id].hr,vacationDays:22};}}s.users.push({id:'audit_forbidden',name:'SYNTHETIC OUTSIDE CLINIC',email:'outside@example.invalid',role:'TECNICO/A',active:true,clinics:[ids[2]],hr:{reservedAccess:true}});s.employees.audit_forbidden=s.users.at(-1);s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.leave=[];s.stockLedgers={};s.financeV2={invoices:[],payslips:[],entries:[],events:[]};s.employeeDocuments={};s.userActionPermissions={};localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'));return ids;}''',[KEY,actor])
def switch(page,actor):page.evaluate('(a)=>CEOReservedAreaV4.select(a===\'u1\'?\'__CEO__\':a)',actor)
def flows(page,actor,ids):
 a,b,c=ids;current['mode']='padrão';current['viewport']='desktop';current['theme']='light'
 record('Identidade','Alternância imediata sem reload e sem herdar privilégios','Perfil simulado',lambda:check(page.evaluate('(a)=>GSModuleDemo.actor().id===a',actor)))
 record('Clínicas','Isolamento: terceira clínica não atribuída','CEO global; outros recusados',lambda:check(page.evaluate('(c)=>AccessScopeV4.canClinic(c,"stockRead")',c)==(actor=='u1')))
 record('Clínicas','Associação a várias clínicas','CEO/Administração/Call Center em A+B',lambda:check(page.evaluate('(b)=>GSModuleDemo.clinics().some(c=>c.id===b)',b)==(actor in ['u1','test_admin','test_call'])))
 record('RH','Ficha própria: pessoa e documentos corretos','personal',lambda:(page.evaluate('HRSeparationV4.myRH()'),check(page.locator('#modal').is_visible())))
 page.evaluate('document.getElementById("modal").close()')
 def financial_private():
  page.evaluate('''(k)=>{const s=JSON.parse(localStorage.getItem(k));s.financeV2.entries.push({id:'audit_secret_finance',employeeId:'audit_forbidden',date:'2026-10-12',type:'Consulta',description:'SYNTHETIC OUTSIDE CLINIC',valueCents:99900,status:'Aprovado'});localStorage.setItem(k,JSON.stringify(s));}''',KEY)
  data=page.evaluate('async()=>FinanceDemoV4.bootstrap()');check(any(x['id']=='audit_secret_finance' for x in data['entries'])==(actor=='u1'),'Movimento de outra clínica exposto')
 record('Financeiro','Conta corrente: isolamento financeiro por pessoa/clínica','account + clínica atribuída; CEO global',financial_private)
 def invoice_flow():
  page.locator('#shortcut_invoices').click();page.locator('[data-fin-action="invoice-new"]').click();f=page.locator('#financeDialog form');f.locator('[name="number"]').fill('AUDIT-'+actor);f.locator('[name="value"]').fill('21.30');f.locator('[name="document"]').set_input_files({'name':'synthetic.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nAUDIT-'+actor.encode()+b'\n%%EOF'});f.locator('[type="submit"]').click();page.wait_for_timeout(150)
  invoice=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).financeV2.invoices[0]',KEY);check(invoice['employeeId']==actor);return invoice['id']
 invoice_id=[]
 record('Faturas','Submissão por formulário e associação ao próprio','account',lambda:invoice_id.append(invoice_flow()))
 if invoice_id:
  switch(page,'u1');record('Faturas','Validação pelo CEO produz movimento e histórico','financeManage',lambda:page.evaluate('(id)=>FinanceDemoV4.call("invoice-decision",{id,revision:0,status:"Validada"})',invoice_id[0]));switch(page,actor)
  record('Faturas','Consulta da decisão e histórico pelo autor','account + proprietário',lambda:check(len(page.evaluate('(id)=>FinanceDemoV4.call("history",{kind:"invoice",id})',invoice_id[0]))>=2))
 page.evaluate('document.getElementById("financeDialog")?.close()')
 def receipt_flow():
  switch(page,'u1');data={'employeeId':actor,'year':2026,'month':10,'documentDate':'2026-10-12','document':{'name':'synthetic-payslip.pdf','dataUrl':'data:application/pdf;base64,'+base64.b64encode(b'%PDF-1.4\nSYNTHETIC PAYSLIP '+actor.encode()+b'\n%%EOF').decode()}}
  rec=page.evaluate('(b)=>FinanceDemoV4.call("receipt-upload",b)',data);page.evaluate('(r)=>FinanceDemoV4.call("receipt-associate",{id:r.id,revision:0,employeeId:r.employeeId,year:r.year,month:r.month,documentDate:r.documentDate,confirmed:true})',rec);switch(page,actor);check(page.evaluate('(id)=>FinanceDemoV4.call("document",{id})',rec['documentId'])['dataUrl'].startswith('data:application/pdf'));page.evaluate('(id)=>FinanceDemoV4.call("receipt-read",{id})',rec['id']);check(page.evaluate('(id)=>FinanceDemoV4.bootstrap().then(d=>d.payslips.some(r=>r.id===id&&r.status==="Validada"))',rec['id']))
 record('Recibos de vencimento','Associação CEO → disponibilidade ao autor → ficheiro → leitura','financeManage / proprietário account',receipt_flow)
 for status in ['Aprovado','Recusado']:
  def leave_flow(status=status):
   page.evaluate('HRSeparationV4.sickLeave()');page.locator('#slStart').fill('2026-11-16' if status=='Aprovado' else '2026-11-17');page.locator('#slEnd').fill('2026-11-16' if status=='Aprovado' else '2026-11-17');page.locator('#slNote').fill('Pedido sintético '+status);page.get_by_role('button',name='Enviar',exact=True).click();page.wait_for_timeout(80);req=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).leave[0]',KEY);check(req['status']=='Pendente');switch(page,'u1');check(page.evaluate('(id)=>AttentionUIV4.items().some(x=>x.kind==="leave"&&x.entityId===id)',req['id']));page.evaluate('(id)=>HRLeaveUIV4.open(id)',req['id']);page.locator('#leaveDecisionNote').fill('Decisão sintética');page.locator('[data-leave-action="'+('approve' if status=='Aprovado' else 'reject')+'"]').click();switch(page,actor);page.evaluate('(id)=>HRLeaveUIV4.open(id)',req['id']);check(status in page.locator('#modalBody').inner_text());check(page.evaluate('(id)=>HRLeaveV4.read().audit.some(x=>x.recordId===id||x.leaveId===id||x.entityId===id)',req['id']) or 'Histórico' in page.locator('#modalBody').inner_text());note=page.evaluate('(id)=>AttentionUIV4.items().find(x=>x.kind==="leave-decision"&&x.entityId===id)',req['id']);check(note is not None,'Decisão não notificada ao autor');page.evaluate('(id)=>AttentionUIV4.ack(id)',note['id']);check(not page.evaluate('(id)=>AttentionUIV4.items().some(x=>x.id===id)',note['id']));page.evaluate('document.getElementById("modal").close()')
  record('Baixas','Submissão → '+status+' → consulta/histórico → notificação resolvida','leaveRequest / CEO leaveApprove / autor',leave_flow)
 def vacations():
  page.evaluate('(a)=>HRLeaveUIV4.calendar(a)',actor);check(page.locator('#vacCalendarBody').count()==1);v=page.evaluate('(a)=>HRLeaveV4.createVacation(a,["2026-11-23"],"Auditoria sintética")',actor);check(v['employeeId']==actor);check(len(v['days'])==1)
 record('Férias','Calendário e criação com saldo e dias úteis validados','leaveRequest',vacations)
 page.evaluate('document.getElementById("modal").close()')
 def rh_scope():
  switch(page,'test_admin');s=page.evaluate('''([k,c])=>{const s=JSON.parse(localStorage.getItem(k));s.employeeDocuments.audit_forbidden=[{id:'forbidden_doc',employeeId:'audit_forbidden',status:'Pendente',name:'PRIVATE DOC',dataUrl:'data:application/pdf;base64,U1lOVEhFVElD'}];s.timeOccurrences.push({id:'forbidden_time',user:'audit_forbidden',clinic:c,status:'Pendente',type:'Entrada'});localStorage.setItem(k,JSON.stringify(s));return s;}''',[KEY,c]);check(not any(i['id'] in ['forbidden_doc','forbidden_time'] for i in page.evaluate('ApprovalsV4.items(HRLeaveV4.read())')));check(page.evaluate('ApprovalsV4.decide("doc","forbidden_doc","audit_forbidden","Aprovado")') is False);check(page.evaluate('ApprovalsV4.decide("time","forbidden_time","","Aprovado")') is False);switch(page,actor)
 record('Aprovações RH','Documento e ocorrência de clínica não autorizada recusados','Administração em A+B; C proibida',rh_scope)
 def employee_document():
  page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));s.employeeDocuments[a]=[{id:'audit_personal_doc',name:'SYNTHETIC PERSONAL DOCUMENT',required:true,status:'Em falta',employeeId:a}];localStorage.setItem(k,JSON.stringify(s));HRSeparationV4.uploadMissing('audit_personal_doc');}''',[KEY,actor]);page.locator('#missingDocFile').set_input_files({'name':'synthetic-personal.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nSYNTHETIC PERSONAL DOCUMENT\n%%EOF'});page.locator('#missingDocExpiry').fill('2099-01-01');page.get_by_role('button',name='Enviar para validação',exact=True).click();page.wait_for_timeout(40);check(page.evaluate('(a)=>HRLeaveV4.read().employeeDocuments[a][0].status',actor)=='Pendente');switch(page,'u1');check(page.evaluate('()=>ApprovalsV4.decide("doc","audit_personal_doc",'+json.dumps(actor)+',"Aprovado")') is True);switch(page,actor);page.evaluate('HRSeparationV4.documents()');check('Aprovado' in page.locator('#modalBody').inner_text());check(not page.evaluate('()=>AttentionUIV4.items().some(x=>x.kind==="document"&&x.entityId==="audit_personal_doc")'));page.evaluate('document.getElementById("modal").close()')
 record('Documentos RH','Upload efetivo → validação CEO → consulta própria → contador atualizado','personal / CEO hrManage+leaveApprove',employee_document)
 def simulated_clock():
  page.context.grant_permissions(['geolocation']);page.context.set_geolocation({'latitude':38.72,'longitude':-9.1,'accuracy':5});page.evaluate('''([k,a,u])=>{const s=JSON.parse(localStorage.getItem(k));s.clinics.find(c=>c.id===a).gps={lat:'38.72',lng:'-9.1',radius:50};delete s.users.find(p=>p.id===u).clinic;if(s.employees[u])delete s.employees[u].clinic;localStorage.setItem(k,JSON.stringify(s));App.showView('clock');App.confirmClock('Entrada','09:00');}''',[KEY,a,actor]);page.wait_for_function('(u)=>JSON.parse(localStorage.getItem("grupo_saude_v4_demo_2")).timeEntries.some(x=>String(x.user||x.userId||x.employeeId)===u)',arg=actor,timeout=2500);check(page.evaluate('(u)=>HRLeaveV4.read().timeEntries.some(x=>String(x.user||x.userId||x.employeeId)===u)',actor));return 'Coordenadas Chromium simuladas; não valida GPS físico'
 record('Livro de ponto','Entrada com geolocalização simulada produz marcação','clock + clínica + GPS sintético',simulated_clock)
 def chat():
  page.evaluate("App.showView('chat');App.newConversation()");page.locator('#convTitle').fill('AUDIT CHAT '+actor);target='test_med' if actor!='test_med' else 'test_tec';page.locator('[name="member"][value="'+target+'"]').check();page.get_by_role('button',name='Criar conversa',exact=True).click();page.locator('#chatMessage').fill('Mensagem sintética');page.evaluate('App.sendMessage()');conv=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).conversations.find(c=>c.title.startsWith("AUDIT CHAT"))',KEY);check(conv['messages'][-1]['from']==actor);switch(page,target);check(page.evaluate('(id)=>AttentionUIV4.items().some(x=>x.kind==="chat"&&x.entityId===id)',conv['messages'][-1]['id']));page.evaluate('(id)=>{App.showView("chat");App.selectConversation(id)}',conv['id']);check(not page.evaluate('(id)=>AttentionUIV4.items().some(x=>x.entityId===id)',conv['messages'][-1]['id']));switch(page,actor)
 record('Chat','Criar conversa → enviar → destinatário lê → contador resolve','personal + membro',chat)
 def stock():
  switch(page,'u1');page.evaluate('''(a)=>{GSModuleDemo.call('category-save',{clinicId:a,id:'audit_cat',name:'SYNTHETIC CATEGORY'});GSModuleDemo.call('product-save',{clinicId:a,id:'audit_product',name:'SYNTHETIC PRODUCT',reference:'AUDIT-P',unit:'un',categoryId:'audit_cat',minimum:4,maximum:100});GSModuleDemo.call('receive',{clinicId:a,productId:'audit_product',quantity:20,idempotencyKey:'audit_seed'});}''',a);switch(page,actor);page.evaluate('StockUIV4.open()');check(page.locator('#stockClinic').is_visible());req=page.evaluate('(a)=>GSModuleDemo.call("request-create",{clinicId:a,productId:"audit_product",quantity:2,reason:"Pedido sintético"})',a);check(req['requestedBy']==actor);switch(page,'u1');page.evaluate('([a,id])=>GSModuleDemo.call("request-decide",{clinicId:a,id,status:"Aprovado",reason:"Validado"})',[a,req['id']]);switch(page,actor);check(page.evaluate('([a,id])=>GSModuleDemo.call("stock",{clinicId:a}).requests.find(x=>x.id===id).status',[a,req['id']])=='Aprovado');note=page.evaluate('(id)=>AttentionUIV4.items().find(x=>x.kind==="stock-decision"&&x.entityId===id)',req['id']);check(note is not None);page.evaluate('(id)=>AttentionUIV4.open(id)',note['id']);check(page.locator('#stockPanel').get_by_text('Aprovado',exact=False).count()>0);page.evaluate('(id)=>AttentionUIV4.ack(id)',note['id']);check(not page.evaluate('(id)=>AttentionUIV4.items().some(x=>x.id===id)',note['id']));check(page.evaluate('(c)=>{try{GSModuleDemo.call("stock",{clinicId:c});return true}catch{return false}}',c)==(actor=='u1'))
 record('Stock','Inventário → pedido → decisão → histórico/contador → isolamento','stockRead/Request + aprovação CEO',stock)
 record('Stock','Quantidade inválida não produz movimento','stockConsume permitido: validação; proibido: recusa',lambda:check(page.evaluate('(a)=>{const before=JSON.stringify(GSModuleDemo.read().stockLedgers);try{GSModuleDemo.call("consume",{clinicId:a,productId:"audit_product",quantity:-2,reason:"Inválido"})}catch{}return before===JSON.stringify(GSModuleDemo.read().stockLedgers)}',a)))
 record('Stock','Repetição de uma receção não duplica existências','idempotência',lambda:check(page.evaluate('(a)=>{const s=GSModuleDemo.read(),old=s.currentUser;s.currentUser="u1";s.ceoViewingAs=null;localStorage.setItem("grupo_saude_v4_demo_2",JSON.stringify(s));const before=JSON.stringify(GSModuleDemo.call("stock",{clinicId:a}).balances);GSModuleDemo.call("receive",{clinicId:a,productId:"audit_product",quantity:20,idempotencyKey:"audit_seed"});const result=before===JSON.stringify(GSModuleDemo.call("stock",{clinicId:a}).balances);CEOReservedAreaV4.select(old==="u1"?"__CEO__":old);return result}',a)))
 record('Notificações','Contador global coincide com assuntos autorizados','sem contagens herdadas',lambda:check(page.evaluate('()=>{AttentionUIV4.refresh();return true}') and page.evaluate('()=>{const n=AttentionUIV4.items().length,b=document.querySelector("#attentionToggle [data-attention-count]");return !!b&&b.textContent===(n>99?"99+":String(n))}')))
 def financial_pdf():
  page.locator('#shortcut_account').click();page.wait_for_timeout(80)
  with page.expect_download() as d:page.locator('[data-fin-action="pdf"]').click()
  check(Path(d.value.path()).read_bytes().startswith(b'%PDF-1.4'))
 record('Conta corrente','Exportação PDF efetiva','account',financial_pdf)
 page.evaluate('document.getElementById("modal")?.close();document.getElementById("financeDialog")?.close()')
 def operation():
  page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));s.opClinic=a;s.opDate='2026-10-12';s.opPhase='open';s.days={};s.tasks=[{id:'audit_daily_task',name:'SYNTHETIC DAILY TASK',active:true,required:true,phase:'live',role:'ADMINISTRATIVA',clinics:[a],fields:[]}];localStorage.setItem(k,JSON.stringify(s));App.showView('operation');}''',[KEY,a]);allowed=page.evaluate('RoleAccessAdminV4.can("openClinic")')
  if not allowed:
   before=page.evaluate('(k)=>JSON.stringify(JSON.parse(localStorage.getItem(k)).days)',KEY);page.evaluate('App.saveOpening()');check(before==page.evaluate('(k)=>JSON.stringify(JSON.parse(localStorage.getItem(k)).days)',KEY));return 'Abertura proibida: sem mutação'
  page.get_by_role('button',name='Guardar abertura',exact=True).click();check(page.evaluate('([k,a])=>JSON.parse(localStorage.getItem(k)).days["2026-10-12_"+a].open.saved',[KEY,a]));page.evaluate("App.setPhase('close')");page.get_by_role('button',name='Fechar dia e criar resumo',exact=True).click();check(page.locator('#modalTitle').inner_text()=='Fecho bloqueado');page.locator('#modal .modal-head button').click();page.evaluate("App.setTask('audit_daily_task','done')");page.get_by_role('button',name='Fechar dia e criar resumo',exact=True).click();check(page.evaluate('([k,a])=>JSON.parse(localStorage.getItem(k)).days["2026-10-12_"+a].closed',[KEY,a]));page.evaluate('document.getElementById("modal").close()')
 record('Operação Diária','Abertura → tarefa obrigatória bloqueia fecho → conclusão/resumo ou recusa sem mutação','openClinic/clinicTasks/closeClinic',operation)
 def requests():
  allowed=page.evaluate('RoleAccessAdminV4.can("waiting")')
  if not allowed:check(page.evaluate('()=>{try{V4Integrations.openRequest();return false}catch{return true}}'));return 'Pedido proibido'
  page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));s.masterSpecialties.push({id:'audit_spec',name:'SYNTHETIC SPECIALTY',active:true});s.clinicSpecialties[a]=['audit_spec'];localStorage.setItem(k,JSON.stringify(s));V4Integrations.openRequest();}''',[KEY,a]);check((c in page.locator('#miClinic').evaluate('(e)=>[...e.options].map(o=>o.value)'))==(actor=='u1'));page.locator('#miClinic').select_option(a);page.locator('#miName').fill('SYNTHETIC REQUEST');page.locator('#miPhone').fill('000000000');page.locator('#miNotes').fill('Synthetic only');page.get_by_role('button',name='Criar pedido',exact=True).click();page.wait_for_load_state('load');page.wait_for_function('window.AttentionUIV4');req=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).requests.find(r=>r.name==="SYNTHETIC REQUEST")',KEY);note=page.evaluate('(id)=>AttentionUIV4.items().find(x=>x.kind==="request"&&x.entityId===id)',req['id']);check(note is not None);page.evaluate('(id)=>AttentionUIV4.open(id)',note['id']);check(page.locator('#modalTitle').inner_text()=='SYNTHETIC REQUEST','Notificação abriu novo pedido em vez do existente');page.locator('#editStage').select_option('Marcado');page.locator('#requestResult').fill('Confirmado em auditoria');page.get_by_role('button',name='Guardar ação',exact=True).click();check(page.evaluate('(id)=>!AttentionUIV4.items().some(x=>x.kind==="request"&&x.entityId===id)',req['id']))
 record('Pedidos','Criar → abrir notificação correta → marcar → histórico/contador','waiting + clínica',requests)
 for module,action in [('Formação','Registos de formação'),('Equipamentos','Entrega/devolução de equipamentos'),('Despesas','Despesas e deslocações'),('Integração','UI autenticada ligada à persistência central multiutilizador'),('Chat','Sincronização real entre dispositivos')]:pending(module,action,'Não implementada','Interface parcial ou adapter local; não existe fluxo central operacional demonstrado')
 for module,action in [('Identidade','Fornecedor real, login, recuperação e revogação operacional'),('Ponto','GPS físico, precisão e raio em dispositivos reais'),('Email','Gmail/Microsoft, envio real e notificações de pagamentos'),('Arquivo','Scanner, backup externo e restauro operacional'),('Base de dados','Neon remoto com autenticação real')]:pending(module,action,'Não testável no ambiente demonstrativo','Exige fornecedor/serviço/dispositivo externo; nenhuma credencial ou dado real foi utilizado')

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for actor,profile in ACTORS.items():
   for size,width,height in [('desktop',1280,900),('tablet',820,900),('mobile',390,844)]:
    for theme in ['light','dark']:
     current={'profile':profile,'actor':actor,'viewport':size,'theme':theme,'mode':'padrão'}
     context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();active_page=page;errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(os.environ['GS_TEST_URL']);page.wait_for_function('window.GSModuleDemo && window.AttentionUIV4');page.wait_for_timeout(600);ids=fixture(page,actor);page.evaluate('(t)=>{document.documentElement.dataset.theme=t}',theme);page.wait_for_timeout(20)
     if size=='desktop' and theme=='light':flows(page,actor,ids)
     for mode in ['padrão','concessão','remoção']:
      current.update(mode=mode,viewport=size,theme=theme)
      page.evaluate('''([k,a,m])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.userActionPermissions={};if(a!=='u1'&&m!=='padrão')s.userActionPermissions[a]=Object.fromEntries(GSAccessPolicy.actions.map(([key])=>[key,m==='concessão']));localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:permissions-applied'));}''',[KEY,actor,mode]);page.wait_for_timeout(20)
      permissions=page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return {defaults:GSAccessPolicy.defaults(GSAccessPolicy.norm(GSModuleDemo.actor().role)),values:Object.fromEntries(GSAccessPolicy.actions.map(([k])=>[k,RoleAccessAdminV4.can(k)]))}}''')
      def expected(key):
       manager=actor in MANAGERS
       if key in ['dashboard','settings','hrManage','leaveApprove','financeManage','performanceManage','security','audit','reports'] and not manager:return False
       if actor=='u1':return True
       return mode=='concessão' or mode=='padrão' and key in permissions['defaults']
      for key,value in permissions['values'].items():record('Permissões',key,'Permitido' if expected(key) else 'Proibido',lambda key=key,value=value:check(value==expected(key)),layer='Política UI')
      for view,key in VIEWS.items():
       allowed=expected(key) or view=='operation' and any(expected(k) for k in ['openClinic','closeClinic','clinicTasks','bookings'])
       def nav(view=view,allowed=allowed):
        node=page.locator('#nav [data-view="'+view+'"]');check(node.count()==1,'Menu duplicado ou ausente');check(node.evaluate('(e)=>!e.hidden&&getComputedStyle(e).display!=="none"')==allowed,'Menu não atualizado imediatamente');beg=time.monotonic();actual=page.evaluate('(v)=>App.showView(v)',view);check((actual is not False)==allowed);check(time.monotonic()-beg<3,'Abertura acima de 3 segundos');
        if allowed:check(page.locator('#'+view).inner_text().strip()!='','Ecrã vazio')
       record(view,'Navegação imediata e conteúdo inicial (não aprovação do fluxo)','Permitido' if allowed else 'Proibido',nav)
      # Module shortcuts are independently checked because Finance intentionally has no data-view button.
      for shortcut,key in [('invoices','account'),('payslips','account'),('account','account'),('financialManagement','financeManage'),('vacations','leaveRequest'),('sickness','leaveRequest'),('documents','personal'),('permissions','settings')]:
       def shortcut_check(shortcut=shortcut,key=key):
        el=page.locator('#shortcut_'+shortcut);check(el.count()==1);check(el.evaluate('(e)=>!e.hidden')==expected(key));
        if expected(key):
         if size=='mobile' and not page.locator('body').evaluate('(e)=>e.classList.contains("menu-open")'):page.locator('#menuBtn').click()
         el.click(force=True);page.wait_for_timeout(15);check(page.locator('#modal[open],#financeDialog[open],.view.active').count()>0)
        page.evaluate('document.getElementById("modal")?.close();document.getElementById("financeDialog")?.close()')
       record('Navegação',shortcut+' — destino da entrada','Permitido' if expected(key) else 'Proibido',shortcut_check)
      record('Apresentação','Sem overflow horizontal',theme+' / '+size,lambda:check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')))
     if actor!='u1':
      current['mode']='remoção parcial'
      page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));s.userActionPermissions[a]={stockRead:false,stockConsume:true,stockRequest:true,account:false,financeManage:true,clinics:false,clinicDocumentsUpdate:true,personal:false};localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:permissions-applied'));}''',[KEY,actor]);page.wait_for_timeout(20)
      for key in ['stockConsume','stockRequest','financeManage','clinicDocumentsUpdate']:
       record('Permissões','Dependência revogada bloqueia '+key,'Proibido enquanto falta acesso base',lambda key=key:check(page.evaluate('(k)=>RoleAccessAdminV4.can(k)',key) is False),layer='Política UI')
      record('RH','Revogação pessoal fecha ficha e bloqueia consulta direta','personal=false',lambda:check(page.evaluate('''(a)=>{document.getElementById('modal').close();HRSeparationV4.myRH();HRMasterV4.open(a);return !document.getElementById('modal').open&&AccessScopeV4.canEmployee(a)===false;}''',actor)))
     current['mode']='inventário de controlos'
     # Connection inventory is a separate layer; a bound button is never proof of its business effect.
     if size=='desktop' and theme=='light':
      page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));delete s.userActionPermissions[a];localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:permissions-applied'));}''',[KEY,actor])
      for view,key in VIEWS.items():
       if not page.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):continue
       page.evaluate('(v)=>App.showView(v)',view)
       controls=page.locator('#'+view+' button').evaluate_all('''els=>els.map(e=>({label:e.textContent.trim(),action:e.dataset.gsAction||e.dataset.stockAction||e.dataset.cdAction||e.dataset.tableAction||e.getAttribute('onclick')||'',bound:typeof e.onclick==='function'||[...e.attributes].some(a=>/action|decision|attention|open-clinics|role-permissions/.test(a.name))||!!e.closest('form')||typeof e.parentElement?.onclick==='function'}))''')
       for control in controls:
        if not control['label']:continue
        record(view,'Ligação de botão: '+control['label']+' / '+control['action'][:80],'Callback/ação/formulário definido',lambda control=control:check(control['bound'],'Botão sem destino/handler detetado'),layer='Ligação de controlos (não aprovação do fluxo)')
     record('Runtime','Ausência de exceções Javascript','Sem erros',lambda:check(not errors,repr(errors)))
     if size=='desktop' and theme=='light':page.screenshot(path=str(OUT/('audit-'+actor+'.png')),full_page=True)
     context.close()
  browser.close()
finally:
 (OUT/'matrix-ui.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 with (OUT/'matrix-ui.csv').open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(rows[0]) if rows else []);writer.writeheader();writer.writerows(rows)
 summaries={}
 for profile in ACTORS.values():
  rs=[r for r in rows if r['profile']==profile];features={}
  for r in rs:
   key=(r['module'],r['functionality'],r['layer']);rank={'Aprovada':0,'Não testável no ambiente demonstrativo':1,'Não implementada':2,'Falhou':3}
   if key not in features or rank[r['state']]>rank[features[key]]:features[key]=r['state']
  summaries[profile]={'unique_functionality_checks':len(features),'executions':len(rs),'states':{s:list(features.values()).count(s) for s in ['Aprovada','Falhou','Não implementada','Não testável no ambiente demonstrativo']}}
 print('AUDIT_UI_SUMMARY '+json.dumps(summaries,ensure_ascii=False));failures=[r for r in rows if r['state']=='Falhou'];print('AUDIT_UI_FAILURES '+json.dumps(failures[:35],ensure_ascii=False))
 if failures:raise SystemExit(1)

"""Additional positive searches on canonical disposable fixtures, invoked by search-browser.py."""
from playwright.sync_api import expect

def verify_populated(p,actor,key,check,scope):
 p.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k)),cid=AccessScopeV4.clinics(s)[0]||'abranfir',at=new Date().toISOString();
 const other='syn-search-other';s.clinics.push({id:other,name:'SYN Outra clínica',active:true,operational:true,specialties:{}});
 for(const u of [...s.users,...Object.values(s.employees||{})]){u.name='SYN '+u.id;u.email=u.id+'@example.invalid';u.hr||={}}
 s.requests=[{id:'syn-positive-request',clinic:cid,name:'SYN Coração Águeda',patientRef:'SYN-CORAÇÃO',specialty:'SYN Consulta',created:at,stage:'Novo pedido',owner:a,doctor:'SYN Profissional',history:[]},{id:'syn-other-request',clinic:other,name:'SYN Exclusivo exterior',patientRef:'SYN-OUTSIDE',created:at,stage:'Novo pedido',owner:'u1',history:[]}];
 s.conversations=[{id:'syn-positive-chat',title:'SYN Conversa Mação',members:[a],messages:[]},{id:'syn-hidden-chat',title:'SYN Reservada Exterior',members:['syn-nonmember'],messages:[]}];
 s.alerts=[{id:'syn-positive-alert',title:'SYN Aviso Óbidos',module:'SYN Auditoria',to:a,createdAt:at,read:false},{id:'syn-hidden-alert',title:'SYN Alerta Exterior',module:'SYN',to:'syn-nonmember',createdAt:at}];
 s.employeeDocuments||={};s.employeeDocuments[a]=[{id:'syn-positive-doc',employeeId:a,name:'SYN Certificado Ílhavo',status:'Em falta',required:false}];
 s.timeEntries=[{id:'syn-positive-clock',user:a,clinic:cid,type:'Entrada',at:at.slice(0,10)+'T08:00:00Z',reason:'SYN Assiduidade Águeda'}];s.timeOccurrences=[];
 s.leave=[{id:'syn-positive-leave',employeeId:a,type:'Férias',start:'2026-12-21',end:'2026-12-22',status:'Pendente',createdAt:at,history:[]}];
 s.marketing||={};s.marketing.campaigns=[{id:'syn-positive-campaign',title:'SYN Campanha Évora',clinicIds:[cid],specialty:'',channel:'Website',status:'Rascunho',budgetCents:10000,expenses:[],history:[],start:'2026-01-01',end:'2026-12-31'}];
 s.financeV2={invoices:[{id:'syn-positive-invoice',employeeId:a,number:'SYN-FÁTURA-ÁGUEDA',date:at.slice(0,10),status:'Pendente',valueCents:1234,netCents:1234,vatCents:0,withholdingCents:0,uploadedBy:a,uploadedAt:at,revision:0}],payslips:[{id:'syn-positive-payslip',employeeId:a,year:2026,month:9,status:'Validada',netCents:1234,grossCents:1500,uploadedBy:'u1',uploadedAt:at,revision:0,fileName:'SYN-RECIBO-ÉVORA.pdf'}],entries:[],events:[],regularizations:[]};
 localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:state-changed'));App.renderAll()}''',[key,actor])
 def search(view,selector,term,field='.gs-search-input'):
  scope['view']='populated:'+view
  root=p.locator('#'+view);field='#chatSearch' if view=='chat' else field;p.evaluate('GSSearchV4.refresh()');f=root.locator(field);expect(f).to_be_visible();rows=root.locator(selector);expect(rows.first).to_be_visible();before=rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')
  f.fill(term);expect(rows.first).to_be_visible();check('populated positive accent search: '+selector,rows.evaluate_all('(xs)=>xs.some(x=>x.getClientRects().length)'))
  f.fill('zzzz-no-populated-result-728');expect(rows.first).not_to_be_visible();check('populated absent term: '+selector,rows.evaluate_all('(xs)=>xs.every(x=>!x.getClientRects().length)'))
  f.fill('');expect(rows.first).to_be_visible();check('populated clear restores: '+selector,rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')==before)
  check('populated search stays within viewport',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
 if p.evaluate('RoleAccessAdminV4.guard("clock")'):
  p.evaluate('App.showView("clock");AttendanceBookV4.render();GSSearchV4.refresh()');search('clock','[data-attendance-history] article.check','AGUEDA');search('clock','[data-attendance-history] article.check','ENTRADA')
 for view,selector,term in [('wait','.funnel-card:has-text("SYN Coração")','CORACAO'),('chat','.conversation:has-text("Mação")','MACAO'),('alerts','#alertsContent .row:has-text("Óbidos")','OBIDOS'),('myhr','#myhrContent .row:has-text("Ílhavo")','ILHAVO')]:
  scope['view']='populated:'+view
  if not p.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):
   check('populated forbidden route remains denied',p.evaluate('(v)=>App.showView(v)',view)==False);continue
  p.evaluate('(v)=>App.showView(v)',view)
  if view=='chat':p.evaluate('App.chatBack()')
  search(view,selector,term)
  if view=='wait' and not p.evaluate('(k)=>AccessScopeV4.canClinic("syn-search-other","waiting",JSON.parse(localStorage.getItem(k)))',key):check('unauthorised clinic request never rendered',p.locator('#waitContent .funnel-card').filter(has_text='Exclusivo exterior').count()==0)
  if view=='alerts':check('other recipient alert never rendered',p.locator('#alertsContent').get_by_text('SYN Alerta Exterior',exact=True).count()==0)
  if view=='chat' and actor!='u1':check('nonmember conversation never rendered',p.locator('#chatContent .conversation').filter(has_text='Reservada Exterior').count()==0)
 if p.evaluate('RoleAccessAdminV4.guard("marketing")'):
  p.evaluate('MarketingUIV4.selectTab("campaigns")');search('marketing','[data-campaign="syn-positive-campaign"]','EVORA')
  p.evaluate('MarketingUIV4.selectTab("leads")');search('marketing','[data-id="syn-positive-request"]','CORACAO')
  cid=p.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).requests.find(x=>x.id==="syn-positive-request").clinic',key);p.locator('#mkFilterClinic').select_option(cid);p.locator('#mkApply').click();search('marketing','[data-id="syn-positive-request"]','CORACAO');check('clinic filter excludes other-clinic marketing request',p.locator('[data-id="syn-other-request"]').count()==0)
 if p.evaluate('RoleAccessAdminV4.can("account")'):
  p.evaluate('async()=>await FinanceUIV4.open("invoices")');search('finance','[data-fin-row]:has-text("SYN-FÁTURA")','fatura-agueda','#financeSearch')
  p.evaluate('async()=>await FinanceUIV4.open("payslips")');search('finance','[data-fin-row]','2026','#financeSearch')
 scope['view']='populated:integrity'
 check('search did not delete canonical requests or documents',p.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));return s.requests.some(x=>x.id==='syn-positive-request')&&s.employeeDocuments[a].some(x=>x.id==='syn-positive-doc')&&s.financeV2.invoices.length===1&&s.conversations.length===2}''',[key,actor]))


def reproduce_clock_baseline(browser,url,origin,key,out):
 from pathlib import Path
 c=browser.new_context(viewport={'width':820,'height':1180},has_touch=True,is_mobile=True,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort());source=(Path(__file__).parent/'fixtures/global-search-before-attendance.js').read_text();c.route('**/global-search-v4.js',lambda r:r.fulfill(status=200,content_type='application/javascript',body=source));p=c.new_page();p.goto(url);p.wait_for_function('window.GSTestAgentV4?.ready===true')
 p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_med';s.ceoViewingAs='test_med';const cid=GSAttendanceCore.assigned(GSAttendanceCore.people(s).find(x=>x.id==='test_med'))[0];s.timeEntries=[{id:'syn-reproduce-clock',user:'test_med',clinic:cid,type:'Entrada',at:new Date().toISOString(),reason:'SYN Assiduidade Águeda'}];s.timeOccurrences=[];s.leave=[];localStorage.setItem(k,JSON.stringify(s));App.showView('clock');AttendanceBookV4.render();GSSearchV4.refresh()}''',key)
 row=p.locator('[data-attendance-history] article.check');expect(row).to_be_visible();field=p.locator('#clock .gs-search-input');field.fill('AGUEDA');expect(p.locator('#clock .gs-search-empty')).to_be_visible();expect(row).to_be_visible();field.fill('zzzz-no-clock-result');expect(row).to_be_visible();p.screenshot(path=str(out/'baseline-clock-record-not-indexed.png'));c.close();return {'source':'4405994 global search fixture','device':'tablet touch emulated','reproduced':['own history unindexed despite matching text','nonmatching own history remains visible'],'scope':'Original search component with current attendance domain, synthetic records; not a complete historical deployment'}

"""Actual Chromium → cookie auth → existing API → disposable PostgreSQL → UI, never a real provider."""
import os,json,time,subprocess,traceback,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/artifacts'));OUT.mkdir(parents=True,exist_ok=True)
ready=Path('/tmp/gs-central-ready.json');ready.unlink(missing_ok=True)
env={**os.environ,'GS_CENTRAL_READY_FILE':str(ready)};log=(OUT/'central-server.log').open('w')
proc=subprocess.Popen(['node',str(ROOT/'tests/central-server.cjs')],env=env,stdout=log,stderr=subprocess.STDOUT)
rows=[];current={}
def record(feature,fn):
 try:fn();state='Aprovada';detail='Browser, resposta e estado verificados'
 except Exception as e:state='Falhou';detail=str(e)[:1500];print('CENTRAL_FAILURE '+json.dumps({**current,'feature':feature,'detail':detail},ensure_ascii=False),flush=True)
 rows.append({**current,'feature':feature,'state':state,'detail':detail,'provider':'synthetic','database':'disposable PostgreSQL Unix socket'})
def check(value,message='Resultado diferente do esperado'):
 assert value,message
def control(page,action,**body):
 r=page.request.post(origin+'/__synthetic__/fixture',data={'action':action,**body},headers={'origin':origin});check(r.status==200);return r.json()
def state(page):return page.request.get(origin+'/__synthetic__/fixture').json()
def login(page,a):
 page.goto(origin+'/account.html');page.locator('#accountEmail').fill(a['email']);page.locator('#accountPassword').fill('SYNTHETIC-TEST-PASSWORD-ONLY');page.locator('#accountForm button[type=submit]').click();page.wait_for_function('document.getElementById("accountStatus").textContent.includes("Sessão validada")');page.goto(origin+'/authenticated.html');page.wait_for_function('window.GSSessionV4?.user?.id=== '+json.dumps(a['id']));page.wait_for_function('!document.getElementById("authenticatedClinicModules").hidden')
def call(page,action,body=None,view_as=''):
 return page.evaluate('async([a,b,v])=>{try{return {ok:true,value:await GSSessionV4.modules.call(a,b,v)}}catch(e){return {ok:false,status:e.status,message:e.message}}}',[action,body or {},view_as])
try:
 for _ in range(400):
  if ready.exists():break
  if proc.poll() is not None:raise RuntimeError('Synthetic server failed: '+(OUT/'central-server.log').read_text())
  time.sleep(.1)
 check(ready.exists(),'Servidor sintético não arrancou');metadata=json.loads(ready.read_text());origin=metadata['origin'];actors=metadata['actors']
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for a in actors:
   for device,width,height in [('desktop',1280,900),('tablet',820,900),('mobile',390,844)]:
    for theme in ['light','dark']:
     current={'profile':a['role'],'viewport':device,'theme':theme};context=browser.new_context(viewport={'width':width,'height':height},service_workers='block');page=context.new_page();page.set_default_timeout(6000);errors=[];blocked=[]
     context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else (blocked.append(r.request.url),r.abort()))
     page.on('pageerror',lambda e:errors.append(str(e)));context.tracing.start(screenshots=True,snapshots=True,sources=True)
     control(page,'begin');control(page,'restore')
     record('Login por formulário, cookie HttpOnly/Secure e identidade SQL',lambda:login(page,a))
     page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
     record('Cookie não legível em JS; nenhuma identidade/dados operacionais em localStorage',lambda:check(page.evaluate('document.cookie===""&&localStorage.length===0') and all(c['httpOnly'] and c['secure'] for c in context.cookies())))
     expected=['a','b','c'] if a['role']=='CEO' else ['a','b'] if a['role'] in ['ADMINISTRAÇÃO','CALL CENTER'] else ['a']
     record('Clínicas autorizadas multi-clínica provêm da API/SQL',lambda:check(sorted(page.locator('#sessionClinic').evaluate('(e)=>[...e.options].map(o=>o.value)'))==expected))
     def stock_ui():
      page.locator('#sessionClinic').select_option('a');page.locator('#sessionStock').click();page.wait_for_function('document.getElementById("sessionModuleResult").textContent.includes("SYNTHETIC PRODUCT")');check(str(state(page)['quantity']) in page.locator('#sessionModuleResult').inner_text())
     record('UI Stock apresenta existências reais do PostgreSQL descartável',stock_ui)
     def write():
      before=state(page)['quantity'];allowed=a['role']!='CALL CENTER';key='central-'+str(uuid.uuid4());payload={'clinicId':'a','productId':'synthetic-product','quantity':1,'reason':'Synthetic E2E','idempotencyKey':key};r=call(page,'consume',payload);check(r['ok']==allowed)
      if allowed:
       check(state(page)['quantity']==before-1);dup=page.evaluate('async(b)=>Promise.all([GSSessionV4.modules.call("consume",b),GSSessionV4.modules.call("consume",b)])',{**payload,'idempotencyKey':key+'-duplicate'});check(len(dup)==2);check(state(page)['quantity']==before-2);stock_ui()
      else:check(r['status']==403 and state(page)['quantity']==before and page.evaluate('GSSessionV4.user!==null'))
     record('Escrita API persiste e dois pedidos concorrentes não duplicam o movimento',write)
     def outside():
      before=state(page);r=call(page,'stock',{'clinicId':'c'});check(r['ok']==(a['role']=='CEO'));check(state(page)['quantity']==before['quantity']);check(page.evaluate('GSSessionV4.user!==null'),'Recusa de clínica terminou uma sessão válida')
     record('Clínica não atribuída recusada sem herdar CEO nem terminar sessão válida',outside)
     def spoof():
      before=state(page);r=call(page,'category-save',{'clinicId':'a','id':'forge-'+str(uuid.uuid4()),'name':'SYNTHETIC '+str(uuid.uuid4()),'role':'CEO','permissions':{'stockManage':True},'idempotencyKey':str(uuid.uuid4())});check(r['ok']==(a['role'] in ['CEO','ADMINISTRAÇÃO']));
      if not r['ok']:check(r['status']==403 and state(page)['auditCount']==before['auditCount'])
     record('Papel/permissões enviados no corpo não elevam privilégios',spoof)
     def documents():
      allowed=a['role'] in ['CEO','ADMINISTRAÇÃO','ADMINISTRATIVA'];check(page.locator('#sessionClinicDocuments').evaluate('(e)=>!e.hidden')==allowed);r=call(page,'documents',{'clinicId':'a'});check(r['ok']==allowed)
      if allowed:page.locator('#sessionClinicDocuments').click();page.wait_for_function('document.getElementById("sessionModuleResult").textContent.includes("Licença / registo ERS")');check('Em falta' in page.locator('#sessionModuleResult').inner_text())
      else:check(r['status']==403)
     record('Documentação clínica e estado documental respeitam permissão efetiva',documents)
     def custom():
      control(page,'permission',actorId=a['id'],key='stockConsume',enabled=True);r=call(page,'consume',{'clinicId':'a','productId':'synthetic-product','quantity':1,'reason':'Concessão sintética','idempotencyKey':str(uuid.uuid4())});check(r['ok']);control(page,'permission',actorId=a['id'],key='stockConsume',enabled=False);before=state(page);r=call(page,'consume',{'clinicId':'a','productId':'synthetic-product','quantity':1,'reason':'Recusa sintética','idempotencyKey':str(uuid.uuid4())});check(not r['ok'] and r['status']==403);check(state(page)['quantity']==before['quantity']);control(page,'permission',actorId=a['id'],key='stockRead',enabled=False);page.evaluate('async()=>await GSSessionV4.refresh()');page.wait_for_function('document.getElementById("sessionStock").hidden');check(not call(page,'stock',{'clinicId':'a'})['ok']);control(page,'restore');page.evaluate('async()=>await GSSessionV4.refresh()');page.wait_for_function('!document.getElementById("sessionStock").hidden')
     if a['role']!='CEO':record('Concessão/remoção SQL aparece na sessão, interface e API sem mudar utilizador',custom)
     if a['role']=='CEO':
      r=call(page,'stock',{'clinicId':'a'},actors[3]['id']);record('CEO view-as leitura do alvo e escrita recusada',lambda:check(r['ok'] and not call(page,'consume',{'clinicId':'a','productId':'synthetic-product','quantity':1,'reason':'Forbidden view-as','idempotencyKey':str(uuid.uuid4())},actors[3]['id'])['ok']))
     record('Apresentação responsiva sem overflow/exceções/pedidos externos',lambda:check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+2') and not errors and not blocked,repr(errors+blocked)))
     page.screenshot(path=str(OUT/('central-'+str(actors.index(a))+'-'+device+'-'+theme+'.png')),full_page=True)
     def expiry():
      control(page,'missing-expiry');r=page.request.get(origin+'/api/auth?action=session');check(r.status==401);r=call(page,'stock',{'clinicId':'a'});check(not r['ok'] and r['status']==401);check(page.evaluate('GSSessionV4.user===null'));control(page,'restore')
     record('Expiração ausente recusada no servidor e fecha a sessão cliente',expiry)
     login(page,a)
     def inactive():
      control(page,'inactive',actorId=a['id']);r=call(page,'stock',{'clinicId':'a'});check(not r['ok']);check(page.evaluate('GSSessionV4.user===null'));check(page.locator('#authenticatedClinicModules').evaluate('(e)=>e.hidden'));control(page,'restore')
     record('Inativação SQL bloqueia API e limpa identidade/resultados da interface',inactive)
     login(page,a)
     def revoked():
      control(page,'revoke',actorId=a['id']);r=call(page,'stock',{'clinicId':'a'});check(not r['ok'] and r['status']==401);check(page.evaluate('GSSessionV4.user===null'));check(page.locator('#authenticatedClinicModules').evaluate('(e)=>e.hidden'))
     record('Revogação no fornecedor sintético bloqueia API e fecha interface',revoked)
     context.tracing.stop(path=str(OUT/('central-'+str(actors.index(a))+'-'+device+'-'+theme+'.zip')));context.close()
  # Delay an actual SQL response, change cookie identity, then release the old response.
  current={'profile':'CEO → Médico','viewport':'desktop','theme':'light'};context=browser.new_context(service_workers='block');page=context.new_page();page.set_default_timeout(6000);control(page,'begin');control(page,'restore');login(page,actors[0]);held=[]
  page.route('**/api/clinic-stock?action=stock*',lambda r:held.append((r,r.fetch())))
  page.evaluate('()=>{window.oldCentralReply=GSSessionV4.modules.call("stock",{clinicId:"a"}).then(()=>"LEAK").catch(e=>e.message)}');page.wait_for_timeout(100)
  def stale():
   check(len(held)==1);page.evaluate('async(email)=>{await GSSessionV4.signOut();const r=await fetch("/api/auth?action=signIn",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password:"SYNTHETIC-TEST-PASSWORD-ONLY"})});if(!r.ok)throw Error("Synthetic switch failed");await GSSessionV4.refresh()}',actors[3]['email']);held[0][0].fulfill(response=held[0][1]);check('Dados anteriores descartados' in page.evaluate('async()=>await window.oldCentralReply'));check(page.evaluate('GSSessionV4.user.id')==actors[3]['id'])
  record('Resposta SQL tardia descartada após troca real de cookie/identidade',stale);context.close();browser.close()
finally:
 (OUT/'matrix-central.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('CENTRAL_SUMMARY '+json.dumps({'executions':len(rows),'passed':sum(r['state']=='Aprovada' for r in rows),'failed':sum(r['state']=='Falhou' for r in rows),'provider':'synthetic','database':'disposable PostgreSQL','production':'not accessed'}),flush=True)
 proc.terminate()
 try:proc.wait(timeout=10)
 except subprocess.TimeoutExpired:proc.kill()
 log.close()
if any(r['state']=='Falhou' for r in rows):raise SystemExit(1)

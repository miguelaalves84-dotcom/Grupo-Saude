"""Todos os módulos ligados ao servidor: duas pessoas com sessão real (simulada), dados do servidor, alterações partilhadas, permissões e nenhum dado fictício enviado."""
import os,json,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent;PORT=8790;U=f'http://127.0.0.1:{PORT}';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/server-sync'));OUT.mkdir(parents=True,exist_ok=True);cases=[]
def check(n,v):cases.append({'case':n,'passed':bool(v)});print(json.dumps(cases[-1],ensure_ascii=False),flush=True);assert v,n
srv=subprocess.Popen(['node',str(ROOT/'tests/appstate-server.cjs')],env={**os.environ,'PORT':str(PORT)},stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
try:
 for _ in range(50):
  try:urllib.request.urlopen(U+'/__state');break
  except Exception:time.sleep(0.2)
 server=lambda:json.loads(urllib.request.urlopen(U+'/__state').read())
 with sync_playwright() as pw:
  b=pw.chromium.launch(args=['--no-sandbox'])
  def open_as(uid):
   c=b.new_context(viewport={'width':1366,'height':860});c.add_cookies([{'name':'gs_test_user','value':uid,'url':U}]);p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(U+'/index.html');p.wait_for_function('window.GSServerSync&&window.GSServerSync.active',timeout=20000);p.wait_for_function('window.App',timeout=20000);p.wait_for_timeout(800);return c,p,errs
  ca,pa,ea=open_as('u-adm')
  st=pa.evaluate("()=>JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'))")
  check('signed-in user is the session user, not a demo profile',st['currentUser']=='u-adm')
  check('clinics come from the server (no demo clinics)',[c['id'] for c in st['clinics']]==['algarfisio'])
  check('server mode flag set and demo banner replaced',pa.evaluate("document.documentElement.dataset.sync")=='server' and 'Ligado ao servidor' in pa.locator('aside.notice').inner_text())
  pa.wait_for_timeout(1500);srvs=server()
  check('no demo data uploaded to the server',not any(k.startswith('appstate:candidates') and json.loads(json.dumps(v)).get('v') for k,v in srvs.items()) and srvs.get('appstate:requests',{}).get('v',[])==[])
  # A cria um pedido de consulta pela aplicação
  pa.evaluate("""()=>{const k='grupo_saude_v4_demo_2',s=JSON.parse(localStorage.getItem(k));s.requests=(s.requests||[]).concat([{id:'req-syn-1',name:'SYN Pedido',clinic:'algarfisio',stage:'Novo pedido',created:new Date().toISOString()}]);localStorage.setItem(k,JSON.stringify(s))}""")
  pa.wait_for_function("()=>window.GSServerSync&&window.GSServerSync.diff().length===0",timeout=10000)
  check('change saved on the server',any(r.get('id')=='req-syn-1' for r in server().get('appstate:requests',{}).get('v',[])))
  cb,pb,eb=open_as('u-ceo')
  check('another person sees the change after signing in',pb.evaluate("()=>JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')).requests.some(r=>r.id==='req-syn-1')"))
  # B acrescenta outro pedido; A recebe na sincronização seguinte
  pb.evaluate("""()=>{const k='grupo_saude_v4_demo_2',s=JSON.parse(localStorage.getItem(k));s.requests.push({id:'req-syn-2',name:'SYN Pedido 2',clinic:'algarfisio',stage:'Novo pedido'});localStorage.setItem(k,JSON.stringify(s))}""")
  pb.wait_for_function("()=>window.GSServerSync.diff().length===0",timeout=10000);pa.evaluate("GSServerSync.pull()");pa.wait_for_timeout(600)
  check('updates from others arrive without losing local data',pa.evaluate("()=>{const r=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')).requests.map(x=>x.id);return r.includes('req-syn-1')&&r.includes('req-syn-2')}"))
  # permissão: a administrativa não pode alterar clínicas — o navegador não envia e o servidor recusa um pedido direto
  pa.evaluate("""()=>{const k='grupo_saude_v4_demo_2',s=JSON.parse(localStorage.getItem(k));s.clinics[0].name='HACK';localStorage.setItem(k,JSON.stringify(s))}""")
  pa.wait_for_timeout(2500)
  direct=pa.evaluate("""async()=>{const r=await fetch('/api/v4-extensions?resource=appstate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({changes:[{key:'clinics',value:[{id:'algarfisio',name:'HACK'}],rev:1}]})});return r.json()}""")
  check('unauthorized change never reaches the server and a direct request is refused',server()['appstate:clinics']['v'][0]['name']=='AlgarFisio' and direct['denied']==['clinics'])
  check('no permission loop: nothing left to send after automatic module updates',pa.evaluate("GSServerSync.diff().length")==0)
  # a interface funciona em modo servidor (Operação e Pedidos)
  for v in ['operation','wait','dashboard','clinics','hr','clock']:pb.evaluate('v=>App.showView(v)',v);pb.wait_for_timeout(250)
  check('pages open in server mode without errors',not ea and not eb)
  pb.screenshot(path=str(OUT/'server-sync-ceo.png'))
  # sem sessão: continua demonstração
  cd=b.new_context();pd=cd.new_page();pd.goto(U+'/index.html');pd.wait_for_function('window.App');pd.wait_for_timeout(1500)
  check('without a session the app stays in demonstration',pd.evaluate("document.documentElement.dataset.sync")!='server')
  b.close()
finally:
 srv.terminate();(OUT/'server-sync-results.json').write_text(json.dumps(cases,indent=2,ensure_ascii=False))

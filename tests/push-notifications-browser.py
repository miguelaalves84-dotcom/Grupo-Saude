"""Notificações no telemóvel: o programa pode ser instalado (manifesto + ícones), regista o recetor de notificações,
e o Assistente mostra o estado certo e o botão «Ativar notificações neste aparelho». Servidor simulado."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/push'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
def route(state):
 def handler(r):
  u=r.request.url
  if 'resource=push-key' in u:return r.fulfill(status=200,content_type='application/json',body=json.dumps(state))
  return r.continue_() if u.startswith(ORIGIN+'/') else r.abort()
 return handler
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,permissions=['notifications']);c.route('**/*',route({'enabled':True,'publicKey':'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U','devices':0}))
  # o Chromium sem ecrã diz sempre «denied»: simula-se um aparelho novo, que ainda não respondeu
  c.add_init_script("try{Object.defineProperty(Notification,'permission',{get:()=>'default'})}catch{}")
  p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
  p.goto(URL);p.wait_for_function('window.App&&window.GSPushV4&&window.GSChatAssistant')
  m=p.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
  check('installable: manifest with name, standalone and 192/512 icons',m['display']=='standalone' and {i['sizes'] for i in m['icons']}=={'192x192','512x512'})
  check('icons served',p.evaluate("Promise.all(['app-icon-192.png','app-icon-512.png'].map(u=>fetch(u).then(r=>r.ok&&r.headers.get('content-type').includes('png')))).then(a=>a.every(Boolean))"))
  p.wait_for_function("navigator.serviceWorker.getRegistration('/').then(r=>!!r)",timeout=8000)
  check('notification receiver registered (sw.js)',p.evaluate("navigator.serviceWorker.getRegistration('/').then(r=>!!r&&r.active!==undefined)"))
  check('sw.js does not cache pages',p.evaluate("fetch('sw.js').then(r=>r.text()).then(t=>!/caches\\.open|cache\\.put/.test(t))"))
  p.evaluate("App.showView('chat')");p.wait_for_timeout(500);p.locator('#assistantEntry').click();p.wait_for_timeout(800)
  box=p.locator('#assistantDialog .push-box')
  check('Assistant shows the notifications box',box.count()==1)
  check('«Ativar notificações neste aparelho» offered',box.locator('[data-push=on]').count()==1 and 'mesmo com o programa fechado' in box.inner_text())
  p.screenshot(path=str(OUT/'push-assistant.png'))
  check('no page errors',not errs);c.close()
  c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);c.route('**/*',route({'enabled':False,'publicKey':None,'devices':0}))
  p=c.new_page();p.goto(URL);p.wait_for_function('window.App&&window.GSPushV4&&window.GSChatAssistant');p.evaluate("App.showView('chat')");p.wait_for_timeout(500);p.locator('#assistantEntry').click();p.wait_for_timeout(800)
  check('server off: explained, no button','ainda não estão ligadas' in p.locator('#assistantDialog .push-box').inner_text() and p.locator('[data-push=on]').count()==0);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

"""Janelas próprias da aplicação (em vez das caixas do navegador): aviso, confirmação, pergunta, tema escuro, telemóvel e texto nunca interpretado como HTML."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/dialogs'));OUT.mkdir(parents=True,exist_ok=True);cases=[]
def check(n,v):cases.append({'case':n,'passed':bool(v)});print(json.dumps(cases[-1]),flush=True);assert v,n
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for dev,w,h,theme in [('desktop',1280,800,'light'),('mobile',390,844,'dark')]:
   ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=dev=='mobile',has_touch=dev=='mobile',color_scheme=theme);ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=ctx.new_page();p.set_default_timeout(8000);native=[];p.on('dialog',lambda d:(native.append(d.message),d.dismiss()));errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.goto(URL);p.wait_for_function('window.GSDialog&&window.App');p.evaluate("localStorage.setItem('gs-dialog-force','1')");p.evaluate('t=>document.documentElement.dataset.theme=t',theme)
   p.evaluate("alert('Aviso <b>teste</b>')");d=p.locator('dialog.gs-dialog[open]');check(f'{dev}: alert uses the app dialog, not the browser box',d.count()==1 and not native)
   check(f'{dev}: message shown as plain text',d.locator('b').count()==0 and 'Aviso <b>teste</b>' in d.inner_text())
   bh=d.locator('.gs-dialog-ok').bounding_box();check(f'{dev}: button at least 44px tall',bh['height']>=44)
   d.locator('.gs-dialog-ok').click();check(f'{dev}: OK closes',p.locator('dialog.gs-dialog').count()==0)
   p.evaluate("()=>{window.__r=null;GSDialog.confirm('Apagar?',{danger:true,ok:'Apagar'}).then(v=>window.__r=v)}");p.locator('.gs-dialog-cancel').click();p.wait_for_timeout(50);check(f'{dev}: confirm cancel returns false',p.evaluate('window.__r')==False)
   p.evaluate("()=>{GSDialog.confirm('Apagar?').then(v=>window.__r=v)}");p.locator('.gs-dialog-ok').click();p.wait_for_timeout(50);check(f'{dev}: confirm OK returns true',p.evaluate('window.__r')==True)
   p.evaluate("()=>{GSDialog.confirm('Esc?').then(v=>window.__r=v)}");p.keyboard.press('Escape');p.wait_for_timeout(50);check(f'{dev}: Escape cancels',p.evaluate('window.__r')==False)
   p.evaluate("()=>{GSDialog.prompt('Motivo','',{required:true}).then(v=>window.__r=v)}");p.locator('.gs-dialog-ok').click();check(f'{dev}: required prompt refuses empty',p.locator('.gs-dialog-error').is_visible())
   p.locator('#gsDialogInput').fill('Motivo X');p.keyboard.press('Enter');p.wait_for_timeout(50);check(f'{dev}: prompt returns typed text',p.evaluate('window.__r')=='Motivo X')
   bg=p.evaluate("()=>{GSDialog.alert('x');return getComputedStyle(document.querySelector('dialog.gs-dialog')).backgroundColor}");p.screenshot(path=str(OUT/f'dialog-{dev}-{theme}.png'));p.locator('.gs-dialog-ok').click()
   check(f'{dev}: dialog follows theme ({theme}: {bg})',(bg!='rgb(255, 255, 255)')==(theme=='dark'))
   check(f'{dev}: no browser boxes and no errors',not native and not errors);ctx.close()
 finally:b.close();(OUT/'dialogs-results.json').write_text(json.dumps({'passed':sum(x['passed'] for x in cases),'cases':cases},indent=2))

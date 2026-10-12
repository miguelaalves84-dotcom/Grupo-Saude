"""Deterministic synthetic module captures. Never authenticates against a provider."""
import http.server, functools, threading, os, json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('GS_VISUAL_SOURCE','/source'))
OUT=Path(os.environ.get('GS_VISUAL_OUTPUT','/artifacts'));OUT.mkdir(parents=True,exist_ok=True)
KEY='grupo_saude_v4_demo_2'
ACTORS=['u1','test_admin','test_adm','test_call','test_med','test_tec']
SIZES={'desktop':(1280,900),'tablet':(820,900),'mobile':(390,844)}
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
manifest={'source_commit':os.environ.get('GS_VISUAL_SHA'),'scenarios':[],'clock':'2026-10-12T10:00:00Z','browser':'playwright-1.56.0-chromium','tolerance':{'channel_delta':16,'maximum_changed_pixel_ratio':0.003,'reason':'Allow minor antialiasing; layouts, text, module presence and permissions must remain stable.'}}
freeze="""(() => {const RealDate=Date; window.Date=class extends RealDate {constructor(...args){super(...(args.length?args:['2026-10-12T10:00:00Z']))}static now(){return new RealDate('2026-10-12T10:00:00Z').getTime()}};let seed=42;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};})();"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ACTORS:
  for size,(width,height) in SIZES.items():
   for theme in ['light','dark']:
    c=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
    c.route('**/*',lambda route:route.continue_() if route.request.url.startswith('http://127.0.0.1:8765/') else route.abort())
    c.add_init_script(freeze)
    page=c.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:8765/index.html');page.wait_for_function('window.RoleAccessAdminV4 && window.WorkspaceShellV4')
    page.evaluate('''([key,actor,theme])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+encodeURIComponent(actor),theme);}''',[KEY,actor,theme])
    page.reload();page.wait_for_timeout(350)
    for module in ['clinics','stock','hr','operation']:
     present=page.locator('#'+module).count()>0
     allowed=present and page.evaluate('(module)=>RoleAccessAdminV4.guard(module)',module)
     filename=f'{actor}-{size}-{theme}-{module}.png'
     row={'actor':actor,'viewport':size,'theme':theme,'module':module,'present':present,'allowed':allowed,'file':filename if allowed else None}
     if allowed:
      assert page.evaluate('(module)=>App.showView(module)',module) is not False
      page.wait_for_timeout(150)
      locator=page.locator('#'+module)
      assert locator.inner_text().strip(),row
      assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),row
      locator.screenshot(path=str(OUT/filename),animations='disabled')
     elif present:
      assert page.evaluate('(module)=>App.showView(module)',module) is False,row
     manifest['scenarios'].append(row)
    assert not errors,(actor,size,theme,errors)
    c.close()
 browser.close()
server.shutdown()
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'scenarios':len(manifest['scenarios']),'captured':sum(bool(x['file']) for x in manifest['scenarios'])}))

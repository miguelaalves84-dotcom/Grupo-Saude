"""Original brand integrity and responsive visual checks, synthetic loopback only."""
import os,json,base64,hashlib,re
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');BASE=URL.rsplit('/',1)[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/branding'));OUT.mkdir(parents=True,exist_ok=True)
svg=Path('official-logo-v4.svg').read_text();raw=base64.b64decode(re.search('base64,([^\"]+)',svg).group(1));assert hashlib.sha256(raw).hexdigest()=='eaf94b315924fc05406e48f010f6362f25ae3b788c9578523073b4edc514a187'
results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
   for theme in ['light','dark']:
    c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort());p=c.new_page()
    for page in ['account.html','index.html','authenticated.html','finance.html','recruitment.html','complaints.html']:
     p.goto(BASE+'/'+page);p.wait_for_timeout(700);p.evaluate('(t)=>{document.documentElement.dataset.theme=t;document.body.dataset.theme=t}',theme);logo=p.locator('.gs-official-logo:visible').first;logo.wait_for();p.wait_for_function('[...document.querySelectorAll(".gs-official-logo")].some(e=>e.complete&&e.naturalWidth>0&&e.getClientRects().length)')
     if page!='index.html':
      toggle=p.locator('#standaloneThemeToggle');assert toggle.is_visible();before=p.evaluate('document.documentElement.dataset.theme');toggle.click();assert p.evaluate('document.documentElement.dataset.theme')!=before;toggle.click();assert p.evaluate('document.documentElement.dataset.theme')==before
     v=logo.evaluate('(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {w:r.width,h:r.height,left:r.left,right:r.right,filter:s.filter,fit:s.objectFit}}');assert abs(v['w']/v['h']-1210/1280)<.01,(page,v);assert v['left']>=0 and v['right']<=w and v['filter']=='none' and v['fit']=='contain',(page,v);p.screenshot(path=str(OUT/f'logo-{device}-{theme}-{page}.png'),full_page=True);results.append({'page':page,'device':device,'theme':theme,'passed':True})
    p.goto(URL);p.wait_for_timeout(1000);p.evaluate("App.showView('clock')");p.emulate_media(media='print');assert p.locator('#nav').is_hidden();assert p.locator('.gs-print-brand').is_visible();assert p.locator('.gs-print-brand img').evaluate('(e)=>e.complete&&e.naturalWidth>0');assert 'NÃO É UM DOCUMENTO OFICIAL' in p.locator('.gs-print-brand').inner_text();p.screenshot(path=str(OUT/f'logo-print-{device}-{theme}.png'),full_page=True);p.pdf(path=str(OUT/f'synthetic-attendance-{device}-{theme}.pdf'));results.append({'page':'attendance-print','device':device,'theme':theme,'passed':True});c.close()
 finally:
  (OUT/'branding-results.json').write_text(json.dumps(results,indent=2));b.close()
print(json.dumps({'passed':len(results),'failed':0,'originalJpegSha256':hashlib.sha256(raw).hexdigest()}))

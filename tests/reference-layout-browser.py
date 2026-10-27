"""Approved reference: derived geometry/palette; original photo stays private, never becomes application data."""
import os,json,hashlib
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent;OLD=ROOT/'tests/fixtures/reference-before-f5c312d3';manifest=json.loads((OLD/'manifest.json').read_text());ref=json.loads((ROOT/'tests/fixtures/approved-reference-1000089444.json').read_text())
for n,v in manifest['files'].items():assert hashlib.sha256((OLD/n).read_bytes()).hexdigest()==v['sha256']
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-reference'));OUT.mkdir(parents=True,exist_ok=True);rows=[];comparisons=[];scope={}
def check(name,ok,**data):
 r={**scope,'case':name,'passed':bool(ok),**data};rows.append(r);print(json.dumps(r,ensure_ascii=False),flush=True);assert ok,name
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['u1','test_admin']:
   for device,w,h in [('tablet-horizontal',1280,800),('desktop',1440,1000),('mobile',390,844)]:
    for theme in ['dark','light']:
     scope={'actor':actor,'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',service_workers='block');p=c.new_page();p.set_default_timeout(10000);baseline=[True];errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss())
     def route(r):
      if not r.request.url.startswith(ORIGIN+'/'):return r.abort()
      n=Path(urlparse(r.request.url).path).name
      if baseline[0] and n in manifest['files']:return r.fulfill(status=200,content_type='text/css' if n.endswith('.css') else 'application/javascript',body=(OLD/n).read_text())
      return r.continue_()
     c.route('**/*',route);p.goto(URL);p.wait_for_function('window.WorkspaceShellV4&&window.GSDemoClinicAssociations');p.wait_for_timeout(400);fixture=p.evaluate((ROOT/'tests/fixtures/synthetic-executive-state.js').read_text(),[K,actor,theme]);previous=None
     for phase in ['f5c312d3','reference-aligned']:
      baseline[0]=phase=='f5c312d3';p.evaluate('([k,s])=>localStorage.setItem(k,s)',[K,fixture]);p.reload();p.wait_for_function('window.WorkspaceShellV4&&window.GSVisualRuntimeV4');p.wait_for_timeout(450);p.evaluate('App.showView("dashboard")')
      if p.locator('#dashPeriodToggle').count():p.locator('#dashPeriodToggle').click()
      p.locator('#dashStart').fill('2026-10-19');p.locator('#dashEnd').fill('2026-10-25');p.locator('#dashApply').click();p.wait_for_timeout(120);p.evaluate('window.scrollTo(0,0)');filename=f'{actor}-{device}-{theme}-{phase}.png';p.screenshot(path=str(OUT/filename))
      canonical=p.evaluate('(k)=>AccessScopeV4.dashboard(JSON.parse(localStorage.getItem(k)),{start:"2026-10-19",end:"2026-10-25"})',K)
      if baseline[0]:previous={'file':filename,'totals':canonical['totals']};continue
      check('canonical indicators preserved from f5c312d3',canonical['totals']==previous['totals']);check('exactly four primary indicators',p.locator('.executive-kpi').count()==4);check('four source-derived mini charts',p.locator('.executive-kpi .kpi-spark').count()==4);check('source-based horizontal bars',p.locator('.reference-bar-row').count()==len(canonical['compare']));check('request distribution exists without invented patients',p.locator('.reference-distribution svg').count()==1);check('all original indicators accessible',p.locator('.dashboard-secondary-metrics>div').count()==11);check('no document-wide overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
      check('no illustrative identity or revenue copied',not any(x in p.locator('#dashboardContent').inner_text() for x in ['GESTNUTRIÇÃO','Dra. Mariana','28.470']))
      if device=='tablet-horizontal':
       geometry=p.evaluate('''()=>{const r=e=>{const b=document.querySelector(e).getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}},k=r('.executive-kpis'),o=r('.executive-overview'),l=r('.reference-lower'),n=r('#nav');return{nav:n,kpis:k,overview:o,lower:l,card:r('.executive-kpi'),profile:r('.nav-profile'),header:r('.topbar')}}''')
       check('reference sidebar proportion',abs(geometry['nav']['w']/w-251/1198)<.02,measurement=geometry['nav']['w']/w,target=251/1198)
       check('reference KPI top position',abs(geometry['kpis']['y']/h-80/767)<.045,measurement=geometry['kpis']['y']/h,target=80/767)
       check('reference KPI card height',abs(geometry['card']['h']/h-137/767)<.035,measurement=geometry['card']['h']/h,target=137/767)
       check('reference overview height',abs(geometry['overview']['h']/h-277/767)<.04,measurement=geometry['overview']['h']/h,target=277/767)
       check('reference lower row position',abs(geometry['lower']['y']/h-514/767)<.08,measurement=geometry['lower']['y']/h,target=514/767)
       check('two equal overview columns',p.locator('.executive-overview>.card').evaluate_all('(es)=>Math.abs(es[0].getBoundingClientRect().top-es[1].getBoundingClientRect().top)<2&&Math.abs(es[0].getBoundingClientRect().width/es[1].getBoundingClientRect().width-1)<.12'))
       check('identity control placed in sidebar footer',p.locator('.nav-profile #ceoAreaSelect').is_visible());check('footer near the reference position',geometry['profile']['y']>h*.68)
       comparisons.append({**scope,'geometry':geometry,'reference':ref['regions'],'before':previous['file'],'after':filename})
      if theme=='dark':
       check('midnight canvas matches sampled reference',p.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim()')=='#000f1f');check('dark blue chart contrast follows updated approval',p.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--chart-primary").trim()')=='#8bbcff')
      if theme=='light':
       check('light main canvas follows latest approval',p.evaluate('getComputedStyle(document.body).backgroundColor')=='rgb(242, 245, 249)')
       check('white KPI cards',p.locator('.executive-kpi').first.evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(255, 255, 255)')
       check('blue and aqua charts replace gold',p.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--chart-primary").trim()')=='#2468c9' and p.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--chart-teal").trim()')=='#118c9b')
      if device!='mobile':check('readable prominent indicators',p.locator('.executive-kpi>strong').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)>=38'))
      colours=p.evaluate('''()=>{const st=getComputedStyle(document.documentElement);return Object.fromEntries(['--ink','--muted','--canvas','--surface','--primary','--accent'].map(k=>[k,st.getPropertyValue(k).trim()]))}''')
      def luminance(h):
       h=h.lstrip('#');h=''.join(x*2 for x in h) if len(h)==3 else h
       v=[int(h[i:i+2],16)/255 for i in (0,2,4)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
      def contrast(a,b):
       a,b=sorted([luminance(a),luminance(b)]);return (b+.05)/(a+.05)
      for fg,bg in [('--ink','--surface'),('--muted','--surface'),('--muted','--canvas'),('--primary','--surface'),('--accent','--surface')]:
       ratio=contrast(colours[fg],colours[bg]);check('text contrast '+fg+' on '+bg,ratio>=4.5,ratio=round(ratio,2))
      p.locator('#dashPeriodToggle').click();check('period control opens the actual filters',p.locator('#dashStart').is_visible());p.locator('#dashClinic').select_option(canonical['clinics'][0]['id']);p.locator('#dashApply').click();check('clinic scope still filters all clinic rows',p.locator('.dashboard-clinic-list>article').count()==1)
      for view in ['agenda','hr','operation','finance','stock','marketing','complaints','tables','chat']:
       if not p.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):continue
       p.evaluate('(v)=>App.showView(v)',view);p.wait_for_timeout(100);check(view+' uses a responsive shared shell',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
       if device=='tablet-horizontal' and actor=='u1':p.evaluate('window.scrollTo(0,0)');p.screenshot(path=str(OUT/f'{actor}-{device}-{theme}-{view}.png'))
      check('no JavaScript exceptions',not errors);im=ImageChops.difference(Image.open(OUT/previous['file']).convert('RGB'),Image.open(OUT/filename).convert('RGB'));fraction=sum(max(px)>12 for px in im.getdata())/(w*h);check('visible composition differs materially from f5c312d3',fraction>.10,fraction=fraction)
     c.close()
 finally:
  b.close();(OUT/'reference-layout-results.json').write_text(json.dumps({'reference':ref,'checks':len(rows),'failures':sum(not r['passed'] for r in rows),'results':rows,'comparisons':comparisons,'notice':'Geometry compared with the approved image; light-first blue/aqua palette follows the latest explicit user correction. Original brand, sample values, photo and Android system UI are not reproduced. Physical Android confirmation remains pending.'},ensure_ascii=False,indent=2))

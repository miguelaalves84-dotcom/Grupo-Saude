"""Structural redesign: identical synthetic records, previous d356494 composition versus current."""
import os,json,hashlib
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent;BASELINE=ROOT/'tests/fixtures/executive-before-d356494';manifest=json.loads((BASELINE/'manifest.json').read_text())
for n,m in manifest['files'].items():assert hashlib.sha256((BASELINE/n).read_bytes()).hexdigest()==m['sha256']
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-executive'));OUT.mkdir(parents=True,exist_ok=True);rows=[];pairs=[];scope={}
def check(name,ok):
 rows.append({**scope,'case':name,'passed':bool(ok)});print(json.dumps(rows[-1]),flush=True);assert ok,name
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['u1','test_admin']:
   for device,w,h in [('tablet-landscape',1280,800),('desktop',1440,1000),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',service_workers='block');p=c.new_page();p.set_default_timeout(10000);before=[True];errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss())
     def route(r):
      if not r.request.url.startswith(ORIGIN+'/'):return r.abort()
      n=Path(urlparse(r.request.url).path).name
      if before[0] and n in manifest['files']:return r.fulfill(status=200,content_type='text/css' if n.endswith('.css') else 'application/javascript',body=(BASELINE/n).read_text())
      return r.continue_()
     c.route('**/*',route);p.goto(URL);p.wait_for_function('window.WorkspaceShellV4&&window.GSDemoClinicAssociations');p.wait_for_timeout(400)
     fixture=p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));GSDemoClinicAssociations.repair(s);for(const u of [...s.users,...Object.values(s.employees||{})]){u.name='SYN '+u.id;u.email=u.id+'@example.invalid'}for(const c of s.clinics){c.name='SYN Clínica '+c.id;c.address='Rua Sintética'}s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;const u=s.employees[a]||s.users.find(x=>x.id===a),allowed=AccessScopeV4.activeClinics(s).filter(c=>a==='u1'||AccessScopeV4.assigned(u).includes(String(c.id))),cid=String(allowed[0].id);s.days={};s.requests=[];for(let i=0;i<7;i++){const date='2026-10-'+String(19+i),d=date+'_'+cid;s.days[d]={clinic:cid,date,revision:1,openedAt:date+'T08:00:00Z',closed:true,open:{saved:true,professionals:[{employeeId:'test_med',kind:'doctor',category:'consultations',selected:true,consults:20+i,booked:20+i,currentBooked:20+i},{employeeId:'test_tec',kind:'therapist',category:'treatments',selected:true,consults:30,capacity:32,currentBooked:30}]},close:{saved:true,professionals:[{employeeId:'test_med',kind:'doctor',category:'consultations',done:17+i},{employeeId:'test_tec',kind:'therapist',done:25+i%3}]},indicators:{},taskStatus:{synthetic:{status:i<3?'done':'todo'}},taskCatalog:[{id:'synthetic',name:'SYN Conferência',active:true,clinics:[cid]}]};s.requests.push({id:'SYN-wait-'+i,clinic:cid,name:'SYN contacto '+i,patientRef:'SYN-'+i,specialty:'SYN Especialidade',stage:i<5?'Novo pedido':'Marcado',created:date+'T12:00:00Z',completed:i>=5?date+'T15:00:00Z':null,history:[]})}s.alerts=[{id:'SYN-alert',clinic:cid,title:'SYN Conferir documento operacional',status:'Pendente',to:a}];localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t);return JSON.stringify(s)}''',[K,actor,theme]);old=None
     for phase in ['before','after']:
      before[0]=phase=='before';p.evaluate('([k,s])=>localStorage.setItem(k,s)',[K,fixture]);p.reload();p.wait_for_function('window.WorkspaceShellV4&&window.AttentionUIV4');p.wait_for_timeout(450);p.evaluate('App.showView("dashboard")');p.locator('#dashStart').fill('2026-10-19');p.locator('#dashEnd').fill('2026-10-25');p.locator('#dashApply').click();p.wait_for_timeout(150);p.evaluate('window.scrollTo(0,0)');file=f'{actor}-{device}-{theme}-{phase}.png';p.screenshot(path=str(OUT/file),full_page=False)
      expected=p.evaluate('(k)=>AccessScopeV4.dashboard(JSON.parse(localStorage.getItem(k)),{start:"2026-10-19",end:"2026-10-25"})',K)
      if phase=='before':old={'totals':expected['totals'],'file':file};continue
      check('identical canonical indicators survive composition change',expected['totals']==old['totals']);check('four primary indicators only',p.locator('.executive-kpis>.executive-kpi').count()==4)
      for key in ['consultations','treatments','newRequests','pending']:check(key+' displays canonical data',p.locator(f'[data-dash-kpi="{key}"]>strong').inner_text()==str(expected['totals'][key]))
      check('header approval icon loads as a valid SVG image',p.locator('#rosterApprovalOpen').evaluate('''async e=>{const css=getComputedStyle(e).getPropertyValue('--header-action-icon').trim(),url=css.slice(css.indexOf('(')+1,css.lastIndexOf(')')).replace(/^['"]|['"]$/g,'');return await new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src=url})}'''))
      check('all original indicators remain available in details',p.locator('.dashboard-secondary-metrics>div').count()==11);check('responsive chart has a real plot',p.locator('.dashboard-line-chart circle').count()==7);check('no page-wide horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'));check('all sidebar module icons are consistent SVGs',p.locator('#nav details summary:not(:has(svg))').count()==0)
      if w>760:
       check('large official logo inside the sidebar',p.locator('#nav .gs-official-logo').evaluate('(e)=>e.getBoundingClientRect().width>=88'));check('main occupies the available content width',p.locator('main').evaluate('(e)=>e.getBoundingClientRect().width>innerWidth*.70'));check('four KPIs align on a single landscape row',p.locator('.executive-kpi').evaluate_all('(es)=>new Set(es.map(e=>Math.round(e.getBoundingClientRect().top))).size===1'))
      check('new composition changes meaningful pixels',sum(max(px)>12 for px in ImageChops.difference(Image.open(OUT/old['file']).convert('RGB'),Image.open(OUT/file).convert('RGB')).getdata())/(w*h)>.05)
      pairs.append({**scope,'before':old['file'],'after':file,'sourceBaseline':manifest['sourceCommit'],'notice':'Previous product composition; approved mockup unavailable, no claim of pixel equivalence.'})
      p.locator('.dashboard-detail').evaluate('(e)=>e.open=true');check('comparison table retains every indicator',p.locator('.dashboard-detail thead th').count()==13);p.locator('#dashClinic').select_option(expected['clinics'][0]['id']);p.locator('#dashApply').click();check('clinic filter remains effective',p.locator('.dashboard-clinic-list>article').count()==1)
      for view in ['agenda','hr','operation','stock','marketing','complaints','tables','chat']:
       if not p.evaluate('(id)=>RoleAccessAdminV4.guard(id)',view):continue
       p.evaluate('(id)=>App.showView(id)',view);p.wait_for_timeout(100);check(view+' keeps the shared responsive workspace',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
       if device=='tablet-landscape':p.evaluate('window.scrollTo(0,0)');p.screenshot(path=str(OUT/f'{actor}-{device}-{theme}-{view}.png'))
      check('no unhandled JavaScript errors',not errors)
     c.close()
 finally:
  b.close();(OUT/'executive-design-results.json').write_text(json.dumps({'checks':len(rows),'failures':sum(not r['passed'] for r in rows),'results':rows,'comparisons':pairs,'referenceMockupAvailable':False},ensure_ascii=False,indent=2))

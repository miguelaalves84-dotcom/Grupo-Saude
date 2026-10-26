"""Synthetic visual before/after evidence; canonical operations remain covered by regression suites."""
import os,json,hashlib
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parent.parent
BASELINE=ROOT/'tests/fixtures/design-baseline-7303684'
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html')
ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-design'));OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((BASELINE/'manifest.json').read_text())
for name,meta in manifest['files'].items():
 assert hashlib.sha256((BASELINE/name).read_bytes()).hexdigest()==meta['sha256'],'Immutable CSS baseline changed'
results=[];pairs=[];scope={}
def check(name,ok):
 results.append({**scope,'case':name,'passed':bool(ok)});print(json.dumps(results[-1]),flush=True);assert ok,name
SIGNATURE='''(selector)=>[...document.querySelector(selector).querySelectorAll('button,input,select,textarea,a[href],summary')].map(e=>({tag:e.tagName,id:e.id,name:e.name||'',type:e.type||'',disabled:e.disabled===true,checked:e.checked===true,value:e.value||'',text:e.tagName==='SELECT'?[...e.options].map(o=>[o.value,o.textContent.trim()]):e.textContent.trim().replace(/\\s+/g,' ')}))'''
extras=['myhr','clock','wait','stock','clinics','tables','marketing','complaints','tasks','chat','audit','reports']
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  index=0
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};use_baseline=[True];c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block',locale='pt-PT');p=c.new_page();p.set_default_timeout(10000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss())
     def route(r):
      if not r.request.url.startswith(ORIGIN+'/'):return r.abort()
      name=Path(urlparse(r.request.url).path).name
      if use_baseline[0] and name in manifest['files']:return r.fulfill(status=200,content_type='text/css',headers={'Cache-Control':'no-store'},body=(BASELINE/name).read_text())
      return r.continue_()
     c.route('**/*',route);p.goto(URL);p.wait_for_function('window.HRMasterV4&&window.AgendaUIV4&&window.GSDemoClinicAssociations');p.wait_for_timeout(600)
     p.evaluate('''([k,a,t])=>{let s=JSON.parse(localStorage.getItem(k));GSDemoClinicAssociations.repair(s);for(const x of [...s.users,...Object.values(s.employees||{})]){x.name='SYN '+x.id;x.email=x.id+'@example.invalid'}for(const x of s.clinics){x.name='SYN Clínica '+x.id;x.address='Rua Sintética'}s.agendaEvents=[];const owner=s.employees.test_adm||s.users.find(x=>x.id==='test_adm'),boss={...s.users.find(x=>x.id==='u1'),permissions:{agenda:true}},cid=owner.clinics?.find(id=>s.clinics.some(c=>String(c.id)===String(id)&&c.active!==false&&!c.virtual&&c.operational!==false));if(cid)s=GSAgenda.command(s,boss,'save',{ownerId:'test_adm',clinicId:cid,title:'SYN Reunião administrativa',date:GSAttendanceCore.day(),time:'10:00',duration:45,revision:0,requestId:'visual-baseline-event'}).state;s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.designPreserved='SYN KEEP';localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme])
     targets=[('Dashboard','view','dashboard'),('Agenda','view','agenda'),('RH','hr','hr'),('Conta-corrente','finance','account'),('Caixas','cash','cash'),('Dia-Clinico','view','operation'),('Ficha-RH','record',actor)]
     for extra in [extras[index%len(extras)],extras[(index+5)%len(extras)]]:targets.append((extra,'view',extra))
     fixture=p.evaluate('(k)=>localStorage.getItem(k)',K);before={}
     for phase in ['before','after']:
      use_baseline[0]=phase=='before';p.evaluate('([k,s])=>localStorage.setItem(k,s)',[K,fixture]);p.reload();p.wait_for_function('window.WorkspaceShellV4&&window.AgendaUIV4');p.wait_for_timeout(450)
      if phase=='after':check('canonical design tokens loaded once',p.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--design-version").trim()')=='gs-reference-20261025')
      for label,kind,target in targets:
       p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
       if kind in ['view','hr']:
        allowed=p.evaluate('(id)=>!!document.getElementById(id)&&RoleAccessAdminV4.guard(id)',target)
        if not allowed:continue
        p.evaluate('(id)=>App.showView(id)',target)
        if kind=='hr':p.evaluate('V4ClinicHR.showEmployees()')
        selector='#'+target
       elif kind in ['finance','cash']:
        allowed=p.evaluate('RoleAccessAdminV4.can("account")') if kind=='finance' else p.evaluate('GSFinanceCash.read(FinanceDemoV4.actor())')
        if not allowed:continue
        p.evaluate('(section)=>FinanceUIV4.open(section)',target);selector='#financeContent';expect(p.locator('#financeContent .finance-workspace')).to_be_visible()
       else:
        p.evaluate('App.showView("myhr")');p.evaluate('(id)=>HRMasterV4.open(id,"dados")',target);selector='#modalBody';expect(p.locator('#modal')).to_be_visible()
       p.evaluate('window.ApprovalsV4?.sync?.();window.scrollTo(0,0)');p.wait_for_timeout(100);signature=p.evaluate(SIGNATURE,selector);file=f'{actor}-{device}-{theme}-{label}-{phase}.png';p.screenshot(path=str(OUT/file))
       if phase=='before':before[label]={'signature':signature,'file':file}
       else:
        if signature!=before[label]['signature']:(OUT/f'{actor}-{device}-{theme}-{label}-control-difference.json').write_text(json.dumps({'before':before[label]['signature'],'after':signature},ensure_ascii=False,indent=2))
        check(label+' controls values and permissions preserved',signature==before[label]['signature'])
        check(label+' no page-wide horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
        if kind=='record':check('employee dialog fits and retains close control',p.locator('#modal').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight}') and p.locator('#modal .modal-head button').is_visible())
        old=Image.open(OUT/before[label]['file']).convert('RGB');new=Image.open(OUT/file).convert('RGB');diff=ImageChops.difference(old,new);changed=sum(1 for pixel in diff.getdata() if max(pixel)>12);fraction=changed/(w*h)
        check(label+' actual visual redesign is rendered',fraction>0.001)
        if label=='Agenda':
         check('single relevant Agenda search',p.locator('#agenda .gs-search-wrap').count()==0 and p.locator('#agendaFilters [name=search]').is_visible());p.keyboard.press('Control+f');check('keyboard search targets the visible calendar filter',p.evaluate('document.activeElement.name')=='search')
        pairs.append({**scope,'module':label,'before':before[label]['file'],'after':file,'changedPixelFraction':round(fraction,4),'threshold':'RGB difference >12; intentionally changed design, not pixel equivalence'})
     check('synthetic source marker survives visual changes',p.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).designPreserved',K)=='SYN KEEP');check('no unhandled browser errors',not errors)
     if actor=='u1':
      p.evaluate('CEOReservedAreaV4.select("test_med")');check('CEO simulation keeps agenda and HR restrictions',not p.evaluate('RoleAccessAdminV4.guard("agenda")') and not p.evaluate('RoleAccessAdminV4.guard("hr")'));p.evaluate('CEOReservedAreaV4.select("__CEO__")')
     c.close();index+=1
 finally:
  b.close();report={'sourceBaseline':manifest['sourceCommit'],'contexts':36,'checks':len(results),'failed':sum(not x['passed'] for x in results),'pairs':pairs,'results':results,'notice':'Emulated viewports and synthetic identities. Pixel differences document the redesign; human validation remains necessary.'};(OUT/'design-before-after.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DESIGN_SUMMARY '+json.dumps({k:v for k,v in report.items() if k not in ['pairs','results']}),flush=True)

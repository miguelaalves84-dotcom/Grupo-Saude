"""Three canonical queues: explicit add, archive, counts and cross-month/year continuation."""
import os,json
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';CL='syn-lists-a';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/opening-lists'));OUT.mkdir(parents=True,exist_ok=True);cases=[];scope={}
def check(name,v):
 cases.append({**scope,'case':name,'passed':bool(v)});print(json.dumps(cases[-1]),flush=True);assert v,name
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def current(p):
 s=state(p);return s['days'].get(s['opDate']+'_'+CL,{'open':{'saved':False},'closed':False})
def queue(p,t):return p.locator('#opWorkflow_ending' if t=='ending' else '[data-op-queue="'+t+'"]')
def rows(p,t):return queue(p,t).locator('[data-work-row]' if t=='ending' else '[data-queue-active] [data-op-queue-row]')
def count(p,t,key):return int(queue(p,t).locator('[data-list-'+key+']').inner_text())
def tap(p,loc):loc.click() if scope['device']=='desktop' else loc.tap()
def clock(p,date):p.clock.set_fixed_time(datetime.fromisoformat(date+'T12:00:00+00:00'))
def date(p,value):
 clock(p,value);p.locator('#opDate').fill(value);p.locator('#opDate').dispatch_event('change');p.evaluate('App.setPhase("open")')
def add(p,t,n):
 q=queue(p,t);i=q.locator('[data-ending-count]' if t=='ending' else '#new_'+t);i.fill(str(n));tap(p,q.locator('[data-work-add]' if t=='ending' else '[data-queue-add]'))
def fill_rows(p,t):
 for i,r in enumerate(rows(p,t).all()):
  f=r.locator('[data-work-field=patientRef]' if t=='ending' else '[data-patient-ref]')
  if not f.input_value():f.fill('SYN-'+t+'-'+str(i))
def save(p):
 p.locator('#opAdministrativeReason').fill('SYN administrative opening');tap(p,p.locator('#opSaveOpening'))
def raw(p):
 s=state(p);return [r for d in s['days'].values() for r in d.get('pendingRows',[])]+[r for d in s['days'].values() for r in d.get('workflowRows',[]) if r['type']=='ending']
def setup(p,a,t):
 clock(p,'2026-11-30');p.goto(URL);p.wait_for_function('window.GSOperationCore&&window.CEOReservedAreaV4');p.evaluate('''([k,a,t,c])=>{const s=JSON.parse(localStorage.getItem(k));s.days={};s.requests=[];s.tasks=JSON.parse(JSON.stringify(GSOperationCore.defaultTasks));s.clinics=[{id:c,name:'SYN Lists A',active:true,operational:true},{id:'syn-lists-b',name:'SYN Lists B',active:true,operational:true}];for(const u of [...s.users,...Object.values(s.employees||{})]){u.clinics=[c];u.clinicIds=[c];u.clinic=c;u.active=true;}s.opClinic=c;s.opDate='2026-11-30';s.opPhase='open';localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t);CEOReservedAreaV4.select(a);}''',[K,a,t,CL]);p.evaluate('App.showView("operation")')
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for a in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1440,1000),('tablet',1280,800),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':a,'device':device,'theme':theme};ctx=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=ctx.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));setup(p,a,theme)
     if a not in ['u1','test_admin','test_adm']:
      check('no inherited editing rights',not p.evaluate('RoleAccessAdminV4.can("clinicTasks")'));check('new queue save cannot bypass profile domain policy',p.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));try{GSOperationCore.command(s,{actor:s.currentUser,clinic:s.opClinic,clinics:[s.opClinic],date:s.opDate,at:new Date().toISOString(),can:k=>RoleAccessAdminV4.permission(s,k)},'queues',{requestId:'forbidden',changes:[],revision:0});return false}catch{return true}}'''));check('ending patient form restricted',queue(p,'ending').count()==0);ctx.close();continue
     check('selected theme applied',p.evaluate('document.documentElement.dataset.theme')==theme)
     for t in ['evaluation','confirmation','ending']:
      check(t+' no automatic empty lines',rows(p,t).count()==0);check(t+' shared compact controls',queue(p,t).locator('.operation-list-add').count()==1 and queue(p,t).get_by_role('button',name='Adicionar linhas',exact=True).count()==1);check(t+' zero initial counters',all(count(p,t,k)==0 for k in ['new','previous','done','pending']))
     queue(p,'evaluation').locator('#new_evaluation').fill('2');check('typing quantity creates nothing',rows(p,'evaluation').count()==0);tap(p,queue(p,'evaluation').locator('[data-queue-add]'));rows(p,'evaluation').first.locator('[data-patient-ref]').fill('SYN-evaluation-0');add(p,'confirmation',1);add(p,'ending',2)
     add(p,'evaluation',1);add(p,'ending',1)
     for t,n in [('evaluation',3),('ending',3)]:check(t+' new line has delete button',rows(p,t).nth(n-1).locator('.row-delete').count()==1);rows(p,t).nth(0).locator('[data-patient-ref],[data-work-field=patientRef]').first.fill(rows(p,t).nth(0).locator('[data-patient-ref],[data-work-field=patientRef]').first.input_value() or 'SYN-'+t+'-0');tap(p,rows(p,t).nth(n-1).locator('.row-delete'));check(t+' delete removes only that line and keeps typed numbers',rows(p,t).count()==n-1 and rows(p,t).nth(0).locator('[data-patient-ref],[data-work-field=patientRef]').first.input_value()!='')
     for t,n in [('evaluation',2),('confirmation',1),('ending',2)]:check(t+' explicit exact quantity',rows(p,t).count()==n);fill_rows(p,t)
     save(p);check('one opening save stores all three lists',len(raw(p))==5);p.evaluate('App.setPhase("open")');check('saved patient numbers are locked and lines can no longer be deleted',all(rows(p,t).first.locator('[data-patient-ref],[data-work-field=patientRef]').first.get_attribute('readonly') is not None and rows(p,t).locator('.row-delete').count()==0 for t in ['evaluation','confirmation','ending']));check('core refuses changing a saved patient number',p.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));const d=s.days[s.opDate+'_'+s.opClinic];const r=d.pendingRows[0];try{GSOperationCore.command(s,{actor:s.currentUser,clinic:s.opClinic,clinics:[s.opClinic],date:s.opDate,at:new Date().toISOString(),can:()=>true},'rowtask',{id:r.id,sourceDate:s.opDate,rowRevision:r.revision,patientRef:'OUTRO-1',done:false,revision:d.revision});return false}catch(e){return /não pode ser alterado/.test(e.message)}}'''));check('no duplicate save buttons in opening',p.locator('[data-queue-save]').count()==0 and p.locator('[data-op-action=rowtask]').count()==0)
     for t in ['evaluation','confirmation']:rows(p,t).first.locator('[data-pending-done]').check()
     rows(p,'ending').first.locator('[data-work-field=decision]').select_option('Alta');save(p)
     for t,pending in [('evaluation',1),('confirmation',0),('ending',1)]:check(t+' completion removed active row and counted history',rows(p,t).count()==pending and count(p,t,'pending')==pending and count(p,t,'done')==1)
     for t in ['evaluation','confirmation']:check(t+' archive collapsed',not queue(p,t).locator('[data-queue-history]').evaluate('(e)=>e.open'))
     add(p,'confirmation',1);fill_rows(p,'confirmation');save(p);ids=[r['id'] for r in raw(p)];check('adding again retains previous archive and original IDs',len(ids)==6 and len(set(ids))==6)
     date(p,'2026-12-02')
     for t in ['evaluation','confirmation','ending']:check(t+' previous pending survives month change',rows(p,t).count()==1 and count(p,t,'previous')==1 and count(p,t,'new')==0);add(p,t,1);fill_rows(p,t)
     save(p)
     for t in ['evaluation','confirmation','ending']:check(t+' new prior and completed counters',count(p,t,'new')==1 and count(p,t,'previous')==1 and count(p,t,'done')==1 and count(p,t,'pending')==2)
     check('transport warning keeps original creation date', 'Pendente desde 30/11/2026' in rows(p,'evaluation').first.inner_text() and 'Pendente desde 30/11/2026' in rows(p,'confirmation').first.inner_text());check('original confirmation date retained',rows(p,'confirmation').first.locator('[data-appointment-date]').input_value()=='2026-12-01');check('ending date never recalculated',rows(p,'ending').first.locator('[data-work-field=expectedDate]').input_value()=='2026-12-01')
     date(p,'2026-12-31')
     for t in ['evaluation','confirmation','ending']:check(t+' multi-week pending survives without blank lines',rows(p,t).count()==2);add(p,t,1);fill_rows(p,t)
     save(p);check('all additions produce twelve unique records only',len(raw(p))==12 and len(set(r['id'] for r in raw(p)))==12)
     date(p,'2027-01-02')
     for t in ['evaluation','confirmation','ending']:check(t+' year carry retains every pending counter',rows(p,t).count()==3 and count(p,t,'previous')==3 and count(p,t,'new')==0 and count(p,t,'done')==1)
     check('confirmation original dates cross year intact',rows(p,'confirmation').locator('[data-appointment-date]').evaluate_all('(xs)=>xs.map(x=>x.value)')==['2026-12-01','2026-12-03','2027-01-01']);check('ending original dates cross year intact',rows(p,'ending').locator('[data-work-field=expectedDate]').evaluate_all('(xs)=>xs.map(x=>x.value)')==['2026-12-01','2026-12-03','2027-01-01'])
     p.screenshot(path=str(OUT/f'lists-pending-{a}-{device}-{theme}.png'),full_page=True);p.evaluate('App.setPhase("close")');check('closing summary counts all lists',p.locator('#consultationClosingSummary [data-closing-list=evaluation] [data-list-pending]').inner_text()=='3' and p.locator('#consultationClosingSummary [data-closing-list=confirmation] [data-list-pending]').inner_text()=='3' and p.locator('#endingClosingSummary [data-list-pending]').inner_text()=='3');p.locator('#opClose').click();check('blocked closing never clears queues',not current(p)['closed'] and len(raw(p))==12);p.locator('[data-queue-resolve=evaluation]').first.click();check('resolver preserves clinic and period',p.locator('#opDate').input_value()=='2027-01-02' and p.locator('#opClinic').input_value()==CL and queue(p,'evaluation').is_visible())
     for t in ['evaluation','confirmation']:
      for r in rows(p,t).all():r.locator('[data-pending-done]').check()
     for i,r in enumerate(rows(p,'ending').all()):
      r.locator('[data-work-field=decision]').select_option('Continua' if i==0 else 'Alta')
      if i==0:r.locator('[data-work-field=followUpDate]').fill('2027-01-10')
     save(p)
     for t in ['evaluation','confirmation','ending']:check(t+' all decisions archived with no active leftovers',rows(p,t).count()==0 and count(p,t,'done')==4 and count(p,t,'pending')==0)
     check('classification author time and full history retained',all(r.get('completedBy')==a and r.get('completedAt') and len(r['history'])>0 for r in raw(p) if r['type'] in ['evaluation','confirmation']))
     archive=queue(p,'evaluation').locator('[data-queue-history]');archive.evaluate('(e)=>e.open=true');archive.locator('[data-op-queue-row]').first.locator('[data-pending-done]').uncheck();save(p);check('historical correction reopens original without duplication',rows(p,'evaluation').count()==1 and count(p,'evaluation','done')==3 and len(raw(p))==12);rows(p,'evaluation').first.locator('[data-pending-done]').check();save(p);p.reload();p.wait_for_function('window.GSOperationCore');p.evaluate('App.showView("operation");App.setPhase("open")');check('reload keeps all histories and no active or duplicate rows',len(raw(p))==12 and all(rows(p,t).count()==0 and count(p,t,'done')==4 for t in ['evaluation','confirmation','ending']));check('other clinic excluded',p.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return GSOperationCore.rows(s,'syn-lists-b','2027-01-02').length===0&&GSOperationCore.workflowRows(s,'syn-lists-b','2027-01-02','ending').length===0}'''));check('no JavaScript errors',not errors);ctx.close()
 finally:
  b.close();(OUT/'opening-lists-results.json').write_text(json.dumps({'passed':sum(x['passed'] for x in cases),'failed':sum(not x['passed'] for x in cases),'cases':cases,'physicalAndroidValidated':False},ensure_ascii=False,indent=2))

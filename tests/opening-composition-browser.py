"""Team composition on real Chromium controls, synthetic state only, six roles/devices/themes."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/composition-artifacts'));OUT.mkdir(parents=True,exist_ok=True);cases=[];scope={}
def check(label,ok):
 row={**scope,'case':label,'passed':bool(ok)};cases.append(row);print(json.dumps(row),flush=True);assert ok,label
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def day(p):
 s=state(p);return s['days'].get(s['opDate']+'_syn-composition',{})
def phase(p,value):p.evaluate('(v)=>App.setPhase(v)',value)
def team(p,doctors,techs):
 p.locator('#opDoctors').select_option(doctors);p.locator('#opTechnicians').select_option(techs)
def numbers(p):
 for row in p.locator('[data-op-row]').all():
  booked=row.locator('[data-op-field=booked]')
  if booked.count():booked.fill('7');booked.dispatch_event('change')
  else:
   row.locator('[data-op-field=freeToday]').fill('0');row.locator('[data-op-field=freeToday]').dispatch_event('change')
def save(p):p.locator('#opSaveOpening').click()
def setup(p,actor,theme):
 p.goto(URL+'#operation');p.wait_for_function('window.GSOperationCore&&window.CEOReservedAreaV4&&window.MarketingUIV4');p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k)),cl='syn-composition';s.clinics=[{id:cl,name:'SYN Composition',active:true,operational:true}];s.masterSpecialties=[{id:'sp-d',name:'SYN Medical',active:true},{id:'sp-t',name:'SYN Technical',active:true}];s.clinicSpecialties={[cl]:['sp-d','sp-t']};s.days={};s.requests=[];s.tasks=JSON.parse(JSON.stringify(GSOperationCore.defaultTasks));for(const u of [...s.users,...Object.values(s.employees||{})]){u.active=true;u.clinics=[cl];u.clinic=cl;u.clinicIds=[cl];u.hr||={};if(GSOperationCore.kind(u)==='doctor'){delete u.hr.weeklyCapacity;u.specialtyIds=['sp-d']}if(GSOperationCore.kind(u)==='therapist'){u.specialtyIds=['sp-t'];u.hr.weeklyCapacity=Object.fromEntries(Array.from({length:7},(_,d)=>[d,{treatments:32}]))}}for(const [id,role,sp]of [['syn-med2','MEDICO/A','sp-d'],['syn-tech2','TECNICO/A','sp-t']]){const u={id,name:'SYN '+id,email:id+'@example.invalid',role,clinics:[cl],active:true,specialtyIds:[sp],hr:role==='TECNICO/A'?{weeklyCapacity:Object.fromEntries(Array.from({length:7},(_,d)=>[d,{treatments:32}]))}:{}};s.users.push(u);s.employees[id]=u}s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.opClinic=cl;s.opDate='2026-10-21';s.opPhase='open';localStorage.setItem(k,JSON.stringify(s));RoleAccessAdminV4.apply();App.renderAll();App.showView('operation');document.documentElement.dataset.theme=t}''',[K,actor,theme])
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':actor,'device':device,'theme':theme};ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());page=ctx.new_page();page.set_default_timeout(10000);page.on('dialog',lambda d:d.dismiss());errors=[];page.on('pageerror',lambda e:errors.append(str(e)));setup(page,actor,theme)
     if actor in ['test_call','test_med','test_tec']:
      page.evaluate('App.saveOpening()');check('default unauthorized role cannot open even administratively',not day(page).get('open',{}).get('saved'));ctx.close();continue
     scenarios=[('doctors',['test_med'],[],3),('technicians',[],['test_tec'],1),('mixed',['test_med'],['test_tec'],4),('administrative',[],[],0),('multiple',['test_med','syn-med2'],['test_tec','syn-tech2'],8)]
     for i,(label,doctors,techs,rows) in enumerate(scenarios):
      page.evaluate('(d)=>{const k="grupo_saude_v4_demo_2",s=JSON.parse(localStorage.getItem(k));s.opDate=d;s.opPhase="open";localStorage.setItem(k,JSON.stringify(s));App.renderAll();App.showView("operation")}',f'2026-10-{21+i:02}')
      team(page,doctors,techs);check(label+' shows fields only for present team',page.locator('[data-op-row]').count()==rows and page.locator('[data-op-field=capacity]').count()==len(techs));numbers(page)
      if not rows:
       save(page);check('no-team opening without reason rejected atomically',not day(page).get('open',{}).get('saved'));page.locator('#opAdministrativeReason').fill('SYN administrative opening for archive review')
      save(page);d=day(page);check(label+' whole opening persisted',d['open']['saved'] and d['open']['administrativeOnly']==(rows==0));check(label+' active rows match team',len([r for r in d['open']['professionals'] if r.get('selected') is not False])==rows);check(label+' absent specialties have no proposals',{r['specialty'] for r in d.get('marketingProposals',[]) if r.get('teamAvailable',True)}==({'SYN Medical'} if doctors and not techs else {'SYN Technical'} if techs and not doctors else {'SYN Medical','SYN Technical'} if rows else set()));check(label+' no nonexistent clinical mandatory task',page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),d=s.days[s.opDate+'_syn-composition'],ts=GSOperationCore.configuredTasks(s,'syn-composition',undefined,d);return (!GSOperationCore.present(d,'therapist').length?!ts.some(t=>t.id==='planning'):true)&&(!GSOperationCore.present(d,'doctor').length?!ts.some(t=>t.id==='close_consults'):true)}'''));rev=d['revision'];save(page);check(label+' repeat save is idempotent',day(page)['revision']==rev)
      phase(page,'close');page.locator('#opSaveClosing').click();page.evaluate('''()=>{const k='grupo_saude_v4_demo_2',s=JSON.parse(localStorage.getItem(k));s.cash||=[];s.cash.push({clinic:'syn-composition',date:s.opDate,total:0,card:0,due:0,deposited:null,status:'A aguardar depósito'});localStorage.setItem(k,JSON.stringify(s))}''');page.locator('#opClose').click();check(label+' can close with actual composition and no fictitious activity',day(page)['closed'] and (rows>0 or day(page)['summary']==[]))
     page.evaluate('''()=>{const k='grupo_saude_v4_demo_2',s=JSON.parse(localStorage.getItem(k));s.opDate='2026-10-26';s.opPhase='open';localStorage.setItem(k,JSON.stringify(s));App.renderAll();App.showView('operation')}''');team(page,['test_med'],[]);numbers(page);save(page);team(page,['test_med'],['test_tec']);numbers(page);save(page);team(page,[],['test_tec']);numbers(page);save(page);team(page,[],[]);save(page);check('removing last professional requires reason without partial save',len([x for x in day(page)['open']['professionals'] if x.get('selected') is not False])==1);page.locator('#opAdministrativeReason').fill('SYN team left; only administrative work remains');save(page);d=day(page);check('team updates retain history and suspend all absent-specialty proposals',d['open']['administrativeOnly'] and len(d['history'])>=4 and len(d['marketingProposals'])==2 and all(x.get('teamAvailable') is False for x in d['marketingProposals']));check('active marketing excludes suspended proposals',page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return GSMarketingCore.proposals(s,{clinics:['syn-composition'],can:()=>true}).filter(x=>x.date==='2026-10-26').length===0}'''));check('no JS errors',not errors);page.screenshot(path=str(OUT/f'composition-{actor}-{device}-{theme}.png'),full_page=True);ctx.close()
 finally:
  browser.close();(OUT/'opening-composition-results.json').write_text(json.dumps({'cases':cases,'passed':sum(x['passed'] for x in cases),'failed':sum(not x['passed'] for x in cases),'scope':'Synthetic browser storage; emulated touch viewports, no real identity or providers'},indent=2))

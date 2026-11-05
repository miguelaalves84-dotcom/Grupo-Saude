"""Six-role document projection and mandatory roster approvals, synthetic loopback only."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/rh-20261022'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(7000);p.on('dialog',lambda d:d.dismiss());p.goto(URL);p.wait_for_function('window.GSAdministrativeRosters&&window.EmployeeDocumentsV4');p.wait_for_timeout(700)
     p.evaluate('''([k,actor,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;s.clinics=[{id:'syn-rh-a',name:'SYN RH A',active:true},{id:'syn-rh-b',name:'SYN RH B',active:true}];for(const x of [...s.users,...Object.values(s.employees||{})]){x.clinics=['syn-rh-a'];x.clinicIds=['syn-rh-a'];x.clinicId='syn-rh-a';x.clinic='syn-rh-a';x.hr={startTime:'09:00',endTime:'18:00',lunchStart:'13:00',lunchEnd:'14:00',documents:[]}}s.masterDocuments=Array.from({length:6},(_,i)=>({id:'syn-d'+i,name:'SYN Document '+i,dateRule:'none',active:true}));s.documentCatalog=s.masterDocuments;s.contractTypes=[{id:'syn-contract',name:'SYN Contract',items:s.masterDocuments.map((d,i)=>({id:'syn-i'+i,masterDocumentId:d.id,required:true}))}];for(const x of [...s.users,...Object.values(s.employees||{})])if(x.id===actor)x.hr.contractType='SYN Contract';s.employeeDocuments={[actor]:s.masterDocuments.slice(0,3).map((d,i)=>({id:'syn-existing'+i,employeeId:actor,masterDocumentId:d.id,name:d.name,status:'Pendente',fileName:'SYN.pdf',required:true}))};s.monthlyRosters={};s.timeOccurrences=[];s.leave=[];s.auditMarker='SYN KEEP';localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+actor,theme)}''',[K,actor,theme]);p.reload();p.wait_for_timeout(800)
     check('six requirements project from three stored documents without data mutation',p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s),before=JSON.stringify(s),rows=GSEmployeeDocuments.list(s,a,id),issues=GSEmployeeDocuments.issues(s,a,id);return rows.length===6&&issues.length===6&&rows.filter(x=>x.virtualRequirement).length===3&&JSON.stringify(s)===before}''',[K,actor]))
     p.evaluate('EmployeeDocumentsV4.overview()');check('all six document requirements visible in grouped modal',all('SYN Document '+str(i) in p.locator('#modalBody').inner_text() for i in range(6)));p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close());App.showView("myhr")')
     authorized=actor in ['test_adm','test_admin','u1'];check('roster button follows effective six-role permissions',p.locator('#rosterOpen-myhr').is_visible()==authorized)
     if authorized:
      if actor!='test_adm':
       p.select_option('#ceoAreaSelect','test_adm');p.wait_for_timeout(700)
      p.locator('#rosterOpen-myhr').click();p.locator('#rosterWeek').fill('2026-10-26');p.locator('#rosterWeek').dispatch_event('change')
      if actor!='test_adm':p.locator('#rosterEmployee').select_option('test_adm');p.locator('#rosterEmployee').dispatch_event('change')
      p.locator('[data-roster-day="2026-10-26"] [data-roster-field="startTime"]').fill('10:00');p.locator('#rosterReason').fill('SYN rotação semanal');p.locator('[data-gs-action="HRRostersV4.request"]').click()
      check('proposal is pending and attendance schedule unchanged',p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k)),r=s.timeOccurrences.find(x=>x.recordType==='roster-change'),u=GSAttendanceCore.people(s).find(x=>x.id==='test_adm');return r?.status==='Pendente'&&Object.keys(s.monthlyRosters).length===0&&GSAttendanceCore.schedule(s,u,'syn-rh-a','2026-10-26').startTime==='09:00'}''',K))
      p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k)),id=s.timeOccurrences.find(x=>x.recordType==='roster-change').id;s.currentUser='u1';s.ceoViewingAs=null;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'));HRRostersV4.decision(id)}''',K);check('approval starts without mandatory reason',p.locator('#rosterDecisionReason').input_value()=='');p.locator('[data-gs-action="HRRostersV4.decide"]').first.click();check('CEO approval applies schedule once with two history events',p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k)),r=s.timeOccurrences.find(x=>x.recordType==='roster-change'),u=GSAttendanceCore.people(s).find(x=>x.id==='test_adm');return r.status==='Aprovada'&&r.history.length===2&&GSAttendanceCore.schedule(s,u,'syn-rh-a','2026-10-26').startTime==='10:00'&&s.auditMarker==='SYN KEEP'}''',K))
     else:
      check('unauthorized role cannot submit administrative schedule',p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));try{GSAdministrativeRosters.command(s,AttendanceBookV4.actor(s),'request',{clinicId:'syn-rh-a',reason:'SYN',requestId:'forbidden',cells:[]});return false}catch{return true}}''',K))
     p.screenshot(path=str(OUT/(actor+'-'+device+'-'+theme+'.png')),full_page=True);check('responsive page width',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'));c.close()
 finally:
  (OUT/'rh-20261022-results.json').write_text(json.dumps(results,indent=2));b.close()

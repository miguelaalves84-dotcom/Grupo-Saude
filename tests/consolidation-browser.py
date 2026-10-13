"""Recovered entry points delegate to canonical guarded sources; no competing RH renderer."""
import os,json
from playwright.sync_api import sync_playwright
KEY='grupo_saude_v4_demo_2'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ['u1','test_admin','test_adm','test_med','test_tec','test_call']:
  context=browser.new_context(viewport={'width':820,'height':900});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(os.environ['GS_TEST_URL']);page.wait_for_function('window.V4EmployeeProfile && window.HRMasterV4');page.wait_for_timeout(600)
  page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k)),ids=s.clinics.filter(c=>c.active!==false&&!c.virtual&&!c.legacyDemo).slice(0,3).map(c=>c.id);for(const id of ['test_admin','test_adm','test_med','test_tec','test_call']){const u=s.users.find(x=>x.id===id);u.clinics=[ids[0]];if(s.employees[id])s.employees[id].clinics=[ids[0]];}s.users.push({id:'outside_recovery',name:'SYNTHETIC PRIVATE CLINIC',role:'TECNICO/A',active:true,clinics:[ids[2]]});s.employees.outside_recovery=s.users.at(-1);s.recoveredMarker={value:'PRESERVE LEGACY DATA'};localStorage.setItem(k,JSON.stringify(s));CEOReservedAreaV4.select(a==='u1'?'__CEO__':a);}''',[KEY,actor])
  manager=actor in ['u1','test_admin'];assert page.evaluate('V4ClinicHR.open()')==manager;assert page.evaluate('V4ClinicHR.hrTabs()')==manager;assert page.evaluate('V4EmployeeProfile.render()')==manager
  if manager:
   page.evaluate('App.showView("hr");V4EmployeeProfile.render()');assert 'Colaboradores' in page.locator('#hrContent').inner_text();assert ('SYNTHETIC PRIVATE CLINIC' in page.locator('#hrContent').inner_text())==(actor=='u1');name=page.evaluate('(a)=>HRLeaveV4.person(HRLeaveV4.read(),a).name',actor);assert page.evaluate('(q)=>V4EmployeeProfile.filter(q)',name);assert page.locator('#hr [data-search-item="employee"]:visible').count()>=1;page.evaluate('V4EmployeeProfile.filter("")')
  page.evaluate('(a)=>V4EmployeeProfile.open(a)',actor);assert page.locator('#modal').is_visible();assert 'Ficha central do colaborador' in page.locator('#modalBody').inner_text();page.evaluate('document.getElementById("modal").close();V4EmployeeProfile.open("outside_recovery")');assert page.locator('#modal').is_visible()==(actor=='u1');page.evaluate('document.getElementById("modal").close()');assert page.evaluate('HRLeaveV4.read().recoveredMarker.value')=='PRESERVE LEGACY DATA'
  assert page.evaluate('()=>[...document.scripts].every(s=>!s.src.includes("v4-hr-employee-profile"))');assert not errors,errors;print('PASS consolidation: canonical recovery aliases, scope, records and no legacy renderer',actor);context.close()
 browser.close()

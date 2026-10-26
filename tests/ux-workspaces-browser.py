"""Exercise the new information architecture through real controls, with synthetic records only."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-ux'));OUT.mkdir(parents=True,exist_ok=True)
rows=[];scope={}
def check(case,passed):
 row={**scope,'case':case,'passed':bool(passed)};rows.append(row);print(json.dumps(row),flush=True);assert passed,row
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('tablet',1280,800),('desktop',1440,1000),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope=dict(actor=actor,device=device,theme=theme);c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(9000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss());p.goto(URL);p.wait_for_function('window.WorkspaceShellV4&&window.HRMasterV4&&window.GSDemoClinicAssociations');p.wait_for_timeout(350);p.evaluate((ROOT/'tests/fixtures/synthetic-executive-state.js').read_text(),[K,actor,theme]);p.reload();p.wait_for_timeout(500)
     manager=actor in ['u1','test_admin'];check('Dashboard respects effective role',p.evaluate('RoleAccessAdminV4.guard("dashboard")')==manager)
     if p.evaluate('RoleAccessAdminV4.guard("hr")'):
      p.evaluate('App.showView("hr");V4ClinicHR.showEmployees()');p.wait_for_selector('#hrEmployeeSearch');p.wait_for_function('document.querySelectorAll("#hr .gs-search-input").length===1');check('single employee search',p.locator('#hr .gs-search-input').count()==1)
      total=p.locator('[data-search-item=employee]').count();check('employee list immediately available',total>0 and p.locator('#hrEmployeeSearch').is_visible())
      p.locator('#hrEmployeeSearch').fill('zz-inexistente');check('useful no-result state',p.locator('#hrEmployeeEmpty').is_visible() and p.locator('[data-search-item=employee]:visible').count()==0)
      p.locator('#hrEmployeeSearch').fill('SYN');check('typing and clearing search restores rows',p.locator('[data-search-item=employee]:visible').count()==total)
      p.locator('#hrEmployeeSearch').fill('');p.locator('#hrEmployeeStatus').select_option('active');check('active filter matches records',p.locator('[data-search-item=employee]:visible').evaluate_all('(rs)=>rs.every(r=>r.dataset.employeeStatus==="active")'))
      clinic=p.locator('#hrEmployeeClinic option').nth(1).get_attribute('value');p.locator('#hrEmployeeClinic').select_option(clinic);check('clinic filter composes with status',p.locator('[data-search-item=employee]:visible').evaluate_all('(rs)=>rs.every(r=>JSON.parse(r.dataset.employeeClinics).includes(document.getElementById("hrEmployeeClinic").value))'))
      p.locator('#hrEmployeeClinic').select_option('');p.locator('#hrEmployeeStatus').select_option('');person=p.locator('[data-search-item=employee]:visible').first;name=person.locator('strong').inner_text();person.click();p.wait_for_selector('#employeeWorkspace');check('real employee action opens full workspace',p.locator('#employeeWorkspace h1').inner_text()==name and not p.locator('#modal').evaluate('(e)=>e.open'))
      check('no duplicate employee tabs',p.locator('.employee-tabs button').count()==len(set(p.locator('.employee-tabs button').all_text_contents())))
      p.get_by_role('button',name='Dados pessoais e contrato',exact=True).click();p.wait_for_selector('#employeeWorkspace #hrName');check('canonical form retained on page',p.locator('#hrName').input_value()==name and p.locator('#employeeWorkspace').evaluate('(e)=>e.getBoundingClientRect().width>innerWidth*.65' if device=='mobile' else '(e)=>e.getBoundingClientRect().width>(innerWidth-264)*.8'))
      old=p.locator('#hrName').input_value();p.locator('#hrName').fill(old+' Edição');p.get_by_role('button',name='Resumo',exact=True).click();check('cancelled navigation preserves unsaved values',p.locator('#hrName').input_value()==old+' Edição')
      # Accept discarding only after the negative case has demonstrated recovery.
      p.evaluate('window.confirm=()=>true');p.get_by_role('button',name='Resumo',exact=True).click();check('summary remains source-based',p.locator('#employeeWorkspace').inner_text().find('Ficha central do colaborador')>=0)
      p.get_by_role('button',name='Documentos',exact=True).click();check('existing protected document editor reused',p.locator('#modal').evaluate('(e)=>e.open'))
      p.locator('#modal .modal-head button').click();p.get_by_role('button',name='← Voltar à lista',exact=True).click();check('back restores original list',p.locator('#hrEmployeeSearch').is_visible() and p.locator('#employeeWorkspace').count()==0)
     else:check('management HR remains prohibited',not p.evaluate('App.showView("hr")') and p.locator('#employeeWorkspace').count()==0)
     for view in ['operation','agenda','stock','marketing','chat','complaints','finance','tables']:
      if not p.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):continue
      p.evaluate('(v)=>App.showView(v)',view);p.wait_for_timeout(180)
      if view=='operation':
       check('operation stepper uses original authorised phases',p.locator('.operation-steps button').count()>0)
       if p.evaluate('RoleAccessAdminV4.can("openClinic")'):
        p.evaluate('App.setPhase("open")');p.wait_for_timeout(100);check('touch team selection exists',p.locator('[data-team-picker]').count()>0)
        before=p.evaluate('(k)=>localStorage.getItem(k)',K);box=p.locator('[data-team-picker]').first;box.set_checked(not box.is_checked());check('touch preview creates no permanent opening',p.evaluate('(k)=>JSON.stringify(JSON.parse(localStorage.getItem(k)).days)',K)==json.dumps(json.loads(before)['days'],separators=(',',':'),ensure_ascii=False))
      if view=='agenda':check('clinic and colleague filters immediately visible',p.locator('#agendaFilters select[name=clinicId]').is_visible() and p.locator('#agendaFilters select[name=ownerId]').is_visible())
      if view=='stock':check('stock navigation grouped without duplicated controllers',p.locator('.module-tabs .ux-navigation-group').count()>0 and p.locator('[data-stock-action=tab]').count()==len(set(p.locator('[data-stock-action=tab]').evaluate_all('(bs)=>bs.map(b=>b.dataset.stockId)'))))
      if view=='marketing':check('marketing topics grouped',p.locator('.marketing-tabs .ux-navigation-group').count()==4)
      check(view+' no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
      if actor=='u1' and device=='tablet':p.screenshot(path=str(OUT/f'ux-{view}-{theme}.png'))
     check('no JavaScript exceptions',not errors);c.close()
 finally:
  b.close();(OUT/'ux-workspaces-results.json').write_text(json.dumps({'checks':len(rows),'failures':sum(not r['passed'] for r in rows),'results':rows,'scope':'Synthetic Chromium touch emulation, not a physical Android certification'},ensure_ascii=False,indent=2))

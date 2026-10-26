"""Behavioral searches over actual authorised rendered records; no remote services."""
import json,os,re,unicodedata,runpy
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/search-audit'));OUT.mkdir(parents=True,exist_ok=True)
verify_populated=runpy.run_path(str(Path(__file__).parent/"search-populated.py"))["verify_populated"]
results=[];inventory=[]
def check(name,ok,**extra):
 row={**scope,'test':name,'passed':bool(ok),**extra};results.append(row);assert ok,row
def norm(s):return ''.join(x for x in unicodedata.normalize('NFD',s) if not unicodedata.combining(x)).lower().strip()
RECORDS='[data-search-item="employee"],table tbody tr,.clinic-master-row,.kanban-card,.candidate-card,.funnel-card,.task-card,.task-row,.conversation,.audit-item,.audit-line,.list-item,.compliance-row,[data-search-item],.card .row,#tablesContent .cards > .card'
def reproduce_baseline(browser):
 c=browser.new_context(viewport={'width':820,'height':1180},has_touch=True,is_mobile=True,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());source=(Path(__file__).parent/'fixtures/agenda-search-6744ab7.js').read_text();c.route('**/agenda-ui-v4.js',lambda r:r.fulfill(status=200,content_type='application/javascript',body=source));p=c.new_page();p.goto(URL);p.wait_for_function('window.AgendaUIV4&&window.GSAgenda');p.wait_for_timeout(600)
 p.evaluate('''k=>{let s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoViewingAs=null;s.agendaEvents=[];const a=AttendanceBookV4.actor(s);s=GSAgenda.command(s,a,'save',{ownerId:'u1',clinicId:'',title:'SYN Pesquisa Évora',location:'SYN Águeda',date:GSAttendanceCore.day(),time:'09:00',duration:30,revision:0,requestId:'synthetic-search-baseline'}).state;localStorage.setItem(k,JSON.stringify(s));App.showView('agenda');AgendaUIV4.reset()}''',K)
 search=p.locator('#agendaFilters [name=search]');search.fill('zzzz-no-result');assert p.locator('[data-agenda-action=detail]').count()==1,'Baseline should reproduce missing input binding';p.screenshot(path=str(OUT/'baseline-6744ab7-tablet-search-not-applied.png'));p.locator('#agendaFilters button').click();assert p.locator('[data-agenda-action=detail]').count()==0;assert p.locator('#agendaContent p[role=status]').inner_text().startswith('1 marcações'),'Baseline counter bug';search.fill('');assert p.locator('[data-agenda-action=detail]').count()==0,'Baseline native clear bug';search.fill('evora');p.locator('#agendaFilters button').click();assert p.locator('[data-agenda-action=detail]').count()==0,'Baseline accent bug';search.fill('Évora');p.locator('#agendaFilters button').click();assert p.locator('[data-agenda-action=detail]').count()==1;c.close();return {'source':'6744ab7','viewport':'820x1180 touch','reproduced':['missing input binding','stale count','clear not applied','accent mismatch'],'method':'Original Agenda UI fixture with current domain and synthetic personal event; not a full historical deployment'}
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox']);baselineProof=reproduce_baseline(b);clockBaseline=runpy.run_path(str(Path(__file__).parent/"search-populated.py"))["reproduce_clock_baseline"](b,URL,ORIGIN,K,OUT)
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);p.goto(URL);p.wait_for_function('window.GSSearchV4&&window.RoleAccessAdminV4');p.wait_for_timeout(500)
     p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme]);p.reload();p.wait_for_timeout(700)
     views=p.locator('#nav [data-view]').evaluate_all('(xs)=>[...new Set(xs.map(x=>x.dataset.view))]')
     if 'finance' not in views:views.append('finance')
     for view in views:
      scope['view']=view
      if not p.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):continue
      p.evaluate('(v)=>App.showView(v)',view);p.wait_for_timeout(250);p.evaluate('GSSearchV4.refresh()');root=p.locator('main .view.active');check('requested authorised destination',root.get_attribute('id')==view)
      fields=root.locator('input[type=search],input[placeholder*="Nome ou função"]');inventory.append({**scope,'fields':fields.evaluate_all('(xs)=>xs.map(x=>({id:x.id,name:x.name,placeholder:x.placeholder,visible:!!x.getClientRects().length}))')})
      for field,selector in [('#clinicDocumentSearch','[data-clinic-document-row]'),('#financeSearch','[data-fin-row]'),('#attendanceSearch','#clockContent .card:has(h3:text-matches("^Equipa")) .row')]:
       native=root.locator(field)
       if native.count()!=1 or not native.is_visible():continue
       records=root.locator(selector);before=records.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')
       if not before:inventory.append({**scope,'field':field,'status':'No populated records; positive search not tested'});continue
       text=records.first.get_attribute('data-clinic-document-row') or (records.first.locator('b,strong').first.inner_text() if records.first.locator('b,strong').count() else records.first.inner_text());terms=re.findall(r'[\wÀ-ÿ]{2,}',text)
       if not terms:continue
       native.fill(norm(terms[0]).upper());check(field+' case accent partial match',records.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')>0)
       native.fill('zzzz-no-native-match-98247');check(field+' no results',records.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')==0)
       native.fill('');check(field+' clear restores',records.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')==before)
      if root.locator('#dashSearch').count() and p.locator('#dashPeriodToggle').count():p.locator('#dashPeriodToggle').click()
      dashboard=root.locator('#dashSearch')
      if dashboard.count():
       options=root.locator('#dashClinic option[value]:not([value=""])');total=options.count()
       if total:
        term=options.first.inner_text();dashboard.fill(norm(term).upper());check('dashboard clinic option match',options.evaluate_all('(xs)=>xs.some(x=>!x.hidden)'));dashboard.fill('zzzz-no-clinic');check('dashboard no matching option',options.evaluate_all('(xs)=>xs.every(x=>x.hidden)'));dashboard.fill('');check('dashboard clear',options.evaluate_all('(xs)=>xs.every(x=>!x.hidden)'))
      person_search=root.locator('#financePersonSearch')
      if person_search.count():
       choices=root.locator('#financeQuery [name=employeeId] option');before=choices.count();choice=root.locator('#financeQuery [name=employeeId] option:not([value="*"])').first;term=choice.inner_text().strip();target=choice.get_attribute('value')
       person_search.fill(norm(term).upper());check('finance authorised person option match',choice.evaluate('(o)=>!o.hidden'));person_search.fill('zzzz-no-finance-person');check('finance no person match',choices.evaluate_all('(xs)=>xs.every(x=>x.hidden)'));person_search.fill('');check('finance person clear preserves options',choices.count()==before and choices.evaluate_all('(xs)=>xs.every(x=>!x.hidden)'))
       p.evaluate('''()=>{const call=FinanceDemoV4.call;window.__searchStatementProof=[];FinanceDemoV4.call=async function(action,body){const result=await call(action,body);if(action==='statement')window.__searchStatementProof.push({requested:body.employeeId,returned:result.employeeId});return result}}''');root.locator('#financeQuery [name=employeeId]').select_option(target);root.locator('#financeQuery [type=submit]').click();p.wait_for_function('window.__searchStatementProof.length>0');check('person selection opens actual matching statement',p.evaluate('(id)=>window.__searchStatementProof.some(x=>x.requested===id&&x.returned===id)',target))
      search=root.locator('.gs-search-input')
      if search.count()!=1 or not search.is_visible():continue
      rows=root.locator('[data-search-item=employee]' if view=='hr' else RECORDS);baseline=rows.count();visible_before=rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')
      search.fill('zzzz-synthetic-no-match-98247');expect(root.locator('.gs-search-empty')).to_be_visible();check('no results hides indexed records',(root.locator('[data-search-item=employee][hidden]').count()>0 if view=='hr' else root.locator('[data-gs-search-hidden]').count()>0) or baseline==0)
      root.locator('.gs-search-clear').click();check('clear restores visible records',rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')==visible_before)
      term=None
      for row in rows.all():
       if not row.is_visible():continue
       text=row.locator('strong,b').first.inner_text() if row.locator('strong,b').count() else row.inner_text()
       tokens=re.findall(r'[\wÀ-ÿ]{4,}',text)
       if tokens:term=tokens[0][:8];break
      if term:
       search.fill(norm(term).upper());check('partial case accent tolerant match',root.locator('[data-gs-search-hidden]').count()<baseline)
       search.fill('');check('native clear restores records',rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')==visible_before)
      if view=='hr' and root.locator('[data-search-item=employee]').count():
       search.fill('zzzz-no-rerender-match');p.evaluate('V4ClinicHR.showEmployees()');p.wait_for_timeout(80);check('HR rerender reapplies query without removing records',root.locator('[data-search-item=employee]:visible').count()==0);search.fill('');check('HR clear after rerender recovers all records',root.locator('[data-search-item=employee]:visible').count()>0)
      if view=='hr' and rows.count():
       employee=root.locator('[data-search-item=employee]').first
       if employee.count():
        name=employee.locator('strong').inner_text();employee.click();expect(p.locator('#employeeWorkspace')).to_be_visible();check('search result opens matching employee workspace',p.locator('#employeeWorkspace h1').inner_text()==name);p.get_by_role('button',name='← Voltar à lista',exact=True).click()
      p.screenshot(path=str(OUT/(actor+'-'+device+'-'+theme+'-'+view+'-search.png')))
     check('navigation has one test-agent destination',p.locator('#nav #gsTestAgentButton').count()==0 and p.locator('#shortcut_testAgent').count()==1 and p.locator('#shortcut_testAgent').evaluate('(b)=>!b.hidden')==p.evaluate('RoleAccessAdminV4.can("settings")'))
     verify_populated(p,actor,K,check,scope)
     c.close()
 finally:
  b.close();(OUT/'search-results.json').write_text(json.dumps({'baseline':baselineProof,'clockBaseline':clockBaseline,'checks':results,'inventory':inventory,'limitations':['Default authorised records; unseeded subareas are not proof of populated-data searches.','External authentication and central persistence are not activated.']},ensure_ascii=False,indent=2))
print(json.dumps({'checks':len(results),'failed':sum(not x['passed'] for x in results),'inventoried_views':len(inventory)}))

"""Behavioral searches over actual authorised rendered records; no remote services."""
import json,os,re,unicodedata
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/search-audit'));OUT.mkdir(parents=True,exist_ok=True)
results=[];inventory=[]
def check(name,ok,**extra):
 row={**scope,'test':name,'passed':bool(ok),**extra};results.append(row);assert ok,row
def norm(s):return ''.join(x for x in unicodedata.normalize('NFD',s) if not unicodedata.combining(x)).lower().strip()
RECORDS='[data-search-item="employee"],table tbody tr,.clinic-master-row,.kanban-card,.candidate-card,.funnel-card,.task-card,.task-row,.conversation,.audit-item,.audit-line,.list-item,[data-search-item]'
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);p.goto(URL);p.wait_for_function('window.GSSearchV4&&window.RoleAccessAdminV4');p.wait_for_timeout(500)
     p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme]);p.reload();p.wait_for_timeout(700)
     views=p.locator('#nav [data-view]').evaluate_all('(xs)=>[...new Set(xs.map(x=>x.dataset.view))]')
     for view in views:
      scope['view']=view
      if not p.evaluate('(v)=>RoleAccessAdminV4.guard(v)',view):continue
      p.evaluate('(v)=>App.showView(v)',view);p.wait_for_timeout(250);p.evaluate('GSSearchV4.refresh()');root=p.locator('main .view.active');check('requested authorised destination',root.get_attribute('id')==view)
      fields=root.locator('input[type=search],input[placeholder*="Nome ou função"]');inventory.append({**scope,'fields':fields.evaluate_all('(xs)=>xs.map(x=>({id:x.id,name:x.name,placeholder:x.placeholder,visible:!!x.getClientRects().length}))')})
      search=root.locator('.gs-search-input')
      if search.count()!=1 or not search.is_visible():continue
      rows=root.locator(RECORDS);baseline=rows.count();visible_before=rows.evaluate_all('(xs)=>xs.filter(x=>x.getClientRects().length).length')
      search.fill('zzzz-synthetic-no-match-98247');expect(root.locator('.gs-search-empty')).to_be_visible();check('no results hides indexed records',root.locator('[data-gs-search-hidden]').count()>0 or baseline==0)
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
      if view=='hr' and rows.count():
       employee=root.locator('[data-search-item=employee]').first
       if employee.count():employee.click();expect(p.locator('#modal')).to_be_visible();check('search result opens employee record',p.locator('#modalBody').inner_text().strip()!='');p.locator('#modal').evaluate('(d)=>d.close()')
      p.screenshot(path=str(OUT/(actor+'-'+device+'-'+theme+'-'+view+'-search.png')))
     c.close()
 finally:
  b.close();(OUT/'search-results.json').write_text(json.dumps({'checks':results,'inventory':inventory,'limitations':['Default authorised records; unseeded subareas are not proof of populated-data searches.','External authentication and central persistence are not activated.']},ensure_ascii=False,indent=2))
print(json.dumps({'checks':len(results),'failed':sum(not x['passed'] for x in results),'inventoried_views':len(inventory)}))

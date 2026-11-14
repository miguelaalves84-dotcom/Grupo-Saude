"""Global layout corrections: real Chromium, synthetic DOM and loopback only."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from audit_visual import inspect
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');BASE=URL.rsplit('/',1)[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/global-layout'));OUT.mkdir(parents=True,exist_ok=True);rows=[];scope={}
def check(name,value):
 rows.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(rows[-1]),flush=True);assert value,name
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('compact-tablet',700,1000),('mobile',390,844)]:
   for theme in ['light','dark']:
    scope={'device':device,'theme':theme};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE+'/') else r.abort());p=c.new_page();p.on('dialog',lambda d:d.dismiss());p.goto(URL);p.wait_for_function('window.WorkspaceShellV4&&window.FinanceUIV4&&window.HRMasterV4');p.wait_for_timeout(1100);p.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    if w<=760:
     check('menu trigger available throughout mobile breakpoint',p.locator('#menuBtn').is_visible());p.locator('#menuBtn').click();g=p.locator('#nav details[data-nav-group="Área pessoal"]');g.locator('summary').click() if not g.evaluate('(e)=>e.open') else None;p.locator('#nav [data-view="myhr"]').click();check('compact navigation opens selected page',p.locator('#myhr').evaluate('(e)=>e.classList.contains("active")'))
    p.evaluate('FinanceUIV4.open("account")');p.wait_for_timeout(200);p.screenshot(path=str(OUT/f'after-finance-{device}-{theme}.png'),full_page=True);issues=inspect(p);check('finance filters cards and controls remain inside viewport',not [x for x in issues if x['kind'] in ['horizontal-clipping','overlapping-controls','button-text-clipping']]);check('financial status and labels have audited contrast',not [x for x in issues if x['kind']=='contrast']);check('financial tables retain horizontal scrolling',p.locator('#financeContent .table-wrap').evaluate_all('(es)=>es.every(e=>getComputedStyle(e).overflowX==="auto")'))
    p.evaluate('FinanceUIV4.open("manage")');p.wait_for_timeout(150);p.screenshot(path=str(OUT/f'after-finance-management-{device}-{theme}.png'),full_page=True);check('management controls remain reachable',not [x for x in inspect(p) if x['kind'] in ['horizontal-clipping','overlapping-controls','button-text-clipping']]);p.evaluate('HRMasterV4.open("u1","dados")');p.wait_for_timeout(50);check('dialog fits viewport',p.locator('dialog[open]').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight}'));check('dialog close control stays visible',p.locator('#modal .modal-head [aria-label="Fechar"]').is_visible());p.screenshot(path=str(OUT/f'after-dialog-{device}-{theme}.png'),full_page=True);p.locator('#modal .modal-head [aria-label="Fechar"]').click();check('dialog closes through its real control',p.locator('dialog[open]').count()==0);c.close()
 finally:
  (OUT/'global-layout-results.json').write_text(json.dumps(rows,indent=2));b.close()
print(json.dumps({'passed':len(rows),'failed':0}))

"""«Ir para…» (Ctrl+K, recentes, sinónimos, pessoas), cabeçalho do telemóvel numa linha, clínica escolhida só no cabeçalho
e Tabela de acordos em grelha (edição com teclado; só consulta para quem não gere)."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/navigation-sheet'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
def ctx(b,w,h,mob):
 c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.on('dialog',lambda d:d.accept());return c,p,errs
def login(p,user,extra=''):
 p.goto(URL);p.wait_for_function('window.App&&window.AgreementsV4');p.evaluate('''([k,u,x])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=null;if(x==='reset')s.agreements={};localStorage.setItem(k,JSON.stringify(s))}''',[K,user,extra]);p.reload();p.wait_for_function('window.App&&window.AgreementsV4');p.wait_for_timeout(500)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  scope={'part':'ir-para','device':'desktop'};c,p,errs=ctx(b,1366,900,False);login(p,'u1')
  for v in ['hr','agenda']:p.evaluate('v=>App.showView(v)',v);p.wait_for_timeout(150)
  p.locator('main').click(position={'x':5,'y':5});p.keyboard.press('Control+k');p.wait_for_timeout(200)
  check('Ctrl+K focuses Ir para',p.evaluate('document.activeElement.id')=='workspaceSearch')
  check('recent screens listed first',p.locator('#workspaceSearchResults .gs-go-item').first.inner_text().startswith('Agenda'))
  p.keyboard.type('ferias');p.wait_for_timeout(150);check('everyday words find screens',p.locator('#workspaceSearchResults .gs-go-item').first.inner_text().startswith('Férias'))
  p.fill('#workspaceSearch','');p.keyboard.type('tecnico t');p.wait_for_timeout(150);check('people found for HR managers','Técnico Teste' in p.locator('#workspaceSearchResults').inner_text())
  p.keyboard.press('ArrowDown');check('arrow moves into results',p.evaluate('document.activeElement.classList.contains("gs-go-item")'))
  p.keyboard.press('Enter');p.wait_for_timeout(400);check('Enter opens the employee sheet',p.locator('#hrName').count()==1)
  p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.fill('#workspaceSearch','zz-nada');check('empty result message',p.locator('#workspaceSearchResults').inner_text().startswith('Sem módulos'))
  p.evaluate('App.showView("hr")');p.wait_for_timeout(300);check('exactly one clinic filter visible on desktop (header)',p.locator('#workspaceClinic').is_visible() and not p.locator('#hrEmployeeClinic').is_visible())
  check('no JS errors',not errs);c.close()
  scope={'part':'ir-para','device':'mobile'};c,p,errs=ctx(b,390,844,True);login(p,'u1');p.evaluate('App.showView("hr")');p.wait_for_timeout(300)
  tops=p.evaluate('[...document.querySelectorAll(".topbar .workspace-location,.topbar #menuBtn,.topbar .gs-official-logo,.topbar #topbarMore")].map(e=>Math.round(e.getBoundingClientRect().top))')
  check('phone header on one line',max(tops)-min(tops)<24)
  check('exactly one clinic filter visible on phone (page)',p.locator('#hrEmployeeClinic').is_visible() and not p.locator('#workspaceClinic').is_visible())
  check('official logo visible on phone',p.locator('.topbar .gs-official-logo').is_visible());p.click('#topbarMore');p.locator('#workspaceSearch').click();p.keyboard.type('caixa');p.wait_for_timeout(200);check('phone search finds Caixas','Caixas' in p.locator('#workspaceSearchResults').inner_text())
  check('results inside the screen',p.evaluate('(()=>{const r=document.getElementById("workspaceSearchResults").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()'))
  check('no page overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'));c.close()
  for device,w,h,mob in [('desktop',1366,900,False),('mobile',390,844,True)]:
   scope={'part':'grelha','device':device};c,p,errs=ctx(b,w,h,mob);login(p,'u1','reset');p.evaluate('App.showView("agreements")');p.wait_for_timeout(300);H='#agreementsContent '
   if p.locator(H+'.ag-sheet-box').get_attribute('open') is None:p.locator(H+'.ag-sheet-box>summary').click()
   for n in ['Médis','ADSE']:p.fill(H+'[data-ag-addag] input[name=name]',n);p.click(H+'[data-ag-addag] button')
   for k,l in [('consulta','Consulta de Fisiatria'),('tratamento','Sessão de fisioterapia')]:p.select_option(H+'[data-ag-addact] select[name=kind]',k);p.fill(H+'[data-ag-addact] input[name=label]',l);p.click(H+'[data-ag-addact] button')
   check('grid is the default view: one row per agreement, one column per act',p.locator(H+'table.ag-sheet').count()==1 and p.locator(H+'.ag-row-head').count()==2 and p.locator(H+'[data-ag-cell]').count()==4)
   p.locator(H+'[data-ag-cell][data-r="0"][data-c="0"]').click();p.keyboard.type('35');p.keyboard.press('Tab');p.keyboard.type('28,5');p.keyboard.press('Enter');p.wait_for_timeout(200)
   check('keyboard keeps working after each save',p.evaluate('[document.activeElement.dataset.r,document.activeElement.dataset.c]')==['1','1'])
   p.keyboard.press('ArrowLeft');p.keyboard.press(' ');p.wait_for_timeout(200)
   st=p.evaluate('k=>JSON.parse(localStorage.getItem(k)).agreements',K);flat={a['name']:{l['label']:(l['prices'][-1]['cents'] if l['prices'] else 'covered') for l in a['lines']} for v in st.values() for a in v}
   check('prices saved in the right agreement and act',flat.get('ADSE',{}).get('Consulta de Fisiatria')==3500 and flat.get('ADSE',{}).get('Sessão de fisioterapia')==2850)
   check('space marks «covers, price to fill» (✓)',flat.get('Médis',{}).get('Consulta de Fisiatria')=='covered' and p.locator(H+'[data-ag-cell][data-r="1"][data-c="0"]').inner_text().strip()=='✓')
   p.keyboard.press('Delete');p.wait_for_timeout(200);st=p.evaluate('k=>JSON.parse(localStorage.getItem(k)).agreements',K);flat={a['name']:{l['label'] for l in a['lines']} for v in st.values() for a in v}
   check('delete = does not cover',('Consulta de Fisiatria' not in flat.get('Médis',set())))
   p.locator(H+'[data-ag-cell][data-r="1"][data-c="1"]').click();p.keyboard.type('abc');p.keyboard.press('Enter');p.wait_for_timeout(200);p.keyboard.press('Escape')
   check('invalid value refused (nothing saved)','Sessão de fisioterapia' not in flat.get('Médis',set()))
   p.locator(H+'[data-ag-cell][data-r="0"][data-c="1"]').focus();p.keyboard.press(' ');p.keyboard.press(' ');p.wait_for_timeout(200)
   p.locator(H+'[data-ag-cell][data-r="0"][data-c="0"]').focus();p.keyboard.press('/');p.wait_for_timeout(200)
   check('«/» marks value per medical act in the cell',p.locator(H+'[data-ag-cell][data-r="0"][data-c="0"]').inner_text().replace(chr(10),'').strip().endswith('/ato'))
   p.locator(H+'[data-ag-edit]').first.click();p.fill('#agEditor [name=notes]','SYN nota');p.click('#agEditor button[type=submit]');p.wait_for_timeout(200)
   st=p.evaluate('k=>JSON.parse(localStorage.getItem(k)).agreements',K);ads=[a for v in st.values() for a in v if a['name']=='ADSE'][0]
   check('notes editor keeps prices and coverage',ads.get('notes')=='SYN nota' and len(ads['lines'])==2 and all(l['prices'] for l in ads['lines']))
   check('only one search in the screen',p.locator('#agreements .gs-search-wrap').count()==0)
   check('no page overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
   if device=='desktop':p.screenshot(path=str(OUT/'grelha.png'))
   check('no JS errors',not errs);c.close()
  scope={'part':'grelha','device':'call-center'};c,p,errs=ctx(b,1366,900,False);login(p,'u1')
  p.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));s.agreements=a;s.currentUser='test_call';s.ceoViewingAs=null;localStorage.setItem(k,JSON.stringify(s))}''',[K,st]);p.reload();p.wait_for_function('window.AgreementsV4');p.wait_for_timeout(400);p.evaluate('App.showView("agreements")');p.wait_for_timeout(300)
  check('read-only grid: no editable cells nor tools',p.locator('#agreementsContent [data-ag-cell]').count()==0 and p.locator('#agreementsContent .ag-sheet-box').count()==0)
  rows=[x.strip().split(chr(10))[0] for x in p.locator('#agreementsContent .ag-row-head').all_inner_texts()];check('read-only grid shows only agreements that cover something',rows==['ADSE'])
  c.close()
 finally:
  (OUT/'navigation-sheet-results.json').write_text(json.dumps(results,indent=2));b.close()

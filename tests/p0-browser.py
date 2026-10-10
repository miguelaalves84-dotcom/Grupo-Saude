"""P0 regression against an isolated local server. Synthetic data and mocked identity only."""
import os,json
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html')
BASE=URL.rsplit('/',1)[0]
KEY='grupo_saude_v4_demo_2'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1280,'height':900})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);page.wait_for_timeout(900)
 payload="c1');window.__p0XSS=1;//"
 name='Synthetic <img src=x onerror="window.__p0XSS=2"> & \'quoted\''
 page.evaluate('''([key,id,name])=>{window.__p0XSS=0;const s=JSON.parse(localStorage.getItem(key));s.clinics.push({id,name,active:true,phones:[],gps:{radius:50},ers:{}});localStorage.setItem(key,JSON.stringify(s));App.showView('clinics');ClinicMasterV4.render();}''',[KEY,payload,name])
 row=page.locator('.clinic-master-row').filter(has_text=name)
 expect(row).to_have_count(1);row.locator('button').click()
 expect(page.locator('#cmName')).to_have_value(name)
 assert page.evaluate('window.__p0XSS')==0
 page.locator('[data-cm-action="save"]').click()
 page.evaluate('ClinicMasterV4.render()')
 row=page.locator('.clinic-master-row').filter(has_text=name);row.focus();page.keyboard.press('Enter')
 expect(page.locator('#cmName')).to_have_value(name)
 page.locator('#modal .modal-head button').click()
 # Shared dispatcher receives strings as JSON data, including imports and document-like fields.
 page.evaluate('''()=>{window.__p0Seen=[];const original=HRMasterV4.open;HRMasterV4.open=(...args)=>window.__p0Seen.push(args);const box=document.createElement('div');box.id='p0-actions';document.body.append(box);for(const value of ["x');window.__p0XSS=3;//",'\"><img src=x onerror=window.__p0XSS=4>',"document&'\\\"<>"]){const b=document.createElement('button');b.textContent=value;box.insertAdjacentHTML('beforeend','<button '+GSSafeActionsV4.attrs('HRMasterV4.open',[value,'docs'])+'>Sintético</button>');}window.__p0Original=original;}''')
 for b in page.locator('#p0-actions button').all():b.click()
 assert page.evaluate('window.__p0XSS')==0
 assert len(page.evaluate('window.__p0Seen'))==3
 page.reload();page.wait_for_timeout(900)
 assert page.evaluate('window.__p0XSS||0')==0
 assert not errors,errors
 print('PASS P0 browser: manipulated clinic ID/name, modal save, keyboard, shared document/import payloads, repeated render and reload')
 context.close()
 # Fake local CEO identity must never authenticate the protected shell.
 roles=['CEO','Administração','Administrativa','Médico/a','Técnico/a','Call Center']
 for role in roles:
  c=browser.new_context();pg=c.new_page()
  pg.add_init_script("localStorage.setItem('fake-session',JSON.stringify({role:'CEO',active:true}));")
  pg.route('**/api/auth?action=session',lambda route:route.fulfill(status=401,json={'error':'Sessão inválida'}))
  pg.goto(BASE+'/authenticated.html');expect(pg.locator('#sessionModules')).to_be_hidden()
  assert pg.evaluate("typeof window.App==='undefined'")
  pg.unroute('**/api/auth?action=session')
  pg.route('**/api/auth?action=session',lambda route,request,r=role:route.fulfill(json={'user':{'id':'synthetic-'+r,'name':'Synthetic','role':r,'permissions':{'account':True}},'status':'Autenticado'}))
  pg.reload();expect(pg.locator('#sessionModules')).to_be_visible();expect(pg.locator('#sessionStatus')).to_contain_text(role)
  pg.unroute('**/api/auth?action=session')
  pg.route('**/api/auth?action=session',lambda route:route.fulfill(status=401,json={'error':'Sessão expirada'}))
  pg.evaluate('GSSessionV4.refresh().catch(()=>{})');expect(pg.locator('#sessionModules')).to_be_hidden()
  c.close();print('PASS P0 browser: '+role+' mocked session, local identity rejection and expiry')
 browser.close()
print(json.dumps({'groups':7,'failed':0,'external_identity':'BLOCKED; provider mocked, no real credentials'}))

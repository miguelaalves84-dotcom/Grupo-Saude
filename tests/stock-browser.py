"""Real browser UI with synthetic stock only; server behavior has separate real PostgreSQL coverage."""
import os,json
from playwright.sync_api import sync_playwright,expect
KEY='grupo_saude_v4_demo_2'
ACTORS=['u1','test_admin','test_adm','test_call','test_med','test_tec']
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ACTORS:
  c=browser.new_context(viewport={'width':1280,'height':900});page=c.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(os.environ['GS_TEST_URL']);page.wait_for_function('window.StockUIV4 && window.GSModuleDemo')
  page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key)),cid=s.clinics.find(c=>c.active!==false&&!c.virtual&&!c.legacyDemo&&c.operational!==false).id;s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;s.users.find(p=>p.id===actor).clinics=[cid];if(s.employees?.[actor])s.employees[actor].clinics=[cid];s.stockLedgers={};localStorage.setItem(key,JSON.stringify(s));}''',[KEY,actor]);page.reload();page.wait_for_function('window.StockUIV4 && document.getElementById("stock")')
  page.evaluate("App.showView('stock')");expect(page.locator('#stockClinic')).to_be_visible();cid=page.locator('#stockClinic').input_value()
  assert page.locator('#nav [data-view="stock"]').count()==1
  manager=actor in ['u1','test_admin'];assert bool(page.locator('#stockContent [data-stock-action="product-save"]').count())==manager
  if manager:
   page.locator('[data-stock-action="tab"][data-stock-id="settings"]').click();page.locator('[data-stock-action="category-save"]').click();page.locator('#stockForm [name="name"]').fill('Consumíveis sintéticos');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="tab"][data-stock-id="inventory"]').click();page.locator('[data-stock-action="product-save"]').click()
   for name,value in [('name','Luvas sintéticas'),('reference','SYN-LUV'),('unit','un'),('location','Armário A'),('minimum','5'),('maximum','100')]:page.locator(f'#stockForm [name="{name}"]').fill(value)
   page.locator('#stockForm [name="trackLots"]').select_option('true');page.locator('#stockForm [name="trackExpiry"]').select_option('true');page.locator('#stockForm [type="submit"]').click()
   expect(page.locator('#stockContent').get_by_text('Luvas sintéticas',exact=True)).to_be_visible()
   page.locator('[data-stock-action="tab"][data-stock-id="movements"]').click();page.locator('[data-stock-action="receive"]').click()
   page.locator('#stockForm [name="quantity"]').fill('10');page.locator('#stockForm [name="lot"]').fill('SYN-LOT');page.locator('#stockForm [name="expiresOn"]').fill('2099-01-01');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="consume"]').click();page.locator('#stockForm [name="quantity"]').fill('2');page.locator('#stockForm [name="lot"]').fill('SYN-LOT');page.locator('#stockForm [name="expiresOn"]').fill('2099-01-01');page.locator('#stockForm [name="reason"]').fill('Consulta sintética');page.locator('#stockForm [type="submit"]').click()
   stock=page.evaluate('(cid)=>GSModuleDemo.call("stock",{clinicId:cid})',cid);assert stock['balances'][0]['quantity']==8000
   page.locator('[data-stock-action="tab"][data-stock-id="suppliers"]').click();page.locator('[data-stock-action="supplier-save"]').click();page.locator('#stockForm [name="name"]').fill('Fornecedor sintético');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="tab"][data-stock-id="orders"]').click();page.locator('[data-stock-action="order-create"]').click();page.locator('#stockForm [name="quantity"]').fill('3');page.locator('#stockForm [name="unitCostCents"]').fill('60');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="order-submit"]').click();page.locator('#stockForm [name="reason"]').fill('Aprovação sintética');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="order-receive"]').click();page.locator('#stockForm [name="quantity"]').fill('3');page.locator('#stockForm [name="lot"]').fill('SYN-NEW');page.locator('#stockForm [name="expiresOn"]').fill('2099-01-01');page.locator('#stockForm [type="submit"]').click()
   expect(page.locator('#stockContent').get_by_text('Recebida',exact=False)).to_be_visible()
   page.locator('[data-stock-action="order-detail"]').click();page.locator('[data-stock-action="order-upload"]').click();page.locator('#stockOrderFile').set_input_files({'name':'synthetic-order.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nsynthetic order\n%%EOF'});page.locator('#stockOrderFileSave').click()
   page.locator('[data-stock-action="order-detail"]').click()
   with page.expect_download() as downloaded:page.locator('[data-stock-action="order-download"]').click()
   assert open(downloaded.value.path(),'rb').read().startswith(b'%PDF-1.4')
   page.locator('#modal .modal-head button').click()
  else:
   assert page.evaluate("(()=>{try{StockUIV4.form('product-save');return false}catch{return true}})()")
   # Configure a synthetic fixture as CEO; return to the real test profile before any action.
   page.evaluate('''([key,actor,cid])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser='u1';s.ceoViewingAs=null;localStorage.setItem(key,JSON.stringify(s));GSModuleDemo.call('category-save',{clinicId:cid,id:'cat',name:'Consumíveis'});GSModuleDemo.call('product-save',{clinicId:cid,id:'p',name:'Produto sintético',reference:'SYN',unit:'un',categoryId:'cat',minimum:3,maximum:100});const after=JSON.parse(localStorage.getItem(key));after.currentUser=actor;after.ceoViewingAs=actor;localStorage.setItem(key,JSON.stringify(after));StockUIV4.render();}''',[KEY,actor,cid])
   page.locator('[data-stock-action="request-create"]').first.click();page.locator('#stockForm [name="quantity"]').fill('2');page.locator('#stockForm [name="reason"]').fill('Pedido sintético');page.locator('#stockForm [type="submit"]').click()
   page.locator('[data-stock-action="tab"][data-stock-id="requests"]').click();expect(page.locator('#stockPanel').get_by_text('Pendente',exact=False)).to_be_visible();assert page.locator('[data-stock-action="request-decide"]').count()==0
   assert page.evaluate('(cid)=>!JSON.stringify(GSModuleDemo.call("stock",{clinicId:cid})).includes("unitCostCents")',cid)
  for width in [820,390]:
   page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
  assert not errors,(actor,errors)
  print(json.dumps({'profile':actor,'scope':'synthetic UI','passed':True}))
  c.close()
 browser.close()

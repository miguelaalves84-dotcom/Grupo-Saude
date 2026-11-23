"""Tabela de acordos: clínica a clínica, só linhas com valor, alteração de preço com data, edição só CEO/Administração (dados sintéticos)."""
import os,json,datetime
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');K='grupo_saude_v4_demo_2';passed=0
def check(name,v,**sc):
 global passed;print(json.dumps({**sc,'case':name,'passed':bool(v)}),flush=True);assert v,name;passed+=1
SEED="""k=>{const s=JSON.parse(localStorage.getItem(k));s.agreements={abranfir:[{id:'syn-a',name:'SYN Seguradora',active:true,documents:'SYN cartão',notes:'',lines:[{id:'l1',kind:'consulta',label:'SYN Fisiatria',prices:[{from:'2020-01-01',cents:3500},{from:'2099-01-01',cents:4000}]},{id:'l2',kind:'tecnica',label:'SYN Sem valor',prices:[]},{id:'l3',kind:'tratamento',label:'SYN Já mudou',prices:[{from:'2020-01-01',cents:1000},{from:'2021-01-01',cents:1200}]}]},{id:'syn-off',name:'SYN Inativo',active:false,lines:[{id:'l4',kind:'consulta',label:'x',prices:[{from:'2020-01-01',cents:100}]}]}],loures:[{id:'syn-b',name:'SYN Outra clínica',active:true,lines:[{id:'l5',kind:'consulta',label:'y',prices:[{from:'2020-01-01',cents:100}]}]}]};localStorage.setItem(k,JSON.stringify(s))}"""
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 for who,(w,h),view in [('test_call',(390,844),'agreements'),('test_adm',(820,1180),'agreements-op'),('u1',(1366,1000),'agreements'),('test_med',(390,844),'agreements'),('test_tec',(390,844),'agreements')]:
  sc={'profile':who,'width':w};ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=w<500,has_touch=w<900,service_workers='block');p=ctx.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
  p.goto(URL);p.wait_for_function('window.App&&window.AgreementsV4&&window.CEOReservedAreaV4');p.wait_for_timeout(500);p.evaluate(SEED,K);p.reload();p.wait_for_function('window.AgreementsV4');p.wait_for_timeout(500)
  p.evaluate(f"CEOReservedAreaV4.select('{who}')");p.wait_for_timeout(600)
  allowed=who in ('test_call','test_adm','u1')
  check('module available in Call Center and Operação only to booking profiles',p.evaluate(f"RoleAccessAdminV4.guard('{view}')")==allowed,**sc)
  if not allowed:ctx.close();continue
  p.evaluate(f"App.showView('{view}')");p.wait_for_timeout(600);p.locator('[data-ag-clinic]').select_option('abranfir');p.wait_for_timeout(300)
  check('grid is the default view',p.locator('table.ag-sheet').count()==1,**sc);p.locator('[data-ag-mode=cards]').first.click();p.wait_for_timeout(200)
  card=p.locator('.ag-card[data-ag="syn-a"]')
  check('current price and scheduled change shown',card.locator('text=35,00').count()==1 and 'A partir de 01/01/2099' in card.inner_text(),**sc)
  check('after the date only the new price is shown',card.locator('text=12,00').count()==1 and card.locator('text=10,00').count()==0,**sc)
  check('lines without value are hidden',card.locator('text=SYN Sem valor').count()==0,**sc)
  check('other clinic agreements not mixed',p.locator('text=SYN Outra clínica').count()==0,**sc)
  manager=who=='u1'
  check('inactive agreement hidden from read-only profiles',(p.locator('.ag-card[data-ag="syn-off"]').count()==1)==manager,**sc)
  check('edit only for CEO/Administração',(p.locator('[data-ag-edit]').count()>0)==manager and (p.locator('[data-ag-new]').count()==1)==manager,**sc)
  if not manager:
   check('direct save refused for read-only profile',p.evaluate("()=>{try{AgreementsV4.saveAgreement('abranfir',{name:'Hack',lines:[]});return false}catch(e){return /CEO/.test(e.message)}}"),**sc)
  else:
   p.locator('[data-ag-new]').click();f=p.locator('#agEditor');f.locator('[name=name]').fill('SYN Novo');f.locator('[data-ag-add=tratamento]').click();r=f.locator('.ag-edit-line').last;r.locator('[data-f=label]').fill('SYN Sessão');r.locator('[data-f=value]').fill('19,90');f.locator('button[type=submit]').click();p.wait_for_timeout(300)
   check('manager creates agreement with value',p.locator('.ag-card',has_text='SYN Novo').locator('text=19,90').count()==1,**sc)
   p.locator('[data-ag-new]').click();f=p.locator('#agEditor');f.locator('[name=name]').fill('syn seguradora');f.locator('button[type=submit]').click();p.wait_for_timeout(300)
   p.keyboard.press('Escape');p.wait_for_timeout(200);check('duplicate agreement name refused',len([t for t in p.locator('.ag-card h3').all_inner_texts() if t.strip().lower()=='syn seguradora'])==1,**sc);p.evaluate("()=>document.querySelector('[data-ag-cancel]')?.click()");p.wait_for_timeout(200)
  p.locator('[data-ag-q]').fill('fisiatria');p.wait_for_timeout(200)
  check('search filters agreements',p.locator('.ag-card').count()>=1 and p.locator('.ag-card',has_text='SYN Novo').count()==0,**sc)
  check('no horizontal overflow',p.evaluate('()=>document.documentElement.scrollWidth-innerWidth')<=1,**sc)
  check('no JavaScript errors',not errs,**sc);ctx.close()
 b.close()
print(json.dumps({'passed':passed}))

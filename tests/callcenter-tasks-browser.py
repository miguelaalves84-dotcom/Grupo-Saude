"""Módulo Call Center: tarefas configuráveis, emails do call center com pendências, permissões e telemóvel (dados sintéticos)."""
import os,json,datetime
from zoneinfo import ZoneInfo
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');K='grupo_saude_v4_demo_2';passed=0
def check(name,v,**scope):
 global passed;print(json.dumps({**scope,'case':name,'passed':bool(v)}),flush=True);assert v,name;passed+=1
def state(p):return p.evaluate('k=>JSON.parse(localStorage.getItem(k))',K)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 for who,(w,h) in [('test_call',(390,844)),('test_adm',(820,1180)),('u1',(1366,1000)),('test_med',(390,844)),('test_tec',(390,844))]:
  sc={'profile':who,'width':w};ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=w<500,has_touch=w<900,service_workers='block');p=ctx.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
  # Relógio fixo às 15:00 (Lisboa) do dia de hoje: a tarefa com prazo 00:01 está sempre atrasada, seja a que horas for que o CI corra.
  p.clock.set_fixed_time(datetime.datetime.now(ZoneInfo('Europe/Lisbon')).replace(hour=15,minute=0,second=0,microsecond=0))
  p.goto(URL);p.wait_for_function('window.App&&window.CallCenterTasksV4&&window.CEOReservedAreaV4');p.wait_for_timeout(600)
  p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));delete s.callCenter;const y=new Date(Date.now()-864e5).toLocaleDateString('sv-SE',{timeZone:'Europe/Lisbon'});s.callCenter={tasks:[{id:'syn-daily',name:'SYN Ligar à lista de espera',deadline:'00:01',frequency:'daily',required:true,active:true},{id:'syn-off',name:'SYN Inativa',deadline:'',frequency:'daily',active:false}],days:{[y]:{tasks:{},emails:{answer:false,items:[{id:'syn-old',text:'SYN email de ontem por tratar',createdDate:y,done:false}]}}}};localStorage.setItem(k,JSON.stringify(s))}""",K)
  p.reload();p.wait_for_function('window.App&&window.CallCenterTasksV4');p.wait_for_timeout(500);p.evaluate(f"CEOReservedAreaV4.select('{who}')");p.wait_for_timeout(700)
  allowed=who in ('test_call','test_adm','u1')
  check('Call Center module visible only to profiles with bookings',p.evaluate("RoleAccessAdminV4.guard('cctasks')")==allowed,**sc)
  check('Pedidos and Indicadores moved out of Operação',p.evaluate("()=>!document.querySelector('details[data-nav-group=\"Operação\"] [data-view=\"wait\"],details[data-nav-group=\"Operação\"] [data-view=\"callcenter\"]')"),**sc)
  if not allowed:
   ctx.close();continue
  p.evaluate("App.showView('cctasks')");p.wait_for_timeout(700)
  check('only active tasks for today are listed',p.locator('[data-cc-task]').count()==1,**sc)
  check('overdue task is highlighted',p.locator('.cc-list li.is-late').count()==1,**sc)
  p.locator('[data-cc-task="syn-daily"]').click();p.wait_for_timeout(300)
  check('ticking a task records who and when',any((d.get('tasks',{}).get('syn-daily') or {}).get('done') for d in state(p)['callCenter']['days'].values()),**sc)
  check('previous pending email is shown',p.locator('[data-cc-email="syn-old"]').count()==1,**sc)
  p.locator('[data-cc-email="syn-old"]').click();p.wait_for_timeout(300)
  check('pending email resolved with visto',p.locator('[data-cc-email="syn-old"]').count()==0,**sc)
  p.locator('[data-cc-emails-answer]').select_option('false');p.locator('#ccEmailsForm button[type=submit]').click();p.wait_for_timeout(300)
  check('answer No without text is refused',p.locator('#gsDialog, .gs-dialog, dialog[open]').count()>=1 or not any((d.get('emails') or {}).get('answer') is False and d.get('emails',{}).get('items') for d in list(state(p)['callCenter']['days'].values())[-1:]),**sc)
  p.keyboard.press('Escape');p.wait_for_timeout(200)
  p.locator('[data-cc-email-list] input').first.fill('SYN responder à seguradora');p.locator('#ccEmailsForm button[type=submit]').click();p.wait_for_timeout(300)
  check('answer No with a line is saved',any(any(i['text']=='SYN responder à seguradora' for i in (d.get('emails') or {}).get('items',[])) for d in state(p)['callCenter']['days'].values()),**sc)
  manager=who in ('test_adm','u1') and p.evaluate("RoleAccessAdminV4.can('settings')")
  check('task configuration only for CEO/Administração',(p.locator('#ccTaskForm').count()==1)==bool(manager),**sc)
  if manager:
   f=p.locator('#ccTaskForm');f.locator('[name=name]').fill('SYN Nova tarefa');f.locator('[name=deadline]').fill('23:59');f.locator('button[type=submit]').click();p.wait_for_timeout(300)
   check('manager creates a task that appears today',p.locator('[data-cc-task]').count()==2,**sc)
  check('no horizontal overflow',p.evaluate('()=>document.documentElement.scrollWidth-innerWidth')<=1,**sc)
  check('no JavaScript errors',not errs,**sc);ctx.close()
 b.close()
print(json.dumps({'passed':passed}))

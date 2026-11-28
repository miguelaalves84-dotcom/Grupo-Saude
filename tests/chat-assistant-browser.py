"""Assistente Grupo Saúde no Chat: conversa fixa no topo com as tarefas obrigatórias do dia, ligação direta para a
tarefa, «Realizada por …» para todas as administrativas quando uma conclui, alerta à Administração/CEO após 1 h."""
import os,json,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/chat-assistant'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
DAY='2026-11-24'  # terça-feira
SEED='''([k,u,day,done])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=null;s.clinics=[{id:'c1',name:'Clínica Teste',active:true,operational:true}];s.tasks=JSON.parse(JSON.stringify(GSOperationCore.defaultTasks));s.days={};
 for(const p of [...s.users,...Object.values(s.employees||{})]){p.clinics=['c1'];p.clinicIds=['c1'];p.clinic='c1';p.clinicId='c1'}
 if(done)s.days[day+'_c1']={date:day,clinic:'c1',open:{saved:false,professionals:[]},close:{saved:false,professionals:[]},taskStatus:{open_team:{status:'done',at:day+'T09:05:00Z',by:'test_adm'}},history:[],pendingRows:[],indicators:{}};
 s.monthlyRosters={};localStorage.setItem(k,JSON.stringify(s))}'''
def page(b,user,hour,done=False,w=1366,h=900,mob=False):
 c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
 p=c.new_page();p.clock.install(time=datetime.datetime.fromisoformat(f'{DAY}T{hour}:00+00:00'));p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 p.goto(URL);p.wait_for_function('window.App&&window.GSChatAssistant&&window.GSOperationCore');p.evaluate(SEED,[K,user,DAY,done]);p.reload();p.wait_for_function('window.App&&window.GSChatAssistant');p.wait_for_timeout(400)
 p.evaluate("App.showView('chat')");p.wait_for_timeout(600);return c,p,errs
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for dev,w,h,mob in [('desktop',1366,900,False),('phone',390,844,True)]:
   scope={'device':dev,'user':'administrativa'};c,p,errs=page(b,'test_adm','08:30',False,w,h,mob)
   e=p.locator('#assistantEntry');check('assistant pinned at the top of the chat list',e.count()==1 and p.locator('.chat-conversation-list > *').first.get_attribute('id')=='assistantEntry')
   check('unread badge shows the tasks to do',e.locator('.chat-unread').count()==1 and int(e.locator('.chat-unread').inner_text())>0)
   e.click();p.wait_for_timeout(300);d=p.locator('#assistantDialog')
   check('one message per required task with a link',d.locator('.assistant-msg').count()==p.evaluate("GSChatAssistant.messages(JSON.parse(localStorage.getItem('%s')),'test_adm',new Date().toISOString()).length"%K) and d.locator('[data-assistant-go]').count()>0)
   check('deadline shown («até às 09:30»)','até às 09:30' in d.inner_text())
   check('no horizontal scroll',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   if dev=='desktop':p.screenshot(path=str(OUT/'assistant.png'))
   d.locator('[data-assistant-go]').first.click();p.wait_for_timeout(700)
   check('«Abrir tarefa» opens the Operação at the task',p.evaluate("document.getElementById('operation')?.classList.contains('active')") and p.locator('.task-row.assistant-target').count()==1)
   p.evaluate("App.showView('chat')");p.wait_for_timeout(400)
   check('badge cleared after reading',p.locator('#assistantEntry .chat-unread').count()==0)
   check('no page errors',not errs);c.close()
  scope={'user':'administrativa 2'};c,p,errs=page(b,'test_adm','09:10',True)
  p.locator('#assistantEntry').click();p.wait_for_timeout(300)
  done=p.locator('.assistant-msg.is-done')
  check('task done by a colleague shows «Realizada por … às 09:05»',done.count()==1 and 'Realizada por Administrativa Teste às 09:05' in done.inner_text())
  check('done task has no link any more',done.locator('[data-assistant-go]').count()==0);c.close()
  scope={'user':'ceo'};c,p,errs=page(b,'u1','09:00')
  check('CEO gets nothing while nothing is late',p.evaluate("GSChatAssistant.messages(JSON.parse(localStorage.getItem('%s')),'u1',new Date().toISOString()).length"%K)==0);c.close()
  c,p,errs=page(b,'u1','10:45')
  p.locator('#assistantEntry').click();p.wait_for_timeout(300)
  check('more than 1 hour late reaches the CEO',p.locator('.assistant-msg.is-escalation').count()>0 and 'Atrasada há mais de 1 hora' in p.locator('#assistantDialog').inner_text());c.close()
  scope={'user':'technician'};c,p,errs=page(b,'test_tec','08:30')
  check('technician has an empty assistant',p.evaluate("GSChatAssistant.unread()")==0);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

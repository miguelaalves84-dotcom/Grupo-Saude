"""Página de Notificações: Todas / Por ler, filtro por tipo, marcar uma e todas como lidas; não há apagar. Dados sintéticos."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/notifications'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.NotificationsPageV4&&window.AttentionUIV4&&window.GSSupportCore')
   p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoViewingAs=null;s.supportTickets=[];s.attentionRead={};for(const [id,sub] of [['test_tec','SYN pedido A'],['test_med','SYN pedido B']])GSSupportCore.create(s,{id,role:'TECNICO/A',active:true},{category:'Outro',subject:sub,message:'x'});localStorage.setItem(k,JSON.stringify(s))}""",K);p.reload();p.wait_for_function('window.NotificationsPageV4&&window.AttentionUIV4');p.wait_for_timeout(500)
   p.evaluate("NotificationsPageV4.open()");p.wait_for_selector('#modal[open] .np-list')
   total=p.locator('.np-item').count();check('lista com as notificações do sino (inclui os 2 pedidos de suporte)',total>=2 and 'SYN pedido A' in p.locator('.np-list').inner_text())
   check('não há botão de apagar',p.locator('.np-item button',has_text='Apagar').count()==0 and p.locator('[data-np-delete]').count()==0)
   p.locator('[data-np-kind]').select_option('RH');check('filtro por tipo (RH)',p.locator('.np-item').count()>=2 and all('RH' in t for t in p.locator('.np-item .pill').all_inner_texts()))
   p.locator('[data-np-kind]').select_option('');p.locator('[data-np-tab="unread"]').click();before=p.locator('.np-item').count()
   p.locator('[data-np-read]').first.click();p.wait_for_timeout(300);check('marcar uma como lida tira-a de «Por ler»',p.locator('.np-item').count()==before-1)
   p.locator('[data-np-all]').click();p.wait_for_timeout(500);check('marcar todas como lidas',p.locator('.np-item').count()==0)
   p.locator('[data-np-tab="all"]').click();check('em «Todas» continuam lá (nada é apagado)',p.locator('.np-item').count()==total);p.screenshot(path=str(OUT/f'notifications-{device}.png'))
   check('sem erros na página',not errs);c.close()
 finally:b.close()
(OUT/'notifications-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

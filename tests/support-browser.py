"""Suporte no ecrã: colaborador abre pedido; CEO/Administração veem no sino e na lista, respondem e resolvem;
colaborador vê a resposta e o estado; outro colaborador não vê o pedido. Dados sintéticos."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/support'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.wait_for_timeout(200)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.on('dialog',lambda d:d.accept());p.goto(URL);p.wait_for_function('window.SupportV4&&window.GSSupportCore&&window.GSAttentionCore')
   p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.supportTickets=[];localStorage.setItem(k,JSON.stringify(s))}",K)
   become(p,'test_tec');p.evaluate("SupportV4.open()");p.locator('[data-sup-new]').click();p.locator('[data-sup-form] select').select_option('Horário');p.locator('[data-sup-form] [name=subject]').fill('SYN troca de horário');p.locator('[data-sup-form] textarea').fill('SYN posso trocar sexta por sábado?');p.locator('[data-sup-form] button[type=submit]').click();p.wait_for_timeout(400)
   t=p.evaluate("k=>JSON.parse(localStorage.getItem(k)).supportTickets",K)
   check('pedido criado, aberto, do próprio',len(t)==1 and t[0]['status']=='Aberto' and t[0]['employeeId']=='test_tec')
   become(p,'test_med');p.evaluate("SupportV4.open()");check('outro colaborador não vê o pedido','SYN troca' not in p.locator('#modalBody').inner_text())
   for label,uid in [('Administração','test_admin'),('CEO','u1')]:
    become(p,uid);items=p.evaluate("()=>GSAttentionCore.collect(JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),{active:true,can:()=>true,employee:()=>true,clinic:()=>true,documentEmployee:()=>true,rosterVisible:()=>true}).filter(x=>x.kind==='support').map(x=>x.title)")
    check(f'{label} recebe aviso no sino',any('SYN troca' in x for x in items))
   p.evaluate("SupportV4.open()");check('gestão vê o pedido em «Por resolver»','SYN troca' in p.locator('#modalBody').inner_text())
   p.locator('[data-sup-open]').first.click();p.locator('[data-sup-reply] textarea').fill('SYN sim, está aprovado');p.locator('[data-sup-reply] button[type=submit]').click();p.wait_for_timeout(300)
   p.locator('[data-sup-status="Resolvido"]').click();p.wait_for_timeout(300)
   t=p.evaluate("k=>JSON.parse(localStorage.getItem(k)).supportTickets[0]",K)
   check('resposta guardada e pedido resolvido',t['status']=='Resolvido' and len(t['messages'])==2)
   become(p,'test_tec');p.evaluate("SupportV4.open()");check('colaborador vê «nova mensagem» e «Resolvido»','nova mensagem' in p.locator('#modalBody').inner_text() and 'Resolvido' in p.locator('#modalBody').inner_text())
   p.locator('[data-sup-open]').first.click();check('conversa mostra a resposta','SYN sim, está aprovado' in p.locator('.sup-thread').inner_text());p.screenshot(path=str(OUT/f'support-{device}.png'))
   check('sem erros na página',not errs);c.close()
 finally:b.close()
(OUT/'support-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

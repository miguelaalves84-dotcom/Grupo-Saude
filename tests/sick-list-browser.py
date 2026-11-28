"""Baixas/Licenças em lista: colaborador vê só as suas; gestão vê a equipa com nome e função; dias, estado, anexos, detalhe."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/sick-list'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.SickListV4&&window.HRLeaveV4')
   p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.leave=[{id:'b1',employeeId:'test_tec',type:'Baixa',start:'2026-11-09',end:'2026-11-25',status:'Aprovado',document:{name:'cit.pdf',dataUrl:'data:application/pdf;base64,JVBERg=='}},{id:'b2',employeeId:'test_med',type:'Justificação',start:'2026-11-23',end:'2026-11-27',status:'Pendente',note:'SYN consulta'},{id:'v1',employeeId:'test_tec',type:'Férias',days:['2026-12-22'],status:'Aprovado'}];localStorage.setItem(k,JSON.stringify(s))}""",K)
   become(p,'test_tec');p.evaluate("SickListV4.open()");txt=p.locator('#modalBody').inner_text()
   check('colaborador vê só a sua baixa (sem férias, sem a do colega)',p.locator('.sl-item').count()==1 and 'Baixa por doença' in txt and 'SYN consulta' not in txt)
   check('17 dias no total, Aprovada, 1 anexo','17 dias no total' in txt and 'Aprovada' in txt and '📎 1' in txt)
   become(p,'u1');p.evaluate("SickListV4.open()");txt=p.locator('#modalBody').inner_text()
   check('CEO vê as duas, com nome',p.locator('.sl-item').count()==2 and 'Técnico Teste' in txt and 'Pendente' in txt)
   p.locator('.sl-item summary',has_text='Justificação').click();check('detalhe abre com observações e botão da ficha','SYN consulta' in p.locator('.sl-item[open]').inner_text() and p.locator('.sl-item[open] [data-sl-open]').count()==1)
   p.screenshot(path=str(OUT/f'sick-list-{device}.png'));check('sem erros',not errs);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

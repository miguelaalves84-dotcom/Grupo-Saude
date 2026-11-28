"""«O meu perfil»: separadores; dados sensíveis escondidos; pedido de alteração vai para aprovação; CEO aprova e a ficha muda;
CV com download para a gestão. Dados sintéticos."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/my-profile'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
PDF=b'%PDF-1.4\nSYN CV\n%%EOF'
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
def hr(p):return p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));return {...(s.users.find(u=>u.id==='test_tec')||{}).hr}}",K)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);dialogs=[];p.on('dialog',lambda d:(dialogs.append(d.message),d.accept()));errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.MyProfileV4&&window.GSHRGrowth')
   p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.hrDataRequests=[];for(const u of [...s.users,...Object.values(s.employees||{})])if(u.id==='test_tec')u.hr={...(u.hr||{}),iban:'PT50000201231234567890154',nif:'123456789',phone:'912345678',contractType:'Contrato sem termo',admissionDate:'2025-01-02'};localStorage.setItem(k,JSON.stringify(s))}",K)
   become(p,'test_tec');p.evaluate("MyProfileV4.open('personal')");p.wait_for_selector('#modal[open] .mp-tabs')
   check('5 separadores',p.locator('[data-mp-tab]').count()==5)
   p.locator('[data-mp-tab="sensitive"]').click();txt=p.locator('.mp-panel').inner_text()
   check('dados sensíveis escondidos (IBAN e NIF não aparecem)','PT50' not in txt and '123456789' not in txt and '••••••' in txt)
   p.locator('[data-mp-tab="work"]').click();check('profissional: tipo de contrato e admissão','Contrato sem termo' in p.locator('.mp-panel').inner_text() and '02/01/2025' in p.locator('.mp-panel').inner_text())
   p.locator('[data-mp-tab="contact"]').click();p.locator('[data-mp-edit]').click();p.locator('[name=city]').fill('Lagoa');p.locator('[name=postalCode]').fill('8400-123');p.locator('[name=emergencyName]').fill('SYN Ana');p.locator('[name=emergencyPhone]').fill('913000000');p.locator('[data-mp-send]').click();p.wait_for_timeout(400)
   r=p.evaluate("k=>JSON.parse(localStorage.getItem(k)).hrDataRequests",K)
   check('pedido de alteração pendente (cidade, código postal, emergência)',len(r)==1 and r[0]['status']=='Pendente' and r[0]['changes'].get('city')=='Lagoa' and 'country' not in r[0]['changes'] and hr(p).get('city') in (None,''))
   check('aparece em «Alterações pendentes» e bloqueia novo pedido','Pendente' in p.locator('.mp-pending').inner_text() and p.locator('[data-mp-edit]').is_disabled())
   p.screenshot(path=str(OUT/f'profile-{device}.png'))
   become(p,'u1');p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));const x=s.hrDataRequests[0];GSHRGrowth.decideData(s,AttendanceBookV4.actor(s),x.id,true);localStorage.setItem(k,JSON.stringify(s))}",K)
   check('CEO aprova e a ficha é atualizada',hr(p).get('city')=='Lagoa' and hr(p).get('postalCode')=='8400-123')
   become(p,'test_tec');p.evaluate("MyProfileV4.open('cv')");p.wait_for_selector('#modal[open] .mp-tabs');p.locator('[data-mp-edit]').click();p.locator('[name=cvFile]').set_input_files({'name':'SYN-cv.pdf','mimeType':'application/pdf','buffer':PDF});p.locator('[data-mp-edu-row] [data-k=course]').first.fill('Fisioterapia');p.locator('[name=skills]').fill('Massagem; Eletroterapia');p.locator('[data-mp-lang-row] [data-k=name]').first.fill('Inglês');p.locator('[data-mp-lang-row] select').first.select_option('B2');p.locator('[data-mp-send]').click();p.wait_for_timeout(600)
   r=p.evaluate("k=>JSON.parse(localStorage.getItem(k)).hrDataRequests.find(x=>x.status==='Pendente')",K)
   check('pedido de CV com formação, competências e idiomas',r and r['changes']['cv']['name']=='SYN-cv.pdf' and r['changes']['skills']==['Massagem','Eletroterapia'] and r['changes']['languages'][0]['level']=='B2')
   check('sem erros na página',not errs);c.close()
 finally:b.close()
(OUT/'my-profile-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

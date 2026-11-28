"""Comunicados por categoria: Geral, RH, Evento, Política, Urgente; «Urgente» em destaque, primeiro e obriga a tomar conhecimento."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/notices'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
PUB='''([k,cat,title])=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s),cid=s.clinics.filter(c=>c.id!=='administracao').map(c=>String(c.id));const r=GSHRPortal.command(s,a,'publish',{kind:'notice',category:cat,title,content:'SYN conteúdo',clinicIds:cid,roles:[],employeeIds:[],revision:s.hrPortalRevision||0,requestId:'notice-'+crypto.randomUUID()},{id:'n-'+crypto.randomUUID(),at:new Date().toISOString()});localStorage.setItem(k,JSON.stringify(r.state));return r.result}'''
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  scope={'device':'desktop'};c=b.new_context(viewport={'width':1366,'height':1000},service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
  p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.HRPortalV4&&window.GSHRPortal')
  p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));const ids=s.clinics.map(c=>c.id);for(const u of [...s.users,...Object.values(s.employees||{})])if(['u1','test_tec'].includes(u.id)){u.clinics=ids.slice();u.clinicIds=ids.slice()}s.hrCompanyDocuments=[];localStorage.setItem(k,JSON.stringify(s))}",K)
  become(p,'u1');p.evaluate(PUB,[K,'Evento','SYN jantar de Natal']);p.evaluate(PUB,[K,'Urgente','SYN fecho por avaria']);d=p.evaluate("k=>JSON.parse(localStorage.getItem(k)).hrCompanyDocuments",K)
  check('categoria guardada; «Urgente» fica obrigatório',{x['title']:x.get('category') for x in d}=={'SYN jantar de Natal':'Evento','SYN fecho por avaria':'Urgente'} and [x for x in d if x['category']=='Urgente'][0]['required'])
  become(p,'test_tec');p.evaluate("HRPortalV4.open(false,'notice')");p.wait_for_selector('#modal[open] .notice-cats')
  check('separadores Todos, Geral, RH, Evento, Política, Urgente',[x.strip() for x in p.locator('[data-notice-cat]').all_inner_texts()]==['Todos','Geral','RH','Evento','Política','Urgente'])
  cards=p.locator('#modalBody .portal-grid').first.locator('article');check('«Urgente» aparece primeiro e em destaque','SYN fecho' in cards.first.inner_text() and 'notice-urgent' in (cards.first.get_attribute('class') or ''))
  p.locator('[data-notice-cat="Evento"]').click();check('filtro «Evento» mostra só o evento',p.locator('#modalBody .portal-grid').first.locator('article').count()==1 and 'SYN jantar' in p.locator('#modalBody .portal-grid').first.inner_text())
  p.screenshot(path=str(OUT/'notices.png'));check('sem erros',not errs);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

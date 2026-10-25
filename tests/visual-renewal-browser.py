"""Synthetic full-module visual evidence and shared editor checks; no production network."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0]
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-renewal'));OUT.mkdir(parents=True,exist_ok=True)
K='grupo_saude_v4_demo_2';results=[]
def check(name,ok,**scope):
 row={**scope,'case':name,'passed':bool(ok)};results.append(row);print(json.dumps(row),flush=True);assert ok,row
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1440,1000),('tablet',1280,800),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope=dict(actor=actor,device=device,theme=theme);c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(10000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss());p.goto(URL);p.wait_for_function('window.GSVisualRuntimeV4&&window.WorkspaceShellV4&&window.GSDemoClinicAssociations');p.wait_for_timeout(400)
     p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));GSDemoClinicAssociations.repair(s);for(const x of [...s.users,...Object.values(s.employees||{})]){x.name='SYN '+x.id;x.email=x.id+'@example.invalid'}for(const x of s.clinics){x.name='SYN Clínica '+x.id;x.address='Rua Sintética'}s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme]);p.reload();p.wait_for_function('window.GSVisualRuntimeV4&&window.WorkspaceShellV4');p.wait_for_timeout(400)
     check('navy shared sidebar',p.evaluate('getComputedStyle(document.querySelector("#nav")).backgroundColor') in ['rgb(20, 36, 63)','rgb(14, 27, 48)'],**scope)
     search=p.locator('#workspaceSearch');search.fill('zz-no-module');check('global module search empty result',p.locator('#workspaceSearchResults').inner_text().startswith('Sem módulos'),**scope);search.fill('');check('global module search clears',p.locator('#workspaceSearchResults').is_hidden(),**scope)
     if p.evaluate('RoleAccessAdminV4.guard("agenda")'):
      search.fill('Agenda');p.locator('#workspaceSearchResults button').first.click();check('global search opens the existing authorised Agenda',p.locator('#agenda').evaluate('(e)=>e.classList.contains("active")'),**scope)
     for view in ['dashboard','clinics','operation','agenda','chat','hr','myhr','clock','finance','stock','marketing','complaints','wait','tasks','alerts','tables','reports','security','audit']:
      if not p.evaluate('(v)=>!!document.getElementById(v)&&RoleAccessAdminV4.guard(v)',view):continue
      p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.evaluate('(v)=>App.showView(v)',view);p.wait_for_timeout(90)
      check('no viewport overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),module=view,**scope)
      check('header clinic reuses exactly the existing scoped options',p.evaluate('''()=>{const v=document.querySelector('main .view.active'),source=v?.querySelector('#dashClinic,#opClinic,#stockClinic,#complaintFilterClinic,#mkFilterClinic,#agendaFilters select[name="clinicId"]'),mirror=document.getElementById('workspaceClinic');if(!source)return mirror.disabled;return mirror.value===source.value&&JSON.stringify([...mirror.options].map(o=>o.value))===JSON.stringify([...source.options].filter(o=>!o.hidden).map(o=>o.value))}'''),module=view,**scope)
      check('one expanded navigation group',p.locator('#nav details[open]').count()<=1,module=view,**scope)
      if device=='tablet' and actor in ['u1','test_adm'] or view in ['dashboard','chat','agenda']:p.screenshot(path=str(OUT/f'{actor}-{device}-{theme}-{view}.png'),full_page=False)
      if view=='hr':check('one performance entry per employee workspace',p.get_by_role('button',name='Avaliação de Desempenho',exact=True).count()<=1,module=view,**scope)
      if view=='chat':
       p.evaluate('App.newConversation()');p.locator('#modal [name=member]').first.check();peer=p.locator('#modal [name=member]:checked').first.input_value();check('direct subject is optional in the real form',p.locator('#convTitle').input_value()=='',module=view,**scope);p.get_by_role('button',name='Criar conversa',exact=True).click();p.wait_for_timeout(100)
       check('blank-subject direct conversation renders the peer name',p.locator('.chat-thread-title h3').inner_text()==p.evaluate('(id)=>GSChatCore.people(JSON.parse(localStorage.getItem("grupo_saude_v4_demo_2"))).find(p=>String(p.id)===id).name',peer),module=view,**scope)
      for field in p.locator(f'#{view} textarea:visible').all()[:2]:
       old=field.input_value();field.fill('São João — ação, informação e atenção. '*25);p.wait_for_timeout(60)
       check('textarea grows without internal scrollbar or content loss',field.evaluate('(e)=>e.scrollHeight<=e.clientHeight+2&&e.value.endsWith("atenção. ")&&e.rows===1'),module=view,**scope)
       if view=='chat':
        send=p.locator('.chat-send');send.scroll_into_view_if_needed();check('long draft retains reachable send action through conversation scrolling',send.evaluate('(e)=>{const a=e.getBoundingClientRect(),b=e.closest(".chat-thread").getBoundingClientRect();return a.top>=b.top-2&&a.bottom<=b.bottom+2}'),module=view,**scope)
       field.fill('Olá');p.wait_for_timeout(50);check('textarea shrinks and retains caret',field.evaluate('(e)=>e.getBoundingClientRect().height<70&&e.selectionStart===3&&e.value==="Olá"'),module=view,**scope);field.fill(old)
     check('no JavaScript exceptions',not errors,**scope);c.close()
 finally:
  b.close();(OUT/'visual-renewal-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))

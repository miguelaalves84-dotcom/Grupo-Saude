"""Independent synthetic profiles; route/button inventory and safe form destinations.
Opening a page is reported separately from mutating flows in the dedicated suites.
No real sign-in, external providers, production or destructive cleanup.
"""
import os,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];KEY='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/profile-audit-artifacts'));OUT.mkdir(parents=True,exist_ok=True)
rows=[];controls=[];scope={};errors=[]
PROFILES=[('test_call','Call Center'),('test_med','Médico'),('test_tec','Técnico'),('test_adm','Administrativo'),('test_admin','Administração'),('u1','CEO')]
def record(module,action,expected,observed,ok,**extra):
 row={**scope,'module':module,'action':action,'expected':expected,'observed':observed,'state':'Aprovada' if ok else 'Falhou',**extra};rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
def check(module,action,ok,expected='Resultado coerente com permissões',observed=None,**extra):record(module,action,expected,observed if observed is not None else bool(ok),ok,**extra)
def close(page):page.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
def inventory(page,module):
 controls.extend([{**scope,'module':module,**x,'state':'Inventariado — ação não exercitada por este percurso'} for x in page.evaluate('''()=>[...document.querySelectorAll('.view.active button,.view.active input,.view.active select,.view.active textarea,dialog[open] button,dialog[open] input,dialog[open] select,dialog[open] textarea')].filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,id:e.id,label:(e.innerText||e.getAttribute('aria-label')||e.closest('label')?.innerText||e.placeholder||e.name||'').trim().slice(0,180),disabled:e.disabled===true,handler:e.getAttribute('onclick')||e.dataset.gsAction||e.dataset.opAction||e.dataset.leaveAction||'',type:e.type||''}))''')])
def click_nav(page,bid,view,width):
 locator=page.locator('#'+bid) if bid else page.locator('#nav [data-view="'+view+'"]')
 if width<=760 and not page.evaluate('document.body.classList.contains("menu-open")'):page.locator('#menuBtn').click()
 parent=locator.locator('xpath=ancestor::details[@data-nav-group]')
 if parent.count() and not parent.evaluate('(e)=>e.open'):parent.locator('summary').click()
 locator.click()
with sync_playwright() as p:
 browser=p.chromium.launch(args=['--no-sandbox'])
 try:
  for actor,name in PROFILES:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':name,'actor':actor,'device':device,'theme':theme};ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());page=ctx.new_page();page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.dismiss())
     page.goto(URL);page.wait_for_function('window.WorkspaceShellV4&&window.RoleAccessAdminV4&&window.CEOReservedAreaV4&&window.MarketingUIV4');page.wait_for_timeout(400)
     page.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.candidates=[];s.auditMarker='SYN AUDIT PRESERVE';for(const u of [...s.users,...Object.values(s.employees||{})]){u.name='SYN '+u.id;u.email=u.id+'@example.invalid';}localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[KEY,actor,theme]);page.reload();page.wait_for_function('window.WorkspaceShellV4&&window.MarketingUIV4&&document.querySelector("#nav details")');page.wait_for_timeout(400)
     check('Sessão','Arranque direto sem alternar perfil',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).currentUser',KEY)==actor)
     check('Navegação','Página inicial já respeita perfil',page.evaluate('RoleAccessAdminV4.guard(document.querySelector(".view.active")?.id)'));
     check('Dashboard','Dashboard oculto nos quatro perfis sem gestão',page.evaluate('RoleAccessAdminV4.guard("dashboard")')==(actor in ['u1','test_admin']))
     navigation=page.evaluate('''()=>[...document.querySelectorAll('#nav button')].map(b=>({id:b.id,view:b.dataset.view||'',label:b.innerText.trim(),permission:b.dataset.shellPermission||'',expected:b.dataset.view?RoleAccessAdminV4.guard(b.dataset.view):b.dataset.shellPermission?RoleAccessAdminV4.can(b.dataset.shellPermission):null,hidden:b.hidden||getComputedStyle(b).display==='none'}))''')
     check('Navegação','Entradas principais sem duplicações',len([b['view'] for b in navigation if b['view']])==len(set(b['view'] for b in navigation if b['view'])))
     for b in navigation:
      if b['expected'] is None:continue
      module=b['view'] or b['label'];check(module,'Visibilidade da entrada '+b['label'],b['hidden']!=b['expected'])
      if not b['expected']:
       if b['view']:check(module,'Acesso direto proibido',page.evaluate('(id)=>App.showView(id)',b['view'])==False)
       continue
      close(page);start=time.monotonic()
      try:
       click_nav(page,b['id'],b['view'],w);page.wait_for_timeout(45);elapsed=round((time.monotonic()-start)*1000)
       active=page.evaluate('document.querySelector(".view.active")?.id');text=page.locator('dialog[open]').first.inner_text() if page.locator('dialog[open]').count() else page.locator('.view.active').inner_text()
       ok=(active==b['view'] if b['view'] else bool(text.strip())) and bool(text.strip());check(module,'Abrir entrada '+b['label'],ok,observed={'active':active,'chars':len(text)},elapsedMs=elapsed)
       inventory(page,module)
       check(module,'Sem exceções ao carregar',not errors,observed=errors.copy());check(module,'Conteúdo contido no viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
       close(page)
      except Exception as e:record(module,'Abrir entrada '+b['label'],'Destino funcional',str(e)[:500],False);close(page)
     # Configuration is not the permission to execute daily work.
     if actor not in ['u1','test_admin']:
      close(page);before_tasks=page.evaluate('(k)=>JSON.stringify(JSON.parse(localStorage.getItem(k)).tasks)',KEY);page.evaluate('App.openTaskForm();App.toggleTask(JSON.parse(localStorage.getItem("grupo_saude_v4_demo_2")).tasks[0].id);App.addTask()');check('Tarefas','Perfil sem settings não abre nem altera catálogo',page.locator('dialog[open]').count()==0 and before_tasks==page.evaluate('(k)=>JSON.stringify(JSON.parse(localStorage.getItem(k)).tasks)',KEY));check('Tarefas','Configuração global não herda execução diária',not page.evaluate('RoleAccessAdminV4.guard("tasks")'))
     # Explicit existing form entry points; no submission or external effects here.
     forms=[('RH','Baixa/justificação','leaveRequest','HRSeparationV4.sickLeave()'),('RH','Documentos pessoais','personal','HRSeparationV4.documents()'),('RH','Calendário férias','leaveRequest','HRLeaveUIV4.calendar()'),('Permissões','Editor de permissões','settings','RoleAccessAdminV4.open()'),('Candidatos','Ficha nova candidatura','hrManage','App.openCandidateForm()')]
     for module,label,perm,expr in forms:
      close(page)
      if not page.evaluate('(k)=>RoleAccessAdminV4.can(k)',perm):continue
      try:
       before_form=page.locator('.view.active').inner_text();page.evaluate(expr);page.wait_for_timeout(70);visible=page.locator('dialog[open]').count()>0 or page.locator('.view.active').inner_text()!=before_form;check(module,'Abrir formulário '+label,visible);inventory(page,module)
      except Exception as e:record(module,'Abrir formulário '+label,'Formulário existente acessível',str(e)[:400],False)
     close(page);page.evaluate('App.showView("myhr")');check('Dados','Marcador sintético e histórico preservados',page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).auditMarker',KEY)=='SYN AUDIT PRESERVE');check('Runtime','Sem erros JavaScript no perfil',not errors,observed=errors.copy());page.screenshot(path=str(OUT/f'audit-{actor}-{device}-{theme}.png'),full_page=True)
     if actor=='u1':
      for target,_ in PROFILES:
       if target=='u1':continue
       page.evaluate('(id)=>CEOReservedAreaV4.select(id)',target);check('Simulação CEO','Perfil efetivo '+target,page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).currentUser',KEY)==target);check('Simulação CEO','Dashboard respeita perfil '+target,page.evaluate('RoleAccessAdminV4.guard("dashboard")')==(target=='test_admin'));page.evaluate('CEOReservedAreaV4.select("__CEO__")')
     # Unavailable integrations explicitly excluded from approvals.
     for module in ['Autenticação real','Persistência entre dispositivos','Emails reais','IA externa','Uploads privados reais']:
      rows.append({**scope,'module':module,'action':'Integração efetiva','expected':'Serviço configurado e sessão real','observed':'Preview estático / sem serviço externo','state':'Não testável no ambiente demonstrativo'})
     rows.append({**scope,'module':'Stock','action':'Módulo da branch','expected':'Disponível após recuperação compatível','observed':'Ausente nesta branch; preservado em a6edf53/ebc2df5','state':'Não implementada nesta branch'})
     ctx.close()
 finally:
  browser.close();report={'scope':'Perfis demonstrativos independentes; navegação/formulários separados dos fluxos mutáveis das suites dedicadas. Inventário de controlos não significa ação aprovada. Sem sessão real ou serviços externos.','cases':rows,'controls':controls,'passed':sum(r['state']=='Aprovada' for r in rows),'failed':sum(r['state']=='Falhou' for r in rows),'notTestable':sum(r['state']=='Não testável no ambiente demonstrativo' for r in rows)};(OUT/'profile-audit-matrix.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:report[k] for k in ['passed','failed','notTestable']},ensure_ascii=False),flush=True)
 if report['failed']:raise AssertionError(str(report['failed'])+' profile audit failures; inspect profile-audit-matrix.json')

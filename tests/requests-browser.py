"""Pedidos de consulta: origem, motivo, autor/perfil, duplicados, +1 por hora, procura não satisfeita e indicadores.
Chromium com dados sintéticos; seis perfis, três ecrãs, dois temas."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/requests-artifacts'));OUT.mkdir(parents=True,exist_ok=True);cases=[];scope={}
def check(name,ok):
 row={**scope,'case':name,'passed':bool(ok)};cases.append(row);print(json.dumps(row,ensure_ascii=False),flush=True);assert ok,row
def st(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
SETUP='''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));s.masterSpecialties=[{id:'syn-o',name:'SYN Ortopedia',active:true},{id:'syn-d',name:'SYN Dermatologia',active:true}];s.clinicSpecialties={...(s.clinicSpecialties||{}),abranfir:['syn-o','syn-d'],loures:['syn-d'],lagoa:['syn-d']};s.requests=[{id:'syn-foreign',created:'2026-11-01T10:00:00',clinic:'loures',specialty:'SYN Dermatologia',name:'SYN Loures externo',phone:'',email:'loures@example.invalid',stage:'Recusou',unmetReason:'Sem médico da especialidade',source:'Instagram',createdBy:'test_call',createdByRole:'Call Center',owner:'test_call',history:[]}];s.callBookings=[];s.currentUser=a;s.ceoRealUser='u1';s.ceoViewingAs=a==='u1'?null:a;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}'''
def view(p):p.evaluate("App.showView('wait')");p.wait_for_selector('#waitContent');p.wait_for_timeout(250)
def tap(p,loc,device):
 loc.tap() if device!='desktop' else loc.click()
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor,expected in [('test_call','Call Center'),('test_adm','Administrativa'),('test_admin','Administração'),('u1','CEO'),('test_med',None),('test_tec',None)]:
   for device,w,h in [('desktop',1366,900),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':actor,'device':device,'theme':theme}
     ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
     p=ctx.new_page();p.set_default_timeout(10000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
     p.goto(URL);p.wait_for_function('window.App&&window.GSRequestsUI&&window.GSRequestsCore');p.evaluate(SETUP,[K,actor,theme]);p.reload();p.wait_for_function('window.App&&window.RoleAccessAdminV4')
     can=p.evaluate("RoleAccessAdminV4.can('bookings')");manager=p.evaluate("RoleAccessAdminV4.can('reports')")
     if expected is None:
      check('clinical profile cannot register requests or bookings',not can and p.evaluate("(()=>{App.openRequestForm();return !document.getElementById('rSource')})()"));ctx.close();continue
     check('operational profile can register requests and bookings',can)
     view(p);tabs=p.locator('[data-req-tab]').all_inner_texts()
     check('tabs match the profile',tabs[0]=='Funil' and tabs[1].startswith('Por marcar (') and tabs[2:4]==['Marcações hora a hora','Procura não satisfeita'] and (('Indicadores do call center' in tabs)==manager))
     # Novo pedido: origem obrigatória, sem vaga -> a aguardar vaga com data de recontacto, autor e perfil
     tap(p,p.locator('#wait .page-head button.primary',has_text='Consulta por marcar'),device);p.wait_for_selector('#rSource')
     if p.locator('#rClinic').is_enabled():p.select_option('#rClinic','abranfir');p.locator('#rClinic').dispatch_event('change')
     check('form opens on an authorised clinic with its specialties',p.input_value('#rClinic')=='abranfir' and p.locator('#rSpecialty option').all_inner_texts()==['SYN Ortopedia','SYN Dermatologia'])
     p.fill('#rName','SYN Maria');p.fill('#rPhone','912 345 678');p.locator('#rPhone').dispatch_event('input')
     check('phone without history is confirmed',"Sem pedidos anteriores" in p.inner_text('#rDup'))
     p.fill('#rPhone','');p.select_option('#rSource','WhatsApp');tap(p,p.locator('#modal button.primary',has_text='Registar consulta por marcar'),device);p.wait_for_timeout(150)
     check('mobile or email is mandatory',len(st(p)['requests'])==1 and 'telemóvel ou o email' in p.inner_text('#toast'))
     p.select_option('#rSource','');p.fill('#rPhone','912 345 678');tap(p,p.locator('#modal button.primary',has_text='Registar consulta por marcar'),device);p.wait_for_timeout(150)
     check('origin is mandatory',len(st(p)['requests'])==1)
     p.select_option('#rSource','WhatsApp');tap(p,p.locator('#modal button.primary',has_text='Registar consulta por marcar'),device);p.wait_for_timeout(150)
     check('reason is mandatory for a consultation not booked',len(st(p)['requests'])==1 and 'não ficou marcada' in p.inner_text('#toast'))
     p.select_option('#rSource','WhatsApp');p.select_option('#rReason','Sem vaga na especialidade');p.locator('#rReason').dispatch_event('change')
     check('no-slot reason proposes a recontact date',len(p.input_value('#rRecontact'))==10)
     tap(p,p.locator('#modal button.primary',has_text='Registar consulta por marcar'),device);p.wait_for_timeout(250)
     r=[x for x in st(p)['requests'] if x['name']=='SYN Maria'][0]
     check('request keeps origin, reason, author and profile',r['source']=='WhatsApp' and r['unmetReason']=='Sem vaga na especialidade' and r['createdBy']==actor and r['createdByRole']==expected and r['stage']=='A aguardar vaga' and r['specialty']=='SYN Ortopedia')
     p.evaluate('App.openRequestForm()');p.fill('#rPhone','+351912345678');p.locator('#rPhone').dispatch_event('input')
     check('duplicate phone is flagged in another format','SYN Maria' in p.inner_text('#rDup'));p.evaluate("document.getElementById('modal').close()")
     view(p);tap(p,p.locator('[data-req-tab=pending]'),device);p.wait_for_timeout(200)
     seen=p.locator('[data-req-pending] .req-pending-main b').all_inner_texts();own_only=not p.evaluate("AccessScopeV4.canClinic('loures','waiting',JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')))")
     check('pending list shows new request and respects clinic access','SYN Maria' in seen and (('SYN Loures externo' in seen)!=own_only))
     deleter=expected in ['CEO','Administração']
     check('only CEO or Administração can delete from the pending list',(p.locator('[data-req-delete]').count()>0)==deleter)
     if deleter and not own_only:
      tap(p,p.locator('[data-req-pending="syn-foreign"] [data-req-delete]'),device);tap(p,p.locator('[data-req-delete-confirm]'),device);p.wait_for_timeout(150)
      check('deleting requires a reason','motivo' in p.inner_text('#reqDeleteError'))
      p.fill('#reqDeleteReason','SYN duplicado');tap(p,p.locator('[data-req-delete-confirm]'),device);p.wait_for_timeout(250)
      d=[x for x in st(p)['requests'] if x['id']=='syn-foreign'][0]
      check('deleted request leaves the list but keeps who, profile and why',d['deleted']['by']==actor and d['deleted']['role']==expected and d['deleted']['reason']=='SYN duplicado' and p.locator('[data-req-pending="syn-foreign"]').count()==0)
     # Detalhe: WhatsApp, tentativas e marcação automática ligada ao pedido (sem duplicar)
     p.evaluate('(id)=>App.openRequest(id)',r['id'])
     check('request detail shows author profile and WhatsApp link',expected in p.inner_text('.request-facts') and p.get_attribute('#modal a.req-wa','href')=='https://wa.me/351912345678')
     tap(p,p.locator('#modal button',has_text='Registar tentativa'),device);p.wait_for_timeout(200)
     rr=[x for x in st(p)['requests'] if x['id']==r['id']][0];check('contact attempt recorded with history',rr['contactAttempts']==1 and 'Tentativa de contacto 1' in rr['history'][-1]['note'])
     for _ in range(2):
      p.evaluate('(id)=>App.openRequest(id)',r['id']);p.select_option('#editStage','Marcado');tap(p,p.locator('#modal button.primary',has_text='Guardar ação'),device);p.wait_for_timeout(200)
     bs=st(p)['callBookings']
     view(p);tap(p,p.locator('[data-req-tab=pending]'),device);p.wait_for_timeout(200)
     check('booked request disappears from the pending list','SYN Maria' not in p.locator('[data-req-pending] .req-pending-main b').all_inner_texts())
     m=[x for x in st(p)['requests'] if x['id']==r['id']][0]
     check('booking deletes patient data and keeps what indicators need',m['name'].startswith('Utente (dados apagados') and m['phone']=='' and m.get('email','')=='' and m['source']=='WhatsApp' and m['createdByRole']==expected and m['clinic']=='abranfir' and all('note' not in h for h in m['history']))
     check('audit of the booking does not repeat the patient name',not any('SYN Maria' in (a.get('detail') or '') and a.get('action')=='Pedido trabalhado' for a in st(p)['audit']))
     check('booking the request counts once for its operator',len(bs)==1 and bs[0]['requestId']==r['id'] and bs[0]['by']==actor and bs[0]['role']==expected and bs[0]['source']=='WhatsApp')
     # +1 hora a hora e anulação pelo próprio
     view(p);tap(p,p.locator('[data-req-tab=bookings]'),device);p.wait_for_timeout(200)
     options=[o.get_attribute('value') for o in p.locator('#bkClinic option').all()];cl='loures' if 'loures' in options else options[0];spec={'loures':'SYN Dermatologia','abranfir':'SYN Ortopedia','lagoa':'SYN Dermatologia'}[cl]
     check('+1 only offers authorised clinics',set(options)<=set(p.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return s.clinics.filter(c=>AccessScopeV4.canClinic(String(c.id),'bookings',s)).map(c=>String(c.id))})()")))
     p.select_option('#bkClinic',cl);p.wait_for_timeout(200);p.select_option('#bkSource','Instagram');tap(p,p.locator('[data-req-book]'),device);p.wait_for_timeout(250)
     b=st(p)['callBookings'][-1]
     check('+1 booking stores clinic, specialty, origin, operator and profile',[b['clinic'],b['specialty'],b['source'],b['by'],b['role']]==[cl,spec,'Instagram',actor,expected])
     check('+1 confirmation is shown','Registado' in p.inner_text('[data-req-panel]'))
     tap(p,p.locator('[data-req-undo]').first,device);p.wait_for_timeout(250)
     check('own booking can be undone within the hour',len(st(p)['callBookings'])==1)
     p.select_option('#bkSource','');tap(p,p.locator('[data-req-book]'),device);p.wait_for_timeout(200)
     check('+1 without origin is refused',len(st(p)['callBookings'])==1)
     # Procura não satisfeita
     tap(p,p.locator('[data-req-tab=unmet]'),device);p.wait_for_timeout(200)
     check('unmet demand lists the clinic and specialty','SYN Ortopedia' in p.inner_text('[data-req-panel] table'))
     if manager:
      tap(p,p.locator('[data-req-tab=kpis]'),device);p.wait_for_timeout(250)
      body=p.inner_text('[data-req-panel]')
      check('direction indicators show operator name and profile',expected in body and 'Pedido → marcação' in body)
      tap(p,p.locator('[data-req-role="Administrativa"]'),device);p.wait_for_timeout(250)
      check('administrativas indicators per clinic are available','Administrativas por clínica' in p.inner_text('[data-req-panel]'))
      p.select_option('#reqRole','Call Center' if expected!='Call Center' else 'Administrativa');p.wait_for_timeout(250)
      check('profile filter excludes other profiles','Sem atividade' in p.inner_text('[data-req-panel] table tbody'))
     check('no horizontal page overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
     check('no page errors',not errors)
     if theme=='light' and actor in ['test_call','u1']:p.screenshot(path=str(OUT/f'requests-{actor}-{device}.png'),full_page=True)
     ctx.close()
 finally:browser.close();(OUT/'requests-results.json').write_text(json.dumps(cases,ensure_ascii=False,indent=1))
print(json.dumps({'passed':sum(c['passed'] for c in cases),'contexts':36,'scope':'synthetic demo only'}))

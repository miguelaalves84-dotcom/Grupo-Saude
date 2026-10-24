from text_editing_helpers import *
import text_editing_helpers as H
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1366,1000),('tablet',820,1180),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'actor':actor,'device':device,'theme':theme};H.scope=scope;c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',permissions=['clipboard-read','clipboard-write'],service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(9000);p.on('dialog',lambda d:d.accept());p.goto(URL);p.wait_for_function('window.GSSafeActionsV4?.renderAround&&window.GSDemoClinicAssociations');p.wait_for_timeout(1300)
     p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));GSDemoClinicAssociations.repair(s);s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.agendaEvents=[];s.complaints=[];s.conversations=[{id:'syn-writing-chat',title:'SYN Conversa São João',members:[a,a==='u1'?'test_adm':'u1'],requestId:null,messages:[]}];for(const x of [...s.users,...Object.values(s.employees||{})]){x.name='SYN '+x.id;x.email=x.id+'@example.invalid';x.hr={...x.hr,grossSalary:0,mealAllowance:0,contractType:'SYN Contrato Histórico',payrollContracts:[],billingProfiles:[]}}localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme]);p.reload();p.wait_for_function('window.GSTestAgentV4?.ready===true');cdp=c.new_cdp_session(p)
     p.evaluate('App.showView("chat")');exercise(p,'#chatMessage',cdp);p.locator('#chatMessage').fill('SYN rascunho São João');p.evaluate('App.renderAll()');check('chat background refresh preserves draft and focus',p.locator('#chatMessage').input_value()=='SYN rascunho São João' and p.locator('#chatMessage').evaluate('(e)=>document.activeElement===e'))
     p.locator('#chatMessage').dispatch_event('keydown',{'key':'Enter','keyCode':229,'isComposing':True});check('IME Enter never sends partial chat',len(state(p)['conversations'][0]['messages'])==0)
     p.locator('#chatContent button').filter(has_text='Enviar').click();check('explicit chat send stored once',len(state(p)['conversations'][0]['messages'])==1 and state(p)['conversations'][0]['messages'][0]['text']=='SYN rascunho São João');check('successful send clears only committed composer',p.locator('#chatMessage').input_value()=='')
     p.evaluate('App.showView("clock");AttendanceBookV4.manual()');exercise(p,'#attendanceReason',cdp);close(p)
     if actor in ['test_adm','test_admin','u1']:
      p.evaluate('AgendaUIV4.open()');exercise(p,'#agendaFilters [name=search]',cdp);p.locator('[data-agenda-action=new]').click()
      for field in ['title','location','description']:exercise(p,'#agendaForm [name='+field+']',cdp)
      p.locator('#agendaForm [name=title]').fill('SYN João — ação');p.locator('#agendaForm [name=location]').fill('Rua de São João, nº 12');p.locator('#agendaForm [name=description]').fill('Observação: amanhã às três.');p.locator('#agendaForm [type=submit]').click();expect(p.locator('#agendaDialog')).not_to_be_visible();event=state(p)['agendaEvents'][0];check('agenda text saved exactly with accents',event['title']=='SYN João — ação' and event['location']=='Rua de São João, nº 12' and event['description']=='Observação: amanhã às três.')
      p.evaluate('App.showView("complaints")');p.wait_for_selector('#complaintSearch');exercise(p,'#complaintSearch',cdp);p.locator('#complaintNew').click()
      for selector in ['#complaintTitle','#complaintName','#complaintEmail','#complaintDescription']:exercise(p,selector,cdp)
      close(p)
     if actor in ['test_admin','u1']:
      p.evaluate('App.showView("clock")');p.wait_for_selector('#attendanceSearch');exercise(p,'#attendanceSearch',cdp)
      p.evaluate('HRMasterV4.open("test_med","dados")')
      for selector in ['#hrName','#hrEmail','#hrPhone','#hrAddress']:exercise(p,selector,cdp)
      p.locator('#hrName').fill('SYN João São');p.locator('[data-gs-action="HRMasterV4.save"]').click();expect(p.locator('#modal')).not_to_be_visible();saved=state(p);check('HR name saved exactly without lost letters',saved['employees']['test_med']['name']=='SYN João São' and next(u for u in saved['users'] if u['id']=='test_med')['name']=='SYN João São')
     if actor=='u1':
      p.evaluate('AgendaUIV4.open()');p.locator('#agendaFilters [name=search]').focus();p.evaluate('window.__privilegedEditor=document.activeElement');p.evaluate('CEOReservedAreaV4.select("test_med")');check('profile simulation never retains privileged editor',not p.evaluate('window.__privilegedEditor.isConnected') and not p.evaluate('RoleAccessAdminV4.guard("agenda")'));p.evaluate('CEOReservedAreaV4.select("__CEO__")')
     p.evaluate('App.showView("myhr")');p.screenshot(path=str(OUT/(actor+'-'+device+'-'+theme+'-writing.png')));c.close()
 finally:
  b.close();(OUT/'text-editing-results.json').write_text(json.dumps({'checks':results,'fields':fields,'limitations':['Chromium native IME via CDP is not a physical Android keyboard.','Clipboard uses native browser clipboard and desktop shortcut, not Android selection handles.','Real Gboard/Samsung autocorrection, suggestions and on-screen keyboard require physical confirmation.']},ensure_ascii=False,indent=2))
print(json.dumps({'checks':len(results),'failed':sum(not x['passed'] for x in results),'fieldContexts':len(fields)}))

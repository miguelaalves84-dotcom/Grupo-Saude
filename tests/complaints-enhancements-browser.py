"""Trusted touch/mouse complaints movements, default clerk, audit, reopening and persistence."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/complaints-enhancements'));OUT.mkdir(parents=True,exist_ok=True);rows=[];scope={}
def check(name,value):
 rows.append({**scope,'case':name,'state':'Aprovada' if value else 'Falhou'});print(json.dumps({**scope,'case':name,'passed':bool(value)}),flush=True);assert value,name

def state(page):return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def complaint(page):return state(page)['complaints'][0]
def touch(cdp,event,x,y):cdp.send('Input.dispatchTouchEvent',{'type':event,'touchPoints':[] if event in ['touchEnd','touchCancel'] else [{'x':x,'y':y,'id':1,'radiusX':4,'radiusY':4,'force':1}]})
def drag(page,context,stage,touch_input,cancel=False,small=False):
 handle=page.locator('.complaint-drag-handle').first;handle.evaluate("e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'})");b=handle.bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2;cdp=context.new_cdp_session(page)
 if touch_input:touch(cdp,'touchStart',x,y)
 else:page.mouse.move(x,y);page.mouse.down()
 if small:
  if touch_input:touch(cdp,'touchMove',x+3,y+2)
  else:page.mouse.move(x+3,y+2)
 else:
  if touch_input:touch(cdp,'touchMove',x+16,y+12)
  else:page.mouse.move(x+16,y+12,steps=4)
  page.wait_for_selector('.candidate-drag-ghost');check('visible drag feedback',page.locator('.candidate-drag-ghost').count()==1)
  board=page.locator('.complaints-board');target=page.locator('[data-complaint-stage="'+stage+'"]');bb=board.bounding_box();tb=target.bounding_box();left=max(bb['x'],tb['x']);right=min(bb['x']+bb['width'],tb['x']+tb['width']);assert right-left>30,'Destination must be visible';xx=(left+right)/2;yy=min(max(tb['y']+70,y),tb['y']+tb['height']-25,page.viewport_size['height']-25)
  if touch_input:touch(cdp,'touchMove',xx,yy)
  else:page.mouse.move(xx,yy,steps=8)
  page.wait_for_function('(stage)=>document.querySelector(".candidate-drop-target")?.dataset.complaintStage===stage',arg=stage);check('destination highlighted',page.locator('.candidate-drop-target').get_attribute('data-complaint-stage')==stage);x,y=xx,yy
 if touch_input:touch(cdp,'touchCancel' if cancel else 'touchEnd',x,y)
 else:
  if cancel:page.keyboard.press('Escape')
  page.mouse.up()
 page.wait_for_timeout(100);check('drag feedback cleaned',page.locator('.candidate-drag-ghost,.candidate-drop-target').count()==0);cdp.detach()

def initialize(page,actor):
 page.goto(URL);page.wait_for_function('window.ComplaintsV4 && window.GSDemoClinicAssociations');page.evaluate('(a)=>CEOReservedAreaV4.select(a)',actor)
 # Managers get explicit synthetic associations before waiting for the create action.
 if actor!='test_adm':
  page.evaluate('''([k,a])=>{const s=JSON.parse(localStorage.getItem(k));for(const p of [s.users.find(p=>p.id===a),s.employees[a]].filter(Boolean)){p.clinics=['abranfir'];p.clinicIds=['abranfir'];p.clinic='abranfir';p.clinicId='abranfir'}localStorage.setItem(k,JSON.stringify(s))}''',[K,actor])
 page.evaluate('App.showView("complaints")');page.evaluate('ComplaintsV4.refresh()')
 try:page.wait_for_selector('#complaintNew:not([disabled])')
 except Exception:
  s=state(page);print(json.dumps({'actor':actor,'user':[{k:p.get(k) for k in ['id','role','active','clinics','clinicIds','clinic','clinicId','email']} for p in s.get('users',[]) if p['id']==actor],'employee':{k:s.get('employees',{}).get(actor,{}).get(k) for k in ['role','active','clinics','clinicIds','clinic','clinicId']},'repair':s.get('syntheticClerkClinicRepair'),'content':page.locator('#complaintsContent').inner_text()}),flush=True);raise

def create(page):
 page.locator('#complaintNew').click();check('initial registrar is automatic and cannot be selected',page.locator('#complaintResponsible').count()==0 and page.locator('#complaintRegistrar').get_attribute('readonly') is not None)
 if scope['profile']=='test_adm':check('single assigned clinic selected automatically',page.locator('#complaintClinic').input_value()=='abranfir')
 page.locator('#complaintReceived').fill('2026-10-19T10:00');page.locator('#complaintTitle').fill('SYNTHETIC touch complaint');page.locator('#complaintName').fill('SYNTHETIC claimant');page.locator('#complaintDescription').fill('SYNTHETIC incident');page.locator('#complaintClinic').select_option('abranfir')
 page.locator('#complaintInitialFiles').set_input_files({'name':'invalid.pdf','mimeType':'application/pdf','buffer':b'NOT A PDF'});page.locator('#complaintCreate').click();page.wait_for_function('document.getElementById("complaintInitialStatus").textContent.startsWith("Registo não confirmado")');check('invalid initial document rejected before saving',not state(page).get('complaints') and 'Registo não confirmado' in page.locator('#complaintInitialStatus').inner_text())
 page.locator('#complaintInitialFiles').set_input_files([{'name':'synthetic-original.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nSYNTHETIC ORIGINAL\n%%EOF'},{'name':'synthetic-proof.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nSYNTHETIC PROOF\n%%EOF'}])
 if scope['profile']=='u1' and scope['device']=='desktop':
  page.evaluate('''k=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===k&&JSON.parse(value).complaints?.[0]?.documents?.length===2){Storage.prototype.setItem=original;throw new DOMException('SYNTHETIC temporary storage failure','QuotaExceededError')}return original.call(this,key,value)}}''',K)
 page.locator('#complaintCreate').click()
 if scope['profile']=='u1' and scope['device']=='desktop':
  page.wait_for_function('document.getElementById("complaintInitialStatus")?.textContent.includes("1 de 2 documentos confirmados")');check('partial upload failure is explicit and preserves saved document',len(state(page)['complaints'])==1 and len(complaint(page)['documents'])==1);page.locator('#complaintCreate').click()
 page.wait_for_selector('#complaintSave');c=complaint(page);check('retry never duplicates complaint or attachment',len(state(page)['complaints'])==1 and len({d['id'] for d in c['documents']})==2);check('multiple initial documents and original saved with registrar audit',len(c['documents'])==2 and c['originalDocumentId']==c['documents'][0]['id'] and c['responsible']==scope['profile'] and c['registeredBy']==scope['profile'] and c['history'][0]['by']==scope['profile'] and bool(c['history'][0]['at']));page.locator('#modal').evaluate('(e)=>e.close()')

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox'])
  for device,w,h in [('desktop',1440,1000),('android-tablet-portrait',820,1180),('android-tablet-landscape',1280,800)]:
   for actor in ['u1','test_admin','test_adm']:
    scope={'device':device,'profile':actor};mobile=device!='desktop';context=browser.new_context(viewport={'width':w,'height':h},has_touch=mobile,is_mobile=mobile,service_workers='block',user_agent='Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' if mobile else None);context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());page=context.new_page();page.set_default_timeout(12000);page.on('dialog',lambda d:d.accept());errors=[];page.on('pageerror',lambda e:errors.append(str(e)));initialize(page,actor)
    if actor=='test_adm':check('default test clerk repaired without broad access',state(page)['syntheticClerkClinicRepair']['to']==['abranfir'] and page.locator('#complaintNew').is_enabled())
    create(page);before=complaint(page);drag(page,context,'Enviada à advogada',mobile,small=True);check('short touch does not move or alter history',complaint(page)==before);drag(page,context,'Enviada à advogada',mobile,cancel=True);check('cancel does not change state',complaint(page)==before);drag(page,context,'Enviada à advogada',mobile);check('drop requests confirmation before persistence',page.locator('#complaintStage').input_value()=='Enviada à advogada' and complaint(page)['stage']=='Recebida');page.locator('#complaintSave').click();check('missing requirements do not change state',complaint(page)['stage']=='Recebida');page.locator('#lawyerEmail').fill('lawyer@example.invalid');page.locator('#lawyerSent').fill('2026-10-20T12:00');page.locator('#complaintTransitionNotes').fill('SYNTHETIC handover note');page.locator('#complaintSave').click();page.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).complaints[0].stage==="Enviada à advogada"',arg=K);c=complaint(page);event=c['history'][-1];check('stage history includes actor clinic proofs and notes',event['fromStage']=='Recebida' and event['toStage']=='Enviada à advogada' and event['by']==actor and event['clinic']=='abranfir' and bool(event['documentIds']) and event['observations']=='SYNTHETIC handover note');check('visual timeline shows both visits and evidence',page.locator('[data-timeline-stage]').count()==2 and 'SYNTHETIC handover note' in page.locator('.complaint-chronology').inner_text());page.locator('#modal').evaluate('(e)=>e.close()');page.reload();page.wait_for_function('window.ComplaintsV4');page.evaluate('App.showView("complaints")');page.wait_for_selector('.complaint-card');check('state persists after reload',complaint(page)['stage']=='Enviada à advogada');page.locator('[data-complaint-target]').select_option('Resposta recebida da advogada');page.locator('[data-complaint-move]').click();page.wait_for_selector('#complaintSave');check('selector uses the same validated destination form',page.locator('#complaintStage').input_value()=='Resposta recebida da advogada');page.locator('#complaintSave').click();check('selector cannot bypass receipt proof',complaint(page)['stage']=='Enviada à advogada');page.locator('#modal').evaluate('(e)=>e.close()')
    if actor=='u1' and device=='desktop':
     # Complete and reopen through the visible forms; never mutate workflow state directly.
     original_due=complaint(page)['deadline'];proof=complaint(page)['documents'][0]['id']
     def advance(stage,fields):
      page.locator('[data-complaint-target]').select_option(stage);page.locator('[data-complaint-move]').click();page.wait_for_selector('#complaintSave')
      for key,value in fields.items():
       node=page.locator('#'+key)
       if node.evaluate('(e)=>e.tagName')=='SELECT':node.select_option(value)
       else:node.fill(value)
      page.locator('#complaintSave').click();page.wait_for_function('([k,s])=>JSON.parse(localStorage.getItem(k)).complaints[0].stage===s',arg=[K,stage]);page.locator('#modal').evaluate('(e)=>e.close()')
     advance('Resposta recebida da advogada',{'lawyerReceipt':'2026-10-20T13:00','lawyerProof':proof,'lawyerResponseAt':'2026-10-20T14:00','lawyerResponseDoc':proof})
     advance('Resposta enviada ao reclamante e à ERS',{'delivery_claimant':'2026-10-20T15:00','method_claimant':'SYNTHETIC manual email','proof_claimant':proof,'delivery_ers':'2026-10-20T15:01','method_ers':'SYNTHETIC manual email','proof_ers':proof})
     advance('Confirmação da resposta',{'confirmationState':'Recebida','confirmationAt':'2026-10-20T16:00','confirmationProof':proof})
     advance('Encerrada',{});closed=complaint(page);check('six stages completed with required evidence',len({e['toStage'] for e in closed['history']})==6)
     page.locator('[data-complaint-target]').select_option('Recebida');page.locator('[data-complaint-move]').click();page.locator('#complaintSave').click();check('reopening requires justification',complaint(page)['stage']=='Encerrada');page.locator('#complaintReopenReason').fill('SYNTHETIC additional evidence');page.locator('#complaintSave').click();page.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).complaints[0].stage==="Recebida"',arg=K);reopened=complaint(page);check('reopening preserves original deadline documents and complete history',reopened['deadline']==original_due and reopened['documents']==closed['documents'] and reopened['history'][:-1]==closed['history'] and reopened['history'][-1]['reason']=='SYNTHETIC additional evidence');check('timeline preserves repeated stage and closed visit',page.locator('[data-timeline-stage]').count()==7 and 'reabertura' in page.locator('.complaint-chronology').inner_text());page.locator('#modal').evaluate('(e)=>e.close()')
    if actor=='test_adm':
     page.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));for(const p of [s.users.find(p=>p.id==='test_adm'),s.employees.test_adm].filter(Boolean)){p.clinics=['abranfir','loures'];p.clinicIds=p.clinics;p.clinic='abranfir';p.clinicId='abranfir'}localStorage.setItem(k,JSON.stringify(s));ComplaintsV4.refresh()}''',K);page.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));for(const [id,clinic] of [['test_med','abranfir'],['test_tec','loures']])for(const p of [s.users.find(p=>p.id===id),s.employees[id]].filter(Boolean)){p.clinics=[clinic];p.clinicIds=[clinic];p.clinic=clinic;p.clinicId=clinic}localStorage.setItem(k,JSON.stringify(s));ComplaintsV4.refresh()}''',K);page.locator('#complaintNew').click();check('multi-clinic clerk selects only assigned clinics',page.locator('#complaintClinic option').evaluate_all('(os)=>os.map(o=>o.value).filter(Boolean)')==['abranfir','loures']);check('multi-clinic clerk must choose a clinic',page.locator('#complaintClinic').input_value()=='');page.locator('#complaintClinic').select_option('abranfir');check('involved list excludes other clinic',page.locator('#complaintInvolved option[value="test_med"]').count()==1 and page.locator('#complaintInvolved option[value="test_tec"]').count()==0);page.locator('#complaintInvolved').select_option(['test_med','test_adm']);check('multiple involved staff can be selected',page.locator('#complaintInvolved').evaluate('(e)=>e.selectedOptions.length')==2);page.locator('#complaintClinic').select_option('loures');check('changing clinic removes invalid selection and updates people',page.locator('#complaintInvolved option[value="test_med"]').count()==0 and page.locator('#complaintInvolved option[value="test_tec"]').count()==1 and page.locator('#complaintInvolved').evaluate('(e)=>[...e.selectedOptions].map(o=>o.value)')==['test_adm']);page.locator('#modal').evaluate('(e)=>e.close()')
    check('no JS errors',not errors);page.screenshot(path=str(OUT/(device+'-'+actor+'-complaints.png')),full_page=True);context.close()
  browser.close()
finally:(OUT/'complaints-enhancements-results.json').write_text(json.dumps({'cases':rows,'passed':sum(x['state']=='Aprovada' for x in rows),'scope':'Trusted Chromium input, Android emulation, synthetic browser storage; central services verified separately in PostgreSQL'},indent=2))

"""Trusted Chromium touch input (CDP), Android tablet emulation, mouse and pen. Synthetic only."""
import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('GS_TEST_URL',(ROOT/'index.html').as_uri());ORIGIN=URL.split('/index.html')[0]
KEY='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-pointer-artifacts'));OUT.mkdir(parents=True,exist_ok=True)
rows=[];scope={}
def verify(name,value):
    rows.append({**scope,'case':name,'state':'Aprovada' if value else 'Falhou'})
    print(json.dumps({**scope,'case':name,'passed':bool(value)}),flush=True)
    assert value,json.dumps(scope)+': '+name
def state(page):return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def candidate(page):return state(page)['candidates'][0]
def prepare(page,actor):
    page.goto(URL);page.wait_for_function('window.CommunicationsV4 && window.CandidateDragV4')
    page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoRealUser='u1';s.ceoViewingAs=actor==='u1'?null:actor;s.candidates=[];for(const u of s.users){u.name='SYNTHETIC '+u.id;u.email=u.id+'@example.invalid';if(s.employees[u.id])s.employees[u.id].name=u.name}localStorage.setItem(key,JSON.stringify(s))}''',[KEY,actor]);page.reload();page.wait_for_function('window.RecruitmentV4');page.wait_for_selector('#gsTestAgentButton',state='attached')
    if actor in ['u1','test_admin']:
        page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));CommunicationsV4.importCV({sourceId:'pointer-synthetic',name:'SYNTHETIC POINTER CANDIDATE',email:'pointer@example.invalid',phone:'912000000',role:s.jobRoles[0].id,clinic:s.clinics[0].id,document:{name:'synthetic.pdf',dataUrl:'data:application/pdf;base64,JVBERi0xLjQK'}});V4ClinicHR.showCandidates();window.__pointerPageToken='same-document';window.__inputs=[];window.__dragTrace=[];for(const name of ['pointerdown','pointermove','pointercancel','pointerup','click','dragstart','dragover','drop','lostpointercapture'])document.addEventListener(name,e=>{window.__dragTrace.push({event:name,x:e.clientX,y:e.clientY,type:e.pointerType,target:e.target.className});window.__dragTrace=window.__dragTrace.slice(-35)},true);document.addEventListener('pointerdown',e=>window.__inputs.push({type:e.pointerType,trusted:e.isTrusted}),true)}''');page.wait_for_selector('.candidate-drag-handle')

def point(locator):
    b=locator.bounding_box();return {'x':b['x']+min(b['width']/2,80),'y':b['y']+b['height']/2}
def touch(cdp,kind,x,y):
    cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind in ['touchEnd','touchCancel'] else [{'x':x,'y':y,'id':1,'radiusX':4,'radiusY':4,'force':1}]})
def drag(page,cdp,stage,kind='touch',cancel=False,small=False):
    handle=page.locator('.candidate-drag-handle');handle.evaluate("async e=>{e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))}");start=point(handle)
    verify('gesture starts on the visible handle',page.evaluate('([x,y])=>document.elementFromPoint(x,y)?.classList.contains("candidate-drag-handle")',[start['x'],start['y']]))
    if kind=='touch':touch(cdp,'touchStart',start['x'],start['y'])
    else:cdp.send('Input.dispatchMouseEvent',{'type':'mousePressed','x':start['x'],'y':start['y'],'button':'left','buttons':1,'clickCount':1,'pointerType':kind})
    def move(x,y):
        if kind=='touch':touch(cdp,'touchMove',x,y)
        else:cdp.send('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x,'y':y,'button':'left','buttons':1,'pointerType':kind})
        page.wait_for_timeout(25)
    if small:
        move(start['x']+3,start['y']+2);end=start
    else:
        move(start['x']+14,start['y']+12)
        page.locator('.candidate-drag-ghost').wait_for(state='visible',timeout=3000)
        verify('drag ghost is visible for '+kind,page.locator('.candidate-drag-ghost').count()==1)
        board=page.locator('.candidate-board');col=page.locator('.candidate-column[data-stage="'+stage+'"]')
        if cancel:
            before_top=board.bounding_box()['y'];page.wait_for_timeout(850)
            verify('existing approvals refresh keeps the board stable during drag',page.locator('#hrApprovalsCard').count()==1 and abs(board.bounding_box()['y']-before_top)<2 and page.locator('.candidate-drag-ghost').count()==1)
        deadline=time.monotonic()+5
        while True:
            r=board.bounding_box();b=col.bounding_box();left=max(r['x'],b['x']);right=min(r['x']+r['width'],b['x']+b['width'])
            if right-left>=160:break
            assert time.monotonic()<deadline,'Horizontal autoscroll did not reach '+stage+' '+str(page.evaluate('()=>({trace:window.__dragTrace,input:window.__lastDropInput,status:document.querySelector(".candidate-drag-status")?.textContent,board:{scroll:document.querySelector(".candidate-board").scrollLeft,rect:document.querySelector(".candidate-board").getBoundingClientRect().toJSON()},ghost:!!document.querySelector(".candidate-drag-ghost")})'))
            x=r['x']+r['width']-10 if b['x']+b['width']/2>=r['x']+r['width']/2 else r['x']+10
            move(x,max(r['y']+25,min(start['y'],r['y']+r['height']-25,page.viewport_size['height']-25)));page.wait_for_timeout(70)
        for attempt in range(30):
            r=board.bounding_box();b=col.bounding_box();left=max(r['x'],b['x']);right=min(r['x']+r['width'],b['x']+b['width']);top=max(r['y'],b['y'],100);bottom=min(r['y']+r['height'],b['y']+b['height'],page.viewport_size['height']-20)
            assert right>left+20 and bottom>top+20,'Destination must intersect the visible tablet area'
            end={'x':(left+right)/2,'y':(top+bottom)/2};move(end['x'],end['y'])
            if page.locator('.candidate-drop-target[data-stage="'+stage+'"]').count()==1:break
        verify('drop point hits the intended visible column '+stage,page.evaluate('([x,y,s])=>document.elementFromPoint(x,y)?.closest(".candidate-column")?.dataset.stage===s',[end['x'],end['y'],stage]))
        verify('correct destination highlighted for '+stage,page.locator('.candidate-drop-target').get_attribute('data-stage')==stage)
        if cancel:page.screenshot(path=str(OUT/(scope['device']+'-'+scope['profile']+'-drag-cancel.png')))
    page.evaluate('([x,y])=>window.__lastDropInput={x,y,hit:document.elementFromPoint(x,y)?.closest(".candidate-column")?.dataset.stage,highlight:document.querySelector(".candidate-drop-target")?.dataset.stage,board:document.querySelector(".candidate-board").getBoundingClientRect().toJSON(),scroll:document.querySelector(".candidate-board").scrollLeft}',[end['x'],end['y']])
    if cancel and kind!='touch':page.keyboard.press('Escape')
    if kind=='touch':touch(cdp,'touchCancel' if cancel else 'touchEnd',end['x'],end['y'])
    else:cdp.send('Input.dispatchMouseEvent',{'type':'mouseReleased','x':end['x'],'y':end['y'],'button':'left','buttons':0,'clickCount':1,'pointerType':kind})
    page.wait_for_timeout(100)
    verify('ghost and destination cleaned after gesture',page.locator('.candidate-drag-ghost,.candidate-drop-target').count()==0)
    if not cancel and not small and stage in ['Entrevista marcada','Recusado','Contratado']:
        opened=page.locator('#modal').is_visible()
        if not opened:print('POST_DROP_DIAGNOSTIC',page.evaluate('()=>({trace:window.__dragTrace,input:window.__lastDropInput,status:document.querySelector(".candidate-drag-status")?.textContent,open:document.querySelector("#modal").open,title:document.querySelector("#modalTitle").textContent,stage:JSON.parse(localStorage.getItem("grupo_saude_v4_demo_2")).candidates[0].stage})'),flush=True)
        verify('required dialog remains open after release '+stage,opened)

try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    for device,width,height in [('android-tablet-portrait',820,1180),('android-tablet-landscape',1280,800),('desktop',1440,1000)]:
      for actor in ['u1','test_admin']:
        scope={'device':device,'profile':actor};mobile=device!='desktop'
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=mobile,is_mobile=mobile,device_scale_factor=1,user_agent='Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' if mobile else None,service_workers='block')
        context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());page=context.new_page();page.set_default_timeout(12000);page.on('dialog',lambda d:d.accept());errors=[];page.on('pageerror',lambda e:errors.append(str(e)));prepare(page,actor);cdp=context.new_cdp_session(page)
        verify('five unchanged ordered stages',page.locator('.candidate-column').evaluate_all('(xs)=>xs.map(x=>x.dataset.stage)')==['Candidatos','Entrevista marcada','Recusado','Em análise','Contratado'])
        initial=candidate(page);kind='touch' if mobile else 'mouse'
        drag(page,cdp,'Em análise',kind,small=True)
        verify('short tap does not change data/history',candidate(page)==initial)
        if mobile:
            board=page.locator('.candidate-board');board.evaluate('(b)=>b.scrollLeft=0');r=board.bounding_box();x=r['x']+min(r['width']-20,350);y=min(r['y']+r['height']-30,page.viewport_size['height']-30)
            touch(cdp,'touchStart',x,y)
            for i in range(1,9):touch(cdp,'touchMove',x-i*25,y);page.wait_for_timeout(20)
            touch(cdp,'touchEnd',x-200,y);page.wait_for_timeout(350)
            verify('horizontal finger pan scrolls without moving candidates',board.evaluate('(b)=>b.scrollLeft')>20 and candidate(page)==initial)
        drag(page,cdp,'Em análise',kind,cancel=True);verify('pointer cancellation preserves complete record',candidate(page)==initial)
        drag(page,cdp,'Em análise',kind);verify('drop updates card, counts and audit without reload',candidate(page)['stage']=='Em análise' and len(candidate(page)['history'])==len(initial['history'])+1 and page.locator('[data-stage="Em análise"] .candidate-card').count()==1 and page.evaluate('window.__pointerPageToken')=='same-document')
        drag(page,cdp,'Entrevista marcada',kind);verify('interview drop opens required form before saving',page.locator('#candidateInterview').is_visible() and candidate(page)['stage']=='Em análise');page.locator('#candidateConfirmMove').click();verify('missing interview cannot be saved',candidate(page)['stage']=='Em análise');page.locator('#candidateInterview').fill('2026-10-22T14:30');page.locator('#candidateMode').select_option('tele');page.locator('#candidateInterviewerPhone').fill('210000000');page.locator('#candidateContactPhone').fill('910000000');page.locator('#candidateConfirmMove').click();verify('confirmed interview and pending notification persisted',candidate(page)['stage']=='Entrevista marcada' and candidate(page)['notifications'][-1]['status']=='PendingConfig')
        drag(page,cdp,'Recusado',kind);page.locator('#candidateConfirmMove').click();verify('rejection drop cannot bypass confirmation',candidate(page)['stage']=='Entrevista marcada');page.locator('#candidateConfirm').check();page.locator('#candidateConfirmMove').click();verify('confirmed rejection is saved once',candidate(page)['stage']=='Recusado' and candidate(page)['notifications'][-1]['kind']=='rejection')
        drag(page,cdp,'Contratado',kind);page.locator('#candidateConfirmMove').click();verify('hiring drop requires explicit employee choice',candidate(page)['stage']=='Recusado');page.locator('[name="candidateCreate"][value="no"]').check();page.locator('#candidateConfirmMove').click();verify('hired without creating employee preserves CV',candidate(page)['stage']=='Contratado' and not candidate(page).get('employeeId') and candidate(page)['documents']==initial['documents'])
        drag(page,cdp,'Candidatos','pen' if not mobile else kind);verify('can drag back across all columns, retaining audit',candidate(page)['stage']=='Candidatos' and candidate(page)['history'][-1]['action']=='Contratado → Candidatos')
        page.locator('[data-candidate-target]').select_option('Em análise');page.locator('[data-candidate-move]').click();verify('accessible selector remains available',candidate(page)['stage']=='Em análise')
        inputs=page.evaluate('window.__inputs');verify('trusted '+kind+' Pointer Events were exercised',any(i['type']==kind and i['trusted'] for i in inputs))
        if not mobile:verify('trusted pen input was exercised',any(i['type']=='pen' and i['trusted'] for i in inputs))
        verify('no JavaScript exceptions',not errors);page.screenshot(path=str(OUT/(device+'-'+actor+'-complete.png')),full_page=True);context.close()
    for actor in ['test_adm','test_med','test_tec','test_call']:
        scope={'device':'android-tablet-portrait','profile':actor};context=browser.new_context(viewport={'width':820,'height':1180},is_mobile=True,has_touch=True);context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());page=context.new_page();prepare(page,actor)
        verify('unauthorized profile has no drag handles or candidate access',page.locator('.candidate-drag-handle').count()==0 and page.evaluate('()=>{try{CommunicationsV4.candidates();return false}catch{return V4ClinicHR.showCandidates()===false}}'));context.close()
    browser.close()
finally:
 (OUT/'candidate-pointer-results.json').write_text(json.dumps({'scope':'Trusted CDP input, Chromium Android tablet emulation (not a physical Android device), synthetic local data only','cases':rows,'passed':sum(r['state']=='Aprovada' for r in rows),'failed':sum(r['state']=='Falhou' for r in rows)},indent=2))
print(json.dumps({'passed':len(rows),'scope':'Android tablet touch emulation, desktop mouse/pen, six profile guards; synthetic only'}))

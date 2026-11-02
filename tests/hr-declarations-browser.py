"""Issue 16: synthetic user operations; Chromium emulation is not physical Android validation."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/hr-declarations'));OUT.mkdir(parents=True,exist_ok=True);K='grupo_saude_v4_demo_2';cases=[];scope={}
def check(name,result):
 cases.append({**scope,'case':name,'passed':bool(result)});assert result,name
def click(p,action,id=None):p.locator('#modalBody [data-decl-action="'+action+'"]'+('[data-id="'+id+'"]' if id else '')).first.click()
def seed(p,profile,theme):
 p.goto(URL);p.wait_for_function('window.HRDeclarationsV4&&window.GSHRDeclarations');p.evaluate('''([k,profile,theme])=>{let s=JSON.parse(localStorage.getItem(k));s.clinics=[{id:'decl-a',name:'Clínica SYN A',active:true},{id:'decl-b',name:'SYN Clínica B',active:true}];s.employees={};s.monthlyRosters={};s.timeEntries=[];s.timeOccurrences=[];s.hrCompanyDocuments=[];s.hrDeclarationRequests=[];s.hrPortalReceipts=[];s.hrAuthorizedSigners=[];s.hrPortalRevision=0;s.leave=[];for(const u of s.users){u.active=true;u.clinics=['decl-a'];u.clinicIds=['decl-a'];u.clinic='decl-a';u.profession='Fisioterapeuta';u.hr={nif:'000000000',admissionDate:'2024-01-01',professionalDuties:'Atividade sintética conferida',departureDate:'2026-11-02',terminationReason:'Fim sintético',terminationConfirmedAt:'2026-11-02T08:00Z',terminationConfirmedBy:'u1',startTime:'09:00',endTime:'17:00',payrollContracts:[{id:'contract-'+u.id,from:'2024-01-01',until:'2027-01-01',regime:'employment',contractLabel:'Sem termo',employerName:'SYN Entidade Empregadora',employerNif:'000000000',baseCents:120000,mealCents:600,seniorityCents:0,confirmedAt:'2026-01-01T12:00Z',confirmedBy:'u1'}]};s.leave.push({id:'vacation-'+u.id,user:u.id,type:'Férias',status:'Aprovado',days:['2026-11-02'],clinic:'decl-a'})}localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+profile,theme);CEOReservedAreaV4.select(profile);App.showView('myhr');}''',[K,profile,theme]);p.locator('#portalPersonalEntry').wait_for();p.locator('#portalPersonalEntry [data-portal-action=personal]').click();p.locator('[data-portal-action=declarations]').click()
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for profile in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
   for device,w,h in [('desktop',1440,1000),('tablet',1280,800),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':profile,'device':device,'theme':theme};ctx=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=ctx.new_page();p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));seed(p,profile,theme)
     check('catalogue has twelve models',p.locator('#declarationCatalogue article').count()==12);p.locator('#declarationSearch').fill('férias');check('accented search finds holidays',p.locator('#declarationCatalogue article').count()==1);p.locator('#declarationSearch').fill('zzzz');check('empty search result','Sem resultados' in p.locator('#declarationCatalogue').inner_text());p.locator('#declarationSearch').fill('');check('clear restores twelve',p.locator('#declarationCatalogue article').count()==12)
     models=p.evaluate('GSHRDeclarations.catalogue().map(m=>m.key)')
     for key in models:
      click(p,'model',key);p.locator('#declReference').fill('2026-11-02')
      if p.locator('#declStart').count():p.locator('#declStart').fill('2026-11-02');p.locator('#declEnd').fill('2026-11-02')
      click(p,'preview');paper=p.locator('#declarationPreview .declaration-paper');check(key+' populated own source', 'SYN Entidade Empregadora' in paper.inner_text() and 'NIF 000000000' in paper.inner_text());check(key+' footer exactly one blank date',paper.locator('.declaration-signature').inner_text().count('Data: ____ / ____ / ______')==1);check(key+' not a signed final','RASCUNHO — NÃO ASSINADO' in paper.inner_text());check(key+' has no horizontal page overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
      details=paper.evaluate('''el=>{const body=el.querySelector('.declaration-copy').innerText,ps=el.querySelectorAll('.declaration-signature p'),manager=ps[2].getBoundingClientRect(),line=ps[3].getBoundingClientRect();return {body,signatureGap:line.top-manager.bottom}}''');check(key+' clinic name not duplicated','na clínica Clínica' not in details['body']);check(key+' manager close to signature line',0<=details['signatureGap']<=14)
      if key in ['salary','employment-salary']:check(key+' Portuguese amount and zero components','1.200,00 €.' in details['body'] and 'diuturnidades mensais' not in details['body'])
      if device=='tablet' and theme=='light':
       with p.expect_download() as info:click(p,'pdf')
       download=info.value;download.save_as(OUT/(profile+'-'+key+'.pdf'));check(key+' actual PDF downloaded',(OUT/(profile+'-'+key+'.pdf')).read_bytes().startswith(b'%PDF-1.4'))
      if key=='employment':
       with p.expect_popup() as info:click(p,'print')
       print_page=info.value;print_page.wait_for_load_state();check('A4 paper print with single signature date',print_page.locator('.declaration-signature').inner_text().count('Data: ____ / ____ / ______')==1);print_page.close()
      if key=='salary':
       click(p,'submit');check('request created once',p.evaluate('k=>JSON.parse(localStorage.getItem(k)).hrDeclarationRequests.filter(r=>r.declarationKey==="salary").length===1',K));check('electronic final blocked in UI','Emissão eletrónica final bloqueada' in p.locator('#modalBody').inner_text());p.screenshot(path=str(OUT/(profile+'-'+device+'-'+theme+'-request.png')))
      click(p,'catalogue')
     check('ordinary profiles have no management controls',p.locator('[data-decl-action=template]').count()==0)
     if profile in ['u1','test_admin']:
      p.evaluate('HRDeclarationsV4.open(true)');check('managers can version twelve models',p.locator('[data-decl-action=template]').count()==12);click(p,'request');p.locator('#declChecked').check();click(p,'prepare');check('conference recorded', 'Aguarda assinatura digital' in p.locator('#modalBody').inner_text());check('provider still blocked','Emissão eletrónica final bloqueada' in p.locator('#modalBody').inner_text())
     else:
      check('direct backoffice access denied',p.evaluate('(()=>{try{HRDeclarationsV4.open(true);return false}catch{return true}})()'))
     p.evaluate('HRDeclarationsV4.open(false)');click(p,'model','salary');p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));s.users.find(u=>u.id===s.currentUser).hr.payrollContracts=[];localStorage.setItem(k,JSON.stringify(s))}''',K);click(p,'preview');paper=p.locator('#declarationPreview .declaration-paper');check('incomplete draft explicit and no technical placeholders','RASCUNHO INCOMPLETO' in paper.inner_text() and '[A validar' not in paper.inner_text() and 'mealCents' not in paper.inner_text());p.screenshot(path=str(OUT/(profile+'-'+device+'-'+theme+'-incomplete.png')))
     check('no page JS errors',not errors);check('theme respected',p.evaluate('document.documentElement.dataset.theme')==theme);ctx.close()
 finally:
  (OUT/'declarations-browser-results.json').write_text(json.dumps({'checks':len(cases),'passed':sum(c['passed'] for c in cases),'cases':cases,'physicalAndroid':False},ensure_ascii=False,indent=2));b.close()
print(json.dumps({'passed':len(cases),'profiles':6,'themes':2,'viewports':3,'models':12}))

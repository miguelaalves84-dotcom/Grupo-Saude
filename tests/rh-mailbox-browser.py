"""Caixa de candidaturas (gruposaude.rh) no ecrã Candidatos: estado, «Verificar agora», textos editáveis, histórico com
«Tentar de novo», ligação ao CV recebido por email e nada para quem não gere RH. Respostas do servidor simuladas."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/rh-mailbox'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
STATUS={'address':'gruposaude.rh@gmail.com','configured':True,'enabled':True,'defaults':{'received':{'subject':'Grupo Saúde — recebemos a sua candidatura','text':'Olá {nome},\n\nObrigado.'},'interview':{'subject':'Grupo Saúde — entrevista marcada','text':'Olá {nome}\nData: {data}\nHora: {hora}'},'rejection':{'subject':'Grupo Saúde — a sua candidatura','text':'Olá {nome}, agradecemos.'}}}
runs=[]
def route(r):
 u=r.request.url
 if '/api/v4-extensions?resource=rh-mail-status' in u:return r.fulfill(status=200,content_type='application/json',body=json.dumps(STATUS))
 if '/api/v4-extensions?resource=rh-mail-run' in u:runs.append(r.request.method);return r.fulfill(status=200,content_type='application/json',body=json.dumps({'status':'OK','received':1,'created':1,'sent':[{'to':'x','kind':'received'}],'failed':[]}))
 return r.continue_() if u.startswith(ORIGIN+'/') else r.abort()
def page(b,w,h,mob,user,old=False):
 c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,service_workers='block');c.route('**/*',route);p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.on('dialog',lambda d:d.accept())
 p.goto(URL);p.wait_for_function('window.App&&window.RhMailboxV4')
 p.evaluate('''([k,u,old])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=null;s.candidates=[{id:'cand_mail1',name:'Ana Silva',email:'ana.silva@example.invalid',phone:'912 345 678',stage:'Candidatos',recruitmentVersion:2,needsReview:true,source:'Email de recrutamento',documents:[{id:'f1',name:'CV.pdf',mime:'application/pdf',fileRef:'rhcv:f1'}],notifications:[{kind:'received',key:'cand_mail1:received',recipient:'ana.silva@example.invalid',status:'Failed',error:'SMTP indisponível'}],history:[]}];s.rhMail={lastRunAt:old?'2026-01-01T00:00:00.000Z':new Date().toISOString(),log:[{at:'2026-11-24T10:05:00.000Z',kind:'received',to:'ana.silva@example.invalid',candidateId:'cand_mail1',status:'Falhou',error:'SMTP indisponível'}]};localStorage.setItem(k,JSON.stringify(s))}''',[K,user,old])
 p.reload();p.wait_for_function('window.App&&window.RhMailboxV4');p.wait_for_timeout(400);return c,p,errs
def open_candidates(p):
 p.evaluate('()=>{App.showView("hr");window.V4ClinicHR?.showCandidates()}');p.wait_for_timeout(500)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for dev,w,h,mob in [('desktop',1366,900,False),('phone',390,844,True)]:
   scope={'device':dev};c,p,errs=page(b,w,h,mob,'u1');open_candidates(p)
   card=p.locator('#rhMailboxCard');check('card shown at the top of Candidatos',card.count()==1)
   check('summary shows mailbox and state','gruposaude.rh@gmail.com' in card.inner_text() and 'Ligada' in card.inner_text())
   card.locator('summary').click();p.wait_for_timeout(200)
   check('history lists the failed thank-you','Falhou' in card.inner_text() and 'Ana Silva' in card.inner_text())
   check('no horizontal page scroll',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   if dev=='desktop':
    card.locator('[data-rhm-retry]').click();p.wait_for_timeout(200)
    check('retry puts the email back in the queue',p.evaluate(f'JSON.parse(localStorage.getItem("{K}")).candidates[0].notifications[0].status')=='Queued')
    card.locator('[data-rhm-tab=interview]').click();p.wait_for_timeout(100)
    check('interview template shows date/time words','{data}' in card.locator('#rhmText').input_value() and '{hora}' in card.inner_text())
    card.locator('#rhmSubject').fill('Entrevista no Grupo Saúde, {nome}');card.locator('[data-rhm=save]').click();p.wait_for_timeout(200)
    check('edited template saved in shared state',p.evaluate(f'JSON.parse(localStorage.getItem("{K}")).rhMail.templates.interview.subject')=='Entrevista no Grupo Saúde, {nome}')
    card=p.locator('#rhMailboxCard');card.locator('[data-rhm=reset]').click();p.wait_for_timeout(300)
    check('reset restores the original text',not p.evaluate(f'JSON.parse(localStorage.getItem("{K}")).rhMail.templates.interview'))
    p.locator('#rhMailboxCard [data-rhm=run]').click();p.wait_for_timeout(600)
    check('«Verificar agora» calls the server once',runs==['POST'])
    check('result message shown','1 candidato(s) novo(s)' in p.locator('.rhm-toast').last.inner_text())
    p.evaluate('()=>CommunicationsV4.candidate("cand_mail1")');p.wait_for_timeout(400)
    link=p.locator('#modal a[href*="resource=rh-cv"]');check('candidate shows link to the emailed CV',link.count()==1 and 'rhcv%3Af1' in link.get_attribute('href'))
    check('candidate flagged por validar','por validar' in p.locator('#modal').inner_text())
    p.screenshot(path=str(OUT/'rh-mailbox-desktop.png'))
   check('no page errors',not errs);c.close()
  scope={'device':'desktop','case':'auto'};runs.clear();c,p,errs=page(b,1366,900,False,'u1',True);open_candidates(p);p.wait_for_timeout(800)
  check('opening Candidatos checks the mailbox when the last check is old',runs==['POST'])
  open_candidates(p);p.wait_for_timeout(600);check('no repeated automatic check right after',runs==['POST']);c.close()
  scope={'device':'desktop','user':'technician'};c,p,errs=page(b,1366,900,False,'u5');open_candidates(p)
  check('no mailbox card without HR management',p.locator('#rhMailboxCard').count()==0);c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

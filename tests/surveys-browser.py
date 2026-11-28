"""Inquéritos anónimos no ecrã: CEO prepara e publica a consulta SST; 3 colaboradores respondem; resultados só a partir
de 3 respostas e só para CEO/Administração; caixa de sugestões aceita várias; respostas sem nome. Modo demonstração."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/surveys'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
def open_surveys(p):p.evaluate("GSSurveysV4.open()");p.wait_for_selector('#modal[open]');p.wait_for_timeout(300)
def answer_sst(p,score,yn):
 open_surveys(p);p.locator('.survey-card',has_text='segurança e saúde').locator('[data-survey-answer]').click();p.wait_for_timeout(300)
 for fs in p.locator('[data-survey-form] fieldset').all():
  opts=fs.locator('input[type=radio]')
  if opts.count()==5:opts.nth(score-1).check()
  else:fs.locator(f'input[value="{yn}"]').check()
 p.locator('[data-survey-form] textarea').first.fill('SYN risco: piso escorregadio')
 p.locator('[data-survey-form] button[type=submit]').click();p.wait_for_timeout(500)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);dialogs=[];p.on('dialog',lambda d:(dialogs.append(d.message),d.accept()));errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.goto(URL);p.wait_for_function('window.GSSurveysV4&&window.GSSurveysCore')
   p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.surveys=[];localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('gs-survey-answers');localStorage.removeItem('gs-survey-responders')}",K)
   become(p,'test_tec');open_surveys(p)
   check('colaborador vê a caixa de sugestões e não vê a gestão',p.locator('.survey-card',has_text='Caixa de sugestões').count()==1 and p.locator('.survey-admin').count()==0)
   become(p,'u1');open_surveys(p);p.locator('[data-survey-sst]').click();p.wait_for_timeout(400)
   check('CEO prepara a consulta SST: 27 perguntas no editor, em rascunho',p.locator('[data-survey-editor] [data-q]').count()==27 and any(x['status']=='Rascunho' for x in p.evaluate("k=>JSON.parse(localStorage.getItem(k)).surveys",K)))
   p.locator('[data-survey-editor] button[type=submit]').click();p.wait_for_timeout(300);p.locator('[data-survey-publish]').first.click();p.wait_for_timeout(400)
   check('publicado depois de confirmar',any(x['status']=='Publicado' for x in p.evaluate("k=>JSON.parse(localStorage.getItem(k)).surveys",K)) and any('Publicar' in d for d in dialogs))
   p.screenshot(path=str(OUT/f'surveys-ceo-{device}.png'))
   for uid,score,yn in [('test_tec',4,'Não'),('test_med',5,'Não'),('test_call',2,'Sim')]:
    become(p,uid);answer_sst(p,score,yn)
   become(p,'test_tec');open_surveys(p)
   check('depois de responder aparece «Já respondeu»',p.locator('.survey-card',has_text='segurança e saúde').locator('button[disabled]').count()==1)
   for txt in ['SYN mais cadeiras','SYN ar condicionado']:
    open_surveys(p);p.locator('.survey-card',has_text='Caixa de sugestões').locator('[data-survey-answer]').click();p.locator('[data-survey-form] input[value="Melhoria"]').check();p.locator('[data-survey-form] textarea').fill(txt);p.locator('[data-survey-form] button[type=submit]').click();p.wait_for_timeout(300)
   ans=p.evaluate("()=>localStorage.getItem('gs-survey-answers')")
   check('respostas guardadas sem nome de quem respondeu',ans and 'test_tec' not in ans and 'test_med' not in ans and 'test_call' not in ans and json.loads(ans).__len__()==5)
   check('respostas não ficam nos dados partilhados',p.evaluate("k=>!JSON.stringify(JSON.parse(localStorage.getItem(k))).includes('piso escorregadio')",K))
   for label,uid in [('Administração','test_admin'),('CEO','u1')]:
    become(p,uid);open_surveys(p);p.locator('.survey-row',has_text='segurança e saúde').locator('[data-survey-results]').click();p.wait_for_timeout(400);body=p.locator('#modalBody').inner_text()
    check(f'{label} vê resultados (3 respostas, média 3.7, textos)','3 respostas' in body and 'média 3.7' in body and 'piso escorregadio' in body)
   p.screenshot(path=str(OUT/f'surveys-results-{device}.png'))
   p.locator('[data-survey-back]').click();p.wait_for_timeout(300);p.locator('[data-survey-results="suggestion-box"]').click();p.wait_for_timeout(300)
   check('sugestões: com menos de 3 os resultados ficam escondidos','a partir de 3 respostas' in p.locator('#modalBody').inner_text())
   check('sem erros na página',not errs);c.close()
 finally:b.close()
(OUT/'surveys-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

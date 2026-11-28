"""Operação diária nas tarefas das administrativas: abertura bloqueada depois de guardada (só CEO/Administração corrigem,
com justificação), atualização por períodos em grelha horizontal (realizados, faltas, desmarcações, remarcações; vagas
dos técnicos), «Período terminado» esconde o colaborador até ao fecho, e o fecho propõe a soma dos períodos."""
import os,json,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
SRC=open(os.path.join(os.path.dirname(__file__),'opening-composition-browser.py')).read().split('with sync_playwright()')[0]
exec(SRC)  # mesmos ajudantes e dados sintéticos do teste de composição da abertura (setup, team, numbers, save, day, phase)
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/operation-periods'));OUT.mkdir(parents=True,exist_ok=True)
def line(p,person,cat):return p.locator(f'[data-op-professional="{person}"] [data-period-row]').filter(has_text=cat).first
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,900),('phone',390,844)]:
   scope={'device':device}
   ctx=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   page=ctx.new_page();page.clock.install(time=datetime.datetime.combine(datetime.date.today(),datetime.time(9,0),tzinfo=datetime.timezone.utc));page.set_default_timeout(10000);page.on('dialog',lambda d:d.accept());errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   setup(page,'test_adm','light')
   page.evaluate('()=>{const k="grupo_saude_v4_demo_2",s=JSON.parse(localStorage.getItem(k));s.opDate="2026-10-21";s.opPhase="open";localStorage.setItem(k,JSON.stringify(s));App.renderAll();App.showView("operation")}')
   team(page,['test_med'],['test_tec']);numbers(page);save(page);page.wait_for_timeout(500)
   check('opening saved',day(page).get('open',{}).get('saved'))
   phase(page,'open');page.wait_for_timeout(300)
   check('opening numbers locked for the administrativa',page.locator('#openingForm [data-op-field]').count()>0 and all(i.is_disabled() for i in page.locator('#openingForm [data-op-field]').all()))
   check('lock explained',page.locator('.opening-locked').count()==1 and 'CEO ou a Administração' in page.locator('.opening-locked').inner_text())
   phase(page,'live');page.wait_for_timeout(400)
   check('one card per professional in the live grid',page.locator('.op-periods [data-op-professional]').count()==2)
   check('doctor shows only the types he does (3 lines), technician only Tratamentos',page.locator('[data-op-professional="test_med"] [data-period-row]').count()==3 and page.locator('[data-op-professional="test_tec"] [data-period-row]').count()==1)
   check('no editable «marcados» during the day for doctors',page.locator('[data-op-professional="test_med"] [data-op-field=booked]').count()==0)
   check('technician keeps vacancies today/tomorrow',page.locator('[data-op-professional="test_tec"] [data-op-field=freeToday]').count()==1 and page.locator('[data-op-professional="test_tec"] [data-op-field=slotsTomorrow]').count()==1)
   r=line(page,'test_med','Consultas');r.locator('[data-period-field=done]').fill('3');r.locator('[data-period-field=missed]').fill('1')
   page.locator('#opSavePeriod').click();page.wait_for_timeout(400)
   page.clock.set_fixed_time(datetime.datetime.combine(datetime.date.today(),datetime.time(11,0),tzinfo=datetime.timezone.utc))
   r=line(page,'test_med','Consultas');r.locator('[data-period-field=done]').fill('4');r.locator('[data-period-field=cancelled]').fill('2')
   page.locator('#opSavePeriod').click();page.wait_for_timeout(400)
   check('two periods saved',len(day(page).get('periods',[]))==2)
   check('running total shown («7 realiz.»)','7 realiz.' in line(page,'test_med','Consultas').inner_text())
   check('period inputs cleared for the next period',line(page,'test_med','Consultas').locator('[data-period-field=done]').input_value()=='')
   if device=='desktop':page.screenshot(path=str(OUT/'live-periods.png'),full_page=False)
   page.locator('[data-work-end="test_med"]').click();page.wait_for_timeout(400)
   check('«Período terminado» hides the doctor from the live grid',page.locator('.op-periods [data-op-professional="test_med"]').count()==0 and 'Período terminado (1)' in page.locator('.op-ended summary').inner_text())
   check('no horizontal scroll',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   phase(page,'close');page.wait_for_timeout(500)
   row=page.locator('[data-op-professional="test_med"] [data-op-row]').filter(has_text='Consultas').first
   check('close proposes the sum of the periods (7 done, 1 missed, 2 cancelled)',row.locator('[data-op-result=done]').input_value()=='7' and row.locator('[data-op-result=missed]').input_value()=='1' and row.locator('[data-op-result=cancelled]').input_value()=='2')
   check('opening shown only as reference (7)',row.locator('.op-ref').first.inner_text().strip()=='7' and row.locator('.op-ref').first.evaluate('e=>e.tagName')!='INPUT')
   check('ended collaborator comes back at close',page.locator('#phasePanel [data-op-professional="test_med"]').count()==1)
   check('close values stay editable',not row.locator('[data-op-result=done]').is_disabled())
   if device=='desktop':page.screenshot(path=str(OUT/'close-sum.png'),full_page=False)
   # CEO pode corrigir a abertura, com justificação
   page.evaluate("CEOReservedAreaV4.select('u1')");page.wait_for_timeout(500);phase(page,'open');page.wait_for_timeout(400)
   check('CEO can correct the opening with a justification field',page.locator('#opCorrectionReason').count()==1 and not page.locator('#openingForm [data-op-field]').first.is_disabled())
   check('no page errors',not errors);ctx.close()
 finally:b.close()
print(json.dumps({'passed':sum(c['passed'] for c in cases),'total':len(cases)}))

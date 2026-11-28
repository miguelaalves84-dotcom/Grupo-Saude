"""«O meu horário»: semana com horas esperadas; escala sobrepõe-se à ficha; folga, férias aprovadas; sem horário → aviso;
navegação por semanas; entrada no menu e no Livro de ponto. Dados sintéticos."""
import os,json,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/my-schedule'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
SEED='''([k,withHr])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_tec';s.ceoViewingAs='test_tec';s.clinics=[{id:'syn-a',name:'SYN Clínica A',active:true}];for(const p of [...s.users,...Object.values(s.employees||{})]){p.clinics=['syn-a'];p.clinicIds=['syn-a'];p.clinic='syn-a';p.clinicId='syn-a';p.hr={...(p.hr||{}),startTime:withHr?'09:00':'',endTime:withHr?'18:00':'',lunchStart:withHr?'13:00':'',lunchEnd:withHr?'14:00':'',weeklySchedule:withHr?{0:{off:true},6:{off:true}}:undefined}}s.monthlyRosters={'2026-11|syn-a':{test_tec:{days:{'2026-11-25':{startTime:'14:00',endTime:'20:00'},'2026-11-26':{off:true}}}}};s.leave=[{id:'v1',employeeId:'test_tec',type:'Férias',days:['2026-11-27'],status:'Aprovado'}];localStorage.setItem(k,JSON.stringify(s))}'''
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));p.clock.install(time=datetime.datetime.fromisoformat('2026-11-24T10:00:00+00:00'));p.goto(URL);p.wait_for_function('window.MyScheduleV4&&window.GSAttendanceCore')
   p.evaluate(SEED,[K,True]);p.reload();p.wait_for_function('window.MyScheduleV4');p.wait_for_timeout(500)
   p.evaluate("MyScheduleV4.open()");p.wait_for_selector('#modal[open] .ms-week')
   day=lambda d:p.locator(f'[data-ms-day="{d}"]').inner_text()
   check('7 dias, semana de 23/11',p.locator('.ms-day').count()==7 and 'Semana de 23/11' in p.locator('.ms-nav').inner_text())
   check('dia normal vem da ficha: 09:00–18:00, almoço, 8h','09:00 – 18:00' in day('2026-11-24') and '13:00–14:00' in day('2026-11-24') and '8h' in day('2026-11-24') and 'Ficha RH' in day('2026-11-24'))
   check('escala sobrepõe-se à ficha (14:00–20:00, 6h)','14:00 – 20:00' in day('2026-11-25') and '6h' in day('2026-11-25') and 'Escala' in day('2026-11-25'))
   check('folga da escala','Folga' in day('2026-11-26'))
   check('férias aprovadas aparecem e não contam horas','Férias' in day('2026-11-27') and day('2026-11-27').strip().endswith('—'))
   check('fim de semana de folga','Folga' in day('2026-11-28') and 'Folga' in day('2026-11-29'))
   check('total esperado da semana = 8+6+8 = 22h',p.locator('[data-ms-total]').inner_text()=='22h')
   check('dia de hoje destacado',p.locator('.ms-today').count()==1)
   p.screenshot(path=str(OUT/f'my-schedule-{device}.png'))
   p.locator('[data-ms-week="1"]').click();check('semana seguinte','Semana de 30/11' in p.locator('.ms-nav').inner_text())
   p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.evaluate(SEED,[K,False]);p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.monthlyRosters={};localStorage.setItem(k,JSON.stringify(s))}",K);p.evaluate("MyScheduleV4.open()");p.wait_for_selector('#modal[open] .ms-week')
   check('sem horário: aviso para falar com os RH','fale com os Recursos Humanos' in p.locator('[data-ms-empty]').inner_text())
   p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.evaluate("App.showView('clock')");p.wait_for_timeout(400)
   check('botão «O meu horário» no Livro de ponto',p.locator('#clock button',has_text='O meu horário').count()>=1)
   check('sem erros na página',not errs);c.close()
 finally:b.close()
(OUT/'my-schedule-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

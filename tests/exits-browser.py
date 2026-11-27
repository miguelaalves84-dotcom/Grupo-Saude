"""Saída extraordinária no Livro de ponto: motivo em botões (4), justificação, comprovativo opcional ou junto depois;
a gestão vê o motivo e descarrega o comprovativo; sem comprovativo aprovado desconta no banco de horas. Dados sintéticos."""
import os,json,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/exits'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
PDF=b'%PDF-1.4\nSYN DECLARACAO\n%%EOF'
def check(name,value):
 results.append({**scope,'case':name,'passed':bool(value)});print(json.dumps(results[-1],ensure_ascii=False),flush=True);assert value,name
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def at(p,hhmm):p.clock.set_fixed_time(datetime.datetime.fromisoformat('2026-10-20T'+hhmm+':00+01:00'))
def become(p,uid):p.evaluate('''([k,id])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(k,JSON.stringify(s));document.dispatchEvent(new CustomEvent('gs:user-changed'))}''',[K,uid]);p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
def punch(p,action,fill=None):
 p.evaluate(f"App.showView('clock');AttendanceBookV4.locate()");p.wait_for_timeout(500);p.evaluate(f"AttendanceBookV4.prepare('{action}')");p.wait_for_selector('#modal[open]');p.wait_for_timeout(300)
 if fill:fill()
 p.locator('#modal [data-gs-action="AttendanceBookV4.confirm"]').click();p.wait_for_timeout(700)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,1000),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},is_mobile=device=='mobile',has_touch=device=='mobile',permissions=['geolocation'],geolocation={'latitude':38,'longitude':-9,'accuracy':5},service_workers='block',accept_downloads=True);c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
   p=c.new_page();p.set_default_timeout(8000);dialogs=[];p.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()));p.clock.install(time=datetime.datetime.fromisoformat('2026-10-20T08:55:00+01:00'));p.goto(URL);p.wait_for_function('window.AttendanceBookV4&&window.GSAttendanceCore')
   p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_tec';s.ceoViewingAs='test_tec';s.clinics=[{id:'syn-clock',name:'SYN Clínica Ponto',active:true,latitude:38,longitude:-9,radius:100}];for(const p of [...s.users,...Object.values(s.employees||{})]){p.clinics=['syn-clock'];p.clinicIds=['syn-clock'];p.clinic='syn-clock';p.clinicId='syn-clock';p.active=true;p.hr={...p.hr,startTime:'09:00',endTime:'18:00',lunchStart:'13:00',lunchEnd:'14:00'}}s.timeEntries=[];s.timeOccurrences=[];s.leave=[];s.hourBank={uses:[]};localStorage.setItem(k,JSON.stringify(s))}''',K);p.reload();p.wait_for_function('window.AttendanceBookV4&&window.GSAttendanceCore');p.wait_for_timeout(600)
   at(p,'09:00');punch(p,'clock');check('entrada registada',any(x['type']=='Entrada' for x in state(p)['timeEntries']))
   at(p,'10:00');p.evaluate("App.showView('clock');AttendanceBookV4.locate()");p.wait_for_timeout(500)
   check('botão chama-se «Saída extraordinária / regresso»',p.locator('[data-gs-action="AttendanceBookV4.prepare"]',has_text='Saída extraordinária').count()>=1)
   p.evaluate("AttendanceBookV4.prepare('temporary')");p.wait_for_selector('#modal[open]');p.wait_for_timeout(300)
   check('janela com o título «Saída extraordinária» e 4 motivos em botões',p.locator('#modal h3',has_text='Saída extraordinária').count()==1 and p.locator('.exit-motive').count()==4 and [x.strip() for x in p.locator('.exit-motive span').all_inner_texts()]==['Consulta médica','Ausência extraordinária','Pessoal','Outro'])
   p.screenshot(path=str(OUT/f'exit-form-{device}.png'))
   n=len(dialogs);p.locator('#attendanceReason').fill('SYN tratar assunto');p.locator('#modal [data-gs-action="AttendanceBookV4.confirm"]').click();p.wait_for_timeout(500)
   check('sem motivo não regista e avisa',len(state(p)['timeEntries'])==1 and any('motivo' in d for d in dialogs[n:]))
   p.locator('.exit-motive',has_text='Pessoal').click();p.locator('#modal [data-gs-action="AttendanceBookV4.confirm"]').click();p.wait_for_timeout(700)
   e=[x for x in state(p)['timeEntries'] if x['type']=='Saída temporária']
   check('saída registada com motivo «Pessoal»',len(e)==1 and e[0].get('motive')=='Pessoal')
   at(p,'10:45');punch(p,'temporary',lambda:p.locator('#attendanceReason').fill('SYN regresso'));check('regresso registado',any(x['type']=='Regresso de saída temporária' for x in state(p)['timeEntries']))
   p.evaluate("App.showView('clock');AttendanceBookV4.render&&AttendanceBookV4.render()");p.wait_for_timeout(500)
   txt=p.locator('body').inner_text()
   check('«As minhas saídas extraordinárias» mostra 45 min e que desconta',' 45 min' in txt and 'desconta no banco de horas' in txt)
   check('banco de horas desconta 45 min',p.evaluate("GSHourBank.balance(JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),'test_tec').balanceMinutes")==-45)
   p.locator('[data-exit-proof]').first.set_input_files({'name':'SYN-declaracao.pdf','mimeType':'application/pdf','buffer':PDF});p.wait_for_timeout(800)
   o=[x for x in state(p)['timeOccurrences'] if x['type']=='Saída temporária'][0]
   check('comprovativo junto depois fica no pedido',(o.get('evidence') or {}).get('name')=='SYN-declaracao.pdf')
   for label,uid in [('Administração','test_admin'),('CEO','u1')]:
    become(p,uid);p.wait_for_timeout(300);p.evaluate("App.showView('clock');AttendanceBookV4.pending()");p.wait_for_timeout(500);body=p.locator('#modalBody').inner_text()
    check(f'{label} vê o motivo e o botão do comprovativo','Motivo: Pessoal' in body and p.locator('#modalBody [data-gs-action="AttendanceBookV4.proof"]').count()>=1)
    with p.expect_download() as d:p.locator('#modalBody [data-gs-action="AttendanceBookV4.proof"]').first.click()
    check(f'{label} descarrega o comprovativo',d.value.suggested_filename=='SYN-declaracao.pdf')
   check('sem erros na página',not [x for x in dialogs if 'Error' in x]);c.close()
 finally:b.close()
(OUT/'exits-results.json').write_text(json.dumps(results,indent=2,ensure_ascii=False))
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

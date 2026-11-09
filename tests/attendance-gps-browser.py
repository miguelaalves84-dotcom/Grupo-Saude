"""Livro de ponto com GPS (telemóvel primeiro): regras de 2 minutos, sem escala, saída tardia corrigível,
tentativas falhadas sem coordenadas, painel «Agora nas clínicas» e assistente de GPS da clínica.
Só dados sintéticos e geolocalização simulada pelo Chromium; nenhum pedido externo."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-attendance-gps')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}
CLINIC = {'lat': 39.4669, 'lng': -8.1968}
INSIDE = {'latitude': 39.46695, 'longitude': -8.1968, 'accuracy': 12}
OUTSIDE = {'latitude': 39.4720, 'longitude': -8.1968, 'accuracy': 15}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1]), flush=True); assert value, name


def at(hhmm):  # novembro: Lisboa = UTC
    return datetime.datetime.fromisoformat('2026-11-09T' + hhmm + ':00+00:00')


SETUP = '''([k,id,theme,schedule])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=id;s.ceoRealUser=id;s.ceoViewingAs=null;
s.clinics=[{id:'syn-gps',name:'SYN Clínica GPS',active:true,gps:{lat:'39.4669',lng:'-8.1968',radius:60},phones:[],ers:{}},{id:'syn-nogps',name:'SYN Sem GPS',active:true,gps:{lat:'',lng:'',radius:50},phones:[],ers:{}}];
for(const p of [...s.users,...Object.values(s.employees||{})]){p.clinics=['syn-gps','syn-nogps'];p.clinicIds=p.clinics;p.clinic='syn-gps';p.clinicId='syn-gps';p.active=true;p.hr=p.id===id&&!schedule?{}:{...p.hr,startTime:'09:00',endTime:'18:00',lunchStart:'13:00',lunchEnd:'14:00'}}
s.timeEntries=[];s.timeOccurrences=[];s.gpsAttempts=[];s.leave=[];s.monthlyRosters={};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+id,theme)}'''


def open_page(_browser, actor, device, theme, when, geo, schedule=True):
    # Navegador novo por cenário: a geolocalização simulada do Chromium partilha estado entre contextos.
    browser = PW.chromium.launch(args=['--no-sandbox']); OPEN.append(browser)
    w, h = {'desktop': (1366, 1000), 'tablet': (820, 1180), 'mobile': (390, 844)}[device]
    ctx = browser.new_context(viewport={'width': w, 'height': h}, has_touch=device != 'desktop', is_mobile=device != 'desktop', permissions=['geolocation'], geolocation=geo, service_workers='block')
    ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
    p = ctx.new_page(); p.set_default_timeout(9000); p.on('dialog', lambda d: (DIALOGS.append(d.message), d.dismiss()))
    p.clock.install(time=at(when)); p.goto(URL); p.wait_for_function('window.AttendanceBookV4&&window.GSAttendanceCore')
    p.evaluate(SETUP, [K, actor, theme, schedule]); p.reload(); p.wait_for_function('window.AttendanceBookV4')
    p.evaluate("App.showView('clock');AttendanceBookV4.render()"); p.wait_for_function("document.getElementById('attendanceGpsCard')?.dataset.state!=='checking'")
    if not nudge_until(p, geo, "document.getElementById('attendanceGpsCard')?.dataset.state==='ok'"): relocate(p, geo)
    return ctx, p


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)


def relocate(p, geo):  # o Chromium simulado só responde a nova leitura depois de redefinir a posição (como na suite antiga)
    p.context.set_geolocation(geo); p.evaluate('AttendanceBookV4.locate()')
    nudge_until(p, geo, "document.getElementById('attendanceGpsCard')?.dataset.state!=='checking'")


def nudge_until(p, geo, condition):  # repõe a posição simulada até a condição se verificar (quirk do Chromium emulado)
    for _ in range(24):
        if p.evaluate(condition): return True
        p.context.set_geolocation(geo); p.wait_for_timeout(500)
    return p.evaluate(condition)


def punch(p, geo=INSIDE):  # botão grande → confirmação → registo
    p.context.set_geolocation(geo); p.locator('.punch-button').click()
    if not nudge_until(p, geo, "!!document.querySelector('#modal[open] [data-gs-action=\"AttendanceBookV4.confirm\"]')"):
        print(json.dumps({'diagnostic': 'no confirmation', 'dialogs': DIALOGS[-3:], 'gps': p.locator('#attendanceGpsStatus').inner_text(), 'title': p.locator('.punch-button').get_attribute('title'), 'now': p.evaluate('new Date().toISOString()')}, ensure_ascii=False), flush=True)
        raise AssertionError('confirmation dialog')
    p.context.set_geolocation(geo); p.locator('[data-gs-action="AttendanceBookV4.confirm"]').click()
    assert nudge_until(p, geo, "!document.getElementById('modal').open"), 'confirmation closed'


OPEN = []; DIALOGS = []
with sync_playwright() as pw:
    PW = pw; browser = None
    try:
        for device in ['mobile', 'tablet', 'desktop']:
            for theme in ['light', 'dark']:
                scope = {'device': device, 'theme': theme}
                # 1) Colaborador com escala: ecrã, regra dos 2 minutos e GPS
                ctx, p = open_page(browser, 'test_adm', device, theme, '08:57', INSIDE)
                check('big punch button shows next marking', 'Picar entrada' in p.locator('.punch-button').inner_text())
                check('GPS card ok with approximate distance and precision', nudge_until(p, INSIDE, "document.getElementById('attendanceGpsCard').dataset.state==='ok'") and 'precisão 12 m' in p.locator('#attendanceGpsDetail').inner_text() and 'a ~' in p.locator('#attendanceGpsDetail').inner_text())
                check('entry blocked 3 minutes early with visible reason', nudge_until(p, INSIDE, "document.querySelector('.punch-button').disabled&&document.getElementById('attendancePunchWhy').textContent.includes('08:58')"))
                p.clock.set_system_time(at('08:58')); relocate(p, INSIDE)
                check('entry allowed 2 minutes early', nudge_until(p, INSIDE, "!document.querySelector('.punch-button').disabled"))
                p.clock.run_for(31000)
                check('expired validation keeps the big button usable', p.evaluate("!document.querySelector('.punch-button').disabled&&document.getElementById('attendanceGpsStatus').textContent.includes('por confirmar')"))
                punch(p); s = state(p)
                check('entry recorded without coordinates', len(s['timeEntries']) == 1 and s['timeEntries'][0]['gps']['coordinatesRetained'] is False and '39.46695' not in json.dumps(s))
                check('confirmation toast shown', 'Entrada registada' in p.locator('#attendanceToast').inner_text())
                check('timeline shows entry', 'Entrada 08:58' in p.locator('[data-attendance-timeline]').inner_text())
                check('button advances to lunch', 'almoço' in p.locator('.punch-button').inner_text())
                for t, kind in [('13:00', 'Saída para almoço'), ('14:00', 'Regresso do almoço')]:
                    p.clock.set_system_time(at(t)); relocate(p, INSIDE); punch(p)
                p.clock.set_system_time(at('18:02')); relocate(p, INSIDE); punch(p); s = state(p)
                check('exit within 2 minutes creates no pending occurrence', len(s['timeEntries']) == 4 and len(s['timeOccurrences']) == 0)
                check('after the day ends the button offers a new shift, not a new entry', 'Iniciar novo turno' in p.locator('.punch-button').inner_text())
                # tentativa falhada só quando o colaborador pede (botão), sem coordenadas
                relocate(p, OUTSIDE)
                check('automatic check does not log attempts', len(state(p).get('gpsAttempts', [])) == 0)
                check('outside shows distance and tip', 'fora da clínica' in p.locator('#attendanceGpsStatus').inner_text() and p.locator('#attendanceGpsTip').is_visible())
                ctx.set_geolocation(OUTSIDE); p.evaluate('AttendanceBookV4.locate(true)'); g = state(p)['gpsAttempts']
                check('manual check logs reason and rounded distance only', len(g) == 1 and g[0]['reason'] == 'outside' and g[0]['distanceApproxM'] % 10 == 0 and 'latitude' not in json.dumps(g))
                p.evaluate('AttendanceBookV4.attempts()')
                check('own attempts list visible', 'Fora do raio' in p.locator('#modalBody').inner_text())
                p.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
                check('no horizontal overflow (staff)', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'staff-{device}-{theme}.png'), full_page=True); ctx.close(); ctx.browser.close()

                # 2) Colaborador sem escala: pode picar, ocorrência pendente, escolhe saída ou almoço
                ctx, p = open_page(browser, 'test_tec', device, theme, '07:40', INSIDE, schedule=False)
                check('no-schedule button explains pending approval', 'pendente de aprovação' in p.locator('.punch-button').inner_text() and nudge_until(p, INSIDE, "!document.querySelector('.punch-button').disabled"))
                punch(p); s = state(p)
                check('no-schedule entry creates pending occurrence', any(o['type'] == 'Marcação sem escala' and o['status'] == 'Pendente' for o in s['timeOccurrences']))
                check('toast mentions pending approval', 'sem escala' in p.locator('#attendanceToast').inner_text())
                check('exit and lunch both offered', 'Picar saída' in p.locator('.punch-button').inner_text() and p.locator('.punch-alt').count() == 1)
                p.clock.set_system_time(at('12:10')); relocate(p, INSIDE); punch(p)
                check('direct exit closes the day', p.evaluate("GSAttendanceCore.phase(GSAttendanceCore.events(JSON.parse(localStorage.getItem('%s')),'test_tec'))" % K) == 'off')
                ctx.close(); ctx.browser.close()

                # 3) Saída tardia fica pendente; gestão corrige a hora; painel «Agora nas clínicas»; assistente GPS
                ctx, p = open_page(browser, 'test_admin', device, theme, '18:20', INSIDE)
                p.evaluate('''(k)=>{const s=JSON.parse(localStorage.getItem(k)),C=GSAttendanceCore,mk=(u,type,t,g=true)=>({id:'syn-'+u+'-'+t,user:u,clinic:'syn-gps',type,at:C.instant('2026-11-09',t),recordedAt:C.instant('2026-11-09',t),gps:{validated:g,coordinatesRetained:false},status:'Aceite',revision:0});
                  s.timeEntries=[mk('test_med','Entrada','09:00'),mk('test_med','Saída para almoço','13:00'),mk('test_med','Regresso do almoço','14:00'),mk('test_med','Saída','18:15'),mk('test_call','Entrada','09:01')];
                  s.timeOccurrences=[{id:'syn-late:review',user:'test_med',clinic:'syn-gps',type:'Horas extraordinárias',entryId:'syn-test_med-18:15',at:C.instant('2026-11-09','18:15'),reason:'',status:'Pendente',revision:0,extraMinutes:15,history:[]}];
                  s.gpsAttempts=[{id:'g1',user:'test_call',clinic:'syn-gps',at:C.instant('2026-11-09','08:58'),reason:'inaccurate',distanceApproxM:40,accuracyApproxM:70,coordinatesRetained:false}];localStorage.setItem(k,JSON.stringify(s))}''', K)
                p.evaluate('AttendanceV4.render()'); board = p.locator('[data-attendance-now]')
                check('now board lists open exit 30+ min after shift', 'saída por picar' in board.inner_text() and 'Call Center Teste' in board.inner_text())
                check('no entry after shift end is not shown as minutes late', 'turno 09:00–18:00 terminou' in board.inner_text() and 'Atrasado 5' not in board.inner_text())
                check('now board shown before the daily cards', p.evaluate("(()=>{const b=document.querySelector('[data-attendance-now]'),c=document.querySelector('#clockContent .cards');return !!b&&!!c&&!!(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)})()"))
                check('now board counts GPS failures', board.locator('.now-kpis').inner_text().split('Falhas de GPS hoje')[1].strip().startswith('1'))
                p.evaluate('AttendanceBookV4.pending()'); p.locator('[data-gs-action="AttendanceBookV4.decision"]').first.click()
                check('decision shows late exit and correction field', '15 min depois do horário' in p.locator('#modalBody').inner_text() and p.locator('#attendanceCorrectedTime').count() == 1)
                p.locator('#attendanceDecisionReason').fill('SYN saiu às 18:00'); p.locator('#attendanceCorrectedTime').fill('18:00')
                p.locator('[data-gs-action="AttendanceBookV4.decide"]').first.click(); s = state(p)
                check('approved with corrected time; original kept', s['timeOccurrences'][0]['status'] == 'Aprovada' and s['timeEntries'][3]['at'].endswith('18:15:00.000Z') and p.evaluate("GSAttendanceCore.localTime(GSAttendanceCore.events(JSON.parse(localStorage.getItem('%s')),'test_med').at(-1).at)" % K) == '18:00')
                p.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
                p.clock.set_system_time(at('09:20')); p.evaluate('AttendanceV4.render()')
                check('now board flags late arrival without entry', 'Atrasado 20 min' in p.locator('[data-attendance-now]').inner_text())
                check('no horizontal overflow (manager)', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'manager-{device}-{theme}.png'), full_page=True)
                p.evaluate('ClinicMasterV4.master()')
                check('clinic list flags missing GPS', p.locator('[data-gps-missing]').count() == 1 and p.locator('[data-gps-state="missing"]').count() == 1)
                p.evaluate("ClinicMasterV4.edit('syn-gps')")
                check('radius range 20-100', p.locator('#cmRadius').get_attribute('min') == '20' and p.locator('#cmRadius').get_attribute('max') == '100')
                ctx.set_geolocation(INSIDE); p.locator('[data-cm-action="testGPS"]').click(); p.wait_for_function("document.getElementById('cmGpsResult')&&/Nada foi gravado/.test(document.getElementById('cmGpsResult').textContent)")
                check('test here reports inside without saving', 'seria aceite' in p.locator('#cmGpsResult').inner_text())
                ctx.set_geolocation(INSIDE); p.locator('[data-cm-action="captureGPS"]').click(); p.wait_for_function("/Raio proposto/.test(document.getElementById('cmGpsResult').textContent)")
                r = int(p.locator('#cmRadius').input_value())
                check('assistant proposes radius from precision', 20 <= r <= 100 and p.locator('#cmLat').input_value().startswith('39.466'))
                ctx.close(); ctx.browser.close()
    finally:
        (OUT / 'attendance-gps-results.json').write_text(json.dumps(results, indent=2))
        for b in OPEN:
            try: b.close()
            except Exception: pass
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results), 'scope': 'synthetic GPS via Chromium overrides; not physical devices'}))

"""Agenda estilo telemóvel (aprovada): tipos (marcação, tarefa, aniversário, lembrete), repetições de X em X,
«só esta / esta e as seguintes», tarefas com visto e atrasadas, aniversários da equipa com consentimento e âmbito,
call center com tarefas entre colegas das mesmas clínicas, aviso no sino, mês com pontos + lista do dia, deslizar.
Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-agenda-phone')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,me,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=me;s.ceoRealUser=me;s.ceoViewingAs=null;s.agendaEvents=[];s.leave=[];
 const set=(id,clinics,hr)=>{for(const u of [s.users.find(x=>x.id===id),s.employees?.[id]].filter(Boolean)){u.clinics=clinics;u.clinicIds=clinics;u.clinic=clinics[0];u.clinicId=clinics[0];u.active=true;u.hr={...u.hr,...hr}}};
 set('test_adm',['abranfir'],{birthDate:'1990-11-22',birthdayVisible:false});set('test_call',['abranfir'],{birthDate:'1988-11-12',birthdayVisible:true});
 set('test_med',['loures'],{birthDate:'1985-11-13',birthdayVisible:true,contractEnd:'2026-11-25'});s.employeeDocuments={test_tec:[{id:'syn-doc',masterDocumentId:'cc',name:'Cartão de cidadão',validUntil:'2026-12-10'}]};set('test_tec',['abranfir'],{birthDate:'1992-11-14'});
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+me,theme)}"""


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)


def open_agenda(browser, device, theme, me, when='2026-11-10T08:30:00+00:00'):
    w, h = {'mobile': (390, 844), 'tablet': (820, 1180), 'desktop': (1366, 900)}[device]
    c = browser.new_context(viewport={'width': w, 'height': h}, has_touch=device != 'desktop', is_mobile=device != 'desktop', service_workers='block')
    c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
    p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.dismiss())
    p.clock.install(time=datetime.datetime.fromisoformat(when)); p.goto(URL); p.wait_for_function('window.AgendaUIV4&&window.GSAgenda')
    p.evaluate(SEED, [K, me, theme]); p.reload(); p.wait_for_function('window.AgendaUIV4'); p.evaluate("App.showView('agenda')"); p.wait_for_timeout(250)
    return c, p, errors


def tap(p, device, loc): loc.tap() if device != 'desktop' else loc.click()


def new_item(p, device, kind, title, date, setup=None):
    tap(p, device, p.locator('[data-agenda-fab]') if device == 'mobile' else p.locator('[data-agenda-action="new"]').first)
    f = p.locator('#agendaForm'); f.locator(f'[name=kind][value={kind}]').check(); f.locator('[name=title]').fill(title); f.locator('[name=date]').fill(date)
    if setup: setup(f)
    f.locator('[type=submit]').click(); p.wait_for_timeout(150)
    if p.locator('[data-agenda-past]').is_visible(): f.locator('[name=allowPast]').check(); f.locator('[type=submit]').click(); p.wait_for_timeout(150)


def series(p, title): return next(x for x in state(p)['agendaEvents'] if x['title'] == title)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device in ['mobile', 'tablet', 'desktop']:
            for theme in ['light', 'dark']:
                scope = {'device': device, 'theme': theme}
                c, p, errors = open_agenda(browser, device, theme, 'test_adm')
                # criação pelos formulários: tarefa repetida, aniversário, marcação semanal com aviso
                new_item(p, device, 'task', 'SYN Encomendar luvas', '2026-11-03', lambda f: (f.locator('[name=allDay]').check(), f.locator('[name=repeatFreq]').select_option('weekly'), f.locator('[name=repeatInterval]').fill('1'), f.locator('[name=repeatEnd]').select_option('count'), f.locator('[name=repeatCount]').fill('4')))
                t = series(p, 'SYN Encomendar luvas')
                check('task saved as all-day weekly x4', t['kind'] == 'task' and t['allDay'] and t['repeat']['freq'] == 'weekly' and t['repeat']['count'] == 4)
                new_item(p, device, 'birthday', 'SYN Aniversário da mãe', '1960-11-17')
                bd = series(p, 'SYN Aniversário da mãe')
                check('birthday forced yearly and all-day', bd['repeat']['freq'] == 'yearly' and bd['allDay'])
                new_item(p, device, 'appointment', 'SYN Reunião semanal', '2026-11-10', lambda f: (f.locator('[name=time]').fill('09:00'), f.locator('[name=repeatFreq]').select_option('weekly'), f.locator('[name=reminderMinutes]').select_option('15')))
                check('weekly appointment with 15 min reminder', series(p, 'SYN Reunião semanal')['reminderMinutes'] == 15)
                # mês: pontos por tipo e lista do dia
                tap(p, device, p.locator('[data-agenda-mode="month"]').first); p.wait_for_timeout(200)
                p.locator('[data-agenda-day="2026-11-17"] [data-agenda-date]').click(); p.wait_for_timeout(200)
                lst = p.locator('[data-agenda-daylist]').inner_text()
                check('day list below the month shows that day', 'SYN Aniversário da mãe' in lst and 'SYN Reunião semanal' in lst and 'SYN Encomendar luvas' in lst)
                if device == 'mobile':
                    check('coloured dots per kind on phones', p.evaluate("[...document.querySelectorAll('[data-agenda-day=\"2026-11-17\"] .agenda-dots i')].map(i=>i.className).sort().join()") == 'dot-appointment,dot-birthday,dot-task')
                    m0 = p.evaluate("document.querySelector('[data-agenda-day]').dataset.agendaDay")
                    p.locator('.agenda-scroll').scroll_into_view_if_needed(); p.wait_for_timeout(400); box = p.locator('.agenda-scroll').bounding_box(); cdp = c.new_cdp_session(p)
                    for kind, x in [('touchStart', box['x'] + 300), ('touchMove', box['x'] + 240), ('touchMove', box['x'] + 160), ('touchMove', box['x'] + 120), ('touchEnd', None)]:
                        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if x is None else [{'x': x, 'y': box['y'] + box['height'] / 2}]})
                    p.wait_for_timeout(250)
                    check('swipe left goes to next month', m0 == '2026-10-26' and p.evaluate("document.querySelector('[data-agenda-day]').dataset.agendaDay") == '2026-11-30')
                    p.evaluate('window.scrollTo(0,0)'); p.locator('[data-agenda-action="previous"]').click(); p.wait_for_timeout(200)
                    check('round + button only on phones', p.locator('[data-agenda-fab]').is_visible())
                # tarefa: visto numa repetição; as outras ficam por fazer
                p.locator('[data-agenda-day="2026-11-10"] [data-agenda-date]').click(); p.wait_for_timeout(200)
                p.locator('[data-agenda-daylist] [data-agenda-action="toggle"][data-id$="@2026-11-10"]').click(); p.wait_for_timeout(150)
                done = series(p, 'SYN Encomendar luvas').get('done', {})
                check('tick marks only that occurrence as done', list(done.keys()) == ['2026-11-10'])
                check('done task shown struck through', p.locator('[data-agenda-daylist] .agenda-event.agenda-done').count() == 1)
                # atrasada: a de 03/11 (não feita) aparece no topo de hoje
                check('overdue task listed at the top of today', 'Atrasada desde 03/11' in p.locator('[data-agenda-daylist] .agenda-overdue').first.inner_text())
                # «só esta»: muda a hora da reunião de 17/11 sem mexer nas outras
                p.locator('[data-agenda-day="2026-11-17"] [data-agenda-date]').click(); p.wait_for_timeout(150)
                p.locator('[data-agenda-daylist] [data-agenda-action="detail"]').filter(has_text='SYN Reunião semanal').click()
                p.locator('#agendaDialog [data-agenda-action="edit"]').click(); f = p.locator('#agendaForm')
                check('editing a repetition asks only this / following / all', f.locator('[name=scope]').count() == 3)
                f.locator('[name=scope][value=one]').check(); f.locator('[name=time]').fill('11:00'); f.locator('[type=submit]').click(); p.wait_for_timeout(150)
                rs = p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-10',end:'2026-11-24'}).rows.filter(x=>x.title==='SYN Reunião semanal').map(x=>x.occurrenceDate+' '+GSAttendanceCore.localTime(x.startsAt))}", K)
                check('only that repetition changed', rs == ['2026-11-10 09:00', '2026-11-17 11:00', '2026-11-24 09:00'])
                # «esta e as seguintes»: apagar a partir de 24/11
                p.locator('[data-agenda-day="2026-11-24"] [data-agenda-date]').click(); p.wait_for_timeout(150)
                p.locator('[data-agenda-daylist] [data-agenda-action="detail"]').filter(has_text='SYN Reunião semanal').click()
                p.locator('#agendaDialog [data-agenda-action="cancel"]').click(); p.locator('#agendaDialog [name=scope][value=following]').check(); p.locator('#agendaDialog textarea').fill('SYN deixou de ser preciso'); p.locator('#agendaDialog form button').click(); p.wait_for_timeout(150)
                rs = p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-10',end:'2026-12-31'}).rows.filter(x=>x.title==='SYN Reunião semanal').map(x=>x.occurrenceDate)}", K)
                check('this and following removed, earlier kept', rs == ['2026-11-10', '2026-11-17'])
                # aniversários: só quem aceitou e da mesma clínica; o próprio decide
                names = lambda: p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-01',end:'2026-11-30'}).rows.filter(x=>x.kind==='birthday'&&x.virtual).map(x=>x.title).sort()}", K)
                check('administrativa sees colleagues of her clinic by default, except who opted out', names() == ['Aniversário de Call Center Teste', 'Aniversário de Técnico Teste'])
                check('administrativa never sees renewals', p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-09-01',end:'2027-01-31'}).rows.filter(x=>x.kind==='renewal').length}", K) == 0)
                p.locator('.agenda-more-filters summary').click(); p.locator('[data-agenda-consent]').check(); p.wait_for_timeout(150)
                check('turning her own birthday on shares only day and month', names() == ['Aniversário de Administrativa Teste', 'Aniversário de Call Center Teste', 'Aniversário de Técnico Teste'] and '1990' not in json.dumps(p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-22',end:'2026-11-22'}).rows}", K)))
                # aviso no sino 15 min antes
                p.clock.set_system_time(datetime.datetime.fromisoformat('2026-11-10T08:50:00+00:00'))
                check('reminder appears in the bell 15 min before', p.evaluate("AttentionUIV4.items().some(x=>x.kind==='agenda-reminder'&&/SYN Reunião semanal/.test(x.title))"))
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'agenda-phone-{device}-{theme}.png'), full_page=True); c.close()
                # gestão vê aniversários de todas as clínicas; call center atribui tarefas só nas suas clínicas
                if theme == 'light':
                    c, p, errors = open_agenda(browser, device, theme, 'test_admin')
                    check('management sees birthdays of all clinics (except who opted out)', p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-01',end:'2026-11-30'}).rows.filter(x=>x.kind==='birthday').map(x=>x.title).sort().join('|')}", K) == 'Aniversário de Call Center Teste|Aniversário de Médico Teste|Aniversário de Técnico Teste')
                    rn = p.evaluate("(k)=>{const s=JSON.parse(localStorage.getItem(k)),a=AttendanceBookV4.actor(s);return GSAgenda.list(s,a,{start:'2026-11-10',end:'2026-11-10'}).rows.filter(x=>x.kind==='renewal').map(x=>x.title).sort()}", K)
                    check('management sees renewals: contract daily within 15 days, document 30 days before', rn == ['Renovar contrato de Médico Teste — faltam 15 dias', 'Renovar «Cartão de cidadão» de Técnico Teste — faltam 30 dias'])
                    tap(p, device, p.locator('[data-agenda-mode="month"]').first); p.wait_for_timeout(200); p.locator('[data-agenda-day="2026-11-10"] [data-agenda-date]').click(); p.wait_for_timeout(150)
                    p.locator('[data-agenda-daylist] .agenda-kind-renewal').filter(has_text='contrato').click()
                    check('renewal detail offers the HR record', p.locator('#agendaDialog [data-agenda-action="open-target"]').inner_text() == 'Abrir ficha no RH'); c.close()
                    c, p, errors = open_agenda(browser, device, theme, 'test_call')
                    check('call center has the agenda', p.locator('#agendaContent .agenda-grid').count() == 1)
                    tap(p, device, p.locator('[data-agenda-fab]') if device == 'mobile' else p.locator('[data-agenda-action="new"]').first)
                    opts = p.locator('#agendaForm [name=ownerId] option').evaluate_all('(os)=>os.map(o=>o.value)')
                    check('call center assigns tasks only within shared clinics', 'test_adm' in opts and 'test_admin' not in opts and 'test_med' not in opts)
                    f = p.locator('#agendaForm'); f.locator('[name=kind][value=task]').check(); f.locator('[name=ownerId]').select_option('test_adm'); f.locator('[name=clinicId]').select_option('abranfir'); f.locator('[name=title]').fill('SYN Ligar ao fornecedor'); f.locator('[name=date]').fill('2026-11-12'); f.locator('[type=submit]').click(); p.wait_for_timeout(150)
                    check('task assigned to the administrativa', any(x['title'] == 'SYN Ligar ao fornecedor' and x['ownerId'] == 'test_adm' and x['kind'] == 'task' for x in state(p)['agendaEvents'])); c.close()
    finally:
        (OUT / 'agenda-phone-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

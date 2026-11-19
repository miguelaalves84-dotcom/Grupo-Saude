"""Agenda — 2 erros corrigidos e 4 melhorias aprovadas (dados sintéticos, sem pedidos externos):
1 botão Dia/Semana/Mês legível (contraste >= 4,5 com rato/foco), 2 marcação depois da meia-noite como «continua»,
3 confirmação de férias/baixa, 4 confirmação de passado, 5 linha do tempo única com horas do horário,
6 telemóvel: semana vertical e mês compacto com contagem."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-agenda-improvements')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


CONTRAST = """(sel)=>{const e=document.querySelector(sel),cs=getComputedStyle(e),p=c=>c.match(/[\\d.]+/g).map(Number).slice(0,3),L=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)},a=L(p(cs.color)),b=L(p(cs.backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}"""
SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k)),C=window.GSAttendanceCore;s.currentUser='test_adm';s.ceoRealUser='test_adm';s.ceoViewingAs=null;
 for(const u of s.users){if(u.id==='test_adm')u.hr={...u.hr,startTime:'10:00',endTime:'14:00'}}
 s.leave=[{user:'test_adm',type:'Férias',status:'Aprovado',start:'2026-11-19',end:'2026-11-20'}];
 const ev=(id,title,start,dur)=>{const at=C.instant(start.slice(0,10),start.slice(11));return{id,ownerId:'test_adm',clinicId:'abranfir',title,specialty:'',location:'',description:'',startsAt:at,endsAt:new Date(Date.parse(at)+dur*60000).toISOString(),duration:dur,status:'Agendada',revision:1,history:[],requests:[],createdAt:at,createdBy:'test_adm'}};
 s.agendaEvents=[ev('syn-n','SYN Noite','2026-11-11T23:30',90),ev('syn-b','SYN Tarde','2026-11-10T14:00',30),ev('syn-a','SYN Manhã','2026-11-10T09:00',30)];
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:test_adm',theme)}"""


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('tablet', 820, 1180), ('desktop', 1366, 900)]:
            for theme in ['light', 'dark']:
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, has_touch=device != 'desktop', is_mobile=device != 'desktop', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); p.on('dialog', lambda d: d.dismiss())
                p.clock.install(time=datetime.datetime.fromisoformat('2026-11-10T09:30:00+00:00')); p.goto(URL); p.wait_for_function('window.AgendaUIV4&&window.GSAttendanceCore')
                p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.AgendaUIV4'); p.evaluate("App.showView('agenda')"); p.wait_for_timeout(300)
                # 1) contraste do botão escolhido, com rato por cima e depois de tocar
                for m in ['day', 'week', 'month']:
                    btn = p.locator(f'[data-agenda-mode="{m}"]').first
                    btn.tap() if device != 'desktop' else btn.click(); p.wait_for_timeout(120); btn.hover() if device == 'desktop' else None
                    check(f'active {m} button readable (>=4.5)', p.evaluate(CONTRAST, f'[data-agenda-mode="{m}"]') >= 4.5)
                # 2) meia-noite e 5) linha do tempo
                p.locator('[data-agenda-mode="week"]').first.click(); p.wait_for_timeout(200)
                cont = p.locator('[data-agenda-day="2026-11-12"] .agenda-event').first.inner_text()
                check('event after midnight shown as continuation', 'continua desde 11/11' in cont and 'até 01:00' in cont)
                check('original day keeps start time', '23:30' in p.locator('[data-agenda-day="2026-11-11"] .agenda-event').first.inner_text())
                p.locator('[data-agenda-mode="day"]').first.click(); p.locator('#agendaFilters [name=date]').fill('2026-11-10'); p.locator('#agendaFilters [type=submit]').click(); p.wait_for_timeout(200)
                seq = p.evaluate("[...document.querySelectorAll('[data-agenda-day=\"2026-11-10\"] .agenda-event,[data-agenda-day=\"2026-11-10\"] .agenda-slot')].map(e=>e.classList.contains('agenda-event')?'E:'+e.querySelector('strong').textContent:'S:'+e.dataset.time)")
                check('single chronological timeline (events and free hours mixed)', seq.index('E:SYN Manhã') < seq.index('S:10:00') < seq.index('E:SYN Tarde') if 'S:10:00' in seq else False)
                p.locator('#agendaFilters [name=ownerId]').select_option('test_adm'); p.locator('#agendaFilters [type=submit]').click(); p.wait_for_timeout(200)
                own = p.evaluate("[...document.querySelectorAll('[data-agenda-day=\"2026-11-10\"] .agenda-slot')].map(e=>e.dataset.time)")
                check('free hours follow the person schedule (10:00-14:00)', own and own[0] == '10:00' and own[-1] == '13:00' and '08:00' not in own)
                p.locator('#agendaFilters [name=date]').fill('2026-11-19'); p.locator('#agendaFilters [type=submit]').click(); p.wait_for_timeout(200)
                check('approved holiday shown and no free hours offered', 'Férias aprovadas' in p.locator('[data-agenda-day="2026-11-19"]').inner_text() and p.locator('[data-agenda-day="2026-11-19"] .agenda-slot').count() == 0)
                # 3) férias e 4) passado: confirmação explícita no formulário
                p.locator('[data-agenda-action="new"]').first.click()
                f = p.locator('#agendaForm'); f.locator('[name=clinicId]').select_option('abranfir'); f.locator('[name=title]').fill('SYN durante férias'); f.locator('[name=date]').fill('2026-11-20'); f.locator('[name=time]').fill('11:00'); f.locator('[type=submit]').click()
                check('holiday requires confirmation, nothing saved', p.locator('[data-agenda-leave]').is_visible() and len(state(p)['agendaEvents']) == 3)
                f.locator('[name=allowLeave]').check(); f.locator('[type=submit]').click(); p.wait_for_timeout(150)
                check('confirmed holiday booking saved', any(x['title'] == 'SYN durante férias' and x.get('leaveConfirmed') for x in state(p)['agendaEvents']))
                p.locator('[data-agenda-action="new"]').first.click()
                f = p.locator('#agendaForm'); f.locator('[name=clinicId]').select_option('abranfir'); f.locator('[name=title]').fill('SYN passado'); f.locator('[name=date]').fill('2026-11-03'); f.locator('[name=time]').fill('11:00'); f.locator('[type=submit]').click()
                check('past booking requires confirmation, nothing saved', p.locator('[data-agenda-past]').is_visible() and not any(x['title'] == 'SYN passado' for x in state(p)['agendaEvents']))
                f.locator('[name=allowPast]').check(); f.locator('[type=submit]').click(); p.wait_for_timeout(150)
                check('confirmed past booking saved', any(x['title'] == 'SYN passado' and x.get('pastConfirmed') for x in state(p)['agendaEvents']))
                # 6) telemóvel: semana vertical e mês compacto
                p.locator('#agendaFilters [name=ownerId]').select_option(''); p.locator('#agendaFilters [name=date]').fill('2026-11-10'); p.locator('#agendaFilters [type=submit]').click()
                p.locator('[data-agenda-mode="week"]').first.click(); p.wait_for_timeout(200)
                if device == 'mobile':
                    check('mobile week is one column', p.evaluate("(()=>{const d=[...document.querySelectorAll('.agenda-week section.agenda-day')];return d.length===7&&d.every(x=>Math.abs(x.getBoundingClientRect().left-d[0].getBoundingClientRect().left)<2)})()"))
                    check('mobile week: one add button per day, hourly slots hidden', p.locator('.agenda-week .agenda-add-day:visible').count() == 7 and p.locator('.agenda-week .agenda-slot:not(.agenda-add-day):visible').count() == 0)
                    check('mobile week without inner horizontal scroll', p.evaluate("(()=>{const e=document.querySelector('.agenda-scroll');return e.scrollWidth<=e.clientWidth+2})()"))
                p.locator('[data-agenda-mode="month"]').first.click(); p.wait_for_timeout(200)
                check('month shows count of bookings per day', p.locator('[data-agenda-day="2026-11-10"] .agenda-count').inner_text() == '2')
                if device == 'mobile':
                    check('mobile month compact: day numbers only, no event cards', p.locator('.agenda-month .agenda-event:visible').count() == 0 and p.locator('[data-agenda-day="2026-11-10"] .agenda-dnum').is_visible())
                    check('mobile month fits the screen', p.evaluate("(()=>{const e=document.querySelector('.agenda-scroll');return e.scrollWidth<=e.clientWidth+2})()"))
                    p.locator('[data-agenda-day="2026-11-10"] [data-agenda-date]').tap(); p.wait_for_timeout(200)
                    check('tapping a day keeps the month and lists that day below', p.locator('[data-agenda-day]').count() == 42 and p.locator('[data-agenda-daylist="2026-11-10"]').is_visible() and 'SYN Manhã' in p.locator('[data-agenda-daylist]').inner_text())
                    p.locator('[data-agenda-daylist] [data-agenda-action="open-day"]').tap(); p.wait_for_timeout(200)
                    check('«Ver o dia completo» opens the day view', p.locator('[data-agenda-day]').count() == 1 and p.locator('[data-agenda-mode="day"]').first.get_attribute('aria-pressed') == 'true')
                check('no horizontal page overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'agenda-{device}-{theme}.png'), full_page=True); c.close()
    finally:
        (OUT / 'agenda-improvements-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

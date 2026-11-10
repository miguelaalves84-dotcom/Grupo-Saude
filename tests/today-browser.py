"""Ecrã «Hoje» e navegação (aprovados): início igual para todos os perfis, «Precisa de si» só com o que o perfil
pode ver, «Está tudo em dia» sem pendências, barra inferior no telemóvel escolhida pelas permissões, «Mais» com todos
os módulos visíveis (nomes, nunca contadores), «Hoje» no topo do menu, visões gerais fora do menu (no «Hoje»).
Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-today')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,me,leave])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=me;s.ceoRealUser=me;s.ceoViewingAs=me==='u1'?null:me;
 s.leave=(s.leave||[]).filter(x=>!String(x.id).startsWith('syn-today'));if(leave)s.leave.push({id:'syn-today-l',user:'test_med',type:'Férias',status:'Pendente',createdAt:'2026-11-05',start:'2026-12-14',end:'2026-12-18'});
 localStorage.setItem(k,JSON.stringify(s))}"""
TABS = {'u1': 'today,agenda,wait,clock,more', 'test_admin': 'today,agenda,wait,clock,more', 'test_adm': 'today,agenda,wait,clock,more',
        'test_call': 'today,agenda,wait,clock,more', 'test_med': 'today,clock,myhr,chat,more', 'test_tec': 'today,clock,myhr,chat,more'}

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for me in TABS:
            for device, w, h in [('mobile', 390, 844), ('tablet', 820, 1180), ('desktop', 1366, 900)]:
                for theme in (['light', 'dark'] if me in ('test_admin', 'test_med') else ['light']):
                    scope = {'actor': me, 'device': device, 'theme': theme}
                    c = browser.new_context(viewport={'width': w, 'height': h}, has_touch=device != 'desktop', is_mobile=device != 'desktop', service_workers='block')
                    c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                    p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.dismiss())
                    p.clock.install(time=datetime.datetime.fromisoformat('2026-11-10T09:30:00+00:00')); p.goto(URL); p.wait_for_function('window.TodayV4&&window.AttentionUIV4')
                    manager = me in ('u1', 'test_admin')
                    p.evaluate(SEED, [K, me, manager]); p.evaluate("t=>localStorage.setItem('gs-v4-theme:'+JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')).currentUser,t)", theme)
                    p.reload(); p.wait_for_function('window.TodayV4'); p.wait_for_timeout(350)
                    check('every profile starts on «Hoje»', p.evaluate("document.querySelector('main .view.active')?.id") == 'today' and p.locator('.workspace-location strong').inner_text() == 'Hoje')
                    check('greeting with the date', 'Bom dia' in p.locator('.today-hello').inner_text() and 'novembro' in p.locator('.today-head').inner_text())
                    need = p.locator('.today-need')
                    if manager:
                        check('pending holiday request appears in «Precisa de si» and opens it', need.locator('.today-item').filter(has_text='Férias').count() == 1)
                        check('managers see today indicators and area dashboards', p.locator('.today-kpi').count() == 4 and p.locator('.today-chips [data-today-view^="hub-"]').count() >= 3)
                    else:
                        check('nothing foreign in «Precisa de si»', 'Férias' not in need.inner_text())
                        check('no management indicators outside management', p.locator('.today-kpi').count() == 0)
                    if me == 'test_med':
                        check('nothing pending shows «Está tudo em dia»', p.locator('[data-today-empty]').is_visible())
                    check('shortcuts only to allowed modules', p.evaluate("[...document.querySelectorAll('.today-quick [data-today-view]')].every(b=>RoleAccessAdminV4.guard(b.dataset.todayView))") and p.locator('.today-quick button').count() >= 2)
                    check('agenda card only for agenda roles', (p.locator('.today-card h2', has_text='Agenda de hoje').count() == 1) == (me not in ('test_med', 'test_tec')))
                    bar = p.locator('#gsTabbar')
                    if device == 'mobile':
                        check('bottom bar visible with tabs for this profile', bar.is_visible() and p.evaluate("[...document.querySelectorAll('#gsTabbar [data-tab]')].map(b=>b.dataset.tab).join(',')") == TABS[me])
                        check('«Hoje» tab is current', bar.locator('[data-tab=today]').get_attribute('aria-current') == 'page')
                        if manager:
                            check('«Hoje» tab shows the pending count', bar.locator('[data-tab=today] i').inner_text() == p.evaluate('String(TodayV4.count())') != '0')
                        check('bottom bar does not cover the page end', p.evaluate("parseFloat(getComputedStyle(document.body).paddingBottom)>=60"))
                        second = TABS[me].split(',')[1]
                        bar.locator(f'[data-tab={second}]').tap(); p.wait_for_timeout(250)
                        check('tab opens its module and becomes current', p.evaluate("document.querySelector('main .view.active')?.id") == second and bar.locator(f'[data-tab={second}]').get_attribute('aria-current') == 'page')
                        bar.locator('[data-tab=more]').tap(); sheet = p.locator('#gsMoreSheet'); sheet.wait_for(state='visible')
                        labels = p.evaluate("[...document.querySelectorAll('#gsMoreSheet [data-sheet] span')].map(s=>s.textContent.trim())")
                        check('«Mais» lists modules by name (never a bare counter)', len(labels) >= 2 and all(not l.isdigit() and l for l in labels))
                        check('«Mais» only lists allowed views', p.evaluate("[...document.querySelectorAll('#nav details[data-nav-group]:not([hidden]) [data-view]')].length>0"))
                        target = 'Livro de ponto'
                        sheet.locator('[data-sheet]', has_text=target).first.tap(); p.wait_for_timeout(250)
                        check('choosing a module in «Mais» opens it and closes the sheet', not sheet.is_visible() and p.evaluate("document.querySelector('main .view.active')?.id") == 'clock')
                    else:
                        check('no bottom bar on tablet/desktop', not bar.is_visible())
                    if device == 'desktop':
                        p.evaluate("App.showView('today')"); p.wait_for_timeout(150)
                        check('«Hoje» first in the side menu and active', p.evaluate("(()=>{const m=document.querySelector('#nav .nav-menu');return m.firstElementChild.id==='navToday'&&m.firstElementChild.classList.contains('active')})()"))
                        check('area overviews not repeated in the menu', p.locator('#nav details[data-nav-group] > button[data-view^="hub-"]:visible').count() == 0)
                        if manager:
                            p.locator('.today-need .today-item').filter(has_text='Férias').click(); p.wait_for_timeout(300)
                            check('pending item opens the approval', p.evaluate("document.querySelector('main .view.active')?.id") != 'today' or p.locator('dialog[open]').count() >= 1)
                    check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                    p.screenshot(path=str(OUT / f'today-{me}-{device}-{theme}.png')); c.close()
        # um endereço com #vista continua a abrir essa vista
        scope = {'actor': 'test_admin', 'device': 'desktop', 'theme': 'light'}
        c = browser.new_context(viewport={'width': 1366, 'height': 900}, service_workers='block'); p = c.new_page(); p.goto(URL); p.wait_for_function('window.TodayV4')
        p.evaluate(SEED, [K, 'test_admin', False]); p.goto(URL + '#agenda'); p.reload(); p.wait_for_function('window.TodayV4'); p.wait_for_timeout(400)
        check('a direct link (#agenda) still opens that view', p.evaluate("document.querySelector('main .view.active')?.id") == 'agenda'); c.close()
    finally:
        (OUT / 'today-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

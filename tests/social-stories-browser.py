"""Histórias do dia: ao gravar a abertura, a administrativa recebe uma história por especialidade dos médicos presentes e
por área dos técnicos (1080×1920), descarrega/partilha e marca como publicada; aviso no «Hoje»; o nome do profissional
só aparece com a autorização dele no Meu RH. Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-social-stories')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.masterSpecialties=[...(s.masterSpecialties||[]).filter(x=>!String(x.id).startsWith('syn-sp')),{id:'syn-sp-cardio',name:'Cardiologia',active:true},{id:'syn-sp-fisio',name:'Fisioterapia',active:true}];
 s.clinicSpecialties={...(s.clinicSpecialties||{}),abranfir:['syn-sp-cardio','syn-sp-fisio']};for(const c of s.clinics)if(c.id==='abranfir')c.phone='241 000 111';
 const cap=Object.fromEntries(Array.from({length:7},(_,d)=>[d,{treatments:32}]));const patch=(u)=>{if(u.id==='test_med'){u.specialtyIds=['syn-sp-cardio'];u.hr={...(u.hr||{}),storyConsent:false}}if(u.id==='test_tec'){u.specialtyIds=['syn-sp-fisio'];u.hr={...(u.hr||{}),weeklyCapacity:cap}}};
 s.users.forEach(patch);for(const [id,e] of Object.entries(s.employees||{})){e.id=e.id||id;patch(e)}delete s.socialStories;s.opClinic='abranfir';
 localStorage.setItem(k,JSON.stringify(s));for(const u of ['test_adm','test_med'])localStorage.setItem('gs-v4-theme:'+u,theme)}"""
AS = "([k,u])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=u==='u1'?null:u;localStorage.setItem(k,JSON.stringify(s))}"


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)
def as_(p, u): p.evaluate(AS, [K, u]); p.reload(); p.wait_for_function('window.SocialStoriesV4&&window.GSOperationCore'); p.wait_for_timeout(300)
def numbers(p):
    for row in p.locator('[data-op-row]').all():
        b = row.locator('[data-op-field=booked]')
        if b.count(): b.fill('7'); b.dispatch_event('change')
        else:
            f = row.locator('[data-op-field=freeToday]'); f.fill('0'); f.dispatch_event('change')


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('desktop', 1366, 900)]:
            for theme in (['light', 'dark'] if device == 'desktop' else ['light']):
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device != 'desktop', has_touch=device != 'desktop', service_workers='block', accept_downloads=True)
                external = []
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') or r.request.url.startswith('data:') or r.request.url.startswith('blob:') else (external.append(r.request.url), r.abort()))
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.accept())
                p.clock.install(time=datetime.datetime.fromisoformat('2026-11-11T09:00:00+00:00'))
                p.goto(URL); p.wait_for_function('window.SocialStoriesV4&&window.GSSocialStories')
                p.evaluate(SEED, [K, theme])
                # o médico autoriza o nome nas histórias no Meu RH
                as_(p, 'test_med'); p.evaluate("App.showView('myhr')"); p.wait_for_timeout(600)
                box = p.locator('[data-sst-consent] input')
                check('Meu RH shows the story-name consent to clinical staff (off by default)', box.count() == 1 and not box.is_checked())
                box.check(); p.wait_for_timeout(300)
                check('consent saved for the professional', next(u for u in state(p)['users'] if u['id'] == 'test_med')['hr']['storyConsent'] is True)
                # a administrativa abre a clínica
                as_(p, 'test_adm'); p.evaluate("App.showView('operation')"); p.wait_for_timeout(700)
                check('no stories before the opening is saved', p.locator('[data-sst]').count() == 0)
                p.locator('#opDoctors').select_option(['test_med']); p.locator('#opTechnicians').select_option(['test_tec']); p.wait_for_timeout(300); numbers(p)
                p.locator('#opSaveOpening').click(); p.wait_for_timeout(1000)
                card = p.locator('[data-sst]')
                check('saving the opening shows one story per specialty and technical area', card.count() == 1 and card.locator('[data-sst-item]').count() == 2 and 'Cardiologia' in card.inner_text() and 'Fisioterapia' in card.inner_text())
                src = card.locator('[data-sst-item="spec:CARDIOLOGIA"] img').get_attribute('src')
                check('story mentions today, the clinic phone and the consenting doctor', 'quarta-feira%2C%2011%20de%20novembro' in src and '241%20000%20111' in src and 'M%C3%A9dico%20Teste' in src)
                with p.expect_download() as dl: card.locator('[data-sst-png]').first.click()
                f = OUT / f'story-{device}-{theme}.png'; dl.value.save_as(str(f)); head = f.read_bytes()[:24]
                check('download is a 1080×1920 PNG', head[:8] == b'\x89PNG\r\n\x1a\n' and int.from_bytes(head[16:20], 'big') == 1080 and int.from_bytes(head[20:24], 'big') == 1920)
                p.evaluate("App.showView('today')"); p.wait_for_timeout(400)
                check('«Hoje» reminds to publish today\'s stories', 'Publicar as 2 histórias de hoje' in p.locator('.today-need').inner_text())
                p.locator('.today-need [data-today-view=operation]').first.click(); p.wait_for_timeout(700)
                for i in range(2):
                    p.locator('[data-sst] [data-sst-done]').first.click(); p.wait_for_timeout(300)
                st = state(p).get('socialStories', [])
                check('both stories marked as published (logged with who and when)', len(st) == 2 and all(x['status'] == 'Publicada' and x['history'][-1]['by'] == 'test_adm' for x in st) and '2/2 publicadas' in p.locator('[data-sst]').inner_text())
                p.evaluate("App.showView('today')"); p.wait_for_timeout(400)
                check('reminder disappears once published', 'histórias de hoje' not in p.locator('.today-need').inner_text())
                check('no external requests', not external); check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.evaluate("App.showView('operation')"); p.wait_for_timeout(500); p.screenshot(path=str(OUT / f'social-stories-{device}-{theme}.png')); c.close()
    finally:
        (OUT / 'social-stories-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

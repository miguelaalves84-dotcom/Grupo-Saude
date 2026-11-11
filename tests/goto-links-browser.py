"""Ligações em todo o programa: avisos de dados em falta levam ao campo certo da ficha (clínica ou colaborador),
com destaque; nomes de pessoas e clínicas nas áreas novas abrem a ficha. Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-goto-links')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoRealUser='u1';s.ceoViewingAs=null;for(const c of s.clinics)if(c.id==='abranfir'){c.phone='241 000 111';c.ers={...(c.ers||{}),license:''};c.legalEntity={name:'Grupo Saúde, Lda.',nif:'500000000'}}
 for(const u of [...s.users,...Object.values(s.employees||{})])if(u.id==='test_tec')u.hr={...(u.hr||{}),grossSalary:0,admissionDate:'2025-01-01'};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:u1',theme)}"""
FIELDS = ['license', 'salary', 'function', 'promo', 'nif', 'iban', 'address', 'birth', 'admission', 'contract', 'phone', 'role']


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('desktop', 1366, 900)]:
            for theme in (['light', 'dark'] if device == 'desktop' else ['light']):
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device != 'desktop', has_touch=device != 'desktop', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') or r.request.url.startswith(('data:', 'blob:')) else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.accept())
                p.clock.install(time=datetime.datetime.fromisoformat('2026-11-10T10:00:00+00:00'))
                p.goto(URL); p.wait_for_function('window.GSGoTo&&window.MarketingImagesV4'); p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.GSGoTo&&window.MarketingImagesV4')
                # aviso «falta o registo ERS» → ficha da clínica no campo certo
                p.evaluate("App.showView('marketing')"); p.wait_for_timeout(700); p.locator('[data-mk-tab=assistant]').click(); p.wait_for_timeout(700)
                fx = p.locator('[data-mki] .gs-fix[data-goto="clinic:abranfir:ers"]')
                check('missing ERS warning has a «Preencher na ficha da clínica» link', fx.count() == 1)
                fx.click(); p.wait_for_timeout(1200)
                check('link opens the clinic record on the ERS field, highlighted', p.evaluate("document.getElementById('modal')?.open") and p.evaluate("document.activeElement?.id") == 'cmERS' and p.locator('#cmERS.gs-goto-focus').count() == 1)
                p.locator('#cmERS').fill('E123456'); p.locator('[data-cm-action=save]').click(); p.wait_for_timeout(700)
                check('after filling it in the clinic record, the image becomes compliant', next(x for x in p.evaluate("k=>JSON.parse(localStorage.getItem(k)).clinics", K) if x['id'] == 'abranfir')['ers']['license'] == 'E123456')
                p.evaluate("App.showView('marketing')"); p.wait_for_timeout(600); p.locator('[data-mk-tab=assistant]').click(); p.wait_for_timeout(700)
                check('no more ERS warning', p.locator('[data-mki] [data-mki-check]').get_attribute('data-mki-check') in ('ok', 'warn') and p.locator('[data-mki] .gs-fix[data-goto="clinic:abranfir:ers"]').count() == 0)
                # campos da ficha do colaborador
                for f in FIELDS:
                    p.evaluate(f"GSGoTo.open('employee:test_tec:{f}')"); p.wait_for_timeout(1100)
                    check(f'employee field «{f}» opens and is highlighted', p.locator('#employeeWorkspace').count() == 1 and p.locator('.gs-goto-focus').count() == 1)
                # nomes no painel de pessoas: «sem salário» leva ao salário
                p.evaluate("HRLifecycleV4.openSection('people')"); p.wait_for_timeout(900)
                ms = p.locator('#rh-panel-people [data-goto="employee:test_tec:salary"]')
                check('«Sem salário na ficha» names are links', ms.count() == 1)
                ms.click(); p.wait_for_timeout(1200)
                check('…which open the salary field', p.evaluate("document.activeElement?.id") == 'hrGross')
                p.evaluate("HRLifecycleV4.openSection('people')"); p.wait_for_timeout(900)
                check('clinic names in the people dashboard open the clinic record', p.locator('#rh-panel-people [data-goto="clinic:abranfir"]').count() >= 1)
                # Operação: erro da abertura com «Corrigir» e nomes clicáveis
                p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_adm';s.ceoViewingAs='test_adm';s.opClinic='abranfir';for(const u of [...s.users,...Object.values(s.employees||{})])if(u.id==='test_tec')u.hr={...(u.hr||{}),weeklyCapacity:{}};localStorage.setItem(k,JSON.stringify(s))}", K); p.reload(); p.wait_for_function('window.GSGoTo&&window.GSOperationCore')
                p.evaluate("App.showView('operation')"); p.wait_for_timeout(700); p.locator('#opTechnicians').select_option(['test_tec']); p.wait_for_timeout(300)
                check('Operation: professional names in the opening are links to their record', p.locator('.opening-name [data-goto="employee:test_tec"]').count() == 1)
                p.locator('#opSaveOpening').click(); p.wait_for_timeout(600)
                er = p.locator('#opOpeningErrors')
                check('Operation: «capacity missing» error gets «Configurar a capacidade na ficha de …»', er.locator('.gs-fix[data-goto="employee:test_tec:capacity"]').count() == 1)
                p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoViewingAs=null;localStorage.setItem(k,JSON.stringify(s))}", K); p.reload(); p.wait_for_function('window.GSGoTo')
                p.evaluate("GSGoTo.open('employee:test_tec:capacity')"); p.wait_for_timeout(1200)
                check('…which opens the capacity of that technician', p.evaluate("document.activeElement?.dataset?.capacityCategory||''") != '' and p.locator('.gs-goto-focus').count() == 1)
                # Stock: produtos e pessoas clicáveis
                call = lambda a, b: p.evaluate("([a,b])=>GSStockDemo.call(a,{clinicId:'abranfir',idempotencyKey:crypto.randomUUID(),...b})", [a, b])
                p.evaluate("App.showView('stock')"); p.wait_for_timeout(500)
                call('category-save', {'id': 'cat', 'name': 'SYN Consumíveis'}); call('supplier-save', {'id': 'sup', 'name': 'SYN Fornecedor Norte'})
                call('product-save', {'id': 'luvas', 'name': 'SYN Luvas', 'reference': 'LUV', 'unit': 'cx', 'categoryId': 'cat', 'minimum': 5, 'maximum': 40})
                call('price-record', {'productId': 'luvas', 'supplierId': 'sup', 'unitCostCents': 420, 'kind': 'Cotação', 'on': '2026-10-20'})
                p.evaluate("App.showView('today')"); p.wait_for_timeout(200); p.evaluate("App.showView('stock')"); p.wait_for_timeout(800)
                pl = p.locator('#stock [data-goto="product:luvas"]')
                check('Stock: product names are links', pl.count() >= 1)
                pl.first.click(); p.wait_for_timeout(700)
                check('…which open the product record', p.evaluate("document.getElementById('modal')?.open") and 'SYN Luvas' in p.locator('#modalTitle').inner_text())
                p.evaluate("document.getElementById('modal')?.close()"); call('request-create', {'productId': 'luvas', 'quantity': 5, 'reason': 'SYN reposição'})
                p.evaluate("App.showView('today')"); p.wait_for_timeout(200); p.evaluate("App.showView('stock')"); p.wait_for_timeout(600); p.locator('[role=tab][data-stock-id=requests]').click(); p.wait_for_timeout(600)
                check('Stock: who asked for material is a link to the person', p.locator('#stock [data-goto="employee:u1"]').count() >= 1)
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                c.close()
    finally:
        (OUT / 'goto-links-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

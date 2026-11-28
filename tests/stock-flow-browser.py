"""Stock — circuito aprovado pelo responsável: a administrativa pede vários produtos (com sugestões abaixo do mínimo),
o CEO/Administração aprova em lote escolhendo fornecedor, quantidades e preços (com histórico), a encomenda aparece
logo à clínica em «A receber», a administrativa confere produto a produto (parcial e «Chegou tudo certo») e o stock
sobe; o histórico de preços fica por produto e só é visível a quem compra. Dados sintéticos; sem pedidos externos."""
import os, json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-stock-flow')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


def as_(p, u):
    p.evaluate("([k,u])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoRealUser=u;s.ceoViewingAs=u==='u1'?null:u;localStorage.setItem(k,JSON.stringify(s))}", [K, u])
    p.reload(); p.wait_for_function('window.StockUIV4&&window.TodayV4'); p.wait_for_timeout(250); p.evaluate("App.showView('stock')"); p.wait_for_timeout(250)


def call(p, a, b):
    return p.evaluate("([a,b])=>JSON.stringify(GSStockDemo.call(a,{clinicId:'abranfir',idempotencyKey:crypto.randomUUID(),...b}))", [a, b])


def ledger(p): return p.evaluate("k=>JSON.parse(localStorage.getItem(k)).stockLedgers.abranfir", K)


def txt(loc): return loc.inner_text().replace('\xa0', ' ').replace('\u202f', ' ')


def tap(p, device, loc): loc.tap() if device == 'mobile' else loc.click()


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('desktop', 1366, 1000)]:
            for theme in ['light', 'dark']:
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device == 'mobile', has_touch=device == 'mobile', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.dismiss())
                p.goto(URL); p.wait_for_function('window.StockUIV4')
                p.evaluate("t=>{for(const u of ['u1','test_adm'])localStorage.setItem('gs-v4-theme:'+u,t)}", theme)
                as_(p, 'u1')
                call(p, 'category-save', {'id': 'cat', 'name': 'SYN Consumíveis'}); call(p, 'supplier-save', {'id': 'sup', 'name': 'SYN Fornecedor Norte'}); call(p, 'supplier-save', {'id': 'sup2', 'name': 'SYN Fornecedor Sul'})
                call(p, 'product-save', {'id': 'luvas', 'name': 'SYN Luvas', 'reference': 'LUV', 'unit': 'cx', 'categoryId': 'cat', 'minimum': 5, 'maximum': 40, 'supplierPrices': [{'supplierId': 'sup', 'unitCostCents': 420, 'currency': 'EUR', 'validFrom': '2026-01-01', 'validUntil': '', 'preferred': True}]})
                call(p, 'product-save', {'id': 'gel', 'name': 'SYN Gel', 'reference': 'GEL', 'unit': 'un', 'categoryId': 'cat', 'minimum': 2, 'maximum': 20, 'trackLots': True})
                call(p, 'product-save', {'id': 'comp', 'name': 'SYN Compressas', 'reference': 'CMP', 'unit': 'pct', 'categoryId': 'cat', 'minimum': 0, 'maximum': 50})
                call(p, 'price-record', {'productId': 'luvas', 'supplierId': 'sup2', 'unitCostCents': 395, 'kind': 'Cotação', 'on': '2026-10-20'})
                # 1) administrativa: pedido com vários produtos a partir das sugestões
                as_(p, 'test_adm'); tap(p, device, p.locator('[role=tab][data-stock-id=requests]')); tap(p, device, p.locator('#stockPanel [data-stock-action=request-create]'))
                sug = p.locator('[data-stock-suggest]')
                check('suggestions list products below the minimum with the quantity up to the maximum', 'SYN Luvas' in sug.inner_text() and '+ Pedir 40' in sug.inner_text() and 'SYN Compressas' not in sug.inner_text())
                tap(p, device, p.locator('[data-suggest-add=luvas]')); tap(p, device, p.locator('[data-suggest-add=gel]')); tap(p, device, p.locator('#stockAddRequestLine'))
                last = p.locator('#stockRequestLines [data-request-line]').last; last.locator('[name=productId]').select_option('comp'); last.locator('[name=quantity]').fill('3')
                p.locator('#stockForm [name=reason]').fill('SYN reposição'); tap(p, device, p.locator('#stockForm button[type=submit]')); expect(p.locator('#modal')).not_to_be_visible()
                reqs = ledger(p)['requests']
                check('one request per product, grouped together', [(r['productId'], r['quantity']) for r in reqs] == [('luvas', 40), ('gel', 20), ('comp', 3)] and len({r.get('groupId') for r in reqs}) == 1 and reqs[0].get('groupId'))
                check('administrativa cannot approve', p.locator('[data-stock-action=request-approve]').count() == 0)
                check('names and dates are readable', 'Administrativa Teste' in p.locator('#stockPanel').inner_text() and 'T' not in p.locator('#stockPanel .meta').first.inner_text().split('·')[2])
                # 2) CEO: aprovação em lote com fornecedor, preço e recusa
                as_(p, 'u1'); p.evaluate("App.showView('today')"); p.wait_for_timeout(200)
                check('«Hoje» tells the CEO what to approve, with product and quantity', 'Pedido de material por aprovar: SYN Luvas · 40' in p.locator('.today-need').inner_text())
                p.evaluate("App.showView('stock')"); tap(p, device, p.locator('[role=tab][data-stock-id=requests]')); tap(p, device, p.locator('#stockPanel .actions [data-stock-action=request-approve]'))
                f = p.locator('#stockForm')
                check('preferred supplier and its price come preselected', f.locator('[name=supplierId]').input_value() == 'sup' and f.locator('[data-approve-line]').nth(0).locator('[name=price]').input_value() == '4.20')
                check('price history hint shows the best quote', 'Melhor 3,95 € (SYN Fornecedor Sul)' in txt(f.locator('[data-approve-line]').nth(0).locator('[data-price-hint]')))
                f.locator('[data-approve-line]').nth(0).locator('[name=quantity]').fill('30')
                f.locator('[data-approve-line]').nth(2).locator('[name=decision]').select_option('refuse'); f.locator('[name=reason]').fill('SYN compressas ainda chegam')
                tap(p, device, f.locator('button[type=submit]')); expect(p.locator('#modal')).not_to_be_visible()
                led = ledger(p); o = led['orders'][-1]
                check('approval creates the order already placed with the chosen supplier', o['status'] == 'Encomendada' and o['supplierId'] == 'sup' and [(l['productId'], l['quantity']) for l in o['lines']] == [('luvas', 30), ('gel', 20)] and o['lines'][0]['unitCostCents'] == 420)
                check('refused line recorded with reason', [r['status'] for r in led['requests']] == ['Aprovado', 'Aprovado', 'Recusado'] and led['requests'][2]['decisionReason'] == 'SYN compressas ainda chegam')
                check('CEO lands on Encomendas after approving', p.locator('[role=tab][data-stock-id=orders]').get_attribute('aria-selected') == 'true')
                # 3) administrativa: «A receber», receção parcial e «Chegou tudo certo»
                as_(p, 'test_adm')
                check('administrativa opens Stock directly on «A receber»', p.locator('[role=tab][data-stock-id=orders]').get_attribute('aria-selected') == 'true' and 'Encomendada · por receber' in p.locator('#stockPanel').inner_text())
                check('administrativa never sees prices', 'unitCostCents' not in p.evaluate("JSON.stringify(GSStockDemo.call('stock',{clinicId:'abranfir'}))") and '€' not in p.locator('#stockPanel').inner_text())
                p.evaluate("App.showView('today')"); p.wait_for_timeout(200)
                check('«Hoje» tells the clinic there is an order to receive', 'Encomenda por receber: SYN Fornecedor Norte · 2 produtos' in p.locator('.today-need').inner_text())
                p.locator('.today-need .today-item', has_text='Encomenda por receber').click(); p.wait_for_timeout(300)
                check('the «Hoje» item opens Stock on the orders', p.evaluate("document.querySelector('main .view.active').id") == 'stock' and p.locator('[role=tab][data-stock-id=orders]').get_attribute('aria-selected') == 'true')
                tap(p, device, p.locator('#stockPanel [data-stock-action=order-receive]'))
                rec = p.locator('#stockForm')
                check('receipt is prefilled; lot only for products with lots', rec.locator('[data-stock-receipt=luvas] [name=quantity]').input_value() == '30' and rec.locator('[data-stock-receipt=luvas] [name=lot]').count() == 0 and rec.locator('[data-stock-receipt=gel] [name=lot]').count() == 1)
                rec.locator('[data-stock-receipt=luvas] [name=quantity]').fill('25'); rec.locator('[data-stock-receipt=gel] [name=lot]').fill('SYN-G1')
                tap(p, device, rec.locator('button[type=submit]')); expect(p.locator('#modal')).not_to_be_visible()
                led = ledger(p)
                check('partial receipt adds only what arrived and keeps the rest to receive', led['orders'][-1]['status'] == 'Parcial' and sum(b['quantity'] for b in led['balances'] if b['productId'] == 'luvas') == 25000 and sum(b['quantity'] for b in led['balances'] if b['productId'] == 'gel') == 20000)
                tap(p, device, p.locator('#stockPanel [data-stock-action=order-receive]'))
                check('second receipt shows only what is missing', p.locator('#stockForm [data-stock-receipt]').count() == 1 and p.locator('#stockForm [data-stock-receipt=luvas] [name=quantity]').input_value() == '5')
                tap(p, device, p.locator('[data-stock-all-ok]')); expect(p.locator('#modal')).not_to_be_visible()
                led = ledger(p)
                check('«Chegou tudo certo» completes the order and the stock', led['orders'][-1]['status'] == 'Recebida' and sum(b['quantity'] for b in led['balances'] if b['productId'] == 'luvas') == 30000)
                check('finished orders move to «Concluídas»', p.locator('#stockPanel details.stock-done').count() == 1 and 'Nada por receber' in p.locator('#stockPanel').inner_text())
                # 4) CEO: histórico de preços na ficha do produto
                as_(p, 'u1'); tap(p, device, p.locator('[role=tab][data-stock-id=inventory]')); tap(p, device, p.locator('[data-stock-action=detail][data-stock-id=luvas]'))
                summ = txt(p.locator('[data-price-summary]'))
                check('price history: last purchase, best quote and 12-month average', '4,20 €' in summ and '3,95 €' in summ and 'SYN Fornecedor Sul' in summ and 'Média 12 meses' in summ)
                tap(p, device, p.locator('#modal [data-stock-action=price-record]'))
                pf = p.locator('#stockForm'); pf.locator('[name=supplierId]').select_option(''); pf.locator('[name=supplierName]').fill('SYN Fornecedor Leste'); pf.locator('[name=price]').fill('3.80')
                tap(p, device, pf.locator('button[type=submit]')); p.wait_for_timeout(300)
                check('a new quote becomes the best price', 'SYN Fornecedor Leste' in txt(p.locator('[data-price-summary]')) and '3,80 €' in txt(p.locator('[data-price-summary]')))
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'stock-flow-{device}-{theme}.png'), full_page=True); c.close()
    finally:
        (OUT / 'stock-flow-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

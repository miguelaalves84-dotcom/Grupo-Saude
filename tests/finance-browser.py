"""Real browser regression, isolated contexts. GS_TEST_URL should be a TEST preview only."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get('GS_TEST_URL', (ROOT / 'index.html').as_uri())
KEY = 'grupo_saude_v4_demo_2'
ACTORS = ['u1', 'test_admin', 'test_adm', 'test_call', 'test_med', 'test_tec']
PDF = b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('GS_CHROMIUM') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else p.chromium.executable_path), headless=True, args=['--no-sandbox'])
    for actor in ACTORS:
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(700)
        page.evaluate('''([key,id])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(key,JSON.stringify(s))}''', [KEY, actor])
        page.reload()
        page.wait_for_timeout(700)
        page.locator('#shortcut_invoices').click()
        page.locator('[data-fin-action="invoice-new"]').click()
        form = page.locator('#financeDialog form')
        form.locator('[name=number]').fill('E2E-'+actor)
        form.locator('[name=value]').fill('75.25')
        form.locator('[name=document]').set_input_files({'name': 'invoice.pdf', 'mimeType': 'application/pdf', 'buffer': PDF+actor.encode()})
        form.locator('[type=submit]').click()
        page.wait_for_timeout(300)
        expect(page.locator('#financeContent').get_by_text(('E2E-'+actor).upper(), exact=True)).to_be_visible()
        assert page.evaluate('''([key,actor])=>JSON.parse(localStorage.getItem(key)).financeV2.invoices.some(x=>x.employeeId===actor&&x.number===('E2E-'+actor).toUpperCase())''', [KEY, actor])
        assert page.locator('[data-fin-action="manage"]').count() == int(actor in ['u1', 'test_admin'])
        if actor in ['u1', 'test_admin']:
            page.locator('[data-fin-action="invoice-approve"]').first.click()
            page.locator('#financeDialog [type=submit]').click()
            page.wait_for_timeout(200)
        page.locator('#shortcut_account').click()
        page.wait_for_timeout(200)
        assert 'NaN' not in page.locator('#financeContent').inner_text()
        with page.expect_download() as download:
            page.locator('[data-fin-action="pdf"]').click()
        assert Path(download.value.path()).read_bytes().startswith(b'%PDF-1.4')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('[data-fin-action="payslips"]').click()
        assert 'Recibos de Vencimento' in page.locator('#financeContent').inner_text()
        assert not errors, (actor, errors)
        context.close()
        print('PASS browser finance:', actor)
    browser.close()

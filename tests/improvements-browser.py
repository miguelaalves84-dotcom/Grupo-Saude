"""Actual UI regression in isolated demo contexts. No real data or external emails."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
URL = os.environ.get('GS_TEST_URL', (Path(__file__).resolve().parent.parent / 'index.html').as_uri())
KEY = 'grupo_saude_v4_demo_2'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('GS_CHROMIUM') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else p.chromium.executable_path), headless=True, args=['--no-sandbox'])
    for actor in ['u1', 'test_admin', 'test_adm', 'test_call', 'test_med', 'test_tec']:
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_function('window.AttentionUIV4 && window.WorkspaceShellV4')
        page.evaluate('''([key,actor])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=actor;s.ceoViewingAs=actor==='u1'?null:actor;s.financeV2={invoices:[{id:'browser-invoice',employeeId:'test_med',status:'Pendente',revision:0,number:'DEMO'}],payslips:[],entries:[],events:[]};localStorage.setItem(key,JSON.stringify(s))}''', [KEY, actor])
        page.reload()
        page.wait_for_function('window.AttentionUIV4 && document.getElementById("attentionToggle")')
        manager = actor in ['u1', 'test_admin']
        assert page.evaluate('AttentionUIV4.items().some(x=>x.entityId==="browser-invoice")') == manager
        page.locator('#themeToggle').click()
        assert page.locator('html').get_attribute('data-theme') == 'dark'
        page.reload()
        page.wait_for_function('document.documentElement.dataset.theme==="dark"')
        page.locator('#attentionToggle').click()
        assert page.locator('#attentionDialog').is_visible()
        if manager:
            item = page.evaluate('AttentionUIV4.items().find(x=>x.entityId==="browser-invoice").id')
            page.evaluate('(id)=>AttentionUIV4.read(id)', item)
            assert page.evaluate('AttentionUIV4.items().some(x=>x.entityId==="browser-invoice")')
        page.locator('#attentionDialog .modal-head button').click()
        page.evaluate('(actor)=>HRMasterV4.open(actor,"resumo")', actor)
        assert 'Ficha central do colaborador' in page.locator('#modalBody').inner_text()
        page.locator('#modal .modal-head button').click()
        for width in [820, 390]:
            page.set_viewport_size({'width': width, 'height': 900})
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
        assert not errors, (actor, errors)
        print('PASS real browser: notifications/theme/master RH/responsive', actor)
        context.close()
    browser.close()

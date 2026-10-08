"""E2E local pendente: requer Playwright e um ambiente que permita Chromium."""
from pathlib import Path
import json
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
KEY = 'grupo_saude_v4_demo_2'
URL = os.environ.get('GS_TEST_URL', (ROOT / 'index.html').as_uri())
ACTORS = [('u1', 'CEO'), ('test_admin', 'Administração'),
          ('test_adm', 'Administrativa'), ('test_call', 'Call Center'),
          ('test_med', 'Médico/a'), ('test_tec', 'Técnico/a'), ('test_bas', 'Básico')]
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('GS_CHROMIUM', '/usr/bin/chromium'),
                                headless=True, args=['--no-sandbox'])
    for uid, role in ACTORS:
        context = browser.new_context()
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(1500)
        page.evaluate('''([key,id])=>{const s=JSON.parse(localStorage.getItem(key));
            s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;
            localStorage.setItem(key,JSON.stringify(s))}''', [KEY, uid])
        page.reload()
        page.wait_for_timeout(1500)
        assert not errors, (role, errors)
        views = page.locator('#nav [data-view]').evaluate_all('(buttons)=>buttons.map(b=>b.dataset.view)')
        checked = []
        for view in views:
            allowed = page.evaluate('(id)=>RoleAccessAdminV4.guard(id)', view)
            if allowed:
                page.locator(f'#nav [data-view="{view}"]').click()
                page.wait_for_timeout(150)
                assert page.locator('section.view.active').count() == 1, (role, view)
                assert page.locator(f'#{view}').evaluate("e=>e.classList.contains('active')"), (role, view)
                assert page.locator(f'#{view}').inner_text().strip(), (role, view, 'empty view')
                checked.append(view)
            else:
                assert not page.evaluate('(id)=>App.showView(id)', view), (role, view, 'permission bypass')
        if role in ['CEO', 'Administração']:
            page.locator('#nav [data-view="hr"]').click()
            page.get_by_role('button', name='Colaboradores', exact=True).click()
            assert page.locator('#hrContent').inner_text().strip()
            page.get_by_role('button', name='Candidatos', exact=True).click()
            assert 'Candidatos' in page.locator('#hrContent').inner_text()
            page.locator('#nav [data-view="dashboard"]').click()
            page.wait_for_timeout(250)
            assert page.locator('#dashboard').evaluate("e=>e.classList.contains('active')")
        assert not errors, (role, errors)
        results.append({'profile': role, 'direct_modules': checked, 'errors': errors})
        context.close()
    browser.close()
print(json.dumps(results, ensure_ascii=False, indent=2))

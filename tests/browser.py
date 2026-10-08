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
        # All fixtures live only in this isolated browser context/localStorage.
        page.evaluate("""key=>{const s=JSON.parse(localStorage.getItem(key));
          const p=s.users.find(u=>u.id==='test_med');p.clinics=['issue6_clinic'];p.hr={...(p.hr||{}),vacationDays:22};
          s.employees.test_med={...p,id:'test_med'};
          s.clinics.push({id:'issue6_clinic',name:'Clínica de teste',active:true});
          s.users.push({id:'issue6_peer',name:'Colega de teste',role:'MEDICO/A',clinics:['issue6_clinic']});
          s.leave=[{id:'issue6_original',employeeId:'test_med',type:'Férias',clinicId:'issue6_clinic',
              days:['2026-07-06','2026-07-07','2026-07-08'],start:'2026-07-06',end:'2026-07-08',status:'Aprovado'},
            {id:'issue6_conflict',employeeId:'issue6_peer',type:'Férias',days:['2026-07-07'],status:'Pendente'}];
          localStorage.setItem(key,JSON.stringify(s))}""", KEY)
        if role in ['CEO', 'Administração']:
            page.evaluate("HRLeaveUIV4.open('issue6_original')")
            assert page.locator('#modalBody').get_by_text('Clínica de teste', exact=True).count()
            assert page.locator('#leaveContext').get_by_text('Sobreposição', exact=True).count()
            assert page.locator('[data-leave-action="approve"]').count() == 0
            page.locator('[data-leave-action="edit"]').click()
            page.locator('[data-leave-day="2026-07-07"]').check()
            page.locator('#leaveNewStart').fill('2026-08-03')
            page.locator('#leaveNewEnd').fill('2026-08-03')
            page.locator('#leaveChangeReason').fill('Teste de reagendamento parcial')
            page.locator('[data-leave-action="save"]').click()
            actual = page.evaluate("HRLeaveV4.days(HRLeaveV4.read().leave.find(x=>x.id==='issue6_original'))")
            assert actual == ['2026-07-06', '2026-07-08', '2026-08-03'], actual
            page.evaluate("HRLeaveUIV4.calendar('test_med')")
            page.locator('#vacMonth').fill('2026-07')
            page.locator('[data-leave-id="issue6_original"]').first.click()
            assert 'Período original preservado' in page.locator('#modalBody').inner_text()
            checked.append('RH: conflito, detalhe, edição parcial e clique no período')
        elif uid == 'test_med':
            page.evaluate("HRLeaveUIV4.open('issue6_original')")
            assert page.locator('#leaveContext').count() == 0
            page.locator('[data-leave-action="edit"]').click()
            page.locator('[data-leave-day="2026-07-07"]').check()
            page.locator('#leaveNewStart').fill('2026-08-03')
            page.locator('#leaveNewEnd').fill('2026-08-03')
            page.locator('#leaveChangeReason').fill('Pedido individual de teste')
            page.locator('[data-leave-action="save"]').click()
            state = page.evaluate("HRLeaveV4.read()")
            assert next(x for x in state['leave'] if x.get('changeOf'))['status'] == 'Pendente'
            assert next(x for x in state['leave'] if x['id']=='issue6_original')['days'] == ['2026-07-06','2026-07-07','2026-07-08']
            checked.append('RH: pedido individual pendente sem alterar original')
        assert not errors, (role, errors)
        results.append({'profile': role, 'direct_modules': checked, 'errors': errors})
        context.close()
    browser.close()
print(json.dumps(results, ensure_ascii=False, indent=2))

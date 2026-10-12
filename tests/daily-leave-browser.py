"""Available demo flows: sick leave adjustments and daily close prerequisites."""
import json
import os
from playwright.sync_api import sync_playwright, expect
KEY = 'grupo_saude_v4_demo_2'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(os.environ['GS_TEST_URL'])
    page.wait_for_function('window.HRLeaveV4 && window.App && window.RoleAccessAdminV4')
    clinic_id = page.evaluate('JSON.parse(localStorage.getItem("'+KEY+'")).clinics.find(c => c.active !== false).id')
    page.evaluate('''([key, clinicId]) => {
        const s = JSON.parse(localStorage.getItem(key));
        s.currentUser = 'u1'; s.ceoViewingAs = null;
        s.opClinic = clinicId; s.opDate = '2026-10-12'; s.opPhase = 'open'; s.days = {};
        s.leave = [
            {id:'synthetic-vacation',employeeId:'test_med',clinicId,type:'Férias',
             days:['2026-10-12','2026-10-13','2026-10-14'],status:'Aprovado'},
            {id:'synthetic-sick',employeeId:'test_med',clinicId,type:'Baixa',
             days:['2026-10-13'],start:'2026-10-13',end:'2026-10-13',status:'Pendente'}
        ];
        localStorage.setItem(key, JSON.stringify(s));
    }''', [KEY, clinic_id])
    page.reload()
    page.wait_for_function('window.HRLeaveV4 && window.App')
    page.evaluate("HRLeaveUIV4.open('synthetic-sick')")
    page.locator('[data-leave-action="approve"]').click()
    state = page.evaluate('HRLeaveV4.read()')
    assert next(x for x in state['leave'] if x['id'] == 'synthetic-sick')['status'] == 'Aprovado'
    vacation = next(x for x in state['leave'] if x['id'] == 'synthetic-vacation')
    assert vacation['days'] == ['2026-10-12', '2026-10-14'], vacation
    page.evaluate("HRLeaveUIV4.calendar('test_med')")
    expect(page.locator('#vacMonth')).to_be_visible()
    page.locator('#vacMonth').fill('2026-10')
    assert page.locator('[data-leave-id="synthetic-vacation"]').count() > 0
    page.locator('#modal .modal-head button').click()
    page.evaluate("App.showView('operation')")
    expect(page.locator('#opClinic')).to_have_value(clinic_id)
    page.get_by_role('button', name='Guardar abertura', exact=True).click()
    state = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
    assert state['days']['2026-10-12_' + clinic_id]['open']['saved']
    page.evaluate("App.setPhase('close')")
    page.get_by_role('button', name='Fechar dia e criar resumo', exact=True).click()
    expect(page.locator('#modalTitle')).to_have_text('Fecho bloqueado')
    state = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
    assert not state['days']['2026-10-12_' + clinic_id]['closed']
    page.locator('#modal .modal-head button').click()
    # Complete only the synthetic day's required tasks using the existing domain API.
    page.evaluate('''([key, clinicId]) => {
        const s = JSON.parse(localStorage.getItem(key));
        for (const t of s.tasks.filter(t => t.active && t.required && ['live','close'].includes(t.phase)
            && (t.clinics.includes('all') || t.clinics.includes(clinicId)))) App.setTask(t.id, 'done');
    }''', [KEY, clinic_id])
    page.get_by_role('button', name='Fechar dia e criar resumo', exact=True).click()
    state = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
    day = state['days']['2026-10-12_' + clinic_id]
    assert day['closed'] and day['summary'] and day['closedBy'] == 'u1', day
    assert not errors, errors
    print(json.dumps({'passed': ['sick leave adjusts only overlapping vacation days',
        'calendar remains available', 'daily opening saved', 'required tasks block close',
        'completed tasks allow summary'], 'scope': 'synthetic demo only'}))
    context.close()
    browser.close()

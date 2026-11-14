"""Dados fictícios de teste na demonstração (pré-visualização): clínicas com registo ERS, NIF e telefone fictícios;
colaboradores de teste com especialidade, cédula, capacidade e salário fictícios — só onde estava vazio. Com eles,
as histórias e as imagens passam a cumprir as regras e a abertura grava sem erros de capacidade."""
import os, json, datetime
from playwright.sync_api import sync_playwright
URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); K = 'grupo_saude_v4_demo_2'; results = []
def check(name, value):
    results.append({'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox']); p = b.new_page(viewport={'width': 1280, 'height': 900}); errs = []; p.on('pageerror', lambda e: errs.append(str(e))); p.on('dialog', lambda d: d.accept())
    p.clock.install(time=datetime.datetime.fromisoformat('2026-11-12T09:00:00+00:00'))
    p.goto(URL); p.wait_for_function('window.GSDemoFictitious'); s = p.evaluate('k=>JSON.parse(localStorage.getItem(k))', K)
    check('local test runs keep the original demo (no fictitious data unless asked)', not s.get('fictitiousSeedV1'))
    p.goto(URL + '?fictitious=1'); p.wait_for_function('window.GSDemoFictitious'); p.wait_for_timeout(500); s = p.evaluate('k=>JSON.parse(localStorage.getItem(k))', K)
    ab = next(c for c in s['clinics'] if c['id'] == 'abranfir'); tec = next(u for u in s['users'] if u['id'] == 'test_tec'); med = next(u for u in s['users'] if u['id'] == 'test_med')
    check('clinics get fictitious ERS, valid fictitious NIF and phone', ab['ers']['license'].startswith('E9000') and ab['legalEntity']['nif'] == '500000000' and ab.get('phone') and p.evaluate("GSClinicProfile.nifOk('500000000')"))
    check('test professionals get fictitious specialty, cédula, capacity and salary, marked as fictitious', tec['hr']['professionalLicense'].endswith('(fictícia)') and tec['hr']['weeklyCapacity'] and tec['hr']['grossSalary'] == 1200 and med['specialtyIds'] and tec['hr']['fictitiousData'])
    p.evaluate("App.showView('marketing')"); p.wait_for_timeout(700); p.locator('[data-mk-tab=assistant]').click(); p.wait_for_timeout(700)
    check('with fictitious data, publication images pass the health-advertising check', p.locator('[data-mki] [data-mki-check]').get_attribute('data-mki-check') == 'ok')
    p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='test_adm';s.ceoViewingAs='test_adm';s.opClinic='abranfir';localStorage.setItem(k,JSON.stringify(s))}", K); p.reload(); p.wait_for_function('window.GSOperationCore')
    p.evaluate("App.showView('operation')"); p.wait_for_timeout(700); p.locator('#opDoctors').select_option(['test_med']); p.locator('#opTechnicians').select_option(['test_tec']); p.wait_for_timeout(300)
    for row in p.locator('[data-op-row]').all():
        bk = row.locator('[data-op-field=booked]')
        if bk.count(): bk.fill('7'); bk.dispatch_event('change')
        else: f = row.locator('[data-op-field=freeToday]'); f.fill('0'); f.dispatch_event('change')
    p.locator('#opSaveOpening').click(); p.wait_for_timeout(1000)
    check('opening saves (no missing capacity) and daily stories are compliant', p.locator('[data-sst]').count() == 1 and p.locator('[data-sst-check="ok"]').count() == 2)
    p.evaluate("App.openRequestForm()"); p.wait_for_timeout(300); p.locator('#rSpecialty').select_option('Cardiologia'); p.wait_for_timeout(150)
    check('new consultation: choosing a specialty lists the doctors who have it in their file', 'Médico Teste' in p.eval_on_selector_all('#rDoctor option', 'e=>e.map(o=>o.textContent)'))
    p.keyboard.press('Escape')
    check('no page errors', not errs); b.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

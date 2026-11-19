"""Financeiro (regras confirmadas pelo responsável): bónus trimestral por função e antiguidade com vendas do fecho
e do marketplace (código promocional), partes das administrativas e da Administração, regulamento interno,
aprovação e lançamento na conta corrente; o colaborador vê o seu bónus em «Faturas»; faturação por hora de
técnico (escalas); bolsa de horas (só horas autorizadas, pedido e decisão). Dados sintéticos; sem pedidos externos."""
import os, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get('GS_TEST_URL', 'http://127.0.0.1:8765/index.html'); ORIGIN = URL.split('/index.html')[0]
K = 'grupo_saude_v4_demo_2'; OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-finance-bonus')); OUT.mkdir(parents=True, exist_ok=True)
results = []; scope = {}


def check(name, value):
    results.append({**scope, 'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


SEED = """([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoRealUser='u1';s.ceoViewingAs=null;
 const set=(id,prof,adm,extra={})=>{for(const u of [...s.users.filter(x=>x.id===id),s.employees?.[id]].filter(Boolean)){u.profession=prof;u.clinics=['abranfir'];u.hr={...u.hr,admissionDate:adm,weeklySchedule:{1:{startTime:'09:00',endTime:'17:00'},2:{startTime:'09:00',endTime:'17:00'},3:{startTime:'09:00',endTime:'17:00'},4:{startTime:'09:00',endTime:'17:00'},5:{startTime:'09:00',endTime:'17:00'},0:{off:true},6:{off:true}},...extra}}};
 set('test_tec','Fisioterapeuta','2024-05-01',{promoCode:'TEC10'});set('test_med','Auxiliar de fisioterapia','2026-01-05');set('test_adm','Administrativa','2024-01-01');set('test_admin','Administração','2023-01-01');
 s.days={...(s.days||{}),'syn-b1':{date:'2026-10-20',clinic:'abranfir',closed:true,stockClosing:{at:'2026-10-20T19:00:00Z',by:'test_adm',sales:[{employeeId:'test_tec',productId:'laser',quantity:40},{employeeId:'test_med',productId:'laser',quantity:20}]}},'syn-b2':{date:'2026-12-10',clinic:'abranfir',closed:true,stockClosing:{at:'2026-12-10T19:00:00Z',by:'test_adm',sales:[{employeeId:'test_tec',productId:'laser',quantity:10}]}}};
 s.marketplaceSales=[];
 s.timeOccurrences=[...(s.timeOccurrences||[]).filter(x=>!String(x.id).startsWith('syn-ot')),{id:'syn-ot1',user:'test_tec',clinic:'abranfir',type:'Horas extraordinárias',status:'Aprovada',at:'2026-12-03T18:30:00Z',extraMinutes:120,approvedExtraMinutes:120},{id:'syn-ot2',user:'test_tec',clinic:'abranfir',type:'Horas extraordinárias',status:'Pendente',at:'2026-12-04T18:30:00Z',extraMinutes:60}];
 s.leave=[...(s.leave||[]).filter(x=>x.id!=='syn-adm-sick'),{id:'syn-adm-sick',user:'test_adm',type:'Baixa médica',status:'Aprovada',start:'2026-10-01',end:'2026-10-15'}];s.hourBank={uses:[]};s.bonusDecisions={};delete s.bonusRules;
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:u1',theme)}"""


def state(p): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', K)
def txt(loc): return loc.inner_text().replace('\xa0', ' ').replace(' ', ' ')
def as_(p, u):
    p.evaluate("([k,u])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoViewingAs=u==='u1'?null:u;localStorage.setItem(k,JSON.stringify(s))}", [K, u]); p.reload(); p.wait_for_function('window.FinanceBonusV4&&window.FinanceUIV4'); p.wait_for_timeout(300)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox'])
    try:
        for device, w, h in [('mobile', 390, 844), ('desktop', 1366, 900)]:
            for theme in ['light', 'dark']:
                scope = {'device': device, 'theme': theme}
                c = browser.new_context(viewport={'width': w, 'height': h}, is_mobile=device == 'mobile', has_touch=device == 'mobile', service_workers='block')
                c.route('**/*', lambda r: r.continue_() if r.request.url.startswith(ORIGIN + '/') else r.abort())
                p = c.new_page(); p.set_default_timeout(9000); errors = []; p.on('pageerror', lambda e: errors.append(str(e))); p.on('dialog', lambda d: d.accept('SYN dia de muito movimento') if d.type == 'prompt' else d.accept())
                p.clock.install(time=datetime.datetime.fromisoformat('2027-01-05T10:00:00+00:00')); p.goto(URL); p.wait_for_function('window.FinanceBonusV4&&window.GSHourBank')
                p.evaluate(SEED, [K, theme]); p.reload(); p.wait_for_function('window.FinanceBonusV4'); p.wait_for_timeout(300)
                # fecho: quanto o dia acrescenta
                summ = p.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return FinanceBonusV4.closingSummary(s,s.days['syn-b1'])})()").replace('\xa0', ' ')
                check('closing shows what the day adds to each bonus', 'Técnico Teste 40 vendas = 52,00 €' in summ and 'Médico Teste 20 vendas = 16,00 €' in summ)
                # CEO: marketplace, regulamento, aprovação, conta corrente
                p.evaluate("FinanceUIV4.open('invoices')"); p.wait_for_timeout(700); p.select_option('[data-fb-quarter]', '2026-Q4'); p.wait_for_timeout(600)
                adm = p.locator('[data-fb-admin]')
                mk = adm.locator('[data-fb-mk]'); mk.evaluate("f=>f.closest('details').open=true"); mk.locator('[name=date]').fill('2026-11-15'); mk.locator('[name=code]').fill('tec10'); mk.locator('[name=quantity]').fill('5'); mk.locator('[name=orderRef]').fill('W-100'); mk.locator('button').click(); p.wait_for_timeout(600)
                adm = p.locator('[data-fb-admin]')
                row = lambda pid: adm.locator(f'[data-fb-person="{pid}"]')
                check('technician: 55 sales (5 from the site) × 1,30 € (1 year+ physiotherapist) = 71,50 €', '55' in txt(row('test_tec')) and '71,50 €' in txt(row('test_tec')))
                check('auxiliar: 20 × 0,80 € = 16,00 €', '16,00 €' in txt(row('test_med')))
                check('administrativa: 75 sales × 0,25 € ÷ 1 = 18,75 €', '18,75 €' in txt(row('test_adm')) and 'Abranfir' in txt(row('test_adm')))
                check('Administração: 75 × 0,50 € ÷ members = 37,50 € (CEO excluded)', '37,50 €' in txt(row('test_admin')) and adm.locator('[data-fb-person="u1"]').count() == 0)
                p.locator('[data-fb-approve]').click(); p.wait_for_timeout(500)
                check('cannot approve before confirming the internal regulation', state(p).get('bonusDecisions', {}).get('2026-Q4', {}).get('__approvedAt') is None)
                for pid in ['test_tec', 'test_med', 'test_admin']:
                    p.select_option(f'[data-fb-reg="{pid}"]', '1'); p.wait_for_timeout(350)
                check('administrativa with 15 sick days waits for the CEO', 'aguarda decisão do CEO' in txt(p.locator('[data-fb-person="test_adm"]')) and p.locator('[data-fb-ceo="test_adm"]').count() == 1)
                p.locator('[data-fb-approve]').click(); p.wait_for_timeout(400)
                check('approval blocked until the CEO decides', state(p).get('bonusDecisions', {}).get('2026-Q4', {}).get('__approvedAt') is None)
                p.select_option('[data-fb-ceo="test_adm"]', '1'); p.wait_for_timeout(400)
                check('CEO «Mantém» restores the share', '18,75 €' in txt(p.locator('[data-fb-person="test_adm"]')) and 'CEO' in txt(p.locator('[data-fb-person="test_adm"]')))
                p.select_option('[data-fb-reg="test_adm"]', '0'); p.wait_for_timeout(350)
                check('«Não cumpre» the regulation loses the share', '0,00 €' in txt(p.locator('[data-fb-person="test_adm"]')))
                p.locator('[data-fb-approve]').click(); p.wait_for_timeout(600)
                check('approved quarter is locked', state(p)['bonusDecisions']['2026-Q4'].get('__approvedAt') and p.locator('[data-fb-reg]').count() == 0)
                p.locator('[data-fb-post-all]').click(); p.wait_for_timeout(1200)
                ents = [x for x in state(p)['financeV2']['entries'] if x['type'] == 'Bónus' and x.get('quarter') == '2026-Q4']
                check('«Lançar todos» puts each approved bonus in the current account', sorted((x['employeeId'], x['valueCents']) for x in ents) == [('test_admin', 3750), ('test_med', 1600), ('test_tec', 7150)])
                # técnico vê o seu bónus em Faturas
                as_(p, 'test_tec'); p.evaluate("FinanceUIV4.open('invoices')"); p.wait_for_timeout(700)
                me = p.locator('[data-fb-mine]')
                check('technician sees own bonus in «Faturas» (quarter in progress + approved previous one)', me.count() == 1 and '4.º trimestre de 2026: aprovado · 71,50 €' in txt(me) and p.locator('[data-fb-admin]').count() == 0)
                # bolsa de horas
                p.evaluate("App.showView('clock')"); p.wait_for_timeout(700); hb = p.locator('[data-hb]')
                check('hour bank counts only authorised overtime (2h00, pending 1h not counted)', hb.locator('[data-hb-balance]').inner_text() == '2h00')
                f = hb.locator('[data-hb-form]'); f.locator('[name=date]').fill('2027-01-15'); f.locator('[name=hours]').fill('1'); f.locator('[name=mins]').select_option('30'); f.locator('[name=note]').fill('SYN sair mais cedo'); f.locator('button').click(); p.wait_for_timeout(500)
                check('request reserves the hours', state(p)['hourBank']['uses'][0]['minutes'] == 90 and 'pedidas' in p.locator('[data-hb]').inner_text())
                as_(p, 'u1'); p.evaluate("App.showView('today')"); p.wait_for_timeout(400)
                check('«Hoje» shows hour-bank requests to decide', '1 pedido de bolsa de horas por decidir' in p.locator('.today-need').inner_text())
                p.locator('.today-need .today-item', has_text='bolsa de horas').click(); p.wait_for_timeout(700)
                p.locator('[data-hb-ok]').first.click(); p.wait_for_timeout(500)
                check('approved use consumes the balance', p.evaluate("GSHourBank.balance(JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2')),'test_tec').balanceMinutes") == 30)
                # Faturação × horas de técnicos
                ids = p.evaluate("""async()=>{const r=[];for(const [m,end,g] of [['2026-10','2026-10-31','18000'],['2026-11','2026-11-30','13000']]){r.push(await FinanceDemoV4.call('turnover-save',{clinicId:'abranfir',start:m+'-01',end,gross:g,credit:'0',debit:'0',requestId:'syn_turn_'+m}))}return r.length}""")
                p.evaluate("FinanceUIV4.open('turnover')"); p.wait_for_timeout(800); pr = p.locator('[data-fb-productivity]')
                check('turnover per technician scheduled hour shown per clinic and month', pr.count() == 1 and pr.locator('[data-fb-prod-row]').count() >= 2 and '€' in txt(pr))
                check('a drop of more than 15 % is flagged', pr.locator('.fb-alert').count() >= 1 and 'queda' in txt(pr))
                check('no page errors', not errors); check('no horizontal overflow', p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
                p.screenshot(path=str(OUT / f'finance-bonus-{device}-{theme}.png')); c.close()
    finally:
        (OUT / 'finance-bonus-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)); browser.close()
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

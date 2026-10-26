"""Functional finance audit in isolated Chromium; not a physical Android validation."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parent.parent
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/finance-reorganization'));OUT.mkdir(parents=True,exist_ok=True)
results=[]
def check(label,ok):
 results.append({**scope,'case':label,'passed':bool(ok)});assert ok,label
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
 for actor in ['test_call','test_med','test_tec','test_adm','test_admin','u1']:
  for device,w,h in [('tablet',1280,800),('desktop',1440,1000),('mobile',390,844)]:
   for theme in ['light','dark']:
    scope=dict(actor=actor,device=device,theme=theme);manager=actor in ['u1','test_admin']
    ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',service_workers='block')
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
    page=ctx.new_page();page.set_default_timeout(10000);errors=[];dialogs=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
    page.goto(URL);page.wait_for_function('window.WorkspaceShellV4&&window.FinanceUIV4');page.wait_for_timeout(1300)
    page.evaluate((ROOT/'tests/fixtures/synthetic-executive-state.js').read_text(),[K,actor,theme]);page.reload();page.wait_for_timeout(1400)
    check('turnover direct access denied to four profiles',manager or page.evaluate("async()=>{try{await FinanceUIV4.call('turnover-list');return false}catch{return true}}"))
    for section,title in [('invoices','Faturas'),('payslips','Recibos de Vencimento'),('account','Conta corrente')]+([('cash','Fecho de Caixa'),('turnover','Faturação')] if manager else []):
     page.evaluate('(s)=>FinanceUIV4.open(s)',section);expect(page.locator('#financeContent h2').first).to_contain_text(title)
     check(section+' accessible and no duplicate tab navigation',page.locator('.finance-tabs').count()==0)
     if section!='cash':
      search=page.locator('#financeSearch');search.fill('ZZZ-NO-SYNTHETIC-MATCH');check(section+' no results',page.locator('[data-fin-row]:visible').count()==0);search.fill('')
     if manager and section in ['invoices','payslips','turnover']:
      query=page.locator('#financeScope');check(section+' all clinics filter',query.locator('[name=clinicId] option').first.text_content()=='Todas as clínicas');clinic=query.locator('[name=clinicId] option').nth(1).get_attribute('value');query.locator('[name=clinicId]').select_option(clinic);query.locator('[type=submit]').click();expect(page.locator('#financeScope [name=clinicId]')).to_have_value(clinic);page.locator('#financeScope [name=clinicId]').select_option('');page.locator('#financeScope [type=submit]').click()
     if section=='turnover':
      page.locator('[data-fin-action=turnover-new]').click();form=page.locator('#financeDialog form');form.locator('[name=start]').fill('2026-10-01');form.locator('[name=end]').fill('2026-10-31');form.locator('[name=gross]').fill('1000');form.locator('[name=credit]').fill('50');form.locator('[name=debit]').fill('10');form.locator('[type=submit]').click();expect(page.locator('#financeDialog')).not_to_be_visible();expect(page.locator('[data-fin-row]')).to_have_count(1);check('turnover net without cash/ledger mixing','960,00' in page.locator('#financeContent').inner_text() or '960.00' in page.locator('#financeContent').inner_text());page.locator('[data-fin-action=turnover-history]').click();expect(page.locator('#financeDialog')).to_contain_text('Registar totais');page.locator('#financeDialog [aria-label=Fechar]').click();page.locator('[data-fin-action=turnover-edit]').click();form=page.locator('#financeDialog form');form.locator('[name=gross]').fill('1100');form.locator('[name=reason]').fill('Correção sintética validada');form.locator('[type=submit]').click();expect(page.locator('#financeDialog')).not_to_be_visible();check('turnover immutable audit preserved',page.evaluate("(k)=>JSON.parse(localStorage.getItem(k)).financeV2.turnover[0].history.length===2",K))
     if section=='cash':
      page.locator('[data-fin-action=cash-new]').click();check('cash synthetic acknowledgement checkbox removed',page.locator('#cashForm [name=syntheticConfirmed]').count()==0);expect(page.locator('#cashForm')).to_contain_text('Não carregue comprovativos reais');page.locator('#financeDialog [aria-label=Fechar]').click()
     if manager and actor=='u1':page.screenshot(path=str(OUT/f'{section}-{device}-{theme}.png'),full_page=True)
     check(section+' no page overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
    check('no JS exceptions',not errors);check('no unexpected dialogs',not dialogs);ctx.close()
 browser.close()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'scope':'Six profiles, three viewports, two themes; actual Chromium with synthetic local persistence. Not physical Android or central persistence.'}))

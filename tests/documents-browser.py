"""Real Chromium UI workflow on localhost and the exact Cloudflare preview. Fictional files only."""
from pathlib import Path
from datetime import date
import os
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get('GS_TEST_URL', (ROOT / 'index.html').as_uri())
KEY = 'grupo_saude_v4_demo_2'
PDF = b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF'
TODAY = date.today().isoformat()

def switch(page, actor):
    page.evaluate('''([key,id])=>{const s=JSON.parse(localStorage.getItem(key));s.currentUser=id;s.ceoViewingAs=id==='u1'?null:id;localStorage.setItem(key,JSON.stringify(s))}''', [KEY, actor])
    page.reload()
    page.wait_for_timeout(700)

def invoices(page):
    page.locator('#shortcut_invoices').click()
    expect(page.locator('#financeContent h2').get_by_text('Faturas', exact=True)).to_be_visible()

def send_invoice(page, number, amount, content):
    page.locator('[data-fin-action="invoice-new"]').click()
    f = page.locator('#financeDialog form')
    f.locator('[name=number]').fill(number)
    f.locator('[name=value]').fill(amount)
    f.locator('[name=document]').set_input_files({'name':number+'.pdf','mimeType':'application/pdf','buffer':content})
    f.locator('[type=submit]').click()
    page.wait_for_timeout(250)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('GS_CHROMIUM') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else p.chromium.executable_path), headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1280,'height':900})
    page = context.new_page()
    errors, dialogs = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('dialog', lambda d: (dialogs.append(d.message),d.accept()))
    page.goto(URL)
    page.wait_for_timeout(700)
    switch(page, 'test_med')
    invoices(page)
    send_invoice(page,'DOC-ORIGINAL','100',PDF+b'original')
    expect(page.locator('#financeContent').get_by_text('DOC-ORIGINAL', exact=True)).to_be_visible()
    original = page.evaluate('''key=>JSON.parse(localStorage.getItem(key)).financeV2.invoices[0]''', KEY)
    # Equal bytes are rejected even with a different number.
    send_invoice(page,'DOC-DUPLICATE','100',PDF+b'original')
    assert any('exatamente igual' in m for m in dialogs), dialogs
    assert page.evaluate('''key=>JSON.parse(localStorage.getItem(key)).financeV2.invoices.length''',KEY)==1
    page.locator('#financeDialog .modal-head button').click()
    switch(page,'u1')
    invoices(page)
    page.locator('[data-fin-action="invoice-approve"]').click()
    page.locator('#financeDialog [type=submit]').click()
    page.wait_for_timeout(250)
    # Record a payment through the real account UI, before replacing the invoice.
    page.locator('[data-fin-action="account"]').click()
    form = page.locator('#financeQuery')
    form.locator('[name=employeeId]').select_option('test_med')
    form.locator('[name=start]').fill('2000-01-01')
    form.locator('[name=end]').fill('2100-01-01')
    form.locator('[type=submit]').click()
    page.wait_for_timeout(250)
    page.locator('[data-fin-action="payment"]').click()
    page.locator('#financeDialog [type=submit]').click()
    page.wait_for_timeout(250)
    switch(page,'test_med')
    invoices(page)
    page.locator('[data-fin-action="invoice-replace"]').click()
    f = page.locator('#financeDialog form')
    f.locator('[name=value]').fill('120')
    f.locator('[name=document]').set_input_files({'name':'corrected.pdf','mimeType':'application/pdf','buffer':PDF+b'corrected'})
    f.locator('[type=submit]').click()
    expect(page.locator('#financeDialog')).to_contain_text('Este documento é novo ou pretende substituir um documento anterior?')
    assert page.locator('#financeDialog [name=replacementOf]').input_value()==original['id']
    page.locator('#financeDialog [name=replacementReason]').fill('Correção de valor com documento novo')
    page.locator('#financeDialog [type=submit]').click()
    page.wait_for_timeout(250)
    assert page.evaluate('''([key,id])=>JSON.parse(localStorage.getItem(key)).financeV2.invoices.find(x=>x.id===id).status''',[KEY,original['id']])=='Validada'
    switch(page,'test_admin')
    invoices(page)
    page.locator('[data-fin-action="invoice-approve"]').click()
    page.locator('#financeDialog [name=reason]').fill('Documento revisto pela Administração')
    page.locator('#financeDialog [type=submit]').click()
    page.wait_for_timeout(250)
    expect(page.locator('#financeContent')).to_contain_text('Substituído')
    page.locator('[data-fin-action="manage"]').click()
    page.locator('[data-fin-action="regularization-list"]').click()
    expect(page.locator('#financeDialog')).to_contain_text('Pendente')
    page.locator('[data-fin-action="regularization-approve"]').click()
    page.locator('#financeDialog [name=reason]').fill('Associar o pagamento preservado ao documento corrigido')
    page.locator('#financeDialog [type=submit]').click()
    page.wait_for_timeout(250)
    state = page.evaluate('''key=>JSON.parse(localStorage.getItem(key)).financeV2''',KEY)
    assert state['regularizations'][0]['status']=='Aprovada'
    old_entry = next(x for x in state['entries'] if x.get('sourceInvoiceId')==original['id'])
    assert old_entry['valueCents']==0 and old_entry['originalValueCents']==10000
    payments = [x for x in state['entries'] if x['type']=='Pagamento']
    assert len(payments)==1 and payments[0]['valueCents']==-10000 and payments[0]['status']=='Pago'
    switch(page,'test_med')
    result=page.evaluate('''async()=>FinanceUIV4.call('statement',{start:'2000-01-01',end:'2100-01-01'})''')
    assert result['finalCents']==2000
    assert page.evaluate('''async id=>!!(await FinanceUIV4.call('document',{id})).dataUrl''',original['documentId'])
    # Verify permission denial in every non-management profile and four editable email functions.
    for actor in ['test_adm','test_call','test_med','test_tec']:
        switch(page,actor)
        assert page.evaluate('''async()=>{try{await FinanceUIV4.call('regularization-list');return false}catch(e){return e.message.includes('exclusiva')}}''')
        assert page.evaluate('''()=>{try{CommunicationsV4.list();return false}catch(e){return e.message.includes('autorização')}}''')
    switch(page,'u1')
    page.evaluate('''()=>CommunicationsV4.emails()''')
    expect(page.locator('#modal [data-email-save]')).to_have_count(4)
    expect(page.locator('#modal [data-email-test]')).to_have_count(4)
    page.locator('#emailAddress_cv').fill('rh-alterado@example.pt')
    page.locator('[data-email-save="cv"]').click()
    page.evaluate('''()=>CommunicationsV4.emails()''')
    expect(page.locator('#emailAddress_cv')).to_have_value('rh-alterado@example.pt')
    # No external provider is invoked during this test.
    page.route('**/api/finance?action=email-test',lambda route:route.fulfill(status=503,content_type='application/json',body='{"error":"Teste não configurado"}'))
    page.locator('[data-email-test="cv"]').click()
    expect(page.locator('#modal')).to_contain_text('Não configurada')
    page.locator('#modal').evaluate('(d)=>d.close()')
    page.evaluate("()=>FinanceUIV4.open('manage')")
    page.locator('[data-fin-action="archive-list"]').click()
    expect(page.locator('#financeDialog')).to_contain_text('sem apagar ficheiros')
    page.set_viewport_size({'width':390,'height':844})
    assert page.locator('#financeDialog').bounding_box()['width']<=390
    assert not errors, errors
    print('PASS browser documents: exact duplicate, explicit paid replacement, approval, regularization, preserved PDF/history/balance, six-role guards, four editable email functions, connection failure, responsive archive')
    context.close()
    browser.close()

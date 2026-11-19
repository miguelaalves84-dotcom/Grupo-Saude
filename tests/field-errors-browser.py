"""Campos em falta/inválidos ficam a vermelho, a secção abre-se e o ecrã leva ao campo — em computador, tablet e telemóvel."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/field-errors'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
def flagged(p):return p.evaluate('[...document.querySelectorAll(".gs-field-error")].map(e=>e.id||e.name||e.className)')
def in_view(p,sel):return p.evaluate('s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}',sel)
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for device,w,h in [('desktop',1366,900),('tablet',1280,800),('mobile',390,844)]:
   scope={'device':device};c=b.new_context(viewport={'width':w,'height':h},has_touch=device!='desktop',is_mobile=device!='desktop',service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);msgs=[];p.on('dialog',lambda d:(msgs.append(d.message),d.accept()));p.goto(URL);p.wait_for_function('window.HRMasterV4&&window.GSFieldErrors');p.wait_for_timeout(300)
   p.evaluate('''k=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser='u1';s.ceoViewingAs=null;localStorage.setItem(k,JSON.stringify(s))}''',K);p.reload();p.wait_for_function('window.HRMasterV4&&window.GSFieldErrors');p.wait_for_timeout(300)
   # 1. Percentagens sem início de vigência (o caso do ecrã do utilizador)
   p.evaluate('HRMasterV4.open("test_med")');p.locator('#hrTechniquePercentage').evaluate('e=>{e.value="30"}');p.locator('#hrTreatmentPercentage').evaluate('e=>{e.value="20"}');p.locator('#hrPercentageFrom').evaluate('e=>{e.value=""}')
   p.locator('[data-gs-action="HRMasterV4.save"]').first.click();p.wait_for_timeout(1300)
   check('clear message names the missing date',any('Início da vigência' in m for m in msgs))
   print('FLAGGED',flagged(p),msgs);check('only the missing date is red',flagged(p)==['hrPercentageFrom'])
   check('closed section opened and field brought into view',p.locator('#hrPercentageFrom').is_visible() and in_view(p,'#hrPercentageFrom'))
   check('note under the field',p.locator('.gs-field-error-note').first.inner_text().strip().startswith('Percentagens'))
   check('field is focused',p.evaluate('document.activeElement?.id')=='hrPercentageFrom')
   p.locator('#hrPercentageFrom').fill('2026-11-01');check('red disappears when corrected',flagged(p)==[] and p.locator('.gs-field-error-note').count()==0)
   p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');msgs.clear()
   # 2. ERS «Sim» sem data/referência/comprovativo
   p.evaluate('HRMasterV4.open("test_med")');p.locator('#hrERS').evaluate('e=>{e.value="yes";e.dispatchEvent(new Event("change",{bubbles:true}))}');p.locator('[data-gs-action="HRMasterV4.save"]').first.click();p.wait_for_timeout(1300)
   f=flagged(p);check('ERS: date and reference red',set(['hrERSDate','hrERSReference'])<=set(f) and 'hrName' not in f)
   print('ERSF',f);check('ERS field in view',in_view(p,'#'+f[0]))
   if device=='tablet':p.screenshot(path=str(OUT/'ers-red.png'))
   p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');msgs.clear()
   # 3. Nome/email em falta numa ficha nova
   p.evaluate('HRMasterV4.open("test_med")');p.locator('#hrName').evaluate('e=>{e.value=""}');p.locator('[data-gs-action="HRMasterV4.save"]').first.click();p.wait_for_timeout(1300)
   check('missing name red',flagged(p)[:1]==['hrName'])
   p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())');msgs.clear()
   # 4. Avisos de permissão não pintam nada
   p.evaluate('()=>{GSFieldErrors.clearAll();document.body.click();alert("Apenas CEO e Administração podem editar colaboradores.")}');check('permission notices never flag fields',flagged(p)==[])
   check('no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
   c.close()
 finally:
  (OUT/'field-errors-results.json').write_text(json.dumps(results,indent=2));b.close()

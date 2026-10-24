"""Native Chromium editing and IME regressions; not certification of Gboard/Android hardware."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/text-editing'));OUT.mkdir(parents=True,exist_ok=True)
results=[];fields=[];scope={}
def check(name,ok):
 results.append({**scope,'case':name,'passed':bool(ok)});assert ok,results[-1]
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',K)
def close(p):p.evaluate('document.querySelectorAll("dialog[open]").forEach(d=>d.close())')
def exercise(p,selector,cdp,ime=True):
 label=selector if isinstance(selector,str) else str(selector)
 f=p.locator(selector).first if isinstance(selector,str) else selector
 selector=label
 if not f.count() or not f.is_visible():return
 metadata=f.evaluate('''e=>{const label=e.labels?.[0]||e.closest('label'),copy=label?.cloneNode(true);copy?.querySelectorAll('input,textarea,select').forEach(x=>x.remove());return{id:e.id,name:e.name,type:e.type,tag:e.tagName,maxLength:e.maxLength,pattern:e.pattern||'',label:copy?.textContent.trim()||e.getAttribute('aria-label')||e.placeholder||'',readonly:e.readOnly,disabled:e.disabled}}''');entry={**scope,**metadata,'automated':'Em execução','physicalAndroid':'Pendente: Gboard/Samsung Keyboard, sugestões, seleção e colagem por toque'};fields.append(entry)
 if not f.is_editable():entry['automated']='Não editável — proteção preservada';check(selector+' read-only remains protected',True);return
 original=f.input_value();kind=metadata['type'];limit=metadata.get('maxLength',-1);entry['middleCaretTest']=limit<0 or limit>=16;f.focus();p.evaluate('(e)=>window.__writingNode=e',f.element_handle())
 if kind=='number':
  f.fill('12.34');f.press('End');f.press_sequentially('5');check(selector+' decimal editing',f.input_value()=='12.345');f.press('Backspace');check(selector+' decimal deletion',f.input_value()=='12.34');f.fill(original);entry['automated']='Parcial: edição numérica nativa e apagar; teclado decimal físico pendente';return
 if kind=='email':sample='joao.sao@example.invalid'
 elif kind=='url':sample='https://example.invalid/ação'
 else:sample='João ação São'
 if limit>0:sample=sample[:limit]
 f.fill('');f.press_sequentially(sample);check(selector+' sequential Portuguese typing exact',f.input_value()==sample)
 f.press('Control+A');f.press('Control+C');check(selector+' actual clipboard copy exact',p.evaluate('navigator.clipboard.readText()')==sample)
 check(selector+' original native editor connected',p.evaluate('window.__writingNode===document.activeElement&&window.__writingNode.isConnected'))
 if kind in ['text','search','tel','url','textarea','password'] and (limit<0 or limit>=16):
  f.fill('Lisboa Porto');f.evaluate('(e)=>e.setSelectionRange(6,6)');f.press_sequentially(' São');check(selector+' middle insertion exact',f.input_value()=='Lisboa São Porto');check(selector+' middle caret preserved',f.evaluate('(e)=>e.selectionStart===10&&e.selectionEnd===10'))
  f.evaluate('(e)=>e.setSelectionRange(7,10)');f.press('Backspace');check(selector+' selection deletion exact',f.input_value()=='Lisboa  Porto')
 paste='joao.sao@example.invalid' if kind=='email' else 'https://example.invalid/ação' if kind=='url' else "SYN São João — ação & d'Água"
 if kind=='textarea':paste+='\nSegunda linha: observações às três.'
 if limit>0:paste=paste[:limit]
 p.evaluate('(v)=>navigator.clipboard.writeText(v)',paste);f.press('Control+A');f.press('Control+V');check(selector+' actual clipboard paste exact',f.input_value()==paste)
 if ime:
  first,second,committed=('a','ã','ã') if 0<limit<4 else ('Jo','Joã','João')
  f.fill('');f.focus();p.evaluate('(e)=>window.__imeNode=e',f.element_handle());cdp.send('Input.imeSetComposition',{'text':first,'selectionStart':len(first),'selectionEnd':len(first)});cdp.send('Input.imeSetComposition',{'text':second,'selectionStart':len(second),'selectionEnd':len(second)});check(selector+' composition keeps same native editor',p.evaluate('window.__imeNode.isConnected&&window.__imeNode===document.activeElement'))
  cdp.send('Input.insertText',{'text':committed});expect(f).to_have_value(committed);check(selector+' native composition commit exact',f.input_value()==committed)
 f.fill(original);entry['automated']='Passou nos cenários automáticos executados'

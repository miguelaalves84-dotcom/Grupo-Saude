"""Texto escrito por utilizadores nunca corre como código: injeta HTML em todos os campos de texto e percorre todas as páginas, fases e fichas."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2'
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/injection'));OUT.mkdir(parents=True,exist_ok=True)
KEYS=['name','notes','note','patientRef','title','text','description','reason','insurer','address','subject','comment','observations','obs','label','message','body','role','function','surname','fullName','displayName','patient','supplier','product','content','caption','summary','detail','details','motive','author']
INJECT='''([k,keys])=>{const s=JSON.parse(localStorage.getItem(k));let n=0;const P='<img src=x data-xss=1 onerror="window.__x=(window.__x||0)+1">';
const walk=(o,d)=>{if(!o||typeof o!=='object'||d>8)return;for(const key of Object.keys(o)){const v=o[key];if(typeof v==='string'&&keys.includes(key)&&v.length<200&&!v.includes('data-xss')){o[key]=v+P;n++}else walk(v,d+1)}};
for(const key of Object.keys(s)){if(['currentUser','opClinic','opDate','opPhase'].includes(key))continue;walk(s[key],0)}
localStorage.setItem(k,JSON.stringify(s));return n}'''
NAV='i=>{const e=document.querySelectorAll("#nav button, #nav a")[i];if(!e)return false;e.closest("details")&&(e.closest("details").open=true);e.click();return true}'
OPEN='''()=>[...document.querySelectorAll("main button, main tr[data-id], main .card[data-id]")].filter(e=>e.offsetParent!==null).filter(e=>/^(Abrir|Ver|Editar|Ficha|Detalhe|Perfil)/i.test((e.innerText||'').trim())||e.matches('tr[data-id],.card[data-id]'))'''
cases=[]
def check(n,v):cases.append({'case':n,'passed':bool(v)});print(json.dumps(cases[-1]),flush=True);assert v,n
def leaked(p):
 c=p.evaluate('()=>document.querySelectorAll("img[data-xss]").length');p.evaluate('()=>document.querySelectorAll("img[data-xss]").forEach(e=>e.remove())');return c
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for prof in ['u1','test_adm']:
   ctx=b.new_context(viewport={'width':1440,'height':900});ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.dismiss())
   p.goto(URL);p.wait_for_function('window.App&&window.CEOReservedAreaV4');p.wait_for_timeout(1500)
   n=p.evaluate(INJECT,[K,KEYS]);check(f'{prof}: payload injected into many text fields',n>50)
   p.reload();p.wait_for_function('window.App&&window.CEOReservedAreaV4');p.evaluate('a=>CEOReservedAreaV4.select(a)',prof);p.wait_for_timeout(500)
   bad=[]
   for v in p.evaluate('()=>[...new Set([...document.querySelectorAll("[data-view]")].map(b=>b.dataset.view))]'):
    p.evaluate('v=>App.showView(v)',v);p.wait_for_timeout(150)
    for ph in (['open','live','close'] if v=='operation' else [None]):
     if ph:p.evaluate('x=>App.setPhase(x)',ph);p.wait_for_timeout(150)
     if leaked(p):bad.append(v+(':'+ph if ph else ''))
   for i in range(60):
    if not p.evaluate(NAV,i):break
    p.wait_for_timeout(150)
    if not p.evaluate('()=>typeof App==="object"'):
     p.goto(URL);p.wait_for_function('window.App&&window.CEOReservedAreaV4');p.evaluate('a=>CEOReservedAreaV4.select(a)',prof);p.wait_for_timeout(300);continue
    if leaked(p):bad.append('nav'+str(i))
    for j in range(min(p.evaluate('('+OPEN+')().length'),3)):
     p.evaluate('j=>{const e=('+OPEN+')()[j];e&&e.click()}',j);p.wait_for_timeout(150)
     if leaked(p):bad.append(f'nav{i}-detail{j}')
     p.evaluate('()=>document.querySelectorAll("dialog[open]").forEach(d=>d.close())');p.evaluate(NAV,i);p.wait_for_timeout(100)
   check(f'{prof}: no injected markup rendered as HTML anywhere {bad}',not bad)
   check(f'{prof}: no injected script executed',p.evaluate('window.__x||0')==0)
   check(f'{prof}: injected text still visible as plain text',p.evaluate("()=>{App.showView('clinics');return document.body.innerText.includes('data-xss')}"))
   check(f'{prof}: no runtime errors',not errors);ctx.close()
 finally:
  b.close();(OUT/'injection-results.json').write_text(json.dumps({'passed':sum(x['passed'] for x in cases),'failed':sum(not x['passed'] for x in cases),'cases':cases},indent=2))

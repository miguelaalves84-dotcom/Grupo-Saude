"""Acessibilidade automática (axe-core 4.10.2, WCAG 2 A/AA): todas as páginas, temas claro e escuro, computador e telemóvel."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/accessibility'));OUT.mkdir(parents=True,exist_ok=True)
AXE=(Path(__file__).parent/'fixtures/axe-core-4.10.2.min.js').read_text();cases=[]
def check(n,v,detail=None):cases.append({'case':n,'passed':bool(v),'detail':detail});print(json.dumps(cases[-1],ensure_ascii=False),flush=True);assert v,n
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for dev,w,h in [('desktop',1440,900),('mobile',390,844)]:
   for theme in ['light','dark']:
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=dev=='mobile',has_touch=dev=='mobile');ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=ctx.new_page()
    p.goto(URL);p.wait_for_function('window.App&&window.CEOReservedAreaV4');p.wait_for_timeout(800);p.evaluate("CEOReservedAreaV4.select('u1')");p.evaluate('t=>document.documentElement.dataset.theme=t',theme);p.add_script_tag(content=AXE)
    bad={}
    for v in p.evaluate('()=>[...new Set([...document.querySelectorAll("[data-view]")].map(b=>b.dataset.view))]'):
     p.evaluate('v=>App.showView(v)',v);p.wait_for_timeout(200)
     r=p.evaluate("async()=>{const r=await axe.run(document.querySelector('main')||document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return r.violations.filter(x=>['serious','critical'].includes(x.impact)).map(x=>x.id+' '+x.nodes[0].target.join(' '))}")
     if r:bad[v]=r
    check(f'{dev}/{theme}: no serious or critical WCAG A/AA violations',not bad,bad or None);ctx.close()
 finally:b.close();(OUT/'accessibility-results.json').write_text(json.dumps(cases,indent=2,ensure_ascii=False))

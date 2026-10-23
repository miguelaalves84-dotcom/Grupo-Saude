"""Read-only paint/scroll-clip review of the extra accordion findings; synthetic only."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-audit-expanded'));OUT.mkdir(parents=True,exist_ok=True)
BASE=json.loads(Path(__file__).parents[1].joinpath('docs/AUDITORIA-GERAL-VISUAIS-102-20261023.json').read_text());contexts={}
for r in BASE['records']:
 s=r['scope'];key=(s['actor'],s['width'],s['height'],s['theme']);contexts.setdefault(key,set()).update([r['before']['a']['section'],r['before']['b']['section']])
SCRIPT=r'''()=>{
const root=document.querySelector('dialog[open]'),rendered=e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return e.checkVisibility({checkVisibilityCSS:true,contentVisibilityAuto:true})},info=e=>({tag:e.tagName,id:e.id,text:(e.innerText||e.getAttribute('aria-label')||'').slice(0,120)}),rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},clip=e=>{const r=rect(e);r.left=Math.max(0,r.left);r.top=Math.max(0,r.top);r.right=Math.min(innerWidth,r.right);r.bottom=Math.min(innerHeight,r.bottom);const ancestors=[];for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowX)){r.left=Math.max(r.left,b.left);r.right=Math.min(r.right,b.right);ancestors.push({tag:p.tagName,id:p.id,axis:'x',overflow:s.overflowX})}if(/auto|scroll|hidden|clip/.test(s.overflowY)){r.top=Math.max(r.top,b.top);r.bottom=Math.min(r.bottom,b.bottom);ancestors.push({tag:p.tagName,id:p.id,axis:'y',overflow:s.overflowY})}}return{...r,visible:r.right>r.left&&r.bottom>r.top,ancestors}};
const es=[...root.querySelectorAll('button,input,select,textarea')].filter(rendered),out=[];
for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++){const a=es[i],b=es[j];if(a.contains(b)||b.contains(a))continue;const x=rect(a),y=rect(b),w=Math.min(x.right,y.right)-Math.max(x.left,y.left),h=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);if(w<=5||h<=5||w*h/Math.min(x.width*x.height,y.width*y.height)<=.25)continue;const ca=clip(a),cb=clip(b),cw=Math.min(ca.right,cb.right)-Math.max(ca.left,cb.left),ch=Math.min(ca.bottom,cb.bottom)-Math.max(ca.top,cb.top),visible=ca.visible&&cb.visible&&cw>5&&ch>5;out.push({a:info(a),b:info(b),rawRects:{a:x,b:y},clippedRects:{a:ca,b:cb},classification:visible?'FALHA_REAL':'FALSO_POSITIVO_FORA_DA_ZONA_VISIVEL',paintIntersection:visible,reason:visible?'Interseção mantém-se na área efetivamente visível':'A interseção geométrica fica fora do viewport ou da área recortada por scroll/overflow do modal'})}return out}'''
rows=[];sections=[];errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for (actor,w,h,theme),indices in contexts.items():
   c=b.new_context(viewport={'width':w,'height':h},has_touch=w<1000,is_mobile=w<1000,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(10000);p.on('dialog',lambda d:d.dismiss());p.goto(URL);p.wait_for_function('window.HRMasterV4&&window.GSDemoClinicAssociations')
   p.evaluate('''([k,a,t])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.candidates=[];GSDemoClinicAssociations.repair(s);for(const u of [...s.users,...Object.values(s.employees||{})]){u.name='SYN '+u.id;u.email=u.id+'@example.invalid'}localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('gs-v4-theme:'+a,t)}''',[K,actor,theme]);p.reload();p.wait_for_function('window.HRMasterV4&&window.WorkspaceShellV4');p.evaluate('App.showView("myhr")');p.evaluate('(id)=>HRMasterV4.open(id,"dados")',actor)
   for index in sorted(n for n in indices if n>=0):
    d=p.locator('#modalBody .hr-subject').nth(index)
    if not d.evaluate('(e)=>e.open'):d.locator('summary').first.click()
    p.wait_for_timeout(20);items=p.evaluate(SCRIPT);shot=f'paint-{actor}-{w}-{theme}-section-{index}.png';p.screenshot(path=str(OUT/shot),full_page=True);sections.append({'actor':actor,'width':w,'height':h,'theme':theme,'section':index,'capture':shot,'potential':len(items)})
    for item in items:
     r={'id':f'E{len(rows)+1:03d}','actor':actor,'width':w,'height':h,'theme':theme,'section':index,'capture':shot,**item};rows.append(r);print('EXPANDED_FINDING '+json.dumps(r,ensure_ascii=False),flush=True)
   c.close()
 finally:
  b.close();report={'originalAuditAdditionalFindings':6,'replayFindings':len(rows),'contexts':len(contexts),'sections':sections,'findings':rows,'real':sum(r['paintIntersection'] for r in rows),'clipped':sum(not r['paintIntersection'] for r in rows),'notice':'Revisão geométrica de pintura/recorte, não certificação visual humana nem comparação universal por pixels.'};(OUT/'expanded-paint-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('EXPANDED_SUMMARY '+json.dumps({k:v for k,v in report.items() if k not in ['sections','findings']}),flush=True)
assert len(sections)==60,'Replay must review all 60 affected sections'
assert len(rows)==0,'No control may intersect the close header or another control after the modal scroll correction'

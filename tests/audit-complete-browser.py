"""Audit instrumentation only. Executes the existing six-profile traversal unchanged.
Reviews each legacy visual alert and opens affected accordion sections through real controls.
No product code, records, production services, or permissions are changed.
"""
import os,json,runpy
from pathlib import Path
import audit_visual
OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/gs-audit-final'));OUT.mkdir(parents=True,exist_ok=True)
original=audit_visual.inspect
records=[];section_checks=[];disclosure_checks=[];new_failures=[]
PROOF=r'''({a,b})=>{
const root=document.querySelector('dialog[open]')||document.querySelector('.view.active');
const locate=m=>{const es=[...root.querySelectorAll(m.selector.replace(/\.$/,''))];return es.find(e=>e.name&&e.name===m.text)||es.find(e=>(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,110)===m.text)||es[0]};
const details=[...root.querySelectorAll('.hr-subject')],rendered=e=>{if(!e)return false;for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return e.checkVisibility?e.checkVisibility({checkVisibilityCSS:true,contentVisibilityAuto:true}):e.getClientRects().length>0};
const info=e=>{if(!e)return{found:false};const r=e.getBoundingClientRect();return{found:true,rendered:rendered(e),rect:{x:r.x,y:r.y,width:r.width,height:r.height},section:details.indexOf(e.closest('.hr-subject')),closedAncestors:[...function*(n){for(let p=n.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(n))yield p.querySelector(':scope > summary')?.textContent?.trim()||'Sem título'}(e)]}};
const x=locate(a),y=locate(b),xi=info(x),yi=info(y);let overlap=false;if(x&&y){const r=x.getBoundingClientRect(),s=y.getBoundingClientRect(),w=Math.min(r.right,s.right)-Math.max(r.left,s.left),h=Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top);overlap=w>5&&h>5&&w*h/Math.min(r.width*r.height,s.width*s.height)>.25}
return{a:xi,b:yi,geometricOverlap:overlap,visibleOverlap:overlap&&xi.rendered&&yi.rendered};}'''
def reviewed(page):
 findings=original(page)
 if not findings:return findings
 scope=page.evaluate('''()=>{const s=JSON.parse(localStorage.getItem('grupo_saude_v4_demo_2'));return{actor:s.currentUser,profile:AttendanceBookV4.actor(s).role,theme:document.documentElement.dataset.theme,width:innerWidth,height:innerHeight,view:document.querySelector('.view.active')?.id,title:document.querySelector('#modalTitle')?.textContent,openSections:[...document.querySelectorAll('#modalBody .hr-subject')].map((e,i)=>({i,open:e.open,label:e.querySelector('summary').textContent.trim()}))}}''')
 overlaps=[f for f in findings if f['kind']=='overlapping-controls']
 if not overlaps:
  for f in findings:new_failures.append({**scope,**f})
  return findings
 screen=f'visual-{len(records)+1:03d}-{scope["actor"]}-{scope["width"]}-{scope["theme"]}.png';page.screenshot(path=str(OUT/screen),full_page=True)
 batch=[]
 for f in overlaps:
  pair={'a':{k:f[k] for k in ['tag','id','selector','text']},'b':f['other']};proof=page.evaluate(PROOF,pair)
  item={'id':f'V{len(records)+1:03d}','scope':scope,'original':f,'before':proof,'capture':screen,'checks':[]};records.append(item);batch.append((item,pair))
 sections=sorted(set(n for item,_ in batch for n in [item['before']['a'].get('section',-1),item['before']['b'].get('section',-1)] if n>=0))
 try:
  for index in sections:
   d=page.locator('#modalBody .hr-subject').nth(index)
   if not d.evaluate('(e)=>e.open'):d.locator('summary').first.click()
   page.wait_for_timeout(20)
   after=[]
   for item,pair in batch:
    proof=page.evaluate(PROOF,pair);item['checks'].append({'sectionOpened':index,**proof});after.append(proof)
   visible=[x for x in original(page) if x['kind']=='overlapping-controls' and page.evaluate(PROOF,{'a':{k:x[k] for k in ['tag','id','selector','text']},'b':x['other']})['visibleOverlap']]
   shot=f'expanded-{len(section_checks)+1:03d}-{scope["actor"]}-{scope["width"]}-{scope["theme"]}.png';page.screenshot(path=str(OUT/shot),full_page=True)
   section_checks.append({**scope,'section':index,'label':d.locator('summary').first.inner_text(),'capture':shot,'visibleOverlaps':visible,'singleSectionOpen':page.locator('#modalBody .hr-subject[open]').count()==1})
   for item,_ in batch:
    if index in [item['before']['a'].get('section'),item['before']['b'].get('section')]:item.setdefault('expandedCaptures',[]).append(shot)
   if visible:new_failures.append({**scope,'section':index,'capture':shot,'findings':visible})
 finally:
  page.evaluate('''states=>{const ds=[...document.querySelectorAll('#modalBody .hr-subject')];ds.forEach(e=>e.open=false);for(const s of states)if(s.open&&ds[s.i])ds[s.i].open=true}''',scope['openSections'])
 # New progressive filters use native details outside the historical HR accordion.
 # Open the actual affected disclosure, inspect the same named controls, then restore it.
 closed_names={name for item,_ in batch for key in ['a','b'] for name in item['before'][key].get('closedAncestors',[])}
 root_selector='dialog[open]' if page.locator('dialog[open]').count() else '.view.active'
 others=page.locator(root_selector+' details:not(.hr-subject)')
 for index in range(others.count()):
  d=others.nth(index);summary=d.locator(':scope > summary')
  if not summary.count() or not summary.is_visible() or summary.text_content().strip() not in closed_names or d.evaluate('(e)=>e.open'):continue
  name=summary.text_content().strip();summary.click();page.wait_for_timeout(30)
  try:
   for item,pair in batch:item['checks'].append({'disclosureOpened':name,**page.evaluate(PROOF,pair)})
   visible=[x for x in original(page) if x['kind']=='overlapping-controls' and page.evaluate(PROOF,{'a':{k:x[k] for k in ['tag','id','selector','text']},'b':x['other']})['visibleOverlap']]
   shot=f'disclosure-{len(disclosure_checks)+1:03d}-{scope["actor"]}-{scope["width"]}-{scope["theme"]}.png';page.screenshot(path=str(OUT/shot),full_page=True)
   if visible:new_failures.append({**scope,'disclosure':name,'capture':shot,'findings':visible})
   # A deliberately visible overlap must still be rejected after opening the filters.
   page.evaluate("""()=>{const root=document.querySelector('dialog[open]')||document.querySelector('.view.active'),r=root.getBoundingClientRect();for(const id of ['disclosureProbeA','disclosureProbeB']){const b=document.createElement('button');b.id=id;b.textContent='SYN PROBE';Object.assign(b.style,{position:'fixed',left:(r.left+24)+'px',top:(Math.max(200,r.top)+24)+'px',width:'80px',height:'44px',zIndex:'9999'});root.append(b)}}""")
   probes=[x for x in original(page) if x['kind']=='overlapping-controls' and {x.get('id'),x['other'].get('id')}=={'disclosureProbeA','disclosureProbeB'}]
   detected=any(page.evaluate(PROOF,{'a':{k:x[k] for k in ['tag','id','selector','text']},'b':x['other']})['visibleOverlap'] for x in probes)
   assert detected,'Disclosure audit must detect deliberately overlapping visible controls'
   disclosure_checks.append({**scope,'disclosure':name,'capture':shot,'visibleOverlaps':visible,'negativeControlDetected':detected})
  finally:
   page.evaluate("document.querySelectorAll('#disclosureProbeA,#disclosureProbeB').forEach(e=>e.remove())")
   if d.evaluate('(e)=>e.open'):summary.click()
 for item,_ in batch:
  proofs=[item['before'],*item['checks']]
  if any(x['visibleOverlap'] for x in proofs):item.update(classification='FALHA_REAL',severity='P2',reason='Interseção reproduzida entre controlos renderizados.')
  elif all(item['before'][k]['found'] for k in ['a','b']) and (item['before']['a']['closedAncestors'] or item['before']['b']['closedAncestors']) and item['checks']:
   item.update(classification='FALSO_POSITIVO',severity='Informativo',reason='Geometria residual de secção details recolhida; controlos revistos com a respetiva secção aberta, sem interseção renderizada.')
  else:item.update(classification='POR_CONFIRMAR',severity='P2',reason='Evidência insuficiente para excluir um defeito visível.')
  print('VISUAL_ITEM '+json.dumps(item,ensure_ascii=False),flush=True)
 return findings
audit_visual.inspect=reviewed
try:
 runpy.run_path(str(Path(__file__).with_name('profile-audit-browser.py')),run_name='__main__')
finally:
 result={'baselineCode':'ddb6023618d73ec678af742a1cfc3353b27dc903','auditedCode':os.environ.get('GITHUB_SHA','working-tree'),'records':records,'sectionChecks':section_checks,'disclosureChecks':disclosure_checks,'additionalFindings':new_failures,'summary':{k:sum(x.get('classification')==k for x in records) for k in ['FALHA_REAL','FALSO_POSITIVO','POR_CONFIRMAR']}}
 (OUT/'visual-102-individual-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('VISUAL_REVIEW_SUMMARY '+json.dumps({'total':len(records),**result['summary'],'expandedSections':len(section_checks),'disclosures':len(disclosure_checks),'negativeDisclosureControls':sum(x['negativeControlDetected'] for x in disclosure_checks),'additionalFindings':len(new_failures)},ensure_ascii=False),flush=True)
baseline=json.loads(Path(__file__).parents[1].joinpath('docs/AUDITORIA-GERAL-VISUAIS-102-20261023.json').read_text())
assert len(baseline['records'])==102,'Historical individual proofs must remain available'
assert not any(x.get('classification') in ['FALHA_REAL','POR_CONFIRMAR'] for x in records),'Current rendered overlaps need investigation'
# Expanded raw-geometry candidates are classified with ancestor scroll clipping by audit-expanded-browser.py.
assert all(x.get('classification') for x in records),'Incomplete individual review'
assert all(x['singleSectionOpen'] for x in section_checks),'Accordion behavior changed during audit'

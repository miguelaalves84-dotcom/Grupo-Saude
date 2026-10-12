"""Compare unchanged module pixels against immutable source; report intended changes separately."""
import json,os
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
CURRENT=Path(os.environ.get('GS_VISUAL_OUTPUT','/artifacts'))
BASE=Path('/source/tests/visual/baseline/4a58d5e')
old=json.loads((BASE/'manifest.json').read_text());new=json.loads((CURRENT/'manifest.json').read_text())
index={(r['actor'],r['viewport'],r['theme'],r['module']):r for r in new['scenarios']}
geometry=json.loads(Path(os.environ['GS_REFERENCE_GEOMETRY']).read_text())
assert geometry['source_commit']==old['source_commit']
geo={(r['actor'],r['viewport'],r['theme'],r['module']):r for r in geometry['scenarios']}
(CURRENT/'reference-geometry.json').write_text(json.dumps(geometry,indent=2))
results=[];failed=[]
for before in old['scenarios']:
 key=(before['actor'],before['viewport'],before['theme'],before['module']);after=index[key]
 if before['module'] in {'clinics','stock'}:
  results.append({'scenario':key,'status':'intentional-change-review-required','baseline':before['file'],'current':after['file']});continue
 assert before['present']==after['present'] and before['allowed']==after['allowed'],('Permission or module regression',key)
 if not before['file']:continue
 a=Image.open(BASE/before['file']).convert('RGB');b=Image.open(CURRENT/after['file']).convert('RGB')
 if a.size!=b.size:failed.append({'scenario':key,'reason':'dimensions changed','before':a.size,'after':b.size});continue
 diff=ImageChops.difference(a,b);channels=[c.point(lambda v:255 if v>16 else 0) for c in diff.split()]
 mask=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2])
 # A sticky global header can cover a module screenshot after Playwright scrolls it into view.
 # Calibrate against the immutable approved source, then exclude only that global overlay.
 region=Image.new('L',a.size,255);draw=ImageDraw.Draw(region);overlays=[]
 for row in [geo[key],after]:
  box=row.get('global_header_overlay')
  if box:
   box=[max(0,box[0]),max(0,box[1]),min(a.width,box[2]),min(a.height,box[3])]
   if box[2]>box[0] and box[3]>box[1]:draw.rectangle([box[0],box[1],box[2]-1,box[3]-1],fill=0);overlays.append(box)
 compared=region.histogram()[255]
 assert compared>=a.width*a.height*0.5,('Insufficient visible module coverage',key)
 mask=ImageChops.multiply(mask,region);ratio=mask.histogram()[255]/compared
 passed=ratio<=0.003;results.append({'scenario':key,'status':'passed' if passed else 'failed','changed_pixel_ratio':ratio,'global_header_overlays':overlays,'compared_pixels':compared})
 if not passed:diff.save(CURRENT/('diff-'+after['file']));failed.append(results[-1])
report={'reference':old['source_commit'],'tolerance':old['tolerance'],'results':results,'failed':failed,'overlay_policy':'Compare module pixels outside fixed global-header overlays; complete screenshots retain navigation/header for human review and functional assertions.', 'new_designs':'Clínicas/Stock captures versioned as candidate baseline, human review still required.'}
(CURRENT/'pixel-results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'failures':failed,'compared':sum(r['status'] in {'passed','failed'} for r in results),'failed':len(failed),'intentional_changes':'Clinics/Stock only'}))
if failed:raise SystemExit(1)

"""Compare unchanged module pixels against immutable source; report intended changes separately."""
import json,os
from pathlib import Path
from PIL import Image,ImageChops
CURRENT=Path(os.environ.get('GS_VISUAL_OUTPUT','/artifacts'))
BASE=Path('/source/tests/visual/baseline/4a58d5e')
old=json.loads((BASE/'manifest.json').read_text());new=json.loads((CURRENT/'manifest.json').read_text())
index={(r['actor'],r['viewport'],r['theme'],r['module']):r for r in new['scenarios']}
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
 mask=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2]);ratio=mask.histogram()[255]/(a.width*a.height)
 passed=ratio<=0.003;results.append({'scenario':key,'status':'passed' if passed else 'failed','changed_pixel_ratio':ratio})
 if not passed:diff.save(CURRENT/('diff-'+after['file']));failed.append(results[-1])
report={'reference':old['source_commit'],'tolerance':old['tolerance'],'results':results,'failed':failed,'new_designs':'Clínicas/Stock captures versioned as candidate baseline, human review still required.'}
(CURRENT/'pixel-results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'compared':sum(r['status'] in {'passed','failed'} for r in results),'failed':len(failed),'intentional_changes':'Clinics/Stock only'}))
if failed:raise SystemExit(1)

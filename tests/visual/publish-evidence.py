"""Version synthetic evidence only; token exists exclusively in this publishing step."""
import os,json,urllib.request,base64
from pathlib import Path
REPO='miguelaalves84-dotcom/Grupo-Saude'
BRANCH='fix/v4-p0-security-hardening-clinics-stock'
head=os.environ['GITHUB_SHA'];token=os.environ['GH_EVIDENCE_TOKEN']
def call(path,data=None):
 request=urllib.request.Request('https://api.github.com/repos/'+REPO+'/'+path,data=None if data is None else json.dumps(data).encode(),headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},method='GET' if data is None else 'POST')
 with urllib.request.urlopen(request,timeout=60) as response:return json.load(response)
ref=call('git/ref/heads/'+BRANCH)
if ref['object']['sha']!=head:raise SystemExit('Branch advanced; evidence publishing refused without force push')
commit=call('git/commits/'+head);entries=[]
for directory in ['tests/visual/baseline/4a58d5e','docs/evidence/4a58d5e']:
 for file in sorted(Path(directory).rglob('*')):
  if not file.is_file():continue
  data=file.read_bytes()
  if len(data)>40000000:raise SystemExit('Evidence file too large')
  blob=call('git/blobs',{'encoding':'base64','content':base64.b64encode(data).decode()})
  entries.append({'path':str(file),'mode':'100644','type':'blob','sha':blob['sha']})
if not entries:raise SystemExit('No evidence to preserve')
tree=call('git/trees',{'base_tree':commit['tree']['sha'],'tree':entries})
new=call('git/commits',{'message':'test(v4): preserve synthetic Chromium evidence and pre-change visual baseline [CF-Pages-Skip]','tree':tree['sha'],'parents':[head]})
# GitHub rejects a non-fast-forward ref if somebody advances the branch in the meantime.
request=urllib.request.Request('https://api.github.com/repos/'+REPO+'/git/refs/heads/'+BRANCH,data=json.dumps({'sha':new['sha'],'force':False}).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method='PATCH')
with urllib.request.urlopen(request,timeout=60) as response:json.load(response)
print('Versioned synthetic evidence: '+new['sha'])

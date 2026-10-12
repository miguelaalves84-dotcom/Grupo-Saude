"""Version only synthetic evidence; no token is passed to browser containers."""
import os,json,urllib.request,subprocess,tempfile
from pathlib import Path
REPO='miguelaalves84-dotcom/Grupo-Saude'
BRANCH='fix/v4-p0-security-hardening-clinics-stock'
head=os.environ['GITHUB_SHA'];token=os.environ['GH_EVIDENCE_TOKEN']
request=urllib.request.Request('https://api.github.com/repos/'+REPO+'/git/ref/heads/'+BRANCH,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'})
with urllib.request.urlopen(request,timeout=60) as response:ref=json.load(response)
if ref['object']['sha']!=head:raise SystemExit('Branch advanced; evidence publishing refused without force push')
paths=['tests/visual/baseline/4a58d5e','docs/evidence/4a58d5e']
if not Path(paths[0]+'/manifest.json').is_file():raise SystemExit('Missing baseline')
subprocess.run(['git','add','--',*paths],check=True)
subprocess.run(['git','-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m','test(v4): preserve synthetic Chromium evidence and pre-change visual baseline [CF-Pages-Skip]'],check=True)
with tempfile.TemporaryDirectory() as temporary:
 askpass=Path(temporary)/'askpass'
 askpass.write_text("#!/bin/sh\ncase \"$1\" in *Username*) printf '%s\\n' x-access-token ;; *) printf '%s\\n' \"$GH_EVIDENCE_TOKEN\" ;; esac\n")
 askpass.chmod(0o700)
 env={**os.environ,'GIT_ASKPASS':str(askpass),'GIT_TERMINAL_PROMPT':'0'}
 subprocess.run(['git','push','https://github.com/'+REPO+'.git','HEAD:refs/heads/'+BRANCH],check=True,env=env)
print('Versioned synthetic evidence: '+subprocess.check_output(['git','rev-parse','HEAD']).decode().strip())

"""Read-only source inventory. Candidate orphan is not proof of dead code."""
import re,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines()
files={p:(root/p).read_text(errors='replace') for p in paths if (root/p).is_file() and Path(p).suffix in ['.js','.cjs','.html','.sql','.py','.json','.yml','.md']}
script_links={p:re.findall(r'<script[^>]+src=[\"\']([^\"\']+)',s) for p,s in files.items() if p.endswith('.html')}
imports={p:re.findall(r'(?:require\(|from\s+)[\"\']([^\"\']+)',s) for p,s in files.items() if p.endswith(('.js','.cjs'))}
references={p:[q for q,s in files.items() if q!=p and (p in s or Path(p).name in s)] for p in files if p.endswith('.js') and '/' not in p}
orphan_candidates=[p for p,refs in references.items() if not refs]
functions={}
for p,s in files.items():
 if not p.endswith('.js'):continue
 names=re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(',s)
 repeated=sorted({n for n in names if names.count(n)>1})
 if repeated:functions[p]=repeated
storage={p:sorted(set(re.findall(r'(?:grupo_saude_[\w_-]+|gs[_-][\w:-]+)',s))) for p,s in files.items() if 'localStorage' in s}
tables={p:sorted(set(re.findall(r'create\s+table\s+(?:if\s+not\s+exists\s+)?([\w]+)',s,re.I))) for p,s in files.items() if p.endswith(('.sql','.js')) and re.search(r'create\s+table',s,re.I)}
report={'base':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'trackedFiles':len(paths),'htmlScripts':script_links,'imports':imports,'rootScriptReferences':references,'unreferencedFilenameCandidates':orphan_candidates,'repeatedFunctionNamesWithinFile':functions,'storageKeysAndPrefixes':storage,'apiRoutes':[p for p in paths if p.startswith(('api/','functions/'))],'migrationTables':tables,'removalDecision':'None: names and zero textual filename references do not establish unreachable runtime code. Preserve compatibility wrappers, migrations, keys and records until dependency proof and review.'}
output=root/'docs/AUDITORIA-LEGADO-INVENTARIO-20261019.json';output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'files':len(paths),'apiRoutes':len(report['apiRoutes']),'orphanCandidates':orphan_candidates,'repeatedNamesFiles':list(functions),'removals':0}))

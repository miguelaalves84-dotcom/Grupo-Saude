"""Inventory definitions, not a claim that every generated instance was exercised."""
import re,json,os,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent;OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/text-fields'));OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for p in sorted([*ROOT.glob('*.js'),*ROOT.glob('*.html')]):
 s=p.read_text();ordinal=0
 for m in re.finditer(r'<(input|textarea)\b([^>]*?)>',s,re.I|re.S):
  tag=m.group(1).lower();attrs={k.lower():v for k,q,v in re.findall(r'([\w-]+)\s*=\s*([\'"])(.*?)\2',m.group(2),re.S)};kind=attrs.get('type','text' if tag=='input' else 'textarea');ordinal+=1
  free=tag=='textarea' or kind in ['text','search','email','tel','url','password','number'] or '${' in kind or "'+" in kind
  if not free:continue
  rows.append({'file':p.name,'line':s.count('\n',0,m.start())+1,'definition':ordinal,'tag':tag,'type':kind,'id':attrs.get('id',''),'name':attrs.get('name',''),'kind':'HTML template definition','runtime':'Não conciliado com instância em execução','physicalAndroid':'Pendente'})
 for m in re.finditer(r'\b(input|field)\(\s*([\'"])(.*?)\2',s):
  rows.append({'file':p.name,'line':s.count('\n',0,m.start())+1,'definition':'factory-'+str(m.start()),'tag':'factory','type':'Tipo definido pelo gerador','id':'','name':m.group(3),'kind':'Factory call; not necessarily a free-text control','runtime':'Requer conciliação com tipo/instância gerados','physicalAndroid':'Pendente'})
(OUT/'text-source-fields.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
with (OUT/'text-source-fields.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';',lineterminator='\n');w.writeheader();w.writerows(rows)
print(json.dumps({'definitions':len(rows),'files':len({x['file'] for x in rows}),'warning':'Definitions/factory calls are not runtime instances or approved fields.'}))

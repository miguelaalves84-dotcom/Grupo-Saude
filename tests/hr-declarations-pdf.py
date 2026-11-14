"""Read actual PDFs with an independent parser, not a prefix or generator mock."""
import os,json
from pathlib import Path
from pypdf import PdfReader
root=Path(os.environ.get('GS_DECLARATION_ARTIFACTS','/tmp/gs-declarations-pdf'));results=[]
for f in sorted(root.glob('*.pdf')):
 r=PdfReader(f);text='\n'.join(p.extract_text() for p in r.pages)
 assert len(r.pages)>=1
 assert text.count('Data: ____ / ____ / ______')==1,(f,text)
 assert text.count('Local: ______________________________')==1
 assert text.count('Assinatura: ______________________________________')==1
 assert 'O Gerente' in text and 'NÃO ASSINADO' in text and 'Declaração' in text
 assert 'Data de emissão' not in text and 'Data da assinatura' not in text
 for p in r.pages:
  assert abs(float(p.mediabox.width)-595)<1 and abs(float(p.mediabox.height)-842)<1
 for p in r.pages[:-1]:assert 'Assinatura:' not in p.extract_text()
 if f.name=='multipage.pdf':assert len(r.pages)>1
 results.append({'file':f.name,'pages':len(r.pages),'a4':True,'singleBlankSignatureDate':True,'portugueseText':True})
assert len(results)==73
(root/'independent-pdf-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'pdfs':len(results),'parser':'pypdf','passed':True}))

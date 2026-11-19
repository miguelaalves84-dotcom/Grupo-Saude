"""Independent PDF text, geometry, fonts and rendered evidence for all twelve letters."""
import os,json
from pathlib import Path
import fitz
root=Path(os.environ.get('GS_DECLARATION_ARTIFACTS','/tmp/gs-declarations-layout'));manifest=json.loads((root/'layout-manifest.json').read_text());results=[]
for entry in manifest:
 f=root/entry['file'];pdf=fitz.open(f);text='\n'.join(p.get_text() for p in pdf)
 assert text.count('Data: ____ / ____ / ______')==1,(f,text)
 assert text.count('Local: ______________________________')==1
 assert text.count('Assinatura: ______________________________________')==1
 assert 'RASCUNHO — NÃO ASSINADO' in text
 assert '[A validar' not in text and 'mealCents' not in text and 'seniorityCents' not in text
 assert 'Data de emissão' not in text and 'Data da assinatura' not in text
 if entry['file']=='long-document.pdf':assert len(pdf)>1
 else:assert len(pdf)==1,(f,len(pdf))
 if entry['incomplete']:assert 'RASCUNHO INCOMPLETO' in text and 'não pode ser emitido como declaração final' in text
 else:assert 'RASCUNHO INCOMPLETO' not in text
 for i,p in enumerate(pdf):
  assert round(p.rect.width)==595 and round(p.rect.height)==842
  assert len(p.get_images())==1
  if i<len(pdf)-1:assert 'Assinatura:' not in p.get_text()
  if len(pdf)==1:assert '1 / 1' not in p.get_text()
  else:assert str(i+1)+' / '+str(len(pdf)) in p.get_text()
  for block in p.get_text('dict')['blocks']:
   if 'lines' not in block:continue
   for line in block['lines']:
    spans=line['spans']
    for sp in spans:
     r=fitz.Rect(sp['bbox']);assert r.x0>=54 and r.x1<=541 and r.y0>=28 and r.y1<=816,(f,i,sp)
     # No micro-fonts in body; only the institutional footer/status/header use smaller type.
     if 225<r.y0<700 and not sp['text'].startswith(('RASCUNHO','Por confirmar')):assert sp['size']>=10,(f,sp)
    for a,b in zip(spans,spans[1:]):assert a['bbox'][2]<=b['bbox'][0]+0.6,(f,'overlap',a,b)
  p.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(root/(f.stem+'-'+str(i+1)+'.png')))
 # The manager label is centred over, and close to, the actual writing line.
 last=pdf[-1];manager=last.search_for('O Gerente')[0];signature=last.search_for('Assinatura:')[0];assert 5<signature.y0-manager.y1<15,(f,manager,signature)
 label_width=fitz.Font('helv').text_length('Assinatura: ',fontsize=10.5);underline_width=fitz.Font('helv').text_length('_'*38,fontsize=10.5);assert abs((manager.x0+manager.x1)/2-(signature.x0+label_width+underline_width/2))<1.2,(f,'manager alignment')
 if f.stem=='salary-new-contract':assert '1.450,00 €.' in text and '25,00 €' in text
 if f.stem=='salary-historical':assert '1.123,45 €' in text and '1.450,00 €' not in text
 if f.stem=='salary-zero-components':assert 'diuturnidades' not in text and 'subsídio de alimentação' not in text
 if f.stem=='seniority':assert '15/03/2021' in text and '5 anos,' in text and '7 meses, 18 dias' in text
 results.append({'file':f.name,'pages':len(pdf),'layout':'A4 institutional v3 copy review','passed':True,'incomplete':entry['incomplete']})
assert len(results)==20
(root/'layout-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps({'pdfExamples':len(results),'passed':True,'actualPdfRasterization':True,'physicalAndroid':False}))

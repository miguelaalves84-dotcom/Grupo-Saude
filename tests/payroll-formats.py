"""Validate actual generated file containers with independent Python standard-library readers."""
import sys,json,zipfile,csv,io,hashlib
from pathlib import Path
from xml.etree import ElementTree as ET
p=Path(sys.argv[1]);j=json.loads((p/'payroll.json').read_text());assert j['schemaVersion']=='gs-payroll-package/1';assert j['snapshot']['employees'][0]['nif']=='123456789';assert 'SECRET' not in json.dumps(j)
with zipfile.ZipFile(p/'payroll.xlsx') as z:
 assert z.testzip() is None
 for n in z.namelist():ET.fromstring(z.read(n))
 ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 w=ET.fromstring(z.read('xl/workbook.xml'));assert len(w.findall('s:sheets/s:sheet',ns))==7
 sheet=ET.fromstring(z.read('xl/worksheets/sheet2.xml'));assert any(x.text=='12345678901' for x in sheet.findall('.//s:t',ns));assert not sheet.findall('.//s:f',ns)
rows=list(csv.reader(io.StringIO((p/'payroll.csv').read_text(encoding='utf-8-sig')),delimiter=';'));assert 'amountCents' in rows[0];assert len(rows)>3
pdf=(p/'payroll.pdf').read_bytes();assert pdf.startswith(b'%PDF-1.4') and b'startxref' in pdf and pdf.endswith(b'%%EOF')
with zipfile.ZipFile(p/'payroll.zip') as z:
 assert z.testzip() is None;manifest=json.loads(z.read('manifest.json'));assert len(manifest['files'])==4
 for f in manifest['files']:assert hashlib.sha256(z.read(f['name'])).hexdigest()==f['sha256']
print('PASS independent ZIP integrity, OOXML XML/sheets/text IDs, CSV, PDF and JSON validation')

try:
 import openpyxl
except ImportError:
 print('SKIP optional Excel reader: openpyxl unavailable; OOXML independently validated above')
else:
 book=openpyxl.load_workbook(p/'payroll.xlsx',data_only=False)
 assert len(book.sheetnames)==7
 assert book['Colaboradores']['D2'].value=='12345678901'
 assert all(c.data_type!='f' for sheet in book for row in sheet for c in row)
 print('PASS openpyxl reads the actual XLSX, preserves NISS text and contains no formulas')

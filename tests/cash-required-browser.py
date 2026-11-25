"""Caixa obrigatória por dia com abertura feita (0 € também conta) e «Caixa Rubrica Ponderada» quando os técnicos venderam
material no fecho: lista de caixas em falta, inserir a partir do aviso, duas caixas no mesmo dia, alerta no sino para
Administração/CEO e aviso para a administrativa; técnicos não veem nada."""
import os,json,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');ORIGIN=URL.split('/index.html')[0];K='grupo_saude_v4_demo_2';OUT=Path(os.environ.get('GS_TEST_ARTIFACTS','/tmp/cash-required'));OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,value):
 results.append({**scope,'case':label,'passed':bool(value)});print(json.dumps(results[-1]),flush=True);assert value,label
D1=(datetime.date.today()-datetime.timedelta(days=2)).isoformat();D2=(datetime.date.today()-datetime.timedelta(days=1)).isoformat()
SEED='''([k,a,d1,d2])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=a;s.ceoViewingAs=a==='u1'?null:a;s.clinics=[{id:'syn-cash',name:'SYN Caixa',active:true}];
 for(const u of [...s.users,...Object.values(s.employees||{})]){u.clinics=['syn-cash'];u.clinicIds=['syn-cash'];u.clinic='syn-cash';u.clinicId='syn-cash'}s.cash=[];
 s.days={[d1+'_syn-cash']:{date:d1,clinic:'syn-cash',open:{saved:true,professionals:[]},close:{saved:true,professionals:[],techSales:{t1:{lasers:1,materials:0}}},history:[],taskStatus:{}},
  [d2+'_syn-cash']:{date:d2,clinic:'syn-cash',open:{saved:true,professionals:[]},close:{saved:true,professionals:[],techSales:{t1:{lasers:0,materials:2}}},history:[],taskStatus:{}}};
 s.financeV2={invoices:[],payslips:[],entries:[],events:[]};localStorage.setItem(k,JSON.stringify(s))}'''
def page(b,user,w=1366,h=900,mob=False):
 c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,service_workers='block');c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort());p=c.new_page();p.set_default_timeout(8000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 p.goto(URL);p.wait_for_function('window.App&&window.FinanceUIV4&&window.GSFinanceCash');p.evaluate(SEED,[K,user,D1,D2]);p.reload();p.wait_for_function('window.App&&window.FinanceUIV4');p.wait_for_timeout(500);return c,p,errs
def btn(p,action,id=None):return p.locator('[data-fin-action="'+action+'"]'+('[data-id="'+id+'"]' if id else ''))
with sync_playwright() as pw:
 b=pw.chromium.launch(args=['--no-sandbox'])
 try:
  for user,label in [('u1','ceo'),('test_admin','administracao'),('test_adm','administrativa')]:
   scope={'user':label};c,p,errs=page(b,user)
   if p.evaluate("!GSFinanceCash.read(AttendanceBookV4.actor(JSON.parse(localStorage.getItem('%s'))))"%K):check('profile has cash access',False)
   p.evaluate("FinanceUIV4.open('cash')");p.wait_for_timeout(700);box=p.locator('.cash-missing')
   check('missing list shows the 3 sheets in falta',box.count()==1 and '(3)' in box.inner_text())
   check('Rubrica Ponderada only for the day with material sold',box.locator('li',has_text='Caixa Rubrica Ponderada').count()==1)
   items=p.evaluate("AttentionUIV4.items().filter(x=>x.kind==='cash-missing').map(x=>x.title)")
   check('bell alert for each missing sheet',len(items)==3 and any('Rubrica Ponderada em falta' in t for t in items))
   check('missing-cash alerts are at the top of the bell list',p.evaluate("AttentionUIV4.items().slice(0,3).every(x=>x.kind==='cash-missing')"))
   if label=='ceo':
    p.screenshot(path=str(OUT/'cash-missing.png'))
    # inserir a caixa de 0 € do primeiro dia a partir do aviso
    btn(p,'cash-insert','syn-cash|'+D1+'|normal').click();d=p.locator('#financeDialog')
    check('form preset with date and type',d.locator('[name=date]').input_value()==D1 and d.locator('[name=kind]').input_value()=='normal')
    d.locator('[name=total]').fill('0');d.locator('[name=card]').fill('0');d.locator('button[type=submit]').click();p.wait_for_timeout(700)
    check('0 € accepted and removed from missing','(2)' in p.locator('.cash-missing').inner_text())
    btn(p,'cash-insert','syn-cash|'+D2+'|rp').click();d=p.locator('#financeDialog')
    check('Rubrica Ponderada form preset',d.locator('[name=kind]').input_value()=='rp')
    d.locator('[name=total]').fill('45');d.locator('[name=card]').fill('20');d.locator('button[type=submit]').click();p.wait_for_timeout(700)
    btn(p,'cash-insert','syn-cash|'+D2+'|normal').click();d=p.locator('#financeDialog');d.locator('[name=total]').fill('300');d.locator('[name=card]').fill('120');d.locator('button[type=submit]').click();p.wait_for_timeout(700)
    check('no more missing sheets',p.locator('.cash-missing').count()==0)
    rows=p.locator('[data-cash-row]');check('two sheets on the day with material sold',p.locator('[data-cash-row][data-cash-kind=rp]').count()==1 and rows.count()==3)
    check('Rubrica Ponderada labelled in the table','Caixa Rubrica Ponderada' in p.locator('[data-cash-row][data-cash-kind=rp]').inner_text())
    day=p.evaluate("(k)=>JSON.parse(localStorage.getItem(k)).days",K)[D2+'_syn-cash'];check('saved separately',day['cash']['totalCents']==30000 and day['cashRP']['totalCents']==4500)
    check('bell alert cleared',p.evaluate("AttentionUIV4.items().filter(x=>x.kind==='cash-missing').length")==0)
    p.screenshot(path=str(OUT/'cash-two-sheets.png'))
   check('no page errors',not errs);c.close()
  scope={'user':'technician'};c,p,errs=page(b,'test_tec')
  check('technicians get no cash alerts',p.evaluate("AttentionUIV4.items().filter(x=>x.kind==='cash-missing').length")==0);c.close()
  scope={'device':'phone'};c,p,errs=page(b,'u1',390,844,True);p.evaluate("FinanceUIV4.open('cash')");p.wait_for_timeout(700)
  check('missing list visible on phone without horizontal scroll',p.locator('.cash-missing').is_visible() and p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));c.close()
 finally:b.close()
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

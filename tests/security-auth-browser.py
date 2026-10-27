"""Actual Chromium → HTTPS identity gateway → Better Auth → disposable PostgreSQL.
No traces, cookies, passwords, MFA secrets or invitation/reset tokens are artifacts.
"""
import base64, hashlib, hmac, json, os, struct, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
URL='https://127.0.0.1:9443';OUT=Path('/tmp/gs-security-browser-artifacts');OUT.mkdir(parents=True,exist_ok=True);results=[];scope={}
def check(label,ok):
 results.append({**scope,'case':label,'passed':bool(ok)});(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));assert ok,label
def otp(secret):
 raw=base64.b32decode(secret+'='*((8-len(secret)%8)%8));msg=struct.pack('>Q',int(time.time()//30));d=hmac.new(raw,msg,hashlib.sha1).digest();o=d[-1]&15;return str((struct.unpack('>I',d[o:o+4])[0]&0x7fffffff)%1000000).zfill(6)
def secret_fill(locator,value):
 locator.evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}))}',value)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox']);probe=browser.new_context(ignore_https_errors=True);profiles=probe.request.get(URL+'/__synthetic-fixtures').json()['profiles'];probe.close();recovery={};context_number=0
  for i,profile in enumerate(profiles):
   for device,width,height in [('tablet',1280,800),('desktop',1440,1000),('mobile',390,844)]:
    for theme in ['light','dark']:
     scope={'profile':profile['role'],'device':device,'theme':theme};context_number+=1;ua='SYN <img src=x onerror=window.__xss=1>' if i==5 and device=='mobile' and theme=='dark' else None;ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=device!='desktop',is_mobile=device!='desktop',locale='pt-PT',user_agent=ua,ignore_https_errors=True,extra_http_headers={'x-synthetic-client':str(context_number)},service_workers='block');p=ctx.new_page();p.set_default_timeout(12000);errors=[];p.on('pageerror',lambda e:errors.append(type(e).__name__));first=device=='tablet' and theme=='light';password='Synthetic-browser-passphrase-'+str(i)+'!'
     p.goto(URL+'/account.html'+('?invite='+profile['invite'] if first else ''));p.evaluate('(theme)=>{document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme}',theme)
     if first:
      check('invitation token removed from browser URL',p.evaluate('!location.search'));secret_fill(p.locator('#accountPassword'),password);p.locator('#accountForm [type=submit]').click();expect(p.locator('#accountStatus')).to_contain_text('Palavra-passe definida')
     p.locator('#accountEmail').fill(profile['email']);secret_fill(p.locator('#accountPassword'),password);p.locator('#accountForm [type=submit]').click()
     if i<2:
      expect(p.locator('#accountMfa')).to_be_visible()
      if first:
       secret_fill(p.locator('#mfaPassword'),password);p.locator('#mfaEnable').click();expect(p.locator('#mfaSecrets')).to_be_visible();key=p.locator('#mfaSecret').input_value();recovery[i]=p.locator('#mfaBackupCodes').input_value().splitlines();secret_fill(p.locator('#mfaCode'),otp(key));p.locator('#mfaForm [type=submit]').click();key=None
      else:
       secret_fill(p.locator('#mfaCode'),recovery[i].pop());p.locator('#mfaUseBackup').click()
     expect(p.locator('#accountStatus')).to_contain_text('Sessão autenticada');check('actual cookie-authenticated session and mandatory MFA',ctx.request.get(URL+'/api/auth?action=session').json().get('mfaRequired') is False);check('password and MFA material cleared',p.locator('#accountPassword').input_value()=='' and p.locator('#mfaSecret').input_value()=='' and p.locator('#mfaBackupCodes').input_value()=='');check('no credentials in browser storage',p.evaluate('(password)=>Object.values(localStorage).every(v=>!v.includes(password)&&!v.includes("session_token"))',password));check('secure HttpOnly cookies',all(c['secure'] and c['httpOnly'] for c in ctx.cookies()))
     p.locator('#loadDevices').click();expect(p.locator('#deviceList li').first).to_be_visible();check('session controls accessible',p.locator('#deviceList li').count()>=1);check('device text cannot execute HTML',p.evaluate('window.__xss!==1'));check('no page overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
     if i<2:p.screenshot(path=str(OUT/f'account-{i}-{device}-{theme}.png'),full_page=True)
     api=ctx.request.get(URL+'/api/auth?action=securityStatus');check('security data restricted to authorized managers',api.status==(200 if i<2 else 403))
     p.locator('#revokeDevices').click();expect(p.locator('#accountStatus')).to_contain_text('Sessões terminadas');check('revoked session denied by backend',ctx.request.get(URL+'/api/auth?action=session').status==401);check('no JS exceptions',not errors);ctx.close()
  browser.close()
 print(json.dumps({'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'scope':'Actual Chromium HTTPS/API/Better Auth/Argon2id/PostgreSQL, six profiles, three viewports, two themes; synthetic email sink, no physical Android validation.'}))
except Exception as error:
 print(json.dumps({'status':'failed','scope':scope,'errorType':type(error).__name__,'secrets':'redacted'}));sys.exit(1)

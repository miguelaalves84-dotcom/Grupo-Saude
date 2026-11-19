"""Funil dos pedidos de consulta: arrastar com rato, com o dedo na pega, segurando o cartão, e «Mover para…»; um toque abre o pedido."""
import os,json
from playwright.sync_api import sync_playwright
URL=os.environ.get('GS_TEST_URL','http://127.0.0.1:8765/index.html');passed=0
def check(n,v):
 global passed;print(json.dumps({'case':n,'passed':bool(v)}),flush=True);assert v,n;passed+=1
def setup(b,touch,w=1280,h=900):
 c=b.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch and w<500);p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)[:200]))
 p.goto(URL+'?fictitious=1');p.wait_for_function('window.App&&window.FunnelDragV4');p.wait_for_timeout(1500)
 p.evaluate("CEOReservedAreaV4.select('u1')");p.wait_for_timeout(600);p.evaluate("App.showView('wait')");p.wait_for_timeout(900);return c,p,errs
def stage(p,rid):return p.evaluate(f"()=>document.querySelector('[data-request-id=\"{rid}\"]')?.closest('.funnel-col')?.dataset.stage")
def pick(p):
 card=p.locator('#waitContent .funnel-card[data-request-id]').first;rid=card.get_attribute('data-request-id');src=stage(p,rid)
 cols=p.locator('#waitContent .funnel-col[data-stage]');tgt=[cols.nth(i) for i in range(cols.count()) if cols.nth(i).get_attribute('data-stage')!=src][0]
 return card,rid,src,tgt,tgt.get_attribute('data-stage')
def touch_drag(c,p,x0,y0,x1,y1,hold):
 cdp=c.new_cdp_session(p);t=lambda k,x,y:cdp.send('Input.dispatchTouchEvent',{'type':k,'touchPoints':[] if k=='touchEnd' else [{'x':x,'y':y}]})
 t('touchStart',x0,y0);p.wait_for_timeout(hold)
 for i in range(1,16):t('touchMove',x0+(x1-x0)*i/15,y0+(y1-y0)*i/15);p.wait_for_timeout(25)
 t('touchEnd',x1,y1)
with sync_playwright() as pw:
 b=pw.chromium.launch()
 # 1 rato no cartão
 c,p,e=setup(b,False);card,rid,src,tgt,ts=pick(p);cb=card.bounding_box();tb=tgt.bounding_box()
 p.mouse.move(cb['x']+cb['width']/2,cb['y']+cb['height']-10);p.mouse.down();p.mouse.move(cb['x']+cb['width']/2+15,cb['y']+cb['height'],steps=3);p.mouse.move(tb['x']+tb['width']/2,tb['y']+60,steps=12);p.mouse.up();p.wait_for_timeout(600)
 check('mouse drag on card moves to target stage',stage(p,rid)==ts and not e);c.close()
 # 2 dedo na pega (sem esperar)
 c,p,e=setup(b,True);card,rid,src,tgt,ts=pick(p);h=card.locator('.funnel-handle').bounding_box();tb=tgt.bounding_box()
 touch_drag(c,p,h['x']+h['width']/2,h['y']+h['height']/2,tb['x']+tb['width']/2,tb['y']+60,0);p.wait_for_timeout(600)
 check('finger on handle drags immediately',stage(p,rid)==ts and not e);c.close()
 # 3 dedo: segurar no cartão
 c,p,e=setup(b,True);card,rid,src,tgt,ts=pick(p);cb=card.bounding_box();tb=tgt.bounding_box()
 touch_drag(c,p,cb['x']+30,cb['y']+40,tb['x']+tb['width']/2,tb['y']+60,500);p.wait_for_timeout(600)
 check('finger hold on card then drag',stage(p,rid)==ts and not e);c.close()
 # 4 Mover para…
 c,p,e=setup(b,True,390,844);card,rid,src,tgt,ts=pick(p);card.locator('.funnel-move').select_option(ts);p.wait_for_timeout(600)
 check('Mover para list moves without opening the request',stage(p,rid)==ts and not p.evaluate("()=>!!document.querySelector('dialog[open]')") and not e)
 # 5 toque abre o pedido
 card=p.locator('#waitContent .funnel-card[data-request-id]').first;cb=card.bounding_box();p.touchscreen.tap(cb['x']+30,cb['y']+40);p.wait_for_timeout(600)
 check('a tap still opens the request',p.evaluate("()=>!!document.querySelector('dialog[open], #modal.open, .modal.open, #modal:not([hidden])')"));check('no horizontal page overflow on phone',p.evaluate('()=>document.documentElement.scrollWidth-innerWidth')<=1);c.close()
 b.close()
print(json.dumps({'passed':passed}))

"""Módulos V4 novos no servidor: com <html data-v4ext="server">, as ações vão para /api/v4-extensions (servidor local de
ensaio com a API verdadeira e base de dados em memória). Verifica gravação no servidor, permissões no servidor
(tentativa de contornar o ecrã recusada), ficha atualizada, auditoria e recuperação após limpar o navegador."""
import os, json, subprocess, time, datetime, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

PORT = int(os.environ.get('GS_V4EXT_PORT', '8781')); BASE = f'http://127.0.0.1:{PORT}'; K = 'grupo_saude_v4_demo_2'
OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-v4ext')); OUT.mkdir(parents=True, exist_ok=True); results = []


def check(name, value):
    results.append({'case': name, 'passed': bool(value)}); print(json.dumps(results[-1], ensure_ascii=False), flush=True); assert value, name


def audit(): return json.loads(urllib.request.urlopen(BASE + '/__audit').read())


srv = subprocess.Popen(['node', str(Path(__file__).parent / 'v4ext-server.cjs'), str(PORT)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
try:
    for _ in range(50):
        try: urllib.request.urlopen(BASE + '/__audit'); break
        except Exception: time.sleep(0.1)
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--no-sandbox'])
        def session(user):
            c = b.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
            c.add_cookies([{'name': 'gsTestUser', 'value': user, 'url': BASE}])
            p = c.new_page(); p.set_default_timeout(9000); errs = []; dialogs = []; p.on('pageerror', lambda e: errs.append(str(e)))
            p.on('dialog', lambda d: (dialogs.append(d.message), d.accept('SYN motivo') if d.type == 'prompt' else d.accept()))
            p.clock.install(time=datetime.datetime.fromisoformat('2026-11-12T10:00:00+00:00'))
            p.goto(BASE + '/index.html'); p.wait_for_function('window.GSExt&&window.HRGrowthV4')
            p.evaluate("([k,u])=>{const s=JSON.parse(localStorage.getItem(k));s.currentUser=u;s.ceoRealUser=u;s.ceoViewingAs=null;localStorage.setItem(k,JSON.stringify(s))}", [K, user]); p.reload(); p.wait_for_function('window.GSExt'); p.wait_for_timeout(700)
            return c, p, errs, dialogs
        # 1) técnico: pedido de dados e bolsa de horas — gravados no servidor
        c, p, errs, dialogs = session('test_tec')
        check('server mode is active', p.evaluate('GSExt.server'))
        p.evaluate("App.showView('myhr')"); p.wait_for_timeout(700); p.locator('[data-hrg-ask]').click()
        f = p.locator('[data-hrg-ask-form]'); f.locator('[name=address]').fill('Rua SYN Servidor 1'); f.locator('button').click(); p.wait_for_timeout(900)
        a = audit()
        check('data-change request saved on the server (not only in the browser)', 'v4ext_hrgrowth' in a['keys'] and any(x['action'] == 'hrgrowth.requestData' and x['actor'] == 'test_tec' for x in a['audit']))
        p.evaluate("App.showView('clock')"); p.wait_for_timeout(700); hf = p.locator('[data-hb-form]'); hf.locator('[name=date]').fill('2026-11-20'); hf.locator('[name=hours]').fill('1'); hf.locator('button').click(); p.wait_for_timeout(900)
        check('hour-bank request saved on the server', any(x['action'] == 'hourbank.request' for x in audit()['audit']))
        # 2) tentativa de contornar o ecrã: técnico tenta aprovar o próprio pedido
        rid = p.evaluate("k=>JSON.parse(localStorage.getItem(k)).hrDataRequests[0].id", K)
        p.evaluate("id=>GSExt.send((s,a)=>GSHRGrowth.decideData(s,a,id,true))", rid); p.wait_for_timeout(900)
        check('server refuses a technician approving their own data change', any('reservada' in m.lower() for m in dialogs) and not any(x['action'] == 'hrgrowth.decideData' for x in audit()['audit']))
        check('employee record unchanged after the refused attempt', audit()['employees']['test_tec']['hr'].get('address') is None)
        check('no page errors (technician)', not errs); c.close()
        # 3) Administração: vê no «Hoje», aprova; ficha atualizada no servidor
        c, p, errs, dialogs = session('test_admin')
        p.evaluate("App.showView('today')"); p.wait_for_timeout(700)
        check('management sees the pending request from the server in «Hoje»', '1 pedido de alteração de dados por decidir' in p.locator('.today-need').inner_text())
        p.locator('.today-need [data-today-hr=requests]').click(); p.wait_for_timeout(900); p.locator('[data-hrg-data-ok]').click(); p.wait_for_timeout(1000)
        a = audit()
        check('approval updates the employee record on the server and is audited', a['employees']['test_tec']['hr'].get('address') == 'Rua SYN Servidor 1' and any(x['action'] == 'hrgrowth.decideData' and x['actor'] == 'test_admin' for x in a['audit']))
        p.evaluate("App.showView('clock')"); p.wait_for_timeout(800); p.locator('[data-hb-ok]').first.click(); p.wait_for_timeout(900)
        check('hour-bank decision saved on the server', any(x['action'] == 'hourbank.decide' for x in audit()['audit']))
        # 4) limpar o navegador: os dados voltam do servidor
        p.evaluate("k=>{const s=JSON.parse(localStorage.getItem(k));delete s.hrDataRequests;delete s.hourBank;localStorage.setItem(k,JSON.stringify(s))}", K); p.reload(); p.wait_for_function('window.GSExt'); p.wait_for_timeout(1000)
        st = p.evaluate("k=>JSON.parse(localStorage.getItem(k))", K)
        check('after clearing the browser, data comes back from the server', st['hrDataRequests'][0]['status'] == 'Aprovado' and st['hourBank']['uses'][0]['status'] == 'Aprovado')
        check('no page errors (management)', not errs); c.close(); b.close()
finally:
    srv.terminate(); (OUT / 'v4-extensions-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False))
print(json.dumps({'passed': sum(r['passed'] for r in results), 'total': len(results)}))

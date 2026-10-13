"""Run existing suites locally, with fresh contexts, deny external URLs and record evidence."""
import functools
import http.server
import json
import os
from pathlib import Path
import runpy
import sys
import threading
import traceback
from urllib.parse import urlsplit
from playwright.sync_api import Browser, BrowserContext, BrowserType
from playwright.sync_api._context_manager import PlaywrightContextManager

ROOT = Path(__file__).resolve().parents[2]
SUITES = {'browser', 'finance-browser', 'improvements-browser', 'documents-browser',
          'p0-browser', 'daily-leave-browser', 'clinics-browser', 'stock-browser', 'tables-browser', 'profile-audit-browser', 'consolidation-browser'}
suite = sys.argv[1]
if suite not in SUITES:
    raise SystemExit('Unknown suite')
ARTIFACTS = Path(os.environ.get('GS_TEST_ARTIFACTS', '/artifacts'))
ARTIFACTS.mkdir(parents=True, exist_ok=True)
os.environ['GS_TEST_ARTIFACTS'] = str(ARTIFACTS)
os.environ['GS_TEST_URL'] = 'http://127.0.0.1:8765/index.html'
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
contexts, blocked = [], []
context_number = 0
original_context, original_close, original_launch = Browser.new_context, BrowserContext.close, BrowserType.launch

def launch(self, *args, **kwargs):
    if os.environ.get('GS_CHROMIUM'):
        kwargs['executable_path'] = os.environ['GS_CHROMIUM']
    return original_launch(self, *args, **kwargs)

def new_context(self, *args, **kwargs):
    kwargs['service_workers'] = 'block'
    context = original_context(self, *args, **kwargs)
    global context_number
    context_number += 1
    number = context_number
    contexts.append((context, number))
    def guard(route):
        url = urlsplit(route.request.url)
        if url.scheme in {'http', 'https'} and (url.scheme != 'http' or url.netloc != '127.0.0.1:8765'):
            blocked.append(route.request.url)
            route.abort('blockedbyclient')
        else:
            route.continue_()
    context.route('**/*', guard)
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    return context

def close(self, *args, **kwargs):
    entry = next(((c, n) for c, n in contexts if c is self), None)
    if entry:
        contexts.remove(entry)
        for index, page in enumerate(self.pages):
            if not page.is_closed():
                page.screenshot(path=str(ARTIFACTS / f'{suite}-{entry[1]}-{index}.png'), full_page=True)
        self.tracing.stop(path=str(ARTIFACTS / f'{suite}-{entry[1]}.zip'))
    return original_close(self, *args, **kwargs)

Browser.new_context, BrowserContext.close, BrowserType.launch = new_context, close, launch
original_exit = PlaywrightContextManager.__exit__

def exit_playwright(self, *args):
    # Persist failure evidence before the sync manager stops its event loop.
    for context, _ in list(contexts):
        context.close()
    return original_exit(self, *args)

PlaywrightContextManager.__exit__ = exit_playwright
failed = False
try:
    runpy.run_path(str(ROOT / 'tests' / (suite + '.py')), run_name='__main__')
except BaseException:
    failed = True
    traceback.print_exc()
finally:
    for context, _ in list(contexts):
        try:
            context.close()
        except Exception:
            traceback.print_exc()
    server.shutdown()
    (ARTIFACTS / 'result.json').write_text(json.dumps({
        'suite': suite, 'status': 'failed' if failed else 'passed',
        'url': os.environ['GS_TEST_URL'], 'external_requests_blocked': blocked,
        'scope': 'synthetic demo and mocked authentication; no provider or database',
        'visual_evidence': 'screenshots and traces; no approved pixel baseline'
    }, indent=2))
if failed:
    raise SystemExit(1)

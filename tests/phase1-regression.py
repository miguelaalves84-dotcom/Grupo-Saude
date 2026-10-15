"""Sequential local Chromium regressions, retaining every failure and raw log."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('GS_TEST_ARTIFACTS', '/tmp/gs-phase1/regression'))
OUT.mkdir(parents=True, exist_ok=True)
SUITES = sys.argv[1:] or ['phase1-browser', 'browser', 'finance-browser', 'improvements-browser',
          'documents-browser', 'p0-browser', 'daily-leave-browser', 'clinics-browser',
          'stock-browser', 'tables-browser', 'consolidation-browser', 'profile-audit-browser']
results = []
for suite in SUITES:
    started = time.monotonic()
    env = {**os.environ, 'GS_TEST_ARTIFACTS': str(OUT / suite), 'PYTHONUNBUFFERED': '1'}
    env.pop('GS_PHASE1_BASELINE_SCHEDULED', None)
    print('START', suite, flush=True)
    with (OUT / f'{suite}.log').open('w') as log:
        try:
            result = subprocess.run([sys.executable, 'tests/ci/run-browser.py', suite], cwd=ROOT,
                                    env=env, stdout=log, stderr=subprocess.STDOUT, timeout=1200 if suite=='profile-audit-browser' else 240)
            code = result.returncode
        except subprocess.TimeoutExpired:
            code = 'timeout'
    row = {'suite': suite, 'exit': code, 'seconds': round(time.monotonic()-started, 1)}
    results.append(row)
    (OUT / 'results.json').write_text(json.dumps(results, indent=2))
    print(json.dumps(row), flush=True)
raise SystemExit(int(any(r['exit'] != 0 for r in results)))

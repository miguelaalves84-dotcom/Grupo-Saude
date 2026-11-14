"""Resolve the immutable Cloudflare deployment for this exact CI head commit."""
import json
import os
import re
import time
import urllib.request

REPO = 'miguelaalves84-dotcom/Grupo-Saude'
sha = os.environ['GS_PREVIEW_COMMIT']
if not re.fullmatch(r'[0-9a-f]{40}', sha):
    raise RuntimeError('Invalid commit')
request = urllib.request.Request(
    f'https://api.github.com/repos/{REPO}/commits/{sha}/check-runs',
    headers={'Authorization': 'Bearer ' + os.environ['GH_READ_TOKEN'],
             'Accept': 'application/vnd.github+json', 'User-Agent': 'GS-V4-preview-regression'})
for attempt in range(12):
    with urllib.request.urlopen(request, timeout=20) as response:
        checks = json.load(response)['check_runs']
    for check in checks:
        if check['name'] != 'Cloudflare Pages' or check['head_sha'] != sha:
            continue
        if check['conclusion'] == 'failure':
            raise RuntimeError('Cloudflare build failed')
        if check['conclusion'] == 'success':
            match = re.search(r'https://[0-9a-f]{8}\.grupo-saude\.pages\.dev', (check.get('output') or {}).get('summary') or '')
            if match:
                url = match.group() + '/index.html'
                with open(os.environ['GITHUB_ENV'], 'a', encoding='utf-8') as target:
                    target.write('GS_PREVIEW_TEST_URL=' + url + '\n')
                print('Verified Cloudflare head:', sha, url)
                raise SystemExit(0)
    time.sleep(10)
raise RuntimeError('No verified Cloudflare preview for this commit')

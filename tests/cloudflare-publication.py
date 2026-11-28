"""Read-only check of exact preview assets; inspect production without deploying."""
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

preview = os.environ['GS_PREVIEW_TEST_URL']
origin = urllib.parse.urlsplit(preview)
if origin.scheme != 'https' or not origin.hostname.endswith('.grupo-saude.pages.dev'):
    raise RuntimeError('Unexpected Cloudflare preview')
base = f'https://{origin.netloc}'

def read(url):
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'GS-V4-publication-check'})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read()

for asset in ['app.js', 'finance-ui-v4.js', 'deployment-version-v4.js']:
    expected = Path(asset).read_bytes()
    actual = read(base + '/' + asset)
    if actual != expected:
        raise RuntimeError(f'Preview asset differs from tested commit: {asset}')
    print('PASS Cloudflare asset:', asset, hashlib.sha256(actual).hexdigest()[:16])
identity = json.loads(read(base + '/api/version'))
expected_sha = os.environ['GS_PREVIEW_COMMIT']
if identity.get('commit') and identity['commit'] != expected_sha:
    raise RuntimeError('Cloudflare deployed a different commit')
print('Cloudflare runtime identity:', json.dumps(identity, ensure_ascii=False))
# A legacy production deployment may have no identity endpoint. Its content is inspected only.
try:
    live = read('https://grupo-saude.pages.dev/app.js')
    print('Production app.js equals tested preview:', live == Path('app.js').read_bytes())
    print('Production app.js SHA256:', hashlib.sha256(live).hexdigest())
except (urllib.error.URLError, TimeoutError) as error:
    print('Production read-only inspection unavailable:', type(error).__name__)

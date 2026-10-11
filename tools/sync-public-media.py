"""Mirror public portfolio assets with checksum validation; no credentials required."""
import concurrent.futures
import hashlib
import json
import pathlib
import time
import urllib.request

root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / '.github/motion-atlas-media.json').read_text())

def download(item):
    target = root / 'motion-atlas' / item['path']
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == item['sha256']:
        return item['path']
    for attempt in range(4):
        try:
            request = urllib.request.Request(item['url'], headers={'User-Agent': 'MotionAtlasMediaSync/1.0'})
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            if len(data) != item['size'] or hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError('Media checksum mismatch: ' + item['path'])
            target.write_bytes(data)
            return item['path']
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for path in pool.map(download, manifest):
        print('Verified:', path, flush=True)

"""Vendor the CC BY 4.0 HuBMAP meshes during build so tracking stays local."""
import json
import pathlib
import urllib.request

repo = 'tejasghalsasi/anatomy-atelier'
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'LifeTwin-build'}), timeout=60) as response:
        return response.read()
tree = json.loads(fetch(f'https://api.github.com/repos/{repo}/git/trees/master?recursive=1'))
assets = [item['path'] for item in tree['tree'] if item['path'].lower().endswith('.glb')]
out = pathlib.Path(__file__).resolve().parents[1] / 'public/models'
out.mkdir(parents=True, exist_ok=True)
for organ, term in [('heart','heart'), ('lungs','lung'), ('brain','brain')]:
    path = next(path for path in assets if term in pathlib.Path(path).stem.lower())
    data = fetch(f'https://raw.githubusercontent.com/{repo}/{tree["sha"]}/'+urllib.parse.quote(path))
    if data[:4] != b'glTF': raise ValueError(path)
    (out / (organ+'.glb')).write_bytes(data)
    print(organ, path, len(data))

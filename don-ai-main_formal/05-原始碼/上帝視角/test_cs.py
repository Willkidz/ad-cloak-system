import requests
from urllib.parse import unquote

urls = [
    ('cs CS06', 'https://cs.freshpathlab.com/?a=CS06'),
    ('cs CS01', 'https://cs.freshpathlab.com/?a=CS01'),
    ('cx CX01', 'https://cx.freshpathlab.com/?a=CX01'),
    ('js JS01', 'https://js.freshpathlab.com/?a=JS01'),
    ('bf BF01', 'https://bf.freshpathlab.com/?a=BF01'),
]

for name, url in urls:
    try:
        r = requests.get(url, allow_redirects=False, timeout=3)
        loc = unquote(r.headers.get('Location', ''))
        print(f"{name}: {r.status_code} → {loc[:100]}")
    except Exception as e:
        print(f"{name}: ERROR → {str(e)[:100]}")

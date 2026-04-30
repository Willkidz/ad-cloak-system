from pathlib import Path
import re
from statistics import mean

base = Path('/home/ubuntu/don-ai/.ai/perf')
text = (base / 'curl_runs.txt').read_text()

sections = []
current = None
for line in text.splitlines():
    if line.startswith('=== '):
        current = {'label': line.strip('= ').strip()}
        sections.append(current)
    elif ':' in line and current is not None:
        k, v = line.split(':', 1)
        try:
            current[k.strip()] = float(v.strip().rstrip('s'))
        except ValueError:
            pass

def avg_for(prefix, key):
    vals = [s[key] for s in sections if s['label'].startswith(prefix) and key in s]
    return mean(vals) if vals else None

print('AVERAGES')
for prefix in ['z1k4h', 'safe-page']:
    row = {k: avg_for(prefix, k) for k in ['DNS', 'TCP', 'TLS', 'TTFB', 'Total']}
    print(prefix, row)

print('\nSERVER_TIMING')
pat = re.compile(r'server-timing:\s*(.+)', re.I)
for header in sorted(base.glob('*headers_*.txt')):
    data = header.read_text()
    m = pat.search(data)
    x = re.search(r'x-worker-timing-total:\s*(\d+)', data, re.I)
    print(header.name)
    print('  server_timing=', m.group(1) if m else '<none>')
    print('  x_worker_timing_total_ms=', int(x.group(1)) if x else None)

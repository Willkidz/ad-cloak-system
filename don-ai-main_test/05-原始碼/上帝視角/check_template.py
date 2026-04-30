import json, sys, re

data = json.load(sys.stdin)
content = data['result'][0]['results'][0]['content']

# Find all src and href references
srcs = re.findall(r'(?:src|href)=["\']([^"\']+)["\']', content)
for s in srcs:
    print(s)

print("\n--- Full content ---")
print(content)

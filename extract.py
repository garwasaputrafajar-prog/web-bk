import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<script type="text/babel">(.*?)</script>', html, re.DOTALL)
if match:
    with open('script.jsx', 'w', encoding='utf-8') as f:
        f.write(match.group(1))
    print("Extracted script.jsx")
else:
    print("Could not find babel script")

import sys

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* SURAT & DOKUMEN SECTION */}" in line:
        start_idx = i
    if "{/* MODULE LAIN (TIDAK BERUBAH) */}" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    with open('new_section.txt', 'r', encoding='utf-8') as f:
        new_section = f.read()
    
    # We append a newline just in case
    if not new_section.endswith('\n'):
        new_section += '\n'
        
    new_lines = lines[:start_idx] + [new_section] + lines[end_idx:]
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Replaced lines from {start_idx} to {end_idx} successfully")
else:
    print("Could not find boundaries")

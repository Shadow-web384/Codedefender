
import re

with open(r'c:\Users\Aarnav\Desktop\CodeDefender\static\game.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'baseToggle' in line:
        print(f"{i+1}: {line.strip()}")


import os

root = r'c:\Users\Aarnav\Desktop\CodeDefender\static'
for file in os.listdir(root):
    if file.endswith('.js'):
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                if 'baseToggle' in line:
                    print(f"{file}:{i+1}: {line.strip()}")

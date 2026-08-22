import re
with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"<\/section>\s*<\/div>\s*\{\/\* Password Modal \*\/\}", "</section>\n\n      {/* Password Modal */}", content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

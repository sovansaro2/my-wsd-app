import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

pattern = r"      <\/div>\n\n      \{\/\* 100k\+ Donors Section \*\/\}[\s\S]*?<\/section>\n      <\/div>"
replacement = "\n      {/* 100k+ Donors Section */}" + re.search(r"      \{\/\* 100k\+ Donors Section \*\/\}[\s\S]*?<\/section>", content).group(0)[32:] + "\n      </div>"

content = re.sub(pattern, replacement, content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

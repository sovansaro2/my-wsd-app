import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# I will just remove ALL stray `</div>` and rely on auto-fix or manually add the exact correct divs.
# Actually, I can just fix it properly:

pattern = r"      \{\/\* Pie Chart \*\/\}[\s\S]*?<\/PieChart>\n          <\/ResponsiveContainer>\n        <\/div>\n      <\/div>\n      <\/div>\n      \{\/\* 100k\+ Donors Section \*\/\}[\s\S]*?<\/section>\n      <\/div>"

replacement = re.search(r"      \{\/\* Pie Chart \*\/\}[\s\S]*?<\/PieChart>\n          <\/ResponsiveContainer>\n        <\/div>\n      <\/div>", content).group(0) + "\n      </div>\n" + re.search(r"      \{\/\* 100k\+ Donors Section \*\/\}[\s\S]*?<\/section>", content).group(0)

content = re.sub(pattern, replacement, content)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

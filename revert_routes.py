import re

with open('server/routers/name_lists.ts', 'r') as f:
    content = f.read()

pattern = r"// --- Top Donors \(Aggregated\) ---.*?// --- Name List Categories ---"
replacement = "// --- Name List Categories ---"
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('server/routers/name_lists.ts', 'w') as f:
    f.write(content)


with open('src/lib/apiClient.ts', 'r') as f:
    content2 = f.read()

content2 = re.sub(r"  getTopDonors: \(\) => apiFetch\('/api/name-lists/top-donors'\),\n", "", content2)

with open('src/lib/apiClient.ts', 'w') as f:
    f.write(content2)


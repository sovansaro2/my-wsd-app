import re

with open('src/lib/apiClient.ts', 'r') as f:
    content = f.read()

pattern = r"  getNameListCategories: \(\) => apiFetch\('/api/name-lists/categories'\),"
replacement = """  get100kDonors: () => apiFetch('/api/name-lists/donors-100k'),
  getNameListCategories: () => apiFetch('/api/name-lists/categories'),"""

content = re.sub(pattern, replacement, content)
with open('src/lib/apiClient.ts', 'w') as f:
    f.write(content)

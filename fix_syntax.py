import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

bad_string = r"\{userRole === 'admin' \{userRole === 'admin' && selectedCategory\?\.name \!\=\= 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ' && \(\{userRole === 'admin' && selectedCategory\?\.name \!\=\= 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ' && \( \("
good_string = "{userRole === 'admin' && ("

content = re.sub(bad_string, good_string, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

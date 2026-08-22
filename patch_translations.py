import re

with open('src/contexts/LanguageContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("list_note: 'ផ្សេងៗ / ទីកន្លែង (មិនចាំបាច់)'", "list_note: 'ផ្នែក'")
content = content.replace("list_note: 'Note / Place (Optional)'", "list_note: 'Section'")
content = content.replace("list_note_ph: 'ឧ. ភ្នំពេញ...'", "list_note_ph: 'ឧ. ភ្នំពេញ...'") # I can leave this or change to "ឧ. ផ្នែក..."

with open('src/contexts/LanguageContext.tsx', 'w') as f:
    f.write(content)

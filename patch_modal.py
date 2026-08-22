import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Pattern to remove the note input field block in the modal
note_block_pattern = r"              <div>\n                <label className=\"block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1\">\n                  \{t\('list_note'\)\}\n                </label>\n                <input\n                  type=\"text\"\n                  value=\{note\}\n                  onChange=\{\(e\) => setNote\(e\.target\.value\)\}\n                  className=\"w-full border border-gray-300 rounded-xl px-4 py-2\.5 focus:outline-none focus:ring-2 focus:ring-blue-500\"\n                  placeholder=\{t\('list_note_ph'\)\}\n                />\n              </div>"

content = re.sub(note_block_pattern, "", content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

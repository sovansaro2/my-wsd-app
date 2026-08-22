import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Remove UI for referrer in form
content = re.sub(
    r"              <div>\s+<label className=\"block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1\">\s+\{t\('list_ref'\)\}\s+<\/label>\s+<input\s+type=\"text\"\s+value=\{referrer\}\s+onChange=\{\(e\) => setReferrer\(e.target.value\)\}\s+className=\"w-full border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors\"\s+placeholder=\{t\('list_ref_ph'\)\}\s+\/>\s+<\/div>",
    "",
    content
)

# Replace the title `{(record.note || record.referrer) && (` with `{(record.note) && (`
content = content.replace("{(record.note || record.referrer) && (", "{record.note && (")

# Remove referrer render block
content = re.sub(
    r"                            \{record\.referrer && \([\s\S]*?\}\)\n",
    "",
    content
)

# Remove `&& (` if it's there
content = content.replace("{record.note && (\n                          <div className=\"flex flex-col gap-1 mt-2\">\n                            {record.note && (",
                          "{record.note && (\n                          <div className=\"flex flex-col gap-1 mt-2\">")
# Actually, the previous regex might be messy, let me refine it.

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

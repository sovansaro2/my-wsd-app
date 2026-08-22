import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

pattern = r"                        \{record\.note && \(\n                          <div className=\"flex flex-col gap-1 mt-2\">\n                              <div className=\"flex items-center gap-2 text-\[12px\] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md\">\n                                <span className=\"w-1 h-1 rounded-full bg-zinc-300 shrink-0\"><\/span>\n                                <span className=\"truncate\">\{record\.note\}<\/span>\n                              <\/div>\n                            \}\)\n                            \{record\.referrer && \([\s\S]*?\}\)\n                          <\/div>\n                        \}\)"

replacement = """                        {record.note && (
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0"></span>
                              <span className="truncate">{record.note}</span>
                            </div>
                          </div>
                        )}"""

content = re.sub(pattern, replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

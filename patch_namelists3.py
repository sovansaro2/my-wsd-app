import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Replace the messy block
messy_block = """                        {record.note && (
                          <div className="flex flex-col gap-1 mt-2">
                              <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0"></span>
                                <span className="truncate">{record.note}</span>
                              </div>
                            )}
                            {record.referrer && (
                              <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                                <span className="truncate">{t('list_referrer')}៖ {record.referrer}</span>
                              </div>
                            )}
                          </div>
                        )}"""

clean_block = """                        {record.note && (
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0"></span>
                              <span className="truncate">{record.note}</span>
                            </div>
                          </div>
                        )}"""

if messy_block in content:
    content = content.replace(messy_block, clean_block)
else:
    print("Messy block not found exactly as string. Falling back to regex.")
    # More robust regex
    pattern = r"\{record\.note && \(\n\s*<div className=\"flex flex-col gap-1 mt-2\">\n\s*<div className=\"flex items-center gap-2 text-\[12px\] text-zinc-500 dark:text-slate-400 bg-zinc-50 px-2 py-1 rounded-md\">\n\s*<span className=\"w-1 h-1 rounded-full bg-zinc-300 shrink-0\"><\/span>\n\s*<span className=\"truncate\">\{record\.note\}<\/span>\n\s*<\/div>\n\s*\}\)\n\s*\{record\.referrer && \([\s\S]*?\}\)\n\s*<\/div>\n\s*\}\)"
    content = re.sub(pattern, clean_block, content)


# Remove referrer filter
content = content.replace(" ||\n    (record.referrer && record.referrer.toLowerCase().includes(searchQuery.toLowerCase()))", "")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

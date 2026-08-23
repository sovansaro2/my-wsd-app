import re

# 1. Fix Records.tsx
with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Find the Seil Modals block at the end
seil_modals_start = content.find("{/* Seil Modals */}")
seil_modals_end = content.find("{/* Add Record Modal */}")

if seil_modals_start != -1 and seil_modals_end != -1:
    seil_modals_block = content[seil_modals_start:seil_modals_end]
    content = content[:seil_modals_start] + content[seil_modals_end:]
    
    # Insert it into the early return block
    early_return_end = content.find("</div>\n    );\n  }\n\n  const incomeRecords")
    if early_return_end != -1:
        # We need to wrap it in a fragment
        early_return_start = content.find("    return (\n      <div className=\"flex flex-col h-full")
        if early_return_start != -1:
            # Change the early return to use fragment
            content = content[:early_return_start] + "    return (\n      <>\n      " + content[early_return_start+13:early_return_end+6] + "\n" + seil_modals_block + "      </>\n" + content[early_return_end+6:]
            print("Successfully patched Records.tsx")
        else:
            print("Could not find early_return_start in Records.tsx")
    else:
        print("Could not find early_return_end in Records.tsx")
else:
    print("Could not find Seil Modals in Records.tsx")

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)


# 2. Fix NameLists.tsx
with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Find the Category Modals block at the end
cat_modals_start = content.find("{/* Category Modals */}")
cat_modals_end = content.find("{/* Add Record Modal */}")

if cat_modals_start != -1 and cat_modals_end != -1:
    cat_modals_block = content[cat_modals_start:cat_modals_end]
    content = content[:cat_modals_start] + content[cat_modals_end:]
    
    # Insert it into the early return block
    early_return_end = content.find("</div>\n    );\n  }\n\n  return (")
    if early_return_end != -1:
        # We need to wrap it in a fragment
        early_return_start = content.find("    return (\n      <div className=\"flex flex-col h-full")
        if early_return_start != -1:
            # Change the early return to use fragment
            content = content[:early_return_start] + "    return (\n      <>\n      " + content[early_return_start+13:early_return_end+6] + "\n" + cat_modals_block + "      </>\n" + content[early_return_end+6:]
            print("Successfully patched NameLists.tsx")
        else:
            print("Could not find early_return_start in NameLists.tsx")
    else:
        print("Could not find early_return_end in NameLists.tsx")
else:
    print("Could not find Category Modals in NameLists.tsx")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)


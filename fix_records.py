import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Replace the messy raw fetch block with api calls
messy_block = r"""          if \(\!roofCategory\) \{\s*\/\/ Need to create it[\s\S]*?if \(createRes\.ok\) \{\s*roofCategory = await createRes\.json\(\);\s*\}\s*\}\s*if \(roofCategory\) \{\s*await fetch\('/api/name-lists/records'[\s\S]*?\}\);"""

clean_block = """          if (!roofCategory) {
            roofCategory = await api.createNameListCategory({
              name: 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ',
              description: 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'
            });
          }
          
          if (roofCategory) {
            await api.createNameListRecord({
              category_id: roofCategory.id,
              name: newDescription.trim(),
              amount: parseFloat(newAmount.replace(/,/g, '')),
              note: newNote || null,
              notify_public: newNotifyPublic,
              is_100k_donor: false
            });
          }"""

content = re.sub(messy_block, clean_block, content)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)

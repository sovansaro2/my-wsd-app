import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

effect_pattern = r"  useEffect\(\(\) => \{\n    if \(selectedCategory\) \{\n      fetchRecords\(selectedCategory\.id\);\n    \}\n  \}, \[selectedCategory\]\);"
effect_replacement = """  useEffect(() => {
    if (selectedCategory) {
      fetchRecords(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (categories.length > 0) {
      const roofCat = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
      const generalCats = categories.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
      
      if (activeTab === 'roof') {
        if (roofCat) {
          setSelectedCategory(roofCat);
        } else {
          setSelectedCategory(null);
          setRecords([]);
        }
      } else {
        if (generalCats.length > 0) {
          // Select first general category if none or if currently on roof
          if (!selectedCategory || selectedCategory.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ') {
            setSelectedCategory(generalCats[0]);
          }
        } else {
          setSelectedCategory(null);
          setRecords([]);
        }
      }
    }
  }, [activeTab]);"""

content = re.sub(effect_pattern, effect_replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

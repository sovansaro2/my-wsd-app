import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Remove activeTab state
content = re.sub(r"  const \[activeTab, setActiveTab\] = useState\w*<.*?>\('general'\);\n", "", content)

# Remove useEffect for activeTab
content = re.sub(r"  useEffect\(\(\) => \{\n\s*if \(categories\.length > 0\) \{[\s\S]*?\}, \[activeTab\]\);\n\n", "", content)

# Modify fetchCategories to NOT auto-select
fetch_pattern = r"        setCategories\(data\);\n        const roofCat = data\.find[\s\S]*?\} else if \(\!selectedCategory\) \{\n          setSelectedCategory\(data\[0\]\);\n        \}\n      \}"
fetch_replacement = """        setCategories(data);
        // Do not auto-select category anymore, user starts in Grid view.
      }"""
content = re.sub(fetch_pattern, fetch_replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

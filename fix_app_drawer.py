import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Change the drawer to a centered modal
pattern_drawer = r"            <motion\.div \n              initial=\{\{ x: '100%' \}\}\n              animate=\{\{ x: 0 \}\}\n              exit=\{\{ x: '100%' \}\}\n              transition=\{\{ type: 'spring', bounce: 0, duration: 0\.3 \}\}\n              className=\"fixed top-0 right-0 bottom-0 w-\[85%\] max-w-sm bg-white dark:bg-slate-950 z-\[70\] shadow-2xl flex flex-col\"\n            >"
replacement_drawer = """            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md max-h-[80vh] bg-white dark:bg-slate-950 z-[70] shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            >"""
content = re.sub(pattern_drawer, replacement_drawer, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)


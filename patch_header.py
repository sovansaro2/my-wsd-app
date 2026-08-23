import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

start_marker = "{/* Header & Selector */}"
end_marker = "</AnimatePresence>\n            </div>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    old_header = content[start_idx:end_idx]
    new_header = """{/* Detail Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-5 border-b border-gray-200 dark:border-slate-800 relative z-10 shadow-none dark:shadow-none sticky top-0">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedPeriod(null)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{selectedPeriod?.name}</h2>
              {selectedPeriod?.date_range_text && (
                 <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{selectedPeriod.date_range_text}</p>
              )}
            </div>"""
    content = content[:start_idx] + new_header + content[end_idx:]
    print("Successfully patched Header.")
else:
    print("Could not find boundaries")

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)

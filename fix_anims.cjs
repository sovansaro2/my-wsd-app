const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
files.push('src/App.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // This is a bit complex for a simple regex, because we want to replace <> with <React.Fragment> ? No, framer-motion fails with fragments.
  // We should replace `<>` inside `<AnimatePresence>` with `div` or separate the conditions.
  // Actually, replacing `<>` with `<div className="relative z-50">` and `</>` with `</div>` is the safest automated way!
  
  content = content.replace(/<AnimatePresence>([\s\S]*?)<\/AnimatePresence>/g, (match, p1) => {
    // inside AnimatePresence, replace <> with <div> and </> with </div>
    // Note: this assumes the fragment is the root of the conditional render.
    let newInner = p1.replace(/<>/g, '<div>').replace(/<\/>/g, '</div>');
    return `<AnimatePresence>${newInner}</AnimatePresence>`;
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
});

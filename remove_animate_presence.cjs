const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace <AnimatePresence ...> with <>
  content = content.replace(/<AnimatePresence[^>]*>/g, '<>');
  // Replace </AnimatePresence> with </>
  content = content.replace(/<\/AnimatePresence>/g, '</>');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Removed AnimatePresence from ${file}`);
  }
});

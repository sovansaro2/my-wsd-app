const fs = require('fs');

const filesToUpdate = [
  {
    path: 'src/components/AccountProfile.tsx',
    regex: />វត្តស្នាយដួច<\/h3>/g,
    replacement: '>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</h3>'
  },
  {
    path: 'src/components/Auth.tsx',
    regex: />វត្តស្នាយដួច<\/h2>/g,
    replacement: '>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</h2>'
  },
  {
    path: 'src/App.tsx',
    regex: />វត្តស្នាយដួច<\/h1>/g,
    replacement: '>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</h1>'
  },
  {
    path: 'index.html',
    regex: /<title>វត្តស្នាយដួច<\/title>/g,
    replacement: '<title>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</title>'
  },
  {
    path: 'src/components/InstallPrompt.tsx',
    regex: /ដំឡើងកម្មវិធី "វត្តស្នាយដួច"/g,
    replacement: 'ដំឡើងកម្មវិធី "គ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)"'
  }
];

filesToUpdate.forEach(file => {
  let content = fs.readFileSync(file.path, 'utf8');
  content = content.replace(file.regex, file.replacement);
  fs.writeFileSync(file.path, content);
  console.log(`Updated ${file.path}`);
});

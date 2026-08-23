const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.devDependencies = pkg.devDependencies || {};
const typesToMove = [
  '@types/cors',
  '@types/express',
  '@types/multer',
  '@types/node',
  '@types/ws'
];

typesToMove.forEach(t => {
  if (pkg.dependencies[t]) {
    pkg.devDependencies[t] = pkg.dependencies[t];
    delete pkg.dependencies[t];
  }
});

if (pkg.dependencies['autoprefixer']) {
  delete pkg.dependencies['autoprefixer'];
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

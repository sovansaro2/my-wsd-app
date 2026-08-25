const fs = require('fs');
let content = fs.readFileSync('src/components/PinPad.tsx', 'utf8');

content = content.replace(
  `className="flex flex-col items-center justify-center w-full max-w-sm mx-auto"`,
  `className="flex flex-col items-center justify-center w-full max-w-sm mx-auto relative"`
);

fs.writeFileSync('src/components/PinPad.tsx', content);

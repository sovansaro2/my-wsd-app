const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

// Add Lock as LockIcon to imports if it's not there
if (!content.includes('Lock as LockIcon')) {
  content = content.replace('UserCircle2,', 'UserCircle2, Lock as LockIcon,');
}

// Replace <Lock with <LockIcon
content = content.replace(/<Lock /g, '<LockIcon ');

fs.writeFileSync('src/components/AccountProfile.tsx', content);

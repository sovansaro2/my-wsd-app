const fs = require('fs');
let content = fs.readFileSync('server/auth/routes.ts', 'utf8');

// Replace the response in /me
content = content.replace(
  `res.json(profile || { id: user.id, email: user.email, role: 'user' });`,
  `res.json({
      ...(profile || { id: user.id, email: user.email, role: 'user' }),
      has_balance_pin: !!user.user_metadata?.balance_pin_hash
    });`
);

fs.writeFileSync('server/auth/routes.ts', content);
console.log('Patched auth routes');

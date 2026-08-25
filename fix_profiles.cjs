const fs = require('fs');
let content = fs.readFileSync('server/routers/profiles.ts', 'utf8');

content = content.replace(
  `res.json({ ...data, has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash });`,
  `res.json(data);`
);

content = content.replace(
  `res.json({ ...data, has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash });`,
  `res.json(data);`
);

content = content.replace(
  `res.json({ ...data, has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash });`,
  `res.json(data);`
);

fs.writeFileSync('server/routers/profiles.ts', content);
console.log('Fixed profiles.ts');

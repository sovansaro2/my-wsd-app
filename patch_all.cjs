const fs = require('fs');
const path = require('path');

// 1. Package.json
const pkgPath = path.join(__dirname, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.devDependencies = pkg.devDependencies || {};
  const typesToMove = ['@types/cors', '@types/express', '@types/multer', '@types/node', '@types/ws'];
  typesToMove.forEach(t => {
    if (pkg.dependencies[t]) {
      pkg.devDependencies[t] = pkg.dependencies[t];
      delete pkg.dependencies[t];
    }
  });
  if (pkg.dependencies['autoprefixer']) delete pkg.dependencies['autoprefixer'];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('package.json patched');
}

// 2. SQL Files
const dbSeedsDir = path.join(__dirname, 'db_seeds');
if (fs.existsSync(dbSeedsDir)) {
  
  // sql-seed.sql
  const sqlSeedPath = path.join(dbSeedsDir, 'sql-seed.sql');
  if (fs.existsSync(sqlSeedPath)) {
    let sqlSeed = fs.readFileSync(sqlSeedPath, 'utf8');
    // Ensure is_high_level is present
    if (!sqlSeed.includes('is_high_level BOOLEAN')) {
      sqlSeed = sqlSeed.replace('note TEXT,', 'note TEXT,\n  is_high_level BOOLEAN DEFAULT false,');
      fs.writeFileSync(sqlSeedPath, sqlSeed);
      console.log('sql-seed.sql patched');
    }
  }

  // seed_list2.sql
  const seedList2Path = path.join(dbSeedsDir, 'seed_list2.sql');
  if (fs.existsSync(seedList2Path)) {
    fs.writeFileSync(seedList2Path, `-- Insert the new category
INSERT INTO public.name_list_categories (name, description) 
VALUES ('បញ្ជីឈ្មោះបុណ្យផ្កា', 'បញ្ជីឈ្មោះអ្នកចូលរួមបុណ្យផ្កា')
RETURNING id;
`);
    console.log('seed_list2.sql patched');
  }

  // seed_list3.sql
  const seedList3Path = path.join(dbSeedsDir, 'seed_list3.sql');
  if (fs.existsSync(seedList3Path)) {
    fs.writeFileSync(seedList3Path, `-- Insert the new category for 'លុយចងដៃខ្ចី'
INSERT INTO public.name_list_categories (name, description) 
VALUES ('លុយចងដៃខ្ចី', '០៣-កក្កដា-២០២៦')
RETURNING id;
`);
    console.log('seed_list3.sql patched');
  }

  // update_categories.sql
  const updateCatPath = path.join(dbSeedsDir, 'update_categories.sql');
  if (fs.existsSync(updateCatPath)) {
    fs.writeFileSync(updateCatPath, `-- Update the first category name and set its event date
UPDATE public.name_list_categories 
SET 
  name = 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ',
  description = '២៩-មីនា-២០២៦'
WHERE name LIKE 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ%';

-- Update the second category event date
UPDATE public.name_list_categories 
SET 
  description = '០១-ឧសភា-២០២៦'
WHERE name = 'បញ្ជីឈ្មោះបុណ្យផ្កា';
`);
    console.log('update_categories.sql patched');
  }
}

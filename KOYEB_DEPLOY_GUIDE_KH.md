# សៀវភៅណែនាំអំពីការ Deploy លើ Koyeb (Koyeb Deployment Guide)

**Koyeb (koyeb.com)** គឺជាសេវាកម្ម Cloud Hosting ដ៏ល្អបំផុតមួយសម្រាប់ជំនួស Render និង Railway ដោយសារតែ៖
- **Free Tier (ឥតគិតថ្លៃ)**៖ ផ្តល់ Instance ដំណើរការឥតគិតថ្លៃ។
- **មិនទាមទារកាតធនាគារ (No Credit Card Required)** ពេលចុះឈ្មោះ។
- **មានទីតាំង Server នៅ Singapore** (ជិតប្រទេសកម្ពុជាបំផុត ធ្វើឱ្យគេហទំព័រដើរលឿនរហ័ស)។
- អាចភ្ជាប់ជាមួយ Custom Domain `watsnaydouch.site` បានដោយសេរី។

---

## ជំហានទី ១៖ ចុះឈ្មោះ និងបង្កើតគម្រោងលើ Koyeb
1. ចូលទៅកាន់គេហទំព័រ [https://www.koyeb.com](https://www.koyeb.com)
2. ចុច **Sign Up** ឬ **Start for free** រួចជ្រើសរើស **"Sign in with GitHub"** (ដើម្បីភ្ជាប់ជាមួយ GitHub របស់អ្នក)។
3. នៅលើផ្ទាំង Dashboard របស់ Koyeb សូមចុចលើប៊ូតុងពណ៌ខៀវ **"Create Service"** (ឬ **"Create App"** / **"Deploy"**)។

---

## ជំហានទី ២៖ ជ្រើសរើសប្រភពកូដ (Source)
1. នៅត្រង់ Deployment Method សូមជ្រើសរើស **"GitHub"**។
2. ជ្រើសរើស **Repository** នៃគម្រោងរបស់អ្នក (ឧ. `wat-snay-douch` ឬ `my-wsd-app`)។
3. **Branch:** ជ្រើសរើស `main`។

---

## ជំហានទី ៣៖ កំណត់ការកំណត់ (Configuration & Build)
Koyeb នឹងបង្ហាញផ្ទាំង Settings សូមកំណត់ដូចខាងក្រោម៖
- **Builder:** ជ្រើសរើស **`Buildpack`** (ឬ Node.js)
- **Build Command:** វាយបញ្ចូល៖
  ```text
  npm install && npm run build
  ```
- **Run Command:** វាយបញ្ចូល៖
  ```text
  npm run start
  ```
- **Port:** កំណត់លេខ **`3000`** (ឬទុកឱ្យវា Detect ស្វ័យប្រវត្ត)

---

## ជំហានទី ៤៖ ជ្រើសរើស Region (ទីតាំង Server)
- ត្រង់ **Region** សូមជ្រើសរើស **`Singapore (sin)`** ដើម្បីទទួលបានល្បឿនលឿនបំផុត។
- ត្រង់ **Instance Type** សូមជ្រើសរើស **`Free`** (Nano ឥតគិតថ្លៃ)។

---

## ជំហានទី ៥៖ បញ្ចូល Environment Variables (អថេរបរិស្ថាន)
នៅផ្នែក **Environment Variables** សូមចុច **"Add Variable"** រួចបញ្ចូល Key និង Value ដូចខាងក្រោម៖

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `VITE_SUPABASE_URL` | `https://vstwhhuqgeimssqxfmij.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(Anon Key របស់អ្នក)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Service Role Key របស់អ្នក)* |
| `JWT_SECRET_KEY` | `wsd-super-secret-jwt-key-2026` |

---

## ជំហានទី ៦៖ ចុច Deploy
1. ចុចប៊ូតុង **"Deploy"** នៅខាងក្រោមបង្អស់។
2. រង់ចាំប្រហែល ២ ទៅ ៣ នាទី Koyeb នឹងដំណើរការ Build និង Start Server។
3. នៅពេលជោគជ័យ វានឹងចេញសញ្ញាគ្រីសពណ៌បៃតង **Healthy** ហើយផ្តល់ Link មួយដូចជា `https://...koyeb.app`។

---

## ជំហានទី ៧៖ ភ្ជាប់ Domain `watsnaydouch.site` (Custom Domain)
1. នៅក្នុង Koyeb Service របស់អ្នក សូមចុចចូលទៅកាន់ **Settings** -> **Domains**។
2. ចុច **Add Domain** រួចវាយបញ្ចូលឈ្មោះ Domain: `watsnaydouch.site`
3. Koyeb នឹងបង្ហាញ Record CNAME មួយ (ឧ. `...koyeb.app`)។
4. ចូលទៅកាន់ **Cloudflare** -> **DNS Records** ហើយកែ CNAME record ទាំងពីរ (`@` និង `www`) ឱ្យចង្អុលទៅកាន់អាសយដ្ឋាន Koyeb ថ្មីនោះជាការស្រេច!

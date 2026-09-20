# សៀវភៅណែនាំអំពីការ Deploy និងប្រើប្រាស់ Cloudflare (Cloudflare Deployment Guide)

ការជ្រើសរើស **Cloudflare** គឺជាជម្រើសដ៏ល្អបំផុត ព្រោះ Cloudflare មានប្រព័ន្ធ **Edge Network (CDN)** នៅជិតប្រទេសកម្ពុជា (មាន Pop នៅភ្នំពេញ បាងកក សិង្ហបុរី) ដែលធ្វើឱ្យគេហទំព័របើកឡើងលឿនដូចផ្លេកបន្ទោរ មិនចេះ Sleep ហើយ **Free Tier ១០០% គ្មានដែនកំណត់ Bandwidth**។

---

## ស្ថាបត្យកម្មដែលល្អ និងពេញនិយមបំផុត (Recommended Architecture)

ដោយសារតែកម្មវិធីរបស់យើងមាន ២ ផ្នែក៖
1. **Frontend (React + Vite + Tailwind):** ជាទំព័រ UI ដ៏ទំនើប
2. **Backend API (Node.js Express + Supabase):** ជាអ្នកគ្រប់គ្រងទិន្នន័យ ការទាញយក Excel និងការបញ្ជាក់សិទ្ធិ

👉 **វិធីល្អឥតខ្ចោះបំផុតគឺ៖**
- **Frontend ដាក់លើ Cloudflare Pages (Free ១០០% មិនដែល Sleep):** ដំណើរការលឿនបំផុត គាំទ្រ Custom Domain (ឧ. `watsnaydouch.site`) និងមាន SSL ដោយស្វ័យប្រវត្ត។
- **Backend API ដាក់លើ Cloud Server (ឧ. Render / VPS / Fly.io) ហើយចង្អុល Domain កាត់តាម Cloudflare (Orange Cloud Proxy):** ដើម្បីទទួលបានសុវត្ថិភាពខ្ពស់បំផុត និងល្បឿន Cache ពី Cloudflare។

---

## វិធីទី ១៖ Deploy ផ្នែក Frontend ទៅកាន់ Cloudflare Pages

### ជំហានទី ១៖ ចូលទៅកាន់ Cloudflare Pages
1. ចូលទៅកាន់ [https://dash.cloudflare.com](https://dash.cloudflare.com) រួច Sign In (ឬ Sign Up ប្រសិនបើមិនទាន់មានគណនី)។
2. នៅម៉ឺនុយខាងឆ្វេង ជ្រើសរើសយក **Workers & Pages**។
3. ចុចប៊ូតុង **"Create application"** រួចជ្រើសយក Tab **"Pages"**។
4. ចុចយក **"Connect to Git"**។

### ជំហានទី ២៖ ជ្រើសរើស GitHub Repository
1. ជ្រើសរើស GitHub Account និង Repository នៃគម្រោង **WSD App** របស់អ្នក។
2. ចុចប៊ូតុង **"Begin setup"**។

### ជំហានទី ៣៖ កំណត់ Build Settings
បំពេញការកំណត់ដូចខាងក្រោម៖
- **Project name:** `watsnaydouch` (ឬឈ្មោះតាមចិត្តចង់បាន)
- **Production branch:** `main`
- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### ជំហានទី ៤៖ បញ្ចូល Environment Variables
ចុចលើ **Environment variables (advanced)** រួចបញ្ចូល Key & Value៖
- `VITE_SUPABASE_URL` = `https://vstwhhuqgeimssqxfmij.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = *(Anon Key របស់អ្នក)*
- `VITE_API_BASE_URL` = *(URL នៃ Backend API របស់អ្នក ឧ. `https://api.watsnaydouch.site` ឬ URL នៃ Render Server)*

### ជំហានទី ៥៖ ចុច Save and Deploy
- ចុចប៊ូតុង **"Save and Deploy"**។
- Cloudflare Pages នឹងដំណើរការ Build ប្រហែល ១ នាទី។
- នៅពេលជោគជ័យ អ្នកនឹងទទួលបាន Link ឥតគិតថ្លៃមួយ ឧទាហរណ៍៖ `https://watsnaydouch.pages.dev`។
- ឯកសារ `public/_redirects` ត្រូវបានរៀបចំរួចជាស្រេច ធានាថាការ Refresh ទំព័រនានាមិនជាប់កំហុស 404 Not Found ឡើយ។

---

## វិធីទី ២៖ ភ្ជាប់ Custom Domain (ឧ. `watsnaydouch.site`) ជាមួយ Cloudflare

ប្រសិនបើលោកអ្នកមាន Domain ផ្ទាល់ខ្លួន៖
1. នៅក្នុង Cloudflare Pages ចូលទៅកាន់ Tab **"Custom domains"**។
2. ចុច **"Set up a custom domain"**។
3. បញ្ចូលឈ្មោះ Domain របស់អ្នក ឧ. `watsnaydouch.site` (ឬ `app.watsnaydouch.site`)។
4. Cloudflare នឹងរៀបចំ DNS និងផ្តល់វិញ្ញាបនបត្រ **SSL/HTTPS** ដោយឥតគិតថ្លៃក្នុងរយៈពេល ២-៥ នាទី។

---

## វិធីទី ៣៖ ការពារ និងបង្កើនល្បឿន Backend តាមរយៈ Cloudflare DNS (Orange Cloud)

ប្រសិនបើ Server Backend ដំណើរការលើ Cloud (Render/Railway/VPS)៖
1. បន្ថែម Subdomain សម្រាប់ API នៅក្នុង Cloudflare DNS:
   - **Type:** `CNAME`
   - **Name:** `api` (ឧ. `api.watsnaydouch.site`)
   - **Target:** Link របស់ Backend (ឧ. `wat-snay-douch.onrender.com`)
   - **Proxy status:** **Proxied (ពពកពណ៌ទឹកក្រូច - Orange Cloud)**
2. នោះរាល់ការហៅទៅកាន់ API នឹងត្រូវបានការពារដោយ Cloudflare DDoS Protection និងមានល្បឿនលឿនទ្វេដង។

# សៀវភៅណែនាំអំពីការ Deploy និងប្រើប្រាស់ Cloudflare (Full-Stack Cloudflare Workers & Pages)

គម្រោងនេះត្រូវបានរៀបចំរួចរាល់ជា **Full-Stack Cloudflare Workers + Static Assets** (`wrangler.json` + `worker/index.ts`) ដែលអាចដំណើរការទាំង **Frontend (React)** និង **Backend API (`/api/*`)** នៅលើ Cloudflare តែមួយគត់ — **មិនចាំបាច់ពឹងលើ Render, មិនចេះ Sleep, គ្មានកំណត់ 750 ម៉ោង និងឥតគិតថ្លៃ ១០០%**។

---

## របៀប Deploy លើ Cloudflare Workers (`my-wsd-app`) តាម GitHub (ណែនាំបំផុត)

1. ចូលទៅកាន់ Cloudflare Dashboard -> **Workers & Pages** -> ជ្រើសរើស Worker **`my-wsd-app`** (ដែលបានភ្ជាប់ជាមួយ GitHub `sovansaro2/my-wsd-app`)។
2. ចូលទៅ **Settings** -> **Build** (Builds & Deployments) ហើយពិនិត្យមើល៖
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** ទុកទទេ (ឬ `/`)
3. ចូលទៅ **Settings** -> **Variables and Secrets** -> បន្ថែមអថេរខាងក្រោម (ជា Secret ឬ Text)៖
   - `VITE_SUPABASE_URL` = `https://vstwhhuqgeimssqxfmij.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = *(Anon Key របស់អ្នក)*
   - `SUPABASE_SERVICE_ROLE_KEY` = *(Service Role Key របស់អ្នក)*
   - `JWT_SECRET_KEY` = `wsd-super-secret-jwt-key-2026`
   *(ចំណាំ: កុំដាក់ `VITE_API_BASE_URL` ឬទុកឱ្យទទេ ដើម្បីឱ្យ Frontend ហៅ `/api/*` ទៅកាន់ Cloudflare Worker ដោយផ្ទាល់លើ Domain តែមួយ)*
4. ចូលទៅ **Settings** -> **Domains & Routes** -> ចុច **Add** ដើម្បីភ្ជាប់ Custom Domain **`watsnaydouch.site`** (និង `www.watsnaydouch.site` បើត្រូវការ)។
5. ចុច **Push កូដទៅ GitHub** ឬចុច **Retry deployment** នៅលើ Cloudflare នោះទាំង Frontend និង Backend នឹងដំណើរការលើ Cloudflare ទាំងស្រុង!

---

## វិធីជំនួស៖ Deploy តែ Frontend ទៅ Cloudflare Pages + Backend ផ្សេង (ចាស់)

ការជ្រើសរើស **Cloudflare** គឺជាជម្រើសដ៏ល្អបំផុត ព្រោះ Cloudflare មានប្រព័ន្ធ **Edge Network (CDN)** នៅជិតប្រទេសកម្ពុជា (មាន Pop នៅភ្នំពេញ បាងកក សិង្ហបុរី) ដែលធ្វើឱ្យគេហទំព័របើកឡើងលឿនដូចផ្លេកបន្ទោរ មិនចេះ Sleep ហើយ **Free Tier ១០០% គ្មានដែនកំណត់ Bandwidth**។

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

# សៀវភៅណែនាំអំពីការ Deploy គម្រោងលើ Render (Render Deployment Guide)

ដោយសារតែគម្រោងលើ **Railway** បានផុតកំណត់ (Expired) លោកអ្នកអាចផ្លាស់ប្តូរមកប្រើប្រាស់ **Render (render.com)** ដែលជាសេវាកម្ម Cloud ឥតគិតថ្លៃ (Free Tier) ល្អបំផុតសម្រាប់ Node.js + Express + React។

---

## ជំហានទី ១៖ រៀបចំកូដនៅលើ GitHub
1. ត្រូវប្រាកដថាលោកអ្នកបាន **Push** ឬ **Sync** កូដចុងក្រោយបង្អស់នេះទៅកាន់ GitHub Repository របស់អ្នករួចរាល់។
2. ឯកសារកំណត់រចនាសម្ព័ន្ធ `render.yaml` ត្រូវបានរៀបចំរួចជាស្រេចនៅក្នុងគម្រោងនេះ។

---

## ជំហានទី ២៖ បង្កើត Web Service លើ Render
1. ចូលទៅកាន់គេហទំព័រ [https://render.com](https://render.com) រួចចុះឈ្មោះ ឬ **Sign in with GitHub**។
2. ចុចប៊ូតុង **"New +"** នៅផ្នែកខាងលើ រួចជ្រើសរើសយក **"Web Service"**។
3. ជ្រើសរើស **"Build and deploy from a Git repository"** រួចចុច **Next**។
4. ជ្រើសរើស **GitHub Repository** នៃគម្រោងរបស់អ្នក (ប្រសិនបើមិនទាន់ឃើញទេ សូមចុច "Configure GitHub app" ដើម្បីផ្តល់សិទ្ធិឱ្យ Render មើលឃើញ Repo របស់អ្នក)។

---

## ជំហានទី ៣៖ កំណត់ការកំណត់ (Settings)
បំពេញទិន្នន័យដូចខាងក្រោម៖
- **Name:** `wat-snay-douch` (ឬឈ្មោះតាមចិត្តចង់បាន)
- **Region:** `Singapore (Southeast Asia)` *(ណែនាំឱ្យជ្រើសរើសកន្លែងនេះ ព្រោះនៅជិតប្រទេសកម្ពុជា ធ្វើឱ្យល្បឿនបើកកម្មវិធីលឿនបំផុត)*
- **Branch:** `main` (ឬ branch ដែលអ្នកប្រើ)
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Instance Type:** `Free`

---

## ជំហានទី ៤៖ បញ្ចូល Environment Variables (អថេរបរិស្ថាន)
នៅត្រង់ចំណុច **"Environment Variables"** (ឬទំព័រ **Environment** នៃ Web Service) សូមចុច **Add Environment Variable** រួចបញ្ចូល Key និង Value ដូចខាងក្រោម៖

| Key | Value | ការពន្យល់ |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | កំណត់ឱ្យរត់ជា Production Mode |
| `VITE_SUPABASE_URL` | `https://vstwhhuqgeimssqxfmij.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | *(Anon Key របស់អ្នក)* | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Service Role Key របស់អ្នក)* | Supabase Service Role Key (សម្ងាត់) |
| `JWT_SECRET_KEY` | *(អក្សរសម្ងាត់វែងណាមួយ ឧ. `wsd-super-secret-jwt-key-2026`)* | សម្រាប់បង្កើត Token សុវត្ថិភាព |

*(ចំណាំ៖ Render នឹងផ្តល់អថេរ `PORT` ដោយស្វ័យប្រវត្ត ហើយ Server របស់យើងបានកំណត់ឱ្យទទួលយក `process.env.PORT` លើ Render រួចជាស្រេច)*

---

## ជំហានទី ៥៖ ចុច Create Web Service & រង់ចាំ Deploy
1. ចុចប៊ូតុង **"Deploy Web Service"** (ឬ **"Create Web Service"** នៅខាងក្រោមបង្អស់)។
2. Render នឹងចាប់ផ្តើមទាញយកកូដ ដំឡើង `node_modules` និងធ្វើការ `npm run build`។
3. នៅពេលដំណើរការជោគជ័យ អ្នកនឹងឃើញសារ **`Express Backend + Vite Frontend is running...`** និងពាក្យ **`Live`** ពណ៌បៃតង។
4. Render នឹងផ្តល់ Link ផ្លូវការមួយដល់អ្នក ឧទាហរណ៍៖ `https://wat-snay-douch.onrender.com`។

---

## ចំណុចសំខាន់ៗដែលគួរដឹងអំពី Render Free Tier
- **Auto Sleep (ការផ្អាកបណ្តោះអាសន្នពេលគ្មានអ្នកចូលមើល):**
  - នៅលើ Free Tier ប្រសិនបើគ្មានអ្នកចូលមើលលើសពី ១៥ នាទី Server នឹងគេង (Sleep) ដោយស្វ័យប្រវត្តដើម្បីសន្សំធនធាន។
  - នៅពេលមានអ្នកបើក Link ម្តងទៀត វានឹងចំណាយពេលប្រហែល ៣០-៥០ វិនាទី ដើម្បីដាស់ Server ឱ្យដើរឡើងវិញ (Cold Start)។
- **ដំណោះស្រាយកុំឱ្យ Server គេង (Keep Server Awake):**
  - លោកអ្នកអាចប្រើប្រាស់សេវាឥតគិតថ្លៃដូចជា [UptimeRobot.com](https://uptimerobot.com) ឬ [Cron-Job.org](https://cron-job.org) ដោយកំណត់ឱ្យវា Ping ទៅកាន់ Link Health Check រៀងរាល់ ១០ នាទីម្តង៖
    - URL Ping: `https://wat-snay-douch.onrender.com/api/health`
    - វិធីនេះនឹងធ្វើឱ្យ Server ដំណើរការ (Online) ២៤ ម៉ោងលើ ២៤ ម៉ោង មិនងាយស្លាប់ឡើយ។

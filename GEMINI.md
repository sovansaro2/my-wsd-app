# Project Rules & Custom Instructions

## User Design Preferences
- **No Background Boxes or Container Background Colors:**
  - Avoid colored background squares, circles, or tinted container boxes behind icons, tags, badges, and numeric counters (e.g., do NOT wrap icons in `bg-orange-50`, `bg-gray-100`, etc.).
  - Keep icons and labels clean, transparent, and direct.
- **High-Tier Donors Transparency:**
  - High-tier donors list on the dashboard must be public with amounts directly visible at all times.
  - Do not add hide/show toggle buttons or PIN protection for this public donors list.

## Typography & Font Rules (ច្បាប់កំណត់ពុម្ពអក្សរ ខ្មែរ និង អង់គ្លេស)
- **English Characters & Numbers (អក្សរអង់គ្លេស/ឡាតាំង និងតួលេខ):**
  - **ដាច់ខាតត្រូវតែប្រើប្រាស់ Font "Rajdhani"** (គាំទ្រកម្រាស់ 300 Light, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold) សម្រាប់រាល់ពាក្យ ឃ្លា និងតួលេខជាភាសាអង់គ្លេសទាំងអស់ក្នុងកម្មវិធី។
  - ហាមដាច់ខាតមិនឱ្យប្តូរ Font អង់គ្លេសទៅ Inter, Roboto ឬ Font ផ្សេងទៀតដោយគ្មានការស្នើសុំពីអ្នកប្រើប្រាស់។
- **Khmer Characters (អក្សរខ្មែរ):**
  - **Font "Battambang" (អត្ថបទ និងតួសេចក្តី):** ប្រើសម្រាប់អត្ថបទធម្មតា (Body text, Paragraphs, Form labels, Descriptions, Buttons, Steps, Table rows, Toast notifications, Modal content)។
  - **Font "Koulen" (`font-title` - ចំណងជើងទូទៅ):** ប្រើសម្រាប់ចំណងជើងធំៗ ក្បាលទំព័រ ឈ្មោះទំព័រ ឈ្មោះកម្មវិធី និងឈ្មោះព្រះសង្ឃ/ឥស្សរជនសំខាន់ៗ (ឧ. ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី)។
  - **Font "Moul" (`font-moul` - ចំណងជើងផ្លូវការ/បុរាណ):** ប្រើសម្រាប់ក្បាលលិខិតផ្លូវការ ក្បាលទំព័រវត្តអារាម វិញ្ញាបនបត្រ ឬចំណងជើងបុរាណបែបពុទ្ធសាសនា។
- **Hybrid Texts (ឃ្លាលាយគ្នារវាងខ្មែរ និងអង់គ្លេស):**
  - មិនថានៅទីតាំងណាទេ ក្នុងប្រយោគ ឬសមាសភាគ UI តែមួយដែលមានពាក្យខ្មែរ និងអង់គ្លេសលាយគ្នា (ដូចជា: ឈ្មោះ Browser *Google Chrome*, *Safari*, *Samsung Internet*, ឈ្មោះឧបករណ៍ *Android*, *iPhone*, *iPad*, កំណែកម្មវិធី *Version 1.2.0*, លេខរៀង *01, 02*):
    - ពាក្យ និងលេខជាភាសាអង់គ្លេស ត្រូវតែបង្ហាញដោយ **Rajdhani** (ច្បាស់ ត្រង់ ជ្រុងទាន់សម័យ)។
    - ពាក្យជាភាសាខ្មែរ ត្រូវតែបង្ហាញដោយ Font ខ្មែរត្រឹមត្រូវ (**Battambang**, **Koulen**, ឬ **Moul** ទៅតាមកម្រិត)។
    - ត្រូវធានាថា Font ទាំងពីរបង្ហាញរួមគ្នាដោយសុខដុម មិនជាន់បន្ទាត់ មិនបាត់ស្រៈ ឬជើងអក្សរខ្មែរឡើយ។
- **Font Stacks & CSS Consistency:**
  - ត្រូវរក្សាទុក Google Fonts ក្នុង `index.html` និង `src/index.css` ឱ្យមាន: `Rajdhani:wght@300;400;500;600;700`, `Battambang:wght@400;700`, `Koulen`, និង `Moul` ជានិច្ច។
  - `font-family` ស្តង់ដារត្រូវរៀបចំ: `'Rajdhani', 'Battambang', 'Khmer OS Battambang', sans-serif` ដើម្បីឱ្យអក្សរអង់គ្លេស Render ជា Rajdhani ស្វ័យប្រវត្ត ហើយអក្សរខ្មែរ Render ជា Battambang ស្វ័យប្រវត្តិ។

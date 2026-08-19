require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = `ឈ្មោះ	ចំនួនបច្ច័យ	ផ្សេង
ឧបាសិកា ហៃ	100,000៛	
កុង សៅ យាយ ឆេង	40,000៛	ជើងគួន
វត្ត ក្ដីទន្ទឹម	150,000៛	
វត្ត អង្គមានជ័យ	235,000៛	
វត្ត អង្គចង្អេរ	120,000៛	
វត្ត ប្រាសាទមង្គល	140,000៛	
ភូមិស្វាយចេក	100,000៛	
ទ្រាលើ	158,000៛	
ត្បាច	225,000៛	
តាខូយ	120,000៛	
ភូមិថ្មី	260,000៛	
ស្វាយពពារ	370,000៛	
ក្បាលសំរោង	150,000៛	
រដ្ឋបាលឃុំជើងគួន	80,000៛	
ភូមិស្មន់មុន្នី	350,000៛	
ភូមិក្រាំងឡង	100,000៛	
អញ្ចាញខាងលិច	70,000៛	
ត្រពាំងវិហារ	200,000៛	
ភូមិព្រៃរបង	3,040,000៛	មានបញ្ជីឈ្មោះ
វត្ត ខ្សាច់សរ	140,000៛	
ប្រុស-នាង	20,000៛	ជើងគួន
លោកយាយ នន ព្រមទាំងកូនចៅ	200,000៛	
ស៊ុន-យាង	20,000៛	ជើងគួន
យាយ ឡាំង	10,000៛	
លាស់ ឡៃ	20,000៛	
ង៉ែត ណយ ព្រមទាំងកូនចៅ	30,000៛	
ជឿន-សាវ៉ាន	60,000៛	ព្រៃចំបក់
ចយ-ធា	15,000៛	
លុយ ងន ទិត	30,000៛	
យាយ ទង	10,000៛	
គ្រូ ថា ហ៊ី	50,000៛	
លន ហៀង	10,000៛	
រុន លីម	10,000៛	
សារី ចន្នី	10,000៛	
យួន យីម	10,000៛	
ប៉ែត ចាយ	15,000៛	
លី ពៅ	20,000៛	
ស៊ុយ ណយ	10,000៛	
ឃីម ប៉ូ	5,000៛	
ចាន់ ផល និច	10,000៛	
សូផាត អិត	20,000៛	
ភ្លី នី	5,000៛	
តេង នុយ	10,000៛	
មួន ណាង	10,000៛	
យាយ អេង	10,000៛	
ម៉ាស់ ម៉េត	10,000៛	
ផល ខេង	100,000៛	
ស៊្រុន ចាន់មុំ	20,000៛	
សាក់ ផារី	50,000៛	
ចាន់ រ៉ា	20,000៛	
ទ្រី ជា	20,000៛	
គន ចាន់ណា	10,000៛	
បញ្ញា លីម	20,000៛	
មាន ស៊្រឹង ព្រមទាំងកូនចៅ	100,000៛	
សល់ តា	20,000៛	
កុងផាន ង៉ែត ព្រមទាំងកូនចៅ	200,000៛	
ធឿន វី	20,000៛	
ភា តារា	20,000៛	
ឃីម រ័ត្ន	10,000៛	
លោកយាយ ផេង ព្រមទាំងកូនចៅ	100,000៛	
ឈុន សុខា	20,000៛	
ជាវ យ៉ុន	15,000៛	
ហេង លាង ព្រមទាំងកូនចៅ	40,000៛	
យាយ ស៊្រី	10,000៛	
យាយ ណែម	20,000៛	
គ្រូ សន សុន	10,000៛	តាខូយ
ភន ចេង	20,000៛	ជើងគួន
សុខា ហ៊ន	10,000៛	
ស៊ី ដែន	20,000៛	
ហ៊ល ដែម	20,000៛	
គ្រីនឡាំងអ៊ី	10,000៛	
យាយ ណាវ	20,000៛	
ហ៊ី គង់ ព្រមទាំងកូនចៅ	40,000៛	
ភាស់ ណាត	15,000៛	
យាយ គីម	10,000៛	
យាយ យឺន	30,000៛	
ហេង លីន	20,000៛	
ហៀត	10,000៛	
សល់ ឌី	20,000៛	
កុង ខេ យាយ រឿន	10,000៛	ជើងគួន
វ៉ាង ផាអូន	20,000៛	
ស្រ៊ឹង ង៉ែត	30,000៛	
សុខ ហ៊ង	10,000៛	
ពត គីម	100,000៛	
ស្រេង ឡៃ	15,000៛	
យាយ ឡាង	10,000៛	
យាយ ខន	5,000៛	
វ៉ាន់ បូ	20,000៛	
លី ថន, យាយ កែវ,ស្រៀង សុផាត,លឹម ស្រីម៉ាច	662,000៛	
ពេជ ណេង ព្រមទាំងកូនចៅ	15,000៛	
រឹម យឺ	100,000៛	
លន សារី	20,000៛	
ណាវ យឿន	15,000៛	
ហឿន ឡា	20,000៛	
ម៉េងលី អូន	5,000៛	
ប៉ឹង យឿន	10,000៛	
ម៉ៅ ប៊ុនរិទ្ធិ (វណ្ណា)	180,000៛	ភ្នំពេញ
រិត ភី	20,000៛	
លោកយាយ អ៊ូ សយ	100,000៛	ភ្នំពេញ
វុធ វ៉ាន់	40,000៛	
ផូ យ៉ាន	20,000៛	
ពេទ្យ បុល ផល្លា	300,000៛	
ថឺង លន់	100,000៛	
ស៊ុក កល្យាណ	50,000៛	
គ្រូ អៀង ភរិយា	300,000៛	ភ្នំពេញ
កាំង យាន ព្រមទាំងកូនចៅ	120,000៛	
ធី រីម	20,000៛	
ខេម ឡាយ	20,000៛	
ស្រៀង វណ្ណី	40,000៛	ភ្នំពេញ
គៀន ហេង	15,000៛	
ខេន សម្បត្តិ	10,000៛	
វត្ត បាណានុគ្រោះ	200,000៛	
វត្ត អំពិលបី	120,000៛`;

async function run() {
  // 1. Get Category ID
  const { data: catData, error: catErr } = await supabase.from('name_list_categories').select('id').eq('name', 'បញ្ជីឈ្មោះបុណ្យផ្កា').single();
  if (catErr || !catData) {
      console.log('Category not found!', catErr);
      return;
  }
  const catId = catData.id;

  // 2. Delete existing
  await supabase.from('name_list_records').delete().eq('category_id', catId);
  console.log('Deleted old records for', catId);

  // 3. Prepare new records
  const lines = rawData.split('\n').filter(l => l.trim().length > 0);
  let recordsToInsert = [];

  for (let i = 1; i < lines.length; i++) { // Skip header row at index 0
    const line = lines[i];
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    const name = parts[0].trim();
    const amountStr = parts[1].trim().replace(/,/g, '').replace(/៛/g, '');
    const amount = parseInt(amountStr, 10);
    const note = (parts[2] && parts[2].trim()) ? parts[2].trim() : null;
    
    if (!isNaN(amount)) {
       recordsToInsert.push({
         category_id: catId,
         name,
         amount,
         note
       });
    }
  }

  // 4. Insert chunks
  const chunkSize = 20;
  for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
    const chunk = recordsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('name_list_records').insert(chunk);
    if (error) console.error('Error inserting chunk:', error);
  }
  console.log('Inserted', recordsToInsert.length, 'records.');
}

run();

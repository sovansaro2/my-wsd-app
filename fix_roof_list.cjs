require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = `ឈ្មោះ	ចំនួនបច្ច័យ	ផ្សេងៗ	តាមរយៈ
កុង សេង យាយ ផេង ព្រមទាំងកូនចៅ	600,000៛	ថ្ងៃបុណ្យកុងសេង	
លោកយាយ ស៊្រឹង	100,000៛		
កុង ហេង	100,000៛		
វុធ វ៉ាន់	200,000៛		
ទិត្យ ម៉ៅ	50,000៛		
លោកយាយ ស៊្រី ព្រមទាំងកូនចៅ	60,000៛		
កុង ឈន យាយ ញ៉ាង 	60,000៛	(អង្គបូរី)	
យាយ រី ព្រះទាំងកូនចៅ	60,000៛	(អង្គបូរី)	
លោកយាយ វី	200,000៛		
វ៉ាន់ សំបូ	50,000៛		
ឧបាសិកា ហៃ ព្រមទាំងកូនចៅ	100,000៛	ថ្ងៃឡើងផ្ទះបងតុលា	
លោកយាយ ខន ព្រមទាំងកូនចៅ	100,000៛		
ឧបាសិកា កឹម ព្រើម	100,000៛	បុណ្យសពយាយលោកបងចិត្ត ព្រៃរបង	
ទូច ឈន ព្រមទាំងកូនចៅ	100,000៛	ក្រាំងឡង	
ឆេង ប៉េងគុណ, ហៀង ស្រីនាង, ជុនសុភាព, ចែដា	121,000៛		
ហាប់ ពុទ្ធី (Sing Sing)	60,000៛	សៃវ៉ា	
អ្នកស្រី ជា ឡា ព្រមទាំងបុត្រ	60,000៛		
ថៅ ឡាយ, ឈុន ស្រូយ	120,000៛		
លោក ម៉ៅ ប៊ុនរិទ្ធ	100,000៛	(កូនចៅកុងណា)ភ្នំពេញ 	លោកមេភូមិពន្សាំង
ឃី មាលា ព្រមទាំងក្រុមការងារ	40,000៛	ពន្សាំង	លោកមេភូមិពន្សាំង
បឿយ សីនណា	40,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
បឿយ កន្និដ្ឋា	60,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ម៉ៅ សុផា	10,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
មាល ស្រីណែត	20,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ដេត ចាន់ធីម	50,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ឡេង រ៉ាន់ឌី	40,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ម៉ៅ ផល	20,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ផុន សម្បត្តិ	50,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
បឿ ណាវិត	20,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ថា ចាន់ថន	30,000៛	ភ្នំពេញ	លោកមេភូមិពន្សាំង
ឧបាសក ស៊្រីម ឧបាសិកា ង៉ែត	60,000៛	ព្រៃផ្ដៅ	លោកបងចិត្ត
ឆេង ប៉េងគុណ, ហៀង ស្រីនាង	80,000៛	ភ្នំពេញ,ពន្សាំង	ហៀរ ស្រីនាង
ឧបាសក ឆេង ស៊ុយ ឧបាសិកា ធា អួក	100,000៛	ជើងគួន	
កូនចៅ កុង សុក យាយ សាំង	60,000៛	ជើងគួន	
ក្រុមកូនចៅ លោកយាយ ធី (ក្រាំងលៀវ)	300,000៛	ក្រាំងលៀវ	
ឧបាសិកា ឯក ស៊ីនួន, ឯក សសុផានី, ផាំង អុីម	240,000៛	ភ្នំពេញ,ទ្រាលើ,ជើងគួន	
កប ខេង ព្រមទាំងកូនចៅ	60,000៛	ភូមិថ្កូវ	
ជ្រៀង ឡៃ	50,000៛	ពន្សាំង	
លោកយាយ ទង ព្រមទាំងកូនចៅ	220,000៛	ពន្សាំង`;

async function run() {
  // 1. Get Category ID
  const { data: catData, error: catErr } = await supabase.from('name_list_categories').select('id').eq('name', 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ').single();
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
  
  // Base timestamp (current time)
  let baseTime = new Date().getTime();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    const name = parts[0].trim();
    const amountStr = parts[1].trim().replace(/,/g, '').replace(/៛/g, '');
    const amount = parseInt(amountStr, 10);
    const note = (parts[2] && parts[2].trim()) ? parts[2].trim() : null;
    const referrer = (parts[3] && parts[3].trim()) ? parts[3].trim() : null;
    
    const created_at = new Date(baseTime - (i * 1000)).toISOString();

    if (!isNaN(amount)) {
       recordsToInsert.push({
         category_id: catId,
         name,
         amount,
         note,
         referrer,
         created_at
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
  console.log('Inserted', recordsToInsert.length, 'records with staggered timestamps.');
}

run();

import re

with open('server/routers/name_lists.ts', 'r') as f:
    content = f.read()

route = """router.get('/donors-100k', async (req, res) => {
  try {
    const { data: categories, error: catError } = await supabaseAdmin.from('name_list_categories').select('id, name');
    if (catError) throw catError;

    // Fetch records where is_100k_donor is true
    const { data: records, error: recError } = await supabaseAdmin
      .from('name_list_records')
      .select('*')
      .eq('is_100k_donor', true)
      .order('amount', { ascending: false });
      
    if (recError) {
      // Fallback if column doesn't exist yet
      if (recError.code === '42703' || recError.message?.includes('does not exist')) {
         return res.json([]);
      }
      throw recError;
    }

    const catMap: Record<string, string> = {};
    categories?.forEach(c => {
      catMap[c.id] = c.name;
    });

    const result = records?.map(r => ({
      ...r,
      category_name: catMap[r.category_id] || 'ផ្សេងៗ'
    })) || [];

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ detail: error.message });
  }
});"""

new_route = """router.get('/donors-100k', async (req, res) => {
  try {
    const { data: categories, error: catError } = await supabaseAdmin.from('name_list_categories').select('id, name');
    if (catError) throw catError;

    let result: any[] = [];

    // 1. Fetch NameList records where is_100k_donor is true
    const { data: records, error: recError } = await supabaseAdmin
      .from('name_list_records')
      .select('*')
      .eq('is_100k_donor', true);
      
    if (!recError && records) {
      const catMap: Record<string, string> = {};
      categories?.forEach(c => {
        catMap[c.id] = c.name;
      });

      const nameListResults = records.map(r => ({
        ...r,
        category_name: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ'
      }));
      result = [...result, ...nameListResults];
    }

    // 2. Fetch Financial records where is_high_level is true
    const { data: finRecords, error: finError } = await supabaseAdmin
      .from('financial_records')
      .select('*')
      .eq('is_high_level', true);

    if (!finError && finRecords) {
      const finResults = finRecords.map(f => ({
        id: f.id,
        name: f.description,
        amount: f.amount,
        created_at: f.created_at,
        category_name: f.type === 'income' ? 'ចំណូល' : 'ចំណាយ',
        note: f.note
      }));
      result = [...result, ...finResults];
    }

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ detail: error.message });
  }
});"""

content = content.replace(route, new_route)

with open('server/routers/name_lists.ts', 'w') as f:
    f.write(content)


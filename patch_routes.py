import re

with open('server/routers/name_lists.ts', 'r') as f:
    content = f.read()

pattern = r"// --- Name List Categories ---"
replacement = """// --- 100k+ Donors ---
router.get('/donors-100k', async (req, res) => {
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
});

// --- Name List Categories ---"""

content = re.sub(pattern, replacement, content)
with open('server/routers/name_lists.ts', 'w') as f:
    f.write(content)

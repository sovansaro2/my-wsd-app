DO $$
DECLARE
    cat_id UUID;
BEGIN
    -- Get the ID of the new category
    SELECT id INTO cat_id FROM public.name_list_categories WHERE name = 'លុយចងដៃខ្ចី' LIMIT 1;

    -- Map correctly so that name is the person's name, not 'ខ្ចី'
    INSERT INTO public.name_list_records (category_id, name, amount, note, referrer, created_at)
    SELECT cat_id, v.name, v.amount, v.note, v.referrer, now() + (v.idx * interval '1 millisecond')
    FROM (
        VALUES 
        (1, 'ជាងអ៊ុំ (ថ្លៃដាក់គ្រឿង)', 100000, 'ខ្ចីថ្ងៃ 7/3/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
        (2, 'មិនស្គាល់ឈ្មោះ', 500000, 'ខ្ចីថ្ងៃ 7/20/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
        (3, 'ជាងអ៊ុំ', 2400000, 'ខ្ចីថ្ងៃ 8/7/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
        (4, 'ជាងអ៊ុំ', 100000, 'ខ្ចីថ្ងៃ 8/15/2027', NULL)
    ) AS v(idx, name, amount, note, referrer);
END $$;

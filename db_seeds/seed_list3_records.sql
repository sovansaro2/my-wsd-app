DO $$
DECLARE
    cat_id UUID;
BEGIN
    -- Get the ID of the new category
    SELECT id INTO cat_id FROM public.name_list_categories WHERE name = 'លុយចងដៃខ្ចី' LIMIT 1;

    -- Insert the records from the image into the generic table structure.
    -- Since our table structure is: name, amount, note, referrer
    -- We will map it as follows to fit the image:
    -- name -> Keep empty or generic like 'ខ្ចី'
    -- amount -> ចំនួន
    -- note -> ថ្ងៃ-ខែ + ស្ថានភាព
    -- referrer -> តាមរយៈ
    
    INSERT INTO public.name_list_records (category_id, name, amount, note, referrer, created_at)
    SELECT cat_id, v.name, v.amount, v.note, v.referrer, now() + (v.idx * interval '1 millisecond')
    FROM (
        VALUES 
        (1, 'ខ្ចី', 100000, '7/3/2026 - បានកត់ចូលបញ្ជីធំ', 'ជាងអ៊ុំ (ថ្លៃដាក់គ្រឿង)'),
        (2, 'ខ្ចី', 500000, '7/20/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
        (3, 'ខ្ចី', 2400000, '8/7/2026 - បានកត់ចូលបញ្ជីធំ', 'ជាងអ៊ុំ'),
        (4, 'ខ្ចី', 100000, '8/15/2027', 'ជាងអ៊ុំ')
    ) AS v(idx, name, amount, note, referrer);
END $$;

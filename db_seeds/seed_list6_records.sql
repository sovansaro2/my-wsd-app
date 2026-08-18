DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.name_list_categories WHERE name = 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២' LIMIT 1;
    
    INSERT INTO public.name_list_records (category_id, name, amount, note, created_at)
    SELECT cat_id, v.name, v.amount, v.note, now() + (v.idx * interval '1 millisecond')
    FROM (
        VALUES 
        (1, 'លោកយាយ ហ៊ុី ខន', 20000, NULL),
        (2, 'លោកយាយ ផេង', 30000, NULL),
        (3, 'កុង ហេង', 30000, 'ជើងកូន'),
        (4, 'កុង យ៉ែត', 20000, NULL)
    ) AS v(idx, name, amount, note);
END $$;

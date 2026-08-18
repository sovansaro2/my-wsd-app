DO $$
DECLARE
    cat_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.name_list_categories WHERE name = 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១' LIMIT 1;
    
    INSERT INTO public.name_list_records (category_id, name, amount, note, created_at)
    SELECT cat_id, v.name, v.amount, v.note, now() + (v.idx * interval '1 millisecond')
    FROM (
        VALUES 
        (1, 'បច្ច័យទទួលបានពីញាតិញោម (ក្រុមចេតិយរួម)', 360000, NULL),
        (2, 'បច្ច័យសល់ពីការទិញកណ្ដឹង', 270000, NULL),
        (3, 'យន មិថុនា (ជាអូន)', 30000, 'ជើងកូន'),
        (4, 'ឧបាសិកា ហៃ', 10000, NULL),
        (5, 'ឧបាសិកា នន', 50000, NULL),
        (6, 'ឧបាសិកា ង៉ែត', 60000, NULL),
        (7, 'លោកគ្រូ សុខ អ្នកស្រី កល្យាណ', 50000, NULL),
        (8, 'ឧបាសិកា ស្រ៊ាង', 10000, NULL)
    ) AS v(idx, name, amount, note);
END $$;

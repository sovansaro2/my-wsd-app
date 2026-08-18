DO $$
DECLARE
    cat_id UUID;
BEGIN
    -- Get the ID of the new category
    SELECT id INTO cat_id FROM public.name_list_categories WHERE name = 'បញ្ជីឈ្មោះបុណ្យផ្កា' LIMIT 1;

    -- Insert the visible records from the image
    INSERT INTO public.name_list_records (category_id, name, amount, note, referrer) VALUES
    (cat_id, 'ឧបាសិកា ហៃ ព្រមទាំងកូនចៅ', 100000, NULL, NULL),
    (cat_id, 'កុង សៅ យាយ ផេង', 40000, 'ជើងកូន', NULL),
    (cat_id, 'វត្ត ក្ដីទឹម', 150000, NULL, NULL),
    (cat_id, 'វត្ត អង្គមានជ័យ', 235000, NULL, NULL),
    (cat_id, 'វត្ត អង្គជ្រៃ', 120000, NULL, NULL),
    (cat_id, 'វត្ត ត្រាសោមង្គល', 140000, NULL, NULL),
    (cat_id, 'ភូមិស្វាយចេក', 100000, NULL, NULL),
    (cat_id, 'ត្រាលើ', 158000, NULL, NULL),
    (cat_id, 'ត្បួច', 225000, NULL, NULL),
    (cat_id, 'តាខុយ', 120000, NULL, NULL),
    (cat_id, 'ភូមិថ្មី', 260000, NULL, NULL),
    (cat_id, 'ស្វាយពារ', 370000, NULL, NULL),
    (cat_id, 'ក្បាលសំរោង', 150000, NULL, NULL),
    (cat_id, 'រដ្ឋបាលឃុំជើងកូន', 80000, NULL, NULL),
    (cat_id, 'ភូមិសន្លុងមន្ត្រី', 350000, NULL, NULL),
    (cat_id, 'ភូមិក្រាំងឡូង', 100000, NULL, NULL),
    (cat_id, 'អញ្ញាខាងលិច', 70000, NULL, NULL),
    (cat_id, 'ត្រពាំងវិហារ', 200000, NULL, NULL),
    (cat_id, 'ភូមិព្រៃបេង', 3040000, 'មានបញ្ជីឈ្មោះ', NULL),
    (cat_id, 'វត្ត ខ្សាច់ស', 140000, NULL, NULL),
    
    (cat_id, 'ទ្រី ដា', 20000, NULL, NULL),
    (cat_id, 'គន ចាន់ណា', 10000, NULL, NULL),
    (cat_id, 'បញ្ញា លីម', 20000, NULL, NULL),
    (cat_id, 'មាន ស្រ៊ាង ព្រមទាំងកូនចៅ', 100000, NULL, NULL),
    (cat_id, 'សល់ តា', 20000, NULL, NULL),
    (cat_id, 'កុងផាន់ យ៉ែត ព្រមទាំងកូនចៅ', 200000, NULL, NULL),
    (cat_id, 'ជឿន វី', 20000, NULL, NULL),
    (cat_id, 'ភា ភាព', 20000, NULL, NULL),
    (cat_id, 'យីម វុឌ្ឍី', 10000, NULL, NULL),
    (cat_id, 'លោកយាយ ផេង ព្រមទាំងកូនចៅ', 100000, NULL, NULL),
    (cat_id, 'ឈុន សុខា', 20000, NULL, NULL),
    (cat_id, 'ដាវ យ៉េន', 15000, NULL, NULL),
    (cat_id, 'ហេង លាង ព្រមទាំងកូនចៅ', 40000, NULL, NULL),
    (cat_id, 'យាយ ស្រី', 10000, NULL, NULL),
    (cat_id, 'យាយ ណែម', 20000, NULL, NULL),
    (cat_id, 'គ្រូ សុខ សុខន', 10000, 'តាខុយ', NULL),
    (cat_id, 'គន ចេង', 20000, 'ជើងកូន', NULL),
    (cat_id, 'សុខា ហ៊ាន', 10000, NULL, NULL),
    (cat_id, 'ស៊ី ផែន', 20000, NULL, NULL),
    (cat_id, 'ប៉ូល អ៊ឹម', 20000, NULL, NULL),
    
    (cat_id, 'ជូ យ៉ាន', 20000, NULL, NULL),
    (cat_id, 'ពេទ្យ បុល ផល្លា', 300000, NULL, NULL),
    (cat_id, 'ចឹង លន់', 100000, NULL, NULL),
    (cat_id, 'លោកគ្រូ សុខ អ្នគ្រូ កល្យាណ', 50000, NULL, NULL),
    (cat_id, 'គ្រូ ទៀង ភារិយា', 300000, 'ភ្នំពេញ', NULL),
    (cat_id, 'កាំង យាន ព្រមទាំងកូនចៅ', 120000, NULL, NULL),
    (cat_id, 'ធី រ៉ែម', 20000, NULL, NULL),
    (cat_id, 'ខេម ឡាយ', 20000, NULL, NULL),
    (cat_id, 'ស្ទៀង វណ្ណី', 40000, 'ភ្នំពេញ', NULL),
    (cat_id, 'តឿន ហេង', 15000, NULL, NULL),
    (cat_id, 'ខេន សម្បត្តិ', 10000, NULL, NULL),
    (cat_id, 'វត្ត បាណន្តគ្រោះ', 200000, NULL, NULL),
    (cat_id, 'វត្ត អំពិលបី', 120000, NULL, NULL);
END $$;

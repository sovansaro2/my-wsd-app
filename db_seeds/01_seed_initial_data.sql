DO $$
DECLARE
  v_seil_id UUID;
BEGIN
  -- Check if Seil 1 already exists, if not insert
  IF NOT EXISTS (SELECT 1 FROM public.seil_periods WHERE name = 'សីលទី១') THEN
    INSERT INTO public.seil_periods (name, date_range_text, previous_balance)
    VALUES ('សីលទី១', '៥.ឧសភា-៨.មិថុនា', 1700000)
    RETURNING id INTO v_seil_id;

    -- Insert Incomes
    INSERT INTO public.financial_records (seil_id, type, description, amount, record_date, note) VALUES
    (v_seil_id, 'income', 'លោកយាយវារី', 200000, '2026-05-16', 'កសាង'),
    (v_seil_id, 'income', 'វុត្តអំបិលបី', 120000, '2026-05-17', 'ចូលបុណ្យផ្កា'),
    (v_seil_id, 'income', 'ឧ.ក មាស វណ្ណា និង ឧ.សិ ឌី ផល្លា', 300000, '2026-06-01', 'ភ្នំពេញ'),
    (v_seil_id, 'income', 'ឧបាសក គន', 100000, '2026-06-01', 'ភ្នំពេញ');

    -- Insert Expenses
    INSERT INTO public.financial_records (seil_id, type, description, amount, record_date, note) VALUES
    (v_seil_id, 'expense', 'កាកបាទក្រហម', 100000, '2026-05-18', 'ប្រធានគណៈកម្មការ'),
    (v_seil_id, 'expense', 'ហូប និងទឹកសុទ្ធ', 140000, '2026-05-18', NULL),
    (v_seil_id, 'expense', 'ធ្វើឯកសារចៅអធិការ', 330000, '2026-05-28', NULL),
    (v_seil_id, 'expense', 'ចូលបុណ្យ កុង ម៉េង', 150000, '2026-05-29', 'ជើងដូន'),
    (v_seil_id, 'expense', 'បន្លែម្ហូបថ្ងៃចង្ហាន់ថ្ងៃសីល', 60000, '2026-05-31', NULL),
    (v_seil_id, 'expense', 'ចូលបុណ្យវត្តអង្លង់ស្លាប', 170000, '2026-05-31', NULL),
    (v_seil_id, 'expense', 'ទៅមើល កុង ណា', 364000, NULL, NULL),
    (v_seil_id, 'expense', 'ទិញផ្ទាំងរូបព្រះ', 100000, '2026-06-04', 'ផ្ទាំង 3D (2m x 3m)'),
    (v_seil_id, 'expense', 'ទិញអំពូលភ្លើងដាក់កន្លែងព្រះ', 115000, '2026-06-04', NULL),
    (v_seil_id, 'expense', 'ចូលរួមមន្ទីរពេទ្យគន្ធបុប្ផា', 50000, NULL, 'សាលាអរគុណ');
  END IF;
END $$;

-- ==============================================================================
-- PHASE 2: Seed Name List Categories and Records
-- ==============================================================================

DO $$
DECLARE
    cat2_id UUID;
    cat3_id UUID;
    cat4_id UUID;
    cat5_id UUID;
    cat6_id UUID;
BEGIN
    -- Insert Categories (using ON CONFLICT DO NOTHING just in case, but returning requires a trick if it exists)
    -- Instead, let's insert and then query the ID.

    INSERT INTO public.name_list_categories (name, description) VALUES ('បញ្ជីឈ្មោះបុណ្យផ្កា', 'បញ្ជីឈ្មោះអ្នកចូលរួមបុណ្យផ្កា') ON CONFLICT (name) DO NOTHING;
    INSERT INTO public.name_list_categories (name, description) VALUES ('លុយចងដៃខ្ចី', '០៣-កក្កដា-២០២៦') ON CONFLICT (name) DO NOTHING;
    INSERT INTO public.name_list_categories (name, description) VALUES ('ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ', NULL) ON CONFLICT (name) DO NOTHING;
    INSERT INTO public.name_list_categories (name, description) VALUES ('ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១', NULL) ON CONFLICT (name) DO NOTHING;
    INSERT INTO public.name_list_categories (name, description) VALUES ('ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២', NULL) ON CONFLICT (name) DO NOTHING;

    SELECT id INTO cat2_id FROM public.name_list_categories WHERE name = 'បញ្ជីឈ្មោះបុណ្យផ្កា' LIMIT 1;
    SELECT id INTO cat3_id FROM public.name_list_categories WHERE name = 'លុយចងដៃខ្ចី' LIMIT 1;
    SELECT id INTO cat4_id FROM public.name_list_categories WHERE name = 'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ' LIMIT 1;
    SELECT id INTO cat5_id FROM public.name_list_categories WHERE name = 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១' LIMIT 1;
    SELECT id INTO cat6_id FROM public.name_list_categories WHERE name = 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២' LIMIT 1;

    -- Delete existing records for these categories to prevent duplication on re-run
    DELETE FROM public.name_list_records WHERE category_id IN (cat2_id, cat3_id, cat4_id, cat5_id, cat6_id);

    -- Insert records for list 2
    IF cat2_id IS NOT NULL THEN
        INSERT INTO public.name_list_records (category_id, name, amount, note, referrer) VALUES
        (cat2_id, 'ឧបាសិកា ហៃ ព្រមទាំងកូនចៅ', 100000, NULL, NULL),
        (cat2_id, 'កុង សៅ យាយ ផេង ព្រមទាំងកូនចៅ', 40000, 'ជើងកូន', NULL),
        (cat2_id, 'វត្ត ក្ដីទឹម', 150000, NULL, NULL),
        (cat2_id, 'វត្ត អង្គមានជ័យ', 235000, NULL, NULL),
        (cat2_id, 'វត្ត អង្គជ្រៃ', 120000, NULL, NULL),
        (cat2_id, 'វត្ត ត្រាសោមង្គល', 140000, NULL, NULL),
        (cat2_id, 'ភូមិស្វាយចេក', 100000, NULL, NULL),
        (cat2_id, 'ត្រាលើ', 158000, NULL, NULL),
        (cat2_id, 'ត្បួច', 225000, NULL, NULL),
        (cat2_id, 'តាខុយ', 120000, NULL, NULL),
        (cat2_id, 'ភូមិថ្មី', 260000, NULL, NULL),
        (cat2_id, 'ស្វាយពារ', 370000, NULL, NULL),
        (cat2_id, 'ក្បាលសំរោង', 150000, NULL, NULL),
        (cat2_id, 'រដ្ឋបាលឃុំជើងកូន', 80000, NULL, NULL),
        (cat2_id, 'ភូមិសន្លុងមន្ត្រី', 350000, NULL, NULL),
        (cat2_id, 'ភូមិក្រាំងឡូង', 100000, NULL, NULL),
        (cat2_id, 'អង្គខាងលិច', 70000, NULL, NULL);
    END IF;

    -- Insert records for list 3
    IF cat3_id IS NOT NULL THEN
        INSERT INTO public.name_list_records (category_id, name, amount, note, referrer, created_at)
        SELECT cat3_id, v.name, v.amount, v.note, v.referrer, now() + (v.idx * interval '1 millisecond')
        FROM (
            VALUES 
            (1, 'ជាងអ៊ុំ (ថ្លៃដាក់គ្រឿង)', 100000, 'ខ្ចីថ្ងៃ 7/3/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
            (2, 'មិនស្គាល់ឈ្មោះ', 500000, 'ខ្ចីថ្ងៃ 7/20/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
            (3, 'ជាងអ៊ុំ', 2400000, 'ខ្ចីថ្ងៃ 8/7/2026 - បានកត់ចូលបញ្ជីធំ', NULL),
            (4, 'ជាងអ៊ុំ', 100000, 'ខ្ចីថ្ងៃ 8/15/2027', NULL)
        ) AS v(idx, name, amount, note, referrer);
    END IF;

    -- Insert records for list 4
    IF cat4_id IS NOT NULL THEN
        INSERT INTO public.name_list_records (category_id, name, amount, note, created_at)
        SELECT cat4_id, v.name, v.amount, v.note, now() + (v.idx * interval '1 millisecond')
        FROM (
            VALUES 
            (1, 'ឧបាសក ប៉េង, ឧបាសិកា លន់, ព្រមទាំងកូនចៅ', 200000, 'ពន្លាត់'),
            (2, 'លោក ម៉ៅ ប៊ុនរិទ្ធ, កូន ម៉ៅ សំអាង, ព្រមទាំងក្រុមគ្រួសារ', 220000, 'ភ្នំពេញ'),
            (3, 'លោក ខឿន និងអ្នកស្រី ទូច', 200000, 'ភ្នំពេញ'),
            (4, 'ឧបាសិកា ង៉ែត', 200000, 'ពន្លាត់'),
            (5, 'លោក ឌី ណា និងអ្នកស្រី ពុយ', 200000, 'ភ្នំពេញ'),
            (6, 'លោកយាយ គីម និងក្មួយ ធី', 20000, 'ភូមិពន្លាត់'),
            (7, 'លោក ប៉ូលីស សិត', 20000, 'ត្រពាំងវិហារ'),
            (8, 'ឧបាសិកា ហៃ', 20000, 'ពន្លាត់'),
            (9, 'ឧបាសិកា ផេង', 20000, 'ពន្លាត់'),
            (10, 'ឧបាសិកា ស្រ៊ាង', 20000, 'ពន្លាត់'),
            (11, 'ឧបាសិកា នន', 20000, 'ពន្លាត់'),
            (12, 'សាក់ ដាវី', 10000, 'ពន្លាត់'),
            (13, 'កុង ខេង យាយ រឿន', 10000, 'ជើងកូន')
        ) AS v(idx, name, amount, note);
    END IF;

    -- Insert records for list 5
    IF cat5_id IS NOT NULL THEN
        INSERT INTO public.name_list_records (category_id, name, amount, note, created_at)
        SELECT cat5_id, v.name, v.amount, v.note, now() + (v.idx * interval '1 millisecond')
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
    END IF;

    -- Insert records for list 6
    IF cat6_id IS NOT NULL THEN
        INSERT INTO public.name_list_records (category_id, name, amount, note, created_at)
        SELECT cat6_id, v.name, v.amount, v.note, now() + (v.idx * interval '1 millisecond')
        FROM (
            VALUES 
            (1, 'លោកយាយ ហ៊ុី ខន', 20000, NULL),
            (2, 'លោកយាយ ផេង', 30000, NULL),
            (3, 'កុង ហេង', 30000, 'ជើងកូន'),
            (4, 'កុង យ៉ែត', 20000, NULL)
        ) AS v(idx, name, amount, note);
    END IF;

END $$;

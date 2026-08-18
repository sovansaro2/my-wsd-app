CREATE TABLE IF NOT EXISTS public.seil_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_range_text TEXT,
  previous_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seil_id UUID REFERENCES public.seil_periods(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  record_date DATE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.seil_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read seil_periods" ON public.seil_periods FOR SELECT USING (true);
CREATE POLICY "Allow public read financial_records" ON public.financial_records FOR SELECT USING (true);
CREATE POLICY "Allow all operations on seil_periods" ON public.seil_periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on financial_records" ON public.financial_records FOR ALL USING (true) WITH CHECK (true);

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

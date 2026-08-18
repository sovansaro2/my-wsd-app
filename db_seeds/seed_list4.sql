-- Insert the new category for list 4
INSERT INTO public.name_list_categories (name, description) 
VALUES ('ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ', NULL)
RETURNING id;

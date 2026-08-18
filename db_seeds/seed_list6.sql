-- Insert the new category for list 6
INSERT INTO public.name_list_categories (name, description) 
VALUES ('ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២', NULL)
RETURNING id;

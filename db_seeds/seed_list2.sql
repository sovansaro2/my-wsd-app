-- Insert the new category
INSERT INTO public.name_list_categories (name, description) 
VALUES ('បញ្ជីឈ្មោះបុណ្យផ្កា', 'បញ្ជីឈ្មោះអ្នកចូលរួមបុណ្យផ្កា')
RETURNING id;

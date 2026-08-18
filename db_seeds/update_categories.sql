-- Update the first category name and set its event date
UPDATE public.name_list_categories 
SET name = 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ',
    description = '២៩-មីនា-២០២៦'
WHERE name LIKE 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមកសាងដំបូលព្រះវិហារ%';

-- Update the second category event date
UPDATE public.name_list_categories 
SET description = '០១-ឧសភា-២០២៦'
WHERE name = 'បញ្ជីឈ្មោះបុណ្យផ្កា';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'km' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations = {
  km: {
    app_title: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យ វត្តស្នាយដួច',
    nav_home: 'ទំព័រដើម',
    nav_finance: 'ចំណូល-ចំណាយ',
    nav_list: 'បញ្ជីផ្សេងៗ',
    nav_reports: 'របាយការណ៍',
    nav_account: 'គណនី',
    
    common_back: 'ត្រឡប់ក្រោយ',
    common_loading: 'កំពុងផ្ទុក...',
    common_saving: 'កំពុងរក្សាទុក...',
    common_no_data: 'មិនទាន់មានទិន្នន័យនៅឡើយទេ',
    common_show: 'បង្ហាញ',
    common_hide: 'លាក់',
    common_search: 'ស្វែងរក...',

    profile_account_menu: 'គណនី',
    profile_security_menu: 'ពាក្យសម្ងាត់ និងសុវត្ថិភាព',
    profile_security_modal_title: 'ពាក្យសម្ងាត់ និងសុវត្ថិភាព',
    profile_change_password_title: 'ពាក្យសម្ងាត់',
    profile_change_password_desc: 'ផ្លាស់ប្ដូរពាក្យសម្ងាត់គណនី',
    profile_pin_balance_title: 'PIN មើលទឹកប្រាក់',
    profile_pin_balance_set: 'បានកំណត់រួចរាល់',
    profile_pin_balance_unset: 'មិនទាន់បានកំណត់',
    profile_settings_heading: 'ការកំណត់:',
    profile_change_lang: 'ផ្លាស់ប្ដូរភាសា',
    profile_change_theme: 'ផ្លាស់ប្ដូរស្បែក',
    profile_theme_modal_title: 'ផ្លាស់ប្ដូរស្បែក',
    profile_theme_light_label: 'ភ្លឺ (Light Mode)',
    profile_theme_dark_label: 'ងងឹត (Dark Mode)',
    profile_mgmt_heading: 'ការគ្រប់គ្រង:',
    profile_certificates: 'លិខិតផ្សេងៗ',
    profile_users: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    profile_about: 'អំពីកម្មវិធី',
    profile_logout: 'ចាកចេញពីគណនី',

    theme_dark: 'ងងឹត',
    theme_light: 'ភ្លឺ',
    
    about_purpose: 'គោលបំណង',
    about_purpose_desc: 'កម្មវិធីនេះបង្កើតឡើងដើម្បីគ្រប់គ្រងប្រព័ន្ធទិន្នន័យចំណូល ចំណាយ និងបញ្ជីឈ្មោះសប្បុរសជនផ្សេងៗរបស់វត្តស្នាយដួច។',
    about_dev: 'រៀបចំ និងអភិវឌ្ឍដោយ',
    about_tech: 'បច្ចេកវិទ្យា',
    about_close: 'បិទ',
    about_version: 'កំណែ',
    
    lang_khmer: 'ភាសាខ្មែរ',
    lang_english: 'English',

    dashboard_title: 'វិភាគទិន្នន័យ',
    dashboard_total_report: 'របាយការណ៍សរុប (រយៈពេល {count} សីល)',
    dashboard_total_income: 'ចំណូលសរុប',
    dashboard_total_expense: 'ចំណាយសរុប',
    dashboard_actual_balance: 'សាច់ប្រាក់នៅសល់ជាក់ស្តែង',
    dashboard_chart_title: 'ចំណូល និងចំណាយតាមវេនសីល',
    dashboard_income: 'ចំណូល',
    dashboard_expense: 'ចំណាយ',
    dashboard_pie_title: 'សមាមាត្រហិរញ្ញវត្ថុ',
    dashboard_amount: 'ចំនួន',
    dashboard_high_donors: 'សប្បុរសជនថវិកាកម្រិតខ្ពស់',
    dashboard_donors_count: '{count} នាក់',

    records_title: 'ចំណូល-ចំណាយ',
    records_total_periods: 'សរុប {count} កាលបរិច្ឆេទ',
    records_btn_add_new: 'បន្ថែមថ្មី',
    records_add_new: 'បន្ថែមចំណូល-ចំណាយ',
    records_prev_balance: 'បច្ច័យនៅសល់ពីមុន',
    records_current_balance: 'នៅសល់ជាក់ស្តែង',
    records_total_income: 'ចំណូលសរុប',
    records_total_expense: 'ចំណាយសរុប',
    records_empty_income: 'មិនទាន់មានទិន្នន័យចំណូលនៅឡើយទេ',
    records_empty_expense: 'មិនទាន់មានទិន្នន័យចំណាយនៅឡើយទេ',
    records_add_new_title: 'បញ្ជូលទិន្នន័យថ្មី',
    records_type_income: 'ចំណូល',
    records_type_expense: 'ចំណាយ',
    records_description_income: 'ឈ្មោះសប្បុរសជន',
    records_description_income_ph: 'សូមបញ្ជូលឈ្មោះ',
    records_description_expense: 'បរិយាយ (មុខទំនិញ)',
    records_description_expense_ph: 'ឧ. ទិញទឹកសុទ្ធ...',
    records_amount: 'ចំនួនទឹកប្រាក់ (រៀល)',
    records_amount_ph: '00,000',
    records_date: 'កាលបរិច្ឆេទ',
    records_note: 'ចំណាំផ្សេងៗ',
    records_note_ph: 'មិនចាំបាច់ក៏បាន',
    records_save: 'រក្សាទុកទិន្នន័យ',

    lists_main_title: 'បញ្ជីផ្សេងៗ',
    lists_category_roof: 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ',
    lists_category_kathina: 'បុណ្យកឋិន',
    lists_category_general: 'បញ្ជីទូទៅ',
    lists_status_active: 'កំពុងប្រតិបត្តិការ',
    lists_status_completed: 'បានបញ្ចប់',
    lists_no_lists: 'មិនទាន់មានបញ្ជីនៅឡើយទេ',
    list_title: 'បញ្ជីឈ្មោះ',
    list_add_new: 'បន្ថែមទិន្នន័យ',
    list_search: 'ស្វែងរកឈ្មោះ ឬទីកន្លែង...',
    list_date: 'កាលបរិច្ឆេទ',
    list_total_records: 'សរុបទិន្នន័យ',
    list_total_amount: 'សរុប',
    list_empty: 'មិនមានទិន្នន័យនៅឡើយទេ',
    list_referrer: 'តាមរយៈ',
    list_edit_title: 'កែប្រែទិន្នន័យ',
    list_add_title: 'បន្ថែមទិន្នន័យថ្មី',
    list_name: 'ឈ្មោះ',
    list_name_ph: 'បញ្ចូលឈ្មោះ...',
    list_amount: 'ចំនួនទឹកប្រាក់ (រៀល)',
    list_amount_ph: 'ឧ. 100000',
    list_note: 'ផ្នែក',
    list_note_ph: 'ឧ. ភ្នំពេញ...',
    list_ref: 'អ្នកណែនាំ / តាមរយៈ (មិនចាំបាច់)',
    list_ref_ph: 'បញ្ចូលឈ្មោះអ្នកណែនាំ...',
    list_cancel: 'បោះបង់',
    list_save: 'រក្សាទុក',
    list_alert_delete: 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?',
    list_alert_error: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ',
    list_alert_del_error: 'មានបញ្ហាក្នុងការលុបទិន្នន័យ',

    reports_saved_title: 'របាយការណ៍ដែលបានរក្សាទុក',
    reports_empty: 'មិនទាន់មានរបាយការណ៍ដែលបានរក្សាទុកទេ',

    cert_title: 'លិខិតថ្លែងអំណរគុណ',
    cert_total: 'សរុប {count}',
    cert_search_ph: 'ស្វែងរកឈ្មោះ...',
    cert_not_found: 'រកមិនឃើញលិខិតដែលស្វែងរកទេ',
    cert_empty: 'មិនទាន់មានលិខិតថ្លែងអំណរគុណទេ',

    users_title: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    users_subtitle: 'គ្រប់គ្រងសិទ្ធិ និងគណនី',
    users_search_ph: 'ស្វែងរកឈ្មោះ អ៊ីមែល ឬលេខទូរស័ព្ទ...',
    users_no_name: 'គ្មានឈ្មោះ',
    users_registered_at: 'បានចុះឈ្មោះ:',
    users_role_admin: 'អ្នកគ្រប់គ្រង',
    users_role_user: 'អ្នកប្រើប្រាស់',
    users_btn_reset_pwd: 'ប្ដូរពាក្យសម្ងាត់',
    users_reset_pwd_title: 'ប្ដូរពាក្យសម្ងាត់ថ្មី',
    users_new_pwd_ph: 'បញ្ចូលពាក្យសម្ងាត់ថ្មី (យ៉ាងហោច ៦ ខ្ទង់)',
    users_btn_save_pwd: 'ផ្លាស់ប្ដូរពាក្យសម្ងាត់',
    users_confirm_role_change: 'តើអ្នកពិតជាចង់ប្តូរសិទ្ធិអ្នកប្រើប្រាស់នេះទៅជា {role} មែនទេ?',

    profile_title: 'ប្រវត្តិរូប',
    profile_view_edit: 'មើលប្រវត្តិរូប និងកែប្រែ',
    profile_settings: 'ការគ្រប់គ្រង',
    profile_finance_mgmt: 'ចំណូល-ចំណាយ',
    profile_list_mgmt: 'បញ្ជីផ្សេងៗ',
    profile_security_title: 'គណនីរបស់អ្នកមានសុវត្ថិភាព',
    profile_security_desc: 'ទិន្នន័យរបស់អ្នកត្រូវបានការពារយ៉ាងល្អ',
    profile_others: 'ការកំណត់',
    profile_edit_title: 'កែប្រែប្រវត្តិរូប',
    profile_edit_photo: 'ចុចលើកាមេរ៉ាដើម្បីប្តូររូបភាព',
    profile_full_name: 'ឈ្មោះពេញ',
    profile_password: 'ពាក្យសម្ងាត់',
    profile_password_ph: 'ទុកទទេបើមិនចង់ដូរពាក្យសម្ងាត់ថ្មី',
    profile_save_changes: 'រក្សាទុកការកែប្រែ',
    profile_saving: 'កំពុងរក្សាទុក...',
    profile_role_admin: 'អ្នកគ្រប់គ្រង',
    profile_role_user: 'អ្នកប្រើប្រាស់',

    install_title: 'ទាញយកកម្មវិធី',
    install_desc: 'ទាញយកកម្មវិធីនេះដាក់លើអេក្រង់ទូរស័ព្ទរបស់អ្នក ដើម្បីងាយស្រួលប្រើប្រាស់។',
    install_btn: 'ទាញយក'
  },
  en: {
    app_title: 'WSD DATA MANAGEMENT',
    nav_home: 'Home',
    nav_finance: 'Finances',
    nav_list: 'Other Lists',
    nav_reports: 'Reports',
    nav_account: 'Account',
    
    common_back: 'Back',
    common_loading: 'Loading...',
    common_saving: 'Saving...',
    common_no_data: 'No data available yet',
    common_show: 'Show',
    common_hide: 'Hide',
    common_search: 'Search...',

    profile_account_menu: 'Account',
    profile_security_menu: 'Password & Security',
    profile_security_modal_title: 'Password & Security',
    profile_change_password_title: 'Password',
    profile_change_password_desc: 'Change account password',
    profile_pin_balance_title: 'Balance View PIN',
    profile_pin_balance_set: 'Already configured',
    profile_pin_balance_unset: 'Not configured yet',
    profile_settings_heading: 'Settings:',
    profile_change_lang: 'Change Language',
    profile_change_theme: 'Change Theme',
    profile_theme_modal_title: 'Change Theme',
    profile_theme_light_label: 'Light Mode',
    profile_theme_dark_label: 'Dark Mode',
    profile_mgmt_heading: 'Management:',
    profile_certificates: 'Certificates & Documents',
    profile_users: 'User Management',
    profile_about: 'About App',
    profile_logout: 'Logout',

    theme_dark: 'Dark',
    theme_light: 'Light',
    
    about_purpose: 'Purpose',
    about_purpose_desc: 'This application is built to manage the database of income, expenses, and various donor lists for Wat Snay Duoc.',
    about_dev: 'Developed By',
    about_tech: 'Technologies',
    about_close: 'Close',
    about_version: 'Version',
    
    lang_khmer: 'ភាសាខ្មែរ',
    lang_english: 'English',

    dashboard_title: 'Data Analysis',
    dashboard_total_report: 'Total Report (Period: {count} Seil)',
    dashboard_total_income: 'Total Income',
    dashboard_total_expense: 'Total Expense',
    dashboard_actual_balance: 'Actual Remaining Balance',
    dashboard_chart_title: 'Income and Expense by Seil',
    dashboard_income: 'Income',
    dashboard_expense: 'Expense',
    dashboard_pie_title: 'Financial Proportion',
    dashboard_amount: 'Amount',
    dashboard_high_donors: 'High-Tier Donors',
    dashboard_donors_count: '{count} Donors',

    records_title: 'Finances',
    records_total_periods: 'Total {count} Periods',
    records_btn_add_new: 'Add New',
    records_add_new: 'Add New Record',
    records_prev_balance: 'Previous Balance',
    records_current_balance: 'Actual Balance',
    records_total_income: 'Total Income',
    records_total_expense: 'Total Expense',
    records_empty_income: 'No income records yet',
    records_empty_expense: 'No expense records yet',
    records_add_new_title: 'Add New Data',
    records_type_income: 'Income',
    records_type_expense: 'Expense',
    records_description_income: 'Donor Name',
    records_description_income_ph: 'Enter name',
    records_description_expense: 'Description (Item)',
    records_description_expense_ph: 'Ex: Bought Water...',
    records_amount: 'Amount (Riel)',
    records_amount_ph: '00,000',
    records_date: 'Date',
    records_note: 'Note (Optional)',
    records_note_ph: 'Optional',
    records_save: 'Save Data',

    lists_main_title: 'Other Lists',
    lists_category_roof: 'Temple Roof Construction',
    lists_category_kathina: 'Kathina Ceremony',
    lists_category_general: 'General Lists',
    lists_status_active: 'In Progress',
    lists_status_completed: 'Completed',
    lists_no_lists: 'No lists available yet',
    list_title: 'Name List',
    list_add_new: 'Add Data',
    list_search: 'Search names or places...',
    list_date: 'Date',
    list_total_records: 'Total Records',
    list_total_amount: 'Total',
    list_empty: 'No records found',
    list_referrer: 'Referred by',
    list_edit_title: 'Edit Data',
    list_add_title: 'Add New Data',
    list_name: 'Name',
    list_name_ph: 'Enter name...',
    list_amount: 'Amount (Riel)',
    list_amount_ph: 'Ex: 100000',
    list_note: 'Section',
    list_note_ph: 'Ex: Phnom Penh...',
    list_ref: 'Referrer (Optional)',
    list_ref_ph: 'Enter referrer name...',
    list_cancel: 'Cancel',
    list_save: 'Save',
    list_alert_delete: 'Are you sure you want to delete this record?',
    list_alert_error: 'Error saving data',
    list_alert_del_error: 'Error deleting data',

    reports_saved_title: 'Saved Reports',
    reports_empty: 'No saved reports yet',

    cert_title: 'Certificates of Appreciation',
    cert_total: 'Total {count}',
    cert_search_ph: 'Search name...',
    cert_not_found: 'No matching certificates found',
    cert_empty: 'No certificates available yet',

    users_title: 'User Management',
    users_subtitle: 'Manage roles and accounts',
    users_search_ph: 'Search name, email, or phone...',
    users_no_name: 'No Name',
    users_registered_at: 'Registered:',
    users_role_admin: 'Admin',
    users_role_user: 'User',
    users_btn_reset_pwd: 'Reset Password',
    users_reset_pwd_title: 'Reset User Password',
    users_new_pwd_ph: 'Enter new password (min 6 chars)',
    users_btn_save_pwd: 'Update Password',
    users_confirm_role_change: 'Are you sure you want to change this user role to {role}?',

    profile_title: 'Profile',
    profile_view_edit: 'View and edit profile',
    profile_settings: 'Management',
    profile_finance_mgmt: 'Finances',
    profile_list_mgmt: 'Name Lists',
    profile_security_title: 'Your account is secure',
    profile_security_desc: 'Your data is well protected',
    profile_others: 'Settings',
    profile_edit_title: 'Edit Profile',
    profile_edit_photo: 'Click camera to change photo',
    profile_full_name: 'Full Name',
    profile_password: 'Password',
    profile_password_ph: 'Leave blank to keep current password',
    profile_save_changes: 'Save Changes',
    profile_saving: 'Saving...',
    profile_role_admin: 'Administrator',
    profile_role_user: 'User',

    install_title: 'Install App',
    install_desc: 'Install this app on your home screen for quick and easy access.',
    install_btn: 'Install'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('km');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'km' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'en') {
      document.documentElement.classList.add('lang-en');
      document.documentElement.classList.remove('lang-km');
    } else {
      document.documentElement.classList.add('lang-km');
      document.documentElement.classList.remove('lang-en');
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key; // return key if translation not found
      }
    }
    
    if (typeof result === 'string' && params) {
      return result.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? String(params[k]) : `{${k}}`);
    }
    
    return result as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

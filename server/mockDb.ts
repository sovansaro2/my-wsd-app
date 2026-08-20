import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial default structure
let data = {
  seil_periods: [],
  financial_records: [],
  name_list_categories: [],
  name_list_records: [],
};

// Load from file if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load db.json', e);
  }
}

// Save to file helper
const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save db.json', e);
  }
};

export const MockDB = {
  get: (table) => {
    return data[table] || [];
  },
  insert: (table, record) => {
    if (!data[table]) data[table] = [];
    const newRecord = { ...record, id: Math.random().toString(36).substring(2, 9), created_at: new Date().toISOString() };
    data[table].push(newRecord);
    saveDb();
    return [newRecord];
  },
  update: (table, id, updates) => {
    if (!data[table]) data[table] = [];
    const index = data[table].findIndex(r => r.id === id);
    if (index > -1) {
      data[table][index] = { ...data[table][index], ...updates };
      saveDb();
      return [data[table][index]];
    }
    return [];
  },
  delete: (table, id) => {
    if (!data[table]) data[table] = [];
    const index = data[table].findIndex(r => r.id === id);
    if (index > -1) {
      const deleted = data[table].splice(index, 1);
      saveDb();
      return deleted;
    }
    return [];
  }
};

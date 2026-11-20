import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_SHEETS_PER_BATCH = 25;
const MAX_ROWS_PER_SHEET = 3000;
const MAX_AMOUNT = 100_000_000_000;
const INSERT_CHUNK_SIZE = 200;
const DELETE_CHUNK_SIZE = 200;

const KNOWN_VILLAGES_OR_AREAS = new Set([
  'ទ្រាលើ',
  'ត្បាច',
  'តាខូយ',
  'ស្វាយពពារ',
  'ក្បាលសំរោង',
  'ត្រពាំងវិហារ',
  'ភូមិស្វាយចេក',
  'ភូមិថ្មី',
  'ភូមិស្មន់មុន្នី',
  'ភូមិក្រាំងឡង',
  'ភូមិព្រៃរបង',
]);

function isHighTierIndividualDonor(name: string, categoryName?: string): boolean {
  if (!name) return false;
  const n = name.trim();
  if (n === 'ខ្ចី' || n === 'មិនស្គាល់ឈ្មោះ') return false;
  if (categoryName === 'លុយជាងដក') return false;
  if (categoryName?.includes('ចំណាយ') || categoryName?.includes('បញ្ជីថវិការចំណាយ')) return false;
  if (n.startsWith('ជាងអ៊ុំ')) return false;
  if (
    n.startsWith('បច្ច័យប្រចាំសីល') ||
    n.startsWith('បច្ច័យថ្ងៃសីល') ||
    n.startsWith('បច្ច័យសល់') ||
    n.includes('ចេតិយរួម')
  ) {
    return false;
  }
  if (n === 'ញាតិញោមមកពីភ្នំជីសូរ' || n === 'គេចូលតាមរយៈមេភូមិ') return false;
  if (n === 'បុណ្យ១០០ថ្ងៃ') return false;
  if (n.startsWith('វត្ត ') || n.startsWith('វត្ត')) return false;
  if (KNOWN_VILLAGES_OR_AREAS.has(n)) return false;
  if (n.startsWith('បរិស័ទភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ ភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ')) {
    return false;
  }
  return true;
}

function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  // Remove invisible control chars except normal spaces/tabs
  let cleaned = val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  // Collapse excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  // Guard against spreadsheet formula injection strings (e.g. =CMD(...), +..., @...)
  if (/^[=+\-@]/.test(cleaned) && !/^[+\-]?\d/.test(cleaned)) {
    cleaned = cleaned.replace(/^[=+\-@]+/, '').trim();
  }
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen).trim();
  }
  return cleaned;
}

function normalizeDateStr(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    if (!isNaN(d.getTime())) return trimmed;
  }
  return null;
}

function normalizeDedupeKey(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((p) =>
      String(p ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
    )
    .join('||');
}

const ImportRowSchema = z.object({
  name: z.string().min(1).max(400),
  amount: z.number().finite().positive().max(MAX_AMOUNT),
  note: z.string().max(600).nullable().optional(),
  referrer: z.string().max(250).nullable().optional(),
  type: z.enum(['income', 'expense']).optional(),
  record_date: z.string().max(40).nullable().optional(),
});

const ImportSheetSchema = z.object({
  sheetTitle: z.string().min(1).max(220),
  sourceFileName: z.string().max(260).optional(),
  targetType: z.enum(['category', 'seil']),
  mode: z.enum(['create_new', 'append_new', 'replace_existing']),
  targetId: z.string().max(100).optional(),
  newFolderName: z.string().max(220).optional(),
  newFolderDescription: z.string().max(500).optional(),
  dateRangeText: z.string().max(160).optional(),
  previousBalance: z.number().finite().min(-MAX_AMOUNT).max(MAX_AMOUNT).optional(),
  rows: z.array(ImportRowSchema).min(1).max(MAX_ROWS_PER_SHEET),
});

export const ExcelImportBatchSchema = z.object({
  confirmReplace: z.boolean().optional(),
  sheets: z.array(ImportSheetSchema).min(1).max(MAX_SHEETS_PER_BATCH),
});

export type ExcelImportBatchPayload = z.infer<typeof ExcelImportBatchSchema>;

export interface ExcelImportSheetResult {
  sheetTitle: string;
  targetType: 'category' | 'seil';
  mode: 'create_new' | 'append_new' | 'replace_existing';
  folderId: string;
  folderName: string;
  insertedCount: number;
  skippedDuplicates: number;
  replacedOldCount: number;
  totalAmount: number;
  status: 'success' | 'error';
  error?: string;
}

async function insertRecordsChunked(
  client: SupabaseClient,
  directClient: SupabaseClient,
  table: 'name_list_records' | 'financial_records',
  rows: Record<string, any>[]
): Promise<{ insertedIds: string[]; error?: string }> {
  const insertedIds: string[] = [];

  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    let chunk = rows.slice(i, i + INSERT_CHUNK_SIZE).map((r) => ({ ...r }));

    let res = await client.from(table).insert(chunk).select('id');

    // Graceful fallback if optional columns do not exist in DB schema
    if (
      res.error &&
      (res.error.code === '42703' ||
        res.error.message?.includes('is_100k_donor') ||
        res.error.message?.includes('is_high_level'))
    ) {
      chunk = chunk.map((r) => {
        const copy = { ...r };
        delete copy.is_100k_donor;
        delete copy.is_high_level;
        return copy;
      });
      res = await client.from(table).insert(chunk).select('id');
    }

    // Fallback to direct admin client if RLS policy triggered
    if (res.error && (res.error.code === '42501' || res.error.message?.includes('row-level security'))) {
      res = await directClient.from(table).insert(chunk).select('id');
    }

    if (res.error) {
      // Rollback any previously inserted chunks for this sheet so we never leave partial corrupt state
      if (insertedIds.length > 0) {
        await deleteRecordsByIds(client, directClient, table, insertedIds);
      }
      return { insertedIds: [], error: res.error.message };
    }

    const ids = (res.data || []).map((d: any) => String(d.id)).filter(Boolean);
    insertedIds.push(...ids);
  }

  return { insertedIds };
}

async function deleteRecordsByIds(
  client: SupabaseClient,
  directClient: SupabaseClient,
  table: 'name_list_records' | 'name_list_categories' | 'financial_records' | 'seil_periods',
  ids: string[]
): Promise<{ error?: string }> {
  for (let i = 0; i < ids.length; i += DELETE_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + DELETE_CHUNK_SIZE);
    let res = await client.from(table).delete().in('id', chunk);
    if (res.error && (res.error.code === '42501' || res.error.message?.includes('row-level security'))) {
      res = await directClient.from(table).delete().in('id', chunk);
    }
    if (res.error) {
      return { error: res.error.message };
    }
  }
  return {};
}

export async function executeExcelImportBatch(
  supabaseAdmin: SupabaseClient,
  directAdminClient: SupabaseClient,
  rawPayload: unknown
): Promise<{
  status: number;
  body: {
    success?: boolean;
    detail?: string;
    summary?: {
      totalSheets: number;
      succeededSheets: number;
      failedSheets: number;
      totalInserted: number;
      totalSkippedDuplicates: number;
      totalReplacedOld: number;
    };
    results?: ExcelImportSheetResult[];
  };
}> {
  const parsed = ExcelImportBatchSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      status: 400,
      body: {
        detail: `ទិន្នន័យនាំចូលមិនត្រឹមត្រូវ (${firstIssue?.path.join('.') || 'payload'}: ${firstIssue?.message || 'invalid'})`,
      },
    };
  }

  const { sheets, confirmReplace } = parsed.data;

  // Enforce explicit confirmation when any sheet uses destructive Replace/Sync mode
  const hasReplaceMode = sheets.some((s) => s.mode === 'replace_existing');
  if (hasReplaceMode && !confirmReplace) {
    return {
      status: 400,
      body: {
        detail: 'សូមបញ្ជាក់យល់ព្រមមុននឹងប្រើមុខងារជំនួសទិន្នន័យចាស់ (Sync / Replace)',
      },
    };
  }

  const results: ExcelImportSheetResult[] = [];

  for (const sheet of sheets) {
    const cleanSheetTitle = sanitizeText(sheet.sheetTitle, 200) || 'Excel Sheet';

    try {
      // Sanitize rows
      const cleanedRows = sheet.rows
        .map((row) => ({
          name: sanitizeText(row.name, 280),
          amount: Math.round(Number(row.amount) * 100) / 100,
          note: sanitizeText(row.note || '', 500) || null,
          referrer: sanitizeText(row.referrer || '', 200) || null,
          type: row.type === 'expense' ? ('expense' as const) : ('income' as const),
          record_date: normalizeDateStr(row.record_date),
        }))
        .filter((r) => r.name.length > 0 && Number.isFinite(r.amount) && r.amount > 0);

      if (cleanedRows.length === 0) {
        results.push({
          sheetTitle: cleanSheetTitle,
          targetType: sheet.targetType,
          mode: sheet.mode,
          folderId: sheet.targetId || '',
          folderName: sanitizeText(sheet.newFolderName || cleanSheetTitle, 200),
          insertedCount: 0,
          skippedDuplicates: 0,
          replacedOldCount: 0,
          totalAmount: 0,
          status: 'error',
          error: 'មិនមានជួរទិន្នន័យត្រឹមត្រូវសម្រាប់នាំចូលទេ',
        });
        continue;
      }

      if (sheet.targetType === 'category') {
        let folderId = sheet.targetId || '';
        let folderName = sanitizeText(sheet.newFolderName || cleanSheetTitle, 200);

        if (sheet.mode === 'create_new') {
          if (!folderName) {
            throw new Error('សូមបញ្ចូលឈ្មោះ Folder ថ្មី');
          }
          const catPayload = {
            name: folderName,
            description:
              sanitizeText(sheet.newFolderDescription || '', 450) ||
              (sheet.sourceFileName ? `នាំចូលពី Excel (${sanitizeText(sheet.sourceFileName, 120)})` : 'នាំចូលពី Excel'),
          };
          let catRes = await supabaseAdmin.from('name_list_categories').insert([catPayload]).select();
          if (catRes.error && (catRes.error.code === '42501' || catRes.error.message?.includes('row-level security'))) {
            catRes = await directAdminClient.from('name_list_categories').insert([catPayload]).select();
          }
          if (catRes.error || !catRes.data || catRes.data.length === 0) {
            throw new Error(catRes.error?.message || 'មិនអាចបង្កើត Folder ថ្មីបានទេ');
          }
          folderId = catRes.data[0].id;
          folderName = catRes.data[0].name;
        } else {
          if (!folderId) {
            throw new Error('សូមជ្រើសរើស Folder គោលដៅ');
          }
          const existingCat = await supabaseAdmin
            .from('name_list_categories')
            .select('id, name')
            .eq('id', folderId)
            .single();
          if (existingCat.error || !existingCat.data) {
            throw new Error('រកមិនឃើញ Folder គោលដៅនៅក្នុងប្រព័ន្ធទេ');
          }
          folderName = existingCat.data.name;
        }

        // Load existing records for dedupe or safe replace
        let existingRows: any[] = [];
        if (sheet.mode === 'append_new' || sheet.mode === 'replace_existing') {
          const exRes = await supabaseAdmin
            .from('name_list_records')
            .select('id, name, amount, note')
            .eq('category_id', folderId);
          if (exRes.error) {
            throw new Error(`មិនអាចផ្ទៀងផ្ទាត់ទិន្នន័យចាស់បានទេ: ${exRes.error.message}`);
          }
          existingRows = exRes.data || [];
        }

        let rowsToInsert = cleanedRows;
        let skippedDuplicates = 0;

        if (sheet.mode === 'append_new' && existingRows.length > 0) {
          // Multiset frequency map preserves intentional duplicate donations on the same sheet
          const existingFreq = new Map<string, number>();
          for (const ex of existingRows) {
            const key = normalizeDedupeKey([ex.name, Math.round(Number(ex.amount) || 0)]);
            existingFreq.set(key, (existingFreq.get(key) || 0) + 1);
          }
          const filtered: typeof cleanedRows = [];
          for (const row of cleanedRows) {
            const key = normalizeDedupeKey([row.name, Math.round(row.amount)]);
            const rem = existingFreq.get(key) || 0;
            if (rem > 0) {
              existingFreq.set(key, rem - 1);
              skippedDuplicates += 1;
            } else {
              filtered.push(row);
            }
          }
          rowsToInsert = filtered;
        }

        const baseTime = Date.now();
        const insertPayloads = rowsToInsert.map((row, idx) => ({
          category_id: folderId,
          name: row.name,
          amount: row.amount,
          note: row.note,
          referrer: row.referrer,
          is_100k_donor: row.amount >= 100000 && isHighTierIndividualDonor(row.name, folderName),
          created_at: row.record_date
            ? new Date(`${row.record_date}T00:00:00.000Z`).toISOString()
            : new Date(baseTime - (rowsToInsert.length - idx) * 1000).toISOString(),
        }));

        let replacedOldCount = 0;

        if (insertPayloads.length > 0) {
          // Safe Replace Pattern: Insert NEW records FIRST, then delete OLD IDs only if insert succeeded 100%
          const ins = await insertRecordsChunked(supabaseAdmin, directAdminClient, 'name_list_records', insertPayloads);
          if (ins.error) {
            throw new Error(`បរាជ័យក្នុងការរក្សាទុកជួរទិន្នន័យ: ${ins.error}`);
          }

          if (sheet.mode === 'replace_existing' && existingRows.length > 0) {
            const oldIds = existingRows.map((r) => String(r.id)).filter(Boolean);
            const del = await deleteRecordsByIds(supabaseAdmin, directAdminClient, 'name_list_records', oldIds);
            if (del.error) {
              // Rollback newly inserted records so data is never duplicated
              await deleteRecordsByIds(supabaseAdmin, directAdminClient, 'name_list_records', ins.insertedIds);
              throw new Error(`មិនអាចសម្អាតទិន្នន័យចាស់បានទេ (បានត្រឡប់ដូចដើម): ${del.error}`);
            }
            replacedOldCount = oldIds.length;
          }
        }

        const totalInsertedAmount = rowsToInsert.reduce((sum, r) => sum + r.amount, 0);
        results.push({
          sheetTitle: cleanSheetTitle,
          targetType: 'category',
          mode: sheet.mode,
          folderId,
          folderName,
          insertedCount: rowsToInsert.length,
          skippedDuplicates,
          replacedOldCount,
          totalAmount: totalInsertedAmount,
          status: 'success',
        });
      } else {
        // targetType === 'seil' (Financial Records)
        let seilId = sheet.targetId || '';
        let seilName = sanitizeText(sheet.newFolderName || cleanSheetTitle, 200);

        if (sheet.mode === 'create_new') {
          if (!seilName) {
            throw new Error('សូមបញ្ចូលឈ្មោះបញ្ជីសីលថ្មី');
          }
          const seilPayload = {
            name: seilName,
            date_range_text: sanitizeText(sheet.dateRangeText || '', 150) || '',
            previous_balance: Number(sheet.previousBalance) || 0,
          };
          let seilRes = await supabaseAdmin.from('seil_periods').insert([seilPayload]).select();
          if (seilRes.error && (seilRes.error.code === '42501' || seilRes.error.message?.includes('row-level security'))) {
            seilRes = await directAdminClient.from('seil_periods').insert([seilPayload]).select();
          }
          if (seilRes.error || !seilRes.data || seilRes.data.length === 0) {
            throw new Error(seilRes.error?.message || 'មិនអាចបង្កើតបញ្ជីសីលថ្មីបានទេ');
          }
          seilId = seilRes.data[0].id;
          seilName = seilRes.data[0].name;
        } else {
          if (!seilId) {
            throw new Error('សូមជ្រើសរើសបញ្ជីសីលគោលដៅ');
          }
          const existingSeil = await supabaseAdmin
            .from('seil_periods')
            .select('id, name, date_range_text')
            .eq('id', seilId)
            .single();
          if (existingSeil.error || !existingSeil.data) {
            throw new Error('រកមិនឃើញបញ្ជីសីលគោលដៅនៅក្នុងប្រព័ន្ធទេ');
          }
          seilName = existingSeil.data.date_range_text
            ? `${existingSeil.data.name} (${existingSeil.data.date_range_text})`
            : existingSeil.data.name;
        }

        let existingRows: any[] = [];
        if (sheet.mode === 'append_new' || sheet.mode === 'replace_existing') {
          const exRes = await supabaseAdmin
            .from('financial_records')
            .select('id, type, description, amount, record_date')
            .eq('seil_id', seilId);
          if (exRes.error) {
            throw new Error(`មិនអាចផ្ទៀងផ្ទាត់ទិន្នន័យចាស់បានទេ: ${exRes.error.message}`);
          }
          existingRows = exRes.data || [];
        }

        let rowsToInsert = cleanedRows;
        let skippedDuplicates = 0;

        if (sheet.mode === 'append_new' && existingRows.length > 0) {
          const existingFreq = new Map<string, number>();
          for (const ex of existingRows) {
            const key = normalizeDedupeKey([
              ex.type || 'income',
              ex.description,
              Math.round(Number(ex.amount) || 0),
            ]);
            existingFreq.set(key, (existingFreq.get(key) || 0) + 1);
          }
          const filtered: typeof cleanedRows = [];
          for (const row of cleanedRows) {
            const key = normalizeDedupeKey([row.type, row.name, Math.round(row.amount)]);
            const rem = existingFreq.get(key) || 0;
            if (rem > 0) {
              existingFreq.set(key, rem - 1);
              skippedDuplicates += 1;
            } else {
              filtered.push(row);
            }
          }
          rowsToInsert = filtered;
        }

        const baseTime = Date.now();
        const insertPayloads = rowsToInsert.map((row, idx) => ({
          seil_id: seilId,
          type: row.type,
          description: row.name,
          amount: row.amount,
          record_date: row.record_date,
          note: row.note,
          is_high_level: row.type === 'income' && row.amount >= 100000,
          created_at: new Date(baseTime - (rowsToInsert.length - idx) * 1000).toISOString(),
        }));

        let replacedOldCount = 0;

        if (insertPayloads.length > 0) {
          const ins = await insertRecordsChunked(supabaseAdmin, directAdminClient, 'financial_records', insertPayloads);
          if (ins.error) {
            throw new Error(`បរាជ័យក្នុងការរក្សាទុកជួរទិន្នន័យ: ${ins.error}`);
          }

          if (sheet.mode === 'replace_existing' && existingRows.length > 0) {
            const oldIds = existingRows.map((r) => String(r.id)).filter(Boolean);
            const del = await deleteRecordsByIds(supabaseAdmin, directAdminClient, 'financial_records', oldIds);
            if (del.error) {
              await deleteRecordsByIds(supabaseAdmin, directAdminClient, 'financial_records', ins.insertedIds);
              throw new Error(`មិនអាចសម្អាតទិន្នន័យចាស់បានទេ (បានត្រឡប់ដូចដើម): ${del.error}`);
            }
            replacedOldCount = oldIds.length;
          }
        }

        const totalInsertedAmount = rowsToInsert.reduce((sum, r) => sum + r.amount, 0);
        results.push({
          sheetTitle: cleanSheetTitle,
          targetType: 'seil',
          mode: sheet.mode,
          folderId: seilId,
          folderName: seilName,
          insertedCount: rowsToInsert.length,
          skippedDuplicates,
          replacedOldCount,
          totalAmount: totalInsertedAmount,
          status: 'success',
        });
      }
    } catch (err: any) {
      results.push({
        sheetTitle: cleanSheetTitle,
        targetType: sheet.targetType,
        mode: sheet.mode,
        folderId: sheet.targetId || '',
        folderName: sanitizeText(sheet.newFolderName || cleanSheetTitle, 200),
        insertedCount: 0,
        skippedDuplicates: 0,
        replacedOldCount: 0,
        totalAmount: 0,
        status: 'error',
        error: err?.message || 'មានបញ្ហាមិនរំពឹងទុកក្នុងការនាំចូល',
      });
    }
  }

  const succeededSheets = results.filter((r) => r.status === 'success').length;
  const failedSheets = results.length - succeededSheets;

  return {
    status: failedSheets === results.length ? 400 : 200,
    body: {
      success: succeededSheets > 0,
      summary: {
        totalSheets: results.length,
        succeededSheets,
        failedSheets,
        totalInserted: results.reduce((s, r) => s + r.insertedCount, 0),
        totalSkippedDuplicates: results.reduce((s, r) => s + r.skippedDuplicates, 0),
        totalReplacedOld: results.reduce((s, r) => s + r.replacedOldCount, 0),
      },
      results,
    },
  };
}

// ============================================================
// Clean Slate Reset (Admin-only, preserves profiles & events)
// ============================================================

const resetFinancialDataSchema = z.object({
  scope: z.enum(['all', 'name_lists', 'financial_records']),
  confirmText: z.string().trim().min(1),
  confirmUnderstood: z.literal(true),
});

async function deleteAllRowsFromTable(
  supabaseAdmin: SupabaseClient,
  directAdminClient: SupabaseClient,
  table: 'name_list_records' | 'name_list_categories' | 'financial_records' | 'seil_periods'
): Promise<{ deletedCount: number; error: string | null }> {
  let deletedCount = 0;

  for (let page = 0; page < 50; page++) {
    let sel = await supabaseAdmin.from(table).select('id').limit(1000);
    if (sel.error) {
      sel = await directAdminClient.from(table).select('id').limit(1000);
    }
    if (sel.error) {
      return { deletedCount, error: sel.error.message };
    }

    const ids = (sel.data || []).map((r: any) => String(r.id)).filter(Boolean);
    if (ids.length === 0) break;

    const del = await deleteRecordsByIds(supabaseAdmin, directAdminClient, table, ids);
    if (del.error) {
      return { deletedCount, error: del.error };
    }
    deletedCount += ids.length;

    if (ids.length < 1000) break;
  }

  return { deletedCount, error: null };
}

export async function executeResetFinancialData(
  supabaseAdmin: SupabaseClient,
  directAdminClient: SupabaseClient,
  rawBody: unknown
): Promise<{ status: number; body: any }> {
  const parsed = resetFinancialDataSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        detail: 'សូមបញ្ជាក់ពាក្យ "លុបទាំងអស់" ឬ "DELETE ALL" និងគ្រីសយល់ព្រមជាមុនសិន។',
      },
    };
  }

  const { scope, confirmText } = parsed.data;
  const normalizedConfirm = confirmText.trim().toLowerCase();
  if (normalizedConfirm !== 'delete all' && normalizedConfirm !== 'លុបទាំងអស់') {
    return {
      status: 400,
      body: {
        detail: 'ពាក្យបញ្ជាក់មិនត្រឹមត្រូវទេ — សូមវាយ "លុបទាំងអស់" ឬ "DELETE ALL" ឱ្យបានត្រឹមត្រូវ។',
      },
    };
  }

  const deleted = {
    name_list_records: 0,
    name_list_categories: 0,
    financial_records: 0,
    seil_periods: 0,
  };

  if (scope === 'all' || scope === 'name_lists') {
    const recRes = await deleteAllRowsFromTable(supabaseAdmin, directAdminClient, 'name_list_records');
    if (recRes.error) {
      return { status: 500, body: { detail: `បរាជ័យក្នុងការលុបកំណត់ត្រាបញ្ជីឈ្មោះ: ${recRes.error}` } };
    }
    deleted.name_list_records = recRes.deletedCount;

    const catRes = await deleteAllRowsFromTable(supabaseAdmin, directAdminClient, 'name_list_categories');
    if (catRes.error) {
      return { status: 500, body: { detail: `បរាជ័យក្នុងការលុប Folder បញ្ជីឈ្មោះ: ${catRes.error}` } };
    }
    deleted.name_list_categories = catRes.deletedCount;
  }

  if (scope === 'all' || scope === 'financial_records') {
    const finRes = await deleteAllRowsFromTable(supabaseAdmin, directAdminClient, 'financial_records');
    if (finRes.error) {
      return { status: 500, body: { detail: `បរាជ័យក្នុងការលុបកំណត់ត្រាចំណូល-ចំណាយ: ${finRes.error}` } };
    }
    deleted.financial_records = finRes.deletedCount;

    const seilRes = await deleteAllRowsFromTable(supabaseAdmin, directAdminClient, 'seil_periods');
    if (seilRes.error) {
      return { status: 500, body: { detail: `បរាជ័យក្នុងការលុប Folder ចំណូល-ចំណាយ: ${seilRes.error}` } };
    }
    deleted.seil_periods = seilRes.deletedCount;
  }

  return {
    status: 200,
    body: {
      success: true,
      scope,
      deleted,
    },
  };
}


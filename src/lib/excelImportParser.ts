import * as XLSX from 'xlsx';

export type ImportTargetType = 'category' | 'seil';
export type ImportMode = 'create_new' | 'append_new' | 'replace_existing';

export interface ColumnMapping {
  nameCol: number; // 0-based index, -1 if none
  amountCol: number;
  incomeCol: number;
  expenseCol: number;
  typeCol: number;
  dateCol: number;
  noteCol: number;
  referrerCol: number;
}

export interface ParsedImportRow {
  rowNumber: number; // 1-based original spreadsheet row
  name: string;
  amount: number;
  note: string;
  referrer: string;
  type: 'income' | 'expense';
  record_date: string | null;
}

export interface ParsedSheetDraft {
  id: string;
  sourceFileName: string;
  sheetName: string;
  suggestedFolderName: string;
  rawRows: string[][];
  maxCols: number;
  headerRowIndex: number; // -1 means no header row (start from row 0)
  mapping: ColumnMapping;
  targetType: ImportTargetType;
  mode: ImportMode;
  targetId: string;
  newFolderName: string;
  dateRangeText: string;
  previousBalance: number;
  selected: boolean;
  defaultRecordType: 'income' | 'expense';
}

const KHMER_DIGITS: Record<string, string> = {
  '០': '0',
  '១': '1',
  '២': '2',
  '៣': '3',
  '៤': '4',
  '៥': '5',
  '៦': '6',
  '៧': '7',
  '៨': '8',
  '៩': '9',
};

export function khmerToLatinDigits(input: string): string {
  return input.replace(/[០-៩]/g, (ch) => KHMER_DIGITS[ch] ?? ch);
}

export function columnIndexToLetter(index: number): string {
  let n = index;
  let result = '';
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function cellValueToString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    // Guard against SheetJS / timezone sub-minute midnight drift (e.g. 23:59:17 of previous day)
    const adjusted =
      val.getHours() === 23 && val.getMinutes() >= 55
        ? new Date(val.getTime() + 10 * 60 * 1000)
        : val;
    const y = adjusted.getFullYear();
    const m = String(adjusted.getMonth() + 1).padStart(2, '0');
    const d = String(adjusted.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'object') {
    const obj = val as any;
    if ('result' in obj && obj.result !== undefined && obj.result !== null) {
      return cellValueToString(obj.result);
    }
    if (Array.isArray(obj.richText)) {
      return obj.richText.map((part: any) => part?.text || '').join('').trim();
    }
    if (typeof obj.text === 'string') {
      return obj.text.trim();
    }
    if (typeof obj.hyperlink === 'string' && typeof obj.text === 'string') {
      return obj.text.trim();
    }
  }
  return String(val).trim();
}

export function parseSmartAmount(raw: string): number {
  if (!raw) return 0;
  let s = khmerToLatinDigits(raw).trim();
  if (!s) return 0;

  // Reject pure date strings so date columns are never parsed as amounts
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(s) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(s)) {
    return 0;
  }

  // Strip currency markers and spaces
  s = s.replace(/(៛|រៀល|khr|riel|usd|\$|\s)/gi, '');

  // Handle thousand separators cleanly (e.g. 50,000 or 50.000)
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  } else {
    s = s.replace(/,/g, '');
  }

  // Keep only digits, optional leading minus, optional decimal point
  const match = s.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const num = Number(match[0]);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(num * 100) / 100;
}

export function parseSmartDate(raw: string): string | null {
  if (!raw) return null;
  const s = khmerToLatinDigits(raw).trim();
  if (!s) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

const SUMMARY_ROW_REGEX =
  /^(សរុប|សរុបរួម|បូកសរុប|សមតុល្យ|សរុបបច្ច័យ|សរុបទឹកប្រាក់|សរុបចំណូល|សរុបចំណាយ|total|grand\s*total|sub\s*total|balance|summary)\b/i;

export function isLikelySummaryRow(cells: string[]): boolean {
  const nonEmpty = cells.map((c) => c.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return true;
  for (const cell of nonEmpty) {
    const cleaned = cell.replace(/[:៖\s]+$/g, '').trim();
    if (SUMMARY_ROW_REGEX.test(cleaned)) {
      return true;
    }
  }
  return false;
}

const HEADER_PATTERNS = {
  index: /^(ល\.?រ|លេខរៀង|no\.?|#|index)$/i,
  name: /(ឈ្មោះ|សប្បុរសជន|បរិយាយ|មុខទំនិញ|រាយការណ៍|អ្នកចូលរួម|ម្ចាស់បុណ្យ|name|donor|description|item|particular)/i,
  amount: /(ចំនួនបច្ច័យ|បច្ច័យ|ទឹកប្រាក់|ប្រាក់|ថវិកា|ចំនួនប្រាក់|តម្លៃ|amount|khr|riel|money|price)/i,
  income: /(ចំណូល|ប្រាក់ចូល|income|credit|receipt)/i,
  expense: /(ចំណាយ|ប្រាក់ចេញ|expense|debit|payment|cost)/i,
  type: /(ប្រភេទ|type|category)/i,
  date: /(ថ្ងៃ|កាលបរិច្ឆេទ|ថ្ងៃខែ|date)/i,
  note: /(កំណត់ចំណាំ|កំណត់សម្គាល់|ផ្សេងៗ|ទីលំនៅ|ភូមិ|អាសយដ្ឋាន|note|remark|location|address|village|comment)/i,
  referrer: /(អ្នកណែនាំ|តាមរយៈ|អ្នកទទួល|referrer|via|collector)/i,
};

export function detectHeaderRowIndex(rawRows: string[][]): number {
  const limit = Math.min(rawRows.length, 15);
  let bestIdx = -1;
  let bestScore = 0;

  for (let r = 0; r < limit; r++) {
    const row = rawRows[r] || [];
    let score = 0;
    const nonEmptyCount = row.filter((c) => c.trim().length > 0).length;
    if (nonEmptyCount < 2) continue;

    for (const cell of row) {
      const c = cell.trim();
      if (!c || c.length > 60) continue;
      if (HEADER_PATTERNS.name.test(c)) score += 3;
      if (HEADER_PATTERNS.amount.test(c)) score += 3;
      if (HEADER_PATTERNS.income.test(c)) score += 2.5;
      if (HEADER_PATTERNS.expense.test(c)) score += 2.5;
      if (HEADER_PATTERNS.index.test(c)) score += 2;
      if (HEADER_PATTERNS.date.test(c)) score += 1.5;
      if (HEADER_PATTERNS.note.test(c)) score += 1.5;
      if (HEADER_PATTERNS.type.test(c)) score += 1.5;
      if (HEADER_PATTERNS.referrer.test(c)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIdx = r;
    }
  }

  return bestScore >= 3 ? bestIdx : -1;
}

export function detectColumnMapping(rawRows: string[][], headerRowIndex: number, maxCols: number): ColumnMapping {
  const mapping: ColumnMapping = {
    nameCol: -1,
    amountCol: -1,
    incomeCol: -1,
    expenseCol: -1,
    typeCol: -1,
    dateCol: -1,
    noteCol: -1,
    referrerCol: -1,
  };

  if (headerRowIndex >= 0 && rawRows[headerRowIndex]) {
    const headers = rawRows[headerRowIndex];
    headers.forEach((cell, colIdx) => {
      const h = (cell || '').trim();
      if (!h) return;

      if (mapping.incomeCol === -1 && HEADER_PATTERNS.income.test(h)) {
        mapping.incomeCol = colIdx;
      } else if (mapping.expenseCol === -1 && HEADER_PATTERNS.expense.test(h)) {
        mapping.expenseCol = colIdx;
      } else if (mapping.amountCol === -1 && HEADER_PATTERNS.amount.test(h)) {
        mapping.amountCol = colIdx;
      } else if (mapping.nameCol === -1 && HEADER_PATTERNS.name.test(h)) {
        mapping.nameCol = colIdx;
      } else if (mapping.dateCol === -1 && HEADER_PATTERNS.date.test(h)) {
        mapping.dateCol = colIdx;
      } else if (mapping.typeCol === -1 && HEADER_PATTERNS.type.test(h)) {
        mapping.typeCol = colIdx;
      } else if (mapping.referrerCol === -1 && HEADER_PATTERNS.referrer.test(h)) {
        mapping.referrerCol = colIdx;
      } else if (mapping.noteCol === -1 && HEADER_PATTERNS.note.test(h)) {
        mapping.noteCol = colIdx;
      }
    });
  }

  // Fallback heuristics from sample rows when header labels are missing or unconventional
  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  const sampleRows = rawRows.slice(startRow, startRow + 40).filter((r) => !isLikelySummaryRow(r));

  if (sampleRows.length > 0 && (mapping.nameCol === -1 || (mapping.amountCol === -1 && mapping.incomeCol === -1 && mapping.expenseCol === -1))) {
    const colStats = Array.from({ length: maxCols }, (_, colIdx) => {
      let textCount = 0;
      let totalTextLen = 0;
      let amountCount = 0;
      let bigAmountCount = 0;
      let smallSeqCount = 0;

      for (const row of sampleRows) {
        const val = (row[colIdx] || '').trim();
        if (!val) continue;
        const amt = parseSmartAmount(val);
        const latin = khmerToLatinDigits(val).replace(/[,\s៛]/g, '');
        if (amt > 0 && /^\d+(\.\d+)?$/.test(latin)) {
          amountCount++;
          if (amt >= 500) bigAmountCount++;
          else smallSeqCount++;
        } else if (!parseSmartDate(val) && val.length >= 2) {
          textCount++;
          totalTextLen += val.length;
        }
      }

      return { colIdx, textCount, avgLen: textCount ? totalTextLen / textCount : 0, amountCount, bigAmountCount, smallSeqCount };
    });

    if (mapping.amountCol === -1 && mapping.incomeCol === -1 && mapping.expenseCol === -1) {
      const bestAmt = [...colStats]
        .filter((s) => s.colIdx !== mapping.nameCol && s.bigAmountCount > 0)
        .sort((a, b) => b.bigAmountCount - a.bigAmountCount || b.amountCount - a.amountCount)[0];
      if (bestAmt) {
        mapping.amountCol = bestAmt.colIdx;
      }
    }

    if (mapping.nameCol === -1) {
      const bestName = [...colStats]
        .filter(
          (s) =>
            s.colIdx !== mapping.amountCol &&
            s.colIdx !== mapping.incomeCol &&
            s.colIdx !== mapping.expenseCol &&
            s.colIdx !== mapping.dateCol &&
            s.textCount > 0
        )
        .sort((a, b) => b.textCount * Math.min(b.avgLen, 25) - a.textCount * Math.min(a.avgLen, 25))[0];
      if (bestName) {
        mapping.nameCol = bestName.colIdx;
      }
    }
  }

  return mapping;
}

export function extractRowsFromSheet(sheet: ParsedSheetDraft): {
  rows: ParsedImportRow[];
  skippedSummaryRows: number;
  skippedInvalidRows: number;
  totalIncome: number;
  totalExpense: number;
  totalAmount: number;
} {
  const { rawRows, headerRowIndex, mapping, targetType, defaultRecordType } = sheet;
  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  const rows: ParsedImportRow[] = [];
  let skippedSummaryRows = 0;
  let skippedInvalidRows = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = startRow; i < rawRows.length; i++) {
    const cells = rawRows[i] || [];
    const hasAnyValue = cells.some((c) => c.trim().length > 0);
    if (!hasAnyValue) continue;

    if (isLikelySummaryRow(cells)) {
      skippedSummaryRows++;
      continue;
    }

    const name = mapping.nameCol >= 0 ? (cells[mapping.nameCol] || '').trim() : '';
    const note = mapping.noteCol >= 0 ? (cells[mapping.noteCol] || '').trim() : '';
    const referrer = mapping.referrerCol >= 0 ? (cells[mapping.referrerCol] || '').trim() : '';
    const rawDate = mapping.dateCol >= 0 ? (cells[mapping.dateCol] || '').trim() : '';
    const record_date = parseSmartDate(rawDate);

    if (!name) {
      skippedInvalidRows++;
      continue;
    }

    // Separate income/expense columns mode (common in temple accounting spreadsheets)
    if (targetType === 'seil' && (mapping.incomeCol >= 0 || mapping.expenseCol >= 0)) {
      const incAmt = mapping.incomeCol >= 0 ? parseSmartAmount(cells[mapping.incomeCol] || '') : 0;
      const expAmt = mapping.expenseCol >= 0 ? parseSmartAmount(cells[mapping.expenseCol] || '') : 0;

      if (incAmt <= 0 && expAmt <= 0) {
        skippedInvalidRows++;
        continue;
      }

      if (incAmt > 0) {
        rows.push({
          rowNumber: i + 1,
          name,
          amount: incAmt,
          note,
          referrer,
          type: 'income',
          record_date,
        });
        totalIncome += incAmt;
      }

      if (expAmt > 0) {
        rows.push({
          rowNumber: i + 1,
          name,
          amount: expAmt,
          note,
          referrer,
          type: 'expense',
          record_date,
        });
        totalExpense += expAmt;
      }
      continue;
    }

    // Single amount column mode
    const singleAmt =
      mapping.amountCol >= 0
        ? parseSmartAmount(cells[mapping.amountCol] || '')
        : mapping.incomeCol >= 0
        ? parseSmartAmount(cells[mapping.incomeCol] || '')
        : mapping.expenseCol >= 0
        ? parseSmartAmount(cells[mapping.expenseCol] || '')
        : 0;

    if (singleAmt <= 0) {
      skippedInvalidRows++;
      continue;
    }

    let rowType: 'income' | 'expense' = defaultRecordType;
    if (mapping.typeCol >= 0) {
      const rawType = (cells[mapping.typeCol] || '').trim().toLowerCase();
      if (/(ចំណាយ|expense|out|debit|ប្រាក់ចេញ)/i.test(rawType)) {
        rowType = 'expense';
      } else if (/(ចំណូល|income|in|credit|ប្រាក់ចូល)/i.test(rawType)) {
        rowType = 'income';
      }
    }

    rows.push({
      rowNumber: i + 1,
      name,
      amount: singleAmt,
      note,
      referrer,
      type: rowType,
      record_date,
    });

    if (rowType === 'expense') totalExpense += singleAmt;
    else totalIncome += singleAmt;
  }

  return {
    rows,
    skippedSummaryRows,
    skippedInvalidRows,
    totalIncome,
    totalExpense,
    totalAmount: totalIncome + totalExpense,
  };
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

const SPREADSHEET_EXT_REGEX = /\.(xlsb|xlsx|xlsm|xls|ods)$/i;

function cleanFileBaseName(fileName: string): string {
  return fileName.replace(/\.(xlsb|xlsx|xlsm|xls|ods|csv)$/i, '').trim();
}

function inferFolderName(fileName: string, sheetName: string, totalSheetsInFile: number, rawRows: string[][]): string {
  const isGenericSheet = /^sheet\s*\d+$/i.test(sheetName.trim()) || /^សន្លឹក\s*\d+$/i.test(sheetName.trim());
  if (!isGenericSheet && totalSheetsInFile > 1) {
    return sheetName.trim();
  }
  // Check if row 0 is a single-cell Khmer title banner
  if (rawRows.length > 0) {
    const firstNonEmpty = rawRows[0].filter((c) => c.trim().length > 0);
    if (firstNonEmpty.length === 1 && firstNonEmpty[0].length >= 6 && firstNonEmpty[0].length <= 120) {
      return firstNonEmpty[0].trim();
    }
  }
  if (!isGenericSheet) return sheetName.trim();
  return cleanFileBaseName(fileName) || sheetName.trim();
}

export interface ExistingFolderRef {
  id: string;
  name: string;
  date_range_text?: string;
}

function findMatchingExistingId(candidateName: string, list: ExistingFolderRef[]): string {
  const norm = candidateName.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!norm) return '';
  const exact = list.find((item) => item.name.trim().toLowerCase().replace(/\s+/g, ' ') === norm);
  if (exact) return exact.id;
  return '';
}

export async function parseExcelFilesToDrafts(
  files: File[],
  defaultTarget: ImportTargetType,
  existingCategories: ExistingFolderRef[],
  existingSeils: ExistingFolderRef[]
): Promise<{ drafts: ParsedSheetDraft[]; warnings: string[] }> {
  const drafts: ParsedSheetDraft[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const lower = file.name.toLowerCase();

    if (file.name.startsWith('~$') || file.name.startsWith('.')) {
      continue; // Skip hidden macOS files (.DS_Store) & Excel lock temp files (~$...)
    }

    const isCsv = lower.endsWith('.csv');
    const isSpreadsheet = SPREADSHEET_EXT_REGEX.test(lower);

    if (!isSpreadsheet && !isCsv) {
      warnings.push(`រំលងឯកសារ "${file.name}" (គាំទ្រ .xlsb, .xlsx, .xlsm, .xls, .ods និង .csv)`);
      continue;
    }

    try {
      if (isCsv) {
        const text = await file.text();
        const rawRows = parseCsvText(text);
        if (rawRows.length === 0) {
          warnings.push(`ឯកសារ "${file.name}" មិនមានទិន្នន័យទេ`);
          continue;
        }
        const maxCols = Math.max(...rawRows.map((r) => r.length), 0);
        const headerRowIndex = detectHeaderRowIndex(rawRows);
        const mapping = detectColumnMapping(rawRows, headerRowIndex, maxCols);
        const folderName = inferFolderName(file.name, cleanFileBaseName(file.name), 1, rawRows);
        const targetType: ImportTargetType =
          mapping.incomeCol >= 0 && mapping.expenseCol >= 0 ? 'seil' : defaultTarget;

        const matchedId =
          targetType === 'category'
            ? findMatchingExistingId(folderName, existingCategories)
            : findMatchingExistingId(folderName, existingSeils);

        drafts.push({
          id: `${file.name}__csv__${drafts.length}`,
          sourceFileName: file.name,
          sheetName: cleanFileBaseName(file.name),
          suggestedFolderName: folderName,
          rawRows,
          maxCols,
          headerRowIndex,
          mapping,
          targetType,
          mode: matchedId ? 'append_new' : 'create_new',
          targetId: matchedId,
          newFolderName: folderName,
          dateRangeText: '',
          previousBalance: 0,
          selected: true,
          defaultRecordType:
            folderName.includes('ចំណាយ') ? 'expense' : 'income',
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });

        const totalSheets = workbook.SheetNames.length;
        if (totalSheets === 0) {
          warnings.push(`ឯកសារ "${file.name}" មិនមាន Sheet ទេ`);
          continue;
        }

        workbook.SheetNames.forEach((wsName, wsIdx) => {
          const ws = workbook.Sheets[wsName];
          if (!ws) return;

          const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
            header: 1,
            raw: true,
            defval: '',
            blankrows: false,
          });

          const rawRows: string[][] = [];
          let maxCols = 0;

          for (const row of sheetRows) {
            if (!Array.isArray(row) || row.length === 0) continue;
            const cappedLen = Math.min(row.length, 40);
            const values: string[] = [];
            let lastNonEmptyIdx = -1;

            for (let c = 0; c < cappedLen; c++) {
              const str = cellValueToString(row[c]);
              values.push(str);
              if (str.length > 0) lastNonEmptyIdx = c;
            }

            if (lastNonEmptyIdx >= 0) {
              const trimmed = values.slice(0, lastNonEmptyIdx + 1);
              rawRows.push(trimmed);
              if (trimmed.length > maxCols) maxCols = trimmed.length;
            }
          }

          if (rawRows.length === 0) return;

          const headerRowIndex = detectHeaderRowIndex(rawRows);
          const mapping = detectColumnMapping(rawRows, headerRowIndex, maxCols);
          const folderName = inferFolderName(file.name, wsName, totalSheets, rawRows);

          // Auto-detect Seil vs Category
          const looksFinancial =
            (mapping.incomeCol >= 0 && mapping.expenseCol >= 0) ||
            /(ចំណូល.*ចំណាយ|បញ្ជីសីល|វេនសីល)/i.test(wsName);
          const targetType: ImportTargetType = looksFinancial ? 'seil' : defaultTarget;

          const matchedId =
            targetType === 'category'
              ? findMatchingExistingId(folderName, existingCategories)
              : findMatchingExistingId(folderName, existingSeils);

          // Unselect WSD backup overview sheets or hidden Excel sheets by default
          const isOverviewSheet = wsName.trim() === 'ព័ត៌មានទូទៅ' || wsName.trim() === 'បញ្ជីសីល';
          const isHiddenSheet = Boolean(workbook.Workbook?.Sheets?.[wsIdx]?.Hidden);

          drafts.push({
            id: `${file.name}__${wsIdx}__${wsName}`,
            sourceFileName: file.name,
            sheetName: wsName,
            suggestedFolderName: folderName,
            rawRows,
            maxCols,
            headerRowIndex,
            mapping,
            targetType,
            mode: matchedId ? 'append_new' : 'create_new',
            targetId: matchedId,
            newFolderName: folderName,
            dateRangeText: '',
            previousBalance: 0,
            selected: !isOverviewSheet && !isHiddenSheet,
            defaultRecordType:
              wsName.includes('ចំណាយ') || folderName.includes('ចំណាយ') ? 'expense' : 'income',
          });
        });
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/password|encrypt/i.test(msg)) {
        warnings.push(`ឯកសារ "${file.name}" ជាប់លេខសម្ងាត់ (Password-protected) — សូមដោះសោក្នុង Excel មុននឹងនាំចូល`);
      } else {
        warnings.push(`មិនអាចអានឯកសារ "${file.name}" បានទេ: ${msg || 'File format error'}`);
      }
    }
  }

  return { drafts, warnings };
}

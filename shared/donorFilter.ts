/**
 * Shared donor filtering, name normalization, and cross-list deduplication
 * used by both Express (`server/routers/name_lists.ts`) and Cloudflare Workers (`worker/routes/nameLists.ts`).
 */

export const KNOWN_VILLAGES_OR_AREAS = new Set([
  'ទ្រាលើ',
  'ត្បាច',
  'តាខូយ',
  'ស្វាយពពារ',
  'ក្បាលសំរោង',
  'ត្រពាំងវិហារ',
  'អញ្ចាញខាងលិច',
  'ភូមិស្វាយចេក',
  'ភូមិថ្មី',
  'ភូមិស្មន់មុន្នី',
  'ភូមិក្រាំងឡង',
  'ភូមិព្រៃរបង',
]);

/** Keywords that identify a non-donation folder/category or financial period */
const NON_DONATION_SOURCE_KEYWORDS = [
  'លុយជាង',
  'ជាងដក',
  'ខ្ចី',
  'បំណុល',
  'ដកប្រាក់',
  'ទូទាត់',
  'លក់ស្រូវ',
  'នៅសល់',
  'បច្ច័យសល់',
  'កឋិនតាមវត្ត',
];

/** Exact non-donor labels */
const EXCLUDED_EXACT_NAMES = new Set([
  'ខ្ចី',
  'មិនស្គាល់ឈ្មោះ',
  'បុណ្យ១០០ថ្ងៃ',
  'បុណ្យផ្កា',
  'បុណ្យកឋិន',
  'ថ្ងៃសីល',
  'ញាតិញោមមកពីភ្នំជីសូរ',
  'គេចូលតាមរយៈមេភូមិ',
  'លោកបងចិត្តទេសនា',
  'បន្ថែមបច្ច័យវត្ត',
]);

/** Name prefixes that represent expenses, temple funds, collective groups, or institutions rather than individual donors */
const EXCLUDED_NAME_PREFIXES = [
  // Worker withdrawals & loans
  'ជាងអ៊ុំ',
  'លុយជាង',
  'ដកប្រាក់',
  'ខ្ចី',
  'សង',
  // Expense / purchase / service items
  'ទិញ',
  'ជួល',
  'ព្រីន',
  'ឈ្នួល',
  'ថ្លៃ',
  'បង់',
  'ចំណាយ',
  'សម្ភារៈ',
  'ជួសជុល',
  'ផ្សា',
  // Temple internal funds, collection boxes & leftover balances
  'បច្ច័យប្រចាំសីល',
  'បច្ច័យថ្ងៃសីល',
  'បច្ច័យសល់',
  'បច្ច័យទទួលបាន',
  'បច្ច័យវត្ត',
  'បន្ថែមបច្ច័យ',
  'ថវិកាវត្ត',
  'លុយវត្ត',
  'លុយសល់',
  'ប្រាក់សល់',
  'សល់ពី',
  'ប្រអប់បច្ច័យ',
  'ធុងបច្ច័យ',
  'លក់ស្រូវ',
  'សរុប',
  // Temples, villages, public administration & collective groups
  'វត្ត',
  'ភូមិ',
  'រដ្ឋបាល',
  'សាលាឃុំ',
  'សាលាស្រុក',
  'គណៈកម្មការ',
  'បរិស័ទ',
  'ពុទ្ធបរិស័ទ',
  'ញាតិញោម',
  'គេចូល',
];

/** Normalize Khmer Unicode keystroke variations (e.g. ស៊្រ vs ស្រ៊) and strip zero-width spaces */
export function normalizeKhmerText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u200B/g, '')
    // Normalize consonant shifter (៊/៉) + coeng ro (្រ) order so ស៊្រឹង === ស្រ៊ឹង
    .replace(/([\u17C9\u17CA])\u17D2\u179A/g, '\u17D2\u179A$1')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Returns true if a category name or seil period name is NOT a donation list */
export function isNonDonationSource(sourceName?: string | null): boolean {
  if (!sourceName) return false;
  const norm = normalizeKhmerText(sourceName);
  // Exclude expense-only categories/periods (e.g. "បញ្ជីថវិការចំណាយ...", "ចំណាយទូទៅ"),
  // while keeping combined "បញ្ជី ចំណូល-ចំណាយ" ledgers whose income rows contain real donors.
  if (norm.includes('ចំណាយ') && !norm.includes('ចំណូល')) return true;
  return NON_DONATION_SOURCE_KEYWORDS.some((kw) => norm.includes(kw));
}

/**
 * Checks whether a record represents a legitimate individual/family benefactor
 * from a donation list (excluding expenses, worker advances, temple funds,
 * sermon collections, villages, temples, and administrative bodies).
 */
export function isHighTierIndividualDonor(
  name: string,
  sourceName?: string,
  note?: string
): boolean {
  if (!name) return false;
  const n = normalizeKhmerText(name);
  if (!n) return false;

  // Exclude records from non-donation categories or periods (e.g. expenses, worker advances)
  if (sourceName && isNonDonationSource(sourceName)) return false;

  // Exclude explicit worker-loan log notes (e.g. "ខ្ចីថ្ងៃ 7/3/2026...")
  const normNote = normalizeKhmerText(note || '');
  if (normNote.startsWith('ខ្ចីថ្ងៃ')) return false;

  // Exclude exact non-donor labels & known village names
  if (EXCLUDED_EXACT_NAMES.has(n)) return false;
  if (KNOWN_VILLAGES_OR_AREAS.has(n)) return false;

  // Exclude collective/internal/expense prefixes
  for (const prefix of EXCLUDED_NAME_PREFIXES) {
    if (n.startsWith(prefix)) return false;
  }

  // Exclude collective stupa/chedei fund or sermon collections
  if (n.includes('ចេតិយរួម')) return false;
  if (n.endsWith('ទេសនា')) return false;

  return true;
}

export function normalizeDonorName(name: string): string {
  if (!name) return '';
  let clean = normalizeKhmerText(name);

  // Remove content in parentheses e.g. (ក្រាំងលៀវ), (Sing Sing), (កូនចៅ), (កំពង់ស្ពឺ)
  clean = clean.replace(/\s*\([^)]*\)/g, '');

  // Remove common family and group suffixes (including minor spelling typos like ព្រះទាំងកូនចៅ)
  clean = clean.replace(
    /\s+(ព្រមទាំងកូនចៅ|ព្រះទាំងកូនចៅ|ព្រមទាំកូនចៅ|ព្រមទាំងបុត្រ|ព្រមទាំងបុត្រធីតា|ព្រមទាំងក្រុមគ្រួសារ|និងក្រុមគ្រួសារ|និងកូនចៅ|និងបុត្រ|ព្រមទាំងញាតិមិត្ត|កូនចៅ|និងភរិយា|ព្រមទាំង\s*ភរិយា|ភរិយា)$/g,
    ''
  );

  // Remove polite titles, monk titles, elders, and group prefixes (run twice for compound prefixes)
  const prefixRegex =
    /^(ក្រុមគ្រួសារលោកតា|ក្រុមគ្រួសារលោកយាយ|ក្រុមគ្រួសារលោក|ក្រុមគ្រួសារ|ក្រុមកូនចៅ\s*លោកយាយ|ក្រុមកូនចៅ\s*លោកតា|ក្រុមកូនចៅ|កូនចៅ\s*លោកយាយ|កូនចៅ\s*លោកតា|កូនចៅ|ក្រុមញាតិព្រះធម៌\s*លោកយាយ|ក្រុមញាតិព្រះធម៌\s*លោកតា|ក្រុមញាតិព្រះធម៌|ក្រុមឧបាសិកា|ក្រុមឧបាសក|ក្រុម|បុណ្យសព|លោកគ្រូពេទ្យ|លោគ្រូពេទ្យ|អ្នកគ្រូពេទ្យ|លោកយាយ|លោកតា|ឧបាសិកា|ឧបាសក|ព្រះតេជគុណ|ភិក្ខុ|លោកគ្រូ|អ្នកគ្រូ|គ្រូ|លោកស្រី|អ្នកស្រី|អ្នកមីង|មីង|កញ្ញា|ពូ|ញោម|លោក|យាយ|តា|កុង|ម៉ែ|ឪ|ពេទ្យ|ឧ\.ក|ឧ\.សិ)\s*/g;
  clean = clean.replace(prefixRegex, '');
  clean = clean.replace(prefixRegex, '');

  // Remove location suffix if attached directly e.g. "ភូមិព្រៃស្មាច់"
  clean = clean.replace(/\s+ភូមិ[\u1780-\u17D2]+$/g, '');

  // Normalize silent vowels on same names: e.g. ប៊ុនរិទ្ធិ -> ប៊ុនរិទ្ធ
  clean = clean.replace(/ប៊ុន\s*រិទ្ធិ?/g, 'ប៊ុនរិទ្ធ');

  // If there are comma-separated names, extract the primary person
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim());
    if (parts[0]) clean = parts[0];
  }

  return clean.trim().toLowerCase();
}

export interface LinkedFinancialDetail {
  fin_id: string;
  seil_name: string;
  fr_note: string;
  fr_date: string;
}

/**
 * Checks whether a name_list_category and a seil_period represent the exact same mirrored event list
 * (e.g. category "ជាវទូរទឹកកកប្រគេនព្រះសង្ឃ" vs seil "បញ្ជីឈ្មោះសប្បុរសជនចូលរួមបច្ច័យជាវទូរទឹកកកប្រគេនព្រះសង្ឃ").
 */
function isMirroredEventList(catName: string, seilName: string): boolean {
  const c = normalizeKhmerText(catName).replace(/\s*\([^)]*\)/g, '').trim();
  const s = normalizeKhmerText(seilName).replace(/\s*\([^)]*\)/g, '').trim();
  if (!c || !s) return false;
  // Ignore generic seil names like "បញ្ជី ចំណូល-ចំណាយ"
  if (s.includes('ចំណូល-ចំណាយ') || s.includes('ចំណូលចំណាយ')) return false;
  if (c.length >= 6 && s.includes(c)) return true;
  if (s.length >= 6 && c.includes(s)) return true;
  return false;
}

export function findCrossListedFinancialRecordIds(
  nameRecords: any[],
  finRecords: any[],
  catMap: Record<string, string>,
  seilMap: Record<string, string>
) {
  const matchedFinIds = new Set<string>();
  const linkedDetails = new Map<string, LinkedFinancialDetail>();

  // Pass 1: Exact / fuzzy matches for mirrored event lists (e.g. refrigerator fund) and construction lists
  const validNameRecords = nameRecords.filter((nr) => {
    const catName = nr.category_id ? catMap[nr.category_id] : '';
    return !!catName && !isNonDonationSource(catName);
  });

  // First sub-pass: high-confidence name + amount matching
  validNameRecords.forEach((nr) => {
    const nrNorm = normalizeDonorName(nr.name);
    const nrAmt = Number(nr.amount);
    if (!nrNorm || nrAmt <= 0) return;

    const nrCat = catMap[nr.category_id] || '';
    const isConstruction = nrCat.includes('កសាង');

    const match = finRecords.find((fr) => {
      if (matchedFinIds.has(fr.id)) return false;
      if (Number(fr.amount) !== nrAmt) return false;

      const seilName = seilMap[fr.seil_id] || '';
      const isMirrored = isMirroredEventList(nrCat, seilName);
      if (!isConstruction && !isMirrored) return false;

      const frNorm = normalizeDonorName(fr.description);
      if (!frNorm) return false;

      // Exact normalized match or strong substring match
      if (
        frNorm === nrNorm ||
        (nrNorm.length >= 4 && (frNorm.includes(nrNorm) || nrNorm.includes(frNorm)))
      ) {
        if (isMirrored) return true;
        const frNote = (fr.note || '').toLowerCase();
        const frDesc = (fr.description || '').toLowerCase();
        const isFrConstruction = frNote.includes('កសាង') || frDesc.includes('កសាង');
        if (isFrConstruction) return true;
        const timeDiffDays =
          Math.abs(new Date(nr.created_at).getTime() - new Date(fr.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        if (timeDiffDays <= 14) return true;
      }

      // Known Khmer spelling variations across mirrored / construction lists
      const n1 = normalizeKhmerText(nr.name || '').replace(/\s+/g, '');
      const n2 = normalizeKhmerText(fr.description || '').replace(/\s+/g, '');
      if (n1.includes('ឆេងប៉េងគុណ') && n2.includes('ឆេងប៉េងគុណ')) return true;
      if (n1.includes('ស៊ីនួន') && n2.includes('ស៊ីនួន')) return true;
      if (n1.includes('ឆេងស៊ុយ') && n2.includes('ឆេងស៊ុយ')) return true;
      if (n1.includes('កុងសុក') && n2.includes('កុងសុភ')) return true;
      // Construction cross-listed funeral donation typo: កឹម ព្រើម vs កឹម ញ៉ឹម
      if (n1.includes('កឹមព្រើម') && n2.includes('កឹមញ៉ឹម')) return true;
      // Construction cross-listed couple typo: ស្រ៊ីម/ង៉ែត vs ស្រ៊ឹម/ម៉ែត
      if (
        (n1.includes('ស្រ៊ីម') || n1.includes('ស៊្រីម')) &&
        (n2.includes('ស្រ៊ឹម') || n2.includes('ស៊្រឹម'))
      ) {
        return true;
      }
      // Mirrored list minor typos (e.g. លោកយាយ ស្រ៊ឹង vs មាន ស្រ៊ឹង, យា ជូ vs យា ផូ)
      if (isMirrored) {
        if (n1.includes('ស្រ៊ឹង') && n2.includes('ស្រ៊ឹង')) return true;
        if (n1.includes('យាជូ') && n2.includes('យាផូ')) return true;
      }

      return false;
    });

    if (match) {
      matchedFinIds.add(match.id);
      linkedDetails.set(nr.id, {
        fin_id: match.id,
        seil_name: seilMap[match.seil_id] || 'បញ្ជីចំណូលចំណាយ',
        fr_note: match.note || '',
        fr_date: match.record_date || match.created_at,
      });
    }
  });

  // Second sub-pass for mirrored lists: if an entire seil_period mirrors a name_list_category
  // (e.g. both have identical purpose title) and there are still unmatched records with exact same amount,
  // pair remaining 1-to-1 same-amount entries inside the mirrored list so minor Khmer spelling differences never double-count.
  validNameRecords.forEach((nr) => {
    if (linkedDetails.has(nr.id)) return;
    const nrAmt = Number(nr.amount);
    if (nrAmt <= 0) return;
    const nrCat = catMap[nr.category_id] || '';

    const match = finRecords.find((fr) => {
      if (matchedFinIds.has(fr.id)) return false;
      if (Number(fr.amount) !== nrAmt) return false;
      const seilName = seilMap[fr.seil_id] || '';
      return isMirroredEventList(nrCat, seilName);
    });

    if (match) {
      matchedFinIds.add(match.id);
      linkedDetails.set(nr.id, {
        fin_id: match.id,
        seil_name: seilMap[match.seil_id] || 'បញ្ជីចំណូលចំណាយ',
        fr_note: match.note || '',
        fr_date: match.record_date || match.created_at,
      });
    }
  });

  return { matchedFinIds, linkedDetails };
}

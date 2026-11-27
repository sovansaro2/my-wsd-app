import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  User,
  MapPin,
  Calendar,
  Award,
  Layers,
  Heart,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { playSuccessSound, playFailSound } from '../lib/sound';
import { LoadingScreen } from './ui/LoadingScreen';

interface DonorRecord {
  id: string;
  name: string;
  amount: number;
  source_type: 'seil' | 'category';
  source_name: string;
  source_id: string;
  date: string;
  note: string;
  referrer?: string;
  is_cross_listed?: boolean;
  cross_listed_info?: string;
}

interface DonorGroup {
  name: string;
  total_amount: number;
  contributions_count: number;
  locations: string[];
  records: DonorRecord[];
}

interface SearchResponse {
  total_donors_found: number;
  total_contributions_found: number;
  donors: DonorGroup[];
  recent_items: DonorRecord[];
}

interface HundredKDonor {
  id: string;
  name: string;
  amount: number;
  category_name: string;
  source_type?: 'category' | 'seil';
}

interface ContributionTypeOption {
  key: string; // 'all' | 'seil_all' | `cat:${source_id}` | `seil:${source_id}`
  label: string;
  sourceType: 'all' | 'seil_all' | 'category' | 'seil';
  donorCount: number;
  recordCount: number;
  totalAmount: number;
}

const toKhmerNum = (num: number | string): string => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num
    .toString()
    .split('')
    .map(digit => (khmerNumbers[parseInt(digit, 10)] !== undefined ? khmerNumbers[parseInt(digit, 10)] : digit))
    .join('');
};

const formatRecordDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.split('T')[0] || dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function DonationsPage({
  userRole,
  onNavigateTab,
}: {
  userRole?: 'admin' | 'user' | null;
  onNavigateTab?: (tab: 'records' | 'categories' | 'account') => void;
}) {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const formatNum = (n: number) => (isKm ? toKhmerNum(n.toLocaleString()) : n.toLocaleString());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allDonors, setAllDonors] = useState<DonorGroup[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [highTierDonors, setHighTierDonors] = useState<HundredKDonor[]>([]);

  // Global search & view filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'by_type' | 'top_benefactors' | 'high_tier'>('by_type');
  const [selectedTypeKey, setSelectedTypeKey] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'count'>('amount');
  const [expandedDonors, setExpandedDonors] = useState<Record<string, boolean>>({});
  const [displayLimit, setDisplayLimit] = useState(25);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Admin Edit / Delete states
  const [editingRecord, setEditingRecord] = useState<{
    id: string;
    donor_name: string;
    recorded_name: string;
    amount: number;
    date: string;
    note: string;
    source_name: string;
    source_type: 'category' | 'seil';
  } | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    name: string;
    amount: number;
    source_name: string;
    source_type: 'category' | 'seil';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [searchRes, hundredKRes] = await Promise.all([
        api.get<SearchResponse>('/api/name-lists/search-donors?q=').catch(() => ({
          total_donors_found: 0,
          total_contributions_found: 0,
          donors: [],
          recent_items: [],
        })),
        api.get100kDonors().catch(() => []),
      ]);
      setAllDonors(Array.isArray(searchRes?.donors) ? searchRes.donors : []);
      setTotalRecordsCount(searchRes?.total_contributions_found || 0);
      setHighTierDonors(Array.isArray(hundredKRes) ? hundredKRes : []);
    } catch (err: any) {
      setError(err.message || (isKm ? 'មិនអាចផ្ទុកទិន្នន័យសប្បុរសជនបានទេ' : 'Failed to load donors'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const onRefreshed = () => fetchAllData();
    window.addEventListener('wsd-data-refreshed', onRefreshed);
    return () => window.removeEventListener('wsd-data-refreshed', onRefreshed);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayLimit(25);
  }, [searchTerm, activeView, selectedTypeKey, sortBy]);

  // Extract all real contribution types dynamically from donor records
  const contributionTypes = useMemo<ContributionTypeOption[]>(() => {
    const categoryMap = new Map<string, { label: string; donors: Set<string>; records: number; total: number }>();
    const seilDonors = new Set<string>();
    let seilRecords = 0;
    let seilTotal = 0;
    let grandTotal = 0;

    allDonors.forEach((donor) => {
      grandTotal += donor.total_amount;
      donor.records.forEach((rec) => {
        if (rec.source_type === 'seil') {
          seilDonors.add(donor.name);
          seilRecords += 1;
          seilTotal += rec.amount;
        } else {
          const catKey = `cat:${rec.source_id || rec.source_name}`;
          const existing = categoryMap.get(catKey);
          if (existing) {
            existing.donors.add(donor.name);
            existing.records += 1;
            existing.total += rec.amount;
          } else {
            categoryMap.set(catKey, {
              label: rec.source_name,
              donors: new Set([donor.name]),
              records: 1,
              total: rec.amount,
            });
          }
        }
      });
    });

    const list: ContributionTypeOption[] = [
      {
        key: 'all',
        label: isKm ? 'ទាំងអស់' : 'All Types',
        sourceType: 'all',
        donorCount: allDonors.length,
        recordCount: totalRecordsCount,
        totalAmount: grandTotal,
      },
    ];

    if (seilRecords > 0) {
      list.push({
        key: 'seil_all',
        label: isKm ? 'បច្ច័យវេនសីល' : 'Seil Offerings',
        sourceType: 'seil_all',
        donorCount: seilDonors.size,
        recordCount: seilRecords,
        totalAmount: seilTotal,
      });
    }

    const sortedCategories = Array.from(categoryMap.entries())
      .map(([key, val]) => ({
        key,
        label: val.label,
        sourceType: 'category' as const,
        donorCount: val.donors.size,
        recordCount: val.records,
        totalAmount: val.total,
      }))
      .sort((a, b) => b.donorCount - a.donorCount || b.totalAmount - a.totalAmount);

    return [...list, ...sortedCategories];
  }, [allDonors, totalRecordsCount, isKm]);

  const selectedTypeMeta = useMemo(
    () => contributionTypes.find((c) => c.key === selectedTypeKey) || contributionTypes[0],
    [contributionTypes, selectedTypeKey]
  );

  // Build filtered donor list (scoped to contribution type when in by_type mode, and filtered globally by searchTerm)
  const displayedDonors = useMemo<DonorGroup[]>(() => {
    const q = searchTerm.trim().toLowerCase();

    const scoped = allDonors
      .map((donor) => {
        // Filter records by selected contribution type when on 'by_type' tab
        let matchedRecords = donor.records;
        if (activeView === 'by_type' && selectedTypeKey !== 'all') {
          if (selectedTypeKey === 'seil_all') {
            matchedRecords = donor.records.filter((r) => r.source_type === 'seil');
          } else if (selectedTypeKey.startsWith('cat:')) {
            const target = selectedTypeKey.slice(4);
            matchedRecords = donor.records.filter(
              (r) => r.source_type === 'category' && (r.source_id === target || r.source_name === target)
            );
          }
        }

        if (matchedRecords.length === 0) return null;

        // Global search matches donor name, locations, record names, notes, OR source_name
        if (q) {
          const donorMatch =
            donor.name.toLowerCase().includes(q) ||
            donor.locations.some((loc) => loc.toLowerCase().includes(q));
          const recordMatch = matchedRecords.some(
            (r) =>
              (r.name || '').toLowerCase().includes(q) ||
              (r.note || '').toLowerCase().includes(q) ||
              (r.source_name || '').toLowerCase().includes(q)
          );
          if (!donorMatch && !recordMatch) return null;
        }

        const scopedTotal = matchedRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const scopedLocations = Array.from(
          new Set(matchedRecords.map((r) => r.note).filter(Boolean))
        );

        return {
          name: donor.name,
          total_amount: scopedTotal,
          contributions_count: matchedRecords.length,
          locations: scopedLocations.length > 0 ? scopedLocations : donor.locations,
          records: matchedRecords,
        } as DonorGroup;
      })
      .filter((d): d is DonorGroup => d !== null);

    // Sort
    const effectiveSort = activeView === 'top_benefactors' ? sortBy : sortBy;
    scoped.sort((a, b) => {
      if (effectiveSort === 'count') {
        if (b.contributions_count !== a.contributions_count) {
          return b.contributions_count - a.contributions_count;
        }
        return b.total_amount - a.total_amount;
      }
      if (b.total_amount !== a.total_amount) {
        return b.total_amount - a.total_amount;
      }
      return b.contributions_count - a.contributions_count;
    });

    return scoped;
  }, [allDonors, activeView, selectedTypeKey, searchTerm, sortBy]);

  const filteredHighTier = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return highTierDonors;
    return highTierDonors.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.category_name || '').toLowerCase().includes(q)
    );
  }, [highTierDonors, searchTerm]);

  const displayedRecordsTotal = useMemo(
    () => displayedDonors.reduce((sum, d) => sum + d.contributions_count, 0),
    [displayedDonors]
  );

  const toggleDonorExpand = (name: string) => {
    setExpandedDonors((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCopyDonor = (donor: DonorGroup) => {
    const lines = [
      `វត្តស្នាយដួច - ព័ត៌មានសប្បុរសជន`,
      `ឈ្មោះ៖ ${donor.name}`,
      donor.locations.length > 0 ? `ទីកន្លែង៖ ${donor.locations.join(', ')}` : '',
      `បច្ច័យសរុប៖ ${donor.total_amount.toLocaleString()} ៛ (${donor.contributions_count} លើក)`,
      `--- កំណត់ត្រាលម្អិត ---`,
      ...donor.records.map((r) => {
        const d = r.date ? r.date.split('T')[0] : '';
        return `• ${d} | ${r.source_name}៖ ${r.amount.toLocaleString()} ៛ ${r.note ? `(${r.note})` : ''}`;
      }),
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    setCopiedKey(donor.name);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Admin Edit / Delete handlers
  const handleOpenEdit = (rec: {
    id: string;
    name?: string;
    amount: number;
    date?: string;
    note?: string;
    source_name: string;
    source_type: 'category' | 'seil';
  }, donorName: string) => {
    const effectiveName = rec.name || donorName;
    setEditingRecord({
      id: rec.id,
      donor_name: donorName,
      recorded_name: effectiveName,
      amount: rec.amount,
      date: rec.date ? rec.date.split('T')[0] : '',
      note: rec.note || '',
      source_name: rec.source_name,
      source_type: rec.source_type,
    });
    setEditName(effectiveName);
    setEditAmount(rec.amount.toString());
    setEditDate(rec.date ? rec.date.split('T')[0] : '');
    setEditNote(rec.note || '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    if (!editName.trim()) {
      setEditError(isKm ? 'សូមបញ្ចូលឈ្មោះសប្បុរសជន' : 'Please enter donor name');
      return;
    }
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError(isKm ? 'សូមបញ្ចូលចំនួនបច្ច័យត្រឹមត្រូវ' : 'Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    setEditError('');

    try {
      if (editingRecord.source_type === 'category') {
        const payload: any = {
          name: editName.trim(),
          amount: amt,
          note: editNote.trim() || null,
        };
        if (editDate) {
          payload.created_at = new Date(editDate).toISOString();
        }
        await api.updateNameListRecord(editingRecord.id, payload);
      } else {
        const payload: any = {
          description: editName.trim(),
          amount: amt,
          note: editNote.trim() || null,
        };
        if (editDate) {
          payload.record_date = editDate;
        }
        await api.updateFinancialRecord(editingRecord.id, payload);
      }

      setEditingRecord(null);
      playSuccessSound();
      setToastMessage(isKm ? 'បានកែប្រែកំណត់ត្រាដោយជោគជ័យ' : 'Record updated successfully');
      setTimeout(() => setToastMessage(''), 3500);
      await fetchAllData();
      window.dispatchEvent(new Event('wsd-data-refreshed'));
    } catch (err: any) {
      playFailSound();
      setEditError(err.message || (isKm ? 'មិនអាចកែប្រែបានទេ' : 'Failed to update record.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (rec: {
    id: string;
    name?: string;
    amount: number;
    source_name: string;
    source_type: 'category' | 'seil';
  }, donorName: string) => {
    setDeletingRecord({
      id: rec.id,
      name: rec.name || donorName,
      amount: rec.amount,
      source_name: rec.source_name,
      source_type: rec.source_type,
    });
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      if (deletingRecord.source_type === 'category') {
        await api.deleteNameListRecord(deletingRecord.id);
      } else {
        await api.deleteFinancialRecord(deletingRecord.id);
      }
      setDeletingRecord(null);
      playSuccessSound();
      setToastMessage(isKm ? 'បានលុបកំណត់ត្រាដោយជោគជ័យ' : 'Record deleted successfully');
      setTimeout(() => setToastMessage(''), 3500);
      await fetchAllData();
      window.dispatchEvent(new Event('wsd-data-refreshed'));
    } catch (err: any) {
      playFailSound();
      setDeleteError(err.message || (isKm ? 'មិនអាចលុបបានទេ' : 'Failed to delete record.'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && allDonors.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col pb-8 md:pb-4 font-battambang transition-colors duration-200">
      <div className="w-full pt-1 space-y-5 sm:space-y-6">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-2xl text-sm border border-rose-200 dark:border-rose-500/20">
            {error}
          </div>
        )}

        {/* Section 1: Sacred Deep Teal Hero Card (Matching Mockup 04 — ចូលរួមបុណ្យ) */}
        <section className="bg-[#163F48] dark:bg-[#0F2A31] rounded-[24px] p-6 sm:p-8 text-white border border-[#1E4F5A]/60 dark:border-teal-900/50 shadow-[0_6px_22px_rgba(18,50,58,0.12)]">
          <div className="space-y-2.5">
            <h2 className="font-title text-[26px] sm:text-4xl text-white leading-snug">
              {isKm ? 'រួមចំណែកក្នុងកិច្ចការបុណ្យ' : 'Monastery Benefactors & Donations'}
            </h2>
            <p className="text-sm sm:text-[15px] text-teal-50/85 leading-relaxed">
              {isKm
                ? 'សូមអនុមោទនាចំពោះសទ្ធាជ្រះថ្លារបស់សប្បុរសជនទាំងអស់ តាមប្រភេទនៃការចូលរួមបរិច្ចាគនីមួយៗ'
                : 'Honoring all benefactors across every ceremony, Seil offering, and construction project.'}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[#E2BD42] tracking-wide pt-0.5">
              {isKm ? 'សប្បុរសធម៌ • សាមគ្គី • ការអភិវឌ្ឍ' : 'Generosity • Solidarity • Development'}
            </p>
          </div>

          {/* Transparent 3-column summary row */}
          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-3 divide-x divide-white/15 text-center">
            <div className="px-2">
              <div className="font-rajdhani font-bold text-xl sm:text-2xl text-white tabular-nums leading-tight">
                {formatNum(allDonors.length)}
              </div>
              <div className="text-[11px] sm:text-xs text-teal-100/75 mt-0.5">
                {isKm ? 'សប្បុរសជន' : 'Donors'}
              </div>
            </div>
            <div className="px-2">
              <div className="font-rajdhani font-bold text-xl sm:text-2xl text-[#E2BD42] tabular-nums leading-tight">
                {formatNum(Math.max(0, contributionTypes.length - 1))}
              </div>
              <div className="text-[11px] sm:text-xs text-teal-100/75 mt-0.5">
                {isKm ? 'ប្រភេទបរិច្ចាគ' : 'Categories'}
              </div>
            </div>
            <div className="px-2">
              <div className="font-rajdhani font-bold text-xl sm:text-2xl text-white tabular-nums leading-tight">
                {formatNum(totalRecordsCount)}
              </div>
              <div className="text-[11px] sm:text-xs text-teal-100/75 mt-0.5">
                {isKm ? 'កំណត់ត្រាសរុប' : 'Records'}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Global Search Input (ស្វែងរកសប្បុរសជនទូទាំងប្រព័ន្ធ) */}
        <section aria-label={isKm ? 'ស្វែងរកសប្បុរសជនទូទាំងប្រព័ន្ធ' : 'Global Donor Search'} className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-title text-lg sm:text-xl text-[#12323A] dark:text-white">
              {isKm ? 'ស្វែងរកសប្បុរសជន (Global)' : 'Global Donor Search'}
            </h3>
            <span className="text-xs text-[#6B7477] dark:text-slate-400">
              {activeView === 'high_tier'
                ? isKm
                  ? `បង្ហាញ ${toKhmerNum(filteredHighTier.length)} នាក់`
                  : `${filteredHighTier.length} donors`
                : isKm
                  ? `រកឃើញ ${toKhmerNum(displayedDonors.length)} នាក់ · ${toKhmerNum(displayedRecordsTotal)} កំណត់ត្រា`
                  : `${displayedDonors.length} donors · ${displayedRecordsTotal} records`}
            </span>
          </div>

          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-[#6B7477] dark:text-slate-400 absolute left-4 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isKm
                  ? 'ស្វែងរកឈ្មោះសប្បុរសជន ទីកន្លែង ឬឈ្មោះកម្មវិធីបុណ្យ...'
                  : 'Search donor name, location, or project...'
              }
              className="w-full pl-11 pr-11 py-3.5 text-sm sm:text-base bg-white dark:bg-[#10252C] border border-[#EAE6DC] dark:border-teal-900/50 rounded-[20px] shadow-[0_2px_10px_rgba(18,50,58,0.03)] text-[#12323A] dark:text-white placeholder-[#8A9497] dark:placeholder-slate-500 focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] transition-colors font-battambang"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label={isKm ? 'សម្អាត' : 'Clear'}
                className="absolute right-3.5 p-1.5 text-[#7D878A] hover:text-[#12323A] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Section 3: Unified Donor Directory Card (By Type, Top Benefactors, High-Tier) */}
        <section className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_10px_rgba(18,50,58,0.03)] overflow-hidden">
          {/* Primary View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F0ECE2] dark:border-teal-900/40 px-4 pt-3 pb-2 sm:pb-0 gap-2">
            <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveView('by_type')}
                className={`flex items-center gap-1.5 py-2.5 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView === 'by_type'
                    ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42]'
                    : 'border-transparent text-[#6B7477] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>{isKm ? 'តាមប្រភេទបរិច្ចាគ' : 'By Type'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveView('top_benefactors');
                  setSortBy('count');
                }}
                className={`flex items-center gap-1.5 py-2.5 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView === 'top_benefactors'
                    ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42]'
                    : 'border-transparent text-[#6B7477] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4 shrink-0 text-[#C59A1B] dark:text-[#E2BD42]" />
                <span>{t('dashboard_top_benefactors')}</span>
                <span className="text-xs font-rajdhani font-semibold opacity-75">
                  ({isKm ? toKhmerNum(allDonors.length) : allDonors.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('high_tier')}
                className={`flex items-center gap-1.5 py-2.5 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView === 'high_tier'
                    ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42]'
                    : 'border-transparent text-[#6B7477] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-slate-200'
                }`}
              >
                <Heart className="w-4 h-4 shrink-0 text-[#C59A1B] dark:text-[#E2BD42]" />
                <span>{t('dashboard_high_donors')}</span>
                <span className="text-xs font-rajdhani font-semibold opacity-75">
                  ({isKm ? toKhmerNum(highTierDonors.length) : highTierDonors.length})
                </span>
              </button>
            </div>

            {/* Sort controls for By Type & Top Benefactors */}
            {activeView !== 'high_tier' && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto pb-1.5 sm:pb-0 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSortBy('amount')}
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    sortBy === 'amount'
                      ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42] font-semibold'
                      : 'border-transparent text-[#6B7477] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-white'
                  }`}
                >
                  {t('dashboard_sort_amount')}
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('count')}
                  className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    sortBy === 'count'
                      ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42] font-semibold'
                      : 'border-transparent text-[#6B7477] dark:text-slate-400 hover:text-[#12323A] dark:hover:text-white'
                  }`}
                >
                  {t('dashboard_sort_count')}
                </button>
              </div>
            )}
          </div>

          {/* Contribution Type Filter Strip (visible when activeView === 'by_type') */}
          {activeView === 'by_type' && contributionTypes.length > 1 && (
            <div className="px-4 py-3 border-b border-[#F0ECE2] dark:border-teal-900/40 space-y-2.5">
              {/* Quick dropdown for selecting any exact contribution category */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#12323A] dark:text-slate-200">
                  <Filter className="w-3.5 h-3.5 text-[#12323A] dark:text-[#E2BD42] shrink-0" />
                  <span>{isKm ? 'ជ្រើសរើសប្រភេទនៃការចូលរួមបរិច្ចាគ៖' : 'Filter by contribution type:'}</span>
                </div>
                <select
                  aria-label={isKm ? 'ប្រភេទនៃការចូលរួមបរិច្ចាគ' : 'Contribution type'}
                  value={selectedTypeKey}
                  onChange={(e) => setSelectedTypeKey(e.target.value)}
                  className="w-full sm:w-auto sm:min-w-[240px] max-w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl text-[#12323A] dark:text-white focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] cursor-pointer font-battambang"
                >
                  {contributionTypes.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({isKm ? toKhmerNum(opt.donorCount) : opt.donorCount} {isKm ? 'នាក់' : 'donors'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clean horizontal scroll of type tabs (hairline borders, NO tinted fill boxes) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {contributionTypes.map((opt) => {
                  const isSelected = selectedTypeKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedTypeKey(opt.key)}
                      className={`px-3 py-1.5 rounded-xl border text-xs sm:text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#12323A] text-[#12323A] dark:border-[#E2BD42] dark:text-[#E2BD42] font-semibold'
                          : 'border-[#EAE6DC] dark:border-teal-900/40 text-[#5C6669] dark:text-slate-400 hover:border-[#12323A]/40 hover:text-[#12323A] dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="ml-1.5 font-rajdhani font-semibold opacity-75 tabular-nums">
                        {isKm ? toKhmerNum(opt.donorCount) : opt.donorCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected category inline total summary */}
              {selectedTypeMeta && selectedTypeMeta.key !== 'all' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5C6669] dark:text-slate-300">
                  <span className="font-medium text-[#12323A] dark:text-white">
                    {selectedTypeMeta.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>
                      {isKm ? 'សប្បុរសជន៖ ' : 'Donors: '}
                      <strong className="font-rajdhani tabular-nums text-[#12323A] dark:text-white">
                        {formatNum(selectedTypeMeta.donorCount)}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {isKm ? 'បច្ច័យសរុប៖ ' : 'Total: '}
                      <strong className="font-rajdhani tabular-nums text-emerald-700 dark:text-emerald-400">
                        ៛ {formatNum(selectedTypeMeta.totalAmount)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIST VIEW 1 & 2: By Type & Top Benefactors */}
          {activeView !== 'high_tier' && (
            <div>
              {displayedDonors.length === 0 ? (
                <div className="py-14 px-4 text-center">
                  <User className="w-8 h-8 text-[#B8C0C2] dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm sm:text-base text-[#6B7477] dark:text-slate-400">
                    {searchTerm
                      ? isKm
                        ? `រកមិនឃើញសប្បុរសជនឈ្មោះ «${searchTerm}» ឡើយ`
                        : `No donors found matching "${searchTerm}".`
                      : t('common_no_data')}
                  </p>
                  {(searchTerm || selectedTypeKey !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedTypeKey('all');
                      }}
                      className="mt-3 text-xs sm:text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:underline cursor-pointer"
                    >
                      {isKm ? 'បង្ហាញសប្បុរសជនទាំងអស់' : 'Show all donors'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#F0ECE2] dark:divide-teal-900/40">
                  {displayedDonors.slice(0, displayLimit).map((donor, index) => {
                    const isExpanded = !!expandedDonors[donor.name];
                    const isCopied = copiedKey === donor.name;
                    const uniqueSources = Array.from(new Set(donor.records.map((r) => r.source_name)));
                    const rankColor =
                      index === 0
                        ? 'text-[#C59A1B] dark:text-[#E2BD42] font-bold text-[15px]'
                        : index === 1
                          ? 'text-[#A8841E] dark:text-[#E2BD42]/90 font-bold text-sm'
                          : index === 2
                            ? 'text-[#8C6E1D] dark:text-[#E2BD42]/75 font-semibold text-sm'
                            : 'text-[#8A9497] dark:text-slate-500 font-medium text-sm';

                    return (
                      <div key={donor.name}>
                        <div
                          onClick={() => toggleDonorExpand(donor.name)}
                          className="flex items-start sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-[#FAF8F3] dark:hover:bg-teal-950/30 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <span className={`w-6 shrink-0 text-center font-rajdhani tabular-nums pt-0.5 sm:pt-0 ${rankColor}`}>
                              {isKm ? toKhmerNum(index + 1) : index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[15px] sm:text-base text-[#12323A] dark:text-white leading-snug">
                                  {donor.name}
                                </span>
                                {donor.locations.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs text-[#6B7477] dark:text-slate-400">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[180px] sm:max-w-[260px]">
                                      {donor.locations.join(', ')}
                                    </span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7477] dark:text-slate-400 flex-wrap">
                                <span className="whitespace-nowrap">
                                  <span className="font-rajdhani font-semibold tabular-nums text-[#163F48] dark:text-[#E2BD42]">
                                    {isKm ? toKhmerNum(donor.contributions_count) : donor.contributions_count}
                                  </span>{' '}
                                  {isKm ? 'លើក' : '×'}
                                </span>
                                {uniqueSources.length > 0 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="truncate max-w-[220px] sm:max-w-[420px]">
                                      {uniqueSources.slice(0, 2).join(', ')}
                                      {uniqueSources.length > 2
                                        ? isKm
                                          ? ` +${toKhmerNum(uniqueSources.length - 2)}`
                                          : ` +${uniqueSources.length - 2}`
                                        : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                            <span className="text-[15px] sm:text-base font-bold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums whitespace-nowrap">
                              ៛ {formatNum(donor.total_amount)}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyDonor(donor);
                              }}
                              title={isKm ? 'ចម្លងព័ត៌មាន' : 'Copy summary'}
                              className="p-1.5 text-[#8A9497] hover:text-[#12323A] dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <span className="text-[#8A9497] dark:text-slate-500 p-0.5">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Itemized Contribution History */}
                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-[#F0ECE2] dark:border-teal-900/40 bg-[#FAF8F3]/60 dark:bg-[#0B171B]/35">
                            <div className="text-[11px] font-semibold text-[#6B7477] dark:text-slate-400 mb-2">
                              {isKm ? 'ប្រវត្តិចូលរួមបរិច្ចាគលម្អិត' : 'Contribution History'}
                            </div>
                            <div className="divide-y divide-dashed divide-[#EAE6DC] dark:divide-teal-900/40">
                              {donor.records.map((rec, rIdx) => (
                                <div
                                  key={rec.id || rIdx}
                                  className="flex items-center justify-between gap-3 py-2.5 text-xs sm:text-sm"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-[#12323A] dark:text-slate-100 truncate">
                                      {rec.source_name}
                                      {rec.name && rec.name !== donor.name && (
                                        <span className="ml-1.5 text-xs text-[#6B7477] dark:text-slate-400 font-normal">
                                          ({isKm ? 'ឈ្មោះកត់ត្រា៖ ' : 'As: '}
                                          <span className="font-medium text-[#12323A] dark:text-slate-200">{rec.name}</span>)
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#7D878A] dark:text-slate-400 mt-0.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 font-rajdhani tabular-nums">
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span>{formatRecordDate(rec.date) || '—'}</span>
                                      </span>
                                      {rec.note && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate max-w-[200px] sm:max-w-xs">{rec.note}</span>
                                        </>
                                      )}
                                      {rec.is_cross_listed && (
                                        <>
                                          <span>•</span>
                                          <span className="text-[#163F48] dark:text-[#E2BD42]">
                                            {rec.cross_listed_info ||
                                              (isKm
                                                ? 'កត់ទាំងក្នុងចំណូលចំណាយ & បញ្ជីកសាង (រាប់តែម្ដង)'
                                                : 'Cross-listed (counted once)')}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2.5 sm:gap-3">
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums">
                                      ៛ {formatNum(rec.amount)}
                                    </span>
                                    {userRole === 'admin' && (
                                      <div className="flex items-center gap-1.5 pl-2 border-l border-[#EAE6DC] dark:border-teal-900/50">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEdit(rec, donor.name);
                                          }}
                                          className="inline-flex items-center gap-1 text-xs text-[#163F48] dark:text-[#E2BD42] hover:opacity-75 p-1 cursor-pointer"
                                          title={isKm ? 'កែប្រែ' : 'Edit'}
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">{isKm ? 'កែ' : 'Edit'}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDelete(rec, donor.name);
                                          }}
                                          className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                          title={isKm ? 'លុប' : 'Delete'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">{isKm ? 'លុប' : 'Delete'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {displayedDonors.length > displayLimit && (
                <div className="p-3.5 text-center border-t border-[#F0ECE2] dark:border-teal-900/40">
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => prev + 30)}
                    className="text-xs sm:text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:underline cursor-pointer"
                  >
                    {isKm
                      ? `បង្ហាញបន្ថែម (${toKhmerNum(displayedDonors.length - displayLimit)})`
                      : `Show More (${displayedDonors.length - displayLimit})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LIST VIEW 3: High-Tier Donors (Public & Transparent — amounts always visible) */}
          {activeView === 'high_tier' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {filteredHighTier.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#7D878A] dark:text-slate-500 text-sm">
                    {t('common_no_data')}
                  </div>
                ) : (
                  filteredHighTier.slice(0, displayLimit).map((donor, index) => (
                    <div
                      key={donor.id || index}
                      className="flex items-center justify-between p-4 hover:bg-[#FAF8F3] dark:hover:bg-teal-950/30 transition-colors border-b border-[#F0ECE2] dark:border-teal-900/40 md:odd:border-r"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span
                          className={`w-6 shrink-0 text-center text-sm font-semibold font-rajdhani tabular-nums ${
                            index < 3
                              ? 'text-[#C59A1B] dark:text-[#E2BD42]'
                              : 'text-[#8A9497] dark:text-slate-500'
                          }`}
                        >
                          {isKm ? toKhmerNum(index + 1) : index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-[15px] text-[#12323A] dark:text-white block leading-snug">
                            {donor.name}
                          </span>
                          <span className="text-xs sm:text-sm text-[#6B7477] dark:text-slate-400 block mt-0.5 truncate">
                            {donor.category_name}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2.5 sm:gap-3">
                        <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums whitespace-nowrap">
                          ៛ {formatNum(donor.amount)}
                        </span>
                        {userRole === 'admin' && (
                          <div className="flex items-center gap-1.5 pl-2 border-l border-[#EAE6DC] dark:border-teal-900/50">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEdit(
                                  {
                                    id: donor.id,
                                    name: donor.name,
                                    amount: donor.amount,
                                    source_name: donor.category_name,
                                    source_type: donor.source_type || 'category',
                                  },
                                  donor.name
                                )
                              }
                              className="p-1 text-[#163F48] dark:text-[#E2BD42] hover:opacity-75 cursor-pointer"
                              title={isKm ? 'កែប្រែ' : 'Edit'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDelete(
                                  {
                                    id: donor.id,
                                    name: donor.name,
                                    amount: donor.amount,
                                    source_name: donor.category_name,
                                    source_type: donor.source_type || 'category',
                                  },
                                  donor.name
                                )
                              }
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                              title={isKm ? 'លុប' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredHighTier.length > displayLimit && (
                <div className="p-3.5 text-center border-t border-[#F0ECE2] dark:border-teal-900/40">
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => prev + 30)}
                    className="text-xs sm:text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:underline cursor-pointer"
                  >
                    {isKm
                      ? `បង្ហាញបន្ថែម (${toKhmerNum(filteredHighTier.length - displayLimit)})`
                      : `Show More (${filteredHighTier.length - displayLimit})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Admin Edit Record Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
            <div
              className="bg-white dark:bg-[#10252C] border border-[#EAE6DC] dark:border-teal-900/50 rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[#F0ECE2] dark:border-teal-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42]" />
                  <h3 className="text-base sm:text-lg font-semibold text-[#12323A] dark:text-white">
                    {isKm ? 'កែប្រែកំណត់ត្រាបច្ច័យ' : 'Edit Contribution Record'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-xs text-[#5C6669] dark:text-slate-300 flex items-center justify-between pb-2 border-b border-[#F0ECE2] dark:border-teal-900/40">
                  <span>
                    {isKm ? 'ប្រភពបញ្ជី៖ ' : 'Source List: '}
                    <strong className="text-[#12323A] dark:text-white font-medium">{editingRecord.source_name}</strong>
                  </span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        const dest = editingRecord.source_type === 'category' ? 'categories' : 'records';
                        setEditingRecord(null);
                        onNavigateTab(dest);
                      }}
                      className="inline-flex items-center gap-1 text-[#163F48] dark:text-[#E2BD42] hover:underline cursor-pointer"
                    >
                      <span>{isKm ? 'បើកបញ្ជីដើម' : 'Open List'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {editError && (
                  <div className="p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'ឈ្មោះសប្បុរសជន / អ្នកចូលរួម' : 'Donor Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] text-[#12323A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'ចំនួនបច្ច័យ (ប្រាក់រៀល ៛)' : 'Amount (KHR ៛)'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] font-rajdhani font-semibold text-[#12323A] dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D878A]">
                      ៛
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'កាលបរិច្ឆេទ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] font-rajdhani text-[#12323A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#12323A] dark:text-slate-300 mb-1">
                    {isKm ? 'កំណត់ចំណាំ / ទីលំនៅ' : 'Note / Location'}
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0B171B] border border-[#EAE6DC] dark:border-teal-900/50 rounded-xl focus:outline-none focus:border-[#12323A] dark:focus:border-[#E2BD42] text-[#12323A] dark:text-white"
                  />
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-[#F0ECE2] dark:border-teal-900/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#6B7477] dark:text-slate-300 hover:text-[#12323A] dark:hover:text-white cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#12323A] hover:bg-[#163F48] transition-colors rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isKm ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Delete Record Modal */}
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
            <div
              className="bg-white dark:bg-[#10252C] border border-[#EAE6DC] dark:border-teal-900/50 rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-3">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>

              <h3 className="text-lg font-bold text-[#12323A] dark:text-white mb-2">
                {isKm ? 'បញ្ជាក់ការលុបកំណត់ត្រា' : 'Confirm Delete Record'}
              </h3>

              <p className="text-xs sm:text-sm text-[#5C6669] dark:text-slate-300 mb-3 leading-relaxed">
                {isKm ? (
                  <>
                    តើលោកអ្នកពិតជាចង់លុបកំណត់ត្រារបស់{' '}
                    <strong className="text-[#12323A] dark:text-white">{deletingRecord.name}</strong> ចំនួន{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-rajdhani font-bold">
                      {deletingRecord.amount.toLocaleString()} ៛
                    </strong>{' '}
                    ពី «<span className="font-semibold">{deletingRecord.source_name}</span>» មែនទេ?
                  </>
                ) : (
                  <>
                    Delete record for <strong className="text-[#12323A] dark:text-white">{deletingRecord.name}</strong> (
                    <strong className="text-emerald-700 dark:text-emerald-400 font-rajdhani font-bold">
                      {deletingRecord.amount.toLocaleString()} KHR
                    </strong>
                    ) from "{deletingRecord.source_name}"?
                  </>
                )}
              </p>

              <p className="text-xs text-rose-500 mb-5">
                {isKm
                  ? 'សកម្មភាពនេះនឹងលុបចេញពីមូលដ្ឋានទិន្នន័យជាអចិន្ត្រៃយ៍។'
                  : 'This action is permanent and cannot be undone.'}
              </p>

              {deleteError && (
                <div className="mb-4 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-[#6B7477] dark:text-slate-300 hover:text-[#12323A] dark:hover:text-white cursor-pointer"
                >
                  {isKm ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isKm ? 'លុបកំណត់ត្រា' : 'Delete Record'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#12323A] text-white rounded-2xl shadow-lg text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#E2BD42] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

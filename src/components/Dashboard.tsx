import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { playSuccessSound, playFailSound } from '../lib/sound';

import { 
  Award, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowRight, 
  BellRing,
  ChevronDown,
  ChevronUp,
  X,
  HeartHandshake,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lock,
  Loader2
} from 'lucide-react';
import ImageSlider from './ImageSlider';
import { ListSummaryCard } from './ListSummaryCard';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import GlobalDonorSearch from './GlobalDonorSearch';
import { calculateKhmerLunar, getNextSeilDate, toKhmerNumber } from '../lib/khmerCalendar';
import { MonasteryEvent } from '../types/calendar';

interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  seil_id: string;
}

interface SeilPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
}

interface HundredKDonor {
  id: string;
  name: string;
  amount: number;
  category_name: string;
}

interface BenefactorRecord {
  id: string;
  recorded_name?: string;
  amount: number;
  source_name: string;
  source_id?: string;
  source_type: 'category' | 'seil';
  date: string;
  note: string;
  is_cross_listed?: boolean;
  cross_listed_info?: string;
}

interface TopBenefactor {
  name: string;
  total_amount: number;
  contributions_count: number;
  locations: string[];
  records: BenefactorRecord[];
}

interface ListCategory {
  id: string;
  name: string;
  description?: string;
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
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Dashboard({ 
  onNavigateTab,
  userRole 
}: { 
  onNavigateTab?: (tab: 'records' | 'categories' | 'calendar' | 'account') => void;
  userRole?: 'admin' | 'user' | null;
}) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [hundredKDonors, setHundredKDonors] = useState<HundredKDonor[]>([]);
  const [topBenefactors, setTopBenefactors] = useState<TopBenefactor[]>([]);
  const [donorTab, setDonorTab] = useState<'benefactors' | 'high_tier'>('benefactors');
  const [benefactorSearch, setBenefactorSearch] = useState('');
  const [benefactorSort, setBenefactorSort] = useState<'amount' | 'count'>('count');
  const [expandedBenefactor, setExpandedBenefactor] = useState<string | null>(null);
  const [benefactorsDisplayLimit, setBenefactorsDisplayLimit] = useState(25);
  const [highTierSearch, setHighTierSearch] = useState('');
  const [highTierDisplayLimit, setHighTierDisplayLimit] = useState(25);
  const [roofFundTotal, setRoofFundTotal] = useState<number>(0);
  const [showDonorSearch, setShowDonorSearch] = useState(false);
  const [monasteryEvents, setMonasteryEvents] = useState<MonasteryEvent[]>([]);

  // State for Record Editing
  const [editingRecord, setEditingRecord] = useState<{
    id: string;
    donor_name: string;
    recorded_name: string;
    amount: number;
    date: string;
    note: string;
    source_name: string;
    source_type: 'category' | 'seil';
    source_id?: string;
  } | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // State for Record Deleting
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    name: string;
    amount: number;
    source_name: string;
    source_type: 'category' | 'seil';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State for Permission and Feedback
  const [showAdminRequired, setShowAdminRequired] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, finData, hundredKData, categoriesData, eventsData, benefactorsData] = await Promise.all([
        api.getSeilPeriods().catch(() => []),
        api.getFinancialRecords('').catch(() => []),
        api.get100kDonors().catch(() => []),
        api.getNameListCategories().catch(() => []),
        api.getEvents().catch(() => []),
        api.getTopBenefactors().catch(() => ({ total_donors: 0, donors: [] }))
      ]);
      setSeils(seilData || []);
      setFinancials(finData || []);
      setHundredKDonors(hundredKData || []);
      setCategories(categoriesData || []);
      setMonasteryEvents(Array.isArray(eventsData) ? eventsData : []);
      setTopBenefactors(benefactorsData?.donors || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (rec: {
    id: string;
    recorded_name?: string;
    amount: number;
    date?: string;
    note?: string;
    source_name: string;
    source_type: 'category' | 'seil';
    source_id?: string;
  }, donorName?: string) => {
    const token = localStorage.getItem('access_token');
    const isAdmin = userRole === 'admin' || !!token;
    if (!isAdmin) {
      setShowAdminRequired(true);
      return;
    }

    const effectiveName = rec.recorded_name || donorName || '';
    setEditingRecord({
      id: rec.id,
      donor_name: donorName || effectiveName,
      recorded_name: effectiveName,
      amount: rec.amount,
      date: rec.date ? rec.date.split('T')[0] : '',
      note: rec.note || '',
      source_name: rec.source_name,
      source_type: rec.source_type,
      source_id: rec.source_id
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
      setEditError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះសប្បុរសជន' : 'Please enter donor name');
      return;
    }
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      setEditError(language === 'km' ? 'សូមបញ្ចូលចំនួនបច្ច័យត្រឹមត្រូវ' : 'Please enter a valid amount');
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
      setToastMessage(language === 'km' ? 'បានកែប្រែកំណត់ត្រាដោយជោគជ័យ' : 'Record updated successfully');
      setTimeout(() => setToastMessage(''), 3500);
      await fetchData();
    } catch (err: any) {
      console.error('Error updating record:', err);
      playFailSound();
      setEditError(err.message || (language === 'km' ? 'មិនអាចកែប្រែបានទេ សូមពិនិត្យសិទ្ធិ ឬការតភ្ជាប់' : 'Failed to update record.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (rec: {
    id: string;
    recorded_name?: string;
    amount: number;
    source_name: string;
    source_type: 'category' | 'seil';
  }, donorName?: string) => {
    const token = localStorage.getItem('access_token');
    const isAdmin = userRole === 'admin' || !!token;
    if (!isAdmin) {
      setShowAdminRequired(true);
      return;
    }

    setDeletingRecord({
      id: rec.id,
      name: rec.recorded_name || donorName || 'សប្បុរសជន',
      amount: rec.amount,
      source_name: rec.source_name,
      source_type: rec.source_type
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
      setToastMessage(language === 'km' ? 'បានលុបកំណត់ត្រាដោយជោគជ័យ' : 'Record deleted successfully');
      setTimeout(() => setToastMessage(''), 3500);
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      playFailSound();
      setDeleteError(err.message || (language === 'km' ? 'មិនអាចលុបបានទេ សូមពិនិត្យសិទ្ធិ ឬការតភ្ជាប់' : 'Failed to delete record.'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  let totalIncome = 0;
  let totalExpense = 0;

  financials.forEach(record => {
    if (record.type === 'income') totalIncome += record.amount;
    if (record.type === 'expense') totalExpense += record.amount;
  });

  let latestIncome = 0;
  let latestExpense = 0;
  let previousBalance = 0;
  let balance = 0;
  let latestSeilName = "វេននេះ";
  let startingBalance = 0;

  if (seils.length > 0) {
    const latestSeil = seils[0];
    latestSeilName = latestSeil.name;
    const latestSeilFin = financials.filter(f => f.seil_id === latestSeil.id);
    latestSeilFin.forEach(f => {
      if (f.type === 'income') latestIncome += f.amount;
      if (f.type === 'expense') latestExpense += f.amount;
    });
    previousBalance = latestSeil.previous_balance || 0;
    balance = previousBalance + latestIncome - latestExpense;
    
    startingBalance = seils[seils.length - 1].previous_balance || 0;
  } else {
    balance = totalIncome - totalExpense;
  }

  const seilCount = seils.length > 0 ? seils.length : 0;

  const todayLunar = calculateKhmerLunar(new Date());
  const nextSeil = getNextSeilDate(new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingEventsList = monasteryEvents.filter(ev => {
    if (ev.is_completed) return false;
    const parts = ev.event_date?.split('-');
    if (!parts || parts.length !== 3) return false;
    const evTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
    return evTime >= todayStart.getTime();
  }).sort((a, b) => a.event_date.localeCompare(b.event_date));

  const nextEvent = upcomingEventsList[0];
  let nextEventDaysDiff: number | null = null;
  if (nextEvent) {
    const p = nextEvent.event_date.split('-');
    const evTime = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
    nextEventDaysDiff = Math.ceil((evTime - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  const filteredBenefactors = topBenefactors.filter(b => {
    if (!benefactorSearch.trim()) return true;
    const q = benefactorSearch.trim().toLowerCase();
    if (b.name.toLowerCase().includes(q)) return true;
    if (b.locations.some(loc => loc.toLowerCase().includes(q))) return true;
    if (b.records.some(r => r.source_name.toLowerCase().includes(q) || (r.note && r.note.toLowerCase().includes(q)))) return true;
    return false;
  }).sort((a, b) => {
    if (benefactorSort === 'count') {
      if (b.contributions_count !== a.contributions_count) {
        return b.contributions_count - a.contributions_count;
      }
      return b.total_amount - a.total_amount;
    }
    return b.total_amount - a.total_amount;
  });

  const filteredHighTier = hundredKDonors.filter(d => {
    if (!highTierSearch.trim()) return true;
    const q = highTierSearch.trim().toLowerCase();
    return d.name.toLowerCase().includes(q) || d.category_name.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full pb-20 overflow-y-auto font-battambang transition-colors duration-200">
      
      <div className="max-w-6xl mx-auto w-full px-0 sm:px-4 pt-1 sm:pt-2 pb-6 space-y-3 sm:space-y-6">

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-sm border border-rose-200 dark:border-rose-500/20 shadow-2xs">
          {error}
        </div>
      )}

      <div className="w-full">
        <ImageSlider />
      </div>

      {/* Buddhist Calendar & Upcoming Events Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200/70 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
              <h3 className="text-base sm:text-[17px] font-medium text-gray-900 dark:text-white font-battambang">
                {language === 'en' ? 'Buddhist Calendar & Event Schedule' : 'ប្រតិទិនពុទ្ធសាសនា & កាលវិភាគបុណ្យ'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 font-battambang">
              ថ្ងៃ{todayLunar.dayOfWeekKhmer} {todayLunar.lunarDayStr} ខែ{todayLunar.lunarMonthStr} ឆ្នាំ{todayLunar.lunarYearStr} • ព.ស. <span className="font-rajdhani font-medium">{todayLunar.buddhistEra}</span>
              {todayLunar.isSeil && (
                <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">({todayLunar.seilTitle})</span>
              )}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 pt-0.5 flex-wrap font-battambang">
              <span className="text-amber-600 dark:text-amber-400 font-normal">
                • ថ្ងៃសីលបន្ទាប់៖ {nextSeil.lunar.seilTitle} ({nextSeil.daysRemaining === 0 ? 'ថ្ងៃនេះ' : nextSeil.daysRemaining === 1 ? 'ថ្ងៃស្អែក' : `នៅសល់ ${toKhmerNumber(nextSeil.daysRemaining)} ថ្ងៃ`})
              </span>
              {nextEvent && (
                <span className="text-teal-600 dark:text-teal-400 font-normal flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  កម្មវិធីបន្ទាប់៖ {nextEvent.title} ({nextEventDaysDiff === 0 ? 'ថ្ងៃនេះ' : nextEventDaysDiff === 1 ? 'ថ្ងៃស្អែក' : `នៅសល់ ${toKhmerNumber(nextEventDaysDiff || 0)} ថ្ងៃ`})
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('calendar')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-[#028090] dark:text-teal-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 font-battambang self-start md:self-auto"
          >
            <span>{language === 'en' ? 'View Schedule' : 'មើលកាលវិភាគ & ប្រតិទិន'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full">
        <ListSummaryCard 
          seils={seils} 
          categories={categories} 
          language={language}
          onNavigateTab={onNavigateTab}
        />
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Tab Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-slate-800 px-3 sm:px-4 pt-2.5 pb-2 sm:pb-0 gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setDonorTab('benefactors')}
              className={`flex items-center gap-2 py-2.5 px-2.5 sm:px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer font-battambang shrink-0 ${
                donorTab === 'benefactors'
                  ? 'border-[#028090] text-[#028090] dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4 shrink-0 text-[#028090] dark:text-teal-400" />
              <span>{t('dashboard_top_benefactors')}</span>
              <span className="text-xs font-rajdhani font-medium opacity-80">
                ({language === 'km' ? toKhmerNum(topBenefactors.length) : topBenefactors.length})
              </span>
            </button>

            <button
              onClick={() => setDonorTab('high_tier')}
              className={`flex items-center gap-2 py-2.5 px-2.5 sm:px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer font-battambang shrink-0 ${
                donorTab === 'high_tier'
                  ? 'border-[#028090] text-[#028090] dark:text-teal-400 dark:border-teal-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4 shrink-0 text-[#028090] dark:text-teal-400" />
              <span>{t('dashboard_high_donors')}</span>
              <span className="text-xs font-rajdhani font-medium opacity-80">
                ({language === 'km' ? toKhmerNum(hundredKDonors.length) : hundredKDonors.length})
              </span>
            </button>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 self-end sm:self-auto pb-1.5 sm:pb-0">
            <button
              onClick={() => setShowDonorSearch(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#028090] dark:text-teal-400 border border-[#028090]/30 dark:border-teal-900/50 hover:border-[#028090] hover:bg-teal-50/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer font-battambang"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Search All' : 'ស្វែងរកទាំងអស់'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Top Benefactors (សប្បុរសជនឆ្នើម) */}
        {donorTab === 'benefactors' && (
          <div>
            {/* Search & Sort bar */}
            <div className="p-3 sm:px-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={benefactorSearch}
                  onChange={(e) => setBenefactorSearch(e.target.value)}
                  placeholder={t('dashboard_search_donors_ph')}
                  className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#028090] font-battambang text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                {benefactorSearch && (
                  <button
                    onClick={() => setBenefactorSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-battambang">
                <button
                  onClick={() => setBenefactorSort('count')}
                  className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    benefactorSort === 'count'
                      ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-semibold'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('dashboard_sort_count')}
                </button>
                <button
                  onClick={() => setBenefactorSort('amount')}
                  className={`px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    benefactorSort === 'amount'
                      ? 'border-[#028090] text-[#028090] dark:text-teal-400 font-semibold'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('dashboard_sort_amount')}
                </button>
              </div>
            </div>

            {/* Benefactors list */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredBenefactors.length === 0 ? (
                <div className="py-10 text-center text-gray-400 dark:text-slate-500 text-sm font-battambang">
                  {t('common_no_data')}
                </div>
              ) : (
                filteredBenefactors.slice(0, benefactorsDisplayLimit).map((donor, index) => {
                  const isExpanded = expandedBenefactor === donor.name;
                  return (
                    <div key={donor.name} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                      <div
                        onClick={() => setExpandedBenefactor(isExpanded ? null : donor.name)}
                        className="flex items-center justify-between p-3.5 sm:p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="w-6 shrink-0 text-center text-sm font-semibold font-rajdhani text-gray-400 dark:text-slate-500">
                            {language === 'km' ? toKhmerNum(index + 1) : index + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-normal text-base text-gray-900 dark:text-white block leading-normal font-battambang">
                              {donor.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400 font-battambang">
                              <span>
                                ចូលរួម <span className="font-rajdhani font-semibold text-[#028090] dark:text-teal-400">{language === 'km' ? toKhmerNum(donor.contributions_count) : donor.contributions_count}</span> លើក
                              </span>
                              {donor.locations.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[140px] sm:max-w-xs">{donor.locations.join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                          <div>
                            <span className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-battambang">
                              {language === 'km' ? `៛ ${toKhmerNum(donor.total_amount.toLocaleString())}` : `៛ ${donor.total_amount.toLocaleString()}`}
                            </span>
                            <span className="block text-[11px] text-gray-400 dark:text-slate-500 font-battambang">
                              {t('dashboard_contributions_detail')}
                            </span>
                          </div>
                          <div className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Detail Accordion */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                          <div className="space-y-2 pt-2">
                            {donor.records.map((rec, rIdx) => (
                              <div
                                key={rec.id || rIdx}
                                className="flex items-center justify-between py-2 border-b border-dashed border-gray-100 dark:border-slate-800 last:border-0 text-xs sm:text-sm font-battambang"
                              >
                                <div className="min-w-0 pr-3">
                                  <p className="text-gray-800 dark:text-slate-200 font-medium truncate">
                                    {rec.source_name}
                                    {rec.recorded_name && rec.recorded_name !== donor.name && (
                                      <span className="ml-1.5 text-xs text-gray-500 dark:text-slate-400 font-normal">
                                        ({language === 'km' ? 'ឈ្មោះកត់ត្រា៖ ' : 'As: '}
                                        <span className="font-medium text-gray-700 dark:text-slate-300">{rec.recorded_name}</span>)
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-400 mt-0.5 flex-wrap">
                                    <span className="font-rajdhani">{formatRecordDate(rec.date)}</span>
                                    {rec.note && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{rec.note}</span>
                                      </>
                                    )}
                                    {rec.is_cross_listed && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[#028090] dark:text-teal-400 font-battambang">
                                          {rec.cross_listed_info || (language === 'km' ? 'កត់ទាំងក្នុងចំណូលចំណាយ & បញ្ជីកសាង (រាប់តែម្ដង)' : 'Cross-listed in both lists (counted once)')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-battambang">
                                    {language === 'km' ? `៛ ${toKhmerNum(rec.amount.toLocaleString())}` : `៛ ${rec.amount.toLocaleString()}`}
                                  </span>
                                  <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-slate-700">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEdit(rec, donor.name);
                                      }}
                                      className="inline-flex items-center gap-1 text-xs text-[#028090] dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors p-1 cursor-pointer font-battambang"
                                      title={language === 'km' ? 'កែប្រែកំណត់ត្រានេះ' : 'Edit this record'}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDelete(rec, donor.name);
                                      }}
                                      className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer font-battambang"
                                      title={language === 'km' ? 'លុបកំណត់ត្រានេះ' : 'Delete this record'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>{language === 'km' ? 'លុប' : 'Delete'}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination / Show More */}
            {filteredBenefactors.length > benefactorsDisplayLimit && (
              <div className="p-3 text-center border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setBenefactorsDisplayLimit(prev => prev + 25)}
                  className="text-xs sm:text-sm font-medium text-[#028090] dark:text-teal-400 hover:underline cursor-pointer font-battambang"
                >
                  {language === 'km'
                    ? `បង្ហាញបន្ថែមទៀត (នៅសល់ ${toKhmerNum(filteredBenefactors.length - benefactorsDisplayLimit)} នាក់)`
                    : `Show More (${filteredBenefactors.length - benefactorsDisplayLimit} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: High Tier Donors (សប្បុរសជនថវិកាកម្រិតខ្ពស់) */}
        {donorTab === 'high_tier' && (
          <div>
            {/* Search bar */}
            <div className="p-3 sm:px-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={highTierSearch}
                  onChange={(e) => setHighTierSearch(e.target.value)}
                  placeholder={t('dashboard_search_donors_ph')}
                  className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#028090] font-battambang text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                {highTierSearch && (
                  <button
                    onClick={() => setHighTierSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0">
              {filteredHighTier.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-400 dark:text-slate-500 text-sm sm:text-base font-battambang">
                  {t('common_no_data')}
                </div>
              ) : (
                filteredHighTier.slice(0, highTierDisplayLimit).map((donor, index) => (
                  <div 
                    key={donor.id || index} 
                    className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-gray-100 dark:border-slate-800 md:border-r md:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="w-6 shrink-0 text-center text-sm font-semibold font-rajdhani text-gray-400 dark:text-slate-500">
                        {language === 'km' ? toKhmerNum(index + 1) : index + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-normal text-base text-gray-900 dark:text-white block leading-normal font-battambang">{donor.name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 block mt-0.5 font-battambang">
                          {donor.category_name}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2.5 sm:gap-3">
                      <span className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-battambang">
                        {language === 'km' ? `៛ ${toKhmerNum(donor.amount.toLocaleString())}` : `៛ ${donor.amount.toLocaleString()}`}
                      </span>
                      <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit({
                              id: donor.id,
                              recorded_name: donor.name,
                              amount: donor.amount,
                              source_name: donor.category_name,
                              source_type: 'category',
                              date: '',
                              note: ''
                            }, donor.name);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[#028090] dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors p-1 cursor-pointer font-battambang"
                          title={language === 'km' ? 'កែប្រែ' : 'Edit'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete({
                              id: donor.id,
                              recorded_name: donor.name,
                              amount: donor.amount,
                              source_name: donor.category_name,
                              source_type: 'category'
                            }, donor.name);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer font-battambang"
                          title={language === 'km' ? 'លុប' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'លុប' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredHighTier.length > highTierDisplayLimit && (
              <div className="p-3 text-center border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setHighTierDisplayLimit(prev => prev + 25)}
                  className="text-xs sm:text-sm font-medium text-[#028090] dark:text-teal-400 hover:underline cursor-pointer font-battambang"
                >
                  {language === 'km'
                    ? `បង្ហាញបន្ថែមទៀត (នៅសល់ ${toKhmerNum(filteredHighTier.length - highTierDisplayLimit)} នាក់)`
                    : `Show More (${filteredHighTier.length - highTierDisplayLimit} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <GlobalDonorSearch
        isOpen={showDonorSearch}
        onClose={() => {
          setShowDonorSearch(false);
          fetchData();
        }}
      />

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#028090] dark:text-teal-400" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white font-battambang">
                  {language === 'km' ? 'កែប្រែកំណត់ត្រាបច្ច័យ' : 'Edit Contribution Record'}
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

            {/* Modal Form */}
            <div className="p-5 space-y-4">
              {/* Source List Info */}
              <div className="text-xs text-gray-600 dark:text-slate-300 font-battambang flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                <span>
                  {language === 'km' ? 'ប្រភពបញ្ជី៖ ' : 'Source List: '}
                  <strong className="text-gray-900 dark:text-white font-medium">{editingRecord.source_name}</strong>
                </span>
                {editingRecord.source_type === 'category' && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(null);
                      onNavigateTab('categories');
                    }}
                    className="inline-flex items-center gap-1 text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <span>{language === 'km' ? 'បើកបញ្ជីកសាង' : 'Open List'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {editingRecord.source_type === 'seil' && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(null);
                      onNavigateTab('records');
                    }}
                    className="inline-flex items-center gap-1 text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <span>{language === 'km' ? 'បើកចំណូលចំណាយ' : 'Open Records'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Error Alert */}
              {editError && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-battambang flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Field 1: Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 font-battambang mb-1">
                  {language === 'km' ? 'ឈ្មោះសប្បុរសជន / អ្នកចូលរួម' : 'Donor / Contributor Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#028090] font-battambang text-gray-900 dark:text-white"
                  placeholder={language === 'km' ? 'ឧទាហរណ៍៖ លោក ម៉ៅ ប៊ុនរិទ្ធ...' : 'e.g. Mao Bunrith...'}
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 font-battambang">
                  {language === 'km'
                    ? 'ចំណាំ៖ ប្រសិនបើលោកអ្នកកែសម្រួលឈ្មោះឱ្យដូចគ្នា ប្រព័ន្ធនឹងបូកបញ្ចូលគ្នាស្វ័យប្រវត្តិ។'
                    : 'Note: Aligning names will automatically combine them into one donor group.'}
                </p>
              </div>

              {/* Field 2: Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 font-battambang mb-1">
                  {language === 'km' ? 'ចំនួនបច្ច័យ (ប្រាក់រៀល ៛)' : 'Amount (KHR ៛)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#028090] font-rajdhani font-semibold text-gray-900 dark:text-white"
                    placeholder="100000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-slate-500 font-battambang">
                    ៛
                  </span>
                </div>
              </div>

              {/* Field 3: Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 font-battambang mb-1">
                  {language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#028090] font-rajdhani text-gray-900 dark:text-white"
                />
              </div>

              {/* Field 4: Note / Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 font-battambang mb-1">
                  {language === 'km' ? 'កំណត់ចំណាំ / ទីលំនៅ' : 'Note / Location'}
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#028090] font-battambang text-gray-900 dark:text-white"
                  placeholder={language === 'km' ? 'ឧទាហរណ៍៖ ភូមិស្វាយចេក, វត្ត...' : 'e.g. Village, Province...'}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={isSaving}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer font-battambang"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#028090] hover:bg-[#026d7b] transition-colors rounded-xl flex items-center gap-2 cursor-pointer font-battambang disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-battambang mb-2">
              {language === 'km' ? 'បញ្ជាក់ការលុបកំណត់ត្រា' : 'Confirm Delete Record'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 font-battambang mb-3 leading-relaxed">
              {language === 'km' ? (
                <>
                  តើលោកអ្នកពិតជាចង់លុបកំណត់ត្រារបស់ <strong className="text-gray-900 dark:text-white">{deletingRecord.name}</strong> ចំនួន <strong className="text-emerald-600 font-rajdhani font-bold">{deletingRecord.amount.toLocaleString()} ៛</strong> ពី «<span className="font-semibold">{deletingRecord.source_name}</span>» មែនទេ?
                </>
              ) : (
                <>
                  Are you sure you want to delete the record for <strong className="text-gray-900 dark:text-white">{deletingRecord.name}</strong> with amount <strong className="text-emerald-600 font-rajdhani font-bold">{deletingRecord.amount.toLocaleString()} KHR</strong> from "{deletingRecord.source_name}"?
                </>
              )}
            </p>

            <p className="text-xs text-rose-500 font-battambang mb-5">
              {language === 'km' 
                ? '⚠️ សកម្មភាពនេះនឹងលុបចេញពីមូលដ្ឋានទិន្នន័យជាអចិន្ត្រៃយ៍។' 
                : '⚠️ This action is permanent and cannot be undone.'}
            </p>

            {deleteError && (
              <div className="mb-4 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-battambang">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer font-battambang"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors rounded-xl flex items-center gap-2 cursor-pointer font-battambang disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{language === 'km' ? 'លុបកំណត់ត្រា' : 'Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Required Dialog */}
      {showAdminRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-battambang mb-2">
              {language === 'km' ? 'តម្រូវឱ្យមានសិទ្ធិ Admin' : 'Admin Access Required'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 font-battambang mb-5 leading-relaxed">
              {language === 'km'
                ? 'ដើម្បីកែប្រែ ឬលុបទិន្នន័យសប្បុរសជន សូមចូលគណនីជា Admin (អ្នកគ្រប់គ្រង) ជាមុនសិន។'
                : 'To edit or delete donor contributions, please log in as an Admin.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdminRequired(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer font-battambang"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminRequired(false);
                    onNavigateTab('account');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#028090] hover:bg-[#026d7b] transition-colors rounded-xl cursor-pointer font-battambang"
                >
                  {language === 'km' ? 'ចូលគណនីឥឡូវនេះ' : 'Log In Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-gray-900/90 text-white rounded-xl shadow-xl backdrop-blur-xs text-xs sm:text-sm font-battambang animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
    </div>
  );
}

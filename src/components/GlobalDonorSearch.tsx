import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Copy, Check, User, MapPin, Calendar, HeartHandshake, Loader2, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { playSuccessSound, playFailSound } from '../lib/sound';

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

interface GlobalDonorSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalDonorSearch({ isOpen, onClose }: GlobalDonorSearchProps) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [expandedDonors, setExpandedDonors] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Edit / Delete states
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

  const handleOpenEdit = (rec: DonorRecord, donorName: string) => {
    const effectiveName = rec.name || donorName;
    setEditingRecord({
      id: rec.id,
      donor_name: donorName,
      recorded_name: effectiveName,
      amount: rec.amount,
      date: rec.date ? rec.date.split('T')[0] : '',
      note: rec.note || '',
      source_name: rec.source_name,
      source_type: rec.source_type
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
      fetchDonors(searchTerm);
    } catch (err: any) {
      console.error('Error updating record in search:', err);
      playFailSound();
      setEditError(err.message || (language === 'km' ? 'មិនអាចកែប្រែបានទេ' : 'Failed to update record.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (rec: DonorRecord, donorName: string) => {
    setDeletingRecord({
      id: rec.id,
      name: rec.name || donorName,
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
      fetchDonors(searchTerm);
    } catch (err: any) {
      console.error('Error deleting record in search:', err);
      playFailSound();
      setDeleteError(err.message || (language === 'km' ? 'មិនអាចលុបបានទេ' : 'Failed to delete record.'));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      fetchDonors('');
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchDonors = async (query: string) => {
    setLoading(true);
    try {
      const res = await api.get<SearchResponse>(`/api/name-lists/search-donors?q=${encodeURIComponent(query)}`);
      setData(res);
    } catch (err) {
      console.error('Failed to search donors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchDonors(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  const toggleDonorExpand = (name: string) => {
    setExpandedDonors(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleCopyDonor = (donor: DonorGroup) => {
    const lines = [
      `វត្តស្នាយដួច - ព័ត៌មានសប្បុរសជន`,
      `ឈ្មោះ៖ ${donor.name}`,
      donor.locations.length > 0 ? `ទីកន្លែង៖ ${donor.locations.join(', ')}` : '',
      `បច្ច័យសរុប៖ ${donor.total_amount.toLocaleString()} ៛ (${donor.contributions_count} លើក)`,
      `--- កំណត់ត្រាលម្អិត ---`,
      ...donor.records.map(r => {
        const d = r.date ? r.date.split('T')[0] : '';
        return `• ${d} | ${r.source_name}៖ ${r.amount.toLocaleString()} ៛ ${r.note ? `(${r.note})` : ''}`;
      })
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedKey(donor.name);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-14 bg-slate-900/60 backdrop-blur-xs font-battambang animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-[#028090] dark:text-teal-400 shrink-0" />
              <h2 className="text-base sm:text-lg font-title text-gray-900 dark:text-white tracking-wide">
                {language === 'en' ? 'GLOBAL DONOR SEARCH' : 'ស្វែងរកសប្បុរសជនទូទាំងប្រព័ន្ធ'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? 'Search donor name or location...' : 'វាយឈ្មោះសប្បុរសជន ឬទីកន្លែង...'}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#028090] transition-colors font-battambang"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span>{language === 'en' ? 'Donors found:' : 'រកឃើញសប្បុរសជន៖'}</span>
              <span className="font-rajdhani font-bold text-gray-900 dark:text-white">
                {data ? data.total_donors_found : 0}
              </span>
              <span className="text-gray-300 dark:text-slate-700">•</span>
              <span>{language === 'en' ? 'Contributions:' : 'កំណត់ត្រាសរុប៖'}</span>
              <span className="font-rajdhani font-bold text-gray-900 dark:text-white">
                {data ? data.total_contributions_found : 0}
              </span>
            </div>
            {loading && (
              <span className="text-xs text-[#028090] dark:text-teal-400 animate-pulse font-medium">
                {language === 'en' ? 'Searching...' : 'កំពុងស្វែងរក...'}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100 dark:divide-slate-800/80">
          {loading && !data && (
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#028090] dark:text-teal-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400 font-battambang">
                {language === 'en' ? 'Searching donors...' : 'កំពុងស្វែងរកសប្បុរសជន...'}
              </p>
            </div>
          )}

          {data && data.donors.length === 0 && !loading && (
            <div className="py-14 text-center">
              <User className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
                {searchTerm
                  ? (language === 'en' ? 'No donors match your search.' : `រកមិនឃើញសប្បុរសជនឈ្មោះ «${searchTerm}» ឡើយ។`)
                  : (language === 'en' ? 'No records found.' : 'មិនមានទិន្នន័យឡើយ។')}
              </p>
            </div>
          )}

          {data && data.donors.map((donor) => {
            const isExpanded = !!expandedDonors[donor.name];
            const isCopied = copiedKey === donor.name;

            return (
              <div key={donor.name} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {donor.name}
                      </span>
                      {donor.locations.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 font-normal">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {donor.locations.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                      <span>{language === 'en' ? 'Total contributions:' : 'ចូលរួមចំនួន៖'}</span>
                      <span className="font-rajdhani font-semibold text-gray-800 dark:text-slate-200">
                        {donor.contributions_count} {language === 'en' ? 'times' : 'លើក'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-rajdhani font-bold text-lg sm:text-xl text-emerald-600 dark:text-emerald-400 block leading-tight">
                        {donor.total_amount.toLocaleString()} ៛
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyDonor(donor)}
                        title={language === 'en' ? 'Copy summary' : 'ចម្លងព័ត៌មាន'}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => toggleDonorExpand(donor.name)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                        title={isExpanded ? 'បិទលម្អិត' : 'មើលលម្អិត'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      {language === 'en' ? 'Contribution Details' : 'ប្រវត្តិចូលបុណ្យលម្អិត'}
                    </div>

                    <div className="space-y-1.5">
                      {donor.records.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-gray-100 dark:border-slate-800/60 text-xs sm:text-sm hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-gray-800 dark:text-slate-200 truncate">
                              {rec.source_name}
                              {rec.name && rec.name !== donor.name && (
                                <span className="ml-1.5 text-xs text-gray-500 dark:text-slate-400 font-normal">
                                  ({language === 'km' ? 'ឈ្មោះកត់ត្រា៖ ' : 'As: '}
                                  <span className="font-medium text-gray-700 dark:text-slate-300">{rec.name}</span>)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-rajdhani">{rec.date ? rec.date.split('T')[0] : '-'}</span>
                              </span>
                              {rec.note && <span>• {rec.note}</span>}
                              {rec.is_cross_listed && (
                                <span className="text-[#028090] dark:text-teal-400 font-battambang">
                                  • {rec.cross_listed_info || (language === 'km' ? 'កត់ត្រាទាំងក្នុងចំណូលចំណាយ & បញ្ជីកសាង (រាប់តែម្ដង)' : 'Cross-listed in both lists (counted once)')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2.5 sm:gap-3">
                            <span className="font-rajdhani font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                              {rec.amount.toLocaleString()} ៛
                            </span>
                            <div className="flex items-center gap-1 pl-1.5 border-l border-gray-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(rec, donor.name);
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
                                  handleOpenDelete(rec, donor.name);
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>{language === 'en' ? 'Live database search across Seils and Name Lists' : 'ទិន្នន័យស្វែងរកផ្ទាល់ចេញពីបញ្ជីសីល និងបញ្ជីផ្សេងៗ'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'បិទ'}
          </button>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
              <div className="text-xs text-gray-600 dark:text-slate-300 font-battambang pb-2 border-b border-gray-100 dark:border-slate-800">
                {language === 'km' ? 'ប្រភពបញ្ជី៖ ' : 'Source List: '}
                <strong className="text-gray-900 dark:text-white font-medium">{editingRecord.source_name}</strong>
              </div>

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
                  placeholder={language === 'km' ? 'ឧទាហរណ៍៖ ភូមិស្វាយចេក...' : 'e.g. Village, Province...'}
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 flex items-center gap-2.5 px-4 py-2.5 bg-gray-900/90 text-white rounded-xl shadow-xl backdrop-blur-xs text-xs sm:text-sm font-battambang animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

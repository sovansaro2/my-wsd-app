import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Copy, Check, User, MapPin, Calendar, HeartHandshake } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';

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

  // Debounced search
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
        {/* Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-orange-500 shrink-0" />
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

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? 'Search donor name or location...' : 'វាយឈ្មោះសប្បុរសជន ឬទីកន្លែង...'}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-battambang"
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

          {/* Clean Stat Counters (No background boxes) */}
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
              <span className="text-xs text-orange-500 animate-pulse font-medium">
                {language === 'en' ? 'Searching...' : 'កំពុងស្វែងរក...'}
              </span>
            )}
          </div>
        </div>

        {/* Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100 dark:divide-slate-800/80">
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
                {/* Donor Header Row */}
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

                    {/* Meta info: count */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                      <span>{language === 'en' ? 'Total contributions:' : 'ចូលរួមចំនួន៖'}</span>
                      <span className="font-rajdhani font-semibold text-gray-800 dark:text-slate-200">
                        {donor.contributions_count} {language === 'en' ? 'times' : 'លើក'}
                      </span>
                    </div>
                  </div>

                  {/* Total Amount & Controls */}
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

                {/* Expanded Detailed Contributions */}
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
                            </div>
                            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-rajdhani">{rec.date ? rec.date.split('T')[0] : '-'}</span>
                              </span>
                              {rec.note && <span>• {rec.note}</span>}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="font-rajdhani font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                              {rec.amount.toLocaleString()} ៛
                            </span>
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

        {/* Footer */}
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
    </div>
  );
}

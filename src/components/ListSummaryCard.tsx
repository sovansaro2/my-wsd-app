import React from 'react';
import { Layers, FolderOpen, BookOpen, ChevronRight } from 'lucide-react';

interface SeilPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
  is_closed?: boolean;
  status?: string;
}

interface ListCategory {
  id: string;
  name: string;
  description?: string;
  is_closed?: boolean;
  status?: string;
}

interface ListSummaryCardProps {
  seils: SeilPeriod[];
  categories: ListCategory[];
  language?: 'km' | 'en';
  onNavigateTab?: (tab: 'records' | 'categories') => void;
}

const CLOSED_CATEGORY_NAMES = new Set([
  'បញ្ជីឈ្មោះបុណ្យផ្កា',
  'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ',
  'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ',
  'ទិញកម្រាលព្រំ (វគ្គ១)',
  'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១',
]);

const isCategoryClosed = (cat: ListCategory): boolean => {
  if (typeof cat.is_closed === 'boolean') return cat.is_closed;
  if (cat.status === 'closed' || cat.status === 'completed') return true;
  if (cat.status === 'open' || cat.status === 'active') return false;
  return CLOSED_CATEGORY_NAMES.has((cat.name || '').trim());
};

const toKhmerNum = (num: number | string): string => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num
    .toString()
    .split('')
    .map(digit => (khmerNumbers[parseInt(digit, 10)] !== undefined ? khmerNumbers[parseInt(digit, 10)] : digit))
    .join('');
};

export const ListSummaryCard: React.FC<ListSummaryCardProps> = ({
  seils,
  categories,
  language = 'km',
  onNavigateTab,
}) => {
  const isKm = language === 'km';
  const formatNum = (n: number) => (isKm ? toKhmerNum(n) : n.toString());

  const otherTotal = categories.length;
  const otherClosedCount = categories.filter(isCategoryClosed).length;
  const otherActiveCount = Math.max(0, otherTotal - otherClosedCount);

  const financeTotal = seils.length;
  const hasExplicitSeilStatus = seils.some(s => typeof s.is_closed === 'boolean' || !!s.status);
  const financeActiveCount = hasExplicitSeilStatus
    ? seils.filter(s => s.is_closed === false || s.status === 'open' || s.status === 'active').length
    : (financeTotal > 0 ? 1 : 0);
  const financeClosedCount = Math.max(0, financeTotal - financeActiveCount);

  const totalAll = otherTotal + financeTotal;
  const totalOpen = otherActiveCount + financeActiveCount;
  const totalClosed = otherClosedCount + financeClosedCount;

  const breakdownItems: Array<{
    key: 'categories' | 'records';
    title: string;
    icon: React.ReactNode;
    total: number;
    open: number;
    closed: number;
  }> = [
    {
      key: 'categories',
      title: isKm ? 'បញ្ជីផ្សេងៗ' : 'Other Lists',
      icon: <FolderOpen className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400 shrink-0" />,
      total: otherTotal,
      open: otherActiveCount,
      closed: otherClosedCount,
    },
    {
      key: 'records',
      title: isKm ? 'បញ្ជីចំណូល-ចំណាយ' : 'Finance Lists',
      icon: <BookOpen className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400 shrink-0" />,
      total: financeTotal,
      open: financeActiveCount,
      closed: financeClosedCount,
    },
  ];

  return (
    <section
      aria-label={isKm ? 'ទិដ្ឋភាពទូទៅនៃបញ្ជី' : 'Lists Overview'}
      className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/80 dark:border-slate-800 font-battambang text-gray-800 dark:text-slate-200 overflow-hidden"
    >
      {/* Tier 1: Compact Primary Overview */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="w-3.5 h-3.5 text-[#028090] dark:text-teal-400 shrink-0" />
          <h3 className="text-xs sm:text-[13px] font-semibold text-gray-900 dark:text-white">
            {isKm ? 'ទិដ្ឋភាពទូទៅនៃបញ្ជី' : 'Lists Overview'}
          </h3>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-200/80 dark:divide-slate-800 text-center">
          <div className="px-1.5">
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-rajdhani tabular-nums leading-tight">
              {formatNum(totalAll)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
              {isKm ? 'សរុប' : 'Total'}
            </div>
          </div>

          <div className="px-1.5">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-rajdhani tabular-nums leading-tight">
              {formatNum(totalOpen)}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight mt-0.5">
              {isKm ? 'បើក' : 'Open'}
            </div>
          </div>

          <div className="px-1.5">
            <div className="text-lg sm:text-xl font-bold text-gray-500 dark:text-slate-400 font-rajdhani tabular-nums leading-tight">
              {formatNum(totalClosed)}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">
              {isKm ? 'បិទ' : 'Closed'}
            </div>
          </div>
        </div>
      </div>

      {/* Tier 2: Compact 2-Column Category Breakdown */}
      <div className="border-t border-gray-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800">
        {breakdownItems.map((item) => {
          const innerContent = (
            <>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {item.icon}
                  <span className="text-xs sm:text-[13px] font-semibold text-gray-800 dark:text-slate-100 group-hover:text-[#028090] dark:group-hover:text-teal-400 transition-colors truncate">
                    {item.title}
                  </span>
                </div>
                {onNavigateTab && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 group-hover:text-[#028090] dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-800 text-center">
                <div className="px-1 flex items-baseline justify-center gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {isKm ? 'សរុប' : 'Total'}
                  </span>
                  <span className="text-[13px] sm:text-sm font-bold text-gray-900 dark:text-white font-rajdhani tabular-nums">
                    {formatNum(item.total)}
                  </span>
                </div>

                <div className="px-1 flex items-baseline justify-center gap-1">
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    {isKm ? 'បើក' : 'Open'}
                  </span>
                  <span className="text-[13px] sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-rajdhani tabular-nums">
                    {formatNum(item.open)}
                  </span>
                </div>

                <div className="px-1 flex items-baseline justify-center gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {isKm ? 'បិទ' : 'Closed'}
                  </span>
                  <span className="text-[13px] sm:text-sm font-bold text-gray-500 dark:text-slate-400 font-rajdhani tabular-nums">
                    {formatNum(item.closed)}
                  </span>
                </div>
              </div>
            </>
          );

          if (onNavigateTab) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigateTab(item.key)}
                className="group w-full text-left px-3.5 py-2 sm:px-5 sm:py-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#028090]/40 focus-visible:ring-inset"
              >
                {innerContent}
              </button>
            );
          }

          return (
            <div key={item.key} className="px-3.5 py-2 sm:px-5 sm:py-2.5">
              {innerContent}
            </div>
          );
        })}
      </div>
    </section>
  );
};


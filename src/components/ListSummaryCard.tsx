import React from 'react';
import { FolderOpen, BookOpen, ArrowRight } from 'lucide-react';

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
  const openPercent = totalAll > 0 ? Math.round((totalOpen / totalAll) * 100) : 0;

  const breakdownItems: Array<{
    key: 'categories' | 'records';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    total: number;
    open: number;
    closed: number;
  }> = [
    {
      key: 'categories',
      title: isKm ? 'បញ្ជីផ្សេងៗ' : 'Other Lists',
      subtitle: isKm ? 'គម្រោងកសាង និងកម្មវិធីបុណ្យ' : 'Construction & event lists',
      icon: <FolderOpen className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42] stroke-[1.7] shrink-0" />,
      total: otherTotal,
      open: otherActiveCount,
      closed: otherClosedCount,
    },
    {
      key: 'records',
      title: isKm ? 'បញ្ជីចំណូល-ចំណាយ' : 'Finance Lists',
      subtitle: isKm ? 'តាមវេនសីលនីមួយៗ' : 'By Seil periods',
      icon: <BookOpen className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42] stroke-[1.7] shrink-0" />,
      total: financeTotal,
      open: financeActiveCount,
      closed: financeClosedCount,
    },
  ];

  return (
    <section
      aria-label={isKm ? 'ទិដ្ឋភាពទូទៅនៃបញ្ជី' : 'Lists Overview'}
      className="space-y-3 font-battambang"
    >
      {/* Airy Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-title text-xl sm:text-2xl text-[#12323A] dark:text-white">
          {isKm ? 'ទិដ្ឋភាពទូទៅនៃបញ្ជី' : 'Lists Overview'}
        </h3>
        <span className="text-xs sm:text-sm text-[#6B7477] dark:text-slate-400">
          {isKm ? 'សរុប ' : 'Total '}
          <strong className="font-rajdhani font-bold tabular-nums text-[#12323A] dark:text-[#E2BD42]">
            {formatNum(totalAll)}
          </strong>
          {isKm ? ' បញ្ជី' : ' lists'}
        </span>
      </div>

      {/* Primary Sacred Deep Teal Summary Card */}
      <div className="bg-[#163F48] dark:bg-[#0F2A31] rounded-[24px] p-5 sm:p-6 text-white border border-[#1E4F5A]/60 dark:border-teal-900/50 shadow-[0_6px_20px_rgba(18,50,58,0.1)]">
        <div className="grid grid-cols-3 divide-x divide-white/15 text-center">
          <div className="px-2">
            <div className="text-2xl sm:text-3xl font-bold text-white font-rajdhani tabular-nums leading-tight">
              {formatNum(totalAll)}
            </div>
            <div className="text-xs text-teal-100/75 mt-1">
              {isKm ? 'សរុបទាំងអស់' : 'Total Lists'}
            </div>
          </div>

          <div className="px-2">
            <div className="text-2xl sm:text-3xl font-bold text-[#E2BD42] font-rajdhani tabular-nums leading-tight">
              {formatNum(totalOpen)}
            </div>
            <div className="text-xs text-[#E2BD42]/90 mt-1">
              {isKm ? 'កំពុងបើក' : 'Active'}
            </div>
          </div>

          <div className="px-2">
            <div className="text-2xl sm:text-3xl font-bold text-teal-100/85 font-rajdhani tabular-nums leading-tight">
              {formatNum(totalClosed)}
            </div>
            <div className="text-xs text-teal-100/70 mt-1">
              {isKm ? 'បានបិទ' : 'Closed'}
            </div>
          </div>
        </div>

        {/* Clean Slim Progress Track */}
        <div className="mt-4 pt-3.5 border-t border-white/12">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-teal-100/75 mb-2">
            <span>
              {isKm ? 'អត្រាបញ្ជីកំពុងដំណើរការ' : 'Active lists ratio'}
            </span>
            <span className="font-rajdhani font-semibold tabular-nums text-[#E2BD42]">
              {isKm ? `${toKhmerNum(openPercent)}%` : `${openPercent}%`}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E2BD42] transition-all duration-500"
              style={{ width: `${openPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual Crisp White Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {breakdownItems.map((item) => {
          const itemOpenPct = item.total > 0 ? Math.round((item.open / item.total) * 100) : 0;

          const cardBody = (
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="pt-0.5">{item.icon}</div>
                  <div className="min-w-0">
                    <h4 className="font-title text-base sm:text-lg text-[#12323A] dark:text-white group-hover:text-[#1E5663] dark:group-hover:text-[#E2BD42] transition-colors leading-snug truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#6B7477] dark:text-slate-400 mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                {onNavigateTab && (
                  <ArrowRight className="w-4 h-4 text-[#8A9497] dark:text-slate-500 group-hover:text-[#12323A] dark:group-hover:text-[#E2BD42] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[#12323A] dark:text-white font-rajdhani tabular-nums leading-none">
                      {formatNum(item.total)}
                    </span>
                    <span className="text-xs text-[#6B7477] dark:text-slate-400">
                      {isKm ? 'បញ្ជី' : 'lists'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                      <span>{isKm ? 'បើក' : 'Open'}</span>
                      <strong className="font-rajdhani font-bold tabular-nums text-[13px]">
                        {formatNum(item.open)}
                      </strong>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-[#6B7477] dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B4BCBE] dark:bg-slate-600 shrink-0" />
                      <span>{isKm ? 'បិទ' : 'Closed'}</span>
                      <strong className="font-rajdhani font-bold tabular-nums text-[13px] text-[#5C6669] dark:text-slate-300">
                        {formatNum(item.closed)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Slim hairline ratio bar */}
                <div className="w-full h-1 rounded-full bg-[#EFECE3] dark:bg-teal-950/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#163F48] dark:bg-[#E2BD42] transition-all duration-500"
                    style={{ width: `${itemOpenPct}%` }}
                  />
                </div>
              </div>
            </div>
          );

          if (onNavigateTab) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigateTab(item.key)}
                className="group w-full text-left bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_10px_rgba(18,50,58,0.03)] hover:border-[#12323A]/30 dark:hover:border-[#E2BD42]/50 active:scale-[0.99] transition-all p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12323A]/30"
              >
                {cardBody}
              </button>
            );
          }

          return (
            <div
              key={item.key}
              className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 shadow-[0_2px_10px_rgba(18,50,58,0.03)] p-5"
            >
              {cardBody}
            </div>
          );
        })}
      </div>
    </section>
  );
};

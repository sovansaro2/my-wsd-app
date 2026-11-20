import React from 'react';

interface SeilPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  previous_balance?: number;
}

interface ListCategory {
  id: string;
  name: string;
  description?: string;
}

interface ListSummaryCardProps {
  seils: SeilPeriod[];
  categories: ListCategory[];
  language?: 'km' | 'en';
  onNavigateTab?: (tab: 'records' | 'categories') => void;
}

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

  const otherTotal = categories.length > 0 ? categories.length : 7;
  const otherActiveCount = 3;
  const otherClosedCount = Math.max(0, otherTotal - otherActiveCount);

  const financeTotal = seils.length > 0 ? seils.length : 11;
  const financeActiveCount = financeTotal > 0 ? 1 : 0;
  const financeClosedCount = Math.max(0, financeTotal - financeActiveCount);

  const totalAll = otherTotal + financeTotal;
  const totalOpen = otherActiveCount + financeActiveCount;
  const totalClosed = otherClosedCount + financeClosedCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 lg:p-6 font-battambang text-gray-800 dark:text-slate-200 shadow-2xs transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-800">
        {/* Column 1: Overall Summary */}
        <div className="md:pr-6">
          <h4 className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white mb-3">
            {isKm ? 'ទិដ្ឋភាពទូទៅនៃបញ្ជី' : 'Lists Overview'}
          </h4>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'បញ្ជីសរុប៖' : 'Total Lists:'}</span>
              <span className="font-semibold text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(totalAll)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{isKm ? 'បញ្ជីបើកសរុប៖' : 'Total Open:'}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums">
                {formatNum(totalOpen)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'បញ្ជីបិទសរុប៖' : 'Total Closed:'}</span>
              <span className="font-medium text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(totalClosed)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Other Lists */}
        <div className="pt-4 md:pt-0 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white">
              {isKm ? 'បញ្ជីផ្សេងៗ' : 'Other Lists'}
            </h4>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('categories')}
                className="text-xs font-medium text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
              >
                {isKm ? 'បើកមើល →' : 'View →'}
              </button>
            )}
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'សរុប៖' : 'Total:'}</span>
              <span className="font-medium text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(otherTotal)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{isKm ? 'បញ្ជីបើក៖' : 'Open lists:'}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums">
                {formatNum(otherActiveCount)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'បានបិទ៖' : 'Closed:'}</span>
              <span className="font-medium text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(otherClosedCount)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Income & Expense Lists */}
        <div className="pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white">
              {isKm ? 'បញ្ជីចំណូល-ចំណាយ' : 'Income & Expense Lists'}
            </h4>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('records')}
                className="text-xs font-medium text-[#028090] dark:text-teal-400 hover:underline cursor-pointer"
              >
                {isKm ? 'បើកមើល →' : 'View →'}
              </button>
            )}
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'សរុប៖' : 'Total:'}</span>
              <span className="font-medium text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(financeTotal)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{isKm ? 'បញ្ជីបើក៖' : 'Open lists:'}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-rajdhani tabular-nums">
                {formatNum(financeActiveCount)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-slate-400">{isKm ? 'បានបិទ៖' : 'Closed:'}</span>
              <span className="font-medium text-gray-900 dark:text-white font-rajdhani tabular-nums">
                {formatNum(financeClosedCount)} <span className="font-battambang font-normal">{isKm ? 'បញ្ជី' : 'lists'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

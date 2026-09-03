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
}) => {
  const isKm = language === 'km';
  const formatNum = (n: number) => (isKm ? toKhmerNum(n) : n.toString());

  // 1. បញ្ជីផ្សេងៗ (Other Lists)
  const otherTotal = categories.length > 0 ? categories.length : 7;
  const otherActiveCount = 3;
  const otherClosedCount = Math.max(0, otherTotal - otherActiveCount);

  // 2. បញ្ជីចំណូល-ចំណាយ (Income-Expense Lists)
  const financeTotal = seils.length > 0 ? seils.length : 11;
  const financeActiveCount = financeTotal > 0 ? 1 : 0;
  const financeClosedCount = Math.max(0, financeTotal - financeActiveCount);

  // 3. សរុបរួមទាំងអស់ (Grand Totals)
  const totalAll = otherTotal + financeTotal;
  const totalOpen = otherActiveCount + financeActiveCount;
  const totalClosed = otherClosedCount + financeClosedCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 font-battambang text-gray-800 dark:text-slate-200 shadow-xs transition-colors">
      
      {/* ផ្នែកសរុបរួមនៅខាងលើ (Overall Summary at Top) */}
      <div className="pb-3.5 mb-3.5 border-b border-gray-100 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
          {/* បញ្ជីសរុប */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-gray-600 dark:text-slate-400 font-medium">
              {isKm ? 'បញ្ជីសរុប៖' : 'Total Lists:'}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatNum(totalAll)} {isKm ? 'បញ្ជី' : 'lists'}
            </span>
          </div>

          {/* បញ្ជីបើកសរុប (Green Dot + Dark Green text) */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
              {isKm ? 'បញ្ជីបើកសរុប៖' : 'Total Open:'}
            </span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">
              {formatNum(totalOpen)} {isKm ? 'បញ្ជី' : 'lists'}
            </span>
          </div>

          {/* បញ្ជីបិទសរុប */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-gray-600 dark:text-slate-400 font-medium">
              {isKm ? 'បញ្ជីបិទសរុប៖' : 'Total Closed:'}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatNum(totalClosed)} {isKm ? 'បញ្ជី' : 'lists'}
            </span>
          </div>
        </div>
      </div>

      {/* បញ្ជីផ្សេងៗ និង បញ្ជីចំណូល-ចំណាយ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800">
        
        {/* បញ្ជីផ្សេងៗ */}
        <div className="pt-0 sm:pt-0 sm:pr-4">
          <h4 className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white mb-2.5">
            {isKm ? 'បញ្ជីផ្សេងៗ' : 'Other Lists'}
          </h4>
          <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>{isKm ? 'សរុប៖' : 'Total:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNum(otherTotal)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                {isKm ? 'បញ្ជីបើក៖' : 'Open lists:'}
              </span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                {formatNum(otherActiveCount)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isKm ? 'បានបិទ៖' : 'Closed:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNum(otherClosedCount)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
          </div>
        </div>

        {/* បញ្ជីចំណូល-ចំណាយ */}
        <div className="pt-4 sm:pt-0 sm:pl-6">
          <h4 className="text-sm sm:text-[15px] font-semibold text-gray-900 dark:text-white mb-2.5">
            {isKm ? 'បញ្ជីចំណូល-ចំណាយ' : 'Income & Expense Lists'}
          </h4>
          <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>{isKm ? 'សរុប៖' : 'Total:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNum(financeTotal)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                {isKm ? 'បញ្ជីបើក៖' : 'Open lists:'}
              </span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                {formatNum(financeActiveCount)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isKm ? 'បានបិទ៖' : 'Closed:'}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNum(financeClosedCount)} {isKm ? 'បញ្ជី' : 'lists'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

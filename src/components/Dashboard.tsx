import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

import { Award } from 'lucide-react';
import ImageSlider from './ImageSlider';
import { ListSummaryCard } from './ListSummaryCard';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';

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

export default function Dashboard({ onNavigateTab }: { onNavigateTab?: (tab: 'records' | 'categories') => void }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [hundredKDonors, setHundredKDonors] = useState<HundredKDonor[]>([]);
  const [roofFundTotal, setRoofFundTotal] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, finData, hundredKData, categoriesData] = await Promise.all([
        api.getSeilPeriods(),
        api.getFinancialRecords(''),
        api.get100kDonors(),
        api.getNameListCategories()
      ]);
      setSeils(seilData || []);
      setFinancials(finData || []);
      setHundredKDonors(hundredKData || []);
      setCategories(categoriesData || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // Aggregation
  let totalIncome = 0;
  let totalExpense = 0;

  financials.forEach(record => {
    if (record.type === 'income') totalIncome += record.amount;
    if (record.type === 'expense') totalExpense += record.amount;
  });

  // Calculate metrics for the latest seil period (to display in KPI cards)
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
    
    // Get the absolute starting balance from the oldest seil
    startingBalance = seils[seils.length - 1].previous_balance || 0;
  } else {
    balance = totalIncome - totalExpense;
  }

  const seilCount = seils.length > 0 ? seils.length : 0;

  return (
    <div className="flex flex-col h-full pb-20 overflow-y-auto font-battambang transition-colors duration-200">
      
      <div className="max-w-6xl mx-auto w-full px-0 sm:px-4 pt-1 sm:pt-2 pb-6 space-y-3 sm:space-y-6">

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-sm border border-rose-200 dark:border-rose-500/20 shadow-2xs">
          {error}
        </div>
      )}

      {/* Top Banner */}
      <div className="w-full">
        <ImageSlider />
      </div>

      {/* List Status and Overview Section */}
      <div className="w-full">
        <ListSummaryCard 
          seils={seils} 
          categories={categories} 
          language={language}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* 100k+ Donors Section */}
      <section className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-200/70 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard_high_donors')}</h3>
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400 font-battambang">
            {t('dashboard_donors_count', { count: language === 'km' ? toKhmerNum(hundredKDonors.length) : hundredKDonors.length })}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0">
          {hundredKDonors.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-400 dark:text-slate-500 text-sm sm:text-base font-battambang">
              {t('common_no_data')}
            </div>
          ) : (
            hundredKDonors.map((donor, index) => (
              <div 
                key={donor.id || index} 
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-gray-100 dark:border-slate-800 md:border-r md:border-b-0"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-6 shrink-0 text-center text-sm font-medium text-gray-400 dark:text-slate-500 font-battambang">
                    {language === 'km' ? toKhmerNum(index + 1) : index + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-normal text-base text-gray-900 dark:text-white block leading-normal font-battambang">{donor.name}</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 block mt-0.5 font-battambang">
                      {donor.category_name}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 font-battambang">
                    {language === 'km' ? `៛ ${toKhmerNum(donor.amount.toLocaleString())}` : `៛ ${donor.amount.toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
    </div>
  );
}

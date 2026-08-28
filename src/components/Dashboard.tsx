import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/apiClient';

import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Award, Lock as LockIcon, Settings } from 'lucide-react';
import PinPad from './PinPad';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

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


export default function Dashboard() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  const [hundredKDonors, setHundredKDonors] = useState<HundredKDonor[]>([]);
  const [roofFundTotal, setRoofFundTotal] = useState<number>(0);
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  // Auto hide balance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isAmountVisible) {
      timeoutId = setTimeout(() => setIsAmountVisible(false), 30000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isAmountVisible]);

  // Hide on background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsAmountVisible(false);
        setShowPinPad(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleToggleVisibility = async () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
      return;
    }
    
    // Check if locked out
    if (isLockedOut) {
      setPinError('សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។');
      setShowPinPad(true);
      return;
    }

    try {
      setIsPinLoading(true);
      const profile = await api.getMe();
      if (!profile?.has_balance_pin) {
        setShowSetupPrompt(true);
      } else {
        setShowPinPad(true);
        setPinError('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinLoading(false);
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (isLockedOut) return;
    try {
      setIsPinLoading(true);
      setPinError('');
      await api.verifyBalancePin(pin);
      
      // Success
      setIsAmountVisible(true);
      setShowPinPad(false);
      setFailedAttempts(0);
    } catch (err: any) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLockedOut(true);
        setPinError('ព្យាយាមច្រើនដងពេក សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។');
        setTimeout(() => {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setPinError('');
        }, 60000); // 1 minute lockout
      } else {
        setPinError('PIN មិនត្រឹមត្រូវ');
      }
    } finally {
      setIsPinLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, finData, hundredKData] = await Promise.all([
        api.getSeilPeriods(),
        api.getFinancialRecords(''),
        api.get100kDonors(),
        api.getNameListCategories()
      ]);
      setSeils(seilData);
      setFinancials(finData);
      setHundredKDonors(hundredKData || []);
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
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24 overflow-y-auto font-battambang transition-colors duration-200">
      
      
      <div className="max-w-xl mx-auto w-full px-4 pt-4 pb-6 space-y-5">

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-xl text-sm border border-rose-200 dark:border-rose-500/20">
          {error}
        </div>
      )}

      {/* Main Financial Overview Card */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 ">
              {t('dashboard_total_report', { count: seilCount > 0 ? seilCount : '...' })}
            </span>
            <h2 className="text-sm  text-gray-800 dark:text-slate-200 mt-0.5">
              {t('dashboard_actual_balance')}
            </h2>
          </div>
          <button 
            onClick={handleToggleVisibility} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            title={isAmountVisible ? (language === 'en' ? 'Hide balance' : 'លាក់ទឹកប្រាក់') : (language === 'en' ? 'Show balance' : 'បង្ហាញទឹកប្រាក់')}
          >
            {isAmountVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>{t('common_hide')}</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>{t('common_show')}</span>
              </>
            )}
          </button>
        </div>

        {/* Master Balance */}
        <div className="py-4">
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white ">
            {isAmountVisible ? `៛ ${balance.toLocaleString()}` : '៛ •••••••'}
          </p>
        </div>

        {/* Income vs Expense Split */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('dashboard_total_income')}</span>
            </div>
            <p className="text-base sm:text-lg  text-emerald-600 dark:text-emerald-400">
              {isAmountVisible ? `+ ៛ ${totalIncome.toLocaleString()}` : '៛ ••••'}
            </p>
          </div>

          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{t('dashboard_total_expense')}</span>
            </div>
            <p className="text-base sm:text-lg  text-rose-600 dark:text-rose-400">
              {isAmountVisible ? `- ៛ ${totalExpense.toLocaleString()}` : '៛ ••••'}
            </p>
          </div>
        </div>
      </section>

      {/* 100k+ Donors Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm  text-gray-900 dark:text-white">{t('dashboard_high_donors')}</h3>
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            {t('dashboard_donors_count', { count: hundredKDonors.length })}
          </span>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {hundredKDonors.length === 0 ? (
            <div className="py-10 text-center text-gray-400 dark:text-slate-500 text-sm">
              {t('common_no_data')}
            </div>
          ) : (
            hundredKDonors.map((donor, index) => (
              <div key={donor.id || index} className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-normal text-[15px] text-gray-900 dark:text-white block truncate leading-tight font-battambang">{donor.name}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 block mt-0.5 truncate font-battambang">
                      {donor.category_name}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className=" text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                    {isAmountVisible ? `៛ ${donor.amount.toLocaleString()}` : '៛ ••••'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      
      {/* PIN Setup Prompt Modal */}
      <>
        {showSetupPrompt && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSetupPrompt(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm z-[101] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center">
                    <LockIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg  text-gray-900 dark:text-white">សុវត្ថិភាពទឹកប្រាក់</h3>
                </div>
                <button onClick={() => setShowSetupPrompt(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-battambang leading-relaxed">
                <p className="mb-2">ដើម្បីមើលទឹកប្រាក់បាន លោកអ្នកត្រូវកំណត់ PIN សុវត្ថិភាព ៤ ខ្ទង់ជាមុនសិន។</p>
                <p>សូមចូលទៅកាន់៖ <br/><span className=" text-gray-700 dark:text-gray-300">គណនី {'>'} ការកំណត់ {'>'} សុវត្ថិភាព PIN</span></p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl  text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  បិទ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </>

      {/* PinPad Verification */}
      <>
        {showPinPad && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPinPad(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4"
            >
              <PinPad
                title="បញ្ជាក់ PIN"
                subtitle="សូមបញ្ចូល PIN ៤ ខ្ទង់របស់អ្នកដើម្បីមើលទឹកប្រាក់"
                error={pinError}
                onComplete={handlePinSubmit}
                onCancel={() => setShowPinPad(false)}
                isLoading={isPinLoading}
              />
            </motion.div>
          </div>
        )}
      </>

    </div>
    </div>
  );
}

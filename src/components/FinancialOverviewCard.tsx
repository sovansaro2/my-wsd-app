import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock as LockIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PinPad from './PinPad';
import { api } from '../lib/apiClient';
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

interface FinancialOverviewCardProps {
  className?: string;
  variant?: 'normal' | 'embedded';
  userRole?: 'admin' | 'user' | null;
  onNavigateToSecurity?: () => void;
}

export default function FinancialOverviewCard({
  className = '',
  variant = 'normal',
  userRole,
  onNavigateToSecurity
}: FinancialOverviewCardProps) {
  // If user role is provided and not admin, do not render or load data
  if (userRole !== undefined && userRole !== 'admin') {
    return null;
  }

  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [seils, setSeils] = useState<SeilPeriod[]>([]);
  
  // Visibility and PIN states
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);

  // Auto-hide balance after 30 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isAmountVisible) {
      timeoutId = setTimeout(() => setIsAmountVisible(false), 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAmountVisible]);

  // Hide on background / tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsAmountVisible(false);
        setShowPinPad(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [seilData, finData] = await Promise.all([
        api.getSeilPeriods(),
        api.getFinancialRecords('')
      ]);
      setSeils(seilData || []);
      setFinancials(finData || []);
    } catch (err) {
      console.error('Failed to fetch financial data for account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
      return;
    }

    if (isLockedOut) {
      setPinError(language === 'km' ? 'សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។' : 'Too many attempts. Please wait.');
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

      setIsAmountVisible(true);
      setShowPinPad(false);
      setFailedAttempts(0);
    } catch (err: any) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLockedOut(true);
        setPinError(language === 'km' ? 'ព្យាយាមច្រើនដងពេក សូមរង់ចាំបន្តិច ហើយព្យាយាមម្ដងទៀត។' : 'Too many failed attempts. Please wait.');
        setTimeout(() => {
          setIsLockedOut(false);
          setFailedAttempts(0);
          setPinError('');
        }, 60000);
      } else {
        setPinError(language === 'km' ? 'PIN មិនត្រឹមត្រូវ' : 'Incorrect PIN');
      }
    } finally {
      setIsPinLoading(false);
    }
  };

  // Metrics calculation
  let totalIncome = 0;
  let totalExpense = 0;

  financials.forEach((record) => {
    if (record.type === 'income') totalIncome += record.amount;
    if (record.type === 'expense') totalExpense += record.amount;
  });

  let balance = 0;
  if (seils.length > 0) {
    const latestSeil = seils[0];
    const latestSeilFin = financials.filter((f) => f.seil_id === latestSeil.id);
    let latestIncome = 0;
    let latestExpense = 0;
    latestSeilFin.forEach((f) => {
      if (f.type === 'income') latestIncome += f.amount;
      if (f.type === 'expense') latestExpense += f.amount;
    });
    const previousBalance = latestSeil.previous_balance || 0;
    balance = previousBalance + latestIncome - latestExpense;
  } else {
    balance = totalIncome - totalExpense;
  }

  const seilCount = seils.length > 0 ? seils.length : 0;

  return (
    <>
      <section
        className={
          variant === 'embedded'
            ? `bg-white dark:bg-slate-900 w-full p-4 sm:p-5 flex flex-col justify-between font-battambang transition-colors ${className}`
            : `bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-3.5 sm:p-4 flex flex-col justify-between font-battambang transition-colors ${className}`
        }
      >
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-400 dark:text-slate-400">
                {t('dashboard_total_report', { count: seilCount > 0 ? seilCount : '...' })}
              </span>
              <h2 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug">
                {t('dashboard_actual_balance')}
              </h2>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={loading || isPinLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-60"
              title={
                isAmountVisible
                  ? language === 'en'
                    ? 'Hide balance'
                    : 'លាក់ទឹកប្រាក់'
                  : language === 'en'
                  ? 'Show balance'
                  : 'បង្ហាញទឹកប្រាក់'
              }
            >
              {isPinLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : isAmountVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-gray-600 dark:text-slate-300" />
                  <span>{t('common_hide')}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-slate-300" />
                  <span>{t('common_show')}</span>
                </>
              )}
            </button>
          </div>

          {/* Master Balance Display */}
          <div className="py-2.5 sm:py-3">
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {loading ? (
                <span className="text-gray-400 dark:text-slate-600 text-lg font-normal">...</span>
              ) : isAmountVisible ? (
                `៛ ${balance.toLocaleString()}`
              ) : (
                '៛ •••••••'
              )}
            </p>
          </div>
        </div>

        {/* Income vs Expense Split */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100 dark:border-slate-800">
          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-lg p-2 sm:p-2.5 border border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{t('dashboard_total_income')}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {loading ? '...' : isAmountVisible ? `+ ៛ ${totalIncome.toLocaleString()}` : '៛ ••••'}
            </p>
          </div>

          <div className="bg-gray-50/80 dark:bg-slate-800/40 rounded-lg p-2 sm:p-2.5 border border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span className="truncate">{t('dashboard_total_expense')}</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
              {loading ? '...' : isAmountVisible ? `- ៛ ${totalExpense.toLocaleString()}` : '៛ ••••'}
            </p>
          </div>
        </div>
      </section>

      {/* PIN Setup Prompt Modal */}
      <AnimatePresence>
        {showSetupPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSetupPrompt(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 z-[101] font-battambang"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {language === 'km' ? 'សុវត្ថិភាពទឹកប្រាក់' : 'Balance Security'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                <p className="mb-2">
                  {language === 'km'
                    ? 'ដើម្បីមើលទឹកប្រាក់បាន លោកអ្នកត្រូវកំណត់ PIN សុវត្ថិភាព ៤ ខ្ទង់ជាមុនសិន។'
                    : 'To view balances, please set up a 4-digit security PIN first.'}
                </p>
                <p>
                  {language === 'km' ? (
                    <>
                      សូមចូលទៅកាន់៖ <br />
                      <span className="text-gray-700 dark:text-gray-200 font-medium">
                        គណនី {'>'} ពាក្យសម្ងាត់ និងសុវត្ថិភាព {'>'} សុវត្ថិភាព PIN
                      </span>
                    </>
                  ) : (
                    <>
                      Go to: <br />
                      <span className="text-gray-700 dark:text-gray-200 font-medium">
                        Account {'>'} Password & Security {'>'} PIN Security
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowSetupPrompt(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('about_close')}
                </button>
                {onNavigateToSecurity && (
                  <button
                    onClick={() => {
                      setShowSetupPrompt(false);
                      onNavigateToSecurity();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                  >
                    {language === 'km' ? 'កំណត់ PIN' : 'Set PIN'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PinPad Verification Modal */}
      <AnimatePresence>
        {showPinPad && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPinLoading && setShowPinPad(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 z-[101]"
            >
              <button
                onClick={() => !isPinLoading && setShowPinPad(false)}
                disabled={isPinLoading}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <PinPad
                title={language === 'km' ? 'បញ្ចូល PIN សុវត្ថិភាព' : 'Enter Security PIN'}
                subtitle={language === 'km' ? 'ដើម្បីមើលរបាយការណ៍សាច់ប្រាក់' : 'To reveal financial balance'}
                error={pinError}
                onComplete={handlePinSubmit}
                isLoading={isPinLoading}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

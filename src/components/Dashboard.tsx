import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/apiClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Eye, EyeOff, X, Key, Award } from 'lucide-react';
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
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const handleToggleVisibility = () => {
    if (isAmountVisible) {
      setIsAmountVisible(false);
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === "wsd-app-v") {
      setIsAmountVisible(true);
      setShowPasswordModal(false);
    } else {
      setPasswordError('ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!');
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
        api.get100kDonors()
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

  // Chart Data: Income vs Expense per Seil
  const chartData = seils.map(seil => {
    const seilFin = financials.filter(f => f.seil_id === seil.id);
    let inc = 0;
    let exp = 0;
    seilFin.forEach(f => {
      if (f.type === 'income') inc += f.amount;
      if (f.type === 'expense') exp += f.amount;
    });
    return {
      name: seil.name,
      [t('dashboard_income')]: inc,
      [t('dashboard_expense')]: exp
    };
  }).reverse(); // chronological

  const pieData = [
    { name: t('dashboard_total_income'), value: totalIncome },
    { name: t('dashboard_total_expense'), value: totalExpense },
  ];
  const COLORS = ['#22c55e', '#ef4444'];
  const seilCount = seils.length > 0 ? seils.length : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24 overflow-y-auto font-battambang transition-colors duration-200">
      
      <div className="px-4 pt-6 pb-2">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dashboard_title')}</h2>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto w-full px-4 space-y-8 mt-2">

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <div className="flex justify-between items-end mb-3">
           <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{t('dashboard_total_report', { count: seilCount > 0 ? seilCount : '...' })}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex flex-col justify-center col-span-2 relative overflow-hidden mb-1">
            <div className="absolute -right-2 -bottom-6 opacity-10">
              <Wallet className="w-28 h-28 text-white" />
            </div>
            <div className="flex justify-between items-center relative z-10 mb-1">
              <p className="text-slate-400 text-[12px] font-medium">{t('dashboard_actual_balance')}</p>
              <button onClick={handleToggleVisibility} className="text-slate-400 hover:text-white transition-colors">
                {isAmountVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-3xl font-bold text-white relative z-10">
              {isAmountVisible ? `៛ ${balance.toLocaleString()}` : '៛ ***'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">{t('dashboard_total_income')}</p>
              </div>
              <button onClick={handleToggleVisibility} className="text-slate-400 hover:text-emerald-500 transition-colors">
                {isAmountVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[17px] font-bold text-slate-900 dark:text-white">
              {isAmountVisible ? `៛ ${totalIncome.toLocaleString()}` : '៛ ***'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">{t('dashboard_total_expense')}</p>
              </div>
              <button onClick={handleToggleVisibility} className="text-slate-400 hover:text-rose-500 transition-colors">
                {isAmountVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[17px] font-bold text-slate-900 dark:text-white">
              {isAmountVisible ? `៛ ${totalExpense.toLocaleString()}` : '៛ ***'}
            </p>
          </div>
        </div>
      </section>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-md font-bold text-gray-800 dark:text-slate-200 mb-4">{t('dashboard_chart_title')}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={60} tickFormatter={(value) => `៛${value/1000}k`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey={t('dashboard_income')} fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey={t('dashboard_expense')} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-md font-bold text-gray-800 dark:text-slate-200 mb-2">{t('dashboard_pie_title')}</h3>
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`៛ ${value.toLocaleString()}`, t('dashboard_amount')]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      </div>

      {/* 100k+ Donors Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors mt-8 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-md font-bold text-gray-800 dark:text-slate-200">សប្បុរសជន (១០០,០០០៛ ឡើង)</h3>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            {hundredKDonors.length} រូប
          </span>
        </div>
        
        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
          {hundredKDonors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
              មិនទាន់មានទិន្នន័យនៅឡើយទេ
            </div>
          ) : (
            hundredKDonors.map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-left block leading-tight">{donor.name}</span>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {donor.category_name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isAmountVisible ? `៛ ${donor.amount.toLocaleString()}` : '៛ ***'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
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
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">បញ្ជាក់ពាក្យសម្ងាត់</h3>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីមើលទឹកប្រាក់៖
                </p>
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none mb-2 font-mono"
                  placeholder="********"
                />
                {passwordError && (
                  <p className="text-red-500 text-xs font-medium mb-4">{passwordError}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    បញ្ជាក់
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

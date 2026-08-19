import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
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

export default function Dashboard() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [seils, setSeils] = useState<SeilPeriod[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seilData, finData] = await Promise.all([
        api.getSeilPeriods(),
        // Pass empty string or handle fetch all in backend
        api.getFinancialRecords('')
      ]);
      setSeils(seilData);
      setFinancials(finData);
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
    <div className="flex flex-col h-full bg-slate-50 pb-24 overflow-y-auto font-battambang">
      
      <div className="px-4 pt-6 pb-2">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dashboard_title')}</h2>
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
           <h3 className="text-[15px] font-bold text-slate-800">{t('dashboard_total_report', { count: seilCount > 0 ? seilCount : '...' })}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex flex-col justify-center col-span-2 relative overflow-hidden mb-1">
            <div className="absolute -right-2 -bottom-6 opacity-10">
              <Wallet className="w-28 h-28 text-white" />
            </div>
            <p className="text-slate-400 text-[12px] font-medium mb-1 relative z-10">{t('dashboard_actual_balance')}</p>
            <p className="text-3xl font-bold text-white relative z-10">៛ {balance.toLocaleString()}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{t('dashboard_total_income')}</p>
            </div>
            <p className="text-[17px] font-bold text-slate-900">៛ {totalIncome.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{t('dashboard_total_expense')}</p>
            </div>
            <p className="text-[17px] font-bold text-slate-900">៛ {totalExpense.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Bar Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-gray-100">
        <h3 className="text-md font-bold text-gray-800 mb-4">{t('dashboard_chart_title')}</h3>
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
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-gray-100">
        <h3 className="text-md font-bold text-gray-800 mb-2">{t('dashboard_pie_title')}</h3>
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
    </div>
  );
}

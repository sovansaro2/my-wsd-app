import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronDown, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';

interface SeilPeriod {
  id: string;
  name: string;
  date_range_text: string;
  previous_balance: number;
}

interface FinancialRecord {
  id: string;
  seil_id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  record_date: string | null;
  note: string | null;
}

export default function Records() {
  const [periods, setPeriods] = useState<SeilPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<SeilPeriod | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchRecords(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('seil_periods')
        .select('*')
        .order('name', { ascending: true })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPeriods(data);
        setSelectedPeriod(data[0]); // Select first by default
      }
    } catch (e) {
      console.error('Error fetching periods:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecords = async (seilId: string) => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('seil_id', seilId)
        .order('record_date', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });
        
      if (error) throw error;
      setRecords(data || []);
    } catch (e) {
      console.error('Error fetching records:', e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('km-KH').format(amount) + '៛';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingScreen className="h-full bg-[#FAFAFA]" />;
  }

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#FAFAFA]">
        <Wallet className="w-16 h-16 text-zinc-200 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 mb-2">មិនទាន់មានទិន្នន័យ</h2>
        <p className="text-zinc-500 text-sm max-w-xs">សូមបញ្ជូលទិន្នន័យចំណូលចំណាយរបស់អ្នកនៅផ្នែកគ្រប់គ្រង។</p>
      </div>
    );
  }

  const incomeRecords = records.filter(r => r.type === 'income');
  const expenseRecords = records.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const previousBalance = selectedPeriod?.previous_balance || 0;
  const currentBalance = previousBalance + totalIncome - totalExpense;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] pb-6 font-battambang">
      {/* Header & Selector */}
      <div className="bg-white p-4 sm:p-6 border-b border-gray-100 relative z-10 shadow-sm">
        <div className="relative max-w-3xl mx-auto">
          <select 
            className="w-full appearance-none bg-zinc-50 border border-gray-200/60 text-zinc-900 py-3.5 px-4 rounded-xl font-semibold text-[15px] outline-none focus:ring-2 focus:ring-zinc-900/10 hover:bg-zinc-100 transition-colors"
            value={selectedPeriod?.id || ''}
            onChange={(e) => {
              const p = periods.find(x => x.id === e.target.value);
              if (p) setSelectedPeriod(p);
            }}
          >
            {periods.map(p => (
              <option key={p.id} value={p.id} className="text-zinc-900 bg-white">
                {p.name} ({p.date_range_text})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-zinc-400" />
        </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          <div className="bg-zinc-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">បច្ច័យនៅសល់ពីមុន</p>
            <p className="text-xl font-bold text-zinc-900">{formatCurrency(previousBalance)}</p>
          </div>
          <div className="bg-amber-500 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <p className="text-amber-950/80 text-[11px] uppercase tracking-wider mb-1 font-semibold relative z-10">នៅសល់ជាក់ស្តែង</p>
            <p className="text-xl font-bold text-white relative z-10">{formatCurrency(currentBalance)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 max-w-3xl mx-auto w-full">
        <button 
          onClick={() => setActiveTab('income')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'income' 
              ? 'bg-white text-emerald-600 border border-gray-200/60 shadow-sm' 
              : 'bg-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <ArrowDownCircle className={`w-4 h-4 ${activeTab === 'income' ? 'text-green-600' : ''}`} />
          ចំណូលសរុប ({formatCurrency(totalIncome)})
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'expense' 
              ? 'bg-white text-rose-600 border border-gray-200/60 shadow-sm' 
              : 'bg-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <ArrowUpCircle className={`w-4 h-4 ${activeTab === 'expense' ? 'text-rose-600' : ''}`} />
          ចំណាយសរុប ({formatCurrency(totalExpense)})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 max-w-3xl mx-auto w-full">
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'income' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'income' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {(activeTab === 'income' ? incomeRecords : expenseRecords).map((record, index) => (
                <div key={record.id} className="bg-white rounded-2xl p-4 border border-gray-100/80 shadow-sm flex flex-col relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-[15px] text-zinc-900 leading-tight">{record.description}</h3>
                    </div>
                    <span className={`font-bold text-[15px] ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {activeTab === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end text-[12px] text-zinc-400 mt-1 pl-8.5">
                    <span>{formatDate(record.record_date)}</span>
                    {record.note && (
                      <span className="bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[140px] text-zinc-500">
                        {record.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(activeTab === 'income' ? incomeRecords : expenseRecords).length === 0 && (
                <div className="text-center py-12 text-zinc-400 text-sm">
                  មិនមានទិន្នន័យ
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

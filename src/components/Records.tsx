import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

import { ChevronDown, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';

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

interface RecordsProps {
  userRole?: 'admin' | 'user' | null;
  onAddRecord?: () => void;
}

export default function Records({ userRole, onAddRecord }: RecordsProps = {}) {
  const { t } = useLanguage();
  const [periods, setPeriods] = useState<SeilPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<SeilPeriod | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordType, setNewRecordType] = useState<'income' | 'expense'>('expense');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      const data = await api.getSeilPeriods();
        
      
      
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
      const data = await api.getFinancialRecords(seilId);
        
      
      setRecords(data || []);
    } catch (e) {
      console.error('Error fetching records:', e);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod || !newDescription || !newAmount) return;

    setIsSaving(true);
    try {
      const recordData = {
        seil_id: selectedPeriod.id,
        type: newRecordType,
        description: newDescription,
        amount: parseFloat(newAmount.replace(/,/g, '')),
        record_date: newDate || null,
        note: newNote || null
      };

      await api.createFinancialRecord(recordData);
      
      fetchRecords(selectedPeriod.id);
      setIsAddModalOpen(false);
      
      setNewDescription('');
      setNewAmount('');
      setNewNote('');
    } catch (error) {
      console.error('Error saving record:', error);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
    } finally {
      setIsSaving(false);
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
      <div className="bg-white px-4 py-5 border-b border-gray-100 relative z-10 shadow-sm">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('records_title')}</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left bg-gray-50 border border-gray-200 text-gray-900 py-3.5 px-4 rounded-2xl font-semibold text-[15px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all flex items-center justify-between"
              >
                <span className="truncate pr-2">
                  {selectedPeriod ? `${selectedPeriod.name} (${selectedPeriod.date_range_text})` : 'ជ្រើសរើស...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      {periods.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPeriod(p);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors flex items-center justify-between ${selectedPeriod?.id === p.id ? 'bg-orange-50/50 text-orange-600' : 'text-gray-700'}`}
                        >
                          <span className="font-medium text-[15px] leading-relaxed pr-4 whitespace-pre-wrap">
                            {p.name} ({p.date_range_text})
                          </span>
                          {selectedPeriod?.id === p.id && (
                            <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-orange-500 text-white w-12 h-12 rounded-2xl shadow-sm hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('records_add_new')}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-2 max-w-3xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-gray-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">{t('records_prev_balance')}</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(previousBalance)}</p>
          </div>
          <div className="bg-orange-500 rounded-2xl p-4 shadow-md shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute -top-2 -right-2 p-3 opacity-10">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <p className="text-orange-100 text-[11px] uppercase tracking-wider mb-1 font-semibold relative z-10">{t('records_current_balance')}</p>
            <p className="text-xl font-bold text-white relative z-10">{formatCurrency(currentBalance)}</p>
          </div>
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
          {t('records_total_income')} ({formatCurrency(totalIncome)})
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
          {t('records_total_expense')} ({formatCurrency(totalExpense)})
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
                <div key={record.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col relative">
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
                  {activeTab === 'income' ? t('records_empty_income') : t('records_empty_expense')}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-2xl overflow-hidden max-w-lg mx-auto pb-safe flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-[17px] font-bold text-gray-900">{t('records_add_new_title')}</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 pb-24 overflow-y-auto">
                <form onSubmit={handleSaveRecord} className="space-y-4">
                  
                  {/* Type Toggle */}
                  <div className="flex bg-gray-100/80 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setNewRecordType('income')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        newRecordType === 'income'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('records_type_income')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRecordType('expense')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        newRecordType === 'expense'
                          ? 'bg-white text-rose-500 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('records_type_expense')}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('records_description')}</label>
                    <input
                      type="text"
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={t('records_description_ph')}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('records_amount')}</label>
                    <input
                      type="text"
                      required
                      value={newAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewAmount(val ? parseInt(val, 10).toLocaleString('en-US') : '');
                      }}
                      placeholder={t('records_amount_ph')}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('records_date')}</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('records_note')}</label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder={t('records_note_ph')}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full mt-2 py-4 rounded-2xl bg-zinc-900 text-white font-bold text-[15px] shadow-sm hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/50 disabled:opacity-70 flex justify-center items-center"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t('records_save')
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


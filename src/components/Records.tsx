import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

import { ChevronDown, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Check, Download, Loader2, Calendar, Bell } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { saveReport } from '../lib/reportUtils';
import { signBase64 } from '../lib/signBase64';

const toKhmerNum = (num: number | string) => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(digit => khmerNumbers[parseInt(digit)] || digit).join('');
};

const getKhmerDate = () => {
  const d = new Date();
  const day = toKhmerNum(d.getDate().toString().padStart(2, '0'));
  const months = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const month = months[d.getMonth()];
  const year = toKhmerNum(d.getFullYear());
  return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
};

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
  const [newNotifyPublic, setNewNotifyPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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

  
    const handleDownload = async () => {
    if (!reportRef.current || !selectedPeriod) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // wait a bit longer to ensure render
      const dataUrl = await toPng(reportRef.current, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          margin: '0',
          width: '800px'
        }
      });
      
      try {
        const blob = await (await fetch(dataUrl)).blob();
        
        await saveReport({
          title: `របាយការណ៍បច្ច័យ_${selectedPeriod.name}`,
          type: 'image/png',
          blob: blob
        });
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);

      } catch (e) {
        // Fallback to classic download if anything fails
        const link = document.createElement('a');
        link.download = `របាយការណ៍បច្ច័យ_${selectedPeriod.name}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setIsDownloading(false);
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
        note: newNote || null,
        ...(newNotifyPublic ? { notify_public: true, seil_name: selectedPeriod.name } : {})
      };

      await api.createFinancialRecord(recordData);
      
      fetchRecords(selectedPeriod.id);
      setIsAddModalOpen(false);
      
      setNewDescription('');
      setNewAmount('');
      setNewNote('');
      setNewNotifyPublic(false);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ: ' + (error.message || ''));
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
    return <LoadingScreen className="h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200" />;
  }

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200">
        <Wallet className="w-16 h-16 text-zinc-200 mb-4" />
        <h2 className="text-xl font-bold text-zinc-800 dark:text-slate-200 mb-2">មិនទាន់មានទិន្នន័យ</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm max-w-xs">សូមបញ្ជូលទិន្នន័យចំណូលចំណាយរបស់អ្នកនៅផ្នែកគ្រប់គ្រង។</p>
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
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang">
      {/* Header & Selector */}
      <div className="bg-white dark:bg-slate-900 px-4 py-5 border-b border-gray-100 dark:border-slate-800 relative z-10 shadow-sm dark:shadow-none">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('records_title')}</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white py-3.5 px-4 rounded-[16px] font-semibold text-[13.5px] sm:text-[14px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
                  <span className="truncate">
                    {selectedPeriod ? `${selectedPeriod.name} (${selectedPeriod.date_range_text})` : 'ជ្រើសរើស...'}
                  </span>
                </div>
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
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      {periods.map((p, index) => {
                        const isClosed = index !== 0; // Assume first period (latest) is active, rest are closed
                        return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPeriod(p);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-orange-50 transition-colors flex items-center justify-between ${selectedPeriod?.id === p.id ? 'bg-orange-50/50 text-orange-600' : 'text-gray-700 dark:text-slate-300'}`}
                        >
                          <span className="font-medium text-[13.5px] sm:text-[14px] leading-relaxed pr-2 whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                            {p.name} {p.date_range_text ? `(${p.date_range_text})` : ''}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isClosed ? (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                                បញ្ជីបានបិទ
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap">
                                កំពុងប្រតិបត្តិការ
                              </span>
                            )}
                            {selectedPeriod?.id === p.id && (
                              <Check className="w-5 h-5 text-orange-500" />
                            )}
                          </div>
                        </button>
                      )})}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={handleDownload}
              disabled={isDownloading || isLoading || records.length === 0}
              className="flex items-center justify-center bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 w-12 h-12 rounded-2xl shadow-sm dark:shadow-none hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 flex-shrink-0 disabled:opacity-50"
              title="ទាញយកជារូបភាព"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>

            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-orange-500 text-white w-12 h-12 rounded-2xl shadow-sm dark:shadow-none hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('records_add_new')}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          {/* Previous Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-green-600 p-0.5">
                <ArrowDownCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_prev_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-green-600">{formatCurrency(previousBalance)}</p>
          </div>
          
          {/* Current Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-[#ea580c] p-0.5">
                <ArrowUpCircle className="w-4 h-4 text-[#ea580c]" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_current_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-[#ea580c]">{formatCurrency(currentBalance)}</p>
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
              ? 'bg-white dark:bg-slate-900 text-emerald-600 border border-gray-200 dark:border-slate-700/60 shadow-sm dark:shadow-none' 
              : 'bg-transparent text-zinc-400 dark:text-slate-500 hover:text-zinc-600'
          }`}
        >
          <ArrowDownCircle className={`w-4 h-4 ${activeTab === 'income' ? 'text-green-600' : ''}`} />
          {t('records_total_income')} ({formatCurrency(totalIncome)})
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'expense' 
              ? 'bg-white dark:bg-slate-900 text-rose-600 border border-gray-200 dark:border-slate-700/60 shadow-sm dark:shadow-none' 
              : 'bg-transparent text-zinc-400 dark:text-slate-500 hover:text-zinc-600'
          }`}
        >
          <ArrowUpCircle className={`w-4 h-4 ${activeTab === 'expense' ? 'text-rose-600' : ''}`} />
          {t('records_total_expense')} ({formatCurrency(totalExpense)})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 max-w-3xl mx-auto w-full">
        <div className="space-y-3 bg-[#FAFAFA] dark:bg-slate-950 p-4 -m-4 sm:p-6 sm:-m-6 rounded-xl">
          <div className="hidden" />
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
                <div key={record.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-slate-800 text-[11px] font-semibold text-zinc-500 dark:text-slate-400">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white leading-tight">{record.description}</h3>
                    </div>
                    <span className={`font-bold text-[15px] ${activeTab === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {activeTab === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end text-[12px] text-zinc-400 dark:text-slate-500 mt-1 pl-8.5">
                    <span>{formatDate(record.record_date)}</span>
                    {record.note && (
                      <span className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-100 dark:border-slate-800 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[140px] text-zinc-500 dark:text-slate-400">
                        {record.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {(activeTab === 'income' ? incomeRecords : expenseRecords).length === 0 && (
                <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">
                  {activeTab === 'income' ? t('records_empty_income') : t('records_empty_expense')}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      {/* Hidden Report Container for Image Generation */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none">
        <div ref={reportRef} className="bg-white p-10 font-battambang text-gray-900 w-[800px] shadow-none">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h1 className="text-3xl mb-2 text-gray-900" style={{ fontFamily: 'Koulen, "Khmer OS Kulen", sans-serif' }}>វត្តវារីបាការាម (ស្នាយដួច)</h1>
            <h2 className="text-3xl font-moul mb-3 text-orange-600">របាយការណ៍បច្ច័យ</h2>
            <p className="text-xl font-bold">{selectedPeriod?.name} {selectedPeriod?.date_range_text ? `(${selectedPeriod.date_range_text})` : ''}</p>
          </div>

          {/* Previous Balance */}
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl mb-8">
            <span className="font-bold text-xl">បច្ច័យសល់ពីសីលមុន៖</span>
            <span className="font-bold text-xl">{formatCurrency(previousBalance)}</span>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Income Section */}
            <div className="flex flex-col">
              <h3 className="font-bold text-lg text-emerald-700 border-b-2 border-emerald-200 pb-2 mb-4">ប្រភពចំណូលបញ្ចី (+)</h3>
              <div className="space-y-3 mb-4 min-h-[200px] flex-1">
                {incomeRecords.length > 0 ? incomeRecords.map(r => (
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-100 pb-2">
                    <span className="pr-4">{r.description}</span>
                    <span className="text-emerald-700 font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</span>
                  </div>
                )) : <div className="text-gray-400 italic">មិនមានទិន្នន័យចំណូល</div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-200 bg-emerald-50 p-3 rounded-lg mt-auto">
                <span className="font-bold text-emerald-900">សរុបចំណូល៖</span>
                <span className="font-bold text-emerald-700 text-lg">{formatCurrency(totalIncome)}</span>
              </div>
            </div>

            {/* Expense Section */}
            <div className="flex flex-col">
              <h3 className="font-bold text-lg text-rose-700 border-b-2 border-rose-200 pb-2 mb-4">ប្រភពចំណាយបញ្ចី (-)</h3>
              <div className="space-y-3 mb-4 min-h-[200px] flex-1">
                {expenseRecords.length > 0 ? expenseRecords.map(r => (
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-100 pb-2">
                    <span className="pr-4">{r.description}</span>
                    <span className="text-rose-700 font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</span>
                  </div>
                )) : <div className="text-gray-400 italic">មិនមានទិន្នន័យចំណាយ</div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-rose-200 bg-rose-50 p-3 rounded-lg mt-auto">
                <span className="font-bold text-rose-900">សរុបចំណាយ៖</span>
                <span className="font-bold text-rose-700 text-lg">{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* Current Balance */}
          <div className="flex justify-between items-center bg-orange-50 border-2 border-orange-500 p-6 rounded-2xl">
            <span className="font-bold text-2xl text-orange-900">បច្ច័យសល់ជាក់ស្ដែង៖</span>
            <span className="font-bold text-3xl text-orange-600">{formatCurrency(currentBalance)}</span>
          </div>
          
          {/* Footer Signature Area */}
          <div className="mt-16 flex justify-end px-12 text-center text-gray-900">
            <div className="flex flex-col items-center">
              <p className="mb-4 text-md font-medium">ធ្វើនៅ វត្តស្នាយដូច {getKhmerDate()}</p>
              <p className="mb-2 font-bold text-lg">អ្នកកាន់បញ្ជី</p>
              <div className="h-24 w-40 relative mb-2 flex items-center justify-center" style={{ backgroundImage: `url(${signBase64})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
              </div>
              <p className="font-moul text-lg">ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី</p>
            </div>
          </div>
        </div>
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
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl overflow-hidden max-w-lg mx-auto pb-safe flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('records_add_new_title')}</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 pb-24 overflow-y-auto">
                <form onSubmit={handleSaveRecord} className="space-y-4">
                  
                  {/* Type Toggle */}
                  <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setNewRecordType('income')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        newRecordType === 'income'
                          ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm dark:shadow-none'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {t('records_type_income')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRecordType('expense')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                        newRecordType === 'expense'
                          ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-sm dark:shadow-none'
                          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {t('records_type_expense')}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_description')}</label>
                    <input
                      type="text"
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={t('records_description_ph')}
                      className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_amount')}</label>
                    <input
                      type="text"
                      required
                      value={newAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewAmount(val ? parseInt(val, 10).toLocaleString('en-US') : '');
                      }}
                      placeholder={t('records_amount_ph')}
                      className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_date')}</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_note')}</label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder={t('records_note_ph')}
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                    <div className="flex-shrink-0">
                      <Bell className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">ជូនដំណឹងជាសាធារណៈ</h4>
                      <p className="text-[12px] text-gray-600 dark:text-gray-400">អ្នកគ្រប់គ្នានឹងទទួលបានការជូនដំណឹងពីទិន្នន័យនេះ</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={newNotifyPublic}
                        onChange={(e) => setNewNotifyPublic(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full mt-2 py-4 rounded-2xl bg-zinc-900 dark:bg-orange-600 text-white font-bold text-[15px] shadow-sm dark:shadow-none hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/50 disabled:opacity-70 flex justify-center items-center"
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

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-emerald-100 dark:border-emerald-900/30 p-4 flex items-center gap-3 min-w-[320px] pointer-events-none"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-800 dark:text-emerald-300 font-bold text-[15px]">ជោគជ័យ!</p>
              <p className="text-emerald-600/80 dark:text-emerald-400/80 text-[13px] font-medium leading-snug">បានរក្សាទុករបាយការណ៍។ សូមចូលទៅកាន់ផ្ទាំងរបាយការណ៍ដើម្បីមើល។</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


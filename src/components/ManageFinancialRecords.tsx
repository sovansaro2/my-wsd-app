import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { ChevronDown, ArrowLeft, Plus, Edit2, Trash2, Loader2, X, FileText } from 'lucide-react';
import { LoadingScreen } from './ui/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';

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

interface ManageFinancialRecordsProps {
  onBack: () => void;
}

export default function ManageFinancialRecords({ onBack }: ManageFinancialRecordsProps) {
  const [periods, setPeriods] = useState<SeilPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<SeilPeriod | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Record Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  
  // Record Form State
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [note, setNote] = useState('');
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Delete Modal State
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Seil Modal State
  const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);
  const [seilName, setSeilName] = useState('');
  const [seilDateRange, setSeilDateRange] = useState('');
  const [seilPreviousBalance, setSeilPreviousBalance] = useState('');
  const [isSavingSeil, setIsSavingSeil] = useState(false);

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
        if (!selectedPeriod) setSelectedPeriod(data[0]);
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

  const openAddRecordModal = () => {
    setEditingRecord(null);
    setRecordType('expense');
    setDescription('');
    setAmount('');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsRecordModalOpen(true);
  };

  const openEditRecordModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setRecordType(record.type);
    setDescription(record.description);
    setAmount(record.amount.toString());
    setRecordDate(record.record_date || '');
    setNote(record.note || '');
    setIsRecordModalOpen(true);
  };

  const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod || !description || !amount) return;

    setIsSavingRecord(true);
    try {
      const recordData = {
        seil_id: selectedPeriod.id,
        type: recordType,
        description,
        amount: parseFloat(amount.replace(/,/g, '')),
        record_date: recordDate || null,
        note: note || null
      };

      if (editingRecord) {
        await api.updateFinancialRecord(editingRecord.id, recordData);
        
      } else {
        await api.createFinancialRecord(recordData);
        
      }

      setIsRecordModalOpen(false);
      fetchRecords(selectedPeriod.id);
    } catch (error) {
      console.error('Error saving record:', error);
      setErrorMessage('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ: ' + (error.message || ''));
    } finally {
      setIsSavingRecord(false);
    }
  };

  const confirmDelete = (id: string) => {
    setRecordToDelete(id);
  };

  const executeDelete = async () => {
    if (!recordToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.deleteFinancialRecord(recordToDelete);
      
      
      if (selectedPeriod) fetchRecords(selectedPeriod.id);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      setErrorMessage('មានបញ្ហាក្នុងការលុបទិន្នន័យ');
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddSeilModal = () => {
    // Attempt to calculate carry over balance
    let prevBal = 0;
    if (periods.length > 0) {
      const latestSeil = periods[0];
      const incomes = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
      const expenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
      prevBal = latestSeil.previous_balance + incomes - expenses;
    }

    setSeilName('');
    setSeilDateRange('');
    setSeilPreviousBalance(prevBal > 0 ? prevBal.toString() : '');
    setIsSeilModalOpen(true);
  };

  const saveSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seilName) return;

    setIsSavingSeil(true);
    try {
      const data = await api.createSeilPeriod({ name: seilName, date_range_text: seilDateRange || null, previous_balance: parseFloat(seilPreviousBalance || '0') });
        
      
      
      setIsSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (error) {
      console.error('Error saving seil:', error);
      setErrorMessage('មានបញ្ហាក្នុងការបង្កើតបញ្ជីសីលថ្មី');
    } finally {
      setIsSavingSeil(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('km-KH').format(amount) + '៛';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] pb-2 font-battambang relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/60 px-4 py-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-zinc-900 text-xl tracking-tight">គ្រប់គ្រងបញ្ជី</h2>
        </div>
        <button 
          onClick={openAddSeilModal}
          className="text-[13px] font-semibold text-zinc-700 bg-zinc-100 px-3.5 py-1.5 rounded-full hover:bg-zinc-200 transition-colors uppercase tracking-wide"
        >
          + សីលថ្មី
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-1">
          <LoadingScreen className="h-64 bg-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full">
          {periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-[15px]">មិនទាន់មានបញ្ជីសីលនៅឡើយទេ</p>
              <button 
                onClick={openAddSeilModal}
                className="mt-6 px-6 py-2.5 bg-zinc-900 text-white rounded-full font-semibold text-[15px] shadow-sm hover:bg-zinc-800 transition-colors"
              >
                បង្កើតសីលដំបូង
              </button>
            </div>
          ) : (
            <>
              {/* Period Selector */}
              <div className="p-4 sm:p-6 pb-2">
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white border border-gray-200/60 text-zinc-900 py-3.5 px-4 rounded-xl font-semibold text-[15px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 shadow-sm"
                    value={selectedPeriod?.id || ''}
                    onChange={(e) => {
                      const p = periods.find(x => x.id === e.target.value);
                      if (p) setSelectedPeriod(p);
                    }}
                  >
                    {periods.map((p, index) => {
                      const isClosed = index !== 0;
                      return (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.date_range_text ? `(${p.date_range_text})` : ''} - {isClosed ? 'បញ្ជីបានបិទ' : 'កំពុងប្រតិបត្តិការ'}
                      </option>
                    )})}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-zinc-400" />
                </div>
              </div>

              {/* Records List */}
              <div className="px-4 sm:px-6 pb-28 space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${record.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <h3 className="font-semibold text-zinc-900 text-[15px] leading-tight truncate">{record.description}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-zinc-500 pl-4">
                        <span className={`font-bold ${record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                        </span>
                        {record.record_date && <span>• {formatDate(record.record_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => openEditRecordModal(record)}
                        className="p-2 text-zinc-400 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors focus:outline-none"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(record.id)}
                        className="p-2 text-zinc-400 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors focus:outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {records.length === 0 && (
                  <div className="text-center py-12 text-zinc-400 text-[15px]">
                    មិនមានទិន្នន័យក្នុងសីលនេះទេ
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      {periods.length > 0 && !isLoading && (
        <button 
          onClick={openAddRecordModal}
          className="absolute bottom-6 right-6 sm:right-[calc(50%-23rem)] w-14 h-14 bg-zinc-900 text-white rounded-full shadow-[0_4px_14px_0_rgba(24,24,27,0.39)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Record Form Modal */}
      <AnimatePresence>
      {isRecordModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsRecordModalOpen(false)}
          className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100/60">
              <h3 className="font-bold text-lg text-zinc-900">{editingRecord ? 'កែប្រែទិន្នន័យ' : 'បន្ថែមទិន្នន័យថ្មី'}</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveRecord} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div className="flex bg-zinc-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRecordType('income')}
                  className={`flex-1 py-2.5 text-[15px] font-semibold rounded-xl transition-all ${recordType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  ចំណូល
                </button>
                <button
                  type="button"
                  onClick={() => setRecordType('expense')}
                  className={`flex-1 py-2.5 text-[15px] font-semibold rounded-xl transition-all ${recordType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  ចំណាយ
                </button>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">បរិយាយ (ឈ្មោះ/មុខទំនិញ)</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ឧ. លោកយាយ ក, ទិញទឹកសុទ្ធ..."
                  className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">ចំនួនទឹកប្រាក់ (រៀល)</label>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ឧ. 100000"
                  className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">កាលបរិច្ឆេទ</label>
                  <input 
                    type="date" 
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">ចំណាំផ្សេងៗ</label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="មិនចាំបាច់ក៏បាន"
                    className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSavingRecord}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm text-[15px]"
                >
                  {isSavingRecord ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុក'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Seil Form Modal */}
      <AnimatePresence>
      {isSeilModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSeilModalOpen(false)}
          className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100/60">
              <h3 className="font-bold text-lg text-zinc-900">បង្កើតបញ្ជីសីលថ្មី</h3>
              <button onClick={() => setIsSeilModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveSeil} className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">ឈ្មោះសីល</label>
                <input 
                  type="text" 
                  required
                  value={seilName}
                  onChange={(e) => setSeilName(e.target.value)}
                  placeholder="ឧ. សីលទី១០"
                  className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">រយៈពេលសីល</label>
                <input 
                  type="text" 
                  value={seilDateRange}
                  onChange={(e) => setSeilDateRange(e.target.value)}
                  placeholder="ឧ. ១៣.សីហា-២៥.សីហា"
                  className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">ប្រាក់នៅសល់ពីមុន (រៀល)</label>
                <input 
                  type="number" 
                  value={seilPreviousBalance}
                  onChange={(e) => setSeilPreviousBalance(e.target.value)}
                  placeholder="ឧ. 3129500"
                  className="w-full bg-zinc-50 border border-gray-200/60 rounded-2xl px-4 py-3.5 text-[15px] focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 transition-all font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-2 font-medium">*ប្រាក់ដើមនឹងទាញយកស្វ័យប្រវត្តិពីសីលមុន បើសិនជាមាន</p>
              </div>
              <div className="pt-2 pb-8 sm:pb-2">
                <button 
                  type="submit" 
                  disabled={isSavingSeil}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-70 active:scale-[0.98] shadow-sm text-[15px]"
                >
                  {isSavingSeil ? <Loader2 className="w-5 h-5 animate-spin" /> : 'បង្កើតសីល'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Error Message Toast */}
      <AnimatePresence>
      {errorMessage && (
        <motion.div 
          initial={{ y: -50, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: -50, opacity: 0, x: "-50%" }}
          className="fixed top-4 left-1/2 z-[200] bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 text-[14px] font-semibold"
        >
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="p-1.5 hover:bg-rose-700 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
      {recordToDelete && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setRecordToDelete(null)}
          className="fixed inset-0 z-[150] bg-zinc-900/40 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
          >
            <h3 className="text-[18px] font-bold text-zinc-900 mb-2.5">បញ្ជាក់ការលុប</h3>
            <p className="text-[15px] text-zinc-500 mb-8 leading-relaxed">តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ? ទិន្នន័យដែលលុបហើយមិនអាចយកមកវិញបានទេ។</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-2xl font-semibold transition-colors disabled:opacity-50 text-[15px]"
              >
                បោះបង់
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50 text-[15px] shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'លុប'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

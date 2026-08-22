import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { ChevronDown, ArrowLeft, Plus, Edit2, Trash2, Loader2, X, FileText, Bell } from 'lucide-react';
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
  const [notifyPublic, setNotifyPublic] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Delete Modal State
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Seil Modal State
  const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);
  const [isEditSeilModalOpen, setIsEditSeilModalOpen] = useState(false);
  const [editingSeil, setEditingSeil] = useState<SeilPeriod | null>(null);
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
    setNotifyPublic(false);
    setIsRecordModalOpen(true);
  };

  const openEditRecordModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setRecordType(record.type);
    setDescription(record.description);
    setAmount(record.amount.toString());
    setRecordDate(record.record_date || '');
    setNote(record.note || '');
    setNotifyPublic(false); // Notifications usually only on create, or optional on edit
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
        note: note || null,
        ...(notifyPublic && !editingRecord ? { notify_public: true, seil_name: selectedPeriod.name } : {})
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

  
  const openEditSeilModal = () => {
    if (!selectedPeriod) return;
    setEditingSeil(selectedPeriod);
    setSeilName(selectedPeriod.name);
    setSeilDateRange(selectedPeriod.date_range_text || '');
    setSeilPreviousBalance(selectedPeriod.previous_balance.toString());
    setIsEditSeilModalOpen(true);
  };

  const handleUpdateSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeil || !seilName) return;
    setIsSavingSeil(true);
    try {
      const data = await api.updateSeilPeriod(editingSeil.id, {
        name: seilName,
        date_range_text: seilDateRange || null,
        previous_balance: parseFloat(seilPreviousBalance || '0')
      });
      setIsEditSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSavingSeil(false);
    }
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
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-2 font-battambang relative">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/60 px-4 py-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-none dark:shadow-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:bg-slate-800 text-zinc-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-zinc-900 dark:text-white text-xl tracking-tight">គ្រប់គ្រងបញ្ជី</h2>
        </div>
        <button 
          onClick={openAddSeilModal}
          className="text-[13px] font-semibold text-zinc-700 bg-zinc-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full hover:bg-zinc-200 transition-colors uppercase tracking-wide"
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
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-slate-500">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-[15px]">មិនទាន់មានបញ្ជីសីលនៅឡើយទេ</p>
              <button 
                onClick={openAddSeilModal}
                className="mt-6 px-6 py-2.5 bg-zinc-900 dark:bg-orange-600 text-white rounded-full font-semibold text-[15px] shadow-none dark:shadow-none hover:bg-zinc-800 transition-colors"
              >
                បង្កើតសីលដំបូង
              </button>
            </div>
          ) : (
            <>
              {/* Period Selector */}
              <div className="p-4 sm:p-6 pb-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                  <select 
                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/60 text-zinc-900 dark:text-white py-3.5 px-4 rounded-xl font-semibold text-[15px] outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 shadow-none dark:shadow-none"
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
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-zinc-400 dark:text-slate-500" />
                  </div>
                  <button onClick={openEditSeilModal} className="flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/60 w-[52px] rounded-xl text-zinc-500 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Records List */}
              <div className="px-4 sm:px-6 pb-28 space-y-3">
                {records.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">មិនមានទិន្នន័យ</div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-none overflow-hidden mt-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-[12px] sm:text-[13px] font-bold">
                            <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">បរិយាយ</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap text-right border border-gray-300 dark:border-slate-700">ថវិកា</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-16 sm:w-24 text-right whitespace-nowrap border border-gray-300 dark:border-slate-700">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody >
                          {records.map((record) => (
                            <tr
                              key={record.id}
                              className="odd:bg-white even:bg-slate-50/80 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                              <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                                <div className="flex flex-col justify-center">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${record.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                      {record.description}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 pl-4">{formatDate(record.record_date)}</span>
                                  {record.note && (
                                    <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 pl-4 line-clamp-1">
                                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                      {record.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                                <span className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap ${record.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openEditRecordModal(record)}
                                    className="p-1 sm:p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Edit2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="p-1 sm:p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      {!loading && !error && selectedPeriod && (
        <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-6 z-40">
          <button 
            onClick={openAddRecordModal}
            className="w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30 transition-all active:scale-95 focus:outline-none"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isSeilModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSeilModalOpen(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-200 dark:border-slate-800">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  កែប្រែឈ្មោះសីល
                </h3>
                <button 
                  onClick={() => setIsSeilModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះសីល (ឧ. សីល ៨រោច)
                  </label>
                  <input
                    type="text"
                    value={seilName}
                    onChange={(e) => setSeilName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលឈ្មោះសីល..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    កាលបរិច្ឆេទ (ឧ. ១៤ កុម្ភៈ ២០២៥)
                  </label>
                  <input
                    type="text"
                    value={seilDateRange}
                    onChange={(e) => setSeilDateRange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលកាលបរិច្ឆេទ..."
                  />
                </div>
              </div>

              <div className="p-5 pt-2 bg-gray-50 dark:bg-slate-800/30 flex gap-3">
                <button
                  onClick={() => setIsSeilModalOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveSeil}
                  disabled={!seilName.trim()}
                  className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 focus:outline-none flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  រក្សាទុក
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isRecordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRecordModalOpen(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-200 dark:border-slate-800">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  {editingRecord ? 'កែប្រែទិន្នន័យ' : 'បញ្ចូលទិន្នន័យថ្មី'}
                </h3>
                <button 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-2">
                  <button
                    onClick={() => setRecordType('income')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${recordType === 'income' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    ចំណូលបញ្ចី (+)
                  </button>
                  <button
                    onClick={() => setRecordType('expense')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${recordType === 'expense' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-none' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    ចំណាយបញ្ចី (-)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    បរិយាយ
                  </label>
                  <input
                    type="text"
                    value={recordDesc}
                    onChange={(e) => setRecordDesc(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលបរិយាយ..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ចំនួនថវិកា (រៀល)
                  </label>
                  <input
                    type="number"
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                    placeholder="បញ្ចូលចំនួនថវិកា..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ចំណាំ (មិនចាំបាច់ក៏បាន)
                  </label>
                  <input
                    type="text"
                    value={recordNote}
                    onChange={(e) => setRecordNote(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="កំណត់សម្គាល់ផ្សេងៗ..."
                  />
                </div>
              </div>

              <div className="p-5 pt-2 bg-gray-50 dark:bg-slate-800/30 flex gap-3">
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={!recordDesc.trim() || !recordAmount}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 focus:outline-none ${
                    recordType === 'income' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  រក្សាទុក
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

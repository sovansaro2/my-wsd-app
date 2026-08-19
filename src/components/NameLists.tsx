import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

import { Search, Plus, Edit2, Trash2, Loader2, ChevronDown, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';

interface ListCategory {
  id: string;
  name: string;
  description: string;
}

interface NameRecord {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  note: string | null;
  referrer: string | null;
}

export default function NameLists() {
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ListCategory | null>(null);
  const [records, setRecords] = useState<NameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NameRecord | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [referrer, setReferrer] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchRecords(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await api.getNameListCategories();
        
      
      
      if (data && data.length > 0) {
        setCategories(data);
        if (!selectedCategory) setSelectedCategory(data[0]);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecords = async (categoryId: string) => {
    try {
      const data = await api.getNameListRecords(categoryId);
        
      
      setRecords(data || []);
    } catch (e) {
      console.error('Error fetching records:', e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('km-KH').format(amount) + '៛';
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setName('');
    setAmount('');
    setNote('');
    setReferrer('');
    setIsRecordModalOpen(true);
  };

  const openEditModal = (record: NameRecord) => {
    setEditingRecord(record);
    setName(record.name);
    setAmount(record.amount.toString());
    setNote(record.note || '');
    setReferrer(record.referrer || '');
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!name.trim() || !amount.trim() || !selectedCategory) return;
    
    setIsSaving(true);
    try {
      const recordData = {
        category_id: selectedCategory.id,
        name: name.trim(),
        amount: parseFloat(amount),
        note: note.trim() || null,
        referrer: referrer.trim() || null,
      };

      if (editingRecord) {
        await api.updateNameListRecord(editingRecord.id, recordData);
        
      } else {
        await api.createNameListRecord(recordData);
        
      }

      await fetchRecords(selectedCategory.id);
      setIsRecordModalOpen(false);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?')) return;
    
    try {
      await api.deleteNameListRecord(id);
      
      if (selectedCategory) fetchRecords(selectedCategory.id);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('មានបញ្ហាក្នុងការលុបទិន្នន័យ');
    }
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.note && record.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (record.referrer && record.referrer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] pb-6 font-battambang relative">
      <div className="bg-white px-4 py-5 shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">បញ្ជីឈ្មោះ</h2>
          
          {/* Category Selector */}
          {categories.length > 0 && (
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 py-3.5 px-4 rounded-2xl font-semibold text-[15px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all truncate pr-10"
                value={selectedCategory?.id || ''}
                onChange={(e) => {
                  const cat = categories.find(c => c.id === e.target.value);
                  if (cat) setSelectedCategory(cat);
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="text-gray-900 bg-white">
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-gray-400" />
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="ស្វែងរកឈ្មោះ ឬទីកន្លែង..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-[15px] shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <LoadingScreen className="h-64 bg-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
          {/* Header Row: Date & Total */}
          <div className="flex items-center justify-between mb-4 px-1 border-b border-gray-200/60 pb-3">
            <div className="text-[13px] font-semibold text-zinc-500 uppercase tracking-widest">
              {selectedCategory?.description ? (
                <>កាលបរិច្ឆេទ៖ <span className="text-zinc-900">{selectedCategory.description}</span></>
              ) : (
                <span>សរុបទិន្នន័យ៖ {filteredRecords.length}</span>
              )}
            </div>
            {(selectedCategory?.name === 'លុយចងដៃខ្ចី' || selectedCategory?.name === 'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ' || selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១' || selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២') && (
              <div className="text-[13px] font-semibold text-zinc-500 uppercase tracking-widest">
                សរុប៖ <span className="text-zinc-900">{formatCurrency(totalAmount)}</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {filteredRecords.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-zinc-400 text-sm"
              >
                មិនមានទិន្នន័យនៅឡើយទេ
              </motion.div>
            ) : (
              filteredRecords.map((record, index) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={record.id} 
                  className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] border border-gray-100 relative flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >                  
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 text-[15px] leading-tight">{record.name}</h3>
                        <div className="font-bold text-zinc-900 text-[15px] mt-1">{formatCurrency(record.amount)}</div>
                        
                        {(record.note || record.referrer) && (
                          <div className="flex flex-col gap-1 mt-2">
                            {record.note && (
                              <div className="flex items-center gap-2 text-[12px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0"></span>
                                <span className="truncate">{record.note}</span>
                              </div>
                            )}
                            {record.referrer && (
                              <div className="flex items-center gap-2 text-[12px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                                <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                                <span className="truncate">តាមរយៈ៖ {record.referrer}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => openEditModal(record)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors focus:outline-none"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors focus:outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {selectedCategory?.name === 'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ' && filteredRecords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">បច្ច័យសរុប</span>
                <span className="font-bold text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">ចំណាយជាវកណ្ដឹង ៤ (មួយស្មើ 55$) សរុប</span>
                <span className="font-bold text-orange-800">890,000៛</span>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">បច្ច័យនៅសល់</span>
                <span className="font-bold text-green-700">{formatCurrency(totalAmount - 890000)}</span>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១' && filteredRecords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">សរុប</span>
                <span className="font-bold text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-blue-100/50 p-3 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-700">ចំណាយទិញព្រំ (១ដុំ 2m x 25m = ៤២ម៉ឺន) ២ដុំ អស់</span>
                   <span className="font-bold text-blue-800">840,000៛</span>
                </div>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២' && filteredRecords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">សរុប</span>
                <span className="font-bold text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      {selectedCategory && (
        <button
          onClick={openAddModal}
          className="fixed bottom-24 right-4 sm:right-auto sm:left-[50%] sm:ml-[160px] bg-orange-500 text-white p-4 rounded-full shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all z-40 flex items-center justify-center focus:outline-none"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add/Edit Modal (Bottom Sheet on Mobile) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="bg-white p-5 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-900">
                {editingRecord ? 'កែប្រែទិន្នន័យ' : 'បន្ថែមទិន្នន័យថ្មី'}
              </h3>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ឈ្មោះ
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="បញ្ចូលឈ្មោះ..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ចំនួនទឹកប្រាក់ (រៀល)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឧ. 100000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ផ្សេងៗ / ទីកន្លែង (មិនចាំបាច់)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឧ. ភ្នំពេញ..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  អ្នកណែនាំ / តាមរយៈ (មិនចាំបាច់)
                </label>
                <input
                  type="text"
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="បញ្ចូលឈ្មោះអ្នកណែនាំ..."
                />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 pb-10 sm:pb-5">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="flex-1 py-3.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-[15px] hover:bg-gray-50 transition-colors focus:outline-none"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={isSaving || !name.trim() || !amount.trim()}
                className="flex-1 py-3.5 px-4 bg-orange-500 text-white rounded-2xl font-bold text-[15px] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>រក្សាទុក</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


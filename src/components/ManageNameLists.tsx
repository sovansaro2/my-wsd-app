import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';
import { LoadingScreen } from './ui/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';

interface ListCategory {
  id: string;
  name: string;
  description: string | null;
}

interface ManageNameListsProps {
  onBack: () => void;
}

export default function ManageNameLists({ onBack }: ManageNameListsProps) {
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListCategory | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getNameListCategories();

      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: ListCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setIsModalOpen(true);
  };


  const handleSaveCategory = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    
    try {
      const catData = {
        name: name.trim(),
        description: description.trim() || null
      };

      if (editingCategory) {
        await api.updateNameListCategory(editingCategory.id, catData);
      } else {
        await api.createNameListCategory(catData);
      }
      
      await fetchCategories();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(`Error: ${error.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបបញ្ជីនេះមែនទេ? ទិន្នន័យទាំងអស់ក្នុងបញ្ជីនេះនឹងត្រូវលុបចោល!')) return;
    try {
      await api.deleteNameListCategory(id);
      await fetchCategories();
    } catch (err) {
      alert('Error deleting');
    }
  };
return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang relative">
      <div className="bg-white dark:bg-slate-900 text-zinc-900 dark:text-white p-4 sm:p-6 shadow-sm dark:shadow-none border-b border-gray-100 dark:border-slate-800 z-10 sticky top-0 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 p-2 hover:bg-zinc-100 dark:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </button>
          <h2 className="text-xl font-bold tracking-tight">គ្រប់គ្រងបញ្ជីផ្សេងៗ</h2>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-orange-600 hover:bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 shadow-sm dark:shadow-none"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">បន្ថែមបញ្ជី</span>
          <span className="sm:hidden">បន្ថែម</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <LoadingScreen className="h-64 bg-transparent" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">មិនមានបញ្ជីនៅឡើយទេ</div>
          ) : (
            categories.map((cat, index) => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none border border-gray-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-semibold bg-zinc-100 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-white text-[15px] leading-tight">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-[12px] text-zinc-500 dark:text-slate-400 mt-1.5 bg-zinc-50 dark:bg-slate-800/50 inline-block px-2 py-0.5 rounded-md border border-zinc-100 dark:border-slate-800">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-auto shrink-0">
                  <button 
                    onClick={() => openEditModal(cat)}
                    className="p-2 text-zinc-400 dark:text-slate-500 bg-zinc-50 dark:bg-slate-800/50 hover:bg-zinc-100 dark:bg-slate-800 hover:text-zinc-900 dark:text-white rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-zinc-400 dark:text-slate-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-zinc-900 dark:bg-orange-600/40 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800/60">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  {editingCategory ? 'កែប្រែបញ្ជី' : 'បន្ថែមបញ្ជីថ្មី'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-zinc-400 dark:text-slate-500 hover:bg-zinc-100 dark:bg-slate-800 hover:text-zinc-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    ឈ្មោះបញ្ជី
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700/60 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 focus:bg-white dark:focus:bg-slate-900 transition-all text-[15px]"
                    placeholder="ឧ. បញ្ជីឈ្មោះបុណ្យផ្កា..."
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    ចំណាំ (កាលបរិច្ឆេទ)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700/60 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 focus:bg-white dark:focus:bg-slate-900 transition-all text-[15px]"
                    placeholder="ឧ. ០១ មករា ២០២៤"
                  />
                </div>
              </div>
              
              <div className="p-5 flex gap-3 pb-8 sm:pb-5">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 px-4 bg-zinc-50 dark:bg-slate-800/50 hover:bg-zinc-100 dark:bg-slate-800 text-zinc-700 rounded-xl font-semibold text-[15px] transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={isSaving || !name.trim()}
                  className="flex-1 py-3.5 px-4 bg-zinc-900 dark:bg-orange-600 text-white rounded-xl font-semibold text-[15px] hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm dark:shadow-none"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>រក្សាទុក</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiClient';

import { Search, Plus, Pencil, Star, Edit2, Trash2, Loader2, ChevronDown, FileText, X, Check, Bell, Award, Download, Share2, Flower, Wallet, Hammer, Coins, Map, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { toPng } from 'html-to-image';
import { saveCertificate } from '../lib/certificateUtils';
import { getImageDataUrl } from '../lib/utils';

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
  is_100k_donor?: boolean;
}

export default function NameLists({ userRole, onManageNameLists }: { userRole?: 'admin' | 'user' | null, onManageNameLists?: () => void }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ListCategory | null>(null);
  const [records, setRecords] = useState<NameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NameRecord | null>(null);
  const [certificateRecord, setCertificateRecord] = useState<NameRecord | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [referrer, setReferrer] = useState('');
  const [notifyPublic, setNotifyPublic] = useState(false);
  const [is100kDonor, setIs100kDonor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Image States
  const [logoDataUrl, setLogoDataUrl] = useState<string>('/logo.png');
  const [signDataUrl, setSignDataUrl] = useState<string>('/Sign.png');

  useEffect(() => {
    fetchCategories();
    getImageDataUrl('/logo.png').then(setLogoDataUrl);
    getImageDataUrl('/Sign.png').then(setSignDataUrl);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchRecords(selectedCategory.id);
    }
  }, [selectedCategory]);

  const openAddCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: ListCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setIsCatModalOpen(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setIsSavingCat(true);
    try {
      if (editingCategory) {
        const data = await api.updateListCategory(editingCategory.id, { name: catName, description: catDesc });
        if (data && selectedCategory?.id === editingCategory.id) {
          setSelectedCategory(data);
        }
      } else {
        await api.createListCategory({ name: catName, description: catDesc });
      }
      setIsCatModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setIsSavingCat(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getNameListCategories();
        
      
      
      if (data && data.length > 0) {
        setCategories(data);
        // Do not auto-select category anymore, user starts in Grid view.
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
    setNotifyPublic(false);
    setIs100kDonor(false);
    setIsRecordModalOpen(true);
  };

  const toggleHighLevel = async (record: NameRecord) => {
    try {
      const newValue = !record.is_100k_donor;
      await api.updateNameListRecord(record.id, { is_100k_donor: newValue });
      setRecords(records.map(r => r.id === record.id ? { ...r, is_100k_donor: newValue } : r));
    } catch (err) {
      console.error('Error toggling high level:', err);
    }
  };

  const openEditModal = (record: NameRecord) => {
    setEditingRecord(record);
    setName(record.name);
    setAmount(record.amount.toString());
    setNote(record.note || '');
    setReferrer(record.referrer || '');
    setNotifyPublic(false);
    setIs100kDonor(record.is_100k_donor || false); // Notifications usually only on create, or optional on edit
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
        is_100k_donor: is100kDonor,
        ...(notifyPublic && !editingRecord ? { notify_public: true, category_name: selectedCategory.name } : {})
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
      alert(t('list_alert_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm(t('list_alert_delete'))) return;
    
    try {
      await api.deleteNameListRecord(id);
      
      if (selectedCategory) fetchRecords(selectedCategory.id);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert(t('list_alert_del_error'));
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificateRef.current || !certificateRecord) return;
    setIsDownloading(true);
    try {
      const images = Array.from(certificateRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 2,
        
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: '0',
          
        }
      });
      
      try {
        const blob = await (await fetch(dataUrl)).blob();
        
        await saveCertificate({
          title: certificateRecord.name,
          type: 'image/png',
          blob: blob
        });
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } catch (e) {
        // Fallback for download
        const link = document.createElement('a');
        link.download = `${certificateRecord.name}.png`;
        link.href = dataUrl;
        link.click();
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }
    } catch (err) {
      console.error('Error downloading certificate', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareCertificate = async () => {
    if (!certificateRef.current || !certificateRecord) return;
    setIsDownloading(true);
    try {
      const images = Array.from(certificateRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 2,
        
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: '0',
          
        }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `អនុមោទនាប័ត្រ_${certificateRecord.name}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'អនុមោទនាប័ត្រ',
          files: [file]
        });
      } else {
        alert('មុខងារចែករំលែកមិនដំណើរការលើកម្មវិធីរុករកនេះទេ។');
      }
    } catch (err) {
      console.error('Error sharing certificate', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.note && record.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
  const closedLists = ['បញ្ជីឈ្មោះបុណ្យផ្កា', 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ', 'ទិញកម្រាលព្រំ (វគ្គ១)'];
  const isListClosed = closedLists.includes(selectedCategory?.name || '');


  const getCategoryIcon = (name: string) => {
    if (name.includes('បុណ្យផ្កា')) return <Flower className="w-6 h-6 text-pink-500" />;
    if (name.includes('កណ្ដឹង')) return <Bell className="w-6 h-6 text-amber-500" />;
    if (name.includes('កម្រាលព្រំ')) return <Map className="w-6 h-6 text-purple-500" />;
    if (name.includes('លុយជាង')) return <Hammer className="w-6 h-6 text-orange-500" />;
    if (name.includes('ចងដៃ')) return <Coins className="w-6 h-6 text-emerald-500" />;
    return <FileText className="w-6 h-6 text-blue-500" />;
  };

  const getCategoryStatus = (name: string | undefined) => {
    if (!name) return null;
    let statusText = '';
    let statusClass = '';
    if (name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ២' || name === 'លុយជាងដក' || name === 'បញ្ជីឈ្មោះកសាងព្រះវិហារ' || name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ') {
      statusText = 'កំពុងប្រតិបត្តិការ';
      statusClass = 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    } else if (name === 'ឈ្មោះអ្នកទិញកម្រាលព្រំ វគ្គ១' || name === 'ឈ្មោះអ្នកទិញកណ្ដឹងដាក់ព្រះវិហារ' || name === 'បញ្ជីឈ្មោះបុណ្យផ្កា') {
      statusText = 'បានបញ្ចប់';
      statusClass = 'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-slate-400 border-zinc-200 dark:border-slate-700';
    }
    
    if (statusText) {
      return (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 w-fit ${statusClass}`}>
          {statusText}
        </span>
      );
    }
    return null;
  };



  if (!selectedCategory) {
    const roofCat = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
    const generalCats = categories.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');

    return (
      <>
            <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang overflow-y-auto">
        <div className="bg-white dark:bg-slate-950 px-4 py-5 shadow-none dark:shadow-none border-b border-gray-200 dark:border-slate-800 z-10 sticky top-0">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">បញ្ជីផ្សេងៗ</h2>
            {userRole === 'admin' && (
              <button 
                onClick={openAddCatModal}
                className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        <div className="px-4 py-6 max-w-3xl mx-auto w-full">
          {roofCat && (
            <div className="mb-8">
              <h3 className="text-[14px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                គម្រោងពិសេស
              </h3>
              <button 
                onClick={() => setSelectedCategory(roofCat)}
                className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 relative overflow-hidden transition-transform active:scale-95"
              >
                {userRole === 'admin' && (
                  <div 
                    onClick={(e) => openEditCatModal(roofCat, e)}
                    className="absolute top-3 right-3 z-20 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </div>
                )}
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-1">{roofCat.name}</h4>
                    <p className="text-orange-50 text-sm opacity-90 line-clamp-1">{roofCat.description || 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'}</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div>
             <h3 className="text-[14px] font-bold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               បញ្ជីទូទៅ
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
               {generalCats.map(cat => (
                 <button 
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat)}
                   className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                 >
                   {userRole === 'admin' && (
                    <div 
                      onClick={(e) => openEditCatModal(cat, e)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  )}
                   <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 group-hover:bg-gray-100 dark:group-hover:bg-slate-700 rounded-full flex items-center justify-center mb-3 transition-colors">
                     {getCategoryIcon(cat.name)}
                   </div>
                   <h4 className="font-bold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white text-center text-[13px] sm:text-[14px] leading-snug line-clamp-2">
                     {cat.name}
                   </h4>
                 </button>
               ))}
               {generalCats.length === 0 && (
                 <div className="col-span-full py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                   មិនទាន់មានបញ្ជីនៅឡើយទេ
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Category Modals */}
      <AnimatePresence>
        {isCatModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCatModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden pointer-events-auto"
              >
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingCategory ? 'កែប្រែបញ្ជី' : 'បន្ថែមបញ្ជីថ្មី'}
                  </h3>
                  <button
                    onClick={() => setIsCatModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={saveCategory} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលឈ្មោះបញ្ជី"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ការពិពណ៌នា
                    </label>
                    <textarea
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm h-24 resize-none"
                      placeholder="បញ្ចូលការពិពណ៌នាបញ្ជី"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingCat}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingCat ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          រក្សាទុក
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      </>

    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang relative">
      <div className="bg-white dark:bg-slate-950 px-4 py-5 shadow-none dark:shadow-none border-b border-gray-200 dark:border-slate-800 z-10 sticky top-0">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          {/* Detail View Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate flex-1 leading-tight">
              {selectedCategory?.name}
            </h2>
            
            {userRole === 'admin' && !isListClosed && (
              <button 
                onClick={openAddModal}
                className="flex items-center justify-center bg-orange-500 text-white w-10 h-10 rounded-xl shadow-none dark:shadow-none hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('list_add_new')}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('list_search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-[15px] shadow-inner"
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
          <div className="flex items-center justify-between mb-4 px-1 border-b border-gray-200 dark:border-slate-700/60 pb-3">
            <div className="text-[13px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">
              {selectedCategory?.description ? (
                <>{t('list_date')}៖ <span className="text-zinc-900 dark:text-white">{selectedCategory.description}</span></>
              ) : (
                <span>{t('list_total_records')}៖ {filteredRecords.length}</span>
              )}
            </div>
            {(selectedCategory?.name === 'លុយចងដៃខ្ចី' || selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' || selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ' || selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)' || selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)') && (
              <div className="text-[13px] font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">
                {t('list_total_amount')}៖ <span className="text-zinc-900 dark:text-white">{formatCurrency(totalAmount)}</span>
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
                className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm"
              >
                {t('list_empty')}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-none overflow-hidden mt-2"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-[12px] sm:text-[13px] font-bold">
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-8 sm:w-12 text-center whitespace-nowrap border border-gray-300 dark:border-slate-700">ល.រ</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">ឈ្មោះសប្បុរសជន</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap text-right border border-gray-300 dark:border-slate-700">ថវិកា</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-20 sm:w-28 text-right whitespace-nowrap border border-gray-300 dark:border-slate-700">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody >
                      <AnimatePresence>
                        {filteredRecords.map((record, index) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={record.id}
                            className="odd:bg-white even:bg-slate-50/80 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors group"
                          >
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center align-middle border border-gray-200 dark:border-slate-700">
                              <span className="text-[12px] font-semibold text-gray-500 dark:text-slate-400 inline-block">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                              <div className="flex flex-col justify-center">
                                <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                  {record.name}
                                </span>
                                {record.note && (
                                  <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                    {record.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                              <span className="font-bold text-[14px] sm:text-[15px] text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                {formatCurrency(record.amount)}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                              <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {selectedCategory?.name !== 'លុយជាងដក' && (
                                  <button 
                                    onClick={() => setCertificateRecord(record)}
                                    className="p-1 sm:p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors focus:outline-none"
                                    title="ប័ណ្ណអនុមោទនា"
                                  >
                                    <Award className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                )}
                                {userRole === 'admin' && !isListClosed && (
                                  <>
                                    <button 
                                      onClick={() => openEditModal(record)}
                                      className="p-1 sm:p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none"
                                    >
                                      <Edit2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="p-1 sm:p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors focus:outline-none"
                                    >
                                      <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className="font-bold text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className="font-bold text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">ចំណាយជាវកណ្ដឹង ៤ (មួយស្មើ 55$) សរុប</span>
                <span className="font-bold text-orange-800">890,000៛</span>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">បច្ច័យនៅសល់</span>
                <span className="font-bold text-green-700">{formatCurrency(totalAmount - 890000)}</span>
              </div>
            </div>
          )}

                    {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className="font-bold text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-blue-100/50 p-3 flex flex-col gap-1 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-700 dark:text-slate-300">ចំណាយទិញព្រំ (១ដុំ 2m x 25m = ៤២ម៉ឺន) ២ដុំ អស់</span>
                   <span className="font-bold text-blue-800">840,000៛</span>
                </div>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">បច្ច័យនៅសល់</span>
                <span className="font-bold text-green-700">{formatCurrency(totalAmount - 840000)}</span>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">សរុប</span>
                <span className="font-bold text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal (Bottom Sheet on Mobile) */}
      <AnimatePresence>
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
            <div className="bg-white dark:bg-slate-900 p-5 flex justify-between items-center border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                {editingRecord ? `${t('list_edit_title')} - ${selectedCategory?.name}` : `${t('list_add_title')} - ${selectedCategory?.name}`}
              </h3>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="p-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 dark:text-slate-500 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('list_name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('list_name_ph')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {t('list_amount')}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val);
                        if (Number(val) >= 100000) setIs100kDonor(true);
                      }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('list_amount_ph')}
                />
              </div>
              

              



              {/* Checkbox for 100k Donor */}
              <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                <input 
                  type="checkbox" 
                  id="is100kDonor" 
                  checked={is100kDonor}
                  onChange={(e) => setIs100kDonor(e.target.checked)}
                  className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
                <label htmlFor="is100kDonor" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                  ✅ ថវិកាកម្រិតខ្ពស់
                </label>
              </div>

              {!editingRecord && (
                <div className="flex items-center gap-3 p-4 mt-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                  <div className="flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13px] sm:text-[14px] font-bold text-gray-900 dark:text-white">ជូនដំណឹងជាសាធារណៈ</h4>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400">អ្នកគ្រប់គ្នានឹងទទួលបានការជូនដំណឹងពីទិន្នន័យនេះ</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={notifyPublic}
                      onChange={(e) => setNotifyPublic(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex gap-3 pb-24 sm:pb-5">
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl font-bold text-[15px] hover:bg-gray-50 dark:bg-slate-800/50 transition-colors focus:outline-none"
              >
                {t('list_cancel')}
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={isSaving || !name.trim() || !amount.trim()}
                className="flex-1 py-3.5 px-4 bg-orange-500 text-white rounded-2xl font-bold text-[15px] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{t('list_save')}</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {certificateRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-100 rounded-2xl sm:rounded-3xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sm:rounded-t-3xl rounded-t-2xl shrink-0 z-10 relative">
                <h2 className="text-[16px] font-bold text-gray-900 font-battambang">លិខិតថ្លែងអំណរគុណ</h2>
                <button
                  onClick={() => setCertificateRecord(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#f0f2f5]">
                {/* Responsive scaling wrapper */}
                <div className="relative w-[340px] h-[240px] sm:w-[794px] sm:h-[559px] mx-auto shrink-0 transition-all duration-300 flex justify-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 origin-top scale-[0.42] sm:scale-100 shadow-xl">
                    {/* Certificate Container (Fixed A5 Landscape Size: 794x559 px) */}
                    <div 
                      ref={certificateRef}
                      className="w-[794px] h-[559px] bg-white flex flex-col p-6 sm:p-8 border-[12px] border-orange-50/50 relative"
                      style={{
                        backgroundColor: '#ffffff'
                      }}
                    >
                    {/* Decorative Borders */}
                  <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-orange-500/80"></div>
                  <div className="absolute top-[12px] left-[12px] right-[12px] bottom-[12px] border border-orange-300/60"></div>
                  
                  {/* Corner Ornaments */}
                  <div className="absolute top-1 left-1 w-10 h-10 border-t-4 border-l-4 border-orange-600"></div>
                  <div className="absolute top-1 right-1 w-10 h-10 border-t-4 border-r-4 border-orange-600"></div>
                  <div className="absolute bottom-1 left-1 w-10 h-10 border-b-4 border-l-4 border-orange-600"></div>
                  <div className="absolute bottom-1 right-1 w-10 h-10 border-b-4 border-r-4 border-orange-600"></div>

                  <div className="relative z-10 flex flex-col h-full text-center px-4 py-0 justify-between">
                    {/* Header */}
                    <div className="relative mb-2 mt-2 w-full flex justify-center">
                      {/* Logo & Temple Name - Top Left */}
                      <div className="absolute left-2 -top-1 flex flex-col items-center">
                         <div 
                           className="w-[65px] h-[65px] mb-1 drop-shadow-none"
                           style={{
                             backgroundImage: `url(${logoDataUrl})`,
                             backgroundSize: 'contain',
                             backgroundPosition: 'center',
                             backgroundRepeat: 'no-repeat'
                           }}
                         />
                         <span className="text-[11px] font-moul text-orange-900 leading-tight mb-[2px]">វត្តវារីបាការាម</span>
                         <span className="text-[11px] font-moul text-orange-900 leading-tight">(ស្នាយដួច)</span>
                      </div>

                      {/* Title - Center */}
                      <div className="flex flex-col items-center pt-3">
                        <h1 className="text-[42px] text-orange-700 mb-2 drop-shadow-none leading-tight tracking-wide" style={{ fontFamily: '"Khmer OS Kulen", Koulen, cursive' }}>លិខិតថ្លែងអំណរគុណ</h1>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="h-[2px] bg-orange-400/50 w-20 rounded-full"></div>
                          <span className="text-orange-500 text-xl font-bold">៙ ❖ ៚</span>
                          <div className="h-[2px] bg-orange-400/50 w-20 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center justify-center flex-1 w-full text-gray-800 my-1">
                      <p className="text-[17px] font-battambang leading-snug mb-2 mt-4 text-orange-900">
                        អាត្មាភាព សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រោះចំពោះញោមម្ចាស់សទ្ធា៖
                      </p>
                      
                      <div className="px-6 py-1 mb-2 border-b border-dashed border-orange-400 min-w-[350px] max-w-[700px] flex justify-center">
                        <h3 
                          className="text-indigo-900 leading-tight pb-1 whitespace-nowrap" 
                          style={{ 
                            fontFamily: '"Khmer OS Kulen", Koulen, cursive',
                            fontSize: certificateRecord.name.length > 40 ? '22px' : certificateRecord.name.length > 30 ? '26px' : certificateRecord.name.length > 20 ? '32px' : '40px'
                          }}
                        >
                          {certificateRecord.name}
                        </h3>
                      </div>
                      
                      <p className="text-[16px] font-battambang leading-snug max-w-[650px] mx-auto text-gray-700">
                        ដែលបានចូលរួមបរិច្ចាគបច្ច័យចំនួន <span className="font-bold text-orange-700 text-xl mx-1">{formatCurrency(certificateRecord.amount)}</span> 
                        {selectedCategory?.name && (
                          <span> ផ្នែក <span className="font-bold text-indigo-800">"{selectedCategory.name}"</span></span>
                        )}
                        <br/>ដើម្បីចូលរួមកសាងទីអារាម និងទ្រទ្រង់វិស័យព្រះពុទ្ធសាសនា។
                      </p>

                      {/* Blessing */}
                      <p className="text-[14px] font-battambang italic leading-snug max-w-[700px] mx-auto text-gray-600 mt-3 px-4">
                        សូមបួងសួងដល់គុណព្រះរតនត្រ័យ និងវត្ថុស័ក្តិសិទ្ធិក្នុងលោក សូមជួយប្រោះព្រំសព្ទសាធុការពរជ័យ បវរសួស្ដី សិរីមង្គល វិបុលសុខ មហាប្រសើរ ជូនដល់ម្ចាស់ទាន ព្រមទាំងក្រុមគ្រួសារ សូមប្រកបដោយពុទ្ធពរទាំង ៤ ប្រការគឺ អាយុ វណ្ណៈ សុខៈ និងពលៈ កុំបីឃ្លៀងឃ្លាតឡើយ។
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="w-full flex justify-between items-end px-8 mb-2">
                      <div className="text-left pb-2">
                        <p className="text-[15px] font-medium text-gray-800 font-battambang">{getKhmerDate()}</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[15px] text-gray-800 font-battambang font-bold mb-1">ព្រះចៅអធិការស្ដីទី</p>
                        <div className="h-[60px] w-[140px] flex items-center justify-center opacity-95 mix-blend-multiply border-b border-gray-200 border-dotted pb-1">
                          <div 
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${signDataUrl})`,
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 sm:p-6 bg-white border-t border-gray-200 shrink-0 flex gap-3 z-10 relative shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
                <button
                  onClick={handleShareCertificate}
                  disabled={isDownloading}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-[14px] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 focus:outline-none"
                >
                  <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span>ចែករំលែក</span>
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="flex-[2] py-3 px-4 bg-orange-500 text-white rounded-xl font-bold text-[14px] hover:bg-orange-600 shadow-none shadow-orange-500/20 transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      <span>ទាញយករូបភាព</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-3"
          >
            <div className="bg-emerald-500 rounded-full p-1">
              <Check className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
            </div>
            <span className="font-medium text-sm font-battambang">រក្សាទុកបានជោគជ័យ</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


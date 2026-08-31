import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/apiClient';

import { Search, Plus, Pencil, Star, Edit2, Trash2, Loader2, ChevronDown, FileText, X, Check, Bell, Award, Download, Share2, Flower, Wallet, Hammer, Coins, Map as MapIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { toPng } from 'html-to-image';
import { saveCertificate } from '../lib/certificateUtils';
import { getImageDataUrl } from '../lib/utils';
import { jsPDF } from "jspdf";

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
  metadata?: any;
}

export default function NameLists({ userRole, onManageNameLists }: { userRole?: 'admin' | 'user' | null, onManageNameLists?: () => void }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ListCategory | null>(null);
  const [records, setRecords] = useState<NameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [confirmingRecordDeleteId, setConfirmingRecordDeleteId] = useState<string | null>(null);
  const [confirmingCatDeleteId, setConfirmingCatDeleteId] = useState<string | null>(null);
  const [catErrorMessage, setCatErrorMessage] = useState('');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NameRecord | null>(null);
  const [certificateRecord, setCertificateRecord] = useState<NameRecord | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [referrer, setReferrer] = useState('');
  const [traiLiang, setTraiLiang] = useState('');
  const [others, setOthers] = useState('');
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
      setSearchQuery('');
      setShowSearchInput(false);
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

  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    if (confirmingCatDeleteId !== editingCategory.id) {
      setConfirmingCatDeleteId(editingCategory.id);
      return;
    }
    
    setIsSavingCat(true);
    setCatErrorMessage('');
    try {
      await api.deleteNameListCategory(editingCategory.id);
      if (selectedCategory?.id === editingCategory.id) {
        setSelectedCategory(null);
      }
      setIsCatModalOpen(false);
      setConfirmingCatDeleteId(null);
      fetchCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setCatErrorMessage(err.message || 'Error deleting category');
    } finally {
      setIsSavingCat(false);
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setIsSavingCat(true);
    try {
      if (editingCategory) {
        const data = await api.updateNameListCategory(editingCategory.id, { name: catName, description: catDesc });
        if (data && selectedCategory?.id === editingCategory.id) {
          setSelectedCategory(data);
        }
      } else {
        await api.createNameListCategory({ name: catName, description: catDesc });
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
    setTraiLiang('');
    setOthers('');
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
    setTraiLiang(record.metadata?.trai_liang || '');
    setOthers(record.metadata?.others || '');
    setNotifyPublic(false);
    setIs100kDonor(record.is_100k_donor || false); // Notifications usually only on create, or optional on edit
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async () => {
    const isKathinaList = selectedCategory?.name?.includes('កឋិន');
    if (!name.trim() || (!isKathinaList && !amount.trim()) || !selectedCategory) return;
    
    setIsSaving(true);
    try {
      const recordData = {
        category_id: selectedCategory.id,
        name: name.trim(),
        amount: parseFloat(amount) || 0,
        note: note.trim() || null,
        referrer: referrer.trim() || null,
        is_100k_donor: is100kDonor,
        metadata: {
            trai_liang: traiLiang.trim() || null,
            others: others.trim() || null
        },
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
    if (confirmingRecordDeleteId !== id) {
      setConfirmingRecordDeleteId(id);
      return;
    }
    
    try {
      await api.deleteNameListRecord(id);
      setConfirmingRecordDeleteId(null);
      
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
      
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 3, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 3, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 3,
        
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
      
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 3, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      await toPng(certificateRef.current, { backgroundColor: '#ffffff', width: 794, height: 559, pixelRatio: 3, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 3,
        
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

  
  const handlePrintDownload = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: { opacity: '1', transform: 'none' },
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await saveCertificate({
          title: selectedCategory?.name || 'បញ្ជីឈ្មោះ',
          type: 'image/png',
          blob: blob
        });
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } catch (e) {
        const link = document.createElement('a');
        link.download = `${selectedCategory?.name || 'បញ្ជីឈ្មោះ'}.png`;
        link.href = dataUrl;
        link.click();
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('មានបញ្ហាក្នុងការទាញយក');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredRecords = records;

  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
  const closedLists = ['បញ្ជីឈ្មោះបុណ្យផ្កា', 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ', 'ទិញកម្រាលព្រំ (វគ្គ១)'];
  const isListClosed = closedLists.includes(selectedCategory?.name || '');
  const isKathina = selectedCategory?.name?.includes('កឋិន');
  const hasAnyNote = filteredRecords.some(r => r.note || r.metadata?.trai_liang || r.metadata?.others);


  const getCategoryIcon = (name: string) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#FACC15" stroke="#EAB308" strokeWidth="0.5"/>
      </svg>
    );
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
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 w-fit ${statusClass}`}>
          {statusText}
        </span>
      );
    }
    return null;
  };



  if (!selectedCategory) {
    const roofCat = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
    const kathinaCats = categories.filter((c: any) => c.name.includes('កឋិន'));
    const generalCats = categories.filter((c: any) => c.name !== 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ' && !c.name.includes('កឋិន'));

    return (
      <>
            <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang overflow-y-auto">
        <div className="bg-white dark:bg-slate-950 px-4 py-5 shadow-none dark:shadow-none border-b border-gray-200 dark:border-slate-800 z-10 sticky top-0">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <h2 className="text-2xl font-normal text-gray-900 dark:text-white font-battambang  leading-normal">{t('lists_main_title')}</h2>
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
              <h3 className="text-[14px] font-normal text-gray-500 dark:text-slate-400 mb-4 font-battambang flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {t('lists_category_roof')}
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
                    <h4 className="text-lg sm:text-xl font-normal text-white mb-1  font-battambang">{roofCat.name}</h4>
                    <p className="text-orange-50 text-sm opacity-90  font-battambang">{roofCat.description || 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'}</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {kathinaCats.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[14px] font-normal text-gray-500 dark:text-slate-400 mb-4 font-battambang flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {t('lists_category_kathina')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {kathinaCats.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-all active:scale-95 group overflow-hidden"
                  >
                    {userRole === 'admin' && (
                      <div 
                        onClick={(e) => openEditCatModal(cat, e)}
                        className="absolute top-2 right-2 p-1.5 text-amber-600/50 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full transition-colors z-10"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center mb-3 transition-colors shadow-inner">
                      <svg width="26" height="26" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        {/* Glow */}
                        <circle cx="50" cy="45" r="40" fill="#FDE68A" opacity="0.4" />
                        {/* Phan (Tray) */}
                        <path d="M40 95 L60 95 L55 80 L45 80 Z" fill="#D97706" />
                        <path d="M20 80 Q50 95 80 80 L90 65 Q50 80 10 65 Z" fill="#FBBF24" />
                        {/* Folded Robes (Trai) */}
                        <path d="M25 65 L32 20 Q50 5 68 20 L75 65 Z" fill="#F97316" />
                        <path d="M32 20 L50 65 L68 20 Z" fill="#EA580C" opacity="0.5" />
                        {/* Ribbon/Tie */}
                        <rect x="45" y="12" width="10" height="53" fill="#C2410C" rx="2" />
                        <path d="M40 35 L60 35" stroke="#9A3412" strokeWidth="2" />
                        <path d="M40 45 L60 45" stroke="#9A3412" strokeWidth="2" />
                      </svg>
                    </div>
                    <h4 className="font-normal text-amber-900 dark:text-amber-400 text-center text-sm sm:text-[15px] leading-normal  font-battambang">
                      {cat.name}
                    </h4>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
             <h3 className="text-[14px] font-normal text-gray-500 dark:text-slate-400 mb-4 font-battambang flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-500"></span>
               {t('lists_category_general')}
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
                   <h4 className="font-normal text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white text-center text-sm sm:text-[15px] leading-normal  font-battambang">
                     {cat.name}
                   </h4>
                 </button>
               ))}
               {generalCats.length === 0 && (
                 <div className="col-span-full py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                   {t('lists_no_lists')}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Category Modals */}
      <>
        {isCatModalOpen && (
          <div>
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
                  <h3 className="text-lg  text-gray-900 dark:text-white">
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
                  {catErrorMessage && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-battambang">
                      {catErrorMessage}
                    </div>
                  )}
                  <div className="pt-2 flex gap-3">
                    {editingCategory && (
                      <button
                        type="button"
                        disabled={isSavingCat}
                        onClick={handleDeleteCategory}
                        className={`flex items-center justify-center py-3 sm:py-3.5 px-4 rounded-xl  text-sm sm:text-[15px] transition-colors disabled:opacity-70 ${
                          confirmingCatDeleteId === editingCategory.id 
                            ? 'bg-red-600 text-white hover:bg-red-700 flex-1' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
                        }`}
                      >
                        {confirmingCatDeleteId === editingCategory.id ? 'បញ្ជាក់ការលុប?' : <Trash2 className="w-5 h-5" />}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingCat}
                      className="flex-1 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl  text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingCat ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <div>
                          <Check className="w-5 h-5 mr-2" />
                          រក្សាទុក
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </>
      </>

    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang relative overflow-x-hidden w-full">
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
            <h2 className="text-xl  text-gray-900 dark:text-white  flex-1 leading-normal font-battambang">
              {selectedCategory?.name}
            </h2>
            
            <div className="flex items-center gap-2">
              {userRole === 'admin' && (
                <button
                  onClick={handlePrintDownload}
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0 bg-transparent text-orange-500 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-slate-800"
                  title="ទាញយកបញ្ជី"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                </button>
              )}
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
            <div className="text-[13px] font-medium text-zinc-500 dark:text-slate-400 uppercase st">
              {selectedCategory?.description ? (
                <>{t('list_date')}៖ <span className="text-zinc-900 dark:text-white">{selectedCategory.description}</span></>
              ) : (
                <span>{t('list_total_records')}៖ {filteredRecords.length}</span>
              )}
            </div>
            {(selectedCategory?.name === 'លុយចងដៃខ្ចី' || selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' || selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ' || selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)' || selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)') && (
              <div className="text-[13px] font-medium text-zinc-500 dark:text-slate-400 uppercase st">
                {t('list_total_amount')}៖ <span className="text-zinc-900 dark:text-white">{formatCurrency(totalAmount)}</span>
              </div>
            )}
          </div>

          <>
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
                      <tr className="bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-[12px] sm:text-[13px] ">
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-8 sm:w-12 text-center whitespace-nowrap border border-gray-300 dark:border-slate-700">ល.រ</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">ឈ្មោះសប្បុរសជន</th>
                        {isKathina && (
                          <>
                            <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">ត្រៃ/លៀង</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">ផ្សេងៗ</th>
                          </>
                        )}
                        {!isKathina && (
                          <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap text-right border border-gray-300 dark:border-slate-700">ថវិកា</th>
                        )}
                        <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-20 sm:w-28 text-right whitespace-nowrap border border-gray-300 dark:border-slate-700">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody >
                      <>
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
                              <span className="text-[12px] font-medium text-gray-500 dark:text-slate-400 inline-block">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                              <div className="flex flex-col justify-center">
                                <span className="font-normal text-[15px] text-gray-900 dark:text-white leading-normal font-battambang">
                                  {record.name}
                                </span>
                                {record.note && (
                                  <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-battambang">
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                    {record.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            {isKathina && (
                              <>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                                  <span className="text-[13px] sm:text-[14px] text-gray-700 dark:text-slate-300 font-battambang">
                                    {record.metadata?.trai_liang || '-'}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle border border-gray-200 dark:border-slate-700">
                                  <span className="text-[13px] sm:text-[14px] text-gray-700 dark:text-slate-300 font-battambang">
                                    {record.metadata?.others || (record.amount > 0 ? formatCurrency(record.amount) : '-')}
                                  </span>
                                </td>
                              </>
                            )}
                            {!isKathina && (
                              <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                                <span className=" text-[14px] sm:text-[15px] text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                  {formatCurrency(record.amount)}
                                </span>
                              </td>
                            )}
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                              <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                {userRole === 'admin' && selectedCategory?.name !== 'លុយជាងដក' && (
                                  <button 
                                    onClick={() => setCertificateRecord(record)}
                                    className="p-1 sm:p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors focus:outline-none"
                                    title="ប័ណ្ណអនុមោទនា"
                                  >
                                    <Award className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                )}
                                {userRole === 'admin' && !isListClosed && (
                                  <div>
                                    <button 
                                      onClick={() => openEditModal(record)}
                                      className="p-1 sm:p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none"
                                    >
                                      <Edit2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className={`p-1 sm:p-1.5 rounded-lg transition-colors focus:outline-none ${
                                        confirmingRecordDeleteId === record.id
                                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                                          : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                      }`}
                                    >
                                      {confirmingRecordDeleteId === record.id ? (
                                        <span className="text-xs  px-1 font-battambang">លុប?</span>
                                      ) : (
                                        <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>

          {selectedCategory?.name === 'បញ្ជីឈ្មោះបុណ្យផ្កា' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className=" text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ទិញកណ្ដឹងដាក់ដំបូលព្រះវិហារ' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-blue-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className=" text-blue-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">ចំណាយជាវកណ្ដឹង ៤ (មួយស្មើ 55$) សរុប</span>
                <span className=" text-orange-800">890,000៛</span>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm  text-gray-800 dark:text-slate-200">បច្ច័យនៅសល់</span>
                <span className=" text-green-700">{formatCurrency(totalAmount - 890000)}</span>
              </div>
            </div>
          )}

                    {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">បច្ច័យសរុប</span>
                <span className=" text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="bg-blue-100/50 p-3 flex flex-col gap-1 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-gray-700 dark:text-slate-300">ចំណាយទិញព្រំ (១ដុំ 2m x 25m = ៤២ម៉ឺន) ២ដុំ អស់</span>
                   <span className=" text-blue-800">840,000៛</span>
                </div>
              </div>
              <div className="bg-green-100/50 p-3 flex justify-between items-center">
                <span className="text-sm  text-gray-800 dark:text-slate-200">បច្ច័យនៅសល់</span>
                <span className=" text-green-700">{formatCurrency(totalAmount - 840000)}</span>
              </div>
            </div>
          )}

          {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)' && filteredRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden mt-6 mb-8">
              <div className="bg-orange-100/50 p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">សរុប</span>
                <span className=" text-orange-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal (Bottom Sheet on Mobile) */}
      <>
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
              <h3 className=" text-xl text-gray-900 dark:text-white">
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
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('list_name_ph')}
                />
              </div>

              {isKathina && (
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ត្រៃ/លៀង
                    </label>
                    <input
                      type="text"
                      value={traiLiang}
                      onChange={(e) => setTraiLiang(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ឧ. ១ត្រៃ ២លៀង..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ផ្សេងៗ
                    </label>
                    <input
                      type="text"
                      value={others}
                      onChange={(e) => setOthers(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="កំណត់សម្គាល់ផ្សេងៗ..."
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {isKathina ? 'ចំនួនទឹកប្រាក់ (រៀល) - បើមាន' : t('list_amount')}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val);
                        if (Number(val) >= 100000) setIs100kDonor(true);
                      }}
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label htmlFor="is100kDonor" className="text-[14px] font-battambang  text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                  ✅ ថវិកាកម្រិតខ្ពស់
                </label>
              </div>

              {!editingRecord && (
                <div className="flex items-center gap-3 p-4 mt-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                  <div className="flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-[15px]  text-gray-900 dark:text-white">ជូនដំណឹងជាសាធារណៈ</h4>
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
                className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl  text-[15px] hover:bg-gray-50 dark:bg-slate-800/50 transition-colors focus:outline-none"
              >
                {t('list_cancel')}
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={isSaving || !name.trim() || (!isKathina && !amount.trim())}
                className="flex-1 py-3.5 px-4 bg-orange-500 text-white rounded-2xl  text-[15px] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
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
      </>

      {/* Certificate Modal */}
      <>
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
                <h2 className="text-[16px]  text-gray-900 font-battambang">{isKathina ? 'លិខិតឈ្មោះ' : 'លិខិតថ្លែងអំណរគុណ'}</h2>
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
                    {isKathina ? (
                      <div 
                        ref={certificateRef}
                        className="w-[794px] h-[559px] bg-[#fdfaf0] flex flex-col pt-[42px] pb-[40px] px-[48px] relative overflow-hidden z-0"
                        style={{
                          backgroundColor: '#fdfaf0'
                        }}
                      >
                        {/* Complex Outer Border Kbach */}
                        <div className="absolute inset-0 border-[16px] border-[#991b1b] z-10 pointer-events-none shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]"></div>
                        <div className="absolute inset-[16px] border-[4px] border-[#fdfaf0] z-10 pointer-events-none"></div>
                        <div className="absolute inset-[20px] border-[6px] border-[#d4af37] z-10 pointer-events-none shadow-sm"></div>
                        <div className="absolute inset-[26px] border-[3px] border-[#fdfaf0] z-10 pointer-events-none"></div>
                        <div className="absolute inset-[29px] border-[2px] border-[#991b1b] z-10 pointer-events-none"></div>
                        <div className="absolute inset-[36px] border-[1px] border-dashed border-[#d4af37] z-10 pointer-events-none opacity-70"></div>
                        
                        {/* Corner Ornaments (Khmer Style SVG) */}
                        <div className="absolute top-[8px] left-[8px] z-20 pointer-events-none">
                          <svg width="75" height="75" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M 0 0 L 100 0 Q 80 20 60 40 Q 80 60 40 60 Q 60 80 0 100 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M 0 0 L 80 0 Q 60 15 45 30 Q 60 45 30 45 Q 45 60 0 80 Z" fill="#991b1b"/>
                            <path d="M 0 0 L 55 0 Q 40 10 30 20 Q 40 30 20 30 Q 30 40 0 55 Z" fill="#fdfaf0"/>
                            <circle cx="12" cy="12" r="4" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute top-[8px] right-[8px] z-20 pointer-events-none">
                          <svg width="75" height="75" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform scale-x-[-1]">
                            <path d="M 0 0 L 100 0 Q 80 20 60 40 Q 80 60 40 60 Q 60 80 0 100 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M 0 0 L 80 0 Q 60 15 45 30 Q 60 45 30 45 Q 45 60 0 80 Z" fill="#991b1b"/>
                            <path d="M 0 0 L 55 0 Q 40 10 30 20 Q 40 30 20 30 Q 30 40 0 55 Z" fill="#fdfaf0"/>
                            <circle cx="12" cy="12" r="4" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute bottom-[8px] left-[8px] z-20 pointer-events-none">
                          <svg width="75" height="75" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform scale-y-[-1]">
                            <path d="M 0 0 L 100 0 Q 80 20 60 40 Q 80 60 40 60 Q 60 80 0 100 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M 0 0 L 80 0 Q 60 15 45 30 Q 60 45 30 45 Q 45 60 0 80 Z" fill="#991b1b"/>
                            <path d="M 0 0 L 55 0 Q 40 10 30 20 Q 40 30 20 30 Q 30 40 0 55 Z" fill="#fdfaf0"/>
                            <circle cx="12" cy="12" r="4" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute bottom-[8px] right-[8px] z-20 pointer-events-none">
                          <svg width="75" height="75" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform scale-x-[-1] scale-y-[-1]">
                            <path d="M 0 0 L 100 0 Q 80 20 60 40 Q 80 60 40 60 Q 60 80 0 100 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M 0 0 L 80 0 Q 60 15 45 30 Q 60 45 30 45 Q 45 60 0 80 Z" fill="#991b1b"/>
                            <path d="M 0 0 L 55 0 Q 40 10 30 20 Q 40 30 20 30 Q 30 40 0 55 Z" fill="#fdfaf0"/>
                            <circle cx="12" cy="12" r="4" fill="#991b1b"/>
                          </svg>
                        </div>

                        {/* Edge Midpoint Accents (Khmer Star/Diamond) */}
                        <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                          <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M50 0 C65 25 75 35 100 50 C75 65 65 75 50 100 C35 75 25 65 0 50 C25 35 35 25 50 0 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M50 15 C60 30 70 40 85 50 C70 60 60 70 50 85 C40 70 30 60 15 50 C30 40 40 30 50 15 Z" fill="#991b1b"/>
                            <circle cx="50" cy="50" r="12" fill="#fdfaf0"/>
                            <circle cx="50" cy="50" r="5" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                          <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M50 0 C65 25 75 35 100 50 C75 65 65 75 50 100 C35 75 25 65 0 50 C25 35 35 25 50 0 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M50 15 C60 30 70 40 85 50 C70 60 60 70 50 85 C40 70 30 60 15 50 C30 40 40 30 50 15 Z" fill="#991b1b"/>
                            <circle cx="50" cy="50" r="12" fill="#fdfaf0"/>
                            <circle cx="50" cy="50" r="5" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute top-1/2 left-[8px] -translate-y-1/2 z-20 pointer-events-none">
                          <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M50 0 C65 25 75 35 100 50 C75 65 65 75 50 100 C35 75 25 65 0 50 C25 35 35 25 50 0 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M50 15 C60 30 70 40 85 50 C70 60 60 70 50 85 C40 70 30 60 15 50 C30 40 40 30 50 15 Z" fill="#991b1b"/>
                            <circle cx="50" cy="50" r="12" fill="#fdfaf0"/>
                            <circle cx="50" cy="50" r="5" fill="#991b1b"/>
                          </svg>
                        </div>
                        <div className="absolute top-1/2 right-[8px] -translate-y-1/2 z-20 pointer-events-none">
                          <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                            <path d="M50 0 C65 25 75 35 100 50 C75 65 65 75 50 100 C35 75 25 65 0 50 C25 35 35 25 50 0 Z" fill="#d4af37" stroke="#991b1b" strokeWidth="2"/>
                            <path d="M50 15 C60 30 70 40 85 50 C70 60 60 70 50 85 C40 70 30 60 15 50 C30 40 40 30 50 15 Z" fill="#991b1b"/>
                            <circle cx="50" cy="50" r="12" fill="#fdfaf0"/>
                            <circle cx="50" cy="50" r="5" fill="#991b1b"/>
                          </svg>
                        </div>

                        {/* Background Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none overflow-hidden -z-10">
                          <svg width="450" height="450" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" stroke="#d4af37" strokeWidth="0.6">
                              <circle cx="50" cy="50" r="48" strokeDasharray="1 2"/>
                              <circle cx="50" cy="50" r="42" />
                              <circle cx="50" cy="50" r="30" />
                              <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" opacity="0.5"/>
                              {Array.from({length: 12}).map((_, i) => (
                                <path key={`outer-${i}`} d="M50 2 Q 60 25 50 48 Q 40 25 50 2 Z" transform={`rotate(${i*30} 50 50)`} fill="rgba(212, 175, 55, 0.15)" strokeWidth="0.4" />
                              ))}
                              {Array.from({length: 12}).map((_, i) => (
                                <path key={`inner-${i}`} d="M50 20 Q 56 35 50 50 Q 44 35 50 20 Z" transform={`rotate(${i*30 + 15} 50 50)`} fill="rgba(153, 27, 27, 0.1)" strokeWidth="0.4" />
                              ))}
                            </g>
                            <circle cx="50" cy="50" r="8" fill="#d4af37" opacity="0.2"/>
                          </svg>
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fff8dc_0%,_transparent_80%)] -z-10 pointer-events-none"></div>

                        {/* Tevoda Left */}
                        <img 
                          src="/tevoda.png" 
                          alt="ទេវតា" 
                          className="absolute top-[45px] left-[55px] w-[80px] h-[130px] object-contain z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform scale-x-[-1]"
                          onError={(e) => { 
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='130' viewBox='0 0 80 130'%3E%3Crect width='80' height='130' fill='none' rx='8' stroke='%23d4af37' stroke-width='2' stroke-dasharray='4'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23d4af37'%3EUpload%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23d4af37'%3Etevoda.png%3C/text%3E%3C/svg%3E";
                            e.currentTarget.className = "absolute top-[45px] left-[55px] w-[80px] h-[130px] object-contain z-20 opacity-60 transform scale-x-[-1]";
                          }}
                        />

                        {/* Tevoda Right */}
                        <img 
                          src="/tevoda.png" 
                          alt="ទេវតា" 
                          className="absolute top-[45px] right-[55px] w-[80px] h-[130px] object-contain z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                          onError={(e) => { 
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='130' viewBox='0 0 80 130'%3E%3Crect width='80' height='130' fill='none' rx='8' stroke='%23d4af37' stroke-width='2' stroke-dasharray='4'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23d4af37'%3EUpload%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%23d4af37'%3Etevoda.png%3C/text%3E%3C/svg%3E";
                            e.currentTarget.className = "absolute top-[45px] right-[55px] w-[80px] h-[130px] object-contain z-20 opacity-60";
                          }}
                        />

                        {/* Top Section */}
                        <div className="relative z-30 flex flex-col items-center mt-2 mb-0 space-y-1 text-center">
                          <div className="flex items-center justify-center space-x-3 mb-1">
                            <svg width="24" height="12" viewBox="0 0 30 15" fill="none"><path d="M30 7.5 C20 7.5 15 15 15 15 C15 15 10 7.5 0 7.5 C10 7.5 15 0 15 0 C15 0 20 7.5 30 7.5 Z" fill="#d4af37"/></svg>
                            <h2 className="text-[38px] text-[#991b1b] font-normal leading-normal  drop-shadow-sm" style={{ fontFamily: '"Khmer OS Kulen", Koulen, cursive', textShadow: '2px 2px 0px rgba(212, 175, 55, 0.4)' }}>
                              បុណ្យកឋិនទានសាមគ្គី
                            </h2>
                            <svg width="24" height="12" viewBox="0 0 30 15" fill="none" className="transform scale-x-[-1]"><path d="M30 7.5 C20 7.5 15 15 15 15 C15 15 10 7.5 0 7.5 C10 7.5 15 0 15 0 C15 0 20 7.5 30 7.5 Z" fill="#d4af37"/></svg>
                          </div>
                          
                          <h3 className="text-[22px] text-[#1e3a8a] font-moul leading-normal mt-1">
                            វត្តវារីបាការាម (ស្នាយដួច)
                          </h3>
                          
                          {/* Elegant Divider */}
                          <div className="flex items-center justify-center w-full max-w-[250px] my-1 opacity-90">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]"></div>
                            <div className="mx-2 rotate-45 w-[5px] h-[5px] bg-[#991b1b] border-[1px] border-[#d4af37]"></div>
                            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]"></div>
                          </div>

                          <p className="text-[15px] text-gray-800 font-battambang font-medium">
                            ភូមិពន្សាំង ឃុំជើងគួន ស្រុកសំរោង ខេត្តតាកែវ
                          </p>
                        </div>

                        {/* Center Section - Name */}
                        <div className="relative z-30 flex-1 flex flex-col items-center justify-center my-1 w-full px-2">
                          <div className="w-full max-w-[98%] bg-gradient-to-b from-[#fffbeb] to-[#fdfaf0] border-[4px] border-double border-[#d4af37] rounded-2xl py-3 px-4 flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(153,27,27,0.12)] relative min-h-[120px]">
                            {/* Small Inner Box Corner Ornaments */}
                            <svg className="absolute top-1.5 left-1.5 w-6 h-6 opacity-70" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M2 14 Q 14 14 14 2" /><circle cx="4" cy="4" r="1.5" fill="#991b1b" stroke="none"/></svg>
                            <svg className="absolute top-1.5 right-1.5 w-6 h-6 opacity-70 transform scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M2 14 Q 14 14 14 2" /><circle cx="4" cy="4" r="1.5" fill="#991b1b" stroke="none"/></svg>
                            <svg className="absolute bottom-1.5 left-1.5 w-6 h-6 opacity-70 transform scale-y-[-1]" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M2 14 Q 14 14 14 2" /><circle cx="4" cy="4" r="1.5" fill="#991b1b" stroke="none"/></svg>
                            <svg className="absolute bottom-1.5 right-1.5 w-6 h-6 opacity-70 transform scale-x-[-1] scale-y-[-1]" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2"><path d="M2 14 Q 14 14 14 2" /><circle cx="4" cy="4" r="1.5" fill="#991b1b" stroke="none"/></svg>

                            {/* Top label */}
                            <div className="absolute -top-[14px] bg-[#991b1b] px-6 py-[2px] rounded-full border-2 border-[#d4af37] shadow-sm flex items-center justify-center">
                              <span className="text-[#fdfaf0] font-battambang text-[14px]  ">ឈ្មោះម្ចាស់ត្រៃលៀង</span>
                            </div>
                            
                            <div className="w-full flex justify-center mt-1 mb-1 px-1">
                              <h1 
                                className="text-[#1e3a8a] leading-[1.5] py-1 text-center break-words" 
                                style={{ 
                                  fontFamily: '"Khmer OS Muol Light", Moul, "Khmer OS Kulen", Koulen, cursive',
                                  fontSize: certificateRecord.name.length > 40 ? '24px' : certificateRecord.name.length > 30 ? '30px' : certificateRecord.name.length > 20 ? '36px' : '46px',
                                  textShadow: '1px 1px 3px rgba(0,0,0,0.15)'
                                }}
                              >
                                {certificateRecord.name}
                              </h1>
                            </div>
                            
                            {(certificateRecord.metadata?.trai_liang || certificateRecord.metadata?.others) && (
                              <div className="flex justify-center items-center gap-6 font-battambang mt-0">
                                {certificateRecord.metadata?.trai_liang && (
                                  <div className="bg-[#fdfaf0] px-5 py-1.5 rounded border border-[#d4af37] shadow-sm">
                                    <span className="text-gray-600 mr-2 text-[15px]">ត្រៃ/លៀង៖</span>
                                    <span className=" text-[#991b1b] text-[16px]">{certificateRecord.metadata.trai_liang}</span>
                                  </div>
                                )}
                                {certificateRecord.metadata?.others && (
                                  <div className="bg-[#fdfaf0] px-5 py-1.5 rounded border border-[#d4af37] shadow-sm">
                                    <span className="text-gray-500 mr-2 text-[15px]">ផ្សេងៗ៖</span>
                                    <span className=" text-[#991b1b] text-[16px]">{certificateRecord.metadata.others}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ornate Divider Bottom */}
                        <div className="relative z-30 w-full px-12 flex items-center justify-center mt-0 mb-1 opacity-90">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-[#d4af37]"></div>
                          <svg width="40" height="12" viewBox="0 0 40 12" className="mx-2">
                            <path d="M20 0 L40 6 L20 12 L0 6 Z" fill="#d4af37" />
                            <path d="M20 2 L32 6 L20 10 L8 6 Z" fill="#991b1b" />
                            <circle cx="20" cy="6" r="2" fill="#fdfaf0" />
                          </svg>
                          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#d4af37] to-[#d4af37]"></div>
                        </div>

                        {/* Bottom Section - Event & Contact */}
                        <div className="relative z-30 flex justify-between items-end pb-0 px-8">
                          <div className="text-left font-battambang">
                            <h4 className="text-[#991b1b]  mb-1 text-[16px]">កម្មវិធីបុណ្យ</h4>
                            <p className="text-gray-800 text-[14px] leading-[1.6] font-medium">
                              ថ្ងៃសៅរ៍-អាទិត្យ ៥-៦រោច ខែអស្សុជ ឆ្នាំមមី អដ្ឋស័ក ព.ស.២៥៧០<br/>
                              ត្រូវនឹងថ្ងៃទី៣១ ខែវិច្ឆិកា ឆ្នាំ២០២៦
                            </p>
                          </div>
                          <div className="text-right font-battambang">
                            <h4 className="text-[#991b1b]  mb-1 text-[16px]">ទំនាក់ទំនង</h4>
                            <p className="text-gray-800 text-[14px] leading-[1.6]   text-right">
                              016 759 264<br/>
                              016 407 774
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                         <span className="text-xs font-moul text-orange-900 leading-normal mb-[2px]">វត្តវារីបាការាម</span>
                         <span className="text-xs font-moul text-orange-900 leading-normal">(ស្នាយដួច)</span>
                      </div>

                      {/* Title - Center */}
                      <div className="flex flex-col items-center pt-3">
                        <h1 className="text-[42px] text-orange-700 mb-2 drop-shadow-none leading-normal " style={{ fontFamily: '"Khmer OS Kulen", Koulen, cursive' }}>លិខិតថ្លែងអំណរគុណ</h1>
                        <div className="flex items-center justify-center space-x-3">
                          <div className="h-[2px] bg-orange-400/50 w-20 rounded-full"></div>
                          <span className="text-orange-500 text-xl ">៙ ❖ ៚</span>
                          <div className="h-[2px] bg-orange-400/50 w-20 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center justify-center flex-1 w-full text-gray-800 my-1">
                      <p className="text-[17px] font-battambang leading-normal mb-2 mt-4 text-orange-900">
                        អាត្មាភាព សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រោះចំពោះញោមម្ចាស់សទ្ធា៖
                      </p>
                      
                      <div className="px-6 py-1 mb-2 border-b border-dashed border-orange-400 min-w-[350px] max-w-[700px] flex justify-center">
                        <h3 
                          className="text-indigo-900 leading-normal pb-1 whitespace-nowrap" 
                          style={{ 
                            fontFamily: '"Khmer OS Kulen", Koulen, cursive',
                            fontSize: certificateRecord.name.length > 40 ? '22px' : certificateRecord.name.length > 30 ? '26px' : certificateRecord.name.length > 20 ? '32px' : '40px'
                          }}
                        >
                          {certificateRecord.name}
                        </h3>
                      </div>
                      
                      <p className="text-[16px] font-battambang leading-normal max-w-[650px] mx-auto text-gray-700">
                        ដែលបានចូលរួមបរិច្ចាគបច្ច័យចំនួន <span className=" text-orange-700 text-xl mx-1">{formatCurrency(certificateRecord.amount)}</span> 
                        {selectedCategory?.name && (
                          <span> ផ្នែក <span className=" text-indigo-800">"{selectedCategory.name}"</span></span>
                        )}
                        <br/>ដើម្បីចូលរួមកសាងទីអារាម និងទ្រទ្រង់វិស័យព្រះពុទ្ធសាសនា។
                      </p>

                      {/* Blessing */}
                      <p className="text-[14px] font-battambang italic leading-normal max-w-[700px] mx-auto text-gray-600 mt-3 px-4">
                        សូមបួងសួងដល់គុណព្រះរតនត្រ័យ និងវត្ថុស័ក្តិសិទ្ធិក្នុងលោក សូមជួយប្រោះព្រំសព្ទសាធុការពរជ័យ បវរសួស្ដី សិរីមង្គល វិបុលសុខ មហាប្រសើរ ជូនដល់ម្ចាស់ទាន ព្រមទាំងក្រុមគ្រួសារ សូមប្រកបដោយពុទ្ធពរទាំង ៤ ប្រការគឺ អាយុ វណ្ណៈ សុខៈ និងពលៈ កុំបីឃ្លៀងឃ្លាតឡើយ។
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="w-full flex justify-between items-end px-8 mb-2">
                      <div className="text-left pb-2">
                        <p className="text-[15px] font-medium text-gray-800 font-battambang">{getKhmerDate()}</p>
                      </div>
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[15px] text-gray-800 font-battambang  mb-1">ព្រះចៅអធិការស្ដីទី</p>
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
                    )}
                </div>
                  </div>
                </div>
              {/* Action Buttons */}
              <div className="p-4 sm:p-6 bg-white border-t border-gray-200 shrink-0 flex gap-3 z-10 relative shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
                <button
                  onClick={handleShareCertificate}
                  disabled={isDownloading}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl  text-[14px] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 focus:outline-none"
                >
                  <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span>ចែករំលែក</span>
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="flex-[2] py-3 px-4 bg-orange-500 text-white rounded-xl  text-[14px] hover:bg-orange-600 shadow-none shadow-orange-500/20 transition-all flex items-center justify-center gap-2 focus:outline-none disabled:opacity-70"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin" />
                  ) : (
                    <div>
                      <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      <span>ទាញយករូបភាព</span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </>

      <>
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
      </>

      {/* Print Section (Hidden on screen) */}
      <div ref={printRef} className="print-section fixed -left-[9999px] top-0 w-[559px] bg-white p-8 opacity-0 pointer-events-none -z-50">
        <div className="text-center font-moul mb-6">
          <h1 className="text-xl">វត្តវារីបាការាម(ហៅស្នាយដួច)</h1>
          <h2 className="text-base mt-2">ភូមិពន្សាំង ឃុំជើងគួន ស្រុកសំរោង ខេត្តតាកែវ</h2>
          <h3 className="text-lg mt-6">
            {selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ២)' 
              ? 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមទិញកម្រាលព្រំ វគ្គ២'
              : selectedCategory?.name === 'ទិញកម្រាលព្រំ (វគ្គ១)'
              ? 'បញ្ជីឈ្មោះសប្បុរសជនចូលរួមទិញកម្រាលព្រំ វគ្គ១'
              : selectedCategory?.name}
          </h3>
        </div>

        <table className="w-full border-collapse text-sm mb-8 font-battambang">
          <thead>
            <tr className="border-b-2 border-black font-moul text-[13px]">
              <th className="py-2 px-2 text-left border border-black w-12 text-center">ល.រ</th>
              <th className="py-2 px-4 text-left border border-black">ឈ្មោះសប្បុរសជន</th>
              {isKathina && (
                <>
                  <th className="py-2 px-3 text-center border border-black">ត្រៃ/លៀង</th>
                  <th className="py-2 px-3 text-center border border-black">ផ្សេងៗ</th>
                </>
              )}
              <th className="py-2 px-4 text-right border border-black">បច្ច័យ</th>
              {hasAnyNote && <th className="py-2 px-4 text-left border border-black">កំណត់សម្គាល់</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r, i) => (
              <tr key={r.id} className="border-b border-black/50 text-[13px]">
                <td className="py-2 px-2 border border-black text-center">{toKhmerNum(i + 1)}</td>
                <td className="py-2 px-4 border border-black">{r.name}</td>
                {isKathina && (
                  <>
                    <td className="py-2 px-3 text-center border border-black">{r.metadata?.trai_liang || (r.note?.includes('ត្រៃ') || r.note?.includes('លៀង') ? r.note : '')}</td>
                    <td className="py-2 px-3 text-center border border-black">{r.metadata?.others || (r.note && !r.note.includes('ត្រៃ') && !r.note.includes('លៀង') ? r.note : '')}</td>
                  </>
                )}
                <td className="py-2 px-4 text-right border border-black font-semibold whitespace-nowrap">
                  {r.amount ? `៛ ${r.amount.toLocaleString()}` : ''}
                </td>
                {hasAnyNote && <td className="py-2 px-4 border border-black text-xs">{(!isKathina) ? (r.note || '') : ''}</td>}
              </tr>
            ))}
            <tr className="border-b-2 border-black font-moul text-[13px]">
              <td colSpan={isKathina ? 4 : 2} className="py-2 px-4 text-right border border-black">សរុបរួម៖</td>
              <td className="py-2 px-4 text-right border border-black font-bold text-[15px] whitespace-nowrap">
                ៛ {filteredRecords.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
              </td>
              {hasAnyNote && <td className="py-2 px-4 border border-black"></td>}
            </tr>
          </tbody>
        </table>

        <div className="text-right text-sm font-battambang mt-10">
          <p>ថ្ងៃខែឆ្នាំទាញយក៖ {getKhmerDate()}</p>
        </div>
      </div>
    </div>
  );
}


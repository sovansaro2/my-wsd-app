import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

import { ChevronDown, Pencil, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Check, Download, Loader2, Calendar, Bell, Award, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';
import { useLanguage } from '../contexts/LanguageContext';
import { saveCertificate } from '../lib/certificateUtils';
import { saveReport } from '../lib/reportUtils';
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
  is_high_level?: boolean;
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

  // Dynamic Image States
  const [logoDataUrl, setLogoDataUrl] = useState<string>('/logo.png');
  const [signDataUrl, setSignDataUrl] = useState<string>('/Sign.png');

  // Seil Modal State
  const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);
  const [isEditSeilModalOpen, setIsEditSeilModalOpen] = useState(false);
  const [seilName, setSeilName] = useState('');
  const [seilDateRange, setSeilDateRange] = useState('');
  const [seilPreviousBalance, setSeilPreviousBalance] = useState('');
  const [editingSeil, setEditingSeil] = useState<SeilPeriod | null>(null);
  const [isSavingSeil, setIsSavingSeil] = useState(false);

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordType, setNewRecordType] = useState<'income' | 'expense'>('expense');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');
  const [newNotifyPublic, setNewNotifyPublic] = useState(false);
  const [addToRoofFund, setAddToRoofFund] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Certificate State
  const [certificateRecord, setCertificateRecord] = useState<FinancialRecord | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

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
      
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 2,
        
        style: {
          transform: "scale(1)",
          transformOrigin: "top left", margin: '0' }
      });
      
      try {
        const blob = await (await fetch(dataUrl)).blob();
        await saveCertificate({
          title: certificateRecord.description,
          type: 'image/png',
          blob: blob
        });
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } catch (e) {
        const link = document.createElement('a');
        link.download = `${certificateRecord.description}.png`;
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
      
      const dataUrl = await toPng(certificateRef.current, { 
        backgroundColor: '#ffffff',
        width: 794,
        height: 559,
        pixelRatio: 2,
        
        style: {
          transform: "scale(1)",
          transformOrigin: "top left", margin: '0' }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `អនុមោទនាប័ត្រ_${certificateRecord.description}.png`, { type: 'image/png' });
      
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

  useEffect(() => {
    fetchPeriods();
    getImageDataUrl('/logo.png').then(setLogoDataUrl);
    getImageDataUrl('/Sign.png').then(setSignDataUrl);
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
      // Ensure all images are completely loaded and decoded before capture
      const images = Array.from(reportRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 500)); // wait a bit longer to ensure render
      
      const reportWidth = reportRef.current.scrollWidth || 800;
      const reportHeight = reportRef.current.scrollHeight;
      
      await toPng(reportRef.current, { backgroundColor: '#ffffff', width: reportWidth, height: reportHeight, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      await toPng(reportRef.current, { backgroundColor: '#ffffff', width: reportWidth, height: reportHeight, pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' } }).catch(() => {});
      const dataUrl = await toPng(reportRef.current, { 
        backgroundColor: '#ffffff',
        width: reportWidth,
        height: reportHeight,
        pixelRatio: 2,
        
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: '0',
          width: `${reportWidth}px`
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

  const openAddSeilModal = () => {
    setSeilName('');
    setSeilDateRange('');
    setSeilPreviousBalance('');
    setEditingSeil(null);
    setIsSeilModalOpen(true);
  };

  const openEditSeilModal = (seil: SeilPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSeil(seil);
    setSeilName(seil.name);
    setSeilDateRange(seil.date_range_text || '');
    setSeilPreviousBalance(seil.previous_balance ? seil.previous_balance.toString() : '');
    setIsEditSeilModalOpen(true);
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
    } finally {
      setIsSavingSeil(false);
    }
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
      if (data && selectedPeriod?.id === editingSeil.id) {
         setSelectedPeriod(data);
      }
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSavingSeil(false);
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
      
      // Auto-add to Roof Fund if toggled
      if (newRecordType === 'income' && addToRoofFund) {
        try {
          const categories = await api.getNameListCategories();
          let roofCategory = categories.find((c: any) => c.name === 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ');
          if (!roofCategory) {
            roofCategory = await api.createNameListCategory({
              name: 'បញ្ជីឈ្មោះកសាងដំបូលព្រះវិហារ',
              description: 'បញ្ជីសប្បុរសជនចូលកសាងដំបូលព្រះវិហារ'
            });
          }
          
          if (roofCategory) {
            await api.createNameListRecord({
              category_id: roofCategory.id,
              name: newDescription.trim(),
              amount: parseFloat(newAmount.replace(/,/g, '')),
              note: newNote || null,
              notify_public: newNotifyPublic,
              is_100k_donor: false
            });
          }
        } catch (e) {
          console.error("Failed to add to roof fund", e);
        }
      }

      fetchRecords(selectedPeriod.id);
      setIsAddModalOpen(false);
      
      setNewDescription('');
      setNewAmount('');
      setNewNote('');
      setNewNotifyPublic(false);
      setAddToRoofFund(false);
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

  if (!selectedPeriod) {
    return (
      <>
            <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang relative">
        <div className="bg-white dark:bg-slate-950 px-4 py-5 shadow-none dark:shadow-none border-b border-gray-200 dark:border-slate-800 z-10 sticky top-0">
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('records_title')}</h2>
             {userRole === 'admin' && (
               <button 
                 onClick={openAddSeilModal}
                 className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
               >
                 <Plus className="w-6 h-6" />
               </button>
             )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {periods.map(period => (
                <button 
                  key={period.id}
                  onClick={() => setSelectedPeriod(period)}
                  className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                >
                  {userRole === 'admin' && (
                    <div 
                      onClick={(e) => openEditSeilModal(period, e)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 group-hover:bg-gray-100 dark:group-hover:bg-slate-700 rounded-full flex items-center justify-center mb-3 transition-colors">
                     <Wallet className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white text-center text-[13px] sm:text-[14px] leading-snug line-clamp-2">
                    {period.name}
                  </h4>
                  {period.date_range_text && (
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-1 text-center">
                      {period.date_range_text}
                    </p>
                  )}
                </button>
              ))}
              {periods.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                   មិនទាន់មានទិន្នន័យនៅឡើយទេ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
{/* Seil Modals */}
      <AnimatePresence>
        {isSeilModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSeilModalOpen(false)}
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">បន្ថែមបញ្ជីចំណូល-ចំណាយថ្មី</h3>
                  <button
                    onClick={() => setIsSeilModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={saveSeil} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី (ឧ. សីលទី១, បុណ្យផ្កា...) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={seilName}
                      onChange={(e) => setSeilName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលឈ្មោះបញ្ជី"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      កាលបរិច្ឆេទ (ឧ. ១៣-២១ សីហា)
                    </label>
                    <input
                      type="text"
                      value={seilDateRange}
                      onChange={(e) => setSeilDateRange(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលកាលបរិច្ឆេទ"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ប្រាក់ប្រតិបត្តិការសល់ពីមុន (៛)
                    </label>
                    <input
                      type="number"
                      value={seilPreviousBalance}
                      onChange={(e) => setSeilPreviousBalance(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-sans"
                      placeholder="0"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSeil}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingSeil ? (
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

        {isEditSeilModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditSeilModalOpen(false)}
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">កែប្រែបញ្ជី</h3>
                  <button
                    onClick={() => setIsEditSeilModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateSeil} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={seilName}
                      onChange={(e) => setSeilName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      កាលបរិច្ឆេទ
                    </label>
                    <input
                      type="text"
                      value={seilDateRange}
                      onChange={(e) => setSeilDateRange(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ប្រាក់ប្រតិបត្តិការសល់ពីមុន (៛)
                    </label>
                    <input
                      type="number"
                      value={seilPreviousBalance}
                      onChange={(e) => setSeilPreviousBalance(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-sans"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSeil}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingSeil ? (
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

  const incomeRecords = records.filter(r => r.type === 'income');
  const expenseRecords = records.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const previousBalance = selectedPeriod?.previous_balance || 0;
  const currentBalance = previousBalance + totalIncome - totalExpense;

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 pb-6 font-battambang">
      {/* Detail Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-5 border-b border-gray-200 dark:border-slate-800 relative z-10 shadow-none dark:shadow-none sticky top-0">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className="text-[20px] sm:text-[22px] leading-tight font-bold text-gray-900 dark:text-white tracking-tight truncate">{selectedPeriod?.name}</h2>
                {selectedPeriod?.date_range_text && (
                   <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">{selectedPeriod.date_range_text}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 pl-2">
              <button 
                onClick={handleDownload}
                disabled={isDownloading || isLoading || records.length === 0}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none disabled:opacity-50"
                title="ទាញយកជារូបភាព"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>

              {userRole === 'admin' && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm focus:outline-none"
                  title={t('records_add_new')}
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          {/* Previous Balance */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[18px] p-3.5 sm:p-4 flex flex-col justify-center border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
              <p className="text-emerald-700 dark:text-emerald-400 text-[13px] font-semibold line-clamp-1">{t('records_prev_balance')}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(previousBalance)}</p>
          </div>
          
          {/* Current Balance */}
          <div className="bg-orange-50 dark:bg-orange-500/10 rounded-[18px] p-3.5 sm:p-4 flex flex-col justify-center border border-orange-100 dark:border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowUpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" strokeWidth={2.5} />
              <p className="text-orange-700 dark:text-orange-400 text-[13px] font-semibold line-clamp-1">{t('records_current_balance')}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 truncate">{formatCurrency(currentBalance)}</p>
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
              ? 'bg-white dark:bg-slate-900 text-emerald-600 border border-gray-200 dark:border-slate-700/60 shadow-none dark:shadow-none' 
              : 'bg-transparent text-zinc-400 dark:text-slate-500 hover:text-zinc-600'
          }`}
        >
          <ArrowDownCircle className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${activeTab === 'income' ? 'text-green-600' : ''}`} />
          {t('records_total_income')} ({formatCurrency(totalIncome)})
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'expense' 
              ? 'bg-white dark:bg-slate-900 text-rose-600 border border-gray-200 dark:border-slate-700/60 shadow-none dark:shadow-none' 
              : 'bg-transparent text-zinc-400 dark:text-slate-500 hover:text-zinc-600'
          }`}
        >
          <ArrowUpCircle className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${activeTab === 'expense' ? 'text-rose-600' : ''}`} />
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
              {(activeTab === 'income' ? incomeRecords : expenseRecords).length === 0 ? (
                <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">
                  {activeTab === 'income' ? t('records_empty_income') : t('records_empty_expense')}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-none overflow-hidden mt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-[12px] sm:text-[13px] font-bold">
                          <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-8 sm:w-12 text-center whitespace-nowrap border border-gray-300 dark:border-slate-700">ល.រ</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap border border-gray-300 dark:border-slate-700">បរិយាយ</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3.5 whitespace-nowrap text-right border border-gray-300 dark:border-slate-700">ថវិកា</th>
                          {activeTab === 'income' && <th className="px-2 sm:px-4 py-2 sm:py-3.5 w-16 sm:w-24 text-right whitespace-nowrap border border-gray-300 dark:border-slate-700">សកម្មភាព</th>}
                        </tr>
                      </thead>
                      <tbody >
                        {(activeTab === 'income' ? incomeRecords : expenseRecords).map((record, index) => (
                          <tr
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
                                  {record.description}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{formatDate(record.record_date)}</span>
                                {record.note && (
                                  <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 line-clamp-1">
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                    {record.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                              <span className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap ${activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {activeTab === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                              </span>
                            </td>
                            {activeTab === 'income' && (
                              <td className="px-2 sm:px-4 py-2 sm:py-3 align-middle text-right border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center justify-end gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => setCertificateRecord(record)}
                                    className="p-1 sm:p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors focus:outline-none"
                                    title="ប័ណ្ណអនុមោទនា"
                                  >
                                    <Award className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-200 pb-2">
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
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-200 pb-2">
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
              <div className="h-24 w-40 relative mb-2 flex items-center justify-center">
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
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
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
                          ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-none dark:shadow-none'
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
                          ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-none dark:shadow-none'
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
                      <h4 className="text-[13px] sm:text-[14px] font-bold text-gray-900 dark:text-white">ជូនដំណឹងជាសាធារណៈ</h4>
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
                    className="w-full mt-2 py-4 rounded-2xl bg-zinc-900 dark:bg-orange-600 text-white font-bold text-[15px] shadow-none dark:shadow-none hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/50 disabled:opacity-70 flex justify-center items-center"
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

      {/* Certificate Modal */}
      <AnimatePresence>
        {certificateRecord && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
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
                            fontSize: certificateRecord.description.length > 40 ? '22px' : certificateRecord.description.length > 30 ? '26px' : certificateRecord.description.length > 20 ? '32px' : '40px'
                          }}
                        >
                          {certificateRecord.description}
                        </h3>
                      </div>
                      
                      <p className="text-[16px] font-battambang leading-snug max-w-[650px] mx-auto text-gray-700">
                        ដែលបានចូលរួមបរិច្ចាគបច្ច័យចំនួន <span className="font-bold text-orange-700 text-xl mx-1">{formatCurrency(certificateRecord.amount)}</span> 
                        {certificateRecord.note ? (
                          <span> ផ្នែក <span className="font-bold text-indigo-800">"{certificateRecord.note}"</span></span>
                        ) : (
                          <span> ផ្នែក <span className="font-bold text-indigo-800">"ចំណូល"</span></span>
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
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-white sm:rounded-b-3xl rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end relative z-10 shrink-0">
                <button
                  onClick={handleShareCertificate}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-battambang disabled:opacity-70"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                  ចែករំលែក
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-battambang disabled:opacity-70"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  ទាញយក
                </button>
              </div>
            </motion.div>
          </div>
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


import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  RotateCcw, 
  Check, 
  Eye, 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Building2, 
  PenTool, 
  Sparkles, 
  Stamp,
  Sliders,
  ChevronDown,
  FileDown,
  FolderArchive,
  BookmarkPlus,
  Trash2,
  X,
  Share2,
  CheckCircle2,
  Landmark,
  UserCheck
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  SavedInvitationLetter, 
  saveInvitationLetter, 
  getSavedInvitationLetters, 
  deleteSavedInvitationLetter, 
  shareOrDownloadPdf 
} from '../lib/invitationLetterUtils';

const toKhmerNum = (num: number | string): string => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(digit => khmerNumbers[parseInt(digit, 10)] ?? digit).join('');
};

interface InvitationData {
  // National Motto
  countryName: string;
  nationalMotto: string;

  // Temple / Organization Header
  templeName: string;
  templeAddress: string;
  letterNumber: string;

  // Letter Title & Salutation
  letterTitle: string;
  salutationPrefix: string; // e.g., "សូមគោរពអញ្ជើញ" or "សូមនិមន្ត និងគោរពអញ្ជើញ"
  recipientName: string;

  // Administrative Subject & Reference
  subject: string; // កម្មវត្ថុ (គ្មានពាក្យ "ស្ដីពី" ឡើយ)
  showReference: boolean;
  referenceText: string; // យោង

  // Body Content
  bodyIntro: string; // សេចក្តីដូចមានចែងក្នុងកម្មវត្ថុ...
  
  // Meeting Details
  lunarDate: string;
  solarDate: string;
  meetingTime: string;
  location: string;
  agenda: string;

  // Concluding paragraph
  therefore: string; // អាស្រ័យហេតុនេះ...

  // Distribution List (កន្លែងទទួល)
  showDistribution: boolean;
  distributionText: string;

  // Signer & Date
  issuingPlace: string;
  signingDateLunar: string;
  signingDateSolar: string;
  signerRole: string;

  // Header adjustments & administrative standards
  showTempleAddressInHeader?: boolean;
  symbolSize?: 'xs' | 'sm' | 'md' | 'lg';
  showHigherOrg?: boolean;
  higherOrgName?: string;
  logoPosition?: 'beside' | 'above';

  // Bottom Note
  showNote: boolean;
  noteText: string;
}

const STORAGE_KEY = 'wsd_invitation_letter_data_v3';

export default function InvitationLetter() {
  const { language } = useLanguage();
  const letterRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSavingToApp, setIsSavingToApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'both' | 'edit' | 'preview' | 'archive'>('both');
  const [savedLetters, setSavedLetters] = useState<SavedInvitationLetter[]>([]);
  const [viewingLetter, setViewingLetter] = useState<SavedInvitationLetter | null>(null);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // Load saved letters from IndexedDB on component mount
  const loadSavedLetters = async () => {
    try {
      const list = await getSavedInvitationLetters();
      setSavedLetters(list);
    } catch (err) {
      console.error('Failed to load saved letters', err);
    }
  };

  useEffect(() => {
    loadSavedLetters();
  }, []);

  // Compute current default dates
  const now = new Date();
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const dayStr = toKhmerNum(now.getDate().toString().padStart(2, '0'));
  const monthStr = monthsKhmer[now.getMonth()];
  const yearStr = toKhmerNum(now.getFullYear());
  const buddhistYearStr = toKhmerNum(now.getFullYear() + 544);

  const defaultData: InvitationData = {
    countryName: 'ព្រះរាជាណាចក្រកម្ពុជា',
    nationalMotto: 'ជាតិ សាសនា ព្រះមហាក្សត្រ',

    templeName: 'វត្តស្នាយដួច',
    templeAddress: 'ឃុំរោងដំរី ស្រុកបាភ្នំ ខេត្តព្រៃវែង',
    letterNumber: '..... / ..... វ.ស.ដ',

    showTempleAddressInHeader: false, // តាមក្បួនរដ្ឋបាលផ្លូវការ អាសយដ្ឋានមិនដាក់ក្នុងក្បាលលិខិតទេ
    symbolSize: 'sm', // ទំហំតូចសមាមាត្រ 13px (មិនធំជ្រុល)
    showHigherOrg: false,
    higherOrgName: 'សាលាអនុគណស្រុកបាភ្នំ',
    logoPosition: 'beside',

    letterTitle: 'លិខិតអញ្ជើញ',
    salutationPrefix: 'សូមគោរពអញ្ជើញ',
    recipientName: 'ឯកឧត្តម លោកជំទាវ លោក លោកស្រី គណៈកម្មការ អាចារ្យវត្ត និងពុទ្ធបរិស័ទចំណុះជើងវត្តទាំងអស់',

    subject: 'ការចូលរួមកិច្ចប្រជុំពិភាក្សាគម្រោងកសាងដំបូលព្រះវិហារ វត្តស្នាយដួច។',
    showReference: true,
    referenceText: 'សេចក្តីត្រូវការចាំបាច់ក្នុងការរៀបចំផែនការ និងកសាងសមិទ្ធផលក្នុងវត្តអារាម។',

    bodyIntro: 'សេចក្តីដូចមានចែងក្នុងកម្មវត្ថុ និងយោងខាងលើ សូមជម្រាបជូន ឯកឧត្តម លោកជំទាវ លោក លោកស្រី គណៈកម្មការ អាចារ្យវត្ត និងពុទ្ធបរិស័ទទាំងអស់ មេត្តាជ្រាបថា៖ វត្តស្នាយដួច នឹងរៀបចំកិច្ចប្រជុំពិភាក្សាការងារមួយ ដើម្បីពិគ្រោះយោបល់ ឯកភាពលើប្លង់ស្ថាបត្យកម្ម ប៉ាន់ប្រមាណថវិកាចំណាយ ព្រមទាំងរៀបចំគណៈកម្មការទទួលបន្ទុកការងារកសាងដំបូលព្រះវិហារ ឱ្យដំណើរការទៅដោយរលូន និងជោគជ័យ។',

    lunarDate: `ថ្ងៃអាទិត្យ ១០កើត ខែផល្គុន ឆ្នាំរោង ឆស័ក ព.ស. ${buddhistYearStr}`,
    solarDate: `ត្រូវនឹងថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`,
    meetingTime: 'វេលាម៉ោង ០៨:០០ នាទីព្រឹក',
    location: 'នៅសាលាឆាន់ វត្តស្នាយដួច ឃុំរោងដំរី ស្រុកបាភ្នំ ខេត្តព្រៃវែង',
    agenda: `១. ពិភាក្សាលើប្លង់ស្ថាបត្យកម្ម ប៉ាន់ប្រមាណថវិកា និងបង្កើតគណៈកម្មការទទួលបន្ទុកការងារ
២. ពិភាក្សាលើផែនការកៀរគរបច្ច័យ និងទំនាក់ទំនងសប្បុរសជនទាំងក្នុងនិងក្រៅប្រទេស
៣. កំណត់កាលបរិច្ឆេទប្រារព្ធពិធីបញ្ចុះបឋមសិលាបើកការដ្ឋានកសាង និងបញ្ហាផ្សេងៗ`,

    therefore: 'អាស្រ័យហេតុនេះ សូម ឯកឧត្តម លោកជំទាវ លោក លោកស្រី គណៈកម្មការ អាចារ្យវត្ត និងពុទ្ធបរិស័ទទាំងអស់ មេត្តាអញ្ជើញចូលរួមកិច្ចប្រជុំខាងលើ ឱ្យបានទាន់ពេលវេលា និងដោយមេត្រីភាព។',

    showDistribution: true,
    distributionText: '- ដូចកម្មវត្ថុ «ដើម្បីចូលរួម»\n- គណៈកម្មការវត្ត «ដើម្បីសហការ»\n- ឯកសារ-កាលប្បវត្តិ',

    issuingPlace: 'វត្តស្នាយដួច',
    signingDateLunar: `ថ្ងៃ... ...កើត/រោច ខែ... ឆ្នាំ... ព.ស. ${buddhistYearStr}`,
    signingDateSolar: `ត្រូវនឹងថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`,
    signerRole: 'ព្រះចៅអធិការវត្តស្នាយដួច',

    showNote: false,
    noteText: 'សម្គាល់៖ សូមនិមន្ត និងអញ្ជើញចូលរួមឱ្យបានទាន់ពេលវេលា។'
  };

  const [formData, setFormData] = useState<InvitationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If user has old single-point agenda, migrate to the updated 3-point agenda
        if (
          !parsed.agenda ||
          parsed.agenda === 'ពិភាក្សាលើប្លង់ស្ថាបត្យកម្ម ប៉ាន់ប្រមាណថវិកា និងបង្កើតគណៈកម្មការទទួលបន្ទុកការងារ'
        ) {
          parsed.agenda = defaultData.agenda;
        }
        return { ...defaultData, ...parsed };
      }
    } catch {}
    return defaultData;
  });

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const handleChange = (field: keyof InvitationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (window.confirm('តើលោកអ្នកពិតជាចង់កំណត់ទម្រង់លិខិតអញ្ជើញនេះទៅជាទម្រង់ដើមវិញមែនទេ?')) {
      setFormData(defaultData);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  // Print function
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  // Download as PDF function (Standard A5 Portrait) with automatic in-app archiving
  const handleDownloadPdf = async () => {
    if (!letterRef.current) return;
    setIsExportingPdf(true);
    try {
      const dataUrl = await toPng(letterRef.current, {
        quality: 1,
        pixelRatio: 3, // High DPI for crisp printing and rendering
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      // Standard A5 dimensions: 148 mm x 210 mm
      pdf.addImage(dataUrl, 'PNG', 0, 0, 148, 210, undefined, 'FAST');
      const filename = `លិខិតអញ្ជើញ_វត្តស្នាយដួច_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);

      // Automatically also save a copy into the app's internal archive
      try {
        const pdfBlob = pdf.output('blob');
        const sizeInKb = (pdfBlob.size / 1024).toFixed(0);
        await saveInvitationLetter({
          title: formData.letterTitle || 'លិខិតអញ្ជើញ',
          recipientName: formData.recipientName,
          subject: formData.subject,
          formattedDate: `ថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`,
          pdfBlob: pdfBlob,
          previewImage: dataUrl,
          formData: { ...formData },
          fileSize: `${sizeInKb} KB`
        });
        await loadSavedLetters();
        setSaveToastMessage('បានទាញយក និងរក្សាទុកក្នុងបណ្ណសារកម្មវិធីដោយជោគជ័យ!');
        setTimeout(() => setSaveToastMessage(null), 3500);
      } catch (saveErr) {
        console.warn('Auto-save error:', saveErr);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('មិនអាចទាញយកជា PDF បានទេ។ សូមសាកល្បងម្តងទៀត!');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Explicit Save to App (without downloading to disk immediately)
  const handleSaveToApp = async () => {
    if (!letterRef.current) return;
    setIsSavingToApp(true);
    try {
      const dataUrl = await toPng(letterRef.current, {
        quality: 0.95,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 148, 210, undefined, 'FAST');
      const pdfBlob = pdf.output('blob');
      const sizeInKb = (pdfBlob.size / 1024).toFixed(0);

      await saveInvitationLetter({
        title: formData.letterTitle || 'លិខិតអញ្ជើញ',
        recipientName: formData.recipientName,
        subject: formData.subject,
        formattedDate: `ថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`,
        pdfBlob: pdfBlob,
        previewImage: dataUrl,
        formData: { ...formData },
        fileSize: `${sizeInKb} KB`
      });

      await loadSavedLetters();
      setSaveToastMessage('បានរក្សាទុកលិខិតអញ្ជើញជា PDF ក្នុងកម្មវិធីនេះរួចរាល់!');
      setTimeout(() => setSaveToastMessage(null), 3500);
    } catch (err) {
      console.error('Save to app error:', err);
      alert('មិនអាចរក្សាទុកក្នុងកម្មវិធីបានទេ។ សូមសាកល្បងម្តងទៀត!');
    } finally {
      setIsSavingToApp(false);
    }
  };

  // Delete saved letter
  const handleDeleteSavedLetter = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('តើលោកអ្នកពិតជាចង់លុបលិខិតនេះចេញពីបណ្ណសារកម្មវិធីមែនទេ?')) {
      await deleteSavedInvitationLetter(id);
      await loadSavedLetters();
      if (viewingLetter?.id === id) {
        setViewingLetter(null);
      }
      setSaveToastMessage('បានលុបលិខិតចេញពីបណ្ណសាររួចរាល់!');
      setTimeout(() => setSaveToastMessage(null), 3000);
    }
  };

  // Load saved letter back into editor
  const handleLoadSavedLetterToForm = (letter: SavedInvitationLetter) => {
    if (letter.formData) {
      if (window.confirm('តើលោកអ្នកចង់បើកទិន្នន័យលិខិតនេះមកកែសម្រួលឡើងវិញមែនទេ?')) {
        setFormData(letter.formData);
        setActiveView('edit');
        setSaveToastMessage('បានផ្ទុកទិន្នន័យលិខិតមកកាន់ទម្រង់កែសម្រួលរួចរាល់!');
        setTimeout(() => setSaveToastMessage(null), 3000);
      }
    }
  };

  // Download directly to PC or Phone from saved record
  const handleDownloadSavedLetterDirectly = async (letter: SavedInvitationLetter, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (letter.pdfBlob) {
      const safeName = (letter.recipientName || 'លិខិតអញ្ជើញ').replace(/[^\p{L}\p{N}\s_-]/gu, '').slice(0, 30).trim();
      const filename = `លិខិតអញ្ជើញ_${safeName || 'វត្តស្នាយដួច'}.pdf`;
      await shareOrDownloadPdf(letter.pdfBlob, filename);
    }
  };

  // Download image function
  const handleDownloadImage = async () => {
    if (!letterRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(letterRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `លិខិតអញ្ជើញ_វត្តស្នាយដួច_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('មិនអាចទាញយករូបភាពបានទេ។ សូមសាកល្បងប្រើមុខងារព្រីនជំនួសវិញ!');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy full text
  const handleCopyText = () => {
    const text = `${formData.countryName}
${formData.nationalMotto}

${formData.templeName}
${formData.templeAddress}
លេខ៖ ${formData.letterNumber}

${formData.letterTitle}

${formData.salutationPrefix}៖
${formData.recipientName}

កម្មវត្ថុ ៖ ${formData.subject}
${formData.showReference ? `យោង ៖ ${formData.referenceText}\n` : ''}
${formData.bodyIntro}

ព័ត៌មានកិច្ចប្រជុំ៖
- កាលបរិច្ឆេទ ៖ ${formData.lunarDate} (${formData.solarDate})
- ពេលវេលា ៖ ${formData.meetingTime}
- ទីកន្លែង ៖ ${formData.location}
${formData.agenda ? (formData.agenda.includes('\n') ? `- របៀបវារៈ ៖\n${formData.agenda}\n` : `- របៀបវារៈ ៖ ${formData.agenda}\n`) : ''}
${formData.therefore}

${formData.showDistribution ? `កន្លែងទទួល៖\n${formData.distributionText}\n\n` : ''}ធ្វើនៅ ${formData.issuingPlace}
${formData.signingDateLunar}
${formData.signingDateSolar}

${formData.signerRole}
(ហត្ថលេខា និងត្រា)
${formData.showNote ? `\n${formData.noteText}` : ''}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full">
      {/* Print Specific CSS for A5 Portrait */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A5 portrait;
              margin: 10mm 12mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print {
              display: none !important;
            }
            #invitation-letter-a5 {
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              font-size: 11.5pt !important;
              line-height: 1.6 !important;
            }
          }
        `
      }} />

      {/* Top Header Controls Bar - Single Row */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20">
        {/* View toggle */}
        <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 text-xs font-battambang">
          <button
            onClick={() => setActiveView('both')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'both' 
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-medium' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            បង្ហាញទាំងពីរ
          </button>
          <button
            onClick={() => setActiveView('edit')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'edit' 
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-medium' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            កែសម្រួល
          </button>
          <button
            onClick={() => setActiveView('preview')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeView === 'preview' 
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-medium' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            មើលគំរូ
          </button>
          <button
            onClick={() => setActiveView('archive')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeView === 'archive' 
                ? 'bg-gray-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-semibold' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>បណ្ណសារ PDF</span>
            <span className="font-rajdhani text-[11px] font-semibold text-orange-600 dark:text-orange-400">
              ({toKhmerNum(savedLetters.length)})
            </span>
          </button>
        </div>

        {/* Action Buttons in single row */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setActiveView('archive')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium font-battambang border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="បើកមើលបណ្ណសារលិខិតដែលបានរក្សាទុកក្នុងកម្មវិធី"
          >
            <FolderArchive className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>បណ្ណសារ</span>
            <span className="font-rajdhani font-semibold text-xs text-orange-600 dark:text-orange-400">
              ({toKhmerNum(savedLetters.length)})
            </span>
          </button>

          <button
            onClick={handleSaveToApp}
            disabled={isSavingToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium font-battambang border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="រក្សាទុកលិខិតនេះជា PDF ក្នុងកម្មវិធីនេះ"
          >
            <BookmarkPlus className="w-4 h-4 text-gray-500" />
            <span>{isSavingToApp ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកក្នុងកម្មវិធី'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium font-battambang border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="ចម្លងអត្ថបទទាំងអស់"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
            <span>{copied ? 'បានចម្លង!' : 'ចម្លងអត្ថបទ'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium font-battambang border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="ទាញយកជារូបភាព PNG សម្រាប់ផ្ញើតាម Telegram"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>{isExporting ? 'កំពុងបង្កើត...' : 'ទាញយកជារូប'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium font-battambang bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            title="ទាញយកជាឯកសារ PDF A5 សម្រាប់ PC ឬ Phone"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExportingPdf ? 'កំពុងបង្កើត PDF...' : 'ទាញយកជា PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Editor Left, Live A5 Preview Right, OR Dedicated Archive */}
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {/* ========================================================================= */}
        {/* DEDICATED ARCHIVE VIEW (Saved Letters in App) */}
        {/* ========================================================================= */}
        {activeView === 'archive' ? (
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            {/* Header banner */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <FolderArchive className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1 shrink-0" />
                <div>
                  <h2 className="font-koulen text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide">
                    បណ្ណសារលិខិតអញ្ជើញ (រក្សាទុកក្នុងកម្មវិធី)
                  </h2>
                  <p className="font-battambang text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
                    រាល់លិខិតអញ្ជើញដែលលោកអ្នកបានរក្សាទុកជា PDF ក្នុងកម្មវិធីនេះ។ លោកអ្នកអាចបើកមើល ឬទាញយកទៅកាន់កុំព្យូទ័រ (PC) ឬទូរស័ព្ទដៃ (Phone) បានគ្រប់ពេលវេលា។
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={() => setActiveView('both')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium font-battambang bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>បង្កើត ឬកែសម្រួលលិខិតថ្មី</span>
                </button>
              </div>
            </div>

            {/* Saved Letters List */}
            {savedLetters.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center">
                <FolderArchive className="w-16 h-16 text-gray-300 dark:text-slate-700 mb-4 stroke-1" />
                <h3 className="font-koulen text-base sm:text-lg text-gray-700 dark:text-slate-300 tracking-wide">
                  មិនទាន់មានលិខិតអញ្ជើញដែលបានរក្សាទុកនៅឡើយទេ
                </h3>
                <p className="font-battambang text-xs text-gray-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
                  នៅពេលលោកអ្នកបង្កើតលិខិតអញ្ជើញរួច សូមចុចប៊ូតុង <span className="font-semibold text-orange-600 dark:text-orange-400">«រក្សាទុកក្នុងកម្មវិធី»</span> ឬ <span className="font-semibold text-orange-600 dark:text-orange-400">«ទាញយកជា PDF»</span> នោះប្រព័ន្ធនឹងរក្សាទុកលិខិតនោះក្នុងបណ្ណសារនេះដោយស្វ័យប្រវត្តិ។
                </p>
                <button
                  onClick={() => setActiveView('both')}
                  className="mt-5 px-4 py-2 text-xs sm:text-sm font-medium font-battambang border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  ទៅកាន់ទំព័របង្កើតលិខិត
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedLetters.map((letter) => (
                  <div
                    key={letter.id}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-400 dark:hover:border-orange-600 transition-all shadow-xs group"
                  >
                    <div>
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex gap-3.5 items-start">
                        {/* Clickable Thumbnail */}
                        <div
                          onClick={() => setViewingLetter(letter)}
                          className="w-20 h-28 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 cursor-pointer shadow-xs group-hover:shadow transition-shadow relative"
                          title="ចុចដើម្បីមើលលិខិតពេញលេញ"
                        >
                          {letter.previewImage ? (
                            <img
                              src={letter.previewImage}
                              alt={letter.title}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-koulen text-xs sm:text-sm text-gray-900 dark:text-white tracking-wide truncate">
                              {letter.title || 'លិខិតអញ្ជើញ'}
                            </span>
                            <span className="font-rajdhani text-[11px] text-gray-400 font-medium shrink-0">
                              {letter.fileSize || 'PDF'}
                            </span>
                          </div>

                          <p className="font-battambang text-xs text-gray-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-semibold">
                            {letter.recipientName}
                          </p>

                          <p className="font-battambang text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-tight mt-0.5">
                            {letter.subject}
                          </p>

                          <p className="font-rajdhani text-[11px] text-gray-400 mt-auto pt-1">
                            {new Date(letter.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setViewingLetter(letter)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-battambang text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                          title="មើលលិខិតនេះពេញលេញលើអេក្រង់"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>មើល</span>
                        </button>

                        <button
                          onClick={(e) => handleDownloadSavedLetterDirectly(letter, e)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-battambang font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="ទាញយកជាឯកសារ PDF ទៅកាន់ PC ឬ Phone"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ទាញយក PDF</span>
                        </button>

                        {letter.formData && (
                          <button
                            onClick={() => handleLoadSavedLetterToForm(letter)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-battambang text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors cursor-pointer"
                            title="យកទិន្នន័យលិខិតនេះមកកែសម្រួលឡើងវិញ"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>កែសម្រួល</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleDeleteSavedLetter(letter.id, e)}
                        className="flex items-center gap-1 p-1 text-xs font-battambang text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="លុបចេញពីបណ្ណសារ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className={`grid gap-6 ${activeView === 'both' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: EDIT FORM & CONTROLS (Hide when preview only) */}
          {/* ========================================================================= */}
          {(activeView === 'both' || activeView === 'edit') && (
            <div className={`no-print ${activeView === 'both' ? 'lg:col-span-5' : 'max-w-3xl mx-auto w-full'} flex flex-col gap-5`}>
              
              {/* Input Forms: Organized in Clean, Logical Sections */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-6 shadow-xs">
                {/* Form Header */}
                <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-koulen text-gray-900 dark:text-white tracking-wide">
                      កែប្រែព័ត៌មានលិខិតអញ្ជើញរដ្ឋបាល
                    </h2>
                    <p className="text-[11px] font-battambang text-gray-400 dark:text-slate-500 mt-0.5">
                      រាល់ព័ត៌មានដែលបំពេញនឹងបង្ហាញផ្ទាល់លើគំរូលិខិត A5 ភ្លាមៗ
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-battambang flex items-center gap-1 transition-colors cursor-pointer"
                      title="កំណត់ទៅទម្រង់ដើមវិញ"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ទម្រង់ដើម</span>
                    </button>
                    <span className="text-[11px] font-battambang text-gray-400 font-normal hidden sm:inline">រក្សាទុកស្វ័យប្រវត្តិ</span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 1. ព័ត៌មានក្បាលលិខិត និង វត្តអារាម */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-koulen text-orange-600 dark:text-orange-400 tracking-wide">
                    <Landmark className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>១. ក្បាលលិខិត និង ព័ត៌មានវត្តអារាម</span>
                  </div>

                  {/* Row 1: Temple Name & Letter Admin Number (2 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ឈ្មោះវត្តអារាម
                      </label>
                      <input
                        type="text"
                        value={formData.templeName}
                        onChange={(e) => handleChange('templeName', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        លេខលិខិតរដ្ឋបាល
                      </label>
                      <input
                        type="text"
                        value={formData.letterNumber}
                        onChange={(e) => handleChange('letterNumber', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: Temple Address (Full width so long commune/district/province is 100% visible) */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                      អាសយដ្ឋានវត្ត (ឃុំ ស្រុក ខេត្ត)
                    </label>
                    <input
                      type="text"
                      value={formData.templeAddress}
                      onChange={(e) => handleChange('templeAddress', e.target.value)}
                      placeholder="ឧ. ឃុំរោងដំរី ស្រុកបាភ្នំ ខេត្តព្រៃវែង"
                      className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Row 3: Symbol size & Header Checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ទំហំក្បាច់ Symbol (Tacteing) ក្រោមបាវចនាជាតិ
                      </label>
                      <select
                        value={formData.symbolSize || 'sm'}
                        onChange={(e) => handleChange('symbolSize', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        <option value="xs">ល្អិតសមរម្យ (11px)</option>
                        <option value="sm">តូចសមាមាត្រ - ស្តង់ដាររដ្ឋបាល (13px)</option>
                        <option value="md">មធ្យម (16px)</option>
                        <option value="lg">ធំ (20px)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center gap-2 pt-1 text-xs font-battambang">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.showTempleAddressInHeader ?? false}
                          onChange={(e) => handleChange('showTempleAddressInHeader', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-gray-700 dark:text-slate-300">
                          បង្ហាញអាសយដ្ឋានវត្តនៅក្បាលលិខិត
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.showHigherOrg ?? false}
                          onChange={(e) => handleChange('showHigherOrg', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-gray-700 dark:text-slate-300">
                          បន្ថែមស្ថាប័នថ្នាក់លើ (សាលាអនុគណ/គណៈសង្ឃនាយក)
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.showHigherOrg && (
                    <div className="pt-1">
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ឈ្មោះស្ថាប័នថ្នាក់លើ
                      </label>
                      <input
                        type="text"
                        value={formData.higherOrgName || ''}
                        onChange={(e) => handleChange('higherOrgName', e.target.value)}
                        placeholder="ឧ. សាលាអនុគណស្រុកបាភ្នំ"
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* 2. អ្នកទទួល និង កម្មវត្ថុ */}
                {/* ========================================================================= */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-koulen text-orange-600 dark:text-orange-400 tracking-wide">
                    <UserCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>២. អ្នកទទួល និង កម្មវត្ថុ</span>
                  </div>

                  {/* Salutation Prefix */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400">
                        ពាក្យអញ្ជើញ <span className="text-orange-600 dark:text-orange-400 font-semibold">(Battambang Bold)</span>
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] font-battambang text-gray-500">
                        <button
                          type="button"
                          onClick={() => handleChange('salutationPrefix', 'សូមអញ្ជើញ')}
                          className="hover:text-orange-600 cursor-pointer underline"
                        >
                          សូមអញ្ជើញ
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => handleChange('salutationPrefix', 'សូមគោរពអញ្ជើញ')}
                          className="hover:text-orange-600 cursor-pointer underline"
                        >
                          សូមគោរពអញ្ជើញ
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.salutationPrefix}
                      onChange={(e) => handleChange('salutationPrefix', e.target.value)}
                      placeholder="សូមគោរពអញ្ជើញ"
                      className="w-full px-3 py-2 text-xs font-battambang font-bold border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Recipient Name: Full Width & Generous Height so Moul font doesn't get clipped! */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400">
                        ឈ្មោះអ្នកទទួល <span className="text-orange-600 dark:text-orange-400 font-bold">(Font Moul ធំច្បាស់)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleChange('recipientName', '...........................................................................')}
                        className="text-[11px] font-battambang text-orange-600 hover:underline cursor-pointer"
                      >
                        + ដាក់ចន្លោះសរសេរដៃ
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.recipientName}
                      onChange={(e) => handleChange('recipientName', e.target.value)}
                      placeholder="វាយឈ្មោះបុគ្គលផ្ទាល់ ឬទុកចន្លោះចុចៗសម្រាប់សរសេរដៃ"
                      className="w-full px-3 py-2.5 text-xs sm:text-[13px] font-moul border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-relaxed min-h-[56px]"
                    />
                  </div>

                  {/* Subject: Full Width */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1 font-semibold">
                      កម្មវត្ថុ (គ្មានពាក្យ «ស្ដីពី» ឡើយ)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-relaxed min-h-[48px]"
                    />
                  </div>

                  {/* Reference (យោង) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-battambang text-gray-600 dark:text-slate-400 font-semibold">
                        យោង (តាមស្តង់ដារលិខិតរដ្ឋបាល)
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-battambang">
                        <input
                          type="checkbox"
                          checked={formData.showReference}
                          onChange={(e) => handleChange('showReference', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-gray-500 dark:text-slate-400">បង្ហាញ «យោង»</span>
                      </label>
                    </div>
                    {formData.showReference && (
                      <textarea
                        rows={2}
                        value={formData.referenceText}
                        onChange={(e) => handleChange('referenceText', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-relaxed min-h-[48px]"
                      />
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. កាលបរិច្ឆេទ ពេលវេលា និង ទីកន្លែង */}
                {/* ========================================================================= */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-koulen text-orange-600 dark:text-orange-400 tracking-wide">
                    <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>៣. កាលបរិច្ឆេទ ពេលវេលា និង ទីកន្លែងប្រជុំ</span>
                  </div>

                  {/* Row 1: Meeting Time & Solar Date (2 columns - shorter text) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ពេលវេលា
                      </label>
                      <input
                        type="text"
                        value={formData.meetingTime}
                        onChange={(e) => handleChange('meetingTime', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        កាលបរិច្ឆេទ (សុរិយគតិ)
                      </label>
                      <input
                        type="text"
                        value={formData.solarDate}
                        onChange={(e) => handleChange('solarDate', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: Lunar Date - FULL WIDTH so long Buddhist lunar calendar doesn't get clipped! */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                      កាលបរិច្ឆេទ (ចន្ទគតិ)
                    </label>
                    <input
                      type="text"
                      value={formData.lunarDate}
                      onChange={(e) => handleChange('lunarDate', e.target.value)}
                      placeholder="ឧ. ថ្ងៃអាទិត្យ ១០កើត ខែផល្គុន ឆ្នាំរោង ឆស័ក ពុទ្ធសករាជ ២៥៦៨"
                      className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Row 3: Meeting Location - FULL WIDTH */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                      ទីកន្លែងប្រជុំ
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="ឧ. នៅសាលាឆាន់ វត្តស្នាយដួច ឃុំរោងដំរី ស្រុកបាភ្នំ ខេត្តព្រៃវែង"
                      className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. ខ្លឹមសារលិខិត របៀបវារៈ និង សេចក្តីបញ្ចប់ */}
                {/* ========================================================================= */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-koulen text-orange-600 dark:text-orange-400 tracking-wide">
                    <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>៤. ខ្លឹមសារលិខិត និង របៀបវារៈ</span>
                  </div>

                  {/* Body Intro: rows=4, leading-[1.8], min-h-[96px], resize-y -> NO VERTICAL SLICING OF KHMER GLYPHS! */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                      ខ្លឹមសារសេចក្តីផ្តើម (កថាខណ្ឌទី១)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bodyIntro}
                      onChange={(e) => handleChange('bodyIntro', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-[1.8] min-h-[96px]"
                    />
                  </div>

                  {/* Agenda: rows=4, leading-[1.8], min-h-[96px], resize-y */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400">
                        របៀបវារៈកិច្ចប្រជុំ <span className="text-orange-600 dark:text-orange-400 font-semibold">(៣ ចំណុច)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleChange('agenda', `១. ពិភាក្សាលើប្លង់ស្ថាបត្យកម្ម ប៉ាន់ប្រមាណថវិកា និងបង្កើតគណៈកម្មការទទួលបន្ទុកការងារ
២. ពិភាក្សាលើផែនការកៀរគរបច្ច័យ និងទំនាក់ទំនងសប្បុរសជនទាំងក្នុងនិងក្រៅប្រទេស
៣. កំណត់កាលបរិច្ឆេទប្រារព្ធពិធីបញ្ចុះបឋមសិលាបើកការដ្ឋានកសាង និងបញ្ហាផ្សេងៗ`)}
                        className="text-[11px] font-battambang text-orange-600 hover:underline cursor-pointer"
                      >
                        + បញ្ចូលគំរូ ៣ ចំណុច
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.agenda}
                      onChange={(e) => handleChange('agenda', e.target.value)}
                      placeholder="១. ...&#10;២. ...&#10;៣. ..."
                      className="w-full px-3.5 py-2.5 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-[1.8] min-h-[96px]"
                    />
                  </div>

                  {/* Conclusion (អាស្រ័យហេតុនេះ) */}
                  <div>
                    <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                      សេចក្ដីបញ្ចប់ (អាស្រ័យហេតុនេះ)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.therefore}
                      onChange={(e) => handleChange('therefore', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-[1.8] min-h-[72px]"
                    />
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 5. ការចុះហត្ថលេខា និង កន្លែងទទួល */}
                {/* ========================================================================= */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-koulen text-orange-600 dark:text-orange-400 tracking-wide">
                    <PenTool className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>៥. ការចុះហត្ថលេខា និង កន្លែងទទួល</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ធ្វើនៅ (ទីកន្លែងចេញលិខិត)
                      </label>
                      <input
                        type="text"
                        value={formData.issuingPlace}
                        onChange={(e) => handleChange('issuingPlace', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        តួនាទីអ្នកចុះហត្ថលេខា
                      </label>
                      <input
                        type="text"
                        value={formData.signerRole}
                        onChange={(e) => handleChange('signerRole', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ថ្ងៃខែចុះហត្ថលេខា (សុរិយគតិ)
                      </label>
                      <input
                        type="text"
                        value={formData.signingDateSolar}
                        onChange={(e) => handleChange('signingDateSolar', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-battambang text-gray-600 dark:text-slate-400 mb-1">
                        ថ្ងៃខែចុះហត្ថលេខា (ចន្ទគតិ)
                      </label>
                      <input
                        type="text"
                        value={formData.signingDateLunar}
                        onChange={(e) => handleChange('signingDateLunar', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Distribution List (កន្លែងទទួល) */}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2 text-xs font-battambang">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.showDistribution}
                          onChange={(e) => handleChange('showDistribution', e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-gray-700 dark:text-slate-300 font-semibold">
                          បង្ហាញ «កន្លែងទទួល» (Administrative Distribution)
                        </span>
                      </label>
                    </div>
                    {formData.showDistribution && (
                      <textarea
                        rows={3}
                        value={formData.distributionText}
                        onChange={(e) => handleChange('distributionText', e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none resize-y leading-[1.8] min-h-[72px]"
                      />
                    )}
                  </div>

                  {/* Toggle for Bottom Note */}
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-2 text-xs font-battambang">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.showNote}
                        onChange={(e) => handleChange('showNote', e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-slate-300">បង្ហាញកំណត់សម្គាល់បន្ថែម</span>
                    </label>
                    {formData.showNote && (
                      <input
                        type="text"
                        value={formData.noteText}
                        onChange={(e) => handleChange('noteText', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-battambang border border-gray-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: LIVE A5 PORTRAIT SHEET PREVIEW (Print target) */}
          {/* ========================================================================= */}
          {(activeView === 'both' || activeView === 'preview') && (
            <div className={`${activeView === 'both' ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'} flex flex-col items-center`}>
              
              {/* Paper Visual Stage */}
              <div className="w-full flex justify-center py-2 sm:py-4 overflow-x-auto">
                {/* 
                  Standard A5 Portrait:
                  Ratio: 148mm : 210mm (1 : 1.419)
                  Document simulation adhering to authentic Cambodian administrative standards.
                */}
                <div
                  ref={letterRef}
                  id="invitation-letter-a5"
                  className="print-section bg-white text-gray-950 shadow-2xl border border-gray-300 rounded-none w-[560px] min-h-[792px] p-7 sm:p-9 flex flex-col justify-between select-text relative font-battambang text-[12px] leading-[1.65]"
                  style={{
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Outer subtle boundary border fitting official A5 document sheet */}
                  <div>
                    {/* Top Letterhead: Pagoda Info Left | National Motto Right (Official Cambodian Administrative Standard - No Full-width Border Line) */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      {/* Left: Temple info & logo */}
                      <div className="flex items-start gap-2.5">
                        <img 
                          src="/logo.png" 
                          alt="Wat Logo" 
                          className="w-12 h-12 object-contain shrink-0 mt-0.5" 
                        />
                        <div className="flex flex-col">
                          {formData.showHigherOrg && formData.higherOrgName && (
                            <div className="text-[10px] text-gray-700 font-battambang leading-tight mb-0.5">
                              {formData.higherOrgName}
                            </div>
                          )}
                          <div className="font-moul text-[13px] text-gray-900 tracking-wide leading-tight">
                            {formData.templeName}
                          </div>
                          {formData.showTempleAddressInHeader && formData.templeAddress && (
                            <div className="text-[10px] text-gray-600 font-battambang mt-0.5 leading-tight">
                              {formData.templeAddress}
                            </div>
                          )}
                          <div className="text-[10.5px] text-gray-800 font-battambang mt-1">
                            លេខ ៖ {formData.letterNumber}
                          </div>
                        </div>
                      </div>

                      {/* Right: National Motto */}
                      <div className="text-center">
                        <div className="font-moul text-[12.5px] text-gray-900 leading-tight">
                          {formData.countryName}
                        </div>
                        <div className="font-moul text-[11.5px] text-gray-800 mt-1">
                          {formData.nationalMotto}
                        </div>
                        {/* Tacteing Ornament Symbol rr2ss: Proportional, delicate administrative size */}
                        <div 
                          className={`font-tacteing text-gray-950 select-none tracking-normal leading-none mt-1 ${
                            formData.symbolSize === 'xs' ? 'text-[11px]' :
                            formData.symbolSize === 'md' ? 'text-[16px]' :
                            formData.symbolSize === 'lg' ? 'text-[20px]' :
                            'text-[13px]'
                          }`}
                        >
                          rr2ss
                        </div>
                      </div>
                    </div>

                    {/* Document Title: លិខិតអញ្ជើញ */}
                    <div className="text-center my-3.5">
                      <h2 className="font-moul text-[19px] text-gray-950 tracking-wider inline-block border-b-2 border-gray-900 pb-0.5 px-3">
                        {formData.letterTitle}
                      </h2>
                    </div>

                    {/* Salutation: សូមអញ្ជើញ (Font Khmer OS Battambang Bold) + ឈ្មោះអ្នកទទួល (Font Moul ធំច្បាស់លេចធ្លោ) */}
                    <div className="mb-2.5 flex items-baseline flex-wrap">
                      <span className="font-battambang font-bold text-[12px] text-gray-950 inline-block mr-2 shrink-0">
                        {formData.salutationPrefix} ៖
                      </span>
                      <span className="font-moul text-[13.5px] text-gray-950 leading-[1.8] tracking-wide">
                        {formData.recipientName}
                      </span>
                    </div>

                    {/* Administrative Items: កម្មវត្ថុ និង យោង (គ្មានពាក្យ «ស្ដីពី» ឡើយ) */}
                    <div className="space-y-1 mb-2.5 text-[12px]">
                      <div className="flex items-start">
                        <span className="font-bold text-gray-950 w-20 shrink-0">កម្មវត្ថុ ៖</span>
                        <span className="text-gray-900 flex-1 font-medium">{formData.subject}</span>
                      </div>
                      {formData.showReference && formData.referenceText && (
                        <div className="flex items-start">
                          <span className="font-bold text-gray-950 w-20 shrink-0">យោង ៖</span>
                          <span className="text-gray-900 flex-1">{formData.referenceText}</span>
                        </div>
                      )}
                    </div>

                    {/* Body text paragraphs */}
                    <div className="space-y-2 text-justify">
                      {/* Body Intro (Indented) */}
                      <p className="leading-relaxed indent-7">
                        {formData.bodyIntro}
                      </p>

                      {/* Meeting Information Block (Clean Administrative Listing, No Box/Container Background) */}
                      <div className="my-2 pl-6 sm:pl-8 space-y-1 text-[11.5px] leading-relaxed">
                        <div className="flex items-start">
                          <span className="font-bold text-gray-950 w-28 shrink-0">- កាលបរិច្ឆេទ ៖</span>
                          <div className="text-gray-900">
                            <span>{formData.lunarDate}</span>
                            <span className="text-[11px] text-gray-700 ml-1">({formData.solarDate})</span>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <span className="font-bold text-gray-950 w-28 shrink-0">- ពេលវេលា ៖</span>
                          <span className="text-gray-900 font-semibold">{formData.meetingTime}</span>
                        </div>

                        <div className="flex items-start">
                          <span className="font-bold text-gray-950 w-28 shrink-0">- ទីកន្លែង ៖</span>
                          <span className="text-gray-900">{formData.location}</span>
                        </div>

                        {formData.agenda && (
                          <div className="flex items-start">
                            <span className="font-bold text-gray-950 w-28 shrink-0">- របៀបវារៈ ៖</span>
                            <div className="text-gray-900 flex-1 whitespace-pre-line leading-relaxed">
                              {formData.agenda}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Concluding Paragraph (Indented) */}
                      <p className="leading-relaxed indent-7">
                        {formData.therefore}
                      </p>
                    </div>
                  </div>

                  {/* Sign-off, Distribution & Footer Section */}
                  <div className="mt-3 pt-2">
                    <div className="grid grid-cols-2 gap-4 items-end">
                      {/* Left: កន្លែងទទួល (Distribution List) */}
                      <div className="text-left">
                        {formData.showDistribution && (
                          <div className="text-[10px] text-gray-700 leading-snug">
                            <div className="font-moul text-[10.5px] text-gray-950 mb-1">កន្លែងទទួល ៖</div>
                            <div className="whitespace-pre-line pl-1 font-battambang">
                              {formData.distributionText}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Date, Signer Title & Blank Space for Manual Signing/Stamping */}
                      <div className="text-center flex flex-col items-center">
                        <p className="text-[11px] text-gray-700 font-battambang">
                          ធ្វើនៅ {formData.issuingPlace}
                        </p>
                        <p className="text-[11px] text-gray-700 font-battambang mt-0.5">
                          {formData.signingDateLunar}
                        </p>
                        <p className="text-[11px] text-gray-700 font-battambang">
                          {formData.signingDateSolar}
                        </p>

                        <p className="font-moul text-[12px] text-gray-950 mt-1.5">
                          {formData.signerRole}
                        </p>

                        {/* Blank spacious area strictly for manual handwriting signature & pagoda stamp */}
                        <div className="w-44 h-24 my-1 flex items-center justify-center pointer-events-none">
                          {/* Blank space for handwriting signature & official stamp */}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Note (if enabled) */}
                    {formData.showNote && (
                      <div className="mt-2 pt-1 border-t border-gray-200 text-[9.5px] text-gray-500 font-battambang text-center leading-relaxed">
                        {formData.noteText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FULL PREVIEW FOR PC OR PHONE */}
      {/* ========================================================================= */}
      {viewingLetter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
              <div className="min-w-0">
                <h3 className="font-koulen text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {viewingLetter.title}
                </h3>
                <p className="font-battambang text-xs text-gray-600 dark:text-slate-400 truncate">
                  {viewingLetter.recipientName}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadSavedLetterDirectly(viewingLetter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium font-battambang bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="ទាញយកទៅកាន់ PC ឬ Phone"
                >
                  <Download className="w-4 h-4" />
                  <span>ទាញយក PDF</span>
                </button>
                <button
                  onClick={() => setViewingLetter(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="បិទ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Letter Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 flex justify-center">
              {viewingLetter.previewImage ? (
                <img
                  src={viewingLetter.previewImage}
                  alt={viewingLetter.title}
                  className="w-full max-w-[500px] h-auto object-contain bg-white shadow-lg border border-gray-300"
                />
              ) : (
                <div className="text-center py-12 font-battambang text-xs text-gray-500">
                  មិនមានរូបភាពគំរូឡើយ
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs font-battambang text-gray-500 dark:text-slate-400 shrink-0">
              <span className="font-rajdhani text-[11px]">
                កាលបរិច្ឆេទរក្សាទុក ៖ {new Date(viewingLetter.date).toLocaleDateString('en-GB')}
              </span>
              <div className="flex items-center gap-3">
                {viewingLetter.formData && (
                  <button
                    onClick={() => {
                      handleLoadSavedLetterToForm(viewingLetter);
                      setViewingLetter(null);
                    }}
                    className="text-orange-600 hover:underline cursor-pointer"
                  >
                    យកមកកែសម្រួល
                  </button>
                )}
                <button
                  onClick={() => setViewingLetter(null)}
                  className="text-gray-600 dark:text-slate-300 hover:underline cursor-pointer"
                >
                  បិទ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Toast Notification */}
      {saveToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-950 text-white text-xs font-battambang px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToastMessage}</span>
        </div>
      )}
    </div>
  );
}

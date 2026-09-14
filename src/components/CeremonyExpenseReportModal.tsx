import React, { useState, useRef } from 'react';
import { Printer, Download, X, Edit3, Check, FileSpreadsheet, Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { useLanguage } from '../contexts/LanguageContext';
import { FONT_EMBED_CSS } from '../lib/fontEmbed';
import { saveReport, shareOrDownloadFile, downloadBlob } from '../lib/reportUtils';
import { playSuccessSound } from '../lib/sound';
import { khmerNumberToWords } from '../lib/khmerNumberToWords';

export interface CeremonyExpenseItem {
  id: string;
  name: string; // មុខទំនិញ ឬឈ្មោះចំណាយ
  amount: number; // ចំនួនទឹកប្រាក់ (រៀល)
  referrer?: string | null; // អ្នកចាត់ចែង / អ្នកទិញ / អ្នកទទួល
  note?: string | null; // កំណត់សម្គាល់ / លេខប័ណ្ណ
  created_at?: string;
  metadata?: {
    expense_date?: string;
    expense_category?: string;
    voucher_no?: string;
    [key: string]: any;
  } | null;
}

interface CeremonyExpenseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  records: CeremonyExpenseItem[];
}

const toKhmerNum = (num: number | string): string => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(digit => khmerNumbers[parseInt(digit, 10)] ?? digit).join('');
};

export default function CeremonyExpenseReportModal({
  isOpen,
  onClose,
  categoryName,
  records,
}: CeremonyExpenseReportModalProps) {
  const { language } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);

  const [downloadingType, setDownloadingType] = useState<'image' | 'pdf' | 'excel' | 'share' | null>(null);
  const [showEditControls, setShowEditControls] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [includeSignatureImage, setIncludeSignatureImage] = useState(true);

  const now = new Date();
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const dayStr = toKhmerNum(now.getDate().toString().padStart(2, '0'));
  const monthStr = monthsKhmer[now.getMonth()];
  const yearStr = toKhmerNum(now.getFullYear());
  const buddhistYearStr = toKhmerNum(now.getFullYear() + 544);

  // Editable fields for official report
  const [reportTitle, setReportTitle] = useState('របាយការណ៍ថវិការចំណាយក្នុងការរៀបចំកម្មវិធីបុណ្យ');
  const [lunarDateText, setLunarDateText] = useState(`ថ្ងៃសុក្រ ៨រោច ខែស្រាពណ៍ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ${buddhistYearStr}`);
  const [solarDateText, setSolarDateText] = useState(`ធ្វើនៅវត្តស្នាយដួច, ថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`);

  const [abbotTitle, setAbbotTitle] = useState('ព្រះចៅអធិការវត្ត');
  const [abbotName, setAbbotName] = useState('ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី');
  const [treasurerTitle, setTreasurerTitle] = useState('ហិរញ្ញិក / អ្នកទូទាត់');
  const [treasurerName, setTreasurerName] = useState('អ្នករៀបចំរបាយការណ៍');

  if (!isOpen) return null;

  const totalExpense = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpenseInWords = khmerNumberToWords(totalExpense);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setDownloadingType('image');
    try {
      await new Promise(r => setTimeout(r, 200));
      const width = reportRef.current.scrollWidth || 794;
      const height = reportRef.current.scrollHeight || 1123;

      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2.5,
        fontEmbedCSS: FONT_EMBED_CSS,
      });

      const blob = await (await fetch(dataUrl)).blob();
      await saveReport({
        title: `${reportTitle} (${new Date().toLocaleDateString('en-GB')})`,
        type: 'image/png',
        blob: blob,
      });

      downloadBlob(blob, `របាយការណ៍ចំណាយបុណ្យ_${new Date().toISOString().slice(0, 10)}.png`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error downloading image report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloadingType('pdf');
    try {
      await new Promise(r => setTimeout(r, 200));
      const width = reportRef.current.scrollWidth || 794;
      const height = reportRef.current.scrollHeight || 1123;

      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2,
        fontEmbedCSS: FONT_EMBED_CSS,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      await saveReport({
        title: `${reportTitle} - PDF (${new Date().toLocaleDateString('en-GB')})`,
        type: 'application/pdf',
        blob: pdfBlob,
      });

      downloadBlob(pdfBlob, `របាយការណ៍ចំណាយបុណ្យ_${new Date().toISOString().slice(0, 10)}.pdf`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportExcel = async () => {
    setDownloadingType('excel');
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('របាយការណ៍ចំណាយបុណ្យ');

      worksheet.columns = [
        { header: 'ល.រ', key: 'no', width: 8 },
        { header: 'មុខទំនិញ / បរិយាយការចំណាយ', key: 'name', width: 35 },
        { header: 'អ្នកចាត់ចែង / អ្នកទិញ', key: 'referrer', width: 25 },
        { header: 'កាលបរិច្ឆេទ', key: 'date', width: 16 },
        { header: 'ចំនួនទឹកប្រាក់ (រៀល)', key: 'amount', width: 22 },
        { header: 'កំណត់សម្គាល់', key: 'note', width: 28 },
      ];

      // Title rows
      worksheet.spliceRows(1, 0, [
        ['វត្តវារីបាការាម (ហៅស្នាយដួច)'],
        [reportTitle],
        [`បញ្ជី៖ ${categoryName}`],
        [`កាលបរិច្ឆេទ៖ ${solarDateText}`],
        [],
      ]);

      // Add records
      records.forEach((r, idx) => {
        const expenseDate = r.metadata?.expense_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '-');
        worksheet.addRow({
          no: idx + 1,
          name: r.name,
          referrer: r.referrer || '-',
          date: expenseDate,
          amount: Number(r.amount) || 0,
          note: r.note || '',
        });
      });

      // Total row
      const totalRow = worksheet.addRow({
        no: '',
        name: 'សរុបការចំណាយទាំងអស់៖',
        referrer: '',
        date: '',
        amount: totalExpense,
        note: totalExpenseInWords,
      });

      totalRow.font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await saveReport({
        title: `${reportTitle} - Excel (${new Date().toLocaleDateString('en-GB')})`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        blob: blob,
      });

      downloadBlob(blob, `របាយការណ៍ចំណាយបុណ្យ_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error exporting excel report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleShare = async () => {
    if (!reportRef.current) return;
    setDownloadingType('share');
    try {
      const width = reportRef.current.scrollWidth || 794;
      const height = reportRef.current.scrollHeight || 1123;
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2,
        fontEmbedCSS: FONT_EMBED_CSS,
      });

      const blob = await (await fetch(dataUrl)).blob();
      await shareOrDownloadFile(blob, `របាយការណ៍ចំណាយបុណ្យ_${new Date().toISOString().slice(0, 10)}.png`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error sharing report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Top Navbar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base font-battambang">
            {language === 'en' ? 'Expense Report Print Preview (A4)' : 'មើលគំរូទម្រង់បោះពុម្ពរបាយការណ៍ចំណាយ (A4)'}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-rajdhani font-semibold">
            ({records.length} items • ៛ {totalExpense.toLocaleString()})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditControls(!showEditControls)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer font-battambang"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showEditControls ? 'លាក់ការកែសម្រួល' : 'កែសម្រួលក្បាលលិខិត & ហត្ថលេខា'}</span>
          </button>

          <button
            onClick={handleShare}
            disabled={downloadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 border border-sky-300 dark:border-sky-800 rounded-lg transition-colors cursor-pointer font-battambang disabled:opacity-60"
          >
            {downloadingType === 'share' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>ចែករំលែក</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={downloadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer font-battambang disabled:opacity-60"
          >
            {downloadingType === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>Excel</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={downloadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 border border-teal-300 dark:border-teal-800 rounded-lg transition-colors cursor-pointer font-battambang disabled:opacity-60"
          >
            {downloadingType === 'image' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>ជារូបភាព (PNG)</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors cursor-pointer font-battambang disabled:opacity-60"
          >
            {downloadingType === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>ជា PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#028090] hover:bg-[#005F73] rounded-lg shadow-sm transition-colors cursor-pointer font-battambang"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>បោះពុម្ព (Print)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editing Toolbar */}
      {showEditControls && (
        <div className="bg-slate-50 dark:bg-slate-800/95 border-b border-gray-200 dark:border-slate-700 p-4 font-battambang text-xs no-print">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">ចំណងជើងរបាយការណ៍</label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">កាលបរិច្ឆេទចន្ទគតិ (Lunar Date)</label>
              <input
                type="text"
                value={lunarDateText}
                onChange={e => setLunarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">កាលបរិច្ឆេទសុរិយគតិ (Solar Date)</label>
              <input
                type="text"
                value={solarDateText}
                onChange={e => setSolarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">តួនាទីព្រះចៅអធិការ</label>
              <input
                type="text"
                value={abbotTitle}
                onChange={e => setAbbotTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">ព្រះនាមព្រះចៅអធិការ</label>
              <input
                type="text"
                value={abbotName}
                onChange={e => setAbbotName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">ហិរញ្ញិក / អ្នកទូទាត់ (តួនាទី & នាម)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={treasurerTitle}
                  onChange={e => setTreasurerTitle(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={treasurerName}
                  onChange={e => setTreasurerName(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="max-w-5xl mx-auto mt-3 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeSignatureImage}
                onChange={e => setIncludeSignatureImage(e.target.checked)}
                className="w-4 h-4 rounded text-[#028090] focus:ring-[#028090]"
              />
              <span>បង្ហាញរូបហត្ថលេខា (/Sign.png)</span>
            </label>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-battambang text-sm animate-fade-in">
          <Check className="w-4 h-4" />
          <span>ទាញយក និងរក្សាទុករបាយការណ៍បានជោគជ័យ!</span>
        </div>
      )}

      {/* A4 Printable Document Container - Matching Official Financial Report Layout */}
      <div className="flex-1 flex justify-center p-2 sm:p-6 md:p-8">
        <div
          ref={reportRef}
          id="ceremony-expense-print-area"
          className="print-section bg-white text-gray-900 w-full max-w-[820px] shadow-2xl rounded-none sm:rounded-sm p-8 sm:p-12 font-battambang relative print:shadow-none print:m-0 print:p-8"
          style={{ minHeight: '1123px', backgroundColor: '#ffffff', color: '#111827' }}
        >
          {/* Header Section: 2-Column Official Layout */}
          <div className="grid grid-cols-2 gap-4 items-start pb-2 border-b border-gray-800/20">
            {/* Left Column: Pagoda Identification */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo វត្តវារីបាការាម"
                  className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="flex flex-col">
                  <span className="font-moul text-[13px] text-gray-900 leading-normal">
                    វត្តវារីបាការាម
                  </span>
                  <span className="font-moul text-[11px] text-gray-800 leading-normal">
                    ហៅ វត្តស្នាយដួច
                  </span>
                  <span className="font-battambang text-[10px] text-gray-600 leading-tight mt-0.5">
                    ឃុំជើងគួន ស្រុកសំរោង ខេត្តតាកែវ
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Kingdom Motto & Royal Emblem */}
            <div className="flex flex-col items-center text-center">
              <span className="font-moul text-[14px] text-gray-900 leading-normal tracking-wide">
                ព្រះរាជាណាចក្រកម្ពុជា
              </span>
              <span className="font-moul text-[12px] text-gray-900 leading-normal tracking-wider mt-0.5">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </span>

              <div className="mt-1 flex flex-col items-center justify-center">
                <svg
                  className="w-36 h-5 text-gray-900"
                  viewBox="0 0 160 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 11 C 22 3, 34 19, 46 11 C 54 5, 62 14, 70 11"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 11 C 8 9, 5 13, 8 15 C 11 17, 15 14, 12 11 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M28 11 C 34 7, 39 8, 41 11"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />

                  <path
                    d="M80 3 C 83 8, 86 12, 80 19 C 74 12, 77 8, 80 3 Z"
                    fill="currentColor"
                  />
                  <circle cx="80" cy="11" r="2" fill="white" />
                  <circle cx="71" cy="11.5" r="1.4" fill="currentColor" />
                  <circle cx="89" cy="11.5" r="1.4" fill="currentColor" />
                  <path
                    d="M74 11.5 L 80 6 L 86 11.5 L 80 17 Z"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    fill="none"
                  />

                  <path
                    d="M148 11 C 138 3, 126 19, 114 11 C 106 5, 98 14, 90 11"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M148 11 C 152 9, 155 13, 152 15 C 149 17, 145 14, 148 11 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M132 11 C 126 7, 121 8, 119 11"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-6">
            <h1 className="font-moul text-[16px] sm:text-[18px] text-gray-900 leading-relaxed">
              {reportTitle}
            </h1>
            <p className="font-battambang text-[12px] sm:text-[13px] text-gray-700 mt-1 font-medium">
              {categoryName}
            </p>
          </div>

          {/* Key Summary Box (Clean 4-column layout like Official Financial Report) */}
          <div className="grid grid-cols-4 gap-2 my-4">
            <div className="border border-gray-300 p-2.5 text-center">
              <span className="text-[10px] text-gray-600 block font-battambang">
                ចំនួនមុខចំណាយសរុប (Items)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {toKhmerNum(records.length)} មុខ
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5 font-battambang">
                បានកត់ត្រាក្នុងបញ្ជី
              </span>
            </div>

            <div className="border border-gray-300 p-2.5 text-center">
              <span className="text-[10px] text-gray-600 block font-battambang">
                សរុបថវិការចំណាយ (Total)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {totalExpense.toLocaleString()} ៛
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5 font-battambang">
                ចំនួនទឹកប្រាក់ជាក់ស្ដែង
              </span>
            </div>

            <div className="col-span-2 border border-gray-300 p-2.5 text-center bg-gray-50/50">
              <span className="text-[10px] text-gray-700 block font-medium font-battambang">
                សមមូលទឹកប្រាក់ជាអក្សរ (In Words)
              </span>
              <span className="font-battambang font-medium text-xs sm:text-[12px] text-gray-900 block mt-1 leading-snug">
                {totalExpenseInWords}
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5 font-battambang">
                គិតជាប្រាក់រៀល
              </span>
            </div>
          </div>

          {/* Detailed Expense Table (Matching the clean format of the financial table) */}
          <div className="my-4">
            <table className="w-full border-collapse border border-gray-400 text-[11px] sm:text-[12px]">
              <thead>
                <tr className="bg-gray-100 text-gray-900 font-battambang border-b border-gray-400">
                  <th className="border border-gray-400 py-1.5 px-1 text-center w-9 font-semibold">ល.រ</th>
                  <th className="border border-gray-400 py-1.5 px-2.5 text-left font-semibold">មុខទំនិញ / បរិយាយការចំណាយ</th>
                  <th className="border border-gray-400 py-1.5 px-2 text-center w-28 font-semibold">អ្នកចាត់ចែង / អ្នកទិញ</th>
                  <th className="border border-gray-400 py-1.5 px-2 text-center w-24 font-semibold">កាលបរិច្ឆេទ</th>
                  <th className="border border-gray-400 py-1.5 px-2.5 text-right w-28 font-semibold whitespace-nowrap">ចំនួនទឹកប្រាក់ (៛)</th>
                  <th className="border border-gray-400 py-1.5 px-2 text-left w-28 font-semibold">កំណត់សម្គាល់</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-300 py-8 text-center text-gray-400 font-battambang text-xs">
                      មិនទាន់មានទិន្នន័យចំណាយនៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  records.map((r, i) => {
                    const expenseDate = r.metadata?.expense_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '-');
                    return (
                      <tr key={r.id || i} className="border-b border-gray-300">
                        <td className="border border-gray-300 py-1.5 px-1 text-center font-battambang text-gray-800">
                          {toKhmerNum(i + 1)}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2.5 text-left font-battambang font-medium text-gray-900">
                          {r.name}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-battambang text-gray-700">
                          {r.referrer || '-'}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-rajdhani text-gray-700 whitespace-nowrap">
                          {expenseDate}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2.5 text-right font-rajdhani font-semibold text-gray-900 whitespace-nowrap">
                          {Number(r.amount).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-left font-battambang text-[11px] text-gray-600">
                          {r.note || r.metadata?.voucher_no || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-600 text-gray-900">
                  <td colSpan={4} className="border border-gray-400 py-2 px-2.5 text-right font-battambang font-bold text-xs">
                    សរុបការចំណាយទាំងអស់ (Grand Total)៖
                  </td>
                  <td className="border border-gray-400 py-2 px-2.5 text-right font-rajdhani font-bold text-xs sm:text-[13.5px] text-gray-900 whitespace-nowrap">
                    {totalExpense.toLocaleString()} ៛
                  </td>
                  <td className="border border-gray-400 py-2 px-2 text-left font-battambang text-[10.5px] font-normal text-gray-700">
                    {totalExpenseInWords}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Date and Signatures Section (Clean 2-party layout like Official Financial Report) */}
          <div className="mt-8 pt-2 flex justify-between items-start font-battambang">
            {/* Left: Prepared by / Treasurer */}
            <div className="w-56 text-center flex flex-col items-center">
              <span className="text-[12px] font-semibold text-gray-900 font-battambang">
                {treasurerTitle}
              </span>
              <span className="text-[10.5px] text-gray-500 font-battambang mt-0.5">
                អ្នកធ្វើរបាយការណ៍
              </span>

              <div className="h-16 w-32 flex items-center justify-center my-0.5">
                <div className="w-24 border-b border-gray-400 border-dotted mt-8"></div>
              </div>

              <span className="text-[13px] font-moul text-gray-900 tracking-wide mt-0.5">
                {treasurerName}
              </span>
            </div>

            {/* Right: Date & Abbot approval */}
            <div className="w-64 sm:w-72 text-center flex flex-col items-center">
              <div className="text-[11px] sm:text-[12px] text-gray-800 leading-normal font-battambang">
                <div>{lunarDateText}</div>
                <div className="mt-0.5">{solarDateText}</div>
              </div>

              <span className="text-[13px] font-semibold text-gray-900 mt-1 mb-0.5 font-battambang">
                {abbotTitle}
              </span>
              <span className="text-[10.5px] text-gray-500 font-battambang">
                បានឃើញ និងឯកភាព
              </span>

              <div className="h-16 w-36 flex items-center justify-center my-0.5">
                {includeSignatureImage ? (
                  <img
                    src="/Sign.png"
                    alt="ហត្ថលេខា"
                    className="max-h-14 max-w-32 object-contain opacity-95"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-28 border-b border-gray-400 border-dotted mt-8"></div>
                )}
              </div>

              <span className="text-[14px] font-moul text-gray-900 tracking-wide mt-0.5">
                {abbotName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

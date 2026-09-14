import React, { useState, useRef } from 'react';
import { Printer, Download, X, Edit3, Check, FileSpreadsheet, Share2, Loader2, Calendar } from 'lucide-react';
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
  const [ceremonySubtitle, setCeremonySubtitle] = useState('វត្តវារីបាការាម(ហៅស្នាយដួច)');
  const [lunarDateText, setLunarDateText] = useState(`ថ្ងៃសុក្រ ៨រោច ខែស្រាពណ៍ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ${buddhistYearStr}`);
  const [solarDateText, setSolarDateText] = useState(`ធ្វើនៅវត្តស្នាយដួច, ថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`);

  const [abbotTitle, setAbbotTitle] = useState('ព្រះចៅអធិការវត្ត');
  const [abbotName, setAbbotName] = useState('ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី');
  const [committeeTitle, setCommitteeTitle] = useState('គណៈកម្មការអាចារ្យវត្ត');
  const [committeeName, setCommitteeName] = useState('បានត្រួតពិនិត្យត្រឹមត្រូវ');
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

      // Title row
      worksheet.spliceRows(1, 0, [
        ['វត្តវារីបាការាម(ហៅស្នាយដួច)'],
        [reportTitle],
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
            {language === 'en' ? 'Ceremony Expense Report (A4 Print Preview)' : 'ទម្រង់បោះពុម្ពរបាយការណ៍ចំណាយក្នុងកម្មវិធីបុណ្យ (A4)'}
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
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">ឈ្មោះវត្តអារាម / ទីកន្លែង</label>
              <input
                type="text"
                value={ceremonySubtitle}
                onChange={e => setCeremonySubtitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">កាលបរិច្ឆេទចន្ទគតិ</label>
              <input
                type="text"
                value={lunarDateText}
                onChange={e => setLunarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">កាលបរិច្ឆេទសុរិយគតិ (កន្លែងធ្វើ)</label>
              <input
                type="text"
                value={solarDateText}
                onChange={e => setSolarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-battambang"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">ព្រះចៅអធិការ (តួនាទី & នាម)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={abbotTitle}
                  onChange={e => setAbbotTitle(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={abbotName}
                  onChange={e => setAbbotName(e.target.value)}
                  className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
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
              <span>បង្ហាញហត្ថលេខា និងត្រាឌីជីថល (Digital Signature)</span>
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

      {/* A4 Printable Document Container */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center items-start">
        <div
          ref={reportRef}
          id="ceremony-expense-print-area"
          className="bg-white text-gray-900 w-full max-w-[794px] min-h-[1123px] p-8 sm:p-12 shadow-2xl rounded-sm print:shadow-none print:m-0 print:p-8 print:w-full print:max-w-none relative font-battambang"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header Section */}
          <div className="text-center mb-6">
            <h2 className="font-moul text-base text-gray-900 mb-1">
              ព្រះរាជាណាចក្រកម្ពុជា
            </h2>
            <h3 className="font-moul text-sm text-gray-800 mb-2">
              ជាតិ សាសនា ព្រះមហាក្សត្រ
            </h3>
            <div className="flex justify-center my-1">
              <span className="text-xs text-gray-500 font-battambang tracking-widest">❖ ❖ ❖</span>
            </div>

            <div className="flex items-center justify-between mt-4 border-b pb-3 border-gray-300">
              <div className="text-left font-battambang">
                <p className="font-moul text-xs text-gray-900">វត្តវារីបាការាម (ហៅស្នាយដួច)</p>
                <p className="text-[11px] text-gray-600 mt-0.5">ភូមិពន្សាំង ឃុំជើងគួន ស្រុកសំរោង ខេត្តតាកែវ</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="Wat Logo" className="w-12 h-12 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-6">
            <h1 className="font-moul text-lg sm:text-xl text-gray-900 leading-normal tracking-wide">
              {reportTitle}
            </h1>
            <p className="text-sm text-gray-700 mt-1 font-battambang font-medium">
              {categoryName}
            </p>
            <div className="flex justify-center my-1.5">
              <div className="w-24 h-0.5 bg-amber-600/70"></div>
            </div>
          </div>

          {/* Key Summary Box */}
          <div className="border border-gray-300 rounded-lg p-3.5 mb-6 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500 font-battambang">ចំនួនមុខចំណាយសរុប</p>
                <p className="text-base font-rajdhani font-bold text-gray-900 mt-0.5">{records.length} មុខ</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-battambang">សរុបថវិការចំណាយរួម</p>
                <p className="text-base font-rajdhani font-bold text-rose-700 mt-0.5">
                  ៛ {totalExpense.toLocaleString()}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-2 sm:pt-0">
                <p className="text-xs text-gray-500 font-battambang">សរុបជាអក្សរ</p>
                <p className="text-xs font-battambang font-semibold text-gray-800 mt-0.5">{totalExpenseInWords}</p>
              </div>
            </div>
          </div>

          {/* Detailed Expense Table */}
          <div className="mb-6 overflow-hidden">
            <table className="w-full border-collapse text-xs font-battambang">
              <thead>
                <tr className="border-y-2 border-black font-moul text-[11.5px] bg-gray-100/80">
                  <th className="py-2.5 px-2 text-center border border-black w-10">ល.រ</th>
                  <th className="py-2.5 px-3 text-left border border-black">មុខទំនិញ / បរិយាយការចំណាយ</th>
                  <th className="py-2.5 px-2.5 text-center border border-black w-32">អ្នកចាត់ចែង / អ្នកទិញ</th>
                  <th className="py-2.5 px-2 text-center border border-black w-24">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-3 text-right border border-black w-28 whitespace-nowrap">ចំនួនទឹកប្រាក់</th>
                  <th className="py-2.5 px-2.5 text-left border border-black w-32">កំណត់សម្គាល់</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const expenseDate = r.metadata?.expense_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '-');
                  return (
                    <tr key={r.id || i} className="border-b border-gray-300 text-[12px] leading-relaxed">
                      <td className="py-2 px-2 text-center border border-gray-400 font-rajdhani font-medium">
                        {toKhmerNum(i + 1)}
                      </td>
                      <td className="py-2 px-3 border border-gray-400 whitespace-pre-line font-medium text-gray-900">
                        {r.name}
                      </td>
                      <td className="py-2 px-2.5 text-center border border-gray-400 text-gray-700">
                        {r.referrer || '-'}
                      </td>
                      <td className="py-2 px-2 text-center border border-gray-400 font-rajdhani text-gray-600 whitespace-nowrap">
                        {expenseDate}
                      </td>
                      <td className="py-2 px-3 text-right border border-gray-400 font-rajdhani font-semibold text-gray-900 whitespace-nowrap">
                        ៛ {Number(r.amount).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 border border-gray-400 text-[11px] text-gray-600">
                        {r.note || r.metadata?.voucher_no || '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Summary Row */}
                <tr className="border-y-2 border-black font-moul text-[12.5px] bg-gray-50">
                  <td colSpan={4} className="py-2.5 px-3 text-right border border-black">
                    សរុបការចំណាយទាំងអស់៖
                  </td>
                  <td className="py-2.5 px-3 text-right border border-black font-rajdhani font-bold text-[14px] text-gray-900 whitespace-nowrap">
                    ៛ {totalExpense.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2.5 border border-black text-[11px] font-battambang font-normal">
                    {totalExpenseInWords}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Date and Signatures */}
          <div className="mt-8 pt-4">
            <div className="text-right text-xs font-battambang text-gray-800 mb-6">
              <p>{lunarDateText}</p>
              <p className="mt-0.5 font-medium">{solarDateText}</p>
            </div>

            {/* 3 Columns of Signatures */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-battambang">
              {/* Committee */}
              <div>
                <p className="font-moul text-[11px] text-gray-900">{committeeTitle}</p>
                <p className="text-[10.5px] text-gray-500 mt-0.5">បានត្រួតពិនិត្យ</p>
                <div className="h-20 flex items-center justify-center"></div>
                <p className="font-medium text-gray-800 text-[11.5px]">{committeeName}</p>
              </div>

              {/* Treasurer */}
              <div>
                <p className="font-moul text-[11px] text-gray-900">{treasurerTitle}</p>
                <p className="text-[10.5px] text-gray-500 mt-0.5">អ្នកធ្វើរបាយការណ៍</p>
                <div className="h-20 flex items-center justify-center"></div>
                <p className="font-medium text-gray-800 text-[11.5px]">{treasurerName}</p>
              </div>

              {/* Abbot */}
              <div>
                <p className="font-moul text-[11px] text-gray-900">{abbotTitle}</p>
                <p className="text-[10.5px] text-gray-500 mt-0.5">បានឃើញ និងឯកភាព</p>
                <div className="h-20 flex items-center justify-center relative">
                  {includeSignatureImage && (
                    <img
                      src="/Sign.png"
                      alt="Abbot Signature"
                      className="h-16 object-contain mix-blend-multiply opacity-90 -mt-2"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <p className="font-title text-gray-900 text-sm font-semibold">{abbotName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

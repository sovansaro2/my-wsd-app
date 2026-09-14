import React, { useState, useRef } from 'react';
import { Download, X, Edit3, Check, FileSpreadsheet, Share2, Loader2, Printer, FileText } from 'lucide-react';
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

  // Formatted date string matching screenshot (e.g. 11/09/2026, 06:42:28)
  const headerTimestamp = `${now.toLocaleDateString('en-GB')}, ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  // State for editable A5 content
  const [pagodaName, setPagodaName] = useState('វត្តវារីបាការាម (ស្នាយដួច)');
  const [reportTitle, setReportTitle] = useState('របាយការណ៍បច្ច័យ');
  const [subtitleText, setSubtitleText] = useState(`បញ្ជី ${categoryName} (${monthStr} ${yearStr})`);
  const [initialBudget, setInitialBudget] = useState<number | string>(''); // Optional initial budget (ថវិកាត្រៀមរៀបចំ)
  const [signatureDateText, setSignatureDateText] = useState(`ធ្វើនៅ វត្តស្នាយដួច ថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`);
  const [signerRole, setSignerRole] = useState('អ្នកកាន់បញ្ជី');
  const [signerName, setSignerName] = useState('ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី');

  if (!isOpen) return null;

  const totalExpense = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpenseInWords = khmerNumberToWords(totalExpense);

  const parsedInitialBudget = Number(initialBudget) || 0;
  const currentBalance = parsedInitialBudget > 0 ? parsedInitialBudget - totalExpense : totalExpense;

  // Split records into 2 balanced columns matching the 2-column layout in IMG_2855.png
  const halfCount = Math.ceil(records.length / 2);
  const col1Records = records.slice(0, halfCount);
  const col2Records = records.slice(halfCount);

  const col1Total = col1Records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const col2Total = col2Records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setDownloadingType('image');
    try {
      await new Promise(r => setTimeout(r, 200));
      const width = 560;
      const height = reportRef.current.scrollHeight;

      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2.5,
        fontEmbedCSS: FONT_EMBED_CSS,
        style: {
          width: '560px',
          margin: '0',
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      await saveReport({
        title: `របាយការណ៍បច្ច័យ_${categoryName}`,
        type: 'image/png',
        blob: blob,
      });

      downloadBlob(blob, `របាយការណ៍បច្ច័យ_${categoryName}_A5.png`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error downloading A5 image report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloadingType('pdf');
    try {
      await new Promise(r => setTimeout(r, 200));
      const width = 560;
      const height = reportRef.current.scrollHeight;

      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2,
        fontEmbedCSS: FONT_EMBED_CSS,
        style: {
          width: '560px',
          margin: '0',
        },
      });

      // Genuine A5 standard format in jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 148 mm
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      await saveReport({
        title: `របាយការណ៍បច្ច័យ_${categoryName} - PDF`,
        type: 'application/pdf',
        blob: pdfBlob,
      });

      downloadBlob(pdfBlob, `របាយការណ៍បច្ច័យ_${categoryName}_A5.pdf`);
      setShowSuccessToast(true);
      playSuccessSound();
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      console.error('Error generating A5 PDF report:', err);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportExcel = async () => {
    setDownloadingType('excel');
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('របាយការណ៍បច្ច័យ');

      worksheet.columns = [
        { header: 'ល.រ', key: 'no', width: 8 },
        { header: 'មុខទំនិញ / បរិយាយការចំណាយ', key: 'name', width: 35 },
        { header: 'អ្នកចាត់ចែង / អ្នកទិញ', key: 'referrer', width: 25 },
        { header: 'ចំនួនទឹកប្រាក់ (រៀល)', key: 'amount', width: 22 },
        { header: 'កំណត់សម្គាល់', key: 'note', width: 28 },
      ];

      // Title rows
      worksheet.spliceRows(1, 0, [
        [pagodaName],
        [reportTitle],
        [subtitleText],
        [],
      ]);

      // Add records
      records.forEach((r, idx) => {
        worksheet.addRow({
          no: idx + 1,
          name: r.name,
          referrer: r.referrer || '-',
          amount: Number(r.amount) || 0,
          note: r.note || '',
        });
      });

      // Total row
      const totalRow = worksheet.addRow({
        no: '',
        name: 'សរុបការចំណាយជាក់ស្ដែង៖',
        referrer: '',
        amount: totalExpense,
        note: totalExpenseInWords,
      });

      totalRow.font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await saveReport({
        title: `របាយការណ៍បច្ច័យ_${categoryName} - Excel`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        blob: blob,
      });

      downloadBlob(blob, `របាយការណ៍បច្ច័យ_${categoryName}.xlsx`);
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
      const width = 560;
      const height = reportRef.current.scrollHeight;
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width,
        height,
        pixelRatio: 2,
        fontEmbedCSS: FONT_EMBED_CSS,
        style: {
          width: '560px',
          margin: '0',
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      await shareOrDownloadFile(blob, `របាយការណ៍បច្ច័យ_${categoryName}_A5.png`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      {/* Print CSS specifically for standard A5 Sheet (148mm x 210mm) */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm;
          }
          body * {
            visibility: hidden !important;
          }
          #ceremony-expense-a5-sheet, #ceremony-expense-a5-sheet * {
            visibility: visible !important;
          }
          #ceremony-expense-a5-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 136mm !important;
            max-width: 136mm !important;
            min-height: 198mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Modal Card - Floating exactly like screenshot IMG_2855.png */}
      <div className="relative w-full max-w-[620px] max-h-[96vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 font-battambang">
        {/* Top Navbar Header matching IMG_2855.png */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          {/* Left: Blue Document Icon + Title + Timestamp */}
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="shrink-0 text-sky-500">
              <FileText className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white font-battambang truncate">
                របាយការណ៍បច្ច័យ_{categoryName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-rajdhani">
                {headerTimestamp}
              </p>
            </div>
          </div>

          {/* Right Action Icons matching IMG_2855.png */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Toggle Edit Controls */}
            <button
              onClick={() => setShowEditControls(!showEditControls)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="កែសម្រួលព័ត៌មាន"
            >
              <Edit3 className="w-5 h-5" />
            </button>

            {/* Quick Green Download Icon matching IMG_2855.png */}
            <button
              onClick={handleDownloadImage}
              disabled={downloadingType !== null}
              className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
              title="ទាញយករូបភាព A5 (PNG)"
            >
              {downloadingType === 'image' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>

            {/* Print A5 */}
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer hidden sm:block"
              title="បោះពុម្ពស្លឹក A5"
            >
              <Printer className="w-5 h-5" />
            </button>

            {/* Close Modal (X) */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="បិទ"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Toolstrip for PDF / Excel / Share */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-xs no-print">
          <span className="text-gray-500 dark:text-slate-400 font-rajdhani font-semibold">
            ទម្រង់ស្លឹក A5 ({records.length} មុខ • ៛ {totalExpense.toLocaleString()})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingType !== null}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              {downloadingType === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span>PDF (A5)</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={downloadingType !== null}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
            >
              {downloadingType === 'excel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
              <span>Excel</span>
            </button>
            <button
              onClick={handleShare}
              disabled={downloadingType !== null}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-lg transition-colors cursor-pointer"
            >
              {downloadingType === 'share' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
              <span>ចែករំលែក</span>
            </button>
          </div>
        </div>

        {/* Collapsible Edit Settings */}
        {showEditControls && (
          <div className="bg-slate-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700 p-3 sm:p-4 text-xs font-battambang no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">ឈ្មោះវត្ត</label>
                <input
                  type="text"
                  value={pagodaName}
                  onChange={e => setPagodaName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">ចំណងជើងរបាយការណ៍</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">ចំណងជើងរង (បញ្ជី/កាលបរិច្ឆេទ)</label>
                <input
                  type="text"
                  value={subtitleText}
                  onChange={e => setSubtitleText(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">ថវិកាត្រៀមរៀបចំ (ដើមគ្រា - ប្រសិនបើមាន)</label>
                <input
                  type="number"
                  placeholder="ឧ. 1000000"
                  value={initialBudget}
                  onChange={e => setInitialBudget(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-rajdhani"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">កាលបរិច្ឆេទចុះហត្ថលេខា</label>
                <input
                  type="text"
                  value={signatureDateText}
                  onChange={e => setSignatureDateText(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-slate-300 mb-1">អ្នកចុះហត្ថលេខា (តួនាទី & នាម)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={signerRole}
                    onChange={e => setSignerRole(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-4">
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

        {/* Scrollable View Area holding the A5 Document Sheet */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex justify-center bg-gray-50/70 dark:bg-slate-950/50">
          {/* A5 Printable Document Container - Matching IMG_2855.png exactly */}
          <div
            ref={reportRef}
            id="ceremony-expense-a5-sheet"
            className="bg-white text-gray-900 w-full max-w-[540px] shadow-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 font-battambang relative border border-gray-200/80"
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              minHeight: '760px',
            }}
          >
            {/* Header Section: Centered pagoda and report title */}
            <div className="text-center mb-4">
              <h1
                className="text-lg sm:text-xl font-bold mb-1 text-gray-900"
                style={{ fontFamily: 'Koulen, "Khmer OS Kulen", sans-serif' }}
              >
                {pagodaName}
              </h1>
              <h2 className="text-2xl sm:text-3xl font-moul mb-2 text-[#028090]">
                {reportTitle}
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 font-battambang">
                {subtitleText}
              </p>
            </div>

            {/* Horizontal Line Divider matching IMG_2855.png */}
            <div className="border-b border-gray-300 mb-4" />

            {/* Top Full-Width Rounded Box matching IMG_2855.png */}
            <div className="flex justify-between items-center bg-gray-100 p-3 sm:p-3.5 rounded-xl mb-5 font-battambang">
              <span className="text-xs sm:text-sm text-gray-800 font-medium">
                {parsedInitialBudget > 0 ? 'បច្ច័យសល់ពីមុន / ថវិកាត្រៀមរៀបចំ៖' : 'បច្ច័យសរុប ឬចំនួនមុខចំណាយក្នុងបញ្ជី៖'}
              </span>
              <span className="text-sm sm:text-base font-bold font-rajdhani text-gray-900">
                {parsedInitialBudget > 0
                  ? `${parsedInitialBudget.toLocaleString()}៛`
                  : `${toKhmerNum(records.length)} មុខ`}
              </span>
            </div>

            {/* 2-Column Grid matching IMG_2855.png */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-5">
              {/* Left Column */}
              <div className="flex flex-col">
                <h3 className="text-xs sm:text-sm font-bold text-rose-700 border-b-2 border-rose-200 pb-1 mb-2 font-battambang">
                  ប្រភពចំណាយបញ្ជី (ភាគ១) (-)
                </h3>
                <div className="space-y-2 mb-3 min-h-[160px] flex-1">
                  {col1Records.length > 0 ? (
                    col1Records.map(r => (
                      <div
                        key={r.id}
                        className="flex justify-between items-start text-xs sm:text-[13px] border-b border-gray-200 pb-1.5 pt-0.5"
                      >
                        <div className="pr-2 min-w-0">
                          <span className="text-gray-900 font-medium block truncate leading-snug">
                            {r.name}
                          </span>
                          {r.referrer && (
                            <span className="text-[10px] text-gray-500 block leading-tight">
                              ({r.referrer})
                            </span>
                          )}
                        </div>
                        <span className="text-rose-700 font-bold font-rajdhani whitespace-nowrap text-xs sm:text-sm">
                          {Number(r.amount).toLocaleString()}៛
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-xs py-4 text-center">
                      មិនមានទិន្នន័យ
                    </div>
                  )}
                </div>

                {/* Subtotal Banner Column 1 */}
                <div className="flex justify-between items-center pt-2 border-t-2 border-rose-200 bg-rose-50 p-2 sm:p-2.5 rounded-lg mt-auto font-battambang">
                  <span className="text-rose-900 text-xs font-semibold">សរុបចំណាយ៖</span>
                  <span className="text-rose-700 font-bold font-rajdhani text-xs sm:text-sm">
                    {col1Total.toLocaleString()}៛
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col">
                <h3 className="text-xs sm:text-sm font-bold text-rose-700 border-b-2 border-rose-200 pb-1 mb-2 font-battambang">
                  ប្រភពចំណាយបញ្ជី (ភាគ២) (-)
                </h3>
                <div className="space-y-2 mb-3 min-h-[160px] flex-1">
                  {col2Records.length > 0 ? (
                    col2Records.map(r => (
                      <div
                        key={r.id}
                        className="flex justify-between items-start text-xs sm:text-[13px] border-b border-gray-200 pb-1.5 pt-0.5"
                      >
                        <div className="pr-2 min-w-0">
                          <span className="text-gray-900 font-medium block truncate leading-snug">
                            {r.name}
                          </span>
                          {r.referrer && (
                            <span className="text-[10px] text-gray-500 block leading-tight">
                              ({r.referrer})
                            </span>
                          )}
                        </div>
                        <span className="text-rose-700 font-bold font-rajdhani whitespace-nowrap text-xs sm:text-sm">
                          {Number(r.amount).toLocaleString()}៛
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic text-xs py-4 text-center">
                      -
                    </div>
                  )}
                </div>

                {/* Subtotal Banner Column 2 */}
                <div className="flex justify-between items-center pt-2 border-t-2 border-rose-200 bg-rose-50 p-2 sm:p-2.5 rounded-lg mt-auto font-battambang">
                  <span className="text-rose-900 text-xs font-semibold">សរុបចំណាយ៖</span>
                  <span className="text-rose-700 font-bold font-rajdhani text-xs sm:text-sm">
                    {col2Total.toLocaleString()}៛
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Teal Banner Box matching IMG_2855.png */}
            <div className="flex justify-between items-center bg-teal-50/70 border-2 border-[#028090] p-4 sm:p-5 rounded-2xl mb-6">
              <span className="text-sm sm:text-base text-[#005F73] font-bold font-battambang">
                {parsedInitialBudget > 0 ? 'បច្ច័យសល់ជាក់ស្ដែង៖' : 'សរុបការចំណាយជាក់ស្ដែង៖'}
              </span>
              <span className="text-lg sm:text-2xl text-[#028090] font-bold font-rajdhani">
                {currentBalance.toLocaleString()}៛
              </span>
            </div>

            {/* Bottom Signature Section (Right-aligned matching IMG_2855.png) */}
            <div className="mt-8 flex justify-end text-center font-battambang text-gray-900">
              <div className="flex flex-col items-center">
                <p className="text-[11px] sm:text-xs text-gray-700 mb-2 font-medium">
                  {signatureDateText}
                </p>
                <p className="text-xs sm:text-sm font-moul text-gray-900 mb-1">
                  {signerRole}
                </p>

                <div className="h-16 sm:h-20 w-36 sm:w-44 relative my-1 flex items-center justify-center">
                  {includeSignatureImage ? (
                    <img
                      src="/Sign.png"
                      alt="ហត្ថលេខា"
                      className="max-h-14 sm:max-h-16 max-w-32 sm:max-w-40 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-28 border-b border-gray-400 border-dotted mt-8"></div>
                  )}
                </div>

                <p className="font-moul text-xs sm:text-sm text-gray-900 tracking-wide">
                  {signerName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-battambang text-sm animate-fade-in">
          <Check className="w-4 h-4" />
          <span>ទាញយក និងរក្សាទុករបាយការណ៍បានជោគជ័យ!</span>
        </div>
      )}
    </div>
  );
}

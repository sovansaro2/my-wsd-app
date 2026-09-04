import React, { useState, useRef } from 'react';
import { Printer, Download, X, Edit3, Check, Eye, EyeOff } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useLanguage } from '../contexts/LanguageContext';

interface MonthlyItem {
  month: number;
  month_name: string;
  opening_balance?: number;
  income: number;
  expense: number;
  net: number;
  cumulative_balance?: number;
}

interface FinancialSummaryData {
  selected_year: number;
  selected_quarter: string;
  available_years: number[];
  initial_starting_balance?: number;
  beginning_balance?: number;
  total_income: number;
  total_expense: number;
  period_net?: number;
  carried_adjustment?: number;
  net_balance: number;
  ending_balance?: number;
  income_count: number;
  expense_count: number;
  top_expenses: any[];
  top_incomes: any[];
  monthly_data: MonthlyItem[];
  seil_breakdown: {
    name: string;
    range?: string;
    previous_balance?: number;
    income: number;
    expense: number;
    net: number;
    ending_balance?: number;
  }[];
  total_records_count: number;
}

interface OfficialReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FinancialSummaryData;
  selectedYear: number;
  selectedQuarter: string;
}

const toKhmerNum = (num: number | string): string => {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(digit => khmerNumbers[parseInt(digit, 10)] ?? digit).join('');
};

export default function OfficialReportPrintModal({
  isOpen,
  onClose,
  data,
  selectedYear,
  selectedQuarter,
}: OfficialReportPrintModalProps) {
  const { language } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showEditControls, setShowEditControls] = useState(false);
  const [includeSignatureImage, setIncludeSignatureImage] = useState(true);
  const [includeTopHighlights, setIncludeTopHighlights] = useState(true);

  // Initialize lunar and solar dates
  const now = new Date();
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const dayStr = toKhmerNum(now.getDate().toString().padStart(2, '0'));
  const monthStr = monthsKhmer[now.getMonth()];
  const yearStr = toKhmerNum(now.getFullYear());
  const buddhistYearStr = toKhmerNum(now.getFullYear() + 544);

  const [lunarDateText, setLunarDateText] = useState(`ថ្ងៃសុក្រ ៨រោច ខែស្រាពណ៍ ឆ្នាំមមី អដ្ឋស័ក ព.ស. ${buddhistYearStr}`);
  const [solarDateText, setSolarDateText] = useState(`ត្រូវនឹងថ្ងៃទី ${dayStr} ខែ ${monthStr} ឆ្នាំ ${yearStr}`);
  const [signerTitle, setSignerTitle] = useState('ព្រះចៅអធិការស្ដីទី');
  const [signerName, setSignerName] = useState('ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី');

  if (!isOpen || !data) return null;

  // Compute period text
  const getPeriodText = () => {
    const yearKhmer = toKhmerNum(selectedYear);
    if (selectedQuarter === '1') return `ប្រចាំត្រីមាសទី ១ ឆ្នាំ ${yearKhmer} (ខែមករា ដល់ ខែមីនា)`;
    if (selectedQuarter === '2') return `ប្រចាំត្រីមាសទី ២ ឆ្នាំ ${yearKhmer} (ខែមេសា ដល់ ខែមិថុនា)`;
    if (selectedQuarter === '3') return `ប្រចាំត្រីមាសទី ៣ ឆ្នាំ ${yearKhmer} (ខែកក្កដា ដល់ ខែកញ្ញា)`;
    if (selectedQuarter === '4') return `ប្រចាំត្រីមាសទី ៤ ឆ្នាំ ${yearKhmer} (ខែតុលា ដល់ ខែធ្នូ)`;
    return `ប្រចាំឆ្នាំ ${yearKhmer} (ពេញមួយឆ្នាំ ១២ ខែ)`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      // Small delay to ensure all assets are loaded
      await new Promise(r => setTimeout(r, 200));

      const reportWidth = reportRef.current.scrollWidth || 794;
      const reportHeight = reportRef.current.scrollHeight || 1123;

      // Warmup renders
      await toPng(reportRef.current, { backgroundColor: '#ffffff', width: reportWidth, height: reportHeight, pixelRatio: 2.5 }).catch(() => {});
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: '#ffffff',
        width: reportWidth,
        height: reportHeight,
        pixelRatio: 2.5,
      });

      const link = document.createElement('a');
      link.download = `របាយការណ៍សង្ខេបហិរញ្ញវត្ថុ_${selectedYear}_Q${selectedQuarter}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating report image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base font-battambang">
            {language === 'en' ? 'Financial Report Print Preview (A4)' : 'មើលគំរូទម្រង់បោះពុម្ពរបាយការណ៍ហិរញ្ញវត្ថុ (A4)'}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400 font-rajdhani">
            ({selectedYear} • {selectedQuarter === 'all' ? '12 Months' : `Q${selectedQuarter}`})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditControls(!showEditControls)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer font-battambang"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showEditControls ? 'លាក់ការកែសម្រួល' : 'កែសម្រួលថ្ងៃខែ & ហត្ថលេខា'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer font-battambang disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'កំពុងដំណើរការ...' : 'ទាញយកជារូបភាព'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors cursor-pointer font-battambang"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>បោះពុម្ព (Print / PDF)</span>
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

      {/* Edit Controls Panel (Optional drawer) */}
      {showEditControls && (
        <div className="bg-amber-50/90 dark:bg-slate-800/95 border-b border-amber-200 dark:border-slate-700 p-4 font-battambang text-xs no-print">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">
                ថ្ងៃខែ ចន្ទគតិ (Lunar Date)
              </label>
              <input
                type="text"
                value={lunarDateText}
                onChange={e => setLunarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">
                ថ្ងៃខែ សុរិយគតិ (Solar Date)
              </label>
              <input
                type="text"
                value={solarDateText}
                onChange={e => setSolarDateText(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">
                តួនាទី
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={e => setSignerTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-slate-300 mb-1 font-medium">
                ព្រះនាម / ឈ្មោះ
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-6 pt-1 border-t border-amber-200/60 dark:border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeSignatureImage}
                  onChange={e => setIncludeSignatureImage(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span>បង្ហាញរូបហត្ថលេខា (/Sign.png)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeTopHighlights}
                  onChange={e => setIncludeTopHighlights(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span>បង្ហាញបញ្ជីប្រតិបត្តិការចម្បងៗ (កំពូល ៥)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 flex justify-center p-2 sm:p-6 md:p-8">
        <div
          ref={reportRef}
          id="official-print-document"
          className="print-section bg-white text-gray-900 w-full max-w-[820px] shadow-2xl rounded-none sm:rounded-sm p-8 sm:p-12 font-battambang relative print:shadow-none print:m-0 print:p-8"
          style={{ minHeight: '1123px', backgroundColor: '#ffffff', color: '#111827' }}
        >
          {/* ========================================================= */}
          {/* HEADER SECTION (ក្បាលលិខិតផ្លូវការ)                      */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 gap-4 items-start pb-2 border-b border-gray-800/20">
            {/* ផ្នែកខាងឆ្វេង៖ Logo វត្ត + ឈ្មោះវត្ត */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo វត្តវារីបាការាម"
                  className="w-14 h-14 object-contain"
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

            {/* ផ្នែកខាងស្ដាំ៖ ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ + Symbol Tactieng (rr2ss) */}
            <div className="flex flex-col items-center text-center">
              <span className="font-moul text-[14px] text-gray-900 leading-normal tracking-wide">
                ព្រះរាជាណាចក្រកម្ពុជា
              </span>
              <span className="font-moul text-[12px] text-gray-900 leading-normal tracking-wider mt-0.5">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </span>

              {/* Symbol Tactieng (rr2ss) */}
              <div className="mt-1 flex flex-col items-center justify-center">
                <svg
                  className="w-36 h-5 text-gray-900"
                  viewBox="0 0 160 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Left flourishes (rr) */}
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

                  {/* Center Lotus / Knot Emblem (2) */}
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

                  {/* Right flourishes (ss) */}
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

          {/* ========================================================= */}
          {/* CENTER TITLE SECTION (ចំណងជើងរបាយការណ៍កណ្ដាល)              */}
          {/* ========================================================= */}
          <div className="text-center my-6">
            <h1 className="font-moul text-[16px] sm:text-[18px] text-gray-900 leading-relaxed">
              របាយការណ៍សង្ខេបស្ថានភាពហិរញ្ញវត្ថុ ចំណូល-ចំណាយ
            </h1>
            <p className="font-battambang text-[12px] sm:text-[13px] text-gray-700 mt-1">
              {getPeriodText()}
            </p>
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: KEY FINANCIAL METRICS OVERVIEW                */}
          {/* ========================================================= */}
          <div className="grid grid-cols-4 gap-2 my-4">
            {/* Beginning Balance */}
            <div className="border border-gray-300 p-2.5 text-center">
              <span className="text-[10px] text-gray-600 block">
                សមតុល្យដើមគ្រា (Beginning)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {(data.beginning_balance || 0).toLocaleString()} ៛
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5">
                {selectedQuarter === 'all' ? 'លើកមកពីដើមឆ្នាំ' : 'លើកមកពីត្រីមាសមុន'}
              </span>
            </div>

            {/* Total Income */}
            <div className="border border-gray-300 p-2.5 text-center">
              <span className="text-[10px] text-gray-600 block">
                ចំណូលក្នុងគ្រា (Total Income)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {data.total_income.toLocaleString()} ៛
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5">
                ចំនួន {toKhmerNum(data.income_count)} ប្រតិបត្តិការ
              </span>
            </div>

            {/* Total Expense */}
            <div className="border border-gray-300 p-2.5 text-center">
              <span className="text-[10px] text-gray-600 block">
                ចំណាយក្នុងគ្រា (Total Expense)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {data.total_expense.toLocaleString()} ៛
              </span>
              <span className="text-[9px] text-gray-500 block mt-0.5">
                ចំនួន {toKhmerNum(data.expense_count)} ប្រតិបត្តិការ
              </span>
            </div>

            {/* Ending Net Balance */}
            <div className="border border-gray-400 p-2.5 text-center bg-gray-50/50">
              <span className="text-[10px] text-gray-700 block font-medium">
                សមតុល្យជាក់ស្ដែង (Ending)
              </span>
              <span className="font-rajdhani font-bold text-sm sm:text-base text-gray-900 block mt-1">
                {data.net_balance.toLocaleString()} ៛
              </span>
              <span className="text-[9px] text-gray-700 block mt-0.5 font-medium">
                {data.net_balance >= 0 ? 'សមតុល្យវិជ្ជមាន (នៅសល់)' : 'សមតុល្យអវិជ្ជមាន (ខ្វះ)'}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: MONTHLY BREAKDOWN TABLE                       */}
          {/* ========================================================= */}
          <div className="my-4">
            <h2 className="font-semibold text-[12px] text-gray-900 mb-1.5 font-battambang">
              តារាងសង្ខេបលម្អិតលំហូរសាច់ប្រាក់ប្រចាំខែ
            </h2>
            <table className="w-full border-collapse border border-gray-400 text-[10px] sm:text-[11px]">
              <thead>
                <tr className="bg-gray-100 text-gray-900 font-battambang border-b border-gray-400">
                  <th className="border border-gray-400 py-1 px-1 text-center w-8">ល.រ</th>
                  <th className="border border-gray-400 py-1 px-2 text-left">ខែ / បរិយាយ</th>
                  <th className="border border-gray-400 py-1 px-2 text-right">ដើមខែ (៛)</th>
                  <th className="border border-gray-400 py-1 px-2 text-right">ចំណូល (៛)</th>
                  <th className="border border-gray-400 py-1 px-2 text-right">ចំណាយ (៛)</th>
                  <th className="border border-gray-400 py-1 px-2 text-right">ចំណេញ/ខាត (៛)</th>
                  <th className="border border-gray-400 py-1 px-2 text-right">ចុងខែ (៛)</th>
                </tr>
              </thead>
              <tbody className="font-rajdhani">
                {data.monthly_data.map((m, idx) => (
                  <tr key={m.month} className="border-b border-gray-300">
                    <td className="border border-gray-300 py-1 px-1 text-center font-battambang">
                      {toKhmerNum(idx + 1)}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-left font-battambang text-gray-900">
                      {m.month_name}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-right text-gray-600 font-medium">
                      {(m.opening_balance ?? 0).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-right text-gray-900 font-medium">
                      {m.income.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-right text-gray-900 font-medium">
                      {m.expense.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-right font-medium text-gray-900">
                      {m.net.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 py-1 px-2 text-right font-bold text-gray-900">
                      {(m.cumulative_balance ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-600 text-gray-900">
                  <td colSpan={2} className="border border-gray-400 py-1.5 px-2 text-center font-battambang">
                    សរុបរួម (Grand Total)
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-rajdhani text-xs">
                    {(data.beginning_balance || 0).toLocaleString()} ៛
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-rajdhani text-xs">
                    {data.total_income.toLocaleString()} ៛
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-rajdhani text-xs">
                    {data.total_expense.toLocaleString()} ៛
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-rajdhani text-xs">
                    {(data.period_net ?? 0).toLocaleString()} ៛
                  </td>
                  <td className="border border-gray-400 py-1.5 px-2 text-right font-rajdhani text-xs">
                    {data.net_balance.toLocaleString()} ៛
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: TOP HIGHLIGHTS (Optional)                      */}
          {/* ========================================================= */}
          {includeTopHighlights && (
            <div className="grid grid-cols-2 gap-4 my-2.5 pt-0.5">
              {/* Top Incomes */}
              <div className="border border-gray-300 p-2">
                <span className="font-semibold text-[11px] block border-b border-gray-300 pb-1 mb-1 font-battambang">
                  ចំណូលចម្បងៗក្នុងគ្រានេះ (+)
                </span>
                {data.top_incomes && data.top_incomes.length > 0 ? (
                  <div className="space-y-0.5">
                    {data.top_incomes.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="truncate pr-2 text-gray-800">{item.description}</span>
                        <span className="font-rajdhani font-semibold shrink-0">
                          {Number(item.amount).toLocaleString()} ៛
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">មិនមានទិន្នន័យ</span>
                )}
              </div>

              {/* Top Expenses */}
              <div className="border border-gray-300 p-2">
                <span className="font-semibold text-[11px] block border-b border-gray-300 pb-1 mb-1 font-battambang">
                  ចំណាយចម្បងៗក្នុងគ្រានេះ (-)
                </span>
                {data.top_expenses && data.top_expenses.length > 0 ? (
                  <div className="space-y-0.5">
                    {data.top_expenses.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="truncate pr-2 text-gray-800">{item.description}</span>
                        <span className="font-rajdhani font-semibold shrink-0">
                          {Number(item.amount).toLocaleString()} ៛
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">មិនមានទិន្នន័យ</span>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: SIGNATURE SECTION (កន្លែងចុះហត្ថលេខា)           */}
          {/* ========================================================= */}
          <div className="mt-3 pt-1 flex justify-end items-start font-battambang">
            <div className="w-64 sm:w-72 text-center flex flex-col items-center">
              <div className="text-[11px] sm:text-[12px] text-gray-800 leading-normal font-battambang">
                <div>{lunarDateText}</div>
                <div className="mt-0.5">{solarDateText}</div>
              </div>

              <span className="text-[13px] font-semibold text-gray-900 mt-1 mb-0.5 font-battambang">
                {signerTitle}
              </span>

              {/* Signature Graphic or space */}
              <div className="h-14 w-36 flex items-center justify-center my-0.5">
                {includeSignatureImage ? (
                  <img
                    src="/Sign.png"
                    alt="ហត្ថលេខា"
                    className="max-h-12 max-w-32 object-contain opacity-95"
                  />
                ) : (
                  <div className="w-28 border-b border-gray-400 border-dotted mt-8"></div>
                )}
              </div>

              <span className="text-[14px] font-moul text-gray-900 tracking-wide mt-0.5">
                {signerName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const fs = require('fs');
let code = fs.readFileSync('src/components/Records.tsx', 'utf8');

// 1. Rename listRef to reportRef
code = code.replace(
  "const listRef = useRef<HTMLDivElement>(null);",
  "const reportRef = useRef<HTMLDivElement>(null);"
);

// 2. Update handleDownload
const oldHandleDownload = `  const handleDownload = async () => {
    if (!listRef.current || !selectedPeriod) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(listRef.current, { 
        cacheBust: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#FAFAFA',
        style: {
          padding: '24px',
          margin: '0',
          width: '100%'
        }
      });
      const link = document.createElement('a');
      link.download = \`\${selectedPeriod.name}.png\`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setIsDownloading(false);
    }
  };`;

const newHandleDownload = `  const handleDownload = async () => {
    if (!reportRef.current || !selectedPeriod) return;
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(reportRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          margin: '0',
          width: '800px'
        }
      });
      const link = document.createElement('a');
      link.download = \`របាយការណ៍បច្ច័យ_\${selectedPeriod.name}.png\`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setIsDownloading(false);
    }
  };`;

// Note: replace might fail if exact spacing doesn't match. 
// We will just replace 'listRef' with 'reportRef' everywhere in handleDownload as a fallback, but let's try regex.

code = code.replace(/const handleDownload = async \(\) => \{[\s\S]*?setIsDownloading\(false\);\n    \}\n  \};/, newHandleDownload);

// 3. Remove ref={listRef} from the UI
code = code.replace(
  '<div ref={listRef} className="space-y-3 bg-[#FAFAFA] dark:bg-slate-950 p-4 -m-4 sm:p-6 sm:-m-6 rounded-xl">',
  '<div className="space-y-3 bg-[#FAFAFA] dark:bg-slate-950 p-4 -m-4 sm:p-6 sm:-m-6 rounded-xl">'
);

// 4. Add the hidden report div right before the main return statement's closing </div>
const reportDiv = `
      {/* Hidden Report Container for Image Generation */}
      <div className="absolute top-0 left-[-9999px] opacity-0 pointer-events-none">
        <div ref={reportRef} className="bg-white p-10 font-battambang text-gray-900 w-[800px] shadow-none">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
            <h2 className="text-3xl font-moul mb-3 text-orange-600">របាយការណ៍បច្ច័យ</h2>
            <p className="text-xl font-bold">{selectedPeriod?.name} {selectedPeriod?.date_range_text ? \`(\${selectedPeriod.date_range_text})\` : ''}</p>
          </div>

          {/* Previous Balance */}
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl mb-8">
            <span className="font-bold text-xl">បច្ច័យសល់ពីសីលមុន៖</span>
            <span className="font-bold text-xl">{formatCurrency(previousBalance)}</span>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Income Section */}
            <div>
              <h3 className="font-bold text-lg text-emerald-700 border-b-2 border-emerald-200 pb-2 mb-4">ប្រភពចំណូលបញ្ចី (+)</h3>
              <div className="space-y-3 mb-4 min-h-[200px]">
                {incomeRecords.length > 0 ? incomeRecords.map(r => (
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-100 pb-2">
                    <span className="pr-4">{r.description}</span>
                    <span className="text-emerald-700 font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</span>
                  </div>
                )) : <div className="text-gray-400 italic">មិនមានទិន្នន័យចំណូល</div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-200 bg-emerald-50 p-3 rounded-lg">
                <span className="font-bold text-emerald-900">សរុបចំណូល៖</span>
                <span className="font-bold text-emerald-700 text-lg">{formatCurrency(totalIncome)}</span>
              </div>
            </div>

            {/* Expense Section */}
            <div>
              <h3 className="font-bold text-lg text-rose-700 border-b-2 border-rose-200 pb-2 mb-4">ប្រភពចំណាយបញ្ចី (-)</h3>
              <div className="space-y-3 mb-4 min-h-[200px]">
                {expenseRecords.length > 0 ? expenseRecords.map(r => (
                  <div key={r.id} className="flex justify-between text-[15px] border-b border-gray-100 pb-2">
                    <span className="pr-4">{r.description}</span>
                    <span className="text-rose-700 font-semibold whitespace-nowrap">{formatCurrency(r.amount)}</span>
                  </div>
                )) : <div className="text-gray-400 italic">មិនមានទិន្នន័យចំណាយ</div>}
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-rose-200 bg-rose-50 p-3 rounded-lg">
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
          <div className="mt-16 flex justify-between px-8 text-center text-gray-600">
            <div>
              <p className="mb-16 font-semibold">គណៈកម្មការវត្ត</p>
              <p>.......................................</p>
            </div>
            <div>
              <p className="mb-16 font-semibold">អ្នករៀបចំបញ្ជី</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>
      </div>
`;

// Insert the reportDiv just before the final '</div>\n      {/* Add Record Modal */}'
code = code.replace(
  '      </div>\n\n      {/* Add Record Modal */}',
  reportDiv + '\n      </div>\n\n      {/* Add Record Modal */}'
);

fs.writeFileSync('src/components/Records.tsx', code);

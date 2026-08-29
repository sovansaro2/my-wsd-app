const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

content = content.replace(
  'const certificateRef = useRef<HTMLDivElement>(null);',
  'const certificateRef = useRef<HTMLDivElement>(null);\n  const printRef = useRef<HTMLDivElement>(null);'
);

const downloadFunction = `
  const handlePrintDownload = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: { opacity: '1', transform: 'none' },
        cacheBust: true,
      });
      const pdf = new jsPDF({ format: 'a5', orientation: 'portrait' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (printRef.current.clientHeight * pdfWidth) / printRef.current.clientWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('banchy-sabburosochon.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('មានបញ្ហាក្នុងការទាញយក');
    } finally {
      setIsDownloading(false);
    }
  };
`;

content = content.replace(
  'const filteredRecords = records;',
  downloadFunction + '\n  const filteredRecords = records;'
);

content = content.replace(
  `onClick={() => window.print()}`,
  `onClick={handlePrintDownload}`
);

content = content.replace(
  `className="print-section no-print hidden print:block bg-white p-8"`,
  `ref={printRef} className="print-section absolute left-[-9999px] top-0 w-[559px] bg-white p-8"`
);

fs.writeFileSync('src/components/NameLists.tsx', content);

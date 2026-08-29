const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

const oldFunc = `  const handlePrintDownload = async () => {
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
  };`;

const newFunc = `  const handlePrintDownload = async () => {
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
        link.download = \`\${selectedCategory?.name || 'បញ្ជីឈ្មោះ'}.png\`;
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
  };`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync('src/components/NameLists.tsx', content);

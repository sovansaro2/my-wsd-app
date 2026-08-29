export const handleDownloadPDF = async (elementRef, filename, setIsDownloading) => {
  setIsDownloading(true);
  try {
    const dataUrl = await toPng(elementRef.current, {
      quality: 1,
      pixelRatio: 2,
      style: { opacity: '1', transform: 'none' }
    });
    const pdf = new jsPDF({ format: 'a5', orientation: 'portrait' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (elementRef.current.clientHeight * pdfWidth) / elementRef.current.clientWidth;
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF', error);
  } finally {
    setIsDownloading(false);
  }
}

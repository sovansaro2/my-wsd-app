import localforage from 'localforage';

export interface SavedReport {
  id: string;
  title: string;
  type: 'image/png' | 'image/jpeg' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  date: string;
  dataUrl?: string; // For images and PDFs if small enough, but usually we store Blob
  blob?: Blob; 
}

// Initialize a specific store for reports
const reportsStore = localforage.createInstance({
  name: 'wat-snay-duoc',
  storeName: 'reports'
});

export const saveReport = async (report: Omit<SavedReport, 'id' | 'date'>) => {
  const newReport: SavedReport = {
    ...report,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  await reportsStore.setItem(newReport.id, newReport);
  return newReport;
};

export const getReports = async (): Promise<SavedReport[]> => {
  const reports: SavedReport[] = [];
  await reportsStore.iterate((value: SavedReport) => {
    reports.push(value);
  });
  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteReport = async (id: string) => {
  await reportsStore.removeItem(id);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const shareOrDownloadFile = async (blob: Blob, filename: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: filename,
          });
          return;
        } catch (e) {
          console.log('Share failed, falling back to download', e);
        }
      }
    } catch (err) {
      console.log('File constructor or share API not supported, falling back to download', err);
    }
  }
  
  downloadBlob(blob, filename);
};

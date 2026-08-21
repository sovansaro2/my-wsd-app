import localforage from 'localforage';

export interface SavedCertificate {
  id: string;
  title: string;
  type: 'image/png';
  date: string;
  blob?: Blob;
}

// Initialize a specific store for certificates
const certificatesStore = localforage.createInstance({
  name: 'wat-snay-duoc',
  storeName: 'certificates'
});

export const saveCertificate = async (certificate: Omit<SavedCertificate, 'id' | 'date'>) => {
  const newCertificate: SavedCertificate = {
    ...certificate,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  await certificatesStore.setItem(newCertificate.id, newCertificate);
  return newCertificate;
};

export const getCertificates = async (): Promise<SavedCertificate[]> => {
  const certificates: SavedCertificate[] = [];
  await certificatesStore.iterate((value: SavedCertificate) => {
    certificates.push(value);
  });
  return certificates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteCertificate = async (id: string) => {
  await certificatesStore.removeItem(id);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const shareOrDownloadCertificate = async (blob: Blob, filename: string) => {
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

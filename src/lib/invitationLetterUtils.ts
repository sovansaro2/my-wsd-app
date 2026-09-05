import localforage from 'localforage';

export interface SavedInvitationLetter {
  id: string;
  title: string;
  recipientName: string;
  subject: string;
  date: string; // ISO date string
  formattedDate: string; // Khmer date display
  pdfBlob?: Blob;
  previewImage?: string; // base64 / dataUrl of the A5 preview
  formData?: any; // To allow re-opening and modifying the letter
  fileSize?: string;
}

// Dedicated IndexedDB store for saved invitation letters
const letterStore = localforage.createInstance({
  name: 'wat-snay-duoc',
  storeName: 'invitation-letters'
});

export const saveInvitationLetter = async (
  item: Omit<SavedInvitationLetter, 'id' | 'date'>
): Promise<SavedInvitationLetter> => {
  const newLetter: SavedInvitationLetter = {
    ...item,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  await letterStore.setItem(newLetter.id, newLetter);
  return newLetter;
};

export const getSavedInvitationLetters = async (): Promise<SavedInvitationLetter[]> => {
  const letters: SavedInvitationLetter[] = [];
  await letterStore.iterate((value: SavedInvitationLetter) => {
    letters.push(value);
  });
  return letters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteSavedInvitationLetter = async (id: string): Promise<void> => {
  await letterStore.removeItem(id);
};

export const downloadPdfBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const shareOrDownloadPdf = async (blob: Blob, filename: string) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return;
      }
    } catch (e) {
      console.warn('Share cancelled or not supported, falling back to download', e);
    }
  }
  downloadPdfBlob(blob, filename);
};

import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up object URLs when modal unmounts or closes
  useEffect(() => {
    if (!isOpen) {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      setContent('');
      setImageError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (images.length + selectedFiles.length > 5) {
      setImageError('អ្នកអាចជ្រើសរើសរូបភាពបានត្រឹមតែ ៥ សន្លឹកប៉ុណ្ណោះ');
      return;
    }
    
    setImageError('');
    const newImages = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    
    setImages((prev) => [...prev, ...newImages]);
    
    // Reset the input value so the exact same files can be re-selected if removed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
    setImageError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;
    
    setIsSubmitting(true);
    setImageError('');

    try {
      const authUserStr = localStorage.getItem('authUser');
      const authUser = authUserStr ? JSON.parse(authUserStr) : {};
      const authorName = authUser.full_name || 'Admin';

      const uploadedUrls: string[] = [];

      // Upload images to Supabase Storage
      for (const img of images) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, img.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.message.includes('security') || uploadError.message.includes('RLS')) {
            throw new Error('បញ្ហាសុវត្ថិភាព (RLS): សូមចូលទៅកាន់ Supabase Storage ដើម្បីអនុញ្ញាត (Allow INSERT) សម្រាប់ Public លើ post_images');
          }
          throw new Error('មានបញ្ហាក្នុងការបញ្ចូលរូបភាព');
        }

        const { data: publicUrlData } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const { error } = await supabase.from('posts').insert([{
        content: content,
        author_name: authorName,
        image_urls: uploadedUrls
      }]);

      if (error) {
        console.error('Insert error:', error);
        if (error.message.includes('security') || error.message.includes('RLS')) {
          throw new Error('បញ្ហាសុវត្ថិភាព (RLS): សូមចូលទៅកាន់ Supabase Database ដើម្បីអនុញ្ញាត (Allow INSERT) សម្រាប់ Public លើតារាង posts');
        }
        throw new Error('ការបង្ហោះបរាជ័យ');
      }

      // Notify FeedComponent to refresh
      window.dispatchEvent(new Event('refreshFeed'));
      onClose();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'មានបញ្ហាបច្ចេកទេសក្នុងការបង្ហោះ សូមព្យាយាមម្តងទៀត។');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-zinc-900/40 p-0 sm:p-4 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 font-battambang">បង្ហោះសកម្មភាពថ្មី</h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 font-battambang">
          <div>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full resize-none rounded-2xl border border-gray-200/60 bg-zinc-50 p-4 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all disabled:opacity-70 text-[15px]"
              placeholder="តើមានសកម្មភាពអ្វីខ្លះថ្ងៃនេះ?"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-zinc-500 uppercase tracking-widest">
                ជ្រើសរើសរូបភាព
              </label>
              <span className="text-xs text-zinc-400 font-medium bg-zinc-100 px-2 py-0.5 rounded-full">
                {images.length}/5
              </span>
            </div>
            <div className="mt-3 flex items-center">
              <label className={`flex cursor-pointer items-center space-x-2 rounded-xl border border-dashed border-gray-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:border-zinc-400 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon className="h-4 w-4 text-zinc-500" />
                <span>បន្ថែមរូបភាព</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
            </div>
            
            {imageError && (
              <p className="mt-2 text-[13px] text-rose-600">{imageError}</p>
            )}
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200/50 shadow-sm">
                    <img 
                      src={img.preview} 
                      alt={`Preview ${index}`} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="absolute right-0.5 top-0.5 rounded-full bg-red-500/90 p-0.5 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-red-600 disabled:opacity-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-5 py-2.5 text-[15px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 focus:outline-none disabled:opacity-50"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'កំពុងបង្ហោះ...' : 'បង្ហោះ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

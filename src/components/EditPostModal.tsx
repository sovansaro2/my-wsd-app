import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Post {
  id: string;
  content: string;
  image_urls?: string[] | string;
}

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImageData = 
  | { type: 'existing', url: string }
  | { type: 'new', file: File, preview: string };

export default function EditPostModal({ post, isOpen, onClose, onSuccess }: EditPostModalProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageData[]>([]);
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setContent(post.content);
      
      let existingUrls: string[] = [];
      try {
        if (typeof post.image_urls === 'string') {
          existingUrls = JSON.parse(post.image_urls || "[]");
        } else if (Array.isArray(post.image_urls)) {
          existingUrls = post.image_urls;
        }
      } catch (e) {}

      setImages(existingUrls.map(url => ({ type: 'existing', url })));
    } else {
      // Cleanup object URLs when modal closes
      images.forEach((img) => {
        if (img.type === 'new') URL.revokeObjectURL(img.preview);
      });
      setImages([]);
      setContent('');
      setImageError('');
      setIsSubmitting(false);
    }
  }, [isOpen, post]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (images.length + selectedFiles.length > 5) {
      setImageError('អ្នកអាចជ្រើសរើសរូបភាពបានត្រឹមតែ ៥ សន្លឹកប៉ុណ្ណោះ');
      return;
    }
    
    setImageError('');
    const newImages: ImageData[] = selectedFiles.map((file) => ({
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    }));
    
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const removed = newImages[index];
      if (removed.type === 'new') {
        URL.revokeObjectURL(removed.preview);
      }
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
      const finalUrls: string[] = [];

      // Process images
      for (const img of images) {
        if (img.type === 'existing') {
          finalUrls.push(img.url);
        } else {
          // Upload new image
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(fileName, img.file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('មានបញ្ហាក្នុងការបញ្ចូលរូបភាពថ្មី');
          }

          const { data: publicUrlData } = supabase.storage
            .from('post_images')
            .getPublicUrl(fileName);
            
          finalUrls.push(publicUrlData.publicUrl);
        }
      }

      // Update post in DB
      const { error } = await supabase
        .from('posts')
        .update({
          content: content,
          image_urls: finalUrls
        })
        .eq('id', post.id);

      if (error) {
        console.error('Update error:', error);
        throw new Error('ការកែប្រែបរាជ័យ');
      }

      onSuccess();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-zinc-900/40 p-0 sm:p-4 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-0 sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100/60 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 font-battambang">កែប្រែការបង្ហោះ</h2>
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
              className="w-full resize-none rounded-2xl border border-gray-200/60 bg-zinc-50 p-4 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all disabled:opacity-70 text-[15px] leading-relaxed"
              placeholder="ខ្លឹមសាររបស់អ្នក..."
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">
                រូបភាព (អតិបរមា ៥)
              </label>
              <span className="text-[12px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                {images.length}/5
              </span>
            </div>
            
            <div className="mt-1 flex items-center">
              <label className={`flex cursor-pointer items-center space-x-2 rounded-xl border border-dashed border-gray-300 bg-zinc-50 px-4 py-2.5 text-[14px] font-semibold text-zinc-700 transition-all hover:bg-zinc-100 hover:border-zinc-400 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon className="h-4 w-4 text-zinc-500" />
                <span>បន្ថែមរូបភាពថ្មី</span>
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
              <p className="mt-2 text-[13px] font-medium text-rose-600">{imageError}</p>
            )}
            
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-2.5">
                {images.map((img, index) => (
                  <div key={index} className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <img 
                      src={img.type === 'existing' ? img.url : img.preview} 
                      alt={`Preview ${index}`} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                      className="absolute right-1 top-1 rounded-full bg-zinc-900/70 p-1 text-white shadow-sm backdrop-blur-md transition-all hover:bg-rose-600 disabled:opacity-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-end space-x-3 pt-4 pb-4 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl bg-zinc-100 px-5 py-2.5 text-[14px] font-semibold text-zinc-700 transition-all hover:bg-zinc-200 focus:outline-none active:scale-[0.98] disabled:opacity-50"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
              className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុក'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

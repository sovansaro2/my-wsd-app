import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Pencil, Trash2, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import EditPostModal from './EditPostModal';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';

interface Post {
  id: string;
  author_name?: string;
  content: string;
  created_at: string;
  image_urls?: string[] | string; 
}

interface ManagePostsProps {
  onBack: () => void;
}

export default function ManagePosts({ onBack }: ManagePostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
        
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបការបង្ហោះនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setPosts(prev => prev.filter(post => post.id !== id));
      // Notify Feed to refresh
      window.dispatchEvent(new Event('refreshFeed'));
    } catch (e) {
      console.error('Error deleting post:', e);
      alert('មានបញ្ហាក្នុងការលុបការបង្ហោះ');
    } finally {
      setIsDeleting(null);
    }
  };

  const getFirstImage = (urlsData?: string[] | string) => {
    try {
      let urls: string[] = [];
      if (typeof urlsData === 'string') {
        urls = JSON.parse(urlsData || "[]");
      } else if (Array.isArray(urlsData)) {
        urls = urlsData;
      }
      return urls.length > 0 ? urls[0] : null;
    } catch (e) {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('km-KH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-battambang pb-6 relative">
      <div className="flex items-center space-x-3 p-4 sm:p-6 bg-white border-b border-gray-100/60 shadow-sm sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">គ្រប់គ្រងការបង្ហោះ</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingScreen className="h-64 bg-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
            <ImageIcon className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-zinc-500 font-medium text-[15px]">មិនមានការបង្ហោះនៅឡើយទេ</p>
        </div>
      ) : (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.map(post => {
              const firstImg = getFirstImage(post.image_urls);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={post.id} 
                  className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100/80 flex gap-4 sm:gap-5"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-50 flex-shrink-0 overflow-hidden border border-zinc-100">
                  {firstImg ? (
                    <img src={firstImg} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-[15px] font-medium text-zinc-900 line-clamp-2 leading-relaxed">
                      {post.content || <span className="text-zinc-400 italic font-normal">ការបង្ហោះគ្មានខ្លឹមសារអក្សរ</span>}
                    </p>
                    <p className="text-[12px] font-medium text-zinc-400 mt-2">{formatDate(post.created_at)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3 justify-end">
                    <button 
                      onClick={() => setEditingPost(post)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-colors text-[13px] font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>កែប្រែ</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors text-[13px] font-semibold disabled:opacity-50"
                    >
                      {isDeleting === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>លុប</span>
                    </button>
                  </div>
                </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {editingPost && (
        <EditPostModal 
          post={editingPost} 
          isOpen={true} 
          onClose={() => setEditingPost(null)} 
          onSuccess={() => {
            setEditingPost(null);
            fetchPosts();
            window.dispatchEvent(new Event('refreshFeed'));
          }}
        />
      )}
    </div>
  );
}

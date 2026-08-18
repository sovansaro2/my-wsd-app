import { useState, useEffect } from 'react';
import { UserCircle2, Clock, Image as ImageIcon, Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaRegHeart, FaHeart, FaRegComment, FaFacebook, FaTelegram, FaFacebookMessenger, FaLink } from 'react-icons/fa';
import { IoIosShareAlt } from 'react-icons/io';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingScreen } from './ui/LoadingScreen';

interface CommentData {
  id?: string;
  author: string;
  author_avatar_url?: string;
  text: string;
  created_at: string;
  likes_count?: number;
}

interface Post {
  id: string;
  author_name?: string;
  author_avatar_url?: string;
  content: string;
  created_at: string;
  image_urls?: string[] | string; 
  likes_count?: number;
  comments?: CommentData[] | string;
}

export default function FeedComponent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  // Profile Avatars Map
  const [profileAvatars, setProfileAvatars] = useState<Record<string, string>>({});

  // Modal States
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeGallery, setActiveGallery] = useState<{ urls: string[], index: number } | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<Post | null>(null);

  useEffect(() => {
    const storedLikes = localStorage.getItem('liked_posts');
    if (storedLikes) {
      try {
        setLikes(JSON.parse(storedLikes));
      } catch (e) {}
    }
    const storedCommentLikes = localStorage.getItem('liked_comments');
    if (storedCommentLikes) {
      try {
        setCommentLikes(JSON.parse(storedCommentLikes));
      } catch (e) {}
    }
  }, []);

  const fetchPosts = async () => {
    try {
      // 1. Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(30);
        
      if (postsError) throw postsError;

      // 2. Fetch Profiles for Avatars
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url');
        
      const avatarsMap: Record<string, string> = {};
      if (!profilesError && profilesData) {
        profilesData.forEach(p => {
          if (p.full_name && p.avatar_url) {
            avatarsMap[p.full_name] = p.avatar_url;
          }
        });
        setProfileAvatars(avatarsMap);
      }

      // 3. Map Avatars to Posts
      const enhancedPosts = (postsData || []).map(post => ({
        ...post,
        author_avatar_url: avatarsMap[post.author_name] || null
      }));

      setPosts(enhancedPosts);
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    const handleRefresh = () => {
      fetchPosts();
    };
    
    window.addEventListener('refreshFeed', handleRefresh);
    return () => window.removeEventListener('refreshFeed', handleRefresh);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('km-KH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async (postId: string, currentCount: number = 0) => {
    const isLiked = likes[postId];
    const newCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    
    const newLikes = { ...likes, [postId]: !isLiked };
    setLikes(newLikes);
    localStorage.setItem('liked_posts', JSON.stringify(newLikes));
    
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, likes_count: newCount } : post
      )
    );

    try {
      const { error } = await supabase
        .from('posts')
        .update({ likes_count: newCount })
        .eq('id', postId);
        
      if (error) {
        console.error('Error updating likes in Supabase:', error);
      }
    } catch (err) {
      console.error('Error in like transaction', err);
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const parseComments = (commentsData?: any): CommentData[] => {
    if (!commentsData) return [];
    if (Array.isArray(commentsData)) return commentsData;
    if (typeof commentsData === 'string') {
      try {
        const parsed = JSON.parse(commentsData);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') {
          const doubleParsed = JSON.parse(parsed);
          if (Array.isArray(doubleParsed)) return doubleParsed;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const authUserStr = localStorage.getItem('authUser');
    const authUser = authUserStr ? JSON.parse(authUserStr) : {};
    const authorName = authUser.full_name || 'Admin';

    const newComment: CommentData = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      author: authorName,
      text: text,
      created_at: new Date().toISOString(),
      likes_count: 0
    };

    const postToUpdate = posts.find(p => p.id === postId);
    const currentComments = parseComments(postToUpdate?.comments);
    const updatedComments = [...currentComments, newComment];
    
    // Optimistic UI Update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, comments: updatedComments } : post
      )
    );
    
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    // Backend Update to Supabase Database
    try {
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error updating comments in Supabase:', error);
        alert('មានបញ្ហាក្នុងការបញ្ជូនមតិទៅកាន់ Database: ' + error.message);
      }
    } catch (e) {
      console.error('Error posting comment:', e);
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    const isLiked = commentLikes[commentId];
    const newCommentLikes = { ...commentLikes, [commentId]: !isLiked };
    setCommentLikes(newCommentLikes);
    localStorage.setItem('liked_comments', JSON.stringify(newCommentLikes));

    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
    
    const currentComments = parseComments(postToUpdate.comments);
    const updatedComments = currentComments.map(c => {
      const cId = c.id || c.created_at;
      if (cId === commentId) {
        const currentCount = c.likes_count || 0;
        return { ...c, likes_count: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1 };
      }
      return c;
    });

    // Optimistic UI Update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, comments: updatedComments } : post
      )
    );

    // Backend Update
    try {
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error updating comment likes in Supabase:', error);
      }
    } catch (err) {
      console.error('Error in comment like transaction', err);
    }
  };

  const handleShare = (post: Post) => {
    setActiveSharePost(post);
  };

  const renderImageGrid = (urlsData?: string[] | string) => {
    try {
      let urls: string[] = [];
      if (typeof urlsData === 'string') {
        urls = JSON.parse(urlsData || "[]");
      } else if (Array.isArray(urlsData)) {
        urls = urlsData;
      }

      if (!urls || urls.length === 0) return null;
      const count = urls.length;
      
      const openGallery = (idx: number) => setActiveGallery({ urls, index: idx });
      const imgClass = "w-full object-cover cursor-pointer hover:opacity-95 transition-opacity";

      if (count === 1) {
        return (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
            <img loading="lazy" onClick={() => openGallery(0)} src={urls[0]} alt="Post" className={`${imgClass} h-auto max-h-[450px]`} />
          </div>
        );
      }

      if (count === 2) {
        return (
          <div className="grid grid-cols-2 gap-1.5 mt-3 rounded-xl overflow-hidden border border-gray-100">
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(0)} src={urls[0]} alt="Post 1" className={`${imgClass} aspect-[4/5]`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(1)} src={urls[1]} alt="Post 2" className={`${imgClass} aspect-[4/5]`} /></div>
          </div>
        );
      }

      if (count === 3) {
        return (
          <div className="grid grid-cols-2 gap-1.5 mt-3 rounded-xl overflow-hidden border border-gray-100">
            <div className="col-span-2"><img loading="lazy" onClick={() => openGallery(0)} src={urls[0]} alt="Post 1" className={`${imgClass} aspect-video`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(1)} src={urls[1]} alt="Post 2" className={`${imgClass} aspect-square`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(2)} src={urls[2]} alt="Post 3" className={`${imgClass} aspect-square`} /></div>
          </div>
        );
      }

      if (count === 4) {
        return (
          <div className="grid grid-cols-3 gap-1.5 mt-3 rounded-xl overflow-hidden border border-gray-100">
            <div className="col-span-3"><img loading="lazy" onClick={() => openGallery(0)} src={urls[0]} alt="Post 1" className={`${imgClass} aspect-video`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(1)} src={urls[1]} alt="Post 2" className={`${imgClass} aspect-square`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(2)} src={urls[2]} alt="Post 3" className={`${imgClass} aspect-square`} /></div>
            <div className="col-span-1"><img loading="lazy" onClick={() => openGallery(3)} src={urls[3]} alt="Post 4" className={`${imgClass} aspect-square`} /></div>
          </div>
        );
      }

      const extra = count - 5;
      return (
        <div className="grid grid-cols-6 gap-1.5 mt-3 rounded-xl overflow-hidden border border-gray-100">
          <div className="col-span-3"><img loading="lazy" onClick={() => openGallery(0)} src={urls[0]} alt="Post 1" className={`${imgClass} aspect-square`} /></div>
          <div className="col-span-3"><img loading="lazy" onClick={() => openGallery(1)} src={urls[1]} alt="Post 2" className={`${imgClass} aspect-square`} /></div>
          <div className="col-span-2"><img loading="lazy" onClick={() => openGallery(2)} src={urls[2]} alt="Post 3" className={`${imgClass} aspect-square`} /></div>
          <div className="col-span-2"><img loading="lazy" onClick={() => openGallery(3)} src={urls[3]} alt="Post 4" className={`${imgClass} aspect-square`} /></div>
          <div className="col-span-2 relative cursor-pointer group" onClick={() => openGallery(4)}>
            <img loading="lazy" src={urls[4]} alt="Post 5" className="w-full aspect-square object-cover group-hover:opacity-95 transition-opacity" />
            {extra > 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-2xl font-bold group-hover:bg-black/50 transition-colors">
                +{extra}
              </div>
            )}
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <LoadingScreen className="h-64 bg-transparent" />
    );
  }

  const activeCommentPost = activeCommentPostId ? posts.find(p => p.id === activeCommentPostId) : null;
  const activePostComments = parseComments(activeCommentPost?.comments);

  return (
    <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto pb-24 font-battambang bg-[#FAFAFA] min-h-full">
      <h2 className="mb-6 text-xl font-bold text-zinc-900 tracking-tight">សកម្មភាពថ្មីៗ</h2>
      
      {posts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white text-center border border-gray-100 p-8 shadow-sm">
          <ImageIcon className="mb-4 h-12 w-12 text-zinc-200" />
          <h3 className="text-lg font-bold text-zinc-900">មិនទាន់មានសកម្មភាពថ្មីៗទេ</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">អ្នកគ្រប់គ្រងនឹងធ្វើការបង្ហោះសកម្មភាពថ្មីៗនៅទីនេះក្នុងពេលឆាប់ៗនេះ។</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => {
              const postComments = parseComments(post.comments);
              const likeCount = post.likes_count || 0;
              const isLiked = likes[post.id];

              return (
                <motion.article 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={post.id} 
                  className="overflow-hidden rounded-2xl bg-white border border-gray-100/80 shadow-sm"
                >
                  <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 overflow-hidden">
                      {post.author_avatar_url ? (
                        <img loading="lazy" src={post.author_avatar_url} alt={post.author_name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle2 className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm leading-tight">
                        {post.author_name || 'វត្តស្នាយដួច'}
                      </h3>
                      <div className="flex items-center text-[11px] text-zinc-400 mt-0.5">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-zinc-800 whitespace-pre-wrap text-[15px] leading-relaxed">
                    {post.content}
                  </div>

                  {/* Image Grid */}
                  {renderImageGrid(post.image_urls)}

                  {/* Action Buttons Bar - Icons Only + Small Count */}
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center space-x-6 text-zinc-400">
                    {/* Like Button */}
                    <button 
                      onClick={() => handleLike(post.id, likeCount)}
                      className="flex items-center space-x-1.5 hover:text-amber-600 transition-colors focus:outline-none group"
                    >
                      {isLiked ? (
                        <FaHeart className="h-5 w-5 text-amber-600 scale-110 transition-transform" />
                      ) : (
                        <FaRegHeart className="h-5 w-5 transition-colors group-hover:scale-105" />
                      )}
                      <span className="text-[13px] font-medium text-zinc-500">
                        {likeCount > 0 ? likeCount : ''}
                      </span>
                    </button>
                    
                    {/* Comment Button */}
                    <button 
                      onClick={() => setActiveCommentPostId(post.id)}
                      className="flex items-center space-x-1.5 hover:text-zinc-700 transition-colors focus:outline-none group"
                    >
                      <FaRegComment className="h-5 w-5 transition-colors group-hover:scale-105" />
                      <span className="text-[13px] font-medium text-zinc-500">
                        {postComments.length > 0 ? postComments.length : ''}
                      </span>
                    </button>
                    
                    {/* Share Button */}
                    <button 
                      onClick={() => handleShare(post)}
                      className="flex items-center hover:text-zinc-700 transition-colors focus:outline-none group"
                    >
                      <IoIosShareAlt className="h-6 w-6 transition-colors group-hover:scale-105" />
                    </button>
                  </div>
                </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* COMMENTS MODAL (Bottom Sheet / Popup) */}
      {activeCommentPostId && activeCommentPost && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 transition-opacity font-battambang">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl h-[85vh] sm:h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-900">
                មតិយោបល់ {activePostComments.length > 0 ? `(${activePostComments.length})` : ''}
              </h3>
              <button 
                onClick={() => setActiveCommentPostId(null)} 
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activePostComments.length === 0 ? (
                 <div className="text-center text-gray-500 py-10">មិនទាន់មានមតិនៅឡើយទេ។ សូមបញ្ចេញមតិដំបូងគេ!</div>
              ) : (
                 activePostComments.map((comment, idx) => {
                    const commentId = comment.id || comment.created_at;
                    const isCommentLiked = commentLikes[commentId];
                    const commentLikesCount = comment.likes_count || 0;

                    return (
                      <div key={idx} className="flex space-x-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                          {profileAvatars[comment.author] ? (
                            <img loading="lazy" src={profileAvatars[comment.author]} alt={comment.author} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle2 className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="relative inline-block bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-2.5 text-sm">
                            <span className="font-bold text-gray-900 block text-[13px]">{comment.author}</span>
                            <p className="text-gray-800 mt-0.5 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                            
                            {/* Floating Like Count (Facebook style) */}
                            {commentLikesCount > 0 && (
                              <div className="absolute -bottom-2 -right-2 bg-white shadow-sm border border-gray-100 rounded-full px-1.5 py-0.5 flex items-center space-x-1 z-10">
                                <FaHeart className="w-[10px] h-[10px] text-red-500" />
                                <span className="text-[11px] font-medium text-gray-600 leading-none">{commentLikesCount}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Row */}
                          <div className="flex items-center space-x-4 mt-1 ml-2 text-[12px] font-medium text-gray-500">
                            <button 
                              onClick={() => handleCommentLike(activeCommentPostId, commentId)}
                              className={`transition-colors ${isCommentLiked ? 'text-blue-600 font-bold' : 'hover:text-gray-800'}`}
                            >
                              ចូលចិត្ត
                            </button>
                            <span className="text-gray-400 font-normal">
                              {new Date(comment.created_at).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                 })
              )}
            </div>

            {/* Comment Input */}
            <div className="p-3 border-t border-gray-100 bg-white z-10">
               <div className="flex items-center space-x-2">
                 <div className="relative flex-1">
                   <input
                     type="text"
                     value={commentInputs[activeCommentPostId] || ''}
                     onChange={(e) => handleCommentChange(activeCommentPostId, e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         handleCommentSubmit(activeCommentPostId);
                       }
                     }}
                     placeholder="សរសេរមតិរបស់អ្នក..."
                     className="w-full rounded-full border border-gray-200 bg-gray-100 py-2.5 pl-5 pr-12 text-[15px] text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                   />
                   <button 
                     onClick={() => handleCommentSubmit(activeCommentPostId)}
                     disabled={!commentInputs[activeCommentPostId]?.trim()}
                     className="absolute right-1.5 top-1.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-40"
                   >
                     <Send className="h-5 w-5" />
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE GALLERY MODAL */}
      {activeGallery && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col font-battambang animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 text-white absolute top-0 left-0 w-full z-20 bg-gradient-to-b from-black/60 to-transparent">
            <span className="font-medium drop-shadow-md text-sm">
              {activeGallery.index + 1} / {activeGallery.urls.length}
            </span>
            <button 
              onClick={() => setActiveGallery(null)} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6"/>
            </button>
          </div>
          
          <div className="flex-1 w-full h-full flex items-center justify-center relative">
            
            {/* Left Tap Zone */}
            <div 
              className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" 
              onClick={() => setActiveGallery(prev => prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null)}
            />
            {activeGallery.index > 0 && (
               <button 
                 onClick={() => setActiveGallery(prev => prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null)}
                 className="absolute left-4 p-2 bg-black/50 text-white rounded-full z-20 hover:bg-black/80 backdrop-blur-sm hidden sm:block"
               >
                 <ChevronLeft className="w-6 h-6" />
               </button>
            )}

            {/* Main Image */}
            <img loading="lazy" 
              src={activeGallery.urls[activeGallery.index]} 
              className="w-full h-full object-contain select-none"
              alt="Gallery Fullscreen"
            />

            {/* Right Tap Zone */}
            <div 
              className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" 
              onClick={() => setActiveGallery(prev => prev ? { ...prev, index: Math.min(prev.urls.length - 1, prev.index + 1) } : null)}
            />
            {activeGallery.index < activeGallery.urls.length - 1 && (
               <button 
                 onClick={() => setActiveGallery(prev => prev ? { ...prev, index: Math.min(prev.urls.length - 1, prev.index + 1) } : null)}
                 className="absolute right-4 p-2 bg-black/50 text-white rounded-full z-20 hover:bg-black/80 backdrop-blur-sm hidden sm:block"
               >
                 <ChevronRight className="w-6 h-6" />
               </button>
            )}
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {activeSharePost && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 transition-opacity font-battambang" onClick={() => setActiveSharePost(null)}>
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">ចែករំលែកទៅកាន់</h3>
              <button onClick={() => setActiveSharePost(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Facebook */}
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-[#1877F2] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <FaFacebook className="w-7 h-7" />
                </div>
                <span className="text-[12px] font-medium text-gray-600">Facebook</span>
              </a>
              
              {/* Messenger */}
              <a href={`fb-messenger://share/?link=${encodeURIComponent(window.location.href)}`} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00B2FF] to-[#FF5285] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <FaFacebookMessenger className="w-7 h-7" />
                </div>
                <span className="text-[12px] font-medium text-gray-600">Messenger</span>
              </a>

              {/* Telegram */}
              <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(activeSharePost.content.substring(0, 50) + '...')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-[#0088cc] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <FaTelegram className="w-7 h-7 ml-[-2px]" />
                </div>
                <span className="text-[12px] font-medium text-gray-600">Telegram</span>
              </a>

              {/* Copy Link */}
              <button onClick={() => {
                navigator.clipboard.writeText(`${activeSharePost.content}\n${window.location.href}`);
                alert('បានចម្លងតំណភ្ជាប់រួចរាល់!');
                setActiveSharePost(null);
              }} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-105 transition-all shadow-sm">
                  <FaLink className="w-6 h-6" />
                </div>
                <span className="text-[12px] font-medium text-gray-600">ចម្លងតំណ</span>
              </button>
            </div>

            {/* Native Share Fallback for Mobile */}
            {navigator.share && (
              <button 
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: 'វត្តស្នាយដួច',
                      text: activeSharePost.content,
                      url: window.location.href,
                    });
                  } catch (e) {}
                }}
                className="w-full mt-6 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-[14px]"
              >
                ជម្រើសផ្សេងទៀត...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
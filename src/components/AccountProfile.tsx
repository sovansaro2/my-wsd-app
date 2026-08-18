import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Camera, UserCircle2, Loader2, Save, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { Wallet } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AccountProfileProps {
  userRole: 'admin' | 'user' | null;
  onLogout: () => void;
  onManagePosts: () => void;
  onManageFinancials?: () => void;
  onManageNameLists?: () => void;
}

export default function AccountProfile({ userRole, onLogout, onManagePosts, onManageFinancials, onManageNameLists }: AccountProfileProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingView, setIsEditingView] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const authUserStr = localStorage.getItem('authUser');
      if (!authUserStr) return;
      
      const authUser = JSON.parse(authUserStr);
      setUserId(authUser.id);
      // Use full_name as fallback key if id is missing in schema
      const lookupKey = authUser.id ? 'id' : 'full_name';
      const lookupValue = authUser.id || authUser.full_name;
      setUserKey(lookupValue);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq(lookupKey, lookupValue)
        .single();

      if (error) throw error;
      
      if (data) {
        setFullName(data.full_name || '');
        setOriginalFullName(data.full_name || '');
        setPhone(data.phone_number || '');
        setPassword(data.password || '');
        setAvatarUrl(data.avatar_url || '');
        
        // Update local storage to stay in sync
        localStorage.setItem('authUser', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userKey) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userKey}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error('សូមប្រាកដថាអ្នកបានបង្កើត Storage Bucket ឈ្មោះ "avatars" នៅក្នុង Supabase។');
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrlData.publicUrl;
      
      const lookupKey = userId ? 'id' : 'full_name';

      // Save to profile directly upon upload
      const { data: updatedData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq(lookupKey, userKey)
        .select()
        .single();
        
      if (updateError) {
        console.error('Update Error:', updateError);
        throw new Error('បរាជ័យក្នុងការរក្សាទុកទៅកាន់ Database។ សូមប្រាកដថា RLS Policy ត្រូវបានបើក។');
      }
      
      setAvatarUrl(newAvatarUrl);
      if (updatedData) {
         localStorage.setItem('authUser', JSON.stringify(updatedData));
      }
      
      setMessage({ type: 'success', text: 'បានប្តូររូប Profile ជោគជ័យ!' });
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message || 'មានបញ្ហាក្នុងការបញ្ចូលរូបភាព។' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userKey) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const lookupKey = userId ? 'id' : 'full_name';
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phone,
          password: password
        })
        .eq(lookupKey, userKey)
        .select()
        .single();

      if (error) {
         console.error('Save error details:', error);
         throw error;
      }

      if (data) {
        // If name changed, update posts author_name and comment authors to sync
        if (fullName !== originalFullName && originalFullName) {
          try {
            await supabase.from('posts').update({ author_name: fullName }).eq('author_name', originalFullName);
            
            // Sync comments
            const { data: allPosts } = await supabase.from('posts').select('id, comments');
            if (allPosts) {
              for (const post of allPosts) {
                if (post.comments) {
                  let parsedComments = [];
                  try {
                    if (typeof post.comments === 'string') {
                      parsedComments = JSON.parse(post.comments);
                    } else if (Array.isArray(post.comments)) {
                      parsedComments = post.comments;
                    }
                  } catch (e) {}
                  
                  let hasChanges = false;
                  const updatedComments = parsedComments.map((c: any) => {
                    if (c.author === originalFullName) {
                      hasChanges = true;
                      return { ...c, author: fullName };
                    }
                    return c;
                  });
                  
                  if (hasChanges) {
                    await supabase.from('posts').update({ comments: updatedComments }).eq('id', post.id);
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to sync post/comment author names', e);
          }
        }

        localStorage.setItem('authUser', JSON.stringify(data));
        // Update userKey if full_name was changed and we use it as key
        if (!userId && data.full_name) {
           setUserKey(data.full_name);
        }
        setOriginalFullName(data.full_name || '');
        setMessage({ type: 'success', text: 'ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!' });
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: 'បរាជ័យក្នុងការរក្សាទុកព័ត៌មាន។ សូមប្រាកដថា RLS Policy ត្រូវបានបើក។' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto pb-6 font-battambang bg-[#FAFAFA] min-h-full">
        <h2 className="mb-6 text-xl font-bold text-zinc-900 tracking-tight">គណនី</h2>
        <div className="flex justify-center items-center h-48 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // --- EDIT PROFILE VIEW ---
  if (isEditingView) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] font-battambang pb-6 relative">
        <div className="flex items-center space-x-3 p-4 sm:p-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 max-w-3xl mx-auto w-full">
          <button 
            onClick={() => {
              setIsEditingView(false);
              setMessage(null);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">កែប្រែប្រវត្តិរូប</h2>
        </div>

        <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto w-full">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex flex-col items-center justify-center border-b border-gray-100">
              <div className="relative mb-3">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="text-sm font-medium text-gray-500">ចុចលើកាមេរ៉ាដើម្បីប្តូររូបភាព</p>
            </div>

            <div className="p-6">
              {message && (
                <div className={`mb-6 rounded-xl p-4 text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">ឈ្មោះពេញ</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">លេខទូរស័ព្ទ</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">ពាក្យសម្ងាត់</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកែប្រែ'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN ACCOUNT VIEW ---
  return (
    <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto pb-6 font-battambang bg-[#FAFAFA] min-h-full">
      <h2 className="mb-6 text-xl font-bold text-zinc-900 tracking-tight">គណនី</h2>
      
      {/* Profile Summary Header */}
      <div className="flex items-center space-x-4 mb-8 bg-white p-5 rounded-3xl border border-gray-100/80 shadow-sm">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center border border-gray-200/50 flex-shrink-0">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
           ) : (
             <UserCircle2 className="w-10 h-10 text-zinc-400" />
           )}
        </div>
        <div className="flex-1 min-w-0">
           <h3 className="text-lg font-bold text-zinc-900 truncate">{fullName || 'អ្នកប្រើប្រាស់'}</h3>
           <p className="text-sm text-zinc-500 truncate">{phone || 'មិនមានលេខទូរស័ព្ទ'}</p>
           <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded-full">
             {userRole === 'admin' ? 'អ្នកគ្រប់គ្រង (Admin)' : 'អ្នកប្រើប្រាស់ (User)'}
           </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mb-6">
         <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 ml-2">ប្រវត្តិរូប</h4>
         <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsEditingView(true)} 
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50 transition-colors focus:outline-none group"
            >
               <div className="flex items-center space-x-3.5">
                  <div className="bg-zinc-50 p-2.5 rounded-xl text-zinc-600 border border-gray-100">
                    <UserCircle2 className="w-5 h-5"/>
                  </div>
                  <span className="text-[15px] font-semibold text-zinc-800">មើលប្រវត្តិរូប និងកែប្រែ</span>
               </div>
               <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </button>
         </div>
      </div>

      {/* Settings Section (Admin Only) */}
      {userRole === 'admin' && (
      <div className="mb-8">
         <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 ml-2">ការកំណត់</h4>
         <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden flex flex-col divide-y divide-gray-50">
            <button 
              onClick={onManagePosts} 
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50 transition-colors focus:outline-none group"
            >
               <div className="flex items-center space-x-3">
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <Settings className="w-5 h-5"/>
                  </div>
                  <span className="text-[15px] font-bold text-gray-700">គ្រប់គ្រងការបង្ហោះ</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={onManageFinancials} 
              className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors focus:outline-none"
            >
               <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Wallet className="w-5 h-5"/>
                  </div>
                  <span className="text-[15px] font-bold text-gray-700">គ្រប់គ្រងបញ្ជីចំណូល-ចំណាយ</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={onManageNameLists} 
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors focus:outline-none"
            >
               <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <FileText className="w-5 h-5"/>
                  </div>
                  <span className="text-[15px] font-bold text-gray-700">គ្រប់គ្រងបញ្ជីផ្សេងៗ</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
         </div>
      </div>
      )}

      {/* Logout */}
      <button 
        onClick={onLogout} 
        className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-3.5 rounded-xl border border-red-200 font-bold hover:bg-red-100 transition-colors focus:outline-none"
      >
         <LogOut className="w-5 h-5" />
         <span className="text-[15px]">ចាកចេញពីគណនី</span>
      </button>
    </div>
  );
}

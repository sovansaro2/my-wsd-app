import React, { useState } from 'react';
import { api } from '../lib/apiClient';

const generateEmailFromUsername = (username: string) => {
  const normalized = username.trim().replace(/\s+/g, ' ').toLowerCase();
  const hex = Array.from(new TextEncoder().encode(normalized))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex}@wsd.local`;
};

export default function AuthComponent({ onLogin }: { onLogin: (role: 'admin' | 'user') => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    if (username.trim().length < 2) {
      setError('ឈ្មោះអ្នកប្រើប្រាស់ត្រូវមានយ៉ាងហោចណាស់ ២ តួអក្សរ។');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ។');
      setIsLoading(false);
      return;
    }
    
    const fakeEmail = generateEmailFromUsername(username);
    
    try {
      if (isLogin) {
        // Login Flow
        const data = await api.login(fakeEmail, password);
        localStorage.setItem('access_token', data.access_token);
        onLogin((data.user?.role) || 'user');
      } else {
        // Sign Up Flow
        await api.signup(fakeEmail, password, username.trim());
        setSuccess('បង្កើតគណនីបានជោគជ័យ! លោកអ្នកអាចចូលគណនីបានហើយ។');
        setIsLogin(true);
        setPassword('');
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។';
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        setError('ឈ្មោះនេះមានអ្នកប្រើប្រាស់រួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង។');
      } else if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('អុីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ')) {
        setError('ឈ្មោះ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។');
      } else {
        setError(errorMsg);
      }
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4 font-battambang">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/50">
        <div className="mb-8 text-center">
          <h2 className="mb-2 font-title text-3xl text-zinc-900 tracking-wide" style={{ fontFamily: 'Koulen, cursive' }}>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</h2>
          <h3 className="text-zinc-400 text-sm tracking-widest uppercase">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ</h3>
        </div>
        
        <h3 className="mb-6 text-xl font-bold text-zinc-800 text-center">
          {isLogin ? 'ចូលគណនីរបស់អ្នក' : 'បង្កើតគណនីថ្មី'}
        </h3>
        
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-[13px] text-rose-600 border border-rose-100/50">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-[13px] text-emerald-600 border border-emerald-100/50">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[14px] font-semibold text-zinc-700 tracking-wide">
              ឈ្មោះអ្នកប្រើប្រាស់
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
              placeholder="បញ្ចូលឈ្មោះរបស់អ្នក"
            />
          </div>
          
          <div>
            <label className="mb-1.5 block text-[14px] font-semibold text-zinc-700 tracking-wide">ពាក្យសម្ងាត់</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
              placeholder="បញ្ចូលពាក្យសម្ងាត់ (យ៉ាងហោច ៦ ខ្ទង់)"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-2xl bg-zinc-900 px-4 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
          >
            {isLoading ? 'កំពុងដំណើរការ...' : (isLogin ? 'ចូលគណនី' : 'ចុះឈ្មោះ')}
          </button>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[14px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors block w-full"
          >
            {isLogin ? 'មិនទាន់មានគណនីមែនទេ? ចុះឈ្មោះថ្មី' : 'មានគណនីរួចហើយ? ចូលគណនី'}
          </button>
          
          {isLogin && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[13px] text-zinc-500 mb-1">ភ្លេចពាក្យសម្ងាត់ ឬមានបញ្ហាក្នុងការចូលប្រើ?</p>
              <a 
                href="https://t.me/sovansaro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[14px] font-bold text-[#2AABEE] hover:text-[#229ED9] transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.2-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.97 1.25-5.55 3.67-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.67-1.12.87-1.12 1.05 0 .2.04.38.11.53.11.13.33.29.58.5z"/>
                </svg>
                ទំនាក់ទំនង Admin តាម Telegram
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
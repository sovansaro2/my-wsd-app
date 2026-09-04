import React, { useState } from 'react';
import { api } from '../lib/apiClient';

const generateEmailFromUsername = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase();
  
  // If the user entered an actual email address, use it directly
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return normalized;
  }
  
  // Otherwise, treat it as a custom username and encode it
  const spaced = normalized.replace(/\s+/g, ' ');
  const hex = Array.from(new TextEncoder().encode(spaced))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex}@wsd.local`;
};

export default function AuthComponent({ onLogin }: { onLogin: (role: 'admin' | 'user') => void }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Sign up fields
  const [khmerName, setKhmerName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [email, setEmail] = useState('');
  
  // Shared field
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isLogin) {
        // Login Flow
        if (loginIdentifier.trim().length < 2) {
          setError('សូមបញ្ចូលអ៊ីម៉ែល ឬឈ្មោះអ្នកប្រើប្រាស់ឱ្យបានត្រឹមត្រូវ។');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ។');
          setIsLoading(false);
          return;
        }

        const loginEmail = generateEmailFromUsername(loginIdentifier);
        const data = await api.login(loginEmail, password);
        localStorage.setItem('access_token', data.access_token);
        onLogin((data.user?.role) || 'user');
      } else {
        // Sign Up Flow
        if (khmerName.trim().length < 2) {
          setError('ឈ្មោះខ្មែរត្រូវមានយ៉ាងហោចណាស់ ២ តួអក្សរ។');
          setIsLoading(false);
          return;
        }
        if (latinName.trim().length < 2) {
          setError('ឈ្មោះឡាតាំងត្រូវមានយ៉ាងហោចណាស់ ២ តួអក្សរ (Latin name must be at least 2 characters)។');
          setIsLoading(false);
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError('សូមបញ្ចូលអ៊ីម៉ែលដែលត្រឹមត្រូវ (ឧ. example@gmail.com)។');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ។');
          setIsLoading(false);
          return;
        }

        await api.signup(email.trim().toLowerCase(), password, khmerName.trim(), latinName.trim());
        setSuccess('បង្កើតគណនីបានជោគជ័យ! លោកអ្នកអាចចូលគណនីបានហើយ។');
        setLoginIdentifier(email.trim().toLowerCase());
        setIsLogin(true);
        setPassword('');
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។';
      if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('User already registered')) {
        setError('អ៊ីម៉ែលនេះមានអ្នកចុះឈ្មោះរួចហើយ សូមប្រើអ៊ីម៉ែលផ្សេង ឬចូលគណនី។');
      } else if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ')) {
        setError('អ៊ីម៉ែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។');
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
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-8 border border-gray-100/80">
        {/* Header with Temple Logo */}
        <div className="mb-6 text-center">
          <img 
            src="/logo.png" 
            alt="វត្តស្នាយដួច" 
            className="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <h2 className="mb-1.5 font-title text-[19px] min-[375px]:text-[21px] sm:text-2xl text-zinc-900 whitespace-nowrap tracking-tight" style={{ fontFamily: 'Koulen, cursive' }}>
            កម្មវិធីគ្រប់គ្រងទិន្នន័យ វត្តស្នាយដួច
          </h2>
          <h3 className="text-zinc-400 text-sm font-battambang">ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ</h3>
        </div>
        
        <h3 className="mb-6 text-lg font-medium text-zinc-800 text-center font-battambang">
          {isLogin ? 'ចូលគណនីរបស់អ្នក' : 'បង្កើតគណនីថ្មី'}
        </h3>
        
        {error && (
          <div className="mb-5 rounded-2xl bg-rose-50/80 p-4 text-[13.5px] text-rose-600 border border-rose-100 font-battambang leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-2xl bg-emerald-50/80 p-4 text-[13.5px] text-emerald-700 border border-emerald-100 font-battambang leading-relaxed">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            /* Login Form */
            <>
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">
                  អ៊ីម៉ែល ឬ ឈ្មោះអ្នកប្រើប្រាស់
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-battambang"
                  placeholder="បញ្ចូលអ៊ីម៉ែល ឬឈ្មោះអ្នកប្រើប្រាស់"
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">ពាក្យសម្ងាត់</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-rajdhani"
                  placeholder="បញ្ចូលពាក្យសម្ងាត់"
                />
              </div>
            </>
          ) : (
            /* Sign Up Form with 4 requested fields */
            <>
              {/* 1. ឈ្មោះខ្មែរ */}
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">
                  ឈ្មោះខ្មែរ
                </label>
                <input
                  type="text"
                  required
                  value={khmerName}
                  onChange={(e) => setKhmerName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-battambang"
                  placeholder="ឧ. រ៉ាវី ឬ វត្តស្នាយដួច"
                />
              </div>

              {/* 2. ឈ្មោះឡាតាំង */}
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">
                  ឈ្មោះឡាតាំង
                </label>
                <input
                  type="text"
                  required
                  value={latinName}
                  onChange={(e) => setLatinName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-rajdhani"
                  placeholder="e.g. Ravi or Wat Snay Duoc"
                />
              </div>

              {/* 3. អ៊ីម៉ែល */}
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">
                  អ៊ីម៉ែល
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-rajdhani"
                  placeholder="example@gmail.com"
                />
              </div>

              {/* 4. ពាក្យសម្ងាត់ */}
              <div>
                <label className="mb-1.5 block text-[14px] text-zinc-700 font-battambang">
                  ពាក្យសម្ងាត់
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/80 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-[15px] font-rajdhani"
                  placeholder="បញ្ចូលពាក្យសម្ងាត់ (យ៉ាងហោច ៦ ខ្ទង់)"
                />
              </div>
            </>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-2xl bg-zinc-900 border border-zinc-900 px-4 py-3.5 text-white transition-all hover:bg-zinc-800 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[15px] font-battambang"
          >
            {isLoading ? 'កំពុងដំណើរការ...' : (isLogin ? 'ចូលគណនី' : 'ចុះឈ្មោះ')}
          </button>
        </form>

        <div className="mt-7 space-y-4 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[14px] text-zinc-600 hover:text-zinc-900 transition-colors block w-full font-battambang"
          >
            {isLogin ? 'មិនទាន់មានគណនីមែនទេ? ចុះឈ្មោះថ្មី' : 'មានគណនីរួចហើយ? ចូលគណនី'}
          </button>
          
          {isLogin && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[13px] text-zinc-500 mb-1.5 font-battambang">ភ្លេចពាក្យសម្ងាត់ ឬមានបញ្ហាក្នុងការចូលប្រើ?</p>
              <a 
                href="https://t.me/sovansaro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[14px] text-[#2AABEE] hover:text-[#229ED9] transition-colors inline-flex items-center justify-center gap-1.5 font-battambang"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
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

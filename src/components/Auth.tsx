import React from 'react';
import { useState } from 'react';
import { api } from '../lib/apiClient';

export default function AuthComponent({ onLogin }: { onLogin: (role: 'admin' | 'user') => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
        // Login Flow - Custom Backend
        const data = await api.login(email, password);
        localStorage.setItem('access_token', data.access_token);
        onLogin((data.user?.role) || 'user');
      } else {
        // Sign Up Flow - Custom Backend
        await api.signup(email, password, fullName, phone);
        setSuccess('បង្កើតគណនីបានជោគជ័យ! លោកអ្នកអាចចូលគណនីបានហើយ។');
        setIsLogin(true);
        setPhone('');
        setFullName('');
        setPassword('');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។');
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
          <h2 className="mb-2 font-title text-3xl text-zinc-900 tracking-wide" style={{ fontFamily: 'Koulen, cursive' }}>វត្តស្នាយដួច</h2>
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
            <label className="mb-1.5 block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">
              អ៉ីមែល (Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
              placeholder="បញ្ចូលអ៉ីមែល"
            />
          </div>
          
          {!isLogin && (
            <>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">ឈ្មោះពេញ</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
                  placeholder="បញ្ចូលឈ្មោះពេញ"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">លេខទូរស័ព្ទ</label>
                <input
                  type="tel"
                  required={!isLogin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
                  placeholder="បញ្ចូលលេខទូរស័ព្ទ"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-zinc-500 uppercase tracking-wide">ពាក្យសម្ងាត់</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-200/60 bg-zinc-50 px-4 py-3.5 text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all text-[15px]"
              placeholder="បញ្ចូលពាក្យសម្ងាត់"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-2xl bg-zinc-900 px-4 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
          >
            {isLoading ? 'កំពុងដំណើរការ...' : (isLogin ? 'ចូលគណនី' : 'បង្កើតគណនី')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[13px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isLogin ? 'មិនទាន់មានគណនីមែនទេ? បង្កើតគណនីថ្មី' : 'មានគណនីរួចហើយ? ចូលគណនី'}
          </button>
        </div>
      </div>
    </div>
  );
}
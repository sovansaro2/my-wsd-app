import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight
} from 'lucide-react';
import { 
  CloudDataIllustration, 
  AnalyticsIllustration, 
  DocumentIllustration 
} from './WelcomeIllustrations';

const generateEmailFromUsername = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase();
  
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return normalized;
  }
  
  const spaced = normalized.replace(/\s+/g, ' ');
  const hex = Array.from(new TextEncoder().encode(spaced))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex}@wsd.local`;
};

interface SlideItem {
  id: number;
  title: string;
  tagline: string;
  description: string;
  illustration: React.ReactNode;
  highlights: string[];
}

const ONBOARDING_SLIDES: SlideItem[] = [
  {
    id: 0,
    title: 'គ្រប់គ្រងទិន្នន័យវត្តស្នាយដួច',
    tagline: 'ប្រព័ន្ធផ្ទៃក្នុង វត្តស្នាយដួច',
    description: 'រៀបចំ និងរក្សាទុកទិន្នន័យវត្តអារាមប្រកបដោយសុវត្ថិភាព និងភាពងាយស្រួល។',
    illustration: <CloudDataIllustration className="w-60 h-52 sm:w-72 sm:h-64 mx-auto drop-shadow-xl" />,
    highlights: ['ទិន្នន័យមានសុវត្ថិភាព', 'រក្សាទុកស្វ័យប្រវត្ត', 'ប្រើប្រាស់គ្រប់ឧបករណ៍']
  },
  {
    id: 1,
    title: 'របាយការណ៍បច្ច័យ និងហិរញ្ញវត្ថុ',
    tagline: 'កត់ត្រា និងផ្ទៀងផ្ទាត់ច្បាស់លាស់',
    description: 'កត់ត្រាចំណូល-ចំណាយ បច្ច័យសីល និងបញ្ជីឈ្មោះសប្បុរសជនបានត្រឹមត្រូវ។',
    illustration: <AnalyticsIllustration className="w-60 h-52 sm:w-72 sm:h-64 mx-auto drop-shadow-xl" />,
    highlights: ['កត់ត្រាបច្ច័យសីល និងចំណាយ', 'តារាងស្ថិតិច្បាស់លាស់', 'ផ្ទៀងផ្ទាត់ទិន្នន័យបានរហ័ស']
  },
  {
    id: 2,
    title: 'លិខិតរដ្ឋបាល និងឯកសារវត្ត',
    tagline: 'ចេញលិខិតផ្លូវការ និងទាញយកជា PDF',
    description: 'រៀបចំលិខិតអញ្ជើញ លិខិតថ្លែងអំណរគុណ និងឯកសាររដ្ឋបាលវត្តបានឆាប់រហ័ស។',
    illustration: <DocumentIllustration className="w-60 h-52 sm:w-72 sm:h-64 mx-auto drop-shadow-xl" />,
    highlights: ['ទម្រង់លិខិតរដ្ឋបាលស្ដង់ដារ', 'ក្បាលលិខិតផ្លូវការ', 'ទាញយកជា PDF ភ្លាមៗ']
  }
];

export default function AuthComponent({ onLogin }: { onLogin: (role: 'admin' | 'user') => void }) {
  const [showMobileOnboarding, setShowMobileOnboarding] = useState(() => {
    try {
      return localStorage.getItem('has_seen_welcome_v1') !== 'true';
    } catch {
      return true;
    }
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loginIdentifier, setLoginIdentifier] = useState(() => {
    try {
      return localStorage.getItem('saved_login_identifier') || '';
    } catch {
      return '';
    }
  });
  
  const [khmerName, setKhmerName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [email, setEmail] = useState('');
  
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    try {
      localStorage.setItem('has_seen_welcome_v1', 'true');
    } catch {}
    setShowMobileOnboarding(false);
  };

  const handleReopenOnboarding = () => {
    setCurrentSlide(0);
    setShowMobileOnboarding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isLogin) {
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
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        if (rememberMe) {
          try {
            localStorage.setItem('saved_login_identifier', loginIdentifier.trim());
          } catch {}
        } else {
          try {
            localStorage.removeItem('saved_login_identifier');
          } catch {}
        }

        onLogin((data.user?.role) || 'user');
      } else {
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
          setError('សូមបញ្ចូលអ៊ីម៉ែលដែលត្រឹមត្រូវ។');
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

  const currentSlideData = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8FAFC] font-battambang text-zinc-900 flex flex-col justify-center">
      {showMobileOnboarding && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[#028090] text-white overflow-hidden">
          <div className="relative flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#005F73] via-[#028090] to-[#0A9396] select-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10 flex items-center justify-between pt-2">
              {currentSlide > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="ត្រឡប់ក្រោយ"
                  className="p-2 -ml-2 text-white/90 hover:text-white transition-colors active:scale-90"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
              ) : (
                <div className="w-8" />
              )}

              <button
                type="button"
                onClick={finishOnboarding}
                className="text-white/80 hover:text-white text-[15px] font-battambang px-2 py-1 transition-colors active:opacity-75"
              >
                រំលង
              </button>
            </div>

            <div className="relative z-10 my-auto flex items-center justify-center py-4">
              <div className="transition-all duration-500 transform">
                {currentSlideData.illustration}
              </div>
            </div>

            <div className="h-2" />
          </div>

          <div className="relative z-20 bg-white text-zinc-900 rounded-t-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <div>
              <h2 className="font-title text-[22px] leading-tight text-zinc-900 text-center mb-1 tracking-tight" style={{ fontFamily: 'Koulen, cursive' }}>
                {currentSlideData.title}
              </h2>
              <p className="text-[#028090] text-center text-[13.5px] font-medium mb-3 font-battambang">
                {currentSlideData.tagline}
              </p>

              <p className="text-zinc-600 text-center text-[14px] leading-relaxed font-battambang max-w-sm mx-auto mb-6">
                {currentSlideData.description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-6">
                {ONBOARDING_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 transition-all duration-300 rounded-full ${
                      currentSlide === idx 
                        ? 'w-7 bg-[#028090]' 
                        : 'w-2 bg-zinc-200 hover:bg-zinc-300'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextSlide}
                className="w-full py-4 px-6 rounded-2xl bg-[#028090] hover:bg-[#026b78] active:scale-[0.98] text-white font-battambang text-[16px] font-medium shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>{currentSlide === ONBOARDING_SLIDES.length - 1 ? 'ចាប់ផ្តើមឥឡូវនេះ' : 'បន្ទាប់'}</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto md:p-6 lg:p-8 min-h-[100dvh] md:min-h-0 flex items-center justify-center">
        <div className="w-full bg-white md:rounded-[32px] md:shadow-sm md:border md:border-zinc-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[100dvh] md:min-h-[640px]">
          
          <div className="hidden md:flex md:col-span-6 lg:col-span-7 bg-gradient-to-br from-[#005F73] via-[#028090] to-[#014F5A] text-white p-8 lg:p-12 flex-col justify-between relative overflow-hidden select-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <img 
                  src="/logo.png" 
                  alt="វត្តស្នាយដួច" 
                  className="w-16 h-16 sm:w-[72px] sm:h-[72px] object-contain drop-shadow-md"
                />
                <div>
                  <h1 className="font-title text-[22px] sm:text-[24px] leading-none text-white tracking-wide mb-1" style={{ fontFamily: 'Koulen, cursive' }}>
                    វត្តស្នាយដួច
                  </h1>
                  <span className="text-white/80 text-[13.5px] font-battambang">
                    ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ
                  </span>
                </div>
              </div>

              <div className="text-white/70 text-[13px] font-rajdhani tracking-wider">
                <span>v1.2.0</span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-8">
              <div className="mb-6 flex items-center justify-center">
                {currentSlideData.illustration}
              </div>

              <div className="text-center max-w-md mx-auto">
                <h2 className="font-title text-2xl lg:text-3xl text-white mb-2 leading-tight tracking-tight" style={{ fontFamily: 'Koulen, cursive' }}>
                  {currentSlideData.title}
                </h2>
                <p className="text-cyan-200 text-sm font-medium mb-3 font-battambang">
                  {currentSlideData.tagline}
                </p>
                <p className="text-white/80 text-[14px] leading-relaxed font-battambang mb-6">
                  {currentSlideData.description}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {currentSlideData.highlights.map((item, i) => (
                    <span 
                      key={i}
                      className="text-xs text-white/90 border border-white/20 rounded-full px-3 py-1 font-battambang backdrop-blur-sm"
                    >
                      • {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                {ONBOARDING_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Show slide ${idx + 1}`}
                    className={`h-2 transition-all duration-300 rounded-full ${
                      currentSlide === idx 
                        ? 'w-8 bg-white shadow-sm' 
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  disabled={currentSlide === 0}
                  className="p-2 text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70 transition-colors"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-6 lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
            
            <div className="flex items-center justify-between md:justify-end pb-2">
              <div className="md:hidden flex items-center gap-2">
                <img src="/logo.png" alt="វត្តស្នាយដួច" className="w-8 h-8 object-contain" />
                <span className="font-title text-base text-zinc-900" style={{ fontFamily: 'Koulen, cursive' }}>
                  វត្តស្នាយដួច
                </span>
              </div>

              <button
                type="button"
                onClick={handleReopenOnboarding}
                className="text-xs text-[#028090] hover:text-[#005F73] transition-colors font-battambang inline-flex items-center py-1 px-3 rounded-full border border-[#028090]/20 hover:border-[#028090]/40"
              >
                <span>មើលការណែនាំ</span>
              </button>
            </div>

            <div className="my-auto py-4 max-w-sm w-full mx-auto">
              
              <div className="text-center mb-6">
                <div className="inline-block p-1 mb-2.5">
                  <img 
                    src="/logo.png" 
                    alt="វត្តស្នាយដួច" 
                    className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-sm" 
                  />
                </div>
                
                <h2 className="font-title text-2xl sm:text-[26px] text-zinc-900 tracking-tight mb-1" style={{ fontFamily: 'Koulen, cursive' }}>
                  {isLogin ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ' : 'បង្កើតគណនីថ្មី'}
                </h2>
                <p className="text-zinc-500 text-[13.5px] font-battambang">
                  {isLogin ? 'សូមបញ្ចូលព័ត៌មានគណនីដើម្បីបន្ត' : 'បំពេញព័ត៌មានដើម្បីចុះឈ្មោះក្នុងប្រព័ន្ធ'}
                </p>
              </div>

              <div className="p-1 bg-zinc-100 rounded-2xl flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2.5 text-center text-[14px] font-medium rounded-xl transition-all font-battambang ${
                    isLogin 
                      ? 'bg-white text-[#028090] shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  ចូលគណនី
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2.5 text-center text-[14px] font-medium rounded-xl transition-all font-battambang ${
                    !isLogin 
                      ? 'bg-white text-[#028090] shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  ចុះឈ្មោះ
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[13.5px] leading-relaxed font-battambang">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13.5px] leading-relaxed font-battambang">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isLogin ? (
                  <>
                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        អ៊ីម៉ែល ឬ ឈ្មោះអ្នកប្រើប្រាស់
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="បញ្ចូលអ៊ីម៉ែល ឬឈ្មោះគណនី"
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-battambang"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        ពាក្យសម្ងាត់
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់"
                          className="w-full rounded-2xl border border-zinc-200 bg-white pl-4 pr-11 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-rajdhani"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-[#028090] focus:ring-[#028090] border-zinc-300 accent-[#028090]"
                        />
                        <span className="text-[13px] text-zinc-600 font-battambang">ចងចាំខ្ញុំ</span>
                      </label>

                      <a
                        href="https://t.me/sovansaro"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#028090] hover:underline font-battambang"
                      >
                        ភ្លេចលេខសម្ងាត់?
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        ឈ្មោះខ្មែរ
                      </label>
                      <input
                        type="text"
                        required
                        value={khmerName}
                        onChange={(e) => setKhmerName(e.target.value)}
                        placeholder="បញ្ចូលឈ្មោះខ្មែរ"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-battambang"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        ឈ្មោះឡាតាំង (Latin Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={latinName}
                        onChange={(e) => setLatinName(e.target.value)}
                        placeholder="បញ្ចូលឈ្មោះឡាតាំង"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-rajdhani"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        អ៊ីម៉ែល
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="បញ្ចូលអ៊ីម៉ែល"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-rajdhani"
                      />
                    </div>

                    <div>
                      <label className="block text-[13.5px] font-medium text-zinc-700 mb-1.5 font-battambang">
                        ពាក្យសម្ងាត់
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់"
                          className="w-full rounded-2xl border border-zinc-200 bg-white pl-4 pr-11 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-[#028090] focus:outline-none focus:ring-2 focus:ring-[#028090]/10 transition-all font-rajdhani"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-4 px-6 rounded-2xl bg-[#028090] hover:bg-[#026b78] active:scale-[0.98] text-white font-battambang text-[15.5px] font-medium shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>កំពុងដំណើរការ...</span>
                  ) : (
                    <>
                      <span>{isLogin ? 'ចូលប្រើប្រាស់' : 'ចុះឈ្មោះបង្កើតគណនី'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <a 
                  href="https://t.me/sovansaro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[13px] text-zinc-500 hover:text-[#028090] transition-colors inline-flex items-center justify-center gap-1.5 font-battambang"
                >
                  <span>ជំនួយបច្ចេកទេស ៖</span>
                  <span className="text-[#2AABEE] font-medium hover:underline">ទាក់ទង Admin តាម Telegram</span>
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 text-center text-xs text-zinc-400 font-battambang leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រងផ្ទៃក្នុង វត្តស្នាយដួច · សម្រាប់តែអ្នកទទួលសិទ្ធិប្រើប្រាស់
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

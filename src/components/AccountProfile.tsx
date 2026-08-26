import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Camera, UserCircle2, Lock as LockIcon, KeyRound, Loader2, Save, ChevronRight, ArrowLeft, FileText, Wallet, Globe, Palette, Info, X, Crown, Copy, ShieldCheck, Check, User } from 'lucide-react';
import PinPad from './PinPad';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';


interface AccountProfileProps {
  userRole: 'admin' | 'user' | null;
  actualRole?: 'admin' | 'user' | null;
  onViewModeChange?: (mode: 'admin' | 'user') => void;
  onLogout: () => void;
  
  onManageFinancials?: () => void;
  onManageNameLists?: () => void;
  onManageUsers?: () => void;
  onCertificates?: () => void;
}

export default function AccountProfile({ userRole, actualRole, onViewModeChange, onLogout, onManageFinancials, onManageNameLists, onManageUsers, onCertificates }: AccountProfileProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [originalFullName, setOriginalFullName] = useState('');
    const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // PIN states
  const [hasBalancePin, setHasBalancePin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState<'verify_current' | 'enter_new' | 'confirm_new' | 'forgot_pin_verify'>('enter_new');
  const [authPassword, setAuthPassword] = useState('');
  const [tempNewPin, setTempNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');
  const [isPinSettingLoading, setIsPinSettingLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingView, setIsEditingView] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (password.length < 6) {
      setPasswordError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('ពាក្យសម្ងាត់មិនដូចគ្នា');
      return;
    }
    
    try {
      setIsPasswordLoading(true);
      setPasswordError('');
      await api.updateProfile({ password });
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'បានផ្លាស់ប្ដូរពាក្យសម្ងាត់ដោយជោគជ័យ' });
    } catch (err: any) {
      setPasswordError(err.message || 'មានបញ្ហាក្នុងការផ្លាស់ប្ដូរពាក្យសម្ងាត់');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  const handlePinSetupComplete = async (pin: string) => {
    if (pinSetupStep === 'verify_current') {
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        await api.verifyBalancePin(pin);
        setCurrentPin(pin);
        setPinSetupStep('enter_new');
      } catch (err: any) {
        setPinSetupError(err.message || 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ');
      } finally {
        setIsPinSettingLoading(false);
      }
    } else if (pinSetupStep === 'enter_new') {
      setTempNewPin(pin);
      setPinSetupStep('confirm_new');
    } else if (pinSetupStep === 'confirm_new') {
      if (pin !== tempNewPin) {
        setPinSetupError('PIN មិនដូចគ្នា');
        setPinSetupStep('enter_new');
        setTempNewPin('');
        return;
      }
      
      try {
        setIsPinSettingLoading(true);
        setPinSetupError('');
        
        if (currentPin) {
          await api.updateBalancePin(pin, currentPin);
        } else if (authPassword) {
          await api.resetBalancePin(pin, authPassword);
        } else {
          await api.updateBalancePin(pin);
        }
        
        setHasBalancePin(true);
        setShowPinSetup(false);
        setMessage({ type: 'success', text: 'បានកំណត់ PIN ដោយជោគជ័យ' });
        setAuthPassword('');
        setCurrentPin('');
      } catch (err: any) {
        setPinSetupError(err.message || 'មានបញ្ហាក្នុងការកំណត់ PIN');
      } finally {
        setIsPinSettingLoading(false);
      }
    }
  };


  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await api.getMe();
      if (!profile) return;
      
      setUserId(profile.id);
      setUserKey(profile.id);
      
      setFullName(profile.full_name || '');
      setOriginalFullName(profile.full_name || '');
            setHasBalancePin(!!profile.has_balance_pin);
      setAvatarUrl(profile.avatar_url || '');
    } catch (error) {
      console.log('Could not fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const { publicUrl } = await api.uploadAvatar(file);
      setAvatarUrl(publicUrl);
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
    if (!userId) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const updates: any = {
        full_name: fullName,
              };
      
      if (password && password.trim() !== '') {
         updates.password = password;
      }
      
      await api.updateProfile(updates);

      setOriginalFullName(fullName);
      setMessage({ type: 'success', text: 'រក្សាទុកទិន្នន័យជោគជ័យ!' });
      setIsEditingView(false);
      setPassword('');

    } catch (err: any) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: err.message || 'មានបញ្ហាក្នុងការរក្សាទុក។' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto pb-6 font-battambang bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 min-h-full">
        <h2 className="mb-6 text-xl font-bold text-zinc-900 tracking-tight">{t('nav_account')}</h2>
        <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // --- EDIT PROFILE VIEW ---
  if (isEditingView) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 font-battambang pb-6 relative">
        <div className="flex items-center space-x-3 p-4 sm:p-6 bg-white dark:bg-slate-950 transition-colors duration-200 border-b border-gray-100 dark:border-slate-800 shadow-sm sticky top-0 z-10 max-w-3xl mx-auto w-full">
          <button 
            onClick={() => {
              setIsEditingView(false);
              setMessage(null);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('profile_edit_title')}</h2>
        </div>

        <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto w-full">
          <div className="rounded-2xl bg-white dark:bg-slate-900 transition-colors duration-200 shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
              <div className="relative mb-3">
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
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
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('profile_edit_photo')}</p>
            </div>

            <div className="p-6">
              {message && (
                <div className={`mb-6 rounded-xl p-4 text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t('profile_full_name')}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  <span>{isSaving ? t('profile_saving') : t('profile_save_changes')}</span>
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
    <div className="p-4 sm:p-6 md:max-w-3xl md:mx-auto pb-24 font-battambang bg-[#F8F9FD] dark:bg-slate-950 transition-colors duration-200 min-h-full">
      
      {/* Profile Summary Card */}
      <div className="relative mb-8 mt-2 bg-white dark:bg-slate-900 transition-colors duration-200 rounded-[2rem] border border-gray-100/80 dark:border-slate-800/80 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-none">
        {/* Soft decorative background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-100 dark:bg-purple-900/30 rounded-tl-full opacity-60 dark:opacity-40"></div>
        <div className="absolute top-6 right-8 grid grid-cols-4 gap-2 opacity-10 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-900 dark:bg-indigo-300"></div>
          ))}
        </div>

        {actualRole === 'admin' && onViewModeChange && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => onViewModeChange(userRole === 'admin' ? 'user' : 'admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-sm text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 transition-colors font-battambang"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              {userRole === 'admin' ? 'ប្តូរទៅ User' : 'ប្តូរទៅ Admin'}
            </button>
          </div>
        )}

        <div className="relative p-6 flex items-center space-x-5 z-10 pt-10">
          <div className="relative">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-zinc-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm flex-shrink-0 relative z-10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-12 h-12 text-zinc-300" />
              )}
            </div>
            {/* Outline ring effect around avatar */}
            <div className="absolute inset-[-4px] rounded-full border border-indigo-100/80 z-0"></div>
            
            <button 
              onClick={() => setIsEditingView(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-900 transition-colors duration-200 rounded-full flex items-center justify-center shadow-md border border-gray-100 dark:border-slate-800 z-20 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 focus:outline-none transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-1.5">{fullName || 'អ្នកប្រើប្រាស់'}</h3>
            
            <div className="inline-flex items-center space-x-1.5 bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-[13px] font-semibold border border-orange-100/50">
              <span>{userRole === 'admin' ? t('profile_role_admin') : t('profile_role_user')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mb-4">
        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 pl-1">{t('profile_title')}</h4>
        <div className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50 dark:border-slate-800/50 dark:shadow-none overflow-hidden">
          <button 
            onClick={() => setIsEditingView(true)} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-50/70 p-2.5 rounded-xl text-indigo-600">
                <UserCircle2 className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_view_edit')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>

      
      {/* Others Section */}
      <div className="mb-4">
        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 pl-1">{t('profile_others')}</h4>
        <div className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50 dark:border-slate-800/50 dark:shadow-none overflow-hidden flex flex-col divide-y divide-gray-50 dark:divide-slate-800/50">
          <button 
            onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-50/80 p-2.5 rounded-xl text-indigo-600">
                <Globe className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_change_lang')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{language === 'km' ? t('lang_khmer') : t('lang_english')}</span>
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </button>
          
          <button onClick={() => setIsThemeModalOpen(true)} className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50/80 p-2.5 rounded-xl text-purple-600">
                <Palette className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_change_theme')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>

          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-sky-50/80 p-2.5 rounded-xl text-sky-600">
                <Info className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">{t('profile_about')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="mb-4 mt-8">
        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 pl-1">សុវត្ថិភាព</h4>
        <div className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50 dark:border-slate-800/50 dark:shadow-none overflow-hidden flex flex-col divide-y divide-gray-50 dark:divide-slate-800/50">
          <button 
            onClick={() => {
              if (hasBalancePin) {
                setPinSetupStep('verify_current');
              } else {
                setPinSetupStep('enter_new');
              }
              setTempNewPin('');
              setCurrentPin('');
              setPinSetupError('');
              setShowPinSetup(true);
            }} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none text-left"
          >
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <LockIcon className="w-4 h-4 text-orange-500"/>
                <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">PIN មើលទឹកប្រាក់</span>
              </div>
              <span className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 ml-6">ការពារការបង្ហាញទឹកប្រាក់របស់អ្នក</span>
            </div>
            <div className="flex items-center space-x-2">
              {hasBalancePin ? (
                <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">បានកំណត់</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">មិនទាន់បានកំណត់</span>
              )}
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </button>
        
          <button 
            onClick={() => {
              setPassword('');
              setConfirmPassword('');
              setPasswordError('');
              setShowPasswordModal(true);
            }} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none text-left"
          >
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-blue-500"/>
                <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">ពាក្យសម្ងាត់</span>
              </div>
              <span className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 ml-6">ផ្លាស់ប្ដូរពាក្យសម្ងាត់គណនីរបស់អ្នក</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">ប្ដូរ</span>
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </button>
        </div>
      </div>
{/* Settings Section */}
      {userRole === 'admin' && (
      <div className="mb-4">
        <h4 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 pl-1">{t('profile_settings')}</h4>
        <div className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/50 dark:border-slate-800/50 dark:shadow-none overflow-hidden flex flex-col divide-y divide-gray-50 dark:divide-slate-800/50">
          <button 
            onClick={onCertificates} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-orange-50/80 p-2.5 rounded-xl text-orange-600">
                <FileText className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">លិខិតថ្លែងអំណរគុណ</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>

          
          <button 
            onClick={onManageUsers} 
            className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50/80 p-2.5 rounded-xl text-purple-600">
                <User className="w-5 h-5"/>
              </div>
              <span className="text-[15px] font-bold text-gray-800 dark:text-slate-200">គ្រប់គ្រងអ្នកប្រើប្រាស់</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>
      )}

      <button 
        onClick={onLogout}
        className="mt-6 w-full flex items-center justify-center space-x-2 p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors focus:outline-none"
      >
        <LogOut className="w-5 h-5" />
        <span>{t('profile_logout')}</span>
      </button>

      {/* About App Modal */}

      {/* Theme Modal */}
      <>
      {isThemeModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsThemeModalOpen(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 transition-colors duration-200 dark:bg-slate-900 rounded-[24px] max-w-sm w-full p-6 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={() => setIsThemeModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 font-battambang">{t('profile_change_theme')}</h3>

            <div className="space-y-4 font-battambang">
              <button 
                onClick={() => { setCurrentTheme('light'); setIsThemeModalOpen(false); }}
                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${currentTheme === 'light' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-colors duration-200 dark:bg-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Light Mode (ភ្លឺ)</span>
                </div>
                {currentTheme === 'light' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
              </button>
              
              <button 
                onClick={() => { setCurrentTheme('dark'); setIsThemeModalOpen(false); }}
                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${currentTheme === 'dark' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-colors duration-200 dark:bg-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white dark:bg-slate-900 transition-colors duration-200 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Dark Mode (ងងឹត)</span>
                  </div>
                </div>
                {currentTheme === 'dark' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </>

      <>
      {isAboutModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAboutModalOpen(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 transition-colors duration-200 dark:bg-slate-900 rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 sm:p-8 flex flex-col items-center text-center overflow-y-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <Info className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Khmer OS Kulen', 'Koulen', cursive" }}>កម្មវិធីគ្រប់គ្រងទិន្នន័យ(វត្តស្នាយដួច)</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 flex-shrink-0">{t('about_version')} 1.1.0</p>
              
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 w-full text-left space-y-3 mb-6 flex-shrink-0">
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium mb-1">{t('about_purpose')}</p>
                  <p className="text-[14px] text-gray-800 dark:text-slate-200">{t('about_purpose_desc')}</p>
                </div>
                <div className="h-px bg-gray-200 w-full"></div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium mb-1">{t('about_dev')}</p>
                  <p className="text-[14px] font-bold text-indigo-600">ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី</p>
                </div>
                <div className="h-px bg-gray-200 w-full"></div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium mb-1">{t('about_tech')}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">React</span>
                    <span className="text-[11px] font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md">Tailwind CSS</span>
                    <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">TypeScript</span>
                    <span className="text-[11px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">Vite</span>
                    <span className="text-[11px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-md">Supabase</span>
                    <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">NodeJS</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="w-full py-3.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-2xl font-bold text-[15px] hover:bg-gray-200 transition-colors focus:outline-none flex-shrink-0"
              >
                {t('about_close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </>


      <>
        {showPinSetup && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPinSetup(false);
                setPinSetupStep('enter_new');
                setTempNewPin('');
                setCurrentPin('');
                setPinSetupError('');
              }}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4"
            >
              <PinPad
                title={pinSetupStep === 'verify_current' ? 'បញ្ជាក់ PIN ចាស់' : pinSetupStep === 'enter_new' ? 'កំណត់ PIN ថ្មី' : 'បញ្ជាក់ PIN ថ្មី'}
                subtitle={pinSetupStep === 'verify_current' ? 'សូមបញ្ចូល PIN ចាស់របស់អ្នក' : pinSetupStep === 'enter_new' ? 'សូមបញ្ចូល PIN ថ្មី ៤ ខ្ទង់' : 'សូមបញ្ចូល PIN ថ្មីម្ដងទៀត ដើម្បីបញ្ជាក់'}
                error={pinSetupError}
                onComplete={handlePinSetupComplete}
                onCancel={() => {
                  setShowPinSetup(false);
                  setPinSetupStep('enter_new');
                  setTempNewPin('');
                  setCurrentPin('');
                  setPinSetupError('');
                }}
                isLoading={isPinSettingLoading}
              />
            </motion.div>
          </div>
        )}
      </>

      {/* Change Password Modal */}
      <AnimatePresence>
      {showPasswordModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPasswordModal(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end sm:justify-center sm:p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <h3 className="font-bold text-[17px] text-gray-900 dark:text-white">ផ្លាស់ប្ដូរពាក្យសម្ងាត់</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-2 -mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {passwordError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">ពាក្យសម្ងាត់ថ្មី</label>
                  <input
                    type="password"
                    value={password}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <button
                onClick={handlePasswordChange}
                disabled={isPasswordLoading || !password || !confirmPassword}
                className="w-full mt-6 py-3.5 px-4 bg-indigo-600 text-white rounded-2xl font-bold text-[15px] hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុកការផ្លាស់ប្ដូរ'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

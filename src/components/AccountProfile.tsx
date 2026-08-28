import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, Camera, Pencil, Calendar, UserCircle2, Lock as LockIcon, KeyRound, Loader2, Save, ChevronRight, ArrowLeft, FileText, Wallet, Globe, Palette, Info, X, Crown, Copy, ShieldCheck, Check, User, Users, Sun, Moon } from 'lucide-react';
import PinPad from './PinPad';
import CustomDatePicker from './ui/CustomDatePicker';
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

  const [familyName, setFamilyName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [userCode, setUserCode] = useState('WSD-0810');

  
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
  const [isEditable, setIsEditable] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
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
      setFamilyName(profile.family_name || '');
      setGivenName(profile.given_name || '');
      setGender(profile.gender || 'Male');
      setDateOfBirth(profile.date_of_birth || '');
      setAddress(profile.address || '');
      setPhoneNumber(profile.phone_number || '');
      setEmail(profile.email || '');
      setUserCode(profile.user_code || (profile.id ? `WSD-${profile.id.replace(/-/g, '').substring(0, 4).toUpperCase()}` : 'WSD-0810'));

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
      const combinedFullName = [familyName.trim(), givenName.trim()].filter(Boolean).join(' ') || fullName.trim();
      const updates: any = {
        full_name: combinedFullName,
        family_name: familyName.trim() || null,
        given_name: givenName.trim() || null,
        gender: gender,
        date_of_birth: dateOfBirth && dateOfBirth.trim() !== '' ? dateOfBirth.trim() : null,
        address: address.trim() || null,
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        user_code: userCode || null
      };

      if (password && password.trim() !== '') {
        updates.password = password;
      }
      
      const res = await api.updateProfile(updates);

      if (res) {
        if (res.full_name) {
          setFullName(res.full_name);
          setOriginalFullName(res.full_name);
        } else if (combinedFullName) {
          setFullName(combinedFullName);
          setOriginalFullName(combinedFullName);
        }
        if (res.family_name !== undefined) setFamilyName(res.family_name || '');
        if (res.given_name !== undefined) setGivenName(res.given_name || '');
        if (res.date_of_birth !== undefined) setDateOfBirth(res.date_of_birth || '');
        if (res.gender) setGender(res.gender);
        if (res.phone_number !== undefined) setPhoneNumber(res.phone_number || '');
        if (res.address !== undefined) setAddress(res.address || '');
        if (res.user_code !== undefined) setUserCode(res.user_code || 'WSD-0810');
      }

      setMessage({ type: 'success', text: 'រក្សាទុកទិន្នន័យជោគជ័យ!' });
      setIsEditable(false);
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
        <h2 className="mb-6 text-xl  text-zinc-900 ">{t('nav_account')}</h2>
        <div className="flex justify-center items-center h-48 bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  
  // --- EDIT PROFILE VIEW ---
  if (isEditingView) {
    return (
      <div className="flex flex-col h-full bg-[#f4f6f8] dark:bg-slate-950 transition-colors duration-200 font-sans pb-10 overflow-y-auto">
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm sticky top-0 z-10 w-full">
          <button 
            onClick={() => {
              setIsEditingView(false);
              setIsEditable(false);
              setMessage(null);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg  text-gray-900 dark:text-white">Profile</h2>
          
          {actualRole === 'admin' && onViewModeChange && (
            <div className="ml-auto">
              <button
                onClick={() => onViewModeChange(userRole === 'admin' ? 'user' : 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs  text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                <UserCircle2 className="w-3.5 h-3.5" />
                {userRole === 'admin' ? 'ប្តូរទៅ User' : 'ប្តូរទៅ Admin'}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-slate-800">
            {/* Header with Avatar and Name */}
            <div className="p-6 sm:p-8 border-b border-gray-200/80 dark:border-slate-800/80">
              <div className="flex items-center space-x-6">
                <div className="relative w-[88px] h-[88px] rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex-shrink-0 group">
                  {isUploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80">
                      <Loader2 className="w-6 h-6 animate-spin text-[#1d70b8]" />
                    </div>
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-slate-800">
                      <UserCircle2 className="w-12 h-12 text-zinc-300" />
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 inset-x-0 h-[19px] bg-slate-900/30 hover:bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center cursor-pointer transition-colors z-10">
                    <Camera className="w-3 h-3 text-white drop-shadow-sm stroke-[2]" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-[20px] sm:text-[22px] font-normal text-gray-900 dark:text-white truncate font-title ">
                    {fullName || 'No Name'}
                  </h3>
                  <p className="text-[13px] font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                    My ID: {userCode || 'WSD-0810'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8">
              {message && (
                <div className={`mb-6 rounded-lg p-3 sm:p-4 text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {message.text}
                </div>
              )}
              
              <h4 className="text-[16px]  text-gray-900 dark:text-white mb-6">Personal Details</h4>
              
              <div className="space-y-4">
                {/* Family Name */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Family Name</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="គោត្តនាម"
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Given Name */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Given Name</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={givenName}
                      onChange={(e) => setGivenName(e.target.value)}
                      placeholder="នាម"
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Date of Birth</label>
                  <div className="w-full relative">
                    <CustomDatePicker disabled={!isEditable} value={dateOfBirth} onChange={setDateOfBirth} placeholder="ថ្ងៃ/ខែ/ឆ្នាំ" 
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Gender</label>
                  <div className="w-full relative">
                    <select disabled={!isEditable} value={gender === 'Female' || gender === 'ស្រី' ? 'Female' : 'Male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white focus:border-[#1d70b8] outline-none transition-colors appearance-none cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="Male" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">ប្រុស</option>
                      <option value="Female" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">ស្រី</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Address (ទីលំនៅ) */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Address</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ទីលំនៅ"
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Email</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="អ៊ីម៉ែល"
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px]  text-gray-400 dark:text-slate-400">Phone Number</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="tel" value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="លេខទូរស័ព្ទ"
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                {!isEditable ? (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setIsEditable(true); }}
                    className="px-8 py-2.5 bg-[#1d70b8] hover:bg-[#16568d] text-white rounded-full  text-[13px]  shadow-sm transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    កែប្រែ
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-[#1d70b8] hover:bg-[#16568d] text-white rounded-full  text-[14px] shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px]"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុកប្រវត្តិរូប'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN ACCOUNT VIEW ---
  return (
    <div className="p-2 sm:p-6 max-w-xl mx-auto pb-24 font-battambang bg-white dark:bg-slate-950 transition-colors duration-200 min-h-full">
      
      {/* Main Account Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden transition-all">
        
        {/* Top Header */}
        <div className="p-6 sm:p-8 flex items-center gap-5 sm:gap-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-slate-100 dark:bg-slate-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <img 
                src="/logo.png" 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            
            {/* Bottom translucent camera bar overlay */}
            <label className="absolute bottom-0 inset-x-0 h-6 sm:h-7 bg-white/40 dark:bg-black/30 hover:bg-white/60 dark:hover:bg-black/50 backdrop-blur-[1px] flex items-center justify-center cursor-pointer transition-colors border-t border-white/20">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-800 dark:text-gray-200" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 dark:text-white truncate font-title  leading-normal">
              {fullName || 'វត្តស្វាយដួច'}
            </h2>
            <p className="text-[13px] sm:text-sm font-medium text-gray-500 dark:text-slate-400 mt-0.5">
              My ID: {userCode || 'WSD-0810'}
            </p>
          </div>
        </div>

        {/* Top Separator Line */}
        <div className="h-[1px] bg-gray-200 dark:bg-slate-800 w-full" />

        {/* Menu Items */}
        <div className="py-1">
          {/* SECTION 1: គណនី & ពាក្យសម្ងាត់ និងសុវត្ថិភាព */}
          <div>
            {/* គណនី */}
            <button
              onClick={() => setIsEditingView(true)}
              className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5">
                <User className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                  {t('profile_account_menu')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors" />
            </button>

            {/* ពាក្យសម្ងាត់ និងសុវត្ថិភាព */}
            <button
              onClick={() => setShowSecurityModal(true)}
              className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5">
                <ShieldCheck className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                  {t('profile_security_menu')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors" />
            </button>
          </div>

          {/* Separator */}
          <div className="h-[1px] bg-gray-200/80 dark:bg-slate-800 w-full my-1.5" />

          {/* SECTION 2: ការកំណត់: */}
          <div className="px-6 pt-2 pb-1">
            <span className="text-[13.5px]  text-[#1d70b8] dark:text-blue-400 font-battambang">
              {t('profile_settings_heading')}
            </span>
          </div>

          {/* ផ្លាស់ប្ដូរភាសា */}
          <button
            onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
            className="w-full flex items-center justify-between px-6 py-3 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <Globe className="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                {t('profile_change_lang')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
                {language === 'km' ? 'ភាសាខ្មែរ' : 'English'}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </button>

          {/* ផ្លាស់ប្ដូរស្បែក */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="w-full flex items-center justify-between px-6 py-3 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <Palette className="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                {t('profile_change_theme')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
                {currentTheme === 'dark' ? t('theme_dark') : t('theme_light')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </button>

          {/* Separator */}
          <div className="h-[1px] bg-gray-200/80 dark:bg-slate-800 w-full my-1.5" />

          {/* SECTION 3: ការគ្រប់គ្រង: */}
          <div className="px-6 pt-2 pb-1">
            <span className="text-[13.5px]  text-[#1d70b8] dark:text-blue-400 font-battambang">
              {t('profile_mgmt_heading')}
            </span>
          </div>

          {/* លិខិតផ្សេងៗ */}
          <button
            onClick={onCertificates}
            className="w-full flex items-center justify-between px-6 py-3 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <FileText className="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                {t('profile_certificates')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* គ្រប់គ្រងអ្នកប្រើប្រាស់ */}
          <button
            onClick={onManageUsers}
            className="w-full flex items-center justify-between px-6 py-3 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <Users className="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                {t('profile_users')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Separator */}
          <div className="h-[1px] bg-gray-200/80 dark:bg-slate-800 w-full my-1.5" />

          {/* SECTION 4: អំពីកម្មវិធី & ចាកចេញ */}
          {/* អំពីកម្មវិធី */}
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <Info className="w-5 h-5 text-gray-700 dark:text-slate-200" />
              <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                {t('profile_about')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* ចាកចេញពីគណនី */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-red-50/70 dark:hover:bg-red-950/20 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-[15px]  text-red-600 dark:text-red-400 font-battambang">
                {t('profile_logout')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Security Options Modal */}
      <AnimatePresence>
      {showSecurityModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSecurityModal(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 dark:border-slate-800 font-battambang"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                <h3 className="text-lg  text-gray-900 dark:text-white">{t('profile_security_modal_title')}</h3>
              </div>
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Change Password */}
              <button
                onClick={() => {
                  setShowSecurityModal(false);
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setShowPasswordModal(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('profile_change_password_title')}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('profile_change_password_desc')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              {/* Option 2: PIN Balance */}
              <button
                onClick={() => {
                  setShowSecurityModal(false);
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
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <LockIcon className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('profile_pin_balance_title')}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {hasBalancePin ? t('profile_pin_balance_set') : t('profile_pin_balance_unset')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* About App Modal */}

      {/* Theme Modal */}
      <AnimatePresence>
      {isThemeModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsThemeModalOpen(false)}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-[300px] w-full p-4 shadow-xl border border-gray-100 dark:border-slate-800 relative font-battambang"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-[15px] font-medium text-gray-900 dark:text-white">{t('profile_theme_modal_title')}</h3>
              <button 
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => { setCurrentTheme('light'); setIsThemeModalOpen(false); }}
                className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl border text-left transition-all ${currentTheme === 'light' ? 'border-[#1d70b8] bg-blue-50/50 dark:bg-blue-950/20 text-[#1d70b8] dark:text-blue-400' : 'border-gray-200/80 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-slate-200'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className={`w-4 h-4 ${currentTheme === 'light' ? 'text-[#1d70b8]' : 'text-amber-500'}`} />
                  <span className="text-sm font-medium">{t('profile_theme_light_label')}</span>
                </div>
                {currentTheme === 'light' && (
                  <div className="w-2 h-2 rounded-full bg-[#1d70b8]"></div>
                )}
              </button>
              
              <button 
                onClick={() => { setCurrentTheme('dark'); setIsThemeModalOpen(false); }}
                className={`w-full flex justify-between items-center px-3 py-2.5 rounded-xl border text-left transition-all ${currentTheme === 'dark' ? 'border-[#1d70b8] bg-blue-50/50 dark:bg-blue-950/20 text-[#1d70b8] dark:text-blue-400' : 'border-gray-200/80 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-slate-200'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className={`w-4 h-4 ${currentTheme === 'dark' ? 'text-[#1d70b8]' : 'text-indigo-400'}`} />
                  <span className="text-sm font-medium">{t('profile_theme_dark_label')}</span>
                </div>
                {currentTheme === 'dark' && (
                  <div className="w-2 h-2 rounded-full bg-[#1d70b8]"></div>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

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
              <h3 className=" text-xl text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Khmer OS Kulen', 'Koulen', cursive" }}>កម្មវិធីគ្រប់គ្រងទិន្នន័យ វត្តស្នាយដួច</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 flex-shrink-0">{t('about_version')} 1.1.0</p>
              
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 w-full text-left space-y-3 mb-6 flex-shrink-0">
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium mb-1">{t('about_purpose')}</p>
                  <p className="text-[14px] text-gray-800 dark:text-slate-200">{t('about_purpose_desc')}</p>
                </div>
                <div className="h-px bg-gray-200 w-full"></div>
                <div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 font-medium mb-1">{t('about_dev')}</p>
                  <p className="text-[14px]  text-indigo-600">ភិក្ខុ សុវណ្ណសរោ រីម រ៉ាវី</p>
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
                className="w-full py-3.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-2xl  text-[15px] hover:bg-gray-200 transition-colors focus:outline-none flex-shrink-0"
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
              <h3 className=" text-[17px] text-gray-900 dark:text-white">ផ្លាស់ប្ដូរពាក្យសម្ងាត់</h3>
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
                className="w-full mt-6 py-3.5 px-4 bg-indigo-600 text-white rounded-2xl  text-[15px] hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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

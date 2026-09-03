import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useState, useEffect, useRef } from 'react';
import { LogOut, Camera, UserCircle2, KeyRound, Loader2, Save, ChevronRight, ArrowLeft, FileText, Globe, Palette, Info, X, Copy, ShieldCheck, Check, User, Users, Sun, Moon, Mail, Phone, ExternalLink, Send, Shield, Settings, HardDrive, Trash2 } from 'lucide-react';
import SystemLogs from './SystemLogs';
import PinPad from './PinPad';
import FinancialOverviewCard from './FinancialOverviewCard';
import CustomDatePicker from './ui/CustomDatePicker';
import { api } from '../lib/apiClient';
import { systemLogger } from '../lib/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';


interface AccountProfileProps {
  userRole: 'admin' | 'user' | null;
  actualRole?: 'admin' | 'user' | null;
  onViewModeChange?: (mode: 'admin' | 'user') => void;
  onLogout: () => void;
  initialSystemLogsOpen?: boolean;
  onClearInitialSystemLogsOpen?: () => void;
  
  onManageFinancials?: () => void;
  onManageNameLists?: () => void;
  onManageUsers?: () => void;
  onCertificates?: () => void;
}

export default function AccountProfile({ 
  userRole, 
  actualRole, 
  onViewModeChange, 
  onLogout, 
  initialSystemLogsOpen,
  onClearInitialSystemLogsOpen,
  onManageFinancials, 
  onManageNameLists, 
  onManageUsers, 
  onCertificates 
}: AccountProfileProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSettingView, setIsSettingView] = useState(false);
  const [isSystemLogsView, setIsSystemLogsView] = useState(false);

  useEffect(() => {
    if (initialSystemLogsOpen) {
      setIsSystemLogsView(true);
      onClearInitialSystemLogsOpen?.();
    }
  }, [initialSystemLogsOpen, onClearInitialSystemLogsOpen]);
  const [isCopied, setIsCopied] = useState(false);
  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSecurityView, setIsSecurityView] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  const [showAdminContactModal, setShowAdminContactModal] = useState(false);
  const [isAdminContactCopied, setIsAdminContactCopied] = useState(false);
  const [clearStorageStatus, setClearStorageStatus] = useState<'idle' | 'confirm' | 'success'>('idle');
  const [storageUsage, setStorageUsage] = useState(systemLogger.getStorageUsage());

  const handlePasswordChange = async () => {
    if (password.length < 6) {
      setPasswordError(t('sec_modal_pwd_err_len'));
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError(t('sec_modal_pwd_err_match'));
      return;
    }
    
    try {
      setIsPasswordLoading(true);
      setPasswordError('');
      await api.updateProfile({ password });
      setShowPasswordModal(false);
      setPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: t('sec_modal_pwd_success') });
    } catch (err: any) {
      setPasswordError(err.message || t('sec_modal_pwd_err_fail'));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      setEmailError(t('sec_modal_email_err_invalid'));
      return;
    }
    try {
      setIsEmailLoading(true);
      setEmailError('');
      await api.updateProfile({ email: newEmailInput.trim() });
      setEmail(newEmailInput.trim());
      setShowEmailModal(false);
      setMessage({ type: 'success', text: t('sec_modal_email_success') });
    } catch (err: any) {
      setEmailError(err.message || t('sec_modal_email_err_fail'));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneInput.trim()) {
      setPhoneError(t('sec_modal_phone_err_req'));
      return;
    }
    try {
      setIsPhoneLoading(true);
      setPhoneError('');
      await api.updateProfile({ phone_number: newPhoneInput.trim() });
      setPhoneNumber(newPhoneInput.trim());
      setShowPhoneModal(false);
      setMessage({ type: 'success', text: t('sec_modal_phone_success') });
    } catch (err: any) {
      setPhoneError(err.message || t('sec_modal_phone_err_fail'));
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
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
        setPinSetupError(err.message || t('sec_modal_pin_err_incorrect'));
      } finally {
        setIsPinSettingLoading(false);
      }
    } else if (pinSetupStep === 'enter_new') {
      setTempNewPin(pin);
      setPinSetupStep('confirm_new');
    } else if (pinSetupStep === 'confirm_new') {
      if (pin !== tempNewPin) {
        setPinSetupError(t('sec_modal_pin_err_match'));
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
        setMessage({ type: 'success', text: t('sec_modal_pin_success') });
        setAuthPassword('');
        setCurrentPin('');
      } catch (err: any) {
        setPinSetupError(err.message || t('sec_modal_pin_err_fail'));
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
        } else if (combinedFullName) {
          setFullName(combinedFullName);
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
      <div className="flex flex-col h-full bg-transparent font-sans pb-10 overflow-y-auto">
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 -mx-3.5 sm:mx-0 px-4 sm:px-4">
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
          <h2 className="text-lg text-gray-900 dark:text-white font-battambang">{t('profile_title')}</h2>
        </div>

        <div className="sm:p-6 w-full max-w-2xl mx-auto my-2 sm:my-0">
          <div className="bg-white dark:bg-slate-900 -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-slate-800 overflow-hidden">
            {/* Header with Avatar and Name */}
            <div className="p-5 sm:p-8 border-b border-gray-200/80 dark:border-slate-800/80">
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
                  <h3 className="text-[20px] sm:text-[22px] font-normal text-gray-900 dark:text-white  font-title ">
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
              
              <h4 className="text-[16px] text-gray-900 dark:text-white mb-6 font-battambang">{t('profile_personal_details')}</h4>
              
              <div className="space-y-4">
                {/* Family Name */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_family_name')}</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder={t('profile_family_name_ph')}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed font-battambang"
                    />
                  </div>
                </div>

                {/* Given Name */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_given_name')}</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={givenName}
                      onChange={(e) => setGivenName(e.target.value)}
                      placeholder={t('profile_given_name_ph')}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed font-battambang"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_dob')}</label>
                  <div className="w-full relative">
                    <CustomDatePicker disabled={!isEditable} value={dateOfBirth} onChange={setDateOfBirth} placeholder={t('profile_dob_ph')} 
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_gender')}</label>
                  <div className="w-full relative">
                    <select disabled={!isEditable} value={gender === 'Female' || gender === 'ស្រី' ? 'Female' : 'Male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white focus:border-[#1d70b8] outline-none transition-colors appearance-none cursor-pointer disabled:cursor-not-allowed font-battambang"
                    >
                      <option value="Male" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{t('profile_gender_male')}</option>
                      <option value="Female" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white">{t('profile_gender_female')}</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Address (ទីលំនៅ) */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_address')}</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="text" value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('profile_address_ph')}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed font-battambang"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_email')}</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('profile_email_ph')}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed font-sans"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col sm:grid sm:grid-cols-[130px_1fr] sm:items-center gap-1.5 sm:gap-4">
                  <label className="text-[13px] text-gray-400 dark:text-slate-400 font-battambang">{t('profile_phone')}</label>
                  <div className="w-full">
                    <input disabled={!isEditable} type="tel" value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t('profile_phone_ph')}
                      className="w-full rounded-md border border-gray-200 dark:border-slate-700 bg-transparent px-3.5 py-2.5 text-[14px] text-gray-700 dark:text-white placeholder:text-gray-400 focus:border-[#1d70b8] outline-none transition-colors disabled:cursor-not-allowed font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                {!isEditable ? (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setIsEditable(true); }}
                    className="px-8 py-2.5 bg-[#1d70b8] hover:bg-[#16568d] text-white rounded-full text-[13.5px] font-medium shadow-sm transition-colors flex items-center justify-center min-w-[120px] font-battambang active:scale-[0.98]"
                  >
                    {t('profile_btn_edit')}
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-[#1d70b8] hover:bg-[#16568d] text-white rounded-full text-[14px] font-medium shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center min-w-[140px] font-battambang active:scale-[0.98]"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t('profile_btn_save')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- PASSWORD & SECURITY VIEW ---
  if (isSecurityView) {
    return (
      <div className="flex flex-col h-full bg-transparent font-sans pb-12 overflow-y-auto min-h-full">
        {/* Sticky Top Header */}
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 -mx-3.5 sm:mx-0 px-4 sm:px-4">
          <button 
            onClick={() => {
              setIsSecurityView(false);
              setMessage(null);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors focus:outline-none"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white font-battambang">{t('sec_title')}</h2>
        </div>

        {/* Center Content Card */}
        <div className="sm:p-6 w-full max-w-md mx-auto my-2 sm:my-auto flex flex-col justify-center">
          {message && (
            <div className={`mb-4 -mx-3.5 sm:mx-0 rounded-none sm:rounded-xl p-3.5 text-sm font-medium border-y sm:border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'}`}>
              {message.text}
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-slate-800 p-5 sm:p-8">
            
            <h3 className="text-center text-[19px] sm:text-[21px] font-semibold text-gray-900 dark:text-white mb-5 font-battambang">
              {t('sec_title')}
            </h3>
            
            <hr className="border-gray-200 dark:border-slate-800 mb-5" />

            {/* Section 1: Password */}
            <div className="py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-bold text-sm leading-none">*</span>
                <span className="font-semibold text-gray-800 dark:text-slate-100 text-[15px] font-battambang">{t('sec_pwd_label')}</span>
                <button
                  onClick={() => {
                    setPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setShowPasswordModal(true);
                  }}
                  className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 text-[14.5px] ml-2 font-normal hover:underline focus:outline-none"
                >
                  {t('sec_change_btn')}
                </button>
              </div>
              <p className="text-[13.5px] text-gray-600 dark:text-slate-400 mt-1.5 leading-relaxed font-battambang">
                {t('sec_pwd_desc')}
              </p>
            </div>

            <hr className="border-gray-200 dark:border-slate-800 my-4" />

            {/* Section 2: PIN */}
            <div className="py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-bold text-sm leading-none">*</span>
                <span className="font-semibold text-gray-800 dark:text-slate-100 text-[15px] font-battambang">{t('sec_pin_label')}</span>
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
                  className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 text-[14.5px] ml-2 font-normal hover:underline focus:outline-none"
                >
                  {t('sec_change_btn')}
                </button>
              </div>
              <p className="text-[13.5px] text-gray-600 dark:text-slate-400 mt-1.5 leading-relaxed font-battambang">
                {t('sec_pin_desc')}
              </p>
            </div>

            <hr className="border-gray-200 dark:border-slate-800 my-4" />

            {/* Section 3: Email */}
            <div className="py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-bold text-sm leading-none">*</span>
                <span className="font-semibold text-gray-800 dark:text-slate-100 text-[15px] font-battambang">{t('sec_email_label')}</span>
                <button
                  onClick={() => {
                    setNewEmailInput(email || 'sovansaro2025@gmail.com');
                    setEmailError('');
                    setShowEmailModal(true);
                  }}
                  className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 text-[14.5px] ml-2 font-normal hover:underline focus:outline-none"
                >
                  {t('sec_change_btn')}
                </button>
              </div>
              <p className="text-[14px] text-gray-700 dark:text-slate-300 mt-1.5 font-sans break-all">
                {email || 'sovansaro2025@gmail.com'}
              </p>
            </div>

            <hr className="border-gray-200 dark:border-slate-800 my-4" />

            {/* Section 4: Phone Number */}
            <div className="py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-bold text-sm leading-none">*</span>
                <span className="font-semibold text-gray-800 dark:text-slate-100 text-[15px] font-battambang">{t('sec_phone_label')}</span>
                <button
                  onClick={() => {
                    setNewPhoneInput(phoneNumber || '016 759 264');
                    setPhoneError('');
                    setShowPhoneModal(true);
                  }}
                  className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 text-[14.5px] ml-2 font-normal hover:underline focus:outline-none"
                >
                  {t('sec_change_cap_btn')}
                </button>
              </div>
              <p className="text-[14px] text-gray-700 dark:text-slate-300 mt-1.5 font-sans">
                {phoneNumber || '016 759 264'}
              </p>

              {/* Contact: admin */}
              <div className="mt-5 text-[13.5px] text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="font-battambang">{t('sec_contact_label')}</span>
                <button
                  type="button"
                  onClick={() => setShowAdminContactModal(true)}
                  className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 hover:underline font-normal cursor-pointer focus:outline-none"
                >
                  admin
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* PIN Setup Modal */}
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
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl pt-8 pb-10 px-4 font-battambang"
            >
              <PinPad
                title={pinSetupStep === 'verify_current' ? t('sec_modal_pin_verify_title') : pinSetupStep === 'enter_new' ? t('sec_modal_pin_new_title') : t('sec_modal_pin_confirm_title')}
                subtitle={pinSetupStep === 'verify_current' ? t('sec_modal_pin_verify_sub') : pinSetupStep === 'enter_new' ? t('sec_modal_pin_new_sub') : t('sec_modal_pin_confirm_sub')}
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
              className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl font-battambang"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('sec_modal_pwd_title')}</h3>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 -mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
                    {passwordError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t('sec_modal_pwd_new')}</label>
                    <input
                      type="password"
                      value={password}
                      placeholder={t('sec_modal_pwd_new_ph')}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t('sec_modal_pwd_confirm')}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      placeholder={t('sec_modal_pwd_confirm_ph')}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handlePasswordChange}
                  disabled={isPasswordLoading || !password || !confirmPassword}
                  className="w-full mt-6 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isPasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('sec_modal_pwd_save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Change Email Modal */}
        <AnimatePresence>
        {showEmailModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmailModal(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end sm:justify-center sm:p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl font-battambang"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('sec_modal_email_title')}</h3>
                </div>
                <button 
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 -mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEmailChange} className="p-4 sm:p-6 overflow-y-auto">
                {emailError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
                    {emailError}
                  </div>
                )}
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t('sec_modal_email_label')}</label>
                  <input
                    type="email"
                    value={newEmailInput}
                    placeholder={t('sec_modal_email_ph')}
                    required
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isEmailLoading || !newEmailInput.trim()}
                  className="w-full mt-6 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('sec_modal_email_save')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Change Phone Modal */}
        <AnimatePresence>
        {showPhoneModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPhoneModal(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end sm:justify-center sm:p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col shadow-2xl font-battambang"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white">{t('sec_modal_phone_title')}</h3>
                </div>
                <button 
                  onClick={() => setShowPhoneModal(false)}
                  className="p-2 -mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePhoneChange} className="p-4 sm:p-6 overflow-y-auto">
                {phoneError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
                    {phoneError}
                  </div>
                )}
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t('sec_modal_phone_label')}</label>
                  <input
                    type="tel"
                    value={newPhoneInput}
                    placeholder={t('sec_modal_phone_ph')}
                    required
                    onChange={(e) => setNewPhoneInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isPhoneLoading || !newPhoneInput.trim()}
                  className="w-full mt-6 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isPhoneLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('sec_modal_phone_save')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Contact Admin Modal */}
        <AnimatePresence>
        {showAdminContactModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdminContactModal(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm font-battambang"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sec_modal_admin_title')}</h3>
                <button 
                  onClick={() => setShowAdminContactModal(false)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-blue-50/70 dark:bg-slate-800/80 rounded-2xl p-4 border border-blue-100 dark:border-slate-700/60 mb-5">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('sec_modal_admin_tg')}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[15px] text-blue-600 dark:text-blue-400 font-sans select-all">
                    @wsd-data-management-admin
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('@wsd-data-management-admin');
                      setIsAdminContactCopied(true);
                      setTimeout(() => setIsAdminContactCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-200 hover:bg-gray-100 shadow-xs border border-gray-200 dark:border-slate-600 transition-colors"
                    title={isAdminContactCopied ? t('sec_modal_admin_copied') : t('sec_modal_admin_copy')}
                  >
                    {isAdminContactCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500 dark:text-slate-300" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <a
                  href="https://t.me/wsd_data_management_admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[14px] font-medium transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('sec_modal_admin_open_tg')}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={() => setShowAdminContactModal(false)}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl text-[14px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('sec_modal_admin_close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    );
  }

  // --- SETTING VIEW ---
  
  // --- SYSTEM LOGS VIEW ---
  if (isSystemLogsView) {
    return <SystemLogs onBack={() => setIsSystemLogsView(false)} />;
  }

  if (isSettingView) {
    return (
      <div className="flex flex-col h-full bg-transparent font-sans pb-12 overflow-y-auto min-h-full">
        {/* Sticky Top Header */}
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 -mx-3.5 sm:mx-0 px-4 sm:px-4">
          <button 
            onClick={() => setIsSettingView(false)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 transition-colors focus:outline-none"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white font-battambang">{t('profile_setting_menu')}</h2>
        </div>

        {/* Center Content Card */}
        <div className="sm:p-6 w-full max-w-md mx-auto my-2 sm:my-auto flex flex-col justify-center">
          <div className="bg-white dark:bg-slate-900 -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-slate-800 p-5 sm:p-8 font-battambang">
            {/* Header / Title */}
            <h3 className="text-center text-[19px] sm:text-[21px] font-semibold text-gray-900 dark:text-white mb-5 font-battambang">
              {t('profile_setting_modal_title')}
            </h3>

            <hr className="border-gray-200 dark:border-slate-800 mb-5" />

            <div className="space-y-5">
              {/* SECTION 1: Language */}
              <div className="space-y-2.5">
                <h4 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 font-battambang">
                  {t('profile_setting_lang_heading')}
                </h4>

                {/* Khmer */}
                <div 
                  onClick={() => setLanguage('km')}
                  className="pl-3 cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      language === 'km' 
                        ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {language === 'km' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </span>
                    <span className={`text-[14.5px] font-battambang transition-colors ${
                      language === 'km' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                    }`}>
                      {t('profile_setting_lang_km')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 pl-6.5 font-battambang leading-relaxed">
                    {t('profile_setting_lang_km_desc')}
                  </p>
                </div>

                {/* English */}
                <div 
                  onClick={() => setLanguage('en')}
                  className="pl-3 cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      language === 'en' 
                        ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                        : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                    }`}>
                      {language === 'en' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </span>
                    <span className={`text-[14.5px] font-battambang transition-colors ${
                      language === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                    }`}>
                      {t('profile_setting_lang_en')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 pl-6.5 font-battambang leading-relaxed">
                    {t('profile_setting_lang_en_desc')}
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gray-200/80 dark:bg-slate-800 w-full" />

              {/* SECTION 2: Theme */}
              <div className="space-y-2.5">
                <h4 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 font-battambang">
                  {t('profile_setting_theme_heading')}
                </h4>

                {/* Dark mode */}
                <div 
                  onClick={() => setCurrentTheme('dark')}
                  className="pl-3 flex items-center gap-2.5 cursor-pointer group select-none"
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    currentTheme === 'dark' 
                      ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                      : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                  }`}>
                    {currentTheme === 'dark' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </span>
                  <span className={`text-[14.5px] font-battambang transition-colors ${
                    currentTheme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                  }`}>
                    {t('profile_setting_theme_dark')}
                  </span>
                </div>

                {/* Light mode */}
                <div 
                  onClick={() => setCurrentTheme('light')}
                  className="pl-3 flex items-center gap-2.5 cursor-pointer group select-none"
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    currentTheme === 'light' 
                      ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                      : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                  }`}>
                    {currentTheme === 'light' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </span>
                  <span className={`text-[14.5px] font-battambang transition-colors ${
                    currentTheme === 'light' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                  }`}>
                    {t('profile_setting_theme_light')}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gray-200/80 dark:bg-slate-800 w-full" />

              {/* SECTION 3: Role */}
              <div className="space-y-2.5">
                <h4 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 font-battambang">
                  {t('profile_setting_role_heading')}
                </h4>

                {/* Admin */}
                <div 
                  onClick={() => {
                    if (actualRole === 'admin' && onViewModeChange) {
                      onViewModeChange('admin');
                    }
                  }}
                  className={`pl-3 flex items-center gap-2.5 select-none ${
                    actualRole === 'admin' ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    userRole === 'admin' 
                      ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                      : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                  }`}>
                    {userRole === 'admin' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </span>
                  <span className={`text-[14.5px] font-battambang transition-colors ${
                    userRole === 'admin' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                  }`}>
                    {t('profile_setting_role_admin')}
                  </span>
                </div>

                {/* User */}
                <div 
                  onClick={() => {
                    if (onViewModeChange) {
                      onViewModeChange('user');
                    }
                  }}
                  className="pl-3 flex items-center gap-2.5 cursor-pointer group select-none"
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                    userRole === 'user' 
                      ? 'border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900' 
                      : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'
                  }`}>
                    {userRole === 'user' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </span>
                  <span className={`text-[14.5px] font-battambang transition-colors ${
                    userRole === 'user' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-slate-200'
                  }`}>
                    {t('profile_setting_role_user')}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gray-200/80 dark:bg-slate-800 w-full" />

              {/* SECTION 4: Clear App Storage / Space - Only for Admin */}
              {userRole === 'admin' && (
                <div className="space-y-2.5">
                  <h4 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 font-battambang">
                    {t('profile_setting_storage_heading')}
                  </h4>

                  <div className="pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[14.5px] text-gray-800 dark:text-slate-200 font-battambang">
                          {t('profile_setting_storage_label')}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                          ({storageUsage.formatted})
                        </span>
                      </div>

                      {clearStorageStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[14.5px] font-medium text-emerald-600 dark:text-emerald-400 font-battambang">
                          {t('profile_setting_storage_cleaned')} <Check className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      ) : clearStorageStatus === 'confirm' ? (
                        <button 
                          onClick={() => {
                            systemLogger.clearLogs();
                            try {
                              const keysToKeep = ['access_token', 'theme', 'language', 'balance_visibility', 'last_read_notifications', 'cleared_notifications_at'];
                              for (let i = localStorage.length - 1; i >= 0; i--) {
                                const k = localStorage.key(i);
                                if (k && !keysToKeep.includes(k) && !k.startsWith('pin_')) {
                                  localStorage.removeItem(k);
                                }
                              }
                            } catch (e) {
                              console.error(e);
                            }
                            setStorageUsage(systemLogger.getStorageUsage());
                            setClearStorageStatus('success');
                            setTimeout(() => setClearStorageStatus('idle'), 2000);
                          }}
                          className="text-[14.5px] text-red-600 hover:text-red-700 dark:text-red-400 font-medium hover:underline font-battambang cursor-pointer"
                        >
                          {t('profile_setting_storage_confirm')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setClearStorageStatus('confirm');
                            setTimeout(() => {
                              setClearStorageStatus(prev => prev === 'confirm' ? 'idle' : prev);
                            }, 3000);
                          }}
                          className="text-[14.5px] text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-battambang cursor-pointer"
                        >
                          {t('profile_setting_storage_clean_btn')}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-battambang leading-relaxed">
                      {t('profile_setting_storage_desc')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-gray-200 dark:border-slate-800 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN ACCOUNT VIEW ---
  const isAdmin = userRole === 'admin';

  return (
    <div className={`w-full ${isAdmin ? 'max-w-5xl' : 'max-w-3xl'} mx-auto pb-16 font-battambang transition-colors duration-200`}>
      <div className={isAdmin ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "w-full"}>
        {/* Left Column: Profile & Navigation Card */}
        <div className={isAdmin ? "lg:col-span-7 xl:col-span-7" : "w-full"}>
          <div className="bg-white dark:bg-slate-900 -mx-3.5 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden transition-all border-y sm:border border-gray-200/80 dark:border-slate-800">
            {/* Top Header */}
            <div className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-800">
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
                <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 dark:text-white  font-title  leading-normal">
                  {fullName || 'វត្តស្វាយដួច'}
                </h2>
                <p className="text-[13px] sm:text-sm font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                  My ID: {userCode || 'WSD-0810'}
                </p>
              </div>
            </div>

            {/* Mobile View: Financial Overview placed below Profile (Admin only) - Full Width Edge-to-Edge */}
            {isAdmin && (
              <div className="block lg:hidden w-full border-t border-gray-100 dark:border-slate-800">
                <FinancialOverviewCard 
                  userRole={userRole}
                  variant="embedded"
                  className="rounded-none border-0 bg-gray-50/40 dark:bg-slate-800/30 px-4 py-3 sm:px-6 sm:py-4"
                  onNavigateToSecurity={() => setIsSecurityView(true)}
                />
              </div>
            )}

            {/* Top Separator Line */}
            <div className="h-[1px] bg-gray-200 dark:bg-slate-800 w-full" />

        {/* Menu Items */}
        <div className="py-1">
          {/* SECTION 1: គណនី & ពាក្យសម្ងាត់ និងសុវត្ថិភាព & ការកំណត់ */}
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
              onClick={() => setIsSecurityView(true)}
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

            {/* ការកំណត់ (Setting) */}
            <button
              onClick={() => setIsSettingView(true)}
              className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5">
                <Settings className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                  {t('profile_setting_menu')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors" />
            </button>
          </div>

          {/* Separator */}
          <div className="h-[1px] bg-gray-200/80 dark:bg-slate-800 w-full my-1.5" />

          {/* SECTION 2: ការគ្រប់គ្រង: */}
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

          {/* SECTION 3: អំពីកម្មវិធី & ចាកចេញ */}
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

                    {/* System Logs */}
          {userRole === 'admin' && (
            <button
              onClick={() => setIsSystemLogsView(true)}
              className="w-full flex items-center justify-between px-6 py-3.5 border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5">
                <FileText className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                <span className="text-[15px] font-medium text-gray-800 dark:text-slate-200 font-battambang">
                  {t('profile_syslog_menu')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          )}

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
    </div>

        {/* Desktop View: Financial Overview placed on the right of Profile (Admin only) */}
        {isAdmin && (
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5">
            <FinancialOverviewCard 
              userRole={userRole}
              onNavigateToSecurity={() => setIsSecurityView(true)}
            />
          </div>
        )}
      </div>

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
            className="bg-white dark:bg-slate-900 transition-colors duration-200 rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col border border-gray-200/80 dark:border-slate-800 overflow-hidden"
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
    </div>
  );
}

import {
  ArrowLeft,
  MapPin,
  Landmark,
  BookOpen,
  FolderOpen,
  CalendarDays,
  Phone,
  ArrowRight,
  Compass,
} from 'lucide-react';
import ImageSlider from './ImageSlider';
import { useLanguage } from '../contexts/LanguageContext';

interface MonasteryHistoryProps {
  onBack?: () => void;
  onNavigateTab?: (tab: 'records' | 'categories' | 'account') => void;
  onOpenCalendar?: () => void;
}

export default function MonasteryHistory({
  onBack,
  onNavigateTab,
  onOpenCalendar,
}: MonasteryHistoryProps) {
  const { language } = useLanguage();
  const isKm = language === 'km';

  return (
    <div className="flex flex-col pb-8 md:pb-4 font-battambang">
      <div className="w-full space-y-5 sm:space-y-6">
        {/* Back button */}
        {onBack && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#12323A] dark:text-[#E2BD42] hover:opacity-80 transition-opacity cursor-pointer py-1"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{isKm ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
            </button>
          </div>
        )}

        {/* Sacred Deep Teal Hero Card (Matching Mockup 05) */}
        <section className="bg-[#163F48] dark:bg-[#0F2A31] rounded-[24px] p-6 sm:p-8 text-white border border-[#1E4F5A]/60 dark:border-teal-900/50">
          <p className="text-xs sm:text-sm font-medium text-[#E2BD42] tracking-wide mb-2">
            {isKm ? 'ប្រវត្តិ និងព័ត៌មានវត្ត' : 'Monastery Heritage & Profile'}
          </p>
          <h1 className="font-moul text-2xl sm:text-3xl text-white leading-snug">
            {isKm ? 'វត្តវារីបាការាម' : 'Wat Veary Bakaram'}
          </h1>
          <p className="font-title text-xl sm:text-2xl text-[#E2BD42] mt-2 leading-snug">
            {isKm ? 'ហៅ វត្តស្នាយដួច' : 'Known as Wat Snay Duoc'}
          </p>
          <p className="text-sm sm:text-[15px] text-teal-50/85 mt-3 leading-relaxed max-w-2xl">
            {isKm
              ? 'ស្ថាប័នព្រះពុទ្ធសាសនា និងសហគមន៍'
              : 'Buddhist sanctuary for Dhamma learning, preservation, and community harmony.'}
          </p>
        </section>

        {/* Monastery Photo Showcase */}
        <div className="w-full">
          <ImageSlider />
        </div>

        {/* Section Title: ស្គាល់អំពីវត្ត */}
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-title text-xl sm:text-2xl text-[#12323A] dark:text-white">
              {isKm ? 'ស្គាល់អំពីវត្ត' : 'About the Monastery'}
            </h2>
          </div>

          {/* Card 1: About Wat Snay Duoc */}
          <article className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-5 sm:p-6 shadow-[0_2px_10px_rgba(18,50,58,0.03)]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Landmark className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42] shrink-0" />
              <h3 className="font-title text-lg sm:text-xl text-[#12323A] dark:text-white">
                {isKm ? 'អំពីវត្តស្នាយដួច' : 'About Wat Snay Duoc'}
              </h3>
            </div>
            <p className="text-sm sm:text-[15px] text-[#5C6669] dark:text-slate-300 leading-relaxed">
              {isKm
                ? 'វត្តវារីបាការាម ហៅ វត្តស្នាយដួច គឺជាទីអារាមដ៏ស្ងប់ស្ងាត់សម្រាប់ការសិក្សាព្រះធម៌ ការប្រតិបត្តិធម៌ សីល សមាធិ បញ្ញា និងការរួបរួមសាមគ្គីរបស់ពុទ្ធបរិស័ទក្នុងសហគមន៍។ ទីអារាមនេះជាកន្លែងរក្សាប្រពៃណី វប្បធម៌ និងព្រះពុទ្ធសាសនាឱ្យគង់វង្សយូរអង្វែង។'
                : 'Wat Veary Bakaram, widely known as Wat Snay Duoc, is a peaceful Buddhist sanctuary dedicated to Dhamma study, spiritual practice, and community unity. It serves as a center for preserving Khmer Buddhist heritage and supporting charitable works.'}
            </p>
          </article>

          {/* Grid for Location & Community Work */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Card 2: Location */}
            <article className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-5 sm:p-6 shadow-[0_2px_10px_rgba(18,50,58,0.03)]">
              <div className="flex items-center gap-2.5 mb-2.5">
                <MapPin className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42] shrink-0" />
                <h3 className="font-title text-lg sm:text-xl text-[#12323A] dark:text-white">
                  {isKm ? 'ទីតាំងវត្ត' : 'Monastery Location'}
                </h3>
              </div>
              <p className="text-sm sm:text-[15px] text-[#5C6669] dark:text-slate-300 leading-relaxed">
                {isKm
                  ? 'ភូមិពន្លាំង ឃុំជើងគួន ស្រុកសំរោង ខេត្តតាកែវ'
                  : 'Ponleang Village, Cheung Kuon Commune, Samraong District, Takeo Province, Cambodia'}
              </p>
              <div className="mt-4 pt-3.5 border-t border-[#F0ECE2] dark:border-teal-900/40 flex items-center gap-2 text-xs sm:text-sm text-[#12323A] dark:text-teal-200/90">
                <Compass className="w-4 h-4 text-[#C59A1B] dark:text-[#E2BD42] shrink-0" />
                <span>
                  {isKm
                    ? 'ព្រះរាជាណាចក្រកម្ពុជា'
                    : 'Kingdom of Cambodia'}
                </span>
              </div>
            </article>

            {/* Card 3: Contact & Monks Committee */}
            <article className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-5 sm:p-6 shadow-[0_2px_10px_rgba(18,50,58,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Phone className="w-5 h-5 text-[#12323A] dark:text-[#E2BD42] shrink-0" />
                  <h3 className="font-title text-lg sm:text-xl text-[#12323A] dark:text-white">
                    {isKm ? 'ទំនាក់ទំនង' : 'Contact & Committee'}
                  </h3>
                </div>
                <p className="text-sm sm:text-[15px] text-[#5C6669] dark:text-slate-300 leading-relaxed">
                  {isKm
                    ? 'សម្រាប់ព័ត៌មានអំពីពិធីបុណ្យ ការប្រគេនចង្ហាន់ ឬការចូលរួមកសាងសមិទ្ធផល សូមទំនាក់ទំនងព្រះចៅអធិការ ព្រះសង្ឃ និងគណៈកម្មការវត្តស្នាយដួច។'
                    : 'For inquiries regarding Buddhist ceremonies, offerings, or monastery development projects, please contact the Abbot, resident monks, and monastery committee.'}
                </p>
              </div>
              {onOpenCalendar && (
                <div className="mt-4 pt-3.5 border-t border-[#F0ECE2] dark:border-teal-900/40">
                  <button
                    type="button"
                    onClick={onOpenCalendar}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    <span>{isKm ? 'មើលប្រតិទិន និងកម្មវិធីបុណ្យ' : 'View Ceremonies & Calendar'}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              )}
            </article>
          </div>

          {/* Card 4: Transparency & Achievements Navigation */}
          <article className="bg-white dark:bg-[#10252C] rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 p-5 sm:p-6 shadow-[0_2px_10px_rgba(18,50,58,0.03)]">
            <h3 className="font-title text-lg sm:text-xl text-[#12323A] dark:text-white mb-2">
              {isKm ? 'តម្លាភាព និងសមិទ្ធផលវត្ត' : 'Transparency & Monastery Records'}
            </h3>
            <p className="text-sm sm:text-[15px] text-[#5C6669] dark:text-slate-300 leading-relaxed mb-4">
              {isKm
                ? 'រាល់បច្ច័យសទ្ធាជ្រះថ្លារបស់ពុទ្ធបរិស័ទ និងសប្បុរសជន ត្រូវបានកត់ត្រាដោយតម្លាភាព និងបង្ហាញជាសាធារណៈតាមវេនសីល និងគម្រោងកសាងនីមួយៗ។'
                : 'Every offering and contribution from devotees and benefactors is recorded transparently and shared openly across Seil periods and construction projects.'}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 border-t border-[#F0ECE2] dark:border-teal-900/40">
              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('records')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>{isKm ? 'បញ្ជីចំណូល-ចំណាយ' : 'Financial Records'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('categories')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#12323A] dark:text-[#E2BD42] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span>{isKm ? 'បញ្ជីផ្សេងៗ និងគម្រោងកសាង' : 'Project & Name Lists'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

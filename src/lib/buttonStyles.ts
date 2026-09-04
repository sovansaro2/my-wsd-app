/**
 * Shared button styling presets across the application.
 *
 * User-specified style:
 * - ពណ៌សឌិតបន្តិច (slightly off-white / light slate tinted neutral background)
 * - មាន Border (clear crisp border)
 * - គ្មាន Shadow (strictly shadow-none)
 */

export const BUTTON_STYLES = {
  // Off-white with border, no shadow
  offWhiteBorder:
    "bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200/80 border border-zinc-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 shadow-none font-medium transition-colors rounded-xl flex items-center justify-center gap-2",

  // Muted close/cancel button
  mutedClose:
    "bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-transparent shadow-none font-medium transition-colors rounded-xl flex items-center justify-center gap-2",
} as const;

export type ButtonVariant = keyof typeof BUTTON_STYLES;

export const offWhiteBorderBtn = BUTTON_STYLES.offWhiteBorder;

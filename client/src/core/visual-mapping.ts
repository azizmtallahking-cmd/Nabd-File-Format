
import { ProseTone, UserVisualProfile } from './schema';

/**
 * NFF Visual Mapping
 * This is the deterministic source of truth for design.
 * AI output intents (ProseTone) are mapped to CSS tokens here.
 */

export const TONE_STYLES: Record<ProseTone, { bg: string; text: string; accent: string; weight: string }> = {
  executive:  { bg: 'bg-stone-50',   text: 'text-stone-900',   accent: 'border-amber-600',   weight: 'font-medium' },
  narrative:  { bg: 'bg-transparent', text: 'text-stone-700',  accent: 'border-stone-300',   weight: 'font-normal' },
  urgent:     { bg: 'bg-rose-50',    text: 'text-rose-900',    accent: 'border-rose-500',    weight: 'font-semibold' },
  reflective: { bg: 'bg-indigo-50',  text: 'text-indigo-900',  accent: 'border-indigo-400',  weight: 'font-normal italic' },
  neutral:    { bg: 'bg-white',      text: 'text-stone-800',   accent: 'border-stone-200',   weight: 'font-normal' },
};

export const PALETTES: Record<string, { primary: string; secondary: string; surface: string }> = {
  'amber-stone': { primary: '#182743', secondary: '#8b684c', surface: '#f8f7f1' },
  'sage-cream':  { primary: '#2d3a3a', secondary: '#9dbb8a', surface: '#f4f7f2' },
  'indigo-slate': { primary: '#1e293b', secondary: '#64748b', surface: '#f1f5f9' },
};

export function resolveStyle(tone: ProseTone, profile: UserVisualProfile) {
  const base = TONE_STYLES[tone] || TONE_STYLES.neutral;
  // In a real app, this would merge palette colors with the tone's semantic classes
  return base;
}

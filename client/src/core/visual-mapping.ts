
import { ProseTone, UserVisualProfile } from './schema';

/**
 * NFF Visual Mapping
 * This is the deterministic source of truth for design.
 * AI output intents (ProseTone) are mapped to CSS tokens here.
 */

export const TONE_STYLES: Record<string, { bg: string; text: string; accent: string; weight: string }> = {
  executive:  { bg: 'bg-[#F8F7F1]',   text: 'text-[#0F3D36]',   accent: 'border-[#0F3D36]',   weight: 'font-semibold' },
  narrative:  { bg: 'bg-transparent', text: 'text-[#0F3D36]/80',accent: 'border-[#D9B892]',   weight: 'font-normal' },
  urgent:     { bg: 'bg-[#B75A3C]/10',text: 'text-[#B75A3C]',   accent: 'border-[#B75A3C]',   weight: 'font-semibold' },
  reflective: { bg: 'bg-[#D9B892]/10',text: 'text-[#0F3D36]',   accent: 'border-[#D9B892]',   weight: 'font-normal italic' },
  neutral:    { bg: 'bg-[#FFFFFF]',   text: 'text-[#0F3D36]/90',accent: 'border-[#0F3D36]/20',weight: 'font-normal' },
  calm:       { bg: 'bg-[#5DB87F]/10',text: 'text-[#0F3D36]',   accent: 'border-[#5DB87F]',   weight: 'font-normal' },
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

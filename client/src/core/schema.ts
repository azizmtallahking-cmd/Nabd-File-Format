
/**
 * NFF Core Schema v1.0
 * This file defines the formal contract for NFF nodes and visual profiles.
 */

export type ProseTone = 'executive' | 'narrative' | 'urgent' | 'reflective' | 'neutral';
export type QcmType = 'single_choice' | 'multi_choice' | 'text_input';

export interface UserVisualProfile {
  paletteId: 'amber-stone' | 'sage-cream' | 'indigo-slate';
  fontPairing: 'classic' | 'modern' | 'warm';
  density: 'comfortable' | 'compact';
}

export interface ProseNode {
  type: 'prose';
  tone: ProseTone;
  content: string;
}

export interface QcmNode {
  type: 'qcm';
  id: string;
  qcmType: QcmType;
  question: string;
  options?: { value: string; label: string }[];
}

export type NffNode = ProseNode | QcmNode | { type: 'error'; reason: string };

export interface ParsedNffDocument {
  header: {
    magic: string;
    mode: 'AIM' | 'HM';
    version: string;
  };
  metadata: Record<string, any>;
  nodes: NffNode[];
  rawBody: string;
}

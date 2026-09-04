
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check, Save, Edit3, Eye, ShieldCheck, Terminal } from 'lucide-react';
import { inspectHeader, buildHeader, HEADER_LENGTH } from '../core/header';

interface AimDraftPageProps {
  fileId: string;
  onBack: () => void;
}

/**
 * AimDraftPage
 * Technical, high-density reading experience for AI-optimized NFF.
 * Strictly independent from HM-specific rendering logic.
 */
export function AimDraftPage({ fileId, onBack }: AimDraftPageProps) {
  const [content, setContent] = useState<string>("");
  const [name, setName] = useState<string>("aim-draft.nff");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const extractCleanText = (bodyText: string): string => {
    const bytes = new TextEncoder().encode(bodyText);
    if (bytes.length >= HEADER_LENGTH && inspectHeader(bytes).isValid) {
      return new TextDecoder().decode(bytes.subarray(HEADER_LENGTH));
    }
    return bodyText;
  };

  const getFullAimBytes = (text: string): Uint8Array => {
    const rawBytes = new TextEncoder().encode(text);
    if (rawBytes.length >= HEADER_LENGTH && inspectHeader(rawBytes).isValid) {
      return rawBytes;
    }
    const header = buildHeader("AIM");
    const full = new Uint8Array(header.length + rawBytes.length);
    full.set(header, 0);
    full.set(rawBytes, header.length);
    return full;
  };

  useEffect(() => {
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContent(extractCleanText(parsed.body || ""));
        setName(parsed.name || "aim-draft.nff");
      } catch {
        // fallback
      }
    }
  }, [fileId]);

  const fullBytes = getFullAimBytes(content);
  const byteCount = fullBytes.length;
  const lineCount = content ? content.split("\n").length : 0;

  const handleSave = () => {
    const full = getFullAimBytes(content);
    localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
      name,
      body: new TextDecoder().decode(full),
      mode: "AIM",
      updatedAt: Date.now()
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const download = () => {
    const full = getFullAimBytes(content);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([full], { type: "application/octet-stream" }));
    link.download = name.endsWith(".nff") ? name : `${name}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="aim-draft-view min-h-screen bg-[#0F3D36] text-[#D9B892] font-mono text-sm selection:bg-[#5DB87F]/30 selection:text-[#5DB87F]" dir="ltr">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F3D36]/90 backdrop-blur border-b border-[#5DB87F]/30 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#5DB87F]/20 rounded-lg transition-colors text-[#D9B892]/60 hover:text-[#D9B892]" 
            title="Back to Files"
          >
            <ArrowRight className="rotate-180" size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#5DB87F] tracking-widest uppercase flex items-center gap-2">
              <Terminal size={11} /> NFF / AIM DRAFT
            </span>
            <span className="text-[#D9B892] text-xs font-semibold truncate max-w-[280px]">{name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-2 py-2 rounded bg-[#5DB87F]/10 text-[#D9B892]/60 text-[10px] font-bold border border-[#5DB87F]/30">
            MODE: AIM
          </span>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 border border-[#5DB87F]/30 hover:bg-[#5DB87F]/10 text-[#D9B892] px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? "VIEW" : "EDIT"}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#0F3D36] hover:bg-[#15544A] text-[#5DB87F] border border-[#5DB87F]/40 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            >
              <Save size={13} />
              <span>{savedNotice ? "SAVED" : "SAVE"}</span>
            </button>
          )}

          <button 
            onClick={download} 
            className="flex items-center gap-2 bg-[#B75A3C] hover:bg-[#B75A3C]/80 text-[#F8F7F1] px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#B75A3C]/20"
          >
            <Download size={14} /> 
            <span>EXPORT AIM</span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="bg-[#0F3D36]/60 border border-[#5DB87F]/30 rounded-xl p-6 shadow-2xl">
          {/* Metadata banner */}
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-[#5DB87F]/30 pb-4 text-xs text-[#D9B892]/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[#5DB87F]">
                <Check size={14} />
                <span className="text-[11px] uppercase tracking-wider font-semibold">Mechanical Verification Ready</span>
              </span>
              <span className="text-[#D9B892]/60">|</span>
              <span>{lineCount} lines</span>
              <span className="text-[#D9B892]/60">|</span>
              <span>{byteCount} bytes</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#D9B892]/60">
              <ShieldCheck size={14} className="text-[#5DB87F]" />
              <span>DETERMINISTIC COMPRESSION</span>
            </div>
          </div>

          {isEditing ? (
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[560px] bg-[#0F3D36]/40 border border-[#5DB87F]/30 rounded-lg p-6 font-mono text-xs text-[#D9B892] leading-relaxed outline-none focus:border-[#5DB87F]/60 transition-colors resize-y"
                placeholder="Enter AIM content..."
              />
              <div className="text-[11px] text-[#D9B892]/60 mt-2 flex justify-between">
                <span>Direct AIM specification editing.</span>
                <span>UTF-8 encoded</span>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all leading-relaxed text-[#D9B892] font-mono text-xs bg-[#0F3D36]/40 p-6 rounded-lg border border-[#5DB87F]/30 min-h-[400px] overflow-x-auto">
              {content || "No content available in this draft."}
            </pre>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-[#0F3D36] border-t border-[#5DB87F]/30 flex items-center justify-between px-6 text-[10px] text-[#D9B892]/60">
        <span className="tracking-widest uppercase">NFF · NABD STUDIO</span>
        <span className="uppercase tracking-widest">Sovereign Local-First Environment · Zero Cloud Sync</span>
      </footer>
    </div>
  );
}

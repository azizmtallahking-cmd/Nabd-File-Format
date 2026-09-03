
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check, Save, Edit3, Eye, ShieldCheck, Terminal } from 'lucide-react';
import { inspectHeader } from '../core/header';

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

  useEffect(() => {
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContent(parsed.body || "");
        setName(parsed.name || "aim-draft.nff");
      } catch {
        // fallback
      }
    }
  }, [fileId]);

  const byteCount = new TextEncoder().encode(content).length;
  const lineCount = content ? content.split("\n").length : 0;

  const handleSave = () => {
    localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
      name,
      body: content,
      mode: "AIM",
      updatedAt: Date.now()
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
    link.download = name.endsWith(".nff") ? name : `${name}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="aim-draft-view min-h-screen bg-[#0A0E17] text-[#C5D1DE] font-mono text-sm selection:bg-[#38BDF8]/30 selection:text-[#38BDF8]" dir="ltr">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0E1524]/90 backdrop-blur border-b border-[#1E293B] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-[#94A3B8] hover:text-[#F8FAFC]" 
            title="Back to Files"
          >
            <ArrowRight className="rotate-180" size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#38BDF8] tracking-widest uppercase flex items-center gap-1.5">
              <Terminal size={11} /> NFF / AIM DRAFT
            </span>
            <span className="text-[#F1F5F9] text-xs font-semibold truncate max-w-[280px]">{name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-[#162235] text-[#94A3B8] text-[10px] font-bold border border-[#24344D]">
            MODE: AIM
          </span>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 border border-[#24344D] hover:bg-[#162235] text-[#CBD5E1] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? "VIEW" : "EDIT"}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-[#0F3D36] hover:bg-[#15544A] text-[#5DB87F] border border-[#5DB87F]/40 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <Save size={13} />
              <span>{savedNotice ? "SAVED" : "SAVE"}</span>
            </button>
          )}

          <button 
            onClick={download} 
            className="flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#0284C7]/20"
          >
            <Download size={14} /> 
            <span>EXPORT AIM</span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="bg-[#0E1524]/60 border border-[#1E293B] rounded-xl p-6 shadow-2xl">
          {/* Metadata banner */}
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-[#1E293B] pb-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <Check size={14} />
                <span className="text-[11px] uppercase tracking-wider font-semibold">Mechanical Verification Ready</span>
              </span>
              <span className="text-[#334155]">|</span>
              <span>{lineCount} lines</span>
              <span className="text-[#334155]">|</span>
              <span>{byteCount} bytes</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
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
                className="w-full min-h-[560px] bg-[#070B12] border border-[#1E293B] rounded-lg p-5 font-mono text-xs text-[#E2E8F0] leading-relaxed outline-none focus:border-[#38BDF8]/60 transition-colors resize-y"
                placeholder="Enter AIM content..."
              />
              <div className="text-[11px] text-[#64748B] mt-2 flex justify-between">
                <span>Direct AIM specification editing.</span>
                <span>UTF-8 encoded</span>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-all leading-relaxed text-[#E2E8F0] font-mono text-xs bg-[#070B12] p-5 rounded-lg border border-[#1E293B] min-h-[400px] overflow-x-auto">
              {content || "No content available in this draft."}
            </pre>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-[#0A0E17] border-t border-[#1E293B] flex items-center justify-between px-6 text-[10px] text-[#64748B]">
        <span className="tracking-widest uppercase">NFF · NABD STUDIO</span>
        <span className="uppercase tracking-widest">Sovereign Local-First Environment · Zero Cloud Sync</span>
      </footer>
    </div>
  );
}

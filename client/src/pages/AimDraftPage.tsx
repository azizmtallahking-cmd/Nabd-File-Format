
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check } from 'lucide-react';

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

  useEffect(() => {
    // In a real app, this would fetch from IndexedDB using fileId
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setContent(parsed.body || "");
      setName(parsed.name || "aim-draft.nff");
    }
  }, [fileId]);

  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="aim-draft-view min-h-screen bg-stone-950 text-stone-300 font-mono text-sm selection:bg-sky-500/30 selection:text-sky-200" dir="ltr">
      <header className="fixed top-0 left-0 right-0 h-14 bg-stone-900/80 backdrop-blur border-b border-stone-800 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-stone-100" title="Back to Files">
            <ArrowRight className="rotate-180" size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-sky-500 tracking-widest uppercase">NFF / AIM DRAFT</span>
            <span className="text-stone-100 truncate max-w-[200px]">{name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 text-[10px] font-bold border border-stone-700">MODE: AIM</span>
          <button onClick={download} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-sky-900/20">
            <Download size={14} /> EXPORT AIM
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-8 max-w-4xl mx-auto">
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-stone-500 border-b border-stone-800 pb-4">
            <Check size={14} className="text-sky-500" />
            <span className="text-[11px] uppercase tracking-wider">Mechanical Verification Ready</span>
          </div>
          <pre className="whitespace-pre-wrap break-all leading-relaxed text-stone-200">
            {content || "Loading AIM content..."}
          </pre>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-stone-950 border-t border-stone-900 flex items-center justify-center px-6">
        <span className="text-[10px] text-stone-600 uppercase tracking-widest">Sovereign Local-First Environment · No Cloud Sync</span>
      </footer>
    </div>
  );
}

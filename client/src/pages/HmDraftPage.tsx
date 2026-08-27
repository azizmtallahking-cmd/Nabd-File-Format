
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check, Settings2, Save } from 'lucide-react';
import { NffRenderer } from '../components/NffRenderer';
import { parseNff } from '../core';
import { NffNode } from '../core/schema';
import { exportAnswersAsAim } from '../core/answer-export';

interface HmDraftPageProps {
  fileId: string;
  onBack: () => void;
}

/**
 * HmDraftPage
 * Editorial, tactile reading experience for human-optimized NFF.
 * Leverages the deterministic NffRenderer for semantic display.
 */
export function HmDraftPage({ fileId, onBack }: HmDraftPageProps) {
  const [nodes, setNodes] = useState<NffNode[]>([]);
  const [name, setName] = useState<string>("hm-draft.nff");
  const [raw, setRaw] = useState<string>("");
  const [docId, setDocId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const nffBytes = new TextEncoder().encode(parsed.body || "");
      try {
        const doc = parseNff(nffBytes);
        setNodes(doc.nodes);
        setRaw(parsed.body);
        setDocId(doc.frontmatter.doc_id || "unknown_source");
      } catch (e) {
        setNodes([{ type: 'error', reason: 'فشل تحليل محتوى HM' }]);
      }
      setName(parsed.name || "hm-draft.nff");
    }
  }, [fileId]);

  const hasQcm = nodes.some(n => n.type === 'qcm');

  const handleAnswer = (id: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const finishAndSaveAnswers = async () => {
    if (!docId) return;
    const { bytes } = await exportAnswersAsAim(docId, answers);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    link.download = `${name.replace(".nff", "")}-answers-AIM.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([raw], { type: "application/octet-stream" }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="hm-draft-view min-h-screen bg-[#f8f7f1] text-[#182743]" dir="rtl">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur border-b border-[#d5d7d0] flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-[#f0efe7] rounded-full transition-colors text-[#8b684c]" title="العودة للملفات">
            <ArrowRight size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8b684c] tracking-widest uppercase">NFF / HM DRAFT</span>
            <h1 className="text-lg font-bold truncate max-w-[300px]">{name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0efe7] text-[#8b684c] text-[10px] font-bold border border-[#d5d7d0]">
            <Check size={12} /> مود بشري
          </div>
          <button onClick={download} className="flex items-center gap-2 border border-[#d5d7d0] hover:bg-[#f0efe7] text-[#182743] px-6 py-2 rounded-full text-sm font-bold transition-all active:scale-95">
            <Download size={16} /> تنزيل HM
          </button>
          {hasQcm && (
            <button onClick={finishAndSaveAnswers} className="flex items-center gap-2 bg-[#182743] hover:bg-[#29496c] text-white px-6 py-2 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg shadow-[#182743]/10">
              <Save size={16} /> إنهاء وحفظ الإجابات
            </button>
          )}
        </div>
      </header>

      <main className="pt-28 pb-24 px-8">
        <div className="max-w-3xl mx-auto bg-white border border-[#d5d7d0] rounded-2xl p-12 shadow-sm min-h-[70vh]">
          <div className="flex items-center justify-between mb-10 border-b border-[#f0efe7] pb-6">
            <div className="flex items-center gap-3 text-[#8b684c]">
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">معاينة العرض الدلالي</span>
            </div>
            <span className="text-[10px] text-[#a8835c] font-mono">CORE v1.0</span>
          </div>
          
          <NffRenderer nodes={nodes} onAnswer={handleAnswer} />
          
          {nodes.length === 0 && (
            <div className="py-20 text-center text-[#a8835c] italic">
              جارٍ تحميل محتوى المسودة...
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-white border-t border-[#d5d7d0] flex items-center justify-center px-8">
        <span className="text-[10px] text-[#a8835c] uppercase tracking-widest">بيئة سيادية محلية · خصوصية كاملة</span>
      </footer>
    </div>
  );
}

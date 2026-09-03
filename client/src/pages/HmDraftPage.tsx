
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check, Settings2, Save, Edit3, Eye, FileText, CheckCircle2 } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const bodyText = parsed.body || "";
        setRaw(bodyText);
        setName(parsed.name || "hm-draft.nff");
        reparseBody(bodyText);
      } catch {
        // ignore
      }
    }
  }, [fileId]);

  const reparseBody = (text: string) => {
    const nffBytes = new TextEncoder().encode(text);
    try {
      const doc = parseNff(nffBytes);
      setNodes(doc.nodes);
      setDocId(doc.frontmatter.doc_id || "unknown_source");
    } catch {
      setNodes([{ type: 'error', reason: 'فشل تحليل محتوى HM' }]);
    }
  };

  const hasQcm = nodes.some(n => n.type === 'qcm');

  const handleAnswer = (id: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
      name,
      body: raw,
      mode: "HM",
      updatedAt: Date.now()
    }));
    reparseBody(raw);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
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
    link.download = name.endsWith(".nff") ? name : `${name}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="hm-draft-view min-h-screen bg-[#F8F7F1] text-[#17233A]" dir="rtl">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#FFFFFF]/90 backdrop-blur border-b border-[#D5D7D0] flex items-center justify-between px-8 z-20 shadow-sm">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#F0EFE7] rounded-xl transition-colors text-[#0F3D36] flex items-center gap-1 text-sm font-semibold" 
            title="العودة للملفات"
          >
            <ArrowRight size={18} />
            <span>العودة</span>
          </button>
          <div className="h-5 w-[1px] bg-[#D5D7D0]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#B75A3C] tracking-widest uppercase flex items-center gap-1.5">
              <FileText size={11} /> NFF / HM DRAFT
            </span>
            <h1 className="text-sm font-bold text-[#17233A] truncate max-w-[300px]">{name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5EE] text-[#0F3D36] text-[11px] font-bold border border-[#5DB87F]/40">
            <Check size={12} className="text-[#5DB87F]" /> مود بشري
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                reparseBody(raw);
              }
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1.5 border border-[#D5D7D0] hover:bg-[#F0EFE7] text-[#17233A] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? "عرض دلالي" : "تحرير المصدر"}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-[#0F3D36] hover:bg-[#15544A] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Save size={13} />
              <span>{savedNotice ? "تم الحفظ ✓" : "حفظ التعديلات"}</span>
            </button>
          )}

          <button 
            onClick={download} 
            className="flex items-center gap-2 border border-[#D5D7D0] hover:bg-[#F0EFE7] text-[#17233A] px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Download size={14} /> 
            <span>تنزيل HM</span>
          </button>

          {hasQcm && (
            <button 
              onClick={finishAndSaveAnswers} 
              className="flex items-center gap-2 bg-[#B75A3C] hover:bg-[#9E4A2E] text-white px-5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Save size={14} /> 
              <span>إنهاء وحفظ الإجابات</span>
            </button>
          )}
        </div>
      </header>

      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        <div className="bg-[#FFFFFF] border border-[#D5D7D0] rounded-2xl p-10 shadow-sm min-h-[72vh]">
          <div className="flex items-center justify-between mb-8 border-b border-[#EEEEE8] pb-5">
            <div className="flex items-center gap-2.5 text-[#0F3D36]">
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isEditing ? "محرر وسوم HM البشري" : "المعاينة الدلالية للمستند"}
              </span>
            </div>
            <span className="text-[11px] text-[#8A908F] font-mono">CORE v1.0 · NABD STUDIO</span>
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[520px] bg-[#F8F7F1] border border-[#D5D7D0] focus:border-[#0F3D36] rounded-xl p-6 font-mono text-xs text-[#17233A] leading-relaxed outline-none transition-colors resize-y"
                dir="rtl"
                placeholder="محتوى NFF بتنسيق HM..."
              />
              <div className="flex justify-between items-center mt-3 text-xs text-[#8A908F]">
                <span>يدعم وسوم &lt;nff-prose tone="..."&gt; و &lt;nff-qcm&gt; و [[section]]</span>
                <span>اضغط &quot;عرض دلالي&quot; لرؤية التحديثات</span>
              </div>
            </div>
          ) : (
            <div>
              <NffRenderer nodes={nodes} onAnswer={handleAnswer} />

              {nodes.length === 0 && (
                <div className="py-20 text-center text-[#8A908F] italic text-sm">
                  لا يوجد محتوى لعرضه في هذه المسودة.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#FFFFFF] border-t border-[#D5D7D0] flex items-center justify-between px-8 text-[11px] text-[#8A908F]">
        <span>NFF · LIVING ENVIRONMENT · by NABD STUDIO</span>
        <span className="uppercase tracking-wider">بيئة سيادية محلية · خصوصية كاملة</span>
      </footer>
    </div>
  );
}

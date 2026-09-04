
import React, { useEffect, useState } from 'react';
import { ArrowRight, Download, Check, Settings2, Save, Edit3, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { NffRenderer } from '../components/NffRenderer';
import { parseNff } from '../core';
import { NffNode } from '../core/schema';
import { exportAnswersAsAim } from '../core/answer-export';
import { inspectHeader, buildHeader, HEADER_LENGTH } from '../core/header';

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

  const extractCleanText = (bodyText: string): string => {
    const bytes = new TextEncoder().encode(bodyText);
    if (bytes.length >= HEADER_LENGTH && inspectHeader(bytes).isValid) {
      return new TextDecoder().decode(bytes.subarray(HEADER_LENGTH));
    }
    return bodyText;
  };

  const getFullHmBytes = (text: string): Uint8Array => {
    const rawBytes = new TextEncoder().encode(text);
    if (rawBytes.length >= HEADER_LENGTH && inspectHeader(rawBytes).isValid) {
      return rawBytes;
    }
    const header = buildHeader("HM");
    const full = new Uint8Array(header.length + rawBytes.length);
    full.set(header, 0);
    full.set(rawBytes, header.length);
    return full;
  };

  const reparseBody = (text: string) => {
    console.log("[NFF HM Draft] Reparsing text (length: " + text.length + "):", text);
    try {
      const fullBytes = getFullHmBytes(text);
      const doc = parseNff(fullBytes);
      console.log("[NFF HM Draft] parseNff result:", {
        mode: doc.mode,
        version: doc.version,
        frontmatter: doc.frontmatter,
        tagsCount: doc.tags?.length,
        nodesCount: doc.nodes?.length,
        nodes: doc.nodes
      });

      const displayNodes: NffNode[] = [];

      // Interleave or prepend section tags to provide a rich visual hierarchy
      const sections = doc.tags?.filter(t => t.kind === 'section') || [];
      if (sections.length > 0) {
        sections.forEach(s => {
          displayNodes.push({
            type: 'section' as any,
            title: s.attributes?.title || 'قسم',
            attributes: s.attributes
          } as any);
        });
      }

      if (doc.nodes && doc.nodes.length > 0) {
        displayNodes.push(...doc.nodes);
      } else {
        // Fallback for human drafts written without XML tags: extract paragraphs
        const bodyWithoutFrontmatter = text.replace(/^---[\s\S]*?---\n?/, "").trim();
        const textOnly = bodyWithoutFrontmatter.replace(/\[\[.*?\]\]/g, "").trim();
        if (textOnly.length > 0) {
          const paragraphs = textOnly.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
          paragraphs.forEach(p => {
            displayNodes.push({
              type: 'prose',
              tone: 'neutral',
              content: p
            });
          });
        }
      }

      console.log("[NFF HM Draft] Setting state 'nodes' to:", displayNodes);
      setNodes(displayNodes);
      setDocId(doc.frontmatter.doc_id || "unknown_source");
    } catch (err) {
      console.error("[NFF HM Draft] Reparse failed with error:", err);
      setNodes([{ type: 'error', reason: 'فشل تحليل محتوى HM: ' + (err instanceof Error ? err.message : String(err)) }]);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(`nff_draft_${fileId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const bodyText = parsed.body || "";
        const clean = extractCleanText(bodyText);
        setRaw(clean);
        setName(parsed.name || "hm-draft.nff");
        reparseBody(clean);
      } catch (e) {
        console.error("[NFF HM Draft] Failed to read stored draft:", e);
      }
    } else {
      // Fallback: Initialize with starter draft content if no saved data exists for this id
      const defaultContent = `---
title: مسودة HM جديدة
priority: medium
classification: internal
---
[[section: title="مقدمة النظام"]]
<nff-prose tone="executive">هذه فقرة توضح النظام الجديد. تم إعداد الألوان والمقاسات بناءً على الهوية البصرية الرسمية للاستوديو.</nff-prose>
<nff-prose tone="reflective">إن تطبيق هوية بصرية متسقة ليس مجرد زخرفة، بل هو جزء من بناء بيئة عمل موثوقة ومريحة للمستخدم، مما يعزز من قيمة المحتوى نفسه.</nff-prose>

[[section: title="اختبار التفاعل"]]
<nff-qcm id="test_q1" type="single_choice">
  <nff-question>هل ظهرت الألوان والمسافات بشكل صحيح بناءً على قواعد NABD STUDIO؟</nff-question>
  <nff-option value="yes">نعم، الهوية مطبقة بشكل ممتاز.</nff-option>
  <nff-option value="no">لا، هناك خلل في العرض.</nff-option>
</nff-qcm>`;
      setRaw(defaultContent);
      setName("hm-draft.nff");
      reparseBody(defaultContent);
    }
  }, [fileId]);

  const hasQcm = nodes.some(n => n.type === 'qcm');

  const handleAnswer = (id: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    const fullBytes = getFullHmBytes(raw);
    localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
      name,
      body: new TextDecoder().decode(fullBytes),
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
    const fullBytes = getFullHmBytes(raw);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([fullBytes], { type: "application/octet-stream" }));
    link.download = name.endsWith(".nff") ? name : `${name}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="hm-draft-view min-h-screen bg-[#F8F7F1] text-[#0F3D36]" dir="rtl">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#FFFFFF]/90 backdrop-blur border-b border-[#0F3D36]/20 flex items-center justify-between px-8 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#D9B892]/20 rounded-xl transition-colors text-[#0F3D36] flex items-center gap-1 text-sm font-semibold" 
            title="العودة للملفات"
          >
            <ArrowRight size={18} />
            <span>العودة</span>
          </button>
          <div className="h-5 w-[1px] bg-[#0F3D36]/20" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#B75A3C] tracking-widest uppercase flex items-center gap-2">
              <FileText size={11} /> NFF / HM DRAFT
            </span>
            <h1 className="text-sm font-bold text-[#0F3D36] truncate max-w-[300px]">{name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#5DB87F]/20 text-[#0F3D36] text-[11px] font-bold border border-[#5DB87F]/40">
            <Check size={12} className="text-[#5DB87F]" /> مود بشري
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                reparseBody(raw);
              }
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-2 border border-[#0F3D36]/20 hover:bg-[#D9B892]/20 text-[#0F3D36] px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? "عرض دلالي" : "تحرير المصدر"}</span>
          </button>

          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#0F3D36] hover:bg-[#0F3D36]/80 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Save size={13} />
              <span>{savedNotice ? "تم الحفظ ✓" : "حفظ التعديلات"}</span>
            </button>
          )}

          <button 
            onClick={download} 
            className="flex items-center gap-2 border border-[#0F3D36]/20 hover:bg-[#D9B892]/20 text-[#0F3D36] px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Download size={14} /> 
            <span>تنزيل HM</span>
          </button>

          {hasQcm && (
            <button 
              onClick={finishAndSaveAnswers} 
              className="flex items-center gap-2 bg-[#B75A3C] hover:bg-[#B75A3C]/80 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Save size={14} /> 
              <span>إنهاء وحفظ الإجابات</span>
            </button>
          )}
        </div>
      </header>

      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        <div className="bg-[#FFFFFF] border border-[#0F3D36]/20 rounded-2xl p-10 shadow-sm min-h-[72vh]">
          <div className="flex items-center justify-between mb-8 border-b border-[#0F3D36]/10 pb-4">
            <div className="flex items-center gap-2 text-[#0F3D36]">
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isEditing ? "محرر وسوم HM البشري" : "المعاينة الدلالية للمستند"}
              </span>
            </div>
            <span className="text-[11px] text-[#0F3D36]/60 font-mono">CORE v1.0 · NABD STUDIO</span>
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[520px] bg-[#F8F7F1] border border-[#0F3D36]/20 focus:border-[#0F3D36] rounded-xl p-6 font-mono text-xs text-[#0F3D36] leading-relaxed outline-none transition-colors resize-y"
                dir="rtl"
                placeholder="محتوى NFF بتنسيق HM..."
              />
              <div className="flex justify-between items-center mt-4 text-xs text-[#0F3D36]/60">
                <span>يدعم وسوم &lt;nff-prose tone="..."&gt; و &lt;nff-qcm&gt; و [[section]]</span>
                <span>اضغط &quot;عرض دلالي&quot; لرؤية التحديثات</span>
              </div>
            </div>
          ) : (
            <div>
              <NffRenderer nodes={nodes} onAnswer={handleAnswer} />

              {nodes.length === 0 && (
                <div className="py-20 text-center text-[#0F3D36]/60 italic text-sm">
                  لا يوجد محتوى لعرضه في هذه المسودة.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#FFFFFF] border-t border-[#0F3D36]/20 flex items-center justify-between px-8 text-[11px] text-[#0F3D36]/60">
        <span>NFF · LIVING ENVIRONMENT · by NABD STUDIO</span>
        <span className="uppercase tracking-wider">بيئة سيادية محلية · خصوصية كاملة</span>
      </footer>
    </div>
  );
}

/* Design: ورشة الإشارة — Swiss editorial software, charcoal field, ivory workbench, moss signal #9DBB8A. */
import { useMemo, useRef, useState } from "react";
import { FileCode2, FolderOpen, Hash, Layers3, ScanLine, ShieldCheck, Upload, X } from "lucide-react";
import { generateAim, generateHm, inspectHeader, parseNff } from "../core";

const STARTER_CONTENT = `---
title: مسودة NFF
priority: medium
classification: internal
---
[[section: title="نقطة البداية"]]
<nff-prose tone="calm">هذه مساحة اختبار محلية. اكتب محتوى NFF أو افتح ملفاً حقيقياً لفحصه.</nff-prose>`;

type Notice = { tone: "success" | "error" | "neutral"; text: string } | null;

function formatBytes(bytes: number) {
  return `${bytes.toLocaleString("ar-EG")} بايت`;
}

export default function Home() {
  const [content, setContent] = useState(STARTER_CONTENT);
  const [mode, setMode] = useState<"AIM" | "HM">("HM");
  const [fileName, setFileName] = useState("مسودة جديدة");
  const [notice, setNotice] = useState<Notice>(null);
  const [result, setResult] = useState<{ bytes: number; tags: number; nodes: number; title?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lineCount = useMemo(() => content.split("\n").length, [content]);

  async function generate() {
    try {
      const output = mode === "AIM" ? await generateAim(content) : await generateHm(content);
      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) throw new Error(inspection.error);
      const parsed = parseNff(output.bytes);
      setResult({ bytes: output.bytes.length, tags: parsed.tags.length, nodes: parsed.nodes.length, title: parsed.frontmatter.title });
      setNotice({ tone: "success", text: `${mode} جاهز للفحص — الرأس صالح والإصدار v1.0.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تحليل المحتوى." });
    }
  }

  async function openFile(file: File) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseNff(bytes);
      setContent(parsed.bodyContent);
      setMode(parsed.mode);
      setFileName(file.name);
      setResult({ bytes: bytes.length, tags: parsed.tags.length, nodes: parsed.nodes.length, title: parsed.frontmatter.title });
      setNotice({ tone: "success", text: `تم فتح ${file.name} دون إعادة ترميز.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "الملف غير صالح." });
    }
  }

  function download() {
    const blob = new Blob([new TextEncoder().encode(content)], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith(".nff") ? fileName : `${fileName}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice({ tone: "neutral", text: "تم تجهيز نسخة UTF-8 للتنزيل." });
  }

  return (
    <main className="nff-shell">
      <aside className="nff-rail">
        <div className="brand-lockup"><img src="/manus-storage/nff-mark_9588018c.png" alt="" /><span>NFF</span></div>
        <div className="rail-label">مساحات العمل</div>
        <nav className="rail-nav" aria-label="التنقل الرئيسي">
          <button className="rail-item active"><FolderOpen size={17} /><span>الملفات</span><b>01</b></button>
          <button className="rail-item"><Layers3 size={17} /><span>الإنشاء</span><b>02</b></button>
          <button className="rail-item muted"><ScanLine size={17} /><span>التحويل</span><b>03</b></button>
        </nav>
        <div className="rail-foot"><div className="pulse-dot" /> محلي أولاً<br /><small>لا يغادر المحتوى هذه الجلسة</small></div>
      </aside>

      <section className="nff-main">
        <header className="topline"><div><span className="eyebrow">NABD FILE FORMAT / WORKBENCH</span><h1>ورشة الإشارة</h1></div><div className="top-meta"><span>CORE v1.0</span><span className="top-divider" /><span>محرك ميكانيكي</span></div></header>
        <div className="workbench-grid">
          <section className="editor-column">
            <div className="section-kicker"><span>01</span><span>مساحة المصدر</span><span className="kicker-line" /><span>{lineCount} أسطر</span></div>
            <div className="paper-card">
              <div className="paper-head"><div className="file-title"><FileCode2 size={18} /><div><strong>{fileName}</strong><span>UTF-8 · مصدر المعرفة</span></div></div><button className="ghost-button" onClick={() => inputRef.current?.click()}><Upload size={16} /> فتح ملف</button><input ref={inputRef} type="file" accept=".nff,.txt" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); }} /></div>
              <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="محتوى NFF" />
              <div className="paper-foot"><span><span className="status-dot" /> تعديلات محلية</span><span>لا حفظ صامت</span></div>
            </div>
            <div className="action-row"><div className="mode-switch" role="group" aria-label="اختيار المود"><button className={mode === "AIM" ? "selected" : ""} onClick={() => setMode("AIM")}>AIM <small>آلي</small></button><button className={mode === "HM" ? "selected" : ""} onClick={() => setMode("HM")}>HM <small>بشري</small></button></div><button className="primary-button" onClick={() => void generate()}><ScanLine size={17} /> فحص وتوليد {mode}</button><button className="secondary-button" onClick={download}>تنزيل المصدر</button></div>
            {notice && <div className={`notice ${notice.tone}`} role="status"><span>{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "·"}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="إغلاق"><X size={14} /></button></div>}
          </section>

          <aside className="evidence-column">
            <div className="section-kicker"><span>02</span><span>سجل الدليل</span><span className="kicker-line" /><span>قراءة فقط</span></div>
            <div className="signal-visual"><img src="/manus-storage/nff-signal-card_e5d0848a.png" alt="بطاقة إشارة NFF" /><div className="signal-overlay"><span>HEADER / 18 B</span><strong>{result ? "VALID" : "READY"}</strong><small>00 4E 46 46 01</small><small>02 {mode === "AIM" ? "41 49 4D" : "48 4D 20"} 04</small><small>03 76 31 2E 30 03</small></div></div>
            <div className="evidence-list"><div className="evidence-row"><span className="evidence-icon"><ShieldCheck size={16} /></span><div><small>سلامة الرأس</small><strong>{result ? "مُتحقق" : "بانتظار الفحص"}</strong></div><b>{result ? "OK" : "—"}</b></div><div className="evidence-row"><span className="evidence-icon"><Hash size={16} /></span><div><small>النواة المصدرية</small><strong>{result ? "SHA-256 محسوبة" : "تُحسب عند التوليد"}</strong></div><b>{result ? "OK" : "—"}</b></div><div className="evidence-row"><span className="evidence-icon"><Layers3 size={16} /></span><div><small>العناصر الدلالية</small><strong>{result ? `${result.tags} وسم · ${result.nodes} عقدة` : "لم تُحلل بعد"}</strong></div><b>{result ? String(result.nodes).padStart(2, "0") : "—"}</b></div></div>
            <div className="metric-strip"><div><span>الحجم</span><strong>{result ? formatBytes(result.bytes) : "—"}</strong></div><div><span>الإصدار</span><strong>v1.0</strong></div><div><span>المود</span><strong>{mode}</strong></div></div>
          </aside>
        </div>
      </section>
    </main>
  );
}

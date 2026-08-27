/* Design: Nabd File Format — modern consumer workspace inspired by Google and Samsung, with calm surfaces, practical cards, minimal icon use, and RTL-first clarity. */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, FilePlus2, FolderOpen, Image, Layers3, Upload, WandSparkles, X } from "lucide-react";
import { generateAim, generateHm, inspectHeader, parseNff } from "../core";
import { convertExtractedToNff, detectFormat, exportNff, extractFile, type ExportFormat, type ExtractedFile } from "../core/file-conversion";
import { NffRenderer } from "../components/NffRenderer";
import { ParsedNffDocument } from "../core/schema";
import { activeKeyProvider, requireApiKey } from "../core/ai-key-provider";
import { Settings } from "lucide-react";

type Room = "files" | "convert" | "book";
type Notice = { tone: "success" | "error" | "neutral"; text: string } | null;

const STARTER_CONTENT = `---\ntitle: مسودة NFF\npriority: medium\nclassification: internal\n---\n[[section: title="نقطة البداية"]]\n<nff-prose tone="calm">هذه مساحة اختبار محلية. اكتب محتوى NFF أو افتح ملفاً حقيقياً لفحصه.</nff-prose>`;
const CONVERT_SAMPLE = "# عنوان المستند\n\nاكتب أو ألصق النص هنا لتحويله إلى ملف Nabd File Format.";

function formatBytes(bytes: number) { return `${bytes.toLocaleString("ar-EG")} بايت`; }

interface HomeProps {
  onNavigate: (room: string, mode?: 'aim' | 'hm', fileId?: string) => void;
  currentRoom: string;
}

export default function Home({ onNavigate, currentRoom }: HomeProps) {
  const [room, setRoom] = [currentRoom, onNavigate] as const;
  const [showNew, setShowNew] = useState(false);
  const [content, setContent] = useState(STARTER_CONTENT);
  const [convertText, setConvertText] = useState(CONVERT_SAMPLE);
  const [bookText, setBookText] = useState("الفصل الأول\n\nاكتب محتوى الفصل هنا.\n\n---\n\nالفصل الثاني\n\nأضف بقية المحتوى هنا.");
  const [mode, setMode] = useState<"AIM" | "HM">("HM");
  const [fileName, setFileName] = useState("مسودة جديدة");
  const [notice, setNotice] = useState<Notice>(null);
  const [result, setResult] = useState<{ bytes: number; tags: number; nodes: number; title?: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bookResult, setBookResult] = useState<{ units: number; mode: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const convertInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<ExtractedFile | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const [exportPreview, setExportPreview] = useState<{ name: string; mime: string; content: string } | null>(null);
  const [creationPath, setCreationPath] = useState<"open" | "write" | "design" | null>(null);
  const [customStyle, setCustomStyle] = useState({ theme: "classic", accent: "ink", spacing: "relaxed" });
  const lineCount = useMemo(() => content.split("\n").length, [content]);
  const bookUnits = useMemo(() => bookText.split(/\n\s*---\s*\n/).filter(Boolean), [bookText]);

  useEffect(() => {
    const onExternalFile = (event: Event) => {
      const file = (event as CustomEvent<File>).detail;
      if (file) void openFile(file);
    };
    window.addEventListener("nff:file-open", onExternalFile);
    return () => window.removeEventListener("nff:file-open", onExternalFile);
  }, []);

  function changeRoom(next: Room) { onNavigate(next); setNotice(null); setPreview(null); setShowNew(false); }

  async function generate(source = content, requestedMode = mode, customFileName = fileName) {
    // Local generation (AIM/HM) is deterministic and doesn't strictly require an API key
    // But per user request, AI features (semantic mapping, tone decision) are the "essence".
    // For "New File" creation, we will allow it but notify if no key is present.
    if (!requireApiKey(window.location.hash || "files", (path) => window.location.hash = path)) return;
    
    try {
      const output = requestedMode === "AIM" ? await generateAim(source) : await generateHm(source);
      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) throw new Error(inspection.error);
      
      const fileId = Math.random().toString(36).slice(2, 10);
      const finalName = customFileName.endsWith(".nff") ? customFileName : `${customFileName}.nff`;
      
      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
        name: finalName,
        body: new TextDecoder().decode(output.bytes),
        mode: requestedMode
      }));
      
      onNavigate("draft", requestedMode.toLowerCase() as 'aim' | 'hm', fileId);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تجهيز الملف." });
    }
  }

  async function openFile(file: File) {
    if (detectFormat(file) !== "nff") { onNavigate("convert"); await handleConversionFile(file); return; }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseNff(bytes);
      const fileId = Math.random().toString(36).slice(2, 10);
      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
        name: file.name,
        body: new TextDecoder().decode(bytes),
        mode: parsed.mode
      }));
      onNavigate("draft", parsed.mode.toLowerCase() as 'aim' | 'hm', fileId);
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "هذا الملف غير صالح." }); }
  }

  function download() {
    if (!preview) { setNotice({ tone: "neutral", text: "أنشئ معاينة أولاً قبل التنزيل." }); return; }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([new TextEncoder().encode(preview)], { type: "application/octet-stream" }));
    link.download = fileName.endsWith(".nff") ? fileName : `${fileName}.nff`;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice({ tone: "neutral", text: "تم تنزيل النسخة بعد المعاينة." });
  }

  function convert() {
    const source = `---\ntitle: ${convertText.split("\n")[0].replace(/^#\s*/, "مستند جديد")}\npriority: medium\nclassification: local\n---\n[[section: title="المحتوى"]]\n<nff-prose tone="calm">${convertText.replace(/<|>/g, "")}</nff-prose>`;
    setContent(source); setFileName("مستند محوّل"); setRoom("files"); void generate(source, mode); setNotice({ tone: "success", text: "تم تحويل النص. راجع الملف في غرفة الملفات." });
  }

  function buildBook() {
    setBookResult({ units: bookUnits.length, mode });
    setNotice({ tone: "success", text: `تم تجهيز كتاب من ${bookUnits.length} وحدات. يمكنك مراجعته قبل التنزيل.` });
  }

  async function handleConversionFile(file: File) {
    setExtracting(true); setProgress("بدء القراءة المحلية"); setNotice(null); setExportPreview(null);
    try {
      const extracted = await extractFile(file, setProgress);
      setUploaded(extracted);
      setNotice({ tone: "success", text: `تمت قراءة ${file.name} محلياً. اختر المود ثم ابدأ المعاينة.` });
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر قراءة الملف." }); }
    finally { setExtracting(false); setProgress(""); }
  }

  async function convertUploaded() {
    if (!uploaded) { setNotice({ tone: "neutral", text: "ارفع ملفاً أولاً." }); return; }
    setExtracting(true); setProgress("تجهيز NFF");
    try {
      const output = await convertExtractedToNff(uploaded, mode);
      const parsed = parseNff(output.bytes);
      setContent(parsed.bodyContent); setFileName(`${uploaded.name.replace(/\\.[^.]+$/, "")}.nff`); setPreview(new TextDecoder().decode(output.bytes));
      setResult({ bytes: output.bytes.length, tags: parsed.tags.length, nodes: parsed.nodes.length, title: parsed.frontmatter.title });
      setNotice({ tone: "success", text: "تم تجهيز NFF. راجع المعاينة قبل التنزيل." });
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تحويل الملف." }); }
    finally { setExtracting(false); setProgress(""); }
  }

  function prepareExport() {
    if (!uploaded?.document) { setNotice({ tone: "neutral", text: "ارفع ملف NFF صالحاً أولاً للتصدير." }); return; }
    setExportPreview(exportNff(uploaded.document, exportFormat));
    setNotice({ tone: "success", text: "تم تجهيز معاينة التصدير. لن يتم تنزيل شيء قبل ضغط الزر." });
  }

  function downloadExport() {
    if (!exportPreview) return;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([exportPreview.content], { type: exportPreview.mime })); link.download = exportPreview.name; link.click(); URL.revokeObjectURL(link.href);
    setNotice({ tone: "neutral", text: "تم تنزيل الملف بعد الموافقة." });
  }

  return <main className="nff-shell">
    <aside className="nff-rail">
      <div className="brand-lockup"><div className="brand-symbol" aria-label="NFF"><span /><span /><span /><span /><span /><span /></div><div><strong>Nabd File Format</strong><small>تنظيم المحتوى ببساطة</small></div></div>
      <nav className="rail-nav" aria-label="الغرف">
        <button className={`rail-item ${room === "files" ? "active" : ""}`} onClick={() => changeRoom("files")}><FolderOpen size={18} /><span>الملفات</span><b>01</b></button>
        <button className={`rail-item ${room === "convert" ? "active" : ""}`} onClick={() => changeRoom("convert")}><Layers3 size={18} /><span>تحويل ملف</span><b>02</b></button>
        <button className={`rail-item ${room === "book" ? "active" : ""}`} onClick={() => changeRoom("book")}><BookOpen size={18} /><span>تحويل كتاب</span><b>03</b></button>
        <button className={`rail-item ${room === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}><Settings size={18} /><span>الإعدادات</span><b>04</b></button>
      </nav>
      <div className="rail-foot"><span className="pulse-dot" /> محتواك محلي<br /><small>لا شيء يغادر جهازك</small></div>
    </aside>

    <section className="nff-main">
      <header className="topline"><div><span className="eyebrow">NFF / FILE SYSTEM</span><h1>Nabd File Format</h1><p>افتح ملفك، افحصه، واحتفظ بنسخة واضحة منه.</p></div><div className="top-actions"><span className="local-pill"><span className="pulse-dot" /> محلي</span><button className="icon-button" aria-label="تعليمات المراجعة" onClick={() => setNotice({ tone: "neutral", text: "راجع النتيجة قبل أي تنزيل أو حفظ." })}><Check size={18} /></button></div></header>

      {room === "files" && <section className="room-view files-room">
        <div className="view-heading"><div><span className="room-overline">FILE DESK</span><h2>ملفاتك</h2><p>كل ملف يبدأ من هنا: افتح، راجع، ثم قرر ما تريد فعله به.</p></div><button className="primary-button" onClick={() => setShowNew(true)}><FilePlus2 size={17} /> ملف جديد</button></div>
        {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}
        <div className="quick-grid">
          <button className="quick-card" onClick={() => { setCreationPath("open"); inputRef.current?.click(); }}><span className="quick-icon"><Upload size={21} /></span><div><strong>فتح ملف</strong><small>NFF أو ملف من جهازك</small></div><ChevronLeft size={18} /></button>
          <button className="quick-card" onClick={() => void generate(STARTER_CONTENT, "HM", "مسودة جديدة")}><span className="quick-icon mint"><FilePlus2 size={21} /></span><div><strong>إنشاء نص</strong><small>كتابة أو لصق نص (HM)</small></div><ChevronLeft size={18} /></button>
          <button className="quick-card" onClick={() => void generate(STARTER_CONTENT, "AIM", "مسودة جديدة")}><span className="quick-icon coral"><Layers3 size={21} /></span><div><strong>إنشاء AIM</strong><small>مسودة آلية مضغوطة</small></div><ChevronLeft size={18} /></button>
        </div>
        <input ref={inputRef} type="file" accept=".nff,.txt,.md,.pdf,.docx,.xlsx,.png,.jpg,.jpeg" className="browser-file-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); }} />
      </section>}

      {room === "draft" && <section className={`room-view draft-room ${mode === "AIM" ? "aim-mode" : "hm-mode"}`}>
        <div className="view-heading">
          <div>
            <span className="room-overline">{mode} DRAFT</span>
            <h2>{fileName}</h2>
            <p>{mode === "HM" ? "مسودة بشرية قابلة للمراجعة والتخصيص." : "مسودة آلية مضغوطة مخصصة للذكاء."}</p>
          </div>
          <div className="view-actions">
            <button className="outline-button" onClick={() => setRoom("files")}><ArrowRight size={16} /> العودة للملفات</button>
            <button className="primary-button" onClick={download} disabled={!preview}><Check size={16} /> تنزيل {mode}</button>
          </div>
        </div>

        {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}

        <div className="draft-layout">
          <div className="editor-panel">
            <div className="panel-head">
              <div><strong>المحتوى المصدر</strong><small>{lineCount} أسطر</small></div>
              <div className="mode-badge">{mode} مقفل</div>
            </div>
            <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="محتوى الملف" />
            <div className="editor-foot">
              <button className="outline-button" onClick={() => void generate()}><WandSparkles size={16} /> تحديث المعاينة</button>
              <span>التعديلات محلية بالكامل</span>
            </div>
          </div>

          <div className="preview-side">
            {creationPath === "design" && mode === "HM" && (
              <div className="side-card design-card">
                <div className="ai-badge"><Layers3 size={16} /> تخصيص بصري</div>
                <h3>تنسيق HM مخصص</h3>
                <div className="design-options">
                  <div className="option-group">
                    <span>السمة</span>
                    <div className="chips">
                      <button className={customStyle.theme === "classic" ? "active" : ""} onClick={() => setCustomStyle(s => ({ ...s, theme: "classic" }))}>كلاسيك</button>
                      <button className={customStyle.theme === "modern" ? "active" : ""} onClick={() => setCustomStyle(s => ({ ...s, theme: "modern" }))}>عصري</button>
                      <button className={customStyle.theme === "glass" ? "active" : ""} onClick={() => setCustomStyle(s => ({ ...s, theme: "glass" }))}>زجاجي</button>
                    </div>
                  </div>
                  <div className="option-group">
                    <span>اللون المميز</span>
                    <div className="color-dots">
                      <button className={`dot ink ${customStyle.accent === "ink" ? "active" : ""}`} onClick={() => setCustomStyle(s => ({ ...s, accent: "ink" }))} />
                      <button className={`dot moss ${customStyle.accent === "moss" ? "active" : ""}`} onClick={() => setCustomStyle(s => ({ ...s, accent: "moss" }))} />
                      <button className={`dot copper ${customStyle.accent === "copper" ? "active" : ""}`} onClick={() => setCustomStyle(s => ({ ...s, accent: "copper" }))} />
                    </div>
                  </div>
                </div>
                <button className="soft-button" onClick={() => void generate()}>تطبيق التنسيق</button>
              </div>
            )}

            <div className="nff-render-box">
              <div className="render-head">معاينة {mode === "HM" ? "العرض الدلالي" : "الضغط الميكانيكي"}</div>
              {!preview ? (
                <div className="empty-preview">اضغط تحديث المعاينة لرؤية النتيجة</div>
              ) : mode === "HM" ? (
                <NffRenderer nodes={parseNff(new TextEncoder().encode(preview)).nodes} />
              ) : (
                <pre className="aim-text">{preview}</pre>
              )}
            </div>
          </div>
        </div>
      </section>}

      {room === "convert" && <section className="room-view simple-room"><div className="view-heading"><div><span className="room-overline">مختبر التحويل</span><h2>حوّل ملفاتك إلى NFF</h2><p>ارفع الملف، اختر المود، ثم راجع النتيجة قبل تنزيلها.</p></div><button className="outline-button" onClick={() => changeRoom("files")}><ArrowRight size={16} /> العودة إلى الملفات</button></div>{notice && <Notice notice={notice} onClose={() => setNotice(null)} />}<div className="upload-stage"><input ref={convertInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.nff" className="browser-file-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleConversionFile(file); }} /><button className="drop-card" onClick={() => convertInputRef.current?.click()}><span className="drop-icon"><Upload size={28} /></span><strong>{extracting ? progress || "جارٍ قراءة الملف" : uploaded ? uploaded.name : "اختر ملفاً من جهازك"}</strong><small>{extracting ? "المعالجة تتم محلياً" : uploaded ? `${uploaded.format.toUpperCase()} · ${Math.round(uploaded.size / 1024)} KB · جاهز للتحويل` : "PDF · Word · Excel · TXT · Markdown · صورة"}</small>{extracting && <span className="progress-line" />}</button><div className="upload-side"><div className="format-summary"><strong>الصيغ المدعومة</strong><div><b>PDF</b><b>DOCX</b><b>XLSX</b><b>TXT</b><b>MD</b><b>صور</b></div><small>الاستخراج يتم داخل جهازك دون رفع الملف إلى خدمة خارجية.</small></div><div className="mode-choice"><span>الصيغة الداخلية</span><div className="mode-switch"><button className={mode === "HM" ? "selected" : ""} onClick={() => setMode("HM")}>HM · واضح</button><button className={mode === "AIM" ? "selected" : ""} onClick={() => setMode("AIM")}>AIM · مختصر</button></div></div></div></div><div className="conversion-actions"><div className="ai-inline"><Check size={16} /><span><strong>المعالجة محلية</strong><small>نراجع النتيجة قبل إنشاء الملف</small></span></div><button className="primary-button" disabled={!uploaded || extracting} onClick={() => void convertUploaded()}><WandSparkles size={17} /> تحويل ومعاينة</button></div>{uploaded && <div className="extracted-preview"><div className="field-line"><strong>النص المستخرج</strong><span>{uploaded.notes[0] || "جاهز"}</span></div><pre>{uploaded.text.slice(0, 2400)}{uploaded.text.length > 2400 ? "\n…" : ""}</pre></div>}{uploaded?.document && <div className="export-panel"><div><strong>إخراج NFF إلى صيغة أخرى</strong><small>متاح الآن: TXT وMarkdown وJSON وHTML</small></div><div className="export-actions"><select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)} aria-label="صيغة الإخراج"><option value="md">Markdown</option><option value="txt">TXT</option><option value="json">JSON</option><option value="html">HTML</option></select><button className="outline-button" onClick={prepareExport}>معاينة الإخراج</button>{exportPreview && <button className="primary-button" onClick={downloadExport}>تنزيل بعد المراجعة</button>}</div></div>}{exportPreview && <div className="export-preview"><strong>{exportPreview.name}</strong><pre>{exportPreview.content.slice(0, 1800)}</pre></div>}</section>}

      {room === "book" && <section className="room-view simple-room"><div className="view-heading"><div><span className="room-overline">كتاب</span><h2>حوّل كتاباً كاملاً (AIM فقط)</h2><p>ارفع ملف كتاب (PDF/Word) لتقطيره إلى وحدات AIM منظمة.</p></div><button className="outline-button" onClick={() => changeRoom("files")}><ArrowRight size={16} /> العودة إلى الملفات</button></div>{notice && <Notice notice={notice} onClose={() => setNotice(null)} />}<div className="upload-stage"><input ref={convertInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx" className="browser-file-input" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleConversionFile(file); }} /><button className="drop-card" onClick={() => convertInputRef.current?.click()}><span className="drop-icon"><Upload size={28} /></span><strong>{extracting ? progress || "جارٍ قراءة الملف" : uploaded ? uploaded.name : "اختر ملفاً من جهازك"}</strong><small>{extracting ? "المعالجة تتم محلياً" : uploaded ? `${uploaded.format.toUpperCase()} · ${Math.round(uploaded.size / 1024)} KB · جاهز للتحويل` : "PDF · Word · Excel · TXT · Markdown"}</small>{extracting && <span className="progress-line" />}</button><div className="upload-side"><div className="format-summary"><strong>الصيغ المدعومة</strong><div><b>PDF</b><b>DOCX</b><b>XLSX</b><b>TXT</b><b>MD</b></div><small>الاستخراج يتم داخل جهازك دون رفع الملف إلى خدمة خارجية.</small></div><div className="mode-choice"><span>الصيغة الداخلية</span><div className="mode-switch"><button className="selected" disabled>AIM · حصري</button></div></div></div></div><div className="conversion-actions"><div className="ai-inline"><Check size={16} /><span><strong>المعالجة محلية</strong><small>نراجع النتيجة قبل تقطير الكتاب</small></span></div><button className="primary-button" disabled={!uploaded || extracting} onClick={() => { setMode("AIM"); void convertUploaded(); }}><BookOpen size={17} /> تقطير الكتاب</button></div>{uploaded && <div className="extracted-preview"><div className="field-line"><strong>النص المستخرج</strong><span>{uploaded.notes[0] || "جاهز"}</span></div><pre>{uploaded.text.slice(0, 2400)}{uploaded.text.length > 2400 ? "\n…" : ""}</pre></div>}</section>}
    </section>
    {showNew && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="new-dialog"><button className="dialog-close" onClick={() => setShowNew(false)} aria-label="إغلاق"><X size={17} /></button><span className="room-overline">ملف جديد</span><h2>كيف تريد أن تبدأ؟</h2><p>اختر مساراً واحداً، وستبقى كل خطوة قابلة للمراجعة قبل الحفظ.</p><div className="new-options"><button onClick={() => { setShowNew(false); inputRef.current?.click(); }}><span className="new-icon"><Upload size={21} /></span><strong>رفع ملف</strong><small>افتح ملفاً من جهازك</small></button><button onClick={() => { setShowNew(false); void generate(STARTER_CONTENT, "HM", "مسودة جديدة"); }}><span className="new-icon mint"><FilePlus2 size={21} /></span><strong>إنشاء HM</strong><small>اكتب ملفاً بشرياً واضحاً</small></button><button onClick={() => { setShowNew(false); void generate(STARTER_CONTENT, "AIM", "مسودة جديدة"); }}><span className="new-icon coral"><WandSparkles size={21} /></span><strong>إنشاء AIM</strong><small>مسودة آلية مضغوطة</small></button></div></div></div>}
  </main>;
}

function Notice({ notice, onClose }: { notice: Notice; onClose: () => void }) { if (!notice) return null; return <div className={`notice ${notice.tone}`} role="status"><span>{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "i"}</span><p>{notice.text}</p><button onClick={onClose} aria-label="إغلاق"><X size={15} /></button></div>; }

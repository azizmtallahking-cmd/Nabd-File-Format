/* Design: Nabd File Format — modern consumer workspace inspired by Google and Samsung, with calm surfaces, practical cards, minimal icon use, and RTL-first clarity. */
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, FilePlus2, FolderOpen, Image, Layers3, Sparkles, Upload, WandSparkles, X } from "lucide-react";
import { generateAim, generateHm, inspectHeader, parseNff } from "../core";

type Room = "files" | "convert" | "book";
type Notice = { tone: "success" | "error" | "neutral"; text: string } | null;

const STARTER_CONTENT = `---\ntitle: مسودة NFF\npriority: medium\nclassification: internal\n---\n[[section: title="نقطة البداية"]]\n<nff-prose tone="calm">هذه مساحة اختبار محلية. اكتب محتوى NFF أو افتح ملفاً حقيقياً لفحصه.</nff-prose>`;
const CONVERT_SAMPLE = "# عنوان المستند\n\nاكتب أو ألصق النص هنا لتحويله إلى ملف Nabd File Format.";

function formatBytes(bytes: number) { return `${bytes.toLocaleString("ar-EG")} بايت`; }

export default function Home() {
  const [room, setRoom] = useState<Room>("files");
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
  const lineCount = useMemo(() => content.split("\n").length, [content]);
  const bookUnits = useMemo(() => bookText.split(/\n\s*---\s*\n/).filter(Boolean), [bookText]);

  function changeRoom(next: Room) { setRoom(next); setNotice(null); setPreview(null); setShowNew(false); }

  async function generate(source = content, requestedMode = mode) {
    try {
      const output = requestedMode === "AIM" ? await generateAim(source) : await generateHm(source);
      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) throw new Error(inspection.error);
      const parsed = parseNff(output.bytes);
      setResult({ bytes: output.bytes.length, tags: parsed.tags.length, nodes: parsed.nodes.length, title: parsed.frontmatter.title });
      setPreview(new TextDecoder().decode(output.bytes));
      setNotice({ tone: "success", text: "تم تجهيز الملف. راجعه قبل أي تنزيل." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تجهيز الملف." });
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
      setPreview(new TextDecoder().decode(bytes));
      setNotice({ tone: "success", text: `تم فتح ${file.name}. راجع المحتوى قبل المتابعة.` });
      setShowNew(false);
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

  return <main className="nff-shell">
    <aside className="nff-rail">
      <div className="brand-lockup"><div className="brand-symbol">N</div><div><strong>Nabd File Format</strong><small>تنظيم المحتوى ببساطة</small></div></div>
      <nav className="rail-nav" aria-label="الغرف">
        <button className={`rail-item ${room === "files" ? "active" : ""}`} onClick={() => changeRoom("files")}><FolderOpen size={18} /><span>الملفات</span><b>01</b></button>
        <button className={`rail-item ${room === "convert" ? "active" : ""}`} onClick={() => changeRoom("convert")}><Layers3 size={18} /><span>تحويل ملف</span><b>02</b></button>
        <button className={`rail-item ${room === "book" ? "active" : ""}`} onClick={() => changeRoom("book")}><BookOpen size={18} /><span>تحويل كتاب</span><b>03</b></button>
      </nav>
      <div className="rail-foot"><span className="pulse-dot" /> محتواك محلي<br /><small>لا شيء يغادر جهازك</small></div>
    </aside>

    <section className="nff-main">
      <header className="topline"><div><span className="eyebrow">NABD FILE FORMAT</span><h1>Nabd File Format</h1><p>مساحة بسيطة لإنشاء ملفاتك وتنظيمها وتحويلها</p></div><div className="top-actions"><span className="local-pill"><span className="pulse-dot" /> محلي</span><button className="icon-button" aria-label="مساعد AI"><Sparkles size={18} /></button></div></header>

      {room === "files" && <section className="room-view">
        <div className="view-heading"><div><span className="room-overline">مساحتك</span><h2>ملفاتك</h2><p>افتح ملفاً أو أنشئ ملفاً جديداً بالطريقة التي تناسبك.</p></div><button className="primary-button" onClick={() => setShowNew(true)}><FilePlus2 size={17} /> ملف جديد</button></div>
        {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}
        <div className="quick-grid">
          <button className="quick-card primary-quick" onClick={() => inputRef.current?.click()}><span className="quick-icon"><Upload size={21} /></span><div><strong>رفع ملف</strong><small>NFF أو نص جاهز من جهازك</small></div><ChevronLeft size={18} /></button>
          <button className="quick-card" onClick={() => { setFileName("مسودة جديدة"); setContent(STARTER_CONTENT); setResult(null); setPreview(null); setNotice(null); }}><span className="quick-icon mint"><FilePlus2 size={21} /></span><div><strong>إنشاء ملف HM</strong><small>اكتب المحتوى ثم راجعه قبل الحفظ</small></div><ChevronLeft size={18} /></button>
          <button className="quick-card" onClick={() => changeRoom("convert")}><span className="quick-icon coral"><WandSparkles size={21} /></span><div><strong>تحويل مصدر</strong><small>حوّل نصاً أو مستنداً إلى NFF</small></div><ChevronLeft size={18} /></button>
        </div>
        <input ref={inputRef} type="file" accept=".nff,.txt,.md,.pdf,.docx,.xlsx,.png,.jpg,.jpeg" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); }} />
        <div className="editor-layout"><div className="editor-panel"><div className="panel-head"><div><strong>{fileName}</strong><small>{lineCount} أسطر · مسودة محلية</small></div><button className="outline-button" onClick={() => void generate()}><Check size={16} /> معاينة الملف</button></div><textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="محتوى الملف" /><div className="editor-foot"><div className="mode-switch"><button className={mode === "HM" ? "selected" : ""} onClick={() => setMode("HM")}>HM</button><button className={mode === "AIM" ? "selected" : ""} onClick={() => setMode("AIM")}>AIM</button></div><span>لن يتم الحفظ أو التنزيل دون مراجعتك</span></div></div><div className="side-card ai-card"><div className="ai-badge"><Sparkles size={16} /> AI</div><h3>مساعد ترتيب المحتوى</h3><p>اقتراحات صغيرة لتحسين شكل الملف، مع إبقاء النص تحت سيطرتك.</p><button className="soft-button" onClick={() => setNotice({ tone: "neutral", text: "مساعد AI جاهز للاقتراح، ولن يغير النص تلقائياً." })}>عرض اقتراح</button><div className="ai-note">لا تغيير للنص · مراجعة قبل الاعتماد</div></div></div>
        {preview && <div className="preview-card"><div><strong>المعاينة جاهزة</strong><small>{result ? `${formatBytes(result.bytes)} · ${result.nodes} عناصر` : "راجع النسخة قبل التنزيل"}</small></div><button className="primary-button" onClick={download}>تنزيل الملف</button></div>}
      </section>}

      {room === "convert" && <section className="room-view simple-room"><div className="view-heading"><div><span className="room-overline">تحويل</span><h2>حوّل أي نص إلى NFF</h2><p>ألصق المحتوى، اختر الطريقة، ثم راجع الملف قبل تنزيله.</p></div><button className="outline-button" onClick={() => changeRoom("files")}><ArrowRight size={16} /> العودة إلى الملفات</button></div>{notice && <Notice notice={notice} onClose={() => setNotice(null)} />}<div className="convert-toolbar"><div className="choice-group"><span>طريقة الإخراج</span><button className={mode === "HM" ? "selected" : ""} onClick={() => setMode("HM")}>HM · واضح</button><button className={mode === "AIM" ? "selected" : ""} onClick={() => setMode("AIM")}>AIM · مختصر</button></div><div className="format-chips"><span>المصادر</span><b>نص</b><b>Markdown</b><b>ملفات محلية</b></div></div><textarea className="large-editor" value={convertText} onChange={(event) => setConvertText(event.target.value)} aria-label="النص المراد تحويله" /><div className="bottom-action"><div className="ai-inline"><Sparkles size={16} /><span><strong>مساعد AI</strong><small>يساعدك على ترتيب العناوين فقط</small></span></div><button className="primary-button" onClick={convert}><WandSparkles size={17} /> تحويل ومراجعة</button></div></section>}

      {room === "book" && <section className="room-view simple-room"><div className="view-heading"><div><span className="room-overline">كتاب</span><h2>حوّل كتاباً كاملاً</h2><p>قسّم المحتوى إلى وحدات، ثم جهّز نسخة منظمة للمراجعة.</p></div><button className="outline-button" onClick={() => changeRoom("files")}><ArrowRight size={16} /> العودة إلى الملفات</button></div>{notice && <Notice notice={notice} onClose={() => setNotice(null)} />}<div className="book-layout"><div className="book-editor"><div className="field-line"><strong>محتوى الكتاب</strong><span>{bookUnits.length} وحدات مكتشفة</span></div><textarea className="large-editor" value={bookText} onChange={(event) => setBookText(event.target.value)} aria-label="محتوى الكتاب" /></div><div className="book-side"><div className="book-cover"><BookOpen size={30} /><strong>كتابك في خطوات</strong><span>ضع — بين الوحدات</span></div><div className="book-mode"><span>صيغة الوحدات</span><div className="mode-switch"><button className={mode === "HM" ? "selected" : ""} onClick={() => setMode("HM")}>HM</button><button className={mode === "AIM" ? "selected" : ""} onClick={() => setMode("AIM")}>AIM</button></div></div><button className="primary-button full" onClick={buildBook}><BookOpen size={17} /> تجهيز الكتاب</button></div></div>{bookResult && <div className="preview-card"><div><strong>الكتاب جاهز للمراجعة</strong><small>{bookResult.units} وحدات · صيغة {bookResult.mode}</small></div><button className="outline-button" onClick={() => setNotice({ tone: "neutral", text: "المعاينة التفصيلية للكتاب ستظهر قبل التنزيل." })}>فتح المعاينة</button></div>}</section>}
    </section>
    {showNew && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="new-dialog"><button className="dialog-close" onClick={() => setShowNew(false)} aria-label="إغلاق"><X size={17} /></button><span className="room-overline">ملف جديد</span><h2>كيف تريد أن تبدأ؟</h2><p>اختر مساراً واحداً، وستبقى كل خطوة قابلة للمراجعة قبل الحفظ.</p><div className="new-options"><button onClick={() => inputRef.current?.click()}><span className="new-icon"><Upload size={21} /></span><strong>رفع ملف</strong><small>افتح ملفاً من جهازك</small></button><button onClick={() => { setShowNew(false); setRoom("files"); setContent(STARTER_CONTENT); setFileName("مسودة جديدة"); }}><span className="new-icon mint"><FilePlus2 size={21} /></span><strong>إنشاء HM</strong><small>اكتب ملفاً بشرياً واضحاً</small></button><button onClick={() => { setShowNew(false); setRoom("convert"); }}><span className="new-icon coral"><WandSparkles size={21} /></span><strong>تحويل مصدر</strong><small>حوّل نصاً أو Markdown</small></button></div></div></div>}
  </main>;
}

function Notice({ notice, onClose }: { notice: Notice; onClose: () => void }) { if (!notice) return null; return <div className={`notice ${notice.tone}`} role="status"><span>{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "i"}</span><p>{notice.text}</p><button onClick={onClose} aria-label="إغلاق"><X size={15} /></button></div>; }

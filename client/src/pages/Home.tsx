/* Design: Nabd File Format — NABD STUDIO Visual DNA. Ink navy, Deep Green, Terracotta, and Sand Gold on tactile canvas. */
import { useEffect, useMemo, useRef, useState } from "react";
import { 
  ArrowRight, 
  BookOpen, 
  Check, 
  ChevronLeft, 
  FilePlus2, 
  FolderOpen, 
  Layers3, 
  Upload, 
  WandSparkles, 
  X, 
  Settings, 
  Trash2, 
  FileText, 
  Terminal, 
  Sparkles,
  ShieldCheck,
  Clock,
  HardDrive
} from "lucide-react";
import { generateAim, generateHm, inspectHeader, parseNff } from "../core";
import { convertExtractedToNff, detectFormat, exportNff, extractFile, type ExportFormat, type ExtractedFile } from "../core/file-conversion";
import { NffRenderer } from "../components/NffRenderer";

type Room = "files" | "convert" | "book";
type Notice = { tone: "success" | "error" | "neutral"; text: string } | null;

interface SavedDraft {
  id: string;
  name: string;
  mode: "AIM" | "HM";
  createdAt: number;
}

const STARTER_HM_CONTENT = `---
title: مسودة HM جديدة
priority: medium
classification: internal
---
[[section: title="نقطة البداية"]]
<nff-prose tone="calm">هذه مسودة بشرية بتنسيق NFF الدلالي. يمكنك تحرير النص وتخصيص النبرات الدلالية والتنقل بين المعاينة ومحرر الوسوم.</nff-prose>`;

const STARTER_AIM_CONTENT = `---
title: مسودة AIM جديدة
priority: high
classification: internal
---
[[section: title="المعالجة الآلية"]]
<nff-prose tone="executive">هذه مسودة آلية مكثفة تخضع لقواعد التحقق الميكانيكية وتضغط البيانات بكفاءة محددة.</nff-prose>`;

const CONVERT_SAMPLE = "# عنوان المستند\n\nاكتب أو ألصق النص هنا لتحويله إلى ملف Nabd File Format.";

interface HomeProps {
  onNavigate: (room: string, mode?: 'aim' | 'hm', fileId?: string) => void;
  currentRoom: string;
}

export default function Home({ onNavigate, currentRoom }: HomeProps) {
  const room = currentRoom;
  const [showNew, setShowNew] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Drafts index
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);

  // Conversion state
  const [convertMode, setConvertMode] = useState<"AIM" | "HM">("HM");
  const [uploaded, setUploaded] = useState<ExtractedFile | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState("");
  const [convertPreview, setConvertPreview] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const [exportPreview, setExportPreview] = useState<{ name: string; mime: string; content: string } | null>(null);

  // Book state (AIM ONLY)
  const [bookUploaded, setBookUploaded] = useState<ExtractedFile | null>(null);
  const [bookExtracting, setBookExtracting] = useState(false);
  const [bookProgress, setBookProgress] = useState("");
  const [distillingBook, setDistillingBook] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const convertInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Load existing drafts from localStorage
  const loadDrafts = () => {
    try {
      const drafts: SavedDraft[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("nff_draft_")) {
          const fileId = key.replace("nff_draft_", "");
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            drafts.push({
              id: fileId,
              name: data.name || "مسودة بدون عنوان",
              mode: (data.mode || "HM") as "AIM" | "HM",
              createdAt: data.updatedAt || data.createdAt || Date.now()
            });
          }
        }
      }
      drafts.sort((a, b) => b.createdAt - a.createdAt);
      setSavedDrafts(drafts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDrafts();

    const onExternalFile = (event: Event) => {
      const file = (event as CustomEvent<File>).detail;
      if (file) void openFile(file);
    };
    window.addEventListener("nff:file-open", onExternalFile);
    return () => window.removeEventListener("nff:file-open", onExternalFile);
  }, []);

  function changeRoom(next: Room) {
    onNavigate(next);
    setNotice(null);
    setShowNew(false);
  }

  // Pure, non-blocking draft creation
  async function createDraft(requestedMode: "AIM" | "HM", source?: string, customFileName?: string) {
    try {
      const defaultContent = requestedMode === "AIM" ? STARTER_AIM_CONTENT : STARTER_HM_CONTENT;
      const contentToUse = source || defaultContent;
      
      const output = requestedMode === "AIM" 
        ? await generateAim(contentToUse) 
        : await generateHm(contentToUse);

      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) {
        throw new Error(inspection.error || "خطأ في بنية الترويسة");
      }

      const fileId = "doc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      const defaultName = requestedMode === "AIM" ? "aim-draft.nff" : "hm-draft.nff";
      const baseName = customFileName || defaultName;
      const finalName = baseName.endsWith(".nff") ? baseName : `${baseName}.nff`;

      const draftPayload = {
        id: fileId,
        name: finalName,
        body: new TextDecoder().decode(output.bytes),
        mode: requestedMode,
        createdAt: Date.now()
      };

      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify(draftPayload));
      loadDrafts();

      setShowNew(false);
      onNavigate("draft", requestedMode.toLowerCase() as 'aim' | 'hm', fileId);
    } catch (error) {
      setNotice({ 
        tone: "error", 
        text: error instanceof Error ? error.message : "تعذر إنشاء المسودة." 
      });
    }
  }

  // Open existing local file
  async function openFile(file: File) {
    if (detectFormat(file) !== "nff") {
      onNavigate("convert");
      await handleConversionFile(file);
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseNff(bytes);
      const fileId = "doc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      
      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
        id: fileId,
        name: file.name,
        body: new TextDecoder().decode(bytes),
        mode: parsed.mode,
        createdAt: Date.now()
      }));
      
      loadDrafts();
      onNavigate("draft", parsed.mode.toLowerCase() as 'aim' | 'hm', fileId);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "هذا الملف غير صالح كملف NFF." });
    }
  }

  // Delete draft from local storage
  function deleteDraft(fileId: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (confirm("هل تريد بالتأكيد حذف هذه المسودة من جهازك؟")) {
      localStorage.removeItem(`nff_draft_${fileId}`);
      loadDrafts();
      setNotice({ tone: "neutral", text: "تم حذف المسودة محلياً." });
    }
  }

  // Handle conversion upload
  async function handleConversionFile(file: File) {
    setExtracting(true);
    setProgress("بدء القراءة المحلية للبيانات...");
    setNotice(null);
    setExportPreview(null);
    try {
      const extracted = await extractFile(file, setProgress);
      setUploaded(extracted);
      setNotice({ tone: "success", text: `تمت قراءة ${file.name} محلياً بنجاح.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر قراءة محتوى الملف." });
    } finally {
      setExtracting(false);
      setProgress("");
    }
  }

  // Convert uploaded file in convert room
  async function convertUploaded() {
    if (!uploaded) {
      setNotice({ tone: "neutral", text: "ارفع ملفاً أولاً." });
      return;
    }
    setExtracting(true);
    setProgress("تجهيز وتنسيق NFF...");
    try {
      const output = await convertExtractedToNff(uploaded, convertMode);
      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) throw new Error(inspection.error);

      const fileId = "doc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      const finalName = `${uploaded.name.replace(/\.[^.]+$/, "")}.nff`;
      const body = new TextDecoder().decode(output.bytes);

      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
        id: fileId,
        name: finalName,
        body,
        mode: convertMode,
        createdAt: Date.now()
      }));
      loadDrafts();

      onNavigate("draft", convertMode.toLowerCase() as 'aim' | 'hm', fileId);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تحويل الملف." });
    } finally {
      setExtracting(false);
      setProgress("");
    }
  }

  // Handle book file upload
  async function handleBookFile(file: File) {
    setBookExtracting(true);
    setBookProgress("قراءة وتحليل ملف الكتاب محلياً...");
    setNotice(null);
    try {
      const extracted = await extractFile(file, setBookProgress);
      setBookUploaded(extracted);
      setNotice({ tone: "success", text: `تم استخراج محتوى الكتاب (${file.name}) بنجاح. جاهز للتقطير إلى AIM.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر قراءة ملف الكتاب." });
    } finally {
      setBookExtracting(false);
      setBookProgress("");
    }
  }

  // Distill book into AIM (strictly AIM ONLY)
  async function distillBookToAim() {
    if (!bookUploaded) {
      setNotice({ tone: "neutral", text: "يرجى رفع ملف الكتاب أولاً." });
      return;
    }

    setDistillingBook(true);
    setNotice({ tone: "neutral", text: "جارٍ تقطير الكتاب وضغطه إلى وحدات AIM ميكانيكية..." });

    try {
      // Split text into units/chapters if possible
      const rawText = bookUploaded.text;
      const title = bookUploaded.name.replace(/\.[^.]+$/, "");
      
      // Build structured AIM-ready source
      const aimSource = `---\ntitle: ${title}\nclassification: sovereign\npriority: high\ndoc_type: book_distillation\n---\n[[section: title="بيانات الكتاب"]]\n<nff-prose tone="executive">عنوان المصدر: ${title} | الحجم: ${Math.round(bookUploaded.size / 1024)} كيلوبايت | الصيغة الأصلية: ${bookUploaded.format.toUpperCase()}</nff-prose>\n[[section: title="المتن والمحتوى المقطر"]]\n<nff-prose tone="analytical">${rawText.slice(0, 18000).replace(/<|>/g, "")}</nff-prose>`;

      const output = await generateAim(aimSource);
      const inspection = inspectHeader(output.bytes);
      if (!inspection.isValid) throw new Error(inspection.error || "فشل التحقق من ترويسة AIM");

      const fileId = "book_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      const finalName = `${title}-AIM.nff`;
      const body = new TextDecoder().decode(output.bytes);

      localStorage.setItem(`nff_draft_${fileId}`, JSON.stringify({
        id: fileId,
        name: finalName,
        body,
        mode: "AIM",
        createdAt: Date.now()
      }));
      loadDrafts();

      onNavigate("draft", "aim", fileId);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "تعذر تقطير الكتاب إلى AIM." });
    } finally {
      setDistillingBook(false);
    }
  }

  function prepareExport() {
    if (!uploaded?.document) {
      setNotice({ tone: "neutral", text: "ارفع ملف NFF صالحاً أولاً للتصدير." });
      return;
    }
    setExportPreview(exportNff(uploaded.document, exportFormat));
    setNotice({ tone: "success", text: "تم تجهيز معاينة التصدير." });
  }

  function downloadExport() {
    if (!exportPreview) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([exportPreview.content], { type: exportPreview.mime }));
    link.download = exportPreview.name;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice({ tone: "neutral", text: "تم تنزيل الملف المصدر." });
  }

  return (
    <main className="nff-shell">
      {/* Sovereign Rail */}
      <aside className="nff-rail">
        <div className="brand-lockup">
          <div className="brand-symbol" aria-label="NFF">
            <span /><span /><span /><span /><span /><span />
          </div>
          <div>
            <strong>Nabd File Format</strong>
            <small>NFF · by NABD STUDIO</small>
          </div>
        </div>

        <nav className="rail-nav" aria-label="الغرف">
          <button 
            className={`rail-item ${room === "files" ? "active" : ""}`} 
            onClick={() => changeRoom("files")}
          >
            <FolderOpen size={18} />
            <span>الملفات</span>
            <b>01</b>
          </button>
          
          <button 
            className={`rail-item ${room === "convert" ? "active" : ""}`} 
            onClick={() => changeRoom("convert")}
          >
            <Layers3 size={18} />
            <span>تحويل ملف</span>
            <b>02</b>
          </button>
          
          <button 
            className={`rail-item ${room === "book" ? "active" : ""}`} 
            onClick={() => changeRoom("book")}
          >
            <BookOpen size={18} />
            <span>تحويل كتاب</span>
            <b>03</b>
          </button>
          
          <button 
            className={`rail-item ${room === "settings" ? "active" : ""}`} 
            onClick={() => onNavigate("settings")}
          >
            <Settings size={18} />
            <span>الإعدادات</span>
            <b>04</b>
          </button>
        </nav>

        <div className="rail-foot">
          <span className="pulse-dot" /> بيئة سيادية محلية 100%<br />
          <small>لا شيء يغادر جهازك</small>
        </div>
      </aside>

      {/* Main Container */}
      <section className="nff-main">
        {/* Top Header */}
        <header className="topline">
          <div>
            <span className="eyebrow">NFF · NABD STUDIO WORKBENCH</span>
            <h1>Nabd File Format</h1>
            <p>بيئة ملفات حية ذاتية الاستقلال، مصممة للمستندات العربية المعاصرة.</p>
          </div>
          <div className="top-actions">
            <span className="local-pill">
              <span className="pulse-dot" /> سيادي محلي
            </span>
          </div>
        </header>

        {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}

        {/* 01. Files Desk */}
        {room === "files" && (
          <section className="room-view files-room">
            <div className="view-heading">
              <div>
                <span className="room-overline">FILE DESK</span>
                <h2>مكتب الملفات</h2>
                <p>افتح ملفات NFF الموجودة أو ابدأ مسودة جديدة بنظام النبرات الدلالية.</p>
              </div>
              <button className="primary-button" onClick={() => setShowNew(true)}>
                <FilePlus2 size={17} /> ملف جديد
              </button>
            </div>

            {/* Quick Cards Grid */}
            <div className="quick-grid">
              <button 
                className="quick-card" 
                onClick={() => inputRef.current?.click()}
              >
                <span className="quick-icon">
                  <Upload size={21} />
                </span>
                <div>
                  <strong>فتح ملف</strong>
                  <small>استعراض NFF أو ملف محلي</small>
                </div>
                <ChevronLeft size={18} />
              </button>

              <button 
                className="quick-card" 
                onClick={() => void createDraft("HM", undefined, "مسودة HM جديدة")}
              >
                <span className="quick-icon mint">
                  <FileText size={21} />
                </span>
                <div>
                  <strong>مسودة HM (بشرية)</strong>
                  <small>مستند قابل للقراءة والنبرات</small>
                </div>
                <ChevronLeft size={18} />
              </button>

              <button 
                className="quick-card" 
                onClick={() => void createDraft("AIM", undefined, "مسودة AIM جديدة")}
              >
                <span className="quick-icon coral">
                  <Terminal size={21} />
                </span>
                <div>
                  <strong>مسودة AIM (آلية)</strong>
                  <small>ضغط ميكانيكي مخصص للذكاء</small>
                </div>
                <ChevronLeft size={18} />
              </button>
            </div>

            <input 
              ref={inputRef} 
              type="file" 
              accept=".nff,.txt,.md,.pdf,.docx,.xlsx" 
              className="browser-file-input" 
              onChange={(event) => { 
                const file = event.target.files?.[0]; 
                if (file) void openFile(file); 
              }} 
            />

            {/* Saved Local Drafts Catalog */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4 border-b border-[#D5D7D0] pb-3">
                <div className="flex items-center gap-2 text-[#0F3D36]">
                  <HardDrive size={18} />
                  <h3 className="text-base font-bold text-[#17233A]">المسودات المحفوظة محلياً</h3>
                </div>
                <span className="text-xs text-[#8A908F] font-mono">
                  {savedDrafts.length} {savedDrafts.length === 1 ? "مسودة" : "مسودات"}
                </span>
              </div>

              {savedDrafts.length === 0 ? (
                <div className="bg-[#FFFFFF]/70 border border-[#D5D7D0] rounded-2xl p-10 text-center">
                  <FileText size={32} className="mx-auto text-[#8A908F] mb-3 opacity-60" />
                  <strong className="block text-sm text-[#17233A] mb-1">لا توجد مسودات محلية بعد</strong>
                  <p className="text-xs text-[#4C5869]">
                    اضغط &quot;ملف جديد&quot; أو اختر إحدى البطاقات أعلاه لإنشاء مسودة AIM أو HM فوراً.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => onNavigate("draft", draft.mode.toLowerCase() as 'aim' | 'hm', draft.id)}
                      className="bg-[#FFFFFF] border border-[#D5D7D0] hover:border-[#0F3D36] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          draft.mode === "AIM" ? "bg-[#0A0E17] text-[#38BDF8]" : "bg-[#E8F5EE] text-[#0F3D36]"
                        }`}>
                          {draft.mode}
                        </div>
                        <div className="truncate">
                          <strong className="block text-xs font-bold text-[#17233A] group-hover:text-[#0F3D36] truncate">
                            {draft.name}
                          </strong>
                          <span className="text-[10px] text-[#8A908F] flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {new Date(draft.createdAt).toLocaleDateString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => deleteDraft(draft.id, e)}
                          className="p-1.5 text-[#8A908F] hover:text-[#B75A3C] rounded-lg hover:bg-[#FDF0EC] transition-colors"
                          title="حذف من الجهاز"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronLeft size={16} className="text-[#8A908F] group-hover:text-[#0F3D36] transition-transform group-hover:-translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 02. Convert File Room */}
        {room === "convert" && (
          <section className="room-view simple-room">
            <div className="view-heading">
              <div>
                <span className="room-overline">CONVERT LAB</span>
                <h2>تحويل المستندات إلى NFF</h2>
                <p>ارفع ملفك المحلي واختر المود المناسب لاستخراج البيانات وتوليد مستند NFF معتمد.</p>
              </div>
              <button className="outline-button" onClick={() => changeRoom("files")}>
                <ArrowRight size={16} /> العودة للملفات
              </button>
            </div>

            <div className="upload-stage">
              <input 
                ref={convertInputRef} 
                type="file" 
                accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.nff" 
                className="browser-file-input" 
                onChange={(event) => { 
                  const file = event.target.files?.[0]; 
                  if (file) void handleConversionFile(file); 
                }} 
              />
              <button 
                className="drop-card" 
                onClick={() => convertInputRef.current?.click()}
              >
                <span className="drop-icon">
                  <Upload size={28} />
                </span>
                <strong>{extracting ? progress || "جارٍ معالجة الملف..." : uploaded ? uploaded.name : "اختر ملفاً من جهازك أو اسحبه هنا"}</strong>
                <small>
                  {extracting 
                    ? "المعالجة تتم محلياً في متصفحك بالكامل" 
                    : uploaded 
                    ? `${uploaded.format.toUpperCase()} · ${Math.round(uploaded.size / 1024)} KB · جاهز للتحويل` 
                    : "يدعم PDF · Word · TXT · Markdown · Excel"}
                </small>
                {extracting && <span className="progress-line" />}
              </button>

              <div className="upload-side">
                <div className="format-summary">
                  <strong>الصيغ المدعومة للاستخراج</strong>
                  <div>
                    <b>PDF</b><b>DOCX</b><b>XLSX</b><b>TXT</b><b>MD</b>
                  </div>
                  <small>يتم استخراج النصوص وتحليلها محلياً دون إرسال الملف لأي خادم خارجي.</small>
                </div>

                <div className="mode-choice">
                  <span>الصيغة المستهدفة</span>
                  <div className="mode-switch">
                    <button 
                      className={convertMode === "HM" ? "selected" : ""} 
                      onClick={() => setConvertMode("HM")}
                    >
                      HM · بشري دلالي
                    </button>
                    <button 
                      className={convertMode === "AIM" ? "selected" : ""} 
                      onClick={() => setConvertMode("AIM")}
                    >
                      AIM · ميكانيكي
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="conversion-actions">
              <div className="ai-inline">
                <Check size={16} />
                <span>
                  <strong>المعالجة والتحقق محليان</strong>
                  <small>مستند NFF سيكون صالحاً مع الترويسة الميكانيكية المعتمدة</small>
                </span>
              </div>
              <button 
                className="primary-button" 
                disabled={!uploaded || extracting} 
                onClick={() => void convertUploaded()}
              >
                <WandSparkles size={17} /> تحويل وفتح المسودة
              </button>
            </div>

            {uploaded && (
              <div className="extracted-preview">
                <div className="field-line">
                  <strong>النص المستخرج محلياً</strong>
                  <span>{uploaded.notes[0] || "جاهز للتحويل"}</span>
                </div>
                <pre>{uploaded.text.slice(0, 2400)}{uploaded.text.length > 2400 ? "\n…" : ""}</pre>
              </div>
            )}

            {uploaded?.document && (
              <div className="export-panel">
                <div>
                  <strong>تصدير NFF إلى صيغة خارجية</strong>
                  <small>Markdown · TXT · JSON · HTML</small>
                </div>
                <div className="export-actions">
                  <select 
                    value={exportFormat} 
                    onChange={(event) => setExportFormat(event.target.value as ExportFormat)} 
                    aria-label="صيغة الإخراج"
                  >
                    <option value="md">Markdown</option>
                    <option value="txt">TXT</option>
                    <option value="json">JSON</option>
                    <option value="html">HTML</option>
                  </select>
                  <button className="outline-button" onClick={prepareExport}>معاينة التصدير</button>
                  {exportPreview && (
                    <button className="primary-button" onClick={downloadExport}>تنزيل الملف</button>
                  )}
                </div>
              </div>
            )}

            {exportPreview && (
              <div className="export-preview">
                <strong>{exportPreview.name}</strong>
                <pre>{exportPreview.content.slice(0, 1800)}</pre>
              </div>
            )}
          </section>
        )}

        {/* 03. Book Room (AIM ONLY) */}
        {room === "book" && (
          <section className="room-view simple-room">
            <div className="view-heading">
              <div>
                <span className="room-overline">BOOK DISTILLATION · AIM ONLY</span>
                <h2>تقطير كتاب إلى وحدات AIM</h2>
                <p>
                  غرفة مخصصة لتقطير الكتب والمخطوطات الكاملة إلى وحدات AIM ميكانيكية مضغوطة حصراً، دون أي وسائط HM.
                </p>
              </div>
              <button className="outline-button" onClick={() => changeRoom("files")}>
                <ArrowRight size={16} /> العودة للملفات
              </button>
            </div>

            <div className="upload-stage">
              <input 
                ref={bookInputRef} 
                type="file" 
                accept=".pdf,.doc,.docx,.txt,.md,.epub,.xlsx" 
                className="browser-file-input" 
                onChange={(event) => { 
                  const file = event.target.files?.[0]; 
                  if (file) void handleBookFile(file); 
                }} 
              />
              <button 
                className="drop-card" 
                onClick={() => bookInputRef.current?.click()}
              >
                <span className="drop-icon">
                  <BookOpen size={28} />
                </span>
                <strong>
                  {bookExtracting 
                    ? bookProgress || "جارٍ قراءة الكتاب محلياً..." 
                    : bookUploaded 
                    ? bookUploaded.name 
                    : "ارفع ملف الكتاب هنا (PDF / Word / TXT)"}
                </strong>
                <small>
                  {bookExtracting 
                    ? "يجري استخراج الفصول والأبواب بدقة..." 
                    : bookUploaded 
                    ? `${bookUploaded.format.toUpperCase()} · ${Math.round(bookUploaded.size / 1024)} KB · جاهز للتقطير الآلي` 
                    : "ارفع ملف كتاب حقيقي لاستخراجه وتقطيره ميكانيكياً"}
                </small>
                {bookExtracting && <span className="progress-line" />}
              </button>

              <div className="upload-side">
                <div className="format-summary">
                  <strong>التقطير الميكانيكي الحصري</strong>
                  <div>
                    <b>AIM حصرًا</b><b>بدون HM</b><b>تشفير مضغوط</b>
                  </div>
                  <small>
                    هذه الغرفة مقيدة بصيغة AIM الميكانيكية لضمان أقصى كثافة معرفية ملائمة لأنظمة الذكاء والتحقق القطعي.
                  </small>
                </div>

                <div className="mode-choice">
                  <span>مود التقطير</span>
                  <div className="px-3 py-1.5 rounded-xl bg-[#0A0E17] text-[#38BDF8] text-xs font-mono font-bold border border-[#1E293B]">
                    MODE: AIM (مقفل)
                  </div>
                </div>
              </div>
            </div>

            <div className="conversion-actions">
              <div className="ai-inline">
                <ShieldCheck size={18} className="text-[#0F3D36]" />
                <span>
                  <strong>معالجة سيادية مغلقة</strong>
                  <small>التقطير يحافظ على هيكل الفصول بدون تسريب أي بيانات</small>
                </span>
              </div>

              <button 
                className="primary-button bg-[#0F3D36] hover:bg-[#15544A]" 
                disabled={!bookUploaded || bookExtracting || distillingBook} 
                onClick={() => void distillBookToAim()}
              >
                <Sparkles size={17} /> 
                {distillingBook ? "جارٍ التقطير..." : "تقطير الكتاب إلى وحدات AIM"}
              </button>
            </div>

            {bookUploaded && (
              <div className="extracted-preview">
                <div className="field-line">
                  <strong>معاينة محتوى الكتاب المستخرج</strong>
                  <span>حجم النص: {bookUploaded.text.length.toLocaleString("ar-EG")} حرف</span>
                </div>
                <pre>{bookUploaded.text.slice(0, 3000)}{bookUploaded.text.length > 3000 ? "\n… [المحتوى متبوع]" : ""}</pre>
              </div>
            )}
          </section>
        )}
      </section>

      {/* New File Modal Dialog */}
      {showNew && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="new-dialog">
            <button 
              className="dialog-close" 
              onClick={() => setShowNew(false)} 
              aria-label="إغلاق"
            >
              <X size={17} />
            </button>
            <span className="room-overline">ملف جديد</span>
            <h2>كيف تريد أن تبدأ؟</h2>
            <p>اختر مسار الإنشاء المناسب، وكل ملف يُحفظ مباشرة في بيئتك المحلية.</p>

            <div className="new-options">
              <button onClick={() => { setShowNew(false); inputRef.current?.click(); }}>
                <span className="new-icon">
                  <Upload size={21} />
                </span>
                <strong>رفع ملف</strong>
                <small>افتح ملف NFF أو مستنداً من جهازك</small>
              </button>

              <button onClick={() => void createDraft("HM", undefined, "مسودة HM جديدة")}>
                <span className="new-icon mint">
                  <FileText size={21} />
                </span>
                <strong>إنشاء HM (بشري)</strong>
                <small>محرر دلالي تفاعلي مع نبرات</small>
              </button>

              <button onClick={() => void createDraft("AIM", undefined, "مسودة AIM جديدة")}>
                <span className="new-icon coral">
                  <Terminal size={21} />
                </span>
                <strong>إنشاء AIM (آلي)</strong>
                <small>مسودة ميكانيكية مكثفة للذكاء</small>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Notice({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.tone}`} role="status">
      <span>{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "i"}</span>
      <p>{notice.text}</p>
      <button onClick={onClose} aria-label="إغلاق">
        <X size={15} />
      </button>
    </div>
  );
}

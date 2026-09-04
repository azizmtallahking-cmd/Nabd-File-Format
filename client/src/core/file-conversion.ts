/* Design: local-first file laboratory. This module extracts bytes in the browser and never uploads source files. */
import * as XLSX from "xlsx";
import { generateAim, generateHm } from "./generators";
import { parseNff } from "./parser";
import type { ParsedNffDocument } from "./model";
import type { NffNode } from "./schema";
import { TONE_STYLES } from "./visual-mapping";

export type SourceFormat = "nff" | "pdf" | "docx" | "txt" | "md" | "xlsx" | "image" | "unknown";
export type ExportFormat = "txt" | "md" | "json" | "html";
export type ConversionMode = "AIM" | "HM";

export type ExtractedFile = {
  name: string;
  format: SourceFormat;
  text: string;
  size: number;
  notes: string[];
  document?: ParsedNffDocument;
};

const textDecoder = new TextDecoder("utf-8", { fatal: false });

export function detectFormat(file: File): SourceFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith(".nff")) return "nff";
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet")) return "xlsx";
  if (name.endsWith(".md")) return "md";
  if (name.endsWith(".txt") || file.type.startsWith("text/")) return "txt";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif)$/i.test(name)) return "image";
  return "unknown";
}

export async function extractFile(file: File, onProgress?: (label: string) => void): Promise<ExtractedFile> {
  const format = detectFormat(file);
  onProgress?.("قراءة الملف محلياً");
  if (format === "nff") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const document = parseNff(bytes);
    return { name: file.name, format, text: document.bodyContent, size: file.size, notes: ["تم فحص رأس NFF محلياً"], document };
  }
  if (format === "txt" || format === "md") return { name: file.name, format, text: await file.text(), size: file.size, notes: ["النص جاهز للتحويل المحلي"] };
  if (format === "docx") {
    onProgress?.("استخراج نص Word محلياً");
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { name: file.name, format, text: result.value, size: file.size, notes: result.messages.map((message: { message: string }) => message.message) };
  }
  if (format === "xlsx") {
    onProgress?.("قراءة أوراق Excel محلياً");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const text = workbook.SheetNames.map((sheetName) => `## ${sheetName}\n\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])}`).join("\n\n");
    return { name: file.name, format, text, size: file.size, notes: [`تمت قراءة ${workbook.SheetNames.length} أوراق`] };
  }
  if (format === "pdf") {
    onProgress?.("استخراج النص من PDF محلياً");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), useWorkerFetch: false }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push((text.items as Array<{ str?: string }>).map((item) => item.str ?? "").join(" "));
      onProgress?.(`قراءة صفحة ${pageNumber} من ${pdf.numPages}`);
    }
    return { name: file.name, format, text: pages.map((page, index) => `## الصفحة ${index + 1}\n\n${page}`).join("\n\n"), size: file.size, notes: [`تمت قراءة ${pdf.numPages} صفحات`] };
  }
  if (format === "image") {
    onProgress?.("قراءة الصورة محلياً");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("ara+eng");
    const result = await worker.recognize(file);
    await worker.terminate();
    return { name: file.name, format, text: result.data.text, size: file.size, notes: ["تم استخراج النص من الصورة محلياً عبر OCR"] };
  }
  return { name: file.name, format, text: textDecoder.decode(await file.arrayBuffer()), size: file.size, notes: ["صيغة غير معروفة؛ تم التعامل معها كنص"] };
}

export async function convertExtractedToNff(extracted: ExtractedFile, mode: ConversionMode) {
  const title = extracted.name.replace(/\.[^.]+$/, "") || "مستند جديد";
  const body = extracted.format === "md" || extracted.format === "txt" ? extracted.text : `# ${title}\n\n${extracted.text}`;
  const source = `---\ntitle: ${title}\npriority: medium\nclassification: local\nsource_format: ${extracted.format}\n---\n[[section: title="${title}"]]\n<nff-prose tone="calm">${body.replace(/<\/?nff-[^>]*>/g, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</nff-prose>`;
  return mode === "AIM" ? generateAim(source) : generateHm(source);
}

function exportNodeToMarkdown(node: NffNode): string {
  if (node.type === 'prose') {
    const prefix = node.tone === 'executive' ? '> ' : '';
    const emphasis = node.tone === 'urgent' ? '**' : '';
    return `${prefix}${emphasis}${node.content}${emphasis}`;
  }
  if (node.type === 'qcm') {
    const options = node.options?.map(o => `- [ ] ${o.label}`).join('\n') ?? '';
    return `### ${node.question}\n\n${options}`;
  }
  if (node.type === 'error') return `> ⚠️ خطأ: ${node.reason}`;
  return '';
}

// Convert Tailwind classes to Hex for standalone HTML export
const EXPORT_COLORS: Record<string, { bgHex: string; textHex: string; accentHex: string }> = {
  executive:  { bgHex: '#fafaf9', textHex: '#1c1917', accentHex: '#d97706' }, // stone-50, stone-900, amber-600
  narrative:  { bgHex: 'transparent', textHex: '#44403c', accentHex: '#d6d3d1' }, // transparent, stone-700, stone-300
  urgent:     { bgHex: '#fff1f2', textHex: '#881337', accentHex: '#f43f5e' }, // rose-50, rose-900, rose-500
  reflective: { bgHex: '#eef2ff', textHex: '#312e81', accentHex: '#818cf8' }, // indigo-50, indigo-900, indigo-400
  neutral:    { bgHex: '#ffffff', textHex: '#292524', accentHex: '#e7e5e4' }, // white, stone-800, stone-200
};

function exportNodeToHtml(node: NffNode): string {
  if (node.type === 'prose') {
    const style = EXPORT_COLORS[node.tone] || EXPORT_COLORS.neutral;
    const isItalic = node.tone === 'reflective' ? 'font-style: italic;' : '';
    const isBold = (node.tone === 'executive' || node.tone === 'urgent') ? 'font-weight: 600;' : '';
    return `<div style="background:${style.bgHex};color:${style.textHex};border-right:4px solid ${style.accentHex};padding:16px;border-radius:8px;margin-bottom:16px;${isItalic}${isBold}line-height:1.6;">${node.content}</div>`;
  }
  if (node.type === 'qcm') {
    return `<div style="border:2px solid #d97706;background:#fffbeb;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="font-weight:600;margin-top:0;margin-bottom:12px;">${node.question}</p>
      ${node.options?.map(o => `<label style="display:block;padding:4px 0;">☐ ${o.label}</label>`).join('') ?? ''}
    </div>`;
  }
  if (node.type === 'error') {
    return `<div style="background:#fef2f2;color:#9f1239;padding:12px;border-radius:8px;margin-bottom:16px;">⚠️ خطأ: ${node.reason}</div>`;
  }
  return '';
}

export function exportNff(document: ParsedNffDocument, format: ExportFormat): { name: string; mime: string; content: string } {
  const title = document.frontmatter.title || "nabd-file";
  
  if (format === "json") return { name: `${title}.json`, mime: "application/json;charset=utf-8", content: JSON.stringify(document, null, 2) };
  
  if (format === "txt") {
    const plainText = document.nodes.map((node: NffNode) => {
      if (node.type === "prose") return node.content;
      if (node.type === "qcm") return `${node.question}\n${node.options?.map(opt => `- ${opt.label}`).join("\n")}`;
      if (node.type === "error") return node.reason;
      return "";
    }).join("\n\n");
    return { name: `${title}.txt`, mime: "text/plain;charset=utf-8", content: plainText };
  }

  if (format === "md") {
    const mdContent = document.nodes.map(exportNodeToMarkdown).join("\n\n");
    return { name: `${title}.md`, mime: "text/markdown;charset=utf-8", content: `# ${title}\n\n${mdContent}` };
  }

  // format === "html"
  const htmlNodes = document.nodes.map(exportNodeToHtml).join("\n");
  const htmlTemplate = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f8f7f1; color: #1c1917; }
    h1 { color: #182743; margin-bottom: 32px; font-size: 24px; border-bottom: 1px solid #e7e5e4; padding-bottom: 16px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${htmlNodes}
</body>
</html>`;
  return { name: `${title}.html`, mime: "text/html;charset=utf-8", content: htmlTemplate };
}

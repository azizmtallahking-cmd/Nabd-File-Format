/* Design: local-first file laboratory. This module extracts bytes in the browser and never uploads source files. */
import * as XLSX from "xlsx";
import { generateAim, generateHm } from "./generators";
import { parseNff } from "./parser";
import type { ParsedNffDocument } from "./model";
import type { NffNode } from "./schema";

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

export function exportNff(document: ParsedNffDocument, format: ExportFormat): { name: string; mime: string; content: string } {
  const title = document.frontmatter.title || "nabd-file";
  const plainText = document.nodes.map((node: NffNode) => {
    if (node.type === "prose") return node.content;
    if (node.type === "qcm") return `${node.question}\n${node.options?.map(opt => `- ${opt.label}`).join("\n")}`;
    if (node.type === "error") return node.reason;
    return "";
  }).join("\n\n");
  if (format === "txt") return { name: `${title}.txt`, mime: "text/plain;charset=utf-8", content: plainText };
  if (format === "md") return { name: `${title}.md`, mime: "text/markdown;charset=utf-8", content: `# ${title}\n\n${plainText}` };
  if (format === "json") return { name: `${title}.json`, mime: "application/json;charset=utf-8", content: JSON.stringify(document, null, 2) };
  const escapeMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
  const safe = plainText.replace(/[&<>]/g, (character: string) => escapeMap[character] ?? character);
  return { name: `${title}.html`, mime: "text/html;charset=utf-8", content: `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>${title}</title><main><h1>${title}</h1><p>${safe.replace(/\n/g, "</p><p>")}</p></main></html>` };
}

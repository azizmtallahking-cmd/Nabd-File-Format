import { buildHeader, type NffMode } from "./header";

export interface GeneratedNff {
  mode: NffMode;
  bytes: Uint8Array;
  sourceHash: string;
}

export async function sha256Hex(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stripSemanticMarkup(source: string): string {
  return source
    .replace(/\[\[(?:section|priority|classification|callout|tab|tag):\s*[^\]]*\]\]/g, "")
    .replace(/<nff-(?:prose|question|option|qcm)[^>]*>/g, "")
    .replace(/<\/nff-(?:prose|question|option|qcm)>/g, "");
}

function withSourceHash(source: string, sourceHash: string): string {
  if (!source.startsWith("---\n")) return `---\nsource_hash: ${sourceHash}\n---\n${source}`;
  const end = source.indexOf("\n---", 4);
  if (end < 0) return `---\nsource_hash: ${sourceHash}\n---\n${source}`;
  const existingFrontmatter = source.slice(4, end).replace(/(^|\n)source_hash:[^\n]*/g, "");
  return `---\n${existingFrontmatter.trim()}\nsource_hash: ${sourceHash}\n---${source.slice(end + 4)}`;
}

export async function generateNff(mode: NffMode, bodyContent: string): Promise<GeneratedNff> {
  const sourceHash = await sha256Hex(bodyContent);
  const visibleBody = mode === "AIM" ? stripSemanticMarkup(bodyContent) : bodyContent;
  const body = new TextEncoder().encode(withSourceHash(visibleBody, sourceHash));
  const header = buildHeader(mode);
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header, 0);
  bytes.set(body, header.length);
  return { mode, bytes, sourceHash };
}

export const generateAim = (bodyContent: string) => generateNff("AIM", bodyContent);
export const generateHm = (bodyContent: string) => generateNff("HM", bodyContent);

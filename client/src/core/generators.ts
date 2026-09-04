import { buildHeader, type NffMode } from "./header";

export interface GeneratedNff {
  mode: NffMode;
  bytes: Uint8Array;
  sourceHash: string;
}

export async function sha256Hex(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  if (typeof crypto !== "undefined" && crypto?.subtle && typeof crypto.subtle.digest === "function") {
    try {
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback below if crypto.subtle fails
    }
  }
  // Deterministic fallback hash if crypto.subtle is restricted or unavailable
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes[i];
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return val.toString(16).padStart(16, "0").repeat(4).slice(0, 64);
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

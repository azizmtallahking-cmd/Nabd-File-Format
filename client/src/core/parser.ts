import { HEADER_LENGTH, inspectHeader } from "./header";
import type { Frontmatter, ParsedNffDocument, SemanticTag } from "./model";
import type { NffNode, QcmType, ProseTone } from "./schema";

const tagPattern = /\[\[(section|priority|classification|callout|tab|tag):\s*([^\]]*)\]\]/g;
const nodePattern = /<(nff-prose|nff-qcm)([^>]*)>([\s\S]*?)<\/\1>/g;

function attributes(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  for (const match of Array.from(source.matchAll(pattern))) result[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  return result;
}

function parseFrontmatter(source: string): { frontmatter: Frontmatter; body: string } {
  if (!source.startsWith("---\n")) return { frontmatter: {}, body: source };
  const end = source.indexOf("\n---", 4);
  if (end < 0) return { frontmatter: {}, body: source };
  const frontmatter: Frontmatter = {};
  for (const line of source.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    // v1 intentionally supports only flat one-line key/value pairs and splits at the first colon.
    frontmatter[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return { frontmatter, body: source.slice(end + 4).replace(/^\n/, "") };
}

function parseTags(body: string): SemanticTag[] {
  const tags: SemanticTag[] = [];
  for (const match of Array.from(body.matchAll(tagPattern))) {
    const kind = match[1];
    const attrs = attributes(match[2]);
    if (kind === "section") tags.push({ kind, attributes: attrs });
    else if (kind === "priority" && ["critical", "high", "medium", "low"].includes(attrs.level)) tags.push({ kind, level: attrs.level as never });
    else if (kind === "classification" && ["secret", "internal", "public"].includes(attrs.level)) tags.push({ kind, level: attrs.level as never });
    else if (kind === "callout" && ["info", "warning", "success", "danger"].includes(attrs.type)) tags.push({ kind, type: attrs.type as never, attributes: attrs });
    else if (kind === "tab" && attrs.name) tags.push({ kind, name: attrs.name });
    else if (kind === "tag" && attrs.label) tags.push({ kind, label: attrs.label });
  }
  return tags;
}

function inner(source: string, name: string): string {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(source);
  return match?.[1]?.trim() ?? "";
}

function parseNodes(body: string): NffNode[] {
  const nodes: NffNode[] = [];
  for (const match of Array.from(body.matchAll(nodePattern))) {
    const kind = match[1];
    const attrs = attributes(match[2]);
    const content = match[3];
    if (kind === "nff-prose") {
      nodes.push({ type: "prose", tone: (attrs.tone as ProseTone) || "neutral", content: content.trim() });
      continue;
    }
    const qcmType = attrs.type as QcmType | undefined;
    if (!attrs.id || !qcmType || !["single_choice", "multi_choice", "text_input"].includes(qcmType)) {
      nodes.push({ type: "error", reason: "عنصر QCM يفتقد id أو type صالحاً" });
      continue;
    }
    const question = inner(content, "nff-question");
    const options = Array.from(content.matchAll(/<nff-option\s+([^>]*)>([\s\S]*?)<\/nff-option>/g)).map((option) => ({ value: attributes(option[1]).value ?? "", label: option[2].trim() }));
    if (!question || ((qcmType === "single_choice" || qcmType === "multi_choice") && options.length === 0)) {
      nodes.push({ type: "error", reason: "عنصر QCM غير مكتمل" });
      continue;
    }
    nodes.push({ type: "qcm", id: attrs.id, qcmType, question, options });
  }
  return nodes;
}

export function parseNff(input: Uint8Array): ParsedNffDocument {
  const inspection = inspectHeader(input);
  if (!inspection.isValid) throw new Error(inspection.error);
  const bodyContent = new TextDecoder("utf-8", { fatal: true }).decode(input.subarray(HEADER_LENGTH));
  const { frontmatter, body } = parseFrontmatter(bodyContent);
  return { mode: inspection.mode, version: inspection.version, frontmatter, tags: parseTags(body), nodes: parseNodes(body), bodyContent };
}

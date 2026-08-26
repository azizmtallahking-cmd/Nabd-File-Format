
import { NffNode, ParsedNffDocument as SchemaDoc } from './schema';

export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type ClassificationLevel = "secret" | "internal" | "public";
export type CalloutType = "info" | "warning" | "success" | "danger";

export type Frontmatter = Record<string, string>;

export type SemanticTag =
  | { kind: "section"; attributes: Record<string, string> }
  | { kind: "priority"; level: PriorityLevel }
  | { kind: "classification"; level: ClassificationLevel }
  | { kind: "callout"; type: CalloutType; attributes: Record<string, string> }
  | { kind: "tab"; name: string }
  | { kind: "tag"; label: string };

export interface ParsedNffDocument {
  mode: "AIM" | "HM";
  version: "v1.0";
  frontmatter: Frontmatter;
  tags: SemanticTag[];
  nodes: NffNode[];
  bodyContent: string;
}

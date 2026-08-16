export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type ClassificationLevel = "secret" | "internal" | "public";
export type CalloutType = "info" | "warning" | "success" | "danger";
export type QcmType = "single_choice" | "multi_choice" | "text_input";

export type Frontmatter = Record<string, string>;

export type SemanticTag =
  | { kind: "section"; attributes: Record<string, string> }
  | { kind: "priority"; level: PriorityLevel }
  | { kind: "classification"; level: ClassificationLevel }
  | { kind: "callout"; type: CalloutType; attributes: Record<string, string> }
  | { kind: "tab"; name: string }
  | { kind: "tag"; label: string };

export type ContentNode =
  | { kind: "prose"; tone?: string; text: string }
  | { kind: "qcm"; id: string; type: QcmType; question: string; options: Array<{ value: string; text: string }> }
  | { kind: "error"; message: string; source: string };

export interface ParsedNffDocument {
  mode: "AIM" | "HM";
  version: "v1.0";
  frontmatter: Frontmatter;
  tags: SemanticTag[];
  nodes: ContentNode[];
  bodyContent: string;
}

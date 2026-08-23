# NFF Schema Specification v1.0

## Scope

This document describes the textual UTF-8 body that follows the 18-byte binary header. The parser implementation is `client/src/core/parser.ts` and the TypeScript model is `client/src/core/model.ts`.

## Document shape

An NFF body may begin with YAML-like frontmatter delimited by a line containing `---`. Each frontmatter entry is a single `key: value` line and is represented as `Frontmatter = Record<string, string>`. The body follows the closing delimiter.

```text
---
title: Example
priority: medium
classification: internal
---
<body>
```

The parser preserves `bodyContent` as the complete decoded body, exposes the frontmatter map, extracts semantic tags, and parses content nodes in source order.

## Semantic tags

| Syntax family | Parsed model | Accepted attributes |
|---|---|---|
| `[[section: ...]]` | `kind: "section"` | Attribute map; `title` is the normal display attribute. |
| `[[priority: level="..."]]` | `kind: "priority"` | `critical`, `high`, `medium`, or `low`. |
| `[[classification: level="..."]]` | `kind: "classification"` | `secret`, `internal`, or `public`. |
| `[[callout: ...]]` | `kind: "callout"` | `info`, `warning`, `success`, or `danger`. |
| `[[tab: name="..."]]` | `kind: "tab"` | Non-empty `name`. |
| `[[tag: label="..."]]` | `kind: "tag"` | Non-empty `label`. |

Malformed or unsupported attributes are ignored at tag level without changing unrelated valid nodes.

## Content nodes

### Prose

```xml
<nff-prose tone="calm">Human-readable content.</nff-prose>
```

This produces `{ kind: "prose", tone?: string, text: string }`. The text is trimmed by the parser and otherwise preserved.

### QCM

```xml
<nff-qcm id="q1" type="single_choice">
  <nff-question>Which option is correct?</nff-question>
  <nff-option value="a">Option A</nff-option>
</nff-qcm>
```

The accepted types are `single_choice`, `multi_choice`, and `text_input`. A valid QCM requires a non-empty `id`, a valid `type`, and a question. Choice types also require at least one option. A malformed QCM becomes an `{ kind: "error", message, source }` node rather than silently disappearing.

## Encoding and modes

The body is encoded and decoded as UTF-8. `HM` preserves semantic markup for human review; `AIM` is generated from the same source with semantic markup stripped from the visible body while retaining the source hash in frontmatter. Both modes use the same schema and v1.0 header contract.

## Ownership of text

Parsing, header validation, encoding, and conversion are deterministic browser operations. No parser operation rewrites user text through a model. Any future assistant may suggest roles only after an explicit before/after review contract is added.

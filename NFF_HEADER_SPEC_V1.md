# NFF Header Specification v1.0

## Status

This document is the normative description of the fixed NFF v1.0 header implemented by `client/src/core/header.ts`. The header is always **18 bytes** and is followed by a UTF-8 body.

## Byte layout

| Offset | Length | Field | Exact bytes | Meaning |
|---:|---:|---|---|---|
| 0 | 5 | `MAGIC_PREFIX` | `00 4E 46 46 01` | Identifies an NFF file. |
| 5 | 5 | `MODE_SEQ` | HM: `02 48 4D 20 04` / AIM: `02 41 49 4D 04` | Declares the body mode. |
| 10 | 6 | `VERSION_SEQ` | `03 76 31 2E 30 03` | Declares version `v1.0`. |
| 16 | 2 | `DELIMITER` | `00 0A` | Terminates the fixed header. |

> The header is binary. It must be compared byte-for-byte; textual rendering is only a diagnostic representation.

## Validation rules

A file is valid only when its byte length is at least 18, the magic prefix matches exactly, the mode sequence matches exactly one of HM or AIM, the version sequence matches exactly `v1.0`, and the final delimiter matches exactly `00 0A`. Any mismatch is rejected mechanically.

There is **no fixed file-size limit in the core**. The body is decoded after the header using UTF-8 with fatal decoding enabled. Hashing and generation use the browser's SHA-256 implementation over the source text.

## Reference implementation

The normative constants and validation routine are exported from `client/src/core/header.ts` as `HEADER_LENGTH`, `MAGIC_PREFIX`, `MODE_SEQ`, `VERSION_SEQ`, `DELIMITER`, `buildHeader`, and `inspectHeader`.

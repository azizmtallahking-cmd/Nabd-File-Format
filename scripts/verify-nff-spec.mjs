import assert from "node:assert/strict";
import fs from "node:fs";

const headerSource = fs.readFileSync(new URL("../client/src/core/header.ts", import.meta.url), "utf8");
const spec = fs.readFileSync(new URL("../NFF_HEADER_SPEC_V1.md", import.meta.url), "utf8");

const required = [
  ["HEADER_LENGTH", "18"],
  ["MAGIC_PREFIX", "00 4E 46 46 01"],
  ["MODE_SEQ HM", "02 48 4D 20 04"],
  ["MODE_SEQ AIM", "02 41 49 4D 04"],
  ["VERSION_SEQ", "03 76 31 2E 30 03"],
  ["DELIMITER", "00 0A"],
];
for (const [label, value] of required) {
  assert.match(spec, new RegExp(value.replace(/[.]/g, "\\.")), `${label} missing from header specification`);
}
assert.match(headerSource, /HEADER_LENGTH\s*=\s*18/);
assert.match(headerSource, /MAGIC_PREFIX\s*=\s*new Uint8Array\(\[0x00, 0x4e, 0x46, 0x46, 0x01\]\)/);
assert.match(headerSource, /VERSION_SEQ\s*=\s*new Uint8Array\(\[0x03, 0x76, 0x31, 0x2e, 0x30, 0x03\]\)/);
assert.match(headerSource, /DELIMITER\s*=\s*new Uint8Array\(\[0x00, 0x0a\]\)/);
console.log("NFF header specification matches header.ts");

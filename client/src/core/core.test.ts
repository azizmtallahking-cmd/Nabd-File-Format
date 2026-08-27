import assert from "node:assert/strict";
import { generateAim, generateHm, inspectHeader, parseNff } from "../core/index";

const arabic = `---\ntitle: اختبار عربي\npriority: critical\n---\n[[section: title="التهيئة"]]\n<nff-prose tone="calm">هذه فقرة عربية طويلة لاختبار سلامة UTF-8 وعدم تلف النص عند التوليد والتحليل.</nff-prose>`;

const hm = await generateHm(arabic);
const aim = await generateAim(arabic);

assert.equal(hm.bytes.length > 18, true);
const hmInspection = inspectHeader(hm.bytes);
const aimInspection = inspectHeader(aim.bytes);
assert.equal(hmInspection.isValid, true);
assert.equal(aimInspection.isValid, true);
if (!hmInspection.isValid || !aimInspection.isValid) throw new Error("valid headers expected");
assert.equal(hmInspection.mode, "HM");
assert.equal(aimInspection.mode, "AIM");
assert.notDeepEqual(hm.bytes.subarray(5, 10), aim.bytes.subarray(5, 10));

const parsedHm = parseNff(hm.bytes);
assert.equal(parsedHm.frontmatter.title, "اختبار عربي");
assert.equal(parsedHm.nodes[0]?.type, "prose");
assert.equal((parsedHm.nodes[0] as { content: string }).content.includes("سلامة UTF-8"), true);

const wrongVersion = hm.bytes.slice();
wrongVersion[13] = 0x31;
assert.equal(inspectHeader(wrongVersion).isValid, false);

const wrongMagic = hm.bytes.slice();
wrongMagic[0] ^= 0xff;
assert.equal(inspectHeader(wrongMagic).isValid, false);

const wrongMode = hm.bytes.slice();
wrongMode[6] ^= 0xff;
assert.equal(inspectHeader(wrongMode).isValid, false);

const emptyBody = new Uint8Array(hm.bytes.subarray(0, 18));
assert.equal(parseNff(emptyBody).bodyContent, "");

console.log("core tests passed");

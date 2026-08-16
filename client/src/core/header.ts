export const HEADER_LENGTH = 18;

export const MAGIC_PREFIX = new Uint8Array([0x00, 0x4e, 0x46, 0x46, 0x01]);
export const MODE_SEQ = {
  AIM: new Uint8Array([0x02, 0x41, 0x49, 0x4d, 0x04]),
  HM: new Uint8Array([0x02, 0x48, 0x4d, 0x20, 0x04]),
} as const;
export const VERSION_SEQ = new Uint8Array([0x03, 0x76, 0x31, 0x2e, 0x30, 0x03]);
export const DELIMITER = new Uint8Array([0x00, 0x0a]);

export type NffMode = "AIM" | "HM";
export type HeaderInspection =
  | { isValid: true; mode: NffMode; version: "v1.0" }
  | { isValid: false; error: string; offset?: number; actualHex?: string };

function equalBytes(actual: Uint8Array, expected: Uint8Array): number {
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) return index;
  }
  return -1;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

export function buildHeader(mode: NffMode): Uint8Array {
  const header = new Uint8Array(HEADER_LENGTH);
  header.set(MAGIC_PREFIX, 0);
  header.set(MODE_SEQ[mode], 5);
  header.set(VERSION_SEQ, 10);
  header.set(DELIMITER, 16);
  return header;
}

export function inspectHeader(input: Uint8Array): HeaderInspection {
  if (input.length < HEADER_LENGTH) {
    return { isValid: false, error: "الملف أصغر من الرأس الإلزامي" };
  }

  const magicError = equalBytes(input.subarray(0, 5), MAGIC_PREFIX);
  if (magicError >= 0) {
    return { isValid: false, error: "بادئة سحرية غير صالحة", offset: magicError, actualHex: hex(input.subarray(0, 5)) };
  }

  const modeAim = equalBytes(input.subarray(5, 10), MODE_SEQ.AIM);
  const modeHm = equalBytes(input.subarray(5, 10), MODE_SEQ.HM);
  if (modeAim >= 0 && modeHm >= 0) {
    return { isValid: false, error: "تسلسل مود غير صالح", actualHex: hex(input.subarray(5, 10)) };
  }

  const mode: NffMode = modeAim < 0 ? "AIM" : "HM";
  const versionError = equalBytes(input.subarray(10, 16), VERSION_SEQ);
  if (versionError >= 0) {
    return { isValid: false, error: "إصدار NFF غير صالح؛ الإصدار المقبول هو v1.0", offset: 10 + versionError, actualHex: hex(input.subarray(10, 16)) };
  }

  const delimiterError = equalBytes(input.subarray(16, 18), DELIMITER);
  if (delimiterError >= 0) {
    return { isValid: false, error: "فاصل نهاية الرأس مفقود أو تالف", offset: 16 + delimiterError, actualHex: hex(input.subarray(16, 18)) };
  }

  return { isValid: true, mode, version: "v1.0" };
}

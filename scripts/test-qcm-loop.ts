import { exportAnswersAsAim } from '../client/src/core/answer-export';
import { parseNff } from '../client/src/core';
import fs from 'fs';

async function runTest() {
  console.log("--- Starting QCM -> AIM Loop Test ---");
  
  const sourceDocId = "doc_test_12345";
  const mockAnswers = {
    "q1": "yes",
    "q2": ["option_a", "option_c"],
    "q3": "هذه إجابة نصية حقيقية للتحقق"
  };
  
  console.log("1. Generating AIM file from answers...");
  const { bytes, body } = await exportAnswersAsAim(sourceDocId, mockAnswers);
  
  const filePath = "/home/ubuntu/nff-permanent/test-answers-AIM.nff";
  fs.writeFileSync(filePath, bytes);
  console.log(`2. File saved to disk: ${filePath} (${bytes.length} bytes)`);
  
  console.log("3. Opening the generated file to verify...");
  const readBytes = fs.readFileSync(filePath);
  
  try {
    const parsed = parseNff(new Uint8Array(readBytes));
    console.log("   - Header is valid NFF v1.0.");
    console.log(`   - Mode: ${parsed.mode} (Expected: AIM)`);
    console.log(`   - Parsed body content:\n${parsed.bodyContent}`);
    
    if (parsed.mode !== "AIM") throw new Error("Mode is not AIM");
    if (!parsed.bodyContent.includes(`source_doc_id: ${sourceDocId}`)) throw new Error("Missing source_doc_id");
    if (!parsed.bodyContent.includes("q1: yes")) throw new Error("Missing q1 answer");
    if (!parsed.bodyContent.includes("q3: هذه إجابة نصية حقيقية للتحقق")) throw new Error("Missing q3 text answer");
    
    console.log("\n✅ SUCCESS: QCM -> AIM loop verified.");
    console.log("\n--- Raw AIM File Content ---");
    console.log(Buffer.from(readBytes).toString('utf-8'));
    
  } catch (e) {
    console.error("❌ FAILED:", e);
    process.exit(1);
  }
}

runTest();

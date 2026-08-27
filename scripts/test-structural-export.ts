
import { generateHm } from '../client/src/core/generators';
import { parseNff } from '../client/src/core/parser';
import { exportNff } from '../client/src/core/file-conversion';
import fs from 'fs';

async function testExport() {
  console.log('--- NFF Structural Export Test ---');
  
  const source = `---
title: اختبار التصدير البنيوي
priority: high
---
[[section: title="نبرات مختلفة"]]
<nff-prose tone="executive">هذه فقرة بنبرة تنفيذية (Executive) يجب أن تظهر كاقتباس بارز في Markdown وبخلفية فاتحة في HTML.</nff-prose>
<nff-prose tone="urgent">هذه فقرة بنبرة عاجلة (Urgent) يجب أن تظهر بنص عريض في Markdown وبخلفية وردية في HTML.</nff-prose>
<nff-qcm id="q1" type="single_choice">
<nff-question>هل التصدير بنيوي فعلاً؟</nff-question>
<nff-option value="yes">نعم، يحافظ على الهوية</nff-option>
<nff-option value="no">لا، نص مسطح فقط</nff-option>
</nff-qcm>`;

  const hm = await generateHm(source);
  const doc = parseNff(hm.bytes);
  
  const md = exportNff(doc, 'md');
  const html = exportNff(doc, 'html');
  
  fs.writeFileSync('structural-test.md', md.content);
  fs.writeFileSync('structural-test.html', html.content);
  
  console.log('Files generated: structural-test.md, structural-test.html');
  
  // Basic verification
  const mdContent = md.content;
  const hasExecutiveMd = mdContent.includes('> هذه فقرة بنبرة تنفيذية');
  const hasUrgentMd = mdContent.includes('**هذه فقرة بنبرة عاجلة');
  const hasQcmMd = mdContent.includes('### هل التصدير بنيوي فعلاً؟');
  
  console.log(`Markdown Structural Integrity: ${hasExecutiveMd && hasUrgentMd && hasQcmMd ? 'PASS' : 'FAIL'}`);
  
  const htmlContent = html.content;
  const hasExecutiveHtml = htmlContent.includes('background:#fafaf9') && htmlContent.includes('border-right:4px solid #d97706');
  const hasUrgentHtml = htmlContent.includes('background:#fff1f2') && htmlContent.includes('border-right:4px solid #f43f5e');
  
  console.log(`HTML Structural Integrity: ${hasExecutiveHtml && hasUrgentHtml ? 'PASS' : 'FAIL'}`);
  
  if (!(hasExecutiveMd && hasUrgentMd && hasQcmMd && hasExecutiveHtml && hasUrgentHtml)) {
    process.exit(1);
  }
}

testExport();

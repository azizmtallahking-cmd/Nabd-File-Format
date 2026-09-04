import fs from 'fs';
let code = fs.readFileSync('client/src/pages/HmDraftPage.tsx', 'utf8');

const newContent = `---
title: مسودة HM جديدة
priority: medium
classification: internal
---
[[section: title="مقدمة النظام"]]
<nff-prose tone="executive">هذه فقرة توضح النظام الجديد. تم إعداد الألوان والمقاسات بناءً على الهوية البصرية الرسمية للاستوديو.</nff-prose>
<nff-prose tone="reflective">إن تطبيق هوية بصرية متسقة ليس مجرد زخرفة، بل هو جزء من بناء بيئة عمل موثوقة ومريحة للمستخدم، مما يعزز من قيمة المحتوى نفسه.</nff-prose>

[[section: title="اختبار التفاعل"]]
<nff-qcm id="test_q1" type="single_choice">
  <nff-question>هل ظهرت الألوان والمسافات بشكل صحيح بناءً على قواعد NABD STUDIO؟</nff-question>
  <nff-option value="yes">نعم، الهوية مطبقة بشكل ممتاز.</nff-option>
  <nff-option value="no">لا، هناك خلل في العرض.</nff-option>
</nff-qcm>`;

code = code.replace(/const defaultContent = `.*?`;/s, 'const defaultContent = `' + newContent + '`;');

fs.writeFileSync('client/src/pages/HmDraftPage.tsx', code);

import fs from 'fs';
let code = fs.readFileSync('client/src/pages/HmDraftPage.tsx', 'utf8');

code = code.replace(/text-\[\#0F3D36\]\/60\]/g, 'text-[#0F3D36]/60');

fs.writeFileSync('client/src/pages/HmDraftPage.tsx', code);

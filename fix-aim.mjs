import fs from 'fs';
let code = fs.readFileSync('client/src/pages/AimDraftPage.tsx', 'utf8');

code = code.replace(/gap-1\.5/g, 'gap-2')
           .replace(/gap-3/g, 'gap-4')
           .replace(/p-5/g, 'p-6')
           .replace(/px-2\.5/g, 'px-2')
           .replace(/px-3\.5/g, 'px-4')
           .replace(/px-3/g, 'px-4')
           .replace(/py-1\.5/g, 'py-2')
           .replace(/py-1/g, 'py-2');

fs.writeFileSync('client/src/pages/AimDraftPage.tsx', code);

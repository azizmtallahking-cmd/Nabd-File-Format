const fs = require('fs');
let code = fs.readFileSync('client/src/pages/HmDraftPage.tsx', 'utf8');

code = code.replace(/gap-5/g, 'gap-4')
           .replace(/gap-3/g, 'gap-4')
           .replace(/gap-2\.5/g, 'gap-2')
           .replace(/gap-1\.5/g, 'gap-2')
           .replace(/px-5/g, 'px-6')
           .replace(/px-3\.5/g, 'px-4')
           .replace(/px-3/g, 'px-4')
           .replace(/py-1\.5/g, 'py-2')
           .replace(/py-1/g, 'py-2')
           .replace(/pb-5/g, 'pb-4')
           .replace(/mt-3/g, 'mt-4');

fs.writeFileSync('client/src/pages/HmDraftPage.tsx', code);

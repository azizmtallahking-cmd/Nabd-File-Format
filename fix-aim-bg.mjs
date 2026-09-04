import fs from 'fs';
let code = fs.readFileSync('client/src/pages/AimDraftPage.tsx', 'utf8');

code = code.replace(/bg-\[\#0F3D36\]\/80\/90/g, 'bg-[#0F3D36]/90')
           .replace(/bg-\[\#0F3D36\]\/80\/60/g, 'bg-[#0F3D36]/60')
           .replace(/focus:border-\[\#38BDF8\]\/60/g, 'focus:border-[#5DB87F]/60');

fs.writeFileSync('client/src/pages/AimDraftPage.tsx', code);

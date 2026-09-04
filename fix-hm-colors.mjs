import fs from 'fs';
let code = fs.readFileSync('client/src/pages/HmDraftPage.tsx', 'utf8');

code = code.replace(/#17233A/g, '#0F3D36')
           .replace(/#8A908F/g, '#0F3D36]/60') // Wait, we need to be careful with tailwind classes
           .replace(/text-\[\#8A908F\]/g, 'text-[#0F3D36]/60')
           .replace(/border-\[\#D5D7D0\]/g, 'border-[#0F3D36]/20')
           .replace(/bg-\[\#D5D7D0\]/g, 'bg-[#0F3D36]/20')
           .replace(/border-\[\#EEEEE8\]/g, 'border-[#0F3D36]/10')
           .replace(/bg-\[\#F0EFE7\]/g, 'bg-[#D9B892]/20')
           .replace(/hover:bg-\[\#F0EFE7\]/g, 'hover:bg-[#D9B892]/20')
           .replace(/bg-\[\#E8F5EE\]/g, 'bg-[#5DB87F]/20')
           .replace(/hover:bg-\[\#15544A\]/g, 'hover:bg-[#0F3D36]/80')
           .replace(/hover:bg-\[\#9E4A2E\]/g, 'hover:bg-[#B75A3C]/80')
           // Clean up any double brackets
           .replace(/text-\[\#0F3D36\]\/60\]\/60/g, 'text-[#0F3D36]/60');

fs.writeFileSync('client/src/pages/HmDraftPage.tsx', code);

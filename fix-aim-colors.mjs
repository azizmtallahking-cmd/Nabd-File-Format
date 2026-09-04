import fs from 'fs';
let code = fs.readFileSync('client/src/pages/AimDraftPage.tsx', 'utf8');

code = code.replace(/bg-\[\#0A0E17\]/g, 'bg-[#0F3D36]')
           .replace(/bg-\[\#0E1524\]/g, 'bg-[#0F3D36]/80')
           .replace(/bg-\[\#070B12\]/g, 'bg-[#0F3D36]/40')
           .replace(/bg-\[\#162235\]/g, 'bg-[#5DB87F]/10')
           .replace(/bg-\[\#1E293B\]/g, 'bg-[#5DB87F]/20')
           .replace(/bg-\[\#0284C7\]/g, 'bg-[#B75A3C]')
           .replace(/bg-\[\#0369A1\]/g, 'bg-[#B75A3C]/80')
           .replace(/shadow-\[\#0284C7\]/g, 'shadow-[#B75A3C]')
           .replace(/bg-\[\#38BDF8\]/g, 'bg-[#5DB87F]')
           .replace(/text-\[\#C5D1DE\]|text-\[\#F1F5F9\]|text-\[\#F8FAFC\]|text-\[\#E2E8F0\]|text-\[\#CBD5E1\]/g, 'text-[#D9B892]')
           .replace(/text-\[\#94A3B8\]|text-\[\#64748B\]|text-\[\#334155\]/g, 'text-[#D9B892]/60')
           .replace(/text-\[\#38BDF8\]/g, 'text-[#5DB87F]')
           .replace(/border-\[\#1E293B\]|border-\[\#24344D\]/g, 'border-[#5DB87F]/30')
           .replace(/text-white/g, 'text-[#F8F7F1]');

fs.writeFileSync('client/src/pages/AimDraftPage.tsx', code);

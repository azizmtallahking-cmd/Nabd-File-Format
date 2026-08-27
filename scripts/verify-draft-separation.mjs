
import fs from 'fs';
import path from 'path';

const AIM_PAGE = 'client/src/pages/AimDraftPage.tsx';
const HM_PAGE = 'client/src/pages/HmDraftPage.tsx';

function checkSeparation() {
  console.log('--- NFF Draft Separation Verification ---');
  
  const aimContent = fs.readFileSync(AIM_PAGE, 'utf8');
  const hmContent = fs.readFileSync(HM_PAGE, 'utf8');

  // 1. AimDraftPage must not import NffRenderer or schema
  const aimImportsRenderer = aimContent.includes('NffRenderer');
  const aimImportsSchema = aimContent.includes('core/schema');
  
  const independencePass = !aimImportsRenderer && !aimImportsSchema;
  console.log(`[1] AIM Page Independence: ${independencePass ? 'PASS' : 'FAIL'}`);
  if (aimImportsRenderer) console.error('  - Error: AimDraftPage imports NffRenderer');
  if (aimImportsSchema) console.error('  - Error: AimDraftPage imports core/schema');

  // 2. No "Mode Switch" or "Change Mode" in both pages
  const switchKeywords = ['تبديل', 'تغيير المود', 'Mode Switch', 'Change Mode', 'switch-mode'];
  const aimHasSwitch = switchKeywords.some(k => aimContent.includes(k));
  const hmHasSwitch = switchKeywords.some(k => hmContent.includes(k));

  console.log(`[2] No Mode Switch in AIM: ${!aimHasSwitch ? 'PASS' : 'FAIL'}`);
  console.log(`[3] No Mode Switch in HM: ${!hmHasSwitch ? 'PASS' : 'FAIL'}`);

  if (!independencePass || aimHasSwitch || hmHasSwitch) {
    process.exit(1);
  }
  
  console.log('--- Verification Complete: SUCCESS ---');
}

checkSeparation();

const nodePattern = /<(nff-prose|nff-qcm)([^>]*)>([\s\S]*?)<\/\1>/g;
const tagPattern = /\[\[(section|priority|classification|callout|tab|tag):\s*([^\]]*)\]\]/g;
const body = `[[section: title="نقطة البداية"]]
<nff-prose tone="calm">هذه مسودة بشرية بتنسيق NFF الدلالي. يمكنك تحرير النص وتخصيص النبرات الدلالية والتنقل بين المعاينة ومحرر الوسوم.</nff-prose>`;

console.log("Nodes:", Array.from(body.matchAll(nodePattern)));
console.log("Tags:", Array.from(body.matchAll(tagPattern)));

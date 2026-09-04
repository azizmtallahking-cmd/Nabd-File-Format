function attributes(source) {
  const result = {};
  const pattern = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  for (const match of Array.from(source.matchAll(pattern))) result[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  return result;
}
console.log(attributes(' title="نقطة البداية"'));
console.log(attributes(' tone="calm"'));

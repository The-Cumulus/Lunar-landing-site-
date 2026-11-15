const fs = require('fs');

const content = fs.readFileSync('Body.svg', 'utf8');

// Let's find rects, paths, and positions
const rectMatches = [];
const rectRegex = /<rect\b([^>]*)\/?>/g;
let m;
while ((m = rectRegex.exec(content)) !== null) {
  const attrs = m[1];
  const x = attrs.match(/\bx="([^"]+)"/)?.[1] || '0';
  const y = attrs.match(/\by="([^"]+)"/)?.[1] || '0';
  const w = attrs.match(/\bwidth="([^"]+)"/)?.[1] || '0';
  const h = attrs.match(/\bheight="([^"]+)"/)?.[1] || '0';
  const fill = attrs.match(/\bfill="([^"]+)"/)?.[1] || '';
  const stroke = attrs.match(/\bstroke="([^"]+)"/)?.[1] || '';
  rectMatches.push({ x: parseFloat(x), y: parseFloat(y), w: parseFloat(w), h: parseFloat(h), fill, stroke });
}

console.log('Total rects:', rectMatches.length);
// Sort by y, then x
rectMatches.sort((a, b) => a.y - b.y || a.x - b.x);
console.log('First 20 rects (Top & Header):');
console.log(rectMatches.slice(0, 20));

console.log('Sidebar rects (x < 350):');
console.log(rectMatches.filter(r => r.x < 350 && r.w > 100));

console.log('Bottom rects (y > 600):');
console.log(rectMatches.filter(r => r.y > 600));

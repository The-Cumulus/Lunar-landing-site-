const fs = require('fs');
const content = fs.readFileSync('src/components/cesium/CesiumMoonGlobe.tsx', 'utf8');
console.log('Does CesiumMoonGlobe contain "varying"?', content.includes('varying'));
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('varying')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});

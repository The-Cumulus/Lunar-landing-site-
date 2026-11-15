const fs = require('fs');

const content = fs.readFileSync('Body.svg', 'utf8');

// Find all groups with transform or id or clip-path
const groups = [];
const gRegex = /<g\b([^>]*)>/g;
let m;
while ((m = gRegex.exec(content)) !== null) {
  groups.push(m[1].trim());
}
console.log('Total groups:', groups.length);
console.log('Sample groups (first 15):');
console.log(groups.slice(0, 15));

// Check if there are embedded images or patterns
const patternRegex = /<pattern\b([^>]*)>/g;
while ((m = patternRegex.exec(content)) !== null) {
  console.log('Pattern:', m[1]);
}
const imageRegex = /<image\b([^>]*)>/g;
let imgCount = 0;
while ((m = imageRegex.exec(content)) !== null) {
  imgCount++;
  console.log('Image:', m[1].slice(0, 200));
}
console.log('Total images:', imgCount);

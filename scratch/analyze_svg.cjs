const fs = require('fs');

const content = fs.readFileSync('Body.svg', 'utf8');

console.log('Total characters:', content.length);
const rootMatch = content.match(/<svg[^>]*>/);
console.log('SVG tag:', rootMatch ? rootMatch[0] : 'None');

// Extract all text contents from <text> nodes
const textMatches = [];
const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
let match;
while ((match = textRegex.exec(content)) !== null) {
  // Strip inner tags like tspan
  const clean = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean) textMatches.push(clean);
}
console.log('Number of text elements:', textMatches.length);
console.log('First 40 text elements:');
console.log(textMatches.slice(0, 40));
console.log('Next 40 text elements:');
console.log(textMatches.slice(40, 80));
console.log('Remaining text elements:');
console.log(textMatches.slice(80));

// Find major groups / id or classes or data-name
const groupIds = [];
const groupRegex = /<g\b[^>]*\bid="([^"]+)"[^>]*>/g;
while ((match = groupRegex.exec(content)) !== null) {
  groupIds.push(match[1]);
}
console.log('Group IDs count:', groupIds.length);
console.log('Sample group IDs:', groupIds.slice(0, 30));

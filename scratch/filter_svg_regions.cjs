const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/svg_elements.json', 'utf8'));

// Filter out duplicates and group by layout regions
// Region 1: Top Bar (y < 80)
// Region 2: Sidebar (x < 360, y >= 70)
// Region 3: Other

const topBar = data.elements.filter(e => e.y < 80 && e.width > 20);
const sidebar = data.elements.filter(e => e.x < 360 && e.y >= 70 && e.width > 60);

console.log('=== TOP BAR ELEMENTS ===');
topBar.sort((a,b) => a.x - b.x);
for (const e of topBar) {
  console.log(`x=${e.x}, y=${e.y}, w=${e.width}, h=${e.height}, fill=${e.fill}, stroke=${e.stroke}`);
}

console.log('\n=== SIDEBAR CARDS & CONTAINERS ===');
sidebar.sort((a,b) => a.y - b.y);
for (const e of sidebar) {
  console.log(`x=${e.x}, y=${e.y}, w=${e.width}, h=${e.height}, fill=${e.fill}, stroke=${e.stroke}`);
}

const https = require('https');
https.get('https://unpkg.com/cesium@1.121.0/Build/Cesium/Cesium.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for all occurrences of 'varying '
    let pos = 0;
    let count = 0;
    while ((pos = data.indexOf('varying ', pos + 1)) !== -1) {
      count++;
      let start = Math.max(0, pos - 150);
      let end = Math.min(data.length, pos + 150);
      let snippet = data.substring(start, end);
      // Check if it looks like a shader string
      if (snippet.includes('`') || snippet.includes('"') || snippet.includes("'")) {
        console.log(`[${count}] near ${pos}:`, JSON.stringify(snippet.substring(100, 200)));
      }
    }
  });
});

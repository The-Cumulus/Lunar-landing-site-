const https = require('https');
https.get('https://unpkg.com/cesium@1.121.0/Build/Cesium/Cesium.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.substring(1665800, 1667100));
  });
});

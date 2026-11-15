const https = require('https');

https.get('https://unpkg.com/cesium@1.121.0/Build/Cesium/Cesium.js', (res) => {
  let js = '';
  res.on('data', chunk => js += chunk);
  res.on('end', () => {
    // Extract QLe from Cesium.js
    let p = js.indexOf('function QLe(');
    let pEnd = js.indexOf('var PG=QLe;', p);
    let qleCode = js.substring(p, pEnd) + '\nreturn QLe;';
    const QLe = new Function(qleCode)();

    const terrainFilterShaderSource = `
        uniform sampler2D colorTexture;
        in vec2 v_textureCoordinates;
        uniform float u_mode;
        void main() {
          vec4 color = texture(colorTexture, v_textureCoordinates);
          out_FragColor = color;
        }
    `;

    console.log('--- RUNNING QLe (WebGL 1 transpilation) on terrainFilterShaderSource ---');
    const webgl1Shader = QLe(terrainFilterShaderSource, true);
    console.log(webgl1Shader);

    const lines = webgl1Shader.split('\n');
    console.log('\n--- LINES OF webgl1Shader ---');
    lines.forEach((l, idx) => console.log(`Line ${idx+1}: ${l}`));
  });
});

const https = require('https');

https.get('https://unpkg.com/cesium@1.121.0/Build/Cesium/Cesium.js', (res) => {
  let js = '';
  res.on('data', chunk => js += chunk);
  res.on('end', () => {
    // Extract fee
    let p = js.indexOf('function fee(');
    let pEnd = js.indexOf('function Xs(', p);
    let feeCode = js.substring(p, pEnd);

    // Also get helper functions needed by fee: uee, qLe, PG, etc.
    // Or let's evaluate in an isolated context where Cesium is loaded!
    global.window = { location: { href: 'http://localhost/' }, navigator: { userAgent: 'Chrome' }, addEventListener: () => {}, removeEventListener: () => {} };
    global.document = { location: { href: 'http://localhost/' }, createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, getElementsByTagName: () => [] }), head: { appendChild: () => {} }, body: { appendChild: () => {} } };
    global.navigator = global.window.navigator;

    const fn = new Function(js + `
      ;return {
        fee: fee,
        qLe: qLe,
        uee: uee,
        ShaderSource: Oe,
        Context: od,
        ShaderProgram: rn
      };
    `);
    const internals = fn();
    console.log('Got internals!');

    const terrainFilterShaderSource = `
        uniform sampler2D colorTexture;
        in vec2 v_textureCoordinates;
        uniform float u_mode;               // 0.0=none, 1.0=elevation, 2.0=slope, 3.0=roughness, 4.0=hillshade
        uniform float u_minElevNorm;        // 0.0 to 1.0
        uniform float u_maxElevNorm;        // 0.0 to 1.0
        uniform float u_highlightOutOfRange;// 1.0=dim, 0.0=hard mask
        uniform float u_slopeCategory;      // 0=all, 1=0-5, 2=5-10, 3=10-15, 4=15+
        uniform float u_roughnessCategory;  // 0=all, 1=smooth, 2=moderate, 3=rough
        uniform float u_hillshadeAzimuth;   // radians
        uniform float u_hillshadeAltitude;  // radians
        uniform vec2 u_pixelStep;           // 1.0 / canvas dimensions

        void main() {
          vec4 color = texture(colorTexture, v_textureCoordinates);
          out_FragColor = color;
        }
    `;

    const shaderSource = new internals.ShaderSource({
      sources: [terrainFilterShaderSource]
    });

    const mockContextWebGL2 = {
      webgl2: true,
      textureFloatLinear: true,
      floatingPointTexture: true
    };

    const combinedWebGL2 = internals.fee(shaderSource, true, mockContextWebGL2);
    console.log('=== COMBINED FRAGMENT SHADER (WEBGL 2) ===');
    const lines2 = combinedWebGL2.split('\n');
    lines2.forEach((l, idx) => {
      if (idx < 25 || l.includes('varying') || l.includes('out_FragColor')) {
        console.log(`[Line ${idx+1}] ${l}`);
      }
    });

    const mockContextWebGL1 = {
      webgl2: false,
      textureFloatLinear: true,
      floatingPointTexture: true
    };

    const combinedWebGL1 = internals.fee(shaderSource, true, mockContextWebGL1);
    console.log('\n=== COMBINED FRAGMENT SHADER (WEBGL 1) ===');
    const lines1 = combinedWebGL1.split('\n');
    lines1.forEach((l, idx) => {
      if (idx < 25 || l.includes('varying') || l.includes('out_FragColor')) {
        console.log(`[Line ${idx+1}] ${l}`);
      }
    });
  });
});

const https = require('https');

https.get('https://unpkg.com/cesium@1.121.0/Build/Cesium/Cesium.js', (res) => {
  let js = '';
  res.on('data', chunk => js += chunk);
  res.on('end', () => {
    global.window = {
      location: { href: 'http://localhost/' },
      navigator: { userAgent: 'Chrome' },
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    global.document = {
      location: { href: 'http://localhost/' },
      createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} }
    };
    global.navigator = global.window.navigator;

    // Run Cesium.js
    const fn = new Function(js);
    fn();
    const Cesium = global.window.Cesium;
    console.log('Cesium version:', Cesium.VERSION);

    // Let's create a PostProcessStage with our shader
    const terrainFilterShaderSource = `
        uniform sampler2D colorTexture;
        in vec2 v_textureCoordinates;
        uniform float u_mode;
        void main() {
          vec4 color = texture(colorTexture, v_textureCoordinates);
          out_FragColor = color;
        }
    `;

    const stage = new Cesium.PostProcessStage({
      fragmentShader: terrainFilterShaderSource
    });

    console.log('PostProcessStage created successfully!');
  });
});

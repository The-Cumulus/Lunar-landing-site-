const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9457',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9457/json/list')).json();
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 1;
    function send(m, p = {}) {
      return new Promise(res => {
        const i = id++;
        const h = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === i) { ws.removeEventListener('message', h); res(d.result); }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: i, method: m, params: p }));
      });
    }

    const logs = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        const msg = d.params.args.map(a => a.value || a.description || '').join(' ');
        console.log(`[CONSOLE ${d.params.type}]`, msg);
      }
      if (d.method === 'Runtime.exceptionThrown') {
        const exc = d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '');
        console.log(`[EXCEPTION]`, exc);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 4000));

    // Let's test compiling shaders via Cesium inside Chrome!
    console.log('Testing PostProcessStage in Chrome...');
    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const viewer = window.__cesiumViewer;
        if (!viewer) return 'NO_VIEWER';
        const Cesium = window.Cesium;

        // Try creating standard WebGL 1 shader
        try {
          const s1 = new Cesium.PostProcessStage({
            fragmentShader: \`
              uniform sampler2D colorTexture;
              varying vec2 v_textureCoordinates;
              void main() {
                gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
              }
            \`
          });
          viewer.scene.postProcessStages.add(s1);
          viewer.scene.render();
          viewer.scene.postProcessStages.remove(s1);
          return { standardWebGL1Success: true };
        } catch (err) {
          return { standardWebGL1Success: false, error: err.message, stack: err.stack };
        }
      })()`,
      returnByValue: true
    });

    console.log('Test standard WebGL1 result:', result.result.value);

    // Try creating WebGL 2 shader
    const result2 = await send('Runtime.evaluate', {
      expression: `(() => {
        const viewer = window.__cesiumViewer;
        if (!viewer) return 'NO_VIEWER';
        const Cesium = window.Cesium;

        try {
          const s2 = new Cesium.PostProcessStage({
            fragmentShader: \`
              uniform sampler2D colorTexture;
              in vec2 v_textureCoordinates;
              void main() {
                out_FragColor = texture(colorTexture, v_textureCoordinates);
              }
            \`
          });
          viewer.scene.postProcessStages.add(s2);
          viewer.scene.render();
          viewer.scene.postProcessStages.remove(s2);
          return { webGL2Success: true };
        } catch (err) {
          return { webGL2Success: false, error: err.message, stack: err.stack };
        }
      })()`,
      returnByValue: true
    });

    console.log('Test WebGL2 result:', result2.result.value);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9456',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9456/json/list')).json();
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

    console.log('Testing Cesium WebGL version...');
    const webglInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const viewer = window.__cesiumViewer;
        if (!viewer) return 'NO_VIEWER';
        const gl = viewer.scene.context._gl;
        return {
          isWebGL2: viewer.scene.context.webgl2,
          version: gl.getParameter(gl.VERSION),
          shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          renderer: gl.getParameter(gl.RENDERER),
          stagesCount: viewer.scene.postProcessStages.length
        };
      })()`,
      returnByValue: true
    });
    console.log('WebGL Info:', webglInfo.result.value);

    // Now let's trigger the postProcessStage or check its status
    const stageCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const viewer = window.__cesiumViewer;
        if (!viewer) return 'NO_VIEWER';
        const stages = viewer.scene.postProcessStages;
        const res = [];
        for (let i = 0; i < stages.length; i++) {
          const st = stages.get(i);
          res.push({
            name: st.name,
            ready: st.ready,
            enabled: st.enabled,
            shader: st.fragmentShader?.substring(0, 80)
          });
        }
        return res;
      })()`,
      returnByValue: true
    });
    console.log('Stages:', stageCheck.result.value);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

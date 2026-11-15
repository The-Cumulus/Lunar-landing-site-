const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9458',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9458/json/list')).json();
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

    console.log('Enabling stage and testing rendering with mode = 1.0 (elevation)...');
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const viewer = window.__cesiumViewer;
        if (!viewer) return 'NO_VIEWER';
        const stages = viewer.scene.postProcessStages;
        if (stages.length === 0) return 'NO_STAGES';
        const stage = stages.get(0);
        stage.enabled = true;
        stage.uniforms.u_mode = 1.0;
        stage.uniforms.u_minElevNorm = 0.2;
        stage.uniforms.u_maxElevNorm = 0.8;
        viewer.scene.render();
        viewer.scene.render();
        return { success: true, ready: stage.ready };
      })()`,
      returnByValue: true
    });
    console.log('Result:', res.result.value);

    await new Promise(r => setTimeout(r, 2000));

    const errPanel = await send('Runtime.evaluate', {
      expression: 'document.querySelector(".cesium-widget-error-panel")?.innerText || "NONE"'
    });
    console.log('Cesium Error Panel:', errPanel.result.value);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

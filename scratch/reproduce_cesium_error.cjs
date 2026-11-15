const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9455',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9455/json/list')).json();
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
        logs.push({ type: d.params.type, msg });
        console.log(`[CONSOLE ${d.params.type}]`, msg);
      }
      if (d.method === 'Runtime.exceptionThrown') {
        const exc = d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '');
        logs.push({ type: 'EXCEPTION', msg: exc });
        console.log(`[EXCEPTION]`, exc);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to explorer...');
    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 6000));

    const errPanel = await send('Runtime.evaluate', {
      expression: 'document.querySelector(".cesium-widget-error-panel")?.innerText || "NONE"'
    });
    console.log('Cesium Error Panel:', errPanel.result.value);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/cesium_headless_test.png', Buffer.from(shot.data, 'base64'));
    console.log('Screenshot saved to scratch/cesium_headless_test.png');

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

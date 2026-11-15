const { spawn } = require('child_process');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9346',
  '--disable-gpu',
  'about:blank'
]);
setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9346/json/list')).json();
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
    const consoleLogs = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: d.params.type, args: d.params.args.map(a => a.value || a.description) });
      }
      if (d.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({ type: 'EXCEPTION', text: d.params.exceptionDetails.text, exception: d.params.exceptionDetails.exception?.description });
      }
    });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 4000));
    console.log('CONSOLE LOGS & EXCEPTIONS:');
    for (const log of consoleLogs) {
      if (log.type === 'error' || log.type === 'EXCEPTION') {
        console.log(log.type, JSON.stringify(log));
      }
    }
    const evalRes = await send('Runtime.evaluate', { expression: 'document.querySelector(".cesium-widget-error-panel")?.innerText || "NO_ERROR_PANEL"' });
    console.log('CESIUM ERROR PANEL:', evalRes.result.value);
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

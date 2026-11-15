const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9355',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9355/json/list')).json();
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

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 3500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const footer = document.querySelector('footer');
        const r = footer ? footer.getBoundingClientRect() : null;
        return {
          footer: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) } : null,
          innerBar: document.querySelector('footer > div') ? document.querySelector('footer > div').getBoundingClientRect() : null
        };
      })()`,
      returnByValue: true
    });

    console.log('Footer rect:', evalRes.result.value);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

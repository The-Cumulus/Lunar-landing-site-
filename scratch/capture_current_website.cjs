const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9349',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9349/json/list')).json();
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
    await new Promise(r => setTimeout(r, 4000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/current_website_1536x730.png';
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved current website to', outPath);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

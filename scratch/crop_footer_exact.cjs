const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9359',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9359/json/list')).json();
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

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const footer = document.querySelector('footer');
        if (!footer) return null;
        const rect = footer.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })()`,
      returnByValue: true
    });
    console.log('Footer rect:', r.result.value);

    if (r.result.value) {
      const { x, y, width, height } = r.result.value;
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x, y, width, height, scale: 1 }
      });
      fs.writeFileSync('C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/footer_exact_crop.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved footer_exact_crop.png');
    }

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

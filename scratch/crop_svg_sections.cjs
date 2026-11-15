const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9351',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9351/json/list')).json();
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
    const htmlPath = path.resolve('scratch/render_svg.html').replace(/\\/g, '/');
    await send('Page.navigate', { url: `file://${htmlPath}` });
    await new Promise(r => setTimeout(r, 2000));

    // Clip to bottom 100px: y=630 to 730
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 640, width: 1536, height: 90, scale: 1 }
    });
    const outPath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/bottom_svg_cropped.png';
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved bottom crop to', outPath);

    // Also clip top bar: y=0 to 80
    const shotTop = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1536, height: 80, scale: 1 }
    });
    const outTopPath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/top_svg_cropped.png';
    fs.writeFileSync(outTopPath, Buffer.from(shotTop.data, 'base64'));
    console.log('Saved top crop to', outTopPath);

    // Also clip sidebar: x=0 to 360, y=60 to 720
    const shotSidebar = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 60, width: 360, height: 660, scale: 1 }
    });
    const outSidePath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/sidebar_svg_cropped.png';
    fs.writeFileSync(outSidePath, Buffer.from(shotSidebar.data, 'base64'));
    console.log('Saved sidebar crop to', outSidePath);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

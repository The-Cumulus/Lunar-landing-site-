const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const svgPath = path.resolve('Body.svg');
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; background: #000; overflow: hidden; }
    img { width: 1536px; height: 730px; display: block; }
  </style>
</head>
<body>
  <img src="file://${svgPath.replace(/\\/g, '/')}" />
</body>
</html>
`;
fs.writeFileSync('scratch/render_svg.html', html);

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9348',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9348/json/list')).json();
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
    await new Promise(r => setTimeout(r, 2500));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/body_svg_rendered.png';
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('Rendered Body.svg to', outPath);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

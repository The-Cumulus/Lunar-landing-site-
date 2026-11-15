const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9352',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9352/json/list')).json();
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
    await new Promise(r => setTimeout(r, 4500));

    const shotFull = await send('Page.captureScreenshot', { format: 'png' });
    const outFullPath = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/redesigned_website_full.png';
    fs.writeFileSync(outFullPath, Buffer.from(shotFull.data, 'base64'));
    console.log('Saved redesigned_website_full.png');

    // Crop top bar
    const shotTop = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1536, height: 70, scale: 1 }
    });
    const outTop = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/redesigned_top_bar.png';
    fs.writeFileSync(outTop, Buffer.from(shotTop.data, 'base64'));
    console.log('Saved redesigned_top_bar.png');

    // Crop sidebar
    const shotSidebar = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 55, width: 340, height: 650, scale: 1 }
    });
    const outSidebar = 'C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/redesigned_sidebar.png';
    fs.writeFileSync(outSidebar, Buffer.from(shotSidebar.data, 'base64'));
    console.log('Saved redesigned_sidebar.png');

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

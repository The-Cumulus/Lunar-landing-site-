const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9460',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9460/json/list')).json();
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
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 4000));

    // Start tutorial
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("tutorial-start-btn").click()'
    });
    await new Promise(r => setTimeout(r, 500));

    // Click "Start Guided Tour >"
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Start Guided Tour"));
        btn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Step 1: 3D Moon Globe
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_step1_globe.png', Buffer.from(shot1.data, 'base64'));

    // Click Next to Step 2: Header Brand & Center Moon
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Next"));
        nextBtn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_step2_header.png', Buffer.from(shot2.data, 'base64'));

    // Click Next to Step 3: Landing Site Pins Toggle
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Next"));
        nextBtn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_step3_pins.png', Buffer.from(shot3.data, 'base64'));

    console.log('Successfully captured Step 1, Step 2, and Step 3 screenshots!');
    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

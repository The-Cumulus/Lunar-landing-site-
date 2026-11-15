const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9347',
  '--disable-gpu',
  '--window-size=1600,1050',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9347/json/list')).json();
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

    // Open Mission Evaluator Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const evalBtn = btns.find(b => b.textContent && b.textContent.includes('Mission Evaluator'));
        if (evalBtn) evalBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Click "Run Evaluator" if needed, or wait for samples
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const runBtn = btns.find(b => b.textContent && b.textContent.includes('Run Solar'));
        if (runBtn) runBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Take a screenshot of the graph with axes
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/final_verified_graph_axes.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved final_verified_graph_axes.png');

    // Find the chart container rect and hover over it
    const rectRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const svg = document.querySelector('svg.cursor-crosshair');
        if (!svg) return null;
        const r = svg.getBoundingClientRect();
        return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.5 };
      })()`,
      returnByValue: true
    });

    if (rectRes.result.value) {
      const { x, y } = rectRes.result.value;
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y
      });
      await new Promise(r => setTimeout(r, 600));

      const shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('C:/Users/ASHWIN/.gemini/antigravity/brain/96fab97e-43cb-4d5e-b002-df38a003c5d2/final_verified_graph_hover_tooltip.png', Buffer.from(shot2.data, 'base64'));
      console.log('Saved final_verified_graph_hover_tooltip.png');
    }

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

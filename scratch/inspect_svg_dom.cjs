const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9350',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9350/json/list')).json();
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
    // Load SVG inline so we can inspect its DOM
    const svgRaw = fs.readFileSync('Body.svg', 'utf8');
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head><style>body { margin:0; padding:0; background:#000; }</style></head>
    <body>
      ${svgRaw}
    </body>
    </html>
    `;
    fs.writeFileSync('scratch/inline_svg.html', testHtml);
    const htmlPath = path.resolve('scratch/inline_svg.html').replace(/\\/g, '/');
    await send('Page.navigate', { url: `file://${htmlPath}` });
    await new Promise(r => setTimeout(r, 2000));

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const svg = document.querySelector('svg');
        if (!svg) return { error: 'No SVG' };

        // Inspect all child groups and paths
        const elements = [];
        const all = svg.querySelectorAll('g, rect, path');
        for (const el of all) {
          const bbox = el.getBoundingClientRect();
          if (bbox.width > 15 && bbox.height > 15 && bbox.width < 1500) {
            elements.push({
              tag: el.tagName,
              id: el.id,
              x: Math.round(bbox.x),
              y: Math.round(bbox.y),
              width: Math.round(bbox.width),
              height: Math.round(bbox.height),
              fill: el.getAttribute('fill') || '',
              stroke: el.getAttribute('stroke') || '',
              filter: el.getAttribute('filter') || ''
            });
          }
        }
        return {
          totalElements: elements.length,
          elements: elements
        };
      })()`,
      returnByValue: true
    });

    fs.writeFileSync('scratch/svg_elements.json', JSON.stringify(evalResult.result.value, null, 2));
    console.log('Saved svg_elements.json, total elements:', evalResult.result.value.totalElements);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

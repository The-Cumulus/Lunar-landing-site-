const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9459',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9459/json/list')).json();
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

    const consoleErrors = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        const msg = d.params.args.map(a => a.value || a.description || '').join(' ');
        if (d.params.type === 'error' || msg.includes('Fragment shader failed')) {
          consoleErrors.push(msg);
          console.log('[BROWSER ERROR]', msg);
        }
      }
      if (d.method === 'Runtime.exceptionThrown') {
        const exc = d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '');
        consoleErrors.push(exc);
        console.log('[EXCEPTION]', exc);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('1. Navigating to http://localhost:3000/#/explorer...');
    await send('Page.navigate', { url: 'http://localhost:3000/#/explorer' });
    await new Promise(r => setTimeout(r, 4500));

    // Verify Cesium error panel is completely gone
    const errPanel = await send('Runtime.evaluate', {
      expression: 'document.querySelector(".cesium-widget-error-panel")?.innerText || "NONE"'
    });
    console.log('2. Cesium Error Panel check:', errPanel.result.value);

    // Verify Website Tutorial button is present
    const tutBtnCheck = await send('Runtime.evaluate', {
      expression: 'Boolean(document.getElementById("tutorial-start-btn"))'
    });
    console.log('3. Tutorial Start Button exists:', tutBtnCheck.result.value);

    // Click Tutorial Start Button to open guided tour
    console.log('4. Clicking Website Tutorial button...');
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("tutorial-start-btn").click()'
    });
    await new Promise(r => setTimeout(r, 600));

    // Check Welcome Screen Modal is open
    const welcomeModalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const title = document.querySelector("h2");
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Start Exploring Tour") || b.innerText.includes("Next"));
        return {
          title: title?.innerText,
          hasNextBtn: Boolean(nextBtn)
        };
      })()`,
      returnByValue: true
    });
    console.log('5. Welcome Screen Modal:', welcomeModalCheck.result.value);

    // Capture screenshot of Step 0 Welcome Screen
    const welcomeShot = await send('Page.captureScreenshot', { format: 'png' });
    const welcomePath = 'C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_welcome_screen.png';
    fs.writeFileSync(welcomePath, Buffer.from(welcomeShot.data, 'base64'));
    console.log('Saved welcome artifact to:', welcomePath);

    // Click "Start Exploring Tour" to go to Step 1
    console.log('6. Clicking Start Exploring Tour...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Start Exploring Tour"));
        btn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Check Step 1 Spotlight on Globe
    const step1Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const tooltipTitle = document.querySelector("h3")?.innerText;
        const stepBadge = document.querySelector(".font-mono.text-cyan-400")?.innerText;
        return { tooltipTitle, stepBadge };
      })()`,
      returnByValue: true
    });
    console.log('7. Step 1 Spotlight:', step1Check.result.value);

    // Capture screenshot of Step 1
    const step1Shot = await send('Page.captureScreenshot', { format: 'png' });
    const step1Path = 'C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_step1_globe.png';
    fs.writeFileSync(step1Path, Buffer.from(step1Shot.data, 'base64'));
    console.log('Saved step 1 artifact to:', step1Path);

    // Click Next to Step 2 (Header Brand & Recenter)
    console.log('8. Clicking Next to Step 2...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("Next"));
        nextBtn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Check Step 2
    const step2Check = await send('Runtime.evaluate', {
      expression: `(() => {
        const tooltipTitle = document.querySelector("h3")?.innerText;
        const stepBadge = document.querySelector(".font-mono.text-cyan-400")?.innerText;
        return { tooltipTitle, stepBadge };
      })()`,
      returnByValue: true
    });
    console.log('9. Step 2 Header Spotlight:', step2Check.result.value);

    // Capture screenshot of Step 2
    const step2Shot = await send('Page.captureScreenshot', { format: 'png' });
    const step2Path = 'C:\\Users\\ASHWIN\\.gemini\\antigravity\\brain\\96fab97e-43cb-4d5e-b002-df38a003c5d2\\verified_tutorial_step2_header.png';
    fs.writeFileSync(step2Path, Buffer.from(step2Shot.data, 'base64'));
    console.log('Saved step 2 artifact to:', step2Path);

    console.log('Total console errors during test:', consoleErrors.length);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

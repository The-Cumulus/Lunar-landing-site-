const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9357',
  '--disable-gpu',
  '--window-size=1536,730',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const list = await (await fetch('http://127.0.0.1:9357/json/list')).json();
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

    // Test 1: Click Pins Toggle
    const pinRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Pins:'));
        if (!btn) return 'Pin button not found';
        const before = btn.textContent;
        btn.click();
        return { before, after: btn.textContent };
      })()`,
      returnByValue: true
    });
    console.log('Test 1 (Pins toggle):', pinRes.result.value);

    // Test 2: Collapse and Re-expand Layers Sidebar
    const collapseRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const collapseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'LAYERS');
        if (!collapseBtn) return 'Collapse button not found';
        collapseBtn.click();
        const sidebarClosed = document.querySelector('.translate-x-\\\\[-115\\\\%\\\\]') !== null;
        return { sidebarClosed };
      })()`,
      returnByValue: true
    });
    console.log('Test 2 (Sidebar collapse):', collapseRes.result.value);

    // Re-expand
    await send('Runtime.evaluate', {
      expression: `(() => {
        const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === 'LAYERS');
        if (expandBtn) expandBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Test 3: Open Mission Evaluator Modal (Card 6)
    const modalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('span, button, div')).find(b => b.textContent && b.textContent.trim() === 'FEASIBILITY');
        if (!btn) return 'FEASIBILITY button not found';
        btn.click();
        return 'Clicked FEASIBILITY';
      })()`,
      returnByValue: true
    });
    console.log('Test 3 (Modal trigger):', modalRes.result.value);
    await new Promise(r => setTimeout(r, 800));

    const checkModal = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50') || document.querySelector('h2');
        return modal ? modal.textContent.slice(0, 50) : 'No modal';
      })()`,
      returnByValue: true
    });
    console.log('Test 3 Check Modal Opened:', checkModal.result.value);

    chrome.kill();
    process.exit(0);
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);

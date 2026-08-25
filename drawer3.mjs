import { chromium } from '/Users/griffinsurett/coding/2025-Website-Projects/2026/griffinswebservices/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });
const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
const seen=[];
p.on('response', r=>{ const u=r.url(); if(/roofingandsolarvid-poster|logowwords/.test(u)) seen.push(`${(Number(r.headers()['content-length']||0)/1024).toFixed(1)}KB  ${u.split('/').pop()}`); });
await p.goto('http://localhost:4321/', { waitUntil:'domcontentloaded', timeout:60000 });
await p.waitForTimeout(4000);
const lbl = p.locator('label[for="mobile-menu-toggle"]');
await lbl.dispatchEvent('click');
await p.waitForTimeout(4000);
const st = await p.evaluate(()=>{
  const d=[...document.querySelectorAll('div')].find(n=>typeof n.className==='string'&&/bg-cover/.test(n.className));
  const l=document.querySelector('img[alt="Koi Roofing and Solar"]');
  return { open:!!d, bg:d?getComputedStyle(d).backgroundImage:null,
    logo:l?{src:l.currentSrc.split('/').pop(),nat:`${l.naturalWidth}x${l.naturalHeight}`,disp:Math.round(l.getBoundingClientRect().height)}:null };
});
console.log(JSON.stringify(st,null,1));
console.log('POSTER/LOGO DOWNLOADS:\n'+[...new Set(seen)].join('\n'));
await p.screenshot({ path:'drawer-after.png' });
await b.close();

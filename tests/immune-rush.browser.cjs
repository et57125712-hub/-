/* Run with PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/immune-rush.browser.cjs.
   Start a static HTTP server first. No production dependency or backend is required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8765/mission.html';
const output=process.env.TEST_OUTPUT||path.resolve('test-results');
fs.mkdirSync(output,{recursive:true});
const evidence=[];
async function checkLayout(page,label){
 const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
 over:[...document.querySelectorAll('.view.active button,.view.active select,.view.active p,.view.active .prompt,.view.active .case,.view.active .feedback,.bottom-nav,.mode-banner')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1);}).map(e=>e.id||e.className),
 small:[...document.querySelectorAll('button,select,summary')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&!e.disabled&&(r.height<43||r.width<43);}).map(e=>e.id||e.className)}));
 assert(result.scroll<=result.width,`${label}: horizontal overflow ${JSON.stringify(result)}`);assert.deepEqual(result.over,[],label);assert.deepEqual(result.small,[],`${label} touch target`);
}
async function snapshot(page,name){await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled',fullPage:true});}
async function readSave(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('immuneRushSave')));}
async function answer(page,t,correct=true){
 if(t.type==='choice'||t.type==='boss')await page.locator(`[data-answer="${correct?t.answer:(t.answer+1)%t.options.length}"]`).click();
 if(t.type==='rapid'){
  for(let i=0;i<t.items.length;i++){
   const category=correct?t.items[i][1]:t.categories.find(c=>c!==t.items[i][1]);
   await page.locator('#rapidBox').getByRole('button',{name:category,exact:true}).click();
   assert.match(await page.locator('#rapidFeedback').innerText(),correct?/答對/:/答錯/);
   await page.locator('#rapidNext').click();
  }
 }
 if(t.type==='match'){
  for(let i=0;i<t.items.length;i++){
   await page.locator(`[data-match="${i}"]`).click();
   await page.locator('.match-targets').getByRole('button',{name:correct?t.items[i][1]:t.categories.find(c=>c!==t.items[i][1]),exact:true}).click();
  }
  await page.locator('#submitMatch').click();
 }
 if(t.type==='sequence'){
  for(const step of correct?t.answer:[...t.answer].reverse())await page.getByRole('button',{name:step,exact:true}).click();
  await page.locator('#submitSequence').click();
 }
 assert.match(await page.locator('#feedback').innerText(),correct?/答對|本題通過/:/答錯/);
 assert.match(await page.locator('#feedback').innerText(),/正確答案/);
 assert.match(await page.locator('#feedback').innerText(),/為什麼/);
}
async function matrix(browser,name,width,height){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base);const data=await p.evaluate(()=>window.ImmuneRushData.stages);
 assert.equal(data.length,7);assert.equal(data.flatMap(s=>s.tasks).length,35);
 assert.equal(new Set(data.flatMap(s=>s.tasks.map(t=>t.id))).size,35);
 for(const s of data)for(const t of s.tasks){assert(t.hint&&t.explain&&t.point);if(t.options)assert(t.answer>=0&&t.answer<t.options.length);if(t.categories)assert(t.items.every(([,a])=>t.categories.includes(a)));if(t.type==='sequence')assert.deepEqual([...t.items].sort(),[...t.answer].sort());}
 await checkLayout(p,`${name}-${width} home`);await snapshot(p,`${name}-${width}-home`);
 assert.equal(await p.locator('.stage-card[aria-disabled="true"]').count(),6);
 await p.locator('[data-stage="1"]').focus();await p.locator('[data-stage="1"]').press('Enter');assert(await p.locator('#homeView').isVisible());
 for(let si=0;si<data.length;si++){
  await p.locator(`[data-stage="${si}"]`).click();
  for(let ti=0;ti<data[si].tasks.length;ti++){
   const t=data[si].tasks[ti];await checkLayout(p,`${name}-${width} ${t.id} question`);
   await answer(p,t);await checkLayout(p,`${name}-${width} ${t.id} feedback`);
   if(si===4&&ti===4)await snapshot(p,`${name}-${width}-boss-feedback`);
   await p.locator('#nextBtn').click();
  }
  assert.match(await p.locator('#resultPanel').innerText(),/100%/);const state=await readSave(p);assert.equal(state.scores[data[si].id],100);assert.equal(state.unlocked,Math.min(7,si+2));
  await checkLayout(p,`${name}-${width} result`);await p.locator('#returnMap').click();
 }
 await p.reload();assert.equal((await readSave(p)).unlocked,7);
 await p.locator('[data-view="reportView"]').click();await checkLayout(p,`${name}-${width} radar`);await snapshot(p,`${name}-${width}-radar`);
 await p.locator('[data-review-stage="4"]').click();assert(await p.locator('#reviewDialog').isVisible());
 const dialog=await p.locator('#reviewDialog').boundingBox();assert(dialog.width<=width&&dialog.height<=height&&dialog.x>=0&&dialog.y>=0);await p.locator('#closeReviewBtn').click();
 await p.locator('[data-view="settingsView"]').click();await checkLayout(p,`${name}-${width} settings`);
 await p.locator('#soundSwitch').click();assert.equal(await p.locator('#soundSwitch').getAttribute('aria-checked'),'false');await p.reload();await p.locator('[data-view="settingsView"]').click();assert.equal(await p.locator('#soundSwitch').getAttribute('aria-checked'),'false');
 const before=await readSave(p);await p.locator('#demoSwitch').click();assert(await p.locator('#demoBanner').isVisible());assert.equal(await p.locator('.stage-card[aria-disabled="true"]').count(),0);
 await p.locator('#consultBtn').click();assert.equal(await p.locator('.consult-list li').count(),10);await checkLayout(p,`${name}-${width} consultation`);await p.locator('#consultMapBtn').click();
 for(let si=0;si<data.length;si++){
  await p.locator(`[data-stage="${si}"]`).click();await p.locator('#demoTaskSelect').selectOption('4');await p.locator('#previewAnswerBtn').click();assert.match(await p.locator('#feedback').innerText(),/不計分/);await checkLayout(p,`${name}-${width} demo boss`);await p.locator('#backBtn').click();
 }
 await p.locator('#exitDemoBtn').click();const after=await readSave(p);assert.deepEqual(after,before);
 assert.deepEqual(errors,[],`${name}-${width} console errors`);
 evidence.push({engine:name,width,height,studentTasks:35,demoBosses:7,consoleErrors:errors.length,result:'PASS'});console.log(`PASS ${name} ${width}x${height}: 35 student tasks, seven demo Bosses, reload, radar, review, settings, no overflow/errors`);
 await ctx.close();
}
async function edgeCases(browser,name){
 const ctx=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);const data=await p.evaluate(()=>window.ImmuneRushData.stages);
 await p.locator('#continueBtn').click();await answer(p,data[0].tasks[0],false);let state=await readSave(p);assert.equal(state.hearts,2);assert.equal(state.combo,0);const xp=state.xp;await p.reload();await p.locator('#continueBtn').click();assert.equal((await readSave(p)).xp,xp);assert.match(await p.locator('#feedback').innerText(),/答錯/);await p.locator('#nextBtn').click();
 // Leave during a classified item; no delayed callback may leak into another screen.
 await p.locator('#rapidBox').getByRole('button',{name:data[0].tasks[1].items[0][1],exact:true}).click();await p.locator('#backBtn').click();await p.reload();await p.locator('#continueBtn').click();assert(await p.locator('#rapidFeedback').isVisible());await p.locator('#rapidNext').click();
 for(let i=1;i<data[0].tasks[1].items.length;i++){await p.locator('#rapidBox').getByRole('button',{name:data[0].tasks[1].items[i][1],exact:true}).click();await p.locator('#rapidNext').click();}
 await p.locator('#nextBtn').click();const seq=data[0].tasks[2];await p.getByRole('button',{name:seq.answer[0],exact:true}).click();await p.locator('#undoSequence').click();assert.match(await p.locator('#seqOrder').innerText(),/尚未/);await p.getByRole('button',{name:seq.answer[1],exact:true}).click();await p.locator('#clearSequence').click();await answer(p,seq);await p.locator('#nextBtn').click();await answer(p,data[0].tasks[3]);await p.locator('#nextBtn').click();await answer(p,data[0].tasks[4]);await p.locator('#nextBtn').click();assert.equal((await readSave(p)).scores.defense,80);assert.equal((await readSave(p)).unlocked,2);
 await p.locator('#retryStage').click();for(const t of data[0].tasks){await answer(p,t,false);if(t.id==='defense-3'){assert.equal((await readSave(p)).hearts,0);assert.equal(await p.locator('#heartTop').textContent(),'♡♡♡');}await p.locator('#nextBtn').click();}state=await readSave(p);assert.equal(state.scores.defense,80);assert.equal(state.latest.defense,0);assert.equal(state.unlocked,2);assert.equal(state.wrong['先天與後天免疫'],1);await p.locator('#returnMap').click();
 await p.locator('[data-view="reportView"]').click();assert(await p.locator('[data-review-task="defense-2"]').isVisible());await p.locator('[data-review-task="defense-2"]').click();await p.keyboard.press('Escape');assert(!(await p.locator('#reviewDialog').isVisible()));
 // Matching state survives reload, can be changed, and submits once.
 await p.locator('[data-view="homeView"]').click();await p.locator('[data-stage="1"]').click();await p.locator('[data-match="0"]').click();await p.locator('.match-targets').getByRole('button',{name:data[1].tasks[0].items[0][1],exact:true}).click();await p.reload();await p.locator('#continueBtn').click();assert.match(await p.locator('[data-match="0"]').innerText(),/吞噬／呈現/);await answer(p,data[1].tasks[0],false);assert.match(await p.locator('#feedback').innerText(),/應為/);await p.locator('#backBtn').click();
 // Demo completion/XP never change student state or unlocked stage count.
 const original=await readSave(p);await p.locator('#teacherBtn').click();await p.locator('[data-stage="6"]').click();for(const t of data[6].tasks){await answer(p,t);await p.locator('#nextBtn').click();}await p.locator('#returnMap').click();await p.locator('#exitDemoBtn').click();assert.deepEqual(await readSave(p),original);assert.equal(await p.locator('.stage-card[aria-disabled="true"]').count(),5);
 // Reset cancellation and confirmation preserve preferences, clear progress.
 await p.locator('[data-view="settingsView"]').click();await p.locator('#vibrateSwitch').click();p.once('dialog',d=>d.dismiss());await p.locator('#resetBtn').click();assert((await readSave(p)).xp>0);p.once('dialog',d=>d.accept());await p.locator('#resetBtn').click();state=await readSave(p);assert.equal(state.xp,0);assert.equal(state.vibrate,false);assert.equal(state.unlocked,1);assert.deepEqual(state.history,{});
 // Cross-tab progress reset synchronizes without stale run writes.
 const second=await ctx.newPage();await second.goto(base);await p.locator('[data-view="homeView"]').click();await p.locator('#continueBtn').click();await answer(p,data[0].tasks[0]);await second.waitForFunction(()=>document.querySelector('#xpTop').textContent!=='0');await second.locator('[data-view="settingsView"]').click();second.once('dialog',d=>d.accept());await second.locator('#resetBtn').click();await p.waitForFunction(()=>document.querySelector('#xpTop').textContent==='0');assert(await p.locator('#homeView').isVisible());await second.close();
 // Legacy and corrupt saves: no injected markup, finite stats, validated unlocks.
 for(const raw of ['null','[]','{broken',JSON.stringify({xp:'oops',hearts:0,scores:{defense:80,cells:NaN},unlocked:99,wrong:{'<img src=x onerror=alert(1)>':3}})]){await p.evaluate(raw=>localStorage.setItem('immuneRushSave',raw),raw);await p.reload();await checkLayout(p,`${name} malformed`);assert.equal(await p.locator('#xpTop').textContent(),'0');}
 assert.equal(await p.locator('#heartTop').textContent(),'♡♡♡');assert.equal(await p.locator('.stage-card[aria-disabled="true"]').count(),5);
 // Damaged classification cursor must clamp to a valid item, never a blank screen.
 const malformedRun={version:2,xp:110,scores:{},run:{version:2,stage:0,index:1,results:[{ok:true,preview:false,ratio:1,extra:''},null,null,null,null],inputs:{'defense-2':{rapidIndex:999,rapid:data[0].tasks[1].items.map(x=>x[1])}}}};
 await p.evaluate(s=>localStorage.setItem('immuneRushSave',JSON.stringify(s)),malformedRun);await p.reload();await p.locator('#continueBtn').click();assert(await p.locator('#rapidFeedback').isVisible());await p.locator('#rapidNext').click();assert.match(await p.locator('#feedback').innerText(),/5\/5/);
 await ctx.close();
 const blocked=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await blocked.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')};});const q=await blocked.newPage();q.on('pageerror',e=>errors.push(e.message));await q.goto(base);assert(await q.locator('#storageNotice').isVisible());await q.locator('#continueBtn').click();await answer(q,data[0].tasks[0]);assert.match(await q.locator('#storageNotice').innerText(),/無法寫入/);await blocked.close();
 assert.deepEqual(errors,[]);evidence.push({engine:name,edgeCases:'wrong answers, zero energy, 80% unlock, best score retention, partial resume, no duplicate XP, demo isolation, reset, cross-tab, corrupt and denied storage',result:'PASS'});console.log(`PASS ${name} edge cases`);
}
(async()=>{
 for(const name of (process.env.TEST_ENGINES||'chromium,webkit').split(',')){
  const browser=await(name==='chromium'?chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch({headless:true}));
  try{for(const [w,h] of [[430,932],[390,844],[375,812]].filter(([w])=>!process.env.TEST_WIDTHS||process.env.TEST_WIDTHS.split(',').includes(String(w))))await matrix(browser,name,w,h);await edgeCases(browser,name);}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({testedAt:new Date().toISOString(),url:base,evidence},null,2));console.log('ALL PASS');
})().catch(e=>{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({evidence,error:String(e.stack)},null,2));console.error(e);process.exit(1);});

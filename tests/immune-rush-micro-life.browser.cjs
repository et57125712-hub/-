/* Decorative background must move, respect controls and never intercept learning. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'micro-life-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());const p=await b.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/mission.html');
 assert.equal(await p.locator('.micro-skirmish').count(),3);assert.equal(await p.locator('.micro-drifter').count(),4);assert.equal(await p.locator('.micro-life').getAttribute('aria-hidden'),'true');
 assert.equal(await p.locator('.micro-life').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 const before=await p.locator('.micro-pursuer').first().evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(400);assert.notEqual(await p.locator('.micro-pursuer').first().evaluate(e=>getComputedStyle(e).transform),before);
 // Compare approach and capture on the same shared CSS timeline, without waiting a full loop.
 for(const [phase,time] of [['patrol',3500],['capture',7900]]){
  await p.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t;}),time);
  if(phase==='capture')assert(Number(await p.locator('.micro-capture').first().evaluate(e=>getComputedStyle(e).opacity))>.1);
  await p.screenshot({path:path.join(out,`${engine}-${phase}.png`)});
 }
 await p.evaluate(()=>document.getAnimations().forEach(a=>a.play()));
 const saved=await p.evaluate(()=>localStorage.getItem('immuneRushSave'));
 await p.locator('[data-rush-motion]').click();assert.equal(await p.locator('.micro-life').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);assert.equal(await p.locator('.micro-capture').first().evaluate(e=>getComputedStyle(e).opacity),'0');assert.equal(await p.evaluate(()=>localStorage.getItem('immuneRushSave')),saved);
 await p.locator('[data-rush-motion]').click();
 await p.locator('#listModeBtn').click();assert(!(await p.locator('.micro-life').isVisible()));await p.locator('#baseModeBtn').click();
 await p.locator('[data-stage="0"]').click();assert(!(await p.locator('.micro-life').isVisible()));await p.locator('[data-answer="0"]').click();assert.match(await p.locator('#feedback').innerText(),/答對/);assert(!(await p.locator('.micro-life').isVisible()));await p.locator('#backBtn').click();
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.micro-life').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 assert.deepEqual(errors,[]);results.push({engine,movingPatrol:true,capture:true,noPointerInterception:true,offAndReducedMotion:true,hiddenDuringQuestions:true,progressUnchanged:true,result:'PASS'});console.log(engine,'MICRO LIFE PASS');await b.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

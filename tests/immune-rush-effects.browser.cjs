const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'effects-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());const p=await b.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/mission.html');
 await p.locator('#continueBtn').click();assert(await p.locator('.mission-transit').isVisible());assert.equal(await p.locator('.mission-transit').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 assert.equal(await p.locator('.transit-campus').count(),1);
 assert.equal(await p.locator('.mission-transit [data-stage]').count(),0);
 assert(await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}));
 await p.waitForTimeout(220);await p.evaluate(()=>document.querySelector('.mission-transit').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=350;}));await p.screenshot({path:path.join(out,`${engine}-entry.png`)});
 // A correct answer during the transition must remove it and score only once.
 await p.locator('[data-answer="0"]').click();assert.equal(await p.locator('.mission-transit').count(),0);assert(await p.locator('.feedback-emblem.is-celebrating').isVisible());assert.match(await p.locator('#feedback').innerText(),/正確答案/);assert.equal(String(await p.evaluate(()=>JSON.parse(localStorage.getItem('immuneRushSave')).xp)),'110');
 await p.waitForTimeout(200);await p.screenshot({path:path.join(out,`${engine}-success.png`)});await p.locator('#feedback .is-celebrating').waitFor({state:'detached'});assert.equal(String(await p.evaluate(()=>JSON.parse(localStorage.getItem('immuneRushSave')).xp)),'110');
 await p.reload();await p.locator('#continueBtn').click();assert.equal(await p.locator('.is-celebrating').count(),0);assert.equal(String(await p.evaluate(()=>JSON.parse(localStorage.getItem('immuneRushSave')).xp)),'110');
 await p.locator('#backBtn').click();assert(await p.locator('.mission-transit').isVisible());await p.locator('[data-view="settingsView"]').click();assert.equal(await p.locator('.mission-transit').count(),0);
 await p.locator('[data-view="homeView"]').click();await p.locator('#teacherBtn').click();const data=await p.evaluate(()=>window.ImmuneRushData.stages);
 for(let i=0;i<7;i++){
  await p.locator(`.stage-card[data-stage="${i}"]`).click();await p.locator('#demoTaskSelect').selectOption('4');assert.equal(await p.locator('.mission-transit').count(),0);
  const t=data[i].tasks[4];await p.locator(`[data-answer="${t.answer}"]`).click();assert(await p.locator(`.emblem-${i}`).isVisible());assert(await p.locator('.is-celebrating').isVisible());await p.locator('#backBtn').click();
 }
 await p.locator('.stage-card[data-stage="0"]').click();await p.locator('#demoTaskSelect').selectOption('0');await p.locator('[data-answer="1"]').click();assert.equal(await p.locator('.is-celebrating').count(),0);assert.match(await p.locator('#feedback').innerText(),/答錯/);assert.equal(await p.locator('.learning-emblem').getAttribute('data-feedback-state'),'wrong');
 await p.locator('#demoTaskSelect').selectOption('1');await p.locator('#previewAnswerBtn').click();assert.equal(await p.locator('.learning-emblem').getAttribute('data-feedback-state'),'preview');assert.equal(await p.locator('.is-celebrating').count(),0);
 await p.locator('#backBtn').click();await p.locator('#exitDemoBtn').click();await p.locator('#listModeBtn').click();await p.locator('#continueBtn').click();assert.equal(await p.locator('.transit-campus').count(),0);await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('.mission-transit').count(),0);await p.locator('#backBtn').click();await p.locator('#baseModeBtn').click();await p.locator('#continueBtn').click();await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.documentElement.classList.contains('rush-motion-off'));assert.equal(await p.locator('.mission-transit').count(),0);
 await p.locator('#backBtn').click();await p.locator('#continueBtn').click();assert.equal(await p.locator('.mission-transit').count(),0);
 assert.deepEqual(errors,[]);results.push({engine,nonblockingEntry:true,returnAndCancel:true,sevenThemeBadges:true,noDuplicateXP:true,noFalseReward:true,reducedMotion:true,result:'PASS'});console.log(engine,'EFFECTS PASS');await b.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

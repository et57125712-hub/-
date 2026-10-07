/* Regression for the new next-zone action, factual radar and panel readability. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/mission.html';
const output=process.env.TEST_OUTPUT||'panel-test-results';fs.mkdirSync(output,{recursive:true});
(async()=>{const results=[];
for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.locator('[data-view="reportView"]').click();
 assert.match(await p.locator('.learning-radar').getAttribute('aria-label'),/防線啟動 0%/);
 assert.equal(await p.locator('.radar-label').count(),7);
 assert(await p.locator('.learning-radar').evaluate(svg=>[...svg.querySelectorAll('text')].every(e=>{const r=e.getBBox();return r.x>=0&&r.y>=0&&r.x+r.width<=360&&r.y+r.height<=285;})),'all seven labels fit the chart');
 await p.locator('[data-view="homeView"]').click();await p.locator('#continueBtn').click();
 assert.equal(await p.locator('.dot.current').innerText(),'1');
 await p.screenshot({path:path.join(output,`${engine}-question.png`)});
 await p.locator('[data-answer="0"]').click();assert.equal(await p.locator('.dot.done').innerText(),'✓');
 await p.screenshot({path:path.join(output,`${engine}-feedback.png`)});
 // Resume the final question in a real saved run; finishing must unlock once and
 // the next-zone button must start the new zone without losing previous scores.
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('immuneRushSave'));s.run.index=4;s.run.results=[0,1,2,3].map(()=>({ok:true,preview:false,ratio:1,extra:''})).concat(null);localStorage.setItem('immuneRushSave',JSON.stringify(s));});
 await p.reload();await p.locator('#continueBtn').click();await p.locator('[data-answer="0"]').click();await p.locator('#nextBtn').click();
 assert.match(await p.locator('#nextStageBtn').innerText(),/免疫部隊/);
 await p.screenshot({path:path.join(output,`${engine}-result.png`)});
 await p.locator('#nextStageBtn').click();assert.equal(await p.locator('#gameStageTitle').innerText(),'免疫部隊');
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('immuneRushSave')));assert.equal(saved.scores.defense,100);assert.equal(saved.run.stage,1);assert.equal(saved.run.index,0);assert.equal(saved.unlocked,2);
 await p.reload();await p.locator('#continueBtn').click();assert.equal(await p.locator('#gameStageTitle').innerText(),'免疫部隊');
 await p.locator('#backBtn').click();await p.locator('[data-view="reportView"]').click();
 const studentChart=await p.locator('.learning-radar').getAttribute('aria-label');assert.match(studentChart,/防線啟動 100%/);assert.match(studentChart,/免疫部隊 0%/);
 await p.screenshot({path:path.join(output,`${engine}-radar.png`)});
 await p.locator('[data-view="homeView"]').click();await p.locator('#teacherBtn').click();await p.locator('[data-view="reportView"]').click();assert.match(await p.locator('.learning-radar').getAttribute('aria-label'),/防線啟動 0%/);
 await p.locator('#exitDemoBtn').click();await p.locator('[data-view="reportView"]').click();assert.equal(await p.locator('.learning-radar').getAttribute('aria-label'),studentChart);
 await p.addStyleTag({content:'html{font-size:32px}'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);
 assert.deepEqual(errors,[]);results.push({engine,chartLabelsVisible:true,emptyAndActualScores:true,nextZoneAndReload:true,demoIsolation:true,zoom200:true,result:'PASS'});console.log(engine,'PANELS PASS');await b.close();
}fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1);});

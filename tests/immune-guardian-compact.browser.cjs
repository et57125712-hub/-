/* Focused compact controls, footer lifecycle and readable review on short mobile viewports. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'guardian-compact-controls';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());
 const p=await b.newPage({viewport:{width:390,height:650},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/index.html');await p.locator('#lobby [data-music]').click();
 // Put the user's reported question first without altering its text or answers.
 await p.evaluate(()=>{const d=window.ImmuneGuardianData;const i=d.national.findIndex(q=>q.q.includes('免疫複合物'));if(i>=0)d.national.unshift(...d.national.splice(i,1));Math.random=()=>.999;});
 await p.locator('#startBtn').click();assert(!(await p.locator('#battleActions').isVisible()));assert(!(await p.locator('.hud').isVisible()));assert(!(await p.locator('#heroSkill').isVisible()));
 assert(await p.locator('#hero').isVisible());assert(await p.locator('#monster').isVisible());
 await p.screenshot({path:path.join(out,engine+'-compact-question.png')});
 const positions=await p.locator('.option').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:e.getBoundingClientRect().height})));
 assert(positions.every(r=>r.top>0&&r.bottom<650&&r.height>=44));
 await p.locator('#combatDetailBtn').focus();await p.keyboard.press('Enter');assert(await p.locator('.hud').isVisible());assert(await p.locator('#heroSkill').isVisible());assert.equal(await p.locator('#combatDetailBtn').getAttribute('aria-expanded'),'true');await p.keyboard.press('Enter');assert(!(await p.locator('.hud').isVisible()));
 await p.locator('.option').first().click();await p.locator('#answerDialog').waitFor({state:'visible'});const geometry=await p.evaluate(()=>({arenaBottom:document.querySelector('#battle').getBoundingClientRect().bottom,sheetTop:document.querySelector('#answerDialog').getBoundingClientRect().top,actionBottom:document.querySelector('#continueBattleBtn').getBoundingClientRect().bottom}));assert(geometry.sheetTop>=geometry.arenaBottom&&geometry.actionBottom<=650,JSON.stringify(geometry));
 await p.screenshot({path:path.join(out,engine+'-compact-review.png')});await p.locator('#closeAnswerBtn').click();assert(await p.locator('#battleActions').isVisible());await p.locator('#answerBtn').click();await p.locator('#continueBattleBtn').click();assert(!(await p.locator('#battleActions').isVisible()));
 assert.deepEqual(errors,[]);results.push({engine,positions,geometry,detailsKeyboard:true,footerLifecycle:true,result:'PASS'});await b.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(results);})().catch(e=>{console.error(e);process.exit(1)});

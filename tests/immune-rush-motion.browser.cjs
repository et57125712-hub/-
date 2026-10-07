/* Optional UI/motion regression; same environment variables as immune-rush.browser.cjs. */
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

const base=process.env.TEST_URL||'http://127.0.0.1:8765/mission.html';

const output=process.env.TEST_OUTPUT||path.resolve('motion-test-results');
fs.mkdirSync(output,{recursive:true});

(async()=>{const results=[];
for(const engine of ['chromium','webkit']){const b=await(engine==='chromium'?chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch());
for(const [width,height] of [[430,932],[390,844],[375,812]]){const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'no-preference'}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.goto(base);
await p.waitForTimeout(500);
assert((await p.locator('.scan-orbit').evaluate(e=>e.getAnimations().length))>0);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
const portal=await p.locator('#bossPortal').boundingBox(),nav=await p.locator('#bottomNav').boundingBox();
assert(portal.y+portal.height<nav.y,JSON.stringify({width,portal,nav}));
await p.screenshot({path:path.join(output,`portal-${engine}-${width}.png`)});
await p.waitForTimeout(4000);
assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
await p.locator('#continueBtn').click();
const data=await p.evaluate(()=>window.ImmuneRushData.stages);
await p.locator(`[data-answer="${data[0].tasks[0].answer}"]`).click();
assert.equal(await p.locator('#xpTop').textContent(),'110');
assert(await p.locator('#feedback').isVisible());
await p.locator('#backBtn').click();
const save=await p.evaluate(()=>localStorage.getItem('immuneRushSave'));
await p.locator('#homeBossChallenge').click();
assert.match(await p.title(),/免疫守衛戰/);
await p.locator('#startBtn').click();
p.once('dialog',d=>d.accept());
await p.locator('#endBtn').click();
await p.locator('#returnMission').click();
assert(await p.locator('#reportView').isVisible());
assert.equal(await p.evaluate(()=>localStorage.getItem('immuneRushSave')),save);
await p.locator('[data-view="homeView"]').click();
await p.emulateMedia({reducedMotion:'reduce'});
await p.goto(base);
await p.waitForTimeout(100);
assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
await p.addStyleTag({content:'html{font-size:32px}'});
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
await p.locator('#homeBossChallenge').focus();
await p.keyboard.press('Enter');
await p.waitForURL('**/index.html');
assert.match(await p.title(),/免疫守衛戰/);
assert.deepEqual(errors,[]);
results.push({engine,width,height,portalAboveNav:true,finiteMotion:true,reducedMotion:true,progressPreserved:true,zoom200:true,result:'PASS'});
console.log(engine,width,'PASS');
await p.close();
}await b.close()}fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2))})().catch(e=>{console.error(e);
process.exit(1)})

/* Motion and phone composition checks, supplementary to the complete game regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8765/index.html',out=process.env.TEST_OUTPUT||'guardian-scene-results';
fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const name of ['chromium','webkit']){
 const browser=await(name==='chromium'?chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch());
 const p=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true,reducedMotion:'no-preference'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(url);await p.locator('#gameMode').selectOption('national');await p.locator('#startBtn').click();
 const data=await p.evaluate(()=>window.ImmuneGuardianData.national);
 const heroBox=await p.locator('.health-panel.player').boundingBox(),bossBox=await p.locator('.health-panel.enemy').boundingBox();assert(heroBox.x<bossBox.x);
 for(let i=1;i<=20;i++){
  const stage=Math.ceil(i/4);assert.equal(await p.locator('#stageBadge').innerText(),`${stage} / 5`);
  assert.equal(await p.locator('#monster svg').count(),1);assert.equal(await p.locator('#hero svg').count(),1);
  assert.match(await p.locator('#battle').getAttribute('class'),new RegExp(`stage${stage}`));
  if(i%4===1)await p.screenshot({path:path.join(out,`${name}-boss-${stage}.png`),animations:'disabled'});
  const prompt=await p.locator('#question').innerText(),q=data.find(q=>q.q===prompt);
  await p.locator('.option').filter({has:p.getByText(q.ans,{exact:true})}).click();
  assert(await p.locator('#answer').isVisible());
  if(i===1){assert.match(await p.locator('#strike').getAttribute('class'),/fire/);await p.waitForTimeout(500);const a=await p.locator('#answer').boundingBox(),footer=await p.locator('#battleActions').boundingBox();assert(a.y>=0&&a.y<footer.y);}
  await p.locator('#nextBtn').click();
  // An immediate next tap cancels the pending explanation scroll from the last question.
  if(i===2){await p.waitForTimeout(550);const r=await p.locator('#battle').boundingBox();const qBox=await p.locator('#question').boundingBox(),footer=await p.locator('#battleActions').boundingBox();assert(r.y>=0&&r.y+r.height<qBox.y&&qBox.y+qBox.height<footer.y,JSON.stringify({r,qBox,footer}));assert.equal(await p.locator('#progress').innerText(),'第 3 / 20 題');}
 }
 assert.match(await p.locator('#resultTitle').innerText(),/FINAL CLEAR/);
 await p.locator('#retryBtn').click();const prompt=await p.locator('#question').innerText(),q=data.find(q=>q.q===prompt);
 await p.locator('.option').filter({has:p.getByText(q.options.find(o=>o!==q.ans),{exact:true})}).click();assert.match(await p.locator('#strike').getAttribute('class'),/counter fire/);assert.equal(await p.locator('#hp').innerText(),'6');
 await p.waitForTimeout(4700);assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#nextBtn').click();assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 assert.deepEqual(errors,[]);results.push({engine:name,stages:5,hitAndCounter:true,cancelledStaleScroll:true,finiteMotion:true,reducedMotion:true,result:'PASS'});console.log(name,'SCENE PASS');
 await browser.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

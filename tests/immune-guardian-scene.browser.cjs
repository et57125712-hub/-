/* Real motion, transformation and native review-dialog regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8765/index.html',out=process.env.TEST_OUTPUT||'guardian-scene-results';
fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const name of ['chromium','webkit']){
 const browser=await(name==='chromium'?chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}):webkit.launch());
 const p=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true,reducedMotion:'no-preference'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto(url);await p.locator('#gameMode').selectOption('national');await p.locator('#startBtn').click();
 const data=await p.evaluate(()=>window.ImmuneGuardianData.national),forms=new Set(),outfits=new Set();
 for(let i=1;i<=20;i++){
  const stage=Math.ceil(i/4);assert.equal(await p.locator('#stageBadge').innerText(),`${stage} / 5`);
  const prompt=await p.locator('#question').innerText(),q=data.find(q=>q.q===prompt);
  await p.locator('.option').filter({has:p.getByText(q.ans,{exact:true})}).click();
  const y=await p.evaluate(()=>scrollY);
  if(i===2){assert(await p.locator('#monster.morphing').count());assert(await p.locator('#hero.morphing').count());assert.match(await p.locator('#strike').getAttribute('class'),/tier1/);assert.equal(await p.locator('#strike .projectile').count(),1);}
  if(i===3){
   // Opening the sheet manually skips the effect wait; continuing cancels its old timer.
   await p.locator('#answerBtn').click();await p.locator('#continueBattleBtn').click();await p.waitForTimeout(1150);
   assert(!(await p.locator('#answerDialog').isVisible()));assert.equal(await p.locator('#progress').innerText(),'第 4 / 20 題');continue;
  }
  await p.locator('#answerDialog').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>scrollY),y,'opening review preserves background scroll');
  assert(await p.evaluate(()=>document.querySelector('#answerDialog').contains(document.activeElement)));
  const panel=await p.locator('#answerDialog').boundingBox(),battle=await p.locator('#battle').boundingBox();assert(panel.y>=battle.y+battle.height,'battle remains above review sheet');
  forms.add(await p.locator('#monster [data-form]').last().getAttribute('data-form'));outfits.add(await p.locator('#hero [data-hero-tier]').last().getAttribute('data-hero-tier'));
  if(i===2||i===4||i===8||i===12)await p.screenshot({path:path.join(out,`${name}-transformed-review-${i}.png`),animations:'disabled'});
  if(i===2){const score=await p.locator('#score').innerText();await p.keyboard.press('Escape');assert(!(await p.locator('#answerDialog').isVisible()));assert.equal(await p.evaluate(()=>scrollY),y);await p.locator('#answerBtn').click();assert.equal(await p.locator('#score').innerText(),score);}
  await p.locator('#continueBattleBtn').click();
 }
 assert.match(await p.locator('#resultTitle').innerText(),/FINAL CLEAR/);assert(forms.size>=2);assert(outfits.size>=4);
 await p.locator('#retryBtn').click();const prompt=await p.locator('#question').innerText(),q=data.find(q=>q.q===prompt);
 await p.locator('.option').filter({has:p.getByText(q.options.find(o=>o!==q.ans),{exact:true})}).click();assert.match(await p.locator('#strike').getAttribute('class'),/counter fire/);assert.equal(await p.locator('#hp').innerText(),'6');
 await p.locator('#answerDialog').waitFor({state:'visible'});assert.match(await p.locator('#answer').innerText(),/✕ 答錯/);await p.waitForTimeout(4600);assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#continueBattleBtn').click();assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 assert.deepEqual(errors,[]);results.push({engine:name,stages:5,bossForms:[...forms],heroOutfits:[...outfits],backgroundPreserved:true,dialogKeyboard:true,staleTimerCancelled:true,finiteMotion:true,reducedMotion:true,result:'PASS'});console.log(name,'TRANSFORM / DIALOG PASS');await browser.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

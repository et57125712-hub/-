const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'arrival-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const browser=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());
 const p=await browser.newPage({viewport:{width:375,height:650},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL);await p.locator('#lobby [data-music]').click();await p.locator('#gameMode').selectOption('national');await p.locator('#startBtn').click();
 const data=await p.evaluate(()=>window.ImmuneGuardianData),bank=data.national;
 assert.equal(data.heroStates.length,8);assert(data.stages.every(s=>s.forms.length===6));
 const art=await p.evaluate(()=>{const s=window.ImmuneGuardianScene;return {heroes:Array.from({length:8},(_,i)=>s.guardian(i)),attacks:Array.from({length:8},(_,i)=>s.attack(i)),bosses:Array.from({length:5},(_,i)=>Array.from({length:6},(_,f)=>s.boss(i+1,f+1)))};});
 assert.equal(new Set(art.heroes).size,8);assert.equal(new Set(art.attacks).size,8);for(const forms of art.bosses){assert.equal(new Set(forms).size,6);assert(forms[1].includes('mutation-sensors'));assert(forms[2].includes('mutation-armor'));assert(forms[3].includes('mutation-wings'));assert(forms[4].includes('mutation-crown'));assert(forms[5].includes('mutation-core'));}assert(art.heroes[5].includes('#1c486c'));assert(art.heroes[7].includes('guardian-orbit'));
 async function answer(){const text=await p.locator('#question').innerText(),q=bank.find(q=>q.q===text);await p.locator('.option').filter({has:p.getByText(q.ans,{exact:true})}).click();await p.locator('#continueBattleBtn').click();}

 for(let i=1;i<=20;i++){
  if((i-1)%4===0){const n=Math.ceil(i/4);assert.match(await p.locator('#battle').getAttribute('class'),/boss-enter/);assert.equal(await p.locator('#arrivalName').innerText(),data.stages[n-1].name);
   const rect=await p.locator('#bossArrival').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return {inside:a.top>=b.top&&a.bottom<=b.bottom,pointer:getComputedStyle(e).pointerEvents}});assert(rect.inside);assert.equal(rect.pointer,'none');
   if(n===1){await p.waitForTimeout(230);await p.locator('#battle').evaluate(e=>e.getAnimations({subtree:true}).forEach(a=>a.pause()));await p.screenshot({path:path.join(out,engine+'-arrival.png')});await p.locator('#battle').evaluate(e=>e.getAnimations({subtree:true}).forEach(a=>a.play()));}
   if(n===2){await answer();assert(!/boss-enter/.test(await p.locator('#battle').getAttribute('class')));continue;}
   await p.waitForTimeout(1050);assert(!/boss-enter/.test(await p.locator('#battle').getAttribute('class')));
  }
  await answer();
 }
 assert.match(await p.locator('#resultTitle').innerText(),/FINAL CLEAR/);
 await p.locator('#retryBtn').click();await p.locator('.combat-heading [data-motion]').click();assert(!/boss-enter/.test(await p.locator('#battle').getAttribute('class')));
 p.once('dialog',d=>d.accept());await p.locator('#endBtn').click();await p.locator('#retryBtn').click();assert(!/boss-enter/.test(await p.locator('#battle').getAttribute('class')));
 p.once('dialog',d=>d.accept());await p.locator('#endBtn').click();await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#retryBtn').click();assert(!/boss-enter/.test(await p.locator('#battle').getAttribute('class')));
 p.once('dialog',d=>d.accept());await p.locator('#endBtn').click();await p.locator('#changeModeBtn').click();await p.locator('#gameMode').selectOption('all');await p.locator('#startBtn').click();
 const all=data.national.concat(data.concept),seenHeroes=new Set(),seenBosses=new Set();
 for(let i=1;i<=70;i++){
  const text=await p.locator('#question').innerText(),q=all.find(q=>q.q===text);await p.locator('.option').filter({has:p.getByText(q.ans,{exact:true})}).click();
  seenHeroes.add(await p.locator('#hero [data-hero-tier]').getAttribute('data-hero-tier'));seenBosses.add(await p.locator('#monster [data-form]').getAttribute('data-form'));
  if(i===40){assert.equal(await p.locator('#heroName').innerText(),'星環防線統帥');assert.equal(await p.locator('[data-attack-tier]').getAttribute('data-attack-tier'),'7');await p.screenshot({path:path.join(out,engine+'-star-form.png')});}
  await p.locator('#continueBattleBtn').click();
 }
 assert.equal(seenHeroes.size,8);assert.equal(seenBosses.size,6);assert.match(await p.locator('#resultTitle').innerText(),/FINAL CLEAR/);
 assert.deepEqual(errors,[]);results.push({engine,bossArrivals:5,heroForms:8,bossForms:6,interruptible:true,motionOff:true,reducedMotion:true,result:'PASS'});console.log(engine,'ARRIVAL PASS');await browser.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

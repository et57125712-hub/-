const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/index.html',out=process.env.TEST_OUTPUT||'retention-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const browser=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());const p=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.locator('#lobby [data-music]').click();await p.locator('#startBtn').click();const bank=await p.evaluate(()=>window.ImmuneGuardianData.national.concat(window.ImmuneGuardianData.concept));
 const look=()=>p.evaluate(()=>({name:document.querySelector('#heroName').textContent,skill:document.querySelector('#heroSkill').textContent,tier:document.querySelector('#hero [data-hero-tier]').getAttribute('data-hero-tier'),icon:document.querySelector('#heroIcon').innerHTML}));
 async function answer(ok){const prompt=await p.locator('#question').innerText(),q=bank.find(x=>x.q===prompt),choice=ok?q.ans:q.options.find(x=>x!==q.ans);await p.locator('.option').filter({has:p.getByText(choice,{exact:true})}).click();}
 const next=()=>p.locator('#continueBattleBtn').click();
 for(let i=0;i<12;i++){await answer(true);await next();}const crown=await look();assert.equal(crown.tier,'4');
 const score=Number(await p.locator('#score').innerText()),bossHp=Number(await p.locator('#enemyMeter').getAttribute('aria-valuenow'));
 await answer(false);assert.deepEqual(await look(),crown);assert.equal(await p.locator('#streak').innerText(),'0');assert.equal(await p.locator('#hp').innerText(),'6');assert.equal(Number(await p.locator('#score').innerText()),score);
 await p.screenshot({path:path.join(out,engine+'-retained-after-hit.png')});await next();await answer(true);
 assert.deepEqual(await look(),crown);assert.match(await p.locator('#strike').getAttribute('class'),/tier4/);assert.equal(Number(await p.locator('#score').innerText()),score+10);assert.equal(Number(await p.locator('#enemyMeter').getAttribute('aria-valuenow')),bossHp-10);await next();
 await answer(false);assert.deepEqual(await look(),crown);assert.equal(await p.locator('#streak').innerText(),'0');await next();
 for(let i=0;i<26;i++){await answer(true);await next();}const halo=await look();assert.equal(halo.tier,'6');assert.equal(halo.name,'光環免疫統帥');await answer(false);assert.deepEqual(await look(),halo);assert.equal(await p.locator('#streak').innerText(),'0');
 await p.locator('#closeAnswerBtn').click();p.once('dialog',d=>d.accept());await p.locator('#endBtn').click();await p.locator('#retryBtn').click();assert.equal((await look()).tier,'0');assert.equal(await p.locator('#streak').innerText(),'0');assert.equal(await p.locator('#hp').innerText(),'7');assert.deepEqual(errors,[]);results.push({engine,retainsHighestForm:true,currentComboDamage:true,canUpgradeAgain:true,newRunResets:true,result:'PASS'});console.log(engine,'RETENTION PASS');await browser.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

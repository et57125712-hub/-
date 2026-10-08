const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'cumulative-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());const p=await b.newPage({viewport:{width:375,height:650},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/index.html');await p.locator('#lobby [data-music]').click();await p.locator('#startBtn').click();const data=await p.evaluate(()=>window.ImmuneGuardianData),bank=data.national.concat(data.concept);
 async function answer(ok){const text=await p.locator('#question').innerText(),q=bank.find(q=>q.q===text);await p.locator('.option').filter({has:p.getByText(ok?q.ans:q.options.find(o=>o!==q.ans),{exact:true})}).click();}
 const next=()=>p.locator('#continueBattleBtn').click(),forms=[],attacks=[];
 for(let total=1;total<=26;total++){
  await answer(true);const rank=data.heroStates.findLastIndex(s=>s.min<=total),state=data.heroStates[rank];
  assert.equal(await p.locator('#heroName').innerText(),state.name);assert.equal(await p.locator('#hero [data-hero-tier]').getAttribute('data-hero-tier'),String(rank));assert.match(await p.locator('#evolutionProgress').innerText(),new RegExp(`答對 ${total}｜`));
  assert.equal(await p.locator('[data-attack-tier]').getAttribute('data-attack-tier'),String(rank));assert.equal(await p.locator('[data-impact-tier]').getAttribute('data-impact-tier'),String(rank));
  if(state.min===total){forms.push(state.name);attacks.push(await p.locator('#strike').evaluate(e=>e.innerHTML));}
  if(total===1){const score=await p.locator('#score').innerText();await p.locator('.option.correct').dispatchEvent('click');assert.equal(await p.locator('#score').innerText(),score);assert.match(await p.locator('#evolutionProgress').innerText(),/答對 1｜/);}
  if(total===26){await p.screenshot({path:path.join(out,engine+'-cumulative-final.png')});break;}
  await next();
  if([1,3,7,11,25].includes(total)){
   await answer(false);assert.equal(await p.locator('#streak').innerText(),'0');assert.equal(await p.locator('#heroName').innerText(),state.name);assert.match(await p.locator('#evolutionProgress').innerText(),new RegExp(`答對 ${total}｜`));assert.equal(await p.locator('[data-impact-tier]').getAttribute('data-impact-tier'),'counter');assert(Number(await p.locator('#hp').innerText())>0);await next();
  }
 }
 assert.equal(forms.length,5);assert.equal(new Set(attacks).size,5);assert.equal(await p.locator('#streak').innerText(),'1');assert.equal(await p.locator('#heroName').innerText(),'光環免疫統帥');
 await p.locator('#closeAnswerBtn').click();p.once('dialog',d=>d.accept());await p.locator('#endBtn').click();assert.match(await p.locator('#result').innerText(),/26 題答對/);await p.locator('#retryBtn').click();assert.match(await p.locator('#evolutionProgress').innerText(),/答對 0｜/);assert.equal(await p.locator('#heroName').innerText(),'護生守衛');
 assert.deepEqual(errors,[]);results.push({engine,correct:26,interruptions:5,finalCombo:1,forms,exactlyOnce:true,retryResets:true,result:'PASS'});console.log(engine,'CUMULATIVE PASS');await b.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});

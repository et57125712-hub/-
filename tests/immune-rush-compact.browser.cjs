/* Mobile reading space and native, keyboard-accessible mission briefing. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.TEST_OUTPUT||'compact-results';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:process.env.CHROME_PATH}):webkit.launch());
 for(const [width,height] of [[430,932],[390,844],[375,812],[375,650]]){
  const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8766/immune-rush/mission.html');await p.locator('#continueBtn').click();await p.locator('.mission-transit').waitFor({state:'detached'});
  assert.equal(await p.locator('#xpTop,#comboTop,#heartTop').count(),0);
  assert.equal(await p.locator('#arena').evaluate(e=>e.open),false);
  const layout=await p.evaluate(()=>({header:document.querySelector('.topbar').getBoundingClientRect().height,promptTop:document.querySelector('.prompt').getBoundingClientRect().top,lastOption:Math.max(...[...document.querySelectorAll('[data-answer]')].map(e=>e.getBoundingClientRect().bottom)),overflow:document.documentElement.scrollWidth>innerWidth}));
  assert(layout.header<=45,JSON.stringify(layout));assert(layout.promptTop<300,JSON.stringify(layout));assert(layout.lastOption<height,JSON.stringify(layout));assert.equal(layout.overflow,false);
  await p.screenshot({path:path.join(out,`${engine}-${width}x${height}-question.png`)});
  await p.locator('#arena summary').focus();await p.keyboard.press('Enter');assert(await p.locator('#arenaText').isVisible());await p.keyboard.press('Enter');assert.equal(await p.locator('#arena').evaluate(e=>e.open),false);
  await p.addStyleTag({content:'html{font-size:32px}'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);await p.locator('#arena summary').click();assert(await p.locator('#arenaText').isVisible());
  assert.deepEqual(errors,[]);results.push({engine,width,height,...layout,result:'PASS'});await p.close();
 }await b.close();}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(results);})().catch(e=>{console.error(e);process.exit(1)});

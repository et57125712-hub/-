(() => {
  'use strict';
  const {national,concept,stages,bossLines,heroStates}=window.ImmuneGuardianData;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scene=window.ImmuneGuardianScene;
  let feedbackTimer=0;
  const modes={all:'綜合挑戰',national:'國考特訓',concept:'概念闖關'};
  let pool=[],index=0,current=null,hp=7,streak=0,score=0,enemyHp=0,stage=1,maxHp=0;
  let phase='idle',heroForm=0,bossForm=1,defeated=0,bestCombo=0,history=[],healthPlan=[];
  const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
  function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function focusOn(el){el.focus({preventScroll:true});el.scrollIntoView({block:'start',behavior:'instant'});}
  function baseDamage(combo){return combo>=70?32:combo>=60?30:combo>=50?28:combo>=40?26:combo>=30?24:combo>=20?22:combo>=10?20:combo>=6?18:combo>=4?15:combo>=2?12:10;}
  function damageFor(combo,boss){return Math.max(5,Math.round(baseDamage(combo)*(1-(boss-1)*.1)));}
  // Budget each Boss against its share of a perfect run, preserving combo damage.
  // This makes 20, 50 and 70 question modes all capable of reaching FINAL CLEAR.
  function planHealth(total){return stages.map((_,i)=>{let health=0;for(let q=Math.floor(i*total/5)+1;q<=Math.floor((i+1)*total/5);q++)health+=damageFor(q,i+1);return health;});}
  function animate(el,cls){if(reducedMotion())return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
  function clearEffects(){clearTimeout(feedbackTimer);$('battle').classList.remove('boss-enter');$('strike').className='strike';document.querySelectorAll('.attack,.hit,.pop').forEach(el=>el.classList.remove('attack','hit','pop'));}
  function bossSay(type){$('bossTalk').textContent=pick(bossLines[stage-1][type]||bossLines[stage-1].open);}
  function getHeroState(){let state=heroStates[0];for(const entry of heroStates)if(streak>=entry.min)state=entry;return state;}
  function applyHeroState(){const s=getHeroState(),rank=heroStates.indexOf(s);$('heroName').textContent=s.name;$('hero').innerHTML=scene.guardian(rank);$('hero').className='hero '+s.cls;$('equip').textContent=s.equip;if(rank>heroForm&&streak>0){$('evolutionBanner').textContent=`COMBO ${streak}・${s.skill}`;animate($('evolutionBanner'),'pop');}heroForm=rank;}
  function updateBossForm(){if(enemyHp===0){$('bossFormLabel').textContent='✓ 已擊敗';return;}const ratio=enemyHp/maxHp;bossForm=ratio<=.1?4:ratio<=.35?3:ratio<=.7?2:1;const form=stages[stage-1].forms[bossForm-1];$('bossName').textContent=form[0];$('monster').innerHTML=scene.boss(stage,bossForm);$('monster').className='monster form'+bossForm;$('bossFormLabel').textContent=['初始型態','突變型態','狂暴型態','終極型態'][bossForm-1];}
  function update(){
    hp=Math.max(0,Math.min(7,hp));enemyHp=Math.max(0,enemyHp);
    $('hp').textContent=hp;$('streak').textContent=streak;$('score').textContent=score;$('defeated').textContent=`${defeated} / 5`;
    $('enemyHp').style.width=(maxHp?enemyHp/maxHp*100:0)+'%';$('heroHpBar').style.width=hp/7*100+'%';
    $('bossHealthText').textContent=`${enemyHp} / ${maxHp}`;$('enemyMeter').setAttribute('aria-valuemax',String(maxHp));$('enemyMeter').setAttribute('aria-valuenow',String(enemyHp));$('heroMeter').setAttribute('aria-valuenow',String(hp));
    $('counterDamage').textContent=Math.min(3,1+Math.floor((stage-1)/2));
    applyHeroState();updateBossForm();
  }
  function loadStage(n){stage=n;maxHp=healthPlan[n-1];enemyHp=maxHp;bossForm=1;const s=stages[n-1];$('bossLv').textContent=s.lv;$('stageBadge').textContent=`${n} / 5`;$('battle').className='battle stage'+n;$('stageNotice').hidden=false;$('stageNotice').textContent=`BOSS ${n} / 5 登場｜${s.name}`;bossSay('open');update();animate($('battle'),'boss-enter');}
  function startGame(){
    clearEffects();const mode=$('gameMode').value;
    pool=shuffle((mode==='national'?national:mode==='concept'?concept:national.concat(concept)).slice());healthPlan=planHealth(pool.length);
    index=0;current=null;hp=7;streak=0;score=0;heroForm=0;defeated=0;bestCombo=0;history=[];phase='question';
    $('lobby').hidden=true;$('result').hidden=true;$('playArea').hidden=false;$('battleActions').hidden=false;
    $('catLabel').textContent=modes[mode];$('roundProgress').max=pool.length;$('roundProgress').value=0;
    loadStage(1);renderQuestion();$('status').textContent=`${modes[mode]}開始。答完後可慢慢閱讀解析。`;focusOn($('combatPanel'));
  }
  function renderQuestion(){
    current=pool[index++];phase='question';
    $('progress').textContent=`第 ${index} / ${pool.length} 題`;$('questionCategory').textContent=current.category;$('question').textContent=current.q;
    $('answer').hidden=true;$('answer').innerHTML='';$('answerBtn').disabled=true;$('nextBtn').disabled=true;$('nextBtn').textContent='請先作答';
    const box=$('options');box.innerHTML='';box.classList.toggle('long-options',current.options.some(opt=>opt.length>22));
    shuffle(current.options.slice()).forEach((opt,i)=>{const b=document.createElement('button');b.type='button';b.className='option';b.innerHTML=`<span class="option-key">${String.fromCharCode(65+i)}</span><span>${esc(opt)}</span>`;b.dataset.option=opt;b.onclick=()=>choose(b,opt);box.appendChild(b);});
  }
  function choose(el,opt){
    if(phase!=='question'||!current)return;$('battle').classList.remove('boss-enter');phase='feedback';const ok=opt===current.ans;const beforeForm=bossForm;let damage=0,counter=0;
    document.querySelectorAll('.option').forEach(b=>{b.disabled=true;if(b.dataset.option===current.ans){b.classList.add('correct');b.innerHTML+='<span class="answer-mark">✓ 正確答案</span>';}else if(b===el){b.classList.add('wrong');b.innerHTML+='<span class="answer-mark">✕ 你的選擇</span>';}});
    if(ok){streak++;bestCombo=Math.max(streak,bestCombo);score+=baseDamage(streak);damage=damageFor(streak,stage);enemyHp=Math.max(0,enemyHp-damage);if(enemyHp===0)defeated++;update();animate($('hero'),'attack');animate($('monster'),'hit');$('strike').className='strike';animate($('strike'),'fire');$('damage').textContent='−'+damage;animate($('damage'),'pop');bossSay(enemyHp===0?'defeat':bossForm>beforeForm?'transform':streak%5===0?'milestone':enemyHp/maxHp<=.1?'low':'right');}
    else{streak=0;counter=Math.min(3,1+Math.floor((stage-1)/2));hp=Math.max(0,hp-counter);update();animate($('hero'),'hit');$('strike').className='strike counter';animate($('strike'),'fire');bossSay('wrong');}
    history.push({id:current.id,selected:opt,ok});$('roundProgress').value=history.length;
    $('status').textContent=ok?(enemyHp===0?`✓ ${stages[stage-1].name} 已擊敗。閱讀解析後繼續。`:`✓ 答對・Boss −${damage} HP・Combo ${streak}`):`✕ 答錯・生命 −${counter}・Combo 歸零`;
    const answer=$('answer');answer.className='answer '+(ok?'correct':'wrong');answer.innerHTML=`<h3>${ok?'✓ 答對，連招命中！':'✕ 答錯，先修正觀念'}</h3><p class="your-answer">你的選擇：${esc(opt)}</p><h4>正確答案</h4><p>${esc(current.ans)}</p><h4>為什麼？</h4><p>${esc(current.exp)}</p><details class="source"><summary>題目來源</summary><p>${esc(current.src)}</p></details>${hp===0?'<p class="outcome-note">生命已歸零；看完本題解析後，可查看結算與錯題。</p>':enemyHp===0?`<p class="outcome-note">✓ 已擊敗 ${defeated}/5 位 Boss；${stage===5?'看完解析即可查看通關戰績。':'下一步迎戰下一位 Boss。'}</p>`:''}`;
    answer.hidden=false;$('answerBtn').disabled=false;$('nextBtn').disabled=false;
    $('nextBtn').textContent=hp===0||stage===5&&enemyHp===0||index>=pool.length?'查看結算':enemyHp===0?`迎戰 BOSS ${stage+1}`:'下一題';answer.focus({preventScroll:true});clearTimeout(feedbackTimer);if(reducedMotion())focusOn(answer);else feedbackTimer=setTimeout(()=>{if(phase==='feedback')focusOn(answer);},450);
  }
  function nextQuestion(){
    if(phase!=='feedback')return;
    if(hp===0)return finishGame('defeat');
    if(stage===5&&enemyHp===0)return finishGame('clear');
    if(index>=pool.length)return finishGame('complete');
    clearEffects();const nextBoss=enemyHp===0;if(nextBoss)loadStage(stage+1);else $('stageNotice').hidden=true;
    renderQuestion();$('question').focus({preventScroll:true});$('combatPanel').scrollIntoView({block:'start',behavior:'instant'});
  }
  function finishGame(reason){
    if(phase==='result'||phase==='idle')return;phase='result';clearEffects();
    $('playArea').hidden=true;$('battleActions').hidden=true;const result=$('result');result.hidden=false;
    const correct=history.filter(h=>h.ok).length,wrong=history.filter(h=>!h.ok),bank=national.concat(concept);
    const title={clear:'FINAL CLEAR！五大 Boss 突破',defeat:'生命歸零，整隊再挑戰',complete:'本輪題目完成',stopped:'本輪挑戰已結束'}[reason];
    result.innerHTML=`<span class="eyebrow">${modes[$('gameMode').value]}・挑戰結算</span><h1 id="resultTitle">${title}</h1><p>${history.length}/${pool.length} 題已作答・${correct} 題答對${history.length?`（${Math.round(correct/history.length*100)}%）`:''}</p><div class="result-stats"><div><b>${score}</b><span>本輪分數</span></div><div><b>${bestCombo}</b><span>最高 Combo</span></div><div><b>${defeated}/5</b><span>擊敗 Boss</span></div><div><b>${hp}/7</b><span>剩餘生命</span></div></div><div class="result-actions"><button id="retryBtn" class="primary">再次挑戰本模式</button><button id="changeModeBtn" class="secondary">選擇其他模式</button></div><section class="review-section"><h2>本次需要複習的題目</h2>${wrong.length?wrong.map(h=>{const q=bank.find(t=>t.id===h.id);return `<details class="review-item"><summary>✕ ${esc(q.q)}</summary><p>你的選擇：${esc(h.selected)}</p><h3>正確答案：${esc(q.ans)}</h3><p>${esc(q.exp)}</p></details>`;}).join(''):`<p>${history.length?'已作答題目皆正確。可挑戰更多題目，或回到正式任務複習。':'尚未作答。可重新選擇模式再開始。'}</p>`}</section><section class="return-learning"><span class="eyebrow">回到學習任務</span><h2>帶著本次錯題，複習免疫觀念</h2><p>IMMUNE RUSH 保留自己的任務與雷達進度，與本輪戰績分開。可對照上方錯題，選擇相關單元複習。</p><a class="secondary button-link" id="returnMission" href="./mission.html#report">回到 IMMUNE RUSH 複習弱項</a></section>`;
    $('retryBtn').onclick=startGame;$('changeModeBtn').onclick=()=>{phase='idle';result.hidden=true;$('lobby').hidden=false;focusOn($('gameMode'));};focusOn(result);
  }
  $('battle').insertAdjacentHTML('afterbegin',scene.backdrop());
  $('lobbyScene').innerHTML=scene.backdrop()+`<div class="platform left"></div><div class="platform right"></div><div class="hero">${scene.guardian()}</div><div class="monster">${scene.boss()}</div>`;
  $('startBtn').onclick=startGame;$('nextBtn').onclick=nextQuestion;$('answerBtn').onclick=()=>{if(phase==='feedback')focusOn($('answer'));};
  $('endBtn').onclick=()=>{if(confirm('要結束本輪並查看已作答題目的結算嗎？'))finishGame('stopped');};
  $('battle').addEventListener('animationend',e=>{if(e.animationName==='bossEnter')$('battle').classList.remove('boss-enter');});
  document.querySelectorAll('#battle *').forEach(el=>el.addEventListener('animationend',()=>el.classList.remove('attack','hit','pop')));
})();

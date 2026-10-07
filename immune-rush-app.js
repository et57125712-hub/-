(() => {
  'use strict';
  const {icons, stages} = window.ImmuneRushData;
  const KEY = 'immuneRushSave';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const taskTypes = {choice:'快速判斷',rapid:'分類',match:'配對',sequence:'流程排序',boss:'臨床 Boss'};
  const allTasks = stages.flatMap(s => s.tasks);
  const freshSave = () => ({version:2,xp:0,combo:0,hearts:3,unlocked:1,scores:{},latest:{},attempts:{},wrong:{},history:{},sound:true,vibrate:true,demo:false,run:null});
  const integer = (v, fallback=0, max=Number.MAX_SAFE_INTEGER) => Number.isFinite(v) ? Math.max(0,Math.min(max,Math.floor(v))) : fallback;
  const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  let storageMessage = '';

  // Whitelist saved fields: legacy scores survive; damaged fields cannot break rendering.
  function normalize(raw) {
    raw = object(raw);
    const out = freshSave();
    for (const key of ['sound','vibrate','demo']) if (typeof raw[key] === 'boolean') out[key] = raw[key];
    out.xp = integer(raw.xp); out.combo = integer(raw.combo); out.hearts = integer(raw.hearts,3,3);
    for (const s of stages) {
      for (const key of ['scores','latest','attempts']) {
        if (Object.hasOwn(object(raw[key]),s.id)) out[key][s.id] = integer(raw[key][s.id],0,key==='attempts'?1000000:100);
      }
    }
    // Unlocks follow the original 70% rule, never the untrusted stored unlock counter.
    while (out.unlocked < stages.length && (out.scores[stages[out.unlocked-1].id] || 0) >= 70) out.unlocked++;
    for (const t of allTasks) {
      if (Object.hasOwn(object(raw.wrong),t.point)) out.wrong[t.point] = integer(raw.wrong[t.point]);
      const h = object(object(raw.history)[t.id]);
      if (typeof h.ok === 'boolean') out.history[t.id] = {ok:h.ok,tries:integer(h.tries,1),misses:integer(h.misses),at:integer(h.at)};
    }
    const r = object(raw.run), s = stages[r.stage];
    if (r.version === 2 && Number.isInteger(r.stage) && s && r.stage < out.unlocked && Number.isInteger(r.index) && r.index >= 0 && r.index < s.tasks.length && Array.isArray(r.results)) {
      const validResult = (v,i) => v === null || (v && typeof v.ok === 'boolean' && typeof v.preview === 'boolean' && Number.isFinite(v.ratio) && v.ratio >= 0 && v.ratio <= 1 && typeof v.extra === 'string' && v.extra.length < 100);
      if (r.results.length === s.tasks.length && r.results.every(validResult) && r.results.slice(0,r.index).every(v => v && !v.preview) && r.results.slice(r.index+1).every(v => v===null) && !r.results.some(v => v?.preview)) {
        out.run = {version:2,stage:r.stage,index:r.index,results:r.results.map(v => v ? {ok:v.ok,preview:false,ratio:v.ratio,extra:v.extra} : null),inputs:{}};
        for (const t of s.tasks) {
          const input = object(object(r.inputs)[t.id]), clean = {};
          if (Array.isArray(input.order) && t.options && input.order.length===t.options.length && new Set(input.order).size===t.options.length && input.order.every(n => Number.isInteger(n) && n>=0 && n<t.options.length)) clean.order=input.order;
          if (Number.isInteger(input.choice) && t.options && input.choice>=0 && input.choice<t.options.length) clean.choice=input.choice;
          if (Array.isArray(input.rapid) && t.type==='rapid') clean.rapid=input.rapid.slice(0,t.items.length).filter(v => t.categories.includes(v));
          clean.rapidIndex=integer(input.rapidIndex,0,Math.min(clean.rapid?.length||0,(t.items?.length||1)-1));
          if (Array.isArray(input.sequence) && t.type==='sequence') clean.sequence=[...new Set(input.sequence.filter(v => t.items.includes(v)))];
          if (t.type==='match') clean.matches=Array.from({length:t.items.length},(_,i) => t.categories.includes(input.matches?.[i]) ? input.matches[i] : null);
          out.run.inputs[t.id]=clean;
        }
      } else storageMessage='部分未完成紀錄無法讀取，已保留可用成績；請重新挑戰該區。';
    }
    return out;
  }
  function loadSave() {
    try {
      const text=localStorage.getItem(KEY);
      if (!text) return freshSave();
      try { return normalize(JSON.parse(text)); }
      catch (_) {
        try { localStorage.setItem(KEY+'CorruptBackup',text); } catch (_) { /* keep app usable */ }
        storageMessage='原紀錄格式損壞，已嘗試保留備份；本次從新進度開始。';
        return freshSave();
      }
    } catch (_) { storageMessage='此瀏覽器無法讀取本機紀錄；本次仍可練習，關閉後可能無法保留。'; return freshSave(); }
  }
  let studentSave=loadSave();
  let demoSave={...freshSave(),demo:true};
  let save=studentSave.demo ? demoSave : studentSave;
  let run=save.run, currentStage=0, taskIndex=0, taskLocked=false, matchSelected=null;
  let audioContext, toastTimer, animationFrame;
  function notice() { $('#storageNotice').hidden=!storageMessage; $('#storageNotice').textContent=storageMessage; }
  function persist() {
    try { localStorage.setItem(KEY,JSON.stringify(studentSave)); }
    catch (_) { storageMessage='進度暫時無法寫入本機儲存空間；本次仍可練習，重新整理可能失去新紀錄。'; }
    notice(); updateStats();
  }
  function mastery() { return Math.round(stages.reduce((sum,s)=>sum+(save.scores[s.id]||0),0)/stages.length); }
  function updateStats() {
    $('#xpTop').textContent=save.xp; $('#comboTop').textContent=save.combo;
    $('#heartTop').textContent='❤'.repeat(save.hearts)+'♡'.repeat(3-save.hearts);
    $('#heartTop').setAttribute('aria-label',`Energy ${save.hearts} / 3；歸零仍可練習`);
    $('#heroMastery').textContent=mastery()+'%';
  }
  function syncSettings() {
    for (const [id,key] of [['soundSwitch','sound'],['vibrateSwitch','vibrate'],['demoSwitch','demo']]) {
      const value=studentSave[key]; $('#'+id).classList.toggle('on',value); $('#'+id).setAttribute('aria-checked',String(value));
    }
    $('#demoBanner').hidden=!save.demo; $('#demoControls').hidden=!save.demo;
    $('#teacherBtn').textContent=save.demo?'回學生模式':'展示模式';
    $('#resetBtn').disabled=save.demo;
    $('#resetBtn').textContent=save.demo?'請先回學生模式再清除紀錄':'清除學生學習紀錄';
  }
  function setDemo(value) {
    studentSave.demo=value;
    save=value?demoSave:studentSave; run=save.run;
    persist(); syncSettings(); showView('homeView');
    toast(value?'已開啟專家／教師展示模式':'已回到學生模式，原進度已保留');
  }
  function tone(type) {
    if (!studentSave.sound) return;
    try {
      const C=window.AudioContext||window.webkitAudioContext;
      audioContext=audioContext||new C();
      if (audioContext.state==='suspended') audioContext.resume().catch(()=>{});
      const o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;
      o.connect(g);g.connect(audioContext.destination);
      o.frequency.setValueAtTime(type==='bad'?220:520,now);o.frequency.exponentialRampToValueAtTime(type==='bad'?120:880,now+.12);
      g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+.17);
      o.start();o.stop(now+.18);o.onended=()=>{o.disconnect();g.disconnect();};
    } catch (_) { /* Audio is optional. */ }
  }
  function vibe(pattern) { if(studentSave.vibrate && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (_) {} } }
  function toast(msg) {
    clearTimeout(toastTimer);const t=$('#toast');t.textContent=msg;t.classList.add('show');
    toastTimer=setTimeout(()=>t.classList.remove('show'),4000);
  }
  function focusTop(el) { el.focus({preventScroll:true}); el.scrollIntoView({block:'start',behavior:'instant'}); }
  function showView(id) {
    clearTimeout(toastTimer);$('#toast').classList.remove('show');
    if(id==='consultView' && !save.demo) id='homeView';
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    $$('.nav-btn').forEach(b=>{const on=b.dataset.view===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('#bottomNav').hidden=id==='gameView';
    if(id==='homeView')renderMap(); if(id==='reportView')renderReport(); if(id==='settingsView')syncSettings();
    window.scrollTo(0,0); $('#mainContent').focus({preventScroll:true});
  }
  function unlocked(i) { return save.demo || i<save.unlocked; }
  function suggestedStage() { return stages.findIndex((s,i)=>unlocked(i) && (save.scores[s.id]||0)<70); }
  function renderMap() {
    $('#stageMap').innerHTML=stages.map((s,i)=>{
      const score=save.scores[s.id]||0,open=unlocked(i),answered=s.tasks.filter(t=>save.history[t.id]).length;
      return `<button type="button" class="stage-card ${s.boss?'boss ':''}${open?'':'locked '}${score>=70?'done':''}" data-stage="${i}" aria-disabled="${!open}"><span class="stage-icon" aria-hidden="true">${icons[s.icon]}</span><span class="stage-info"><strong>${i+1}. ${s.title}</strong><span class="stage-sub">${s.sub}</span><span class="stage-detail">${open?`${answered}/5 題已練習・${save.demo?'展示可直達 Boss':score>=70?'已通過，可複習':'本區通過 4/5 題解鎖下一區'}`:`🔒 先完成「${stages[i-1].title}」達 70%`}</span><span class="progress-track"><i style="width:${score}%"></i></span></span><span class="stage-side"><b>${score}%</b><span>${open?'最佳成績':'未解鎖'}</span></span></button>`;
    }).join('');
    $$('#stageMap [data-stage]').forEach(b=>b.onclick=()=>startStage(Number(b.dataset.stage)));
    const target=suggestedStage(),pending=save.run;
    $('#continueBtn').textContent=pending?'接續行動':save.xp?'再次行動':'開始行動';
    $('#nextGoal').innerHTML=pending?`<strong>接續未完成任務</strong><p>${stages[pending.stage].title}・第 ${pending.index+1}/5 題，已保留作答。</p>`:target>=0?`<strong>下一個目標：${stages[target].title}</strong><p>${save.demo?'點任一區，從選單直接查看代表題型與 Boss。':'完成本區 5 題並達 70%；可隨時返回，之後接續。'}</p>`:'<strong>七區皆已通過</strong><p>前往知識雷達，依最近答錯的知識點再次練習。</p>';
    updateStats();
  }
  function startStage(i, index=0) {
    if(!unlocked(i)){toast(`先完成「${stages[i-1].title}」達 70%（每區至少通過 4/5 題）`);return;}
    if(!save.demo && save.run && save.run.stage!==i && !confirm('目前有未完成任務。改練此區會重新開始該次挑戰；已保存的成績與解析會保留。')) return;
    if(save.run?.stage===i && !save.demo) run=save.run;
    else {
      run={version:2,stage:i,index,results:stages[i].tasks.map(()=>null),inputs:{}};
      save.run=run;save.hearts=3;save.combo=0;save.attempts[stages[i].id]=(save.attempts[stages[i].id]||0)+1;
    }
    currentStage=run.stage;taskIndex=run.index;persist();showView('gameView');renderTask();
  }
  function task() { return stages[currentStage].tasks[taskIndex]; }
  function inputFor(t) { return run.inputs[t.id] || (run.inputs[t.id]={}); }
  function renderDots() {
    $('#gameProgress').innerHTML=stages[currentStage].tasks.map((_,i)=>`<i class="dot ${run.results[i]?(run.results[i].preview?'preview':run.results[i].ok?'done':'fail'):i===taskIndex?'current':''}"></i>`).join('');
    $('#gameProgress').setAttribute('aria-label',`第 ${taskIndex+1} / 5 題；${run.results.filter(Boolean).length} 題已查看或作答`);
  }
  function renderTask() {
    const s=stages[currentStage], t=task(), result=run.results[taskIndex];
    taskLocked=!!result;matchSelected=null;
    $('#resultPanel').classList.remove('active');$('#questionCard').hidden=false;
    $('#gameStageTitle').textContent=s.title;$('#gameStageSub').textContent=t.point;
    $('#roundPill').textContent=`${taskIndex+1} / ${s.tasks.length}`;
    $('#arenaTitle').textContent=t.type==='boss'?'臨床 Boss・整合判斷':s.title;
    $('#arenaText').textContent=t.type==='boss'?'先找出情境線索，再用免疫機轉做判斷。':s.brief;
    $('#arena').classList.toggle('boss-arena',t.type==='boss');
    $('#feedback').className='feedback';$('#feedback').innerHTML='';$('#hintBox').className='hint-box';$('#hintBox').textContent='';
    $('#hintBtn').hidden=taskLocked;$('#hintBtn').setAttribute('aria-expanded','false');$('#nextBtn').hidden=!taskLocked;
    $('#demoControls').hidden=!save.demo;
    if(save.demo){$('#demoTaskSelect').innerHTML=s.tasks.map((q,i)=>`<option value="${i}">${i+1}. ${taskTypes[q.type]}｜${q.point}</option>`).join('');$('#demoTaskSelect').value=String(taskIndex);}
    $('#questionArea').innerHTML=`<div class="q-meta"><span class="q-type">${taskTypes[t.type]}${t.tag===taskTypes[t.type]?'':'・'+t.tag}</span><span class="timer">知識點：${t.point}</span></div>${t.case?`<div class="case"><strong>情境線索</strong><p>${t.case}</p></div>`:''}<h2 class="prompt" tabindex="-1">${t.prompt}</h2>`;
    if(t.type==='choice'||t.type==='boss')renderChoice(t);else if(t.type==='rapid')renderRapid(t);else if(t.type==='match')renderMatch(t);else renderSequence(t);
    if(result) showFeedback(t,result,false);
    renderDots();persist();
  }
  function renderChoice(t) {
    const input=inputFor(t);if(!input.order)input.order=shuffle(t.options.map((_,i)=>i));
    const wrap=document.createElement('div');wrap.className='options';
    input.order.forEach((original,position)=>{
      const b=document.createElement('button');b.className='option';b.dataset.answer=original;
      b.innerHTML=`<span class="key">${String.fromCharCode(65+position)}</span><span>${t.options[original]}</span>`;
      if(taskLocked){b.disabled=true;if(original===t.answer){b.classList.add('correct');b.innerHTML+='<span class="answer-mark">✓ 正確答案</span>';}else if(original===input.choice){b.classList.add('wrong');b.innerHTML+='<span class="answer-mark">✕ 你的選擇</span>';}}
      b.onclick=()=>{if(taskLocked)return;input.choice=original;finishTask(original===t.answer,t);};wrap.appendChild(b);
    });$('#questionArea').appendChild(wrap);
  }
  function renderRapid(t) {
    const input=inputFor(t);input.rapid=input.rapid||[];input.rapidIndex=input.rapidIndex||0;
    const box=document.createElement('div');box.id='rapidBox';$('#questionArea').appendChild(box);
    if(taskLocked){box.innerHTML='<p class="helper">分類已完成，請閱讀下方逐項答案。</p>';return;}
    const i=input.rapidIndex,[label,answer]=t.items[i],selected=input.rapid[i];
    box.innerHTML=`<div class="rapid-item"><b>${label}</b><span>第 ${i+1} / ${t.items.length} 項・不計時</span></div><div class="options"></div>`;
    t.categories.forEach(category=>{
      const b=document.createElement('button');b.className='option';b.textContent=category;
      if(selected){b.disabled=true;if(category===answer){b.classList.add('correct');b.textContent+=' ✓ 正確';}else if(category===selected){b.classList.add('wrong');b.textContent+=' ✕ 你的選擇';}}
      b.onclick=()=>{if(input.rapid[i]||taskLocked)return;input.rapid[i]=category;tone(category===answer?'good':'bad');vibe(20);persist();renderTask();focusTop($('#rapidFeedback'));};box.querySelector('.options').appendChild(b);
    });
    if(selected){
      const fb=document.createElement('div');fb.id='rapidFeedback';fb.tabIndex=-1;fb.className='item-feedback';
      fb.innerHTML=`<strong>${selected===answer?'✓ 答對':'✕ 答錯，修正概念'}</strong><p>${label} → ${answer}</p><p>${t.explain}</p>`;
      const next=document.createElement('button');next.id='rapidNext';next.className='btn full';next.textContent=i===t.items.length-1?'查看本題總結':'下一個分類';
      next.onclick=()=>{if(i===t.items.length-1){const count=input.rapid.filter((v,j)=>v===t.items[j][1]).length;finishTask(count/t.items.length>=.7,t,`${count}/${t.items.length} 項正確`,count/t.items.length);}else{input.rapidIndex++;persist();renderTask();focusTop($('.prompt'));}};
      box.append(fb,next);
    }
  }
  function renderMatch(t) {
    const input=inputFor(t);input.matches=input.matches||t.items.map(()=>null);
    const wrap=document.createElement('div');wrap.className='matching';
    wrap.innerHTML='<p class="helper">先選一個項目，再點對應功能。可重新選擇修改，全部配好再送出。</p><div class="match-items"></div><p id="matchInstruction" class="helper" role="status">請先選擇項目</p><div class="match-targets"></div>';
    t.items.forEach(([label],i)=>{
      const b=document.createElement('button');b.className='match-item';b.dataset.match=i;b.disabled=taskLocked;
      b.setAttribute('aria-pressed','false');b.innerHTML=`<strong>${label}</strong><span>${input.matches[i]||'尚未配對'}</span>`;
      b.onclick=()=>{matchSelected=i;wrap.querySelectorAll('.match-item').forEach(x=>{const selected=Number(x.dataset.match)===i;x.setAttribute('aria-pressed',String(selected));x.classList.toggle('selected',selected);});$('#matchInstruction').textContent=`已選「${label}」，請點選功能：`;wrap.querySelectorAll('.match-target').forEach(x=>x.disabled=false);};wrap.querySelector('.match-items').appendChild(b);
    });
    if(!input.matchOrder)input.matchOrder=shuffle([...t.categories]);
    input.matchOrder.forEach(category=>{
      const b=document.createElement('button');b.className='match-target';b.textContent=category;b.disabled=true;
      b.onclick=()=>{if(taskLocked||matchSelected===null)return;input.matches[matchSelected]=category;const next=input.matches.findIndex(v=>!v);persist();renderTask();(next<0?$('#submitMatch'):$(`[data-match="${next}"]`)).focus({preventScroll:true});};wrap.querySelector('.match-targets').appendChild(b);
    });
    const submit=document.createElement('button');submit.id='submitMatch';submit.className='btn full';submit.textContent='確認配對';submit.disabled=taskLocked||input.matches.some(v=>!v);
    submit.onclick=()=>{const count=input.matches.filter((v,i)=>v===t.items[i][1]).length;finishTask(count/t.items.length>=.7,t,`${count}/${t.items.length} 組正確`,count/t.items.length);};wrap.appendChild(submit);$('#questionArea').appendChild(wrap);
  }
  function renderSequence(t) {
    const input=inputFor(t);input.sequence=input.sequence||[];
    const wrap=document.createElement('div');wrap.innerHTML='<p class="helper">依順序點選步驟；可復原或重排，完成後再確認。</p>';
    const order=document.createElement('ol');order.className='seq-order';order.id='seqOrder';
    order.innerHTML=input.sequence.length?input.sequence.map(x=>`<li>${x}</li>`).join(''):'<li class="placeholder">尚未選擇步驟</li>';
    const options=document.createElement('div');options.className='sequence';
    // Stable within a question, so undo does not move the remaining targets.
    if(!input.sequenceOrder)input.sequenceOrder=shuffle([...t.items]);
    input.sequenceOrder.forEach(item=>{const b=document.createElement('button');b.className='seq-chip';b.textContent=item;b.disabled=taskLocked||input.sequence.includes(item);b.onclick=()=>{input.sequence.push(item);persist();renderTask();(input.sequence.length===t.answer.length?$('#submitSequence'):$('.seq-chip:not(:disabled)')).focus({preventScroll:true});};options.appendChild(b);});
    const actions=document.createElement('div');actions.className='action-row';
    for(const [label,fn,id] of [['復原一步',()=>input.sequence.pop(),'undoSequence'],['重新排列',()=>{input.sequence=[];},'clearSequence']]){const b=document.createElement('button');b.id=id;b.className='btn ghost';b.textContent=label;b.disabled=taskLocked||!input.sequence.length;b.onclick=()=>{fn();persist();renderTask();$('.seq-chip:not(:disabled)').focus({preventScroll:true});};actions.appendChild(b);}
    const submit=document.createElement('button');submit.id='submitSequence';submit.className='btn full';submit.textContent='確認順序';submit.disabled=taskLocked||input.sequence.length!==t.answer.length;submit.onclick=()=>finishTask(input.sequence.every((v,i)=>v===t.answer[i]),t);
    wrap.append(order,options,actions,submit);$('#questionArea').appendChild(wrap);
  }
  function answerHTML(t) {
    if(t.options) return `<p>${t.options[t.answer]}</p>`;
    if(t.type==='sequence') return `<ol>${t.answer.map(x=>`<li>${x}</li>`).join('')}</ol>`;
    return `<ul>${t.items.map(([label,answer])=>`<li>${label} → ${answer}</li>`).join('')}</ul>`;
  }
  function responseHTML(t) {
    const input=inputFor(t);
    if(t.options && input.choice!==undefined)return `<p class="your-answer">你的選擇：${t.options[input.choice]}</p>`;
    const choices=t.type==='rapid'?input.rapid:t.type==='match'?input.matches:null;
    if(choices?.length)return `<ul class="your-answer">${t.items.map(([label,answer],i)=>`<li>${choices[i]===answer?'✓':'✕'} ${label}：${choices[i]||'未作答'}${choices[i]===answer?'':` → 應為 ${answer}`}</li>`).join('')}</ul>`;
    if(t.type==='sequence' && input.sequence?.length)return `<p class="your-answer">你的順序：${input.sequence.join(' → ')}</p>`;
    return '';
  }
  function showFeedback(t,result,moveFocus) {
    const fb=$('#feedback');fb.className='feedback show '+(result.ok||result.preview?'':'bad');
    const label=result.preview?'解析預覽・不計分':result.ok?(result.ratio<1?'✓ 本題通過，仍有項目需修正':'✓ 答對，任務成功'):'✕ 答錯，修正概念再出發';
    fb.innerHTML=`<h3>${label}</h3>${result.extra?`<p>${esc(result.extra)}；分類／配對須達 70% 才通過本題。</p>`:''}${result.preview?'':responseHTML(t)}<h4>正確答案</h4>${answerHTML(t)}<h4>為什麼？</h4><p>${t.explain}</p><p class="knowledge">核心知識點｜${t.point}</p>${!result.ok&&!result.preview&&save.hearts===0?'<p>Energy 已歸零，仍可繼續完成練習。</p>':''}`;
    $('#hintBtn').hidden=true;$('#nextBtn').hidden=false;
    $('#nextBtn').textContent=taskIndex===stages[currentStage].tasks.length-1?'查看任務結果':'下一題';
    if(moveFocus)focusTop(fb);
  }
  function finishTask(ok,t,extra='',ratio=ok?1:0,preview=false) {
    if(taskLocked)return;
    taskLocked=true;run.results[taskIndex]={ok,extra,ratio,preview};
    if(!preview){
      if(ok){save.combo++;save.xp=Math.min(Number.MAX_SAFE_INTEGER,save.xp+100+Math.min(save.combo,10)*10);tone('good');vibe(25);burst(12);if(save.combo>=3)combo(save.combo);}
      else{save.combo=0;save.hearts=Math.max(0,save.hearts-1);tone('bad');vibe(45);}
      // One miss per task attempt; partial mistakes count even when the task passes.
      const missed=ratio<1,h=save.history[t.id]||{tries:0,misses:0};
      save.history[t.id]={ok:!missed,tries:h.tries+1,misses:h.misses+(missed?1:0),at:Date.now()};
      if(missed)save.wrong[t.point]=(save.wrong[t.point]||0)+1;
    }
    persist();renderTask();showFeedback(t,run.results[taskIndex],true);
  }
  function nextTask() {
    if(!run?.results[taskIndex])return;
    if(taskIndex<stages[currentStage].tasks.length-1){run.index=++taskIndex;persist();renderTask();focusTop($('.prompt'));}else finishStage();
  }
  function finishStage() {
    const s=stages[currentStage],results=run.results,complete=results.every(r=>r&&!r.preview),correct=results.filter(r=>r?.ok&&!r.preview).length;
    const score=Math.round(correct/s.tasks.length*100);
    if(complete){save.scores[s.id]=Math.max(score,save.scores[s.id]||0);save.latest[s.id]=score;if(score>=70&&!save.demo)save.unlocked=Math.max(save.unlocked,Math.min(stages.length,currentStage+2));}
    save.run=null;persist();$('#questionCard').hidden=true;
    const result=$('#resultPanel');result.className='result active';
    result.innerHTML=`<div class="rank-badge" style="--degree:${complete?score*3.6:0}deg"><strong>${complete?(score>=90?'S':score>=80?'A':score>=70?'B':'C'):'展示'}</strong></div><h2>${!complete?'展示瀏覽完成':score>=70?'區域守備成功':'再練習，穩固防線'}</h2><p>${s.title}｜${complete?`本次成績 ${score}%・最佳 ${save.scores[s.id]}%`:'未完整作答，不計入任務成績'}</p><div class="result-grid"><div><b>${correct}/${s.tasks.length}</b><span>本次通過題數</span></div><div><b>${save.xp}</b><span>${save.demo?'展示':'累積'} XP</span></div><div><b>${save.attempts[s.id]}</b><span>挑戰次數</span></div></div><p>${save.demo?'展示資料僅供本次操作，不改變學生紀錄。':score>=70?(currentStage===stages.length-1?'七區皆已解鎖，可從雷達安排複習。':`已解鎖「${stages[currentStage+1].title}」。`):'整區至少通過 4/5 題，即達到 70% 解鎖門檻。'}</p><div class="review">${s.tasks.map((t,i)=>`<details class="review-item"><summary>${!results[i]?'未作答':results[i].preview?'解析預覽':results[i].ok?'✓ 通過':'✕ 待練習'}｜${t.point}</summary><h4>正確答案</h4>${answerHTML(t)}<p>${t.explain}</p></details>`).join('')}</div><div class="action-row"><button class="btn ghost" id="retryStage">再挑戰</button><button class="btn" id="returnMap">返回地圖</button></div><button class="btn ghost full" id="resultRadar">查看雷達與複習建議</button>${complete?'<section class="extension-card"><span class="kicker">課後延伸・自由挑戰</span><h3>準備迎戰五大 BOSS？</h3><p>免疫守衛戰提供綜合複習與考前連戰，獨立計分，不影響本教具的任務進度。</p><a id="bossChallenge" class="btn ghost full" href="./index.html">挑戰 BOSS 連戰</a></section>':''}`;
    $('#retryStage').onclick=()=>startStage(currentStage);$('#returnMap').onclick=()=>showView('homeView');$('#resultRadar').onclick=()=>showView('reportView');
    if(complete&&score>=70){burst(20);tone('level');}focusTop(result);
  }
  function renderReport() {
    const vals=stages.map(s=>save.scores[s.id]||0);
    const weak=allTasks.filter(t=>save.history[t.id]?.ok===false).sort((a,b)=>save.history[b.id].misses-save.history[a.id].misses);
    let html=`<section class="report-card"><h3>${save.demo?'展示操作的知識雷達':'整體學習進度'}</h3><p>七區平均最佳成績 <strong>${mastery()}%</strong>・通過 ${vals.filter(v=>v>=70).length}/7 區</p><div class="progress-track"><i style="width:${mastery()}%"></i></div><p class="helper">尚未完成整區以 0% 計算；最佳成績不代表目前所有知識皆精熟。下方另列最近需修正的知識點。</p>${save.demo?'<p class="mode-note">僅顯示本次展示作答，重新載入即清空；學生紀錄保持原狀。可先操作代表題型，再回來查看變化。</p>':''}</section><section class="report-card"><h3>下一步：${weak.length?'先修正最近錯誤':'完成未完成任務，或回顧已練習內容'}</h3>`;
    html+=weak.length?weak.slice(0,6).map(t=>{const i=stages.findIndex(s=>s.tasks.includes(t));return `<div class="review-item"><strong>${t.point}</strong><p>最近作答仍有錯誤・累計 ${save.history[t.id].misses} 次需修正</p><div class="action-row"><button class="btn ghost small" data-review-task="${t.id}">回看解析</button><button class="btn small" data-practice="${i}">重練${stages[i].title}</button></div></div>`;}).join(''):'<p>尚無待修正題目；可從下列未完成任務開始。</p>';
    html+='</section><section class="report-card"><h3>七大知識領域</h3>';
    stages.forEach((s,i)=>{
      const best=save.scores[s.id]||0,latest=save.latest[s.id],answered=s.tasks.filter(t=>save.history[t.id]).length;
      html+=`<div class="domain"><div class="mastery"><strong>${s.title}</strong><div class="mastery-track"><i style="width:${best}%"></i></div><b>${best}%</b></div><p>${answered}/5 題已練習・${latest===undefined?'尚無本版整區成績':`最近成績 ${latest}%`}・${best>=70?'已通過':unlocked(i)?'待完成':'未解鎖'}</p><div class="action-row"><button class="btn small" data-practice="${i}" ${unlocked(i)?'':`aria-disabled="true"`}>${save.run?.stage===i?'接續任務':best>=70?'重新挑戰':'前往任務'}</button><button class="btn ghost small" data-review-stage="${i}" ${answered||save.demo?'':'disabled'}>回看解析</button></div></div>`;
    });
    html+='</section><section class="report-card"><h3>累計常錯知識點</h3><p class="helper">每次題目中出現錯誤計 1 次；歷史次數保留，答對後會移出上方待修正清單。</p>';
    const errors=Object.entries(save.wrong).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,6);
    html+=errors.length?errors.map(([point,n])=>`<p>${esc(point)}：${n} 次</p>`).join(''):'<p>尚無錯題紀錄。</p>';
    $('#reportContent').innerHTML=html+'</section>';
    $$('#reportContent [data-practice]').forEach(b=>b.onclick=()=>startStage(Number(b.dataset.practice)));
    $$('#reportContent [data-review-task]').forEach(b=>b.onclick=()=>openReview([allTasks.find(t=>t.id===b.dataset.reviewTask)]));
    $$('#reportContent [data-review-stage]').forEach(b=>b.onclick=()=>openReview(stages[Number(b.dataset.reviewStage)].tasks.filter(t=>save.demo||save.history[t.id])));
  }
  function openReview(tasks) {
    $('#reviewContent').innerHTML=tasks.map(t=>`<section class="review-item"><h3>${t.point}</h3><p>${t.prompt}</p><h4>正確答案</h4>${answerHTML(t)}<h4>為什麼？</h4><p>${t.explain}</p></section>`).join('');
    $('#reviewDialog').showModal();$('#reviewDialog').scrollTop=0;
  }
  function showHint() { const h=$('#hintBox');h.textContent='提示｜'+task().hint;const shown=h.classList.toggle('show');$('#hintBtn').setAttribute('aria-expanded',String(shown)); }
  function shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  function combo(n) { if(reducedMotion())return;const p=$('#comboPop');p.textContent=`COMBO ×${n}`;p.classList.remove('show');void p.offsetWidth;p.classList.add('show'); }
  function burst(n=12) {
    if(reducedMotion())return;
    cancelAnimationFrame(animationFrame);
    const c=$('#fx'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1;if(!ctx)return;
    c.width=innerWidth*dpr;c.height=100*dpr;ctx.scale(dpr,dpr);
    const ps=Array.from({length:n},(_,i)=>({x:innerWidth/2,y:10,vx:(Math.random()-.5)*6,vy:Math.random()*2,s:3,c:['#38e8ff','#39f0c4','#b8ff68'][i%3]}));
    let frame=0;(function draw(){ctx.clearRect(0,0,innerWidth,100);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;ctx.globalAlpha=1-frame/30;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s);});ctx.globalAlpha=1;if(++frame<30)animationFrame=requestAnimationFrame(draw);else ctx.clearRect(0,0,innerWidth,100);})();
  }
  $$('.nav-btn').forEach(b=>b.onclick=()=>showView(b.dataset.view));
  $('#continueBtn').onclick=()=>startStage(save.run?.stage??(suggestedStage()<0?0:suggestedStage()));
  $('#teacherBtn').onclick=()=>setDemo(!save.demo);$('#exitDemoBtn').onclick=()=>setDemo(false);
  $('#consultBtn').onclick=()=>showView('consultView');$('#consultMapBtn').onclick=()=>showView('homeView');
  $('#backBtn').onclick=()=>{persist();showView('homeView');};$('#nextBtn').onclick=nextTask;$('#hintBtn').onclick=showHint;
  $('#demoTaskSelect').onchange=e=>{if(!save.demo)return;run.index=taskIndex=Number(e.target.value);renderTask();focusTop($('.prompt'));};
  $('#previewAnswerBtn').onclick=()=>{if(!save.demo)return;if(taskLocked)focusTop($('#feedback'));else finishTask(false,task(),'',0,true);};
  for(const [id,key] of [['soundSwitch','sound'],['vibrateSwitch','vibrate']])$('#'+id).onclick=()=>{studentSave[key]=!studentSave[key];persist();syncSettings();};
  $('#demoSwitch').onclick=()=>setDemo(!save.demo);
  $('#resetBtn').onclick=()=>{
    if(save.demo)return;
    if(confirm('確定清除此瀏覽器的所有學生 XP、成績、錯題與未完成任務？此操作無法復原。音效與震動設定會保留。')){
      const {sound,vibrate}=studentSave;studentSave={...freshSave(),sound,vibrate};save=studentSave;run=null;demoSave={...freshSave(),demo:true};persist();syncSettings();renderMap();toast('學生學習紀錄已清除');
    }
  };
  $('#closeReviewBtn').onclick=()=>$('#reviewDialog').close();
  // A second tab can update/reset progress. Adopt it before this tab writes again.
  window.addEventListener('storage',e=>{
    if(e.key!==KEY&&e.key!==null)return;
    studentSave=loadSave();save=studentSave.demo?demoSave:studentSave;run=save.run;
    if($('#reviewDialog').open)$('#reviewDialog').close();syncSettings();notice();showView('homeView');toast('另一個分頁已更新紀錄，已同步最新進度。');
  });
  $('#taskCount').textContent=allTasks.length;syncSettings();notice();updateStats();renderMap();
  // Optional return from the separate Boss game; keep student progress intact.
  const openLinkedReport=()=>{if(location.hash==='#report')showView('reportView');};
  window.addEventListener('hashchange',openLinkedReport);openLinkedReport();
})();

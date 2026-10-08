/* Presentation only: navigation, scoring and saving never await an animation. */
window.ImmuneRushEffects=(()=>{
  'use strict';
  let active=null, serial=0;
  const allowed=()=>window.ImmuneRushAtmosphere.motionAllowed()&&!document.hidden;
  const symbols=[
    '<path class="fx-trace" d="M32 10 49 17v15c0 11-9 19-17 23-8-4-17-12-17-23V17Z"/><path class="fx-detail" d="m23 32 6 6 13-14"/>',
    '<circle class="fx-trace" cx="32" cy="32" r="19"/><path class="fx-detail" d="M23 26c9-12 20 3 12 8s-16 3-12-8Z"/><circle class="fx-node" cx="12" cy="14" r="3"/><circle class="fx-node" cx="53" cy="23" r="3"/><circle class="fx-node" cx="45" cy="54" r="3"/>',
    '<path class="fx-trace" d="M14 26a20 20 0 0 1 36-5l3 7m-12-3 12 3 2-12M50 38a20 20 0 0 1-36 5l-3-7m12 3-12-3-2 12"/><path class="fx-detail" d="m32 22 3 7 8 3-8 3-3 7-3-7-8-3 8-3Z"/>',
    '<path class="fx-trace" d="M32 54V32L15 15M32 32l17-17"/><path class="fx-detail" d="m10 19 9-9m26 0 9 9"/><circle class="fx-node" cx="10" cy="10" r="3"/><circle class="fx-node" cx="54" cy="10" r="3"/>',
    '<path class="fx-trace" d="M32 9S14 29 14 39a18 18 0 0 0 36 0C50 29 32 9 32 9Z"/><path class="fx-detail" d="m23 39 6 6 13-14"/>',
    '<path class="fx-trace" d="m13 18 19-7 19 14-3 23-24 6-14-19Z"/><circle class="fx-node" cx="13" cy="18" r="4"/><circle class="fx-node" cx="32" cy="11" r="4"/><circle class="fx-node" cx="51" cy="25" r="4"/><circle class="fx-node" cx="48" cy="48" r="4"/><circle class="fx-node" cx="24" cy="54" r="4"/><circle class="fx-node" cx="10" cy="35" r="4"/><circle class="fx-detail" cx="32" cy="32" r="7"/>',
    '<path class="fx-trace" d="M11 12v14l14 9m28-23v14l-14 9M11 52V42l14-9m28 19V42l-14-9"/><path class="fx-detail" d="m32 23 9 9-9 9-9-9Z"/><circle class="fx-node" cx="32" cy="12" r="3"/>'
  ];
  function badge(stage,state='correct'){
    const mark=state==='wrong'?'<circle class="fx-trace" cx="32" cy="32" r="19"/><path class="fx-detail" d="m25 25 14 14m0-14L25 39"/>':state==='preview'?'<path class="fx-trace" d="M12 17q10-5 20 2 10-7 20-2v31q-10-5-20 2-10-7-20-2Z"/><path class="fx-detail" d="M32 19v31"/>':symbols[stage]||symbols[0];
    return `<svg viewBox="0 0 64 64" class="learning-emblem emblem-${stage}" data-feedback-state="${state}" focusable="false"><circle class="fx-orbit" cx="32" cy="32" r="29"/>${mark}</svg>`;
  }
  function clear(){const old=active;active=null;if(!old)return;old.animations.forEach(a=>a.cancel());old.badge?.classList.remove('is-celebrating');old.ghost?.remove();}
  // Capture the real campus before switching views. The inert copy has its own SVG IDs.
  function captureMap(stage){
    if(!allowed())return null;
    const map=document.querySelector('#homeView.active #stageMap.is-base');
    const target=map?.querySelector(`[data-stage="${stage}"] .facility-art`);
    if(!map||!target)return null;
    const r=map.getBoundingClientRect(),t=target.getBoundingClientRect();
    if(!t.width||t.bottom<50||t.top>innerHeight)return null;
    const copy=map.cloneNode(true),prefix=`transit-${++serial}-`,ids=new Map();
    for(const el of [copy,...copy.querySelectorAll('[id]')])if(el.id){ids.set(el.id,prefix+el.id);el.id=prefix+el.id;}
    for(const el of [copy,...copy.querySelectorAll('*')]){
      for(const attr of [...el.attributes]){
        let value=attr.value;
        for(const [id,next] of ids)value=value.replaceAll(`url(#${id})`,`url(#${next})`);
        if((attr.name==='href'||attr.name==='xlink:href')&&ids.has(value.slice(1)))value='#'+ids.get(value.slice(1));
        if(value!==attr.value)el.setAttribute(attr.name,value);
      }
      if(el.matches('button,a,input,select'))el.tabIndex=-1;
    }
    copy.inert=true;copy.removeAttribute('aria-describedby');copy.classList.add('transit-campus');
    copy.querySelector(`[data-stage="${stage}"]`).classList.add('transit-target');
    for(const card of copy.querySelectorAll('[data-stage]')){
      card.style.gridArea=getComputedStyle(map.querySelector(`[data-stage="${card.dataset.stage}"]`)).gridArea;
      card.removeAttribute('data-stage');
    }
    Object.assign(copy.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});
    return {copy,x:t.x+t.width/2,y:t.y+t.height/2};
  }
  function travel(stage,snapshot,returning=false){
    clear();if(!allowed()||!Element.prototype.animate)return;
    const ghost=document.createElement('div');ghost.className='mission-transit';ghost.setAttribute('aria-hidden','true');ghost.inert=true;
    const camera=document.createElement('div');camera.className='transit-camera';
    if(snapshot)camera.appendChild(snapshot.copy);
    else ghost.classList.add('transit-brief');
    const hud=document.createElement('div');hud.className='transit-hud';
    const label=document.createElement('span');label.textContent=returning?'返回免疫基地':`任務 ${String(stage+1).padStart(2,'0')}・防線部署`;
    const title=document.createElement('strong');title.textContent=returning?'重新整備':window.ImmuneRushData.stages[stage].title;
    hud.append(label,title);ghost.append(camera,hud);document.body.appendChild(ghost);
    const duration=snapshot?(returning?540:780):360;
    const animations=[];
    if(snapshot){
      camera.style.transformOrigin=`${snapshot.x}px ${snapshot.y}px`;
      for(const info of camera.querySelectorAll('.stage-info,.base-boss-gate strong,.base-boss-gate>span:last-child')){
        animations.push(info.animate(returning?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration:returning?440:220,fill:'both'}));
      }
      const close=`translate3d(${innerWidth/2-snapshot.x}px,${Math.min(innerHeight*.38,320)-snapshot.y}px,0) scale(2.35) rotate(-2deg)`;
      animations.push(camera.animate(returning?[
        {transform:close,opacity:.85},{transform:'none',opacity:1,offset:.8},{transform:'none',opacity:1}
      ]:[
        {transform:'none',opacity:1},{transform:'scale(1.035)',opacity:1,offset:.15},{transform:close,opacity:1}
      ],{duration,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'}));
    }
    animations.push(hud.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none',offset:.24},{opacity:1,transform:'none',offset:.65},{opacity:0,transform:'translateY(-6px)'}],{duration,fill:'both'}));
    // The last 30% reveals the ready question. No navigation, timer or score depends on this layer.
    const animation=ghost.animate(returning?[
      {opacity:0},{opacity:1,offset:.16},{opacity:1,offset:.65},{opacity:0}
    ]:[{opacity:1},{opacity:1,offset:.6},{opacity:0}],{duration,fill:'both'});
    animations.push(animation);const record=active={ghost,animations};
    animation.finished.then(()=>{if(active===record)clear();},()=>{});
  }
  function celebrate(){
    clear();const el=document.querySelector('#feedback .feedback-emblem');if(!el||!allowed()||!el.animate)return;
    el.classList.add('is-celebrating');
    const animation=el.animate([{transform:'scale(.76) rotate(-12deg)'},{transform:'scale(1.12) rotate(5deg)',offset:.35},{transform:'scale(1) rotate(0)'}],{duration:950,easing:'ease-out'});
    const record=active={badge:el,animations:[animation]};animation.finished.then(()=>{if(active===record)clear();},()=>{});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  window.addEventListener('pagehide',clear);
  window.addEventListener('resize',clear);
  return {badge,captureMap,travel,celebrate,clear,cancelIfReduced(){if(!allowed())clear();}};
})();

/* Presentation only: navigation, scoring and saving never await an animation. */
window.ImmuneRushEffects=(()=>{
  'use strict';
  let active=null;
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
  function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return r.width&&r.height&&r.bottom>100&&r.top<innerHeight?{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width}:null;}
  function travel(stage,from,to,returning=false){
    clear();if(!allowed()||!Element.prototype.animate)return;
    const end=to||{x:innerWidth/2,y:180,width:82},start=from||{x:innerWidth/2,y:220,width:116};
    const ghost=document.createElement('div');ghost.className='mission-transit';ghost.setAttribute('aria-hidden','true');
    ghost.innerHTML=`<div class="transit-orbit"></div>${window.ImmuneRushBase.facility(stage)}`;document.body.appendChild(ghost);
    const center={x:innerWidth/2,y:Math.min(innerHeight*.39,340)};
    const pose=(p,scale,angle)=>`translate3d(${p.x-80}px,${p.y-70}px,0) scale(${scale}) rotate(${angle}deg)`;
    const frames=returning?[
      {transform:pose(start,start.width/160,0),opacity:0},
      {transform:pose(center,1.1,10),opacity:.88,offset:.4},
      {transform:pose(end,end.width/160,-4),opacity:0}
    ]:[
      {transform:pose(start,start.width/160,-7),opacity:.2},
      {transform:pose(center,1.25,9),opacity:.96,offset:.42},
      {transform:pose(end,end.width/160,0),opacity:0}
    ];
    const animation=ghost.animate(frames,{duration:returning?560:740,easing:'ease-in-out'});
    const record=active={ghost,animations:[animation]};animation.finished.then(()=>{if(active===record)clear();},()=>{});
  }
  function celebrate(){
    clear();const el=document.querySelector('#feedback .feedback-emblem');if(!el||!allowed()||!el.animate)return;
    el.classList.add('is-celebrating');
    const animation=el.animate([{transform:'scale(.76) rotate(-12deg)'},{transform:'scale(1.12) rotate(5deg)',offset:.35},{transform:'scale(1) rotate(0)'}],{duration:950,easing:'ease-out'});
    const record=active={badge:el,animations:[animation]};animation.finished.then(()=>{if(active===record)clear();},()=>{});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  window.addEventListener('pagehide',clear);
  return {badge,rect,travel,celebrate,clear,cancelIfReduced(){if(!allowed())clear();}};
})();

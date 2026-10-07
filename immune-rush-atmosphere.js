/* Quiet, original mission-base soundscape and presentation preferences. */
window.ImmuneRushAtmosphere=(()=>{
  'use strict';
  const KEY='immuneRushAtmosphere',query=matchMedia('(prefers-reduced-motion: reduce)');
  let prefs={music:false,motion:true},view='homeView',context,master,timer=0,beat=0,next=0,revision=0,ducked=false;
  const voices=new Set();
  function read(){try{const raw=JSON.parse(localStorage.getItem(KEY));for(const k of ['music','motion'])if(typeof raw?.[k]==='boolean')prefs[k]=raw[k];}catch{}}
  function store(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}}
  const allowed=()=>prefs.motion&&!query.matches;
  const wanted=()=>prefs.music&&!document.hidden&&['homeView','gameView'].includes(view);
  function paint(){
    document.documentElement.classList.toggle('rush-motion-off',!allowed());
    document.documentElement.classList.toggle('rush-background',document.hidden);
    document.querySelectorAll('[data-rush-music]').forEach(b=>{b.setAttribute('aria-pressed',String(prefs.music));b.setAttribute('aria-label','基地音樂：'+(prefs.music?'開':'關'));b.title=b.getAttribute('aria-label');b.classList.toggle('enabled',prefs.music);});
    document.querySelectorAll('[data-rush-motion]').forEach(b=>{b.setAttribute('aria-pressed',String(allowed()));b.setAttribute('aria-label',query.matches?'基地動態：依系統減少':'基地動態：'+(allowed()?'開':'關'));b.title=b.getAttribute('aria-label');b.disabled=query.matches;b.classList.toggle('enabled',allowed());});
    for(const [id,k] of [['musicSwitch','music'],['motionSwitch','motion']]){const b=document.getElementById(id);if(b){const value=k==='motion'?allowed():prefs[k];b.classList.toggle('on',value);b.setAttribute('aria-checked',String(value));b.disabled=k==='motion'&&query.matches;}}
  }
  function stop(){clearInterval(timer);timer=0;for(const v of voices){try{v.stop();}catch{}}voices.clear();}
  function note(midi,time,duration,level){const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(level,time+.08);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(master);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(time);o.stop(time+duration+.02);}
  function schedule(){if(!wanted()||context.state!=='running')return;if(next<context.currentTime-.2)next=context.currentTime+.04;while(next<context.currentTime+.15){const root=[48,45,41,43][Math.floor(beat/16)%4];note(root+24+[0,7,12,7,4,7,14,12][beat%8],next,.9,.12);if(beat%8===0){note(root,next,2.8,.18);note(root+7,next,2.5,.06);}beat++;next+=60/84/2;}}
  async function sync(){const token=++revision;if(!wanted()){stop();if(context?.state==='running')try{await context.suspend();}catch{}return;}try{if(!context){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;context=new C();master=context.createGain();master.gain.value=ducked?.025:.09;master.connect(context.destination);}await context.resume();if(token!==revision||!wanted())return;if(!timer){next=context.currentTime+.04;schedule();timer=setInterval(schedule,40);}}catch{stop();}}
  function toggle(k){prefs[k]=!prefs[k];store();paint();if(k==='music')sync();}
  read();paint();
  document.querySelectorAll('[data-rush-music]').forEach(b=>b.onclick=()=>toggle('music'));
  document.querySelectorAll('[data-rush-motion]').forEach(b=>b.onclick=()=>toggle('motion'));
  document.getElementById('musicSwitch').onclick=()=>toggle('music');document.getElementById('motionSwitch').onclick=()=>toggle('motion');
  query.addEventListener('change',paint);document.addEventListener('visibilitychange',()=>{paint();sync();});
  window.addEventListener('pagehide',()=>{stop();if(context)context.suspend().catch(()=>{});});window.addEventListener('pageshow',()=>{if(context)sync();});
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){prefs={music:false,motion:true};read();paint();sync();}});
  return {motionAllowed:allowed,setView(id){view=id;if(id!=='gameView'){ducked=false;if(master)master.gain.setTargetAtTime(.09,context.currentTime,.2);}paint();sync();},duck(value){ducked=value;if(master)master.gain.setTargetAtTime(value?.025:.09,context.currentTime,.2);}};
})();

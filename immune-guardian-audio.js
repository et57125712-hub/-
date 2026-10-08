/* Original procedural synth score. No external tracks, downloads or services. */
window.ImmuneGuardianAudio = (() => {
  'use strict';
  let context,master,noise,timer=0,next=0,step=0,stage=1,active=false,enabled=true,ducked=false,revision=0,intensity=0;
  const voices=new Set(),hits=new Set();
  let onChange=()=>{};
  const wanted=()=>active&&enabled&&!document.hidden;
  const volume=()=>ducked?.032:.12;
  const notify=()=>onChange({enabled,playing:!!context&&context.state==='running'&&wanted()});
  const frequency=midi=>440*Math.pow(2,(midi-69)/12);
  function voice(source,time,duration,level){
    const gain=context.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    source.connect(gain);gain.connect(master);voices.add(source);
    source.onended=()=>{voices.delete(source);hits.delete(source);source.disconnect();gain.disconnect();};source.start(time);source.stop(time+duration+.02);return source;
  }
  function note(midi,time,duration,level,type='triangle'){const source=context.createOscillator();source.type=type;source.frequency.value=frequency(midi);return voice(source,time,duration,level);}
  function percussion(time,kick=false,snare=false){
    if(kick){const source=context.createOscillator();source.frequency.setValueAtTime(120,time);source.frequency.exponentialRampToValueAtTime(42,time+.15);voice(source,time,.16,.55);return source;}
    else{const source=context.createBufferSource();source.buffer=noise;const filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=snare?1300:7000;
      const gain=context.createGain();gain.gain.setValueAtTime(snare?.2:.07,time);gain.gain.exponentialRampToValueAtTime(.0001,time+(snare?.12:.045));source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);hits.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(time);source.stop(time+.15);return source;}
  }
  function schedule(){
    if(!wanted()||context.state!=='running')return;
    if(next<context.currentTime-.2)next=context.currentTime+.03;
    while(next<context.currentTime+.12){
      const beat=step%16,chord=Math.floor(step/32)%4,root=[45,41,48,43][chord],third=chord===0?3:4;
      // Syncopated bass, a clear backbeat and denser hi-hats build urgency without more volume.
      if([0,3,6,8,10,14].includes(beat))note(root+(beat===14?12:0),next,.11,.2,'triangle');
      const arp=[0,7,12,third+12,7,12,19,12];
      if(step%2===0||stage>=3)note(root+24+arp[step%8],next,.085,step%2?.045:.075);
      if(step%32===0)[0,third,7].forEach(n=>note(root+12+n,next,2.1,.035,'sine'));
      if([0,6,8].includes(beat)||stage>=4&&beat===10)percussion(next,true);
      if(beat===4||beat===12)percussion(next,false,true);
      if(step%2===0||stage>=4)percussion(next);
      step++;next+=60/(132+(stage-1)*4+intensity)/4;
    }
  }
  function clearHit(){for(const source of hits){try{source.stop();}catch{}}hits.clear();}
  function hit({correct,combo=0,form=0,evolved=false,defeated=false}){
    intensity=correct?Math.min(6,Math.floor(combo/3)):0;
    if(!wanted()||!context||context.state!=='running'||ducked)return;
    clearHit();const t=context.currentTime+.008;
    // Short charge then a bass/noise impact aligns with the on-screen contact at 230ms.
    const charge=context.createOscillator();charge.type='triangle';charge.frequency.setValueAtTime(correct?220:360,t);charge.frequency.exponentialRampToValueAtTime(correct?880:100,t+.18);hits.add(voice(charge,t,.2,.2));
    hits.add(percussion(t+.23,true));hits.add(percussion(t+.23,false,true));
    hits.add(note(correct?57:33,t+.23,.18,.22,'triangle'));
    if(correct)hits.add(note(76+Math.max(0,Math.min(5,form))*2,t+.25,.1,.13,'sine'));
    if(evolved||defeated)[0,7,12].forEach((n,i)=>hits.add(note((defeated?69:62)+n,t+.32+i*.055,.22,.1,'triangle')));
  }
  function silence(){clearInterval(timer);timer=0;for(const voice of voices){try{voice.stop();}catch{}}voices.clear();hits.clear();}
  async function sync(){
    const token=++revision;
    if(!wanted()){silence();if(context&&context.state==='running')try{await context.suspend();}catch{}notify();return;}
    try{
      if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');context=new Audio();master=context.createGain();master.gain.value=volume();master.connect(context.destination);noise=context.createBuffer(1,context.sampleRate*.2,context.sampleRate);const channel=noise.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=Math.random()*2-1;context.onstatechange=notify;}
      await context.resume();if(token!==revision||!wanted()){if(!wanted())silence();return;}
      master.gain.setTargetAtTime(volume(),context.currentTime,.12);
      if(!timer){next=context.currentTime+.03;schedule();timer=setInterval(schedule,25);}notify();
    }catch{silence();notify();}
  }
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',()=>{silence();if(context)context.suspend().catch(()=>{});});
  window.addEventListener('pageshow',sync);
  return {
    configure(value,callback){enabled=value;onChange=callback;notify();},
    start(value=1){stage=value;active=true;step=0;intensity=0;ducked=false;return sync();},
    stop(){active=false;return sync();},
    setStage(value){stage=Math.max(1,Math.min(5,value));},
    setEnabled(value){enabled=value;return sync();},
    hit,
    duck(value){ducked=value;if(value)clearHit();if(master)master.gain.setTargetAtTime(volume(),context.currentTime,.12);}
  };
})();

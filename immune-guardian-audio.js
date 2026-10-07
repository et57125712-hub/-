/* Original procedural synth score. No external tracks, downloads or services. */
window.ImmuneGuardianAudio = (() => {
  'use strict';
  let context,master,noise,timer=0,next=0,step=0,stage=1,active=false,enabled=true,ducked=false,revision=0;
  const voices=new Set();
  let onChange=()=>{};
  const wanted=()=>active&&enabled&&!document.hidden;
  const volume=()=>ducked?.032:.12;
  const notify=()=>onChange({enabled,playing:!!context&&context.state==='running'&&wanted()});
  const frequency=midi=>440*Math.pow(2,(midi-69)/12);
  function voice(source,time,duration,level){
    const gain=context.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    source.connect(gain);gain.connect(master);voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();gain.disconnect();};source.start(time);source.stop(time+duration+.02);return source;
  }
  function note(midi,time,duration,level,type='triangle'){const source=context.createOscillator();source.type=type;source.frequency.value=frequency(midi);voice(source,time,duration,level);}
  function percussion(time,kick=false,snare=false){
    if(kick){const source=context.createOscillator();source.frequency.setValueAtTime(120,time);source.frequency.exponentialRampToValueAtTime(42,time+.15);voice(source,time,.19,.6);}
    else{const source=context.createBufferSource();source.buffer=noise;const filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=snare?1300:7000;
      const gain=context.createGain();gain.gain.setValueAtTime(snare?.2:.07,time);gain.gain.exponentialRampToValueAtTime(.0001,time+(snare?.12:.045));source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(time);source.stop(time+.15);}
  }
  function schedule(){
    if(!wanted()||context.state!=='running')return;
    if(next<context.currentTime-.2)next=context.currentTime+.03;
    while(next<context.currentTime+.12){
      const chord=Math.floor(step/32)%4,root=[45,41,48,43][chord]+[0,0,2,5,7][stage-1],third=chord===0?3:4;
      if(step%2===0)note(root+(step%8===6?12:0),next,.16,.25,'sawtooth');
      const arp=[0,7,12,third+12,7,12,19,12];note(root+24+arp[step%8],next,.15,step%2?.06:.1);
      if(step%32===0)[0,third,7].forEach(n=>note(root+12+n,next,3.7,.045,'sine'));
      if(step%4===0)percussion(next,true);if(step%8===4)percussion(next,false,true);if(step%2===0)percussion(next);
      step++;next+=60/(112+(stage-1)*3)/4;
    }
  }
  function silence(){clearInterval(timer);timer=0;for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
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
    start(value=1){stage=value;active=true;step=0;return sync();},
    stop(){active=false;return sync();},
    setStage(value){stage=Math.max(1,Math.min(5,value));},
    setEnabled(value){enabled=value;return sync();},
    duck(value){ducked=value;if(master)master.gain.setTargetAtTime(volume(),context.currentTime,.12);}
  };
})();

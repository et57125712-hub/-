/* Lightweight isometric artwork. Learning data and scoring remain in the original app. */
window.ImmuneRushBase = (() => {
  'use strict';
  const facilities=['防線城門','免疫部隊基地','記憶資料塔','抗體工坊','血型檢驗站','補體反應站','MHC 指揮中心'];
  // One isometric projection for walls, glazing, parapets and roof equipment.
  const point=(x,y,u,v,z=0)=>`${(x+(u-v)*.86).toFixed(1)},${(y+(u+v)*.46-z).toFixed(1)}`;
  function block(x,y,w,d,h,glazed=false) {
    const p=(u,v,z)=>point(x,y,u,v,z);
    let out=`<polygon class="wall-left" points="${p(0,d,0)} ${p(w,d,0)} ${p(w,d,h)} ${p(0,d,h)}"/><polygon class="wall-right" points="${p(w,0,0)} ${p(w,d,0)} ${p(w,d,h)} ${p(w,0,h)}"/>`;
    if(h>14){
      out+=`<polygon class="facade-glass" points="${p(3,d,h-7)} ${p(w-3,d,h-7)} ${p(w-3,d,7)} ${p(3,d,7)}"/><polygon class="facade-glass shade" points="${p(w,3,h-7)} ${p(w,d-3,h-7)} ${p(w,d-3,7)} ${p(w,3,7)}"/>`;
      for(let z=glazed?13:h-12;z<h-7;z+=10)out+=`<path class="facade-floor" d="M${p(3,d,z)}L${p(w-3,d,z)} M${p(w,3,z)}L${p(w,d-3,z)}"/>`;
      for(let u=9;u<w-3;u+=10)out+=`<path class="facade-mullion" d="M${p(u,d,7)}L${p(u,d,h-7)}"/>`;
      out+=`<path class="glass-reflection" d="M${p(5,d,h-9)}L${p(Math.min(w-5,17),d,9)}"/>`;
    }
    out+=`<polygon class="roof" points="${p(0,0,h)} ${p(w,0,h)} ${p(w,d,h)} ${p(0,d,h)}"/><polygon class="roof-inset" points="${p(3,3,h+.4)} ${p(w-3,3,h+.4)} ${p(w-3,d-3,h+.4)} ${p(3,d-3,h+.4)}"/><path class="architectural-edge" d="M${p(0,d,h)}L${p(w,d,h)}L${p(w,0,h)} M${p(w,d,h)}L${p(w,d,0)}"/><path class="plinth-edge" d="M${p(0,d,3)}L${p(w,d,3)}L${p(w,0,3)}"/>`;
    return out;
  }
  function tank(x,y) {
    return `<g class="blood-tank"><ellipse class="tank-foot" cx="${x}" cy="${y+3}" rx="15" ry="7"/><path class="tank-glass" d="M${x-12} ${y-35}v32c0 9 24 9 24 0v-32Z"/><path class="tank-fluid" d="M${x-9} ${y-19}v16c0 6 18 6 18 0v-16Z"/><ellipse class="tank-cap" cx="${x}" cy="${y-35}" rx="13" ry="6"/><ellipse class="tank-top" cx="${x}" cy="${y-37}" rx="10" ry="4"/><path class="tank-rail" d="M${x-12} ${y-33}v29m24-29v29M${x-6} ${y-29}v13"/><ellipse class="tank-band" cx="${x}" cy="${y-6}" rx="12" ry="5"/></g>`;
  }
  const platform='<ellipse class="facility-shadow" cx="88" cy="119" rx="66" ry="16"/><path class="pad-side" d="m10 94 70 32 70-32v9l-70 33-70-33Z"/><path class="pad-top" d="m10 94 70-33 70 33-70 32Z"/><path class="pad-court" d="m20 92 60-27 60 27-60 27Z"/><path class="paving-lines" d="m40 85 61 28M58 77l62 28M40 102l61-28M58 111l61-28"/><path class="pad-trim" d="m16 99 64 30 64-30"/><path class="pad-step" d="m68 120 12 6 16-8v5l-16 8-12-6Zm0 5 12 6 16-8v4l-16 8-12-6Z"/><path class="landing-light" d="m25 103 7 3m96 0 7-3"/>';
  const buildings=[
    // Twin security pylons and a deep, glazed canopy.
    block(53,78,18,22,53,true)+block(104,94,18,22,53,true)+block(53,38,77,15,10)+
      '<path class="gate-recess" d="m66 64 28 13v24L66 88Z"/><path class="gate-panel" d="m69 68 21 10v17L69 85Z"/><path class="gate-center" d="m79 73 0 17"/><path class="canopy-light window-strip base-ambient" d="m43 38 66 30"/><path class="roof-insignia" d="m77 40 9 4-5 3-9-4Z"/>',
    // Medical campus: two wings, tall central atrium and a rooftop medical cross.
    block(55,79,34,26,26)+block(102,93,31,23,27)+block(77,82,30,25,46,true)+block(76,42,31,26,5)+
      '<path class="roof-medical" d="m77 46 10 5m-1-6-8 8"/><path class="entry-canopy" d="m64 96 15-7 18 8-15 8Z"/><path class="entry-columns" d="M64 96v10m18-1v10"/><path class="window-strip base-ambient" d="m111 86 9-4m-80-2 10 5"/>',
    // Memory archive: three offset glass volumes and an illuminated data crown.
    block(71,89,43,32,24,true)+block(73,65,37,28,25,true)+block(75,40,31,24,22,true)+block(75,18,31,24,4)+
      '<path class="data-band base-ambient" d="m47 69 37 18 27-13m-59-28 32 15 23-11"/><path class="antenna" d="M79 20V7"/><circle class="beacon base-ambient" cx="79" cy="7" r="2.5"/>',
    // Antibody foundry: saw-tooth glazed roof instead of generic chimneys.
    block(58,81,65,32,30,true)+
      '<path class="saw-roof-shadow" d="m39 63 20-24 18 9-18 24Z m21 10 20-24 18 9-18 24Z m21 10 20-24 18 9-18 24Z"/><path class="saw-roof-glass" d="m39 63 20-24v25l-1 8Zm21 10 20-24v25l-1 8Zm21 10 20-24v25l-1 8Z"/><path class="saw-roof-rim" d="m39 63 20-24 18 9m-17 25 20-24 18 9m-17 25 20-24 18 9"/><path class="medical-mark forge-mark" d="m101 86 0 10m0-10-6-7m6 7 6-3"/>',
    // Blood typing laboratory: paired glass chambers and a central console.
    block(76,84,32,27,27,true)+tank(49,88)+tank(113,106)+
      '<path class="lab-pipe" d="M61 77 72 83V72m29 21-8-4V82"/><path class="roof-medical" d="m76 64 10 5m-1-6-8 8"/>',
    // Complement hub: stepped circular reactor, nested rings and three conduits.
    block(75,88,39,31,18)+
      '<path class="reactor-drum" d="M47 58v23c0 21 66 21 66 0V58Z"/><ellipse class="reactor-lower" cx="80" cy="82" rx="33" ry="16"/><ellipse class="reactor-shell" cx="80" cy="58" rx="33" ry="16"/><ellipse class="reactor-rim" cx="80" cy="55" rx="29" ry="13"/><ellipse class="reactor-well" cx="80" cy="55" rx="22" ry="10"/><ellipse class="reactor-core base-ambient" cx="80" cy="53" rx="13" ry="6"/><path class="reactor-struts" d="M48 60v19m17-11v21m31-21v21m16-29v19"/><path class="lab-pipe" d="M49 68 38 73v15m74-17 13 6v15M80 92v17"/><g class="beacon base-ambient"><circle cx="38" cy="88" r="2.5"/><circle cx="125" cy="92" r="2.5"/><circle cx="80" cy="109" r="2.5"/></g>',
    // Command centre: cantilevered observation deck over a tall glazed core.
    block(48,82,23,23,25,true)+block(105,98,23,22,26,true)+block(76,84,31,27,61,true)+block(71,40,45,35,14,true)+block(71,25,45,35,4)+
      '<path class="command-crown" d="m49 34 30 14 28-13"/><path class="antenna" d="M81 28V5m-6 8h12"/><circle class="beacon base-ambient" cx="81" cy="5" r="2"/>'
  ];
  let artSerial=0;
  function facility(i) {
    const id='facility-material-'+(++artSerial);
    // Per-instance gradient IDs avoid collisions between the map and mission thumbnail.
    const defs=`<defs><linearGradient id="${id}-roof" x2=".8" y2="1"><stop stop-color="#e3eef1"/><stop offset="1" stop-color="var(--roof,#adcbd9)"/></linearGradient><linearGradient id="${id}-left" x2="1" y2="1"><stop stop-color="var(--wall-left,#547b96)"/><stop offset="1" stop-color="#354f63"/></linearGradient><linearGradient id="${id}-right" x2="0" y2="1"><stop stop-color="var(--wall-right,#305471)"/><stop offset="1" stop-color="#142b40"/></linearGradient><linearGradient id="${id}-glass" x2="1" y2="1"><stop stop-color="#91c8d5"/><stop offset=".42" stop-color="#315f76"/><stop offset="1" stop-color="#163447"/></linearGradient><linearGradient id="${id}-tank"><stop stop-color="#243f58"/><stop offset=".4" stop-color="#96bbc5"/><stop offset=".65" stop-color="#507787"/><stop offset="1" stop-color="#183147"/></linearGradient></defs>`;
    return `<span class="facility-art" aria-hidden="true"><svg class="premium-facility" viewBox="0 0 160 140" focusable="false" style="--roof-paint:url(#${id}-roof);--left-paint:url(#${id}-left);--right-paint:url(#${id}-right);--glass-paint:url(#${id}-glass);--tank-paint:url(#${id}-tank)">${defs}${platform}<g class="building">${buildings[i]}</g><path class="facility-scan base-ambient" d="M36 91 81 69 124 91 81 112Z"/><circle class="facility-beacon base-ambient" cx="132" cy="110" r="3"/></svg></span>`;
  }
  // Distinct silhouettes and choreography; decorative defense metaphors, not a simulation.
  // Scene-level scale also shortens patrol paths, keeping units near buildings.
  // Each scene has its own shared CSS timeline. No timers, hit targets or scoring effects.
  const lifeArt={
    macrophage:`<g class="life-macrophage"><path class="macro-body" d="M-25-5C-30-19-10-25 0-20C14-27 21-14 20-5C29 7 15 21 2 20C-9 27-28 16-22 5Z"/><path class="macro-nucleus" d="M-11-8C2-16 8-5 0 0C-6 4 5 8-2 12C-14 14-20-1-11-8Z"/><g class="macro-vesicles"><circle cx="12" cy="-9" r="3"/><circle cx="13" cy="8" r="2.5"/><circle cx="-14" cy="12" r="2"/></g><g class="macro-arms base-ambient"><path d="M13-13Q42-31 44-8M16 14Q43 31 46 8"/></g></g>`,
    neutrophil:`<g class="life-neutrophil"><path class="neutro-body" d="M-18-8Q-12-24 3-19Q23-19 22-2Q27 16 9 20Q-10 26-20 10Q-26 0-18-8Z"/><path class="neutro-link" d="M-9-5 6-8 9 8"/><g class="neutro-nuclei"><ellipse cx="-9" cy="-4" rx="6" ry="8"/><ellipse cx="5" cy="-9" rx="7" ry="5"/><ellipse cx="9" cy="7" rx="6" ry="7"/></g><g class="neutro-granules"><circle cx="-13" cy="9" r="1.5"/><circle cx="-3" cy="13" r="1.5"/><circle cx="15" cy="-3" r="1.5"/><circle cx="-3" cy="-16" r="1.5"/></g></g>`,
    bacillus:`<g class="life-bacillus"><path class="bacillus-tail base-ambient" d="M-16 0C-24-13-28 14-36 1S-48-2-50 7"/><rect x="-17" y="-8" width="34" height="16" rx="8"/><path class="bacillus-dna" d="M-10 1Q-6-7-2 0T8 0"/><path class="bacillus-pili" d="M-9-8v-5M4-8l2-5M-7 8l-2 5M7 8l2 5"/></g>`,
    cocci:`<g class="life-cocci">${[[-12,-6],[0,0],[12,6]].map(([x,y])=>`<g transform="translate(${x} ${y})"><circle r="8"/><path d="M-3-4Q2-6 4-1"/></g>`).join('')}</g>`,
    virus:`<g class="life-virus base-ambient">${Array.from({length:8},(_,i)=>`<g transform="rotate(${i*45})"><path class="virus-spike" d="M0-12V-21M-3-21H3"/></g>`).join('')}<path class="virus-shell" d="m0-14 12 7v14L0 14-12 7V-7Z"/><path class="virus-core" d="m-5-5 10 10m0-10L-5 5"/><circle class="virus-center" r="3"/></g>`,
    antibody:`<g class="life-antibody"><path class="antibody-outline" d="M0 17V0L-13-13M0 0l13-13"/><path class="antibody-core" d="M0 17V0L-13-13M0 0l13-13"/><path class="antibody-tips" d="m-17-10 7-7m20 0 7 7"/></g>`,
    spiral:`<g class="life-spiral base-ambient"><path d="M-23 4C-21-14-11-14-9 0S2 15 4 0 16-14 18 1 25 6 27-2"/><path class="spiral-core" d="M-23 4C-21-14-11-14-9 0S2 15 4 0 16-14 18 1 25 6 27-2"/></g>`
  };
  function microLife() {
    return `<g class="micro-life" aria-hidden="true">
      <g class="micro-skirmish scene-engulf" transform="translate(145 188) scale(.48)" style="--micro-delay:0s">
        <g class="micro-invader base-ambient" transform="translate(105 0)">${lifeArt.bacillus}</g>
        <g class="micro-pursuer base-ambient" transform="translate(-115 -4)">${lifeArt.macrophage}</g>
        <g class="micro-capture base-ambient" transform="translate(20 0)"><ellipse class="engulf-vacuole" rx="13" ry="10"/></g>
      </g>
      <g class="micro-skirmish scene-patrol" transform="translate(267 373) scale(.48)" style="--micro-delay:-3s">
        <g class="patrol-trail base-ambient"><path d="M-60-6h22M-68 2h26M-56 10h17"/></g>
        <g class="micro-invader base-ambient" transform="translate(120 -4)">${lifeArt.cocci}</g>
        <g class="micro-pursuer base-ambient" transform="translate(-130 8)">${lifeArt.neutrophil}</g>
        <g class="micro-capture base-ambient" transform="translate(12 0)"><ellipse class="patrol-envelope" rx="27" ry="23"/></g>
      </g>
      <g class="micro-skirmish scene-neutralize" transform="translate(165 557) scale(.48)" style="--micro-delay:-5s">
        <g class="micro-invader base-ambient" transform="translate(12 0)">${lifeArt.virus}</g>
        <g class="micro-pursuer base-ambient" transform="translate(-105 6)">${lifeArt.antibody}</g>
        <g class="antibody-wing base-ambient" transform="translate(110 -8)">${lifeArt.antibody}</g>
        <g class="micro-capture base-ambient" transform="translate(12 0)"><path class="neutralize-orbit" d="M-25-19Q5-37 26-15M-27 14Q0 34 26 16"/></g>
      </g>
      <g class="micro-drifter" transform="translate(28 65)" style="--micro-delay:-1s"><g class="micro-float base-ambient"><g transform="scale(.34)">${lifeArt.spiral}</g></g></g>
      <g class="micro-drifter" transform="translate(373 264)" style="--micro-delay:-4s"><g class="micro-float base-ambient"><g transform="scale(.32)">${lifeArt.virus}</g></g></g>
      <g class="micro-drifter" transform="translate(200 82)" style="--micro-delay:-7s"><g class="micro-float base-ambient"><g transform="scale(.34)">${lifeArt.neutrophil}</g></g></g>
      <g class="micro-drifter" transform="translate(28 457)" style="--micro-delay:-9s"><g class="micro-float base-ambient"><g transform="scale(.32)">${lifeArt.cocci}</g></g></g>
    </g>`;
  }
  function routes(unlocked,completed) {
    const nodes=[[100,130],[300,130],[300,306],[100,306],[100,482],[300,482],[300,658]];
    const line=points=>points.map(p=>p.join(',')).join(' ');
    return `<svg class="base-roads" viewBox="0 0 400 728" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="baseGrid" width="48" height="24" patternUnits="userSpaceOnUse"><path d="M0 12 24 0 48 12 24 24Z" fill="none" stroke="#86c7c4" stroke-opacity=".06"/></pattern></defs><path fill="url(#baseGrid)" d="M0 0h400v728H0Z"/><polyline class="road-bed" points="${line(nodes)}"/><polyline class="road-mark" points="${line(nodes)}"/>${unlocked>1?`<polyline class="road-open base-ambient" points="${line(nodes.slice(0,unlocked))}"/>`:''}${completed===7?'<path class="base-complete-line" d="M30 708h340"/>':''}${microLife()}<g class="base-patrol base-ambient" transform="translate(200 190)"><g transform="scale(.6)"><ellipse cx="0" cy="12" rx="14" ry="5" fill="#032333" opacity=".4"/><path d="m-14 0 14-8 14 8-14 8Z" fill="#baf5e5" stroke="#61dcca"/><path d="M0-5v10m-5-5h10" stroke="#176866" stroke-width="2"/><path class="drone-eyes" d="m-5 3 3 1m4 0 3-1" stroke="#e7ffff" stroke-width="2"/></g></g><g class="base-landscape"><path d="m24 205 24-12 24 12-24 12Z"/><path d="m328 384 24-12 24 12-24 12Z"/><path d="m28 560 24-12 24 12-24 12Z"/></g></svg>`;
  }
  function bossGate() {
    return `<a id="baseBossGate" class="base-boss-gate" href="./index.html" aria-label="BOSS 連戰，課後挑戰，免解鎖，獨立計分"><span class="facility-art" aria-hidden="true"><svg viewBox="0 0 160 140">${platform}<g class="gate-rings base-ambient"><ellipse cx="80" cy="67" rx="31" ry="48" fill="#261f3d" stroke="#d5acf8" stroke-width="6"/><ellipse cx="80" cy="67" rx="21" ry="36" fill="#181c31" stroke="#82679e" stroke-width="2"/><path d="m66 56 28 27m0-27L66 83" stroke="#ffda83" stroke-width="4" stroke-linecap="round"/></g></svg></span><strong>BOSS 連戰</strong><span>↗ 課後挑戰・免解鎖</span></a>`;
  }
  return {facilities,facility,routes,bossGate};
})();

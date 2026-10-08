/* Lightweight isometric artwork. Learning data and scoring remain in the original app. */
window.ImmuneRushBase = (() => {
  'use strict';
  const facilities=['防線城門','免疫部隊基地','記憶資料塔','抗體工坊','血型檢驗站','補體反應站','MHC 指揮中心'];
  // Project a rectangular block onto a fixed isometric view. No WebGL or external assets.
  const point=(x,y,u,v,z=0)=>`${(x+(u-v)*.86).toFixed(1)},${(y+(u+v)*.46-z).toFixed(1)}`;
  function block(x,y,w,d,h,roof='roof') {
    const p=(u,v,z)=>point(x,y,u,v,z);
    return `<polygon class="wall-left" points="${p(0,0,0)} ${p(0,d,0)} ${p(0,d,h)} ${p(0,0,h)}"/><polygon class="wall-right" points="${p(0,d,0)} ${p(w,d,0)} ${p(w,d,h)} ${p(0,d,h)}"/><polygon class="wall-right" points="${p(w,0,0)} ${p(w,d,0)} ${p(w,d,h)} ${p(w,0,h)}"/><polygon class="${roof}" points="${p(0,0,h)} ${p(w,0,h)} ${p(w,d,h)} ${p(0,d,h)}"/>`;
  }
  function tank(x,y,color='tank') {
    return `<g class="${color}"><path d="M${x-12} ${y-30}v29c0 10 24 10 24 0v-29Z"/><ellipse cx="${x}" cy="${y-30}" rx="12" ry="6"/><ellipse class="tank-band" cx="${x}" cy="${y-14}" rx="12" ry="6"/></g>`;
  }
  const platform='<ellipse class="facility-shadow" cx="80" cy="113" rx="68" ry="18"/><path class="pad-side" d="m9 93 71 35 71-35v10l-71 35-71-35Z"/><path class="pad-top" d="m9 93 71-35 71 35-71 35Z"/><path class="pad-trim" d="m18 94 62 29 62-29"/>';
  const detail='<path class="window-strip base-ambient" d="m82 95 7-3m5-2 7-3m5-2 7-3"/>';
  const buildings=[
    block(59,71,18,23,48)+block(98,87,18,23,48)+block(61,47,61,9,9)+'<path class="facility-light" d="m58 33 50 23"/><path class="gate-door" d="M62 82V63l21 10v20Z"/>',
    block(68,79,54,34,29)+block(78,59,22,14,8)+'<path class="medical-mark" d="M81 56v12m-6-6h12"/>'+detail+'<g class="unit-dots"><circle cx="35" cy="94" r="4"/><circle cx="46" cy="100" r="4"/><circle cx="57" cy="106" r="4"/></g>',
    block(74,84,34,29,54)+[0,1,2].map(i=>`<path class="data-band base-ambient" d="m50 ${57+i*13} 29 14 29-14"/>`).join('')+'<path class="antenna" d="M78 28V13"/><circle class="beacon base-ambient" cx="78" cy="13" r="4"/>',
    block(62,79,63,34,30)+block(74,48,12,12,23)+block(96,58,10,10,17)+'<path class="medical-mark" d="m63 51 9 10 10-5m-10 5v16"/>'+detail,
    block(75,86,34,32,18)+tank(53,83,'blood-tank')+tank(107,100,'blood-tank')+'<path class="medical-mark" d="M73 70v12m-6-6h12"/>',
    block(78,86,38,34,18)+'<ellipse class="reactor-shell" cx="80" cy="68" rx="32" ry="16"/><ellipse class="reactor-core base-ambient" cx="80" cy="66" rx="19" ry="9"/><path class="antenna" d="M51 67V45m57 26V49M80 87v-21"/><g class="beacon base-ambient"><circle cx="51" cy="45" r="4"/><circle cx="108" cy="49" r="4"/><circle cx="80" cy="87" r="4"/></g>',
    block(51,80,21,26,31)+block(105,95,20,24,32)+block(77,82,32,26,60)+'<path class="command-glass" d="m55 37 25 12 24-12v18L80 68 55 56Z"/><path class="antenna" d="M80 25V6m-7 8h14"/><circle class="beacon base-ambient" cx="80" cy="6" r="3"/>'
  ];
  function facility(i) {
    return `<span class="facility-art" aria-hidden="true"><svg viewBox="0 0 160 140" focusable="false">${platform}<g class="building">${buildings[i]}</g><path class="facility-scan base-ambient" d="M36 91 81 69 124 91 81 112Z"/><circle class="facility-beacon base-ambient" cx="132" cy="110" r="4"/></svg></span>`;
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

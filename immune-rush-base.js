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
  // Decorative defense vignette: approach, surround, fade. Not a cell-mechanism simulation.
  // Shared SVG/CSS timelines have no timers, hit targets, audio or scoring side effects.
  const immuneCell='<path class="micro-membrane" d="M-17-3C-19-12-8-18 0-15C10-19 19-10 16-2C21 7 10 17 2 15C-7 20-19 10-15 3Z"/><path class="micro-nucleus" d="M-7-5C-2-11 2-4 1 0C8-5 12 3 6 7C1 11-2 4-3 2C-10 6-13 0-7-5Z"/><g class="micro-granules"><circle cx="8" cy="-8" r="1.5"/><circle cx="-10" cy="6" r="1.4"/><circle cx="0" cy="11" r="1.2"/></g>';
  const microbe='<g class="microbe-body"><path class="micro-spikes" d="M-10-8l-4-4M0-9v-5M10-6l5-4M13 3l5 1M5 8l2 5M-6 8l-3 5M-14 0h-5"/><rect x="-13" y="-7" width="26" height="14" rx="7"/><path class="micro-dna" d="M-7 1c3-8 9 6 13-2"/></g>';
  function microLife() {
    const skirmishes=[[200,188,0],[200,373,-5],[200,557,-10]].map(([x,y,delay])=>`<g class="micro-skirmish" transform="translate(${x} ${y})" style="--micro-delay:${delay}s"><g class="micro-pursuer base-ambient" transform="translate(-140 -6)">${immuneCell}</g><g class="micro-invader base-ambient" transform="translate(140 6)">${microbe}</g><g class="micro-capture base-ambient" transform="translate(5 0)"><ellipse class="micro-capture-ring" rx="26" ry="21"/><path d="M-13-8Q5-28 21-4M-17 8Q1 28 22 6"/></g></g>`).join('');
    const drifters=[[20,68,0],[376,264,-3],[200,86,-6],[24,456,-9]].map(([x,y,delay],i)=>`<g transform="translate(${x} ${y})" class="micro-drifter" style="--micro-delay:${delay}s"><g class="micro-float base-ambient"><g transform="scale(${i%2?.55:.65})">${i===2?immuneCell:microbe}</g></g></g>`).join('');
    return `<g class="micro-life" aria-hidden="true">${drifters}${skirmishes}</g>`;
  }
  function routes(unlocked,completed) {
    const nodes=[[100,130],[300,130],[300,306],[100,306],[100,482],[300,482],[300,658]];
    const line=points=>points.map(p=>p.join(',')).join(' ');
    return `<svg class="base-roads" viewBox="0 0 400 728" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="baseGrid" width="48" height="24" patternUnits="userSpaceOnUse"><path d="M0 12 24 0 48 12 24 24Z" fill="none" stroke="#86c7c4" stroke-opacity=".06"/></pattern></defs><path fill="url(#baseGrid)" d="M0 0h400v728H0Z"/><polyline class="road-bed" points="${line(nodes)}"/><polyline class="road-mark" points="${line(nodes)}"/>${unlocked>1?`<polyline class="road-open base-ambient" points="${line(nodes.slice(0,unlocked))}"/>`:''}${completed===7?'<path class="base-complete-line" d="M30 708h340"/>':''}${microLife()}<g class="base-patrol base-ambient" transform="translate(200 190)"><ellipse cx="0" cy="12" rx="14" ry="5" fill="#032333" opacity=".4"/><path d="m-14 0 14-8 14 8-14 8Z" fill="#baf5e5" stroke="#61dcca"/><path d="M0-5v10m-5-5h10" stroke="#176866" stroke-width="2"/><path class="drone-eyes" d="m-5 3 3 1m4 0 3-1" stroke="#e7ffff" stroke-width="2"/></g><g class="base-landscape"><path d="m24 205 24-12 24 12-24 12Z"/><path d="m328 384 24-12 24 12-24 12Z"/><path d="m28 560 24-12 24 12-24 12Z"/></g></svg>`;
  }
  function bossGate() {
    return `<a id="baseBossGate" class="base-boss-gate" href="./index.html" aria-label="BOSS 連戰，課後挑戰，免解鎖，獨立計分"><span class="facility-art" aria-hidden="true"><svg viewBox="0 0 160 140">${platform}<g class="gate-rings base-ambient"><ellipse cx="80" cy="67" rx="31" ry="48" fill="#261f3d" stroke="#d5acf8" stroke-width="6"/><ellipse cx="80" cy="67" rx="21" ry="36" fill="#181c31" stroke="#82679e" stroke-width="2"/><path d="m66 56 28 27m0-27L66 83" stroke="#ffda83" stroke-width="4" stroke-linecap="round"/></g></svg></span><strong>BOSS 連戰</strong><span>↗ 課後挑戰・免解鎖</span></a>`;
  }
  return {facilities,facility,routes,bossGate};
})();

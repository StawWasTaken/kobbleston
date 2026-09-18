import{Pt as e,Sn as t,xn as n,zt as r}from"./free-solid-svg-icons-Bvf09pTG.js";var i={sans:`system-ui, sans-serif`,serif:`Georgia, "Times New Roman", serif`,mono:`ui-monospace, "Courier New", monospace`,display:`"bd-gravel-variable", system-ui, sans-serif`},a={sans:`Plain`,serif:`Serif`,mono:`Typewriter`,display:`Kobbleston`},o=e=>`kobfont-${e.replace(/[^A-Za-z0-9]/g,``)}`;function s(e){let t=String(e??``).trim();if(!t)return``;if(i[t])return i[t];let n=_(t);return n?`"${o(n.replace(`kob://`,``))}", system-ui, sans-serif`:``}function c(e){let t=new Set,n=e=>{let n=String(e??``).trim();if(!n||i[n])return;let r=_(n);r&&t.add(r.replace(`kob://`,``))};n(e.font);for(let t of e.blocks)n(t.props.font);return[...t]}var l={bg:`#00000000`,border:`#00000000`,borderWidth:0,radius:0,shadow:0,opacity:100,rotate:0,padding:0},u={heading:{w:560,h:80,label:`Heading`,props:{text:`A heading`,size:44,align:`left`,colour:``,font:``,weight:800,lineHeight:115,spacing:0,italic:!1}},text:{w:460,h:120,label:`Text`,props:{text:`Say something here.`,size:16,align:`left`,colour:``,font:``,weight:400,lineHeight:160,spacing:0,italic:!1}},quote:{w:520,h:140,label:`Quote`,props:{text:`Something worth repeating.`,who:``,size:22,colour:``,font:``,accent:`#1B34E8`}},marquee:{w:720,h:60,label:`Marquee`,props:{text:`This bit never stops moving.`,size:22,colour:``,font:``,speed:18,direction:`left`}},links:{w:320,h:220,label:`Links`,props:{items:[],colour:`#1B34E8`,text:`#ffffff`,radius:10,gap:8,font:``}},image:{w:360,h:240,label:`Image`,props:{tag:``,alt:``,fit:`cover`,radius:12,href:``}},gallery:{w:640,h:260,label:`Gallery`,props:{tags:[],columns:3,radius:12,gap:10}},button:{w:220,h:56,label:`Button`,props:{label:`Press me`,href:`/`,colour:`#1B34E8`,text:`#ffffff`,radius:12,size:15,font:``}},divider:{w:560,h:12,label:`Divider`,props:{colour:`#ffffff33`,thickness:2}},video:{w:520,h:300,label:`Video`,props:{tag:``,loop:!1,muted:!0,radius:12}},audio:{w:360,h:96,label:`Sound`,props:{tag:``,title:``,by:``,cover:``,mode:`player`,skin:`full`,loop:!1,colour:`#1B34E8`}},ad:{w:728,h:90,label:`Ad slot`,props:{size:`banner`}},donate:{w:260,h:72,label:`Donate`,props:{label:`Give Kubes`,amount:10,colour:`#1CAE71`,text:`#ffffff`,radius:12,icon:!0}},box:{w:320,h:200,label:`Box`,props:{colour:`#ffffff12`,radius:16,border:`#ffffff22`}}},d={banner:{w:728,h:90,label:`Banner, 728 by 90`},box:{w:300,h:250,label:`Box, 300 by 250`},tall:{w:160,h:600,label:`Tall, 160 by 600`}},f=()=>({version:1,background:`#101012`,text:`#f4f4f6`,font:`sans`,width:960,blocks:[]}),p=(e,t)=>{let n=u[e];return{id:`${e}-${Math.random().toString(36).slice(2,9)}`,kind:e,x:t.x,y:t.y,w:e===`ad`?d.banner.w:n.w,h:e===`ad`?d.banner.h:n.h,props:{...l,...n.props}}},m=e=>Math.round(e/10)*10;function h(e){if(!e)return null;try{let t=JSON.parse(e);return!t||t.version!==1||!Array.isArray(t.blocks)?null:{...f(),...t,blocks:t.blocks.map(e=>({...e,props:{...l,...u[e.kind]?.props,...e.props}}))}}catch{return null}}var g=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),_=e=>{let t=String(e??``).trim().toUpperCase().replace(/^KOB:\/\//,``);return/^[A-Z]{3}-\d+$/.test(t)?`kob://${t}`:``},v=e=>{let t=String(e??``).trim();return t?/^https?:\/\//i.test(t)||t.startsWith(`/`)?t:`/${t}`:`#`},y=e=>{let t=String(e??``).trim();return/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)?t:``},b=(e,t=0)=>{let n=Number(e);return Number.isFinite(n)?n:t};function x(e,t=``){let[n,r,,,i]=e.icon;return`<svg class="${t}" viewBox="0 0 ${n} ${r}" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false">${(Array.isArray(i)?i:[i]).map(e=>`<path d="${e}"/>`).join(``)}</svg>`}var S=`<svg class="kob-kube" viewBox="0 0 512 512" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M440.9,136.3a4,4,0,0,0,0-6.91L288.16,40.65a64.14,64.14,0,0,0-64.33,0L71.12,129.39a4,4,0,0,0,0,6.91L254,243.88a4,4,0,0,0,4.06,0Z"/><path d="M54,163.51A4,4,0,0,0,48,167V340.89a48,48,0,0,0,23.84,41.39L234,479.51a4,4,0,0,0,6-3.46V274.3a4,4,0,0,0-2-3.46Z"/><path d="M272,275v201a4,4,0,0,0,6,3.46l162.15-97.23A48,48,0,0,0,464,340.89V167a4,4,0,0,0-6-3.45l-184,108A4,4,0,0,0,272,275Z"/></svg>`;function C(i,a){let o=i.props,s=_(o.cover),c=o.skin===`mini`,l=o.skin===`cover`?`<span class="kob-face">${s?`<img src="${s}" alt="" />`:``}</span>`:``,u=c?``:`<span class="kob-said"><span class="kob-said-title">${g(o.title||`Untitled`)}</span>`+(o.by?`<span class="kob-said-by">${g(o.by)}</span>`:``)+`</span>`;return`<div class="kob-player${c?` is-mini`:``}${o.skin===`cover`?` is-cover`:``}" data-kob-player><audio data-kob-media src="${a}" preload="metadata"${o.loop?` loop`:``}></audio>`+l+`<div class="kob-player-body">`+u+`<div class="kob-controls"><button type="button" class="kob-play" data-kob-play aria-label="Play">`+x(r,`kob-i-play`)+x(e,`kob-i-pause`)+`</button><span class="kob-clock" data-kob-at>0:00</span><span class="kob-bar" data-kob-seek role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="kob-bar-track"></span><span class="kob-bar-fill" data-kob-fill></span><span class="kob-bar-knob" data-kob-knob></span></span><span class="kob-clock kob-clock-end" data-kob-length>0:00</span><button type="button" class="kob-mute" data-kob-mute aria-label="Mute">`+x(n,`kob-i-loud`)+x(t,`kob-i-quiet`)+`</button></div></div></div>`}function w(e){let r=e.props;switch(e.kind){case`heading`:return`<h2 class="kob-h">${g(r.text)}</h2>`;case`text`:return`<p class="kob-p">${g(r.text).replace(/\n/g,`<br />`)}</p>`;case`quote`:return`<blockquote class="kob-quote"><p>${g(r.text).replace(/\n/g,`<br />`)}</p>`+(r.who?`<cite>${g(r.who)}</cite>`:``)+`</blockquote>`;case`marquee`:return`<div class="kob-marquee"><div class="kob-marquee-run"><span>${g(r.text)}</span><span aria-hidden="true">${g(r.text)}</span></div></div>`;case`links`:{let e=Array.isArray(r.items)?r.items:[];return e.length?`<nav class="kob-links">${e.map(e=>{let[t,n]=e.split(`|`);return`<a href="${g(v(n??t))}">${g((t??``).trim()||n)}</a>`}).join(``)}</nav>`:`<span class="kob-empty">No links yet</span>`}case`image`:{let e=_(r.tag);if(!e)return`<span class="kob-empty">No picture chosen</span>`;let t=`<img class="kob-img" src="${e}" alt="${g(r.alt)}" />`;return r.href?`<a class="kob-img-link" href="${g(v(r.href))}">${t}</a>`:t}case`gallery`:{let e=(Array.isArray(r.tags)?r.tags:[]).map(_).filter(Boolean);return e.length?`<div class="kob-grid">${e.map(e=>`<img src="${e}" alt="" />`).join(``)}</div>`:`<span class="kob-empty">No pictures chosen</span>`}case`button`:return`<a class="kob-btn" href="${g(v(r.href))}">${g(r.label)}</a>`;case`divider`:return`<hr class="kob-hr" />`;case`video`:{let e=_(r.tag);return e?`<video class="kob-video" src="${e}" controls${r.loop?` loop`:``}${r.muted?` muted`:``} playsinline></video>`:`<span class="kob-empty">No clip chosen</span>`}case`audio`:{let i=_(r.tag);return i?r.mode===`loop`?`<div class="kob-ambient" data-kob-ambient><audio data-kob-media src="${i}" preload="auto" loop></audio><button type="button" class="kob-ambient-btn" data-kob-play aria-label="Sound on or off">`+x(t,`kob-i-play`)+x(n,`kob-i-pause`)+`<span>${g(r.title||`Sound`)}</span></button></div>`:C(e,i):`<span class="kob-empty">No sound chosen</span>`}case`ad`:return`<div class="kob-ad" data-kob-ad="${g(r.size)}"></div>`;case`donate`:return`<button class="kob-donate" data-kob-donate="${g(Math.round(b(r.amount,10)))}">`+(r.icon===!1?``:S)+`<span>${g(r.label)}</span></button>`;case`box`:return``;default:return``}}function T(e){let t=e.props,n=[],r=y(t.bg);r&&!r.endsWith(`00000000`)&&n.push(`background:${r}`);let i=b(t.borderWidth),a=y(t.border);i>0&&a&&n.push(`border:${i}px solid ${a}`);let o=b(t.radius);o>0&&n.push(`border-radius:${o}px`);let s=b(t.shadow);s>0&&n.push(`box-shadow:0 ${Math.round(s/2)}px ${s}px rgba(0,0,0,.45)`);let c=b(t.opacity,100);c<100&&n.push(`opacity:${Math.max(0,c)/100}`);let l=b(t.rotate);l&&n.push(`transform:rotate(${l}deg)`);let u=b(t.padding);return u>0&&n.push(`padding:${u}px`),n}function E(e){let t=e.props,n=[`left:${e.x}px`,`top:${e.y}px`,`width:${e.w}px`,`height:${e.h}px`,...T(e)],r=s(String(t.font??``));return r&&n.push(`font-family:${r}`),e.kind===`box`&&(n.push(`background:${y(t.colour)||`transparent`}`),n.push(`border:1px solid ${y(t.border)||`transparent`}`),n.push(`border-radius:${b(t.radius)}px`)),(e.kind===`heading`||e.kind===`text`)&&(n.push(`font-size:${b(t.size,16)}px`,`text-align:${t.align===`center`||t.align===`right`?t.align:`left`}`,`font-weight:${b(t.weight,400)}`,`line-height:${b(t.lineHeight,150)/100}`,`letter-spacing:${b(t.spacing)/100}em`),t.italic&&n.push(`font-style:italic`),y(t.colour)&&n.push(`color:${y(t.colour)}`)),e.kind===`quote`&&(n.push(`font-size:${b(t.size,22)}px`,`--kob-accent:${y(t.accent)||`#1B34E8`}`),y(t.colour)&&n.push(`color:${y(t.colour)}`)),e.kind===`marquee`&&(n.push(`font-size:${b(t.size,22)}px`,`--kob-run:${Math.max(3,b(t.speed,18))}s`,`--kob-way:${t.direction===`right`?`reverse`:`normal`}`),y(t.colour)&&n.push(`color:${y(t.colour)}`)),e.kind===`links`&&n.push(`--kob-btn-bg:${y(t.colour)||`#1B34E8`}`,`--kob-btn-fg:${y(t.text)||`#ffffff`}`,`--kob-btn-radius:${b(t.radius,10)}px`,`--kob-gap:${b(t.gap,8)}px`),e.kind===`image`&&(n.push(`border-radius:${b(t.radius,12)}px`,`overflow:hidden`),n.push(`--kob-fit:${t.fit===`contain`?`contain`:`cover`}`)),e.kind===`video`&&n.push(`border-radius:${b(t.radius,12)}px`,`overflow:hidden`),e.kind===`button`&&n.push(`--kob-btn-bg:${y(t.colour)||`#1B34E8`}`,`--kob-btn-fg:${y(t.text)||`#ffffff`}`,`--kob-btn-radius:${b(t.radius,12)}px`,`font-size:${b(t.size,15)}px`),e.kind===`divider`&&n.push(`--kob-hr:${y(t.colour)||`#ffffff33`}`,`--kob-hr-size:${b(t.thickness,2)}px`),e.kind===`donate`&&n.push(`--kob-btn-bg:${y(t.colour)||`#1CAE71`}`,`--kob-btn-fg:${y(t.text)||`#ffffff`}`,`--kob-btn-radius:${b(t.radius,12)}px`),e.kind===`audio`&&n.push(`--kob-btn-bg:${y(t.colour)||`#1B34E8`}`),e.kind===`gallery`&&n.push(`--kob-cols:${Math.max(1,b(t.columns,3))}`,`--kob-radius:${b(t.radius,12)}px`,`--kob-gap:${b(t.gap,10)}px`),n.join(`;`)}function D(e){let t=e.blocks.reduce((e,t)=>Math.max(e,t.y+t.h),400),n=c(e).map(e=>`@font-face {
  font-family: "${o(e)}";
  src: url("kob://${e}");
  font-display: swap;
}`).join(`

`),r=_(e.backdrop),a=r?`
  background-image: url("${r}");
  background-size: ${e.backdropFit===`tile`?`auto`:`cover`};
  background-repeat: ${e.backdropFit===`tile`?`repeat`:`no-repeat`};
  background-position: center;
  background-attachment: ${e.backdropFit===`fixed`?`fixed`:`scroll`};`:``;return`${n}${n?`

`:``}:root { --kob-fg: ${e.text}; }

* { box-sizing: border-box; }

body {
  margin: 0;
  background: ${e.background};
  color: ${e.text};
  font-family: ${s(e.font)||i.sans};${a}
}

.kob-page {
  position: relative;
  width: ${e.width}px;
  min-height: ${t+80}px;
  margin: 0 auto;
}

.kob-block { position: absolute; }

.kob-h, .kob-p { margin: 0; }

.kob-quote { margin: 0; height: 100%; padding-left: 18px; border-left: 4px solid var(--kob-accent, #1B34E8); }
.kob-quote p { margin: 0; line-height: 1.45; }
.kob-quote cite { display: block; margin-top: 8px; font-size: .6em; font-style: normal; opacity: .7; }

.kob-marquee { overflow: hidden; width: 100%; height: 100%; display: flex; align-items: center; }
.kob-marquee-run {
  display: flex;
  gap: 2em;
  white-space: nowrap;
  animation: kob-slide var(--kob-run, 18s) linear infinite var(--kob-way, normal);
}
@keyframes kob-slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .kob-marquee-run { animation: none; } }

.kob-links { display: flex; flex-direction: column; gap: var(--kob-gap, 8px); height: 100%; }
.kob-links a {
  display: flex; align-items: center; padding: 0 14px; min-height: 40px; flex: 1;
  text-decoration: none; font-weight: 700;
  background: var(--kob-btn-bg, #1B34E8); color: var(--kob-btn-fg, #fff);
  border-radius: var(--kob-btn-radius, 10px);
}
.kob-links a:hover { filter: brightness(1.12); }

.kob-img, .kob-video { width: 100%; height: 100%; object-fit: var(--kob-fit, cover); display: block; border-radius: inherit; }
.kob-img-link { display: block; width: 100%; height: 100%; border-radius: inherit; }

.kob-grid {
  display: grid;
  grid-template-columns: repeat(var(--kob-cols, 3), 1fr);
  gap: var(--kob-gap, 10px);
  width: 100%;
  height: 100%;
}
.kob-grid img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--kob-radius, 12px); }

.kob-btn, .kob-donate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
  width: 100%;
  height: 100%;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  background: var(--kob-btn-bg, #1B34E8);
  color: var(--kob-btn-fg, #fff);
  border-radius: var(--kob-btn-radius, 12px);
}
.kob-btn:hover, .kob-donate:hover { filter: brightness(1.12); }
.kob-kube { flex: none; }

.kob-hr {
  border: 0;
  width: 100%;
  height: var(--kob-hr-size, 2px);
  background: var(--kob-hr, #ffffff33);
  margin: 0;
}

/* The player, the same one Create uses. */
.kob-player {
  display: flex; align-items: center; gap: 12px;
  width: 100%; height: 100%; padding: 10px 12px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 14px;
  background: rgba(255,255,255,.05);
}
.kob-player-body { min-width: 0; flex: 1; }
.kob-face { flex: none; width: 64px; height: 64px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,.08); }
.kob-face img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kob-said { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.kob-said-title { font-size: 13px; font-weight: 700; }
.kob-said-by { font-size: 11px; opacity: .6; }
.kob-controls { display: flex; align-items: center; gap: 10px; }
.kob-play, .kob-mute {
  display: grid; place-items: center; flex: none; border: 0; cursor: pointer; color: inherit;
  background: transparent; padding: 0;
}
.kob-play {
  width: 36px; height: 36px; border-radius: 999px;
  background: var(--kob-btn-bg, #1B34E8); color: #fff; font-size: 13px;
}
.kob-mute { width: 28px; height: 28px; font-size: 13px; opacity: .7; }
.kob-mute:hover { opacity: 1; }
.kob-i-pause, .kob-i-quiet { display: none; }
[data-playing] .kob-i-play, [data-quiet] .kob-i-loud { display: none; }
[data-playing] .kob-i-pause, [data-quiet] .kob-i-quiet { display: inline-block; }
.kob-clock { font-size: 11px; opacity: .7; font-variant-numeric: tabular-nums; flex: none; min-width: 32px; }
.kob-clock-end { text-align: right; }
.kob-bar { position: relative; flex: 1; height: 18px; cursor: pointer; touch-action: none; }
.kob-bar-track, .kob-bar-fill {
  position: absolute; left: 0; top: 50%; height: 5px; transform: translateY(-50%); border-radius: 999px;
}
.kob-bar-track { right: 0; background: rgba(255,255,255,.18); }
.kob-bar-fill { width: 0; background: var(--kob-btn-bg, #1B34E8); }
.kob-bar-knob {
  position: absolute; left: 0; top: 50%; width: 12px; height: 12px; margin-left: -6px;
  transform: translateY(-50%); border-radius: 999px; background: #fff; opacity: 0; transition: opacity .12s;
}
.kob-bar:hover .kob-bar-knob, .kob-bar:focus-visible .kob-bar-knob { opacity: 1; }
.kob-player.is-mini { padding: 6px 10px; }
.kob-player.is-mini .kob-play { width: 30px; height: 30px; font-size: 11px; }

.kob-ambient { width: 100%; height: 100%; display: flex; align-items: center; }
.kob-ambient-btn {
  display: inline-flex; align-items: center; gap: .5em; height: 100%; width: 100%;
  border: 1px solid rgba(255,255,255,.16); border-radius: 12px;
  background: rgba(255,255,255,.05); color: inherit; font: inherit; font-weight: 700; cursor: pointer;
  padding: 0 14px;
}

.kob-ad { width: 100%; height: 100%; overflow: hidden; border-radius: 8px; }
.kob-ad img { width: 100%; height: 100%; object-fit: cover; display: block; }

.kob-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 1px dashed currentColor;
  border-radius: 12px;
  opacity: 0.45;
  font-size: 13px;
}

/* On a narrow screen the page stops being a canvas and becomes a column, in
   the order things were placed down the page. */
@media (max-width: ${e.width}px) {
  .kob-page { width: 100%; min-height: 0; padding: 16px; }
  .kob-block {
    position: static;
    width: 100% !important;
    height: auto !important;
    min-height: 40px;
    margin: 0 0 18px;
    transform: none !important;
  }
  .kob-img, .kob-video { height: auto; }
  .kob-ad { height: auto; aspect-ratio: 8 / 1; }
  .kob-links a { flex: none; }
}
`}function O(e){return{html:`<link rel="stylesheet" href="style.css" />

<div class="kob-page">
${[...e.blocks].sort((e,t)=>e.y-t.y||e.x-t.x).map(e=>`  <div class="kob-block kob-${e.kind}" style="${E(e)}">${w(e)}</div>`).join(`
`)}
</div>
`,css:D(e)}}export{f as a,h as c,O as i,m as l,u as n,s as o,a as r,p as s,d as t};
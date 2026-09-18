var e={sans:`system-ui, sans-serif`,serif:`Georgia, "Times New Roman", serif`,mono:`ui-monospace, "Courier New", monospace`,display:`"bd-gravel-variable", system-ui, sans-serif`},t={heading:{w:560,h:80,label:`Heading`,props:{text:`A heading`,size:44,align:`left`,colour:``}},text:{w:460,h:120,label:`Text`,props:{text:`Say something here.`,size:16,align:`left`,colour:``}},image:{w:360,h:240,label:`Image`,props:{tag:``,alt:``,fit:`cover`,radius:12}},gallery:{w:640,h:260,label:`Gallery`,props:{tags:[],columns:3,radius:12}},button:{w:220,h:56,label:`Button`,props:{label:`Press me`,href:`/`,colour:`#1B34E8`,text:`#ffffff`,radius:12}},divider:{w:560,h:12,label:`Divider`,props:{colour:`#ffffff33`,thickness:2}},video:{w:520,h:300,label:`Video`,props:{tag:``,loop:!1,muted:!0}},audio:{w:360,h:80,label:`Sound`,props:{tag:``,title:``}},ad:{w:728,h:90,label:`Ad slot`,props:{size:`banner`}},donate:{w:260,h:72,label:`Donate`,props:{label:`Give Kubes`,amount:10,colour:`#1CAE71`}},box:{w:320,h:200,label:`Box`,props:{colour:`#ffffff12`,radius:16,border:`#ffffff22`}}},n={banner:{w:728,h:90,label:`Banner, 728 by 90`},box:{w:300,h:250,label:`Box, 300 by 250`},tall:{w:160,h:600,label:`Tall, 160 by 600`}},r=()=>({version:1,background:`#101012`,text:`#f4f4f6`,font:`sans`,width:960,blocks:[]}),i=(e,r)=>{let i=t[e];return{id:`${e}-${Math.random().toString(36).slice(2,9)}`,kind:e,x:r.x,y:r.y,w:e===`ad`?n.banner.w:i.w,h:e===`ad`?n.banner.h:i.h,props:{...i.props}}},a=e=>Math.round(e/10)*10;function o(e){if(!e)return null;try{let t=JSON.parse(e);return!t||t.version!==1||!Array.isArray(t.blocks)?null:{...r(),...t}}catch{return null}}var s=e=>String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`),c=e=>{let t=String(e??``).trim().toUpperCase().replace(/^KOB:\/\//,``);return/^[A-Z]{3}-\d+$/.test(t)?`kob://${t}`:``},l=e=>{let t=String(e??``).trim();return t?/^https?:\/\//i.test(t)||t.startsWith(`/`)?t:`/${t}`:`#`};function u(e){let t=e.props;switch(e.kind){case`heading`:return`<h2 class="kob-h">${s(t.text)}</h2>`;case`text`:return`<p class="kob-p">${s(t.text).replace(/\n/g,`<br />`)}</p>`;case`image`:{let e=c(t.tag);return e?`<img class="kob-img" src="${e}" alt="${s(t.alt)}" />`:`<span class="kob-empty">No picture chosen</span>`}case`gallery`:{let e=(Array.isArray(t.tags)?t.tags:[]).map(c).filter(Boolean);return e.length?`<div class="kob-grid">${e.map(e=>`<img src="${e}" alt="" />`).join(``)}</div>`:`<span class="kob-empty">No pictures chosen</span>`}case`button`:return`<a class="kob-btn" href="${s(l(t.href))}">${s(t.label)}</a>`;case`divider`:return`<hr class="kob-hr" />`;case`video`:{let e=c(t.tag);return e?`<video class="kob-video" src="${e}" controls${t.loop?` loop`:``}${t.muted?` muted`:``} playsinline></video>`:`<span class="kob-empty">No clip chosen</span>`}case`audio`:{let e=c(t.tag);return e?`<div class="kob-audio"><span>${s(t.title)}</span><audio src="${e}" controls></audio></div>`:`<span class="kob-empty">No sound chosen</span>`}case`ad`:return`<div class="kob-ad" data-kob-ad="${s(t.size)}"></div>`;case`donate`:return`<button class="kob-donate" data-kob-donate="${s(t.amount)}">${s(t.label)}</button>`;case`box`:return``;default:return``}}function d(e){let t=e.props,n=[`left:${e.x}px`,`top:${e.y}px`,`width:${e.w}px`,`height:${e.h}px`];return e.kind===`box`&&n.push(`background:${t.colour}`,`border:1px solid ${t.border}`,`border-radius:${t.radius}px`),(e.kind===`heading`||e.kind===`text`)&&(n.push(`font-size:${t.size}px`,`text-align:${t.align}`),t.colour&&n.push(`color:${t.colour}`)),e.kind===`image`&&n.push(`border-radius:${t.radius}px`,`overflow:hidden`),e.kind===`button`&&n.push(`--kob-btn-bg:${t.colour}`,`--kob-btn-fg:${t.text}`,`--kob-btn-radius:${t.radius}px`),e.kind===`divider`&&n.push(`--kob-hr:${t.colour}`,`--kob-hr-size:${t.thickness}px`),e.kind===`donate`&&n.push(`--kob-btn-bg:${t.colour}`),e.kind===`gallery`&&n.push(`--kob-cols:${t.columns}`,`--kob-radius:${t.radius}px`),n.join(`;`)}function f(t){let n=t.blocks.reduce((e,t)=>Math.max(e,t.y+t.h),400);return`:root {
  --kob-fg: ${t.text};
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: ${t.background};
  color: ${t.text};
  font-family: ${e[t.font]};
}

.kob-page {
  position: relative;
  width: ${t.width}px;
  min-height: ${n+80}px;
  margin: 0 auto;
}

.kob-block { position: absolute; }

.kob-h, .kob-p { margin: 0; line-height: 1.25; }
.kob-p { line-height: 1.6; }

.kob-img, .kob-video { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }

.kob-grid {
  display: grid;
  grid-template-columns: repeat(var(--kob-cols, 3), 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
}
.kob-grid img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--kob-radius, 12px); }

.kob-btn, .kob-donate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.kob-hr {
  border: 0;
  width: 100%;
  height: var(--kob-hr-size, 2px);
  background: var(--kob-hr, #ffffff33);
  margin: 0;
}

.kob-audio { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.kob-audio audio { width: 100%; }

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
@media (max-width: ${t.width}px) {
  .kob-page { width: 100%; min-height: 0; padding: 16px; }
  .kob-block {
    position: static;
    width: 100% !important;
    height: auto !important;
    min-height: 40px;
    margin: 0 0 18px;
  }
  .kob-img, .kob-video { height: auto; }
  .kob-ad { height: auto; aspect-ratio: 8 / 1; }
}
`}function p(e){return{html:`<link rel="stylesheet" href="style.css" />

<div class="kob-page">
${[...e.blocks].sort((e,t)=>e.y-t.y||e.x-t.x).map(e=>`  <div class="kob-block kob-${e.kind}" style="${d(e)}">${u(e)}</div>`).join(`
`)}
</div>
`,css:f(e)}}export{i as a,r as i,t as n,o,p as r,a as s,n as t};
import{Fn as e,Ln as t,bn as n,kn as r,vn as i}from"./free-solid-svg-icons-ydUCCQpu.js";import{G as a,b as o,ct as s,gn as c,nn as l,p as u,sn as d}from"./Tooltip-C7i4L-bn.js";import{a as f,n as p,r as m}from"./Toast-Cr0fO1LJ.js";import{k as h}from"./app-BQFACXA8.js";var g=t(e(),1),_=n(),v=[`default-src 'none'`,`img-src https: data: blob:`,`media-src https: blob:`,`font-src https: data:`,`style-src 'unsafe-inline' https:`,`script-src 'unsafe-inline'`,`form-action 'none'`,`base-uri 'none'`,`frame-src 'none'`,`connect-src 'none'`].join(`; `),y=e=>e.replace(/"/g,`&quot;`),b=`
document.addEventListener('click', function (event) {
  var donate = event.target.closest('[data-kob-donate]')
  if (donate) {
    event.preventDefault()
    parent.postMessage({ kob: 'donate', amount: Number(donate.getAttribute('data-kob-donate')) }, '*')
    return
  }
  var ad = event.target.closest('[data-kob-ad-id]')
  if (ad) {
    event.preventDefault()
    parent.postMessage({ kob: 'ad-click', id: ad.getAttribute('data-kob-ad-id') }, '*')
  }
})
`;function x(e){let t=new Set;for(let n of e)for(let e of n.content.matchAll(/kob:\/\/[A-Za-z]{3}-\d+/g))t.add(e[0].toLowerCase().replace(/^kob:\/\//,`kob://`)),t.add(e[0]);return[...t]}function S(e,t,n){let r=new Map(e.map(e=>[e.path,e.content])),i=r.get(`index.html`)??``;i=i.replace(/<link\b[^>]*href=["']\.?\/?([a-z0-9._/-]+\.css)["'][^>]*>/gi,(e,t)=>{let n=r.get(t.toLowerCase());return n===void 0?e:`<style>\n${n}\n</style>`}),i=i.replace(/<script\b[^>]*src=["']\.?\/?([a-z0-9._/-]+\.js)["'][^>]*><\/script>/gi,(e,t)=>{let n=r.get(t.toLowerCase());return n===void 0?e:`<script>\n${n}\n<\/script>`});for(let[e,n]of t)i=i.split(e).join(y(n));return i=i.replace(/<div class="kob-ad" data-kob-ad="([a-z]+)"><\/div>/g,(e,t)=>{let r=n.get(t);return r===void 0?e:r?`<div class="kob-ad" data-kob-ad-id="${y(r.ad.id)}" role="link" tabindex="0"><img src="${y(r.url)}" alt="${y(r.ad.name)}" /></div>`:`<div class="kob-ad kob-ad-empty"><span>This space is for an ad</span></div>`}),i=i.replace(/kob:\/\/[A-Za-z]{3}-\d+/g,``),`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${y(v)}" />
<style>
html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:system-ui,sans-serif}
.kob-ad-empty{display:grid;place-items:center;height:100%;border:1px dashed currentColor;border-radius:8px;opacity:.4;font-size:12px}
[data-kob-ad-id]{cursor:pointer}
</style>
</head>
<body>
${i}
<script>${b}<\/script>
</body>
</html>`}function C({files:e,title:t,className:n,spaceId:v,building:y}){let b=r(),C=p(),{profile:w}=f(),T=(0,g.useRef)(null),[E,D]=(0,g.useState)(new Map),[O,k]=(0,g.useState)(new Map),[A,j]=(0,g.useState)(null),[M,N]=(0,g.useState)(!1),P=(0,g.useMemo)(()=>x(e),[e]);(0,g.useEffect)(()=>{let e=!0;if(!P.length){D(new Map);return}return Promise.all(P.map(async e=>s(e)?[e,await c(e).catch(()=>null)]:[e,null])).then(t=>{e&&D(new Map(t.filter(([,e])=>!!e)))}),()=>{e=!1}},[P]);let F=(0,g.useMemo)(()=>{let t=e.find(e=>e.path===`index.html`)?.content??``;return[...new Set([...t.matchAll(/data-kob-ad="([a-z]+)"/g)].map(e=>e[1]))]},[e]);(0,g.useEffect)(()=>{let e=!0;if(y||!v||!F.length){k(new Map);return}return Promise.all(F.map(async e=>{let t=await l(e,v).catch(()=>null);if(!t)return[e,null];let n=await o(t.file_path,3600).catch(()=>null);return[e,n?{ad:t,url:n}:null]})).then(t=>{e&&k(new Map(t))}),()=>{e=!1}},[F,v,y]),(0,g.useEffect)(()=>{let e=async e=>{if(e.source!==T.current?.contentWindow)return;let t=e.data;if(t&&typeof t.kob==`string`){if(t.kob===`donate`){if(y){C(`This is how it will work once it is live.`,`info`);return}if(!w){C(`Make an account to give Kubes.`,`info`);return}j(Math.min(Math.max(Math.round(Number(t.amount)||0),1),1e4));return}if(t.kob===`ad-click`&&typeof t.id==`string`){if(y)return;let e=[...O.values()].find(e=>e?.ad.id===t.id);if(!e)return;await d(e.ad.id).catch(()=>{}),b(e.ad.target_path)}}};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[O,y,b,w,C]);let I=async()=>{if(v&&A!==null){N(!0);try{let e=await a(v,A);C(`Given. You have ${e} Kubes left.`,`success`),j(null)}catch(e){C(e instanceof Error?e.message:`That did not go through.`,`error`)}finally{N(!1)}}},L=(0,g.useMemo)(()=>S(e,E,O),[e,E,O]);return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(`iframe`,{ref:T,title:t,srcDoc:L,sandbox:`allow-scripts`,referrerPolicy:`no-referrer`,className:i(`h-full w-full border-0 bg-white`,n)}),(0,_.jsx)(m,{open:A!==null,onClose:()=>j(null),title:`Give Kubes`,description:`A gift to whoever made this Space. Nothing is promised in return.`,size:`sm`,footer:(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(u,{variant:`ghost`,onClick:()=>j(null),children:`Cancel`}),(0,_.jsxs)(u,{loading:M,onClick:I,children:[(0,_.jsx)(h,{}),`Give `,A]})]}),children:(0,_.jsxs)(`p`,{className:`text-sm leading-relaxed text-muted`,children:[`This sends `,(0,_.jsx)(`span`,{className:`font-bold text-white`,children:A}),` Kubes from your account to the owner of this Space. It cannot be taken back.`]})})]})}export{C as t};
import{En as e,ln as t,sn as n,wn as r}from"./free-solid-svg-icons-Cgn46Rif.js";import{$ as i,in as a}from"./Input-DEJZuNhk.js";var o=e(r(),1),s=t(),c=[`default-src 'none'`,`img-src https: data: blob:`,`media-src https: blob:`,`font-src https: data:`,`style-src 'unsafe-inline' https:`,`script-src 'unsafe-inline'`,`form-action 'none'`,`base-uri 'none'`,`frame-src 'none'`,`connect-src 'none'`].join(`; `),l=e=>e.replace(/"/g,`&quot;`);function u(e){let t=new Set;for(let n of e)for(let e of n.content.matchAll(/kob:\/\/[A-Za-z]{3}-\d+/g))t.add(e[0].toLowerCase().replace(/^kob:\/\//,`kob://`)),t.add(e[0]);return[...t]}function d(e,t){let n=new Map(e.map(e=>[e.path,e.content])),r=n.get(`index.html`)??``;r=r.replace(/<link\b[^>]*href=["']\.?\/?([a-z0-9._/-]+\.css)["'][^>]*>/gi,(e,t)=>{let r=n.get(t.toLowerCase());return r===void 0?e:`<style>\n${r}\n</style>`}),r=r.replace(/<script\b[^>]*src=["']\.?\/?([a-z0-9._/-]+\.js)["'][^>]*><\/script>/gi,(e,t)=>{let r=n.get(t.toLowerCase());return r===void 0?e:`<script>\n${r}\n<\/script>`});for(let[e,n]of t)r=r.split(e).join(l(n));return r=r.replace(/kob:\/\/[A-Za-z]{3}-\d+/g,``),`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${l(c)}" />
<style>html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:system-ui,sans-serif}</style>
</head>
<body>
${r}
</body>
</html>`}function f({files:e,title:t,className:r}){let[c,l]=(0,o.useState)(new Map),f=(0,o.useMemo)(()=>u(e),[e]);(0,o.useEffect)(()=>{let e=!0;if(!f.length){l(new Map);return}return Promise.all(f.map(async e=>i(e)?[e,await a(e).catch(()=>null)]:[e,null])).then(t=>{e&&l(new Map(t.filter(([,e])=>!!e)))}),()=>{e=!1}},[f]);let p=(0,o.useMemo)(()=>d(e,c),[e,c]);return(0,s.jsx)(`iframe`,{title:t,srcDoc:p,sandbox:`allow-scripts`,referrerPolicy:`no-referrer`,className:n(`h-full w-full border-0 bg-white`,r)})}export{f as t};
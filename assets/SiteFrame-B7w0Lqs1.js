import{An as e,Mn as t,Vn as n,Yn as r,qn as i}from"./free-solid-svg-icons-aglpSWAt.js";import{An as a,T as o,Y as s,_n as c,fn as l,h as u,pt as d}from"./Card-GFSyE5JT.js";import{a as f,n as p,r as m}from"./Toast-DM-gLWD2.js";import{R as h}from"./app-cspHpEzw.js";var g=r(i(),1),_=t(),v=e=>[`default-src 'none'`,`img-src https: data: blob:`,`media-src https: blob:`,`font-src https: data:`,`style-src 'unsafe-inline' https:`,`script-src 'nonce-${e}'`,`form-action 'none'`,`base-uri 'none'`,`frame-src 'none'`,`connect-src 'none'`].join(`; `),y=e=>e.replace(/"/g,`&quot;`),b=`
(function () {
  /* Donating and ad presses are Kobbleston's business, so they are only ever
     reported outwards: this page cannot move anybody's Kubes by itself. */
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

  function clock(seconds) {
    if (!isFinite(seconds)) return '0:00'
    var whole = Math.floor(seconds)
    var rest = whole % 60
    return Math.floor(whole / 60) + ':' + (rest < 10 ? '0' : '') + rest
  }

  /* The player, driven the same way Create drives its own: press to play,
     drag or arrow along the bar, press to go quiet. */
  function player(box) {
    var media = box.querySelector('[data-kob-media]')
    var bar = box.querySelector('[data-kob-seek]')
    var fill = box.querySelector('[data-kob-fill]')
    var knob = box.querySelector('[data-kob-knob]')
    var at = box.querySelector('[data-kob-at]')
    var length = box.querySelector('[data-kob-length]')
    if (!media) return

    function draw() {
      var whole = media.duration || 0
      var part = whole ? (media.currentTime / whole) * 100 : 0
      if (fill) fill.style.width = part + '%'
      if (knob) knob.style.left = part + '%'
      if (at) at.textContent = clock(media.currentTime)
      if (length) length.textContent = clock(whole)
      if (bar) bar.setAttribute('aria-valuenow', String(Math.round(part)))
    }

    box.querySelector('[data-kob-play]').addEventListener('click', function () {
      if (media.paused) media.play(); else media.pause()
    })

    var mute = box.querySelector('[data-kob-mute]')
    if (mute) mute.addEventListener('click', function () {
      media.muted = !media.muted
      box.toggleAttribute('data-quiet', media.muted)
    })

    media.addEventListener('play', function () { box.setAttribute('data-playing', '') })
    media.addEventListener('pause', function () { box.removeAttribute('data-playing') })
    media.addEventListener('ended', function () { box.removeAttribute('data-playing') })
    media.addEventListener('timeupdate', draw)
    media.addEventListener('loadedmetadata', draw)
    media.addEventListener('durationchange', draw)

    if (bar) {
      var holding = false
      function seek(clientX) {
        var box2 = bar.getBoundingClientRect()
        if (!box2.width || !media.duration) return
        var part = Math.min(Math.max((clientX - box2.left) / box2.width, 0), 1)
        media.currentTime = part * media.duration
        draw()
      }
      bar.addEventListener('pointerdown', function (e) { holding = true; seek(e.clientX) })
      window.addEventListener('pointermove', function (e) { if (holding) seek(e.clientX) })
      window.addEventListener('pointerup', function () { holding = false })
      bar.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { media.currentTime = Math.min(media.currentTime + 5, media.duration || 0); draw() }
        if (e.key === 'ArrowLeft') { media.currentTime = Math.max(media.currentTime - 5, 0); draw() }
      })
    }

    draw()
  }

  /* A sound that simply runs. Nothing plays before somebody has touched the
     page, because a browser will not allow it and because being shouted at by
     a web page is rude. */
  function ambient(box) {
    var media = box.querySelector('[data-kob-media]')
    var button = box.querySelector('[data-kob-play]')
    if (!media || !button) return
    var refused = false

    button.addEventListener('click', function () {
      if (media.paused) { refused = false; media.play() } else { refused = true; media.pause() }
    })
    media.addEventListener('play', function () { box.setAttribute('data-playing', '') })
    media.addEventListener('pause', function () { box.removeAttribute('data-playing') })

    var begin = function () {
      if (!refused && media.paused) media.play().catch(function () {})
      window.removeEventListener('pointerdown', begin)
      window.removeEventListener('keydown', begin)
    }
    window.addEventListener('pointerdown', begin)
    window.addEventListener('keydown', begin)
  }

  document.querySelectorAll('[data-kob-player]').forEach(player)
  document.querySelectorAll('[data-kob-ambient]').forEach(ambient)
})()
`;function x(e){let t=new Set;for(let n of e)for(let e of n.content.matchAll(/kob:\/\/[A-Za-z]{3}-\d+/g))t.add(e[0].toLowerCase().replace(/^kob:\/\//,`kob://`)),t.add(e[0]);return[...t]}function S(e,t,n,r){let i=new Map(e.map(e=>[e.path,e.content])),a=i.get(`index.html`)??``;a=a.replace(/<link\b[^>]*href=["']\.?\/?([a-z0-9._/-]+\.css)["'][^>]*>/gi,(e,t)=>{let n=i.get(t.toLowerCase());return n===void 0?e:`<style>\n${n}\n</style>`});for(let[e,n]of t)a=a.split(e).join(y(n));return a=a.replace(/<div class="kob-ad" data-kob-ad="([a-z]+)"><\/div>/g,(e,t)=>{let r=n.get(t);return r===void 0?e:r?`<div class="kob-ad" data-kob-ad-id="${y(r.ad.id)}" role="link" tabindex="0"><img src="${y(r.url)}" alt="${y(r.ad.name)}" /></div>`:`<div class="kob-ad kob-ad-empty"><span>This space is for an ad</span></div>`}),a=a.replace(/kob:\/\/[A-Za-z]{3}-\d+/g,``),`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${y(v(r))}" />
<style>
html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:system-ui,sans-serif}
.kob-ad-empty{display:grid;place-items:center;height:100%;border:1px dashed currentColor;border-radius:8px;opacity:.4;font-size:12px}
[data-kob-ad-id]{cursor:pointer}
</style>
</head>
<body>
${a}
<script nonce="${r}">${b}<\/script>
</body>
</html>`}function C({files:t,title:r,className:i,spaceId:v,building:y}){let b=n(),C=p(),{profile:w}=f(),T=(0,g.useRef)(null),[E,D]=(0,g.useState)(new Map),[O,k]=(0,g.useState)(new Map),[A,j]=(0,g.useState)(null),[M,N]=(0,g.useState)(!1),P=(0,g.useMemo)(()=>x(t),[t]);(0,g.useEffect)(()=>{let e=!0;if(!P.length){D(new Map);return}return Promise.all(P.map(async e=>d(e)?[e,await a(e).catch(()=>null)]:[e,null])).then(t=>{e&&D(new Map(t.filter(([,e])=>!!e)))}),()=>{e=!1}},[P]);let F=(0,g.useMemo)(()=>{let e=t.find(e=>e.path===`index.html`)?.content??``;return[...new Set([...e.matchAll(/data-kob-ad="([a-z]+)"/g)].map(e=>e[1]))]},[t]);(0,g.useEffect)(()=>{let e=!0;if(y||!v||!F.length){k(new Map);return}return Promise.all(F.map(async e=>{let t=await l(e,v).catch(()=>null);if(!t)return[e,null];let n=await o(t.file_path,3600).catch(()=>null);return[e,n?{ad:t,url:n}:null]})).then(t=>{e&&k(new Map(t))}),()=>{e=!1}},[F,v,y]),(0,g.useEffect)(()=>{let e=async e=>{if(e.source!==T.current?.contentWindow)return;let t=e.data;if(t&&typeof t.kob==`string`){if(t.kob===`donate`){if(y){C(`This is how it will work once it is live.`,`info`);return}if(!w){C(`Make an account to give Kubes.`,`info`);return}j(Math.min(Math.max(Math.round(Number(t.amount)||0),1),1e4));return}if(t.kob===`ad-click`&&typeof t.id==`string`){if(y)return;let e=[...O.values()].find(e=>e?.ad.id===t.id);if(!e)return;await c(e.ad.id).catch(()=>{}),b(e.ad.target_path)}}};return window.addEventListener(`message`,e),()=>window.removeEventListener(`message`,e)},[O,y,b,w,C]);let I=async()=>{if(v&&A!==null){N(!0);try{let e=await s(v,A);C(`Given. You have ${e} Kubes left.`,`success`),j(null)}catch(e){C(e instanceof Error?e.message:`That did not go through.`,`error`)}finally{N(!1)}}},L=(0,g.useMemo)(()=>Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2),[t]),R=(0,g.useMemo)(()=>S(t,E,O,L),[t,E,O,L]);return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(`iframe`,{ref:T,title:r,srcDoc:R,sandbox:`allow-scripts`,referrerPolicy:`no-referrer`,className:e(`h-full w-full border-0 bg-white`,i)}),(0,_.jsx)(m,{open:A!==null,onClose:()=>j(null),title:`Give Kubes`,description:`A gift to whoever made this Space. Nothing is promised in return.`,size:`sm`,footer:(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(u,{variant:`ghost`,onClick:()=>j(null),children:`Cancel`}),(0,_.jsxs)(u,{loading:M,onClick:I,children:[(0,_.jsx)(h,{}),`Give `,A]})]}),children:(0,_.jsxs)(`p`,{className:`text-sm leading-relaxed text-muted`,children:[`This sends `,(0,_.jsx)(`span`,{className:`font-bold text-white`,children:A}),` Kubes from your account to the owner of this Space. It cannot be taken back.`]})})]})}export{C as t};
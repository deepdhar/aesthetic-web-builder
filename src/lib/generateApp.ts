/** Escape HTML special chars for template injection */
function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Escape a string for inline JS single-quote context */
function escJs(str: string): string {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

export interface GenerateAppOptions {
  siteName: string;
  playlistId: string;
  /** For zipped app: relative path e.g. "bg.jpg" */
  bgFile?: string;
  /** For fullscreen preview: base64 data URL of uploaded image */
  bgInlineB64?: string;
  /** For fullscreen preview: relative path to library image */
  bgRelPath?: string;
}

export function generateApp({
  siteName,
  playlistId,
  bgFile,
  bgInlineB64,
  bgRelPath,
}: GenerateAppOptions): string {
  let bgValue = 'none';
  if (bgInlineB64) bgValue = `url('${bgInlineB64}')`;
  else if (bgRelPath) bgValue = `url('${bgRelPath}')`;
  else if (bgFile) bgValue = `url('${bgFile}')`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(siteName)}</title>
  <meta name="description" content="${escHtml(siteName)} — an ambient music experience." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--success:#4ade80;--font-serif:'Playfair Display',Georgia,serif;--font-sans:'Inter',system-ui,sans-serif}
    html,body{height:100%;overflow:hidden;font-family:var(--font-sans);-webkit-font-smoothing:antialiased}
    body{display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:100vh;padding:20px 16px 16px;position:relative}
    .bg{position:fixed;inset:0;background:${bgValue} center/cover no-repeat;z-index:-1;background-color:#1a0a0a}
    .bg-overlay{position:fixed;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.15) 0%,transparent 40%,rgba(0,0,0,.45) 100%);z-index:-1;pointer-events:none}
    .live-badge{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:white;background:rgba(0,0,0,.25);padding:5px 14px;border-radius:20px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.15);white-space:nowrap}
    .live-dot{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 8px rgba(74,222,128,.9);position:relative}
    .live-dot::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--success);opacity:.75;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite}
    @keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}
    .site-title{flex:1;display:flex;align-items:center;justify-content:center;width:100%}
    .site-title h1{font-family:var(--font-serif);font-size:clamp(36px,8vw,80px);font-weight:700;color:white;text-align:center;text-shadow:0 4px 24px rgba(0,0,0,.5);letter-spacing:-1px;line-height:1.1;max-width:85vw;word-break:break-word}
    .player-wrap{width:100%;display:flex;justify-content:center;padding-bottom:4px}
    .player{width:100%;max-width:520px;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.1);backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);border:1px solid rgba(255,255,255,.2);border-radius:60px;padding:12px 20px 12px 12px;box-shadow:0 8px 40px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.25)}
    .vinyl{position:relative;width:70px;height:70px;flex-shrink:0}
    .vinyl-disc{width:100%;height:100%;border-radius:50%;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.6)}
    .vinyl-disc img{width:100%;height:100%;object-fit:cover;display:block;animation:spin 8s linear infinite;animation-play-state:paused}
    .vinyl-disc img.playing{animation-play-state:running}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .vinyl-hole{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:rgba(0,0,0,.7);border:2px solid rgba(255,255,255,.35);pointer-events:none}
    .player-info{flex:1;min-width:0}
    .song-title{font-size:14px;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;text-shadow:0 1px 4px rgba(0,0,0,.3)}
    .song-artist{font-size:12px;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px}
    .seek-wrap{position:relative;height:8px;width:100%;cursor:pointer;margin-bottom:4px}
    .seek-track{position:absolute;top:50%;left:0;right:0;height:3px;transform:translateY(-50%);background:rgba(255,255,255,.2);border-radius:2px;overflow:hidden}
    .seek-fill{height:100%;width:0%;background:rgba(255,255,255,.9);border-radius:2px;transition:width .5s linear}
    .seek-thumb{position:absolute;top:50%;left:0%;width:12px;height:12px;border-radius:50%;background:white;transform:translate(-50%,-50%);opacity:0;transition:opacity .15s,left .5s linear;box-shadow:0 1px 4px rgba(0,0,0,.4)}
    .seek-wrap:hover .seek-thumb{opacity:1}
    .time-display{font-size:10.5px;color:rgba(255,255,255,.5);font-variant-numeric:tabular-nums}
    .player-controls{display:flex;align-items:center;gap:4px;flex-shrink:0}
    .ctrl-btn{display:grid;place-items:center;width:36px;height:36px;border:none;border-radius:50%;background:transparent;color:rgba(255,255,255,.75);cursor:pointer;transition:background .15s,color .15s,transform .1s}
    .ctrl-btn:hover{background:rgba(255,255,255,.15);color:white}
    .ctrl-btn:active{transform:scale(.92)}
    .ctrl-btn.play-btn{width:44px;height:44px;background:white;color:#111;box-shadow:0 2px 12px rgba(0,0,0,.35)}
    .ctrl-btn.play-btn:hover{transform:scale(1.06)}
    #yt-player{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="bg-overlay" aria-hidden="true"></div>
  <div id="yt-player" aria-hidden="true"></div>
  <div class="live-badge" aria-live="polite">
    <span class="live-dot" aria-hidden="true"></span>
    <span id="listener-count">1</span>
    <span style="opacity:.7">online</span>
  </div>
  <div class="site-title"><h1>${escHtml(siteName)}</h1></div>
  <div class="player-wrap">
    <div class="player" role="region" aria-label="Music player">
      <div class="vinyl">
        <div class="vinyl-disc"><img id="album-art" src="" alt="Album artwork" /></div>
        <div class="vinyl-hole" aria-hidden="true"></div>
      </div>
      <div class="player-info">
        <p class="song-title" id="song-title">Loading\u2026</p>
        <p class="song-artist" id="song-artist">\u2014</p>
        <div class="seek-wrap" id="seek-wrap" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
          <div class="seek-track"><div class="seek-fill" id="seek-fill"></div></div>
          <div class="seek-thumb" id="seek-thumb"></div>
        </div>
        <div class="time-display"><span id="tc">0:00</span> <span style="opacity:.5">/</span> <span id="tt">0:00</span></div>
      </div>
      <div class="player-controls">
        <button class="ctrl-btn" id="btn-prev" aria-label="Previous track">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button class="ctrl-btn play-btn" id="btn-play" aria-label="Play" aria-pressed="false">
          <svg id="icon-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg id="icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-next" aria-label="Next track">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2 6L5.5 6v12z"/></svg>
        </button>
      </div>
    </div>
  </div>
  <script>
    'use strict';
    const PL='${escJs(playlistId)}';
    let player,ready=false,playing=false,ticker=null;
    const lel=document.getElementById('listener-count');
    let fc=Math.floor(Math.random()*40)+5; lel.textContent=fc;
    setInterval(()=>{fc+=Math.random()>.5?1:-1;fc=Math.max(1,Math.min(fc,120));lel.textContent=fc;},5000);
    const tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';document.head.appendChild(tag);
    function onYouTubeIframeAPIReady(){
      player=new YT.Player('yt-player',{height:'1',width:'1',playerVars:{listType:'playlist',list:PL,autoplay:0,controls:0,rel:0,shuffle:1},events:{onReady:r,onStateChange:s,onError:e}});
    }
    function r(){ready=true;player.setShuffle(true);info();document.getElementById('btn-play').disabled=false;}
    function s(ev){const S=YT.PlayerState;
      if(ev.data===S.PLAYING){playing=true;icon(true);start();info();document.getElementById('album-art').classList.add('playing');}
      else if(ev.data===S.PAUSED||ev.data===S.ENDED){playing=false;icon(false);stop();document.getElementById('album-art').classList.remove('playing');if(ev.data===S.ENDED)player.nextVideo();}
      else if(ev.data===S.BUFFERING)info();
    }
    function e(){setTimeout(()=>{if(ready)player.nextVideo();},1500);}
    function info(){if(!ready)return;try{const d=player.getVideoData();if(d&&d.title){const p=d.title.split(' - ');document.getElementById('song-title').textContent=p[0]||d.title;document.getElementById('song-artist').textContent=p[1]||d.author||'\u2014';}if(d&&d.video_id)document.getElementById('album-art').src='https://img.youtube.com/vi/'+d.video_id+'/mqdefault.jpg';}catch(x){}}
    function icon(p){document.getElementById('icon-play').style.display=p?'none':'';document.getElementById('icon-pause').style.display=p?'':'none';const b=document.getElementById('btn-play');b.setAttribute('aria-pressed',p);b.setAttribute('aria-label',p?'Pause':'Play');}
    function start(){stop();ticker=setInterval(tick,500);}
    function stop(){if(ticker){clearInterval(ticker);ticker=null;}}
    function tick(){if(!ready||!playing)return;try{const c=player.getCurrentTime()||0,t=player.getDuration()||0,p=t>0?(c/t)*100:0;document.getElementById('seek-fill').style.width=p+'%';document.getElementById('seek-thumb').style.left=p+'%';document.getElementById('seek-wrap').setAttribute('aria-valuenow',Math.round(p));document.getElementById('tc').textContent=fmt(c);document.getElementById('tt').textContent=fmt(t);}catch(x){}}
    function fmt(s){s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
    document.getElementById('seek-wrap').addEventListener('click',ev=>{if(!ready)return;const r=ev.currentTarget.getBoundingClientRect();player.seekTo(((ev.clientX-r.left)/r.width)*(player.getDuration()||0),true);});
    document.getElementById('btn-play').addEventListener('click',()=>{if(ready)playing?player.pauseVideo():player.playVideo();});
    document.getElementById('btn-prev').addEventListener('click',()=>{if(ready)player.getCurrentTime()>3?player.seekTo(0,true):player.previousVideo();});
    document.getElementById('btn-next').addEventListener('click',()=>{if(ready)player.nextVideo();});
    document.addEventListener('keydown',ev=>{if(['INPUT','TEXTAREA'].includes(ev.target.tagName))return;if(ev.code==='Space'){ev.preventDefault();document.getElementById('btn-play').click();}if(ev.code==='ArrowRight'){ev.preventDefault();document.getElementById('btn-next').click();}if(ev.code==='ArrowLeft'){ev.preventDefault();document.getElementById('btn-prev').click();}});
  <\/script>
</body>
</html>`;
}

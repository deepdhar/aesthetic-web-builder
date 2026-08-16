/* ══════════════════════════════════════════════════
   AESTHETIC WEB BUILDER — builder.js
   ══════════════════════════════════════════════════ */

'use strict';

// ── STATE ─────────────────────────────────────────
const state = {
  siteName:     '',
  playlistId:   '',
  bgMode:       'library',
  bgLibKey:     null,
  bgUploadB64:  null,
  bgUploadExt:  'jpg',
  bgUploadBlob: null,
};

// ── LIBRARY IMAGES ────────────────────────────────
// Add filenames here as you drop images into assets/images/
const LIBRARY_IMAGES = [];

// ── PREVIEW PLAYER STATE ──────────────────────────
let previewPlayer    = null;
let previewReady     = false;
let previewPlaying   = false;
let previewSeekTimer = null;
let currentPlaylistId = null;

// ── DOM REFS ──────────────────────────────────────
const elSiteName      = document.getElementById('site-name');
const elNameCount     = document.getElementById('name-count');
const elPlaylistUrl   = document.getElementById('playlist-url');
const elPlaylistStat  = document.getElementById('playlist-status');
const elUrlRow        = document.querySelector('.url-input-row');
const elImageLib      = document.getElementById('image-library');
const elLibEmpty      = document.getElementById('library-empty');
const elUploadZone    = document.getElementById('upload-zone');
const elFileInput     = document.getElementById('file-input');
const elUploadPrev    = document.getElementById('upload-preview');
const elUploadImg     = document.getElementById('upload-preview-img');
const elRemoveUpload  = document.getElementById('remove-upload');
const elGenerateBtn   = document.getElementById('generate-btn');
const elActionHint    = document.getElementById('action-hint');
const elPreviewApp    = document.getElementById('preview-app');
const elPreviewPh     = document.getElementById('preview-placeholder');
const elPaTitle       = document.getElementById('pa-title');
const elPaBg          = document.getElementById('pa-bg');
const elPaSongTitle   = document.getElementById('pa-song-title');
const elPaSongArtist  = document.getElementById('pa-song-artist');
const elPaSeekFill    = document.getElementById('pa-seek-fill');
const elPaTimeCur     = document.getElementById('pa-time-cur');
const elPaTimeTot     = document.getElementById('pa-time-tot');
const elPaVinylImg    = document.getElementById('pa-vinyl-img');
const elPaVinylPh     = document.getElementById('pa-vinyl-placeholder');
const elPaVinylInner  = document.getElementById('pa-vinyl-inner');
const elPaBtnPlay     = document.getElementById('pa-btn-play');
const elPaBtnPrev     = document.getElementById('pa-btn-prev');
const elPaBtnNext     = document.getElementById('pa-btn-next');
const elIconPlay      = document.getElementById('pa-icon-play');
const elIconPause     = document.getElementById('pa-icon-pause');
const elListenerCount = document.getElementById('pa-listener-count');
const elFullModal     = document.getElementById('fullscreen-modal');
const elFullIframe    = document.getElementById('fullscreen-iframe');

// ── INIT ──────────────────────────────────────────
(function init() {
  renderLibrary();
  bindEvents();
  startFakeListenerCount();
})();

// ── FAKE LISTENER COUNT ───────────────────────────
function startFakeListenerCount() {
  let count = Math.floor(Math.random() * 30) + 5;
  elListenerCount.textContent = `${count} online`;
  setInterval(() => {
    count += Math.random() > 0.5 ? 1 : -1;
    count = Math.max(1, Math.min(count, 120));
    elListenerCount.textContent = `${count} online`;
  }, 4000);
}

// ── RENDER LIBRARY ────────────────────────────────
function renderLibrary() {
  if (LIBRARY_IMAGES.length === 0) {
    elLibEmpty.style.display = 'flex';
    return;
  }
  elLibEmpty.style.display = 'none';
  LIBRARY_IMAGES.forEach(filename => {
    const item = document.createElement('div');
    item.className = 'library-item';
    item.dataset.key = filename;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Select ${filename}`);
    const img = document.createElement('img');
    img.src = `assets/images/${filename}`;
    img.alt = filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ');
    img.loading = 'lazy';
    item.appendChild(img);
    item.addEventListener('click', () => selectLibraryImage(filename));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectLibraryImage(filename); });
    elImageLib.appendChild(item);
  });
}

function selectLibraryImage(filename) {
  state.bgLibKey = filename;
  state.bgMode = 'library';
  document.querySelectorAll('.library-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.key === filename);
  });
  updatePreview();
  updateButtonState();
}

// ── TAB SWITCHER ──────────────────────────────────
function switchTab(tab) {
  state.bgMode = tab;
  document.getElementById('tab-library').classList.toggle('active', tab === 'library');
  document.getElementById('tab-upload').classList.toggle('active', tab === 'upload');
  document.getElementById('tab-library').setAttribute('aria-selected', tab === 'library');
  document.getElementById('tab-upload').setAttribute('aria-selected', tab === 'upload');
  const panelLib    = document.getElementById('panel-library');
  const panelUpload = document.getElementById('panel-upload');
  if (tab === 'library') {
    panelLib.classList.add('active');    panelLib.classList.remove('hidden');
    panelUpload.classList.remove('active'); panelUpload.classList.add('hidden');
  } else {
    panelUpload.classList.add('active');    panelUpload.classList.remove('hidden');
    panelLib.classList.remove('active'); panelLib.classList.add('hidden');
  }
  updatePreview();
  updateButtonState();
}
window.switchTab = switchTab;

// ── EVENTS ────────────────────────────────────────
function bindEvents() {
  // Site name
  elSiteName.addEventListener('input', () => {
    state.siteName = elSiteName.value.trim();
    elNameCount.textContent = `${elSiteName.value.length} / 40`;
    updatePreview();
    updateButtonState();
  });

  // Playlist URL
  elPlaylistUrl.addEventListener('input', handlePlaylistInput);
  elPlaylistUrl.addEventListener('paste', () => setTimeout(handlePlaylistInput, 50));

  // File upload
  elFileInput.addEventListener('change', () => {
    if (elFileInput.files[0]) handleFileUpload(elFileInput.files[0]);
  });

  // Drag-and-drop
  const zone = elUploadZone;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFileUpload(file);
  });

  // Remove upload
  elRemoveUpload.addEventListener('click', () => {
    state.bgUploadB64 = null;
    state.bgUploadBlob = null;
    elUploadZone.classList.remove('hidden');
    elUploadPrev.classList.add('hidden');
    elUploadImg.src = '';
    elFileInput.value = '';
    updatePreview();
    updateButtonState();
  });

  // Preview player controls
  elPaBtnPlay.addEventListener('click', () => {
    if (!previewReady) return;
    previewPlaying ? previewPlayer.pauseVideo() : previewPlayer.playVideo();
  });
  elPaBtnPrev.addEventListener('click', () => {
    if (!previewReady) return;
    previewPlayer.getCurrentTime() > 3 ? previewPlayer.seekTo(0, true) : previewPlayer.previousVideo();
  });
  elPaBtnNext.addEventListener('click', () => {
    if (previewReady) previewPlayer.nextVideo();
  });

  // Download
  elGenerateBtn.addEventListener('click', downloadZip);

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFullPreview();
  });
}

// ── PLAYLIST URL HANDLER ──────────────────────────
function handlePlaylistInput() {
  const raw = elPlaylistUrl.value.trim();
  const id  = extractPlaylistId(raw);

  if (!raw) {
    state.playlistId = '';
    setPlaylistStatus('', '');
    elUrlRow.classList.remove('valid', 'error');
  } else if (id) {
    state.playlistId = id;
    setPlaylistStatus('ok', `✓ Playlist ID: ${id}`);
    elUrlRow.classList.add('valid');
    elUrlRow.classList.remove('error');
    initPreviewPlayer(id);     // ← load playlist in live preview
  } else {
    state.playlistId = '';
    setPlaylistStatus('err', '✕ Couldn\'t find a playlist ID — check your URL');
    elUrlRow.classList.add('error');
    elUrlRow.classList.remove('valid');
  }

  updatePreview();
  updateButtonState();
}

function extractPlaylistId(url) {
  try {
    if (/^[A-Za-z0-9_-]{10,}$/.test(url)) return url;
    const u = new URL(url);
    return u.searchParams.get('list') || null;
  } catch {
    const m = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }
}

function setPlaylistStatus(type, msg) {
  elPlaylistStat.textContent = msg;
  elPlaylistStat.className = 'playlist-status' + (type ? ` ${type}` : '');
}

// ── PREVIEW YOUTUBE PLAYER ────────────────────────
function initPreviewPlayer(playlistId) {
  if (currentPlaylistId === playlistId) return; // already loaded
  currentPlaylistId = playlistId;

  // Teardown old player
  if (previewPlayer) {
    try { previewPlayer.destroy(); } catch (e) { /* ignore */ }
    previewPlayer = null;
    previewReady  = false;
    previewPlaying = false;
    stopPreviewSeekTicker();
    setPreviewPlayIcon(false);
  }

  const container = document.getElementById('preview-yt-container');
  container.innerHTML = '';
  const div = document.createElement('div');
  div.id = 'preview-yt-player-el';
  container.appendChild(div);

  elPaSongTitle.textContent  = 'Loading playlist…';
  elPaSongArtist.textContent = 'Please wait';

  if (typeof YT === 'undefined' || !YT.Player) {
    // YT API not loaded yet — will be called from onYouTubeIframeAPIReady
    window._pendingPlaylistId = playlistId;
    return;
  }

  previewPlayer = new YT.Player('preview-yt-player-el', {
    height: '1', width: '1',
    playerVars: { listType: 'playlist', list: playlistId, autoplay: 0, controls: 0, rel: 0 },
    events: {
      onReady:       onPreviewReady,
      onStateChange: onPreviewStateChange,
      onError:       onPreviewError,
    },
  });
}

// Called by YouTube IFrame API once the script loads
window.onYouTubeIframeAPIReady = function() {
  if (window._pendingPlaylistId) {
    const id = window._pendingPlaylistId;
    window._pendingPlaylistId = null;
    initPreviewPlayer(id);
  }
};

function onPreviewReady() {
  previewReady = true;
  elPaSongTitle.textContent  = 'Playlist Loaded ✓';
  elPaSongArtist.textContent = 'Press play to start';
  elPaBtnPlay.disabled = false;
  updatePreviewTrackInfo();
}

function onPreviewStateChange(e) {
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) {
    previewPlaying = true;
    setPreviewPlayIcon(true);
    startPreviewSeekTicker();
    updatePreviewTrackInfo();
    elPaVinylInner.style.animationPlayState = 'running';
  } else if (e.data === S.PAUSED || e.data === S.ENDED) {
    previewPlaying = false;
    setPreviewPlayIcon(false);
    stopPreviewSeekTicker();
    elPaVinylInner.style.animationPlayState = 'paused';
    if (e.data === S.ENDED) previewPlayer.nextVideo();
  } else if (e.data === S.BUFFERING) {
    updatePreviewTrackInfo();
  }
}

function onPreviewError() {
  elPaSongTitle.textContent  = 'Playback error';
  elPaSongArtist.textContent = 'Try another playlist';
  setTimeout(() => { if (previewReady) previewPlayer.nextVideo(); }, 1500);
}

function updatePreviewTrackInfo() {
  if (!previewReady) return;
  try {
    const data = previewPlayer.getVideoData();
    if (data && data.title) {
      const parts = data.title.split(' - ');
      elPaSongTitle.textContent  = parts[0] || data.title;
      elPaSongArtist.textContent = parts[1] || data.author || '—';
    }
    if (data && data.video_id) {
      elPaVinylImg.src = `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`;
      elPaVinylImg.style.display    = 'block';
      elPaVinylPh.style.display     = 'none';
    }
  } catch (e) { /* ignore */ }
}

function setPreviewPlayIcon(playing) {
  elIconPlay.style.display  = playing ? 'none' : '';
  elIconPause.style.display = playing ? ''     : 'none';
  elPaBtnPlay.setAttribute('aria-pressed', String(playing));
  elPaBtnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function startPreviewSeekTicker() {
  stopPreviewSeekTicker();
  previewSeekTimer = setInterval(updatePreviewSeekBar, 500);
}

function stopPreviewSeekTicker() {
  if (previewSeekTimer) { clearInterval(previewSeekTimer); previewSeekTimer = null; }
}

function updatePreviewSeekBar() {
  if (!previewReady || !previewPlaying) return;
  try {
    const cur   = previewPlayer.getCurrentTime() || 0;
    const total = previewPlayer.getDuration()    || 0;
    const pct   = total > 0 ? (cur / total) * 100 : 0;
    elPaSeekFill.style.width = pct + '%';
    elPaTimeCur.textContent  = fmtTime(cur);
    elPaTimeTot.textContent  = fmtTime(total);
  } catch (e) { /* ignore */ }
}

function fmtTime(sec) {
  const s = Math.floor(sec);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ── FILE UPLOAD ───────────────────────────────────
function handleFileUpload(file) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 10 * 1024 * 1024) {
    alert('Image is too large (max 10 MB). Please choose a smaller file.');
    return;
  }
  const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
  state.bgUploadExt  = ext;
  state.bgUploadBlob = file;
  const reader = new FileReader();
  reader.onload = e => {
    state.bgUploadB64 = e.target.result;
    elUploadImg.src = e.target.result;
    elUploadZone.classList.add('hidden');
    elUploadPrev.classList.remove('hidden');
    updatePreview();
    updateButtonState();
  };
  reader.readAsDataURL(file);
}

// ── LIVE PREVIEW ──────────────────────────────────
function updatePreview() {
  const hasName = state.siteName.length > 0;
  const hasBg   = currentBgCss() !== null;
  const hasAny  = hasName || hasBg || state.playlistId;

  if (!hasAny) {
    elPreviewApp.classList.add('hidden');
    elPreviewPh.style.display = 'flex';
    return;
  }

  elPreviewApp.classList.remove('hidden');
  elPreviewPh.style.display = 'none';
  elPaTitle.textContent = state.siteName || 'Your Site';

  const bg = currentBgCss();
  elPaBg.style.backgroundImage = bg || 'none';
  elPaBg.style.backgroundColor = bg ? '' : '#1a0a0a';
}

function currentBgCss() {
  if (state.bgMode === 'upload' && state.bgUploadB64)
    return `url(${state.bgUploadB64})`;
  if (state.bgMode === 'library' && state.bgLibKey)
    return `url(assets/images/${state.bgLibKey})`;
  return null;
}

// ── BUTTON STATE ──────────────────────────────────
function updateButtonState() {
  const hasName     = state.siteName.length > 0;
  const hasPlaylist = state.playlistId.length > 0;
  const hasBg       = (state.bgMode === 'upload' && state.bgUploadB64) ||
                      (state.bgMode === 'library' && state.bgLibKey);
  const ready = hasName && hasPlaylist && hasBg;
  elGenerateBtn.disabled = !ready;

  const missing = [];
  if (!hasName)     missing.push('site name');
  if (!hasPlaylist) missing.push('playlist URL');
  if (!hasBg)       missing.push('background image');
  elActionHint.textContent = missing.length > 0
    ? `Still needed: ${missing.join(', ')}.`
    : '✓ Ready to download!';
}

// ── FULLSCREEN PREVIEW ────────────────────────────
function openFullPreview() {
  if (!state.playlistId) {
    alert('Please paste a YouTube playlist URL first.');
    return;
  }
  const bgFilename = state.bgMode === 'upload'
    ? `bg.${state.bgUploadExt}`
    : (state.bgLibKey ? state.bgLibKey : null);

  const html = generateApp(
    state.siteName || 'Preview',
    state.playlistId,
    bgFilename,
    state.bgMode === 'upload' ? state.bgUploadB64 : null,
    state.bgMode === 'library' && state.bgLibKey ? `assets/images/${state.bgLibKey}` : null
  );

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  elFullIframe.src = url;
  elFullModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Revoke after load
  elFullIframe.onload = () => setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function closeFullPreview() {
  elFullModal.classList.add('hidden');
  elFullIframe.src = 'about:blank';
  document.body.style.overflow = '';
}

window.openFullPreview  = openFullPreview;
window.closeFullPreview = closeFullPreview;

// ── DOWNLOAD ZIP ──────────────────────────────────
async function downloadZip() {
  if (elGenerateBtn.disabled) return;
  elGenerateBtn.classList.add('loading');
  elGenerateBtn.disabled = true;
  try {
    const zip = new JSZip();
    let bgFilename, bgBlob;

    if (state.bgMode === 'upload' && state.bgUploadBlob) {
      bgFilename = `bg.${state.bgUploadExt}`;
      bgBlob     = state.bgUploadBlob;
    } else if (state.bgMode === 'library' && state.bgLibKey) {
      const ext  = state.bgLibKey.split('.').pop();
      bgFilename = `bg.${ext}`;
      const resp = await fetch(`assets/images/${state.bgLibKey}`);
      bgBlob     = await resp.blob();
    }

    zip.file(bgFilename, bgBlob);
    const appHtml = generateApp(state.siteName, state.playlistId, bgFilename, null, null);
    zip.file('index.html', appHtml);

    const content  = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const safeName = state.siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const url      = URL.createObjectURL(content);
    const a        = document.createElement('a');
    a.href = url; a.download = `${safeName || 'my-site'}-app.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    elActionHint.textContent = '✓ Downloaded! Open index.html to run your app.';
  } catch (err) {
    console.error('ZIP generation failed:', err);
    elActionHint.textContent = '✕ Something went wrong. Please try again.';
  } finally {
    elGenerateBtn.classList.remove('loading');
    elGenerateBtn.disabled = false;
  }
}

// ── APP TEMPLATE ENGINE ───────────────────────────
// bgInlineB64: for fullscreen preview embed, pass base64 directly
// bgRelPath:   for fullscreen preview of library image, pass relative path
function generateApp(siteName, playlistId, bgFilename, bgInlineB64, bgRelPath) {
  // Determine the background CSS value
  let bgValue;
  if (bgInlineB64)   bgValue = `url('${bgInlineB64}')`;
  else if (bgRelPath) bgValue = `url('${bgRelPath}')`;
  else               bgValue = bgFilename ? `url('${bgFilename}')` : 'none';

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
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --success: #4ade80; --font-serif: 'Playfair Display', Georgia, serif; --font-sans: 'Inter', system-ui, sans-serif; }
    html, body { height: 100%; overflow: hidden; font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
    body { display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 100vh; padding: 20px 16px 16px; position: relative; }

    .bg { position: fixed; inset: 0; background: ${bgValue} center/cover no-repeat; z-index: -1; background-color: #1a0a0a; }
    .bg-overlay { position: fixed; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.45) 100%); z-index: -1; pointer-events: none; }

    /* Live badge — top center */
    .live-badge {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 20;
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 500; color: white;
      background: rgba(0,0,0,0.25); padding: 5px 14px;
      border-radius: 20px;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      white-space: nowrap;
    }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px rgba(74,222,128,0.9); position: relative; }
    .live-dot::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--success); opacity: 0.75; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
    @keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }

    .site-title { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
    .site-title h1 { font-family: var(--font-serif); font-size: clamp(36px, 8vw, 80px); font-weight: 700; color: white; text-align: center; text-shadow: 0 4px 24px rgba(0,0,0,0.5); letter-spacing: -1px; line-height: 1.1; max-width: 85vw; word-break: break-word; }

    .player-wrap { width: 100%; display: flex; justify-content: center; padding-bottom: 4px; }
    .player { width: 100%; max-width: 520px; display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.1); backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%); border: 1px solid rgba(255,255,255,0.2); border-radius: 60px; padding: 12px 20px 12px 12px; box-shadow: 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25); }

    .vinyl { position: relative; width: 70px; height: 70px; flex-shrink: 0; }
    .vinyl-disc { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.6); }
    .vinyl-disc img { width: 100%; height: 100%; object-fit: cover; display: block; animation: spin 8s linear infinite; animation-play-state: paused; }
    .vinyl-disc img.playing { animation-play-state: running; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .vinyl-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 14px; height: 14px; border-radius: 50%; background: rgba(0,0,0,0.7); border: 2px solid rgba(255,255,255,0.35); pointer-events: none; }

    .player-info { flex: 1; min-width: 0; }
    .song-title { font-size: 14px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    .song-artist { font-size: 12px; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; }

    .seek-wrap { position: relative; height: 8px; width: 100%; cursor: pointer; margin-bottom: 4px; }
    .seek-track { position: absolute; top: 50%; left: 0; right: 0; height: 3px; transform: translateY(-50%); background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; }
    .seek-fill { height: 100%; width: 0%; background: rgba(255,255,255,0.9); border-radius: 2px; transition: width 0.5s linear; }
    .seek-thumb { position: absolute; top: 50%; left: 0%; width: 12px; height: 12px; border-radius: 50%; background: white; transform: translate(-50%,-50%); opacity: 0; transition: opacity 0.15s, left 0.5s linear; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .seek-wrap:hover .seek-thumb { opacity: 1; }
    .time-display { font-size: 10.5px; color: rgba(255,255,255,0.5); font-variant-numeric: tabular-nums; }

    .player-controls { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .ctrl-btn { display: grid; place-items: center; width: 36px; height: 36px; border: none; border-radius: 50%; background: transparent; color: rgba(255,255,255,0.75); cursor: pointer; transition: background 0.15s, color 0.15s, transform 0.1s; }
    .ctrl-btn:hover { background: rgba(255,255,255,0.15); color: white; }
    .ctrl-btn:active { transform: scale(0.92); }
    .ctrl-btn.play-btn { width: 44px; height: 44px; background: white; color: #111; box-shadow: 0 2px 12px rgba(0,0,0,0.35); }
    .ctrl-btn.play-btn:hover { transform: scale(1.06); }

    #yt-player { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="bg-overlay" aria-hidden="true"></div>
  <div id="yt-player" aria-hidden="true"></div>

  <div class="live-badge" aria-live="polite">
    <span class="live-dot" aria-hidden="true"></span>
    <span id="listener-count">1</span>
    <span style="opacity:0.7">online</span>
  </div>

  <div class="site-title">
    <h1>${escHtml(siteName)}</h1>
  </div>

  <div class="player-wrap">
    <div class="player" role="region" aria-label="Music player">
      <div class="vinyl">
        <div class="vinyl-disc">
          <img id="album-art" src="" alt="Album artwork" />
        </div>
        <div class="vinyl-hole" aria-hidden="true"></div>
      </div>
      <div class="player-info">
        <p class="song-title" id="song-title">Loading…</p>
        <p class="song-artist" id="song-artist">—</p>
        <div class="seek-wrap" id="seek-wrap" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
          <div class="seek-track"><div class="seek-fill" id="seek-fill"></div></div>
          <div class="seek-thumb" id="seek-thumb"></div>
        </div>
        <div class="time-display"><span id="time-current">0:00</span> <span style="opacity:0.5">/</span> <span id="time-total">0:00</span></div>
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
    const PLAYLIST_ID = '${escJs(playlistId)}';
    let player, isReady = false, isPlaying = false, seekInterval = null;

    const listenerEl = document.getElementById('listener-count');
    let fakeCount = Math.floor(Math.random() * 40) + 5;
    listenerEl.textContent = fakeCount;
    setInterval(() => { fakeCount += Math.random() > 0.5 ? 1 : -1; fakeCount = Math.max(1, Math.min(fakeCount, 120)); listenerEl.textContent = fakeCount; }, 5000);

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('yt-player', {
        height: '1', width: '1',
        playerVars: { listType: 'playlist', list: PLAYLIST_ID, autoplay: 0, controls: 0, rel: 0, shuffle: 1 },
        events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange, onError: onPlayerError },
      });
    }
    function onPlayerReady() {
      isReady = true; player.setShuffle(true); updateTrackInfo();
      document.getElementById('btn-play').disabled = false;
    }
    function onPlayerStateChange(e) {
      const S = YT.PlayerState;
      if (e.data === S.PLAYING) { isPlaying = true; setPlayIcon(true); startSeekTicker(); updateTrackInfo(); document.getElementById('album-art').classList.add('playing'); }
      else if (e.data === S.PAUSED || e.data === S.ENDED) { isPlaying = false; setPlayIcon(false); stopSeekTicker(); document.getElementById('album-art').classList.remove('playing'); if (e.data === S.ENDED) player.nextVideo(); }
      else if (e.data === S.BUFFERING) { updateTrackInfo(); }
    }
    function onPlayerError(e) { console.warn('YT error:', e.data); setTimeout(() => { if (isReady) player.nextVideo(); }, 1500); }
    function updateTrackInfo() {
      if (!isReady) return;
      try {
        const d = player.getVideoData();
        if (d && d.title) { const p = d.title.split(' - '); document.getElementById('song-title').textContent = p[0] || d.title; document.getElementById('song-artist').textContent = p[1] || d.author || '—'; }
        if (d && d.video_id) document.getElementById('album-art').src = \`https://img.youtube.com/vi/\${d.video_id}/mqdefault.jpg\`;
      } catch(e) {}
    }
    function setPlayIcon(p) {
      document.getElementById('icon-play').style.display = p ? 'none' : '';
      document.getElementById('icon-pause').style.display = p ? '' : 'none';
      document.getElementById('btn-play').setAttribute('aria-pressed', p);
      document.getElementById('btn-play').setAttribute('aria-label', p ? 'Pause' : 'Play');
    }
    function startSeekTicker() { stopSeekTicker(); seekInterval = setInterval(tick, 500); }
    function stopSeekTicker()  { if (seekInterval) { clearInterval(seekInterval); seekInterval = null; } }
    function tick() {
      if (!isReady || !isPlaying) return;
      try {
        const cur = player.getCurrentTime() || 0, tot = player.getDuration() || 0, pct = tot > 0 ? (cur/tot)*100 : 0;
        document.getElementById('seek-fill').style.width = pct + '%';
        document.getElementById('seek-thumb').style.left = pct + '%';
        document.getElementById('seek-wrap').setAttribute('aria-valuenow', Math.round(pct));
        document.getElementById('time-current').textContent = fmt(cur);
        document.getElementById('time-total').textContent   = fmt(tot);
      } catch(e) {}
    }
    function fmt(s) { s = Math.floor(s); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }

    document.getElementById('seek-wrap').addEventListener('click', e => {
      if (!isReady) return;
      const r = e.currentTarget.getBoundingClientRect();
      player.seekTo(((e.clientX - r.left) / r.width) * (player.getDuration() || 0), true);
    });
    document.getElementById('btn-play').addEventListener('click', () => { if (isReady) isPlaying ? player.pauseVideo() : player.playVideo(); });
    document.getElementById('btn-prev').addEventListener('click', () => { if (isReady) player.getCurrentTime() > 3 ? player.seekTo(0, true) : player.previousVideo(); });
    document.getElementById('btn-next').addEventListener('click', () => { if (isReady) player.nextVideo(); });
    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); document.getElementById('btn-play').click(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); document.getElementById('btn-next').click(); }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); document.getElementById('btn-prev').click(); }
    });
  <\/script>
</body>
</html>`;
}

// ── HELPERS ───────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
function escJs(str) {
  return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
}

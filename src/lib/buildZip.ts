import JSZip from 'jszip';

export interface BuildZipOptions {
  siteName: string;
  playlistId: string;
  bgBlob: Blob;
  bgFilename: string;
}

export async function buildZip({ siteName, playlistId, bgBlob, bgFilename }: BuildZipOptions): Promise<Blob> {
  const zip = new JSZip();
  const safeName = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'aesthetic-music-app';
  const cleanTitle = siteName.replace(/\n+/g, ' ').trim();

  // 1. package.json
  zip.file('package.json', JSON.stringify({
    name: safeName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^15.1.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@types/youtube': '^0.3.0',
      typescript: '^5.0.0',
    },
  }, null, 2));

  // 2. tsconfig.json
  zip.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2));

  // 3. next.config.mjs
  zip.file('next.config.mjs', `/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
`);

  // 4. .gitignore
  zip.file('.gitignore', `# dependencies
/node_modules
/.pnp
.pnp.*

# testing
/coverage

# next.js
/.next/
/out/
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env files
.env*
`);

  // 5. README.md
  zip.file('README.md', `# ${cleanTitle}

An aesthetic nostalgic ambient web player built with **Next.js (App Router)** and **YouTube IFrame API**.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎵 Features
- **YouTube Playlist Integration**: Streams music seamlessly via YouTube IFrame API.
- **Glassmorphism Music Player**: Vinyl rotation, interactive seekbar, track info, and playback controls.
- **Keyboard Shortcuts**:
  - \`Space\`: Play / Pause
  - \`Arrow Right\`: Next Track
  - \`Arrow Left\`: Previous Track / Rewind
`);

  // 6. Public Assets (Background)
  const bgBuffer = await bgBlob.arrayBuffer();
  zip.file(`public/${bgFilename}`, bgBuffer);

  // 7. src/app/globals.css
  zip.file('src/app/globals.css', `*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --font-serif: var(--font-playfair), 'Playfair Display', Georgia, serif;
  --font-sans: var(--font-inter), 'Inter', system-ui, sans-serif;
  --success: #4ade80;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  background: #0b0c0f;
  color: #f0f0f0;
}
`);

  // 8. src/app/layout.tsx
  zip.file('src/app/layout.tsx', `import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: ${JSON.stringify(cleanTitle)},
  description: ${JSON.stringify(`${cleanTitle} — an ambient music experience.`)},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={\`\${inter.variable} \${playfair.variable}\`}>
      <body>{children}</body>
    </html>
  );
}
`);

  // 9. src/app/page.tsx
  zip.file('src/app/page.tsx', `import Player from '@/components/Player';
import Clock from '@/components/Clock';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div
        className={styles.bg}
        style={{ backgroundImage: "url('/${bgFilename}')" }}
        aria-hidden="true"
      />
      <div className={styles.bgOverlay} aria-hidden="true" />
      <Clock />

      <div className={styles.titleWrap}>
        <h1 className={styles.title}>${siteName.replace(/`/g, '\\`')}</h1>
      </div>

      <div className={styles.playerWrap}>
        <Player playlistId=${JSON.stringify(playlistId)} />
      </div>
    </main>
  );
}
`);

  // 10. src/app/page.module.css
  zip.file('src/app/page.module.css', `.main {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 24px 16px 20px;
  overflow: hidden;
}

.bg {
  position: fixed;
  inset: 0;
  background-image: url('/${bgFilename}');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #1a0a0a;
  z-index: 0;
}

.bgOverlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.45) 100%);
  z-index: 1;
  pointer-events: none;
}

.titleWrap {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 16px;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(52px, 11vw, 110px);
  font-weight: 800;
  color: white;
  text-align: center;
  text-shadow: 0 6px 36px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.65);
  letter-spacing: -1.5px;
  line-height: 1.02;
  max-width: 90vw;
  word-break: break-word;
  white-space: pre-line;
}

.playerWrap {
  position: relative;
  z-index: 10;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
}
`);

  // 11. src/components/Player.tsx
  zip.file('src/components/Player.tsx', `'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './Player.module.css';

interface PlayerProps {
  playlistId: string;
}

interface TrackInfo {
  title: string;
  artist: string;
  videoId: string | null;
}

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function fmt(sec: number): string {
  const s = Math.floor(sec);
  return \`\${Math.floor(s / 60)}:\${String(s % 60).padStart(2, '0')}\`;
}

export default function Player({ playlistId }: PlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState<TrackInfo>({
    title: 'Loading playlist...',
    artist: 'Please wait',
    videoId: null,
  });
  const [seekPct, setSeekPct] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('0:00');

  const stopTicker = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const updateTrack = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const d = p.getVideoData();
      if (d?.title) {
        const parts = d.title.split(' - ');
        setTrack({
          title: parts[0] || d.title,
          artist: parts[1] || (d as { author?: string }).author || '—',
          videoId: d.video_id || null,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    tickerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const cur = p.getCurrentTime() || 0;
        const tot = p.getDuration() || 0;
        const pct = tot > 0 ? (cur / tot) * 100 : 0;
        setSeekPct(pct);
        setCurrentTime(fmt(cur));
        setTotalTime(fmt(tot));
      } catch {
        // ignore
      }
    }, 500);
  }, [stopTicker]);

  useEffect(() => {
    let unmounted = false;

    function initYT() {
      if (unmounted) return;
      playerRef.current = new window.YT.Player('hidden-yt-player', {
        height: '1',
        width: '1',
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 0,
          controls: 0,
          rel: 0,
          shuffle: 1,
        },
        events: {
          onReady() {
            setReady(true);
            playerRef.current?.setShuffle(true);
            setTrack({ title: 'Playlist Ready', artist: 'Press play to start', videoId: null });
            updateTrack();
          },
          onStateChange(e: YT.OnStateChangeEvent) {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setPlaying(true);
              startTicker();
              updateTrack();
            } else if (e.data === S.PAUSED || e.data === S.ENDED) {
              setPlaying(false);
              stopTicker();
              if (e.data === S.ENDED) playerRef.current?.nextVideo();
            } else if (e.data === S.BUFFERING) {
              updateTrack();
            }
          },
          onError() {
            setTrack({ title: 'Playback error', artist: 'Skipping...', videoId: null });
            setTimeout(() => playerRef.current?.nextVideo(), 1500);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      window.onYouTubeIframeAPIReady = initYT;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    return () => {
      unmounted = true;
      stopTicker();
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
    };
  }, [playlistId, startTicker, stopTicker, updateTrack]);

  const togglePlay = () => {
    if (!ready || !playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const prev = () => {
    if (!ready || !playerRef.current) return;
    if (playerRef.current.getCurrentTime() > 3) {
      playerRef.current.seekTo(0, true);
    } else {
      playerRef.current.previousVideo();
    }
  };

  const next = () => {
    if (!ready || !playerRef.current) return;
    playerRef.current.nextVideo();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ready || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const dur = playerRef.current.getDuration() || 0;
    if (dur > 0) playerRef.current.seekTo(pct * dur, true);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className={styles.player} role="region" aria-label="Music player">
      <div id="hidden-yt-player" className={styles.hiddenYt} aria-hidden="true" />

      {/* Vinyl Disc */}
      <div className={styles.vinyl}>
        <div className={\`\${styles.vinylDisc} \${playing ? styles.spinning : ''}\`}>
          {track.videoId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={\`https://img.youtube.com/vi/\${track.videoId}/mqdefault.jpg\`}
              alt="Album artwork"
              className={styles.vinylImg}
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.5" aria-hidden="true">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
            </svg>
          )}
        </div>
        <div className={styles.vinylHole} aria-hidden="true" />
      </div>

      {/* Track Info & Progress */}
      <div className={styles.info}>
        <p className={styles.songTitle}>{track.title}</p>
        <p className={styles.songArtist}>{track.artist}</p>
        <div
          className={styles.seekWrap}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(seekPct)}
          tabIndex={0}
          onClick={handleSeek}
        >
          <div className={styles.seekTrack}>
            <div className={styles.seekFill} style={{ width: \`\${seekPct}%\` }} />
          </div>
          <div className={styles.seekThumb} style={{ left: \`\${seekPct}%\` }} />
        </div>
        <div className={styles.timeDisplay}>
          <span>{currentTime}</span>
          <span style={{ opacity: 0.5 }}> / </span>
          <span>{totalTime}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className={styles.controls}>
        <button className={styles.ctrl} onClick={prev} disabled={!ready} aria-label="Previous track">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button
          className={\`\${styles.ctrl} \${styles.ctrlPlay}\`}
          onClick={togglePlay}
          disabled={!ready}
          aria-label={playing ? 'Pause' : 'Play'}
          aria-pressed={playing}
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button className={styles.ctrl} onClick={next} disabled={!ready} aria-label="Next track">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2 6L5.5 6v12z"/></svg>
        </button>
      </div>
    </div>
  );
}
`);

  // 12. src/components/Player.module.css
  zip.file('src/components/Player.module.css', `.player {
  width: 100%;
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 60px;
  padding: 12px 20px 12px 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.hiddenYt {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.vinyl {
  position: relative;
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.vinylDisc {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.spinning {
  animation: spin 8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vinylImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinylHole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

.info {
  flex: 1;
  min-width: 0;
}

.songTitle {
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.songArtist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.seekWrap {
  position: relative;
  height: 8px;
  width: 100%;
  cursor: pointer;
  margin-bottom: 4px;
}

.seekTrack {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.seekFill {
  height: 100%;
  width: 0%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  transition: width 0.5s linear;
}

.seekThumb {
  position: absolute;
  top: 50%;
  left: 0%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.15s, left 0.5s linear;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.seekWrap:hover .seekThumb {
  opacity: 1;
}

.timeDisplay {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

.controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ctrl {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}

.ctrl:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.ctrl:active:not(:disabled) {
  transform: scale(0.92);
}

.ctrl:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ctrlPlay {
  width: 44px;
  height: 44px;
  background: white;
  color: #111;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.ctrlPlay:hover:not(:disabled) {
  transform: scale(1.06);
  background: white;
}
`);

  // 13. src/components/Clock.tsx
  zip.file('src/components/Clock.tsx', `'use client';

import { useEffect, useState } from 'react';
import styles from './Clock.module.css';

export default function Clock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase());
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return <div className={styles.clock}>{time}</div>;
}
`);

  // 14. src/components/Clock.module.css
  zip.file('src/components/Clock.module.css', `.clock {
  position: fixed;
  top: 20px;
  left: 24px;
  z-index: 20;
  font-size: 14px;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  opacity: 0.95;
  user-select: none;
}
`);

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}


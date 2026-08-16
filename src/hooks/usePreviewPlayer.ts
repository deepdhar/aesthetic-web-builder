'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TrackInfo {
  title: string;
  artist: string;
  videoId: string | null;
}

export interface PreviewPlayerState {
  ready: boolean;
  playing: boolean;
  track: TrackInfo;
  seekPct: number;
  currentTime: string;
  totalTime: string;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (pct: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_TRACK: TrackInfo = { title: 'Playlist Ready', artist: 'Hit play to start', videoId: null };

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
    _ytApiCallbacks?: Array<() => void>;
  }
}

function fmt(sec: number): string {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

let ytApiLoading = false;
let ytApiLoaded = false;

function loadYTApi(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  if (!window._ytApiCallbacks) window._ytApiCallbacks = [];

  return new Promise(resolve => {
    window._ytApiCallbacks!.push(resolve);

    if (!ytApiLoading) {
      ytApiLoading = true;

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        ytApiLoaded = true;
        prev?.();
        (window._ytApiCallbacks ?? []).forEach(cb => cb());
        window._ytApiCallbacks = [];
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });
}

export function usePreviewPlayer(playlistId: string | null): PreviewPlayerState {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef    = useRef<YT.Player | null>(null);
  const tickerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [ready,   setReady]   = useState(false);
  const [playing, setPlaying] = useState(false);
  const [track,   setTrack]   = useState<TrackInfo>(DEFAULT_TRACK);
  const [seekPct, setSeekPct] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime,   setTotalTime]   = useState('0:00');

  const stopTicker = useCallback(() => {
    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
  }, []);

  const updateTrack = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      const d = p.getVideoData();
      if (d?.title) {
        const parts = d.title.split(' - ');
        setTrack({ title: parts[0] || d.title, artist: parts[1] || (d as { author?: string }).author || '—', videoId: d.video_id || null });
      }
    } catch { /* ignore */ }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    tickerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const cur = p.getCurrentTime() || 0;
        const tot = p.getDuration()    || 0;
        const pct = tot > 0 ? (cur / tot) * 100 : 0;
        setSeekPct(pct);
        setCurrentTime(fmt(cur));
        setTotalTime(fmt(tot));
      } catch { /* ignore */ }
    }, 500);
  }, [stopTicker]);

  // Destroy old player on playlistId change
  useEffect(() => {
    if (!playlistId) return;

    setReady(false);
    setPlaying(false);
    setTrack({ title: 'Loading playlist…', artist: 'Please wait', videoId: null });
    setSeekPct(0);
    setCurrentTime('0:00');
    setTotalTime('0:00');
    stopTicker();

    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }

    // Ensure container el exists
    if (!containerRef.current) return;

    const el = document.createElement('div');
    el.id = `yt-preview-${Date.now()}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(el);

    loadYTApi().then(() => {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(el.id, {
        height: '1',
        width: '1',
        playerVars: { listType: 'playlist', list: playlistId, autoplay: 0, controls: 0, rel: 0 },
        events: {
          onReady() {
            setReady(true);
            setTrack({ title: 'Playlist Loaded ✓', artist: 'Press play to start', videoId: null });
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
            setTrack({ title: 'Playback error', artist: 'Try another playlist', videoId: null });
            setTimeout(() => playerRef.current?.nextVideo(), 1500);
          },
        },
      });
    });

    return () => {
      stopTicker();
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const play        = useCallback(() => playerRef.current?.playVideo(), []);
  const pause       = useCallback(() => playerRef.current?.pauseVideo(), []);
  const togglePlay  = useCallback(() => { if (!ready) return; playing ? pause() : play(); }, [ready, playing, play, pause]);
  const next        = useCallback(() => playerRef.current?.nextVideo(), []);
  const prev        = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.getCurrentTime() > 3 ? p.seekTo(0, true) : p.previousVideo();
  }, []);
  const seek        = useCallback((pct: number) => {
    const p = playerRef.current;
    if (!p) return;
    const dur = p.getDuration();
    if (dur > 0) p.seekTo((pct / 100) * dur, true);
  }, []);

  return { ready, playing, track, seekPct, currentTime, totalTime, play, pause, togglePlay, next, prev, seek, containerRef };
}

'use client';

import type { BuilderState } from '@/app/page';
import { usePreviewPlayer } from '@/hooks/usePreviewPlayer';
import { useClock } from '@/hooks/useClock';
import styles from './PreviewPanel.module.css';

interface Props {
  state: BuilderState;
  onOpenFullPreview: () => void;
}

export default function PreviewPanel({ state, onOpenFullPreview }: Props) {
  const { siteName, playlistId, bg } = state;
  const clock = useClock();

  const {
    ready, playing, track, seekPct, currentTime, totalTime,
    togglePlay, next, prev, seek, containerRef,
  } = usePreviewPlayer(playlistId || null);

  const hasAny = siteName || playlistId || bg.libKey || bg.uploadB64;

  const bgCss = bg.mode === 'upload' && bg.uploadB64
    ? `url(${bg.uploadB64})`
    : bg.mode === 'library' && bg.libKey
      ? `url(/images/${bg.libKey})`
      : undefined;

  return (
    <section className={styles.panel} aria-label="Live preview">
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.dots} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        <span className={styles.label}>Live Preview</span>
        <button
          id="full-preview-btn"
          className={styles.fullBtn}
          onClick={onOpenFullPreview}
          disabled={!playlistId}
          title={playlistId ? 'Open full preview' : 'Add a playlist first'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Full Preview
        </button>
      </div>

      {/* Preview screen */}
      <div className={styles.screen}>
        {!hasAny ? (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">✦</span>
            <p className={styles.placeholderText}>Your site will appear here<br />as you fill in the form.</p>
          </div>
        ) : (
          <div className={styles.app}>
            {/* Background */}
            <div
              className={styles.appBg}
              style={{ backgroundImage: bgCss, backgroundColor: bgCss ? undefined : '#1a0a0a' }}
              aria-hidden="true"
            />
            <div className={styles.appOverlay} aria-hidden="true" />

            {/* Hidden YT container */}
            <div ref={containerRef} className={styles.ytContainer} aria-hidden="true" />

            {/* Live Clock — top left */}
            {clock && <div className={styles.clock}>{clock}</div>}

            {/* Site title */}
            <div className={styles.titleWrap}>
              <p className={styles.title}>{siteName || 'Your Site'}</p>
            </div>

            {/* Player */}
            <div className={styles.player}>
              {/* Vinyl */}
              <div className={styles.vinyl}>
                <div className={`${styles.vinylDisc} ${playing ? styles.spinning : ''}`}>
                  {track.videoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`}
                      alt="Album art"
                      className={styles.vinylImg}
                    />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.5" aria-hidden="true"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/></svg>
                  )}
                </div>
                <div className={styles.vinylHole} aria-hidden="true" />
              </div>

              {/* Info + seek */}
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
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * 100);
                  }}
                >
                  <div className={styles.seekTrack}>
                    <div className={styles.seekFill} style={{ width: `${seekPct}%` }} />
                  </div>
                  <div className={styles.seekThumb} style={{ left: `${seekPct}%` }} />
                </div>
                <div className={styles.timeDisplay}>
                  <span>{currentTime}</span>
                  <span style={{ opacity: 0.5 }}> / </span>
                  <span>{totalTime}</span>
                </div>
              </div>

              {/* Controls */}
              <div className={styles.controls}>
                <button className={styles.ctrl} onClick={prev} disabled={!ready} aria-label="Previous track">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <button
                  className={`${styles.ctrl} ${styles.ctrlPlay}`}
                  onClick={togglePlay}
                  disabled={!ready}
                  aria-label={playing ? 'Pause' : 'Play'}
                  aria-pressed={playing}
                >
                  {playing
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>
                <button className={styles.ctrl} onClick={next} disabled={!ready} aria-label="Next track">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2 6L5.5 6v12z"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className={styles.note}>Preview loads your playlist live. Full preview opens the generated app.</p>
    </section>
  );
}

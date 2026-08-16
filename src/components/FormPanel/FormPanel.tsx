'use client';

import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import type { BuilderState, BgData } from '@/app/page';
import { extractPlaylistId } from '@/lib/extractPlaylistId';
import { buildZip, triggerDownload } from '@/lib/buildZip';
import ImageLibrary from '@/components/ImageLibrary/ImageLibrary';
import styles from './FormPanel.module.css';

interface Props {
  state: BuilderState;
  setSiteName:  (v: string) => void;
  setPlaylistId: (v: string) => void;
  setBg: (patch: Partial<BgData>) => void;
  onOpenFullPreview: () => void;
}

type PlaylistStatus = 'idle' | 'ok' | 'error';

export default function FormPanel({ state, setSiteName, setPlaylistId, setBg }: Props) {
  const [rawUrl, setRawUrl]       = useState('');
  const [urlStatus, setUrlStatus] = useState<PlaylistStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [hintMsg, setHintMsg]     = useState('Fill in all three fields to unlock download.');

  const { siteName, playlistId, bg } = state;

  const hasName     = siteName.length > 0;
  const hasPlaylist = playlistId.length > 0;
  const hasBg       = (bg.mode === 'upload' && !!bg.uploadB64) || (bg.mode === 'library' && !!bg.libKey);
  const ready       = hasName && hasPlaylist && hasBg;

  const handleUrlChange = useCallback((raw: string) => {
    setRawUrl(raw);
    if (!raw.trim()) {
      setUrlStatus('idle'); setStatusMsg(''); setPlaylistId('');
      return;
    }
    const id = extractPlaylistId(raw);
    if (id) {
      setPlaylistId(id);
      setUrlStatus('ok');
      setStatusMsg(`✓ Playlist ID: ${id}`);
    } else {
      setPlaylistId('');
      setUrlStatus('error');
      setStatusMsg('✕ Couldn\'t find a playlist ID — check your URL');
    }
  }, [setPlaylistId]);

  // Update hint whenever deps change
  const missing: string[] = [];
  if (!hasName)     missing.push('site name');
  if (!hasPlaylist) missing.push('playlist URL');
  if (!hasBg)       missing.push('background image');
  const currentHint = ready ? '✓ Ready to download!' : `Still needed: ${missing.join(', ')}.`;

  async function handleDownload() {
    if (!ready || downloading) return;
    setDownloading(true);
    setHintMsg('Building your ZIP…');
    try {
      let bgFilename: string;
      let bgBlob: Blob;

      if (bg.mode === 'upload' && bg.uploadBlob) {
        bgFilename = `bg.${bg.uploadExt}`;
        bgBlob     = bg.uploadBlob;
      } else {
        const ext  = bg.libKey!.split('.').pop() ?? 'jpg';
        bgFilename = `bg.${ext}`;
        const resp = await fetch(`/images/${bg.libKey}`);
        bgBlob     = await resp.blob();
      }

      const zipBlob = await buildZip({ siteName, playlistId, bgBlob, bgFilename });
      const safe    = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-site';
      triggerDownload(zipBlob, `${safe}-app.zip`);
      setHintMsg('✓ Next.js project downloaded! Unzip, run npm install & npm run dev.');
    } catch (err) {
      console.error(err);
      setHintMsg('✕ Something went wrong — please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Builder form">

      {/* Step 1 */}
      <div className={styles.step}>
        <div className={styles.stepLabel}>
          <span className={styles.stepNum}>01</span>
          <span className={styles.stepTitle}>Name your site</span>
        </div>
        <div className={styles.inputWrap}>
          <textarea
            id="site-name"
            rows={2}
            className={styles.textArea}
            placeholder={"e.g. डीलक्स सैलून or Deluxe Saloon"}
            maxLength={80}
            autoComplete="off"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
          />
          <span className={styles.charCount}>{siteName.length} / 80</span>
        </div>
        <p className={styles.inputHint}>Press <strong>Enter</strong> to split into two lines.</p>
      </div>

      {/* Step 2 */}
      <div className={styles.step}>
        <div className={styles.stepLabel}>
          <span className={styles.stepNum}>02</span>
          <span className={styles.stepTitle}>Paste a YouTube playlist link</span>
        </div>
        <div
          className={`${styles.urlRow} ${urlStatus === 'ok' ? styles.urlOk : ''} ${urlStatus === 'error' ? styles.urlErr : ''}`}
        >
          <span className={styles.urlIcon} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/></svg>
          </span>
          <input
            id="playlist-url"
            type="url"
            className={`${styles.textInput} ${styles.urlInput}`}
            placeholder="https://www.youtube.com/playlist?list=…"
            autoComplete="off"
            value={rawUrl}
            onChange={e => handleUrlChange(e.target.value)}
            onPaste={e => setTimeout(() => handleUrlChange((e.target as HTMLInputElement).value), 50)}
          />
        </div>
        {statusMsg && (
          <p className={`${styles.statusMsg} ${urlStatus === 'ok' ? styles.statusOk : styles.statusErr}`} aria-live="polite">
            {statusMsg}
          </p>
        )}
        <p className={styles.stepHint}>
          Works with any public YouTube playlist.{' '}
          <a href="https://www.youtube.com/results?search_query=ambient+music+playlist" target="_blank" rel="noopener noreferrer" className={styles.hintLink}>Find one ↗</a>
        </p>
      </div>

      {/* Step 3 */}
      <div className={styles.step}>
        <div className={styles.stepLabel}>
          <span className={styles.stepNum}>03</span>
          <span className={styles.stepTitle}>Choose a background</span>
        </div>
        <ImageLibrary bg={bg} setBg={setBg} />
      </div>

      {/* Download */}
      <div className={styles.actionRow}>
        <button
          id="download-btn"
          className={`${styles.downloadBtn} ${downloading ? styles.loading : ''}`}
          disabled={!ready || downloading}
          aria-label="Download your generated web app as a ZIP"
          onClick={handleDownload}
        >
          <Download size={20} aria-hidden="true" />
          <span className={styles.btnLabel}>Download ZIP</span>
          <span className={styles.btnSub}>Your app, ready to run locally</span>
        </button>
        <p className={styles.actionHint} aria-live="polite">{downloading ? hintMsg : currentHint}</p>
      </div>

    </section>
  );
}

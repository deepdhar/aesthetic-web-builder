'use client';

import { useRef } from 'react';
import type { BgData } from '@/app/page';
import styles from './ImageLibrary.module.css';

// Add filenames here as you drop images into public/images/
const LIBRARY_IMAGES: string[] = [];

interface Props {
  bg: BgData;
  setBg: (patch: Partial<BgData>) => void;
}

export default function ImageLibrary({ bg, setBg }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef  = useRef<HTMLLabelElement>(null);

  function selectLibrary(filename: string) {
    setBg({ mode: 'library', libKey: filename });
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 15 * 1024 * 1024) { alert('Image too large — max 15 MB.'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const reader = new FileReader();
    reader.onload = e => {
      setBg({ mode: 'upload', uploadB64: e.target?.result as string, uploadBlob: file, uploadExt: ext });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={styles.root}>
      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        <button
          className={`${styles.tab} ${bg.mode === 'library' ? styles.tabActive : ''}`}
          role="tab"
          aria-selected={bg.mode === 'library'}
          onClick={() => setBg({ mode: 'library' })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          Library
        </button>
        <button
          className={`${styles.tab} ${bg.mode === 'upload' ? styles.tabActive : ''}`}
          role="tab"
          aria-selected={bg.mode === 'upload'}
          onClick={() => setBg({ mode: 'upload' })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload
        </button>
      </div>

      {/* Library Panel */}
      {bg.mode === 'library' && (
        <div className={styles.libraryGrid}>
          {LIBRARY_IMAGES.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🖼</span>
              <p>Library images will appear here.</p>
              <p className={styles.emptySub}>Drop images or GIFs into <code>public/images/</code> and add their names to <code>LIBRARY_IMAGES</code>.</p>
            </div>
          ) : (
            LIBRARY_IMAGES.map(filename => (
              <button
                key={filename}
                className={`${styles.libraryItem} ${bg.libKey === filename ? styles.libraryItemSelected : ''}`}
                onClick={() => selectLibrary(filename)}
                aria-label={`Select ${filename}`}
                aria-pressed={bg.libKey === filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/${filename}`} alt={filename.replace(/\.[^.]+$/, '').replace(/-/g, ' ')} loading="lazy" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Upload Panel */}
      {bg.mode === 'upload' && (
        <div className={styles.uploadArea}>
          {!bg.uploadB64 ? (
            <label
              className={styles.dropZone}
              ref={dropZoneRef}
              onDragOver={e => { e.preventDefault(); dropZoneRef.current?.classList.add(styles.dragOver); }}
              onDragLeave={() => dropZoneRef.current?.classList.remove(styles.dragOver)}
              onDrop={e => { e.preventDefault(); dropZoneRef.current?.classList.remove(styles.dragOver); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.uploadIcon}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className={styles.dropPrimary}>Drop an image or GIF here</span>
              <span className={styles.dropSecondary}>or <span className={styles.dropLink}>browse files</span></span>
              <span className={styles.dropHint}>JPG, PNG, WebP, GIF — max 15 MB</span>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </label>
          ) : (
            <div className={styles.uploadPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bg.uploadB64} alt="Selected background" />
              <button
                className={styles.removeBtn}
                onClick={() => setBg({ uploadB64: null, uploadBlob: null })}
                aria-label="Remove uploaded image"
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

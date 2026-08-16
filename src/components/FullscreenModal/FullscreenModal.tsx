'use client';

import { useEffect, useRef } from 'react';
import type { BuilderState } from '@/app/page';
import { generateApp } from '@/lib/generateApp';
import styles from './FullscreenModal.module.css';

interface Props {
  state: BuilderState;
  onClose: () => void;
}

export default function FullscreenModal({ state, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { siteName, playlistId, bg } = state;

  useEffect(() => {
    let bgInlineB64: string | undefined;
    let bgRelPath:   string | undefined;

    if (bg.mode === 'upload' && bg.uploadB64)   bgInlineB64 = bg.uploadB64;
    else if (bg.mode === 'library' && bg.libKey) bgRelPath   = `/images/${bg.libKey}`;

    const html = generateApp({
      siteName: siteName || 'Preview',
      playlistId,
      bgInlineB64,
      bgRelPath,
    });

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    if (iframeRef.current) iframeRef.current.src = url;

    return () => { URL.revokeObjectURL(url); };
  }, [siteName, playlistId, bg]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Full screen preview">
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close full preview"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Close
      </button>
      <iframe
        ref={iframeRef}
        className={styles.iframe}
        title="Full preview"
        allow="autoplay"
        allowFullScreen
      />
    </div>
  );
}

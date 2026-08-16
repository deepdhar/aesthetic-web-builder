'use client';

import { useState, useCallback } from 'react';
import FormPanel from '@/components/FormPanel/FormPanel';
import PreviewPanel from '@/components/PreviewPanel/PreviewPanel';
import FullscreenModal from '@/components/FullscreenModal/FullscreenModal';
import styles from './page.module.css';
import { Sparkles } from 'lucide-react';

export type BgMode = 'library' | 'upload';

export interface BgData {
  mode: BgMode;
  libKey: string | null;       // library image filename
  uploadB64: string | null;    // base64 data URL
  uploadBlob: Blob | null;
  uploadExt: string;
}

export interface BuilderState {
  siteName: string;
  playlistId: string;
  bg: BgData;
}

const INITIAL_STATE: BuilderState = {
  siteName: '',
  playlistId: '',
  bg: { mode: 'library', libKey: null, uploadB64: null, uploadBlob: null, uploadExt: 'jpg' },
};

export default function BuilderPage() {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const setSiteName = useCallback((v: string) =>
    setState(s => ({ ...s, siteName: v })), []);

  const setPlaylistId = useCallback((v: string) =>
    setState(s => ({ ...s, playlistId: v })), []);

  const setBg = useCallback((patch: Partial<BgData>) =>
    setState(s => ({ ...s, bg: { ...s.bg, ...patch } })), []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <Sparkles />
          <span className={styles.logoText}>
            Nostalgic <span className={styles.logoAccent}>Site Builder</span>
          </span>
        </div>
        <p className={styles.headerTagline}>
          Build a nostalgic ambient music site — no code needed.
        </p>
      </header>

      <main className={styles.mainLayout}>
        <FormPanel
          state={state}
          setSiteName={setSiteName}
          setPlaylistId={setPlaylistId}
          setBg={setBg}
          onOpenFullPreview={() => setFullscreenOpen(true)}
        />
        <PreviewPanel
          state={state}
          onOpenFullPreview={() => setFullscreenOpen(true)}
        />
      </main>

      {fullscreenOpen && (
        <FullscreenModal
          state={state}
          onClose={() => setFullscreenOpen(false)}
        />
      )}
    </>
  );
}

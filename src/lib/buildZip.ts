import JSZip from 'jszip';

export interface BuildZipOptions {
  siteName: string;
  appHtml: string;
  bgBlob: Blob;
  bgFilename: string;
}

export async function buildZip({ appHtml, bgBlob, bgFilename }: BuildZipOptions): Promise<Blob> {
  const zip = new JSZip();
  zip.file('index.html', appHtml);
  zip.file(bgFilename, bgBlob);
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

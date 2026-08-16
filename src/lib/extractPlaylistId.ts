/**
 * Extracts a YouTube playlist ID from a URL or bare ID string.
 * Returns null if no valid ID is found.
 */
export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare playlist ID (no URL)
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) return trimmed;

  // Full URL — parse `list` param
  try {
    const url = new URL(trimmed);
    const list = url.searchParams.get('list');
    if (list) return list;
  } catch {
    // not a valid URL — try regex fallback
  }

  const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export const ASSET_SCHEME = 'asset'

/** Turns a stored relative asset path into a URL the renderers can load. */
export function assetUrl(relative: string | null): string | null {
  if (!relative) return null
  return `${ASSET_SCHEME}://local/${encodeURIComponent(relative)}`
}

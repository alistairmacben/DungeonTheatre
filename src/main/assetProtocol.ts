import { protocol, net } from 'electron'
import { join, normalize, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { assetsDir } from './campaign/store'
import { ASSET_SCHEME } from '@shared/assets'

/**
 * Serves campaign images to the renderers as `asset://local/<file>`.
 *
 * Using a dedicated scheme rather than file:// keeps the renderer's CSP tight
 * and means the renderer never learns real filesystem paths.
 */

/** Must be called before app ready. */
export function registerAssetScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ASSET_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: false }
    }
  ])
}

/** Must be called after app ready. */
export function serveAssets(): void {
  protocol.handle(ASSET_SCHEME, async (request) => {
    const url = new URL(request.url)
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '')

    const dir = assetsDir()
    const resolved = normalize(join(dir, relative))

    // Refuse anything that climbs out of the assets folder.
    if (resolved !== dir && !resolved.startsWith(dir + sep)) {
      return new Response('Forbidden', { status: 403 })
    }

    return net.fetch(pathToFileURL(resolved).toString())
  })
}


/**
 * Rewrite external bitmap refs from server-root paths (`/i/…`) to the
 * deployed public dir. The figma-motion exports reference their bitmaps as
 * `u: '/i/'` + `p: '<hash>.png'`; the site deploys under BASE_URL (`/novo`),
 * so the refs would miss. Caveat: lottie-web's `getAssetsPath` IGNORES `u`
 * whenever `e` is set (the figma-motion exports set `e: 1`) — so the prefix
 * is folded into `p` itself and `u` is cleared, which works for both
 * `e`-flagged and plain assets.
 */
export function remapLottieAssets(data) {
  const raw = import.meta.env.BASE_URL
  const base = raw.endsWith('/') ? raw : `${raw}/`
  for (const asset of data?.assets ?? []) {
    if (typeof asset.u === 'string' && asset.u.startsWith('/')) {
      asset.p = `${base}${asset.u.replace(/^\//, '')}${asset.p ?? ''}`
      asset.u = ''
    }
  }
  return data
}

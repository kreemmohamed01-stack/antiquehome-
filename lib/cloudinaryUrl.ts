/**
 * Injects Cloudinary's f_auto/q_auto (+ optional width) transform into an
 * upload URL so the CDN serves a right-sized, modern-format (webp/avif)
 * image instead of the full original — cuts page weight substantially on
 * pages with many product photos. Non-Cloudinary URLs pass through untouched.
 */
export function cldUrl(url: string | null | undefined, width?: number): string {
  if (!url) return url ?? "";
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || i === -1) return url;
  const transform = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return url.slice(0, i + marker.length) + transform + "/" + url.slice(i + marker.length);
}

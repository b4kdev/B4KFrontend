// Server-only: called from app/api/* seed routes (DEC-50), never imported client-side.
//
// Upload convention dev friend's upload must follow for this mapping to resolve:
//   - source file `public/images/<path>` uploads to Cloudinary public_id `images/<path>`
//     (same relative path, extension included in the public_id)
//   - upload options: use_filename=true, unique_filename=false, overwrite=true
//     (no random suffix — the filename must be reproducible from the local path alone)
// CLOUDINARY_CLOUD_NAME isn't set in any environment yet — dev friend hasn't
// uploaded per the manifest, so there's no cloud to point at. Without this
// fallback, every Home/Explore seed image resolves to
// res.cloudinary.com/undefined/... and breaks. Serve the local /public path
// (the .webp files this was compressed to, still committed) until the env var
// is actually set — this line starts resolving to the real Cloudinary URL
// automatically the moment it is, no code change needed.
export function cldUrl(localPath: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName) return localPath
  const path = localPath.replace(/^\//, '')
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${path}`
}

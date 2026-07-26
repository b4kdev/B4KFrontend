// Server-only: called from app/api/* seed routes (DEC-50), never imported client-side.
//
// Upload convention dev friend's upload must follow for this mapping to resolve:
//   - source file `public/images/<path>` uploads to Cloudinary public_id `images/<path>`
//     (same relative path, extension included in the public_id)
//   - upload options: use_filename=true, unique_filename=false, overwrite=true
//     (no random suffix — the filename must be reproducible from the local path alone)
export function cldUrl(localPath: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const path = localPath.replace(/^\//, '')
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${path}`
}

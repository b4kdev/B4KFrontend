// Supabase Storage URL helper — DEC-57. Public buckets use getPublicUrl (no auth needed);
// gated content uses a short-lived signed URL. POI/entity images are public buckets — this
// module's signed-URL path exists for future non-public buckets, not current call sites.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ImageTransformOptions {
  width?: number
  height?: number
  resize?: 'cover' | 'contain' | 'fill'
}

export function getPublicImageUrl(bucket: string, path: string, transform?: ImageTransformOptions): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, { transform })
  return data.publicUrl
}

export async function getSignedImageUrl(bucket: string, path: string, expiresInSeconds = 60): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error || !data) {
    throw new Error(`getSignedImageUrl failed for ${bucket}/${path}: ${error?.message ?? 'no data'}`)
  }
  return data.signedUrl
}

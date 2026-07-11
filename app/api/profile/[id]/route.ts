import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Stub — real impl queries accounts.users + social.notification_prefs for visibility settings
  return NextResponse.json({
    id: params.id,
    display_name: null,
    avatar_url: null,
    trips_public: true,
    saved_public: false,
    badges_public: true,
  })
}

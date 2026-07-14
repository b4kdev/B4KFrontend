import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Soft delete: UPDATE accounts.users SET deleted_at = NOW() WHERE id = user.id
  // Uses supabaseAdmin to bypass RLS for account deletion
  const { error } = await supabaseAdmin
    .from('accounts.users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

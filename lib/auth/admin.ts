import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    profile.role !== 'admin'
  ) {
    redirect('/admin')
  }

  return { supabase, user, profile }
}

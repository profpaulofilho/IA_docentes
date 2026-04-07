import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || profile.role !== 'admin') {
    redirect('/admin')
  }

  return { supabase, user, profile }
}

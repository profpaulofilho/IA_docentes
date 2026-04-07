import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../lib/auth/admin'
import { createAdminClient } from '../../lib/supabase/admin'

async function createUser(formData: FormData) {
  'use server'

  await requireAdmin()
  const admin = createAdminClient()

  const full_name = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '').trim()
  const role = String(formData.get('role') || 'viewer').trim()

  if (!full_name || !email || !password || !role) {
    throw new Error('Preencha todos os campos obrigatórios.')
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error || !data.user) {
    throw new Error(error?.message || 'Erro ao criar usuário.')
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name,
    email,
    role,
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/usuarios')
}

async function updateUser(formData: FormData) {
  'use server'

  await requireAdmin()
  const admin = createAdminClient()

  const id = String(formData.get('id') || '').trim()
  const full_name = String(formData.get('full_name') || '').trim()
  const role = String(formData.get('role') || 'viewer').trim()
  const is_active = formData.get('is_active') === 'true'

  if (!id || !full_name || !role) {
    throw new Error('Dados inválidos.')
  }

  const { error } = await admin
    .from('profiles')
    .update({
      full_name,
      role,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/usuarios')
}

async function deleteUser(formData: FormData) {
  'use server'

  await requireAdmin()
  const admin = createAdminClient()

  const id = String(formData.get('id') || '').trim()
  if (!id) throw new Error('ID inválido.')

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) throw new Error(error.message)

  revalidatePath('/usuarios')
}

export default async function UsuariosPage() {
  const { supabase } = await requireAdmin()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <main style={{ minHeight: '100vh', background: '#05080f', padding: 24 }}>
      <style>{`
        * { font-family: 'Sora', sans-serif; }
        input, select { outline: none; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/senai-logo.png" alt="SENAI" style={{ height: 36 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Usuários do portal</span>
          </div>
          <Link href="/admin" style={{
            padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            color:'rgba(255,255,255,0.75)'
          }}>← Admin</Link>
        </div>

        <div style={{
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:20,
          padding:'24px',
          marginBottom:16
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', marginBottom:8 }}>
            Gestão interna
          </div>
          <h1 style={{ margin:'0 0 8px', fontSize:26, fontWeight:800, color:'#fff' }}>Gerenciar usuários</h1>

          <form action={createUser} style={{ display:'grid', gap:12, marginTop:18 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 160px', gap:12 }}>
              <input name="full_name" placeholder="Nome completo" required style={inp} />
              <input name="email" type="email" placeholder="Email" required style={inp} />
              <input name="password" type="password" placeholder="Senha inicial" required style={inp} />
              <select name="role" defaultValue="viewer" style={inp}>
                <option value="viewer">viewer</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <button type="submit" style={primaryBtn}>+ Criar usuário</button>
          </form>
        </div>

        {error && (
          <div style={{ color:'#fca5a5', marginBottom:16 }}>Erro ao carregar usuários: {error.message}</div>
        )}

        <div style={{ display:'grid', gap:10 }}>
          {(profiles || []).map((p: any) => (
            <div key={p.id} style={{
              background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:16,
              padding:'16px 18px'
            }}>
              <form action={updateUser} style={{ display:'grid', gap:12 }}>
                <input type="hidden" name="id" value={p.id} />

                <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 140px 140px auto', gap:10, alignItems:'center' }}>
                  <input name="full_name" defaultValue={p.full_name || ''} style={inp} />
                  <input value={p.email || ''} disabled style={{ ...inp, opacity: 0.65 }} />
                  <select name="role" defaultValue={p.role || 'viewer'} style={inp}>
                    <option value="viewer">viewer</option>
                    <option value="admin">admin</option>
                  </select>
                  <select name="is_active" defaultValue={String(!!p.is_active)} style={inp}>
                    <option value="true">ativo</option>
                    <option value="false">inativo</option>
                  </select>

                  <div style={{ display:'flex', gap:8 }}>
                    <button type="submit" style={secondaryBtn}>Salvar</button>
                  </div>
                </div>
              </form>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                  Criado em {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                </div>

                <form action={deleteUser}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    style={dangerBtn}
                    onClick={undefined}
                  >
                    Remover usuário
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

const inp: React.CSSProperties = {
  width:'100%',
  background:'rgba(255,255,255,0.05)',
  border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:10,
  padding:'11px 14px',
  fontSize:13,
  color:'#f1f5f9'
}

const primaryBtn: React.CSSProperties = {
  background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
  color:'#fff',
  border:'none',
  borderRadius:10,
  padding:'12px 16px',
  fontWeight:700,
  fontSize:14,
  cursor:'pointer'
}

const secondaryBtn: React.CSSProperties = {
  background:'rgba(37,99,235,0.15)',
  border:'1px solid rgba(37,99,235,0.25)',
  color:'#93c5fd',
  borderRadius:10,
  padding:'10px 14px',
  fontWeight:700,
  cursor:'pointer'
}

const dangerBtn: React.CSSProperties = {
  background:'rgba(239,68,68,0.1)',
  border:'1px solid rgba(239,68,68,0.25)',
  color:'#fca5a5',
  borderRadius:10,
  padding:'10px 14px',
  fontWeight:700,
  cursor:'pointer'
}

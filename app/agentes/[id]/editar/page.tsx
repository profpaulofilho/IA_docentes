import type { CSSProperties } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../../../../lib/auth/admin'

async function updateAgent(formData: FormData) {
  'use server'

  const { supabase } = await requireAdmin()

  const id = String(formData.get('id') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const provider = String(formData.get('provider') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const external_url = String(formData.get('external_url') || '').trim()
  const category_id = String(formData.get('category_id') || '').trim()
  const is_active = formData.get('is_active') === 'true'

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { error } = await supabase
    .from('agents')
    .update({
      name,
      slug,
      description,
      provider,
      platform,
      external_url,
      category_id,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/agentes')
  revalidatePath('/admin')
  revalidatePath('/mqct')
  redirect('/admin/agentes')
}

export default async function EditarAgentePage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase } = await requireAdmin()

  const [{ data: agent }, { data: categories }] = await Promise.all([
    supabase.from('agents').select('*').eq('id', params.id).single(),
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (!agent) {
    notFound()
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05080f', padding: '24px' }}>
      <style>{`
        * { font-family: 'Sora', sans-serif; }
        input, textarea, select { outline: none; }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(37,99,235,0.5) !important;
          background: rgba(37,99,235,0.06) !important;
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <img src="/senai-logo.png" alt="SENAI" style={{ height: 30 }} />
          <Link href="/admin/agentes" style={backBtn}>
            ← Voltar
          </Link>
        </div>

        <div style={card}>
          <div style={eyebrow}>Edição</div>
          <h1 style={title}>Editar agente</h1>

          <form action={updateAgent} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
            <input type="hidden" name="id" value={agent.id} />

            <div>
              <label style={lbl}>Nome do agente</label>
              <input name="name" defaultValue={agent.name} required style={inp} />
            </div>

            <div>
              <label style={lbl}>Descrição</label>
              <textarea
                name="description"
                defaultValue={agent.description || ''}
                style={{ ...inp, minHeight: 90, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Provider</label>
                <input
                  name="provider"
                  defaultValue={agent.provider || ''}
                  required
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Plataforma</label>
                <input
                  name="platform"
                  defaultValue={agent.platform || ''}
                  required
                  style={inp}
                />
              </div>
            </div>

            <div>
              <label style={lbl}>Categoria</label>
              <select
                name="category_id"
                defaultValue={agent.category_id || ''}
                required
                style={inp}
              >
                <option value="">Selecione</option>
                {(categories || []).map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Link externo</label>
              <input
                name="external_url"
                defaultValue={agent.external_url || ''}
                required
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Status</label>
              <select name="is_active" defaultValue={String(!!agent.is_active)} style={inp}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>

            <button type="submit" style={saveBtn}>
              Salvar alterações
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

const card: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '28px 32px',
}

const eyebrow: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#60a5fa',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const title: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 26,
  fontWeight: 800,
  color: '#fff',
}

const inp: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 13,
  color: '#f1f5f9',
}

const lbl: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 7,
}

const saveBtn: CSSProperties = {
  background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const backBtn: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)',
}

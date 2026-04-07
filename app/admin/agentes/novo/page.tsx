import type { CSSProperties } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../../../lib/auth/admin'

async function createAgent(formData: FormData) {
  'use server'

  const { supabase, user } = await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const provider = String(formData.get('provider') || '').trim()
  const platform = String(formData.get('platform') || '').trim()
  const external_url = String(formData.get('external_url') || '').trim()
  const category_id = String(formData.get('category_id') || '').trim()
  const is_featured = formData.get('is_featured') === 'on'

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  if (!name || !provider || !platform || !external_url || !category_id) {
    redirect('/admin/agentes/novo')
  }

  const payload: any = {
    name,
    slug,
    description,
    provider,
    platform,
    external_url,
    category_id,
    is_active: true,
    created_by: user.id,
  }

  if (is_featured) {
    payload.is_featured = true
  }

  const { error } = await supabase.from('agents').insert(payload)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/agentes')
  revalidatePath('/admin')
  revalidatePath('/mqct')
  redirect('/admin/agentes')
}

export default async function NovoAgentePage() {
  const { supabase } = await requireAdmin()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    throw new Error(error.message)
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
            marginBottom: 18,
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
          <div style={eyebrow}>Cadastro</div>
          <h1 style={title}>Novo agente</h1>
          <p style={subtitle}>
            Adicione um novo agente ao portal interno do SENAI Bahia.
          </p>

          <form action={createAgent} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
            <div>
              <label style={lbl}>Nome do agente</label>
              <input
                name="name"
                placeholder="Ex.: IA - Soldagem e Caldeiraria"
                required
                style={inp}
              />
            </div>

            <div>
              <label style={lbl}>Descrição</label>
              <textarea
                name="description"
                placeholder="Descreva o propósito do agente."
                style={{ ...inp, minHeight: 90, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Provider</label>
                <input name="provider" placeholder="OpenAI" required style={inp} />
              </div>

              <div>
                <label style={lbl}>Plataforma</label>
                <input name="platform" placeholder="GPT" required style={inp} />
              </div>
            </div>

            <div>
              <label style={lbl}>Categoria</label>
              <select name="category_id" required style={inp} defaultValue="">
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
                placeholder="https://chatgpt.com/g/..."
                required
                style={inp}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              <input type="checkbox" name="is_featured" />
              Marcar como destaque
            </label>

            <button type="submit" style={saveBtn}>
              Salvar agente →
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
  letterSpacing: '0.5px',
  marginBottom: 6,
}

const title: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 26,
  fontWeight: 800,
  color: '#fff',
}

const subtitle: CSSProperties = {
  margin: 0,
  color: 'rgba(255,255,255,0.35)',
  fontSize: 13,
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
  letterSpacing: '0.5px',
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

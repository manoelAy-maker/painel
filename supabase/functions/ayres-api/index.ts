import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
}

const enc = new TextEncoder()
const b64url = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors })
}

function normalizaPlaca(v: unknown) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRole) return json({ error: 'Configuracao do servidor incompleta.' }, 500)

  const sb = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'JSON invalido.' }, 400) }
  const acao = String(body.acao || '')

  if (acao === 'login') {
    const usuario = String(body.usuario || '').trim().toLowerCase()
    const senha = String(body.senha || '')
    if (!usuario || !senha) return json({ error: 'Informe usuario e senha.' }, 400)

    const { data: user, error } = await sb
      .from('ldc_usuarios')
      .select('usuario,senha,nome,cargo,filial,ativo')
      .eq('usuario', usuario)
      .maybeSingle()

    if (error) return json({ error: 'Falha ao consultar usuario.' }, 500)
    if (!user || user.ativo === false) return json({ error: 'Usuario ou senha invalidos.' }, 401)

    const esperado = String(user.senha || '')
    const calculado = await sha256(senha + 'ldc2025')
    const senhaOk = /^[a-f0-9]{64}$/i.test(esperado)
      ? calculado.toLowerCase() === esperado.toLowerCase()
      : senha === esperado

    if (!senhaOk) return json({ error: 'Usuario ou senha invalidos.' }, 401)

    const raw = new Uint8Array(32)
    crypto.getRandomValues(raw)
    const token = b64url(raw)
    const tokenHash = await sha256(token)
    const expiraEm = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

    await sb.from('ayres_api_sessions').delete().eq('usuario', user.usuario)
    const { error: sesErr } = await sb.from('ayres_api_sessions').insert({
      token_hash: tokenHash,
      usuario: user.usuario,
      filial: user.filial || 'jatai-go',
      cargo: user.cargo || 'Operador',
      expira_em: expiraEm,
    })
    if (sesErr) return json({ error: 'Nao foi possivel criar sessao AYRES.' }, 500)

    return json({ token, usuario: user.usuario, nome: user.nome, cargo: user.cargo, filial: user.filial, expira_em: expiraEm })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return json({ error: 'Sessao AYRES ausente. Use Ayres-Login.' }, 401)

  const tokenHash = await sha256(token)
  const { data: sessao, error: sessErr } = await sb
    .from('ayres_api_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .gt('expira_em', new Date().toISOString())
    .maybeSingle()

  if (sessErr || !sessao) return json({ error: 'Sessao AYRES invalida ou expirada.' }, 401)
  await sb.from('ayres_api_sessions').update({ ultimo_uso: new Date().toISOString() }).eq('token_hash', tokenHash)

  if (acao === 'logout') {
    await sb.from('ayres_api_sessions').delete().eq('token_hash', tokenHash)
    return json({ ok: true })
  }

  const usuario = String(sessao.usuario)
  const filial = String(sessao.filial || 'jatai-go')
  const cargo = String(sessao.cargo || '').toLowerCase()
  const podeVerTudo = ['admin', 'coordenador', 'analista senior', 'analista sênior'].includes(cargo)
  const aplicarFilial = <T>(query: T) => podeVerTudo ? query : (query as any).eq('filial', filial)

  try {
    if (acao === 'novo_chamado') {
      const placa = normalizaPlaca(body.placa)
      const numero = String(body.numero || '').trim()
      if (!placa || !numero) return json({ error: 'Informe placa e numero do chamado.' }, 400)

      const { data: chamado, error } = await sb.from('ayres_chamados').insert({
        numero, placa, status: 'Aberto', filial, criado_por: usuario,
      }).select('*').single()
      if (error) return json({ error: error.code === '23505' ? 'Esse numero de chamado ja existe.' : error.message }, 400)

      await sb.from('ayres_historico').insert({ chamado_id: chamado.id, placa, evento: 'criado', usuario, detalhes: { numero } })
      return json({ chamado })
    }

    if (acao === 'fechar_chamado') {
      const placa = normalizaPlaca(body.placa)
      let q: any = sb.from('ayres_chamados').select('*').eq('placa', placa).eq('status', 'Aberto').order('criado_at', { ascending: false }).limit(1)
      q = aplicarFilial(q)
      const { data: rows, error } = await q
      if (error) return json({ error: error.message }, 400)
      const atual = rows?.[0]
      if (!atual) return json({ error: 'Nenhum chamado aberto encontrado para essa placa.' }, 404)

      const { data: chamado, error: upErr } = await sb.from('ayres_chamados').update({
        status: 'Fechado', fechado_por: usuario, fechado_at: new Date().toISOString(),
      }).eq('id', atual.id).select('*').single()
      if (upErr) return json({ error: upErr.message }, 400)

      await sb.from('ayres_historico').insert({ chamado_id: chamado.id, placa, evento: 'fechado', usuario, detalhes: { numero: chamado.numero } })
      return json({ chamado })
    }

    if (acao === 'placa') {
      const placa = normalizaPlaca(body.placa)
      let q: any = sb.from('ayres_chamados').select('*').eq('placa', placa).order('criado_at', { ascending: false }).limit(100)
      q = aplicarFilial(q)
      const { data, error } = await q
      if (error) return json({ error: error.message }, 400)
      return json({ chamados: data || [] })
    }

    if (acao === 'chamado') {
      const numero = String(body.numero || '').trim()
      let q: any = sb.from('ayres_chamados').select('*').eq('numero', numero).limit(20)
      q = aplicarFilial(q)
      const { data, error } = await q
      if (error) return json({ error: error.message }, 400)
      return json({ chamados: data || [] })
    }

    if (acao === 'listar_chamados') {
      let q: any = sb.from('ayres_chamados').select('*').order('criado_at', { ascending: false }).limit(100)
      q = aplicarFilial(q)
      const { data, error } = await q
      if (error) return json({ error: error.message }, 400)
      return json({ chamados: data || [] })
    }

    if (acao === 'historico') {
      const placa = normalizaPlaca(body.placa)
      const { data, error } = await sb.from('ayres_historico').select('*').eq('placa', placa).order('criado_at', { ascending: false }).limit(200)
      if (error) return json({ error: error.message }, 400)
      return json({ historico: data || [] })
    }

    if (acao === 'observacao') {
      const placa = normalizaPlaca(body.placa)
      const texto = String(body.texto || '').trim()
      if (!placa || !texto) return json({ error: 'Informe placa e texto.' }, 400)

      let q: any = sb.from('ayres_chamados').select('*').eq('placa', placa).order('criado_at', { ascending: false }).limit(1)
      q = aplicarFilial(q)
      const { data: rows } = await q
      const chamado = rows?.[0] || null

      const { data: observacao, error } = await sb.from('ayres_observacoes').insert({
        chamado_id: chamado?.id || null, placa, texto, usuario,
      }).select('*').single()
      if (error) return json({ error: error.message }, 400)

      await sb.from('ayres_historico').insert({ chamado_id: chamado?.id || null, placa, evento: 'observacao', usuario, detalhes: { texto } })
      return json({ observacao })
    }

    return json({ error: 'Acao AYRES desconhecida.' }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro interno AYRES.' }, 500)
  }
})

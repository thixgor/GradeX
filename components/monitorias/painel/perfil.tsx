'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Camera, KeyRound, Loader2, Lock, Mail, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { formatCpf } from '@/lib/cpf'
import { Avatar, CaixaAviso, CaixaErro, api } from '../base'
import { TermosAceite } from '../termos-aceite'
import type { DadosPainel } from './tipos'

function Cartao({ titulo, children, id }: { titulo: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-3xl border border-border bg-card p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

export function PerfilMonitor({ dados, recarregar }: { dados: DadosPainel; recarregar: () => void }) {
  const t = dados.tutor
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <FotoEPerfil dados={dados} recarregar={recarregar} />
      </div>
      <div className="space-y-5">
        <ChavePix pix={t?.pix || null} pendente={t?.pixPendente || null} recarregar={recarregar} />
        <Cartao titulo="Termos de Serviço do Monitor" id="termos">
          <TermosAceite papel="monitor" compacto onAceito={() => undefined} />
        </Cartao>
      </div>
    </div>
  )
}

function FotoEPerfil({ dados, recarregar }: { dados: DadosPainel; recarregar: () => void }) {
  const t = dados.tutor
  const [titulo, setTitulo] = useState(t?.titulo || '')
  const [bio, setBio] = useState(t?.bio || '')
  const [historia, setHistoria] = useState(t?.historia || '')
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [msg, setMsg] = useState<{ tom: 'erro' | 'ok'; texto: string } | null>(null)
  const arquivo = useRef<HTMLInputElement>(null)

  async function salvar() {
    setSalvando(true)
    setMsg(null)
    try {
      await api('/api/monitorias/tutor/perfil', { method: 'PUT', json: { titulo, bio, historia } })
      setMsg({ tom: 'ok', texto: 'Perfil salvo!' })
      recarregar()
    } catch (e) {
      setMsg({ tom: 'erro', texto: e instanceof Error ? e.message : 'Erro ao salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  async function enviarFoto(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setMsg({ tom: 'erro', texto: 'Use JPG, PNG ou WEBP.' })
    if (file.size > 3 * 1024 * 1024) return setMsg({ tom: 'erro', texto: 'Foto maior que 3 MB.' })
    setEnviandoFoto(true)
    setMsg(null)
    try {
      // O caminho precisa estar na pasta da própria conta — o servidor diz qual e confere.
      const { pasta } = await api<{ pasta: string }>('/api/monitorias/tutor/foto')
      const ext = file.type.split('/')[1]
      const blob = await upload(`${pasta}${Date.now()}.${ext}`, file, {
        access: 'public',
        contentType: file.type,
        handleUploadUrl: '/api/monitorias/tutor/foto/upload',
      })
      await api('/api/monitorias/tutor/foto', { method: 'PUT', json: { url: blob.url } })
      recarregar()
    } catch (e) {
      setMsg({ tom: 'erro', texto: e instanceof Error ? e.message : 'Erro ao enviar foto.' })
    } finally {
      setEnviandoFoto(false)
    }
  }

  return (
    <Cartao titulo="Seu perfil de monitor">
      <div className="mb-5 flex items-center gap-4">
        <div className="relative">
          <Avatar nome={t?.nome || 'Você'} url={t?.fotoUrl} tamanho={84} />
          <button
            type="button"
            onClick={() => arquivo.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="Trocar foto"
          >
            {enviandoFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && enviarFoto(e.target.files[0])} />
        </div>
        <div className="text-sm">
          <p className="font-semibold">Foto de perfil</p>
          <p className="text-xs text-muted-foreground">Rosto visível, boa luz. Aparece no seu anúncio. Até 3 MB.</p>
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Título do perfil
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={90} placeholder="Ex.: Monitora de Fisiologia há 3 semestres" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
        </label>
        <label className="block text-sm font-medium">
          Sobre você (aparece no anúncio)
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={600} className="mt-1" placeholder="Em 2 ou 3 frases: quem você é e como ensina." />
        </label>
        <label className="block text-sm font-medium">
          Sua história
          <Textarea value={historia} onChange={(e) => setHistoria(e.target.value)} rows={5} maxLength={3000} className="mt-1" placeholder="Sua trajetória, conquistas, por que dá monitoria..." />
        </label>
        {msg && (msg.tom === 'erro' ? <CaixaErro mensagem={msg.texto} /> : <CaixaAviso tom="sucesso">{msg.texto}</CaixaAviso>)}
        <Button onClick={salvar} disabled={salvando} className="w-full">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Salvar perfil</>}
        </Button>
      </div>
    </Cartao>
  )
}

const TIPOS = [
  { v: 'cpf', r: 'CPF' },
  { v: 'email', r: 'E-mail' },
  { v: 'telefone', r: 'Celular' },
  { v: 'aleatoria', r: 'Aleatória' },
] as const

function ChavePix({ pix, pendente, recarregar }: { pix: { tipo: string; mascarada: string } | null; pendente: { mascarada: string; liberaEm: string } | null; recarregar: () => void }) {
  const [editando, setEditando] = useState(!pix)
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['v']>('cpf')
  const [chave, setChave] = useState('')
  const [titular, setTitular] = useState('')
  const [codigoPara, setCodigoPara] = useState('')
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function pedirCodigo() {
    setOcupado(true)
    setErro('')
    try {
      const r = await api<{ para: string }>('/api/monitorias/codigo', { method: 'POST', json: { finalidade: 'pix' } })
      setCodigoPara(r.para)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.')
    } finally {
      setOcupado(false)
    }
  }

  async function salvar() {
    setOcupado(true)
    setErro('')
    try {
      await api('/api/monitorias/tutor/pix', { method: 'PUT', json: { tipo, chave: tipo === 'cpf' ? titular : chave, titularCpf: titular, codigo } })
      setEditando(false)
      setCodigoPara('')
      setCodigo('')
      recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Cartao titulo="Chave PIX para receber">
      <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> A chave fica criptografada. A titularidade precisa ser sua (mesmo CPF do cadastro). Trocas só valem depois de 48h, com alerta no seu e-mail — proteção contra invasão de conta.
      </p>
      {pix && !editando && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-emerald-600" /> <strong>{pix.mascarada}</strong> <span className="text-xs text-muted-foreground">({pix.tipo})</span></span>
          <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>Trocar</Button>
        </div>
      )}
      {pendente && (
        <CaixaAviso className="mt-3">Troca agendada para <strong>{pendente.mascarada}</strong> — passa a valer em {formatarEmBrasilia(pendente.liberaEm)}. Não foi você? Abra um ticket no suporte.</CaixaAviso>
      )}
      {editando && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {TIPOS.map((x) => (
              <button key={x.v} type="button" onClick={() => setTipo(x.v)} className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${tipo === x.v ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{x.r}</button>
            ))}
          </div>
          <label className="block text-sm font-medium">
            CPF do titular (o seu)
            <input value={titular} onChange={(e) => setTitular(formatCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          </label>
          {tipo !== 'cpf' && (
            <label className="block text-sm font-medium">
              Chave
              <input value={chave} onChange={(e) => setChave(e.target.value)} placeholder={tipo === 'email' ? 'voce@email.com' : tipo === 'telefone' ? '(11) 98765-4321' : '123e4567-e89b-...'} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
            </label>
          )}
          {!codigoPara ? (
            <Button onClick={pedirCodigo} disabled={ocupado || titular.replace(/\D/g, '').length !== 11 || (tipo !== 'cpf' && !chave.trim())} className="w-full">
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="mr-2 h-4 w-4" /> Enviar código de confirmação</>}
            </Button>
          ) : (
            <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs">Código enviado para <strong>{codigoPara}</strong>.</p>
              <div className="flex gap-2">
                <input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-10 w-32 rounded-lg border border-border bg-background text-center font-mono tracking-[0.3em]" />
                <Button onClick={salvar} disabled={ocupado || codigo.length !== 6} className="flex-1">
                  {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="mr-2 h-4 w-4" /> Salvar chave</>}
                </Button>
              </div>
            </div>
          )}
          {pix && <Button variant="ghost" size="sm" onClick={() => setEditando(false)}>Cancelar</Button>}
        </div>
      )}
      {erro && <CaixaErro mensagem={erro} className="mt-3" />}
    </Cartao>
  )
}

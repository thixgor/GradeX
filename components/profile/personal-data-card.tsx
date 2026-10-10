'use client'

/**
 * "Meus dados": retrato, documentos, contato/formação e e-mail.
 *
 * Quatro blocos com um trabalho cada:
 *   Foto        → retrato da galeria (o mesmo das Monitorias; nada é enviado)
 *   Documentos  → nome civil, nascimento e CPF (contratos e pagamentos)
 *   Sobre você  → como te chamamos, contato e formação
 *   E-mail      → endereço, confirmação e troca
 *
 * Links das pendências chegam com `?campo=` e caem direto no campo certo, já
 * em edição. Documentos conferidos pela Receita ficam travados aqui (o
 * servidor também recusa): trocar o nome do titular depois da conferência
 * seria o atalho para assinar contrato no nome de outra pessoa.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Check, Loader2, Lock, Mail, Pencil, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SecaoRetrato } from '@/components/monitorias/seletor-avatar'
import { BRAZIL_STATES, formatStateLabel } from '@/lib/brazil-states'
import { MEDICAL_SPECIALTIES, RESIDENCY_AREAS } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState, OTHER_SCHOOL_OPTION } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState, OTHER_HOSPITAL_OPTION } from '@/lib/residency-hospitals-brazil'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { getMissingProfileFields } from '@/lib/profile-completeness'
import { formatCrmLabel, onlyCrmDigits } from '@/lib/crm'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { validarNomeCivil } from '@/lib/nome-civil'
import { cn } from '@/lib/utils'

const PROFESSION_LABELS: Record<string, string> = {
  medico: 'Médico',
  academico: 'Acadêmico',
  residente: 'Residente',
}

export type CampoDoPerfil = 'email' | 'dados' | 'cpf' | 'fullName' | 'dateOfBirth' | 'foto'

export type ProfileFormState = {
  name: string
  phone: string
  state: string
  profession: '' | 'medico' | 'academico' | 'residente'
  specialty: string
  crm: string
  crmUf: string
  residencySpecialty: string
  residencyHospital: string
  residencyYear: string
  afyaUnit: string
  periodo: string
}

type Perfil = ProfileFormState & {
  fullName: string
  dateOfBirth: string
  /** Máscara vinda do servidor; o CPF inteiro nunca volta para o navegador. */
  cpf: string
  hasCpf: boolean
  cpfVerified: boolean
  emailVerified: boolean
  avatar: string
}

const VAZIO: Perfil = {
  name: '',
  phone: '',
  state: '',
  profession: '',
  specialty: '',
  crm: '',
  crmUf: '',
  residencySpecialty: '',
  residencyHospital: '',
  residencyYear: '',
  afyaUnit: '',
  periodo: '',
  fullName: '',
  dateOfBirth: '',
  cpf: '',
  hasCpf: false,
  cpfVerified: false,
  emailVerified: true,
  avatar: '',
}

const controlClass =
  'flex h-10 w-full rounded-xl border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]'

/** Cartão de seção: título, uma linha de contexto e a ação à direita. */
function Secao({
  id,
  titulo,
  descricao,
  acao,
  destaque,
  children,
}: {
  id: string
  titulo: string
  descricao?: React.ReactNode
  acao?: React.ReactNode
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-2xl border bg-card p-5 transition-shadow duration-500 sm:p-6',
        destaque ? 'border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]' : 'border-border',
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{titulo}</h2>
          {descricao && <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  )
}

/** Linha de leitura: rótulo à esquerda, valor à direita (empilha no celular). */
function Linha({ rotulo, children, falta }: { rotulo: string; children?: React.ReactNode; falta?: boolean }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="min-w-0 text-sm font-medium">
        {falta ? (
          <span className="inline-flex items-center gap-1.5 font-normal text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            Falta preencher
          </span>
        ) : (
          children
        )}
      </dd>
    </div>
  )
}

function BotaoEditar({ onClick, rotulo = 'Editar' }: { onClick: () => void; rotulo?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Pencil className="h-3.5 w-3.5" />
      {rotulo}
    </button>
  )
}

function ErroDoCampo({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      {texto}
    </p>
  )
}

function Travado({ texto }: { texto: string }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
      <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
      {texto}
    </p>
  )
}

function formatarData(iso: string): string {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

/** Data máxima aceita (15 anos atrás), a mesma conta do servidor. */
function dataMaxima(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 15)
  return d.toISOString().slice(0, 10)
}

export function PersonalDataCard({
  userEmail,
  campo,
  onNameChange,
  onAvatarChange,
  onToast,
  onEmailChanged,
  onSalvo,
}: {
  userEmail: string
  /** Campo pedido pelo link (`?campo=`): rola até ele e já abre a edição. */
  campo?: CampoDoPerfil | null
  onNameChange: (name: string) => void
  onAvatarChange: (id: string) => void
  onToast: (message: string, type?: 'success' | 'error') => void
  onEmailChanged: () => void
  /** Algo foi salvo (a página mostra o atalho de volta, se veio de outro lugar). */
  onSalvo?: () => void
}) {
  const [perfil, setPerfil] = useState<Perfil>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [destaque, setDestaque] = useState<string | null>(null)
  const primeiraCarga = useRef(true)

  async function carregar() {
    try {
      const res = await fetch('/api/user/profile', { cache: 'no-store' })
      if (res.ok) {
        const p = (await res.json()).profile || {}
        setPerfil({ ...VAZIO, ...p, profession: p.profession || '', crmUf: p.crmUf || '' })
      }
    } catch (error) {
      console.error('Erro ao carregar dados de perfil:', error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  // Chegou por um link de pendência: rola até a seção e acende a borda por um instante.
  useEffect(() => {
    if (carregando || !campo || !primeiraCarga.current) return
    primeiraCarga.current = false
    const secao = campo === 'fullName' || campo === 'dateOfBirth' || campo === 'cpf' ? 'documentos' : campo === 'foto' ? 'foto' : campo === 'email' ? 'email' : 'dados'
    requestAnimationFrame(() => {
      document.getElementById(secao)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setDestaque(secao)
      setTimeout(() => setDestaque(null), 2400)
    })
  }, [carregando, campo])

  const faltandoDados = useMemo(
    () =>
      getMissingProfileFields({
        phone: perfil.phone || undefined,
        state: perfil.state || undefined,
        profession: (perfil.profession || undefined) as 'medico' | 'academico' | 'residente' | undefined,
        specialty: perfil.specialty || undefined,
        crm: perfil.crm || undefined,
        residencySpecialty: perfil.residencySpecialty || undefined,
        residencyHospital: perfil.residencyHospital || undefined,
        residencyYear: perfil.residencyYear || undefined,
        afyaUnit: perfil.afyaUnit || undefined,
        periodoBase: perfil.periodo ? Number(perfil.periodo) : undefined,
        cpf: perfil.hasCpf ? 'x' : undefined,
      }).filter((f) => f.key !== 'cpf'),
    [perfil],
  )

  if (carregando) {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SecaoRetrato
        id="foto"
        titulo="Foto do perfil"
        vazio="Escolha um retrato da galeria. Nada de envio de arquivo."
        nome={perfil.name || userEmail}
        atual={perfil.avatar}
        endpoint="/api/user/avatar"
        abrir={campo === 'foto'}
        fechadaSemRetrato
        onEscolhido={(id) => {
          setPerfil((p) => ({ ...p, avatar: id }))
          onAvatarChange(id)
          onToast('Foto atualizada.')
          onSalvo?.()
        }}
      />

      <Documentos
        perfil={perfil}
        campo={campo}
        destaque={destaque === 'documentos'}
        onToast={onToast}
        onSalvo={async () => {
          await carregar()
          onSalvo?.()
        }}
      />

      <SobreVoce
        perfil={perfil}
        faltando={faltandoDados.map((f) => f.label)}
        abrirEdicao={campo === 'dados'}
        destaque={destaque === 'dados'}
        onToast={onToast}
        onSalvo={async (nome) => {
          if (nome) onNameChange(nome)
          await carregar()
          onSalvo?.()
        }}
      />

      <Email
        email={userEmail}
        verificado={perfil.emailVerified}
        destaque={destaque === 'email'}
        onToast={onToast}
        onEmailChanged={() => {
          onEmailChanged()
          carregar()
        }}
      />
    </div>
  )
}

// ─── Documentos ──────────────────────────────────────────────────────────

function Documentos({
  perfil,
  campo,
  destaque,
  onToast,
  onSalvo,
}: {
  perfil: Perfil
  campo?: CampoDoPerfil | null
  destaque: boolean
  onToast: (message: string, type?: 'success' | 'error') => void
  onSalvo: () => Promise<void>
}) {
  const travado = perfil.cpfVerified
  const pedidoDireto = campo === 'fullName' || campo === 'dateOfBirth' || campo === 'cpf'
  const faltaAlgo = !perfil.fullName || !perfil.dateOfBirth || !perfil.hasCpf
  const [editando, setEditando] = useState(pedidoDireto && (faltaAlgo || !travado))
  const [nome, setNome] = useState(perfil.fullName)
  const [nascimento, setNascimento] = useState(perfil.dateOfBirth)
  const [cpf, setCpf] = useState('')
  const [erros, setErros] = useState<Partial<Record<'fullName' | 'dateOfBirth' | 'cpf' | 'geral', string>>>({})
  const [salvando, setSalvando] = useState(false)
  const refs = {
    fullName: useRef<HTMLInputElement>(null),
    dateOfBirth: useRef<HTMLInputElement>(null),
    cpf: useRef<HTMLInputElement>(null),
  }

  const nomeTravado = travado && !!perfil.fullName
  const nascimentoTravado = travado && !!perfil.dateOfBirth
  const cpfTravado = perfil.hasCpf

  useEffect(() => {
    if (!editando) return
    setNome(perfil.fullName)
    setNascimento(perfil.dateOfBirth)
    setCpf('')
    setErros({})
  }, [editando, perfil.fullName, perfil.dateOfBirth])

  // Foco no campo pedido pelo link, depois da rolagem.
  useEffect(() => {
    if (!editando || !pedidoDireto) return
    const alvo = campo as 'fullName' | 'dateOfBirth' | 'cpf'
    const t = setTimeout(() => refs[alvo].current?.focus({ preventScroll: true }), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando])

  async function salvar() {
    const novos: typeof erros = {}
    const corpo: Record<string, string> = {}
    if (!nomeTravado) {
      const e = validarNomeCivil(nome)
      if (e) novos.fullName = e
      else corpo.fullName = nome
    }
    if (!nascimentoTravado && nascimento) corpo.dateOfBirth = nascimento
    if (!cpfTravado && cpf) {
      if (!isValidCpf(onlyCpfDigits(cpf))) novos.cpf = 'CPF inválido. Confira os números digitados.'
      else corpo.cpf = onlyCpfDigits(cpf)
    }
    setErros(novos)
    if (Object.keys(novos).length) {
      const primeiro = (['fullName', 'dateOfBirth', 'cpf'] as const).find((k) => novos[k])
      if (primeiro) refs[primeiro].current?.focus()
      return
    }
    if (!Object.keys(corpo).length) {
      setEditando(false)
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const campoErro = (['fullName', 'dateOfBirth', 'cpf'] as const).find((k) => k === data.field)
        if (campoErro) {
          setErros({ [campoErro]: data.error })
          refs[campoErro].current?.focus()
        } else {
          setErros({ geral: data.error || 'Não foi possível salvar. Tente de novo.' })
        }
        return
      }
      onToast(data.officialName ? `CPF confirmado na Receita, em nome de ${data.officialName}.` : 'Documentos salvos.')
      setEditando(false)
      await onSalvo()
    } catch {
      setErros({ geral: 'Sem conexão. Confira sua internet e tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  const tudoTravado = nomeTravado && nascimentoTravado && cpfTravado

  return (
    <Secao
      id="documentos"
      titulo="Documentos"
      destaque={destaque}
      descricao="Iguais ao seu documento. Entram nos contratos e pagamentos das Monitorias e não aparecem para outras pessoas."
      acao={!editando && !tudoTravado ? <BotaoEditar onClick={() => setEditando(true)} rotulo={faltaAlgo ? 'Preencher' : 'Editar'} /> : undefined}
    >
      {travado && (
        <p className="-mt-2 mb-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Conferidos na Receita Federal
        </p>
      )}

      {!editando ? (
        <dl className="divide-y divide-border">
          <Linha rotulo="Nome completo" falta={!perfil.fullName}>
            {perfil.fullName}
          </Linha>
          <Linha rotulo="Data de nascimento" falta={!perfil.dateOfBirth}>
            {formatarData(perfil.dateOfBirth)}
          </Linha>
          <Linha rotulo="CPF" falta={!perfil.hasCpf}>
            <span className="tabular-nums">{perfil.cpf}</span>
          </Linha>
        </dl>
      ) : (
        <form
          className="space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            salvar()
          }}
        >
          <div>
            <Label htmlFor="doc-nome" className="text-sm font-medium">Nome completo</Label>
            <Input
              id="doc-nome"
              ref={refs.fullName}
              className="mt-1.5 rounded-xl"
              autoComplete="name"
              value={nome}
              disabled={nomeTravado || salvando}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como está no RG ou na CNH"
              aria-invalid={!!erros.fullName}
              aria-describedby={erros.fullName ? 'doc-nome-erro' : undefined}
            />
            {nomeTravado ? (
              <Travado texto="Confirmado pela Receita junto com o CPF. Para corrigir, fale com o suporte." />
            ) : (
              <ErroDoCampo id="doc-nome-erro" texto={erros.fullName} />
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="doc-nascimento" className="text-sm font-medium">Data de nascimento</Label>
              <input
                id="doc-nascimento"
                ref={refs.dateOfBirth}
                type="date"
                className={cn(controlClass, 'mt-1.5')}
                value={nascimento}
                max={dataMaxima()}
                min="1915-01-01"
                disabled={nascimentoTravado || salvando}
                onChange={(e) => setNascimento(e.target.value)}
                aria-invalid={!!erros.dateOfBirth}
                aria-describedby={erros.dateOfBirth ? 'doc-nascimento-erro' : undefined}
              />
              {nascimentoTravado ? <Travado texto="Confirmada pela Receita." /> : <ErroDoCampo id="doc-nascimento-erro" texto={erros.dateOfBirth} />}
            </div>
            <div>
              <Label htmlFor="doc-cpf" className="text-sm font-medium">CPF</Label>
              <Input
                id="doc-cpf"
                ref={refs.cpf}
                className="mt-1.5 rounded-xl tabular-nums"
                inputMode="numeric"
                autoComplete="off"
                placeholder={cpfTravado ? perfil.cpf : '000.000.000-00'}
                value={cpfTravado ? perfil.cpf : cpf}
                disabled={cpfTravado || salvando}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                aria-invalid={!!erros.cpf}
                aria-describedby={erros.cpf ? 'doc-cpf-erro' : undefined}
              />
              {cpfTravado ? <Travado texto="CPF da conta não se troca por aqui. Para corrigir, fale com o suporte." /> : <ErroDoCampo id="doc-cpf-erro" texto={erros.cpf} />}
            </div>
          </div>

          {!cpfTravado && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Depois de salvo, o CPF fica preso à conta. Se a conferência na Receita estiver ligada, nome e nascimento também.
            </p>
          )}

          {erros.geral && <ErroDoCampo id="doc-erro" texto={erros.geral} />}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={salvando} className="gap-1.5 rounded-xl">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {salvando ? 'Salvando' : 'Salvar documentos'}
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setEditando(false)} disabled={salvando}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Secao>
  )
}

// ─── Sobre você (contato e formação) ────────────────────────────────────

function SobreVoce({
  perfil,
  faltando,
  abrirEdicao,
  destaque,
  onToast,
  onSalvo,
}: {
  perfil: Perfil
  faltando: string[]
  abrirEdicao: boolean
  destaque: boolean
  onToast: (message: string, type?: 'success' | 'error') => void
  onSalvo: (nome?: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(abrirEdicao)
  const [form, setForm] = useState<ProfileFormState>(perfil)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) setForm(perfil)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  async function handleSave() {
    if (form.phone && !isValidBrazilPhone(form.phone)) {
      onToast('Informe um telefone válido com DDD', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          state: form.state,
          profession: form.profession,
          specialty: form.specialty,
          crm: form.crm,
          crmUf: form.crmUf || form.state,
          residencySpecialty: form.residencySpecialty,
          residencyHospital: form.residencyHospital,
          residencyYear: form.residencyYear,
          afyaUnit: form.afyaUnit,
          periodo: form.periodo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados')
      onToast('Dados salvos.')
      setEditing(false)
      await onSalvo(form.name || undefined)
    } catch (error: any) {
      onToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Secao
      id="dados"
      titulo="Sobre você"
      destaque={destaque}
      descricao={
        !editing && faltando.length > 0 ? (
          <>Falta: {faltando.join(', ')}.</>
        ) : (
          'Como te chamamos, contato e formação. Usamos para ajustar conteúdo e avisos.'
        )
      }
      acao={!editing ? <BotaoEditar onClick={() => setEditing(true)} rotulo={faltando.length ? 'Completar' : 'Editar'} /> : undefined}
    >
      {!editing ? (
        <dl className="divide-y divide-border">
          <Linha rotulo="Como te chamamos" falta={!perfil.name}>{perfil.name}</Linha>
          <Linha rotulo="Telefone" falta={!perfil.phone}><span className="tabular-nums">{perfil.phone}</span></Linha>
          <Linha rotulo="Estado" falta={!perfil.state}>{perfil.state ? formatStateLabel(perfil.state) : ''}</Linha>
          <Linha rotulo="Você é" falta={!perfil.profession}>{perfil.profession ? PROFESSION_LABELS[perfil.profession] : ''}</Linha>
          {perfil.profession === 'medico' && (
            <>
              <Linha rotulo="Especialidade" falta={!perfil.specialty}>{perfil.specialty}</Linha>
              <Linha rotulo="CRM" falta={!perfil.crm}>{formatCrmLabel(perfil.crm, perfil.crmUf)}</Linha>
            </>
          )}
          {perfil.profession === 'residente' && (
            <>
              <Linha rotulo="Residência" falta={!perfil.residencySpecialty}>{[perfil.residencySpecialty, perfil.residencyYear].filter(Boolean).join(', ')}</Linha>
              <Linha rotulo="Hospital" falta={!perfil.residencyHospital}>{perfil.residencyHospital}</Linha>
              <Linha rotulo="CRM" falta={!perfil.crm}>{formatCrmLabel(perfil.crm, perfil.crmUf)}</Linha>
            </>
          )}
          {perfil.profession === 'academico' && (
            <>
              <Linha rotulo="Instituição" falta={!perfil.afyaUnit}>{perfil.afyaUnit}</Linha>
              <Linha rotulo="Período" falta={!perfil.periodo}>{perfil.periodo ? formatPeriodoLabel(Number(perfil.periodo)) : ''}</Linha>
            </>
          )}
        </dl>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profileName" className="text-sm font-medium">Como te chamamos</Label>
              <Input id="profileName" className="rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profilePhone" className="text-sm font-medium">Telefone com DDD</Label>
              <Input
                id="profilePhone"
                className="rounded-xl"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatBrazilPhone(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profileState" className="text-sm font-medium">Estado</Label>
            <select
              id="profileState"
              className={controlClass}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value, afyaUnit: '', residencyHospital: '' })}
            >
              <option value="">Selecione seu estado</option>
              {BRAZIL_STATES.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.name} ({s.uf})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Você é</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Você é">
              {(
                [
                  { value: 'medico', label: 'Médico' },
                  { value: 'academico', label: 'Acadêmico' },
                  { value: 'residente', label: 'Residente' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={form.profession === opt.value}
                  onClick={() =>
                    setForm({
                      ...form,
                      profession: opt.value,
                      specialty: opt.value === 'medico' ? form.specialty : '',
                      residencySpecialty: opt.value === 'residente' ? form.residencySpecialty : '',
                      residencyHospital: opt.value === 'residente' ? form.residencyHospital : '',
                      residencyYear: opt.value === 'residente' ? form.residencyYear : '',
                      afyaUnit: opt.value === 'academico' ? form.afyaUnit : '',
                    })
                  }
                  className={cn(
                    'h-10 rounded-xl border text-sm font-semibold transition',
                    form.profession === opt.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.profession === 'medico' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sua especialidade</Label>
                <SearchableSelect
                  value={form.specialty}
                  onChange={(v) => setForm({ ...form, specialty: v })}
                  options={MEDICAL_SPECIALTIES}
                  placeholder="Selecione sua especialidade"
                  searchPlaceholder="Buscar especialidade"
                  className={controlClass}
                />
              </div>
              <CrmInputs form={form} setForm={setForm} controlClass={controlClass} />
            </>
          )}

          {form.profession === 'residente' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Sua residência</Label>
                <SearchableSelect
                  value={form.residencySpecialty}
                  onChange={(v) => setForm({ ...form, residencySpecialty: v })}
                  options={RESIDENCY_AREAS}
                  placeholder="Selecione a área"
                  searchPlaceholder="Buscar área da residência"
                  className={controlClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Hospital da residência {form.state ? '' : '(selecione o estado primeiro)'}
                </Label>
                <SearchableSelect
                  value={form.residencyHospital}
                  onChange={(v) => setForm({ ...form, residencyHospital: v })}
                  options={getResidencyHospitalsByState(form.state)}
                  placeholder="Selecione o hospital"
                  searchPlaceholder="Buscar hospital"
                  customOption={OTHER_HOSPITAL_OPTION}
                  customPlaceholder="Digite o nome do hospital"
                  className={controlClass}
                  disabled={!form.state}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ano de residência</Label>
                <select
                  className={controlClass}
                  value={form.residencyYear}
                  onChange={(e) => setForm({ ...form, residencyYear: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {RESIDENCY_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <CrmInputs form={form} setForm={setForm} controlClass={controlClass} />
            </>
          )}

          {form.profession === 'academico' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Sua unidade {form.state ? '' : '(selecione o estado primeiro)'}
                </Label>
                <SearchableSelect
                  value={form.afyaUnit}
                  onChange={(v) => setForm({ ...form, afyaUnit: v })}
                  options={getMedicalSchoolsByState(form.state)}
                  placeholder="Selecione sua instituição"
                  searchPlaceholder="Buscar sua instituição"
                  customOption={OTHER_SCHOOL_OPTION}
                  customPlaceholder="Digite o nome da sua instituição"
                  className={controlClass}
                  disabled={!form.state}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Período (opcional)</Label>
                <select
                  className={controlClass}
                  value={form.periodo}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                >
                  <option value="">Selecione seu período...</option>
                  {PERIODO_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {formatPeriodoLabel(p)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Salvando' : 'Salvar'}
            </Button>
            <Button variant="ghost" className="rounded-xl" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Secao>
  )
}

// ─── E-mail ──────────────────────────────────────────────────────────────

function Email({
  email,
  verificado,
  destaque,
  onToast,
  onEmailChanged,
}: {
  email: string
  verificado: boolean
  destaque: boolean
  onToast: (message: string, type?: 'success' | 'error') => void
  onEmailChanged: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const [novo, setNovo] = useState('')
  const [senha, setSenha] = useState('')
  const [trocando, setTrocando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  async function reenviar() {
    setReenviando(true)
    try {
      const res = await fetch('/api/auth/verify/resend', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Não foi possível reenviar.')
      setReenviado(true)
      onToast('Link enviado. Confira sua caixa de entrada e o spam.')
    } catch (e: any) {
      onToast(e.message, 'error')
    } finally {
      setReenviando(false)
    }
  }

  async function trocar() {
    if (!novo.trim() || !senha) {
      onToast('Preencha o novo e-mail e sua senha atual', 'error')
      return
    }
    setTrocando(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: novo.trim(), currentPassword: senha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar e-mail')
      onToast('E-mail alterado. Confira a caixa de entrada para confirmar o novo endereço.')
      setAberto(false)
      setNovo('')
      setSenha('')
      onEmailChanged()
    } catch (error: any) {
      onToast(error.message, 'error')
    } finally {
      setTrocando(false)
    }
  }

  return (
    <Secao
      id="email"
      titulo="E-mail"
      destaque={destaque}
      descricao="Onde chegam recibos, contratos e avisos das aulas."
      acao={<BotaoEditar onClick={() => setAberto(true)} rotulo="Trocar" />}
    >
      <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{email}</span>
          {verificado ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3 w-3" />
              Confirmado
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Não confirmado</span>
          )}
        </div>
        {!verificado && (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={reenviar} disabled={reenviando || reenviado}>
            {reenviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {reenviado ? 'Link enviado' : 'Reenviar link'}
          </Button>
        )}
      </div>

      <Dialog
        open={aberto}
        onOpenChange={(open) => {
          if (trocando) return
          setAberto(open)
          if (!open) {
            setNovo('')
            setSenha('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar e-mail</DialogTitle>
            <DialogDescription>Confirme sua senha atual. O novo endereço recebe um link de confirmação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newEmail" className="text-sm font-medium">Novo e-mail</Label>
              <Input id="newEmail" type="email" autoComplete="email" className="rounded-xl" placeholder="novo@email.com" value={novo} onChange={(e) => setNovo(e.target.value)} disabled={trocando} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentPasswordForEmail" className="text-sm font-medium">Senha atual</Label>
              <Input id="currentPasswordForEmail" type="password" autoComplete="current-password" className="rounded-xl" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={trocando} />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={() => setAberto(false)} disabled={trocando} className="w-full rounded-xl sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={trocar} disabled={trocando} className="w-full rounded-xl sm:w-auto">
              {trocando ? 'Trocando' : 'Trocar e-mail'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Secao>
  )
}

/**
 * CRM + UF. O mesmo par serve para médico e residente, e a UF cai no estado do
 * usuário por padrão — só quem migrou de estado precisa trocar.
 */
function CrmInputs({
  form,
  setForm,
  controlClass,
}: {
  form: ProfileFormState
  setForm: (form: ProfileFormState) => void
  controlClass: string
}) {
  return (
    <div className="grid grid-cols-[1fr_6rem] gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="profileCrm" className="text-sm font-medium">
          CRM
        </Label>
        <Input
          id="profileCrm"
          inputMode="numeric"
          placeholder="123456"
          value={form.crm}
          onChange={(e) => setForm({ ...form, crm: onlyCrmDigits(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profileCrmUf" className="text-sm font-medium">
          UF
        </Label>
        <select
          id="profileCrmUf"
          className={controlClass}
          value={form.crmUf || form.state}
          onChange={(e) => setForm({ ...form, crmUf: e.target.value })}
        >
          <option value="">--</option>
          {BRAZIL_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.uf}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

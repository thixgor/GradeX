'use client'

/**
 * Formulário de emissão de Serial Keys de cortesia — o mesmo em /admin/keys
 * (qualquer produto) e em /admin/materiais (com o material ou pacote já
 * escolhido). Quem monta o que a key concede é o servidor
 * (`lib/serial-key-emissao.ts`); aqui só se escolhe.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Check, Copy, Crown, FileText, Infinity as InfinityIcon, KeyRound, Layers, Link2, Loader2,
  Mail, Package, Search, Sparkles, Stethoscope, Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CatalogoDeEmissao, KeyDoAdmin, OrigemDeEmissao } from '@/lib/serial-key-emissao'

// ── Cópia ────────────────────────────────────────────────────────────────────

/** Copia para a área de transferência, com recurso para navegador sem a API. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = texto
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

/** Botão que copia `texto` e confirma por 2 s. */
export function BotaoCopiar({
  texto, rotulo, rotuloCopiado = 'Copiado!', icone = 'copy', className = '', size = 'sm',
}: {
  texto: string
  rotulo: string
  rotuloCopiado?: string
  icone?: 'copy' | 'link'
  className?: string
  size?: 'sm' | 'xs'
}) {
  const [copiado, setCopiado] = useState(false)
  const Icone = copiado ? Check : icone === 'link' ? Link2 : Copy
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copiarTexto(texto)) {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors ${
        size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } ${copiado ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-background hover:bg-muted'} ${className}`}
      title={rotulo}
    >
      <Icone className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {copiado ? rotuloCopiado : rotulo}
    </button>
  )
}

// ── Catálogo (uma busca por visita ao painel) ────────────────────────────────

let catalogoEmCache: CatalogoDeEmissao | null = null

async function carregarCatalogo(forcar = false): Promise<CatalogoDeEmissao> {
  if (catalogoEmCache && !forcar) return catalogoEmCache
  const res = await fetch('/api/admin/serial-keys/catalogo', { cache: 'no-store' })
  if (!res.ok) throw new Error('Não foi possível carregar os produtos.')
  catalogoEmCache = await res.json()
  return catalogoEmCache!
}

// ── Formulário ───────────────────────────────────────────────────────────────

type Tipo = 'material' | 'package' | 'manual_clinico' | 'plus'
type ModoAcesso = 'vitalicio' | 'versao' | 'personalizado'
type ModoPlus = 'plano' | 'personalizado' | 'vitalicio'

const TIPOS: { id: Tipo; label: string; hint: string; icon: typeof FileText }[] = [
  { id: 'material', label: 'Material', hint: 'PDF, flashcards…', icon: FileText },
  { id: 'package', label: 'Pacote', hint: 'Vários materiais', icon: Package },
  { id: 'manual_clinico', label: 'Manual Clínico', hint: 'Por plano', icon: Stethoscope },
  { id: 'plus', label: 'Plus+', hint: 'Assinatura', icon: Crown },
]

export interface ItemFixo {
  kind: 'material' | 'package'
  id: string
  title: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  origem: OrigemDeEmissao
  /** Material ou pacote já escolhido (botão de /admin/materiais). */
  itemFixo?: ItemFixo | null
  /** Chamado após gerar — para a lista de quem abriu se atualizar. */
  onEmitidas?: (keys: KeyDoAdmin[]) => void
}

const DURACAO_VAZIA = { years: 0, months: 0, days: 30, hours: 0, minutes: 0 }

export function EmitirSerialKeyDialog({ open, onOpenChange, origem, itemFixo, onEmitidas }: Props) {
  const [catalogo, setCatalogo] = useState<CatalogoDeEmissao | null>(catalogoEmCache)
  const [erroCatalogo, setErroCatalogo] = useState('')

  const [tipo, setTipo] = useState<Tipo>(itemFixo?.kind || 'material')
  const [itemId, setItemId] = useState(itemFixo?.id || '')
  const [busca, setBusca] = useState('')
  const [modoAcesso, setModoAcesso] = useState<ModoAcesso>('vitalicio')
  const [versionId, setVersionId] = useState('')
  const [duracao, setDuracao] = useState(DURACAO_VAZIA)
  const [planKey, setPlanKey] = useState('vitalicio')
  const [planId, setPlanId] = useState('')
  const [modoPlus, setModoPlus] = useState<ModoPlus>('plano')
  const [plusMeses, setPlusMeses] = useState(1)
  const [plusDias, setPlusDias] = useState(7)

  const [quantidade, setQuantidade] = useState(1)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [enviarEmail, setEnviarEmail] = useState(false)
  const [restringir, setRestringir] = useState(false)
  const [nota, setNota] = useState('')

  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<{ keys: KeyDoAdmin[]; emailEnviado: boolean | null } | null>(null)

  // Cada abertura começa do zero, com o item fixo (se houver) já escolhido.
  useEffect(() => {
    if (!open) return
    setTipo(itemFixo?.kind || 'material')
    setItemId(itemFixo?.id || '')
    setBusca('')
    setModoAcesso('vitalicio')
    setVersionId('')
    setDuracao(DURACAO_VAZIA)
    setQuantidade(1)
    setEmail('')
    setNome('')
    setEnviarEmail(false)
    setRestringir(false)
    setNota('')
    setErro('')
    setResultado(null)

    let ativo = true
    // Um item recém-criado no painel ainda não está no catálogo em cache.
    const forcar = !!itemFixo && !!catalogoEmCache &&
      ![...catalogoEmCache.materiais, ...catalogoEmCache.pacotes].some(i => i.id === itemFixo.id)
    carregarCatalogo(forcar)
      .then(c => {
        if (!ativo) return
        setCatalogo(c)
        setErroCatalogo('')
        setPlanId(prev => prev || c.planosPlus[0]?.id || '')
      })
      .catch(e => ativo && setErroCatalogo(e.message))
    return () => { ativo = false }
  }, [open, itemFixo])

  const itensDoTipo = useMemo(() => {
    if (!catalogo) return []
    return tipo === 'package' ? catalogo.pacotes : tipo === 'material' ? catalogo.materiais : []
  }, [catalogo, tipo])

  const itensFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = q ? itensDoTipo.filter(i => i.title.toLowerCase().includes(q)) : itensDoTipo
    return lista.slice(0, 80)
  }, [itensDoTipo, busca])

  const itemEscolhido = itensDoTipo.find(i => i.id === itemId) || null
  const versoes = itemEscolhido?.versoes || []
  const planoPlus = catalogo?.planosPlus.find(p => p.id === planId) || null

  // Versão some quando o item muda; o modo volta a vitalício se ficou sem.
  useEffect(() => {
    if (modoAcesso === 'versao' && !versoes.some(v => v.id === versionId)) {
      setVersionId(versoes[0]?.id || '')
      if (versoes.length === 0) setModoAcesso('vitalicio')
    }
  }, [itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  const lote = quantidade > 1
  const podeGerar =
    !gerando &&
    (tipo === 'material' || tipo === 'package'
      ? !!itemId &&
        (modoAcesso !== 'versao' || !!versionId) &&
        (modoAcesso !== 'personalizado' || duracao.months + duracao.days + duracao.hours > 0)
      : tipo === 'plus'
        ? !!planId && (modoPlus !== 'personalizado' || plusMeses + plusDias > 0)
        : true) &&
    (!(enviarEmail || restringir) || !!email.trim())

  async function gerar() {
    setGerando(true)
    setErro('')
    try {
      const produto =
        tipo === 'material' || tipo === 'package'
          ? {
              productType: tipo,
              itemId,
              acesso:
                modoAcesso === 'versao' ? { modo: 'versao', versionId }
                : modoAcesso === 'personalizado' ? { modo: 'personalizado', duracao }
                : { modo: 'vitalicio' },
            }
          : tipo === 'manual_clinico'
            ? { productType: 'manual_clinico', planKey }
            : {
                productType: 'plus',
                planId,
                ...(modoPlus === 'vitalicio' ? { duracao: { meses: 0, dias: 0 } }
                  : modoPlus === 'personalizado' ? { duracao: { meses: plusMeses, dias: plusDias } }
                  : {}),
              }

      const res = await fetch('/api/admin/serial-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto,
          quantidade,
          ...(!lote && email.trim() ? { destinatario: { email: email.trim(), nome: nome.trim() } } : {}),
          enviarEmail: !lote && enviarEmail,
          restringirAoEmail: !lote && restringir,
          nota,
          origem,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao gerar a serial key.')
      setResultado({ keys: json.keys, emailEnviado: json.emailEnviado })
      onEmitidas?.(json.keys)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  const titulo = itemFixo ? `Gerar serial key — ${itemFixo.title}` : 'Gerar serial key'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} variant="sheet">
      <DialogContent className="max-w-2xl mx-0 sm:mx-4 rounded-b-none sm:rounded-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <KeyRound className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="truncate">{titulo}</span>
          </DialogTitle>
          <DialogDescription>
            {resultado
              ? 'Pronto. Copie a key ou o link de ativação e entregue a quem vai usar.'
              : 'Key de cortesia: sem pagamento, ativa pelo mesmo link das compras e libera exatamente o que você escolher.'}
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <Resultado
            keys={resultado.keys}
            emailEnviado={resultado.emailEnviado}
            onOutra={() => setResultado(null)}
            onFechar={() => onOpenChange(false)}
          />
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {erroCatalogo && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroCatalogo}</p>
            )}

            {/* 1. Produto */}
            {!itemFixo && (
              <Secao numero={1} titulo="O que a key libera">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIPOS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setTipo(t.id); setItemId(''); setBusca('') }}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                        tipo === t.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <t.icon className={`h-4 w-4 ${tipo === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold">{t.label}</span>
                      <span className="text-[11px] text-muted-foreground">{t.hint}</span>
                    </button>
                  ))}
                </div>

                {(tipo === 'material' || tipo === 'package') && (
                  <div className="mt-3 rounded-xl border">
                    <div className="relative border-b">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder={tipo === 'package' ? 'Buscar pacote…' : 'Buscar material…'}
                        className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {!catalogo ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                        </div>
                      ) : itensFiltrados.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>
                      ) : (
                        itensFiltrados.map(i => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => setItemId(i.id)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                              itemId === i.id ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
                            }`}
                          >
                            {i.kind === 'package' ? <Package className="h-4 w-4 shrink-0 text-violet-500" />
                              : i.flashcard ? <Layers className="h-4 w-4 shrink-0 text-sky-500" />
                              : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                            <span className="flex-1 min-w-0 truncate">{i.title}</span>
                            {i.oculto && <span className="text-[10px] text-muted-foreground">oculto</span>}
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {i.price > 0 ? `R$ ${i.price.toFixed(2)}` : 'grátis'}
                            </span>
                            {itemId === i.id && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Secao>
            )}

            {/* 2. Acesso */}
            <Secao numero={itemFixo ? 1 : 2} titulo="Por quanto tempo">
              {(tipo === 'material' || tipo === 'package') && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Chip ativo={modoAcesso === 'vitalicio'} onClick={() => setModoAcesso('vitalicio')} icon={InfinityIcon}>Vitalício</Chip>
                    {versoes.length > 0 && (
                      <Chip
                        ativo={modoAcesso === 'versao'}
                        onClick={() => { setModoAcesso('versao'); setVersionId(versionId || versoes[0].id) }}
                        icon={Timer}
                      >
                        Versão do item
                      </Chip>
                    )}
                    <Chip ativo={modoAcesso === 'personalizado'} onClick={() => setModoAcesso('personalizado')} icon={Sparkles}>Prazo personalizado</Chip>
                  </div>

                  {modoAcesso === 'versao' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {versoes.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVersionId(v.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm ${versionId === v.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                        >
                          <span className="font-medium">{v.label}</span>
                          <span className="block text-xs text-muted-foreground">{v.duracao}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {modoAcesso === 'personalizado' && (
                    <div className="grid grid-cols-3 gap-2">
                      {([['months', 'Meses'], ['days', 'Dias'], ['hours', 'Horas']] as const).map(([campo, rotulo]) => (
                        <label key={campo} className="text-xs text-muted-foreground">
                          {rotulo}
                          <Input
                            type="number"
                            min={0}
                            value={duracao[campo]}
                            onChange={e => setDuracao(d => ({ ...d, [campo]: Math.max(0, Number(e.target.value) || 0) }))}
                            className="mt-1 h-9"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {modoAcesso === 'vitalicio'
                      ? 'Acesso permanente, como numa compra vitalícia.'
                      : 'O prazo começa a contar na ativação, sem download — o conteúdo fica no leitor protegido. Se a pessoa já tem acesso por tempo, o prazo é somado.'}
                  </p>
                </div>
              )}

              {tipo === 'manual_clinico' && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {(catalogo?.manualClinico.planos || []).map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPlanKey(p.key)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${planKey === p.key ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                    >
                      <span className="font-medium">{p.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {p.duracao}{p.ativo ? '' : ' · fora da venda'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {tipo === 'plus' && (
                <div className="space-y-3">
                  {catalogo && catalogo.planosPlus.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum plano Plus+ configurado em Configurações.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(catalogo?.planosPlus || []).map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlanId(p.id)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm ${planId === p.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}
                        >
                          <span className="font-medium">{p.nome}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.periodo || (p.durationMonths ? `${p.durationMonths} meses` : 'vitalício')}{p.oculto ? ' · oculto' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Chip ativo={modoPlus === 'plano'} onClick={() => setModoPlus('plano')} icon={BookOpen}>
                      Duração do plano{planoPlus ? ` (${planoPlus.durationMonths ? `${planoPlus.durationMonths} meses` : 'vitalício'})` : ''}
                    </Chip>
                    <Chip ativo={modoPlus === 'personalizado'} onClick={() => setModoPlus('personalizado')} icon={Timer}>Personalizada</Chip>
                    <Chip ativo={modoPlus === 'vitalicio'} onClick={() => setModoPlus('vitalicio')} icon={InfinityIcon}>Vitalício</Chip>
                  </div>
                  {modoPlus === 'personalizado' && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground">
                        Meses
                        <Input type="number" min={0} value={plusMeses} onChange={e => setPlusMeses(Math.max(0, Number(e.target.value) || 0))} className="mt-1 h-9" />
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Dias
                        <Input type="number" min={0} value={plusDias} onChange={e => setPlusDias(Math.max(0, Number(e.target.value) || 0))} className="mt-1 h-9" />
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Substitui as antigas keys Trial: Plus+ por 7 dias é um trial com tudo liberado.
                  </p>
                </div>
              )}
            </Secao>

            {/* 3. Entrega */}
            <Secao numero={itemFixo ? 2 : 3} titulo="Quantas e para quem">
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <label className="text-xs text-muted-foreground">
                  Quantidade
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={quantidade}
                    onChange={e => setQuantidade(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                    className="mt-1 h-9"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Nota interna (opcional)
                  <Input value={nota} onChange={e => setNota(e.target.value)} maxLength={280} placeholder="Ex.: sorteio do Instagram, turma 2026.2…" className="mt-1 h-9" />
                </label>
              </div>

              {lote ? (
                <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {quantidade} keys formam um lote: cada uma ativa uma vez, em qualquer conta. Você copia todos os links de uma vez na próxima tela.
                </p>
              ) : (
                <div className="mt-3 space-y-3 rounded-xl border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-muted-foreground">
                      E-mail do destinatário (opcional)
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aluno@email.com" className="mt-1 h-9" />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Nome
                      <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="mt-1 h-9" />
                    </label>
                  </div>
                  <Alternancia
                    checked={enviarEmail}
                    onChange={setEnviarEmail}
                    disabled={!email.trim()}
                    titulo="Enviar a key por e-mail agora"
                    descricao="Mesmo e-mail das compras: key, link, QR e comprovante."
                  />
                  <Alternancia
                    checked={restringir}
                    onChange={setRestringir}
                    disabled={!email.trim()}
                    titulo="Só ativa na conta deste e-mail"
                    descricao="Impede que a key seja repassada para outra pessoa."
                  />
                </div>
              )}
            </Secao>

            {erro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={gerar} disabled={!podeGerar} className="gap-1.5">
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {gerando ? 'Gerando…' : lote ? `Gerar ${quantidade} keys` : 'Gerar serial key'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Peças ────────────────────────────────────────────────────────────────────

function Secao({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] text-primary">{numero}</span>
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Chip({ ativo, onClick, icon: Icon, children }: { ativo: boolean; onClick: () => void; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

function Alternancia({ checked, onChange, disabled, titulo, descricao }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; titulo: string; descricao: string
}) {
  return (
    <div className={`flex items-start justify-between gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>
      <Switch checked={checked && !disabled} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

function Resultado({ keys, emailEnviado, onOutra, onFechar }: {
  keys: KeyDoAdmin[]; emailEnviado: boolean | null; onOutra: () => void; onFechar: () => void
}) {
  const primeira = keys[0]
  const tabela = ['Serial key\tLink de ativação', ...keys.map(k => `${k.key}\t${k.link}`)].join('\n')
  return (
    <div className="px-6 pb-6 space-y-4">
      <div className="rounded-xl border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{primeira?.productTitle || primeira?.productTypeLabel}</p>
        <p className="text-xs text-muted-foreground">
          {primeira?.productTypeLabel} · {primeira?.acesso}
          {keys.length > 1 ? ` · ${keys.length} keys` : ''}
        </p>
      </div>

      {emailEnviado !== null && (
        <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          emailEnviado ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
        }`}>
          <Mail className="h-4 w-4" />
          {emailEnviado ? `E-mail enviado para ${primeira?.destinatarioEmail}.` : 'A key foi gerada, mas o e-mail falhou. Copie o link abaixo ou reenvie pela lista.'}
        </p>
      )}

      {keys.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={keys.map(k => k.link).join('\n')} rotulo={`Copiar ${keys.length} links`} icone="link" />
          <BotaoCopiar texto={keys.map(k => k.key).join('\n')} rotulo={`Copiar ${keys.length} keys`} />
          <BotaoCopiar texto={tabela} rotulo="Copiar tabela (key + link)" />
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {keys.map(k => (
          <div key={k.id} className="rounded-xl border p-3">
            <p className="break-all font-mono text-sm font-bold tracking-wider">{k.key}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground" title={k.link}>{k.link}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <BotaoCopiar texto={k.key} rotulo="Copiar key" size="xs" />
              <BotaoCopiar texto={k.link} rotulo="Copiar link de ativação" rotuloCopiado="Link copiado!" icone="link" size="xs" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onOutra}>Gerar outra</Button>
        <Button onClick={onFechar}>Concluir</Button>
      </div>
    </div>
  )
}

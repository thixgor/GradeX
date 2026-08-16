'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Lock, Plus, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import type { CondicaoAcesso, RegrasDeAcessoAula } from '@/lib/aulas/acesso'
import {
  AJUDA_DA_CONDICAO,
  ROTULO_DA_CONDICAO,
  TIPOS_DE_CONDICAO,
  chaveDaCondicao,
  descreverRegras,
  exigeAlvo,
  type TipoDeCondicao,
} from '@/lib/aulas/regras-edicao'
import { cn } from '@/lib/utils'

/**
 * Editor de permissões da aula (§15, §16).
 *
 * O motor de acesso sempre soube combinar sete condições em "ou" e "e". O editor
 * oferecia um seletor de dois valores. Esta tela é o que torna o motor
 * alcançável — mas a parte difícil não é listar as opções, é deixar claro que
 * **as duas listas se comportam de maneira oposta**:
 *
 *  • "Pode ver" é uma soma — cada linha ACRESCENTA gente;
 *  • "Só quem estiver em" é um filtro — cada linha TIRA gente.
 *
 * Um admin que confunde as duas libera para trezentas pessoas achando que
 * liberou para trinta, e não tem como perceber olhando a tela. Por isso as duas
 * listas ficam visualmente separadas, e uma frase embaixo diz em português o
 * que a configuração faz — a frase é a verificação, não a decoração.
 */

interface Turma {
  _id: string
  nome: string
  totalMembros: number
}

interface Produto {
  itemId: string
  title: string
  itemType: 'material' | 'package'
}

export function EditorDeRegras({
  valor,
  onChange,
  escuro = false,
}: {
  valor: RegrasDeAcessoAula
  onChange: (r: RegrasDeAcessoAula) => void
  /** O editor de aula vive num tema escuro próprio. */
  escuro?: boolean
}) {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [carregandoTurmas, setCarregandoTurmas] = useState(true)
  const [adicionando, setAdicionando] = useState<TipoDeCondicao | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/aulas/grupos', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { grupos: [] }))
      .then((d) => vivo && setTurmas(d.grupos || []))
      .catch(() => {})
      .finally(() => vivo && setCarregandoTurmas(false))
    return () => {
      vivo = false
    }
  }, [])

  const nomeDoAlvo = useMemo(
    () => (c: CondicaoAcesso) => {
      if (c.tipo === 'grupo') {
        return c.titulo || turmas.find((t) => t._id === c.grupoId)?.nome || 'turma'
      }
      return ''
    },
    [turmas],
  )

  const frase = descreverRegras(valor, (c) => nomeDoAlvo(c) || '')

  function trocar(parcial: Partial<RegrasDeAcessoAula>) {
    onChange({ ...valor, ...parcial })
  }

  function acrescentar(condicao: CondicaoAcesso) {
    const chave = chaveDaCondicao(condicao)
    if (valor.liberarPara.some((c) => chaveDaCondicao(c) === chave)) return
    trocar({ liberarPara: [...valor.liberarPara, condicao] })
    setAdicionando(null)
  }

  function remover(indice: number) {
    trocar({ liberarPara: valor.liberarPara.filter((_, i) => i !== indice) })
  }

  function alternarRestricao(turma: Turma) {
    const atuais = valor.exigirTambem || []
    const jaTem = atuais.some((c) => c.grupoId === turma._id)
    const novos = jaTem
      ? atuais.filter((c) => c.grupoId !== turma._id)
      : [...atuais, { tipo: 'grupo' as const, grupoId: turma._id, titulo: turma.nome }]
    trocar({ exigirTambem: novos.length ? novos : undefined })
  }

  const c = cores(escuro)

  return (
    <div className={cn('rounded-xl border p-4', c.caixa)}>
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className={cn('h-4 w-4', c.destaque)} />
        <p className={cn('text-sm font-bold', c.titulo)}>Quem pode ver esta aula</p>
      </div>
      <p className={cn('mb-4 text-xs leading-relaxed', c.apagado)}>
        Cada linha abaixo <strong>soma</strong> gente: basta cumprir uma delas para entrar.
      </p>

      {/* ── Condições (OU) ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {valor.liberarPara.length === 0 ? (
          <p className={cn('rounded-lg border border-dashed px-3 py-4 text-center text-xs', c.borda, c.apagado)}>
            Nenhuma condição — ninguém consegue abrir a aula.
          </p>
        ) : (
          valor.liberarPara.map((condicao, i) => (
            <div
              key={chaveDaCondicao(condicao)}
              className={cn('flex items-start gap-2.5 rounded-lg border px-3 py-2.5', c.item)}
            >
              <Lock className={cn('mt-0.5 h-3.5 w-3.5 flex-none', c.destaque)} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-[13px] font-semibold leading-snug', c.titulo)}>
                  {rotuloDaLinha(condicao, turmas)}
                </p>
                <p className={cn('mt-0.5 text-[11px] leading-relaxed', c.apagado)}>
                  {AJUDA_DA_CONDICAO[condicao.tipo as TipoDeCondicao]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover ${rotuloDaLinha(condicao, turmas)}`}
                className={cn('flex h-7 w-7 flex-none items-center justify-center rounded-md transition', c.botaoIcone)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Adicionar ─────────────────────────────────────────────────── */}
      <div className="mt-3">
        {adicionando === null ? (
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_DE_CONDICAO.filter(
              (t) => !valor.liberarPara.some((c2) => c2.tipo === t && !exigeAlvo(t)),
            ).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => (exigeAlvo(tipo) ? setAdicionando(tipo) : acrescentar({ tipo } as CondicaoAcesso))}
                className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-semibold transition', c.chip)}
              >
                <Plus className="h-3 w-3" />
                {ROTULO_DA_CONDICAO[tipo]}
              </button>
            ))}
          </div>
        ) : adicionando === 'grupo' ? (
          <SeletorDeTurma
            turmas={turmas}
            carregando={carregandoTurmas}
            escuro={escuro}
            onEscolher={(t) => acrescentar({ tipo: 'grupo', grupoId: t._id, titulo: t.nome })}
            onCancelar={() => setAdicionando(null)}
          />
        ) : adicionando === 'material' || adicionando === 'pacote' ? (
          <SeletorDeProduto
            tipo={adicionando}
            escuro={escuro}
            onEscolher={(p) =>
              acrescentar(
                adicionando === 'material'
                  ? { tipo: 'material', itemId: p.itemId, titulo: p.title }
                  : { tipo: 'pacote', itemId: p.itemId, titulo: p.title },
              )
            }
            onCancelar={() => setAdicionando(null)}
          />
        ) : null}
      </div>

      {/* ── Restrição por turma (E) ───────────────────────────────────── */}
      {turmas.length > 0 && (
        <div className={cn('mt-5 border-t pt-4', c.borda)}>
          <div className="mb-1 flex items-center gap-2">
            <Users className={cn('h-3.5 w-3.5', c.destaque)} />
            <p className={cn('text-[13px] font-bold', c.titulo)}>Restringir a uma turma</p>
          </div>
          <p className={cn('mb-2.5 text-xs leading-relaxed', c.apagado)}>
            Isto <strong>tira</strong> gente, não acrescenta: quem cumpre as condições acima ainda
            precisa estar numa das turmas marcadas. Deixe tudo desmarcado para não restringir.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {turmas.map((turma) => {
              const marcada = (valor.exigirTambem || []).some((c2) => c2.grupoId === turma._id)
              return (
                <button
                  key={turma._id}
                  type="button"
                  onClick={() => alternarRestricao(turma)}
                  aria-pressed={marcada}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-semibold transition',
                    marcada ? c.chipAtivo : c.chip,
                  )}
                >
                  {turma.nome}
                  <span className={cn('tabular-nums', c.apagado)}>{turma.totalMembros}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Amostra ───────────────────────────────────────────────────── */}
      <label className={cn('mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border p-3', c.item)}>
        <input
          type="checkbox"
          checked={valor.amostra === true}
          onChange={(e) => trocar({ amostra: e.target.checked })}
          className="mt-0.5 h-3.5 w-3.5 flex-none accent-current"
        />
        <span className="min-w-0">
          <span className={cn('flex items-center gap-1.5 text-[13px] font-semibold', c.titulo)}>
            <Sparkles className="h-3.5 w-3.5" />
            Aula demonstrativa
          </span>
          <span className={cn('mt-0.5 block text-[11px] leading-relaxed', c.apagado)}>
            Libera para quem não cumpre nenhuma condição acima. É o que sustenta &ldquo;aulas 1 e 2
            abertas, 3 a 30 bloqueadas&rdquo; sem precisar duplicar a aula.
          </span>
        </span>
      </label>

      {/* ── A frase é a conferência ───────────────────────────────────── */}
      <p className={cn('mt-4 rounded-lg px-3 py-2.5 text-[12px] leading-relaxed', c.resumo)}>
        {frase}
      </p>
    </div>
  )
}

function rotuloDaLinha(condicao: CondicaoAcesso, turmas: Turma[]): string {
  if (condicao.tipo === 'material' || condicao.tipo === 'pacote') {
    return condicao.titulo || ROTULO_DA_CONDICAO[condicao.tipo]
  }
  if (condicao.tipo === 'grupo') {
    return condicao.titulo || turmas.find((t) => t._id === condicao.grupoId)?.nome || 'Turma'
  }
  return ROTULO_DA_CONDICAO[condicao.tipo as TipoDeCondicao]
}

/* ─────────────────────────── Seletores ─────────────────────────── */

function SeletorDeTurma({
  turmas,
  carregando,
  escuro,
  onEscolher,
  onCancelar,
}: {
  turmas: Turma[]
  carregando: boolean
  escuro: boolean
  onEscolher: (t: Turma) => void
  onCancelar: () => void
}) {
  const c = cores(escuro)

  return (
    <div className={cn('rounded-lg border p-3', c.item)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn('text-[12px] font-bold', c.titulo)}>Escolha a turma</p>
        <button type="button" onClick={onCancelar} className={cn('text-[11px]', c.apagado)}>
          Cancelar
        </button>
      </div>

      {carregando ? (
        <Loader2 className={cn('h-4 w-4 animate-spin', c.apagado)} />
      ) : turmas.length === 0 ? (
        // Sem turmas, a opção seria um beco sem saída: o admin escolheria
        // "turma", não teria nenhuma para apontar e voltaria sem entender.
        <p className={cn('text-[11.5px] leading-relaxed', c.apagado)}>
          Nenhuma turma criada ainda. Crie uma em <strong>Gerenciar aulas → Turmas</strong> e ela
          aparece aqui.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {turmas.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => onEscolher(t)}
              className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-semibold transition', c.chip)}
            >
              {t.nome}
              <span className={c.apagado}>{t.totalMembros}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SeletorDeProduto({
  tipo,
  escuro,
  onEscolher,
  onCancelar,
}: {
  tipo: 'material' | 'pacote'
  escuro: boolean
  onEscolher: (p: Produto) => void
  onCancelar: () => void
}) {
  const [busca, setBusca] = useState('')
  const [itens, setItens] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(false)
  const c = cores(escuro)

  // O tipo do catálogo é 'package'; o da regra é 'pacote'. A tradução mora aqui,
  // e não no motor de acesso, para o vocabulário do domínio seguir em português.
  const tipoNoCatalogo = tipo === 'pacote' ? 'package' : 'material'

  useEffect(() => {
    const termo = busca.trim()
    if (termo.length < 2) {
      setItens([])
      return
    }
    const timer = setTimeout(async () => {
      setCarregando(true)
      try {
        const res = await fetch(`/api/admin/coupons/products?q=${encodeURIComponent(termo)}`, {
          cache: 'no-store',
        })
        const d = await res.json()
        if (res.ok) {
          setItens((d.products || []).filter((p: Produto) => p.itemType === tipoNoCatalogo).slice(0, 8))
        }
      } finally {
        setCarregando(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [busca, tipoNoCatalogo])

  return (
    <div className={cn('rounded-lg border p-3', c.item)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn('text-[12px] font-bold', c.titulo)}>
          Qual {tipo === 'pacote' ? 'pacote' : 'material'}?
        </p>
        <button type="button" onClick={onCancelar} className={cn('text-[11px]', c.apagado)}>
          Cancelar
        </button>
      </div>

      <div className="relative">
        <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2', c.apagado)} />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome..."
          className={cn('h-9 w-full rounded-lg border px-3 pl-9 text-[12.5px] outline-none', c.entrada)}
        />
      </div>

      {carregando ? (
        <Loader2 className={cn('mt-2 h-4 w-4 animate-spin', c.apagado)} />
      ) : itens.length > 0 ? (
        <div className="mt-2 space-y-1">
          {itens.map((p) => (
            <button
              key={p.itemId}
              type="button"
              onClick={() => onEscolher(p)}
              className={cn('block w-full truncate rounded-md px-2.5 py-2 text-left text-[12.5px] transition', c.opcao)}
            >
              {p.title}
            </button>
          ))}
        </div>
      ) : busca.trim().length >= 2 ? (
        <p className={cn('mt-2 text-[11.5px]', c.apagado)}>Nada encontrado.</p>
      ) : null}
    </div>
  )
}

/**
 * Paleta.
 *
 * O editor de aula tem tema escuro próprio (fundo roxo translúcido), enquanto o
 * resto do painel usa os tokens do tema. Um conjunto de classes por aparência
 * evita espalhar condicionais de cor por cada elemento.
 */
function cores(escuro: boolean) {
  return escuro
    ? {
        caixa: 'border-white/10 bg-white/[0.03]',
        item: 'border-white/10 bg-white/[0.04]',
        borda: 'border-white/10',
        titulo: 'text-white',
        apagado: 'text-white/50',
        destaque: 'text-emerald-400',
        chip: 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10',
        chipAtivo: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200',
        botaoIcone: 'text-white/40 hover:bg-white/10 hover:text-white',
        entrada: 'border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-400/50',
        opcao: 'text-white/80 hover:bg-white/10',
        resumo: 'bg-emerald-400/10 text-emerald-100',
      }
    : {
        caixa: 'border-border bg-card',
        item: 'border-border bg-background',
        borda: 'border-border',
        titulo: 'text-foreground',
        apagado: 'text-muted-foreground',
        destaque: 'text-primary',
        chip: 'border-border bg-card text-foreground hover:bg-muted',
        chipAtivo: 'border-primary/50 bg-primary/10 text-primary',
        botaoIcone: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        entrada: 'border-border bg-background text-foreground focus:border-primary/50',
        opcao: 'text-foreground hover:bg-muted',
        resumo: 'bg-primary/10 text-foreground',
      }
}

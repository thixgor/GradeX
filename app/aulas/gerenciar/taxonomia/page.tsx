'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Compass,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  BotaoPrincipal,
  BotaoSecundario,
  Campo,
  PainelDeEnsino,
  classeDeArea,
  classeDeEntrada,
} from '@/components/ensino/painel'
import { EstadoVazio, Esqueleto, Selo } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A organização do conteúdo (§2, §32).
 *
 * O VOCABULÁRIO É FECHADO, E ISSO É O PRODUTO
 *
 * Área → Módulo → Tópico → Subtópico. Quatro níveis, com nomes que significam
 * uma coisa só (§32): Módulo é etapa curricular (Ciclo Básico), Tópico é área
 * de conhecimento (Sistema Cardiovascular), Subtópico é agrupamento
 * intermediário e é OPCIONAL. Foi a ausência desse vocabulário fixo que
 * produziu, no modelo antigo, um "módulo" que às vezes era disciplina e às
 * vezes era aula gigante.
 *
 * A tela impõe isso pela forma: o botão de adicionar dentro de um nó já sabe
 * qual é o nível do filho. Não há como criar um Tópico solto dentro de uma
 * Área, porque a interface nunca oferece essa opção — e o servidor recusaria
 * de qualquer forma.
 */

interface No {
  _id: string
  nome: string
  nivel: string
  paiId: string | null
  slug: string
  descricao?: string
  /** A imagem que representa o nível na navegação do aluno. Ver `taxonomia.ts`. */
  capa?: { imagem?: string; cor?: string } | null
  ordem: number
  oculto?: boolean
}

interface Ramo extends No {
  filhos: Ramo[]
  aulas: number
  aulasNaArvore: number
}

const NIVEIS = ['area', 'modulo', 'topico', 'subtopico'] as const

const ROTULO: Record<string, string> = {
  area: 'Área',
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

const EXEMPLO: Record<string, string> = {
  area: 'Medicina',
  modulo: 'Ciclo Básico',
  topico: 'Sistema Cardiovascular',
  subtopico: 'Fisiologia',
}

const nivelFilho = (nivel: string) => NIVEIS[NIVEIS.indexOf(nivel as any) + 1] || null

export default function TaxonomiaPage() {
  return (
    <AppShell headerTitle="Organização" headerSubtitle="Administração de Ensino">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [arvore, setArvore] = useState<Ramo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [editando, setEditando] = useState<Partial<No> | null>(null)
  const [erro, setErro] = useState('')
  // O nó recusado por ter conteúdo dentro, à espera de uma decisão: mover
  // (fechar o aviso) ou apagar tudo junto (a cascata, ver `excluirEmCascata`).
  const [pendenteCascata, setPendenteCascata] = useState<{
    no: Ramo
    totalNiveis: number
    totalAulas: number
  } | null>(null)
  const [excluindoCascata, setExcluindoCascata] = useState(false)

  const carregar = useCallback(() => {
    fetch('/api/ensino/taxonomia', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.arvore) setArvore(d.arvore)
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  useEffect(carregar, [carregar])

  // As Áreas começam abertas: elas são poucas, e uma árvore toda fechada
  // esconde justamente o que o admin veio conferir.
  useEffect(() => {
    if (arvore.length > 0 && abertos.size === 0) {
      setAbertos(new Set(arvore.map((r) => r._id)))
    }
  }, [arvore, abertos.size])

  async function salvar(no: Partial<No>) {
    setErro('')
    const novo = !no._id
    const resposta = await fetch(
      novo ? '/api/ensino/taxonomia' : `/api/ensino/taxonomia/${no._id}`,
      {
        method: novo ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(no),
      },
    )
    const d = await resposta.json().catch(() => ({}))
    if (!resposta.ok) {
      setErro(d.error || 'Não foi possível salvar.')
      return
    }
    setEditando(null)
    carregar()
  }

  async function excluir(no: Ramo) {
    if (!window.confirm(`Excluir "${no.nome}"?`)) return
    setErro('')
    const resposta = await fetch(`/api/ensino/taxonomia/${no._id}`, { method: 'DELETE' })
    const d = await resposta.json().catch(() => ({}))

    if (resposta.status === 409) {
      // Recusado por ter conteúdo dentro. A rota já manda os números da
      // árvore inteira (totalNiveis/totalAulas) — é o que o diálogo de
      // cascata abaixo precisa para mostrar o tamanho real do estrago antes
      // de oferecer "excluir mesmo assim".
      setPendenteCascata({
        no,
        totalNiveis: d.totalNiveis ?? d.filhos ?? 0,
        totalAulas: d.totalAulas ?? d.aulas ?? 0,
      })
      return
    }

    if (!resposta.ok) {
      setErro(d.error || 'Não foi possível excluir.')
      return
    }
    carregar()
  }

  async function excluirEmCascata() {
    if (!pendenteCascata) return
    setExcluindoCascata(true)
    setErro('')
    try {
      const resposta = await fetch(`/api/ensino/taxonomia/${pendenteCascata.no._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cascata: true }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        setErro(d.error || 'Não foi possível excluir.')
        return
      }
      setPendenteCascata(null)
      carregar()
    } finally {
      setExcluindoCascata(false)
    }
  }

  const total = useMemo(() => {
    const contar = (ramos: Ramo[]): number =>
      ramos.reduce((soma, r) => soma + 1 + contar(r.filhos), 0)
    return contar(arvore)
  }, [arvore])

  return (
    <PainelDeEnsino
      titulo="Organização do conteúdo"
      descricao="Área → Módulo → Tópico → Subtópico. O Subtópico é opcional: nem todo conteúdo precisa de mais um nível."
      acoes={
        <BotaoPrincipal onClick={() => setEditando({ nivel: 'area', paiId: null })}>
          <Plus className="h-4 w-4" /> Nova Área
        </BotaoPrincipal>
      }
    >
      {erro ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{erro}</span>
          <button type="button" onClick={() => setErro('')} aria-label="Fechar aviso">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Esqueleto key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : arvore.length === 0 ? (
        <EstadoVazio
          icone={Compass}
          titulo="Comece pela Área"
          descricao="Uma Área é o grande domínio: Medicina. Dentro dela vêm os Módulos — Ciclo Básico, Ciclo Clínico, Internato."
          acaoLabel="Criar a Área"
          onAcao={() => setEditando({ nivel: 'area', paiId: null })}
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {total} {total === 1 ? 'nível cadastrado' : 'níveis cadastrados'}
          </p>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            {arvore.map((ramo) => (
              <LinhaDoRamo
                key={ramo._id}
                ramo={ramo}
                profundidade={0}
                abertos={abertos}
                aoAlternar={(id) =>
                  setAbertos((atual) => {
                    const proximo = new Set(atual)
                    if (proximo.has(id)) proximo.delete(id)
                    else proximo.add(id)
                    return proximo
                  })
                }
                aoEditar={setEditando}
                aoExcluir={excluir}
              />
            ))}
          </div>
        </>
      )}

      {editando ? (
        <FormularioDeNo
          no={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={salvar}
          erro={erro}
        />
      ) : null}

      {pendenteCascata ? (
        <ConfirmacaoDeCascata
          nome={pendenteCascata.no.nome}
          totalNiveis={pendenteCascata.totalNiveis}
          totalAulas={pendenteCascata.totalAulas}
          ocupado={excluindoCascata}
          aoCancelar={() => setPendenteCascata(null)}
          aoConfirmar={excluirEmCascata}
        />
      ) : null}
    </PainelDeEnsino>
  )
}

function LinhaDoRamo({
  ramo,
  profundidade,
  abertos,
  aoAlternar,
  aoEditar,
  aoExcluir,
}: {
  ramo: Ramo
  profundidade: number
  abertos: Set<string>
  aoAlternar: (id: string) => void
  aoEditar: (no: Partial<No>) => void
  aoExcluir: (no: Ramo) => void
}) {
  const aberto = abertos.has(ramo._id)
  const filho = nivelFilho(ramo.nivel)

  return (
    <>
      <div
        className="flex items-center gap-2 border-b border-border/50 py-2 pr-3 transition hover:bg-muted/40"
        style={{ paddingLeft: `${0.75 + profundidade * 1.25}rem` }}
      >
        <button
          type="button"
          onClick={() => aoAlternar(ramo._id)}
          aria-label={aberto ? 'Recolher' : 'Expandir'}
          aria-expanded={aberto}
          className={cn(
            'inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background',
            ramo.filhos.length === 0 && 'invisible',
          )}
        >
          {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{ramo.nome}</span>
            <Selo>{ROTULO[ramo.nivel]}</Selo>
            {ramo.oculto ? (
              <Selo tom="aviso">
                <EyeOff className="h-3 w-3" /> Oculto
              </Selo>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {ramo.aulasNaArvore} {ramo.aulasNaArvore === 1 ? 'aula' : 'aulas'}
            {ramo.aulas !== ramo.aulasNaArvore ? ` · ${ramo.aulas} diretamente aqui` : ''}
            {ramo.descricao ? ` · ${ramo.descricao}` : ''}
          </span>
        </span>

        <div className="flex flex-none items-center gap-0.5">
          {filho ? (
            <button
              type="button"
              onClick={() => aoEditar({ nivel: filho, paiId: ramo._id })}
              title={`Novo ${ROTULO[filho]} aqui`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-primary"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => aoEditar(ramo)}
            title="Editar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => aoExcluir(ramo)}
            title="Excluir"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {aberto
        ? ramo.filhos.map((f) => (
            <LinhaDoRamo
              key={f._id}
              ramo={f}
              profundidade={profundidade + 1}
              abertos={abertos}
              aoAlternar={aoAlternar}
              aoEditar={aoEditar}
              aoExcluir={aoExcluir}
            />
          ))
        : null}
    </>
  )
}

function FormularioDeNo({
  no,
  aoFechar,
  aoSalvar,
  erro,
}: {
  no: Partial<No>
  aoFechar: () => void
  aoSalvar: (no: Partial<No>) => Promise<void>
  erro: string
}) {
  const [dados, setDados] = useState<Partial<No>>(no)
  const [salvando, setSalvando] = useState(false)
  const novo = !no._id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={aoFechar}>
      <div
        className="w-full max-w-md rounded-2xl bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {novo ? `${ROTULO[dados.nivel || 'area']} novo` : `Editar ${ROTULO[dados.nivel || 'area']}`}
        </h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
          Exemplo: {EXEMPLO[dados.nivel || 'area']}
        </p>

        <div className="space-y-3">
          <Campo rotulo="Nome">
            <input
              autoFocus
              value={dados.nome || ''}
              onChange={(e) => setDados({ ...dados, nome: e.target.value })}
              placeholder={EXEMPLO[dados.nivel || 'area']}
              className={classeDeEntrada}
            />
          </Campo>

          <Campo rotulo="Descrição" dica="Aparece na navegação do aluno. Opcional.">
            <textarea
              value={dados.descricao || ''}
              onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
              rows={2}
              className={classeDeArea}
            />
          </Campo>

          {/* A capa é opcional em dois níveis: sem imagem o cartão usa a cor,
              e sem nada o nível empresta a capa de uma aula de dentro dele
              (`herdarCapas`). Este campo existe para a curadoria — a etapa
              curricular que merece uma imagem escolhida, não a primeira que
              apareceu. */}
          <Campo
            rotulo="Capa"
            dica="URL da imagem que representa este nível na navegação. Sem ela, o nível usa a capa de uma aula de dentro."
          >
            <input
              value={dados.capa?.imagem || ''}
              onChange={(e) =>
                setDados({ ...dados, capa: { ...dados.capa, imagem: e.target.value } })
              }
              placeholder="https://…"
              inputMode="url"
              className={classeDeEntrada}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Cor de acento" dica="Usada quando não há imagem.">
              <input
                type="color"
                value={dados.capa?.cor || '#468152'}
                onChange={(e) =>
                  setDados({ ...dados, capa: { ...dados.capa, cor: e.target.value } })
                }
                className="h-11 w-full cursor-pointer rounded-lg border border-border bg-card p-1"
              />
            </Campo>

            <Campo rotulo="Ordem">
              <input
                type="number"
                value={dados.ordem ?? 0}
                onChange={(e) => setDados({ ...dados, ordem: Number(e.target.value) || 0 })}
                className={classeDeEntrada}
              />
            </Campo>

            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={dados.oculto === true}
                onChange={(e) => setDados({ ...dados, oculto: e.target.checked })}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              Ocultar do aluno
            </label>
          </div>
        </div>

        {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

        <div className="mt-5 flex gap-2">
          <BotaoPrincipal
            onClick={async () => {
              setSalvando(true)
              await aoSalvar(dados)
              setSalvando(false)
            }}
            carregando={salvando}
          >
            {novo ? 'Criar' : 'Salvar'}
          </BotaoPrincipal>
          <BotaoSecundario onClick={aoFechar}>Cancelar</BotaoSecundario>
        </div>
      </div>
    </div>
  )
}

/**
 * A confirmação da exclusão em cascata.
 *
 * O NÓ VAZIO CONTINUA SENDO UM CLIQUE
 *
 * Este diálogo só aparece quando a exclusão simples já foi recusada — ou
 * seja, quando há mesmo algo dentro. Ele nunca substitui o fluxo normal; é o
 * degrau que existe porque às vezes "mover o conteúdo antes" é trabalho
 * inteiro, e o admin realmente quer dizer "não, apaga tudo junto".
 *
 * A ESCALADA É PELO NÚMERO DE AULAS, NÃO DE NÍVEIS
 *
 * Um Módulo vazio com três Tópicos igualmente vazios é uma limpeza de
 * estrutura — irrelevante o quanto se repita. É a AULA que carrega progresso e
 * anotação de gente de verdade, e é o total de aulas que decide se um clique
 * basta ou se é preciso digitar a palavra (mesmo limiar da exclusão em massa
 * do catálogo, para o admin não aprender dois comportamentos diferentes para
 * o mesmo risco).
 */
function ConfirmacaoDeCascata({
  nome,
  totalNiveis,
  totalAulas,
  ocupado,
  aoCancelar,
  aoConfirmar,
}: {
  nome: string
  totalNiveis: number
  totalAulas: number
  ocupado: boolean
  aoCancelar: () => void
  aoConfirmar: () => void
}) {
  const exigeDigitar = totalAulas > 10
  const [texto, setTexto] = useState('')
  const liberado = !exigeDigitar || texto.trim().toUpperCase() === 'EXCLUIR'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={aoCancelar}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
          <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
        </span>

        <h2 className="mt-4 font-heading text-xl font-extrabold tracking-tight">
          Excluir &ldquo;{nome}&rdquo; com tudo dentro?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Isso apaga{' '}
          {totalNiveis > 0
            ? `${totalNiveis} ${totalNiveis === 1 ? 'nível' : 'níveis'} de organização`
            : ''}
          {totalNiveis > 0 && totalAulas > 0 ? ' e ' : ''}
          {totalAulas > 0 ? `${totalAulas} ${totalAulas === 1 ? 'aula' : 'aulas'}` : ''} de vez,
          junto com o progresso e as anotações de quem já assistiu. As Trilhas que usavam essas
          aulas continuam existindo — só ficam sem elas.
        </p>

        <p className="mt-2 text-sm font-semibold">Não dá para desfazer.</p>

        {exigeDigitar ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Digite EXCLUIR para confirmar
            </span>
            <input
              value={texto}
              autoFocus
              onChange={(e) => setTexto(e.target.value)}
              className={cn(classeDeEntrada, 'uppercase tracking-widest')}
            />
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <BotaoSecundario tom="perigo" onClick={aoConfirmar} disabled={!liberado || ocupado}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {ocupado ? 'Excluindo…' : 'Excluir tudo'}
          </BotaoSecundario>
          <BotaoSecundario onClick={aoCancelar}>Cancelar</BotaoSecundario>
        </div>
      </motion.div>
    </div>
  )
}

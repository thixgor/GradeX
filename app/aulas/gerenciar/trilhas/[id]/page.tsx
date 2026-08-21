'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Layers,
  Link2,
  Plus,
  Search,
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
import { EditorDeRegras } from '@/components/aulas/editor-regras'
import { Esqueleto, Selo } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * O construtor de Trilhas (§6, §7).
 *
 * A IDEIA QUE GOVERNA ESTA TELA
 *
 * Montar uma Trilha é ARRUMAR referências, não criar conteúdo. Por isso a tela
 * tem duas metades: à esquerda o caminho sendo montado (etapas e aulas em
 * ordem), à direita o acervo inteiro com busca. Adicionar é um clique; mover é
 * arrastar. Em nenhum momento existe um formulário de "criar aula dentro da
 * Trilha" — se ele existisse, a primeira reação natural do administrador seria
 * duplicar conteúdo, que é exatamente o que a arquitetura existe para evitar.
 *
 * POR QUE ARRASTAR COM API NATIVA
 *
 * A ordem das aulas é a substância de uma Trilha, e mexer nela precisa ser
 * barato. A API de arrastar do navegador cobre o caso inteiro sem trazer uma
 * biblioteca de mil linhas para o pacote — e as setas ao lado garantem que
 * quem usa teclado ou toque também consiga reordenar. Arrastar não pode ser a
 * ÚNICA forma de reordenar; no celular, ele mal existe.
 *
 * SALVAR É EXPLÍCITO
 *
 * Nada é gravado a cada tecla. Montar um caminho envolve tentativas — mover a
 * mesma aula três vezes até a ordem ficar boa — e um salvamento automático
 * transformaria cada tentativa numa escrita. O botão fica fixo no rodapé e diz
 * quando há mudanças pendentes.
 */

interface AulaDoAcervo {
  _id: string
  titulo: string
  localizacao?: string
  duracaoLabel?: string
  recursos?: { resumo?: boolean; pdf?: boolean; flashcards?: boolean }
  trilhas?: Array<{ slug: string; titulo: string }>
}

interface ItemNaEtapa {
  id: string
  tipo: string
  refId: string
  /** Só para `link` — os demais tipos referenciam por `refId`. */
  url?: string
  rotulo?: string
  nota?: string
  obrigatorio?: boolean
}

interface EtapaEmEdicao {
  id: string
  titulo: string
  descricao?: string
  itens: ItemNaEtapa[]
}

interface TrilhaEmEdicao {
  _id: string
  slug: string
  titulo: string
  subtitulo?: string
  descricao?: string
  objetivo?: string
  publico?: string
  nivel?: string
  duracaoEstimadaMin?: number
  aprendizados?: string[]
  capa?: { tipo: 'imagem' | 'cor'; imagem?: string; cor?: string } | null
  certificado?: { ativo: boolean } | null
  regrasAcesso?: any
  prerequisitos?: string[]
  destaque?: boolean
  situacao: string
  etapas: EtapaEmEdicao[]
}

const idLocal = (prefixo: string) =>
  `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export default function ConstrutorDeTrilhaPage() {
  return (
    <AppShell headerTitle="Montar Trilha" headerSubtitle="Construtor de caminhos">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams()
  const router = useRouter()
  const trilhaId = String(params?.id || '')

  const [trilha, setTrilha] = useState<TrilhaEmEdicao | null>(null)
  const [acervo, setAcervo] = useState<AulaDoAcervo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sujo, setSujo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [buscaNoAcervo, setBuscaNoAcervo] = useState('')
  const [abaDetalhes, setAbaDetalhes] = useState(false)

  /** Etapa que recebe a aula clicada no acervo. */
  const [etapaAlvo, setEtapaAlvo] = useState<string>('')
  /** Etapa com o formulário de conteúdo complementar aberto. */
  const [complementarEm, setComplementarEm] = useState('')
  const [trilhasIrmas, setTrilhasIrmas] = useState<Array<{ _id: string; titulo: string }>>([])
  const arrastando = useRef<{ etapaId: string; itemId: string } | null>(null)

  useEffect(() => {
    if (!trilhaId) return
    let cancelado = false

    Promise.all([
      fetch(`/api/ensino/trilhas/${trilhaId}`, { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch('/api/ensino/catalogo?admin=1&limite=300&comTrilhas=1', { cache: 'no-store' }).then(
        (r) => (r.ok ? r.json() : null),
      ),
      fetch('/api/ensino/trilhas?rascunhos=1', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([detalhe, catalogo, todas]) => {
        if (cancelado) return

        /**
         * O acervo do editor é a UNIÃO de duas fontes — não só o catálogo.
         *
         * O bug que isto conserta: `/api/ensino/trilhas/[id]` já resolve CADA
         * item por uma consulta sem paginação (`_id: {$in: [...todos os
         * refIds]}`) e devolve o cartão embutido em `item.aula`. O editor
         * jogava essa resolução fora e reconstruía o mapa de aulas só a
         * partir do catálogo (`limite=300`, as mais recentes) — então
         * qualquer aula referenciada que não estivesse entre as 300 últimas
         * criadas aparecia como "Aula removida do acervo" mesmo existindo de
         * verdade, com o `refId` certo, resolvida pelo próprio servidor um
         * instante antes.
         *
         * As aulas já embutidas na Trilha entram no `acervo` junto com as do
         * catálogo: o catálogo continua servindo o SELETOR de "adicionar
         * aula" (não precisa ser o acervo inteiro, 300 recentes + busca
         * basta); a união garante que toda referência que a Trilha JÁ TEM
         * resolve — nunca de novo por causa de paginação.
         */
        const aulasEmbutidas: any[] = []
        for (const etapa of detalhe?.trilha?.etapas || []) {
          for (const item of etapa.itens || []) {
            if (item.tipo === 'aula' && item.aula) aulasEmbutidas.push(item.aula)
          }
        }

        if (detalhe?.trilha) {
          // O GET devolve os itens já resolvidos com a aula embutida; o editor
          // guarda só a referência, que é o que será salvo de volta.
          const etapas: EtapaEmEdicao[] = (detalhe.trilha.etapas || []).map((etapa: any) => ({
            id: etapa.id,
            titulo: etapa.titulo,
            descricao: etapa.descricao,
            itens: (etapa.itens || []).map((item: any) => ({
              id: item.id,
              tipo: item.tipo,
              refId: item.refId,
              rotulo: item.rotulo,
              nota: item.nota,
              obrigatorio: item.obrigatorio !== false,
            })),
          }))
          setTrilha({ ...detalhe.trilha, etapas })
          setEtapaAlvo(etapas[0]?.id || '')
        }
        {
          const doCatalogo: any[] = catalogo?.aulas || []
          const idsDoCatalogo = new Set(doCatalogo.map((a) => a._id))
          const extras = aulasEmbutidas.filter((a) => a?._id && !idsDoCatalogo.has(a._id))
          if (doCatalogo.length || extras.length) setAcervo([...doCatalogo, ...extras])
        }
        if (todas?.trilhas) {
          setTrilhasIrmas(
            todas.trilhas
              .filter((t: any) => t._id !== trilhaId)
              .map((t: any) => ({ _id: t._id, titulo: t.titulo })),
          )
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [trilhaId])

  /** Aviso ao sair com mudanças por salvar — a Trilha é trabalho de horas. */
  useEffect(() => {
    if (!sujo) return
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  const aulaPorId = useMemo(() => new Map(acervo.map((a) => [a._id, a])), [acervo])

  const usadas = useMemo(() => {
    const conjunto = new Set<string>()
    for (const etapa of trilha?.etapas || []) {
      for (const item of etapa.itens) if (item.tipo === 'aula') conjunto.add(item.refId)
    }
    return conjunto
  }, [trilha])

  const acervoFiltrado = useMemo(() => {
    const termo = buscaNoAcervo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    if (!termo) return acervo.slice(0, 60)
    return acervo
      .filter((aula) =>
        `${aula.titulo} ${aula.localizacao || ''}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(termo),
      )
      .slice(0, 60)
  }, [acervo, buscaNoAcervo])

  /* =================== EDIÇÃO =================== */

  const alterar = useCallback((mudanca: Partial<TrilhaEmEdicao>) => {
    setTrilha((atual) => (atual ? { ...atual, ...mudanca } : atual))
    setSujo(true)
    setMensagem('')
  }, [])

  const alterarEtapas = useCallback(
    (proximas: EtapaEmEdicao[]) => {
      alterar({ etapas: proximas })
    },
    [alterar],
  )

  function novaEtapa() {
    if (!trilha) return
    const etapa: EtapaEmEdicao = {
      id: idLocal('e'),
      titulo: `Etapa ${trilha.etapas.length + 1}`,
      itens: [],
    }
    alterarEtapas([...trilha.etapas, etapa])
    setEtapaAlvo(etapa.id)
  }

  function adicionarAula(aulaId: string) {
    if (!trilha) return
    let etapas = trilha.etapas
    // Sem nenhuma etapa, criar uma primeira em vez de recusar: a Trilha mais
    // simples possível é uma etapa só, e obrigar o admin a criá-la antes de
    // adicionar a primeira aula é atrito puro.
    if (etapas.length === 0) {
      const primeira: EtapaEmEdicao = { id: idLocal('e'), titulo: 'Etapa 1', itens: [] }
      etapas = [primeira]
      setEtapaAlvo(primeira.id)
    }
    const alvo = etapas.find((e) => e.id === etapaAlvo) || etapas[etapas.length - 1]
    alterarEtapas(
      etapas.map((etapa) =>
        etapa.id === alvo.id
          ? {
              ...etapa,
              itens: [
                ...etapa.itens,
                // `rotulo` guarda o título de agora — nunca aparece por cima
                // do título de verdade (o item sempre mostra o da aula viva),
                // mas é o que sobra se um dia este id parar de resolver.
                {
                  id: idLocal('i'),
                  tipo: 'aula',
                  refId: aulaId,
                  rotulo: aulaPorId.get(aulaId)?.titulo,
                  obrigatorio: true,
                },
              ],
            }
          : etapa,
      ),
    )
  }

  /**
   * Conteúdo complementar (§6).
   *
   * Um material, um deck, uma prova ou um link externo dentro da etapa. Entra
   * como NÃO obrigatório por padrão: complementar que conta no progresso é uma
   * contradição, e faria a barra do aluno parar em 94% para sempre.
   */
  function adicionarComplementar(etapaId: string, tipo: string, valor: string, rotulo: string) {
    if (!trilha) return
    const limpo = valor.trim()
    if (!limpo) return
    alterarEtapas(
      trilha.etapas.map((etapa) =>
        etapa.id === etapaId
          ? {
              ...etapa,
              itens: [
                ...etapa.itens,
                {
                  id: idLocal('i'),
                  tipo,
                  refId: tipo === 'link' ? '' : limpo,
                  ...(tipo === 'link' ? { url: limpo } : {}),
                  rotulo: rotulo.trim() || undefined,
                  obrigatorio: false,
                },
              ],
            }
          : etapa,
      ),
    )
    setComplementarEm('')
  }

  function removerItem(etapaId: string, itemId: string) {
    if (!trilha) return
    alterarEtapas(
      trilha.etapas.map((etapa) =>
        etapa.id === etapaId
          ? { ...etapa, itens: etapa.itens.filter((i) => i.id !== itemId) }
          : etapa,
      ),
    )
  }

  function moverItem(etapaId: string, indice: number, direcao: -1 | 1) {
    if (!trilha) return
    alterarEtapas(
      trilha.etapas.map((etapa) => {
        if (etapa.id !== etapaId) return etapa
        const destino = indice + direcao
        if (destino < 0 || destino >= etapa.itens.length) return etapa
        const itens = [...etapa.itens]
        ;[itens[indice], itens[destino]] = [itens[destino], itens[indice]]
        return { ...etapa, itens }
      }),
    )
  }

  /** Solta o item arrastado antes de `indiceDestino` na etapa de destino. */
  function soltar(etapaDestino: string, indiceDestino: number) {
    const origem = arrastando.current
    arrastando.current = null
    if (!origem || !trilha) return

    const etapaOrigem = trilha.etapas.find((e) => e.id === origem.etapaId)
    const item = etapaOrigem?.itens.find((i) => i.id === origem.itemId)
    if (!item) return

    const semItem = trilha.etapas.map((etapa) => ({
      ...etapa,
      itens: etapa.itens.filter((i) => i.id !== origem.itemId),
    }))

    alterarEtapas(
      semItem.map((etapa) => {
        if (etapa.id !== etapaDestino) return etapa
        const itens = [...etapa.itens]
        itens.splice(Math.min(indiceDestino, itens.length), 0, item)
        return { ...etapa, itens }
      }),
    )
  }

  function moverEtapa(indice: number, direcao: -1 | 1) {
    if (!trilha) return
    const destino = indice + direcao
    if (destino < 0 || destino >= trilha.etapas.length) return
    const etapas = [...trilha.etapas]
    ;[etapas[indice], etapas[destino]] = [etapas[destino], etapas[indice]]
    alterarEtapas(etapas)
  }

  function removerEtapa(etapaId: string) {
    if (!trilha) return
    alterarEtapas(trilha.etapas.filter((e) => e.id !== etapaId))
  }

  /* =================== SALVAR =================== */

  async function salvar(situacao?: string) {
    if (!trilha) return
    setSalvando(true)
    setErro('')
    setMensagem('')
    try {
      const resposta = await fetch(`/api/ensino/trilhas/${trilha._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trilha, ...(situacao ? { situacao } : {}) }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível salvar.')
      setSujo(false)
      setMensagem(
        situacao === 'publicada'
          ? 'Trilha publicada.'
          : situacao === 'rascunho'
            ? 'Trilha voltou para rascunho.'
            : 'Alterações salvas.',
      )
      if (situacao) setTrilha({ ...trilha, situacao })
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!trilha) return
    if (
      !window.confirm(
        'Excluir esta Trilha? As aulas continuam existindo — só o caminho é desfeito.',
      )
    ) {
      return
    }
    await fetch(`/api/ensino/trilhas/${trilha._id}`, { method: 'DELETE' })
    router.push('/aulas/gerenciar/trilhas')
  }

  if (carregando) {
    return (
      <PainelDeEnsino titulo="Carregando…" voltarPara="/aulas/gerenciar/trilhas">
        <Esqueleto className="h-96 w-full" />
      </PainelDeEnsino>
    )
  }

  if (!trilha) {
    return (
      <PainelDeEnsino titulo="Trilha não encontrada" voltarPara="/aulas/gerenciar/trilhas">
        <p className="text-sm text-muted-foreground">
          Ela pode ter sido excluída. Volte para a lista de Trilhas.
        </p>
      </PainelDeEnsino>
    )
  }

  const totalDeAulas = trilha.etapas.reduce(
    (soma, etapa) => soma + etapa.itens.filter((i) => i.tipo === 'aula').length,
    0,
  )

  return (
    <PainelDeEnsino
      largura="larga"
      voltarPara="/aulas/gerenciar/trilhas"
      titulo={trilha.titulo}
      descricao={`${totalDeAulas} ${totalDeAulas === 1 ? 'aula' : 'aulas'} em ${trilha.etapas.length} ${trilha.etapas.length === 1 ? 'etapa' : 'etapas'} · ${trilha.situacao === 'publicada' ? 'publicada' : 'rascunho'}`}
      acoes={
        <>
          <BotaoSecundario href={`/aulas/trilhas/${trilha.slug}`}>
            <Eye className="h-4 w-4" /> Ver
          </BotaoSecundario>
          {trilha.situacao === 'publicada' ? (
            <BotaoSecundario onClick={() => salvar('rascunho')}>Despublicar</BotaoSecundario>
          ) : (
            <BotaoPrincipal onClick={() => salvar('publicada')} carregando={salvando}>
              Publicar
            </BotaoPrincipal>
          )}
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ══ O caminho ═══════════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Detalhes recolhíveis: montar o caminho é o trabalho principal, e
              os metadados não podem empurrar as etapas para fora da tela. */}
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <button
              type="button"
              onClick={() => setAbaDetalhes((v) => !v)}
              aria-expanded={abaDetalhes}
              className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-muted/50"
            >
              <span className="flex-1 font-heading text-base font-semibold tracking-tight">
                Identidade da Trilha
              </span>
              <span className="text-xs text-muted-foreground">
                título, capa, objetivo, nível, certificado
              </span>
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition', abaDetalhes && 'rotate-180')}
              />
            </button>

            {abaDetalhes ? (
              <div className="grid gap-4 border-t border-border/60 p-4 sm:grid-cols-2">
                <Campo rotulo="Título" className="sm:col-span-2">
                  <input
                    value={trilha.titulo}
                    onChange={(e) => alterar({ titulo: e.target.value })}
                    className={classeDeEntrada}
                  />
                </Campo>

                <Campo rotulo="Subtítulo" dica="Uma frase que aparece sob o título nos cartões.">
                  <input
                    value={trilha.subtitulo || ''}
                    onChange={(e) => alterar({ subtitulo: e.target.value })}
                    placeholder="Do débito cardíaco ao tratamento da ICFEr"
                    className={classeDeEntrada}
                  />
                </Campo>

                <Campo rotulo="Público" dica="Ciclo Clínico, Internato, Residência…">
                  <input
                    value={trilha.publico || ''}
                    onChange={(e) => alterar({ publico: e.target.value })}
                    className={classeDeEntrada}
                  />
                </Campo>

                <Campo rotulo="Nível">
                  <select
                    value={trilha.nivel || ''}
                    onChange={(e) => alterar({ nivel: e.target.value })}
                    className={classeDeEntrada}
                  >
                    <option value="">Não definido</option>
                    <option value="iniciante">Do zero</option>
                    <option value="intermediario">Intermediária</option>
                    <option value="avancado">Avançada</option>
                  </select>
                </Campo>

                <Campo
                  rotulo="Duração estimada (min)"
                  dica="Deixe vazio para somar a duração das aulas."
                >
                  <input
                    type="number"
                    min={0}
                    value={trilha.duracaoEstimadaMin || ''}
                    onChange={(e) => alterar({ duracaoEstimadaMin: Number(e.target.value) || 0 })}
                    className={classeDeEntrada}
                  />
                </Campo>

                <Campo rotulo="Objetivo" className="sm:col-span-2">
                  <textarea
                    value={trilha.objetivo || ''}
                    onChange={(e) => alterar({ objetivo: e.target.value })}
                    rows={2}
                    placeholder="Ao final, o aluno entende, diagnostica e trata insuficiência cardíaca."
                    className={classeDeArea}
                  />
                </Campo>

                <Campo rotulo="Descrição" className="sm:col-span-2">
                  <textarea
                    value={trilha.descricao || ''}
                    onChange={(e) => alterar({ descricao: e.target.value })}
                    rows={3}
                    className={classeDeArea}
                  />
                </Campo>

                <Campo
                  rotulo="Ao concluir, o aluno saberá"
                  dica="Uma competência por linha."
                  className="sm:col-span-2"
                >
                  <textarea
                    value={(trilha.aprendizados || []).join('\n')}
                    onChange={(e) =>
                      alterar({
                        aprendizados: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder={'Explicar a fisiopatologia da IC\nClassificar pela fração de ejeção'}
                    className={classeDeArea}
                  />
                </Campo>

                <Campo rotulo="Capa (URL da imagem)" className="sm:col-span-2">
                  <input
                    value={trilha.capa?.imagem || ''}
                    onChange={(e) =>
                      alterar({
                        capa: e.target.value ? { tipo: 'imagem', imagem: e.target.value } : null,
                      })
                    }
                    placeholder="https://…"
                    className={classeDeEntrada}
                  />
                </Campo>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={trilha.destaque === true}
                    onChange={(e) => alterar({ destaque: e.target.checked })}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  Destacar como &ldquo;Comece por aqui&rdquo;
                </label>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={trilha.certificado?.ativo === true}
                    onChange={(e) => alterar({ certificado: e.target.checked ? { ativo: true } : null })}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  <Award className="h-4 w-4 text-muted-foreground" /> Emitir certificado ao concluir
                </label>

                {/*
                 * Quem pode entrar na Trilha (§24, §25).
                 *
                 * É o MESMO editor e o MESMO motor de acesso das aulas — de
                 * propósito. Uma segunda implementação aqui divergiria da
                 * primeira no primeiro ajuste, e o cadeado da Trilha deixaria de
                 * bater com o das aulas dentro dela.
                 *
                 * Isto é o que liga Ensino a /materiais: um produto entrega a
                 * Trilha inteira quando ela tem a condição "comprou o material
                 * X". O aluno não precisa entender nada disso — para ele a
                 * Trilha simplesmente aparece liberada.
                 */}
                <Campo
                  rotulo="Trilhas recomendadas antes desta"
                  dica="Recomendação, nunca bloqueio — o aluno decide se pula."
                  className="sm:col-span-2"
                >
                  <select
                    multiple
                    size={Math.min(5, Math.max(2, trilhasIrmas.length))}
                    value={trilha.prerequisitos || []}
                    onChange={(e) =>
                      alterar({
                        prerequisitos: Array.from(e.target.selectedOptions).map((o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm outline-none transition focus:border-primary/50"
                  >
                    {trilhasIrmas.map((irma) => (
                      <option key={irma._id} value={irma._id}>
                        {irma.titulo}
                      </option>
                    ))}
                  </select>
                </Campo>

                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Quem pode fazer esta Trilha
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Deixe vazio para a Trilha seguir o acesso de cada aula. Cada aula continua com o
                    próprio cadeado — este aqui é a porta de entrada do caminho.
                  </p>
                  <EditorDeRegras
                    valor={trilha.regrasAcesso || null}
                    onChange={(regras) => alterar({ regrasAcesso: regras })}
                  />
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Etapas ────────────────────────────────────────────── */}
          {trilha.etapas.map((etapa, indiceDaEtapa) => (
            <section
              key={etapa.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-muted text-xs font-bold tabular-nums">
                  {indiceDaEtapa + 1}
                </span>
                <input
                  value={etapa.titulo}
                  onChange={(e) =>
                    alterarEtapas(
                      trilha.etapas.map((x) =>
                        x.id === etapa.id ? { ...x, titulo: e.target.value } : x,
                      ),
                    )
                  }
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 font-heading text-base font-semibold tracking-tight outline-none transition hover:border-border focus:border-primary/50 focus:bg-background"
                />
                <span className="flex-none text-xs tabular-nums text-muted-foreground">
                  {etapa.itens.length}
                </span>
                <div className="flex flex-none items-center">
                  <button
                    type="button"
                    onClick={() => moverEtapa(indiceDaEtapa, -1)}
                    aria-label="Subir etapa"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverEtapa(indiceDaEtapa, 1)}
                    aria-label="Descer etapa"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerEtapa(etapa.id)}
                    aria-label="Excluir etapa"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                className="p-1.5"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltar(etapa.id, etapa.itens.length)}
              >
                {etapa.itens.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Arraste aulas para cá, ou selecione esta etapa e clique numa aula do acervo.
                  </p>
                ) : (
                  etapa.itens.map((item, indice) => {
                    const aula = aulaPorId.get(item.refId)
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => {
                          arrastando.current = { etapaId: etapa.id, itemId: item.id }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation()
                          soltar(etapa.id, indice)
                        }}
                        className="group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-muted/60"
                      >
                        <GripVertical className="h-4 w-4 flex-none cursor-grab text-muted-foreground/60" />
                        <span className="w-5 flex-none text-center text-xs font-bold tabular-nums text-muted-foreground">
                          {indice + 1}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {item.tipo !== 'aula' ? <IconeDoTipo tipo={item.tipo} /> : null}
                            {item.tipo === 'aula'
                              ? aula?.titulo || item.rotulo || 'Aula removida do acervo'
                              : item.rotulo || ROTULO_DO_TIPO[item.tipo] || 'Conteúdo complementar'}
                          </span>
                          {item.tipo === 'aula' && aula?.localizacao ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {aula.localizacao}
                            </span>
                          ) : item.tipo !== 'aula' ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.url || item.refId}
                            </span>
                          ) : null}
                        </span>

                        {!item.obrigatorio ? <Selo>Complementar</Selo> : null}
                        {aula?.duracaoLabel ? (
                          <span className="flex-none text-xs tabular-nums text-muted-foreground">
                            {aula.duracaoLabel}
                          </span>
                        ) : null}

                        <span className="flex flex-none items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => moverItem(etapa.id, indice, -1)}
                            aria-label="Subir"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverItem(etapa.id, indice, 1)}
                            aria-label="Descer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              alterarEtapas(
                                trilha.etapas.map((x) =>
                                  x.id === etapa.id
                                    ? {
                                        ...x,
                                        itens: x.itens.map((i) =>
                                          i.id === item.id
                                            ? { ...i, obrigatorio: !i.obrigatorio }
                                            : i,
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                            title={
                              item.obrigatorio
                                ? 'Tornar complementar (não conta no progresso)'
                                : 'Tornar obrigatória'
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removerItem(etapa.id, item.id)}
                            aria-label="Remover da Trilha"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setEtapaAlvo(etapa.id)}
                  className={cn(
                    'flex-1 px-4 py-2 text-xs font-semibold transition',
                    etapaAlvo === etapa.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {etapaAlvo === etapa.id
                    ? 'Recebendo as aulas que você clicar no acervo →'
                    : 'Adicionar aulas nesta etapa'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setComplementarEm((atual) => (atual === etapa.id ? '' : etapa.id))
                  }
                  className="flex-none border-l border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  + Complementar
                </button>
              </div>

              {complementarEm === etapa.id ? (
                <FormularioComplementar
                  aoAdicionar={(tipo, valor, rotulo) =>
                    adicionarComplementar(etapa.id, tipo, valor, rotulo)
                  }
                  aoCancelar={() => setComplementarEm('')}
                />
              ) : null}
            </section>
          ))}

          <button
            type="button"
            onClick={novaEtapa}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-4 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Nova etapa
          </button>

          <div className="pt-2">
            <BotaoSecundario tom="perigo" onClick={excluir}>
              <Trash2 className="h-4 w-4" /> Excluir Trilha
            </BotaoSecundario>
          </div>
        </div>

        {/* ══ O acervo ════════════════════════════════════════════════ */}
        <aside className="xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="border-b border-border/60 p-3">
              <h2 className="mb-2 font-heading text-base font-semibold tracking-tight">
                Acervo de aulas
              </h2>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={buscaNoAcervo}
                  onChange={(e) => setBuscaNoAcervo(e.target.value)}
                  placeholder="Buscar no acervo…"
                  className={cn(classeDeEntrada, 'pl-9')}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {acervoFiltrado.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma aula encontrada.
                </p>
              ) : (
                acervoFiltrado.map((aula) => {
                  const jaUsada = usadas.has(aula._id)
                  return (
                    <button
                      key={aula._id}
                      type="button"
                      onClick={() => adicionarAula(aula._id)}
                      className="group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-muted/70"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{aula.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[
                            aula.localizacao,
                            aula.duracaoLabel,
                            /* O número de Trilhas é o sinal de reuso (§22): uma
                               aula em três caminhos é infraestrutura. */
                            aula.trilhas?.length
                              ? `${aula.trilhas.length} ${aula.trilhas.length === 1 ? 'Trilha' : 'Trilhas'}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      {jaUsada ? (
                        <Check className="h-4 w-4 flex-none text-primary" strokeWidth={3} />
                      ) : (
                        <Plus className="h-4 w-4 flex-none text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t border-border/60 px-3 py-2">
              <Link
                href="/aulas/gerenciar/catalogo/nova"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Criar uma aula nova
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* ══ Barra de salvamento ══════════════════════════════════════ */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <BotaoPrincipal onClick={() => salvar()} carregando={salvando} disabled={!sujo}>
            {salvando ? 'Salvando…' : sujo ? 'Salvar alterações' : 'Tudo salvo'}
          </BotaoPrincipal>

          {sujo ? (
            <span className="text-xs font-semibold text-accent-foreground">
              Há mudanças não salvas
            </span>
          ) : null}
          {mensagem ? <span className="text-xs font-semibold text-primary">{mensagem}</span> : null}
          {erro ? <span className="text-xs font-semibold text-destructive">{erro}</span> : null}

          <span className="ml-auto text-xs text-muted-foreground">
            As aulas continuam existindo fora desta Trilha — aqui você só arruma referências.
          </span>
        </div>
      </div>
    </PainelDeEnsino>
  )
}

/* =================== CONTEÚDO COMPLEMENTAR =================== */

const ROTULO_DO_TIPO: Record<string, string> = {
  material: 'Material de /materiais',
  flashcards: 'Deck de flashcards',
  prova: 'Prova do banco',
  link: 'Link externo',
}

function IconeDoTipo({ tipo }: { tipo: string }) {
  const Icone =
    tipo === 'link' ? ExternalLink : tipo === 'flashcards' ? Layers : tipo === 'prova' ? Check : FileText
  return <Icone className="h-3.5 w-3.5 flex-none text-muted-foreground" />
}

/**
 * O formulário de conteúdo complementar.
 *
 * Aparece só quando pedido, e some ao adicionar: ele é a exceção dentro da
 * etapa, não o caminho principal. Se ficasse sempre aberto, cada etapa
 * carregaria quatro campos vazios que na maioria das Trilhas nunca serão
 * preenchidos.
 */
function FormularioComplementar({
  aoAdicionar,
  aoCancelar,
}: {
  aoAdicionar: (tipo: string, valor: string, rotulo: string) => void
  aoCancelar: () => void
}) {
  const [tipo, setTipo] = useState('link')
  const [valor, setValor] = useState('')
  const [rotulo, setRotulo] = useState('')

  return (
    <div className="space-y-2 border-t border-border/60 bg-muted/40 p-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={cn(classeDeEntrada, 'max-w-[13rem] flex-none')}
        >
          <option value="link">Link externo</option>
          <option value="material">Material de /materiais</option>
          <option value="flashcards">Deck de flashcards</option>
          <option value="prova">Prova do banco</option>
        </select>

        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={tipo === 'link' ? 'https://…' : 'id do item'}
          className={cn(classeDeEntrada, 'min-w-[12rem] flex-1')}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={rotulo}
          onChange={(e) => setRotulo(e.target.value)}
          placeholder="Como aparece na etapa (opcional)"
          className={cn(classeDeEntrada, 'min-w-[12rem] flex-1')}
        />
        <BotaoPrincipal onClick={() => aoAdicionar(tipo, valor, rotulo)} className="flex-none">
          <Link2 className="h-4 w-4" /> Adicionar
        </BotaoPrincipal>
        <BotaoSecundario onClick={aoCancelar} className="flex-none">
          Cancelar
        </BotaoSecundario>
      </div>

      <p className="text-xs text-muted-foreground">
        Complementar não conta no progresso da Trilha — ele acompanha o caminho sem virar dívida.
      </p>
    </div>
  )
}

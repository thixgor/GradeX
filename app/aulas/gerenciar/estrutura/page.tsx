'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { LogoLoading } from '@/components/logo-loading'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LinhaDaArvore,
  type AcoesDaLinha,
  type ZonaDeSolta,
} from '@/components/admin/aulas/linha-da-arvore'
import {
  aulasAbaixo,
  ehDescendente,
  filtrarArvore,
  FILHOS_PERMITIDOS,
  montarArvore,
  moverPara,
  reordenar,
  ROTULO_DO_TIPO,
  type DocumentoDeNo,
  type NoDaArvore,
  type TipoDeNo,
} from '@/lib/aulas/arvore-admin'
import { comModo } from '@/lib/aulas/modo-visualizacao'
import { cn } from '@/lib/utils'

/**
 * Painel de estrutura das aulas (§3, §4, §5, §28, §29, §30).
 *
 * A tela anterior eram quatro listas planas — aulas, tópicos, subtópicos e
 * módulos — cada uma sem saber da outra. Setores e submódulos nem apareciam.
 * Para descobrir o que havia dentro de um curso, o admin tinha que abrir item
 * por item e reconstruir a hierarquia de cabeça; e reordenar era impossível,
 * porque `ordem` não tinha nenhum controle na interface.
 *
 * Aqui a estrutura inteira é uma árvore só: dá para ver, arrastar, publicar em
 * massa, duplicar um módulo com as aulas dentro e conferir a trava pelos olhos
 * do aluno. As telas antigas de criação continuam funcionando e são para onde
 * os botões apontam — a reformulação troca a navegação, não invalida o que já
 * existe (§45).
 *
 * Mora em `/aulas/gerenciar` e não em `/admin` de propósito: o middleware tranca
 * `/admin/*` em `role === 'admin'`, e monitores — que são quem publica aula no
 * dia a dia — ficariam de fora do painel que existe para eles.
 */

const COLECAO_POR_TIPO: Record<Exclude<TipoDeNo, 'aula'>, string> = {
  setor: 'setores',
  topico: 'topicos',
  subtopico: 'subtopicos',
  modulo: 'modulos',
  submodulo: 'submodulos',
}

/** Chaves do estado bruto, na mesma ordem em que a árvore as consome. */
type ListasBrutas = {
  setores: DocumentoDeNo[]
  topicos: DocumentoDeNo[]
  subtopicos: DocumentoDeNo[]
  modulos: DocumentoDeNo[]
  submodulos: DocumentoDeNo[]
  aulas: DocumentoDeNo[]
}

const CHAVE_POR_TIPO: Record<TipoDeNo, keyof ListasBrutas> = {
  setor: 'setores',
  topico: 'topicos',
  subtopico: 'subtopicos',
  modulo: 'modulos',
  submodulo: 'submodulos',
  aula: 'aulas',
}

const VAZIO: ListasBrutas = {
  setores: [],
  topicos: [],
  subtopicos: [],
  modulos: [],
  submodulos: [],
  aulas: [],
}

interface Movimento {
  tipo: TipoDeNo
  id: string
  ordem: number
  pai?: Record<string, string | null>
}

export default function PainelDeAulasPage() {
  const router = useRouter()

  const [autorizado, setAutorizado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [listas, setListas] = useState<ListasBrutas>(VAZIO)

  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  const [arrastando, setArrastando] = useState<NoDaArvore | null>(null)
  const [alvo, setAlvo] = useState<{ id: string; zona: ZonaDeSolta } | null>(null)

  const [dialogo, setDialogo] = useState<
    | { modo: 'criar'; pai: NoDaArvore | null; tipo: TipoDeNo }
    | { modo: 'renomear'; no: NoDaArvore }
    | { modo: 'excluir'; no: NoDaArvore }
    | { modo: 'excluir-lote' }
    | { modo: 'agendar' }
    | null
  >(null)
  const [nomeNoDialogo, setNomeNoDialogo] = useState('')
  const [dataNoDialogo, setDataNoDialogo] = useState('')

  const [toast, setToast] = useState<{ aberto: boolean; texto: string; tipo: 'success' | 'error' | 'info' }>({
    aberto: false,
    texto: '',
    tipo: 'success',
  })

  const avisar = useCallback((texto: string, tipo: 'success' | 'error' | 'info' = 'success') => {
    setToast({ aberto: true, texto, tipo })
  }, [])

  /* ── Carregamento ───────────────────────────────────────────────────── */

  const carregar = useCallback(async () => {
    const res = await fetch('/api/aulas', { cache: 'no-store' })
    if (!res.ok) return
    const d = await res.json()
    const normalizar = (lista: any[]) => (lista || []).map((x) => ({ ...x, _id: String(x._id) }))
    setListas({
      setores: normalizar(d.setores),
      topicos: normalizar(d.topicos),
      subtopicos: normalizar(d.subtopicos),
      modulos: normalizar(d.modulos),
      submodulos: normalizar(d.submodulos),
      aulas: normalizar(d.aulas),
    })
  }, [])

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/auth/login')
          return
        }
        const { user } = await res.json()
        if (user?.role !== 'admin' && user?.secondaryRole !== 'monitor') {
          router.push('/')
          return
        }
        if (cancelado) return
        setAutorizado(true)
        await carregar()
      } catch {
        router.push('/auth/login')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [router, carregar])

  /* ── Árvore ─────────────────────────────────────────────────────────── */

  const { raizes, orfaos, porId } = useMemo(() => montarArvore(listas), [listas])
  const visiveis = useMemo(() => filtrarArvore(raizes, busca), [raizes, busca])
  const orfaosVisiveis = useMemo(() => filtrarArvore(orfaos, busca), [orfaos, busca])
  const buscando = busca.trim().length >= 2

  /** Irmãos de um nó, na ordem em que estão desenhados. */
  const irmaosDe = useCallback(
    (no: NoDaArvore): NoDaArvore[] => {
      if (no.tipo === 'setor') return raizes
      for (const candidato of porId.values()) {
        if (candidato.filhos.some((f) => f.id === no.id)) return candidato.filhos
      }
      return orfaos.some((o) => o.id === no.id) ? orfaos : [no]
    },
    [raizes, orfaos, porId],
  )

  /* ── Escrita ────────────────────────────────────────────────────────── */

  /**
   * Aplica os movimentos na tela ANTES do servidor responder.
   *
   * Arrastar precisa parecer instantâneo. Esperar a ida ao servidor faria o
   * item voltar para o lugar antigo por uma fração de segundo a cada gesto —
   * e é essa piscada que faz a pessoa arrastar duas vezes.
   */
  function aplicarLocalmente(movimentos: Movimento[]) {
    setListas((atual) => {
      const novo: ListasBrutas = { ...atual }
      for (const chave of Object.keys(novo) as Array<keyof ListasBrutas>) {
        novo[chave] = [...novo[chave]]
      }

      for (const movimento of movimentos) {
        const chave = CHAVE_POR_TIPO[movimento.tipo]
        const indice = novo[chave].findIndex((d) => String(d._id) === movimento.id)
        if (indice < 0) continue

        const doc = { ...novo[chave][indice], ordem: movimento.ordem }
        for (const [campo, valor] of Object.entries(movimento.pai || {})) {
          if (valor === null) delete (doc as any)[campo]
          else (doc as any)[campo] = valor
        }
        novo[chave][indice] = doc
      }
      return novo
    })
  }

  async function gravarMovimentos(movimentos: Movimento[]) {
    if (movimentos.length === 0) return
    aplicarLocalmente(movimentos)
    setSalvando(true)
    try {
      const res = await fetch('/api/aulas/estrutura', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movimentos }),
      })
      if (!res.ok) throw new Error()
    } catch {
      avisar('Não foi possível salvar a nova ordem. Recarregando.', 'error')
      // A tela mostrou o resultado antes de ter certeza; se o servidor recusou,
      // ela precisa voltar a ser verdade — e a verdade vem do banco.
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  function moverNaOrdem(no: NoDaArvore, direcao: -1 | 1) {
    const irmaos = irmaosDe(no)
    const indice = irmaos.findIndex((i) => i.id === no.id)
    if (indice < 0) return
    void gravarMovimentos(reordenar(irmaos, indice, indice + direcao))
  }

  function soltarEm(destino: NoDaArvore, zona: ZonaDeSolta) {
    const movido = arrastando
    setArrastando(null)
    setAlvo(null)
    if (!movido || movido.id === destino.id) return

    if (zona === 'dentro') {
      if (ehDescendente(movido, destino.id)) {
        avisar('Não dá para mover um item para dentro dele mesmo.', 'error')
        return
      }
      if (!FILHOS_PERMITIDOS[destino.tipo].includes(movido.tipo)) {
        avisar(
          `${ROTULO_DO_TIPO[movido.tipo]} não pode ficar dentro de ${ROTULO_DO_TIPO[destino.tipo].toLowerCase()}.`,
          'error',
        )
        return
      }
      const movimento = moverPara(movido, destino, destino.filhos.length)
      if (!movimento) return
      setAbertos((atual) => new Set(atual).add(destino.id))
      void gravarMovimentos([movimento])
      return
    }

    // Antes/depois: entra na lista de irmãos do destino, na posição indicada.
    const irmaos = irmaosDe(destino)
    const posicao = irmaos.findIndex((i) => i.id === destino.id) + (zona === 'depois' ? 1 : 0)
    const jaEIrmao = irmaos.some((i) => i.id === movido.id)

    if (jaEIrmao) {
      const de = irmaos.findIndex((i) => i.id === movido.id)
      void gravarMovimentos(reordenar(irmaos, de, de < posicao ? posicao - 1 : posicao))
      return
    }

    // Vem de outro pai: primeiro a transferência, depois a renumeração dos
    // novos irmãos — senão o item chega ao destino sem posição definida.
    const paiDoDestino = destino.tipo === 'setor' ? null : encontrarPai(destino)
    if (destino.tipo !== 'setor' && !paiDoDestino) return
    if (ehDescendente(movido, destino.id)) {
      avisar('Não dá para mover um item para dentro dele mesmo.', 'error')
      return
    }

    const transferencia = moverPara(movido, paiDoDestino, posicao)
    if (!transferencia) {
      avisar(
        paiDoDestino
          ? `${ROTULO_DO_TIPO[movido.tipo]} não pode ficar dentro de ${ROTULO_DO_TIPO[paiDoDestino.tipo].toLowerCase()}.`
          : 'Só um curso pode ficar solto no primeiro nível.',
        'error',
      )
      return
    }

    const nova = [...irmaos]
    nova.splice(posicao, 0, movido)
    const renumeracao = nova.map((n, i) => ({ tipo: n.tipo, id: n.id, ordem: i }))
    void gravarMovimentos([transferencia, ...renumeracao.filter((m) => m.id !== movido.id)])
  }

  function encontrarPai(no: NoDaArvore): NoDaArvore | null {
    for (const candidato of porId.values()) {
      if (candidato.filhos.some((f) => f.id === no.id)) return candidato
    }
    return null
  }

  /* ── Criar, renomear, duplicar, excluir ─────────────────────────────── */

  async function confirmarCriacao() {
    if (!dialogo || dialogo.modo !== 'criar') return
    const nome = nomeNoDialogo.trim()
    if (!nome) return

    if (dialogo.tipo === 'aula') {
      // Aula tem tela própria, com vídeo, PDFs, capa e regras de acesso.
      // Reproduzir isso num diálogo seria manter dois formulários divergentes.
      const params = new URLSearchParams({ titulo: nome })
      for (const [campo, valor] of Object.entries(vinculosDe(dialogo.pai))) {
        if (valor) params.set(campo, valor)
      }
      router.push(`/aulas/gerenciar/aulas/criar?${params}`)
      return
    }

    setSalvando(true)
    try {
      const corpo: Record<string, any> = { nome, ordem: dialogo.pai?.filhos.length || 0 }
      Object.assign(corpo, vinculosDe(dialogo.pai))
      // O tipo do pai também é vínculo — um tópico dentro do curso X precisa
      // do `setorId` de X, que não está nos vínculos herdados dele.
      if (dialogo.pai && dialogo.pai.tipo !== 'aula') {
        corpo[`${dialogo.pai.tipo}Id`] = dialogo.pai.id
      }

      const res = await fetch(`/api/aulas/${COLECAO_POR_TIPO[dialogo.tipo as Exclude<TipoDeNo, 'aula'>]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível criar')

      avisar(`${ROTULO_DO_TIPO[dialogo.tipo]} criado.`)
      if (dialogo.pai) setAbertos((atual) => new Set(atual).add(dialogo.pai!.id))
      setDialogo(null)
      await carregar()
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível criar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  /** Vínculos que um filho herda do pai (sem o vínculo com o próprio pai). */
  function vinculosDe(pai: NoDaArvore | null): Record<string, string> {
    if (!pai) return {}
    const herdados: Record<string, string> = {}
    for (const [campo, valor] of Object.entries(pai.pai)) {
      if (valor) herdados[campo] = valor
    }
    return herdados
  }

  async function confirmarRenomeacao() {
    if (!dialogo || dialogo.modo !== 'renomear') return
    const nome = nomeNoDialogo.trim()
    if (!nome) return

    setSalvando(true)
    try {
      const { no } = dialogo
      const rota =
        no.tipo === 'aula'
          ? `/api/aulas/${no.id}`
          : `/api/aulas/${COLECAO_POR_TIPO[no.tipo as Exclude<TipoDeNo, 'aula'>]}/${no.id}`
      const res = await fetch(rota, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(no.tipo === 'aula' ? { titulo: nome } : { nome }),
      })
      if (!res.ok) throw new Error()
      setDialogo(null)
      await carregar()
      avisar('Nome atualizado.')
    } catch {
      avisar('Não foi possível renomear', 'error')
    } finally {
      setSalvando(false)
    }
  }

  async function duplicar(no: NoDaArvore) {
    setSalvando(true)
    try {
      const res =
        no.tipo === 'aula'
          ? await fetch(`/api/aulas/${no.id}/duplicar`, { method: 'POST' })
          : await fetch('/api/aulas/estrutura/duplicar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tipo: no.tipo, id: no.id }),
            })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível duplicar')

      await carregar()
      avisar(
        d.aulasCopiadas
          ? `Cópia criada com ${d.aulasCopiadas} aula(s). Ela nasce oculta — publique quando estiver pronta.`
          : 'Cópia criada, oculta.',
      )
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível duplicar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarVisibilidade(no: NoDaArvore) {
    const rota =
      no.tipo === 'aula'
        ? `/api/aulas/${no.id}`
        : `/api/aulas/${COLECAO_POR_TIPO[no.tipo as Exclude<TipoDeNo, 'aula'>]}/${no.id}`
    setSalvando(true)
    try {
      const res = await fetch(rota, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oculta: !no.oculta }),
      })
      if (!res.ok) throw new Error()
      await carregar()
      avisar(no.oculta ? 'Publicado.' : 'Ocultado.')
    } catch {
      avisar('Não foi possível atualizar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!dialogo) return
    setSalvando(true)
    try {
      if (dialogo.modo === 'excluir-lote') {
        const ids = idsDeAulasSelecionadas()
        const res = await fetch('/api/aulas/lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acao: 'excluir', ids, confirmar: true }),
        })
        if (!res.ok) throw new Error()
        setSelecionados(new Set())
        avisar(`${ids.length} aula(s) excluída(s).`)
      } else if (dialogo.modo === 'excluir') {
        const { no } = dialogo
        const rota =
          no.tipo === 'aula'
            ? `/api/aulas/${no.id}`
            : `/api/aulas/${COLECAO_POR_TIPO[no.tipo as Exclude<TipoDeNo, 'aula'>]}/${no.id}`
        const res = await fetch(rota, { method: 'DELETE' })
        const d = await res.json().catch(() => ({}))
        // 409 é o servidor recusando apagar um nó que ainda tem conteúdo. A
        // mensagem dele já explica o que precisa sair antes — repeti-la é mais
        // útil do que um "erro ao excluir" genérico.
        if (!res.ok) throw new Error(d.error || 'Não foi possível excluir')
        avisar('Excluído.')
      }
      setDialogo(null)
      await carregar()
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível excluir', 'error')
    } finally {
      setSalvando(false)
    }
  }

  /* ── Seleção e ações em massa (§30) ─────────────────────────────────── */

  /**
   * Marcar um curso marca as aulas dele.
   *
   * As ações em massa só sabem operar aulas. Deixar o admin marcar um módulo e
   * depois avisar "isto não vale para módulos" seria pior do que não deixar
   * marcar — então marcar um ramo significa marcar as aulas dentro dele.
   */
  function selecionar(no: NoDaArvore, marcado: boolean) {
    const alvos = no.tipo === 'aula' ? [no] : aulasAbaixo(no)
    setSelecionados((atual) => {
      const novo = new Set(atual)
      for (const aula of alvos) {
        if (marcado) novo.add(aula.id)
        else novo.delete(aula.id)
      }
      return novo
    })
  }

  function idsDeAulasSelecionadas(): string[] {
    return Array.from(selecionados)
  }

  async function acaoEmLote(acao: 'publicar' | 'ocultar' | 'agendar', extra: Record<string, any> = {}) {
    const ids = idsDeAulasSelecionadas()
    if (ids.length === 0) return
    setSalvando(true)
    try {
      const res = await fetch('/api/aulas/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ids, ...extra }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Não foi possível aplicar')
      await carregar()
      avisar(`${d.afetadas ?? ids.length} aula(s) atualizada(s).`)
      setDialogo(null)
    } catch (e: any) {
      avisar(e?.message || 'Não foi possível aplicar', 'error')
    } finally {
      setSalvando(false)
    }
  }

  /* ── Expandir / recolher ────────────────────────────────────────────── */

  function alternarAberto(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function expandirTudo() {
    const todos = new Set<string>()
    const descer = (nos: NoDaArvore[]) => {
      for (const no of nos) {
        if (no.filhos.length > 0) todos.add(no.id)
        descer(no.filhos)
      }
    }
    descer(raizes)
    descer(orfaos)
    setAbertos(todos)
  }

  /* ── Ações passadas para cada linha ─────────────────────────────────── */

  const acoes: AcoesDaLinha = {
    aoAlternarAberto: alternarAberto,
    aoSelecionar: selecionar,
    aoAdicionar: (pai, tipo) => {
      setNomeNoDialogo('')
      setDialogo({ modo: 'criar', pai, tipo })
    },
    aoRenomear: (no) => {
      setNomeNoDialogo(no.nome)
      setDialogo({ modo: 'renomear', no })
    },
    aoDuplicar: duplicar,
    aoAlternarVisibilidade: alternarVisibilidade,
    aoExcluir: (no) => setDialogo({ modo: 'excluir', no }),
    aoEditarAula: (no) => router.push(`/aulas/gerenciar/aulas/${no.id}/editar`),
    aoVerComoAluno: (no) => window.open(comModo(`/aulas/${no.id}`, 'aluno'), '_blank'),
    aoCopiarLink: async (no) => {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/aulas/${no.id}`)
        avisar('Link copiado.')
      } catch {
        avisar('Não foi possível copiar o link', 'error')
      }
    },
    aoMoverNaOrdem: moverNaOrdem,
    aoIniciarArraste: setArrastando,
    aoPassarPorCima: (destino, zona) => {
      // Só reescreve o estado quando a zona realmente muda: `dragover` dispara
      // dezenas de vezes por segundo, e um setState por evento repinta a árvore
      // inteira durante o gesto.
      setAlvo((atual) =>
        atual?.id === destino.id && atual.zona === zona ? atual : { id: destino.id, zona },
      )
    },
    aoSoltarEm: soltarEm,
    aoTerminarArraste: () => {
      setArrastando(null)
      setAlvo(null)
    },
  }

  /* ── Desenho da árvore ──────────────────────────────────────────────── */

  function desenhar(nos: NoDaArvore[]): React.ReactNode {
    return nos.map((no, indice) => {
      // Durante a busca tudo fica aberto: esconder o resultado atrás de um
      // chevron obrigaria a expandir o caminho inteiro na mão.
      const aberto = buscando || abertos.has(no.id)
      const aulas = no.tipo === 'aula' ? [no] : aulasAbaixo(no)
      const selecionado = aulas.length > 0 && aulas.every((a) => selecionados.has(a.id))

      return (
        <div key={no.id}>
          <LinhaDaArvore
            no={no}
            estado={{
              aberto,
              selecionado,
              arrastando: arrastando?.id === no.id,
              zonaAtiva: alvo?.id === no.id ? alvo.zona : null,
              podeSubir: indice > 0,
              podeDescer: indice < nos.length - 1,
              aceitaSolta: arrastando
                ? FILHOS_PERMITIDOS[no.tipo].includes(arrastando.tipo) &&
                  !ehDescendente(arrastando, no.id)
                : FILHOS_PERMITIDOS[no.tipo].length > 0,
            }}
            acoes={acoes}
          />
          {/*
            O aninhamento é desenhado por uma linha-guia, não por recuo grande.
            Cinco níveis a 16px cada consumiam 80px de uma tela de 390px — o
            título da aula ficava com menos espaço que os selos. A guia mostra a
            hierarquia com 12px e ainda deixa claro onde um ramo termina.
          */}
          {aberto && no.filhos.length > 0 ? (
            <div className="ml-3 border-l border-border pl-1">{desenhar(no.filhos)}</div>
          ) : null}
        </div>
      )
    })
  }

  if (carregando) return <LogoLoading message="Carregando estrutura..." size="lg" fullscreen />
  if (!autorizado) return null

  const totalAulas = listas.aulas.length
  const marcadas = selecionados.size

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/aulas/gerenciar"
                aria-label="Voltar"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                  Estrutura das aulas
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  {listas.setores.length} curso(s) · {totalAulas} aula(s)
                  {salvando ? ' · salvando…' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-none items-center gap-2">
              <Link
                href="/aulas/gerenciar/detalhes"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted lg:inline-flex"
                title="Editar descrições, capas e imagens dos cursos"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Capas e descrições
              </Link>
              <Link
                href={comModo('/aulas', 'aluno')}
                target="_blank"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted sm:inline-flex"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver como aluno
              </Link>
              <button
                type="button"
                onClick={() => {
                  setNomeNoDialogo('')
                  setDialogo({ modo: 'criar', pai: null, tipo: 'setor' })
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                Novo curso
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-5">
        {/* ── Busca e controles ───────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar curso, módulo ou aula..."
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm outline-none transition focus:border-primary/50"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={expandirTudo}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Expandir tudo
          </button>
          <button
            type="button"
            onClick={() => setAbertos(new Set())}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            Recolher tudo
          </button>
        </div>

        {/* ── Barra de ações em massa (§30) ───────────────────────────── */}
        {marcadas > 0 ? (
          <div className="sticky top-16 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 backdrop-blur">
            <span className="text-xs font-bold">
              {marcadas} aula(s) selecionada(s)
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <BotaoDeLote onClick={() => acaoEmLote('publicar')} icone={Eye}>
                Publicar
              </BotaoDeLote>
              <BotaoDeLote onClick={() => acaoEmLote('ocultar')} icone={EyeOff}>
                Ocultar
              </BotaoDeLote>
              <BotaoDeLote
                onClick={() => {
                  setDataNoDialogo('')
                  setDialogo({ modo: 'agendar' })
                }}
                icone={CalendarClock}
              >
                Agendar
              </BotaoDeLote>
              <BotaoDeLote
                onClick={() => setDialogo({ modo: 'excluir-lote' })}
                icone={Trash2}
                perigo
              >
                Excluir
              </BotaoDeLote>
              <button
                type="button"
                onClick={() => setSelecionados(new Set())}
                className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
              >
                Limpar
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Árvore ──────────────────────────────────────────────────── */}
        {visiveis.length === 0 && orfaosVisiveis.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm font-semibold">
              {buscando ? 'Nada encontrado' : 'Nenhum curso ainda'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {buscando
                ? 'Tente outro termo — a busca olha o nome de cursos, módulos e aulas.'
                : 'Comece criando um curso. Tópicos, módulos e aulas entram dentro dele, e nenhum nível é obrigatório.'}
            </p>
            {!buscando ? (
              <button
                type="button"
                onClick={() => {
                  setNomeNoDialogo('')
                  setDialogo({ modo: 'criar', pai: null, tipo: 'setor' })
                }}
                className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar primeiro curso
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-1.5">{desenhar(visiveis)}</div>
        )}

        {/* ── Órfãos ──────────────────────────────────────────────────── */}
        {orfaosVisiveis.length > 0 ? (
          <section className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Fora de qualquer curso ({orfaosVisiveis.length})
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              O vínculo destes itens aponta para algo que não existe mais. Eles não aparecem para o
              aluno. Arraste-os para dentro de um curso ou exclua.
            </p>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-1.5">
              {desenhar(orfaosVisiveis)}
            </div>
          </section>
        ) : null}
      </main>

      {/* ── Diálogos ──────────────────────────────────────────────────── */}
      <Dialog open={dialogo?.modo === 'criar'} onOpenChange={(a) => !a && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogo?.modo === 'criar' ? `Novo ${ROTULO_DO_TIPO[dialogo.tipo].toLowerCase()}` : ''}
            </DialogTitle>
            <DialogDescription>
              {dialogo?.modo === 'criar' && dialogo.pai
                ? `Dentro de “${dialogo.pai.nome}”.`
                : 'No primeiro nível da biblioteca.'}
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={nomeNoDialogo}
            onChange={(e) => setNomeNoDialogo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmarCriacao()}
            placeholder="Nome"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          {dialogo?.modo === 'criar' && dialogo.tipo === 'aula' ? (
            <p className="text-xs text-muted-foreground">
              A aula abre na tela completa, com vídeo, materiais e regras de acesso.
            </p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarCriacao}
              disabled={salvando || !nomeNoDialogo.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo?.modo === 'renomear'} onOpenChange={(a) => !a && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={nomeNoDialogo}
            onChange={(e) => setNomeNoDialogo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmarRenomeacao()}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarRenomeacao}
              disabled={salvando || !nomeNoDialogo.trim()}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo?.modo === 'agendar'} onOpenChange={(a) => !a && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar liberação</DialogTitle>
            <DialogDescription>
              {marcadas} aula(s) ficam disponíveis a partir da data escolhida (§13).
            </DialogDescription>
          </DialogHeader>
          <input
            type="datetime-local"
            value={dataNoDialogo}
            onChange={(e) => setDataNoDialogo(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando || !dataNoDialogo}
              onClick={() =>
                acaoEmLote('agendar', {
                  dataLiberacao: new Date(dataNoDialogo).toISOString(),
                  ocultarAteLiberacao: true,
                })
              }
              className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              Agendar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogo?.modo === 'excluir' || dialogo?.modo === 'excluir-lote'}
        onOpenChange={(a) => !a && setDialogo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir sem volta</DialogTitle>
            <DialogDescription>
              {dialogo?.modo === 'excluir-lote'
                ? `${marcadas} aula(s) serão apagadas, junto com o progresso e as anotações dos alunos nelas.`
                : dialogo?.modo === 'excluir' && dialogo.no.tipo !== 'aula'
                  ? dialogo.no.filhos.length > 0
                    ? `“${dialogo.no.nome}” ainda tem conteúdo dentro (${dialogo.no.totalAulas} aula(s)). O servidor vai recusar a exclusão até isso sair — mova ou exclua o conteúdo primeiro, ou apenas oculte o item.`
                    : `“${dialogo.no.nome}” será apagado. Ele está vazio, então nenhuma aula é afetada.`
                  : 'Esta aula será apagada, junto com o progresso e as anotações dos alunos nela.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogo(null)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarExclusao}
              disabled={salvando}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-bold text-destructive-foreground disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Excluir mesmo assim
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toast.aberto}
        onOpenChange={(a) => setToast((t) => ({ ...t, aberto: a }))}
        message={toast.texto}
        type={toast.tipo}
      />
    </div>
  )
}

function BotaoDeLote({
  onClick,
  icone: Icone,
  perigo,
  children,
}: {
  onClick: () => void
  icone: typeof Eye
  perigo?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition',
        perigo
          ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <Icone className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

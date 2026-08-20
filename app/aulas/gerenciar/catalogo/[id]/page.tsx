'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Check,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { EditorDeRegras } from '@/components/aulas/editor-regras'
import { EditorDeRelacionadas } from '@/components/aulas/editor-relacionadas'
import { EditorDeAvaliacao } from '@/components/aulas/editor-avaliacao'
import { VinculoMaterialField } from '@/components/aulas/vinculo-material-field'
import {
  BotaoPrincipal,
  BotaoSecundario,
  Campo,
  PainelDeEnsino,
  classeDeArea,
  classeDeEntrada,
} from '@/components/ensino/painel'
import { Esqueleto, Selo } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * Criação e edição de aula, em etapas (§23).
 *
 * POR QUE ETAPAS E NÃO UM FORMULÁRIO ÚNICO
 *
 * Uma aula tem quase quarenta campos: identidade, organização, vídeo, PDFs,
 * resumo, flashcards, relações, permissões, agendamento. Numa página só isso
 * vira uma parede de controles em que o campo importante — o título — tem o
 * mesmo peso visual que "ocultar até a liberação". As etapas agrupam por
 * PERGUNTA, e cada uma cabe numa tela sem rolagem no desktop.
 *
 * As etapas não são um assistente com trava: dá para pular direto para
 * "Disponibilidade" a qualquer momento. Uma aula é editada muito mais vezes do
 * que é criada, e obrigar quem quer trocar uma data a passar por seis telas
 * seria hostil.
 *
 * O SALVAMENTO É EM DUAS ROTAS, E ISSO É DE PROPÓSITO
 *
 * Os campos antigos vão para `PATCH /api/aulas/[id]`, que continua sendo a
 * autoridade sobre eles — as telas antigas dependem dela. O bloco novo vai para
 * `PATCH /api/ensino/aulas/[id]`, que é quem sabe manter o vínculo de mão dupla
 * com a Aula Resumo. Fundir as duas exigiria mover regras de um lado para o
 * outro e arriscar o comportamento que já está no ar (§36).
 */

type Etapa = 'basico' | 'organizacao' | 'conteudo' | 'revisao' | 'relacoes' | 'publicacao'

const ETAPAS: Array<{ id: Etapa; rotulo: string; descricao: string }> = [
  { id: 'basico', rotulo: 'Informações', descricao: 'Título, descrição, professor e capa' },
  { id: 'organizacao', rotulo: 'Organização', descricao: 'Onde a aula mora e como é encontrada' },
  { id: 'conteudo', rotulo: 'Conteúdo', descricao: 'Vídeo e material complementar' },
  { id: 'revisao', rotulo: 'Revisão', descricao: 'Aula Resumo, PDF e flashcards' },
  { id: 'relacoes', rotulo: 'Relações', descricao: 'Pré-requisitos e conteúdo relacionado' },
  { id: 'publicacao', rotulo: 'Publicação', descricao: 'Quem vê, quando, e avaliação' },
]

const NIVEIS = ['area', 'modulo', 'topico', 'subtopico'] as const

const ROTULO_DO_NIVEL: Record<string, string> = {
  area: 'Área',
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

interface NoNaTela {
  _id: string
  nome: string
  nivel: string
  paiId: string | null
}

interface Professor {
  _id: string
  nome: string
  foto?: string | null
  titulacao?: string | null
}

interface AulaSimples {
  _id: string
  titulo: string
  localizacao?: string
}

export default function EditorDeAulaPage() {
  return (
    <AppShell headerTitle="Aula" headerSubtitle="Administração de Ensino">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams()
  const router = useRouter()
  const idNaRota = String(params?.id || '')
  const criando = idNaRota === 'nova'

  const [aulaId, setAulaId] = useState(criando ? '' : idNaRota)
  const [carregando, setCarregando] = useState(true)
  const [etapa, setEtapa] = useState<Etapa>('basico')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  /* ── Campos legados ─────────────────────────────────────────────── */
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<'gravada' | 'ao-vivo'>('gravada')
  const [videoEmbed, setVideoEmbed] = useState('')
  const [linkOuEmbed, setLinkOuEmbed] = useState('')
  const [capaImagem, setCapaImagem] = useState('')
  const [pdfs, setPdfs] = useState<Array<{ nome: string; url: string; tamanho: number }>>([])
  const [botoes, setBotoes] = useState<Array<{ nome: string; url: string }>>([])
  const [regras, setRegras] = useState<any>(null)
  const [avaliacao, setAvaliacao] = useState<any>(null)
  const [vinculoMaterial, setVinculoMaterial] = useState<any>(null)
  const [relacionadas, setRelacionadas] = useState<string[]>([])
  const [dataLiberacao, setDataLiberacao] = useState('')
  const [ocultarAteLiberacao, setOcultarAteLiberacao] = useState(false)
  const [oculta, setOculta] = useState(false)

  /* ── Bloco `ensino` ─────────────────────────────────────────────── */
  const [ensino, setEnsino] = useState<any>({ tipo: 'aula', tags: [], prerequisitos: [] })

  /* ── Apoio ──────────────────────────────────────────────────────── */
  const [nos, setNos] = useState<NoNaTela[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [acervo, setAcervo] = useState<AulaSimples[]>([])
  const [novoProfessor, setNovoProfessor] = useState('')

  const carregarApoio = useCallback(() => {
    Promise.all([
      fetch('/api/ensino/taxonomia?contagem=0', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { nos: [] },
      ),
      fetch('/api/ensino/professores', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { professores: [] },
      ),
      fetch('/api/ensino/catalogo?admin=1&limite=300&tipo=todos', { cache: 'no-store' }).then((r) =>
        r.ok ? r.json() : { aulas: [] },
      ),
    ]).then(([taxonomia, profs, catalogo]) => {
      setNos(taxonomia.nos || [])
      setProfessores(profs.professores || [])
      setAcervo(catalogo.aulas || [])
    })
  }, [])

  useEffect(carregarApoio, [carregarApoio])

  useEffect(() => {
    if (criando) {
      setCarregando(false)
      return
    }
    let cancelado = false

    fetch(`/api/aulas/${idNaRota}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d?.aula) return
        const a = d.aula
        setTitulo(a.titulo || '')
        setDescricao(a.descricao || '')
        setTipo(a.tipo === 'ao-vivo' ? 'ao-vivo' : 'gravada')
        setVideoEmbed(a.videoEmbed || '')
        setLinkOuEmbed(a.linkOuEmbed || '')
        setCapaImagem(a.capa?.imagem || '')
        setPdfs(a.pdfs || [])
        setBotoes(a.botoesAcesso || [])
        setRegras(a.regrasAcesso || null)
        setAvaliacao(a.avaliacao || null)
        setVinculoMaterial(a.vinculoMaterial || null)
        setRelacionadas(a.relacionadas || [])
        setOculta(a.oculta === true)
        setOcultarAteLiberacao(a.ocultarAteLiberacao === true)
        if (a.dataLiberacao) {
          const data = new Date(a.dataLiberacao)
          if (!Number.isNaN(data.getTime()) && data.getFullYear() > 2001) {
            setDataLiberacao(data.toISOString().slice(0, 16))
          }
        }
        setEnsino({ tipo: 'aula', tags: [], prerequisitos: [], ...(a.ensino || {}) })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [criando, idNaRota])

  const nosPorNivel = useCallback(
    (nivel: string, paiId?: string | null) =>
      nos.filter((n) => n.nivel === nivel && (paiId === undefined || n.paiId === (paiId || null))),
    [nos],
  )

  function definirNivel(nivel: string, valor: string) {
    setEnsino((atual: any) => {
      const proximo = { ...atual, [`${nivel}Id`]: valor || null }
      // Trocar um nível acima invalida os de baixo: um subtópico que pertencia
      // a outro tópico ficaria pendurado no lugar errado, em silêncio.
      const indice = NIVEIS.indexOf(nivel as any)
      for (const abaixo of NIVEIS.slice(indice + 1)) proximo[`${abaixo}Id`] = null
      return proximo
    })
  }

  async function criarProfessor() {
    const nome = novoProfessor.trim()
    if (!nome) return
    const resposta = await fetch('/api/ensino/professores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
    const d = await resposta.json().catch(() => ({}))
    if (resposta.ok && d.professor) {
      setProfessores((atual) => [...atual, d.professor])
      setEnsino((atual: any) => ({
        ...atual,
        professorIds: [...(atual.professorIds || []), d.professor._id],
      }))
      setNovoProfessor('')
    }
  }

  async function salvar(opcoes: { publicar?: boolean; despublicar?: boolean } = {}) {
    if (!titulo.trim()) {
      setErro('A aula precisa de um título.')
      setEtapa('basico')
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    const ocultaFinal = opcoes.publicar ? false : opcoes.despublicar ? true : oculta

    const corpo = {
      titulo: titulo.trim(),
      descricao,
      tipo,
      videoEmbed: tipo === 'gravada' ? videoEmbed : null,
      linkOuEmbed: tipo === 'ao-vivo' ? linkOuEmbed : null,
      capa: capaImagem ? { tipo: 'imagem', imagem: capaImagem } : undefined,
      pdfs,
      botoesAcesso: botoes.length > 0 ? botoes : null,
      regrasAcesso: regras,
      avaliacao,
      vinculoMaterial,
      relacionadas: relacionadas.length > 0 ? relacionadas : null,
      dataLiberacao: dataLiberacao || null,
      ocultarAteLiberacao,
      oculta: ocultaFinal,
    }

    try {
      let id = aulaId

      if (!id) {
        // Criar passa pela rota antiga, que é a dona do documento; o bloco
        // `ensino` é gravado logo depois, pela rota que sabe cuidar dele.
        const resposta = await fetch('/api/aulas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...corpo, visibilidade: 'plus' }),
        })
        const d = await resposta.json().catch(() => ({}))
        if (!resposta.ok) throw new Error(d.error || 'Não foi possível criar a aula.')
        id = String(d.aula._id)
        setAulaId(id)
        await fetch(`/api/aulas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        })
      } else {
        const resposta = await fetch(`/api/aulas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        })
        if (!resposta.ok) {
          const d = await resposta.json().catch(() => ({}))
          throw new Error(d.error || 'Não foi possível salvar.')
        }
      }

      const respostaEnsino = await fetch(`/api/ensino/aulas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensino }),
      })
      if (!respostaEnsino.ok) {
        const d = await respostaEnsino.json().catch(() => ({}))
        throw new Error(d.error || 'A aula foi salva, mas a organização não.')
      }

      setOculta(ocultaFinal)
      setMensagem(
        opcoes.publicar ? 'Aula publicada.' : opcoes.despublicar ? 'Aula em rascunho.' : 'Salvo.',
      )

      if (criando) router.replace(`/aulas/gerenciar/catalogo/${id}`)
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const resumoDaAula = useMemo(
    () => acervo.find((a) => a._id === ensino.resumoId) || null,
    [acervo, ensino.resumoId],
  )

  if (carregando) {
    return (
      <PainelDeEnsino titulo="Carregando…" voltarPara="/aulas/gerenciar/catalogo">
        <Esqueleto className="h-96 w-full" />
      </PainelDeEnsino>
    )
  }

  return (
    <PainelDeEnsino
      voltarPara="/aulas/gerenciar/catalogo"
      titulo={titulo.trim() || 'Nova aula'}
      descricao={
        criando
          ? 'Uma unidade específica de conhecimento — quanto menor e mais precisa, mais Trilhas conseguem reutilizá-la.'
          : oculta
            ? 'Rascunho — só quem administra enxerga'
            : 'Publicada'
      }
      acoes={
        aulaId ? (
          <>
            <BotaoSecundario href={`/aulas/${aulaId}`}>Ver</BotaoSecundario>
            {oculta ? (
              <BotaoPrincipal onClick={() => salvar({ publicar: true })} carregando={salvando}>
                Publicar
              </BotaoPrincipal>
            ) : (
              <BotaoSecundario onClick={() => salvar({ despublicar: true })}>
                Despublicar
              </BotaoSecundario>
            )}
          </>
        ) : undefined
      }
    >
      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* ── As etapas ─────────────────────────────────────────────── */}
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <ol className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {ETAPAS.map((item, indice) => (
              <li key={item.id} className="flex-none lg:w-full">
                <button
                  type="button"
                  onClick={() => setEtapa(item.id)}
                  aria-current={etapa === item.id ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition',
                    etapa === item.id
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs tabular-nums',
                      etapa === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    {indice + 1}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{item.rotulo}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── O conteúdo da etapa ───────────────────────────────────── */}
        <div className="min-w-0">
          <header className="mb-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {ETAPAS.find((e) => e.id === etapa)?.rotulo}
            </h2>
            <p className="text-sm text-muted-foreground">
              {ETAPAS.find((e) => e.id === etapa)?.descricao}
            </p>
          </header>

          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
            {etapa === 'basico' ? (
              <>
                <Campo
                  rotulo="Título"
                  dica="Uma unidade de conhecimento: “Lei de Frank-Starling”, não “Sistema Cardiovascular”."
                >
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    autoFocus={criando}
                    className={classeDeEntrada}
                  />
                </Campo>

                <Campo rotulo="Descrição">
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                    className={classeDeArea}
                  />
                </Campo>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Duração (minutos)" dica="Aparece nos cartões sem abrir o vídeo.">
                    <input
                      type="number"
                      min={0}
                      value={ensino.duracaoSegundos ? Math.round(ensino.duracaoSegundos / 60) : ''}
                      onChange={(e) =>
                        setEnsino({
                          ...ensino,
                          duracaoSegundos: Math.max(0, Number(e.target.value) || 0) * 60,
                        })
                      }
                      className={classeDeEntrada}
                    />
                  </Campo>

                  <Campo rotulo="Capa (URL da imagem)">
                    <input
                      value={capaImagem}
                      onChange={(e) => setCapaImagem(e.target.value)}
                      placeholder="https://…"
                      className={classeDeEntrada}
                    />
                  </Campo>
                </div>

                {/*
                 * Professores (§26).
                 *
                 * Registro próprio, e não texto dentro da aula: o mesmo nome
                 * aparece em dezenas de aulas, e um campo de texto significa
                 * atualizar a foto em dezenas de lugares — ou nunca atualizar.
                 */}
                <Campo rotulo="Professores" dica="Uma aula pode ter mais de um. Uma Trilha pode misturar vários.">
                  <div className="flex flex-wrap gap-1.5">
                    {professores.map((professor) => {
                      const marcado = (ensino.professorIds || []).includes(professor._id)
                      return (
                        <button
                          key={professor._id}
                          type="button"
                          onClick={() =>
                            setEnsino({
                              ...ensino,
                              professorIds: marcado
                                ? (ensino.professorIds || []).filter(
                                    (id: string) => id !== professor._id,
                                  )
                                : [...(ensino.professorIds || []), professor._id],
                            })
                          }
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition',
                            marcado
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border hover:bg-muted',
                          )}
                        >
                          {marcado ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                          {professor.nome}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <input
                      value={novoProfessor}
                      onChange={(e) => setNovoProfessor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          criarProfessor()
                        }
                      }}
                      placeholder="Cadastrar um professor novo"
                      className={classeDeEntrada}
                    />
                    <BotaoSecundario onClick={criarProfessor}>
                      <UserPlus className="h-4 w-4" /> Adicionar
                    </BotaoSecundario>
                  </div>
                </Campo>
              </>
            ) : null}

            {etapa === 'organizacao' ? (
              <>
                <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  Esta é a localização <strong>principal</strong> da aula — ela não a prende ali. A
                  mesma aula continua aparecendo em quantas Trilhas você quiser, na busca e nas
                  recomendações.
                </p>

                {NIVEIS.map((nivel, indice) => {
                  const paiId = indice === 0 ? null : ensino[`${NIVEIS[indice - 1]}Id`]
                  const opcoes = indice === 0 ? nosPorNivel('area') : nosPorNivel(nivel, paiId)
                  return (
                    <Campo
                      key={nivel}
                      rotulo={ROTULO_DO_NIVEL[nivel]}
                      dica={
                        nivel === 'subtopico'
                          ? 'Opcional — nem todo conteúdo precisa de mais um nível.'
                          : undefined
                      }
                    >
                      <select
                        value={ensino[`${nivel}Id`] || ''}
                        onChange={(e) => definirNivel(nivel, e.target.value)}
                        disabled={indice > 0 && !paiId}
                        className={cn(classeDeEntrada, indice > 0 && !paiId && 'opacity-50')}
                      >
                        <option value="">— nenhum —</option>
                        {opcoes.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.nome}
                          </option>
                        ))}
                      </select>
                    </Campo>
                  )
                })}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Grau de profundidade" dica="Ajuda a montar Trilhas essenciais ou avançadas.">
                    <select
                      value={ensino.profundidade || ''}
                      onChange={(e) =>
                        setEnsino({ ...ensino, profundidade: e.target.value || null })
                      }
                      className={classeDeEntrada}
                    >
                      <option value="">Não definido</option>
                      <option value="essencial">Essencial</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="avancado">Avançado</option>
                    </select>
                  </Campo>

                  <Campo rotulo="Tags" dica="Separadas por vírgula. Servem à busca, não à navegação.">
                    <input
                      value={(ensino.tags || []).join(', ')}
                      onChange={(e) =>
                        setEnsino({
                          ...ensino,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className={classeDeEntrada}
                    />
                  </Campo>
                </div>

                <Link
                  href="/aulas/gerenciar/taxonomia"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Criar ou reorganizar níveis
                </Link>
              </>
            ) : null}

            {etapa === 'conteudo' ? (
              <>
                <Campo rotulo="Formato">
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as 'gravada' | 'ao-vivo')}
                    className={classeDeEntrada}
                  >
                    <option value="gravada">Gravada</option>
                    <option value="ao-vivo">Ao vivo</option>
                  </select>
                </Campo>

                {tipo === 'gravada' ? (
                  <Campo
                    rotulo="Vídeo"
                    dica="URL do arquivo (permite retomada e progresso automático) ou o HTML de incorporação."
                  >
                    <textarea
                      value={videoEmbed}
                      onChange={(e) => setVideoEmbed(e.target.value)}
                      rows={3}
                      placeholder="https://… ou <iframe …>"
                      className={cn(classeDeArea, 'font-clinical text-xs')}
                    />
                  </Campo>
                ) : (
                  <Campo rotulo="Link da transmissão">
                    <input
                      value={linkOuEmbed}
                      onChange={(e) => setLinkOuEmbed(e.target.value)}
                      className={classeDeEntrada}
                    />
                  </Campo>
                )}

                <Campo rotulo="Botões de acesso" dica="Zoom, Meet, formulário de presença…">
                  <div className="space-y-2">
                    {botoes.map((botao, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={botao.nome}
                          onChange={(e) =>
                            setBotoes(
                              botoes.map((b, j) => (j === i ? { ...b, nome: e.target.value } : b)),
                            )
                          }
                          className={cn(classeDeEntrada, 'max-w-[10rem]')}
                        />
                        <input
                          value={botao.url}
                          onChange={(e) =>
                            setBotoes(
                              botoes.map((b, j) => (j === i ? { ...b, url: e.target.value } : b)),
                            )
                          }
                          className={classeDeEntrada}
                        />
                        <button
                          type="button"
                          onClick={() => setBotoes(botoes.filter((_, j) => j !== i))}
                          aria-label="Remover"
                          className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <BotaoSecundario
                      onClick={() => setBotoes([...botoes, { nome: 'Acessar', url: '' }])}
                    >
                      <Plus className="h-4 w-4" /> Botão
                    </BotaoSecundario>
                  </div>
                </Campo>

                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Vínculo com /materiais
                  </p>
                  <VinculoMaterialField valor={vinculoMaterial} onChange={setVinculoMaterial} />
                </div>
              </>
            ) : null}

            {etapa === 'revisao' ? (
              <>
                <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  O que aparece nas abas da aula e alimenta a Área de Revisão. Aba de recurso
                  inexistente não é desenhada — a interface encolhe com a aula.
                </p>

                <Campo
                  rotulo="Aula Resumo vinculada"
                  dica="Uma aula já cadastrada. Ela some da navegação normal e passa a ser a versão condensada desta."
                >
                  <select
                    value={ensino.resumoId || ''}
                    onChange={(e) => setEnsino({ ...ensino, resumoId: e.target.value || null })}
                    className={classeDeEntrada}
                  >
                    <option value="">— nenhuma —</option>
                    {acervo
                      .filter((outra) => outra._id !== aulaId)
                      .map((outra) => (
                        <option key={outra._id} value={outra._id}>
                          {outra.titulo}
                        </option>
                      ))}
                  </select>
                </Campo>

                {resumoDaAula ? (
                  <p className="flex items-center gap-1.5 text-xs text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Aba “Resumo” vai levar a{' '}
                    <strong>{resumoDaAula.titulo}</strong>
                  </p>
                ) : null}

                <Campo rotulo="PDFs" dica="Material de revisão escrito.">
                  <div className="space-y-2">
                    {pdfs.map((pdf, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={pdf.nome}
                          onChange={(e) =>
                            setPdfs(pdfs.map((p, j) => (j === i ? { ...p, nome: e.target.value } : p)))
                          }
                          placeholder="Nome"
                          className={cn(classeDeEntrada, 'max-w-[12rem]')}
                        />
                        <input
                          value={pdf.url}
                          onChange={(e) =>
                            setPdfs(pdfs.map((p, j) => (j === i ? { ...p, url: e.target.value } : p)))
                          }
                          placeholder="https://…"
                          className={classeDeEntrada}
                        />
                        <button
                          type="button"
                          onClick={() => setPdfs(pdfs.filter((_, j) => j !== i))}
                          aria-label="Remover PDF"
                          className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <BotaoSecundario
                      onClick={() => setPdfs([...pdfs, { nome: 'Resumo em PDF', url: '', tamanho: 0 }])}
                    >
                      <FileText className="h-4 w-4" /> PDF
                    </BotaoSecundario>
                  </div>
                </Campo>

                <Campo
                  rotulo="Decks de flashcards"
                  dica="Ids dos decks, um por linha. O aluno os abre pela aba Flashcards."
                >
                  <textarea
                    value={(ensino.flashcardDeckIds || []).join('\n')}
                    onChange={(e) =>
                      setEnsino({
                        ...ensino,
                        flashcardDeckIds: e.target.value
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={2}
                    className={cn(classeDeArea, 'font-clinical text-xs')}
                  />
                  <Link
                    href="/admin/flashcards/manual"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                  >
                    <Layers className="h-3.5 w-3.5" /> Ver os decks disponíveis
                  </Link>
                </Campo>
              </>
            ) : null}

            {etapa === 'relacoes' ? (
              <>
                <Campo
                  rotulo="Recomendamos conhecer antes"
                  dica="Pré-requisitos são recomendação, nunca bloqueio: o aluno decide se pula."
                >
                  <select
                    multiple
                    size={8}
                    value={ensino.prerequisitos || []}
                    onChange={(e) =>
                      setEnsino({
                        ...ensino,
                        prerequisitos: Array.from(e.target.selectedOptions).map((o) => o.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm outline-none transition focus:border-primary/50"
                  >
                    {acervo
                      .filter((outra) => outra._id !== aulaId)
                      .map((outra) => (
                        <option key={outra._id} value={outra._id}>
                          {outra.titulo}
                          {outra.localizacao ? ` — ${outra.localizacao}` : ''}
                        </option>
                      ))}
                  </select>
                </Campo>

                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Conteúdo relacionado
                  </p>
                  <EditorDeRelacionadas
                    aulaAtualId={aulaId}
                    valor={relacionadas}
                    onChange={setRelacionadas}
                  />
                </div>
              </>
            ) : null}

            {etapa === 'publicacao' ? (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Quem pode assistir
                  </p>
                  <EditorDeRegras valor={regras} onChange={setRegras} />
                </div>

                <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <Campo rotulo="Liberar em" dica="Vazio = já disponível.">
                    <input
                      type="datetime-local"
                      value={dataLiberacao}
                      onChange={(e) => setDataLiberacao(e.target.value)}
                      className={classeDeEntrada}
                    />
                  </Campo>

                  <label className="flex items-end gap-2 pb-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={ocultarAteLiberacao}
                      onChange={(e) => setOcultarAteLiberacao(e.target.checked)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    Esconder até a liberação
                  </label>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Avaliação vinculada
                  </p>
                  <EditorDeAvaliacao valor={avaliacao} onChange={setAvaliacao} />
                </div>

                <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                  {oculta ? <Selo>Rascunho</Selo> : <Selo tom="sucesso">Publicada</Selo>}
                  <span className="text-xs text-muted-foreground">
                    {oculta
                      ? 'Só quem administra enxerga esta aula.'
                      : 'No ar para quem cumpre as regras de acesso acima.'}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          {/* ── Rodapé ────────────────────────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <BotaoPrincipal onClick={() => salvar()} carregando={salvando}>
              {salvando ? 'Salvando…' : criando && !aulaId ? 'Criar aula' : 'Salvar'}
            </BotaoPrincipal>

            {ETAPAS.findIndex((e) => e.id === etapa) < ETAPAS.length - 1 ? (
              <BotaoSecundario
                onClick={() => {
                  const indice = ETAPAS.findIndex((e) => e.id === etapa)
                  setEtapa(ETAPAS[indice + 1].id)
                }}
              >
                Próxima etapa
              </BotaoSecundario>
            ) : null}

            {mensagem ? (
              <span className="text-xs font-semibold text-primary">{mensagem}</span>
            ) : null}
            {erro ? <span className="text-xs font-semibold text-destructive">{erro}</span> : null}

            {aulaId ? (
              <Link
                href={`/aulas/gerenciar/aulas/${aulaId}/editar`}
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
              >
                <Link2 className="h-3.5 w-3.5" /> Editor antigo (capítulos, transcrição)
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </PainelDeEnsino>
  )
}

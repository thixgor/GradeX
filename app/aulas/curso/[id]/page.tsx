'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, PlayCircle, RotateCcw } from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import {
  EsqueletoDeCards,
  ProvedorDeFavoritos,
  ProvedorDeModo,
  ResumoDoCurso,
  type AulaNaBiblioteca,
} from '@/components/aulas/biblioteca'
import { useFavoritosDeAula } from '@/components/aulas/use-favoritos-aula'
import { CursoAberto, type Ramo } from '@/components/aulas/curso-conteudo'
import { FaixaModoAluno } from '@/components/aulas/faixa-modo-aluno'
import { MuralDeAvisos } from '@/components/aulas/mural-de-avisos'
import { CartaoDeCertificado } from '@/components/aulas/cartao-certificado'
import { achatarAulas, montarRamos } from '@/lib/aulas/ramos'
import { comModo, lerModo, PARAMETRO_MODO } from '@/lib/aulas/modo-visualizacao'

/**
 * A página de um curso (§18).
 *
 * Até aqui o curso não tinha endereço: ele abria embutido na biblioteca, atrás
 * de `?curso=<id>`. Isso custava três coisas que só aparecem no uso — não dava
 * para mandar o link do curso para alguém, o botão voltar do navegador saía da
 * biblioteca inteira em vez de subir um nível, e o curso não tinha onde
 * apresentar a si mesmo: descrição, capa e progresso brigavam por espaço com a
 * busca global e a faixa de retomada.
 *
 * A árvore aqui é a MESMA da biblioteca, vinda de `montarRamos` e desenhada por
 * `CursoAberto`. Redesenhar o conteúdo do curso nesta página significaria
 * manter duas versões da organização que o aluno já aprendeu a ler.
 */
export default function CursoPage() {
  return (
    <AppShell headerTitle="Curso">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <EsqueletoDeCards />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

interface Aula extends AulaNaBiblioteca {
  setorId?: string
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string
  ordem?: number
}

interface Curso {
  _id: string
  nome: string
  descricao?: string
  imagem?: string
  certificado?: { habilitado?: boolean; percentualMinimo?: number } | null
}

function Conteudo() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const cursoId = String(params?.id || '')
  const modo = lerModo(searchParams.get(PARAMETRO_MODO))

  const [carregando, setCarregando] = useState(true)
  const [curso, setCurso] = useState<Curso | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [nos, setNos] = useState({ topicos: [], subtopicos: [], modulos: [], submodulos: [] } as any)
  const favoritos = useFavoritosDeAula()
  const { user, isAdmin } = useAppShell()
  // Em "ver como aluno" o admin também abre mão de administrar o mural: senão
  // a conferência mostraria botões que o aluno não tem (§28).
  const podeGerenciar = modo === 'admin' && (isAdmin || user?.secondaryRole === 'monitor')

  useEffect(() => {
    let cancelado = false
    fetch(comModo('/api/aulas', modo), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelado || !d) return
        const id = (x: any) => ({ ...x, _id: String(x._id) })
        setCurso((d.setores || []).map(id).find((s: Curso) => s._id === cursoId) || null)
        setNos({
          topicos: (d.topicos || []).map(id),
          subtopicos: (d.subtopicos || []).map(id),
          modulos: (d.modulos || []).map(id),
          submodulos: (d.submodulos || []).map(id),
        })
        setAulas((d.aulas || []).map(id).filter((a: Aula) => a.setorId === cursoId))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [cursoId, modo])

  const ramos = useMemo<Ramo[]>(
    () => (cursoId ? montarRamos(cursoId, aulas, nos) : []),
    [cursoId, aulas, nos],
  )

  const progresso = useMemo(
    () => ({
      total: aulas.length,
      concluidas: aulas.filter((a) => a.progresso?.concluida).length,
    }),
    [aulas],
  )

  /**
   * Onde a pessoa deve continuar.
   *
   * A primeira aula não concluída na ordem da árvore — que é a ordem em que o
   * admin montou o curso, e portanto a ordem em que ele espera que se estude.
   * Se tudo está concluído, não há o que continuar e o botão some em vez de
   * mandar de volta para o começo.
   */
  const proxima = useMemo(() => {
    const emOrdem = achatarAulas(ramos)
    const pendente = emOrdem.find(
      (a: any) => !a.progresso?.concluida && a.acesso?.liberado !== false,
    )
    const comeada = emOrdem.find((a: any) => (a.progresso?.percentual || 0) > 0 && !a.progresso?.concluida)
    return (comeada || pendente) as Aula | undefined
  }, [ramos])

  if (carregando) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <EsqueletoDeCards />
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-bold">Curso não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ele pode ter saído do ar ou não estar liberado para a sua conta.
        </p>
        <Link
          href="/aulas"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Ver todos os cursos
        </Link>
      </div>
    )
  }

  const retomando = (proxima?.progresso?.percentual || 0) > 0

  return (
    <ProvedorDeModo modo={modo}>
      <ProvedorDeFavoritos controle={favoritos}>
      <FaixaModoAluno modo={modo} caminho={`/aulas/curso/${cursoId}`} />

      {/* ── Apresentação do curso ─────────────────────────────────────── */}
      <header className="border-b border-border bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <Link
            href={comModo('/aulas', modo)}
            className="-m-2 mb-3 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os cursos
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {curso.imagem ? (
              // A capa é do curso e foi escolhida pelo admin; sumir com ela na
              // página dele seria descartar a identidade que ele montou.
              <div className="aspect-video w-full flex-none overflow-hidden rounded-xl border border-border sm:w-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={curso.imagem} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {curso.nome}
              </h1>
              {curso.descricao ? (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {curso.descricao}
                </p>
              ) : null}

              {progresso.total > 0 ? (
                <div className="mt-4 max-w-md">
                  <ResumoDoCurso concluidas={progresso.concluidas} total={progresso.total} />
                </div>
              ) : null}

              {proxima ? (
                <Link
                  href={comModo(`/aulas/${proxima._id}`, modo)}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                >
                  {retomando ? <RotateCcw className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  <span className="truncate">
                    {retomando ? 'Continuar' : progresso.concluidas > 0 ? 'Próxima aula' : 'Começar o curso'}
                  </span>
                </Link>
              ) : progresso.total > 0 ? (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary">
                  <BookOpen className="h-4 w-4" />
                  Curso concluído
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ──────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Os avisos vêm antes da lista: um recado que aparece depois das aulas
            chega tarde — a pessoa já clicou (§36). */}
        <MuralDeAvisos cursoId={cursoId} podeGerenciar={podeGerenciar} />

        {/* O certificado aparece antes de ser emitível, mostrando o que falta:
            é aí que ele vira motivo para terminar, e não troféu (§38). */}
        <CartaoDeCertificado
          cursoId={cursoId}
          curso={curso}
          progresso={progresso}
          podeGerenciar={podeGerenciar}
        />

        <CursoAberto ramos={ramos} />
      </div>
      </ProvedorDeFavoritos>
    </ProvedorDeModo>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Award,
  Check,
  Clock,
  Layers,
  Pencil,
  Play,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { RESPIRO_DA_DOCA, RESPIRO_DO_TOPO } from '@/components/ensino/doca'
import {
  BotaoDuo,
  CaminhoDeNos,
  Cascata,
  Confete,
  FichaDeEstatistica,
  ItemDaCascata,
  NumeroAnimado,
  type EstadoDoNo,
  type NoDoCaminho,
} from '@/components/ensino/duo'
import {
  Cadeado,
  Capa,
  EstadoVazio,
  Esqueleto,
  ProvedorDeEnsino,
  formatarMinutos,
  type AcessoNaTela,
  type AulaNaTela,
} from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * A página de uma Trilha (§7, §8, §28).
 *
 * A ETAPA VIROU UM TRECHO DE CAMINHO
 *
 * A versão anterior desta tela listava as etapas em acordeões. Funcionava, e
 * ainda assim era uma lista: o aluno lia trinta linhas para descobrir onde
 * estava. Aqui as aulas são NÓS num caminho que desce serpenteando, e a
 * pergunta "onde eu paro hoje?" se responde em meio segundo — é o único nó com
 * anel pulsando e o balão "COMEÇAR".
 *
 * As etapas continuam existindo e continuam sendo a estrutura (§7): cada uma
 * abre com uma faixa própria, com o seu contador. O que mudou é que elas
 * separam trechos de percurso em vez de esconder listas.
 *
 * O QUE O CAMINHO NÃO FAZ
 *
 * Ele não tranca aula por sequência. Pré-requisito é recomendação (§19), e um
 * cadeado por "você ainda não viu a anterior" transformaria a Trilha numa
 * prisão para quem já domina metade do assunto. O único cadeado que existe é o
 * comercial, decidido pelo mesmo motor de acesso de sempre.
 */

interface ItemResolvido {
  id: string
  tipo: string
  refId: string
  url?: string
  rotulo?: string
  nota?: string
  obrigatorio?: boolean
  aula: AulaNaTela | null
}

interface EtapaResolvida {
  id: string
  titulo: string
  descricao?: string
  itens: ItemResolvido[]
}

interface ProgressoDaEtapa {
  etapaId: string
  titulo: string
  total: number
  concluidos: number
  percentual: number
  completa: boolean
}

interface RespostaDaTrilha {
  trilha: {
    _id: string
    slug: string
    titulo: string
    subtitulo?: string
    descricao?: string
    objetivo?: string
    aprendizados?: string[]
    capa?: any
    nivel?: string
    publico?: string
    certificado?: { ativo: boolean } | null
    situacao: string
    etapas: EtapaResolvida[]
    resumo: { aulas: number; etapas: number; minutos: number }
  }
  progresso: {
    total: number
    concluidos: number
    percentual: number
    etapas: ProgressoDaEtapa[]
    proximo: { etapaId: string; item: { refId: string } } | null
    iniciada: boolean
    concluida: boolean
  }
  acesso: AcessoNaTela
  podeEditar: boolean
}

const ROTULO_DO_NIVEL: Record<string, string> = {
  iniciante: 'Do zero',
  intermediario: 'Intermediária',
  avancado: 'Avançada',
}

export default function TrilhaPage() {
  return (
    <AppShell headerTitle="Trilha" headerSubtitle="Caminho de estudo" comercio={false} vidro>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams()
  const router = useRouter()
  const slug = String(params?.slug || '')
  const semMovimento = useReducedMotion()

  const [dados, setDados] = useState<RespostaDaTrilha | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [celebrar, setCelebrar] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelado = false
    setCarregando(true)

    fetch(`/api/ensino/trilhas/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Trilha não encontrada')
        return d as RespostaDaTrilha
      })
      .then((d) => {
        if (cancelado) return
        setDados(d)
        if (d.progresso.concluida) {
          // O confete cai uma vez, ao abrir. Repetir a cada rolagem
          // transformaria a comemoração em incômodo.
          setCelebrar(true)
          setTimeout(() => setCelebrar(false), 2600)
        }
      })
      .catch((e) => {
        if (!cancelado) setErro(e?.message || 'Trilha não encontrada')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  const proximaAula = useMemo(() => {
    const alvo = dados?.progresso.proximo?.item.refId
    if (!alvo) return null
    for (const etapa of dados?.trilha.etapas || []) {
      for (const item of etapa.itens) if (item.aula?._id === alvo) return item.aula
    }
    return null
  }, [dados])

  const comecar = useCallback(() => {
    if (!dados) return
    const destino =
      proximaAula || dados.trilha.etapas.flatMap((e) => e.itens).find((i) => i.aula)?.aula
    if (!destino) return
    // Registra a entrada na Trilha antes de navegar: é isso que faz a home
    // dizer "você está na Trilha X" em vez de só "você viu um vídeo".
    fetch(`/api/ensino/trilhas/${encodeURIComponent(dados.trilha.slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'iniciar', aulaId: destino._id }),
    }).catch(() => {})
    router.push(`/aulas/${destino._id}?trilha=${encodeURIComponent(dados.trilha.slug)}`)
  }, [dados, proximaAula, router])

  /** Traduz cada etapa nos nós que o caminho desenha. */
  const caminhoPorEtapa = useMemo(() => {
    if (!dados) return []
    const alvo = dados.progresso.proximo?.item.refId

    return dados.trilha.etapas.map((etapa) => {
      const nos: NoDoCaminho[] = []

      etapa.itens.forEach((item, indice) => {
        if (item.tipo !== 'aula' || !item.aula) {
          nos.push({
            id: item.id,
            titulo: item.rotulo || 'Conteúdo complementar',
            href:
              item.tipo === 'link'
                ? item.url || '#'
                : item.tipo === 'material'
                  ? `/materiais/${item.refId}`
                  : item.tipo === 'prova'
                    ? `/exam/${item.refId}`
                    : `/flashcards/d/${item.refId}`,
            estado: 'disponivel',
            etiqueta: 'Extra',
          })
          return
        }

        const aula = item.aula
        const concluida = aula.progresso?.concluida === true
        const bloqueada = aula.acesso ? !aula.acesso.liberado : false

        const estado: EstadoDoNo = bloqueada
          ? 'bloqueado'
          : concluida
            ? 'concluido'
            : aula._id === alvo
              ? 'atual'
              : 'disponivel'

        nos.push({
          id: item.id,
          titulo: aula.titulo,
          href: `/aulas/${aula._id}?trilha=${encodeURIComponent(dados.trilha.slug)}`,
          estado,
          percentual: aula.progresso?.percentual || 0,
          fimDeEtapa: indice === etapa.itens.length - 1,
          duracaoLabel: aula.duracaoLabel,
          etiqueta: item.obrigatorio === false ? 'Extra' : undefined,
        })
      })

      return { etapa, nos }
    })
  }, [dados])

  if (carregando) {
    return (
      <div className={`container mx-auto max-w-3xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
        <Esqueleto className="aspect-[21/9] w-full rounded-3xl" />
        <Esqueleto className="mx-auto mt-6 h-9 w-2/3" />
        <div className="mt-10 flex flex-col items-center gap-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <Esqueleto key={i} className="h-[4.5rem] w-[4.5rem] rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className={`container mx-auto max-w-3xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>
        <EstadoVazio
          icone={Layers}
          titulo="Trilha não encontrada"
          descricao="Ela pode ter sido despublicada ou o endereço está errado."
          acaoLabel="Ver todas as Trilhas"
          acaoHref="/aulas/trilhas"
        />
      </div>
    )
  }

  const { trilha, progresso, acesso } = dados

  return (
    <ProvedorDeEnsino trilha={trilha.slug}>
      <div className={`container mx-auto max-w-3xl px-4 ${RESPIRO_DO_TOPO} ${RESPIRO_DA_DOCA}`}>

        {/* ══ Capa ═══════════════════════════════════════════════════ */}
        <header className="relative">
          <motion.div
            initial={semMovimento ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative overflow-hidden rounded-3xl shadow-[0_6px_0_rgb(0_0_0/0.12)]"
          >
            <Capa capa={trilha.capa} titulo={trilha.titulo} className="aspect-[21/9] rounded-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {trilha.nivel && ROTULO_DO_NIVEL[trilha.nivel] ? (
                  <Pilula>{ROTULO_DO_NIVEL[trilha.nivel]}</Pilula>
                ) : null}
                {trilha.publico ? <Pilula>{trilha.publico}</Pilula> : null}
                {trilha.certificado?.ativo ? (
                  <Pilula>
                    <Award className="h-3 w-3" /> Certificado
                  </Pilula>
                ) : null}
                {trilha.situacao !== 'publicada' ? (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-accent-foreground">
                    Rascunho
                  </span>
                ) : null}
              </div>

              <h1 className="font-heading text-2xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-4xl">
                {trilha.titulo}
              </h1>
              {trilha.subtitulo ? (
                <p className="mt-1.5 max-w-xl text-sm font-medium text-white/85 sm:text-base">
                  {trilha.subtitulo}
                </p>
              ) : null}
            </div>
          </motion.div>

          {dados.podeEditar ? (
            <Link
              href={`/aulas/gerenciar/trilhas/${trilha._id}`}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              title="Editar Trilha"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          ) : null}
        </header>

        {/* ══ Barra de progresso ═════════════════════════════════════ */}
        <section className="relative mt-5">
          <Confete ativo={celebrar} />

          <div className="rounded-3xl bg-card p-4 ring-1 ring-border/70 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-heading text-3xl font-extrabold leading-none">
                  <NumeroAnimado valor={progresso.percentual} sufixo="%" />
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {progresso.concluidos} de {progresso.total} aulas
                </p>
              </div>

              {progresso.concluida ? (
                <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-primary-foreground">
                  <Trophy className="h-4 w-4" /> Concluída
                </span>
              ) : null}
            </div>

            {/* A barra grossa e arredondada, com o brilho interno que a faz
                parecer preenchida em vez de pintada. */}
            <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-black/5">
              <motion.div
                initial={semMovimento ? false : { width: 0 }}
                animate={{ width: `${progresso.percentual}%` }}
                transition={{ duration: 1, ease: [0.2, 0.7, 0.3, 1], delay: 0.15 }}
                className="relative h-full rounded-full bg-primary"
              >
                <span className="absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/30" />
              </motion.div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <FichaDeEstatistica
                valor={trilha.resumo.aulas}
                rotulo="aulas"
                icone={Play}
                tom="primario"
              />
              <FichaDeEstatistica
                valor={trilha.resumo.etapas}
                rotulo="etapas"
                icone={Layers}
                tom="ouro"
              />
              <FichaDeEstatistica
                valor={Math.round(trilha.resumo.minutos / 60) || trilha.resumo.minutos}
                sufixo={trilha.resumo.minutos >= 60 ? 'h' : ' min'}
                rotulo="de conteúdo"
                icone={Clock}
                tom="fogo"
              />
            </div>
          </div>
        </section>

        {!acesso.liberado ? <Cadeado requisito={acesso.requisito} className="mt-5" /> : null}

        {/* ══ Conclusão (§28) ════════════════════════════════════════ */}
        {progresso.concluida ? (
          <motion.section
            initial={semMovimento ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 26 }}
            className="mt-5 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-[0_5px_0_rgb(0_0_0/0.2)]"
          >
            <div className="flex items-start gap-3">
              <Trophy className="h-8 w-8 flex-none" strokeWidth={2.5} />
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-extrabold tracking-tight">
                  Trilha concluída! 🎉
                </h2>
                <p className="mt-1 text-sm opacity-90">
                  {progresso.total} aulas dominadas
                  {trilha.resumo.minutos > 0
                    ? ` · ${formatarMinutos(trilha.resumo.minutos)} de conteúdo`
                    : ''}
                  . Agora é manter na memória.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <BotaoDuo href="/aulas/revisar" tom="claro" tamanho="pequeno">
                    <Sparkles className="h-4 w-4" /> Revisar
                  </BotaoDuo>
                  {trilha.certificado?.ativo ? (
                    <BotaoDuo href="/aulas/certificado" tom="ouro" tamanho="pequeno">
                      <Award className="h-4 w-4" /> Certificado
                    </BotaoDuo>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}

        {/* ══ Objetivo ═══════════════════════════════════════════════ */}
        {trilha.objetivo || trilha.descricao || trilha.aprendizados?.length ? (
          <Cascata className="mt-6 grid gap-3 sm:grid-cols-2">
            {trilha.objetivo || trilha.descricao ? (
              <ItemDaCascata className="rounded-2xl bg-card p-4 ring-1 ring-border/70">
                <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  <Target className="h-4 w-4" /> Objetivo
                </h2>
                <p className="text-sm leading-relaxed">{trilha.objetivo || trilha.descricao}</p>
              </ItemDaCascata>
            ) : null}

            {trilha.aprendizados?.length ? (
              <ItemDaCascata className="rounded-2xl bg-card p-4 ring-1 ring-border/70">
                <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Ao concluir, você saberá
                </h2>
                <ul className="space-y-1.5">
                  {trilha.aprendizados.map((texto) => (
                    <li key={texto} className="flex gap-2 text-sm leading-snug">
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                      {texto}
                    </li>
                  ))}
                </ul>
              </ItemDaCascata>
            ) : null}
          </Cascata>
        ) : null}

        {/* ══ O CAMINHO (§7) ═════════════════════════════════════════ */}
        <section className="mt-8">
          {trilha.etapas.length === 0 ? (
            <EstadoVazio
              icone={Layers}
              titulo="Esta Trilha ainda está sendo montada"
              descricao="As etapas aparecem aqui assim que forem publicadas."
            />
          ) : (
            caminhoPorEtapa.map(({ etapa, nos }, indice) => {
              const p = progresso.etapas.find((e) => e.etapaId === etapa.id)
              return (
                <div key={etapa.id}>
                  <FaixaDaEtapa
                    numero={indice + 1}
                    titulo={etapa.titulo}
                    descricao={etapa.descricao}
                    concluidos={p?.concluidos ?? 0}
                    total={p?.total ?? nos.length}
                    completa={p?.completa === true}
                  />
                  <CaminhoDeNos nos={nos} />
                </div>
              )
            })
          )}
        </section>
      </div>

      {/* ══ CTA fixo ═════════════════════════════════════════════════
          Ele acompanha a rolagem porque o caminho é longo: a decisão
          "continuar" precisa estar ao alcance do polegar em qualquer ponto da
          página, e não só lá no topo.

          Fica ACIMA da doca, e não sob ela: são os dois únicos elementos
          fixos da tela, e sobrepô-los esconderia justamente o botão que a
          página inteira existe para oferecer. A altura vem da variável que a
          doca publica (`--gx-barra-inferior-h`), e não de um número copiado:
          quando a barra mudar de tamanho, este botão sobe junto sem ninguém
          precisar lembrar de vir aqui. */}
      {acesso.liberado && !progresso.concluida ? (
        <motion.div
          initial={semMovimento ? false : { y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
          className="fixed inset-x-0 bottom-[calc(var(--gx-barra-inferior-h,4.5rem)+0.6rem)] z-30 px-3"
        >
          <div className="doca-vidro container mx-auto flex max-w-3xl items-center gap-3 rounded-[1.75rem] p-2 pl-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {progresso.iniciada ? 'Continue de onde parou' : 'Sua próxima aula'}
              </p>
              <p className="truncate text-sm font-bold">
                {proximaAula?.titulo || 'Comece agora'}
              </p>
            </div>
            <BotaoDuo onClick={comecar} className="flex-none">
              <Play className="h-4 w-4" fill="currentColor" />
              {progresso.iniciada ? 'Continuar Trilha' : 'Começar Trilha'}
            </BotaoDuo>
          </div>
        </motion.div>
      ) : null}
    </ProvedorDeEnsino>
  )
}

function Pilula({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
      {children}
    </span>
  )
}

/**
 * A faixa que abre cada etapa.
 *
 * Ela é a única coisa entre dois trechos de caminho, e por isso precisa ser
 * larga e inequívoca: o aluno tem de perceber que mudou de assunto sem parar
 * para ler. Etapa concluída fica sólida com troféu; a em andamento, com o
 * contador.
 */
function FaixaDaEtapa({
  numero,
  titulo,
  descricao,
  concluidos,
  total,
  completa,
}: {
  numero: number
  titulo: string
  descricao?: string
  concluidos: number
  total: number
  completa: boolean
}) {
  const semMovimento = useReducedMotion()

  return (
    <motion.div
      initial={semMovimento ? false : { opacity: 0, y: 16 }}
      whileInView={semMovimento ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn(
        'mt-8 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_4px_0_rgb(0_0_0/0.14)] first:mt-0',
        completa ? 'bg-primary text-primary-foreground' : 'bg-card ring-1 ring-border/70',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 flex-none items-center justify-center rounded-xl text-base font-extrabold tabular-nums',
          completa ? 'bg-white/20' : 'bg-primary/12 text-primary',
        )}
      >
        {completa ? <Trophy className="h-5 w-5" strokeWidth={2.5} /> : numero}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-base font-extrabold tracking-tight">
          {titulo}
        </span>
        <span
          className={cn(
            'block truncate text-xs font-semibold',
            completa ? 'opacity-85' : 'text-muted-foreground',
          )}
        >
          {descricao || `${concluidos} de ${total} concluídas`}
        </span>
      </span>

      {!completa && total > 0 ? (
        <span className="flex-none text-sm font-extrabold tabular-nums text-muted-foreground">
          {concluidos}/{total}
        </span>
      ) : null}
    </motion.div>
  )
}

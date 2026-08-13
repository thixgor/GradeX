import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { MINDMAP_COLLECTIONS } from '@/lib/mindmap'
import { condicaoDeTexto, listaDeTextos, textoCurto } from '@/lib/busca-plataforma/mongo'
import { indexar, ranquear } from '@/lib/busca-plataforma/motor'
import { chaveDeBusca, termosDaConsulta } from '@/lib/busca-plataforma/texto'
import type { ItemBusca, RespostaBusca } from '@/lib/busca-plataforma/tipos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Busca de CONTEÚDO da plataforma.
 *
 * O catálogo de páginas e ações é resolvido no navegador (resposta instantânea,
 * sem rede). Esta rota cuida do que só existe no banco — patologias, fármacos,
 * materiais, aulas, decks, mapas, cronogramas, provas, listas, rifas, posts do
 * fórum — e das 201 calculadoras clínicas, que somam ~400 KB de módulo e por
 * isso são pesquisadas aqui em vez de baixadas para o celular.
 *
 * ## Decisões que valem explicação
 *
 * **Regex com classes de acento, não `$text`.** O índice de texto do Mongo casa
 * palavra inteira depois de radicalizar; quem digita "cardio" quer ver
 * "cardiologia" antes de terminar a palavra. O custo é varredura, então cada
 * fonte tem `limit` curto e `maxTimeMS` — uma coleção grande atrasa a si mesma,
 * nunca a resposta inteira.
 *
 * **`allSettled`, não `all`.** Uma coleção indisponível degrada a busca em vez
 * de derrubá-la; a resposta marca `incompleto` e a interface avisa.
 *
 * **Ordenação no mesmo motor do cliente.** Se o servidor ordenasse por conta
 * própria, o mesmo termo produziria listas diferentes conforme a resposta viesse
 * do catálogo local ou da rede.
 *
 * **Privacidade antes de relevância.** Cada fonte carrega o filtro de acesso da
 * sua própria API (material oculto, deck privado, cronograma de outro usuário).
 * Buscar não pode ser o caminho mais fácil para enxergar o que a tela nega.
 */

const LIMITE_POR_FONTE = 8
const LIMITE_RESPOSTA = 28
const TEMPO_MAXIMO_MS = 2500

interface Contexto {
  db: Db
  userId: string
  isAdmin: boolean
  termos: string[]
}

/* ────────────────────────────── Fontes ────────────────────────────── */

interface Fonte {
  chave: string
  rodar: (ctx: Contexto) => Promise<ItemBusca[]>
}

const FONTES: Fonte[] = [
  {
    chave: 'patologias',
    async rodar({ db, termos }) {
      const docs = await db
        .collection('patologias')
        .find(condicaoDeTexto(['nome', 'sinonimos', 'cid10', 'sistema', 'areas'], termos))
        .project({ nome: 1, slug: 1, sinonimos: 1, cid10: 1, sistema: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `patologia:${doc._id}`,
        titulo: String(doc.nome || 'Patologia'),
        subtitulo: [doc.cid10, doc.sistema].filter(Boolean).join(' · ') || undefined,
        trilha: 'Manual Clínico',
        palavrasChave: [...listaDeTextos(doc.sinonimos), String(doc.cid10 || '')].filter(Boolean),
        prioridade: 6,
        grupo: 'conteudo' as const,
        href: `/manual-clinico/${doc.slug}`,
        icone: 'heart-pulse',
        etiqueta: 'Patologia',
        secao: 'manualClinico' as const,
      }))
    },
  },
  {
    chave: 'medicamentos',
    async rodar({ db, termos }) {
      const docs = await db
        .collection('medicamentos')
        .find(condicaoDeTexto(['nome', 'sinonimos', 'classe_principal', 'subclasse'], termos))
        .project({ nome: 1, slug: 1, sinonimos: 1, classe_principal: 1, subclasse: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `medicamento:${doc._id}`,
        titulo: String(doc.nome || 'Fármaco'),
        subtitulo: [doc.classe_principal, doc.subclasse].filter(Boolean).join(' › ') || undefined,
        trilha: 'Farmacologia',
        palavrasChave: listaDeTextos(doc.sinonimos),
        prioridade: 6,
        grupo: 'conteudo' as const,
        href: `/manual-clinico/farmacologia/${doc.slug}`,
        icone: 'pill',
        etiqueta: 'Fármaco',
        secao: 'manualClinico' as const,
      }))
    },
  },
  {
    chave: 'materiais',
    async rodar({ db, isAdmin, termos }) {
      const condicoes: object[] = [condicaoDeTexto(['title', 'description', 'tags'], termos)]
      if (!isAdmin) condicoes.push({ isHidden: false })

      const docs = await db
        .collection('materials')
        .find({ $and: condicoes })
        .project({ title: 1, description: 1, tags: 1, pricing: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `material:${doc._id}`,
        titulo: String(doc.title || 'Material'),
        subtitulo: textoCurto(doc.description),
        trilha: 'Materiais',
        palavrasChave: listaDeTextos(doc.tags),
        prioridade: 5,
        grupo: 'conteudo' as const,
        href: `/materiais/${doc._id}`,
        icone: 'book-open',
        etiqueta: 'Material',
        secao: 'materiais' as const,
      }))
    },
  },
  {
    chave: 'pacotes',
    async rodar({ db, isAdmin, termos }) {
      const condicoes: object[] = [condicaoDeTexto(['title', 'description'], termos)]
      if (!isAdmin) condicoes.push({ isHidden: false })

      const docs = await db
        .collection('material_packages')
        .find({ $and: condicoes })
        .project({ title: 1, description: 1 })
        .limit(4)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `pacote:${doc._id}`,
        titulo: String(doc.title || 'Pacote'),
        subtitulo: textoCurto(doc.description),
        trilha: 'Materiais › Pacotes',
        prioridade: 5,
        grupo: 'conteudo' as const,
        href: `/pacotes/${doc._id}`,
        icone: 'box',
        etiqueta: 'Pacote',
        secao: 'materiais' as const,
      }))
    },
  },
  {
    chave: 'aulas',
    async rodar({ db, termos }) {
      const docs = await db
        .collection('aulas_postagens')
        .find(condicaoDeTexto(['titulo', 'descricao'], termos))
        .project({ titulo: 1, descricao: 1, tipo: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `aula:${doc._id}`,
        titulo: String(doc.titulo || 'Aula'),
        subtitulo: textoCurto(doc.descricao),
        trilha: doc.tipo === 'ao-vivo' ? 'Aulas › Ao vivo' : 'Aulas › Gravadas',
        prioridade: 5,
        grupo: 'conteudo' as const,
        href: `/aulas/${doc._id}`,
        icone: 'video',
        etiqueta: 'Aula',
        secao: 'aulas' as const,
      }))
    },
  },
  {
    chave: 'flashcards',
    async rodar({ db, userId, isAdmin, termos }) {
      // Deck privado dos outros não aparece — só o que é seu ou está publicado
      // na comunidade. Admin vê tudo, como no resto da plataforma.
      const condicoes: object[] = [condicaoDeTexto(['title', 'description', 'tags'], termos)]
      if (!isAdmin) {
        condicoes.push({
          $or: [
            { ownerId: userId },
            { visibility: 'public', isPublished: true, isHidden: { $ne: true } },
          ],
        })
      }

      const docs = await db
        .collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
        .find({ $and: condicoes })
        .project({ title: 1, description: 1, tags: 1, slug: 1, ownerId: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `deck:${doc._id}`,
        titulo: String(doc.title || 'Deck'),
        subtitulo: textoCurto(doc.description),
        trilha: doc.ownerId === userId ? 'Flashcards › Meus decks' : 'Flashcards › Comunidade',
        palavrasChave: listaDeTextos(doc.tags),
        prioridade: 5,
        grupo: 'conteudo' as const,
        href: `/flashcards/d/${doc.slug}`,
        icone: 'brain',
        etiqueta: 'Deck',
        secao: 'flashcards' as const,
      }))
    },
  },
  {
    chave: 'mapas',
    async rodar({ db, userId, isAdmin, termos }) {
      const condicoes: object[] = [condicaoDeTexto(['title', 'description', 'tags'], termos)]
      if (!isAdmin) {
        condicoes.push({
          $or: [
            { ownerId: userId },
            { visibility: 'public', isPublished: true, isHidden: { $ne: true } },
          ],
        })
      }

      const docs = await db
        .collection(MINDMAP_COLLECTIONS.maps)
        .find({ $and: condicoes })
        .project({ title: 1, description: 1, tags: 1, ownerId: 1 })
        .limit(6)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `mapa:${doc._id}`,
        titulo: String(doc.title || 'Mapa mental'),
        subtitulo: textoCurto(doc.description),
        trilha: doc.ownerId === userId ? 'Mapas Mentais › Meus' : 'Mapas Mentais › Comunidade',
        palavrasChave: listaDeTextos(doc.tags),
        prioridade: 5,
        grupo: 'conteudo' as const,
        href: `/mapa-mental/${doc._id}`,
        icone: 'network',
        etiqueta: 'Mapa mental',
        secao: 'mapaMental' as const,
      }))
    },
  },
  {
    chave: 'cronogramas',
    async rodar({ db, userId, termos }) {
      const docs = await db
        .collection('cronogramas')
        .find({ $and: [{ usuarioId: userId }, condicaoDeTexto(['titulo', 'modelo'], termos)] })
        .project({ titulo: 1, modelo: 1, totalHoras: 1 })
        .limit(6)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `cronograma:${doc._id}`,
        titulo: String(doc.titulo || 'Cronograma'),
        subtitulo: doc.totalHoras ? `${doc.totalHoras}h planejadas` : undefined,
        trilha: 'Cronogramas › Meus',
        prioridade: 6,
        grupo: 'conteudo' as const,
        href: `/cronogramas/${doc._id}`,
        icone: 'book-marked',
        etiqueta: 'Cronograma',
        secao: 'cronogramas' as const,
      }))
    },
  },
  {
    chave: 'listas',
    async rodar({ db, userId, termos }) {
      // A coleção guarda o dono como ObjectId (diferente de `cronogramas`, que
      // guarda a string). Buscar com o tipo errado devolve zero em silêncio.
      const docs = await db
        .collection('banco_listas_usuario')
        .find({ $and: [{ userId: new ObjectId(userId) }, condicaoDeTexto(['nome'], termos)] })
        .project({ nome: 1, questaoIds: 1 })
        .limit(6)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `lista:${doc._id}`,
        titulo: String(doc.nome || 'Lista de questões'),
        subtitulo: Array.isArray(doc.questaoIds) ? `${doc.questaoIds.length} questões` : undefined,
        trilha: 'Banco de Questões › Minhas listas',
        prioridade: 6,
        grupo: 'conteudo' as const,
        href: `/banco-questoes/listas/${doc._id}`,
        icone: 'list-checks',
        etiqueta: 'Lista',
        secao: 'bancoQuestoes' as const,
      }))
    },
  },
  {
    chave: 'provas',
    async rodar({ db, userId, termos }) {
      // Mesmo recorte de /api/exams: prova pública visível, ou prova pessoal
      // de quem está buscando.
      const acesso = {
        isDeleted: { $ne: true },
        $or: [
          { isHidden: false, $or: [{ isPersonalExam: false }, { isPersonalExam: { $exists: false } }] },
          { isPersonalExam: true, createdBy: userId },
        ],
      }

      const docs = await db
        .collection('exams')
        .find({ $and: [acesso, condicaoDeTexto(['title', 'description'], termos)] })
        .project({ title: 1, description: 1, isPersonalExam: 1, numberOfQuestions: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `prova:${doc._id}`,
        titulo: String(doc.title || 'Prova'),
        subtitulo: textoCurto(doc.description) ?? (doc.numberOfQuestions ? `${doc.numberOfQuestions} questões` : undefined),
        trilha: doc.isPersonalExam ? 'Provas › Pessoais' : 'Provas',
        prioridade: 6,
        grupo: 'conteudo' as const,
        href: `/exam/${doc._id}`,
        icone: 'file-text',
        etiqueta: 'Prova',
        secao: 'provas' as const,
      }))
    },
  },
  {
    chave: 'forum',
    async rodar({ db, termos }) {
      const docs = await db
        .collection('forumPosts')
        .find(condicaoDeTexto(['title', 'content', 'tags'], termos))
        .project({ title: 1, content: 1, tags: 1, forumType: 1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `forum:${doc._id}`,
        titulo: String(doc.title || 'Publicação'),
        subtitulo: textoCurto(doc.content, 140),
        trilha: 'Fórum',
        palavrasChave: listaDeTextos(doc.tags),
        prioridade: 4,
        grupo: 'conteudo' as const,
        href: `/forum/post/${doc._id}`,
        icone: 'message-circle',
        etiqueta: 'Fórum',
        secao: 'forum' as const,
      }))
    },
  },
  {
    chave: 'rifas',
    async rodar({ db, isAdmin, termos }) {
      // Rifa em rascunho não existe para quem não é admin.
      const condicoes: object[] = [condicaoDeTexto(['name', 'prizeName', 'description'], termos)]
      if (!isAdmin) condicoes.push({ status: { $ne: 'draft' } })

      const docs = await db
        .collection('raffles')
        .find({ $and: condicoes })
        .project({ name: 1, slug: 1, prizeName: 1, status: 1 })
        .limit(4)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map(doc => ({
        id: `rifa:${doc._id}`,
        titulo: String(doc.name || 'Rifa'),
        subtitulo: textoCurto(doc.prizeName),
        trilha: 'Rifas & Sorteios',
        prioridade: 4,
        grupo: 'conteudo' as const,
        href: `/rifas/${doc.slug}`,
        icone: 'ticket',
        etiqueta: 'Rifa',
        secao: 'rifas' as const,
      }))
    },
  },
]

/* ─────────────────────── Ferramentas clínicas ─────────────────────── */

/**
 * As 201 calculadoras viram itens de busca uma única vez por processo. O módulo
 * de conteúdo é grande e o `import()` é assíncrono; a promessa fica guardada
 * para que requisições concorrentes na mesma lambda esperem a MESMA carga em
 * vez de dispararem quinze `import()` cada uma.
 */
let ferramentasPromessa: Promise<ItemBusca[]> | null = null

function carregarFerramentas(): Promise<ItemBusca[]> {
  if (!ferramentasPromessa) {
    ferramentasPromessa = import('@/lib/ferramentas-clinicas')
      .then(async mod => {
        const todas = await mod.carregarTodas()
        return todas.map(f => ({
          id: `ferramenta:${f.id}`,
          titulo: f.nome,
          subtitulo: f.resumo,
          trilha: 'Manual Clínico › Ferramentas Clínicas',
          palavrasChave: [f.sigla, ...(f.sinonimos ?? []), 'calculadora', 'escore'].filter(
            (v): v is string => typeof v === 'string',
          ),
          prioridade: 6,
          grupo: 'ferramenta' as const,
          href: `/manual-clinico/ferramentas/${f.categorias[0]}?f=${f.id}`,
          icone: 'calculator',
          etiqueta: 'Calculadora',
          secao: 'manualClinico' as const,
        }))
      })
      .catch(() => {
        // Uma falha de carga não pode fossilizar: zerar a promessa deixa a
        // próxima requisição tentar de novo.
        ferramentasPromessa = null
        return []
      })
  }
  return ferramentasPromessa
}

/* ───────────────────────────── Cache ───────────────────────────── */

/**
 * Cache por usuário e consulta, curto. Digitar "cardio" e apagar de volta para
 * "cardi" é o padrão normal de uso e refaria treze varreduras no Mongo; 45
 * segundos são suficientes para cobrir a sessão de digitação sem servir
 * conteúdo velho depois de uma compra ou publicação.
 */
const CACHE_TTL_MS = 45_000
const CACHE_MAXIMO = 300
const cache = new Map<string, { em: number; resposta: RespostaBusca }>()

function lerCache(chave: string): RespostaBusca | null {
  const entrada = cache.get(chave)
  if (!entrada) return null
  if (Date.now() - entrada.em > CACHE_TTL_MS) {
    cache.delete(chave)
    return null
  }
  return entrada.resposta
}

function gravarCache(chave: string, resposta: RespostaBusca) {
  if (cache.size >= CACHE_MAXIMO) {
    // Descarte das mais antigas: `Map` preserva ordem de inserção, então as
    // primeiras chaves são as mais velhas.
    const excedente = cache.size - CACHE_MAXIMO + 50
    let i = 0
    for (const chaveAntiga of cache.keys()) {
      if (i++ >= excedente) break
      cache.delete(chaveAntiga)
    }
  }
  cache.set(chave, { em: Date.now(), resposta })
}

/* ───────────────────────────── Rota ───────────────────────────── */

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const bruto = (request.nextUrl.searchParams.get('q') || '').slice(0, 120)
  const consulta = chaveDeBusca(bruto)
  const termos = termosDaConsulta(bruto).filter(t => t.length >= 2)

  if (consulta.length < 2 || termos.length === 0) {
    return NextResponse.json({ itens: [] } satisfies RespostaBusca)
  }

  const isAdmin = session.role === 'admin'
  const chaveCache = `${session.userId}|${isAdmin ? 'a' : 'u'}|${consulta}`
  const emCache = lerCache(chaveCache)
  if (emCache) {
    return NextResponse.json(emCache, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  }

  const inicio = Date.now()

  try {
    const db = await getDb()
    const ctx: Contexto = { db, userId: session.userId, isAdmin, termos }

    const resultados = await Promise.allSettled([
      ...FONTES.map(fonte => fonte.rodar(ctx)),
      carregarFerramentas(),
    ])

    const itens: ItemBusca[] = []
    let incompleto = false
    for (const resultado of resultados) {
      if (resultado.status === 'fulfilled') itens.push(...resultado.value)
      else incompleto = true
    }

    // As ferramentas entram inteiras (201) e são filtradas aqui pelo mesmo
    // motor que ordena o resto — é o que mantém a régua igual para todas as
    // fontes, inclusive as que o Mongo já havia pré-filtrado.
    const ranqueados = ranquear(indexar(itens), bruto, { limite: LIMITE_RESPOSTA })

    const resposta: RespostaBusca = {
      itens: ranqueados.map(r => r.item),
      ...(incompleto ? { incompleto: true } : {}),
      ms: Date.now() - inicio,
    }

    gravarCache(chaveCache, resposta)

    return NextResponse.json(resposta, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    })
  } catch (erro) {
    console.error('Erro na busca global:', erro)
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}

/**
 * Busca de destinos internos para um anúncio.
 *
 * Existe para que o admin escolha PARA ONDE o banner leva sem precisar montar a
 * URL na mão — o que, além de trabalhoso, era a origem do problema que motivou
 * esta rota: colar um link absoluto (às vezes de outro domínio) fazia o clique
 * abrir uma aba nova e tirar a pessoa do app. Aqui todo item devolvido é um
 * caminho interno, navegável com `router.push`.
 *
 * GET /api/admin/anuncios/destinos?q=termo&tipo=material
 *
 * Sem `q`, devolve uma lista inicial com as áreas e páginas da plataforma mais
 * os itens recentes de cada coleção — o admin quase sempre quer o material que
 * acabou de publicar, e fazê-lo digitar para descobrir isso é atrito à toa.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Db } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { CATALOGO } from '@/lib/busca-plataforma/catalogo'
import { condicaoDeTexto, textoCurto } from '@/lib/busca-plataforma/mongo'
import { termosDaConsulta } from '@/lib/busca-plataforma/texto'
import { isInternalPath, type AnuncioDestinoTipo } from '@/lib/anuncio-destinos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIMITE_POR_FONTE = 6
const LIMITE_RESPOSTA = 40
const TEMPO_MAXIMO_MS = 2500

export interface DestinoSugerido {
  id: string
  tipo: AnuncioDestinoTipo
  titulo: string
  subtitulo?: string
  trilha?: string
  href: string
  refId?: string
}

interface Fonte {
  tipo: Exclude<AnuncioDestinoTipo, 'pagina' | 'externo'>
  rodar: (db: Db, termos: string[]) => Promise<DestinoSugerido[]>
}

/** Filtro da fonte: com termos, busca textual; sem termos, os mais recentes. */
function filtroDaFonte(campos: string[], termos: string[]) {
  return termos.length > 0 ? condicaoDeTexto(campos, termos) : {}
}

const FONTES: Fonte[] = [
  {
    tipo: 'material',
    async rodar(db, termos) {
      const docs = await db
        .collection('materials')
        .find(filtroDaFonte(['title', 'description', 'tags'], termos))
        .project({ title: 1, description: 1, isHidden: 1 })
        .sort({ createdAt: -1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map((doc) => ({
        id: `material:${doc._id}`,
        tipo: 'material' as const,
        titulo: String(doc.title || 'Material'),
        subtitulo: textoCurto(doc.description),
        trilha: doc.isHidden ? 'Materiais · oculto' : 'Materiais',
        href: `/materiais/${doc._id}`,
        refId: String(doc._id),
      }))
    },
  },
  {
    tipo: 'pacote',
    async rodar(db, termos) {
      const docs = await db
        .collection('material_packages')
        .find(filtroDaFonte(['title', 'description'], termos))
        .project({ title: 1, description: 1, isHidden: 1 })
        .sort({ createdAt: -1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map((doc) => ({
        id: `pacote:${doc._id}`,
        tipo: 'pacote' as const,
        titulo: String(doc.title || 'Pacote'),
        subtitulo: textoCurto(doc.description),
        trilha: doc.isHidden ? 'Materiais › Pacotes · oculto' : 'Materiais › Pacotes',
        href: `/pacotes/${doc._id}`,
        refId: String(doc._id),
      }))
    },
  },
  {
    tipo: 'produto',
    async rodar(db, termos) {
      const docs = await db
        .collection('physical_products')
        .find(filtroDaFonte(['title', 'description', 'tags'], termos))
        .project({ title: 1, description: 1, slug: 1, isHidden: 1 })
        .sort({ createdAt: -1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map((doc) => ({
        id: `produto:${doc._id}`,
        tipo: 'produto' as const,
        titulo: String(doc.title || 'Produto'),
        subtitulo: textoCurto(doc.description),
        trilha: doc.isHidden ? 'Loja · oculto' : 'Loja',
        // A página aceita id ou slug; o id nunca muda quando o nome do produto
        // é editado, então é ele que vai para o anúncio.
        href: `/loja/${doc._id}`,
        refId: String(doc._id),
      }))
    },
  },
  {
    tipo: 'aula',
    async rodar(db, termos) {
      const docs = await db
        .collection('aulas_postagens')
        .find(filtroDaFonte(['titulo', 'descricao'], termos))
        .project({ titulo: 1, descricao: 1, tipo: 1 })
        .sort({ criadoEm: -1 })
        .limit(LIMITE_POR_FONTE)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs.map((doc) => ({
        id: `aula:${doc._id}`,
        tipo: 'aula' as const,
        titulo: String(doc.titulo || 'Aula'),
        subtitulo: textoCurto(doc.descricao),
        trilha: doc.tipo === 'ao-vivo' ? 'Aulas › Ao vivo' : 'Aulas › Gravadas',
        href: `/aulas/${doc._id}`,
        refId: String(doc._id),
      }))
    },
  },
  {
    tipo: 'rifa',
    async rodar(db, termos) {
      const docs = await db
        .collection('raffles')
        .find(filtroDaFonte(['name', 'prizeName', 'description'], termos))
        .project({ name: 1, prizeName: 1, slug: 1, status: 1 })
        .sort({ createdAt: -1 })
        .limit(4)
        .maxTimeMS(TEMPO_MAXIMO_MS)
        .toArray()

      return docs
        .filter((doc) => typeof doc.slug === 'string' && doc.slug.trim().length > 0)
        .map((doc) => ({
          id: `rifa:${doc._id}`,
          tipo: 'rifa' as const,
          titulo: String(doc.name || 'Rifa'),
          subtitulo: textoCurto(doc.prizeName),
          trilha: doc.status === 'draft' ? 'Rifas · rascunho' : 'Rifas',
          href: `/rifas/${doc.slug}`,
          refId: String(doc._id),
        }))
    },
  },
]

/**
 * Páginas e áreas fixas da plataforma.
 *
 * Vêm do mesmo catálogo da busca global, então uma área nova aparece aqui sem
 * ninguém precisar lembrar de cadastrá-la de novo. As entradas de ação (que não
 * navegam) e as do painel do admin ficam de fora: anúncio não leva usuário para
 * o /admin.
 */
function paginasDaPlataforma(termos: string[]): DestinoSugerido[] {
  const itens = CATALOGO.filter(
    (item) => !!item.href && !item.somenteAdmin && item.grupo !== 'admin' && item.grupo !== 'acao',
  )

  const filtrados =
    termos.length === 0
      ? itens
      : itens.filter((item) => {
          const alvo = [item.titulo, item.subtitulo, item.trilha, ...(item.palavrasChave ?? [])]
            .filter(Boolean)
            .join(' ')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
          return termos.every((termo) => alvo.includes(termo))
        })

  return filtrados.map((item) => ({
    id: item.id,
    tipo: 'pagina' as const,
    titulo: item.titulo,
    subtitulo: item.subtitulo,
    trilha: item.trilha,
    href: item.href as string,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const consulta = (request.nextUrl.searchParams.get('q') || '').trim()
    const tipoPedido = request.nextUrl.searchParams.get('tipo') || ''
    const termos = termosDaConsulta(consulta)

    const paginas = tipoPedido && tipoPedido !== 'pagina' ? [] : paginasDaPlataforma(termos)

    const fontes = FONTES.filter((fonte) => !tipoPedido || tipoPedido === fonte.tipo)
    let incompleto = false
    let doBanco: DestinoSugerido[] = []

    if (fontes.length > 0) {
      const db = await getDb()
      // `allSettled`: uma coleção indisponível degrada a lista em vez de
      // derrubar a busca inteira — mesmo critério de `/api/busca`.
      const resultados = await Promise.allSettled(fontes.map((fonte) => fonte.rodar(db, termos)))

      for (const resultado of resultados) {
        if (resultado.status === 'fulfilled') {
          doBanco = doBanco.concat(resultado.value)
        } else {
          incompleto = true
          console.error('[anuncios/destinos] fonte falhou:', resultado.reason)
        }
      }
    }

    // O conteúdo do banco é o que o admin quase sempre procura; as páginas
    // fixas entram depois e sem teto curto, porque são poucas.
    const itens = [...doBanco, ...paginas]
      .filter((item) => isInternalPath(item.href))
      .slice(0, LIMITE_RESPOSTA)

    return NextResponse.json({ itens, incompleto })
  } catch (error) {
    console.error('Erro ao buscar destinos de anuncio:', error)
    return NextResponse.json({ error: 'Erro ao buscar destinos' }, { status: 500 })
  }
}

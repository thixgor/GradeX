import 'server-only'

import { absoluteUrl } from '@/lib/seo'

import { coloracaoPorId } from './coloracoes'
import { estruturasDaLamina } from './estruturas'
import { BANCO, contagemDoBanco } from './quiz/banco'
import {
  LAMINAS,
  TOTAIS,
  laminaPorSlug,
  laminasDoOrgao,
  laminasDoSistema,
  orgaoPorId,
  orgaosDoSistema,
  resumir,
  resumosParaBusca,
} from './repositorio'
import { rotaDaLaminaZoom } from './rotas'
import { SISTEMAS, sistemaPorId } from './sistemas'
import { TECIDOS, descricoesDosTecidos } from './tecidos'
import type {
  DadosDaLaminaDoZoom,
  DadosDoCatalogoDoZoom,
  DadosDoQuizDoZoom,
  DadosDoSistemaDoZoom,
} from './paginas-tipos'
import type { LaminaZoom } from './tipos'

/**
 * As páginas da Histologia com Zoom, como dado.
 *
 * Eram montadas dentro de cada `page.tsx`, que por isso lia a sessão e saía da
 * função a cada visita (o catálogo, com o índice de busca, passava de 470 KB de
 * HTML). As páginas viraram cascos estáticos e isto chega por
 * `/api/manual-clinico/histologia/zoom/…`, depois do portão. Os recortes são os
 * das páginas antigas.
 */

/** Lâminas de vitrine no topo: uma de cada grande grupo, escolhidas pela beleza do scan. */
const DESTAQUES = ['medula-espinal-tionina', 'rim-he', 'traqueia-pas', 'figado-he-2', 'epiglote-orceina', 'testiculo-he']

export function dadosDoCatalogoDoZoom(): DadosDoCatalogoDoZoom {
  const especiesNaoHumanas = [
    ...new Set(
      LAMINAS.filter((l) => l.origem.categoria === 'nao-humana' || l.origem.categoria === 'vegetal').map((l) =>
        l.especie.replace(' (primata não humano)', '').replace(/ \(.*\)$/, '').toLowerCase(),
      ),
    ),
  ].join(', ')

  return {
    totais: TOTAIS,
    especiesNaoHumanas,
    destaques: DESTAQUES.map((s) => LAMINAS.find((l) => l.slug === s))
      .filter((l): l is LaminaZoom => Boolean(l))
      .map((l) => ({
        slug: l.slug,
        sistema: l.sistema,
        titulo: l.titulo,
        coloracao: l.coloracao,
        miniatura: l.piramide.miniatura.url,
      })),
    indice: resumosParaBusca(),
    sistemas: SISTEMAS.map((s) => {
      const laminas = laminasDoSistema(s.id)
      return {
        id: s.id,
        nome: s.nome,
        cor: s.cor,
        icone: s.icone,
        capa: laminas[0] ? resumir(laminas[0]).miniatura : null,
        laminas: laminas.length,
        orgaos: orgaosDoSistema(s.id).map((o) => ({ id: o.id, nome: o.nome })),
      }
    }),
  }
}

export function dadosDoSistemaDoZoom(id: string): DadosDoSistemaDoZoom | null {
  const sistema = sistemaPorId(id)
  if (!sistema) return null

  const indice = SISTEMAS.findIndex((s) => s.id === sistema.id)
  const vizinho = (s: (typeof SISTEMAS)[number] | undefined) => (s ? { id: s.id, nome: s.nome } : null)

  return {
    sistema: { id: sistema.id, nome: sistema.nome, descricao: sistema.descricao, cor: sistema.cor, icone: sistema.icone },
    total: laminasDoSistema(sistema.id).length,
    orgaos: orgaosDoSistema(sistema.id).map((o) => ({
      id: o.id,
      nome: o.nome,
      resumo: o.ficha.resumo,
      tecidos: o.ficha.tecidos
        .slice()
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 3)
        .map((t) => ({ tipo: t.tipo, curto: TECIDOS[t.tipo].curto, pct: t.pct })),
      laminas: laminasDoOrgao(o.id).map(resumir),
    })),
    vizinhos: [vizinho(SISTEMAS[indice - 1]), vizinho(SISTEMAS[indice + 1])],
  }
}

/** A lâmina pelo slug, para o casco decidir 404 e o endereço canônico. */
export function laminaDoZoom(slug: string): Pick<LaminaZoom, 'slug' | 'sistema'> | null {
  const lamina = laminaPorSlug(slug)
  return lamina ? { slug: lamina.slug, sistema: lamina.sistema } : null
}

export function dadosDaLaminaDoZoom(slug: string): DadosDaLaminaDoZoom | null {
  const lamina = laminaPorSlug(slug)
  if (!lamina) return null

  const orgao = orgaoPorId(lamina.orgao)!
  const sistema = sistemaPorId(lamina.sistema)!
  const posicao = LAMINAS.findIndex((l) => l.slug === lamina.slug)
  const anterior = LAMINAS[posicao - 1]
  const proxima = LAMINAS[posicao + 1]
  const rotulo = (l: LaminaZoom) => `${l.titulo}${l.subtitulo ? ` — ${l.subtitulo}` : ''}`
  const vizinha = (l: LaminaZoom | undefined) => (l ? { href: rotaDaLaminaZoom(l.sistema, l.slug), rotulo: rotulo(l) } : null)

  return {
    lamina,
    orgao,
    sistema: { id: sistema.id, nome: sistema.nome },
    descricoes: descricoesDosTecidos(orgao.ficha.tecidos.map((t) => t.tipo)),
    coloracao: coloracaoPorId(lamina.coloracaoId) ?? null,
    estruturas: estruturasDaLamina(lamina.slug),
    irmas: laminasDoOrgao(orgao.id).map(resumir),
    outrosOrgaos: orgaosDoSistema(sistema.id)
      .filter((o) => o.id !== orgao.id)
      .map((o) => ({ id: o.id, nome: o.nome, href: rotaDaLaminaZoom(sistema.id, laminasDoOrgao(o.id)[0].slug) })),
    anterior: vizinha(anterior),
    proxima: vizinha(proxima),
    urlDaLamina: absoluteUrl(rotaDaLaminaZoom(lamina.sistema, lamina.slug)),
    visto: {
      href: rotaDaLaminaZoom(lamina.sistema, lamina.slug),
      titulo: rotulo(lamina),
      categoria: `Histologia · ${sistema.nome}`,
      area: 'histologia',
      imagem: lamina.piramide.miniatura.url,
      zoom: true,
    },
  }
}

export function dadosDoQuizDoZoom(): DadosDoQuizDoZoom {
  return {
    sistemas: contagemDoBanco(),
    estruturas: BANCO.filter((d) => d.tipo === 'estrutura').length,
    orgaos: BANCO.filter((d) => d.tipo === 'orgao').length,
  }
}

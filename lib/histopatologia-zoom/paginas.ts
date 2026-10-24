import 'server-only'

import type { LinhaDeAchado } from '@/components/histopatologia-zoom/lamina-patologica'
import { capituloDaDoencaZoom } from '@/lib/histologia/catalogo'
import { estruturasDaLamina } from '@/lib/histologia-zoom/estruturas'
import { FONTES_DO_ACERVO, MARCA_DO_ACERVO, linhaDeCredito } from '@/lib/histologia-zoom/fonte'
import { laminaPorSlug, orgaoPorId } from '@/lib/histologia-zoom/repositorio'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { absoluteUrl } from '@/lib/seo'

import { achadoPorId, nomesDosAchadosDe } from './achados'
import { doencaPorId } from './doencas'
import { SERVIDORES_DE_LAMINAS, creditosDosServidores } from './fonte'
import {
  LAMINAS_PATOLOGICAS,
  TOTAIS_PATOZOOM,
  achadosDaLamina,
  alternativasDaLamina,
  capaDaDoenca,
  laminaDisponivel,
  anotacaoPatologica,
  doencasPublicadas,
  laminaNormalPara,
  laminaPatologicaPorSlug,
  laminasDaDoenca,
  laminasNormaisDoOrgao,
  marcacoesDaLamina,
  resumirPatologica,
} from './repositorio'
import { BASE_PATOZOOM, rotaDaLaminaPatologica } from './rotas'
import { textoDoCaso } from './texto'
import type {
  DadosDaComparacaoPatologica,
  DadosDaDoencaComZoom,
  DadosDaLaminaPatologica,
  DadosDoCatalogoDaPatologiaComZoom,
} from './paginas-tipos'
import type { LaminaPatologica } from './tipos'

/**
 * As páginas da Histopatologia com Zoom, como dado.
 *
 * Eram montadas dentro de cada `page.tsx`, que por isso lia a sessão e saía da
 * função a cada visita. As páginas viraram cascos estáticos e isto chega por
 * `/api/manual-clinico/histologia/histopatologia/zoom/…`, depois do portão. Os
 * recortes são os das páginas antigas.
 */

const rotulo = (l: LaminaPatologica) => `${l.titulo}${l.subtitulo ? ` — ${l.subtitulo}` : ''}`

export function dadosDoCatalogoDaPatologiaComZoom(): DadosDoCatalogoDaPatologiaComZoom {
  const doencas = doencasPublicadas()
  return {
    totais: { doencas: TOTAIS_PATOZOOM.doencas, laminas: TOTAIS_PATOZOOM.laminas, marcacoes: TOTAIS_PATOZOOM.marcacoes },
    sistemas: SISTEMAS.map((s) => ({
      id: s.id,
      nome: s.nome,
      cor: s.cor,
      icone: s.icone,
      doencas: doencas
        .filter((d) => d.sistema === s.id)
        .map((d) => {
          const laminas = laminasDaDoenca(d.id)
          return {
            id: d.id,
            nome: d.nome,
            resumo: d.resumo,
            miniatura: capaDaDoenca(d.id),
            laminas: laminas.length,
            achados: d.achados.length,
          }
        }),
    })).filter((s) => s.doencas.length),
    creditos: creditosDosServidores(LAMINAS_PATOLOGICAS.map((l) => l.servidor)),
  }
}

export function dadosDaDoencaComZoom(id: string): DadosDaDoencaComZoom | null {
  const doenca = doencaPorId(id)
  if (!doenca) return null
  const laminas = laminasDaDoenca(doenca.id)
  if (!laminas.length) return null
  const normal = laminaNormalPara(laminas[0])
  const orgao = orgaoPorId(doenca.orgao)
  const capitulo = capituloDaDoencaZoom(doenca)

  return {
    doenca,
    nomesDosAchados: nomesDosAchadosDe(doenca),
    orgao: orgao?.nome ?? null,
    capitulo: capitulo ? rotaDaDoenca(capitulo) : null,
    laminas: laminas.map((l) => {
      const resumo = resumirPatologica(l)
      return {
        slug: l.slug,
        nome: l.subtitulo ?? l.titulo,
        miniatura: resumo.miniatura,
        caso: textoDoCaso(l.caso.sexo, l.caso.idade),
        achadosPresentes: resumo.achadosPresentes,
        acervo: SERVIDORES_DE_LAMINAS[l.servidor].acervo,
        suplementar: l.servidor !== 'leeds',
        disponivel: resumo.disponivel,
      }
    }),
    creditos: creditosDosServidores(laminas.map((l) => l.servidor)),
    normal: normal
      ? { sistema: normal.sistema, slug: normal.slug, titulo: normal.titulo, subtitulo: normal.subtitulo, coloracao: normal.coloracao }
      : null,
    visto: {
      href: capitulo ? rotaDaDoenca(capitulo) : `${BASE_PATOZOOM}/${doenca.id}`,
      titulo: doenca.nome,
      categoria: `Histopatologia · ${orgao?.nome ?? 'Doença'}`,
      area: 'histopatologia',
      imagem: capaDaDoenca(doenca.id),
      zoom: true,
    },
  }
}

/** A lâmina pelo slug, para o casco decidir 404 e o endereço canônico. */
export function laminaPatologicaDoZoom(slug: string): Pick<LaminaPatologica, 'slug' | 'doenca'> | null {
  const lamina = laminaPatologicaPorSlug(slug)
  return lamina ? { slug: lamina.slug, doenca: lamina.doenca } : null
}

export function dadosDaLaminaPatologica(slug: string): DadosDaLaminaPatologica | null {
  const lamina = laminaPatologicaPorSlug(slug)
  if (!lamina) return null
  const doenca = doencaPorId(lamina.doenca)!
  const anotacao = anotacaoPatologica(lamina.slug)
  const marcacoes = marcacoesDaLamina(lamina.slug)
  const rotuloDe = new Map(marcacoes.map((m) => [m.id, m.rotulo ?? m.verbete.nome]))
  const fichaPorId = new Map(doenca.achados.map((a) => [a.achado, a]))

  const linhas: LinhaDeAchado[] = achadosDaLamina(lamina.slug, doenca).flatMap((a) => {
    const achado = achadoPorId(a.achado)
    if (!achado) return []
    const f = fichaPorId.get(a.achado)
    return [
      {
        achado,
        tipo: f?.tipo ?? 'extra',
        peso: f?.peso ?? null,
        comoAparece: f?.comoAparece ?? null,
        status: a.status,
        nota: a.nota ?? null,
        marcacoes: (a.marcacoes ?? []).map((id) => ({ id, rotulo: rotuloDe.get(id) ?? id })),
      },
    ]
  })

  const normal = laminaNormalPara(lamina)
  const posicao = LAMINAS_PATOLOGICAS.findIndex((l) => l.slug === lamina.slug)
  const vizinha = (l: LaminaPatologica | undefined) =>
    l ? { href: rotaDaLaminaPatologica(l.doenca, l.slug), rotulo: rotulo(l) } : null

  return {
    doenca,
    nomesDosAchados: nomesDosAchadosDe(doenca),
    lamina,
    anotacao: anotacao
      ? { resumo: anotacao.resumo, semMarcacoes: Boolean(anotacao.semMarcacoes), conferencias: anotacao.revisao.conferencias }
      : null,
    marcacoes,
    linhas,
    normal: normal ? { sistema: normal.sistema, slug: normal.slug, titulo: normal.titulo, coloracao: normal.coloracao } : null,
    anterior: vizinha(LAMINAS_PATOLOGICAS[posicao - 1]),
    proxima: vizinha(LAMINAS_PATOLOGICAS[posicao + 1]),
    alternativas: alternativasDaLamina(lamina).map((l) => ({
      href: rotaDaLaminaPatologica(l.doenca, l.slug),
      rotulo: `${rotulo(l)} · ${SERVIDORES_DE_LAMINAS[l.servidor].acervo}`,
    })),
    urlDaLamina: absoluteUrl(rotaDaLaminaPatologica(doenca.id, lamina.slug)),
    acervo: SERVIDORES_DE_LAMINAS[lamina.servidor].acervo,
    creditos: creditosDosServidores([lamina.servidor]),
    visto: {
      href: rotaDaLaminaPatologica(lamina.doenca, lamina.slug),
      titulo: rotulo(lamina),
      categoria: 'Histopatologia · Lâmina com zoom',
      area: 'histopatologia',
      imagem: laminaDisponivel(lamina) ? lamina.piramide.miniatura.url : capaDaDoenca(lamina.doenca),
      zoom: true,
    },
  }
}

export function dadosDaComparacaoPatologica(slug: string, normalPedida?: string | null): DadosDaComparacaoPatologica | null {
  const lamina = laminaPatologicaPorSlug(slug)
  if (!lamina) return null
  const doenca = doencaPorId(lamina.doenca)!
  const opcoes = laminasNormaisDoOrgao(lamina.orgao)
  const pedida = normalPedida ? laminaPorSlug(normalPedida) : undefined
  const normal = pedida && pedida.orgao === lamina.orgao ? pedida : laminaNormalPara(lamina)
  if (!normal) return null

  return {
    doenca: { id: doenca.id, nome: doenca.nome, comparacaoComNormal: doenca.comparacaoComNormal },
    lamina: { slug: lamina.slug, subtitulo: lamina.subtitulo },
    normal: {
      slug: normal.slug,
      titulo: normal.titulo,
      rotulo: normal.origem.categoria === 'humana' ? 'Normal' : `Normal · ${normal.especie}`,
      credito: normal.credito
        ? `${MARCA_DO_ACERVO} · ${linhaDeCredito(normal.credito)}.`
        : normal.fonte === 'gtex'
          ? FONTES_DO_ACERVO.gtex.creditoLongo
          : `${MARCA_DO_ACERVO}.`,
    },
    creditoDaLamina: SERVIDORES_DE_LAMINAS[lamina.servidor].rodape,
    doente: {
      titulo: lamina.titulo,
      subtitulo: lamina.subtitulo,
      piramide: lamina.piramide,
      ampliacaoMaxima: lamina.objetiva,
      marcacoes: marcacoesDaLamina(lamina.slug),
    },
    sadio: {
      titulo: normal.titulo,
      subtitulo: normal.subtitulo ? `${normal.subtitulo} (${normal.coloracao})` : normal.coloracao,
      piramide: normal.piramide,
      ampliacaoMaxima: normal.ampliacaoMaxima,
      marcacoes: estruturasDaLamina(normal.slug).map((e) => ({ ...e, categoria: undefined })),
    },
    opcoes: opcoes.map((o) => ({
      slug: o.slug,
      rotulo: `${o.coloracao}${o.subtitulo ? ` · ${o.subtitulo}` : ''}${o.origem.categoria !== 'humana' ? ` · ${o.especie}` : ''}`,
    })),
  }
}

/** A doença tem página com zoom? (existe e tem ao menos uma lâmina) — para o casco decidir 404. */
export function doencaComZoomExiste(id: string): boolean {
  return Boolean(doencaPorId(id)) && laminasDaDoenca(id).length > 0
}

/** A comparação existe? Lâmina da doença certa, e um normal de referência para pôr ao lado. */
export function comparacaoExiste(doenca: string, slug: string): boolean {
  const lamina = laminaPatologicaPorSlug(slug)
  if (!lamina || lamina.doenca !== doenca) return false
  // `?normal=` só é lido no navegador; aqui basta haver algum normal possível.
  return Boolean(laminaNormalPara(lamina)) || laminasNormaisDoOrgao(lamina.orgao).length > 0
}

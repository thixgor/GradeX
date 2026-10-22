import 'server-only'

import { AVISO_ACERVO_INDISPONIVEL, inventarioDaEntrada } from './acervo'
import { CAPITULOS_DO_ATLAS, obterCapituloDoAtlas } from './catalogacao'
import { ALTERACOES_EDITORIAIS, AVISO_EDUCACIONAL, CREDITO_BASE, FONTES, LISTA_DE_FONTES, resolverDireitos } from './direitos'
import { FAMILIAS_DE_MECANISMO } from './editorial/familias-de-mecanismo'
import type { MidiaExibivel } from './esquemas'
import { paraExibicao } from './midia'
import {
  DOENCAS_RESUMIDAS,
  MECANISMOS_PUBLICADOS,
  SISTEMAS_COM_CONTAGEM,
  TOTAIS,
  doencasDoMecanismo,
  doencasDoSistema,
  obterDoenca,
  obterEntradaCatalogada,
  obterInventario,
  obterMecanismoPublicado,
  obterSistemaComContagem,
  resumoDaDoenca,
} from './repositorio'
import { chaveDeBusca } from './texto'
import {
  CAPITULOS_WEBPATH_UTAH,
  TOTAL_ENTRADAS_WEBPATH_UTAH,
  modalidadeDaEntradaWebPathUtah,
  resumoDoCapituloWebPathUtah,
} from './webpath-utah/catalogo'
import { obterCapituloWebPathUtah } from './webpath-utah/repositorio'
import {
  leituraDidaticaWebPathUtah,
  traduzirSecaoWebPathUtah,
  traduzirTituloWebPathUtah,
} from './webpath-utah/traducao'
import type {
  DadosDaComparacaoComNormal,
  DadosDaEntradaDoAtlas,
  DadosDoAtlasDaPatologia,
  DadosDoCapituloWebPath,
  DadosDoMecanismo,
  DadosDoSistemaDaPatologia,
  DadosDosCreditos,
  DadosDosMecanismos,
} from './paginas-tipos'

/**
 * As demais páginas da Histopatologia, como dado — o que cada `page.tsx`
 * montava no servidor, agora entregue por
 * `/api/manual-clinico/histologia/histopatologia/…` depois do portão. Os
 * recortes, filtros e paginações são os das páginas antigas; os parâmetros que
 * elas liam da URL chegam aqui pela rota e são validados aqui.
 */

/* ───────────────────────────── Atlas ───────────────────────────── */

export function dadosDoAtlasDaPatologia(): DadosDoAtlasDaPatologia {
  return {
    totalDeItens: TOTAIS.capitulosVisuais + TOTAL_ENTRADAS_WEBPATH_UTAH,
    totalWebPath: TOTAL_ENTRADAS_WEBPATH_UTAH,
    capitulosWebPath: CAPITULOS_WEBPATH_UTAH.map(({ id, nome, descricao, total }) => ({ id, nome, descricao, total })),
    sistemas: SISTEMAS_COM_CONTAGEM.map(({ id, nome, entradas }) => ({ id, nome, entradas })),
    fontes: LISTA_DE_FONTES.map(({ id, nome, atribuicaoCatalogada, politicaInicial, url }) => ({
      id,
      nome,
      atribuicaoCatalogada,
      politicaInicial,
      url,
    })),
    falhasDeColeta: TOTAIS.falhasDeColeta,
  }
}

/* ─────────────────────── Entrada do atlas ─────────────────────── */

const POR_PAGINA_DA_ENTRADA = 24

/**
 * Uma entrada catalogada, com a página pedida do inventário. Uma entrada chega
 * a 5.369 referências; a página traz 24, lidas do fragmento comprimido
 * correspondente — um arquivo, não os dezoito.
 */
export async function dadosDaEntradaDoAtlas(
  id: string,
  filtros: { pagina?: string | null; modalidade?: string | null; coloracao?: string | null },
): Promise<DadosDaEntradaDoAtlas | null> {
  const entrada = await obterEntradaCatalogada(id)
  if (!entrada) return null

  const pagina = Math.max(1, Number(filtros.pagina) || 1)
  const inventario = await inventarioDaEntrada(entrada, {
    pagina,
    porPagina: POR_PAGINA_DA_ENTRADA,
    modalidade: filtros.modalidade ?? undefined,
    coloracao: filtros.coloracao ?? undefined,
  })
  const doenca = entrada.doencaSlug ? resumoDaDoenca(entrada.doencaSlug) : undefined
  const { fragmentosDeMidia: _, ...semFragmentos } = entrada

  return {
    entrada: semFragmentos,
    fonte: { nome: FONTES[entrada.fonteId].nome, atribuicaoCatalogada: FONTES[entrada.fonteId].atribuicaoCatalogada },
    sistema: obterSistemaComContagem(entrada.sistemaId)?.nome ?? null,
    doenca: doenca ? { slug: doenca.slug, nome: doenca.nome } : null,
    inventario: {
      acervoDisponivel: inventario.acervoDisponivel,
      itens: inventario.itens,
      total: inventario.total,
      descartadasPorAllowlist: inventario.descartadasPorAllowlist,
    },
    pagina,
    porPagina: POR_PAGINA_DA_ENTRADA,
    totalDePaginas: Math.max(1, Math.ceil(inventario.total / POR_PAGINA_DA_ENTRADA)),
    avisoDeAcervoIndisponivel: AVISO_ACERVO_INDISPONIVEL,
  }
}

/* ───────────────────── Capítulo do WebPath/Utah ───────────────────── */

const POR_PAGINA_DO_WEBPATH = 24

export async function dadosDoCapituloWebPath(
  id: string,
  filtros: { q?: string | null; modalidade?: string | null; pagina?: string | null; ref?: string | null },
): Promise<DadosDoCapituloWebPath | null> {
  const resumo = resumoDoCapituloWebPathUtah(id)
  const capitulo = await obterCapituloWebPathUtah(id)
  if (!resumo || !capitulo) return null

  const consulta = (filtros.q ?? '').trim()
  const chave = chaveDeBusca(consulta)
  const referenciaBruta = (filtros.ref ?? '').trim()
  const referencia = /^[A-Za-z0-9.-]{1,80}$/.test(referenciaBruta) ? referenciaBruta : ''
  const modalidade =
    filtros.modalidade === 'macroscopia' || filtros.modalidade === 'microscopia' ? filtros.modalidade : 'todas'

  const preparadas = capitulo.entradas.map((entrada) => ({
    ...entrada,
    titulo: traduzirTituloWebPathUtah(entrada.tituloOriginal),
    secao: traduzirSecaoWebPathUtah(entrada.secaoOriginal),
    modalidade: modalidadeDaEntradaWebPathUtah(entrada.tituloOriginal),
  }))
  const filtradas = preparadas.filter((entrada) => {
    if (referencia && !entrada.url.endsWith(`/${referencia}`)) return false
    if (modalidade !== 'todas' && entrada.modalidade !== modalidade) return false
    if (!chave) return true
    return chaveDeBusca(
      `${entrada.titulo} ${entrada.tituloOriginal} ${entrada.secao} ${entrada.secaoOriginal}`,
    ).includes(chave)
  })

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA_DO_WEBPATH))
  const solicitada = Number.parseInt(filtros.pagina ?? '1', 10)
  const pagina = Number.isFinite(solicitada) ? Math.min(Math.max(solicitada, 1), paginas) : 1
  const visiveis = filtradas.slice((pagina - 1) * POR_PAGINA_DO_WEBPATH, pagina * POR_PAGINA_DO_WEBPATH)
  const macros = preparadas.filter((entrada) => entrada.modalidade === 'macroscopia').length

  return {
    resumo: {
      id: resumo.id,
      grupo: resumo.grupo,
      nome: resumo.nome,
      nomeOriginal: resumo.nomeOriginal,
      descricao: resumo.descricao,
      roteiro: resumo.roteiro,
      total: resumo.total,
    },
    macros,
    micros: preparadas.length - macros,
    encontradas: filtradas.length,
    consulta,
    modalidade,
    referencia,
    pagina,
    paginas,
    entradas: visiveis.map((entrada) => {
      const leitura = leituraDidaticaWebPathUtah(entrada.tituloOriginal)
      const idDaReferencia = new URL(entrada.url).pathname.split('/').pop() ?? entrada.url
      const estadoDeDireitos = resolverDireitos({
        fonteId: 'webpath-utah',
        midiaId: idDaReferencia,
        urlPaginaFonte: entrada.url,
        urlImagem: entrada.urlImagem,
      }).estado
      const modalidadeExibida: MidiaExibivel['modalidade'] = /immunohistochemical/i.test(entrada.tituloOriginal)
        ? 'Imuno-histoquímica'
        : entrada.modalidade === 'macroscopia'
          ? 'Macroscopia'
          : 'Histologia'

      const midia: MidiaExibivel = {
        id: `webpath-utah-${idDaReferencia}`,
        fonteId: 'webpath-utah',
        modalidade: modalidadeExibida,
        coloracao: coloracaoDaEntrada(entrada.tituloOriginal),
        descricao: leitura.descricao,
        descricaoRevisada: true,
        nomeCatalogado: entrada.titulo,
        urlPaginaFonte: entrada.url,
        urlImagem: entrada.urlImagem,
        estadoDeDireitos,
        alt: `${modalidadeExibida} catalogada como “${entrada.titulo}”, exibida diretamente da WebPath com autorização.`,
        creditoCurto: FONTES['webpath-utah'].creditoCurto,
        aumento: aumentoDaEntrada(entrada.tituloOriginal),
        legendaEditorial: leitura.descricao,
      }

      return {
        midia,
        nomeOriginal: entrada.tituloOriginal,
        secao: entrada.secao,
        pontosDeObservacao: leitura.observacoes,
      }
    }),
  }
}

function coloracaoDaEntrada(titulo: string): string {
  const coloracoes: Array<[RegExp, string]> = [
    [/trichrome/i, 'Tricrômico'],
    [/reticulin/i, 'Reticulina'],
    [/congo red/i, 'Vermelho Congo'],
    [/methylene blue/i, 'Azul de metileno'],
    [/acid[- ]fast/i, 'Ácido-resistente'],
    [/silver|GMS/i, 'Prata'],
    [/\bPAS\b/i, 'PAS'],
    [/gram/i, 'Gram'],
    [/iron|prussian blue/i, 'Azul da Prússia'],
    [/mucicarmine/i, 'Mucicarmim'],
  ]
  return coloracoes.find(([padrao]) => padrao.test(titulo))?.[1] ?? 'Não informado'
}

function aumentoDaEntrada(titulo: string): MidiaExibivel['aumento'] {
  if (/\bgross\b/i.test(titulo)) return 'macroscopia'
  if (/low power/i.test(titulo)) return 'pequeno'
  if (/medium power/i.test(titulo)) return 'medio'
  if (/high power/i.test(titulo)) return 'grande'
  return undefined
}

/* ─────────────────────────── Comparador ─────────────────────────── */

/**
 * O par normal × doença, validado contra o que a **própria doença declara** em
 * `histologiaNormalDeReferencia`: par não afirmado pela edição é `null` (404),
 * nunca comparação inventada.
 */
export async function dadosDaComparacaoComNormal(slugs: string[]): Promise<DadosDaComparacaoComNormal | null> {
  const [slugDaDoenca, ...caminhoNormal] = slugs
  if (!slugDaDoenca || caminhoNormal.length === 0) return null
  const fragmento = await obterDoenca(slugDaDoenca)
  if (!fragmento) return null

  const chave = caminhoNormal.join('/')
  const referencia = fragmento.doenca.conteudo.histologiaNormalDeReferencia.find(
    (r) => r.caminhoNormal.join('/') === chave,
  )
  if (!referencia) return null

  return {
    doenca: { slug: fragmento.doenca.slug, nome: fragmento.doenca.nome },
    referencia,
    midias: fragmento.galeria.map((m) => paraExibicao(m)).filter((m): m is MidiaExibivel => m !== null),
    linhasComparativas: fragmento.doenca.conteudo.normalVersusPatologico,
  }
}

/* ──────────────────────────── Créditos ──────────────────────────── */

export function dadosDosCreditos(): DadosDosCreditos {
  return {
    creditoBase: CREDITO_BASE,
    avisoEducacional: AVISO_EDUCACIONAL,
    alteracoes: [...ALTERACOES_EDITORIAIS],
    fontes: LISTA_DE_FONTES.map(({ id, creditoCurto, situacaoDeDireitos, atribuicaoCatalogada, url, doi }) => ({
      id,
      creditoCurto,
      situacaoDeDireitos,
      atribuicaoCatalogada,
      url,
      ...(doi ? { doi } : {}),
    })),
  }
}

/* ─────────────────────────── Mecanismos ─────────────────────────── */

export function dadosDosMecanismos(): DadosDosMecanismos {
  const contagemPorMecanismo: Record<string, number> = {}
  for (const doenca of DOENCAS_RESUMIDAS) {
    for (const id of doenca.mecanismoIds) contagemPorMecanismo[id] = (contagemPorMecanismo[id] ?? 0) + 1
  }
  return { total: TOTAIS.mecanismos, mecanismos: MECANISMOS_PUBLICADOS, contagemPorMecanismo }
}

export function dadosDoMecanismo(id: string): DadosDoMecanismo | null {
  const mecanismo = obterMecanismoPublicado(id)
  if (!mecanismo) return null
  return {
    mecanismo,
    familia: FAMILIAS_DE_MECANISMO.find((f) => f.id === mecanismo.familia) ?? null,
    doencas: doencasDoMecanismo(mecanismo.id),
    irmaos: MECANISMOS_PUBLICADOS.filter((m) => m.familia === mecanismo.familia && m.id !== mecanismo.id).map(
      (m) => ({ id: m.id, nome: m.nome }),
    ),
  }
}

/* ──────────────────────────── Sistema ──────────────────────────── */

const ENTRADAS_POR_PAGINA = 48

/**
 * Página de sistema: capítulos escritos primeiro, inventário depois, paginado
 * e filtrável por capítulo do atlas — os mesmos cortes da página antiga.
 */
export async function dadosDoSistemaDaPatologia(
  id: string,
  filtros: { pagina?: string | null; capitulo?: string | null },
): Promise<DadosDoSistemaDaPatologia | null> {
  const sistema = obterSistemaComContagem(id)
  if (!sistema) return null

  const inventario = (await obterInventario(sistema.id)).filter((entrada) => entrada.midiasElegiveis > 0)
  const capituloSelecionado = filtros.capitulo ? obterCapituloDoAtlas(filtros.capitulo) : undefined
  const filtradas = capituloSelecionado
    ? inventario.filter((entrada) => entrada.capituloId === capituloSelecionado.id)
    : inventario
  const totalDePaginas = Math.max(1, Math.ceil(filtradas.length / ENTRADAS_POR_PAGINA))
  const pagina = Math.min(totalDePaginas, Math.max(1, Number(filtros.pagina) || 1))
  const visiveis = filtradas.slice((pagina - 1) * ENTRADAS_POR_PAGINA, pagina * ENTRADAS_POR_PAGINA)

  return {
    sistema: {
      id: sistema.id,
      nome: sistema.nome,
      descricao: sistema.descricao,
      entradas: sistema.entradas,
      midias: sistema.midias,
      doencas: sistema.doencas,
      caminhoNormal: sistema.caminhoNormal ?? null,
    },
    doencas: doencasDoSistema(sistema.id),
    totalDoInventario: inventario.length,
    capitulos: CAPITULOS_DO_ATLAS.map((capitulo) => ({
      id: capitulo.id,
      nome: capitulo.nome,
      total: inventario.filter((entrada) => entrada.capituloId === capitulo.id).length,
    })).filter((capitulo) => capitulo.total > 0),
    capituloSelecionado: capituloSelecionado?.id ?? null,
    grupos: CAPITULOS_DO_ATLAS.map((capitulo) => ({
      id: capitulo.id,
      nome: capitulo.nome,
      descricao: capitulo.descricao,
      entradas: visiveis
        .filter((entrada) => entrada.capituloId === capitulo.id)
        .map(({ id: entrada, nome, descricao, midias, temLaminaVirtual, doencaSlug }) => ({
          id: entrada,
          nome,
          descricao,
          midias,
          temLaminaVirtual,
          doencaSlug,
        })),
    })).filter((grupo) => grupo.entradas.length > 0),
    pagina,
    totalDePaginas,
  }
}

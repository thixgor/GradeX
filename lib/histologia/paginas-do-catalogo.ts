import 'server-only'

import { TOTAIS as TOTAIS_ZOOM } from '@/lib/histologia-zoom/repositorio'
import { rotaDoSistema as rotaDoSistemaComZoom } from '@/lib/histologia-zoom/rotas'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { rotaDoSistema as rotaDoAtlasDoSistema } from '@/lib/histopatologia/rotas'

import {
  assuntosDoSistema,
  assuntosPorSetor,
  cartoes,
  destaquesNormaisComZoom,
  doencasDoSistema,
  imagemDoAssunto,
  laboratoriosDoCatalogo,
  laminasNormaisDoSistema,
  laminasPatologicasComZoom,
  quizComZoom,
  quizzesDoCatalogo,
  sistemasDePatologiaDe,
  sistemasDoCatalogo,
  type ItemDoCatalogo,
} from './catalogo'
import { COLORACOES } from './glossario'
import { MODULOS_DE_LABORATORIO, obterModulo } from './laboratorio'
import { LARGURA_LAMINA } from './midia'
import { quizParaCliente, type Modo } from './quiz-engine'
import {
  CURRICULO,
  RESUMO_DE_QUIZZES,
  RESUMO_DE_QUIZZES_PROPRIOS,
  TOTAIS,
  obterQuiz,
  type ResumoDeQuiz,
} from './repositorio'
import { rotaDaPagina } from './rotas'
import { jsonLdDeQuiz } from './seo'
import type {
  DadosDaAreaNormal,
  DadosDePraticar,
  DadosDoAtlas,
  DadosDoLaboratorio,
  DadosDoModuloDoLaboratorio,
  DadosDoQuiz,
  DadosDoSistemaUnificado,
  DadosDosQuizzes,
  DadosDosSistemas,
  QuizDaLista,
} from './paginas-do-catalogo-tipos'

/**
 * As páginas de navegação do catálogo, como dado — o que cada `page.tsx`
 * montava no servidor, agora entregue por `/api/manual-clinico/histologia/catalogo/…`
 * depois do portão. Os recortes são os das páginas antigas.
 */

export function dadosDaAreaNormal(): DadosDaAreaNormal {
  return {
    imagem: imagemDoAssunto('tecidos/epitelio', LARGURA_LAMINA),
    totais: {
      laminas: TOTAIS.laminas,
      estruturas: TOTAIS.estruturas,
      laminasComZoom: TOTAIS_ZOOM.laminas,
      sistemasComZoom: TOTAIS_ZOOM.sistemas,
    },
    destaques: cartoes(destaquesNormaisComZoom()),
    setores: assuntosPorSetor().map((setor) => ({
      slug: setor.slug,
      titulo: setor.titulo,
      href: rotaDaPagina(setor.caminho),
      itens: cartoes(setor.itens),
    })),
    sistemas: SISTEMAS.map((s) => ({ sistema: s, itens: laminasNormaisDoSistema(s.id) }))
      .filter((s) => s.itens.length > 0)
      .map(({ sistema, itens }) => ({
        id: sistema.id,
        nome: sistema.nome,
        href: rotaDoSistemaComZoom(sistema.id),
        total: itens.length,
        itens: cartoes(itens.slice(0, 10)),
      })),
  }
}

export function dadosDePraticar(): DadosDePraticar {
  const { doAcervo, porTema } = quizzesDoCatalogo()
  return {
    totais: { quizzes: TOTAIS.quizzes, questoes: TOTAIS.questoes },
    quizComZoom: cartoes([quizComZoom()])[0],
    porTema: cartoes(porTema),
    doAcervo: cartoes(doAcervo),
    laboratorios: cartoes(laboratoriosDoCatalogo()),
  }
}

export function dadosDosSistemas(): DadosDosSistemas {
  const comPatologia = histopatologiaHabilitada()
  return {
    comPatologia,
    sistemas: cartoes(
      sistemasDoCatalogo().map((s) => (comPatologia ? s : { ...s, categoria: `${s.laminasNormais} lâminas normais` })),
    ),
  }
}

export function dadosDoSistemaUnificado(id: string): DadosDoSistemaUnificado | null {
  const sistema = SISTEMAS.find((s) => s.id === id)
  if (!sistema) return null

  const comPatologia = histopatologiaHabilitada()
  const normais = laminasNormaisDoSistema(sistema.id)
  const assuntos = assuntosDoSistema(sistema.id)
  const doencas = comPatologia ? doencasDoSistema(sistema.id) : []
  const laminasDoentes = comPatologia ? laminasPatologicasComZoom(sistema.id) : []
  const atlas: ItemDoCatalogo[] = comPatologia
    ? sistemasDePatologiaDe(sistema.id)
        .filter((s) => s.entradas > 0)
        .map((s) => ({
          id: `atlas:${s.id}`,
          href: rotaDoAtlasDoSistema(s.id),
          titulo: s.nome,
          categoria: 'Histopatologia · Atlas visual',
          area: 'histopatologia' as const,
          imagem: null,
          zoom: false,
          detalhe: `${s.entradas.toLocaleString('pt-BR')} capítulos visuais · ${s.midias.toLocaleString('pt-BR')} imagens`,
          icone: 'Microscope',
          cor: sistema.cor,
        }))
    : []

  if (!normais.length && !assuntos.length && !doencas.length) return null

  return {
    comPatologia,
    sistema: { id: sistema.id, nome: sistema.nome, descricao: sistema.descricao },
    imagem: normais[0]?.imagem ?? doencas.find((d) => d.imagem)?.imagem ?? null,
    normais: cartoes(normais),
    assuntos: cartoes(assuntos),
    doencas: cartoes(doencas),
    laminasDoentes: cartoes(laminasDoentes),
    atlas,
  }
}

/** A página do sistema existe? (sistema conhecido e com algum conteúdo) — para o casco decidir 404. */
export function sistemaUnificadoExiste(id: string): boolean {
  const sistema = SISTEMAS.find((s) => s.id === id)
  if (!sistema) return false
  return (
    laminasNormaisDoSistema(sistema.id).length > 0 ||
    assuntosDoSistema(sistema.id).length > 0 ||
    (histopatologiaHabilitada() && doencasDoSistema(sistema.id).length > 0)
  )
}

/** Setores na ordem do currículo — a mesma que o aluno já viu no índice. */
const ORDEM_DOS_SETORES = ['histologia-basica', 'celulas', 'tecidos', 'orgaos-e-sistemas']

function quizDaLista(quiz: ResumoDeQuiz, contexto?: string): QuizDaLista {
  return {
    slug: quiz.slug,
    titulo: quiz.titulo,
    questoes: quiz.questoes,
    comImagem: quiz.comImagem,
    autoria: quiz.autoria,
    ...(quiz.laminas != null ? { laminas: quiz.laminas } : {}),
    ...(contexto ? { contexto } : {}),
  }
}

export function dadosDosQuizzes(): DadosDosQuizzes {
  const grupos = new Map<string, ResumoDeQuiz[]>()
  for (const quiz of RESUMO_DE_QUIZZES_PROPRIOS) {
    const setor = quiz.setor ?? ''
    grupos.set(setor, [...(grupos.get(setor) ?? []), quiz])
  }
  const proprios = [...grupos.entries()]
    .sort(([a], [b]) => ORDEM_DOS_SETORES.indexOf(a) - ORDEM_DOS_SETORES.indexOf(b))
    .map(([setor, quizzes]) => ({
      setor,
      titulo: quizzes[0]?.trilha?.split(' › ')[0] ?? '',
      // A trilha sem o setor: ele já é o título do grupo, e repeti-lo em cada
      // cartão só gastaria a linha que diz onde o tema fica.
      quizzes: quizzes.map((quiz) => quizDaLista(quiz, quiz.trilha?.split(' › ').slice(1, -1).join(' › '))),
    }))

  return {
    totais: {
      questoes: TOTAIS.questoes,
      questoesProprias: TOTAIS.questoesProprias,
      quizzesProprios: TOTAIS.quizzesProprios,
      questoesDoAcervo: TOTAIS.questoesDoAcervo,
      quizzesDoAcervo: TOTAIS.quizzesDoAcervo,
    },
    proprios,
    doAcervo: RESUMO_DE_QUIZZES.map((quiz) => quizDaLista(quiz)),
  }
}

export function dadosDoAtlas(): DadosDoAtlas {
  return {
    totais: { laminas: TOTAIS.laminas, estruturas: TOTAIS.estruturas },
    coloracoes: COLORACOES.map(({ id, nome, resultado }) => ({ id, nome, resultado })),
    curriculo: CURRICULO,
  }
}

export function dadosDoLaboratorio(): DadosDoLaboratorio {
  return {
    modulos: MODULOS_DE_LABORATORIO.map(({ id, titulo, resumo, objetivos, minutos }) => ({
      id,
      titulo,
      resumo,
      objetivos,
      minutos,
    })),
  }
}

export function dadosDoModuloDoLaboratorio(id: string): DadosDoModuloDoLaboratorio | null {
  const modulo = obterModulo(id)
  if (!modulo) return null
  return {
    modulo,
    coloracoes:
      modulo.id === 'bancada-de-coloracoes'
        ? COLORACOES.map(({ id: coloracao, nome, finalidade, afinidade, resultado }) => ({
            id: coloracao,
            nome,
            finalidade,
            afinidade,
            resultado,
          }))
        : [],
  }
}

export async function dadosDoQuiz(slug: string, modo: Modo): Promise<DadosDoQuiz | null> {
  const quiz = await obterQuiz(slug)
  if (!quiz) return null
  return {
    modo,
    /*
     * No modo prova o gabarito é removido **aqui**, no servidor, antes da
     * serialização. É a diferença entre "o gabarito não aparece na tela" e "o
     * gabarito não existe na resposta" — só a segunda resiste a quem abre a
     * aba de rede.
     */
    quiz: quizParaCliente(quiz, modo),
    jsonLd: jsonLdDeQuiz(quiz),
  }
}

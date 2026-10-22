import 'server-only'

import {
  assuntosPorSetor,
  cartoes,
  destaquesNormaisComZoom,
  doencasDoCatalogo,
  doencasRecentes,
  laboratoriosDoCatalogo,
  laminasPatologicasComZoom,
  quizComZoom,
  quizzesDoCatalogo,
  sistemasDoCatalogo,
} from '@/lib/histologia/catalogo'
import { LARGURA_LAMINA, urlDaMidia, urlOtimizada } from '@/lib/histologia/midia'
import { TOTAIS, obterPagina } from '@/lib/histologia/repositorio'
import { BASE, rotaDaPagina } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { TOTAIS as TOTAIS_ZOOM } from '@/lib/histologia-zoom/repositorio'
import { TOTAIS_PATOZOOM } from '@/lib/histopatologia-zoom/repositorio'

import type { DadosDoInicio } from './inicio-tipos'

/**
 * O catálogo da home do Manual da Histologia, como dado.
 *
 * Era montado dentro da página, que por isso precisava ler a sessão e virava
 * renderização sob demanda: 300 KB de HTML saindo da função a cada visita de
 * assinante. Agora a página é um casco estático e este objeto chega por
 * `/api/manual-clinico/histologia/inicio`, que só o entrega depois do portão —
 * o catálogo continua do lado de dentro do muro, e o casco não carrega nada
 * dele.
 *
 * Os recortes são os mesmos da página antiga; ver o cabeçalho de
 * `components/histologia/catalogo/inicio.tsx` para o porquê do desenho.
 */

/** Lâmina de abertura: a primeira do currículo que tem imagem e crédito. */
const ROTA_HERO = ['histologia-basica', 'preparacao-do-tecido', 'tissue-preparation-1']

export async function dadosDoInicio(): Promise<DadosDoInicio> {
  const hero = await obterPagina(ROTA_HERO)
  // O banner é a primeira imagem que o aluno vê; é ela que define a impressão
  // de velocidade da home inteira.
  const imagemHero = urlOtimizada(hero?.base ? urlDaMidia(hero.base) : null, LARGURA_LAMINA)
  const comPatologia = histopatologiaHabilitada()

  const assuntos = assuntosPorSetor().flatMap((s) => s.itens)
  const destaques = destaquesNormaisComZoom()
  const doencas = comPatologia ? doencasDoCatalogo() : []
  const laminasPatologicas = comPatologia ? laminasPatologicasComZoom() : []
  const { doAcervo, porTema } = quizzesDoCatalogo()

  // Normal e patológico intercalados: a fileira de zoom é a prova de que zoom
  // é modalidade das duas áreas, não uma área à parte.
  const comZoom = destaques.flatMap((normal, i) => [normal, ...(laminasPatologicas[i * 3] ? [laminasPatologicas[i * 3]] : [])])

  return {
    comPatologia,
    hero: {
      href: rotaDaPagina(ROTA_HERO),
      imagem: imagemHero,
      credito: hero ? `${hero.titulo} · Acervo VCU · CC BY-NC-SA 4.0` : null,
    },
    portas: {
      histologia: {
        href: `${BASE}/normal`,
        imagem: assuntos.find((a) => a.id === 'tecidos/epitelio')?.imagem ?? assuntos[0]?.imagem ?? null,
        assuntos: assuntos.length,
        laminas: TOTAIS.laminas,
        comZoom: TOTAIS_ZOOM.laminas,
      },
      histopatologia: comPatologia
        ? {
            href: `${BASE}/histopatologia`,
            imagem: doencas.find((d) => d.imagem)?.imagem ?? null,
            doencas: doencas.length,
            comZoom: TOTAIS_PATOZOOM.laminas,
          }
        : null,
    },
    destaques: cartoes(destaques),
    assuntos: cartoes(assuntos),
    doencas: cartoes(doencas.slice(0, 18)),
    comZoom: cartoes(comZoom),
    sistemas: cartoes(sistemasDoCatalogo()),
    recentes: comPatologia ? cartoes(doencasRecentes()) : [],
    praticar: cartoes([quizComZoom(), ...porTema.slice(0, 4), ...doAcervo.slice(0, 3), ...laboratoriosDoCatalogo()]),
    totais: { quizzes: TOTAIS.quizzes, questoes: TOTAIS.questoes },
  }
}

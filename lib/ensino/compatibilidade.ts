/**
 * A ponte entre a hierarquia antiga e a taxonomia nova (§36).
 *
 * O QUE NÃO PODE ACONTECER
 *
 * Nada de apagar. O acervo já cadastrado está em cinco coleções
 * (`aulas_setores`, `aulas_topicos`, `aulas_subtopicos`, `aulas_modulos`,
 * `aulas_submodulos`) e em `aulas_postagens.setorId/topicoId/…`. Essas
 * coleções continuam existindo, as páginas antigas continuam lendo delas, e
 * este módulo NÃO escreve em nenhuma. Ele só olha e propõe.
 *
 * COMO A MIGRAÇÃO ACONTECE
 *
 * Em duas etapas, ambas reversíveis:
 *
 *  1. **Proposta** (esta função, pura): a partir das listas antigas, monta um
 *     plano — que nós criar na taxonomia nova e em qual deles cada aula entra.
 *     O admin vê o plano inteiro na tela antes de qualquer escrita.
 *  2. **Aplicação** (rota de importação): cria os nós e grava o bloco `ensino`
 *     em cada aula. Nada é removido; a aula passa a ter as DUAS localizações e
 *     responde às duas navegações.
 *
 * A COMPRESSÃO DE CINCO NÍVEIS PARA QUATRO
 *
 * A hierarquia antiga tem cinco degraus, a nova tem quatro. A regra escolhida
 * preserva as pontas — que é onde mora o significado — e junta o meio:
 *
 *     Setor      → Área          (Medicina)
 *     Tópico     → Módulo        (Ciclo Básico)
 *     Subtópico  → Tópico        (Sistema Cardiovascular)
 *     Módulo     → Tópico, se ainda livre; senão Subtópico
 *     Submódulo  → Subtópico
 *
 * A alternativa — inventar um quinto nível na taxonomia nova só para caber o
 * legado — teria trocado uma decisão de produto (§32: quatro níveis, com o
 * quarto opcional) por uma decisão de migração. O admin pode reorganizar
 * qualquer nó depois; o plano é um ponto de partida, não uma sentença.
 */

import { gerarSlug, slugUnico, type NivelDeEnsino } from '@/lib/ensino/taxonomia'
import type { LocalizacaoDaAula } from '@/lib/ensino/aula'

/* =================== COLEÇÕES =================== */

/** Um lugar só para os nomes de coleção deste subsistema. */
export const COLECOES = {
  /** Taxonomia nova: Área → Módulo → Tópico → Subtópico, tudo num documento. */
  nos: 'ensino_nos',
  trilhas: 'ensino_trilhas',
  /** Estado do aluno numa Trilha: iniciada, concluída, certificado. */
  trilhaEstado: 'ensino_trilha_estado',
  professores: 'ensino_professores',
  /** Coleções antigas — lidas, nunca reescritas por este subsistema. */
  aulas: 'aulas_postagens',
  progresso: 'aulas_progresso',
  anotacoes: 'aulas_anotacoes',
  legadoSetores: 'aulas_setores',
  legadoTopicos: 'aulas_topicos',
  legadoSubtopicos: 'aulas_subtopicos',
  legadoModulos: 'aulas_modulos',
  legadoSubmodulos: 'aulas_submodulos',
} as const

/* =================== ENTRADA =================== */

interface NoLegado {
  _id: string
  nome: string
  ordem?: number
}

export interface AcervoLegado {
  setores: NoLegado[]
  topicos: Array<NoLegado & { setorId: string }>
  subtopicos: Array<NoLegado & { setorId: string; topicoId: string }>
  modulos: Array<NoLegado & { setorId: string; topicoId?: string; subtopicoId?: string }>
  submodulos: Array<NoLegado & { moduloId: string }>
  aulas: Array<{
    _id: string
    titulo?: string
    setorId?: string
    topicoId?: string
    subtopicoId?: string
    moduloId?: string
    submoduloId?: string
    ensino?: { areaId?: string | null } | null
  }>
}

/* =================== PLANO =================== */

export interface NoPlanejado {
  /** Chave temporária dentro do plano (`legado:<id>`), resolvida na aplicação. */
  chave: string
  nivel: NivelDeEnsino
  /** Chave do pai dentro do plano. `null` para Área. */
  paiChave: string | null
  nome: string
  slug: string
  ordem: number
  /** De onde este nó veio — some da interface, serve para auditoria. */
  origem: { colecao: string; id: string }
}

export interface PlanoDeMigracao {
  nos: NoPlanejado[]
  /** aulaId → localização, com CHAVES do plano (não ids do banco ainda). */
  aulas: Array<{ aulaId: string; titulo?: string; localizacao: Record<string, string | null> }>
  /** Aulas que não têm nenhuma amarra antiga — ficam avulsas e tudo bem (§4). */
  semLocalizacao: number
  /** Aulas que JÁ têm a taxonomia nova; a migração não as toca. */
  jaMigradas: number
}

const chaveDe = (colecao: string, id: string) => `legado:${colecao}:${id}`

/**
 * Monta o plano de migração a partir do acervo antigo.
 *
 * Função pura e idempotente: rodar duas vezes com o mesmo acervo produz o mesmo
 * plano, e aulas já migradas são contadas mas nunca replanejadas — é o que
 * torna seguro executar a migração de novo depois de cadastrar mais conteúdo
 * antigo.
 */
export function planejarMigracao(acervo: AcervoLegado): PlanoDeMigracao {
  const nos: NoPlanejado[] = []
  const slugs = new Set<string>()

  const registrar = (
    colecao: string,
    no: NoLegado,
    nivel: NivelDeEnsino,
    paiChave: string | null,
  ): string => {
    const chave = chaveDe(colecao, no._id)
    const slug = slugUnico(gerarSlug(no.nome), slugs)
    slugs.add(slug)
    nos.push({
      chave,
      nivel,
      paiChave,
      nome: String(no.nome || '').trim() || 'Sem nome',
      slug,
      ordem: Number(no.ordem) || 0,
      origem: { colecao, id: no._id },
    })
    return chave
  }

  /* --- Nível 1: Setor → Área ------------------------------------------- */
  const chaveSetor = new Map<string, string>()
  for (const setor of acervo.setores) {
    chaveSetor.set(setor._id, registrar('setores', setor, 'area', null))
  }

  /* --- Nível 2: Tópico legado → Módulo ---------------------------------- */
  const chaveTopico = new Map<string, string>()
  for (const topico of acervo.topicos) {
    const pai = chaveSetor.get(topico.setorId)
    if (!pai) continue
    chaveTopico.set(topico._id, registrar('topicos', topico, 'modulo', pai))
  }

  /* --- Nível 3: Subtópico legado → Tópico ------------------------------- */
  const chaveSubtopico = new Map<string, string>()
  for (const sub of acervo.subtopicos) {
    const pai = chaveTopico.get(sub.topicoId)
    if (!pai) continue
    chaveSubtopico.set(sub._id, registrar('subtopicos', sub, 'topico', pai))
  }

  /*
   * --- Nível 4: Módulo legado → Tópico ou Subtópico ---------------------
   *
   * O módulo antigo podia pendurar em qualquer lugar: no subtópico, no tópico
   * ou direto no setor. É por isso que ele não tem um destino fixo — o nível
   * dele depende de quanto da hierarquia já foi consumido acima.
   */
  const chaveModulo = new Map<string, string>()
  const nivelDoModulo = new Map<string, NivelDeEnsino>()
  for (const modulo of acervo.modulos) {
    if (modulo.subtopicoId && chaveSubtopico.has(modulo.subtopicoId)) {
      chaveModulo.set(
        modulo._id,
        registrar('modulos', modulo, 'subtopico', chaveSubtopico.get(modulo.subtopicoId) as string),
      )
      nivelDoModulo.set(modulo._id, 'subtopico')
      continue
    }
    if (modulo.topicoId && chaveTopico.has(modulo.topicoId)) {
      chaveModulo.set(
        modulo._id,
        registrar('modulos', modulo, 'topico', chaveTopico.get(modulo.topicoId) as string),
      )
      nivelDoModulo.set(modulo._id, 'topico')
      continue
    }
    // Módulo pendurado direto no setor: o caso mais comum em curso pequeno.
    // Vira Módulo da Área — o degrau seguinte à Área na taxonomia nova.
    const paiArea = chaveSetor.get(modulo.setorId)
    if (!paiArea) continue
    chaveModulo.set(modulo._id, registrar('modulos', modulo, 'modulo', paiArea))
    nivelDoModulo.set(modulo._id, 'modulo')
  }

  /*
   * --- Nível 5: Submódulo → Subtópico -----------------------------------
   *
   * Só cabe quando o módulo pai virou Tópico. Se o módulo já desceu a
   * Subtópico, não há degrau abaixo: o submódulo é absorvido, e a aula fica no
   * subtópico do pai. Perder um agrupamento é melhor do que inventar um quinto
   * nível que a taxonomia não tem (§32) — e o admin pode recriá-lo à mão.
   */
  const chaveSubmodulo = new Map<string, string>()
  for (const sm of acervo.submodulos) {
    const paiChave = chaveModulo.get(sm.moduloId)
    if (!paiChave) continue
    if (nivelDoModulo.get(sm.moduloId) === 'topico') {
      chaveSubmodulo.set(sm._id, registrar('submodulos', sm, 'subtopico', paiChave))
    } else if (nivelDoModulo.get(sm.moduloId) === 'modulo') {
      chaveSubmodulo.set(sm._id, registrar('submodulos', sm, 'topico', paiChave))
    }
  }

  /* --- As aulas -------------------------------------------------------- */

  const nivelPorChave = new Map(nos.map((n) => [n.chave, n.nivel]))
  const paiPorChave = new Map(nos.map((n) => [n.chave, n.paiChave]))

  /** Sobe da folha até a raiz e preenche um nível de cada vez. */
  const localizacaoDe = (folha: string | undefined): Record<string, string | null> => {
    const saida: Record<string, string | null> = {
      areaId: null,
      moduloId: null,
      topicoId: null,
      subtopicoId: null,
    }
    let atual: string | null | undefined = folha
    for (let i = 0; atual && i < 8; i++) {
      const nivel = nivelPorChave.get(atual)
      if (nivel) saida[`${nivel}Id`] = atual
      atual = paiPorChave.get(atual) || null
    }
    return saida
  }

  const aulas: PlanoDeMigracao['aulas'] = []
  let semLocalizacao = 0
  let jaMigradas = 0

  for (const aula of acervo.aulas) {
    if (aula.ensino?.areaId) {
      jaMigradas += 1
      continue
    }

    // Do mais específico para o mais genérico: a aula pertence ao nível mais
    // fundo que ela declara, exatamente como a árvore antiga a desenhava.
    const folha =
      (aula.submoduloId && chaveSubmodulo.get(aula.submoduloId)) ||
      (aula.moduloId && chaveModulo.get(aula.moduloId)) ||
      (aula.subtopicoId && chaveSubtopico.get(aula.subtopicoId)) ||
      (aula.topicoId && chaveTopico.get(aula.topicoId)) ||
      (aula.setorId && chaveSetor.get(aula.setorId)) ||
      undefined

    if (!folha) {
      semLocalizacao += 1
      continue
    }

    aulas.push({ aulaId: aula._id, titulo: aula.titulo, localizacao: localizacaoDe(folha) })
  }

  return { nos, aulas, semLocalizacao, jaMigradas }
}

/**
 * Traduz a localização em chaves do plano para ids reais, depois da criação.
 *
 * Fica aqui, e não na rota, porque é a mesma tradução que os testes precisam
 * exercitar: um erro nesse mapeamento coloca a aula no nível errado de todo o
 * acervo de uma vez.
 */
export function resolverLocalizacao(
  localizacao: Record<string, string | null>,
  idPorChave: Map<string, string>,
): LocalizacaoDaAula {
  const traduzir = (chave: string | null) => (chave ? idPorChave.get(chave) || null : null)
  return {
    areaId: traduzir(localizacao.areaId),
    moduloId: traduzir(localizacao.moduloId),
    topicoId: traduzir(localizacao.topicoId),
    subtopicoId: traduzir(localizacao.subtopicoId),
  }
}

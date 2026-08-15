/**
 * Ponto de entrada da central de Exames Laboratoriais.
 *
 * Este módulo importa **todo** o conteúdo clínico — e é por isso que ele só
 * deve ser importado do servidor. As páginas da seção são componentes de
 * servidor: elas montam o HTML aqui e enviam ao navegador apenas o índice leve
 * (`indiceCompleto()`), com nome, sigla, sinônimos e uma linha de resumo por
 * item. O texto profundo, que soma centenas de kilobytes, nunca atravessa a
 * rede sem que alguém tenha aberto a ficha correspondente.
 *
 * Os componentes de cliente (busca, laboratório virtual, interpretadores)
 * importam de `./tipos`, `./busca` ou `./laboratorio-virtual`, que são leves
 * por construção.
 */

import { marcadores as adrenal } from './marcadores/adrenal'
import { marcadores as alergologia } from './marcadores/alergologia'
import { marcadores as autoimunidade } from './marcadores/autoimunidade'
import { marcadores as cardiaco } from './marcadores/cardiaco'
import { marcadores as coagulacao } from './marcadores/coagulacao'
import { marcadores as complementares } from './marcadores/complementares'
import { marcadores as diabetesAvancado } from './marcadores/diabetes-avancado'
import { marcadores as digestivo } from './marcadores/digestivo'
import { marcadores as eletrolitos } from './marcadores/eletrolitos'
import { marcadores as endocrino } from './marcadores/endocrino'
import { marcadores as ferro } from './marcadores/ferro'
import { marcadores as ferroAvancado } from './marcadores/ferro-avancado'
import { marcadores as gasometria } from './marcadores/gasometria'
import { marcadores as glicemia } from './marcadores/glicemia'
import { marcadores as hematologia } from './marcadores/hematologia'
import { marcadores as hematologiaAvancada } from './marcadores/hematologia-avancada'
import { marcadores as hemostasiaAvancada } from './marcadores/hemostasia-avancada'
import { marcadores as hepatico } from './marcadores/hepatico'
import { marcadores as hepatologiaAvancada } from './marcadores/hepatologia-avancada'
import { marcadores as hidroeletrolitico } from './marcadores/hidroeletrolitico'
import { marcadores as infectologiaAvancada } from './marcadores/infectologia-avancada'
import { marcadores as inflamatorio } from './marcadores/inflamatorio'
import { marcadores as lipidico } from './marcadores/lipidico'
import { marcadores as liquidosCorporais } from './marcadores/liquidos-corporais'
import { marcadores as muscularOsseo } from './marcadores/muscular-osseo'
import { marcadores as neurologia } from './marcadores/neurologia'
import { marcadores as oncoHematologia } from './marcadores/onco-hematologia'
import { marcadores as renal } from './marcadores/renal'
import { marcadores as renalAvancada } from './marcadores/renal-avancada'
import { marcadores as tireoideAvancada } from './marcadores/tireoide-avancada'
import { marcadores as toxicologiaFarmacos } from './marcadores/toxicologia-farmacos'
import { marcadores as tumorais } from './marcadores/tumorais'
import { marcadores as urinalise } from './marcadores/urinalise'
import { marcadores as vitaminas } from './marcadores/vitaminas'

import { COMPARACOES, COMPARACAO_POR_ID, DOENCAS, DOENCA_POR_ID } from './doencas'
import { EXAMES, EXAME_POR_ID } from './paineis'
import { PADROES, PADRAO_POR_ID } from './padroes'
import { SISTEMAS, SISTEMA_POR_ID } from './sistemas'
import {
  indiceDeAlteracoes,
  indiceDeDoencas,
  indiceDeExames,
  indiceDeMarcadores,
  indiceDePadroes,
  indiceDePerguntas,
  indiceDeSistemas,
  type ItemDoIndice,
} from './busca'
import type { GrupoId, Marcador, SistemaId } from './tipos'

export * from './tipos'
export { EXAMES, EXAME_POR_ID, TOTAL_DE_EXAMES } from './paineis'
export { SISTEMAS, SISTEMA_POR_ID } from './sistemas'
export { PADROES, PADRAO_POR_ID } from './padroes'
export { DOENCAS, DOENCA_POR_ID, COMPARACOES, COMPARACAO_POR_ID } from './doencas'
export { ALTERACOES, PERGUNTAS, buscar, normalizar } from './busca'
export type { ItemDoIndice, ResultadoBusca, TipoDeResultado } from './busca'

/* ═══════════════════════════ Catálogo ═══════════════════════════ */

export const MARCADORES: Marcador[] = [
  ...hematologia,
  ...hematologiaAvancada,
  ...ferro,
  ...ferroAvancado,
  ...renal,
  ...renalAvancada,
  ...hepatico,
  ...hepatologiaAvancada,
  ...eletrolitos,
  ...hidroeletrolitico,
  ...cardiaco,
  ...inflamatorio,
  ...lipidico,
  ...endocrino,
  ...tireoideAvancada,
  ...adrenal,
  ...muscularOsseo,
  ...glicemia,
  ...diabetesAvancado,
  ...coagulacao,
  ...hemostasiaAvancada,
  ...gasometria,
  ...urinalise,
  ...digestivo,
  ...liquidosCorporais,
  ...complementares,
  ...tumorais,
  ...alergologia,
  ...autoimunidade,
  ...oncoHematologia,
  ...infectologiaAvancada,
  ...neurologia,
  ...vitaminas,
  ...toxicologiaFarmacos,
]

export const MARCADOR_POR_ID = new Map(MARCADORES.map((m) => [m.id, m]))

export const TOTAL_DE_MARCADORES = MARCADORES.length

/** Rótulos legíveis dos grupos, para as etiquetas da interface. */
export const ROTULO_DO_GRUPO: Record<GrupoId, string> = {
  hematologia: 'Hematologia',
  ferro: 'Ferro e anemias',
  renal: 'Função renal',
  hepatico: 'Função hepática',
  eletrolitos: 'Eletrólitos e minerais',
  cardiaco: 'Marcadores cardíacos',
  inflamatorio: 'Marcadores inflamatórios',
  lipidico: 'Perfil lipídico',
  endocrino: 'Endocrinologia',
  glicemia: 'Diabetes e metabolismo',
  coagulacao: 'Coagulação',
  gasometria: 'Gasometria e ácido-base',
  urinalise: 'Urinálise',
  tumorais: 'Marcadores tumorais',
  vitaminas: 'Vitaminas e micronutrientes',
  imunologia: 'Imunologia',
  infectologia: 'Infectologia',
  digestivo: 'Digestivo e pancreático',
  autoimunidade: 'Autoimunidade',
  alergologia: 'Alergologia e imunidade inata',
  neurologia: 'Neurologia e líquor',
  muscular: 'Músculo esquelético',
  osseo: 'Metabolismo ósseo',
  'onco-hematologia': 'Onco-hematologia e gamopatias',
  liquidos: 'Líquidos corporais',
  fecal: 'Exames de fezes',
  toxicologia: 'Toxicologia e metais',
  farmacos: 'Monitorização de fármacos',
  hemostasia: 'Hemostasia avançada',
}

export function marcadorPorId(id: string): Marcador | undefined {
  return MARCADOR_POR_ID.get(id)
}

/** Resolve uma lista de ids em marcadores, ignorando os que não existem. */
export function marcadoresPorIds(ids: string[]): Marcador[] {
  return ids.map((id) => MARCADOR_POR_ID.get(id)).filter((m): m is Marcador => !!m)
}

export function marcadoresDoGrupo(grupo: GrupoId): Marcador[] {
  return MARCADORES.filter((m) => m.grupo === grupo)
}

export function marcadoresDoSistema(sistema: SistemaId): Marcador[] {
  return MARCADORES.filter((m) => m.sistemas.includes(sistema))
}

/** Grupos com pelo menos um marcador, na ordem em que a página os exibe. */
export function gruposComConteudo(): { id: GrupoId; nome: string; total: number }[] {
  const ordem: GrupoId[] = [
    'hematologia', 'hemostasia', 'coagulacao', 'ferro', 'onco-hematologia',
    'renal', 'hepatico', 'eletrolitos', 'gasometria', 'cardiaco',
    'inflamatorio', 'lipidico', 'endocrino', 'osseo', 'glicemia',
    'urinalise', 'fecal', 'digestivo', 'liquidos', 'muscular', 'neurologia',
    'imunologia', 'autoimunidade', 'alergologia', 'infectologia',
    'tumorais', 'vitaminas', 'toxicologia', 'farmacos',
  ]
  return ordem
    .map((id) => ({ id, nome: ROTULO_DO_GRUPO[id], total: marcadoresDoGrupo(id).length }))
    .filter((g) => g.total > 0)
}

/* ═══════════════════════════ Relações ═══════════════════════════ */

/** Padrões em que o marcador aparece — por declaração ou por citação. */
export function padroesDoMarcador(id: string) {
  return PADROES.filter((p) => p.achados.some((a) => a.id === id) || (MARCADOR_POR_ID.get(id)?.padroes ?? []).includes(p.id))
}

/** Doenças cujo padrão esperado inclui este marcador. */
export function doencasDoMarcador(id: string) {
  return DOENCAS.filter((d) => d.esperado.some((e) => e.id === id))
}

/** Exames (painéis) que contêm o marcador. */
export function examesDoMarcador(id: string) {
  return EXAMES.filter((e) => e.blocos.some((b) => b.marcadores.includes(id)))
}

/** Comparações relevantes ao marcador — as próprias e as que o citam. */
export function comparacoesDoMarcador(id: string) {
  const marcador = MARCADOR_POR_ID.get(id)
  const proprias = marcador?.comparacoes ?? []
  const nome = normalizarSimples(marcador?.nome ?? '')
  const externas = COMPARACOES.filter(
    (c) => !proprias.some((p) => p.id === c.id) && c.linhas.some((l) => normalizarSimples(l.marcador).includes(nome) && nome.length > 3),
  )
  return [...proprias, ...externas]
}

function normalizarSimples(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/* ═══════════════════════════ Índice de busca ═══════════════════════════ */

/**
 * O índice completo que a home envia ao componente de busca.
 *
 * Tudo o que se pode pesquisar entra aqui: marcadores, exames, padrões,
 * doenças, sistemas, alterações laboratoriais e perguntas frequentes.
 */
export function indiceCompleto(): ItemDoIndice[] {
  return [
    ...indiceDePerguntas(),
    ...indiceDeAlteracoes(),
    ...indiceDeMarcadores(MARCADORES),
    ...indiceDeExames(EXAMES),
    ...indiceDePadroes(PADROES),
    ...indiceDeDoencas(DOENCAS),
    ...indiceDeSistemas(SISTEMAS),
  ]
}

/** Números reais do acervo — usados na vitrine e no cabeçalho da seção. */
export function resumoDoAcervo() {
  const mecanismos = MARCADORES.reduce(
    (total, m) => total + (m.aumento?.mecanismos.length ?? 0) + (m.reducao?.mecanismos.length ?? 0),
    0,
  )
  const cadeias = MARCADORES.reduce(
    (total, m) =>
      total +
      (m.aumento?.mecanismos.reduce((s, mec) => s + mec.exemplos.length, 0) ?? 0) +
      (m.reducao?.mecanismos.reduce((s, mec) => s + mec.exemplos.length, 0) ?? 0),
    0,
  )
  const comparacoes = COMPARACOES.length + MARCADORES.reduce((t, m) => t + (m.comparacoes?.length ?? 0), 0)

  return {
    marcadores: MARCADORES.length,
    exames: EXAMES.length,
    sistemas: SISTEMAS.length,
    padroes: PADROES.length,
    doencas: DOENCAS.length,
    comparacoes,
    mecanismos,
    /** Cadeias causais escritas (`doença → mecanismo → alteração`). */
    cadeias,
  }
}

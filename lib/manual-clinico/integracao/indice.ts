import 'server-only'

import { getDb } from '@/lib/mongodb'

import estatico from './indice-estatico.gerado.json'
import { expandir, type ItemCompacto } from './item'
import { itensDoBanco } from './itens-do-banco'
import { prepararIndice, type IndicePreparado } from './relacionar'
import type { ItemDoManual } from './tipos'

/**
 * O índice completo do Estudo Integrado, como a rota o usa.
 *
 * Duas metades:
 * - **estática** — os manuais em código, gerados para `indice-estatico.gerado.json`
 *   (ver `fontes-estaticas.ts`). Vem pronta no bundle da função.
 * - **do banco** — as fichas do Manual Clínico e da Farmacologia, que mudam
 *   quando o admin publica. Lidas com projeção mínima, as duas coleções no
 *   mesmo `Promise.all`, e guardadas por dez minutos por instância.
 *
 * A promessa fica guardada (não só o resultado) para que requisições
 * concorrentes na mesma lambda esperem a MESMA leitura em vez de dispararem
 * uma cada uma — o mesmo arranjo das calculadoras em `app/api/busca/route.ts`.
 *
 * Vencida a validade, a instância continua servindo o índice que tem e
 * relê o banco em segundo plano (stale-while-revalidate): nenhuma requisição
 * espera a leitura, e uma falha do banco não derruba o painel.
 */

const VALIDADE_MS = 30 * 60 * 1000
const TEMPO_MAXIMO_MS = 4000

/** Refs que só existem no banco. */
const PREFIXOS_DO_BANCO = ['patologia:', 'farmaco:']

export function refDoBanco(ref: string): boolean {
  return PREFIXOS_DO_BANCO.some((p) => ref.startsWith(p))
}

let itensEstaticos: ItemDoManual[] | null = null
function estaticos(): ItemDoManual[] {
  if (!itensEstaticos) itensEstaticos = (estatico as ItemCompacto[]).map(expandir)
  return itensEstaticos
}

let indiceEstatico: IndicePreparado | null = null

/**
 * Só a metade em código, sem banco nenhum. Basta para as rotas do "Meu
 * Estudo" quando o estudo não tem ficha do Manual nem fármaco — o caso de
 * marcar como estudado ou anotar um caso de TC não precisa ler duas coleções.
 */
export function obterIndiceEstatico(): IndicePreparado {
  if (!indiceEstatico) indiceEstatico = prepararIndice(estaticos())
  return indiceEstatico
}

async function lerDoBanco(): Promise<ItemDoManual[]> {
  const db = await getDb()
  const [patologias, medicamentos] = await Promise.all([
    db
      .collection('patologias')
      .find({})
      .project({
        nome: 1,
        slug: 1,
        sinonimos: 1,
        sistema: 1,
        cid10: 1,
        'farmacologia.primeira_linha.medicamento': 1,
        'farmacologia.segunda_linha.medicamento': 1,
        'farmacologia.terceira_linha.medicamento': 1,
      })
      .maxTimeMS(TEMPO_MAXIMO_MS)
      .toArray(),
    db
      .collection('medicamentos')
      .find({})
      .project({ nome: 1, slug: 1, sinonimos: 1, classe_principal: 1, subclasse: 1 })
      .maxTimeMS(TEMPO_MAXIMO_MS)
      .toArray(),
  ])
  return itensDoBanco(patologias, medicamentos)
}

async function montar(): Promise<IndicePreparado> {
  const doBanco = await lerDoBanco()
  return prepararIndice(descartarLigacoesQuebradas([...estaticos(), ...doBanco]))
}

/**
 * O acervo cita fichas por slug (um sinal aponta "insuficiencia-cardiaca").
 * Se a ficha foi renomeada ou ainda não existe, a ligação some aqui em vez de
 * virar um link para página inexistente.
 */
function descartarLigacoesQuebradas(itens: ItemDoManual[]): ItemDoManual[] {
  const refs = new Set(itens.map((i) => i.ref))
  return itens.map((item) => {
    if (!item.ligados) return item
    const validos = item.ligados.filter((r) => refs.has(r))
    if (validos.length === item.ligados.length) return item
    const { ligados: _descartado, ...resto } = item
    return validos.length > 0 ? { ...resto, ligados: validos } : resto
  })
}

let pronto: { em: number; indice: IndicePreparado } | null = null
let emAndamento: Promise<IndicePreparado> | null = null

function recarregar(): Promise<IndicePreparado> {
  if (!emAndamento) {
    emAndamento = montar()
      .then((indice) => {
        pronto = { em: Date.now(), indice }
        return indice
      })
      .finally(() => {
        emAndamento = null
      })
  }
  return emAndamento
}

/** O índice completo: os manuais em código e as fichas do banco. */
export function obterIndice(): Promise<IndicePreparado> {
  if (!pronto) return recarregar()
  if (Date.now() - pronto.em > VALIDADE_MS) {
    // Serve o que tem e atualiza por trás; uma falha mantém o índice antigo.
    recarregar().catch((erro) => console.error('Falha ao atualizar o índice do Estudo Integrado:', erro))
  }
  return Promise.resolve(pronto.indice)
}

/** O menor índice que resolve estas refs: só vai ao banco se alguma morar lá. */
export function obterIndicePara(refs: Iterable<string>): Promise<IndicePreparado> {
  for (const ref of refs) if (refDoBanco(ref)) return obterIndice()
  return Promise.resolve(obterIndiceEstatico())
}

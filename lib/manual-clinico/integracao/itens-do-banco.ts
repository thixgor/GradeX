import { chaveDeBusca } from '@/lib/busca-plataforma/texto'

import { montarItem, unicos } from './item'
import type { ItemDoManual, Natureza } from './tipos'
import { ORGAOS_DO_SISTEMA, orgaosDoTexto } from './vocabulario'

/**
 * As fichas que moram no Mongo — patologias do Manual Clínico e fármacos —
 * traduzidas para o índice.
 *
 * Puro (recebe os documentos já lidos) para ser testável sem banco.
 *
 * A ficha da patologia já diz quais fármacos são de primeira, segunda e
 * terceira linha. É a ligação mais valiosa do acervo inteiro — ela leva do
 * caso de TC ao tratamento — e estava escrita só como texto. Aqui o texto vira
 * ligação: "Losartana 50 mg/dia" encontra a ficha "Losartana" pelo nome, e o
 * vínculo vale nos dois sentidos (da doença ao fármaco e do fármaco às doenças
 * em que ele é escolha).
 */

type Documento = Record<string, unknown>

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : ''
}

function textos(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : []
}

const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]*$/

/** Os nomes de fármaco citados nas linhas de tratamento da ficha. */
function farmacosCitados(doc: Documento): string[] {
  const farmacologia = doc.farmacologia as Record<string, unknown> | undefined
  if (!farmacologia) return []
  const nomes: string[] = []
  for (const linha of ['primeira_linha', 'segunda_linha', 'terceira_linha']) {
    const lista = farmacologia[linha]
    if (!Array.isArray(lista)) continue
    for (const f of lista) {
      const nome = texto((f as Documento | null)?.medicamento)
      if (nome) nomes.push(nome)
    }
  }
  return nomes
}

/**
 * Encontra a ficha do fármaco a partir do que o autor da patologia escreveu.
 * Tenta a frase inteira e vai encurtando palavra por palavra: "Losartana
 * potássica 50 mg" → "losartana potassica" → "losartana".
 */
function resolverFarmaco(citado: string, porNome: Map<string, string>): string | undefined {
  const palavras = chaveDeBusca(citado).split(' ').filter(Boolean)
  for (let n = Math.min(palavras.length, 4); n >= 1; n--) {
    const ref = porNome.get(palavras.slice(0, n).join(' '))
    if (ref) return ref
  }
  return undefined
}

const NATUREZA_DO_SISTEMA: Record<string, Natureza> = {
  'Oncologia Geral': 'neoplasia',
  'Doenças Infecciosas e Parasitárias': 'inflamatoria',
}

export function itensDoBanco(patologias: Documento[], medicamentos: Documento[]): ItemDoManual[] {
  const farmacos = medicamentos.filter((m) => SLUG_VALIDO.test(texto(m.slug)) && texto(m.nome))
  const porNome = new Map<string, string>()
  for (const m of farmacos) {
    const ref = `farmaco:${texto(m.slug)}`
    for (const nome of [texto(m.nome), ...textos(m.sinonimos)]) {
      const chave = chaveDeBusca(nome)
      // Nome curto demais casaria por acaso ("ac", "b12").
      if (chave.length >= 4 && !porNome.has(chave)) porNome.set(chave, ref)
    }
  }

  const usadoEm = new Map<string, string[]>()
  const itens: ItemDoManual[] = []

  for (const p of patologias) {
    const slug = texto(p.slug)
    const nome = texto(p.nome)
    if (!SLUG_VALIDO.test(slug) || !nome) continue
    const ref = `patologia:${slug}`
    const sistema = texto(p.sistema)

    const doTratamento = unicos(
      farmacosCitados(p)
        .map((citado) => resolverFarmaco(citado, porNome))
        .filter((r): r is string => Boolean(r)),
    )
    for (const f of doTratamento) usadoEm.set(f, [...(usadoEm.get(f) ?? []), ref])

    const nomes = [nome, ...textos(p.sinonimos)]
    const orgaos = orgaosDoTexto(...nomes)
    itens.push(
      montarItem({
        ref,
        modulo: 'manual',
        tipo: 'Ficha do Manual Clínico',
        titulo: nome,
        subtitulo: [texto(p.cid10), sistema].filter(Boolean).join(' · ') || undefined,
        href: `/manual-clinico/${slug}`,
        etapa: 'clinica',
        nomes,
        orgaosDefinidos: orgaos.length > 0 ? orgaos : ORGAOS_DO_SISTEMA[sistema] ?? [],
        naturezasExtras: NATUREZA_DO_SISTEMA[sistema] ? [NATUREZA_DO_SISTEMA[sistema]] : [],
        ligados: doTratamento,
      }),
    )
  }

  for (const m of farmacos) {
    const ref = `farmaco:${texto(m.slug)}`
    itens.push(
      montarItem({
        ref,
        modulo: 'farmacologia',
        tipo: 'Fármaco',
        titulo: texto(m.nome),
        subtitulo: [texto(m.classe_principal), texto(m.subclasse)].filter(Boolean).join(' › ') || undefined,
        href: `/manual-clinico/farmacologia/${texto(m.slug)}`,
        etapa: 'conduta',
        nomes: [texto(m.nome), ...textos(m.sinonimos)],
        // O fármaco não tem órgão pelo nome: quem o liga às doenças são as
        // fichas que o prescrevem.
        orgaosDefinidos: [],
        ligados: usadoEm.get(ref) ?? [],
      }),
    )
  }

  return itens
}

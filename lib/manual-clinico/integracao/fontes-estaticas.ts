import { COLECAO_TC } from '@/lib/radiologia/casos-tc'
import { COLECAO_RX } from '@/lib/radiologia/casos-rx'
import { CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x'
import { SINAIS } from '@/lib/semiologia/sinais'
import { VISTAS } from '@/lib/semiologia/vistas'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { ROTAS as ROTAS_SEMIOLOGIA } from '@/lib/semiologia/rotas'
import { ORGAOS as ORGAOS_HISTOLOGIA, laminasDoOrgao } from '@/lib/histologia-zoom/repositorio'
import { rotaDoOrgao } from '@/lib/histologia-zoom/rotas'
import { DOENCAS_RESUMIDAS } from '@/lib/histopatologia/repositorio'
import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { doencasPublicadas } from '@/lib/histopatologia-zoom/repositorio'
import { rotaDaDoencaZoom } from '@/lib/histopatologia-zoom/rotas'
import {
  ALTERACOES,
  DOENCAS as DOENCAS_LAB,
  MARCADORES,
  MARCADOR_POR_ID,
  PADROES,
  indiceCompleto,
  type SistemaId,
} from '@/lib/exames-laboratoriais'
import { ECG_CATALOG } from '@/lib/ecg/catalog'
import { carregarTodas } from '@/lib/ferramentas-clinicas'
import type { CenaClinica } from '@/lib/semiologia/esquemas'

import { montarItem, unicos } from './item'
import type { ItemDoManual } from './tipos'
import { orgaosDoTexto } from './vocabulario'

/**
 * O índice dos manuais que vivem em código — tudo menos o que mora no Mongo.
 *
 * Cada bloco abaixo lê o acervo do módulo como ele já é e o traduz para
 * `ItemDoManual`. Nada é reescrito nos módulos: se um caso de TC novo entra
 * amanhã, ele aparece aqui na próxima geração do índice sem ninguém lembrar
 * de vir a este arquivo.
 *
 * Quem chama é o gerador (`__tests__/manual-clinico/integracao/indice-gerado.test.ts`),
 * e o resultado vai para `indice-estatico.gerado.json`. A rota de conexões lê
 * só o JSON magro — importar este arquivo numa função arrastaria para a memória
 * os megabytes de casos, laudos e lâminas que o índice nem usa.
 */

/* ───────────────────────────── Radiologia ───────────────────────────── */

function radiologia(): ItemDoManual[] {
  const itens: ItemDoManual[] = []

  for (const caso of COLECAO_TC.casos) {
    itens.push(montarItem({
      ref: `tc:${caso.slug}`,
      modulo: 'radiologia',
      tipo: 'Caso de TC',
      titulo: caso.titulo,
      subtitulo: caso.resumo,
      href: `/manual-clinico/radiologia/tomografia/casos/${caso.slug}`,
      etapa: 'imagem',
      nomes: [caso.titulo],
      contexto: caso.resumo,
    }))
  }

  for (const caso of COLECAO_RX.casos) {
    itens.push(montarItem({
      ref: `rxa:${caso.slug}`,
      modulo: 'radiologia',
      tipo: 'Caso de Raio-X',
      titulo: caso.titulo,
      subtitulo: caso.resumo,
      href: `/manual-clinico/radiologia/raio-x/casos-com-apontamentos/${caso.slug}`,
      etapa: 'imagem',
      nomes: [caso.titulo],
      contexto: caso.resumo,
    }))
  }

  for (const caso of CASOS_RAIO_X) {
    itens.push(montarItem({
      ref: `rx:${caso.slug}`,
      modulo: 'radiologia',
      tipo: 'Caso de Raio-X',
      titulo: caso.titulo,
      subtitulo: caso.resumo,
      href: `/manual-clinico/radiologia/raio-x/casos/${caso.slug}`,
      etapa: 'imagem',
      nomes: [caso.titulo],
      contexto: `${caso.categoriaTitulo} ${caso.resumo}`,
    }))
  }

  return itens
}

/* ───────────────────────────── Semiologia ───────────────────────────── */

function ligadosDaCena(cena: CenaClinica): string[] {
  return cena.patologia ? [`patologia:${cena.patologia}`] : []
}

function semiologia(): ItemDoManual[] {
  const itens: ItemDoManual[] = []

  for (const sinal of SINAIS) {
    itens.push(montarItem({
      ref: `sinal:${sinal.slug}`,
      modulo: 'semiologia',
      tipo: 'Sinal do exame físico',
      titulo: sinal.nome,
      subtitulo: sinal.resumo,
      href: ROTAS_SEMIOLOGIA.sinal(sinal.slug),
      etapa: 'exame-fisico',
      nomes: [sinal.nome, ...sinal.sinonimos],
      contexto: sinal.resumo,
      ligados: (sinal.patologias ?? []).map((slug) => `patologia:${slug}`),
    }))
  }

  for (const vista of VISTAS) {
    itens.push(montarItem({
      ref: `vista:${vista.slug}`,
      modulo: 'semiologia',
      tipo: 'Exame à beira do leito',
      titulo: vista.nome,
      subtitulo: vista.resumo,
      href: ROTAS_SEMIOLOGIA.vista(vista.slug),
      etapa: 'exame-fisico',
      nomes: [vista.nome],
      contexto: vista.resumo,
      referencia: true,
    }))
    const orgaosDaVista = orgaosDoTexto(vista.nome)
    for (const cena of vista.cenas) {
      if (cena.estado !== 'alterado') continue
      itens.push(montarItem({
        ref: `cena:${vista.slug}/${cena.id}`,
        modulo: 'semiologia',
        tipo: `Cena · ${vista.nome}`,
        titulo: cena.titulo,
        subtitulo: cena.diagnostico,
        href: ROTAS_SEMIOLOGIA.cena(vista.slug, cena.id),
        etapa: 'exame-fisico',
        nomes: [cena.titulo, cena.diagnostico],
        orgaosExtras: orgaosDaVista,
        ligados: ligadosDaCena(cena),
      }))
    }
  }

  for (const janela of JANELAS_ULTRASSOM) {
    itens.push(montarItem({
      ref: `us:${janela.slug}`,
      modulo: 'semiologia',
      tipo: 'Janela de ultrassom',
      titulo: janela.nome,
      subtitulo: janela.pergunta,
      href: ROTAS_SEMIOLOGIA.janela(janela.slug),
      etapa: 'imagem',
      nomes: [janela.nome],
      contexto: `${janela.pergunta} ${janela.estruturas.map((e) => e.nome).join(' ')}`,
      referencia: true,
    }))
    const orgaosDaJanela = orgaosDoTexto(janela.nome)
    for (const cena of janela.cenas) {
      if (cena.estado !== 'alterado') continue
      itens.push(montarItem({
        ref: `uscena:${janela.slug}/${cena.id}`,
        modulo: 'semiologia',
        tipo: `Ultrassom · ${janela.nome}`,
        titulo: cena.titulo,
        subtitulo: cena.diagnostico,
        href: `${ROTAS_SEMIOLOGIA.janela(janela.slug)}?cena=${encodeURIComponent(cena.id)}`,
        etapa: 'imagem',
        nomes: [cena.titulo, cena.diagnostico],
        orgaosExtras: orgaosDaJanela,
        ligados: ligadosDaCena(cena),
      }))
    }
  }

  return itens
}

/* ─────────────────────── Histologia e Histopatologia ─────────────────────── */

function histologia(): ItemDoManual[] {
  return ORGAOS_HISTOLOGIA.filter((orgao) => laminasDoOrgao(orgao.id).length > 0).map((orgao) =>
    montarItem({
      ref: `orgao:${orgao.id}`,
      modulo: 'histologia',
      tipo: 'Histologia normal',
      titulo: orgao.nome,
      subtitulo: `${laminasDoOrgao(orgao.id).length} lâmina(s) no microscópio virtual`,
      href: rotaDoOrgao(orgao.sistema, orgao.id),
      etapa: 'base',
      nomes: [orgao.nome, ...orgao.sinonimos],
      // Os sinônimos da Histologia são de microscopia ("glomérulo cerebelar",
      // "células caliciformes"): servem à busca, mas para o órgão só o nome
      // e o identificador dizem a verdade.
      orgaosDefinidos: orgaosDoTexto(orgao.nome, orgao.id.replace(/-/g, ' ')),
      referencia: true,
    }),
  )
}

function histopatologia(): ItemDoManual[] {
  const itens: ItemDoManual[] = []

  for (const doenca of DOENCAS_RESUMIDAS) {
    itens.push(montarItem({
      ref: `histopato:${doenca.slug}`,
      modulo: 'histopatologia',
      tipo: 'Doença (Histopatologia)',
      titulo: doenca.nome,
      subtitulo: doenca.definicaoCurta,
      href: rotaDaDoenca(doenca.slug),
      etapa: 'patologia',
      nomes: [doenca.nome],
      orgaosExtras: orgaosDoTexto(...doenca.orgaos),
      naturezasExtras: doenca.natureza.startsWith('neoplasica') ? ['neoplasia'] : [],
    }))
  }

  for (const doenca of doencasPublicadas()) {
    itens.push(montarItem({
      ref: `patozoom:${doenca.id}`,
      modulo: 'histopatologia',
      tipo: 'Lâmina patológica',
      titulo: doenca.nome,
      subtitulo: doenca.resumo,
      href: rotaDaDoencaZoom(doenca.id),
      etapa: 'patologia',
      nomes: [doenca.nome, ...doenca.sinonimos],
      orgaosExtras: orgaosDoTexto(doenca.orgao.replace(/-/g, ' ')),
      ligados: doenca.doencaDoManual ? [`histopato:${doenca.doencaDoManual}`] : [],
    }))
  }

  return itens
}

/* ───────────────────────────── Exames ───────────────────────────── */

/** Só os sistemas que praticamente são um órgão viram órgão. */
const ORGAOS_DO_SISTEMA_LAB: Partial<Record<SistemaId, string[]>> = {
  renal: ['rim'],
  hepatobiliar: ['figado'],
  cardiovascular: ['coracao'],
  hematologico: ['sangue'],
  respiratorio: ['pulmao'],
}

function orgaosDosSistemas(sistemas: SistemaId[]): string[] {
  return unicos(sistemas.flatMap((s) => ORGAOS_DO_SISTEMA_LAB[s] ?? []))
}

function exames(): ItemDoManual[] {
  const hrefs = new Map(indiceCompleto().map((i) => [`${i.tipo}:${i.id}`, i.href]))
  const href = (tipo: string, id: string) =>
    hrefs.get(`${tipo}:${id}`) ?? '/manual-clinico/exames-laboratoriais'
  const itens: ItemDoManual[] = []

  for (const m of MARCADORES) {
    itens.push(montarItem({
      ref: `lab-marcador:${m.id}`,
      modulo: 'exames',
      tipo: 'Marcador',
      titulo: m.sigla && !m.nome.includes(m.sigla) ? `${m.nome} (${m.sigla})` : m.nome,
      subtitulo: m.resumo,
      href: href('marcador', m.id),
      etapa: 'laboratorio',
      nomes: [m.nome, m.sigla ?? '', ...(m.sinonimos ?? [])],
      orgaosExtras: orgaosDosSistemas(m.sistemas),
      referencia: true,
    }))
  }

  for (const a of ALTERACOES) {
    const marcador = MARCADOR_POR_ID.get(a.marcador)
    itens.push(montarItem({
      ref: `lab-alteracao:${a.id}`,
      modulo: 'exames',
      tipo: 'Alteração laboratorial',
      titulo: a.termo.charAt(0).toUpperCase() + a.termo.slice(1),
      subtitulo: a.descricao,
      href: href('alteracao', a.id),
      etapa: 'laboratorio',
      nomes: [a.termo, ...(a.sinonimos ?? [])],
      orgaosExtras: marcador ? orgaosDosSistemas(marcador.sistemas) : [],
      referencia: true,
    }))
  }

  for (const p of PADROES) {
    itens.push(montarItem({
      ref: `lab-padrao:${p.id}`,
      modulo: 'exames',
      tipo: 'Padrão laboratorial',
      titulo: p.nome,
      subtitulo: p.assinatura,
      href: href('padrao', p.id),
      etapa: 'laboratorio',
      nomes: [p.nome],
      orgaosExtras: orgaosDosSistemas(p.sistemas),
    }))
  }

  for (const d of DOENCAS_LAB) {
    itens.push(montarItem({
      ref: `lab-doenca:${d.id}`,
      modulo: 'exames',
      tipo: 'Doença e padrão esperado',
      titulo: d.nome,
      subtitulo: d.fisiopatologia,
      href: href('doenca', d.id),
      etapa: 'laboratorio',
      nomes: [d.nome, ...(d.sinonimos ?? [])],
      orgaosExtras: orgaosDosSistemas(d.sistemas),
    }))
  }

  return itens
}

/* ───────────────────────── Eletro e Ferramentas ───────────────────────── */

function eletrocardiograma(): ItemDoManual[] {
  return ECG_CATALOG.map((entrada) =>
    montarItem({
      ref: `ecg:${entrada.id}`,
      modulo: 'eletrocardiograma',
      tipo: 'Traçado de ECG',
      titulo: entrada.nome,
      subtitulo: entrada.clinical.resumo,
      href: '/manual-clinico/eletrocardiograma',
      etapa: 'clinica',
      nomes: [entrada.nome, ...entrada.tags],
      orgaosExtras: ['coracao'],
    }),
  )
}

async function ferramentas(): Promise<ItemDoManual[]> {
  const todas = await carregarTodas()
  return todas.map((f) =>
    montarItem({
      ref: `calc:${f.id}`,
      modulo: 'ferramentas',
      tipo: 'Calculadora',
      titulo: f.nome,
      subtitulo: f.resumo,
      href: `/manual-clinico/ferramentas/${f.categorias[0]}/${f.id}`,
      etapa: 'conduta',
      nomes: [f.nome, f.sigla ?? '', ...(f.sinonimos ?? [])],
    }),
  )
}

/* ───────────────────────────── Montagem ───────────────────────────── */

export async function montarIndiceEstatico(): Promise<ItemDoManual[]> {
  const itens = [
    ...histologia(),
    ...semiologia(),
    ...exames(),
    ...radiologia(),
    ...histopatologia(),
    ...eletrocardiograma(),
    ...(await ferramentas()),
  ]
  // Ordem estável: o JSON gerado só muda quando o acervo muda.
  return itens.sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0))
}

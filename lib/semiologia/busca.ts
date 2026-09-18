import { COMPARADORES } from './comparadores'
import { SINAIS } from './sinais'
import { JANELAS_ULTRASSOM } from './ultrassom'
import { VISTAS } from './vistas'
import { TITULOS_DE_INSTRUMENTO, TITULOS_DE_SISTEMA, type CenaClinica } from './esquemas'
import { midiasDaCena, midiasDoSinal } from './acervo'
import { urlDaMidia, type MidiaClinica, miniaturaDaMidia } from './midia'
import { ROTAS } from './rotas'
import type { EntradaDeBusca } from './busca-motor'

/**
 * O índice de busca — montado no servidor, servido como JSON.
 *
 * Cada entrada é magra de propósito: título, sinônimos, uma linha de contexto
 * e um corpo curto (resumo ou diagnóstico + diferencial). Nada de mecanismo,
 * conduta ou roteiro: isso é ficha, não índice. Com ~600 entradas o JSON fica
 * em dezenas de KB, cabe num único GET cacheado e o motor (`busca-motor.ts`)
 * pontua tudo no cliente em menos de um quadro.
 *
 * A miniatura é a URL final do caso real, resolvida aqui porque `urlDaMidia`
 * lê o ambiente (espelho ou origem) e o cliente não deve saber disso.
 */
function miniatura(midias: MidiaClinica[]): string | undefined {
  const ordem = { imagem: 0, video: 1, clipe: 2, audio: 3 }
  const fotos = [...midias].sort((a, b) => ordem[a.tipo] - ordem[b.tipo])
  for (const m of fotos) {
    if (m.tipo === 'audio') continue
    const url = m.tipo === 'video' ? miniaturaDaMidia(m) : urlDaMidia(m)
    if (url) return url
  }
  return undefined
}

function entradaDeCena(
  tipo: 'cena' | 'cena-ultrassom',
  janelaSlug: string,
  janelaNome: string,
  cena: CenaClinica,
  href: string,
): EntradaDeBusca {
  const midias = midiasDaCena(janelaSlug, cena)
  return {
    tipo,
    id: `${janelaSlug}/${cena.id}`,
    titulo: cena.titulo,
    sinonimos: [],
    contexto: cena.diagnostico,
    corpo: [cena.achado.replace(/\*\*/g, ''), ...cena.diferencial].join(' ').slice(0, 400),
    href,
    capa: miniatura(midias),
    grupo: janelaNome,
    temCasoReal: midias.length > 0,
  }
}

export function montarIndiceDeBusca(): EntradaDeBusca[] {
  const indice: EntradaDeBusca[] = []

  for (const sinal of SINAIS) {
    const midias = midiasDoSinal(sinal)
    indice.push({
      tipo: 'sinal',
      id: sinal.slug,
      titulo: sinal.nome,
      sinonimos: sinal.sinonimos,
      contexto: TITULOS_DE_SISTEMA[sinal.sistema],
      corpo: [sinal.resumo.replace(/\*\*/g, ''), ...sinal.causas.flatMap((c) => c.itens)].join(' ').slice(0, 500),
      href: ROTAS.sinal(sinal.slug),
      capa: miniatura(midias),
      grupo: TITULOS_DE_SISTEMA[sinal.sistema],
      temCasoReal: midias.length > 0,
    })
  }

  for (const vista of VISTAS) {
    indice.push({
      tipo: 'vista',
      id: vista.slug,
      titulo: vista.nome,
      sinonimos: [TITULOS_DE_INSTRUMENTO[vista.instrumento]],
      contexto: vista.resumo,
      corpo: vista.paraQue.slice(0, 300),
      href: ROTAS.vista(vista.slug),
      capa: miniatura(midiasDaCena(vista.slug, vista.cenas.find((c) => c.estado === 'normal') ?? vista.cenas[0])),
      grupo: 'Imagem à beira do leito',
      temCasoReal: vista.cenas.some((c) => midiasDaCena(vista.slug, c).length > 0),
    })
    for (const cena of vista.cenas) {
      if (cena.estado === 'normal') continue
      indice.push(entradaDeCena('cena', vista.slug, vista.nome, cena, ROTAS.cena(vista.slug, cena.id)))
    }
  }

  for (const janela of JANELAS_ULTRASSOM) {
    indice.push({
      tipo: 'janela',
      id: janela.slug,
      titulo: janela.nome,
      sinonimos: [janela.protocolo],
      contexto: janela.pergunta,
      corpo: janela.posicao.slice(0, 300),
      href: ROTAS.janela(janela.slug),
      capa: miniatura(midiasDaCena(janela.slug, janela.cenas.find((c) => c.estado === 'normal') ?? janela.cenas[0])),
      grupo: 'Ultrassom à beira do leito',
      temCasoReal: janela.cenas.some((c) => midiasDaCena(janela.slug, c).length > 0),
    })
    for (const cena of janela.cenas) {
      if (cena.estado === 'normal') continue
      indice.push(entradaDeCena('cena-ultrassom', janela.slug, janela.nome, cena, `${ROTAS.janela(janela.slug)}?cena=${cena.id}`))
    }
  }

  for (const comparador of COMPARADORES) {
    indice.push({
      tipo: 'comparador',
      id: comparador.slug,
      titulo: comparador.titulo,
      sinonimos: [],
      contexto: comparador.pergunta,
      corpo: comparador.colunas.map((c) => c.titulo).join(' '),
      href: ROTAS.comparador(comparador.slug),
      grupo: 'Comparadores',
      temCasoReal: false,
    })
  }

  return indice
}

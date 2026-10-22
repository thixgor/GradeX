import 'server-only'

import {
  cartoes,
  doencasDoCatalogo,
  doencasRecentes,
  rotaDoSistemaUnificado,
  type ItemDoCatalogo,
} from '@/lib/histologia/catalogo'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { TOTAIS_PATOZOOM } from '@/lib/histopatologia-zoom/repositorio'

import { MECANISMOS_PUBLICADOS, SISTEMAS_COM_CONTAGEM, TOTAIS } from './repositorio'
import { rotaDoSistema } from './rotas'
import { TOTAL_ENTRADAS_WEBPATH_UTAH } from './webpath-utah/catalogo'
import type { DadosDaHistopatologia } from './inicio-tipos'

/**
 * A home da Histopatologia, como dado — o que a página montava no servidor,
 * agora entregue por `/api/manual-clinico/histologia/histopatologia` depois do
 * portão. A página virou casco estático; ver
 * `components/histopatologia/inicio.tsx` para o desenho.
 */
export function dadosDaHistopatologia(): DadosDaHistopatologia {
  const doencas = doencasDoCatalogo()
  const comZoom = doencas.filter((d) => d.zoom)
  const capitulos = doencas.filter((d) => d.temCapitulo)
  const porSistema = SISTEMAS.map((s) => ({
    id: s.id,
    nome: s.nome,
    href: rotaDoSistemaUnificado(s.id),
    itens: cartoes(doencas.filter((d) => d.sistema === s.id)),
  })).filter((s) => s.itens.length > 0)
  const atlasPorSistema: ItemDoCatalogo[] = SISTEMAS_COM_CONTAGEM.filter((s) => s.entradas > 0).map((s) => ({
    id: `atlas:${s.id}`,
    href: rotaDoSistema(s.id),
    titulo: s.nome,
    categoria: 'Histopatologia · Atlas visual',
    area: 'histopatologia',
    imagem: null,
    zoom: false,
    detalhe: `${s.entradas.toLocaleString('pt-BR')} capítulos visuais · ${s.midias.toLocaleString('pt-BR')} imagens`,
    icone: 'Microscope',
    cor: '#B03A5B',
  }))

  return {
    imagem: comZoom[0]?.imagem ?? null,
    totais: {
      doencas: doencas.length,
      laminasComZoom: TOTAIS_PATOZOOM.laminas,
      marcacoes: TOTAIS_PATOZOOM.marcacoes,
      itensDeAtlas: TOTAIS.capitulosVisuais + TOTAL_ENTRADAS_WEBPATH_UTAH,
      mecanismos: TOTAIS.mecanismos,
    },
    comZoom: cartoes(comZoom),
    recentes: cartoes(doencasRecentes()),
    capitulos: cartoes(capitulos),
    porSistema,
    atlasPorSistema,
    mecanismos: MECANISMOS_PUBLICADOS.slice(0, 14).map((m) => ({ id: m.id, nome: m.nome })),
  }
}

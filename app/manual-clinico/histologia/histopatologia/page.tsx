import Link from 'next/link'
import { Library, ScanSearch } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { BuscaDaHistopatologia } from '@/components/histopatologia/busca'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import {
  doencasDoCatalogo,
  doencasRecentes,
  rotaDoSistemaUnificado,
  type ItemDoCatalogo,
} from '@/lib/histologia/catalogo'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { MECANISMOS_PUBLICADOS, SISTEMAS_COM_CONTAGEM, TOTAIS } from '@/lib/histopatologia/repositorio'
import { rotaDoAtlas, rotaDosCreditos, rotaDosMecanismos, rotaDoSistema } from '@/lib/histopatologia/rotas'
import { TOTAL_ENTRADAS_WEBPATH_UTAH } from '@/lib/histopatologia/webpath-utah/catalogo'
import { RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import { BASE_PATOZOOM } from '@/lib/histopatologia-zoom/rotas'
import { TOTAIS_PATOZOOM } from '@/lib/histopatologia-zoom/repositorio'

/**
 * Área **Histopatologia** — a doença na lâmina.
 *
 * ## Uma doença, uma entrada
 *
 * A área tinha duas casas para a mesma doença: o capítulo escrito
 * (`/doencas/…`) e a "Histopatologia com Zoom" (`/zoom/…`), anunciadas como
 * abas diferentes. O aluno que procurava "apendicite" tinha de adivinhar em
 * qual das duas olhar. Agora cada doença é um cartão só (ver
 * `doencasDoCatalogo`): o selo **Zoom** diz que ela tem lâmina inteira, e a
 * página de destino reúne capítulo e lâminas.
 *
 * ## O que continua aqui
 *
 * A busca da patologia (com a ponte `?q=` vinda da busca da Histologia), os
 * mecanismos gerais, o atlas visual por sistema e os créditos. A home **não**
 * carrega inventário nem índice de servidor — só os resumos leves.
 */

export const dynamic = 'force-dynamic'

interface Props {
  /**
   * `?q=` é a ponte vinda da busca do Manual da Histologia normal: o aluno
   * digitou um nome de doença num índice que só tem tecido normal, não achou, e
   * chega aqui com o termo já buscado em vez de um campo vazio.
   */
  searchParams: { q?: string }
}

export default async function HomeDaHistopatologia({ searchParams }: Props) {
  await exigirAcessoAHistologia()

  const doencas = doencasDoCatalogo()
  const comZoom = doencas.filter((d) => d.zoom)
  const capitulos = doencas.filter((d) => d.temCapitulo)
  const porSistema = SISTEMAS.map((s) => ({ sistema: s, itens: doencas.filter((d) => d.sistema === s.id) })).filter(
    (s) => s.itens.length > 0,
  )
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

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />}>
        <BannerDoCatalogo
          compacto
          sobretitulo="Área · tecido doente"
          titulo="Histopatologia"
          texto="Reconhecer doença na lâmina é entender qual agressão produziu aquela forma. Cada doença traz o achado, o mecanismo e o normal ao lado."
          imagem={comZoom[0]?.imagem}
          acoes={
            <>
              <AcaoPrincipal href="#doencas">
                <ScanSearch className="h-4 w-4" aria-hidden /> Doenças com lâmina
              </AcaoPrincipal>
              <AcaoSecundaria href={rotaDoAtlas()}>
                <Library className="h-4 w-4" aria-hidden /> Atlas de imagens
              </AcaoSecundaria>
            </>
          }
        >
          <div className="mt-6 max-w-2xl">
            {/* Recorte defensivo: o termo vem da URL, é entrada não confiável
                e só alimenta o campo de busca — nunca uma rota. */}
            <BuscaDaHistopatologia termoInicial={(searchParams.q ?? '').slice(0, 80)} />
          </div>
          <ul className="mt-5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-white/80">
            <li className="rounded-full bg-black/35 px-2.5 py-1 ring-1 ring-white/10">{doencas.length} doenças</li>
            <li className="rounded-full bg-black/35 px-2.5 py-1 ring-1 ring-white/10">
              {TOTAIS_PATOZOOM.laminas} lâminas com zoom · {TOTAIS_PATOZOOM.marcacoes} marcações
            </li>
            <li className="rounded-full bg-black/35 px-2.5 py-1 ring-1 ring-white/10">
              {(TOTAIS.capitulosVisuais + TOTAL_ENTRADAS_WEBPATH_UTAH).toLocaleString('pt-BR')} itens de atlas
            </li>
            <li className="rounded-full bg-black/35 px-2.5 py-1 ring-1 ring-white/10">
              {TOTAIS.mecanismos} mecanismos gerais
            </li>
          </ul>
        </BannerDoCatalogo>

        <div className="mx-auto max-w-[1600px]">
          <div id="doencas" className="scroll-mt-4">
            <FileiraDoCatalogo
              id="doencas-zoom"
              titulo="Doenças com lâmina de zoom"
              subtitulo="Das mais comuns e cobradas para as mais raras."
              verTudo={{ href: BASE_PATOZOOM }}
            >
              <CartoesDaFileira itens={comZoom} mostrarArea={false} prioridade />
            </FileiraDoCatalogo>
          </div>

          <div id="recentes" className="scroll-mt-4">
            <FileiraDoCatalogo id="recentes-fileira" titulo="Adicionados recentemente">
              <CartoesDaFileira itens={doencasRecentes()} mostrarArea={false} />
            </FileiraDoCatalogo>
          </div>

          <div id="capitulos" className="scroll-mt-4">
            <FileiraDoCatalogo
              id="capitulos-fileira"
              titulo="Capítulos aprofundados"
              subtitulo="Mecanismo, roteiro microscópico, correlação clínica e comparação com o normal."
            >
              <CartoesDaFileira itens={capitulos} mostrarArea={false} />
            </FileiraDoCatalogo>
          </div>

          <h2 className="mt-14 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8763A] md:px-10">
            Doenças por sistema
          </h2>
          {porSistema.map(({ sistema, itens }) => (
            <FileiraDoCatalogo
              key={sistema.id}
              id={`sistema-${sistema.id}`}
              titulo={sistema.nome}
              subtitulo={`${itens.length} ${itens.length === 1 ? 'doença' : 'doenças'}`}
              verTudo={{ href: rotaDoSistemaUnificado(sistema.id), rotulo: 'Ver o sistema' }}
            >
              <CartoesDaFileira itens={itens} mostrarArea={false} />
            </FileiraDoCatalogo>
          ))}

          <FileiraDoCatalogo
            id="atlas"
            titulo="Atlas visual por sistema"
            subtitulo="Coleções de imagens por doença, controle, técnica e caso — FCM/Unicamp, Histopathology Atlas e WebPath/Utah."
            verTudo={{ href: rotaDoAtlas() }}
          >
            <CartoesDaFileira itens={atlasPorSistema} mostrarArea={false} />
          </FileiraDoCatalogo>

          <section aria-labelledby="mecanismos" className="mt-12 px-4 md:px-10">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="mecanismos" className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Por mecanismo
                </h2>
                <p className="mt-0.5 text-xs text-white/55 sm:text-sm">
                  O mesmo processo em órgãos diferentes — é assim que o raciocínio se transfere.
                </p>
              </div>
              <Link
                href={rotaDosMecanismos()}
                className="inline-flex min-h-[36px] shrink-0 items-center rounded-md px-2 text-xs font-bold text-[#E8763A] hover:bg-white/5"
              >
                Ver os {TOTAIS.mecanismos}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {MECANISMOS_PUBLICADOS.slice(0, 14).map((mecanismo) => (
                <li key={mecanismo.id}>
                  <Link
                    href={`${rotaDosMecanismos()}/${mecanismo.id}`}
                    className="inline-flex min-h-[40px] items-center rounded-full bg-white/[0.06] px-4 text-sm font-semibold text-white/85 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:ring-[#E8763A]/60"
                  >
                    {mecanismo.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="mx-auto mt-14 max-w-[1600px] space-y-2 border-t border-white/10 px-4 pt-6 text-xs leading-relaxed text-white/50 md:px-10">
          <p>{RODAPE_LEEDS}</p>
          <Link href={rotaDosCreditos()} className="font-bold underline transition-colors hover:text-white">
            Créditos e fontes das lâminas
          </Link>
        </footer>
      </SuperficieDoCatalogo>
    </AppShell>
  )
}

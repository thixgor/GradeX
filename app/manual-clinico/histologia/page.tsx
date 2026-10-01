import { ArrowRight, Play, ScanSearch } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { ContinuarEstudando } from '@/components/histologia/catalogo/continuar'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { PortasDasAreas } from '@/components/histologia/catalogo/portas'
import { BuscaDaHistologia } from '@/components/histologia/busca'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { VitrineDaHistologia } from '@/components/histologia/vitrine'
import { verificarAcessoAHistologia } from '@/lib/histologia/acesso'
import {
  assuntosPorSetor,
  destaquesNormaisComZoom,
  doencasDoCatalogo,
  doencasRecentes,
  laboratoriosDoCatalogo,
  laminasPatologicasComZoom,
  quizComZoom,
  quizzesDoCatalogo,
  sistemasDoCatalogo,
} from '@/lib/histologia/catalogo'
import { AVISO_EDUCACIONAL, CREDITO_BASE } from '@/lib/histologia/licenca'
import { LARGURA_LAMINA, urlDaMidia, urlOtimizada } from '@/lib/histologia/midia'
import { TOTAIS, obterPagina } from '@/lib/histologia/repositorio'
import { BASE, rotaDaPagina } from '@/lib/histologia/seo'
import { montarVitrine } from '@/lib/histologia/vitrine'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { TOTAIS as TOTAIS_ZOOM } from '@/lib/histologia-zoom/repositorio'
import { TOTAIS_PATOZOOM } from '@/lib/histopatologia-zoom/repositorio'

/**
 * Home do Manual da Histologia — o catálogo.
 *
 * ## Por que a home virou um catálogo
 *
 * A home anterior somava seis seções de natureza diferente (fluxo em passos,
 * setores, vitrine do zoom, portas da patologia, quizzes, laboratório), e a
 * barra do módulo tinha oito abas. O relato foi direto: "a pessoa não sabe
 * onde clicar — Histopatologia, Zoom, Histopatologia com Zoom".
 *
 * O desenho agora é o de um serviço de streaming, porque é um formato que o
 * aluno já sabe usar sem instrução:
 *
 * 1. **banner** — onde estou e qual é o primeiro clique;
 * 2. **duas portas** — Histologia (normal) e Histopatologia (doença). São as
 *    únicas categorias de conteúdo do módulo;
 * 3. **fileiras** — recortes do acervo, cada uma com título que diz o que é e
 *    "Ver tudo" que leva à listagem completa.
 *
 * Zoom deixou de ser categoria: é o selo **Zoom** nos cartões das lâminas que
 * abrem no visualizador de lâmina inteira, em qualquer fileira. A fileira
 * "Lâminas com zoom interativo" mistura normal e patológico de propósito —
 * mostra que zoom é forma de ver, e que as duas áreas o têm.
 *
 * ## O que não mudou
 *
 * - Sem acesso, a mesma URL serve a vitrine de vendas (ADR 0003), e a barra do
 *   módulo só é montada no ramo de quem tem acesso (`naHome`).
 * - Quando o ambiente mantém a Histopatologia fechada
 *   (`histopatologiaHabilitada()`), nenhuma porta, fileira ou aba dela aparece:
 *   anunciar uma área que responde 404 é pior do que não anunciá-la.
 * - Os números vêm dos totais reais dos acervos, nunca de constantes.
 * - Os créditos do acervo continuam no rodapé (licença CC BY-NC-SA).
 */

/**
 * A home lê a sessão — é ela que decide entre o módulo e a vitrine — então não
 * há o que pré-renderizar.
 */
export const dynamic = 'force-dynamic'

/** Lâmina de abertura: a primeira do currículo que tem imagem e crédito. */
const ROTA_HERO = ['histologia-basica', 'preparacao-do-tecido', 'tissue-preparation-1']

export default async function HomeDaHistologia() {
  // Primeira linha, antes de tocar no repositório: sem acesso, o que esta rota
  // serve é a landing de vendas — na mesma URL, para o link continuar valendo e
  // o buscador ter o que indexar.
  const acesso = await verificarAcessoAHistologia()
  if (!acesso.liberado) {
    const dados = await montarVitrine()
    return (
      // `guestNotice` desligado: o aviso flutuante do shell fala de catálogo e
      // download, fora de contexto aqui, e cobre a barra de compra no celular.
      // A landing já explica, no lugar certo, o que está trancado e como abrir.
      <AppShell allowGuest showHeader={false} guestNotice={false}>
        <VitrineDaHistologia
          acesso={{
            autenticado: acesso.autenticado,
            motivo:
              acesso.motivo === 'indisponivel'
                ? 'indisponivel'
                : acesso.autenticado
                  ? 'locked'
                  : 'guest',
            produto: acesso.produto
              ? {
                  label: acesso.produto.label,
                  ctaText: acesso.produto.ctaText,
                  isActive: acesso.produto.isActive,
                  currentPrice: acesso.produto.currentPrice,
                  price: acesso.produto.price,
                  hasActivePromotion: acesso.produto.hasActivePromotion,
                  pricingEventId: acesso.produto.pricingEventId ?? null,
                  plans: acesso.produto.plans.map((plano) => ({
                    key: plano.key,
                    label: plano.label,
                    durationMonths: plano.durationMonths,
                    price: plano.price,
                    enabled: plano.enabled,
                    pricingEventId: plano.pricingEventId,
                  })),
                }
              : null,
          }}
          dados={dados}
        />
      </AppShell>
    )
  }

  const hero = await obterPagina(ROTA_HERO)
  // O banner é a primeira imagem que o aluno vê; é ela que define a impressão
  // de velocidade da home inteira.
  const urlHero = urlOtimizada(hero?.base ? urlDaMidia(hero.base) : null, LARGURA_LAMINA)
  const comPatologia = histopatologiaHabilitada()

  const setores = assuntosPorSetor()
  const assuntos = setores.flatMap((s) => s.itens)
  const destaques = destaquesNormaisComZoom()
  const doencas = comPatologia ? doencasDoCatalogo() : []
  const laminasPatologicas = comPatologia ? laminasPatologicasComZoom() : []
  const { doAcervo, porTema } = quizzesDoCatalogo()

  // Normal e patológico intercalados: a fileira de zoom é a prova de que zoom
  // é modalidade das duas áreas, não uma área à parte.
  const comZoom = destaques.flatMap((normal, i) => [normal, ...(laminasPatologicas[i * 3] ? [laminasPatologicas[i * 3]] : [])])

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SuperficieDoCatalogo
        navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} naHome />}
      >
        <BannerDoCatalogo
          sobretitulo="Manual Clínico · Atlas de histologia"
          titulo="Manual da Histologia"
          texto="Lâminas reais num microscópio virtual. Escolha a área, abra uma lâmina e acenda as estruturas até saber achá-las sozinho."
          imagem={urlHero}
          creditoDaImagem={hero ? `${hero.titulo} · Acervo VCU · CC BY-NC-SA 4.0` : undefined}
          acoes={
            <>
              <AcaoPrincipal href={rotaDaPagina(ROTA_HERO)}>
                <Play className="h-4 w-4 fill-current" aria-hidden /> Começar a estudar
              </AcaoPrincipal>
              <AcaoSecundaria href={`${BASE}/normal`}>
                Explorar o catálogo <ArrowRight className="h-4 w-4" aria-hidden />
              </AcaoSecundaria>
            </>
          }
        >
          {/* Busca instantânea: o atalho de quem já sabe o nome do que procura. */}
          <div className="mt-6 max-w-xl">
            <BuscaDaHistologia pontePatologica={comPatologia} />
          </div>
        </BannerDoCatalogo>

        <PortasDasAreas
          histologia={{
            href: `${BASE}/normal`,
            imagem: assuntos.find((a) => a.id === 'tecidos/epitelio')?.imagem ?? assuntos[0]?.imagem ?? null,
            assuntos: assuntos.length,
            laminas: TOTAIS.laminas,
            comZoom: TOTAIS_ZOOM.laminas,
          }}
          histopatologia={
            comPatologia
              ? {
                  href: `${BASE}/histopatologia`,
                  imagem: doencas.find((d) => d.imagem)?.imagem ?? null,
                  doencas: doencas.length,
                  comZoom: TOTAIS_PATOZOOM.laminas,
                }
              : null
          }
        />

        <div className="mx-auto mt-2 max-w-[1600px]">
          <ContinuarEstudando />

          <FileiraDoCatalogo
            id="histologia-zoom"
            titulo="Histologia · lâminas inteiras com zoom"
            subtitulo="Do panorama à célula, no visualizador de lâmina inteira."
            verTudo={{ href: `${BASE}/normal` }}
          >
            <CartoesDaFileira itens={destaques} mostrarArea={false} prioridade />
          </FileiraDoCatalogo>

          <FileiraDoCatalogo
            id="histologia-assuntos"
            titulo="Histologia · atlas por assunto"
            subtitulo="Fotomicrografias com as estruturas marcadas, na ordem do curso."
            verTudo={{ href: `${BASE}/normal#assuntos` }}
          >
            <CartoesDaFileira itens={assuntos} mostrarArea={false} />
          </FileiraDoCatalogo>

          {comPatologia && (
            <FileiraDoCatalogo
              id="histopatologia-doencas"
              titulo="Histopatologia · doenças"
              subtitulo="Cada doença é uma entrada só: o capítulo e as lâminas com zoom ficam juntos."
              verTudo={{ href: `${BASE}/histopatologia` }}
            >
              <CartoesDaFileira itens={doencas.slice(0, 18)} mostrarArea={false} />
            </FileiraDoCatalogo>
          )}

          <FileiraDoCatalogo
            id="com-zoom"
            titulo={
              <span className="inline-flex items-center gap-2">
                <ScanSearch className="h-5 w-5 text-[#E8763A]" aria-hidden /> Lâminas com zoom interativo
              </span>
            }
            subtitulo="O selo Zoom marca a lâmina inteira, com zoom contínuo — nas duas áreas."
          >
            <CartoesDaFileira itens={comZoom} />
          </FileiraDoCatalogo>

          <FileiraDoCatalogo
            id="sistemas"
            titulo="Explore por sistemas"
            subtitulo="O mesmo órgão saudável e doente, numa página só."
            verTudo={{ href: `${BASE}/sistemas` }}
            formato="retrato"
          >
            <CartoesDaFileira itens={sistemasDoCatalogo()} formato="retrato" mostrarArea={false} />
          </FileiraDoCatalogo>

          {comPatologia && (
            <FileiraDoCatalogo
              id="recentes"
              titulo="Adicionados recentemente"
              subtitulo="As doenças que acabaram de chegar ao acervo com zoom."
              verTudo={{ href: `${BASE}/histopatologia#recentes` }}
            >
              <CartoesDaFileira itens={doencasRecentes()} mostrarArea={false} />
            </FileiraDoCatalogo>
          )}

          <FileiraDoCatalogo
            id="praticar"
            titulo="Praticar"
            subtitulo={`${TOTAIS.quizzes} quizzes, ${TOTAIS.questoes} questões e o laboratório virtual.`}
            verTudo={{ href: `${BASE}/praticar` }}
          >
            <CartoesDaFileira
              itens={[quizComZoom(), ...porTema.slice(0, 4), ...doAcervo.slice(0, 3), ...laboratoriosDoCatalogo()]}
              mostrarArea={false}
            />
          </FileiraDoCatalogo>
        </div>

        <footer className="mx-auto mt-14 max-w-[1600px] border-t border-white/10 px-4 pt-6 md:px-10">
          <p className="text-xs leading-relaxed text-white/50">{CREDITO_BASE}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            {AVISO_EDUCACIONAL} Créditos específicos, proveniência e hash de cada imagem ficam a um clique, no
            rodapé de cada lâmina.
          </p>
        </footer>
      </SuperficieDoCatalogo>
    </AppShell>
  )
}

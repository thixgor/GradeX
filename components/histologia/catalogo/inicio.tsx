'use client'

import { ArrowRight, Play, ScanSearch } from 'lucide-react'

import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { ContinuarEstudando } from '@/components/histologia/catalogo/continuar'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { PortasDasAreas } from '@/components/histologia/catalogo/portas'
import { BuscaDaHistologia } from '@/components/histologia/busca'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import type { DadosDoInicio } from '@/lib/histologia/inicio-tipos'
import { AVISO_EDUCACIONAL, CREDITO_BASE } from '@/lib/histologia/licenca'
import { BASE } from '@/lib/histologia/rotas'

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
 * - Quando o ambiente mantém a Histopatologia fechada (`comPatologia`), nenhuma
 *   porta, fileira ou aba dela aparece: anunciar uma área que responde 404 é
 *   pior do que não anunciá-la.
 * - Os números vêm dos totais reais dos acervos, nunca de constantes.
 * - Os créditos do acervo continuam no rodapé (licença CC BY-NC-SA).
 *
 * ## De onde vêm os dados
 *
 * De `/api/manual-clinico/histologia/inicio`, montados por
 * `lib/histologia/inicio.ts` depois do portão. Este arquivo não importa nada do
 * acervo: o que ele importa vai para o JavaScript público do site.
 */
export function CatalogoDaHistologia({ dados }: { dados: DadosDoInicio }) {
  const { comPatologia } = dados

  return (
    <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} naHome />}>
      <BannerDoCatalogo
        sobretitulo="Manual Clínico · Atlas de histologia"
        titulo="Manual da Histologia"
        texto="Lâminas reais num microscópio virtual. Escolha a área, abra uma lâmina e acenda as estruturas até saber achá-las sozinho."
        imagem={dados.hero.imagem}
        creditoDaImagem={dados.hero.credito ?? undefined}
        acoes={
          <>
            <AcaoPrincipal href={dados.hero.href}>
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

      <PortasDasAreas histologia={dados.portas.histologia} histopatologia={dados.portas.histopatologia} />

      <div className="mx-auto mt-2 max-w-[1600px]">
        <ContinuarEstudando />

        <FileiraDoCatalogo
          id="histologia-zoom"
          titulo="Histologia · lâminas inteiras com zoom"
          subtitulo="Do panorama à célula, no visualizador de lâmina inteira."
          verTudo={{ href: `${BASE}/normal` }}
        >
          <CartoesDaFileira itens={dados.destaques} mostrarArea={false} prioridade />
        </FileiraDoCatalogo>

        <FileiraDoCatalogo
          id="histologia-assuntos"
          titulo="Histologia · atlas por assunto"
          subtitulo="Fotomicrografias com as estruturas marcadas, na ordem do curso."
          verTudo={{ href: `${BASE}/normal#assuntos` }}
        >
          <CartoesDaFileira itens={dados.assuntos} mostrarArea={false} />
        </FileiraDoCatalogo>

        {comPatologia && (
          <FileiraDoCatalogo
            id="histopatologia-doencas"
            titulo="Histopatologia · doenças"
            subtitulo="Cada doença é uma entrada só: o capítulo e as lâminas com zoom ficam juntos."
            verTudo={{ href: `${BASE}/histopatologia` }}
          >
            <CartoesDaFileira itens={dados.doencas} mostrarArea={false} />
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
          <CartoesDaFileira itens={dados.comZoom} />
        </FileiraDoCatalogo>

        <FileiraDoCatalogo
          id="sistemas"
          titulo="Explore por sistemas"
          subtitulo="O mesmo órgão saudável e doente, numa página só."
          verTudo={{ href: `${BASE}/sistemas` }}
          formato="retrato"
        >
          <CartoesDaFileira itens={dados.sistemas} formato="retrato" mostrarArea={false} />
        </FileiraDoCatalogo>

        {comPatologia && (
          <FileiraDoCatalogo
            id="recentes"
            titulo="Adicionados recentemente"
            subtitulo="As doenças que acabaram de chegar ao acervo com zoom."
            verTudo={{ href: `${BASE}/histopatologia#recentes` }}
          >
            <CartoesDaFileira itens={dados.recentes} mostrarArea={false} />
          </FileiraDoCatalogo>
        )}

        <FileiraDoCatalogo
          id="praticar"
          titulo="Praticar"
          subtitulo={`${dados.totais.quizzes} quizzes, ${dados.totais.questoes} questões e o laboratório virtual.`}
          verTudo={{ href: `${BASE}/praticar` }}
        >
          <CartoesDaFileira itens={dados.praticar} mostrarArea={false} />
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
  )
}

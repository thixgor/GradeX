import type { Metadata } from 'next'
import { CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { Cena, Chip } from '@/components/vitrine/cena'
import {
  FragmentoCatalogo,
  FragmentoDesempenho,
  FragmentoFiltros,
  FragmentoSaldo,
} from '@/components/vitrine/fragmentos'
import { CatalogoAoVivo, QuestaoAoVivo, TrocaDeTelas } from '@/components/vitrine/fragmentos-vivos'
import {
  CabecalhoDeSecao,
  CartaoBento,
  ChamadaFinal,
  FaixaInfinita,
  Heroi,
  Secao,
} from '@/components/vitrine/secoes'
import { acervoArredondado } from '@/lib/banco/acervo-publico'
import { LIMITE_GRATUITO } from '@/lib/banco/gratuito'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'
import { acervoDoBancoArredondado, catalogoPublicoDoBanco } from '@/lib/vitrines/dados'
import { DESEMPENHO_DE_EXEMPLO, FILTROS_DE_EXEMPLO, SALDO_DE_EXEMPLO } from '@/lib/vitrines/exemplos'

const DESCRICAO =
  'As questões das provas da faculdade, separadas por módulo, tópico e semestre, cada uma com o comentário. Crie a conta grátis e escolha as 10 questões que quer abrir.'

export const metadata: Metadata = {
  title: 'Banco de Questões',
  description: DESCRICAO,
  alternates: { canonical: '/banco-questoes' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Banco de Questões | DomineAqui',
    description: DESCRICAO,
    url: '/banco-questoes',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui - Banco de Questões' }],
  },
}

/* Estática, regenerada a cada 6 h — o catálogo muda quando o admin importa. */
export const revalidate = 21600

/**
 * `/banco-questoes` para quem chega SEM conta — o middleware reescreve para
 * cá, e a barra continua mostrando `/banco-questoes`.
 *
 * O catálogo mostrado (no topo, na faixa e no explorador) é exatamente o que
 * a conta gratuita vê na tela do Banco — módulos, tópicos e contagens,
 * enunciado nenhum —, sem os nós ocultos ou restritos a cargo. Ver
 * `catalogoPublicoDoBanco`. O que é exemplo mora em lib/vitrines/exemplos.ts.
 */
export default async function VitrineDoBanco() {
  const [acervo, modulos] = await Promise.all([acervoDoBancoArredondado(), catalogoPublicoDoBanco()])
  const conta = enderecosDeConta('/banco-questoes')
  const mil = acervoArredondado(acervo) / 1000
  const topicos = modulos.flatMap((m) => m.topicos.map((t) => ({ ...t, modulo: m.nome })))

  return (
    <CascoDaVitrine destino="/banco-questoes">
      <Heroi
        pilula={
          <span className="vidro pilula">
            <span className="ponto-vivo" /> {LIMITE_GRATUITO} questões grátis, você escolhe
          </span>
        }
        titulo="O banco de questões da sua próxima prova"
        destaque={['próxima', 'prova']}
        apoio={
          <p>
            As questões das provas da faculdade, separadas por módulo, tópico e semestre, cada uma com o comentário.
            Você escolhe o assunto, responde e entende o erro.
          </p>
        }
        acoes={{
          principal: { href: conta.criar, rotulo: 'Criar conta grátis' },
          secundaria: { href: '/amostra', rotulo: 'Ver a amostra' },
        }}
        numeros={[
          ...(mil > 0 ? [{ ate: mil, prefixo: '+', sufixo: ' mil', rotulo: 'questões comentadas' }] : []),
          { ate: LIMITE_GRATUITO, rotulo: 'questões grátis na conta' },
        ]}
        cena={
          <Cena
            arte={{ src: '/landing/hero-front.png', largura: 1024, altura: 1024 }}
            figura={
              modulos.length > 0 ? (
                <TrocaDeTelas telas={modulos.slice(0, 3).map((m) => <FragmentoCatalogo key={m.id} modulo={m} />)} />
              ) : (
                <FragmentoDesempenho linhas={DESEMPENHO_DE_EXEMPLO} />
              )
            }
            chips={[
              <Chip key="comentario" vivo>
                Comentário em cada questão
              </Chip>,
              <Chip key="saldo">3 de {LIMITE_GRATUITO} abertas</Chip>,
              <Chip key="acertou">✓ Você acertou</Chip>,
            ]}
          />
        }
      />

      <FaixaInfinita
        rotulo="Tópicos do catálogo"
        itens={topicos.map((t) => (
          <span key={t.id} className="flex items-center gap-3">
            <span className="font-semibold">{t.nome}</span>
            <span className="num text-[var(--papel-fraco)]">
              {t.modulo} · {t.total.toLocaleString('pt-BR')} questões
            </span>
          </span>
        ))}
      />

      {modulos.length > 0 && (
        <Secao id="catalogo">
          <CabecalhoDeSecao
            id="catalogo"
            pilula="O catálogo à vista"
            titulo={
              <>
                Escolha o módulo, <span className="texto-brilho">veja o que tem</span>
              </>
            }
            texto="Antes de qualquer clique você sabe quantas questões cada tópico tem. Troque de módulo aqui embaixo: é o catálogo de verdade."
          />
          <div className="mx-auto mt-14 max-w-4xl">
            <CatalogoAoVivo modulos={modulos} />
          </div>
        </Secao>
      )}

      <Secao id="como-funciona">
        <CabecalhoDeSecao
          id="como-funciona"
          pilula="Da escolha ao ponto fraco"
          titulo={
            <>
              Responda, entenda, <span className="texto-brilho">repita</span>
            </>
          }
          texto="Marque uma alternativa na questão abaixo para ver o comentário abrir."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <CartaoBento
            className="lg:col-span-7 lg:row-span-2"
            titulo="O porquê de cada resposta"
            texto="Respondeu, viu na hora se acertou e leu o comentário: por que a certa é certa e por que as outras não servem."
          >
            <QuestaoAoVivo modo="comentario" />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={1}
            titulo="Só o assunto da sua prova"
            texto="Módulo, tópico, subtópico e semestre. Os filtros ficam à vista enquanto você rola a lista."
          >
            <FragmentoFiltros {...FILTROS_DE_EXEMPLO} />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={2}
            titulo={`${LIMITE_GRATUITO} grátis, para sempre`}
            texto={`Na conta gratuita você escolhe ${LIMITE_GRATUITO} questões para abrir, com o comentário. Nenhuma é sorteada, e elas não voltam a fechar.`}
          >
            <FragmentoSaldo abertas={SALDO_DE_EXEMPLO} limite={LIMITE_GRATUITO} />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-12"
            titulo="Onde você mais erra"
            texto="O painel de desempenho mostra o acerto tópico por tópico, ali mesmo na tela do banco."
          >
            <div className="mx-auto max-w-2xl">
              <FragmentoDesempenho linhas={DESEMPENHO_DE_EXEMPLO} />
            </div>
          </CartaoBento>
        </div>
      </Secao>

      <ChamadaFinal
        titulo={
          <>
            Abra as primeiras <span className="texto-brilho">questões hoje</span>
          </>
        }
        texto={`A conta é grátis: escolha ${LIMITE_GRATUITO} questões para abrir, com o comentário. Depois de entrar, você volta direto para o banco.`}
        criar={conta.criar}
        entrar={conta.entrar}
      />
    </CascoDaVitrine>
  )
}

import type { Metadata } from 'next'
import { CoverImage } from '@/components/cover-image'
import { CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { Cena, Chip } from '@/components/vitrine/cena'
import {
  FragmentoDistribuicao,
  FragmentoEntradaDaProva,
  FragmentoPortoes,
  duracaoPorExtenso,
} from '@/components/vitrine/fragmentos'
import { QuestaoAoVivo } from '@/components/vitrine/fragmentos-vivos'
import { CabecalhoDeSecao, CartaoBento, ChamadaFinal, Heroi, Secao } from '@/components/vitrine/secoes'
import { normalizeCoverSrc } from '@/lib/cover-image-src'
import { absoluteUrl, privateNoIndexRobots } from '@/lib/seo'
import { provaPublica } from '@/lib/vitrines/dados'
import { MARCOS_DE_EXEMPLO, TURMA_DE_EXEMPLO } from '@/lib/vitrines/exemplos'

type Props = { params: Promise<{ id: string }> }

/*
 * Uma página por prova, gerada na primeira visita e servida do CDN dali em
 * diante; a cada 10 min no máximo ela é refeita, para a capa ou o nome trocados
 * pelo admin chegarem sem deploy.
 */
export function generateStaticParams() {
  return []
}
export const revalidate = 600

/**
 * O link da prova colado no grupo da turma vira um cartão com a capa e o nome
 * — é a primeira coisa que alguém sem conta vê dela.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const prova = await provaPublica(id)
  const titulo = prova ? prova.titulo : 'Prova na DomineAqui'
  const descricao = 'Você quer fazer essa prova? Entre na sua conta, ou crie uma grátis, e comece.'
  const capa = prova?.capa ? normalizeCoverSrc(prova.capa) : null
  const imagem = capa ? (capa.startsWith('/') ? absoluteUrl(capa) : capa) : null

  return {
    title: titulo,
    description: descricao,
    // O endereço da prova muda de dono e de data; não é página de buscador.
    robots: privateNoIndexRobots,
    alternates: { canonical: `/exam/${id}` },
    openGraph: {
      title: `${titulo} | DomineAqui`,
      description: descricao,
      url: `/exam/${id}`,
      siteName: 'DomineAqui',
      type: 'website',
      locale: 'pt_BR',
      ...(imagem ? { images: [{ url: imagem, alt: `Capa da prova ${titulo}` }] } : {}),
    },
  }
}

/**
 * "N1 SOI I - 2026.2" quebrava no meio do código ("N1 SOI" / "I - 2026.2").
 * O nome antes do traço vira um bloco só (espaços duros), o travessão fica
 * preso ao fim dele, e a única quebra possível cai antes do semestre.
 */
function tituloParaExibir(titulo: string): string {
  const partes = /^(.*?)\s+[-–]\s+(.*)$/.exec(titulo)
  if (!partes) return titulo
  return `${partes[1].replace(/ /g, '\u00a0')}\u00a0– ${partes[2]}`
}

/**
 * `/exam/[id]` para quem chega SEM conta.
 *
 * O middleware reescreve para cá; a barra continua mostrando o endereço da
 * prova. O topo mostra o nome e a capa de verdade — a capa em destaque, com o
 * brilho dela mesma desfocado atrás —, a pergunta "Você quer fazer essa
 * prova?" e as duas portas. Depois do login a pessoa volta para a prova.
 *
 * Prova pessoal, oculta ou em grupo oculto não tem nome nem capa aqui (ver
 * `provaPublica`): a página fala de "uma prova" sem dizer qual, e não confirma
 * nem que ela existe. Quem decide o acesso continua sendo a API.
 */
export default async function VitrineDaProva({ params }: Props) {
  const { id } = await params
  const prova = await provaPublica(id)
  const conta = enderecosDeConta(`/exam/${id}`)

  const titulo = prova?.titulo ?? 'Uma prova espera por você'
  const fatos = [
    prova?.questoes ? `${prova.questoes} questões` : null,
    prova?.duracao ? duracaoPorExtenso(prova.duracao) : null,
    prova?.treino ? 'Prova de treino' : null,
  ].filter(Boolean) as string[]

  return (
    <CascoDaVitrine destino={`/exam/${id}`}>
      <Heroi
        tituloMenor={titulo.length > 22}
        pilula={
          <span className="vidro pilula">
            <span className="ponto-vivo" /> {fatos.length > 0 ? fatos.join(' · ') : 'Prova na DomineAqui'}
          </span>
        }
        titulo={tituloParaExibir(titulo)}
        apoio={
          <>
            <p className="titulo-secao text-[30px] text-[var(--papel)] md:text-[34px]">Você quer fazer essa prova?</p>
            <p className="mt-3">
              Entre na sua conta, se já tem uma. Se ainda não tem, crie a sua: é grátis, e depois de entrar você volta
              direto para esta prova.
            </p>
          </>
        }
        acoes={{
          principal: { href: conta.entrar, rotulo: 'Entrar e fazer a prova' },
          secundaria: { href: conta.criar, rotulo: 'Criar conta grátis' },
        }}
        cena={
          <Cena
            fundo={
              prova?.capa ? (
                // O brilho da própria capa, desfocado atrás do cartão.
                <div aria-hidden className="absolute inset-[8%] overflow-hidden rounded-[40px] opacity-60 blur-3xl">
                  <CoverImage src={prova.capa} alt="" sizes="200px" />
                </div>
              ) : (
                <div aria-hidden className="absolute inset-[12%] rounded-full bg-[#468152]/30 blur-3xl" />
              )
            }
            arte={prova?.capa ? null : { src: '/landing/provas-3d.png', largura: 1536, altura: 1024 }}
            figura={
              <FragmentoEntradaDaProva
                prioridade
                rotulo={prova?.treino ? 'Prova de treino' : 'Prova geral'}
                prova={{
                  titulo,
                  capa: prova?.capa ?? null,
                  questoes: prova?.questoes ?? null,
                  duracao: prova?.duracao ?? null,
                }}
              />
            }
            chips={[
              ...(prova?.questoes ? [<Chip key="q" vivo>{prova.questoes} questões</Chip>] : []),
              ...(prova?.duracao ? [<Chip key="d">⏱ {duracaoPorExtenso(prova.duracao)}</Chip>] : []),
              <Chip key="g">✓ Gabarito comentado no fim</Chip>,
            ]}
          />
        }
      />

      <Secao id="como-funciona">
        <CabecalhoDeSecao
          id="como-funciona"
          pilula="Como funciona"
          titulo={
            <>
              O que acontece <span className="texto-brilho">nessa prova</span>
            </>
          }
          texto="Mexa na questão aqui embaixo: é a mesma tela da prova."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <CartaoBento
            className="lg:col-span-7 lg:row-span-2"
            titulo="Com a prova aberta"
            texto="O cronômetro corre pelo relógio do servidor e cada resposta é gravada na hora. Se a internet cair, você continua da mesma questão."
          >
            <QuestaoAoVivo modo="prova" />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={1}
            titulo="Antes de começar"
            texto="Você entra pela sala de espera e confere os seus dados. Se a prova tiver portões, os horários ficam à vista."
          >
            <FragmentoPortoes marcos={MARCOS_DE_EXEMPLO} atual={0} />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={2}
            titulo="Quando termina"
            texto="Sai o gabarito comentado e a distribuição das notas da turma, sem nomes."
          >
            <FragmentoDistribuicao {...TURMA_DE_EXEMPLO} />
          </CartaoBento>
        </div>
      </Secao>

      <ChamadaFinal
        titulo={
          <>
            Entre e <span className="texto-brilho">comece</span>
          </>
        }
        texto="A conta é grátis. Depois de entrar, você volta direto para esta prova."
        criar={conta.criar}
        entrar={conta.entrar}
        rotuloEntrar="Entrar e fazer a prova"
      />
    </CascoDaVitrine>
  )
}

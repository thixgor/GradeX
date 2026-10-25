import type { Metadata } from 'next'
import { CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { Cena, Chip } from '@/components/vitrine/cena'
import {
  FragmentoDistribuicao,
  FragmentoEntradaDaProva,
  FragmentoPortoes,
  FragmentoResultado,
  duracaoPorExtenso,
} from '@/components/vitrine/fragmentos'
import { QuestaoAoVivo, Relogio, TrocaDeTelas } from '@/components/vitrine/fragmentos-vivos'
import {
  CabecalhoDeSecao,
  CartaoBento,
  ChamadaFinal,
  FaixaInfinita,
  Heroi,
  Secao,
} from '@/components/vitrine/secoes'
import { FORMATOS_DA_FOLHA } from '@/lib/provas/downloads-da-prova'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'
import { provasGeraisArredondado, provasRecentesPublicas } from '@/lib/vitrines/dados'
import {
  MARCOS_DE_EXEMPLO,
  PROVA_DE_EXEMPLO,
  RESULTADO_DE_EXEMPLO,
  TURMA_DE_EXEMPLO,
} from '@/lib/vitrines/exemplos'

const DESCRICAO =
  'As provas antigas do seu curso, feitas online como a de verdade: portões, relógio da turma, gabarito comentado e a distribuição das notas no fim. Crie a conta grátis.'

export const metadata: Metadata = {
  title: 'Provas',
  description: DESCRICAO,
  alternates: { canonical: '/provas' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Provas | DomineAqui',
    description: DESCRICAO,
    url: '/provas',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui - Provas' }],
  },
}

/*
 * Estática, regenerada a cada 6 h: as provas e a contagem mudam quando o
 * admin publica, não de minuto em minuto. Ver lib/vitrines/dados.ts.
 */
export const revalidate = 21600

const TIPOS = [
  {
    nome: 'Provas antigas',
    texto: 'As N1 e N2 dos semestres anteriores, organizadas por curso, período e grupo, com o tempo e o número de questões da prova de verdade.',
    marca: 'N1 SOI I',
  },
  {
    nome: 'Simulados com a turma',
    texto: 'Provas gerais com data marcada: os portões abrem antes, todo mundo começa junto e, no fim, sai a distribuição das notas.',
    marca: 'Portões 13:50',
  },
  {
    nome: 'Provas pessoais',
    texto: 'Escolha o assunto e a IA monta uma prova só sua, para treinar quando quiser. Ela fica guardada na sua lista.',
    marca: 'Nova prova',
  },
]

/**
 * `/provas` para quem chega SEM conta.
 *
 * Ninguém abre este endereço: o middleware reescreve `/provas` para cá quando
 * não há sessão, e a barra continua mostrando `/provas`.
 *
 * As figuras são a própria tela da prova, em vidro: o topo troca entre as
 * provas gerais recentes com capa (o mesmo cartão que quem está logado vê),
 * na frente da arte dourada de Provas da landing, e a faixa corre com os
 * nomes das provas reais. O que é exemplo (horários, nota, turma) mora em
 * lib/vitrines/exemplos.ts.
 */
export default async function VitrineDasProvas() {
  const [provas, totalDeProvas] = await Promise.all([provasRecentesPublicas(12), provasGeraisArredondado()])
  const conta = enderecosDeConta('/provas')

  const comCapa = provas.filter((p) => p.capa)
  const doTopo = comCapa.length > 0 ? comCapa.slice(0, 4) : provas.length > 0 ? provas.slice(0, 1) : [PROVA_DE_EXEMPLO]

  return (
    <CascoDaVitrine destino="/provas">
      <Heroi
        pilula={
          <span className="vidro pilula">
            <span className="ponto-vivo" /> Provas da faculdade, online
          </span>
        }
        titulo="As provas da sua faculdade, como a de verdade"
        destaque={['faculdade,', 'verdade']}
        apoio={
          <p>
            As provas antigas do seu curso e os simulados com a turma, com portões, cronômetro e gabarito comentado
            no fim. Crie a conta e faça a primeira hoje.
          </p>
        }
        acoes={{
          principal: { href: conta.criar, rotulo: 'Criar conta grátis' },
          secundaria: { href: conta.entrar, rotulo: 'Já tenho conta' },
        }}
        numeros={[
          ...(totalDeProvas ? [{ ate: totalDeProvas, prefixo: '+', rotulo: 'provas gerais no catálogo' }] : []),
          { ate: 0, prefixo: 'R$ ', rotulo: 'para criar a conta' },
        ]}
        cena={
          <Cena
            arte={{ src: '/landing/provas-3d.png', largura: 1536, altura: 1024 }}
            figura={
              <TrocaDeTelas
                telas={doTopo.map((p, i) => (
                  <FragmentoEntradaDaProva key={p.titulo} prova={p} prioridade={i === 0} />
                ))}
              />
            }
            chips={[
              <Chip key="portoes" vivo>
                Portões abertos
              </Chip>,
              <Chip key="relogio">
                ⏱ <Relogio />
              </Chip>,
              <Chip key="gravada">✓ Resposta gravada</Chip>,
            ]}
          />
        }
      />

      <FaixaInfinita
        rotulo="Provas recentes no catálogo"
        itens={provas.map((p) => (
          <span key={p.id} className="flex items-center gap-3">
            <span className="font-semibold">{p.titulo}</span>
            {(p.questoes || p.duracao) && (
              <span className="text-[var(--papel-fraco)]">
                {[p.questoes ? `${p.questoes} questões` : null, p.duracao ? duracaoPorExtenso(p.duracao) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </span>
        ))}
      />

      <Secao id="como-funciona">
        <CabecalhoDeSecao
          id="como-funciona"
          pilula="Do portão à nota"
          titulo={
            <>
              Cada etapa da prova, <span className="texto-brilho">na sua tela</span>
            </>
          }
          texto="Os portões, o relógio da turma, a entrega e o gabarito comentado. Mexa na questão aqui embaixo: ela é a mesma tela da prova."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <CartaoBento
            className="lg:col-span-7 lg:row-span-2"
            titulo="Durante a prova"
            texto="O cronômetro corre pelo relógio do servidor e cada resposta é gravada na hora. Se a internet cair, você continua da mesma questão."
          >
            <QuestaoAoVivo modo="prova" />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={1}
            titulo="Antes de começar"
            texto="Você entra na sala de espera quando os portões abrem. Os quatro horários ficam à vista o tempo todo."
          >
            <FragmentoPortoes marcos={MARCOS_DE_EXEMPLO} atual={0} />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-5"
            atraso={2}
            titulo="Ao entregar"
            texto="A nota das objetivas aparece na hora. A folha de respostas pode ser baixada em PDF, conforme o seu plano."
          >
            <FragmentoResultado
              acertos={RESULTADO_DE_EXEMPLO.acertos}
              total={RESULTADO_DE_EXEMPLO.total}
              folhas={FORMATOS_DA_FOLHA.map((f) => f.titulo)}
            />
          </CartaoBento>
          <CartaoBento
            className="lg:col-span-12"
            titulo="Quando a prova termina"
            texto="Sai o gabarito comentado, alternativa por alternativa, e a distribuição das notas da turma, sem nomes. Se a prova mostrar a classificação, você vê a sua posição."
          >
            <div className="mx-auto max-w-2xl">
              <FragmentoDistribuicao {...TURMA_DE_EXEMPLO} />
            </div>
          </CartaoBento>
        </div>
      </Secao>

      <Secao id="tipos">
        <CabecalhoDeSecao
          id="tipos"
          pilula="Numa lista só"
          titulo="Três jeitos de treinar"
          texto="A lista mostra as provas liberadas para o seu curso e o seu período."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TIPOS.map((t, i) => (
            <article key={t.nome} data-revelar style={{ ['--i' as string]: i }} className="vidro cartao-ergue rounded-[28px] p-7">
              <span className="vidro-forte pilula !text-[var(--ambar-vivo)]">{t.marca}</span>
              <h3 className="titulo-secao mt-6 text-[28px]">{t.nome}</h3>
              <p className="mt-3 text-[16px] text-[var(--papel-suave)]">{t.texto}</p>
            </article>
          ))}
        </div>
      </Secao>

      <ChamadaFinal
        titulo={
          <>
            A próxima prova <span className="texto-brilho">começa aqui</span>
          </>
        }
        texto="A conta é grátis. Depois de entrar, você volta direto para esta página, já com as provas do seu curso."
        criar={conta.criar}
        entrar={conta.entrar}
      />
    </CascoDaVitrine>
  )
}

import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Direcao } from '@/lib/exames-laboratoriais/tipos'

/**
 * Os primitivos da folha de laudo do DomineAqui Lab.
 *
 * Tudo aqui é componente de servidor puro: sem estado, sem efeito, sem
 * `'use client'`. Isso é deliberado — a folha é a parte mais pesada em texto de
 * toda a seção, e renderizá-la no servidor significa que o navegador recebe
 * HTML pronto em vez de um megabyte de conteúdo clínico serializado. A
 * interatividade (abas de profundidade, geração de exames) mora em ilhas
 * pequenas de cliente, ao redor.
 *
 * ## A direção de arte
 *
 * A referência é um laudo de laboratório de verdade: papel claro, cabeçalho
 * com fio duplo, tipografia monoespaçada nos números, régua de referência à
 * direita, seta discreta na margem. O que muda em relação ao papel é que aqui
 * cada linha é um link — o valor não é o fim da leitura, é o começo dela.
 */

/* ═══════════════════════ Setas e cores por direção ═══════════════════════ */

export const SETA: Record<Direcao, string> = {
  normal: '',
  alto: '↑',
  'muito-alto': '↑↑',
  baixo: '↓',
  'muito-baixo': '↓↓',
}

/**
 * Cor por direção.
 *
 * Resultado normal é neutro de propósito: pintar tudo transforma a folha num
 * painel de alarmes e faz o olho perder o que importa. Só o que está fora da
 * faixa recebe cor, e mesmo assim em tom sóbrio — âmbar para alto, azul para
 * baixo, vermelho reservado ao que está muito alterado.
 */
export const COR_DA_DIRECAO: Record<Direcao, string> = {
  normal: 'text-foreground',
  alto: 'text-amber-700 dark:text-amber-400',
  'muito-alto': 'text-rose-700 dark:text-rose-400',
  baixo: 'text-sky-700 dark:text-sky-400',
  'muito-baixo': 'text-indigo-700 dark:text-indigo-300',
}

export function direcaoPorFaixa(valor: number, min?: number, max?: number): Direcao {
  if (min == null && max == null) return 'normal'
  if (max != null && valor > max) return valor > max * 1.5 ? 'muito-alto' : 'alto'
  if (min != null && valor < min) return valor < min * 0.6 ? 'muito-baixo' : 'baixo'
  return 'normal'
}

/* ═══════════════════════════ Cabeçalho do laudo ═══════════════════════════ */

export function CabecalhoDaFolha({
  titulo,
  material,
  paciente,
  etiqueta = 'DomineAqui Lab',
}: {
  titulo: string
  material?: string
  paciente?: string
  etiqueta?: string
}) {
  return (
    <header className="lab-cabecalho">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="lab-marca">{etiqueta}</p>
        {material && <p className="lab-meta">Material: {material}</p>}
      </div>
      <h2 className="lab-titulo-folha">{titulo}</h2>
      {paciente && <p className="lab-meta mt-1">{paciente}</p>}
    </header>
  )
}

/* ═══════════════════════════ Linha de resultado ═══════════════════════════ */

export interface LinhaDeResultado {
  id?: string
  nome: string
  valor: string
  unidade?: string
  referencia?: string
  direcao: Direcao
  /** Uma linha de leitura, mostrada abaixo do nome. */
  nota?: string
}

/**
 * Uma linha do laudo.
 *
 * Quando existe `id`, a linha inteira vira link para a ficha do marcador — que
 * é o gesto central da seção: clicar no número para descobrir por que ele está
 * assim. Sem `id`, ela é apenas texto (marcadores citados que ainda não têm
 * ficha própria).
 */
export function LinhaResultado({ linha, base = '/manual-clinico/exames-laboratoriais' }: { linha: LinhaDeResultado; base?: string }) {
  const conteudo = (
    <>
      <span className="lab-linha-nome">
        {linha.nome}
        {linha.nota && <span className="lab-linha-nota">{linha.nota}</span>}
      </span>
      <span className={`lab-linha-valor ${COR_DA_DIRECAO[linha.direcao]}`}>
        <span className="lab-numero">{linha.valor}</span>
        {linha.unidade && <span className="lab-unidade">{linha.unidade}</span>}
        {SETA[linha.direcao] && <span className="lab-seta">{SETA[linha.direcao]}</span>}
      </span>
      <span className="lab-linha-ref">{linha.referencia ?? '—'}</span>
    </>
  )

  if (!linha.id) return <div className="lab-linha">{conteudo}</div>

  return (
    <Link href={`${base}/marcador/${linha.id}`} className="lab-linha lab-linha-link" prefetch={false}>
      {conteudo}
    </Link>
  )
}

export function BlocoDaFolha({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="lab-bloco">
      <div className="lab-bloco-cabecalho">
        <h3 className="lab-bloco-titulo">{titulo}</h3>
        {descricao && <p className="lab-bloco-descricao">{descricao}</p>}
      </div>
      <div className="lab-bloco-linhas">{children}</div>
    </section>
  )
}

/**
 * O aviso de intervalos de referência.
 *
 * Aparece no rodapé de toda folha e de toda ficha, sem exceção. Nenhuma tabela
 * de referência vale mais que a do laboratório que executou o exame, e omitir
 * isso seria transformar uma orientação de estudo em uma afirmação clínica que
 * a seção não tem como sustentar.
 */
export function AvisoDeReferencia({ className = '' }: { className?: string }) {
  return (
    <p className={`lab-aviso ${className}`}>
      Os intervalos de referência podem variar entre laboratórios, métodos analíticos, idade, sexo e características da
      população. Utilize o intervalo fornecido pelo laboratório responsável pelo exame quando disponível.
    </p>
  )
}

/**
 * O lembrete de que o número isolado não fecha diagnóstico.
 *
 * É a tese da seção inteira, e por isso aparece nas telas em que a tentação de
 * ler o valor sozinho é maior: ficha de marcador, exame gerado e comparações.
 */
export function AvisoDeContexto({ className = '' }: { className?: string }) {
  return (
    <div className={`lab-aviso-contexto ${className}`}>
      <p className="lab-aviso-contexto-titulo">Um resultado isolado raramente estabelece um diagnóstico</p>
      <p className="lab-aviso-contexto-conta">
        resultado <span>+</span> história clínica <span>+</span> exame físico <span>+</span> outros exames{' '}
        <span>+</span> evolução no tempo <span className="lab-igual">=</span> interpretação clínica
      </p>
    </div>
  )
}

/* ═══════════════════════════ Fluxo causal ═══════════════════════════ */

/**
 * A cadeia `causa → mecanismo → alteração`, desenhada.
 *
 * É o componente que mais se repete na seção, porque é a forma visual da tese:
 * nenhum marcador sobe "por causa de uma doença", ele sobe porque a doença
 * quebrou uma etapa específica da fisiologia. Cada elo é uma etapa.
 */
export function Fluxo({ etapas, compacto = false }: { etapas: (string | { titulo: string; detalhe?: string })[]; compacto?: boolean }) {
  return (
    <ol className={`lab-fluxo ${compacto ? 'lab-fluxo-compacto' : ''}`}>
      {etapas.map((etapa, i) => {
        const titulo = typeof etapa === 'string' ? etapa : etapa.titulo
        const detalhe = typeof etapa === 'string' ? undefined : etapa.detalhe
        return (
          <li key={`${titulo}-${i}`} className="lab-fluxo-etapa">
            <span className="lab-fluxo-marca" aria-hidden />
            <div>
              <p className="lab-fluxo-titulo">{titulo}</p>
              {detalhe && <p className="lab-fluxo-detalhe">{detalhe}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ═══════════════════════════ Tabela comparativa ═══════════════════════════ */

export function TabelaComparativa({
  hipoteses,
  linhas,
}: {
  hipoteses: string[]
  linhas: { marcador: string; celulas: string[] }[]
}) {
  return (
    <div className="lab-tabela-scroll">
      <table className="lab-tabela">
        <thead>
          <tr>
            <th scope="col" className="lab-tabela-canto">
              Marcador
            </th>
            {hipoteses.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.marcador}>
              <th scope="row">{linha.marcador}</th>
              {linha.celulas.map((celula, i) => (
                <td key={`${linha.marcador}-${i}`} className={classeDaCelula(celula)}>
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Colore a célula pela direção que o texto expressa — ↑ âmbar, ↓ azul. */
function classeDaCelula(texto: string): string {
  if (texto.includes('↑')) return 'lab-cel-alta'
  if (texto.includes('↓')) return 'lab-cel-baixa'
  return ''
}

/* ═══════════════════════════ Etiquetas ═══════════════════════════ */

export function Etiqueta({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'alta' | 'baixa' | 'alerta' | 'destaque' }) {
  return <span className={`lab-etiqueta lab-etiqueta-${tom}`}>{children}</span>
}

/**
 * O card de advertência para conteúdo que causa dano quando lido fora de
 * contexto — marcadores tumorais, FAN, sorologias.
 */
export function Advertencia({ children }: { children: ReactNode }) {
  return (
    <div className="lab-advertencia">
      <p>{children}</p>
    </div>
  )
}

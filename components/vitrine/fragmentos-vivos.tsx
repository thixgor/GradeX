'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { cn } from '@/lib/utils'
import { QUESTAO_DE_EXEMPLO } from '@/lib/vitrines/exemplos'

/* ══════════ A questão que se responde ══════════ */

function doisDigitos(n: number) {
  return String(n).padStart(2, '0') // relógio. taste-skill-ignore
}

/** Barras de um código de barras, tiradas do texto — o desenho, não um código legível. */
function barrasDoCodigo(texto: string): number[] {
  const larguras: number[] = []
  for (const ch of texto) {
    const c = ch.charCodeAt(0)
    larguras.push(1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1 + ((c >> 1) % 2))
  }
  return larguras
}

function CodigoDeBarras({ texto }: { texto: string }) {
  const barras = useMemo(() => barrasDoCodigo(texto), [texto])
  let x = 0
  const rects: Array<{ x: number; w: number }> = []
  barras.forEach((w, i) => {
    if (i % 2 === 0) rects.push({ x, w })
    x += w
  })
  return (
    <svg aria-hidden viewBox={`0 0 ${x} 20`} preserveAspectRatio="none" className="h-8 w-40 text-[var(--ui-texto)]">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.w} height={20} fill="currentColor" />
      ))}
    </svg>
  )
}

/**
 * A questão 7 da prova de exemplo, operável.
 *
 * `prova`: como na tela da prova — o cronômetro corre (pelo relógio da página,
 * só com a aba visível), o código individual no topo, e marcar uma
 * alternativa grava a resposta com a hora. O gabarito não aparece: numa prova
 * valendo nota, ele só sai depois do término.
 *
 * `comentario`: como no banco — marcar mostra na hora se acertou e abre o
 * comentário da questão.
 */
export function QuestaoAoVivo({ modo }: { modo: 'prova' | 'comentario' }) {
  const q = QUESTAO_DE_EXEMPLO
  const [marcada, setMarcada] = useState<string | null>(null)
  const [gravadaAs, setGravadaAs] = useState<string | null>(null)
  const [restante, setRestante] = useState(1 * 3600 + 12 * 60 + 40)

  useIntervaloVisivel(() => setRestante((s) => (s > 0 ? s - 1 : 0)), modo === 'prova' ? 1000 : null)

  const marcar = (letra: string) => {
    setMarcada(letra)
    const agora = new Date()
    setGravadaAs(`${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}:${doisDigitos(agora.getSeconds())}`)
  }

  const relogio = `${Math.floor(restante / 3600)}:${doisDigitos(Math.floor((restante % 3600) / 60))}:${doisDigitos(restante % 60)}`
  const acertou = marcada === q.correta

  return (
    <div data-ui className="p-2.5">
      <div className="ui-cartao">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="font-semibold">
            Questão {q.numero} <span className="ui-suave font-normal">de {q.total}</span>
          </p>
          {modo === 'prova' ? (
            <p className="num font-semibold" aria-label={`Tempo restante ${relogio}`}>
              {relogio}
            </p>
          ) : (
            <div className="flex flex-wrap justify-end gap-1.5">
              <span className="ui-pilula">{q.modulo}</span>
              <span className="ui-pilula">{q.semestre}</span>
            </div>
          )}
        </div>

        {modo === 'prova' && (
          <div className="ui-regra flex items-center gap-3 px-4 py-2.5">
            <CodigoDeBarras texto="65A1B2C3VISITANTE" />
            <p className="ui-rotulo">Código individual · Prova 65a1b2c3 · Visitante</p>
          </div>
        )}

        <div className="ui-regra px-4 py-4">
          {modo === 'comentario' && <p className="ui-rotulo mb-1.5">{q.topico}</p>}
          <p id={`enunciado-${modo}`} className="text-[15px] leading-[22px]">
            {q.enunciado}
          </p>
          <div role="radiogroup" aria-labelledby={`enunciado-${modo}`} className="mt-3 space-y-1.5">
            {q.alternativas.map((a) => (
              <button
                key={a.letra}
                type="button"
                role="radio"
                aria-checked={marcada === a.letra}
                data-errada={modo === 'comentario' && marcada === a.letra && a.letra !== q.correta ? 'true' : undefined}
                onClick={() => marcar(a.letra)}
                className={cn(
                  'ui-alternativa',
                  // No banco, depois de responder, a certa acende mesmo que não seja a marcada.
                  modo === 'comentario' && marcada && a.letra === q.correta && '!border-[var(--ui-dado)]',
                )}
              >
                <span className="ui-letra">{a.letra}</span>
                <span className="pt-px">{a.texto}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ui-regra px-4 py-3" aria-live="polite">
          {modo === 'prova' ? (
            marcada ? (
              <p key={gravadaAs} className="surge">
                <span className="text-[var(--ui-dado)]">✓</span> Resposta <span className="font-semibold">{marcada}</span> gravada às{' '}
                <span className="num">{gravadaAs}</span>
                <span className="ui-suave"> · o gabarito sai no término</span>
              </p>
            ) : (
              <p className="ui-suave">Marque uma alternativa. Ela é gravada na hora.</p>
            )
          ) : marcada ? (
            <div key={marcada} className="surge">
              <p className="font-semibold">
                {acertou ? 'Você acertou.' : `Resposta: ${q.correta}.`}
              </p>
              <p className="mt-1.5 ui-suave">{q.comentario}</p>
            </div>
          ) : (
            <p className="ui-suave">Marque uma alternativa para ver o comentário.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════ A troca lenta do topo ══════════ */

/**
 * Troca a tela do topo a cada 6 s, com 1,6 s de travessia — como luz mudando
 * numa sala. Só com a aba visível; com movimento reduzido, fica na primeira.
 */
export function TrocaDeTelas({ telas }: { telas: ReactNode[] }) {
  const [atual, setAtual] = useState(0)
  const [pode, setPode] = useState(false)

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decidir = () => setPode(!consulta.matches)
    decidir()
    consulta.addEventListener('change', decidir)
    return () => consulta.removeEventListener('change', decidir)
  }, [])

  useIntervaloVisivel(() => setAtual((i) => (i + 1) % telas.length), pode && telas.length > 1 ? 7600 : null)

  return (
    <div className="troca grid">
      {telas.map((tela, i) => (
        <div
          key={i}
          aria-hidden={i !== atual}
          className={cn('[grid-area:1/1]', i === atual ? 'opacity-100' : 'pointer-events-none opacity-0')}
        >
          {tela}
        </div>
      ))}
    </div>
  )
}

/* ══════════ O catálogo do banco, tópico por tópico ══════════ */

export interface ModuloDoCatalogo {
  id: string
  nome: string
  total: number
  topicos: Array<{ id: string; nome: string; total: number; subtopicos: number }>
}

const numero = (n: number) => n.toLocaleString('pt-BR')

/**
 * O catálogo do banco, em vidro: os módulos são pílulas, e os tópicos do
 * módulo escolhido viram linhas com uma barra proporcional ao número de
 * questões — a barra cresce de novo a cada troca. Os números são os do
 * acervo na hora em que a página foi gerada.
 */
export function CatalogoAoVivo({ modulos }: { modulos: ModuloDoCatalogo[] }) {
  const [ativo, setAtivo] = useState(0)
  const modulo = modulos[ativo] ?? modulos[0]
  if (!modulo) return null
  const maior = Math.max(...modulo.topicos.map((t) => t.total), 1)

  return (
    <div data-revelar className="vidro rounded-[28px] p-5 md:p-8">
      <div role="tablist" aria-label="Módulos" className="flex flex-wrap gap-2">
        {modulos.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={i === ativo}
            aria-controls="catalogo-topicos"
            onClick={() => setAtivo(i)}
            className={cn(
              'min-h-[44px] rounded-full border px-4 text-[15px] font-semibold transition-all duration-300',
              i === ativo
                ? 'border-transparent bg-[linear-gradient(135deg,#f2c063,#e2a43e)] text-[#0b1f1a] shadow-[0_8px_24px_-8px_rgba(226,164,62,0.6)]'
                : 'border-white/15 bg-white/5 text-[var(--papel-suave)] hover:bg-white/10 hover:text-[var(--papel)]',
            )}
          >
            {m.nome} <span className="num font-normal opacity-75">· {numero(m.total)}</span>
          </button>
        ))}
      </div>

      <ul id="catalogo-topicos" role="tabpanel" aria-label={`Tópicos de ${modulo.nome}`} className="mt-7 space-y-3">
        {modulo.topicos.map((t, i) => (
          <li
            key={`${modulo.id}-${t.id}`}
            className="surge grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span>
              <span className="font-semibold">{t.nome}</span>
              <span className="block text-[14px] text-[var(--papel-fraco)]">
                {t.subtopicos > 0 ? `${t.subtopicos} ${t.subtopicos === 1 ? 'subtópico' : 'subtópicos'}` : 'tópico inteiro'}
              </span>
            </span>
            <span className="num text-[20px] font-bold">{numero(t.total)}</span>
            <span aria-hidden className="col-span-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="barra-cresce block h-full rounded-full bg-[linear-gradient(90deg,#468152,#6cc283,#e2a43e)]"
                style={{ width: `${(t.total / maior) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** O cronômetro de um chip: corre de 1:12:40 para baixo, só com a aba visível. */
export function Relogio({ inicio = 1 * 3600 + 12 * 60 + 40 }: { inicio?: number }) {
  const [restante, setRestante] = useState(inicio)
  useIntervaloVisivel(() => setRestante((s) => (s > 0 ? s - 1 : inicio)), 1000)
  return (
    <span className="num">
      {Math.floor(restante / 3600)}:{doisDigitos(Math.floor((restante % 3600) / 60))}:{doisDigitos(restante % 60)}
    </span>
  )
}

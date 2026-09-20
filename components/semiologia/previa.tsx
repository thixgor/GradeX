'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Hand, Lock } from 'lucide-react'
import type { ControleDeIlustracao } from './ilustracoes/controles'
import { CONTROLES, CONTROLES_DE_CENA } from './ilustracoes/controles'
import { Otoscopia } from './ilustracoes/otoscopia'
import { Ictericia } from './ilustracoes/sinais'

/**
 * As prévias da landing — e por que elas são deliberadamente mínimas.
 *
 * O acervo fotográfico do módulo é licenciado e é o produto; publicá-lo na
 * página de vendas seria entregar justamente o que está sendo vendido. O que
 * a prévia entrega é outra coisa: **o gesto**. As figuras aqui são as mesmas
 * do módulo, desenhadas por parâmetro, e é isso que nenhuma foto e nenhum
 * livro fazem — o visitante arrasta o controle e vê o achado nascer no limiar
 * clínico exato. Três deslizadores demonstram a ideia inteira sem revelar uma
 * única ficha.
 *
 * As três escolhidas cobrem as três alas: um sinal do exame físico, uma janela
 * de beira-leito e uma de ultrassom. O ultrassom entra por `dynamic` porque a
 * figura dele sozinha pesa mais do que o resto da página: quem nunca abrir a
 * aba não paga por ela.
 */

const UltrassomLento = dynamic(() => import('./ilustracoes/ultrassom').then((m) => m.Ultrassom), {
  ssr: false,
  loading: () => <div className="aspect-square w-full animate-pulse rounded-xl bg-white/10" />,
})

/**
 * A curvatura da membrana timpânica não tem controle no módulo — lá a cena já
 * chega com o valor do diagnóstico. Aqui ela vira deslizador porque é a
 * demonstração mais direta do argumento: o triângulo luminoso é **calculado**
 * a partir da planura, então abaular a membrana apaga o reflexo sozinho, sem
 * ninguém desenhar isso à mão.
 */
const CONTROLE_DE_CURVATURA: ControleDeIlustracao = {
  param: 'curvatura',
  rotulo: 'Curvatura da membrana',
  min: -1,
  max: 1,
  passo: 0.05,
  padrao: -0.12,
  formatar: (v) =>
    v < -0.5 ? 'retraída' : v < -0.05 ? 'levemente retraída' : v <= 0.15 ? 'plana (normal)' : v < 0.6 ? 'abaulada' : 'muito abaulada',
  marcos: [
    { valor: -0.12, rotulo: 'normal' },
    { valor: 0.85, rotulo: 'otite média aguda' },
  ],
}

interface Demonstracao {
  id: string
  aba: string
  ala: string
  titulo: string
  licao: string
  controle: ControleDeIlustracao
  desenhar: (valor: number) => React.ReactNode
}

const DEMONSTRACOES: Demonstracao[] = [
  {
    id: 'ictericia',
    aba: 'Icterícia',
    ala: 'Sinal do exame físico',
    titulo: 'Onde exatamente o amarelo nasce',
    licao:
      'Abaixo de 2,5 mg/dL nada acontece — como no paciente. A esclera cora primeiro, a pele demora: a bilirrubina se liga à elastina antes de tingir o resto.',
    controle: CONTROLES.ictericia,
    desenhar: (valor) => (
      <Ictericia params={{ bilirrubina: valor }} titulo="Esclera e pele conforme a bilirrubina total" />
    ),
  },
  {
    id: 'otoscopia',
    aba: 'Otoscopia',
    ala: 'Imagem à beira do leito',
    titulo: 'O triângulo luminoso não é enfeite',
    licao:
      'O reflexo existe porque a membrana é plana e inclinada. Abaule-a e o cone se desfaz sozinho — é o mesmo cálculo que desenha a otite média aguda.',
    controle: CONTROLE_DE_CURVATURA,
    desenhar: (valor) => (
      <Otoscopia params={{ cena: 'normal', curvatura: valor }} titulo="Membrana timpânica conforme a curvatura" />
    ),
  },
  {
    id: 'linhas-b',
    aba: 'Linhas B',
    ala: 'Ultrassom à beira do leito',
    titulo: 'Três por campo é onde a conduta muda',
    licao:
      'Uma ou duas linhas B cabem no pulmão normal. A partir de três no mesmo campo o padrão vira intersticial — e é essa contagem, não a impressão, que decide.',
    controle: CONTROLES_DE_CENA['ultrassom:pulmao-linhas-b'],
    desenhar: (valor) => (
      <UltrassomLento params={{ cena: 'pulmao-linhas-b', linhasB: valor }} titulo="Campo pulmonar conforme o número de linhas B" />
    ),
  },
]

export function PreviaSemiologia({ className = '' }: { className?: string }) {
  const [aba, setAba] = useState(0)
  // Um valor por demonstração: voltar para a aba anterior deve devolver a
  // figura onde a pessoa a deixou, e não recomeçar o argumento do zero.
  const [valores, setValores] = useState<number[]>(() => DEMONSTRACOES.map((d) => d.controle.padrao))
  const demo = DEMONSTRACOES[aba]
  const valor = valores[aba]

  const mudar = (novo: number) =>
    setValores((atuais) => atuais.map((v, i) => (i === aba ? novo : v)))

  return (
    <div className={`glass-panel-dark overflow-hidden rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {DEMONSTRACOES.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setAba(i)}
            aria-pressed={i === aba}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
              i === aba ? 'bg-sky-400 text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {d.aba}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-black uppercase tracking-wider text-sky-300">{demo.ala}</p>
      <p className="mt-1 font-heading text-base font-semibold leading-snug text-white">{demo.titulo}</p>

      {/* A figura ocupa no máximo a largura da coluna e nunca mais que a
          altura de uma dobra: num celular deitado, um quadrado de 100% de
          largura empurraria o controle — que é a peça que precisa ser vista —
          para fora da tela. */}
      <div className="mx-auto mt-3 w-full max-w-[min(100%,20rem)]">{demo.desenhar(valor)}</div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={`previa-${demo.id}`} className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            {demo.controle.rotulo}
          </label>
          <span className="shrink-0 text-sm font-bold tabular-nums text-white">{demo.controle.formatar(valor)}</span>
        </div>
        <input
          id={`previa-${demo.id}`}
          type="range"
          min={demo.controle.min}
          max={demo.controle.max}
          step={demo.controle.passo}
          value={valor}
          onChange={(e) => mudar(Number(e.target.value))}
          className="mt-3 w-full accent-sky-400"
        />
        {demo.controle.marcos && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {demo.controle.marcos.map((marco) => (
              <button
                key={marco.rotulo}
                type="button"
                onClick={() => mudar(marco.valor)}
                className="text-[11px] text-white/55 underline-offset-2 transition-colors hover:text-sky-300 hover:underline"
              >
                {demo.controle.formatar(marco.valor)} · {marco.rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-white/60">
        <Hand className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
        {demo.licao}
      </p>

      <p className="mt-2.5 flex items-start gap-2 border-t border-white/10 pt-2.5 text-[11px] leading-relaxed text-white/45">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Prévia do gesto, não do acervo: dentro do manual cada figura vem com a ficha inteira ao lado e, onde a
        curadoria alcançou, a fotografia do caso real.
      </p>
    </div>
  )
}

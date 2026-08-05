'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { LabButton, LabNote, LabShell } from './ui'

/**
 * Checklist da leitura sistemática. Marcar cada passo mantém o aluno na ordem
 * fixa — que é justamente o que protege contra o erro de ancoragem (achar a
 * alteração óbvia e parar de procurar).
 */

const STEPS = [
  {
    t: 'Dados técnicos e qualidade',
    d: 'Nome e data conferem? Velocidade 25 mm/s e ganho 10 mm/mV? O pulso de calibração tem 10 mm e é retangular? Há tremor, interferência de rede ou oscilação da linha de base? aVR está negativo (se não estiver, confira os cabos)?',
  },
  {
    t: 'Frequência cardíaca',
    d: 'Ritmo regular: 300 ÷ quadradões, ou 1500 ÷ quadradinhos. Ritmo irregular: QRS em 6 s × 10. Em bloqueios e flutter, meça as DUAS frequências — atrial (P-P) e ventricular (R-R).',
  },
  {
    t: 'Ritmo',
    d: 'Há onda P? Toda P é seguida de QRS? Todo QRS é precedido de P? O RR é regular? A P é positiva em D2 e negativa em aVR (sinusal)? Essas quatro perguntas classificam quase todo ritmo.',
  },
  {
    t: 'Eixo elétrico',
    d: 'Método dos quadrantes: D1 e aVF. Ambos positivos = normal. Só D1 positivo = desvio à esquerda — confirme em D2. Só aVF positivo = desvio à direita. Ambos negativos = desvio extremo.',
  },
  {
    t: 'Onda P',
    d: 'Duração < 120 ms? Amplitude < 2,5 mm? Entalhada em D2 ou com componente negativo terminal em V1 (sobrecarga esquerda)? Alta e apiculada (sobrecarga direita)? Morfologia igual em todos os batimentos?',
  },
  {
    t: 'Intervalo PR',
    d: 'Entre 120 e 200 ms? Fixo ou variável? Se longo: bloqueio AV de 1º grau. Se curto com delta: pré-excitação. Se curto sem delta: ritmo juncional ou atrial baixo. Há infra de PR (pericardite)?',
  },
  {
    t: 'Complexo QRS',
    d: 'Largura < 120 ms? Amplitude (critérios de hipertrofia)? Há Q patológica (≥ 40 ms ou ≥ 25% do R) em duas contíguas? A progressão de R de V1 a V6 é normal? Morfologia em V1 e V6 (bloqueio de ramo)?',
  },
  {
    t: 'Segmento ST e onda T',
    d: 'Meça o desnível a partir do segmento TP. Supra convexo com espelho = infarto; côncavo difuso com infra de PR = pericardite. Infra horizontal ou descendente = isquemia. A T é concordante com o QRS? Simétrica (isquemia) ou assimétrica (sobrecarga)?',
  },
  {
    t: 'Intervalo QT e QTc',
    d: 'Meça na derivação com o QT mais longo (geralmente D2 ou V5), pelo método da tangente. Corrija: Bazett = QT ÷ √RR. Triagem visual: o QT deve ser menor que metade do RR. Acima de 500 ms, mude a conduta.',
  },
  {
    t: 'Comparar e concluir',
    d: 'Existe ECG anterior? "Novo" muda tudo — um BRE antigo é achado, um BRE novo com dor é infarto. Termine escrevendo a conclusão em uma frase clínica, não em uma lista de achados.',
  },
]

export function ReadOrderLab() {
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false))
  const [open, setOpen] = useState<number | null>(0)

  const count = done.filter(Boolean).length
  const pct = Math.round((count / STEPS.length) * 100)

  return (
    <LabShell>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-sm font-black text-primary">{count}/{STEPS.length}</span>
        <LabButton onClick={() => { setDone(STEPS.map(() => false)); setOpen(0) }}>
          <RotateCcw className="h-3.5 w-3.5" />
        </LabButton>
      </div>

      <ol className="space-y-1.5">
        {STEPS.map((s, i) => (
          <li key={s.t} className={`overflow-hidden rounded-xl border transition ${done[i] ? 'border-emerald-500/35 bg-emerald-500/[0.05]' : 'border-border bg-muted/25'}`}>
            <div className="flex items-center gap-2 p-2.5">
              <button
                type="button"
                onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                aria-label={`Marcar passo ${i + 1}`}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-black transition ${
                  done[i] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {done[i] ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className={`flex-1 truncate text-[13px] font-bold ${done[i] ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{s.t}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {open === i && (
              <p className="border-t border-border/60 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {s.d}
              </p>
            )}
          </li>
        ))}
      </ol>

      {count === STEPS.length && (
        <div className="mt-3">
          <LabNote title="Sequência completa" tone="good">
            Dez passos, sempre na mesma ordem. O ganho real não está em achar a alteração óbvia — está em encontrar a
            SEGUNDA, aquela que muda a conduta: o bloqueio associado, a hipercalemia por trás da bradicardia, o QT longo
            que contraindica a droga que você ia prescrever.
          </LabNote>
        </div>
      )}
    </LabShell>
  )
}

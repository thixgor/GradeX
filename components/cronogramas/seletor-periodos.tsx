'use client'

import { getSecao, type SecaoCurso } from '@/lib/cronogramas/tipos'
import { todosOsPeriodos } from '@/lib/cronogramas/extracao'

interface SeletorPeriodosProps {
  secao: SecaoCurso
  /** Períodos marcados. Uma avaliação por período marcado. */
  valor: number[]
  onChange: (periodos: number[]) => void
  /** Mostra um período acima do curso, quando já veio marcado assim. */
  incluir?: number
  disabled?: boolean
}

/**
 * Escolha dos períodos de uma avaliação.
 *
 * A mesma prova quase nunca é de um período só: a N3 vale do 1º ao 4º de
 * manhã, e o teste de progresso é o curso inteiro no mesmo dia. Enquanto isso
 * era um `<select>` de um valor, marcar o TPI custava oito cadastros iguais
 * digitados em sequência — e bastava errar a data em um deles para uma turma
 * ficar com a agenda diferente das outras.
 *
 * Cada período marcado vira uma avaliação própria no banco, porque é assim que
 * a agenda é consultada: o aluno do 3º abre o calendário dele, não o do curso.
 * O que muda aqui é só quantas são criadas de uma vez.
 */
export function SeletorPeriodos({
  secao,
  valor,
  onChange,
  incluir,
  disabled,
}: SeletorPeriodosProps) {
  const total = Math.max(getSecao(secao).periodos, incluir ?? 0)
  const periodos = todosOsPeriodos(total)
  const todosMarcados = periodos.every(numero => valor.includes(numero))

  function alternar(numero: number) {
    const proximo = valor.includes(numero)
      ? valor.filter(item => item !== numero)
      : [...valor, numero].sort((a, b) => a - b)

    // Nunca deixa a avaliação sem período: desmarcar o último não teria como
    // ser salvo, e o formulário só descobriria isso ao tentar gravar.
    if (proximo.length > 0) onChange(proximo)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {periodos.map(numero => {
        const marcado = valor.includes(numero)
        return (
          <button
            key={numero}
            type="button"
            onClick={() => alternar(numero)}
            aria-pressed={marcado}
            disabled={disabled}
            className={`h-9 min-w-[2.5rem] rounded-lg px-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              marcado
                ? 'bg-[#468152] text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {numero}º
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => onChange(todosMarcados ? [valor[0] ?? 1] : periodos)}
        aria-pressed={todosMarcados}
        disabled={disabled}
        className={`h-9 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          todosMarcados
            ? 'border-[#468152]/40 bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0]'
            : 'border-border/60 text-muted-foreground hover:text-foreground'
        }`}
      >
        {todosMarcados ? 'Só o 1º' : 'Todos'}
      </button>

      {valor.length > 1 && (
        <span className="text-xs text-muted-foreground">
          {valor.length} avaliações, uma por período
        </span>
      )}
    </div>
  )
}

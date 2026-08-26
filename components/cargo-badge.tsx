'use client'

/**
 * O selo do cargo — um componente, quatro telas.
 *
 * Este selo aparecia escrito à mão em três lugares (`/profile`, a lista de
 * `/admin/users` e o cabeçalho da conta), cada um com o próprio `switch` sobre
 * `accountType`, o próprio gradiente e a própria escolha de ícone. Três cópias
 * do mesmo fato, e nenhuma delas conhecia o Quest quando ele foi criado — o
 * aluno via "Gratuito" no perfil depois de pagar.
 *
 * Agora o rótulo, a cor e o ícone vêm do registro (`/admin/cargos`), e um cargo
 * criado hoje já aparece certo em toda tela que usa este componente.
 */

import {
  BookOpen,
  Crown,
  GraduationCap,
  Infinity as InfinityIcon,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  Zap,
} from 'lucide-react'
import { useCargos } from '@/hooks/use-cargos'
import { classesDaCor, type CargoIcone } from '@/lib/cargos'
import { cn } from '@/lib/utils'

type ComponenteDeIcone = React.ComponentType<{ className?: string }>

/**
 * Tradução de `CargoIcone` para componente.
 *
 * Fica aqui e não em `lib/cargos.ts` porque aquele módulo roda no servidor, e
 * importar `lucide-react` lá arrastaria a biblioteca inteira de ícones para
 * dentro de rotas de API que só precisam saber o nome do cargo.
 */
export const ICONES_DE_CARGO: Record<CargoIcone, ComponenteDeIcone | null> = {
  none: null,
  crown: Crown,
  sparkles: Sparkles,
  target: Target,
  timer: Timer,
  star: Star,
  zap: Zap,
  shield: Shield,
  book: BookOpen,
  graduation: GraduationCap,
  infinity: InfinityIcon,
}

export function iconeDoCargo(nome?: string | null): ComponenteDeIcone | null {
  return ICONES_DE_CARGO[(nome || 'none') as CargoIcone] ?? null
}

interface SeloDeCargoProps {
  /** O `accountType` gravado na conta. Aliases legados são resolvidos. */
  accountType?: string | null
  /**
   * Texto extra colado no rótulo — o perfil usa para o tempo restante do
   * trial ("Trial · 3 dias").
   */
  sufixo?: string
  /** Admin não tem cargo: tem `role`. Quando verdadeiro, o selo diz isso. */
  ehAdmin?: boolean
  tamanho?: 'sm' | 'md'
  className?: string
}

/**
 * O selo de uma conta.
 *
 * Um cargo que sumiu do registro (apagado depois de já ter sido atribuído)
 * aparece pelo próprio id, em cinza: é feio de propósito, porque a conta está
 * mesmo num estado que o admin precisa consertar — mostrar "Gratuito" ali
 * esconderia o problema.
 */
export function SeloDeCargo({
  accountType,
  sufixo,
  ehAdmin,
  tamanho = 'md',
  className,
}: SeloDeCargoProps) {
  const { acharCargo } = useCargos()

  const dimensoes =
    tamanho === 'sm'
      ? { caixa: 'px-2 py-0.5 text-[10px]', icone: 'h-3 w-3' }
      : { caixa: 'px-2.5 py-1 text-xs', icone: 'h-3.5 w-3.5' }

  if (ehAdmin) {
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white',
          dimensoes.caixa,
          className,
        )}
      >
        <Crown className={dimensoes.icone} />
        Admin
      </span>
    )
  }

  const cargo = acharCargo(accountType)

  if (!cargo) {
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 font-mono font-semibold text-muted-foreground',
          dimensoes.caixa,
          className,
        )}
        title="Este cargo não existe mais no registro. A conta se comporta como gratuita."
      >
        {String(accountType)}
      </span>
    )
  }

  const Icone = iconeDoCargo(cargo.icone)

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md bg-gradient-to-r font-semibold text-white',
        classesDaCor(cargo.cor),
        dimensoes.caixa,
        className,
      )}
    >
      {Icone ? <Icone className={dimensoes.icone} /> : null}
      {cargo.nome}
      {sufixo ? <span className="font-normal opacity-90">· {sufixo}</span> : null}
    </span>
  )
}

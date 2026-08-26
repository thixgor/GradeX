'use client'

import { Logo } from '@/components/logo'

interface ExamBrandBadgeProps {
  /**
   * Versão discreta, para quando o cronômetro já ocupa o espaço nobre do
   * cabeçalho. Sem cronômetro a marca assume o lugar dele e aparece inteira.
   */
  compact?: boolean
  className?: string
}

const SITE = 'domineaqui.com.br'

/**
 * Assinatura da plataforma dentro da prova.
 *
 * A tela de resolução não trazia nenhuma marca: quem via um print não tinha
 * como saber de onde a prova veio. A marca passa a aparecer sempre — discreta
 * quando existe cronômetro e, quando a prova não tem limite de tempo, ocupando
 * o espaço que era do cronômetro, com o endereço do site junto.
 */
export function ExamBrandBadge({ compact = false, className = '' }: ExamBrandBadgeProps) {
  // O ícone tem versão clara própria para o tema escuro. A troca é por CSS
  // para o cabeçalho não depender de leitura de tema em JS.
  const iconHeight = compact ? '!h-5' : '!h-7 sm:!h-8'
  const icon = (
    <>
      <Logo variant="icon" size="sm" className={`block dark:hidden w-auto ${iconHeight}`} />
      <Logo variant="dark" size="sm" className={`hidden dark:block w-auto ${iconHeight}`} />
    </>
  )

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 select-none ${className}`}
        title={`Domine Aqui · ${SITE}`}
      >
        {icon}
        <span className="hidden lg:inline text-[11px] font-medium tracking-wide text-muted-foreground">
          {SITE}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 sm:gap-2.5 rounded-xl border border-border/60 bg-gradient-to-r from-emerald-500/10 via-transparent to-amber-500/10 px-2.5 sm:px-3 py-1.5 shadow-sm backdrop-blur-sm select-none ${className}`}
      title={`Domine Aqui · ${SITE}`}
    >
      {icon}
      <span className="flex flex-col leading-tight">
        <span className="text-sm sm:text-base font-bold tracking-tight text-[#468152] dark:text-emerald-400">
          Domine<span className="text-[#E2A43E] dark:text-amber-400">Aqui</span>
        </span>
        <span className="text-[9px] sm:text-[10px] font-medium tracking-wide text-muted-foreground">
          {SITE}
        </span>
      </span>
    </div>
  )
}

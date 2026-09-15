"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Como o diálogo se posiciona na tela.
 *
 * - `center` (padrão): caixa centralizada, com respiro nas laterais. É o que
 *   todas as telas já usavam e continua igual.
 * - `sheet`: folha que sobe do rodapé no celular e vira caixa centralizada a
 *   partir de `sm`. No telefone, um conteúdo alto centralizado obriga a pessoa
 *   a rolar para achar o botão; colado no rodapé, o botão nasce onde o polegar
 *   já está.
 */
type DialogVariant = "center" | "sheet"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: DialogVariant
  children: React.ReactNode
}

/**
 * Trava a rolagem do documento enquanto houver diálogo aberto.
 *
 * Sem isso, rolar dentro do modal no celular "vaza" para a página atrás assim
 * que o conteúdo do modal chega ao fim — o fundo anda, o modal parece solto e,
 * ao fechar, a pessoa está em outro ponto da página. O contador cobre o caso de
 * dois diálogos abertos ao mesmo tempo: só o último a fechar destrava.
 */
let lockCount = 0
let previousOverflow = ""

function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active || typeof document === "undefined") return

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [active])
}

export function Dialog({ open, onOpenChange, variant = "center", children }: DialogProps) {
  useScrollLock(open)

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  const isSheet = variant === "sheet"

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center",
        isSheet ? "items-end p-0 sm:items-center sm:p-4" : "items-center p-4",
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div
        className={cn(
          "relative z-50 max-h-[90vh] overflow-y-auto duration-200",
          // `dvh` acompanha a barra de endereço do navegador móvel, que o `vh`
          // ignora — é o que fazia o rodapé do modal ficar fora da tela no
          // celular. Fica atrás de `@supports` para não zerar a altura máxima
          // em navegador antigo, onde `vh` continua valendo.
          "supports-[height:100dvh]:max-h-[90dvh]",
          isSheet
            ? "w-full animate-in slide-in-from-bottom-4 sm:w-auto sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95"
            : "animate-in fade-in zoom-in-95",
        )}
      >
        {children}
      </div>
    </div>
  )
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement>

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative bg-background rounded-lg shadow-2xl border max-w-md w-full mx-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>

export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div className={cn("p-6 pb-4", className)} {...props}>
      {children}
    </div>
  )
}

type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean
}

export function DialogDescription({ children, className, asChild, ...props }: DialogDescriptionProps) {
  const classes = cn("text-sm text-muted-foreground mt-2", className)

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className),
    })
  }

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  )
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div className={cn("p-6 pt-4 flex justify-end gap-2", className)} {...props}>
      {children}
    </div>
  )
}

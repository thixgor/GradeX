import { ScanLine } from 'lucide-react'

export function LogoRadiologia({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label="Manual de Radiologia - DomineAqui">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 sm:h-14 sm:w-14">
        <ScanLine className="h-7 w-7 sm:h-8 sm:w-8" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Manual de</span>
        <span className="mt-1 block font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">Radiologia</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">DomineAqui</span>
      </span>
    </div>
  )
}

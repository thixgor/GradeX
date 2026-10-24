import { ImageOff } from 'lucide-react'

/**
 * O lugar da miniatura quando o servidor da lâmina está fora do ar
 * (`SERVIDORES_FORA_DO_AR`). Sem isto o cartão mostraria o ícone de imagem
 * quebrada do navegador — o servidor recusa também a miniatura.
 */
export function MiniaturaIndisponivel({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-100 p-2 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <ImageOff className={compacta ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden />
      {!compacta && <span className="text-[11px] font-semibold leading-tight">Origem fora do ar</span>}
    </span>
  )
}

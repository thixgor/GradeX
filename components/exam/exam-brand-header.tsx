'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const SITE = 'domineaqui.com.br'
const ENDERECO = 'https://domineaqui.com.br'

/**
 * A marca no topo das telas da prova.
 *
 * ## O problema
 *
 * A tela de entrada, a sala de espera e a de resultados não tinham nada da
 * plataforma: nem logo, nem nome, nem endereço. Um cartão de vidro com um botão
 * verde — o mesmo cartão que qualquer gerador de tela produz. Quem chegava pelo
 * link direto da prova (que é como quase todo mundo chega) não via, em nenhum
 * momento do fluxo, de onde aquilo vinha; e quem tirava print para mandar no
 * grupo da turma espalhava uma imagem sem dono.
 *
 * Isso importa mais aqui do que em outras telas por dois motivos práticos: a
 * prova é o momento em que a pessoa passa mais tempo parada olhando para a
 * mesma tela (a sala de espera é feita de espera), e é a tela mais
 * compartilhada da plataforma.
 *
 * ## As decisões
 *
 * - **O ícone tem duas versões**, e a troca é por CSS (`dark:hidden`) e não por
 *   leitura de tema em JS: o cabeçalho não pode piscar a logo errada enquanto o
 *   React decide qual tema está valendo.
 * - **O endereço é um link real**, que abre em outra aba. Escrever
 *   "domineaqui.com.br" como texto morto ao lado de uma logo é enfeite; como
 *   link, é o caminho de volta para quem recebeu só o print.
 * - **`durante`** encolhe tudo e tira o link: no meio da prova a marca é
 *   assinatura, não convite para sair da página.
 */
export function ExamBrandHeader({
  acao,
  durante = false,
  className,
}: {
  /** Slot à direita (voltar, tema, cronômetro). */
  acao?: React.ReactNode
  /** Versão discreta, para dentro da prova. */
  durante?: boolean
  className?: string
}) {
  const alturaDoIcone = durante ? '!h-6' : '!h-8 sm:!h-9'

  const marca = (
    <span className="flex items-center gap-2 sm:gap-2.5 select-none">
      <Logo variant="icon" size="sm" className={cn('block dark:hidden w-auto', alturaDoIcone)} />
      <Logo variant="dark" size="sm" className={cn('hidden dark:block w-auto', alturaDoIcone)} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-black tracking-tight text-[#468152] dark:text-emerald-400',
            durante ? 'text-sm' : 'text-base sm:text-lg',
          )}
        >
          Domine<span className="text-[#E2A43E] dark:text-amber-400">Aqui</span>
        </span>
        {!durante && (
          <span className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground sm:text-[11px]">
            {SITE}
          </span>
        )}
      </span>
    </span>
  )

  return (
    <div className={cn('exam-desce flex items-center justify-between gap-3', className)}>
      {durante ? (
        <span title={`Domine Aqui · ${SITE}`}>{marca}</span>
      ) : (
        <Link
          href={ENDERECO}
          target="_blank"
          rel="noopener noreferrer"
          title={`Domine Aqui · ${SITE}`}
          className="rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-emerald-500/60"
        >
          {marca}
        </Link>
      )}
      {acao}
    </div>
  )
}

/**
 * O rodapé de marca — o endereço do site abaixo do conteúdo.
 *
 * Existe pela mesma razão do cabeçalho, para o outro extremo da tela: numa
 * página que rola (a de resultados rola muito), quem chega ao fim já não vê o
 * topo, e o fim é justamente onde a pessoa decide o que fazer em seguida.
 */
export function ExamBrandFooter({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-2 text-center', className)}>
      <Link
        href={ENDERECO}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-muted/60"
      >
        <Logo variant="icon" size="sm" className="block dark:hidden !h-5 w-auto" />
        <Logo variant="dark" size="sm" className="hidden dark:block !h-5 w-auto" />
        <span className="text-xs font-semibold text-[#468152] dark:text-emerald-400">
          Domine<span className="text-[#E2A43E] dark:text-amber-400">Aqui</span>
        </span>
        <span className="text-xs text-muted-foreground group-hover:text-foreground">{SITE}</span>
      </Link>
    </div>
  )
}

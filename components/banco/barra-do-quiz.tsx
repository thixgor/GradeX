'use client'

import { useAppShell } from '@/components/app-shell'
import { BarraInferior } from '@/components/ui/barra-inferior'

/**
 * A `BarraInferior` das telas de resolução, ciente da sidebar.
 *
 * ## Por que ela precisa saber da sidebar
 *
 * "Verificar resposta" e "Próxima" ficavam no fim do fluxo no desktop —
 * a barra flutuante só aparecia até `md`, porque em telas maiores ela
 * passaria por baixo da sidebar (fixa, `z-50`, ocupando 72 ou 280px à
 * esquerda). O preço era o mesmo problema que a barra resolve no celular:
 * para responder, era preciso descer até o fim das alternativas.
 *
 * Ela portala para o fim do `<body>` — fora da árvore que o layout do
 * `AppShell` empurra para a direita da sidebar (`lg:pl-[…]`) — então quem
 * a desloca precisa saber, por conta própria, se a sidebar está aberta
 * (280px) ou recolhida (72px). Esse dado só existe dentro da árvore do
 * `<AppShell>` (via `useAppShell()`); a página que RENDERIZA o `<AppShell>`
 * não é descendente dele, só quem é filho dele. Por isso este componente
 * existe separado: ele entra como filho do `<AppShell>`, nunca como o
 * próprio wrapper.
 */
export function BarraDoQuiz({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppShell()
  return (
    <BarraInferior ladoDaSidebar={sidebarCollapsed ? 'recolhida' : 'aberta'}>
      {children}
    </BarraInferior>
  )
}

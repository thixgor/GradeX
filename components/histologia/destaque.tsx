import type React from 'react'

/**
 * Converte a marcação `**termo**` do texto editorial em `<strong>`.
 *
 * Feito por fatiamento, e não por `dangerouslySetInnerHTML`: o texto é nosso,
 * mas abrir esse caminho num componente que renderiza conteúdo de dados é
 * exatamente como um XSS entra depois, quando alguém reaproveitar a função.
 *
 * Vive num módulo próprio porque três superfícies a usam — panorama de setor,
 * aprofundamento e descrição de lâmina. Duplicá-la seria convidar as cópias a
 * divergirem justamente na parte que decide se algo vira HTML.
 */
export function destacarTermos(texto: string): React.ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-semibold">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      parte
    ),
  )
}

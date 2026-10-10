import { Space_Grotesk } from 'next/font/google'

/**
 * Títulos das monitorias: Space Grotesk (a mesma display da landing do site).
 * Dentro de `escopoMonitorias`, `font-heading` passa a ser esta fonte — nada
 * fora da seção muda. Diálogos (que abrem em portal, fora do invólucro)
 * recebem a mesma classe.
 */
const titulos = Space_Grotesk({ subsets: ['latin'], variable: '--font-mon-display', display: 'swap' })

export const escopoMonitorias = `${titulos.variable} mon-escopo`

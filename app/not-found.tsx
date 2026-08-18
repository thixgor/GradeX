import type { Metadata } from 'next'

import { TelaDeErro } from '@/components/erro/tela-de-erro'
import { diagnosticoDe } from '@/lib/erros/diagnostico'

export const metadata: Metadata = {
  title: 'Página não encontrada',
  description: 'O endereço aberto não existe no DomineAqui.',
  robots: { index: false, follow: false },
}

/**
 * 404 da plataforma.
 *
 * Usa a mesma tela dos outros erros de propósito: o 404 é só mais uma causa
 * possível, e ter duas telas diferentes para "não abriu" seria manter dois
 * desenhos vivos. A causa aqui é conhecida, então o diagnóstico entra pronto —
 * sem precisar adivinhar nada do erro.
 */
export default function NotFound() {
  return (
    <TelaDeErro diagnosticoFixo={diagnosticoDe('nao-encontrado')} ocultarDetalhes />
  )
}

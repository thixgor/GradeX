import {
  Activity,
  Biohazard,
  BookOpen,
  Calculator,
  FlaskConical,
  Microscope,
  Pill,
  ScanLine,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'

import { MODULOS } from '@/lib/manual-clinico/integracao/modulos'
import type { ModuloIntegrado } from '@/lib/manual-clinico/integracao/tipos'

const ICONES: Record<string, LucideIcon> = {
  Activity,
  Biohazard,
  BookOpen,
  Calculator,
  FlaskConical,
  Microscope,
  Pill,
  ScanLine,
  Stethoscope,
}

export function IconeDoModulo({ modulo, className }: { modulo: ModuloIntegrado; className?: string }) {
  const Icone = ICONES[MODULOS[modulo].icone] ?? BookOpen
  return <Icone className={className} aria-hidden />
}

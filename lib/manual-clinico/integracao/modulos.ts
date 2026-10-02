import type { EtapaDoEstudo, ModuloIntegrado } from './tipos'

/**
 * Como cada manual e cada etapa se apresentam no Estudo Integrado.
 *
 * Sem dependências para servir ao cliente. O ícone é o nome em `lucide-react`,
 * resolvido no componente — o mesmo arranjo de `lib/manual-clinico/pacote.ts`.
 */

export interface InfoDoModulo {
  nome: string
  icone: 'Microscope' | 'Stethoscope' | 'FlaskConical' | 'ScanLine' | 'Biohazard' | 'BookOpen' | 'Activity' | 'Pill' | 'Calculator'
  /** Classes de cor do selo (texto + borda), em claro e escuro. */
  cor: string
}

export const MODULOS: Record<ModuloIntegrado, InfoDoModulo> = {
  histologia: { nome: 'Histologia', icone: 'Microscope', cor: 'text-violet-700 dark:text-violet-300 border-violet-500/30 bg-violet-500/5' },
  semiologia: { nome: 'Semiologia', icone: 'Stethoscope', cor: 'text-teal-700 dark:text-teal-300 border-teal-500/30 bg-teal-500/5' },
  exames: { nome: 'Exames Laboratoriais', icone: 'FlaskConical', cor: 'text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/5' },
  radiologia: { nome: 'Radiologia', icone: 'ScanLine', cor: 'text-sky-700 dark:text-sky-300 border-sky-500/30 bg-sky-500/5' },
  histopatologia: { nome: 'Histopatologia', icone: 'Biohazard', cor: 'text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/5' },
  manual: { nome: 'Manual Clínico', icone: 'BookOpen', cor: 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/5' },
  eletrocardiograma: { nome: 'Eletrocardiograma', icone: 'Activity', cor: 'text-red-700 dark:text-red-300 border-red-500/30 bg-red-500/5' },
  farmacologia: { nome: 'Farmacologia', icone: 'Pill', cor: 'text-indigo-700 dark:text-indigo-300 border-indigo-500/30 bg-indigo-500/5' },
  ferramentas: { nome: 'Ferramentas Clínicas', icone: 'Calculator', cor: 'text-slate-700 dark:text-slate-300 border-slate-500/30 bg-slate-500/5' },
}

export interface InfoDaEtapa {
  numero: number
  titulo: string
  /** A pergunta que a etapa responde — é o que dá sentido à ordem. */
  pergunta: string
}

export const ETAPAS: Record<EtapaDoEstudo, InfoDaEtapa> = {
  base: { numero: 1, titulo: 'Base normal', pergunta: 'Como é o órgão saudável?' },
  'exame-fisico': { numero: 2, titulo: 'Exame físico', pergunta: 'O que a mão, o olho e o estetoscópio encontram?' },
  laboratorio: { numero: 3, titulo: 'Laboratório', pergunta: 'O que aparece no sangue e na urina?' },
  imagem: { numero: 4, titulo: 'Imagem', pergunta: 'Como a doença aparece no ultrassom, no Raio-X e na TC?' },
  patologia: { numero: 5, titulo: 'Anatomia patológica', pergunta: 'O que o patologista vê na lâmina?' },
  clinica: { numero: 6, titulo: 'Clínica', pergunta: 'Como a doença se apresenta e se diagnostica?' },
  conduta: { numero: 7, titulo: 'Conduta', pergunta: 'O que se faz — fármacos e escores?' },
}

export const ORDEM_DAS_ETAPAS: EtapaDoEstudo[] = (Object.keys(ETAPAS) as EtapaDoEstudo[]).sort(
  (a, b) => ETAPAS[a].numero - ETAPAS[b].numero,
)

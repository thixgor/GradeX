import type { User } from '@/lib/types'

export interface MissingProfileField {
  key: string
  label: string
}

type ProfileFieldsInput = Pick<
  User,
  | 'phone'
  | 'state'
  | 'profession'
  | 'specialty'
  | 'residencySpecialty'
  | 'residencyHospital'
  | 'residencyYear'
  | 'afyaUnit'
>

/**
 * Calcula quais dados de perfil "importantes" ainda estão faltando, de
 * acordo com a profissão atual do usuário (médico, acadêmico ou residente).
 * Função pura (sem I/O) — usada tanto pelo lembrete por e-mail (cron) quanto
 * pelo banner em /profile, no cliente e no servidor.
 */
export function getMissingProfileFields(
  user: Partial<ProfileFieldsInput> | null | undefined
): MissingProfileField[] {
  if (!user) return []
  const missing: MissingProfileField[] = []

  if (!user.phone) missing.push({ key: 'phone', label: 'Telefone com DDD' })
  if (!user.state) missing.push({ key: 'state', label: 'Estado' })

  if (!user.profession) {
    missing.push({ key: 'profession', label: 'Se você é médico, acadêmico ou residente' })
    // Sem profissão definida não dá pra saber quais campos específicos checar.
    return missing
  }

  if (user.profession === 'medico' && !user.specialty) {
    missing.push({ key: 'specialty', label: 'Sua especialidade médica' })
  }

  if (user.profession === 'residente') {
    if (!user.residencySpecialty) missing.push({ key: 'residencySpecialty', label: 'Área da sua residência' })
    if (!user.residencyHospital) missing.push({ key: 'residencyHospital', label: 'Hospital da sua residência' })
    if (!user.residencyYear) missing.push({ key: 'residencyYear', label: 'Ano de residência (R1, R2...)' })
  }

  if (user.profession === 'academico' && !user.afyaUnit) {
    missing.push({ key: 'afyaUnit', label: 'Sua faculdade/instituição' })
  }

  return missing
}

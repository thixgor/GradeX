/** "Mulher, 30 anos" — o caso de origem em uma linha. */
export function textoDoCaso(sexo: 'F' | 'M' | null, idade: number | null): string {
  const s = sexo === 'F' ? 'Mulher' : sexo === 'M' ? 'Homem' : 'Paciente'
  return idade != null ? `${s}, ${idade} anos` : s
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // espaços -> hífens
    .replace(/-+/g, '-') // hífens duplicados
}

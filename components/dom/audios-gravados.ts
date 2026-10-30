/**
 * Ids das falas que já têm áudio gravado em `public/dom/audio/v1/<id>.mp3`.
 *
 * GERADO por `node scripts/dom/indexar-audios.mjs` — não edite à mão. Fala
 * fora desta lista não é pedida ao servidor (nada de 404 em cascata): aparece
 * só no balão, com a boca mexendo em silêncio.
 */
export const AUDIOS_GRAVADOS: ReadonlySet<string> = new Set<string>([])

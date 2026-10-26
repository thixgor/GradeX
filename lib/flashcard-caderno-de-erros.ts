/**
 * Caderno de erros do modo "ordem do deck".
 *
 * Na repetição espaçada o caderno sai do próprio progresso do servidor: é
 * todo card cuja última nota foi "Difícil". O modo normal não grava progresso
 * por card, então o que a pessoa marca como "Difícil" ali fica guardado neste
 * aparelho — e sai do caderno quando ela acerta o card, em qualquer modo.
 */

function chave(userKey: string, slug: string) {
  return `gdx:flashcard-erros:${userKey}:${slug}`
}

export function lerErrosLocais(userKey: string, slug: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const bruto = JSON.parse(window.localStorage.getItem(chave(userKey, slug)) || '[]')
    return new Set(Array.isArray(bruto) ? bruto.map(String) : [])
  } catch {
    return new Set()
  }
}

/** `errou`: entra no caderno; acerto: sai. Devolve o conjunto atualizado. */
export function marcarErroLocal(userKey: string, slug: string, cardId: string, errou: boolean): Set<string> {
  const erros = lerErrosLocais(userKey, slug)
  if (errou) erros.add(cardId)
  else erros.delete(cardId)
  try {
    if (erros.size === 0) window.localStorage.removeItem(chave(userKey, slug))
    else window.localStorage.setItem(chave(userKey, slug), JSON.stringify(Array.from(erros)))
  } catch {}
  return erros
}

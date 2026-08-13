import type { AtlasSystem } from './estrutura'

/**
 * Busca do acervo no navegador.
 *
 * O Atlas pede o sistema que o aluno abriu, e só ele. Como voltar para a tela
 * de sistemas e entrar de novo é o movimento mais comum da seção, a promessa
 * fica guardada por slug: a segunda visita ao mesmo sistema não gera pedido
 * nenhum, nem espera.
 *
 * Guardar a *promessa* (e não o resultado) também resolve o caso de dois
 * pedidos simultâneos para o mesmo sistema — a busca e a prancha, por exemplo:
 * ambos aguardam a mesma resposta em vez de baixarem duas vezes.
 */

const pedidos = new Map<string, Promise<AtlasSystem[]>>()

export class AcervoIndisponivel extends Error {
  constructor(readonly status: number) {
    super(
      status === 403
        ? 'Este acervo é exclusivo para assinantes.'
        : 'Não foi possível carregar o acervo do Atlas.',
    )
    this.name = 'AcervoIndisponivel'
  }
}

/**
 * @param slug slug do sistema, `'todos'` para o acervo inteiro (usado pelo quiz
 *   quando o aluno escolhe sortear de tudo).
 */
export function carregarAcervo(slug: string): Promise<AtlasSystem[]> {
  const guardado = pedidos.get(slug)
  if (guardado) return guardado

  const promessa = fetch(`/api/anatomia/acervo?sistema=${encodeURIComponent(slug)}`)
    .then(async resposta => {
      if (!resposta.ok) throw new AcervoIndisponivel(resposta.status)
      const conteudo = (await resposta.json()) as { sistemas?: AtlasSystem[] }
      if (!conteudo.sistemas?.length) throw new AcervoIndisponivel(resposta.status)
      return conteudo.sistemas
    })
    .catch(erro => {
      // Uma falha de rede não pode virar cache permanente: sem isto, o botão
      // "tentar de novo" devolveria o mesmo erro para sempre.
      pedidos.delete(slug)
      throw erro
    })

  pedidos.set(slug, promessa)
  return promessa
}

/** Aquece o cache sem que ninguém esteja esperando (falha em silêncio). */
export function prepararAcervo(slug: string) {
  carregarAcervo(slug).catch(() => {})
}

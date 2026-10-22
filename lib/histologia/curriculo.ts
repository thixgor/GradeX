import 'server-only'

import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { doencasRelacionadasA } from '@/lib/histopatologia/repositorio'

import { descricaoDaLamina } from './laminas'
import { LARGURA_LAMINA, LARGURA_MINIATURA, LARGURA_PREVIA, urlDaMidia, urlOtimizada } from './midia'
import { TODOS_OS_QUIZZES, obterFragmento, obterNo, obterPagina, vizinhas } from './repositorio'
import { resumoDoSetor } from './resumos'
import { jsonLdDeLamina, jsonLdDeTrilha, rotaDaPagina } from './seo'
import type { DadosDaPaginaDoCurriculo } from './curriculo-tipos'

/**
 * Conteúdo de uma das 1.524 páginas do currículo, como dado.
 *
 * Era montado dentro de `app/manual-clinico/histologia/[...slug]/page.tsx`, que
 * por isso lia a sessão e saía da função a cada visita. Agora a página é um
 * casco estático e isto chega por `/api/manual-clinico/histologia/curriculo/…`,
 * depois do portão. Os recortes são os mesmos da página antiga.
 */
export async function dadosDaPaginaDoCurriculo(caminho: string[]): Promise<DadosDaPaginaDoCurriculo | null> {
  const pagina = await obterPagina(caminho)
  if (!pagina) return null

  const comPatologia = histopatologiaHabilitada()

  /*
   * Metade "normal → patológico" do vínculo bidirecional.
   *
   * Derivada do que cada doença declara como histologia normal de referência, e
   * não de um segundo mapa mantido à mão — que discordaria do primeiro na
   * primeira doença nova. Quando nada aponta para esta rota, o bloco não
   * renderiza nada: sem cabeçalho vazio, sem espaço reservado.
   */
  const relacionadas = doencasRelacionadasA(caminho)

  /* ── Nó de índice: 204 páginas do acervo não são lâminas ── */
  if (pagina.tipo === 'secao') {
    const no = obterNo(caminho)
    const filhos = no?.filhos ?? []
    return {
      tipo: 'secao',
      titulo: pagina.titulo,
      comPatologia,
      relacionadas,
      jsonLd: [jsonLdDeTrilha(pagina.trilha)],
      pagina: { caminho: pagina.caminho, titulo: pagina.titulo, trilha: pagina.trilha },
      // A seção lista os filhos; os netos (a árvore inteira abaixo deles) não
      // aparecem e não precisam viajar.
      filhos: filhos.map((filho) => ({ ...filho, filhos: [] })),
      miniaturas: await miniaturasDe(
        caminho,
        new Set(filhos.filter((f) => f.tipo === 'lamina').map((f) => f.caminho.join('/'))),
      ),
      resumo: resumoDoSetor(pagina.caminho),
    }
  }

  /* ── Lâmina ── */
  const irmas = await obterFragmento(caminho)
  const bandeja = irmas
    .filter((p) => p.tipo === 'lamina' && p.base && ehIrma(p.caminho, pagina.caminho))
    .slice(0, 24)
    .map((p) => ({ rota: p.caminho.join('/'), titulo: p.titulo, miniatura: p.base }))

  const { anterior, proxima } = vizinhas(caminho)
  /*
   * As duas pilhas de quiz: o do assunto, vindo do acervo, e o do tema desta
   * lâmina, montado sobre as marcações dela e das vizinhas. O do tema vem
   * primeiro — é o mais próximo do que está na tela.
   */
  const quizzes = TODOS_OS_QUIZZES.filter((q) => pagina.quizzes.includes(q.slug)).sort(
    (a, b) => Number(b.autoria === 'proprio') - Number(a.autoria === 'proprio'),
  )
  const imagem = pagina.base ? urlDaMidia(pagina.base) : null

  return {
    tipo: 'lamina',
    titulo: pagina.titulo,
    comPatologia,
    relacionadas,
    jsonLd: [jsonLdDeLamina(pagina, imagem), jsonLdDeTrilha(pagina.trilha)],
    pagina,
    // Resolvido aqui, e não dentro do componente cliente: a tabela
    // `DESCRICOES` tem 700 KB e a função de busca fecha sobre ela, então
    // consultá-la do outro lado da fronteira significava enviar as
    // descrições das 1.318 lâminas ao navegador para exibir uma.
    descricaoPropria: descricaoDaLamina(pagina.tituloOriginal, pagina.caminho),
    vizinhas: {
      anterior: anterior && { titulo: anterior.titulo, caminho: anterior.caminho },
      proxima: proxima && { titulo: proxima.titulo, caminho: proxima.caminho },
    },
    bandeja,
    quizzes: quizzes.map((q) => ({ slug: q.slug, titulo: q.titulo, questoes: q.questoes })),
    visto: {
      href: rotaDaPagina(pagina.caminho),
      titulo: pagina.titulo,
      categoria: `Histologia · ${pagina.trilha[0]?.titulo ?? 'Atlas por assunto'}`,
      area: 'histologia',
      imagem: urlOtimizada(imagem, LARGURA_MINIATURA, 60),
      zoom: false,
    },
    preLamina: urlOtimizada(imagem, LARGURA_LAMINA),
    prePrevia: urlOtimizada(imagem, LARGURA_PREVIA, 45),
  }
}

/** Lâminas do mesmo pai — é o conjunto que a bandeja do microscópio oferece. */
function ehIrma(candidata: string[], atual: string[]): boolean {
  if (candidata.length !== atual.length) return false
  return candidata.slice(0, -1).join('/') === atual.slice(0, -1).join('/')
}

/** Miniaturas das lâminas filhas — só delas: o fragmento traz o subsetor inteiro. */
async function miniaturasDe(caminho: string[], rotas: Set<string>) {
  const paginas = await obterFragmento(caminho)
  const mapa: Record<string, string> = {}
  for (const p of paginas) {
    if (!p.base || !rotas.has(p.caminho.join('/'))) continue
    // São miniaturas de índice, exibidas a poucas dezenas de pixels. Servir a
    // lâmina original de 1 MB em cada uma tornava o índice de setor a página
    // mais pesada do módulo.
    const url = urlOtimizada(urlDaMidia(p.base), LARGURA_MINIATURA, 60)
    if (url) mapa[p.caminho.join('/')] = url
  }
  return mapa
}

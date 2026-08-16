/**
 * Ponte entre Aulas e /materiais (§2).
 *
 * O pedido era acabar com a separação entre os dois sistemas sem criar conteúdo
 * duplicado. A tentação óbvia — copiar o vídeo do material para dentro da aula,
 * ou vice-versa — resolve a tela de hoje e cria o problema de amanhã: dois
 * registros do mesmo vídeo que divergem na primeira vez que alguém troca o
 * embed em um lugar só. Quem assiste passa a ver uma versão, quem compra vê
 * outra, e ninguém sabe qual é a certa.
 *
 * O modelo aqui é outro: **um conteúdo, dois lugares**. A aula é o registro
 * canônico do conteúdo; o material é a embalagem comercial. O vínculo entre os
 * dois é uma referência, e ele responde duas perguntas independentes:
 *
 *   • `liberaPorCompra` — comprar o material dá acesso à aula?
 *   • `conteudoDoMaterial` — o vídeo da aula vem do material?
 *
 * São independentes de propósito, porque os dois casos que você descreveu são
 * diferentes:
 *
 *   • aula do curso que passa a ser vendida avulsa → `liberaPorCompra`, com o
 *     vídeo continuando na aula;
 *   • vídeo-aula que já era vendida em /materiais e agora precisa aparecer
 *     dentro do curso → `conteudoDoMaterial`, para o embed seguir tendo dono
 *     único.
 *
 * Módulo puro: recebe o vínculo e o que foi resolvido do banco, devolve regras
 * e origem do conteúdo. Quem consulta pacotes e materiais é o chamador.
 */

import type { CondicaoAcesso, RegrasDeAcessoAula } from '@/lib/aulas/acesso'
import { regrasDaAula } from '@/lib/aulas/acesso'

export interface VinculoMaterialDaAula {
  materialId: string
  /** Só para exibição — o cadeado diz "faz parte de X" sem outra consulta. */
  materialTitulo?: string
  /** Comprar o material (ou um pacote que o contenha) libera a aula. */
  liberaPorCompra: boolean
  /** O vídeo/capa/duração vêm do material, que passa a ser a fonte única. */
  conteudoDoMaterial: boolean
}

export interface AulaComVinculo {
  visibilidade?: string
  regrasAcesso?: RegrasDeAcessoAula | null
  vinculoMaterial?: VinculoMaterialDaAula | null
}

/**
 * Regras de acesso da aula já somadas ao vínculo comercial.
 *
 * O acréscimo é sempre em **OU**: quem já tinha direito pela regra original
 * (assinante, turma, aula gratuita) continua tendo. Comprar o material é mais
 * um caminho de entrada, nunca uma restrição nova — tratar a venda como
 * substituição tiraria o acesso de quem já assistia pela assinatura.
 *
 * `pacoteIds` são os pacotes que contêm o material: quem comprou o combo
 * também entra, sem o admin precisar cadastrar cada pacote na aula.
 */
export function regrasComVinculo(
  aula: AulaComVinculo,
  pacoteIds: string[] = [],
): RegrasDeAcessoAula {
  const base = regrasDaAula(aula as any)
  const vinculo = aula.vinculoMaterial

  if (!vinculo?.materialId || !vinculo.liberaPorCompra) return base

  const novas: CondicaoAcesso[] = [
    { tipo: 'material', itemId: vinculo.materialId, titulo: vinculo.materialTitulo },
    ...pacoteIds.map((id): CondicaoAcesso => ({
      tipo: 'pacote',
      itemId: id,
      titulo: vinculo.materialTitulo,
    })),
  ]

  // Deduplica por tipo+id: o mesmo material podia já estar listado à mão nas
  // regras, e condição repetida vira botão repetido no cadeado.
  const vistas = new Set(
    base.liberarPara.map((c) => `${c.tipo}:${(c as any).itemId || (c as any).grupoId || ''}`),
  )
  const acrescimo = novas.filter((c) => {
    const chave = `${c.tipo}:${(c as any).itemId}`
    if (vistas.has(chave)) return false
    vistas.add(chave)
    return true
  })

  return { ...base, liberarPara: [...base.liberarPara, ...acrescimo] }
}

/* =================== ORIGEM DO CONTEÚDO =================== */

export interface ConteudoResolvido {
  videoEmbed?: string
  capa?: unknown
  duracaoSegundos?: number
  /** De onde saiu o conteúdo — a tela do admin mostra isso explicitamente. */
  origem: 'aula' | 'material'
}

export interface MaterialDeVideo {
  _id?: unknown
  title?: string
  type?: string
  downloadUrl?: string
  previewUrl?: string
  coverImage?: string
  videoDuration?: number
}

/** O material é uma vídeo-aula (e portanto pode virar conteúdo de aula)? */
export function ehMaterialDeVideo(material: Pick<MaterialDeVideo, 'type'> | null | undefined): boolean {
  const tipo = String(material?.type || '')
  return tipo === 'video' || tipo === 'video_embed'
}

/**
 * De onde o player deve puxar o vídeo.
 *
 * Com `conteudoDoMaterial`, o material manda — é ele que tem dono único do
 * embed. Se o vínculo aponta para um material que não é vídeo (o admin trocou
 * o tipo depois, por exemplo), caímos de volta na aula em vez de exibir um
 * player vazio: perder o vínculo é um problema de configuração, tela em branco
 * é um problema do aluno.
 */
export function resolverConteudo(
  aula: { videoEmbed?: string; capa?: unknown },
  vinculo: VinculoMaterialDaAula | null | undefined,
  material: MaterialDeVideo | null | undefined,
): ConteudoResolvido {
  const usarMaterial = vinculo?.conteudoDoMaterial === true && ehMaterialDeVideo(material)

  if (usarMaterial && material) {
    const embed = material.downloadUrl || material.previewUrl || ''
    if (embed) {
      return {
        videoEmbed: embed,
        capa: material.coverImage ? { tipo: 'imagem', imagem: material.coverImage } : aula.capa,
        duracaoSegundos: material.videoDuration,
        origem: 'material',
      }
    }
  }

  return { videoEmbed: aula.videoEmbed, capa: aula.capa, origem: 'aula' }
}

/* =================== SENTIDO INVERSO =================== */

/**
 * As aulas que uma compra de material libera.
 *
 * Serve à página do material ("inclui estas aulas") e à checagem de acesso na
 * direção contrária. Recebe as aulas já carregadas para não esconder consulta
 * dentro de função pura.
 */
export function aulasLiberadasPeloMaterial<T extends AulaComVinculo & { _id?: unknown; titulo?: string }>(
  aulas: T[],
  materialId: string,
): T[] {
  if (!materialId) return []
  return aulas.filter(
    (aula) =>
      aula.vinculoMaterial?.materialId === materialId &&
      aula.vinculoMaterial?.liberaPorCompra === true,
  )
}

/**
 * O vínculo está saudável?
 *
 * Existe para o admin ver o problema antes do aluno: um vínculo que promete
 * conteúdo de um material sem vídeo, ou que libera compra de um material que
 * foi apagado, só aparece como tela quebrada lá na frente.
 */
export function diagnosticarVinculo(
  vinculo: VinculoMaterialDaAula | null | undefined,
  material: MaterialDeVideo | null | undefined,
): { ok: boolean; alerta?: string } {
  if (!vinculo?.materialId) return { ok: true }

  if (!material) {
    return { ok: false, alerta: 'O material vinculado não existe mais. A aula voltou a valer só pelas regras próprias.' }
  }
  if (vinculo.conteudoDoMaterial && !ehMaterialDeVideo(material)) {
    return {
      ok: false,
      alerta: `"${material.title || 'O material'}" não é uma vídeo-aula, então o vídeo continua vindo da própria aula.`,
    }
  }
  return { ok: true }
}

import 'server-only'
import { ObjectId, type Db } from 'mongodb'

import { COLECOES } from '@/lib/ensino/compatibilidade'
import { gerarSlug, slugUnico, type NivelDeEnsino } from '@/lib/ensino/taxonomia'
import { normalizarEtapas, novoIdLocal } from '@/lib/ensino/trilha'
import type { PacoteDeImportacao } from '@/lib/ensino/importacao'

/**
 * A aplicação de um pacote de importação contra o banco.
 *
 * SEPARADO DO ANALISADOR DE PROPÓSITO
 *
 * `importacao.ts` é puro e responde "o que este arquivo diz". Este arquivo
 * responde "o que fazer com o banco que já existe", que é a parte que precisa
 * de cuidado — porque é aqui que uma reimportação decide entre atualizar e
 * duplicar.
 *
 * A REGRA DA IDENTIDADE
 *
 * Nó e Trilha se identificam pelo SLUG. Aula se identifica pelo TÍTULO
 * normalizado, porque aula não tem slug no modelo (o endereço dela é o id, e
 * mudar isso quebraria todo link já compartilhado). O efeito prático é o
 * mesmo: rodar o arquivo de novo depois de corrigir uma linha atualiza os
 * registros, e não cria uma segunda cópia de cada aula.
 *
 * O ENSAIO É OBRIGATÓRIO NA INTERFACE
 *
 * `aplicar` funciona com `ensaio: true` sem escrever nada, devolvendo exatamente
 * o mesmo relatório que a execução real devolveria. É o que permite o admin ver
 * "12 aulas novas, 3 atualizadas, 1 Trilha nova" antes de confirmar — e é a
 * única defesa razoável contra um arquivo com o nome errado no cabeçalho.
 */

export interface RelatorioDeImportacao {
  ensaio: boolean
  nos: { criados: number; atualizados: number; nomes: string[] }
  aulas: { criadas: number; atualizadas: number; titulos: string[] }
  resumos: { criados: number; vinculados: number }
  trilhas: { criadas: number; atualizadas: number; titulos: string[] }
  /** Aulas citadas por Trilhas que não existem nem no arquivo nem no banco. */
  naoResolvidas: string[]
  avisos: string[]
}

const chaveDeTitulo = (titulo: string) => gerarSlug(titulo)

/**
 * Traduz a palavra de acesso do arquivo para as regras do motor.
 *
 * O vocabulário do arquivo é o do professor ("plus", "gratuita", "amostra"), e
 * não o do modelo de dados. Escrever `{"liberarPara":[{"tipo":"plus"}]}` num
 * arquivo de plano de aula seria pedir que quem produz conteúdo conheça o
 * formato interno de permissão.
 */
function regrasDePalavra(palavra?: string) {
  switch (palavra) {
    case 'publica':
    case 'publico':
      return { liberarPara: [{ tipo: 'publico' as const }] }
    case 'gratuita':
    case 'cadastrado':
      return { liberarPara: [{ tipo: 'cadastrado' as const }] }
    case 'plus':
    case 'assinante':
      return { liberarPara: [{ tipo: 'plus' as const }] }
    case 'amostra':
      return { liberarPara: [{ tipo: 'plus' as const }], amostra: true }
    default:
      return null
  }
}

export async function aplicarPacote(
  db: Db,
  pacote: PacoteDeImportacao,
  opcoes: { ensaio?: boolean; criadoPor?: string } = {},
): Promise<RelatorioDeImportacao> {
  const ensaio = opcoes.ensaio !== false
  const relatorio: RelatorioDeImportacao = {
    ensaio,
    nos: { criados: 0, atualizados: 0, nomes: [] },
    aulas: { criadas: 0, atualizadas: 0, titulos: [] },
    resumos: { criados: 0, vinculados: 0 },
    trilhas: { criadas: 0, atualizadas: 0, titulos: [] },
    naoResolvidas: [],
    avisos: [...pacote.avisos],
  }

  const agora = new Date()

  /* =================== 1. TAXONOMIA =================== */

  const nosExistentes = await db.collection(COLECOES.nos).find({}).toArray()
  const slugsUsados = new Set(nosExistentes.map((n: any) => n.slug))

  /** slug → id, incluindo o que este pacote acabou de criar. */
  const idPorSlug = new Map<string, string>(
    nosExistentes.map((n: any) => [n.slug, String(n._id)]),
  )
  /** Nome normalizado → id, para resolver o caminho escrito em português. */
  const idPorNome = new Map<string, string>(
    nosExistentes.map((n: any) => [chaveDeTitulo(n.nome), String(n._id)]),
  )

  const NIVEL_POR_PROFUNDIDADE: NivelDeEnsino[] = ['area', 'modulo', 'topico', 'subtopico']

  /**
   * Garante que um caminho inteiro exista, criando só o que falta.
   *
   * É esta função que torna o arquivo de importação simples de escrever: a
   * aula declara `Medicina > Ciclo Clínico > Cardiologia` e não precisa saber
   * se esses três níveis já existem. Sem ela, todo arquivo teria de repetir a
   * taxonomia inteira ou falhar quando um degrau faltasse.
   *
   * O nível de cada nó vem da POSIÇÃO no caminho, e não de um rótulo declarado
   * à parte. É a única leitura que não pode se contradizer: `Medicina > Ciclo
   * Clínico > Cardiologia` só tem uma interpretação possível, enquanto um campo
   * `nivel` separado poderia dizer "subtópico" para o segundo nome do caminho e
   * deixar a árvore impossível de desenhar.
   */
  const garantirCaminho = async (nomes: string[]): Promise<Record<string, string | null>> => {
    const saida: Record<string, string | null> = {
      areaId: null,
      moduloId: null,
      topicoId: null,
      subtopicoId: null,
    }

    let paiId: string | null = null
    for (let i = 0; i < Math.min(nomes.length, 4); i++) {
      const nome = String(nomes[i] || '').trim()
      if (!nome) break
      const nivel = NIVEL_POR_PROFUNDIDADE[i]
      const chave = chaveDeTitulo(nome)

      let id = idPorNome.get(chave) || idPorSlug.get(chave) || null

      if (!id) {
        const slug = slugUnico(gerarSlug(nome), slugsUsados)
        slugsUsados.add(slug)
        const documento = {
          nivel,
          paiId,
          nome,
          slug,
          ordem: 0,
          oculto: false,
          criadoEm: agora,
          atualizadoEm: agora,
        }
        if (ensaio) {
          // No ensaio o id é fictício: ele só precisa ser único dentro do
          // relatório, para o resto do plano se encaixar e os números baterem.
          id = `ensaio:${slug}`
        } else {
          const r = await db.collection(COLECOES.nos).insertOne(documento as any)
          id = String(r.insertedId)
        }
        idPorNome.set(chave, id)
        idPorSlug.set(slug, id)
        relatorio.nos.criados += 1
        if (relatorio.nos.nomes.length < 50) relatorio.nos.nomes.push(nome)
      }

      saida[`${nivel}Id`] = id
      paiId = id
    }

    return saida
  }

  for (const no of pacote.nos) {
    await garantirCaminho([...no.caminho, no.nome])
  }

  /* =================== 2. AULAS =================== */

  const aulasExistentes = await db
    .collection(COLECOES.aulas)
    .find({}, { projection: { titulo: 1, ensino: 1 } })
    .toArray()

  const idPorTitulo = new Map<string, string>()
  for (const aula of aulasExistentes as any[]) {
    const chave = chaveDeTitulo(aula.titulo || '')
    // Em título repetido vence a PRIMEIRA: preferir a mais antiga mantém o
    // vínculo com o histórico de progresso de quem já assistiu.
    if (chave && !idPorTitulo.has(chave)) idPorTitulo.set(chave, String(aula._id))
  }

  /** Resolve por título, incluindo o que este pacote criou. */
  const acharAula = (titulo: string) => idPorTitulo.get(chaveDeTitulo(titulo)) || null

  // Duas passadas: primeiro todas as aulas existem, depois as relações entre
  // elas são gravadas. Sem isso, um pré-requisito citando uma aula que aparece
  // adiante no arquivo se perderia.
  const criadas: Array<{ importada: (typeof pacote.aulas)[number]; id: string }> = []

  for (const importada of pacote.aulas) {
    const localizacao = await garantirCaminho(importada.caminho)
    const existente = acharAula(importada.titulo)

    const blocoEnsino: Record<string, any> = {
      tipo: 'aula',
      ...localizacao,
      tags: importada.tags,
      profundidade: importada.profundidade,
      duracaoSegundos: importada.duracaoSegundos || undefined,
      atualizadoEm: agora,
    }

    if (existente) {
      relatorio.aulas.atualizadas += 1
      if (!ensaio) {
        const mudanca: Record<string, any> = { atualizadoEm: agora }
        for (const [campo, valor] of Object.entries(blocoEnsino)) {
          // Campo ausente no arquivo não apaga o que já está cadastrado: a
          // importação incremental é o caso normal — um arquivo com 5 aulas
          // novas não pode zerar as tags das outras 40.
          if (valor !== undefined && valor !== null) mudanca[`ensino.${campo}`] = valor
        }
        if (importada.descricao) mudanca.descricao = importada.descricao
        if (importada.video) mudanca.videoEmbed = importada.video
        await db
          .collection(COLECOES.aulas)
          .updateOne({ _id: new ObjectId(existente) }, { $set: mudanca })
      }
      criadas.push({ importada, id: existente })
      continue
    }

    const documento: Record<string, any> = {
      titulo: importada.titulo,
      descricao: importada.descricao || '',
      tipo: 'gravada',
      visibilidade: importada.acesso === 'gratuita' ? 'gratuita' : 'plus',
      regrasAcesso: regrasDePalavra(importada.acesso),
      videoEmbed: importada.video || '',
      pdfs: importada.pdfs.map((p) => ({ nome: p.nome, url: p.url, tamanho: 0 })),
      // Aula importada nasce PUBLICADA com data no passado: o arquivo é o
      // trabalho já pronto, e obrigar a publicar 40 aulas à mão depois de
      // importá-las anularia o ganho do importador.
      dataLiberacao: new Date('2000-01-01'),
      oculta: false,
      ordem: 0,
      comentarios: [],
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: opcoes.criadoPor,
      ensino: blocoEnsino,
    }

    let id: string
    if (ensaio) {
      id = `ensaio:${importada.slug}`
    } else {
      const r = await db.collection(COLECOES.aulas).insertOne(documento as any)
      id = String(r.insertedId)
    }

    idPorTitulo.set(chaveDeTitulo(importada.titulo), id)
    relatorio.aulas.criadas += 1
    if (relatorio.aulas.titulos.length < 80) relatorio.aulas.titulos.push(importada.titulo)
    criadas.push({ importada, id })
  }

  /* --- Aula Resumo, pré-requisitos e relacionadas ---------------------- */

  for (const { importada, id } of criadas) {
    const mudanca: Record<string, any> = {}

    if (importada.resumo) {
      const jaExiste = acharAula(importada.resumo.titulo)
      if (jaExiste) {
        relatorio.resumos.vinculados += 1
        mudanca['ensino.resumoId'] = jaExiste
        if (!ensaio && ObjectId.isValid(jaExiste)) {
          await db.collection(COLECOES.aulas).updateOne(
            { _id: new ObjectId(jaExiste) },
            { $set: { 'ensino.tipo': 'resumo', 'ensino.aulaPrincipalId': id } },
          )
        }
      } else {
        relatorio.resumos.criados += 1
        // O resumo é uma AULA com `tipo: 'resumo'` (§3): ganha player,
        // progresso e acesso de graça, sem virar um segundo tipo de conteúdo.
        const documento: Record<string, any> = {
          titulo: importada.resumo.titulo,
          tipo: 'gravada',
          visibilidade: importada.acesso === 'gratuita' ? 'gratuita' : 'plus',
          regrasAcesso: regrasDePalavra(importada.acesso),
          videoEmbed: importada.resumo.video || '',
          pdfs: [],
          dataLiberacao: new Date('2000-01-01'),
          oculta: false,
          ordem: 0,
          comentarios: [],
          criadoEm: agora,
          atualizadoEm: agora,
          ensino: {
            tipo: 'resumo',
            aulaPrincipalId: id,
            duracaoSegundos: importada.resumo.duracaoSegundos || undefined,
            atualizadoEm: agora,
          },
        }
        if (!ensaio) {
          const r = await db.collection(COLECOES.aulas).insertOne(documento as any)
          mudanca['ensino.resumoId'] = String(r.insertedId)
          idPorTitulo.set(chaveDeTitulo(importada.resumo.titulo), String(r.insertedId))
        }
      }
    }

    const prerequisitos = importada.prerequisitos.map(acharAula).filter(Boolean) as string[]
    const relacionadas = importada.relacionadas.map(acharAula).filter(Boolean) as string[]
    if (prerequisitos.length > 0) mudanca['ensino.prerequisitos'] = prerequisitos
    if (relacionadas.length > 0) mudanca.relacionadas = relacionadas

    for (const titulo of [...importada.prerequisitos, ...importada.relacionadas]) {
      if (!acharAula(titulo) && !relatorio.naoResolvidas.includes(titulo)) {
        relatorio.naoResolvidas.push(titulo)
      }
    }

    if (!ensaio && Object.keys(mudanca).length > 0 && ObjectId.isValid(id)) {
      await db.collection(COLECOES.aulas).updateOne({ _id: new ObjectId(id) }, { $set: mudanca })
    }
  }

  /* =================== 3. TRILHAS =================== */

  const trilhasExistentes = await db
    .collection(COLECOES.trilhas)
    .find({}, { projection: { slug: 1 } })
    .toArray()
  const slugsDeTrilha = new Set(trilhasExistentes.map((t: any) => t.slug))
  const idDaTrilhaPorSlug = new Map(trilhasExistentes.map((t: any) => [t.slug, String(t._id)]))

  for (const importada of pacote.trilhas) {
    const etapas = normalizarEtapas(
      importada.etapas.map((etapa) => ({
        id: novoIdLocal(),
        titulo: etapa.titulo,
        descricao: etapa.descricao,
        itens: etapa.aulas
          .map((titulo) => {
            const refId = acharAula(titulo)
            if (!refId) {
              if (!relatorio.naoResolvidas.includes(titulo)) relatorio.naoResolvidas.push(titulo)
              return null
            }
            // `rotulo` aqui não é para exibir por cima do título — a aula
            // sempre resolve e mostra o próprio título quando existe (ver
            // `ItemDaEtapa.rotulo`). É o retrato do título NO MOMENTO da
            // importação: se um dia este id parar de resolver (a aula foi
            // apagada por um caminho que não limpou a referência, por
            // exemplo), é o que permite a auditoria de Trilhas propor uma
            // recuperação por título em vez de um item mudo (§ ver
            // app/api/ensino/trilhas/auditoria/route.ts).
            return { id: novoIdLocal('i'), tipo: 'aula', refId, rotulo: titulo, obrigatorio: true }
          })
          .filter(Boolean),
      })),
    )

    const dados: Record<string, any> = {
      titulo: importada.titulo,
      subtitulo: importada.subtitulo || null,
      descricao: importada.descricao || null,
      objetivo: importada.objetivo || null,
      publico: importada.publico || null,
      nivel: importada.nivel || null,
      duracaoEstimadaMin: importada.duracaoEstimadaMin || undefined,
      aprendizados: importada.aprendizados,
      tags: importada.tags,
      certificado: importada.certificado ? { ativo: true } : null,
      etapas,
      atualizadoEm: agora,
    }

    const existente = idDaTrilhaPorSlug.get(importada.slug)
    if (existente) {
      relatorio.trilhas.atualizadas += 1
      if (!ensaio) {
        await db
          .collection(COLECOES.trilhas)
          .updateOne({ _id: new ObjectId(existente) }, { $set: dados })
      }
      continue
    }

    relatorio.trilhas.criadas += 1
    relatorio.trilhas.titulos.push(importada.titulo)
    if (!ensaio) {
      const slug = slugUnico(importada.slug, slugsDeTrilha)
      slugsDeTrilha.add(slug)
      await db.collection(COLECOES.trilhas).insertOne({
        ...dados,
        slug,
        // Trilha importada nasce em RASCUNHO, ao contrário das aulas: publicar
        // um caminho é uma decisão editorial (a ordem faz sentido? falta
        // etapa?), e o arquivo não tem como responder isso.
        situacao: 'rascunho',
        ordem: 0,
        criadoEm: agora,
        publicadaEm: null,
      } as any)
    }
  }

  return relatorio
}

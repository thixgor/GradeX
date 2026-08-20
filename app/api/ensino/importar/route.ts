import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES, planejarMigracao, resolverLocalizacao } from '@/lib/ensino/compatibilidade'
import { conferirPacote, lerPacote } from '@/lib/ensino/importacao'
import { aplicarPacote } from '@/lib/ensino/importacao-servidor'
import { garantirIndicesDeEnsino, podeEditarEnsino } from '@/lib/ensino/repositorio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Um arquivo de importação plausível tem KBs, não MBs. */
const TAMANHO_MAXIMO = 2 * 1024 * 1024

/**
 * Importação de conteúdo e migração do acervo antigo (§30, §36).
 *
 * DUAS OPERAÇÕES, UMA ROTA, O MESMO CONTRATO
 *
 *  • `acao: 'importar'` — lê um arquivo (Markdown ou JSON) e cria/atualiza
 *    níveis, aulas, resumos e Trilhas;
 *  • `acao: 'migrar'` — lê a hierarquia ANTIGA e propõe a mesma coisa a partir
 *    dela.
 *
 * As duas obedecem à mesma regra: com `ensaio: true` (o padrão) nada é escrito
 * e o relatório é idêntico ao que a execução real produziria. A tela sempre
 * ensaia primeiro. Uma importação que escreve antes de o admin ver o que vai
 * acontecer é a forma mais rápida de duplicar um acervo inteiro.
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json()
    const ensaio = corpo?.ensaio !== false
    const acao = corpo?.acao === 'migrar' ? 'migrar' : 'importar'

    if (acao === 'migrar') {
      return NextResponse.json(await migrarAcervoAntigo(db, ensaio))
    }

    const fonte = String(corpo?.conteudo || '')
    if (!fonte.trim()) {
      return NextResponse.json({ error: 'Envie o conteúdo do arquivo.' }, { status: 400 })
    }
    if (fonte.length > TAMANHO_MAXIMO) {
      return NextResponse.json(
        { error: 'Arquivo grande demais. Divida a importação em partes.' },
        { status: 413 },
      )
    }

    const pacote = lerPacote(fonte)
    const conferencia = conferirPacote(pacote)

    // Arquivo que não produziu nada quase sempre é formato errado — e um
    // relatório de zeros não ajuda ninguém a descobrir isso.
    if (pacote.nos.length + pacote.aulas.length + pacote.trilhas.length === 0) {
      return NextResponse.json(
        {
          error: 'Nada foi reconhecido no arquivo. Confira o formato em docs/formato-importacao-aulas.md.',
          conferencia,
          avisos: pacote.avisos,
        },
        { status: 400 },
      )
    }

    const relatorio = await aplicarPacote(db, pacote, { ensaio, criadoPor: sessao?.userId })
    if (!ensaio) await garantirIndicesDeEnsino(db)

    return NextResponse.json({ relatorio, conferencia })
  } catch (erro) {
    console.error('[ensino/importar] POST:', erro)
    return NextResponse.json({ error: 'Erro ao importar' }, { status: 500 })
  }
}

/**
 * Traz o acervo já cadastrado para a taxonomia nova.
 *
 * Nada é apagado e nada é movido: as coleções antigas continuam intactas, e a
 * aula passa a ter as DUAS localizações. É o que permite a área antiga
 * continuar funcionando enquanto a nova entra no ar — e o que torna a operação
 * segura de repetir depois de cadastrar mais conteúdo pelo caminho antigo.
 */
async function migrarAcervoAntigo(db: any, ensaio: boolean) {
  const [setores, topicos, subtopicos, modulos, submodulos, aulas] = await Promise.all([
    db.collection(COLECOES.legadoSetores).find({}).toArray(),
    db.collection(COLECOES.legadoTopicos).find({}).toArray(),
    db.collection(COLECOES.legadoSubtopicos).find({}).toArray(),
    db.collection(COLECOES.legadoModulos).find({}).toArray(),
    db.collection(COLECOES.legadoSubmodulos).find({}).toArray(),
    db
      .collection(COLECOES.aulas)
      .find(
        {},
        {
          projection: {
            titulo: 1,
            setorId: 1,
            topicoId: 1,
            subtopicoId: 1,
            moduloId: 1,
            submoduloId: 1,
            ensino: 1,
          },
        },
      )
      .toArray(),
  ])

  const emTexto = (lista: any[]) =>
    lista.map((item) => ({ ...item, _id: String(item._id) }))

  const plano = planejarMigracao({
    setores: emTexto(setores),
    topicos: emTexto(topicos),
    subtopicos: emTexto(subtopicos),
    modulos: emTexto(modulos),
    submodulos: emTexto(submodulos),
    aulas: emTexto(aulas),
  })

  if (ensaio) {
    return {
      ensaio: true,
      plano: {
        nos: plano.nos.length,
        aulas: plano.aulas.length,
        semLocalizacao: plano.semLocalizacao,
        jaMigradas: plano.jaMigradas,
        // Uma amostra basta para o admin conferir a tradução dos níveis; a
        // lista inteira de 300 nós na tela seria ilegível.
        amostra: plano.nos.slice(0, 40).map((n) => ({ nome: n.nome, nivel: n.nivel })),
      },
    }
  }

  /* --- Criação dos nós, dos mais rasos para os mais fundos ------------- */

  const idPorChave = new Map<string, string>()
  const agora = new Date()
  const usados = new Set<string>(
    (await db.collection(COLECOES.nos).find({}, { projection: { slug: 1 } }).toArray()).map(
      (n: any) => n.slug,
    ),
  )

  const ordemDosNiveis = ['area', 'modulo', 'topico', 'subtopico']
  for (const nivel of ordemDosNiveis) {
    for (const no of plano.nos.filter((n) => n.nivel === nivel)) {
      // Reencontra pelo slug antes de criar: rodar a migração duas vezes não
      // pode produzir duas "Cardiologia".
      const existente = await db.collection(COLECOES.nos).findOne({ slug: no.slug })
      if (existente) {
        idPorChave.set(no.chave, String(existente._id))
        continue
      }
      let slug = no.slug
      while (usados.has(slug)) slug = `${no.slug}-${Math.random().toString(36).slice(2, 5)}`
      usados.add(slug)

      const resultado = await db.collection(COLECOES.nos).insertOne({
        nivel: no.nivel,
        paiId: no.paiChave ? idPorChave.get(no.paiChave) || null : null,
        nome: no.nome,
        slug,
        ordem: no.ordem,
        oculto: false,
        origemLegado: no.origem,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      idPorChave.set(no.chave, String(resultado.insertedId))
    }
  }

  /* --- Localização das aulas ------------------------------------------ */

  const operacoes = plano.aulas
    .filter((a) => ObjectId.isValid(a.aulaId))
    .map((a) => {
      const localizacao = resolverLocalizacao(a.localizacao, idPorChave)
      return {
        updateOne: {
          filter: { _id: new ObjectId(a.aulaId) },
          update: {
            $set: {
              'ensino.tipo': 'aula',
              'ensino.areaId': localizacao.areaId,
              'ensino.moduloId': localizacao.moduloId,
              'ensino.topicoId': localizacao.topicoId,
              'ensino.subtopicoId': localizacao.subtopicoId,
              'ensino.atualizadoEm': agora,
            },
          },
        },
      }
    })

  // Em lotes: um bulkWrite com milhares de operações estoura o limite do
  // driver, e a migração precisa funcionar num acervo grande.
  for (let i = 0; i < operacoes.length; i += 500) {
    await db.collection(COLECOES.aulas).bulkWrite(operacoes.slice(i, i + 500))
  }

  await garantirIndicesDeEnsino(db)

  return {
    ensaio: false,
    plano: {
      nos: idPorChave.size,
      aulas: operacoes.length,
      semLocalizacao: plano.semLocalizacao,
      jaMigradas: plano.jaMigradas,
    },
  }
}

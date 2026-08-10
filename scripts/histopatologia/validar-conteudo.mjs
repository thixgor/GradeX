/**
 * Validador editorial da Histopatologia.
 *
 *   node --experimental-strip-types --no-warnings scripts/histopatologia/validar-conteudo.mjs
 *
 * Roda **sobre os arquivos editoriais**, antes do pipeline, e responde a uma
 * pergunta só: este conteúdo pode ser publicado como está?
 *
 * É deliberadamente separado de `construir-dados.mjs`. O pipeline responde por
 * conciliação de dados — hashes, contagens, allowlist. Este script responde por
 * qualidade editorial, e é o que alguém roda enquanto escreve uma doença nova,
 * sem precisar reprocessar 202 mil referências a cada salvamento.
 *
 * Ele **não aprova conteúdo**: nenhum script pode substituir revisão por
 * profissional habilitado. Ele apenas garante que nada seja marcado como
 * publicado sem o conjunto mínimo exigido pelo plano, e aponta problemas de
 * forma que a revisão humana não deveria precisar caçar.
 */

import process from 'node:process'

import { esquemaDoencaCanonica, validarPublicacao } from '../../lib/histopatologia/esquemas.ts'
import { DOENCAS, ENTRADAS_NAO_NOSOLOGICAS } from '../../lib/histopatologia/editorial/index.ts'
import { MECANISMOS } from '../../lib/histopatologia/editorial/mecanismos.ts'
import { SISTEMAS } from '../../lib/histopatologia/editorial/sistemas.ts'

const erros = []
const avisos = []

/** Ordem canônica da cadeia causal. Uma cadeia fora de ordem confunde. */
const ORDEM_DA_CADEIA = [
  'gatilho',
  'alvo',
  'resposta-celular',
  'resposta-tecidual',
  'morfologia',
  'disfuncao',
  'clinica',
  'complicacao',
]

/**
 * Termos que a documentação pede para não usar sem base robusta.
 *
 * Não é censura de vocabulário: "patognomônico" tem uso legítimo. O que o
 * validador faz é exigir que a afirmação venha acompanhada do peso diagnóstico
 * correspondente no campo estruturado — dizer "patognomônico" num parágrafo e
 * marcar o achado como "frequente" é uma contradição que só um leitor atento
 * pegaria.
 */
const TERMOS_FORTES = ['patognomôni', 'patognomoni', 'sempre indica', 'nunca ocorre', 'exclui o diagnóstico']

for (const bruta of DOENCAS) {
  const resultado = esquemaDoencaCanonica.safeParse(bruta)
  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      erros.push(`${bruta?.slug ?? '?'}: ${issue.path.join('.')} — ${issue.message}`)
    }
    continue
  }

  const doenca = resultado.data
  const c = doenca.conteudo
  const onde = (mensagem) => `${doenca.slug}: ${mensagem}`

  /* ── Portão de publicação ── */
  for (const falta of validarPublicacao(doenca)) {
    erros.push(onde(`marcada como publicada sem ${falta}.`))
  }

  /* ── Referências cruzadas ── */
  if (!SISTEMAS.some((s) => s.id === doenca.sistemaId)) {
    erros.push(onde(`sistema inexistente: ${doenca.sistemaId}`))
  }
  for (const id of doenca.mecanismoIds) {
    if (!MECANISMOS.some((m) => m.id === id)) erros.push(onde(`mecanismo inexistente: ${id}`))
  }
  for (const aplicacao of c.mecanismoPatologicoGeral) {
    if (!MECANISMOS.some((m) => m.id === aplicacao.mecanismoId)) {
      erros.push(onde(`aplicação aponta para mecanismo inexistente: ${aplicacao.mecanismoId}`))
    }
    if (!doenca.mecanismoIds.includes(aplicacao.mecanismoId)) {
      avisos.push(
        onde(
          `aplica o mecanismo ${aplicacao.mecanismoId} mas não o declara em mecanismoIds — ` +
            'ele não vai aparecer na navegação por mecanismo.',
        ),
      )
    }
  }
  for (const diferencial of c.diagnosticosDiferenciais) {
    if (diferencial.slug && !DOENCAS.some((d) => d.slug === diferencial.slug)) {
      erros.push(onde(`diferencial aponta para doença inexistente: ${diferencial.slug}`))
    }
  }

  /* ── Cadeia causal ── */
  if (c.fisiopatologiaEspecifica.length > 0) {
    let anterior = -1
    for (const etapa of c.fisiopatologiaEspecifica) {
      const posicao = ORDEM_DA_CADEIA.indexOf(etapa.etapa)
      if (posicao < anterior) {
        avisos.push(
          onde(
            `a cadeia causal volta atrás em "${etapa.titulo}" (${etapa.etapa} depois de ` +
              `${ORDEM_DA_CADEIA[anterior]}). Confirme se a ordem é intencional.`,
          ),
        )
      }
      anterior = Math.max(anterior, posicao)
      if (etapa.porQue.trim().length < 40) {
        avisos.push(
          onde(`a etapa "${etapa.titulo}" tem explicação causal muito curta para ser causal.`),
        )
      }
    }
    if (!c.fisiopatologiaEspecifica.some((e) => e.etapa === 'gatilho')) {
      avisos.push(onde('a cadeia causal não começa por um gatilho.'))
    }
  }

  /* ── Referência normal ── */
  for (const ref of c.histologiaNormalDeReferencia) {
    if (ref.aproximado && !ref.notaDeAproximacao) {
      erros.push(onde(`referência normal "${ref.titulo}" é aproximada e não explica por quê.`))
    }
  }

  /* ── Afirmações fortes ── */
  const textoInteiro = JSON.stringify(c).toLowerCase()
  for (const termo of TERMOS_FORTES) {
    if (textoInteiro.includes(termo)) {
      const temSuficiente = [
        ...(c.histopatologia
          ? [
              ...c.histopatologia.panoramica.achados,
              ...c.histopatologia.pequeno.achados,
              ...c.histopatologia.medio.achados,
              ...c.histopatologia.grande.achados,
            ]
          : []),
        ...c.macroscopia,
      ].some((a) => a.peso === 'suficiente')
      if (!temSuficiente) {
        avisos.push(
          onde(
            `usa a expressão "${termo}" sem que nenhum achado esteja marcado com peso ` +
              '"suficiente". Confira se a afirmação se sustenta.',
          ),
        )
      }
    }
  }

  /* ── Autoavaliação ── */
  for (const pergunta of c.perguntasDeAutoavaliacao) {
    if (pergunta.indiceCorreto >= pergunta.alternativas.length) {
      erros.push(onde(`pergunta com índice correto fora do intervalo: "${pergunta.pergunta}"`))
    }
    if (pergunta.devolutiva.trim().length < 80) {
      avisos.push(
        onde(
          `a devolutiva de "${pergunta.pergunta.slice(0, 50)}…" é curta demais para explicar ` +
            'por que as erradas estão erradas.',
        ),
      )
    }
  }

  /* ── Revisão ── */
  if (doenca.revisao.estado !== 'publicado' && doenca.revisao.pendencias.length === 0) {
    avisos.push(onde('não está publicada e não registra nenhuma pendência. O que falta?'))
  }
}

/* ── Consistência global ── */
const slugs = DOENCAS.map((d) => d.slug)
for (const slug of slugs) {
  if (slugs.filter((s) => s === slug).length > 1) erros.push(`slug duplicado: ${slug}`)
}
const consolidadas = new Map()
for (const doenca of DOENCAS) {
  for (const id of doenca.catalogoIds ?? []) {
    if (consolidadas.has(id)) {
      erros.push(`entrada ${id} consolidada em duas doenças: ${consolidadas.get(id)} e ${doenca.slug}`)
    }
    consolidadas.set(id, doenca.slug)
  }
}
for (const registro of ENTRADAS_NAO_NOSOLOGICAS) {
  if (consolidadas.has(registro.catalogoId)) {
    erros.push(
      `entrada ${registro.catalogoId} está marcada como não nosológica e também consolidada em ` +
        `${consolidadas.get(registro.catalogoId)}.`,
    )
  }
}

/* ── Saída ── */
console.log(`Validando ${DOENCAS.length} doenças editoriais…`)
if (avisos.length > 0) {
  console.log(`\n${avisos.length} aviso(s):`)
  for (const aviso of avisos) console.log(`  • ${aviso}`)
}
if (erros.length > 0) {
  console.error(`\n${erros.length} erro(s) impedem a publicação:`)
  for (const erro of erros) console.error(`  ✕ ${erro}`)
  process.exit(1)
}
console.log(`\nConteúdo editorial válido. ${avisos.length} aviso(s), nenhum erro bloqueante.`)

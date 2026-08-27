/**
 * Pipeline da ementa dos cronogramas.
 *
 *   node scripts/cronogramas/construir-ementas.mjs
 *
 * Lê os arquivos de ementa em `public/*.md` — que são a fonte de verdade
 * mantida à mão pela coordenação — e escreve `data/cronogramas/ementas/*.json`,
 * um arquivo por curso, mais um `indice.json` leve para o cliente.
 *
 * Três decisões que valem explicação:
 *
 * 1. **Dois formatos de markdown, um parser.** Medicina usa árvore de caixa
 *    (`├─ Módulo:`), enquanto Psicologia/Biomedicina/Odontologia usam citação
 *    aninhada (`> > MÓDULO:`). Em ambos o NÍVEL vem escrito no rótulo, não na
 *    indentação — então o parser lê o rótulo e ignora o desenho. Isso é o que
 *    salva arquivos com indentação inconsistente (ver `MEDICINA - SOI V.md`,
 *    inteiro indentado com 4 espaços, e vários `└─` no lugar de `├─`).
 *
 * 2. **Prioridade é opcional e o padrão é "normal".** `(Prioridade: Alta)`
 *    aparece hoje só em SOI I e HAM I. Quem não declara nada entra como
 *    `normal`, exatamente como um item de prioridade média — o algoritmo de
 *    geração nunca precisa saber se o dado veio escrito ou assumido.
 *
 * 3. **Quando dois arquivos descrevem o mesmo bloco, vence o mais rico.**
 *    `MEDICINA SOI I.md` (com prioridades, 299 linhas) e `MEDICINA - SOI I.md`
 *    (sem, 88 linhas) são a mesma disciplina em duas gerações do documento.
 *    Escolher pelo nome do arquivo seria frágil; a escolha aqui é por conteúdo:
 *    prioridade declarada primeiro, contagem de nós como desempate.
 *
 * O script é idempotente e imprime a conciliação no fim.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ORIGEM = join(RAIZ, 'public')
const DESTINO = join(RAIZ, 'data', 'cronogramas', 'ementas')

/** Cursos com ementa por período. A ordem aqui é a ordem do seletor de seção. */
const CURSOS = [
  { id: 'medicina', nome: 'Medicina', arquivo: /^MEDICINA\b/i },
  { id: 'psicologia', nome: 'Psicologia', arquivo: /^PSICOLOGIA\b/i },
  { id: 'biomedicina', nome: 'Biomedicina', arquivo: /^BIOMEDICINA\b/i },
  { id: 'odontologia', nome: 'Odontologia', arquivo: /^ODONTOLOGIA\b/i },
]

const ROMANOS = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }

// ── Normalização de texto ───────────────────────────────────────────────────

function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function slug(texto) {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

/**
 * Separa o nome do item da prioridade declarada entre parênteses no fim.
 * "Ciclo celular (Prioridade: Alta)" → { nome: 'Ciclo celular', prioridade: 'alta' }
 */
function extrairPrioridade(bruto) {
  const nome = bruto.trim()
  const match = nome.match(/\s*\(\s*prioridade\s*:\s*([^)]+)\)\s*$/i)
  if (!match) return { nome: limparNome(nome), prioridade: 'normal' }

  const rotulo = semAcento(match[1]).trim().toLowerCase()
  const prioridade = rotulo.startsWith('alt')
    ? 'alta'
    : rotulo.startsWith('baix')
      ? 'baixa'
      : rotulo.startsWith('med')
        ? 'media'
        : 'normal'

  return { nome: limparNome(nome.slice(0, match.index)), prioridade }
}

/** Tira numeração de lista, pontuação solta e negrito residual do markdown. */
function limparNome(bruto) {
  return bruto
    .replace(/\*\*/g, '')
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/^[-–—•·]\s*/, '')
    .replace(/\s*[:–-]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Remove o desenho da árvore (│ ├ └ ─) e a indentação da esquerda. */
function tirarDesenho(linha) {
  return linha.replace(/^[\s│|]*[├└]?[─-]*\s*/, '').trim()
}

/** Remove os marcadores de citação (`> > >`) e devolve o texto. */
function tirarCitacao(linha) {
  return linha.replace(/^[\s>]+/, '').trim()
}

// ── Parser ──────────────────────────────────────────────────────────────────

/**
 * Lê um markdown de ementa e devolve `{ periodo, topicos }` cru — sem ids,
 * sem horas. Funciona nos dois formatos porque só olha para o rótulo do nível.
 */
function analisar(conteudo) {
  const topicos = []
  let periodoDeclarado = null

  let topicoAtual = null
  let subtopicoAtual = null
  let moduloAtual = null

  for (const linhaBruta of conteudo.split(/\r?\n/)) {
    const linha = linhaBruta.trim()
    if (!linha || /^-{3,}$/.test(linha)) continue

    // "## 3º PERÍODO" — cabeçalho de período dos arquivos em citação.
    const cabecalhoPeriodo = linha.match(/^#{1,6}\s*(\d{1,2})\s*[ºo°]?\s*per[ií]odo/i)
    if (cabecalhoPeriodo) {
      periodoDeclarado = Number(cabecalhoPeriodo[1])
      continue
    }

    // Título solto do documento ("# 🦷 ODONTOLOGIA", "PSICOLOGIA - 1° PERÍODO").
    if (/^#{1,6}\s/.test(linha) && !/t[óo]pico/i.test(linha)) continue

    const cru = linha.startsWith('>') ? tirarCitacao(linha) : tirarDesenho(linha)
    // O rótulo do nível pode vir embrulhado em negrito (`**TÓPICO: …**`, nos
    // arquivos em citação) ou atrás da numeração da lista (`1. Subtópico: …`,
    // em Medicina). Tirar os dois aqui é o que faz a detecção de nível
    // funcionar nos dois formatos com o mesmo par de regex.
    const texto = cru.replace(/\*\*/g, '').replace(/^\s*\d+[.)]\s*/, '').trim()
    if (!texto) continue

    const rotulo = semAcento(texto).toLowerCase()

    if (/^t[óo]pico\s*:/i.test(texto) || /^topico\s*:/.test(rotulo)) {
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^t[óo]pico\s*:/i, ''))
      if (!nome) continue
      topicoAtual = { nome, prioridade, subtopicos: [] }
      subtopicoAtual = null
      moduloAtual = null
      topicos.push(topicoAtual)
      continue
    }

    // A ordem importa: "submodulo" contém "modulo", "subtopico" contém "topico".
    if (rotulo.startsWith('submodulo')) {
      if (!moduloAtual) continue
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^subm[óo]dulo\s*:/i, ''))
      if (!nome) continue
      moduloAtual.submodulos.push({ nome, prioridade })
      continue
    }

    if (rotulo.startsWith('modulo')) {
      if (!subtopicoAtual) continue
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^m[óo]dulo\s*:/i, ''))
      if (!nome) continue
      moduloAtual = { nome, prioridade, submodulos: [] }
      subtopicoAtual.modulos.push(moduloAtual)
      continue
    }

    if (rotulo.startsWith('subtopico')) {
      if (!topicoAtual) {
        topicoAtual = { nome: 'Conteúdo', prioridade: 'normal', subtopicos: [] }
        topicos.push(topicoAtual)
      }
      const { nome, prioridade } = extrairPrioridade(texto.replace(/^subt[óo]pico\s*:/i, ''))
      if (!nome) continue
      subtopicoAtual = { nome, prioridade, modulos: [] }
      moduloAtual = null
      topicoAtual.subtopicos.push(subtopicoAtual)
      continue
    }
  }

  return { periodo: periodoDeclarado, topicos }
}

// ── Estimativa de horas ─────────────────────────────────────────────────────

const PESO_PRIORIDADE = { alta: 1.35, media: 1, normal: 1, baixa: 0.7 }

/**
 * Horas de estudo de um módulo. A base é o tamanho real do módulo (quantos
 * submódulos ele tem), e a prioridade estica ou encolhe em torno disso.
 *
 * Um módulo sem submódulo declarado não é vazio — é um assunto que o documento
 * não detalhou —, então recebe o mesmo piso de 2h de um módulo com um item.
 */
function estimarHoras(modulo) {
  const itens = Math.max(1, modulo.submodulos.length)
  const base = 1.5 + itens * 0.75
  const horas = base * (PESO_PRIORIDADE[modulo.prioridade] ?? 1)
  return Math.max(2, Math.round(horas * 2) / 2)
}

// ── Montagem com ids estáveis ───────────────────────────────────────────────

/**
 * Ids carregam curso, período e posição além do slug do nome. Posição entra
 * porque nome não é único (dois períodos têm "Farmacologia geral"), e o slug
 * entra porque um id puramente posicional mudaria de significado a cada
 * reordenação do documento — e ids já gravados em cronogramas de aluno
 * apontariam para outro assunto.
 */
function montar(cursoId, periodo, topicos) {
  return topicos.map((topico, ti) => {
    const topicoId = `${cursoId}-p${periodo}-t${ti + 1}-${slug(topico.nome)}`
    return {
      id: topicoId,
      nome: topico.nome,
      prioridade: topico.prioridade,
      incluido: false,
      subtopicos: topico.subtopicos.map((sub, si) => {
        const subId = `${topicoId}-s${si + 1}-${slug(sub.nome)}`
        return {
          id: subId,
          nome: sub.nome,
          prioridade: sub.prioridade,
          incluido: false,
          modulos: sub.modulos.map((mod, mi) => {
            const modId = `${subId}-m${mi + 1}-${slug(mod.nome)}`
            return {
              id: modId,
              nome: mod.nome,
              prioridade: mod.prioridade,
              horasEstimadas: estimarHoras(mod),
              incluido: false,
              submodulos: mod.submodulos.map((sm, smi) => ({
                id: `${modId}-i${smi + 1}`,
                nome: sm.nome,
                prioridade: sm.prioridade,
              })),
            }
          }),
        }
      }),
    }
  })
}

// ── Identificação dos arquivos ──────────────────────────────────────────────

/**
 * Descobre curso, período e bloco a partir do nome do arquivo.
 *
 * Medicina nomeia por disciplina ("SOI I", "HAM III") e o período sai do
 * romano; os demais cursos nomeiam pelo próprio período.
 */
function identificar(arquivo) {
  const curso = CURSOS.find(c => c.arquivo.test(arquivo))
  if (!curso) return null

  const medicina = arquivo.match(/\b(SOI|HAM)\s+(I{1,3}|IV|V|VI{0,3}|IX|X)\b/i)
  if (medicina) {
    const bloco = `${medicina[1].toUpperCase()} ${medicina[2].toUpperCase()}`
    const periodo = ROMANOS[medicina[2].toUpperCase()]
    if (!periodo) return null
    return { curso: curso.id, periodo, bloco }
  }

  const porPeriodo = arquivo.match(/(\d{1,2})\s*[ºo°]?\s*PER[ÍI]ODO/i)
  if (porPeriodo) {
    return { curso: curso.id, periodo: Number(porPeriodo[1]), bloco: null }
  }

  return null
}

/** Conta nós para desempatar arquivos que descrevem o mesmo bloco. */
function medir(topicos) {
  let nos = 0
  let comPrioridade = 0
  const visitar = item => {
    nos++
    if (item.prioridade && item.prioridade !== 'normal') comPrioridade++
  }
  for (const t of topicos) {
    visitar(t)
    for (const s of t.subtopicos) {
      visitar(s)
      for (const m of s.modulos) {
        visitar(m)
        for (const sm of m.submodulos) visitar(sm)
      }
    }
  }
  return { nos, comPrioridade }
}

// ── Execução ────────────────────────────────────────────────────────────────

function main() {
  const arquivos = readdirSync(ORIGEM).filter(f => /\.md$/i.test(f))

  /** chave "curso:periodo:bloco" → melhor candidato encontrado até agora */
  const melhores = new Map()

  for (const arquivo of arquivos) {
    const alvo = identificar(arquivo)
    if (!alvo) continue

    const conteudo = readFileSync(join(ORIGEM, arquivo), 'utf8')
    const { periodo: periodoDeclarado, topicos } = analisar(conteudo)
    if (topicos.length === 0) continue

    const periodo = alvo.periodo ?? periodoDeclarado
    if (!periodo) continue

    const medida = medir(topicos)
    const chave = `${alvo.curso}:${periodo}:${alvo.bloco ?? '-'}`
    const anterior = melhores.get(chave)

    // Prioridade declarada vale mais que volume: o documento anotado é a
    // geração mais nova do mesmo conteúdo.
    const ganha =
      !anterior ||
      medida.comPrioridade > anterior.medida.comPrioridade ||
      (medida.comPrioridade === anterior.medida.comPrioridade && medida.nos > anterior.medida.nos)

    if (ganha) melhores.set(chave, { arquivo, curso: alvo.curso, periodo, bloco: alvo.bloco, topicos, medida })
  }

  /** curso → período → tópicos */
  const porCurso = new Map(CURSOS.map(c => [c.id, new Map()]))

  // Em Medicina, SOI (morfofuncional) vem antes de HAM (habilidades) porque é
  // essa a ordem em que o aluno encontra o conteúdo no semestre — a ordem
  // alfabética inverteria as duas.
  const ORDEM_BLOCO = { SOI: 0, HAM: 1 }
  const pesoBloco = bloco => (bloco ? (ORDEM_BLOCO[bloco.split(' ')[0]] ?? 9) : 0)

  const ordenados = [...melhores.values()].sort((a, b) => {
    if (a.periodo !== b.periodo) return a.periodo - b.periodo
    return pesoBloco(a.bloco) - pesoBloco(b.bloco)
  })

  for (const item of ordenados) {
    const periodos = porCurso.get(item.curso)
    const lista = periodos.get(item.periodo) ?? []
    periodos.set(item.periodo, lista.concat(item.topicos))
  }

  if (existsSync(DESTINO)) rmSync(DESTINO, { recursive: true })
  mkdirSync(DESTINO, { recursive: true })

  const indice = []
  const relatorio = []

  for (const curso of CURSOS) {
    const periodos = porCurso.get(curso.id)
    const saida = {}
    const resumoPeriodos = []

    for (const periodo of [...periodos.keys()].sort((a, b) => a - b)) {
      const topicos = montar(curso.id, periodo, periodos.get(periodo))
      saida[periodo] = topicos

      let subtopicos = 0
      let modulos = 0
      let submodulos = 0
      let horas = 0
      for (const t of topicos) {
        subtopicos += t.subtopicos.length
        for (const s of t.subtopicos) {
          modulos += s.modulos.length
          for (const m of s.modulos) {
            submodulos += m.submodulos.length
            horas += m.horasEstimadas
          }
        }
      }

      resumoPeriodos.push({
        periodo,
        topicos: topicos.length,
        subtopicos,
        modulos,
        submodulos,
        horas: Math.round(horas),
      })
      relatorio.push(`${curso.id} p${periodo}: ${topicos.length}T ${subtopicos}S ${modulos}M ${submodulos}s (${Math.round(horas)}h)`)
    }

    writeFileSync(join(DESTINO, `${curso.id}.json`), JSON.stringify(saida) + '\n')
    indice.push({ id: curso.id, nome: curso.nome, periodos: resumoPeriodos })
  }

  writeFileSync(join(DESTINO, 'indice.json'), JSON.stringify(indice, null, 2) + '\n')

  for (const linha of relatorio) console.log(linha)

  const totalPeriodos = indice.reduce((soma, c) => soma + c.periodos.length, 0)
  console.log(`\n${indice.length} cursos, ${totalPeriodos} períodos → data/cronogramas/ementas/`)

  if (totalPeriodos === 0) {
    console.error('Nenhum período foi gerado — a ementa não pode ficar vazia.')
    process.exit(1)
  }
}

main()

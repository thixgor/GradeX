#!/usr/bin/env node
/**
 * Gera o roteiro de gravação das falas do Dom para o ElevenLabs:
 *
 *   node --experimental-strip-types --no-warnings scripts/dom/gerar-roteiro.mjs
 *
 * - `docs/dom/roteiro-elevenlabs.md`: direção de voz + todas as falas, por
 *   momento, com o id (= nome do arquivo .mp3) e o texto com as tags.
 * - `docs/dom/roteiro-elevenlabs.csv`: `id;texto` para geração em lote.
 *
 * A fonte é `components/dom/falas.ts` — mudou uma fala lá, gere de novo.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const { FALAS, textoDaFala } = await import(join(RAIZ, 'components', 'dom', 'falas.ts'))
const { AUDIOS_GRAVADOS } = await import(join(RAIZ, 'components', 'dom', 'audios-gravados.ts'))

const SECOES = [
  ['Assistente — saudações', ['bomDia', 'boaTarde', 'boaNoite', 'madrugada', 'primeiraVez', 'voltou']],
  ['Assistente — trabalhando', ['pensando', 'pensandoSaude', 'achou', 'navegando']],
  ['Assistente — erros e limites', ['erro', 'semSinal', 'limite', 'calma']],
  ['Assistente — conversa', ['tchau', 'material', 'bloqueado', 'somLigado', 'somDesligado', 'obrigado', 'foraDoEscopo', 'exclusivo']],
  ['Método Socrático', ['socraticoVestir', 'socraticoInicio', 'socraticoAcerto', 'socraticoQuase', 'socraticoNaoSei', 'socraticoFim', 'socraticoTirar']],
  ['Reações — questões e provas', ['foguinho3', 'foguinho5', 'foguinho10', 'apagouFoguinho', 'gabaritou', 'notaAlta', 'notaMedia', 'notaBaixa', 'provaIniciada']],
  ['Reações — progresso', ['subiuNivel', 'novaLiga', 'sequencia3', 'sequencia7', 'sequencia30', 'flashcardsFeitos', 'revisaoEmDia', 'aulaConcluida', 'focoConcluido', 'questaoDoDia', 'voltouDepoisDeSumir', 'estudandoTarde', 'xpGanho', 'compraFeita']],
  ['Páginas (vitrines e leitor)', ['paginaMateriais', 'paginaPacotes', 'paginaPlanos', 'paginaLeitor']],
  ['Landing — passeio guiado (em ordem)', ['landingConvite', 'landingOla', 'landingQuestoes', 'landingFlashcards', 'landingManual', 'landingMateriais', 'landingDom', 'landingPlanos', 'landingFim']],
  ['Tour do site (em ordem)', ['tourOla', 'tourAtalho', 'tourNumeros', 'tourAreas', 'tourMenu', 'tourCriarProva', 'tourBusca', 'tourFoco', 'tourXp', 'tourBotaoTour', 'tourDom', 'tourFim']],
]

const todas = Object.values(FALAS).flat()
const usados = new Set(SECOES.flatMap(([, m]) => m))
const faltando = Object.keys(FALAS).filter((m) => !usados.has(m))
if (faltando.length) throw new Error(`Momentos fora do roteiro: ${faltando.join(', ')}`)

let md = `# Dom — roteiro de gravação (ElevenLabs)

> Gerado de \`components/dom/falas.ts\` por \`scripts/dom/gerar-roteiro.mjs\`. **${todas.length} falas**, ${AUDIOS_GRAVADOS.size} já gravadas.

## Como gravar

1. **Voz do Dom**: mascote jovem, fofinho e inteligente — um "veterano gente boa" de óculos. Português do Brasil neutro, sorriso na voz, energia alta sem gritar, timbre levemente agudo (não infantil). Engraçadinho e persuasivo, nunca bobo.
2. **Modelo**: Eleven v3 (ou o mais novo com *audio tags*). As tags entre colchetes — \`[excited]\`, \`[warmly]\`, \`[whispers]\`, \`[laughs]\`, \`[pause]\` — são direção de entonação: cole o texto **com** as tags.
3. **Ajustes sugeridos**: Stability ~35–45% (expressivo), Similarity ~75%, Style ~30%. Gere 2–3 tomadas e fique com a mais natural.
4. **Arquivo**: MP3, 44.1 kHz, mono, 64–96 kbps (são falas curtas; leve é melhor). Nome = **id** da fala, ex.: \`bom-dia-03.mp3\`.
5. **Entrega**: me mande os arquivos (ou coloque em \`public/dom/audio/v1/\` e rode \`node scripts/dom/indexar-audios.mjs\`). Fala sem áudio continua funcionando: aparece no balão e o Dom mexe a boca em silêncio.
6. Sem o nome do aluno nas falas: o mesmo áudio serve para todo mundo.

`
for (const [titulo, momentos] of SECOES) {
  md += `\n## ${titulo}\n`
  for (const m of momentos) {
    md += `\n### \`${m}\`\n\n| id | texto para o ElevenLabs | balão | gravada |\n|---|---|---|---|\n`
    for (const f of FALAS[m]) {
      md += `| \`${f.id}\` | ${f.voz.replace(/\|/g, '\\|')} | ${textoDaFala(f).replace(/\|/g, '\\|')} | ${AUDIOS_GRAVADOS.has(f.id) ? '✅' : '—'} |\n`
    }
  }
}

const csv = ['id;texto', ...todas.map((f) => `${f.id};"${f.voz.replace(/"/g, '""')}"`)].join('\n') + '\n'
mkdirSync(join(RAIZ, 'docs', 'dom'), { recursive: true })
writeFileSync(join(RAIZ, 'docs', 'dom', 'roteiro-elevenlabs.md'), md)
writeFileSync(join(RAIZ, 'docs', 'dom', 'roteiro-elevenlabs.csv'), csv)
console.log(`Roteiro: ${todas.length} falas → docs/dom/roteiro-elevenlabs.{md,csv}`)

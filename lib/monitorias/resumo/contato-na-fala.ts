/**
 * Contato ou pagamento por fora no Resumo por IA (Termos do Monitor 5.5 e
 * aditivo r2). Puro, testado:
 *
 *  - `contatosNaFala`: as frases de um trecho transcrito passam pelo mesmo
 *    detector do chat (`contato-inteligente.ts`), uma a uma e em sequência
 *    (número ditado em pedaços). Só o nível `bloqueio` conta: citar o "zap"
 *    numa conversa não é infração. Devolve a frase exata e o minuto da aula.
 *  - `limparContatoDoResumo`: rede de segurança depois do modelo — a frase do
 *    resumo que trouxer contato sai; a questão que trouxer, sai inteira.
 */

import { detectarContato, detectarEmSequencia, type DeteccaoDeContato } from '../contato-inteligente'
import type { FraseTranscrita, ResumoGerado } from './tipos'

export interface ContatoNaFala {
  deteccao: DeteccaoDeContato
  /** Só a frase (nunca a transcrição inteira). */
  texto: string
  /** Minuto da aula, contado do início marcado. */
  minuto: number
}

const MAX_POR_TRECHO = 5

export function contatosNaFala(frases: FraseTranscrita[], tempos: { inicioDoTrecho: Date; inicioDaAula: Date }): ContatoNaFala[] {
  const achados: ContatoNaFala[] = []
  const base = tempos.inicioDoTrecho.getTime() - tempos.inicioDaAula.getTime()
  for (let i = 0; i < frases.length && achados.length < MAX_POR_TRECHO; i++) {
    const texto = frases[i].texto || ''
    const direta = detectarContato(texto)
    const deteccao =
      direta.nivel === 'bloqueio'
        ? direta
        : detectarEmSequencia(
            frases.slice(Math.max(0, i - 3), i).map((f) => f.texto || ''),
            texto,
          )
    if (deteccao.nivel !== 'bloqueio') continue
    const anteriores = direta.nivel === 'bloqueio' ? '' : frases.slice(Math.max(0, i - 3), i).map((f) => f.texto).join(' ')
    achados.push({ deteccao, texto: `${anteriores ? `${anteriores} ` : ''}${texto}`.trim().slice(0, 400), minuto: Math.max(0, Math.floor((base + frases[i].t) / 60_000)) })
  }
  return achados
}

function temContato(texto: string): boolean {
  return detectarContato(texto).nivel === 'bloqueio'
}

/** Tira do texto as frases com contato (o resto fica). */
function semFrasesComContato(texto: string): string {
  if (!temContato(texto)) return texto
  const frases = texto.split(/(?<=[.!?;])\s+|\n+/)
  return frases.filter((f) => !temContato(f)).join(' ').trim()
}

function lista(itens: string[]): string[] {
  return itens.map(semFrasesComContato).filter((x) => x.trim())
}

export function limparContatoDoResumo(r: ResumoGerado): ResumoGerado {
  return {
    ...r,
    titulo: semFrasesComContato(r.titulo) || 'Resumo da aula',
    sintese: semFrasesComContato(r.sintese),
    topicos: r.topicos
      .map((t) => ({
        ...t,
        titulo: semFrasesComContato(t.titulo),
        explicacao: semFrasesComContato(t.explicacao),
        conceitos: t.conceitos.filter((c) => !temContato(`${c.termo} ${c.definicao}`)),
        mecanismos: lista(t.mecanismos),
        raciocinioDoMonitor: semFrasesComContato(t.raciocinioDoMonitor),
      }))
      .filter((t) => t.titulo || t.explicacao),
    duvidas: r.duvidas.filter((d) => !temContato(`${d.pergunta} ${d.resposta}`)),
    comparacoes: r.comparacoes.filter((c) => !temContato(`${c.itens} ${c.diferencas}`)),
    pontosDeAtencao: lista(r.pontosDeAtencao),
    revisaoRapida: lista(r.revisaoRapida),
    questoes: r.questoes.filter((q) => !temContato([q.enunciado, ...q.alternativas, q.comentario].join(' '))),
    lacunas: lista(r.lacunas),
    aVerificar: lista(r.aVerificar),
  }
}

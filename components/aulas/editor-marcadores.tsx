'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, FileText, ListOrdered } from 'lucide-react'
import { formatarTempo } from '@/lib/aulas/progresso'
import {
  lerCapitulos,
  lerTranscricao,
  MAX_CAPITULOS,
  type Capitulo,
  type TrechoDaTranscricao,
} from '@/lib/aulas/marcadores'

/**
 * Editor de capítulos (§11) e transcrição (§10).
 *
 * Dois campos de texto, e essa é a decisão inteira: **aceitar o que o admin já
 * tem em mãos**. Os capítulos já existem colados na descrição do YouTube
 * ("00:00 Introdução"); a transcrição já existe como VTT ou SRT saído do YouTube
 * ou do Whisper. Um formulário com um campo por capítulo garantiria que ninguém
 * cadastrasse quarenta deles — e um recurso que não é usado custa o mesmo que um
 * quebrado, com a desvantagem de parecer pronto.
 *
 * A pré-visualização embaixo é o que fecha o ciclo: colar texto e não ver o que
 * o sistema entendeu é apostar que o carimbo foi lido certo. Aqui o admin
 * confere os tempos convertidos antes de salvar, e um erro de formato aparece
 * como linha faltando, não como aluno caindo no minuto errado.
 */

export function EditorDeMarcadores({
  capitulos,
  transcricao,
  onChange,
  escuro = false,
}: {
  capitulos: Capitulo[] | null
  transcricao: TrechoDaTranscricao[] | null
  onChange: (v: { capitulos: Capitulo[] | null; transcricao: TrechoDaTranscricao[] | null }) => void
  escuro?: boolean
}) {
  /*
   * O texto digitado é estado local; a lista convertida é o que sobe.
   *
   * Reconstruir o texto a partir da lista a cada tecla reformataria o que a
   * pessoa está escrevendo embaixo do cursor — o vício clássico de campo
   * "inteligente" que briga com quem digita.
   */
  const [textoCapitulos, setTextoCapitulos] = useState(() => capitulosParaTexto(capitulos))
  const [textoTranscricao, setTextoTranscricao] = useState(() => trechosParaTexto(transcricao))

  const lidosCapitulos = useMemo(() => lerCapitulos(textoCapitulos), [textoCapitulos])
  const lidosTranscricao = useMemo(() => lerTranscricao(textoTranscricao), [textoTranscricao])

  const c = cores(escuro)

  function trocarCapitulos(texto: string) {
    setTextoCapitulos(texto)
    const lidos = lerCapitulos(texto)
    onChange({ capitulos: lidos.length ? lidos : null, transcricao: lidosTranscricao.length ? lidosTranscricao : null })
  }

  function trocarTranscricao(texto: string) {
    setTextoTranscricao(texto)
    const lidos = lerTranscricao(texto)
    onChange({ capitulos: lidosCapitulos.length ? lidosCapitulos : null, transcricao: lidos.length ? lidos : null })
  }

  // Linhas com conteúdo que não viraram nada: quase sempre carimbo malformado.
  const linhasIgnoradas = contarIgnoradas(textoCapitulos, lidosCapitulos.length)

  return (
    <div className={`rounded-xl border p-4 ${c.caixa}`}>
      {/* ── Capítulos ─────────────────────────────────────────────────── */}
      <div className="mb-1 flex items-center gap-2">
        <ListOrdered className={`h-4 w-4 ${c.destaque}`} />
        <p className={`text-sm font-bold ${c.titulo}`}>Capítulos</p>
      </div>
      <p className={`mb-2 text-xs leading-relaxed ${c.apagado}`}>
        Uma linha por capítulo, como na descrição do YouTube. Cole direto de lá.
      </p>
      <textarea
        value={textoCapitulos}
        onChange={(e) => trocarCapitulos(e.target.value)}
        rows={5}
        spellCheck={false}
        placeholder={'00:00 Introdução\n02:15 Critérios diagnósticos\n12:48 Conduta'}
        className={`w-full resize-y rounded-lg p-2.5 font-mono text-xs outline-none ${c.campo}`}
      />

      {lidosCapitulos.length > 0 ? (
        <div className="mt-2">
          <p className={`mb-1.5 text-[11px] font-semibold ${c.apagado}`}>
            {lidosCapitulos.length} capítulo(s) reconhecido(s)
            {lidosCapitulos.length >= MAX_CAPITULOS ? ' — limite atingido' : ''}
          </p>
          <div className="flex flex-wrap gap-1">
            {lidosCapitulos.slice(0, 12).map((cap, i) => (
              <span key={i} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] ${c.ficha}`}>
                <span className="font-mono font-bold">{formatarTempo(cap.segundo)}</span>
                <span className="max-w-[10rem] truncate">{cap.titulo}</span>
              </span>
            ))}
            {lidosCapitulos.length > 12 ? (
              <span className={`text-[10.5px] ${c.apagado}`}>+{lidosCapitulos.length - 12}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {linhasIgnoradas > 0 ? (
        <p className={`mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed ${c.aviso}`}>
          <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" />
          {linhasIgnoradas} linha(s) sem carimbo de tempo válido foram ignoradas. O formato é{' '}
          <code className="font-mono">mm:ss</code> ou <code className="font-mono">hh:mm:ss</code>.
        </p>
      ) : null}

      {/* ── Transcrição ───────────────────────────────────────────────── */}
      <div className={`mt-5 border-t pt-4 ${c.borda}`}>
        <div className="mb-1 flex items-center gap-2">
          <FileText className={`h-4 w-4 ${c.destaque}`} />
          <p className={`text-sm font-bold ${c.titulo}`}>Transcrição</p>
        </div>
        <p className={`mb-2 text-xs leading-relaxed ${c.apagado}`}>
          Cole o VTT ou SRT do YouTube ou do Whisper — o formato é reconhecido sozinho. O aluno
          ganha busca dentro do vídeo.
        </p>
        <textarea
          value={textoTranscricao}
          onChange={(e) => trocarTranscricao(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={'WEBVTT\n\n00:00:00.000 --> 00:00:04.500\nPrimeira fala do vídeo'}
          className={`w-full resize-y rounded-lg p-2.5 font-mono text-xs outline-none ${c.campo}`}
        />

        {lidosTranscricao.length > 0 ? (
          <p className={`mt-1.5 text-[11px] ${c.apagado}`}>
            {lidosTranscricao.length} trecho(s) reconhecido(s) · começa em{' '}
            <span className="font-mono">{formatarTempo(lidosTranscricao[0].segundo)}</span> e termina
            em{' '}
            <span className="font-mono">
              {formatarTempo(lidosTranscricao[lidosTranscricao.length - 1].segundo)}
            </span>
          </p>
        ) : textoTranscricao.trim() ? (
          <p className={`mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed ${c.aviso}`}>
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" />
            Nenhum trecho reconhecido. A transcrição precisa de carimbos de tempo — texto corrido
            não dá para navegar nem buscar por momento.
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Volta da lista para o texto editável — usado só ao abrir o editor. */
function capitulosParaTexto(capitulos: Capitulo[] | null): string {
  return (capitulos || []).map((c) => `${formatarTempo(c.segundo)} ${c.titulo}`).join('\n')
}

function trechosParaTexto(trechos: TrechoDaTranscricao[] | null): string {
  return (trechos || []).map((t) => `${formatarTempo(t.segundo)} ${t.texto}`).join('\n')
}

/** Linhas com conteúdo que não viraram capítulo — sinal de formato errado. */
function contarIgnoradas(texto: string, reconhecidas: number): number {
  const comConteudo = texto.split(/\r?\n/).filter((l) => l.trim().length > 0).length
  return Math.max(0, comConteudo - reconhecidas)
}

function cores(escuro: boolean) {
  return escuro
    ? {
        caixa: 'border-white/10 bg-white/[0.03]',
        borda: 'border-white/10',
        titulo: 'text-white',
        apagado: 'text-white/55',
        destaque: 'text-emerald-400',
        aviso: 'text-amber-300',
        ficha: 'bg-white/10 text-white/80',
        campo:
          'border border-white/15 bg-white/5 text-white placeholder:text-white/25 focus:border-emerald-400/50',
      }
    : {
        caixa: 'border-border bg-card',
        borda: 'border-border',
        titulo: 'text-foreground',
        apagado: 'text-muted-foreground',
        destaque: 'text-primary',
        aviso: 'text-amber-600 dark:text-amber-400',
        ficha: 'bg-muted text-foreground',
        campo: 'border border-border bg-background text-foreground focus:border-primary/50',
      }
}

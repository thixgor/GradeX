'use client'

import { useEffect, useId, type ReactNode } from 'react'
import { BookOpen, Bot, Check, ChevronRight, ClipboardCheck, Copy, Lock, Undo2, X } from 'lucide-react'
import { HighlightableText } from '@/components/highlightable-text'
import { ImagensDaQuestao } from '@/components/questoes/imagens-da-questao'
import { RecursoVisualDaQuestao } from '@/components/provas/recurso-visual'
import { TextoComentado } from '@/components/provas/texto-comentado'
import {
  imagensDaResposta,
  imagensDoEnunciado,
  layoutDaResposta,
  layoutDoEnunciado,
} from '@/lib/questoes/imagens-da-questao'
import type { Question, TextHighlight, UserAnswer } from '@/lib/types'
import { cn } from '@/lib/utils'
import './prova-ios.css'

/*
 * As peças da tela da prova (`app/exam/[id]/page.tsx`) no vidro iOS — estilo
 * em `prova-ios.css`, sobre os tokens de `components/materiais/vidro-ios.css`.
 *
 * O corpo da questão mora aqui, uma vez só. Antes o modo paginado e o modo
 * rolagem tinham cada um a sua cópia (seiscentas linhas repetidas), e as duas
 * já tinham se desencontrado: o comando e as alternativas saíam com `\n`
 * literal num modo e quebrados no outro.
 */

/** O texto da questão com as quebras escritas como `\n`/`\nl` resolvidas. */
export const formatarTexto = (texto?: string | null) =>
  texto?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''

export const NOTAS_DA_AUTOAVALIACAO = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export function faixaDaNota(nota: number): 'alta' | 'media' | 'baixa' {
  return nota >= 70 ? 'alta' : nota >= 40 ? 'media' : 'baixa'
}

export function corDaNota(nota: number | null | undefined) {
  if (nota === null || nota === undefined) return 'var(--ios-rotulo-3)'
  return nota >= 70 ? '#2f8a4f' : nota >= 40 ? '#d98a12' : '#e5484d'
}

export function frasesDaNota(nota: number) {
  return nota >= 90 ? 'Excelente' : nota >= 70 ? 'Bom desempenho' : nota >= 40 ? 'Pode melhorar' : 'Precisa revisar'
}

/* ══════════ Folha (modal) ══════════ */

/**
 * O modal da prova: folha que sobe do rodapé no celular (com a alça, como no
 * iPhone) e cartão centrado do tablet para cima. Esc e o véu fecham quando há
 * `onFechar`; sem ele, a folha só sai pelos próprios botões (o aviso de tempo
 * por questão, que fecha sozinho).
 */
export function Folha({
  titulo,
  subtitulo,
  icone,
  onFechar,
  children,
  pe,
  largura = 'md',
  camada = 100,
  className,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  icone?: ReactNode
  onFechar?: () => void
  children?: ReactNode
  pe?: ReactNode
  largura?: 'sm' | 'md' | 'lg' | 'xl'
  /** z-index do véu — a autoavaliação abre por cima do feedback completo. */
  camada?: number
  className?: string
}) {
  const idDoTitulo = useId()

  useEffect(() => {
    if (!onFechar) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div
      className="pv-veu"
      style={{ zIndex: camada }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        className={cn(
          'pv-folha',
          largura === 'sm' && 'sm:max-w-md',
          largura === 'md' && 'sm:max-w-lg',
          largura === 'lg' && 'sm:max-w-2xl',
          largura === 'xl' && 'sm:max-w-3xl',
          className,
        )}
      >
        <div className="pv-alca" aria-hidden />
        <div className="pv-folha-cabeca">
          {icone}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={idDoTitulo} className="pv-folha-titulo">
              {titulo}
            </h2>
            {subtitulo && <div className="mt-1 text-[14px] leading-snug ios-rotulo-2">{subtitulo}</div>}
          </div>
          {onFechar && (
            <button type="button" onClick={onFechar} className="pv-redondo -mr-1 h-9 w-9" aria-label="Fechar">
              <X className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
        {children !== undefined && children !== null && <div className="pv-folha-corpo">{children}</div>}
        {pe && <div className="pv-folha-pe">{pe}</div>}
      </div>
    </div>
  )
}

/* ══════════ Anéis ══════════ */

/** O anel da nota do resultado. `percentual` nulo desenha só o trilho. */
export function AnelDeNota({
  percentual,
  tamanho = 168,
  espessura = 12,
  cor,
  children,
  rotulo,
}: {
  percentual: number | null
  tamanho?: number
  espessura?: number
  cor?: string
  children?: ReactNode
  rotulo: string
}) {
  const raio = (tamanho - espessura) / 2
  const total = 2 * Math.PI * raio
  const valor = Math.max(0, Math.min(100, percentual ?? 0))
  return (
    <div className="pv-anel" style={{ width: tamanho, height: tamanho }} role="img" aria-label={rotulo}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden>
        <circle className="trilho" cx={tamanho / 2} cy={tamanho / 2} r={raio} strokeWidth={espessura} />
        {percentual !== null && valor > 0 && (
          <circle
            className="traco"
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            strokeWidth={espessura}
            stroke={cor ?? corDaNota(valor)}
            strokeDasharray={total}
            strokeDashoffset={total * (1 - valor / 100)}
            style={{ '--pv-anel-total': total } as React.CSSProperties}
          />
        )}
      </svg>
      <div className="pv-anel-centro">{children}</div>
    </div>
  )
}

/** O anel pequeno da barra do rodapé: quanto da prova já foi respondido. */
export function MiniAnel({ fracao }: { fracao: number }) {
  const raio = 12
  const total = 2 * Math.PI * raio
  return (
    <svg className="pv-mini-anel" viewBox="0 0 30 30" aria-hidden>
      <circle className="trilho" cx="15" cy="15" r={raio} />
      <circle
        className="traco"
        cx="15"
        cy="15"
        r={raio}
        strokeDasharray={total}
        strokeDashoffset={total * (1 - Math.max(0, Math.min(1, fracao)))}
      />
    </svg>
  )
}

/* ══════════ Alternativa ══════════ */

/**
 * Uma alternativa: a linha inteira escolhe (é o alvo grande, para o polegar),
 * e o "riscar" é um alvo próprio ao lado — nunca um botão dentro do outro.
 */
export function Alternativa({
  letra,
  texto,
  escolhida,
  riscada,
  trancada,
  onEscolher,
  onRiscar,
}: {
  letra: string
  texto: string
  escolhida: boolean
  riscada: boolean
  trancada: boolean
  onEscolher: () => void
  onRiscar: () => void
}) {
  return (
    <div
      className="pv-alt"
      data-escolhida={escolhida}
      data-riscada={riscada && !escolhida}
      data-trancada={trancada}
    >
      <button
        type="button"
        role="radio"
        aria-checked={escolhida}
        aria-disabled={trancada || undefined}
        className="pv-alt-escolher"
        onClick={onEscolher}
      >
        <span className="pv-alt-letra" aria-hidden>
          {letra}
        </span>
        <span className="pv-alt-texto">
          <span className="sr-only">Alternativa {letra}: </span>
          {texto}
        </span>
      </button>
      <button
        type="button"
        className="pv-alt-riscar"
        onClick={onRiscar}
        aria-pressed={riscada}
        aria-label={riscada ? `Desfazer o risco da alternativa ${letra}` : `Riscar a alternativa ${letra}`}
        title={riscada ? 'Desfazer risco' : 'Riscar (eliminar)'}
      >
        <span>{riscada ? <Undo2 className="h-[18px] w-[18px]" /> : <X className="h-[18px] w-[18px]" />}</span>
      </button>
    </div>
  )
}

/**
 * A alternativa na correção (feedback imediato, gabarito do resultado): a
 * mesma linha da prova, sem toque, com a certa em verde e a marcada errada em
 * vermelho — e o comentário daquela alternativa logo abaixo do texto.
 */
export function AlternativaDeLeitura({
  letra,
  texto,
  correta,
  marcada,
  comentario,
}: {
  letra: string
  texto: string
  correta: boolean
  marcada: boolean
  comentario?: string
}) {
  const correcao = correta ? 'certa' : marcada ? 'errada' : undefined
  return (
    <div className="pv-alt" data-correcao={correcao}>
      <div className="pv-alt-escolher pv-alt-leitura">
        <span className="pv-alt-letra" aria-hidden>
          {letra}
        </span>
        <span className="pv-alt-texto min-w-0 flex-1">
          <span className="sr-only">
            Alternativa {letra}
            {correta ? ' (correta)' : ''}
            {marcada ? ' (sua resposta)' : ''}:{' '}
          </span>
          {texto}
          {(correta || marcada) && (
            <span className="mt-1.5 flex flex-wrap gap-1.5" aria-hidden>
              {correta && (
                <span className="pv-etiqueta" data-tom="tinta">
                  <Check className="h-3 w-3" /> Correta
                </span>
              )}
              {marcada && (
                <span className="pv-etiqueta" data-tom={correta ? 'tinta' : 'erro'}>
                  Sua resposta
                </span>
              )}
            </span>
          )}
          {comentario && (
            <span className="mt-2 block whitespace-pre-wrap text-[14px] leading-relaxed ios-rotulo-2">
              {comentario}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

/* ══════════ Resposta comentada que se revela ══════════ */

export function RespostaComentadaRevelavel({
  questao,
  aberta,
  onAlternar,
  onAmpliar,
}: {
  questao: Question
  aberta: boolean
  onAlternar: () => void
  onAmpliar: (src: string) => void
}) {
  if (!questao.explanation) return null
  return (
    <div className="pv-revela">
      <button type="button" className="pv-revela-botao" aria-expanded={aberta} onClick={onAlternar}>
        <BookOpen className="h-5 w-5 shrink-0 ios-ambar" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold ios-ambar">Resposta comentada</span>
          <span className="block text-[13px] ios-rotulo-2">
            {aberta ? 'Toque para esconder' : 'Toque para conferir depois de responder'}
          </span>
        </span>
        <ChevronRight className="pv-seta h-5 w-5" />
      </button>
      {aberta && (
        <div className="pv-revela-corpo space-y-3">
          <TextoComentado texto={questao.explanation} />
          <ImagensDaQuestao
            imagens={imagensDaResposta(questao)}
            layout={layoutDaResposta(questao)}
            onAmpliar={onAmpliar}
            alt="Imagem da resposta comentada"
          />
        </div>
      )}
    </div>
  )
}

/* ══════════ Autoavaliação ══════════ */

export function ReguaDeAutoavaliacao({
  valor,
  onEscolher,
}: {
  valor: number | null | undefined
  onEscolher: (nota: number) => void
}) {
  return (
    <div className="pv-regua" role="group" aria-label="Nota de 0 a 100%">
      {NOTAS_DA_AUTOAVALIACAO.map((nota) => (
        <button
          key={nota}
          type="button"
          aria-pressed={valor === nota}
          data-faixa={faixaDaNota(nota)}
          onClick={() => onEscolher(nota)}
        >
          {nota}
        </button>
      ))}
    </div>
  )
}

/* ══════════ Corpo da questão ══════════ */

export interface AcoesDaQuestao {
  onEscolher: (alternativaId: string) => void
  onRiscar: (alternativaId: string) => void
  onGrifos: (grifos: TextHighlight[]) => void
  onDiscursiva: (texto: string) => void
  onRedacao: (texto: string) => void
  onAutoavaliar: (nota: number) => void
  onCopiarPrompt: () => void
  onAlternarComentada: () => void
  onAmpliar: (src: string) => void
}

const contarPalavras = (texto: string) => texto.split(/\s+/).filter((p) => p.length > 0).length

/**
 * Tudo o que fica entre o cabeçalho da questão e a barra de baixo: enunciado,
 * imagens, material de apoio, comando e a forma de responder.
 */
export function CorpoDaQuestao({
  questao,
  resposta,
  trancada,
  promptCopiado,
  comentadaAberta,
  mostrarAtalhos,
  acoes,
}: {
  questao: Question
  resposta?: UserAnswer
  /** Respondida e conferida no feedback imediato: não muda mais. */
  trancada: boolean
  promptCopiado: boolean
  comentadaAberta: boolean
  /** Os atalhos de teclado só valem no modo paginado. */
  mostrarAtalhos: boolean
  acoes: AcoesDaQuestao
}) {
  const grifos = resposta?.highlights || []
  const textoDiscursivo = resposta?.discursiveText || ''
  const textoDaRedacao = resposta?.essayText || ''

  return (
    <div className="space-y-6">
      <div>
        <HighlightableText
          text={formatarTexto(questao.statement)}
          highlights={grifos}
          target="statement"
          onHighlightsChange={acoes.onGrifos}
          className="pv-enunciado"
        />
        {questao.statementSource && <p className="pv-fonte">Fonte: {questao.statementSource}</p>}
      </div>

      {/* Imagens do enunciado — quantas forem, no tamanho e no arranjo
          escolhidos na questão (lib/questoes/imagens.ts). */}
      <ImagensDaQuestao
        imagens={imagensDoEnunciado(questao)}
        layout={layoutDoEnunciado(questao)}
        onAmpliar={acoes.onAmpliar}
      />

      {/* Tabela, gráfico, esquema ou citação da questão gerada por IA. */}
      <RecursoVisualDaQuestao recurso={questao.supportMaterial} />

      {questao.command?.trim() && (
        <div className="pv-comando">
          <HighlightableText
            text={formatarTexto(questao.command)}
            highlights={grifos}
            target="command"
            onHighlightsChange={acoes.onGrifos}
          />
        </div>
      )}

      {trancada && (
        <div className="pv-aviso" role="status">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">Resposta conferida.</strong> Esta questão já foi corrigida e não pode
            mais ser alterada.
          </span>
        </div>
      )}

      {questao.type === 'multiple-choice' && (
        <div className="space-y-3">
          <div className="pv-alts" role="radiogroup" aria-label={`Alternativas da questão ${questao.number}`}>
            {questao.alternatives.map((alt) => (
              <Alternativa
                key={alt.id}
                letra={alt.letter}
                texto={formatarTexto(alt.text)}
                escolhida={resposta?.selectedAlternative === alt.id}
                riscada={resposta?.crossedAlternatives?.includes(alt.id) || false}
                trancada={trancada}
                onEscolher={() => acoes.onEscolher(alt.id)}
                onRiscar={() => acoes.onRiscar(alt.id)}
              />
            ))}
          </div>
          {mostrarAtalhos && questao.alternatives.length > 0 && (
            <p className="pv-atalhos" aria-hidden>
              <span>
                <kbd>1</kbd>–<kbd>{Math.min(9, questao.alternatives.length)}</kbd> escolhe
              </span>
              <span>
                <kbd>←</kbd> <kbd>→</kbd> navega
              </span>
              <span>toque no ✕ para riscar uma alternativa</span>
            </p>
          )}
        </div>
      )}

      {questao.type === 'discursive' && (
        <div className="space-y-4">
          <div>
            <label htmlFor={`discursiva-${questao.id}`} className="pv-rotulo mb-2 block">
              Sua resposta
            </label>
            <textarea
              id={`discursiva-${questao.id}`}
              value={textoDiscursivo}
              onChange={(e) => acoes.onDiscursiva(e.target.value)}
              placeholder="Escreva sua resposta aqui…"
              rows={10}
              className="pv-campo"
              disabled={trancada}
            />
            <div className="pv-contagem">
              <span>{contarPalavras(textoDiscursivo)} palavras</span>
              <span>{textoDiscursivo.length} caracteres</span>
            </div>
          </div>

          <RespostaComentadaRevelavel
            questao={questao}
            aberta={comentadaAberta}
            onAlternar={acoes.onAlternarComentada}
            onAmpliar={acoes.onAmpliar}
          />

          {questao.explanation && (
            <div className="pv-aviso" data-tom="neutro">
              <Bot className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-2">
                <p>
                  <strong className="font-semibold text-[var(--ios-rotulo)]">Corrija com IA.</strong> Escreva sua
                  resposta, copie o prompt de correção e cole no ChatGPT, Gemini, Claude ou Grok. Depois volte aqui
                  e dê a nota que ele indicar.
                </p>
                <p className="text-[12.5px] ios-rotulo-3">
                  O prompt avalia o entendimento do conteúdo, não palavras-chave — e sabe que uma resposta
                  discursiva 100% completa é quase impossível.
                </p>
              </div>
            </div>
          )}

          {questao.explanation && textoDiscursivo.trim() && (
            <button type="button" className="ios-botao-cinza w-full" onClick={acoes.onCopiarPrompt}>
              {promptCopiado ? (
                <>
                  <ClipboardCheck className="h-[18px] w-[18px] ios-tinta" /> Prompt copiado
                </>
              ) : (
                <>
                  <Copy className="h-[18px] w-[18px]" /> Copiar prompt de correção
                </>
              )}
            </button>
          )}

          {textoDiscursivo.trim() && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="pv-rotulo">Autoavaliação · como você avalia sua resposta?</p>
                {resposta?.discursiveSelfScore !== undefined && (
                  <span className="text-[15px] font-bold tabular-nums" style={{ color: corDaNota(resposta.discursiveSelfScore) }}>
                    {resposta.discursiveSelfScore}%
                  </span>
                )}
              </div>
              <ReguaDeAutoavaliacao valor={resposta?.discursiveSelfScore} onEscolher={acoes.onAutoavaliar} />
              {resposta?.discursiveSelfScore !== undefined && (
                <p className="text-center text-[13px] font-medium ios-rotulo-2">
                  {frasesDaNota(resposta.discursiveSelfScore)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {questao.type === 'essay' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pv-etiqueta" data-tom="tinta">
                Redação {questao.essayStyle === 'enem' ? 'ENEM' : 'UERJ'}
              </span>
              {questao.maxScore ? <span className="pv-etiqueta">até {questao.maxScore} pontos</span> : null}
            </div>
            {questao.essayTheme && (
              <p className="text-[19px] font-semibold leading-snug tracking-[-0.015em] sm:text-[21px]">
                {questao.essayTheme}
              </p>
            )}
          </div>

          {questao.essaySupportTexts && questao.essaySupportTexts.length > 0 && (
            <div className="space-y-4">
              <p className="pv-rotulo">Textos motivadores</p>
              {questao.essaySupportTexts.map((texto, i) => (
                <blockquote
                  key={i}
                  className="border-l-[3px] border-[var(--ios-separador)] pl-4 text-[15px] leading-relaxed ios-rotulo-2"
                >
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] ios-rotulo-3">
                    Texto {i + 1}
                  </p>
                  <p className="whitespace-pre-wrap">{texto}</p>
                </blockquote>
              ))}
            </div>
          )}

          <div>
            <label htmlFor={`essay-${questao.id}`} className="pv-rotulo mb-2 block">
              Sua redação
            </label>
            <textarea
              id={`essay-${questao.id}`}
              value={textoDaRedacao}
              onChange={(e) => acoes.onRedacao(e.target.value)}
              placeholder="Escreva sua redação seguindo as orientações do tema proposto…"
              rows={25}
              className="pv-campo pv-campo-redacao"
            />
            <div className="pv-contagem">
              <span>{textoDaRedacao ? textoDaRedacao.split('\n').length : 0} linhas</span>
              <span>{contarPalavras(textoDaRedacao)} palavras</span>
              <span>{textoDaRedacao.length} caracteres</span>
            </div>
          </div>

          <div className="pv-aviso" data-tom="tinta">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {questao.essayStyle === 'enem'
                ? 'Texto dissertativo-argumentativo, com introdução, desenvolvimento e conclusão. Não esqueça a proposta de intervenção.'
                : 'A UERJ aceita primeira pessoa, mas exige densidade argumentativa e autoria clara. Desenvolva bem cada parágrafo.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

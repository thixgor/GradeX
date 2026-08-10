'use client'

import { createContext, useContext, useState } from 'react'

import { PROFUNDIDADES, visivelEm, type IdDeProfundidade } from './tema'

/**
 * Seletor de profundidade de leitura.
 *
 * Três níveis — Essencial, Aprofundar, Revisão avançada — e uma regra que o
 * plano deixa explícita: **sem duplicação**. Não há três versões do mesmo texto;
 * há um texto, e o nível controla quais seções aparecem. O conteúdo essencial
 * faz sentido sozinho, e o avançado nunca esconde o mecanismo básico — ele o
 * acompanha, porque "avançado" é aditivo.
 *
 * O estado vive num contexto em vez de subir para a URL de propósito: é
 * preferência de leitura, não endereço. Duas pessoas que compartilham o link de
 * uma doença devem chegar à mesma página.
 */

const ContextoDeProfundidade = createContext<IdDeProfundidade>('aprofundar')

export function useProfundidade() {
  return useContext(ContextoDeProfundidade)
}

export function ProvedorDeProfundidade({
  children,
  inicial = 'aprofundar',
}: {
  children: React.ReactNode
  inicial?: IdDeProfundidade
}) {
  const [nivel, setNivel] = useState<IdDeProfundidade>(inicial)

  return (
    <ContextoDeProfundidade.Provider value={nivel}>
      <div
        className="mb-6 rounded-xl border border-border bg-card p-3"
        role="group"
        aria-label="Profundidade de leitura"
      >
        <div className="flex flex-wrap gap-1.5">
          {PROFUNDIDADES.map((p) => {
            const ativo = p.id === nivel
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => setNivel(p.id)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors ${
                  ativo
                    ? 'border-violet-600/60 bg-violet-500/10 text-violet-800 dark:text-violet-300'
                    : 'border-border bg-card text-muted-foreground hover:border-violet-600/40'
                }`}
              >
                <span aria-hidden>{ativo ? '●' : '○'}</span>
                {p.rotulo}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground" aria-live="polite">
          {PROFUNDIDADES.find((p) => p.id === nivel)?.descricao}
        </p>
      </div>
      {children}
    </ContextoDeProfundidade.Provider>
  )
}

/**
 * Envelope de seção que respeita o nível escolhido.
 *
 * Quando a seção não pertence ao nível atual, ela não é renderizada — em vez de
 * ser escondida com CSS. Conteúdo escondido continua no DOM, continua sendo lido
 * por leitor de tela e continua encontrável pelo Ctrl+F, o que faz o seletor
 * parecer quebrado para quem depende dessas ferramentas.
 */
export function SecaoPorProfundidade({
  nivel,
  children,
}: {
  nivel: IdDeProfundidade
  children: React.ReactNode
}) {
  const escolhido = useProfundidade()
  if (!visivelEm(nivel, escolhido)) return null
  return <>{children}</>
}

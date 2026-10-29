'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Info, Loader2, Mail, AlertTriangle } from 'lucide-react'

/**
 * As peças das telas de entrar, no material de vidro de `app/auth/auth.css`.
 *
 * Nada aqui é enfeite de mundo: são os controles que a pessoa já conhece do
 * celular — controle segmentado, campos agrupados com o rótulo que sobe,
 * botão em pílula — desenhados com o mesmo cuidado em todos os estados
 * (foco, carregando, desabilitado, erro).
 */

export function CartaoAuth({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`vidro auth-cartao auth-entra ${className}`}>{children}</div>
}

/** Título e linha de apoio do cartão. `chave` refaz a entrada quando o texto troca. */
export function CabecalhoAuth({
  titulo,
  subtitulo,
  chave,
}: {
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  chave?: string
}) {
  return (
    <header key={chave} className="auth-troca text-center">
      <h1 className="font-heading text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-balance">
        {titulo}
      </h1>
      {subtitulo && (
        <p className="mx-auto mt-1.5 max-w-[22rem] text-[15px] leading-snug text-[color:var(--texto-2)] text-pretty">
          {subtitulo}
        </p>
      )}
    </header>
  )
}

export function ControleSegmentado({
  opcoes,
  ativo,
  onChange,
  rotulo,
}: {
  opcoes: [string, string]
  ativo: 0 | 1
  onChange: (indice: 0 | 1) => void
  rotulo: string
}) {
  return (
    <div className="segmentado" data-ativo={ativo} role="group" aria-label={rotulo}>
      <span className="segmentado-polegar" aria-hidden />
      {opcoes.map((texto, i) => (
        <button
          key={texto}
          type="button"
          aria-pressed={ativo === i}
          onClick={() => onChange(i as 0 | 1)}
        >
          {texto}
        </button>
      ))}
    </div>
  )
}

export function GrupoDeCampos({ children }: { children: React.ReactNode }) {
  return <div className="campos">{children}</div>
}

type PropsDoCampo = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  id: string
  rotulo: string
  /** Botão à direita do campo (mostrar senha, por exemplo). */
  acao?: React.ReactNode
  /**
   * Campo que entra e sai do grupo (o nome, só no cadastro). Fechado, ele
   * encolhe a zero e sai da ordem de tabulação (`inert`).
   */
  dobravel?: boolean
  aberto?: boolean
  ref?: React.Ref<HTMLInputElement>
}

/**
 * Uma linha do grupo de campos, com o rótulo dentro que sobe quando o campo
 * ganha foco ou valor (o `placeholder=" "` é o que o CSS usa para saber se há
 * texto, inclusive no preenchimento automático).
 */
export function Campo({ id, rotulo, acao, dobravel, aberto = true, ...props }: PropsDoCampo) {
  const linha = (
    <div className="campo">
      <input id={id} placeholder=" " {...props} />
      <label htmlFor={id} className="campo-rotulo">
        {rotulo}
      </label>
      {acao}
    </div>
  )

  if (!dobravel) return <div className="campo-linha">{linha}</div>

  return (
    <div className="campo-dobra" data-aberto={aberto} inert={!aberto}>
      <div>{linha}</div>
    </div>
  )
}

/**
 * Caps Lock ligado num campo de senha é a causa mais comum de "senha
 * incorreta" que não é senha incorreta. O navegador sabe; a tela avisa.
 */
export function useCapsLock() {
  const [ligado, setLigado] = useState(false)
  const ler = useCallback((e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') setLigado(e.getModifierState('CapsLock'))
  }, [])
  return {
    capsLigado: ligado,
    propsDoCapsLock: {
      onKeyDown: ler,
      onKeyUp: ler,
      onBlur: () => setLigado(false),
    },
  }
}

export function BotaoAcao({
  carregando,
  textoCarregando = 'Carregando…',
  seta = true,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  carregando?: boolean
  textoCarregando?: string
  seta?: boolean
}) {
  return (
    <button
      type="submit"
      {...props}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`botao-acao ${props.className ?? ''}`}
    >
      {carregando ? (
        <>
          <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
          {textoCarregando}
        </>
      ) : (
        <>
          {children}
          {seta && <ArrowRight className="seta h-[18px] w-[18px]" aria-hidden />}
        </>
      )}
    </button>
  )
}

export function BotaoVidro({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`botao-vidro ${props.className ?? ''}`}>
      {children}
    </button>
  )
}

const ICONES_DE_AVISO = {
  erro: AlertCircle,
  atencao: AlertTriangle,
  neutro: Info,
} as const

export function Aviso({
  tipo = 'erro',
  id,
  children,
}: {
  tipo?: keyof typeof ICONES_DE_AVISO
  id?: string
  children: React.ReactNode
}) {
  const Icone = ICONES_DE_AVISO[tipo]
  return (
    <div id={id} className={`aviso aviso-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Icone className="h-[18px] w-[18px]" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** O ícone grande dos estados finais: conta criada, link inválido, e-mail enviado. */
export function Selo({ tipo }: { tipo: 'sucesso' | 'erro' | 'email' }) {
  return (
    <div className="selo" data-tipo={tipo} aria-hidden>
      {tipo === 'email' ? (
        <Mail className="h-9 w-9" strokeWidth={2} />
      ) : (
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          {tipo === 'sucesso' ? (
            <path className="selo-traco" d="M5 12.5l4.5 4.5L19 7.5" />
          ) : (
            <path className="selo-traco" d="M7 7l10 10M17 7L7 17" />
          )}
        </svg>
      )}
    </div>
  )
}

/**
 * Seis caixas para o código, sobre um único `<input>` invisível: o teclado
 * numérico, o colar e a sugestão de código do iPhone (`one-time-code`)
 * funcionam como num campo comum, e a tela mostra um dígito por caixa.
 */
export function CampoDeCodigo({
  id,
  valor,
  onChange,
  rotulo,
  autoFocus,
  digitos = 6,
}: {
  id: string
  valor: string
  onChange: (valor: string) => void
  rotulo: string
  autoFocus?: boolean
  digitos?: number
}) {
  const [focado, setFocado] = useState(Boolean(autoFocus))
  const inputRef = useRef<HTMLInputElement>(null)
  const ativa = Math.min(valor.length, digitos - 1)

  return (
    <div className="codigo" onClick={() => inputRef.current?.focus()}>
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="done"
        pattern="[0-9]*"
        maxLength={digitos}
        value={valor}
        autoFocus={autoFocus}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, digitos))}
      />
      {Array.from({ length: digitos }, (_, i) => (
        <span
          key={i}
          className="codigo-caixa"
          data-cheia={i < valor.length}
          data-ativa={focado && i === ativa && (valor.length < digitos || i === digitos - 1)}
          aria-hidden
        >
          {valor[i] ?? ''}
        </span>
      ))}
    </div>
  )
}

'use client'

/**
 * Terminal de cartão do checkout — a "maquininha".
 *
 * Substitui o formulário de cartão que era uma pilha de inputs soltos (número,
 * nome, mês, ano, CVV, CPF, parcelas) sem nenhum retorno visual: dava para
 * digitar o cartão inteiro sem a tela reagir uma única vez. Aqui os dados que o
 * comprador digita aparecem no cartão desenhado, a bandeira é reconhecida na
 * hora, o cartão VIRA quando o CVV é focado (que é onde o número fica, no
 * cartão de verdade) e um display no topo diz em que pé está a cobrança.
 *
 * Ganhos de usabilidade que vêm junto, não são enfeite:
 *  - validade num campo só (MM/AA), com a barra entrando sozinha — eram dois
 *    inputs, e "ano" com 4 dígitos é um erro clássico de digitação;
 *  - avanço automático entre os campos quando um fica completo;
 *  - ordem igual à do cartão físico: número, validade, CVV, nome;
 *  - bandeira detectada localmente pelo prefixo (resposta instantânea) e
 *    confirmada pelo Mercado Pago quando o BIN volta;
 *  - Luhn conferido enquanto digita, para o erro aparecer antes do submit.
 *
 * O componente é CONTROLADO: quem manda no estado é o checkout, que precisa
 * dos mesmos valores para tokenizar o cartão.
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { CreditCard, Lock, ShieldCheck, Wifi } from 'lucide-react'

export interface CardFields {
  /** Número com os espaços de agrupamento, como aparece no input. */
  number: string
  /** MM/AA. */
  expiry: string
  cvv: string
  holder: string
}

export const EMPTY_CARD_FIELDS: CardFields = { number: '', expiry: '', cvv: '', holder: '' }

export type CardBrand = 'visa' | 'master' | 'amex' | 'elo' | 'hipercard' | 'diners' | 'unknown'

export type TerminalStatus = 'idle' | 'filling' | 'ready' | 'processing'

// ─── Bandeira ────────────────────────────────────────────────────────────────

/**
 * Bandeira pelo prefixo do número. É uma heurística local, de propósito: serve
 * para o cartão desenhado reagir no primeiro dígito, sem esperar a consulta de
 * BIN. Quem decide o `payment_method_id` que vai ao Mercado Pago continua sendo
 * a resposta do SDK — inclusive porque só ela distingue crédito de débito.
 */
export function detectBrand(value: string): CardBrand {
  const d = value.replace(/\D/g, '')
  if (!d) return 'unknown'
  if (/^4/.test(d)) return 'visa'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^3(?:0[0-5]|[68])/.test(d)) return 'diners'
  // Hipercard antes de Elo: 606282 é Hipercard e cairia na faixa 6xx da Elo.
  if (/^(?:606282|3841)/.test(d)) return 'hipercard'
  if (/^(?:627780|636297|636368|65|509|5067)/.test(d)) return 'elo'
  if (/^(?:5[1-5]|2[2-7])/.test(d)) return 'master'
  return 'unknown'
}

/** Traduz o `payment_method_id` do Mercado Pago para a bandeira desenhada. */
export function brandFromMercadoPagoId(id: string | null | undefined): CardBrand {
  const v = (id || '').toLowerCase()
  if (!v) return 'unknown'
  if (v.includes('amex')) return 'amex'
  if (v.includes('master') || v.includes('maestro')) return 'master'
  if (v.includes('elo')) return 'elo'
  if (v.includes('hiper')) return 'hipercard'
  if (v.includes('diners')) return 'diners'
  if (v.includes('visa')) return 'visa'
  return 'unknown'
}

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  master: 'Mastercard',
  amex: 'American Express',
  elo: 'Elo',
  hipercard: 'Hipercard',
  diners: 'Diners Club',
  unknown: 'Cartão',
}

/** Amex tem 15 dígitos e CVV de 4; o resto, 16 e 3. */
function brandSpec(brand: CardBrand) {
  if (brand === 'amex') return { groups: [4, 6, 5], length: 15, cvv: 4 }
  if (brand === 'diners') return { groups: [4, 6, 4], length: 14, cvv: 3 }
  return { groups: [4, 4, 4, 4], length: 16, cvv: 3 }
}

// ─── Formatação e validação ──────────────────────────────────────────────────

export function formatCardNumber(value: string, brand: CardBrand = detectBrand(value)): string {
  const { groups, length } = brandSpec(brand)
  const digits = value.replace(/\D/g, '').slice(0, length)
  const partes: string[] = []
  let i = 0
  for (const tamanho of groups) {
    if (i >= digits.length) break
    partes.push(digits.slice(i, i + tamanho))
    i += tamanho
  }
  return partes.join(' ')
}

export function formatExpiry(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 4)
  if (d.length === 0) return ''
  // Um mês que só pode ser 1x já ganha o zero: digitar "3" vira "03/".
  if (d.length === 1) return /[2-9]/.test(d) ? `0${d}/` : d
  const mes = Math.min(12, Math.max(1, Number(d.slice(0, 2)))).toString().padStart(2, '0')
  return d.length <= 2 ? `${mes}/` : `${mes}/${d.slice(2)}`
}

/** Luhn — pega o dígito trocado ou invertido antes de gastar um submit. */
export function isLuhnValid(value: string): boolean {
  const d = value.replace(/\D/g, '')
  if (d.length < 12) return false
  let soma = 0
  let dobra = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (dobra) {
      n *= 2
      if (n > 9) n -= 9
    }
    soma += n
    dobra = !dobra
  }
  return soma % 10 === 0
}

export function isExpiryValid(value: string): boolean {
  const d = value.replace(/\D/g, '')
  if (d.length !== 4) return false
  const mes = Number(d.slice(0, 2))
  const ano = 2000 + Number(d.slice(2))
  if (mes < 1 || mes > 12) return false
  // Vence no ÚLTIMO dia do mês impresso — um cartão 08/26 ainda passa em agosto.
  const fim = new Date(ano, mes, 1).getTime()
  return fim > Date.now()
}

/** Quebra MM/AA no formato que a tokenização do Mercado Pago espera. */
export function splitExpiry(value: string): { month: string; year: string } {
  const d = value.replace(/\D/g, '')
  return { month: d.slice(0, 2), year: d.length > 2 ? `20${d.slice(2, 4)}` : '' }
}

export interface CardValidation {
  brand: CardBrand
  numberValid: boolean
  expiryValid: boolean
  cvvValid: boolean
  holderValid: boolean
  complete: boolean
}

export function validateCard(fields: CardFields, brandHint?: CardBrand): CardValidation {
  const brand = brandHint && brandHint !== 'unknown' ? brandHint : detectBrand(fields.number)
  const spec = brandSpec(brand)
  const digits = fields.number.replace(/\D/g, '')
  const numberValid = digits.length === spec.length && isLuhnValid(digits)
  const expiryValid = isExpiryValid(fields.expiry)
  const cvvValid = fields.cvv.replace(/\D/g, '').length === spec.cvv
  // Nome impresso: exige ao menos duas palavras — o Mercado Pago recusa o
  // token com um nome só, e o erro dele não diz isso.
  const holderValid = fields.holder.trim().split(/\s+/).filter(Boolean).length >= 2
  return {
    brand,
    numberValid,
    expiryValid,
    cvvValid,
    holderValid,
    complete: numberValid && expiryValid && cvvValid && holderValid,
  }
}

// ─── Marcas ──────────────────────────────────────────────────────────────────

function BrandMark({ brand, size = 'md' }: { brand: CardBrand; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 16 : 22
  const commonText: React.CSSProperties = {
    fontSize: size === 'sm' ? 11 : 15,
    fontWeight: 800,
    letterSpacing: '0.02em',
    color: '#fff',
    lineHeight: 1,
  }

  if (brand === 'master') {
    return (
      <svg width={h * 1.6} height={h} viewBox="0 0 48 30" role="img" aria-label="Mastercard">
        <circle cx="18" cy="15" r="12" fill="#EB001B" />
        <circle cx="30" cy="15" r="12" fill="#F79E1B" fillOpacity="0.9" />
        <path
          d="M24 5.6a12 12 0 0 0 0 18.8 12 12 0 0 0 0-18.8Z"
          fill="#FF5F00"
        />
      </svg>
    )
  }

  if (brand === 'visa') {
    return <span style={{ ...commonText, fontStyle: 'italic', letterSpacing: '0.08em' }}>VISA</span>
  }

  if (brand === 'amex') {
    return (
      <span
        style={{
          ...commonText,
          fontSize: size === 'sm' ? 9 : 11,
          background: '#2E77BC',
          borderRadius: 4,
          padding: size === 'sm' ? '3px 5px' : '4px 7px',
          letterSpacing: '0.06em',
        }}
      >
        AMEX
      </span>
    )
  }

  if (brand === 'elo') {
    return (
      <span style={{ ...commonText, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#FFCB05' }} />
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#EF4123' }} />
        <span style={{ width: 6, height: 6, borderRadius: 999, background: '#00A4E0' }} />
        <span style={{ marginLeft: 2, letterSpacing: '0.04em' }}>elo</span>
      </span>
    )
  }

  if (brand === 'hipercard') {
    return <span style={{ ...commonText, fontSize: size === 'sm' ? 9 : 12, color: '#E4002B' }}>hipercard</span>
  }

  if (brand === 'diners') {
    return <span style={{ ...commonText, fontSize: size === 'sm' ? 9 : 11 }}>DINERS</span>
  }

  return <CreditCard size={h} style={{ color: 'rgba(255,255,255,0.55)' }} />
}

// ─── Peças do cartão ─────────────────────────────────────────────────────────

/** Chip dourado. Puro CSS — nada de imagem para carregar. */
function Chip() {
  return (
    <div
      style={{
        width: 44,
        height: 34,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #f4d67a 0%, #c9a96b 45%, #e8c674 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 1,
        padding: 3,
        flexShrink: 0,
      }}
      aria-hidden
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} style={{ borderRadius: 1, background: 'rgba(0,0,0,0.10)' }} />
      ))}
    </div>
  )
}

const CARD_FACE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 16,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  // O cartão é um objeto físico: fica escuro nos dois temas, como um cartão
  // real ficaria em cima de uma mesa clara ou escura.
  background:
    'linear-gradient(135deg, #23273a 0%, #14161f 55%, #0c0e14 100%)',
  boxShadow:
    '0 18px 40px -18px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.16)',
  color: '#fff',
}

function CardFront({
  numero,
  titular,
  validade,
  brand,
}: {
  numero: string
  titular: string
  validade: string
  brand: CardBrand
}) {
  const spec = brandSpec(brand)
  const digits = numero.replace(/\D/g, '')
  // Placeholder que já mostra o agrupamento da bandeira: o comprador vê quantos
  // dígitos ainda faltam sem precisar contar.
  const mascara = formatCardNumber('0'.repeat(spec.length), brand)
  const preenchido = formatCardNumber(digits, brand)
  const restante = mascara.slice(preenchido.length).replace(/0/g, '•')

  return (
    <div style={CARD_FACE}>
      {/* Brilho da marca, para o cartão não ficar um retângulo chapado. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.42) 0%, transparent 68%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Chip />
            <Wifi size={18} style={{ color: 'rgba(255,255,255,0.5)', transform: 'rotate(90deg)' }} aria-hidden />
          </div>
          <BrandMark brand={brand} />
        </div>

        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 'clamp(15px, 5.2vw, 20px)',
            letterSpacing: '0.06em',
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{preenchido}</span>
          <span style={{ color: 'rgba(255,255,255,0.32)' }}>{restante}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <span style={LABEL_MINI}>Titular</span>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: titular ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              {titular || 'NOME NO CARTÃO'}
            </span>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={LABEL_MINI}>Validade</span>
            <span
              style={{
                display: 'block',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
                fontWeight: 600,
                color: validade ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              {validade || 'MM/AA'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const LABEL_MINI: React.CSSProperties = {
  display: 'block',
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 3,
}

function CardBack({ cvv, brand }: { cvv: string; brand: CardBrand }) {
  const spec = brandSpec(brand)
  return (
    <div style={{ ...CARD_FACE, transform: 'rotateY(180deg)' }}>
      <div style={{ height: 22 }} />
      <div style={{ height: 44, background: '#0a0b10' }} aria-hidden />
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden
            style={{
              flex: 1,
              height: 30,
              borderRadius: 4,
              background: 'repeating-linear-gradient(135deg, #e9e9ef 0 6px, #dcdce4 6px 12px)',
            }}
          />
          <div
            style={{
              width: spec.cvv === 4 ? 62 : 54,
              height: 30,
              borderRadius: 4,
              background: '#fff',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.12em',
            }}
          >
            {cvv ? '•'.repeat(cvv.length) : <span style={{ color: '#9aa0ab', letterSpacing: 0 }}>CVV</span>}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 9, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)' }}>
          O código de segurança são os {spec.cvv} dígitos{' '}
          {spec.cvv === 4 ? 'impressos na frente do cartão' : 'no verso, ao lado da assinatura'}.
        </p>
        {/* A bandeira no rodapé fecha o verso — sem ela sobra um vazio que faz
            o cartão parecer cortado no meio. */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
          <BrandMark brand={brand} size="sm" />
        </div>
      </div>
    </div>
  )
}

// ─── Terminal ────────────────────────────────────────────────────────────────

const STATUS_TEXT: Record<TerminalStatus, string> = {
  idle: 'Insira os dados do cartão',
  filling: 'Lendo cartão...',
  ready: 'Cartão pronto',
  processing: 'Processando pagamento...',
}

const STATUS_COLOR: Record<TerminalStatus, string> = {
  idle: 'hsl(var(--muted-foreground))',
  filling: 'hsl(var(--primary))',
  ready: '#22c55e',
  processing: 'hsl(var(--primary))',
}

export interface CardTerminalProps {
  fields: CardFields
  onChange: (fields: CardFields) => void
  /** `payment_method_id` do Mercado Pago, quando o BIN já voltou. */
  mercadoPagoMethodId?: string | null
  /** Total a cobrar, já formatado. Aparece no display. */
  amountLabel: string
  /** Ex.: "12x de R$ 20,28". Opcional. */
  installmentLabel?: string
  /** Qual campo está focado — decide se o cartão mostra a frente ou o verso. */
  focused: keyof CardFields | null
  onFocusedChange: (field: keyof CardFields | null) => void
  status: TerminalStatus
  disabled?: boolean
  /** Campos extras do terminal (parcelas, CPF) — entram abaixo dos do cartão. */
  children?: ReactNode
}

export function CardTerminal(props: CardTerminalProps) {
  const { fields, onChange, focused } = props

  const brandMp = brandFromMercadoPagoId(props.mercadoPagoMethodId)
  const brand = brandMp !== 'unknown' ? brandMp : detectBrand(fields.number)
  const spec = brandSpec(brand)
  const validation = useMemo(() => validateCard(fields, brand), [fields, brand])

  const expiryRef = useRef<HTMLInputElement>(null)
  const cvvRef = useRef<HTMLInputElement>(null)
  const holderRef = useRef<HTMLInputElement>(null)

  // Reformata o que já foi digitado quando a bandeira muda o agrupamento
  // (um Amex digitado antes do BIN voltar estava em blocos de 4).
  useEffect(() => {
    const reformatado = formatCardNumber(fields.number, brand)
    if (reformatado !== fields.number) onChange({ ...fields, number: reformatado })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand])

  const virado = focused === 'cvv'

  function set(patch: Partial<CardFields>) {
    onChange({ ...fields, ...patch })
  }

  function onNumberChange(raw: string) {
    const formatado = formatCardNumber(raw, brand)
    set({ number: formatado })
    // Número completo → validade. Poupa um toque no celular, que é onde a
    // maioria paga.
    if (formatado.replace(/\D/g, '').length === spec.length) expiryRef.current?.focus()
  }

  function onExpiryChange(raw: string) {
    const formatado = formatExpiry(raw)
    set({ expiry: formatado })
    if (formatado.replace(/\D/g, '').length === 4) cvvRef.current?.focus()
  }

  function onCvvChange(raw: string) {
    const d = raw.replace(/\D/g, '').slice(0, spec.cvv)
    set({ cvv: d })
    if (d.length === spec.cvv) holderRef.current?.focus()
  }

  return (
    <div style={chassis}>
      {/* Display do terminal: estado da leitura + o que será cobrado. */}
      <div style={display}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            aria-hidden
            className={props.status === 'processing' ? 'animate-pulse' : undefined}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: STATUS_COLOR[props.status],
              boxShadow: `0 0 8px ${STATUS_COLOR[props.status]}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: STATUS_COLOR[props.status],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            aria-live="polite"
          >
            {STATUS_TEXT[props.status]}
          </span>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span
            style={{
              display: 'block',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 17,
              fontWeight: 700,
              color: 'hsl(var(--foreground))',
              lineHeight: 1.1,
            }}
          >
            {props.amountLabel}
          </span>
          {props.installmentLabel && (
            <span style={{ display: 'block', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
              {props.installmentLabel}
            </span>
          )}
        </div>
      </div>

      {/* Cartão. Decorativo: quem lê por leitor de tela usa os inputs abaixo. */}
      <div style={{ perspective: '1100px', padding: '18px 0 4px' }} aria-hidden>
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 340,
            margin: '0 auto',
            aspectRatio: '1.586',
            transformStyle: 'preserve-3d',
            transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.55s cubic-bezier(0.4, 0.15, 0.2, 1)',
          }}
        >
          <CardFront
            numero={fields.number}
            titular={fields.holder}
            validade={fields.expiry}
            brand={brand}
          />
          <CardBack cvv={fields.cvv} brand={brand} />
        </div>
      </div>

      {/* Campos, na ordem em que estão impressos no cartão. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14 }}>
        <Field
          label="Número do cartão"
          hint={BRAND_LABEL[brand] !== 'Cartão' ? BRAND_LABEL[brand] : undefined}
          error={
            fields.number.replace(/\D/g, '').length >= spec.length && !validation.numberValid
              ? 'Número inválido. Confira os dígitos.'
              : undefined
          }
        >
          <input
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            required
            disabled={props.disabled}
            value={fields.number}
            onChange={e => onNumberChange(e.target.value)}
            onFocus={() => props.onFocusedChange('number')}
            onBlur={() => props.onFocusedChange(null)}
            placeholder={formatCardNumber('0'.repeat(spec.length), brand).replace(/0/g, '•')}
            style={input(focused === 'number')}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field
            label="Validade"
            error={
              fields.expiry.replace(/\D/g, '').length === 4 && !validation.expiryValid
                ? 'Cartão vencido.'
                : undefined
            }
          >
            <input
              ref={expiryRef}
              name="cardExpiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              required
              disabled={props.disabled}
              value={fields.expiry}
              onChange={e => onExpiryChange(e.target.value)}
              onFocus={() => props.onFocusedChange('expiry')}
              onBlur={() => props.onFocusedChange(null)}
              placeholder="MM/AA"
              style={input(focused === 'expiry')}
            />
          </Field>
          <Field label={`CVV (${spec.cvv} dígitos)`}>
            <input
              ref={cvvRef}
              name="securityCode"
              inputMode="numeric"
              autoComplete="cc-csc"
              required
              disabled={props.disabled}
              value={fields.cvv}
              onChange={e => onCvvChange(e.target.value)}
              onFocus={() => props.onFocusedChange('cvv')}
              onBlur={() => props.onFocusedChange(null)}
              placeholder={'•'.repeat(spec.cvv)}
              style={input(focused === 'cvv')}
            />
          </Field>
        </div>

        <Field
          label="Nome impresso no cartão"
          error={
            fields.holder.trim().length > 2 && !validation.holderValid
              ? 'Digite o nome completo, como está no cartão.'
              : undefined
          }
        >
          <input
            ref={holderRef}
            name="cardholderName"
            autoComplete="cc-name"
            required
            disabled={props.disabled}
            value={fields.holder}
            onChange={e => set({ holder: e.target.value.replace(/[0-9]/g, '') })}
            onFocus={() => props.onFocusedChange('holder')}
            onBlur={() => props.onFocusedChange(null)}
            placeholder="Como está no cartão"
            style={{ ...input(focused === 'holder'), textTransform: 'uppercase' }}
          />
        </Field>

        {props.children}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          paddingTop: 14,
          marginTop: 14,
          borderTop: '1px solid hsl(var(--border))',
          fontSize: 10.5,
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Lock size={11} /> Criptografado
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ShieldCheck size={11} /> Não guardamos seu cartão
        </span>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <label style={fieldLabel}>{label}</label>
        {hint && (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--primary))', letterSpacing: '0.02em' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
      {error && (
        <span style={{ display: 'block', marginTop: 5, fontSize: 11, color: 'hsl(var(--destructive))' }}>{error}</span>
      )}
    </div>
  )
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const chassis: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--muted) / 0.35)',
  padding: 16,
}

const display: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  // Recuo de tela: o fundo mais escuro que o chassi é o que dá a leitura de
  // "display" sem precisar de imagem nenhuma.
  background: 'hsl(var(--background))',
  boxShadow: 'inset 0 2px 8px hsl(var(--foreground) / 0.07)',
  padding: '11px 14px',
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'hsl(var(--muted-foreground))',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

function input(ativo: boolean): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    height: 44,
    padding: '0 13px',
    borderRadius: 10,
    border: `1.5px solid ${ativo ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
    background: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    fontSize: 15,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    letterSpacing: '0.03em',
    outline: 'none',
    boxShadow: ativo ? '0 0 0 3px hsl(var(--primary) / 0.14)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
}

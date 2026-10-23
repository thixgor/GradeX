'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, LogIn,
  MailCheck, PartyPopper, ShieldCheck, Sparkles, UserPlus,
} from 'lucide-react'
import { clearBootstrapCache } from '@/hooks/use-bootstrap'

/**
 * "Falta um passo: crie sua conta — o produto já entra ativado."
 *
 * Aparece depois da compra sem login (em /compra/aprovada e em /ativar). Três
 * situações, uma caixa:
 *
 *  - O e-mail da compra NÃO tem conta → formulário curto (nome e senha; o
 *    e-mail é o da compra e não muda). Criou, entrou, e as keys do pedido já
 *    estão ativadas nela.
 *  - O e-mail JÁ tem conta e a pessoa não entrou → "Entrar e ativar", que volta
 *    para cá com a ativação engatilhada.
 *  - A pessoa já entrou → um botão ativa tudo na conta dela.
 *
 * A Serial Key continua valendo em qualquer caso: esta caixa é um atalho, não
 * um portão. Quem fecha a página ativa depois pelo link do e-mail.
 */

/** O segredo que a pessoa tem na mão e que autoriza a ativação. */
export type CompraDaConta =
  | { orderId: string; receiptToken: string }
  | { activationToken: string }
  | { key: string }

export interface ContaPosCompraProps {
  compra: CompraDaConta
  /** E-mail da compra — vira o login da conta nova. */
  email: string
  nomeSugerido?: string
  /** Títulos do que será ativado (para a pessoa ver o que ganha). */
  produtos: string[]
  /** `null` enquanto não sabemos se há sessão. */
  sessao: { email: string; name?: string } | null | undefined
  /** O e-mail da compra já tem conta no site. */
  contaExiste: boolean
  /** Para onde o login devolve a pessoa (com a ativação engatilhada). */
  loginRedirect: string
  /** Dispara a ativação sozinha ao montar (a pessoa acabou de entrar para isso). */
  autoVincular?: boolean
  /** Avisado quando a ativação aconteceu — a página atualiza o que mostra. */
  onAtivado?: () => void
}

interface Resultado {
  ativadas: string[]
  falharam: string[]
  restritas?: string[]
  redirectTo: string
  contaNova: boolean
}

function forcaDaSenha(senha: string): { nivel: 0 | 1 | 2 | 3 | 4; rotulo: string } {
  if (!senha) return { nivel: 0, rotulo: '' }
  if (senha.length < 6) return { nivel: 1, rotulo: 'Curta demais' }
  let pontos = 1
  if (senha.length >= 10) pontos++
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++
  if (/\d/.test(senha) && /[^A-Za-z0-9]/.test(senha)) pontos++
  const nivel = Math.min(4, pontos) as 1 | 2 | 3 | 4
  return { nivel, rotulo: ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][nivel] }
}

const CORES_DA_FORCA = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-300']

export function ContaPosCompra({
  compra,
  email,
  nomeSugerido = '',
  produtos,
  sessao,
  contaExiste,
  loginRedirect,
  autoVincular = false,
  onAtivado,
}: ContaPosCompraProps) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeSugerido)
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [jaExiste, setJaExiste] = useState(contaExiste)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const autoDisparado = useRef(false)

  useEffect(() => setJaExiste(contaExiste), [contaExiste])
  useEffect(() => { if (!nome && nomeSugerido) setNome(nomeSugerido) }, [nomeSugerido]) // eslint-disable-line react-hooks/exhaustive-deps

  const forca = useMemo(() => forcaDaSenha(senha), [senha])
  const qtd = produtos.length
  const oQue = qtd > 1 ? `seus ${qtd} produtos` : (produtos[0] || 'seu produto')

  async function enviar(acao: 'criar' | 'vincular') {
    if (enviando) return
    setErro('')
    if (acao === 'criar') {
      if (nome.trim().length < 2) { setErro('Informe seu nome.'); return }
      if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/serial-keys/conta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...compra,
          acao,
          ...(acao === 'criar' ? { name: nome.trim(), password: senha } : {}),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.contaExiste) setJaExiste(true)
        if (json.requiresAuth) { router.push(`/auth/login?redirect=${encodeURIComponent(loginRedirect)}`); return }
        setErro(json.error || 'Não foi possível concluir agora. Tente novamente.')
        return
      }
      // A sessão mudou (conta nova) ou ganhou acesso: o cache do app é velho.
      clearBootstrapCache()
      setResultado({
        ativadas: json.ativadas || [],
        falharam: json.falharam || [],
        restritas: json.restritas || [],
        redirectTo: json.redirectTo || '/dashboard',
        contaNova: acao === 'criar',
      })
      onAtivado?.()
    } catch {
      setErro('Sem conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    if (!autoVincular || autoDisparado.current || !sessao) return
    autoDisparado.current = true
    void enviar('vincular')
  }, [autoVincular, sessao]) // eslint-disable-line react-hooks/exhaustive-deps

  const passo = resultado ? 3 : 2

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[20px] border border-emerald-300/30 bg-[rgba(6,20,10,0.88)] text-white shadow-[0_0_60px_rgba(52,211,153,0.14)] backdrop-blur-xl"
    >
      {/* Brilho de fundo — só decoração. */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative p-5 sm:p-7">
        <Passos atual={passo} />

        <AnimatePresence mode="wait">
          {resultado ? (
            <Sucesso key="ok" resultado={resultado} email={sessao?.email || email} nome={nome} />
          ) : sessao ? (
            <motion.div key="vincular" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Cabecalho
                icone={<ShieldCheck className="h-5 w-5" />}
                titulo={`Ative ${oQue} na sua conta`}
                texto={<>Você entrou como <strong className="text-white">{sessao.email}</strong>. Um clique e está liberado — sem copiar Serial Key.</>}
              />
              <ListaDeProdutos produtos={produtos} />
              {sessao.email.trim().toLowerCase() !== email.trim().toLowerCase() && (
                <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                  A compra foi feita com {email}. Os itens liberados só para esse e-mail continuam esperando por ele.
                </p>
              )}
              <Erro texto={erro} />
              <BotaoPrincipal onClick={() => enviar('vincular')} carregando={enviando}>
                <Sparkles className="h-4 w-4" /> Ativar na minha conta
              </BotaoPrincipal>
            </motion.div>
          ) : jaExiste ? (
            <motion.div key="entrar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Cabecalho
                icone={<LogIn className="h-5 w-5" />}
                titulo="Você já tem conta com esse e-mail"
                texto={<>Entre com <strong className="text-white">{email}</strong> e {oQue} {qtd > 1 ? 'são ativados' : 'é ativado'} na hora — você volta para cá já com tudo liberado.</>}
              />
              <ListaDeProdutos produtos={produtos} />
              <Erro texto={erro} />
              <a
                href={`/auth/login?redirect=${encodeURIComponent(loginRedirect)}`}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-[15px] font-bold text-white shadow-[0_0_30px_rgba(52,211,153,0.3)] transition hover:brightness-110 active:scale-[0.99]"
              >
                <LogIn className="h-4 w-4" /> Entrar e ativar
              </a>
              <RodapeSerial />
            </motion.div>
          ) : (
            <motion.form
              key="criar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={(e) => { e.preventDefault(); void enviar('criar') }}
            >
              <Cabecalho
                icone={<UserPlus className="h-5 w-5" />}
                titulo="Falta só criar sua senha"
                texto={<>Sua conta nasce com <strong className="text-white">{oQue}</strong> <strong className="text-emerald-300">{qtd > 1 ? 'já ativados' : 'já ativado'}</strong>. Sem copiar Serial Key, sem voltar ao e-mail.</>}
              />
              <ListaDeProdutos produtos={produtos} />

              <div className="mt-5 grid gap-3">
                <div>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-300/80">E-mail da compra</span>
                  <div className="flex h-12 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white/80">
                    <Lock className="h-4 w-4 shrink-0 text-emerald-300/70" />
                    <span className="min-w-0 flex-1 truncate">{email}</span>
                    <span className="shrink-0 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">seu login</span>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-300/80">Seu nome</span>
                  <input
                    value={nome}
                    onChange={(e) => { setNome(e.target.value); setErro('') }}
                    autoComplete="name"
                    maxLength={120}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/60 focus:bg-white/[0.07]"
                    placeholder="Como você quer ser chamado"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-300/80">Crie uma senha</span>
                  <div className="relative">
                    <input
                      value={senha}
                      onChange={(e) => { setSenha(e.target.value); setErro('') }}
                      type={mostrarSenha ? 'text' : 'password'}
                      autoComplete="new-password"
                      maxLength={128}
                      autoFocus
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-3.5 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/60 focus:bg-white/[0.07]"
                      placeholder="Mínimo de 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {senha && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${i <= forca.nivel ? CORES_DA_FORCA[forca.nivel] : 'bg-white/10'}`}
                          />
                        ))}
                      </div>
                      <span className="w-16 text-right text-[11px] font-semibold text-white/55">{forca.rotulo}</span>
                    </div>
                  )}
                </label>
              </div>

              <Erro texto={erro} />

              <BotaoPrincipal type="submit" carregando={enviando}>
                <Sparkles className="h-4 w-4" /> Criar conta e ativar
              </BotaoPrincipal>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
                Ao criar a conta você concorda com os{' '}
                <a href="/termos-de-servico" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/70">termos de uso</a>.
              </p>
              <RodapeSerial />
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

/* ───────────────────────────── Peças ───────────────────────────── */

function Passos({ atual }: { atual: 2 | 3 }) {
  const passos = ['Pagamento', 'Sua conta', 'Produto ativo']
  return (
    <ol className="mb-5 flex items-center gap-2" aria-label="Etapas">
      {passos.map((rotulo, i) => {
        const n = i + 1
        const feito = n < atual || (n === 3 && atual === 3)
        const agora = n === atual && !feito
        return (
          <li key={rotulo} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors ${
                feito
                  ? 'bg-emerald-400 text-emerald-950'
                  : agora
                    ? 'border-2 border-emerald-300 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.5)]'
                    : 'border border-white/20 text-white/40'
              }`}
            >
              {feito ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={`truncate text-[11px] font-semibold ${feito || agora ? 'text-white/85' : 'text-white/35'}`}>{rotulo}</span>
            {n < passos.length && <span className={`hidden h-px flex-1 sm:block ${feito ? 'bg-emerald-400/60' : 'bg-white/10'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

function Cabecalho({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
        {icone}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold leading-tight tracking-[-0.01em] sm:text-xl">{titulo}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-white/65">{texto}</p>
      </div>
    </div>
  )
}

function ListaDeProdutos({ produtos }: { produtos: string[] }) {
  if (produtos.length === 0) return null
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5">
      {produtos.slice(0, 6).map((titulo, i) => (
        <li
          key={`${titulo}-${i}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-2.5 py-1 text-[12px] font-semibold text-emerald-100"
        >
          <KeyRound className="h-3 w-3 shrink-0 text-emerald-300" />
          <span className="truncate">{titulo}</span>
        </li>
      ))}
      {produtos.length > 6 && (
        <li className="rounded-full border border-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/55">
          +{produtos.length - 6}
        </li>
      )}
    </ul>
  )
}

function Erro({ texto }: { texto: string }) {
  if (!texto) return null
  return (
    <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-[13px] font-medium text-rose-200">
      {texto}
    </p>
  )
}

function BotaoPrincipal({
  children,
  carregando,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode
  carregando: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={carregando}
      className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-[15px] font-bold text-white shadow-[0_0_30px_rgba(52,211,153,0.3)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
    >
      {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  )
}

function RodapeSerial() {
  return (
    <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-white/40">
      <KeyRound className="mt-0.5 h-3 w-3 shrink-0" />
      Prefere depois? Sua Serial Key continua valendo no e-mail — ative quando quiser.
    </p>
  )
}

function Sucesso({ resultado, email, nome }: { resultado: Resultado; email: string; nome: string }) {
  const primeiro = nome.trim().split(' ')[0]
  const pendentes = [...resultado.falharam, ...(resultado.restritas || [])]
  return (
    <motion.div key="sucesso" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.35),rgba(52,211,153,0.05))]"
      >
        <PartyPopper className="h-8 w-8 text-emerald-300" />
      </motion.div>
      <h2 className="text-xl font-extrabold tracking-[-0.01em] sm:text-2xl">
        {primeiro ? `Tudo pronto, ${primeiro}!` : 'Tudo pronto!'}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-white/65">
        {resultado.contaNova ? 'Sua conta foi criada e você já está dentro dela. ' : ''}
        {resultado.ativadas.length > 0
          ? 'O que você comprou já está liberado:'
          : 'Não conseguimos ativar agora — sua Serial Key continua valendo no e-mail.'}
      </p>

      {resultado.ativadas.length > 0 && (
        <ul className="mx-auto mt-4 grid max-w-md gap-2 text-left">
          {resultado.ativadas.map((titulo, i) => (
            <motion.li
              key={`${titulo}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-2.5 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-2.5 text-[13px] font-semibold"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
              <span className="min-w-0 flex-1 truncate">{titulo}</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-300">ativo</span>
            </motion.li>
          ))}
        </ul>
      )}

      {pendentes.length > 0 && resultado.ativadas.length > 0 && (
        <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-amber-200/90">
          {pendentes.join(', ')} ficou para ativar pelo link do e-mail.
        </p>
      )}

      {resultado.contaNova && (
        <p className="mx-auto mt-4 flex max-w-md items-start justify-center gap-1.5 text-[12px] leading-relaxed text-white/50">
          <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/80" />
          Enviamos um link de confirmação para {email}. Confirme quando puder.
        </p>
      )}

      <a
        href={resultado.redirectTo}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-[15px] font-bold text-white shadow-[0_0_30px_rgba(52,211,153,0.3)] transition hover:brightness-110 active:scale-[0.99]"
      >
        Acessar agora <ArrowRight className="h-4 w-4" />
      </a>
    </motion.div>
  )
}

export default ContaPosCompra

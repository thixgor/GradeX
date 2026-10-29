'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { trackMeta } from '@/lib/meta-pixel'
import { Eye, EyeOff, ArrowLeft, Loader2, Brain, Database, BookMarked, Zap, Ban, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BanReasonLabels, BanReason } from '@/lib/types'
import { GoogleProfileSetupDialog } from '@/components/google-profile-setup-dialog'
import { clearBootstrapCache } from '@/hooks/use-bootstrap'
import { ACERVO_ANUNCIADO, rotuloDoAcervo } from '@/lib/banco/acervo-publico'
import { AuthShell } from '@/components/auth/auth-shell'
import {
  Aviso,
  BotaoAcao,
  BotaoVidro,
  CabecalhoAuth,
  Campo,
  CampoDeCodigo,
  CartaoAuth,
  ControleSegmentado,
  GrupoDeCampos,
  Selo,
  useCapsLock,
} from '@/components/auth/auth-ui'

declare global {
  interface Window {
    google?: any
    grecaptcha?: any
  }
}

// O número é o piso de `acervo-publico.ts`, não uma contagem: esta tela é
// estática e não pergunta à API a cada visita.
const ACERVO = rotuloDoAcervo(ACERVO_ANUNCIADO) ?? 'Milhares de questões'

const destaques = [
  { icon: Database, forte: ACERVO, texto: 'comentadas, por curso e período' },
  { icon: Brain, forte: 'Flashcards', texto: 'com repetição espaçada por IA' },
  { icon: BookMarked, forte: 'Resumos', texto: 'grátis e premium de todas as disciplinas' },
  { icon: Zap, forte: 'Provas reais', texto: 'e simulados com correção automática' },
]

/**
 * A tela de entrar/criar conta.
 *
 * `mode` chega como PROP — a rota de criar conta é outra página estática, para
 * onde o middleware reescreve `?mode=register` — e `redirect` é lido do
 * endereço na hora de desviar (`destinoDepoisDoLogin`); nada disso passa por
 * `useSearchParams()`. O hook obriga a rota a desistir de renderizar
 * no servidor: o HTML que chegava ao navegador era só o spinner de tela cheia,
 * e o formulário só existia depois de o JS baixar, analisar e montar 1.100
 * linhas de componente. Em celular na rua isso era um "carregando" inteiro
 * entre tocar em "Entrar" e ver onde digitar o e-mail. Com as props, o
 * formulário — no modo certo — vem pronto no HTML.
 */
// Só permite redirecionamentos internos (evita open-redirect via ?redirect=).
// Sem um "?redirect=" explícito, o destino padrão é direto o dashboard — ir
// para "/" faria essa rota re-renderizar a landing page por um instante antes
// do desvio para o dashboard, causando um flash visível da landing (com o
// rodapé) logo após o login.
function safeInternalPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/dashboard'
  return target
}

/** Para onde ir depois de entrar: o `?redirect=` do endereço, se for interno. */
function destinoDepoisDoLogin(): string {
  return safeInternalPath(new URLSearchParams(window.location.search).get('redirect'))
}

export default function LoginView({
  initialMode,
}: {
  initialMode: string | null
}) {
  const router = useRouter()
  const { capsLigado, propsDoCapsLock } = useCapsLock()

  const [isLogin, setIsLogin] = useState(initialMode !== 'register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  // Erro do passo de criar a conta pelo Google: mostrado dentro do modal, não
  // atrás dele (antes a mensagem caía no formulário, escondida pelo overlay).
  const [setupError, setSetupError] = useState('')
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [googleData, setGoogleData] = useState<{
    email: string
    name?: string
    picture?: string
    googleId: string
  } | null>(null)
  // O ID token é reenviado no passo de criar a conta: é ele que prova, no
  // servidor, de quem é o e-mail. Sem isso o cadastro aceitaria qualquer e-mail
  // digitado no corpo do request.
  const [googleCredential, setGoogleCredential] = useState<string | null>(null)
  const [banInfo, setBanInfo] = useState<{
    reason?: BanReason
    details?: string
    bannedAt?: Date
  }>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
    profession: '' as '' | 'medico' | 'academico' | 'residente',
    state: '',
    phone: '',
    specialty: '',
    residencySpecialty: '',
    residencyHospital: '',
    residencyYear: '',
    isAfyaMedicineStudent: false,
    afyaUnit: '',
    periodo: '',
    role: 'user',
  })

  const [isRegistered, setIsRegistered] = useState(false)
  // O cadastro veio com `?redirect=` interno: a tela de sucesso devolve lá.
  const [temRedirect, setTemRedirect] = useState(false)

  // Verificação de código por email (2FA de administrador)
  const [emailCodeRequired, setEmailCodeRequired] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const canBeAdmin = ['throdrigf@gmail.com', 'ecocardio93@gmail.com'].includes(
    formData.email.toLowerCase().trim()
  )

  // Se o usuário já está autenticado, não faz sentido mostrar o formulário de
  // login. Isso acontece quando ele aperta "Voltar" no navegador depois de
  // logar (página restaurada do bfcache, com o form "deslogado" congelado) ou
  // navega para /auth/login com a sessão ainda válida. Verificamos a sessão no
  // mount e a cada `pageshow` (que dispara na restauração do bfcache) e, se
  // autenticado, mandamos direto para o destino em vez do formulário.
  useEffect(() => {
    let cancelled = false

    const checkSessionAndRedirect = () => {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then((r) => {
          if (!cancelled && r.ok) {
            window.location.replace(destinoDepoisDoLogin())
          }
        })
        .catch(() => {})
    }

    checkSessionAndRedirect()

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkSessionAndRedirect()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {})
      }
    }
    document.head.appendChild(script)
    return () => {
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  // ── Google Identity Services ──────────────────────────────────────────
  // O script carrega uma vez só; o botão é redesenhado quando o modo (entrar /
  // criar conta) ou o tema mudam. Antes o `renderButton` era condicionado a
  // `isLogin`, e por isso quem chegava em /auth/login?mode=register não via
  // nenhuma menção ao Google — a opção existia, mas ficava escondida atrás do
  // link "Já tem uma conta?".
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleCallbackRef = useRef<(response: any) => void>(() => {})
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    // Sem client id o GIS não renderiza nada (área branca). Sinaliza erro para
    // exibir o fallback em vez de um espaço vazio.
    if (!clientId) {
      setGoogleStatus('error')
      return
    }

    let cancelled = false
    setGoogleStatus('loading')

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (cancelled) return
      try {
        if (!window.google) {
          setGoogleStatus('error')
          return
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          // Via ref: o callback registrado no GIS é fixo, mas precisa enxergar
          // o estado atual do componente.
          callback: (response: any) => googleCallbackRef.current(response),
        })
        setGoogleStatus('ready')
      } catch {
        setGoogleStatus('error')
      }
    }
    script.onerror = () => {
      if (!cancelled) setGoogleStatus('error')
    }
    document.head.appendChild(script)

    // Bloqueador de anúncios, rede corporativa, DNS capenga: o `onerror` nem
    // sempre dispara e o spinner ficaria girando para sempre. Passados 8s sem
    // resposta, mostramos o caminho do e-mail.
    const timeout = setTimeout(() => {
      if (!cancelled) setGoogleStatus((status) => (status === 'ready' ? status : 'error'))
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  const renderGoogleButton = useCallback(() => {
    if (googleStatus !== 'ready' || typeof window === 'undefined' || !window.google) return
    const target = googleButtonRef.current
    if (!target) return

    // O GIS desenha com largura fixa em px (máximo 400), então medimos o
    // espaço real do cartão para o botão não ficar mais estreito que o resto
    // do formulário.
    const width = Math.round(Math.min(400, Math.max(240, target.clientWidth || 320)))
    target.innerHTML = ''
    try {
      window.google.accounts.id.renderButton(target, {
        type: 'standard',
        theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        // "Cadastrar com o Google" no modo de criar conta, "Entrar com o
        // Google" no de entrar: o rótulo é o que deixa claro que dá para se
        // cadastrar por aqui.
        text: isLogin ? 'signin_with' : 'signup_with',
        logo_alignment: 'left',
        locale: 'pt-BR',
        width,
      })
    } catch {
      setGoogleStatus('error')
    }
    // `emailCodeRequired`/`isRegistered` trocam o conteúdo do cartão e
    // desmontam o alvo: ao voltar para o formulário o botão precisa ser
    // desenhado de novo, senão fica um buraco no lugar dele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleStatus, isLogin, resolvedTheme, emailCodeRequired, isRegistered])

  useEffect(() => {
    renderGoogleButton()
  }, [renderGoogleButton])

  // O botão nasce com largura fixa: sem redesenhar, girar o celular deixa ele
  // desalinhado com os campos.
  useEffect(() => {
    if (googleStatus !== 'ready') return
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(renderGoogleButton, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [googleStatus, renderGoogleButton])

  // `handleGoogleLogin` é recriado a cada render; o GIS guarda só a primeira
  // referência, então o ref é atualizado a cada render para o clique no botão
  // sempre cair na versão atual.
  useEffect(() => {
    googleCallbackRef.current = handleGoogleLogin
  })

  // ── reCAPTCHA pré-aquecido ────────────────────────────────────────────
  // O token v3 leva 150-600ms para ser emitido e antes isso acontecia DEPOIS
  // do clique, com o botão travado. Emitimos assim que o usuário toca no
  // formulário, então na hora do submit ele normalmente já está pronto.
  // Tokens v3 valem 120s e são de uso único — daí o TTL com margem e o
  // descarte após consumir.
  const RECAPTCHA_TOKEN_TTL_MS = 100_000
  const primedRecaptchaRef = useRef<{
    action: string
    at: number
    promise: Promise<string>
  } | null>(null)

  const primeRecaptcha = useCallback(() => {
    if (typeof window === 'undefined') return
    const g = window.grecaptcha
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!g || typeof g.execute !== 'function' || !siteKey) return

    const action = isLogin ? 'login' : 'register'
    const current = primedRecaptchaRef.current
    if (
      current &&
      current.action === action &&
      Date.now() - current.at < RECAPTCHA_TOKEN_TTL_MS
    ) {
      return
    }

    try {
      const promise: Promise<string> = g.execute(siteKey, { action })
      // Sem handler, uma falha aqui viraria unhandled rejection no console.
      promise.catch(() => {})
      primedRecaptchaRef.current = { action, at: Date.now(), promise }
    } catch {
      // grecaptcha ainda não pronto — o submit executa na hora, como antes.
    }
  }, [isLogin])

  const consumePrimedRecaptcha = useCallback(
    async (action: string): Promise<string | undefined> => {
      const primed = primedRecaptchaRef.current
      if (!primed) return undefined
      // Consome: token v3 é de uso único.
      primedRecaptchaRef.current = null
      if (primed.action !== action) return undefined
      if (Date.now() - primed.at >= RECAPTCHA_TOKEN_TTL_MS) return undefined
      try {
        return await primed.promise
      } catch {
        return undefined
      }
    },
    [],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!window.grecaptcha) {
        setError('reCAPTCHA nao carregado. Tente novamente.')
        setLoading(false)
        return
      }

      // Usa o token pré-aquecido quando existir (ver `primeRecaptcha`). Assim o
      // clique em Entrar não paga os 150-600ms da ida ao Google — ela já
      // aconteceu enquanto o usuário digitava. Se não houver token válido,
      // executa na hora, exatamente como antes.
      const action = isLogin ? 'login' : 'register'
      let token: string | undefined = await consumePrimedRecaptcha(action)

      if (!token) {
        token = await window.grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          { action }
        )
      }

      if (!token) {
        setError('Falha ao verificar reCAPTCHA. Tente novamente.')
        setLoading(false)
        return
      }

      if (!isLogin) {
        // Cadastro de baixa fricção: só nome, email e senha. O restante do perfil
        // é completado depois, dentro do app. Menos campos = mais contas criadas.
        if (!formData.name || !formData.email || !formData.password) {
          setError('Preencha nome, email e senha')
          setLoading(false)
          return
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email: formData.email, password: formData.password, recaptchaToken: token }
        : { ...formData, recaptchaToken: token }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Erro ao autenticar')
      }

      if (!isLogin) {
        // Conversão de topo do funil: conta grátis criada (o "teste grátis"
        // prometido no anúncio). É o evento que o algoritmo do Meta usa para
        // aprender a encontrar quem se cadastra.
        trackMeta('CompleteRegistration', { content_name: 'Cadastro gratuito' })
        setTemRedirect(Boolean(new URLSearchParams(window.location.search).get('redirect')))
        setIsRegistered(true)
      } else if (data.requiresEmailCode) {
        // Conta de administrador: exige código enviado por email antes de entrar.
        setPendingEmail(data.email || formData.email)
        setEmailCodeRequired(true)
        setLoginCode('')
        setResendCooldown(60)
      } else {
        clearBootstrapCache()
        // Navegação completa (não router.push + refresh): o cookie de auth já
        // foi setado, então o destino renderiza do zero no servidor. Evita a
        // tela branca que o push+refresh causava no mobile.
        window.location.assign(destinoDepoisDoLogin())
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cooldown do botão de reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (loginCode.trim().length < 6) {
      setError('Digite o código de 6 dígitos enviado ao seu email.')
      return
    }
    setCodeLoading(true)
    try {
      const res = await fetch('/api/auth/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: loginCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Código inválido')
      }
      clearBootstrapCache()
      window.location.assign(destinoDepoisDoLogin())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCodeLoading(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return
    setError('')
    try {
      const res = await fetch('/api/auth/login/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Não foi possível reenviar o código')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function cancelEmailCode() {
    setEmailCodeRequired(false)
    setLoginCode('')
    setPendingEmail('')
    setError('')
  }

  async function handleGoogleLogin(response: any) {
    setError('')

    if (!response?.credential) {
      setError('Não foi possível obter as credenciais do Google. Tente novamente.')
      return
    }

    setGoogleLoading(true)

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        if (data.error === 'blocked') {
          setBlockedMessage(data.message)
          setShowBlockedModal(true)
          return
        }
        throw new Error(data.error || 'Erro ao fazer login com Google')
      }

      if (data.requiresProfileSetup) {
        setGoogleData(data.googleData)
        setGoogleCredential(response.credential)
        setShowProfileSetup(true)
        return
      }

      clearBootstrapCache()
      window.location.assign(destinoDepoisDoLogin())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleProfileSetupComplete(setupData: { profileName: string }) {
    if (!googleData || !googleCredential) return
    setGoogleLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/google/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: googleCredential,
          profileName: setupData.profileName,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'blocked') {
          setShowProfileSetup(false)
          setBlockedMessage(data.message)
          setShowBlockedModal(true)
          return
        }
        if (data.error === 'banned') {
          setShowProfileSetup(false)
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Erro ao criar sua conta')
      }

      // Mesma conversão de topo de funil do cadastro por e-mail — o Meta
      // aprende com os dois caminhos.
      trackMeta('CompleteRegistration', { content_name: 'Cadastro com Google' })
      setShowProfileSetup(false)
      clearBootstrapCache()
      window.location.assign(destinoDepoisDoLogin())
    } catch (err: any) {
      setSetupError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  function handleProfileSetupCancel() {
    setShowProfileSetup(false)
    setGoogleData(null)
    setGoogleCredential(null)
    setSetupError('')
    setError('')
    // Sem isto o GIS lembra da conta escolhida e reabre no mesmo e-mail que a
    // pessoa acabou de recusar.
    try { window.google?.accounts?.id?.disableAutoSelect?.() } catch {}
  }


  function trocarModo(entrar: boolean) {
    setIsLogin(entrar)
    setError('')
  }

  const ladoDaMarca = (
    <>
      <p className="auth-titulo-marca">
        Estude mais <em>inteligente.</em>
      </p>
      <p className="mt-4 max-w-[27rem] text-[17px] leading-relaxed text-[color:var(--texto-2)]">
        Plataforma completa de estudo para alunos de saúde: questões, flashcards, resumos e muito mais.
      </p>
      <ul className="auth-lista">
        {destaques.map(({ icon: Icon, forte, texto }) => (
          <li key={forte}>
            <span className="auth-icone">
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span>
              <strong>{forte}</strong> {texto}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-9 inline-flex items-center gap-2.5 text-sm font-semibold text-primary">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Acesso gratuito para começar
      </p>
    </>
  )

  return (
    <AuthShell layout="dividido" aside={ladoDaMarca}>
      <CartaoAuth>
        {emailCodeRequired ? (
          <form key="codigo" onSubmit={handleVerifyCode} className="auth-troca space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Selo tipo="email" />
              <CabecalhoAuth
                titulo="Verificação de administrador"
                subtitulo={
                  <>
                    Enviamos um código de 6 dígitos para{' '}
                    <strong className="font-semibold text-foreground">{pendingEmail}</strong>
                  </>
                }
              />
            </div>

            <CampoDeCodigo
              id="loginCode"
              rotulo="Código de verificação"
              valor={loginCode}
              onChange={setLoginCode}
              autoFocus
            />

            {error && <Aviso>{error}</Aviso>}

            <BotaoAcao carregando={codeLoading} textoCarregando="Verificando…">
              Confirmar e entrar
            </BotaoAcao>

            <div className="flex items-center justify-between">
              <button type="button" onClick={cancelEmailCode} className="link-discreto inline-flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className="link-auth text-sm tabular-nums"
              >
                {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
              </button>
            </div>
          </form>
        ) : isRegistered ? (
          <div key="pronto" className="auth-troca flex flex-col items-center gap-6 text-center">
            <Selo tipo="sucesso" />
            <CabecalhoAuth
              titulo="Conta criada com sucesso!"
              subtitulo={
                <>
                  Enviamos um link de confirmação para{' '}
                  <strong className="font-semibold text-foreground">{formData.email}</strong>
                </>
              }
            />
            <div className="w-full text-left">
              <Aviso tipo="atencao">
                <strong>Atenção:</strong> confirme seu e-mail para ter acesso completo à plataforma.
              </Aviso>
            </div>
            <div className="w-full space-y-3">
              {/* O cadastro já deixa a sessão aberta. Quem veio de um
                  `?redirect=` (ex.: ativar a Serial Key de uma compra)
                  volta para lá — antes caía no início e perdia o passo. */}
              {temRedirect ? (
                <BotaoAcao
                  type="button"
                  onClick={() => { clearBootstrapCache(); window.location.assign(destinoDepoisDoLogin()) }}
                >
                  Continuar
                </BotaoAcao>
              ) : (
                <BotaoAcao type="button" onClick={() => router.push('/')}>
                  Ir para o início
                </BotaoAcao>
              )}
              <BotaoVidro onClick={() => { setIsRegistered(false); trocarModo(true) }}>
                Fazer login agora
              </BotaoVidro>
            </div>
          </div>
        ) : (
          <form key="formulario" onSubmit={handleSubmit} className="space-y-5">
            <ControleSegmentado
              rotulo="Entrar ou criar conta"
              opcoes={['Entrar', 'Criar conta']}
              ativo={isLogin ? 0 : 1}
              onChange={(i) => trocarModo(i === 0)}
            />

            <CabecalhoAuth
              chave={isLogin ? 'entrar' : 'criar'}
              titulo={isLogin ? 'Entrar na plataforma' : 'Sua conta grátis em 10 segundos'}
              subtitulo={
                isLogin
                  ? 'Bem-vindo de volta, continue de onde parou.'
                  : 'Com o Google em um toque, ou com e-mail e senha. Sem cartão.'
              }
            />

            {/* ── Google: primeiro, porque é o caminho mais curto ──
                Vale nos dois modos. No cadastro é o que responde à
                pergunta "dá para criar conta com o Google?" sem a pessoa
                precisar procurar. */}
            <div className="space-y-2">
              <div
                ref={googleButtonRef}
                className={googleStatus === 'ready' ? 'flex min-h-[44px] justify-center' : 'hidden'}
              />

              {googleStatus === 'loading' && (
                <div className="botao-vidro pointer-events-none text-[color:var(--texto-2)]" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Carregando o Google…
                </div>
              )}

              {googleStatus === 'error' && (
                <Aviso tipo="neutro">
                  {isLogin ? 'Entrar' : 'Cadastro'} com Google indisponível no momento. Use seu e-mail e senha abaixo.
                </Aviso>
              )}

              {googleLoading && !showProfileSetup && (
                <p className="flex items-center justify-center gap-2 text-[13px] text-[color:var(--texto-2)]" aria-live="polite">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Conectando com o Google…
                </p>
              )}

              {!isLogin && googleStatus !== 'error' && (
                <p className="text-center text-[13px] text-[color:var(--texto-2)]">
                  Cadastro em um toque: sem criar senha e sem confirmar e-mail.
                </p>
              )}
            </div>

            <div className="divisor">ou {isLogin ? 'entre' : 'cadastre-se'} com e-mail</div>

            <div className="space-y-2.5">
              <GrupoDeCampos>
                <Campo
                  dobravel
                  aberto={!isLogin}
                  id="name"
                  rotulo="Nome completo"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
                <Campo
                  id="email"
                  rotulo="E-mail"
                  type="email"
                  inputMode="email"
                  autoComplete={isLogin ? 'username' : 'email'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={primeRecaptcha}
                  aria-describedby={error ? 'erro-auth' : undefined}
                  required
                />
                <Campo
                  id="password"
                  rotulo="Senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  enterKeyHint="go"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={primeRecaptcha}
                  aria-describedby={error ? 'erro-auth' : undefined}
                  required
                  {...propsDoCapsLock}
                  acao={
                    <button
                      type="button"
                      className="campo-acao"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  }
                />
              </GrupoDeCampos>

              {(capsLigado || isLogin) && (
                <div className="flex min-h-[22px] items-center justify-between gap-3 px-1 text-[13px]">
                  <span className="font-medium text-[color:var(--atencao)]" aria-live="polite">
                    {capsLigado ? 'Caps Lock ligado' : ''}
                  </span>
                  {isLogin && (
                    <Link href="/auth/forgot-password" className="link-auth">
                      Esqueceu a senha?
                    </Link>
                  )}
                </div>
              )}

              {/* Register: só o essencial. Perfil (profissão, estado,
                  telefone, etc.) é completado depois, dentro do app. */}
              {!isLogin && (
                <p className="px-1 text-center text-[13px] text-[color:var(--texto-2)]">
                  Você entra agora e personaliza o resto depois, já dentro da plataforma.
                </p>
              )}
            </div>

            {/* Admin: seletor de tipo de conta (apenas emails autorizados) */}
            {!isLogin && canBeAdmin && (
              <div className="space-y-1.5">
                <label htmlFor="role" className="px-1 text-[13px] font-medium text-[color:var(--texto-2)]">
                  Tipo de conta
                </label>
                <select
                  id="role"
                  className="campos h-12 w-full appearance-none px-4 text-[15px] text-foreground outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            )}

            {error && <Aviso id="erro-auth">{error}</Aviso>}

            <BotaoAcao carregando={loading} textoCarregando={isLogin ? 'Entrando…' : 'Criando sua conta…'}>
              {isLogin ? 'Entrar' : 'Começar agora — é grátis'}
            </BotaoAcao>
          </form>
        )}
      </CartaoAuth>

      {/* ── Modal: Cadastro Bloqueado ── */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="max-w-md rounded-[28px] border border-border bg-card text-foreground">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl text-destructive">Cadastro Bloqueado</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                  <p className="text-sm text-muted-foreground">{blockedMessage}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowBlockedModal(false)}
              className="h-11 w-full rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-muted"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Usuário Banido ── */}
      <Dialog open={showBannedDialog} onOpenChange={setShowBannedDialog}>
        <DialogContent className="max-w-md rounded-[28px] border border-border bg-card text-foreground">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-destructive/20 bg-destructive/10">
              <Ban className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl text-destructive">Acesso Negado</DialogTitle>
            <DialogDescription asChild>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                  <p className="mb-2 text-sm font-medium text-foreground/90">Sua conta foi banida da plataforma.</p>
                  {banInfo.reason && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Motivo:</p>
                      <p className="text-sm text-muted-foreground">{BanReasonLabels[banInfo.reason]}</p>
                    </div>
                  )}
                  {banInfo.details && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Detalhes:</p>
                      <p className="text-sm text-muted-foreground">{banInfo.details}</p>
                    </div>
                  )}
                  {banInfo.bannedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Data: {new Date(banInfo.bannedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Se acredita que é um erro, entre em contato com o administrador.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowBannedDialog(false)}
              className="h-11 w-full rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-muted"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Google Profile Setup ── */}
      {googleData && (
        <GoogleProfileSetupDialog
          open={showProfileSetup}
          googleData={googleData}
          onComplete={handleProfileSetupComplete}
          onCancel={handleProfileSetupCancel}
          isLoading={googleLoading}
          serverError={setupError}
        />
      )}
    </AuthShell>
  )
}

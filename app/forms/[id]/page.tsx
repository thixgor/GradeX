'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Form, FormBlock } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    CheckCircle2,
    Send,
    AlertCircle,
    ArrowRight,
    Loader2,
    Video,
    ExternalLink,
    ChevronRight,
    AtSign,
    Phone,
    Lock,
    LogIn,
    Mail,
    KeyRound,
    Sparkles,
    PartyPopper,
    Copy,
    Check,
    Clock,
    ArrowUp,
    RotateCcw,
    Gift
} from 'lucide-react'
import { PageLoading } from '@/components/page-loading'
import { useScrollToTopWhen } from '@/components/scroll-to-top'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuthUser } from '@/hooks/use-auth-user'
import { ToastAlert } from '@/components/ui/toast-alert'
import { checkTextAnswer, isFreeTextQuestion } from '@/lib/answer-quality'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import {
    DEFAULT_PRIZE_CHOICE_TITLE,
    getFormPrizes,
    getMaterialChoiceMode,
    requiresPrizeChoice,
} from '@/lib/form-prizes'

/** Id sintético do card de escolha de prêmio (não é um bloco do formulário). */
const PRIZE_BLOCK_ID = '__prize-choice__'

type MaterialDelivery =
    | { delivered: true; title: string; email: string; serialKey: string; activationUrl: string }
    | { delivered: false; reason: string; title?: string }

const SHORT_TEXT_MAX = 200
const LONG_TEXT_MAX = 5000
/**
 * Espaço reservado no topo ao rolar até uma pergunta com erro. No mobile o
 * toast de aviso é bem mais alto (ele ocupa a largura da tela e quebra em
 * várias linhas), então precisa de folga extra pra não cobrir o enunciado.
 */
const stickyOffset = () => (window.innerWidth < 640 ? 190 : 96)

const draftKey = (formId: string) => `gradex:form-draft:${formId}`

export default function PublicFormPage() {
    const params = useParams()
    const id = params.id as string
    const [form, setForm] = useState<Form | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([])
    // Material escolhido quando o formulário entrega só um prêmio dentre vários.
    const [selectedPrizeId, setSelectedPrizeId] = useState<string>('')

    const { user, loading: authLoading } = useAuthUser()
    const [isMobile, setIsMobile] = useState(false)
    const reduceMotion = useReducedMotion()
    // Erros por pergunta: aparecem no próprio card em vez de só num toast solto.
    const [blockErrors, setBlockErrors] = useState<Record<string, string>>({})
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
    const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [draftRestored, setDraftRestored] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [submitInView, setSubmitInView] = useState(true)

    const submitRef = useRef<HTMLDivElement | null>(null)
    const draftLoaded = useRef(false)

    async function copySerialKey(key: string) {
        try {
            await navigator.clipboard.writeText(key)
            setCopiedKey(key)
            setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 1500)
        } catch {}
    }

    // Prêmios do formulário e regra de escolha (um só ou todos).
    const prizes = useMemo(() => getFormPrizes(form?.settings), [form])
    const mustChoosePrize = useMemo(() => requiresPrizeChoice(form?.settings), [form])
    const prizeChoiceTitle = form?.settings.materialChoiceTitle?.trim() || DEFAULT_PRIZE_CHOICE_TITLE

    // Login só é exigido quando o admin liga "Exigir Login" explicitamente. A
    // entrega de material NÃO exige login: se logado, vai para o e-mail da
    // conta; se não, usa a resposta da pergunta de e-mail do formulário.
    const needsLogin = !!form?.settings.requireLogin

    useEffect(() => {
        fetchForm()
    }, [id])

    // O scroll para o topo precisa rodar DEPOIS do React trocar o formulário
    // (longo) pela tela de sucesso (curta) — senão o navegador começa a animar
    // o "smooth scroll" ainda com a altura antiga e trava na altura nova, que
    // cai bem em cima do rodapé (WhatsApp/Discord) por causa da colisão de
    // layout. O hook sobe para o topo e segura a posição enquanto a tela de
    // sucesso termina de montar (as animações de entrega mudam a altura de
    // novo logo depois), soltando assim que a pessoa rolar.
    useScrollToTopWhen(submitted)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)')
        setIsMobile(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    // Só mostra a barra compacta depois que o cabeçalho do formulário sai de
    // vista — antes disso ela só roubaria espaço da dobra, ainda mais no mobile.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 140)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // A barra fixa de envio no mobile só aparece enquanto o botão real está
    // fora da tela, pra não duplicar o mesmo CTA duas vezes na mesma dobra.
    useEffect(() => {
        const el = submitRef.current
        if (!el || submitted) return
        const observer = new IntersectionObserver(
            ([entry]) => setSubmitInView(entry.isIntersecting),
            { rootMargin: '0px 0px -40px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [form, submitted])

    async function fetchForm() {
        try {
            const res = await fetch(`/api/forms/${id}`)
            const data = await res.json()
            if (res.ok) {
                setForm(data.form)
            } else {
                setError(data.error || 'Erro ao carregar formulário')
            }
        } catch (error) {
            setError('Erro de conexão com o servidor')
        } finally {
            setLoading(false)
        }
    }

    // === Rascunho local ==================================================
    // Formulário longo + celular = uma ligação, uma aba trocada ou um refresh
    // sem querer apagavam tudo. Guardamos as respostas localmente e
    // devolvemos quando a pessoa volta.
    useEffect(() => {
        if (!form || draftLoaded.current) return
        draftLoaded.current = true
        try {
            const stored = localStorage.getItem(draftKey(id))
            if (!stored) return
            const parsed = JSON.parse(stored)
            const valid = form.blocks.some(b => b.type === 'question' && parsed?.[b.id] != null)
            if (valid) {
                setAnswers(parsed)
                setDraftRestored(true)
            }
        } catch {}
    }, [form, id])

    useEffect(() => {
        if (!form || !draftLoaded.current || submitted) return
        const timer = setTimeout(() => {
            try {
                if (Object.keys(answers).length === 0) localStorage.removeItem(draftKey(id))
                else localStorage.setItem(draftKey(id), JSON.stringify(answers))
            } catch {}
        }, 500)
        return () => clearTimeout(timer)
    }, [answers, form, id, submitted])

    function discardDraft() {
        setAnswers({})
        setBlockErrors({})
        setDraftRestored(false)
        try { localStorage.removeItem(draftKey(id)) } catch {}
    }

    // Avisa antes de fechar a aba com respostas não enviadas.
    useEffect(() => {
        if (submitted || submitting) return
        const hasAnswers = Object.values(answers).some(v => !isAnswerEmpty(v))
        if (!hasAnswers) return
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [answers, submitted, submitting])

    // === Validação ========================================================

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    function isAnswerEmpty(value: any): boolean {
        return !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())
    }

    const isDeliveryEmailBlock = useCallback(
        (block: FormBlock) =>
            !!form?.settings.deliverMaterial && !user && form.settings.emailQuestionId === block.id,
        [form, user]
    )

    /**
     * Valida uma pergunta e devolve a mensagem de erro (ou null). Além do
     * obrigatório/e-mail, roda a checagem anti-texto-aleatório nos campos de
     * texto livre — o mesmo módulo que a API usa, então cliente e servidor
     * concordam sempre.
     */
    const validateBlock = useCallback((block: FormBlock): string | null => {
        if (block.type !== 'question') return null
        const answer = answers[block.id]

        if (block.required && isAnswerEmpty(answer)) {
            return `Preencha "${block.title}" para continuar.`
        }

        if (block.questionType === 'email' && !isAnswerEmpty(answer) && !EMAIL_RE.test(String(answer).trim())) {
            return 'Confira o e-mail: parece que falta algo (ex.: nome@email.com).'
        }

        if (isDeliveryEmailBlock(block) && (isAnswerEmpty(answer) || !EMAIL_RE.test(String(answer).trim()))) {
            return 'Informe um e-mail válido para receber o material.'
        }

        if (block.questionType === 'phone' && !isAnswerEmpty(answer) && !isValidBrazilPhone(String(answer))) {
            return 'Telefone incompleto. Use DDD + número, ex.: (81) 99999-9999.'
        }

        if (isFreeTextQuestion(block.questionType) && !isAnswerEmpty(answer)) {
            const quality = checkTextAnswer(answer)
            if (!quality.ok && quality.message) return quality.message
        }

        return null
    }, [answers, isDeliveryEmailBlock])

    const handleAnswer = (blockId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [blockId]: value }))
        // A pessoa está corrigindo — tira o erro na hora em vez de deixá-lo
        // piscando vermelho enquanto ela digita. Ele volta no blur/envio.
        setBlockErrors(prev => {
            if (!prev[blockId]) return prev
            const next = { ...prev }
            delete next[blockId]
            return next
        })
    }

    const handleBlur = (block: FormBlock) => {
        setFocusedBlockId(null)
        // Não cobra campo vazio no blur (a pessoa pode só ter passado por ele);
        // só sinaliza conteúdo problemático de fato.
        if (isAnswerEmpty(answers[block.id])) return
        const message = validateBlock(block)
        if (message) setBlockErrors(prev => ({ ...prev, [block.id]: message }))
    }

    /**
     * Rolar precisa acontecer DEPOIS do React inserir as mensagens de erro: elas
     * mudam a altura dos cards acima e o navegador reajusta o scroll sozinho
     * (scroll anchoring), o que jogava a pessoa de volta pro fim da página. Dois
     * requestAnimationFrame garantem que o layout já está estável. O blur tira o
     * foco do botão de envio, que o navegador também tenta manter visível.
     */
    function scrollToBlock(blockId: string) {
        (document.activeElement as HTMLElement | null)?.blur?.()
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = document.getElementById(`form-block-${blockId}`)
            if (!el) return
            const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset()
            window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' })
        }))
    }

    const questionBlocks = useMemo(
        () => (form?.blocks || []).filter(b => b.type === 'question'),
        [form]
    )

    const answeredCount = useMemo(
        () => questionBlocks.filter(b => !isAnswerEmpty(answers[b.id])).length,
        [questionBlocks, answers]
    )

    const progress = questionBlocks.length ? Math.round((answeredCount / questionBlocks.length) * 100) : 0

    const deadlineLabel = useMemo(() => {
        if (!form?.settings.deadline) return null
        const date = new Date(form.settings.deadline)
        if (Number.isNaN(date.getTime())) return null
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }, [form])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        // Valida tudo de uma vez: a pessoa vê todos os pontos que faltam em vez
        // de descobrir um por vez a cada tentativa de envio.
        const errors: Record<string, string> = {}
        let firstInvalid: string | null = null
        for (const block of form?.blocks || []) {
            const message = validateBlock(block)
            if (message) {
                errors[block.id] = message
                if (!firstInvalid) firstInvalid = block.id
            }
        }

        // A escolha do prêmio é obrigatória: sem ela o servidor não sabe qual
        // material entregar e recusaria o envio.
        if (mustChoosePrize && !selectedPrizeId) {
            errors[PRIZE_BLOCK_ID] = 'Escolha qual material você quer receber.'
            if (!firstInvalid) firstInvalid = PRIZE_BLOCK_ID
        }

        if (firstInvalid) {
            setBlockErrors(errors)
            setToast({ open: true, message: errors[firstInvalid] })
            scrollToBlock(firstInvalid)
            return
        }

        setBlockErrors({})
        setSubmitting(true)

        try {
            const res = await fetch(`/api/forms/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    ...(mustChoosePrize ? { selectedMaterialId: selectedPrizeId } : {}),
                })
            })

            const data = await res.json()
            if (res.ok) {
                try { localStorage.removeItem(draftKey(id)) } catch {}
                setDeliveries(
                    Array.isArray(data.materialDeliveries)
                        ? data.materialDeliveries
                        : data.materialDelivery
                            ? [data.materialDelivery]
                            : []
                )
                setSubmitted(true)
            } else if (data.code === 'MATERIAL_CHOICE_REQUIRED') {
                setBlockErrors(prev => ({ ...prev, [PRIZE_BLOCK_ID]: data.error }))
                setToast({ open: true, message: data.error })
                scrollToBlock(PRIZE_BLOCK_ID)
            } else if (res.status === 401 || data.code === 'LOGIN_REQUIRED') {
                window.location.href = `/auth/login?redirect=/forms/${id}`
            } else {
                // A API devolve qual pergunta reprovou quando o motivo é o
                // conteúdo da resposta — leva a pessoa direto até ela.
                if (data.blockId) {
                    setBlockErrors(prev => ({ ...prev, [data.blockId]: data.error }))
                    scrollToBlock(data.blockId)
                    setToast({ open: true, message: data.error })
                } else if (data.code === 'ALREADY_ANSWERED' || data.code === 'EMAIL_REQUIRED') {
                    // A trava é por e-mail: o aviso precisa ficar visível no topo,
                    // não perdido no fim de um formulário longo.
                    setError(data.error)
                    setToast({ open: true, message: data.error })
                    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
                } else {
                    setError(data.error || 'Erro ao enviar resposta')
                }
            }
        } catch (error) {
            setError('Erro ao enviar resposta. Verifique sua conexão.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <PageLoading variant="fullscreen" message="Carregando formulário..." />
        )
    }

    if (error && !form) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
                <div className="auth-glass-card max-w-md w-full rounded-2xl p-0">
                    <div className="text-center p-6 pb-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-destructive">Opa! Algo deu errado</h2>
                        <p className="text-sm text-muted-foreground mt-2">{error}</p>
                    </div>
                    <div className="flex justify-center p-6 pt-0">
                        <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
                    </div>
                </div>
            </div>
        )
    }

    // Portão de login: quando o formulário exige login (ou entrega material) e o
    // usuário ainda não está autenticado, bloqueia o acesso às perguntas.
    if (needsLogin && !authLoading && !user && !submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="pointer-events-none fixed inset-0 overflow-hidden hidden sm:block">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                </div>
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="auth-glass-card max-w-md w-full rounded-2xl p-0 relative z-10 text-center"
                >
                    <div className="p-6 sm:p-8 space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Faça login para continuar</h2>
                        <p className="text-muted-foreground">
                            {form?.title
                                ? <>Para responder <span className="font-semibold text-foreground">“{form.title}”</span> você precisa estar logado na sua conta.</>
                                : 'Você precisa estar logado para responder este formulário.'}
                            {form?.settings.deliverMaterial && ' Assim conseguimos enviar o material para o e-mail da sua conta.'}
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                className="btn-brand-glow text-white rounded-xl h-12 text-base font-bold"
                                onClick={() => window.location.href = `/auth/login?redirect=/forms/${id}`}
                            >
                                <LogIn className="mr-2 h-5 w-5" /> Entrar na minha conta
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl h-11"
                                onClick={() => window.location.href = `/auth/login?mode=register&redirect=/forms/${id}`}
                            >
                                Criar uma conta
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (submitted) {
        const delivered = deliveries.filter(
            (d): d is Extract<MaterialDelivery, { delivered: true }> => d.delivered === true
        )
        const failed = deliveries.filter(d => d.delivered === false)
        const materialDelivered = delivered.length > 0
        // Passos confirmados em sequência (efeito de "check em cascata").
        const steps: Array<{ icon: any; title: string; desc: string; tone: 'ok' | 'warn' }> = [
            {
                icon: CheckCircle2,
                title: 'Respostas recebidas',
                desc: 'Registramos o seu formulário com sucesso.',
                tone: 'ok',
            },
        ]
        if (form?.settings.sendConfirmationEmail) {
            steps.push({
                icon: Mail,
                title: 'Resumo enviado por e-mail',
                desc: 'Você receberá um PDF com um resumo das suas respostas.',
                tone: 'ok',
            })
        }
        for (const item of delivered) {
            steps.push({
                icon: KeyRound,
                title: delivered.length > 1 ? `Material: ${item.title}` : 'Material a caminho!',
                desc: `Enviamos “${item.title}” com a sua serial key e o link de ativação para ${item.email}.`,
                tone: 'ok',
            })
        }
        for (const item of failed) {
            steps.push({
                icon: AlertCircle,
                title: item.title
                    ? `Não foi possível enviar “${item.title}”`
                    : 'Não foi possível enviar o material',
                desc: 'Suas respostas foram salvas. Se o material não chegar, fale com o suporte.',
                tone: 'warn',
            })
        }

        const stepDelay = (i: number) => (reduceMotion ? 0 : 0.7 + i * 0.35)

        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Ambient blobs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden hidden sm:block">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                </div>

                {/* Confetes sutis quando há entrega de material (reduzido no mobile p/ evitar jank) */}
                {materialDelivered && !reduceMotion && (
                    <div className="pointer-events-none fixed inset-0 overflow-hidden">
                        {Array.from({ length: isMobile ? 8 : 18 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-0 w-2 h-2 rounded-sm"
                                style={{
                                    left: `${(i * 5.5 + 6) % 100}%`,
                                    background: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? '#22c55e' : '#f59e0b',
                                }}
                                initial={{ y: -40, opacity: 0, rotate: 0 }}
                                animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
                                transition={{ duration: 2.6 + (i % 5) * 0.35, delay: 0.4 + (i % 6) * 0.12, ease: 'easeIn' }}
                            />
                        ))}
                    </div>
                )}

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="auth-glass-card max-w-lg w-full rounded-2xl p-0 relative z-10 overflow-hidden"
                >
                    <div className="text-center p-6 sm:p-8 pb-6 border-b border-white/10">
                        <motion.div
                            className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 relative"
                            initial={reduceMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                        >
                            {!reduceMotion && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                                    initial={{ scale: 1, opacity: 0.8 }}
                                    animate={{ scale: 1.6, opacity: 0 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                                />
                            )}
                            <motion.div
                                initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.35 }}
                            >
                                {materialDelivered
                                    ? <PartyPopper className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                                    : <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />}
                            </motion.div>
                        </motion.div>
                        <motion.h2
                            className="text-2xl sm:text-3xl font-black text-primary flex items-center justify-center gap-2"
                            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: reduceMotion ? 0 : 0.45 }}
                        >
                            {materialDelivered ? <>Tudo certo! <Sparkles className="h-6 w-6" /></> : 'Sucesso!'}
                        </motion.h2>
                        <motion.p
                            className="text-base sm:text-lg mt-2 text-muted-foreground"
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: reduceMotion ? 0 : 0.55 }}
                        >
                            {materialDelivered
                                ? 'Recebemos suas respostas e o seu material já está a caminho.'
                                : 'Obrigado por sua participação. Suas respostas foram enviadas com sucesso.'}
                        </motion.p>
                    </div>

                    {/* Checklist em cascata */}
                    <div className="p-4 sm:p-6 space-y-3">
                        <AnimatePresence>
                            {steps.map((step, i) => {
                                const Icon = step.icon
                                return (
                                    <motion.div
                                        key={step.title}
                                        initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: stepDelay(i), duration: 0.4 }}
                                        className={`flex items-start gap-3 p-4 rounded-xl border ${
                                            step.tone === 'warn'
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-background/40 border-white/10'
                                        }`}
                                    >
                                        <motion.div
                                            initial={reduceMotion ? false : { scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: stepDelay(i) + 0.1 }}
                                            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                                                step.tone === 'warn' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/15 text-primary'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </motion.div>
                                        <div className="text-left min-w-0">
                                            <p className="font-bold text-foreground leading-snug">{step.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5 break-words">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        className="pb-8 px-5 sm:px-8 text-center space-y-3"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: reduceMotion ? 0 : 0.9 + steps.length * 0.35 }}
                    >
                        {delivered.map(item => (
                            <div key={item.serialKey || item.title} className="space-y-2">
                                {delivered.length > 1 && (
                                    <p className="text-left text-sm font-bold text-foreground truncate">{item.title}</p>
                                )}
                                {item.serialKey && (
                                    <button
                                        type="button"
                                        onClick={() => copySerialKey(item.serialKey)}
                                        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-left transition-colors hover:border-primary/40"
                                    >
                                        <span className="min-w-0">
                                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {copiedKey === item.serialKey ? 'Copiada!' : 'Sua serial key (toque para copiar)'}
                                            </span>
                                            <span className="block font-mono text-sm font-bold text-foreground truncate">{item.serialKey}</span>
                                        </span>
                                        {copiedKey === item.serialKey
                                            ? <Check className="h-4 w-4 shrink-0 text-primary" />
                                            : <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                    </button>
                                )}
                                <Button
                                    className="btn-brand-glow text-white rounded-xl w-full h-12 text-base font-bold group"
                                    onClick={() => window.location.href = item.activationUrl || '/ativar'}
                                >
                                    {delivered.length > 1 ? 'Ativar este material' : 'Ativar meu material'}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                            {materialDelivered
                                ? 'Confira também a sua caixa de entrada (e o spam) para o e-mail de ativação.'
                                : 'Sua privacidade é importante. Seus dados estão protegidos.'}
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    let questionNumber = 0

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-8 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <ToastAlert
                open={toast.open}
                onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
                type="error"
                title="Falta ajustar"
                message={toast.message}
            />

            {/* Barra de progresso fixa: mostra o quanto falta sem ocupar espaço
                útil da tela — vira o único ponto de referência no mobile, onde
                não dá pra ver o formulário inteiro de uma vez. */}
            <div className="fixed top-0 inset-x-0 z-40 pointer-events-none">
                <div className="h-1 w-full bg-primary/10">
                    <div
                        className="h-full bg-primary transition-[width] duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <AnimatePresence>
                    {scrolled && (
                        <motion.div
                            initial={reduceMotion ? false : { y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={reduceMotion ? undefined : { y: -40, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-auto border-b border-border/50 bg-background/85 backdrop-blur-md"
                        >
                            <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-2.5">
                                <p className="flex-1 min-w-0 truncate text-sm font-semibold text-foreground">
                                    {form?.title}
                                </p>
                                <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                                    {answeredCount}/{questionBlocks.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
                                    aria-label="Voltar ao topo"
                                    className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Ambient blobs (decorativos apenas — ocultos no mobile pra não pesar o scroll) */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden hidden sm:block">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-primary/6 rounded-full blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-4 mb-8 sm:mb-12"
                >
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="outline" className="px-4 py-1 border-white/20 dark:border-white/10 text-primary bg-background/50 backdrop-blur-sm">
                            {form?.settings.isActive ? "Pesquisa Disponível" : "Inativo"}
                        </Badge>
                        {deadlineLabel && (
                            <Badge variant="outline" className="px-3 py-1 border-white/20 dark:border-white/10 text-muted-foreground bg-background/50 backdrop-blur-sm gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Até {deadlineLabel}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight text-balance">
                        {form?.title}
                    </h1>
                    {form?.description && (
                        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                            {form.description}
                        </p>
                    )}
                    {questionBlocks.length > 0 && (
                        <p className="text-sm font-medium text-muted-foreground">
                            {questionBlocks.length} {questionBlocks.length === 1 ? 'pergunta' : 'perguntas'}
                            {answeredCount > 0 && <> · <span className="text-primary">{answeredCount} respondida{answeredCount === 1 ? '' : 's'}</span></>}
                        </p>
                    )}
                </motion.div>

                {draftRestored && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
                        <RotateCcw className="h-5 w-5 shrink-0 text-primary" />
                        <p className="flex-1 text-sm text-foreground">
                            Recuperamos as respostas que você já tinha começado neste aparelho.
                        </p>
                        <div className="flex gap-2 shrink-0">
                            <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={discardDraft}>
                                Começar do zero
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setDraftRestored(false)}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3"
                        role="alert"
                    >
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
                    {form?.blocks.map((block, index) => {
                        const isQuestion = block.type === 'question'
                        if (isQuestion) questionNumber++
                        const currentNumber = questionNumber
                        const blockError = blockErrors[block.id]
                        const isAnswered = isQuestion && !isAnswerEmpty(answers[block.id])
                        const errorId = `form-error-${block.id}`
                        const isFocused = focusedBlockId === block.id
                        const value = answers[block.id]
                        const charCount = typeof value === 'string' ? value.length : 0

                        return (
                            <motion.div
                                key={block.id}
                                id={`form-block-${block.id}`}
                                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.4, delay: Math.min(index, 4) * 0.08 }}
                                className="scroll-mt-24"
                            >
                                {/* BLoco de Conteúdo */}
                                {block.type === 'text' && (
                                    <div className="form-glass-card rounded-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70 dark:from-primary/80 dark:to-primary/60" />
                                        <div className="relative z-10 p-5 sm:p-6">
                                            <h3 className="text-xl sm:text-2xl font-semibold text-white">{block.title}</h3>
                                            {block.description && <p className="text-white/80 text-sm mt-1">{block.description}</p>}
                                            <p className="whitespace-pre-wrap text-base sm:text-lg text-white/90 mt-4">{block.content}</p>
                                        </div>
                                    </div>
                                )}

                                {block.type === 'image' && (
                                    <div className="form-glass-card rounded-2xl overflow-hidden group">
                                        <img
                                            src={block.content}
                                            alt={block.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-auto max-h-[500px] object-cover sm:group-hover:scale-105 transition-transform duration-700"
                                        />
                                        {(block.title || block.description) && (
                                            <div className="p-5 sm:p-6 bg-background/50 backdrop-blur-sm">
                                                <h3 className="text-lg sm:text-xl font-semibold text-foreground">{block.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === 'video' && (
                                    <div className="form-glass-card rounded-2xl overflow-hidden">
                                        <div className="aspect-video">
                                            <iframe
                                                src={block.content}
                                                title={block.title || 'Vídeo'}
                                                className="w-full h-full"
                                                loading="lazy"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        {(block.title || block.description) && (
                                            <div className="p-5 sm:p-6">
                                                <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-foreground">
                                                    <Video className="h-5 w-5 text-primary shrink-0" /> {block.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === 'link' && (
                                    <div className="form-glass-card rounded-2xl flex flex-col sm:flex-row items-center justify-between p-5 sm:p-6 gap-4 border-l-4 border-l-primary">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h3 className="font-bold text-lg text-foreground">{block.title}</h3>
                                            {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
                                        </div>
                                        <Button asChild className="rounded-full px-8 w-full sm:w-auto h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                                            <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">
                                                {block.buttonText || 'Acessar'} <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {/* Bloco de Pergunta */}
                                {isQuestion && (
                                    <div
                                        className={`form-glass-card soul-light rounded-2xl sm:hover-lift transition-all duration-300 ${
                                            blockError
                                                ? 'ring-2 ring-destructive/70'
                                                : isFocused
                                                    ? 'ring-2 ring-primary/40'
                                                    : isAnswered
                                                        ? 'ring-1 ring-primary/25'
                                                        : ''
                                        }`}
                                    >
                                        <div className="p-5 sm:p-6 pb-3 sm:pb-4">
                                            <div className="flex items-start gap-3">
                                                {/* Numeração: dá noção de "onde estou" numa lista longa. */}
                                                <span
                                                    className={`shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black tabular-nums transition-colors ${
                                                        blockError
                                                            ? 'bg-destructive text-white'
                                                            : isAnswered
                                                                ? 'bg-primary text-white'
                                                                : 'bg-primary/10 text-primary'
                                                    }`}
                                                    aria-hidden="true"
                                                >
                                                    {blockError
                                                        ? <AlertCircle className="h-4 w-4" />
                                                        : isAnswered
                                                            ? <Check className="h-4 w-4" />
                                                            : currentNumber}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug break-words">
                                                        {block.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            block.required
                                                                ? 'bg-destructive/10 text-destructive'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {block.required ? 'Obrigatória' : 'Opcional'}
                                                        </span>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 tabular-nums">
                                                            {currentNumber} de {questionBlocks.length}
                                                        </span>
                                                    </div>
                                                    {block.description && (
                                                        <p className="text-muted-foreground italic mt-2 text-sm font-medium">
                                                            {block.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                                            {block.questionType === 'short-text' && (
                                                <div className="space-y-1.5">
                                                    <Input
                                                        placeholder="Sua resposta aqui..."
                                                        className="auth-glass-input rounded-xl h-12 text-base sm:text-lg transition-all"
                                                        value={value || ''}
                                                        onChange={e => handleAnswer(block.id, e.target.value)}
                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                        onBlur={() => handleBlur(block)}
                                                        maxLength={SHORT_TEXT_MAX}
                                                        enterKeyHint="next"
                                                        required={block.required}
                                                        aria-invalid={!!blockError}
                                                        aria-describedby={blockError ? errorId : undefined}
                                                    />
                                                    {charCount > SHORT_TEXT_MAX - 40 && (
                                                        <p className="text-[10px] text-right text-muted-foreground uppercase tracking-widest font-bold tabular-nums">
                                                            {charCount} / {SHORT_TEXT_MAX}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {block.questionType === 'long-text' && (
                                                <div className="space-y-1.5">
                                                    <Textarea
                                                        placeholder="Fale um pouco mais detalhadamente..."
                                                        className="auth-glass-input rounded-xl min-h-[120px] text-base sm:text-lg transition-all"
                                                        value={value || ''}
                                                        onChange={e => handleAnswer(block.id, e.target.value)}
                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                        onBlur={() => handleBlur(block)}
                                                        maxLength={LONG_TEXT_MAX}
                                                        required={block.required}
                                                        aria-invalid={!!blockError}
                                                        aria-describedby={blockError ? errorId : undefined}
                                                    />
                                                    {charCount > 0 && (
                                                        <p className="text-[10px] text-right text-muted-foreground uppercase tracking-widest font-bold tabular-nums">
                                                            {charCount} / {LONG_TEXT_MAX}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {block.questionType === 'email' && (
                                                <div className="space-y-1.5">
                                                    <div className="relative">
                                                        <Input
                                                            type="email"
                                                            inputMode="email"
                                                            autoComplete="email"
                                                            autoCapitalize="none"
                                                            autoCorrect="off"
                                                            spellCheck={false}
                                                            placeholder="exemplo@email.com"
                                                            className="auth-glass-input rounded-xl h-12 text-base sm:text-lg pl-10 transition-all"
                                                            value={value || ''}
                                                            onChange={e => handleAnswer(block.id, e.target.value)}
                                                            onFocus={() => setFocusedBlockId(block.id)}
                                                            onBlur={() => handleBlur(block)}
                                                            required={block.required || isDeliveryEmailBlock(block)}
                                                            aria-invalid={!!blockError}
                                                            aria-describedby={blockError ? errorId : undefined}
                                                        />
                                                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    {isDeliveryEmailBlock(block) && (
                                                        <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                                                            <KeyRound className="h-3.5 w-3.5 shrink-0" /> É para este e-mail que enviaremos o material.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {block.questionType === 'phone' && (
                                                <div className="relative">
                                                    <Input
                                                        type="tel"
                                                        inputMode="tel"
                                                        autoComplete="tel"
                                                        placeholder="(00) 00000-0000"
                                                        className="auth-glass-input rounded-xl h-12 text-base sm:text-lg pl-10 transition-all"
                                                        value={value || ''}
                                                        // Máscara enquanto digita: no celular o teclado numérico não
                                                        // tem parênteses/hífen e todo mundo mandava formato diferente.
                                                        onChange={e => handleAnswer(block.id, formatBrazilPhone(e.target.value))}
                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                        onBlur={() => handleBlur(block)}
                                                        required={block.required}
                                                        aria-invalid={!!blockError}
                                                        aria-describedby={blockError ? errorId : undefined}
                                                    />
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}

                                            {block.questionType === 'multiple-choice' && (
                                                <RadioGroup
                                                    value={value || ''}
                                                    onValueChange={val => handleAnswer(block.id, val)}
                                                    className="space-y-2.5"
                                                >
                                                    {block.options?.map((option, i) => {
                                                        const selected = value === option
                                                        return (
                                                            // A LINHA INTEIRA é um <label> (não uma <div> com onClick):
                                                            // é o único jeito de ter exatamente UM clique por toque. Uma
                                                            // <div onClick> ao lado de um <label htmlFor> pro mesmo campo
                                                            // dispara duas atualizações por clique (uma pelo próprio clique
                                                            // borbulhando, outra pelo clique que o navegador encaminha do
                                                            // label pro campo) — e como cada uma parte de um snapshot
                                                            // diferente do estado, a segunda desfazia a primeira, travando
                                                            // a seleção depois da primeira escolha.
                                                            <label
                                                                key={i}
                                                                className={`flex items-center gap-3 rounded-xl border p-4 min-h-[56px] transition-all cursor-pointer group touch-manipulation active:scale-[0.99] ${
                                                                    selected
                                                                        ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                                        : 'bg-background/60 border-white/20 dark:border-white/5 sm:hover:border-primary/30 active:border-primary/30'
                                                                }`}
                                                            >
                                                                <RadioGroupItem value={option} id={`${block.id}-${i}`} className="border-primary text-primary shrink-0" />
                                                                <span className="flex-1 text-base sm:text-lg font-medium sm:group-hover:text-primary transition-colors text-foreground break-words">{option}</span>
                                                                <ChevronRight className={`h-4 w-4 shrink-0 text-primary transition-opacity ${selected ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`} />
                                                            </label>
                                                        )
                                                    })}
                                                </RadioGroup>
                                            )}

                                            {block.questionType === 'checklist' && (
                                                <div className="space-y-2.5">
                                                    {block.options?.map((option, i) => {
                                                        const current = value || []
                                                        const isChecked = current.includes(option)
                                                        return (
                                                            // Mesmo motivo do multiple-choice acima: a linha inteira
                                                            // precisa ser um único <label> (não uma <div onClick> ao lado
                                                            // de um <label htmlFor>), senão um único toque dispara duas
                                                            // atualizações conflitantes e a marcação nunca "pega".
                                                            <label
                                                                key={i}
                                                                className={`flex items-center gap-3 p-4 min-h-[56px] rounded-xl border transition-all cursor-pointer group active:scale-[0.99] touch-manipulation ${isChecked ? 'bg-primary/10 border-primary/40 shadow-sm' : 'bg-background/60 border-white/20 dark:border-white/5 sm:hover:border-primary/30 active:border-primary/30'}`}
                                                            >
                                                                <Checkbox
                                                                    id={`${block.id}-${i}`}
                                                                    checked={isChecked}
                                                                    className="shrink-0"
                                                                    onCheckedChange={(checked) => {
                                                                        const newVal = checked
                                                                            ? [...current, option]
                                                                            : current.filter((v: string) => v !== option)
                                                                        handleAnswer(block.id, newVal)
                                                                    }}
                                                                />
                                                                <span className="flex-1 text-base sm:text-lg font-medium sm:group-hover:text-primary transition-colors text-foreground break-words">{option}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {/* Erro da pergunta (inclui o aviso de resposta aleatória) */}
                                            <AnimatePresence>
                                                {blockError && (
                                                    <motion.p
                                                        id={errorId}
                                                        role="alert"
                                                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                                                        className="flex items-start gap-2 text-sm font-medium text-destructive mt-3"
                                                    >
                                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                        <span>{blockError}</span>
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}

                    {/* Escolha do prêmio: o formulário oferece vários materiais,
                        mas a pessoa só leva um — precisa dizer qual antes de enviar. */}
                    {mustChoosePrize && (
                        <motion.div
                            id={`form-block-${PRIZE_BLOCK_ID}`}
                            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                            transition={{ duration: 0.4 }}
                            className="scroll-mt-24"
                        >
                            <div
                                className={`form-glass-card soul-light rounded-2xl transition-all duration-300 ${
                                    blockErrors[PRIZE_BLOCK_ID]
                                        ? 'ring-2 ring-destructive/70'
                                        : selectedPrizeId
                                            ? 'ring-1 ring-primary/25'
                                            : 'ring-1 ring-primary/40'
                                }`}
                            >
                                <div className="p-5 sm:p-6 pb-3 sm:pb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary" aria-hidden="true">
                                            <Gift className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug break-words">
                                                {prizeChoiceTitle}
                                            </h3>
                                            <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                                Obrigatória
                                            </span>
                                            <p className="text-muted-foreground italic mt-2 text-sm font-medium">
                                                Você pode escolher apenas um material. Ele será enviado para o seu e-mail.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                                    <RadioGroup
                                        value={selectedPrizeId}
                                        onValueChange={val => {
                                            setSelectedPrizeId(val)
                                            setBlockErrors(prev => {
                                                if (!prev[PRIZE_BLOCK_ID]) return prev
                                                const next = { ...prev }
                                                delete next[PRIZE_BLOCK_ID]
                                                return next
                                            })
                                        }}
                                        className="space-y-2.5"
                                    >
                                        {prizes.map(prize => {
                                            const selected = selectedPrizeId === prize.id
                                            return (
                                                // Linha inteira como <label> pelo mesmo motivo das
                                                // demais perguntas de escolha (um clique por toque).
                                                <label
                                                    key={prize.id}
                                                    className={`flex items-center gap-3 rounded-xl border p-4 min-h-[56px] transition-all cursor-pointer group touch-manipulation active:scale-[0.99] ${
                                                        selected
                                                            ? 'bg-primary/10 border-primary/40 shadow-sm'
                                                            : 'bg-background/60 border-white/20 dark:border-white/5 sm:hover:border-primary/30 active:border-primary/30'
                                                    }`}
                                                >
                                                    <RadioGroupItem value={prize.id} id={`prize-${prize.id}`} className="border-primary text-primary shrink-0" />
                                                    <span className="flex-1 text-base sm:text-lg font-medium sm:group-hover:text-primary transition-colors text-foreground break-words">
                                                        {prize.title || 'Material'}
                                                    </span>
                                                    <ChevronRight className={`h-4 w-4 shrink-0 text-primary transition-opacity ${selected ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`} />
                                                </label>
                                            )
                                        })}
                                    </RadioGroup>

                                    <AnimatePresence>
                                        {blockErrors[PRIZE_BLOCK_ID] && (
                                            <motion.p
                                                role="alert"
                                                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                                                className="flex items-start gap-2 text-sm font-medium text-destructive mt-3"
                                            >
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <span>{blockErrors[PRIZE_BLOCK_ID]}</span>
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Vários prêmios sem escolha: só avisa o que vem por e-mail. */}
                    {form?.settings.deliverMaterial && !mustChoosePrize && prizes.length > 1 && getMaterialChoiceMode(form.settings) === 'all' && (
                        <div className="form-glass-card rounded-2xl p-5 sm:p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <Gift className="h-5 w-5 text-primary shrink-0" /> Você vai receber {prizes.length} materiais
                            </h3>
                            <ul className="mt-3 space-y-1.5">
                                {prizes.map(prize => (
                                    <li key={prize.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                        <span className="break-words">{prize.title || 'Material'}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <motion.div
                        ref={submitRef}
                        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                        transition={{ duration: 0.4 }}
                        className="pt-4 sm:pt-8"
                    >
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="btn-brand-glow text-white soul-light soul-light-brand rounded-2xl w-full h-14 sm:h-16 text-lg sm:text-xl font-black group overflow-hidden relative"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Enviando Respostas...
                                </>
                            ) : (
                                <>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Finalizar e Enviar <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
                                </>
                            )}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground mt-4 font-medium opacity-70">
                            Sua privacidade é importante. Seus dados estão protegidos.
                        </p>
                    </motion.div>

                    {/* Envio sempre à mão no mobile: em formulário longo o botão
                        do fim fica a dezenas de rolagens de distância. */}
                    <AnimatePresence>
                        {!submitInView && (
                            <motion.div
                                initial={reduceMotion ? false : { y: 80 }}
                                animate={{ y: 0 }}
                                exit={reduceMotion ? undefined : { y: 80 }}
                                transition={{ duration: 0.2 }}
                                // Sobe acima do banner "instalar na tela de início" (iOS), que
                                // publica a própria altura nessa variável justamente pra isso.
                                style={{ bottom: 'var(--gx-install-prompt-h, 0px)' }}
                                className="sm:hidden fixed inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
                            >
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-brand-glow text-white rounded-xl w-full h-12 text-base font-bold"
                                >
                                    {submitting ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
                                    ) : (
                                        <>Finalizar e Enviar <Send className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                                <p className="text-center text-[11px] text-muted-foreground mt-1.5 tabular-nums">
                                    {answeredCount} de {questionBlocks.length} respondidas
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                {/* Espaço reservado (sempre, não condicional) para a barra fixa de
                    envio não cobrir o rodapé do formulário. Se aparecesse só junto
                    com a barra, o documento mudaria de altura no fim da página e o
                    observador ficaria alternando entre mostrar e esconder. */}
                <div className="sm:hidden h-24" aria-hidden="true" />
            </div>
        </div>
    )
}

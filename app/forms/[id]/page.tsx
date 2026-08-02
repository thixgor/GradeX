'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormBlock } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    PartyPopper
} from 'lucide-react'
import { PageLoading } from '@/components/page-loading'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthUser } from '@/hooks/use-auth-user'
import { ToastAlert } from '@/components/ui/toast-alert'

export default function PublicFormPage() {
    const params = useParams()
    const id = params.id as string
    const [form, setForm] = useState<Form | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [deliveryResult, setDeliveryResult] = useState<
        | { delivered: true; title: string; email: string }
        | { delivered: false; reason: string }
        | null
    >(null)

    const { user, loading: authLoading } = useAuthUser()
    const [isMobile, setIsMobile] = useState(false)
    const [missingBlockId, setMissingBlockId] = useState<string | null>(null)
    const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

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
    // layout. Rodar no useEffect garante que o DOM já encolheu antes de rolar.
    useEffect(() => {
        if (submitted) {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }
    }, [submitted])

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)')
        setIsMobile(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

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

    const handleAnswer = (blockId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [blockId]: value }))
        // A pessoa acabou de responder — some com o destaque de "faltando".
        if (blockId === missingBlockId) setMissingBlockId(null)
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    function isAnswerEmpty(value: any): boolean {
        return !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())
    }

    // Acha a primeira pergunta com problema (obrigatória vazia, ou o e-mail de
    // entrega do material quando não logado) para levar a pessoa até ela em
    // vez de só recusar o envio sem dizer onde está o problema.
    function findFirstInvalidBlock(): { blockId: string; message: string } | null {
        if (!form) return null
        for (const block of form.blocks) {
            if (block.type !== 'question') continue
            const answer = answers[block.id]

            if (block.required && isAnswerEmpty(answer)) {
                return { blockId: block.id, message: `Preencha "${block.title}" para continuar.` }
            }

            if (
                form.settings.deliverMaterial &&
                !user &&
                form.settings.emailQuestionId === block.id &&
                (isAnswerEmpty(answer) || !EMAIL_RE.test(String(answer).trim()))
            ) {
                return { blockId: block.id, message: 'Informe um e-mail válido para receber o material.' }
            }
        }
        return null
    }

    function scrollToBlock(blockId: string) {
        const el = document.getElementById(`form-block-${blockId}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const invalid = findFirstInvalidBlock()
        if (invalid) {
            setMissingBlockId(invalid.blockId)
            setToast({ open: true, message: invalid.message })
            scrollToBlock(invalid.blockId)
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch(`/api/forms/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            })

            const data = await res.json()
            if (res.ok) {
                setDeliveryResult(data.materialDelivery ?? null)
                setSubmitted(true)
            } else if (res.status === 401 || data.code === 'LOGIN_REQUIRED') {
                window.location.href = `/auth/login?redirect=/forms/${id}`
            } else {
                setError(data.error || 'Erro ao enviar resposta')
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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="auth-glass-card max-w-md w-full rounded-2xl p-0 relative z-10 text-center"
                >
                    <div className="p-8 space-y-4">
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
        const materialDelivered = deliveryResult?.delivered === true
        const deliveryFailed = deliveryResult?.delivered === false
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
        if (materialDelivered && deliveryResult?.delivered) {
            steps.push({
                icon: KeyRound,
                title: 'Material a caminho!',
                desc: `Enviamos “${deliveryResult.title}” com a sua serial key e o link de ativação para ${deliveryResult.email}.`,
                tone: 'ok',
            })
        } else if (deliveryFailed) {
            steps.push({
                icon: AlertCircle,
                title: 'Não foi possível enviar o material',
                desc: 'Suas respostas foram salvas. Se o material não chegar, fale com o suporte.',
                tone: 'warn',
            })
        }

        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Ambient blobs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden hidden sm:block">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                </div>

                {/* Confetes sutis quando há entrega de material (reduzido no mobile p/ evitar jank) */}
                {materialDelivered && (
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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="auth-glass-card max-w-lg w-full rounded-2xl p-0 relative z-10 overflow-hidden"
                >
                    <div className="text-center p-8 pb-6 border-b border-white/10">
                        <motion.div
                            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-primary/30"
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                            />
                            <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.35 }}
                            >
                                {materialDelivered
                                    ? <PartyPopper className="h-12 w-12 text-primary" />
                                    : <CheckCircle2 className="h-12 w-12 text-primary" />}
                            </motion.div>
                        </motion.div>
                        <motion.h2
                            className="text-3xl font-black text-primary flex items-center justify-center gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            {materialDelivered ? <>Tudo certo! <Sparkles className="h-6 w-6" /></> : 'Sucesso!'}
                        </motion.h2>
                        <motion.p
                            className="text-lg mt-2 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.55 }}
                        >
                            {materialDelivered
                                ? 'Recebemos suas respostas e o seu material já está a caminho.'
                                : 'Obrigado por sua participação. Suas respostas foram enviadas com sucesso.'}
                        </motion.p>
                    </div>

                    {/* Checklist em cascata */}
                    <div className="p-6 space-y-3">
                        <AnimatePresence>
                            {steps.map((step, i) => {
                                const Icon = step.icon
                                return (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + i * 0.35, duration: 0.4 }}
                                        className={`flex items-start gap-3 p-4 rounded-xl border ${
                                            step.tone === 'warn'
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-background/40 border-white/10'
                                        }`}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.8 + i * 0.35 }}
                                            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                                                step.tone === 'warn' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/15 text-primary'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </motion.div>
                                        <div className="text-left">
                                            <p className="font-bold text-foreground leading-snug">{step.title}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        className="pb-8 px-8 text-center space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 + steps.length * 0.35 }}
                    >
                        {materialDelivered && deliveryResult?.delivered && (
                            <Button
                                className="btn-brand-glow text-white rounded-xl w-full h-12 text-base font-bold group"
                                onClick={() => window.location.href = '/materiais?tab=mine'}
                            >
                                Ativar meu material <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )}
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <ToastAlert
                open={toast.open}
                onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
                type="error"
                title="Falta preencher"
                message={toast.message}
            />
            {/* Ambient blobs (decorativos apenas — ocultos no mobile pra não pesar o scroll) */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden hidden sm:block">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-primary/6 rounded-full blur-3xl" />
            </div>

            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-4 mb-12"
                >
                    <Badge variant="outline" className="px-4 py-1 border-white/20 dark:border-white/10 text-primary bg-background/50 backdrop-blur-sm">
                        {form?.settings.isActive ? "Pesquisa Disponível" : "Inativo"}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                        {form?.title}
                    </h1>
                    {form?.description && (
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto balance leading-relaxed">
                            {form.description}
                        </p>
                    )}
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-3"
                    >
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {form?.blocks.map((block, index) => {
                        const isQuestion = block.type === 'question'

                        return (
                            <motion.div
                                key={block.id}
                                id={`form-block-${block.id}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                                transition={{ duration: 0.4, delay: Math.min(index, 4) * 0.08 }}
                            >
                                {/* BLoco de Conteúdo */}
                                {block.type === 'text' && (
                                    <div className="form-glass-card rounded-2xl overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70 dark:from-primary/80 dark:to-primary/60" />
                                        <div className="relative z-10 p-6">
                                            <h3 className="text-2xl font-semibold text-white">{block.title}</h3>
                                            {block.description && <p className="text-white/80 text-sm mt-1">{block.description}</p>}
                                            <p className="whitespace-pre-wrap text-lg text-white/90 mt-4">{block.content}</p>
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
                                            className="w-full h-auto max-h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        {(block.title || block.description) && (
                                            <div className="p-6 bg-background/50 backdrop-blur-sm">
                                                <h3 className="text-xl font-semibold text-foreground">{block.title}</h3>
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
                                                className="w-full h-full"
                                                loading="lazy"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        {(block.title || block.description) && (
                                            <div className="p-6">
                                                <h3 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                                                    <Video className="h-5 w-5 text-primary" /> {block.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === 'link' && (
                                    <div className="form-glass-card rounded-2xl flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-l-4 border-l-primary">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h3 className="font-bold text-lg text-foreground">{block.title}</h3>
                                            {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
                                        </div>
                                        <Button asChild className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                                            <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">
                                                {block.buttonText || 'Acessar'} <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {/* Bloco de Pergunta */}
                                {isQuestion && (
                                    <div className={`form-glass-card soul-light rounded-2xl hover-lift transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30 ${missingBlockId === block.id ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''}`}>
                                        <div className="p-6 pb-4">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-xl font-bold text-foreground leading-snug">
                                                    {block.title}
                                                    {block.required && <span className="text-red-500 ml-1" title="Obrigatório">*</span>}
                                                </h3>
                                            </div>
                                            {block.description && (
                                                <p className="text-muted-foreground italic mt-1 text-sm font-medium">
                                                    {block.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="px-6 pb-6 pt-0">
                                            {block.questionType === 'short-text' && (
                                                <Input
                                                    placeholder="Sua resposta aqui..."
                                                    className="auth-glass-input rounded-xl h-12 text-lg transition-all"
                                                    value={answers[block.id] || ''}
                                                    onChange={e => handleAnswer(block.id, e.target.value)}
                                                    required={block.required}
                                                    maxLength={200}
                                                />
                                            )}

                                            {block.questionType === 'long-text' && (
                                                <div className="space-y-1">
                                                    <Textarea
                                                        placeholder="Fale um pouco mais detalhadamente..."
                                                        className="auth-glass-input rounded-xl min-h-[120px] text-lg transition-all"
                                                        value={answers[block.id] || ''}
                                                        onChange={e => handleAnswer(block.id, e.target.value)}
                                                        required={block.required}
                                                        maxLength={5000}
                                                    />
                                                    <p className="text-[10px] text-right text-muted-foreground uppercase tracking-widest font-bold">
                                                        {(answers[block.id]?.length || 0)} / 5000
                                                    </p>
                                                </div>
                                            )}

                                            {block.questionType === 'email' && (
                                                <div className="space-y-1.5">
                                                    <div className="relative">
                                                        <Input
                                                            type="email"
                                                            placeholder="exemplo@email.com"
                                                            className="auth-glass-input rounded-xl h-12 text-lg pl-10 transition-all"
                                                            value={answers[block.id] || ''}
                                                            onChange={e => handleAnswer(block.id, e.target.value)}
                                                            required={block.required || (form?.settings.deliverMaterial && !user && form.settings.emailQuestionId === block.id)}
                                                        />
                                                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    {form?.settings.deliverMaterial && !user && form.settings.emailQuestionId === block.id && (
                                                        <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                                                            <KeyRound className="h-3.5 w-3.5" /> É para este e-mail que enviaremos o material.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {block.questionType === 'phone' && (
                                                <div className="relative">
                                                    <Input
                                                        type="tel"
                                                        placeholder="(00) 00000-0000"
                                                        className="auth-glass-input rounded-xl h-12 text-lg pl-10 transition-all"
                                                        value={answers[block.id] || ''}
                                                        onChange={e => handleAnswer(block.id, e.target.value)}
                                                        required={block.required}
                                                    />
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}

                                            {block.questionType === 'multiple-choice' && (
                                                <RadioGroup
                                                    value={answers[block.id] || ''}
                                                    onValueChange={val => handleAnswer(block.id, val)}
                                                    className="space-y-3"
                                                    required={block.required}
                                                >
                                                    {block.options?.map((option, i) => (
                                                        // onClick na linha inteira: aumenta a área de toque (não depende
                                                        // de acertar a bolinha ou o texto). O clique redundante que às vezes
                                                        // chega também pelo RadioGroupItem é inofensivo — ambos definem o
                                                        // mesmo valor.
                                                        <div
                                                            key={i}
                                                            onClick={() => handleAnswer(block.id, option)}
                                                            className="flex items-center space-x-3 rounded-xl bg-background/60 border border-white/20 dark:border-white/5 p-4 hover:soul-light active:soul-light active:scale-[0.99] transition-all cursor-pointer group touch-manipulation"
                                                        >
                                                            <RadioGroupItem value={option} id={`${block.id}-${i}`} className="border-primary text-primary" />
                                                            <Label htmlFor={`${block.id}-${i}`} className="flex-1 cursor-pointer text-lg font-medium group-hover:text-primary transition-colors text-foreground">{option}</Label>
                                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            )}

                                            {block.questionType === 'checklist' && (
                                                <div className="space-y-3">
                                                    {block.options?.map((option, i) => {
                                                        const current = answers[block.id] || []
                                                        const isChecked = current.includes(option)
                                                        const toggle = () => {
                                                            const newVal = isChecked
                                                                ? current.filter((v: string) => v !== option)
                                                                : [...current, option]
                                                            handleAnswer(block.id, newVal)
                                                        }
                                                        return (
                                                            // onClick na linha inteira pelo mesmo motivo do multiple-choice
                                                            // acima; o Checkbox mantém seu próprio onCheckedChange para
                                                            // teclado/leitor de tela.
                                                            <div
                                                                key={i}
                                                                onClick={toggle}
                                                                className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer group active:scale-[0.99] touch-manipulation ${isChecked ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-background/60 border-white/20 dark:border-white/5 hover:border-primary/30 active:border-primary/30'}`}
                                                            >
                                                                <Checkbox
                                                                    id={`${block.id}-${i}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => {
                                                                        const newVal = checked
                                                                            ? [...current, option]
                                                                            : current.filter((v: string) => v !== option)
                                                                        handleAnswer(block.id, newVal)
                                                                    }}
                                                                />
                                                                <Label htmlFor={`${block.id}-${i}`} className="flex-1 cursor-pointer text-lg font-medium group-hover:text-primary transition-colors text-foreground">{option}</Label>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                        transition={{ duration: 0.4 }}
                        className="pt-8"
                    >
                        <Button
                            disabled={submitting}
                            className="btn-brand-glow text-white soul-light soul-light-brand rounded-2xl w-full h-16 text-xl font-black group overflow-hidden relative"
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
                </form>
            </div>
        </div>
    )
}

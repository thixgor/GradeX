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
    Phone
} from 'lucide-react'
import { PageLoading } from '@/components/page-loading'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export default function PublicFormPage() {
    const params = useParams()
    const id = params.id as string
    const [form, setForm] = useState<Form | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        fetchForm()
    }, [id])

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
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch(`/api/forms/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            })

            const data = await res.json()
            if (res.ok) {
                setSubmitted(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
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

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Ambient blobs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="auth-glass-card max-w-lg w-full rounded-2xl p-0 relative z-10"
                >
                    <div className="text-center p-8 pb-6 border-b border-white/10">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-primary">Sucesso!</h2>
                        <p className="text-lg mt-2 text-muted-foreground">
                            Obrigado por sua participação. Suas respostas foram enviadas com sucesso.
                        </p>
                    </div>
                    <div className="py-8 text-center space-y-4 px-8">
                        <p className="text-muted-foreground">
                            {form?.settings.sendConfirmationEmail
                                ? "Você receberá um e-mail com o resumo das suas respostas em instantes."
                                : "Deseja conhecer mais sobre nosso trabalho?"}
                        </p>
                        <Button variant="outline" className="group" onClick={() => window.location.href = 'https://domineaqui.com.br'}>
                            Visitar Site <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
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
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
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
                                    <div className="form-glass-card soul-light rounded-2xl hover-lift transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30">
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
                                                <div className="relative">
                                                    <Input
                                                        type="email"
                                                        placeholder="exemplo@email.com"
                                                        className="auth-glass-input rounded-xl h-12 text-lg pl-10 transition-all"
                                                        value={answers[block.id] || ''}
                                                        onChange={e => handleAnswer(block.id, e.target.value)}
                                                        required={block.required}
                                                    />
                                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                                                    onValueChange={val => handleAnswer(block.id, val)}
                                                    className="space-y-3"
                                                    required={block.required}
                                                >
                                                    {block.options?.map((option, i) => (
                                                        <div key={i} className="flex items-center space-x-3 rounded-xl bg-background/30 backdrop-blur-sm border border-white/20 dark:border-white/5 p-4 hover:soul-light transition-all cursor-pointer group">
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
                                                        return (
                                                            <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl backdrop-blur-sm border transition-all cursor-pointer group ${isChecked ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-background/30 border-white/20 dark:border-white/5 hover:border-primary/30'}`}>
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
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: (form?.blocks.length || 0) * 0.1 + 0.2 }}
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

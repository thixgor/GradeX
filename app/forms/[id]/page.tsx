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
import { Badge } from '@/components/ui/badge'

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center animate-pulse">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Carregando formulário...</p>
                </div>
            </div>
        )
    }

    if (error && !form) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-destructive">Opa! Algo deu errado</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
                <Card className="max-w-lg w-full shadow-2xl border-primary/20 animate-in zoom-in-95 duration-500">
                    <CardHeader className="text-center pb-8 border-b">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-primary">Sucesso!</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            Obrigado por sua participação. Suas respostas foram enviadas com sucesso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-8 text-center space-y-4">
                        <p className="text-muted-foreground">
                            {form?.settings.sendConfirmationEmail
                                ? "Você receberá um e-mail com o resumo das suas respostas em instantes."
                                : "Deseja conhecer mais sobre nosso trabalho?"}
                        </p>
                        <Button variant="outline" className="group" onClick={() => window.location.href = 'https://domineaqui.com.br'}>
                            Visitar Site <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary bg-primary/5">
                        {form?.settings.isActive ? "Pesquisa Disponível" : "Inativo"}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                        {form?.title}
                    </h1>
                    {form?.description && (
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto balance leading-relaxed">
                            {form.description}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-shake">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {form?.blocks.map((block, index) => {
                        const isQuestion = block.type === 'question'

                        return (
                            <div
                                key={block.id}
                                className={`animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* BLoco de Conteúdo */}
                                {block.type === 'text' && (
                                    <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-indigo-800 text-white overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-2xl">{block.title}</CardTitle>
                                            {block.description && <CardDescription className="text-white/80">{block.description}</CardDescription>}
                                        </CardHeader>
                                        <CardContent>
                                            <p className="whitespace-pre-wrap text-lg opacity-90">{block.content}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {block.type === 'image' && (
                                    <Card className="overflow-hidden shadow-xl group border-none">
                                        <img
                                            src={block.content}
                                            alt={block.title}
                                            className="w-full h-auto max-h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        {(block.title || block.description) && (
                                            <CardHeader className="bg-white">
                                                <CardTitle className="text-xl">{block.title}</CardTitle>
                                                <CardDescription>{block.description}</CardDescription>
                                            </CardHeader>
                                        )}
                                    </Card>
                                )}

                                {block.type === 'video' && (
                                    <Card className="overflow-hidden shadow-xl border-none">
                                        <div className="aspect-video">
                                            <iframe
                                                src={block.content}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        {(block.title || block.description) && (
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Video className="h-5 w-5 text-primary" /> {block.title}
                                                </CardTitle>
                                                <CardDescription>{block.description}</CardDescription>
                                            </CardHeader>
                                        )}
                                    </Card>
                                )}

                                {block.type === 'link' && (
                                    <Card className="border-none shadow-md bg-white border-l-4 border-l-primary flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h3 className="font-bold text-lg">{block.title}</h3>
                                            {block.description && <p className="text-sm text-muted-foreground">{block.description}</p>}
                                        </div>
                                        <Button asChild className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                                            <a href={block.linkUrl} target="_blank" rel="noopener noreferrer">
                                                {block.buttonText || 'Acessar'} <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </Card>
                                )}

                                {/* Bloco de Pergunta */}
                                {isQuestion && (
                                    <Card className="shadow-lg border-none bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow border-t-4 border-t-primary/20 focus-within:border-t-primary duration-300">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-xl font-bold text-slate-800 leading-snug">
                                                    {block.title}
                                                    {block.required && <span className="text-red-500 ml-1" title="Obrigatório">*</span>}
                                                </CardTitle>
                                            </div>
                                            {block.description && (
                                                <CardDescription className="text-slate-500 italic mt-1 font-medium">
                                                    {block.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            {block.questionType === 'short-text' && (
                                                <Input
                                                    placeholder="Sua resposta aqui..."
                                                    className="bg-slate-50 border-slate-200 h-12 text-lg focus:bg-white transition-all"
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
                                                        className="bg-slate-50 border-slate-200 min-h-[120px] text-lg focus:bg-white transition-all"
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
                                                        className="bg-slate-50 border-slate-200 h-12 text-lg pl-10 focus:bg-white transition-all"
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
                                                        className="bg-slate-50 border-slate-200 h-12 text-lg pl-10 focus:bg-white transition-all"
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
                                                        <div key={i} className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-transparent hover:border-primary/30 transition-all cursor-pointer group">
                                                            <RadioGroupItem value={option} id={`${block.id}-${i}`} className="border-primary text-primary" />
                                                            <Label htmlFor={`${block.id}-${i}`} className="flex-1 cursor-pointer text-lg font-medium group-hover:text-primary transition-colors">{option}</Label>
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
                                                            <div key={i} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer group ${isChecked ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-slate-50 border-transparent hover:border-primary/30'}`}>
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
                                                                <Label htmlFor={`${block.id}-${i}`} className="flex-1 cursor-pointer text-lg font-medium group-hover:text-primary transition-colors">{option}</Label>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )
                    })}

                    <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both delay-500">
                        <Button
                            disabled={submitting}
                            className="w-full h-16 text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 rounded-2xl group overflow-hidden relative"
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
                    </div>
                </form>
            </div>

            <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
        </div>
    )
}

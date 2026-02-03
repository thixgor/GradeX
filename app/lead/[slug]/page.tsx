'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import {
    ArrowRight,
    Mail,
    User,
    Gift,
    Check,
    Loader2,
    ExternalLink,
    FileText,
    Instagram,
    Home,
    Play,
    Headphones,
    Music,
    Sparkles,
    Lock,
    ChevronDown
} from 'lucide-react'

interface LeadBlock {
    id: string
    type: 'text' | 'button' | 'card' | 'embed'
    content?: string
    buttonText?: string
    buttonUrl?: string
    buttonColor?: string
    isPdfButton?: boolean
    cardTitle?: string
    cardDescription?: string
    cardImageUrl?: string
    embedType?: 'video' | 'podcast' | 'audio'
    embedUrl?: string
    embedTitle?: string
    embedDescription?: string
}

interface Campaign {
    _id: string
    name: string
    imageUrl?: string
    collectButtonText: string
}

// Animações
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}

const pulse = {
    animate: {
        scale: [1, 1.02, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
} as const

const float = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
} as const

export default function LeadCapturePage() {
    const params = useParams()
    const slug = params.slug as string
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [step, setStep] = useState<'form' | 'material'>('form')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')

    // Material state
    const [welcomeMessage, setWelcomeMessage] = useState('')
    const [blocks, setBlocks] = useState<LeadBlock[]>([])
    const [emailSent, setEmailSent] = useState(false)
    const [alreadySentBefore, setAlreadySentBefore] = useState(false)

    useEffect(() => {
        fetchCampaign()
    }, [slug])

    async function fetchCampaign() {
        try {
            const res = await fetch(`/api/leads/${slug}`)
            if (res.ok) {
                const data = await res.json()
                setCampaign(data.campaign)
            } else {
                setCampaign(null)
            }
        } catch (error) {
            console.error('Erro:', error)
            setCampaign(null)
        } finally {
            setLoading(false)
        }
    }

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Por favor, digite seu nome')
            return
        }

        if (!email.trim()) {
            setError('Por favor, digite seu e-mail')
            return
        }

        if (!validateEmail(email)) {
            setError('Por favor, digite um e-mail válido')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/leads/${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim() })
            })

            const data = await res.json()

            if (res.ok) {
                setWelcomeMessage(data.welcomeMessage)
                setBlocks(data.blocks || [])
                setEmailSent(data.emailSent || false)
                setAlreadySentBefore(data.alreadySentBefore || false)
                setStep('material')
            } else {
                setError(data.error || 'Erro ao processar. Tente novamente.')
            }
        } catch (error) {
            console.error('Erro:', error)
            setError('Erro de conexão. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const renderBlock = (block: LeadBlock, index: number) => {
        switch (block.type) {
            case 'text':
                return (
                    <motion.div
                        key={block.id}
                        variants={fadeInUp}
                        className="text-gray-200 leading-relaxed text-sm sm:text-base"
                        dangerouslySetInnerHTML={{ __html: block.content || '' }}
                    />
                )

            case 'button':
                return (
                    <motion.div
                        key={block.id}
                        variants={fadeInUp}
                        className="flex justify-center"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <a
                            href={block.buttonUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
                            style={{
                                backgroundColor: block.buttonColor || '#E2A43E',
                                boxShadow: `0 4px 20px ${block.buttonColor || '#E2A43E'}40`
                            }}
                        >
                            {block.isPdfButton ? <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> : <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />}
                            {block.buttonText || 'Acessar'}
                        </a>
                    </motion.div>
                )

            case 'card':
                return (
                    <motion.div
                        key={block.id}
                        variants={fadeInUp}
                        whileHover={{ y: -5 }}
                    >
                        <Card className="overflow-hidden bg-[#0d2818]/80 border-[#1a4d28] backdrop-blur-sm">
                            {block.cardImageUrl && (
                                <div className="h-32 sm:h-40 overflow-hidden">
                                    <img
                                        src={block.cardImageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <CardContent className="p-4 sm:p-5">
                                {block.cardTitle && (
                                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{block.cardTitle}</h3>
                                )}
                                {block.cardDescription && (
                                    <p className="text-gray-300 text-xs sm:text-sm">{block.cardDescription}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )

            case 'embed':
                const EmbedIcon = block.embedType === 'video' ? Play : block.embedType === 'podcast' ? Headphones : Music
                return (
                    <motion.div
                        key={block.id}
                        variants={fadeInUp}
                        className="bg-gradient-to-br from-[#0f3d2e] to-[#1a5c45] rounded-xl p-4 sm:p-5 border border-[#2d7a5c]"
                    >
                        {block.embedTitle && (
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{block.embedTitle}</h3>
                        )}
                        {block.embedDescription && (
                            <p className="text-gray-200 text-xs sm:text-sm mb-4">{block.embedDescription}</p>
                        )}
                        <motion.a
                            href={block.embedUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold text-white bg-[#E2A43E] hover:bg-[#c8902e] transition-colors text-sm sm:text-base"
                        >
                            <EmbedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            {block.embedType === 'video' ? 'Assistir' : block.embedType === 'podcast' ? 'Ouvir Podcast' : 'Ouvir Áudio'}
                        </motion.a>
                    </motion.div>
                )

            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a1f13] via-[#0d2818] to-[#0a1f13] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="h-10 w-10 text-[#E2A43E]" />
                </motion.div>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a1f13] via-[#0d2818] to-[#0a1f13] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="w-20 h-20 mx-auto bg-[#1a4d28] rounded-full flex items-center justify-center">
                        <Gift className="h-10 w-10 text-[#E2A43E]" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Material não encontrado</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Este link pode ter expirado ou não existe mais.</p>
                    <Button
                        onClick={() => router.push('/')}
                        className="mt-4 bg-[#1a4d28] hover:bg-[#2d6e3f] text-white"
                    >
                        <Home className="mr-2 h-4 w-4" /> Ir para o início
                    </Button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1f13] via-[#0d2818] to-[#0a1f13] overflow-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Gradient Orbs */}
                <motion.div
                    className="absolute -top-32 -left-32 w-64 sm:w-96 h-64 sm:h-96 bg-[#1a5c45] rounded-full blur-[100px] opacity-30"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.4, 0.3]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-32 -right-32 w-64 sm:w-96 h-64 sm:h-96 bg-[#E2A43E] rounded-full blur-[100px] opacity-20"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-72 h-48 sm:h-72 bg-[#468152] rounded-full blur-[80px] opacity-20"
                    animate={{
                        scale: [1, 1.1, 1],
                        x: ["-50%", "-45%", "-50%"],
                        y: ["-50%", "-55%", "-50%"]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating Particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-[#E2A43E] rounded-full"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </div>

            <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12">
                <AnimatePresence mode="wait">
                    {step === 'form' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full max-w-md"
                        >
                            {/* Logo */}
                            <motion.div
                                className="flex justify-center mb-6 sm:mb-8"
                                {...float}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={140}
                                    height={50}
                                    className="h-10 sm:h-12 w-auto"
                                />
                            </motion.div>

                            <motion.div
                                className="bg-[#0d2818]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#1a4d28] shadow-2xl"
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                {/* Header */}
                                <motion.div
                                    className="text-center mb-6 sm:mb-8"
                                    variants={staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                >
                                    {campaign.imageUrl ? (
                                        <motion.div
                                            variants={fadeInUp}
                                            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg border-2 border-[#E2A43E]/30"
                                        >
                                            <img src={campaign.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            variants={fadeInUp}
                                            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#1a4d28] to-[#2d6e3f] flex items-center justify-center shadow-lg border border-[#2d6e3f]"
                                            {...pulse}
                                        >
                                            <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-[#E2A43E]" />
                                        </motion.div>
                                    )}
                                    <motion.h1
                                        variants={fadeInUp}
                                        className="text-xl sm:text-2xl font-bold text-white mb-2"
                                    >
                                        {campaign.name}
                                    </motion.h1>
                                    <motion.p
                                        variants={fadeInUp}
                                        className="text-gray-400 text-sm sm:text-base flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4 text-[#E2A43E]" />
                                        Preencha para acessar o material
                                    </motion.p>
                                </motion.div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                                    <motion.div
                                        className="space-y-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Label htmlFor="name" className="text-gray-300 text-sm font-medium">
                                            Qual seu nome?
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-[#E2A43E] transition-colors" />
                                            <Input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Diga-nos seu nome"
                                                className="pl-10 sm:pl-11 bg-[#0a1f13] border-[#1a4d28] text-white placeholder:text-gray-500 h-11 sm:h-12 rounded-xl focus:border-[#E2A43E] focus:ring-[#E2A43E]/20 text-sm sm:text-base transition-all"
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="space-y-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                                            Seu melhor e-mail
                                        </Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-[#E2A43E] transition-colors" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                className="pl-10 sm:pl-11 bg-[#0a1f13] border-[#1a4d28] text-white placeholder:text-gray-500 h-11 sm:h-12 rounded-xl focus:border-[#E2A43E] focus:ring-[#E2A43E]/20 text-sm sm:text-base transition-all"
                                            />
                                        </div>
                                    </motion.div>

                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-red-400 text-xs sm:text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2.5 px-3"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#E2A43E] to-[#c8902e] hover:from-[#c8902e] hover:to-[#b07d28] text-white font-semibold rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base group"
                                            style={{ boxShadow: '0 4px 25px rgba(226, 164, 62, 0.3)' }}
                                        >
                                            {submitting ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Loader2 className="h-5 w-5" />
                                                </motion.div>
                                            ) : (
                                                <>
                                                    {campaign.collectButtonText || 'Acessar Material Gratuito'}
                                                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>

                                {/* Footer */}
                                <motion.div
                                    className="flex items-center justify-center gap-2 text-gray-500 mt-5 sm:mt-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Lock className="h-3.5 w-3.5" />
                                    <span className="text-xs">Seus dados estão seguros e protegidos</span>
                                </motion.div>
                            </motion.div>

                            {/* Scroll hint for mobile */}
                            <motion.div
                                className="flex justify-center mt-6 sm:hidden"
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="material"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="w-full max-w-lg"
                        >
                            {/* Logo */}
                            <motion.div
                                className="flex justify-center mb-6"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={120}
                                    height={40}
                                    className="h-8 sm:h-10 w-auto"
                                />
                            </motion.div>

                            <motion.div
                                className="bg-[#0d2818]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#1a4d28] shadow-2xl"
                            >
                                {/* Success Header */}
                                <div className="text-center mb-6 sm:mb-8">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.1, duration: 0.6 }}
                                        className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#468152] to-[#2d6e3f] flex items-center justify-center shadow-lg border-2 border-[#5a9b66]"
                                    >
                                        <Check className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                                    </motion.div>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-lg sm:text-xl font-bold text-white mb-2"
                                    >
                                        {welcomeMessage}
                                    </motion.h1>

                                    {/* Email status */}
                                    {emailSent && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="inline-flex items-center gap-2 bg-[#468152]/20 text-[#7dd690] border border-[#468152]/30 rounded-full px-4 py-2 text-xs sm:text-sm mt-3"
                                        >
                                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Material enviado para seu e-mail!
                                        </motion.div>
                                    )}
                                    {alreadySentBefore && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="inline-flex items-center gap-2 bg-[#E2A43E]/20 text-[#E2A43E] border border-[#E2A43E]/30 rounded-full px-4 py-2 text-xs sm:text-sm mt-3"
                                        >
                                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Você já recebeu no seu e-mail!
                                        </motion.div>
                                    )}
                                </div>

                                {/* Content Blocks */}
                                <motion.div
                                    className="space-y-4 sm:space-y-5"
                                    variants={staggerContainer}
                                    initial="initial"
                                    animate="animate"
                                >
                                    {blocks.map((block, index) => renderBlock(block, index))}
                                </motion.div>

                                {/* CTA to Home / Instagram */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + blocks.length * 0.1 }}
                                    className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#1a4d28] space-y-4"
                                >
                                    <p className="text-center text-gray-400 text-xs sm:text-sm">
                                        Gostou do conteúdo? Conecte-se conosco!
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <a
                                                href="https://instagram.com/domineaqui.br"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E1306C] via-[#F77737] to-[#FCAF45] hover:opacity-90 transition-opacity text-sm sm:text-base"
                                            >
                                                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                                                @domineaqui.br
                                            </a>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <Button
                                                onClick={() => router.push('/')}
                                                variant="outline"
                                                className="w-full border-[#1a4d28] text-white hover:bg-[#1a4d28]/50 h-11 sm:h-12 rounded-xl text-sm sm:text-base"
                                            >
                                                <Home className="mr-2 h-4 w-4" />
                                                Conhecer a Plataforma
                                            </Button>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Powered by */}
                            <motion.div
                                className="flex justify-center mt-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <span className="text-gray-600 text-xs flex items-center gap-1.5">
                                    Powered by
                                    <Image
                                        src="/logo.png"
                                        alt="Logo"
                                        width={60}
                                        height={20}
                                        className="h-4 w-auto opacity-50"
                                    />
                                </span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Coffee, Heart, Lightbulb, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DoacaoForm } from './doacao-form'
import { shouldShowInterstitial, markInterstitialShown } from '@/lib/doacao-interstitial'

type InterstitialContext = 'manual-clinico' | 'exam'

interface DoacaoInterstitialProps {
  context: InterstitialContext
  onClose: () => void
}

type InterstitialVariant = {
  eyebrow: string
  title: string
  body: string
  detail: string
  primary: string
  visualTitle: string
  visualBody: string
  palette: {
    accent: string
    accentHover: string
    dark: string
    stripe: string
    soft: string
    icon: string
  }
  points: Array<{ icon: LucideIcon; text: string }>
}

const INTERSTITIAL_VARIANTS: Record<InterstitialContext, InterstitialVariant[]> = {
  'manual-clinico': [
    {
      eyebrow: 'Manual Clínico aberto',
      title: 'Esse manual só continua leve porque alguém segura a base.',
      body: 'Se uma revisão rápida já te salvou tempo, uma doação pequena ajuda a manter esse conteúdo gratuito para todo mundo.',
      detail: 'Pedido direto, saída fácil. Você continua estudando quando quiser.',
      primary: 'Apoiar o manual',
      visualTitle: 'O manual fica gratuito quando o apoio é coletivo.',
      visualBody: 'Cada Pix pequeno ajuda a manter consulta, revisão e estudo sem paywall.',
      palette: {
        accent: '#047857',
        accentHover: '#065f46',
        dark: '#0f2f24',
        stripe: 'linear-gradient(90deg, #10b981, #fb7185, #fbbf24)',
        soft: 'rgba(16,185,129,0.10)',
        icon: '#047857',
      },
      points: [
        { icon: BookOpen, text: 'Consulta rápida sem barreira' },
        { icon: Coffee, text: 'Qualquer valor já ajuda' },
        { icon: ShieldCheck, text: 'Menos chance de virar conteúdo pago' },
      ],
    },
    {
      eyebrow: 'Plantão, prova, revisão',
      title: 'Se isso te ajuda de verdade, ajuda a manter vivo também.',
      body: 'A plataforma não quer te parar. Quer lembrar que conteúdo gratuito também tem custo para existir bem feito.',
      detail: 'Hoje pode ser só um lembrete. Quando der, você apoia.',
      primary: 'Contribuir agora',
      visualTitle: 'Um gesto pequeno mantém muita gente estudando.',
      visualBody: 'Apoio recorrente não precisa ser grande. Precisa existir.',
      palette: {
        accent: '#be123c',
        accentHover: '#9f1239',
        dark: '#35151f',
        stripe: 'linear-gradient(90deg, #fb7185, #f59e0b, #10b981)',
        soft: 'rgba(251,113,133,0.11)',
        icon: '#be123c',
      },
      points: [
        { icon: Heart, text: 'Apoio humano, sem pressão' },
        { icon: Users, text: 'Mais alunos acessando' },
        { icon: Sparkles, text: 'Conteúdo cuidado e atualizado' },
      ],
    },
    {
      eyebrow: 'Conteúdo livre',
      title: 'Gratuito não precisa parecer abandonado.',
      body: 'Doações ajudam a manter o manual bonito, útil e disponível, sem empurrar o aluno para assinatura no meio do estudo.',
      detail: 'Se não for agora, tudo bem. O convite volta com outra cara.',
      primary: 'Fazer uma doação',
      visualTitle: 'A qualidade que você usa depende de manutenção.',
      visualBody: 'Servidor, tempo, curadoria e melhoria contínua aparecem no resultado final.',
      palette: {
        accent: '#b45309',
        accentHover: '#92400e',
        dark: '#3a2611',
        stripe: 'linear-gradient(90deg, #f59e0b, #22c55e, #38bdf8)',
        soft: 'rgba(245,158,11,0.12)',
        icon: '#b45309',
      },
      points: [
        { icon: Lightbulb, text: 'Melhorias constantes' },
        { icon: BookOpen, text: 'Material organizado' },
        { icon: Coffee, text: 'Manutenção sem virar assinatura' },
      ],
    },
    {
      eyebrow: 'Ajuda de bolso',
      title: 'Não precisa ser muito. Precisa ser possível continuar.',
      body: 'Um valor pequeno de quem usa o manual já ajuda a bancar a estrutura que deixa tudo aberto para consulta.',
      detail: 'O convite é insistente porque o acesso gratuito também precisa insistir para sobreviver.',
      primary: 'Doar um valor pequeno',
      visualTitle: 'Pequenas doações seguram grandes bibliotecas.',
      visualBody: 'A soma de apoios discretos mantém o manual disponível para quem ainda não pode pagar.',
      palette: {
        accent: '#0f766e',
        accentHover: '#115e59',
        dark: '#12312f',
        stripe: 'linear-gradient(90deg, #14b8a6, #facc15, #fb7185)',
        soft: 'rgba(20,184,166,0.11)',
        icon: '#0f766e',
      },
      points: [
        { icon: Coffee, text: 'Pix pequeno já conta' },
        { icon: Users, text: 'Ajuda quem estuda sem grana' },
        { icon: BookOpen, text: 'Manual sempre acessível' },
      ],
    },
    {
      eyebrow: 'Sem muro no caminho',
      title: 'O melhor conteúdo é o que aparece quando o aluno precisa.',
      body: 'Sua doação ajuda a evitar que uma dúvida importante esbarre em pagamento, cadastro extra ou limite artificial.',
      detail: 'Se hoje não der, pode continuar. Se der, esse clique ajuda bastante.',
      primary: 'Manter sem paywall',
      visualTitle: 'Menos barreira, mais aprendizado.',
      visualBody: 'Apoiar é escolher que o conteúdo clínico continue aparecendo na hora certa.',
      palette: {
        accent: '#7c3aed',
        accentHover: '#6d28d9',
        dark: '#24163f',
        stripe: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #22c55e)',
        soft: 'rgba(124,58,237,0.11)',
        icon: '#7c3aed',
      },
      points: [
        { icon: ShieldCheck, text: 'Sem limite artificial' },
        { icon: Sparkles, text: 'Experiência mais fluida' },
        { icon: Heart, text: 'Acesso mais justo' },
      ],
    },
    {
      eyebrow: 'Cuidado contínuo',
      title: 'Manual bom não nasce pronto. Ele é cuidado toda semana.',
      body: 'Revisar, organizar e melhorar conteúdo toma tempo. A doação ajuda esse cuidado a continuar sem pesar para o aluno.',
      detail: 'É um lembrete rápido, com saída simples, mas com impacto real.',
      primary: 'Apoiar o cuidado',
      visualTitle: 'Conteúdo útil precisa de manutenção.',
      visualBody: 'Quando alguém apoia, fica mais viável melhorar sem fechar acesso.',
      palette: {
        accent: '#0369a1',
        accentHover: '#075985',
        dark: '#102a3b',
        stripe: 'linear-gradient(90deg, #0ea5e9, #22c55e, #f97316)',
        soft: 'rgba(14,165,233,0.11)',
        icon: '#0369a1',
      },
      points: [
        { icon: Lightbulb, text: 'Revisões mais frequentes' },
        { icon: BookOpen, text: 'Conteúdo mais claro' },
        { icon: Coffee, text: 'Tempo de curadoria' },
      ],
    },
    {
      eyebrow: 'Para o próximo aluno',
      title: 'Talvez hoje você use. Amanhã alguém depende disso.',
      body: 'Doar é ajudar o próximo estudante a encontrar uma resposta sem bater em cobrança no meio da dúvida.',
      detail: 'A plataforma pede sempre porque a comunidade cresce quando o apoio também cresce.',
      primary: 'Ajudar o próximo aluno',
      visualTitle: 'Você apoia uma fila invisível de estudantes.',
      visualBody: 'Quem chega depois encontra o caminho mais aberto porque alguém ajudou antes.',
      palette: {
        accent: '#15803d',
        accentHover: '#166534',
        dark: '#142f1d',
        stripe: 'linear-gradient(90deg, #22c55e, #84cc16, #38bdf8)',
        soft: 'rgba(34,197,94,0.11)',
        icon: '#15803d',
      },
      points: [
        { icon: Users, text: 'Comunidade estudando junto' },
        { icon: Heart, text: 'Apoio para quem vem depois' },
        { icon: ShieldCheck, text: 'Acesso preservado' },
      ],
    },
    {
      eyebrow: 'Convite honesto',
      title: 'Se o manual tem valor para você, ele pode receber valor de você.',
      body: 'A ideia é simples: quem pode contribuir ajuda a manter gratuito para quem ainda não pode.',
      detail: 'Você segue com um clique. Mas se puder doar, faz diferença.',
      primary: 'Reconhecer com doação',
      visualTitle: 'Valor percebido pode virar acesso mantido.',
      visualBody: 'O apoio voluntário equilibra a conta sem transformar estudo em cobrança obrigatória.',
      palette: {
        accent: '#c2410c',
        accentHover: '#9a3412',
        dark: '#3a1d12',
        stripe: 'linear-gradient(90deg, #f97316, #f43f5e, #14b8a6)',
        soft: 'rgba(249,115,22,0.12)',
        icon: '#c2410c',
      },
      points: [
        { icon: Sparkles, text: 'Reconhecimento voluntário' },
        { icon: BookOpen, text: 'Acesso gratuito mantido' },
        { icon: Coffee, text: 'Contribuição sem burocracia' },
      ],
    },
  ],
  exam: [
    {
      eyebrow: 'Antes da prova',
      title: 'Boa prova. Antes de começar: ajuda a manter isso aberto?',
      body: 'As provas gratuitas continuam existindo porque alguns alunos apoiam quando podem. Qualquer valor já conta.',
      detail: 'Sem pressão: pule e siga para a prova quando quiser.',
      primary: 'Apoiar as provas',
      visualTitle: 'Uma prova gratuita também tem bastidor.',
      visualBody: 'Questões, correções, estrutura e servidor precisam continuar de pé.',
      palette: {
        accent: '#047857',
        accentHover: '#065f46',
        dark: '#102c25',
        stripe: 'linear-gradient(90deg, #10b981, #38bdf8, #fb7185)',
        soft: 'rgba(16,185,129,0.10)',
        icon: '#047857',
      },
      points: [
        { icon: BookOpen, text: 'Mais simulados gratuitos' },
        { icon: ShieldCheck, text: 'Menos paywall no caminho' },
        { icon: Coffee, text: 'Apoio pequeno já sustenta' },
      ],
    },
    {
      eyebrow: 'Minuto antes do foco',
      title: 'Você vai fazer a prova. A plataforma só pede um empurrão.',
      body: 'Se esse treino faz diferença na sua rotina, uma doação ajuda a deixar a experiência disponível para mais estudantes.',
      detail: 'Clique em continuar e a prova começa normalmente.',
      primary: 'Ajudar antes de começar',
      visualTitle: 'Treino bom precisa continuar acessível.',
      visualBody: 'O pedido aparece sempre, mas muda para não virar ruído automático.',
      palette: {
        accent: '#2563eb',
        accentHover: '#1d4ed8',
        dark: '#172554',
        stripe: 'linear-gradient(90deg, #3b82f6, #14b8a6, #fbbf24)',
        soft: 'rgba(59,130,246,0.10)',
        icon: '#2563eb',
      },
      points: [
        { icon: Sparkles, text: 'Experiência mais caprichada' },
        { icon: Users, text: 'Mais alunos treinando' },
        { icon: Heart, text: 'Contribuição voluntária' },
      ],
    },
    {
      eyebrow: 'Missão rápida',
      title: 'Se a prova te prepara, sua doação prepara a plataforma.',
      body: 'Não é obrigação. É um convite insistente porque acesso gratuito precisa de gente junto para sobreviver.',
      detail: 'Você decide em segundos. O estudo continua logo depois.',
      primary: 'Contribuir com a plataforma',
      visualTitle: 'Acesso aberto é uma escolha que precisa de apoio.',
      visualBody: 'A cada tentativa, um lembrete diferente para não virar paisagem.',
      palette: {
        accent: '#be123c',
        accentHover: '#9f1239',
        dark: '#3b1420',
        stripe: 'linear-gradient(90deg, #fb7185, #a78bfa, #10b981)',
        soft: 'rgba(251,113,133,0.11)',
        icon: '#be123c',
      },
      points: [
        { icon: Lightbulb, text: 'Novas ideias saem do papel' },
        { icon: ShieldCheck, text: 'Ferramenta livre por mais tempo' },
        { icon: Coffee, text: 'Um café já ajuda' },
      ],
    },
    {
      eyebrow: 'Treino aberto',
      title: 'Cada prova gratuita precisa de apoio para continuar existindo.',
      body: 'Se esse simulado te ajuda a ganhar segurança, uma contribuição ajuda a manter o treino aberto para mais alunos.',
      detail: 'Você pode pular agora. O pedido muda, mas a missão é a mesma.',
      primary: 'Manter treinos abertos',
      visualTitle: 'Simulado bom não deveria depender de assinatura.',
      visualBody: 'Doações ajudam a sustentar a parte invisível da experiência de prova.',
      palette: {
        accent: '#0f766e',
        accentHover: '#115e59',
        dark: '#12312f',
        stripe: 'linear-gradient(90deg, #14b8a6, #60a5fa, #facc15)',
        soft: 'rgba(20,184,166,0.11)',
        icon: '#0f766e',
      },
      points: [
        { icon: BookOpen, text: 'Banco de provas acessível' },
        { icon: Users, text: 'Mais gente treinando' },
        { icon: Coffee, text: 'Custo dividido em pequenas ajudas' },
      ],
    },
    {
      eyebrow: 'Antes do cronômetro',
      title: 'Um clique pode ajudar a próxima prova a existir.',
      body: 'Você está a segundos de começar. Se puder, deixa uma contribuição para que esse tipo de treino continue gratuito.',
      detail: 'Depois de apoiar ou pular, a prova segue normalmente.',
      primary: 'Apoiar antes do início',
      visualTitle: 'O cronômetro começa. O apoio fica.',
      visualBody: 'Uma contribuição rápida ajuda a plataforma a continuar entregando prática de qualidade.',
      palette: {
        accent: '#7c3aed',
        accentHover: '#6d28d9',
        dark: '#24163f',
        stripe: 'linear-gradient(90deg, #8b5cf6, #38bdf8, #fb7185)',
        soft: 'rgba(124,58,237,0.11)',
        icon: '#7c3aed',
      },
      points: [
        { icon: Sparkles, text: 'Experiência de prova melhor' },
        { icon: ShieldCheck, text: 'Acesso sem bloqueio' },
        { icon: Heart, text: 'Apoio voluntário' },
      ],
    },
    {
      eyebrow: 'Meta coletiva',
      title: 'Treinar de graça é melhor quando a turma ajuda a bancar.',
      body: 'A plataforma insiste porque depende de pequenas contribuições para não transformar tudo em produto fechado.',
      detail: 'Não precisa ser muito. Precisa ser possível.',
      primary: 'Entrar no apoio coletivo',
      visualTitle: 'Quando muitos ajudam pouco, muita coisa fica aberta.',
      visualBody: 'O modelo só funciona se o convite aparecer e algumas pessoas responderem.',
      palette: {
        accent: '#b45309',
        accentHover: '#92400e',
        dark: '#342611',
        stripe: 'linear-gradient(90deg, #f59e0b, #22c55e, #60a5fa)',
        soft: 'rgba(245,158,11,0.12)',
        icon: '#b45309',
      },
      points: [
        { icon: Users, text: 'Apoio em comunidade' },
        { icon: Coffee, text: 'Pequenos valores somam' },
        { icon: BookOpen, text: 'Provas abertas por mais tempo' },
      ],
    },
    {
      eyebrow: 'Sem travar seu foco',
      title: 'A prova começa já. O pedido é rápido: fortalece a plataforma?',
      body: 'Doar ajuda a manter o ambiente de estudo com menos limitações, mais recursos e mais liberdade para treinar.',
      detail: 'O botão de continuar fica sempre ali. O convite também, de um jeito diferente.',
      primary: 'Fortalecer agora',
      visualTitle: 'Insistir sem cansar é pedir com respeito.',
      visualBody: 'A cada abertura, um ângulo diferente para lembrar do valor real da plataforma.',
      palette: {
        accent: '#0369a1',
        accentHover: '#075985',
        dark: '#102a3b',
        stripe: 'linear-gradient(90deg, #0ea5e9, #22c55e, #f43f5e)',
        soft: 'rgba(14,165,233,0.11)',
        icon: '#0369a1',
      },
      points: [
        { icon: Lightbulb, text: 'Novas funções possíveis' },
        { icon: ShieldCheck, text: 'Menos limite no estudo' },
        { icon: Sparkles, text: 'Interface mais cuidada' },
      ],
    },
    {
      eyebrow: 'Pedido final antes de ir',
      title: 'Se esta prova te ajuda, transforma isso em apoio.',
      body: 'Você não perde acesso ao pular. Mas quando alguém doa, a plataforma ganha fôlego para continuar oferecendo acesso gratuito.',
      detail: 'Escolha rápida: apoiar, registrar Pix ou começar a prova.',
      primary: 'Transformar em apoio',
      visualTitle: 'Acesso gratuito precisa de fôlego.',
      visualBody: 'Cada doação deixa mais provável que o próximo aluno encontre a prova aberta.',
      palette: {
        accent: '#c2410c',
        accentHover: '#9a3412',
        dark: '#3a1d12',
        stripe: 'linear-gradient(90deg, #f97316, #fb7185, #10b981)',
        soft: 'rgba(249,115,22,0.12)',
        icon: '#c2410c',
      },
      points: [
        { icon: Heart, text: 'Apoio sem obrigação' },
        { icon: Users, text: 'Benefício para outros alunos' },
        { icon: Coffee, text: 'Pix rápido, impacto real' },
      ],
    },
  ],
}

export function DoacaoInterstitial({ context, onClose }: DoacaoInterstitialProps) {
  const [visible, setVisible] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [variantIndex, setVariantIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    setMounted(true)

    async function check() {
      if (!shouldShowInterstitial(context)) {
        onClose()
        return
      }

      try {
        const res = await fetch('/api/doacoes/settings')
        const data = await res.json()
        const flagKey = context === 'manual-clinico'
          ? 'doacaoInterstitialManualClinico'
          : 'doacaoInterstitialExams'

        if (!data[flagKey]) {
          onClose()
          return
        }
      } catch {
        onClose()
        return
      }

      if (cancelled) return
      const impressionCount = markInterstitialShown(context)
      setVariantIndex((impressionCount - 1) % INTERSTITIAL_VARIANTS[context].length)
      setVisible(true)
    }

    check()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setVisible(false)
    window.setTimeout(onClose, 180)
  }

  function openDonationFlow() {
    setVisible(false)
    setFormOpen(true)
  }

  if (!mounted) return null

  const variant = INTERSTITIAL_VARIANTS[context][variantIndex]

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/40 px-3 pb-3 pt-10 backdrop-blur-[2px] sm:items-center sm:p-6"
          style={{ animation: 'doacaoSoftFade 180ms ease-out' }}
          onClick={handleClose}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="doacao-interstitial-title"
            className="doacao-interstitial-panel relative w-full max-w-[560px] overflow-hidden rounded-[22px] border border-slate-900/10 bg-[#fffaf2] text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.22)] sm:rounded-[28px]"
            style={{ animation: 'doacaoSoftEnter 240ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            onClick={event => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: variant.palette.stripe }} />

            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              aria-label="Fechar lembrete de doação"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-0 sm:grid-cols-[0.9fr_1.2fr]">
              <div className="relative hidden min-h-[260px] overflow-hidden sm:block" style={{ background: variant.palette.dark }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,rgba(252,211,77,0.22),transparent_34%),linear-gradient(150deg,rgba(16,185,129,0.28),rgba(15,47,36,0)_58%)]" />
                <div className="absolute left-6 top-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 shadow-2xl ring-1 ring-white/15 backdrop-blur">
                  <img
                    src="/logo3d.png"
                    alt="DomineAqui"
                    className="h-14 w-14 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-x-6 bottom-7 rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-2xl backdrop-blur">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Heart className="h-5 w-5 fill-rose-300 text-rose-300" />
                  </div>
                  <p className="text-sm font-semibold leading-snug text-white/95">
                    {variant.visualTitle}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/65">
                    {variant.visualBody}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-6 sm:px-6 sm:py-6">
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-slate-900/10"
                  style={{ background: variant.palette.soft, color: variant.palette.icon }}
                >
                  <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                  {variant.eyebrow}
                </div>

                <h2 id="doacao-interstitial-title" className="max-w-[22rem] text-xl font-bold leading-tight tracking-normal text-slate-950 sm:text-2xl">
                  {variant.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {variant.body}
                </p>

                <div className="mt-5 grid gap-2">
                  {variant.points.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-slate-900/5">
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: variant.palette.soft, color: variant.palette.icon }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium leading-snug text-slate-700">{text}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  {variant.detail}
                </p>

                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/75 px-3 py-2.5 ring-1 ring-slate-900/5">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: variant.palette.soft }}
                  >
                    <img
                      src="/logo3d.png"
                      alt="DomineAqui"
                      className="h-9 w-9 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: variant.palette.icon }}>
                      DomineAqui
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-800">
                      Apoie para manter aberto
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="/doar"
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    style={{ background: variant.palette.accent }}
                    onMouseEnter={event => { event.currentTarget.style.background = variant.palette.accentHover }}
                    onMouseLeave={event => { event.currentTarget.style.background = variant.palette.accent }}
                  >
                    <span>{variant.primary}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={openDonationFlow}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    Já fiz Pix
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-3 h-11 w-full rounded-2xl text-sm font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                >
                  Agora não, continuar
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <DoacaoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          onClose()
        }}
      />

      <style jsx global>{`
        @keyframes doacaoSoftFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes doacaoSoftEnter {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .doacao-interstitial-panel {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}

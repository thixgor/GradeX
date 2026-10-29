'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle, ArrowLeft, ArrowRight, Award, BadgeCheck, Building2, Check, Fingerprint, GraduationCap,
  Loader2, Lock, MapPin, ShieldCheck, Sparkles, Stethoscope, Trophy, UserRound, Volume2, VolumeX,
} from 'lucide-react'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useSomDaJornada } from '@/components/jornada/use-som-da-jornada'
import { FALAS, type IdDaFala } from '@/lib/jornada/narracao'
import { BRAZIL_STATES } from '@/lib/brazil-states'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { onlyCrmDigits, isValidCrmNumber } from '@/lib/crm'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { MEDICAL_SPECIALTIES, RESIDENCY_AREAS } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState, OTHER_SCHOOL_OPTION } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState, OTHER_HOSPITAL_OPTION } from '@/lib/residency-hospitals-brazil'
import '@/components/checkout/checkout-vidro.css'
import '@/components/marca/logo-animada.css'
import '@/components/jornada/jornada.css'

/**
 * A jornada de perfil — o "monte seu personagem" do DomineAqui.
 *
 * Os dados que faltam no perfil (profissão, estado, WhatsApp, faculdade,
 * especialidade, CRM, CPF) eram pedidos num formulário de modal comum, e o
 * formulário comum é a tela que mais se fecha. Aqui o mesmo pedido virou um
 * jogo curto, sem mudar uma vírgula do que é gravado nem de como:
 *
 * - **progresso dado de presente:** a trilha já abre com a primeira fase feita
 *   ("Conta criada") e 20 XP na barra. Começar do zero desanima; começar com
 *   algo andado puxa até o fim (endowed progress);
 * - **gradiente da meta:** cada campo certo enche um pouco a barra, e cada
 *   passo salvo solta "+XP", um "plim" e uma conquista — a recompensa chega na
 *   hora do esforço, não no fim;
 * - **o que falta, à vista:** a abertura mostra as medalhas ainda trancadas
 *   (Zeigarnik: o incompleto incomoda e chama);
 * - **pico e fim:** o último passo termina num troféu com confete, a logo
 *   girando e a lista do que a pessoa conquistou — é dessa tela que ela lembra;
 * - **a primeira escolha é a mais fácil:** profissão em três cartas grandes,
 *   um toque e a jornada já anda sozinha (compromisso pequeno primeiro).
 *
 * A logo animada é a narradora: fala por um balão (legenda sempre visível) e,
 * quando os áudios do ElevenLabs estão no ar, pela voz — com música de fundo
 * baixinha e um botão de som sempre à mão (`use-som-da-jornada.ts`). Enquanto
 * salva, a moeda gira ("estou trabalhando"), como no Pix do checkout.
 *
 * Nada de recompensa inventada: o XP é a medida do próprio perfil (0–100), e as
 * conquistas são os passos que a pessoa de fato completou.
 */

type Profession = 'medico' | 'academico' | 'residente'

export interface CompleteProfileValues {
  profession?: Profession | ''
  state?: string
  phone?: string
  afyaUnit?: string
  periodo?: string
  specialty?: string
  crm?: string
  crmUf?: string
  residencySpecialty?: string
  residencyHospital?: string
  residencyYear?: string
  fullName?: string
  cpf?: string
}

interface SaveResult {
  ok: boolean
  /** Campo que falhou, para destacar o input certo. */
  field?: string
  error?: string
  officialName?: string
  /** O nome da conta não bate com o CPF: pedir o nome completo. */
  needsFullName?: boolean
}

interface CompleteProfileModalProps {
  open: boolean
  /** Dados já salvos, para o modal abrir preenchido. */
  initialValues?: CompleteProfileValues
  /** Chaves que ainda faltam (vêm de `getMissingProfileFields`). */
  missingFields: string[]
  /** Grava um passo. `finish` marca o perfil como concluído. */
  onSave: (values: CompleteProfileValues, finish: boolean) => Promise<SaveResult>
  /** "Agora não" — adia o modal. Ausente = modal obrigatório. */
  onSnooze?: () => void
  /** Chamado depois da tela de sucesso. */
  onDone: () => void
}

const PROFESSION_CARDS: { value: Profession; label: string; hint: string; Icon: typeof GraduationCap; cor: string }[] = [
  { value: 'academico', label: 'Estudante', hint: 'Curso a graduação', Icon: GraduationCap, cor: '#3f9a5c' },
  { value: 'residente', label: 'Residente', hint: 'Estou na residência', Icon: Stethoscope, cor: '#5b6cf0' },
  { value: 'medico', label: 'Médico(a)', hint: 'Já sou formado(a)', Icon: BadgeCheck, cor: '#e0782f' },
]

type StepId = 'profession' | 'location' | 'context' | 'identity'

/** Campos específicos da profissão — se algum falta, o passo "context" entra. */
const CONTEXT_FIELDS = [
  'specialty', 'crm', 'residencySpecialty', 'residencyHospital', 'residencyYear',
  'afyaUnit', 'periodo',
]

/**
 * Monta a trilha de passos a partir do que realmente falta. Quem já respondeu
 * quase tudo e só deve o CPF vê um único passo — reperguntar o que a pessoa já
 * respondeu é a forma mais rápida de fazer ela fechar o modal.
 */
function buildSteps(missingFields: string[]): StepId[] {
  const missing = new Set(missingFields)
  const steps: StepId[] = []

  if (missing.has('profession')) steps.push('profession')
  if (missing.has('phone') || missing.has('state')) steps.push('location')
  // Sem profissão definida ainda não dá pra saber quais campos específicos
  // faltam, então o passo entra por precaução e é preenchido no caminho.
  if (missing.has('profession') || CONTEXT_FIELDS.some((field) => missing.has(field))) {
    steps.push('context')
  }
  if (missing.has('cpf')) steps.push('identity')

  return steps.length > 0 ? steps : ['identity']
}

const ICONE_DO_PASSO: Record<StepId, typeof GraduationCap> = {
  profession: UserRound,
  location: MapPin,
  context: Building2,
  identity: Fingerprint,
}

const STEP_TITLES: Record<StepId, { title: string; subtitle: string }> = {
  profession: {
    title: 'Você é estudante, residente ou médico?',
    subtitle: 'Um toque e o conteúdo passa a ser o seu.',
  },
  location: {
    title: 'Onde a gente te encontra?',
    subtitle: 'Leva 10 segundos.',
  },
  context: {
    title: 'Conta mais sobre você',
    subtitle: 'Últimos detalhes do seu perfil acadêmico.',
  },
  identity: {
    title: 'Falta só o seu CPF',
    subtitle: 'É exigência do cadastro da plataforma. Um campo e acabou.',
  },
}

/** XP que a conta criada já vale: a primeira fase vem feita. */
const XP_DE_PRESENTE = 20
const XP_TOTAL = 100

interface Conquista {
  titulo: string
  texto: string
  Icone: typeof GraduationCap
}

function falaDoPasso(step: StepId, profession: string): IdDaFala {
  if (step === 'profession') return 'profissao'
  if (step === 'location') return 'local'
  if (step === 'identity') return 'cpf'
  if (profession === 'medico') return 'contexto-medico'
  if (profession === 'residente') return 'contexto-residente'
  return 'contexto-estudante'
}

function conquistaDoPasso(step: StepId, v: CompleteProfileValues): Conquista {
  if (step === 'profession') {
    const carta = PROFESSION_CARDS.find((c) => c.value === v.profession)
    return { titulo: carta?.label || 'Identidade', texto: 'Seu caminho está escolhido', Icone: carta?.Icon || UserRound }
  }
  if (step === 'location') {
    const estado = BRAZIL_STATES.find((s) => s.uf === v.state)
    return { titulo: 'No mapa', texto: estado ? `${estado.name} no radar` : 'Localização definida', Icone: MapPin }
  }
  if (step === 'context') {
    if (v.profession === 'medico') return { titulo: 'Especialista', texto: v.specialty || 'Especialidade definida', Icone: Award }
    if (v.profession === 'residente') {
      return { titulo: 'Plantonista', texto: [v.residencyYear, v.residencySpecialty].filter(Boolean).join(' · ') || 'Residência definida', Icone: Stethoscope }
    }
    return {
      titulo: 'Na turma certa',
      texto: v.periodo ? formatPeriodoLabel(Number(v.periodo)) : 'Faculdade definida',
      Icone: GraduationCap,
    }
  }
  return { titulo: 'Verificado(a)', texto: 'Identidade confirmada', Icone: ShieldCheck }
}

export function CompleteProfileModal({
  open,
  initialValues,
  missingFields,
  onSave,
  onSnooze,
  onDone,
}: CompleteProfileModalProps) {
  const [values, setValues] = useState<CompleteProfileValues>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [officialName, setOfficialName] = useState('')
  // Só entra em cena quando a Receita diz que o nome da conta não é o do
  // titular do CPF — aí o campo de nome completo aparece.
  const [needsFullName, setNeedsFullName] = useState(false)

  const [abertura, setAbertura] = useState(false)
  const [direcao, setDirecao] = useState(1)
  const [conquistas, setConquistas] = useState<Conquista[]>([])
  const [toast, setToast] = useState<Conquista | null>(null)
  const [ganho, setGanho] = useState<{ chave: number; xp: number } | null>(null)
  const [tremendo, setTremendo] = useState(false)
  const avancando = useRef(false)
  const calmo = useReducedMotion()
  const som = useSomDaJornada(open)

  // A trilha é fechada quando o modal abre e não muda no meio do caminho — a
  // barra de progresso andando para trás porque o usuário trocou de profissão
  // é pior do que um passo a mais.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const steps = useMemo(() => buildSteps(missingFields), [open])
  const currentStep = steps[stepIndex] ?? 'identity'
  const totalSteps = steps.length
  const isDone = stepIndex >= totalSteps
  const profession = values.profession || ''

  useEffect(() => {
    if (!open) return
    setValues({ ...initialValues })
    setStepIndex(0)
    setError('')
    setErrorField('')
    setConquistas([])
    setToast(null)
    // A abertura com as medalhas só faz sentido para quem tem a jornada inteira
    // pela frente; quem deve só o CPF vai direto ao campo.
    setAbertura(steps.length >= 2 && steps[0] === 'profession')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Trava o scroll do fundo enquanto o modal está aberto — sem isso, no mobile
  // o dedo arrasta a página atrás em vez do conteúdo do modal.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // A narradora fala a cada tela nova.
  const { falar } = som
  useEffect(() => {
    if (!open) return
    if (abertura) falar('boas-vindas')
    else if (isDone) falar('conclusao')
    else falar(falaDoPasso(currentStep, profession))
    // A profissão muda a fala do passo "context", mas só quando se chega nele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, abertura, isDone, currentStep])

  const institutionOptions = useMemo(() => getMedicalSchoolsByState(values.state), [values.state])
  const hospitalOptions = useMemo(() => getResidencyHospitalsByState(values.state), [values.state])

  function update(patch: CompleteProfileValues) {
    setValues((prev) => ({ ...prev, ...patch }))
    setError('')
    setErrorField('')
  }

  /** Quais campos do passo já estão certos — enche a barra aos poucos. */
  function camposDoPasso(v: CompleteProfileValues): boolean[] {
    if (currentStep === 'profession') return [!!v.profession]
    if (currentStep === 'location') return [!!v.state, isValidBrazilPhone(v.phone || '')]
    if (currentStep === 'context') {
      if (v.profession === 'academico') return [!!v.afyaUnit, !!v.periodo]
      if (v.profession === 'medico') return [!!v.specialty, isValidCrmNumber(v.crm || '')]
      return [!!v.residencySpecialty, !!v.residencyYear, !!v.residencyHospital, isValidCrmNumber(v.crm || '')]
    }
    const lista = [isValidCpf(v.cpf || '')]
    if (needsFullName) lista.push((v.fullName || '').trim().split(/\s+/).filter(Boolean).length >= 2)
    return lista
  }

  /** Valida o passo atual no cliente. Retorna a mensagem, ou null se estiver ok. */
  function validateStep(v: CompleteProfileValues): { message: string; field: string } | null {
    const prof = v.profession || ''
    if (currentStep === 'profession' && !prof) {
      return { message: 'Escolha uma das opções para continuar.', field: 'profession' }
    }

    if (currentStep === 'location') {
      if (!v.state) return { message: 'Selecione seu estado.', field: 'state' }
      if (!isValidBrazilPhone(v.phone || '')) {
        return { message: 'Digite seu telefone com DDD.', field: 'phone' }
      }
    }

    if (currentStep === 'context') {
      if (prof === 'academico') {
        if (!v.afyaUnit) return { message: 'Selecione sua faculdade.', field: 'afyaUnit' }
        if (!v.periodo) return { message: 'Selecione seu período.', field: 'periodo' }
      }
      if (prof === 'medico') {
        if (!v.specialty) return { message: 'Selecione sua especialidade.', field: 'specialty' }
        if (!isValidCrmNumber(v.crm || '')) {
          return { message: 'Digite seu CRM (4 a 7 dígitos).', field: 'crm' }
        }
      }
      if (prof === 'residente') {
        if (!v.residencySpecialty) {
          return { message: 'Selecione a área da sua residência.', field: 'residencySpecialty' }
        }
        if (!v.residencyYear) {
          return { message: 'Selecione o ano da residência.', field: 'residencyYear' }
        }
        if (!v.residencyHospital) {
          return { message: 'Selecione o hospital da residência.', field: 'residencyHospital' }
        }
        if (!isValidCrmNumber(v.crm || '')) {
          return { message: 'Digite seu CRM (4 a 7 dígitos).', field: 'crm' }
        }
      }
    }

    if (currentStep === 'identity') {
      if (!isValidCpf(v.cpf || '')) {
        return { message: 'CPF inválido. Confira os números.', field: 'cpf' }
      }
      // O nome completo só é exigido depois que o servidor avisa que o nome da
      // conta não bate com o titular do CPF (ver `needsFullName`).
      if (needsFullName) {
        const nameWords = (v.fullName || '').trim().split(/\s+/).filter(Boolean)
        if (nameWords.length < 2) {
          return { message: 'Digite seu nome completo, como está no CPF.', field: 'fullName' }
        }
      }
    }

    return null
  }

  /** Só o que este passo coleta — o servidor grava incrementalmente. */
  function stepPayload(v: CompleteProfileValues): CompleteProfileValues {
    const prof = v.profession || ''
    if (currentStep === 'profession') return { profession: prof }
    if (currentStep === 'location') return { state: v.state, phone: v.phone }
    if (currentStep === 'context') {
      if (prof === 'academico') return { afyaUnit: v.afyaUnit, periodo: v.periodo }
      if (prof === 'medico') {
        return { specialty: v.specialty, crm: v.crm, crmUf: v.crmUf || v.state }
      }
      return {
        residencySpecialty: v.residencySpecialty,
        residencyYear: v.residencyYear,
        residencyHospital: v.residencyHospital,
        crm: v.crm,
        crmUf: v.crmUf || v.state,
      }
    }
    return {
      cpf: onlyCpfDigits(v.cpf || ''),
      ...(needsFullName ? { fullName: v.fullName } : {}),
    }
  }

  function falhar(mensagem: string, campo: string) {
    setError(mensagem)
    setErrorField(campo)
    setTremendo(true)
    window.setTimeout(() => setTremendo(false), 450)
  }

  async function handleNext(override?: CompleteProfileValues) {
    if (avancando.current) return
    const v = override ? { ...values, ...override } : values
    const invalid = validateStep(v)
    if (invalid) {
      falhar(invalid.message, invalid.field)
      return
    }

    avancando.current = true
    setSaving(true)
    setError('')
    setErrorField('')
    const lastStep = stepIndex === totalSteps - 1
    const result = await onSave(stepPayload(v), lastStep)
    setSaving(false)
    avancando.current = false

    if (!result.ok) {
      falhar(result.error || 'Não conseguimos salvar. Tente de novo.', result.field || '')
      if (result.needsFullName) setNeedsFullName(true)
      return
    }

    if (result.officialName) setOfficialName(result.officialName)

    const conquista = conquistaDoPasso(currentStep, v)
    setConquistas((lista) => [...lista, conquista])
    setGanho({ chave: Date.now(), xp: Math.round((XP_TOTAL - XP_DE_PRESENTE) / totalSteps) })
    if (!lastStep) {
      setToast(conquista)
      som.efeito('conquista')
    } else {
      som.efeito('fim')
    }
    setDirecao(1)
    setStepIndex((index) => index + 1)
  }

  // A conquista some sozinha depois de comemorada.
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  function handleBack() {
    setError('')
    setErrorField('')
    setDirecao(-1)
    setStepIndex((index) => Math.max(0, index - 1))
  }

  /**
   * Primeiro toque da pessoa: o navegador libera o áudio. Se ela ainda está na
   * abertura, a boas-vindas toca agora — e, como é fala protegida, a pergunta
   * da profissão espera ela terminar em vez de cortá-la.
   */
  function destravarSom() {
    if (som.destravar() && abertura) som.falar('boas-vindas')
  }

  function escolherProfissao(valor: Profession) {
    som.destravar()
    update({ profession: valor })
    som.efeito('ponto')
    const reacao: IdDaFala = valor === 'medico' ? 'reacao-medico' : valor === 'residente' ? 'reacao-residente' : 'reacao-estudante'
    som.falar(reacao)
    // Um toque basta: a carta comemora e a jornada anda sozinha. Quem errou
    // a carta volta pela seta — e a escolha ainda pode ser trocada lá.
    window.setTimeout(() => handleNext({ profession: valor }), calmo ? 250 : 900)
  }

  // XP: o que a conta já vale + passos salvos + metade do passo em andamento,
  // campo a campo. Salvar o passo credita a outra metade de uma vez.
  const porPasso = (XP_TOTAL - XP_DE_PRESENTE) / totalSteps
  const campos = isDone ? [] : camposDoPasso(values)
  const parcial = campos.length ? (campos.filter(Boolean).length / campos.length) * porPasso * 0.5 : 0
  const xp = isDone ? XP_TOTAL : Math.min(XP_TOTAL, XP_DE_PRESENTE + porPasso * stepIndex + parcial)

  if (!open) return null

  const campoInvalido = (field: string) => (errorField === field ? true : undefined)
  const temPassos = !abertura && !isDone

  return (
    <div
      className="jd-palco ck-escopo"
      onPointerDownCapture={destravarSom}
      onKeyDownCapture={destravarSom}
    >
      <motion.div
        className="jd-veu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      />
      <span className="jd-luz jd-luz-a" aria-hidden />
      <span className="jd-luz jd-luz-b" aria-hidden />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="jornada-titulo"
        className={`jd-cartao ${tremendo ? 'jd-treme' : ''}`}
        initial={calmo ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <div className="jd-alca" aria-hidden />

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.titulo}
              className="jd-conquista"
              role="status"
              initial={{ opacity: 0, y: -30, x: '-50%', scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            >
              <span className="jd-conquista-selo"><toast.Icone /></span>
              <span className="min-w-0">
                <small>Conquista desbloqueada</small>
                <b>{toast.titulo}</b>
                <span>{toast.texto}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ Topo: narradora + trilha + XP ══════════ */}
        {temPassos && (
          <header className="jd-topo">
            <div className="jd-narradora">
              <LogoAnimada
                tamanho="compacto"
                nome={false}
                inclinacao="local"
                modo={saving ? 'gerando' : 'normal'}
              />
              <Balao id={som.legenda} falando={som.falando === som.legenda && !!som.falando} calmo={!!calmo} progressoDaVoz={som.progressoDaVoz} />
              <BotaoDeSom ligado={som.ligado} alternar={som.alternar} />
            </div>

            <Trilha steps={steps} stepIndex={stepIndex} />

            <div className="jd-xp">
              <div
                className="jd-xp-barra"
                role="progressbar"
                aria-label="Perfil completo"
                aria-valuemin={0}
                aria-valuemax={XP_TOTAL}
                aria-valuenow={Math.round(xp)}
              >
                <i style={{ transform: `scaleX(${xp / XP_TOTAL})` }} />
              </div>
              <span className="jd-xp-numero">
                <Contador valor={xp} /> <b>/ {XP_TOTAL} XP</b>
              </span>
              {ganho && (
                <span key={ganho.chave} className="jd-ganho" aria-hidden>
                  +{ganho.xp} XP
                </span>
              )}
            </div>
          </header>
        )}

        {/* ══════════ Corpo ══════════ */}
        <div className="jd-corpo">
          <AnimatePresence mode="wait" custom={direcao} initial={false}>
            {abertura ? (
              <Tela key="abertura" direcao={direcao} calmo={!!calmo}>
                <Abertura
                  legenda={FALAS['boas-vindas'].legenda}
                  ligado={som.ligado}
                  alternar={som.alternar}
                  falando={som.falando === 'boas-vindas'}
                />
              </Tela>
            ) : isDone ? (
              <Tela key="fim" direcao={1} calmo={!!calmo}>
                <Fim officialName={officialName} conquistas={conquistas} calmo={!!calmo} />
              </Tela>
            ) : (
              <Tela key={currentStep} direcao={direcao} calmo={!!calmo}>
                <h2 id="jornada-titulo" className="jd-titulo">{STEP_TITLES[currentStep].title}</h2>
                <p className="jd-apoio">{STEP_TITLES[currentStep].subtitle}</p>

                {currentStep === 'profession' && (
                  <div className="jd-papeis" role="group" aria-label="Sua profissão">
                    {PROFESSION_CARDS.map(({ value, label, hint, Icon, cor }) => {
                      const selected = profession === value
                      return (
                        <button
                          key={value}
                          type="button"
                          className="jd-papel min-h-[48px]"
                          style={{ '--cor': cor } as React.CSSProperties}
                          aria-pressed={selected}
                          disabled={saving}
                          onClick={() => escolherProfissao(value)}
                        >
                          <span className="jd-papel-icone">
                            <Icon />
                            {selected && <Faiscas />}
                          </span>
                          <span className="min-w-0">
                            <span className="jd-papel-nome">{label}</span>
                            <span className="jd-papel-dica">{hint}</span>
                          </span>
                          {selected && (
                            <span className="jd-papel-marca" aria-hidden>
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentStep !== 'profession' && (
                  <form
                    className="jd-campos"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!saving) handleNext()
                    }}
                  >
                    {currentStep === 'location' && (
                      <>
                        <Campo rotulo="Seu estado" htmlFor="state" ok={!!values.state} select>
                          <select
                            id="state"
                            className="ck-campo"
                            aria-invalid={campoInvalido('state')}
                            value={values.state || ''}
                            onChange={(event) => {
                              update({
                                state: event.target.value,
                                // A instituição e o hospital dependem do estado.
                                afyaUnit: '',
                                residencyHospital: '',
                              })
                              if (event.target.value) som.efeito('toque')
                            }}
                            disabled={saving}
                          >
                            <option value="">Selecione...</option>
                            {BRAZIL_STATES.map((state) => (
                              <option key={state.uf} value={state.uf}>
                                {state.name} ({state.uf})
                              </option>
                            ))}
                          </select>
                        </Campo>

                        <Campo
                          rotulo="Seu WhatsApp"
                          htmlFor="phone"
                          dica="É por aqui que avisamos sobre material novo e sua turma."
                          ok={isValidBrazilPhone(values.phone || '')}
                        >
                          <input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="(11) 91234-5678"
                            className="ck-campo"
                            aria-invalid={campoInvalido('phone')}
                            value={values.phone || ''}
                            onChange={(event) => update({ phone: formatBrazilPhone(event.target.value) })}
                            disabled={saving}
                          />
                        </Campo>
                      </>
                    )}

                    {currentStep === 'context' && profession === 'academico' && (
                      <>
                        <Campo rotulo="Sua faculdade" htmlFor="afyaUnit" ok={!!values.afyaUnit} select>
                          <SearchableSelect
                            id="afyaUnit"
                            value={values.afyaUnit || ''}
                            onChange={(value) => { update({ afyaUnit: value }); som.efeito('toque') }}
                            options={institutionOptions}
                            placeholder="Buscar sua faculdade..."
                            searchPlaceholder="Digite o nome ou a sigla"
                            customOption={OTHER_SCHOOL_OPTION}
                            customPlaceholder="Digite o nome da sua faculdade"
                            className={`ck-campo ${errorField === 'afyaUnit' ? 'jd-erro-campo' : ''}`}
                            disabled={saving}
                          />
                        </Campo>

                        <Campo rotulo="Seu período" htmlFor="periodo" ok={!!values.periodo} select>
                          <select
                            id="periodo"
                            className="ck-campo"
                            aria-invalid={campoInvalido('periodo')}
                            value={values.periodo || ''}
                            onChange={(event) => { update({ periodo: event.target.value }); som.efeito('toque') }}
                            disabled={saving}
                          >
                            <option value="">Selecione...</option>
                            {PERIODO_OPTIONS.map((periodo) => (
                              <option key={periodo} value={periodo}>
                                {formatPeriodoLabel(periodo)}
                              </option>
                            ))}
                          </select>
                        </Campo>
                      </>
                    )}

                    {currentStep === 'context' && profession === 'medico' && (
                      <>
                        <Campo rotulo="Sua especialidade" htmlFor="specialty" ok={!!values.specialty} select>
                          <SearchableSelect
                            id="specialty"
                            value={values.specialty || ''}
                            onChange={(value) => { update({ specialty: value }); som.efeito('toque') }}
                            options={MEDICAL_SPECIALTIES}
                            placeholder="Buscar especialidade..."
                            searchPlaceholder="Digite a especialidade"
                            className={`ck-campo ${errorField === 'specialty' ? 'jd-erro-campo' : ''}`}
                            disabled={saving}
                          />
                        </Campo>
                        <CamposDoCrm values={values} update={update} saving={saving} campoInvalido={campoInvalido} />
                      </>
                    )}

                    {currentStep === 'context' && profession === 'residente' && (
                      <>
                        <Campo rotulo="Área da residência" htmlFor="residencySpecialty" ok={!!values.residencySpecialty} select>
                          <SearchableSelect
                            id="residencySpecialty"
                            value={values.residencySpecialty || ''}
                            onChange={(value) => { update({ residencySpecialty: value }); som.efeito('toque') }}
                            options={RESIDENCY_AREAS}
                            placeholder="Buscar área..."
                            searchPlaceholder="Digite a área"
                            className={`ck-campo ${errorField === 'residencySpecialty' ? 'jd-erro-campo' : ''}`}
                            disabled={saving}
                          />
                        </Campo>

                        <div>
                          <p className="ck-rotulo">Ano da residência</p>
                          <div className="jd-anos" role="group" aria-label="Ano da residência">
                            {RESIDENCY_YEARS.map((year) => (
                              <button
                                key={year}
                                type="button"
                                className="jd-ano min-h-[44px]"
                                aria-pressed={values.residencyYear === year}
                                onClick={() => { update({ residencyYear: year }); som.efeito('toque') }}
                                disabled={saving}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Campo rotulo="Hospital da residência" htmlFor="residencyHospital" ok={!!values.residencyHospital} select>
                          <SearchableSelect
                            id="residencyHospital"
                            value={values.residencyHospital || ''}
                            onChange={(value) => { update({ residencyHospital: value }); som.efeito('toque') }}
                            options={hospitalOptions}
                            placeholder="Buscar hospital..."
                            searchPlaceholder="Digite o nome do hospital"
                            customOption={OTHER_HOSPITAL_OPTION}
                            customPlaceholder="Digite o nome do hospital"
                            className={`ck-campo ${errorField === 'residencyHospital' ? 'jd-erro-campo' : ''}`}
                            disabled={saving}
                          />
                        </Campo>

                        <CamposDoCrm values={values} update={update} saving={saving} campoInvalido={campoInvalido} />
                      </>
                    )}

                    {currentStep === 'identity' && (
                      <>
                        <Campo rotulo="Seu CPF" htmlFor="cpf" ok={isValidCpf(values.cpf || '')}>
                          <input
                            id="cpf"
                            type="text"
                            inputMode="numeric"
                            autoFocus
                            placeholder="000.000.000-00"
                            className="ck-campo ck-mono"
                            aria-invalid={campoInvalido('cpf')}
                            value={values.cpf || ''}
                            onChange={(event) => update({ cpf: formatCpf(event.target.value) })}
                            disabled={saving}
                          />
                        </Campo>

                        {needsFullName && (
                          <Campo
                            rotulo="Nome completo"
                            htmlFor="fullName"
                            dica="Escreva igual ao que está no seu CPF."
                            ok={(values.fullName || '').trim().split(/\s+/).filter(Boolean).length >= 2}
                          >
                            <input
                              id="fullName"
                              type="text"
                              autoComplete="name"
                              autoFocus
                              placeholder="Maria Aparecida de Souza"
                              className="ck-campo"
                              aria-invalid={campoInvalido('fullName')}
                              value={values.fullName || ''}
                              onChange={(event) => update({ fullName: event.target.value })}
                              disabled={saving}
                            />
                          </Campo>
                        )}

                        {/* Escondido quando o nome é pedido: aí o espaço é do erro,
                            que precisa ficar colado no campo que falhou. */}
                        {!needsFullName && (
                          <p className="jd-selo-seguro">
                            <ShieldCheck className="h-4 w-4" />
                            Conferimos na Receita Federal só para confirmar que é você. Seu CPF fica com a
                            gente e não aparece para outros usuários.
                          </p>
                        )}
                      </>
                    )}

                    {/* Submit escondido: dá Enter no teclado do celular. */}
                    <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
                  </form>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      role="alert"
                      className="ck-erro mt-4"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Tela>
            )}
          </AnimatePresence>
        </div>

        {/* ══════════ Rodapé ══════════ */}
        {abertura ? (
          <footer className="jd-rodape">
            <button
              type="button"
              className="ck-cta min-h-[48px]"
              onClick={() => {
                som.destravar()
                som.efeito('ponto')
                setDirecao(1)
                setAbertura(false)
              }}
            >
              Começar · leva 1 minuto
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        ) : isDone ? (
          <footer className="jd-rodape">
            <button type="button" className="ck-cta min-h-[48px]" onClick={onDone}>
              Começar a estudar
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        ) : (
          <footer className="jd-rodape">
            {stepIndex > 0 && (
              <button type="button" className="jd-voltar min-h-[48px]" onClick={handleBack} disabled={saving} aria-label="Voltar">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {currentStep !== 'profession' || profession ? (
              <button type="button" className="ck-cta min-h-[48px]" onClick={() => handleNext()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : stepIndex === totalSteps - 1 ? (
                  <>
                    Concluir e pegar o troféu
                    <Trophy className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <p className="flex-1 py-3 text-center text-[13px]" style={{ color: 'var(--ck-texto-3)' }}>
                Toque numa carta para começar
              </p>
            )}
          </footer>
        )}

        {onSnooze && !isDone && (
          <p className="jd-adiar">
            <button type="button" onClick={onSnooze} disabled={saving}>
              Agora não
            </button>
            {stepIndex > 0 && ' · seu progresso fica salvo'}
          </p>
        )}
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════ Peças ══════════════════════════════ */

/** Cada tela entra deslizando do lado para onde a pessoa está indo. */
function Tela({ children, direcao, calmo }: { children: React.ReactNode; direcao: number; calmo: boolean }) {
  return (
    <motion.div
      initial={calmo ? { opacity: 0 } : { opacity: 0, x: 40 * direcao, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={calmo ? { opacity: 0 } : { opacity: 0, x: -40 * direcao, filter: 'blur(6px)' }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/**
 * O balão da narradora: escreve a fala letra a letra (como quem digita), e a
 * ondinha aparece só enquanto a voz toca de verdade.
 */
function Balao({
  id,
  falando,
  calmo,
  progressoDaVoz,
}: {
  id: IdDaFala | null
  falando: boolean
  calmo: boolean
  progressoDaVoz: () => number | null
}) {
  const texto = id ? FALAS[id].legenda : ''
  const [mostrado, setMostrado] = useState(calmo ? texto.length : 0)

  // Com voz, o texto acompanha o áudio (onde a fala está, tanto do texto
  // aparece — com uma folga de 6%, para a palavra surgir junto do som e não
  // depois). Sem voz, ritmo de digitação: 24 ms por letra.
  useEffect(() => {
    if (calmo) {
      setMostrado(texto.length)
      return
    }
    setMostrado(0)
    let quadro = 0
    const inicio = performance.now()
    const passo = (agora: number) => {
      const naVoz = progressoDaVoz()
      const n = naVoz !== null
        ? Math.min(texto.length, Math.ceil(texto.length * Math.min(1, naVoz * 1.06)))
        : Math.min(texto.length, Math.floor((agora - inicio) / 24))
      setMostrado((anterior) => Math.max(anterior, n))
      if (n < texto.length) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [texto, calmo, progressoDaVoz])

  return (
    <p className="jd-balao" aria-live="polite">
      {/* O texto inteiro para leitores de tela; o "digitando" é só visual. */}
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {texto.slice(0, mostrado)}
        {mostrado < texto.length && <span className="jd-cursor" />}
        {falando && (
          <span className="jd-onda">
            <i /><i /><i />
          </span>
        )}
      </span>
    </p>
  )
}

function BotaoDeSom({ ligado, alternar }: { ligado: boolean; alternar: () => void }) {
  return (
    <button
      type="button"
      className="jd-som min-h-[38px]"
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={ligado ? 'Desligar voz e música' : 'Ligar voz e música'}
      title={ligado ? 'Som ligado' : 'Som desligado'}
    >
      {ligado ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  )
}

/** Fases: "Conta criada" (feita de presente), os passos, e o troféu. */
function Trilha({ steps, stepIndex }: { steps: StepId[]; stepIndex: number }) {
  return (
    <ol className="jd-trilha" aria-label={`Passo ${stepIndex + 1} de ${steps.length}`}>
      <li className="jd-fase" data-estado="feita" title="Conta criada">
        <Check strokeWidth={3} />
      </li>
      {steps.map((step, i) => {
        const Icone = ICONE_DO_PASSO[step]
        const estado = i < stepIndex ? 'feita' : i === stepIndex ? 'atual' : 'futura'
        return (
          <li key={step} className="contents">
            <span className="jd-elo" aria-hidden>
              <i style={{ transform: `scaleX(${i <= stepIndex ? 1 : 0})` }} />
            </span>
            <span className="jd-fase" data-estado={estado} aria-current={estado === 'atual' ? 'step' : undefined}>
              {estado === 'feita' ? <Check strokeWidth={3} /> : <Icone />}
            </span>
          </li>
        )
      })}
      <li className="contents">
        <span className="jd-elo" aria-hidden>
          <i style={{ transform: `scaleX(${stepIndex >= steps.length ? 1 : 0})` }} />
        </span>
        <span className="jd-fase jd-fase-premio" data-estado={stepIndex >= steps.length ? 'feita' : 'futura'} title="Troféu">
          <Trophy />
        </span>
      </li>
    </ol>
  )
}

/** Número que corre até o valor novo, em vez de pular. */
function Contador({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const anterior = useRef(valor)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const controle = animate(anterior.current, valor, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = String(Math.round(v)) },
    })
    anterior.current = valor
    return () => controle.stop()
  }, [valor])
  return <span ref={ref}>{Math.round(valor)}</span>
}

function Faiscas() {
  return (
    <span className="jd-faiscas" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} style={{ '--a': `${i * 30}deg`, '--d': `${44 + (i % 3) * 12}px` } as React.CSSProperties} />
      ))}
    </span>
  )
}

function Campo({
  rotulo,
  htmlFor,
  dica,
  ok,
  select,
  children,
}: {
  rotulo: string
  htmlFor: string
  dica?: string
  ok?: boolean
  select?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="jd-campo">
      <label htmlFor={htmlFor} className="ck-rotulo">{rotulo}</label>
      {children}
      {ok && (
        <span className="jd-campo-ok" data-select={select ? '' : undefined} aria-hidden>
          <Check className="h-3 w-3" strokeWidth={3.5} />
        </span>
      )}
      {dica && <p className="ck-ajuda mt-1.5">{dica}</p>}
    </div>
  )
}

/** CRM + UF — o mesmo par serve para médico e residente. */
function CamposDoCrm({
  values,
  update,
  saving,
  campoInvalido,
}: {
  values: CompleteProfileValues
  update: (patch: CompleteProfileValues) => void
  saving: boolean
  campoInvalido: (field: string) => true | undefined
}) {
  return (
    <div className="grid grid-cols-[1fr_6.5rem] gap-3">
      <Campo rotulo="Seu CRM" htmlFor="crm" ok={isValidCrmNumber(values.crm || '')}>
        <input
          id="crm"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          className="ck-campo ck-mono"
          aria-invalid={campoInvalido('crm')}
          value={values.crm || ''}
          onChange={(event) => update({ crm: onlyCrmDigits(event.target.value) })}
          disabled={saving}
        />
      </Campo>
      <div>
        <label htmlFor="crmUf" className="ck-rotulo">UF</label>
        <select
          id="crmUf"
          className="ck-campo"
          aria-invalid={campoInvalido('crmUf')}
          value={values.crmUf || values.state || ''}
          onChange={(event) => update({ crmUf: event.target.value })}
          disabled={saving}
        >
          {BRAZIL_STATES.map((state) => (
            <option key={state.uf} value={state.uf}>
              {state.uf}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

/**
 * A abertura: a logo se monta em tamanho grande, a narradora dá oi, e as
 * medalhas trancadas mostram o que a jornada rende.
 */
function Abertura({
  legenda,
  ligado,
  alternar,
  falando,
}: {
  legenda: string
  ligado: boolean
  alternar: () => void
  falando: boolean
}) {
  const medalhas = [UserRound, MapPin, Building2, Fingerprint, Trophy]
  return (
    <div className="jd-abertura">
      <LogoAnimada tamanho="heroi" nome={false} inclinacao="local" />
      <h2 id="jornada-titulo" className="jd-titulo">Vamos montar o seu DomineAqui.</h2>
      <p className="jd-apoio">{legenda}</p>
      <div className="jd-medalhas" aria-label="Medalhas a conquistar">
        {medalhas.map((Icone, i) => (
          <span key={i} className="jd-medalha" style={{ '--atraso': `${i * 0.25}s` } as React.CSSProperties}>
            <Icone />
            <span className="jd-medalha-cadeado"><Lock /></span>
          </span>
        ))}
      </div>
      <p className="jd-xp-inicial">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        Você já começa com {XP_DE_PRESENTE} XP — a conta está criada.
      </p>
      <button type="button" className="ck-link-discreto inline-flex items-center gap-1.5" onClick={alternar} aria-pressed={ligado}>
        {ligado ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {ligado ? 'Com voz e música' : 'Sem som'}
        {falando && <span className="jd-onda"><i /><i /><i /></span>}
      </button>
    </div>
  )
}

const CORES_DO_CONFETE = ['#f0b23e', '#e8763a', '#4f9d63', '#5b6cf0', '#e05a8a', '#ffd978']

function Fim({ officialName, conquistas, calmo }: { officialName: string; conquistas: Conquista[]; calmo: boolean }) {
  // O confete é sorteado uma vez: re-render não pode refazer a chuva.
  const papeis = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        cor: CORES_DO_CONFETE[i % CORES_DO_CONFETE.length],
        x: `${Math.round((Math.random() - 0.5) * 520)}px`,
        sobe: `${-Math.round(80 + Math.random() * 140)}px`,
        g: `${Math.round((Math.random() - 0.5) * 1080)}deg`,
        atraso: `${(Math.random() * 0.35).toFixed(2)}s`,
        largura: 6 + Math.round(Math.random() * 5),
      })),
    [],
  )

  return (
    <div className="jd-fim">
      {!calmo && (
        <div className="jd-confete" aria-hidden>
          {papeis.map((p, i) => (
            <i
              key={i}
              style={{
                background: p.cor,
                width: p.largura,
                '--x': p.x,
                '--sobe': p.sobe,
                '--g': p.g,
                '--atraso': p.atraso,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <motion.div
        className="jd-trofeu"
        initial={calmo ? { opacity: 0 } : { scale: 0.3, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
      >
        <span className="jd-trofeu-raios" aria-hidden />
        <span className="jd-trofeu-brilho" aria-hidden />
        <span className="jd-trofeu-aro" aria-hidden />
        <LogoAnimada tamanho="compacto" nome={false} inclinacao="local" modo="gerando" />
        <span className="jd-trofeu-nivel">PERFIL 100%</span>
      </motion.div>

      <h2 id="jornada-titulo" className="jd-titulo mt-3">Perfil completo!</h2>
      <p className="jd-placar">
        <Contador valor={XP_TOTAL} /> <small>XP</small>
      </p>
      <p className="jd-apoio">
        {officialName
          ? `Confirmamos seus dados na Receita Federal, ${firstName(officialName)}. Agora é só estudar.`
          : 'Agora o DomineAqui fala a sua língua. Bora estudar?'}
      </p>

      {conquistas.length > 0 && (
        <div className="jd-conquistas">
          {conquistas.map((c, i) => (
            <motion.div
              key={`${c.titulo}-${i}`}
              className="jd-conquista-item"
              initial={calmo ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 300, damping: 22 }}
            >
              <span className="jd-conquista-selo"><c.Icone /></span>
              <span className="min-w-0">
                <b>{c.titulo}</b>
                <span>{c.texto}</span>
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || ''
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

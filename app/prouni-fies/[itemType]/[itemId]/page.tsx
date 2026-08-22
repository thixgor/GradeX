'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoLoading } from '@/components/logo-loading'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'

/**
 * Página exclusiva do produto para a condição PROUNI/FIES.
 *
 * É a mesma oferta vista por outro ângulo: em vez de "compre agora", ela
 * responde "como eu, bolsista, chego ao preço com desconto". Por isso mostra o
 * preço com o benefício já calculado ANTES de pedir qualquer documento —
 * ninguém deve digitar CPF e anexar comprovante para só então descobrir quanto
 * vai pagar.
 *
 * Os arquivos vão do navegador direto para o armazenamento privado; esta tela
 * só manda referências para a API. A validação daqui é conveniência (recusar
 * cedo o arquivo de 30 MB), nunca garantia: quem decide é o servidor.
 */

const TIPOS_VALIDOS = ['material', 'package', 'manual_clinico', 'plus'] as const
const MAX_ARQUIVOS = 3
const MAX_BYTES_ARQUIVO = 8 * 1024 * 1024
const MAX_BYTES_TOTAL = 16 * 1024 * 1024
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

interface Beneficio {
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountLabel: string
  stackWithTier: boolean
  instructions: string
}

interface Produto {
  itemType: string
  itemId: string
  title: string
  price: number
  typeLabel: string
  href: string
  isUnavailable: boolean
  plans?: Array<{ key: string; label: string; price: number }>
}

interface MinhaSolicitacao {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewNotes: string
  createdAt: string | null
  grant: { discountLabel: string; usage: string; expiresAt: string | null } | null
}

interface ArquivoEnviado {
  url: string
  pathname: string
  filename: string
  size: number
}

function formatarReais(valor: number) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function precoComDesconto(preco: number, beneficio: Beneficio) {
  if (!preco || preco <= 0) return 0
  const desconto = beneficio.discountType === 'percentage'
    ? preco * (Math.min(100, beneficio.discountValue) / 100)
    : Math.min(preco, beneficio.discountValue)
  return Math.max(0, Math.round((preco - desconto) * 100) / 100)
}

export default function PaginaProuniFies() {
  const params = useParams<{ itemType: string; itemId: string }>()
  const router = useRouter()
  const itemType = String(params?.itemType || '')
  const itemId = decodeURIComponent(String(params?.itemId || ''))

  const [carregando, setCarregando] = useState(true)
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null)
  const [produto, setProduto] = useState<Produto | null>(null)
  const [solicitacao, setSolicitacao] = useState<MinhaSolicitacao | null>(null)
  const [autenticado, setAutenticado] = useState(true)

  const [programa, setPrograma] = useState<'prouni' | 'fies'>('prouni')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [faculdade, setFaculdade] = useState('')
  const [curso, setCurso] = useState('')
  const [aceiteProgram, setAceiteProgram] = useState(false)
  const [aceitePlataforma, setAceitePlataforma] = useState(false)

  /**
   * ID da conta. O caminho do arquivo no armazenamento começa por ele, e o
   * servidor recusa qualquer envio fora dessa pasta — é o que garante que um
   * comprovante pertence a quem o mandou.
   */
  const [userId, setUserId] = useState('')
  const [arquivos, setArquivos] = useState<ArquivoEnviado[]>([])
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const inputArquivo = useRef<HTMLInputElement | null>(null)

  const tipoValido = (TIPOS_VALIDOS as readonly string[]).includes(itemType)

  const carregar = useCallback(async () => {
    if (!tipoValido || !itemId) {
      setCarregando(false)
      return
    }
    try {
      const res = await fetch(
        `/api/prouni/beneficio?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(itemId)}`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      setBeneficio(json?.benefit || null)
      setProduto(json?.product || null)
      setSolicitacao(json?.request || null)
      setAutenticado(json?.authenticated !== false)
    } catch {
      setBeneficio(null)
    } finally {
      setCarregando(false)
    }
  }, [itemType, itemId, tipoValido])

  useEffect(() => { carregar() }, [carregar])

  // Puxa o que o perfil já tem para a pessoa não redigitar. Continua tudo
  // editável: o cadastro pode estar velho, e o que vale é o que ela confirma
  // aqui, junto com a declaração que assina.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setUserId(String(json?.user?.id || '')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/user/profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const perfil = json?.profile
        if (!perfil) return
        setNome((atual) => atual || perfil.fullName || perfil.name || '')
        setEmail((atual) => atual || perfil.email || '')
        setTelefone((atual) => atual || (perfil.phone ? formatBrazilPhone(perfil.phone) : ''))
        setFaculdade((atual) => atual || perfil.institution || perfil.afyaUnit || '')
        setNascimento((atual) => atual || perfil.dateOfBirth || '')
        // O CPF não é preenchido: o perfil devolve ele mascarado, e mandar a
        // máscara de volta como se fosse o número seria pior do que pedir para
        // digitar — a solicitação nasceria com um CPF que não existe.
      })
      .catch(() => {})
  }, [])

  const totalBytes = useMemo(
    () => arquivos.reduce((soma, arquivo) => soma + arquivo.size, 0),
    [arquivos]
  )

  async function aoEscolherArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return
    setErro('')
    const escolhidos = Array.from(lista)

    if (arquivos.length + escolhidos.length > MAX_ARQUIVOS) {
      setErro(`Envie no máximo ${MAX_ARQUIVOS} arquivos.`)
      return
    }

    if (!userId) {
      setErro('Não conseguimos identificar sua conta. Recarregue a página e tente de novo.')
      return
    }

    setEnviandoArquivo(true)
    try {
      const novos: ArquivoEnviado[] = []
      let acumulado = totalBytes
      for (const arquivo of escolhidos) {
        if (!TIPOS_ACEITOS.includes(arquivo.type)) {
          throw new Error(`"${arquivo.name}" não é PDF, JPG, PNG ou WEBP.`)
        }
        if (arquivo.size > MAX_BYTES_ARQUIVO) {
          throw new Error(`"${arquivo.name}" passa de ${Math.round(MAX_BYTES_ARQUIVO / 1024 / 1024)} MB.`)
        }
        acumulado += arquivo.size
        if (acumulado > MAX_BYTES_TOTAL) {
          throw new Error(`A soma dos arquivos passa de ${Math.round(MAX_BYTES_TOTAL / 1024 / 1024)} MB.`)
        }

        const extensao = (arquivo.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '')
        const blob = await upload(`prouni-comprovantes/${userId}/comprovante.${extensao}`, arquivo, {
          access: 'private',
          contentType: arquivo.type,
          handleUploadUrl: '/api/prouni/upload',
          clientPayload: JSON.stringify({ itemType, itemId }),
        })
        novos.push({
          url: blob.url,
          pathname: blob.pathname,
          filename: arquivo.name,
          size: arquivo.size,
        })
      }
      setArquivos((atuais) => [...atuais, ...novos])
    } catch (e: any) {
      setErro(e?.message || 'Falha ao enviar o arquivo.')
    } finally {
      setEnviandoArquivo(false)
      if (inputArquivo.current) inputArquivo.current.value = ''
    }
  }

  function removerArquivo(pathname: string) {
    setArquivos((atuais) => atuais.filter((arquivo) => arquivo.pathname !== pathname))
  }

  async function enviarSolicitacao() {
    setErro('')
    if (!nome.trim() || nome.trim().length < 5) return setErro('Informe seu nome completo.')
    if (!isValidCpf(cpf)) return setErro('CPF inválido.')
    if (!email.trim() || !email.includes('@')) return setErro('Informe um e-mail válido.')
    if (!isValidBrazilPhone(telefone)) return setErro('Informe um telefone válido com DDD.')
    if (!nascimento) return setErro('Informe sua data de nascimento.')
    if (!faculdade.trim()) return setErro('Informe sua faculdade.')
    if (arquivos.length === 0) return setErro('Anexe pelo menos um comprovante.')
    if (!aceiteProgram || !aceitePlataforma) return setErro('É preciso aceitar as duas declarações.')

    setEnviando(true)
    try {
      const res = await fetch('/api/prouni/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          itemId,
          program: programa,
          fullName: nome.trim(),
          cpf: onlyCpfDigits(cpf),
          email: email.trim(),
          phone: telefone.trim(),
          dateOfBirth: nascimento,
          institution: faculdade.trim(),
          courseName: curso.trim() || undefined,
          acceptProgramTerms: true,
          acceptPlatformTerms: true,
          attachments: arquivos.map((arquivo) => ({
            url: arquivo.url,
            pathname: arquivo.pathname,
            filename: arquivo.filename,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Não foi possível enviar a solicitação.')
      setSucesso(true)
      // Os arquivos já não são nossos: a partir daqui quem os guarda é a
      // solicitação. Manter a lista na tela sugeriria que dá para reenviar.
      setArquivos([])
      await carregar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível enviar a solicitação.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <LogoLoading message="Carregando condição PROUNI/FIES..." size="lg" fullscreen />
  }

  if (!beneficio || !produto) {
    return (
      <AppShell headerTitle="PROUNI/FIES">
        <div className="container mx-auto max-w-2xl px-4 py-10">
          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Este item não tem desconto PROUNI/FIES</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ou a campanha foi encerrada. Veja o catálogo para conferir os itens participantes.
              </p>
              <Button className="mt-4" onClick={() => router.push('/materiais')}>
                Ver materiais
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  const precoFinal = precoComDesconto(produto.price, beneficio)
  const economia = Math.max(0, Math.round((produto.price - precoFinal) * 100) / 100)
  const jaAprovado = solicitacao?.status === 'approved'
  const emAnalise = solicitacao?.status === 'pending' || sucesso
  const recusado = solicitacao?.status === 'rejected'
  const podeSolicitar = !jaAprovado && !emAnalise

  return (
    <AppShell headerTitle="Desconto PROUNI/FIES">
      <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Link
          href={produto.href}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para {produto.title}
        </Link>

        {/* Cabeçalho: o preço com desconto antes de qualquer formulário. */}
        <Card className="overflow-hidden border-sky-500/30">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-600 dark:text-sky-300">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {produto.typeLabel} · condição bolsista
                </p>
                <CardTitle className="text-xl sm:text-2xl">{produto.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {produto.price > 0 && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Preço normal</span>
                  <span className="text-muted-foreground line-through">{formatarReais(produto.price)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-sky-700 dark:text-sky-300">
                    Desconto PROUNI/FIES ({beneficio.discountLabel})
                  </span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">− {formatarReais(economia)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/40 pt-2">
                  <span className="text-sm font-semibold">Você paga</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {precoFinal <= 0 ? 'Grátis' : formatarReais(precoFinal)}
                  </span>
                </div>
                {beneficio.stackWithTier && (
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Este desconto soma com o lote em andamento — o valor final pode ficar ainda menor.
                  </p>
                )}
                {produto.plans && produto.plans.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Planos participantes: {produto.plans.map((plano) => plano.label).join(', ')}.
                  </p>
                )}
              </div>
            )}

            {beneficio.instructions && (
              <p className="text-sm text-muted-foreground">{beneficio.instructions}</p>
            )}

            <div className="rounded-xl border border-border/50 p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                Como funciona
              </h2>
              <ol className="space-y-1.5 text-sm text-muted-foreground">
                <li>1. Envie o comprovante do ProUni ou do FIES (PDF ou foto).</li>
                <li>2. Nossa equipe confere manualmente — costuma levar até 2 dias úteis.</li>
                <li>3. Aprovado, o desconto entra sozinho no seu checkout deste item.</li>
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                O benefício é pessoal e intransferível: vale só para a sua conta e para este item.
                Depois da análise, seus arquivos são apagados do nosso armazenamento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estado de quem já pediu. */}
        {jaAprovado && (
          <Card className="mt-4 border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="flex items-start gap-3 py-5">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Desconto aprovado{solicitacao?.grant ? ` (${solicitacao.grant.discountLabel})` : ''}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {solicitacao?.grant?.usage === 'used'
                    ? 'Este benefício já foi usado em uma compra.'
                    : 'Ele é aplicado sozinho quando você finalizar a compra deste item.'}
                </p>
                {solicitacao?.grant?.expiresAt && solicitacao.grant.usage !== 'used' && (
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                    Válido até {new Date(solicitacao.grant.expiresAt).toLocaleDateString('pt-BR')}.
                  </p>
                )}
                <Button className="mt-3" onClick={() => router.push(produto.href)}>
                  Ir para a compra
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {emAnalise && !jaAprovado && (
          <Card className="mt-4 border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">Solicitação em análise</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Recebemos seus documentos. Você será avisado assim que a conferência terminar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {recusado && podeSolicitar && (
          <Card className="mt-4 border-rose-500/40 bg-rose-500/5">
            <CardContent className="flex items-start gap-3 py-5">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-300">Solicitação anterior recusada</p>
                {solicitacao?.reviewNotes && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{solicitacao.reviewNotes}</p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Você pode enviar uma nova solicitação com o documento corrigido.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!autenticado && (
          <Card className="mt-4">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Entre na sua conta para solicitar o desconto — o benefício fica vinculado a ela.
              </p>
              <Button
                className="mt-3"
                onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(`/prouni-fies/${itemType}/${itemId}`)}`)}
              >
                Entrar
              </Button>
            </CardContent>
          </Card>
        )}

        {podeSolicitar && autenticado && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Solicitar meu desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Seu programa</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['prouni', 'fies'] as const).map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setPrograma(valor)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        programa === valor
                          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {valor === 'prouni' ? 'ProUni' : 'FIES'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="prouni-nome">Nome completo</Label>
                  <Input
                    id="prouni-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como está no documento"
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-cpf">CPF</Label>
                  <Input
                    id="prouni-cpf"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-nascimento">Data de nascimento</Label>
                  <Input
                    id="prouni-nascimento"
                    type="date"
                    value={nascimento}
                    onChange={(e) => setNascimento(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-email">E-mail</Label>
                  <Input
                    id="prouni-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={160}
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-telefone">Telefone (com DDD)</Label>
                  <Input
                    id="prouni-telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(formatBrazilPhone(e.target.value))}
                    placeholder="(21) 99999-9999"
                    inputMode="tel"
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-faculdade">Faculdade</Label>
                  <Input
                    id="prouni-faculdade"
                    value={faculdade}
                    onChange={(e) => setFaculdade(e.target.value)}
                    placeholder="Nome da instituição"
                    maxLength={140}
                  />
                </div>
                <div>
                  <Label htmlFor="prouni-curso">Curso (opcional)</Label>
                  <Input
                    id="prouni-curso"
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    placeholder="Medicina, Odontologia…"
                    maxLength={120}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Usamos esses dados para conferir o comprovante e, se ainda faltarem no seu perfil,
                para completá-lo. Nada que você já tenha cadastrado é sobrescrito.
              </p>

              {/* Comprovantes */}
              <div className="rounded-xl border border-dashed border-border p-4">
                <Label className="mb-1 block">Comprovante do {programa === 'prouni' ? 'ProUni' : 'FIES'}</Label>
                <p className="mb-3 text-xs text-muted-foreground">
                  Termo de concessão de bolsa, contrato do FIES ou documento equivalente.
                  PDF ou foto, até {Math.round(MAX_BYTES_ARQUIVO / 1024 / 1024)} MB por arquivo
                  (máximo {MAX_ARQUIVOS}).
                </p>

                <input
                  ref={inputArquivo}
                  type="file"
                  accept={TIPOS_ACEITOS.join(',')}
                  multiple
                  className="hidden"
                  onChange={(e) => aoEscolherArquivos(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={enviandoArquivo || arquivos.length >= MAX_ARQUIVOS}
                  onClick={() => inputArquivo.current?.click()}
                >
                  {enviandoArquivo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {enviandoArquivo ? 'Enviando…' : 'Escolher arquivo'}
                </Button>

                {arquivos.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {arquivos.map((arquivo) => (
                      <li
                        key={arquivo.pathname}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{arquivo.filename}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {(arquivo.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removerArquivo(arquivo.pathname)}
                          className="shrink-0 text-muted-foreground hover:text-rose-600"
                          aria-label={`Remover ${arquivo.filename}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Declarações */}
              <div className="space-y-2.5">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={aceiteProgram}
                    onChange={(e) => setAceiteProgram(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                  />
                  <span className="text-muted-foreground">
                    Declaro, sob minha responsabilidade, que sou beneficiário ativo do
                    {programa === 'prouni' ? ' ProUni' : ' FIES'} e que o comprovante enviado é
                    verdadeiro e meu. Entendo que declaração falsa cancela o desconto e pode
                    encerrar minha conta.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={aceitePlataforma}
                    onChange={(e) => setAceitePlataforma(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                  />
                  <span className="text-muted-foreground">
                    Li e aceito os{' '}
                    <Link href="/termos-de-servico" target="_blank" className="underline">
                      termos de serviço
                    </Link>{' '}
                    e a{' '}
                    <Link href="/politica-de-privacidade" target="_blank" className="underline">
                      política de privacidade
                    </Link>
                    , e autorizo a análise dos documentos enviados para este fim.
                  </span>
                </label>
              </div>

              {erro && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {erro}
                </div>
              )}

              <Button
                className="w-full"
                disabled={enviando || enviandoArquivo}
                onClick={enviarSolicitacao}
              >
                {enviando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Enviar solicitação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

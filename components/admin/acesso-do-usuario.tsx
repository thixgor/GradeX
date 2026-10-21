'use client'

/**
 * Diálogos de acesso de /admin/users:
 *
 *   RedefinirSenhaDialog → gera uma senha provisória (para o admin mandar pelo
 *                          WhatsApp) ou envia o link de redefinição por e-mail.
 *   EmailsDoUsuarioDialog → o que o site tentou mandar para a pessoa, com o
 *                          que o servidor SMTP respondeu. É a primeira coisa a
 *                          olhar quando alguém diz "o e-mail não chegou".
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Copy, KeyRound, Loader2, Mail, MessageCircle, RefreshCw, Send, XCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type UsuarioDoAcesso = {
  _id?: unknown
  name?: string
  email: string
  phone?: string
}

type Avisar = (mensagem: string, tipo?: 'success' | 'error') => void

type SenhaGerada = {
  senha: string
  email: string
  nome?: string
  sessoesEncerradas: number
  emailEnviado: boolean
  emailErro?: string
}

function primeiroNome(nome?: string) {
  return (nome || '').trim().split(' ')[0] || ''
}

function mensagemDeAcesso(gerada: SenhaGerada) {
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://www.domineaqui.com.br'
  const nome = primeiroNome(gerada.nome)
  return [
    `Olá${nome ? `, ${nome}` : ''}! Seu acesso ao DomineAqui foi redefinido.`,
    '',
    `Site: ${origem}/auth/login`,
    `E-mail: ${gerada.email}`,
    `Senha provisória: ${gerada.senha}`,
    '',
    'Depois de entrar, troque a senha em Perfil → Configurações → Senha.',
  ].join('\n')
}

/** Link do WhatsApp com a mensagem pronta; com o telefone, abre direto na conversa. */
function linkDoWhatsapp(telefone: string | undefined, texto: string) {
  let digitos = String(telefone || '').replace(/\D/g, '')
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

export function RedefinirSenhaDialog({
  usuario,
  open,
  onOpenChange,
  onToast,
}: {
  usuario: UsuarioDoAcesso | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToast: Avisar
}) {
  const [enviarPorEmail, setEnviarPorEmail] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [enviandoLink, setEnviandoLink] = useState(false)
  const [gerada, setGerada] = useState<SenhaGerada | null>(null)
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [copiado, setCopiado] = useState<'senha' | 'mensagem' | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (open) return
    // Ao fechar, a senha some da memória da tela: ela é mostrada uma vez só.
    setGerada(null)
    setLinkEnviado(false)
    setEnviarPorEmail(false)
    setCopiado(null)
    setErro('')
  }, [open])

  const id = usuario?._id ? String(usuario._id) : ''
  const ocupado = gerando || enviandoLink

  async function chamar(corpo: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Erro ao redefinir o acesso')
    return data
  }

  async function gerar() {
    if (!id) return
    if (
      !window.confirm(
        `Gerar uma senha nova para ${usuario?.email}?\n\nA senha atual deixa de funcionar e os aparelhos conectados saem da conta.`
      )
    ) return
    setErro('')
    setGerando(true)
    try {
      const data = await chamar({ modo: 'aleatoria', enviarPorEmail })
      setGerada({
        senha: data.senha,
        email: data.email,
        nome: data.nome,
        sessoesEncerradas: data.sessoesEncerradas || 0,
        emailEnviado: !!data.emailEnviado,
        emailErro: data.emailErro,
      })
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  async function enviarLink() {
    if (!id) return
    setErro('')
    setEnviandoLink(true)
    try {
      const data = await chamar({ modo: 'link' })
      setLinkEnviado(true)
      onToast(`Link de redefinição enviado para ${data.email}.`, 'success')
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setEnviandoLink(false)
    }
  }

  async function copiarSenha() {
    if (!gerada) return
    if (await copiar(gerada.senha)) setCopiado('senha')
    else onToast('Não foi possível copiar. Selecione a senha e copie manualmente.')
  }

  async function copiarMensagem() {
    if (!gerada) return
    if (await copiar(mensagemDeAcesso(gerada))) setCopiado('mensagem')
    else onToast('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !ocupado && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Redefinir senha
          </DialogTitle>
          <DialogDescription className="break-words">
            Conta de <strong>{usuario?.name || usuario?.email}</strong> ({usuario?.email}).
          </DialogDescription>
        </DialogHeader>

        {gerada ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Nova senha provisória
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="select-all break-all font-mono text-2xl font-bold tracking-wider text-foreground">
                  {gerada.senha}
                </code>
                <Button size="sm" variant="outline" onClick={copiarSenha} className="shrink-0">
                  {copiado === 'senha' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Ela não será mostrada de novo. Copie antes de fechar.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mensagem pronta para enviar</p>
              <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                {mensagemDeAcesso(gerada)}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={copiarMensagem}>
                  {copiado === 'mensagem' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copiado === 'mensagem' ? 'Mensagem copiada' : 'Copiar mensagem'}
                </Button>
                <a
                  href={linkDoWhatsapp(usuario?.phone, mensagemDeAcesso(gerada))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: 'sm', variant: 'outline' })}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {usuario?.phone ? 'Enviar no WhatsApp' : 'Abrir no WhatsApp'}
                </a>
              </div>
            </div>

            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                • {gerada.sessoesEncerradas > 0
                  ? `${gerada.sessoesEncerradas} aparelho(s) foram desconectados.`
                  : 'Nenhum aparelho estava conectado.'}
              </li>
              {gerada.emailEnviado && <li>• A senha também foi enviada para {gerada.email}.</li>}
              {!gerada.emailEnviado && !gerada.emailErro && (
                <li>• A pessoa recebeu um aviso por e-mail de que a senha foi trocada (sem a senha).</li>
              )}
            </ul>
            {gerada.emailErro && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  A senha foi trocada, mas o e-mail não saiu ({gerada.emailErro}). Mande a mensagem acima pelo WhatsApp.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-sm font-semibold">Gerar senha provisória</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cria uma senha aleatória para você mandar à pessoa (WhatsApp, Instagram). A senha atual deixa de
                  valer e os aparelhos conectados saem da conta. A pessoa troca depois pelo perfil.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={enviarPorEmail}
                  onCheckedChange={setEnviarPorEmail}
                  disabled={ocupado}
                  className="mt-0.5"
                />
                <span>Também enviar a senha por e-mail para {usuario?.email}</span>
              </label>
              <Button onClick={gerar} disabled={ocupado || !id} className="w-full">
                {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                {gerando ? 'Gerando...' : 'Gerar nova senha'}
              </Button>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-sm font-semibold">Enviar link de redefinição</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manda o mesmo e-mail do &quot;Esqueci minha senha&quot;. A senha atual continua valendo até a pessoa
                  criar outra.
                </p>
              </div>
              <Button variant="outline" onClick={enviarLink} disabled={ocupado || linkEnviado || !id} className="w-full">
                {enviandoLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {linkEnviado ? 'Link enviado' : enviandoLink ? 'Enviando...' : 'Enviar link por e-mail'}
              </Button>
            </div>

            {erro && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={ocupado}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Envio = {
  id: string
  assunto: string
  categoria?: string
  status: 'enviado' | 'falhou'
  tentativas: number
  transporte: 'principal' | 'reserva'
  resposta?: string
  erro?: string
  createdAt: string
}

const CATEGORIAS: Record<string, string> = {
  'redefinicao-senha': 'Redefinição de senha',
  'senha-alterada': 'Aviso de senha alterada',
  'senha-provisoria': 'Senha provisória',
  'verificacao-email': 'Confirmação de e-mail',
  'boas-vindas': 'Boas-vindas',
  'codigo-login-admin': 'Código de login (admin)',
  'serial-key': 'Serial Key',
}

function formatarQuando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function EmailsDoUsuarioDialog({
  usuario,
  open,
  onOpenChange,
}: {
  usuario: UsuarioDoAcesso | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState<{ envios: Envio[]; smtp: { configurado: boolean; reserva: boolean } } | null>(null)
  const [erro, setErro] = useState('')
  const id = usuario?._id ? String(usuario._id) : ''

  async function carregar() {
    if (!id) return
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch(`/api/admin/users/${id}/emails`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar os e-mails')
      setDados(data)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (open) carregar()
    else setDados(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-mails enviados
          </DialogTitle>
          <DialogDescription className="break-words">
            O que o site tentou mandar para <strong>{usuario?.email}</strong> nos últimos 45 dias.
            &quot;Enviado&quot; quer dizer que o servidor de e-mail aceitou: se a pessoa não achou, peça para olhar
            Spam, Lixo eletrônico e a aba Promoções.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {dados && !dados.smtp.configurado && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              SMTP_USER/SMTP_PASS não estão configurados neste ambiente: nenhum e-mail sai pelo servidor principal.
            </div>
          )}

          {carregando ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : erro ? (
            <div className="py-8 text-center text-sm text-destructive">{erro}</div>
          ) : !dados || dados.envios.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum envio registrado para este e-mail.
            </div>
          ) : (
            <div className="space-y-2">
              {dados.envios.map((envio) => (
                <div key={envio.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                  {envio.status === 'enviado' ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">{envio.assunto || '(sem assunto)'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatarQuando(envio.createdAt)}
                      {envio.categoria ? ` · ${CATEGORIAS[envio.categoria] || envio.categoria}` : ''}
                      {envio.tentativas > 1 ? ` · ${envio.tentativas} tentativas` : ''}
                      {envio.transporte === 'reserva' ? ' · servidor reserva' : ''}
                    </p>
                    {envio.status === 'falhou' && envio.erro && (
                      <p className="mt-1 break-words text-xs text-red-600 dark:text-red-400">{envio.erro}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      envio.status === 'enviado'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {envio.status === 'enviado' ? 'Enviado' : 'Falhou'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={carregar} disabled={carregando || !id}>
            <RefreshCw className={`mr-2 h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

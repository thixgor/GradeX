'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, FileSignature, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { api, CaixaErro, ErroApi } from './base'
import { TermosAceite } from './termos-aceite'

interface Contrato {
  id: string
  numero: string
  titulo: string
  secoes: Array<{ titulo: string; paragrafos: string[] }>
  hash: string
  status: 'aguardando_assinaturas' | 'assinado' | 'rescindido'
  meuPapel: 'contratante' | 'contratado' | null
  falta: Array<'contratante' | 'contratado'>
  euAssinei: boolean
  assinaturas: Array<{ papel: string; nome: string; em: string; metodo: string }>
  codigoVerificacao: string
}

/**
 * Leitura + assinatura eletrônica do contrato:
 *  1. termos do papel aceitos (se ainda não);
 *  2. leitura do contrato (rolagem até o fim) e caixa "li e concordo";
 *  3. código de 6 dígitos enviado ao e-mail → assina.
 */
export function AssinaturaContrato({ contratoId, onAssinado }: { contratoId: string; onAssinado?: (completo: boolean) => void }) {
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [erro, setErro] = useState('')
  const [precisaTermos, setPrecisaTermos] = useState<null | 'aluno' | 'monitor'>(null)
  const [leu, setLeu] = useState(false)
  const [concordo, setConcordo] = useState(false)
  const [codigoEnviadoPara, setCodigoEnviadoPara] = useState('')
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  const carregar = useCallback(() => {
    api<Contrato>(`/api/monitorias/contratos/${contratoId}`).then(setContrato).catch((e) => setErro(e.message))
  }, [contratoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  function aoRolar() {
    const el = caixa.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setLeu(true)
  }

  async function pedirCodigo() {
    setOcupado(true)
    setErro('')
    try {
      const r = await api<{ para: string }>('/api/monitorias/codigo', { method: 'POST', json: { finalidade: 'assinar', ref: contratoId } })
      setCodigoEnviadoPara(r.para)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar código.')
    } finally {
      setOcupado(false)
    }
  }

  async function assinar() {
    if (!contrato) return
    setOcupado(true)
    setErro('')
    try {
      const r = await api<{ completo: boolean }>(`/api/monitorias/contratos/${contratoId}`, { method: 'POST', json: { codigo, hash: contrato.hash } })
      carregar()
      onAssinado?.(r.completo)
    } catch (e) {
      if (e instanceof ErroApi && e.dados?.precisaTermos) setPrecisaTermos(e.dados.precisaTermos)
      setErro(e instanceof Error ? e.message : 'Erro ao assinar.')
      if (e instanceof ErroApi && e.status === 409) carregar()
    } finally {
      setOcupado(false)
    }
  }

  if (!contrato) return erro ? <CaixaErro mensagem={erro} /> : <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando contrato…</div>

  const pdf = `/api/monitorias/documentos/contrato/${contrato.id}`
  const papelTermos = contrato.meuPapel === 'contratado' ? 'monitor' : 'aluno'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><FileSignature className="h-4 w-4 text-primary" /> Contrato nº {contrato.numero}</p>
          <p className="font-mono text-[10px] text-muted-foreground">SHA-256 {contrato.hash.slice(0, 24)}…</p>
        </div>
        <a href={pdf} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:border-primary/40">
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </a>
      </div>

      {contrato.euAssinei || contrato.status === 'assinado' ? (
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
          <p className="flex items-center gap-2 font-semibold text-primary"><CheckCircle2 className="h-5 w-5" /> {contrato.status === 'assinado' ? 'Contrato assinado pelas partes' : 'Você já assinou'}</p>
          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {contrato.assinaturas.map((a) => (
              <li key={a.papel}>
                {a.papel === 'contratante' ? 'Aluno' : 'Monitor'}: {a.nome}, {formatarEmBrasilia(a.em)}
                {a.metodo !== 'codigo_email' ? ' (assinatura prévia)' : ''}
              </li>
            ))}
          </ul>
          {contrato.status !== 'assinado' && <p className="mt-2 text-xs">Aguardando a assinatura da outra parte.</p>}
        </motion.div>
      ) : contrato.status === 'rescindido' ? (
        <CaixaErro mensagem="Este contrato não tem mais efeito (a proposta mudou ou a reserva foi encerrada)." />
      ) : precisaTermos ? (
        <TermosAceite papel={papelTermos} compacto onAceito={() => setPrecisaTermos(null)} />
      ) : (
        <>
          <div ref={caixa} onScroll={aoRolar} className="max-h-72 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-xs leading-relaxed">
            <p className="mb-3 text-sm font-semibold text-foreground">{contrato.titulo}</p>
            {contrato.secoes.map((s) => (
              <div key={s.titulo} className="mb-3">
                <p className="mb-1 font-semibold text-foreground">{s.titulo}</p>
                {s.paragrafos.map((p, i) => (
                  <p key={i} className="mb-1 text-muted-foreground">{p}</p>
                ))}
              </div>
            ))}
          </div>
          {!leu && <p className="text-[11px] text-muted-foreground">Role até o fim do contrato para liberar a assinatura.</p>}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4" disabled={!leu} checked={concordo} onChange={(e) => setConcordo(e.target.checked)} />
            <span>Li o contrato inteiro, concordo com todas as cláusulas e reconheço a validade da assinatura eletrônica.</span>
          </label>
          {!codigoEnviadoPara ? (
            <Button onClick={pedirCodigo} disabled={!concordo || ocupado} className="w-full">
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="mr-2 h-4 w-4" /> Enviar código de assinatura para meu e-mail</>}
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs">Enviamos um código de 6 dígitos para <strong>{codigoEnviadoPara}</strong>. Ele vale por 10 minutos.</p>
              <div className="flex gap-2">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="h-11 w-36 rounded-xl border border-border bg-background text-center font-mono text-lg tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Código de assinatura"
                />
                <Button onClick={assinar} disabled={codigo.length !== 6 || ocupado} className="h-11 flex-1">
                  {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="mr-2 h-4 w-4" /> Assinar contrato</>}
                </Button>
              </div>
              <button type="button" onClick={pedirCodigo} disabled={ocupado} className="text-xs text-primary hover:underline">Reenviar código</button>
            </motion.div>
          )}
        </>
      )}
      {erro && <CaixaErro mensagem={erro} />}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaErro } from './base'

interface Termos {
  papel: 'monitor' | 'aluno'
  versao: string
  titulo: string
  secoes: Array<{ titulo: string; paragrafos: string[] }>
  hash: string
  aceito: boolean
}

/**
 * Termos de Serviço com leitura obrigatória: o botão de aceitar só liga quando
 * a pessoa rolou até o fim. O aceite grava versão, hash do texto, IP e data.
 */
export function TermosAceite({ papel, onAceito, compacto = false }: { papel: 'monitor' | 'aluno'; onAceito?: () => void; compacto?: boolean }) {
  const [termos, setTermos] = useState<Termos | null>(null)
  const [leu, setLeu] = useState(false)
  const [marcado, setMarcado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api<Termos>(`/api/monitorias/termos?papel=${papel}`)
      .then((t) => {
        setTermos(t)
        if (t.aceito) onAceito?.()
      })
      .catch((e) => setErro(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papel])

  function aoRolar() {
    const el = caixa.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setLeu(true)
  }

  async function aceitar() {
    if (!termos) return
    setEnviando(true)
    setErro('')
    try {
      await api('/api/monitorias/termos', { method: 'POST', json: { papel, hash: termos.hash } })
      setTermos({ ...termos, aceito: true })
      onAceito?.()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao aceitar.')
    } finally {
      setEnviando(false)
    }
  }

  if (erro && !termos) return <CaixaErro mensagem={erro} />
  if (!termos) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando termos…</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold"><ScrollText className="h-4 w-4 text-primary" /> {termos.titulo}</p>
        <a href={`/api/monitorias/documentos/termos/${papel}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      </div>
      {termos.aceito ? (
        <p className="rounded-xl bg-primary/[0.08] px-3.5 py-2.5 text-sm font-medium text-primary">Você aceitou a versão {termos.versao}.</p>
      ) : (
        <>
          <div ref={caixa} onScroll={aoRolar} className={`${compacto ? 'max-h-56' : 'max-h-80'} overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-xs leading-relaxed`}>
            {termos.secoes.map((s) => (
              <div key={s.titulo} className="mb-3">
                <p className="mb-1 font-semibold text-foreground">{s.titulo}</p>
                {s.paragrafos.map((p, i) => (
                  <p key={i} className="mb-1 text-muted-foreground">{p}</p>
                ))}
              </div>
            ))}
          </div>
          {!leu && <p className="text-[11px] text-muted-foreground">Role até o fim para poder aceitar.</p>}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" disabled={!leu} checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />
            <span>Li e aceito os Termos de Serviço (versão {termos.versao}).</span>
          </label>
          {erro && <CaixaErro mensagem={erro} />}
          <Button onClick={aceitar} disabled={!marcado || enviando} className="w-full">
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceitar termos'}
          </Button>
        </>
      )}
    </div>
  )
}

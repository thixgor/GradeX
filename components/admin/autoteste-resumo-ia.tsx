'use client'

/**
 * "Testar o Resumo por IA": percorre, contra o Google de verdade, o caminho de
 * um trecho de aula e mostra em que etapa quebra. O navegador do admin faz o
 * envio direto (o mesmo CORS da sala); o servidor confere o arquivo e
 * transcreve um WAV e um WebM/Opus com o pedido real. Custa centavos de dólar.
 */

import { useState } from 'react'
import { CheckCircle2, FlaskConical, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaAviso, CaixaErro } from '@/components/monitorias/base'
import { wavDeTeste } from '@/lib/monitorias/resumo/wav'

interface Etapa {
  etapa: 'envio_navegador' | 'conferencia' | 'transcricao_wav' | 'transcricao_webm' | 'limpeza'
  ok: boolean
  detalhe: string
}

interface Resultado {
  modeloTranscricao: string
  etapas: Etapa[]
  custoUsd: number
  conclusao: string
}

const ROTULO: Record<Etapa['etapa'], string> = {
  envio_navegador: 'Envio direto do navegador ao Google (CORS)',
  conferencia: 'Arquivo confere no Google',
  transcricao_wav: 'Transcrição de WAV',
  transcricao_webm: 'Transcrição de WebM/Opus (o formato da sala)',
  limpeza: 'Limpeza dos arquivos de teste',
}

const URL_DO_TESTE = '/api/admin/monitorias/resumos-ia/teste'

export function AutotesteDoResumo() {
  const [testando, setTestando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')

  async function testar() {
    setTestando(true)
    setResultado(null)
    setErro('')
    try {
      // 1. O mesmo envio da sala: o servidor abre a sessão, o navegador manda os bytes.
      const wav = new Blob([wavDeTeste() as BlobPart], { type: 'audio/wav' })
      let navegador: { arquivo?: string; nome?: string; bytes?: number; erro?: string }
      try {
        const sessao = await api<{ url: string; nome: string }>(URL_DO_TESTE, { method: 'POST', json: { etapa: 'abrir', bytes: wav.size } })
        try {
          const r = await fetch(sessao.url, { method: 'POST', headers: { 'X-Goog-Upload-Command': 'upload, finalize', 'X-Goog-Upload-Offset': '0' }, body: wav })
          const dados = await r.json().catch(() => null)
          navegador =
            r.ok && dados?.file?.name
              ? { arquivo: dados.file.name, nome: sessao.nome, bytes: wav.size }
              : { erro: `Google respondeu HTTP ${r.status}${dados?.error?.message ? `: ${String(dados.error.message)}` : ''}`.slice(0, 300) }
        } catch (e) {
          navegador = { erro: `rede ou CORS até o Google (${e instanceof Error ? e.message || e.name : 'erro'})`.slice(0, 300) }
        }
      } catch (e) {
        navegador = { erro: (e instanceof Error ? e.message : 'o servidor não abriu a sessão de envio').slice(0, 300) }
      }
      // 2 a 5 no servidor.
      setResultado(await api<Resultado>(URL_DO_TESTE, { method: 'POST', json: { etapa: 'rodar', ...navegador } }))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para rodar o teste.')
    } finally {
      setTestando(false)
    }
  }

  const tudoOk = !!resultado?.etapas.length && resultado.etapas.every((e) => e.ok)
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Testar o Resumo por IA</p>
          <p className="text-xs text-muted-foreground">
            Faz o caminho de um trecho de aula com o Google de verdade: envio direto do seu navegador, conferência do arquivo e transcrição em WAV e no WebM que a sala grava. Usa a chave padrão e custa centavos de dólar.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void testar()} disabled={testando}>
          {testando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-1 h-4 w-4" />} {testando ? 'Testando…' : 'Testar agora'}
        </Button>
      </div>
      {erro && <CaixaErro mensagem={erro} />}
      {resultado && (
        <div className="space-y-2">
          <ol className="space-y-1.5 text-sm">
            {resultado.etapas.map((e, i) => (
              <li key={e.etapa} className="flex items-start gap-2">
                {e.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="ok" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-label="falhou" />}
                <span className="min-w-0">
                  <span className="font-medium">
                    {i + 1}. {ROTULO[e.etapa]}
                    {e.etapa.startsWith('transcricao') ? ` (${resultado.modeloTranscricao})` : ''}
                  </span>
                  <span className={e.ok ? 'block break-words text-xs text-muted-foreground' : 'block break-words text-xs text-rose-600'}>{e.detalhe}</span>
                </span>
              </li>
            ))}
          </ol>
          <CaixaAviso tom={tudoOk ? 'sucesso' : 'info'}>{resultado.conclusao}</CaixaAviso>
        </div>
      )}
    </div>
  )
}

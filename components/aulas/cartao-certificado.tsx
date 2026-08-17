'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Award, Loader2, Settings2 } from 'lucide-react'
import {
  avaliarCertificado,
  formatarCodigo,
  regrasDoCertificado,
  type RegrasDoCertificado,
} from '@/lib/aulas/certificado'
import { cn } from '@/lib/utils'

/**
 * Certificado na página do curso (§38).
 *
 * Aparece bem antes de ser emitível, mostrando quanto falta — porque é aí que
 * ele funciona como motivo para terminar. Um certificado que só surge depois da
 * última aula é um troféu; um que diz "faltam 3 aulas" é um objetivo.
 *
 * A conta feita aqui é para MOSTRAR. Quem decide se pode emitir é o servidor,
 * com a mesma função: um documento que a pessoa mostra a terceiros não pode ter
 * a régua no navegador.
 */
export function CartaoDeCertificado({
  cursoId,
  curso,
  progresso,
  podeGerenciar = false,
}: {
  cursoId: string
  curso: { certificado?: Partial<RegrasDoCertificado> | null }
  progresso: { concluidas: number; total: number }
  podeGerenciar?: boolean
}) {
  const regras = regrasDoCertificado(curso)
  const veredito = avaliarCertificado(regras, progresso)

  const [emitido, setEmitido] = useState<{ codigo: string } | null>(null)
  const [emitindo, setEmitindo] = useState(false)
  const [erro, setErro] = useState('')
  const [ajustando, setAjustando] = useState(false)

  const carregar = useCallback(async () => {
    const res = await fetch('/api/aulas/certificado', { cache: 'no-store' })
    if (!res.ok) return
    const d = await res.json()
    const meu = (d.certificados || []).find((c: any) => String(c.setorId) === cursoId)
    if (meu) setEmitido({ codigo: meu.codigo })
  }, [cursoId])

  useEffect(() => {
    if (regras.habilitado) void carregar()
  }, [regras.habilitado, carregar])

  async function emitir() {
    setEmitindo(true)
    setErro('')
    try {
      const res = await fetch('/api/aulas/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setorId: cursoId }),
      })
      const d = await res.json().catch(() => ({}))
      // 409 traz a razão do servidor ("faltam 3 aulas"), que é mais confiável
      // do que a conta da tela — e é ela que aparece.
      if (!res.ok) throw new Error(d.error || 'Não foi possível emitir')
      setEmitido({ codigo: d.certificado.codigo })
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível emitir')
    } finally {
      setEmitindo(false)
    }
  }

  // Curso que não oferece certificado não mostra nada — exceto para quem pode
  // ligar a opção, que precisa achá-la em algum lugar.
  if (!veredito.oferecido && !podeGerenciar) return null

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 flex-none items-center justify-center rounded-xl',
            veredito.elegivel ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Award className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Certificado de conclusão</h2>
            {podeGerenciar ? (
              <button
                type="button"
                onClick={() => setAjustando((v) => !v)}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted"
              >
                <Settings2 className="h-3 w-3" />
                Ajustar
              </button>
            ) : null}
          </div>

          {!veredito.oferecido ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Este curso não emite certificado. Ligue a opção em &ldquo;Ajustar&rdquo; para que os
              alunos possam emitir ao concluir.
            </p>
          ) : emitido ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Emitido. Guarde o código — é com ele que qualquer pessoa confere a autenticidade.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[13px] font-bold tracking-wider">
                  {formatarCodigo(emitido.codigo)}
                </span>
                <Link
                  href={`/aulas/certificado/${formatarCodigo(emitido.codigo)}`}
                  className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:brightness-110"
                >
                  Ver certificado
                </Link>
              </div>
            </>
          ) : veredito.elegivel ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Você concluiu o necessário. O certificado traz um código de verificação pública.
              </p>
              <button
                type="button"
                onClick={emitir}
                disabled={emitindo}
                className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                {emitindo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Emitir certificado
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {/* Em aulas, não em porcentagem: "faltam 8%" não diz o que fazer. */}
                {veredito.faltam === 1
                  ? 'Falta 1 aula para liberar o certificado.'
                  : `Faltam ${veredito.faltam} aulas para liberar o certificado.`}
                {regras.percentualMinimo < 100
                  ? ` (é preciso concluir ${regras.percentualMinimo}% do curso)`
                  : ''}
              </p>
              <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${veredito.percentual}%` }}
                />
              </div>
            </>
          )}

          {erro ? <p className="mt-2 text-xs text-destructive">{erro}</p> : null}

          {ajustando && podeGerenciar ? (
            <AjusteDoCertificado
              cursoId={cursoId}
              regras={regras}
              onPronto={() => {
                setAjustando(false)
                // Recarrega para a régua nova valer na tela — o `curso` veio da
                // requisição anterior e ainda carrega a configuração antiga.
                window.location.reload()
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function AjusteDoCertificado({
  cursoId,
  regras,
  onPronto,
}: {
  cursoId: string
  regras: RegrasDoCertificado
  onPronto: () => void
}) {
  const [habilitado, setHabilitado] = useState(regras.habilitado)
  const [percentual, setPercentual] = useState(String(regras.percentualMinimo))
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      await fetch(`/api/aulas/setores/${cursoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificado: habilitado
            ? { habilitado: true, percentualMinimo: Number(percentual) || 100 }
            : null,
        }),
      })
      onPronto()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          checked={habilitado}
          onChange={(e) => setHabilitado(e.target.checked)}
        />
        Este curso emite certificado
      </label>

      {habilitado ? (
        <label className="mt-2.5 block text-[11.5px] text-muted-foreground">
          Concluir pelo menos
          <input
            type="number"
            min={1}
            max={100}
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            className="mx-1.5 h-8 w-16 rounded-md border border-border bg-card px-2 text-center text-xs text-foreground outline-none focus:border-primary/50"
          />
          % das aulas
        </label>
      ) : null}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
      >
        {salvando ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Salvar
      </button>
    </div>
  )
}

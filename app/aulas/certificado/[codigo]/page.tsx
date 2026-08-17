'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Award, Loader2, Printer, ShieldCheck, ShieldX } from 'lucide-react'
import { descreverCertificado, formatarCodigo } from '@/lib/aulas/certificado'

/**
 * Verificação pública de um certificado (§38).
 *
 * Pública de propósito, e sem casca de aplicativo: o valor do documento está em
 * um terceiro — a instituição, o empregador — conseguir conferi-lo. Exigir conta
 * para isso transformaria o certificado num enfeite interno.
 *
 * A página é o próprio documento: o que se vê na tela é o que sai na impressão.
 * Gerar um PDF paralelo criaria duas versões da mesma coisa, que divergiriam no
 * primeiro ajuste de texto — e a versão impressa é a que vai parar num processo
 * seletivo.
 */
export default function VerificarCertificadoPage() {
  const params = useParams<{ codigo: string }>()
  const codigo = String(params?.codigo || '')

  const [estado, setEstado] = useState<'carregando' | 'valido' | 'invalido'>('carregando')
  const [certificado, setCertificado] = useState<any>(null)

  useEffect(() => {
    let vivo = true
    fetch(`/api/aulas/certificado?codigo=${encodeURIComponent(codigo)}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!vivo) return
        if (r.ok && d.certificado) {
          setCertificado(d.certificado)
          setEstado('valido')
        } else {
          setEstado('invalido')
        }
      })
      .catch(() => vivo && setEstado('invalido'))
    return () => {
      vivo = false
    }
  }, [codigo])

  if (estado === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (estado === 'invalido') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-lg font-bold">Certificado não encontrado</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O código <span className="font-mono font-semibold">{formatarCodigo(codigo)}</span> não
            corresponde a nenhum certificado emitido.
          </p>
          {/* O código é lido em voz alta e digitado à mão; errar um caractere é
              o motivo mais provável de chegar aqui, não fraude. */}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Confira se o código foi digitado corretamente. Ele tem 12 caracteres e não usa as
            letras O, I e L nem os números 0 e 1.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 print:bg-white print:p-0">
      {/* Faixa de verificação: some na impressão, porque no papel ela seria
          apenas uma barra verde sem função. */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 print:hidden">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          Certificado válido
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir
        </button>
      </div>

      <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center sm:p-14 print:rounded-none print:border-0 print:shadow-none">
        <Award className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Certificado de conclusão
        </p>

        <p className="mt-8 text-sm text-muted-foreground">Certificamos que</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {certificado.nomeDoAluno}
        </h1>

        <p className="mt-6 text-sm text-muted-foreground">concluiu o curso</p>
        <p className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {certificado.nomeDoCurso}
        </p>

        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          {descreverCertificado(certificado)}
        </p>

        <div className="mt-10 border-t border-border pt-5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Código de verificação
          </p>
          <p className="mt-1 font-mono text-base font-bold tracking-widest">
            {formatarCodigo(certificado.codigo)}
          </p>
          {/* O endereço impresso é o que permite reconferir a partir do papel —
              sem ele, a versão impressa não prova nada. */}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Confira em domineaqui.com.br/aulas/certificado/{formatarCodigo(certificado.codigo)}
          </p>
        </div>
      </article>

      <p className="mt-5 text-center text-xs text-muted-foreground print:hidden">
        <Link href="/aulas" className="underline underline-offset-2 hover:text-foreground">
          Conhecer os cursos
        </Link>
      </p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { ComparacaoComNormal } from '@/components/histopatologia-zoom/comparacao'
import { rotaDosDadosDaPatologiaComZoom, type DadosDaComparacaoPatologica } from '@/lib/histopatologia-zoom/paginas-tipos'
import { BASE_PATOZOOM, rotaDaComparacao, rotaDaDoencaZoom, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'

/**
 * A lâmina da doença ao lado do órgão normal, na mesma ampliação. O casco é
 * estático; as duas lâminas vêm da rota de dados, depois do portão. `?normal=`
 * (qual lâmina normal fica à direita) é lido aqui e repassado à rota, que o
 * valida contra o órgão da doença.
 */
export function ComparacaoPatologica({ doenca, lamina }: { doenca: string; lamina: string }) {
  const normal = useSearchParams()?.get('normal') ?? null
  return (
    <PortaoDaHistologia<DadosDaComparacaoPatologica>
      url={rotaDosDadosDaPatologiaComZoom([doenca, lamina, 'comparar'], normal)}
    >
      {(dados) => <Conteudo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados }: { dados: DadosDaComparacaoPatologica }) {
  const { doenca, lamina, normal } = dados
  useTituloDaAba(`${dados.doente.titulo} × normal — comparação lado a lado`)

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada />
      <div className="container mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
        <nav aria-label="Trilha" className="mb-2 overflow-x-auto">
          <ol className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
            <li>
              <Link href={BASE_PATOZOOM} className="rounded px-1 py-1 hover:text-foreground">
                Histopatologia · Lâminas com zoom
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={rotaDaDoencaZoom(doenca.id)} className="rounded px-1 py-1 hover:text-foreground">
                {doenca.nome}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={rotaDaLaminaPatologica(doenca.id, lamina.slug)} className="rounded px-1 py-1 font-medium text-foreground">
                {lamina.subtitulo ?? 'Lâmina'}
              </Link>
            </li>
          </ol>
        </nav>
        <header className="mb-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {doenca.nome} <span className="font-normal text-muted-foreground">× {normal.titulo.toLowerCase()} normal</span>
          </h1>
          <ul className="mt-2 max-w-4xl space-y-1 text-sm leading-relaxed text-muted-foreground">
            {doenca.comparacaoComNormal.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
          {dados.opcoes.length > 1 && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Lâmina normal:</span>
              {dados.opcoes.map((o) => (
                <Link
                  key={o.slug}
                  href={rotaDaComparacao(doenca.id, lamina.slug, o.slug)}
                  aria-current={o.slug === normal.slug ? 'true' : undefined}
                  className={`inline-flex min-h-[32px] items-center rounded-full border px-2.5 font-semibold ${
                    o.slug === normal.slug
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-border text-muted-foreground hover:border-teal-500/50 hover:text-foreground'
                  }`}
                >
                  {o.rotulo}
                </Link>
              ))}
            </p>
          )}
        </header>

        <ComparacaoComNormal
          esquerda={{ ...dados.doente, rotulo: 'Doença', tom: 'patologico' }}
          direita={{ ...dados.sadio, rotulo: normal.rotulo, tom: 'normal' }}
        />

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          Lâmina da doença: {dados.creditoDaLamina} Lâmina normal: {normal.credito}
        </p>
      </div>
    </div>
  )
}

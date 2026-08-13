'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { VitrineAnatomia } from '@/components/anatomia/vitrine-anatomia'
import type { RespostaAcessoAnatomia } from '@/lib/anatomia/tipos'

/**
 * Portão de acesso das telas de Domine Anatomia.
 *
 * A seção é privativa: assinantes do Manual Clínico e contas Plus+. Quem não
 * tem assinatura — inclusive quem chega sem login — recebe a landing de vendas
 * no lugar do conteúdo, na mesma URL, para o link continuar valendo e para o
 * buscador ter o que indexar.
 *
 * Quem decide é sempre `/api/anatomia`, no servidor. O conteúdo pago entra por
 * `children`, que as páginas montam com `next/dynamic`: assim o catálogo do
 * Atlas e o dos modelos só são baixados depois do veredito.
 */
export function PortaoAnatomia({
  secao,
  children,
}: {
  secao: 'hub' | 'atlas' | 'modelos'
  children: (dados: RespostaAcessoAnatomia) => React.ReactNode
}) {
  const [dados, setDados] = useState<RespostaAcessoAnatomia | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let ativo = true
    fetch('/api/anatomia')
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(conteudo => {
        if (!ativo) return
        setDados(conteudo)
        setCarregado(true)
      })
      .catch(() => {
        if (ativo) setCarregado(true)
      })
    return () => {
      ativo = false
    }
  }, [])

  // `guestNotice` desligado: o aviso flutuante do shell fala de catálogo e
  // download, fora de contexto aqui, e cobre a barra de compra no celular. A
  // landing já explica, no lugar certo, o que está trancado e como abrir.
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      {!carregado ? (
        <div className="surface-page flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !dados?.catalogo ? (
        // Sem resposta do servidor não dá para mostrar nem a seção nem a
        // vitrine. O portão fecha e explica, em vez de girar para sempre.
        <div className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-heading text-lg font-semibold">Não foi possível carregar Domine Anatomia</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Verifique sua conexão e tente de novo. Se o problema continuar, a seção volta assim que o serviço se
            restabelecer.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            Tentar de novo
          </button>
        </div>
      ) : dados.access?.hasFullAccess ? (
        children(dados)
      ) : (
        <VitrineAnatomia dados={dados} secao={secao} />
      )}
    </AppShell>
  )
}

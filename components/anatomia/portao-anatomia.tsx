'use client'

import { useEffect, useRef, useState } from 'react'
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
  precarregar,
  children,
}: {
  secao: 'hub' | 'atlas' | 'modelos'
  /**
   * Import do conteúdo pago. Sem isto as duas esperas ficam em fila — a página
   * sobe, consulta o acesso e só então começa a baixar o pacote da seção. Com
   * ele, o download começa junto com a consulta, e o veredito chega enquanto o
   * pacote já está vindo. Quem não assina não perde nada: a resposta é a mesma
   * landing, e o pacote baixado em paralelo simplesmente não é montado.
   */
  precarregar?: () => Promise<unknown>
  children: (dados: RespostaAcessoAnatomia) => React.ReactNode
}) {
  const [dados, setDados] = useState<RespostaAcessoAnatomia | null>(null)
  const [carregado, setCarregado] = useState(false)

  // Numa ref para o disparo não depender da identidade da função: quem chama
  // pode passar uma lambda sem que isso refaça a consulta de acesso a cada render.
  const adiantar = useRef(precarregar)
  useEffect(() => {
    adiantar.current?.().catch(() => {})
  }, [])

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

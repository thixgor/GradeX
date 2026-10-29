'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, KeyRound, ShieldCheck } from 'lucide-react'
import { useAuthUser } from '@/hooks/use-auth-user'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { FormularioDeChamado, type ChamadoCriado } from '@/components/suporte/formulario-de-chamado'
import {
  lerChamadosNoAparelho,
  linkLocalDoChamado,
  type ChamadoNoAparelho,
} from '@/components/suporte/chamados-no-aparelho'
import { tempoRelativo } from '@/lib/tickets'
import type { TicketCategory } from '@/lib/types'

/**
 * Antes do formulário, os atalhos que resolvem sem chamado (senha, Serial
 * Key). Depois, o formulário — de conta ou de visitante conforme a sessão.
 * E, para quem já abriu chamado neste aparelho, a lista deles no topo.
 */
export function CentralDeAjuda() {
  const { user, loading } = useAuthUser()
  const router = useRouter()
  const [chamados, setChamados] = useState<ChamadoNoAparelho[]>([])
  const [criado, setCriado] = useState<ChamadoCriado | null>(null)
  const [categoria, setCategoria] = useState<TicketCategory>('outro')
  const [contexto, setContexto] = useState<string | undefined>(undefined)

  useEffect(() => {
    setChamados(lerChamadosNoAparelho())
    // `/suporte?de=/comprar…&assunto=financeiro`: quem chega de um checkout
    // traz a página de origem e o assunto marcados.
    const p = new URLSearchParams(window.location.search)
    const de = p.get('de')
    if (de) setContexto(de.slice(0, 160))
    const assunto = p.get('assunto')
    if (assunto && ['financeiro', 'acesso', 'conteudo', 'bug', 'sugestao', 'outro'].includes(assunto)) {
      setCategoria(assunto as TicketCategory)
    }
  }, [])

  useEffect(() => {
    if (criado?.chave) router.push(linkLocalDoChamado({ id: criado.ticketId, chave: criado.chave }))
    else if (criado) router.push(`/dashboard?suporte=${criado.ticketId}`)
  }, [criado, router])

  return (
    <div className="ck-escopo mx-auto flex max-w-2xl flex-col gap-6">
      <header className="ck-entra flex flex-col items-center gap-4 text-center">
        <LogoAnimada tamanho="compacto" nome={false} inclinacao="local" />
        <div>
          <h1 className="ck-h1">Como podemos ajudar?</h1>
          <p className="ck-sub">Abra um chamado e acompanhe a resposta pelo protocolo — com ou sem conta.</p>
        </div>
      </header>

      {chamados.length > 0 && (
        <section className="ck-vidro ck-entra overflow-hidden" style={{ '--ordem': 1 } as React.CSSProperties} aria-label="Seus chamados">
          <p className="px-4 pb-1 pt-3 text-[13px] font-semibold" style={{ color: 'var(--ck-texto-3)' }}>
            Seus chamados neste aparelho
          </p>
          <ul className="sp-lista">
            {chamados.map((c) => (
              <li key={c.id}>
                <Link href={linkLocalDoChamado(c)} className="sp-item">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{c.titulo || 'Chamado'}</span>
                    <span className="text-xs" style={{ color: 'var(--ck-texto-3)' }}>
                      #{c.protocolo} · aberto {tempoRelativo(new Date(c.em))}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--ck-texto-3)' }} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ck-entra grid gap-2 sm:grid-cols-2" style={{ '--ordem': 2 } as React.CSSProperties} aria-label="Resolva na hora">
        <Link href="/auth/forgot-password" className="sp-ajuda">
          <span className="sp-ajuda-icone" style={{ background: 'linear-gradient(160deg, #5b9bff, #2563eb)' }} aria-hidden>
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1"><strong>Esqueci a senha</strong><br />Troque em um minuto</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <Link href="/ativar" className="sp-ajuda">
          <span className="sp-ajuda-icone" style={{ background: 'linear-gradient(160deg, #5aa66b, #2f6b40)' }} aria-hidden>
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1"><strong>Tenho uma Serial Key</strong><br />Ative o acesso da compra</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
      </section>

      <section className="ck-vidro-forte ck-entra p-5 sm:p-7" style={{ '--ordem': 3 } as React.CSSProperties} aria-label="Abrir um chamado">
        <h2 className="mb-1 font-heading text-xl font-semibold tracking-tight">Abrir um chamado</h2>
        <p className="mb-5 text-sm" style={{ color: 'var(--ck-texto-2)' }}>
          {user
            ? `Você está na conta ${user.email}: o chamado fica no histórico dela.`
            : 'Sem precisar de conta. Use um e-mail que você abre — é por ele que a resposta chega.'}
        </p>
        {loading ? (
          <div className="h-80" aria-hidden />
        ) : (
          <FormularioDeChamado
            key={`${user ? 'conta' : 'visitante'}-${categoria}`}
            modo={user ? 'conta' : 'visitante'}
            contexto={contexto}
            categoriaInicial={categoria}
            emailInicial={user?.email || ''}
            onCriado={setCriado}
            autoFoco={false}
          />
        )}
      </section>
    </div>
  )
}

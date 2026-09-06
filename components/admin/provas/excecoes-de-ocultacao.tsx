'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, UserPlus, X, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  MAXIMO_DE_CONVIDADOS,
  type ExcecoesDeOcultacao,
} from '@/lib/provas/visibilidade-da-prova'
import { cn } from '@/lib/utils'

/**
 * Quem enxerga a prova enquanto ela está oculta.
 *
 * ## O que faltava
 *
 * Ocultar era tudo ou nada: a prova sumia para todos menos admin e criador.
 * O caso real que isso não atendia é a prova pronta que ainda não é da turma,
 * mas precisa ser vista por alguém — o professor que vai conferir, o monitor
 * que testa o cronômetro, os dois alunos da segunda chamada.
 *
 * ## Duas exceções que não são a mesma coisa
 *
 * "Admins" é sobre a VITRINE: se a prova oculta aparece no catálogo (`/provas`)
 * de quem administra. Desligar serve para ver a plataforma como o aluno a vê;
 * a prova continua editável no painel, porque isso não é uma permissão, é uma
 * preferência de exibição.
 *
 * "Convidados" é sobre ACESSO: para essas pessoas a prova oculta existe por
 * inteiro — elas a veem na lista, abrem e fazem. É decidido no servidor, e
 * passa por cima até do público-alvo: quem foi chamado por nome não precisa
 * ser do período certo.
 */

interface UsuarioEncontrado {
  id: string
  name: string
  email: string
}

export function ExcecoesDeOcultacao({
  valor,
  onChange,
  desabilitado,
}: {
  valor: ExcecoesDeOcultacao
  onChange: (proximo: ExcecoesDeOcultacao) => void
  desabilitado?: boolean
}) {
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<UsuarioEncontrado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  /*
   * Os nomes de quem já está convidado.
   *
   * A lista guarda ids — é o que o servidor compara —, mas uma tela que mostra
   * `68f3a1...` para dizer quem foi convidado não informa nada. Quem vem do
   * banco é resolvido uma vez pelo efeito abaixo; quem é clicado na busca já
   * chega com nome.
   */
  const [nomes, setNomes] = useState<Record<string, UsuarioEncontrado>>({})

  const ultimaBusca = useRef(0)

  /*
   * Os ids que chegaram do banco viram nomes uma vez, ao abrir.
   *
   * Sem isto, reabrir uma prova com convidados mostraria `68f3a1...` no lugar
   * de quem foi convidado — a lista existiria e não informaria nada. Roda só
   * para os ids cujo nome ainda não se conhece, então clicar em alguém na
   * busca não dispara requisição nenhuma.
   */
  const idsPendentes = valor.usuarios.filter((id) => !nomes[id]).join(',')
  useEffect(() => {
    if (!idsPendentes) return
    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/users/search?ids=${encodeURIComponent(idsPendentes)}`)
        const dados = await res.json().catch(() => ({}))
        if (cancelado || !res.ok || !Array.isArray(dados.users)) return
        setNomes((atuais) => {
          const proximos = { ...atuais }
          for (const usuario of dados.users as UsuarioEncontrado[]) proximos[usuario.id] = usuario
          return proximos
        })
      } catch {
        // Sem nome, o chip cai no id — feio, mas não impede remover ninguém.
      }
    })()
    return () => {
      cancelado = true
    }
  }, [idsPendentes])

  useEffect(() => {
    const alvo = termo.trim()
    if (alvo.length < 2) {
      setResultados([])
      return
    }

    // Espera a digitação parar: uma requisição por tecla faria a busca
    // responder a "mar" enquanto a pessoa já digitou "mariana".
    const id = window.setTimeout(async () => {
      const meu = ++ultimaBusca.current
      setBuscando(true)
      setErro(null)
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(alvo)}`)
        const dados = await res.json().catch(() => ({}))
        // Resposta de uma busca antiga não sobrescreve a atual.
        if (meu !== ultimaBusca.current) return
        if (!res.ok) throw new Error(dados?.error || 'Não foi possível buscar usuários')
        setResultados(Array.isArray(dados.users) ? dados.users : [])
      } catch (e: any) {
        if (meu !== ultimaBusca.current) return
        setErro(e?.message || 'Não foi possível buscar usuários')
        setResultados([])
      } finally {
        if (meu === ultimaBusca.current) setBuscando(false)
      }
    }, 350)

    return () => window.clearTimeout(id)
  }, [termo])

  function convidar(usuario: UsuarioEncontrado) {
    if (valor.usuarios.includes(usuario.id)) return
    if (valor.usuarios.length >= MAXIMO_DE_CONVIDADOS) {
      setErro(`O limite é de ${MAXIMO_DE_CONVIDADOS} convidados. Para uma turma inteira, use o público-alvo.`)
      return
    }
    setNomes((atuais) => ({ ...atuais, [usuario.id]: usuario }))
    onChange({ ...valor, usuarios: [...valor.usuarios, usuario.id] })
    setTermo('')
    setResultados([])
    setErro(null)
  }

  function remover(id: string) {
    onChange({ ...valor, usuarios: valor.usuarios.filter((u) => u !== id) })
    setErro(null)
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div>
        <h4 className="text-sm font-semibold">Exceções da ocultação</h4>
        <p className="text-xs text-muted-foreground">
          Para todo mundo que não estiver aqui, a prova simplesmente não existe: ela some da lista
          e não pode ser aberta nem respondida.
        </p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={valor.admins}
          disabled={desabilitado}
          onChange={(e) => onChange({ ...valor, admins: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span className="text-sm">
          Mostrar no catálogo dos administradores
          <span className="block text-xs text-muted-foreground">
            Desligado, a prova some de <code>/provas</code> também para admins — útil para conferir
            a tela como o aluno a vê. Você continua editando a prova normalmente por aqui.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Convidados ({valor.usuarios.length})
        </Label>

        {valor.usuarios.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {valor.usuarios.map((id) => {
              const pessoa = nomes[id]
              return (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-1 text-xs"
                >
                  <span className="max-w-[200px] truncate">
                    {pessoa ? pessoa.name || pessoa.email : id}
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(id)}
                    disabled={desabilitado}
                    aria-label={`Remover ${pessoa?.name || id}`}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={termo}
            disabled={desabilitado}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="w-full rounded-xl border border-border/60 bg-background py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {buscando && (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}

        {resultados.length > 0 && (
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-background">
            {resultados.map((usuario) => {
              const jaEsta = valor.usuarios.includes(usuario.id)
              return (
                <li key={usuario.id}>
                  <button
                    type="button"
                    onClick={() => convidar(usuario)}
                    disabled={desabilitado || jaEsta}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50',
                      jaEsta && 'cursor-default',
                    )}
                  >
                    <UserPlus className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{usuario.name || '(sem nome)'}</span>
                      <span className="block truncate text-xs text-muted-foreground">{usuario.email}</span>
                    </span>
                    {jaEsta && <span className="text-[10px] text-muted-foreground">já convidado</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {termo.trim().length >= 2 && !buscando && resultados.length === 0 && !erro && (
          <p className="text-xs text-muted-foreground">Ninguém encontrado com esse nome ou e-mail.</p>
        )}
      </div>
    </div>
  )
}

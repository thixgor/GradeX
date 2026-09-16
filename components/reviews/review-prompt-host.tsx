'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { ReviewPrompt } from './review-prompt'
import {
  EVENTO_CONVITE,
  limparConvitePendente,
  lerConvitePendente,
  examinarRegrasLocais,
  relatar,
  registrarEnvio,
  registrarExibicao,
  registrarInelegivel,
  registrarRecusa,
  registrarSilencioDefinitivo,
  type ConviteDeAvaliacao,
} from '@/lib/reviews-prompt'

/**
 * O porteiro do convite de avaliação.
 *
 * Fica montado no chrome do app (`components/app-chrome.tsx`), fora de qualquer
 * página: é por isso que ele sobrevive à navegação que acontece quando a pessoa
 * fecha o material — e é justamente nesse instante que o convite nasce.
 *
 * Três filtros, do mais barato ao mais caro:
 *
 * 1. **A rota.** Há telas onde interromper é inaceitável: prova em andamento,
 *    checkout, login. O convite espera.
 * 2. **O histórico local.** Cota diária, adiamentos e recusas — tudo resolvido
 *    em `lib/reviews-prompt.ts`, sem rede.
 * 3. **O servidor.** Só então perguntamos se esta pessoa pode mesmo avaliar
 *    este item (acesso válido, sem avaliação anterior, avaliações destravadas).
 *
 * Só depois dos três a folha aparece — e com um respiro, para não brotar no
 * mesmo quadro em que a tela anterior ainda está saindo.
 */

interface Elegibilidade {
  podeAvaliar: boolean
  titulo?: string | null
  capa?: string | null
  resumo?: { media: number; total: number } | null
}

/** Um segundo entre chegar na tela e ser interrompido. */
const ESPERA_ANTES_DE_ABRIR = 1000

/** Traduz o veredito do servidor para o diagnóstico. */
const EXPLICACAO_DO_SERVIDOR: Record<string, string> = {
  nao_autenticado: 'Ninguém logado nesta sessão.',
  nao_encontrado: 'O item não existe mais (ou o id não bate).',
  travado: 'As avaliações deste item estão desativadas no admin (reviewsLocked).',
  ja_avaliou: 'Esta conta JÁ avaliou este item — por isso nada aparece. Apague a avaliação para testar de novo.',
  sem_acesso: 'Esta conta não tem acesso ao item (avaliar exige acesso).',
  erro: 'A rota de elegibilidade quebrou — ver o log do servidor.',
}

/**
 * Onde o convite nunca aparece. Prova e checkout são dinheiro e nota da pessoa;
 * as rotas de leitura ficam de fora porque o convite é sobre o que ela ACABOU
 * de fechar — aparecer por cima do próximo material é o mesmo erro, invertido.
 */
const ROTAS_PROIBIDAS = [
  '/auth',
  '/exam',
  '/checkout',
  '/compra',
  '/comprar',
  '/buy',
  '/pacotes',
  '/materiais/checkout',
  '/instalar',
  '/offline',
]

function rotaBloqueada(pathname: string | null): boolean {
  if (!pathname) return true
  if (pathname === '/') return true // landing: visitante, não aluno
  if (ROTAS_PROIBIDAS.some(rota => pathname === rota || pathname.startsWith(`${rota}/`))) return true
  // Leitores em tela cheia: /materiais/[id]/viewer, /html, /complementary/...
  if (/^\/materiais\/[^/]+\/(viewer|html|complementary)/.test(pathname)) return true
  return false
}

export function ReviewPromptHost() {
  const pathname = usePathname()
  const [convite, setConvite] = useState<ConviteDeAvaliacao | null>(null)
  const [dados, setDados] = useState<Elegibilidade | null>(null)
  // Contador de despertar. Um convite pode nascer SEM navegação — sair do
  // estudo de flashcards troca de estado, não de rota — e nesse caso o
  // `pathname` não muda e o efeito abaixo nunca rodaria de novo. Mexer neste
  // número é o que acorda o porteiro.
  const [rodada, setRodada] = useState(0)
  const pendenteRef = useRef<ConviteDeAvaliacao | null>(null)
  const verificandoRef = useRef(false)
  const temporizadorRef = useRef<number | null>(null)

  const limparTemporizador = () => {
    if (temporizadorRef.current !== null) {
      window.clearTimeout(temporizadorRef.current)
      temporizadorRef.current = null
    }
  }

  const fechar = useCallback(() => {
    setConvite(null)
    setDados(null)
    limparConvitePendente()
    pendenteRef.current = null
  }, [])

  /** Confirma com o servidor e, se tudo bate, abre a folha. */
  const avaliarConvite = useCallback(async (candidato: ConviteDeAvaliacao) => {
    if (verificandoRef.current) return

    const veredicto = examinarRegrasLocais(candidato.targetType, candidato.targetId)
    if (!veredicto.permitido) {
      relatar('convite na fila barrado pelas regras locais', {
        item: candidato.titulo,
        motivo: veredicto.motivo,
        porque: veredicto.explicacao,
        liberaEm: veredicto.liberaEm,
      })
      limparConvitePendente()
      pendenteRef.current = null
      return
    }

    verificandoRef.current = true
    try {
      const params = new URLSearchParams({
        targetType: candidato.targetType,
        targetId: candidato.targetId,
      })
      const res = await fetch(`/api/reviews/elegibilidade?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        relatar('consulta de elegibilidade falhou', { status: res.status })
        return
      }

      const json = (await res.json()) as Elegibilidade & { motivo?: string }
      if (!json.podeAvaliar) {
        relatar('servidor recusou o convite', {
          item: candidato.titulo,
          motivo: json.motivo,
          porque: EXPLICACAO_DO_SERVIDOR[json.motivo || ''] || 'Motivo não informado.',
        })
        // Motivos definitivos (já avaliou, sem acesso, travado) tiram o item da
        // fila para sempre. Erro de rede ou sessão expirada, não: pode ser só
        // um momento ruim, e o convite volta noutro dia.
        if (json.motivo === 'ja_avaliou' || json.motivo === 'sem_acesso' || json.motivo === 'travado') {
          registrarInelegivel(candidato.targetType, candidato.targetId)
        }
        limparConvitePendente()
        pendenteRef.current = null
        return
      }

      limparTemporizador()
      relatar('convite aprovado — abrindo a folha', { item: candidato.titulo })
      temporizadorRef.current = window.setTimeout(() => {
        registrarExibicao(candidato.targetType, candidato.targetId)
        setDados(json)
        setConvite(candidato)
        limparConvitePendente()
        pendenteRef.current = null
      }, ESPERA_ANTES_DE_ABRIR)
    } catch {
      /* rede fora: o convite continua pendente e tenta na próxima navegação */
    } finally {
      verificandoRef.current = false
    }
  }, [])

  // Um convite recém-criado chega pelo evento; um criado enquanto a pessoa
  // trocava de página (ou numa aba recarregada) é achado no sessionStorage.
  useEffect(() => {
    const aoReceber = (evento: Event) => {
      const detalhe = (evento as CustomEvent<ConviteDeAvaliacao>).detail
      if (!detalhe?.targetId) return
      pendenteRef.current = detalhe
      setRodada(atual => atual + 1)
    }
    window.addEventListener(EVENTO_CONVITE, aoReceber)
    return () => window.removeEventListener(EVENTO_CONVITE, aoReceber)
  }, [])

  useEffect(() => {
    if (convite) return
    if (rotaBloqueada(pathname)) {
      // Não descarta o convite: a pessoa pode ter fechado o material e caído
      // numa rota silenciosa. Ele espera a próxima tela que aceite convites.
      if (pendenteRef.current || lerConvitePendente()) {
        relatar('convite em espera: esta rota não exibe convites', { rota: pathname })
      }
      limparTemporizador()
      return
    }

    const candidato = pendenteRef.current || lerConvitePendente()
    if (!candidato) return
    pendenteRef.current = candidato
    avaliarConvite(candidato)

    return limparTemporizador
  }, [pathname, rodada, convite, avaliarConvite])

  useEffect(() => limparTemporizador, [])

  // O `AnimatePresence` fica montado o tempo todo, mesmo sem convite: se ele
  // desaparecesse junto com a folha, não sobraria ninguém para tocar a animação
  // de saída — a folha sumiria de um quadro para o outro.
  return (
    <AnimatePresence>
      {convite && (
      <ReviewPrompt
        key={`${convite.targetType}:${convite.targetId}`}
        convite={convite}
        titulo={dados?.titulo}
        capa={dados?.capa}
        resumo={dados?.resumo}
        onEnviado={() => {
          registrarEnvio(convite.targetType, convite.targetId)
          fechar()
        }}
        onAgoraNao={() => {
          registrarRecusa(convite.targetType, convite.targetId)
          fechar()
        }}
        onNuncaMais={() => {
          registrarSilencioDefinitivo()
          fechar()
        }}
        onInvalido={() => {
          registrarInelegivel(convite.targetType, convite.targetId)
          fechar()
        }}
      />
      )}
    </AnimatePresence>
  )
}

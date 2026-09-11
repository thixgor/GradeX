'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Mail, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BarraInferior } from '@/components/ui/barra-inferior'
import {
  ehDestinoInterno,
  partirEmNegrito,
  type PitchMontado,
} from '@/lib/provas/pitch-de-vendas'
import { cn } from '@/lib/utils'

/**
 * O convite que aparece quando a prova acaba.
 *
 * ## O que ele resolve
 *
 * A tela de fim de prova terminava em "Voltar para Início". A pessoa acabava
 * de passar duas horas estudando de graça, era a visitante mais interessada do
 * dia, e a plataforma se despedia dela sem dizer nada. Este cartão é o que
 * passa a ser dito — e o conteúdo dele é decidido por quem aplica a prova, em
 * `/admin/exams`.
 *
 * ## Onde ele fica, e por que mudou de lugar
 *
 * Na primeira versão o cartão fechava a tela, depois de tudo. A intenção era
 * educada — responder primeiro o que a pessoa veio buscar — e a aritmética
 * era outra: entre a nota e o fim da página existe o gabarito comentado, que
 * numa prova de sessenta questões são várias telas de rolagem. O convite
 * ficava a seis arrastadas de distância de qualquer olho. **Convite que
 * ninguém vê não é discreto, é inexistente.**
 *
 * Agora ele entra logo depois do resultado e antes do gabarito: a pergunta
 * "quanto eu fiz?" já foi respondida, e a pessoa está exatamente no segundo em
 * que decide o que fazer a seguir. Nada do que vem antes dele foi empurrado
 * para baixo — o que vem depois é revisão, que quem quer revisar procura.
 *
 * ## Por que ele não é verde
 *
 * A tela inteira do fim de prova é verde: o selo de entregue, o anel da nota,
 * os cartões de acerto. Um cartão verde no meio disso é mais do mesmo — o olho
 * passa por cima porque já catalogou aquela cor como "confirmação". O âmbar é
 * a cor de AÇÃO da marca (a mesma do botão dos e-mails), e é o que separa "deu
 * tudo certo" de "tem uma coisa aqui para você".
 *
 * ## A regra do destino
 *
 * Todo botão daqui usa `router.push`. Nenhum usa `window.open`, `<a
 * target="_blank">` ou endereço absoluto — e `ehDestinoInterno` confere cada
 * rota antes de desenhar o botão, porque ela chega do servidor e o servidor a
 * leu do banco.
 *
 * O motivo é onde o aluno está: boa parte entra pelo aplicativo instalado. Ali
 * um link externo abre uma aba do navegador POR CIMA do app — a pessoa sai do
 * aplicativo para ver a página de planos e, quando volta, perdeu o lugar. Uma
 * navegação interna troca a seção sem sair de casa. É a diferença entre
 * convidar alguém para outro cômodo e empurrá-lo para a rua.
 *
 * ## Por que o texto vem pronto do servidor
 *
 * Duas frases do pitch dependem de fatos que esta tela não pode conhecer: o
 * número real de contas (prova social) e o aproveitamento da pessoa, que numa
 * prova avaliativa fica preso até o término. Ver
 * `app/api/exams/[id]/pitch/route.ts`. Aqui só se desenha.
 *
 * ## Quando ele não aparece
 *
 * Enquanto a resposta não chega, e sempre que ela vier vazia: prova sem pitch,
 * pitch desligado, pitch sem destino, ou uma conta que já assina. Um cartão de
 * esqueleto para um convite que talvez nem exista seria pior do que o silêncio.
 */

interface PitchDeVendasDaProvaProps {
  examId: string
  className?: string
}

interface RespostaDoPitch {
  pitch: PitchMontado | null
  email?: boolean
}

/** Um parágrafo do pitch, com os trechos entre `**` em negrito. */
function Paragrafo({ texto, className }: { texto: string; className?: string }) {
  return (
    <p className={className}>
      {partirEmNegrito(texto).map((pedaco, posicao) =>
        pedaco.forte ? (
          <strong key={posicao} className="font-semibold text-foreground">
            {pedaco.texto}
          </strong>
        ) : (
          <span key={posicao}>{pedaco.texto}</span>
        ),
      )}
    </p>
  )
}

export function PitchDeVendasDaProva({ examId, className }: PitchDeVendasDaProvaProps) {
  const router = useRouter()
  const [pitch, setPitch] = useState<PitchMontado | null>(null)
  /**
   * O aviso do e-mail só aparece depois que o servidor confirma que ele saiu.
   *
   * Prometer na tela um e-mail que a fila engoliu é pior do que não prometer
   * nada: a pessoa vai procurar na caixa de entrada. Aqui a frase só é escrita
   * quando a rota responde `enviado: true` — e quem já recebeu numa visita
   * anterior recebe `false`, sem repetir o aviso.
   */
  const [emailSaiu, setEmailSaiu] = useState(false)
  /**
   * O cartão saiu da tela? É o gatilho da barra de rodapé.
   *
   * Começa `false` — antes de o observador falar pela primeira vez, o cartão
   * está por definição onde acabou de ser desenhado, e uma barra piscando no
   * rodapé no instante em que o pitch chega seria a interrupção que ele não é.
   */
  const [foraDeVista, setForaDeVista] = useState(false)
  const [barraDispensada, setBarraDispensada] = useState(false)
  /**
   * O e-mail é pedido uma vez por montagem, no máximo.
   *
   * A trava de verdade é do servidor (`pitchEmailEnviadoEm` na entrega); esta
   * aqui só evita a segunda requisição inútil do modo estrito do React em
   * desenvolvimento, que monta cada efeito duas vezes.
   */
  const emailPedido = useRef(false)
  const cartaoRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!examId) return
    let cancelado = false

    ;(async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/pitch`, { cache: 'no-store' })
        if (!res.ok) return
        const dados = (await res.json()) as RespostaDoPitch
        if (cancelado || !dados?.pitch) return

        setPitch(dados.pitch)

        if (dados.email && !emailPedido.current) {
          emailPedido.current = true
          // Sem `await`: o e-mail é um acréscimo, e o cartão já está na tela
          // enquanto ele sai. Uma falha aqui não vira aviso nenhum — não há
          // nada que a pessoa possa fazer a respeito.
          fetch(`/api/exams/${examId}/pitch/email`, { method: 'POST' })
            .then((resposta) => (resposta.ok ? resposta.json() : null))
            .then((corpo) => {
              if (!cancelado && corpo?.enviado) setEmailSaiu(true)
            })
            .catch(() => undefined)
        }
      } catch {
        // Sem pitch, a tela de fim de prova continua exatamente como era.
      }
    })()

    return () => {
      cancelado = true
    }
  }, [examId])

  /*
   * A barra do rodapé é acionada pelo próprio cartão, e não pela rolagem.
   *
   * Ler `scrollY` exigiria escolher um número ("depois de 600px") que estaria
   * errado em metade das provas — a altura do que vem antes do gabarito muda
   * com o tipo de prova, com a nota presa, com as discursivas pendentes. O
   * observador pergunta a coisa certa: o convite ainda está onde a pessoa
   * consegue vê-lo? Quando a página é curta o bastante para o cartão nunca
   * sair da tela, a barra nunca aparece — sem nenhuma regra a mais.
   */
  useEffect(() => {
    const cartao = cartaoRef.current
    if (!cartao || typeof IntersectionObserver === 'undefined') return

    const observador = new IntersectionObserver(
      ([entrada]) => setForaDeVista(!entrada.isIntersecting),
      /*
        A margem negativa no topo sobe o gatilho: a barra entra quando sobra
        só uma tira do cartão encostada no topo da tela, e não quando ele
        desaparece por completo. Esperar o sumiço total abre um intervalo de
        algumas centenas de pixels em que nem o cartão nem a barra chamam —
        que é exatamente o buraco que esta barra existe para tapar.
      */
      { rootMargin: '-80px 0px 0px 0px' },
    )
    observador.observe(cartao)
    return () => observador.disconnect()
  }, [pitch])

  const irPara = useCallback((href: string) => router.push(href), [router])

  if (!pitch) return null

  const destinos = pitch.destinos.filter((destino) => ehDestinoInterno(destino.href))
  if (destinos.length === 0) return null

  const principal = destinos[0]
  const secundarios = destinos.slice(1)
  const chamada = pitch.chamada || `Ver ${principal.rotulo}`

  return (
    <>
      <div
        ref={cartaoRef}
        className={cn(
          'exam-resultado-entra relative overflow-hidden rounded-2xl shadow-lg',
          // Âmbar, não verde: ver o cabeçalho. A borda mais forte e a barra do
          // topo são o que separa este bloco dos cartões de resultado, que são
          // todos `border-border/50`.
          'border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background/70 to-orange-500/5 backdrop-blur-md',
          className,
        )}
        style={{ '--exam-ordem': 0 } as React.CSSProperties}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative space-y-4 p-6 sm:p-8">
          {pitch.selo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3 w-3" />
              {pitch.selo}
            </span>
          )}

          {pitch.titulo && (
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
              {pitch.titulo}
            </h2>
          )}

          <div className="space-y-3">
            {pitch.paragrafos.map((paragrafo, indice) => (
              <Paragrafo
                key={indice}
                texto={paragrafo}
                className={cn(
                  'leading-relaxed text-muted-foreground',
                  // O primeiro parágrafo carrega o argumento e é o único que
                  // muita gente vai ler inteiro. Os outros entram um ponto
                  // menores, para a leitura ter um começo óbvio.
                  indice === 0 ? 'text-base sm:text-[17px]' : 'text-[15px]',
                )}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              size="lg"
              /*
                Sem `exam-botao-chama` (o halo pulsante da tela de início): o
                halo é verde fixo no CSS, e essa classe é do botão que a pessoa
                está ESPERANDO — "Iniciar Prova Agora". Pulsar um convite de
                venda é o gesto que faz o convite parecer anúncio.
              */
              className="w-full rounded-xl bg-amber-500 font-semibold text-amber-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 sm:w-auto"
              // `router.push`, nunca `window.open`: dentro do aplicativo, abrir
              // aba tira a pessoa de onde ela está. Ver o cabeçalho.
              onClick={() => irPara(principal.href)}
            >
              {chamada}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {secundarios.map((destino) => (
              <Button
                key={destino.chave}
                size="lg"
                variant="outline"
                className="w-full rounded-xl border-amber-500/30 sm:w-auto"
                onClick={() => irPara(destino.href)}
                title={destino.descricao}
              >
                {destino.rotulo}
              </Button>
            ))}
          </div>

          {secundarios.length === 0 && (
            <p className="text-xs text-muted-foreground/80">{principal.descricao}</p>
          )}

          {/*
            O aviso do e-mail é aviso, não argumento — daí o tamanho e o tom.
            Dizer que a mensagem saiu, no instante em que ela sai, é a diferença
            entre um e-mail esperado e um e-mail que aparece do nada na caixa de
            entrada duas horas depois.
          */}
          {emailSaiu && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              Mandamos um resumo disto para o e-mail da sua conta.
            </p>
          )}
        </div>
      </div>

      {/*
        A segunda chance, para quem desceu o gabarito inteiro.

        Ela não é uma repetição do cartão: é só a ação, numa faixa de uma linha,
        e some no X. Quem leu as sessenta questões comentadas é a pessoa mais
        interessada que esta tela vai ter — e é justamente ela que, ao terminar
        a leitura, está a seis telas de distância do convite.

        `BarraInferior` publica a própria altura em `--gx-barra-inferior-h`, e é
        assim que o chat de suporte e os botões flutuantes sobem junto em vez de
        ficar por baixo. Ver components/ui/barra-inferior.tsx.
      */}
      {foraDeVista && !barraDispensada && (
        <BarraInferior>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-sm font-semibold text-foreground">{pitch.titulo}</p>
            {pitch.paragrafos[0] && (
              <p className="truncate text-xs text-muted-foreground">
                {pitch.paragrafos[0].replace(/\*\*/g, '')}
              </p>
            )}
          </div>

          <Button
            className="flex-1 rounded-xl bg-amber-500 font-semibold text-amber-950 hover:bg-amber-400 sm:flex-none"
            onClick={() => irPara(principal.href)}
          >
            {chamada}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground"
            aria-label="Dispensar"
            onClick={() => setBarraDispensada(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </BarraInferior>
      )}
    </>
  )
}

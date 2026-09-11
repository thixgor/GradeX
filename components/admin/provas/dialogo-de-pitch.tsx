'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  Mail,
  Megaphone,
  Sparkles,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import {
  DESTINOS_DO_PITCH,
  LIMITE_DE_ASSUNTO,
  LIMITE_DE_CHAMADA,
  LIMITE_DE_TEXTO,
  LIMITE_DE_TITULO,
  MAXIMO_DE_DESTINOS,
  MODELOS_DE_PITCH,
  MODELO_POR_CHAVE,
  partirEmNegrito,
  pitchDaProva,
  pitchEstaCompleto,
  type ChaveDeModeloDePitch,
  type PitchDeVendas,
  type PitchMontado,
} from '@/lib/provas/pitch-de-vendas'
import type { Exam } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Onde o admin liga — e escreve — o pitch de fim de prova.
 *
 * ## A ordem da tela é a ordem das perguntas
 *
 * 1. **Esta prova vende alguma coisa?** A chave mestra, desligada por padrão.
 *    Enquanto ela estiver desligada, o resto fica visível mas apagado: dá para
 *    montar o pitch inteiro antes de publicá-lo.
 * 2. **Para onde?** Os destinos, que são SEÇÕES do site — nunca links. O
 *    primeiro escolhido vira o botão principal do cartão.
 * 3. **Falando como?** Os modelos, cada um com a técnica que aplica e a
 *    explicação do porquê. Quem quiser escrever o próprio texto escolhe o
 *    último.
 * 4. **E um e-mail?** Opcional, desligado, com assunto próprio se o admin
 *    quiser.
 *
 * ## Por que a prévia vem do servidor
 *
 * Duas frases do pitch usam números reais (quantas contas existem; quanto o
 * aluno acertou). Desenhar aqui uma prévia com números de mentira ensinaria o
 * admin a esperar um texto que o aluno nunca vai ler. A prévia é pedida a
 * `POST /api/exams/[id]/pitch`, a mesma função que escreve o pitch de verdade.
 */

interface DialogoDePitchProps {
  /** A prova em edição, ou `null` com o diálogo fechado. */
  prova: Exam | null
  salvando: boolean
  onSalvar: (prova: Exam, pitch: PitchDeVendas) => void
  onFechar: () => void
}

const CORES_DO_MODELO: Record<ChaveDeModeloDePitch, string> = {
  'prova-social': 'border-blue-500/40 bg-blue-500/5',
  autoridade: 'border-violet-500/40 bg-violet-500/5',
  emocional: 'border-rose-500/40 bg-rose-500/5',
  logica: 'border-amber-500/40 bg-amber-500/5',
  valores: 'border-emerald-500/40 bg-emerald-500/5',
  'escassez-honesta': 'border-orange-500/40 bg-orange-500/5',
  personalizado: 'border-slate-500/40 bg-slate-500/5',
}

export function DialogoDePitch({ prova, salvando, onSalvar, onFechar }: DialogoDePitchProps) {
  const [pitch, setPitch] = useState<PitchDeVendas>(() => pitchDaProva(prova))
  const [previa, setPrevia] = useState<PitchMontado | null>(null)
  const [montandoPrevia, setMontandoPrevia] = useState(false)

  const provaId = prova?._id?.toString() || ''

  // Cada abertura recomeça do que está gravado: um rascunho não salvo que
  // sobrevivesse ao fechamento reapareceria depois como se fosse o estado real
  // da prova.
  useEffect(() => {
    setPitch(pitchDaProva(prova))
    setPrevia(null)
  }, [prova])

  const modelo = MODELO_POR_CHAVE.get(pitch.modelo)
  const completo = pitchEstaCompleto({ ...pitch, ativo: true })

  const alternarDestino = useCallback((chave: string) => {
    setPitch((atual) => {
      if (atual.destinos.includes(chave)) {
        return { ...atual, destinos: atual.destinos.filter((item) => item !== chave) }
      }
      if (atual.destinos.length >= MAXIMO_DE_DESTINOS) return atual
      return { ...atual, destinos: [...atual.destinos, chave] }
    })
  }, [])

  /*
   * A prévia é pedida depois que o admin para de mexer.
   *
   * Sem a espera, escolher um modelo e digitar um título disparariam uma
   * requisição por tecla — e cada uma delas conta contas no banco para montar
   * a prova social.
   */
  const pedidoRef = useRef(0)
  const assinaturaDoPitch = useMemo(() => JSON.stringify(pitch), [pitch])

  useEffect(() => {
    if (!provaId || !completo) {
      setPrevia(null)
      return
    }

    const meuPedido = ++pedidoRef.current
    const relogio = setTimeout(async () => {
      setMontandoPrevia(true)
      try {
        const res = await fetch(`/api/exams/${provaId}/pitch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // `ativo: true` para a prévia existir mesmo antes de publicar: aqui
          // a pergunta é "como ficaria", não "está no ar".
          body: JSON.stringify({ pitchDeVendas: { ...JSON.parse(assinaturaDoPitch), ativo: true } }),
        })
        const dados = await res.json().catch(() => ({}))
        if (pedidoRef.current === meuPedido) setPrevia(dados?.pitch ?? null)
      } catch {
        if (pedidoRef.current === meuPedido) setPrevia(null)
      } finally {
        if (pedidoRef.current === meuPedido) setMontandoPrevia(false)
      }
    }, 700)

    return () => clearTimeout(relogio)
  }, [provaId, completo, assinaturaDoPitch])

  if (!prova) return null

  const desligado = !pitch.ativo

  return (
    <Dialog open={!!prova} onOpenChange={(aberto) => { if (!aberto && !salvando) onFechar() }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="border-b">
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Pitch de vendas
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            O que <strong className="text-foreground">{prova.title}</strong> diz ao aluno no
            instante em que ele termina — e para qual seção do site ele vai a partir dali.
          </p>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-7 overflow-y-auto p-6">
          {/* ── 1. A chave mestra ─────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/30 p-4">
            <div>
              <p className="font-semibold">Mostrar o pitch ao terminar a prova</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nasce desligado. Enquanto estiver desligado, a prova termina como sempre
                terminou — você pode montar tudo aqui antes de publicar.
              </p>
            </div>
            <ToggleSwitch
              checked={pitch.ativo}
              onChange={(valor) => setPitch((atual) => ({ ...atual, ativo: valor }))}
            />
          </div>

          <div className={cn('space-y-7 transition-opacity', desligado && 'opacity-60')}>
            {/* ── 2. Destinos ─────────────────────────────────────────── */}
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Para onde o aluno vai</h3>
                <p className="text-sm text-muted-foreground">
                  Cada opção é uma <strong className="text-foreground">seção deste site</strong>,
                  aberta por dentro do aplicativo — sem abrir aba nova, sem tirar o aluno de onde
                  ele está. O primeiro escolhido vira o botão principal. Até {MAXIMO_DE_DESTINOS}.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DESTINOS_DO_PITCH.map((destino) => {
                  const posicao = pitch.destinos.indexOf(destino.chave)
                  const escolhido = posicao >= 0
                  const cheio = !escolhido && pitch.destinos.length >= MAXIMO_DE_DESTINOS

                  return (
                    <button
                      key={destino.chave}
                      type="button"
                      disabled={cheio}
                      onClick={() => alternarDestino(destino.chave)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                        escolhido
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-border hover:bg-muted/50',
                        cheio && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                          escolhido
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-muted-foreground/30 text-transparent',
                        )}
                      >
                        {escolhido ? posicao + 1 : '0'}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{destino.rotulo}</span>
                        <span className="block text-xs leading-snug text-muted-foreground">
                          {destino.descricao}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground/70">
                          {destino.href}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {pitch.ativo && pitch.destinos.length === 0 && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  Sem destino escolhido o cartão não aparece para ninguém — um convite precisa de
                  um lugar para onde convidar.
                </p>
              )}
            </section>

            {/* ── 3. Modelo ───────────────────────────────────────────── */}
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Como o convite é feito</h3>
                <p className="text-sm text-muted-foreground">
                  Cada modelo aplica uma técnica de persuasão diferente. Nenhum deles inventa
                  prazo, vaga ou número — o que eles dizem sobre a plataforma é verificável.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODELOS_DE_PITCH.map((opcao) => {
                  const escolhido = pitch.modelo === opcao.chave
                  return (
                    <button
                      key={opcao.chave}
                      type="button"
                      onClick={() => setPitch((atual) => ({ ...atual, modelo: opcao.chave }))}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        escolhido
                          ? CORES_DO_MODELO[opcao.chave]
                          : 'border-border hover:bg-muted/50',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{opcao.nome}</span>
                        {escolhido && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                        {opcao.tecnica}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                        {opcao.principio}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* A explicação longa do modelo escolhido: quem está decidindo
                  merece saber o que está escolhendo, não só o nome bonito. */}
              {modelo && (
                <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
                  <p className="text-muted-foreground">{modelo.comoFunciona}</p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Quando usar: </strong>
                    {modelo.quandoUsar}
                  </p>
                </div>
              )}
            </section>

            {/* ── 3b. Texto livre ─────────────────────────────────────── */}
            {pitch.modelo === 'personalizado' && (
              <section className="space-y-3 rounded-xl border border-dashed p-4">
                <div>
                  <h3 className="font-semibold">Seu texto</h3>
                  <p className="text-sm text-muted-foreground">
                    Linha em branco separa parágrafos. Cerque com{' '}
                    <code className="rounded bg-muted px-1 text-xs">**dois asteriscos**</code> o que
                    deve sair em negrito.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pitch-titulo">Título</Label>
                  <Input
                    id="pitch-titulo"
                    value={pitch.personalizado.titulo}
                    maxLength={LIMITE_DE_TITULO}
                    placeholder="Ex.: A turma de setembro abre na segunda"
                    onChange={(evento) =>
                      setPitch((atual) => ({
                        ...atual,
                        personalizado: { ...atual.personalizado, titulo: evento.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pitch-texto">Texto</Label>
                  <textarea
                    id="pitch-texto"
                    value={pitch.personalizado.texto}
                    maxLength={LIMITE_DE_TEXTO}
                    rows={6}
                    className="w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder={
                      'Você terminou a prova de graça — e é exatamente por isso que ela existe.\n\n' +
                      'As **inscrições da turma de setembro** fecham no dia 20.'
                    }
                    onChange={(evento) =>
                      setPitch((atual) => ({
                        ...atual,
                        personalizado: { ...atual.personalizado, texto: evento.target.value },
                      }))
                    }
                  />
                  <p className="text-right text-[11px] text-muted-foreground">
                    {pitch.personalizado.texto.length}/{LIMITE_DE_TEXTO}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pitch-chamada">Botão</Label>
                  <Input
                    id="pitch-chamada"
                    value={pitch.personalizado.chamada}
                    maxLength={LIMITE_DE_CHAMADA}
                    placeholder="Ex.: Quero minha vaga"
                    onChange={(evento) =>
                      setPitch((atual) => ({
                        ...atual,
                        personalizado: { ...atual.personalizado, chamada: evento.target.value },
                      }))
                    }
                  />
                </div>
              </section>
            )}

            {/* ── 4. E-mail ───────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Mandar também por e-mail
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uma prévia curta — título, os dois primeiros parágrafos e o botão do primeiro
                    destino. Sai uma única vez por aluno, logo depois da entrega, e o rodapé diz
                    que ele recebeu por ter concluído esta prova.
                  </p>
                </div>
                <ToggleSwitch
                  checked={pitch.email.ativo}
                  onChange={(valor) =>
                    setPitch((atual) => ({ ...atual, email: { ...atual.email, ativo: valor } }))
                  }
                />
              </div>

              {pitch.email.ativo && (
                <div className="space-y-1.5">
                  <Label htmlFor="pitch-assunto">Assunto (opcional)</Label>
                  <Input
                    id="pitch-assunto"
                    value={pitch.email.assunto}
                    maxLength={LIMITE_DE_ASSUNTO}
                    placeholder={previa?.email.assunto || 'Vazio = o assunto do modelo escolhido'}
                    onChange={(evento) =>
                      setPitch((atual) => ({
                        ...atual,
                        email: { ...atual.email, assunto: evento.target.value },
                      }))
                    }
                  />
                </div>
              )}
            </section>

            {/* ── 5. Quem não vê ──────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="font-semibold">Esconder de quem já assina</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vender o plano para quem acabou de assinar não é neutro: diz à pessoa que o
                  sistema não sabe quem ela é. Admins entram na mesma conta — o que também mantém
                  a tela limpa quando você testa a prova.
                </p>
              </div>
              <ToggleSwitch
                checked={pitch.esconderDeAssinantes}
                onChange={(valor) => setPitch((atual) => ({ ...atual, esconderDeAssinantes: valor }))}
              />
            </div>

            {/* ── 6. Prévia ───────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Como o aluno vê
                {montandoPrevia && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
              </h3>

              {previa ? (
                <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
                  {previa.selo && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-2.5 w-2.5" />
                      {previa.selo}
                    </span>
                  )}
                  <h4 className="mt-2 text-xl font-bold leading-tight">{previa.titulo}</h4>
                  <div className="mt-2 space-y-2">
                    {previa.paragrafos.map((paragrafo, indice) => (
                      <p key={indice} className="text-sm leading-relaxed text-muted-foreground">
                        {partirEmNegrito(paragrafo).map((pedaco, posicao) =>
                          pedaco.forte ? (
                            <strong key={posicao} className="font-semibold text-foreground">
                              {pedaco.texto}
                            </strong>
                          ) : (
                            <span key={posicao}>{pedaco.texto}</span>
                          ),
                        )}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {previa.destinos.map((destino, indice) => (
                      <span
                        key={destino.chave}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium',
                          indice === 0
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-500/30 text-foreground',
                        )}
                      >
                        {indice === 0 ? previa.chamada : destino.rotulo}
                        {indice === 0 && <ArrowRight className="h-3.5 w-3.5" />}
                      </span>
                    ))}
                  </div>
                  {pitch.email.ativo && (
                    <p className="mt-4 border-t border-emerald-500/15 pt-3 text-xs text-muted-foreground">
                      <strong className="text-foreground">E-mail: </strong>
                      {previa.email.assunto}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {completo
                    ? 'Montando a prévia com os números reais da plataforma…'
                    : 'Escolha pelo menos um destino (e, no modelo personalizado, escreva o texto) para ver a prévia.'}
                </p>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="border-t">
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={() => onSalvar(prova, pitch)}
            disabled={salvando || (pitch.ativo && !completo)}
          >
            {salvando ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Salvando…
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar pitch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SeletorDeAssunto } from '@/components/admin/banco/seletor-de-assunto'
import { subtopicosDoTopico, type Catalogo } from '@/lib/banco/catalogo'
import {
  LETRAS,
  MAX_ALTERNATIVAS,
  MIN_ALTERNATIVAS,
  lerQuestao,
  normalizarAlternativas,
  questaoDoBanco,
  questaoVazia,
  type DadosDaQuestao,
} from '@/lib/banco/questao-admin'
import type { BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { cn } from '@/lib/utils'

/**
 * O formulário de uma questão.
 *
 * O que ele resolve, além de ser o mesmo formulário para criar e editar:
 *
 * 1. **O botão "Salvar" não fica cinza sem explicação.** Antes ele era
 *    desabilitado por uma expressão com seis condições; faltando qualquer uma,
 *    a pessoa via um botão morto e nenhuma pista de qual campo era. Agora ele
 *    salva sempre, e quando falta algo a mensagem diz o quê — a MESMA mensagem
 *    que o servidor daria, porque a validação é o mesmo módulo dos dois lados
 *    (lib/banco/questao-admin.ts).
 *
 * 2. **Fechar não engole o que foi escrito.** Clicar fora do diálogo depois de
 *    reescrever um enunciado longo apagava tudo, sem perguntar.
 *
 * 3. **O erro do servidor aparece.** Era `alert(data.error)` — a caixa cinza do
 *    navegador, que some no OK e não indica campo nenhum.
 */

export function EditorDeQuestao({
  aberto,
  questao,
  catalogo,
  onFechar,
  onSalvo,
  onCatalogoMudou,
}: {
  aberto: boolean
  /** `null` cria uma questão nova. */
  questao: BancoQuestaoComHierarquia | null
  catalogo: Catalogo
  onFechar: () => void
  onSalvo: (questao: BancoQuestaoComHierarquia, criada: boolean) => void
  onCatalogoMudou: () => Promise<void> | void
}) {
  const [dados, setDados] = useState<DadosDaQuestao>(questaoVazia())
  const [original, setOriginal] = useState<DadosDaQuestao>(questaoVazia())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [campoComErro, setCampoComErro] = useState<string | null>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const [tagsTexto, setTagsTexto] = useState('')
  const [novoSubtopico, setNovoSubtopico] = useState<string | null>(null)
  const [criandoSubtopico, setCriandoSubtopico] = useState(false)

  const editando = Boolean(questao?._id)

  // O formulário é remontado a cada abertura: reaproveitar o estado anterior
  // fazia a questão nova nascer com as alternativas da última questão editada.
  useEffect(() => {
    if (!aberto) return
    const inicial = questao ? questaoDoBanco(questao) : questaoVazia()
    setDados(inicial)
    setOriginal(inicial)
    setTagsTexto((inicial.tags || []).join(', '))
    setErro('')
    setCampoComErro(null)
    setConfirmandoSaida(false)
    setNovoSubtopico(null)
  }, [aberto, questao])

  const subtopicos = useMemo(
    () => subtopicosDoTopico(catalogo, dados.topicoId),
    [catalogo, dados.topicoId],
  )

  const alterado = useMemo(
    () => JSON.stringify(dados) !== JSON.stringify(original),
    [dados, original],
  )

  function mudar(parcial: Partial<DadosDaQuestao>) {
    setDados((atual) => ({ ...atual, ...parcial }))
    setErro('')
    setCampoComErro(null)
  }

  /**
   * Trocar o tipo não pode deixar o formulário sem o campo do tipo novo: uma
   * discursiva que vira objetiva chegava sem alternativa nenhuma e sem botão
   * para criar a primeira.
   */
  function trocarTipo(tipo: DadosDaQuestao['tipo']) {
    setDados((atual) => ({
      ...atual,
      tipo,
      alternativas:
        tipo === 'objetiva' && (atual.alternativas?.length || 0) < MIN_ALTERNATIVAS
          ? normalizarAlternativas([{}, {}, {}, {}])
          : atual.alternativas,
    }))
    setErro('')
    setCampoComErro(null)
  }

  function mudarAlternativa(indice: number, parcial: { texto?: string; correta?: boolean }) {
    setDados((atual) => {
      const alternativas = (atual.alternativas || []).map((alt, i) => {
        if (parcial.correta !== undefined) {
          // Só uma pode ser a correta: marcar uma desmarca as outras. Antes
          // isso era feito mutando os objetos do estado no lugar.
          return { ...alt, correta: i === indice }
        }
        return i === indice ? { ...alt, ...parcial } : alt
      })
      return { ...atual, alternativas }
    })
    setErro('')
    setCampoComErro(null)
  }

  function adicionarAlternativa() {
    setDados((atual) => {
      const atuais = atual.alternativas || []
      if (atuais.length >= MAX_ALTERNATIVAS) return atual
      return { ...atual, alternativas: normalizarAlternativas([...atuais, { texto: '', correta: false }]) }
    })
  }

  function removerAlternativa(indice: number) {
    setDados((atual) => {
      const atuais = atual.alternativas || []
      if (atuais.length <= MIN_ALTERNATIVAS) return atual
      // As letras são recalculadas pela posição: tirar a B de A/B/C/D tem que
      // deixar A/B/C, e não A/C/D com um buraco no meio.
      return { ...atual, alternativas: normalizarAlternativas(atuais.filter((_, i) => i !== indice)) }
    })
  }

  async function criarSubtopico() {
    const nome = (novoSubtopico || '').trim()
    if (!nome || !dados.topicoId) return

    setCriandoSubtopico(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/banco/subtopicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicoId: dados.topicoId, nome }),
      })
      const resposta = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(resposta.error || 'Não foi possível criar o subtópico')
        return
      }
      await onCatalogoMudou()
      mudar({ subtopicoId: String(resposta.subtopico._id) })
      setNovoSubtopico(null)
    } catch {
      setErro('Não foi possível criar o subtópico')
    } finally {
      setCriandoSubtopico(false)
    }
  }

  async function salvar() {
    // A mesma validação do servidor, antes da viagem: o que falta é dito na
    // hora, no idioma do campo, em vez de voltar como 400 daqui a um segundo.
    const leitura = lerQuestao(paraCorpo(dados))
    if (!leitura.ok) {
      setErro(leitura.erro)
      setCampoComErro(leitura.campo || null)
      return
    }

    setSalvando(true)
    setErro('')
    setCampoComErro(null)
    try {
      const res = await fetch(
        editando ? `/api/admin/banco/questoes/${questao?._id}` : '/api/admin/banco/questoes',
        {
          method: editando ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paraCorpo(dados)),
        },
      )
      const resposta = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErro(resposta.error || 'Não foi possível salvar a questão')
        setCampoComErro(resposta.campo || null)
        return
      }

      onSalvo(resposta.questao as BancoQuestaoComHierarquia, !editando)
    } catch {
      setErro('Não foi possível falar com o servidor. Verifique a conexão e tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  function tentarFechar() {
    if (alterado && !salvando) {
      setConfirmandoSaida(true)
      return
    }
    onFechar()
  }

  const marcado = (campo: string) =>
    campoComErro === campo ? 'border-red-500 focus:border-red-500' : ''

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? null : tentarFechar())}>
      {/* O diálogo do projeto já rola por fora (components/ui/dialog.tsx), então
          cabeçalho e rodapé são `sticky` dentro dele — num formulário desta
          altura, um botão "Salvar" que só existe no fim da rolagem é um botão
          que a pessoa procura. */}
      <DialogContent
        className="w-full max-w-3xl p-0"
        onKeyDown={(e) => {
          // Ctrl/⌘+Enter salva de dentro de qualquer campo: o botão fica no
          // rodapé, longe de um enunciado de vinte linhas. Esc fecha — e passa
          // pela mesma confirmação de descarte que o X e o clique fora.
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void salvar()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            tentarFechar()
          }
        }}
      >
        <DialogHeader className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            {editando ? 'Editar questão' : 'Nova questão'}
            {editando && questao?.totalRespostas ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {questao.totalRespostas} respostas ·{' '}
                {Math.round(((questao.totalAcertos || 0) / questao.totalRespostas) * 100)}% de acerto
              </span>
            ) : null}
          </DialogTitle>
          <button
            type="button"
            onClick={tentarFechar}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-5 px-5 py-4">
          {/* ── Tipo ────────────────────────────────────────────────────── */}
          <div className="flex gap-2">
            {(['objetiva', 'discursiva'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                data-marcado={dados.tipo === tipo}
                onClick={() => trocarTipo(tipo)}
                className="tecla inline-flex h-9 items-center px-3 text-xs font-semibold capitalize"
              >
                {tipo}
              </button>
            ))}
          </div>

          {/* ── Assunto ─────────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cn('sm:col-span-2', campoComErro === 'topicoId' && 'rounded-xl ring-1 ring-red-500/50')}>
              <Label className="text-xs text-muted-foreground">Assunto *</Label>
              <div className="mt-1">
                <SeletorDeAssunto
                  catalogo={catalogo}
                  moduloId={dados.moduloId}
                  topicoId={dados.topicoId}
                  onEscolher={({ moduloId, topicoId }) => {
                    // Trocar de tópico invalida o subtópico: ele pertence ao
                    // tópico antigo, e o servidor recusaria a combinação.
                    mudar({
                      moduloId,
                      topicoId,
                      subtopicoId: topicoId === dados.topicoId ? dados.subtopicoId : null,
                    })
                  }}
                  onCatalogoMudou={onCatalogoMudou}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Subtópico (opcional)</Label>
              {novoSubtopico === null ? (
                <div className="mt-1 flex gap-2">
                  <select
                    value={dados.subtopicoId || ''}
                    onChange={(e) => mudar({ subtopicoId: e.target.value || null })}
                    disabled={!dados.topicoId}
                    className="h-10 w-full rounded-xl border border-border bg-background px-2 text-sm outline-none focus:border-primary/50 disabled:opacity-50"
                  >
                    <option value="">Nenhum</option>
                    {subtopicos.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setNovoSubtopico('')}
                    disabled={!dados.topicoId}
                    title="Criar subtópico"
                    className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex gap-2">
                  <input
                    value={novoSubtopico}
                    onChange={(e) => setNovoSubtopico(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void criarSubtopico()
                      }
                    }}
                    autoFocus
                    placeholder="Nome do novo subtópico"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => void criarSubtopico()}
                    disabled={criandoSubtopico || !novoSubtopico.trim()}
                    className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    {criandoSubtopico ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoSubtopico(null)}
                    className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-border text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Enunciado ───────────────────────────────────────────────── */}
          <div>
            <Label className="text-xs text-muted-foreground">Enunciado *</Label>
            <Textarea
              value={dados.enunciado}
              onChange={(e) => mudar({ enunciado: e.target.value })}
              rows={6}
              placeholder="Cole ou digite o enunciado…"
              className={cn('mt-1 rounded-xl', marcado('enunciado'))}
            />
          </div>

          {/* ── Imagem ──────────────────────────────────────────────────── */}
          <div>
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" /> Imagem (opcional)
            </Label>
            <div className="mt-1 space-y-2">
              <input
                value={dados.imagemUrl || ''}
                onChange={(e) => mudar({ imagemUrl: e.target.value || null })}
                placeholder="https://i.imgur.com/…"
                className={cn(
                  'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50',
                  marcado('imagemUrl'),
                )}
              />
              {dados.imagemUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dados.imagemUrl}
                    alt="Prévia da imagem da questão"
                    className="max-h-48 max-w-full rounded-xl border border-border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => mudar({ imagemUrl: null })}
                    aria-label="Remover imagem"
                    className="absolute right-1.5 top-1.5 rounded-lg bg-background/90 p-1 text-red-500 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Alternativas ou resposta modelo ─────────────────────────── */}
          {dados.tipo === 'objetiva' ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Alternativas * <span className="normal-case">— marque a correta</span>
                </Label>
                {(dados.alternativas?.length || 0) < MAX_ALTERNATIVAS ? (
                  <button
                    type="button"
                    onClick={adicionarAlternativa}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                ) : null}
              </div>

              <div
                className={cn(
                  'space-y-2 rounded-xl',
                  campoComErro === 'alternativas' && 'ring-1 ring-red-500/50',
                )}
              >
                {(dados.alternativas || []).map((alt, i) => (
                  <div
                    key={LETRAS[i]}
                    className={cn(
                      'flex items-start gap-2 rounded-xl border p-2 transition',
                      alt.correta ? 'border-green-500/60 bg-green-500/5' : 'border-border',
                    )}
                  >
                    <label className="flex flex-none cursor-pointer items-center gap-2 pt-2">
                      <input
                        type="radio"
                        name="alternativa-correta"
                        checked={alt.correta}
                        onChange={() => mudarAlternativa(i, { correta: true })}
                        className="h-4 w-4 accent-green-600"
                      />
                      <span className="w-4 text-sm font-bold">{alt.letra}</span>
                    </label>
                    <Textarea
                      value={alt.texto}
                      onChange={(e) => mudarAlternativa(i, { texto: e.target.value })}
                      rows={2}
                      placeholder={`Texto da alternativa ${alt.letra}`}
                      className="min-h-0 flex-1 rounded-lg border-0 bg-transparent p-1 text-sm focus-visible:ring-0"
                    />
                    {(dados.alternativas?.length || 0) > MIN_ALTERNATIVAS ? (
                      <button
                        type="button"
                        onClick={() => removerAlternativa(i)}
                        aria-label={`Remover alternativa ${alt.letra}`}
                        className="flex-none rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground">Resposta modelo *</Label>
              <Textarea
                value={dados.respostaModelo || ''}
                onChange={(e) => mudar({ respostaModelo: e.target.value || null })}
                rows={5}
                placeholder="O que se espera na resposta…"
                className={cn('mt-1 rounded-xl', marcado('respostaModelo'))}
              />
            </div>
          )}

          {/* ── Explicação ──────────────────────────────────────────────── */}
          <div>
            <Label className="text-xs text-muted-foreground">Comentário (opcional)</Label>
            <Textarea
              value={dados.explicacao || ''}
              onChange={(e) => mudar({ explicacao: e.target.value || null })}
              rows={4}
              placeholder="O que o aluno lê depois de responder…"
              className="mt-1 rounded-xl"
            />
          </div>

          {/* ── Metadados ───────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Dificuldade</Label>
              <select
                value={dados.dificuldade || ''}
                onChange={(e) => mudar({ dificuldade: (e.target.value || null) as DadosDaQuestao['dificuldade'] })}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm outline-none focus:border-primary/50"
              >
                <option value="">Não definida</option>
                <option value="facil">Fácil</option>
                <option value="medio">Média</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fonte</Label>
              <input
                value={dados.fonte || ''}
                onChange={(e) => mudar({ fonte: e.target.value || null })}
                placeholder="Ex.: Prova SOI I 2024.1"
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <input
                type="number"
                inputMode="numeric"
                value={dados.ano ?? ''}
                onChange={(e) => mudar({ ano: e.target.value ? Number(e.target.value) : null })}
                placeholder="2024"
                className={cn(
                  'mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50',
                  marcado('ano'),
                )}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tags (separadas por vírgula)</Label>
            <input
              value={tagsTexto}
              onChange={(e) => {
                setTagsTexto(e.target.value)
                mudar({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }}
              placeholder="arritmia, ecg, emergência"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* ── Rodapé ────────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 z-10 border-t border-border bg-background px-5 py-3">
          {erro ? (
            <p className="mb-2 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{erro}</span>
            </p>
          ) : null}

          {confirmandoSaida ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-muted-foreground">
                Você mexeu na questão e ainda não salvou. Descartar as alterações?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoSaida(false)}
                  className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold"
                >
                  Continuar editando
                </button>
                <button
                  type="button"
                  onClick={onFechar}
                  className="inline-flex h-9 items-center rounded-xl bg-red-500 px-3 text-xs font-semibold text-white"
                >
                  Descartar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span className="mr-auto hidden text-[11px] text-muted-foreground sm:block">
                {alterado ? 'Alterações não salvas · ⌘/Ctrl + Enter salva' : 'Nada alterado'}
              </span>
              <button
                type="button"
                onClick={tentarFechar}
                className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void salvar()}
                disabled={salvando}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editando ? 'Salvar alterações' : 'Criar questão'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * O corpo da requisição.
 *
 * `null` vira string vazia porque é assim que a validação entende "apagar este
 * campo" — e é o mesmo formato que o formulário de criação manda, para as duas
 * rotas lerem a mesma coisa.
 */
function paraCorpo(dados: DadosDaQuestao) {
  return {
    tipo: dados.tipo,
    moduloId: dados.moduloId,
    topicoId: dados.topicoId,
    subtopicoId: dados.subtopicoId || '',
    enunciado: dados.enunciado,
    explicacao: dados.explicacao || '',
    imagemUrl: dados.imagemUrl || '',
    alternativas: dados.alternativas || [],
    respostaModelo: dados.respostaModelo || '',
    dificuldade: dados.dificuldade || '',
    tags: dados.tags || [],
    fonte: dados.fonte || '',
    ano: dados.ano ?? null,
  }
}

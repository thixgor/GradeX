'use client'

import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Rows3,
  Columns3,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  type ImagemDeQuestao,
  type LayoutDeImagens,
  LAYOUTS_DE_IMAGENS,
  MAXIMO_DE_IMAGENS,
  TAMANHOS_SUGERIDOS,
  TAMANHO_MAXIMO_DA_IMAGEM,
  TAMANHO_MINIMO_DA_IMAGEM,
  TAMANHO_PADRAO_DA_IMAGEM,
  ehUrlDeImagem,
  tamanhoDaImagem,
} from '@/lib/questoes/imagens'
import { cn } from '@/lib/utils'

/**
 * O editor de imagens de um bloco (enunciado ou resposta comentada).
 *
 * ## O que ele resolve
 *
 * O campo de imagem era um `<input>` de URL e mais nada: uma imagem, sem
 * tamanho, sem ordem e sem jeito de saber se o endereço colado carrega. Aqui
 * cada imagem é uma linha com prévia, tamanho, crédito e setas de ordem, e o
 * bloco inteiro escolhe se elas ficam empilhadas ou lado a lado.
 *
 * ## As três formas de colocar uma imagem
 *
 * 1. Colar a URL no campo e apertar Adicionar (ou Enter).
 * 2. Colar a IMAGEM (Ctrl+V) em qualquer lugar do editor — vai para o upload.
 * 3. Escolher o arquivo pelo botão.
 *
 * As três terminam no mesmo lugar. A colagem de imagem é a que mais se usa na
 * prática (print de um slide, recorte de um atlas) e era a que não existia no
 * Banco de Questões.
 *
 * ## Por que o tamanho é uma porcentagem
 *
 * Porque o mesmo número tem que valer na tela do celular e na página A4 do PDF.
 * Ver `lib/questoes/imagens.ts`.
 */
export function EditorDeImagens({
  imagens,
  layout,
  onChange,
  titulo,
  descricao,
  className,
}: {
  imagens: ImagemDeQuestao[]
  layout: LayoutDeImagens
  onChange: (imagens: ImagemDeQuestao[], layout: LayoutDeImagens) => void
  titulo: string
  descricao?: string
  className?: string
}) {
  const [urlNova, setUrlNova] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const inputDeArquivo = useRef<HTMLInputElement>(null)

  const lista = Array.isArray(imagens) ? imagens : []
  const cheio = lista.length >= MAXIMO_DE_IMAGENS

  function trocarImagens(novas: ImagemDeQuestao[]) {
    onChange(novas, layout)
  }

  function adicionarUrl(url: string) {
    const limpa = url.trim()
    if (limpa.length === 0) return
    if (!ehUrlDeImagem(limpa)) {
      setErro('Endereço inválido: use um link http(s) ou faça o upload do arquivo.')
      return
    }
    if (lista.some((imagem) => imagem.url === limpa)) {
      setErro('Esta imagem já está na questão.')
      return
    }
    if (cheio) {
      setErro(`O limite é de ${MAXIMO_DE_IMAGENS} imagens por bloco.`)
      return
    }
    setErro('')
    setUrlNova('')
    trocarImagens([...lista, { url: limpa, tamanho: TAMANHO_PADRAO_DA_IMAGEM }])
  }

  async function enviarArquivo(arquivo: File) {
    if (cheio) {
      setErro(`O limite é de ${MAXIMO_DE_IMAGENS} imagens por bloco.`)
      return
    }
    setEnviando(true)
    setErro('')
    try {
      const corpo = new FormData()
      corpo.append('file', arquivo)
      const resposta = await fetch('/api/upload', { method: 'POST', body: corpo })
      const dados = await resposta.json()
      if (!resposta.ok) throw new Error(dados?.error || 'Erro ao enviar a imagem')
      adicionarUrl(dados.url)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar a imagem')
    } finally {
      setEnviando(false)
    }
  }

  /**
   * Ctrl+V no editor manda a imagem para o upload.
   *
   * O `onPaste` fica na div inteira (e não só no campo de texto) porque quem
   * acabou de recortar um print não mira o cursor num input antes de colar.
   * Colar TEXTO continua funcionando normalmente: só a imagem é interceptada.
   */
  function aoColar(evento: React.ClipboardEvent<HTMLDivElement>) {
    const itens = evento.clipboardData?.items
    if (!itens) return
    for (let i = 0; i < itens.length; i++) {
      if (itens[i].type.startsWith('image')) {
        const arquivo = itens[i].getAsFile()
        if (arquivo) {
          evento.preventDefault()
          void enviarArquivo(arquivo)
        }
        return
      }
    }
  }

  function mudarImagem(indice: number, parcial: Partial<ImagemDeQuestao>) {
    trocarImagens(lista.map((imagem, i) => (i === indice ? { ...imagem, ...parcial } : imagem)))
  }

  function mover(indice: number, destino: number) {
    if (destino < 0 || destino >= lista.length) return
    const novas = [...lista]
    const [movida] = novas.splice(indice, 1)
    novas.splice(destino, 0, movida)
    trocarImagens(novas)
  }

  function remover(indice: number) {
    trocarImagens(lista.filter((_, i) => i !== indice))
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3', className)} onPaste={aoColar}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            {titulo}
          </p>
          {descricao ? <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p> : null}
        </div>
        {lista.length > 1 ? (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
            {LAYOUTS_DE_IMAGENS.map((opcao) => {
              const Icone = opcao.valor === 'lado-a-lado' ? Columns3 : Rows3
              const ativo = layout === opcao.valor
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  title={opcao.descricao}
                  onClick={() => onChange(lista, opcao.valor)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition',
                    ativo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{opcao.rotulo}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {lista.length > 0 ? (
        <ul className="space-y-2">
          {lista.map((imagem, indice) => (
            <li
              key={`${imagem.url}-${indice}`}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-2 sm:flex-row sm:items-start"
            >
              <div className="flex items-center gap-2 sm:flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagem.url}
                  alt={`Imagem ${indice + 1}`}
                  className="h-20 w-20 flex-none rounded-lg border border-border object-cover"
                  onError={(evento) => {
                    ;(evento.target as HTMLImageElement).style.opacity = '0.25'
                  }}
                />
                <span className="text-[11px] font-semibold text-muted-foreground">#{indice + 1}</span>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <input
                  value={imagem.url}
                  onChange={(evento) => mudarImagem(indice, { url: evento.target.value })}
                  placeholder="https://…"
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary/50"
                />
                <input
                  value={imagem.fonte || ''}
                  onChange={(evento) => mudarImagem(indice, { fonte: evento.target.value })}
                  placeholder="Fonte / crédito (opcional)"
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary/50"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Tamanho</span>
                    <input
                      type="range"
                      min={TAMANHO_MINIMO_DA_IMAGEM}
                      max={TAMANHO_MAXIMO_DA_IMAGEM}
                      step={5}
                      value={tamanhoDaImagem(imagem)}
                      onChange={(evento) => mudarImagem(indice, { tamanho: Number(evento.target.value) })}
                      className="h-1.5 min-w-[80px] flex-1 accent-primary"
                    />
                    <span className="w-10 text-right text-[11px] font-semibold tabular-nums">
                      {tamanhoDaImagem(imagem)}%
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    {TAMANHOS_SUGERIDOS.map((sugestao) => (
                      <button
                        key={sugestao.valor}
                        type="button"
                        onClick={() => mudarImagem(indice, { tamanho: sugestao.valor })}
                        className={cn(
                          'rounded-md border px-1.5 py-1 text-[10px] font-medium transition',
                          tamanhoDaImagem(imagem) === sugestao.valor
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {sugestao.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-none items-center gap-1 sm:flex-col">
                <button
                  type="button"
                  onClick={() => mover(indice, indice - 1)}
                  disabled={indice === 0}
                  aria-label="Mover imagem para cima"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(indice, indice + 1)}
                  disabled={indice === lista.length - 1}
                  aria-label="Mover imagem para baixo"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remover(indice)}
                  aria-label="Remover imagem"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={urlNova}
          onChange={(evento) => {
            setUrlNova(evento.target.value)
            setErro('')
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault()
              adicionarUrl(urlNova)
            }
          }}
          disabled={cheio}
          placeholder={cheio ? `Limite de ${MAXIMO_DE_IMAGENS} imagens` : 'Cole o link da imagem, ou Ctrl+V para colar a imagem'}
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => adicionarUrl(urlNova)}
            disabled={cheio || urlNova.trim().length === 0}
            className="h-10 flex-1 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-40 sm:flex-none"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => inputDeArquivo.current?.click()}
            disabled={cheio || enviando}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="hidden sm:inline">{enviando ? 'Enviando…' : 'Arquivo'}</span>
          </button>
        </div>
        <input
          ref={inputDeArquivo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0]
            if (arquivo) void enviarArquivo(arquivo)
            evento.target.value = ''
          }}
        />
      </div>

      {erro ? <p className="text-xs font-medium text-red-500">{erro}</p> : null}
    </div>
  )
}

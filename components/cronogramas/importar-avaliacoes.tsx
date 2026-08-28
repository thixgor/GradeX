'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Check,
  Copy,
  CopyCheck,
  FileImage,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { formatarDiaLongo } from '@/lib/cronogramas/brasilia'
import {
  marcarDuplicadas,
  periodosDoPainel,
  todosOsPeriodos,
  type PropostaAvaliacao,
} from '@/lib/cronogramas/extracao'
import {
  LEMBRETE_PADRAO,
  SECOES,
  TIPOS_AVALIACAO,
  getSecao,
  getTipoAvaliacao,
  type Avaliacao,
  type ConfigLembrete,
  type SecaoCurso,
  type TipoAvaliacao,
} from '@/lib/cronogramas/tipos'

/** Uma proposta na tela: o que veio da leitura mais o estado da revisão. */
interface PropostaRevisao extends PropostaAvaliacao {
  duplicada: boolean
  selecionada: boolean
}

interface ArquivoEscolhido {
  id: string
  arquivo: File
  /** `objectURL` da miniatura; vazio para PDF. */
  previa: string
}

interface ResumoArquivo {
  nome: string
  linhas: number
  propostas: number
  erro?: string
}

interface ImportarAvaliacoesProps {
  hoje: string
  /** Agenda já cadastrada — é contra ela que a duplicata é detectada. */
  existentes: Avaliacao[]
  secaoPadrao?: SecaoCurso
  /** Cria as aprovadas e devolve quantas entraram (null se falhou). */
  onCriar: (avaliacoes: Array<Omit<Avaliacao, '_id'>>) => Promise<number | null>
  onFechar: () => void
}

const MAX_ARQUIVOS = 6
const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

let sequencia = 0

/**
 * Importação do calendário de provas a partir da imagem divulgada.
 *
 * O calendário oficial chega como aquela tabela em PNG no grupo da turma. Até
 * aqui, transformá-la em agenda era digitar: uma linha "1º ao 8º período" são
 * oito avaliações, e um semestre passa de cinquenta. A tela abaixo troca isso
 * por soltar o arquivo, conferir e aprovar.
 *
 * Duas decisões sustentam o resto:
 *
 * - **Nada é gravado antes da aprovação.** A leitura devolve propostas
 *   editáveis; a criação usa a mesma rota do formulário manual, com a mesma
 *   validação. O admin não está confirmando um cadastro que já aconteceu.
 * - **A revisão mostra o que merece dúvida.** Ano deduzido, período tirado do
 *   eixo, horário ausente e avaliação que já existe na agenda aparecem
 *   marcados na linha — e a duplicata já vem desmarcada, porque reimportar a
 *   tabela corrigida é o caminho normal, não o desvio.
 */
export function ImportarAvaliacoes({
  hoje,
  existentes,
  secaoPadrao = 'medicina',
  onCriar,
  onFechar,
}: ImportarAvaliacoesProps) {
  const [arquivos, setArquivos] = useState<ArquivoEscolhido[]>([])
  const [secao, setSecao] = useState<SecaoCurso>(secaoPadrao)
  const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)))

  const [lendo, setLendo] = useState(false)
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)

  const [propostas, setPropostas] = useState<PropostaRevisao[]>([])
  const [resumo, setResumo] = useState<ResumoArquivo[]>([])
  const [expandida, setExpandida] = useState<string | null>(null)

  const [lembrete, setLembrete] = useState<ConfigLembrete>({ ...LEMBRETE_PADRAO })
  const [publicada, setPublicada] = useState(true)
  const [lembreteAberto, setLembreteAberto] = useState(false)

  const entrada = useRef<HTMLInputElement>(null)

  // As miniaturas são `objectURL`: sem revogar, cada leitura de seis imagens
  // deixa seis blobs presos na memória da aba. A lista viva fica num ref para
  // a limpeza acontecer só ao fechar o painel — um efeito que dependesse do
  // estado revogaria, a cada arquivo novo, as miniaturas ainda em uso.
  const arquivosVivos = useRef<ArquivoEscolhido[]>([])
  arquivosVivos.current = arquivos

  useEffect(() => {
    return () => {
      for (const item of arquivosVivos.current) if (item.previa) URL.revokeObjectURL(item.previa)
    }
  }, [])

  const receber = useCallback((lista: FileList | File[]) => {
    setErro(null)
    const novos: ArquivoEscolhido[] = []

    for (const arquivo of Array.from(lista)) {
      if (!TIPOS_ACEITOS.includes(arquivo.type)) {
        setErro(`"${arquivo.name}" não é PNG, JPG, WEBP ou PDF — ignorei.`)
        continue
      }
      novos.push({
        id: `arquivo-${sequencia++}`,
        arquivo,
        previa: arquivo.type === 'application/pdf' ? '' : URL.createObjectURL(arquivo),
      })
    }

    if (novos.length > 0) {
      setArquivos(anterior => [...anterior, ...novos].slice(0, MAX_ARQUIVOS))
    }
  }, [])

  function remover(id: string) {
    setArquivos(anterior => {
      const alvo = anterior.find(item => item.id === id)
      if (alvo?.previa) URL.revokeObjectURL(alvo.previa)
      return anterior.filter(item => item.id !== id)
    })
  }

  /**
   * Lê as imagens, UMA REQUISIÇÃO POR ARQUIVO.
   *
   * Mandar as cinco juntas era o que quebrava: elas dividiam os 60s de uma
   * invocação só, as duas primeiras consumiam o orçamento e o resto voltava
   * sem leitura nenhuma. Em série cada imagem tem a função inteira para si — e
   * o admin vê o progresso em vez de encarar um botão travado.
   */
  async function ler() {
    if (arquivos.length === 0) return
    setLendo(true)
    setErro(null)
    setResumo([])

    const lidas: PropostaAvaliacao[] = []
    const relatos: ResumoArquivo[] = []

    try {
      for (const [indice, item] of arquivos.entries()) {
        setProgresso({ atual: indice + 1, total: arquivos.length })

        try {
          const arquivo = await prepararParaEnvio(item.arquivo)

          const corpo = new FormData()
          corpo.append('arquivos', arquivo)
          corpo.append('secao', secao)
          corpo.append('ano', String(ano))
          corpo.append('lembrete', JSON.stringify(lembrete))
          corpo.append('publicada', String(publicada))

          const resposta = await fetch('/api/admin/cronogramas/extrair', {
            method: 'POST',
            body: corpo,
          })
          const dados = await resposta.json().catch(() => ({}))

          if (!resposta.ok) {
            relatos.push({
              nome: item.arquivo.name,
              linhas: 0,
              propostas: 0,
              erro: dados?.error || descreverFalhaDeRede(resposta.status),
            })
            continue
          }

          lidas.push(...(dados.propostas ?? []))
          relatos.push(
            ...(dados.arquivos ?? [
              { nome: item.arquivo.name, linhas: 0, propostas: 0 },
            ]),
          )
        } catch {
          relatos.push({
            nome: item.arquivo.name,
            linhas: 0,
            propostas: 0,
            erro: 'falha de conexão',
          })
        }
      }

      setResumo(relatos)

      if (lidas.length === 0) {
        setPropostas([])
        setErro(
          relatos.some(item => item.erro)
            ? 'Nenhuma imagem pôde ser lida — o motivo de cada uma está abaixo.'
            : 'Não encontrei nenhuma avaliação nessas imagens. Confira se a tabela está legível.',
        )
        return
      }

      setPropostas(
        marcarDuplicadas(lidas, existentes).map(proposta => ({
          ...proposta,
          // Duplicata e linha sem data entram desmarcadas: são justamente as
          // que precisam de decisão, e marcá-las convidaria o "aprovar tudo".
          selecionada: !proposta.duplicada && Boolean(proposta.data),
        })),
      )
    } finally {
      setLendo(false)
      setProgresso(null)
    }
  }

  // A agenda muda enquanto o painel está aberto — inclusive por causa das
  // aprovações feitas aqui. Remarcar as duplicatas a cada mudança é o que
  // impede que uma segunda rodada recrie o que a primeira acabou de criar.
  useEffect(() => {
    setPropostas(anterior =>
      anterior.length === 0
        ? anterior
        : marcarDuplicadas(anterior, existentes).map(proposta => ({
            ...proposta,
            selecionada: proposta.duplicada ? false : proposta.selecionada,
          })),
    )
  }, [existentes])

  function ajustar(id: string, mudancas: Partial<PropostaRevisao>) {
    setPropostas(anterior =>
      anterior.map(item => (item.id === id ? { ...item, ...mudancas } : item)),
    )
  }

  /**
   * Repete a linha em todos os períodos do curso.
   *
   * É o caso do teste de progresso e das provas integradas: a tabela não lista
   * período nenhum porque a prova é do curso inteiro. Quando a leitura entende
   * isso sozinha, os períodos já vêm expandidos; quando a imagem não deixa
   * claro, este botão faz o mesmo em um clique, em vez de o admin duplicar a
   * linha à mão oito vezes.
   */
  function repetirEmTodosOsPeriodos(id: string) {
    setPropostas(anterior => {
      const base = anterior.find(item => item.id === id)
      if (!base) return anterior

      const novas = todosOsPeriodos(getSecao(base.secao).periodos)
        .filter(
          periodo =>
            !anterior.some(
              item =>
                item.secao === base.secao &&
                item.periodo === periodo &&
                item.data === base.data &&
                item.titulo === base.titulo,
            ),
        )
        .map(periodo => ({
          ...base,
          periodo,
          todosOsPeriodos: false,
          id: `${base.id}+p${periodo}`,
        }))

      if (novas.length === 0) return anterior

      const marcadas = marcarDuplicadas(novas, existentes).map(proposta => ({
        ...proposta,
        selecionada: !proposta.duplicada && Boolean(proposta.data),
      }))

      // Entram logo abaixo da linha de origem: revisar oito cópias espalhadas
      // pelo fim da lista seria o mesmo trabalho que digitar.
      const posicao = anterior.findIndex(item => item.id === id)
      return [...anterior.slice(0, posicao + 1), ...marcadas, ...anterior.slice(posicao + 1)]
    })
  }

  function marcarTodas(valor: boolean | 'novas') {
    setPropostas(anterior =>
      anterior.map(item => ({
        ...item,
        selecionada:
          valor === 'novas' ? !item.duplicada && Boolean(item.data) : valor && Boolean(item.data),
      })),
    )
  }

  const selecionadas = useMemo(
    () => propostas.filter(item => item.selecionada && item.data && item.titulo.trim().length >= 2),
    [propostas],
  )

  const duplicadas = useMemo(() => propostas.filter(item => item.duplicada).length, [propostas])

  const grupos = useMemo(() => {
    const mapa = new Map<string, PropostaRevisao[]>()
    for (const proposta of propostas) {
      const atual = mapa.get(proposta.origem) ?? []
      atual.push(proposta)
      mapa.set(proposta.origem, atual)
    }
    return [...mapa.entries()]
  }, [propostas])

  async function aprovar() {
    if (selecionadas.length === 0) return
    setCriando(true)
    setErro(null)

    try {
      const criadas = await onCriar(
        selecionadas.map(proposta => paraAvaliacao(proposta, lembrete, publicada)),
      )

      if (criadas == null) {
        setErro('Não foi possível criar as avaliações aprovadas.')
        return
      }

      // O que sobrou continua na tela: é comum aprovar as novas primeiro e
      // decidir as duplicadas depois, olhando a agenda já atualizada.
      const aprovadas = new Set(selecionadas.map(item => item.id))
      setPropostas(anterior => anterior.filter(item => !aprovadas.has(item.id)))
    } finally {
      setCriando(false)
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-[#468152]/35 bg-background/80 p-4 shadow-lg">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
            Importar de imagem
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Solte o print do calendário de provas. A leitura preenche as avaliações — inclusive uma
            por período quando a linha cobre vários — e você só aprova.
          </p>
        </div>
        <Button variant="ghost" onClick={onFechar} className="h-8 rounded-lg px-2">
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* ── Arquivos ── */}
      <div
        onDragOver={evento => {
          evento.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={evento => {
          evento.preventDefault()
          setArrastando(false)
          receber(evento.dataTransfer.files)
        }}
        onClick={() => entrada.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          arrastando
            ? 'border-[#468152] bg-[#468152]/8'
            : 'border-border/70 hover:border-[#468152]/50 hover:bg-muted/30'
        }`}
      >
        <Upload className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-semibold text-foreground">
          Solte aqui as imagens do calendário
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          PNG, JPG, WEBP ou PDF · até {MAX_ARQUIVOS} arquivos · 8MB cada
        </p>
        <input
          ref={entrada}
          type="file"
          accept={TIPOS_ACEITOS.join(',')}
          multiple
          hidden
          onChange={evento => {
            if (evento.target.files) receber(evento.target.files)
            evento.target.value = ''
          }}
        />
      </div>

      {arquivos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {arquivos.map(item => (
            <li
              key={item.id}
              className="group relative flex w-28 flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/30"
            >
              <div className="flex h-16 items-center justify-center bg-background/60">
                {item.previa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previa} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileImage className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </div>
              <span className="truncate px-1.5 py-1 text-[10px] text-muted-foreground" title={item.arquivo.name}>
                {item.arquivo.name}
              </span>
              <button
                onClick={() => remover(item.id)}
                aria-label={`Remover ${item.arquivo.name}`}
                className="absolute right-1 top-1 rounded-md bg-background/85 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Contexto que a imagem não traz ── */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <Rotulo>Seção quando a imagem não disser</Rotulo>
          <select
            value={secao}
            onChange={evento => setSecao(evento.target.value as SecaoCurso)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#468152]/50"
          >
            {SECOES.map(item => (
              <option key={item.id} value={item.id}>
                {item.emoji} {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Rotulo>Ano letivo</Rotulo>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={ano}
            onChange={evento => setAno(Number(evento.target.value))}
            className="h-10 rounded-lg"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            As tabelas trazem só dia e mês — o ano vem daqui.
          </span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={ler} disabled={arquivos.length === 0 || lendo} className="h-10 rounded-xl">
          {lendo ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          {lendo
            ? progresso
              ? `Lendo ${progresso.atual} de ${progresso.total}…`
              : 'Lendo…'
            : `Ler ${arquivos.length || ''} ${arquivos.length === 1 ? 'imagem' : 'imagens'}`.trim()}
        </Button>
        {lendo && (
          <span className="text-xs text-muted-foreground">
            Uma imagem por vez. Tabela grande pode levar mais de um minuto — não feche a página.
          </span>
        )}
      </div>

      {erro && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {erro}
        </p>
      )}

      {resumo.some(item => item.erro) && (
        <ul className="mt-2 space-y-1">
          {resumo
            .filter(item => item.erro)
            .map(item => (
              <li key={item.nome} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{item.nome}</span>: não deu para ler
                ({item.erro}).
              </li>
            ))}
        </ul>
      )}

      {/* ── Revisão ── */}
      {propostas.length > 0 && (
        <div className="mt-5 border-t border-border/50 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {propostas.length} avaliaç{propostas.length === 1 ? 'ão lida' : 'ões lidas'}
              <span className="ml-2 font-normal text-muted-foreground">
                {selecionadas.length} aprovada{selecionadas.length === 1 ? '' : 's'}
                {duplicadas > 0 && ` · ${duplicadas} já na agenda`}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <BotaoDiscreto onClick={() => marcarTodas(true)}>Marcar todas</BotaoDiscreto>
              <BotaoDiscreto onClick={() => marcarTodas('novas')}>
                <CopyCheck className="mr-1 h-3 w-3" />
                Só as novas
              </BotaoDiscreto>
              <BotaoDiscreto onClick={() => marcarTodas(false)}>Nenhuma</BotaoDiscreto>
            </div>
          </div>

          {/* Lembrete e visibilidade valem para o lote inteiro: aprovar trinta
              provas e depois abrir uma a uma para ligar lembrete anularia o
              ganho da importação. */}
          <div className="mb-3 rounded-xl border border-border/60 bg-muted/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setLembreteAberto(aberto => !aberto)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Bell className="h-4 w-4 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
                Lembretes de todas as importadas
                <span className="text-xs font-normal text-muted-foreground">
                  {lembrete.ativo
                    ? `a partir de ${lembrete.iniciarDiasAntes} dias antes, às ${lembrete.horario}`
                    : 'desligados'}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  Publicadas
                  <ToggleSwitch checked={publicada} onChange={setPublicada} />
                </label>
                <ToggleSwitch
                  checked={lembrete.ativo}
                  onChange={ativo => setLembrete(anterior => ({ ...anterior, ativo }))}
                />
              </div>
            </div>

            {lembreteAberto && lembrete.ativo && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <Rotulo>Começar a lembrar</Rotulo>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={lembrete.iniciarDiasAntes}
                      onChange={evento =>
                        setLembrete(anterior => ({
                          ...anterior,
                          iniciarDiasAntes: Number(evento.target.value),
                        }))
                      }
                      className="h-9 rounded-lg"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">dias antes</span>
                  </div>
                </label>

                <label className="block">
                  <Rotulo>Repetir a cada</Rotulo>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={lembrete.frequencia}
                      onChange={evento =>
                        setLembrete(anterior => ({ ...anterior, frequencia: Number(evento.target.value) }))
                      }
                      className="h-9 w-16 rounded-lg"
                    />
                    <select
                      value={lembrete.unidade}
                      onChange={evento =>
                        setLembrete(anterior => ({
                          ...anterior,
                          unidade: evento.target.value as ConfigLembrete['unidade'],
                        }))
                      }
                      className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm outline-none"
                    >
                      <option value="dias">dias</option>
                      <option value="semanas">semanas</option>
                    </select>
                  </div>
                </label>

                <label className="block">
                  <Rotulo>Horário do envio</Rotulo>
                  <Input
                    type="time"
                    value={lembrete.horario}
                    onChange={evento =>
                      setLembrete(anterior => ({ ...anterior, horario: evento.target.value }))
                    }
                    className="h-9 rounded-lg"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {grupos.map(([origem, itens]) => (
              <div key={origem}>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                  {origem}
                  <span className="font-normal">· {itens.length} avaliações</span>
                </p>

                <ul className="space-y-2">
                  {itens.map(proposta => (
                    <li key={proposta.id}>
                      <LinhaProposta
                        proposta={proposta}
                        aberta={expandida === proposta.id}
                        onAlternarDetalhes={() =>
                          setExpandida(atual => (atual === proposta.id ? null : proposta.id))
                        }
                        onMudar={mudancas => ajustar(proposta.id, mudancas)}
                        onRepetirEmTodos={() => repetirEmTodosOsPeriodos(proposta.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            <Button
              onClick={aprovar}
              disabled={selecionadas.length === 0 || criando}
              className="h-10 rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] font-semibold text-white"
            >
              {criando ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Aprovar e criar {selecionadas.length}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setPropostas([])
                setResumo([])
              }}
              className="h-10 rounded-xl text-muted-foreground"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Descartar leitura
            </Button>

            <p className="text-xs text-muted-foreground">
              Nada foi salvo ainda — só o que estiver marcado entra na agenda.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * Uma proposta na revisão.
 *
 * Os campos são editáveis na própria linha: quase toda correção é de uma
 * célula só (o período que a tabela não trazia, o horário borrado no print), e
 * abrir um formulário para cada uma custaria mais que digitar tudo de novo.
 */
function LinhaProposta({
  proposta,
  aberta,
  onAlternarDetalhes,
  onMudar,
  onRepetirEmTodos,
}: {
  proposta: PropostaRevisao
  aberta: boolean
  onAlternarDetalhes: () => void
  onMudar: (mudancas: Partial<PropostaRevisao>) => void
  onRepetirEmTodos: () => void
}) {
  const semData = !proposta.data
  const tipo = getTipoAvaliacao(proposta.tipo)

  // Aviso que o admin já resolveu editando a linha some sozinho — deixá-lo na
  // tela faria a linha corrigida continuar parecendo pendente.
  const avisos = proposta.avisos.filter(aviso => {
    if (proposta.data && aviso.startsWith('Não consegui ler a data')) return false
    if (proposta.hora && aviso.startsWith('Sem horário')) return false
    return true
  })

  return (
    <div
      className={`rounded-xl border p-2.5 transition-colors ${
        proposta.selecionada
          ? 'border-[#468152]/40 bg-[#468152]/[0.06]'
          : 'border-border/60 bg-background/60'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={proposta.selecionada}
          disabled={semData}
          onChange={evento => onMudar({ selecionada: evento.target.checked })}
          aria-label={`Aprovar ${proposta.titulo}`}
          className="mt-2.5 h-4 w-4 shrink-0 accent-[#468152]"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={proposta.titulo}
            onChange={evento => onMudar({ titulo: evento.target.value })}
            maxLength={140}
            placeholder="Título da avaliação"
            className="h-9 rounded-lg text-sm font-semibold"
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <select
              value={proposta.secao}
              onChange={evento => onMudar({ secao: evento.target.value as SecaoCurso })}
              aria-label="Seção"
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-[#468152]/50"
            >
              {SECOES.map(item => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.curto}
                </option>
              ))}
            </select>

            {/* "Todos" é a prova única do curso inteiro — um registro só, não
                uma cópia por turma. Fica no mesmo seletor porque é a mesma
                pergunta: para quem essa prova vale. */}
            <select
              value={proposta.todosOsPeriodos ? 'todos' : String(proposta.periodo)}
              onChange={evento =>
                onMudar(
                  evento.target.value === 'todos'
                    ? { todosOsPeriodos: true, periodo: 1 }
                    : { todosOsPeriodos: false, periodo: Number(evento.target.value) },
                )
              }
              aria-label="Período"
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-[#468152]/50"
            >
              <option value="todos">Todos os períodos</option>
              {periodosDoPainel(proposta.secao, proposta.periodo).map(numero => (
                <option key={numero} value={numero}>
                  {numero}º período
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={proposta.data}
              onChange={evento => onMudar({ data: evento.target.value })}
              aria-label="Data"
              className={`h-9 rounded-lg text-xs ${semData ? 'border-destructive/60' : ''}`}
            />

            <Input
              type="time"
              value={proposta.hora ?? ''}
              onChange={evento => onMudar({ hora: evento.target.value })}
              aria-label="Horário"
              className="h-9 rounded-lg text-xs"
            />

            <select
              value={proposta.tipo}
              onChange={evento => onMudar({ tipo: evento.target.value as TipoAvaliacao })}
              aria-label="Tipo"
              className="h-9 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-[#468152]/50"
            >
              {TIPOS_AVALIACAO.map(item => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            {proposta.duplicada && (
              <Selo tom="alerta">Já cadastrada nessa turma e data</Selo>
            )}
            {avisos.map(aviso => (
              <Selo key={aviso} tom={aviso.startsWith('Não') ? 'alerta' : 'neutro'}>
                {aviso}
              </Selo>
            ))}
            {proposta.data && (
              <span className="capitalize text-muted-foreground">
                {formatarDiaLongo(proposta.data)}
              </span>
            )}
            <button
              onClick={onAlternarDetalhes}
              className="ml-auto font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {aberta ? 'Menos' : 'Detalhes'}
            </button>
          </div>

          {aberta && (
            <div className="grid gap-2 rounded-lg bg-muted/30 p-2">
              <label className="block">
                <Rotulo>Local</Rotulo>
                <Input
                  value={proposta.local ?? ''}
                  onChange={evento => onMudar({ local: evento.target.value })}
                  maxLength={120}
                  placeholder="Sala 204, bloco B"
                  className="h-9 rounded-lg text-xs"
                />
              </label>
              <label className="block">
                <Rotulo>Recado no lembrete</Rotulo>
                <textarea
                  value={proposta.lembrete.observacao ?? ''}
                  onChange={evento =>
                    onMudar({ lembrete: { ...proposta.lembrete, observacao: evento.target.value } })
                  }
                  rows={2}
                  maxLength={280}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-[#468152]/50"
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  O que a tabela dizia além da data: intervalo completo, tempo estendido, outros fusos.
                </span>
              </label>

              <label className="block">
                <Rotulo>Conteúdo cobrado (opcional)</Rotulo>
                <textarea
                  value={proposta.conteudo ?? ''}
                  onChange={evento => onMudar({ conteudo: evento.target.value })}
                  rows={2}
                  maxLength={2000}
                  placeholder="A tabela de datas não diz isso. Ex.: ciclo cardíaco, ECG normal."
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-[#468152]/50"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Lida como <span className="font-semibold">{tipo.rotulo}</span> ·{' '}
                  {getSecao(proposta.secao).nome} · confiança {proposta.confianca}
                </p>
                {/* Copiar a linha em N turmas é o oposto de "prova única": para
                    a do curso inteiro, o certo é o registro só. */}
                {!proposta.todosOsPeriodos && (
                  <button
                    onClick={onRepetirEmTodos}
                    disabled={semData}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    <Copy className="h-3 w-3" aria-hidden />
                    Repetir nos {getSecao(proposta.secao).periodos} períodos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * O que dizer quando o servidor não chegou a responder com um motivo.
 *
 * "erro 504" não ajuda ninguém: o número sozinho não diz o que fazer. Estes
 * dois códigos têm causa conhecida e uma saída prática, então é isso que a
 * tela mostra.
 */
function descreverFalhaDeRede(status: number): string {
  if (status === 504) {
    return 'a leitura passou do tempo — tabela muito densa. Tente recortar a imagem em duas partes.'
  }
  if (status === 413) return 'imagem grande demais para enviar. Recorte só a tabela.'
  return `erro ${status}`
}

/** Maior lado da imagem enviada ao modelo. */
const LADO_MAXIMO = 1600
/** Acima disso o corpo da requisição não passa pela função. */
const LIMITE_DE_ENVIO = 3.5 * 1024 * 1024

/**
 * Reduz a imagem antes de subir.
 *
 * O print do calendário costuma vir em resolução de tela cheia, e o base64
 * dele infla a requisição em um terço. Além do limite de corpo da Vercel, o
 * arquivo grande é justamente o que faz a leitura demorar mais do que a função
 * pode esperar. Mil e seiscentos pixels no maior lado mantêm a tabela legível
 * para o modelo — é a mesma ordem de grandeza que ele usa internamente.
 *
 * Qualquer tropeço (navegador sem `createImageBitmap`, PDF, canvas bloqueado)
 * devolve o arquivo original: reduzir é otimização, não pré-requisito.
 */
async function prepararParaEnvio(arquivo: File): Promise<File> {
  if (arquivo.type === 'application/pdf') return arquivo

  try {
    const bitmap = await createImageBitmap(arquivo)
    const maiorLado = Math.max(bitmap.width, bitmap.height)
    const escala = Math.min(1, LADO_MAXIMO / maiorLado)

    if (escala === 1 && arquivo.size <= LIMITE_DE_ENVIO) return arquivo

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)

    const contexto = canvas.getContext('2d')
    if (!contexto) return arquivo

    // Fundo branco: a tabela costuma vir com transparência, e JPEG sem fundo
    // fica com o texto sobre preto.
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, canvas.width, canvas.height)
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolver =>
      canvas.toBlob(resolver, 'image/jpeg', 0.88),
    )
    if (!blob || blob.size >= arquivo.size) return arquivo

    return new File([blob], `${arquivo.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
  } catch {
    return arquivo
  }
}

/**
 * Tira da proposta o que só existia para a revisão e aplica a configuração do
 * lote — que pode ter mudado depois da leitura, e é a que o admin está vendo
 * quando aperta aprovar.
 */
function paraAvaliacao(
  proposta: PropostaRevisao,
  lembrete: ConfigLembrete,
  publicada: boolean,
): Omit<Avaliacao, '_id'> {
  return {
    secao: proposta.secao,
    periodo: proposta.periodo,
    todosOsPeriodos: proposta.todosOsPeriodos === true,
    titulo: proposta.titulo.trim(),
    tipo: proposta.tipo,
    data: proposta.data,
    hora: proposta.hora || undefined,
    local: proposta.local || undefined,
    conteudo: proposta.conteudo || undefined,
    itensEmenta: [],
    // A cadência vem do lote; o recado é de cada avaliação — foi montado da
    // linha dela (horário completo, tempo estendido) e o admin pode ter
    // editado. Um sobrescreve o outro só quando o lote traz recado próprio.
    lembrete: {
      ...lembrete,
      observacao: lembrete.observacao || proposta.lembrete.observacao,
    },
    publicada,
  }
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

function Selo({ children, tom }: { children: React.ReactNode; tom: 'alerta' | 'neutro' }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 font-medium ${
        tom === 'alerta'
          ? 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F0A07E]'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {children}
    </span>
  )
}

function BotaoDiscreto({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-lg border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </button>
  )
}

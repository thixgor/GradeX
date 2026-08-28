'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { SeletorPeriodos } from '@/components/cronogramas/seletor-periodos'
import {
  diasEntre,
  formatarDiaCurto,
  formatarDiaLongo,
  textoProximidade,
} from '@/lib/cronogramas/brasilia'
import { descreverLembrete, proximosLembretes } from '@/lib/cronogramas/lembretes'
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

export type RascunhoAvaliacao = Omit<Avaliacao, '_id'> & { _id?: string }

export function avaliacaoVazia(secao: SecaoCurso, periodo: number, data: string): RascunhoAvaliacao {
  return {
    secao,
    periodo,
    titulo: '',
    tipo: 'prova',
    data,
    hora: '',
    local: '',
    conteudo: '',
    itensEmenta: [],
    lembrete: { ...LEMBRETE_PADRAO },
    publicada: true,
  }
}

interface EditorAvaliacaoProps {
  valor: RascunhoAvaliacao
  hoje: string
  /** Já existe no banco: mostra apagar e salva com PATCH. */
  existente?: boolean
  salvando?: boolean
  /**
   * Recebe uma avaliação por período marcado — sempre lista, mesmo quando é
   * uma só. Editando uma existente vem sempre com um item.
   */
  onSalvar: (valores: RascunhoAvaliacao[]) => void
  onCancelar: () => void
  onApagar?: () => void
}

/**
 * Formulário de uma avaliação, incluindo os lembretes dela.
 *
 * Ele abre DENTRO da lista, no lugar da linha — não numa página nova nem num
 * modal. A diferença importa: montar o calendário de um semestre é preencher
 * dez avaliações parecidas em sequência, e cada ida e volta de navegação
 * custaria mais que o preenchimento em si.
 *
 * A configuração de lembrete fica no mesmo formulário, e não atrás de outro
 * clique, porque "quando avisa" é parte de marcar a prova — separar as duas
 * coisas produz avaliações cadastradas com lembrete que ninguém revisou.
 *
 * Ao criar, o período é MÚLTIPLO: a mesma prova costuma valer para várias
 * turmas — a N3 do 1º ao 4º, o teste de progresso no curso inteiro — e cada
 * período marcado vira uma avaliação, criadas juntas. Editando uma que já
 * existe o período volta a ser um só: mudar a turma de uma avaliação salva é
 * outra coisa, e transformá-la em oito por engano seria irreversível.
 */
export function EditorAvaliacao({
  valor,
  hoje,
  existente = false,
  salvando = false,
  onSalvar,
  onCancelar,
  onApagar,
}: EditorAvaliacaoProps) {
  const [rascunho, setRascunho] = useState<RascunhoAvaliacao>(valor)
  const [periodos, setPeriodos] = useState<number[]>([valor.periodo])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setRascunho(valor)
    setPeriodos([valor.periodo])
  }, [valor])

  function mudar<C extends keyof RascunhoAvaliacao>(campo: C, novo: RascunhoAvaliacao[C]) {
    setRascunho(anterior => ({ ...anterior, [campo]: novo }))
  }

  function mudarLembrete<C extends keyof ConfigLembrete>(campo: C, novo: ConfigLembrete[C]) {
    setRascunho(anterior => ({ ...anterior, lembrete: { ...anterior.lembrete, [campo]: novo } }))
  }

  const previa = useMemo(
    () => proximosLembretes(rascunho, hoje, 6),
    [rascunho, hoje],
  )

  function salvar() {
    if (rascunho.titulo.trim().length < 2) {
      setErro('Dê um título à avaliação.')
      return
    }
    if (!rascunho.data) {
      setErro('Escolha a data.')
      return
    }
    setErro(null)

    onSalvar(
      existente
        ? [rascunho]
        : periodos.map(periodo => ({ ...rascunho, periodo })),
    )
  }

  const periodosDaSecao = Array.from(
    { length: Math.max(getSecao(rascunho.secao).periodos, rascunho.periodo) },
    (_, i) => i + 1,
  )

  return (
    <div className="rounded-2xl border border-[#468152]/35 bg-background/80 p-4 shadow-lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <Rotulo>Título</Rotulo>
          <Input
            autoFocus
            value={rascunho.titulo}
            onChange={event => mudar('titulo', event.target.value)}
            placeholder="Ex.: P1 de SOI I — Sistema cardiovascular"
            maxLength={140}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="block">
          <Rotulo>Seção</Rotulo>
          <select
            value={rascunho.secao}
            onChange={event => {
              const nova = event.target.value as SecaoCurso
              const teto = getSecao(nova).periodos
              setRascunho(anterior => ({
                ...anterior,
                secao: nova,
                periodo: Math.min(anterior.periodo, teto),
              }))
              // O curso novo pode ser mais curto: períodos que não existem
              // nele saem da seleção em vez de virarem avaliação recusada.
              setPeriodos(anterior => {
                const cortados = anterior.filter(numero => numero <= teto)
                return cortados.length > 0 ? cortados : [1]
              })
            }}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#468152]/50"
          >
            {SECOES.map(secao => (
              <option key={secao.id} value={secao.id}>
                {secao.emoji} {secao.nome}
              </option>
            ))}
          </select>
        </label>

        {existente && (
          <label className="block">
            <Rotulo>Período</Rotulo>
            <select
              value={rascunho.periodo}
              onChange={event => mudar('periodo', Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#468152]/50"
            >
              {periodosDaSecao.map(numero => (
                <option key={numero} value={numero}>
                  {numero}º período
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <Rotulo>Data</Rotulo>
          <Input
            type="date"
            value={rascunho.data}
            onChange={event => mudar('data', event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        {/* Criar é o momento em que a mesma prova vale para várias turmas: os
            períodos ficam numa linha inteira, marcáveis de uma vez. */}
        {!existente && (
          <div className="sm:col-span-2">
            <Rotulo>Períodos</Rotulo>
            <SeletorPeriodos secao={rascunho.secao} valor={periodos} onChange={setPeriodos} />
          </div>
        )}

        <label className="block">
          <Rotulo>Horário (opcional)</Rotulo>
          <Input
            type="time"
            value={rascunho.hora ?? ''}
            onChange={event => mudar('hora', event.target.value)}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="block">
          <Rotulo>Tipo</Rotulo>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_AVALIACAO.map(tipo => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => mudar('tipo', tipo.id as TipoAvaliacao)}
                aria-pressed={rascunho.tipo === tipo.id}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  rascunho.tipo === tipo.id
                    ? tipo.classe
                    : 'border-border/60 bg-background/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tipo.emoji} {tipo.rotulo}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <Rotulo>Local (opcional)</Rotulo>
          <Input
            value={rascunho.local ?? ''}
            onChange={event => mudar('local', event.target.value)}
            placeholder="Sala 204, bloco B"
            maxLength={120}
            className="h-11 rounded-xl"
          />
        </label>

        <label className="block sm:col-span-2">
          <Rotulo>Conteúdo cobrado (opcional)</Rotulo>
          <textarea
            value={rascunho.conteudo ?? ''}
            onChange={event => mudar('conteudo', event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Vai direto para o lembrete do aluno. Ex.: ciclo cardíaco, ECG normal, circulação fetal."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#468152]/50"
          />
        </label>
      </div>

      {/* ── Lembretes ── */}
      <fieldset className="mt-4 rounded-xl border border-border/60 bg-muted/25 p-3">
        <legend className="sr-only">Lembretes desta avaliação</legend>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {rascunho.lembrete.ativo ? (
              <Bell className="h-4 w-4 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            Lembretes desta avaliação
          </span>
          <ToggleSwitch
            checked={rascunho.lembrete.ativo}
            onChange={ativo => mudarLembrete('ativo', ativo)}
            className="shrink-0"
          />
        </div>

        {rascunho.lembrete.ativo && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <Rotulo>Começar a lembrar</Rotulo>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    value={rascunho.lembrete.iniciarDiasAntes}
                    onChange={event => mudarLembrete('iniciarDiasAntes', Number(event.target.value))}
                    className="h-10 rounded-lg"
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
                    value={rascunho.lembrete.frequencia}
                    onChange={event => mudarLembrete('frequencia', Number(event.target.value))}
                    className="h-10 w-16 rounded-lg"
                  />
                  <select
                    value={rascunho.lembrete.unidade}
                    onChange={event => mudarLembrete('unidade', event.target.value as 'dias' | 'semanas')}
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-2 text-sm outline-none"
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
                  value={rascunho.lembrete.horario}
                  onChange={event => mudarLembrete('horario', event.target.value)}
                  className="h-10 rounded-lg"
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">Horário de Brasília</span>
              </label>
            </div>

            <label className="mt-3 block">
              <Rotulo>Recado no lembrete (opcional)</Rotulo>
              <Input
                value={rascunho.lembrete.observacao ?? ''}
                onChange={event => mudarLembrete('observacao', event.target.value)}
                placeholder="Ex.: levar jaleco e calculadora."
                maxLength={280}
                className="h-10 rounded-lg"
              />
            </label>

            {/* A prévia é a mesma função que o cron usa — o que está aqui é o
                que vai sair de fato. */}
            <div className="mt-3 rounded-lg bg-background/70 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
                Próximos envios
              </p>
              {previa.length === 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Nenhum envio pela frente — a janela configurada já passou ou a data é anterior a hoje.
                </p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {previa.map(item => (
                    <li
                      key={item.dia}
                      className="rounded-md bg-[#468152]/10 px-2 py-1 text-[11px] font-medium text-[#468152] dark:text-[#7DCEA0]"
                    >
                      {formatarDiaCurto(item.dia)}
                      <span className="ml-1 opacity-70">({textoProximidade(item.diasRestantes)})</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Só recebe quem ativou &ldquo;Quero receber lembretes das minhas avaliações&rdquo; e acompanha{' '}
                {getSecao(rascunho.secao).nome} ·{' '}
                {existente || periodos.length === 1
                  ? `${existente ? rascunho.periodo : periodos[0]}º período`
                  : `${periodos.map(numero => `${numero}º`).join(', ')} períodos`}
                .
              </p>
            </div>
          </>
        )}
      </fieldset>

      {erro && <p className="mt-3 text-xs font-medium text-destructive">{erro}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={salvar} disabled={salvando} className="h-10 rounded-xl">
          {salvando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
          {existente
            ? 'Salvar'
            : periodos.length > 1
              ? `Criar ${periodos.length} avaliações`
              : 'Criar avaliação'}
        </Button>

        <Button variant="ghost" onClick={onCancelar} className="h-10 rounded-xl">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancelar
        </Button>

        <label className="ml-auto flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {rascunho.publicada ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {rascunho.publicada ? 'Visível para os alunos' : 'Rascunho'}
          <ToggleSwitch checked={rascunho.publicada} onChange={valor => mudar('publicada', valor)} />
        </label>

        {existente && onApagar && (
          <Button
            variant="ghost"
            onClick={onApagar}
            className="h-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

/**
 * Uma avaliação em modo leitura, na lista do painel.
 *
 * Tudo que o admin precisa decidir "isso está certo?" cabe na linha: quando é,
 * quanto falta, se está publicada e como os lembretes estão configurados. Os
 * dois interruptores agem no lugar, sem abrir o formulário — ligar lembrete de
 * seis avaliações não deveria custar seis edições.
 */
export function LinhaAvaliacao({
  avaliacao,
  hoje,
  ocupado,
  onEditar,
  onAlternarPublicada,
  onAlternarLembrete,
}: {
  avaliacao: Avaliacao
  hoje: string
  ocupado?: boolean
  onEditar: () => void
  onAlternarPublicada: (publicada: boolean) => void
  onAlternarLembrete: (ativo: boolean) => void
}) {
  const tipo = getTipoAvaliacao(avaliacao.tipo)
  const secao = getSecao(avaliacao.secao)
  const dias = diasEntre(hoje, avaliacao.data)
  const passou = dias < 0

  return (
    <div
      className={`rounded-2xl border border-border/50 bg-background/60 p-3.5 transition-colors hover:border-foreground/15 ${
        passou ? 'opacity-65' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button onClick={onEditar} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}>
              {tipo.rotulo}
            </span>
            <span className="text-sm font-semibold text-foreground">{avaliacao.titulo}</span>
            {!avaliacao.publicada && (
              <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Rascunho
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span style={{ color: secao.cor }} className="font-semibold">
              {secao.emoji} {secao.curto} · {avaliacao.periodo}º
            </span>
            <span className="capitalize">{formatarDiaLongo(avaliacao.data)}</span>
            {avaliacao.hora && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                {avaliacao.hora}
              </span>
            )}
            {avaliacao.local && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {avaliacao.local}
              </span>
            )}
            <span className="font-medium">{textoProximidade(dias)}</span>
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {avaliacao.lembrete.ativo ? (
              <Bell className="h-3 w-3 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
            ) : (
              <BellOff className="h-3 w-3" aria-hidden />
            )}
            {descreverLembrete(avaliacao.lembrete)}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />}
          <Interruptor
            rotulo="Lembretes"
            checked={avaliacao.lembrete.ativo}
            onChange={onAlternarLembrete}
            disabled={ocupado}
          />
          <Interruptor
            rotulo="Publicada"
            checked={avaliacao.publicada}
            onChange={onAlternarPublicada}
            disabled={ocupado}
          />
        </div>
      </div>
    </div>
  )
}

function Interruptor({
  rotulo,
  checked,
  onChange,
  disabled,
}: {
  rotulo: string
  checked: boolean
  onChange: (valor: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</span>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </label>
  )
}

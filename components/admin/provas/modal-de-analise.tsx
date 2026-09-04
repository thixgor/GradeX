'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookOpenCheck, FileDown, Image as ImageIcon, Loader2, Medal, Type } from 'lucide-react'
import {
  OPCOES_PADRAO,
  questaoMaisAcertada,
  questaoMaisErrada,
  type DadosDaAnalise,
  type OpcoesDaAnalise,
} from '@/lib/pdf/analise-da-prova'
import { cn } from '@/lib/utils'

/**
 * O que entra no PDF de análise que o professor manda para a turma.
 *
 * ## Por que é configurável
 *
 * A mesma prova rende relatórios diferentes conforme a turma. Uma classificação
 * com nomes é combustível numa turma que compete e constrangimento numa turma
 * de doze pessoas onde a última colocação tem nome e sobrenome. A questão mais
 * errada com a resposta comentada é meia aula pronta — mas abrir o comentário é
 * decidir liberar o gabarito agora, e essa decisão é de quem aplicou a prova.
 *
 * Um relatório fixo obrigaria o professor a escolher entre mandar demais e não
 * mandar nada. Aqui ele monta o documento.
 *
 * ## O que a tela mostra antes de gerar
 *
 * Quais questões vão sair em destaque, com número e percentual — porque
 * "questão mais errada" é uma descrição, e o professor precisa ver QUAL é antes
 * de decidir se manda o enunciado dela para a turma inteira.
 */
export function ModalDeAnalise({
  aberto,
  onOpenChange,
  dados,
  onGerar,
  gerando,
}: {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  dados: DadosDaAnalise | null
  onGerar: (opcoes: OpcoesDaAnalise) => void
  gerando: boolean
}) {
  const [opcoes, setOpcoes] = useState<OpcoesDaAnalise>(OPCOES_PADRAO)

  const maisErrada = dados ? questaoMaisErrada(dados) : null
  const maisAcertada = dados ? questaoMaisAcertada(dados) : null
  const temEntregas = (dados?.presenca.entregaram ?? 0) > 0

  const mudar = (parcial: Partial<OpcoesDaAnalise>) => setOpcoes((atual) => ({ ...atual, ...parcial }))

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-[#468152]" />
            PDF de análise da prova
          </DialogTitle>
          <DialogDescription>
            Monte o relatório que vai para a turma. Cada bloco é opcional — o que você desmarcar não
            aparece no documento.
          </DialogDescription>
        </DialogHeader>

        {!temEntregas && (
          <p className="rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Nenhuma entrega registrada nesta prova. O PDF sai só com a capa — sem nota, não há
            análise a fazer.
          </p>
        )}

        <div className="space-y-4">
          <Bloco titulo="Abertura">
            <Chave
              marcado={opcoes.capa}
              onChange={(v) => mudar({ capa: v })}
              titulo="Capa da prova"
              descricao="A imagem de capa, o título, a descrição e a ficha técnica (questões, pontuação, data)."
            />
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="recado" className="text-xs font-semibold">
                Recado para a turma <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="recado"
                value={opcoes.recado}
                onChange={(e) => mudar({ recado: e.target.value.slice(0, 600) })}
                rows={3}
                placeholder="Ex.: A prova foi mais difícil do que eu esperava na parte de fisiologia. Vamos revisar a questão 12 na próxima aula."
                className="resize-none text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Sai numa tarja logo abaixo da capa. {opcoes.recado.length}/600
              </p>
            </div>
          </Bloco>

          <Bloco titulo="Números">
            <Chave
              marcado={opcoes.resultadosGerais}
              onChange={(v) => mudar({ resultadosGerais: v })}
              titulo="Resultados gerais"
              descricao="Entregas, média, mediana, menor nota e a distribuição das notas por faixa."
            />
            <Chave
              marcado={opcoes.maiorNota}
              onChange={(v) => mudar({ maiorNota: v })}
              titulo="Maior nota"
              descricao="O teto que a turma alcançou, em destaque."
            />
            <Chave
              marcado={opcoes.mediaDeAcertos}
              onChange={(v) => mudar({ mediaDeAcertos: v })}
              titulo="Média de acertos"
              descricao="Quantas objetivas o aluno médio acertou — em questões, não em pontos."
            />
            <Chave
              marcado={opcoes.tempoMedio}
              onChange={(v) => mudar({ tempoMedio: v })}
              titulo="Tempo médio de prova"
              descricao="Quanto a turma levou, em horas e minutos, com mediana e extremos."
            />
          </Bloco>

          <Bloco titulo="Classificação" icone={Medal}>
            <Chave
              marcado={opcoes.classificacao.incluir}
              onChange={(v) => mudar({ classificacao: { ...opcoes.classificacao, incluir: v } })}
              titulo="Incluir a classificação"
              descricao="Pódio com medalha nos três primeiros e barra de nota em cada linha."
            />
            {opcoes.classificacao.incluir && (
              <div className="ml-7 space-y-3 border-l border-border/60 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs font-semibold">Top</Label>
                  {[3, 5, 10, 20, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => mudar({ classificacao: { ...opcoes.classificacao, top: n } })}
                      className={cn(
                        'rounded-lg border px-3 py-1 text-xs font-semibold transition-colors',
                        opcoes.classificacao.top === n
                          ? 'border-[#468152] bg-[#468152]/10 text-[#468152] dark:text-emerald-400'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Chave
                  compacto
                  marcado={opcoes.classificacao.comNome}
                  onChange={(v) => mudar({ classificacao: { ...opcoes.classificacao, comNome: v } })}
                  titulo="Mostrar os nomes"
                  descricao="Desmarcado, a lista sai como “Participante 1, 2, 3…” — a forma da turma sem expor ninguém."
                />
                <Chave
                  compacto
                  marcado={opcoes.classificacao.comAcertos}
                  onChange={(v) => mudar({ classificacao: { ...opcoes.classificacao, comAcertos: v } })}
                  titulo="Mostrar quantas acertou"
                  descricao="“14/20 acertos” ao lado da nota."
                />
              </div>
            )}
          </Bloco>

          <Bloco titulo="Questões em destaque" icone={BookOpenCheck}>
            <QuestaoEmDestaque
              rotulo="Questão mais errada"
              questao={maisErrada}
              config={opcoes.questaoMaisErrada}
              onChange={(c) => mudar({ questaoMaisErrada: c })}
            />
            <QuestaoEmDestaque
              rotulo="Questão mais acertada"
              questao={maisAcertada}
              config={opcoes.questaoMaisAcertada}
              onChange={(c) => mudar({ questaoMaisAcertada: c })}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Cada uma sai com o gráfico de como a turma se dividiu entre as alternativas — é ele que
              separa “a turma não estudou” de “a questão está mal escrita”.
            </p>
          </Bloco>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={gerando}>
            Cancelar
          </Button>
          <Button
            onClick={() => onGerar(opcoes)}
            disabled={gerando || !dados}
            className="bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38]"
          >
            {gerando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Montando o PDF…
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Bloco({
  titulo,
  icone: Icone,
  children,
}: {
  titulo: string
  icone?: typeof Medal
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {Icone && <Icone className="h-3.5 w-3.5" />}
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Chave({
  marcado,
  onChange,
  titulo,
  descricao,
  compacto = false,
}: {
  marcado: boolean
  onChange: (v: boolean) => void
  titulo: string
  descricao?: string
  compacto?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-input accent-[#468152]"
      />
      <span className="min-w-0 flex-1">
        <span className={cn('block font-semibold', compacto ? 'text-xs' : 'text-sm')}>{titulo}</span>
        {descricao && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{descricao}</span>
        )}
      </span>
    </label>
  )
}

/**
 * Uma questão em destaque e o que sai dela.
 *
 * O número e o percentual aparecem porque "questão mais errada" é uma
 * descrição, não uma identidade: antes de mandar o enunciado para a turma
 * inteira, o professor precisa ver QUAL questão o relatório escolheu.
 */
function QuestaoEmDestaque({
  rotulo,
  questao,
  config,
  onChange,
}: {
  rotulo: string
  questao: { number: number; percentualDeAcerto: number | null; imageUrl?: string | null; respostaComentada?: string | null } | null
  config: { incluir: boolean; enunciado: boolean; imagem: boolean; respostaComentada: boolean }
  onChange: (c: { incluir: boolean; enunciado: boolean; imagem: boolean; respostaComentada: boolean }) => void
}) {
  if (!questao) {
    return (
      <p className="text-[11px] text-muted-foreground">
        {rotulo}: sem objetivas respondidas ainda — este bloco não sai no PDF.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Chave
        marcado={config.incluir}
        onChange={(v) => onChange({ ...config, incluir: v })}
        titulo={rotulo}
        descricao={`Questão ${questao.number} · ${
          questao.percentualDeAcerto === null ? '—' : `${questao.percentualDeAcerto.toFixed(0)}% de acerto`
        }`}
      />
      {config.incluir && (
        <div className="ml-7 flex flex-wrap gap-2">
          <Pilula
            marcado={config.enunciado}
            onClick={() => onChange({ ...config, enunciado: !config.enunciado })}
            icone={Type}
            texto="Enunciado"
          />
          <Pilula
            marcado={config.imagem}
            onClick={() => onChange({ ...config, imagem: !config.imagem })}
            icone={ImageIcon}
            texto="Imagem"
            desabilitado={!questao.imageUrl}
            motivo="Esta questão não tem imagem"
          />
          <Pilula
            marcado={config.respostaComentada}
            onClick={() => onChange({ ...config, respostaComentada: !config.respostaComentada })}
            icone={BookOpenCheck}
            texto="Resposta comentada"
            desabilitado={!questao.respostaComentada}
            motivo="Esta questão não tem resposta comentada"
          />
        </div>
      )}
    </div>
  )
}

function Pilula({
  marcado,
  onClick,
  icone: Icone,
  texto,
  desabilitado,
  motivo,
}: {
  marcado: boolean
  onClick: () => void
  icone: typeof Type
  texto: string
  desabilitado?: boolean
  motivo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      title={desabilitado ? motivo : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors',
        desabilitado
          ? 'cursor-not-allowed border-border/50 text-muted-foreground/50'
          : marcado
            ? 'border-[#468152] bg-[#468152]/10 text-[#468152] dark:text-emerald-400'
            : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      <Icone className="h-3 w-3" />
      {texto}
    </button>
  )
}

'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * As duas operações do banco que mexem em tudo de uma vez.
 *
 * Ficam juntas, separadas do resto e com moldura vermelha, porque compartilham
 * a mesma propriedade: são de UM clique e afetam o acervo inteiro. Espalhá-las
 * entre os cartões de "Gerenciar" as tornaria vizinhas de ações inofensivas, e
 * é aí que se clica errado.
 *
 * Esvaziar exige DIGITAR a frase. Um `confirm()` de navegador some com um Enter
 * distraído; digitar "APAGAR TUDO" não acontece por acidente.
 */
export function ZonaDeRisco({ onMudou }: { onMudou?: () => void }) {
  const [apagarAberto, setApagarAberto] = useState(false)
  const [frase, setFrase] = useState('')
  const [apagarHierarquia, setApagarHierarquia] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [resultadoApagar, setResultadoApagar] = useState<any>(null)

  const [corrigindo, setCorrigindo] = useState(false)
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)
  const [resultadoCorrigir, setResultadoCorrigir] = useState<{
    corrigidas: number
    semPeriodo: number
  } | null>(null)

  const [erro, setErro] = useState('')

  async function apagarTudo() {
    setErro('')
    setApagando(true)
    try {
      const res = await fetch('/api/admin/banco/questoes/apagar-tudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacao: frase, apagarHierarquia }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível esvaziar o banco')
        return
      }
      setResultadoApagar(dados)
      setApagarAberto(false)
      setFrase('')
      setApagarHierarquia(false)
      onMudou?.()
    } catch {
      setErro('Não foi possível esvaziar o banco')
    } finally {
      setApagando(false)
    }
  }

  /**
   * Relê o período do nome da prova, em ondas.
   *
   * Milhares de questões numa requisição só estouram o tempo da função e falham
   * depois de já ter escrito — a mesma armadilha que a importação resolveu
   * andando de pedaço em pedaço.
   */
  async function corrigirPeriodos() {
    setErro('')
    setCorrigindo(true)
    setResultadoCorrigir(null)
    let offset = 0
    let corrigidas = 0
    let semPeriodo = 0

    try {
      for (let volta = 0; volta < 5000; volta++) {
        const res = await fetch('/api/admin/banco/questoes/corrigir-periodos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset }),
        })
        const dados = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErro(
            `${dados.error || 'A correção parou'} — ${corrigidas} questões já foram corrigidas. Pode rodar de novo.`,
          )
          return
        }
        corrigidas += dados.corrigidas || 0
        semPeriodo += dados.semPeriodo || 0
        offset = dados.proximoOffset ?? offset + (dados.lidas || 0)
        setProgresso({ feitas: Math.min(offset, dados.total || offset), total: dados.total || offset })
        if (dados.fim) break
      }
      setResultadoCorrigir({ corrigidas, semPeriodo })
      onMudou?.()
    } finally {
      setCorrigindo(false)
      setProgresso(null)
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
        <AlertTriangle className="h-5 w-5" />
        Zona de risco
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Operações que valem para o banco inteiro de uma vez.
      </p>

      {erro ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {erro}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {/* ── Corrigir períodos ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Reler o período das provas
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            As questões importadas antes desta versão pegaram o ano da data em que a prova foi{' '}
            <em>cadastrada</em> aqui, não de quando ela foi aplicada. Isto relê o período do nome da
            prova — “N1 SOI I - 2023.2” vira 2023.2 — sem tocar em enunciado, gabarito ou
            estatística.
          </p>
          <Button
            variant="outline"
            className="mt-3 w-full gap-2 rounded-xl"
            disabled={corrigindo}
            onClick={corrigirPeriodos}
          >
            {corrigindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {corrigindo
              ? `Corrigindo… ${progresso ? `${progresso.feitas}/${progresso.total}` : ''}`
              : 'Corrigir períodos'}
          </Button>

          {progresso && progresso.total > 0 ? (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${(progresso.feitas / progresso.total) * 100}%` }}
              />
            </div>
          ) : null}

          {resultadoCorrigir ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>
                {resultadoCorrigir.corrigidas} questões corrigidas.
                {resultadoCorrigir.semPeriodo > 0
                  ? ` ${resultadoCorrigir.semPeriodo} ficaram como estavam — o nome da prova não diz o período.`
                  : ''}
              </span>
            </p>
          ) : null}
        </div>

        {/* ── Apagar tudo ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-destructive/30 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive">
            <Trash2 className="h-4 w-4" />
            Apagar todas as questões
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Esvazia o banco por completo. Vão junto as resoluções, o histórico e as listas dos
            alunos — e o saldo de questões gratuitas volta a ficar disponível, porque o que foi
            aberto deixa de existir. Não dá para desfazer.
          </p>
          <Button
            variant="destructive"
            className="mt-3 w-full gap-2 rounded-xl"
            onClick={() => {
              setResultadoApagar(null)
              setApagarAberto(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
            Apagar todas as questões
          </Button>

          {resultadoApagar ? (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Banco esvaziado
              </p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                <li>{resultadoApagar.questoes} questões apagadas</li>
                <li>{resultadoApagar.resolucoes} resoluções e {resultadoApagar.listas} listas removidas</li>
                {resultadoApagar.hierarquia?.modulos ? (
                  <li>
                    {resultadoApagar.hierarquia.modulos} módulos, {resultadoApagar.hierarquia.topicos}{' '}
                    tópicos e {resultadoApagar.hierarquia.subtopicos} subtópicos apagados
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Confirmação ────────────────────────────────────────────────── */}
      <Dialog open={apagarAberto} onOpenChange={(a) => !a && !apagando && setApagarAberto(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Apagar todas as questões
            </DialogTitle>
            <DialogDescription>
              Isto apaga o banco inteiro e não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <li>• todas as questões do banco</li>
            <li>• todas as resoluções e o histórico dos alunos</li>
            <li>• todas as listas montadas pelos alunos</li>
            <li>• o registro de questões gratuitas já abertas</li>
          </ul>

          <label className="flex cursor-pointer items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={apagarHierarquia}
              onChange={(e) => setApagarHierarquia(e.target.checked)}
            />
            <span>
              Apagar também a hierarquia (módulos, tópicos e subtópicos).
              <span className="block text-muted-foreground">
                Deixe desmarcado para reimportar as provas na mesma organização.
              </span>
            </span>
          </label>

          <div>
            <label className="text-xs font-semibold" htmlFor="frase-apagar">
              Digite <span className="font-mono text-destructive">APAGAR TUDO</span> para confirmar
            </label>
            <Input
              id="frase-apagar"
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              placeholder="APAGAR TUDO"
              autoComplete="off"
              className={cn('mt-1 font-mono', frase && frase.trim().toUpperCase() !== 'APAGAR TUDO' && 'border-destructive/50')}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={apagando} onClick={() => setApagarAberto(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={apagando || frase.trim().toUpperCase() !== 'APAGAR TUDO'}
              onClick={apagarTudo}
            >
              {apagando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Apagar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

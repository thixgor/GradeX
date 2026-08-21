'use client'

import { BookOpen, Download, FileText, Layers, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  BarList,
  EmptyState,
  SERIES_COLORS,
  StatCard,
  formatNumber,
  formatRelative,
} from './viz'
import { downloadCsv } from './csv'
import type { ContentPayload } from './types'

/**
 * Aba "Conteúdo": quem abriu o Manual Clínico, os materiais e o resto — e o
 * que cada pessoa abriu. Os downloads entram ao lado das aberturas de
 * propósito: um conteúdo muito lido e pouco baixado parecia morto no painel
 * antigo, que só contava download.
 */
export function TabContent({
  data,
  onOpenUser,
}: {
  data: ContentPayload | null
  onOpenUser: (userId: string) => void
}) {
  if (!data) return <EmptyState message="Carregando conteúdo..." />

  const { resumo, manualClinico, materiais, downloads, feed } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Aberturas no período"
          value={formatNumber(resumo.aberturasNoPeriodo)}
          hint="todo o conteúdo"
          icon={<BookOpen className="h-4 w-4" />}
          accent="var(--viz-1)"
        />
        <StatCard
          label="Downloads no período"
          value={formatNumber(resumo.downloadsNoPeriodo)}
          hint="PDFs gerados"
          icon={<Download className="h-4 w-4" />}
          accent="var(--viz-2)"
        />
        <StatCard
          label="Patologias publicadas"
          value={formatNumber(resumo.totalPatologias)}
          icon={<Stethoscope className="h-4 w-4" />}
          accent="var(--viz-3)"
        />
        <StatCard
          label="Materiais publicados"
          value={formatNumber(resumo.totalMateriais)}
          icon={<FileText className="h-4 w-4" />}
          accent="var(--viz-4)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Uso por área</h3>
            <p className="text-xs text-muted-foreground">Aberturas e quantas pessoas distintas chegaram lá</p>
          </header>
          <BarList
            items={data.porArea.map(a => ({
              label: a.area,
              value: a.aberturas,
              hint: `${formatNumber(a.leitores)} pessoas`,
              color: SERIES_COLORS[0],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Tipos de abertura</h3>
            <p className="text-xs text-muted-foreground">O que exatamente foi aberto</p>
          </header>
          <BarList
            items={data.porTipo.map(t => ({
              label: t.rotulo,
              value: t.aberturas,
              hint: `${formatNumber(t.leitores)} pessoas`,
              color: SERIES_COLORS[1],
            }))}
          />
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Manual Clínico — patologias mais abertas</h3>
            <p className="text-xs text-muted-foreground">Leitura da página, não só download do PDF</p>
          </div>
        </header>
        <BarList
          items={manualClinico.maisAbertas.map(p => ({
            label: p.titulo,
            value: p.aberturas,
            hint: `${formatNumber(p.leitores)} pessoas · ${formatRelative(p.ultima)}`,
            color: SERIES_COLORS[2],
          }))}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Catálogo por área</h3>
            <p className="text-xs text-muted-foreground">Quantas patologias existem em cada área</p>
          </header>
          <BarList
            items={manualClinico.porArea.map(a => ({
              label: a.label,
              value: a.count,
              color: SERIES_COLORS[2],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Catálogo por sistema</h3>
              <p className="text-xs text-muted-foreground">Onde o Manual está mais completo</p>
            </div>
          </header>
          <div className="max-h-[360px] overflow-y-auto">
            <BarList
              items={manualClinico.porSistema.map(s => ({
                label: s.label,
                value: s.count,
                color: SERIES_COLORS[2],
              }))}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Materiais mais abertos</h3>
            <p className="text-xs text-muted-foreground">Página do material</p>
          </header>
          <BarList
            items={materiais.maisAbertos.map(m => ({
              label: m.titulo,
              value: m.aberturas,
              hint: `${formatNumber(m.leitores)} pessoas`,
              color: SERIES_COLORS[0],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Leitores abertos de fato</h3>
            <p className="text-xs text-muted-foreground">Quem passou da vitrine e abriu o conteúdo</p>
          </header>
          <BarList
            items={[...materiais.leitorPdf, ...materiais.leitorHtml]
              .sort((a, b) => b.aberturas - a.aberturas)
              .slice(0, 20)
              .map(m => ({
                label: m.titulo,
                value: m.aberturas,
                hint: `${formatNumber(m.leitores)} pessoas`,
                color: SERIES_COLORS[1],
              }))}
          />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Downloads por tipo</h3>
          </header>
          <BarList
            items={downloads.porTipo.map(d => ({
              label: d.rotulo,
              value: d.count,
              color: SERIES_COLORS[3],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Quem mais baixa</h3>
          </header>
          <BarList
            items={downloads.porUsuario.map(u => ({
              label: u.nome,
              value: u.count,
              hint: formatRelative(u.ultimo),
              color: SERIES_COLORS[3],
              onClick: u.userId ? () => onOpenUser(u.userId) : undefined,
            }))}
          />
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3">
          <h3 className="text-sm font-semibold">Arquivos mais baixados</h3>
        </header>
        <BarList
          items={downloads.maisBaixados.map(d => ({
            label: d.titulo,
            value: d.count,
            hint: `${d.rotulo} · ${formatRelative(d.ultimo)}`,
            color: SERIES_COLORS[4],
          }))}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Quem abriu o quê</h3>
            <p className="text-xs text-muted-foreground">Aberturas mais recentes do período</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={feed.length === 0}
            onClick={() => downloadCsv(`aberturas-${data.range.key}`, feed as any)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </Button>
        </header>
        {feed.length === 0 ? (
          <div className="p-4">
            <EmptyState
              message="Nenhuma abertura registrada no período"
              hint="Os registros aparecem conforme os alunos navegam pela plataforma."
            />
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Quando</th>
                  <th className="px-3 py-2 text-left font-medium">Quem</th>
                  <th className="px-3 py-2 text-left font-medium">Ação</th>
                  <th className="px-3 py-2 text-left font-medium">Conteúdo</th>
                  <th className="px-3 py-2 text-center font-medium">Aparelho</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((e, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">{formatRelative(e.em)}</td>
                    <td className="px-3 py-2">
                      {e.userId ? (
                        <button onClick={() => onOpenUser(e.userId!)} className="font-medium hover:underline">
                          {e.nome}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">{e.nome}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{e.rotulo}</td>
                    <td className="max-w-[260px] truncate px-3 py-2">{e.titulo}</td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{e.dispositivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

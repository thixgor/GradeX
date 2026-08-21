'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Download, FileUp, History, Upload } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  BotaoPrincipal,
  BotaoSecundario,
  Campo,
  PainelDeEnsino,
  classeDeArea,
} from '@/components/ensino/painel'
import { cn } from '@/lib/utils'

/**
 * Importação e migração (§30, §36).
 *
 * O ENSAIO NÃO É OPCIONAL NESTA TELA
 *
 * Toda operação aqui roda primeiro em ensaio, e o botão de aplicar só aparece
 * depois que o relatório é exibido. Um arquivo com o nome errado no cabeçalho
 * pode duplicar um acervo inteiro; ver "12 aulas novas, 3 atualizadas" antes de
 * confirmar é a única defesa razoável — e ela custa um clique.
 *
 * O relatório é o mesmo nos dois modos, porque é o mesmo código: o ensaio só
 * não escreve.
 */

const MODELO = `# Importação — Domine Aqui

## Taxonomia

- Área: Medicina
  - Módulo: Ciclo Clínico
    - Tópico: Cardiologia
      - Subtópico: Insuficiência Cardíaca

## Aulas

### Aula: Fisiopatologia da Insuficiência Cardíaca
- localizacao: Medicina > Ciclo Clínico > Cardiologia > Insuficiência Cardíaca
- duracao: 18min
- profundidade: intermediario
- tags: remodelamento, SRAA
- video: https://cdn.exemplo.com/fisiopatologia-ic.mp4
- descricao: Como o coração adoecido tenta compensar — e por que isso piora.
- prerequisitos: Lei de Frank-Starling; Débito cardíaco
- resumo: Fisiopatologia da IC em 4 minutos | 4min | https://cdn.exemplo.com/ic-resumo.mp4
- pdf: Resumo em PDF | https://cdn.exemplo.com/ic.pdf
- acesso: plus

## Trilhas

### Trilha: Entenda Insuficiência Cardíaca do Zero
- subtitulo: Do débito cardíaco ao tratamento da ICFEr
- nivel: iniciante
- publico: Ciclo Clínico
- duracao: 6h

#### Etapa: Antes da doença
- Débito cardíaco
- Lei de Frank-Starling

#### Etapa: Entenda a doença
- Fisiopatologia da Insuficiência Cardíaca
`

interface Relatorio {
  ensaio: boolean
  nos: { criados: number; atualizados: number; nomes: string[] }
  aulas: { criadas: number; atualizadas: number; titulos: string[] }
  resumos: { criados: number; vinculados: number }
  trilhas: { criadas: number; atualizadas: number; titulos: string[] }
  naoResolvidas: string[]
  avisos: string[]
}

interface PlanoDeMigracao {
  ensaio: boolean
  plano: {
    nos: number
    aulas: number
    semLocalizacao: number
    jaMigradas: number
    amostra?: Array<{ nome: string; nivel: string }>
  }
}

export default function ImportarPage() {
  return (
    <AppShell headerTitle="Importar" headerSubtitle="Administração de Ensino">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [conteudo, setConteudo] = useState('')
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [migracao, setMigracao] = useState<PlanoDeMigracao | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(acao: 'importar' | 'migrar', ensaio: boolean) {
    setOcupado(true)
    setErro('')

    /*
     * O `fetch` do navegador não tem prazo nenhum por padrão — se alguma
     * peça no meio do caminho (um proxy, um balanceador) derrubar a conexão
     * sem devolver um status HTTP de verdade, a requisição fica "pendente"
     * para sempre e a tela mostra "carregando" indefinidamente, sem erro
     * nenhum para a pessoa agir. `maxDuration = 300` na rota (ver
     * app/api/ensino/importar/route.ts) já limita quanto tempo o SERVIDOR
     * tenta; isto limita quanto tempo o NAVEGADOR espera, com uma folga de
     * 20s para o servidor terminar de responder antes de desistir. O ensaio
     * nunca escreve, então nunca deveria demorar — um prazo bem mais curto
     * torna óbvio que travou por outro motivo, não pelo tamanho do arquivo.
     */
    const prazoMs = ensaio ? 30_000 : 320_000
    const controle = new AbortController()
    const cronometro = setTimeout(() => controle.abort(), prazoMs)

    try {
      const resposta = await fetch('/api/ensino/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, ensaio, conteudo }),
        signal: controle.signal,
      })
      // Um arquivo grande demora, e a aplicação de verdade (não o ensaio)
      // pode estourar o tempo do servidor antes de terminar de escrever. Nesse
      // caso a resposta não é o JSON de sempre — é uma página de erro do
      // próprio servidor —, e sem este aviso específico a pessoa só via "Não
      // foi possível processar." sem saber que o motivo era o tamanho.
      const d = await resposta.json().catch(() => {
        if (!ensaio && (resposta.status === 502 || resposta.status === 504)) {
          throw new Error(
            'A importação demorou demais para o servidor responder. Divida o arquivo em partes menores e importe cada uma separadamente.',
          )
        }
        return {}
      })
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível processar.')
      if (acao === 'migrar') setMigracao(d)
      else setRelatorio(d.relatorio)
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setErro(
          ensaio
            ? 'A prévia demorou demais para responder. Tente de novo — se persistir, o arquivo pode ter um problema.'
            : 'A importação demorou demais e o navegador desistiu de esperar, mas ela pode ter continuado rodando no servidor. Espere um instante, confira o Catálogo e as Trilhas — se o conteúdo já apareceu, está pronto; se não, pode tentar de novo (reimportar atualiza em vez de duplicar).',
        )
      } else {
        setErro(e?.message || 'Não foi possível processar.')
      }
    } finally {
      clearTimeout(cronometro)
      setOcupado(false)
    }
  }

  function lerArquivo(arquivo: File) {
    const leitor = new FileReader()
    leitor.onload = () => {
      setConteudo(String(leitor.result || ''))
      setRelatorio(null)
    }
    leitor.readAsText(arquivo)
  }

  return (
    <PainelDeEnsino
      titulo="Importar conteúdo"
      descricao="Escreva o plano de ensino num arquivo Markdown ou JSON e deixe o sistema montar níveis, aulas, resumos e Trilhas."
      acoes={
        <BotaoSecundario href="/docs/formato-importacao-aulas.md" target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4" /> Ver o formato
        </BotaoSecundario>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Campo
            rotulo="Conteúdo do arquivo"
            dica="Markdown ou JSON — o formato é detectado pelo conteúdo. Reimportar o mesmo arquivo atualiza os registros em vez de duplicá-los."
          >
            <textarea
              value={conteudo}
              onChange={(e) => {
                setConteudo(e.target.value)
                setRelatorio(null)
              }}
              rows={18}
              placeholder="Cole aqui, ou envie um arquivo…"
              className={cn(classeDeArea, 'font-clinical text-xs leading-relaxed')}
            />
          </Campo>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-semibold transition hover:bg-muted">
              <Upload className="h-4 w-4" /> Enviar arquivo
              <input
                type="file"
                accept=".md,.markdown,.json,.txt"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  if (arquivo) lerArquivo(arquivo)
                }}
              />
            </label>

            <BotaoSecundario
              onClick={() => {
                setConteudo(MODELO)
                setRelatorio(null)
              }}
            >
              Usar o modelo
            </BotaoSecundario>

            <BotaoPrincipal
              onClick={() => enviar('importar', true)}
              carregando={ocupado}
              disabled={!conteudo.trim()}
            >
              <FileUp className="h-4 w-4" /> Conferir sem gravar
            </BotaoPrincipal>
          </div>

          {erro ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {erro}
            </p>
          ) : null}

          {relatorio ? (
            <section
              className={cn(
                'rounded-2xl border p-4',
                relatorio.ensaio ? 'border-accent/50 bg-accent/5' : 'border-primary/40 bg-primary/5',
              )}
            >
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight">
                {relatorio.ensaio ? (
                  <>
                    <AlertTriangle className="h-4 w-4" /> Ensaio — nada foi gravado
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-primary" /> Importação concluída
                  </>
                )}
              </h2>

              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <li>
                  <strong>{relatorio.nos.criados}</strong> níveis criados
                </li>
                <li>
                  <strong>{relatorio.aulas.criadas}</strong> aulas criadas ·{' '}
                  <strong>{relatorio.aulas.atualizadas}</strong> atualizadas
                </li>
                <li>
                  <strong>{relatorio.resumos.criados}</strong> Aulas Resumo criadas ·{' '}
                  <strong>{relatorio.resumos.vinculados}</strong> vinculadas
                </li>
                <li>
                  <strong>{relatorio.trilhas.criadas}</strong> Trilhas criadas ·{' '}
                  <strong>{relatorio.trilhas.atualizadas}</strong> atualizadas
                </li>
              </ul>

              {relatorio.naoResolvidas.length > 0 ? (
                <div className="mt-3 rounded-xl bg-background/60 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Aulas citadas que não existem
                  </p>
                  <p className="mt-1 text-sm">{relatorio.naoResolvidas.join(' · ')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ou o título está diferente do cadastrado, ou a aula ainda não foi criada. As
                    Trilhas foram montadas sem elas.
                  </p>
                </div>
              ) : null}

              {relatorio.avisos.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                    {relatorio.avisos.length} avisos de leitura
                  </summary>
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {relatorio.avisos.slice(0, 40).map((aviso, i) => (
                      <li key={i}>{aviso}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {relatorio.ensaio ? (
                <div className="mt-4">
                  <BotaoPrincipal onClick={() => enviar('importar', false)} carregando={ocupado}>
                    Aplicar de verdade
                  </BotaoPrincipal>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <BotaoSecundario href="/aulas/gerenciar/trilhas">Ver as Trilhas</BotaoSecundario>
                  <BotaoSecundario href="/aulas/gerenciar/catalogo">Ver as aulas</BotaoSecundario>
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* ── Migração do acervo antigo ────────────────────────────── */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border/70 bg-card p-4">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight">
              <History className="h-4 w-4 text-primary" /> Migrar o acervo antigo
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Traz a hierarquia antiga (setor → tópico → subtópico → módulo → submódulo) para a
              organização nova. <strong>Nada é apagado</strong>: as coleções antigas continuam
              intactas e a aula passa a ter as duas localizações.
            </p>

            <div className="mt-3">
              <BotaoSecundario onClick={() => enviar('migrar', true)}>
                Simular migração
              </BotaoSecundario>
            </div>

            {migracao ? (
              <div className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
                <p>
                  <strong>{migracao.plano.nos}</strong> níveis ·{' '}
                  <strong>{migracao.plano.aulas}</strong> aulas a organizar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {migracao.plano.jaMigradas} já organizadas · {migracao.plano.semLocalizacao} sem
                  amarra antiga (continuam avulsas)
                </p>

                {migracao.plano.amostra?.length ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                      Como os níveis serão traduzidos
                    </summary>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {migracao.plano.amostra.map((item, i) => (
                        <li key={i}>
                          <span className="text-muted-foreground">{item.nivel}</span> — {item.nome}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {migracao.ensaio ? (
                  <div className="mt-3">
                    <BotaoPrincipal onClick={() => enviar('migrar', false)} carregando={ocupado}>
                      Migrar de verdade
                    </BotaoPrincipal>
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-primary">Migração concluída.</p>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            <h2 className="mb-2 font-heading text-base font-semibold tracking-tight text-foreground">
              Como o arquivo funciona
            </h2>
            <ul className="space-y-2">
              <li>
                <code className="rounded bg-muted px-1">## Taxonomia</code>,{' '}
                <code className="rounded bg-muted px-1">## Aulas</code> e{' '}
                <code className="rounded bg-muted px-1">## Trilhas</code> são as três seções.
              </li>
              <li>
                Cada registro abre com{' '}
                <code className="rounded bg-muted px-1">### Aula: Título</code> ou{' '}
                <code className="rounded bg-muted px-1">### Trilha: Título</code>.
              </li>
              <li>
                As etapas usam{' '}
                <code className="rounded bg-muted px-1">#### Etapa: Nome</code> e listam aulas
                pelo <strong>título</strong> — inclusive aulas que já existem na plataforma.
              </li>
              <li>
                Níveis citados em <code className="rounded bg-muted px-1">localizacao</code> são
                criados automaticamente se faltarem.
              </li>
            </ul>
            <p className="mt-3">
              O formato completo, com todos os campos, está em{' '}
              <a
                href="/docs/formato-importacao-aulas.md"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                docs/formato-importacao-aulas.md
              </a>
              .
            </p>
          </section>
        </aside>
      </div>
    </PainelDeEnsino>
  )
}

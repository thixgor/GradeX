'use client'

/**
 * Admin → Configurações → "Resumo Inteligente por IA" das monitorias.
 *
 * Tudo o que decide quanto custa e quanto se cobra: modelos, tabela oficial de
 * preços com vigência, parâmetros da estimativa, margens, câmbio, limites e
 * retenção. A prévia recalcula no servidor (mesma função do checkout) ao salvar.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Brain, Loader2, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api, CaixaAviso, CaixaErro, Selo } from '@/components/monitorias/base'
import { formatarCentavos, interpretarValorEmReais } from '@/lib/monitorias/dinheiro'
import type { ConfigResumo, PrecoDeModelo } from '@/lib/monitorias/resumo/tipos'

interface PrecoCalculado {
  precoCentavos: number
  custoUsd: number
  custoComMargemUsd: number
  limitado: 'minimo' | 'maximo' | null
}

interface Dados {
  config: ConfigResumo
  liberada: boolean
  chaveConfigurada: boolean
  cambio: { brlPorUsd: number; fonte: 'ptax' | 'manual'; data: string | null }
  previa: Array<{ duracaoMin: number; individual: PrecoCalculado | null; grupo: PrecoCalculado | null }>
  uso: { realUsd: number; chamadas: number; aulas: number; vendasCentavos: number; reembolsosCentavos: number }
}

const usd = (v: number) => `US$ ${v.toFixed(v < 1 ? 3 : 2)}`
const reaisDe = (centavos: number) => (centavos / 100).toFixed(2).replace('.', ',')

function Campo({ id, rotulo, dica, children }: { id: string; rotulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-semibold">{rotulo}</Label>
      {children}
      {dica && <p className="text-[11px] leading-snug text-muted-foreground">{dica}</p>}
    </div>
  )
}

function Numero({ id, valor, onMudar, passo = 'any', min }: { id: string; valor: number; onMudar: (n: number) => void; passo?: string; min?: number }) {
  return <Input id={id} type="number" inputMode="decimal" step={passo} min={min} value={Number.isFinite(valor) ? valor : ''} onChange={(e) => onMudar(Number(e.target.value))} className="h-9 font-mono text-sm" />
}

export function ConfigResumoIA() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [rascunho, setRascunho] = useState<ConfigResumo | null>(null)
  const [reais, setReais] = useState({ minimo: '', maximo: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const d = await api<Dados>('/api/admin/monitorias/resumos-ia/config')
      setDados(d)
      setRascunho(d.config)
      setReais({ minimo: reaisDe(d.config.precoMinimoCentavos), maximo: reaisDe(d.config.precoMaximoCentavos) })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar.')
    }
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])

  if (!rascunho || !dados) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Resumo Inteligente por IA</CardTitle>
          <CardDescription>{erro || 'Carregando…'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const c = rascunho
  const mudar = (parcial: Partial<ConfigResumo>) => {
    setSalvo(false)
    setRascunho({ ...c, ...parcial })
  }
  const mudarPreco = (i: number, parcial: Partial<PrecoDeModelo>) => mudar({ precos: c.precos.map((p, k) => (k === i ? { ...p, ...parcial } : p)) })

  async function salvar() {
    setErro('')
    const minimo = interpretarValorEmReais(reais.minimo)
    const maximo = interpretarValorEmReais(reais.maximo)
    if (minimo == null || maximo == null) return setErro('Preço mínimo e máximo em reais (ex.: 4,90).')
    setSalvando(true)
    try {
      await api('/api/admin/monitorias/resumos-ia/config', { method: 'PUT', json: { ...c, precoMinimoCentavos: minimo, precoMaximoCentavos: maximo } })
      await carregar()
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const orcamentoPct = c.limites.orcamentoMensalUsd > 0 ? Math.min(100, (dados.uso.realUsd / c.limites.orcamentoMensalUsd) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Resumo Inteligente por IA (monitorias)</CardTitle>
            <CardDescription>
              Adicional opcional no checkout da monitoria. A voz é transcrita e resumida pelo Gemini depois da aula; a receita é 100% da plataforma e o repasse do monitor não muda.
            </CardDescription>
          </div>
          <Selo tom={dados.liberada ? 'sucesso' : 'neutro'}>{dados.liberada ? 'Venda ligada' : 'Venda desligada'}</Selo>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consumo do mês */}
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <p className="font-semibold">Gasto com IA neste mês</p>
            <p className="font-mono">{usd(dados.uso.realUsd)} de {usd(c.limites.orcamentoMensalUsd)}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className={orcamentoPct >= 100 ? 'h-full bg-rose-500' : orcamentoPct >= 80 ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'} style={{ width: `${orcamentoPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {dados.uso.aulas} aula(s) resumida(s) · {dados.uso.chamadas} chamada(s) ao Gemini · vendas {formatarCentavos(dados.uso.vendasCentavos)} · reembolsos {formatarCentavos(dados.uso.reembolsosCentavos)}. Em 100% do orçamento a venda para; em 120% o processamento para e os adicionais pendentes são reembolsados.
          </p>
        </div>

        {/* Ativação */}
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Vender o Resumo por IA em novas contratações</p>
              <p className="text-xs text-muted-foreground">Desligar só tira a opção do checkout: aulas já contratadas continuam e recebem o resumo.</p>
            </div>
            <Switch checked={c.vendaAtiva} disabled={!c.nivelPagoConfirmado} onCheckedChange={(v) => mudar({ vendaAtiva: v })} aria-label="Vender o Resumo por IA" />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={c.nivelPagoConfirmado} onChange={(e) => mudar({ nivelPagoConfirmado: e.target.checked, ...(e.target.checked ? {} : { vendaAtiva: false }) })} />
            <span>
              <ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-600" />
              Confirmo que a <strong>chave padrão do Gemini</strong> (Provas → API Gemini, ou <code>GEMINI_API_KEY</code>) é de um projeto do Google Cloud <strong>com faturamento ativo</strong>. No nível gratuito o Google pode usar o conteúdo enviado para melhorar produtos; no pago, não.
            </span>
          </label>
          {!dados.chaveConfigurada && <CaixaAviso><AlertTriangle className="mr-1 inline h-4 w-4" /> Nenhuma chave padrão do Gemini configurada. O resumo usa só a chave padrão (nunca as das seções).</CaixaAviso>}
        </div>

        {/* Modelos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id="ria-mt" rotulo="Modelo da transcrição" dica="Recebe o áudio de cada trecho. Precisa ter preço na tabela abaixo.">
            <Input id="ria-mt" list="ria-modelos" value={c.modeloTranscricao} onChange={(e) => mudar({ modeloTranscricao: e.target.value.trim() })} className="h-9 font-mono text-sm" />
          </Campo>
          <Campo id="ria-mr" rotulo="Modelo do resumo" dica="Recebe a transcrição e escreve o resumo estruturado.">
            <Input id="ria-mr" list="ria-modelos" value={c.modeloResumo} onChange={(e) => mudar({ modeloResumo: e.target.value.trim() })} className="h-9 font-mono text-sm" />
          </Campo>
          <datalist id="ria-modelos">
            <option value="gemini-3.8-flash" />
            <option value="gemini-2.5-flash" />
          </datalist>
        </div>

        {/* Tabela de preços */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Tabela oficial de preços (US$ por 1 milhão de tokens)</p>
            <Button type="button" size="sm" variant="outline" onClick={() => mudar({ precos: [...c.precos, { modelo: c.modeloResumo, desde: new Date().toISOString().slice(0, 10), entradaTexto: 0, entradaAudio: 0, saida: 0 }] })}>
              <Plus className="mr-1 h-4 w-4" /> Linha
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Cada linha vale a partir da data até a próxima linha do mesmo modelo. O preço do aluno usa a linha vigente no dia da aula; o custo real usa a do dia da chamada. A saída inclui o raciocínio do modelo.</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Modelo</th>
                  <th className="p-2 text-left">Desde</th>
                  <th className="p-2 text-left">Entrada texto</th>
                  <th className="p-2 text-left">Entrada áudio</th>
                  <th className="p-2 text-left">Saída</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {c.precos.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1.5"><Input value={p.modelo} onChange={(e) => mudarPreco(i, { modelo: e.target.value.trim() })} className="h-8 font-mono text-xs" aria-label="Modelo" /></td>
                    <td className="p-1.5"><Input type="date" value={p.desde} onChange={(e) => mudarPreco(i, { desde: e.target.value })} className="h-8 text-xs" aria-label="Desde" /></td>
                    <td className="p-1.5"><Numero id={`pt-${i}`} valor={p.entradaTexto} onMudar={(n) => mudarPreco(i, { entradaTexto: n })} /></td>
                    <td className="p-1.5"><Numero id={`pa-${i}`} valor={p.entradaAudio} onMudar={(n) => mudarPreco(i, { entradaAudio: n })} /></td>
                    <td className="p-1.5"><Numero id={`ps-${i}`} valor={p.saida} onMudar={(n) => mudarPreco(i, { saida: n })} /></td>
                    <td className="p-1.5 text-right">
                      <Button type="button" size="icon" variant="ghost" aria-label="Remover linha" onClick={() => mudar({ precos: c.precos.filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estimativa */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Estimativa de consumo</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo id="ria-tps" rotulo="Tokens por segundo de áudio" dica="Documentação do Gemini: 32."><Numero id="ria-tps" valor={c.estimativa.tokensPorSegundoAudio} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, tokensPorSegundoAudio: n } })} /></Campo>
            <Campo id="ria-fm" rotulo="Fração de fala do monitor" dica="0 a 1. O gravador pausa no silêncio."><Numero id="ria-fm" valor={c.estimativa.fracaoFalaMonitor} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, fracaoFalaMonitor: n } })} /></Campo>
            <Campo id="ria-fa" rotulo="Fração de fala do aluno" dica="Só aula individual (no grupo, só o monitor)."><Numero id="ria-fa" valor={c.estimativa.fracaoFalaAluno} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, fracaoFalaAluno: n } })} /></Campo>
            <Campo id="ria-tm" rotulo="Tokens de transcrição por minuto de fala"><Numero id="ria-tm" valor={c.estimativa.tokensTranscricaoPorMinutoDeFala} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, tokensTranscricaoPorMinutoDeFala: n } })} /></Campo>
            <Campo id="ria-tr" rotulo="Tokens do resumo"><Numero id="ria-tr" valor={c.estimativa.tokensResumo} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, tokensResumo: n } })} /></Campo>
            <Campo id="ria-fr" rotulo="Fator de raciocínio" dica="Tokens de raciocínio em fração da saída (cobrados como saída)."><Numero id="ria-fr" valor={c.estimativa.fatorRaciocinio} onMudar={(n) => mudar({ estimativa: { ...c.estimativa, fatorRaciocinio: n } })} /></Campo>
          </div>
        </div>

        {/* Margens e preço */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Margens e preço ao aluno</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo id="ria-ms" rotulo="Margem de segurança (%)" dica="Sobre o custo estimado: cobre aula mais falada e reparos."><Numero id="ria-ms" valor={c.margemSegurancaPct} onMudar={(n) => mudar({ margemSegurancaPct: n })} /></Campo>
            <Campo id="ria-mc" rotulo="Margem comercial (%)"><Numero id="ria-mc" valor={c.margemComercialPct} onMudar={(n) => mudar({ margemComercialPct: n })} /></Campo>
            <Campo id="ria-cd" rotulo="Custos diretos por aula (US$)"><Numero id="ria-cd" valor={c.custosDiretosUsd} onMudar={(n) => mudar({ custosDiretosUsd: n })} /></Campo>
            <Campo id="ria-pmin" rotulo="Preço mínimo (R$)"><Input id="ria-pmin" inputMode="decimal" value={reais.minimo} onChange={(e) => (setSalvo(false), setReais({ ...reais, minimo: e.target.value }))} className="h-9 font-mono text-sm" /></Campo>
            <Campo id="ria-pmax" rotulo="Preço máximo (R$)"><Input id="ria-pmax" inputMode="decimal" value={reais.maximo} onChange={(e) => (setSalvo(false), setReais({ ...reais, maximo: e.target.value }))} className="h-9 font-mono text-sm" /></Campo>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={c.arredondar90} onChange={(e) => mudar({ arredondar90: e.target.checked })} /> Arredondar para “,90”</label>
          </div>
        </div>

        {/* Câmbio */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Câmbio</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo id="ria-cf" rotulo="Fonte">
              <select id="ria-cf" value={c.cambio.fonte} onChange={(e) => mudar({ cambio: { ...c.cambio, fonte: e.target.value === 'manual' ? 'manual' : 'ptax' } })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                <option value="ptax">PTAX do Banco Central (automático)</option>
                <option value="manual">Manual</option>
              </select>
            </Campo>
            <Campo id="ria-ca" rotulo="Acréscimo (IOF + spread, %)"><Numero id="ria-ca" valor={c.cambio.acrescimoPct} onMudar={(n) => mudar({ cambio: { ...c.cambio, acrescimoPct: n } })} /></Campo>
            <Campo id="ria-cm" rotulo="Câmbio manual / reserva (R$ por US$)"><Numero id="ria-cm" valor={c.cambio.manualBrlPorUsd} onMudar={(n) => mudar({ cambio: { ...c.cambio, manualBrlPorUsd: n } })} /></Campo>
          </div>
          <p className="text-xs text-muted-foreground">
            Em uso agora: R$ {dados.cambio.brlPorUsd.toFixed(4)} por US$ ({dados.cambio.fonte === 'ptax' ? `PTAX de venda${dados.cambio.data ? ` de ${dados.cambio.data.split('-').reverse().join('/')}` : ''}` : 'manual'}), mais {c.cambio.acrescimoPct}% de acréscimo.
          </p>
        </div>

        {/* Limites e privacidade */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Limites e privacidade</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo id="ria-ld" rotulo="Duração máxima da aula (min)" dica="Aulas mais longas não oferecem o adicional."><Numero id="ria-ld" passo="1" valor={c.limites.duracaoMaxMin} onMudar={(n) => mudar({ limites: { ...c.limites, duracaoMaxMin: n } })} /></Campo>
            <Campo id="ria-lc" rotulo="Teto de custo por aula (US$)" dica="Conferido antes de cada chamada."><Numero id="ria-lc" valor={c.limites.custoMaxPorAulaUsd} onMudar={(n) => mudar({ limites: { ...c.limites, custoMaxPorAulaUsd: n } })} /></Campo>
            <Campo id="ria-lo" rotulo="Orçamento mensal (US$)"><Numero id="ria-lo" valor={c.limites.orcamentoMensalUsd} onMudar={(n) => mudar({ limites: { ...c.limites, orcamentoMensalUsd: n } })} /></Campo>
            <Campo id="ria-lt" rotulo="Tentativas por etapa"><Numero id="ria-lt" passo="1" valor={c.limites.tentativasPorEtapa} onMudar={(n) => mudar({ limites: { ...c.limites, tentativasPorEtapa: n } })} /></Campo>
            <Campo id="ria-rt" rotulo="Retenção da transcrição (dias)" dica="O áudio sai do Google logo após transcrever. O resumo fica com a reserva."><Numero id="ria-rt" passo="1" valor={c.retencaoTranscricaoDias} onMudar={(n) => mudar({ retencaoTranscricaoDias: n })} /></Campo>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={c.foraDaComissaoDoSocio} onChange={(e) => mudar({ foraDaComissaoDoSocio: e.target.checked })} /> Fora da comissão do sócio (split)</label>
          </div>
        </div>

        {/* Prévia */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Prévia do preço (com a config salva)</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Aula</th>
                  <th className="p-2 text-left">Individual (custo → preço)</th>
                  <th className="p-2 text-left">Grupo, por aluno (custo → preço)</th>
                </tr>
              </thead>
              <tbody>
                {dados.previa.map((l) => (
                  <tr key={l.duracaoMin} className="border-t">
                    <td className="p-2 font-medium">{l.duracaoMin} min</td>
                    {[l.individual, l.grupo].map((x, k) => (
                      <td key={k} className="p-2 font-mono text-xs">
                        {x ? <>{usd(x.custoUsd)} → <strong className="text-sm">{formatarCentavos(x.precoCentavos)}</strong>{x.limitado ? <span className="ml-1 text-muted-foreground">({x.limitado})</span> : null}</> : <span className="text-rose-600">modelo sem preço</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {erro && <CaixaErro mensagem={erro} />}
        {salvo && <CaixaAviso tom="sucesso">Configuração salva. A prévia acima já usa os valores novos.</CaixaAviso>}
        <div className="flex gap-3 border-t pt-4">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Resumo por IA
          </Button>
          <Button variant="outline" onClick={carregar} disabled={salvando}>Descartar</Button>
        </div>
      </CardContent>
    </Card>
  )
}

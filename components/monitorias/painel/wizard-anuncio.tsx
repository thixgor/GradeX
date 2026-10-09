'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Eye, FileSignature, Gift, HeartHandshake, Link2, Loader2, Mail, MessagesSquare, Plus, Save,
  Send, Trash2, Users, CalendarCheck, Youtube, Instagram,
} from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { interpretarUrlDeVideo, urlDeMiniatura, urlOriginal } from '@/lib/monitorias/videos'
import { validarLinkExterno } from '@/lib/monitorias/links'
import { formatarCentavos, interpretarValorEmReais } from '@/lib/monitorias/dinheiro'
import { duracoesPermitidas, formatarDuracao } from '@/lib/monitorias/agenda'
import type { ConteudoAnuncio, VideoAnuncio } from '@/lib/monitorias/tipos'
import { CaixaAviso, CaixaErro, Esqueleto, api } from '../base'

const PASSOS = ['Básico', 'Vídeos', 'Preço & contratação', 'FAQ', 'Materiais', 'Revisão'] as const

interface Form {
  titulo: string
  materia: string
  conteudos: string[]
  descricao: string
  videos: string[]
  precoModo: 'aula' | 'hora'
  valor: string
  duracaoPadrao: number
  direto: boolean
  diretoMin: number
  diretoMax: number
  diretoPasso: 30 | 60
  antecedencia: number
  negociacao: boolean
  aCombinar: boolean
  grupo: boolean
  grupoMax: number
  faixas: Array<{ minAlunos: number; valor: string }>
  gratis: boolean
  gratisDuracao: number
  faq: Array<{ pergunta: string; resposta: string }>
  materiais: Array<{ titulo: string; url: string }>
  temMateriais: boolean
}

const VAZIO: Form = {
  titulo: '', materia: '', conteudos: [], descricao: '', videos: [''],
  precoModo: 'hora', valor: '', duracaoPadrao: 60,
  direto: true, diretoMin: 60, diretoMax: 120, diretoPasso: 30, antecedencia: 12,
  negociacao: true, aCombinar: false,
  grupo: false, grupoMax: 4, faixas: [{ minAlunos: 2, valor: '' }],
  gratis: false, gratisDuracao: 30,
  faq: [], materiais: [], temMateriais: false,
}

const reais = (c: number) => (c / 100).toFixed(2).replace('.', ',')

function deConteudo(c: ConteudoAnuncio): Form {
  return {
    titulo: c.titulo, materia: c.materia, conteudos: c.conteudos, descricao: c.descricao,
    videos: c.videos.length ? c.videos.map((v) => urlOriginal(v)) : [''],
    precoModo: c.preco.modo, valor: reais(c.preco.valorCentavos), duracaoPadrao: c.preco.duracaoPadraoMin,
    direto: !!c.modos.direto, diretoMin: c.modos.direto?.duracaoMinMin || 60, diretoMax: c.modos.direto?.duracaoMaxMin || 120,
    diretoPasso: (c.modos.direto?.passoMin as 30 | 60) || 30, antecedencia: c.modos.direto?.antecedenciaMinHoras || 12,
    negociacao: !!c.modos.negociacao, aCombinar: !!c.modos.aCombinar,
    grupo: c.grupo.ativo, grupoMax: c.grupo.ativo ? c.grupo.maxAlunos : 4,
    faixas: c.grupo.faixas.length ? c.grupo.faixas.map((f) => ({ minAlunos: f.minAlunos, valor: reais(f.valorPorPessoaCentavos) })) : [{ minAlunos: 2, valor: '' }],
    gratis: c.aulaGratis.ativa, gratisDuracao: c.aulaGratis.duracaoMin,
    faq: c.faq, materiais: c.materiais.map((m) => ({ titulo: m.titulo, url: m.url })), temMateriais: c.temMateriais,
  }
}

function paraCorpo(f: Form) {
  return {
    titulo: f.titulo,
    materia: f.materia,
    conteudos: f.conteudos,
    descricao: f.descricao,
    videos: f.videos.map((v) => v.trim()).filter(Boolean),
    preco: { modo: f.precoModo, valorCentavos: interpretarValorEmReais(f.valor) ?? 0, duracaoPadraoMin: f.duracaoPadrao },
    grupo: {
      ativo: f.grupo,
      maxAlunos: f.grupo ? f.grupoMax : 2,
      faixas: f.grupo ? f.faixas.filter((x) => x.valor.trim()).map((x) => ({ minAlunos: x.minAlunos, valorPorPessoaCentavos: interpretarValorEmReais(x.valor) ?? 0 })) : [],
    },
    aulaGratis: { ativa: f.gratis, duracaoMin: f.gratisDuracao },
    modos: {
      direto: f.direto ? { duracaoMinMin: f.diretoMin, duracaoMaxMin: f.diretoMax, passoMin: f.diretoPasso, antecedenciaMinHoras: f.antecedencia } : null,
      negociacao: f.negociacao,
      aCombinar: f.aCombinar,
    },
    faq: f.faq.filter((x) => x.pergunta.trim() && x.resposta.trim()),
    materiais: f.materiais.filter((x) => x.titulo.trim() && x.url.trim()),
    temMateriais: f.temMateriais,
  }
}

export function WizardAnuncio({ anuncioId }: { anuncioId?: string }) {
  const router = useRouter()
  const reduzir = useReducedMotion()
  const [f, setF] = useState<Form>(VAZIO)
  const [passo, setPasso] = useState(0)
  const [carregando, setCarregando] = useState(!!anuncioId)
  const [status, setStatus] = useState<string>('rascunho')
  const [slug, setSlug] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<string[]>([])
  const [ok, setOk] = useState('')
  const [novoConteudo, setNovoConteudo] = useState('')

  useEffect(() => {
    if (!anuncioId) return
    api<{ anuncio: ConteudoAnuncio & { status: string; slug: string; revisaoPendente?: ConteudoAnuncio } }>(`/api/monitorias/tutor/anuncios/${anuncioId}`)
      .then((r) => {
        setF(deConteudo(r.anuncio.revisaoPendente || r.anuncio))
        setStatus(r.anuncio.status)
        setSlug(r.anuncio.slug)
      })
      .catch((e) => setErros([e.message]))
      .finally(() => setCarregando(false))
  }, [anuncioId])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))

  async function salvar(): Promise<string | null> {
    setSalvando(true)
    setErros([])
    setOk('')
    try {
      if (anuncioId) {
        const r = await api<{ revisaoPendente?: boolean; ofertaInvalidada?: boolean }>(`/api/monitorias/tutor/anuncios/${anuncioId}`, { method: 'PATCH', json: paraCorpo(f) })
        setOk(r.revisaoPendente ? 'Alterações enviadas para análise. A versão atual continua no ar até a aprovação.' : r.ofertaInvalidada ? 'Salvo! Como o preço/duração mudou, assine a oferta do agendamento direto de novo.' : 'Salvo!')
        return anuncioId
      }
      const r = await api<{ id: string }>('/api/monitorias/tutor/anuncios', { method: 'POST', json: paraCorpo(f) })
      router.replace(`/monitorias/painel/anuncios/${r.id}`)
      return r.id
    } catch (e: any) {
      setErros(e?.dados?.erros || [e instanceof Error ? e.message : 'Erro ao salvar.'])
      return null
    } finally {
      setSalvando(false)
    }
  }

  async function enviarAnalise() {
    const id = await salvar()
    if (!id) return
    try {
      await api(`/api/monitorias/tutor/anuncios/${id}/acao`, { method: 'POST', json: { acao: 'enviar' } })
      setStatus('em_analise')
      setOk('Enviado! Avisamos por e-mail quando o anúncio for aprovado.')
    } catch (e: any) {
      setErros([e instanceof Error ? e.message : 'Erro.', ...((e?.dados?.pendentes as string[]) || [])])
    }
  }

  const videosOk = useMemo(() => f.videos.map((v) => (v.trim() ? interpretarUrlDeVideo(v) : null)), [f.videos])
  const valorCent = interpretarValorEmReais(f.valor) ?? 0

  if (carregando) return <PageScaffold><Esqueleto className="h-[600px] rounded-3xl" /></PageScaffold>

  return (
    <PageScaffold>
      <div className="mx-auto max-w-3xl">
        <Link href="/monitorias/painel" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Painel</Link>
        <h1 className="font-heading text-2xl font-bold">{anuncioId ? 'Editar anúncio' : 'Novo anúncio de monitoria'}</h1>
        {['publicado', 'pausado'].includes(status) && <CaixaAviso tom="info" className="mt-3">Este anúncio está no ar. Suas alterações passam por análise antes de substituir a versão publicada.</CaixaAviso>}

        <div className="my-6 flex items-center gap-1.5 overflow-x-auto pb-1">
          {PASSOS.map((p, i) => (
            <button key={p} type="button" onClick={() => setPasso(i)} className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition', i === passo ? 'bg-primary text-primary-foreground shadow' : i < passo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]', i === passo ? 'bg-white/25' : 'bg-background/60')}>{i < passo ? <Check className="h-3 w-3" /> : i + 1}</span>
              {p}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={passo} initial={reduzir ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduzir ? undefined : { opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-4">
              {passo === 0 && (
                <>
                  <Campo rotulo="Título do anúncio" dica="O que a pessoa vai aprender. Ex.: Fisiologia Cardiovascular sem drama">
                    <input value={f.titulo} onChange={(e) => set('titulo', e.target.value)} maxLength={90} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                  </Campo>
                  <Campo rotulo="Matéria" dica="Ex.: Fisiologia, Farmacologia, Anatomia, Bioquímica">
                    <input value={f.materia} onChange={(e) => set('materia', e.target.value)} maxLength={60} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                  </Campo>
                  <Campo rotulo="Conteúdos / módulos que você dá" dica="Aperte Enter para adicionar cada um">
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background p-2">
                      {f.conteudos.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {c}
                          <button type="button" onClick={() => set('conteudos', f.conteudos.filter((x) => x !== c))} aria-label={`Remover ${c}`}>×</button>
                        </span>
                      ))}
                      <input
                        value={novoConteudo}
                        onChange={(e) => setNovoConteudo(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && novoConteudo.trim()) {
                            e.preventDefault()
                            if (!f.conteudos.includes(novoConteudo.trim()) && f.conteudos.length < 20) set('conteudos', [...f.conteudos, novoConteudo.trim().slice(0, 60)])
                            setNovoConteudo('')
                          }
                        }}
                        placeholder={f.conteudos.length ? '' : 'Ciclo cardíaco, ECG, Pressão arterial...'}
                        className="min-w-[160px] flex-1 bg-transparent px-1 text-sm outline-none"
                      />
                    </div>
                  </Campo>
                  <Campo rotulo="Descrição" dica="Como é a aula, o que inclui, para quem é. Mínimo de 40 caracteres.">
                    <Textarea value={f.descricao} onChange={(e) => set('descricao', e.target.value)} rows={7} maxLength={4000} />
                  </Campo>
                </>
              )}

              {passo === 1 && (
                <>
                  <p className="text-sm text-muted-foreground">Vídeos de demonstração do YouTube ou Instagram (post/reel). Um bom vídeo curto aumenta muito as contratações.</p>
                  {f.videos.map((v, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input value={v} onChange={(e) => set('videos', f.videos.map((x, k) => (k === i ? e.target.value : x)))} placeholder="https://youtu.be/... ou https://instagram.com/reel/..." className={cn('h-11 w-full rounded-xl border bg-background px-3 text-sm', v.trim() && !videosOk[i] ? 'border-rose-400' : 'border-border')} />
                        {v.trim() && !videosOk[i] && <p className="mt-1 text-xs text-rose-600">Link não reconhecido. Use YouTube ou Instagram.</p>}
                      </div>
                      {videosOk[i] && <VideoMini video={videosOk[i]!} />}
                      <Button variant="ghost" size="icon" onClick={() => set('videos', f.videos.filter((_, k) => k !== i))} aria-label="Remover"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {f.videos.length < 6 && <Button variant="outline" size="sm" onClick={() => set('videos', [...f.videos, ''])}><Plus className="mr-1 h-4 w-4" /> Adicionar vídeo</Button>}
                </>
              )}

              {passo === 2 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Campo rotulo="Cobrar por">
                      <div className="flex gap-1.5">
                        {(['hora', 'aula'] as const).map((m) => (
                          <button key={m} type="button" onClick={() => set('precoModo', m)} className={cn('flex-1 rounded-xl border py-2.5 text-sm font-semibold', f.precoModo === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{m === 'hora' ? 'Hora' : 'Aula'}</button>
                        ))}
                      </div>
                    </Campo>
                    <Campo rotulo={f.aCombinar && !f.direto && !f.negociacao ? 'A partir de (R$)' : `Valor por ${f.precoModo} (R$)`}>
                      <input value={f.valor} onChange={(e) => set('valor', e.target.value)} inputMode="decimal" placeholder="60,00" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                    </Campo>
                    <Campo rotulo="Duração padrão">
                      <select value={f.duracaoPadrao} onChange={(e) => set('duracaoPadrao', Number(e.target.value))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                        {[30, 60, 90, 120, 150, 180].map((m) => <option key={m} value={m}>{formatarDuracao(m)}</option>)}
                      </select>
                    </Campo>
                  </div>
                  {valorCent > 0 && <p className="text-xs text-muted-foreground">Você recebe {formatarCentavos(valorCent - Math.floor(valorCent / 10))} de cada {formatarCentavos(valorCent)} (taxa da plataforma de 10%). A taxa do PIX é paga pelo aluno.</p>}

                  <h3 className="pt-2 text-sm font-semibold">Como os alunos contratam? (escolha uma ou mais)</h3>
                  <Opcao ativo={f.direto} onClick={() => set('direto', !f.direto)} icone={CalendarCheck} titulo="Agendamento direto" texto="O aluno escolhe um horário livre na sua agenda e já paga. Você assina uma oferta-padrão uma vez.">
                    {f.direto && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-4" onClick={(e) => e.stopPropagation()}>
                        <Mini rotulo="Duração mín.">
                          <select value={f.diretoMin} onChange={(e) => set('diretoMin', Number(e.target.value))} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm">{[30, 60, 90, 120].map((m) => <option key={m} value={m}>{formatarDuracao(m)}</option>)}</select>
                        </Mini>
                        <Mini rotulo="Duração máx.">
                          <select value={f.diretoMax} onChange={(e) => set('diretoMax', Number(e.target.value))} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm">{[60, 90, 120, 150, 180, 240, 300].map((m) => <option key={m} value={m}>{formatarDuracao(m)}</option>)}</select>
                        </Mini>
                        <Mini rotulo="De quanto em quanto">
                          <select value={f.diretoPasso} onChange={(e) => set('diretoPasso', Number(e.target.value) as 30 | 60)} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"><option value={30}>30 min</option><option value={60}>1h</option></select>
                        </Mini>
                        <Mini rotulo="Antecedência mín.">
                          <select value={f.antecedencia} onChange={(e) => set('antecedencia', Number(e.target.value))} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm">{[2, 4, 6, 12, 24, 48].map((h) => <option key={h} value={h}>{h}h</option>)}</select>
                        </Mini>
                        <p className="text-[11px] text-muted-foreground sm:col-span-4">Opções para o aluno: {duracoesPermitidas(f.diretoMin, f.diretoMax, f.diretoPasso).map(formatarDuracao).join(', ') || '—'}. Os dias e horários vêm da aba Agenda (horário de Brasília).</p>
                      </div>
                    )}
                  </Opcao>
                  <Opcao ativo={f.negociacao} onClick={() => set('negociacao', !f.negociacao)} icone={HeartHandshake} titulo="Negociar no chat" texto="O aluno conversa com você e vocês trocam propostas de dia, duração e valor." />
                  <Opcao ativo={f.aCombinar} onClick={() => set('aCombinar', !f.aCombinar)} icone={MessagesSquare} titulo="A combinar" texto="Sem preço fixo na vitrine: vocês conversam e você envia a primeira proposta." />

                  <h3 className="pt-2 text-sm font-semibold">Extras</h3>
                  <Opcao ativo={f.grupo} onClick={() => set('grupo', !f.grupo)} icone={Users} titulo="Aula em grupo (mais barata por pessoa)" texto="Vários alunos dividem a aula. Cada um assina o próprio contrato e paga a sua parte.">
                    {f.grupo && (
                      <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Mini rotulo="Máximo de alunos">
                          <input type="number" min={2} max={30} value={f.grupoMax} onChange={(e) => set('grupoMax', Math.max(2, Math.min(30, Number(e.target.value) || 2)))} className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm" />
                        </Mini>
                        {f.faixas.map((x, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span>A partir de</span>
                            <input type="number" min={2} max={f.grupoMax} value={x.minAlunos} onChange={(e) => set('faixas', f.faixas.map((y, k) => (k === i ? { ...y, minAlunos: Number(e.target.value) || 2 } : y)))} className="h-9 w-16 rounded-lg border border-border bg-background px-2" />
                            <span>alunos: R$</span>
                            <input value={x.valor} onChange={(e) => set('faixas', f.faixas.map((y, k) => (k === i ? { ...y, valor: e.target.value } : y)))} placeholder="45,00" inputMode="decimal" className="h-9 w-24 rounded-lg border border-border bg-background px-2" />
                            <span className="text-xs text-muted-foreground">por pessoa/{f.precoModo}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => set('faixas', f.faixas.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        {f.faixas.length < 6 && <Button size="sm" variant="outline" onClick={() => set('faixas', [...f.faixas, { minAlunos: (f.faixas.at(-1)?.minAlunos || 1) + 1, valor: '' }])}><Plus className="mr-1 h-3.5 w-3.5" /> Faixa</Button>}
                      </div>
                    )}
                  </Opcao>
                  <Opcao ativo={f.gratis} onClick={() => set('gratis', !f.gratis)} icone={Gift} titulo="Aula experimental grátis" texto="Uma por aluno. Ótimo para conquistar os primeiros alunos.">
                    {f.gratis && (
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        <Mini rotulo="Duração">
                          <select value={f.gratisDuracao} onChange={(e) => set('gratisDuracao', Number(e.target.value))} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">{[15, 30, 45, 60].map((m) => <option key={m} value={m}>{formatarDuracao(m)}</option>)}</select>
                        </Mini>
                      </div>
                    )}
                  </Opcao>
                </>
              )}

              {passo === 3 && (
                <>
                  <p className="text-sm text-muted-foreground">Responda as dúvidas mais comuns antes que perguntem.</p>
                  {f.faq.map((x, i) => (
                    <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
                      <input value={x.pergunta} onChange={(e) => set('faq', f.faq.map((y, k) => (k === i ? { ...y, pergunta: e.target.value } : y)))} placeholder="Pergunta" maxLength={200} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium" />
                      <Textarea value={x.resposta} onChange={(e) => set('faq', f.faq.map((y, k) => (k === i ? { ...y, resposta: e.target.value } : y)))} placeholder="Resposta" rows={2} maxLength={1500} />
                      <Button variant="ghost" size="sm" onClick={() => set('faq', f.faq.filter((_, k) => k !== i))}><Trash2 className="mr-1 h-3.5 w-3.5" /> Remover</Button>
                    </div>
                  ))}
                  {f.faq.length < 20 && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => set('faq', [...f.faq, { pergunta: '', resposta: '' }])}><Plus className="mr-1 h-4 w-4" /> Pergunta</Button>
                      {f.faq.length === 0 && (
                        <Button variant="ghost" size="sm" onClick={() => set('faq', [
                          { pergunta: 'Como funciona a aula?', resposta: '' },
                          { pergunta: 'Preciso levar algum material?', resposta: '' },
                          { pergunta: 'A aula é gravada?', resposta: '' },
                        ])}>Usar sugestões</Button>
                      )}
                    </div>
                  )}
                </>
              )}

              {passo === 4 && (
                <>
                  <CaixaAviso>Materiais por link (Drive, Notion...) são de sua responsabilidade. A plataforma não hospeda nem se responsabiliza pelo conteúdo — e o aluno vê esse aviso antes de abrir o link.</CaixaAviso>
                  {f.materiais.map((m, i) => {
                    const valido = !m.url.trim() || !!validarLinkExterno(m.url)
                    return (
                      <div key={i} className="flex flex-wrap items-start gap-2">
                        <input value={m.titulo} onChange={(e) => set('materiais', f.materiais.map((y, k) => (k === i ? { ...y, titulo: e.target.value } : y)))} placeholder="Título (ex.: Resumo de ECG)" maxLength={100} className="h-10 min-w-[160px] flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
                        <div className="min-w-[200px] flex-[2]">
                          <input value={m.url} onChange={(e) => set('materiais', f.materiais.map((y, k) => (k === i ? { ...y, url: e.target.value } : y)))} placeholder="https://..." className={cn('h-10 w-full rounded-lg border bg-background px-3 text-sm', valido ? 'border-border' : 'border-rose-400')} />
                          {!valido && <p className="mt-1 text-xs text-rose-600">Use um link https completo.</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => set('materiais', f.materiais.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )
                  })}
                  {f.materiais.length < 15 && <Button variant="outline" size="sm" onClick={() => set('materiais', [...f.materiais, { titulo: '', url: '' }])}><Link2 className="mr-1 h-4 w-4" /> Adicionar link</Button>}
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.temMateriais} onChange={(e) => set('temMateriais', e.target.checked)} /> Anunciar que tenho materiais complementares (mesmo sem link público)</label>
                </>
              )}

              {passo === 5 && (
                <Revisao f={f} anuncioId={anuncioId} slug={slug} status={status} />
              )}
            </motion.div>
          </AnimatePresence>

          {erros.length > 0 && (
            <div className="mt-4 space-y-1">{erros.map((e, i) => <CaixaErro key={i} mensagem={e} />)}</div>
          )}
          {ok && <CaixaAviso tom="sucesso" className="mt-4">{ok}</CaixaAviso>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setPasso((p) => Math.max(0, p - 1))} disabled={passo === 0}><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1.5 h-4 w-4" /> Salvar</>}</Button>
              {passo < PASSOS.length - 1 ? (
                <Button onClick={() => setPasso((p) => p + 1)}>Próximo <ArrowRight className="ml-1 h-4 w-4" /></Button>
              ) : ['rascunho', 'rejeitado'].includes(status) ? (
                <Button onClick={enviarAnalise} disabled={salvando}><Send className="mr-1.5 h-4 w-4" /> Salvar e enviar para análise</Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </PageScaffold>
  )
}

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{rotulo}</span>
      {dica && <span className="mb-1.5 block text-xs text-muted-foreground">{dica}</span>}
      <div className={dica ? '' : 'mt-1.5'}>{children}</div>
    </label>
  )
}

function Mini({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium text-muted-foreground">{rotulo}<div className="mt-0.5">{children}</div></label>
}

function Opcao({ ativo, onClick, icone: Icone, titulo, texto, children }: { ativo: boolean; onClick: () => void; icone: typeof Users; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <motion.div layout onClick={onClick} className={cn('cursor-pointer rounded-2xl border-2 p-4 transition-colors', ativo ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', ativo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Icone className="h-5 w-5" /></span>
        <div className="flex-1">
          <p className="font-semibold">{titulo}</p>
          <p className="text-xs text-muted-foreground">{texto}</p>
        </div>
        <span className={cn('mt-1 flex h-5 w-5 items-center justify-center rounded-md border', ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>{ativo && <Check className="h-3.5 w-3.5" />}</span>
      </div>
      {children}
    </motion.div>
  )
}

function VideoMini({ video }: { video: VideoAnuncio }) {
  const mini = urlDeMiniatura(video)
  return (
    <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {mini ? <img src={mini} alt="" className="h-full w-full object-cover" /> : video.provider === 'instagram' ? <Instagram className="h-5 w-5 text-pink-500" /> : <Youtube className="h-5 w-5 text-red-500" />}
    </span>
  )
}

function Revisao({ f, anuncioId, slug, status }: { f: Form; anuncioId?: string; slug: string; status: string }) {
  const valor = interpretarValorEmReais(f.valor) ?? 0
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white">
        <p className="text-xs uppercase tracking-wide text-white/75">{f.materia || 'Matéria'}</p>
        <p className="font-heading text-xl font-bold">{f.titulo || 'Título do anúncio'}</p>
        <p className="mt-1 text-sm text-white/85">{formatarCentavos(valor)}/{f.precoModo}{f.grupo ? ' · grupos' : ''}{f.gratis ? ' · 1ª aula grátis' : ''}</p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>📚 {f.conteudos.length} conteúdo(s)</li>
        <li>🎬 {f.videos.filter((v) => v.trim()).length} vídeo(s)</li>
        <li>❓ {f.faq.filter((x) => x.pergunta && x.resposta).length} pergunta(s) no FAQ</li>
        <li>🔗 {f.materiais.length} material(is)</li>
        <li>🗓️ {[f.direto && 'Agenda direta', f.negociacao && 'Negociação', f.aCombinar && 'A combinar'].filter(Boolean).join(' · ') || 'Nenhuma forma de contratação!'}</li>
      </ul>
      {slug && ['publicado', 'pausado'].includes(status) && (
        <Link href={`/monitorias/anuncio/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><Eye className="h-4 w-4" /> Ver anúncio publicado</Link>
      )}
      {f.direto && (anuncioId ? <OfertaPadrao anuncioId={anuncioId} /> : <CaixaAviso tom="info">Salve o anúncio para assinar a oferta-padrão do agendamento direto.</CaixaAviso>)}
      <p className="text-xs text-muted-foreground">Depois de enviado, nossa equipe confere o anúncio e seus dados. Você recebe um e-mail quando for aprovado.</p>
    </div>
  )
}

/** Assinatura da oferta-padrão do agendamento direto (vale como assinatura do monitor em cada reserva direta). */
function OfertaPadrao({ anuncioId }: { anuncioId: string }) {
  const [oferta, setOferta] = useState<{ texto: string; hash: string; assinada: boolean } | null>(null)
  const [erro, setErro] = useState('')
  const [para, setPara] = useState('')
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(() => {
    api<{ texto: string; hash: string; assinada: boolean }>(`/api/monitorias/tutor/anuncios/${anuncioId}/oferta`).then(setOferta).catch((e) => setErro(e.message))
  }, [anuncioId])
  useEffect(() => carregar(), [carregar])

  if (erro) return <CaixaErro mensagem={erro} />
  if (!oferta) return null
  return (
    <div className="space-y-3 rounded-2xl border-2 border-amber-400/60 p-4">
      <p className="flex items-center gap-2 font-semibold"><FileSignature className="h-4 w-4 text-primary" /> Oferta-padrão do agendamento direto</p>
      {oferta.assinada ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">✓ Assinada. Alunos podem agendar direto nas condições atuais.</p>
      ) : (
        <>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/50 p-3 font-sans text-xs leading-relaxed">{oferta.texto}</pre>
          {!para ? (
            <Button
              size="sm"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true)
                try {
                  const r = await api<{ para: string }>('/api/monitorias/codigo', { method: 'POST', json: { finalidade: 'oferta', ref: anuncioId } })
                  setPara(r.para)
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro.')
                } finally {
                  setOcupado(false)
                }
              }}
            >
              <Mail className="mr-1.5 h-4 w-4" /> Li e quero assinar — enviar código
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs">Código enviado para {para}</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" className="h-9 w-28 rounded-lg border border-border bg-background text-center font-mono tracking-[0.3em]" />
              <Button
                size="sm"
                disabled={ocupado || codigo.length !== 6}
                onClick={async () => {
                  setOcupado(true)
                  try {
                    await api(`/api/monitorias/tutor/anuncios/${anuncioId}/oferta`, { method: 'POST', json: { codigo, hash: oferta.hash } })
                    carregar()
                  } catch (e) {
                    setErro(e instanceof Error ? e.message : 'Erro.')
                  } finally {
                    setOcupado(false)
                  }
                }}
              >
                Assinar oferta
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Search, Sparkles, UserRound, XCircle } from 'lucide-react'
import {
  dividirVenda,
  normalizarCodigo,
  sugerirCodigo,
  type ConfigDoPrograma,
  type TipoDeEmbaixador,
} from '@/lib/embaixadores/regras'
import { Modal, formatarReais } from './ui'

/**
 * A conta da comissão, ao vivo, num produto de exemplo. É a fórmula que o
 * sistema grava em cada venda (`dividirVenda`) — o admin vê exatamente o que
 * vai sair.
 */
export function SimuladorDeComissao({ percentualSocio, comissaoPercent }: { percentualSocio: number; comissaoPercent: number }) {
  const [preco, setPreco] = useState(100)
  const d = dividirVenda(preco, percentualSocio, comissaoPercent)
  const partes = [
    { rotulo: `Sócio (${percentualSocio}%)`, valor: d.valorSocio, cor: 'var(--viz-ord-3, #255630)' },
    { rotulo: `Embaixador (${comissaoPercent}% de ${100 - percentualSocio}%)`, valor: d.comissao, cor: 'var(--viz-series-2, #c28403)' },
    { rotulo: 'Fica com a DomineAqui', valor: d.nossaParteLiquida, cor: 'var(--viz-series-1, #367946)' },
  ]
  return (
    <div className="emb-lista viz rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold">Numa venda de</p>
        <label className="flex items-center gap-2 text-[13px]">
          <span className="emb-suave">R$</span>
          <input
            type="number"
            min={1}
            step={1}
            value={preco}
            onChange={(e) => setPreco(Math.max(0, Number(e.target.value) || 0))}
            className="emb-campo !min-h-[36px] !w-28 !px-3 !text-[14px]"
            aria-label="Preço do produto de exemplo"
          />
        </label>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
        {partes.map((p) =>
          p.valor > 0 ? <span key={p.rotulo} style={{ width: `${(p.valor / Math.max(d.valor, 0.01)) * 100}%`, background: p.cor }} className="border-r-2 border-[var(--va-chao)] last:border-r-0" /> : null,
        )}
      </div>
      <dl className="mt-3 space-y-1.5 text-[13.5px]">
        {partes.map((p) => (
          <div key={p.rotulo} className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.cor }} />
              {p.rotulo}
            </dt>
            <dd className="font-bold">{formatarReais(p.valor)}</dd>
          </div>
        ))}
      </dl>
      <p className="emb-fraca mt-2 text-[12px]">A comissão sai só da parte da DomineAqui. O sócio recebe o mesmo com ou sem embaixador.</p>
    </div>
  )
}

interface ContaEncontrada {
  id: string
  name: string
  email: string
  accountType: string
}

interface VerificacaoDeCodigo {
  codigo: string
  valido: boolean
  disponivel: boolean
  cupomExistente: { desconto: number; tipo: string; ativo: boolean; deEmbaixador: boolean } | null
}

export function NovoEmbaixador({
  aberto,
  aoFechar,
  aoCriar,
  config,
}: {
  aberto: boolean
  aoFechar: () => void
  aoCriar: (id: string) => void
  config: ConfigDoPrograma
}) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ContaEncontrada[]>([])
  const [buscando, setBuscando] = useState(false)
  const [conta, setConta] = useState<ContaEncontrada | null>(null)
  const [tipo, setTipo] = useState<TipoDeEmbaixador>('nao_remunerado')
  const [comissao, setComissao] = useState(config.comissaoPadrao)
  const [desconto, setDesconto] = useState(config.descontoCupomPadrao)
  const [codigo, setCodigo] = useState('')
  const [codigoTocado, setCodigoTocado] = useState(false)
  const [verificacao, setVerificacao] = useState<VerificacaoDeCodigo | null>(null)
  const [faculdade, setFaculdade] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [instagram, setInstagram] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setBusca('')
    setResultados([])
    setConta(null)
    setTipo('nao_remunerado')
    setComissao(config.comissaoPadrao)
    setDesconto(config.descontoCupomPadrao)
    setCodigo('')
    setCodigoTocado(false)
    setVerificacao(null)
    setFaculdade('')
    setPeriodo('')
    setInstagram('')
    setObservacoes('')
    setErro('')
  }, [aberto, config.comissaoPadrao, config.descontoCupomPadrao])

  // Busca de conta, com espera de digitação.
  useEffect(() => {
    if (conta || busca.trim().length < 2) {
      setResultados([])
      return
    }
    const controle = new AbortController()
    const t = window.setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(busca.trim())}`, { signal: controle.signal })
        const dados = await res.json()
        setResultados(dados.users || [])
      } catch {
        // digitação nova cancelou
      } finally {
        setBuscando(false)
      }
    }, 280)
    return () => {
      window.clearTimeout(t)
      controle.abort()
    }
  }, [busca, conta])

  // O código nasce do nome e acompanha o desconto até o admin mexer nele.
  useEffect(() => {
    if (conta && !codigoTocado) setCodigo(sugerirCodigo(conta.name, desconto))
  }, [conta, desconto, codigoTocado])

  // Disponibilidade do código, ao vivo.
  useEffect(() => {
    const normal = normalizarCodigo(codigo)
    if (normal.length < 3) {
      setVerificacao(null)
      return
    }
    const controle = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/embaixadores?verificarCodigo=${encodeURIComponent(normal)}`, { signal: controle.signal })
        setVerificacao(await res.json())
      } catch {
        // ignorado
      }
    }, 300)
    return () => {
      window.clearTimeout(t)
      controle.abort()
    }
  }, [codigo])

  const podeSalvar = !!conta && !!verificacao?.valido && !!verificacao?.disponivel && !salvando

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!conta) return setErro('Escolha a conta do embaixador.')
    if (!podeSalvar) return setErro('Escolha um código disponível.')
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/embaixadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: conta.id,
          tipo,
          comissaoPercent: tipo === 'remunerado' ? comissao : 0,
          descontoCupom: desconto,
          codigo,
          faculdade,
          periodo,
          instagram,
          observacoes,
        }),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.error || 'Não foi possível criar.')
      aoCriar(dados.id)
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível criar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Novo embaixador" descricao="Liga a conta ao programa e cria o cupom e o link dele." largura="sm:max-w-2xl">
      <form onSubmit={salvar} className="space-y-5" noValidate>
        {/* Conta */}
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Conta</p>
          {conta ? (
            <div className="emb-lista flex items-center gap-3 rounded-2xl p-3">
              <div className="emb-lista grid h-10 w-10 place-items-center rounded-full">
                <UserRound className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{conta.name}</p>
                <p className="emb-fraca truncate text-[13px]">{conta.email}</p>
              </div>
              <button type="button" onClick={() => setConta(null)} className="emb-botao emb-botao-vidro emb-foco !min-h-[36px] !px-3 !text-[13px]">
                Trocar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="emb-fraca pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
              <input
                className="emb-campo !pl-10"
                placeholder="Nome ou e-mail de quem foi aprovado"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
                aria-label="Buscar conta"
              />
              {buscando && <Loader2 className="emb-fraca absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" aria-hidden />}
              {resultados.length > 0 && (
                <ul className="emb-modal absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-auto rounded-2xl p-1.5" role="listbox">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          setConta(r)
                          setResultados([])
                        }}
                        className="emb-foco w-full rounded-xl px-3 py-2.5 text-left hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <p className="truncate text-[14.5px] font-semibold">{r.name || 'Sem nome'}</p>
                        <p className="emb-fraca truncate text-[12.5px]">{r.email}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Tipo */}
        <div>
          <p className="mb-1.5 text-[13px] font-semibold">Tipo</p>
          <div className="emb-segmento" role="group" aria-label="Tipo de embaixador">
            <button type="button" aria-pressed={tipo === 'nao_remunerado'} onClick={() => setTipo('nao_remunerado')} className="emb-foco">
              Não-remunerado
            </button>
            <button type="button" aria-pressed={tipo === 'remunerado'} onClick={() => setTipo('remunerado')} className="emb-foco">
              Remunerado
            </button>
          </div>
          <p className="emb-fraca mt-1.5 text-[12.5px]">
            {tipo === 'remunerado'
              ? 'Recebe uma porcentagem da parte da DomineAqui em cada venda. O repasse é manual, por PIX.'
              : 'Recebe o Plus+ e o cupom, sem comissão. Os números dele aparecem igual.'}
          </p>
        </div>

        {tipo === 'remunerado' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="comissao" className="text-[13px] font-semibold">
                Comissão sobre a nossa parte
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={comissao}
                  onChange={(e) => setComissao(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="emb-campo !min-h-[36px] !w-20 !px-3 text-right !text-[14px] font-bold"
                  aria-label="Comissão em porcentagem"
                />
                <span className="font-bold">%</span>
              </div>
            </div>
            <input id="comissao" type="range" min={0} max={50} step={0.5} value={Math.min(50, comissao)} onChange={(e) => setComissao(Number(e.target.value))} className="emb-faixa" />
            <SimuladorDeComissao percentualSocio={config.percentualSocio} comissaoPercent={comissao} />
          </div>
        )}

        {/* Código e cupom */}
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Código (cupom e link)</span>
            <input
              className="emb-campo font-bold uppercase tracking-wider"
              value={codigo}
              onChange={(e) => {
                setCodigoTocado(true)
                setCodigo(normalizarCodigo(e.target.value))
              }}
              placeholder="MARIA10"
              maxLength={20}
              aria-invalid={!!verificacao && !verificacao.disponivel}
              aria-describedby="codigo-ajuda"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Desconto do cupom</span>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                className="emb-campo !pr-9 font-bold"
                value={desconto}
                onChange={(e) => setDesconto(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
              />
              <span className="emb-fraca absolute right-3.5 top-1/2 -translate-y-1/2 font-bold">%</span>
            </div>
          </label>
        </div>
        <p id="codigo-ajuda" className="-mt-2 flex items-center gap-1.5 text-[12.5px]">
          {!verificacao ? (
            <span className="emb-fraca">De 3 a 20 letras ou números. O link fica domineaqui.com.br/e/{normalizarCodigo(codigo) || 'CODIGO'}</span>
          ) : verificacao.disponivel ? (
            <>
              <CheckCircle2 className="emb-verde h-4 w-4" aria-hidden />
              <span className="emb-verde font-semibold">
                {verificacao.cupomExistente
                  ? `Disponível. Já existe um cupom avulso ${verificacao.codigo} (${verificacao.cupomExistente.desconto}${verificacao.cupomExistente.tipo === 'fixed' ? ' reais' : '%'}): ele será adotado, com o histórico de usos.`
                  : `Disponível · domineaqui.com.br/e/${verificacao.codigo}`}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" style={{ color: 'var(--emb-vermelho)' }} aria-hidden />
              <span className="font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
                {verificacao.valido ? 'Este código já é de outro embaixador.' : 'Use de 3 a 20 letras ou números.'}
              </span>
            </>
          )}
        </p>

        {/* Perfil */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold">Faculdade</span>
            <input className="emb-campo" value={faculdade} onChange={(e) => setFaculdade(e.target.value)} placeholder="Se vazio, usa a do perfil" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Período</span>
            <input className="emb-campo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="5º período" />
          </label>
          <label className="block sm:col-span-3">
            <span className="mb-1.5 block text-[13px] font-semibold">Instagram</span>
            <input className="emb-campo" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" />
          </label>
          <label className="block sm:col-span-3">
            <span className="mb-1.5 block text-[13px] font-semibold">Observações internas</span>
            <textarea className="emb-campo" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Só o admin vê." />
          </label>
        </div>

        {erro && (
          <p role="alert" className="text-[14px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
            {erro}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" onClick={aoFechar} className="emb-botao emb-botao-vidro emb-foco">
            Cancelar
          </button>
          <button type="submit" disabled={!podeSalvar} className="emb-botao vidro-botao emb-foco">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            {salvando ? 'Criando…' : 'Criar embaixador'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ConfigDoProgramaModal({
  aberto,
  aoFechar,
  config,
  aoSalvar,
}: {
  aberto: boolean
  aoFechar: () => void
  config: ConfigDoPrograma
  aoSalvar: (c: ConfigDoPrograma) => void
}) {
  const [rascunho, setRascunho] = useState(config)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  useEffect(() => {
    if (aberto) {
      setRascunho(config)
      setErro('')
    }
  }, [aberto, config])

  const campoNumero = (chave: keyof ConfigDoPrograma, rotulo: string, ajuda: string, sufixo: string, min = 0, max = 100) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{rotulo}</span>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          className="emb-campo !pr-14 font-bold"
          value={rascunho[chave] as number}
          onChange={(e) => setRascunho((r) => ({ ...r, [chave]: Number(e.target.value) }))}
        />
        <span className="emb-fraca absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold">{sufixo}</span>
      </div>
      <span className="emb-fraca mt-1 block text-[12px]">{ajuda}</span>
    </label>
  )

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/embaixadores/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rascunho),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.error || 'Não foi possível salvar.')
      aoSalvar(dados.config)
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const exemplo = useMemo(() => dividirVenda(100, rascunho.percentualSocio, rascunho.comissaoPadrao), [rascunho.percentualSocio, rascunho.comissaoPadrao])

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Configuração do programa" descricao="Vale para as vendas registradas daqui em diante." largura="sm:max-w-2xl">
      <form onSubmit={salvar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {campoNumero('percentualSocio', 'Parte do sócio', `Em R$ 100: sócio ${formatarReais(exemplo.valorSocio)}, nossa parte ${formatarReais(exemplo.nossaParteBruta)}.`, '%')}
          {campoNumero('comissaoPadrao', 'Comissão sugerida', 'Valor inicial ao criar um remunerado.', '%')}
          {campoNumero('descontoCupomPadrao', 'Desconto do cupom', 'Valor inicial do cupom individual.', '%', 1, 100)}
          {campoNumero('diasParaCupomParado', 'Cupom parado após', 'Sem venda por este tempo, o painel acende o alerta.', 'dias', 7, 365)}
          {campoNumero('diaDoRepasse', 'Repasse mensal até o dia', 'As comissões de um mês são pagas até este dia do mês seguinte, depois dos 7 dias de arrependimento.', 'do mês', 1, 28)}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Formulário de inscrição</span>
          <input className="emb-campo" value={rascunho.linkInscricao} onChange={(e) => setRascunho((r) => ({ ...r, linkInscricao: e.target.value }))} />
          <span className="emb-fraca mt-1 block text-[12px]">Caminho do site (/forms/…) ou URL https. É o botão &ldquo;Quero ser embaixador&rdquo;.</span>
        </label>
        {erro && (
          <p role="alert" className="text-[14px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="emb-botao emb-botao-vidro emb-foco">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="emb-botao vidro-botao emb-foco">
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

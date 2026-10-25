'use client'

import { useState } from 'react'
import { KeyRound, Loader2, Pencil, ShieldCheck } from 'lucide-react'
import {
  ROTULO_DA_CHAVE_PIX,
  TIPOS_DE_CHAVE_PIX,
  formatarChavePix,
  validarChavePix,
  type ChavePix,
  type TipoDeChavePix,
} from '@/lib/embaixadores/regras'
import { formatarData } from './ui'

const DICA: Record<TipoDeChavePix, { placeholder: string; modo: 'numeric' | 'email' | 'tel' | 'text' }> = {
  cpf: { placeholder: '000.000.000-00', modo: 'numeric' },
  cnpj: { placeholder: '00.000.000/0000-00', modo: 'numeric' },
  email: { placeholder: 'voce@email.com', modo: 'email' },
  telefone: { placeholder: '(11) 91234-5678', modo: 'tel' },
  aleatoria: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', modo: 'text' },
}

/**
 * A chave PIX do embaixador remunerado. Validada aqui (mesma função do
 * servidor) para o erro aparecer antes do envio, e de novo na rota.
 */
export function FormularioPix({
  atual,
  aoSalvar,
  avisar,
}: {
  atual: (ChavePix & { atualizadoEm: string }) | null
  aoSalvar: (pix: ChavePix & { atualizadoEm: string }) => void
  avisar: (t: string) => void
}) {
  const [editando, setEditando] = useState(!atual)
  const [tipo, setTipo] = useState<TipoDeChavePix>(atual?.tipo || 'cpf')
  const [chave, setChave] = useState(atual ? formatarChavePix(atual) : '')
  const [titular, setTitular] = useState(atual?.titular || '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const local = validarChavePix({ tipo, chave, titular })
    if (!local.ok) {
      setErro(local.erro)
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/embaixadores/me/pix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(local.chave),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.error || 'Não foi possível salvar.')
      aoSalvar(dados.pix)
      setEditando(false)
      avisar('Chave PIX salva')
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (atual && !editando) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="emb-lista grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
            <ShieldCheck className="emb-verde h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="emb-fraca text-[12px] font-semibold uppercase tracking-wider">{ROTULO_DA_CHAVE_PIX[atual.tipo]}</p>
            <p className="truncate text-[16px] font-bold">{formatarChavePix(atual)}</p>
            <p className="emb-suave truncate text-[13px]">
              {atual.titular} · atualizada em {formatarData(atual.atualizadoEm)}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setEditando(true)} className="emb-botao emb-botao-vidro emb-foco">
          <Pencil className="h-4 w-4" aria-hidden /> Trocar chave
        </button>
      </div>
    )
  }

  const dica = DICA[tipo]
  return (
    <form onSubmit={salvar} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Tipo de chave</legend>
        <div className="flex flex-wrap gap-2">
          {TIPOS_DE_CHAVE_PIX.map((t) => (
            <label
              key={t}
              className="emb-selo emb-foco cursor-pointer !px-3.5 !py-2 !text-[13.5px]"
              data-tom={tipo === t ? 'verde' : undefined}
            >
              <input
                type="radio"
                name="tipo-pix"
                value={t}
                checked={tipo === t}
                onChange={() => {
                  setTipo(t)
                  setChave('')
                  setErro('')
                }}
                className="sr-only"
              />
              {ROTULO_DA_CHAVE_PIX[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Chave</span>
          <input
            className="emb-campo"
            value={chave}
            onChange={(e) => {
              setChave(e.target.value)
              setErro('')
            }}
            placeholder={dica.placeholder}
            inputMode={dica.modo}
            autoComplete="off"
            aria-invalid={!!erro}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Nome do titular da conta</span>
          <input
            className="emb-campo"
            value={titular}
            onChange={(e) => {
              setTitular(e.target.value)
              setErro('')
            }}
            placeholder="Como aparece no banco"
            autoComplete="name"
          />
        </label>
      </div>
      {erro && (
        <p role="alert" className="text-[13.5px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
          {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={salvando} className="emb-botao vidro-botao emb-foco">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
          {salvando ? 'Salvando…' : 'Salvar chave PIX'}
        </button>
        {atual && (
          <button type="button" onClick={() => setEditando(false)} className="emb-botao emb-botao-vidro emb-foco">
            Cancelar
          </button>
        )}
        <p className="emb-fraca text-[12.5px]">Só a equipe vê a sua chave, e só para fazer o repasse.</p>
      </div>
    </form>
  )
}

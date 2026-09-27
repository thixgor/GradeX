'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DESCRICAO_DO_RIGOR,
  RIGOR_PADRAO,
  compararComGabarito,
  limparRespostasAceitas,
  normalizarResposta,
  type RigorDoGabarito,
} from '@/lib/provas/resposta-flexivel'

interface Props {
  acceptedAnswers?: string[]
  rigor?: RigorDoGabarito
  /** O método da prova é o gabarito flexível? Sem ele, a lista fica guardada mas não corrige. */
  metodoAtivo: boolean
  onChange: (mudanca: { acceptedAnswers: string[]; acceptedAnswersRigor: RigorDoGabarito }) => void
}

/**
 * Onde o admin escreve as respostas aceitas de uma discursiva curta.
 *
 * Uma por linha: a primeira é o gabarito, as demais são sinônimos — todas
 * valem igual e passam pela mesma comparação flexível. O campo "Testar" mostra
 * na hora se uma resposta de aluno seria aceita, para o admin calibrar o rigor
 * antes de aplicar a prova. Use com `key={questao.id}` para o texto reiniciar
 * ao trocar de questão.
 */
export function GabaritoFlexivel({ acceptedAnswers, rigor, metodoAtivo, onChange }: Props) {
  const [texto, setTexto] = useState((acceptedAnswers || []).join('\n'))
  const [teste, setTeste] = useState('')
  const rigorAtual = rigor || RIGOR_PADRAO
  const aceitas = limparRespostasAceitas(texto.split('\n'))
  const veredito = teste.trim() ? compararComGabarito(teste, aceitas, rigorAtual) : null

  return (
    <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
      <div>
        <Label>🎯 Respostas aceitas (gabarito + sinônimos)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Uma por linha. A correção ignora maiúsculas, acentos, pontuação e artigo inicial
          (&quot;Coração.&quot;, &quot;.coracao&quot; e &quot;o coraçao&quot; valem &quot;coração&quot;) e,
          conforme o rigor, perdoa erros de digitação (&quot;coracoa&quot;).
        </p>
        {!metodoAtivo && (
          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            ⚠️ Só corrige sozinho quando o método das discursivas da prova for &quot;Gabarito automático&quot;.
          </p>
        )}
      </div>

      <Textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          onChange({
            acceptedAnswers: limparRespostasAceitas(e.target.value.split('\n')),
            acceptedAnswersRigor: rigorAtual,
          })
        }}
        placeholder={'coração\nmiocárdio\nbomba cardíaca'}
        rows={4}
        className="font-mono text-sm"
      />

      <div className="space-y-1">
        <Label className="text-xs">Rigor da comparação</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={rigorAtual}
          onChange={(e) =>
            onChange({ acceptedAnswers: aceitas, acceptedAnswersRigor: e.target.value as RigorDoGabarito })
          }
        >
          <option value="exato">Exato</option>
          <option value="normal">Normal (recomendado)</option>
          <option value="flexivel">Flexível</option>
        </select>
        <p className="text-xs text-muted-foreground">{DESCRICAO_DO_RIGOR[rigorAtual]}</p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Testar uma resposta de aluno</Label>
        <Input value={teste} onChange={(e) => setTeste(e.target.value)} placeholder="ex.: Coracoa." />
        {veredito && (
          <p
            className={`text-xs font-medium ${
              veredito.aceita ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {veredito.aceita
              ? `✅ Aceita como "${veredito.respostaCorrespondente}"${
                  veredito.distancia ? ` (${veredito.distancia} erro(s) de letra perdoado(s))` : ''
                }`
              : `❌ Não aceita (lida como "${normalizarResposta(teste)}")`}
          </p>
        )}
      </div>
    </div>
  )
}

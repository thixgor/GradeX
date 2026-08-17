'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, ExternalLink, Loader2, Search, X } from 'lucide-react'
import type { AvaliacaoDaAula } from '@/lib/aulas/avaliacao'

/**
 * Vincular uma prova à aula (§39).
 *
 * O campo existia na API desde que a avaliação foi criada, mas não tinha
 * controle nenhum no painel: só dava para preenchê-lo por fora, o que na
 * prática é o mesmo que não existir. Isto é o controle.
 *
 * A prova é ESCOLHIDA entre as que já existem, nunca criada aqui. Um botão
 * "nova prova" dentro do editor de aula abriria um segundo caminho de criação,
 * com metade dos campos do sistema de provas — e a prova nascida por ele
 * apareceria capenga em /provas.
 */

interface ProvaResumida {
  _id: string
  title: string
  isHidden?: boolean
  isPracticeExam?: boolean
  numberOfQuestions?: number
}

export function EditorDeAvaliacao({
  valor,
  onChange,
  escuro = false,
}: {
  valor: AvaliacaoDaAula | null
  onChange: (avaliacao: AvaliacaoDaAula | null) => void
  escuro?: boolean
}) {
  const [provas, setProvas] = useState<ProvaResumida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    let vivo = true
    // `resumo=1`: só título e contagem. Sem isso, abrir o editor de uma aula
    // baixaria o banco de questões inteiro de todas as provas para desenhar
    // uma lista de nomes.
    fetch('/api/exams?resumo=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { exams: [] }))
      .then((d) => {
        if (!vivo) return
        setProvas(
          (d.exams || []).map((e: any) => ({
            _id: String(e._id),
            title: String(e.title || 'Prova sem título'),
            isHidden: e.isHidden === true,
            isPracticeExam: e.isPracticeExam === true,
            numberOfQuestions: Number(e.numberOfQuestions) || 0,
          })),
        )
      })
      .catch(() => {})
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [])

  const escolhida = useMemo(
    () => (valor?.examId ? provas.find((p) => p._id === valor.examId) : undefined),
    [provas, valor?.examId],
  )

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (termo.length < 2) return []
    return provas.filter((p) => p.title.toLowerCase().includes(termo)).slice(0, 8)
  }, [busca, provas])

  const c = cores(escuro)

  return (
    <div className={`rounded-xl border p-4 ${c.caixa}`}>
      <div className="mb-1 flex items-center gap-2">
        <ClipboardCheck className={`h-4 w-4 ${c.destaque}`} />
        <p className={`text-sm font-bold ${c.titulo}`}>Avaliação da aula</p>
      </div>
      <p className={`mb-3 text-xs leading-relaxed ${c.apagado}`}>
        Aponte para uma prova que já existe em /provas. A aula não cria prova nova — assim as
        questões ficam num lugar só, com a correção e o histórico que o sistema de provas já tem.
      </p>

      {valor?.examId ? (
        <div className={`rounded-lg px-3 py-2.5 ${c.item}`}>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[13px] font-semibold ${c.titulo}`}>
                {/* Prova apagada continua visível, identificada: sumir com ela
                    esconderia um vínculo quebrado que o admin precisa consertar. */}
                {escolhida?.title ||
                  (carregando ? 'Carregando…' : (
                    <span className={c.aviso}>Prova removida ({valor.examId.slice(-6)})</span>
                  ))}
              </p>
              {escolhida ? (
                <p className={`mt-0.5 text-[11px] ${c.apagado}`}>
                  {escolhida.numberOfQuestions} questões
                  {escolhida.isHidden ? ' · oculta em /provas' : ''}
                  {escolhida.isPracticeExam ? ' · treino' : ''}
                </p>
              ) : null}
            </div>
            <a
              href={`/exam/${valor.examId}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir a prova em outra aba"
              className={`flex h-7 w-7 flex-none items-center justify-center rounded ${c.botao}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Desvincular prova"
              className={`flex h-7 w-7 flex-none items-center justify-center rounded ${c.botao}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Prova oculta em /provas continua abrindo por link direto, então o
              vínculo funciona — mas o admin precisa saber que ela não aparece
              na lista, senão vai procurá-la lá e achar que sumiu. */}
          {escolhida?.isHidden ? (
            <p className={`mt-2 text-[11px] leading-relaxed ${c.aviso}`}>
              Esta prova está oculta em /provas. O aluno chega nela pelo botão da aula, mas não a
              encontra na lista de provas.
            </p>
          ) : null}

          <label className={`mt-2.5 block text-[11.5px] ${c.apagado}`}>
            <input
              type="text"
              value={valor.titulo || ''}
              onChange={(e) => onChange({ ...valor, titulo: e.target.value })}
              placeholder="Como chamar na aula (opcional)"
              className={`h-8 w-full rounded-md px-2.5 text-[12.5px] outline-none ${c.campo}`}
            />
          </label>

          <label className={`mt-2.5 flex cursor-pointer items-start gap-2 text-[11.5px] ${c.apagado}`}>
            <input
              type="checkbox"
              checked={valor.obrigatoria === true}
              onChange={(e) => onChange({ ...valor, obrigatoria: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              <span className={`font-semibold ${c.titulo}`}>Obrigatória para concluir a aula</span>
              <br />
              Enquanto o aluno não entregar a prova, a aula não é marcada como concluída — nem pelo
              botão, nem automaticamente ao terminar o vídeo. Conta a entrega, não a nota.
            </span>
          </label>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${c.apagado}`}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar prova pelo título..."
              className={`h-9 w-full rounded-lg pl-9 pr-3 text-[12.5px] outline-none ${c.campo}`}
            />
            {carregando ? (
              <Loader2
                className={`absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin ${c.apagado}`}
              />
            ) : null}
          </div>

          {resultados.length > 0 ? (
            <div className="mt-1.5 space-y-1">
              {resultados.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onChange({ examId: p._id, titulo: '', obrigatoria: false })
                    setBusca('')
                  }}
                  className={`block w-full rounded-md px-2.5 py-2 text-left ${c.opcao}`}
                >
                  <span className="block truncate text-[12.5px]">{p.title}</span>
                  <span className={`block text-[11px] ${c.apagado}`}>
                    {p.numberOfQuestions} questões
                    {p.isHidden ? ' · oculta' : ''}
                    {p.isPracticeExam ? ' · treino' : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : busca.trim().length >= 2 && !carregando ? (
            <p className={`mt-1.5 text-[11.5px] ${c.apagado}`}>Nenhuma prova com esse termo.</p>
          ) : null}
        </>
      )}
    </div>
  )
}

function cores(escuro: boolean) {
  return escuro
    ? {
        caixa: 'border-white/10 bg-white/[0.03]',
        item: 'border border-white/10 bg-white/[0.04]',
        titulo: 'text-white',
        apagado: 'text-white/55',
        destaque: 'text-sky-400',
        aviso: 'text-amber-300',
        botao: 'text-white/50 hover:bg-white/10 hover:text-white',
        campo:
          'border border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-sky-400/50',
        opcao: 'text-white/80 hover:bg-white/10',
      }
    : {
        caixa: 'border-border bg-card',
        item: 'border border-border bg-background',
        titulo: 'text-foreground',
        apagado: 'text-muted-foreground',
        destaque: 'text-primary',
        aviso: 'text-amber-600 dark:text-amber-400',
        botao: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        campo: 'border border-border bg-background text-foreground focus:border-primary/50',
        opcao: 'text-foreground hover:bg-muted',
      }
}

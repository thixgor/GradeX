'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, HeartPulse, Layers, ListChecks, Pill, RotateCcw, ScanLine, Stethoscope, Activity } from 'lucide-react'
import { enderecosDeConta } from '@/components/vitrine/casco'
import { copiarTexto } from './copiar'

interface Convite {
  primeiroNome: string
  faculdade: string
  codigo: string
  cupom: { codigo: string; rotulo: string } | null
}

const MODULOS = [
  { icone: HeartPulse, nome: 'Manual Clínico', texto: '+300 patologias com fisiopatologia, farmacologia e referências' },
  { icone: ListChecks, nome: 'Banco de Questões', texto: '+15.000 questões comentadas, divididas por tópico' },
  { icone: Pill, nome: 'Farmacologia', texto: '+400 fármacos com posologia e calculadora de dose' },
  { icone: Activity, nome: 'Eletro interativo', texto: 'Curso completo e +90 traçados com quiz' },
  { icone: Layers, nome: 'Flashcards', texto: 'Decks prontos e IA que gera da ementa do seu curso' },
  { icone: ScanLine, nome: 'Radiologia', texto: 'Raio X e tomografia, corte a corte' },
  { icone: Stethoscope, nome: 'Semiologia', texto: '+400 achados com imagem e comparação com o normal' },
]

/**
 * O convite que o link do embaixador abre. Mostra quem convidou e o cupom,
 * e leva à conta grátis ou aos planos — o cupom aparece sozinho no checkout,
 * porque o link já gravou a indicação.
 */
export function ConviteDoEmbaixador({ codigo }: { codigo: string }) {
  const [convite, setConvite] = useState<Convite | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'sumiu'>('carregando')
  const [copiado, setCopiado] = useState(false)
  const conta = enderecosDeConta('/buy')

  useEffect(() => {
    let vivo = true
    fetch(`/api/embaixadores/convite?codigo=${encodeURIComponent(codigo)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const dados = await res.json()
        if (vivo) {
          setConvite(dados.convite)
          setEstado('pronto')
        }
      })
      .catch(() => vivo && setEstado('sumiu'))
    return () => {
      vivo = false
    }
  }, [codigo])

  async function copiar() {
    if (!convite?.cupom) return
    if (await copiarTexto(convite.cupom.codigo)) {
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1800)
    }
  }

  const nome = convite?.primeiroNome || 'Um colega'

  return (
    <>
      <section aria-labelledby="convite-titulo" className="relative px-4 pb-16 pt-28 md:px-8 md:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p data-chegada style={{ ['--i' as string]: -4 }} className="vidro pilula">
              <span className="ponto-vivo" /> Convite de embaixador DomineAqui
            </p>
            <h1 id="convite-titulo" data-chegada style={{ ['--i' as string]: -2 }} className="titulo-display mt-6 text-[clamp(42px,5.6vw,78px)]">
              {estado === 'carregando' ? (
                <span className="inline-block h-[0.9em] w-[8ch] animate-pulse rounded-2xl bg-white/10 align-middle" aria-label="Carregando" />
              ) : (
                <span className="texto-brilho">{nome}</span>
              )}{' '}
              te chamou para estudar do jeito certo
            </h1>
            <p data-chegada style={{ ['--i' as string]: 0 }} className="mt-6 max-w-[48ch] text-[18px] text-[var(--papel-suave)] md:text-[19px]">
              {convite?.faculdade ? `Direto da ${convite.faculdade}: ` : ''}
              Manual Clínico, banco de questões, flashcards e as provas da faculdade num lugar só. Crie a conta grátis e veja por dentro.
            </p>
            <div data-chegada style={{ ['--i' as string]: 1 }} className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={conta.criar} className="botao botao-principal">
                Criar conta grátis <span aria-hidden>→</span>
              </Link>
              <Link href="/buy" className="botao botao-vidro">
                Ver planos
              </Link>
            </div>
            {estado === 'sumiu' && (
              <p className="mt-5 text-[14px] text-[var(--papel-fraco)]">
                Este convite não está mais ativo, mas a plataforma continua aqui para você.
              </p>
            )}
          </div>

          <div data-chegada style={{ ['--i' as string]: 1 }} className="lg:col-span-5">
            {convite?.cupom ? (
              <div className="borda-viva mx-auto max-w-[440px]">
                <div className="relative overflow-hidden rounded-[30px] bg-[#0b1f1a]/90 p-7 md:p-8">
                  <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#e2a43e]/25 blur-3xl" />
                  <div aria-hidden className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#468152]/35 blur-3xl" />
                  <p className="relative text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--papel-fraco)]">Cupom de {nome}</p>
                  <p className="num relative mt-3 break-all text-[clamp(40px,5vw,54px)] font-bold tracking-[0.05em]">{convite.cupom.codigo}</p>
                  <p className="relative mt-1 text-[16px] text-[var(--papel-suave)]">
                    <strong className="text-[var(--ambar-vivo)]">{convite.cupom.rotulo}</strong> por cima do preço do momento
                  </p>
                  <button
                    type="button"
                    onClick={copiar}
                    className="botao botao-vidro relative mt-6 w-full"
                    aria-label={`Copiar o cupom ${convite.cupom.codigo}`}
                  >
                    {copiado ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    {copiado ? 'Cupom copiado' : 'Copiar cupom'}
                  </button>
                  <p className="relative mt-4 text-center text-[13px] text-[var(--papel-fraco)]">
                    Ele aparece pronto para aplicar quando você for pagar.
                  </p>
                </div>
              </div>
            ) : estado === 'carregando' ? (
              <div className="vidro mx-auto h-[300px] max-w-[440px] animate-pulse rounded-[30px]" aria-hidden />
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="dentro-titulo" className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 id="dentro-titulo" className="titulo-secao text-center text-[clamp(32px,4.2vw,54px)]">
            O que tem <span className="texto-brilho">lá dentro</span>
          </h2>
          <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODULOS.map((m) => (
              <li key={m.nome} className="vidro cartao-ergue rounded-[24px] p-5">
                <m.icone className="h-6 w-6 text-[var(--verde-vivo)]" aria-hidden />
                <p className="mt-4 text-[17px] font-bold">{m.nome}</p>
                <p className="mt-1.5 text-[14.5px] text-[var(--papel-suave)]">{m.texto}</p>
              </li>
            ))}
            <li className="vidro cartao-ergue flex flex-col justify-between rounded-[24px] p-5">
              <RotateCcw className="h-6 w-6 text-[var(--ambar-vivo)]" aria-hidden />
              <div>
                <p className="mt-4 text-[17px] font-bold">E se eu não gostar?</p>
                <p className="mt-1.5 text-[14.5px] text-[var(--papel-suave)]">7 dias para desistir e receber tudo de volta, por lei.</p>
              </div>
            </li>
          </ul>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link href={conta.criar} className="botao botao-principal">
              Começar grátis <span aria-hidden>→</span>
            </Link>
            <Link href={conta.entrar} className="botao botao-vidro">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

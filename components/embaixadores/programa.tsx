'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgePercent,
  BookOpenCheck,
  Crown,
  FileText,
  GraduationCap,
  Coins,
  Megaphone,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'
import './embaixadores.css'

const RECEBE = [
  'Acesso a tudo: materiais, flashcards e o Manual Clínico inteiro',
  'Banco com mais de 15.000 questões, uso ilimitado',
  'Todas as provas da faculdade, com download em PDF',
  'Provas, simulados e flashcards gerados por IA',
  'Cronogramas vinculados à sua faculdade, sem limite',
]

const ESPERAMOS = [
  { titulo: 'Promover na sua faculdade', texto: 'Na sua turma, nos grupos, nos períodos abaixo e acima do seu.' },
  { titulo: 'Conhecer o catálogo', texto: 'Material avulso, pacote, o que entra em cada assinatura e quanto custa.' },
  { titulo: 'Criar conteúdo quando pedirmos', texto: 'Formato, prazo e tema combinados com a equipe.' },
  { titulo: 'Manter-se atualizado', texto: 'Preços e promoções mudam. Confira antes de divulgar qualquer valor.' },
  { titulo: 'Fazer o cupom girar', texto: 'O seu código é a métrica do programa. Cupom parado encerra a participação.' },
]

const BOLETIM = [
  { icone: Megaphone, titulo: 'Você divulga com o seu cupom', texto: 'Nos stories, no grupo, no corredor. O código é seu e ninguém mais usa.' },
  { icone: Target, titulo: 'Cada uso é contabilizado', texto: 'Compra fechada com o seu cupom vira registro no seu nome, sozinha. Mande o link de um produto e ele já chega com o cupom aplicado.' },
  { icone: BookOpenCheck, titulo: 'A equipe avalia pelo cupom', texto: 'Não é seguidor nem esforço declarado. É o número de usos do seu código.' },
  { icone: RefreshCw, titulo: 'Renovado por resultado', texto: 'O Plus+ entra no dia em que você é aprovado e sai no dia em que o cupom para.' },
]

const REGRAS = [
  {
    titulo: 'Colega bolsista ProUni/Fies',
    texto:
      'Peça para ele aplicar o seu cupom mesmo assim. O desconto maior é o que vale no preço — em geral o do ProUni/Fies, e os dois não se somam —, e a compra conta para você do mesmo jeito: o que vale é o seu cupom aplicado no pagamento.',
  },
  {
    titulo: 'Direito de arrependimento em 7 dias',
    texto:
      'Toda compra segue o Código de Defesa do Consumidor (art. 49 da Lei nº 8.078/1990): 7 dias para desistir, com devolução imediata dos valores pagos. Compra estornada sai da contagem do embaixador.',
  },
  {
    titulo: 'Vínculo institucional',
    texto: 'O DomineAqui não tem vínculo com nenhuma instituição de ensino. O embaixador não representa a faculdade.',
  },
  {
    titulo: 'Uso da marca e conduta',
    texto:
      'Marca e materiais podem ser usados na divulgação, dentro do combinado com a equipe. Compartilhar acesso ou redistribuir material pago encerra a participação.',
  },
  {
    titulo: 'Vigência e encerramento',
    texto:
      'A participação é avaliada pelo uso do cupom e pode ser encerrada por qualquer das partes. O encerramento remove o Plus+ e o cupom. Comissões já devidas a embaixadores remunerados continuam sendo repassadas.',
  },
]

function ehExterno(link: string) {
  return /^https?:\/\//.test(link)
}

function BotaoInscricao({ link, children, className }: { link: string; children: React.ReactNode; className?: string }) {
  const classe = `emb-botao vidro-botao emb-foco !min-h-[52px] !px-7 !text-[16px] ${className || ''}`
  if (ehExterno(link)) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={classe}>
        {children}
      </a>
    )
  }
  return (
    <Link href={link} className={classe}>
      {children}
    </Link>
  )
}

/**
 * `/embaixadores` para quem ainda não é embaixador: o guia do programa em
 * forma de página, com a inscrição sempre à mão.
 */
export function ProgramaDeEmbaixadores({ linkInscricao, descontoCupom }: { linkInscricao: string; descontoCupom: number }) {
  return (
    <div className="emb mx-auto w-full max-w-6xl px-4 pb-24 pt-8 md:px-8 md:pt-14">
      {/* ── Topo ── */}
      <section aria-labelledby="programa-titulo" className="grid items-center gap-10 lg:grid-cols-12">
        <div className="vidro-sobe lg:col-span-7" style={{ ['--i' as string]: 0 }}>
          <p className="vidro-pilula">
            <span className="vidro-ponto" /> Programa de Embaixadores · inscrições abertas
          </p>
          <h1 id="programa-titulo" className="emb-titulo mt-6 text-[clamp(40px,5.6vw,76px)]">
            Você já explica a matéria <span className="vidro-brilho">de graça.</span>
          </h1>
          <p className="emb-suave mt-5 max-w-[50ch] text-[18px] md:text-[19px]">
            Está na hora de isso valer alguma coisa. Promova o DomineAqui na sua faculdade e receba o Plus+ completo, um cupom só seu
            para a turma e, no programa remunerado, comissão por cada venda.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BotaoInscricao link={linkInscricao}>
              Quero ser embaixador <ArrowRight className="h-4 w-4" aria-hidden />
            </BotaoInscricao>
            <a href="#como-funciona" className="emb-botao emb-botao-vidro emb-foco !min-h-[52px] !px-6">
              Como funciona
            </a>
          </div>
          <p className="emb-fraca mt-4 text-[13.5px]">Leva poucos minutos. Cada inscrição é lida pela equipe.</p>
        </div>

        {/* O bilhete de exemplo */}
        <div className="vidro-sobe lg:col-span-5" style={{ ['--i' as string]: 1 }}>
          <div className="emb-borda-viva mx-auto max-w-[420px] rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
            <div className="emb-vidro emb-bilhete p-6">
              <div className="flex items-center justify-between">
                <p className="emb-fraca text-[12px] font-bold uppercase tracking-[0.14em]">Seu cupom</p>
                <span className="emb-selo" data-tom="verde">
                  Ativo
                </span>
              </div>
              <p className="emb-numero mt-3 text-[44px] tracking-[0.04em]">VOCE{descontoCupom}</p>
              <p className="emb-suave mt-1 text-[14.5px]">
                <strong className="emb-ambar">{descontoCupom}% OFF</strong> para a sua turma, por cima do preço do momento
              </p>
              <div className="emb-picote my-5" />
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Cadastros', '38'],
                  ['Compras', '12'],
                  ['Ranking', '#2'],
                ].map(([r, v]) => (
                  <div key={r} className="emb-lista rounded-2xl px-2 py-3">
                    <dd className="text-[22px] font-extrabold">{v}</dd>
                    <dt className="emb-fraca text-[11.5px] font-semibold">{r}</dt>
                  </div>
                ))}
              </dl>
              <p className="emb-fraca mt-4 text-center text-[12px]">Exemplo do painel que você recebe</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── O combinado ── */}
      <section className="mt-20">
        <div className="emb-painel rounded-[30px] p-7 text-center md:p-12">
          <p className="emb-fraca text-[12.5px] font-bold uppercase tracking-[0.16em]">O combinado em uma frase</p>
          <p className="mx-auto mt-4 max-w-[34ch] text-[clamp(24px,3vw,36px)] font-extrabold leading-tight tracking-tight">
            Você promove o DomineAqui na sua faculdade. Nós liberamos o <span className="vidro-brilho">Plus+ completo</span>, sem custo.
          </p>
          <p className="emb-suave mx-auto mt-4 max-w-[56ch] text-[16px]">
            Anúncio o aluno pula. Colega ele escuta. O que falta é alguém de dentro da sala dizendo que funciona.
          </p>
        </div>
      </section>

      {/* ── Dois jeitos ── */}
      <section id="como-funciona" aria-labelledby="tipos-titulo" className="mt-20 scroll-mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="vidro-pilula">Dois jeitos de participar</p>
          <h2 id="tipos-titulo" className="emb-titulo mt-5 text-[clamp(32px,4.2vw,52px)]">
            Escolhido com a equipe, <span className="vidro-brilho">por resultado</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="emb-painel emb-ergue rounded-[28px] p-6 md:p-8">
            <div className="emb-lista grid h-12 w-12 place-items-center rounded-2xl">
              <Crown className="emb-verde h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-5 text-[24px] font-extrabold tracking-tight">Embaixador</h3>
            <p className="emb-suave mt-2 text-[15.5px]">Para quem quer o acesso completo e a reputação de quem sabe antes.</p>
            <ul className="mt-5 space-y-2.5 text-[15px]">
              <li className="flex gap-2.5">
                <Sparkles className="emb-verde mt-0.5 h-4 w-4 shrink-0" aria-hidden /> DomineAqui Plus+ liberado, sem custo
              </li>
              <li className="flex gap-2.5">
                <BadgePercent className="emb-verde mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Cupom individual de {descontoCupom}% para a
                turma
              </li>
              <li className="flex gap-2.5">
                <Target className="emb-verde mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Link próprio e painel com o seu desempenho
              </li>
            </ul>
          </article>
          <article className="emb-borda-viva emb-parada emb-ergue">
            <div className="emb-painel h-full p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="emb-lista grid h-12 w-12 place-items-center rounded-2xl">
                  <Coins className="emb-ambar h-6 w-6" aria-hidden />
                </div>
                <span className="emb-selo" data-tom="ambar">
                  Com comissão
                </span>
              </div>
              <h3 className="mt-5 text-[24px] font-extrabold tracking-tight">Embaixador remunerado</h3>
              <p className="emb-suave mt-2 text-[15.5px]">Tudo do embaixador, e uma porcentagem de cada venda feita com você.</p>
              <ul className="mt-5 space-y-2.5 text-[15px]">
                <li className="flex gap-2.5">
                  <Wallet className="emb-ambar mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Comissão por compra feita com o seu cupom
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="emb-ambar mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Saldo a receber à vista, venda por venda
                </li>
                <li className="flex gap-2.5">
                  <Coins className="emb-ambar mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Repasse mensal por PIX, direto na sua chave
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* ── O que recebe / espera ── */}
      <section className="mt-20 grid gap-4 lg:grid-cols-2">
        <div className="emb-painel rounded-[28px] p-6 md:p-8">
          <p className="vidro-pilula">O que você recebe</p>
          <h2 className="mt-4 text-[28px] font-extrabold tracking-tight">O Plus+ inteiro. Não é teste.</h2>
          <p className="emb-suave mt-2 text-[15px]">A mesma assinatura que o seu colega paga, com a diferença de que a sua é cortesia.</p>
          <ul className="mt-5 space-y-2.5">
            {RECEBE.map((item) => (
              <li key={item} className="flex gap-2.5 text-[15px]">
                <Sparkles className="emb-verde mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="emb-painel rounded-[28px] p-6 md:p-8">
          <p className="vidro-pilula">O que esperamos de você</p>
          <h2 className="mt-4 text-[28px] font-extrabold tracking-tight">A parte que é trabalho</h2>
          <ol className="mt-5 space-y-3.5">
            {ESPERAMOS.map((item, i) => (
              <li key={item.titulo} className="flex gap-3">
                <span className="emb-lista grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-[15px] font-bold">{item.titulo}</p>
                  <p className="emb-suave text-[14px]">{item.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Cupom é o boletim ── */}
      <section aria-labelledby="boletim-titulo" className="mt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="vidro-pilula">Cupom e desempenho</p>
          <h2 id="boletim-titulo" className="emb-titulo mt-5 text-[clamp(32px,4.2vw,52px)]">
            Seu cupom é o <span className="vidro-brilho">seu boletim</span>
          </h2>
          <p className="emb-suave mx-auto mt-4 max-w-[54ch] text-[17px]">
            Ninguém vai te cobrar número no primeiro dia. Mas também ninguém vai fingir que cupom parado há meses é desempenho.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOLETIM.map((passo, i) => (
            <li key={passo.titulo} className="emb-lista emb-ergue rounded-[24px] p-5">
              <div className="flex items-center justify-between">
                <passo.icone className="emb-verde h-5 w-5" aria-hidden />
                <span className="emb-fraca text-[13px] font-extrabold">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <p className="mt-4 text-[16px] font-bold">{passo.titulo}</p>
              <p className="emb-suave mt-1.5 text-[14px]">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Como entrar ── */}
      <section aria-labelledby="entrar-titulo" className="mt-20">
        <div className="emb-borda-viva emb-parada">
          <div className="emb-painel grid gap-8 p-7 md:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="entrar-titulo" className="emb-titulo text-[clamp(32px,4vw,50px)]">
                A inscrição leva <span className="vidro-brilho">poucos minutos</span>
              </h2>
              <p className="emb-suave mt-4 max-w-[46ch] text-[16px]">
                A vaga não é por ordem de chegada nem por seguidores. Quem explica bem para cinco pessoas da própria turma vale mais que quem
                posta para cinco mil desconhecidos.
              </p>
              <BotaoInscricao link={linkInscricao} className="mt-7">
                <FileText className="h-4 w-4" aria-hidden /> Preencher o formulário
              </BotaoInscricao>
            </div>
            <ol className="space-y-4">
              {[
                { icone: FileText, t: 'Preencha o formulário', d: 'É o único caminho de entrada.' },
                { icone: GraduationCap, t: 'A equipe analisa', d: 'Faculdade, período, alcance na turma e por que você quer entrar.' },
                { icone: Sparkles, t: 'Resposta e Plus+', d: 'Aprovados recebem as orientações e o Plus+ liberado.' },
                { icone: Rocket, t: 'Começa o trabalho', d: 'Link, cupom e este painel prontos para divulgar.' },
              ].map((passo) => (
                <li key={passo.t} className="flex gap-3.5">
                  <span className="emb-lista grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
                    <passo.icone className="emb-verde h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[16px] font-bold">{passo.t}</p>
                    <p className="emb-suave text-[14px]">{passo.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Regras ── */}
      <section aria-labelledby="regras-titulo" className="mt-20">
        <h2 id="regras-titulo" className="text-[24px] font-extrabold tracking-tight">
          Regras e transparência
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {REGRAS.map((regra) => (
            <details key={regra.titulo} className="emb-lista group rounded-[20px] p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="emb-foco flex cursor-pointer list-none items-center justify-between gap-3 text-[15.5px] font-bold">
                {regra.titulo}
                <span aria-hidden className="emb-fraca text-[20px] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="emb-suave mt-3 text-[14.5px] leading-relaxed">{regra.texto}</p>
            </details>
          ))}
        </div>
        <p className="emb-fraca mt-6 text-[12.5px]">
          A participação segue os <Link href="/termos-de-servico" className="underline">Termos de Serviço</Link> e a{' '}
          <Link href="/politica-de-privacidade" className="underline">Política de Privacidade</Link>. Valores, produtos e percentuais estão sujeitos
          a alteração.
        </p>
      </section>
    </div>
  )
}

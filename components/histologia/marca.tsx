import { AlertTriangle, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react'

import {
  ALTERACOES_REALIZADAS,
  AVISO_EDUCACIONAL,
  CREDITO_BASE,
  LICENCA,
} from '@/lib/histologia/licenca'
import type { Credito, Proveniencia, Revisao } from '@/lib/histologia/esquemas'

/**
 * Logotipo oficial.
 *
 * O SVG é servido como arquivo (`/img/histologia/logo-manual-da-histologia.svg`)
 * e não embutido: tem 207 KB de caminhos vetoriais, e inseri-lo no HTML custaria
 * isso em cada página renderizada no servidor. Como imagem, o navegador o
 * armazena em cache uma vez.
 *
 * O nome acessível vive no `alt`; o `h1` da página fica em `sr-only` para que a
 * hierarquia de cabeçalhos continue correta para quem usa leitor de tela.
 */
export function LogoDaHistologia({ className = '' }: { className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/img/histologia/logo-manual-da-histologia.svg"
      alt="Manual da Histologia"
      width={650}
      height={566}
      className={className}
    />
  )
}

/**
 * Tarja de estado editorial.
 *
 * Aparece em toda lâmina e em todo quiz. É o compromisso central do módulo: o
 * aluno sabe, antes de estudar, se aquilo passou por revisor biomédico. Nada
 * aqui finge validação — a tarja de "pendente" é a regra, não a exceção, porque
 * o aprofundamento em português ainda não foi revisado.
 */
export function EstadoEditorial({
  revisao,
  compacto = false,
}: {
  revisao: Revisao
  compacto?: boolean
}) {
  if (revisao.estado === 'publicado' && revisao.revisor) {
    return (
      <p
        className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-800 dark:text-emerald-300 ${
          compacto ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Revisado por {revisao.revisor}
          {revisao.revisadoEm ? ` em ${formatarData(revisao.revisadoEm)}` : ''}
        </span>
      </p>
    )
  }

  const emRevisao = revisao.estado === 'em-revisao'
  return (
    <div
      className={`rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2.5 py-2 ${
        compacto ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <p className="inline-flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {emRevisao ? 'Em revisão biomédica' : 'Pendente de revisão biomédica'}
      </p>
      {!compacto && (
        <p className="mt-1 leading-relaxed text-muted-foreground">
          Os textos desta página vêm do acervo original em inglês, com títulos e rótulos traduzidos
          por glossário editorial. O aprofundamento em português ainda não foi conferido por
          revisor da área — use como apoio ao estudo, não como referência final.
        </p>
      )}
    </div>
  )
}

/** Marca um termo que o glossário editorial ainda não cobre. */
export function TermoNoOriginal() {
  return (
    <span
      className="ml-1 rounded bg-amber-500/15 px-1 py-px font-mono text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300"
      title="Termo ainda no idioma original, sem tradução revisada"
    >
      original
    </span>
  )
}

/**
 * Créditos, licença e proveniência.
 *
 * A licença CC BY-NC-SA exige atribuição, indicação de alterações e preservação
 * da mesma licença. Cumprimos os três de forma verificável — e a exigência de
 * "créditos a um clique" é literal: este bloco fica na própria lâmina, aberto
 * por um `<details>` nativo, que funciona sem JavaScript e é acessível por
 * teclado sem nenhum código nosso.
 */
export function Creditos({
  creditos,
  proveniencia,
  hashes,
}: {
  creditos: Credito[]
  proveniencia: Proveniencia
  hashes: string[]
}) {
  return (
    <details className="group rounded-lg border border-border bg-muted/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold marker:hidden">
        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        Créditos, licença e proveniência
        <span className="ml-auto text-[10px] font-normal text-muted-foreground group-open:hidden">
          abrir
        </span>
      </summary>

      <div className="space-y-3 border-t border-border px-3 py-3 text-xs leading-relaxed">
        <p className="text-muted-foreground">{CREDITO_BASE}</p>

        {creditos.length > 0 && (
          <div>
            <p className="mb-1 font-semibold">Créditos específicos desta lâmina</p>
            <ul className="space-y-1 text-muted-foreground">
              {creditos.map((credito, i) => (
                <li key={i} className="border-l-2 border-border pl-2">
                  {credito.texto}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-1 font-semibold">Licença</p>
          <p className="text-muted-foreground">
            {LICENCA.nome} ({LICENCA.identificador}). As adaptações mantêm a mesma licença.{' '}
            <a
              href={LICENCA.url}
              target="_blank"
              rel="noopener noreferrer license"
              className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2"
            >
              Ler a licença
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </p>
        </div>

        <div>
          <p className="mb-1 font-semibold">Alterações realizadas</p>
          <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
            {ALTERACOES_REALIZADAS.map((alteracao) => (
              <li key={alteracao}>{alteracao}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1 font-semibold">Proveniência</p>
          <dl className="grid gap-1 text-muted-foreground sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt className="font-medium">Página de origem</dt>
            <dd className="break-all">
              <a
                href={proveniencia.urlOrigem}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {proveniencia.urlOrigem}
              </a>
            </dd>
            <dt className="font-medium">Acesso em</dt>
            <dd>{formatarData(proveniencia.acessadoEm)}</dd>
            <dt className="font-medium">Identificador de origem</dt>
            <dd className="font-mono">{proveniencia.idOrigem}</dd>
            <dt className="font-medium">Arquivo no acervo</dt>
            <dd className="break-all font-mono text-[10px]">{proveniencia.arquivoOrigem}</dd>
          </dl>
        </div>

        {hashes.length > 0 && (
          <div>
            <p className="mb-1 font-semibold">
              Integridade das imagens ({hashes.length} arquivo{hashes.length > 1 ? 's' : ''})
            </p>
            <ul className="space-y-0.5 font-mono text-[10px] text-muted-foreground">
              {hashes.map((hash) => (
                <li key={hash} className="break-all">
                  sha256:{hash}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">
          {AVISO_EDUCACIONAL}
        </p>
      </div>
    </details>
  )
}

function formatarData(iso: string): string {
  const data = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

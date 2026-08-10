import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { MARCA_DE_DIREITOS } from '@/components/histopatologia/tema'
import {
  ALTERACOES_EDITORIAIS,
  AVISO_EDUCACIONAL,
  CREDITO_BASE,
  ESCOPOS_DE_DIREITOS,
  EXPLICACAO_DE_DIREITOS,
  LISTA_DE_FONTES,
} from '@/lib/histopatologia/direitos'
import { TOTAIS } from '@/lib/histopatologia/repositorio'
import { BASE, rotaDosCreditos } from '@/lib/histopatologia/rotas'
import { metadadosDoModulo } from '@/lib/histopatologia/seo'

export const revalidate = 86400

export const metadata = metadadosDoModulo({
  titulo: 'Créditos, proveniência e direitos',
  descricao:
    'Registro versionado de titulares, licenças, escopos e verificações de direitos das fontes ' +
    'catalogadas, e declaração das alterações editoriais feitas pelo GradeX.',
  caminho: rotaDosCreditos(),
})

/**
 * Página de créditos e direitos.
 *
 * Ela é **complementar** ao crédito que aparece junto de cada mídia, nunca
 * substituta — `CREDITOS_E_DIREITOS.md` é explícito nesse ponto, e é por isso
 * que o cartão de cada lâmina repete o crédito curto em vez de apontar para cá.
 *
 * O que existe só aqui é o registro versionado: quem é o titular, qual licença
 * se aplica, qual o escopo exato, quando foi verificado e por quem. Inclusive —
 * e principalmente — quando a resposta é "ninguém verificou ainda". Registrar a
 * pendência é informação; a ausência de registro é que seria omissão.
 */
export default function PaginaDeCreditos() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
          </Link>

          <header className="mb-6">
            <p className="editorial-mark mb-2">Transparência</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Créditos, proveniência e direitos
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{CREDITO_BASE}</p>
          </header>

          <section aria-labelledby="regra-de-midia" className="mb-8">
            <h2 id="regra-de-midia" className="mb-2 font-heading text-lg font-semibold">
              A regra de mídia deste módulo
            </h2>
            <ul className="space-y-1.5 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
              <li>Nenhuma imagem foi baixada, copiada, convertida ou armazenada pelo GradeX.</li>
              <li>
                O catálogo guarda <strong>apenas URLs e metadados</strong>:{' '}
                {TOTAIS.referenciasDeMidia.toLocaleString('pt-BR')} referências, zero arquivos de
                imagem.
              </li>
              <li>
                Não há proxy, miniatura local, cache de mídia nem otimizador de imagem envolvido.
              </li>
              <li>
                Quando a exibição for autorizada, o navegador do aluno buscará o arquivo diretamente
                do servidor da instituição de origem — que continua sendo quem o hospeda e serve.
              </li>
              <li>
                Sem autorização registrada, a interface mostra descrição, crédito e um botão para a
                página original. É o estado atual das duas fontes.
              </li>
            </ul>
          </section>

          <section aria-labelledby="fontes-creditos" className="mb-8">
            <h2 id="fontes-creditos" className="mb-3 font-heading text-lg font-semibold">
              Fontes catalogadas
            </h2>
            <ul className="space-y-3">
              {LISTA_DE_FONTES.map((fonte) => (
                <li key={fonte.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-bold">{fonte.nome}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {fonte.atribuicaoCatalogada}
                  </p>
                  <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
                    <div>
                      <dt className="inline font-bold">Crédito curto: </dt>
                      <dd className="inline text-muted-foreground">{fonte.creditoCurto}</dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">Site: </dt>
                      <dd className="inline">
                        <a
                          href={fonte.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {fonte.url}
                        </a>
                      </dd>
                    </div>
                    {fonte.doi && (
                      <div>
                        <dt className="inline font-bold">DOI: </dt>
                        <dd className="inline">
                          <a
                            href={`https://doi.org/${fonte.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {fonte.doi}
                          </a>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="inline font-bold">Domínios de mídia aceitos: </dt>
                      <dd className="inline text-muted-foreground">
                        {fonte.dominiosDeMidia.join(', ')}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-bold">Política inicial: </dt>
                      <dd className="inline text-muted-foreground">{fonte.politicaInicial}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="registro" className="mb-8">
            <h2 id="registro" className="mb-2 font-heading text-lg font-semibold">
              Registro de direitos, escopo a escopo
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Cada escopo é independente. Liberar uma coleção não libera a fonte inteira, e a
              licença de um acervo <strong>não vale</strong> para o outro — gratuidade e acesso
              público não são licença.
            </p>
            <ul className="space-y-3">
              {ESCOPOS_DE_DIREITOS.map((escopo) => {
                const marca = MARCA_DE_DIREITOS[escopo.estado]
                return (
                  <li key={escopo.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${marca.classe}`}
                      >
                        <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        escopo: {escopo.escopo} · {escopo.alvo}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed">
                      {EXPLICACAO_DE_DIREITOS[escopo.estado]}
                    </p>
                    <dl className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                      <div>
                        <dt className="inline font-bold">Titular: </dt>
                        <dd className="inline">{escopo.titular}</dd>
                      </div>
                      <div>
                        <dt className="inline font-bold">Licença aplicável: </dt>
                        <dd className="inline">{escopo.licenca ?? 'nenhuma identificada'}</dd>
                      </div>
                      <div>
                        <dt className="inline font-bold">Comprovante: </dt>
                        <dd className="inline">
                          {escopo.comprovante ? (
                            <a
                              href={escopo.comprovante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {escopo.comprovante}
                            </a>
                          ) : (
                            'nenhum arquivado'
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-bold">Verificado em: </dt>
                        <dd className="inline">
                          {escopo.verificadoEm} por {escopo.responsavel}
                        </dd>
                      </div>
                      {escopo.restricoes.length > 0 && (
                        <div>
                          <dt className="font-bold">Restrições registradas:</dt>
                          <dd>
                            <ul className="list-disc pl-5">
                              {escopo.restricoes.map((r) => (
                                <li key={r}>{r}</li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      )}
                      {escopo.observacao && (
                        <div>
                          <dt className="inline font-bold">Observação: </dt>
                          <dd className="inline">{escopo.observacao}</dd>
                        </div>
                      )}
                    </dl>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="alteracoes" className="mb-8">
            <h2 id="alteracoes" className="mb-2 font-heading text-lg font-semibold">
              O que é trabalho editorial do GradeX
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Estas alterações são de autoria do GradeX e{' '}
              <strong>não devem ser atribuídas às instituições-fonte</strong>. Em particular, todo o
              texto didático — definição, mecanismo, roteiro por aumento, diferenciais e
              autoavaliação — é nosso, e é ele que aguarda revisão médica.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {ALTERACOES_EDITORIAIS.map((alteracao) => (
                <li key={alteracao}>{alteracao}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="aviso-medico">
            <h2 id="aviso-medico" className="mb-2 font-heading text-lg font-semibold">
              Aviso médico
            </h2>
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed">
              {AVISO_EDUCACIONAL}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

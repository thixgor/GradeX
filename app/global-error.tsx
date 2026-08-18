'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  descreverAparelho,
  descreverConexao,
  diagnosticar,
  gerarCodigoDeErro,
} from '@/lib/erros/diagnostico'

/**
 * O último anteparo: erro no próprio layout raiz.
 *
 * Quando a falha acontece dentro do `app/layout.tsx`, o `app/error.tsx` não
 * chega a ser renderizado — o layout que o envolve é justamente o que
 * quebrou. Nesse caso o Next troca o documento inteiro por este arquivo, e é
 * por isso que ele precisa desenhar as próprias tags `<html>` e `<body>`.
 *
 * Aqui NÃO usamos Tailwind nem `globals.css`. O motivo é concreto: as folhas
 * de estilo do projeto são carregadas pelo layout raiz, o mesmo que acabou de
 * falhar; contar com elas seria arriscar uma tela de erro sem estilo nenhum —
 * texto preto empilhado em fundo branco, que é exatamente a cara de "o app
 * quebrou" que esta tela existe para evitar. Tudo aqui é estilo embutido, com
 * as mesmas cores do tema (claro e escuro), e funciona mesmo que nenhum outro
 * arquivo do site carregue.
 *
 * Sem este arquivo e sem o `error.tsx`, o que aparecia era a frase padrão do
 * Next: "Application error: a client-side exception has occurred (see the
 * browser console for more information)".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [online, setOnline] = useState<boolean | undefined>(undefined)
  const [conexao, setConexao] = useState('Verificando…')
  const [aparelho, setAparelho] = useState('—')
  const [horario, setHorario] = useState('—')
  const [reconectou, setReconectou] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    console.error('[DomineAqui] erro no layout raiz:', error)
  }, [error])

  useEffect(() => {
    const ler = () => {
      setOnline(navigator.onLine)
      setConexao(
        descreverConexao(
          (navigator as Navigator & { connection?: { effectiveType?: string } })
            .connection?.effectiveType,
          navigator.onLine,
        ),
      )
      setAparelho(descreverAparelho(navigator.userAgent))
      setHorario(
        new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      )
    }
    ler()

    const voltou = () => {
      setReconectou(true)
      window.setTimeout(() => window.location.reload(), 900)
    }
    window.addEventListener('online', voltou)
    window.addEventListener('offline', ler)
    return () => {
      window.removeEventListener('online', voltou)
      window.removeEventListener('offline', ler)
    }
  }, [])

  const entrada = useMemo(
    () => ({ mensagem: error.message, nome: error.name, digest: error.digest, online }),
    [error, online],
  )
  const diagnostico = useMemo(() => diagnosticar(entrada), [entrada])
  const codigo = useMemo(() => gerarCodigoDeErro(entrada), [entrada])

  const copiar = async () => {
    const relatorio = [
      'DomineAqui — relatório de erro',
      `Código: ${codigo}`,
      `Categoria: ${diagnostico.categoria}`,
      `Título: ${diagnostico.titulo}`,
      `Quando: ${horario}`,
      `Aparelho: ${aparelho}`,
      `Conexão: ${conexao}`,
      `Identificador técnico: ${error.digest ?? '—'}`,
      `Erro: ${error.name}: ${error.message}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(relatorio)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      // Clipboard indisponível: o código do erro continua visível na tela para
      // ser ditado ao suporte, então não há caminho sem saída.
    }
  }

  const critico = diagnostico.gravidade === 'erro'

  return (
    <html lang="pt-BR">
      <head>
        <title>{`${diagnostico.titulo} — DomineAqui`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <style dangerouslySetInnerHTML={{ __html: ESTILOS }} />
      </head>
      <body>
        <main className="da-err-tela">
          <div className="da-err-halo" aria-hidden />

          <section className="da-err-cartao">
            <div className={`da-err-icone${critico ? ' da-err-icone-critico' : ''}`}>
              <Icone nome={diagnostico.icone} />
            </div>

            <p className="da-err-fator">{diagnostico.fator}</p>
            <h1 className="da-err-titulo">{diagnostico.titulo}</h1>
            <p className="da-err-resumo">{diagnostico.resumo}</p>

            {reconectou && (
              <p className="da-err-reconectou" role="status">
                Conexão de volta — recarregando…
              </p>
            )}

            <ol className="da-err-passos">
              {diagnostico.passos.map((passo, indice) => (
                <li key={passo}>
                  <span className="da-err-numero">{indice + 1}</span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>

            <div className="da-err-acoes">
              {diagnostico.tentarNovamenteResolve && (
                <button type="button" className="da-err-botao" onClick={reset}>
                  Tentar de novo
                </button>
              )}
              <button
                type="button"
                className={
                  diagnostico.tentarNovamenteResolve
                    ? 'da-err-botao da-err-botao-secundario'
                    : 'da-err-botao'
                }
                onClick={() => window.location.reload()}
              >
                Recarregar página
              </button>
              <a className="da-err-botao da-err-botao-secundario" href="/">
                Ir para o início
              </a>
            </div>

            {/* Fatores associados: o estado do aparelho na hora da falha. É o
                que deixa a pessoa concluir sozinha "ah, é a minha internet". */}
            <dl className="da-err-fatores">
              <div>
                <dt>Conexão</dt>
                <dd className={online === false ? 'da-err-valor-alerta' : undefined}>
                  {conexao}
                </dd>
              </div>
              <div>
                <dt>Aparelho</dt>
                <dd>{aparelho}</dd>
              </div>
              <div>
                <dt>Quando</dt>
                <dd>{horario}</dd>
              </div>
              <div>
                <dt>Código do erro</dt>
                <dd className="da-err-mono">{codigo}</dd>
              </div>
            </dl>

            <button type="button" className="da-err-copiar" onClick={copiar}>
              {copiado ? 'Detalhes copiados' : 'Copiar detalhes para o suporte'}
            </button>
          </section>

          <p className="da-err-rodape">
            Continua acontecendo? Escreva para{' '}
            <a href="mailto:contato@domineaqui.com.br">contato@domineaqui.com.br</a> com o
            código <span className="da-err-mono">{codigo}</span>.
          </p>
        </main>
      </body>
    </html>
  )
}

/**
 * Ícones desenhados à mão, em vez de importados do lucide.
 *
 * Mesma razão do CSS embutido: quanto menos esta tela depender do resto do
 * pacote da aplicação, maior a chance de ela aparecer inteira justamente na
 * hora em que o resto falhou.
 */
function Icone({ nome }: { nome: string }) {
  const comuns = {
    width: 30,
    height: 30,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (nome === 'sem-sinal' || nome === 'antena') {
    return (
      <svg {...comuns}>
        <path d="M2 8.8a16 16 0 0 1 20 0" />
        <path d="M5 12.6a11 11 0 0 1 14 0" />
        <path d="M8.5 16.4a6 6 0 0 1 7 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
        {nome === 'sem-sinal' && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    )
  }
  if (nome === 'atualizar') {
    return (
      <svg {...comuns}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
    )
  }
  if (nome === 'cadeado' || nome === 'bloqueado') {
    return (
      <svg {...comuns}>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    )
  }
  if (nome === 'servidor') {
    return (
      <svg {...comuns}>
        <rect x="3" y="4" width="18" height="7" rx="2" />
        <rect x="3" y="13" width="18" height="7" rx="2" />
        <line x1="7" y1="7.5" x2="7.01" y2="7.5" />
        <line x1="7" y1="16.5" x2="7.01" y2="16.5" />
      </svg>
    )
  }
  if (nome === 'ampulheta') {
    return (
      <svg {...comuns}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    )
  }
  // Alerta: o desenho padrão, usado por tudo que não tem um próprio.
  return (
    <svg {...comuns}>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

/* Cores idênticas às de `globals.css`, escritas aqui em hex para não depender
   de nenhum arquivo externo. O bloco escuro segue a preferência do sistema —
   o `next-themes`, que guarda a escolha manual, morreu junto com o layout. */
const ESTILOS = `
*{box-sizing:border-box}
html,body{margin:0;padding:0}
:root{
  --da-bg:#F5F1EB; --da-cartao:#FFFCF7; --da-texto:#1A2419; --da-suave:#5A6B5C;
  --da-borda:#DCD3C4; --da-verde:#468152; --da-vermelho:#C2412D; --da-muted:#EAE4D8;
  /* Texto sobre o verde. No escuro o verde clareia, e branco sobre ele fica
     com contraste baixo demais — ali quem lê bem é o tom do fundo. */
  --da-sobre-verde:#FFFFFF;
}
@media (prefers-color-scheme:dark){
  :root{
    --da-bg:#0B130F; --da-cartao:#131C16; --da-texto:#F0EBE0; --da-suave:#9BAA9E;
    --da-borda:#22302A; --da-verde:#5FA46F; --da-vermelho:#E07A62; --da-muted:#1A241D;
    --da-sobre-verde:#0B130F;
  }
}
body{
  background:var(--da-bg); color:var(--da-texto);
  font-family:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.da-err-tela{
  position:relative; min-height:100svh; display:flex; flex-direction:column;
  align-items:center; justify-content:center; padding:56px 20px; overflow:hidden;
}
.da-err-halo{
  position:absolute; inset:0; pointer-events:none; z-index:0;
  background:
    radial-gradient(60rem 32rem at 50% -10%, rgba(70,129,82,.16), transparent 65%),
    radial-gradient(40rem 24rem at 100% 100%, rgba(226,164,62,.12), transparent 60%);
}
.da-err-cartao{
  position:relative; z-index:1; width:100%; max-width:560px; text-align:center;
  background:var(--da-cartao); border:1px solid var(--da-borda); border-radius:24px;
  padding:36px 26px; box-shadow:0 24px 60px -32px rgba(0,0,0,.45);
}
.da-err-icone{
  width:64px; height:64px; margin:0 auto; display:flex; align-items:center;
  justify-content:center; border-radius:18px; color:var(--da-verde);
  background:rgba(70,129,82,.12); box-shadow:inset 0 0 0 1px rgba(70,129,82,.25);
}
.da-err-icone-critico{
  color:var(--da-vermelho); background:rgba(194,65,45,.10);
  box-shadow:inset 0 0 0 1px rgba(194,65,45,.25);
}
.da-err-fator{
  margin:20px 0 0; font-size:11px; font-weight:600; letter-spacing:.18em;
  text-transform:uppercase; color:var(--da-suave);
  font-family:'IBM Plex Mono',ui-monospace,monospace;
}
.da-err-titulo{
  margin:8px 0 0; font-size:26px; line-height:1.2; font-weight:600;
  font-family:Newsreader,Georgia,serif;
}
.da-err-resumo{
  margin:12px auto 0; max-width:26rem; font-size:14.5px; line-height:1.65; color:var(--da-suave);
}
.da-err-reconectou{
  margin:22px 0 0; padding:10px 16px; border-radius:12px; font-size:14px;
  font-weight:600; color:var(--da-verde); background:rgba(70,129,82,.12);
}
.da-err-passos{
  margin:26px 0 0; padding:0; list-style:none; text-align:left;
  display:flex; flex-direction:column; gap:12px;
}
.da-err-passos li{display:flex; gap:12px; font-size:14px; line-height:1.6}
.da-err-numero{
  flex:0 0 auto; width:20px; height:20px; margin-top:2px; border-radius:999px;
  display:flex; align-items:center; justify-content:center; background:var(--da-muted);
  font-size:11px; font-weight:700; color:var(--da-suave);
  font-family:'IBM Plex Mono',ui-monospace,monospace;
}
.da-err-acoes{margin:30px 0 0; display:flex; flex-direction:column; gap:10px}
@media (min-width:520px){.da-err-acoes{flex-direction:row}}
.da-err-botao{
  flex:1; height:44px; display:inline-flex; align-items:center; justify-content:center;
  border:0; border-radius:12px; background:var(--da-verde); color:var(--da-sobre-verde); cursor:pointer;
  font-size:14px; font-weight:700; font-family:inherit; text-decoration:none;
  transition:transform .1s ease, filter .15s ease;
}
.da-err-botao:active{transform:scale(.97)}
.da-err-botao-secundario{
  background:transparent; color:var(--da-texto); border:1px solid var(--da-borda);
}
.da-err-fatores{
  margin:28px 0 0; padding:16px 0 0; border-top:1px solid var(--da-borda);
  display:grid; grid-template-columns:1fr; gap:12px 24px; text-align:left;
}
@media (min-width:520px){.da-err-fatores{grid-template-columns:1fr 1fr}}
.da-err-fatores dt{
  font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--da-suave);
}
.da-err-fatores dd{margin:2px 0 0; font-size:14px; font-weight:500}
.da-err-valor-alerta{color:var(--da-vermelho)}
.da-err-mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.da-err-copiar{
  margin:20px 0 0; height:32px; padding:0 12px; border:0; border-radius:10px;
  background:var(--da-muted); color:var(--da-texto); font-size:12px; font-weight:600;
  font-family:inherit; cursor:pointer;
}
.da-err-rodape{
  position:relative; z-index:1; margin:20px 0 0; max-width:560px;
  font-size:12px; line-height:1.6; color:var(--da-suave); text-align:center;
}
.da-err-rodape a{color:var(--da-texto); font-weight:600}
`

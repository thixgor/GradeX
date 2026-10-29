import { estiloDoChip } from '@/components/sidebar-cores'
import { IconeDaPorta } from './barra-do-manual'
import { PORTAS_DO_MANUAL, type PortaDoManual } from './modulos'
import '@/components/checkout/checkout-vidro.css'
import './manual-vidro.css'

/**
 * O herói de todo módulo do Manual Clínico — a mesma forma em todas as portas.
 *
 * Cada módulo abria de um jeito: logo em imagem, título serifado, fundo escuro,
 * duas colunas com demonstração. A pessoa que pulava da Radiologia para a
 * Semiologia sentia que tinha mudado de site. Agora toda porta abre igual,
 * centrada e curta (o que se lê em 3 s decide se a pessoa fica):
 *
 *  1. o quadradinho na cor do módulo — a mesma da barra e do menu;
 *  2. o título é o RESULTADO, não o nome ("Leia o laudo entendendo o porquê",
 *     não "Exames Laboratoriais") — o nome já está na barra logo acima;
 *  3. uma frase de promessa;
 *  4. três números reais do acervo (prova, não adjetivo);
 *  5. as ações.
 *
 * O que é único de cada módulo (o simulador do ECG, a pilha de TC, a lâmina)
 * vem logo abaixo, em `children`: é a demonstração que vende melhor que texto.
 */
export function HeroiDoModulo({
  porta,
  titulo,
  promessa,
  numeros,
  acoes,
  aviso,
  children,
  className = '',
}: {
  porta: PortaDoManual['id']
  titulo: React.ReactNode
  promessa: React.ReactNode
  numeros: { v: React.ReactNode; r: string }[]
  acoes?: React.ReactNode
  /** Uma linha acima das ações (ex.: o item que a pessoa tentou abrir). */
  aviso?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const p = PORTAS_DO_MANUAL.find((x) => x.id === porta) || PORTAS_DO_MANUAL[0]

  return (
    <header className={`ck-escopo mc-heroi ck-entra ${className}`}>
      <span className="sidebar-mini-chip mc-heroi-chip" style={estiloDoChip(p.cor)} aria-hidden>
        <IconeDaPorta porta={p} className="h-[30px] w-[30px]" />
      </span>
      <p className="text-[13px] font-semibold" style={{ color: 'var(--ck-texto-3)' }}>
        {p.nome} · Manual Clínico
      </p>
      <h1 className="mc-heroi-titulo" style={{ color: 'var(--ck-texto)' }}>{titulo}</h1>
      <p className="mc-heroi-promessa">{promessa}</p>
      {numeros.length > 0 && (
        <div className="mc-numeros" data-n={numeros.length} style={{ gridTemplateColumns: `repeat(${Math.min(numeros.length, 4)}, minmax(0, 1fr))` }}>
          {numeros.map((n) => (
            <div key={n.r} className="mc-numero">
              <b>{n.v}</b>
              <span>{n.r}</span>
            </div>
          ))}
        </div>
      )}
      {aviso && <p className="max-w-xl text-sm" style={{ color: 'var(--ck-texto-2)' }}>{aviso}</p>}
      {acoes && <div className="mc-acoes">{acoes}</div>}
      {children}
    </header>
  )
}

/**
 * A cabeça curta, para quem já tem o módulo: o mesmo quadradinho e a mesma
 * tipografia do herói, numa linha só — quem entrou para usar a ferramenta não
 * precisa rolar a promessa de venda para chegar nela.
 */
export function CabecaDoModulo({
  porta,
  titulo,
  texto,
  lado,
  className = '',
}: {
  porta: PortaDoManual['id']
  titulo?: React.ReactNode
  texto?: React.ReactNode
  /** À direita no desktop, embaixo no celular (selo de acesso, atalhos). */
  lado?: React.ReactNode
  className?: string
}) {
  const p = PORTAS_DO_MANUAL.find((x) => x.id === porta) || PORTAS_DO_MANUAL[0]

  return (
    <header className={`ck-escopo mc-cabeca ${className}`}>
      <span className="sidebar-mini-chip mc-cabeca-chip" style={estiloDoChip(p.cor)} aria-hidden>
        <IconeDaPorta porta={p} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="mc-cabeca-titulo" style={{ color: 'var(--ck-texto)' }}>{titulo ?? p.nome}</h1>
        {texto && <p className="mc-cabeca-texto">{texto}</p>}
      </div>
      {lado && <div className="mc-cabeca-lado">{lado}</div>}
    </header>
  )
}

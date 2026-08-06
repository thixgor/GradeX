/**
 * Logo do Manual de Tomografia.
 *
 * O arquivo é um SVG em azul-petróleo muito escuro (#002537) com acentos em
 * ciano e laranja — desenhado para fundo claro. No tema escuro ele sumiria, e
 * recolorir o SVG por CSS não funciona (as cores estão em `fill` de centenas de
 * paths). A saída é inverter a luminância mantendo a matiz: `invert` sozinho
 * viraria o petróleo em pêssego, e a rotação de 180° na roda de cor traz o tom
 * de volta ao azul original. O laranja passa pelo mesmo par de operações e
 * retorna a laranja.
 */
export function LogoTomografia({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo_manual_tomografia_domineaqui.svg"
      alt="Manual de Tomografia — DomineAqui"
      width={945}
      height={265}
      className={`block h-auto dark:[filter:invert(1)_hue-rotate(180deg)_brightness(1.15)] ${className}`}
    />
  )
}

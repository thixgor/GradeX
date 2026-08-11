/**
 * Mantém o nome público do componente para não quebrar as páginas de TC, mas
 * usa a identidade visual unificada do Manual de Radiologia.
 */
export function LogoTomografia({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo_manual_radiologia.svg"
      alt="Manual de Radiologia"
      width={1536}
      height={1024}
      className={`block h-auto dark:[filter:invert(1)_hue-rotate(180deg)_brightness(1.15)] ${className}`}
    />
  )
}

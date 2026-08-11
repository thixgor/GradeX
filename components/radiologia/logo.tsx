export function LogoRadiologia({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo_manual_radiologia.svg"
      alt="Manual de Radiologia"
      width={1536}
      height={1024}
      className={`block h-auto w-full max-w-[360px] dark:[filter:invert(1)_hue-rotate(180deg)_brightness(1.15)] ${className}`}
    />
  )
}

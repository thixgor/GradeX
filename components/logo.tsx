interface LogoProps {
  variant?: 'icon' | 'text' | 'full' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Subtle float. Off by default — floating logos read as generic AI UI. */
  animated?: boolean
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  animated = false,
}: LogoProps) {
  const heightMap = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  }

  const height = heightMap[size]

  const imageMap = {
    icon: '/img/logo.svg',
    text: '/img/logo_apenastexto.svg',
    full: '/img/logo_com_texto.svg',
    dark: '/img/logo_darkmode.svg',
  }

  const imagePath = imageMap[variant]

  return (
    <>
      {animated && (
        <style>{`
          @keyframes logoFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          .logo-animated {
            animation: logoFloat 4s ease-in-out infinite;
          }
        `}</style>
      )}
      <img
        src={imagePath}
        alt="DomineAqui"
        className={`${height} w-auto ${animated ? 'logo-animated' : ''} ${className}`}
      />
    </>
  )
}

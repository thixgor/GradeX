interface LogoProps {
  variant?: 'icon' | 'text' | 'full' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const heightMap = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  }

  const height = heightMap[size]

  // Map variants to image paths
  const imageMap = {
    icon: '/img/logo.svg',
    text: '/img/logo_apenastexto.svg',
    full: '/img/logo_com_texto.svg',
    dark: '/img/logo_darkmode.svg',
  }

  const imagePath = imageMap[variant]

  return (
    <>
      <style>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes logoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
          }
        }
        
        .logo-animated {
          animation: logoFloat 3s ease-in-out infinite, logoGlow 3s ease-in-out infinite;
        }
      `}</style>
      <img
        src={imagePath}
        alt="DomineAqui"
        className={`${height} w-auto logo-animated ${className}`}
      />
    </>
  )
}

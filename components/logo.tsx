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
    <img
      src={imagePath}
      alt="DomineAqui"
      className={`${height} w-auto ${className}`}
    />
  )
}

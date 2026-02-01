import Image from 'next/image'

interface PremiumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function PremiumLogo({ size = 'lg' }: PremiumLogoProps) {
  const sizeMap = {
    sm: { container: 'w-16 h-16', width: 64, height: 64 },
    md: { container: 'w-24 h-24', width: 96, height: 96 },
    lg: { container: 'w-32 h-32', width: 128, height: 128 },
    xl: { container: 'w-40 h-40', width: 160, height: 160 }
  }

  const { container, width, height } = sizeMap[size]

  return (
    <div className={`relative ${container}`}>
      <Image
        src="https://i.imgur.com/RZLujWN.png"
        alt="DomineAqui Premium"
        width={width}
        height={height}
        className="rounded-lg w-auto h-auto"
      />
    </div>
  )
}

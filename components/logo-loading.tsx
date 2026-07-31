'use client'

import Image from 'next/image'

interface LogoLoadingProps {
  /** Optional loading message */
  message?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** For fullscreen loading */
  fullscreen?: boolean
}

/**
 * Optimized CSS-only loading component with animated logo
 * No framer-motion dependency = faster load, smaller bundle
 * Uses CSS animations for smooth performance
 */
export function LogoLoading({
  message = 'Carregando...',
  size = 'md',
  fullscreen = false,
}: LogoLoadingProps) {
  const sizes = {
    sm: { logo: 40, container: 'min-h-[150px]' },
    md: { logo: 60, container: 'min-h-[300px]' },
    lg: { logo: 80, container: 'min-h-[400px]' },
  }

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-background'
    : sizes[size].container

  return (
    <div className={`${containerClass} flex items-center justify-center w-full`}>
      <div className="flex flex-col items-center gap-4">
        {/* Logo with pulse animation */}
        <div className="relative">
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{
              width: sizes[size].logo + 24,
              height: sizes[size].logo + 24,
              left: -12,
              top: -12,
              animationDuration: '1.5s',
            }}
          />

          {/* Spinning ring */}
          <div
            className="absolute rounded-full border-2 border-primary/20 border-t-primary animate-spin"
            style={{
              width: sizes[size].logo + 16,
              height: sizes[size].logo + 16,
              left: -8,
              top: -8,
              animationDuration: '1s',
            }}
          />

          {/* Logo */}
          <div className="relative z-10 rounded-xl overflow-hidden bg-background/80 backdrop-blur-sm p-2 shadow-lg animate-pulse">
            <Image
              src="/logo-icon.webp"
              alt="Carregando"
              width={sizes[size].logo}
              height={sizes[size].logo}
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full animate-loading-bar"
            style={{
              width: '40%',
            }}
          />
        </div>

        {/* Message */}
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>

      {/* CSS for loading bar animation */}
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(150%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

/**
 * Inline spinner with logo - for buttons and small areas
 */
export function LogoSpinnerInline({ size = 24 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="absolute rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        style={{ width: size + 8, height: size + 8 }}
      />
      <Image
        src="/logo-icon.webp"
        alt=""
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
    </div>
  )
}

'use client'

import Image from 'next/image'

interface PageLoadingProps {
  /** Optional loading message */
  message?: string
  /** Variant for different contexts */
  variant?: 'default' | 'minimal' | 'fullscreen'
  /** Background style */
  background?: 'transparent' | 'blur' | 'solid'
}

export function PageLoading({
  message,
  variant = 'default',
  background = 'solid',
}: PageLoadingProps) {
  const containerClasses = {
    default: 'min-h-[400px]',
    minimal: 'min-h-[200px]',
    fullscreen: 'min-h-screen',
  }

  const backgroundClasses = {
    transparent: 'bg-transparent',
    blur: 'bg-background/80 backdrop-blur-sm',
    solid: 'bg-gradient-to-br from-background via-background to-muted/30',
  }

  const logoSizes = {
    default: 76,
    minimal: 56,
    fullscreen: 88,
  }

  const logoSize = logoSizes[variant]
  const ringSize = logoSize + 38

  return (
    <div
      className={`
        ${containerClasses[variant]}
        ${backgroundClasses[background]}
        flex w-full items-center justify-center
      `}
      role="status"
      aria-live="polite"
      aria-label={message || 'Carregando'}
    >
      <div className="flex flex-col items-center gap-5 page-loading-enter">
        <div
          className="relative isolate"
          style={{ width: ringSize, height: ringSize }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 page-loading-pulse" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/20 border-t-primary page-loading-spin" />
          <div
            className="absolute left-1/2 top-1/2 z-10 rounded-2xl border border-border/60 bg-background/85 p-2.5 shadow-lg shadow-primary/10"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <Image
              src="/logo-icon.webp"
              alt=""
              width={logoSize}
              height={logoSize}
              className="object-contain"
            />
          </div>
        </div>

        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/5 rounded-full bg-primary page-loading-bar" />
        </div>

        {message && (
          <p className="max-w-[240px] text-center text-sm font-medium text-muted-foreground">
            {message}
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes page-loading-enter {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes page-loading-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes page-loading-pulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.75;
            transform: scale(1);
          }
        }

        @keyframes page-loading-bar {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(165%);
          }
          100% {
            transform: translateX(-120%);
          }
        }

        .page-loading-enter {
          animation: page-loading-enter 180ms ease-out both;
        }

        .page-loading-spin {
          animation: page-loading-spin 900ms linear infinite;
          transform-origin: center;
        }

        .page-loading-pulse {
          animation: page-loading-pulse 1400ms ease-in-out infinite;
        }

        .page-loading-bar {
          animation: page-loading-bar 1300ms ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .page-loading-enter,
          .page-loading-spin,
          .page-loading-pulse,
          .page-loading-bar {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  )
}

export function LogoSpinner({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: { wrapper: 32, logo: 24 },
    md: { wrapper: 48, logo: 36 },
    lg: { wrapper: 64, logo: 48 },
  }

  return (
    <span
      className="relative inline-flex items-center justify-center align-middle"
      style={{ width: sizes[size].wrapper, height: sizes[size].wrapper }}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary page-loading-spin" />
      <Image
        src="/logo-icon.webp"
        alt=""
        width={sizes[size].logo}
        height={sizes[size].logo}
        className="object-contain"
      />
      <style jsx>{`
        @keyframes page-loading-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .page-loading-spin {
          animation: page-loading-spin 900ms linear infinite;
          transform-origin: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .page-loading-spin {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </span>
  )
}

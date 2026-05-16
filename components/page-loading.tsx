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
        default: { width: 80, height: 80 },
        minimal: { width: 60, height: 60 },
        fullscreen: { width: 100, height: 100 },
    }

    const logoSize = logoSizes[variant]
    const haloSize = logoSize.width + 28
    const ringSize = logoSize.width + 18

    return (
        <div
            className={`
        ${containerClasses[variant]}
        ${backgroundClasses[background]}
        flex items-center justify-center w-full
      `}
            role="status"
            aria-live="polite"
            aria-label={message || 'Carregando'}
        >
            <div className="flex animate-fade-in flex-col items-center gap-5">
                <div
                    className="relative flex items-center justify-center"
                    style={{ width: haloSize, height: haloSize }}
                >
                    <span
                        className="absolute rounded-full bg-primary/10 motion-safe:animate-ping"
                        style={{ width: haloSize, height: haloSize, animationDuration: '1.6s' }}
                    />
                    <span
                        className="absolute rounded-full border-2 border-primary/15 border-t-primary motion-safe:animate-spin"
                        style={{ width: ringSize, height: ringSize, animationDuration: '900ms' }}
                    />
                    <div
                        className="relative z-10 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-lg shadow-primary/10 backdrop-blur-sm motion-safe:animate-pulse"
                        style={{ animationDuration: '1.8s' }}
                    >
                        <Image
                            src="/logo.png"
                            alt="Carregando"
                            width={logoSize.width}
                            height={logoSize.height}
                            className="object-contain"
                            priority={variant === 'fullscreen'}
                        />
                    </div>
                </div>

                <div className="relative h-1 w-24 overflow-hidden rounded-full bg-muted">
                    <span className="animate-loading-bar absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary" />
                </div>

                {message && (
                    <p className="text-sm font-medium text-muted-foreground">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}

// Alternative minimal spinner with logo (for inline use)
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
        <div className="relative inline-flex items-center justify-center">
            <span
                className="absolute rounded-full border-2 border-primary/30 border-t-primary"
                style={{
                    width: sizes[size].wrapper,
                    height: sizes[size].wrapper,
                    animation: 'spin 1s linear infinite',
                }}
            />

            <Image
                src="/logo.png"
                alt="Carregando"
                width={sizes[size].logo}
                height={sizes[size].logo}
                className="object-contain"
            />
        </div>
    )
}

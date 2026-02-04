'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface PageLoadingProps {
    /** Optional loading message */
    message?: string
    /** Variant for different contexts */
    variant?: 'default' | 'minimal' | 'fullscreen'
    /** Background style */
    background?: 'transparent' | 'blur' | 'solid'
}

// Pulse animation for the logo
const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
}

// Orbit animation for the dots
const orbitAnimation = (delay: number, duration: number) => ({
    rotate: 360,
    transition: {
        duration,
        repeat: Infinity,
        ease: 'linear' as const,
        delay,
    },
})

// Fade in animation
const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
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

    return (
        <div
            className={`
        ${containerClasses[variant]}
        ${backgroundClasses[background]}
        flex items-center justify-center w-full
      `}
        >
            <motion.div
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {/* Logo Container with Animations */}
                <div className="relative">
                    {/* Outer glow ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                        style={{
                            width: logoSizes[variant].width + 40,
                            height: logoSizes[variant].height + 40,
                            left: -20,
                            top: -20,
                        }}
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Orbiting dots */}
                    <div
                        className="absolute inset-0"
                        style={{
                            width: logoSizes[variant].width + 30,
                            height: logoSizes[variant].height + 30,
                            left: -15,
                            top: -15,
                        }}
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-primary/80"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    marginTop: -4,
                                    marginLeft: -4,
                                    transformOrigin: `4px ${(logoSizes[variant].width + 30) / 2}px`,
                                }}
                                animate={orbitAnimation(i * 0.4, 2.4)}
                            />
                        ))}
                    </div>

                    {/* Logo with pulse effect */}
                    <motion.div
                        className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-background/50 backdrop-blur-sm p-3"
                        animate={pulseAnimation}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Image
                            src="/logo.png"
                            alt="Loading..."
                            width={logoSizes[variant].width}
                            height={logoSizes[variant].height}
                            className="object-contain"
                            priority
                        />
                    </motion.div>

                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 z-20 rounded-2xl overflow-hidden pointer-events-none"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                        }}
                        animate={{
                            x: ['-200%', '200%'],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            repeatDelay: 1,
                        }}
                    />
                </div>

                {/* Loading indicator bar */}
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
                        animate={{
                            x: ['-100%', '100%'],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </div>

                {/* Optional message */}
                {message && (
                    <motion.p
                        className="text-sm text-muted-foreground font-medium"
                        {...fadeIn}
                    >
                        {message}
                    </motion.p>
                )}

                {/* Decorative dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            animate={{
                                y: [0, -6, 0],
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.15,
                            }}
                        />
                    ))}
                </div>
            </motion.div>
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
            {/* Spinning ring */}
            <motion.div
                className="absolute rounded-full border-2 border-primary/30 border-t-primary"
                style={{
                    width: sizes[size].wrapper,
                    height: sizes[size].wrapper,
                }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Logo */}
            <Image
                src="/logo.png"
                alt="Loading..."
                width={sizes[size].logo}
                height={sizes[size].logo}
                className="object-contain"
            />
        </div>
    )
}

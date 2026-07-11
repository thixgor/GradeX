'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ListMusic,
    ChevronDown,
    X,
    Gauge,
    Check,
    Music,
    Loader2,
    SkipForward,
    SkipBack
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useFloatingDock } from '@/context/FloatingDockContext'

interface StudyPlaylist {
    _id: string
    name: string
    youtubePlaylistId: string
}

type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2

interface PlayerState {
    isExpanded: boolean
    isPlaying: boolean
    volume: number
    playbackRate: PlaybackRate
    currentPlaylistId: string | null
    currentPlaylistName: string
}

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2]

const STORAGE_KEY = 'study-music-player-state'

// YouTube IFrame API types
declare global {
    interface Window {
        YT: {
            Player: new (
                elementId: string | HTMLElement,
                config: {
                    width?: string | number
                    height?: string | number
                    playerVars?: Record<string, unknown>
                    events?: {
                        onReady?: (event: { target: YT.Player }) => void
                        onStateChange?: (event: { data: number; target: YT.Player }) => void
                        onError?: (event: { data: number }) => void
                    }
                }
            ) => YT.Player
            PlayerState: {
                UNSTARTED: number
                ENDED: number
                PLAYING: number
                PAUSED: number
                BUFFERING: number
                CUED: number
            }
        }
        onYouTubeIframeAPIReady: () => void
    }
    namespace YT {
        interface Player {
            playVideo: () => void
            pauseVideo: () => void
            stopVideo: () => void
            setVolume: (volume: number) => void
            getVolume: () => number
            setPlaybackRate: (rate: number) => void
            getPlaybackRate: () => number
            loadPlaylist: (playlist: string | string[] | { list: string; listType: string }) => void
            cuePlaylist: (playlist: string | string[] | { list: string; listType: string }) => void
            nextVideo: () => void
            previousVideo: () => void
            getPlayerState: () => number
            getCurrentTime: () => number
            getDuration: () => number
            destroy: () => void
        }
    }
}

export function StudyMusicPlayer() {
    const pathname = usePathname()
    const { isAuthenticated, loading: authLoading } = useAuthUser()
    const dock = useFloatingDock()
    // Expansão controlada pelo dock compartilhado (um painel por vez; no mobile
    // o player é aberto pelo FAB consolidado em vez de um orbe solto na tela).
    const isExpanded = dock?.activePanel === 'music'
    const [playlists, setPlaylists] = useState<StudyPlaylist[]>([])
    const [loading, setLoading] = useState(true)
    const [playerReady, setPlayerReady] = useState(false)
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [hydrated, setHydrated] = useState(false)

    // Read saved state from localStorage synchronously on first render to avoid color flash
    const [state, setState] = useState<PlayerState>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    const savedRate = PLAYBACK_RATES.includes(parsed.playbackRate) ? parsed.playbackRate : 1
                    return {
                        isExpanded: false,
                        isPlaying: false,
                        volume: parsed.volume ?? 50,
                        playbackRate: savedRate as PlaybackRate,
                        currentPlaylistId: parsed.currentPlaylistId ?? null,
                        currentPlaylistName: ''
                    }
                }
            } catch {}
        }
        return {
            isExpanded: false,
            isPlaying: false,
            volume: 50,
            playbackRate: 1,
            currentPlaylistId: null,
            currentPlaylistName: ''
        }
    })

    // Mark as hydrated after first render to avoid SSR mismatch flash
    useEffect(() => {
        setHydrated(true)
    }, [])

    const playerRef = useRef<YT.Player | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const apiLoadedRef = useRef(false)

    // Motion values for organic floating animation
    const floatY = useMotionValue(0)
    const floatX = useMotionValue(0)
    const springY = useSpring(floatY, { stiffness: 100, damping: 30 })
    const springX = useSpring(floatX, { stiffness: 100, damping: 30 })

    // Pulse animation based on playing state
    const pulseScale = useMotionValue(1)
    const springPulse = useSpring(pulseScale, { stiffness: 300, damping: 20 })

    // Load playlists from API
    useEffect(() => {
        async function fetchPlaylists() {
            try {
                const res = await fetch('/api/study-playlists')
                if (!res.ok) return
                const data = await res.json()

                if (data.success && data.playlists.length > 0) {
                    console.log('[StudyMusicPlayer] Found playlists:', data.playlists.length)
                    setPlaylists(data.playlists)

                    // Load saved state from localStorage
                    const savedState = localStorage.getItem(STORAGE_KEY)
                    if (savedState) {
                        try {
                            const parsed = JSON.parse(savedState)
                            const savedPlaylist = data.playlists.find(
                                (p: StudyPlaylist) => p._id === parsed.currentPlaylistId
                            )
                            if (savedPlaylist) {
                                setState(prev => ({
                                    ...prev,
                                    volume: parsed.volume ?? 50,
                                    playbackRate: parsed.playbackRate ?? 1,
                                    currentPlaylistId: savedPlaylist._id,
                                    currentPlaylistName: savedPlaylist.name
                                }))
                            } else {
                                // Use random playlist if saved one not found
                                selectRandomPlaylist(data.playlists)
                            }
                        } catch {
                            selectRandomPlaylist(data.playlists)
                        }
                    } else {
                        // First time - select random playlist
                        selectRandomPlaylist(data.playlists)
                    }
                }
            } catch {
                // Silently ignore — network may be unavailable
            } finally {
                setLoading(false)
            }
        }

        fetchPlaylists()
    }, [])

    function selectRandomPlaylist(playlistList: StudyPlaylist[]) {
        const randomIndex = Math.floor(Math.random() * playlistList.length)
        const playlist = playlistList[randomIndex]
        setState(prev => ({
            ...prev,
            currentPlaylistId: playlist._id,
            currentPlaylistName: playlist.name
        }))
    }

    // Save state to localStorage
    useEffect(() => {
        if (state.currentPlaylistId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                currentPlaylistId: state.currentPlaylistId,
                volume: state.volume,
                playbackRate: state.playbackRate
            }))
        }
    }, [state.currentPlaylistId, state.volume, state.playbackRate])

    // Load YouTube API
    useEffect(() => {
        if (apiLoadedRef.current || playlists.length === 0) return

        const existingScript = document.getElementById('youtube-iframe-api')
        if (existingScript) {
            if (window.YT && window.YT.Player) {
                initializePlayer()
            }
            return
        }

        const tag = document.createElement('script')
        tag.id = 'youtube-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        window.onYouTubeIframeAPIReady = () => {
            apiLoadedRef.current = true
            initializePlayer()
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy()
            }
        }
    }, [playlists])

    const initializePlayer = useCallback(() => {
        const playlist = playlists.find(p => p._id === state.currentPlaylistId)
        if (!playlist || !window.YT) return

        if (playerRef.current) {
            playerRef.current.destroy()
        }

        playerRef.current = new window.YT.Player('youtube-player-hidden', {
            height: '0',
            width: '0',
            playerVars: {
                listType: 'playlist',
                list: playlist.youtubePlaylistId,
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0
            },
            events: {
                onReady: (event) => {
                    setPlayerReady(true)
                    // Apply logarithmic volume curve for better low-volume control
                    const logVolume = Math.floor(Math.pow(state.volume / 100, 2.5) * 100)
                    event.target.setVolume(logVolume)
                    event.target.setPlaybackRate(state.playbackRate)
                },
                onStateChange: (event) => {
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        setState(prev => ({ ...prev, isPlaying: true }))
                        setIsBuffering(false)
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        setState(prev => ({ ...prev, isPlaying: false }))
                    } else if (event.data === window.YT.PlayerState.BUFFERING) {
                        setIsBuffering(true)
                    } else if (event.data === window.YT.PlayerState.ENDED) {
                        // Playlist ended - loop
                        playerRef.current?.playVideo()
                    }
                },
                onError: (event) => {
                    console.error('YouTube player error:', event.data)
                    // Skip to next video on error
                    playerRef.current?.nextVideo()
                }
            }
        })
    }, [playlists, state.currentPlaylistId, state.volume, state.playbackRate])

    useEffect(() => {
        if (playerReady && state.currentPlaylistId) {
            const playlist = playlists.find(p => p._id === state.currentPlaylistId)
            if (playlist && playerRef.current) {
                playerRef.current.loadPlaylist({
                    list: playlist.youtubePlaylistId,
                    listType: 'playlist'
                })
                playerRef.current.pauseVideo()
            }
        }
    }, [state.currentPlaylistId, playerReady, playlists])

    // Floating animation
    useEffect(() => {
        if (!isExpanded) {
            const interval = setInterval(() => {
                floatY.set(Math.sin(Date.now() / 2000) * 3)
                floatX.set(Math.cos(Date.now() / 3000) * 2)
            }, 50)
            return () => clearInterval(interval)
        }
    }, [isExpanded, floatY, floatX])

    // Subtle pulse when playing
    useEffect(() => {
        if (state.isPlaying && !isExpanded) {
            const interval = setInterval(() => {
                pulseScale.set(1 + Math.sin(Date.now() / 800) * 0.02)
            }, 50)
            return () => clearInterval(interval)
        } else {
            pulseScale.set(1)
        }
    }, [state.isPlaying, isExpanded, pulseScale])

    const handlePlayPause = () => {
        if (!playerRef.current) return

        if (state.isPlaying) {
            playerRef.current.pauseVideo()
        } else {
            playerRef.current.playVideo()
        }
    }

    const handleVolumeChange = (value: number) => {
        setState(prev => ({ ...prev, volume: value }))
        if (playerRef.current) {
            // Apply logarithmic volume curve: (val/100)^2.5 * 100
            // This gives much more precision at lower volumes which is better for background music
            const logVolume = Math.floor(Math.pow(value / 100, 2.5) * 100)
            playerRef.current.setVolume(logVolume)
        }
    }

    const [showSpeedPicker, setShowSpeedPicker] = useState(false)
    const isExamResolver = /^\/exams?\/[^/]+$/.test(pathname || '')

    const handlePlaybackRateChange = (rate: PlaybackRate) => {
        setState(prev => ({ ...prev, playbackRate: rate }))
        if (playerRef.current) {
            playerRef.current.setPlaybackRate(rate)
        }
        setShowSpeedPicker(false)
    }

    const handleNextTrack = () => {
        if (!playerRef.current) return
        playerRef.current.nextVideo()
    }

    const handlePrevTrack = () => {
        if (!playerRef.current) return
        playerRef.current.previousVideo()
    }

    const handlePlaylistChange = (playlist: StudyPlaylist) => {
        setState(prev => ({
            ...prev,
            currentPlaylistId: playlist._id,
            currentPlaylistName: playlist.name,
            isPlaying: false
        }))
        setShowPlaylistSelector(false)

        if (playerRef.current) {
            playerRef.current.cuePlaylist({
                list: playlist.youtubePlaylistId,
                listType: 'playlist'
            })
        }
    }

    const toggleExpand = () => {
        if (isExpanded) dock?.close()
        else dock?.open('music')
        setShowPlaylistSelector(false)
        setShowVolumeSlider(false)
        setShowSpeedPicker(false)
    }

    // Só renderiza quando hidratado, autenticado e com playlists disponíveis.
    const shouldRender = hydrated && !authLoading && isAuthenticated && !loading && playlists.length > 0

    // Registra a ação "Música" no dock flutuante (mobile). `active` reflete se
    // está tocando, para o dock exibir o indicador pulsante.
    const register = dock?.register
    const unregister = dock?.unregister
    useEffect(() => {
        if (!register || !unregister || !shouldRender) return
        register({ id: 'music', label: 'Música', order: 0, active: state.isPlaying })
        return () => unregister('music')
    }, [register, unregister, shouldRender, state.isPlaying])

    if (!shouldRender) return null

    return (
        <>
            {/* Hidden YouTube Player */}
            <div id="youtube-player-hidden" className="hidden absolute -z-50 pointer-events-none" />

            {/* Floating Player Widget */}
            <motion.div
                ref={containerRef}
                className="fixed z-40"
                style={{
                    right: isExamResolver ? 'auto' : 24,
                    left: isExamResolver ? 16 : 'auto',
                    bottom: isExamResolver ? 20 : 96, // Above the support chat button outside the exam resolver
                    x: springX,
                    y: springY
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.5
                }}
            >
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        /* Expanded State */
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative"
                        >
                            {/* Glassmorphism Container - Ultra Premium */}
                            <div
                                className="relative w-72 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                                    backdropFilter: 'blur(60px) saturate(200%)',
                                    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                                    boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 16px 64px rgba(0, 0, 0, 0.2),
                    0 0 0 1px rgba(255, 255, 255, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `
                                }}
                            >
                                {/* Primary Glass Reflection Effect */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
                                        borderRadius: 'inherit'
                                    }}
                                />

                                {/* Secondary Shimmer Effect */}
                                <div
                                    className="absolute inset-0 pointer-events-none opacity-50"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                        borderRadius: 'inherit'
                                    }}
                                />

                                {/* Content */}
                                <div className="relative p-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
                                                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                                                }}
                                            >
                                                <Music className="w-5 h-5 text-violet-300" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium">
                                                    Foco Musical
                                                </p>
                                                <p className="text-sm font-medium text-white/90 truncate max-w-[140px]">
                                                    {state.currentPlaylistName}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={toggleExpand}
                                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white/90"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Visualizer Placeholder - Organic Shape */}
                                    <div className="relative h-16 mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-white/5">
                                        <div className="flex items-end gap-1 h-10">
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 rounded-full"
                                                    style={{
                                                        background: `linear-gradient(180deg, rgba(139, 92, 246, ${0.5 + i * 0.04}) 0%, rgba(168, 85, 247, ${0.3 + i * 0.02}) 100%)`
                                                    }}
                                                    animate={{
                                                        height: state.isPlaying
                                                            ? [8, 20 + Math.random() * 20, 8]
                                                            : 8
                                                    }}
                                                    transition={{
                                                        duration: 0.5 + Math.random() * 0.3,
                                                        repeat: Infinity,
                                                        repeatType: 'reverse',
                                                        delay: i * 0.05
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main Controls */}
                                    <div className="flex items-center justify-center gap-4 mb-4">
                                        {/* Volume Control */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 active:bg-white/30 transition-colors duration-200 text-white/70 hover:text-white"
                                            >
                                                {state.volume === 0 ? (
                                                    <VolumeX className="w-5 h-5" />
                                                ) : (
                                                    <Volume2 className="w-5 h-5" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {showVolumeSlider && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute bottom-14 left-1/2 -translate-x-1/2 p-3 rounded-2xl"
                                                        style={{
                                                            background: 'rgba(20, 20, 25, 0.8)',
                                                            backdropFilter: 'blur(20px)',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={state.volume}
                                                            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                                                            className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
                                                            style={{
                                                                background: `linear-gradient(to right, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.8) ${state.volume}%, rgba(255,255,255,0.1) ${state.volume}%, rgba(255,255,255,0.1) 100%)`,
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Play/Pause Button */}
                                        <div className="flex items-center gap-3">
                                            {/* Previous Track Button */}
                                            <button
                                                onClick={handlePrevTrack}
                                                disabled={!playerReady}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 active:bg-white/30 transition-colors duration-200 text-white/70 hover:text-white disabled:opacity-30"
                                                title="Música anterior"
                                            >
                                                <SkipBack className="w-5 h-5" />
                                            </button>

                                            <button
                                                onClick={handlePlayPause}
                                                disabled={!playerReady}
                                                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:scale-100"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
                                                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                {isBuffering ? (
                                                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                                                ) : state.isPlaying ? (
                                                    <Pause className="w-7 h-7 text-white" fill="white" />
                                                ) : (
                                                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                                )}
                                            </button>

                                            {/* Next Track Button */}
                                            <button
                                                onClick={handleNextTrack}
                                                disabled={!playerReady}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 active:bg-white/30 transition-colors duration-200 text-white/70 hover:text-white disabled:opacity-30"
                                                title="Próxima música"
                                            >
                                                <SkipForward className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Playback Rate */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSpeedPicker(!showSpeedPicker)}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 active:bg-white/30 transition-colors duration-200 text-white/70 hover:text-white"
                                                title="Velocidade de reprodução"
                                            >
                                                <motion.span
                                                    key={state.playbackRate}
                                                    initial={{ scale: 0.6, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="text-xs font-bold"
                                                >
                                                    {state.playbackRate === 1 ? '1x' : `${state.playbackRate}x`}
                                                </motion.span>
                                            </button>

                                            <AnimatePresence>
                                                {showSpeedPicker && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                        className="absolute bottom-14 left-1/2 -translate-x-1/2 p-2 rounded-2xl"
                                                        style={{
                                                            background: 'rgba(20, 20, 25, 0.85)',
                                                            backdropFilter: 'blur(24px)',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        <div className="flex flex-col gap-0.5 min-w-[52px]">
                                                            {PLAYBACK_RATES.map((rate) => (
                                                                <button
                                                                    key={rate}
                                                                    onClick={() => handlePlaybackRateChange(rate)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                                                        state.playbackRate === rate
                                                                            ? 'bg-violet-500/30 text-violet-200'
                                                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                                                    }`}
                                                                >
                                                                    {rate}x
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Playlist Selector */}
                                    <button
                                        onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                                        className="w-full py-3 px-4 rounded-xl flex items-center justify-between bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors duration-200 group border border-white/5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ListMusic className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                                            <span className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
                                                Trocar playlist
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`w-4 h-4 text-white/50 transition-transform duration-300 ${showPlaylistSelector ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {showPlaylistSelector && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                                    {playlists.map((playlist) => (
                                                        <button
                                                            key={playlist._id}
                                                            onClick={() => handlePlaylistChange(playlist)}
                                                            className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-between text-left transition-colors duration-200 ${state.currentPlaylistId === playlist._id
                                                                ? 'bg-violet-500/20 text-violet-200'
                                                                : 'hover:bg-white/10 text-white/70 hover:text-white'
                                                                }`}
                                                        >
                                                            <span className="text-sm font-medium truncate">{playlist.name}</span>
                                                            {state.currentPlaylistId === playlist._id && (
                                                                <Check className="w-4 h-4 flex-shrink-0 text-violet-400" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Minimized State - Floating Orb */
                        <motion.button
                            key="minimized"
                            onClick={toggleExpand}
                            className="relative group hidden lg:block"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ scale: springPulse }}
                        >
                            {/* Glow Effect */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: state.isPlaying
                                        ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)'
                                        : 'transparent',
                                    filter: 'blur(12px)',
                                    transform: 'scale(1.5)'
                                }}
                                animate={{
                                    opacity: state.isPlaying ? [0.5, 0.8, 0.5] : 0
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                            />

                            {/* Main Orb - Ultra Glass */}
                            <div
                                className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                                    backdropFilter: 'blur(30px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                                    boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 4px 12px rgba(0,0,0,0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
                    ${state.isPlaying ? '0 0 30px rgba(139, 92, 246, 0.4)' : '0 0 0 transparent'}
                  `
                                }}
                            >
                                {/* Reflection */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 45%)',
                                        borderRadius: '50%'
                                    }}
                                />

                                {/* Bottom Inner Light */}
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 pointer-events-none opacity-30"
                                    style={{
                                        background: 'radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.6) 0%, transparent 70%)',
                                        filter: 'blur(5px)'
                                    }}
                                />

                                {/* Icon */}
                                <div className="relative z-10 drop-shadow-md">
                                    {isBuffering ? (
                                        <Loader2 className="w-6 h-6 text-white/90 animate-spin" />
                                    ) : state.isPlaying ? (
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <Music className="w-6 h-6 text-violet-300" />
                                        </motion.div>
                                    ) : (
                                        <Music className="w-6 h-6 text-white/80" />
                                    )}
                                </div>
                            </div>

                            {/* Hover Tooltip */}
                            <motion.div
                                className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    backdropFilter: 'blur(10px)',
                                    fontSize: '11px',
                                    color: 'rgba(255, 255, 255, 0.8)'
                                }}
                                initial={{ opacity: 0, y: 5 }}
                                whileHover={{ opacity: 1, y: 0 }}
                            >
                                {state.isPlaying ? 'Tocando...' : 'Músicas para Foco'}
                            </motion.div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        
        /* Volume slider custom styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
        </>
    )
}

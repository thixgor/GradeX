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
    SkipForward
} from 'lucide-react'

interface StudyPlaylist {
    _id: string
    name: string
    youtubePlaylistId: string
}

interface PlayerState {
    isExpanded: boolean
    isPlaying: boolean
    volume: number
    playbackRate: 1 | 2
    currentPlaylistId: string | null
    currentPlaylistName: string
}

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
    const [playlists, setPlaylists] = useState<StudyPlaylist[]>([])
    const [loading, setLoading] = useState(true)
    const [playerReady, setPlayerReady] = useState(false)
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)

    const [state, setState] = useState<PlayerState>({
        isExpanded: false,
        isPlaying: false,
        volume: 50,
        playbackRate: 1,
        currentPlaylistId: null,
        currentPlaylistName: ''
    })

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
                console.log('[StudyMusicPlayer] Fetching playlists...')
                const res = await fetch('/api/study-playlists')
                const data = await res.json()
                console.log('[StudyMusicPlayer] API Response:', data)

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
                } else {
                    console.log('[StudyMusicPlayer] No playlists found or API error')
                }
            } catch (error) {
                console.error('[StudyMusicPlayer] Error loading playlists:', error)
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
                    event.target.setVolume(state.volume)
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
                playerRef.current.cuePlaylist({
                    list: playlist.youtubePlaylistId,
                    listType: 'playlist'
                })
            }
        }
    }, [state.currentPlaylistId, playerReady, playlists])

    // Floating animation
    useEffect(() => {
        if (!state.isExpanded) {
            const interval = setInterval(() => {
                floatY.set(Math.sin(Date.now() / 2000) * 3)
                floatX.set(Math.cos(Date.now() / 3000) * 2)
            }, 50)
            return () => clearInterval(interval)
        }
    }, [state.isExpanded, floatY, floatX])

    // Subtle pulse when playing
    useEffect(() => {
        if (state.isPlaying && !state.isExpanded) {
            const interval = setInterval(() => {
                pulseScale.set(1 + Math.sin(Date.now() / 800) * 0.02)
            }, 50)
            return () => clearInterval(interval)
        } else {
            pulseScale.set(1)
        }
    }, [state.isPlaying, state.isExpanded, pulseScale])

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
            playerRef.current.setVolume(value)
        }
    }

    const handlePlaybackRateChange = () => {
        const newRate = state.playbackRate === 1 ? 2 : 1
        setState(prev => ({ ...prev, playbackRate: newRate as 1 | 2 }))
        if (playerRef.current) {
            playerRef.current.setPlaybackRate(newRate)
        }
    }

    const handleNextTrack = () => {
        if (!playerRef.current) return
        playerRef.current.nextVideo()
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
        setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }))
        setShowPlaylistSelector(false)
        setShowVolumeSlider(false)
    }

    // Don't render if no playlists
    console.log('[StudyMusicPlayer] Render check - loading:', loading, 'playlists:', playlists.length)
    if (loading) {
        console.log('[StudyMusicPlayer] Still loading, not rendering')
        return null
    }
    if (playlists.length === 0) {
        console.log('[StudyMusicPlayer] No playlists, not rendering')
        return null
    }

    console.log('[StudyMusicPlayer] Rendering player widget')

    return (
        <>
            {/* Hidden YouTube Player */}
            <div id="youtube-player-hidden" className="hidden absolute -z-50 pointer-events-none" />

            {/* Floating Player Widget */}
            <motion.div
                ref={containerRef}
                className="fixed z-40"
                style={{
                    right: 24,
                    bottom: 96, // Above the support chat button
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
                    {state.isExpanded ? (
                        /* Expanded State */
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative"
                        >
                            {/* Glassmorphism Container */}
                            <div
                                className="relative w-72 rounded-3xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    backdropFilter: 'blur(40px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                    boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                  `
                                }}
                            >
                                {/* Glass Reflection Effect */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%)',
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
                                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/70 hover:text-white"
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
                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                            backdropFilter: 'blur(20px)',
                                                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
                                                                background: `linear-gradient(to right, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.8) ${state.volume}%, rgba(255,255,255,0.2) ${state.volume}%, rgba(255,255,255,0.2) 100%)`,
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Play/Pause Button */}
                                        <button
                                            onClick={handlePlayPause}
                                            disabled={!playerReady}
                                            className="w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)',
                                                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            {isBuffering ? (
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            ) : state.isPlaying ? (
                                                <Pause className="w-6 h-6 text-white" fill="white" />
                                            ) : (
                                                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                                            )}
                                        </button>

                                        {/* Next Track Button */}
                                        <button
                                            onClick={handleNextTrack}
                                            disabled={!playerReady}
                                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/70 hover:text-white disabled:opacity-50"
                                            title="Próxima música"
                                        >
                                            <SkipForward className="w-5 h-5" />
                                        </button>

                                        {/* Playback Rate */}
                                        <button
                                            onClick={handlePlaybackRateChange}
                                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/70 hover:text-white"
                                        >
                                            <span className="text-xs font-bold">{state.playbackRate}x</span>
                                        </button>
                                    </div>

                                    {/* Playlist Selector */}
                                    <button
                                        onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                                        className="w-full py-2.5 px-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ListMusic className="w-4 h-4 text-white/50 group-hover:text-white/70" />
                                            <span className="text-sm text-white/70 group-hover:text-white/90">
                                                Trocar playlist
                                            </span>
                                        </div>
                                        <ChevronDown
                                            className={`w-4 h-4 text-white/50 transition-transform ${showPlaylistSelector ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {showPlaylistSelector && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                    {playlists.map((playlist) => (
                                                        <button
                                                            key={playlist._id}
                                                            onClick={() => handlePlaylistChange(playlist)}
                                                            className={`w-full py-2 px-3 rounded-lg flex items-center justify-between text-left transition-colors ${state.currentPlaylistId === playlist._id
                                                                ? 'bg-violet-500/20 text-violet-300'
                                                                : 'hover:bg-white/5 text-white/70 hover:text-white/90'
                                                                }`}
                                                        >
                                                            <span className="text-sm truncate">{playlist.name}</span>
                                                            {state.currentPlaylistId === playlist._id && (
                                                                <Check className="w-4 h-4 flex-shrink-0" />
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
                            className="relative group"
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

                            {/* Main Orb */}
                            <div
                                className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                                    backdropFilter: 'blur(40px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                    boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.1),
                    ${state.isPlaying ? '0 0 20px rgba(139, 92, 246, 0.3)' : '0 0 0 transparent'}
                  `
                                }}
                            >
                                {/* Inner Gradient */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                        borderRadius: '50%'
                                    }}
                                />

                                {/* Animated Ring when playing */}
                                {state.isPlaying && (
                                    <motion.div
                                        className="absolute inset-1 rounded-full border-2 border-violet-400/30"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.3, 0.5, 0.3]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <div className="relative z-10">
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

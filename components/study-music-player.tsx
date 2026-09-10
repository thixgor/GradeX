'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
    Play,
    Pause,
    Volume2,
    Volume1,
    VolumeX,
    ListMusic,
    ChevronDown,
    Check,
    Music,
    Loader2,
    SkipForward,
    SkipBack,
    AlertCircle,
    RotateCcw,
    X,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useFloatingDock } from '@/context/FloatingDockContext'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { cn } from '@/lib/utils'
import {
    carregarYouTubeIframeApi,
    YT_STATE,
    type YouTubePlayer,
} from '@/lib/youtube-iframe-api'
import { chaveDoItem } from '@/lib/musica/link-do-youtube'

/**
 * Player de música ambiente para estudo.
 *
 * Regras que este componente leva a sério (foram todas bug de produção):
 *
 * 1. NUNCA toca sozinho. Som só sai depois de a pessoa apertar play. Nada de
 *    `autoplay`, e trocar de playlist usa `cuePlaylist` (que carrega sem
 *    tocar) em vez de `loadPlaylist` (que toca na hora). A versão anterior
 *    chamava `loadPlaylist` + `pauseVideo` logo no carregamento da página —
 *    uma corrida que, quando o `pause` perdia, dava um susto em quem entrava.
 *
 * 2. O iframe não pode ficar em `display:none`. No Safari/iOS (iPhone, iPad)
 *    mídia dentro de um nó não renderizado não toca. O iframe vive num
 *    quadrado de 1px transparente, dentro da viewport.
 *
 * 3. `playVideo()` só é chamado de dentro do gesto da pessoa (o toque no
 *    play). É o que o iOS exige — fora do gesto ele ignora silenciosamente.
 *
 * 4. Nada de "carregando" eterno. Se a API não vem, se o iframe morre ou se o
 *    play não pega em alguns segundos, o componente mostra o erro e um botão
 *    de tentar de novo, em vez de deixar os controles desabilitados.
 */

/** Uma entrada do catálogo: playlist inteira ou faixa avulsa (o painel aceita
 *  as duas — ver lib/musica/link-do-youtube.ts). */
interface StudyPlaylist {
    _id: string
    name: string
    youtubePlaylistId?: string | null
    youtubeVideoId?: string | null
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const
type PlaybackRate = (typeof PLAYBACK_RATES)[number]

type PlayerStatus = 'ocioso' | 'carregando' | 'pronto' | 'erro'

const STORAGE_KEY = 'study-music-player-state'

/** Quanto tempo esperamos o play "pegar" antes de assumir que travou. */
const WATCHDOG_MS = 6000
/** Erros seguidos de faixa (vídeo removido/bloqueado) antes de desistir. */
const MAX_ERROS_SEGUIDOS = 5

interface PreferenciasSalvas {
    currentPlaylistId: string | null
    volume: number
    muted: boolean
    playbackRate: PlaybackRate
}

const PREFERENCIAS_PADRAO: PreferenciasSalvas = {
    currentPlaylistId: null,
    volume: 45,
    muted: false,
    playbackRate: 1,
}

function lerPreferencias(): PreferenciasSalvas {
    if (typeof window === 'undefined') return PREFERENCIAS_PADRAO
    try {
        const bruto = window.localStorage.getItem(STORAGE_KEY)
        if (!bruto) return PREFERENCIAS_PADRAO
        const salvo = JSON.parse(bruto) as Partial<PreferenciasSalvas>
        const volume =
            typeof salvo.volume === 'number' && Number.isFinite(salvo.volume)
                ? Math.min(100, Math.max(0, Math.round(salvo.volume)))
                : PREFERENCIAS_PADRAO.volume
        const rate = PLAYBACK_RATES.includes(salvo.playbackRate as PlaybackRate)
            ? (salvo.playbackRate as PlaybackRate)
            : 1
        return {
            currentPlaylistId: salvo.currentPlaylistId ?? null,
            volume,
            muted: salvo.muted === true,
            playbackRate: rate,
        }
    } catch {
        return PREFERENCIAS_PADRAO
    }
}

/**
 * Curva de volume percebido. O ouvido humano é logarítmico: no controle linear
 * do YouTube, tudo entre 30 e 100 soa "alto" e a faixa útil de música de fundo
 * fica espremida nos primeiros passos. Elevar a fração à 2.2 devolve precisão
 * justamente onde a pessoa quer mexer.
 */
function volumeParaYouTube(volume: number): number {
    const fracao = Math.min(1, Math.max(0, volume / 100))
    return Math.round(Math.pow(fracao, 2.2) * 100)
}

/** Alturas fixas do visualizador. Antes eram sorteadas a cada render — o que
 *  reiniciava as doze animações a cada mudança de estado (e a cada tique do
 *  volume), gerando trepidação e trabalho de layout sem necessidade. */
const BARRAS = [42, 68, 30, 86, 54, 74, 38, 92, 48, 64, 34, 78]

function prefereMenosMovimento(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StudyMusicPlayer() {
    const pathname = usePathname()
    const { isAuthenticated, loading: authLoading } = useAuthUser()
    const dock = useFloatingDock()
    const { liteMode } = useLiteMode()

    // Expansão controlada pelo dock compartilhado (um painel por vez; no mobile
    // o player é aberto pelo FAB consolidado em vez de um orbe solto na tela).
    const isExpanded = dock?.activePanel === 'music'

    const [playlists, setPlaylists] = useState<StudyPlaylist[]>([])
    const [carregandoPlaylists, setCarregandoPlaylists] = useState(true)
    const [hydrated, setHydrated] = useState(false)

    const [status, setStatus] = useState<PlayerStatus>('ocioso')
    const [isPlaying, setIsPlaying] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)

    const [preferencias, setPreferencias] = useState<PreferenciasSalvas>(PREFERENCIAS_PADRAO)
    const [playlistId, setPlaylistId] = useState<string | null>(null)

    const [mostrarPlaylists, setMostrarPlaylists] = useState(false)
    const [mostrarVelocidade, setMostrarVelocidade] = useState(false)

    const hostRef = useRef<HTMLDivElement | null>(null)
    const playerRef = useRef<YouTubePlayer | null>(null)
    const criandoRef = useRef(false)
    const desmontadoRef = useRef(false)
    const querTocarRef = useRef(false)
    const tocandoRef = useRef(false)
    const errosSeguidosRef = useRef(0)
    const recriacoesRef = useRef(0)
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const listaCarregadaRef = useRef<string | null>(null)
    const painelRef = useRef<HTMLDivElement | null>(null)

    // Espelhos para uso dentro de callbacks do YouTube (que vivem fora do
    // ciclo de render e enxergariam valores congelados).
    const preferenciasRef = useRef(preferencias)
    preferenciasRef.current = preferencias
    tocandoRef.current = isPlaying

    const playlistAtual = useMemo(
        () => playlists.find((p) => p._id === playlistId) ?? null,
        [playlists, playlistId],
    )
    const playlistAtualRef = useRef<StudyPlaylist | null>(null)
    playlistAtualRef.current = playlistAtual

    const semMovimento = liteMode || (hydrated && prefereMenosMovimento())

    useEffect(() => {
        // Reposto a cada montagem de propósito: no StrictMode do desenvolvimento
        // os efeitos rodam montar → limpar → montar, e uma flag que só é ligada
        // na limpeza deixaria o player morto para sempre na segunda montagem.
        desmontadoRef.current = false
        setHydrated(true)
        setPreferencias(lerPreferencias())
    }, [])

    // ── Catálogo ─────────────────────────────────────────────────────────
    const buscarPlaylists = useCallback(async (signal?: AbortSignal) => {
        try {
            // `no-store`: a rota já é dinâmica, mas sem isto o cache do próprio
            // navegador ainda serviria a lista antiga depois de um cadastro
            // novo no painel.
            const res = await fetch('/api/study-playlists', { signal, cache: 'no-store' })
            if (!res.ok) return
            const data = await res.json()
            if (signal?.aborted || !data?.success || !Array.isArray(data.playlists)) return

            // Um registro sem playlist nem vídeo (documento antigo) montaria
            // um iframe vazio e ficaria "carregando" para sempre.
            const lista = (data.playlists as StudyPlaylist[]).filter((p) => chaveDoItem(p))
            setPlaylists(lista)
            if (lista.length === 0) return

            setPlaylistId((atual) => {
                // Numa reconsulta, respeita o que já está tocando.
                if (atual && lista.some((p) => p._id === atual)) return atual
                const salvas = lerPreferencias()
                const preferida = lista.find((p) => p._id === salvas.currentPlaylistId)
                // Sem preferência salva, sorteia uma — mas apenas escolhe,
                // nunca inicia a reprodução.
                return preferida?._id ?? lista[Math.floor(Math.random() * lista.length)]._id
            })
        } catch {
            // Rede indisponível: o player simplesmente não aparece.
        } finally {
            if (!signal?.aborted) setCarregandoPlaylists(false)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        buscarPlaylists(controller.signal)
        return () => controller.abort()
    }, [buscarPlaylists])

    // Reconsulta ao abrir o painel: sem isto, uma playlist cadastrada agora só
    // aparecia para quem recarregasse a página. É um gesto da pessoa, então
    // não há custo de rede em segundo plano.
    useEffect(() => {
        if (!isExpanded) return
        buscarPlaylists()
    }, [isExpanded, buscarPlaylists])

    // ── Persistência (debounce: o slider de volume dispara dezenas de
    //    eventos por segundo e cada gravação síncrona travava a UI) ────────
    useEffect(() => {
        if (!hydrated || !playlistId) return
        const id = setTimeout(() => {
            try {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ ...preferenciasRef.current, currentPlaylistId: playlistId }),
                )
            } catch {
                /* modo privado / cota cheia */
            }
        }, 400)
        return () => clearTimeout(id)
    }, [hydrated, playlistId, preferencias])

    // ── Ciclo de vida do player ──────────────────────────────────────────
    const limparWatchdog = useCallback(() => {
        if (watchdogRef.current) {
            clearTimeout(watchdogRef.current)
            watchdogRef.current = null
        }
    }, [])

    const aplicarPreferencias = useCallback((player: YouTubePlayer) => {
        const { volume, muted, playbackRate } = preferenciasRef.current
        try {
            player.setVolume(volumeParaYouTube(volume))
            if (muted) player.mute()
            else player.unMute()
            player.setPlaybackRate(playbackRate)
        } catch {
            /* o iframe pode ter sumido entre o evento e a chamada */
        }
    }, [])

    const destruirPlayer = useCallback(() => {
        limparWatchdog()
        const player = playerRef.current
        playerRef.current = null
        listaCarregadaRef.current = null
        try {
            player?.destroy()
        } catch {
            /* já destruído */
        }
        if (hostRef.current) hostRef.current.innerHTML = ''
    }, [limparWatchdog])

    const criarPlayer = useCallback(async () => {
        if (criandoRef.current || playerRef.current) return
        const host = hostRef.current
        const playlist = playlistAtualRef.current
        if (!host || !playlist) return

        criandoRef.current = true
        setStatus('carregando')
        setAviso(null)

        let api
        try {
            api = await carregarYouTubeIframeApi()
        } catch {
            criandoRef.current = false
            if (desmontadoRef.current) return
            setStatus('erro')
            setIsBuffering(false)
            querTocarRef.current = false
            // A causa quase sempre é um bloqueador de anúncios derrubando o
            // script do YouTube — vale dizer, senão a pessoa fica tentando.
            setAviso(
                'Não foi possível carregar o player do YouTube. Se você usa bloqueador de anúncios, libere youtube.com neste site.',
            )
            return
        }

        if (desmontadoRef.current || playerRef.current) {
            criandoRef.current = false
            return
        }

        // A playlist pode ter mudado durante a espera pela API — sempre vale a
        // seleção atual, não a que existia quando esta chamada começou.
        const playlistFinal = playlistAtualRef.current ?? playlist

        // O YouTube SUBSTITUI o nó que recebe pelo iframe. Por isso criamos um
        // alvo descartável a cada tentativa — reaproveitar o mesmo id é o que
        // fazia a segunda inicialização (após um erro) nunca acontecer.
        host.innerHTML = ''
        const alvo = document.createElement('div')
        host.appendChild(alvo)

        try {
            playerRef.current = new api.Player(alvo, {
                width: '1',
                height: '1',
                // Domínio sem cookies: corta a maior parte das chamadas de
                // telemetria (`log_event`, `ptracking`) que os bloqueadores de
                // anúncio derrubam com ERR_BLOCKED_BY_CLIENT no console. Elas
                // nunca impediram a música de tocar — mas enchiam o log.
                host: 'https://www.youtube-nocookie.com',
                videoId: playlistFinal.youtubeVideoId || undefined,
                playerVars: {
                    ...(playlistFinal.youtubePlaylistId
                        ? { listType: 'playlist', list: playlistFinal.youtubePlaylistId }
                        : {}),
                    // Nunca começar tocando sozinho.
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    // Essencial no iPhone/iPad: sem isto o iOS tenta abrir o
                    // vídeo em tela cheia e a reprodução falha silenciosamente.
                    playsinline: 1,
                    rel: 0,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event) => {
                        if (desmontadoRef.current) return
                        listaCarregadaRef.current = chaveDoItem(playlistFinal)
                        setStatus('pronto')
                        aplicarPreferencias(event.target)
                        if (querTocarRef.current) {
                            querTocarRef.current = false
                            try {
                                event.target.playVideo()
                            } catch {
                                /* ignorado: o watchdog cobre */
                            }
                        }
                    },
                    onStateChange: (event) => {
                        if (desmontadoRef.current) return
                        switch (event.data) {
                            case YT_STATE.PLAYING:
                                errosSeguidosRef.current = 0
                                recriacoesRef.current = 0
                                limparWatchdog()
                                setAviso(null)
                                setIsBuffering(false)
                                setIsPlaying(true)
                                break
                            case YT_STATE.BUFFERING:
                                setIsBuffering(true)
                                break
                            case YT_STATE.PAUSED:
                                limparWatchdog()
                                setIsBuffering(false)
                                setIsPlaying(false)
                                break
                            case YT_STATE.ENDED:
                                setIsBuffering(false)
                                // Fim da playlist: recomeça, mas só porque a
                                // pessoa já estava ouvindo (segue valendo o
                                // gesto original — o iOS aceita).
                                if (tocandoRef.current) {
                                    try {
                                        event.target.playVideo()
                                    } catch {
                                        setIsPlaying(false)
                                    }
                                } else {
                                    setIsPlaying(false)
                                }
                                break
                            default:
                                setIsBuffering(false)
                                setIsPlaying(false)
                        }
                    },
                    onError: (event) => {
                        if (desmontadoRef.current) return
                        errosSeguidosRef.current += 1
                        if (errosSeguidosRef.current > MAX_ERROS_SEGUIDOS) {
                            limparWatchdog()
                            setIsBuffering(false)
                            setIsPlaying(false)
                            setStatus('erro')
                            setAviso('Esta playlist não está disponível agora.')
                            return
                        }
                        // Faixa removida ou bloqueada para embed: pula.
                        try {
                            event.target.nextVideo()
                        } catch {
                            /* ignorado */
                        }
                    },
                },
            })
        } catch {
            setStatus('erro')
            setAviso('Não foi possível iniciar o player.')
            querTocarRef.current = false
            setIsBuffering(false)
        } finally {
            criandoRef.current = false
        }
    }, [aplicarPreferencias, limparWatchdog])

    // Cria o player assim que houver playlist. Fazer isso cedo (e não no
    // primeiro toque) é o que permite ao `playVideo()` rodar dentro do gesto
    // no iOS — quando a pessoa toca no play, o iframe já existe.
    useEffect(() => {
        if (!playlistAtual) return
        if (!playerRef.current) {
            void criarPlayer()
            return
        }
        // Trocou de seleção com o player já vivo.
        const chave = chaveDoItem(playlistAtual)
        if (!chave || listaCarregadaRef.current === chave) return
        listaCarregadaRef.current = chave
        errosSeguidosRef.current = 0
        try {
            // `cue*` carrega sem tocar; `load*` toca na hora. Só usamos o
            // segundo se a pessoa JÁ estava ouvindo — é o que garante que
            // nenhuma troca de faixa vire som inesperado.
            const tocando = tocandoRef.current
            if (playlistAtual.youtubePlaylistId) {
                const alvo = {
                    list: playlistAtual.youtubePlaylistId,
                    listType: 'playlist' as const,
                }
                if (tocando) playerRef.current.loadPlaylist(alvo)
                else playerRef.current.cuePlaylist(alvo)
            } else if (playlistAtual.youtubeVideoId) {
                if (tocando) playerRef.current.loadVideoById(playlistAtual.youtubeVideoId)
                else playerRef.current.cueVideoById(playlistAtual.youtubeVideoId)
            }
            aplicarPreferencias(playerRef.current)
        } catch {
            destruirPlayer()
            void criarPlayer()
        }
    }, [playlistAtual, criarPlayer, aplicarPreferencias, destruirPlayer])

    useEffect(() => {
        return () => {
            desmontadoRef.current = true
            destruirPlayer()
        }
    }, [destruirPlayer])

    // Reconcilia o estado real do iframe com a UI. O iOS pausa mídia por conta
    // própria (ligação, outro app, aba em segundo plano) e nem sempre manda o
    // evento — sem isto o botão continuava mostrando "pause" com tudo mudo.
    useEffect(() => {
        if (!isPlaying && !isBuffering) return
        const sincronizar = () => {
            const player = playerRef.current
            if (!player) return
            try {
                const estado = player.getPlayerState()
                const rodando = estado === YT_STATE.PLAYING || estado === YT_STATE.BUFFERING
                setIsPlaying(estado === YT_STATE.PLAYING)
                // Com o watchdog armado ainda estamos dentro da janela de
                // espera do play; apagar o "carregando…" aqui faria o botão
                // piscar de volta para ▶ com o som prestes a entrar.
                if (!rodando && !watchdogRef.current) setIsBuffering(false)
            } catch {
                /* iframe indisponível no momento */
            }
        }
        const id = setInterval(sincronizar, 3000)
        document.addEventListener('visibilitychange', sincronizar)
        return () => {
            clearInterval(id)
            document.removeEventListener('visibilitychange', sincronizar)
        }
    }, [isPlaying, isBuffering])

    // ── Ações ────────────────────────────────────────────────────────────
    const armarWatchdog = useCallback(() => {
        limparWatchdog()
        let reArmado = false
        const disparar = () => {
            watchdogRef.current = null
            // Ainda montando o iframe (rede lenta): dá uma segunda janela em vez
            // de derrubar uma criação que está em andamento.
            if (criandoRef.current && !reArmado) {
                reArmado = true
                watchdogRef.current = setTimeout(disparar, WATCHDOG_MS)
                return
            }
            const player = playerRef.current
            let estado: number | null = null
            try {
                estado = player?.getPlayerState() ?? null
            } catch {
                estado = null
            }
            if (estado === YT_STATE.PLAYING || estado === YT_STATE.BUFFERING) return

            setIsBuffering(false)
            setIsPlaying(false)
            querTocarRef.current = false

            // Uma recriação silenciosa por travada: o iframe do YouTube morre
            // sozinho de vez em quando (memória no iOS, aba dormindo). Depois
            // disso, a pessoa fica sabendo em vez de encarar um botão morto.
            if (recriacoesRef.current < 1) {
                recriacoesRef.current += 1
                destruirPlayer()
                void criarPlayer()
                setAviso('Reconectando… toque em play de novo.')
            } else {
                setStatus('erro')
                setAviso('A reprodução não iniciou. Tente de novo.')
            }
        }
        watchdogRef.current = setTimeout(disparar, WATCHDOG_MS)
    }, [criarPlayer, destruirPlayer, limparWatchdog])

    const alternarReproducao = useCallback(() => {
        setAviso(null)
        const player = playerRef.current

        if (!player) {
            // Player ainda não existe (API lenta ou erro anterior): registra a
            // intenção e cria. O `onReady` dá o play.
            querTocarRef.current = true
            setIsBuffering(true)
            armarWatchdog()
            void criarPlayer()
            return
        }

        if (tocandoRef.current) {
            limparWatchdog()
            setIsPlaying(false)
            setIsBuffering(false)
            try {
                player.pauseVideo()
            } catch {
                /* ignorado */
            }
            return
        }

        setIsBuffering(true)
        armarWatchdog()
        try {
            // Chamada SÍNCRONA dentro do gesto — requisito do iOS.
            player.playVideo()
        } catch {
            setIsBuffering(false)
            setStatus('erro')
            setAviso('A reprodução não iniciou. Tente de novo.')
        }
    }, [armarWatchdog, criarPlayer, limparWatchdog])

    const tentarNovamente = useCallback(() => {
        recriacoesRef.current = 0
        errosSeguidosRef.current = 0
        querTocarRef.current = false
        setAviso(null)
        setStatus('carregando')
        destruirPlayer()
        void criarPlayer()
    }, [criarPlayer, destruirPlayer])

    const mudarVolume = useCallback((valor: number) => {
        const volume = Math.min(100, Math.max(0, Math.round(valor)))
        // Mexer no slider tira do mudo: era desconcertante arrastar até 80 e
        // continuar em silêncio porque o botão de mudo estava ligado.
        setPreferencias((prev) => ({ ...prev, volume, muted: volume === 0 }))
        try {
            playerRef.current?.setVolume(volumeParaYouTube(volume))
            if (volume > 0) playerRef.current?.unMute()
            else playerRef.current?.mute()
        } catch {
            /* ignorado */
        }
    }, [])

    const alternarMudo = useCallback(() => {
        const muted = !(preferenciasRef.current.muted || preferenciasRef.current.volume === 0)
        setPreferencias((prev) => ({
            ...prev,
            muted,
            // Sair do mudo com o volume zerado não devolveria som nenhum.
            volume: !muted && prev.volume === 0 ? PREFERENCIAS_PADRAO.volume : prev.volume,
        }))
        try {
            if (muted) {
                playerRef.current?.mute()
            } else {
                if (preferenciasRef.current.volume === 0) {
                    playerRef.current?.setVolume(volumeParaYouTube(PREFERENCIAS_PADRAO.volume))
                }
                playerRef.current?.unMute()
            }
        } catch {
            /* ignorado */
        }
    }, [])

    const mudarVelocidade = useCallback((rate: PlaybackRate) => {
        setPreferencias((prev) => ({ ...prev, playbackRate: rate }))
        try {
            playerRef.current?.setPlaybackRate(rate)
        } catch {
            /* ignorado */
        }
        setMostrarVelocidade(false)
    }, [])

    const faixaAnterior = useCallback(() => {
        try {
            playerRef.current?.previousVideo()
        } catch {
            /* ignorado */
        }
    }, [])

    const proximaFaixa = useCallback(() => {
        errosSeguidosRef.current = 0
        try {
            playerRef.current?.nextVideo()
        } catch {
            /* ignorado */
        }
    }, [])

    const trocarPlaylist = useCallback((playlist: StudyPlaylist) => {
        setPlaylistId(playlist._id)
        setMostrarPlaylists(false)
    }, [])

    const fechar = useCallback(() => {
        dock?.close()
        setMostrarPlaylists(false)
        setMostrarVelocidade(false)
    }, [dock])

    const alternarPainel = useCallback(() => {
        if (isExpanded) fechar()
        else dock?.open('music')
    }, [isExpanded, fechar, dock])

    // Esc fecha o painel; os menus internos fecham primeiro.
    useEffect(() => {
        if (!isExpanded) return
        const aoTeclar = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            if (mostrarVelocidade) return setMostrarVelocidade(false)
            if (mostrarPlaylists) return setMostrarPlaylists(false)
            fechar()
        }
        window.addEventListener('keydown', aoTeclar)
        return () => window.removeEventListener('keydown', aoTeclar)
    }, [isExpanded, mostrarPlaylists, mostrarVelocidade, fechar])

    // Fecha o seletor de velocidade ao tocar fora dele.
    useEffect(() => {
        if (!mostrarVelocidade) return
        const aoApontar = (e: PointerEvent) => {
            const alvo = e.target as Node
            if (painelRef.current && !painelRef.current.contains(alvo)) setMostrarVelocidade(false)
        }
        window.addEventListener('pointerdown', aoApontar)
        return () => window.removeEventListener('pointerdown', aoApontar)
    }, [mostrarVelocidade])

    // ── Registro no dock ─────────────────────────────────────────────────
    const podeRenderizar =
        hydrated && !authLoading && isAuthenticated && !carregandoPlaylists && playlists.length > 0

    const register = dock?.register
    const unregister = dock?.unregister
    useEffect(() => {
        if (!register || !unregister || !podeRenderizar) return
        register({ id: 'music', label: 'Música', order: 0, active: isPlaying })
        return () => unregister('music')
    }, [register, unregister, podeRenderizar, isPlaying])

    if (!podeRenderizar) return null

    const isExamResolver = /^\/exams?\/[^/]+$/.test(pathname || '')
    const volume = preferencias.volume
    const mudo = preferencias.muted || volume === 0
    const IconeVolume = mudo ? VolumeX : volume < 45 ? Volume1 : Volume2
    const comErro = status === 'erro'
    const temVariasFaixas = !!playlistAtual?.youtubePlaylistId
    // O giro é só para espera REAL de reprodução. A montagem silenciosa do
    // iframe no carregamento da página não vira spinner — o botão continua
    // sendo um play tocável (a intenção fica na fila até o `onReady`).
    const aguardandoSom = isBuffering && !isPlaying

    const rotulo = comErro
        ? 'Indisponível'
        : isPlaying
          ? 'Tocando agora'
          : aguardandoSom
            ? 'Carregando…'
            : status === 'carregando'
              ? 'Preparando…'
              : 'Pronto para tocar'

    return (
        <>
            {/*
              Casa do iframe do YouTube.

              NÃO use `hidden`, `display:none` ou `visibility:hidden` aqui: o
              WebKit (Safari, todo navegador no iPhone/iPad) se recusa a tocar
              mídia de um nó não renderizado. Era essa a causa do "no iPad não
              toca". Um quadrado de 1px transparente dentro da viewport é
              invisível para a pessoa e legítimo para o navegador.
            */}
            <div
                ref={hostRef}
                aria-hidden="true"
                className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
                style={{ zIndex: -1 }}
            />

            <div
                className={cn(
                    'fixed z-40',
                    isExamResolver ? 'left-4 sm:left-5' : 'right-4 sm:right-6',
                    // No mobile, o painel ocupa a largura da tela (menos as
                    // margens); no desktop tem largura fixa. Antes ele era
                    // sempre 288px ancorado à direita e escapava da tela em
                    // aparelhos pequenos.
                    isExpanded && !isExamResolver && 'left-4 sm:left-auto',
                    isExpanded && isExamResolver && 'right-4 sm:right-auto',
                )}
                style={{
                    bottom: isExamResolver
                        ? 'calc(5.75rem + env(safe-area-inset-bottom, 0px))'
                        : 'calc(6rem + var(--gx-barra-inferior-h, 0px) + env(safe-area-inset-bottom, 0px))',
                }}
            >
                {isExpanded ? (
                    <div
                        ref={painelRef}
                        role="dialog"
                        aria-label="Música para foco"
                        className={cn(
                            'flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/10 sm:w-[19rem] dark:shadow-black/50',
                            !semMovimento && 'gx-music-entrada',
                        )}
                    >
                        {/* Cabeçalho */}
                        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                                    <Music className="h-[18px] w-[18px]" />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold leading-tight">
                                        {playlistAtual?.name ?? 'Foco Musical'}
                                    </p>
                                    <p
                                        className={cn(
                                            'truncate text-[11px] leading-tight',
                                            comErro ? 'text-destructive' : 'text-muted-foreground',
                                        )}
                                    >
                                        {rotulo}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fechar}
                                aria-label="Fechar player de música"
                                className="-mr-1.5 -mt-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-4 pb-4 pt-3">
                            {/* Visualizador. Só anima tocando — e nunca no Modo
                                Lite / com "menos movimento" ligado, onde doze
                                animações infinitas custavam bateria à toa. */}
                            <div className="mb-3 flex h-12 items-end justify-center gap-[3px] rounded-xl bg-muted/60 px-3 py-2">
                                {BARRAS.map((altura, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'w-1.5 rounded-full bg-violet-500/70 dark:bg-violet-400/70',
                                            isPlaying && !semMovimento && 'gx-music-barra',
                                        )}
                                        style={{
                                            height: isPlaying && !semMovimento ? undefined : `${altura}%`,
                                            ['--gx-barra-alt' as string]: `${altura}%`,
                                            animationDelay: `${i * 90}ms`,
                                        }}
                                    />
                                ))}
                            </div>

                            {comErro && (
                                <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] leading-snug text-destructive">
                                            {aviso ?? 'Não foi possível tocar agora.'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={tentarNovamente}
                                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-destructive underline-offset-2 hover:underline"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            Tentar de novo
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!comErro && aviso && (
                                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    {aviso}
                                </p>
                            )}

                            {/* Transporte. Numa faixa avulsa não há o que pular:
                                os botões sumem em vez de virarem enfeite. */}
                            <div className="mb-3 flex items-center justify-center gap-3">
                                {temVariasFaixas && (
                                    <button
                                        type="button"
                                        onClick={faixaAnterior}
                                        aria-label="Música anterior"
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                                    >
                                        <SkipBack className="h-[18px] w-[18px]" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={alternarReproducao}
                                    aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
                                    aria-pressed={isPlaying}
                                    className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/25 transition-transform hover:bg-violet-500 active:scale-95"
                                >
                                    {aguardandoSom ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause className="h-6 w-6" fill="currentColor" />
                                    ) : (
                                        <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                                    )}
                                </button>

                                {temVariasFaixas && (
                                    <button
                                        type="button"
                                        onClick={proximaFaixa}
                                        aria-label="Próxima música"
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                                    >
                                        <SkipForward className="h-[18px] w-[18px]" />
                                    </button>
                                )}
                            </div>

                            {/* Volume — sempre visível. Escondido atrás de um
                                popover, era o controle mais usado do player e o
                                mais difícil de achar no celular. */}
                            <div className="mb-3 flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={alternarMudo}
                                    aria-label={mudo ? 'Ativar som' : 'Silenciar'}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <IconeVolume className="h-4 w-4" />
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={volume}
                                    onChange={(e) => mudarVolume(Number(e.target.value))}
                                    aria-label="Volume"
                                    className="gx-music-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
                                    style={{
                                        background: `linear-gradient(to right, hsl(258 90% 60%) 0%, hsl(258 90% 60%) ${volume}%, hsl(var(--muted)) ${volume}%, hsl(var(--muted)) 100%)`,
                                    }}
                                />
                                <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                                    {mudo ? '—' : volume}
                                </span>
                            </div>

                            {/* Playlist + velocidade */}
                            <div className="flex items-stretch gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMostrarPlaylists((v) => !v)}
                                    aria-expanded={mostrarPlaylists}
                                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted"
                                >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <ListMusic className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate text-xs font-medium">
                                            Trocar ({playlists.length})
                                        </span>
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                            mostrarPlaylists && 'rotate-180',
                                        )}
                                    />
                                </button>

                                <div className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setMostrarVelocidade((v) => !v)}
                                        aria-label="Velocidade de reprodução"
                                        aria-expanded={mostrarVelocidade}
                                        className="h-full rounded-xl border border-border bg-background px-3 text-xs font-semibold tabular-nums transition-colors hover:bg-muted"
                                    >
                                        {preferencias.playbackRate}x
                                    </button>
                                    {mostrarVelocidade && (
                                        <div className="absolute bottom-[calc(100%+0.375rem)] right-0 z-10 flex flex-col gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl">
                                            {PLAYBACK_RATES.map((rate) => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() => mudarVelocidade(rate)}
                                                    className={cn(
                                                        'rounded-lg px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors',
                                                        preferencias.playbackRate === rate
                                                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                    )}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {mostrarPlaylists && (
                                <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto rounded-xl border border-border bg-background p-1">
                                    {playlists.map((playlist) => {
                                        const ativa = playlist._id === playlistId
                                        return (
                                            <button
                                                key={playlist._id}
                                                type="button"
                                                onClick={() => trocarPlaylist(playlist)}
                                                className={cn(
                                                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                                                    ativa
                                                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                )}
                                            >
                                                <span className="truncate text-xs font-medium">
                                                    {playlist.name}
                                                </span>
                                                {ativa && <Check className="h-3.5 w-3.5 shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /*
                      Gatilho minimizado (desktop; no mobile quem abre é o FAB
                      consolidado). Fundo sólido `bg-card` com borda: a versão
                      anterior era vidro branco translúcido com ícone branco —
                      no tema claro ela sumia por completo dentro da página.
                    */
                    <button
                        type="button"
                        onClick={alternarPainel}
                        aria-label={
                            isPlaying ? 'Música tocando — abrir player' : 'Abrir músicas para foco'
                        }
                        className="group relative hidden h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-violet-600 shadow-lg shadow-black/10 transition-transform hover:scale-105 active:scale-95 lg:flex dark:text-violet-300 dark:shadow-black/40"
                    >
                        {aguardandoSom ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Music className="h-6 w-6" />
                        )}
                        {isPlaying && (
                            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card">
                                {!semMovimento && (
                                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70" />
                                )}
                            </span>
                        )}
                        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                            {isPlaying ? 'Tocando' : 'Músicas para foco'}
                        </span>
                    </button>
                )}
            </div>

            {/*
              Estilos escopados por `gx-music-*`. A versão anterior estilizava
              `input[type="range"]` globalmente — o polegar branco do slider
              vazava para TODOS os controles deslizantes do site.
            */}
            <style jsx global>{`
                .gx-music-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 9999px;
                    background: hsl(258 90% 60%);
                    border: 2px solid hsl(var(--card));
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                }
                .gx-music-range::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 9999px;
                    background: hsl(258 90% 60%);
                    border: 2px solid hsl(var(--card));
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                }
                .gx-music-range:focus-visible {
                    outline: 2px solid hsl(258 90% 60%);
                    outline-offset: 3px;
                }
                .gx-music-barra {
                    height: var(--gx-barra-alt, 40%);
                    animation: gx-music-pulso 1.1s ease-in-out infinite alternate;
                    will-change: transform;
                    transform-origin: bottom;
                }
                @keyframes gx-music-pulso {
                    from {
                        transform: scaleY(0.35);
                    }
                    to {
                        transform: scaleY(1);
                    }
                }
                .gx-music-entrada {
                    animation: gx-music-subir 180ms ease-out;
                }
                @keyframes gx-music-subir {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: none;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .gx-music-barra,
                    .gx-music-entrada {
                        animation: none;
                    }
                }
            `}</style>
        </>
    )
}

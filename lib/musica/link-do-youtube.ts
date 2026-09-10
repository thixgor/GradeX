/**
 * Leitura de links do YouTube para o player de música de estudo.
 *
 * O admin antigo só reconhecia `?list=` e devolvia sempre a mesma frase
 * ("URL de playlist inválida") para casos muito diferentes entre si: link de
 * vídeo único, link encurtado, link do YouTube Music, ID colado sem a URL em
 * volta, e playlists que NUNCA vão tocar num embed (Curtidos e Assistir mais
 * tarde são privadas por definição). Quem cadastrava não tinha como saber o
 * que estava errado — daí a sensação de "cheio de erro".
 *
 * Aqui cada recusa tem um motivo em português, e o que dá para aceitar é
 * aceito: vídeo avulso vira uma faixa só, e o link é normalizado para uma
 * forma canônica (o "abrir no YouTube" do painel depende disso).
 */

/** Uma entrada do player: ou uma playlist inteira, ou uma faixa só. */
export type ItemDeMusica =
    | { tipo: 'playlist'; playlistId: string; videoId: null }
    | { tipo: 'video'; playlistId: null; videoId: string }

export type LeituraDeLink =
    | { ok: true; item: ItemDeMusica; url: string }
    | { ok: false; motivo: string }

const HOSTS_YOUTUBE = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
])

const HOSTS_CURTOS = new Set(['youtu.be', 'www.youtube.be'])

const ID_DE_VIDEO = /^[A-Za-z0-9_-]{11}$/
const ID_DE_PLAYLIST = /^[A-Za-z0-9_-]{10,}$/

/**
 * Listas que existem só para a conta de quem as criou. O YouTube nunca as
 * entrega num embed — cadastrar uma delas resultava numa playlist que aparecia
 * no painel e ficava muda para todo mundo.
 */
const LISTAS_PESSOAIS: Record<string, string> = {
    LL: 'a lista de vídeos curtidos',
    WL: 'a lista "Assistir mais tarde"',
}

function motivoDeListaPessoal(id: string): string | null {
    const rotulo = LISTAS_PESSOAIS[id]
    if (!rotulo) return null
    return `Esse link aponta para ${rotulo}, que é privada da sua conta e não toca fora do YouTube. Crie uma playlist pública ou não listada e cole o link dela.`
}

export function urlDePlaylist(playlistId: string): string {
    return `https://www.youtube.com/playlist?list=${playlistId}`
}

export function urlDeVideo(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`
}

/** Endereço da capa. O YouTube não tem capa de playlist por ID, então uma
 *  playlist só ganha miniatura depois — no painel usamos a do vídeo. */
export function capaDeVideo(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
}

function daPlaylist(playlistId: string): LeituraDeLink {
    const impedimento = motivoDeListaPessoal(playlistId)
    if (impedimento) return { ok: false, motivo: impedimento }
    if (!ID_DE_PLAYLIST.test(playlistId)) {
        return { ok: false, motivo: 'O identificador da playlist nesse link não parece válido.' }
    }
    return {
        ok: true,
        item: { tipo: 'playlist', playlistId, videoId: null },
        url: urlDePlaylist(playlistId),
    }
}

function doVideo(videoId: string): LeituraDeLink {
    if (!ID_DE_VIDEO.test(videoId)) {
        return { ok: false, motivo: 'O identificador do vídeo nesse link não parece válido.' }
    }
    return {
        ok: true,
        item: { tipo: 'video', playlistId: null, videoId },
        url: urlDeVideo(videoId),
    }
}

/**
 * Lê um link (ou um ID colado sozinho) e diz o que dá para tocar.
 *
 * Quando o link traz vídeo E playlist — o caso de quem copia a barra de
 * endereços ouvindo uma playlist — vale a playlist: é o que a pessoa está
 * cadastrando.
 */
export function lerLinkDoYouTube(entrada: string): LeituraDeLink {
    const texto = (entrada ?? '').trim()
    if (!texto) return { ok: false, motivo: 'Cole o link do YouTube.' }

    // ID colado sem a URL em volta (acontece o tempo todo com quem copia da
    // barra de endereços pela metade).
    if (!texto.includes('/') && !texto.includes('.')) {
        const impedimento = motivoDeListaPessoal(texto)
        if (impedimento) return { ok: false, motivo: impedimento }
        if (ID_DE_VIDEO.test(texto)) return doVideo(texto)
        if (ID_DE_PLAYLIST.test(texto)) return daPlaylist(texto)
        return {
            ok: false,
            motivo: 'Não reconhecemos esse texto como link nem como ID do YouTube.',
        }
    }

    let url: URL
    try {
        url = new URL(texto.includes('://') ? texto : `https://${texto}`)
    } catch {
        return { ok: false, motivo: 'Esse texto não é um endereço válido.' }
    }

    const host = url.hostname.toLowerCase()
    if (!HOSTS_YOUTUBE.has(host) && !HOSTS_CURTOS.has(host)) {
        return {
            ok: false,
            motivo: 'Só aceitamos links do YouTube (youtube.com, youtu.be ou music.youtube.com).',
        }
    }

    const lista = url.searchParams.get('list')
    if (lista) return daPlaylist(lista)

    // youtu.be/VIDEO
    if (HOSTS_CURTOS.has(host)) {
        const id = url.pathname.split('/').filter(Boolean)[0]
        if (id) return doVideo(id)
        return { ok: false, motivo: 'Esse link encurtado não traz nenhum vídeo.' }
    }

    // /watch?v=VIDEO
    const v = url.searchParams.get('v')
    if (v) return doVideo(v)

    // /shorts/ID, /embed/ID, /live/ID, /v/ID
    const partes = url.pathname.split('/').filter(Boolean)
    if (partes.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(partes[0])) {
        // `/embed/videoseries?list=` já foi tratado acima pelo parâmetro `list`.
        if (partes[1] === 'videoseries') {
            return {
                ok: false,
                motivo: 'Esse link de série de vídeos não traz a playlist. Copie o link pela página da playlist.',
            }
        }
        return doVideo(partes[1])
    }

    if (partes[0] === 'playlist') {
        return {
            ok: false,
            motivo: 'Esse link de playlist está sem o `list=`. Abra a playlist no YouTube e copie o endereço completo.',
        }
    }

    if (partes[0]?.startsWith('@') || partes[0] === 'channel' || partes[0] === 'c') {
        return {
            ok: false,
            motivo: 'Esse é o link de um canal, não de uma playlist. Abra a aba "Playlists" do canal e copie o link de uma delas.',
        }
    }

    return {
        ok: false,
        motivo: 'Não encontramos nem playlist nem vídeo nesse link do YouTube.',
    }
}

/** Chave estável de um item, para comparar "é a mesma coisa que já está
 *  carregada?" sem confundir um vídeo com uma playlist de mesmo ID. */
export function chaveDoItem(item: {
    youtubePlaylistId?: string | null
    youtubeVideoId?: string | null
}): string | null {
    if (item.youtubePlaylistId) return `pl:${item.youtubePlaylistId}`
    if (item.youtubeVideoId) return `vd:${item.youtubeVideoId}`
    return null
}

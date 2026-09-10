import { describe, it, expect } from 'vitest'
import { lerLinkDoYouTube, chaveDoItem } from '@/lib/musica/link-do-youtube'

/**
 * O leitor de links do cadastro de músicas de estudo.
 *
 * O admin antigo só enxergava `?list=` e devolvia a mesma frase para tudo o
 * que não fosse isso. Estes testes prendem as formas que uma pessoa realmente
 * cola no campo — e, principalmente, que cada recusa diga o que fazer.
 */

function id(entrada: string) {
    const r = lerLinkDoYouTube(entrada)
    if (!r.ok) throw new Error(`esperava aceitar "${entrada}", recusou: ${r.motivo}`)
    return r.item
}

describe('lerLinkDoYouTube — playlists', () => {
    it('lê o link canônico de playlist', () => {
        expect(id('https://www.youtube.com/playlist?list=PLabcdefghij1234567890')).toEqual({
            tipo: 'playlist',
            playlistId: 'PLabcdefghij1234567890',
            videoId: null,
        })
    })

    it('prefere a playlist quando o link traz vídeo e playlist juntos', () => {
        // É o que sai da barra de endereços de quem está ouvindo uma playlist.
        expect(id('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghij1234567890')).toEqual(
            { tipo: 'playlist', playlistId: 'PLabcdefghij1234567890', videoId: null },
        )
    })

    it('aceita YouTube Music, mobile e o link encurtado com playlist', () => {
        for (const link of [
            'https://music.youtube.com/playlist?list=OLAK5uy_abcdefghij1234567890',
            'https://m.youtube.com/playlist?list=OLAK5uy_abcdefghij1234567890',
            'https://youtu.be/dQw4w9WgXcQ?list=OLAK5uy_abcdefghij1234567890',
        ]) {
            expect(id(link).playlistId, link).toBe('OLAK5uy_abcdefghij1234567890')
        }
    })

    it('aceita o ID colado sozinho e normaliza a URL', () => {
        const r = lerLinkDoYouTube('PLabcdefghij1234567890')
        expect(r.ok && r.url).toBe('https://www.youtube.com/playlist?list=PLabcdefghij1234567890')
    })

    it('aceita link sem protocolo', () => {
        expect(id('youtube.com/playlist?list=PLabcdefghij1234567890').tipo).toBe('playlist')
    })
})

describe('lerLinkDoYouTube — faixa única', () => {
    it('lê vídeo avulso em todas as formas que o YouTube oferece', () => {
        for (const link of [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://www.youtube.com/shorts/dQw4w9WgXcQ',
            'https://www.youtube.com/embed/dQw4w9WgXcQ',
            'https://www.youtube.com/live/dQw4w9WgXcQ',
        ]) {
            expect(id(link), link).toEqual({
                tipo: 'video',
                playlistId: null,
                videoId: 'dQw4w9WgXcQ',
            })
        }
    })

    it('aceita o ID de vídeo colado sozinho', () => {
        const r = lerLinkDoYouTube('dQw4w9WgXcQ')
        expect(r.ok && r.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })
})

describe('lerLinkDoYouTube — recusas explicam o que fazer', () => {
    it('recusa Curtidos e Assistir mais tarde, que nunca tocam num embed', () => {
        // Eram aceitas pelo admin antigo: entravam no painel e ficavam mudas
        // para todo mundo, porque são privadas da conta de quem criou.
        for (const lista of ['LL', 'WL']) {
            const r = lerLinkDoYouTube(`https://www.youtube.com/playlist?list=${lista}`)
            expect(r.ok, lista).toBe(false)
            expect(!r.ok && r.motivo).toMatch(/privada/i)
        }
    })

    it('recusa link de canal dizendo onde achar as playlists', () => {
        const r = lerLinkDoYouTube('https://www.youtube.com/@algumcanal')
        expect(r.ok).toBe(false)
        expect(!r.ok && r.motivo).toMatch(/canal/i)
    })

    it('recusa endereço que não é do YouTube', () => {
        const r = lerLinkDoYouTube('https://open.spotify.com/playlist/37i9dQZF1DX')
        expect(r.ok).toBe(false)
        expect(!r.ok && r.motivo).toMatch(/YouTube/)
    })

    it('recusa campo vazio e texto solto', () => {
        expect(lerLinkDoYouTube('   ').ok).toBe(false)
        expect(lerLinkDoYouTube('lofi para estudar').ok).toBe(false)
    })

    it('recusa ID de vídeo truncado em vez de cadastrar algo que não toca', () => {
        const r = lerLinkDoYouTube('https://www.youtube.com/watch?v=abc')
        expect(r.ok).toBe(false)
    })
})

describe('chaveDoItem', () => {
    it('não confunde uma playlist com um vídeo de mesmo identificador', () => {
        expect(chaveDoItem({ youtubePlaylistId: 'XYZ' })).not.toBe(
            chaveDoItem({ youtubeVideoId: 'XYZ' }),
        )
    })

    it('devolve nulo para um item sem nada tocável', () => {
        expect(chaveDoItem({})).toBeNull()
    })
})

export interface StudyPlaylist {
    _id?: string
    name: string
    youtubePlaylistId: string
    youtubeUrl: string
    createdAt: Date
    updatedAt: Date
    isActive: boolean
    order?: number
}

export interface StudyPlayerState {
    isExpanded: boolean
    isPlaying: boolean
    volume: number
    playbackRate: 1 | 2
    currentPlaylistId: string | null
    currentVideoIndex: number
}

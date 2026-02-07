'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
    Music,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Loader2,
    ArrowLeft,
    ExternalLink,
    GripVertical,
    Eye,
    EyeOff
} from 'lucide-react'
import Link from 'next/link'

interface StudyPlaylist {
    _id: string
    name: string
    youtubeUrl: string
    youtubePlaylistId: string
    isActive: boolean
    order: number
    createdAt: string
    updatedAt: string
}

export default function StudyPlaylistsAdminPage() {
    const [playlists, setPlaylists] = useState<StudyPlaylist[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    // Form states
    const [newName, setNewName] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [editName, setEditName] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        loadPlaylists()
    }, [])

    async function loadPlaylists() {
        try {
            const res = await fetch('/api/admin/study-playlists')
            const data = await res.json()
            if (data.success) {
                setPlaylists(data.playlists)
            }
        } catch (err) {
            console.error('Error loading playlists:', err)
            setError('Erro ao carregar playlists')
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd() {
        if (!newName.trim() || !newUrl.trim()) {
            setError('Preencha todos os campos')
            return
        }

        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/admin/study-playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, youtubeUrl: newUrl })
            })

            const data = await res.json()

            if (data.success) {
                setNewName('')
                setNewUrl('')
                setShowAddForm(false)
                setSuccess('Playlist adicionada com sucesso!')
                loadPlaylists()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(data.error || 'Erro ao adicionar playlist')
            }
        } catch (err) {
            setError('Erro ao adicionar playlist')
        } finally {
            setSaving(false)
        }
    }

    async function handleEdit(id: string) {
        if (!editName.trim() || !editUrl.trim()) {
            setError('Preencha todos os campos')
            return
        }

        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/admin/study-playlists', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName, youtubeUrl: editUrl })
            })

            const data = await res.json()

            if (data.success) {
                setEditingId(null)
                setSuccess('Playlist atualizada com sucesso!')
                loadPlaylists()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(data.error || 'Erro ao atualizar playlist')
            }
        } catch (err) {
            setError('Erro ao atualizar playlist')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja remover esta playlist?')) return

        try {
            const res = await fetch(`/api/admin/study-playlists?id=${id}`, {
                method: 'DELETE'
            })

            const data = await res.json()

            if (data.success) {
                setSuccess('Playlist removida com sucesso!')
                loadPlaylists()
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(data.error || 'Erro ao remover playlist')
            }
        } catch (err) {
            setError('Erro ao remover playlist')
        }
    }

    async function toggleActive(playlist: StudyPlaylist) {
        try {
            const res = await fetch('/api/admin/study-playlists', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: playlist._id, isActive: !playlist.isActive })
            })

            const data = await res.json()

            if (data.success) {
                loadPlaylists()
            }
        } catch (err) {
            setError('Erro ao atualizar status')
        }
    }

    function startEdit(playlist: StudyPlaylist) {
        setEditingId(playlist._id)
        setEditName(playlist.name)
        setEditUrl(playlist.youtubeUrl)
        setError('')
    }

    function cancelEdit() {
        setEditingId(null)
        setEditName('')
        setEditUrl('')
        setError('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Admin
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Music className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Playlists de Estudo</h1>
                                <p className="text-sm text-muted-foreground">
                                    Gerencie as playlists do player de música
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Playlist
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                        {success}
                    </div>
                )}

                {/* Add Form */}
                {showAddForm && (
                    <Card className="mb-6 p-6 bg-white/5 backdrop-blur-xl border-white/10">
                        <h3 className="text-lg font-semibold mb-4 text-foreground">Nova Playlist</h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-name">Nome da Playlist</Label>
                                <Input
                                    id="new-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Lo-Fi para Estudar"
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div>
                                <Label htmlFor="new-url">Link da Playlist do YouTube</Label>
                                <Input
                                    id="new-url"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    className="bg-white/5 border-white/10"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cole o link completo da playlist do YouTube
                                </p>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setNewName('')
                                        setNewUrl('')
                                        setError('')
                                    }}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    </div>
                ) : playlists.length === 0 ? (
                    /* Empty State */
                    <Card className="p-12 text-center bg-white/5 backdrop-blur-xl border-white/10">
                        <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Nenhuma playlist cadastrada
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Adicione playlists do YouTube para que os usuários possam ouvir enquanto estudam.
                        </p>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Primeira Playlist
                        </Button>
                    </Card>
                ) : (
                    /* Playlist List */
                    <div className="space-y-4">
                        {playlists.map((playlist, index) => (
                            <Card
                                key={playlist._id}
                                className={`p-4 bg-white/5 backdrop-blur-xl border-white/10 transition-all ${!playlist.isActive ? 'opacity-50' : ''
                                    }`}
                            >
                                {editingId === playlist._id ? (
                                    /* Edit Mode */
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Nome da Playlist</Label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div>
                                            <Label>Link da Playlist do YouTube</Label>
                                            <Input
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={cancelEdit}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancelar
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleEdit(playlist._id)}
                                                disabled={saving}
                                                className="bg-violet-600 hover:bg-violet-700"
                                            >
                                                {saving ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-1" />
                                                )}
                                                Salvar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div className="flex items-center gap-4">
                                        <div className="text-muted-foreground cursor-grab">
                                            <GripVertical className="h-5 w-5" />
                                        </div>

                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                                            <Music className="h-5 w-5 text-violet-400" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-foreground truncate">{playlist.name}</h4>
                                            <p className="text-xs text-muted-foreground truncate">
                                                ID: {playlist.youtubePlaylistId}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                href={playlist.youtubeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                                                title="Abrir no YouTube"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>

                                            <button
                                                onClick={() => toggleActive(playlist)}
                                                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${playlist.isActive ? 'text-green-400' : 'text-muted-foreground'
                                                    }`}
                                                title={playlist.isActive ? 'Ativa' : 'Inativa'}
                                            >
                                                {playlist.isActive ? (
                                                    <Eye className="h-4 w-4" />
                                                ) : (
                                                    <EyeOff className="h-4 w-4" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => startEdit(playlist)}
                                                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(playlist._id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                                                title="Remover"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Info */}
                <Card className="mt-8 p-4 bg-violet-500/5 border-violet-500/10">
                    <div className="flex gap-3">
                        <Music className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-foreground mb-1">Sobre o Player de Música</h4>
                            <p className="text-sm text-muted-foreground">
                                O player de música aparecerá como um widget flutuante no canto inferior direito
                                da plataforma. Os usuários poderão trocar entre as playlists cadastradas,
                                controlar o volume e a velocidade de reprodução. A preferência é salva
                                automaticamente para cada usuário.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

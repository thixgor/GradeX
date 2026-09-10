'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Music,
    ListMusic,
    PlusCircle,
    Trash2,
    Pencil,
    Loader2,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { LogoLoading } from '@/components/logo-loading'
import { cn } from '@/lib/utils'
import { lerLinkDoYouTube, capaDeVideo } from '@/lib/musica/link-do-youtube'

/**
 * Cadastro das músicas de estudo.
 *
 * A tela anterior tinha três problemas de fundo:
 *
 *  - fundo `navy-950` fixo com texto em `text-foreground`: no tema claro era
 *    letra escura sobre azul-marinho, ilegível. Era a única página do painel
 *    que não usava o tema — agora usa o `AppShell` como as outras;
 *  - a alça de arrastar (`GripVertical`) era decorativa: mudava o cursor e não
 *    reordenava nada, embora a API já aceitasse `order`. Virou subir/descer,
 *    que de fato funciona;
 *  - qualquer erro aparecia numa faixa no TOPO da página. Editando o quinto
 *    item da lista, a mensagem nascia fora da tela e a impressão era de que o
 *    botão não fazia nada. Agora o erro aparece dentro do próprio diálogo, e
 *    as confirmações viram um aviso flutuante.
 */

interface ItemDeEstudo {
    _id: string
    name: string
    youtubeUrl: string
    youtubePlaylistId: string | null
    youtubeVideoId: string | null
    isActive: boolean
    order: number
}

interface Formulario {
    name: string
    youtubeUrl: string
}

const FORM_VAZIO: Formulario = { name: '', youtubeUrl: '' }

export default function StudyPlaylistsAdminPage() {
    const router = useRouter()
    const [verificandoAcesso, setVerificandoAcesso] = useState(true)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [itens, setItens] = useState<ItemDeEstudo[]>([])
    const [erroDaLista, setErroDaLista] = useState<string | null>(null)
    const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

    const [dialogoAberto, setDialogoAberto] = useState(false)
    const [editando, setEditando] = useState<ItemDeEstudo | null>(null)
    const [form, setForm] = useState<Formulario>(FORM_VAZIO)
    const [erroDoForm, setErroDoForm] = useState<string | null>(null)
    const [paraExcluir, setParaExcluir] = useState<ItemDeEstudo | null>(null)

    // A página em si não era protegida — só a API. Quem não fosse admin via a
    // casca montar e uma lista vazia, sem explicação.
    useEffect(() => {
        ;(async () => {
            try {
                const me = await fetch('/api/auth/me', { cache: 'no-store' })
                if (!me.ok) {
                    router.push('/auth/login')
                    return
                }
                const data = await me.json()
                if (data.user?.role !== 'admin') {
                    router.push('/')
                    return
                }
            } catch {
                router.push('/auth/login')
                return
            } finally {
                setVerificandoAcesso(false)
            }
        })()
    }, [router])

    function mostrarAviso(tipo: 'ok' | 'erro', texto: string) {
        setAviso({ tipo, texto })
        setTimeout(() => setAviso(null), 3500)
    }

    const carregar = useCallback(async () => {
        setCarregando(true)
        setErroDaLista(null)
        try {
            const res = await fetch('/api/admin/study-playlists', { cache: 'no-store' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Não foi possível carregar a lista.')
            }
            setItens(data.playlists ?? [])
        } catch (e) {
            setErroDaLista(e instanceof Error ? e.message : 'Não foi possível carregar a lista.')
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        if (!verificandoAcesso) carregar()
    }, [verificandoAcesso, carregar])

    // Conferência do link enquanto a pessoa digita: dizer "esse link é de um
    // canal" antes de clicar em salvar vale mais do que depois.
    const leitura = useMemo(
        () => (form.youtubeUrl.trim() ? lerLinkDoYouTube(form.youtubeUrl) : null),
        [form.youtubeUrl],
    )

    function abrirNovo() {
        setEditando(null)
        setForm(FORM_VAZIO)
        setErroDoForm(null)
        setDialogoAberto(true)
    }

    function abrirEdicao(item: ItemDeEstudo) {
        setEditando(item)
        setForm({ name: item.name, youtubeUrl: item.youtubeUrl })
        setErroDoForm(null)
        setDialogoAberto(true)
    }

    async function salvar() {
        const nome = form.name.trim()
        if (!nome) {
            setErroDoForm('Dê um nome para essa música ou playlist.')
            return
        }
        if (leitura && !leitura.ok) {
            setErroDoForm(leitura.motivo)
            return
        }
        if (!leitura) {
            setErroDoForm('Cole o link do YouTube.')
            return
        }

        setSalvando(true)
        setErroDoForm(null)
        try {
            const corpo = { name: nome, youtubeUrl: form.youtubeUrl.trim() }
            const res = await fetch('/api/admin/study-playlists', {
                method: editando ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editando ? { id: editando._id, ...corpo } : corpo),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Não foi possível salvar.')
            }

            setDialogoAberto(false)
            mostrarAviso('ok', editando ? 'Alteração salva.' : 'Adicionado ao player.')
            carregar()
        } catch (e) {
            setErroDoForm(e instanceof Error ? e.message : 'Não foi possível salvar.')
        } finally {
            setSalvando(false)
        }
    }

    async function alternarAtivo(item: ItemDeEstudo) {
        // Troca otimista: a lista inteira era recarregada do servidor a cada
        // clique no olhinho, e o item piscava.
        setItens((prev) =>
            prev.map((i) => (i._id === item._id ? { ...i, isActive: !i.isActive } : i)),
        )
        try {
            const res = await fetch('/api/admin/study-playlists', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item._id, isActive: !item.isActive }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) throw new Error(data?.error || 'Erro ao atualizar')
        } catch (e) {
            setItens((prev) =>
                prev.map((i) => (i._id === item._id ? { ...i, isActive: item.isActive } : i)),
            )
            mostrarAviso('erro', e instanceof Error ? e.message : 'Erro ao atualizar')
        }
    }

    async function mover(item: ItemDeEstudo, direcao: -1 | 1) {
        const indice = itens.findIndex((i) => i._id === item._id)
        const destino = indice + direcao
        if (indice < 0 || destino < 0 || destino >= itens.length) return
        const outro = itens[destino]

        const anterior = itens
        const reordenado = [...itens]
        reordenado[indice] = outro
        reordenado[destino] = item
        setItens(reordenado)

        try {
            const respostas = await Promise.all([
                fetch('/api/admin/study-playlists', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: item._id, order: outro.order }),
                }),
                fetch('/api/admin/study-playlists', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: outro._id, order: item.order }),
                }),
            ])
            if (respostas.some((r) => !r.ok)) throw new Error('Erro ao reordenar')
            setItens((prev) =>
                prev.map((i) =>
                    i._id === item._id
                        ? { ...i, order: outro.order }
                        : i._id === outro._id
                          ? { ...i, order: item.order }
                          : i,
                ),
            )
        } catch {
            setItens(anterior)
            mostrarAviso('erro', 'Não foi possível reordenar.')
        }
    }

    async function excluir() {
        if (!paraExcluir) return
        const alvo = paraExcluir
        setParaExcluir(null)
        const anterior = itens
        setItens((prev) => prev.filter((i) => i._id !== alvo._id))
        try {
            const res = await fetch(`/api/admin/study-playlists?id=${alvo._id}`, {
                method: 'DELETE',
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data?.success) throw new Error(data?.error || 'Erro ao remover')
            mostrarAviso('ok', `"${alvo.name}" removido.`)
        } catch (e) {
            setItens(anterior)
            mostrarAviso('erro', e instanceof Error ? e.message : 'Erro ao remover')
        }
    }

    if (verificandoAcesso) {
        return <LogoLoading message="Verificando permissões..." size="lg" fullscreen />
    }

    const ativos = itens.filter((i) => i.isActive).length

    return (
        <AppShell headerTitle="Músicas de estudo" headerSubtitle="Playlists do player de foco">
            <div className="container mx-auto max-w-3xl px-4 py-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/admin')}
                        className="-ml-2 rounded-xl"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button onClick={abrirNovo} className="rounded-xl">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar
                    </Button>
                </div>

                <div className="mb-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                        <Music className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            Cole o link de uma <strong>playlist</strong> do YouTube ou de uma{' '}
                            <strong>música avulsa</strong> — os dois funcionam. A playlist precisa
                            ser pública ou não listada; “Curtidos” e “Assistir mais tarde” são
                            privadas e não tocam fora do YouTube. A ordem daqui é a ordem que o
                            aluno vê, e o player <strong>nunca começa tocando sozinho</strong>.
                        </span>
                    </p>
                    {itens.length > 0 && (
                        <p className="mt-2 pl-6 text-xs">
                            {itens.length} cadastrada{itens.length > 1 ? 's' : ''} · {ativos} visível
                            {ativos > 1 ? 'eis' : ''} para os alunos
                        </p>
                    )}
                </div>

                {carregando ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Carregando...
                    </div>
                ) : erroDaLista ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        <p>{erroDaLista}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 rounded-lg"
                            onClick={carregar}
                        >
                            Tentar de novo
                        </Button>
                    </div>
                ) : itens.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                        <ListMusic className="mx-auto mb-3 h-8 w-8 opacity-50" />
                        <p>Nenhuma música cadastrada.</p>
                        <p className="text-sm">
                            Sem nenhuma, o player nem aparece para os alunos.
                        </p>
                        <Button onClick={abrirNovo} className="mt-4 rounded-xl">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar a primeira
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {itens.map((item, idx) => (
                            <div
                                key={item._id}
                                className={cn(
                                    'flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center',
                                    !item.isActive && 'opacity-60',
                                )}
                            >
                                <div className="flex h-14 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:w-24">
                                    {item.youtubeVideoId ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={capaDeVideo(item.youtubeVideoId)}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <ListMusic className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                                            {item.youtubePlaylistId ? 'Playlist' : 'Faixa'}
                                        </span>
                                        {!item.isActive && (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                                                Oculta
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                        {item.youtubePlaylistId ?? item.youtubeVideoId}
                                    </p>
                                </div>

                                <div className="flex items-center gap-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Subir"
                                        disabled={idx === 0}
                                        onClick={() => mover(item, -1)}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Descer"
                                        disabled={idx === itens.length - 1}
                                        onClick={() => mover(item, 1)}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    {/* Link de verdade, e não `<Button asChild>`:
                                        o `asChild` do nosso Button é só um tipo,
                                        não existe Slot por baixo — sairia uma
                                        âncora dentro de um <button>. */}
                                    <a
                                        href={item.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir no YouTube"
                                        className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                                        )}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title={
                                            item.isActive
                                                ? 'Ocultar dos alunos'
                                                : 'Exibir para os alunos'
                                        }
                                        onClick={() => alternarAtivo(item)}
                                    >
                                        {item.isActive ? (
                                            <Eye className="h-4 w-4" />
                                        ) : (
                                            <EyeOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Editar"
                                        onClick={() => abrirEdicao(item)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Remover"
                                        className="text-destructive"
                                        onClick={() => setParaExcluir(item)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Criar / editar */}
            <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editando ? 'Editar' : 'Adicionar música'}</DialogTitle>
                        <DialogDescription>
                            Playlist inteira ou uma faixa só — cole o link do YouTube.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="nome">
                                Nome <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="nome"
                                value={form.name}
                                maxLength={100}
                                placeholder="Ex.: Lo-Fi para estudar"
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                É esse nome que o aluno vê no player.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="link">
                                Link do YouTube <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="link"
                                value={form.youtubeUrl}
                                placeholder="https://www.youtube.com/playlist?list=..."
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                                }
                            />
                            {/* Conferência ao vivo: o cadastro antigo só avisava
                                depois de salvar, e sempre com a mesma frase. */}
                            {leitura?.ok ? (
                                <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    {leitura.item.tipo === 'playlist'
                                        ? `Playlist reconhecida (${leitura.item.playlistId})`
                                        : `Faixa reconhecida (${leitura.item.videoId})`}
                                </p>
                            ) : leitura ? (
                                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                                    {leitura.motivo}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Aceita youtube.com, youtu.be, YouTube Music, Shorts — ou só o ID.
                                </p>
                            )}
                        </div>

                        {erroDoForm && (
                            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{erroDoForm}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogoAberto(false)}
                            disabled={salvando}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={salvar} disabled={salvando || (!!leitura && !leitura.ok)}>
                            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editando ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmação de remoção — antes era um `confirm()` do navegador. */}
            <Dialog open={!!paraExcluir} onOpenChange={(aberto) => !aberto && setParaExcluir(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remover do player?</DialogTitle>
                        <DialogDescription>
                            “{paraExcluir?.name}” sai da lista para todos os alunos. Para tirar do ar
                            sem apagar, use o olho (Ocultar).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setParaExcluir(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={excluir}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Aviso flutuante: fica visível mesmo com a página rolada. */}
            {aviso && (
                <div
                    role="status"
                    className={cn(
                        'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-lg',
                        aviso.tipo === 'ok'
                            ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'border-destructive/40 bg-destructive/10 text-destructive',
                    )}
                >
                    {aviso.tipo === 'ok' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    {aviso.texto}
                </div>
            )}
        </AppShell>
    )
}

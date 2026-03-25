'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { Bold, Italic, Link, Search, X, Stethoscope, Film, Volume2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RichTextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

interface PatologiaResult {
  _id: string
  nome: string
  slug: string
  sistema: string
}

export function RichTextArea({ value, onChange, placeholder, minHeight = '160px', className = '' }: RichTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingCursor = useRef<{ pos: number; scrollTop: number } | null>(null)

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkSelection, setLinkSelection] = useState({ start: 0, end: 0, text: '' })

  // Pathology link modal state
  const [showPatologiaModal, setShowPatologiaModal] = useState(false)
  const [patologiaBusca, setPatologiaBusca] = useState('')
  const [patologiaResults, setPatologiaResults] = useState<PatologiaResult[]>([])
  const [patologiaLoading, setPatologiaLoading] = useState(false)
  const [patologiaSelection, setPatologiaSelection] = useState({ start: 0, end: 0, text: '' })

  // Embed modal state
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [embedType, setEmbedType] = useState<'video' | 'audio' | 'image'>('video')
  const [embedUrl, setEmbedUrl] = useState('')
  const [embedCaption, setEmbedCaption] = useState('')

  // Auto-resize textarea to fit content
  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.max(ta.scrollHeight, parseInt(minHeight)) + 'px'
  }, [minHeight])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])

  // Restore cursor + scroll after React re-renders the textarea value
  useLayoutEffect(() => {
    const ta = textareaRef.current
    const pending = pendingCursor.current
    if (!ta || !pending) return
    pendingCursor.current = null
    ta.focus()
    ta.setSelectionRange(pending.pos, pending.pos)
    ta.scrollTop = pending.scrollTop
  }, [value])

  // Get current selection from textarea
  function getSelection() {
    const ta = textareaRef.current
    if (!ta) return { start: 0, end: 0, text: '' }
    return {
      start: ta.selectionStart,
      end: ta.selectionEnd,
      text: ta.value.substring(ta.selectionStart, ta.selectionEnd)
    }
  }

  // Wrap selection with markers
  function wrapSelection(before: string, after: string) {
    const ta = textareaRef.current
    if (!ta) return

    const sel = getSelection()
    const scrollTop = ta.scrollTop
    const selectedText = sel.text || 'texto'
    const cursorPos = sel.start + before.length + selectedText.length + after.length
    const newValue = value.substring(0, sel.start) + before + selectedText + after + value.substring(sel.end)

    // Schedule cursor + scroll restore for after React re-renders
    pendingCursor.current = { pos: cursorPos, scrollTop }
    onChange(newValue)
  }

  function handleBold() {
    wrapSelection('**', '**')
  }

  function handleItalic() {
    wrapSelection('*', '*')
  }

  function handleLink() {
    const sel = getSelection()
    if (!sel.text) {
      // No selection — insert placeholder
      wrapSelection('[', '](https://)')
      return
    }
    setLinkSelection(sel)
    setLinkUrl('')
    setShowLinkModal(true)
  }

  function confirmLink() {
    if (!linkUrl) return
    const linkMarkup = `[${linkSelection.text}](${linkUrl})`
    const cursorPos = linkSelection.start + linkMarkup.length
    const newValue = value.substring(0, linkSelection.start) + linkMarkup + value.substring(linkSelection.end)
    pendingCursor.current = { pos: cursorPos, scrollTop: textareaRef.current?.scrollTop || 0 }
    onChange(newValue)
    setShowLinkModal(false)
    setLinkUrl('')
  }

  function handlePatologiaLink() {
    const sel = getSelection()
    setPatologiaSelection(sel)
    setPatologiaBusca(sel.text || '')
    setPatologiaResults([])
    setShowPatologiaModal(true)
    if (sel.text) {
      searchPatologias(sel.text)
    }
  }

  // Debounced search
  const searchTimeout = useRef<NodeJS.Timeout>()
  function searchPatologias(query: string) {
    setPatologiaBusca(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) {
      setPatologiaResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setPatologiaLoading(true)
      try {
        const res = await fetch(`/api/manual-clinico?busca=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        setPatologiaResults(data.patologias || [])
      } catch {
        setPatologiaResults([])
      } finally {
        setPatologiaLoading(false)
      }
    }, 300)
  }

  function selectPatologia(pat: PatologiaResult) {
    const displayText = patologiaSelection.text || pat.nome
    const linkMarkup = `[${displayText}](/manual-clinico/${pat.slug})`
    const cursorPos = patologiaSelection.start + linkMarkup.length
    const newValue = value.substring(0, patologiaSelection.start) +
      linkMarkup +
      value.substring(patologiaSelection.end)
    pendingCursor.current = { pos: cursorPos, scrollTop: textareaRef.current?.scrollTop || 0 }
    onChange(newValue)
    setShowPatologiaModal(false)
    setPatologiaBusca('')
    setPatologiaResults([])
  }

  function openEmbedModal(type: 'video' | 'audio' | 'image') {
    setEmbedType(type)
    setEmbedUrl('')
    setEmbedCaption('')
    setShowEmbedModal(true)
  }

  function confirmEmbed() {
    if (!embedUrl) return
    const ta = textareaRef.current
    const scrollTop = ta?.scrollTop || 0
    const pos = ta?.selectionStart ?? value.length

    // Ensure embed is on its own line
    const before = value.substring(0, pos)
    const after = value.substring(pos)
    const needNewlineBefore = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    const needNewlineAfter = after.length > 0 && !after.startsWith('\n') ? '\n' : ''
    const embedMarkup = `${needNewlineBefore}!${embedType}[${embedCaption}](${embedUrl})${needNewlineAfter}`
    const cursorPos = pos + embedMarkup.length

    pendingCursor.current = { pos: cursorPos, scrollTop }
    onChange(before + embedMarkup + after)
    setShowEmbedModal(false)
    setEmbedUrl('')
    setEmbedCaption('')
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-1.5 p-1 rounded-t-lg border border-b-0 bg-muted/30 border-border">
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Negrito (**texto**)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Itálico (*texto*)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Link externo [texto](url)"
        >
          <Link className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handlePatologiaLink}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-accent transition-colors text-xs font-medium"
          title="Linkar a outra patologia"
        >
          <Stethoscope className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline text-muted-foreground">Linkar Patologia</span>
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          type="button"
          onClick={() => openEmbedModal('video')}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Inserir vídeo (YouTube)"
        >
          <Film className="h-4 w-4 text-red-400" />
        </button>
        <button
          type="button"
          onClick={() => openEmbedModal('audio')}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Inserir áudio (YouTube)"
        >
          <Volume2 className="h-4 w-4 text-violet-400" />
        </button>
        <button
          type="button"
          onClick={() => openEmbedModal('image')}
          className="p-1.5 rounded hover:bg-accent transition-colors"
          title="Inserir imagem (URL)"
        >
          <ImageIcon className="h-4 w-4 text-emerald-400" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-md rounded-t-none border bg-background text-sm resize-none overflow-hidden ${className}`}
        style={{ minHeight }}
      />

      {/* Link URL Modal */}
      {showLinkModal && (
        <div className="absolute z-50 top-12 left-0 right-0 mx-4">
          <div className="bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Inserir Link</h4>
              <button type="button" onClick={() => setShowLinkModal(false)} className="p-1 rounded hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Texto selecionado: <span className="font-medium text-foreground">&quot;{linkSelection.text}&quot;</span>
            </p>
            <Input
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://exemplo.com"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmLink() } }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkModal(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={confirmLink} disabled={!linkUrl}>
                Inserir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pathology Link Modal */}
      {showPatologiaModal && (
        <div className="absolute z-50 top-12 left-0 right-0 mx-4">
          <div className="bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Linkar a Patologia
              </h4>
              <button type="button" onClick={() => setShowPatologiaModal(false)} className="p-1 rounded hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            {patologiaSelection.text && (
              <p className="text-xs text-muted-foreground">
                Texto selecionado: <span className="font-medium text-foreground">&quot;{patologiaSelection.text}&quot;</span>
              </p>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={patologiaBusca}
                onChange={e => searchPatologias(e.target.value)}
                placeholder="Buscar patologia por nome..."
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {patologiaLoading && (
                <div className="text-center py-3">
                  <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              )}
              {!patologiaLoading && patologiaResults.length === 0 && patologiaBusca.trim() && (
                <p className="text-xs text-muted-foreground text-center py-3">Nenhuma patologia encontrada</p>
              )}
              {patologiaResults.map(pat => (
                <button
                  key={pat._id}
                  type="button"
                  onClick={() => selectPatologia(pat)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{pat.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{pat.sistema}</p>
                  </div>
                  <span className="text-xs text-primary shrink-0">Selecionar</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPatologiaModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal (Video / Audio / Image) */}
      {showEmbedModal && (
        <div className="absolute z-50 top-12 left-0 right-0 mx-4">
          <div className="bg-popover border border-border rounded-xl shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                {embedType === 'video' && <Film className="h-4 w-4 text-red-400" />}
                {embedType === 'audio' && <Volume2 className="h-4 w-4 text-violet-400" />}
                {embedType === 'image' && <ImageIcon className="h-4 w-4 text-emerald-400" />}
                {embedType === 'video' ? 'Inserir Vídeo' : embedType === 'audio' ? 'Inserir Áudio' : 'Inserir Imagem'}
              </h4>
              <button type="button" onClick={() => setShowEmbedModal(false)} className="p-1 rounded hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border/40">
              {(['video', 'audio', 'image'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEmbedType(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                    embedType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {t === 'video' && <Film className="h-3 w-3" />}
                  {t === 'audio' && <Volume2 className="h-3 w-3" />}
                  {t === 'image' && <ImageIcon className="h-3 w-3" />}
                  {t === 'video' ? 'Vídeo' : t === 'audio' ? 'Áudio' : 'Imagem'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {embedType === 'image' ? 'URL da imagem' : 'URL do YouTube'}
              </label>
              <Input
                value={embedUrl}
                onChange={e => setEmbedUrl(e.target.value)}
                placeholder={embedType === 'image'
                  ? 'https://exemplo.com/imagem.png'
                  : 'https://youtube.com/watch?v=...'
                }
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmEmbed() } }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Legenda (opcional)
              </label>
              <Input
                value={embedCaption}
                onChange={e => setEmbedCaption(e.target.value)}
                placeholder="Descrição do conteúdo..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmEmbed() } }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground/60">
              {embedType === 'video' && 'O vídeo será embutido como player do YouTube.'}
              {embedType === 'audio' && 'O áudio será reproduzido via YouTube em formato compacto.'}
              {embedType === 'image' && 'A imagem será exibida inline com a legenda abaixo.'}
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowEmbedModal(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={confirmEmbed} disabled={!embedUrl.trim()}>
                Inserir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

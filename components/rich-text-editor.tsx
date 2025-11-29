'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bold, Italic, List, Link as LinkIcon, Image, FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertFormatting(before: string, after: string = '') {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end)

    onChange(newText)

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  function handleBold() {
    insertFormatting('<strong>', '</strong>')
  }

  function handleItalic() {
    insertFormatting('<em>', '</em>')
  }

  function handleList() {
    insertFormatting('<ul>\n  <li>', '</li>\n</ul>')
  }

  function handleLink() {
    const url = prompt('Digite a URL:')
    if (url) {
      insertFormatting(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>')
    }
  }

  function handleParagraph() {
    insertFormatting('<p>', '</p>')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-t-lg border border-b-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleList}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLink}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleParagraph}
          title="Parágrafo"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Digite seu conteúdo aqui... Você pode usar HTML para formatação.'}
        className="min-h-[300px] font-mono text-sm rounded-t-none"
      />
      <div className="text-xs text-muted-foreground">
        💡 Dica: Selecione o texto e clique nos botões acima para formatar. Você também pode usar HTML diretamente.
      </div>
    </div>
  )
}

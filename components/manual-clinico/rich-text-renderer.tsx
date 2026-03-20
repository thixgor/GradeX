'use client'

import Link from 'next/link'
import { Fragment } from 'react'

/**
 * Parses text with inline markup:
 *  **bold** → <strong>
 *  *italic* → <em>
 *  [text](url) → <a> or <Link> (internal)
 *
 * Preserves newlines as <br />.
 */

interface Token {
  type: 'text' | 'bold' | 'italic' | 'link'
  content: string
  href?: string
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  // Regex to match **bold**, *italic*, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: line.substring(lastIndex, match.index) })
    }

    if (match[1]) {
      // **bold**
      tokens.push({ type: 'bold', content: match[2] })
    } else if (match[3]) {
      // *italic*
      tokens.push({ type: 'italic', content: match[4] })
    } else if (match[5]) {
      // [text](url)
      tokens.push({ type: 'link', content: match[6], href: match[7] })
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < line.length) {
    tokens.push({ type: 'text', content: line.substring(lastIndex) })
  }

  return tokens
}

function RenderToken({ token }: { token: Token }) {
  switch (token.type) {
    case 'bold':
      return <strong className="font-bold text-foreground">{token.content}</strong>
    case 'italic':
      return <em className="italic text-foreground/80">{token.content}</em>
    case 'link': {
      const isInternal = token.href?.startsWith('/') || token.href?.startsWith('#')
      if (isInternal) {
        return (
          <Link
            href={token.href!}
            className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 font-medium transition-colors"
          >
            {token.content}
          </Link>
        )
      }
      return (
        <a
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 font-medium transition-colors"
        >
          {token.content}
        </a>
      )
    }
    default:
      return <>{token.content}</>
  }
}

interface RichTextRendererProps {
  text: string
  className?: string
}

export function RichTextRenderer({ text, className = '' }: RichTextRendererProps) {
  if (!text) return null

  const lines = text.split('\n')

  return (
    <div className={className}>
      {lines.map((line, lineIdx) => {
        if (line.trim() === '') {
          return <br key={lineIdx} />
        }

        const tokens = tokenizeLine(line)

        return (
          <Fragment key={lineIdx}>
            {lineIdx > 0 && lines[lineIdx - 1].trim() !== '' && <br />}
            {tokens.map((token, tokenIdx) => (
              <RenderToken key={tokenIdx} token={token} />
            ))}
          </Fragment>
        )
      })}
    </div>
  )
}

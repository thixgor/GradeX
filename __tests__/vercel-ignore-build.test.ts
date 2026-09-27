import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * `vercel-ignore-build.sh` decide se um push vira build na Vercel. Aqui o
 * script roda de verdade, num repositório git temporário. `exit 0` cancela o
 * build e `exit 1` deixa seguir, que é a convenção do `ignoreCommand`.
 *
 * O `git ls-remote` (regra do commit superado) é o único passo que iria à rede.
 * Um `git` falso na frente do PATH responde só a ele e repassa o resto ao git de
 * verdade. Um `timeout` falso também, porque nem todo sistema tem o do
 * coreutils. Sem isso o teste dependeria do GitHub.
 */

const SCRIPT = resolve(__dirname, '../vercel-ignore-build.sh')
const IGNORA = 0
const CONSTROI = 1

let raiz: string
let shims: string
let gitReal: string

function git(repo: string, ...args: string[]) {
  return execFileSync(gitReal, args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
    },
  }).trim()
}

function commit(repo: string, arquivos: Record<string, string>, data?: string) {
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(repo, caminho)), { recursive: true })
    writeFileSync(join(repo, caminho), conteudo)
  }
  git(repo, 'add', '-A')
  execFileSync(gitReal, ['commit', '-q', '-m', 'c'], {
    cwd: repo,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 't',
      GIT_AUTHOR_EMAIL: 't@t',
      GIT_COMMITTER_NAME: 't',
      GIT_COMMITTER_EMAIL: 't@t',
      ...(data ? { GIT_AUTHOR_DATE: data, GIT_COMMITTER_DATE: data } : {}),
    },
  })
  return git(repo, 'rev-parse', 'HEAD')
}

/** Repositório com um commit base e um commit novo por cima dele. */
function repoCom(mudanca: Record<string, string>, data?: string) {
  const repo = mkdtempSync(join(raiz, 'repo-'))
  git(repo, 'init', '-q')
  const base = commit(repo, { 'app/page.tsx': 'v1', 'README.md': 'v1' })
  const head = commit(repo, mudanca, data)
  return { repo, base, head }
}

function rodar(
  repo: string,
  env: Record<string, string>,
  lsRemote: { saida?: string; codigo?: number } = { codigo: 128 },
) {
  const r = spawnSync('sh', [SCRIPT], {
    cwd: repo,
    encoding: 'utf8',
    env: {
      PATH: `${shims}:${process.env.PATH}`,
      HOME: process.env.HOME ?? raiz,
      GIT_REAL: gitReal,
      LS_REMOTE_SAIDA: lsRemote.saida ?? '',
      LS_REMOTE_CODIGO: String(lsRemote.codigo ?? 0),
      ...env,
    },
  })
  return { codigo: r.status, saida: `${r.stdout}${r.stderr}` }
}

function envVercel(base: string, head: string, extra: Record<string, string> = {}) {
  return {
    VERCEL_ENV: 'production',
    VERCEL_GIT_PROVIDER: 'github',
    VERCEL_GIT_REPO_OWNER: 'thixgor',
    VERCEL_GIT_REPO_SLUG: 'GradeX',
    VERCEL_GIT_COMMIT_REF: 'master',
    VERCEL_GIT_COMMIT_SHA: head,
    VERCEL_GIT_PREVIOUS_SHA: base,
    ...extra,
  }
}

const OUTRO_SHA = 'a'.repeat(40)

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), 'ignore-build-'))
  shims = join(raiz, 'bin')
  mkdirSync(shims)
  gitReal = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim()

  writeFileSync(
    join(shims, 'git'),
    [
      '#!/bin/sh',
      'if [ "$1" = ls-remote ]; then',
      '  [ -n "$LS_REMOTE_SAIDA" ] && printf "%s\\n" "$LS_REMOTE_SAIDA"',
      '  exit "$LS_REMOTE_CODIGO"',
      'fi',
      'exec "$GIT_REAL" "$@"',
      '',
    ].join('\n'),
  )
  writeFileSync(join(shims, 'timeout'), '#!/bin/sh\nshift\nexec "$@"\n')
  chmodSync(join(shims, 'git'), 0o755)
  chmodSync(join(shims, 'timeout'), 0o755)
})

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true })
})

describe('preview de branch de agente', () => {
  it('não constrói preview de claude/*', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    const r = rodar(repo, envVercel(base, head, { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'claude/x' }))
    expect(r.codigo).toBe(IGNORA)
  })
})

describe('commit que já não é a ponta da branch', () => {
  it('não constrói quando a branch já aponta para outro commit', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    const r = rodar(repo, envVercel(base, head), { saida: `${OUTRO_SHA}\trefs/heads/master` })
    expect(r.codigo).toBe(IGNORA)
    expect(r.saida).toContain('vem atrás na fila')
  })

  it('constrói quando este commit é a ponta', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    const r = rodar(repo, envVercel(base, head), { saida: `${head}\trefs/heads/master` })
    expect(r.codigo).toBe(CONSTROI)
  })

  it('constrói quando o ls-remote falha', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    expect(rodar(repo, envVercel(base, head), { codigo: 128 }).codigo).toBe(CONSTROI)
  })

  it('constrói quando a resposta não é um SHA', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    const r = rodar(repo, envVercel(base, head), { saida: 'fatal: algo deu errado' })
    expect(r.codigo).toBe(CONSTROI)
  })

  it('constrói quando faltam as variáveis da Vercel', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' })
    const env = envVercel(base, head, { VERCEL_GIT_REPO_OWNER: '' })
    const r = rodar(repo, env, { saida: `${OUTRO_SHA}\trefs/heads/master` })
    expect(r.codigo).toBe(CONSTROI)
  })

  it('constrói commit com mais de uma hora (Redeploy manual)', () => {
    const { repo, base, head } = repoCom({ 'app/page.tsx': 'v2' }, '2020-01-01T00:00:00Z')
    const r = rodar(repo, envVercel(base, head), { saida: `${OUTRO_SHA}\trefs/heads/master` })
    expect(r.codigo).toBe(CONSTROI)
  })
})

describe('mudança que não entra no deploy', () => {
  it.each([
    ['documentação', { 'docs/guia.md': 'x' }],
    ['README', { 'README.md': 'v2' }],
    ['testes', { '__tests__/a.test.ts': 'x' }],
    ['scripts de manutenção', { 'scripts/ebooks/otimizar-imagens.py': 'x', 'scripts/a.mjs': 'x' }],
    ['worker fora da Vercel', { 'server/websocket-server.js': 'x' }],
    ['arte original na raiz', { 'img/logo.svg': '<svg/>' }],
  ])('não constrói quando só mexe em %s', (_nome, mudanca) => {
    const { repo, base, head } = repoCom(mudanca)
    expect(rodar(repo, envVercel(base, head)).codigo).toBe(IGNORA)
  })

  it.each([
    ['código do app', { 'app/page.tsx': 'v2' }],
    ['imagem servida pelo site', { 'public/img/logo.svg': '<svg/>' }],
    ['script servido pelo site', { 'public/patologia/scripts/a.mjs': 'x' }],
    ['configuração', { 'next.config.js': 'x' }],
    ['código junto com documentação', { 'app/page.tsx': 'v2', 'docs/guia.md': 'x' }],
  ])('constrói quando mexe em %s', (_nome, mudanca) => {
    const { repo, base, head } = repoCom(mudanca)
    expect(rodar(repo, envVercel(base, head)).codigo).toBe(CONSTROI)
  })

  it('constrói quando a base do último deploy não existe no clone', () => {
    const { repo, head } = repoCom({ 'docs/guia.md': 'x' })
    expect(rodar(repo, envVercel(OUTRO_SHA, head)).codigo).toBe(CONSTROI)
  })
})

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  ListChecks,
  FolderPlus,
} from 'lucide-react'
import { BancoImportacaoResult } from '@/lib/types/banco-questoes'
import { lerArquivoDeImportacao, resumir } from '@/lib/banco/importar-questoes'

/**
 * Importar questões em massa.
 *
 * A tela antiga tinha um botão só — "Importar" — e o resultado do arquivo só
 * aparecia depois de ele já ter sido gravado pela metade. Agora:
 *
 * - o arquivo é lido **no navegador enquanto se digita ou se solta o arquivo**,
 *   pelo mesmo módulo que a rota usa (lib/banco/importar-questoes.ts), então a
 *   contagem de questões e os erros de formato aparecem antes de qualquer
 *   requisição;
 * - "Conferir" pergunta ao servidor o que ainda falta saber — quais questões já
 *   existem no banco e quais níveis da hierarquia seriam criados — sem gravar
 *   nada;
 * - o botão de importar diz quantas questões vão entrar, e quando alguma tem
 *   erro ele diz isso na própria etiqueta ("Importar as 47 válidas") em vez de
 *   simplesmente travar: num arquivo de 500 questões, uma linha torta não pode
 *   ser motivo para não importar nada — mas também não pode entrar escondida.
 */

const EXEMPLO_TXT = `[OBJETIVA]
MÓDULO: Introdução à Medicina
TÓPICO: Anatomia Básica
ENUNCIADO: Qual estrutura anatômica é responsável pela condução do impulso nervoso do coração?\\nEsta é uma pergunta importante sobre fisiologia cardíaca.
IMAGEM: https://i.imgur.com/exemplo.png
A) Nó sinoatrial
B) Nó atrioventricular
C) Feixe de His
D) Fibras de Purkinje
E) Todas as anteriores
CORRETA: E
EXPLICAÇÃO: O sistema de condução cardíaco inclui todas essas estruturas.\\nElas trabalham em conjunto para coordenar a contração cardíaca.
DIFICULDADE: medio
FONTE: Prova Institucional 2023
ANO: 2023

[DISCURSIVA]
MÓDULO: Clínica Médica
TÓPICO: Semiologia
SUBTÓPICO: Ausculta cardíaca
ENUNCIADO: Descreva os principais achados semiológicos na ausculta de um paciente com estenose mitral.
RESPOSTA: Na estenose mitral, encontramos:\\n1) Ruflar diastólico em foco mitral\\n2) Estalido de abertura da valva mitral\\n3) Primeira bulha hiperfonética
EXPLICAÇÃO: A estenose mitral causa turbulência do fluxo durante a diástole ventricular.
DIFICULDADE: dificil`

export default function AdminImportarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conteudo, setConteudo] = useState('')
  const [nomeDoArquivo, setNomeDoArquivo] = useState('')
  const [importando, setImportando] = useState(false)
  const [conferindo, setConferindo] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const [resultado, setResultado] = useState<BancoImportacaoResult | null>(null)
  const entradaDeArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  // A mesma leitura que a rota faz, rodando aqui: o formato é conferido sem
  // rede, a cada tecla.
  const leitura = useMemo(
    () => (conteudo.trim() ? lerArquivoDeImportacao(conteudo) : null),
    [conteudo],
  )
  const podeImportar = !!leitura && leitura.questoes.length > 0
  const comErro = !!leitura && leitura.erros.length > 0

  async function enviar(validar: boolean) {
    if (!conteudo.trim()) return

    if (validar) setConferindo(true)
    else setImportando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/banco/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo, validar }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResultado({
          sucesso: false,
          totalImportadas: 0,
          erros: [{ linha: 0, mensagem: data.error || 'Erro ao processar a importação' }],
          questoesImportadas: [],
        })
        return
      }

      setResultado(data)

      if (!validar && data.totalImportadas > 0) {
        setConteudo('')
        setNomeDoArquivo('')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      setResultado({
        sucesso: false,
        totalImportadas: 0,
        erros: [{ linha: 0, mensagem: 'Erro ao processar a importação' }],
        questoesImportadas: [],
      })
    } finally {
      setConferindo(false)
      setImportando(false)
    }
  }

  function lerArquivo(file: File) {
    const reader = new FileReader()
    reader.onload = (event) => {
      setConteudo((event.target?.result as string) || '')
      setNomeDoArquivo(file.name)
      setResultado(null)
    }
    reader.readAsText(file)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) lerArquivo(file)
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/banco-questoes')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Importar Questões
                </h1>
                <p className="text-sm text-muted-foreground">
                  Importação em massa via arquivo TXT
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Área de importação */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo para Importar</CardTitle>
              <CardDescription>
                Solte o arquivo aqui, escolha do computador ou cole o texto. O formato é conferido
                enquanto você escreve — nada é gravado até você mandar importar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setArrastando(true)
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setArrastando(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) lerArquivo(file)
                }}
                className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
                  arrastando ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {nomeDoArquivo ? (
                    <>
                      Arquivo carregado: <strong>{nomeDoArquivo}</strong>
                    </>
                  ) : (
                    'Arraste o arquivo .txt para cá'
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => entradaDeArquivo.current?.click()}
                >
                  Escolher arquivo
                </Button>
                <Button variant="ghost" size="sm" className="mt-3 ml-2" onClick={() => setConteudo(EXEMPLO_TXT)}>
                  Carregar exemplo
                </Button>
                <input
                  ref={entradaDeArquivo}
                  type="file"
                  accept=".txt,.md,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div>
                <Label htmlFor="conteudo">Texto do arquivo</Label>
                <Textarea
                  id="conteudo"
                  value={conteudo}
                  onChange={(e) => {
                    setConteudo(e.target.value)
                    setResultado(null)
                  }}
                  rows={15}
                  placeholder="Cole o conteúdo do arquivo TXT aqui..."
                  className="mt-1 font-mono text-sm"
                />
              </div>

              {/* Leitura ao vivo, sem ida ao servidor */}
              {leitura && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1">
                      <ListChecks className="h-3.5 w-3.5" />
                      {leitura.questoes.length} questão(ões) reconhecida(s)
                    </Badge>
                    {leitura.erros.length > 0 && (
                      <Badge variant="destructive">{leitura.erros.length} erro(s)</Badge>
                    )}
                    {leitura.avisos.length > 0 && (
                      <Badge variant="outline">{leitura.avisos.length} aviso(s)</Badge>
                    )}
                  </div>

                  <Ocorrencias
                    titulo="Erros de formato — precisam ser corrigidos"
                    tom="erro"
                    itens={leitura.erros}
                  />
                  <Ocorrencias titulo="Avisos" tom="aviso" itens={leitura.avisos} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => enviar(false)}
                  disabled={importando || conferindo || !podeImportar}
                  className="flex-1 min-w-[12rem]"
                >
                  {importando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {!leitura?.questoes.length
                        ? 'Importar questões'
                        : comErro
                          ? `Importar as ${leitura.questoes.length} válidas`
                          : `Importar ${leitura.questoes.length} questão(ões)`}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => enviar(true)}
                  disabled={importando || conferindo || !conteudo.trim()}
                >
                  {conferindo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Conferindo...
                    </>
                  ) : (
                    'Conferir sem gravar'
                  )}
                </Button>
              </div>

              {comErro && (
                <p className="text-xs text-muted-foreground">
                  As questões com erro <strong>não entram</strong> — o resto entra normalmente. Se
                  preferir, corrija o arquivo pelas linhas apontadas acima e importe tudo de uma vez.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resultado */}
          {resultado && <Resultado resultado={resultado} />}

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Formato do Arquivo
              </CardTitle>
              <CardDescription>
                Cada questão começa com <code>[OBJETIVA]</code> ou <code>[DISCURSIVA]</code>. Use{' '}
                <code>\n</code> no texto para quebrar linha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Campos obrigatórios:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code>[OBJETIVA]</code> ou <code>[DISCURSIVA]</code> na primeira linha da questão</li>
                    <li><code>MÓDULO:</code> — nome do módulo</li>
                    <li><code>ENUNCIADO:</code> — texto da questão</li>
                    <li>Objetivas: alternativas <code>A) Texto</code> e <code>CORRETA: A</code></li>
                    <li>Discursivas: <code>RESPOSTA:</code> com a resposta modelo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Campos opcionais:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code>TÓPICO:</code> — sem ele a questão vai para o tópico &ldquo;Geral&rdquo;</li>
                    <li><code>SUBTÓPICO:</code> — nome do subtópico</li>
                    <li><code>IMAGEM:</code> — URL da imagem do enunciado (<code>IMAGEM A:</code> para uma alternativa)</li>
                    <li><code>EXPLICAÇÃO:</code> — comentário da resposta</li>
                    <li><code>DIFICULDADE:</code> — facil, medio ou dificil</li>
                    <li><code>TAGS:</code> — separadas por vírgula</li>
                    <li><code>FONTE:</code>, <code>ANO:</code>, <code>SEMESTRE:</code> (1 ou 2)</li>
                    <li><code>PERÍODO:</code> — aceito e ignorado; o nível saiu da organização</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">O que o leitor aceita:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Rótulos sem acento e em qualquer caixa (<code>modulo:</code> = <code>MÓDULO:</code>)</li>
                    <li>Sinônimos: <code>GABARITO:</code>, <code>COMENTÁRIO:</code>, <code>PERGUNTA:</code></li>
                    <li>Alternativas como <code>A)</code>, <code>a.</code>, <code>(A)</code> ou <code>A -</code>, em várias linhas</li>
                    <li>Questões separadas por linha em branco — ou coladas uma na outra</li>
                    <li>Questão repetida no arquivo, ou que já está no banco, entra uma vez só</li>
                  </ul>
                </div>

                <Button variant="outline" size="sm" onClick={() => setConteudo(EXEMPLO_TXT)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Carregar Exemplo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function Ocorrencias({
  titulo,
  tom,
  itens,
}: {
  titulo: string
  tom: 'erro' | 'aviso'
  itens: { linha: number; mensagem: string }[]
}) {
  if (itens.length === 0) return null

  return (
    <div>
      <h4
        className={`mb-2 flex items-center gap-2 text-sm font-medium ${
          tom === 'erro' ? 'text-destructive' : 'text-amber-600 dark:text-amber-500'
        }`}
      >
        {tom === 'erro' ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {titulo} ({itens.length})
      </h4>
      <ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2 text-sm">
        {itens.map((item, i) => (
          <li key={i} className="leading-snug">
            {item.linha > 0 && <strong className="tabular-nums">Linha {item.linha}: </strong>}
            {item.mensagem}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Resultado({ resultado }: { resultado: BancoImportacaoResult }) {
  const conferencia = resultado.validacao === true
  const hierarquia = resultado.hierarquiaCriada
  const criouAlgo =
    !!hierarquia &&
    hierarquia.modulos.length + hierarquia.topicos.length + hierarquia.subtopicos.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {resultado.sucesso ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          {conferencia ? 'Conferência do arquivo' : 'Resultado da Importação'}
        </CardTitle>
        {conferencia && <CardDescription>Nada foi gravado — isto é só o que aconteceria.</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {conferencia ? (
          <Alert>
            <ListChecks className="h-4 w-4" />
            <AlertTitle>{resultado.totalAImportar ?? 0} questão(ões) entrariam</AlertTitle>
            <AlertDescription>
              {resultado.totalIgnoradas
                ? `${resultado.totalIgnoradas} já existem no banco e seriam ignoradas.`
                : 'Nenhuma delas já existe no banco.'}
            </AlertDescription>
          </Alert>
        ) : (
          resultado.totalImportadas > 0 && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Pronto!</AlertTitle>
              <AlertDescription>
                {resultado.totalImportadas} questão(ões) importada(s).
                {resultado.totalIgnoradas
                  ? ` ${resultado.totalIgnoradas} já estavam no banco e não entraram de novo.`
                  : ''}
              </AlertDescription>
            </Alert>
          )
        )}

        {!conferencia && resultado.totalImportadas === 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Nenhuma questão entrou</AlertTitle>
            <AlertDescription>
              {resultado.totalIgnoradas
                ? `As ${resultado.totalIgnoradas} questões do arquivo já estavam no banco.`
                : 'Veja os erros abaixo.'}
            </AlertDescription>
          </Alert>
        )}

        {criouAlgo && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FolderPlus className="h-4 w-4" />
              {conferencia ? 'Seriam criados na hierarquia' : 'Criados na hierarquia'}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {hierarquia!.modulos.map((n) => (
                <Badge key={`m-${n}`} variant="secondary">Módulo: {n}</Badge>
              ))}
              {hierarquia!.topicos.map((n) => (
                <Badge key={`t-${n}`} variant="outline">Tópico: {n}</Badge>
              ))}
              {hierarquia!.subtopicos.map((n) => (
                <Badge key={`s-${n}`} variant="outline">Subtópico: {n}</Badge>
              ))}
            </div>
          </div>
        )}

        <Ocorrencias titulo="Erros" tom="erro" itens={resultado.erros || []} />
        <Ocorrencias titulo="Avisos" tom="aviso" itens={resultado.avisos || []} />

        {resultado.questoesImportadas.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Amostra do que entrou ({resultado.questoesImportadas.length} de {resultado.totalImportadas}):
            </h4>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {resultado.questoesImportadas.map((q, index) => (
                <div key={index} className="flex items-center gap-2 rounded bg-muted p-2">
                  <Badge variant={q.tipo === 'objetiva' ? 'default' : 'secondary'}>{q.tipo}</Badge>
                  <span className="flex-1 truncate text-sm">{resumir(q.enunciado, 110)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

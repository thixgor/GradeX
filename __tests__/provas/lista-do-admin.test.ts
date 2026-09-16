import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `/admin/exams` não pode voltar a pedir o acervo inteiro.
 *
 * ## O que quebrou
 *
 * A tela abria em "Não foi possível carregar as provas". No console havia só
 * isso — a resposta não trazia mensagem, e o `catch` do servidor não registrava
 * nada, porque a rota terminava bem e era a RESPOSTA que não cabia: o painel
 * chamava `GET /api/exams` sem parâmetro, o recorte que devolve o documento
 * completo de todas as provas visíveis, com o `questions[]` de cada uma dentro
 * — enunciado, alternativas, resposta comentada e imagens.
 *
 * Enquanto o catálogo era pequeno isso passava despercebido. A falha chega
 * quando o acervo cresce, o que a torna permanente: recarregar não ajuda, e ela
 * piora a cada prova nova.
 *
 * ## O contrato que estes testes travam
 *
 * 1. A lista do admin pede `campos=admin`.
 * 2. `campos=admin` exclui `questions` da projeção.
 * 3. O cartão não depende de varrer `questions[]` para saber se há discursiva —
 *    quem responde isso é o servidor, por `temDiscursivas`.
 * 4. Quem precisa das questões de UMA prova as busca em `/api/exams/[id]`.
 *
 * São verificações sobre o texto do código porque o que se perde aqui não é um
 * cálculo: é alguém apagar um parâmetro de query numa refatoração e a tela
 * voltar a baixar megabytes para desenhar uma grade de cartões.
 */

const RAIZ = path.resolve(__dirname, '../..')
const ler = (relativo: string) => readFileSync(path.join(RAIZ, relativo), 'utf8')

const PAGINA = ler('app/admin/exams/page.tsx')
const ROTA = ler('app/api/exams/route.ts')
const CARTAO = ler('components/admin/provas/cartao-de-prova.tsx')

describe('a lista de /admin/exams', () => {
  it('pede o recorte do admin, não o documento completo', () => {
    expect(PAGINA).toContain("fetch('/api/exams?campos=admin'")
  })

  it('não tem mais nenhuma leitura da lista sem recorte', () => {
    // `GET /api/exams` sem parâmetro é o dump do catálogo. O `DELETE` da mesma
    // URL (apagar todas as provas) não devolve documento nenhum e por isso não
    // entra na conta.
    const semRecorte = PAGINA.match(/fetch\('\/api\/exams'(?![^)]*method:\s*'DELETE')/g) || []
    expect(semRecorte).toHaveLength(0)
  })

  it('mostra o motivo da falha, e não só que ela houve', () => {
    // A mensagem fixa anterior escondia a diferença entre sessão expirada,
    // erro do servidor e resposta grande demais — e foi a última que aconteceu.
    expect(PAGINA).toContain('HTTP ${res.status}')
  })

  it('busca as questões de uma prova só quando precisa delas', () => {
    // O PDF e o painel ao vivo: um pedido por clique, sobre uma prova.
    expect(PAGINA).toContain('`/api/exams/${id}`')
    expect(PAGINA).toContain('`/api/exams/${provaAoVivoId}`')
  })
})

describe('GET /api/exams?campos=admin', () => {
  it('existe como recorte próprio', () => {
    expect(ROTA).toContain("request.nextUrl.searchParams.get('campos') === 'admin'")
  })

  it('exclui o banco de questões da projeção', () => {
    expect(ROTA).toContain('{ projection: { questions: 0 } }')
  })

  it('responde "tem discursiva?" sem trazer as questões', () => {
    // `distinct` devolve ids, não documentos — e sobre os ids que a listagem
    // já resolveu, então o recorte não alcança prova que ela não devolveria.
    expect(ROTA).toContain("examsCollection.distinct('_id'")
    expect(ROTA).toContain("'questions.type': 'discursive'")
    expect(ROTA).toContain('temDiscursivas: idsComDiscursiva.has(chave)')
  })
})

describe('o cartão da prova', () => {
  it('usa o booleano do servidor antes de varrer as questões', () => {
    expect(CARTAO).toContain("typeof (prova as any).temDiscursivas === 'boolean'")
  })
})

import { describe, expect, it } from 'vitest'
import { ocultarConteudo } from '@/lib/banco/acesso-servidor'

describe('ocultarConteudo', () => {
  const questao = {
    _id: 'q1',
    moduloId: 'm1',
    tipo: 'objetiva',
    dificuldade: 'media',
    ano: 2024,
    enunciado: 'Paciente de 45 anos…',
    alternativas: [{ letra: 'A', texto: '…', correta: true }],
    respostaModelo: '…',
    explicacao: 'A correta é…',
    imagemUrl: '/midia/aa/enunciado.webp',
    imagensAlternativas: [{ letra: 'A', url: '/midia/aa/alt.webp' }],
    imagens: [{ url: '/midia/aa/lamina.webp' }],
    imagensExplicacao: [{ url: '/midia/aa/fluxograma.webp' }],
  }

  it('não deixa sair nada que seja conteúdo — texto nem imagem', () => {
    const oculta = ocultarConteudo(questao) as Record<string, unknown>
    for (const campo of [
      'enunciado',
      'alternativas',
      'respostaModelo',
      'explicacao',
      'imagemUrl',
      'imagensAlternativas',
      'imagens',
      'imagensExplicacao',
    ]) {
      expect(oculta).not.toHaveProperty(campo)
    }
    expect(JSON.stringify(oculta)).not.toContain('/midia/')
  })

  it('mantém o que identifica a questão para a pessoa escolher onde gastar o saldo', () => {
    expect(ocultarConteudo(questao)).toMatchObject({
      _id: 'q1',
      moduloId: 'm1',
      tipo: 'objetiva',
      dificuldade: 'media',
      ano: 2024,
      bloqueada: true,
    })
  })
})

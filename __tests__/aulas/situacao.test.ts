import { describe, expect, it } from 'vitest'
import { estaVazia, selosDeAcesso, situacaoDaAula } from '@/lib/aulas/situacao'
import { PLUS_LABEL } from '@/lib/account-tier'

const AGORA = new Date('2026-08-16T12:00:00Z')
const ONTEM = new Date('2026-08-15T12:00:00Z').toISOString()
const AMANHA = new Date('2026-08-17T12:00:00Z').toISOString()

describe('situacaoDaAula', () => {
  it('publica o que já liberou e não encerrou', () => {
    expect(situacaoDaAula({ dataLiberacao: ONTEM }, AGORA).id).toBe('publicada')
  })

  it('marca como agendada o que ainda não chegou a hora', () => {
    const selo = situacaoDaAula({ dataLiberacao: AMANHA }, AGORA)
    expect(selo.id).toBe('agendada')
    // A data entra no selo: "agendada" sem quando não ajuda a decidir nada.
    expect(selo.detalhe).toBeTruthy()
  })

  it('oculta vence a data agendada', () => {
    // Tirar do ar é uma decisão explícita; mostrar "Agendada" numa aula que o
    // admin acabou de esconder seria mentir sobre o que acontece.
    expect(situacaoDaAula({ oculta: true, dataLiberacao: AMANHA }, AGORA).id).toBe('oculta')
  })

  it('reconhece o fim da janela pelo mesmo campo que o motor de acesso lê', () => {
    expect(situacaoDaAula({ dataLiberacao: ONTEM, ocultarEm: ONTEM }, AGORA).id).toBe('encerrada')
  })

  it('trata data inválida como ausente, em vez de quebrar', () => {
    expect(situacaoDaAula({ dataLiberacao: 'nao-é-data' }, AGORA).id).toBe('publicada')
  })
})

describe('selosDeAcesso', () => {
  it('lê a visibilidade antiga sem precisar de migração', () => {
    // §45: aula legada continua descrita corretamente.
    expect(selosDeAcesso({ visibilidade: 'premium' })[0].rotulo).toBe(PLUS_LABEL)
    expect(selosDeAcesso({ visibilidade: 'gratuita' })[0].rotulo).toBe('Cadastrados')
  })

  it('prefere as regras novas quando elas existem', () => {
    const selos = selosDeAcesso({
      visibilidade: 'gratuita',
      regrasAcesso: {
        liberarPara: [{ tipo: 'material', itemId: 'x', titulo: 'Manual de ECG' }],
      },
    })
    // O selo tem que concordar com a trava de verdade — senão o admin vê
    // "Cadastrados" enquanto o servidor devolve cadeado.
    expect(selos.map((s) => s.rotulo)).toContain('Manual de ECG')
    expect(selos.map((s) => s.rotulo)).not.toContain('Cadastrados')
  })

  it('mostra amostra e vínculo com material', () => {
    const selos = selosDeAcesso({
      visibilidade: 'plus',
      regrasAcesso: { liberarPara: [{ tipo: 'plus' }], amostra: true },
      vinculoMaterial: { materialId: 'm1', materialTitulo: 'Curso de ECG' },
    })
    expect(selos.map((s) => s.rotulo)).toEqual(['Amostra', PLUS_LABEL, 'Vinculada a material'])
  })
})

describe('estaVazia', () => {
  it('acusa aula sem nenhum conteúdo', () => {
    expect(estaVazia({ visibilidade: 'plus' })).toBe(true)
  })

  it('não acusa quem tem vídeo, PDF ou botão', () => {
    expect(estaVazia({ videoEmbed: '<iframe/>' })).toBe(false)
    expect(estaVazia({ pdfs: [{ nome: 'a', url: 'b', tamanho: 1 }] })).toBe(false)
    expect(estaVazia({ botoesAcesso: [{ nome: 'Zoom', url: 'https://x' }] })).toBe(false)
  })

  it('não acusa quem busca o conteúdo de um material', () => {
    // O vídeo mora no material (§6): a aula estar "vazia" aqui é o esperado.
    expect(estaVazia({ vinculoMaterial: { materialId: 'm1' } })).toBe(false)
  })
})

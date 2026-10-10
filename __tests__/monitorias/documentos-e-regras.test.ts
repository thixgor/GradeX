import { describe, expect, it } from 'vitest'
import { paraWinAnsi, pdfDoComprovante, pdfDoContrato, pdfDoRepasse, pdfDosTermos } from '@/lib/monitorias/pdf'
import { secoesDoContrato, tituloDoContrato, hashDoContrato } from '@/lib/monitorias/documentos/contrato'
import { secoesDosTermos, VERSAO_TERMOS } from '@/lib/monitorias/documentos/termos'
import { requisitosDoAluno, requisitosDoMonitor, pendentes, idadeEmAnos } from '@/lib/monitorias/requisitos'
import { E2E_PIX } from '@/lib/monitorias/payout'
import type { DadosContrato } from '@/lib/monitorias/tipos'

const dados: DadosContrato = {
  numero: 'DA-MON-2026-000042',
  modeloVersao: '2026.10-v1',
  contratante: { userId: 'a', nome: 'Aluna Exemplo 🎓', cpf: '52998224725', email: 'aluna@x.com' },
  contratado: { userId: 'm', nome: 'Monitor Exemplo', cpf: '11144477735', email: 'mon@x.com' },
  anuncio: { id: 'an', titulo: 'ECG ≥ do zero — 漢字', materia: 'Cardiologia' },
  conteudos: ['Eixo elétrico', 'Arritmias'],
  inicio: '2026-10-19T22:30:00.000Z',
  fim: '2026-10-20T00:00:00.000Z',
  duracaoMin: 90,
  vagas: 3,
  valorCentavos: 4500,
  taxaPlataformaCentavos: 450,
  gratis: false,
  origem: 'direto',
  emitidoEm: '2026-10-10T12:00:00.000Z',
}

const ehPdf = (b: Uint8Array) => b.length > 1000 && Buffer.from(b.slice(0, 5)).toString() === '%PDF-'

describe('PDFs formais', () => {
  it('troca o que a fonte padrão não desenha, sem quebrar', () => {
    expect(paraWinAnsi('Olá, ação — “aspas” 🎓 漢')).toBe('Olá, ação — “aspas” ? ?')
    expect(paraWinAnsi('≥ 24h')).toBe('>= 24h')
  })

  it('gera o contrato com página de evidências, mesmo com emoji e outros alfabetos', async () => {
    const bytes = await pdfDoContrato({
      titulo: tituloDoContrato(dados),
      numero: dados.numero,
      status: 'Assinado pelas partes',
      hash: hashDoContrato(dados),
      codigoVerificacao: 'ABCDEFGH23',
      secoes: secoesDoContrato(dados),
      assinaturas: [
        { papel: 'contratado', nome: 'Monitor Exemplo', em: new Date(), ip: '1.2.3.4', metodo: 'oferta_padrao', referencia: 'Oferta 2026.10-v1', hash: hashDoContrato(dados) },
        { papel: 'contratante', nome: 'Aluna Exemplo', em: new Date(), ip: '5.6.7.8', metodo: 'codigo_email', hash: hashDoContrato(dados) },
      ],
    })
    expect(ehPdf(bytes)).toBe(true)
  })

  it('gera comprovante, demonstrativo e termos', async () => {
    const comprovante = await pdfDoComprovante({
      pedidoId: 'p1', pagamentoId: '123', pagoEm: new Date(), alunoNome: 'Aluna', alunoCpf: '52998224725', monitorNome: 'Monitor',
      anuncioTitulo: 'ECG', inicio: new Date(), duracao: '1h30', valorCentavos: 4500, taxaPixCentavos: 45, totalPagoCentavos: 4545,
      contratoNumero: dados.numero, status: 'Pago', reembolsos: [{ valorCentavos: 1000, em: new Date(), status: 'concluido', chave: 'refund:x:0' }],
    })
    const repasse = await pdfDoRepasse({
      titulo: 'Comprovante de repasse', monitorNome: 'Monitor', monitorCpf: '11144477735',
      itens: [{ descricao: 'ECG', brutoCentavos: 4500, taxaCentavos: 450, liquidoCentavos: 4050, status: 'Pago' }],
      totalCentavos: 4050, pix: '***.444.777-** (cpf)', e2eId: 'E12345678202610091200abcdefghijk', pagoEm: new Date(), identificador: 'Repasse 1',
    })
    const termos = await pdfDosTermos({ titulo: 'Termos', versao: VERSAO_TERMOS, secoes: secoesDosTermos('aluno') })
    expect([comprovante, repasse, termos].every(ehPdf)).toBe(true)
  })
})

describe('requisitos', () => {
  const completo = {
    name: 'Ana', fullName: 'Ana Souza', cpf: '52998224725', cpfVerified: false, dateOfBirth: new Date('2000-01-01'),
    phone: '11987654321', state: 'SP', profession: 'academico' as const, afyaUnit: 'X', periodoBase: 4, emailVerified: true,
  }
  it('monitor completo passa; sem foto/PIX/termos, não', () => {
    const ok = requisitosDoMonitor({ user: completo, tutor: { avatar: 'osler', pix: {} as any, status: 'ativo' }, termosAceitos: true, exigirCpfReceita: false, agora: new Date('2026-10-10') })
    expect(pendentes(ok)).toEqual([])
    const falta = requisitosDoMonitor({ user: completo, tutor: null, termosAceitos: false, exigirCpfReceita: true, agora: new Date('2026-10-10') })
    expect(pendentes(falta).map((i) => i.chave).sort()).toEqual(['cpf_receita', 'foto', 'pix', 'termos'])
  })
  it('menor de idade não anuncia; e-mail não verificado não contrata', () => {
    expect(idadeEmAnos(new Date('2010-05-01'), new Date('2026-10-10'))).toBe(16)
    const menor = requisitosDoMonitor({ user: { ...completo, dateOfBirth: new Date('2010-05-01') }, tutor: null, termosAceitos: true, exigirCpfReceita: false, agora: new Date('2026-10-10') })
    expect(pendentes(menor).some((i) => i.chave === 'idade')).toBe(true)
    const aluno = requisitosDoAluno({ user: { ...completo, emailVerified: false }, termosAceitos: true })
    expect(pendentes(aluno).map((i) => i.chave)).toEqual(['email'])
  })
})

describe('E2E do PIX', () => {
  it('aceita só o formato do BACEN (32 caracteres)', () => {
    expect(E2E_PIX.test('E12345678202610091200abcdefghijk')).toBe(true)
    expect(E2E_PIX.test('E1234567820261009120')).toBe(false)
    expect(E2E_PIX.test('X12345678202610091200abcdefghijk')).toBe(false)
    expect(E2E_PIX.test('E12345678202610091200abcdefghij!')).toBe(false)
  })
})

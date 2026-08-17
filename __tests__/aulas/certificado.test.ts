import { describe, expect, it } from 'vitest'
import {
  avaliarCertificado,
  descreverCertificado,
  formatarCodigo,
  gerarCodigo,
  normalizarCodigo,
  regrasDoCertificado,
  TAMANHO_DO_CODIGO,
} from '@/lib/aulas/certificado'

describe('regrasDoCertificado', () => {
  it('curso sem configuração NÃO oferece certificado', () => {
    // O contrário faria a plataforma inteira passar a emitir documentos no dia
    // do deploy, para cursos que nunca foram pensados para isso (§45).
    expect(regrasDoCertificado({}).habilitado).toBe(false)
    expect(regrasDoCertificado({ certificado: null }).habilitado).toBe(false)
    expect(regrasDoCertificado({ certificado: { percentualMinimo: 80 } }).habilitado).toBe(false)
  })

  it('exige o curso inteiro quando a régua não é informada', () => {
    const r = regrasDoCertificado({ certificado: { habilitado: true } })
    expect(r).toMatchObject({ habilitado: true, percentualMinimo: 100 })
  })

  it('recusa régua fora da faixa e cai no padrão', () => {
    expect(regrasDoCertificado({ certificado: { habilitado: true, percentualMinimo: 0 } }).percentualMinimo).toBe(100)
    expect(regrasDoCertificado({ certificado: { habilitado: true, percentualMinimo: 150 } }).percentualMinimo).toBe(100)
    expect(regrasDoCertificado({ certificado: { habilitado: true, percentualMinimo: 80 } }).percentualMinimo).toBe(80)
  })
})

describe('avaliarCertificado', () => {
  const habilitado = { habilitado: true, percentualMinimo: 100 }

  it('libera com o curso inteiro concluído', () => {
    const v = avaliarCertificado(habilitado, { concluidas: 10, total: 10 })
    expect(v).toMatchObject({ oferecido: true, elegivel: true, faltam: 0, percentual: 100 })
  })

  it('conta o que falta em AULAS, não em porcentagem', () => {
    // "Faltam 8%" não diz o que fazer; "faltam 2 aulas" diz.
    const v = avaliarCertificado(habilitado, { concluidas: 8, total: 10 })
    expect(v.faltam).toBe(2)
    expect(v.elegivel).toBe(false)
  })

  it('arredonda a régua para cima — meia aula não existe', () => {
    // 9 de 10 com régua de 95%: a resposta certa é "falta 1", nunca "falta 0,5".
    const v = avaliarCertificado(
      { habilitado: true, percentualMinimo: 95 },
      { concluidas: 9, total: 10 },
    )
    expect(v.faltam).toBe(1)
    expect(v.elegivel).toBe(false)
  })

  it('régua parcial libera antes do fim', () => {
    const v = avaliarCertificado(
      { habilitado: true, percentualMinimo: 80 },
      { concluidas: 8, total: 10 },
    )
    expect(v.elegivel).toBe(true)
  })

  it('curso desabilitado nunca é elegível, mesmo 100% concluído', () => {
    const v = avaliarCertificado(
      { habilitado: false, percentualMinimo: 100 },
      { concluidas: 10, total: 10 },
    )
    expect(v.oferecido).toBe(false)
    expect(v.elegivel).toBe(false)
  })

  it('curso vazio não emite certificado', () => {
    // Sem aulas, 0/0 daria 100% por vacuidade — e um certificado de curso vazio.
    const v = avaliarCertificado(habilitado, { concluidas: 0, total: 0 })
    expect(v.oferecido).toBe(false)
    expect(v.elegivel).toBe(false)
  })

  it('não deixa concluídas passar do total', () => {
    const v = avaliarCertificado(habilitado, { concluidas: 99, total: 10 })
    expect(v.percentual).toBe(100)
    expect(v.concluidas).toBe(10)
  })
})

describe('gerarCodigo', () => {
  it('evita os caracteres que se confundem ao ler ou digitar', () => {
    // Cada par ambíguo (0/O, 1/I/L) vira um "não encontrado" que parece fraude
    // e é só erro de leitura.
    const codigo = gerarCodigo(() => 0.999999)
    expect(codigo).not.toMatch(/[01OIL]/)
  })

  it('sai agrupado de quatro em quatro', () => {
    expect(gerarCodigo(() => 0.5)).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })

  it('usa o alfabeto inteiro', () => {
    const vistos = new Set<string>()
    for (let i = 0; i < 200; i += 1) {
      for (const ch of normalizarCodigo(gerarCodigo())) vistos.add(ch)
    }
    expect(vistos.size).toBeGreaterThan(20)
  })
})

describe('normalizarCodigo', () => {
  it('aceita com hífen, sem hífen e em minúscula', () => {
    expect(normalizarCodigo('abcd-2345-wxyz')).toBe('ABCD2345WXYZ')
    expect(normalizarCodigo('ABCD2345WXYZ')).toBe('ABCD2345WXYZ')
    expect(normalizarCodigo('  abcd 2345 wxyz  ')).toBe('ABCD2345WXYZ')
  })

  it('corta o excedente em vez de aceitar código longo', () => {
    expect(normalizarCodigo('A'.repeat(50))).toHaveLength(TAMANHO_DO_CODIGO)
  })
})

describe('formatarCodigo', () => {
  it('devolve agrupado quando o tamanho bate', () => {
    expect(formatarCodigo('abcd2345wxyz')).toBe('ABCD-2345-WXYZ')
  })

  it('não inventa grupos num código incompleto', () => {
    expect(formatarCodigo('ABC')).toBe('ABC')
  })
})

describe('descreverCertificado', () => {
  it('usa o retrato do momento da emissão', () => {
    // O curso ganha aulas depois; um certificado que passa a dizer "18 de 32"
    // porque o curso cresceu desmoraliza quem terminou as 18 que existiam.
    const texto = descreverCertificado({
      aulasConcluidas: 18,
      aulasTotais: 18,
      emitidoEm: new Date('2026-08-17T12:00:00Z'),
    })
    expect(texto).toContain('18 de 18 aulas')
    expect(texto).toContain('2026')
  })
})

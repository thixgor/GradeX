import { describe, expect, it } from 'vitest'
import {
  cnpjValido,
  cpfValido,
  detectarContato,
  detectarEmSequencia,
  normalizarParaDeteccao,
  pareceTelefone,
} from '@/lib/monitorias/contato-inteligente'

const bloqueia = (texto: string) => detectarContato(texto).nivel === 'bloqueio'
const categorias = (texto: string) => detectarContato(texto).categorias

describe('normalização', () => {
  it('dígitos exóticos, emoji de número, acento e invisíveis', () => {
    expect(normalizarParaDeteccao('２１ ⑨ 𝟗 2️⃣ Número')).toBe('21 9 9 2 numero')
    expect(normalizarParaDeteccao('9​8‍7')).toBe('987')
  })
})

describe('validadores', () => {
  it('CPF e CNPJ com dígito verificador', () => {
    expect(cpfValido('12345678909')).toBe(true)
    expect(cpfValido('12345678900')).toBe(false)
    expect(cpfValido('11111111111')).toBe(false)
    expect(cnpjValido('11222333000181')).toBe(true)
    expect(cnpjValido('11222333000182')).toBe(false)
  })

  it('telefone brasileiro', () => {
    expect(pareceTelefone('21987654321')).toBe(true)
    expect(pareceTelefone('5521987654321')).toBe(true)
    expect(pareceTelefone('02121987654321')).toBe(true)
    expect(pareceTelefone('2133334444')).toBe(true)
    expect(pareceTelefone('987654321')).toBe(true)
    expect(pareceTelefone('20987654321')).toBe(false) // DDD 20 não existe
    expect(pareceTelefone('21387654321')).toBe(false) // 9 dígitos sem o 9
    expect(pareceTelefone('12345')).toBe(false)
  })
})

describe('bloqueia contato', () => {
  it.each([
    'meu número é 21 98765-4321',
    '(21) 98765-4321',
    '21987654321',
    '+55 21 98765 4321',
    '+55 (21) 9 8765-4321',
    '9 8 7 6 5 4 3 2 1',
    '2 1 9 8 7 6 5 4 3 2 1',
    '2️⃣1️⃣9️⃣8️⃣7️⃣6️⃣5️⃣4️⃣3️⃣2️⃣1️⃣',
    'nove oito sete seis cinco quatro três dois um',
    'vinte e um... brincadeira: dois um nove oito sete seis cinco quatro três dois um',
    '21 nove 8765 4321',
    '21🔥98765🔥4321',
    'zap 21 98 76 54 321',
    '９８７６５-４３２１',
  ])('telefone: %s', (t) => {
    expect(categorias(t)).toContain('telefone')
  })

  it.each([
    'fulano@gmail.com',
    'meu email: fulano.silva_23@hotmail.com.br',
    'fulano arroba gmail ponto com',
    'fulano (at) gmail (dot) com',
    'fulano @ gmail . com',
    'manda pra fulano@gmail',
    'FULANO@GMAIL.COM',
  ])('e-mail: %s', (t) => {
    expect(categorias(t)).toContain('email')
  })

  it.each([
    'wa.me/5521987654321',
    'https://meet.google.com/abc-defg-hij',
    'http://bit.ly/xyz',
    'www.meusite.com.br',
    'bit . ly/abc',
    'acessa meusite.com',
    'instagram ponto com barra fulano',
    'fulano ponto com ponto br',
    't.me/fulano',
    't . me/fulano',
    'linktr.ee/fulano',
    'discord.gg/abc123',
    'chat.whatsapp.com/abcdef',
  ])('link: %s', (t) => {
    expect(categorias(t)).toContain('link')
  })

  it.each([
    'meu insta é @fulano.silva',
    'me segue @carlamed',
    'insta: fulanosilva',
    'meu @ é carlamed',
    '@carla_med23',
  ])('rede social: %s', (t) => {
    expect(categorias(t)).toContain('rede_social')
  })

  it.each(['meu cpf é 123.456.789-09', 'chave 12345678909', 'cnpj 11.222.333/0001-81'])('documento: %s', (t) => {
    expect(categorias(t)).toContain('documento')
  })

  it('chave PIX aleatória', () => {
    expect(categorias('pix: 123e4567-e89b-12d3-a456-426614174000')).toContain('chave_pix')
  })

  it.each([
    'me chama no zap',
    'me chama no whatsapp que é mais fácil',
    'vamos pro telegram',
    'bora conversar pelo insta',
    'te passo meu número',
    'te passo meu whats',
    'passa teu zap',
    'qual é o seu número?',
    'qual seu celular',
    'me add no insta',
    'meu zap é esse',
    'me manda mensagem no direct',
    'chama no privado',
    'vamos falar por email',
  ])('convite para fora: %s', (t) => {
    expect(categorias(t)).toContain('convite_externo')
  })

  it.each([
    'faço pix direto pra você',
    'paga direto comigo que sai mais barato',
    'fora da plataforma sai mais barato',
    'a gente combina o pagamento por fora',
    'sem a taxa da plataforma fica 80 reais',
    'te dou desconto se pagar direto',
    'quer fechar por fora? te cobro menos, 50 reais',
  ])('pagamento por fora: %s', (t) => {
    expect(categorias(t)).toContain('pagamento_por_fora')
  })
})

describe('não atrapalha a aula (falsos positivos)', () => {
  it.each([
    'PA 120/80, FC 96, FR 18, Sat 98%',
    'FC 80 90 100 110 nos quatro momentos',
    'dose de 500 mg de 8/8h',
    'paracetamol 750 mg 6/6h por 3 dias',
    'dia 17/10/2026 às 14h30',
    'a prova é 2026-11-05 às 08:00',
    'questões 12, 13 e 14',
    'questões 21 98 76 54 32 da lista',
    'o tumor cresce por fora da cápsula',
    'o pericárdio cobre o coração por fora',
    'Fim da aula. Com calma, revisem o ciclo.',
    'abre o aula.pdf e o resumo.docx',
    'nesse ponto com certeza cai na prova',
    'esse ponto me confunde',
    'raio x. com isso a gente vê a consolidação',
    'IgG e IgM positivos',
    'o DM tipo 2 tem resistência à insulina',
    'a conexão está instável',
    'qual o número da questão?',
    'te passo o número da questão depois',
    'meu celular tá sem bateria, vou trocar de aparelho',
    'leucócitos entre 4.000 e 11.000',
    'plaquetas 150.000 a 450.000',
    'no ciclo 2020-2021 mudou a diretriz',
    'Hb 12,5 Ht 37 VCM 88',
    'o tempo de contato com o paciente',
    'a parte da face anterior do braço',
    '@Carla, pode repetir o último slide?',
    'manda o slide de novo',
    'vamos fazer pelo meet? deu ruim aqui',
    'R$ 1.200,00 é o valor do curso',
    'liga acadêmica de cardiologia',
    'acesse www.domineaqui.com.br/monitorias',
    'domineaqui.com.br',
    'um dois três quatro cinco seis sete oito',
    'na página 10 por fora tem o esquema',
    'tô indo',
    'ok.to chegando',
  ])('passa: %s', (t) => {
    expect(detectarContato(t).nivel).not.toBe('bloqueio')
  })

  it('citar o WhatsApp só alerta (registra, mas envia)', () => {
    const r = detectarContato('o zap caiu aqui, voltei')
    expect(r.nivel).toBe('alerta')
    expect(r.categorias).toEqual(['convite_externo'])
  })

  it('texto vazio ou neutro', () => {
    expect(detectarContato('').nivel).toBeNull()
    expect(detectarContato('Bom dia! Vamos começar pelo ciclo cardíaco?').nivel).toBeNull()
  })
})

describe('mensagens partidas', () => {
  it('junta as últimas do mesmo autor quando a atual é número', () => {
    expect(detectarEmSequencia(['meu', '21 9876'], '54321').categorias).toContain('telefone')
    expect(detectarEmSequencia(['nove oito sete', 'seis cinco'], 'quatro três dois um').nivel).toBe('bloqueio')
  })

  it('não junta conversa normal', () => {
    expect(detectarEmSequencia(['FC 80', '90'], '100').nivel).toBeNull()
    expect(detectarEmSequencia(['questão 21'], 'entendi, obrigado').nivel).toBeNull()
    expect(detectarEmSequencia([], '98765').nivel).toBeNull()
  })

  it('não é engano por texto curto', () => {
    expect(bloqueia('ok')).toBe(false)
  })
})

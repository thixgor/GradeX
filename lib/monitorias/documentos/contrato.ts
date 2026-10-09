/**
 * Contrato de Prestação de Serviços de Monitoria.
 *
 * O contrato é montado a partir de um retrato CONGELADO dos dados
 * (`DadosContrato`) e o texto final (as seções) também é guardado no próprio
 * documento (`Contrato.secoes`). O hash SHA-256 é calculado sobre esse texto:
 * se qualquer vírgula mudar (valor, horário, nome), o hash muda e a assinatura
 * antiga deixa de valer — é isso que torna a assinatura verificável. E como o
 * texto fica guardado, mudar o MODELO aqui no código nunca altera um contrato
 * já emitido.
 *
 * Privacidade: o contrato é lido pelo aluno ANTES de pagar. Por isso ele traz
 * o CPF mascarado e nenhum e-mail — com o CPF inteiro (que muitas vezes é a
 * chave PIX do monitor) ou o e-mail, daria para pagar "por fora" e perder a
 * garantia. A qualificação completa fica sob guarda da plataforma (`dados`).
 */

import { createHash } from 'crypto'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { maskCpf } from '@/lib/cpf'
import { formatarCentavos } from '../dinheiro'
import { formatarDuracao } from '../agenda'
import type { DadosContrato } from '../tipos'
import { identificacaoDaPlataforma, PLATAFORMA, VERSAO_TERMOS, type SecaoDocumento } from './termos'

export const VERSAO_CONTRATO = '2026.10-v2'
export const VERSAO_OFERTA = '2026.10-v2'

export function sha256(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex')
}

function dataHora(iso: string): string {
  return `${formatarEmBrasilia(iso, { dateStyle: 'full', timeStyle: 'short' })} (horário de Brasília)`
}

/** Campos da intermediadora congelados na emissão (mudar o .env não muda contrato antigo). */
export function intermediadoraAtual(): NonNullable<DadosContrato['intermediadora']> {
  return { identificacao: identificacaoDaPlataforma(), foro: PLATAFORMA.foro, versaoTermos: VERSAO_TERMOS }
}

export function secoesDoContrato(d: DadosContrato): SecaoDocumento[] {
  const inter = d.intermediadora || intermediadoraAtual()
  const valor = d.gratis ? 'GRATUITA (R$ 0,00)' : `${formatarCentavos(d.valorCentavos)} por aluno`
  const cpf = (x: string) => maskCpf(x) || 'não informado'
  return [
    {
      titulo: 'Partes',
      paragrafos: [
        `CONTRATANTE (Aluno): ${d.contratante.nome}, CPF ${cpf(d.contratante.cpf)}, usuário identificado e com e-mail verificado na plataforma.`,
        `CONTRATADO (Monitor): ${d.contratado.nome}, CPF ${cpf(d.contratado.cpf)}, usuário identificado e com e-mail verificado na plataforma, prestador(a) autônomo(a) de serviços de monitoria.`,
        `INTERVENIENTE INTERMEDIADORA: ${inter.identificacao}, na qualidade de intermediadora tecnológica e gestora do pagamento, recebendo em nome e por conta do CONTRATADO (Código Civil, art. 653). Não presta o serviço de monitoria.`,
        'Os CPFs aparecem mascarados por proteção de dados (LGPD, art. 6º, III). A qualificação completa das partes fica sob guarda da INTERVENIENTE e será fornecida à parte que dela precisar para exercer direitos, ou a autoridades.',
      ],
    },
    {
      titulo: 'Cláusula 1ª — Objeto',
      paragrafos: [
        `1.1. O CONTRATADO prestará ao CONTRATANTE serviço de monitoria de "${d.anuncio.titulo}" (matéria: ${d.anuncio.materia}).`,
        `1.2. Conteúdos combinados: ${d.conteudos.length ? d.conteudos.join('; ') : 'conforme o anúncio e o chat da reserva'}.`,
        '1.3. Modalidade: online, por link de reunião fornecido pelo CONTRATADO na página da reserva, ou conforme combinado por escrito no chat da plataforma.',
        d.vagas > 1
          ? `1.4. Monitoria em grupo de até ${d.vagas} alunos. Cada aluno firma o próprio contrato e paga o próprio valor.`
          : '1.4. Monitoria individual.',
        '1.5. A monitoria tem caráter exclusivamente educacional e complementar: não é curso regular, não confere certificado ou crédito acadêmico e não constitui consulta, diagnóstico, prescrição ou orientação profissional para caso real.',
      ],
    },
    {
      titulo: 'Cláusula 2ª — Data, horário e duração',
      paragrafos: [
        `2.1. Início: ${dataHora(d.inicio)}.`,
        `2.2. Término previsto: ${dataHora(d.fim)}. Duração: ${formatarDuracao(d.duracaoMin)}.`,
        '2.3. Atraso superior a 15 minutos de qualquer parte, sem aviso no chat, caracteriza falta da parte atrasada.',
        '2.4. Mudança de data, horário, duração ou valor só vale se feita por nova proposta aceita pelas duas partes na plataforma, o que gera novo contrato.',
      ],
    },
    {
      titulo: 'Cláusula 3ª — Preço e pagamento',
      paragrafos: [
        `3.1. Valor da monitoria: ${valor}. Não há outros encargos além da taxa do meio de pagamento, destacada no checkout e paga pelo CONTRATANTE.`,
        d.gratis
          ? '3.2. Por ser gratuita, não há pagamento, garantia ou reembolso.'
          : '3.2. O pagamento é feito por PIX à INTERVENIENTE, que o recebe em nome e por conta do CONTRATADO e o retém em garantia até 48 horas após o término da monitoria.',
        d.gratis
          ? '3.3. As demais cláusulas valem integralmente.'
          : `3.3. Da quantia, a INTERVENIENTE retém ${formatarCentavos(d.taxaPlataformaCentavos)} (10%) como remuneração pela intermediação e repassa o saldo ao CONTRATADO por PIX após a garantia.`,
        '3.4. O CONTRATANTE declara ciência de que pagamento feito diretamente ao CONTRATADO, fora da plataforma, não tem garantia, contrato, comprovante nem reembolso.',
      ],
    },
    {
      titulo: 'Cláusula 4ª — Cancelamento e reembolso',
      paragrafos: [
        '4.1. Direito de arrependimento: em até 7 (sete) dias contados do pagamento, e desde que a monitoria não tenha começado, o CONTRATANTE pode desistir sem justificativa e recebe todo o valor pago, inclusive a taxa do PIX (CDC, art. 49; Decreto 7.962/2013, art. 5º).',
        '4.2. Fora desse prazo, cancelamento pelo CONTRATANTE com 24 horas ou mais de antecedência: reembolso integral, automático.',
        '4.3. Fora desse prazo, cancelamento pelo CONTRATANTE com menos de 24 horas: decisão fundamentada do suporte da INTERVENIENTE, considerando a antecedência, a possibilidade de reaproveitamento do horário e a boa-fé (Código Civil, art. 413). O não comparecimento do CONTRATANTE sem aviso, com o CONTRATADO presente, equivale a serviço prestado.',
        '4.4. Cancelamento ou falta do CONTRATADO: reembolso integral ao CONTRATANTE, sem prejuízo das penalidades previstas nos Termos de Serviço.',
        '4.5. Até 48 horas após o término, o CONTRATANTE pode reportar problema na plataforma; o valor fica retido até a decisão do suporte, ouvidas as duas partes.',
        '4.6. O reembolso é pedido ao Mercado Pago na hora da decisão e volta pelo mesmo meio de pagamento.',
      ],
    },
    {
      titulo: 'Cláusula 5ª — Obrigações das partes',
      paragrafos: [
        '5.1. O CONTRATADO: comparecer no horário; disponibilizar o link da reunião na página da reserva; prestar a monitoria com o conteúdo e a duração combinados; tratar o CONTRATANTE com respeito; não gravar sem consentimento expresso registrado no chat; cumprir suas obrigações fiscais sobre o que receber.',
        '5.2. O CONTRATANTE: manter os dados verdadeiros; comparecer no horário; tratar o CONTRATADO com respeito; não gravar sem consentimento expresso registrado no chat; não redistribuir o material recebido; não pedir que o CONTRATADO faça provas ou atividades avaliativas em seu lugar.',
      ],
    },
    {
      titulo: 'Cláusula 6ª — Responsabilidades',
      paragrafos: [
        '6.1. O CONTRATADO responde pelo conteúdo, qualidade, pontualidade, conduta e materiais da monitoria, inclusive materiais e links externos que indicar.',
        '6.2. A INTERVENIENTE não presta o serviço de monitoria. Ela responde, nos limites da lei e sem prejuízo dos direitos do CONTRATANTE como consumidor, pelos serviços que ela própria presta: tecnologia, processamento e guarda do pagamento, reembolsos previstos neste contrato e guarda dos registros.',
        '6.3. Não há vínculo empregatício, societário ou de subordinação entre quaisquer das partes.',
      ],
    },
    {
      titulo: 'Cláusula 7ª — Propriedade intelectual, imagem e dados',
      paragrafos: [
        '7.1. O material próprio do CONTRATADO continua de sua titularidade; o CONTRATANTE recebe licença de uso pessoal, não exclusiva e intransferível.',
        '7.2. A imagem e a voz de cada participante não podem ser gravadas, publicadas ou compartilhadas sem consentimento expresso (Código Civil, art. 20).',
        '7.3. Cada parte tratará os dados pessoais recebidos da outra apenas para executar este contrato, como controladora autônoma, nos termos da Lei 13.709/2018 (LGPD).',
      ],
    },
    {
      titulo: 'Cláusula 8ª — Disposições finais',
      paragrafos: [
        `8.1. Integram este contrato os Termos de Serviço da Monitoria (versão ${inter.versaoTermos}) aceitos pelas partes, o anúncio e as mensagens trocadas no chat da reserva. Havendo conflito, prevalece este contrato.`,
        '8.2. As partes admitem como válida a assinatura eletrônica deste instrumento, feita por aceite expresso e código de uso único enviado ao e-mail cadastrado, com registro de data, hora, IP, navegador e hash SHA-256 do conteúdo (MP 2.200-2/2001, art. 10, § 2º; Código Civil, art. 107; assinatura eletrônica simples, Lei 14.063/2020, art. 4º, I).',
        d.origem === 'direto'
          ? '8.3. Reserva feita por agendamento direto: a assinatura do CONTRATADO é a da oferta-padrão que ele assinou ao ativar essa modalidade, vigente no momento da reserva (Código Civil, art. 429).'
          : '8.3. Condições negociadas e aceitas por ambas as partes no chat da reserva.',
        '8.4. Se alguma cláusula for considerada inválida, as demais continuam valendo (Código Civil, art. 184).',
        `8.5. Foro: domicílio do CONTRATANTE (CDC, art. 101, I).${inter.foro && !/domic[ií]lio do consumidor/i.test(inter.foro) ? ` Nas questões entre CONTRATADO e INTERVENIENTE, foro da ${inter.foro}.` : ''}`,
      ],
    },
  ]
}

export function tituloDoContrato(d: Pick<DadosContrato, 'numero'>): string {
  return `Contrato de Prestação de Serviços de Monitoria nº ${d.numero}`
}

/**
 * Texto canônico: é sobre ele que o hash é calculado. `secoes` = as guardadas
 * no contrato (o que foi de fato assinado); sem elas, gera pelo modelo atual.
 */
export function textoDoContrato(d: DadosContrato, secoes: SecaoDocumento[] = secoesDoContrato(d)): string {
  return [
    tituloDoContrato(d),
    `Modelo ${d.modeloVersao} · emitido em ${d.emitidoEm}`,
    ...secoes.flatMap((s) => [s.titulo, ...s.paragrafos]),
  ].join('\n')
}

export function hashDoContrato(d: DadosContrato, secoes?: SecaoDocumento[]): string {
  return sha256(textoDoContrato(d, secoes))
}

// ─── Oferta-padrão do agendamento direto ────────────────────────────────

export interface DadosOferta {
  monitorNome: string
  anuncioTitulo: string
  materia: string
  precoTexto: string
  duracoesTexto: string
}

export function textoDaOferta(o: DadosOferta): string {
  return [
    'Oferta-padrão de Monitoria por Agendamento Direto',
    `Versão ${VERSAO_OFERTA}`,
    `Eu, ${o.monitorNome}, ofereço publicamente (Código Civil, art. 429) o serviço de monitoria "${o.anuncioTitulo}" (${o.materia}) a qualquer usuário que reservar um horário livre da minha agenda na plataforma ${PLATAFORMA.nome}, nas condições anunciadas: ${o.precoTexto}; durações de ${o.duracoesTexto}.`,
    'Comprometo-me a prestar cada monitoria reservada, no dia e horário de Brasília escolhidos, nos termos do Contrato de Prestação de Serviços de Monitoria e dos Termos de Serviço do Monitor, inclusive a política de cancelamento e o direito de arrependimento de 7 dias do aluno, e reconheço que esta assinatura vale como minha assinatura em cada contrato gerado por agendamento direto enquanto esta oferta estiver vigente.',
    'Manter minha agenda atualizada é obrigação minha. A oferta perde efeito para novas reservas quando eu alterar preço, durações ou desativar o agendamento direto — mas continua valendo para as reservas já feitas.',
  ].join('\n')
}

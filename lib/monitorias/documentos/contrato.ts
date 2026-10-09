/**
 * Contrato de Prestação de Serviços de Monitoria.
 *
 * O contrato é montado a partir de um retrato CONGELADO dos dados
 * (`DadosContrato`). O hash SHA-256 é calculado sobre o texto final: se
 * qualquer vírgula mudar (valor, horário, nome), o hash muda e a assinatura
 * antiga deixa de valer — é isso que torna a assinatura verificável.
 */

import { createHash } from 'crypto'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { formatCpf } from '@/lib/cpf'
import { formatarCentavos } from '../dinheiro'
import { formatarDuracao } from '../agenda'
import type { DadosContrato } from '../tipos'
import { PLATAFORMA, VERSAO_TERMOS, type SecaoDocumento } from './termos'

export const VERSAO_CONTRATO = '2026.10-v1'
export const VERSAO_OFERTA = '2026.10-v1'

export function sha256(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex')
}

function dataHora(iso: string): string {
  return `${formatarEmBrasilia(iso, { dateStyle: 'full', timeStyle: 'short' })} (horário de Brasília)`
}

export function secoesDoContrato(d: DadosContrato): SecaoDocumento[] {
  const valor = d.gratis ? 'GRATUITA (R$ 0,00)' : `${formatarCentavos(d.valorCentavos)} por aluno`
  return [
    {
      titulo: 'Partes',
      paragrafos: [
        `CONTRATANTE (Aluno): ${d.contratante.nome}, inscrito(a) no CPF sob o nº ${formatCpf(d.contratante.cpf)}, e-mail ${d.contratante.email}.`,
        `CONTRATADO (Monitor): ${d.contratado.nome}, inscrito(a) no CPF sob o nº ${formatCpf(d.contratado.cpf)}, e-mail ${d.contratado.email}, prestador(a) autônomo(a) de serviços de monitoria.`,
        `INTERVENIENTE INTERMEDIADORA: ${PLATAFORMA.nome} (${PLATAFORMA.site}), exclusivamente na qualidade de intermediadora tecnológica e de pagamento, não sendo parte da prestação de serviços.`,
      ],
    },
    {
      titulo: 'Cláusula 1ª — Objeto',
      paragrafos: [
        `1.1. O CONTRATADO prestará ao CONTRATANTE serviço de monitoria de "${d.anuncio.titulo}" (matéria: ${d.anuncio.materia}).`,
        `1.2. Conteúdos combinados: ${d.conteudos.length ? d.conteudos.join('; ') : 'conforme o anúncio e o chat da reserva'}.`,
        `1.3. Modalidade: online, por link de reunião fornecido pelo CONTRATADO na página da reserva, ou conforme combinado por escrito no chat da plataforma.`,
        d.vagas > 1
          ? `1.4. Monitoria em grupo de até ${d.vagas} alunos. Cada aluno firma o próprio contrato e paga o próprio valor.`
          : '1.4. Monitoria individual.',
      ],
    },
    {
      titulo: 'Cláusula 2ª — Data, horário e duração',
      paragrafos: [
        `2.1. Início: ${dataHora(d.inicio)}.`,
        `2.2. Término previsto: ${dataHora(d.fim)}. Duração: ${formatarDuracao(d.duracaoMin)}.`,
        '2.3. Atraso superior a 15 minutos de qualquer parte, sem aviso no chat, caracteriza falta da parte atrasada.',
      ],
    },
    {
      titulo: 'Cláusula 3ª — Preço e pagamento',
      paragrafos: [
        `3.1. Valor da monitoria: ${valor}.`,
        d.gratis
          ? '3.2. Por ser gratuita, não há pagamento, garantia ou reembolso.'
          : '3.2. O pagamento é feito por PIX à INTERVENIENTE, que o recebe em nome e por conta do CONTRATADO e retém o valor em garantia até 48 horas após o término da monitoria. A taxa do meio de pagamento é paga pelo CONTRATANTE e destacada no checkout.',
        d.gratis
          ? '3.3. —'
          : `3.3. Da quantia, a INTERVENIENTE retém ${formatarCentavos(d.taxaPlataformaCentavos)} (10%) como remuneração pela intermediação, e repassa o saldo ao CONTRATADO por PIX após a garantia.`,
        '3.4. O CONTRATANTE declara ciência de que pagamento feito diretamente ao CONTRATADO, fora da plataforma, não tem garantia, contrato ou reembolso.',
      ],
    },
    {
      titulo: 'Cláusula 4ª — Cancelamento e reembolso',
      paragrafos: [
        '4.1. Cancelamento pelo CONTRATANTE com 24 horas ou mais de antecedência: reembolso integral, automático.',
        '4.2. Cancelamento pelo CONTRATANTE com menos de 24 horas: análise pelo suporte da INTERVENIENTE, que poderá determinar reembolso total, parcial ou nenhum.',
        '4.3. Cancelamento ou falta do CONTRATADO: reembolso integral ao CONTRATANTE, sem prejuízo das penalidades previstas nos Termos de Serviço.',
        '4.4. Até 48 horas após o término, o CONTRATANTE pode reportar problema na plataforma; o valor fica retido até decisão do suporte.',
      ],
    },
    {
      titulo: 'Cláusula 5ª — Responsabilidades',
      paragrafos: [
        '5.1. O CONTRATADO responde exclusivamente pelo conteúdo, qualidade, pontualidade, conduta e materiais da monitoria, inclusive materiais e links externos que indicar, e pelas obrigações fiscais sobre o que receber.',
        '5.2. O CONTRATANTE responde pela veracidade dos seus dados, pela presença no horário e pelo uso adequado do material recebido, sendo vedada a gravação sem consentimento e a redistribuição sem autorização.',
        '5.3. A INTERVENIENTE não presta o serviço de monitoria e não responde por seu conteúdo, qualidade ou resultado. Sua responsabilidade, se houver, limita-se ao valor desta monitoria ainda retido em garantia.',
        '5.4. Não há vínculo empregatício, societário ou de subordinação entre quaisquer das partes.',
      ],
    },
    {
      titulo: 'Cláusula 6ª — Propriedade intelectual e dados',
      paragrafos: [
        '6.1. O material próprio do CONTRATADO continua de sua titularidade; o CONTRATANTE recebe licença de uso pessoal e intransferível.',
        '6.2. As partes tratarão os dados pessoais recebidos uma da outra apenas para a execução deste contrato, nos termos da Lei 13.709/2018 (LGPD).',
      ],
    },
    {
      titulo: 'Cláusula 7ª — Disposições finais',
      paragrafos: [
        `7.1. Integram este contrato os Termos de Serviço da Monitoria (versão ${VERSAO_TERMOS}) aceitos pelas partes, o anúncio e as mensagens trocadas no chat da reserva.`,
        '7.2. As partes reconhecem a validade da assinatura eletrônica deste instrumento, feita por aceite expresso e código enviado ao e-mail cadastrado, com registro de data, hora, IP e hash SHA-256 do conteúdo (Lei 14.063/2020; MP 2.200-2/2001, art. 10, § 2º).',
        d.origem === 'direto'
          ? '7.3. Reserva feita por agendamento direto: a assinatura do CONTRATADO é a da oferta-padrão que ele assinou ao ativar essa modalidade, vigente no momento da reserva.'
          : '7.3. Condições negociadas e aceitas por ambas as partes no chat da reserva.',
        `7.4. Foro: ${PLATAFORMA.foro}.`,
      ],
    },
  ]
}

export function tituloDoContrato(d: DadosContrato): string {
  return `Contrato de Prestação de Serviços de Monitoria nº ${d.numero}`
}

/** Texto canônico: é sobre ele que o hash é calculado. */
export function textoDoContrato(d: DadosContrato): string {
  return [
    tituloDoContrato(d),
    `Modelo ${d.modeloVersao} · emitido em ${d.emitidoEm}`,
    ...secoesDoContrato(d).flatMap((s) => [s.titulo, ...s.paragrafos]),
  ].join('\n')
}

export function hashDoContrato(d: DadosContrato): string {
  return sha256(textoDoContrato(d))
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
    `Eu, ${o.monitorNome}, ofereço publicamente o serviço de monitoria "${o.anuncioTitulo}" (${o.materia}) a qualquer usuário que reservar um horário livre da minha agenda na plataforma ${PLATAFORMA.nome}, nas condições anunciadas: ${o.precoTexto}; durações de ${o.duracoesTexto}.`,
    'Comprometo-me a prestar cada monitoria reservada, no dia e horário de Brasília escolhidos, nos termos do Contrato de Prestação de Serviços de Monitoria e dos Termos de Serviço do Monitor, e reconheço que esta assinatura vale como minha assinatura em cada contrato gerado por agendamento direto enquanto esta oferta estiver vigente.',
    'A oferta perde efeito para novas reservas quando eu alterar preço, durações ou desativar o agendamento direto — mas continua valendo para as reservas já feitas.',
  ].join('\n')
}

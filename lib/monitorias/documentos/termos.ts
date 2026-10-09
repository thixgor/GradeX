/**
 * Termos de Serviço da Monitoria — texto versionado.
 *
 * Mudou o texto? Suba a VERSÃO. O aceite gravado guarda versão + hash, então
 * dá para provar exatamente o que cada pessoa aceitou, e quem aceitou a versão
 * antiga precisa aceitar a nova antes de anunciar/contratar de novo.
 *
 * Observação para o dono da plataforma: o texto foi redigido para posicionar a
 * plataforma como intermediadora e transferir ao máximo a responsabilidade
 * pelo serviço às partes. O Código de Defesa do Consumidor, porém, não permite
 * afastar TODA a responsabilidade do intermediador perante o consumidor —
 * faça revisar por advogado antes de lançar em produção.
 */

import type { PapelTermos } from '../tipos'

export const VERSAO_TERMOS = '2026.10-v1'

export const PLATAFORMA = {
  nome: 'DomineAqui',
  site: 'https://www.domineaqui.com.br',
  contato: 'suporte pela Central de Ajuda da plataforma (Tickets)',
  foro: process.env.MONITORIAS_FORO || 'comarca do domicílio do consumidor, nos termos da lei',
}

export interface SecaoDocumento {
  titulo: string
  paragrafos: string[]
}

const COMUNS_INICIO: SecaoDocumento[] = [
  {
    titulo: '1. Definições',
    paragrafos: [
      '1.1. PLATAFORMA: o site e os serviços DomineAqui, que oferecem tecnologia para que usuários anunciem, contratem e paguem aulas de monitoria entre si.',
      '1.2. MONITOR: usuário que anuncia e presta, por conta própria, o serviço de monitoria.',
      '1.3. ALUNO: usuário que contrata a monitoria de um Monitor.',
      '1.4. MONITORIA: aula, explicação, revisão ou acompanhamento de estudos prestado pelo Monitor ao Aluno, em ambiente online ou como combinado entre as partes.',
      '1.5. CONTRATO DE MONITORIA: o instrumento eletrônico firmado entre Aluno e Monitor para cada monitoria, gerado pela Plataforma com os dados combinados (conteúdo, data, horário de Brasília, duração, valor).',
      '1.6. GARANTIA: período em que o valor pago pelo Aluno fica retido pela Plataforma até 48 (quarenta e oito) horas após o horário de término da monitoria, para viabilizar reclamações e reembolsos.',
    ],
  },
  {
    titulo: '2. Natureza da Plataforma',
    paragrafos: [
      '2.1. A Plataforma atua EXCLUSIVAMENTE como intermediadora tecnológica e de pagamento. Ela não presta o serviço de monitoria, não emprega, não seleciona pedagogicamente, não supervisiona nem orienta o conteúdo das aulas.',
      '2.2. O contrato de prestação de serviços de monitoria é celebrado diretamente entre Aluno e Monitor. A Plataforma não é parte desse contrato, figurando apenas como interveniente para fins de intermediação do pagamento e guarda de registros.',
      '2.3. A aprovação de um anúncio pela Plataforma é uma verificação formal mínima (dados cadastrais e adequação às regras de uso). Não constitui atestado de qualificação, competência, titulação, idoneidade ou qualidade do Monitor.',
      '2.4. Não há qualquer vínculo empregatício, societário, associativo, de representação ou de agência entre a Plataforma e o Monitor, nem entre a Plataforma e o Aluno.',
    ],
  },
]

const MONITOR: SecaoDocumento[] = [
  {
    titulo: '3. Cadastro e veracidade das informações',
    paragrafos: [
      '3.1. Para anunciar, o Monitor declara ser maior de 18 (dezoito) anos, civilmente capaz, e mantém seu cadastro 100% preenchido e verdadeiro, incluindo nome completo, CPF, telefone e e-mail verificado.',
      '3.2. O Monitor é o ÚNICO responsável pela veracidade de tudo o que publica: descrição, história, formação, experiência, vídeos, perguntas frequentes, preços e materiais. Informação falsa ou enganosa autoriza a suspensão imediata do anúncio e da conta, sem prejuízo de responsabilização civil e criminal.',
      '3.3. A chave PIX informada para recebimento deve ser de titularidade do próprio Monitor (mesmo CPF do cadastro). A Plataforma não se responsabiliza por repasses feitos à chave informada pelo Monitor, ainda que incorreta.',
    ],
  },
  {
    titulo: '4. Responsabilidade exclusiva do Monitor',
    paragrafos: [
      '4.1. O Monitor responde, de forma exclusiva e integral, pela prestação do serviço: conteúdo ensinado, metodologia, qualidade, pontualidade, comparecimento, duração, conduta e cumprimento do que foi combinado com o Aluno.',
      '4.2. O Monitor responde exclusivamente pelos materiais complementares que indicar ou disponibilizar, inclusive por links externos, garantindo que tem direito de compartilhá-los e que não violam direitos autorais, de imagem ou de terceiros. A Plataforma não hospeda, não revisa e não se responsabiliza por material acessado por link.',
      '4.3. O Monitor é responsável pelo link de reunião (Zoom, Meet ou similar), pelas configurações de privacidade da sala e por eventuais gravações, que só podem ocorrer com consentimento expresso do Aluno.',
      '4.4. O Monitor é o único responsável por obrigações fiscais, tributárias e previdenciárias decorrentes dos valores que recebe, inclusive eventual emissão de nota fiscal, recibo ou declaração de rendimentos.',
      '4.5. O Monitor declara que a prestação da monitoria não viola regras da sua instituição de ensino, de conselho profissional ou de contrato de trabalho/estágio, sendo exclusivamente seu o risco de eventual violação.',
      '4.6. É proibido ao Monitor: (a) receber pagamento fora da Plataforma por monitorias combinadas nela; (b) aplicar provas, trabalhos ou atividades avaliativas no lugar do Aluno ("fazer a prova por ele"); (c) ofertar conteúdo ilícito, discriminatório ou sexual; (d) coletar dados pessoais do Aluno para finalidade diversa da monitoria.',
    ],
  },
  {
    titulo: '5. Valores, taxa da Plataforma e repasse',
    paragrafos: [
      '5.1. O Aluno paga o valor da monitoria à Plataforma, via PIX processado pelo Mercado Pago. A taxa do meio de pagamento é paga pelo Aluno, destacada no checkout.',
      '5.2. A Plataforma retém 10% (dez por cento) do valor da monitoria como remuneração pela intermediação, tecnologia e garantia. Os 90% (noventa por cento) restantes são do Monitor.',
      '5.3. O valor fica em GARANTIA até 48 horas após o término da monitoria. Não havendo reclamação do Aluno nesse prazo, o valor do Monitor é liberado para repasse, que é feito por PIX à chave cadastrada, com comprovante e identificador da transação (E2E) disponíveis no painel do Monitor.',
      '5.4. Havendo reclamação, o valor permanece retido até a decisão do suporte, que pode determinar reembolso total ou parcial ao Aluno, deduzido da parte do Monitor.',
      '5.5. Estornos, contestações (chargeback) ou reembolsos ocorridos após o repasse geram saldo devedor do Monitor, compensado nos repasses seguintes; não havendo repasses futuros suficientes, o Monitor se obriga a restituir o valor à Plataforma.',
      '5.6. A troca de chave PIX exige confirmação por código enviado ao e-mail e só passa a valer após 48 horas, por segurança.',
    ],
  },
  {
    titulo: '6. Cancelamentos, faltas e penalidades do Monitor',
    paragrafos: [
      '6.1. Se o Monitor cancelar a monitoria a qualquer tempo, ou não comparecer, o Aluno é reembolsado em 100% e o Monitor recebe uma advertência ("strike").',
      '6.2. Três strikes em 90 (noventa) dias suspendem automaticamente o perfil de Monitor e pausam seus anúncios, a critério da Plataforma.',
      '6.3. A Plataforma pode suspender anúncios e perfis, reter valores em garantia e encerrar contas em caso de violação destes Termos, fraude, reclamações reiteradas ou ordem de autoridade.',
    ],
  },
  {
    titulo: '7. Oferta-padrão do agendamento direto',
    paragrafos: [
      '7.1. Ao ativar o agendamento direto, o Monitor assina uma OFERTA-PADRÃO: compromete-se a prestar a monitoria a qualquer Aluno que reservar um horário livre da sua agenda, dentro das durações e preços anunciados, sem necessidade de nova aceitação a cada reserva.',
      '7.2. Cada reserva por agendamento direto gera um Contrato de Monitoria em que a assinatura do Monitor é a da oferta-padrão vigente no momento da reserva.',
    ],
  },
  {
    titulo: '8. Indenização',
    paragrafos: [
      '8.1. O Monitor se obriga a manter a Plataforma indene e a ressarci-la de quaisquer valores, condenações, custas e honorários decorrentes de reclamações, ações ou processos relacionados ao serviço que prestou, aos materiais que indicou ou ao descumprimento destes Termos.',
    ],
  },
]

const ALUNO: SecaoDocumento[] = [
  {
    titulo: '3. Cadastro do Aluno',
    paragrafos: [
      '3.1. Para contratar, o Aluno mantém o cadastro 100% preenchido e verdadeiro, com CPF válido e e-mail verificado. Menores de 18 anos só podem contratar com autorização e acompanhamento do responsável legal, que responde pelos atos do menor.',
    ],
  },
  {
    titulo: '4. A contratação',
    paragrafos: [
      '4.1. O Aluno contrata o Monitor diretamente. A escolha do Monitor é de responsabilidade exclusiva do Aluno, que deve avaliar descrição, vídeos, avaliações e perguntas antes de contratar.',
      '4.2. A Plataforma não garante resultado acadêmico (aprovação, nota, desempenho), nem a adequação do conteúdo ao programa de qualquer instituição.',
      '4.3. Materiais complementares indicados por link são de responsabilidade exclusiva de quem os indicou. A Plataforma não hospeda, não revisa e não responde pelo seu conteúdo, disponibilidade ou segurança.',
      '4.4. É proibido ao Aluno: (a) pagar o Monitor fora da Plataforma por monitoria combinada nela — pagamentos por fora não têm garantia, contrato, comprovante nem reembolso; (b) gravar a aula sem consentimento do Monitor; (c) redistribuir material do Monitor sem autorização; (d) solicitar que o Monitor faça provas ou atividades avaliativas em seu lugar.',
    ],
  },
  {
    titulo: '5. Pagamento e garantia',
    paragrafos: [
      '5.1. O pagamento é feito por PIX, processado pelo Mercado Pago, à Plataforma, que atua como intermediadora. A taxa do meio de pagamento é destacada no checkout e paga pelo Aluno.',
      '5.2. O valor fica em garantia até 48 horas após o término da monitoria. Nesse prazo o Aluno pode reportar problema (falta do Monitor, aula não prestada, divergência grave do combinado).',
      '5.3. O Aluno recebe comprovante de pagamento e o Contrato de Monitoria em PDF, disponíveis a qualquer tempo no seu painel.',
    ],
  },
  {
    titulo: '6. Cancelamento e reembolso',
    paragrafos: [
      '6.1. Cancelamento pelo Aluno com 24 horas ou mais de antecedência do início: reembolso de 100% do valor pago, automático, pelo mesmo meio de pagamento.',
      '6.2. Cancelamento pelo Aluno com menos de 24 horas: a solicitação é encaminhada ao suporte, que decidirá sobre reembolso total, parcial ou nenhum, considerando as circunstâncias e a posição do Monitor.',
      '6.3. Cancelamento ou falta do Monitor: reembolso de 100% ao Aluno.',
      '6.4. Reembolsos são processados pelo Mercado Pago e podem levar alguns dias para aparecer, conforme o banco do Aluno.',
    ],
  },
]

const COMUNS_FIM = (numero: number): SecaoDocumento[] => [
  {
    titulo: `${numero}. Limitação de responsabilidade da Plataforma`,
    paragrafos: [
      `${numero}.1. Na máxima extensão permitida pela lei, a responsabilidade da Plataforma, por qualquer causa relacionada a uma monitoria, limita-se ao valor efetivamente pago por aquela monitoria e ainda retido em garantia.`,
      `${numero}.2. A Plataforma não responde por: conteúdo, qualidade, resultado ou conduta na monitoria; materiais e links externos; falhas de serviços de terceiros (plataformas de reunião, internet, bancos, Mercado Pago); danos indiretos, lucros cessantes ou perda de chance.`,
      `${numero}.3. A Plataforma pode indisponibilizar temporariamente o serviço para manutenção ou por motivo de força maior, sem que isso gere dever de indenizar.`,
    ],
  },
  {
    titulo: `${numero + 1}. Comunicação, chat e provas`,
    paragrafos: [
      `${numero + 1}.1. As partes concordam que mensagens no chat da Plataforma, propostas, aceites, assinaturas eletrônicas e registros de pagamento servem como prova do que foi combinado.`,
      `${numero + 1}.2. Antes do pagamento, contatos pessoais (telefone, e-mail, redes sociais) enviados no chat são ocultados automaticamente.`,
      `${numero + 1}.3. Os documentos são assinados eletronicamente (Lei 14.063/2020 e art. 10, § 2º, da MP 2.200-2/2001), mediante aceite expresso e código enviado ao e-mail cadastrado, com registro de data, hora, IP e resumo criptográfico (hash SHA-256) do conteúdo.`,
    ],
  },
  {
    titulo: `${numero + 2}. Dados pessoais (LGPD)`,
    paragrafos: [
      `${numero + 2}.1. A Plataforma trata nome, CPF, e-mail e dados de pagamento das partes para executar a intermediação, emitir contratos e comprovantes, prevenir fraudes e cumprir obrigações legais (Lei 13.709/2018, art. 7º, II, V e VI).`,
      `${numero + 2}.2. O CPF completo aparece apenas nos documentos acessíveis às partes do contrato e à administração. Telas públicas nunca exibem CPF ou e-mail.`,
      `${numero + 2}.3. Cada parte é controladora autônoma dos dados que receber da outra em razão da monitoria e responde pelo uso que fizer deles.`,
    ],
  },
  {
    titulo: `${numero + 3}. Disposições gerais`,
    paragrafos: [
      `${numero + 3}.1. Estes Termos podem ser atualizados. A nova versão será exibida para novo aceite antes da próxima contratação ou anúncio; contratos já assinados seguem a versão vigente na data da assinatura.`,
      `${numero + 3}.2. A tolerância a qualquer descumprimento não implica renúncia de direito.`,
      `${numero + 3}.3. Fica eleito o foro da ${PLATAFORMA.foro} para dirimir controvérsias.`,
    ],
  },
]

export function secoesDosTermos(papel: PapelTermos): SecaoDocumento[] {
  const especificas = papel === 'monitor' ? MONITOR : ALUNO
  const proximo = papel === 'monitor' ? 9 : 7
  return [...COMUNS_INICIO, ...especificas, ...COMUNS_FIM(proximo)]
}

export function tituloDosTermos(papel: PapelTermos): string {
  return papel === 'monitor'
    ? 'Termos de Serviço da Monitoria — Monitor'
    : 'Termos de Serviço da Monitoria — Aluno'
}

/** Texto canônico (o que entra no hash). */
export function textoDosTermos(papel: PapelTermos): string {
  return [
    tituloDosTermos(papel),
    `Versão ${VERSAO_TERMOS}`,
    ...secoesDosTermos(papel).flatMap((s) => [s.titulo, ...s.paragrafos]),
  ].join('\n')
}

/**
 * Termos de Serviço da Monitoria — texto versionado.
 *
 * Mudou o texto? Suba a VERSÃO. O aceite gravado guarda versão, hash E uma
 * cópia das seções aceitas (`AceiteTermos.secoes`), então dá para provar e
 * reimprimir exatamente o que cada pessoa aceitou, mesmo depois que o texto
 * do código mudar. Quem aceitou a versão antiga precisa aceitar a nova antes
 * de anunciar/assinar de novo.
 *
 * Como o texto foi pensado (para quem for revisar):
 *  - A plataforma é intermediadora tecnológica e gestora do pagamento, em nome
 *    e por conta do monitor (mandato, CC art. 653). A responsabilidade pela
 *    AULA é do monitor — mas o CDC não deixa afastar a responsabilidade da
 *    plataforma pelo que ELA presta (tecnologia, pagamento, guarda de valores e
 *    registros). Cláusula que tentasse isso seria nula (CDC art. 25 e art. 51,
 *    I) e ainda contaminaria a credibilidade do resto. Por isso há a ressalva
 *    expressa "nos limites do CDC" para o aluno.
 *  - Direito de arrependimento de 7 dias (CDC art. 49; Decreto 7.962/2013,
 *    art. 5º) preservado até o início da aula.
 *  - Identificação da empresa (Decreto 7.962/2013, art. 2º) vem do ambiente:
 *    MONITORIAS_EMPRESA_RAZAO, MONITORIAS_EMPRESA_CNPJ,
 *    MONITORIAS_EMPRESA_ENDERECO, MONITORIAS_EMPRESA_EMAIL. PREENCHA antes de
 *    lançar. Faça revisar por advogado.
 */

import type { PapelTermos } from '../tipos'

export const VERSAO_TERMOS = '2026.10-v4'

function env(nome: string): string {
  return (process.env[nome] || '').trim()
}

export const PLATAFORMA = {
  nome: 'DomineAqui',
  razaoSocial: env('MONITORIAS_EMPRESA_RAZAO'),
  cnpj: env('MONITORIAS_EMPRESA_CNPJ'),
  endereco: env('MONITORIAS_EMPRESA_ENDERECO'),
  email: env('MONITORIAS_EMPRESA_EMAIL'),
  site: 'https://www.domineaqui.com.br',
  contato: 'Central de Ajuda da plataforma (Tickets)',
  /** Foro do MONITOR (o do aluno é sempre o domicílio dele — CDC art. 101, I). */
  foro: env('MONITORIAS_FORO') || 'comarca do domicílio do consumidor, nos termos da lei',
}

/** "DomineAqui, nome fantasia de FULANO LTDA, CNPJ ..., com sede em ..." */
export function identificacaoDaPlataforma(): string {
  const partes = [
    PLATAFORMA.razaoSocial ? `${PLATAFORMA.nome}, nome de fantasia de ${PLATAFORMA.razaoSocial}` : PLATAFORMA.nome,
    PLATAFORMA.cnpj ? `inscrita no CNPJ sob o nº ${PLATAFORMA.cnpj}` : '',
    PLATAFORMA.endereco ? `com sede em ${PLATAFORMA.endereco}` : '',
    `site ${PLATAFORMA.site}`,
  ].filter(Boolean)
  return partes.join(', ')
}

function canalDeAtendimento(): string {
  return PLATAFORMA.email ? `${PLATAFORMA.contato} ou pelo e-mail ${PLATAFORMA.email}` : PLATAFORMA.contato
}

export interface SecaoDocumento {
  titulo: string
  paragrafos: string[]
}

const COMUNS_INICIO = (): SecaoDocumento[] => [
  {
    titulo: '1. Quem somos e definições',
    paragrafos: [
      `1.1. PLATAFORMA: ${identificacaoDaPlataforma()}. Atendimento: ${canalDeAtendimento()}.`,
      '1.2. MONITOR: usuário que anuncia e presta, por conta própria e como profissional autônomo, o serviço de monitoria.',
      '1.3. ALUNO: usuário que contrata a monitoria de um Monitor.',
      '1.4. MONITORIA: aula, explicação, revisão ou acompanhamento de estudos prestado pelo Monitor ao Aluno, de caráter educacional complementar, em ambiente online ou como combinado por escrito entre as partes.',
      '1.5. CONTRATO DE MONITORIA: o instrumento eletrônico firmado entre Aluno e Monitor para cada monitoria, gerado pela Plataforma com os dados combinados (conteúdo, data, horário de Brasília, duração, valor).',
      '1.6. GARANTIA: período em que o valor pago pelo Aluno fica retido pela Plataforma até 48 (quarenta e oito) horas após o horário de término da monitoria, para viabilizar reclamações e reembolsos.',
      '1.7. CHAT DA RESERVA: o canal de mensagens da Plataforma vinculado a cada monitoria, onde as partes negociam e registram o que foi combinado.',
      '1.8. MATERIAIS COMPLEMENTARES: conteúdos indicados pelo Monitor, normalmente por link externo, que não são hospedados nem revisados pela Plataforma.',
    ],
  },
  {
    titulo: '2. Natureza da Plataforma',
    paragrafos: [
      '2.1. A Plataforma atua como intermediadora tecnológica e gestora de pagamento. Ela NÃO presta o serviço de monitoria, não emprega, não seleciona pedagogicamente, não supervisiona nem orienta o conteúdo das aulas.',
      '2.2. O contrato de prestação de serviços de monitoria é celebrado diretamente entre Aluno e Monitor. A Plataforma figura apenas como interveniente, para fins de intermediação do pagamento, guarda dos valores durante a garantia e guarda dos registros.',
      '2.3. Ao receber o pagamento do Aluno, a Plataforma age em nome e por conta do Monitor, na qualidade de mandatária para recebimento (Código Civil, arts. 653 e seguintes), e repassa ao Monitor a parte que lhe cabe. A Plataforma não é instituição financeira nem de pagamento, não oferece conta, crédito ou investimento, e os valores retidos em garantia não rendem juros nem correção para nenhuma das partes.',
      '2.4. A aprovação de um anúncio é uma verificação formal mínima (dados cadastrais e adequação às regras de uso). Não é atestado de qualificação, titulação, competência, idoneidade ou qualidade do Monitor.',
      '2.5. A Plataforma não é instituição de ensino. A monitoria não é curso regular, não substitui aulas, estágios ou supervisão da instituição do Aluno e não confere certificado, diploma, carga horária ou crédito acadêmico.',
      '2.6. Não há vínculo empregatício, societário, associativo, de representação comercial ou de agência entre a Plataforma e o Monitor, nem entre a Plataforma e o Aluno, nem entre Aluno e Monitor além do próprio Contrato de Monitoria.',
    ],
  },
]

const MONITOR: SecaoDocumento[] = [
  {
    titulo: '3. Cadastro e veracidade das informações',
    paragrafos: [
      '3.1. Para anunciar, o Monitor declara ser maior de 18 (dezoito) anos e civilmente capaz, e mantém seu cadastro 100% preenchido e verdadeiro, incluindo nome completo, CPF, data de nascimento, telefone e e-mail verificado.',
      '3.2. O Monitor é o ÚNICO responsável pela veracidade de tudo o que publica: descrição, história, formação, experiência, vídeos, perguntas frequentes, preços e materiais. É proibido apresentar-se com título, registro profissional, cargo ou vínculo institucional que não possua. Informação falsa ou enganosa autoriza a suspensão do anúncio e da conta, sem prejuízo de responsabilização civil e criminal.',
      '3.3. A chave PIX informada para recebimento deve ser de titularidade do próprio Monitor (mesmo CPF do cadastro). Repasse feito à chave informada pelo Monitor é considerado pagamento válido e liberatório.',
    ],
  },
  {
    titulo: '4. Responsabilidade exclusiva do Monitor',
    paragrafos: [
      '4.1. O Monitor responde, de forma exclusiva e integral, pela prestação do serviço: conteúdo ensinado, metodologia, qualidade, pontualidade, comparecimento, duração, conduta e cumprimento do que foi combinado com o Aluno.',
      '4.2. O Monitor responde exclusivamente pelos materiais complementares que indicar ou disponibilizar, inclusive por links externos, garantindo que tem direito de compartilhá-los e que não violam direitos autorais (Lei 9.610/1998), de imagem ou de terceiros. A Plataforma não hospeda, não revisa e não se responsabiliza por material acessado por link.',
      '4.3. O conteúdo da monitoria é exclusivamente educacional. O Monitor não presta, por meio da monitoria, consulta, diagnóstico, prescrição, parecer ou qualquer orientação profissional para caso real (de saúde, jurídico ou outro), e deve recusar pedidos nesse sentido.',
      '4.4. O Monitor é responsável pelo link de reunião (Zoom, Meet ou similar), pelas configurações de privacidade da sala e por eventuais gravações, que só podem ocorrer com consentimento expresso de todos os participantes, registrado no chat da reserva.',
      '4.5. O Monitor é o único responsável pelas obrigações fiscais, tributárias e previdenciárias sobre os valores que recebe (por exemplo, imposto de renda e, se houver, ISS), inclusive emissão de nota fiscal ou recibo ao Aluno quando exigível. A Plataforma emite documento fiscal apenas sobre a sua própria taxa de intermediação, quando aplicável, e pode prestar às autoridades as informações exigidas por lei.',
      '4.6. O Monitor declara que a prestação da monitoria não viola regras da sua instituição de ensino, de conselho profissional ou de contrato de trabalho, estágio ou bolsa, sendo exclusivamente seu o risco de eventual violação.',
      '4.7. É proibido ao Monitor: (a) receber pagamento fora da Plataforma por monitorias combinadas nela, ou induzir o Aluno a isso; (b) realizar provas, trabalhos ou atividades avaliativas no lugar do Aluno, ou ajudar a fraudar avaliações e certames (Código Penal, art. 311-A); (c) ofertar conteúdo ilícito, discriminatório ou de cunho sexual; (d) coletar ou usar dados pessoais do Aluno para finalidade diversa da monitoria; (e) criar contas, avaliações ou perguntas falsas.',
    ],
  },
  {
    titulo: '5. Conduta, imagem e gravações',
    paragrafos: [
      '5.1. O Monitor trata Alunos com respeito e urbanidade. Assédio moral ou sexual, discriminação de qualquer natureza (Lei 7.716/1989), ameaça, exposição ou intimidação levam à suspensão imediata e podem ser comunicados às autoridades.',
      '5.2. Ao publicar vídeos de demonstração, foto e textos, o Monitor declara ser titular dos direitos ou ter autorização de quem aparece neles (Código Civil, art. 20) e autoriza a Plataforma, gratuitamente e enquanto o anúncio existir, a exibi-los na Plataforma e em sua divulgação.',
      '5.3. Encontros presenciais não são intermediados pela Plataforma. Se as partes os combinarem, fazem-no por sua conta e risco.',
    ],
  },
  {
    titulo: '6. Valores, taxa da Plataforma e repasse',
    paragrafos: [
      '6.1. O Aluno paga o valor da monitoria à Plataforma, via PIX processado pelo Mercado Pago, e a Plataforma o recebe em nome e por conta do Monitor. A taxa do meio de pagamento é paga pelo Aluno e destacada no checkout.',
      '6.2. A Plataforma retém 10% (dez por cento) do valor da monitoria como remuneração pela intermediação, tecnologia e garantia. Os 90% (noventa por cento) restantes pertencem ao Monitor.',
      '6.3. O valor fica em GARANTIA até 48 horas após o término da monitoria. Não havendo reclamação do Aluno nesse prazo, o valor do Monitor é liberado e repassado por PIX à chave cadastrada em até 7 (sete) dias úteis, com comprovante e identificador da transação (E2E) disponíveis no painel do Monitor.',
      '6.4. Havendo reclamação, o valor permanece retido até a decisão do suporte, que pode determinar reembolso total ou parcial ao Aluno, deduzido da parte do Monitor, sempre com fundamentação e oportunidade de manifestação das duas partes.',
      '6.5. Reembolsos, estornos ou contestações (chargeback) ocorridos depois do repasse geram saldo devedor do Monitor, que autoriza desde já a compensação com repasses seguintes (Código Civil, art. 368). Não havendo repasses suficientes, o Monitor restituirá o valor à Plataforma em até 10 (dez) dias da notificação.',
      '6.6. A troca de chave PIX exige confirmação por código enviado ao e-mail e só passa a valer após 48 horas, por segurança.',
    ],
  },
  {
    titulo: '7. Cancelamentos, faltas e penalidades do Monitor',
    paragrafos: [
      '7.1. O Monitor reconhece que o Aluno tem direito de arrependimento de 7 (sete) dias, contados do pagamento, até o início da monitoria (Código de Defesa do Consumidor, art. 49), e que nesse caso o Aluno recebe todo o valor pago de volta, sem remuneração ao Monitor.',
      '7.2. Se o Monitor cancelar a monitoria a qualquer tempo, ou não comparecer, o Aluno é reembolsado em 100% e o Monitor recebe uma advertência ("strike").',
      '7.3. Três strikes em 90 (noventa) dias suspendem automaticamente o perfil de Monitor e pausam seus anúncios.',
      '7.4. Em caso de violação destes Termos, fraude, reclamações reiteradas ou ordem de autoridade, a Plataforma pode suspender anúncios e perfis e reter valores ainda em garantia. A suspensão é comunicada por e-mail com o motivo, e o Monitor pode contestá-la pelo suporte em até 10 (dez) dias; procedente a contestação, o perfil é reativado. Valores que já pertençam ao Monitor por aulas regularmente prestadas são repassados, deduzidos eventuais reembolsos.',
    ],
  },
  {
    titulo: '8. Oferta-padrão do agendamento direto',
    paragrafos: [
      '8.1. Ao ativar o agendamento direto, o Monitor assina uma OFERTA-PADRÃO: compromete-se a prestar a monitoria a qualquer Aluno que reservar um horário livre da sua agenda, dentro das durações e preços anunciados, sem necessidade de nova aceitação a cada reserva (Código Civil, art. 429).',
      '8.2. Cada reserva por agendamento direto gera um Contrato de Monitoria em que a assinatura do Monitor é a da oferta-padrão vigente no momento da reserva, por adesão. O documento registra a data em que o Monitor assinou a oferta, o resumo criptográfico dela e a data em que foi vinculada ao contrato. Manter a agenda atualizada é obrigação do Monitor.',
      '8.3. Monitoria em grupo: quando um aluno entra pelo convite do organizador, nas mesmas condições já aceitas pelo Monitor no contrato do organizador (data, duração, conteúdo e valor por pessoa), a assinatura do Monitor naquele contrato vale, por adesão, para o contrato do novo aluno, com o mesmo registro de datas e resumo criptográfico.',
    ],
  },
  {
    titulo: '9. Avaliações',
    paragrafos: [
      '9.1. Alunos que concluírem monitorias podem avaliar o Monitor. A Plataforma não altera notas, mas pode remover avaliação ofensiva, com dados pessoais ou comprovadamente falsa.',
    ],
  },
  {
    titulo: '10. Indenização',
    paragrafos: [
      '10.1. O Monitor manterá a Plataforma indene e a ressarcirá de valores, condenações, custas e honorários que ela vier a suportar por reclamações, ações ou processos decorrentes do serviço que o Monitor prestou, dos materiais que indicou ou do descumprimento destes Termos, assegurado ao Monitor o direito de ser informado e de se defender.',
    ],
  },
]

const ALUNO: SecaoDocumento[] = [
  {
    titulo: '3. Cadastro do Aluno',
    paragrafos: [
      '3.1. Para contratar, o Aluno declara ser maior de 18 (dezoito) anos e civilmente capaz, e mantém o cadastro 100% preenchido e verdadeiro, com CPF válido e e-mail verificado.',
      '3.2. Menores de 18 anos não podem contratar pela própria conta. O responsável legal pode contratar em seu próprio nome e acompanhar a monitoria, respondendo pelos atos do menor.',
    ],
  },
  {
    titulo: '4. A contratação',
    paragrafos: [
      '4.1. O Aluno contrata o Monitor diretamente. Antes de contratar, o Aluno tem acesso à descrição, vídeos, avaliações, perguntas, preço total e regras de cancelamento, e escolhe o Monitor livremente.',
      '4.2. A Plataforma não garante resultado acadêmico (aprovação, nota, desempenho), nem a adequação do conteúdo ao programa de qualquer instituição.',
      '4.3. A monitoria é exclusivamente educacional. Ela não é consulta, diagnóstico, prescrição nem orientação profissional para caso real (de saúde, jurídico ou outro) e não deve ser usada para esse fim.',
      '4.4. Materiais complementares indicados por link são de responsabilidade exclusiva de quem os indicou. A Plataforma não hospeda, não revisa e não responde pelo seu conteúdo, disponibilidade ou segurança.',
      '4.5. É proibido ao Aluno: (a) pagar o Monitor fora da Plataforma por monitoria combinada nela — pagamentos por fora não têm garantia, contrato, comprovante nem reembolso; (b) gravar a aula sem consentimento expresso do Monitor e dos demais participantes, registrado no chat; (c) redistribuir material do Monitor sem autorização; (d) pedir que o Monitor faça provas ou atividades avaliativas em seu lugar; (e) assediar, discriminar ou ofender o Monitor ou outros alunos.',
    ],
  },
  {
    titulo: '5. Pagamento e garantia',
    paragrafos: [
      '5.1. O preço total, já com a taxa do meio de pagamento destacada, é exibido antes do pagamento. O pagamento é feito por PIX, processado pelo Mercado Pago, à Plataforma, que o recebe em nome e por conta do Monitor.',
      '5.2. O valor fica em garantia até 48 horas após o término da monitoria. Nesse prazo o Aluno pode reportar problema (falta do Monitor, aula não prestada, divergência grave do combinado) e o valor fica retido até a decisão do suporte.',
      '5.3. O Aluno recebe comprovante de pagamento e o Contrato de Monitoria em PDF, disponíveis a qualquer tempo no seu painel, junto com o histórico do chat e os materiais da monitoria.',
    ],
  },
  {
    titulo: '6. Cancelamento e reembolso',
    paragrafos: [
      '6.1. Direito de arrependimento: em até 7 (sete) dias contados do pagamento, e desde que a monitoria ainda não tenha começado, o Aluno pode desistir sem justificativa e recebe de volta todo o valor pago, inclusive a taxa do PIX (Código de Defesa do Consumidor, art. 49; Decreto 7.962/2013, art. 5º).',
      '6.2. Fora do prazo de arrependimento, cancelamento pelo Aluno com 24 horas ou mais de antecedência do início: reembolso de 100% do valor pago, automático.',
      '6.3. Fora do prazo de arrependimento, cancelamento pelo Aluno com menos de 24 horas: a solicitação vai ao suporte, que decide o reembolso de forma fundamentada, considerando a antecedência, a possibilidade de o Monitor reaproveitar o horário e a boa-fé das partes (Código Civil, art. 413). O não comparecimento do Aluno sem aviso, com o Monitor presente, equivale a serviço prestado.',
      '6.4. Cancelamento ou falta do Monitor: reembolso de 100% ao Aluno.',
      '6.5. Monitoria em grupo: cada aluno tem o próprio assento, contrato e pagamento. Quem sai é reembolsado conforme estes Termos, e o valor por pessoa de quem fica não muda. Se o grupo não se completar até o prazo de pagamento, todos recebem 100% de volta, salvo se o Monitor confirmar a aula com quem já pagou, pelo mesmo valor por pessoa. Quem saiu de um grupo não volta a ele: pode contratar uma nova aula.',
      '6.6. Reembolsos são pedidos ao Mercado Pago na hora da decisão e voltam pelo mesmo meio de pagamento; o prazo para aparecer depende do banco do Aluno.',
    ],
  },
  {
    titulo: '7. Responsabilidade da Plataforma perante o Aluno',
    paragrafos: [
      '7.1. Nada nestes Termos exclui ou reduz direitos que o Código de Defesa do Consumidor assegura ao Aluno. A Plataforma responde, nos limites da lei, pelos serviços que ela própria presta: funcionamento da tecnologia, processamento e guarda do pagamento, reembolsos, segurança dos dados e guarda dos registros.',
      '7.2. Pela aula em si (conteúdo, qualidade, conduta e pontualidade do Monitor), quem responde é o Monitor, prestador do serviço. A Plataforma, porém, garante ao Aluno os reembolsos previstos nestes Termos enquanto o valor estiver em garantia e atende às reclamações em até 5 (cinco) dias (Decreto 7.962/2013, art. 4º, parágrafo único).',
    ],
  },
]

const COMUNS_FIM = (numero: number, papel: PapelTermos): SecaoDocumento[] => [
  {
    titulo: `${numero}. Limitação de responsabilidade`,
    paragrafos: [
      papel === 'monitor'
        ? `${numero}.1. A responsabilidade da Plataforma perante o Monitor, por qualquer causa relacionada a uma monitoria, limita-se ao valor que lhe caberia repassar por aquela monitoria, salvo dolo ou culpa grave.`
        : `${numero}.1. Observado o item 7, a Plataforma não responde pelo conteúdo, qualidade, resultado ou conduta na monitoria, que são de responsabilidade do Monitor.`,
      `${numero}.2. A Plataforma não responde por: materiais e links externos; falhas de serviços de terceiros que não controla (plataformas de reunião, internet, bancos), salvo quando a falha decorrer de serviço que ela própria presta; danos indiretos, lucros cessantes ou perda de chance${papel === 'aluno' ? ', sempre nos limites do Código de Defesa do Consumidor' : ''}.`,
      `${numero}.3. A Plataforma pode indisponibilizar o serviço temporariamente para manutenção, segurança ou por força maior (Código Civil, art. 393), avisando com antecedência sempre que possível.`,
    ],
  },
  {
    titulo: `${numero + 1}. Comunicação, chat e provas`,
    paragrafos: [
      `${numero + 1}.1. As partes concordam que mensagens no chat da reserva, propostas, aceites, assinaturas eletrônicas, registros de acesso e de pagamento servem como prova do que foi combinado (Código de Processo Civil, art. 369 e art. 441).`,
      `${numero + 1}.2. Antes do pagamento, contatos pessoais (telefone, e-mail, redes sociais) enviados no chat são ocultados automaticamente, para proteger as partes contra golpes e pagamentos por fora.`,
      `${numero + 1}.3. Os documentos são assinados eletronicamente, mediante aceite expresso e código de uso único enviado ao e-mail cadastrado, com registro de data, hora, IP, navegador e resumo criptográfico (hash SHA-256) do conteúdo. As partes admitem essa forma de assinatura como válida (MP 2.200-2/2001, art. 10, § 2º; Código Civil, art. 107), equivalente à assinatura eletrônica simples (Lei 14.063/2020, art. 4º, I).`,
      `${numero + 1}.4. Avisos por e-mail cadastrado e notificações na Plataforma valem como comunicação formal. Manter o e-mail atualizado é dever de cada usuário.`,
    ],
  },
  {
    titulo: `${numero + 2}. Dados pessoais (LGPD)`,
    paragrafos: [
      `${numero + 2}.1. A Plataforma trata nome, CPF, data de nascimento, e-mail, telefone, chave PIX, dados de pagamento, mensagens do chat e registros de acesso para: executar a intermediação e o contrato; emitir contratos e comprovantes; prevenir fraudes e golpes; cumprir obrigações legais; e exercer direitos em processos (Lei 13.709/2018, art. 7º, II, V, VI e IX).`,
      `${numero + 2}.2. Os dados são compartilhados apenas com quem é necessário: o Mercado Pago (processamento do PIX e reembolsos), provedores de hospedagem, banco de dados e envio de e-mail (que podem estar fora do Brasil, com garantias adequadas — LGPD, art. 33), a outra parte da monitoria (somente o necessário para executá-la) e autoridades, quando exigido por lei.`,
      `${numero + 2}.3. Contratos, comprovantes, mensagens e registros de pagamento são guardados por 5 (cinco) anos após a última monitoria, prazo das ações de consumo e das obrigações fiscais (CDC, art. 27; Código Tributário Nacional, art. 173); registros de acesso, por no mínimo 6 (seis) meses (Marco Civil da Internet, art. 15). Depois disso são apagados ou anonimizados.`,
      `${numero + 2}.4. Telas públicas nunca exibem CPF, e-mail ou telefone. Nos documentos, o CPF aparece mascarado; a qualificação completa fica sob guarda da Plataforma e é fornecida à parte que precisar exercer direitos, ou a autoridades. A chave PIX do Monitor é guardada cifrada.`,
      `${numero + 2}.5. O titular pode pedir confirmação, acesso, correção, portabilidade, informação sobre compartilhamento e eliminação dos dados que não precisem ser guardados por lei (LGPD, art. 18), pelo canal ${canalDeAtendimento()}, que também é o canal do encarregado de dados.`,
      `${numero + 2}.6. Cada parte é controladora autônoma dos dados que receber da outra em razão da monitoria, só pode usá-los para executá-la e responde pelo uso indevido que fizer deles.`,
    ],
  },
  {
    titulo: `${numero + 3}. Disposições gerais`,
    paragrafos: [
      `${numero + 3}.1. Estes Termos podem ser atualizados. A nova versão é exibida para novo aceite antes do próximo anúncio ou contratação; contratos já assinados seguem a versão vigente na data da assinatura.`,
      `${numero + 3}.2. Se alguma cláusula for considerada inválida, as demais continuam valendo (Código Civil, art. 184). A tolerância a qualquer descumprimento não implica renúncia de direito.`,
      `${numero + 3}.3. Aplica-se a lei brasileira. Antes de ir à Justiça, as partes se comprometem a tentar resolver pelo suporte da Plataforma; o Aluno também pode usar o consumidor.gov.br ou o Procon.`,
      papel === 'aluno'
        ? `${numero + 3}.4. Fica eleito o foro do domicílio do Aluno (Código de Defesa do Consumidor, art. 101, I).`
        : `${numero + 3}.4. Fica eleito o foro da ${PLATAFORMA.foro}, salvo regra legal que determine outro.`,
    ],
  },
]

export function secoesDosTermos(papel: PapelTermos): SecaoDocumento[] {
  const especificas = papel === 'monitor' ? MONITOR : ALUNO
  const proximo = especificas.length + 3
  return [...COMUNS_INICIO(), ...especificas, ...COMUNS_FIM(proximo, papel)]
}

export function tituloDosTermos(papel: PapelTermos): string {
  return papel === 'monitor'
    ? 'Termos de Serviço da Monitoria — Monitor'
    : 'Termos de Serviço da Monitoria — Aluno'
}

/** Texto canônico de quaisquer seções (o que entra no hash). */
export function textoCanonico(titulo: string, versao: string, secoes: SecaoDocumento[]): string {
  return [titulo, `Versão ${versao}`, ...secoes.flatMap((s) => [s.titulo, ...s.paragrafos])].join('\n')
}

/** Texto canônico dos termos vigentes. */
export function textoDosTermos(papel: PapelTermos): string {
  return textoCanonico(tituloDosTermos(papel), VERSAO_TERMOS, secoesDosTermos(papel))
}

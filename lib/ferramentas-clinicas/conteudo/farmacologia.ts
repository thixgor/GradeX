import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  num,
  numOu,
  opc,
  sim,
} from '../helpers'

/* ═══════════════════ Tabelas de equivalência ═══════════════════ */

interface Opioide {
  nome: string
  /** Dose equivalente a 30 mg de morfina oral. */
  equivalente: number
  unidade: string
  obs: string
}

const OPIOIDES: Record<string, Opioide> = {
  morfinaOral: { nome: 'Morfina oral', equivalente: 30, unidade: 'mg/dia', obs: 'Padrão de referência. A biodisponibilidade oral é de 20 a 40%, o que explica a relação 3:1 com a via parenteral.' },
  morfinaParenteral: { nome: 'Morfina endovenosa ou subcutânea', equivalente: 10, unidade: 'mg/dia', obs: 'Relação 3:1 com a via oral. Metabólitos ativos (morfina-6-glicuronídeo) acumulam na insuficiência renal.' },
  codeina: { nome: 'Codeína oral', equivalente: 200, unidade: 'mg/dia', obs: 'Pró-fármaco: depende da conversão em morfina pela CYP2D6. Metabolizadores lentos (5 a 10% dos brancos) não têm analgesia; ultrarrápidos correm risco de intoxicação — contraindicada em crianças após amigdalectomia e na amamentação.' },
  tramadol: { nome: 'Tramadol oral', equivalente: 150, unidade: 'mg/dia', obs: 'Ação dupla: opioide fraco e inibidor de recaptação de serotonina e noradrenalina. Reduz o limiar convulsivo e pode causar síndrome serotoninérgica. Teto de 400 mg/dia (300 mg em idosos).' },
  oxicodona: { nome: 'Oxicodona oral', equivalente: 20, unidade: 'mg/dia', obs: 'Biodisponibilidade oral alta (60 a 87%) e mais previsível que a da morfina.' },
  hidromorfona: { nome: 'Hidromorfona oral', equivalente: 7.5, unidade: 'mg/dia', obs: 'Potente; a via parenteral equivale a cerca de 1,5 mg. Menos metabólitos ativos que a morfina.' },
  fentanilTd: { nome: 'Fentanil transdérmico', equivalente: 12.5, unidade: 'mcg/h', obs: 'Regra prática: dose em mcg/h × 2 a 2,4 = mg de morfina oral por dia. **Não use para dor aguda nem em paciente virgem de opioide.** O adesivo leva 12 a 24 h para atingir efeito e a mesma coisa para desaparecer; febre e calor externo aceleram a absorção e podem causar superdosagem.' },
  metadona: { nome: 'Metadona oral', equivalente: 0, unidade: 'mg/dia', obs: '**A conversão para metadona NÃO é linear** — a razão de equivalência aumenta com a dose prévia de morfina (de cerca de 4:1 em doses baixas a 20:1 ou mais em doses altas). Meia-vida longa e variável (8 a 59 h), com risco de acúmulo tardio e prolongamento do QT. A conversão deve ser feita por profissional experiente em dor ou paliativo.' },
  buprenorfina: { nome: 'Buprenorfina transdérmica', equivalente: 0, unidade: 'mcg/h', obs: 'Agonista parcial com afinidade altíssima pelo receptor µ. A conversão não segue equivalência linear e a associação com agonistas plenos pode precipitar abstinência. Deve ser conduzida por especialista.' },
}

const conversorOpioides: Ferramenta = {
  id: 'conversor-opioides',
  nome: 'Conversor de opioides',
  sinonimos: ['opioide', 'morfina', 'equivalencia opioide', 'rotacao de opioide', 'fentanil', 'metadona'],
  resumo: 'Converte entre opioides pela dose equianalgésica, com a redução obrigatória por tolerância cruzada.',
  categorias: ['farmacologia'],
  campos: [
    campoOpc('de', 'Converter de', [
      { valor: 'morfinaOral', rotulo: 'Morfina oral' },
      { valor: 'morfinaParenteral', rotulo: 'Morfina endovenosa ou subcutânea' },
      { valor: 'codeina', rotulo: 'Codeína oral' },
      { valor: 'tramadol', rotulo: 'Tramadol oral' },
      { valor: 'oxicodona', rotulo: 'Oxicodona oral' },
      { valor: 'hidromorfona', rotulo: 'Hidromorfona oral' },
      { valor: 'fentanilTd', rotulo: 'Fentanil transdérmico' },
    ]),
    campoNum('dose', 'Dose diária total', { unidade: 'mg/dia (ou mcg/h no adesivo)', min: 0.1, max: 5000, passo: 0.5 }),
    campoNum('reducao', 'Redução por tolerância cruzada incompleta', { unidade: '%', min: 0, max: 75, passo: 5, padrao: '30', ajuda: 'Reduza 25 a 50% ao trocar de opioide. Reduza mais (50%) em idosos, caquéticos, disfunção renal ou hepática e doses altas.' }),
  ],
  calcular: (v) => {
    const de = opc(v, 'de')
    const dose = num(v, 'dose')
    const reducao = numOu(v, 'reducao', 30)
    if (dose === null) return null
    const origem = OPIOIDES[de]
    if (!origem || origem.equivalente === 0) return null
    const morfinaOralEquivalente = (dose / origem.equivalente) * 30
    const fator = 1 - reducao / 100
    const linhas = Object.entries(OPIOIDES)
      .filter(([, o]) => o.equivalente > 0)
      .map(([, o]) => {
        const bruto = (morfinaOralEquivalente / 30) * o.equivalente
        return [o.nome, `${fmtLivre(bruto, 1)} ${o.unidade}`, `${fmtLivre(bruto * fator, 1)} ${o.unidade}`]
      })
    return {
      titulo: 'Equivalente em morfina oral por dia',
      valor: fmtLivre(morfinaOralEquivalente, 1),
      unidade: 'mg/dia',
      nivel: morfinaOralEquivalente >= 90 ? 'critico' : morfinaOralEquivalente >= 50 ? 'alerta' : 'neutro',
      rotuloNivel: morfinaOralEquivalente >= 90 ? 'Dose diária alta — risco elevado de eventos adversos' : morfinaOralEquivalente >= 50 ? 'Dose diária intermediária' : 'Dose diária baixa',
      detalhes: [
        { rotulo: 'Dose informada', valor: `${fmtLivre(dose, 1)} ${origem.unidade} de ${origem.nome.toLowerCase()}` },
        { rotulo: 'Redução aplicada', valor: `${fmtInt(reducao)}%`, nota: 'Tolerância cruzada entre opioides é incompleta: o receptor não reconhece a dose equianalgésica como equivalente na prática, e converter sem reduzir é a causa clássica de superdosagem na rotação.', nivel: 'alerta' },
        { rotulo: 'Dose de resgate sugerida', valor: `${fmtLivre(morfinaOralEquivalente * fator * 0.1, 1)} a ${fmtLivre(morfinaOralEquivalente * fator * 0.167, 1)} mg de morfina oral`, nota: '10 a 16% da dose diária total, a cada 1 hora se necessário por via oral, ou a cada 15 a 30 min por via parenteral.' },
      ],
      interpretacao: [
        '**Sempre reduza 25 a 50% ao rotacionar opioide.** A tolerância cruzada é incompleta porque opioides diferentes têm perfis de ligação e de internalização de receptor distintos — o paciente tolerante à morfina não está igualmente tolerante à hidromorfona.',
        'Prescreva **dose de resgate** correspondente a 10 a 16% da dose diária total. Sem resgate, a dor irruptiva não é tratada e a dose basal acaba sendo aumentada indevidamente.',
        'Doses acima de **50 mg de equivalente de morfina oral por dia** exigem reavaliação cuidadosa; acima de **90 mg/dia**, o risco de superdosagem cresce de forma acentuada, e as diretrizes recomendam justificativa documentada, monitorização estreita e consideração de naloxona domiciliar.',
        '**Antecipe os efeitos adversos.** Constipação é universal, não desenvolve tolerância e deve ser tratada profilaticamente desde a primeira prescrição (laxante osmótico com estimulante). Náusea e sonolência costumam ceder em 3 a 7 dias. Prurido, retenção urinária, mioclonias e hiperalgesia induzida por opioide também ocorrem.',
        '**Insuficiência renal muda tudo.** Morfina e codeína acumulam metabólitos ativos e devem ser evitadas; metadona e fentanil são as opções mais seguras.',
      ],
      alertas: [
        'A conversão para **metadona** e para **buprenorfina** não é linear e não está incluída nesta tabela. Encaminhe a serviço de dor ou de cuidados paliativos.',
        'Ao converter para fentanil transdérmico, mantenha o opioide anterior por 12 a 24 horas — o adesivo demora esse tempo para atingir concentração efetiva.',
      ],
      tabela: { titulo: 'Doses equianalgésicas', colunas: ['Opioide', 'Equianalgésica', `Após redução de ${fmtInt(reducao)}%`], linhas },
    }
  },
  formula: [
    'Equivalente em morfina oral = (dose ÷ dose equianalgésica do fármaco) × 30 mg',
    'Dose final = equivalente × (1 − redução por tolerância cruzada)',
    'Fentanil transdérmico: mcg/h × 2 a 2,4 ≈ mg de morfina oral/dia',
  ],
  fundamento:
    'As tabelas de equianalgesia derivam de estudos de dose única em pacientes com pouca exposição prévia a opioides, e por isso descrevem mal o uso crônico. Elas são pontos de partida, não conversões exatas: a variabilidade individual é grande, influenciada por polimorfismos de CYP2D6 e CYP3A4, função renal e hepática, e grau de tolerância.',
  armadilhas: [
    'Nunca converta doses altas sem supervisão especializada. Erros de rotação de opioide estão entre os eventos adversos medicamentosos mais graves e mais frequentes.',
    'Codeína e tramadol dependem de CYP2D6 e têm resposta imprevisível. Codeína é contraindicada em menores de 12 anos e na amamentação.',
    'Retitule sempre após a conversão: reavalie em 24 horas e ajuste conforme a analgesia e os efeitos adversos.',
  ],
  referencias: [
    { texto: 'Dowell D, Ragan KR, Jones CM, et al. CDC clinical practice guideline for prescribing opioids for pain — United States, 2022. MMWR Recomm Rep. 2022;71(3):1-95.' },
    { texto: 'Fine PG, Portenoy RK. Establishing "best practices" for opioid rotation. J Pain Symptom Manage. 2009;38(3):418-425.' },
  ],
}

const conversorBenzo: Ferramenta = {
  id: 'conversor-benzodiazepinicos',
  nome: 'Conversor de benzodiazepínicos e desprescrição',
  sinonimos: ['benzodiazepinico', 'diazepam', 'clonazepam', 'alprazolam', 'equivalencia benzo', 'desmame'],
  resumo: 'Converte entre benzodiazepínicos e monta o esquema de retirada gradual.',
  categorias: ['farmacologia'],
  campos: [
    campoOpc('de', 'Converter de', [
      { valor: 'diazepam', rotulo: 'Diazepam' },
      { valor: 'clonazepam', rotulo: 'Clonazepam' },
      { valor: 'alprazolam', rotulo: 'Alprazolam' },
      { valor: 'lorazepam', rotulo: 'Lorazepam' },
      { valor: 'bromazepam', rotulo: 'Bromazepam' },
      { valor: 'midazolam', rotulo: 'Midazolam' },
      { valor: 'clordiazepoxido', rotulo: 'Clordiazepóxido' },
      { valor: 'nitrazepam', rotulo: 'Nitrazepam' },
      { valor: 'flurazepam', rotulo: 'Flurazepam' },
      { valor: 'oxazepam', rotulo: 'Oxazepam' },
    ]),
    campoNum('dose', 'Dose diária total', { unidade: 'mg/dia', min: 0.1, max: 200, passo: 0.25 }),
  ],
  calcular: (v) => {
    const de = opc(v, 'de')
    const dose = num(v, 'dose')
    if (dose === null) return null
    const tabela: Record<string, { nome: string; eq: number; meiaVida: string; obs: string }> = {
      diazepam: { nome: 'Diazepam', eq: 10, meiaVida: '20 a 100 h (com metabólitos ativos)', obs: 'Meia-vida muito longa; é o fármaco de escolha para conduzir a retirada, porque a queda de concentração entre as doses é suave.' },
      clonazepam: { nome: 'Clonazepam', eq: 0.5, meiaVida: '18 a 50 h', obs: 'Longa duração. Muito prescrito no Brasil, frequentemente por tempo indeterminado.' },
      alprazolam: { nome: 'Alprazolam', eq: 0.5, meiaVida: '6 a 12 h', obs: '**Alto potencial de dependência.** Início rápido e meia-vida curta produzem abstinência entre doses, o que reforça o uso. É o mais difícil de retirar.' },
      lorazepam: { nome: 'Lorazepam', eq: 1, meiaVida: '10 a 20 h', obs: 'Sem metabólitos ativos e com metabolismo por glicuronidação — é preferido em hepatopatia e em idosos.' },
      bromazepam: { nome: 'Bromazepam', eq: 6, meiaVida: '10 a 20 h', obs: 'Intermediário; muito usado no Brasil.' },
      midazolam: { nome: 'Midazolam', eq: 7.5, meiaVida: '1,5 a 3 h', obs: 'Ação ultracurta; uso hospitalar para sedação de procedimento e infusão contínua. Acumula em infusão prolongada, sobretudo em obesos e na disfunção renal.' },
      clordiazepoxido: { nome: 'Clordiazepóxido', eq: 25, meiaVida: '30 a 100 h', obs: 'Clássico no tratamento da abstinência alcoólica.' },
      nitrazepam: { nome: 'Nitrazepam', eq: 10, meiaVida: '15 a 38 h', obs: 'Hipnótico.' },
      flurazepam: { nome: 'Flurazepam', eq: 15, meiaVida: '40 a 250 h (metabólito)', obs: 'Meia-vida do metabólito extremamente longa — má escolha em idosos.' },
      oxazepam: { nome: 'Oxazepam', eq: 20, meiaVida: '4 a 15 h', obs: 'Sem metabólitos ativos, glicuronidação direta — seguro em hepatopatia.' },
    }
    const origem = tabela[de]
    const emDiazepam = (dose / origem.eq) * 10
    const linhas = Object.values(tabela).map((t) => [t.nome, `${fmtLivre((emDiazepam / 10) * t.eq, 2)} mg`, t.meiaVida])
    const reducaoSemanal = emDiazepam * 0.1
    return {
      titulo: 'Equivalente em diazepam',
      valor: fmtLivre(emDiazepam, 1),
      unidade: 'mg/dia',
      nivel: emDiazepam >= 30 ? 'alerta' : 'neutro',
      rotuloNivel: `${fmtLivre(dose, 2)} mg/dia de ${origem.nome.toLowerCase()}`,
      detalhes: [
        { rotulo: 'Meia-vida do fármaco atual', valor: origem.meiaVida },
        { rotulo: 'Característica', valor: origem.obs },
        { rotulo: 'Redução sugerida por etapa', valor: `${fmtLivre(reducaoSemanal, 2)} mg de diazepam`, nota: '5 a 10% da dose a cada 1 a 4 semanas, ajustando pela tolerância. Quanto mais longo o uso, mais lenta deve ser a retirada.' },
        { rotulo: 'Tempo estimado de desmame', valor: `${fmtInt(10)} a ${fmtInt(20)} etapas`, nota: 'Pode levar meses. Retiradas apressadas fracassam e reforçam a crença do paciente de que "não consegue viver sem".' },
      ],
      interpretacao: [
        '**Benzodiazepínicos são fármacos de curto prazo** — 2 a 4 semanas, incluindo o período de retirada. O uso crônico associa-se a dependência, tolerância, quedas e fraturas em idosos, prejuízo cognitivo, acidentes de trânsito e, quando combinado a opioides, a depressão respiratória e morte.',
        '**Estratégia de retirada:** converta para um benzodiazepínico de meia-vida longa (diazepam é o padrão), estabilize por 1 a 2 semanas, e então reduza 5 a 10% da dose a cada 1 a 4 semanas. Nas últimas etapas, a redução deve ser ainda mais lenta e as frações menores.',
        '**Sintomas de abstinência:** ansiedade de rebote, insônia, irritabilidade, tremor, sudorese, náusea, hipersensibilidade sensorial, despersonalização e — em retiradas abruptas de doses altas — **convulsão e delirium**, que podem ser fatais. Nunca suspenda abruptamente uso crônico.',
        'A retirada bem-sucedida exige mais do que a redução de dose: psicoeducação, tratamento adequado do transtorno de base (inibidor seletivo de recaptação de serotonina para transtorno de ansiedade, terapia cognitivo-comportamental para insônia), acompanhamento frequente e expectativas realistas.',
        'Em **idosos**, os benzodiazepínicos constam da lista de Beers como potencialmente inapropriados em praticamente todas as indicações — o risco de queda, fratura e declínio cognitivo supera o benefício.',
      ],
      alertas: ['A associação de benzodiazepínico com opioide multiplica o risco de depressão respiratória e de morte. Evite; se inevitável, use as menores doses possíveis e considere naloxona domiciliar.'],
      tabela: { titulo: 'Doses equivalentes', colunas: ['Fármaco', 'Dose equivalente', 'Meia-vida'], linhas },
    }
  },
  formula: ['Diazepam 10 mg = clonazepam 0,5 = alprazolam 0,5 = lorazepam 1 = bromazepam 6 = midazolam 7,5 = clordiazepóxido 25 = oxazepam 20 mg'],
  fundamento:
    'Todos os benzodiazepínicos atuam no mesmo sítio — o receptor GABA-A —, aumentando a frequência de abertura do canal de cloro. As diferenças clínicas vêm da farmacocinética, não da farmacodinâmica: potência, velocidade de início, lipossolubilidade, meia-vida e presença de metabólitos ativos. É por isso que a conversão é possível, e por isso que trocar por um de meia-vida longa facilita a retirada.',
  armadilhas: [
    'As tabelas de equivalência têm variação considerável entre fontes. Use-as como ponto de partida e titule pela clínica.',
    'Em hepatopatia, prefira lorazepam, oxazepam ou temazepam — os únicos que dispensam oxidação hepática e não acumulam.',
  ],
  referencias: [
    { texto: 'Ashton CH. Benzodiazepines: how they work and how to withdraw (The Ashton Manual). Universidade de Newcastle; 2002.' },
    { texto: 'By the 2023 American Geriatrics Society Beers Criteria Update Expert Panel. J Am Geriatr Soc. 2023;71(7):2052-2081.' },
  ],
}

const diluicao: Ferramenta = {
  id: 'diluicao-concentracao',
  nome: 'Diluição, concentração e conversão mg ↔ mL ↔ porcentagem',
  sinonimos: ['diluicao', 'mg para ml', 'porcentagem', 'concentracao', 'regra de tres', 'preparo de solucao'],
  resumo: 'Converte entre massa, volume, porcentagem e proporção — e calcula qualquer diluição.',
  categorias: ['farmacologia', 'emergencia'],
  campos: [
    campoSeg('modo', 'O que você quer', [
      { valor: 'concentracao', rotulo: 'Concentração de uma solução' },
      { valor: 'volume', rotulo: 'Volume para uma dose' },
      { valor: 'diluir', rotulo: 'Diluir uma solução (C₁V₁ = C₂V₂)' },
    ]),
    campoNum('massa', 'Massa do fármaco', { unidade: 'mg', min: 0.001, max: 100000, passo: 0.001, mostrarSe: (v) => opc(v, 'modo') !== 'diluir' }),
    campoNum('volume', 'Volume da solução', { unidade: 'mL', min: 0.1, max: 5000, passo: 0.1, mostrarSe: (v) => opc(v, 'modo') !== 'diluir' }),
    campoNum('dose', 'Dose desejada', { unidade: 'mg', min: 0.001, max: 100000, passo: 0.001, mostrarSe: (v) => opc(v, 'modo') === 'volume' }),
    campoNum('c1', 'Concentração inicial (C₁)', { unidade: 'mg/mL', min: 0.001, max: 10000, passo: 0.001, mostrarSe: (v) => opc(v, 'modo') === 'diluir' }),
    campoNum('c2', 'Concentração final desejada (C₂)', { unidade: 'mg/mL', min: 0.001, max: 10000, passo: 0.001, mostrarSe: (v) => opc(v, 'modo') === 'diluir' }),
    campoNum('v2', 'Volume final desejado (V₂)', { unidade: 'mL', min: 0.1, max: 5000, passo: 0.1, mostrarSe: (v) => opc(v, 'modo') === 'diluir' }),
  ],
  calcular: (v) => {
    const modo = opc(v, 'modo')
    if (modo === 'diluir') {
      const c1 = num(v, 'c1')
      const c2 = num(v, 'c2')
      const v2 = num(v, 'v2')
      if (c1 === null || c2 === null || v2 === null || c1 <= 0) return null
      const v1 = (c2 * v2) / c1
      const diluente = v2 - v1
      return {
        titulo: 'Volume da solução original a usar (V₁)',
        valor: fmtLivre(v1, 3),
        unidade: 'mL',
        nivel: 'neutro',
        rotuloNivel: `C₁V₁ = C₂V₂`,
        detalhes: [
          { rotulo: 'Solução original (C₁)', valor: `${fmtLivre(c1, 3)} mg/mL` },
          { rotulo: 'Volume a retirar (V₁)', valor: `${fmtLivre(v1, 3)} mL` },
          { rotulo: 'Diluente a acrescentar', valor: `${fmtLivre(diluente, 3)} mL`, nota: diluente < 0 ? '⚠ Valor negativo: a concentração final desejada é maior que a inicial — não é possível obtê-la por diluição.' : 'Complete até o volume final.', nivel: diluente < 0 ? 'critico' : 'neutro' },
          { rotulo: 'Solução final (C₂ × V₂)', valor: `${fmtLivre(c2, 3)} mg/mL em ${fmtLivre(v2, 1)} mL = ${fmtLivre(c2 * v2, 2)} mg` },
          { rotulo: 'Fator de diluição', valor: `1:${fmtLivre(c1 / c2, 1)}` },
        ],
        interpretacao: [
          'A equação **C₁V₁ = C₂V₂** vale porque a massa de fármaco não muda ao se acrescentar diluente — só o volume muda. É a mesma lógica da conservação de massa em qualquer diluição.',
          'Ao preparar, **retire o volume calculado da solução original e complete até o volume final**, em vez de acrescentar o diluente ao volume original. A diferença importa em volumes pequenos e em fármacos concentrados.',
          'Diluições seriadas são preferíveis a uma única diluição extrema: medir 0,05 mL com seringa de 10 mL é uma fonte previsível de erro. Faça duas etapas.',
        ],
      }
    }
    const massa = num(v, 'massa')
    const volume = num(v, 'volume')
    if (massa === null || volume === null || volume <= 0) return null
    const mgMl = massa / volume
    const percentual = mgMl / 10
    const proporcao = mgMl > 0 ? 1000 / mgMl : 0
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Concentração', valor: `${fmtLivre(mgMl, 4)} mg/mL` },
      { rotulo: 'Em microgramas por mL', valor: `${fmtLivre(mgMl * 1000, 1)} mcg/mL` },
      { rotulo: 'Em porcentagem', valor: `${fmtLivre(percentual, 4)}%`, nota: 'Solução a X% = X gramas por 100 mL = X × 10 mg/mL. Uma solução a 1% tem 10 mg/mL.' },
      { rotulo: 'Em proporção', valor: `1:${fmtInt(proporcao)}`, nota: 'Adrenalina 1:1.000 = 1 g em 1.000 mL = 1 mg/mL. Adrenalina 1:10.000 = 0,1 mg/mL.' },
    ]
    if (modo === 'volume') {
      const dose = num(v, 'dose')
      if (dose === null) return null
      const volDose = dose / mgMl
      detalhes.unshift({ rotulo: 'Volume para a dose desejada', valor: `${fmtLivre(volDose, 3)} mL`, nota: `${fmtLivre(dose, 3)} mg ÷ ${fmtLivre(mgMl, 4)} mg/mL`, nivel: 'alerta' })
      return {
        titulo: 'Volume a administrar',
        valor: fmtLivre(volDose, 3),
        unidade: 'mL',
        nivel: 'alerta',
        rotuloNivel: `Solução de ${fmtLivre(mgMl, 3)} mg/mL`,
        detalhes,
        interpretacao: [
          'Confira sempre **três coisas** antes de aspirar: a massa total impressa na ampola, o volume total da ampola e a concentração resultante. Ampolas do mesmo fármaco existem em apresentações diferentes.',
          'Volumes menores que 0,1 mL são impraticáveis de medir com precisão em seringa comum. Dilua antes.',
        ],
        alertas: ['Erro de fator dez na conversão de concentração é uma das causas mais frequentes de evento adverso grave. Faça dupla checagem em fármacos de alto risco.'],
      }
    }
    return {
      titulo: 'Concentração da solução',
      valor: fmtLivre(mgMl, 4),
      unidade: 'mg/mL',
      nivel: 'neutro',
      rotuloNivel: `${fmtLivre(massa, 2)} mg em ${fmtLivre(volume, 1)} mL`,
      detalhes,
      interpretacao: [
        '**Três notações para a mesma coisa.** Porcentagem (g por 100 mL), proporção (1 g em X mL) e massa por volume (mg/mL) descrevem a mesma grandeza — a fluência entre elas evita a maioria dos erros de preparo.',
        'Exemplos que vale memorizar: lidocaína a 2% = 20 mg/mL; adrenalina 1:1.000 = 1 mg/mL; bicarbonato a 8,4% = 84 mg/mL = 1 mEq/mL; glicose a 50% = 500 mg/mL; sulfato de magnésio a 50% = 500 mg/mL.',
      ],
    }
  },
  formula: [
    'Concentração (mg/mL) = massa (mg) ÷ volume (mL)',
    'Solução a X% = X × 10 mg/mL',
    'Proporção 1:N = 1000/N mg/mL',
    'Diluição: C₁ × V₁ = C₂ × V₂',
  ],
  fundamento:
    'A notação percentual vem da farmacotécnica: uma solução a 1% contém 1 grama de soluto em 100 mL de solução. A notação em proporção vem da era pré-métrica e sobrevive na adrenalina. Ambas são fontes de erro justamente por não expressarem diretamente a grandeza que se usa na prescrição — miligramas.',
  armadilhas: [
    'Porcentagem peso/volume (g/100 mL) é diferente de peso/peso e de volume/volume. Em soluções injetáveis, é sempre peso/volume.',
    'A adição de soluto altera o volume final em soluções concentradas — em diluições clínicas, o efeito é desprezível.',
  ],
  referencias: [{ texto: 'Institute for Safe Medication Practices. ISMP List of High-Alert Medications in Acute Care Settings. 2024.' }],
}

const farmacocinetica: Ferramenta = {
  id: 'farmacocinetica',
  nome: 'Farmacocinética: meia-vida, estado de equilíbrio, ataque e manutenção',
  sinonimos: ['meia-vida', 'estado de equilibrio', 'steady state', 'clearance', 'dose de ataque', 'volume de distribuicao'],
  resumo: 'Relaciona clearance, volume de distribuição, meia-vida e as duas doses que toda prescrição tem.',
  categorias: ['farmacologia'],
  campos: [
    campoPeso(),
    campoNum('vd', 'Volume de distribuição', { unidade: 'L/kg', min: 0.05, max: 50, passo: 0.01, padrao: '0.7', ajuda: 'Água corporal total ≈ 0,6 L/kg; extracelular ≈ 0,2; plasma ≈ 0,04. Valores acima de 1 indicam distribuição tecidual extensa.' }),
    campoNum('clearance', 'Clearance', { unidade: 'L/h', min: 0.01, max: 200, passo: 0.01, padrao: '5' }),
    campoNum('alvo', 'Concentração plasmática alvo', { unidade: 'mg/L', min: 0.01, max: 500, passo: 0.01, padrao: '10' }),
    campoNum('intervalo', 'Intervalo entre doses', { unidade: 'h', min: 1, max: 48, passo: 1, padrao: '12' }),
    campoNum('biodisponibilidade', 'Biodisponibilidade', { unidade: '%', min: 1, max: 100, passo: 1, padrao: '100' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const vdKg = num(v, 'vd')
    const cl = num(v, 'clearance')
    const alvo = num(v, 'alvo')
    const intervalo = numOu(v, 'intervalo', 12)
    const f = numOu(v, 'biodisponibilidade', 100) / 100
    if (peso === null || vdKg === null || cl === null || alvo === null || cl <= 0) return null
    const vd = vdKg * peso
    const meiaVida = (0.693 * vd) / cl
    const ataque = (vd * alvo) / f
    const manutencao = (cl * alvo * intervalo) / f
    const equilibrio = meiaVida * 5
    return {
      titulo: 'Meia-vida de eliminação',
      valor: fmt(meiaVida, 2),
      unidade: 'h',
      nivel: 'neutro',
      detalhes: [
        { rotulo: 'Volume de distribuição total', valor: `${fmt(vd, 1)} L`, nota: `${fmt(vdKg, 2)} L/kg × ${fmt(peso, 1)} kg` },
        { rotulo: 'Meia-vida', valor: `${fmt(meiaVida, 2)} h`, nota: 't½ = 0,693 × Vd / Cl' },
        { rotulo: 'Dose de ataque', valor: `${fmtLivre(ataque, 1)} mg`, nota: 'Vd × concentração alvo ÷ biodisponibilidade. **Não depende do clearance** — é por isso que a dose de ataque não se ajusta pela função renal ou hepática.', nivel: 'alerta' },
        { rotulo: 'Dose de manutenção', valor: `${fmtLivre(manutencao, 1)} mg a cada ${fmtInt(intervalo)} h`, nota: 'Cl × concentração alvo × intervalo ÷ biodisponibilidade. **Depende inteiramente do clearance** — e por isso é ela que se ajusta na disfunção de órgão.' },
        { rotulo: 'Dose diária total', valor: `${fmtLivre((manutencao * 24) / intervalo, 1)} mg/dia` },
        { rotulo: 'Tempo até o estado de equilíbrio', valor: `${fmt(equilibrio, 1)} h`, nota: '4 a 5 meias-vidas, independentemente da dose. Aumentar a dose eleva a concentração final, mas **não** acelera a chegada ao equilíbrio.' },
        { rotulo: 'Fração eliminada por meia-vida', valor: '50% a cada meia-vida', nota: 'Após 1 meia-vida resta 50%; após 2, 25%; após 3, 12,5%; após 4, 6,25%; após 5, cerca de 3%.' },
      ],
      interpretacao: [
        '**Toda prescrição tem duas doses conceitualmente distintas, e confundi-las é o erro mais comum.** A **dose de ataque** enche o volume de distribuição e determina quão rápido a concentração alvo é atingida — depende só do Vd. A **dose de manutenção** repõe o que o corpo elimina e determina a concentração de equilíbrio — depende só do clearance.',
        'A consequência prática é importante: **na insuficiência renal ou hepática, reduza a manutenção, nunca o ataque.** Reduzir a dose de ataque de um antibiótico em paciente séptico com lesão renal atrasa a concentração terapêutica justamente em quem menos pode esperar.',
        'O **estado de equilíbrio** (steady state) é atingido em 4 a 5 meias-vidas, sempre. Fármacos de meia-vida longa — amiodarona (dias a semanas), digoxina (36 a 48 h), levotiroxina (7 dias) — demoram muito, e é por isso que precisam de dose de ataque quando o efeito é urgente, e por isso que não se deve reajustar a dose antes do equilíbrio.',
        'Dosagens séricas só fazem sentido **no estado de equilíbrio**, salvo em suspeita de intoxicação. Colher nível de vancomicina na segunda dose gera um número que não representa a exposição real.',
        'O **volume de distribuição** não é um volume anatômico: é uma constante de proporcionalidade entre a quantidade no corpo e a concentração plasmática. Fármacos muito lipofílicos ou muito ligados a tecidos têm Vd enorme (a amiodarona chega a 60 L/kg), o que significa que quase nada está no plasma — e é por isso que a hemodiálise não os remove.',
      ],
      alertas: ['Em sepse, o volume de distribuição de fármacos hidrofílicos aumenta muito (extravasamento capilar e reposição volêmica), o que exige **doses de ataque maiores**, não menores.'],
    }
  },
  formula: [
    't½ = 0,693 × Vd / Cl',
    'Dose de ataque = Vd × concentração alvo / F',
    'Dose de manutenção = Cl × concentração alvo × intervalo / F',
    'Estado de equilíbrio em 4 a 5 meias-vidas',
  ],
  fundamento:
    'A farmacocinética de primeira ordem descreve a maioria dos fármacos: uma fração constante é eliminada por unidade de tempo, o que gera decaimento exponencial e meia-vida constante. As três variáveis fundamentais são o volume de distribuição (quanto o fármaco se espalha), o clearance (quanto o corpo depura por unidade de tempo) e a biodisponibilidade (quanto da dose administrada chega à circulação). Todas as demais grandezas derivam dessas três.',
  armadilhas: [
    'Alguns fármacos têm cinética de ordem zero (saturável) — álcool, fenitoína em doses altas, salicilato, teofilina. Neles a meia-vida não é constante, e pequenos aumentos de dose produzem grandes aumentos de concentração.',
    'A meia-vida de distribuição (alfa) é diferente da de eliminação (beta). Para fármacos com distribuição lenta, o nível colhido cedo demais reflete a distribuição, não a eliminação.',
  ],
  referencias: [
    { texto: 'Rowland M, Tozer TN. Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications. 4ª ed. Lippincott Williams & Wilkins; 2010.' },
    { texto: 'Roberts JA, Abdul-Aziz MH, Lipman J, et al. Individualised antibiotic dosing for patients who are critically ill. Lancet Infect Dis. 2014;14(6):498-509.' },
  ],
}

const doseHepatica: Ferramenta = {
  id: 'ajuste-dose-hepatica',
  nome: 'Ajuste de dose pela função hepática',
  sinonimos: ['dose hepatica', 'cirrose medicamento', 'ajuste hepatico', 'child pugh dose'],
  resumo: 'Orienta o ajuste por classe de Child-Pugh e lista os fármacos a evitar.',
  categorias: ['farmacologia', 'gastroenterologia'],
  campos: [
    campoOpc('child', 'Classe de Child-Pugh', [
      { valor: 'a', rotulo: 'A (5 a 6 pontos) — cirrose compensada' },
      { valor: 'b', rotulo: 'B (7 a 9 pontos) — descompensação moderada' },
      { valor: 'c', rotulo: 'C (10 a 15 pontos) — descompensação grave' },
    ]),
    campoOpc('classe', 'Classe do medicamento', [
      { valor: 'analgesicos', rotulo: 'Analgésicos' },
      { valor: 'psicotropicos', rotulo: 'Psicotrópicos e sedativos' },
      { valor: 'cardio', rotulo: 'Cardiovasculares' },
      { valor: 'antimicrobianos', rotulo: 'Antimicrobianos' },
      { valor: 'anticoagulantes', rotulo: 'Anticoagulantes e antiagregantes' },
      { valor: 'outros', rotulo: 'Outros de uso comum' },
    ]),
  ],
  calcular: (v) => {
    const child = opc(v, 'child')
    const classe = opc(v, 'classe')
    const tabelas: Record<string, string[][]> = {
      analgesicos: [
        ['Paracetamol', 'Permitido, mas com **teto de 2 a 3 g/dia** em hepatopatia crônica. Continua sendo o analgésico de escolha — a hepatotoxicidade em dose terapêutica é rara e o risco é muito menor que o dos anti-inflamatórios.'],
        ['Anti-inflamatórios não esteroidais', '**Evitar.** Risco de sangramento digestivo, lesão renal, síndrome hepatorrenal e retenção hídrica com piora de ascite.'],
        ['Opioides', 'Reduzir dose e alargar intervalo. Preferir os de meia-vida curta e sem metabólito ativo. Podem precipitar encefalopatia hepática — comece baixo, vá devagar e associe laxante.'],
        ['Dipirona', 'Usar com cautela; sem contraindicação formal na hepatopatia.'],
      ],
      psicotropicos: [
        ['Benzodiazepínicos', '**Preferir lorazepam, oxazepam ou temazepam** — sofrem apenas glicuronidação, que é a via mais preservada na cirrose. Evitar diazepam, midazolam e clordiazepóxido, que exigem oxidação e acumulam muito.'],
        ['Antipsicóticos', 'Reduzir dose. Haloperidol em dose baixa é aceitável; evitar clorpromazina pelo risco de colestase.'],
        ['Antidepressivos', 'Iniciar com metade da dose. Sertralina e citalopram têm perfil aceitável; evitar em Child-Pugh C sem necessidade clara.'],
        ['Propofol', 'Titular com cuidado; a recuperação é mais lenta.'],
      ],
      cardio: [
        ['Betabloqueadores', 'Propranolol e carvedilol são indicados na profilaxia de sangramento varicoso, mas **evite-os na ascite refratária, na peritonite bacteriana espontânea e na hipotensão** — nesses cenários pioram a perfusão renal.'],
        ['Estatinas', 'Não são contraindicadas na doença hepática crônica estável e têm sinal de benefício na cirrose. Evitar na hepatite aguda e na descompensação.'],
        ['Espironolactona', 'É o diurético de escolha na ascite. Monitorize potássio, sódio e função renal.'],
        ['Amiodarona', 'Hepatotóxica; evitar se houver alternativa.'],
      ],
      antimicrobianos: [
        ['Aminoglicosídeos', '**Evitar** — risco muito aumentado de síndrome hepatorrenal e de nefrotoxicidade no cirrótico.'],
        ['Rifampicina e isoniazida', 'Hepatotóxicas; monitorização rigorosa. Esquemas alternativos podem ser necessários em Child-Pugh B e C.'],
        ['Macrolídeos', 'Eritromicina e claritromicina têm potencial hepatotóxico; azitromicina é mais segura.'],
        ['Ceftriaxona', 'Segura e amplamente usada na profilaxia e no tratamento da peritonite bacteriana espontânea.'],
        ['Metronidazol', 'Reduzir dose em Child-Pugh C.'],
        ['Antifúngicos azólicos', 'Hepatotóxicos e inibidores enzimáticos potentes — usar com cautela e monitorização.'],
      ],
      anticoagulantes: [
        ['Varfarina', 'INR basal já alterado dificulta a monitorização e o alvo. O cirrótico **não** está "autoanticoagulado" — pode trombosar.'],
        ['Anticoagulantes orais diretos', 'Contraindicados em Child-Pugh C; usar com cautela em B. Rivaroxabana é a mais restrita.'],
        ['Heparina de baixo peso molecular', 'Habitualmente preferida; a monitorização por anti-Xa é imprecisa na cirrose por antitrombina baixa.'],
        ['Antiagregantes', 'Avaliar caso a caso, considerando plaquetopenia e varizes.'],
      ],
      outros: [
        ['Metformina', 'Contraindicada na hepatopatia avançada pelo risco de acidose lática, embora dados recentes sugiram segurança maior do que se acreditava na cirrose compensada.'],
        ['Inibidores da bomba de prótons', 'Reduzir dose e evitar uso prolongado sem indicação — associam-se a mais peritonite bacteriana espontânea e a encefalopatia.'],
        ['Corticoides', 'Preferir prednisolona à prednisona: a conversão hepática pode estar comprometida.'],
        ['Anestésicos inalatórios', 'Preferir sevoflurano ou desflurano; evitar halotano.'],
      ],
    }
    const ajuste = child === 'a' ? 'Ajuste raramente necessário para a maioria dos fármacos, mas evite os francamente hepatotóxicos.' : child === 'b' ? 'Reduzir a dose em cerca de 50% ou alargar o intervalo para fármacos com metabolismo hepático extenso.' : 'Reduzir a dose em 50% ou mais, ou escolher alternativa com eliminação renal. Muitos fármacos são formalmente contraindicados.'
    const nivel: Nivel = child === 'c' ? 'critico' : child === 'b' ? 'alerta' : 'atencao'
    return {
      titulo: `Child-Pugh ${child.toUpperCase()}`,
      valor: ajuste,
      nivel,
      detalhes: [
        { rotulo: 'Princípio geral', valor: ajuste },
        { rotulo: 'Vias metabólicas', valor: 'A oxidação (fase I, citocromo P450) é comprometida precocemente; a glicuronidação (fase II) é relativamente preservada até fases avançadas.', nota: 'Isso explica por que lorazepam e oxazepam são preferíveis ao diazepam na cirrose.' },
        { rotulo: 'Efeito de primeira passagem', valor: 'Reduzido pela circulação colateral portossistêmica', nota: 'Fármacos com alto efeito de primeira passagem (propranolol, morfina, midazolam, verapamil) têm biodisponibilidade oral muito **aumentada** no cirrótico — o mesmo comprimido entrega bem mais fármaco.' },
        { rotulo: 'Ligação proteica', valor: 'Reduzida pela hipoalbuminemia', nota: 'Aumenta a fração livre de fármacos muito ligados (fenitoína, varfarina, diazepam), potencializando efeito e toxicidade com nível total "normal".' },
      ],
      interpretacao: [
        '**Não existe equivalente hepático da fórmula de Cockcroft-Gault.** A função hepática não tem um marcador quantitativo que se traduza em ajuste de dose, e é por isso que as recomendações são qualitativas e baseadas na classe de Child-Pugh.',
        'Quatro alterações se somam na cirrose: **metabolismo reduzido** (menos hepatócitos funcionantes), **primeira passagem reduzida** (circulação colateral), **ligação proteica reduzida** (hipoalbuminemia) e **volume de distribuição aumentado** (ascite e edema, para fármacos hidrofílicos).',
        'A **encefalopatia hepática** é precipitada por sedativos, opioides e diuréticos em excesso. Antes de prescrever qualquer psicotrópico ao cirrótico, pergunte se existe alternativa não farmacológica.',
        'A **síndrome hepatorrenal** é precipitada por anti-inflamatórios, aminoglicosídeos, contraste e diurese excessiva. Esses agentes devem ser evitados ativamente, não apenas "usados com cautela".',
      ],
      alertas: ['Bilirrubina e transaminases não medem capacidade metabólica. Um paciente com transaminases normais e Child-Pugh C tem metabolismo hepático gravemente comprometido.'],
      tabela: { titulo: 'Orientações por fármaco', colunas: ['Fármaco ou classe', 'Conduta'], linhas: tabelas[classe] ?? tabelas.analgesicos },
    }
  },
  formula: [],
  fundamento:
    'O fígado depura fármacos por dois mecanismos que se comportam de forma diferente na doença: fármacos de **alta taxa de extração** (propranolol, morfina, verapamil, lidocaína) têm depuração limitada pelo **fluxo sanguíneo hepático**, e sofrem sobretudo com os shunts portossistêmicos; fármacos de **baixa taxa de extração** (varfarina, fenitoína, diazepam, teofilina) têm depuração limitada pela **capacidade enzimática**, e sofrem sobretudo com a perda de hepatócitos. Reconhecer a qual grupo o fármaco pertence prevê melhor o comportamento do que qualquer regra genérica.',
  armadilhas: [
    'A hepatopatia aguda e a crônica se comportam de forma diferente. Child-Pugh se aplica à cirrose, não à hepatite aguda.',
    'Interações medicamentosas se agravam na cirrose porque as reservas enzimáticas já estão reduzidas.',
  ],
  referencias: [
    { texto: 'Weersink RA, Bouma M, Burger DM, et al. Evidence-based recommendations to improve the safe use of drugs in patients with liver cirrhosis. Drug Saf. 2018;41(6):603-613.' },
    { texto: 'Lewis JH, Stine JG. Review article: prescribing medications in patients with cirrhosis. Aliment Pharmacol Ther. 2013;37(12):1132-1156.' },
  ],
}

const interacoes: Ferramenta = {
  id: 'verificador-interacoes',
  nome: 'Verificador de interações por mecanismo',
  sinonimos: ['interacao medicamentosa', 'cyp450', 'qt', 'serotoninergica', 'indutor inibidor'],
  resumo: 'Organiza as interações relevantes por mecanismo, que é como se antecipa o que a lista não cobre.',
  categorias: ['farmacologia'],
  campos: [
    campoOpc('mecanismo', 'Mecanismo a explorar', [
      { valor: 'cyp3a4', rotulo: 'CYP3A4 — o mais promíscuo dos citocromos' },
      { valor: 'cyp2d6', rotulo: 'CYP2D6 — polimorfismo genético relevante' },
      { valor: 'cyp2c9', rotulo: 'CYP2C9 e CYP2C19' },
      { valor: 'qt', rotulo: 'Prolongamento do intervalo QT' },
      { valor: 'serotonina', rotulo: 'Síndrome serotoninérgica' },
      { valor: 'sangramento', rotulo: 'Risco de sangramento' },
      { valor: 'hipercalemia', rotulo: 'Hipercalemia' },
      { valor: 'depressao', rotulo: 'Depressão do sistema nervoso central' },
    ]),
  ],
  calcular: (v) => {
    const m = opc(v, 'mecanismo')
    const dados: Record<string, { titulo: string; explicacao: string; linhas: string[][]; alerta: string }> = {
      cyp3a4: {
        titulo: 'CYP3A4',
        explicacao: 'Responde pelo metabolismo de aproximadamente metade dos fármacos em uso clínico, e está presente tanto no fígado quanto no enterócito — daí interações que afetam a absorção, como a do suco de toranja.',
        linhas: [
          ['**Inibidores potentes**', 'Claritromicina, eritromicina, itraconazol, cetoconazol, voriconazol, posaconazol, ritonavir e cobicistate, suco de toranja, verapamil, diltiazem, amiodarona'],
          ['**Indutores potentes**', 'Rifampicina, fenitoína, carbamazepina, fenobarbital, erva-de-são-joão, efavirenz, dexametasona'],
          ['**Substratos de risco**', 'Sinvastatina, atorvastatina, tacrolimo, ciclosporina, everolimo, midazolam, alfentanil, colchicina, apixabana, rivaroxabana, amiodarona, quetiapina, contraceptivos hormonais'],
          ['Consequência de inibição', 'Rabdomiólise (estatinas), nefrotoxicidade (inibidores de calcineurina), sangramento (anticoagulantes), toxicidade grave (colchicina)'],
          ['Consequência de indução', 'Falha terapêutica: rejeição de enxerto, falha contraceptiva, perda de controle da anticoagulação, falha antirretroviral'],
        ],
        alerta: 'Rifampicina é o indutor mais potente da prática clínica e afeta praticamente tudo. Ao iniciá-la ou suspendê-la, revise a prescrição inteira.',
      },
      cyp2d6: {
        titulo: 'CYP2D6',
        explicacao: 'Enzima com polimorfismo genético marcante: existem metabolizadores lentos (5 a 10% dos brancos), intermediários, normais e ultrarrápidos. Não é induzível — apenas inibida.',
        linhas: [
          ['**Inibidores potentes**', 'Fluoxetina, paroxetina, bupropiona, quinidina, terbinafina, duloxetina (moderada)'],
          ['**Substratos relevantes**', 'Codeína, tramadol, tamoxifeno, metoprolol, propafenona, risperidona, haloperidol, antidepressivos tricíclicos, ondansetrona'],
          ['Codeína e tramadol', 'São **pró-fármacos**: metabolizadores lentos não convertem e não têm analgesia; ultrarrápidos convertem demais e correm risco de depressão respiratória'],
          ['Tamoxifeno', 'Também é pró-fármaco (convertido em endoxifeno). Fluoxetina e paroxetina reduzem sua eficácia — **prefira venlafaxina ou citalopram** para fogachos em pacientes em uso de tamoxifeno'],
          ['Metoprolol', 'Inibição de CYP2D6 eleva os níveis e pode causar bradicardia e hipotensão'],
        ],
        alerta: 'A direção do efeito se inverte em pró-fármacos: inibir a enzima **reduz** o efeito da codeína e do tamoxifeno, em vez de aumentá-lo.',
      },
      cyp2c9: {
        titulo: 'CYP2C9 e CYP2C19',
        explicacao: 'CYP2C9 metaboliza varfarina (o enantiômero S, mais potente), fenitoína e anti-inflamatórios. CYP2C19 metaboliza clopidogrel (pró-fármaco), inibidores da bomba de prótons e alguns antidepressivos.',
        linhas: [
          ['Inibidores de CYP2C9', 'Fluconazol, amiodarona, metronidazol, sulfametoxazol-trimetoprima, isoniazida'],
          ['Substratos de CYP2C9', 'Varfarina, fenitoína, anti-inflamatórios, glipizida, losartana'],
          ['Inibidores de CYP2C19', 'Omeprazol, esomeprazol, fluvoxamina, fluconazol'],
          ['Clopidogrel', 'É **pró-fármaco** ativado por CYP2C19. Omeprazol e esomeprazol reduzem sua ativação — **prefira pantoprazol** quando o inibidor de bomba for necessário'],
          ['Varfarina', 'A interação mais perigosa da clínica ambulatorial. Sulfametoxazol-trimetoprima, metronidazol, fluconazol e amiodarona elevam muito o INR'],
        ],
        alerta: 'Toda vez que um antibiótico for prescrito a um paciente em uso de varfarina, o INR deve ser reavaliado em poucos dias.',
      },
      qt: {
        titulo: 'Prolongamento do QT e torsades de pointes',
        explicacao: 'O efeito é **aditivo**: dois fármacos que prolongam moderadamente somam-se e podem ultrapassar o limiar arritmogênico. O risco cresce muito na presença de distúrbio eletrolítico.',
        linhas: [
          ['Antiarrítmicos', 'Amiodarona, sotalol, quinidina, procainamida, dofetilida'],
          ['Antimicrobianos', 'Macrolídeos, quinolonas, azólicos, pentamidina, cloroquina e hidroxicloroquina'],
          ['Antipsicóticos', 'Haloperidol (sobretudo endovenoso), quetiapina, ziprasidona, risperidona, clorpromazina'],
          ['Antidepressivos', 'Citalopram (dose máxima de 40 mg, e 20 mg acima de 60 anos), escitalopram, tricíclicos'],
          ['Outros', 'Metadona, ondansetrona (sobretudo endovenosa em dose alta), domperidona, antieméticos, inibidores de tirosina-quinase'],
          ['Fatores agravantes', 'Hipocalemia, hipomagnesemia, hipocalcemia, bradicardia, sexo feminino, cardiopatia estrutural, QT longo congênito'],
        ],
        alerta: 'Antes de somar um segundo fármaco que prolonga o QT, faça eletrocardiograma e corrija potássio e magnésio. QTc acima de 500 ms ou aumento de 60 ms em relação ao basal exige suspensão.',
      },
      serotonina: {
        titulo: 'Síndrome serotoninérgica',
        explicacao: 'Tríade de alteração do estado mental, hiperatividade autonômica e alterações neuromusculares (clônus é o achado mais específico, tipicamente mais intenso nos membros inferiores). Instala-se em horas.',
        linhas: [
          ['Inibidores de recaptação', 'Inibidores seletivos de recaptação de serotonina, venlafaxina, duloxetina, tricíclicos, trazodona'],
          ['Inibidores da monoaminoxidase', 'Tranilcipromina, fenelzina, selegilina, **linezolida**, azul de metileno'],
          ['Opioides', 'Tramadol, fentanil, meperidina, metadona, oxicodona'],
          ['Outros', 'Triptanos, ondansetrona, metoclopramida, lítio, erva-de-são-joão, dextrometorfano, anfetaminas, cocaína, MDMA'],
          ['Tratamento', 'Suspender os agentes, suporte, benzodiazepínico para agitação e rigidez, resfriamento ativo; ciproeptadina nos casos moderados a graves. **Evitar antipiréticos**, que não funcionam (a hipertermia é muscular) e **evitar bloqueio neuromuscular despolarizante** na rigidez grave'],
        ],
        alerta: 'A linezolida é um inibidor da monoaminoxidase que quase ninguém lembra que é. Verifique antidepressivos antes de prescrevê-la.',
      },
      sangramento: {
        titulo: 'Risco de sangramento',
        explicacao: 'Os mecanismos se somam: inibição da hemostasia primária (plaquetas), da secundária (fatores) e lesão da mucosa gástrica.',
        linhas: [
          ['Anticoagulante + antiagregante', 'Aumento substancial do risco. A terapia tripla (anticoagulante + dois antiagregantes) deve ser a mais curta possível'],
          ['Anti-inflamatórios não esteroidais', 'Somam inibição plaquetária e lesão de mucosa. **Evite em qualquer anticoagulado**'],
          ['Inibidores seletivos de recaptação de serotonina', 'Depletam serotonina plaquetária e aumentam sangramento digestivo, sobretudo com anti-inflamatório ou anticoagulante'],
          ['Corticoide + anti-inflamatório', 'Multiplica o risco de úlcera péptica'],
          ['Proteção gástrica', 'Inibidor de bomba de prótons indicado em anticoagulado com fator de risco adicional, ou em uso concomitante de antiagregante ou anti-inflamatório'],
        ],
        alerta: 'Pergunte ativamente sobre anti-inflamatórios de venda livre e fitoterápicos — ginkgo, alho e ginseng em altas doses também afetam a hemostasia.',
      },
      hipercalemia: {
        titulo: 'Hipercalemia medicamentosa',
        explicacao: 'A combinação de agentes que reduzem a excreção renal de potássio é uma das causas mais comuns e mais evitáveis de hipercalemia grave.',
        linhas: [
          ['Bloqueadores do sistema renina-angiotensina', 'Inibidores da ECA, bloqueadores do receptor de angiotensina, inibidor de renina, sacubitril-valsartana'],
          ['Antagonistas mineralocorticoides', 'Espironolactona, eplerenona, finerenona'],
          ['Antimicrobianos', '**Sulfametoxazol-trimetoprima** (a trimetoprima bloqueia o canal epitelial de sódio, como a amilorida), pentamidina'],
          ['Outros', 'Anti-inflamatórios, heparina (inibe a síntese de aldosterona), betabloqueadores não seletivos, digoxina em intoxicação, tacrolimo, ciclosporina, suplementos de potássio, substitutos do sal'],
          ['Alto risco', 'Doença renal crônica, diabetes, idosos, insuficiência cardíaca, hipoaldosteronismo hiporreninêmico'],
        ],
        alerta: 'A associação de sulfametoxazol-trimetoprima com inibidor da ECA em idosos foi associada a aumento de morte súbita em estudos de base populacional. Dose potássio antes e alguns dias após iniciar.',
      },
      depressao: {
        titulo: 'Depressão do sistema nervoso central e respiratória',
        explicacao: 'Efeito aditivo e frequentemente sinérgico, com risco de depressão respiratória, quedas e delirium.',
        linhas: [
          ['Opioide + benzodiazepínico', '**A combinação mais perigosa.** Aumenta substancialmente o risco de morte por depressão respiratória. Evite; se inevitável, use as menores doses e considere naloxona domiciliar'],
          ['Álcool', 'Potencializa todos os depressores'],
          ['Anti-histamínicos de primeira geração', 'Prometazina, difenidramina, hidroxizina — sedação e efeito anticolinérgico'],
          ['Carga anticolinérgica', 'Somatório de anticolinérgicos causa delirium, retenção urinária, constipação, boca seca e declínio cognitivo em idosos'],
          ['Gabapentinoides', 'Gabapentina e pregabalina potencializam opioides e aumentam risco de depressão respiratória'],
        ],
        alerta: 'Em idosos, some a carga anticolinérgica de toda a prescrição — vários fármacos "fracos" somados produzem efeito de um anticolinérgico potente.',
      },
    }
    const d = dados[m]
    return {
      titulo: d.titulo,
      valor: d.explicacao,
      nivel: 'atencao',
      detalhes: [],
      interpretacao: [
        d.explicacao,
        '**Pensar por mecanismo é superior a consultar listas.** As listas envelhecem e nunca são completas; o mecanismo permite antecipar interações com fármacos novos e reconhecer padrões — se um fármaco é substrato de CYP3A4 e o paciente vai iniciar rifampicina, o problema é previsível sem consultar nada.',
        '**Nem toda interação listada muda conduta.** A relevância depende da magnitude do efeito, da janela terapêutica do fármaco afetado e da gravidade do desfecho. Interação relevante é aquela que altera dose, exige monitorização ou contraindica a associação.',
        'Os momentos de maior risco são as **transições de cuidado**: admissão, alta e mudança de nível assistencial. A reconciliação medicamentosa nesses pontos é a intervenção com maior rendimento.',
      ],
      tabela: { titulo: d.titulo, colunas: ['Categoria', 'Fármacos e conduta'], linhas: d.linhas },
      alertas: [d.alerta],
    }
  },
  formula: [],
  fundamento:
    'As interações medicamentosas se dividem em farmacocinéticas — quando um fármaco altera a absorção, distribuição, metabolismo ou excreção do outro — e farmacodinâmicas — quando dois fármacos atuam sobre o mesmo sistema fisiológico, somando ou antagonizando efeitos. As primeiras são previsíveis pelo conhecimento das enzimas e transportadores; as segundas, pelo conhecimento do efeito.',
  armadilhas: [
    'Fitoterápicos e suplementos participam de interações relevantes e raramente são relatados espontaneamente. Pergunte explicitamente.',
    'Suco de toranja (grapefruit) inibe CYP3A4 intestinal por dias, não horas — espaçar a ingestão não resolve.',
  ],
  referencias: [
    { texto: 'Flockhart DA, Thacker D, McDonald C, Desta Z. The Flockhart Cytochrome P450 Drug-Drug Interaction Table. Universidade de Indiana; atualização contínua.' },
    { texto: 'Boyer EW, Shannon M. The serotonin syndrome. N Engl J Med. 2005;352(11):1112-1120.' },
  ],
}

const compatibilidade: Ferramenta = {
  id: 'compatibilidade-intravenosa',
  nome: 'Compatibilidade de medicamentos intravenosos',
  sinonimos: ['compatibilidade', 'incompatibilidade', 'y-site', 'precipitacao', 'infusao simultanea'],
  resumo: 'Princípios e incompatibilidades clássicas de administração simultânea em via comum.',
  categorias: ['farmacologia', 'emergencia'],
  campos: [
    campoOpc('grupo', 'Grupo a consultar', [
      { valor: 'classicas', rotulo: 'Incompatibilidades clássicas' },
      { valor: 'diluentes', rotulo: 'Escolha do diluente' },
      { valor: 'nutricao', rotulo: 'Nutrição parenteral e hemocomponentes' },
      { valor: 'principios', rotulo: 'Princípios gerais e prática segura' },
    ]),
  ],
  calcular: (v) => {
    const g = opc(v, 'grupo')
    const dados: Record<string, string[][]> = {
      classicas: [
        ['Bicarbonato de sódio + cálcio', 'Precipita carbonato de cálcio. Nunca na mesma via sem lavagem intermediária generosa.'],
        ['Bicarbonato + catecolaminas', 'O pH alcalino inativa adrenalina, noradrenalina e dobutamina.'],
        ['Fenitoína + soro glicosado', 'Precipita. **Fenitoína só em salina.**'],
        ['Ceftriaxona + soluções com cálcio', 'Precipitado de ceftriaxona-cálcio, com relatos de óbito em neonatos. Contraindicada a coadministração em recém-nascidos; em outras idades, exige lavagem entre as infusões.'],
        ['Furosemida + midazolam', 'Incompatibilidade física — precipitação visível.'],
        ['Heparina + vancomicina, gentamicina, alteplase', 'Incompatíveis em via comum.'],
        ['Pantoprazol', 'Incompatível com a maioria dos fármacos em Y; administre em via exclusiva com lavagem.'],
        ['Diazepam e fenitoína', 'Adsorvem ao PVC dos equipos e precipitam com facilidade; prefira administração direta e lenta.'],
        ['Anfotericina B', 'Só em soro glicosado, e incompatível com salina — o contrário da fenitoína.'],
      ],
      diluentes: [
        ['Somente em salina 0,9%', 'Fenitoína, ampicilina (estabilidade curta), anfotericina B em lipídio (verificar formulação)'],
        ['Somente em glicose 5%', 'Anfotericina B desoxicolato, amiodarona (preferencialmente)'],
        ['Proteger da luz', 'Nitroprussiato de sódio (obrigatório), anfotericina B, nutrição parenteral com vitaminas'],
        ['Filtro em linha', 'Nutrição parenteral, manitol (cristalização), algumas formulações lipídicas'],
        ['Não refrigerar', 'Fenitoína e algumas suspensões — cristalizam'],
      ],
      nutricao: [
        ['Nutrição parenteral', 'Via **exclusiva** sempre que possível. A coadministração exige comprovação documentada de compatibilidade para aquele fármaco e aquela formulação.'],
        ['Emulsões lipídicas', 'Especialmente instáveis: pH baixo, cátions divalentes e alguns fármacos quebram a emulsão, com risco de embolia gordurosa.'],
        ['Hemocomponentes', '**Nada além de salina 0,9% na mesma via.** Ringer lactato contém cálcio e provoca coagulação no equipo; soluções glicosadas causam hemólise.'],
        ['Cálcio e fosfato na mesma bolsa', 'Risco de precipitação de fosfato de cálcio, que pode ser microscópica e não visível. A ordem de adição e o pH da mistura importam — é tarefa da farmácia.'],
      ],
      principios: [
        ['Regra prática', 'Na dúvida, **lave a via** com 10 a 20 mL de salina 0,9% entre os fármacos, ou use vias separadas.'],
        ['Sinais visíveis', 'Turvação, precipitado, mudança de cor, formação de gás ou de partículas indicam incompatibilidade — descarte, não infunda.'],
        ['Incompatibilidade invisível', 'Nem toda incompatibilidade é visível. Inativação química pode ocorrer sem qualquer alteração no aspecto — é por isso que a consulta a fonte confiável não é substituível pela inspeção.'],
        ['Lúmens do cateter central', 'Cateteres multilúmen permitem infusões simultâneas separadas, mas as saídas ficam próximas: incompatibilidades graves podem ocorrer mesmo em lúmens diferentes.'],
        ['Vias prioritárias', 'Reserve uma via exclusiva para vasoativos. Interromper ou "empurrar" um vasopressor ao administrar outro fármaco causa instabilidade hemodinâmica imediata.'],
        ['Fonte de consulta', 'Use base de dados validada (Trissel’s Handbook on Injectable Drugs, Micromedex) ou a tabela institucional da farmácia clínica. Compatibilidade depende de concentração, diluente, tempo de contato e temperatura.'],
      ],
    }
    return {
      titulo: 'Compatibilidade intravenosa',
      valor: 'Consulte a tabela',
      nivel: 'atencao',
      detalhes: [],
      interpretacao: [
        '**Compatibilidade não é uma propriedade fixa de um par de fármacos.** Ela depende da concentração de cada um, do diluente, do tempo de contato, da temperatura e da luz. Uma combinação compatível em determinada concentração pode precipitar em outra.',
        'A administração **em Y** (dois fármacos que se encontram numa conexão próxima ao paciente) tem tempo de contato de segundos, e por isso tolera combinações que seriam incompatíveis na mesma bolsa. Ainda assim, as incompatibilidades clássicas listadas ocorrem mesmo em Y.',
        '**Fármacos de alto risco merecem via exclusiva:** vasoativos, insulina em infusão contínua, nutrição parenteral, quimioterápicos, hemocomponentes, heparina e anfotericina B.',
        'Sempre que houver dúvida e não for possível consultar, a conduta segura é **lavar a via com salina** entre as administrações — solução simples que resolve a maioria dos casos.',
      ],
      tabela: { titulo: ['classicas', 'diluentes', 'nutricao', 'principios'].includes(g) ? 'Referência' : 'Referência', colunas: ['Item', 'Orientação'], linhas: dados[g] ?? dados.classicas },
      alertas: ['Esta é uma lista de referência das situações mais frequentes, não uma base de compatibilidade completa. Consulte a farmácia clínica do seu serviço para combinações não listadas.'],
    }
  },
  formula: [],
  fundamento:
    'Incompatibilidades intravenosas resultam de três mecanismos: **físicos** (precipitação por mudança de pH ou por formação de sal insolúvel, quebra de emulsão), **químicos** (hidrólise, oxidação, inativação) e de **adsorção** (o fármaco adere ao PVC do equipo ou ao filtro, reduzindo a dose entregue). O pH é o determinante mais frequente: fármacos ácidos e básicos misturados tendem a precipitar quando um deles atinge a faixa de pH em que é insolúvel.',
  armadilhas: [
    'A ausência de precipitado visível não garante compatibilidade química.',
    'Compatibilidade de infusão em Y é diferente de compatibilidade na mesma bolsa ou seringa — não extrapole entre as duas.',
  ],
  referencias: [
    { texto: 'Trissel LA. Handbook on Injectable Drugs. 21ª ed. American Society of Health-System Pharmacists; 2022.' },
    { texto: 'Bradley JS, Wassel RT, Lee L, Nambiar S. Intravenous ceftriaxone and calcium in the neonate. Pediatrics. 2009;123(4):e609-e613.' },
  ],
}

const receita: Ferramenta = {
  id: 'receita-estruturada',
  nome: 'Gerador de receita estruturada',
  sinonimos: ['receita', 'prescricao', 'receituario', 'como prescrever'],
  resumo: 'Monta uma prescrição completa e confere os elementos obrigatórios e de segurança.',
  categorias: ['farmacologia'],
  campos: [
    campoSeg('tipo', 'Tipo de receituário', [
      { valor: 'simples', rotulo: 'Simples (branca)' },
      { valor: 'controle', rotulo: 'Controle especial (branca em 2 vias)' },
      { valor: 'b', rotulo: 'Notificação B (azul) — psicotrópicos' },
      { valor: 'a', rotulo: 'Notificação A (amarela) — entorpecentes' },
      { valor: 'antimicrobiano', rotulo: 'Antimicrobiano (2 vias)' },
    ]),
    campoSimNao('paciente', 'Nome completo e endereço do paciente registrados', 1),
    campoSimNao('farmaco', 'Fármaco por nome genérico (denominação comum brasileira)', 1),
    campoSimNao('concentracao', 'Concentração e forma farmacêutica especificadas', 1),
    campoSimNao('quantidade', 'Quantidade total por extenso e em algarismos', 1),
    campoSimNao('posologia', 'Posologia com dose, via, intervalo e duração', 1),
    campoSimNao('orientacoes', 'Orientações ao paciente (jejum, horários, efeitos esperados)', 1),
    campoSimNao('identificacao', 'Identificação, assinatura, registro profissional e data', 1),
    campoSimNao('alergias', 'Alergias verificadas', 1),
    campoSimNao('interacoes', 'Interações com a medicação em uso verificadas', 1),
    campoSimNao('funcaoRenal', 'Ajuste por função renal e hepática verificado', 1),
  ],
  calcular: (v) => {
    const itens = ['paciente', 'farmaco', 'concentracao', 'quantidade', 'posologia', 'orientacoes', 'identificacao', 'alergias', 'interacoes', 'funcaoRenal']
    const marcados = itens.filter((id) => sim(v, id)).length
    const tipo = opc(v, 'tipo')
    const regras: Record<string, string[][]> = {
      simples: [['Validade', 'Geralmente 30 dias, salvo determinação local'], ['Vias', '1 via'], ['Retenção', 'Não retida']],
      controle: [['Cor', 'Branca, em 2 vias'], ['Validade', '30 dias'], ['Retenção', '1 via retida na farmácia'], ['Exemplos', 'Anticonvulsivantes, antiparkinsonianos, antirretrovirais, retinoides sistêmicos, imunossupressores, anabolizantes (lista C)']],
      b: [['Cor', 'Azul (notificação de receita B)'], ['Validade', '30 dias, válida apenas na unidade federativa emitente'], ['Quantidade máxima', 'Até 60 dias de tratamento (B1) ou 30 dias (B2)'], ['Exemplos', 'Benzodiazepínicos, zolpidem, anorexígenos']],
      a: [['Cor', 'Amarela (notificação de receita A)'], ['Validade', '30 dias, válida apenas na unidade federativa emitente'], ['Quantidade máxima', 'Até 30 dias de tratamento'], ['Exemplos', 'Morfina, metadona, fentanil, oxicodona, metilfenidato']],
      antimicrobiano: [['Vias', '2 vias'], ['Validade', '10 dias a partir da emissão'], ['Retenção', '1 via retida na farmácia'], ['Observação', 'Regulamentação da RDC 20/2011 e atualizações']],
    }
    const nivel: Nivel = marcados === itens.length ? 'ok' : marcados >= 7 ? 'atencao' : 'alerta'
    return {
      titulo: 'Conferência da prescrição',
      valor: `${marcados} de ${itens.length}`,
      unidade: 'itens conferidos',
      nivel,
      rotuloNivel: marcados === itens.length ? 'Prescrição completa' : 'Itens pendentes',
      detalhes: itens.map((id) => ({
        rotulo: {
          paciente: 'Identificação do paciente',
          farmaco: 'Nome genérico',
          concentracao: 'Concentração e forma farmacêutica',
          quantidade: 'Quantidade total',
          posologia: 'Posologia completa',
          orientacoes: 'Orientações ao paciente',
          identificacao: 'Identificação do prescritor',
          alergias: 'Alergias verificadas',
          interacoes: 'Interações verificadas',
          funcaoRenal: 'Ajuste por função de órgão',
        }[id]!,
        valor: sim(v, id) ? '✓ Conferido' : '✗ Pendente',
        nivel: sim(v, id) ? ('ok' as Nivel) : ('alerta' as Nivel),
      })),
      interpretacao: [
        '**Estrutura de uma prescrição segura:** nome genérico + concentração + forma farmacêutica + quantidade total + posologia (dose, via, intervalo, duração) + orientações. Cada elemento ausente é uma decisão transferida para outra pessoa, tipicamente com menos informação.',
        '**Abreviaturas perigosas a nunca usar:** "U" para unidades (confunde-se com zero — escreva "unidades"); "µg" manuscrito (escreva "mcg"); zero à direita ("1,0 mg" pode ser lido como 10 mg — escreva "1 mg"); ausência de zero à esquerda (".5 mg" pode ser lido como 5 mg — escreva "0,5 mg"); "QD", "QOD" e "TID" sem padronização institucional.',
        '**Dose máxima e duração explícitas** evitam uso indefinido. "Se necessário" sem dose máxima diária e sem intervalo mínimo é uma prescrição incompleta.',
        '**Escreva a indicação** ("para dor", "para pressão"). Isso reduz erro de dispensação, melhora a adesão e permite que outro profissional revise a prescrição com sentido.',
        'Letra ilegível continua sendo causa de erro grave. Prescrição eletrônica com suporte à decisão é a intervenção com maior impacto documentado na redução de erros de medicação.',
      ],
      tabela: { titulo: 'Regras do receituário selecionado', colunas: ['Item', 'Regra'], linhas: regras[tipo] ?? regras.simples },
      alertas: ['As regras de receituário seguem a Portaria SVS/MS 344/1998 e suas atualizações, além das normas da Anvisa e dos conselhos profissionais. Confirme a regulamentação vigente e as normas locais.'],
    }
  },
  formula: [],
  fundamento:
    'A prescrição é um documento legal e um ato de comunicação. Erros de prescrição respondem por parcela substancial dos eventos adversos evitáveis em saúde, e a maioria decorre de omissão — dose sem via, fármaco sem concentração, "se necessário" sem limite — e não de escolha terapêutica errada.',
  armadilhas: [
    'Prescrever pelo nome comercial dificulta a dispensação e favorece a troca por fármaco semelhante.',
    '"Uso contínuo" sem data de reavaliação é como polifarmácia se instala. Toda prescrição crônica precisa de horizonte de revisão.',
  ],
  referencias: [
    { texto: 'Brasil. Portaria SVS/MS nº 344, de 12 de maio de 1998, e atualizações.' },
    { texto: 'Institute for Safe Medication Practices. ISMP List of Error-Prone Abbreviations, Symbols, and Dose Designations. 2021.' },
  ],
}

const doseMaxima: Ferramenta = {
  id: 'dose-maxima-intervalo',
  nome: 'Dose máxima diária e intervalo entre doses',
  sinonimos: ['dose maxima', 'teto de dose', 'intervalo entre doses', 'dose diaria maxima'],
  resumo: 'Tetos de dose e intervalos mínimos dos fármacos de uso mais frequente.',
  categorias: ['farmacologia'],
  campos: [
    campoOpc('classe', 'Classe', [
      { valor: 'analgesicos', rotulo: 'Analgésicos e antitérmicos' },
      { valor: 'antiinflamatorios', rotulo: 'Anti-inflamatórios' },
      { valor: 'opioides', rotulo: 'Opioides com teto' },
      { valor: 'antihipertensivos', rotulo: 'Anti-hipertensivos' },
      { valor: 'psicotropicos', rotulo: 'Psicotrópicos' },
      { valor: 'outros', rotulo: 'Outros de uso frequente' },
    ]),
    campoPeso({ opcional: true }),
  ],
  calcular: (v) => {
    const classe = opc(v, 'classe')
    const peso = num(v, 'peso')
    const tabelas: Record<string, string[][]> = {
      analgesicos: [
        ['Paracetamol', '4 g/dia em adultos saudáveis; **3 g/dia** é o limite prudente e 2 g/dia em hepatopatas, etilistas e desnutridos. Intervalo mínimo de 4 h. Pediatria: 10 a 15 mg/kg/dose a cada 4 a 6 h, máximo de 75 mg/kg/dia.'],
        ['Dipirona', '4 g/dia (1 g a cada 6 h). Pediatria: 10 a 25 mg/kg/dose a cada 6 h.'],
        ['Ácido acetilsalicílico (analgesia)', '4 g/dia. Contraindicado abaixo de 12 anos em quadro viral pelo risco de síndrome de Reye.'],
      ],
      antiinflamatorios: [
        ['Ibuprofeno', '3,2 g/dia (adulto); pediatria 10 mg/kg/dose a cada 6 a 8 h, máximo de 40 mg/kg/dia.'],
        ['Diclofenaco', '150 mg/dia.'],
        ['Naproxeno', '1000 a 1250 mg/dia.'],
        ['Cetoprofeno', '300 mg/dia.'],
        ['Cetorolaco', '**Máximo de 5 dias** de uso, 120 mg/dia parenteral (60 mg em idosos). Um dos anti-inflamatórios com maior risco de lesão renal e sangramento.'],
        ['Celecoxibe', '400 mg/dia.'],
      ],
      opioides: [
        ['Tramadol', '400 mg/dia (300 mg acima de 75 anos). O teto existe pelo risco de convulsão.'],
        ['Codeína', '360 mg/dia; habitualmente limitada pela associação com paracetamol.'],
        ['Buprenorfina', 'Efeito teto para depressão respiratória — mas não para analgesia em doses baixas.'],
        ['Morfina, oxicodona, hidromorfona, fentanil', '**Sem teto farmacológico.** A dose é limitada por efeitos adversos e titulada individualmente.'],
      ],
      antihipertensivos: [
        ['Losartana', '100 mg/dia'],
        ['Enalapril', '40 mg/dia'],
        ['Anlodipino', '10 mg/dia'],
        ['Hidroclorotiazida', '25 a 50 mg/dia (acima disso, mais efeito metabólico sem ganho pressórico)'],
        ['Clortalidona', '25 mg/dia'],
        ['Espironolactona', '25 a 50 mg/dia na hipertensão resistente; até 400 mg/dia na ascite'],
        ['Furosemida', 'Sem teto fixo; titulada pela resposta e pela função renal'],
      ],
      psicotropicos: [
        ['Citalopram', '**40 mg/dia** (20 mg acima de 60 anos ou com inibidor de CYP2C19) pelo prolongamento do QT'],
        ['Escitalopram', '20 mg/dia (10 mg em idosos)'],
        ['Sertralina', '200 mg/dia'],
        ['Fluoxetina', '80 mg/dia'],
        ['Venlafaxina', '225 a 375 mg/dia conforme a formulação'],
        ['Quetiapina', '800 mg/dia'],
        ['Haloperidol', '20 mg/dia (muito menos em idosos e no delirium: 0,5 a 2 mg)'],
        ['Metilfenidato', '60 a 72 mg/dia conforme a formulação'],
      ],
      outros: [
        ['Metformina', '2550 mg/dia (2000 mg é a dose habitual máxima efetiva)'],
        ['Levotiroxina', 'Sem teto fixo; titulada pelo TSH'],
        ['Omeprazol', '40 mg/dia na maioria das indicações; até 80 mg/dia em Zollinger-Ellison'],
        ['Ondansetrona', '**16 mg por dose endovenosa** (retirada a apresentação de 32 mg pelo risco de QT); 24 mg/dia por via oral'],
        ['Vitamina D', 'Limite superior tolerável de 4.000 UI/dia sem monitorização'],
        ['Sulfato ferroso', '200 mg de ferro elementar por dia no tratamento'],
      ],
    }
    const linhas = tabelas[classe] ?? tabelas.analgesicos
    const detalhes: Resultado['detalhes'] = []
    if (peso !== null) {
      detalhes.push({ rotulo: 'Paracetamol pediátrico', valor: `${fmtInt(peso * 15)} mg por dose · máximo ${fmtInt(peso * 75)} mg/dia`, nota: '15 mg/kg/dose a cada 4 a 6 h.' })
      detalhes.push({ rotulo: 'Ibuprofeno pediátrico', valor: `${fmtInt(peso * 10)} mg por dose · máximo ${fmtInt(peso * 40)} mg/dia`, nota: '10 mg/kg/dose a cada 6 a 8 h.' })
      detalhes.push({ rotulo: 'Dipirona pediátrica', valor: `${fmtInt(peso * 15)} mg por dose`, nota: '10 a 25 mg/kg/dose a cada 6 h.' })
    }
    return {
      titulo: 'Doses máximas',
      valor: `${linhas.length} fármacos`,
      nivel: 'neutro',
      detalhes,
      interpretacao: [
        '**Dose máxima não é dose alvo.** Ela marca o limite acima do qual o risco cresce sem ganho terapêutico — muitas vezes porque o efeito já atingiu um platô (curva dose-resposta) enquanto os efeitos adversos continuam lineares.',
        '**Efeito teto** é diferente de dose máxima. Anti-inflamatórios e tramadol têm efeito analgésico teto: acima de certa dose, só aumentam a toxicidade. Morfina e demais agonistas plenos não têm teto analgésico — a dose é limitada pela tolerância aos efeitos adversos.',
        'Os tetos **mudam com comorbidades**. Paracetamol de 4 g/dia é seguro em adulto hígido e perigoso em hepatopata, desnutrido ou etilista; ondansetrona em dose alta é segura em jovem hígido e arriscada em cardiopata com QT longo.',
        '**Cuidado com a duplicidade oculta.** Paracetamol está em dezenas de combinações de venda livre para gripe e dor — somar sem perceber é a causa mais comum de hepatotoxicidade por paracetamol.',
      ],
      tabela: { titulo: 'Doses máximas e intervalos', colunas: ['Fármaco', 'Dose máxima e observações'], linhas },
      alertas: ['Confira sempre a bula e o protocolo institucional. Estas são doses de referência para adultos com função renal e hepática normais.'],
    }
  },
  formula: [],
  fundamento:
    'A dose máxima de um fármaco deriva de três limites: o ponto em que a curva dose-resposta satura (acima do qual não há ganho), o ponto em que a toxicidade dose-dependente se torna inaceitável, e — em alguns casos — um mecanismo específico, como o limiar convulsivo do tramadol ou o prolongamento do QT do citalopram.',
  armadilhas: [
    'Idosos, hepatopatas, nefropatas e pessoas de baixo peso têm tetos menores do que os listados.',
    'Doses "máximas" em bula às vezes refletem apenas o que foi testado nos ensaios, não um limite fisiológico.',
  ],
  referencias: [
    { texto: 'Brasil. Agência Nacional de Vigilância Sanitária. Bulário eletrônico.' },
    { texto: 'Larson AM, Polson J, Fontana RJ, et al. Acetaminophen-induced acute liver failure. Hepatology. 2005;42(6):1364-1372.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  conversorOpioides,
  conversorBenzo,
  diluicao,
  farmacocinetica,
  doseHepatica,
  interacoes,
  compatibilidade,
  receita,
  doseMaxima,
]

export default ferramentas

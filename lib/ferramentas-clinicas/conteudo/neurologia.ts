import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoNum,
  campoOpc,
  campoSeg,
  campoSimNao,
  fmt,
  fmtInt,
  num,
  numOu,
  opc,
  sim,
  somaSimNao,
} from '../helpers'

/* ═════════════════════════════ Consciência ═════════════════════════════ */

const glasgow: Ferramenta = {
  id: 'glasgow',
  nome: 'Escala de Coma de Glasgow',
  sigla: 'ECG',
  sinonimos: ['glasgow', 'coma', 'gcs', 'nivel de consciencia'],
  resumo: 'A escala de consciência mais usada do mundo, com a reatividade pupilar acoplada.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('ocular', 'Abertura ocular', [
      { valor: '4', rotulo: '4 — espontânea', pontos: 4 },
      { valor: '3', rotulo: '3 — ao som (comando verbal)', pontos: 3 },
      { valor: '2', rotulo: '2 — à pressão (estímulo doloroso)', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
      { valor: '0', rotulo: 'Não testável (edema, trauma orbitário)', pontos: 0 },
    ]),
    campoOpc('verbal', 'Resposta verbal', [
      { valor: '5', rotulo: '5 — orientada', pontos: 5 },
      { valor: '4', rotulo: '4 — confusa', pontos: 4 },
      { valor: '3', rotulo: '3 — palavras isoladas', pontos: 3 },
      { valor: '2', rotulo: '2 — sons incompreensíveis', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
      { valor: '0', rotulo: 'Não testável (tubo, traqueostomia)', pontos: 0 },
    ]),
    campoOpc('motora', 'Melhor resposta motora', [
      { valor: '6', rotulo: '6 — obedece a comandos', pontos: 6 },
      { valor: '5', rotulo: '5 — localiza a dor', pontos: 5 },
      { valor: '4', rotulo: '4 — flexão normal (retirada)', pontos: 4 },
      { valor: '3', rotulo: '3 — flexão anormal (decorticação)', pontos: 3 },
      { valor: '2', rotulo: '2 — extensão (descerebração)', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ]),
    campoOpc('pupilas', 'Reatividade pupilar (para o GCS-P)', [
      { valor: '0', rotulo: 'Ambas reativas', pontos: 0 },
      { valor: '1', rotulo: 'Uma não reativa', pontos: 1 },
      { valor: '2', rotulo: 'Nenhuma reativa', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const o = num(v, 'ocular')
    const ve = num(v, 'verbal')
    const m = num(v, 'motora')
    const p = numOu(v, 'pupilas', 0)
    if (o === null || ve === null || m === null) return null
    const naoTestavel = o === 0 || ve === 0
    const total = o + ve + m
    const gcsP = Math.max(1, total - p)
    const gravidade = total <= 8 ? 'Grave' : total <= 12 ? 'Moderado' : 'Leve'
    const nivel: Nivel = total <= 8 ? 'critico' : total <= 12 ? 'alerta' : total < 15 ? 'atencao' : 'ok'
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Abertura ocular', valor: o === 0 ? 'NT (não testável)' : `O${o}` },
      { rotulo: 'Resposta verbal', valor: ve === 0 ? 'NT (não testável)' : `V${ve}` },
      { rotulo: 'Resposta motora', valor: `M${m}`, nota: 'É o componente com maior peso prognóstico isolado.' },
      { rotulo: 'GCS-P (Glasgow com pupilas)', valor: String(gcsP), nota: `Total ${total} menos ${p} ponto(s) de reatividade pupilar. Estende a escala para baixo (mínimo 1) e melhora a discriminação prognóstica no extremo grave.`, nivel: gcsP <= 4 ? 'critico' : 'neutro' },
    ]
    return {
      titulo: naoTestavel ? 'Glasgow (com componente não testável)' : 'Escala de Coma de Glasgow',
      valor: naoTestavel ? `${total} (parcial)` : String(total),
      unidade: 'de 15',
      nivel,
      rotuloNivel: `Traumatismo cranioencefálico ${gravidade.toLowerCase()}`,
      detalhes,
      conduta: [
        '**Glasgow ≤ 8** é indicação clássica de **via aérea definitiva**, mas a decisão não é automática: pese a causa (intoxicação reversível, pós-ictal, hipoglicemia), a trajetória e a capacidade de proteger a via aérea. Antes de intubar, corrija o que pode reverter em minutos — glicemia capilar, naloxona se houver suspeita de opioide, tiamina.',
        'Registre sempre os **três componentes separados** (por exemplo, O2V2M4 = 8), não apenas a soma: escores iguais podem significar prognósticos muito diferentes, e o componente **motor** é o que mais pesa na predição de desfecho. A soma isolada perde a informação que mais importa.',
        'Reavalie e documente a **tendência**: uma queda de 2 pontos ou mais exige neuroimagem imediata e reavaliação de hipertensão intracraniana. O escore é útil como monitor seriado, e uma única medida no pior momento clínico (logo após a convulsão, sob sedação) não representa o paciente.',
        'Em trauma cranioencefálico, combine com os sinais de **herniação** — anisocoria, postura de descerebração ou decorticação, tríade de Cushing (hipertensão, bradicardia, respiração irregular). Diante deles, aplique medidas de resgate: cabeceira a 30°, cabeça neutra, salina hipertônica ou manitol, normocapnia (hiperventilação apenas por minutos, como ponte para a cirurgia) e neurocirurgia imediata.',
        'Anote as **condições que invalidam itens**: paciente intubado (registre V como \'T\' e considere escalas alternativas como FOUR), edema palpebral que impede a abertura ocular, sedação, curarização, afasia e barreira de idioma. Pontuar como se o item fosse avaliável produz escores falsamente baixos e decisões erradas.',
      ],
      interpretacao: [
        naoTestavel
          ? '⚠ **Componente não testável.** A recomendação atual é **relatar cada componente separadamente** com a marcação NT, e não somar atribuindo 1 ponto arbitrário — somar produz um total falsamente baixo. Registre no formato "O4 VNT M6".'
          : 'Registre sempre os três componentes separadamente (por exemplo, O3 V4 M5), não apenas o total. Um Glasgow 9 pode ser O1 V3 M5 ou O4 V1 M4 — quadros neurológicos completamente diferentes com o mesmo número.',
        total <= 8
          ? '**Glasgow ≤ 8** é o limiar clássico de indicação de via aérea definitiva por incapacidade de proteção. A regra prática "menor ou igual a 8, intube" é razoável, mas não substitui a avaliação de reflexos de via aérea, trajetória (melhorando ou piorando) e causa reversível — hipoglicemia e intoxicação por opioide se revertem sem tubo.'
          : total <= 12
            ? 'Faixa moderada: tomografia de crânio indicada em contexto de trauma, com observação e reavaliações seriadas.'
            : 'Faixa leve. Aplique os critérios canadenses ou o de New Orleans para decidir tomografia — nem todo trauma leve precisa de imagem.',
        'A resposta motora é o componente mais robusto e o de melhor valor prognóstico. Em avaliações rápidas, muitos serviços usam apenas o componente motor ou a escala AVPU como triagem.',
      ],
      alertas: [
        'Sedação, bloqueio neuromuscular, intoxicação, hipoglicemia, hipóxia e hipotensão prejudicam a avaliação. Sempre que possível, avalie **antes** de sedar e registre as condições.',
        'Em crianças menores de 5 anos, use a escala pediátrica, com respostas verbal e motora adaptadas à idade.',
      ],
      tabela: {
        titulo: 'Gravidade',
        colunas: ['Pontuação', 'Classificação'],
        linhas: [['13 – 15', 'Leve'], ['9 – 12', 'Moderado'], ['3 – 8', 'Grave']],
        destaque: total >= 13 ? 0 : total >= 9 ? 1 : 2,
      },
    }
  },
  formula: ['GCS = ocular (1–4) + verbal (1–5) + motora (1–6)', 'GCS-P = GCS − índice de reatividade pupilar (0, 1 ou 2)'],
  fundamento:
    'Teasdale e Jennett criaram a escala em Glasgow, em 1974, para resolver um problema de comunicação: expressões como "torporoso" e "obnubilado" significavam coisas diferentes para cada examinador. A escolha dos três eixos não foi arbitrária — abertura ocular reflete o sistema reticular ativador, a resposta verbal reflete a integração cortical e a resposta motora reflete a integridade das vias descendentes. A terminologia foi revisada em 2014 ("ao som" e "à pressão" em vez de "ao comando verbal" e "à dor") para padronizar o estímulo aplicado.',
  armadilhas: [
    'Afasia rebaixa o componente verbal sem que haja rebaixamento de consciência. Registre a limitação.',
    'Estímulo doloroso deve ser aplicado centralmente (pressão no trapézio, incisura supraorbitária) para diferenciar localização de retirada reflexa. Estímulo periférico isolado pode gerar apenas resposta espinhal.',
  ],
  referencias: [
    { texto: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet. 1974;2(7872):81-84.' },
    { texto: 'Brennan PM, Murray GD, Teasdale GM. Simplifying the use of prognostic information in traumatic brain injury: the GCS-Pupils score. J Neurosurg. 2018;128(6):1612-1620.' },
  ],
}

const nihss: Ferramenta = {
  id: 'nihss',
  nome: 'NIH Stroke Scale',
  sigla: 'NIHSS',
  sinonimos: ['nihss', 'nih', 'escala de avc', 'stroke scale'],
  resumo: 'Quantifica o déficit neurológico no AVC agudo em 15 itens padronizados.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('n1a', '1a. Nível de consciência', [
      { valor: '0', rotulo: '0 — alerta', pontos: 0 },
      { valor: '1', rotulo: '1 — desperta com estímulo mínimo', pontos: 1 },
      { valor: '2', rotulo: '2 — requer estímulo repetido ou doloroso', pontos: 2 },
      { valor: '3', rotulo: '3 — responde apenas reflexamente ou irresponsivo', pontos: 3 },
    ]),
    campoOpc('n1b', '1b. Perguntas (mês e idade)', [
      { valor: '0', rotulo: '0 — ambas corretas', pontos: 0 },
      { valor: '1', rotulo: '1 — uma correta', pontos: 1 },
      { valor: '2', rotulo: '2 — nenhuma correta', pontos: 2 },
    ]),
    campoOpc('n1c', '1c. Comandos (abrir/fechar olhos e mão)', [
      { valor: '0', rotulo: '0 — ambos corretos', pontos: 0 },
      { valor: '1', rotulo: '1 — um correto', pontos: 1 },
      { valor: '2', rotulo: '2 — nenhum correto', pontos: 2 },
    ]),
    campoOpc('n2', '2. Motricidade ocular', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '1', rotulo: '1 — paresia parcial do olhar', pontos: 1 },
      { valor: '2', rotulo: '2 — desvio forçado ou paresia total', pontos: 2 },
    ]),
    campoOpc('n3', '3. Campos visuais', [
      { valor: '0', rotulo: '0 — sem perda', pontos: 0 },
      { valor: '1', rotulo: '1 — hemianopsia parcial', pontos: 1 },
      { valor: '2', rotulo: '2 — hemianopsia completa', pontos: 2 },
      { valor: '3', rotulo: '3 — hemianopsia bilateral / cegueira cortical', pontos: 3 },
    ]),
    campoOpc('n4', '4. Paralisia facial', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '1', rotulo: '1 — paralisia menor', pontos: 1 },
      { valor: '2', rotulo: '2 — paralisia parcial (face inferior)', pontos: 2 },
      { valor: '3', rotulo: '3 — paralisia completa', pontos: 3 },
    ]),
    campoOpc('n5a', '5a. Motor — braço esquerdo', [
      { valor: '0', rotulo: '0 — sem queda por 10 s', pontos: 0 },
      { valor: '1', rotulo: '1 — queda parcial antes de 10 s', pontos: 1 },
      { valor: '2', rotulo: '2 — algum esforço contra a gravidade', pontos: 2 },
      { valor: '3', rotulo: '3 — sem esforço contra a gravidade', pontos: 3 },
      { valor: '4', rotulo: '4 — nenhum movimento', pontos: 4 },
    ]),
    campoOpc('n5b', '5b. Motor — braço direito', [
      { valor: '0', rotulo: '0 — sem queda por 10 s', pontos: 0 },
      { valor: '1', rotulo: '1 — queda parcial', pontos: 1 },
      { valor: '2', rotulo: '2 — algum esforço contra a gravidade', pontos: 2 },
      { valor: '3', rotulo: '3 — sem esforço contra a gravidade', pontos: 3 },
      { valor: '4', rotulo: '4 — nenhum movimento', pontos: 4 },
    ]),
    campoOpc('n6a', '6a. Motor — perna esquerda', [
      { valor: '0', rotulo: '0 — sem queda por 5 s', pontos: 0 },
      { valor: '1', rotulo: '1 — queda parcial', pontos: 1 },
      { valor: '2', rotulo: '2 — algum esforço contra a gravidade', pontos: 2 },
      { valor: '3', rotulo: '3 — sem esforço contra a gravidade', pontos: 3 },
      { valor: '4', rotulo: '4 — nenhum movimento', pontos: 4 },
    ]),
    campoOpc('n6b', '6b. Motor — perna direita', [
      { valor: '0', rotulo: '0 — sem queda por 5 s', pontos: 0 },
      { valor: '1', rotulo: '1 — queda parcial', pontos: 1 },
      { valor: '2', rotulo: '2 — algum esforço contra a gravidade', pontos: 2 },
      { valor: '3', rotulo: '3 — sem esforço contra a gravidade', pontos: 3 },
      { valor: '4', rotulo: '4 — nenhum movimento', pontos: 4 },
    ]),
    campoOpc('n7', '7. Ataxia apendicular', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — presente em um membro', pontos: 1 },
      { valor: '2', rotulo: '2 — presente em dois membros', pontos: 2 },
    ]),
    campoOpc('n8', '8. Sensibilidade', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '1', rotulo: '1 — perda leve a moderada', pontos: 1 },
      { valor: '2', rotulo: '2 — perda grave ou total', pontos: 2 },
    ]),
    campoOpc('n9', '9. Linguagem', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '1', rotulo: '1 — afasia leve a moderada', pontos: 1 },
      { valor: '2', rotulo: '2 — afasia grave', pontos: 2 },
      { valor: '3', rotulo: '3 — mutismo / afasia global', pontos: 3 },
    ]),
    campoOpc('n10', '10. Disartria', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '1', rotulo: '1 — leve a moderada', pontos: 1 },
      { valor: '2', rotulo: '2 — grave / ininteligível', pontos: 2 },
    ]),
    campoOpc('n11', '11. Extinção e desatenção (negligência)', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — desatenção em uma modalidade', pontos: 1 },
      { valor: '2', rotulo: '2 — desatenção profunda ou em mais de uma modalidade', pontos: 2 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['n1a', 'n1b', 'n1c', 'n2', 'n3', 'n4', 'n5a', 'n5b', 'n6a', 'n6b', 'n7', 'n8', 'n9', 'n10', 'n11']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total === 0 ? 0 : total <= 4 ? 1 : total <= 15 ? 2 : total <= 20 ? 3 : 4
    const rotulos = ['Sem déficit', 'AVC leve', 'AVC moderado', 'AVC moderado a grave', 'AVC grave']
    const nivel: Nivel = (['ok', 'atencao', 'alerta', 'alerta', 'critico'] as Nivel[])[faixa]
    return {
      titulo: 'NIHSS',
      valor: String(total),
      unidade: 'de 42 pontos',
      nivel,
      rotuloNivel: rotulos[faixa],
      detalhes: [
        { rotulo: 'Probabilidade de bom desfecho em 3 meses', valor: total <= 6 ? 'Alta (cerca de 70 a 80% com Rankin 0–1)' : total <= 15 ? 'Intermediária' : 'Baixa sem reperfusão' },
        { rotulo: 'Faixa de indicação de trombectomia', valor: 'NIHSS ≥ 6 com oclusão de grande vaso', nota: 'Critério dos ensaios de trombectomia mecânica; escores menores podem ser considerados caso a caso.' },
      ],
      conduta: [
        'Aplique o NIHSS **antes e depois da trombólise**, e em horários fixos nas primeiras 24 h. É a medida que detecta deterioração precoce e que, por isso, governa a decisão de repetir a tomografia em busca de transformação hemorrágica.',
        '**NIHSS < 6** costuma ser déficit leve, mas \'leve\' não significa \'sem tratamento\': déficit incapacitante — afasia, hemianopsia, déficit motor que impeça a profissão do paciente — justifica trombólise mesmo com escore baixo. A pergunta correta é se o déficit é incapacitante, não se o número é alto.',
        '**NIHSS ≥ 6** com oclusão de grande vaso na angiotomografia indica **trombectomia mecânica**, cuja janela vai a 6 h por rotina e até 24 h em pacientes selecionados por perfusão ou por mismatch clínico-radiológico. Solicite a angiotomografia de vasos intracranianos na mesma sessão da tomografia inicial — sem ela, a oclusão passa despercebida.',
        '**NIHSS > 22** marca déficit grave, com maior risco de transformação hemorrágica após trombólise. Não é contraindicação, mas exige vigilância redobrada, controle pressórico rigoroso (< 180/105 mmHg nas primeiras 24 h após trombólise) e discussão precoce sobre trajetória e objetivos.',
        'Conheça o **viés hemisférico** da escala: o hemisfério esquerdo dominante pontua mais alto pela linguagem, de modo que um infarto direito extenso — com heminegligência grave e prognóstico funcional ruim — pode somar poucos pontos. Não deixe de tratar um território direito extenso só porque o NIHSS é modesto.',
      ],
      alertas: [
        'A escala tem **viés hemisférico**: o hemisfério esquerdo dominante pontua mais alto pela linguagem. Um infarto direito extenso, com heminegligência grave e prognóstico funcional ruim, pode somar poucos pontos — não deixe de tratar por isso.',
        'Déficit incapacitante justifica trombólise mesmo com NIHSS baixo. A pergunta correta não é se o número é alto, e sim se o déficit é incapacitante para aquele paciente.',
      ],
      interpretacao: [
        '**O NIHSS não decide trombólise sozinho.** Não há limite superior de pontuação que contraindique alteplase ou tenecteplase; o limite inferior também é relativo — déficit incapacitante, ainda que com NIHSS baixo (afasia isolada, hemianopsia, déficit em mão dominante), é indicação, e essa foi a conclusão do estudo PRISMS sobre déficits leves.',
        'A escala é ponderada para território de artéria cerebral média esquerda: linguagem vale até 3 pontos e não há item específico para tronco. Um AVC de tronco devastador pode pontuar 3 ou 4, e uma oclusão basilar com síndrome do encarceramento pontua pouco relativamente à gravidade.',
        'A **variação** do NIHSS é o que mais importa clinicamente: queda de 4 ou mais pontos define melhora significativa; aumento de 4 ou mais exige tomografia imediata para excluir transformação hemorrágica.',
        'Aplicação padronizada é obrigatória — a escala tem manual, ordem fixa de itens e regra de pontuar a primeira resposta. Treinamento com certificação reduz muito a variabilidade entre examinadores.',
      ],
      tabela: {
        titulo: 'Gravidade',
        colunas: ['NIHSS', 'Classificação'],
        linhas: [['0', 'Sem déficit'], ['1 – 4', 'Leve'], ['5 – 15', 'Moderado'], ['16 – 20', 'Moderado a grave'], ['21 – 42', 'Grave']],
        destaque: faixa,
      },
    }
  },
  formula: ['Soma de 15 itens (0 a 42 pontos)'],
  fundamento:
    'A escala foi desenvolvida no fim dos anos 1980 para os ensaios clínicos de AVC do National Institutes of Health, com dois requisitos: ser aplicável em menos de 10 minutos e ter alta concordância entre examinadores. Cada item foi escolhido por representar um território vascular ou uma função cortical distinta, e a pontuação é ordinal, não linear — a diferença entre 2 e 4 não é a mesma que entre 20 e 22.',
  armadilhas: [
    'Não pontue o que o paciente já tinha antes. Déficit prévio de AVC antigo, amputação e cegueira preexistente devem ser registrados à parte.',
    'Pontue o que observar, não o que suspeitar. Se o paciente não coopera, a escala tem regras específicas para cada item.',
  ],
  referencias: [
    { texto: 'Brott T, Adams HP Jr, Olinger CP, et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke. 1989;20(7):864-870.' },
    { texto: 'Powers WJ, Rabinstein AA, Ackerson T, et al. Guidelines for the early management of patients with acute ischemic stroke: 2019 update. Stroke. 2019;50(12):e344-e418.' },
  ],
}

const abcd2: Ferramenta = {
  id: 'abcd2',
  nome: 'Escore ABCD²',
  sinonimos: ['abcd2', 'ait', 'ataque isquemico transitorio'],
  resumo: 'Risco de AVC nos dias seguintes a um ataque isquêmico transitório.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoSimNao('a', 'Idade ≥ 60 anos', 1, 'Marcador de carga aterosclerótica acumulada, não de gravidade do evento atual.'),
    campoSimNao('b', 'PA ≥ 140/90 mmHg na avaliação inicial', 1, 'A PA da primeira avaliação, não a habitual do paciente nem a de horas depois. Basta um dos dois valores atingir o corte.'),
    campoOpc('c', 'Características clínicas', [
      { valor: '2', rotulo: 'Fraqueza unilateral', pontos: 2 },
      { valor: '1', rotulo: 'Distúrbio de fala sem fraqueza', pontos: 1 },
      { valor: '0', rotulo: 'Outros sintomas', pontos: 0, descricao: 'Sintomas sensitivos isolados, tontura, alteração visual isolada. Cuidado: parte destes não é ataque isquêmico transitório, e sim enxaqueca, crise epiléptica, síncope ou vertigem periférica.' },
    ], { ajuda: 'Fraqueza unilateral vale o dobro do distúrbio de fala porque indica território arterial maior e mecanismo mais provavelmente ateroembólico de grande vaso.' }),
    campoOpc('d', 'Duração dos sintomas', [
      { valor: '2', rotulo: '≥ 60 minutos', pontos: 2 },
      { valor: '1', rotulo: '10 a 59 minutos', pontos: 1 },
      { valor: '0', rotulo: '< 10 minutos', pontos: 0 },
    ], { ajuda: 'Duração do episódio mais longo, medida pelo relato mais confiável disponível. Se os sintomas persistem no momento da avaliação, não é ataque transitório — é AVC em curso, e a via é a de trombólise, não a de escore.' }),
    campoSimNao('d2', 'Diabetes mellitus', 1, 'Diagnóstico prévio ou em uso de hipoglicemiante. É o segundo D do acrônimo, somado à Duração.'),
  ],
  calcular: (v) => {
    const c = num(v, 'c')
    const d = num(v, 'd')
    if (c === null || d === null) return null
    const total = somaSimNao(v, [{ id: 'a', pontos: 1 }, { id: 'b', pontos: 1 }, { id: 'd2', pontos: 1 }]) + c + d
    const faixa = total <= 3 ? 0 : total <= 5 ? 1 : 2
    return {
      titulo: 'ABCD²',
      valor: String(total),
      unidade: 'de 7 pontos',
      nivel: (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Risco baixo', 'Risco moderado', 'Risco alto'][faixa],
      detalhes: [
        { rotulo: 'Risco de AVC em 2 dias', valor: ['1,0%', '4,1%', '8,1%'][faixa] },
        { rotulo: 'Risco de AVC em 7 dias', valor: ['1,2%', '5,9%', '11,7%'][faixa] },
        { rotulo: 'Risco de AVC em 90 dias', valor: ['3,1%', '9,8%', '17,8%'][faixa] },
      ],
      interpretacao: [
        '**O papel do ABCD² mudou.** As diretrizes atuais recomendam investigação urgente de **todo** ataque isquêmico transitório, independentemente do escore, porque estudos como o EXPRESS e o SOS-TIA mostraram que avaliação e tratamento imediatos reduzem o risco de AVC subsequente em cerca de 80%. O escore permanece como estimativa de risco, não como triagem para decidir quem investiga.',
        'A investigação mínima e urgente inclui neuroimagem (preferencialmente ressonância com difusão, que revela infarto em até metade dos ataques transitórios "clínicos"), imagem vascular de carótidas e intracraniana, eletrocardiograma com monitorização prolongada e perfil metabólico.',
        '**Antiagregação dupla precoce** com AAS mais clopidogrel por 21 dias, iniciada nas primeiras 24 horas, reduz recorrência em ataque transitório de alto risco (ABCD² ≥ 4) e AVC menor (NIHSS ≤ 3) — resultado dos ensaios CHANCE e POINT. Depois desse período, mantém-se monoterapia.',
        'Estenose carotídea sintomática de 70 a 99% tem indicação de revascularização preferencialmente **nas primeiras duas semanas**; o benefício cai rapidamente com o tempo.',
        'A urgência do ataque isquêmico transitório se entende pela fisiopatologia da **placa instável**. O evento transitório quase nunca é um fenômeno isolado e benigno: é a manifestação clínica de uma superfície trombogênica ativa. Quando a capa fibrosa de uma placa aterosclerótica se rompe, expõe o núcleo lipídico rico em fator tecidual e colágeno subendotelial, que ativa plaquetas e a cascata de coagulação. O trombo plaquetário que se forma sobre essa lesão é friável e se fragmenta, embolizando distalmente — e se o êmbolo é pequeno e a fibrinólise endógena o dissolve rápido, o déficit é transitório. Mas a placa continua exposta, e o processo se repete com trombos progressivamente maiores. É por isso que o risco de AVC é máximo nas primeiras 48 horas e decai depois: existe uma janela em que a lesão está ativa, e é nela que a dupla antiagregação e a revascularização carotídea produzem quase todo o seu benefício. A mesma lógica explica a hierarquia de pontos do escore — fraqueza unilateral e duração longa indicam oclusão de vaso maior, típica de embolia de grande artéria, enquanto sintomas vagos e breves são mais compatíveis com doença de pequeno vaso ou com diagnósticos alternativos. O corolário prático é o mais importante: o escore estima risco, mas o mecanismo é que define a conduta, e o mecanismo se descobre com imagem vascular e monitorização de ritmo, não com pontuação.',
      ],
      conduta: [
        'Investigue **com urgência, independentemente do escore**. A meta é completar a avaliação em 24 a 48 horas, em unidade de AVC, serviço de emergência ou clínica de ataque transitório de acesso rápido — os ensaios EXPRESS e SOS-TIA mostraram redução de cerca de 80% no risco de AVC subsequente com avaliação e tratamento imediatos.',
        'Investigação mínima: **neuroimagem** (ressonância com difusão é preferível, pois revela infarto em até metade dos ataques clinicamente "transitórios"), **imagem vascular** de carótidas e circulação intracraniana (angiotomografia, angiorressonância ou dúplex), **eletrocardiograma com monitorização prolongada** (Holter de 24 a 72 horas ou mais, porque fibrilação atrial paroxística é subdiagnosticada) e perfil metabólico com glicemia, lipidograma e função renal.',
        total >= 4
          ? '**Antiagregação dupla precoce**: AAS 100 a 300 mg de ataque seguido de 100 mg/dia, associado a clopidogrel 300 mg de ataque e 75 mg/dia, iniciada nas primeiras 24 horas e mantida por 21 dias, depois monoterapia. O benefício vem dos ensaios CHANCE e POINT em ataque transitório de alto risco (ABCD² ≥ 4) e AVC menor (NIHSS ≤ 3), e concentra-se nas primeiras semanas — prolongar a dupla aumenta sangramento sem ganho.'
          : 'Antiagregação simples com AAS 100 mg/dia é suficiente no escore baixo, salvo se a investigação revelar mecanismo de alto risco (estenose sintomática, fibrilação atrial, trombo intracavitário) — nesse caso a conduta segue o mecanismo, não o escore.',
        'Trate a causa assim que ela aparecer: **estenose carotídea sintomática de 70 a 99%** tem indicação de endarterectomia ou angioplastia preferencialmente nas primeiras duas semanas, e o benefício cai rapidamente depois disso; **fibrilação atrial** indica anticoagulação plena (calcule o CHA₂DS₂-VASc e o HAS-BLED), não antiagregante.',
        'Instale a prevenção secundária completa antes da alta, porque ela não acontece sozinha depois: estatina de alta potência com alvo de LDL abaixo de 70 mg/dL (ou 55 em alto risco), controle pressórico progressivo, controle glicêmico, cessação do tabagismo, atividade física e orientação sobre reconhecimento de sinais de AVC.',
        'Oriente o paciente e a família explicitamente: sintoma novo é emergência e a via é o serviço de emergência, não a consulta de retorno. Um ataque transitório bem investigado e mal comunicado ainda resulta em chegada tardia no próximo evento.',
      ],
      alertas: [
        'O ABCD² **não** deve ser usado para decidir quem investiga. As diretrizes atuais recomendam investigação urgente de todo ataque isquêmico transitório, e escore baixo com estenose carotídea crítica ou fibrilação atrial não é baixo risco — o escore não vê o mecanismo.',
        'Se os sintomas persistem no momento da avaliação, não é ataque transitório: é AVC em curso, e a conduta é o protocolo de reperfusão com tempo de porta-agulha, não a aplicação de escore.',
        'A discriminação é apenas moderada em validações externas, e pior quando aplicado por não neurologistas — parte dos casos rotulados como ataque transitório é enxaqueca com aura, crise epiléptica focal, síncope, vertigem periférica ou hipoglicemia.',
        'Não se aplica a eventos de território posterior com sintomas atípicos, nem substitui a avaliação de dissecção arterial em paciente jovem com cervicalgia ou cefaleia associada.',
      ],
      tabela: {
        titulo: 'Risco de AVC após ataque isquêmico transitório',
        colunas: ['Pontos', 'Risco', 'Em 2 dias', 'Em 7 dias', 'Em 90 dias'],
        linhas: [
          ['0 – 3', 'Baixo', '1,0%', '1,2%', '3,1%'],
          ['4 – 5', 'Moderado', '4,1%', '5,9%', '9,8%'],
          ['6 – 7', 'Alto', '8,1%', '11,7%', '17,8%'],
        ],
        destaque: faixa,
      },
    }
  },
  formula: ['A (idade ≥ 60) 1 + B (PA ≥ 140/90) 1 + C (clínica) 0–2 + D (duração) 0–2 + D (diabetes) 1'],
  fundamento:
    'O escore foi derivado da união de duas coortes britânicas e traduz o que a fisiopatologia sugere: sintomas motores e duração longa indicam território arterial maior e mecanismo mais provavelmente ateroembólico; idade, hipertensão e diabetes indicam carga aterosclerótica. É um marcador de substrato, não de gatilho. Entender o substrato explica a urgência: o ataque isquêmico transitório é a manifestação de uma **placa instável ativa**. A ruptura da capa fibrosa expõe o núcleo lipídico rico em fator tecidual e o colágeno subendotelial, formando sobre a lesão um trombo plaquetário friável que se fragmenta e emboliza distalmente. Quando o êmbolo é pequeno e a fibrinólise endógena o dissolve rapidamente, o déficit regride — mas a superfície trombogênica permanece, e o processo se repete com trombos cada vez maiores. Daí o risco de AVC ser máximo nas primeiras 48 horas e decair progressivamente: existe uma janela de atividade da lesão, e é exatamente nela que a dupla antiagregação e a revascularização carotídea concentram seu benefício. Essa compreensão mudou o papel clínico do escore. Quando foi publicado, o ABCD² servia para triar quem precisava de internação e investigação imediata; depois que o EXPRESS e o SOS-TIA demonstraram redução de cerca de 80% no risco de AVC com avaliação e tratamento urgentes para todos, a triagem perdeu sentido — não há faixa de risco tão baixa que justifique esperar. O escore sobreviveu com duas funções mais modestas e ainda úteis: estimar risco para comunicar ao paciente e à equipe, e definir o limiar de ABCD² ≥ 4 que os ensaios CHANCE e POINT usaram para indicar dupla antiagregação por 21 dias.',
  armadilhas: [
    'Escore baixo com estenose carotídea crítica ou fibrilação atrial não é baixo risco. O ABCD² não vê o mecanismo.',
    'Discriminação apenas moderada em validações externas, com desempenho pior nas mãos de não neurologistas — parte dos "ataques transitórios" avaliados são, na verdade, enxaqueca, crise epiléptica ou síncope.',
    'Usar o escore como triagem para decidir quem investiga contraria as diretrizes atuais: todo ataque isquêmico transitório merece investigação urgente, e a maior parte do benefício do tratamento está nas primeiras 48 horas.',
    'Sintomas ainda presentes na avaliação descaracterizam o diagnóstico de evento transitório. Aplicar o escore nessa situação atrasa o protocolo de reperfusão, que é a conduta correta.',
    'O item de pressão arterial usa a medida da avaliação inicial. Elevação reativa ao evento é comum e pontua, o que é intencional — mas não deve ser tratada agressivamente na fase aguda.',
    'Ressonância com difusão normal não exclui o diagnóstico, e ressonância alterada reclassifica o caso como AVC isquêmico mesmo com sintomas já resolvidos, com implicações para direção de veículos, atestados e prevenção secundária.',
  ],
  referencias: [
    { texto: 'Johnston SC, Rothwell PM, Nguyen-Huynh MN, et al. Validation and refinement of scores to predict very early stroke risk after transient ischaemic attack. Lancet. 2007;369(9558):283-292.' },
    { texto: 'Rothwell PM, Giles MF, Chandratheva A, et al. Effect of urgent treatment of transient ischaemic attack and minor stroke on early recurrent stroke (EXPRESS). Lancet. 2007;370(9596):1432-1442.' },
  ],
}

const ich: Ferramenta = {
  id: 'ich-score',
  nome: 'Escore ICH para hemorragia intracerebral',
  sinonimos: ['ich score', 'hemorragia intracerebral', 'avc hemorragico'],
  resumo: 'Estima mortalidade em 30 dias na hemorragia intraparenquimatosa espontânea.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('gcs', 'Escala de Coma de Glasgow', [
      { valor: '0', rotulo: '13 a 15', pontos: 0 },
      { valor: '1', rotulo: '5 a 12', pontos: 1 },
      { valor: '2', rotulo: '3 a 4', pontos: 2 },
    ]),
    campoSimNao('volume', 'Volume do hematoma ≥ 30 cm³', 1, 'Estime pelo método ABC/2 na tomografia.'),
    campoSimNao('ventricular', 'Extensão intraventricular', 1),
    campoSimNao('infratentorial', 'Origem infratentorial', 1),
    campoSimNao('idade', 'Idade ≥ 80 anos', 1),
    campoNum('a', 'Maior diâmetro do hematoma (A)', { unidade: 'cm', min: 0.5, max: 15, passo: 0.1, opcional: true, ajuda: 'Para o cálculo ABC/2 do volume.' }),
    campoNum('b', 'Diâmetro perpendicular ao maior (B)', { unidade: 'cm', min: 0.5, max: 15, passo: 0.1, opcional: true }),
    campoNum('cortes', 'Número de cortes em que o hematoma aparece', { min: 1, max: 60, passo: 1, opcional: true }),
    campoNum('espessura', 'Espessura do corte', { unidade: 'cm', min: 0.1, max: 1, passo: 0.1, padrao: '0.5', opcional: true }),
  ],
  calcular: (v) => {
    const gcs = num(v, 'gcs')
    if (gcs === null) return null
    const total =
      gcs +
      somaSimNao(v, [
        { id: 'volume', pontos: 1 },
        { id: 'ventricular', pontos: 1 },
        { id: 'infratentorial', pontos: 1 },
        { id: 'idade', pontos: 1 },
      ])
    const mortalidade = ['0%', '13%', '26%', '72%', '97%', '100%', '100%'][Math.min(total, 6)]
    const detalhes: Resultado['detalhes'] = [{ rotulo: 'Mortalidade em 30 dias', valor: mortalidade, nota: 'Coorte de derivação de Hemphill et al. (2001).' }]
    const a = num(v, 'a')
    const b = num(v, 'b')
    const cortes = num(v, 'cortes')
    const esp = numOu(v, 'espessura', 0.5)
    if (a !== null && b !== null && cortes !== null) {
      const c = cortes * esp
      const volume = (a * b * c) / 2
      detalhes.unshift({ rotulo: 'Volume do hematoma (ABC/2)', valor: `${fmt(volume, 1)} cm³`, nota: `A = ${fmt(a, 1)} cm, B = ${fmt(b, 1)} cm, C = ${fmt(c, 1)} cm. Volume ≥ 30 cm³ pontua no escore.`, nivel: volume >= 30 ? 'alerta' : 'ok' })
    }
    const nivel: Nivel = total >= 4 ? 'critico' : total >= 2 ? 'alerta' : 'atencao'
    return {
      titulo: 'Escore ICH',
      valor: String(total),
      unidade: 'de 6 pontos',
      nivel,
      rotuloNivel: `Mortalidade em 30 dias de ${mortalidade}`,
      detalhes,
      conduta: [
        'Use o escore para **informar o prognóstico e a intensidade do cuidado**, nunca como profecia autorrealizável. Limitações precoces de suporte baseadas em ICH alto enviesam as estatísticas históricas; as diretrizes recomendam **adiar a decisão de não reanimar por pelo menos 48–72 h** de tratamento pleno.',
        'Independentemente do escore, execute o que muda desfecho nas primeiras horas: **reduzir a pressão sistólica para 130–150 mmHg** de forma controlada (a queda abrupta e excessiva é prejudicial), **reverter a anticoagulação imediatamente** e **evitar a expansão do hematoma**, que ocorre nas primeiras 6 horas e é o principal determinante modificável.',
        'A reversão depende do agente: **complexo protrombínico com vitamina K** para varfarina (mais rápido e eficaz que plasma), **idarucizumabe** para dabigatrana, **andexanet alfa** ou complexo protrombínico para inibidores do fator Xa, **protamina** para heparina. Ácido tranexâmico pode reduzir a expansão, mas não melhorou desfecho funcional.',
        'Acione a **neurocirurgia** diante de hemorragia cerebelar > 3 cm, hidrocefalia obstrutiva (derivação ventricular externa), hematoma lobar superficial com deterioração, e hemorragia com efeito de massa significativo. A cirurgia precoce minimamente invasiva vem ganhando espaço em hematomas lobares de volume intermediário.',
        'Investigue a **causa** com a mesma prioridade: angiotomografia ou angiografia em paciente jovem, sem hipertensão, com hemorragia lobar ou com padrão atípico, para excluir malformação arteriovenosa, aneurisma, trombose venosa e tumor. Em idoso com hemorragias lobares recorrentes, considere **angiopatia amiloide** — o que contraindica a reintrodução de anticoagulante e muda todo o planejamento.',
      ],
      interpretacao: [
        '**Cuidado com a profecia autorrealizável.** As taxas de mortalidade da coorte original refletem uma era com limitação precoce de suporte. Estudos posteriores mostraram que a mortalidade observada é menor quando o cuidado é mantido — e por isso as diretrizes recomendam **adiar decisões de limitação de suporte por pelo menos 48 a 72 horas**. Usar o escore para justificar não tratar produz o desfecho que ele previu.',
        'Condutas com benefício demonstrado: **redução da pressão arterial sistólica para 130 a 150 mmHg**, iniciada precocemente e alcançada de forma suave (o ensaio INTERACT3, com pacote de cuidados, mostrou benefício funcional); **reversão imediata de anticoagulação** (complexo protrombínico para antagonistas da vitamina K, idarucizumabe para dabigatrana, andexanet alfa ou complexo protrombínico para inibidores do fator Xa); controle glicêmico, da temperatura e prevenção de crises.',
        'Cirurgia de evacuação permanece controversa em hematomas supratentoriais profundos. Hematoma **cerebelar** com mais de 3 cm, com deterioração neurológica ou compressão de tronco e hidrocefalia, é exceção clara: a evacuação é indicada e salva vidas.',
      ],
      alertas: ['Expansão do hematoma ocorre em cerca de um terço dos casos nas primeiras horas e é o principal determinante modificável do desfecho. Repita a tomografia diante de qualquer piora.'],
    }
  },
  formula: ['Volume ABC/2 = (A × B × C) / 2, com C = número de cortes × espessura', 'ICH = Glasgow (0–2) + volume ≥ 30 cm³ + intraventricular + infratentorial + idade ≥ 80'],
  fundamento:
    'O escore foi derivado de uma coorte prospectiva de hemorragias intracerebrais espontâneas, escolhendo as cinco variáveis independentemente associadas a mortalidade em 30 dias. Cada uma representa um mecanismo: nível de consciência reflete a gravidade global, volume e extensão ventricular refletem o efeito de massa e a hidrocefalia, localização infratentorial reflete a proximidade do tronco, e idade reflete a reserva.',
  armadilhas: [
    'O método ABC/2 assume forma elipsoide e superestima hematomas irregulares ou lobares em até 30%.',
    'O escore não foi validado para hemorragia secundária (malformação arteriovenosa, aneurisma, tumor, trombose venosa) — apenas para hemorragia espontânea hipertensiva ou por angiopatia amiloide.',
  ],
  referencias: [
    { texto: 'Hemphill JC 3rd, Bonovich DC, Besmertis L, Manley GT, Johnston SC. The ICH score: a simple, reliable grading scale for intracerebral hemorrhage. Stroke. 2001;32(4):891-897.' },
    { texto: 'Greenberg SM, Ziai WC, Cordonnier C, et al. 2022 Guideline for the management of patients with spontaneous intracerebral hemorrhage. Stroke. 2022;53(7):e282-e361.' },
  ],
}

const huntHess: Ferramenta = {
  id: 'hunt-hess',
  nome: 'Escala de Hunt-Hess e Fisher modificada',
  sinonimos: ['hunt hess', 'fisher', 'hemorragia subaracnoide', 'hsa', 'wfns'],
  resumo: 'Gradua a hemorragia subaracnóidea clinicamente e pela imagem, prevendo vasoespasmo.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('hh', 'Grau de Hunt-Hess (clínico)', [
      { valor: '1', rotulo: 'I — assintomático ou cefaleia leve com rigidez discreta', pontos: 1 },
      { valor: '2', rotulo: 'II — cefaleia moderada a intensa, rigidez de nuca, sem déficit exceto paresia de nervo craniano', pontos: 2 },
      { valor: '3', rotulo: 'III — sonolência, confusão ou déficit focal leve', pontos: 3 },
      { valor: '4', rotulo: 'IV — estupor, hemiparesia moderada a grave, rigidez de descerebração precoce', pontos: 4 },
      { valor: '5', rotulo: 'V — coma profundo, descerebração, aparência moribunda', pontos: 5 },
    ]),
    campoOpc('fisher', 'Escala de Fisher modificada (tomografia)', [
      { valor: '0', rotulo: '0 — sem sangue subaracnóideo nem intraventricular', pontos: 0 },
      { valor: '1', rotulo: '1 — sangue subaracnóideo fino, sem hemorragia intraventricular', pontos: 1 },
      { valor: '2', rotulo: '2 — sangue subaracnóideo fino, com hemorragia intraventricular', pontos: 2 },
      { valor: '3', rotulo: '3 — sangue subaracnóideo espesso, sem hemorragia intraventricular', pontos: 3 },
      { valor: '4', rotulo: '4 — sangue subaracnóideo espesso, com hemorragia intraventricular', pontos: 4 },
    ]),
  ],
  calcular: (v) => {
    const hh = num(v, 'hh')
    const fisher = num(v, 'fisher')
    if (hh === null || fisher === null) return null
    const mortalidade = ['', '30%', '40%', '50%', '80%', '90%'][hh]
    const vasoespasmo = ['0 a 6%', '12 a 24%', '21 a 33%', '19 a 33%', '31 a 40%'][fisher]
    const nivel: Nivel = hh >= 4 ? 'critico' : hh === 3 ? 'alerta' : 'atencao'
    return {
      titulo: `Hunt-Hess ${['', 'I', 'II', 'III', 'IV', 'V'][hh]}`,
      valor: `Grau ${hh}`,
      nivel,
      rotuloNivel: `Fisher modificada ${fisher}`,
      detalhes: [
        { rotulo: 'Mortalidade aproximada por Hunt-Hess', valor: mortalidade, nota: 'Séries históricas; os números atuais são melhores em centros com cuidado neurointensivo.' },
        { rotulo: 'Risco de vasoespasmo sintomático por Fisher modificada', valor: vasoespasmo },
        { rotulo: 'Graus favoráveis', valor: 'Hunt-Hess I a III', nota: 'Associados a melhor prognóstico funcional; graus IV e V são desfavoráveis.' },
      ],
      conduta: [
        '**Hunt-Hess I–III**: candidatos a tratamento precoce do aneurisma. O tratamento definitivo — **clipagem cirúrgica ou embolização endovascular** — deve ocorrer **em até 72 horas**, porque o ressangramento tem seu pico nas primeiras 24 h e mortalidade em torno de 70%.',
        '**Hunt-Hess IV–V**: mortalidade elevada, mas não é contraindicação automática ao tratamento. Estabilize, trate a hidrocefalia com derivação ventricular externa (que frequentemente melhora o grau em horas) e **reclassifique após a estabilização** — o grau inicial de um paciente com hidrocefalia aguda superestima a gravidade real.',
        'Aplique o **nimodipino 60 mg por via oral a cada 4 h, por 21 dias**, em todos os pacientes: é a única medida farmacológica que comprovadamente melhora o desfecho neurológico. Ele age sobre a lesão isquêmica tardia, não sobre o calibre do vaso — e por isso deve ser mantido mesmo sem vasoespasmo documentado.',
        'Use a **escala de Fisher modificada** para estimar o risco de vasoespasmo, que é maior com sangue cisternal espesso e com hemorragia intraventricular, e tem pico entre o **4º e o 14º dia**. Monitore com Doppler transcraniano e exame neurológico seriado, e trate a isquemia tardia com indução de hipertensão e, se necessário, angioplastia — a antiga terapia de triplo H foi abandonada em favor da euvolemia com hipertensão induzida.',
        'Vigie as **complicações sistêmicas**, que são causa importante de morte nesses pacientes: hiponatremia (diferencie SIADH de síndrome perdedora de sal cerebral, cujas condutas são opostas — restrição hídrica versus reposição de sódio e volume), miocárdio atordoado neurogênico com alterações de ECG e troponina, edema pulmonar neurogênico, febre e convulsões.',
      ],
      interpretacao: [
        '**Conduta imediata:** tomografia sem contraste (sensibilidade próxima de 100% nas primeiras 6 horas, caindo depois); punção lombar com pesquisa de xantocromia se a tomografia for negativa e a suspeita persistir; angiotomografia ou angiografia para identificar o aneurisma; e **tratamento do aneurisma em até 72 horas** — por clipagem ou embolização — porque o ressangramento é o evento mais letal e ocorre sobretudo nas primeiras 24 horas.',
        '**Nimodipino 60 mg por via oral a cada 4 horas por 21 dias** é a única medida farmacológica com redução demonstrada de desfecho ruim. O benefício é neuroprotetor, não vasodilatador — os estudos não mostram redução consistente do vasoespasmo angiográfico, mas mostram melhora funcional.',
        'A escala de Fisher modificada corrigiu uma falha da original: a versão de 1980 classificava o grau 4 (hemorragia intraventricular ou intraparenquimatosa) como menor risco de vasoespasmo que o grau 3, o que contrariava a prática. A modificada trata sangue cisternal espesso e sangue intraventricular como fatores aditivos.',
        'A escala da Federação Mundial de Sociedades Neurocirúrgicas (WFNS), baseada em Glasgow e déficit motor, é mais reprodutível que a de Hunt-Hess e frequentemente usada em paralelo.',
      ],
      alertas: ['Cefaleia súbita de intensidade máxima ("a pior da vida", em trovoada) é hemorragia subaracnóidea até prova em contrário. O erro diagnóstico mais comum é atribuir a enxaqueca ou a cefaleia tensional em paciente que anda e conversa — o grau I de Hunt-Hess.'],
    }
  },
  formula: ['Hunt-Hess: graus I a V, clínicos', 'Fisher modificada: 0 a 4, pela distribuição do sangue na tomografia'],
  fundamento:
    'Hunt e Hess propuseram a escala em 1968 para estimar o risco cirúrgico de aneurismas, e ela sobreviveu como marcador prognóstico geral. A Fisher original correlacionou a quantidade e a distribuição de sangue com o risco de vasoespasmo — a hipótese sendo que o sangue subaracnóideo, ao se degradar, libera produtos que induzem contração da musculatura lisa arterial e inflamação perivascular.',
  armadilhas: [
    'Hunt-Hess tem concordância entre observadores apenas moderada, sobretudo entre os graus II e III.',
    'Vasoespasmo angiográfico e isquemia cerebral tardia não são sinônimos: o primeiro é achado de imagem, a segunda é o desfecho clínico que importa, e nem sempre coincidem.',
  ],
  referencias: [
    { texto: 'Hunt WE, Hess RM. Surgical risk as related to time of intervention in the repair of intracranial aneurysms. J Neurosurg. 1968;28(1):14-20.' },
    { texto: 'Frontera JA, Claassen J, Schmidt JM, et al. Prediction of symptomatic vasospasm after subarachnoid hemorrhage: the modified Fisher scale. Neurosurgery. 2006;59(1):21-27.' },
  ],
}

const rankin: Ferramenta = {
  id: 'rankin',
  nome: 'Escala de Rankin modificada',
  sigla: 'mRS',
  sinonimos: ['rankin', 'mrs', 'desfecho funcional', 'incapacidade'],
  resumo: 'Mede a incapacidade global após AVC — o desfecho primário da maioria dos ensaios.',
  categorias: ['neurologia'],
  campos: [
    campoOpc('grau', 'Grau de incapacidade', [
      { valor: '0', rotulo: '0 — sem sintomas', pontos: 0 },
      { valor: '1', rotulo: '1 — sintomas sem incapacidade significativa; realiza todas as atividades habituais', pontos: 1 },
      { valor: '2', rotulo: '2 — incapacidade leve; não realiza todas as atividades prévias, mas cuida de si sem ajuda', pontos: 2 },
      { valor: '3', rotulo: '3 — incapacidade moderada; requer alguma ajuda, mas caminha sem assistência', pontos: 3 },
      { valor: '4', rotulo: '4 — incapacidade moderada a grave; não caminha nem cuida de si sem assistência', pontos: 4 },
      { valor: '5', rotulo: '5 — incapacidade grave; acamado, incontinente, requer cuidado constante', pontos: 5 },
      { valor: '6', rotulo: '6 — óbito', pontos: 6 },
    ], { ajuda: 'Use entrevista estruturada, não impressão de corredor: as três perguntas que resolvem a maioria dos casos são "o senhor precisa de ajuda de outra pessoa para se vestir, comer ou ir ao banheiro?" (separa 2 de 3), "consegue caminhar sozinho, mesmo com bengala?" (separa 3 de 4) e "voltou a fazer tudo o que fazia antes?" (separa 1 de 2). Bengala, andador e adaptações não contam como ajuda de pessoa. Registre também o mRS prévio ao evento — sem ele, o grau atual não é interpretável.' }),
  ],
  calcular: (v) => {
    const g = num(v, 'grau')
    if (g === null) return null
    const bom = g <= 2
    return {
      titulo: 'Rankin modificada',
      valor: `Grau ${g}`,
      nivel: g === 6 ? 'critico' : g >= 4 ? 'alerta' : g >= 3 ? 'atencao' : 'ok',
      rotuloNivel: bom ? 'Desfecho funcional favorável' : 'Desfecho desfavorável',
      detalhes: [
        { rotulo: 'Independência funcional', valor: bom ? 'Sim (mRS 0 a 2)' : 'Não', nota: 'mRS 0 a 2 é o desfecho favorável adotado na maioria dos ensaios de AVC.' },
        { rotulo: 'Deambulação independente', valor: g <= 3 ? 'Sim' : 'Não' },
      ],
      interpretacao: [
        'A Rankin modificada é o desfecho primário quase universal nos ensaios de AVC porque mede o que importa para o paciente — autonomia — e não o déficit neurológico isolado. Um NIHSS de 4 por afasia pode significar mRS 3; um NIHSS de 8 por hemiparesia em recuperação pode significar mRS 1.',
        'A **transição entre 2 e 3** é a fronteira decisiva: separa quem cuida de si de quem depende de outra pessoa. É por isso que a dicotomização 0–2 versus 3–6 é a mais usada.',
        'Análises modernas preferem o **deslocamento ordinal** (shift analysis) à dicotomização: comparam toda a distribuição da escala entre os grupos, ganhando poder estatístico e capturando benefícios que a dicotomia esconde.',
        'A concordância entre examinadores melhora muito com entrevista estruturada e treinamento certificado — a versão livre da escala tem confiabilidade apenas moderada.',
        'A escala tem consequência clínica direta e não apenas acadêmica, porque o **mRS prévio** entra nos critérios de elegibilidade das terapias de reperfusão e nas decisões de escalonamento. Trombectomia mecânica foi validada predominantemente em pacientes com mRS prévio de 0 ou 1, e muitos protocolos usam mRS ≤ 2 como limite para indicação; craniectomia descompressiva, internação em leito intensivo e metas de reabilitação também se orientam pela função basal. Isso cria uma responsabilidade prática frequentemente negligenciada: no atendimento agudo, alguém precisa apurar com o acompanhante como o paciente vivia **antes** do evento, e registrar isso. Sem esse dado, o mRS de saída não tem denominador — um grau 3 num paciente que já era grau 3 significa ausência de dano funcional novo, e num paciente que era grau 0 significa perda de autonomia.',
        'Vale entender por que a fronteira entre 2 e 3 é tão decisiva e ao mesmo tempo tão difícil de medir. Ela não separa gravidade de déficit, mas **dependência de outra pessoa** — e essa é uma variável que integra o déficit neurológico com a reserva cognitiva, o suporte familiar, a adaptação do domicílio e a própria personalidade do paciente. Dois pacientes com hemiparesia idêntica podem acabar em graus diferentes conforme conseguiram ou não reorganizar a vida ao redor da limitação. É isso que torna a escala clinicamente significativa (ela mede o que o paciente sente como perda) e psicometricamente difícil (ela depende de contexto), o que explica por que a confiabilidade melhora tanto com entrevista estruturada e treinamento certificado.',
      ],
      conduta: g === 6
        ? [
            'Registro de óbito. Documente a causa imediata e a relação com o evento cerebrovascular, o que importa para registro epidemiológico, auditoria de qualidade da linha de cuidado e para a família.',
            'Ofereça acolhimento e, quando pertinente, discussão sobre doação de órgãos e tecidos conforme protocolo institucional e legislação.',
            'Revise o caso em reunião de morbimortalidade: tempo porta-agulha, tempo porta-punção, elegibilidade a reperfusão e complicações evitáveis são os pontos que mudam o próximo paciente.',
          ]
        : bom
          ? [
              'Desfecho favorável. Consolide a **prevenção secundária**, que é onde se ganha o próximo ano: antitrombótico conforme o mecanismo (antiagregante na aterosclerose e no pequeno vaso, anticoagulante na fibrilação atrial), estatina de alta potência com alvo de LDL abaixo de 70 mg/dL, controle pressórico progressivo, controle glicêmico e cessação do tabagismo.',
              'Mantenha reabilitação ambulatorial mesmo com boa recuperação: fisioterapia, terapia ocupacional e fonoaudiologia conforme o déficit residual. Grau 1 e 2 frequentemente carregam limitações que não aparecem na escala — fadiga, disfunção executiva leve, alteração de humor.',
              'Rastreie ativamente **depressão pós-AVC**, que atinge cerca de um terço dos pacientes, é subdiagnosticada e piora a recuperação funcional. Rastreie também déficit cognitivo vascular e apneia do sono, que é comum e tratável.',
              'Oriente sobre retorno ao trabalho, à direção de veículos e à atividade sexual — dúvidas quase universais e quase nunca abordadas. Reforce o reconhecimento de sinais de AVC e a via de emergência.',
            ]
          : [
              'Desfecho desfavorável: a prioridade passa a ser **reabilitação intensiva e precoce** em equipe multiprofissional. O ganho funcional é maior nos primeiros 3 a 6 meses, e o encaminhamento tardio perde a janela de maior neuroplasticidade.',
              'Previna as complicações que determinam mortalidade nesta faixa e que são todas evitáveis: broncoaspiração (avaliação de disfagia antes de qualquer oferta por via oral, e sonda enteral se indicada), tromboembolismo venoso (profilaxia farmacológica e compressão), lesão por pressão (escala de Braden, mudança de decúbito, superfície adequada), infecção urinária (evitar cateter vesical de demora) e contraturas com dor de ombro.',
              g >= 5
                ? 'No grau 5, discuta objetivos de cuidado de forma explícita com o paciente, quando possível, e com a família: metas realistas de reabilitação, preferências sobre gastrostomia, traqueostomia, reinternação e escalonamento de suporte. Cuidados paliativos concomitantes são parte do tratamento nessa faixa, não a sua interrupção.'
                : 'Avalie e prescreva órteses, dispositivos de marcha e adaptações do domicílio, e treine o cuidador formalmente. Aplique a escala de Zarit para sobrecarga do cuidador — cuidador exausto é fator de risco para reinternação do paciente.',
              'Não abandone a prevenção secundária por causa da incapacidade: recorrência num paciente já dependente é catastrófica. Mantenha antitrombótico, estatina e controle pressórico, ajustando à deglutição e ao risco de queda.',
              'Reavalie a escala em 90 dias e em 1 ano. A recuperação continua muito depois da alta, e um mRS 4 na alta hospitalar frequentemente vira 3 ou 2 com reabilitação adequada.',
            ],
      alertas: [
        'Sem o **mRS prévio** registrado, o grau atual não é interpretável. Grau 3 em quem já era grau 3 significa ausência de dano funcional novo; em quem era grau 0, significa perda de autonomia.',
        'A escala mede incapacidade global, não causa. Artrose, amputação, demência prévia, cegueira e doença pulmonar avançada elevam o grau sem qualquer relação com o AVC.',
        'O mRS prévio entra em critérios de elegibilidade de trombectomia e de outras decisões de escalonamento. Estimá-lo de forma apressada ou generosa no atendimento agudo tem consequência terapêutica real.',
        'Aplicada de memória, a variabilidade entre examinadores é grande, sobretudo entre os graus 2, 3 e 4 — exatamente onde está a fronteira que define desfecho favorável nos ensaios.',
        'Um único valor não descreve a trajetória. A recuperação se estende por meses, e o mRS da alta hospitalar subestima sistematicamente o desfecho de 90 dias.',
      ],
      tabela: {
        titulo: 'Graus, pergunta que os separa e prioridade clínica',
        colunas: ['Grau', 'Definição', 'Pergunta discriminante', 'Prioridade'],
        linhas: [
          ['0', 'Sem sintomas', '—', 'Prevenção secundária'],
          ['1', 'Sintomas sem incapacidade', 'Voltou a fazer tudo o que fazia?', 'Prevenção secundária e rastreio de depressão'],
          ['2', 'Incapacidade leve, independente', 'Cuida de si sem ajuda de pessoa?', 'Reabilitação ambulatorial'],
          ['3', 'Requer alguma ajuda, caminha só', 'Caminha sem assistência de pessoa?', 'Reabilitação intensiva'],
          ['4', 'Não caminha nem cuida de si só', '—', 'Reabilitação e prevenção de complicações'],
          ['5', 'Acamado, cuidado constante', '—', 'Metas de cuidado e suporte ao cuidador'],
          ['6', 'Óbito', '—', 'Revisão de caso e acolhimento'],
        ],
        destaque: g,
      },
    }
  },
  formula: ['Escala ordinal de 0 (sem sintomas) a 6 (óbito)'],
  fundamento:
    'Rankin propôs a escala original em 1957, com cinco graus; a versão modificada, do grupo de Oxford, acrescentou o grau 0 e refinou as definições. Sua persistência por décadas se explica por medir função global — e não domínio específico —, o que a torna comparável entre estudos, entre países e entre tipos de AVC. A decisão conceitual que a tornou dominante foi medir **o que o paciente consegue fazer da vida**, e não o tamanho do déficit neurológico. As duas coisas se correlacionam apenas parcialmente, e é justamente na discrepância que está o valor da escala: um NIHSS de 4 causado por afasia de expressão pode significar mRS 3, porque impede trabalhar e resolver a própria vida, enquanto um NIHSS de 8 por hemiparesia em boa recuperação pode significar mRS 1. Nenhum escore de déficit captura isso. A fronteira entre 2 e 3 é a mais importante da escala porque separa autonomia de dependência de outra pessoa — não gravidade de lesão —, e é por isso que a dicotomização em 0–2 versus 3–6 se consolidou como desfecho favorável na maioria dos ensaios. Essa mesma fronteira é a de pior concordância entre examinadores, porque a dependência integra déficit neurológico com reserva cognitiva, suporte familiar, adaptação do domicílio e personalidade: dois pacientes com lesões idênticas podem terminar em graus diferentes conforme conseguiram reorganizar a vida ao redor da limitação. A tensão entre significado clínico e reprodutibilidade psicométrica é inerente ao que a escala escolheu medir, e explica duas evoluções metodológicas recentes: a entrevista estruturada com certificação de examinadores, que eleva substancialmente a confiabilidade, e a análise de **deslocamento ordinal** (shift analysis), que compara toda a distribuição da escala entre os grupos em vez de dicotomizá-la, ganhando poder estatístico e capturando benefícios de um grau que a dicotomia descarta.',
  armadilhas: [
    'Aplicada de memória, sem entrevista estruturada, produz variabilidade grande, sobretudo entre os graus 2, 3 e 4.',
    'Não distingue causa da incapacidade: comorbidade ortopédica ou demência prévia elevam a pontuação sem relação com o AVC. Registre sempre o mRS **prévio**.',
    'Bengala, andador, cadeira de rodas e adaptações do domicílio **não** contam como ajuda de outra pessoa. O critério do grau 3 é assistência humana, não uso de dispositivo.',
    'O mRS da alta hospitalar subestima o desfecho de 90 dias, porque a recuperação se estende por meses. Comparar mRS de alta com mRS de 90 dias de outro serviço é comparar medidas diferentes.',
    'Incontinência isolada não define grau 5: o grau 5 exige o conjunto de acamado, incontinente e necessidade de cuidado constante.',
    'Como o mRS prévio condiciona elegibilidade a trombectomia, estimá-lo com generosidade no atendimento agudo pode levar a indicar terapia de reperfusão em paciente já muito dependente, e estimá-lo com rigor excessivo pode negar tratamento a quem se beneficiaria.',
  ],
  referencias: [
    { texto: 'van Swieten JC, Koudstaal PJ, Visser MC, Schouten HJ, van Gijn J. Interobserver agreement for the assessment of handicap in stroke patients. Stroke. 1988;19(5):604-607.' },
    { texto: 'Banks JL, Marotta CA. Outcomes validity and reliability of the modified Rankin scale. Stroke. 2007;38(3):1091-1096.' },
  ],
}

const aspects: Ferramenta = {
  id: 'aspects',
  nome: 'Escore ASPECTS',
  sinonimos: ['aspects', 'tomografia avc', 'alberta stroke'],
  resumo: 'Quantifica a extensão do infarto precoce em dez regiões da artéria cerebral média.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoSimNao('m1', 'M1 — córtex frontal opercular anterior (comprometido)', 1),
    campoSimNao('m2', 'M2 — córtex lateral ao ínsula (comprometido)', 1),
    campoSimNao('m3', 'M3 — córtex posterior da ACM (comprometido)', 1),
    campoSimNao('m4', 'M4 — território anterior superior (comprometido)', 1),
    campoSimNao('m5', 'M5 — território lateral superior (comprometido)', 1),
    campoSimNao('m6', 'M6 — território posterior superior (comprometido)', 1),
    campoSimNao('insula', 'Ínsula (comprometida)', 1),
    campoSimNao('lentiforme', 'Núcleo lentiforme (comprometido)', 1),
    campoSimNao('caudado', 'Núcleo caudado (comprometido)', 1),
    campoSimNao('capsula', 'Cápsula interna (comprometida)', 1),
  ],
  calcular: (v) => {
    const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'insula', 'lentiforme', 'caudado', 'capsula']
    const comprometidas = ids.filter((id) => sim(v, id)).length
    const total = 10 - comprometidas
    const nivel: Nivel = total >= 8 ? 'ok' : total >= 6 ? 'atencao' : 'critico'
    return {
      titulo: 'ASPECTS',
      valor: String(total),
      unidade: 'de 10',
      nivel,
      rotuloNivel: total >= 6 ? 'Favorável à reperfusão' : 'Infarto extenso',
      detalhes: [
        { rotulo: 'Regiões comprometidas', valor: `${comprometidas} de 10` },
        { rotulo: 'Corte clássico dos ensaios de trombectomia', valor: '≥ 6' },
      ],
      conduta: [
        '**ASPECTS 8–10**: pouco tecido já infartado, com grande área potencialmente salvável. São os melhores candidatos a **trombectomia** e os que mais se beneficiam de reperfusão rápida.',
        '**ASPECTS 6–7**: benefício ainda presente, mas menor. A decisão se apoia no tempo desde o início, na presença de oclusão de grande vaso e, quando disponível, na **imagem de perfusão** com mismatch favorável entre núcleo e penumbra.',
        '**ASPECTS < 6**: infarto extenso já estabelecido, com maior risco de transformação hemorrágica. Ensaios recentes (SELECT2, ANGEL-ASPECT, RESCUE-Japan LIMIT) mostraram benefício da trombectomia mesmo nesse grupo em pacientes selecionados, o que mudou a prática — o escore baixo deixou de ser exclusão automática e passou a exigir discussão caso a caso com o neurointervencionista.',
        'Lembre que o ASPECTS avalia **apenas o território da artéria cerebral média**. Para circulação posterior, use o **pc-ASPECTS**, e não conclua nada sobre tronco e cerebelo a partir do escore convencional.',
        'Interprete com cuidado a **tomografia precoce**: nas primeiras horas, os sinais de isquemia são sutis — perda da diferenciação entre substância cinzenta e branca, apagamento de sulcos, hipodensidade lentiforme, sinal da fita insular. A concordância entre observadores é limitada, e um ASPECTS calculado apressadamente pode negar tratamento a quem se beneficiaria. Na dúvida, a ressonância com difusão é muito mais sensível.',
      ],
      interpretacao: [
        total >= 6
          ? 'ASPECTS ≥ 6 foi o critério de inclusão da maioria dos ensaios positivos de trombectomia mecânica (MR CLEAN, ESCAPE, EXTEND-IA, SWIFT PRIME, REVASCAT). Indica que a maior parte do território ainda é penumbra recuperável.'
          : 'ASPECTS baixo indica núcleo isquêmico extenso. **Isso não é mais contraindicação automática**: os ensaios SELECT2, ANGEL-ASPECT e RESCUE-Japan LIMIT (2022 e 2023) demonstraram benefício da trombectomia mesmo com ASPECTS de 3 a 5, ao custo de maior risco de hemorragia. A decisão passou a ser individualizada, com centro capacitado.',
        'O escore parte de 10 e **subtrai** um ponto para cada uma das dez regiões com sinais precoces de isquemia — perda da diferenciação entre substância cinzenta e branca, apagamento de sulcos, hipoatenuação. Duas regiões são avaliadas no nível dos gânglios da base e as demais no nível supraganglionar.',
        'A concordância entre observadores é moderada e melhora bastante com janela de acidente vascular cerebral (largura estreita, cerca de 30 a 40 UH) e com programas automatizados de pós-processamento.',
      ],
      alertas: ['Não confunda hipoatenuação isquêmica precoce com artefato ou com sequela antiga. O ASPECTS deve ser calculado sobre a tomografia atual, comparando lado a lado com o hemisfério contralateral.'],
    }
  },
  formula: ['ASPECTS = 10 − número de regiões comprometidas'],
  fundamento:
    'O escore foi criado em Alberta para substituir a "regra do terço do território da artéria cerebral média", que era imprecisa e pouco reprodutível. Dividir o território em dez regiões de peso igual gera uma medida ordinal simples que se correlaciona com o volume do núcleo isquêmico e com o risco de transformação hemorrágica após reperfusão.',
  armadilhas: [
    'Aplica-se apenas ao território da artéria cerebral média. Para circulação posterior existe o pc-ASPECTS, com regiões e pontuação diferentes.',
    'Nas primeiras horas, a tomografia pode ser normal mesmo com oclusão de grande vaso — ASPECTS 10 não exclui AVC.',
  ],
  referencias: [
    { texto: 'Barber PA, Demchuk AM, Zhang J, Buchan AM. Validity and reliability of a quantitative computed tomography score in predicting outcome of hyperacute stroke before thrombolytic therapy (ASPECTS). Lancet. 2000;355(9216):1670-1674.' },
    { texto: 'Sarraj A, Hassan AE, Abraham MG, et al. Trial of endovascular thrombectomy for large ischemic strokes (SELECT2). N Engl J Med. 2023;388(14):1259-1271.' },
  ],
}

const rass: Ferramenta = {
  id: 'rass',
  nome: 'Escala RASS de agitação e sedação',
  sinonimos: ['rass', 'sedacao', 'richmond', 'agitacao'],
  resumo: 'Gradua sedação e agitação de −5 a +4, o padrão em terapia intensiva.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('rass', 'Nível observado', [
      { valor: '4', rotulo: '+4 — combativo: violento, perigo imediato à equipe', pontos: 4 },
      { valor: '3', rotulo: '+3 — muito agitado: puxa ou remove tubos e cateteres, agressivo', pontos: 3 },
      { valor: '2', rotulo: '+2 — agitado: movimentos frequentes sem propósito, briga com o ventilador', pontos: 2 },
      { valor: '1', rotulo: '+1 — inquieto: ansioso, sem movimentos agressivos ou vigorosos', pontos: 1 },
      { valor: '0', rotulo: '0 — alerta e calmo', pontos: 0 },
      { valor: '-1', rotulo: '−1 — sonolento: desperta ao chamado e mantém os olhos abertos por mais de 10 s', pontos: -1 },
      { valor: '-2', rotulo: '−2 — sedação leve: desperta ao chamado, contato visual por menos de 10 s', pontos: -2 },
      { valor: '-3', rotulo: '−3 — sedação moderada: movimenta ou abre os olhos ao chamado, sem contato visual', pontos: -3 },
      { valor: '-4', rotulo: '−4 — sedação profunda: sem resposta ao chamado, mas movimenta ao estímulo físico', pontos: -4 },
      { valor: '-5', rotulo: '−5 — não desperta: sem resposta ao chamado nem ao estímulo físico', pontos: -5 },
    ], { ajuda: 'Siga a sequência de três passos, sempre nesta ordem — ela é o que dá reprodutibilidade à escala. 1) OBSERVE por 10 s sem tocar nem falar: se o paciente está alerta, inquieto ou agitado, o nível está entre 0 e +4 e a avaliação termina aqui. 2) CHAME pelo nome em voz alta e peça que abra os olhos e olhe para você: contato visual mantido por mais de 10 s é −1, menos de 10 s é −2, e movimento ou abertura ocular sem contato visual é −3. 3) ESTIMULE fisicamente (sacuda o ombro e, se necessário, comprima o esterno): resposta motora é −4, ausência total é −5.' }),
  ],
  calcular: (v) => {
    const r = num(v, 'rass')
    if (r === null) return null
    const alvo = r >= -2 && r <= 0
    return {
      titulo: 'RASS',
      valor: `${r > 0 ? '+' : ''}${r}`,
      nivel: r <= -4 || r >= 3 ? 'critico' : r <= -3 || r >= 2 ? 'alerta' : alvo ? 'ok' : 'atencao',
      rotuloNivel: alvo ? 'Dentro do alvo de sedação leve' : r < -2 ? 'Sedação mais profunda que o recomendado' : 'Agitação',
      detalhes: [
        { rotulo: 'Alvo recomendado', valor: 'RASS 0 a −2', nota: 'Sedação leve, salvo indicação específica de sedação profunda.' },
        { rotulo: 'Indicações de sedação profunda (−4 a −5)', valor: 'Bloqueio neuromuscular, SDRA grave em fase inicial, hipertensão intracraniana refratária, estado de mal epiléptico, assincronia grave' },
        { rotulo: 'Pré-requisito para o CAM-ICU', valor: r >= -3 ? 'Avaliável' : 'Não avaliável', nota: 'Com RASS de −4 ou −5, o delirium não pode ser avaliado — reavalie quando o paciente despertar.', nivel: r >= -3 ? 'ok' : 'atencao' },
      ],
      interpretacao: [
        'A sedação leve é a recomendação padrão das diretrizes PADIS. Sedação profunda desnecessária associa-se a mais dias de ventilação, mais delirium, mais fraqueza adquirida na UTI e maior mortalidade.',
        'O pacote **ABCDEF** organiza a prática: **A**valiar e tratar dor; **B**oth (teste de despertar diário e teste de respiração espontânea); **C**hoice de sedativo e analgésico; **D**elirium — monitorizar e tratar; **E**arly mobility (mobilização precoce); **F**amily engagement (envolvimento da família).',
        'Analgesia primeiro: boa parte da agitação em UTI é dor não tratada, e a estratégia baseada em analgesia (analgosedação) reduz a necessidade de hipnótico. Propofol e dexmedetomidina são preferíveis a benzodiazepínicos, que se associam independentemente a mais delirium.',
        'A recomendação de sedação leve não é preferência estética — cada nível desnecessário abaixo de −2 tem custo fisiopatológico mensurável em quatro sistemas. No **cérebro**, benzodiazepínico e, em menor grau, propofol favorecem delirium por desequilíbrio colinérgico-dopaminérgico, neuroinflamação com ativação microglial e disfunção da barreira hematoencefálica; o midazolam é fator de risco independente e dose-dependente, e cada dia de delirium se associa a pior desempenho cognitivo meses depois. No **diafragma**, a ventilação totalmente controlada descarrega a fibra muscular e desencadeia proteólise pela via ubiquitina-proteassoma com atrofia mensurável em cerca de 18 horas — mais rápida que na musculatura periférica, o que é a base da fraqueza diafragmática induzida pelo ventilador e do desmame difícil. No **pulmão**, abolir o esforço espontâneo elimina a contração diafragmática que ventila preferencialmente as regiões dorsais dependentes, favorecendo atelectasia e piorando a relação ventilação-perfusão. E na **hemodinâmica**, propofol e dexmedetomidina reduzem tônus simpático, pré-carga e resistência vascular sistêmica, produzindo hipotensão que costuma ser tratada com volume e vasopressor em vez de com redução da dose — trocando um problema iatrogênico por outro.',
        r >= 3
          ? 'Agitação de +3 ou +4 é risco imediato de autoextubação, perda de acesso e lesão à equipe. É a única faixa em que a intervenção imediata precede a investigação da causa — mas apenas precede, não substitui.'
          : r <= -4
            ? 'Em −4 e −5 o delirium não pode ser avaliado e o paciente não participa de nada: nem do teste de respiração espontânea, nem da mobilização, nem da comunicação com a família. Todo o pacote ABCDEF fica suspenso enquanto a sedação estiver nessa faixa.'
            : 'Registre o valor a cada 2 a 4 horas e a cada mudança de dose. A escala só cumpre sua função quando seriada: um valor isolado não mostra a deriva progressiva para sedação mais profunda, que é o padrão quando ninguém mede.',
      ],
      conduta: r >= 2
        ? [
            'Garanta a segurança primeiro em +3 e +4: risco de autoextubação, perda de acesso venoso e lesão à equipe. Intervenção farmacológica imediata é justificada nessa faixa, mas não encerra a avaliação.',
            'Trate a **dor** antes de aumentar hipnótico — é a causa mais comum e mais subtratada de agitação em UTI. Use escala comportamental (BPS ou CPOT) no paciente sem comunicação e titule opioide; a analgosedação reduz a necessidade de sedativo.',
            'Descarte as causas orgânicas que se apresentam como agitação: hipoxemia, hipercapnia, hipoglicemia, hipotensão, hipertensão intracraniana, retenção urinária, distensão abdominal, constipação, privação de sono, abstinência de álcool, nicotina, opioide ou benzodiazepínico, e **assincronia com o ventilador** — que se resolve ajustando o ventilador, não sedando o paciente.',
            'Rastreie **delirium** com o CAM-ICU (avaliável com RASS ≥ −3). Se positivo, priorize medidas não farmacológicas — reorientação, óculos e aparelho auditivo, ciclo dia-noite, mobilização, presença de familiar — e evite benzodiazepínico. Para agitação que ameaça a segurança, prefira dexmedetomidina ou antipsicótico a benzodiazepínico.',
          ]
        : r >= -2
          ? [
              'Alvo atingido. Mantenha a dose mínima eficaz e reavalie a cada 2 a 4 horas, registrando nível e horário — sem registro seriado, a sedação deriva silenciosamente para mais profunda.',
              'Execute o pacote **ABCDEF** completo: avaliar e tratar dor, despertar diário com teste de respiração espontânea, escolha de sedativo poupador de benzodiazepínico, rastreio e manejo de delirium, mobilização precoce e envolvimento da família.',
              'Aproveite a janela: RASS 0 a −2 é exatamente a faixa em que o paciente pode ser avaliado para desmame. Aplique o teste de respiração espontânea diário e apoie a decisão com o índice ROX ou o RSBI.',
              'Rastreie delirium com o CAM-ICU ao menos uma vez por turno. Paciente calmo e dentro do alvo pode estar em delirium hipoativo, que é a forma mais comum, a de pior prognóstico e a que passa despercebida justamente por não incomodar.',
            ]
          : [
              'Sedação mais profunda que o recomendado. Reduza a infusão ativamente, a menos que haja **indicação formal**: bloqueio neuromuscular, SDRA grave em fase inicial ou em prona, hipertensão intracraniana refratária, estado de mal epiléptico ou hipotermia terapêutica. Fora dessas, sedação profunda é dano evitável.',
              'Programe interrupção diária da sedação com reavaliação neurológica, e documente o motivo sempre que a interrupção for suspensa. A combinação de despertar diário com teste de respiração espontânea reduz dias de ventilação e de UTI.',
              'Troque benzodiazepínico por propofol ou dexmedetomidina se a sedação for necessária por mais de 24 a 48 horas. Midazolam acumula em tecido adiposo, tem metabólito ativo de excreção renal e é fator de risco independente para delirium.',
              r <= -4
                ? 'Em −4 ou −5, considere que a ausência de resposta pode não ser a sedação: descarte evento neurológico novo, hipoglicemia, hipotermia, uremia, hiperamonemia e **estado de mal não convulsivo** — nesse último, só o eletroencefalograma responde, e a escala não. Se há bloqueador neuromuscular em uso, a escala é inválida e a monitorização precisa ser objetiva.'
                : 'Vigie a síndrome de infusão de propofol em dose alta e prolongada: acidose metabólica, rabdomiólise, hipertrigliceridemia e disfunção cardíaca. Considere também a carga calórica lipídica no balanço nutricional.',
            ],
      alertas: [
        'A escala é **inválida sob bloqueio neuromuscular**: sem resposta motora, um paciente desperto e curarizado é indistinguível de um profundamente sedado. Garanta sedação profunda por protocolo e considere monitorização objetiva, como o índice bispectral.',
        'Com RASS −4 ou −5 o **CAM-ICU não é aplicável** e o delirium fica invisível. Reavalie assim que o paciente despertar; não registre "sem delirium" em paciente não avaliável.',
        'RASS não mede dor. Paciente em 0 pode estar com dor intensa, e paciente em −2 também. Use escala numérica se houver comunicação e BPS ou CPOT se não houver.',
        'Delirium hipoativo cursa com RASS 0 ou negativo e é a forma mais frequente e de pior prognóstico. Calma não é sinônimo de ausência de delirium — é preciso rastrear ativamente.',
        'Em lesão neurológica estrutural (AVC extenso, TCE, pós-operatório de neurocirurgia), a resposta reduzida pode ser a doença e não a sedação. Interpretar a escala como profundidade de sedação nesse contexto pode mascarar deterioração neurológica.',
      ],
      tabela: {
        titulo: 'Faixas, leitura e consequências operacionais',
        colunas: ['RASS', 'Estado', 'CAM-ICU avaliável?', 'Conduta'],
        linhas: [
          ['+3 a +4', 'Muito agitado ou combativo', 'Sim', 'Segurança imediata, depois dor e causa orgânica'],
          ['+1 a +2', 'Inquieto ou agitado', 'Sim', 'Analgesia primeiro; rastrear delirium e assincronia'],
          ['0 a −2', 'Alerta a sedação leve', 'Sim', 'Alvo: manter, despertar diário, mobilizar'],
          ['−3', 'Sedação moderada', 'Sim (limite)', 'Reduzir dose se não houver indicação'],
          ['−4 a −5', 'Sedação profunda', 'Não', 'Só com indicação formal; reavaliar causa'],
        ],
        destaque: r >= 3 ? 0 : r >= 1 ? 1 : r >= -2 ? 2 : r === -3 ? 3 : 4,
      },
    }
  },
  formula: ['Escala ordinal de −5 (não desperta) a +4 (combativo)'],
  fundamento:
    'A RASS foi validada num processo de três etapas com equipes multiprofissionais e é a escala de sedação com melhor confiabilidade entre observadores. Sua estrutura é lógica: primeiro observa-se o paciente, depois estimula-se verbalmente, e só então fisicamente — cada etapa determina uma faixa da escala, o que torna a aplicação rápida e reprodutível. Duas decisões de desenho explicam por que ela superou a escala de Ramsay e as demais. A primeira é a **simetria em torno do zero**, com quatro níveis de agitação acima e cinco de sedação abaixo: isso reconhece que agitação e sedação excessiva são desvios em direções opostas de um mesmo alvo, e que a diferença entre inquietação (+1) e combatividade (+4) é clinicamente enorme — no Ramsay, os dois recebem o mesmo número. A segunda é o **estímulo graduado e padronizado**, em que o nível não é uma impressão global mas o resultado de um procedimento definido: observar por dez segundos, chamar pelo nome, tocar. Isso é o que elevou a concordância entre observadores a valores altos e reprodutíveis entre médicos, enfermeiros e fisioterapeutas. O detalhe mais elegante da escala é o uso da **duração do contato visual** para separar −1 de −2: dez segundos de fixação sustentada exigem atenção mantida, que depende de córtex e de sistema reticular ativador funcionantes, e por isso é um marcador sensível da transição entre sonolência e sedação verdadeira. Esse mesmo limiar tem consequência operacional direta: com RASS ≥ −3 o paciente consegue participar do CAM-ICU, e abaixo disso o delirium se torna simplesmente não avaliável — de modo que a escala de sedação define, na prática, se é possível ou não rastrear a complicação neurológica mais comum da terapia intensiva.',
  armadilhas: [
    'Aplicada sem a sequência padronizada (observar, chamar, tocar), a escala perde reprodutibilidade.',
    'RASS não substitui avaliação de dor. Use escala numérica em paciente comunicativo e escala comportamental (BPS ou CPOT) em paciente sem comunicação.',
    'Inválida sob bloqueio neuromuscular, situação em que nenhuma escala comportamental funciona e a monitorização precisa ser objetiva.',
    'Com −4 ou −5, o CAM-ICU não é aplicável. Registrar "sem delirium" em paciente não avaliável é erro de documentação com consequência clínica.',
    'Em lesão neurológica estrutural, a resposta reduzida pode ser a doença e não o sedativo — nesse contexto, atribuir o valor à sedação pode ocultar deterioração.',
    'Delirium hipoativo ocorre com RASS 0 ou negativo. Paciente calmo dentro do alvo ainda precisa de rastreio ativo.',
    'Um valor isolado não serve para titular. Sem registro seriado com horário e dose, a sedação deriva progressivamente para níveis mais profundos sem que ninguém decida isso.',
  ],
  referencias: [
    { texto: 'Sessler CN, Gosnell MS, Grap MJ, et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med. 2002;166(10):1338-1344.' },
    { texto: 'Devlin JW, Skrobik Y, Gélinas C, et al. Clinical practice guidelines for the prevention and management of pain, agitation/sedation, delirium, immobility, and sleep disruption in adult patients in the ICU (PADIS). Crit Care Med. 2018;46(9):e825-e873.' },
  ],
}

const camIcu: Ferramenta = {
  id: 'cam-icu',
  nome: 'CAM-ICU para delirium',
  sinonimos: ['cam-icu', 'delirium', 'confusao aguda', 'cam'],
  resumo: 'Diagnostica delirium em quatro passos, mesmo em paciente intubado.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoSeg('rassOk', 'RASS ≥ −3 (paciente avaliável)', [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não (RASS −4 ou −5)' },
    ]),
    campoSimNao('c1', 'Característica 1 — início agudo ou curso flutuante do estado mental', 1, 'Mudança em relação ao basal nas últimas 24 h, ou flutuação da consciência/RASS.'),
    campoSimNao('c2', 'Característica 2 — desatenção (mais de 2 erros no teste de 10 letras)', 1, 'Diga "SAVEAHAART" e peça que aperte a mão a cada letra A. Erro = não apertar no A ou apertar em outra letra.'),
    campoSimNao('c3', 'Característica 3 — nível de consciência alterado (RASS diferente de 0)', 1),
    campoSimNao('c4', 'Característica 4 — pensamento desorganizado (mais de 1 erro)', 1, 'Quatro perguntas de sim/não (uma pedra flutua na água? há peixes no mar?) mais um comando de dois passos.'),
  ],
  calcular: (v) => {
    if (!sim(v, 'rassOk'))
      return {
        titulo: 'CAM-ICU',
        valor: 'Não avaliável',
        nivel: 'atencao',
        rotuloNivel: 'RASS −4 ou −5',
        detalhes: [{ rotulo: 'Conduta', valor: 'Reavalie quando o paciente despertar', nota: 'Sedação profunda impede a avaliação. Considere reduzir a sedação se não houver indicação formal para mantê-la.' }],
        interpretacao: ['Com RASS de −4 ou −5, a avaliação de delirium fica suspensa. Reduza a sedação conforme o protocolo de despertar diário e reavalie.'],
      }
    const c1 = sim(v, 'c1')
    const c2 = sim(v, 'c2')
    const c3 = sim(v, 'c3')
    const c4 = sim(v, 'c4')
    const positivo = c1 && c2 && (c3 || c4)
    return {
      titulo: 'CAM-ICU',
      valor: positivo ? 'Positivo — delirium presente' : 'Negativo',
      nivel: positivo ? 'alerta' : 'ok',
      rotuloNivel: positivo ? 'Características 1 e 2 mais 3 ou 4' : 'Critérios não preenchidos',
      detalhes: [
        { rotulo: '1. Início agudo ou curso flutuante', valor: c1 ? 'Presente' : 'Ausente', nivel: c1 ? 'alerta' : 'ok' },
        { rotulo: '2. Desatenção', valor: c2 ? 'Presente' : 'Ausente', nivel: c2 ? 'alerta' : 'ok' },
        { rotulo: '3. Consciência alterada', valor: c3 ? 'Presente' : 'Ausente' },
        { rotulo: '4. Pensamento desorganizado', valor: c4 ? 'Presente' : 'Ausente' },
        { rotulo: 'Regra', valor: '(1 E 2) E (3 OU 4)' },
      ],
      alertas: [
        'O **delirium hipoativo** é o mais comum e o de pior prognóstico, e é exatamente o que passa despercebido: o paciente é descrito como "tranquilo" e nunca é rastreado. Aplicar o CAM-ICU por turno, e não só diante de agitação, é o que muda a taxa de detecção.',
        'A escala exige paciente que responda a comando. Com RASS de −4 ou −5 a avaliação fica suspensa — e sedação profunda mantida sem indicação formal é, ela própria, causa de delirium.',
      ],
      conduta: [
        '**CAM-ICU positivo** confirma delirium. A primeira ação é **procurar a causa**, não sedar: percorra a mnemônica **DIMES** — **D**rogas (benzodiazepínicos, opioides, anticolinérgicos, corticoides), **I**nfecção, **M**etabólico (hiponatremia, hipoglicemia, uremia, tireoide), **E**strutural (acidente vascular, hematoma subdural) e **S**ono, dor e retenção urinária.',
        'Aplique o pacote **ABCDEF**, que é o que efetivamente reduz duração de delirium e mortalidade: **A**valiar e tratar dor, **B**ranqueamento de sedação com despertar diário e testes de respiração espontânea, **C**oordenar escolha de analgesia e sedação, **D**elirium monitorado, **E**xercício e mobilização precoce, **F**amília envolvida à beira do leito.',
        'Priorize as **medidas não farmacológicas**, que têm a melhor evidência: reorientação frequente, óculos e aparelho auditivo, higiene do sono com redução de luz e ruído noturnos, mobilização precoce, remoção de cateteres e restrições desnecessárias, e presença da família.',
        'Use **antipsicótico apenas para agitação que ameace a segurança** do paciente ou da equipe — haloperidol ou quetiapina em dose baixa, pelo menor tempo possível. Faça ECG antes, pelo risco de prolongamento do QT, e reavalie a indicação a cada 24 h em vez de manter por inércia.',
        'Evite **benzodiazepínicos**, que são causa e não tratamento de delirium — a exceção é a abstinência alcoólica e a de benzodiazepínico. Prefira **dexmedetomidina** quando for necessária sedação em paciente com delirium hiperativo sob ventilação: ela reduz a incidência de delirium em comparação a midazolam e propofol.',
      ],
      interpretacao: [
        positivo
          ? '**Delirium presente.** Ele é subdiagnosticado justamente porque a forma **hipoativa** — a mais comum e a de pior prognóstico — se confunde com "paciente tranquilo". O delirium associa-se independentemente a mortalidade maior, internação mais longa e declínio cognitivo persistente.'
          : 'CAM-ICU negativo neste momento. Delirium flutua: reavalie ao menos uma vez por turno.',
        '**Tratamento é sobretudo não farmacológico:** identificar e tratar a causa (infecção, dor, hipóxia, distúrbio metabólico, abstinência, retenção urinária, constipação), reorientar, restaurar o ciclo sono-vigília, mobilizar precocemente, devolver óculos e aparelho auditivo, envolver a família e retirar o que puder ser retirado — sonda, cateter, contenção.',
        '**Revise a lista de medicamentos.** Benzodiazepínicos, anticolinérgicos, opioides em excesso e corticoides são os principais precipitantes farmacológicos.',
        'Antipsicóticos **não** reduzem duração nem mortalidade do delirium — o ensaio MIND-USA mostrou isso com haloperidol e ziprasidona. Reserve-os para agitação com risco à segurança, na menor dose e pelo menor tempo. Em abstinência alcoólica, o tratamento é benzodiazepínico, e a lógica se inverte.',
        'O **delirium hipoativo** é o mais comum e o de pior prognóstico, e é justamente o que passa despercebido: o paciente é descrito como "tranquilo" ou "sonolento" e nunca é rastreado. Aplicar o CAM-ICU por turno, e não apenas diante de agitação, é o que muda a taxa de detecção.',
      ],
    }
  },
  formula: ['Delirium = (característica 1 E característica 2) E (característica 3 OU característica 4)'],
  fundamento:
    'O CAM-ICU adapta o Confusion Assessment Method original para pacientes que não falam — intubados, traqueostomizados —, substituindo perguntas abertas por tarefas de atenção com resposta motora. Sua sensibilidade e especificidade contra avaliação psiquiátrica de referência ficam acima de 90% quando aplicado por equipe treinada.',
  armadilhas: [
    'Requer treinamento. Aplicado informalmente, a sensibilidade despenca.',
    'Não diferencia delirium de demência nem de encefalopatia estrutural — o dado que distingue é o **basal cognitivo** do paciente, obtido com a família.',
  ],
  referencias: [
    { texto: 'Ely EW, Inouye SK, Bernard GR, et al. Delirium in mechanically ventilated patients: validity and reliability of the CAM-ICU. JAMA. 2001;286(21):2703-2710.' },
    { texto: 'Girard TD, Exline MC, Carson SS, et al. Haloperidol and ziprasidone for treatment of delirium in critical illness (MIND-USA). N Engl J Med. 2018;379(26):2506-2516.' },
  ],
}

const ramsay: Ferramenta = {
  id: 'ramsay',
  nome: 'Escala de sedação de Ramsay',
  sinonimos: ['ramsay', 'sedacao ramsay'],
  resumo: 'A escala de sedação clássica, em seis níveis.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoOpc('nivel', 'Nível de Ramsay', [
      { valor: '1', rotulo: '1 — ansioso, agitado ou inquieto', pontos: 1 },
      { valor: '2', rotulo: '2 — cooperativo, orientado e tranquilo', pontos: 2 },
      { valor: '3', rotulo: '3 — sonolento, responde apenas a comandos', pontos: 3 },
      { valor: '4', rotulo: '4 — dormindo, resposta viva a estímulo glabelar ou auditivo intenso', pontos: 4 },
      { valor: '5', rotulo: '5 — dormindo, resposta lenta a estímulo glabelar ou auditivo intenso', pontos: 5 },
      { valor: '6', rotulo: '6 — dormindo, sem resposta a estímulo', pontos: 6 },
    ], { ajuda: 'Avalie observando primeiro, sem tocar. Só aplique estímulo (chamado pelo nome e, se necessário, percussão glabelar) se o paciente parecer dormindo — e registre o nível junto do horário e da dose de sedativo em curso, senão o número não serve para titular nada.' }),
  ],
  calcular: (v) => {
    const n = num(v, 'nivel')
    if (n === null) return null
    const equivalente = ['', '+1 a +4', '0', '−1 a −2', '−2 a −3', '−3 a −4', '−5'][n]
    return {
      titulo: 'Escala de Ramsay',
      valor: `Nível ${n}`,
      nivel: n >= 5 ? 'alerta' : n === 1 ? 'atencao' : n <= 3 ? 'ok' : 'atencao',
      rotuloNivel: n <= 3 ? 'Sedação leve a moderada' : 'Sedação profunda',
      detalhes: [
        { rotulo: 'Equivalência aproximada com a RASS', valor: equivalente },
        { rotulo: 'Alvo usual', valor: 'Ramsay 2 a 3', nota: 'Corresponde à recomendação atual de sedação leve.' },
      ],
      interpretacao: [
        'A escala de Ramsay é de 1974 e foi a primeira escala de sedação amplamente adotada. Hoje é considerada inferior à RASS e à SAS por dois motivos: não separa bem os níveis de agitação (todos cabem no nível 1) e mistura estados de vigília com resposta a estímulo numa progressão pouco linear.',
        'Permanece em uso por familiaridade e por aparecer em protocolos institucionais antigos. Se o serviço adota Ramsay, use-a consistentemente; se for possível migrar, a RASS é a recomendação das diretrizes atuais.',
        'O que justifica perseguir sedação leve (Ramsay 2 a 3) não é conforto, é fisiopatologia acumulada — e vale entender o custo da sedação profunda em cada sistema. No **cérebro**, a exposição prolongada a benzodiazepínico e a propofol produz delirium, cuja fisiopatologia envolve desequilíbrio colinérgico-dopaminérgico, neuroinflamação com ativação microglial e disfunção da barreira hematoencefálica; o midazolam é fator de risco independente e dose-dependente, e cada dia de delirium se associa a pior desempenho cognitivo em longo prazo. No **músculo**, a imobilidade sob sedação profunda desencadeia a fraqueza adquirida na UTI, com proteólise pela via ubiquitina-proteassoma, e o diafragma perde massa mais rápido que a musculatura periférica — há atrofia mensurável em 18 horas de ventilação totalmente controlada, porque a fibra diafragmática descarregada entra em proteólise acelerada. No **pulmão**, a supressão do drive abole o esforço espontâneo que ventila preferencialmente as regiões dorsais dependentes, favorecendo atelectasia e piorando a relação ventilação-perfusão. E na **hemodinâmica**, propofol e dexmedetomidina reduzem tônus simpático e pré-carga, gerando hipotensão que costuma ser tratada com volume e vasopressor em vez de com redução do sedativo. A soma desses mecanismos é o que os ensaios de interrupção diária e de sedação mínima demonstraram na prática: menos dias de ventilação, menos tempo de UTI e menos delirium. O nível de Ramsay é a única forma de saber se o paciente está onde se pretendia — sem escala registrada, a sedação sempre deriva para mais profunda do que se imagina.',
      ],
      conduta: n === 1
        ? [
            'Antes de sedar, procure a causa: dor é a mais comum e a mais esquecida. Aplique **analgesia primeiro** (abordagem analgo-sedação): opioide titulado para a dor resolve boa parte da agitação sem hipnótico.',
            'Depois da dor, descarte as causas orgânicas que se manifestam como agitação — hipoxemia, hipercapnia, hipoglicemia, hipotensão, retenção urinária, distensão abdominal, abstinência de álcool, benzodiazepínico ou opioide, e assincronia com o ventilador. Sedar um paciente hipóxico apaga o sinal e não a causa.',
            'Rastreie **delirium** com o CAM-ICU. Se positivo, priorize medidas não farmacológicas (reorientação, óculos e aparelho auditivo, mobilização, higiene do sono, presença de familiar) e evite benzodiazepínico, que agrava; se for necessário fármaco na agitação que ameaça a segurança, prefira antipsicótico ou dexmedetomidina.',
            'O nível 1 agrupa desde inquietação leve até combatividade perigosa. Se a distinção importar para a conduta — e importa —, migre para a RASS, que separa +1 de +4.',
          ]
        : n <= 3
          ? [
              'Alvo adequado. Mantenha e reavalie a cada 2 a 4 horas e a cada mudança de dose, registrando nível e horário. Sedação sem escala registrada deriva para profunda sem que ninguém perceba.',
              'Aplique o pacote ABCDEF: avaliação e manejo da dor, despertar diário com teste de respiração espontânea, escolha de sedativo poupador de benzodiazepínico, rastreio e manejo de delirium, mobilização precoce e envolvimento da família.',
              'Aproveite a janela de vigília para o **teste de respiração espontânea** diário. Paciente em Ramsay 2 a 3 é justamente o que pode ser avaliado para desmame, e o índice ROX ou o RSBI ajudam a decidir.',
              'Prefira propofol ou dexmedetomidina a midazolam quando a sedação for necessária por mais de 24 a 48 horas — o benzodiazepínico acumula em tecido adiposo, tem metabólitos ativos e é fator de risco independente para delirium.',
            ]
          : [
              'Sedação mais profunda que o recomendado. Reduza a infusão ativamente — não espere o próximo turno — a menos que haja **indicação formal** de sedação profunda: hipertensão intracraniana refratária, estado de mal epiléptico, SDRA grave em prona ou bloqueio neuromuscular, assincronia grave não resolvida ou hipotermia terapêutica.',
              'Se houver bloqueador neuromuscular em uso, a escala **não se aplica**: o paciente pode estar plenamente consciente e paralisado. Nesse cenário, garanta sedação profunda por protocolo e considere monitorização objetiva (índice bispectral), porque nenhuma escala comportamental funciona sem resposta motora.',
              'Reavalie a dose acumulada e o risco de acúmulo: midazolam e seus metabólitos acumulam na insuficiência renal e hepática e na obesidade; propofol em dose alta e prolongada exige vigilância para síndrome de infusão de propofol (acidose metabólica, rabdomiólise, hipertrigliceridemia, disfunção cardíaca) e para sobrecarga calórica lipídica.',
              n === 6
                ? 'Ramsay 6 sem indicação é sedação excessiva com custo mensurável. Além de reduzir a dose, considere que ausência de resposta pode não ser sedação: descarte evento neurológico novo, hipoglicemia, hipotermia e estado de mal não convulsivo — se houver dúvida, o eletroencefalograma responde e a escala não.'
                : 'Programe interrupção diária da sedação com reavaliação, a menos que contraindicada, e registre o motivo sempre que a interrupção for suspensa.',
            ],
      alertas: [
        'A escala não se aplica sob bloqueio neuromuscular: sem resposta motora, um paciente desperto e curarizado é indistinguível de um profundamente sedado. Garanta sedação por protocolo e considere monitorização objetiva.',
        'Ramsay não avalia dor nem delirium. Sedação adequada com dor não tratada é frequente, e o paciente calmo pode estar delirante — use uma escala de dor (comportamental se não houver comunicação) e o CAM-ICU em paralelo.',
        'Escala nenhuma substitui a busca da causa da agitação. Hipoxemia, hipercapnia, hipoglicemia, abstinência, retenção urinária e assincronia com o ventilador se manifestam como agitação, e sedar apaga o sinal sem tratar o problema.',
        'As diretrizes atuais (PADIS 2018) recomendam RASS ou SAS. Use Ramsay apenas se for o padrão institucional, e de forma consistente — nunca alterne escalas entre turnos no mesmo paciente.',
      ],
      tabela: {
        titulo: 'Ramsay, equivalência com a RASS e leitura',
        colunas: ['Nível', 'Descrição', 'RASS aproximada', 'Leitura'],
        linhas: [
          ['1', 'Ansioso, agitado ou inquieto', '+1 a +4', 'Investigar dor, causa orgânica e delirium'],
          ['2', 'Cooperativo, orientado, tranquilo', '0', 'Alvo ideal'],
          ['3', 'Sonolento, responde a comandos', '−1 a −2', 'Alvo aceitável'],
          ['4', 'Resposta viva ao estímulo glabelar', '−2 a −3', 'Mais profundo que o recomendado'],
          ['5', 'Resposta lenta ao estímulo glabelar', '−3 a −4', 'Reduzir sedação'],
          ['6', 'Sem resposta ao estímulo', '−5', 'Só com indicação formal'],
        ],
        destaque: n - 1,
      },
    }
  },
  formula: ['Escala ordinal de 1 (agitado) a 6 (sem resposta)'],
  fundamento:
    'Ramsay e colaboradores propuseram a escala em 1974, num estudo sobre a alfaxalona, com o objetivo prático de titular sedação — e ela tem o mérito histórico de ter sido a primeira tentativa de transformar "o paciente está bem sedado" numa medida comunicável entre turnos. Sua limitação estrutural é que o nível 1 agrupa toda a agitação num único degrau, o que a torna cega para a diferença entre inquietação e combatividade: um paciente levemente inquieto, que só precisa de reorientação, e outro que arranca o tubo recebem o mesmo número, embora demandem condutas opostas. Há um segundo problema de construção, mais sutil: a escala mistura dois eixos diferentes numa progressão única. Os níveis 1 a 3 descrevem **estado de vigília e cooperação** observados espontaneamente, enquanto os níveis 4 a 6 descrevem **intensidade de resposta a estímulo** aplicado. Não são a mesma dimensão, e por isso a progressão não é linear nem tem intervalos comparáveis — a distância entre 2 e 3 é qualitativamente diferente da distância entre 4 e 5. A RASS resolveu exatamente isso ao adotar uma escala simétrica em torno do zero, com quatro níveis de agitação acima e cinco de sedação abaixo, e ao padronizar a sequência do exame (observar, depois chamar pelo nome, depois estimular fisicamente), o que elevou substancialmente a concordância entre observadores. É por isso que as diretrizes PADIS recomendam RASS ou SAS e não Ramsay. Ainda assim, a escala de Ramsay segue relevante por um motivo prático: ela está embutida em protocolos institucionais e em séries históricas, e o profissional precisa saber lê-la e converter para RASS quando o serviço alterna instrumentos.',
  armadilhas: [
    'Não usa estímulo padronizado nem sequência definida, o que reduz a concordância entre observadores.',
    'O nível 1 acumula toda a agitação, de inquietação leve a combatividade que ameaça a via aérea. Se essa distinção muda a conduta, a escala é inadequada e a RASS é a escolha.',
    'Mistura dois eixos — vigília espontânea nos níveis 1 a 3 e resposta a estímulo nos níveis 4 a 6 —, de modo que os intervalos não são comparáveis e a média de valores de Ramsay não tem significado.',
    'Inválida sob bloqueio neuromuscular e de interpretação duvidosa em lesão neurológica estrutural, em que a ausência de resposta pode ser a doença e não a sedação.',
    'Não mede dor nem delirium, e o paciente em nível 2 pode estar com dor intensa ou delirante. As três avaliações são independentes e precisam ser feitas separadamente.',
    'Registrar o nível sem registrar a dose e o horário do sedativo torna o dado inútil para titulação — a escala existe para ajustar infusão, não para preencher planilha.',
  ],
  referencias: [
    { texto: 'Ramsay MA, Savege TM, Simpson BR, Goodwin R. Controlled sedation with alphaxalone-alphadolone. Br Med J. 1974;2(5920):656-659.' },
    { texto: 'Devlin JW, Skrobik Y, Gélinas C, et al. Clinical Practice Guidelines for the Prevention and Management of Pain, Agitation/Sedation, Delirium, Immobility, and Sleep Disruption in Adult Patients in the ICU (PADIS). Crit Care Med. 2018;46(9):e825-e873.' },
    { texto: 'Sessler CN, Gosnell MS, Grap MJ, et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med. 2002;166(10):1338-1344.' },
  ],
}

const ppc: Ferramenta = {
  id: 'pressao-perfusao-cerebral',
  nome: 'Pressão de perfusão cerebral',
  sigla: 'PPC',
  sinonimos: ['ppc', 'pic', 'hipertensao intracraniana', 'perfusao cerebral'],
  resumo: 'Calcula PPC a partir de PAM e PIC, com os alvos por cenário.',
  categorias: ['neurologia', 'emergencia'],
  campos: [
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 50, max: 260, passo: 1, ajuda: 'De linha arterial, com o transdutor zerado no nível do meato acústico externo — e não no átrio direito. Cada 10 cm de diferença de altura equivale a cerca de 7,5 mmHg de erro na PPC.' }),
    campoNum('pad', 'PA diastólica', { unidade: 'mmHg', min: 20, max: 160, passo: 1, ajuda: 'A diastólica pesa o dobro da sistólica no cálculo da PAM, porque a diástole ocupa cerca de dois terços do ciclo cardíaco.' }),
    campoNum('pic', 'Pressão intracraniana', { unidade: 'mmHg', min: 0, max: 80, passo: 1, normalMin: 5, normalMax: 15, ajuda: 'Medida invasiva (cateter intraparenquimatoso ou ventricular). Use a média de um traçado estável, não um pico transitório de tosse, aspiração ou manipulação — esses picos sobem a PIC em dezenas de mmHg por segundos e não representam o estado basal.' }),
  ],
  calcular: (v) => {
    const pas = num(v, 'pas')
    const pad = num(v, 'pad')
    const pic = num(v, 'pic')
    if (pas === null || pad === null || pic === null) return null
    const pam = (pas + 2 * pad) / 3
    const ppc = pam - pic
    const nivel: Nivel = ppc < 50 ? 'critico' : ppc < 60 ? 'alerta' : ppc > 100 ? 'atencao' : 'ok'
    return {
      titulo: 'Pressão de perfusão cerebral',
      valor: fmtInt(ppc),
      unidade: 'mmHg',
      nivel,
      rotuloNivel: ppc < 60 ? 'Abaixo do alvo' : ppc > 100 ? 'Acima do alvo' : 'Dentro do alvo',
      detalhes: [
        { rotulo: 'Pressão arterial média', valor: `${fmtInt(pam)} mmHg` },
        { rotulo: 'Pressão intracraniana', valor: `${fmtInt(pic)} mmHg`, nota: 'Referência 5 a 15 mmHg. Acima de 22 mmHg define hipertensão intracraniana com indicação de tratamento no traumatismo cranioencefálico.', nivel: pic > 22 ? 'critico' : pic > 15 ? 'alerta' : 'ok' },
        { rotulo: 'Alvo no traumatismo cranioencefálico', valor: '60 a 70 mmHg', nota: 'Recomendação da Brain Trauma Foundation, 4ª edição.' },
      ],
      interpretacao: [
        'A **doutrina de Monro-Kellie** é o fundamento: o crânio é uma caixa rígida com três compartimentos — parênquima, sangue e líquor. Aumento de um exige redução de outro, e quando os mecanismos de compensação (deslocamento de líquor e de sangue venoso) se esgotam, a pressão sobe de forma exponencial. É por isso que os últimos milímetros de volume produzem os maiores saltos de pressão.',
        ppc < 60
          ? '**PPC abaixo do alvo.** Duas alavancas: elevar a PAM (volume, vasopressor) ou reduzir a PIC (cabeceira a 30°, cabeça em posição neutra, sedação e analgesia adequadas, terapia hiperosmolar com salina hipertônica ou manitol, drenagem ventricular, controle de temperatura, e cirurgia descompressiva como último recurso).'
          : ppc > 100
            ? 'PPC muito alta pode agravar edema vasogênico e hiperemia. Evite elevações desnecessárias da PAM.'
            : 'PPC dentro do alvo. Mantenha a monitorização contínua.',
        'Perseguir PPC acima de 70 mmHg à custa de volume e vasopressor **aumenta** o risco de síndrome do desconforto respiratório agudo, sem melhorar o desfecho neurológico. Esse foi um dos achados que motivou a revisão do alvo para baixo.',
        'Hiperventilação profilática está contraindicada: a vasoconstrição reduz a PIC ao custo de reduzir o fluxo sanguíneo cerebral, e pode causar isquemia. Reserve a hiperventilação leve e transitória para herniação iminente, como ponte até a intervenção definitiva.',
        'A **cascata vasodilatadora** de Rosner explica por que a queda de pressão arterial é tão perigosa no cérebro lesado, e por que ela se autoalimenta. Quando a PPC cai, a arteríola cerebral responde com vasodilatação para manter o fluxo — é a autorregulação funcionando. Mas vasodilatação significa aumento do volume sanguíneo cerebral, e num crânio sem complacência restante esse volume extra eleva a PIC. A PIC mais alta reduz ainda mais a PPC, o que provoca mais vasodilatação, mais volume, mais PIC. O ciclo se fecha e a deterioração é rápida. É por isso que um episódio aparentemente modesto de hipotensão pode desencadear um pico de hipertensão intracraniana, e por que a hipotensão é um dos preditores mais fortes de mau desfecho no traumatismo cranioencefálico — mais forte, inclusive, que a hipertensão intracraniana isolada. O mesmo raciocínio funciona ao contrário e é terapêutico: restaurar a PPC induz vasoconstrição, reduz o volume sanguíneo cerebral e baixa a PIC. Daí a regra prática de que, diante de PIC alta com PPC baixa, elevar a pressão arterial frequentemente reduz a PIC em vez de aumentá-la.',
        'Vale entender também por que o alvo tem **teto** e não só piso. Pressão de perfusão muito alta em território com barreira hematoencefálica rompida aumenta a pressão hidrostática capilar e agrava o edema vasogênico, enquanto a hiperemia eleva o volume sanguíneo cerebral. Além disso, atingir PPC acima de 70 mmHg exige volume e vasopressor em doses que produzem sobrecarga hídrica e lesão pulmonar — o achado que motivou a Brain Trauma Foundation a revisar o alvo para baixo, para a faixa de 60 a 70 mmHg.',
      ],
      conduta: ppc < 60
        ? [
            'Aja nas duas alavancas simultaneamente, começando pelo que é reversível em minutos. **Reduzir a PIC**: cabeceira elevada a 30° com cabeça em posição neutra (a rotação cervical obstrui a drenagem jugular), colar cervical frouxo ou removido se já liberada a coluna, sedação e analgesia adequadas para abolir tosse e assincronia, normotermia ativa, tratamento de crise convulsiva e correção de hiponatremia.',
            '**Terapia hiperosmolar** para PIC elevada: salina hipertônica (bolus de 3% ou de 23,4% conforme protocolo) ou manitol 0,25 a 1 g/kg. A salina hipertônica tem vantagem no paciente hipovolêmico ou hipotenso, porque expande volume enquanto reduz a PIC; o manitol causa diurese osmótica e pode agravar hipotensão. Monitore sódio, osmolaridade e função renal.',
            '**Elevar a PAM** com volume se houver hipovolemia e com noradrenalina se não houver. Lembre a cascata vasodilatadora: elevar a pressão arterial em paciente com PPC baixa frequentemente **reduz** a PIC, por induzir vasoconstrição e diminuir o volume sanguíneo cerebral.',
            'Se a PIC permanecer acima de 22 mmHg de forma refratária, escale conforme protocolo: drenagem liquórica por cateter ventricular, coma barbitúrico e **craniectomia descompressiva**. Nesse ponto, discuta com a neurocirurgia e considere o prognóstico global na decisão.',
            ppc < 50
              ? 'PPC abaixo de 50 mmHg é isquemia cerebral global em curso, com consumo de reserva metabólica. Trate como emergência imediata e reavalie a cada poucos minutos. Se houver sinal de herniação (anisocoria, postura de descerebração, tríade de Cushing), hiperventilação leve e transitória e bolus hiperosmolar são pontes aceitáveis até a intervenção definitiva — nunca terapia de manutenção.'
              : 'Reavalie a PPC continuamente e não por medidas pontuais: a carga de tempo abaixo do alvo, e não apenas o valor mínimo, é o que se correlaciona com desfecho.',
          ]
        : ppc > 100
          ? [
              'Evite elevações desnecessárias da PAM. Reveja se há vasopressor em dose excessiva, dor não tratada, agitação, hipercapnia ou sobrecarga volêmica contribuindo, e corrija a causa em vez de introduzir anti-hipertensivo às cegas.',
              'Se houver indicação de reduzir a pressão arterial (hemorragia intracerebral aguda com alvo sistólico definido, dissecção aórtica, pós-operatório vascular), use agente titulável de meia-vida curta — nicardipino ou labetalol — e evite nitroprussiato e nitroglicerina, que são vasodilatadores cerebrais e podem elevar a PIC.',
              'Reduza a pressão de forma gradual e monitorizada, vigiando a PPC a cada ajuste: no cérebro com autorregulação perdida, queda rápida de PAM converte-se diretamente em queda de fluxo e isquemia.',
            ]
          : [
              'PPC dentro do alvo de 60 a 70 mmHg. Mantenha a monitorização contínua e registre a **carga de tempo** fora do alvo, que se correlaciona melhor com desfecho do que valores isolados.',
              'Sustente as medidas de base que mantêm a PIC controlada: cabeceira a 30° com cabeça neutra, normotermia, normocapnia (PaCO₂ de 35 a 40 mmHg), normoglicemia, normonatremia ou hipernatremia leve conforme protocolo, sedação adequada e profilaxia de crise convulsiva quando indicada.',
              'Evite perseguir PPC acima de 70 mmHg com volume e vasopressor: não melhora o desfecho neurológico e aumenta o risco de síndrome do desconforto respiratório agudo.',
              'Quando disponível, complemente com monitorização multimodal — índice de reatividade da pressão (PRx) para estimar o estado da autorregulação, oximetria tecidual cerebral, Doppler transcraniano — e individualize o alvo de PPC em vez de aplicar a faixa fixa.',
            ],
      alertas: [
        'Zere o transdutor arterial no nível do **meato acústico externo** quando o alvo é PPC. Zerado no átrio direito, a PAM é superestimada em paciente com cabeceira elevada e a PPC calculada fica falsamente confortável.',
        'Hiperventilação profilática é contraindicada. A vasoconstrição por hipocapnia reduz a PIC ao custo de reduzir o fluxo sanguíneo cerebral e pode causar isquemia — reserve-a, leve e transitória, apenas para herniação iminente como ponte.',
        'Hipotensão é um dos preditores mais fortes de mau desfecho no traumatismo cranioencefálico, mais que a hipertensão intracraniana isolada, por causa da cascata vasodilatadora. Evitar um único episódio de hipotensão pode valer mais que otimizar a PIC.',
        'Nitroprussiato e nitroglicerina são vasodilatadores cerebrais e elevam a PIC. Não os use para controle pressórico em paciente com hipertensão intracraniana.',
        'A fórmula pressupõe medida invasiva de PIC. Estimativas por ultrassom da bainha do nervo óptico ou por Doppler transcraniano servem para triagem e não para titular terapia.',
      ],
      tabela: {
        titulo: 'Faixas de PPC e de PIC',
        colunas: ['Parâmetro', 'Faixa', 'Significado', 'Conduta'],
        linhas: [
          ['PPC', '< 50 mmHg', 'Isquemia cerebral global', 'Emergência: elevar PAM e reduzir PIC agora'],
          ['PPC', '50 – 59 mmHg', 'Abaixo do alvo', 'Corrigir ativamente as duas alavancas'],
          ['PPC', '60 – 70 mmHg', 'Alvo (Brain Trauma Foundation)', 'Manter e registrar tempo fora do alvo'],
          ['PPC', '> 100 mmHg', 'Risco de edema vasogênico e hiperemia', 'Evitar elevação desnecessária da PAM'],
          ['PIC', '> 22 mmHg', 'Hipertensão intracraniana no TCE', 'Tratar: hiperosmolar, drenagem, escalonar'],
        ],
        destaque: ppc < 50 ? 0 : ppc < 60 ? 1 : ppc <= 100 ? 2 : 3,
      },
    }
  },
  formula: ['PPC = PAM − PIC', 'PAM = (PAS + 2 × PAD) / 3'],
  fundamento:
    'O fluxo sanguíneo cerebral é autorregulado entre PAMs de aproximadamente 50 e 150 mmHg em pessoas normotensas, por vasodilatação e vasoconstrição arteriolar. Na lesão cerebral aguda essa autorregulação frequentemente se perde, e o fluxo passa a depender linearmente da pressão de perfusão — é aí que a PPC deixa de ser um número fisiológico e vira alvo terapêutico. O cérebro consome cerca de 20% do oxigênio e 25% da glicose do organismo com apenas 2% da massa corporal, não estoca substrato e tolera isquemia por poucos minutos; por isso a autorregulação existe e por isso sua perda é catastrófica. Dois mecanismos organizam toda a terapêutica. O primeiro é a **doutrina de Monro-Kellie**: o crânio é uma caixa rígida com três compartimentos — parênquima, sangue e líquor — e o aumento de um exige a redução de outro. Enquanto há complacência (deslocamento de líquor para o espaço subaracnóideo espinhal e de sangue venoso para fora), a pressão sobe pouco; quando essa reserva se esgota, a relação entre volume e pressão se torna exponencial, e é por isso que os últimos mililitros de hematoma ou de edema produzem os maiores saltos de PIC. O segundo é a **cascata vasodilatadora** descrita por Rosner: a queda de PPC provoca vasodilatação arteriolar compensatória, que aumenta o volume sanguíneo cerebral, que num crânio sem complacência eleva a PIC, que reduz ainda mais a PPC — um ciclo que se autoalimenta e explica por que hipotensão é preditor de desfecho pior que hipertensão intracraniana isolada. A mesma cascata funciona como alavanca terapêutica no sentido inverso: restaurar a PPC induz vasoconstrição, reduz o volume sanguíneo cerebral e baixa a PIC. Historicamente, o alvo de PPC já foi acima de 70 mmHg, e foi revisado para 60 a 70 mmHg quando ficou claro que persegui-lo com volume e vasopressor aumentava a incidência de síndrome do desconforto respiratório agudo sem ganho neurológico.',
  armadilhas: [
    'Zere o transdutor de pressão arterial no nível do **meato acústico externo** (forame de Monro), não no átrio direito, quando o objetivo for PPC. A diferença de altura entre os dois pontos gera erro de vários mmHg.',
    'PIC estimada por ultrassom da bainha do nervo óptico ou por Doppler transcraniano é útil para triagem, mas não substitui a medida invasiva quando a decisão depende do valor.',
    'Usar um pico transitório de PIC (tosse, aspiração, manipulação, assincronia) em vez de um traçado basal estável leva a intervenções desnecessárias. Esses picos sobem dezenas de mmHg por segundos e são fisiológicos.',
    'O alvo de 60 a 70 mmHg é do traumatismo cranioencefálico adulto. Em hemorragia subaracnóidea com vasoespasmo, em pediatria (alvos menores, por faixa etária) e em hipertensão crônica não tratada (curva de autorregulação deslocada para a direita), o alvo é outro.',
    'PPC adequada não garante oxigenação tecidual adequada. Anemia, hipoxemia, febre, crise convulsiva e vasoespasmo podem produzir isquemia com PPC normal — a PPC mede pressão, não entrega de oxigênio.',
    'Calcular PPC com PAM obtida por manguito não invasivo em paciente instável introduz erro grande justamente quando a precisão importa mais.',
  ],
  referencias: [
    { texto: 'Carney N, Totten AM, O’Reilly C, et al. Guidelines for the management of severe traumatic brain injury, 4ª edição. Neurosurgery. 2017;80(1):6-15.' },
    { texto: 'Chesnut RM, Temkin N, Carney N, et al. A trial of intracranial-pressure monitoring in traumatic brain injury. N Engl J Med. 2012;367(26):2471-2481.' },
  ],
}

const mrcForca: Ferramenta = {
  id: 'mrc-forca-muscular',
  nome: 'Escala MRC de força muscular e escore MRC-sum',
  sinonimos: ['mrc', 'forca muscular', 'grau de forca', 'fraqueza uti'],
  resumo: 'Gradua a força de 0 a 5 e soma 12 grupos para rastrear fraqueza adquirida na UTI.',
  categorias: ['neurologia'],
  campos: [
    campoOpc('grau', 'Grau de força do grupo avaliado', [
      { valor: '5', rotulo: '5 — força normal contra resistência plena', pontos: 5 },
      { valor: '4', rotulo: '4 — movimento contra resistência, porém reduzido', pontos: 4 },
      { valor: '3', rotulo: '3 — movimento contra a gravidade, sem resistência', pontos: 3 },
      { valor: '2', rotulo: '2 — movimento apenas com gravidade eliminada', pontos: 2 },
      { valor: '1', rotulo: '1 — contração muscular visível ou palpável, sem movimento', pontos: 1 },
      { valor: '0', rotulo: '0 — nenhuma contração', pontos: 0 },
    ]),
    campoNum('somaMrc', 'MRC-sum (soma dos 12 grupos, 0 a 60)', { min: 0, max: 60, passo: 1, opcional: true, ajuda: 'Abdução de ombro, flexão de cotovelo, extensão de punho, flexão de quadril, extensão de joelho e dorsiflexão de tornozelo — bilateralmente.' }),
  ],
  calcular: (v) => {
    const g = num(v, 'grau')
    if (g === null) return null
    const soma = num(v, 'somaMrc')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Interpretação do grau', valor: g >= 4 ? 'Força funcionalmente preservada' : g === 3 ? 'Vence a gravidade — limiar funcional mínimo' : 'Força insuficiente para função' },
    ]
    if (soma !== null) {
      detalhes.push({
        rotulo: 'MRC-sum',
        valor: `${fmtInt(soma)} de 60`,
        nota: soma < 48 ? '**Abaixo de 48 define fraqueza adquirida na UTI**, presente em 25 a 50% dos pacientes ventilados por mais de uma semana e associada a desmame prolongado, maior mortalidade e incapacidade persistente por anos.' : 'Acima do ponto de corte de fraqueza adquirida na UTI.',
        nivel: soma < 36 ? 'critico' : soma < 48 ? 'alerta' : 'ok',
      })
      detalhes.push({ rotulo: 'Fraqueza grave', valor: soma < 36 ? 'Sim (< 36)' : 'Não' })
    }
    return {
      titulo: 'Escala MRC',
      valor: `Grau ${g}`,
      unidade: 'de 5',
      nivel: g <= 2 ? 'alerta' : g === 3 ? 'atencao' : 'ok',
      detalhes,
      conduta: [
        '**MRC-sum < 48 pontos** (de 60) define **fraqueza adquirida na UTI**, condição que aumenta tempo de ventilação, de internação e mortalidade, e cujos déficits persistem por anos em parte dos sobreviventes.',
        'Confirmado o diagnóstico, a intervenção com melhor evidência é a **mobilização precoce e progressiva**: exercícios passivos e ativos no leito, cicloergômetro, sentar à beira do leito e ortostase, iniciados assim que houver estabilidade hemodinâmica e respiratória — inclusive em paciente ainda intubado.',
        'Reduza os fatores de risco modificáveis: **minimize sedação profunda e bloqueio neuromuscular**, controle a hiperglicemia, trate a sepse com agressividade e evite corticoide sem indicação. O tempo de imobilidade e a profundidade da sedação são os determinantes mais controláveis.',
        'Diferencie **polineuropatia do doente crítico** (déficit sensitivo associado, reflexos abolidos) de **miopatia** (poupa a sensibilidade, com creatinoquinase por vezes elevada) — a distinção exige eletroneuromiografia e muda o prognóstico, geralmente melhor na miopatia. Afaste também síndrome de Guillain-Barré, miastenia e mielopatia, que têm tratamento específico.',
        'A escala exige **paciente cooperativo**: só é aplicável com RASS entre −1 e +1 e capacidade de seguir comandos. Em paciente sedado ou com delirium, o escore não é válido — use força de preensão, estimulação nervosa ou ultrassonografia muscular como alternativas, e registre o motivo da não aplicação.',
      ],
      interpretacao: [
        'A escala é ordinal e assimétrica: o grau 4 abrange uma faixa enorme de força — de quase normal a mal vencendo resistência mínima — e por isso muitos serviços a subdividem em 4−, 4 e 4+. Os graus 0 a 3, ao contrário, são bem definidos porque se ancoram na gravidade.',
        'O **grau 3 é o divisor de águas funcional**: vencer a gravidade é o mínimo para qualquer atividade útil. Abaixo disso, o membro não sustenta função.',
        'A prevenção da fraqueza adquirida na UTI é feita com **mobilização precoce**, minimização de sedação, controle glicêmico e evitação de bloqueio neuromuscular prolongado e de corticoide desnecessário.',
      ],
      alertas: ['A avaliação exige paciente cooperativo e acordado (RASS ≥ −1 e capaz de obedecer a comandos). Em paciente não cooperativo, use eletroneuromiografia ou medidas indiretas.'],
    }
  },
  formula: ['Escala de 0 a 5 por grupo muscular', 'MRC-sum = soma de 12 grupos (6 bilaterais), de 0 a 60; < 48 define fraqueza adquirida na UTI'],
  fundamento:
    'A escala foi padronizada pelo Medical Research Council britânico durante a Segunda Guerra, para avaliar lesões de nervo periférico de forma reprodutível entre hospitais. A ancoragem na gravidade — que é a mesma em qualquer lugar do mundo — foi a solução elegante que garantiu sua sobrevivência por oitenta anos.',
  armadilhas: [
    'Dor, contratura, limitação articular e falta de compreensão do comando reduzem a pontuação sem que haja fraqueza neurológica.',
    'A concordância entre observadores é boa nos graus 0 a 3 e apenas moderada nos graus 4 e 5.',
  ],
  referencias: [
    { texto: 'Medical Research Council. Aids to the examination of the peripheral nervous system. Memorandum no. 45. Londres: HMSO; 1976.' },
    { texto: 'De Jonghe B, Sharshar T, Lefaucheur JP, et al. Paresis acquired in the intensive care unit: a prospective multicenter study. JAMA. 2002;288(22):2859-2867.' },
  ],
}

const cefaleias: Ferramenta = {
  id: 'criterios-cefaleia',
  nome: 'Critérios diagnósticos de cefaleias e sinais de alarme',
  sinonimos: ['cefaleia', 'enxaqueca', 'migranea', 'snoop', 'dor de cabeca'],
  resumo: 'Aplica os critérios da ICHD-3 e rastreia os sinais de alarme SNNOOP10.',
  categorias: ['neurologia'],
  campos: [
    campoSeg('tipo', 'Hipótese a testar', [
      { valor: 'migranea', rotulo: 'Migrânea sem aura' },
      { valor: 'tensional', rotulo: 'Tensional' },
      { valor: 'salvas', rotulo: 'Em salvas' },
    ]),
    campoNum('crises', 'Número de crises já vividas com o padrão descrito', { min: 0, max: 100, passo: 1, padrao: '5' }),
    campoSimNao('duracao', 'Duração compatível (migrânea 4 a 72 h; tensional 30 min a 7 dias; salvas 15 a 180 min)', 1),
    campoSimNao('unilateral', 'Dor unilateral', 1),
    campoSimNao('pulsatil', 'Caráter pulsátil', 1),
    campoSimNao('intensidade', 'Intensidade moderada a grave', 1),
    campoSimNao('piora', 'Piora com atividade física rotineira', 1),
    campoSimNao('nauseas', 'Náuseas ou vômitos', 1),
    campoSimNao('fotofono', 'Fotofobia e fonofobia', 1),
    campoSimNao('autonomico', 'Sinais autonômicos ipsilaterais (lacrimejamento, rinorreia, ptose, miose, edema palpebral)', 1),
    campoSimNao('inquietacao', 'Inquietação ou agitação durante a crise', 1),
    campoSimNao('alarme', 'Algum sinal de alarme presente', 1, 'Veja a lista SNNOOP10 no resultado.'),
  ],
  calcular: (v) => {
    const tipo = opc(v, 'tipo')
    const crises = num(v, 'crises')
    if (crises === null) return null
    const criteriosMigranea = ['unilateral', 'pulsatil', 'intensidade', 'piora'].filter((id) => sim(v, id)).length
    const associados = sim(v, 'nauseas') || sim(v, 'fotofono')
    const temAlarme = sim(v, 'alarme')
    let preenche = false
    let texto = ''
    if (tipo === 'migranea') {
      preenche = crises >= 5 && sim(v, 'duracao') && criteriosMigranea >= 2 && associados
      texto = `Migrânea sem aura exige: ≥ 5 crises, duração de 4 a 72 h sem tratamento, **pelo menos 2 de 4** características da dor (unilateral, pulsátil, moderada a grave, piora com atividade) e **pelo menos 1** sintoma associado (náusea/vômito ou fotofobia com fonofobia). Aqui: ${crises} crise(s), ${criteriosMigranea} de 4 características, sintomas associados ${associados ? 'presentes' : 'ausentes'}.`
    } else if (tipo === 'tensional') {
      const carac = [!sim(v, 'unilateral'), !sim(v, 'pulsatil'), !sim(v, 'intensidade'), !sim(v, 'piora')].filter(Boolean).length
      preenche = crises >= 10 && sim(v, 'duracao') && carac >= 2 && !sim(v, 'nauseas')
      texto = `Cefaleia tensional é definida em espelho: bilateral, em pressão ou aperto (não pulsátil), intensidade leve a moderada, **sem** piora com atividade rotineira — pelo menos 2 dessas 4 — e sem náusea ou vômito (fotofobia **ou** fonofobia isoladas são aceitas). Aqui: ${carac} de 4 características compatíveis.`
    } else {
      preenche = crises >= 5 && sim(v, 'duracao') && sim(v, 'unilateral') && (sim(v, 'autonomico') || sim(v, 'inquietacao'))
      texto = `Cefaleia em salvas exige: ≥ 5 crises de dor unilateral orbitária, supraorbitária ou temporal, intensa, com duração de 15 a 180 min sem tratamento, acompanhada de sinais autonômicos ipsilaterais **ou** de inquietação, com frequência de 1 a 8 por dia nos períodos ativos.`
    }
    return {
      titulo: preenche ? 'Critérios preenchidos' : 'Critérios não preenchidos',
      valor: preenche ? 'Compatível' : 'Não compatível',
      nivel: temAlarme ? 'critico' : preenche ? 'ok' : 'atencao',
      rotuloNivel: temAlarme ? '⚠ Sinal de alarme presente — investigar antes de rotular' : preenche ? 'Padrão característico' : 'Reavalie o padrão ou considere outra hipótese',
      detalhes: [{ rotulo: 'Critérios da hipótese testada', valor: texto }],
      conduta: [
        'Diante de **qualquer sinal de alarme (SNOOP4)** — início súbito em trovoada, sintoma neurológico focal, início após os 50 anos, alteração do padrão habitual, papiledema, piora com Valsalva, imunossupressão, câncer, gestação, febre —, interrompa o raciocínio de cefaleia primária e investigue com neuroimagem.',
        'Na **cefaleia em trovoada** (pico em menos de 1 minuto), o diagnóstico a excluir é hemorragia subaracnóidea: **tomografia sem contraste** nas primeiras 6 horas tem sensibilidade próxima de 100%; após esse prazo, ou se a tomografia for normal com suspeita mantida, faça **punção lombar** procurando xantocromia. Considere ainda dissecção arterial, trombose venosa cerebral, apoplexia hipofisária e síndrome de vasoconstrição cerebral reversível.',
        'Confirmada **enxaqueca**, trate a crise com anti-inflamatório ou triptano precoce (quanto mais cedo, mais eficaz), associado a antiemético. Evite opioides e butalbital, que promovem cefaleia por uso excessivo de medicação. Indique **profilaxia** quando houver 4 ou mais dias de crise por mês, ou incapacidade significativa: propranolol, topiramato, amitriptilina, candesartana, ou anticorpos anti-CGRP nos casos refratários.',
        'Na **cefaleia em salvas**, o tratamento agudo é **oxigênio a 100% em máscara não reinalante a 12–15 L/min** e sumatriptano subcutâneo; a profilaxia de transição é verapamil em dose alta, com ECG de controle pelo risco de bloqueio. O erro comum é tratar como enxaqueca e não oferecer oxigênio, que é altamente eficaz e subutilizado.',
        'Investigue **cefaleia por uso excessivo de medicação** em todo paciente com cefaleia crônica diária: uso de analgésico simples em 15 ou mais dias por mês, ou de triptano, ergotamínico, opioide ou combinação em 10 ou mais dias por mês. O tratamento é a retirada do agente, com profilaxia associada e aviso claro de que haverá piora transitória antes da melhora.',
      ],
      interpretacao: [
        temAlarme
          ? '**Sinal de alarme presente.** Nenhum diagnóstico de cefaleia primária deve ser feito antes de excluir causa secundária. Neuroimagem, e conforme o caso punção lombar, velocidade de hemossedimentação e angiografia, são o próximo passo.'
          : 'Sem sinais de alarme relatados. Cefaleia primária com padrão típico e exame neurológico normal dispensa neuroimagem de rotina.',
        '**SNNOOP10 — sinais de alarme:** **S**intoma sistêmico (febre, perda de peso); **N**eoplasia; **N**eurológico (déficit ou alteração de consciência); **O**nset súbito (em trovoada); **O**lder — início após os 50 anos; **P**adrão que muda ou progride; **P**osicional; **P**recipitada por manobra de Valsalva, esforço ou tosse; **P**apiledema; **P**rogressiva com apresentação atípica; **P**uerpério ou gestação; **P**ainful eye com sinais autonômicos; **P**ós-traumática; **P**atologia imunológica (HIV, imunossupressão); **P**or uso excessivo de analgésico.',
        'A **cefaleia por uso excessivo de medicação** é subdiagnosticada e reversível: 15 dias ou mais por mês de analgésico simples, ou 10 dias ou mais de triptano, ergotamínico, opioide ou combinação, por mais de 3 meses. O tratamento é a retirada.',
        'Migrânea com aura acrescenta sintomas neurológicos focais totalmente reversíveis, de instalação gradual em 5 minutos ou mais, com duração de 5 a 60 minutos — visuais na maioria, seguidos de sensitivos e de linguagem. Aura de instalação súbita ou com duração fora dessa janela exige investigação vascular.',
      ],
      alertas: temAlarme ? ['Não prescreva tratamento de cefaleia primária antes de excluir a causa secundária.'] : undefined,
    }
  },
  formula: [],
  fundamento:
    'A Classificação Internacional das Cefaleias, hoje na terceira edição, é um sistema operacional: define cada entidade por critérios explícitos de número de crises, duração, características da dor e sintomas associados. Essa formalização foi o que permitiu que ensaios clínicos de cefaleia se tornassem comparáveis, e é a razão de os critérios parecerem burocráticos — eles são desenhados para reprodutibilidade, não para elegância clínica.',
  armadilhas: [
    'Migrânea é subdiagnosticada como sinusite e como cefaleia tensional. Dor unilateral com náusea e fotofobia que incapacita é migrânea até prova em contrário.',
    'Cefaleia em salvas é frequentemente confundida com neuralgia do trigêmeo; a duração (minutos a horas contra segundos) e a inquietação motora separam as duas.',
  ],
  referencias: [
    { texto: 'Headache Classification Committee of the International Headache Society. The International Classification of Headache Disorders, 3ª edição. Cephalalgia. 2018;38(1):1-211.' },
    { texto: 'Do TP, Remmers A, Schytz HW, et al. Red and orange flags for secondary headaches in clinical practice: SNNOOP10 list. Neurology. 2019;92(3):134-144.' },
  ],
}

const conversorAntiepileptico: Ferramenta = {
  id: 'conversor-antiepilepticos',
  nome: 'Doses e conversões de antiepilépticos',
  sinonimos: ['antiepileptico', 'anticonvulsivante', 'fenitoina', 'estado de mal', 'crise convulsiva'],
  resumo: 'Doses de ataque e manutenção, correção da fenitoína pela albumina e sequência do estado de mal.',
  categorias: ['neurologia', 'emergencia', 'farmacologia'],
  campos: [
    campoNum('peso', 'Peso', { unidade: 'kg', min: 3, max: 250, passo: 0.5 }),
    campoOpc('farmaco', 'Fármaco', [
      { valor: 'fenitoina', rotulo: 'Fenitoína / fosfenitoína' },
      { valor: 'levetiracetam', rotulo: 'Levetiracetam' },
      { valor: 'valproato', rotulo: 'Ácido valproico' },
      { valor: 'lacosamida', rotulo: 'Lacosamida' },
      { valor: 'fenobarbital', rotulo: 'Fenobarbital' },
      { valor: 'midazolam', rotulo: 'Midazolam' },
      { valor: 'diazepam', rotulo: 'Diazepam' },
    ]),
    campoNum('nivelFenitoina', 'Nível sérico de fenitoína', { unidade: 'µg/mL', min: 1, max: 60, passo: 0.1, opcional: true, mostrarSe: (v) => opc(v, 'farmaco') === 'fenitoina' }),
    campoNum('albumina', 'Albumina', { unidade: 'g/dL', min: 0.5, max: 6, passo: 0.1, padrao: '4', opcional: true, mostrarSe: (v) => opc(v, 'farmaco') === 'fenitoina' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const f = opc(v, 'farmaco')
    if (peso === null) return null
    const doses: Record<string, { ataque: string; mgkg: number | null; max: string; manutencao: string; obs: string }> = {
      fenitoina: { ataque: '15 a 20 mg/kg', mgkg: 20, max: 'Velocidade máxima 50 mg/min (fenitoína) ou 150 mg EF/min (fosfenitoína)', manutencao: '5 a 7 mg/kg/dia, 8/8 h ou 12/12 h', obs: 'Cinética não linear: pequenos aumentos de dose podem elevar muito o nível. Nunca diluir em soro glicosado (precipita). Monitorar eletrocardiograma e pressão durante a infusão — hipotensão e arritmia são dose e velocidade dependentes.' },
      levetiracetam: { ataque: '40 a 60 mg/kg', mgkg: 60, max: 'Máximo de 4500 mg', manutencao: '1000 a 3000 mg/dia, 12/12 h', obs: 'Sem interações relevantes com o citocromo P450 e sem necessidade de nível sérico. Ajustar pela função renal. Alterações comportamentais e irritabilidade são os efeitos adversos mais comuns.' },
      valproato: { ataque: '20 a 40 mg/kg', mgkg: 40, max: 'Máximo de 3000 mg', manutencao: '15 a 45 mg/kg/dia', obs: 'Contraindicado na gestação e em mulheres em idade fértil sem contracepção efetiva (teratogenicidade e prejuízo do neurodesenvolvimento). Cuidado em hepatopatia e em doenças mitocondriais. Hiperamonemia pode ocorrer com transaminases normais.' },
      lacosamida: { ataque: '200 a 400 mg', mgkg: null, max: '400 mg', manutencao: '200 a 400 mg/dia, 12/12 h', obs: 'Prolonga o intervalo PR — cuidado em distúrbio de condução. Boa opção quando fenitoína e valproato são contraindicados.' },
      fenobarbital: { ataque: '15 a 20 mg/kg', mgkg: 20, max: 'Velocidade máxima de 50 a 100 mg/min', manutencao: '1 a 3 mg/kg/dia', obs: 'Sedação profunda e depressão respiratória são esperadas nas doses de ataque — tenha via aérea preparada. Indutor enzimático potente.' },
      midazolam: { ataque: '0,2 mg/kg intramuscular (10 mg se > 40 kg) ou 0,1 a 0,2 mg/kg EV', mgkg: 0.2, max: 'Máximo de 10 mg por dose', manutencao: 'Infusão contínua de 0,05 a 2 mg/kg/h no estado de mal refratário', obs: 'O ensaio RAMPART mostrou que midazolam intramuscular é pelo menos tão eficaz quanto lorazepam endovenoso no pré-hospitalar — e mais rápido de administrar, porque dispensa acesso venoso.' },
      diazepam: { ataque: '0,15 a 0,2 mg/kg EV', mgkg: 0.2, max: 'Máximo de 10 mg por dose, repetir uma vez', manutencao: 'Não usar em manutenção — redistribuição rápida com efeito anticonvulsivante curto', obs: 'Meia-vida de distribuição curta: a crise pode recorrer em 15 a 30 minutos. Sempre seguir com antiepiléptico de manutenção.' },
    }
    const d = doses[f]
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Dose de ataque', valor: d.mgkg !== null ? `${d.ataque} → **${fmtInt(peso * d.mgkg)} mg** para ${fmt(peso, 1)} kg` : d.ataque },
      { rotulo: 'Limite', valor: d.max },
      { rotulo: 'Manutenção', valor: d.manutencao },
      { rotulo: 'Observações', valor: d.obs },
    ]
    if (f === 'fenitoina') {
      const nivel = num(v, 'nivelFenitoina')
      const alb = numOu(v, 'albumina', 4)
      if (nivel !== null) {
        const corrigido = nivel / (0.2 * alb + 0.1)
        detalhes.unshift({
          rotulo: 'Nível de fenitoína corrigido pela albumina',
          valor: `${fmt(corrigido, 1)} µg/mL`,
          nota: `Fórmula de Sheiner-Tozer. Faixa terapêutica de 10 a 20 µg/mL. Com albumina de ${fmt(alb, 1)} g/dL, o nível medido de ${fmt(nivel, 1)} corresponde a ${fmt(corrigido, 1)} corrigido — a fenitoína é 90% ligada à albumina, e a fração livre é a ativa.`,
          nivel: corrigido > 20 ? 'alerta' : corrigido < 10 ? 'atencao' : 'ok',
        })
      }
    }
    return {
      titulo: 'Dose calculada',
      valor: d.mgkg !== null ? `${fmtInt(peso * d.mgkg)} mg` : d.ataque,
      nivel: 'neutro',
      rotuloNivel: `Ataque para ${fmt(peso, 1)} kg`,
      detalhes,
      conduta: [
        'Faça a **troca de forma cruzada e lenta**: introduza o novo fármaco até a dose-alvo antes de iniciar a retirada do anterior, que deve ser gradual ao longo de semanas. A retirada abrupta de antiepiléptico é causa frequente de estado de mal epiléptico, mesmo em paciente previamente controlado.',
        'Ao converter entre vias, atente às **diferenças de biodisponibilidade**: fenitoína oral e fosfenitoína intravenosa não são intercambiáveis miligrama a miligrama (a fosfenitoína é dosada em equivalentes de fenitoína), e a absorção da fenitoína é errática com alimentação e com dieta enteral — suspenda a dieta 1 a 2 h antes e depois.',
        'Corrija a **fenitoína pela albumina** antes de interpretar o nível (fórmula de Sheiner-Tozer): ela é fortemente ligada a proteína, e em hipoalbuminemia o nível total é baixo enquanto a fração livre — a ativa — está terapêutica ou tóxica. Dosar o nível livre é preferível quando disponível.',
        'Antecipe as **interações**: fenitoína, carbamazepina, fenobarbital e primidona são indutores enzimáticos potentes e reduzem a eficácia de anticoncepcionais, anticoagulantes diretos, imunossupressores e quimioterápicos. Valproato é inibidor e eleva lamotrigina (exigindo metade da dose e titulação ainda mais lenta, pelo risco de síndrome de Stevens-Johnson) e fenobarbital.',
        'Escolha o fármaco pelo **tipo de crise e pelo perfil do paciente**: valproato é contraindicado em mulheres em idade fértil pelo risco teratogênico e de comprometimento cognitivo fetal, e carbamazepina, oxcarbazepina e fenitoína podem **agravar** crises de ausência e mioclônicas. Em epilepsia generalizada, prefira lamotrigina ou levetiracetam nessas pacientes, com ácido fólico associado.',
      ],
      interpretacao: [
        '**Sequência do estado de mal epiléptico convulsivo:** (1) **0 a 5 min** — via aérea, oxigênio, monitorização, glicemia capilar, acesso venoso, tiamina antes de glicose em etilista; (2) **5 a 20 min** — benzodiazepínico em dose plena: midazolam 10 mg intramuscular, lorazepam 4 mg EV ou diazepam 10 mg EV; (3) **20 a 40 min** — antiepiléptico de segunda linha: fenitoína, valproato ou levetiracetam; (4) **40 a 60 min** — repetir a segunda linha ou partir para anestésico em infusão contínua com eletroencefalograma.',
        'O ensaio **ESETT** comparou fenitoína, valproato e levetiracetam como segunda linha no estado de mal refratário a benzodiazepínico e encontrou eficácia **equivalente** entre os três, com cerca de 47% de cessação. A escolha, portanto, é guiada por contraindicação, disponibilidade e perfil de efeitos adversos — não por superioridade.',
        'O erro mais comum no estado de mal é a **subdose de benzodiazepínico**. Doses fracionadas e tímidas prolongam a crise, e crise prolongada gera farmacorresistência progressiva por internalização dos receptores GABA-A.',
      ],
      alertas: ['Após a cessação clínica das convulsões, considere estado de mal não convulsivo se o paciente não recuperar consciência em 20 a 30 minutos — indicação de eletroencefalograma.'],
    }
  },
  formula: ['Fenitoína corrigida (Sheiner-Tozer) = nível medido ÷ (0,2 × albumina + 0,1)'],
  fundamento:
    'A fenitoína circula 90% ligada à albumina, e apenas a fração livre atravessa a barreira hematoencefálica e exerce efeito. Em hipoalbuminemia, o nível total medido subestima a fração ativa — um nível "subterapêutico" de 8 µg/mL com albumina de 2 g/dL corresponde a cerca de 16 µg/mL corrigidos, plenamente terapêutico. Aumentar a dose nessa situação causa intoxicação.',
  armadilhas: [
    'Em doença renal avançada, a ligação proteica cai ainda mais e a fórmula de Sheiner-Tozer tem versão específica (denominador de 0,1 × albumina + 0,1).',
    'A fenitoína tem cinética de saturação: acima de determinado nível, o metabolismo satura e a concentração sobe de forma desproporcional à dose.',
  ],
  referencias: [
    { texto: 'Kapur J, Elm J, Chamberlain JM, et al. Randomized trial of three anticonvulsant medications for status epilepticus (ESETT). N Engl J Med. 2019;381(22):2103-2113.' },
    { texto: 'Glauser T, Shinnar S, Gloss D, et al. Evidence-based guideline: treatment of convulsive status epilepticus in children and adults. Epilepsy Curr. 2016;16(1):48-61.' },
  ],
}

const riscoConvulsao: Ferramenta = {
  id: 'risco-recorrencia-crise',
  nome: 'Risco de recorrência após primeira crise epiléptica',
  sinonimos: ['primeira crise', 'recorrencia convulsao', 'epilepsia diagnostico'],
  resumo: 'Estima o risco de nova crise e informa a decisão de iniciar antiepiléptico.',
  categorias: ['neurologia'],
  campos: [
    campoSimNao('lesao', 'Lesão cerebral prévia ou estrutural identificada em neuroimagem', 1, 'AVC, traumatismo, tumor, malformação, infecção do sistema nervoso central.'),
    campoSimNao('eeg', 'Eletroencefalograma com atividade epileptiforme', 1),
    campoSimNao('noturna', 'Crise ocorrida durante o sono', 1),
    campoSimNao('familiar', 'História familiar de epilepsia em parente de primeiro grau', 1),
    campoSimNao('previa', 'Evidência de crise prévia não reconhecida (mioclonias, ausências, crise focal)', 1),
  ],
  calcular: (v) => {
    const fatores = ['lesao', 'eeg', 'noturna', 'familiar', 'previa'].filter((id) => sim(v, id))
    const n = fatores.length
    const alto = sim(v, 'lesao') || sim(v, 'eeg') || sim(v, 'noturna') || sim(v, 'previa')
    return {
      titulo: 'Fatores de risco presentes',
      valor: String(n),
      unidade: 'de 5',
      nivel: alto ? 'alerta' : 'atencao',
      rotuloNivel: alto ? 'Risco elevado de recorrência' : 'Risco basal',
      detalhes: [
        { rotulo: 'Risco de recorrência em 2 anos sem fatores de risco', valor: '30 a 40%' },
        { rotulo: 'Risco com lesão estrutural ou eletroencefalograma alterado', valor: '> 60%' },
        { rotulo: 'Definição operacional de epilepsia (ILAE 2014)', valor: 'Duas crises não provocadas separadas por mais de 24 h, **ou** uma crise não provocada com risco de recorrência ≥ 60% em 10 anos, **ou** diagnóstico de síndrome epiléptica', nivel: alto ? 'alerta' : 'neutro' },
      ],
      conduta: [
        'Após uma **primeira crise não provocada com investigação normal**, o risco de recorrência em 2 anos é de cerca de 30–40%. Nesse cenário, o tratamento antiepiléptico reduz o risco a curto prazo, mas **não altera o prognóstico de longo prazo** nem a chance de remissão — a decisão pode legitimamente ser de observar.',
        'O risco sobe para **60–70%** e justifica iniciar tratamento quando há **eletroencefalograma com atividade epileptiforme**, **lesão estrutural na neuroimagem**, **crise noturna** ou **exame neurológico alterado**. Com dois desses fatores, a probabilidade de recorrência já se aproxima da definição operacional de epilepsia.',
        'Lembre da definição vigente de **epilepsia**: duas crises não provocadas separadas por mais de 24 h, **ou uma crise com risco de recorrência ≥ 60%**, **ou** um diagnóstico de síndrome epiléptica. Isso significa que um paciente com uma única crise e lesão estrutural já tem epilepsia e deve ser tratado.',
        'Separe **crise provocada** de não provocada, porque a conduta é inteiramente diferente: hipoglicemia, hiponatremia, abstinência alcoólica, intoxicação, eclâmpsia, infecção do sistema nervoso e trauma agudo produzem crises sintomáticas agudas, que se tratam corrigindo a causa e não indicam antiepiléptico de longo prazo.',
        'Complete a investigação mínima e oriente: **eletroencefalograma** (preferencialmente em até 24–48 h, quando o rendimento é maior; se normal, considere registro com privação de sono), **ressonância de crânio com protocolo para epilepsia** (superior à tomografia), e exames metabólicos. Informe o paciente sobre **restrição de direção** conforme a legislação local, e sobre precauções com natação, altura e máquinas — essa orientação é parte obrigatória da conduta e é frequentemente omitida.',
      ],
      alertas: [
        'Crise **provocada** — hipoglicemia, hiponatremia, abstinência alcoólica, intoxicação, eclâmpsia, infecção do sistema nervoso — não entra nesse cálculo: trata-se corrigindo a causa, e não indica antiepiléptico de longo prazo.',
        'Orientar sobre restrição de direção, natação, altura e máquinas é parte obrigatória da conduta após a primeira crise, e é sistematicamente omitido.',
      ],
      interpretacao: [
        alto
          ? 'Com risco estimado acima de 60%, a definição da Liga Internacional contra a Epilepsia permite **diagnosticar epilepsia já na primeira crise**, e o tratamento antiepiléptico está indicado.'
          : 'Sem fatores de alto risco, o risco de recorrência gira em torno de 30 a 40% em 2 anos. Iniciar antiepiléptico reduz o risco de recorrência precoce, mas **não altera o prognóstico de remissão a longo prazo** — a decisão é compartilhada, pesando ocupação, direção de veículos, gestação planejada e preferência do paciente.',
        '**Primeiro exclua crise provocada**, que não é epilepsia e tem outro tratamento: hipoglicemia, hiponatremia, hipocalcemia, abstinência de álcool ou benzodiazepínico, intoxicação, eclâmpsia, infecção do sistema nervoso central, traumatismo agudo, encefalopatia hipertensiva posterior reversível.',
        'A investigação mínima inclui eletroencefalograma (preferencialmente nas primeiras 24 a 48 horas, quando o rendimento é maior), neuroimagem — ressonância magnética com protocolo de epilepsia é superior à tomografia — e exames metabólicos.',
        'Orientações práticas independem da decisão medicamentosa: restrição de direção conforme a legislação, evitar altura e natação desacompanhada, higiene do sono e moderação com álcool.',
      ],
    }
  },
  formula: ['Risco basal 30–40% em 2 anos; ≥ 60% com lesão estrutural ou EEG epileptiforme'],
  fundamento:
    'A decisão de tratar após a primeira crise repousa sobre uma comparação: o risco de recorrência contra o risco e o custo do tratamento. Os estudos FIRST e MESS mostraram que o antiepiléptico reduz recorrência precoce sem alterar a chance de remissão em 5 anos — de modo que a pergunta é menos "vai ter outra crise?" e mais "quanto custaria a esta pessoa ter outra crise agora?".',
  armadilhas: [
    'Síncope convulsiva é confundida com crise epiléptica com frequência. Pródromos, palidez, duração de segundos, recuperação rápida sem confusão e contexto (ortostase, dor, calor) apontam síncope.',
    'Crise não provocada com histórico de mioclonias matinais em adolescente sugere epilepsia mioclônica juvenil, uma síndrome definida — e nesse caso o diagnóstico se faz de imediato.',
  ],
  referencias: [
    { texto: 'Fisher RS, Acevedo C, Arzimanoglou A, et al. ILAE official report: a practical clinical definition of epilepsy. Epilepsia. 2014;55(4):475-482.' },
    { texto: 'Krumholz A, Wiebe S, Gronseth GS, et al. Evidence-based guideline: management of an unprovoked first seizure in adults. Neurology. 2015;84(16):1705-1713.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  glasgow,
  nihss,
  abcd2,
  ich,
  huntHess,
  rankin,
  aspects,
  rass,
  camIcu,
  ramsay,
  ppc,
  mrcForca,
  cefaleias,
  conversorAntiepileptico,
  riscoConvulsao,
]

export default ferramentas

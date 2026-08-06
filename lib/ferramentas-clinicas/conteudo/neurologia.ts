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
    campoSimNao('a', 'Idade ≥ 60 anos', 1),
    campoSimNao('b', 'PA ≥ 140/90 mmHg na avaliação inicial', 1),
    campoOpc('c', 'Características clínicas', [
      { valor: '2', rotulo: 'Fraqueza unilateral', pontos: 2 },
      { valor: '1', rotulo: 'Distúrbio de fala sem fraqueza', pontos: 1 },
      { valor: '0', rotulo: 'Outros sintomas', pontos: 0 },
    ]),
    campoOpc('d', 'Duração dos sintomas', [
      { valor: '2', rotulo: '≥ 60 minutos', pontos: 2 },
      { valor: '1', rotulo: '10 a 59 minutos', pontos: 1 },
      { valor: '0', rotulo: '< 10 minutos', pontos: 0 },
    ]),
    campoSimNao('d2', 'Diabetes mellitus', 1),
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
      ],
    }
  },
  formula: ['A (idade ≥ 60) 1 + B (PA ≥ 140/90) 1 + C (clínica) 0–2 + D (duração) 0–2 + D (diabetes) 1'],
  fundamento:
    'O escore foi derivado da união de duas coortes britânicas e traduz o que a fisiopatologia sugere: sintomas motores e duração longa indicam território arterial maior e mecanismo mais provavelmente ateroembólico; idade, hipertensão e diabetes indicam carga aterosclerótica. É um marcador de substrato, não de gatilho.',
  armadilhas: [
    'Escore baixo com estenose carotídea crítica ou fibrilação atrial não é baixo risco. O ABCD² não vê o mecanismo.',
    'Discriminação apenas moderada em validações externas, com desempenho pior nas mãos de não neurologistas — parte dos "ataques transitórios" avaliados são, na verdade, enxaqueca, crise epiléptica ou síncope.',
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
    ]),
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
      ],
    }
  },
  formula: ['Escala ordinal de 0 (sem sintomas) a 6 (óbito)'],
  fundamento:
    'Rankin propôs a escala original em 1957, com cinco graus; a versão modificada, do grupo de Oxford, acrescentou o grau 0 e refinou as definições. Sua persistência por décadas se explica por medir função global — e não domínio específico —, o que a torna comparável entre estudos, entre países e entre tipos de AVC.',
  armadilhas: [
    'Aplicada de memória, sem entrevista estruturada, produz variabilidade grande, sobretudo entre os graus 2, 3 e 4.',
    'Não distingue causa da incapacidade: comorbidade ortopédica ou demência prévia elevam a pontuação sem relação com o AVC. Registre sempre o mRS **prévio**.',
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
    ]),
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
      ],
    }
  },
  formula: ['Escala ordinal de −5 (não desperta) a +4 (combativo)'],
  fundamento:
    'A RASS foi validada num processo de três etapas com equipes multiprofissionais e é a escala de sedação com melhor confiabilidade entre observadores. Sua estrutura é lógica: primeiro observa-se o paciente, depois estimula-se verbalmente, e só então fisicamente — cada etapa determina uma faixa da escala, o que torna a aplicação rápida e reprodutível.',
  armadilhas: [
    'Aplicada sem a sequência padronizada (observar, chamar, tocar), a escala perde reprodutibilidade.',
    'RASS não substitui avaliação de dor. Use escala numérica em paciente comunicativo e escala comportamental (BPS ou CPOT) em paciente sem comunicação.',
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
      interpretacao: [
        positivo
          ? '**Delirium presente.** Ele é subdiagnosticado justamente porque a forma **hipoativa** — a mais comum e a de pior prognóstico — se confunde com "paciente tranquilo". O delirium associa-se independentemente a mortalidade maior, internação mais longa e declínio cognitivo persistente.'
          : 'CAM-ICU negativo neste momento. Delirium flutua: reavalie ao menos uma vez por turno.',
        '**Tratamento é sobretudo não farmacológico:** identificar e tratar a causa (infecção, dor, hipóxia, distúrbio metabólico, abstinência, retenção urinária, constipação), reorientar, restaurar o ciclo sono-vigília, mobilizar precocemente, devolver óculos e aparelho auditivo, envolver a família e retirar o que puder ser retirado — sonda, cateter, contenção.',
        '**Revise a lista de medicamentos.** Benzodiazepínicos, anticolinérgicos, opioides em excesso e corticoides são os principais precipitantes farmacológicos.',
        'Antipsicóticos **não** reduzem duração nem mortalidade do delirium — o ensaio MIND-USA mostrou isso com haloperidol e ziprasidona. Reserve-os para agitação com risco à segurança, na menor dose e pelo menor tempo. Em abstinência alcoólica, o tratamento é benzodiazepínico, e a lógica se inverte.',
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
    ]),
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
      ],
    }
  },
  formula: ['Escala ordinal de 1 (agitado) a 6 (sem resposta)'],
  fundamento:
    'Ramsay e colaboradores propuseram a escala num estudo sobre alfaxalona, com o objetivo prático de titular sedação. Sua limitação estrutural é que o nível 1 agrupa toda a agitação num único degrau, o que a torna cega para a diferença entre inquietação e combatividade.',
  armadilhas: ['Não usa estímulo padronizado nem sequência definida, o que reduz a concordância entre observadores.'],
  referencias: [
    { texto: 'Ramsay MA, Savege TM, Simpson BR, Goodwin R. Controlled sedation with alphaxalone-alphadolone. Br Med J. 1974;2(5920):656-659.' },
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
    campoNum('pas', 'PA sistólica', { unidade: 'mmHg', min: 50, max: 260, passo: 1 }),
    campoNum('pad', 'PA diastólica', { unidade: 'mmHg', min: 20, max: 160, passo: 1 }),
    campoNum('pic', 'Pressão intracraniana', { unidade: 'mmHg', min: 0, max: 80, passo: 1, normalMin: 5, normalMax: 15 }),
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
      ],
    }
  },
  formula: ['PPC = PAM − PIC', 'PAM = (PAS + 2 × PAD) / 3'],
  fundamento:
    'O fluxo sanguíneo cerebral é autorregulado entre PAMs de aproximadamente 50 e 150 mmHg em pessoas normotensas, por vasodilatação e vasoconstrição arteriolar. Na lesão cerebral aguda essa autorregulação frequentemente se perde, e o fluxo passa a depender linearmente da pressão de perfusão — é aí que a PPC deixa de ser um número fisiológico e vira alvo terapêutico.',
  armadilhas: [
    'Zere o transdutor de pressão arterial no nível do **meato acústico externo** (forame de Monro), não no átrio direito, quando o objetivo for PPC. A diferença de altura entre os dois pontos gera erro de vários mmHg.',
    'PIC estimada por ultrassom da bainha do nervo óptico ou por Doppler transcraniano é útil para triagem, mas não substitui a medida invasiva quando a decisão depende do valor.',
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

import type { DoencaZoom } from '../tipos'

/** Sistema nervoso central. */
export const DOENCAS_NERVOSO: DoencaZoom[] = [
  {
    id: 'doenca-de-alzheimer',
    nome: 'Doença de Alzheimer',
    sinonimos: ['Alzheimer', 'demência de Alzheimer', 'demência senil do tipo Alzheimer'],
    nomesEmIngles: ["Alzheimer's disease"],
    sistema: 'nervoso',
    orgao: 'cortex-cerebral',
    prioridade: 1,
    resumo:
      'Doença neurodegenerativa, causa mais comum de demência, definida por dois depósitos de proteína no cérebro: placas neuríticas (β-amiloide extracelular) e emaranhados neurofibrilares (tau intraneuronal), com perda de neurônios e sinapses que começa no hipocampo.',
    epidemiologia:
      'Responsável por 60–70 % das demências; prevalência dobra a cada 5 anos após os 65 anos. Fatores: idade, alelo APOE ε4, síndrome de Down, história familiar, baixa escolaridade, hipertensão, diabetes, sedentarismo. Formas familiares precoces (< 65 anos) por mutações em APP, PSEN1 e PSEN2.',
    patogenese: [
      'A APP é clivada de forma anômala e gera Aβ42, que se agrega em oligômeros e placas no neurópilo e na parede dos vasos.',
      'O amiloide tóxico lesa sinapses e desencadeia a hiperfosforilação da tau, que se desprende dos microtúbulos e forma emaranhados dentro dos neurônios.',
      'A tau se propaga numa ordem fixa: córtex entorrinal → hipocampo (memória recente) → neocórtex associativo (linguagem, praxia, função executiva) — estágios de Braak.',
      'Neurônios e sinapses morrem, sobretudo os colinérgicos (núcleo basal de Meynert): atrofia cortical com sulcos alargados, dilatação dos ventrículos e hipocampo atrófico.',
    ],
    roteiro: [
      'Panorâmico: hipocampo e córtex entorrinal; na macroscopia, atrofia com sulcos largos e ventrículos dilatados.',
      'No H&E: perda de neurônios piramidais, gliose; emaranhados e placas são sutis — procure degeneração granulovacuolar e corpos de Hirano no hipocampo.',
      'Com imuno para tau (esta lâmina): emaranhados em "chama", placas neuríticas e fios do neurópilo; compare regiões para estimar o estágio de Braak.',
      'Imuno para β-amiloide e Congo para placas e angiopatia amiloide; exclua outras causas (corpos de Lewy, infartos, TDP-43).',
    ],
    achados: [
      {
        achado: 'emaranhados-neurofibrilares',
        tipo: 'especifico',
        comoAparece: 'Neurônios piramidais tomados por tau, em forma de chama, no hipocampo e no córtex.',
        peso: 'criterio',
      },
      {
        achado: 'placas-neuriticas',
        tipo: 'especifico',
        comoAparece: 'Placas arredondadas com coroa de neuritos distróficos no neurópilo.',
        peso: 'criterio',
      },
      {
        achado: 'fios-do-neuropilo',
        tipo: 'geral',
        comoAparece: 'Inúmeros filamentos de tau no neurópilo.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Demência com corpos de Lewy',
        comoSeparar: 'Corpos de Lewy (α-sinucleína) no córtex e no tronco; clínica com flutuação, alucinações visuais e parkinsonismo. Pode coexistir com Alzheimer.',
      },
      {
        nome: 'Demência vascular',
        comoSeparar: 'Infartos múltiplos, lacunas e doença de pequenos vasos, sem a carga de placas e emaranhados.',
      },
      {
        nome: 'Degeneração lobar frontotemporal',
        comoSeparar: 'Atrofia frontal e temporal anterior; inclusões de TDP-43 ou tau de outro tipo (corpos de Pick), sem placas amiloides.',
      },
    ],
    correlacaoClinica: [
      'Perda progressiva de memória recente, depois linguagem, orientação, praxia e função executiva; alterações de comportamento nas fases avançadas.',
      'Diagnóstico clínico, com apoio de RM (atrofia hipocampal), PET amiloide/tau e biomarcadores no líquor ou no sangue (Aβ42 baixo, p-tau alta). A confirmação definitiva é neuropatológica.',
      'Tratamento: inibidores da colinesterase (donepezila, rivastigmina, galantamina), memantina; anticorpos anti-amiloide (lecanemabe, donanemabe) nas fases iniciais.',
    ],
    comparacaoComNormal: [
      'No córtex normal, os neurônios piramidais têm citoplasma claro com substância de Nissl, e o neurópilo entre eles é homogêneo — a imuno para tau quase não marca nada.',
      'No Alzheimer, muitos neurônios ficam pretos de tau (emaranhados), o neurópilo se enche de fios e surgem placas arredondadas de neuritos.',
    ],
  },
]

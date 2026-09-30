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
  {
    id: 'meningioma',
    nome: 'Meningioma',
    sinonimos: ['meningioma meningotelial', 'meningioma transicional'],
    nomesEmIngles: ['meningioma'],
    sistema: 'nervoso',
    orgao: 'cortex-cerebral',
    prioridade: 2,
    resumo:
      'Tumor das células aracnoides das meninges, extra-axial e geralmente benigno (grau 1 da OMS), formado por lóbulos de células meningoteliais com redemoinhos e corpos psamomatosos.',
    epidemiologia: 'Tumor intracraniano primário mais comum do adulto (cerca de 35 %); mulheres de meia-idade (2:1), relação com receptores de progesterona. Fatores: radiação craniana, neurofibromatose tipo 2.',
    patogenese: [
      'Perda do gene NF2 (cromossomo 22q) na maioria; outros com mutações de TRAF7, AKT1, KLF4, SMO.',
      'As células aracnoides proliferam aderidas à dura-máter, formando massa que comprime (sem invadir) o cérebro.',
      'Graus 2 e 3 (atípico, anaplásico) têm mais mitoses, invasão cerebral e recidivam.',
    ],
    roteiro: [
      'Panorâmico: tumor lobulado, bem delimitado, aderido à dura.',
      'Médio aumento: lóbulos de células sinciciais com redemoinhos; corpos psamomatosos.',
      'Grande aumento: núcleos ovais uniformes, pseudoinclusões; conte mitoses e procure invasão cerebral (graduação).',
    ],
    achados: [
      {
        achado: 'espirais-meningoteliais',
        tipo: 'especifico',
        comoAparece: 'Lóbulos e redemoinhos de células meningoteliais.',
        peso: 'criterio',
      },
      {
        achado: 'corpos-psamomatosos',
        tipo: 'geral',
        comoAparece: 'Calcificações lamelares, muitas vezes no centro dos redemoinhos.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Schwannoma',
        comoSeparar: 'Áreas Antoni A e B, corpos de Verocay; S100 e SOX10 difusos.',
      },
      {
        nome: 'Tumor fibroso solitário',
        comoSeparar: 'Células fusiformes em padrão aleatório com vasos "em chifre de veado"; STAT6 nuclear.',
      },
    ],
    correlacaoClinica: [
      'Muitas vezes assintomático; sintomas por compressão: cefaleia, crises convulsivas, déficits focais, alterações visuais (tumores selares).',
      'RM: massa extra-axial com realce homogêneo e "cauda dural". Tratamento: observação, cirurgia ou radiocirurgia.',
    ],
    comparacaoComNormal: [
      'Nas meninges normais, a aracnoide tem poucas camadas de células achatadas; no córtex, neurônios e glia em neurópilo.',
      'O meningioma forma uma massa de células meningoteliais em redemoinhos que empurra o córtex, sem se misturar ao tecido nervoso.',
    ],
  },
]

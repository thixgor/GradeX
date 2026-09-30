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
  {
    id: 'avc-isquemico',
    nome: 'AVC isquêmico (infarto cerebral)',
    sinonimos: ['acidente vascular cerebral isquêmico', 'infarto cerebral', 'derrame isquêmico', 'AVCi'],
    nomesEmIngles: ['ischaemic stroke', 'cerebral infarction'],
    sistema: 'nervoso',
    orgao: 'cortex-cerebral',
    prioridade: 3,
    resumo:
      'Necrose do tecido nervoso por interrupção do fluxo arterial (trombose, embolia, dissecção): neurópilo pálido e vacuolado, neurônios vermelhos, edema, hemorragias petequiais e, depois, liquefação e cavitação.',
    epidemiologia:
      'Segunda causa de morte e principal causa de incapacidade no mundo. Fatores: hipertensão (o principal), diabetes, tabagismo, dislipidemia, fibrilação atrial, estenose carotídea, idade. Em jovens: dissecção arterial, trombofilias, forame oval patente.',
    patogenese: [
      'Oclusão arterial por aterotrombose, êmbolo cardíaco (fibrilação atrial) ou dissecção arterial — como a dissecção vertebral deste caso.',
      'No núcleo isquêmico o fluxo cai abaixo do limiar: falência energética, entrada de cálcio, excitotoxicidade e morte celular em minutos.',
      'A penumbra, ainda viável, pode ser salva por reperfusão precoce (trombólise, trombectomia).',
      'A lesão evolui: neurônios vermelhos (12–24 h), neutrófilos (1–3 dias), macrófagos espumosos (3–10 dias) e cavidade cercada de gliose (semanas).',
      'Na reperfusão de vasos lesados, o sangue extravasa: transformação hemorrágica, com petéquias ou hematoma.',
    ],
    roteiro: [
      'Panorâmico: identifique a área pálida e o salpicado de hemorragias petequiais em um território arterial.',
      'Médio aumento: neurópilo rarefeito e vacuolado, vasos congestos, hemácias extravasadas.',
      'Grande aumento: procure neurônios vermelhos, neutrófilos ou macrófagos para estimar a idade do infarto.',
      'Examine os vasos: trombo, dissecção, aterosclerose ou vasculite explicam a causa.',
    ],
    achados: [
      {
        achado: 'infarto-cerebral-agudo',
        tipo: 'especifico',
        comoAparece: 'Neurópilo pálido, vacuolado e desintegrado no território infartado.',
        peso: 'criterio',
      },
      {
        achado: 'neuronios-vermelhos',
        tipo: 'especifico',
        comoAparece: 'Neurônios encolhidos e eosinofílicos após 12–24 horas.',
        peso: 'frequente',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemorragias petequiais e perivasculares (transformação hemorrágica).',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos congestos no tecido isquêmico.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'AVC hemorrágico (hematoma intracerebral)',
        comoSeparar: 'Coleção de sangue que desloca o tecido, com arteríolas hialinas ou angiopatia amiloide; o infarto hemorrágico tem sangue salpicado dentro de tecido necrótico.',
      },
      {
        nome: 'Encefalopatia hipóxico-isquêmica global',
        comoSeparar: 'Lesão difusa e seletiva (hipocampo CA1, Purkinje, camadas corticais), não restrita a um território arterial.',
      },
      {
        nome: 'Encefalite e tumor',
        comoSeparar: 'Infiltrado inflamatório perivascular ou células neoplásicas; clínica subaguda.',
      },
    ],
    correlacaoClinica: [
      'Déficit neurológico focal súbito (hemiparesia, afasia, disartria, desvio de rima; no tronco: vertigem, ataxia, diplopia, síndromes cruzadas).',
      'TC sem contraste exclui hemorragia; trombólise até 4,5 h e trombectomia em oclusões de grandes vasos (até 24 h em casos selecionados).',
      'Prevenção secundária: antiagregação ou anticoagulação (fibrilação atrial), estatina, controle da pressão, do diabetes e do tabagismo.',
    ],
    comparacaoComNormal: [
      'No tecido nervoso normal, o neurópilo é róseo e homogêneo, com neurônios de núcleo claro e nucléolo, e vasos sem sangue extravasado.',
      'No infarto, o neurópilo fica pálido e esburacado, os neurônios morrem e o sangue escapa dos vasos em pequenos focos.',
    ],
  },
  {
    id: 'meningite-bacteriana',
    nome: 'Meningite bacteriana aguda',
    sinonimos: ['meningite purulenta', 'leptomeningite aguda', 'meningite meningocócica', 'meningite pneumocócica'],
    nomesEmIngles: ['acute bacterial meningitis'],
    sistema: 'nervoso',
    orgao: 'cortex-cerebral',
    prioridade: 4,
    resumo:
      'Inflamação aguda das leptomeninges (pia-máter e aracnoide) por bactérias: o espaço subaracnóideo se enche de exsudato inflamatório, principalmente nos sulcos e em torno dos vasos, com o córtex subjacente relativamente preservado.',
    epidemiologia:
      'Agentes conforme a idade: neonatos — Streptococcus agalactiae, E. coli, Listeria; crianças e adultos — pneumococo e meningococo (Haemophilus b caiu com a vacina); idosos e imunodeprimidos — pneumococo e Listeria. Letalidade alta sem tratamento imediato.',
    patogenese: [
      'Colonização da nasofaringe, bacteremia e travessia da barreira hematoencefálica (ou extensão de otite, sinusite, fratura de base de crânio).',
      'No líquor, pobre em complemento e anticorpos, as bactérias se multiplicam livremente.',
      'Componentes bacterianos ativam micróglia e endotélio: neutrófilos invadem o espaço subaracnóideo, formando o exsudato purulento.',
      'A inflamação causa edema cerebral, vasculite e trombose de vasos (infartos), bloqueio da reabsorção do líquor (hidrocefalia) e lesão de nervos cranianos.',
    ],
    roteiro: [
      'Panorâmico: sulcos e superfície do cérebro cobertos por faixas azuladas de exsudato no espaço subaracnóideo.',
      'Médio aumento: exsudato em volta dos vasos meníngeos; córtex abaixo com edema.',
      'Grande aumento: tipo de célula (neutrófilos na fase aguda; macrófagos e linfócitos depois); procure bactérias, vasculite e trombos.',
    ],
    achados: [
      {
        achado: 'exsudato-leptomeningeo',
        tipo: 'especifico',
        comoAparece: 'Espaço subaracnóideo preenchido por exsudato celular denso, sobretudo nos sulcos.',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos predominam nos primeiros dias.',
        peso: 'frequente',
      },
      {
        achado: 'hiperemia-e-congestao',
        tipo: 'geral',
        comoAparece: 'Vasos meníngeos dilatados e congestos.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Meningite tuberculosa',
        comoSeparar: 'Exsudato espesso na base do crânio com granulomas e necrose caseosa, vasculite; evolução subaguda.',
      },
      {
        nome: 'Meningite viral',
        comoSeparar: 'Infiltrado linfocitário discreto; raramente biopsiada.',
      },
      {
        nome: 'Carcinomatose ou linfoma meníngeo',
        comoSeparar: 'Células neoplásicas atípicas em vez de células inflamatórias.',
      },
    ],
    correlacaoClinica: [
      'Febre, cefaleia, rigidez de nuca e alteração do nível de consciência; petéquias e púrpura sugerem meningococo.',
      'Líquor turvo com neutrofilia, glicose baixa e proteína alta; Gram e cultura.',
      'Emergência: antibiótico empírico (ceftriaxona ± vancomicina ± ampicilina) e dexametasona, sem atrasar por exames; quimioprofilaxia dos contactantes no meningococo; vacinas.',
    ],
    comparacaoComNormal: [
      'Normalmente o espaço subaracnóideo é uma fina camada frouxa com vasos e raras células, sobre o córtex coberto pela pia-máter.',
      'Na meningite, esse espaço é inundado por células inflamatórias que enchem os sulcos e envolvem os vasos.',
    ],
  },
]

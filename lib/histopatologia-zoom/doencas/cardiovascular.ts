import type { DoencaZoom } from '../tipos'

/** Coração e vasos. */
export const DOENCAS_CARDIOVASCULAR: DoencaZoom[] = [
  {
    id: 'infarto-do-miocardio',
    nome: 'Infarto do miocárdio',
    sinonimos: ['infarto agudo do miocárdio', 'IAM', 'necrose miocárdica isquêmica', 'infarto cicatrizado'],
    nomesEmIngles: ['myocardial infarction', 'old myocardial infarct'],
    sistema: 'cardiovascular',
    orgao: 'coracao',
    prioridade: 1,
    resumo:
      'Necrose coagulativa do miocárdio por isquemia prolongada, quase sempre por trombo sobre placa aterosclerótica rota; a lâmina muda com o tempo — neutrófilos nos primeiros dias, tecido de granulação na segunda semana e cicatriz colágena após 6–8 semanas.',
    epidemiologia:
      'Principal causa de morte no Brasil e no mundo. Fatores de risco: idade, sexo masculino, tabagismo, hipertensão, diabetes, dislipidemia, obesidade e história familiar.',
    patogenese: [
      'Uma placa aterosclerótica coronariana sofre ruptura ou erosão; o colágeno e o fator tecidual expostos ativam plaquetas e coagulação, formando um trombo oclusivo.',
      'Sem fluxo, o miócito passa à glicólise anaeróbia: em segundos perde contratilidade; em 20–40 minutos, a lesão fica irreversível.',
      'A necrose avança do subendocárdio (mais distante das coronárias epicárdicas) para o epicárdio em 3–6 horas — é a janela para reperfundir.',
      '0–24 h: fibras onduladas e hipereosinofílicas; 1–3 dias: necrose coagulativa com perda de núcleos e neutrófilos na borda; 3–7 dias: macrófagos removem os miócitos mortos (fase mais frágil, risco de ruptura).',
      '1–2 semanas: tecido de granulação; 2–8 semanas: deposição de colágeno; após 2 meses: cicatriz densa e pobre em células.',
    ],
    roteiro: [
      'Panorâmico: procure áreas de cor diferente no miocárdio — faixas arroxeadas (inflamação) ou zonas pálidas e homogêneas (cicatriz).',
      'Infarto agudo: nas fibras, veja hipereosinofilia, perda das estriações e dos núcleos (necrose coagulativa) e, entre elas, neutrófilos e hemorragia.',
      'Compare com o miocárdio viável: fibras com núcleo central, estriações e sem células inflamatórias entre elas.',
      'Infarto antigo: substitua a pergunta "há neutrófilos?" por "o miocárdio foi trocado por colágeno?" — faixas de colágeno denso, rosa-pálido, com poucas células, e ilhas de miócitos presas na borda.',
      'Estime a idade da lesão pelo tipo de célula e de matriz presentes: isso é o que o legista e o patologista fazem na prática.',
    ],
    achados: [
      {
        achado: 'necrose-coagulativa',
        tipo: 'especifico',
        comoAparece: 'Fibras hipereosinofílicas, sem núcleos ou com núcleos picnóticos e fragmentados, com a silhueta preservada (infarto de 1–3 dias).',
        peso: 'criterio',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos entre as fibras necróticas, mais densos na borda do infarto (pico em 1–3 dias).',
        peso: 'frequente',
      },
      {
        achado: 'hemorragia-intersticial',
        tipo: 'geral',
        comoAparece: 'Hemácias dissecando o interstício, sobretudo em infartos reperfundidos.',
        peso: 'ocasional',
      },
      {
        achado: 'tecido-de-granulacao',
        tipo: 'geral',
        comoAparece: 'Capilares novos, fibroblastos e macrófagos substituindo o músculo necrótico (1–2 semanas).',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'especifico',
        comoAparece: 'Colágeno denso e pobre em células no lugar do miocárdio (infarto antigo, após 6–8 semanas).',
        peso: 'criterio',
      },
    ],
    diferenciais: [
      {
        nome: 'Miocardite',
        comoSeparar: 'Infiltrado predominantemente linfocitário, multifocal, com necrose de miócitos isolados — não uma área de necrose em bloco num território coronariano.',
      },
      {
        nome: 'Necrose em bandas de contração (reperfusão, catecolaminas)',
        comoSeparar: 'Faixas transversais hipereosinofílicas nas fibras, por influxo de cálcio; aparecem na borda de infartos reperfundidos e após catecolaminas em excesso.',
      },
      {
        nome: 'Fibrose de cardiomiopatia',
        comoSeparar: 'Fibrose intersticial difusa, sem distribuição de território coronariano e sem cicatriz transmural em bloco.',
      },
    ],
    correlacaoClinica: [
      'Dor torácica em aperto, prolongada, com irradiação; supradesnivelamento de ST no ECG; troponina elevada (liberada pela membrana rota das fibras necróticas).',
      'Tempo é músculo: reperfusão (angioplastia ou trombólise) nas primeiras horas limita a extensão da necrose.',
      'Complicações seguem o calendário histológico: arritmias nas primeiras horas; ruptura de parede, septo ou músculo papilar entre 3 e 7 dias (fase de macrófagos, tecido amolecido); aneurisma ventricular e insuficiência cardíaca com a cicatriz.',
    ],
    comparacaoComNormal: [
      'No miocárdio normal, as fibras são rosa, ramificadas, com um núcleo central, estriações e discos intercalares, e quase não há células entre elas.',
      'No infarto agudo, as fibras ficam mais vermelhas e sem núcleo, e os espaços entre elas se enchem de neutrófilos e hemácias.',
      'No infarto antigo, no lugar das fibras há colágeno — rosa-pálido, sem estriações e com poucos núcleos finos.',
    ],
  },
]

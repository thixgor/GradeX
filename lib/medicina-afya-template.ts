import { CronogramaTemplate } from './cronograma-types'

export const MEDICINA_AFYA_TEMPLATE: CronogramaTemplate = {
  id: 'medicina-afya',
  nome: 'Medicina AFYA',
  modelo: 'medicina-afya',
  descricao: 'Prepare-se para medicina com cronograma AFYA (SOI I-V)',
  topicos: [
    // SOI I
    {
      id: 'med-soi1',
      nome: 'SOI I - Bases Moleculares, Cardio, Hemo, Respiratório e Digestório',
      incluido: false,
      subtopicos: [
        {
          id: 'med-soi1-bases',
          nome: 'Bases Moleculares e Celulares',
          incluido: false,
          modulos: [
            { id: 'med-soi1-bases-membrana', nome: 'Membrana plasmática e transporte', horasEstimadas: 40, incluido: false },
            { id: 'med-soi1-bases-potencial', nome: 'Potenciais de ação e transmissão sináptica', horasEstimadas: 40, incluido: false },
            { id: 'med-soi1-bases-ciclo', nome: 'Ciclo celular e morte celular', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi1-cardio',
          nome: 'Sistema Cardiocirculatório',
          incluido: false,
          modulos: [
            { id: 'med-soi1-cardio-anatomia', nome: 'Anatomia macro e microscópica do coração e vasos', horasEstimadas: 54, incluido: false },
            { id: 'med-soi1-cardio-fisiologia', nome: 'Fisiologia da contração cardíaca', horasEstimadas: 46, incluido: false },
            { id: 'med-soi1-cardio-ciclo', nome: 'Ciclo cardíaco e hemodinâmica', horasEstimadas: 52, incluido: false },
            { id: 'med-soi1-cardio-eletro', nome: 'Eletrofisiologia cardíaca básica', horasEstimadas: 14, incluido: false }
          ]
        },
        {
          id: 'med-soi1-hemo',
          nome: 'Sistema Linfo-Hematopoiético e Imunológico',
          incluido: false,
          modulos: [
            { id: 'med-soi1-hemo-hematopoiese', nome: 'Hematopoiese', horasEstimadas: 32, incluido: false },
            { id: 'med-soi1-hemo-eritrocitos', nome: 'Eritrócitos e hemoglobina', horasEstimadas: 34, incluido: false },
            { id: 'med-soi1-hemo-leucocitos', nome: 'Leucócitos e imunidade inata', horasEstimadas: 22, incluido: false },
            { id: 'med-soi1-hemo-imunidade', nome: 'Imunidade adaptativa (básico)', horasEstimadas: 34, incluido: false },
            { id: 'med-soi1-hemo-histologia', nome: 'Histologia dos órgãos linfoides', horasEstimadas: 12, incluido: false }
          ]
        },
        {
          id: 'med-soi1-resp',
          nome: 'Sistema Respiratório',
          incluido: false,
          modulos: [
            { id: 'med-soi1-resp-anatomia', nome: 'Anatomia das vias aéreas e pulmão', horasEstimadas: 28, incluido: false },
            { id: 'med-soi1-resp-mecanica', nome: 'Mecânica ventilatória', horasEstimadas: 32, incluido: false },
            { id: 'med-soi1-resp-trocas', nome: 'Trocas gasosas', horasEstimadas: 30, incluido: false },
            { id: 'med-soi1-resp-controle', nome: 'Controle da respiração', horasEstimadas: 10, incluido: false }
          ]
        },
        {
          id: 'med-soi1-dig',
          nome: 'Sistema Digestório',
          incluido: false,
          modulos: [
            { id: 'med-soi1-dig-parede', nome: 'Parede do tubo digestivo e glândulas anexas', horasEstimadas: 34, incluido: false },
            { id: 'med-soi1-dig-digestao', nome: 'Digestão e absorção de macronutrientes', horasEstimadas: 42, incluido: false },
            { id: 'med-soi1-dig-regulacao', nome: 'Regulação hormonal do sistema digestivo', horasEstimadas: 22, incluido: false },
            { id: 'med-soi1-dig-hepaticas', nome: 'Funções hepáticas', horasEstimadas: 22, incluido: false }
          ]
        },
        {
          id: 'med-soi1-integracao',
          nome: 'Integração Morfofuncional e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi1-int-correlacao', nome: 'Correlação estrutura-função em situações patológicas frequentes', horasEstimadas: 44, incluido: false }
          ]
        }
      ]
    },
    // SOI II
    {
      id: 'med-soi2',
      nome: 'SOI II - Sistema Nervoso, Osteomuscular, Endócrino, Reprodutor, Urinário',
      incluido: false,
      subtopicos: [
        {
          id: 'med-soi2-nervoso',
          nome: 'Sistema Nervoso',
          incluido: false,
          modulos: [
            { id: 'med-soi2-nervoso-organizacao', nome: 'Organização geral e neurohistologia', horasEstimadas: 40, incluido: false },
            { id: 'med-soi2-nervoso-neurofisiologia', nome: 'Neurofisiologia celular', horasEstimadas: 40, incluido: false },
            { id: 'med-soi2-nervoso-medula', nome: 'Medula espinal e nervos espinais', horasEstimadas: 30, incluido: false },
            { id: 'med-soi2-nervoso-tronco', nome: 'Tronco encefálico e nervos cranianos', horasEstimadas: 20, incluido: false },
            { id: 'med-soi2-nervoso-cerebelo', nome: 'Cerebelo', horasEstimadas: 15, incluido: false },
            { id: 'med-soi2-nervoso-diencefalo', nome: 'Diencéfalo', horasEstimadas: 20, incluido: false },
            { id: 'med-soi2-nervoso-telencefalo', nome: 'Telencéfalo', horasEstimadas: 30, incluido: false },
            { id: 'med-soi2-nervoso-autonomo', nome: 'Sistema nervoso autônomo', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi2-osteomuscular',
          nome: 'Sistema Osteomuscular',
          incluido: false,
          modulos: [
            { id: 'med-soi2-osteomuscular-tecido', nome: 'Tecido ósseo e cartilaginoso', horasEstimadas: 30, incluido: false },
            { id: 'med-soi2-osteomuscular-musculo', nome: 'Músculo esquelético', horasEstimadas: 40, incluido: false },
            { id: 'med-soi2-osteomuscular-fisiologia', nome: 'Fisiologia da contração muscular', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-osteomuscular-articulacoes', nome: 'Articulações e biomecânica básica', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi2-endocrino',
          nome: 'Sistema Endócrino',
          incluido: false,
          modulos: [
            { id: 'med-soi2-endocrino-conceitos', nome: 'Conceitos gerais e eixo hipotálamo-hipófise', horasEstimadas: 30, incluido: false },
            { id: 'med-soi2-endocrino-tireoide', nome: 'Tireoide', horasEstimadas: 20, incluido: false },
            { id: 'med-soi2-endocrino-suprarrenal', nome: 'Suprarrenal', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-endocrino-pancreas', nome: 'Pâncreas endócrino', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-endocrino-calcio', nome: 'Metabolismo do cálcio e fósforo', horasEstimadas: 15, incluido: false },
            { id: 'med-soi2-endocrino-sexuais', nome: 'Hormônios sexuais e eixo hipotálamo-hipófise-gonadal', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi2-reprodutor',
          nome: 'Sistema Reprodutor',
          incluido: false,
          modulos: [
            { id: 'med-soi2-reprodutor-gametogenese', nome: 'Gametogênese e diferenciação sexual', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-reprodutor-masculino', nome: 'Sistema reprodutor masculino', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-reprodutor-feminino', nome: 'Sistema reprodutor feminino', horasEstimadas: 35, incluido: false },
            { id: 'med-soi2-reprodutor-fertilizacao', nome: 'Fertilização, implantação e placentação', horasEstimadas: 20, incluido: false },
            { id: 'med-soi2-reprodutor-puberdade', nome: 'Puberdade e menopausa (básico)', horasEstimadas: 15, incluido: false }
          ]
        },
        {
          id: 'med-soi2-urinario',
          nome: 'Sistema Urinário',
          incluido: false,
          modulos: [
            { id: 'med-soi2-urinario-anatomia', nome: 'Anatomia macro e microscópica do rim e vias urinárias', horasEstimadas: 30, incluido: false },
            { id: 'med-soi2-urinario-filtracao', nome: 'Filtração glomerular', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-urinario-reabsorcao', nome: 'Reabsorção e secreção tubular', horasEstimadas: 40, incluido: false },
            { id: 'med-soi2-urinario-acidobase', nome: 'Equilíbrio ácido-base', horasEstimadas: 25, incluido: false },
            { id: 'med-soi2-urinario-controle', nome: 'Controle do volume extracelular e pressão arterial', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi2-integracao',
          nome: 'Integração Morfofuncional e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi2-int-correlacao', nome: 'Correlação estrutura-função em agravos prevalentes', horasEstimadas: 60, incluido: false }
          ]
        }
      ]
    },
    // SOI III
    {
      id: 'med-soi3',
      nome: 'SOI III - Fisiopatologia: Cardio, Respiratório, Hemolinfopoiético, Tegumentar',
      incluido: false,
      subtopicos: [
        {
          id: 'med-soi3-conceitos',
          nome: 'Conceitos Gerais de Fisiopatologia e Imunologia Aplicada',
          incluido: false,
          modulos: [
            { id: 'med-soi3-conceitos-inflamacao', nome: 'Resposta inflamatória aguda e crônica', horasEstimadas: 40, incluido: false },
            { id: 'med-soi3-conceitos-cicatrizacao', nome: 'Cicatrização e reparo tecidual', horasEstimadas: 20, incluido: false },
            { id: 'med-soi3-conceitos-edema', nome: 'Edema e choque', horasEstimadas: 30, incluido: false },
            { id: 'med-soi3-conceitos-farmacologia', nome: 'Farmacologia geral aplicada', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi3-cardio',
          nome: 'Sistema Cardiocirculatório - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi3-cardio-ic', nome: 'Insuficiência cardíaca', horasEstimadas: 40, incluido: false },
            { id: 'med-soi3-cardio-isquemica', nome: 'Doença isquêmica do miocárdio', horasEstimadas: 45, incluido: false },
            { id: 'med-soi3-cardio-arritmias', nome: 'Arritmias cardíacas', horasEstimadas: 35, incluido: false },
            { id: 'med-soi3-cardio-has', nome: 'Hipertensão arterial sistêmica', horasEstimadas: 30, incluido: false },
            { id: 'med-soi3-cardio-valvulares', nome: 'Doenças valvulares e endocardite', horasEstimadas: 25, incluido: false },
            { id: 'med-soi3-cardio-tromboembolismo', nome: 'Tromboembolismo venoso e embolia pulmonar', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi3-resp',
          nome: 'Sistema Respiratório - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi3-resp-obstrutivas', nome: 'Doenças obstrutivas', horasEstimadas: 40, incluido: false },
            { id: 'med-soi3-resp-restritivas', nome: 'Doenças restritivas e intersticiais', horasEstimadas: 25, incluido: false },
            { id: 'med-soi3-resp-insuficiencia', nome: 'Insuficiência respiratória e hipoxemia', horasEstimadas: 30, incluido: false },
            { id: 'med-soi3-resp-pneumonias', nome: 'Pneumonias (comunitária, hospitalar, aspirativa)', horasEstimadas: 25, incluido: false },
            { id: 'med-soi3-resp-tep', nome: 'Tromboembolismo pulmonar e hipertensão pulmonar', horasEstimadas: 25, incluido: false },
            { id: 'med-soi3-resp-pleural', nome: 'Derrame pleural e pneumotórax', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi3-hemo',
          nome: 'Sistema Hemolinfopoiético - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi3-hemo-anemias', nome: 'Anemias', horasEstimadas: 45, incluido: false },
            { id: 'med-soi3-hemo-leucopenias', nome: 'Leucopenias e leucocitoses', horasEstimadas: 20, incluido: false },
            { id: 'med-soi3-hemo-sindromes', nome: 'Síndromes mieloproliferativas e linfoproliferativas', horasEstimadas: 40, incluido: false },
            { id: 'med-soi3-hemo-hemostasia', nome: 'Distúrbios hemostáticos', horasEstimadas: 40, incluido: false },
            { id: 'med-soi3-hemo-transfusao', nome: 'Transfusão e reações transfusionais', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi3-tegumentar',
          nome: 'Sistema Tegumentar - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi3-tegumentar-dermatoses', nome: 'Dermatoses inflamatórias e alérgicas', horasEstimadas: 30, incluido: false },
            { id: 'med-soi3-tegumentar-infeccoes', nome: 'Infecções cutâneas bacterianas, virais e fúngicas', horasEstimadas: 35, incluido: false },
            { id: 'med-soi3-tegumentar-queimaduras', nome: 'Queimaduras', horasEstimadas: 20, incluido: false },
            { id: 'med-soi3-tegumentar-ulceras', nome: 'Úlceras de pressão e pé diabético', horasEstimadas: 20, incluido: false },
            { id: 'med-soi3-tegumentar-neoplasias', nome: 'Neoplasias cutâneas', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi3-integracao',
          nome: 'Integração Clínica e Abordagem dos Principais Agravos',
          incluido: false,
          modulos: [
            { id: 'med-soi3-int-casos', nome: 'Casos clínicos transversais', horasEstimadas: 70, incluido: false }
          ]
        }
      ]
    },
    // SOI IV
    {
      id: 'med-soi4',
      nome: 'SOI IV - Endócrino, Digestório, Renal, Urogenital, Exames Complementares',
      incluido: false,
      subtopicos: [
        {
          id: 'med-soi4-conceitos',
          nome: 'Conceitos Gerais Transversais de Fisiopatologia e Farmacologia',
          incluido: false,
          modulos: [
            { id: 'med-soi4-conceitos-estresse', nome: 'Resposta ao estresse e eixo hipotálamo-hipófise-adrenal', horasEstimadas: 25, incluido: false },
            { id: 'med-soi4-conceitos-farmacologia', nome: 'Farmacologia clínica aplicada (continuação)', horasEstimadas: 35, incluido: false },
            { id: 'med-soi4-conceitos-semiologia', nome: 'Semiologia abdominal e urológica básica', horasEstimadas: 30, incluido: false }
          ]
        },
        {
          id: 'med-soi4-endocrino',
          nome: 'Sistema Endócrino - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi4-endocrino-diabetes', nome: 'Diabetes mellitus', horasEstimadas: 50, incluido: false },
            { id: 'med-soi4-endocrino-tireoide', nome: 'Doenças da tireoide', horasEstimadas: 35, incluido: false },
            { id: 'med-soi4-endocrino-suprarrenais', nome: 'Doenças das suprarrenais', horasEstimadas: 35, incluido: false },
            { id: 'med-soi4-endocrino-calcio', nome: 'Distúrbios do metabolismo do cálcio', horasEstimadas: 25, incluido: false },
            { id: 'med-soi4-endocrino-obesidade', nome: 'Obesidade e síndrome metabólica', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi4-digestorio',
          nome: 'Sistema Digestório - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi4-digestorio-esofago', nome: 'Doenças do esôfago e estômago', horasEstimadas: 40, incluido: false },
            { id: 'med-soi4-digestorio-intestinal', nome: 'Doenças intestinais', horasEstimadas: 45, incluido: false },
            { id: 'med-soi4-digestorio-diarreia', nome: 'Diarreia aguda e crônica', horasEstimadas: 25, incluido: false },
            { id: 'med-soi4-digestorio-hepatobiliar', nome: 'Doenças hepatobiliares', horasEstimadas: 50, incluido: false },
            { id: 'med-soi4-digestorio-pancreas', nome: 'Pancreatopatias', horasEstimadas: 30, incluido: false }
          ]
        },
        {
          id: 'med-soi4-renal',
          nome: 'Sistema Renal e Vias Urinárias - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi4-renal-sindrome', nome: 'Síndrome nefrítica e nefrótica', horasEstimadas: 40, incluido: false },
            { id: 'med-soi4-renal-insuficiencia', nome: 'Insuficiência renal aguda e crônica', horasEstimadas: 45, incluido: false },
            { id: 'med-soi4-renal-disturbios', nome: 'Distúrbios hidroeletrolíticos e ácido-base', horasEstimadas: 40, incluido: false },
            { id: 'med-soi4-renal-infeccoes', nome: 'Infecções urinárias e pielonefrite', horasEstimadas: 25, incluido: false },
            { id: 'med-soi4-renal-litiase', nome: 'Litíase urinária e cólica renal', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi4-urogenital',
          nome: 'Sistema Urogenital/Reprodutor - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi4-urogenital-dst', nome: 'Doenças sexualmente transmissíveis', horasEstimadas: 35, incluido: false },
            { id: 'med-soi4-urogenital-ginecologicas', nome: 'Doenças ginecológicas', horasEstimadas: 45, incluido: false },
            { id: 'med-soi4-urogenital-mama', nome: 'Doenças da mama', horasEstimadas: 30, incluido: false },
            { id: 'med-soi4-urogenital-prostatica', nome: 'Doenças prostáticas', horasEstimadas: 30, incluido: false },
            { id: 'med-soi4-urogenital-disfuncao', nome: 'Disfunção erétil e infertilidade (básico)', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi4-exames',
          nome: 'Exames Complementares (transversal)',
          incluido: false,
          modulos: [
            { id: 'med-soi4-exames-interpretacao', nome: 'Interpretação de exames', horasEstimadas: 50, incluido: false }
          ]
        },
        {
          id: 'med-soi4-integracao',
          nome: 'Integração Clínica - Principais Agravos',
          incluido: false,
          modulos: [
            { id: 'med-soi4-int-casos', nome: 'Casos clínicos transversais', horasEstimadas: 70, incluido: false }
          ]
        }
      ]
    },
    // SOI V
    {
      id: 'med-soi5',
      nome: 'SOI V - Locomotor, Nervoso, Saúde Mental, Sentidos, Endócrino Avançado',
      incluido: false,
      subtopicos: [
        {
          id: 'med-soi5-locomotor',
          nome: 'Sistema Locomotor - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi5-locomotor-articulares', nome: 'Doenças articulares degenerativas e inflamatórias', horasEstimadas: 50, incluido: false },
            { id: 'med-soi5-locomotor-osseas', nome: 'Doenças ósseas metabólicas', horasEstimadas: 30, incluido: false },
            { id: 'med-soi5-locomotor-fraturas', nome: 'Fraturas e complicações', horasEstimadas: 30, incluido: false },
            { id: 'med-soi5-locomotor-dor', nome: 'Lombalgia e cervicalgia', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi5-nervoso',
          nome: 'Sistema Nervoso - Fisiopatologia e Clínica',
          incluido: false,
          modulos: [
            { id: 'med-soi5-nervoso-ave', nome: 'Acidente vascular encefálico (AVE)', horasEstimadas: 40, incluido: false },
            { id: 'med-soi5-nervoso-desmielinizantes', nome: 'Doenças desmielinizantes', horasEstimadas: 30, incluido: false },
            { id: 'med-soi5-nervoso-neurodegenerativas', nome: 'Doenças neurodegenerativas', horasEstimadas: 35, incluido: false },
            { id: 'med-soi5-nervoso-epilepsia', nome: 'Epilepsia e estado de mal epiléptico', horasEstimadas: 30, incluido: false },
            { id: 'med-soi5-nervoso-infeccoes', nome: 'Meningites e encefalites', horasEstimadas: 25, incluido: false },
            { id: 'med-soi5-nervoso-neuropatias', nome: 'Neuropatias periféricas', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi5-psiquiatria',
          nome: 'Saúde Mental - Psiquiatria',
          incluido: false,
          modulos: [
            { id: 'med-soi5-psiquiatria-ansiedade', nome: 'Transtornos de ansiedade e depressão', horasEstimadas: 40, incluido: false },
            { id: 'med-soi5-psiquiatria-bipolar', nome: 'Transtorno bipolar do humor', horasEstimadas: 25, incluido: false },
            { id: 'med-soi5-psiquiatria-esquizofrenia', nome: 'Esquizofrenia e transtornos psicóticos', horasEstimadas: 30, incluido: false },
            { id: 'med-soi5-psiquiatria-substancias', nome: 'Transtornos relacionados a substâncias', horasEstimadas: 35, incluido: false },
            { id: 'med-soi5-psiquiatria-suicidio', nome: 'Tentativa de suicídio e emergência psiquiátrica', horasEstimadas: 20, incluido: false }
          ]
        },
        {
          id: 'med-soi5-sentidos',
          nome: 'Órgãos dos Sentidos',
          incluido: false,
          modulos: [
            { id: 'med-soi5-sentidos-oftalmologia', nome: 'Oftalmologia', horasEstimadas: 50, incluido: false },
            { id: 'med-soi5-sentidos-otorrino', nome: 'Otorrinolaringologia', horasEstimadas: 50, incluido: false }
          ]
        },
        {
          id: 'med-soi5-endocrino',
          nome: 'Sistema Endócrino - Temas Avançados',
          incluido: false,
          modulos: [
            { id: 'med-soi5-endocrino-hipofise', nome: 'Doenças da hipófise', horasEstimadas: 35, incluido: false },
            { id: 'med-soi5-endocrino-nem', nome: 'Neoplasias endócrinas múltiplas (NEM 1 e 2)', horasEstimadas: 20, incluido: false },
            { id: 'med-soi5-endocrino-paratireoide', nome: 'Doenças da paratireoide e feocromocitoma', horasEstimadas: 25, incluido: false }
          ]
        },
        {
          id: 'med-soi5-exames',
          nome: 'Exames Complementares e Imagem (transversal)',
          incluido: false,
          modulos: [
            { id: 'med-soi5-exames-imagem', nome: 'Exames de imagem e complementares', horasEstimadas: 50, incluido: false }
          ]
        },
        {
          id: 'med-soi5-integracao',
          nome: 'Integração Clínica - Principais Emergências e Casos',
          incluido: false,
          modulos: [
            { id: 'med-soi5-int-emergencias', nome: 'Casos de emergência transversais', horasEstimadas: 80, incluido: false }
          ]
        }
      ]
    }
  ]
}

import type { Sistema } from './tipos'

/**
 * Exames por sistema do organismo.
 *
 * A grade de sistemas existe para responder a uma pergunta que a lista
 * alfabética de marcadores nunca responde: *o que este órgão entrega ao
 * laboratório, e por quê?* Cada sistema é organizado por eixo funcional — no
 * fígado, lesão × colestase × síntese; no rim, filtração × túbulo ×
 * repercussão — e cada um traz mapas fisiológicos que desenham a cadeia
 * `órgão → processo → marcador`. É o desenho que transforma "AST alta" em
 * "hepatócito lesado derramando conteúdo citoplasmático".
 */
export const SISTEMAS: Sistema[] = [
  {
    id: 'hematologico',
    nome: 'Sistema hematológico',
    chamada: 'Produção, transporte de oxigênio, defesa e hemostasia — as três linhagens e o que as sustenta.',
    cor: 'rose',
    icone: 'Droplets',
    eixos: [
      { titulo: 'Série vermelha', descricao: 'Massa eritrocitária e índices que classificam a anemia.', marcadores: ['hemoglobina', 'hematocrito', 'hemacias', 'vcm', 'hcm', 'chcm', 'rdw', 'reticulocitos'] },
      { titulo: 'Série branca', descricao: 'Defesa celular — sempre em valores absolutos.', marcadores: ['leucocitos', 'neutrofilos', 'linfocitos', 'monocitos', 'eosinofilos', 'basofilos'] },
      { titulo: 'Hemostasia', descricao: 'Plaquetas e cascata da coagulação.', marcadores: ['plaquetas', 'vpm', 'inr', 'ttpa', 'fibrinogenio', 'd-dimero', 'antitrombina'] },
      { titulo: 'Metabolismo do ferro e vitaminas', descricao: 'A matéria-prima da eritropoese.', marcadores: ['ferritina', 'ferro-serico', 'transferrina', 'saturacao-transferrina', 'vitamina-b12', 'acido-folico'] },
      { titulo: 'Hemólise', descricao: 'O que aparece no plasma quando a hemácia se rompe.', marcadores: ['ldh', 'haptoglobina', 'bilirrubina-indireta'] },
    ],
    mapas: [
      {
        titulo: 'Como nasce e morre uma hemácia',
        etapas: [
          { titulo: 'Rim detecta hipóxia', detalhe: 'As células peritubulares estabilizam o HIF-2α e secretam eritropoetina.' },
          { titulo: 'Eritropoetina', detalhe: 'Estimula os precursores eritroides da medula óssea.' },
          { titulo: 'Eritropoese', detalhe: 'Exige ferro (heme), B12 e folato (DNA) e globinas (proteína).' },
          { titulo: 'Reticulócito no sangue', detalhe: 'Célula jovem, maior; sua contagem mede a resposta medular.' },
          { titulo: 'Hemácia madura — 120 dias', detalhe: 'É esse tempo que a HbA1c integra.' },
          { titulo: 'Macrófago esplênico', detalhe: 'Degrada o heme: o ferro é reciclado e o anel vira bilirrubina indireta.' },
        ],
        leitura: 'Cada etapa tem um marcador correspondente. É por isso que reticulócito baixo com anemia aponta a fábrica, e reticulócito alto aponta perda ou destruição depois da fábrica.',
      },
      {
        titulo: 'A cascata da hemólise no laboratório',
        etapas: [
          { titulo: 'Hemácia destruída antes dos 120 dias' },
          { titulo: 'Conteúdo citoplasmático no plasma', detalhe: 'LDH sobe — a hemácia é riquíssima nessa enzima.' },
          { titulo: 'Hemoglobina livre capturada', detalhe: 'A haptoglobina liga e é consumida junto: seu nível cai.' },
          { titulo: 'Heme degradado', detalhe: 'Bilirrubina indireta sobe além da capacidade de conjugação hepática.' },
          { titulo: 'Medula responde', detalhe: 'Reticulócitos sobem em 3 a 5 dias.' },
        ],
        leitura: 'Os quatro achados do painel de hemólise não são coincidência: cada um é uma consequência direta e previsível da ruptura da célula.',
      },
    ],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-macrocitica', 'hemolise', 'infeccao-bacteriana', 'infeccao-viral'],
  },

  {
    id: 'hepatobiliar',
    nome: 'Sistema hepatobiliar',
    chamada: 'Lesão celular, colestase e função sintética — três eixos que o mesmo painel mistura e que precisam ser lidos separados.',
    cor: 'amber',
    icone: 'Leaf',
    eixos: [
      { titulo: 'Lesão hepatocelular', descricao: 'Enzimas que vazam da célula com membrana rompida.', marcadores: ['ast', 'alt', 'ldh'] },
      { titulo: 'Colestase', descricao: 'Enzimas canaliculares induzidas pelo represamento biliar.', marcadores: ['fosfatase-alcalina', 'ggt', 'bilirrubina-total', 'bilirrubina-direta'] },
      { titulo: 'Função sintética', descricao: 'O que só o fígado fabrica — o que de fato mede insuficiência.', marcadores: ['albumina', 'inr'] },
      { titulo: 'Metabolismo e excreção', descricao: 'Detoxificação nitrogenada e conjugação de pigmentos.', marcadores: ['amonia', 'ureia', 'bilirrubina-indireta'] },
    ],
    mapas: [
      {
        titulo: 'Lesão hepatocelular',
        etapas: [
          { titulo: 'Agressão ao hepatócito', detalhe: 'Vírus, álcool, fármaco, isquemia, autoimunidade ou gordura.' },
          { titulo: 'Perda de integridade da membrana' },
          { titulo: 'Extravasamento citoplasmático', detalhe: 'A ALT sai primeiro, por ser citoplasmática e mais concentrada no hepatócito.' },
          { titulo: 'AST e ALT séricas ↑', detalhe: 'A relação entre elas sugere a etiologia: > 2 com GGT alta aponta álcool.' },
        ],
        leitura: 'A magnitude reflete quantas células foram lesadas — não quanto o fígado ainda funciona. São perguntas diferentes.',
      },
      {
        titulo: 'Colestase',
        etapas: [
          { titulo: 'Obstrução ou disfunção do fluxo biliar', detalhe: 'Cálculo, tumor, estenose — ou disfunção do transporte canalicular.' },
          { titulo: 'Acúmulo de ácidos biliares' },
          { titulo: 'Indução das enzimas canaliculares', detalhe: 'FA e GGT são sintetizadas em maior quantidade e liberadas da membrana.' },
          { titulo: 'FA ↑↑ e GGT ↑', detalhe: 'A GGT confirma a origem hepática da FA.' },
          { titulo: 'Bilirrubina direta reflui', detalhe: 'Hidrossolúvel, é filtrada: colúria; falta no intestino: acolia.' },
        ],
        leitura: 'A FA não vaza de célula morta — ela é induzida. É por isso que sobe mais devagar que as transaminases e demora mais a normalizar.',
      },
      {
        titulo: 'Falência da função sintética',
        etapas: [
          { titulo: 'Perda de massa hepatocitária funcionante' },
          { titulo: 'Síntese de fatores de coagulação ↓', detalhe: 'O fator VII tem meia-vida de 6 horas — o INR alarga primeiro.' },
          { titulo: 'Síntese de albumina ↓', detalhe: 'Meia-vida de 20 dias — cai depois, e denuncia cronicidade.' },
          { titulo: 'Ciclo da ureia comprometido', detalhe: 'Ureia baixa com amônia alta e risco de encefalopatia.' },
        ],
        leitura: 'A ordem em que os marcadores caem data a lesão: INR alargado com albumina normal sugere quadro agudo; ambos alterados sugerem doença crônica.',
      },
    ],
    padroes: ['hepatocelular', 'colestatico', 'insuficiencia-hepatica'],
  },

  {
    id: 'renal',
    nome: 'Sistema renal',
    chamada: 'Filtração, função tubular e as consequências metabólicas de perdê-las.',
    cor: 'sky',
    icone: 'Filter',
    eixos: [
      { titulo: 'Filtração glomerular', marcadores: ['creatinina', 'ureia', 'tfg', 'cistatina-c'] },
      { titulo: 'Lesão glomerular', marcadores: ['proteinuria', 'albuminuria', 'eas'] },
      { titulo: 'Função tubular', marcadores: ['sodio-urinario', 'densidade-urinaria', 'osmolalidade-urinaria', 'bicarbonato'] },
      { titulo: 'Repercussão metabólica', marcadores: ['potassio', 'calcio', 'fosforo', 'pth', 'acido-urico', 'hemoglobina'] },
    ],
    mapas: [
      {
        titulo: 'Da queda da filtração à síndrome urêmica',
        etapas: [
          { titulo: 'Perda de néfrons funcionantes' },
          { titulo: 'TFG ↓', detalhe: 'Creatinina e ureia acumulam — a creatinina de forma hiperbólica, insensível no início.' },
          { titulo: 'Excreção de potássio comprometida', detalhe: 'Depende de fluxo distal e aldosterona: hipercalemia.' },
          { titulo: 'Regeneração de bicarbonato ↓', detalhe: 'Acidose metabólica.' },
          { titulo: 'Retenção de fosfato e queda do calcitriol', detalhe: 'FGF-23 e PTH sobem: hiperparatireoidismo secundário.' },
          { titulo: 'Eritropoetina ↓', detalhe: 'Anemia normocítica normocrômica.' },
        ],
        leitura: 'A doença renal crônica não é um número alterado: é um conjunto previsível de consequências, e cada uma delas tem seu marcador.',
      },
      {
        titulo: 'Pré-renal × renal: por que os índices funcionam',
        etapas: [
          { titulo: 'Queda da perfusão renal' },
          { titulo: 'Túbulo íntegro e ávido por volume', detalhe: 'Reabsorve sódio (Na urinário < 20, FENa < 1%) e concentra a urina.' },
          { titulo: 'Ureia arrastada junto pela ADH', detalhe: 'Ureia/creatinina > 40 — a creatinina não é reabsorvida.' },
          { titulo: 'Se a isquemia persistir: necrose tubular', detalhe: 'O túbulo perde a capacidade de reabsorver: Na urinário > 40, isostenúria, cilindros granulosos.' },
        ],
        leitura: 'Os índices urinários não são regras decoradas — são a consequência direta de o túbulo estar vivo ou morto.',
      },
    ],
    padroes: ['lesao-renal-aguda', 'sindrome-uremica', 'acidose-metabolica-hiperclorenica'],
  },

  {
    id: 'cardiovascular',
    nome: 'Sistema cardiovascular',
    chamada: 'Lesão do miócito, sobrecarga ventricular e o risco que se acumula décadas antes do evento.',
    cor: 'red',
    icone: 'HeartPulse',
    eixos: [
      { titulo: 'Lesão miocárdica', marcadores: ['troponina', 'ck-mb', 'ck', 'mioglobina'] },
      { titulo: 'Sobrecarga e insuficiência', marcadores: ['bnp', 'nt-probnp', 'sodio', 'creatinina'] },
      { titulo: 'Risco aterosclerótico', marcadores: ['ldl', 'nao-hdl', 'apob', 'lpa', 'hdl', 'triglicerideos', 'pcr-ultrassensivel'] },
      { titulo: 'Eletrólitos com repercussão elétrica', marcadores: ['potassio', 'magnesio', 'calcio-ionizado'] },
    ],
    mapas: [
      {
        titulo: 'Da placa ao infarto, no laboratório',
        etapas: [
          { titulo: 'Partícula com apoB atravessa o endotélio', detalhe: 'LDL, remanescentes e Lp(a) — todas contadas pela apoB.' },
          { titulo: 'Retenção na íntima e oxidação' },
          { titulo: 'Macrófago capta e vira célula espumosa', detalhe: 'Inflamação vascular: PCR ultrassensível ↑.' },
          { titulo: 'Ruptura da placa e trombose' },
          { titulo: 'Necrose miocárdica', detalhe: 'Troponina com curva de ascensão e queda.' },
        ],
        leitura: 'O painel lipídico mede o processo que leva décadas; a troponina mede o desfecho que leva horas. São o mesmo mecanismo em escalas de tempo distintas.',
      },
      {
        titulo: 'Por que o BNP sobe na insuficiência cardíaca',
        etapas: [
          { titulo: 'Pressão de enchimento ventricular ↑' },
          { titulo: 'Estiramento do miócito ventricular' },
          { titulo: 'Clivagem do proBNP', detalhe: 'Gera BNP (ativo) e NT-proBNP (inativo) em quantidades iguais.' },
          { titulo: 'Natriurese e vasodilatação', detalhe: 'Tentativa fisiológica de reduzir a própria sobrecarga.' },
        ],
        leitura: 'O BNP é um hormônio compensatório: sua elevação é a medida de quanto o ventrículo está sendo distendido.',
      },
    ],
    padroes: ['sindrome-coronariana-aguda', 'insuficiencia-cardiaca'],
  },

  {
    id: 'endocrino',
    nome: 'Sistema endócrino',
    chamada: 'Organizado por eixos: nenhum hormônio se interpreta sem o seu tropo hipofisário ao lado.',
    cor: 'violet',
    icone: 'Activity',
    eixos: [
      { titulo: 'Eixo tireoidiano', marcadores: ['tsh', 't4-livre', 't3'] },
      { titulo: 'Eixo adrenal', marcadores: ['cortisol', 'acth', 'aldosterona'] },
      { titulo: 'Eixo gonadal', marcadores: ['testosterona-total', 'estradiol', 'fsh', 'shbg', 'prolactina'] },
      { titulo: 'Eixo somatotrófico', marcadores: ['gh'] },
      { titulo: 'Paratireoide e metabolismo mineral', marcadores: ['pth', 'calcio', 'calcio-ionizado', 'fosforo', 'vitamina-d'] },
      { titulo: 'Metabolismo glicídico', marcadores: ['glicemia-jejum', 'hba1c', 'insulina', 'peptideo-c', 'ttog'] },
    ],
    mapas: [
      {
        titulo: 'Como ler qualquer eixo endócrino',
        etapas: [
          { titulo: 'Hormônio hipotalâmico', detalhe: 'TRH, CRH, GnRH, GHRH.' },
          { titulo: 'Hormônio hipofisário', detalhe: 'TSH, ACTH, LH/FSH, GH.' },
          { titulo: 'Hormônio periférico', detalhe: 'T4, cortisol, testosterona/estradiol, IGF-1.' },
          { titulo: 'Retroalimentação negativa', detalhe: 'O periférico inibe hipófise e hipotálamo.' },
        ],
        leitura: 'A pergunta é sempre a mesma: o hormônio hipofisário está apropriado para o periférico? Se o periférico está baixo, o tropo deveria estar alto — se não estiver, a lesão é central.',
      },
      {
        titulo: 'Por que o PTH sobe e o fósforo cai',
        etapas: [
          { titulo: 'Cálcio ionizado ↓' },
          { titulo: 'Sensor de cálcio da paratireoide' },
          { titulo: 'PTH ↑' },
          { titulo: 'Osso: reabsorção; rim: retém cálcio e excreta fosfato; ativa vitamina D' },
          { titulo: 'Cálcio ↑ e fósforo ↓' },
        ],
        leitura: 'Cálcio alto com fósforo baixo é a assinatura do hiperparatireoidismo primário; cálcio baixo com fósforo alto é a do hipoparatireoidismo. O padrão é a consequência direta da ação renal do PTH.',
      },
    ],
    padroes: ['hipotireoidismo-primario', 'hipertireoidismo-primario', 'insuficiencia-adrenal', 'sindrome-de-cushing'],
  },

  {
    id: 'respiratorio',
    nome: 'Sistema respiratório',
    chamada: 'Ventilação, oxigenação e equilíbrio ácido-base — três informações independentes na mesma gasometria.',
    cor: 'cyan',
    icone: 'Wind',
    eixos: [
      { titulo: 'Ventilação', descricao: 'A PaCO₂ é a medida direta e exclusiva da ventilação alveolar.', marcadores: ['paco2'] },
      { titulo: 'Oxigenação', marcadores: ['pao2'] },
      { titulo: 'Equilíbrio ácido-base', marcadores: ['ph', 'bicarbonato', 'anion-gap', 'cloro'] },
      { titulo: 'Perfusão tecidual', marcadores: ['lactato'] },
    ],
    mapas: [
      {
        titulo: 'A sequência da leitura ácido-base',
        etapas: [
          { titulo: '1. Existe acidemia ou alcalemia?', detalhe: 'O pH define o distúrbio primário.' },
          { titulo: '2. Respiratório ou metabólico?', detalhe: 'pH e PaCO₂ na mesma direção: metabólico. Em direções opostas: respiratório.' },
          { titulo: '3. A compensação é adequada?', detalhe: 'Winter na acidose metabólica; regras próprias para os demais.' },
          { titulo: '4. Ânion gap, corrigido pela albumina' },
          { titulo: '5. Delta-gap: existe distúrbio misto escondido?' },
          { titulo: '6. Oxigenação e lactato', detalhe: 'Perguntas que o eixo ácido-base não responde.' },
        ],
        leitura: 'É a mesma sequência que o interpretador de gasometria da seção executa — e ela resolve a maioria dos laudos sem nenhuma memorização adicional.',
      },
    ],
    padroes: ['acidose-respiratoria', 'acidose-metabolica-anion-gap-alto', 'alcalose-metabolica'],
  },

  {
    id: 'digestivo',
    nome: 'Sistema gastrointestinal e pancreático',
    chamada: 'Enzimas pancreáticas, absorção de nutrientes e as pistas indiretas de sangramento e má absorção.',
    cor: 'orange',
    icone: 'Utensils',
    eixos: [
      { titulo: 'Pâncreas exócrino', marcadores: ['lipase'] },
      { titulo: 'Absorção e nutrição', marcadores: ['albumina', 'ferritina', 'vitamina-b12', 'acido-folico', 'vitamina-d', 'calcio', 'magnesio', 'zinco'] },
      { titulo: 'Sangramento e inflamação', marcadores: ['hemoglobina', 'ureia', 'pcr', 'plaquetas'] },
      { titulo: 'Fígado e vias biliares', marcadores: ['alt', 'fosfatase-alcalina', 'ggt', 'bilirrubina-direta'] },
    ],
    mapas: [
      {
        titulo: 'Por que a ureia sobe no sangramento digestivo alto',
        etapas: [
          { titulo: 'Sangue no lúmen intestinal', detalhe: 'É uma carga proteica considerável.' },
          { titulo: 'Digestão e absorção de aminoácidos' },
          { titulo: 'Desaminação hepática e ciclo da ureia' },
          { titulo: 'Ureia ↑ com creatinina normal', detalhe: 'Somada à hipovolemia, produz relação ureia/creatinina acima de 100.' },
        ],
        leitura: 'É um exemplo perfeito de raciocínio laboratorial: um exame renal denunciando um problema digestivo.',
      },
      {
        titulo: 'Má absorção no laboratório',
        etapas: [
          { titulo: 'Lesão da mucosa ou insuficiência exócrina' },
          { titulo: 'Absorção de ferro comprometida', detalhe: 'Ferropenia, muitas vezes o primeiro sinal da doença celíaca.' },
          { titulo: 'Absorção de B12 e folato comprometida', detalhe: 'Anemia macrocítica ou dimórfica.' },
          { titulo: 'Vitaminas lipossolúveis', detalhe: 'Vitamina D baixa, cálcio baixo, INR alargado por falta de vitamina K.' },
        ],
        leitura: 'Ferropenia sem sangramento identificado, sobretudo com sintomas digestivos, exige rastreio de doença celíaca.',
      },
    ],
    padroes: ['pancreatite-aguda'],
  },

  {
    id: 'imunologico',
    nome: 'Sistema imunológico',
    chamada: 'Autoanticorpos, complemento e imunoglobulinas — os exames que mais exigem contexto clínico para não causar dano.',
    cor: 'indigo',
    icone: 'ShieldCheck',
    eixos: [
      { titulo: 'Triagem de autoimunidade', marcadores: ['fan'] },
      { titulo: 'Anticorpos específicos', marcadores: ['fator-reumatoide'] },
      { titulo: 'Complemento', marcadores: ['complemento-c3'] },
      { titulo: 'Imunoglobulinas', marcadores: ['imunoglobulinas'] },
      { titulo: 'Atividade inflamatória', marcadores: ['pcr', 'vhs', 'ferritina', 'albumina'] },
    ],
    mapas: [
      {
        titulo: 'Por que o complemento cai no lúpus em atividade',
        etapas: [
          { titulo: 'Autoanticorpos formam imunocomplexos', detalhe: 'Anti-DNA nativo e antígenos nucleares.' },
          { titulo: 'Imunocomplexos ativam a via clássica', detalhe: 'C1 → C4 → C2 → C3.' },
          { titulo: 'C3 e C4 consumidos' },
          { titulo: 'Deposição tecidual e lesão', detalhe: 'Nefrite, serosite, vasculite.' },
        ],
        leitura: 'Complemento em queda com anti-DNA em elevação é o par que marca atividade — sobretudo renal.',
      },
    ],
  },

  {
    id: 'infeccioso',
    nome: 'Sistema infeccioso',
    chamada: 'Marcadores de resposta, sorologias, culturas e testes moleculares — quatro perguntas diferentes sobre o mesmo paciente.',
    cor: 'emerald',
    icone: 'Bug',
    eixos: [
      { titulo: 'Resposta inflamatória', marcadores: ['pcr', 'procalcitonina', 'vhs', 'leucocitos', 'neutrofilos', 'linfocitos'] },
      { titulo: 'Gravidade e perfusão', marcadores: ['lactato', 'plaquetas', 'creatinina', 'bilirrubina-total'] },
      { titulo: 'Identificação do agente', marcadores: ['culturas', 'sorologias'] },
      { titulo: 'Repercussão hepática e hematológica', marcadores: ['alt', 'ast', 'hemoglobina'] },
    ],
    mapas: [
      {
        titulo: 'Por que a procalcitonina separa bacteriano de viral',
        etapas: [
          { titulo: 'Endotoxina bacteriana e IL-1β/TNF', detalhe: 'Induzem a expressão do gene CALC-1 em tecidos extratireoidianos.' },
          { titulo: 'Procalcitonina produzida sem clivagem', detalhe: 'Sobe em 3 a 6 horas.' },
          { titulo: 'Na infecção viral, o interferon-gama inibe essa produção', detalhe: 'Por isso a PCT permanece baixa nas viroses.' },
        ],
        leitura: 'A discriminação não é estatística: é mecanística. Duas vias de sinalização opostas atuam sobre o mesmo gene.',
      },
    ],
    padroes: ['infeccao-bacteriana', 'infeccao-viral', 'sepse'],
  },

  {
    id: 'metabolico',
    nome: 'Sistema metabólico',
    chamada: 'Resistência à insulina, lipídios, ácido úrico e o eixo mineral — o que a síndrome metabólica escreve no laboratório.',
    cor: 'teal',
    icone: 'Flame',
    eixos: [
      { titulo: 'Glicídico', marcadores: ['glicemia-jejum', 'hba1c', 'insulina', 'peptideo-c'] },
      { titulo: 'Lipídico', marcadores: ['triglicerideos', 'hdl', 'ldl', 'nao-hdl', 'apob'] },
      { titulo: 'Purinas', marcadores: ['acido-urico'] },
      { titulo: 'Mineral e ósseo', marcadores: ['calcio', 'fosforo', 'pth', 'vitamina-d', 'fosfatase-alcalina', 'magnesio'] },
      { titulo: 'Hepático associado', marcadores: ['alt', 'ggt', 'ferritina'] },
    ],
    mapas: [
      {
        titulo: 'A assinatura da resistência à insulina',
        etapas: [
          { titulo: 'Adiposidade visceral', detalhe: 'Tecido adiposo inflamado libera ácidos graxos e IL-6.' },
          { titulo: 'Lipólise não suprimida', detalhe: 'Fluxo de ácidos graxos ao fígado ↑.' },
          { titulo: 'Fígado exporta VLDL', detalhe: 'Triglicerídeos ↑.' },
          { titulo: 'CETP troca lipídios com a HDL', detalhe: 'HDL enriquecida em triglicerídeos é catabolizada: HDL ↓.' },
          { titulo: 'Insulina reabsorve urato e sódio no túbulo', detalhe: 'Ácido úrico ↑ e hipertensão.' },
          { titulo: 'Esteatose hepática', detalhe: 'ALT e GGT ↑, ferritina ↑.' },
        ],
        leitura: 'Triglicerídeos altos, HDL baixo, ácido úrico alto, ALT alta e ferritina alta não são cinco achados — são um só mecanismo visto de cinco ângulos.',
      },
    ],
  },

  {
    id: 'oncologico',
    nome: 'Marcadores tumorais',
    chamada: 'Exames de seguimento, quase nunca de diagnóstico — e praticamente nunca de rastreamento populacional.',
    cor: 'slate',
    icone: 'Microscope',
    eixos: [
      { titulo: 'Marcadores séricos', marcadores: ['psa', 'cea', 'beta-hcg'] },
      { titulo: 'Marcadores de atividade tumoral', marcadores: ['ldh', 'calcio', 'fosfatase-alcalina', 'acido-urico'] },
      { titulo: 'Repercussão sistêmica', marcadores: ['hemoglobina', 'albumina', 'vhs', 'plaquetas'] },
    ],
    mapas: [
      {
        titulo: 'Por que um marcador tumoral não rastreia',
        etapas: [
          { titulo: 'O antígeno é expresso também por tecido normal e inflamado' },
          { titulo: 'Em população de baixa prevalência, quase todo positivo é falso', detalhe: 'É uma consequência aritmética do valor preditivo positivo.' },
          { titulo: 'Cada falso-positivo gera imagem, biópsia e ansiedade' },
          { titulo: 'O uso adequado é o seguimento', detalhe: 'Em doença já diagnosticada, com marcador elevado ao início.' },
        ],
        leitura: 'Não é que os marcadores sejam ruins: é que a pergunta "rastrear pessoa saudável" é a pergunta errada para eles.',
      },
    ],
  },

  {
    id: 'neurologico',
    nome: 'Sistema nervoso',
    chamada: 'O tecido mais protegido do organismo — e por isso o que menos se revela no sangue. Quase tudo aqui exige o compartimento certo.',
    cor: 'purple',
    icone: 'Brain',
    eixos: [
      {
        titulo: 'Líquor',
        descricao: 'Celularidade, proteína, glicose e lactato — sempre lidos em relação ao sangue colhido no mesmo momento.',
        marcadores: ['liquor'],
      },
      {
        titulo: 'Neurodegeneração',
        descricao: 'Proteínas do neurônio que provam dano axonal e patologia específica.',
        marcadores: ['neurofilamento-leve', 'biomarcadores-alzheimer'],
      },
      {
        titulo: 'Autoimunidade neurológica',
        descricao: 'Anticorpos que causam a doença diretamente — e que definem quadros tratáveis.',
        marcadores: ['anticorpos-neurologicos'],
      },
      {
        titulo: 'Causas reversíveis de disfunção cognitiva',
        descricao: 'O que sempre se exclui antes de concluir por doença degenerativa.',
        marcadores: ['tsh', 'vitamina-b12', 'homocisteina', 'sodio', 'calcio', 'vdrl'],
      },
    ],
    mapas: [
      {
        titulo: 'Por que a glicose do líquor só faz sentido como razão',
        etapas: [
          { titulo: 'A glicose entra no líquor por transporte facilitado', detalhe: 'A concentração liquórica acompanha a glicemia com atraso de cerca de duas horas.' },
          { titulo: 'Glicose liquórica de 60 mg/dL', detalhe: 'Parece normal — até se saber a glicemia.' },
          { titulo: 'Se a glicemia é 100, a razão é 0,6', detalhe: 'Normal.' },
          { titulo: 'Se a glicemia é 300, a razão é 0,2', detalhe: 'Francamente baixa: consumo bacteriano.' },
        ],
        leitura: 'O mesmo número liquórico significa coisas opostas conforme a glicemia. Colher a glicemia junto não é detalhe — é parte do exame.',
      },
    ],
  },

  {
    id: 'musculoesqueletico',
    nome: 'Sistema musculoesquelético',
    chamada: 'Músculo e osso só aparecem no laboratório indiretamente: pelo que vaza da célula lesada e pelos fragmentos da remodelação.',
    cor: 'stone',
    icone: 'Bone',
    eixos: [
      {
        titulo: 'Lesão muscular',
        descricao: 'Enzimas que vazam do miócito — e que frequentemente são confundidas com hepatopatia.',
        marcadores: ['ck', 'aldolase', 'mioglobina', 'ldh', 'ast'],
      },
      {
        titulo: 'Miopatias inflamatórias',
        descricao: 'Os anticorpos que definem o subtipo e predizem acometimento pulmonar.',
        marcadores: ['anticorpos-miosite', 'fan'],
      },
      {
        titulo: 'Metabolismo ósseo',
        descricao: 'Cálcio, fósforo, PTH e vitamina D definem a causa; os marcadores de remodelação definem a velocidade.',
        marcadores: ['calcio', 'fosforo', 'pth', 'vitamina-d', 'vitamina-d-1-25', 'marcadores-remodelacao-ossea', 'fosfatase-alcalina'],
      },
      {
        titulo: 'Articulação',
        descricao: 'A artrocentese responde o que nenhum exame de sangue responde numa monoartrite aguda.',
        marcadores: ['liquido-sinovial', 'acido-urico', 'pcr', 'fator-reumatoide', 'anti-ccp'],
      },
    ],
    mapas: [
      {
        titulo: 'Por que uma miopatia chega rotulada como hepatopatia',
        etapas: [
          { titulo: 'AST, ALT e LDH existem no músculo', detalhe: 'Não são exclusivas do fígado — a ALT em menor quantidade, mas existe.' },
          { titulo: 'A lesão muscular libera as três', detalhe: 'O paciente chega com "transaminases elevadas".' },
          { titulo: 'A GGT vem normal', detalhe: 'Ela é hepatobiliar e praticamente ausente no músculo.' },
          { titulo: 'A CK está alta', detalhe: 'E fecha a origem.' },
        ],
        leitura: 'Transaminases altas com GGT normal e CK alta são músculo, não fígado. Pedir CK antes de investigar o fígado economiza meses.',
      },
    ],
  },

  {
    id: 'toxicologico',
    nome: 'Toxicologia e monitorização de fármacos',
    chamada: 'Concentração isolada quase nunca decide: o que decide é a concentração em relação ao tempo desde a exposição.',
    cor: 'zinc',
    icone: 'FlaskConical',
    eixos: [
      {
        titulo: 'Metais e exposição ambiental',
        descricao: 'Cada metal tem um alvo preferencial e um par bioquímico característico.',
        marcadores: ['chumbo', 'protoporfirina-zinco', 'oligoelementos'],
      },
      {
        titulo: 'Hemoglobinas disfuncionais',
        descricao: 'Hipóxia tecidual com oximetria de pulso e pO₂ normais — só a co-oximetria revela.',
        marcadores: ['carboxihemoglobina', 'pao2', 'lactato'],
      },
      {
        titulo: 'Monitorização terapêutica',
        descricao: 'Por que alguns fármacos exigem dosagem sérica e a maioria não.',
        marcadores: ['monitorizacao-terapeutica', 'creatinina', 'albumina', 'potassio'],
      },
      {
        titulo: 'Intoxicação por álcoois e o hiato osmolar',
        descricao: 'O soluto que a fórmula não contabiliza.',
        marcadores: ['osmolalidade-serica', 'anion-gap-corrigido', 'bicarbonato'],
      },
    ],
    mapas: [
      {
        titulo: 'A dança do gap osmolar e do ânion gap na intoxicação por álcool tóxico',
        etapas: [
          { titulo: 'Ingestão', detalhe: 'O álcool íntegro é osmoticamente ativo: gap osmolar ↑, ânion gap normal.' },
          { titulo: 'A álcool-desidrogenase começa a metabolizar', detalhe: 'Formam-se ácidos orgânicos.' },
          { titulo: 'Fase intermediária', detalhe: 'Gap osmolar caindo, ânion gap subindo.' },
          { titulo: 'Apresentação tardia', detalhe: 'Gap osmolar normal com acidose grave de ânion gap alto.' },
        ],
        leitura: 'Gap osmolar normal não exclui intoxicação: pode significar apenas que o paciente chegou tarde — e é exatamente quando o dano de órgão-alvo já começou.',
      },
    ],
  },
]

export const SISTEMA_POR_ID = new Map(SISTEMAS.map((s) => [s.id, s]))

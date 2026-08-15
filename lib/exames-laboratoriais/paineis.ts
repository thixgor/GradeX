import type { Exame } from './tipos'

/**
 * Os exames completos — a biblioteca de painéis.
 *
 * Um exame não é uma lista de marcadores: é um roteiro de leitura. Por isso
 * cada painel aqui carrega `comoInterpretar`, que é a ordem em que os olhos
 * devem passar pelos valores, e `blocos`, que é como o laudo real agrupa o que
 * pertence ao mesmo compartimento fisiológico. É essa estrutura que a folha
 * digital renderiza — e é ela que faz a tela parecer um laudo em vez de uma
 * tabela.
 */
export const EXAMES: Exame[] = [
  {
    id: 'hemograma',
    nome: 'Hemograma completo',
    sinonimos: ['hemograma', 'hemograma completo', 'eritrograma', 'leucograma', 'plaquetograma'],
    grupo: 'hematologia',
    sistemas: ['hematologico'],
    material: 'Sangue total com EDTA',
    oQueAvalia:
      'As três linhagens do sangue: a série vermelha (transporte de oxigênio), a série branca (defesa) e as plaquetas (hemostasia primária). É o exame que mais informa por unidade de custo em toda a medicina.',
    comoInterpretar: [
      'Comece pela hemoglobina: existe anemia? Compare com a referência de sexo e idade, não com um número universal.',
      'Se houver anemia, olhe o VCM: micro, normo ou macrocítica. Esse é o primeiro divisor de águas.',
      'Confira o RDW: população uniforme ou heterogênea? RDW alto com VCM normal ainda é anormal.',
      'Peça (ou procure) os reticulócitos: a medula está respondendo ou não? Isso separa produção reduzida de perda e destruição.',
      'Leia o leucograma em valores absolutos, nunca em percentuais — o percentual muda quando qualquer outra linhagem se altera.',
      'Verifique quais séries estão alteradas: uma só aponta causa periférica ou nutricional; duas ou três apontam medula.',
      'Nas plaquetas, exclua pseudoplaquetopenia por EDTA antes de qualquer investigação.',
    ],
    blocos: [
      {
        titulo: 'Série vermelha',
        descricao: 'Massa eritrocitária, tamanho e conteúdo de hemoglobina das células.',
        marcadores: ['hemacias', 'hemoglobina', 'hematocrito', 'vcm', 'hcm', 'chcm', 'rdw'],
      },
      {
        titulo: 'Série branca',
        descricao: 'Contagem total e diferencial — sempre lida em valores absolutos.',
        marcadores: ['leucocitos', 'neutrofilos', 'linfocitos', 'monocitos', 'eosinofilos', 'basofilos'],
      },
      {
        titulo: 'Plaquetas',
        descricao: 'Hemostasia primária e índices que sugerem o mecanismo da alteração.',
        marcadores: ['plaquetas', 'vpm'],
      },
    ],
    alteracoesComuns: [
      { titulo: 'Anemia microcítica e hipocrômica', descricao: 'Hb ↓, VCM ↓, HCM ↓, RDW ↑. Deficiência de ferro na maioria; talassemia quando o RDW é normal e a contagem de hemácias está preservada.' },
      { titulo: 'Anemia macrocítica', descricao: 'Hb ↓, VCM ↑. Megaloblástica (B12, folato) com hipersegmentação, LDH e bilirrubina indireta altos; não megaloblástica (álcool, hepatopatia, hipotireoidismo, reticulocitose).' },
      { titulo: 'Leucocitose com desvio à esquerda', descricao: 'Neutrofilia com bastonetes. Infecção bacteriana, inflamação estéril, corticoide ou estresse — o contexto e a PCR ajudam a separar.' },
      { titulo: 'Plaquetopenia isolada', descricao: 'Excluir pseudoplaquetopenia por EDTA. Persistindo, considerar PTI, medicamentos, viroses e hiperesplenismo.' },
      { titulo: 'Pancitopenia', descricao: 'Três séries baixas: doença medular, deficiência de B12 ou folato, hiperesplenismo ou infiltração — exige investigação.' },
    ],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-macrocitica', 'hemolise', 'infeccao-bacteriana', 'infeccao-viral'],
    cenarios: ['normal', 'anemia-ferropriva', 'anemia-megaloblastica', 'hemolise', 'infeccao-bacteriana', 'infeccao-viral', 'talassemia-menor', 'plaquetopenia-imune'],
    preparo: ['Não exige jejum.', 'Informar transfusão recente: ela altera VCM, RDW e a interpretação por semanas.'],
  },

  {
    id: 'funcao-hepatica',
    nome: 'Função hepática',
    sinonimos: ['hepatograma', 'provas de funcao hepatica', 'enzimas hepaticas', 'funcao hepatica'],
    grupo: 'hepatico',
    sistemas: ['hepatobiliar'],
    material: 'Soro',
    oQueAvalia:
      'Três coisas diferentes que o nome do exame confunde: lesão celular (AST, ALT), colestase (FA, GGT, bilirrubina direta) e função sintética de fato (albumina, INR). Transaminases altas não significam fígado insuficiente, e fígado insuficiente pode ter transaminases normais.',
    comoInterpretar: [
      'Separe lesão de função: AST e ALT medem lesão; albumina e INR medem função; FA e GGT medem colestase.',
      'Calcule a relação R (ALT/LSN ÷ FA/LSN): acima de 5 é hepatocelular, abaixo de 2 é colestático, entre 2 e 5 é misto.',
      'Confira a relação AST/ALT: acima de 2 com GGT alta sugere álcool; abaixo de 1 é o padrão da maioria das demais hepatopatias.',
      'Se a FA estiver alta, dose a GGT: alta junto significa fígado; normal significa osso, placenta ou intestino.',
      'Diante de bilirrubina elevada, pergunte qual fração predomina — indireta aponta hemólise ou defeito de conjugação; direta aponta colestase.',
      'Só então avalie função: albumina baixa, INR alargado e plaquetopenia indicam doença crônica avançada.',
    ],
    blocos: [
      { titulo: 'Lesão hepatocelular', descricao: 'Enzimas que vazam da célula lesada.', marcadores: ['ast', 'alt', 'ldh'] },
      { titulo: 'Colestase', descricao: 'Enzimas canaliculares induzidas pelo represamento da bile.', marcadores: ['fosfatase-alcalina', 'ggt', 'bilirrubina-total', 'bilirrubina-direta', 'bilirrubina-indireta'] },
      { titulo: 'Função sintética', descricao: 'O que só o fígado produz — e o que de fato mede insuficiência hepática.', marcadores: ['albumina', 'inr', 'amonia'] },
    ],
    alteracoesComuns: [
      { titulo: 'Padrão hepatocelular', descricao: 'AST e ALT muito acima de FA e GGT. Vírus, álcool, fármacos, isquemia, autoimune, esteatose.' },
      { titulo: 'Padrão colestático', descricao: 'FA e GGT muito acima das transaminases, com bilirrubina direta elevada. Cálculo, tumor, colangite biliar primária, fármacos.' },
      { titulo: 'Padrão misto', descricao: 'Ambos elevados de forma proporcional. Típico de lesão medicamentosa e de sepse.' },
      { titulo: 'Insuficiência hepática', descricao: 'INR alargado com albumina baixa e bilirrubina alta. As transaminases podem estar normais ou caindo — e isso não é melhora.' },
    ],
    padroes: ['hepatocelular', 'colestatico', 'insuficiencia-hepatica'],
    cenarios: ['normal', 'hepatite-aguda', 'colestase', 'hepatopatia-alcoolica', 'esteatose', 'cirrose'],
    preparo: ['Jejum de 8 horas é preferível (a fosfatase alcalina intestinal sobe após refeições).'],
  },

  {
    id: 'funcao-renal',
    nome: 'Função renal',
    sinonimos: ['funcao renal', 'ureia e creatinina', 'provas de funcao renal'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Soro e urina',
    oQueAvalia:
      'A capacidade de filtração glomerular, a integridade tubular e a repercussão metabólica da perda de função. Creatinina isolada não é função renal — a TFG estimada é.',
    comoInterpretar: [
      'Converta a creatinina em TFG estimada: o mesmo valor significa coisas diferentes conforme idade e sexo.',
      'Confira a relação ureia/creatinina: acima de 40 aponta causa pré-renal ou carga proteica; entre 10 e 20 aponta lesão intrínseca.',
      'Compare com valores anteriores: um aumento de 0,3 mg/dL em 48 horas já define lesão renal aguda, mesmo dentro da faixa de referência.',
      'Peça a albuminúria: ela é metade do estadiamento e prediz progressão independentemente da TFG.',
      'Avalie a repercussão: potássio, bicarbonato, cálcio, fósforo e hemoglobina dizem se a doença é crônica.',
      'No agudo, use sódio urinário, FENa e sedimento para localizar: pré-renal, renal ou pós-renal.',
    ],
    blocos: [
      { titulo: 'Filtração', marcadores: ['creatinina', 'ureia', 'tfg', 'cistatina-c'] },
      { titulo: 'Lesão e função tubular', marcadores: ['proteinuria', 'albuminuria', 'sodio-urinario', 'eas', 'densidade-urinaria', 'osmolalidade-urinaria'] },
      { titulo: 'Repercussão metabólica', marcadores: ['potassio', 'bicarbonato', 'calcio', 'fosforo', 'acido-urico', 'hemoglobina'] },
    ],
    alteracoesComuns: [
      { titulo: 'Azotemia pré-renal', descricao: 'Ureia/creatinina > 40, sódio urinário < 20, FENa < 1%, urina concentrada. Reversível com volume.' },
      { titulo: 'Necrose tubular aguda', descricao: 'Sódio urinário > 40, FENa > 2%, isostenúria, cilindros granulosos pigmentares.' },
      { titulo: 'Doença renal crônica', descricao: 'TFG reduzida por mais de 3 meses, com anemia normocítica, hiperfosfatemia, PTH alto e acidose.' },
      { titulo: 'Síndrome nefrótica', descricao: 'Proteinúria > 3,5 g/24h, albumina baixa, edema e hipercolesterolemia.' },
      { titulo: 'Síndrome nefrítica', descricao: 'Hematúria dismórfica, cilindros hemáticos, proteinúria, hipertensão e creatinina em elevação.' },
    ],
    padroes: ['lesao-renal-aguda', 'sindrome-uremica'],
    cenarios: ['normal', 'lesao-renal-pre-renal', 'necrose-tubular-aguda', 'doenca-renal-cronica', 'sindrome-nefrotica'],
    preparo: ['Evitar carne vermelha em excesso nas 12 horas anteriores (eleva a creatinina).', 'Informar uso de trimetoprima, cimetidina e suplementos de creatina.'],
  },

  {
    id: 'eletrolitos',
    nome: 'Eletrólitos e minerais',
    sinonimos: ['eletrolitos', 'ionograma', 'sodio potassio', 'minerais'],
    grupo: 'eletrolitos',
    sistemas: ['renal', 'metabolico'],
    material: 'Soro',
    oQueAvalia: 'O equilíbrio hidroeletrolítico e mineral — e, por consequência, a excitabilidade cardíaca e neuromuscular.',
    comoInterpretar: [
      'Sódio informa sobre água, não sobre sal: comece avaliando a volemia clínica antes do número.',
      'Diante de potássio alterado, pergunte sempre: é redistribuição ou déficit corporal? A conduta é oposta.',
      'Antes de interpretar o cálcio total, corrija pela albumina — ou dose o ionizado.',
      'Toda hipocalemia ou hipocalcemia refratária exige dosar magnésio.',
      'Calcule o ânion gap com o cloro e o bicarbonato: ele classifica a acidose metabólica.',
    ],
    blocos: [
      { titulo: 'Cátions e ânions principais', marcadores: ['sodio', 'potassio', 'cloro', 'bicarbonato', 'anion-gap'] },
      { titulo: 'Minerais', marcadores: ['calcio', 'calcio-ionizado', 'magnesio', 'fosforo'] },
      { titulo: 'Contexto', marcadores: ['albumina', 'creatinina', 'osmolalidade-urinaria', 'sodio-urinario'] },
    ],
    alteracoesComuns: [
      { titulo: 'Hiponatremia', descricao: 'Classificar por volemia e osmolalidade urinária: hipovolêmica, euvolêmica (SIADH) ou hipervolêmica.' },
      { titulo: 'Hipercalemia', descricao: 'Primeiro excluir pseudo-hipercalemia. Depois: retenção renal, medicamentos, acidose ou lise celular.' },
      { titulo: 'Hipocalemia refratária', descricao: 'Dosar magnésio: sem ele, o rim continua perdendo potássio apesar da reposição.' },
    ],
    padroes: ['siadh', 'acidose-metabolica-anion-gap-alto', 'acidose-metabolica-hiperclorenica'],
    cenarios: ['normal', 'hiponatremia-siadh', 'hipercalemia-renal', 'cetoacidose-diabetica'],
  },

  {
    id: 'perfil-lipidico',
    nome: 'Perfil lipídico',
    sinonimos: ['lipidograma', 'colesterol', 'perfil lipidico', 'dislipidemia'],
    grupo: 'lipidico',
    sistemas: ['cardiovascular', 'metabolico'],
    material: 'Soro',
    oQueAvalia: 'A carga de partículas aterogênicas circulantes e o componente metabólico associado à resistência à insulina.',
    comoInterpretar: [
      'Defina a meta pelo risco cardiovascular global do paciente — não existe alvo universal de LDL.',
      'Se os triglicerídeos estiverem acima de 150, o LDL calculado subestima o risco: use não-HDL e, quando disponível, apoB.',
      'Com triglicerídeos acima de 400, a fórmula de Friedewald é inválida — peça LDL direto ou use Martin-Hopkins.',
      'Triglicerídeos altos com HDL baixo é a assinatura da resistência à insulina: investigue glicemia e circunferência abdominal.',
      'Exclua causas secundárias antes de rotular como dislipidemia primária: TSH, glicemia, função renal e hepática.',
      'Considere dosar Lp(a) uma vez na vida: é geneticamente determinada e não muda.',
    ],
    blocos: [
      { titulo: 'Painel básico', marcadores: ['colesterol-total', 'ldl', 'hdl', 'triglicerideos', 'nao-hdl'] },
      { titulo: 'Contagem de partículas', marcadores: ['apob', 'apoa1', 'lpa'] },
      { titulo: 'Perfil expandido', marcadores: ['ldl-oxidado'] },
      { titulo: 'Risco residual', marcadores: ['pcr-ultrassensivel'] },
    ],
    alteracoesComuns: [
      { titulo: 'Dislipidemia aterogênica', descricao: 'Triglicerídeos altos, HDL baixo e LDL pequeno e denso. LDL calculado pode parecer aceitável enquanto a apoB está alta.' },
      { titulo: 'Hipercolesterolemia familiar', descricao: 'LDL acima de 190 mg/dL com história familiar de evento precoce e xantomas tendíneos. Rastrear a família.' },
      { titulo: 'Hipertrigliceridemia grave', descricao: 'Acima de 500 mg/dL, a preocupação passa a ser pancreatite, e não risco cardiovascular.' },
    ],
    cenarios: ['normal', 'dislipidemia-aterogenica', 'hipercolesterolemia-familiar', 'hipertrigliceridemia-grave'],
    preparo: ['Jejum não é obrigatório na maioria dos casos; recomendado quando os triglicerídeos passam de 440 mg/dL.', 'Não avaliar nas 6 a 8 semanas após infarto, cirurgia ou infecção.'],
  },

  {
    id: 'tireoide',
    nome: 'Função tireoidiana',
    sinonimos: ['tireoide', 'tsh t4', 'funcao tireoidiana', 'hormonios tireoidianos'],
    grupo: 'endocrino',
    sistemas: ['endocrino'],
    material: 'Soro',
    oQueAvalia: 'O eixo hipotálamo-hipófise-tireoide. TSH e T4 livre lidos juntos localizam se a doença é da glândula ou do comando.',
    comoInterpretar: [
      'Nunca leia o TSH sozinho: ele só faz sentido com o T4 livre ao lado.',
      'Pergunte se o TSH está apropriado para aquele T4. TSH "normal" com T4 baixo não é normal — é hipotireoidismo central.',
      'Não dose função tireoidiana em paciente agudamente enfermo: a síndrome do eutireoidiano doente produz alterações que não são doença tireoidiana.',
      'Use intervalos próprios de cada trimestre na gestante.',
      'Diante de padrão que imite tireotoxicose (TSH baixo com T4 e T3 altos) em paciente assintomático, pergunte sobre biotina.',
      'Após ajuste de dose, espere 6 a 8 semanas antes de repetir.',
    ],
    blocos: [
      { titulo: 'Eixo tireoidiano', marcadores: ['tsh', 't4-livre', 't3'] },
      { titulo: 'Repercussão metabólica', marcadores: ['colesterol-total', 'ck', 'sodio', 'prolactina'] },
    ],
    alteracoesComuns: [
      { titulo: 'Hipotireoidismo primário', descricao: 'TSH ↑ com T4 livre ↓. Dosar anti-TPO para etiologia autoimune.' },
      { titulo: 'Hipertireoidismo primário', descricao: 'TSH ↓↓ com T4 livre e/ou T3 ↑. TRAb e cintilografia definem a causa.' },
      { titulo: 'Subclínicos', descricao: 'TSH alterado com T4 livre normal. Repetir em 6 a 8 semanas antes de tratar.' },
      { titulo: 'Hipotireoidismo central', descricao: 'T4 livre ↓ com TSH baixo ou inapropriadamente normal. Investigar hipófise e os demais eixos.' },
    ],
    padroes: ['hipotireoidismo-primario', 'hipertireoidismo-primario'],
    cenarios: ['normal', 'hipotireoidismo-primario', 'hipertireoidismo-primario', 'hipotireoidismo-subclinico'],
  },

  {
    id: 'diabetes',
    nome: 'Diabetes e metabolismo glicídico',
    sinonimos: ['diabetes', 'glicemia', 'hemoglobina glicada', 'metabolismo glicidico'],
    grupo: 'glicemia',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Plasma com fluoreto e sangue total com EDTA',
    oQueAvalia: 'O controle glicêmico em três janelas de tempo e a reserva secretora de insulina.',
    comoInterpretar: [
      'Glicemia mede agora; frutosamina, as últimas 2 a 3 semanas; glicada, os últimos 2 a 3 meses.',
      'Se a glicada discordar da glicemia e da automonitorização, questione a glicada: avalie hemograma, hemoglobinopatia e hemólise.',
      'Insulina e peptídeo C só se interpretam com a glicemia da mesma amostra.',
      'Na gestação, use o teste de tolerância — a glicada não é adequada para o rastreio de diabetes gestacional.',
      'Espere 8 a 12 semanas após mudar o tratamento antes de repetir a glicada.',
    ],
    blocos: [
      { titulo: 'Diagnóstico e controle', marcadores: ['glicemia-jejum', 'hba1c', 'ttog', 'frutosamina'] },
      { titulo: 'Reserva e resistência', marcadores: ['insulina', 'peptideo-c'] },
      { titulo: 'Rastreio de complicações', marcadores: ['albuminuria', 'creatinina', 'tfg', 'ldl', 'triglicerideos'] },
    ],
    alteracoesComuns: [
      { titulo: 'Pré-diabetes', descricao: 'Glicemia de jejum de 100 a 125, glicada de 5,7 a 6,4% ou glicemia de 2 horas de 140 a 199.' },
      { titulo: 'Diabetes descompensado', descricao: 'Glicemia e glicada elevadas; avaliar cetonas e ânion gap se houver sintomas.' },
      { titulo: 'Cetoacidose diabética', descricao: 'Hiperglicemia com acidose, ânion gap alto e cetonemia. Potássio plasmático engana: o corporal está depletado.' },
    ],
    padroes: ['cetoacidose-diabetica'],
    cenarios: ['normal', 'diabetes-descompensado', 'cetoacidose-diabetica', 'pre-diabetes'],
    preparo: ['Jejum de 8 horas para glicemia e insulina.', 'Manter dieta habitual nos 3 dias anteriores ao teste de tolerância.'],
  },

  {
    id: 'gasometria-arterial',
    nome: 'Gasometria arterial',
    sinonimos: ['gasometria', 'gaso', 'gasometria arterial', 'equilibrio acido base'],
    grupo: 'gasometria',
    sistemas: ['respiratorio', 'metabolico', 'renal'],
    material: 'Sangue arterial heparinizado, em seringa sem bolhas',
    oQueAvalia: 'O equilíbrio ácido-base, a ventilação e a oxigenação — três informações independentes no mesmo exame.',
    comoInterpretar: [
      'Existe acidemia ou alcalemia? O pH define o distúrbio primário.',
      'O distúrbio é respiratório ou metabólico? Compare a direção da PaCO₂ e do bicarbonato com a do pH.',
      'A compensação é adequada? Use a fórmula de Winter na acidose metabólica; regras próprias para cada distúrbio.',
      'Calcule o ânion gap, sempre corrigido pela albumina.',
      'Se o gap estiver alto, calcule o delta-gap para descobrir distúrbios mistos ocultos.',
      'Avalie a oxigenação separadamente: PaO₂, saturação e relação PaO₂/FiO₂.',
      'Olhe o lactato: ele responde à pergunta sobre perfusão, que nenhum dos anteriores responde.',
    ],
    blocos: [
      { titulo: 'Equilíbrio ácido-base', marcadores: ['ph', 'paco2', 'bicarbonato', 'anion-gap'] },
      { titulo: 'Oxigenação', marcadores: ['pao2'] },
      { titulo: 'Perfusão', marcadores: ['lactato'] },
      { titulo: 'Eletrólitos associados', marcadores: ['sodio', 'potassio', 'cloro', 'calcio-ionizado'] },
    ],
    alteracoesComuns: [
      { titulo: 'Acidose metabólica com ânion gap alto', descricao: 'Lactato, cetoácidos, uremia ou intoxicações. Calcular o gap osmolar quando não houver lactato nem cetonas.' },
      { titulo: 'Acidose metabólica hiperclorêmica', descricao: 'Gap normal: diarreia, acidose tubular renal ou excesso de salina 0,9%.' },
      { titulo: 'Acidose respiratória crônica', descricao: 'PaCO₂ alta com bicarbonato elevado e pH quase normal — a compensação renal datou o distúrbio.' },
      { titulo: 'Alcalose respiratória', descricao: 'PaCO₂ baixa. Em paciente grave, pense em sepse ou embolia pulmonar antes de atribuir à ansiedade.' },
    ],
    padroes: ['acidose-metabolica-anion-gap-alto', 'acidose-metabolica-hiperclorenica', 'acidose-respiratoria', 'alcalose-metabolica'],
    cenarios: ['normal', 'acidose-metabolica-lactica', 'cetoacidose-diabetica', 'acidose-respiratoria-cronica', 'alcalose-metabolica-vomitos'],
    preparo: ['Seringa heparinizada, sem bolhas de ar, processada em até 15 minutos ou mantida em gelo.'],
  },

  {
    id: 'coagulograma',
    nome: 'Coagulograma',
    sinonimos: ['coagulograma', 'coagulacao', 'tap ttpa', 'provas de coagulacao'],
    grupo: 'coagulacao',
    sistemas: ['hematologico'],
    material: 'Plasma citratado',
    oQueAvalia: 'A integridade das vias da cascata da coagulação e a hemostasia primária.',
    comoInterpretar: [
      'TP/INR alargado isolado: via extrínseca — deficiência de vitamina K, hepatopatia inicial, varfarina.',
      'TTPa alargado isolado: via intrínseca — heparina, hemofilias, doença de von Willebrand, inibidores.',
      'Ambos alargados: via comum, consumo, hepatopatia avançada ou anticoagulação plena.',
      'TTPa alargado exige teste de mistura: corrige (falta fator) ou não corrige (existe inibidor)?',
      'Sempre confira as plaquetas: a hemostasia primária não aparece nos tempos de coagulação.',
      'Na suspeita de CIVD, avalie o conjunto: plaquetas, INR, TTPa, fibrinogênio e D-dímero — nenhum critério isolado fecha.',
    ],
    blocos: [
      { titulo: 'Tempos de coagulação', marcadores: ['inr', 'ttpa', 'tempo-trombina'] },
      { titulo: 'Substrato e produtos', marcadores: ['fibrinogenio', 'd-dimero'] },
      { titulo: 'Hemostasia primária', marcadores: ['plaquetas', 'vpm'] },
      { titulo: 'Anticoagulantes naturais', marcadores: ['antitrombina'] },
    ],
    alteracoesComuns: [
      { titulo: 'CIVD', descricao: 'Plaquetas ↓, INR e TTPa alargados, fibrinogênio ↓ e D-dímero ↑↑. Tratar a causa desencadeante.' },
      { titulo: 'Coagulopatia hepática', descricao: 'INR alargado com albumina baixa; fator V baixo separa de deficiência de vitamina K.' },
      { titulo: 'Deficiência de vitamina K', descricao: 'INR alargado com fator V normal — corrige com vitamina K parenteral em 12 a 24 horas.' },
    ],
    cenarios: ['normal', 'civd', 'coagulopatia-hepatica', 'anticoagulacao-varfarina'],
    preparo: ['Tubo de citrato preenchido até a marca: proporção incorreta altera os resultados.'],
  },

  {
    id: 'anemias',
    nome: 'Investigação de anemia',
    sinonimos: ['painel de anemia', 'ferro', 'anemia', 'cinetica do ferro'],
    grupo: 'ferro',
    sistemas: ['hematologico'],
    material: 'Soro e sangue total com EDTA',
    oQueAvalia: 'O estoque, o transporte e a disponibilidade de ferro, as vitaminas hematopoéticas e os marcadores de hemólise.',
    comoInterpretar: [
      'Comece pelo VCM e pelo reticulócito: eles dividem as anemias antes de qualquer exame adicional.',
      'Na microcitose, o painel de ferro decide: ferritina baixa é ferropenia; ferritina alta com saturação baixa é inflamação; tudo normal com RDW normal sugere talassemia.',
      'Na macrocitose, dose B12 e folato; se limítrofes, ácido metilmalônico e homocisteína.',
      'Reticulócito alto direciona para hemólise ou perda: dose LDH, haptoglobina e bilirrubina indireta.',
      'Coleta de ferro sérico: pela manhã e sem suplemento nas 48 horas anteriores.',
    ],
    blocos: [
      { titulo: 'Hemograma e resposta medular', marcadores: ['hemoglobina', 'vcm', 'rdw', 'reticulocitos'] },
      { titulo: 'Metabolismo do ferro', marcadores: ['ferritina', 'ferro-serico', 'transferrina', 'saturacao-transferrina'] },
      { titulo: 'Vitaminas hematopoéticas', marcadores: ['vitamina-b12', 'acido-folico'] },
      { titulo: 'Hemólise', marcadores: ['ldh', 'haptoglobina', 'bilirrubina-indireta'] },
    ],
    alteracoesComuns: [
      { titulo: 'Anemia ferropriva', descricao: 'Ferritina ↓, ferro ↓, transferrina ↑, saturação ↓↓, VCM ↓, RDW ↑, plaquetas frequentemente ↑.' },
      { titulo: 'Anemia da inflamação', descricao: 'Ferritina ↑ ou normal, ferro ↓, transferrina ↓, saturação ↓, normocítica na maioria.' },
      { titulo: 'Hemólise', descricao: 'Reticulócitos ↑, LDH ↑, haptoglobina ↓, bilirrubina indireta ↑. Coombs direto separa imune de não imune.' },
    ],
    padroes: ['anemia-microcitica-hipocromica', 'anemia-doenca-cronica', 'hemolise', 'anemia-macrocitica'],
    cenarios: ['anemia-ferropriva', 'anemia-doenca-cronica', 'hemolise', 'anemia-megaloblastica', 'talassemia-menor'],
    preparo: ['Ferro sérico: coleta matinal, em jejum, sem suplementação nas 48 horas anteriores.'],
  },

  {
    id: 'marcadores-cardiacos',
    nome: 'Marcadores cardíacos',
    sinonimos: ['troponina', 'marcadores cardiacos', 'enzimas cardiacas'],
    grupo: 'cardiaco',
    sistemas: ['cardiovascular'],
    material: 'Soro ou plasma',
    oQueAvalia: 'Lesão miocárdica, sobrecarga ventricular e — indiretamente — a natureza da dispneia ou da dor torácica.',
    comoInterpretar: [
      'Troponina elevada significa lesão miocárdica, não infarto: infarto exige elevação com variação dinâmica e contexto de isquemia.',
      'A segunda dosagem é a que diagnostica: o delta entre coletas separa lesão aguda de crônica.',
      'Considere causas não coronárias: miocardite, embolia, sepse, taquiarritmia, doença renal.',
      'Na dispneia, BNP ou NT-proBNP separam causa cardíaca de pulmonar; obesidade reduz e a doença renal eleva os valores.',
      'Em uso de sacubitril, acompanhe com NT-proBNP — o BNP fica falsamente elevado.',
    ],
    blocos: [
      { titulo: 'Lesão miocárdica', marcadores: ['troponina', 'ck-mb', 'ck', 'mioglobina'] },
      { titulo: 'Sobrecarga ventricular', marcadores: ['bnp', 'nt-probnp'] },
      { titulo: 'Contexto', marcadores: ['creatinina', 'hemoglobina', 'd-dimero', 'lactato'] },
    ],
    alteracoesComuns: [
      { titulo: 'Infarto agudo do miocárdio', descricao: 'Troponina com curva de ascensão e queda, em contexto de isquemia.' },
      { titulo: 'Lesão miocárdica crônica', descricao: 'Troponina elevada e estável, sem delta. Doença renal, insuficiência cardíaca, hipertrofia.' },
      { titulo: 'Insuficiência cardíaca descompensada', descricao: 'BNP ou NT-proBNP elevados, frequentemente com troponina discretamente alta e hiponatremia.' },
    ],
    padroes: ['sindrome-coronariana-aguda', 'insuficiencia-cardiaca'],
    cenarios: ['normal', 'infarto-agudo', 'insuficiencia-cardiaca', 'embolia-pulmonar'],
  },

  {
    id: 'inflamatorios',
    nome: 'Marcadores inflamatórios',
    sinonimos: ['pcr vhs', 'marcadores inflamatorios', 'provas de atividade inflamatoria'],
    grupo: 'inflamatorio',
    sistemas: ['infeccioso', 'imunologico'],
    material: 'Soro e sangue total',
    oQueAvalia: 'A intensidade e a evolução temporal de um processo inflamatório — e, com a procalcitonina, sua probabilidade de ser bacteriano.',
    comoInterpretar: [
      'PCR sobe em horas e cai em dias; VHS sobe em dias e cai em semanas. A discordância entre eles é temporal, não erro.',
      'Nenhum deles distingue infecção de inflamação estéril — a procalcitonina é a que mais se aproxima disso.',
      'A tendência vale mais que o valor: PCR que não cai em 48 a 72 horas de antibiótico sugere foco não drenado ou agente inadequado.',
      'Ferritina muito alta com febre e citopenias levanta hiperinflamação — não é apenas fase aguda.',
      'PCR alta em lúpus deve sugerir infecção associada, e não atividade da doença.',
    ],
    blocos: [
      { titulo: 'Fase aguda', marcadores: ['pcr', 'vhs', 'procalcitonina', 'ferritina', 'fibrinogenio'] },
      { titulo: 'Repercussão', marcadores: ['leucocitos', 'neutrofilos', 'linfocitos', 'albumina', 'lactato'] },
    ],
    alteracoesComuns: [
      { titulo: 'Infecção bacteriana', descricao: 'PCR alta, procalcitonina alta, neutrofilia com desvio à esquerda.' },
      { titulo: 'Infecção viral', descricao: 'PCR moderada ou normal, procalcitonina baixa, linfocitose ou leucopenia.' },
      { titulo: 'Inflamação crônica', descricao: 'VHS alto com PCR variável, ferritina alta, albumina baixa, anemia normocítica.' },
    ],
    padroes: ['infeccao-bacteriana', 'infeccao-viral', 'sepse'],
    cenarios: ['normal', 'infeccao-bacteriana', 'infeccao-viral', 'sepse'],
  },

  {
    id: 'urina-tipo-1',
    nome: 'Urina tipo I e sedimento',
    sinonimos: ['eas', 'urina 1', 'sedimento urinario', 'urinalise'],
    grupo: 'urinalise',
    sistemas: ['renal', 'infeccioso'],
    material: 'Urina de jato médio',
    oQueAvalia: 'A integridade glomerular e tubular, a presença de infecção e a capacidade de concentração — tudo em um exame de custo mínimo.',
    comoInterpretar: [
      'Leia como conjunto: proteinúria com hematúria dismórfica e cilindros hemáticos é glomerular; leucocitúria com nitrito é infecção.',
      'Fita positiva para sangue sem hemácias no sedimento significa hemoglobinúria ou mioglobinúria.',
      'Piúria estéril não é normal: nefrite intersticial, tuberculose urinária ou litíase.',
      'A densidade responde à pergunta sobre concentração: alta na azotemia pré-renal, fixa em 1.010 na lesão tubular.',
      'A fita não detecta cadeias leves: na suspeita de mieloma, peça eletroforese de proteínas urinárias.',
    ],
    blocos: [
      { titulo: 'Físico-química', marcadores: ['densidade-urinaria', 'eas'] },
      { titulo: 'Quantificação', marcadores: ['proteinuria', 'albuminuria', 'sodio-urinario', 'osmolalidade-urinaria'] },
      { titulo: 'Correlação sérica', marcadores: ['creatinina', 'tfg'] },
    ],
    alteracoesComuns: [
      { titulo: 'Infecção urinária', descricao: 'Leucocitúria, nitrito positivo, bacteriúria. Cilindros leucocitários sugerem pielonefrite.' },
      { titulo: 'Glomerulonefrite', descricao: 'Hematúria dismórfica, cilindros hemáticos, proteinúria.' },
      { titulo: 'Necrose tubular aguda', descricao: 'Cilindros granulosos pigmentares com isostenúria e sódio urinário alto.' },
    ],
    cenarios: ['normal', 'infeccao-urinaria', 'glomerulonefrite', 'necrose-tubular-aguda'],
    preparo: ['Jato médio, após higiene. Analisar em até 2 horas ou refrigerar.'],
  },

  {
    id: 'painel-completo',
    nome: 'Painel laboratorial completo',
    sinonimos: ['check up', 'painel completo', 'exames de rotina', 'painel laboratorial'],
    grupo: 'hematologia',
    sistemas: ['hematologico', 'renal', 'hepatobiliar', 'metabolico', 'cardiovascular'],
    material: 'Sangue e urina',
    oQueAvalia:
      'A visão panorâmica que o estudante encontra num prontuário real: hemograma, função renal, função hepática, eletrólitos, glicemia, perfil lipídico, coagulação e marcador inflamatório na mesma tela.',
    comoInterpretar: [
      'Varra a folha inteira primeiro e marque tudo que está fora da faixa — sem interpretar ainda.',
      'Agrupe as alterações por sistema: elas raramente são independentes umas das outras.',
      'Procure padrões, não valores: creatinina, ureia, potássio e bicarbonato alterados juntos contam uma história única.',
      'Pergunte o que falta: qual exame decidiria entre as hipóteses que sobraram?',
      'Só então formule a hipótese — e verifique se ela explica todas as alterações, não apenas a mais chamativa.',
    ],
    blocos: [
      { titulo: 'Hemograma', marcadores: ['hemoglobina', 'hematocrito', 'vcm', 'rdw', 'leucocitos', 'neutrofilos', 'linfocitos', 'plaquetas'] },
      { titulo: 'Função renal', marcadores: ['creatinina', 'ureia', 'tfg'] },
      { titulo: 'Eletrólitos', marcadores: ['sodio', 'potassio', 'cloro', 'bicarbonato', 'calcio', 'magnesio', 'fosforo'] },
      { titulo: 'Função hepática', marcadores: ['ast', 'alt', 'fosfatase-alcalina', 'ggt', 'bilirrubina-total', 'albumina'] },
      { titulo: 'Metabolismo', marcadores: ['glicemia-jejum', 'hba1c', 'colesterol-total', 'ldl', 'hdl', 'triglicerideos', 'acido-urico'] },
      { titulo: 'Coagulação', marcadores: ['inr', 'ttpa'] },
      { titulo: 'Inflamação', marcadores: ['pcr', 'vhs'] },
      { titulo: 'Urina', marcadores: ['eas', 'albuminuria'] },
    ],
    cenarios: ['normal', 'doenca-renal-cronica', 'cirrose', 'sepse', 'diabetes-descompensado', 'cetoacidose-diabetica'],
  },
]

export const EXAME_POR_ID = new Map(EXAMES.map((e) => [e.id, e]))

export const TOTAL_DE_EXAMES = EXAMES.length

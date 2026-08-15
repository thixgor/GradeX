import type { Comparacao, Doenca } from './tipos'

/**
 * Navegação inversa: da doença para os exames.
 *
 * A seção inteira é construída para ser percorrida nos dois sentidos. Quem
 * parte de um valor alterado chega à doença pelas fichas de marcador; quem
 * parte da doença chega ao padrão esperado por aqui — e cada achado vem com o
 * `porque`, que é a razão de existir da seção: não decorar que a ferritina cai
 * na anemia ferropriva, e sim entender que ela cai porque o estoque acabou.
 */
export const DOENCAS: Doenca[] = [
  {
    id: 'anemia-ferropriva',
    nome: 'Anemia ferropriva',
    sinonimos: ['anemia por deficiencia de ferro', 'ferropenia'],
    sistemas: ['hematologico'],
    fisiopatologia:
      'A perda ou a demanda de ferro supera a absorção. O estoque se esgota primeiro (ferritina cai), depois o ferro circulante, e só então a hemoglobinização das novas hemácias fica comprometida. Por isso a sequência das alterações é previsível — e a ferritina se altera muito antes da anemia.',
    esperado: [
      { marcador: 'Ferritina', id: 'ferritina', direcao: '↓', porque: 'Reflete diretamente o estoque, que foi o primeiro a acabar.' },
      { marcador: 'Ferro sérico', id: 'ferro-serico', direcao: '↓', porque: 'Sem estoque para mobilizar, o ferro circulante cai.' },
      { marcador: 'Transferrina / TIBC', id: 'transferrina', direcao: '↑', porque: 'O fígado fabrica mais transportador para capturar o pouco ferro disponível.' },
      { marcador: 'Saturação da transferrina', id: 'saturacao-transferrina', direcao: '↓↓', porque: 'Pouco ferro dividido por muita capacidade de transporte.' },
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓', porque: 'A síntese de heme está limitada pela falta de ferro.' },
      { marcador: 'VCM', id: 'vcm', direcao: '↓', porque: 'O precursor divide-se mais vezes tentando alcançar a concentração-alvo de hemoglobina.' },
      { marcador: 'HCM', id: 'hcm', direcao: '↓', porque: 'Menos hemoglobina cabe numa célula menor e mal hemoglobinizada.' },
      { marcador: 'RDW', id: 'rdw', direcao: '↑', porque: 'Coexistem hemácias antigas normais e novas pequenas — e essa mistura é precoce.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↑ frequentemente', porque: 'A ferropenia estimula de forma cruzada a megacariopoese.' },
    ],
    confirmacao: ['Ferritina baixa fecha o diagnóstico.', 'Com inflamação associada, use saturação de transferrina abaixo de 20% e considere o receptor solúvel de transferrina.'],
    diferenciais: ['Talassemia menor', 'Anemia da inflamação', 'Anemia sideroblástica'],
    comparacoes: ['ferropriva-vs-talassemia-vs-doenca-cronica'],
    padroes: ['anemia-microcitica-hipocromica'],
    cenario: 'anemia-ferropriva',
  },

  {
    id: 'anemia-megaloblastica',
    nome: 'Anemia megaloblástica',
    sinonimos: ['deficiencia de b12', 'deficiencia de folato', 'anemia perniciosa'],
    sistemas: ['hematologico'],
    fisiopatologia:
      'A falta de B12 ou de folato bloqueia a síntese de timidilato e, com ela, a replicação do DNA. O núcleo atrasa enquanto o citoplasma segue amadurecendo: as células saem grandes, e muitos precursores morrem ainda na medula — a eritropoese ineficaz, que produz o padrão bioquímico de hemólise sem hemólise periférica.',
    esperado: [
      { marcador: 'VCM', id: 'vcm', direcao: '↑↑', porque: 'Assincronia entre maturação nuclear e citoplasmática.' },
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓', porque: 'Produção eficaz reduzida.' },
      { marcador: 'LDH', id: 'ldh', direcao: '↑↑', porque: 'Destruição intramedular dos precursores libera a enzima.' },
      { marcador: 'Bilirrubina indireta', id: 'bilirrubina-indireta', direcao: '↑', porque: 'Mesma destruição intramedular degrada heme.' },
      { marcador: 'Reticulócitos', id: 'reticulocitos', direcao: '↓', porque: 'Os precursores morrem antes de sair da medula.' },
      { marcador: 'Vitamina B12', id: 'vitamina-b12', direcao: '↓', porque: 'É a deficiência de base em boa parte dos casos.' },
      { marcador: 'Plaquetas e leucócitos', id: 'plaquetas', direcao: '↓ leve', porque: 'A síntese de DNA afeta todas as linhagens.' },
    ],
    confirmacao: ['B12 e folato séricos; se limítrofes, ácido metilmalônico e homocisteína.', 'Neutrófilos hipersegmentados no esfregaço.', 'Anti-fator intrínseco e anticélula parietal na suspeita de anemia perniciosa.'],
    diferenciais: ['Macrocitose alcoólica', 'Hepatopatia', 'Mielodisplasia', 'Hipotireoidismo', 'Reticulocitose'],
    padroes: ['anemia-macrocitica'],
    cenario: 'anemia-megaloblastica',
  },

  {
    id: 'hemolise-autoimune',
    nome: 'Anemia hemolítica autoimune',
    sinonimos: ['hemolise', 'anemia hemolitica', 'coombs positivo'],
    sistemas: ['hematologico', 'imunologico'],
    fisiopatologia:
      'Autoanticorpos revestem a membrana eritrocitária; o macrófago esplênico reconhece a porção Fc, remove fragmentos de membrana e a célula assume forma esférica, sendo por fim destruída. O conteúdo liberado aparece no plasma e a medula responde acelerando a produção.',
    esperado: [
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓', porque: 'Destruição periférica supera a produção.' },
      { marcador: 'Reticulócitos', id: 'reticulocitos', direcao: '↑↑', porque: 'A medula competente responde à perda.' },
      { marcador: 'LDH', id: 'ldh', direcao: '↑', porque: 'Liberado do citoplasma da hemácia rompida.' },
      { marcador: 'Haptoglobina', id: 'haptoglobina', direcao: '↓↓', porque: 'Consumida ao capturar a hemoglobina livre.' },
      { marcador: 'Bilirrubina indireta', id: 'bilirrubina-indireta', direcao: '↑', porque: 'A produção excede a capacidade de conjugação hepática.' },
      { marcador: 'CHCM', id: 'chcm', direcao: '↑', porque: 'A perda de membrana concentra o conteúdo — os esferócitos.' },
    ],
    confirmacao: ['Coombs direto positivo.', 'Esferócitos no esfregaço.', 'Investigar causa secundária: linfoproliferação, lúpus, medicamentos, infecções.'],
    diferenciais: ['Microangiopatia trombótica', 'Esferocitose hereditária', 'Hemólise medicamentosa', 'Anemia megaloblástica'],
    comparacoes: ['hemolise-vs-perda-vs-producao'],
    padroes: ['hemolise'],
    cenario: 'hemolise',
  },

  {
    id: 'anemia-doenca-cronica',
    nome: 'Anemia da inflamação (doença crônica)',
    sinonimos: ['anemia de doenca cronica', 'anemia da inflamacao'],
    sistemas: ['hematologico', 'imunologico'],
    fisiopatologia:
      'A IL-6 eleva a hepcidina hepática, que degrada a ferroportina — o único canal de saída do ferro do enterócito e do macrófago. O ferro deixa de ser absorvido e fica preso no macrófago: existe no corpo, mas não chega ao eritroblasto.',
    esperado: [
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓ leve a moderada', porque: 'Eritropoese limitada pela indisponibilidade de ferro e pela supressão inflamatória.' },
      { marcador: 'VCM', id: 'vcm', direcao: 'normal ou ↓ leve', porque: 'A microcitose, quando ocorre, é discreta e tardia.' },
      { marcador: 'Ferritina', id: 'ferritina', direcao: '↑ ou normal', porque: 'É reagente de fase aguda e reflete o ferro estocado no macrófago.' },
      { marcador: 'Ferro sérico', id: 'ferro-serico', direcao: '↓', porque: 'O ferro não sai do macrófago.' },
      { marcador: 'Transferrina', id: 'transferrina', direcao: '↓', porque: 'Reagente de fase aguda negativo.' },
      { marcador: 'PCR', id: 'pcr', direcao: '↑', porque: 'Marca a inflamação que dispara todo o mecanismo.' },
    ],
    confirmacao: ['Contexto inflamatório documentado com ferritina não baixa.', 'Se houver dúvida sobre ferropenia associada, considere que ferritina até 100 ng/mL não a afasta.'],
    diferenciais: ['Anemia ferropriva', 'Anemia da doença renal crônica', 'Talassemia'],
    comparacoes: ['ferropriva-vs-talassemia-vs-doenca-cronica'],
    padroes: ['anemia-doenca-cronica'],
    cenario: 'anemia-doenca-cronica',
  },

  {
    id: 'talassemia-menor',
    nome: 'Talassemia menor (traço talassêmico)',
    sinonimos: ['traco talassemico', 'beta talassemia menor'],
    sistemas: ['hematologico'],
    fisiopatologia:
      'A produção de uma das cadeias de globina é deficiente. O ferro está disponível, mas falta proteína para montar o tetrâmero: as hemácias saem pequenas e em número preservado ou até aumentado, e a população é uniformemente pequena — daí o RDW normal.',
    esperado: [
      { marcador: 'VCM', id: 'vcm', direcao: '↓↓ (desproporcional à anemia)', porque: 'Todas as células são pequenas, e não apenas as novas.' },
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: 'normal ou ↓ leve', porque: 'A produção compensa parcialmente com mais células.' },
      { marcador: 'Contagem de hemácias', id: 'hemacias', direcao: 'normal ou ↑', porque: 'A medula produz muitas células pequenas.' },
      { marcador: 'RDW', id: 'rdw', direcao: 'normal', porque: 'A população é homogênea — é o defeito genético, presente em todas as células.' },
      { marcador: 'Ferritina', id: 'ferritina', direcao: 'normal', porque: 'O estoque de ferro está íntegro.' },
    ],
    confirmacao: ['Eletroforese de hemoglobina: HbA2 acima de 3,5% na beta-talassemia menor.', 'Ferritina normal excluindo ferropenia.'],
    diferenciais: ['Anemia ferropriva', 'Anemia da inflamação', 'Anemia sideroblástica'],
    comparacoes: ['ferropriva-vs-talassemia-vs-doenca-cronica'],
    padroes: ['anemia-microcitica-hipocromica'],
    cenario: 'talassemia-menor',
  },

  {
    id: 'doenca-renal-cronica',
    nome: 'Doença renal crônica',
    sinonimos: ['drc', 'insuficiencia renal cronica'],
    sistemas: ['renal', 'metabolico'],
    fisiopatologia:
      'A perda progressiva de néfrons compromete todas as funções renais simultaneamente: excreção de nitrogênio, potássio e fosfato; regeneração de bicarbonato; ativação da vitamina D; e produção de eritropoetina. É esse conjunto — e não a creatinina isolada — que caracteriza a cronicidade.',
    esperado: [
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Filtração reduzida com produção constante.' },
      { marcador: 'TFG', id: 'tfg', direcao: '↓ por mais de 3 meses', porque: 'Define a doença e a estadia.' },
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓ normocítica', porque: 'Menos células peritubulares produzindo eritropoetina.' },
      { marcador: 'Potássio', id: 'potassio', direcao: '↑', porque: 'Secreção distal comprometida por menor fluxo tubular.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓', porque: 'Menor excreção de ácidos e menor regeneração de bicarbonato.' },
      { marcador: 'Fósforo', id: 'fosforo', direcao: '↑', porque: 'A excreção de fosfato depende da filtração.' },
      { marcador: 'PTH', id: 'pth', direcao: '↑', porque: 'Hiperfosfatemia e calcitriol baixo estimulam a paratireoide.' },
      { marcador: 'Cálcio', id: 'calcio', direcao: '↓ ou normal', porque: 'Menor absorção intestinal por deficiência de calcitriol.' },
      { marcador: 'Albuminúria', id: 'albuminuria', direcao: '↑', porque: 'Lesão glomerular na maioria das etiologias — e metade do estadiamento.' },
    ],
    confirmacao: ['TFG reduzida ou lesão renal documentada por mais de 3 meses.', 'Estadiar pelos dois eixos KDIGO: TFG e albuminúria.', 'Ultrassonografia com rins pequenos reforça cronicidade.'],
    diferenciais: ['Lesão renal aguda', 'Agudização de doença crônica'],
    comparacoes: ['pre-renal-vs-renal-vs-pos-renal'],
    padroes: ['sindrome-uremica'],
    cenario: 'doenca-renal-cronica',
  },

  {
    id: 'lesao-renal-aguda-pre-renal',
    nome: 'Lesão renal aguda pré-renal',
    sinonimos: ['azotemia pre renal', 'ira pre renal'],
    sistemas: ['renal'],
    fisiopatologia:
      'O parênquima renal está íntegro, mas a perfusão caiu. O túbulo, vivo e sob ação da aldosterona e da ADH, reabsorve avidamente sódio e água — e a ureia vem junto por arraste, enquanto a creatinina, que não é reabsorvida, sobe menos.',
    esperado: [
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'A filtração caiu por redução da pressão de ultrafiltração.' },
      { marcador: 'Ureia', id: 'ureia', direcao: '↑↑', porque: 'Além da retenção, é reabsorvida junto com a água sob ação da ADH.' },
      { marcador: 'Relação ureia/creatinina', direcao: '> 40', porque: 'A ureia é reabsorvida e a creatinina não — a dissociação é a assinatura.' },
      { marcador: 'Sódio urinário', id: 'sodio-urinario', direcao: '< 20 mEq/L', porque: 'O túbulo íntegro retém sódio ao máximo.' },
      { marcador: 'Densidade urinária', id: 'densidade-urinaria', direcao: '> 1.020', porque: 'A capacidade de concentração está preservada.' },
    ],
    confirmacao: ['Reversão da creatinina após reposição volêmica adequada.', 'Sedimento urinário sem cilindros granulosos.'],
    diferenciais: ['Necrose tubular aguda', 'Obstrução urinária', 'Síndrome hepatorrenal e cardiorrenal'],
    comparacoes: ['pre-renal-vs-renal-vs-pos-renal'],
    padroes: ['lesao-renal-aguda'],
    cenario: 'lesao-renal-pre-renal',
  },

  {
    id: 'necrose-tubular-aguda',
    nome: 'Necrose tubular aguda',
    sinonimos: ['nta', 'lesao renal intrinseca'],
    sistemas: ['renal'],
    fisiopatologia:
      'O epitélio tubular é lesado por isquemia prolongada ou por toxina. Perde-se a capacidade de reabsorver sódio e de concentrar a urina; células descamadas formam cilindros que obstruem o lúmen, e o filtrado retrodifunde.',
    esperado: [
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Queda da filtração por obstrução tubular e retrodifusão.' },
      { marcador: 'Relação ureia/creatinina', direcao: '10 a 20 (proporcional)', porque: 'Sem reabsorção tubular preferencial de ureia.' },
      { marcador: 'Sódio urinário', id: 'sodio-urinario', direcao: '> 40 mEq/L', porque: 'O túbulo lesado não consegue reabsorver sódio.' },
      { marcador: 'Densidade urinária', id: 'densidade-urinaria', direcao: '~1.010 (isostenúria)', porque: 'Perda da capacidade de concentrar e diluir.' },
      { marcador: 'Sedimento', id: 'eas', direcao: 'cilindros granulosos pigmentares', porque: 'Células tubulares descamadas moldadas na proteína de Tamm-Horsfall.' },
    ],
    confirmacao: ['Contexto de isquemia prolongada, sepse, contraste, rabdomiólise ou nefrotóxico.', 'Sedimento com cilindros granulosos pigmentares.'],
    diferenciais: ['Azotemia pré-renal', 'Nefrite intersticial aguda', 'Glomerulonefrite'],
    comparacoes: ['pre-renal-vs-renal-vs-pos-renal'],
    padroes: ['lesao-renal-aguda'],
    cenario: 'necrose-tubular-aguda',
  },

  {
    id: 'hepatite-aguda',
    nome: 'Hepatite aguda',
    sinonimos: ['hepatite viral aguda', 'hepatite'],
    sistemas: ['hepatobiliar'],
    fisiopatologia:
      'A agressão ao hepatócito — viral, medicamentosa, isquêmica ou autoimune — rompe a membrana e libera enzimas citoplasmáticas. Quando extensa, compromete também a captação e a conjugação da bilirrubina e, nos casos graves, a síntese de fatores de coagulação.',
    esperado: [
      { marcador: 'ALT', id: 'alt', direcao: '↑↑↑', porque: 'Citoplasmática e quase exclusiva do hepatócito.' },
      { marcador: 'AST', id: 'ast', direcao: '↑↑↑', porque: 'Liberada junto, com predomínio da ALT nas hepatites virais.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑', porque: 'Captação, conjugação e excreção comprometidas.' },
      { marcador: 'Fosfatase alcalina', id: 'fosfatase-alcalina', direcao: 'normal ou ↑ leve', porque: 'Não há colestase predominante.' },
      { marcador: 'INR', id: 'inr', direcao: 'normal ou ↑', porque: 'Alarga quando a lesão compromete a síntese — e define gravidade.' },
    ],
    confirmacao: ['Sorologias virais conforme o contexto.', 'Revisão de medicamentos e de exposição a toxinas.', 'Autoanticorpos e imunoglobulinas na suspeita autoimune.'],
    diferenciais: ['Hepatite isquêmica', 'Hepatite medicamentosa', 'Obstrução biliar aguda', 'Doença de Wilson'],
    padroes: ['hepatocelular'],
    cenario: 'hepatite-aguda',
  },

  {
    id: 'colestase',
    nome: 'Colestase',
    sinonimos: ['obstrucao biliar', 'ictericia obstrutiva', 'colestase'],
    sistemas: ['hepatobiliar'],
    fisiopatologia:
      'O fluxo biliar é interrompido por obstrução mecânica ou por disfunção do transporte canalicular. Os ácidos biliares acumulados induzem a síntese das enzimas canaliculares, e a bilirrubina conjugada reflui para o sangue — aparecendo na urina e faltando nas fezes.',
    esperado: [
      { marcador: 'Fosfatase alcalina', id: 'fosfatase-alcalina', direcao: '↑↑', porque: 'Induzida pelos ácidos biliares acumulados.' },
      { marcador: 'GGT', id: 'ggt', direcao: '↑↑', porque: 'Mesma indução canalicular; confirma origem hepática da FA.' },
      { marcador: 'Bilirrubina direta', id: 'bilirrubina-direta', direcao: '↑', porque: 'Conjugada e sem via de saída, reflui para o sangue.' },
      { marcador: 'AST / ALT', id: 'alt', direcao: '↑ leve', porque: 'Lesão hepatocelular secundária, de menor intensidade.' },
      { marcador: 'INR', id: 'inr', direcao: '↑ na colestase prolongada', porque: 'A vitamina K é lipossolúvel e depende de sais biliares para ser absorvida.' },
    ],
    confirmacao: ['Ultrassonografia: vias dilatadas apontam obstrução extra-hepática.', 'Anticorpo antimitocôndria na suspeita de colangite biliar primária.', 'Colangiorressonância quando a ultrassonografia é inconclusiva.'],
    diferenciais: ['Hepatite com componente colestático', 'Colestase medicamentosa', 'Colestase da sepse', 'Síndromes hereditárias de transporte'],
    comparacoes: ['hepatocelular-vs-colestatico'],
    padroes: ['colestatico'],
    cenario: 'colestase',
  },

  {
    id: 'cirrose',
    nome: 'Cirrose hepática',
    sinonimos: ['cirrose', 'hepatopatia cronica'],
    sistemas: ['hepatobiliar'],
    fisiopatologia:
      'A fibrose substitui o parênquima e distorce a arquitetura vascular. Isso produz dois conjuntos de consequências: perda de função sintética e detoxificadora, e hipertensão portal com hiperesplenismo. As transaminases podem ser normais — resta pouco hepatócito para lesar.',
    esperado: [
      { marcador: 'Albumina', id: 'albumina', direcao: '↓', porque: 'Perda de massa hepatocitária funcionante.' },
      { marcador: 'INR', id: 'inr', direcao: '↑', porque: 'Síntese de fatores de coagulação comprometida.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑', porque: 'Captação, conjugação e excreção reduzidas.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↓', porque: 'Trombopoetina hepática reduzida somada ao sequestro esplênico.' },
      { marcador: 'AST/ALT', id: 'ast', direcao: 'relação > 1', porque: 'A relação se inverte na cirrose estabelecida.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓', porque: 'Vasodilatação esplâncnica reduz o volume arterial efetivo e ativa a ADH.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: 'normal ou ↑', porque: 'Pode subestimar a função renal por menor síntese de creatina.' },
    ],
    confirmacao: ['Elastografia ou biópsia; sinais de hipertensão portal à imagem e à endoscopia.', 'Escores de Child-Pugh e MELD estratificam a gravidade.'],
    diferenciais: ['Hepatite crônica sem cirrose', 'Insuficiência hepática aguda', 'Trombose de veia porta'],
    padroes: ['insuficiencia-hepatica'],
    cenario: 'cirrose',
  },

  {
    id: 'hipotireoidismo-primario',
    nome: 'Hipotireoidismo primário',
    sinonimos: ['hipotireoidismo', 'hashimoto'],
    sistemas: ['endocrino'],
    fisiopatologia:
      'A glândula perde capacidade de produzir T4. A queda desinibe a hipófise, cuja resposta é logarítmica — o TSH sobe muito antes de o T4 sair da faixa de referência, o que define a forma subclínica.',
    esperado: [
      { marcador: 'TSH', id: 'tsh', direcao: '↑', porque: 'Perda da retroalimentação negativa sobre a hipófise íntegra.' },
      { marcador: 'T4 livre', id: 't4-livre', direcao: '↓', porque: 'Produção tireoidiana insuficiente.' },
      { marcador: 'Colesterol total', id: 'colesterol-total', direcao: '↑', porque: 'Menor expressão de receptores hepáticos de LDL.' },
      { marcador: 'CK', id: 'ck', direcao: '↑', porque: 'Miopatia hipotireoidiana.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓ nos casos graves', porque: 'Redução do clearance de água livre.' },
      { marcador: 'Prolactina', id: 'prolactina', direcao: '↑ discreta', porque: 'O TRH elevado estimula de forma cruzada o lactotrofo.' },
    ],
    confirmacao: ['TSH elevado com T4 livre baixo, confirmado em segunda dosagem.', 'Anti-TPO para etiologia autoimune.'],
    diferenciais: ['Hipotireoidismo central', 'Síndrome do eutireoidiano doente', 'Interferência por biotina'],
    padroes: ['hipotireoidismo-primario'],
    cenario: 'hipotireoidismo-primario',
  },

  {
    id: 'hipertireoidismo-primario',
    nome: 'Hipertireoidismo primário',
    sinonimos: ['hipertireoidismo', 'graves', 'tireotoxicose'],
    sistemas: ['endocrino'],
    fisiopatologia:
      'A tireoide produz hormônio sem obedecer ao TSH — por autoanticorpo estimulador do receptor (Graves), por autonomia nodular ou por liberação do hormônio estocado numa glândula em destruição (tireoidite).',
    esperado: [
      { marcador: 'TSH', id: 'tsh', direcao: '↓↓', porque: 'Suprimido pelo excesso de hormônio periférico.' },
      { marcador: 'T4 livre', id: 't4-livre', direcao: '↑', porque: 'Produção autônoma ou liberação do estoque.' },
      { marcador: 'T3', id: 't3', direcao: '↑', porque: 'Pode elevar-se isoladamente na tireotoxicose por T3.' },
      { marcador: 'Colesterol total', id: 'colesterol-total', direcao: '↓', porque: 'Catabolismo lipídico acelerado.' },
      { marcador: 'Fosfatase alcalina', id: 'fosfatase-alcalina', direcao: '↑', porque: 'Turnover ósseo aumentado.' },
    ],
    confirmacao: ['TRAb positivo na doença de Graves.', 'Cintilografia com captação alta (Graves, nódulo tóxico) ou baixa (tireoidite destrutiva).'],
    diferenciais: ['Tireoidite subaguda', 'Tireotoxicose factícia', 'Interferência por biotina'],
    padroes: ['hipertireoidismo-primario'],
    cenario: 'hipertireoidismo-primario',
  },

  {
    id: 'cetoacidose-diabetica',
    nome: 'Cetoacidose diabética',
    sinonimos: ['cad', 'cetoacidose'],
    sistemas: ['metabolico', 'endocrino'],
    fisiopatologia:
      'A deficiência de insulina com excesso de hormônios contrarreguladores libera a lipólise; os ácidos graxos são convertidos em cetoácidos no fígado. A hiperglicemia causa diurese osmótica, com desidratação e perda de potássio, fósforo e magnésio.',
    esperado: [
      { marcador: 'Glicemia', id: 'glicemia-jejum', direcao: '↑↑', porque: 'Produção hepática de glicose não suprimida e captação periférica reduzida.' },
      { marcador: 'pH', id: 'ph', direcao: '↓', porque: 'Acúmulo de cetoácidos.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓↓', porque: 'Consumido no tamponamento.' },
      { marcador: 'Ânion gap', id: 'anion-gap', direcao: '↑', porque: 'Beta-hidroxibutirato e acetoacetato são ânions não medidos.' },
      { marcador: 'Potássio', id: 'potassio', direcao: 'normal ou ↑ com déficit corporal', porque: 'Acidose e falta de insulina o deslocam para fora da célula enquanto a diurese osmótica o elimina.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓ (corrigir pela glicemia)', porque: 'A glicose puxa água do intracelular e dilui o sódio.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Desidratação com azotemia pré-renal; o método de Jaffé ainda sofre interferência das cetonas.' },
    ],
    confirmacao: ['Cetonemia ou cetonúria com acidose e hiperglicemia.', 'Buscar o precipitante: infecção, omissão de insulina, infarto.'],
    diferenciais: ['Estado hiperglicêmico hiperosmolar', 'Cetoacidose alcoólica', 'Acidose lática', 'Intoxicações'],
    padroes: ['cetoacidose-diabetica', 'acidose-metabolica-anion-gap-alto'],
    cenario: 'cetoacidose-diabetica',
  },

  {
    id: 'infarto-agudo',
    nome: 'Infarto agudo do miocárdio',
    sinonimos: ['iam', 'infarto', 'sindrome coronariana aguda'],
    sistemas: ['cardiovascular'],
    fisiopatologia:
      'A ruptura ou erosão de placa aterosclerótica desencadeia trombose coronária; o miocárdio a jusante necrosa e libera troponina numa curva de ascensão e queda — que é o que define lesão aguda.',
    esperado: [
      { marcador: 'Troponina', id: 'troponina', direcao: '↑ com variação entre coletas', porque: 'Liberação do pool citoplasmático seguida da degradação do aparelho contrátil.' },
      { marcador: 'CK-MB', id: 'ck-mb', direcao: '↑', porque: 'Isoenzima enriquecida no miocárdio.' },
      { marcador: 'Glicemia', id: 'glicemia-jejum', direcao: '↑', porque: 'Hiperglicemia de estresse por catecolaminas e cortisol.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: 'variável', porque: 'Importa para planejar contraste e ajustar antitrombóticos.' },
    ],
    confirmacao: ['Troponina seriada com delta significativo em contexto clínico de isquemia.', 'Eletrocardiograma seriado e imagem.'],
    diferenciais: ['Miocardite', 'Takotsubo', 'Embolia pulmonar', 'Dissecção de aorta', 'Lesão miocárdica crônica'],
    padroes: ['sindrome-coronariana-aguda'],
    cenario: 'infarto-agudo',
  },

  {
    id: 'sepse',
    nome: 'Sepse',
    sinonimos: ['sepse', 'choque septico', 'infeccao grave'],
    sistemas: ['infeccioso', 'metabolico'],
    fisiopatologia:
      'A resposta desregulada à infecção causa vasodilatação, extravasamento capilar e disfunção microcirculatória, levando a hipoperfusão tecidual e disfunção orgânica múltipla.',
    esperado: [
      { marcador: 'Lactato', id: 'lactato', direcao: '↑', porque: 'A oferta de oxigênio não sustenta o metabolismo aeróbio.' },
      { marcador: 'Leucócitos', id: 'leucocitos', direcao: '↑ ou ↓', porque: 'Leucopenia é sinal de gravidade, não de ausência de infecção.' },
      { marcador: 'Procalcitonina', id: 'procalcitonina', direcao: '↑', porque: 'Endotoxinas induzem sua expressão em tecidos extratireoidianos.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Lesão renal aguda por hipoperfusão e inflamação.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↓', porque: 'Consumo periférico e supressão medular.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑', porque: 'Colestase funcional induzida por citocinas.' },
      { marcador: 'INR', id: 'inr', direcao: '↑', porque: 'Coagulopatia de consumo e falência hepática relativa.' },
    ],
    confirmacao: ['Infecção suspeita ou documentada com disfunção orgânica.', 'Culturas antes do antibiótico — sem atrasar o antibiótico.'],
    diferenciais: ['Choque cardiogênico', 'Choque hipovolêmico', 'Pancreatite grave', 'Insuficiência adrenal'],
    padroes: ['sepse', 'infeccao-bacteriana'],
    cenario: 'sepse',
  },

  {
    id: 'esteatose-hepatica',
    nome: 'Doença hepática gordurosa metabólica',
    sinonimos: ['esteatose', 'esteatose hepatica', 'nash', 'figado gorduroso'],
    sistemas: ['hepatobiliar', 'metabolico'],
    fisiopatologia:
      'A resistência à insulina aumenta o fluxo de ácidos graxos ao fígado e a lipogênese de novo. O acúmulo de triglicerídeos no hepatócito gera lipotoxicidade, estresse oxidativo e inflamação de baixo grau.',
    esperado: [
      { marcador: 'ALT', id: 'alt', direcao: '↑ discreta a moderada', porque: 'Lesão hepatocelular crônica de baixa intensidade.' },
      { marcador: 'AST/ALT', id: 'ast', direcao: 'relação < 1', porque: 'Predomínio da ALT distingue de doença alcoólica; a inversão sugere fibrose avançada.' },
      { marcador: 'GGT', id: 'ggt', direcao: '↑', porque: 'Estresse oxidativo hepático aumenta sua expressão.' },
      { marcador: 'Triglicerídeos', id: 'triglicerideos', direcao: '↑', porque: 'Mesma resistência à insulina que causa a esteatose.' },
      { marcador: 'HDL', id: 'hdl', direcao: '↓', porque: 'Troca lipídica com partículas ricas em triglicerídeos acelera seu catabolismo.' },
      { marcador: 'Ferritina', id: 'ferritina', direcao: '↑', porque: 'Inflamação de baixo grau e esteatose elevam a ferritina sem sobrecarga de ferro.' },
      { marcador: 'Glicemia', id: 'glicemia-jejum', direcao: '↑ ou limítrofe', porque: 'Resistência à insulina subjacente.' },
    ],
    confirmacao: ['Esteatose à imagem com exclusão de álcool, vírus e outras causas.', 'Escores de fibrose (FIB-4, NFS) e elastografia estratificam risco.'],
    diferenciais: ['Doença hepática alcoólica', 'Hepatite C', 'Hemocromatose', 'Hepatite autoimune'],
    padroes: ['hepatocelular'],
    cenario: 'esteatose',
  },

  {
    id: 'hepatopatia-alcoolica',
    nome: 'Doença hepática alcoólica',
    sinonimos: ['hepatite alcoolica', 'hepatopatia alcoolica'],
    sistemas: ['hepatobiliar'],
    fisiopatologia:
      'O metabolismo do etanol gera acetaldeído e estresse oxidativo, com lesão preferencial da mitocôndria — rica em AST — e deficiência funcional de piridoxal-5-fosfato, cofator de que a ALT depende mais. Daí a relação AST/ALT acima de 2.',
    esperado: [
      { marcador: 'AST', id: 'ast', direcao: '↑ (relação AST/ALT > 2)', porque: 'Lesão mitocondrial e deficiência de piridoxal-5-fosfato.' },
      { marcador: 'GGT', id: 'ggt', direcao: '↑↑', porque: 'Indução microssomal pelo etanol.' },
      { marcador: 'VCM', id: 'vcm', direcao: '↑', porque: 'Toxicidade direta sobre o precursor eritroide e alteração lipídica da membrana.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↓', porque: 'Toxicidade direta sobre o megacariócito e hiperesplenismo.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑ na hepatite alcoólica', porque: 'Lesão hepatocelular com colestase associada.' },
      { marcador: 'INR', id: 'inr', direcao: '↑ nos casos graves', porque: 'Comprometimento da síntese de fatores.' },
    ],
    confirmacao: ['História de consumo com padrão laboratorial compatível; GGT normaliza em 2 a 6 semanas de abstinência.'],
    diferenciais: ['Esteatose metabólica', 'Hepatite viral', 'Hepatite medicamentosa'],
    padroes: ['hepatocelular'],
    cenario: 'hepatopatia-alcoolica',
  },
]

export const DOENCA_POR_ID = new Map(DOENCAS.map((d) => [d.id, d]))

/**
 * Comparações lado a lado — a tela "Comparar Diagnósticos".
 *
 * Algumas comparações vivem dentro da ficha do marcador que as motiva (a de
 * ferritina, por exemplo, mora na própria ferritina). As que atravessam vários
 * marcadores moram aqui, para que a tela de comparação tenha um catálogo
 * próprio sem precisar carregar todas as fichas.
 */
export const COMPARACOES: Comparacao[] = [
  {
    id: 'ferropriva-vs-talassemia-vs-doenca-cronica',
    titulo: 'Anemia ferropriva × Talassemia menor × Anemia da inflamação',
    pergunta: 'Três causas de microcitose. O que separa uma da outra?',
    hipoteses: ['Ferropriva', 'Talassemia menor', 'Anemia da inflamação'],
    linhas: [
      { marcador: 'VCM', celulas: ['↓', '↓↓ (desproporcional)', 'normal ou ↓ leve'] },
      { marcador: 'RDW', celulas: ['↑', 'normal', 'normal ou ↑ leve'] },
      { marcador: 'Contagem de hemácias', celulas: ['↓', 'normal ou ↑', '↓'] },
      { marcador: 'Ferritina', celulas: ['↓', 'normal', '↑ ou normal'] },
      { marcador: 'Ferro sérico', celulas: ['↓', 'normal', '↓'] },
      { marcador: 'Transferrina / TIBC', celulas: ['↑', 'normal', '↓'] },
      { marcador: 'Saturação da transferrina', celulas: ['↓↓', 'normal', '↓'] },
      { marcador: 'Eletroforese de Hb', celulas: ['normal', 'HbA2 ↑ (beta)', 'normal'] },
    ],
    leitura:
      'O eixo que resolve é o estoque de ferro. Na ferropriva ele acabou: ferritina baixa, e o corpo fabrica mais transportador para catar o que resta. Na inflamação o ferro existe, mas está sequestrado pela hepcidina dentro do macrófago: ferro sérico baixo com ferritina alta e transferrina baixa. Na talassemia o ferro está normal — o defeito é na globina, e a população é uniformemente pequena, por isso o RDW não sobe.',
    limites: 'Ferropenia e inflamação coexistem com frequência. Nesse cenário, ferritina até 100 ng/mL não afasta deficiência de ferro.',
  },
  {
    id: 'hemolise-vs-perda-vs-producao',
    titulo: 'Hemólise × Perda sanguínea × Produção reduzida',
    pergunta: 'A hemoglobina caiu. Por onde a hemácia se foi — ou nunca chegou a existir?',
    hipoteses: ['Hemólise', 'Perda sanguínea', 'Produção reduzida'],
    linhas: [
      { marcador: 'Reticulócitos', celulas: ['↑↑', '↑ (após 3–5 dias)', '↓ ou inapropriadamente normal'] },
      { marcador: 'LDH', celulas: ['↑', 'normal', 'normal (↑ na megaloblástica)'] },
      { marcador: 'Haptoglobina', celulas: ['↓↓', 'normal', 'normal'] },
      { marcador: 'Bilirrubina indireta', celulas: ['↑', 'normal', 'normal (↑ na megaloblástica)'] },
      { marcador: 'Ferritina', celulas: ['normal ou ↑', '↓ se crônica', 'variável'] },
      { marcador: 'Esfregaço', celulas: ['esquizócitos/esferócitos', 'inespecífico', 'conforme a causa'] },
    ],
    leitura:
      'O reticulócito responde à pergunta "a medula está tentando?". Alto significa medula competente reagindo a uma perda — por destruição ou por sangramento. O que separa hemólise de sangramento é o conteúdo da hemácia no plasma: LDH e bilirrubina indireta sobem e a haptoglobina é consumida somente quando a célula se rompeu dentro do corpo.',
    limites: 'A anemia megaloblástica imita hemólise porque há destruição intramedular — mas com reticulócito baixo.',
  },
  {
    id: 'hepatocelular-vs-colestatico',
    titulo: 'Lesão hepatocelular × Colestase',
    pergunta: 'As enzimas hepáticas subiram. O problema é a célula ou o canalículo?',
    hipoteses: ['Hepatocelular', 'Colestático', 'Misto'],
    linhas: [
      { marcador: 'AST / ALT', celulas: ['↑↑ a ↑↑↑', 'normal ou ↑ leve', '↑'] },
      { marcador: 'Fosfatase alcalina', celulas: ['normal ou ↑ leve', '↑↑', '↑'] },
      { marcador: 'GGT', celulas: ['normal ou ↑ leve', '↑↑', '↑'] },
      { marcador: 'Bilirrubina direta', celulas: ['↑ variável', '↑↑', '↑'] },
      { marcador: 'Relação R', celulas: ['> 5', '< 2', '2 a 5'] },
    ],
    leitura:
      'Acima de R = 5, a lesão é da célula: algo está matando hepatócitos e derramando o citoplasma. Abaixo de 2, o problema é o fluxo biliar: a bile represada induz a síntese das enzimas canaliculares, que são de membrana e aumentam por indução, não por necrose.',
    limites: 'A relação R caracteriza o padrão, não a etiologia. Cálculo impactado pode abrir com padrão hepatocelular puro.',
  },
  {
    id: 'pre-renal-vs-renal-vs-pos-renal',
    titulo: 'Lesão renal pré-renal × renal intrínseca × pós-renal',
    pergunta: 'A creatinina subiu. Falta perfusão, o parênquima está lesado, ou a urina não sai?',
    hipoteses: ['Pré-renal', 'Renal (NTA)', 'Pós-renal'],
    linhas: [
      { marcador: 'Relação ureia/creatinina', celulas: ['> 40', '10–20', 'variável'] },
      { marcador: 'Sódio urinário', celulas: ['< 20 mEq/L', '> 40 mEq/L', 'variável'] },
      { marcador: 'FENa', celulas: ['< 1%', '> 2%', 'variável'] },
      { marcador: 'Densidade urinária', celulas: ['> 1.020', '~1.010', 'variável'] },
      { marcador: 'Sedimento', celulas: ['normal ou cilindros hialinos', 'cilindros granulosos pigmentares', 'normal ou hematúria'] },
      { marcador: 'Ultrassonografia', celulas: ['normal', 'normal ou rins pequenos', 'hidronefrose'] },
    ],
    leitura:
      'O eixo é a capacidade tubular de reabsorver sódio. No pré-renal o túbulo está vivo e ávido: retém sódio, concentra a urina e arrasta ureia junto. Na necrose tubular ele está lesado: perde sódio, não concentra e descama cilindros. No pós-renal a bioquímica urinária é inconclusiva — quem responde é a imagem.',
    limites: 'Diurético invalida sódio urinário e FENa; use a fração de excreção de ureia (< 35% sugere pré-renal).',
  },
  {
    id: 'hipotireoidismo-primario-vs-central',
    titulo: 'Hipotireoidismo primário × central',
    pergunta: 'O T4 livre está baixo. A tireoide falhou ou a hipófise parou de pedir?',
    hipoteses: ['Primário', 'Central'],
    linhas: [
      { marcador: 'TSH', celulas: ['↑', '↓ ou inapropriadamente normal'] },
      { marcador: 'T4 livre', celulas: ['↓', '↓'] },
      { marcador: 'Anti-TPO', celulas: ['frequentemente positivo', 'negativo'] },
      { marcador: 'Demais eixos hipofisários', celulas: ['normais', 'frequentemente comprometidos'] },
      { marcador: 'Conduta', celulas: ['levotiroxina guiada pelo TSH', 'investigar hipófise; repor cortisol antes de levotiroxina'] },
    ],
    leitura:
      'A pergunta é se o TSH está apropriado para aquele T4. Baixo, ele deveria estar alto — e não estar denuncia a hipófise. Detalhe com consequência: no hipotireoidismo central, iniciar levotiroxina antes de repor corticoide pode precipitar crise adrenal.',
  },
  {
    id: 'insuficiencia-adrenal-primaria-vs-secundaria',
    titulo: 'Insuficiência adrenal primária × secundária',
    pergunta: 'O cortisol está baixo. A adrenal falhou ou a hipófise parou de pedir?',
    hipoteses: ['Primária (Addison)', 'Secundária'],
    linhas: [
      { marcador: 'ACTH', celulas: ['↑↑', '↓ ou normal-baixo'] },
      { marcador: 'Hiperpigmentação', celulas: ['presente', 'ausente'] },
      { marcador: 'Aldosterona', celulas: ['↓', 'preservada'] },
      { marcador: 'Potássio', celulas: ['↑', 'normal'] },
      { marcador: 'Sódio', celulas: ['↓', '↓'] },
    ],
    leitura:
      'A hiperpigmentação existe só na primária porque o ACTH elevado deriva da POMC, precursora também do MSH. E a hipercalemia existe só na primária porque a aldosterona depende da angiotensina II, não do ACTH: com a hipófise doente, a zona glomerulosa continua funcionando.',
  },
  {
    id: 'plaquetopenia-mecanismos',
    titulo: 'PTI × CIVD × PTT × Hiperesplenismo',
    pergunta: 'As plaquetas caíram. O que mais mudou junto diz qual é o mecanismo.',
    hipoteses: ['PTI', 'CIVD', 'PTT', 'Hiperesplenismo'],
    linhas: [
      { marcador: 'Plaquetas', celulas: ['↓↓', '↓', '↓↓', '↓ moderada'] },
      { marcador: 'INR / TTPa', celulas: ['normais', 'alargados', 'normais', 'normais'] },
      { marcador: 'Fibrinogênio', celulas: ['normal', '↓', 'normal', 'normal'] },
      { marcador: 'D-dímero', celulas: ['normal', '↑↑', 'normal ou ↑', 'normal'] },
      { marcador: 'Esquizócitos', celulas: ['ausentes', 'presentes', 'presentes', 'ausentes'] },
      { marcador: 'Hemoglobina', celulas: ['normal', '↓', '↓↓', '↓ leve'] },
    ],
    leitura:
      'A pergunta que organiza é: a coagulação está sendo consumida junto? Na CIVD, sim. Na PTT, o consumo é só plaquetário e mecânico — a coagulação plasmática permanece normal enquanto as hemácias são cortadas na microcirculação. Na PTI, nada mais se altera. No hiperesplenismo, tudo é moderado e estável, porque a plaqueta não foi destruída: está retida.',
    limites: 'A síndrome HELLP na gestante pode combinar achados de várias colunas e é diagnóstico de exclusão urgente.',
  },
  {
    id: 'hiponatremia-por-volemia',
    titulo: 'Hiponatremia: hipovolêmica × euvolêmica × hipervolêmica',
    pergunta: 'O sódio está baixo. Falta volume, sobra hormônio, ou sobra água e sal juntos?',
    hipoteses: ['Hipovolêmica', 'Euvolêmica (SIADH)', 'Hipervolêmica'],
    linhas: [
      { marcador: 'Exame clínico', celulas: ['desidratado', 'euvolêmico', 'edemaciado'] },
      { marcador: 'Sódio urinário', celulas: ['< 20 (perda extrarrenal)', '> 40', '< 20'] },
      { marcador: 'Osmolalidade urinária', celulas: ['> 300', '> 100 (inapropriada)', '> 300'] },
      { marcador: 'Ácido úrico', celulas: ['normal ou ↑', '↓', 'normal ou ↑'] },
      { marcador: 'Ureia', celulas: ['↑', '↓ ou normal', '↑'] },
      { marcador: 'Tratamento', celulas: ['salina isotônica', 'restrição hídrica', 'restrição de água e sal'] },
    ],
    leitura:
      'Os três compartilham ADH elevada — o que muda é o motivo. Na hipovolemia ela é apropriada, e vem com ureia e ácido úrico altos, marcas da avidez tubular. No SIADH é inapropriada, e a leve expansão faz o rim excretar sódio e urato: ambos baixos. Na hipervolêmica, o volume total subiu mas o arterial efetivo caiu.',
    limites: 'Diurético invalida o sódio urinário. A avaliação de volemia é a etapa mais subjetiva — na dúvida, a resposta a uma prova de volume separa.',
  },
  {
    id: 'inr-vitamina-k-vs-hepatica',
    titulo: 'INR alargado: deficiência de vitamina K × insuficiência hepática',
    pergunta: 'É falta de vitamina K (corrigível) ou falência de síntese (não corrigível)?',
    hipoteses: ['Deficiência de vitamina K', 'Insuficiência hepática'],
    linhas: [
      { marcador: 'Fator V', celulas: ['normal', '↓'] },
      { marcador: 'Fator VII', celulas: ['↓', '↓'] },
      { marcador: 'Albumina', celulas: ['normal', '↓'] },
      { marcador: 'Resposta à vitamina K parenteral', celulas: ['corrige em 12–24h', 'não corrige'] },
    ],
    leitura:
      'O fator V é o desempate: é hepático mas não depende de vitamina K. Fator V normal com VII baixo significa falta de vitamina K; ambos baixos significam falta de fígado. Na prática, a resposta à vitamina K parenteral resolve a mesma pergunta em 24 horas.',
  },
  {
    id: 'ferritina-alta-diferenciais',
    titulo: 'Ferritina elevada: sobrecarga de ferro × inflamação × hepatopatia',
    pergunta: 'Existe ferro demais, ou existe inflamação escondendo ferro de menos?',
    hipoteses: ['Sobrecarga de ferro', 'Inflamação', 'Hepatopatia'],
    linhas: [
      { marcador: 'Ferritina', celulas: ['↑↑', '↑', '↑'] },
      { marcador: 'Ferro sérico', celulas: ['↑', '↓', 'variável'] },
      { marcador: 'Saturação da transferrina', celulas: ['↑↑ (> 45%)', '↓ (< 20%)', 'variável'] },
      { marcador: 'PCR', celulas: ['normal', '↑', 'variável'] },
      { marcador: 'AST / ALT', celulas: ['↑ leve', 'normais', '↑'] },
    ],
    leitura:
      'A saturação da transferrina é o desempate. Na sobrecarga o ferro transborda e ocupa a transferrina; na inflamação a hepcidina o tranca dentro do macrófago, e a ferritina alta reflete justamente onde ele está preso. Duas ferritinas altas com significados opostos, separadas por um único índice.',
  },
  {
    id: 'lesao-aguda-vs-cronica',
    titulo: 'Troponina: lesão miocárdica aguda × crônica',
    pergunta: 'A troponina está alta. Isso aconteceu agora ou já estava assim?',
    hipoteses: ['Lesão aguda', 'Lesão crônica'],
    linhas: [
      { marcador: 'Delta entre coletas', celulas: ['variação significativa', 'estável'] },
      { marcador: 'Curva', celulas: ['ascensão e/ou queda', 'platô'] },
      { marcador: 'Contexto', celulas: ['dor, ECG alterado, instabilidade', 'assintomático ou sintoma crônico'] },
      { marcador: 'Causas típicas', celulas: ['infarto, miocardite, embolia, sepse', 'DRC, insuficiência cardíaca, hipertrofia'] },
    ],
    leitura:
      'É a segunda dosagem que diagnostica. Lesão aguda tem cinética — o miócito rompeu agora e a concentração está mudando. Lesão crônica tem platô: a taxa de liberação iguala a de depuração.',
  },
  {
    id: 'macrocitose-megaloblastica-vs-nao',
    titulo: 'Macrocitose megaloblástica × não megaloblástica',
    pergunta: 'O VCM subiu. O problema é a síntese de DNA ou outra coisa?',
    hipoteses: ['Megaloblástica', 'Não megaloblástica'],
    linhas: [
      { marcador: 'VCM', celulas: ['frequentemente > 110 fL', 'geralmente 100–110 fL'] },
      { marcador: 'Neutrófilos hipersegmentados', celulas: ['presentes', 'ausentes'] },
      { marcador: 'LDH', celulas: ['↑↑', 'normal'] },
      { marcador: 'Bilirrubina indireta', celulas: ['↑', 'normal'] },
      { marcador: 'Reticulócitos', celulas: ['↓', 'variável'] },
      { marcador: 'B12 / folato', celulas: ['↓', 'normais'] },
    ],
    leitura:
      'A megaloblástica destrói precursores dentro da medula: LDH e bilirrubina indireta sobem — o padrão bioquímico da hemólise — enquanto o reticulócito permanece baixo. Essa combinação não existe em nenhuma outra situação.',
  },
]

export const COMPARACAO_POR_ID = new Map(COMPARACOES.map((c) => [c.id, c]))

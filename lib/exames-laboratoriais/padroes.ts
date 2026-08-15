import type { Padrao } from './tipos'

/**
 * Padrões laboratoriais clássicos.
 *
 * Um padrão não é uma lista de valores alterados: é um conjunto que se explica
 * por um único mecanismo. Reconhecê-lo é o que transforma sete números
 * alterados em uma hipótese. Por isso todo padrão aqui carrega `mecanismo` —
 * a frase que explica por que aqueles marcadores se movem juntos — e
 * `armadilhas`, que é o que imita o padrão sem ser ele.
 */
export const PADROES: Padrao[] = [
  /* ────────────────────────── Hepatobiliar ────────────────────────── */
  {
    id: 'hepatocelular',
    nome: 'Padrão hepatocelular',
    assinatura: 'AST e ALT muito acima de FA e GGT — relação R > 5',
    sistemas: ['hepatobiliar'],
    achados: [
      { marcador: 'ALT', id: 'alt', direcao: '↑↑ a ↑↑↑', porque: 'Citoplasmática e quase exclusiva do hepatócito: vaza primeiro e em maior quantidade.' },
      { marcador: 'AST', id: 'ast', direcao: '↑↑ a ↑↑↑', porque: 'Citoplasmática e mitocondrial; a relação com a ALT sugere a etiologia.' },
      { marcador: 'Fosfatase alcalina', id: 'fosfatase-alcalina', direcao: 'normal ou ↑ leve', porque: 'Não há colestase relevante: a enzima canalicular não é induzida.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑ variável', porque: 'Sobe quando a lesão compromete a captação e a excreção.' },
      { marcador: 'INR', id: 'inr', direcao: 'normal ou ↑', porque: 'Alarga quando a lesão é extensa o bastante para comprometer a síntese.' },
    ],
    mecanismo:
      'A membrana do hepatócito perde integridade e o conteúdo citoplasmático extravasa. A magnitude reflete quantas células foram lesadas — não quanto o fígado ainda funciona. Quem responde por função são a albumina e o INR.',
    causas: ['Hepatites virais agudas', 'Hepatite isquêmica (fígado de choque)', 'Hepatite medicamentosa, com destaque para o paracetamol', 'Doença hepática alcoólica (AST/ALT > 2)', 'Doença hepática gordurosa metabólica', 'Hepatite autoimune', 'Doença de Wilson e hemocromatose'],
    proximoPasso: [
      'Calcule a relação AST/ALT e dose GGT: > 2 com GGT alta sugere álcool.',
      'Avalie função: albumina, INR e plaquetas dizem se há doença crônica por trás.',
      'Sorologias virais, autoanticorpos, ferritina com saturação de transferrina e ceruloplasmina conforme a idade e o contexto.',
      'Elevações acima de 1.000 U/L: pense em viral, isquêmica ou medicamentosa — e cheque paracetamol.',
    ],
    armadilhas: [
      'AST alta com ALT normal quase sempre é músculo, não fígado: dose CK.',
      'Amostra hemolisada eleva AST e LDH sem doença alguma.',
      'Transaminases caindo com bilirrubina subindo e INR alargando não é melhora — pode ser perda de massa hepática funcionante.',
      'Na cirrose estabelecida, as transaminases podem ser normais.',
    ],
    doencas: ['hepatite-aguda', 'esteatose-hepatica', 'hepatopatia-alcoolica'],
  },

  {
    id: 'colestatico',
    nome: 'Padrão colestático',
    assinatura: 'FA e GGT muito acima das transaminases — relação R < 2',
    sistemas: ['hepatobiliar'],
    achados: [
      { marcador: 'Fosfatase alcalina', id: 'fosfatase-alcalina', direcao: '↑↑', porque: 'Os ácidos biliares acumulados induzem sua síntese e a liberam da membrana canalicular.' },
      { marcador: 'GGT', id: 'ggt', direcao: '↑↑', porque: 'Mesma indução canalicular; confirma que a FA veio do fígado.' },
      { marcador: 'Bilirrubina direta', id: 'bilirrubina-direta', direcao: '↑', porque: 'Conjugada e sem via de saída, reflui para o sangue.' },
      { marcador: 'AST / ALT', id: 'alt', direcao: 'normal ou ↑ leve', porque: 'A lesão hepatocelular é secundária e menos intensa.' },
    ],
    mecanismo:
      'O fluxo biliar está bloqueado — mecanicamente (cálculo, tumor, estenose) ou funcionalmente (fármaco, sepse, autoimunidade). A bile represada induz a síntese das enzimas canaliculares e a bilirrubina conjugada reflui, aparecendo na urina (colúria) e faltando nas fezes (acolia).',
    causas: ['Coledocolitíase', 'Neoplasia periampular e de cabeça de pâncreas', 'Colangite biliar primária (anticorpo antimitocôndria positivo)', 'Colangite esclerosante primária', 'Colestase medicamentosa (amoxicilina-clavulanato, anabolizantes, estrogênios)', 'Colestase da sepse e da nutrição parenteral', 'Lesões infiltrativas hepáticas'],
    proximoPasso: [
      'Ultrassonografia de vias biliares: dilatada aponta obstrução extra-hepática; não dilatada aponta causa intra-hepática.',
      'Se houver febre, dor e icterícia, considere colangite — é emergência e exige drenagem.',
      'Sem dilatação: anticorpo antimitocôndria, revisão de medicamentos e, se necessário, colangiorressonância.',
    ],
    armadilhas: [
      'FA alta com GGT normal não é fígado: é osso, placenta ou intestino.',
      'FA elevada com bilirrubina normal sugere lesão infiltrativa hepática — pede imagem.',
      'Cálculo impactado pode produzir, nas primeiras horas, transaminases acima de 1.000 U/L antes de virar colestático.',
      'A FA tem meia-vida de 7 dias: permanece elevada por 1 a 2 semanas após a desobstrução.',
    ],
    doencas: ['colestase'],
  },

  {
    id: 'insuficiencia-hepatica',
    nome: 'Insuficiência hepática',
    assinatura: 'INR alargado com albumina baixa e bilirrubina elevada',
    sistemas: ['hepatobiliar'],
    achados: [
      { marcador: 'INR', id: 'inr', direcao: '↑', porque: 'O fator VII tem meia-vida de 6 horas: é o primeiro a faltar quando a síntese cai.' },
      { marcador: 'Albumina', id: 'albumina', direcao: '↓', porque: 'Meia-vida de 20 dias: sua queda denuncia cronicidade.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑', porque: 'Captação, conjugação e excreção comprometidas.' },
      { marcador: 'Amônia', id: 'amonia', direcao: '↑', porque: 'O ciclo da ureia é hepático: sem fígado, a amônia se acumula.' },
      { marcador: 'Ureia', id: 'ureia', direcao: '↓', porque: 'Pelo mesmo motivo: a ureia é o produto do ciclo que falhou.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↓', porque: 'Trombopoetina hepática reduzida somada ao hiperesplenismo da hipertensão portal.' },
    ],
    mecanismo:
      'A massa hepatocitária funcionante caiu abaixo do necessário para sintetizar proteínas e detoxificar. A ordem em que os marcadores se alteram data a lesão: INR alargado com albumina normal sugere quadro agudo; ambos alterados, doença crônica.',
    causas: ['Insuficiência hepática aguda (viral, medicamentosa, isquêmica, autoimune)', 'Cirrose descompensada de qualquer etiologia', 'Síndrome de Budd-Chiari', 'Esteato-hepatite aguda alcoólica grave'],
    proximoPasso: [
      'INR ≥ 1,5 com encefalopatia em paciente sem cirrose prévia define insuficiência hepática aguda: avaliação para transplante.',
      'Diferencie deficiência de vitamina K pela dosagem do fator V ou pela resposta à vitamina K parenteral.',
      'Investigue precipitantes de descompensação: infecção, sangramento, constipação, distúrbio eletrolítico.',
    ],
    armadilhas: [
      'INR alargado nem sempre é fígado: deficiência de vitamina K corrige com reposição, insuficiência hepática não.',
      'Albumina baixa não é só desnutrição — é reagente de fase aguda negativo e cai em qualquer doença grave.',
      'Ureia baixa em hepatopata não indica rim saudável: indica ciclo da ureia falhando.',
    ],
    doencas: ['cirrose'],
  },

  /* ────────────────────────── Hematológico ────────────────────────── */
  {
    id: 'anemia-microcitica-hipocromica',
    nome: 'Anemia microcítica e hipocrômica',
    assinatura: 'Hb ↓, VCM ↓, HCM ↓ — com ou sem RDW alto',
    sistemas: ['hematologico'],
    achados: [
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓', porque: 'A síntese de hemoglobina por célula está limitada.' },
      { marcador: 'VCM', id: 'vcm', direcao: '↓', porque: 'O precursor divide-se mais vezes tentando atingir a concentração-alvo de hemoglobina.' },
      { marcador: 'HCM', id: 'hcm', direcao: '↓', porque: 'Menos hemoglobina cabe numa célula menor e mal hemoglobinizada.' },
      { marcador: 'RDW', id: 'rdw', direcao: '↑ na ferropenia; normal na talassemia', porque: 'A ferropenia cria duas populações; na talassemia, todas as células são igualmente pequenas.' },
    ],
    mecanismo:
      'Falta matéria-prima para encher a célula de hemoglobina — ferro (ferropenia), ferro disponível (inflamação) ou cadeias de globina (talassemia). O precursor executa divisões extras e sai menor.',
    causas: ['Anemia ferropriva', 'Talassemias', 'Anemia da inflamação em fase avançada', 'Anemia sideroblástica', 'Intoxicação por chumbo'],
    proximoPasso: [
      'Ferritina: baixa fecha ferropenia; alta com saturação baixa aponta inflamação.',
      'Contagem de hemácias e RDW: normais ou altos com VCM muito baixo sugerem talassemia.',
      'Confirmada a ferropenia, investigue a fonte da perda — obrigatoriamente o trato digestivo em homens e em mulheres na pós-menopausa.',
      'Eletroforese de hemoglobina quando a suspeita for de talassemia.',
    ],
    armadilhas: [
      'Ferritina normal não afasta ferropenia quando há inflamação: valores até 100 ng/mL ainda são compatíveis.',
      'Deficiência combinada de ferro e B12 pode produzir VCM normal com RDW muito alto.',
      'Reposição de ferro iniciada antes da coleta eleva o ferro sérico e mascara o quadro.',
    ],
    doencas: ['anemia-ferropriva', 'talassemia-menor', 'anemia-doenca-cronica'],
  },

  {
    id: 'anemia-macrocitica',
    nome: 'Anemia macrocítica',
    assinatura: 'Hb ↓ com VCM ↑',
    sistemas: ['hematologico'],
    achados: [
      { marcador: 'VCM', id: 'vcm', direcao: '↑', porque: 'O núcleo amadurece mais devagar que o citoplasma, ou a população circulante é jovem.' },
      { marcador: 'LDH', id: 'ldh', direcao: '↑↑ na megaloblástica', porque: 'A eritropoese ineficaz destrói precursores dentro da própria medula.' },
      { marcador: 'Bilirrubina indireta', id: 'bilirrubina-indireta', direcao: '↑ na megaloblástica', porque: 'Mesma destruição intramedular libera heme para degradação.' },
      { marcador: 'Reticulócitos', id: 'reticulocitos', direcao: '↓ na megaloblástica', porque: 'A medula produz, mas os precursores morrem antes de sair.' },
    ],
    mecanismo:
      'Na forma megaloblástica, falta cofator para a síntese de DNA (B12, folato ou bloqueio farmacológico): o núcleo atrasa e o citoplasma cresce. Na não megaloblástica, o defeito é de membrana (álcool, hepatopatia) ou a população circulante é jovem (reticulocitose).',
    causas: ['Deficiência de B12 ou folato', 'Alcoolismo', 'Hepatopatia', 'Hipotireoidismo', 'Medicamentos (hidroxiureia, metotrexato, zidovudina)', 'Síndrome mielodisplásica', 'Reticulocitose intensa'],
    proximoPasso: [
      'Dose B12 e folato; se limítrofes, ácido metilmalônico e homocisteína.',
      'Procure neutrófilos hipersegmentados no esfregaço — confirmam megaloblastose.',
      'LDH e bilirrubina indireta altos com reticulócitos baixos são a assinatura da eritropoese ineficaz.',
      'Macrocitose persistente sem causa nutricional, alcoólica ou medicamentosa em idoso pede avaliação medular.',
    ],
    armadilhas: [
      'Repor folato sem excluir deficiência de B12 corrige a anemia e permite a progressão da lesão neurológica.',
      'Sintomas neurológicos de deficiência de B12 podem preceder qualquer alteração do hemograma.',
      'A megaloblástica imita hemólise bioquimicamente — o reticulócito baixo a desmascara.',
    ],
    doencas: ['anemia-megaloblastica'],
  },

  {
    id: 'hemolise',
    nome: 'Padrão de hemólise',
    assinatura: 'Reticulócitos ↑, LDH ↑, haptoglobina ↓, bilirrubina indireta ↑',
    sistemas: ['hematologico'],
    achados: [
      { marcador: 'Reticulócitos', id: 'reticulocitos', direcao: '↑↑', porque: 'A medula competente responde à perda periférica de hemácias.' },
      { marcador: 'LDH', id: 'ldh', direcao: '↑', porque: 'A hemácia é riquíssima em LDH; sua ruptura a libera.' },
      { marcador: 'Haptoglobina', id: 'haptoglobina', direcao: '↓↓', porque: 'É consumida ao capturar a hemoglobina livre e removida junto com ela.' },
      { marcador: 'Bilirrubina indireta', id: 'bilirrubina-indireta', direcao: '↑', porque: 'A produção de bilirrubina excede a capacidade hepática de conjugação.' },
    ],
    mecanismo:
      'A hemácia é destruída antes dos 120 dias. Cada achado é consequência direta disso: o conteúdo citoplasmático aparece no plasma, a haptoglobina é gasta capturando hemoglobina livre, o heme degradado vira bilirrubina indireta e a medula acelera a produção.',
    causas: ['Anemia hemolítica autoimune', 'Microangiopatias trombóticas (PTT, SHU, CIVD)', 'Esferocitose hereditária', 'Anemia falciforme e outras hemoglobinopatias', 'Deficiência de G6PD', 'Hemólise medicamentosa', 'Prótese valvar mecânica'],
    proximoPasso: [
      'Coombs direto: positivo indica hemólise imune.',
      'Esfregaço: esquizócitos apontam microangiopatia; esferócitos apontam autoimune ou esferocitose.',
      'Anemia hemolítica com plaquetopenia e esquizócitos é emergência — PTT exige plasmaférese.',
      'CHCM elevada sugere esferocitose.',
    ],
    armadilhas: [
      'A haptoglobina é reagente de fase aguda: pode estar "normal" em paciente inflamado apesar de hemólise ativa.',
      'A anemia megaloblástica reproduz o padrão bioquímico com reticulócito baixo.',
      'Amostra hemolisada na coleta eleva LDH e potássio sem hemólise in vivo.',
    ],
    doencas: ['hemolise-autoimune'],
  },

  {
    id: 'anemia-doenca-cronica',
    nome: 'Anemia da inflamação',
    assinatura: 'Anemia normocítica com ferritina alta, ferro baixo e saturação baixa',
    sistemas: ['hematologico', 'imunologico'],
    achados: [
      { marcador: 'Ferritina', id: 'ferritina', direcao: '↑ ou normal', porque: 'É reagente de fase aguda e reflete o ferro sequestrado dentro do macrófago.' },
      { marcador: 'Ferro sérico', id: 'ferro-serico', direcao: '↓', porque: 'A hepcidina degrada a ferroportina e o ferro não sai do macrófago.' },
      { marcador: 'Transferrina', id: 'transferrina', direcao: '↓', porque: 'Reagente de fase aguda negativo: a IL-6 desvia a síntese hepática.' },
      { marcador: 'PCR', id: 'pcr', direcao: '↑', porque: 'Marca a inflamação que dispara todo o mecanismo.' },
    ],
    mecanismo:
      'A IL-6 estimula a produção hepática de hepcidina, que internaliza a ferroportina — o único canal de saída do ferro do enterócito e do macrófago. O ferro existe no corpo, mas fica preso: o eritroblasto não o recebe. É o oposto da ferropenia, e por isso o ferro oral funciona mal aqui.',
    causas: ['Infecções crônicas', 'Doenças reumatológicas', 'Neoplasias', 'Doença renal crônica', 'Insuficiência cardíaca', 'Obesidade'],
    proximoPasso: [
      'Confirme a inflamação com PCR e VHS.',
      'Se houver suspeita de ferropenia associada, considere que ferritina até 100 ng/mL não a afasta.',
      'Tratar a doença de base é o que reverte — a reposição isolada de ferro tem eficácia limitada.',
    ],
    armadilhas: ['Ferropenia e inflamação coexistem com frequência, sobretudo em doença inflamatória intestinal e neoplasia.', 'Ferritina normal em paciente inflamado pode significar ferropenia real.'],
    doencas: ['anemia-doenca-cronica'],
  },

  {
    id: 'infeccao-bacteriana',
    nome: 'Padrão de infecção bacteriana',
    assinatura: 'Neutrofilia com desvio à esquerda, PCR e procalcitonina elevadas',
    sistemas: ['infeccioso', 'hematologico'],
    achados: [
      { marcador: 'Neutrófilos', id: 'neutrofilos', direcao: '↑ com bastonetes', porque: 'O G-CSF libera o pool medular de reserva; a demanda excede a oferta madura.' },
      { marcador: 'PCR', id: 'pcr', direcao: '↑↑', porque: 'A IL-6 induz sua síntese hepática em horas.' },
      { marcador: 'Procalcitonina', id: 'procalcitonina', direcao: '↑', porque: 'Endotoxina e IL-1β induzem sua expressão em tecidos extratireoidianos.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↑ (reativa) ou ↓ (sepse)', porque: 'A IL-6 estimula a trombopoetina; no consumo séptico, caem.' },
    ],
    mecanismo:
      'O reconhecimento de padrões microbianos dispara IL-1, TNF e IL-6, que aceleram a granulopoese, liberam o pool medular e reprogramam a síntese hepática para proteínas de fase aguda.',
    causas: ['Pneumonia', 'Infecção urinária alta', 'Infecção de partes moles', 'Abscessos', 'Colangite', 'Endocardite'],
    proximoPasso: [
      'Colha culturas antes do antibiótico — uma dose prévia reduz drasticamente o rendimento.',
      'Dose lactato: mede perfusão e prediz mortalidade.',
      'Acompanhe pela tendência: PCR que não cai em 48 a 72 horas sugere foco não drenado ou agente inadequado.',
    ],
    armadilhas: [
      'Leucopenia na sepse é sinal de gravidade, não de ausência de infecção.',
      'Corticoide produz neutrofilia com linfopenia e eosinopenia sem infecção alguma.',
      'Anti-IL-6 (tocilizumabe) zera a PCR mesmo com infecção ativa.',
    ],
    doencas: ['sepse'],
  },

  {
    id: 'infeccao-viral',
    nome: 'Padrão de infecção viral',
    assinatura: 'Leucócitos normais ou baixos, linfocitose com atipia, procalcitonina baixa',
    sistemas: ['infeccioso', 'hematologico'],
    achados: [
      { marcador: 'Leucócitos', id: 'leucocitos', direcao: 'normal ou ↓', porque: 'A resposta antiviral não expande a linhagem neutrofílica.' },
      { marcador: 'Linfócitos', id: 'linfocitos', direcao: '↑ com atipia', porque: 'Clones T ativados proliferam e circulam como linfócitos atípicos.' },
      { marcador: 'Procalcitonina', id: 'procalcitonina', direcao: 'baixa', porque: 'O interferon-gama inibe a expressão do gene CALC-1.' },
      { marcador: 'ALT', id: 'alt', direcao: '↑ em algumas viroses', porque: 'Hepatite associada — mononucleose, CMV, hepatites virais, dengue.' },
    ],
    mecanismo:
      'A resposta antiviral é predominantemente celular e mediada por interferon, que expande linfócitos e suprime a produção de procalcitonina — exatamente o oposto do que ocorre na infecção bacteriana.',
    causas: ['Mononucleose infecciosa', 'CMV', 'Dengue e outras arboviroses', 'Hepatites virais', 'Infecções respiratórias virais', 'HIV agudo'],
    proximoPasso: [
      'Sorologias conforme a suspeita, respeitando a janela imunológica.',
      'Na dengue, acompanhe plaquetas e hematócrito — a hemoconcentração marca extravasamento plasmático.',
      'Linfocitose com atipia e transaminases elevadas em jovem: pesquisar EBV e CMV.',
    ],
    armadilhas: ['Leucograma normal não afasta infecção viral.', 'Sorologia colhida na janela imunológica dá falso-negativo — em exposição recente, use teste molecular.'],
  },

  /* ────────────────────────── Renal e ácido-base ────────────────────────── */
  {
    id: 'lesao-renal-aguda',
    nome: 'Lesão renal aguda',
    assinatura: 'Creatinina em elevação com potássio alto e bicarbonato baixo',
    sistemas: ['renal'],
    achados: [
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑ (aumento ≥ 0,3 mg/dL em 48h)', porque: 'A filtração caiu e a produção contínua se acumula.' },
      { marcador: 'Ureia', id: 'ureia', direcao: '↑', porque: 'Mesma retenção, acrescida da reabsorção tubular quando há hipovolemia.' },
      { marcador: 'Potássio', id: 'potassio', direcao: '↑', porque: 'A secreção distal depende de fluxo tubular e de aldosterona, ambos comprometidos.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓', porque: 'A regeneração renal de bicarbonato e a excreção de H⁺ caem.' },
    ],
    mecanismo:
      'A queda abrupta da filtração retém produtos nitrogenados, potássio e ácidos. A causa pode ser pré-renal (perfusão), renal (parênquima) ou pós-renal (obstrução) — e os índices urinários separam as três.',
    causas: ['Hipovolemia e choque', 'Necrose tubular aguda (isquemia, sepse, contraste, rabdomiólise)', 'Nefrotóxicos (AINEs, aminoglicosídeos, vancomicina, contraste)', 'Obstrução urinária', 'Glomerulonefrites', 'Síndrome cardiorrenal e hepatorrenal'],
    proximoPasso: [
      'Ultrassonografia: hidronefrose muda tudo e é a causa mais rapidamente reversível.',
      'Sódio urinário, FENa e sedimento localizam pré-renal versus tubular.',
      'Revise todas as medicações nefrotóxicas e a volemia.',
      'Hipercalemia com alteração eletrocardiográfica é emergência imediata.',
    ],
    armadilhas: [
      'Creatinina "normal" em idoso sarcopênico pode esconder TFG muito reduzida.',
      'Trimetoprima e cimetidina elevam a creatinina sem reduzir a filtração.',
      'Diurético invalida a FENa: use a fração de excreção de ureia.',
    ],
    doencas: ['lesao-renal-aguda-pre-renal', 'necrose-tubular-aguda'],
  },

  {
    id: 'sindrome-uremica',
    nome: 'Doença renal crônica avançada',
    assinatura: 'TFG reduzida com anemia, hiperfosfatemia, PTH alto e acidose',
    sistemas: ['renal', 'metabolico'],
    achados: [
      { marcador: 'TFG', id: 'tfg', direcao: '↓ por mais de 3 meses', porque: 'Perda progressiva e irreversível de néfrons.' },
      { marcador: 'Hemoglobina', id: 'hemoglobina', direcao: '↓', porque: 'A massa de células produtoras de eritropoetina diminuiu.' },
      { marcador: 'Fósforo', id: 'fosforo', direcao: '↑', porque: 'A excreção renal de fosfato depende da filtração.' },
      { marcador: 'PTH', id: 'pth', direcao: '↑', porque: 'Hiperfosfatemia e queda do calcitriol estimulam a paratireoide.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓', porque: 'Menor excreção de ácidos fixos e menor regeneração de bicarbonato.' },
    ],
    mecanismo:
      'Cada função do néfron se perde junto: excretar nitrogênio, potássio e fosfato; regenerar bicarbonato; ativar vitamina D; produzir eritropoetina. O conjunto é o que distingue doença crônica de lesão aguda.',
    causas: ['Nefropatia diabética', 'Nefroesclerose hipertensiva', 'Glomerulopatias crônicas', 'Doença renal policística', 'Uropatia obstrutiva crônica'],
    proximoPasso: [
      'Estadie por TFG e albuminúria — os dois eixos da classificação KDIGO.',
      'Rastreie as complicações: anemia, distúrbio mineral e ósseo, acidose e hipercalemia.',
      'Ajuste doses de fármacos de excreção renal e evite nefrotóxicos.',
    ],
    armadilhas: ['Anemia normocítica com rins pequenos à ultrassonografia sugere cronicidade, mesmo sem exames anteriores.', 'A TFG estimada não vale em paciente instável — exige estado estável.'],
    doencas: ['doenca-renal-cronica'],
  },

  {
    id: 'acidose-metabolica-anion-gap-alto',
    nome: 'Acidose metabólica com ânion gap aumentado',
    assinatura: 'pH ↓, bicarbonato ↓, ânion gap ↑',
    sistemas: ['metabolico', 'renal', 'respiratorio'],
    achados: [
      { marcador: 'pH', id: 'ph', direcao: '↓', porque: 'Um ácido se acumulou além da capacidade de tamponamento.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓', porque: 'Foi consumido tamponando o H⁺ do ácido acumulado.' },
      { marcador: 'Ânion gap', id: 'anion-gap', direcao: '↑', porque: 'O ânion acompanhante do ácido ocupa o lugar do bicarbonato e não é medido.' },
      { marcador: 'PaCO₂', id: 'paco2', direcao: '↓ (compensação)', porque: 'A hiperventilação elimina CO₂ para elevar o pH.' },
    ],
    mecanismo:
      'Um ácido fixo se acumula. O bicarbonato o tampona e é consumido; o ânion correspondente permanece no plasma sem ser medido, e a diferença aparece como gap aumentado.',
    causas: ['Acidose lática (choque, sepse, isquemia, metformina)', 'Cetoacidose diabética ou alcoólica', 'Uremia', 'Intoxicação por metanol, etilenoglicol ou salicilato', 'Rabdomiólise'],
    proximoPasso: [
      'Dose lactato e cetonas: eles explicam a maioria dos casos.',
      'Se nenhum dos dois explicar, calcule o gap osmolar e considere intoxicação.',
      'Corrija o gap pela albumina — sem isso, o diagnóstico se perde justamente nos pacientes mais graves.',
      'Calcule o delta-gap para descobrir distúrbios mistos.',
    ],
    armadilhas: ['Hipoalbuminemia mascara o gap aumentado.', 'A fita de cetonas detecta acetoacetato: no início da cetoacidose predomina beta-hidroxibutirato e ela subestima.'],
    doencas: ['cetoacidose-diabetica', 'sepse'],
  },

  {
    id: 'acidose-metabolica-hiperclorenica',
    nome: 'Acidose metabólica com ânion gap normal',
    assinatura: 'pH ↓, bicarbonato ↓, cloro ↑, ânion gap normal',
    sistemas: ['metabolico', 'renal'],
    achados: [
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓', porque: 'Foi perdido pelo intestino ou pelo rim.' },
      { marcador: 'Cloro', id: 'cloro', direcao: '↑', porque: 'É retido para manter a eletroneutralidade no lugar do bicarbonato.' },
      { marcador: 'Ânion gap', id: 'anion-gap', direcao: 'normal', porque: 'Nenhum ânion novo foi acrescentado — houve apenas troca.' },
    ],
    mecanismo:
      'O bicarbonato sai do corpo e o cloro ocupa seu lugar. Como nenhum ânion não medido foi acrescentado, o gap permanece normal — e é isso que separa este grupo do anterior.',
    causas: ['Diarreia', 'Acidose tubular renal tipos 1, 2 e 4', 'Infusão de grandes volumes de salina 0,9%', 'Fístulas pancreáticas e biliares', 'Inibidores da anidrase carbônica'],
    proximoPasso: [
      'Calcule o ânion gap urinário: negativo aponta perda intestinal; positivo aponta acidose tubular renal.',
      'Avalie o potássio: baixo nas acidoses tubulares tipos 1 e 2; alto no tipo 4.',
      'Revise volume e composição dos fluidos infundidos.',
    ],
    armadilhas: ['Ressuscitação volêmica com salina 0,9% em grande volume produz essa acidose de forma iatrogênica — soluções balanceadas a evitam.'],
  },

  {
    id: 'acidose-respiratoria',
    nome: 'Acidose respiratória',
    assinatura: 'pH ↓ com PaCO₂ ↑',
    sistemas: ['respiratorio'],
    achados: [
      { marcador: 'PaCO₂', id: 'paco2', direcao: '↑', porque: 'A ventilação alveolar não elimina o CO₂ produzido.' },
      { marcador: 'pH', id: 'ph', direcao: '↓', porque: 'O CO₂ retido gera ácido carbônico.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: 'normal (aguda) ou ↑ (crônica)', porque: 'A compensação renal leva de 3 a 5 dias para se estabelecer.' },
    ],
    mecanismo:
      'A bomba respiratória falha — por depressão central, doença neuromuscular, obstrução ou fadiga. O bicarbonato é quem data o distúrbio: normal significa agudo; elevado significa que houve tempo para o rim compensar.',
    causas: ['DPOC exacerbado', 'Depressão do centro respiratório (opioides, sedativos)', 'Doenças neuromusculares', 'Obesidade grave com hipoventilação', 'Fadiga muscular respiratória'],
    proximoPasso: [
      'Distinga agudo de crônico pelo bicarbonato — a conduta muda por completo.',
      'Em asma ou DPOC exacerbados, PaCO₂ normal em paciente taquipneico já é sinal de alarme.',
      'Considere ventilação não invasiva antes que a fadiga se estabeleça.',
    ],
    armadilhas: ['Oferecer oxigênio em alta fração no retentor crônico pode agravar a hipercapnia: titule para alvos de saturação.'],
  },

  {
    id: 'alcalose-metabolica',
    nome: 'Alcalose metabólica',
    assinatura: 'pH ↑ com bicarbonato ↑, geralmente com hipocalemia e hipocloremia',
    sistemas: ['metabolico', 'renal'],
    achados: [
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↑', porque: 'Perda de H⁺ ou ganho de base, com reabsorção mantida por contração volêmica.' },
      { marcador: 'Cloro', id: 'cloro', direcao: '↓', porque: 'Perdido junto com o H⁺ no suco gástrico ou pelo diurético.' },
      { marcador: 'Potássio', id: 'potassio', direcao: '↓', porque: 'A aldosterona ativada pela hipovolemia troca sódio por potássio no coletor.' },
    ],
    mecanismo:
      'Perde-se ácido (vômito, diurético) e a contração volêmica impede o rim de excretar o bicarbonato excedente. A hipocalemia e a hipocloremia perpetuam o quadro — por isso a correção passa por repor volume, cloro e potássio.',
    causas: ['Vômitos e aspiração nasogástrica', 'Diuréticos de alça e tiazídicos', 'Hiperaldosteronismo primário', 'Síndrome de Cushing', 'Administração de álcalis'],
    proximoPasso: [
      'Dose cloro urinário: baixo indica alcalose responsiva a cloreto (corrige com salina); alto sugere excesso mineralocorticoide.',
      'Corrija potássio e magnésio junto — sem isso a alcalose se mantém.',
      'Hipertensão com hipocalemia espontânea: rastreie hiperaldosteronismo com a relação aldosterona/renina.',
    ],
    armadilhas: ['A perda de potássio no vômito é pequena: quem o elimina é o rim, pela alcalose e pelo hiperaldosteronismo secundário.'],
  },

  {
    id: 'siadh',
    nome: 'SIADH',
    assinatura: 'Hiponatremia euvolêmica com urina concentrada e sódio urinário alto',
    sistemas: ['renal', 'endocrino'],
    achados: [
      { marcador: 'Sódio', id: 'sodio', direcao: '↓', porque: 'Retenção de água livre dilui o sódio plasmático.' },
      { marcador: 'Osmolalidade urinária', id: 'osmolalidade-urinaria', direcao: '> 100 mOsm/kg (inapropriadamente alta)', porque: 'A ADH está agindo apesar da hipo-osmolalidade plasmática.' },
      { marcador: 'Sódio urinário', id: 'sodio-urinario', direcao: '> 40 mEq/L', porque: 'A volemia está normal ou levemente expandida: o rim excreta sódio normalmente.' },
      { marcador: 'Ácido úrico', id: 'acido-urico', direcao: '↓', porque: 'A expansão discreta aumenta a excreção tubular de urato.' },
    ],
    mecanismo:
      'A ADH é secretada sem estímulo osmótico ou volêmico. O rim retém água livre, o sódio dilui, e a leve expansão de volume aumenta a excreção de sódio e de ácido úrico — daí os achados urinários aparentemente paradoxais.',
    causas: ['Neoplasias, sobretudo carcinoma de pequenas células do pulmão', 'Doenças do sistema nervoso central', 'Pneumopatias', 'Fármacos (ISRS, carbamazepina, antipsicóticos)', 'Dor, náusea e pós-operatório'],
    proximoPasso: [
      'Exclua hipotireoidismo e insuficiência adrenal antes de firmar o diagnóstico — é de exclusão.',
      'Avalie a volemia com cuidado: é a etapa mais subjetiva e a que mais erra.',
      'Restrição hídrica é o tratamento; salina isotônica pode piorar.',
      'Corrija devagar: no máximo 8 a 10 mEq/L em 24 horas.',
    ],
    armadilhas: ['Diurético em uso invalida o sódio urinário.', 'Correção rápida demais causa desmielinização osmótica, muitas vezes irreversível.'],
  },

  /* ────────────────────────── Endócrino e cardíaco ────────────────────────── */
  {
    id: 'hipotireoidismo-primario',
    nome: 'Hipotireoidismo primário',
    assinatura: 'TSH ↑ com T4 livre ↓',
    sistemas: ['endocrino'],
    achados: [
      { marcador: 'TSH', id: 'tsh', direcao: '↑', porque: 'A hipófise, íntegra, cobra da glândula que falhou.' },
      { marcador: 'T4 livre', id: 't4-livre', direcao: '↓', porque: 'A tireoide não produz o suficiente.' },
      { marcador: 'Colesterol total', id: 'colesterol-total', direcao: '↑', porque: 'A expressão de receptores de LDL depende de hormônio tireoidiano.' },
      { marcador: 'CK', id: 'ck', direcao: '↑', porque: 'Miopatia hipotireoidiana com alteração do metabolismo muscular.' },
    ],
    mecanismo:
      'A glândula perde capacidade de produzir T4; a queda desinibe a hipófise, que eleva o TSH. Como a relação entre eles é logarítmica, o TSH sobe muito antes de o T4 sair da faixa — o que define a forma subclínica.',
    causas: ['Tireoidite de Hashimoto', 'Pós-tireoidectomia ou pós-iodo radioativo', 'Deficiência de iodo', 'Medicamentos (amiodarona, lítio, inibidores de tirosina-quinase)'],
    proximoPasso: ['Dose anti-TPO para confirmar etiologia autoimune.', 'Reponha levotiroxina e reavalie o TSH em 6 a 8 semanas.', 'Na forma subclínica, repita antes de tratar e individualize por idade e sintomas.'],
    armadilhas: ['O TSH sobe fisiologicamente com a idade — tratar todo idoso com TSH de 5 é sobretratamento.', 'Doença aguda altera o eixo sem doença tireoidiana.', 'Biotina em alta dose falseia o painel inteiro.'],
    doencas: ['hipotireoidismo-primario'],
  },

  {
    id: 'hipertireoidismo-primario',
    nome: 'Hipertireoidismo primário',
    assinatura: 'TSH ↓↓ com T4 livre e/ou T3 ↑',
    sistemas: ['endocrino'],
    achados: [
      { marcador: 'TSH', id: 'tsh', direcao: '↓↓', porque: 'O excesso de hormônio periférico suprime a hipófise.' },
      { marcador: 'T4 livre', id: 't4-livre', direcao: '↑', porque: 'A glândula produz de forma autônoma ou libera hormônio pré-formado.' },
      { marcador: 'T3', id: 't3', direcao: '↑', porque: 'Pode elevar-se isoladamente — a tireotoxicose por T3.' },
      { marcador: 'Colesterol total', id: 'colesterol-total', direcao: '↓', porque: 'O catabolismo lipídico está acelerado.' },
    ],
    mecanismo: 'A tireoide produz hormônio sem obedecer ao TSH — por autoanticorpo estimulador (Graves), por autonomia nodular ou por liberação de hormônio estocado (tireoidite destrutiva).',
    causas: ['Doença de Graves', 'Bócio multinodular tóxico', 'Adenoma tóxico', 'Tireoidite subaguda ou pós-parto', 'Excesso de levotiroxina'],
    proximoPasso: ['TRAb e cintilografia separam Graves de tireoidite destrutiva — a conduta é oposta.', 'Tireoglobulina baixa sugere origem exógena.', 'Avalie repercussão cardíaca: fibrilação atrial é complicação frequente.'],
    armadilhas: ['Na tireoidite destrutiva, antitireoidianos não funcionam: não há síntese aumentada, e sim liberação do estoque.', 'Biotina produz padrão que imita tireotoxicose.'],
    doencas: ['hipertireoidismo-primario'],
  },

  {
    id: 'insuficiencia-adrenal',
    nome: 'Insuficiência adrenal',
    assinatura: 'Cortisol baixo com hiponatremia — e hipercalemia quando é primária',
    sistemas: ['endocrino', 'metabolico'],
    achados: [
      { marcador: 'Cortisol', id: 'cortisol', direcao: '↓', porque: 'A adrenal não produz ou não é estimulada.' },
      { marcador: 'ACTH', id: 'acth', direcao: '↑ na primária, ↓ na secundária', porque: 'É o marcador que localiza a lesão.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓', porque: 'Falta cortisol para suprimir a ADH; na primária, soma-se a perda renal de sódio.' },
      { marcador: 'Potássio', id: 'potassio', direcao: '↑ apenas na primária', porque: 'A aldosterona falta somente quando a própria adrenal está destruída.' },
      { marcador: 'Eosinófilos', id: 'eosinofilos', direcao: '↑', porque: 'O cortisol suprime eosinófilos; sem ele, eles sobem.' },
    ],
    mecanismo:
      'Sem cortisol, perdem-se a gliconeogênese, o tônus vascular e a supressão da ADH. Na forma primária, a destruição adrenal leva junto a zona glomerulosa e a aldosterona — daí a hipercalemia, que a forma secundária não tem.',
    causas: ['Suspensão abrupta de corticoide crônico (a mais comum)', 'Adrenalite autoimune (doença de Addison)', 'Tuberculose adrenal', 'Hemorragia adrenal', 'Doença hipofisária', 'Hipofisite por imunoterápicos'],
    proximoPasso: ['Cortisol matinal e ACTH; teste de estímulo quando duvidoso.', 'Na crise adrenal, tratar imediatamente — não esperar resultado.', 'Investigar os demais eixos hipofisários quando for secundária.'],
    armadilhas: ['Hiponatremia com hipercalemia e eosinofilia é a pista que passa despercebida.', 'A dexametasona não é medida nos ensaios de cortisol, mas suprime o eixo.'],
  },

  {
    id: 'sindrome-de-cushing',
    nome: 'Síndrome de Cushing',
    assinatura: 'Cortisol não suprimível com hipocalemia e alcalose',
    sistemas: ['endocrino', 'metabolico'],
    achados: [
      { marcador: 'Cortisol', id: 'cortisol', direcao: '↑ / não suprime com dexametasona', porque: 'Produção autônoma ou estímulo contínuo por ACTH.' },
      { marcador: 'ACTH', id: 'acth', direcao: '↓ (adrenal) ou normal/↑ (hipofisário ou ectópico)', porque: 'Localiza a origem do excesso.' },
      { marcador: 'Potássio', id: 'potassio', direcao: '↓', porque: 'O cortisol em excesso satura a 11-beta-HSD2 e age no receptor mineralocorticoide.' },
      { marcador: 'Glicemia', id: 'glicemia-jejum', direcao: '↑', porque: 'O cortisol é contrainsulínico: estimula gliconeogênese e resistência periférica.' },
    ],
    mecanismo:
      'O excesso de glicocorticoide produz catabolismo proteico, resistência à insulina e, quando muito intenso, efeito mineralocorticoide — que explica a hipocalemia e a alcalose típicas das formas ectópicas.',
    causas: ['Corticoterapia exógena (a causa mais comum de todas)', 'Doença de Cushing (adenoma hipofisário)', 'Adenoma ou carcinoma adrenal', 'Secreção ectópica de ACTH'],
    proximoPasso: ['Confirme com dois testes: supressão com 1 mg de dexametasona, cortisol salivar noturno ou cortisol livre urinário.', 'Depois localize com ACTH e imagem.', 'Exclua pseudo-Cushing: depressão, alcoolismo e obesidade grave.'],
    armadilhas: ['Na forma ectópica, o quadro clínico clássico pode faltar: predominam hipocalemia, miopatia e hiperpigmentação.'],
  },

  {
    id: 'sindrome-coronariana-aguda',
    nome: 'Síndrome coronariana aguda',
    assinatura: 'Troponina com curva de ascensão e queda em contexto de isquemia',
    sistemas: ['cardiovascular'],
    achados: [
      { marcador: 'Troponina', id: 'troponina', direcao: '↑ com variação entre coletas', porque: 'A necrose miocárdica libera o pool citoplasmático e depois o aparelho contrátil.' },
      { marcador: 'CK-MB', id: 'ck-mb', direcao: '↑', porque: 'Isoenzima enriquecida no miocárdio; normaliza mais rápido e detecta reinfarto.' },
    ],
    mecanismo: 'A ruptura ou erosão de placa provoca trombose coronária; o miocárdio a jusante necrosa e libera troponina numa curva característica.',
    causas: ['Ruptura de placa aterosclerótica (tipo 1)', 'Desequilíbrio entre oferta e demanda (tipo 2)', 'Espasmo coronário', 'Dissecção coronária espontânea'],
    proximoPasso: ['Seriar troponina em 1 a 3 horas: o delta é o que diagnostica.', 'Eletrocardiograma seriado.', 'Avalie hemoglobina e creatinina — mudam a estratégia antitrombótica e o uso de contraste.'],
    armadilhas: ['Troponina elevada não é sinônimo de infarto: miocardite, sepse, embolia e doença renal também a elevam.', 'Elevação estável, sem delta, indica lesão crônica.'],
    doencas: ['infarto-agudo'],
  },

  {
    id: 'insuficiencia-cardiaca',
    nome: 'Insuficiência cardíaca descompensada',
    assinatura: 'BNP ou NT-proBNP elevados com hiponatremia e piora da função renal',
    sistemas: ['cardiovascular', 'renal'],
    achados: [
      { marcador: 'NT-proBNP', id: 'nt-probnp', direcao: '↑', porque: 'O estiramento ventricular dispara a clivagem do proBNP.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓', porque: 'O volume arterial efetivo reduzido ativa a ADH e retém água livre.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Síndrome cardiorrenal: baixo débito e congestão venosa renal.' },
      { marcador: 'Troponina', id: 'troponina', direcao: '↑ discreta', porque: 'Lesão subendocárdica por sobrecarga de parede.' },
    ],
    mecanismo: 'O ventrículo sobrecarregado libera peptídeos natriuréticos e ativa os sistemas neuro-humorais, que retêm água e sódio e comprometem a perfusão renal.',
    causas: ['Insuficiência cardíaca de qualquer etiologia', 'Valvopatias', 'Fibrilação atrial de alta resposta', 'Crise hipertensiva'],
    proximoPasso: ['Investigue o precipitante: infecção, arritmia, isquemia, má adesão, excesso de sal.', 'Hiponatremia e piora da função renal são marcadores prognósticos adversos.'],
    armadilhas: ['Obesidade reduz o BNP e pode gerar falso-negativo.', 'Doença renal eleva o NT-proBNP e exige cortes ajustados.', 'Sacubitril eleva o BNP: acompanhe com NT-proBNP.'],
  },

  {
    id: 'cetoacidose-diabetica',
    nome: 'Cetoacidose diabética',
    assinatura: 'Hiperglicemia com acidose, ânion gap alto e cetonemia',
    sistemas: ['metabolico', 'endocrino'],
    achados: [
      { marcador: 'Glicemia', id: 'glicemia-jejum', direcao: '↑↑', porque: 'Sem insulina, a produção hepática de glicose não é suprimida.' },
      { marcador: 'Bicarbonato', id: 'bicarbonato', direcao: '↓↓', porque: 'Consumido tamponando os cetoácidos.' },
      { marcador: 'Ânion gap', id: 'anion-gap', direcao: '↑', porque: 'Beta-hidroxibutirato e acetoacetato são ânions não medidos.' },
      { marcador: 'Potássio', id: 'potassio', direcao: 'normal ou ↑ com déficit corporal', porque: 'Acidose e falta de insulina deslocam o potássio para fora da célula, enquanto a diurese osmótica o elimina.' },
      { marcador: 'Sódio', id: 'sodio', direcao: '↓ (corrigir pela glicemia)', porque: 'A glicose puxa água do intracelular e dilui o sódio.' },
    ],
    mecanismo:
      'A deficiência de insulina com excesso de hormônios contrarreguladores libera a lipólise; os ácidos graxos são convertidos em cetoácidos no fígado. A hiperglicemia causa diurese osmótica, desidratação e perda de eletrólitos.',
    causas: ['Diabetes tipo 1 (abertura ou omissão de insulina)', 'Infecção intercorrente', 'Infarto', 'Inibidores de SGLT2 (cetoacidose euglicêmica)'],
    proximoPasso: [
      'Reponha volume, insulina e potássio — o potássio antes ou junto da insulina, nunca depois.',
      'Corrija o sódio pela glicemia antes de concluir que há hiponatremia.',
      'Acompanhe o fechamento do ânion gap, e não apenas a glicemia.',
    ],
    armadilhas: [
      'Iniciar insulina sem prever a queda do potássio é um erro clássico e perigoso: o corporal está depletado mesmo quando o plasmático parece normal.',
      'Inibidores de SGLT2 causam cetoacidose com glicemia quase normal.',
      'A fita de cetonas detecta acetoacetato e subestima o quadro na fase inicial.',
    ],
    doencas: ['cetoacidose-diabetica'],
  },

  {
    id: 'sepse',
    nome: 'Sepse',
    assinatura: 'Lactato elevado com disfunção orgânica e marcadores inflamatórios altos',
    sistemas: ['infeccioso', 'metabolico'],
    achados: [
      { marcador: 'Lactato', id: 'lactato', direcao: '↑', porque: 'A perfusão tecidual não sustenta o metabolismo aeróbio.' },
      { marcador: 'Procalcitonina', id: 'procalcitonina', direcao: '↑', porque: 'Endotoxinas induzem sua expressão em tecidos extratireoidianos.' },
      { marcador: 'Creatinina', id: 'creatinina', direcao: '↑', porque: 'Lesão renal aguda por hipoperfusão e inflamação.' },
      { marcador: 'Plaquetas', id: 'plaquetas', direcao: '↓', porque: 'Consumo e supressão medular.' },
      { marcador: 'Bilirrubina total', id: 'bilirrubina-total', direcao: '↑', porque: 'Colestase funcional: citocinas inibem os transportadores canaliculares.' },
    ],
    mecanismo:
      'A resposta desregulada à infecção causa vasodilatação, extravasamento capilar e disfunção microcirculatória. O resultado é hipoperfusão com disfunção orgânica múltipla — que é o que define sepse, e não a infecção em si.',
    causas: ['Pneumonia', 'Infecção urinária', 'Infecção abdominal', 'Infecção de partes moles', 'Infecção de corrente sanguínea associada a cateter'],
    proximoPasso: [
      'Colha culturas antes do antibiótico, mas não atrase o antibiótico por elas.',
      'Reponha volume e acompanhe o clearance de lactato.',
      'Identifique e controle o foco — sem isso, nenhum antibiótico resolve.',
    ],
    armadilhas: ['Leucopenia é sinal de gravidade.', 'Lactato alto também ocorre por beta-2-agonistas e adrenalina sem hipoperfusão.', 'PCR pode estar baixa nas primeiras horas.'],
    doencas: ['sepse'],
  },

  {
    id: 'pancreatite-aguda',
    nome: 'Pancreatite aguda',
    assinatura: 'Lipase acima de três vezes o limite superior com dor abdominal característica',
    sistemas: ['digestivo'],
    achados: [
      { marcador: 'Lipase', id: 'lipase', direcao: '↑↑↑', porque: 'A autodigestão pancreática libera enzimas para o interstício e a circulação.' },
      { marcador: 'ALT', id: 'alt', direcao: '↑ na etiologia biliar', porque: 'ALT acima de três vezes o normal favorece fortemente causa biliar.' },
      { marcador: 'Cálcio', id: 'calcio', direcao: '↓', porque: 'Saponificação com ácidos graxos na necrose gordurosa peripancreática.' },
      { marcador: 'PCR', id: 'pcr', direcao: '↑', porque: 'Marca a intensidade da resposta inflamatória e prediz gravidade em 48 horas.' },
    ],
    mecanismo:
      'A ativação intra-acinar do tripsinogênio desencadeia autodigestão glandular e resposta inflamatória sistêmica. O grau de elevação enzimática não reflete gravidade — a resposta inflamatória e a disfunção orgânica é que refletem.',
    causas: ['Litíase biliar', 'Álcool', 'Hipertrigliceridemia acima de 1.000 mg/dL', 'Pós-CPRE', 'Medicamentos', 'Hipercalcemia'],
    proximoPasso: [
      'Ultrassonografia para litíase e dosagem de triglicerídeos e cálcio.',
      'Avalie gravidade por PCR, ureia, hematócrito e disfunção orgânica — nunca pelo valor da lipase.',
      'Repetir a lipase não acrescenta informação.',
    ],
    armadilhas: ['Lipemia intensa inibe o ensaio de amilase e pode dar valor falsamente normal.', 'Doença renal eleva ambas as enzimas sem pancreatite.', 'Macroamilasemia é benigna e evita investigação desnecessária quando reconhecida.'],
  },
]

export const PADRAO_POR_ID = new Map(PADROES.map((p) => [p.id, p]))

import type { Sinal } from './esquemas'
import { SINAIS_CARDIORRESPIRATORIOS } from './sinais-exame-cardiorrespiratorio'
import { SINAIS_NEURO_ABDOME } from './sinais-exame-neuro-abdome'
import { SINAIS_VASCULARES_E_DE_PELE } from './sinais-exame-vascular-pele'
import { SINAIS_PELE_1 } from './sinais-pele-1'
import { SINAIS_PELE_2 } from './sinais-pele-2'
import { SINAIS_CABECA_E_OLHO } from './sinais-cabeca-olho'
import { SINAIS_MSK_E_NEURO } from './sinais-msk-neuro'

/**
 * O acervo de sinais do exame físico.
 *
 * ## Como cada ficha é escrita
 *
 * A ordem dos campos não é estética: é o caminho que o raciocínio percorre de
 * verdade na beira do leito. Primeiro **o que conta como presente** (definição
 * operacional — sem isso, dois examinadores discordam e ninguém sabe por quê),
 * depois **como se procura** (a manobra, com o detalhe que a faz funcionar),
 * só então **por que aparece** (o mecanismo, que é o que transforma o sinal em
 * raciocínio e não em cartão de memória) e finalmente **o que muda**.
 *
 * As armadilhas vêm por último de propósito. Elas só fazem sentido para quem já
 * entendeu o mecanismo — lida antes, "cuidado com a pseudo-icterícia da
 * carotenemia" é só mais uma frase para esquecer; lida depois de entender que a
 * bilirrubina se liga à elastina da esclera, vira consequência óbvia.
 *
 * ## Sobre os números de desempenho
 *
 * Só entram quando existe estudo. A semiologia carrega uma quantidade enorme de
 * sinal com nome de gente morta e poder diagnóstico nunca medido — e o hábito
 * de ensinar todos com o mesmo peso é parte do problema. Onde o número existe e
 * é ruim, ele está aqui **porque** é ruim: saber que o Blumberg tem razão de
 * verossimilhança perto de 2 muda o que se faz com ele.
 */
const SINAIS_GERAIS: Sinal[] = [
  {
    slug: 'ictericia',
    nome: 'Icterícia',
    sinonimos: ['Hiperbilirrubinemia clínica', 'Jaundice'],
    sistema: 'abdome',
    resumo:
      'A cor que aparece primeiro na esclera e só depois na pele — e a ordem em que ela aparece já é parte do diagnóstico.',
    definicao:
      'Coloração amarelada de pele, mucosas e escleras pela deposição de bilirrubina nos tecidos. Não é um valor de laboratório: é o que se enxerga, e o que se enxerga tem um limiar. Abaixo de cerca de 2,5–3 mg/dL de bilirrubina total a pessoa está hiperbilirrubinêmica mas **não** ictérica — é a faixa em que o exame físico é normal e só o laboratório acusa.',
    comoProcurar: [
      {
        passo: 'Procure na esclera antes de procurar na pele.',
        detalhe:
          'A esclera é rica em elastina, e a bilirrubina tem alta afinidade por elastina. Por isso ela cora primeiro e com bilirrubina mais baixa que a pele. Quem começa olhando o antebraço perde a icterícia inicial.',
      },
      {
        passo: 'Use luz natural, ou a luz mais branca disponível.',
        detalhe:
          'Lâmpada incandescente e a luz amarelada de muitos consultórios mascaram icterícia leve; LED frio e luz de janela revelam. Este é o erro de ambiente mais comum do exame.',
      },
      {
        passo: 'Peça para o paciente olhar para baixo e eleve a pálpebra superior.',
        detalhe:
          'A porção da esclera exposta na posição primária é justamente a mais lavada pela lágrima e a mais sujeita a pigmento conjuntival de idoso e de tabagista. A esclera superior, recém-exposta, é mais confiável.',
      },
      {
        passo: 'Confira o frênulo lingual e o palato mole.',
        detalhe:
          'Mucosas sem melanina e sem carotenoide. Em pele negra, onde a icterícia cutânea é difícil e a esclera pode ter pigmentação fisiológica amarelada nas bordas, o frênulo é o melhor ponto de leitura.',
      },
      {
        passo: 'Pergunte a cor da urina e das fezes — e pergunte antes de examinar.',
        detalhe:
          'Colúria precede a icterícia visível em dias. Acolia aponta para obstrução. Duas perguntas de dez segundos separam pré-hepático de colestático antes de qualquer exame.',
      },
    ],
    mecanismo:
      'O heme da hemácia senescente vira biliverdina e depois **bilirrubina não conjugada** — lipossolúvel, insolúvel em água, transportada ligada à albumina e, por isso, incapaz de ser filtrada pelo rim. No hepatócito, a UGT1A1 a conjuga com ácido glicurônico, tornando-a hidrossolúvel; a bilirrubina conjugada é excretada ativamente na bile pela MRP2, e esse transporte é o passo mais frágil da cadeia. Qualquer represamento — excesso de produção, defeito de captação ou conjugação, lesão hepatocelular ou obstrução do fluxo biliar — devolve bilirrubina ao sangue. Quando o excedente ultrapassa a capacidade de tamponamento tecidual, ele se deposita nas fibras elásticas: esclera primeiro, pele depois. **Qual** das duas bilirrubinas sobe é o que define o compartimento em falha, e é a única pergunta que importa no primeiro momento.',
    significado:
      'Icterícia nunca é diagnóstico — é a pergunta "onde a cadeia da bilirrubina quebrou?". A fração responde: não conjugada aponta para hemólise, eritropoese ineficaz ou defeito de conjugação (Gilbert, Crigler-Najjar, recém-nascido); conjugada aponta para hepatócito ou via biliar, e aí colúria e acolia separam os dois. Icterícia com dor em cólica e febre é colangite até prova em contrário — emergência de drenagem, não de investigação. Icterícia **indolor** com vesícula palpável (sinal de Courvoisier) é neoplasia periampular até prova em contrário.',
    armadilhas: [
      'Carotenemia amarela palmas, plantas e sulco nasolabial e **poupa a esclera**. Se a esclera está branca, não é bilirrubina — é cenoura, abóbora ou suplemento.',
      'Pinguécula e pigmentação conjuntival do idoso dão amarelo nas bordas nasal e temporal, poupando o centro. Icterícia verdadeira cora a esclera inteira, de modo uniforme.',
      'Luz amarela de ambiente esconde icterícia leve com uma facilidade constrangedora. Se há dúvida, leve o paciente à janela.',
      'A icterícia demora a sumir depois que a bilirrubina normaliza: a bilirrubina ligada covalentemente à albumina (delta-bilirrubina) tem a meia-vida da própria albumina, ~20 dias. Paciente amarelo com bilirrubina caindo pode estar melhorando.',
      'Em pele muito pigmentada, procurar icterícia na pele é perda de tempo. Esclera superior, frênulo e palato.',
    ],
    causas: [
      {
        titulo: 'Pré-hepática (não conjugada, sem colúria)',
        mecanismo:
          'Produção de bilirrubina acima da capacidade de conjugação. O fígado está bem; o que sobra é oferta. Como a fração não conjugada não é filtrada, a urina é clara — e é esse detalhe que fecha o compartimento à beira do leito.',
        itens: [
          'Hemólise (autoimune, esferocitose, falciforme, microangiopatia)',
          'Eritropoese ineficaz (talassemia, anemia megaloblástica)',
          'Reabsorção de grande hematoma',
          'Síndrome de Gilbert (UGT1A1 reduzida; piora em jejum e doença febril)',
          'Crigler-Najjar',
        ],
      },
      {
        titulo: 'Hepatocelular (mista, com colúria)',
        mecanismo:
          'Lesão do hepatócito compromete conjugação e excreção ao mesmo tempo, então sobem as duas frações. Aminotransferases dominam o padrão laboratorial.',
        itens: [
          'Hepatites virais agudas (A, B, C, E)',
          'Hepatite alcoólica',
          'Lesão por fármaco (paracetamol, amoxicilina-clavulanato, isoniazida, anabolizantes)',
          'Cirrose descompensada',
          'Hepatite autoimune, Wilson, hemocromatose',
          'Congestão hepática aguda e isquemia hepática',
        ],
      },
      {
        titulo: 'Colestática / obstrutiva (conjugada, colúria e acolia)',
        mecanismo:
          'O fluxo biliar para. A bilirrubina já conjugada reflui para o sangue, é filtrada (colúria escura) e não chega ao intestino (fezes claras). Sais biliares na pele explicam o prurido.',
        itens: [
          'Coledocolitíase',
          'Neoplasia periampular e de cabeça de pâncreas',
          'Colangite esclerosante primária, cirrose biliar primária',
          'Colestase induzida por fármaco',
          'Colestase da gravidez',
        ],
      },
    ],
    desempenho: [
      {
        alvo: 'Detecção clínica de bilirrubina total > 2,5–3 mg/dL',
        leitura:
          'Abaixo desse limiar o exame físico é normal mesmo com bilirrubina alterada. Exame físico negativo não exclui hiperbilirrubinemia — exclui icterícia.',
        fonte: 'Ruiz MA et al., limiar clássico de detecção escleral.',
      },
      {
        alvo: 'Vesícula palpável indolor em paciente ictérico (sinal de Courvoisier) para obstrução maligna',
        especificidade: 'alta',
        razaoPositiva: '~2,6',
        leitura:
          'Quando presente, desloca fortemente para obstrução distal neoplásica. Mas é pouco sensível: a maioria dos tumores periampulares não dá vesícula palpável, e sua ausência não tranquiliza.',
        fonte: 'Revisões de exame físico abdominal (McGee, Evidence-Based Physical Diagnosis).',
      },
    ],
    ilustracao: {
      id: 'ictericia',
      params: { bilirrubina: 8 },
      alt: 'Esclera e pele com coloração progressiva conforme a bilirrubina, com controle deslizante de intensidade',
    },
    comparador: 'ictericia-por-compartimento',
    patologias: ['hepatite-viral-aguda', 'cirrose-hepatica', 'colelitiase'],
    referencias: [
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      'Porto CC. Semiologia Médica, 8ª ed.',
      'Fargo MV et al. Evaluation of Jaundice in Adults. Am Fam Physician, 2017.',
    ],
  },

  {
    slug: 'edema-de-membros-inferiores',
    nome: 'Edema de membros inferiores',
    sinonimos: ['Edema periférico', 'Inchaço de pernas'],
    sistema: 'cardiovascular',
    resumo:
      'Todo mundo reconhece. Quase ninguém sabe dizer de qual causa — e é a causa que decide entre diurético, albumina e meia elástica.',
    definicao:
      'Acúmulo de líquido no interstício suficiente para deformar o contorno do membro. Só se torna visível depois de cerca de 2,5–3 litros retidos no adulto — ou seja, quando o edema aparece, o balanço já está alterado há dias. A pesquisa formal é a compressão firme e sustentada por **pelo menos 10 segundos** sobre proeminência óssea (maléolo medial, face anterior da tíbia): se fica depressão, há cacifo (sinal de Godet).',
    comoProcurar: [
      {
        passo: 'Comprima sobre o osso, não sobre a panturrilha.',
        detalhe:
          'Sobre músculo a depressão se desfaz de imediato e o cacifo passa despercebido. Maléolo medial e crista tibial dão o contra-apoio rígido que o teste exige.',
      },
      {
        passo: 'Segure 10 a 15 segundos, cronometrados.',
        detalhe:
          'Edema de baixa proteína recupera devagar; edema proteico (linfedema, inflamatório) mal deprime. Compressão de dois segundos, que é o que quase todo mundo faz, produz falso-negativo em edema discreto.',
      },
      {
        passo: 'Cronometre também o tempo de retorno.',
        detalhe:
          'Retorno rápido (menos de ~40 s) sugere edema com proteína intersticial baixa — hipoalbuminemia. Retorno lento sugere edema com proteína mais alta, típico do cardíaco e do venoso. É uma distinção grosseira, mas gratuita.',
      },
      {
        passo: 'Examine o paciente acamado na região sacral.',
        detalhe:
          'O edema obedece à gravidade. Em quem está deitado há dias, a perna pode estar quase limpa enquanto a região sacra está infiltrada. Procurar só no tornozelo subestima volume em paciente internado.',
      },
      {
        passo: 'Compare os dois lados e meça a panturrilha.',
        detalhe:
          'Assimetria maior que 3 cm a 10 cm abaixo da tuberosidade tibial muda a pergunta inteira: edema unilateral é trombose, erisipela, linfedema ou compressão local até prova em contrário — não insuficiência cardíaca.',
      },
      {
        passo: 'Procure turgência jugular e crepitações antes de chamar de cardíaco.',
        detalhe:
          'Edema de perna isolado, sem sinais de congestão sistêmica, raramente é insuficiência cardíaca. A causa mais comum de edema bilateral crônico em ambulatório é insuficiência venosa, não coração.',
      },
    ],
    mecanismo:
      'O equilíbrio de Starling na microcirculação depende de quatro forças e de uma via de escoamento. Sobe a **pressão hidrostática capilar** (congestão venosa do coração direito, obstrução venosa local, retenção de sódio pelo rim) e o filtrado aumenta. Cai a **pressão oncótica** (hipoalbuminemia da síndrome nefrótica, da cirrose, da desnutrição) e a força que reabsorve some. Sobe a **permeabilidade** (inflamação, sepse, queimadura) e a própria albumina vaza, levando água consigo. Falha o **escoamento linfático** (linfedema) e o líquido rico em proteína fica. O interstício tolera algum excedente sem deformar — mas passado esse tampão, cada mecanismo imprime uma assinatura própria no que a mão sente: consistência, temperatura, cor, distribuição e comportamento ao longo do dia. É essa assinatura, e não o inchaço em si, que o exame físico lê.',
    significado:
      'A pergunta útil nunca é "tem edema?", é "**que tipo** de edema?". Bilateral, mole, com cacifo fácil, vespertino e acompanhado de turgência jugular: congestão de câmaras direitas. Bilateral, muito mole, com edema periorbital matinal e urina espumosa: proteinúria nefrótica. Bilateral, com ascite desproporcional, aranhas vasculares e eritema palmar: cirrose. Unilateral, agudo, doloroso, com panturrilha empastada: trombose venosa profunda — e aqui o exame físico serve para acionar o escore e o ultrassom, nunca para descartar. Unilateral, duro, sem cacifo, com pele espessada e dedo do pé que não se pinça (sinal de Stemmer): linfedema, que não responde a diurético e piora com ele.',
    armadilhas: [
      'Edema bilateral **não** é sinônimo de insuficiência cardíaca. Em ambulatório, insuficiência venosa crônica e edema por bloqueador de canal de cálcio di-hidropiridínico (anlodipino) são mais comuns.',
      'Anlodipino causa edema por vasodilatação arteriolar pré-capilar — a pressão hidrostática sobe sem sobrecarga de volume. Diurético não resolve e desidrata; a conduta é reduzir a dose ou associar um IECA/BRA.',
      'Lipedema é confundido com edema: acomete mulheres, é bilateral, simétrico, doloroso à palpação, **poupa os pés** (sinal do manguito) e não deixa cacifo.',
      'Sinal de Stemmer positivo (impossível pinçar a pele do dorso do 2º pododáctilo) é praticamente diagnóstico de linfedema, e é o achado que mais rápido evita um diurético inútil.',
      'Mixedema do hipotireoidismo é edema **sem** cacifo, por depósito de glicosaminoglicanos — não é água, é matriz.',
    ],
    causas: [
      {
        titulo: 'Hidrostática elevada',
        mecanismo: 'Mais pressão empurrando água para fora do capilar, por congestão a montante ou retenção de sódio.',
        itens: [
          'Insuficiência cardíaca direita e biventricular',
          'Insuficiência venosa crônica',
          'Trombose venosa profunda (unilateral)',
          'Pericardite constritiva, cor pulmonale',
          'Doença renal com retenção de sódio',
          'Compressão venosa (massa pélvica, gravidez)',
        ],
      },
      {
        titulo: 'Oncótica reduzida',
        mecanismo: 'Albumina baixa demais para reter água no vaso. Edema mole, generalizado, com acometimento de face.',
        itens: [
          'Síndrome nefrótica',
          'Cirrose hepática',
          'Enteropatia perdedora de proteína',
          'Desnutrição proteico-calórica',
        ],
      },
      {
        titulo: 'Permeabilidade aumentada',
        mecanismo: 'A barreira endotelial vaza proteína; o edema vem com os sinais flogísticos.',
        itens: ['Celulite e erisipela', 'Angioedema', 'Sepse e síndrome de extravasamento capilar', 'Queimadura'],
      },
      {
        titulo: 'Drenagem linfática obstruída',
        mecanismo: 'O líquido proteico não escoa, organiza-se e fibrosa. Com o tempo, o edema deixa de ter cacifo.',
        itens: [
          'Linfedema pós-esvaziamento axilar ou inguinal',
          'Pós-radioterapia',
          'Filariose',
          'Linfedema primário',
        ],
      },
      {
        titulo: 'Farmacológica',
        mecanismo: 'Vasodilatação pré-capilar ou retenção de sódio induzida por droga.',
        itens: [
          'Bloqueadores de canal de cálcio di-hidropiridínicos (anlodipino)',
          'AINEs',
          'Corticoides, glitazonas',
          'Gabapentina, pregabalina',
        ],
      },
    ],
    desempenho: [
      {
        alvo: 'Edema de membros inferiores para insuficiência cardíaca em paciente com dispneia',
        sensibilidade: '~10%',
        especificidade: '~93%',
        razaoPositiva: '~2,3',
        leitura:
          'Pouco sensível e moderadamente específico: a ausência de edema não afasta insuficiência cardíaca, e sua presença isolada é argumento fraco. Turgência jugular e B3 carregam muito mais peso.',
        fonte: 'Wang CS et al. Does This Dyspneic Patient Have Heart Failure? JAMA, 2005.',
      },
    ],
    ilustracao: {
      id: 'edema',
      params: { tipo: 'cardiaco' },
      alt: 'Perna em corte com cacifo de profundidade e recuperação variáveis conforme a causa do edema',
    },
    comparador: 'edema-por-causa',
    patologias: ['insuficiencia-cardiaca', 'sindrome-nefrotica', 'cirrose-hepatica', 'trombose-venosa-profunda'],
    referencias: [
      'Trayes KP et al. Edema: Diagnosis and Management. Am Fam Physician, 2013.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      'Wang CS et al. JAMA, 2005;294(15):1944-56.',
    ],
  },

  {
    slug: 'cianose',
    nome: 'Cianose',
    sinonimos: ['Coloração azulada'],
    sistema: 'cardiovascular',
    resumo:
      'Depende da hemoglobina **dessaturada em valor absoluto** — e é por isso que o anêmico grave pode morrer hipoxêmico sem nunca ficar azul.',
    definicao:
      'Coloração azul-arroxeada de pele e mucosas por aumento da hemoglobina reduzida no leito capilar. O limiar clássico é cerca de **5 g/dL de hemoglobina não oxigenada** no sangue capilar — um valor absoluto, não uma porcentagem. Divide-se em central (mucosas quentes: língua, mucosa oral, conjuntiva) e periférica (extremidades frias: leito ungueal, nariz, orelha).',
    comoProcurar: [
      {
        passo: 'Procure a cianose central na língua e na mucosa oral.',
        detalhe:
          'São territórios de alto fluxo e temperatura estável; não ficam azuis por vasoconstrição. Cianose de língua é hipoxemia ou shunt — nunca é frio.',
      },
      {
        passo: 'Procure a periférica no leito ungueal e nas pontas.',
        detalhe:
          'Baixo fluxo local aumenta a extração de oxigênio e eleva a hemoglobina reduzida no capilar, com saturação arterial normal.',
      },
      {
        passo: 'Aqueça a extremidade e reexamine.',
        detalhe:
          'Cianose periférica por vasoconstrição melhora com aquecimento; a central não se move. É a manobra mais barata para separar as duas.',
      },
      {
        passo: 'Confira a hemoglobina antes de confiar na ausência de cianose.',
        detalhe:
          'Com Hb de 6 g/dL, seria preciso dessaturar quase tudo para reunir 5 g/dL de hemoglobina reduzida. O anêmico grave fica hipoxêmico sem azulejar — e o policitêmico fica azul com hipoxemia leve.',
      },
      {
        passo: 'Cianose que não responde ao oxigênio e com oximetria travada perto de 85%: pense em metemoglobinemia.',
        detalhe:
          'A oximetria de dois comprimentos de onda satura artificialmente perto de 85% na metemoglobinemia. Sangue de cor achocolatada que não muda ao ar confirma; o tratamento é azul de metileno.',
      },
    ],
    mecanismo:
      'A cor do sangue capilar é ditada pela hemoglobina **desoxigenada** nele, em gramas por decilitro. Na cianose central o problema está na oxigenação: hipoventilação, distúrbio de difusão, desequilíbrio ventilação-perfusão ou shunt direita-esquerda entregam sangue arterial já dessaturado, e a mucosa quente denuncia. Na periférica a oxigenação arterial pode estar perfeita, mas o fluxo local é tão lento — vasoconstrição por frio, choque, obstrução arterial ou baixo débito — que o tecido extrai mais oxigênio por unidade de volume e o capilar termina rico em hemoglobina reduzida. Um terceiro grupo não envolve hemoglobina reduzida nenhuma: a **pseudocianose** das di-hemoglobinas, em que metemoglobina ou sulfemoglobina tem cor própria e desloca a leitura tanto do olho quanto do oxímetro.',
    significado:
      'Cianose central é sinal de insuficiência respiratória ou de shunt e exige gasometria, não oximetria isolada. Em recém-nascido, cianose central que não melhora com oxigênio a 100% (teste da hiperóxia) é cardiopatia congênita com shunt até prova em contrário. Cianose diferencial — membros inferiores azuis e superiores rosados — aponta para canal arterial patente com shunt reverso ou coarctação. Cianose periférica isolada em paciente quente e bem perfundido é quase sempre artefato de frio; em paciente frio e taquicárdico, é choque.',
    armadilhas: [
      'Cianose é sinal **tardio e insensível**. A concordância entre observadores é baixa e a detecção só é confiável abaixo de saturação de ~80%. Ausência de cianose nunca exclui hipoxemia.',
      'Anemia grave impede a cianose; policitemia a produz facilmente. A cor lê gramas, não porcentagem.',
      'Pele muito pigmentada e má iluminação reduzem drasticamente a detecção — outro motivo para examinar mucosas e leito ungueal, e para não substituir a gasometria pelo olho.',
      'Oximetria de pulso superestima a saturação em pele mais pigmentada, com hipoperfusão e com esmalte escuro. Não confie no número sozinho quando o paciente parece mal.',
    ],
    causas: [
      {
        titulo: 'Central — oxigenação arterial comprometida',
        mecanismo: 'O sangue já sai do pulmão dessaturado, ou sangue venoso é desviado direto para a circulação sistêmica.',
        itens: [
          'Pneumonia extensa, SDRA, edema agudo de pulmão',
          'DPOC exacerbada, crise asmática grave',
          'Tromboembolismo pulmonar maciço',
          'Cardiopatia congênita cianótica (Fallot, transposição)',
          'Grandes altitudes',
        ],
      },
      {
        titulo: 'Periférica — fluxo local reduzido',
        mecanismo: 'Saturação arterial normal com extração local aumentada por lentificação do fluxo.',
        itens: [
          'Exposição ao frio e fenômeno de Raynaud',
          'Choque de qualquer etiologia, baixo débito',
          'Obstrução arterial aguda',
          'Insuficiência venosa e obstrução venosa local',
        ],
      },
      {
        titulo: 'Pseudocianose — pigmento anômalo',
        mecanismo: 'A cor vem de uma hemoglobina alterada ou de pigmento exógeno, sem hipoxemia real.',
        itens: [
          'Metemoglobinemia (dapsona, benzocaína, nitritos, anilinas)',
          'Sulfemoglobinemia',
          'Amiodarona (pigmentação cinza-azulada), prata',
        ],
      },
    ],
    desempenho: [
      {
        alvo: 'Cianose para detectar hipoxemia',
        leitura:
          'Detecção confiável só abaixo de SpO₂ ~80%, com grande variação entre examinadores. É achado grave quando presente, e sem valor quando ausente.',
        fonte: 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      },
    ],
    ilustracao: {
      id: 'cianose',
      params: { tipo: 'central', intensidade: 2 },
      alt: 'Lábios, língua e leito ungueal com graus de cianose central e periférica',
    },
    comparador: 'cianose-central-vs-periferica',
    patologias: ['insuficiencia-respiratoria-aguda', 'dpoc', 'tromboembolismo-pulmonar'],
    referencias: [
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      'Porto CC. Semiologia Médica, 8ª ed.',
      'Sjoding MW et al. Racial Bias in Pulse Oximetry Measurement. NEJM, 2020.',
    ],
  },

  {
    slug: 'turgencia-jugular',
    nome: 'Turgência jugular / pressão venosa jugular',
    sinonimos: ['Estase jugular', 'PVJ', 'Ingurgitamento jugular'],
    sistema: 'cardiovascular',
    resumo:
      'A única forma de medir a pressão do átrio direito com a régua do olho — e o sinal de congestão com melhor desempenho no exame físico.',
    definicao:
      'Altura da coluna de sangue na veia jugular interna direita, medida em centímetros verticais acima do ângulo esternal e somada aos 5 cm que separam o ângulo do centro do átrio direito. Considera-se elevada acima de 8–9 cmH₂O (ou seja, mais de 3–4 cm acima do ângulo esternal com o tronco a 45°).',
    comoProcurar: [
      {
        passo: 'Use a jugular interna direita, não a externa.',
        detalhe:
          'A interna direita tem trajeto quase retilíneo até o átrio direito, sem válvulas relevantes no caminho — é um manômetro. A externa tem válvulas e angulações e pode estar colabada por compressão, dando leitura falsa.',
      },
      {
        passo: 'Incline o tronco até o menisco ficar visível.',
        detalhe:
          'O ângulo de 45° é convenção, não regra: com pressão muito alta o topo da coluna fica acima da mandíbula a 45° e some; com pressão baixa, só aparece quase deitado. Ajuste o decúbito até enxergar o topo.',
      },
      {
        passo: 'Ilumine em incidência tangencial e peça para o paciente virar levemente a cabeça para o lado oposto.',
        detalhe:
          'A pulsação da jugular é um movimento ondulante da pele, não um vaso visível. Luz de raspão cria a sombra que o torna perceptível; rotação excessiva contrai o esternocleidomastóideo e esconde tudo.',
      },
      {
        passo: 'Confirme que é veia, e não carótida.',
        detalhe:
          'A jugular tem duplo pico por ciclo, é obliterável por compressão leve, varia com a posição e some com a inspiração. A carótida tem pico único, é palpável, não colaba e não varia com o decúbito.',
      },
      {
        passo: 'Meça a vertical até o ângulo de Louis e some 5 cm.',
        detalhe:
          'A distância do ângulo esternal ao centro do átrio direito é aproximadamente constante em qualquer decúbito — é isso que faz a medida funcionar sem depender do ângulo da maca.',
      },
      {
        passo: 'Faça o refluxo hepatojugular se a coluna estiver normal e a suspeita for alta.',
        detalhe:
          'Compressão firme e sustentada do quadrante superior direito por 10 a 15 segundos, com o paciente respirando normalmente. Elevação sustentada maior que 3 cm é positiva e revela congestão que a coluna em repouso não mostrava.',
      },
    ],
    mecanismo:
      'Sem válvula competente entre a jugular interna e o átrio direito, a coluna de sangue no pescoço se comporta como um manômetro em U ligado diretamente à câmara: a altura em que o sangue estaciona é a pressão do átrio direito expressa em centímetros de água. Quando o ventrículo direito falha, quando o pericárdio restringe o enchimento, quando a válvula tricúspide regurgita ou quando o volume intravascular está simplesmente alto demais, a pressão de enchimento sobe e a coluna sobe junto. O **sinal de Kussmaul** — a coluna que sobe na inspiração em vez de descer — inverte a fisiologia normal: se o retorno venoso aumentado pela inspiração não puder ser acomodado pelo ventrículo direito (constrição, restrição, infarto de VD, tamponamento), o sangue represa para trás.',
    significado:
      'Turgência jugular elevada é o achado de exame físico com melhor razão de verossimilhança para pressão de enchimento elevada e para insuficiência cardíaca em paciente dispneico — melhor que edema, melhor que crepitações. Em choque indiferenciado, a jugular divide o diagnóstico ao meio: colabada aponta para hipovolemia ou distributivo; distendida aponta para cardiogênico ou obstrutivo (tamponamento, tromboembolismo maciço, pneumotórax hipertensivo), e essa bifurcação muda imediatamente a conduta entre expandir e não expandir.',
    armadilhas: [
      'Confundir com pulso carotídeo é o erro clássico. Se é palpável e tem um pico só, é artéria.',
      'Obesidade, pescoço curto e musculatura hipertrofiada tornam o sinal impossível em parte dos pacientes — ausência por dificuldade técnica não é ausência de congestão.',
      'A 45° com pressão muito alta, o topo da coluna passa da mandíbula e o pescoço parece "sem turgência". Sente o paciente mais para encontrar o menisco.',
      'Manobra de Valsalva, choro e esforço distendem a jugular fisiologicamente. Meça com o paciente respirando calmo.',
    ],
    causas: [
      {
        titulo: 'Pressão de enchimento direita elevada',
        mecanismo: 'O ventrículo direito não esvazia ou não enche, e a pressão reflete para o átrio e para a jugular.',
        itens: [
          'Insuficiência cardíaca direita e biventricular',
          'Hipertensão pulmonar, cor pulmonale',
          'Infarto de ventrículo direito',
          'Estenose e insuficiência tricúspide',
        ],
      },
      {
        titulo: 'Restrição ao enchimento',
        mecanismo: 'O saco pericárdico ou o miocárdio impedem o ventrículo de receber. Kussmaul frequentemente presente.',
        itens: ['Tamponamento cardíaco', 'Pericardite constritiva', 'Cardiomiopatia restritiva'],
      },
      {
        titulo: 'Obstrução ao fluxo de saída direito',
        mecanismo: 'Aumento agudo da pós-carga do ventrículo direito.',
        itens: ['Tromboembolismo pulmonar maciço', 'Pneumotórax hipertensivo'],
      },
      {
        titulo: 'Obstrução da própria veia cava superior',
        mecanismo: 'A coluna sobe sem que o coração esteja em falha — e, aqui, não pulsa.',
        itens: ['Síndrome da veia cava superior (tumor, trombo de cateter)'],
      },
      {
        titulo: 'Sobrecarga de volume',
        mecanismo: 'Volume intravascular acima da capacidade de acomodação.',
        itens: ['Doença renal com hipervolemia', 'Reposição volêmica excessiva'],
      },
    ],
    desempenho: [
      {
        alvo: 'Pressão venosa jugular elevada para insuficiência cardíaca em paciente com dispneia',
        sensibilidade: '~39%',
        especificidade: '~92%',
        razaoPositiva: '~5,1',
        leitura:
          'Presente, é um dos achados mais fortes do exame físico — desloca decisivamente para insuficiência cardíaca. Ausente, não afasta (muitos pacientes são tecnicamente difíceis de examinar).',
        fonte: 'Wang CS et al. JAMA, 2005;294(15):1944-56.',
      },
      {
        alvo: 'Refluxo hepatojugular para pressão de enchimento elevada',
        sensibilidade: '~55%',
        especificidade: '~83%',
        leitura: 'Acrescenta informação quando a coluna em repouso é limítrofe — é o teste de estresse da jugular.',
        fonte: 'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
      },
    ],
    ilustracao: {
      id: 'jugular',
      params: { altura: 7 },
      alt: 'Pescoço com a coluna venosa jugular e a régua de medida a partir do ângulo esternal',
    },
    patologias: ['insuficiencia-cardiaca', 'tamponamento-cardiaco', 'tromboembolismo-pulmonar'],
    referencias: [
      'Wang CS et al. Does This Dyspneic Patient in the Emergency Department Have Congestive Heart Failure? JAMA, 2005.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'baqueteamento-digital',
    nome: 'Baqueteamento digital',
    sinonimos: ['Hipocratismo digital', 'Dedos em baqueta de tambor', 'Clubbing'],
    sistema: 'respiratorio',
    resumo:
      'O sinal mais antigo da medicina, e o que mais se diagnostica no olho sem critério. Existe um ângulo, e ele se mede.',
    definicao:
      'Aumento do tecido conjuntivo na falange distal com perda do ângulo normal entre a unha e a prega ungueal proximal. O critério objetivo é o **ângulo de Lovibond**: normalmente até 160°; acima de 180° é baqueteamento. A confirmação de beira-leito é o **sinal de Schamroth** — unir o dorso dos dois dedos indicadores pelas unhas: normalmente sobra um losango de luz entre elas, e no baqueteamento esse losango desaparece.',
    comoProcurar: [
      {
        passo: 'Olhe o dedo de perfil, na altura dos olhos.',
        detalhe:
          'O ângulo de Lovibond só existe no perfil. Visto de cima, o dedo baqueteado parece apenas "gordinho" e o sinal se perde.',
      },
      {
        passo: 'Faça o sinal de Schamroth.',
        detalhe:
          'Dois indicadores unidos pelo dorso das unhas. Losango de luz presente é normal; losango obliterado é baqueteamento. É o teste mais reprodutível à beira do leito e dispensa instrumento.',
      },
      {
        passo: 'Teste a flutuação da base da unha.',
        detalhe:
          'Pressione a pele proximal à unha: no baqueteamento o leito ungueal parece flutuar sobre uma base esponjosa, por causa do tecido conjuntivo acumulado.',
      },
      {
        passo: 'Examine as mãos e os pés, e compare os dedos entre si.',
        detalhe:
          'Baqueteamento **unilateral ou assimétrico** muda o diagnóstico: aponta para causa vascular local (fístula arteriovenosa de hemodiálise, aneurisma de subclávia) e não para doença sistêmica.',
      },
      {
        passo: 'Procure dor e edema em punhos e tornozelos.',
        detalhe:
          'Baqueteamento com periostite dolorosa de ossos longos é osteoartropatia hipertrófica — associação forte com neoplasia intratorácica, e indicação de imagem imediata.',
      },
    ],
    mecanismo:
      'A explicação mais aceita é plaquetária. Normalmente, megacariócitos e grandes agregados plaquetários ficam retidos no leito capilar pulmonar. Quando existe shunt direita-esquerda ou doença que permite a passagem desses agregados, eles alcançam a circulação sistêmica e se impactam nos capilares da extremidade — a região de menor calibre e fluxo mais lento. Ali liberam **PDGF e VEGF**, que induzem proliferação vascular, aumento de permeabilidade e deposição de tecido conjuntivo. A hipoxemia crônica contribui por estabilizar o HIF e aumentar o VEGF, mas não é condição necessária: baqueteamento aparece em doença inflamatória intestinal e em cirrose sem hipoxemia nenhuma. Isso explica também por que a DPOC **não** costuma baquetear, apesar da hipoxemia — nela não há o shunt anatômico.',
    significado:
      'Baqueteamento é sinal de doença orgânica, quase nunca funcional, e obriga a procurar a causa. Em adulto fumante com baqueteamento novo, câncer de pulmão até prova em contrário. Em paciente com DPOC, o baqueteamento **não** deve ser atribuído à DPOC: sua presença deve disparar investigação para neoplasia ou bronquiectasia associada. Em criança, pensar em fibrose cística, cardiopatia congênita cianótica e bronquiectasia. Baqueteamento é adquirido e progressivo — congênito e estável a vida toda pode ser variante familiar benigna.',
    armadilhas: [
      'DPOC isolada não causa baqueteamento. Encontrou em um "DPOC"? Procure câncer ou bronquiectasia.',
      'Diagnóstico "no olho", sem perfil e sem Schamroth, tem concordância entre observadores muito baixa. É um dos sinais mais sobrediagnosticados do exame físico.',
      'Baqueteamento unilateral é vascular local, não sistêmico.',
      'Onicomicose, unha em vidro de relógio isolada e paroníquia crônica alteram o contorno sem haver baqueteamento verdadeiro — o ângulo de Lovibond resolve.',
    ],
    causas: [
      {
        titulo: 'Pulmonar',
        mecanismo: 'Shunt intrapulmonar ou inflamação crônica com passagem de agregados plaquetários.',
        itens: [
          'Câncer de pulmão (sobretudo não pequenas células)',
          'Bronquiectasias e fibrose cística',
          'Abscesso pulmonar, empiema',
          'Doença pulmonar intersticial / fibrose pulmonar idiopática',
          'Malformação arteriovenosa pulmonar',
        ],
      },
      {
        titulo: 'Cardíaca',
        mecanismo: 'Shunt direita-esquerda anatômico.',
        itens: ['Cardiopatia congênita cianótica', 'Endocardite infecciosa'],
      },
      {
        titulo: 'Gastrointestinal e hepática',
        mecanismo: 'Shunt intrapulmonar da síndrome hepatopulmonar e inflamação crônica.',
        itens: ['Cirrose, síndrome hepatopulmonar', 'Doença de Crohn e retocolite ulcerativa', 'Doença celíaca'],
      },
      {
        titulo: 'Endócrina e outras',
        mecanismo: 'Mecanismos diversos, alguns não esclarecidos.',
        itens: ['Hipertireoidismo (acropaquia tireoidiana)', 'Baqueteamento familiar benigno'],
      },
    ],
    ilustracao: {
      id: 'baqueteamento',
      params: { grau: 2 },
      alt: 'Perfil do dedo com o ângulo de Lovibond em graus crescentes e o sinal de Schamroth',
    },
    patologias: ['cancer-de-pulmao', 'bronquiectasia', 'fibrose-cistica'],
    referencias: [
      'Myers KA, Farquhar DRE. Does This Patient Have Clubbing? JAMA, 2001;286(3):341-7.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'ascite',
    nome: 'Ascite',
    sinonimos: ['Líquido livre na cavidade peritoneal'],
    sistema: 'abdome',
    resumo:
      'O exame físico só detecta a partir de 1,5 litro. Abaixo disso, quem vê é o ultrassom — e é por isso que a sonda entrou no exame físico.',
    definicao:
      'Acúmulo de líquido livre na cavidade peritoneal. Clinicamente detectável a partir de aproximadamente 1.500 mL; o ultrassom detecta a partir de ~100 mL. A pesquisa tem três manobras, em ordem crescente de volume necessário: macicez de flancos, macicez móvel e piparote.',
    comoProcurar: [
      {
        passo: 'Percuta do umbigo para os flancos, em decúbito dorsal.',
        detalhe:
          'O líquido obedece à gravidade e se acumula nos flancos; a alça intestinal, cheia de gás, flutua no centro. Timpanismo central com macicez periférica é o padrão da ascite — o inverso do que se vê em massa ou bexigoma.',
      },
      {
        passo: 'Marque o ponto onde o som vira maciço e vire o paciente para o decúbito lateral.',
        detalhe:
          'Espere de 30 a 60 segundos pelo redistribuir do líquido antes de repercutir. Quem percute imediatamente encontra a macicez no mesmo lugar e conclui, errado, que o teste é negativo.',
      },
      {
        passo: 'Repercuta: a linha de macicez deve ter migrado.',
        detalhe:
          'Macicez móvel é o achado mais confiável das três manobras. Massa, organomegalia e gordura não migram; líquido livre migra.',
      },
      {
        passo: 'Faça o piparote apenas em ascite volumosa, com auxílio da mão do paciente.',
        detalhe:
          'A mão do paciente (ou de um terceiro) em cutelo sobre a linha média bloqueia a transmissão da onda pelo panículo adiposo. Sem esse bloqueio, o piparote é positivo em qualquer abdome obeso.',
      },
      {
        passo: 'Encoste a sonda se houver dúvida.',
        detalhe:
          'O ultrassom à beira do leito detecta 100 mL e guia a paracentese. Em suspeita de peritonite bacteriana espontânea, a paracentese diagnóstica não deve ser adiada por exame físico duvidoso — é diagnóstico com hora marcada.',
      },
    ],
    mecanismo:
      'Na cirrose, a cascata começa na hipertensão portal: a resistência sinusoidal aumentada e a vasodilatação esplâncnica mediada por óxido nítrico reduzem o volume arterial efetivo, mesmo com volume total aumentado. O rim lê isso como hipovolemia, ativa o sistema renina-angiotensina-aldosterona e o simpático, retém sódio e água — e esse volume retido extravasa para o peritônio, onde a pressão hidrostática sinusoidal já está alta e a pressão oncótica, baixa pela hipoalbuminemia. Por isso o tratamento é restrição de sódio e antagonista de aldosterona, não apenas diurético de alça. Quando a causa é peritoneal (carcinomatose, tuberculose), o mecanismo é outro: exsudação por permeabilidade e obstrução linfática — e o **gradiente albumina soro-ascite (GASA)** separa os dois grupos com precisão maior que qualquer achado do exame físico: ≥1,1 g/dL indica hipertensão portal; <1,1 indica doença peritoneal.',
    significado:
      'Ascite nova exige paracentese diagnóstica — sempre, inclusive para calcular o GASA e contar polimorfonucleares. Contagem de PMN ≥250/mm³ define peritonite bacteriana espontânea e indica antibiótico imediato, independentemente de cultura. Ascite em paciente sem hepatopatia conhecida amplia o diferencial para carcinomatose, insuficiência cardíaca direita, síndrome nefrótica, tuberculose peritoneal e pancreatite.',
    armadilhas: [
      'Obesidade produz macicez de flancos sem ascite. A macicez **móvel** é o que separa: gordura não migra.',
      'Bexigoma dá macicez suprapúbica de convexidade superior e some após a sonda vesical. Percutir sem esvaziar a bexiga já produziu muita "ascite".',
      'Piparote sem a mão bloqueando a parede é positivo em quase todo abdome volumoso.',
      'O exame físico não exclui ascite. Em cirrótico com febre ou dor, a paracentese vale mais que a percussão.',
    ],
    causas: [
      {
        titulo: 'GASA ≥ 1,1 — hipertensão portal',
        mecanismo: 'Pressão sinusoidal alta empurra líquido para o peritônio; a albumina fica no soro.',
        itens: [
          'Cirrose hepática',
          'Insuficiência cardíaca direita e pericardite constritiva',
          'Síndrome de Budd-Chiari',
          'Hepatite alcoólica',
          'Trombose de veia porta',
        ],
      },
      {
        titulo: 'GASA < 1,1 — doença peritoneal',
        mecanismo: 'O peritônio exsuda proteína; a albumina da ascite se aproxima da sérica.',
        itens: [
          'Carcinomatose peritoneal',
          'Tuberculose peritoneal',
          'Ascite pancreática',
          'Síndrome nefrótica',
          'Serosite de doença do tecido conjuntivo',
        ],
      },
    ],
    desempenho: [
      {
        alvo: 'Macicez móvel para ascite',
        sensibilidade: '~60–88%',
        especificidade: '~56–90%',
        leitura:
          'É a melhor das manobras clássicas, mas com desempenho modesto. Ausência de macicez de flancos é o achado que mais reduz a probabilidade de ascite.',
        fonte: 'Williams JW, Simel DL. Does This Patient Have Ascites? JAMA, 1992;267(19):2645-8.',
      },
      {
        alvo: 'Ausência de macicez de flancos para excluir ascite',
        razaoNegativa: '~0,3',
        leitura: 'É o achado negativo mais útil da série — flancos timpânicos tornam ascite significativa improvável.',
        fonte: 'Williams JW, Simel DL. JAMA, 1992.',
      },
    ],
    ilustracao: {
      id: 'ascite',
      params: { volume: 3 },
      alt: 'Abdome em corte transversal com líquido nos flancos e alças flutuando, e a migração da macicez ao decúbito lateral',
    },
    patologias: ['cirrose-hepatica', 'peritonite-bacteriana-espontanea'],
    referencias: [
      'Williams JW, Simel DL. Does This Patient Have Ascites? JAMA, 1992.',
      'Runyon BA. AASLD Practice Guideline: Management of Adult Patients with Ascites.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'asterixe',
    nome: 'Asterixe',
    sinonimos: ['Flapping', 'Tremor de bater de asas', 'Mioclonia negativa'],
    sistema: 'neurologico',
    resumo:
      'Não é tremor: é a ausência intermitente do comando de postura. Entender isso é entender por que só aparece com o membro sustentado.',
    definicao:
      'Interrupções breves, súbitas e arrítmicas do tônus postural, que fazem o segmento cair e ser recuperado logo em seguida. É uma **mioclonia negativa** — um silêncio elétrico transitório no músculo que sustenta a postura, e não uma contração involuntária. Por isso desaparece com o membro em repouso.',
    comoProcurar: [
      {
        passo: 'Braços estendidos, punhos em dorsiflexão máxima, dedos separados.',
        detalhe:
          'A postura tem de ser sustentada **contra a gravidade**: é a manutenção ativa do tônus que o asterixe interrompe. Mão apoiada não flapa.',
      },
      {
        passo: 'Observe por 30 segundos, no mínimo.',
        detalhe:
          'As interrupções são arrítmicas e podem se espaçar por 10 a 20 segundos. Olhar por cinco segundos e concluir ausência é o erro mais comum.',
      },
      {
        passo: 'Se o paciente não colabora, procure em outros territórios.',
        detalhe:
          'Dorsiflexão do pé, protrusão da língua e pálpebras fechadas suavemente também mostram o fenômeno. Em paciente sonolento, o asterixe pode ser a única janela de exame.',
      },
      {
        passo: 'Separe de tremor observando o padrão.',
        detalhe:
          'Tremor é oscilação rítmica e contínua. Asterixe é queda súbita seguida de recuperação, irregular, com intervalos de postura perfeitamente estável.',
      },
    ],
    mecanismo:
      'A manutenção da postura depende de descarga tônica contínua dos motoneurônios, modulada por circuitos reticulares do tronco e por alças tálamo-corticais. A encefalopatia metabólica — amônia, uremia, hipercapnia, fármacos — perturba essa modulação e produz pausas transitórias na descarga. Registrado em eletromiografia, o asterixe aparece como um silêncio de 50 a 200 ms no músculo em contração tônica, exatamente coincidente com a queda. Na encefalopatia hepática, a amônia que escapa do metabolismo hepático é captada pelo astrócito e convertida em glutamina; a glutamina acumulada puxa água para dentro da célula, causando edema astrocitário e disfunção da neurotransmissão glutamatérgica e GABAérgica. É por isso que o asterixe acompanha o nível de consciência e **não** o nível absoluto de amônia — dosar amônia para graduar encefalopatia é um hábito com pouca sustentação.',
    significado:
      'Asterixe é marcador de encefalopatia metabólica e aparece antes do rebaixamento franco. Em hepatopata, sua presença define encefalopatia hepática grau II de West Haven e obriga a caçar o fator precipitante — infecção (incluindo peritonite bacteriana espontânea), hemorragia digestiva, constipação, distúrbio hidroeletrolítico, sedativo, hipovolemia. O tratamento é do precipitante, mais lactulose; o asterixe serve para acompanhar a resposta. Asterixe **unilateral** é o exceto que importa: aponta para lesão estrutural contralateral (tálamo, mesencéfalo, cápsula interna) e pede imagem, não lactulose.',
    armadilhas: [
      'Chamar de "tremor": leva a prescrever propranolol em quem precisa de lactulose e de caça ao precipitante.',
      'Examinar com a mão apoiada na cama. O sinal depende da sustentação ativa contra a gravidade.',
      'Asterixe não é específico de fígado. Uremia, hipercapnia da DPOC descompensada, hipoglicemia e fármacos (fenitoína, lítio, gabapentina, valproato) produzem o mesmo achado.',
      'Asterixe unilateral não é metabólico. É lesão estrutural até prova em contrário.',
      'Na encefalopatia avançada, com o paciente já torporoso, o asterixe **desaparece** — não porque melhorou, mas porque não há mais postura sustentada. Sumiço do sinal com piora do nível de consciência é agravamento.',
    ],
    causas: [
      {
        titulo: 'Hepática',
        mecanismo: 'Amônia não depurada → glutamina no astrócito → edema astrocitário e disfunção sináptica.',
        itens: [
          'Encefalopatia hepática na cirrose',
          'Insuficiência hepática aguda',
          'Shunt portossistêmico (inclusive pós-TIPS)',
        ],
      },
      {
        titulo: 'Renal e respiratória',
        mecanismo: 'Toxinas urêmicas e hipercapnia perturbam a mesma modulação reticular.',
        itens: ['Encefalopatia urêmica', 'Retenção de CO₂ na DPOC descompensada'],
      },
      {
        titulo: 'Farmacológica e tóxica',
        mecanismo: 'Efeito direto sobre a excitabilidade cortical e a descarga tônica.',
        itens: ['Fenitoína, carbamazepina, valproato', 'Lítio', 'Gabapentina e pregabalina', 'Ceftazidima, cefepima'],
      },
      {
        titulo: 'Estrutural (unilateral)',
        mecanismo: 'Lesão focal da alça tálamo-cortical, contralateral ao membro acometido.',
        itens: ['AVC talâmico', 'Lesão mesencefálica', 'Lesão de cápsula interna'],
      },
    ],
    ilustracao: {
      id: 'asterixe',
      params: {},
      alt: 'Mão em dorsiflexão sustentada com a queda intermitente do punho, animada',
    },
    patologias: ['encefalopatia-hepatica', 'cirrose-hepatica', 'doenca-renal-cronica'],
    referencias: [
      'Vilstrup H et al. Hepatic Encephalopathy in Chronic Liver Disease. AASLD/EASL, 2014.',
      'Porto CC. Semiologia Médica, 8ª ed.',
      'Agarwal R, Baid R. Asterixis. J Postgrad Med, 2016.',
    ],
  },

  {
    slug: 'tempo-de-enchimento-capilar',
    nome: 'Tempo de enchimento capilar',
    sinonimos: ['TEC', 'Perfusão periférica'],
    sistema: 'cardiovascular',
    resumo:
      'Cinco segundos de pressão, e a única medida de perfusão de microcirculação que cabe na ponta do dedo — hoje usada como alvo de ressuscitação.',
    definicao:
      'Tempo que o leito ungueal (ou a pele da região tenar) leva para recuperar a cor após compressão firme e sustentada por 5 segundos, com a mão do paciente na altura do coração. Considera-se prolongado acima de 3 segundos em adultos; em recém-nascidos e idosos os limiares são diferentes, e a temperatura ambiente desloca o valor.',
    comoProcurar: [
      {
        passo: 'Eleve a mão à altura do coração.',
        detalhe:
          'Mão pendente aumenta a pressão hidrostática e acelera artificialmente o retorno da cor; mão elevada acima do coração o retarda. É a fonte mais comum de erro.',
      },
      {
        passo: 'Comprima por 5 segundos, com força suficiente para embranquecer.',
        detalhe:
          'Compressões curtas não esvaziam o leito capilar completamente. O tempo de compressão é padronizado justamente porque a duração muda o resultado.',
      },
      {
        passo: 'Cronometre o retorno, não estime.',
        detalhe:
          'A estimativa a olho tem concordância ruim entre examinadores. Contar "mil e um, mil e dois" já é melhor que chutar; cronômetro é melhor ainda.',
      },
      {
        passo: 'Anote a temperatura ambiente e a do paciente.',
        detalhe:
          'Ambiente frio prolonga o TEC de gente saudável. Um TEC de 4 segundos num pronto-socorro gelado no inverno não é o mesmo achado que num ambiente aquecido.',
      },
      {
        passo: 'Repita seriadamente durante a ressuscitação.',
        detalhe:
          'O valor do TEC está na **tendência**. A normalização após expansão é um alvo de ressuscitação validado; um valor isolado diz muito menos.',
      },
    ],
    mecanismo:
      'A recuperação da cor depende do fluxo na microcirculação cutânea. Diante de queda do débito ou de hipovolemia, o simpático redireciona fluxo da pele e do território esplâncnico para coração e cérebro — e a pele é o primeiro órgão sacrificado, muito antes de a pressão arterial cair. Isso faz do enchimento capilar um marcador **precoce** de comprometimento hemodinâmico, e explica por que ele se altera em paciente ainda normotenso. Em choque distributivo, entretanto, o mecanismo é outro: há perda de acoplamento entre macro e microcirculação, e o TEC pode continuar alterado mesmo com débito cardíaco alto e pressão restaurada — sinal de que a perfusão tecidual não acompanhou o número do monitor.',
    significado:
      'Em choque, o TEC virou alvo de ressuscitação de verdade: o ensaio ANDROMEDA-SHOCK comparou ressuscitar guiado por perfusão periférica versus por lactato em choque séptico e a estratégia guiada por TEC não foi inferior, com menos disfunção orgânica em 72 horas — resultado que devolveu dignidade a um exame que se ensinava como folclore. Em pediatria, TEC prolongado compõe os critérios de choque descompensado. Em trauma e em desidratação, é parte do conjunto que estima a gravidade antes de qualquer exame.',
    armadilhas: [
      'Ambiente frio, idade avançada e pele escura alteram a medida. Interprete o TEC dentro do contexto, nunca isolado.',
      'A concordância entre examinadores é moderada. Serialize com o mesmo examinador quando possível.',
      'TEC normal não exclui choque, sobretudo no distributivo precoce, em que a pele pode estar quente e bem perfundida.',
      'Vasopressor em dose alta prolonga o TEC por vasoconstrição farmacológica, e não por hipoperfusão — o número passa a dizer outra coisa.',
    ],
    causas: [
      {
        titulo: 'Prolongado por baixo débito ou hipovolemia',
        mecanismo: 'Simpático desvia fluxo da pele para órgãos nobres.',
        itens: ['Choque hipovolêmico e hemorrágico', 'Choque cardiogênico', 'Desidratação', 'Choque obstrutivo'],
      },
      {
        titulo: 'Prolongado por vasoconstrição sem hipoperfusão sistêmica',
        mecanismo: 'A microcirculação cutânea fecha por causa local ou farmacológica.',
        itens: ['Ambiente frio', 'Vasopressores em dose alta', 'Doença arterial periférica', 'Raynaud'],
      },
    ],
    desempenho: [
      {
        alvo: 'Ressuscitação guiada por enchimento capilar versus por lactato no choque séptico',
        leitura:
          'Sem diferença significativa em mortalidade em 28 dias, com menor disfunção orgânica em 72 h no grupo guiado por perfusão periférica. Um sinal de exame físico que sustenta uma estratégia inteira de ressuscitação.',
        fonte: 'Hernández G et al. ANDROMEDA-SHOCK. JAMA, 2019;321(7):654-664.',
      },
    ],
    ilustracao: {
      id: 'enchimento-capilar',
      params: { segundos: 4 },
      alt: 'Leito ungueal recuperando a cor após compressão, com o cronômetro do teste',
    },
    patologias: ['choque-septico', 'choque-hipovolemico', 'desidratacao'],
    referencias: [
      'Hernández G et al. ANDROMEDA-SHOCK. JAMA, 2019.',
      'Lima A, Bakker J. Clinical assessment of peripheral circulation. Curr Opin Crit Care, 2015.',
    ],
  },

  {
    slug: 'palidez',
    nome: 'Palidez e palidez conjuntival',
    sinonimos: ['Descoramento', 'Hipocorado'],
    sistema: 'geral',
    resumo:
      'O "+/4+" que todo mundo escreve e quase ninguém calibra. Onde olhar muda completamente o desempenho do sinal.',
    definicao:
      'Redução da coloração rósea de pele e mucosas por diminuição da hemoglobina circulante ou por vasoconstrição cutânea. A pesquisa mais útil não é na pele: é na **conjuntiva palpebral inferior**, no leito ungueal e na prega palmar, onde a cor depende menos de melanina e de tônus vascular.',
    comoProcurar: [
      {
        passo: 'Everta a pálpebra inferior e olhe a conjuntiva, não a esclera.',
        detalhe:
          'A conjuntiva palpebral é um leito capilar fino e sem melanina — é o melhor ponto de leitura de hemoglobina no exame físico, e o único com desempenho publicado decente.',
      },
      {
        passo: 'Compare a prega palmar com a pele em volta.',
        detalhe:
          'Normalmente a prega é mais avermelhada que a palma. Prega palmar da mesma cor da pele circundante sugere hemoglobina abaixo de ~7 g/dL.',
      },
      {
        passo: 'Examine com a mão do paciente relaxada e aquecida.',
        detalhe:
          'Frio e ansiedade fecham o leito cutâneo e produzem palidez sem anemia. Pele branca não é sinônimo de hemoglobina baixa.',
      },
      {
        passo: 'Procure o conjunto, não o sinal isolado.',
        detalhe:
          'Palidez com taquicardia, sopro sistólico funcional, glossite e coiloníquia constrói o quadro de anemia crônica; palidez isolada em paciente bem não constrói quase nada.',
      },
    ],
    mecanismo:
      'A cor da pele e das mucosas resulta da soma de melanina, carotenoides e do sangue no plexo subpapilar — e, do sangue, o que dá cor é a hemoglobina. Menos hemoglobina por unidade de volume (anemia) ou menos volume de sangue no plexo (vasoconstrição por frio, dor, choque, hipoglicemia, simpático em descarga) produzem o mesmo efeito visual por caminhos diferentes. Essa superposição é a razão de o sinal ter especificidade ruim: o exame físico não distingue "pouca hemoglobina" de "pouco sangue no lugar certo".',
    significado:
      'Palidez conjuntival nítida tem razão de verossimilhança positiva razoável para anemia e justifica hemograma imediato; palidez duvidosa não tem valor. A decisão prática é honesta e simples: **suspeitou, dose a hemoglobina**. O sinal serve para escalonar urgência — palidez intensa com taquicardia e hipotensão postural é anemia aguda com repercussão até prova em contrário — e não para substituir o exame.',
    armadilhas: [
      'Vasoconstrição por frio, dor ou ansiedade produz palidez cutânea sem anemia nenhuma.',
      'Iluminação fluorescente e ambiente mal iluminado prejudicam a leitura — vale a mesma regra da icterícia.',
      'Anemia de instalação lenta pode cursar com palidez discreta apesar de hemoglobina muito baixa: o paciente compensa e a cor engana.',
      'A graduação em cruzes não tem padronização nem reprodutibilidade. Descreva o achado ("palidez conjuntival evidente") em vez de quantificar o que não se mede.',
    ],
    causas: [
      {
        titulo: 'Anemia',
        mecanismo: 'Menos hemoglobina circulante.',
        itens: [
          'Ferropriva (a mais comum)',
          'Sangramento agudo',
          'Doença crônica e doença renal crônica',
          'Megaloblástica (B12, folato)',
          'Hemólise, aplasia, infiltração medular',
        ],
      },
      {
        titulo: 'Vasoconstrição cutânea',
        mecanismo: 'Sangue desviado da pele, com hemoglobina normal.',
        itens: ['Frio, dor, ansiedade', 'Choque de qualquer causa', 'Hipoglicemia', 'Feocromocitoma'],
      },
    ],
    desempenho: [
      {
        alvo: 'Palidez conjuntival para anemia',
        razaoPositiva: '~4,5',
        razaoNegativa: '~0,6',
        leitura:
          'Quando presente e nítida, aumenta bem a probabilidade de anemia. Quando ausente, reduz pouco — não serve para descartar.',
        fonte: 'Sheth TN et al. The relation of conjunctival pallor to the presence of anemia. J Gen Intern Med, 1997.',
      },
    ],
    ilustracao: {
      id: 'palidez',
      params: { hemoglobina: 7 },
      alt: 'Conjuntiva palpebral e prega palmar em graus de palidez conforme a hemoglobina',
    },
    patologias: ['anemia-ferropriva', 'doenca-renal-cronica', 'hemorragia-digestiva-alta'],
    referencias: [
      'Sheth TN et al. J Gen Intern Med, 1997;12(2):102-6.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'estigmas-hepaticos-cutaneos',
    nome: 'Estigmas cutâneos de hepatopatia',
    sinonimos: ['Aranha vascular', 'Spider naevus', 'Eritema palmar', 'Telangiectasia aracniforme'],
    sistema: 'pele',
    resumo:
      'Um punhado de achados de pele que valem por uma anamnese inteira — e que se explicam todos pelo mesmo excesso de estrogênio circulante.',
    definicao:
      'Conjunto de alterações cutâneas associadas à hepatopatia crônica. As principais: **aranha vascular** (arteríola central com radiações finas, que embranquece à compressão central e reenche do centro para a periferia), **eritema palmar** (hiperemia das eminências tênar e hipotênar poupando o centro da palma), **ginecomastia**, **rarefação de pelos** e **unhas de Terry** (leito ungueal branco-leitoso com faixa distal rósea de 1–2 mm).',
    comoProcurar: [
      {
        passo: 'Procure aranhas no território da veia cava superior.',
        detalhe:
          'Face, pescoço, tórax anterior, ombros e braços. Aranhas abaixo da linha mamilar são raras — lesão vascular em membro inferior quase nunca é aranha.',
      },
      {
        passo: 'Comprima o centro com a ponta de uma lâmina ou de um clipe.',
        detalhe:
          'A lesão toda embranquece; ao soltar, o enchimento parte **do centro para as radiações**. É esse padrão centrífugo que a distingue de petéquia (não embranquece) e de telangiectasia comum (enche por toda parte).',
      },
      {
        passo: 'Conte as aranhas.',
        detalhe:
          'Uma ou duas podem ser fisiológicas — aparecem na gravidez, em uso de anticoncepcional e em até 15% de adultos saudáveis. Mais de três ou quatro, ou aranhas grandes e em aumento, mudam o peso do achado.',
      },
      {
        passo: 'Abra a mão do paciente sob boa luz.',
        detalhe:
          'O eritema palmar poupa a porção central da palma e respeita as eminências. Eritema difuso em toda a palma costuma ser outra coisa (dermatite, policitemia, artrite reumatoide, gravidez, hipertireoidismo).',
      },
      {
        passo: 'Some ao resto do exame: ascite, circulação colateral, ginecomastia, asterixe, esplenomegalia.',
        detalhe:
          'Nenhum estigma isolado fecha diagnóstico; o conjunto é o que constrói probabilidade alta de cirrose antes de qualquer exame.',
      },
    ],
    mecanismo:
      'O fio comum é o estrogênio. O fígado cirrótico metaboliza mal os androgênios circulantes, que sofrem aromatização periférica aumentada em estrona e estradiol; sobe também a globulina ligadora de hormônios sexuais, reduzindo a fração livre de testosterona. O resultado é uma relação estrogênio/androgênio deslocada, que promove vasodilatação e neoangiogênese cutânea — daí a arteríola central da aranha, com seu fluxo pulsátil visível à lupa, e a hiperemia tênar e hipotênar. O mesmo desequilíbrio explica ginecomastia, rarefação de pelos e atrofia testicular. As unhas de Terry seguem outro caminho: hipoalbuminemia e alteração do leito vascular subungueal tornam o leito opaco e esbranquiçado.',
    significado:
      'Múltiplas aranhas vasculares em homem adulto pedem investigação de hepatopatia crônica — sorologias virais, história de álcool, avaliação metabólica e elastografia ou ultrassom. O número e o tamanho das aranhas correlacionam-se grosseiramente com a gravidade da hepatopatia e, em alguns estudos, com risco de sangramento varicoso. Em mulher jovem, gestante ou em uso de contraceptivo, uma ou duas aranhas são achado sem significado.',
    armadilhas: [
      'Aranha isolada é comum em pessoas saudáveis, sobretudo mulheres jovens e gestantes.',
      'Telangiectasia hereditária hemorrágica (Osler-Weber-Rendu) faz lesões parecidas, mas em lábios, língua e mucosa nasal, com epistaxe de repetição e história familiar.',
      'Eritema palmar tem uma lista longa de causas não hepáticas: gravidez, hipertireoidismo, artrite reumatoide, policitemia, fármacos.',
      'Ausência de estigmas não afasta cirrose. Boa parte dos cirróticos compensados tem exame de pele normal.',
    ],
    causas: [
      {
        titulo: 'Hepatopatia crônica',
        mecanismo: 'Desequilíbrio estrogênio/androgênio por metabolização hepática reduzida e aromatização periférica.',
        itens: ['Cirrose de qualquer etiologia', 'Hepatite alcoólica', 'Hepatite crônica viral avançada'],
      },
      {
        titulo: 'Estados hiperestrogênicos não hepáticos',
        mecanismo: 'Mesma via final, sem doença de fígado.',
        itens: ['Gravidez', 'Contraceptivo oral e terapia hormonal', 'Tireotoxicose'],
      },
    ],
    ilustracao: {
      id: 'aranha-vascular',
      params: {},
      alt: 'Aranha vascular com arteríola central e radiações, e palma com eritema tênar e hipotênar',
    },
    patologias: ['cirrose-hepatica', 'hepatite-alcoolica'],
    referencias: [
      'Porto CC. Semiologia Médica, 8ª ed.',
      'Li CP et al. Spider angiomas in patients with liver cirrhosis. Scand J Gastroenterol, 1999.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },

  {
    slug: 'sinal-de-murphy',
    nome: 'Sinal de Murphy',
    sinonimos: ['Murphy clínico', 'Murphy ultrassonográfico'],
    sistema: 'abdome',
    resumo:
      'Só vale se a inspiração for **interrompida** pela dor. "Dor ao palpar o hipocôndrio direito" não é Murphy e não tem o mesmo peso.',
    definicao:
      'Interrupção súbita da inspiração profunda quando os dedos do examinador, posicionados sob o rebordo costal direito na linha hemiclavicular, encontram a vesícula inflamada que desce com o diafragma. O critério é a **parada da inspiração**, não o relato de dor. O sinal de Murphy ultrassonográfico é o mesmo fenômeno provocado com a ponta do transdutor sobre a vesícula identificada na imagem.',
    comoProcurar: [
      {
        passo: 'Posicione os dedos sob o rebordo costal direito, na linha hemiclavicular, com o paciente expirado.',
        detalhe:
          'A vesícula está sob o fígado, e só encontra a mão quando o diafragma a empurra para baixo na inspiração. Palpar durante a expiração não produz o encontro.',
      },
      {
        passo: 'Peça uma inspiração profunda e observe.',
        detalhe:
          'O achado é a **parada** da inspiração com careta, não o "dói". Descrever "Murphy positivo" para dor à palpação infla a positividade e destrói a especificidade do sinal.',
      },
      {
        passo: 'Compare com o hipocôndrio esquerdo.',
        detalhe:
          'A manobra do lado esquerdo não deve interromper a respiração. O contraste dá ao examinador a referência do próprio paciente.',
      },
      {
        passo: 'Repita com o transdutor quando houver ultrassom disponível.',
        detalhe:
          'O Murphy ultrassonográfico é mais específico porque a pressão é aplicada exatamente sobre a vesícula vista na tela, e não sobre a topografia presumida.',
      },
    ],
    mecanismo:
      'A obstrução persistente do ducto cístico por cálculo impede o esvaziamento da vesícula. A parede distende, a mucosa continua secretando, e a estase associada à irritação química por sais biliares concentrados desencadeia inflamação parietal. Quando essa inflamação alcança o peritônio visceral e depois o parietal adjacente, o contato mecânico passa a doer: é o que a mão do examinador provoca quando a vesícula desce contra ela na inspiração. A parada respiratória é reflexa — o paciente interrompe o movimento que produz a dor antes de conseguir verbalizá-la.',
    significado:
      'Murphy positivo, em paciente com dor em hipocôndrio direito, febre e leucocitose, sustenta colecistite aguda e indica ultrassom imediato. Nenhum achado isolado do exame físico é suficiente: a combinação clínica mais ultrassom com cálculo, espessamento parietal acima de 3 mm, líquido pericolecístico e Murphy ultrassonográfico é o que define. Atenção ao paciente idoso e ao diabético, em que a colecistite pode cursar sem febre, sem defesa e com Murphy negativo, e ainda assim já estar gangrenada.',
    armadilhas: [
      'Chamar dor à palpação de "Murphy positivo" é o erro mais comum e esvazia o sinal.',
      'Sensibilidade baixa em idosos — a colecistite aguda pode ser paucissintomática justamente em quem tem pior prognóstico.',
      'Analgesia prévia, sobretudo opioide, reduz a positividade sem reduzir a doença.',
      'Colangite dá dor no mesmo lugar. A tríade de Charcot (dor, febre, icterícia) desloca o diagnóstico e a urgência para drenagem da via biliar.',
      'Murphy positivo também aparece em hepatite aguda, abscesso hepático e pielonefrite direita.',
    ],
    causas: [
      {
        titulo: 'Inflamação da vesícula biliar',
        mecanismo: 'Obstrução do ducto cístico com distensão e inflamação parietal.',
        itens: ['Colecistite aguda calculosa', 'Colecistite alitiásica (paciente crítico)', 'Colecistite gangrenosa'],
      },
      {
        titulo: 'Falso-positivo por inflamação vizinha',
        mecanismo: 'Estruturas adjacentes irritam o mesmo território peritoneal.',
        itens: ['Hepatite aguda', 'Abscesso hepático', 'Pielonefrite direita', 'Pneumonia de base direita'],
      },
    ],
    desempenho: [
      {
        alvo: 'Sinal de Murphy clínico para colecistite aguda',
        sensibilidade: '~65%',
        especificidade: '~87%',
        razaoPositiva: '~2,8',
        leitura: 'Ajuda quando positivo, mas não decide sozinho; a ausência não exclui, especialmente em idosos.',
        fonte: 'Trowbridge RL et al. Does This Patient Have Acute Cholecystitis? JAMA, 2003;289(1):80-6.',
      },
      {
        alvo: 'Murphy ultrassonográfico associado a colelitíase',
        razaoPositiva: '~2,7',
        leitura: 'Combinado ao cálculo visível, é o par de achados que mais sustenta o diagnóstico à beira do leito.',
        fonte: 'Ralls PW et al. Radiology, 1985.',
      },
    ],
    ilustracao: {
      id: 'murphy',
      params: {},
      alt: 'Posição da mão sob o rebordo costal direito e a descida da vesícula na inspiração',
    },
    patologias: ['colecistite-aguda', 'colelitiase'],
    referencias: [
      'Trowbridge RL et al. JAMA, 2003;289(1):80-6.',
      'Tokyo Guidelines 2018 para colecistite aguda.',
    ],
  },

  {
    slug: 'descompressao-dolorosa',
    nome: 'Descompressão brusca dolorosa (Blumberg)',
    sinonimos: ['Sinal de Blumberg', 'Rebote', 'Rebound tenderness'],
    sistema: 'abdome',
    resumo:
      'O sinal mais pedido e um dos mais fracos: rigidez involuntária e dor à percussão superam o rebote, e doem menos no paciente.',
    definicao:
      'Dor referida no momento da retirada súbita da mão que comprimia lenta e profundamente a parede abdominal. Indica irritação do peritônio parietal. Faz parte do conjunto de sinais de irritação peritoneal, junto com defesa voluntária, **rigidez involuntária** e dor à percussão.',
    comoProcurar: [
      {
        passo: 'Comprima devagar e fundo, e só então retire de uma vez.',
        detalhe:
          'A compressão lenta permite ao paciente relaxar; é a descompressão súbita que movimenta os folhetos peritoneais inflamados um contra o outro.',
      },
      {
        passo: 'Comece longe do ponto de maior dor.',
        detalhe:
          'Examinar primeiro o quadrante doloroso gera defesa voluntária que contamina todo o resto do exame. Vá do quadrante mais distante para o mais próximo.',
      },
      {
        passo: 'Prefira a dor à percussão leve.',
        detalhe:
          'A percussão suave provoca o mesmo estiramento peritoneal com desempenho semelhante e muito menos sofrimento. É a alternativa humana ao rebote, e vale tanto quanto.',
      },
      {
        passo: 'Procure rigidez involuntária com a mão pousada e quente.',
        detalhe:
          'A rigidez involuntária — contração da musculatura que não cede à distração nem ao relaxamento — é o achado de irritação peritoneal com maior especificidade, bem acima do Blumberg.',
      },
      {
        passo: 'Use a tosse ou o salto como triagem.',
        detalhe:
          'Pedir que o paciente tussa ou bata o calcanhar no chão reproduz a dor peritoneal sem nenhuma manobra invasiva — e o que dói à tosse merece exame cuidadoso.',
      },
    ],
    mecanismo:
      'O peritônio visceral tem inervação autonômica e produz dor vaga, mal localizada, referida à linha média conforme o segmento embrionário. Quando o processo inflamatório alcança o **peritônio parietal**, entram em cena fibras somáticas dos nervos espinhais correspondentes, e a dor passa a ser bem localizada, intensa e reprodutível pelo movimento. A descompressão súbita faz os folhetos inflamados deslizarem e se separarem de forma abrupta, estirando essas terminações somáticas. A mesma via explica a migração clássica da apendicite: dor periumbilical vaga (visceral, T10) que, ao acometer o peritônio parietal da fossa ilíaca direita, migra e se localiza.',
    significado:
      'Sinais de irritação peritoneal mudam a conduta: pedem avaliação cirúrgica, imagem e, com frequência, jejum e antibiótico. Mas o Blumberg isolado tem desempenho modesto e não deve carregar a decisão sozinho. Numa suspeita de apendicite, o raciocínio moderno usa escore (Alvarado, AIR) e imagem; em abdome agudo com rigidez involuntária difusa, a pergunta deixa de ser "qual exame" e passa a ser "quanto tempo até a sala".',
    armadilhas: [
      'Desempenho fraco: razão de verossimilhança positiva em torno de 2 para apendicite. Não sustenta indicação cirúrgica sozinho.',
      'Provoca dor desnecessária quando a percussão suave dá a mesma informação.',
      'Defesa **voluntária** (o paciente contrai porque antecipa a dor) é confundida com rigidez involuntária. Converse, distraia, aqueça a mão, reexamine.',
      'Idosos, imunossuprimidos, obesos e gestantes no terceiro trimestre podem ter peritonite com exame abdominal pobre.',
      'Causas extra-abdominais imitam o quadro: pneumonia de base, cetoacidose diabética, porfiria, herpes-zóster pré-eruptivo.',
    ],
    causas: [
      {
        titulo: 'Peritonite localizada',
        mecanismo: 'Inflamação de uma víscera atinge o peritônio parietal vizinho.',
        itens: ['Apendicite aguda', 'Colecistite aguda', 'Diverticulite', 'Doença inflamatória pélvica'],
      },
      {
        titulo: 'Peritonite difusa',
        mecanismo: 'Conteúdo visceral livre na cavidade irrita o peritônio inteiro.',
        itens: [
          'Perfuração de víscera oca (úlcera péptica, divertículo, neoplasia)',
          'Isquemia mesentérica com necrose',
          'Peritonite bacteriana espontânea (nem sempre com rebote)',
        ],
      },
    ],
    desempenho: [
      {
        alvo: 'Descompressão dolorosa para apendicite aguda',
        sensibilidade: '~63%',
        especificidade: '~69%',
        razaoPositiva: '~2,0',
        leitura:
          'Desempenho modesto. Rigidez involuntária (LR+ ~3,8) e dor migratória (LR+ ~3,1) pesam mais e custam menos ao paciente.',
        fonte: 'Wagner JM et al. Does This Patient Have Appendicitis? JAMA, 1996;276(19):1589-94.',
      },
    ],
    ilustracao: {
      id: 'blumberg',
      params: {},
      alt: 'Quadrantes abdominais com a sequência da compressão lenta e da descompressão súbita',
    },
    patologias: ['apendicite-aguda', 'diverticulite-aguda', 'peritonite-bacteriana-espontanea'],
    referencias: [
      'Wagner JM et al. Does This Patient Have Appendicitis? JAMA, 1996.',
      'McGee S. Evidence-Based Physical Diagnosis, 5ª ed.',
    ],
  },
]

/**
 * O acervo inteiro. Os sinais gerais (icterícia, edema, cianose…) abrem a
 * lista porque são os que o aluno procura primeiro; os do exame por sistema
 * vêm nos seus próprios arquivos, agrupados pela lógica com que se examina.
 */
export const SINAIS: Sinal[] = [
  ...SINAIS_GERAIS,
  ...SINAIS_CARDIORRESPIRATORIOS,
  ...SINAIS_NEURO_ABDOME,
  ...SINAIS_VASCULARES_E_DE_PELE,
  // Terceira leva: 150 sinais com fotografia — pele, cabeça e olho, aparelho
  // locomotor, neurológico e pediatria. Sem figura paramétrica: o caso real
  // do Commons é a imagem, e a ficha é o que a torna ensino.
  ...SINAIS_PELE_1,
  ...SINAIS_PELE_2,
  ...SINAIS_CABECA_E_OLHO,
  ...SINAIS_MSK_E_NEURO,
]

export const TOTAL_DE_SINAIS = SINAIS.length

export function sinalPorSlug(slug: string): Sinal | undefined {
  return SINAIS.find((sinal) => sinal.slug === slug)
}

export function sinaisDoComparador(slug: string): Sinal[] {
  return SINAIS.filter((sinal) => sinal.comparador === slug)
}

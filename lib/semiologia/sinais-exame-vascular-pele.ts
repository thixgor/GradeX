import type { Sinal } from './esquemas'

/**
 * Sinais vasculares periféricos e de pele. São os que mais ganham com a
 * fotografia real — cor, borda, brilho e textura não cabem num esquema —, e é
 * por isso que aqui o caso real vem primeiro e a figura paramétrica fica como
 * referência do **limiar**: a área a partir da qual a celulite interna, o
 * índice a partir do qual a perna é isquêmica, o diâmetro que separa petéquia
 * de equimose.
 */
export const SINAIS_VASCULARES_E_DE_PELE: Sinal[] = [
  {
    slug: 'indice-tornozelo-braquial-reduzido',
    nome: 'Índice tornozelo-braquial reduzido',
    sinonimos: ['ITB < 0,9', 'Índice tornozelo-braço', 'ABI'],
    sistema: 'cardiovascular',
    resumo: 'A pressão do tornozelo dividida pela do braço dá menos de 0,9 — a artéria da perna está estreitada, mesmo sem dor, e o coração provavelmente também.',
    definicao:
      'Razão entre a maior pressão sistólica do tornozelo (tibial posterior ou pediosa, com Doppler) e a maior pressão sistólica dos braços. Normal: 1,0 a 1,4. Limítrofe: 0,91 a 0,99. Doença arterial periférica: ≤ 0,90. Grave: < 0,50 (isquemia crítica provável). > 1,40: artérias calcificadas e não compressíveis (diabetes, doença renal), valor não interpretável — usar índice dedo-braquial.',
    comoProcurar: [
      { passo: 'Paciente deitado 5 a 10 minutos. Meça a pressão sistólica nos dois braços com Doppler sobre a braquial.', detalhe: 'A maior das duas é o denominador. Diferença > 15 mmHg entre os braços é achado à parte (estenose de subclávia).' },
      { passo: 'Manguito acima do tornozelo; Doppler sobre a tibial posterior, depois sobre a pediosa. Insufle até o som sumir, desinfle e anote onde volta.', detalhe: 'Sem Doppler, a palpação subestima muito. O sinal é o retorno do som, não do pulso.' },
      { passo: 'Divida a maior pressão de cada tornozelo pela maior pressão braquial.', detalhe: 'Um índice por perna. Anote os dois com duas casas decimais: 0,86 e 0,72 contam histórias diferentes.' },
      { passo: 'Se o índice está normal e a história é de claudicação, repita após exercício (esteira ou 30 flexões plantares).', detalhe: 'Queda ≥ 20% após esforço desmascara estenose que o repouso compensa.' },
    ],
    mecanismo:
      'A pressão sistólica no tornozelo de uma pessoa deitada é igual ou ligeiramente maior que a do braço, porque a onda de pulso se amplifica ao percorrer artérias que se estreitam progressivamente. Uma estenose no trajeto (aorta, ilíaca, femoral, poplítea) dissipa energia: a pressão a jusante cai proporcionalmente à gravidade da obstrução. Dividir pela pressão do braço normaliza a pressão sistêmica do dia e isola a queda causada pela artéria da perna. Artérias calcificadas (média de Mönckeberg) não colabam sob o manguito e dão pressões falsamente altas — o índice > 1,4 é artefato, não saúde.',
    significado:
      'ITB ≤ 0,90 diagnostica doença arterial periférica com acurácia comparável à angiografia para estenoses ≥ 50%, e a maioria dos pacientes é assintomática. Além do diagnóstico, é um marcador de risco cardiovascular independente: quem tem ITB baixo tem duas a três vezes mais infarto e AVC, e morre mais. Muda a conduta em três frentes: exercício supervisionado e cessação do tabagismo, estatina e antiagregante para o risco global, e revascularização quando há isquemia crítica (ITB < 0,5, dor de repouso, úlcera). Em úlcera de perna, o ITB decide se a compressão é segura (> 0,8) ou perigosa (< 0,6).',
    armadilhas: [
      'ITB > 1,4 não é normal: é calcificação. Peça índice dedo-braquial ou registro de onda.',
      'Medir sem Doppler ou sem repouso prévio erra para cima e para baixo.',
      'Índice normal em repouso com claudicação típica: repita após exercício.',
      'Comprimir uma perna com ITB < 0,6 por úlcera "venosa" causa necrose. Meça antes de enfaixar.',
    ],
    causas: [
      { titulo: 'Estenose ou oclusão arterial', mecanismo: 'Perda de pressão através da lesão.', itens: ['Aterosclerose (tabagismo, diabetes, hipertensão, dislipidemia)', 'Tromboangeíte obliterante (Buerger)', 'Arterite de Takayasu', 'Displasia fibromuscular', 'Aprisionamento poplíteo (jovem)'] },
      { titulo: 'Índice falsamente alto (> 1,4)', mecanismo: 'Artéria não compressível.', itens: ['Calcificação da média (diabetes, doença renal crônica, idade)'] },
    ],
    desempenho: [
      { alvo: 'Estenose ≥ 50% à angiografia (ITB ≤ 0,90)', sensibilidade: '~75%', especificidade: '~95%', razaoPositiva: '~15', razaoNegativa: '~0,26', leitura: 'Positivo, fecha o diagnóstico; negativo em repouso, não afasta a estenose moderada — teste após exercício.', fonte: 'Xu D et al. Sensitivity and specificity of the ankle-brachial index to diagnose peripheral artery disease: a structured review. Vasc Med, 2010.' },
    ],
    ilustracao: { id: 'pulso', params: { achado: 'itb', valor: 0.7 }, alt: 'Barras comparando a pressão sistólica do braço e do tornozelo, com o índice calculado' },
    patologias: ['doenca-arterial-periferica'],
    referencias: ['Aboyans V et al. Measurement and interpretation of the ankle-brachial index: a scientific statement from the AHA. Circulation, 2012.', 'Gerhard-Herman MD et al. 2016 AHA/ACC Guideline on the Management of Patients With Lower Extremity PAD.'],
  },
  {
    slug: 'ulcera-arterial',
    nome: 'Úlcera arterial',
    sinonimos: ['Úlcera isquêmica', 'Úlcera de membro por insuficiência arterial'],
    sistema: 'cardiovascular',
    resumo: 'Pequena, redonda, seca, funda e muito dolorosa, nos dedos ou no calcanhar de um pé frio e sem pulso — a pele que morreu porque não chegou sangue.',
    definicao:
      'Ferida em membro inferior, geralmente distal (dedos, bordas do pé, calcanhar, maléolo lateral, proeminências ósseas), pequena, de bordas nítidas e "em saca-bocado", leito pálido ou necrótico, seco, sem tecido de granulação, dor intensa que piora com a elevação e melhora ao pendurar a perna, em membro com pulsos distais ausentes ou reduzidos, pele fria, fina, sem pelos, e ITB < 0,9 (em geral < 0,5).',
    comoProcurar: [
      { passo: 'Localize: dedos, face lateral do pé ou tornozelo, calcanhar, pontos de pressão.', detalhe: 'Úlcera venosa é medial e supramaleolar; arterial é distal e sobre osso. A localização já separa a maioria.' },
      { passo: 'Olhe o leito e a borda.', detalhe: 'Arterial: leito pálido, cinza ou preto, seco, borda em degrau, sem granulação. Venosa: leito vermelho, úmido, granulando, borda irregular e rasa.' },
      { passo: 'Pergunte sobre a dor e o que a alivia.', detalhe: 'Dor que acorda à noite e melhora sentando com a perna para fora da cama é isquemia de repouso. A venosa dói pouco e melhora elevando.' },
      { passo: 'Palpe os pulsos, sinta a temperatura e meça o ITB.', detalhe: 'Pulsos ausentes e ITB < 0,5 confirmam. ITB > 0,8 com esta ferida obriga a rever o diagnóstico.' },
    ],
    mecanismo:
      'Quando a perfusão cai abaixo do que a pele precisa para se manter viva, o tecido mais distal e mais pressionado morre primeiro — os dedos e as proeminências ósseas, onde a compressão do sapato ou da cama espreme os poucos capilares que restam. A ferida não cicatriza porque cicatrizar exige mais sangue do que manter: sem oxigênio não há granulação, e o leito fica pálido e seco. A dor é intensa porque os nervos isquêmicos disparam; melhora ao pendurar a perna porque a gravidade acrescenta alguns milímetros de mercúrio de pressão de perfusão, e piora ao elevar pelo motivo inverso. É a definição clínica de isquemia crítica: dor de repouso ou lesão trófica com pressão de tornozelo < 50 a 70 mmHg.',
    significado:
      'Úlcera arterial é isquemia crítica de membro — sem revascularização, 25% dos pacientes perdem a perna em um ano e outros 25% morrem. Reconhecê-la muda tudo: contraindica a compressão (que a piora), exige angiografia ou angiotomografia e revascularização (endovascular ou cirúrgica), controle da dor, cuidado com a ferida sem desbridamento agressivo até que haja fluxo, e tratamento intensivo dos fatores de risco. A úlcera mista (arterial e venosa), comum no idoso, exige o ITB antes de qualquer curativo compressivo.',
    armadilhas: [
      'Tratar como venosa e comprimir. O ITB antes de enfaixar é obrigatório em toda úlcera de perna.',
      'Desbridar necrose seca de um pé isquêmico sem fluxo abre uma ferida maior que não vai fechar. Revascularize primeiro.',
      'No diabético, a úlcera plantar indolor com pulsos presentes é neuropática; a arterial dói e não tem pulso. Muitas são mistas.',
      'Pé quente e vermelho ao pendurar (rubor de dependência) não é celulite: é vasodilatação máxima de um pé isquêmico.',
    ],
    causas: [
      { titulo: 'Insuficiência arterial crônica', mecanismo: 'Perfusão insuficiente para manter a pele viva.', itens: ['Aterosclerose periférica (isquemia crítica)', 'Tromboangeíte obliterante (Buerger, jovem fumante)', 'Embolização de colesterol', 'Vasculites (poliarterite, crioglobulinemia)', 'Esclerodermia (úlceras de polpa digital)'] },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'ulcera-arterial', valor: 3 }, alt: 'Perna pálida com úlcera pequena e profunda no dorso do pé, leito escuro e seco' },
    patologias: ['doenca-arterial-periferica'],
    referencias: ['Conte MS et al. Global vascular guidelines on the management of chronic limb-threatening ischemia. J Vasc Surg, 2019.', 'Grey JE, Harding KG, Enoch S. Venous and arterial leg ulcers. BMJ, 2006.'],
  },
  {
    slug: 'ulcera-venosa',
    nome: 'Úlcera venosa',
    sinonimos: ['Úlcera de estase', 'Úlcera varicosa', 'Úlcera por insuficiência venosa crônica'],
    sistema: 'cardiovascular',
    resumo: 'Grande, rasa, úmida e irregular, logo acima do tornozelo por dentro, numa perna inchada e manchada de marrom — o sangue que não subiu e ficou destruindo a pele por baixo.',
    definicao:
      'Ferida na região da "polaina" (terço inferior da perna), tipicamente supramaleolar medial, extensa, rasa, de bordas irregulares e mal definidas, leito vermelho com granulação e exsudato abundante, pouco dolorosa (ou com dor que melhora à elevação), em perna com edema, dermatite ocre (hiperpigmentação marrom), lipodermatoesclerose (pele endurecida em "garrafa invertida"), eczema de estase, varizes e pulsos distais presentes, com ITB > 0,8.',
    comoProcurar: [
      { passo: 'Localize e meça.', detalhe: 'Supramaleolar medial é a regra; a área em cm² (comprimento × largura) é o que se acompanha semana a semana.' },
      { passo: 'Olhe o leito, a borda e a quantidade de exsudato.', detalhe: 'Vermelho e granulando, úmido, borda plana e irregular: venosa. Leito amarelo com fibrina é venosa estagnada; preto e seco não é venosa.' },
      { passo: 'Examine a pele ao redor: cor, dureza, eczema, varizes.', detalhe: 'Dermatite ocre e lipodermatoesclerose são as cicatrizes da hipertensão venosa e confirmam a origem.' },
      { passo: 'Palpe os pulsos e meça o ITB antes de decidir a compressão.', detalhe: 'ITB > 0,8: compressão total é segura e é o tratamento. 0,6 a 0,8: compressão reduzida. < 0,6: não comprima — investigue a artéria.' },
    ],
    mecanismo:
      'Válvulas venosas incompetentes (varizes, sequela de trombose) deixam o sangue refluir para a perna quando o paciente está de pé, e a pressão venosa no tornozelo, que deveria cair para 20 a 30 mmHg ao andar, permanece perto de 90. Essa hipertensão crônica distende os capilares, que vazam fibrinogênio, hemácias e leucócitos para o interstício: a fibrina forma manguitos ao redor dos capilares, a hemossiderina das hemácias tinge a pele de marrom (dermatite ocre), e os leucócitos ativados liberam proteases que destroem a derme (lipodermatoesclerose). A pele enrijecida e mal nutrida rompe ao menor trauma, e a mesma hipertensão que a destruiu impede que cicatrize — até que a compressão reverta a pressão.',
    significado:
      'É a causa de 70% das úlceras de perna, e a única cujo tratamento é mecânico: compressão graduada de 30 a 40 mmHg no tornozelo, elevação e caminhada cicatrizam 60 a 70% em seis meses. Identificá-la corretamente — e confirmar com o ITB que a artéria está boa — é o que autoriza a compressão, que seria catastrófica numa úlcera arterial. Muda também o longo prazo: meia elástica pela vida ou correção do refluxo (ablação de safena) para evitar a recidiva, que sem isso passa de 50%.',
    armadilhas: [
      'Comprimir sem ITB. A úlcera mista existe, e a compressão total num ITB de 0,5 perde a perna.',
      'Úlcera venosa que não melhora em 3 meses de compressão bem feita, ou com borda elevada e endurecida, deve ser biopsiada — carcinoma espinocelular (úlcera de Marjolin) ou basocelular.',
      'Celulite ao redor de úlcera venosa é superdiagnosticada: eczema de estase e lipodermatoesclerose aguda dão vermelho e calor sem infecção. Febre e leucocitose decidem.',
      'Úlcera venosa dói pouco; úlcera na perna venosa que dói muito pede ITB, cultura e biópsia.',
    ],
    causas: [
      { titulo: 'Hipertensão venosa crônica', mecanismo: 'Refluxo ou obstrução venosa com dano microcirculatório.', itens: ['Insuficiência valvular superficial (varizes)', 'Síndrome pós-trombótica', 'Insuficiência de perfurantes', 'Obstrução venosa proximal (compressão, May-Thurner)', 'Falha da bomba muscular da panturrilha (imobilidade, anquilose de tornozelo)'] },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'ulcera-venosa', valor: 8 }, alt: 'Perna edemaciada com pele acastanhada e úlcera rasa e úmida acima do maléolo medial' },
    patologias: ['insuficiencia-venosa-cronica', 'trombose-venosa-profunda'],
    referencias: ['O’Donnell TF et al. Management of venous leg ulcers: clinical practice guidelines of the SVS and AVF. J Vasc Surg, 2014.', 'Grey JE, Harding KG, Enoch S. Venous and arterial leg ulcers. BMJ, 2006.'],
  },
  {
    slug: 'isquemia-aguda-de-membro',
    nome: 'Isquemia aguda de membro',
    sinonimos: ['Os seis P', 'Oclusão arterial aguda', 'Membro ameaçado'],
    sistema: 'cardiovascular',
    resumo: 'Dor súbita, palidez, pulso ausente, frio, formigamento e, por fim, paralisia — os seis P em ordem, e o relógio de seis horas começou quando a dor começou.',
    definicao:
      'Queda súbita (< 14 dias, em geral horas) da perfusão de um membro, com ameaça à sua viabilidade. Os seis sinais clássicos: dor (pain), palidez (pallor), ausência de pulso (pulselessness), frialdade (poikilothermia), parestesia e paralisia. Os dois últimos marcam o comprometimento neurológico e a urgência. Classificação de Rutherford: I viável (sem déficit); IIa marginalmente ameaçado (parestesia leve, Doppler arterial inaudível); IIb imediatamente ameaçado (dor de repouso, déficit sensitivo e motor); III irreversível (anestesia, paralisia, rigidez, marmoreado fixo).',
    comoProcurar: [
      { passo: 'Compare os dois membros: cor, temperatura (dorso da mão) e enchimento capilar.', detalhe: 'Encontre o nível em que a pele volta a esquentar — é a altura da oclusão, um segmento acima.' },
      { passo: 'Palpe os pulsos do proximal ao distal e confirme com Doppler.', detalhe: 'Pulso femoral presente e poplíteo ausente: oclusão femoral. Doppler arterial inaudível já é Rutherford IIa; venoso inaudível é III.' },
      { passo: 'Teste a sensibilidade (toque leve nos dedos) e a força (mover os dedos e o pé).', detalhe: 'Parestesia é o primeiro sinal neurológico; paralisia é o último. Entre um e outro, a janela fecha.' },
      { passo: 'Pergunte a hora exata do início e procure a fonte: fibrilação atrial, infarto recente, aneurisma, claudicação prévia.', detalhe: 'Início abrupto sem claudicação prévia e membro contralateral com pulsos normais é embolia. Piora aguda de claudicação crônica é trombose sobre placa.' },
    ],
    mecanismo:
      'Um êmbolo (do coração, na fibrilação atrial ou após infarto; de um aneurisma) ou um trombo sobre placa ocluem subitamente uma artéria principal. Sem colaterais desenvolvidas — o caso da embolia num membro até então normal —, o fluxo cai para quase zero. O nervo periférico é o tecido mais sensível: em 4 a 6 horas começa a isquemia irreversível, primeiro das fibras sensitivas (parestesia), depois das motoras (paralisia). O músculo tolera 6 a 8 horas; a pele, mais. A palidez é a ausência de sangue; o marmoreado que não branqueia à pressão é o sangue estagnado em capilares mortos; a rigidez muscular é a necrose. Quando o fluxo é restabelecido tarde, o músculo necrótico libera potássio, mioglobina e ácido — a síndrome de reperfusão que pode matar o paciente que salvou a perna.',
    significado:
      'É uma das poucas emergências em que o exame físico define o tempo: Rutherford IIb precisa de revascularização em horas, sem esperar exames de imagem que atrasem; IIa permite angiografia antes; III não se revasculariza — amputa-se, porque reperfundir músculo morto mata. Heparina imediata em todos os viáveis. O reconhecimento tardio custa a perna em 10 a 30% dos casos e a vida em 15 a 20%, sobretudo pelo coração de onde o êmbolo veio.',
    armadilhas: [
      'Esperar o sexto P. Paralisia é sinal de que o tempo acabou, não de que chegou a hora de agir.',
      'Confundir com trombose venosa profunda: a TVP dá membro inchado, quente e cianótico, com pulsos presentes (embora difíceis de palpar pelo edema).',
      'Marmoreado que branqueia à pressão ainda é viável; o que não branqueia é fixo — irreversível.',
      'Membro com claudicação crônica tem colaterais e tolera a oclusão aguda melhor; o quadro é menos dramático e o diagnóstico atrasa.',
    ],
    causas: [
      { titulo: 'Embolia (membro previamente normal)', mecanismo: 'Êmbolo que para na bifurcação.', itens: ['Fibrilação atrial', 'Trombo mural pós-infarto', 'Endocardite', 'Aneurisma de aorta ou poplíteo com trombo', 'Embolia paradoxal (forame oval)'] },
      { titulo: 'Trombose (membro com doença prévia)', mecanismo: 'Placa que rompe ou enxerto que ocluiu.', itens: ['Aterosclerose com trombose in situ', 'Oclusão de enxerto ou stent', 'Estados de hipercoagulabilidade', 'Aneurisma poplíteo trombosado'] },
      { titulo: 'Outras', mecanismo: 'Lesão direta ou compressão.', itens: ['Trauma arterial, dissecção', 'Iatrogenia (cateterismo)', 'Síndrome compartimental', 'Phlegmasia cerulea dolens (venosa maciça)'] },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'isquemia', valor: 4 }, alt: 'Perna pálida e marmoreada com relógio marcando as horas desde o início da dor' },
    patologias: ['isquemia-aguda-de-membro', 'fibrilacao-atrial'],
    referencias: ['Björck M et al. ESVS 2020 Clinical Practice Guidelines on the Management of Acute Limb Ischaemia. Eur J Vasc Endovasc Surg, 2020.', 'Creager MA, Kaufman JA, Conte MS. Acute limb ischemia. N Engl J Med, 2012.'],
  },
  {
    slug: 'celulite-extensa',
    nome: 'Celulite extensa',
    sinonimos: ['Celulite infecciosa', 'Erisipela (variante superficial)', 'Infecção de pele e partes moles não purulenta'],
    sistema: 'pele',
    resumo: 'Vermelho, quente, inchado e doloroso, avançando pela pele com uma borda que se move em horas — a infecção da derme profunda, e a área que decide se o antibiótico é em casa ou na veia.',
    definicao:
      'Infecção bacteriana aguda da derme profunda e do subcutâneo, com eritema mal delimitado, calor, edema e dor, em geral unilateral, que se expande ao longo de horas ou dias, frequentemente com porta de entrada (fissura interdigital, úlcera, picada, ferida). Erisipela é a forma superficial, com borda elevada e nítida. Extensa: quando a área ultrapassa o equivalente a uma mão espalmada do paciente (~1% da superfície corporal, ~400 a 500 cm²) ou cruza uma articulação, ou vem com sinais sistêmicos.',
    comoProcurar: [
      { passo: 'Marque a borda do eritema com caneta e anote a hora.', detalhe: 'É o instrumento mais barato da medicina: em 12 horas se sabe se está avançando ou recuando. Fotografe também.' },
      { passo: 'Meça a área (comprimento × largura em cm) e sinta calor e induração.', detalhe: 'Área e velocidade de expansão são os critérios de gravidade que se objetivam.' },
      { passo: 'Procure a porta de entrada: dedos dos pés, úlcera, ferida, lesão de tinha, picada.', detalhe: 'Tratar a porta (o intertrigo interdigital, sobretudo) evita a recidiva, que sem isso passa de 30%.' },
      { passo: 'Procure o que não deveria estar lá: bolhas, crepitação, anestesia, dor desproporcional, pele violácea, hipotensão.', detalhe: 'Qualquer um deles muda o diagnóstico para fasciíte necrosante ou celulite complicada — cirurgião agora.' },
    ],
    mecanismo:
      'Estreptococos beta-hemolíticos (a maioria) ou Staphylococcus aureus entram por uma brecha na barreira cutânea e se espalham pela derme profunda, ajudados por enzimas (hialuronidase, estreptoquinase) que dissolvem a matriz. A resposta inflamatória — vasodilatação, aumento da permeabilidade, infiltrado de neutrófilos — produz o vermelho, o calor, o edema e a dor. A expansão pela derme, onde não há barreiras anatômicas, explica a borda mal definida e o avanço em horas. Edema crônico (linfedema, insuficiência venosa) e obesidade favorecem porque a linfa parada é meio de cultura e a drenagem que deveria levar as bactérias aos linfonodos está prejudicada.',
    significado:
      'Celulite é diagnóstico clínico e tratamento empírico: antibiótico oral contra estreptococo (e estafilococo quando há pus) para a maioria. A extensão é um dos critérios que mudam para internação e via venosa, junto com febre alta, taquicardia, imunossupressão, diabetes descompensado, comorbidades e falha do tratamento oral em 48 horas. O que a ficha realmente ensina é a exclusão: celulite bilateral quase nunca é celulite; celulite com dor desproporcional ou que avança apesar do antibiótico é fasciíte; celulite ao redor de uma articulação inchada é artrite séptica.',
    armadilhas: [
      'Celulite bilateral é dermatite de estase, eczema ou lipodermatoesclerose em 90% dos casos. A celulite é quase sempre unilateral.',
      'Trombose venosa profunda dá perna vermelha, quente e inchada sem febre nem borda de avanço — e a coexistência é rara. Ultrassom se houver dúvida.',
      'Dor muito maior que o aspecto, anestesia da pele, bolhas ou avanço em horas: não é celulite. É fasciíte até o cirurgião dizer o contrário.',
      'Piora do eritema nas primeiras 24 a 48 horas de antibiótico pode ser resposta inflamatória à lise bacteriana; a marca de caneta e o estado geral decidem se é falha.',
    ],
    causas: [
      { titulo: 'Bactérias habituais', mecanismo: 'Entrada por brecha na barreira cutânea.', itens: ['Estreptococos beta-hemolíticos (grupos A, B, C, G)', 'Staphylococcus aureus (incluindo MRSA, quando há pus)'] },
      { titulo: 'Contextos especiais', mecanismo: 'Exposição ou hospedeiro diferentes.', itens: ['Mordedura (Pasteurella, Capnocytophaga, anaeróbios)', 'Água doce (Aeromonas) e salgada (Vibrio vulnificus)', 'Imunossupressão e neutropenia (gram-negativos, fungos)', 'Linfedema e safenectomia (recidivante)'] },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'celulite', valor: 500 }, alt: 'Perna com área eritematosa, quente e edemaciada de borda irregular marcada com caneta' },
    patologias: ['celulite', 'erisipela'],
    referencias: ['Stevens DL et al. Practice guidelines for the diagnosis and management of skin and soft tissue infections: 2014 update by the IDSA. Clin Infect Dis, 2014.', 'Raff AB, Kroshinsky D. Cellulitis: a review. JAMA, 2016.'],
  },
  {
    slug: 'fasciite-necrosante',
    nome: 'Lesão sugestiva de fasciíte necrosante',
    sinonimos: ['Infecção necrosante de partes moles', 'Gangrena de Fournier (períneo)', 'Fasciíte'],
    sistema: 'pele',
    resumo: 'Dor que não combina com o que se vê, pele que fica lisa, tensa, depois violácea e com bolhas, e um paciente que piora por hora — a infecção está na fáscia, por baixo, e só o bisturi chega lá.',
    definicao:
      'Infecção rapidamente progressiva da fáscia e do subcutâneo profundo, com necrose. Os sinais precoces são desproporcionais: dor intensa em área de pele pouco alterada, edema tenso que ultrapassa o eritema, toxicidade sistêmica. Os tardios: pele violácea ou cinza, bolhas hemorrágicas, anestesia cutânea (nervos necrosados), crepitação (gás), secreção "água de lavar louça" e necrose franca. Progride em horas. Tipo I polimicrobiana (diabéticos, períneo, pós-operatório); tipo II estreptocócica (jovens saudáveis, após trauma menor).',
    comoProcurar: [
      { passo: 'Compare a dor relatada com o que a pele mostra.', detalhe: 'Dor 9/10 em pele levemente vermelha é o sinal mais precoce e mais ignorado. Palpe além do eritema: a induração e a dor vão mais longe que o vermelho.' },
      { passo: 'Procure bolhas, cor violácea ou cinza, e teste a sensibilidade sobre a área.', detalhe: 'Anestesia numa pele que deveria doer é necrose dos nervos cutâneos. Bolhas hemorrágicas são necrose da derme.' },
      { passo: 'Palpe à procura de crepitação e olhe a evolução em horas, não em dias.', detalhe: 'Marque a borda. Avanço visível em 1 a 2 horas, ou piora apesar do antibiótico, é cirúrgico.' },
      { passo: 'Avalie o estado geral: frequência cardíaca, pressão, confusão, lactato.', detalhe: 'Taquicardia e hipotensão desproporcionais à celulite aparente são o choque tóxico que acompanha. O LRINEC (leucócitos, hemoglobina, sódio, glicose, creatinina, PCR) ajuda, mas não substitui a exploração cirúrgica.' },
    ],
    mecanismo:
      'As bactérias — estreptococo do grupo A sozinho, ou uma mistura de aeróbios e anaeróbios — entram por uma brecha e, em vez de ficar na derme, alcançam a fáscia superficial, um plano sem barreiras que corre por todo o membro. Ali se espalham em horas, e as toxinas e enzimas que produzem trombosam os vasos perfurantes que atravessam a fáscia para nutrir a pele. A pele, isquêmica por baixo, parece quase normal por fora enquanto a fáscia já está necrótica: por isso a dor (nervos isquêmicos) é maior que o aspecto, e por isso a anestesia vem depois, quando os nervos morrem. As bolhas e a cor violácea são a pele finalmente infartando. As toxinas estreptocócicas (superantígenos) disparam o choque tóxico. Antibiótico não chega a tecido sem vasos — só o desbridamento remove a fonte.',
    significado:
      'Mortalidade de 20 a 30%, que dobra a cada 12 horas de atraso no desbridamento. É o diagnóstico que não pode esperar imagem: quando a suspeita clínica é forte, a exploração cirúrgica é o exame — se a fáscia estiver íntegra, foi uma incisão; se não, foi a vida. Reconhecer os sinais precoces (dor desproporcional, edema além do eritema, toxicidade) em quem parece ter "só celulite" é a única forma de operar a tempo. Antibiótico de amplo espectro com clindamicina (inibe a produção de toxina) e suporte de choque acompanham, não substituem.',
    armadilhas: [
      'Esperar a necrose para diagnosticar. A necrose visível é sinal tardio; o precoce é a dor que não combina.',
      'Esperar a tomografia ou a ressonância em paciente instável. A imagem mostra gás e edema de fáscia quando há, mas a ausência não exclui e o tempo perdido mata.',
      'Confiar no LRINEC baixo. Sensibilidade insuficiente para excluir; é apoio, não filtro.',
      'Em diabético, imunossuprimido e usuário de drogas injetáveis, a dor pode estar embotada e a apresentação ser só "sepse sem foco". Examine a pele inteira, inclusive períneo.',
    ],
    causas: [
      { titulo: 'Tipo II — monomicrobiana', mecanismo: 'Estreptococo do grupo A (ou S. aureus) após trauma menor, em pessoa saudável.', itens: ['Streptococcus pyogenes', 'Staphylococcus aureus (incluindo MRSA)', 'Clostridium (gangrena gasosa, trauma contaminado)', 'Vibrio vulnificus (água salgada, hepatopata)'] },
      { titulo: 'Tipo I — polimicrobiana', mecanismo: 'Aeróbios e anaeróbios em hospedeiro comprometido.', itens: ['Diabéticos, obesos, alcoolistas', 'Gangrena de Fournier (períneo e genitais)', 'Pós-operatório abdominal', 'Úlcera de pressão ou de pé diabético infectada'] },
    ],
    desempenho: [
      { alvo: 'Fasciíte necrosante confirmada na cirurgia', sensibilidade: 'bolhas ~26% · crepitação ~19% · hipotensão ~21% · dor desproporcional ~40–70% (séries variadas)', leitura: 'Os sinais "clássicos" são insensíveis: quando estão presentes, o diagnóstico é tardio. A suspeita precisa vir da dor e do estado geral.', fonte: 'Goh T et al. Early diagnosis of necrotizing fasciitis. Br J Surg, 2014.' },
    ],
    ilustracao: { id: 'membro-inferior', params: { achado: 'fasciite', valor: 200 }, alt: 'Perna com edema tenso, área violácea, bolhas e zona de necrose' },
    patologias: ['fasciite-necrosante', 'choque-septico'],
    referencias: ['Stevens DL, Bryant AE. Necrotizing soft-tissue infections. N Engl J Med, 2017.', 'Goh T et al. Early diagnosis of necrotizing fasciitis. Br J Surg, 2014.'],
  },
  {
    slug: 'eritema-multiforme',
    nome: 'Lesões em alvo (eritema multiforme)',
    sinonimos: ['Lesão em íris', 'Eritema multiforme minor e major', 'Lesão-alvo típica'],
    sistema: 'pele',
    resumo: 'Círculos concêntricos de três zonas — centro escuro, anel pálido, halo vermelho — simétricos nas mãos e nos braços, dias depois de um herpes labial. A pele reagindo a um antígeno, e a boca decidindo se é grave.',
    definicao:
      'Erupção aguda, autolimitada, de pápulas e placas eritematosas que evoluem para lesões em alvo típicas: redondas, < 3 cm, com três zonas concêntricas (centro escuro, violáceo ou com bolha; anel intermediário pálido e edematoso; halo periférico eritematoso), de distribuição simétrica e acral (dorso das mãos, antebraços, cotovelos, joelhos, face). Minor: sem ou com mínimo acometimento de mucosa. Major: erosões em uma ou mais mucosas (oral, ocular, genital), sem descolamento epidérmico extenso. Não é o espectro de Stevens-Johnson/NET, que tem lesões atípicas planas, purpúricas, no tronco, com descolamento e é causado por fármacos.',
    comoProcurar: [
      { passo: 'Conte as zonas: uma lesão em alvo verdadeira tem três.', detalhe: 'Duas zonas (centro escuro e halo) é alvo atípico — mais comum em Stevens-Johnson. O anel pálido intermediário é a assinatura do eritema multiforme.' },
      { passo: 'Mapeie a distribuição.', detalhe: 'Acral e simétrica (mãos, braços, joelhos, face): eritema multiforme. Tronco e face com lesões planas confluentes: pense em SJS/NET.' },
      { passo: 'Examine todas as mucosas: boca, olhos, genitais.', detalhe: 'Erosões orais dolorosas definem a forma major. Olho vermelho com secreção pede oftalmologista.' },
      { passo: 'Pergunte sobre herpes labial nas últimas 2 semanas, infecção respiratória (Mycoplasma) e medicamentos novos.', detalhe: 'Herpes explica a maioria dos casos recorrentes; Mycoplasma, os casos em criança com mucosite intensa; fármaco novo desloca a suspeita para SJS.' },
    ],
    mecanismo:
      'É uma reação de hipersensibilidade celular a um antígeno depositado na pele — na maior parte dos casos, DNA do herpes simples transportado por células do sangue e expresso nos queratinócitos. Linfócitos T citotóxicos específicos reconhecem o antígeno e destroem os queratinócitos ao redor: o centro necrótico ou bolhoso da lesão. A onda inflamatória se propaga centrifugamente, com edema dérmico (o anel pálido) e vasodilatação na periferia (o halo vermelho) — os três anéis são três fases da mesma reação vistas ao mesmo tempo. A distribuição acral reflete onde o antígeno se deposita e onde a pele é mais fria e exposta a trauma.',
    significado:
      'O eritema multiforme minor é benigno e se resolve em 2 a 4 semanas sem sequelas; o tratamento é sintomático e, se recorrente por herpes, aciclovir profilático. O que importa é o que ele não é: reconhecer a lesão em alvo típica e a distribuição acral evita o pânico de rotular como Stevens-Johnson, e reconhecer as lesões atípicas no tronco, o fármaco novo e o descolamento evita o erro contrário, que mata. A forma major com mucosite grave, sobretudo por Mycoplasma em criança, pode exigir internação para hidratação e analgesia.',
    armadilhas: [
      'Chamar toda lesão anelar de alvo. Urticária anular, eritema anular centrífugo e tinha têm um ou dois anéis e outra evolução; urticária some em 24 horas.',
      'Confundir com Stevens-Johnson: lesões planas, purpúricas, atípicas, predominando no tronco, com descolamento e fármaco recente, é SJS — outra doença, outra gravidade.',
      'Eritema multiforme major recorrente sem herpes evidente: procure herpes genital assintomático e Mycoplasma.',
      'Não é doença de fármaco na maioria dos casos; suspender medicamentos essenciais por um eritema multiforme pós-herpético é erro comum.',
    ],
    causas: [
      { titulo: 'Infecções (~90%)', mecanismo: 'Antígeno depositado nos queratinócitos.', itens: ['Herpes simples tipo 1 e 2 (a maioria, inclusive as recorrências)', 'Mycoplasma pneumoniae (crianças, mucosite intensa)', 'Outros vírus (parapoxvírus, EBV, hepatites), fungos (histoplasmose)'] },
      { titulo: 'Fármacos (< 10%)', mecanismo: 'Hapteno ligado a proteínas epidérmicas.', itens: ['Sulfonamidas', 'Anticonvulsivantes', 'Antiinflamatórios', 'Penicilinas'] },
    ],
    ilustracao: { id: 'pele', params: { lesao: 'alvo', valor: 15 }, alt: 'Pele com lesões redondas de três anéis concêntricos: centro escuro, anel pálido, halo vermelho' },
    patologias: ['eritema-multiforme', 'herpes-simples'],
    referencias: ['Sokumbi O, Wetter DA. Clinical features, diagnosis, and treatment of erythema multiforme: a review for the practicing dermatologist. Int J Dermatol, 2012.', 'Bastuji-Garin S et al. Clinical classification of cases of toxic epidermal necrolysis, Stevens-Johnson syndrome, and erythema multiforme. Arch Dermatol, 1993.'],
  },
  {
    slug: 'purpura',
    nome: 'Púrpura',
    sinonimos: ['Petéquias', 'Equimoses', 'Púrpura palpável', 'Púrpura não palpável'],
    sistema: 'pele',
    resumo: 'Manchas vermelho-arroxeadas que não somem quando se aperta a pele — sangue fora do vaso. O tamanho e o relevo dizem se a causa é plaqueta, vaso ou coagulação.',
    definicao:
      'Extravasamento de sangue para a pele ou mucosa, visível como mácula ou pápula vermelha, violácea ou acastanhada que não desaparece à vitropressão (ao contrário do eritema e das telangiectasias). Classificada pelo tamanho — petéquia (< 3 mm), púrpura (3 mm a 1 cm), equimose (> 1 cm) — e pelo relevo — não palpável (plana: plaquetas, coagulação, fragilidade) ou palpável (elevada: vasculite, inflamação da parede do vaso). Púrpura retiforme (em rede, com bordas angulares) indica oclusão vascular.',
    comoProcurar: [
      { passo: 'Pressione a lesão com uma lâmina de vidro ou com o dedo e veja se some.', detalhe: 'Eritema e telangiectasias branqueiam: o sangue ainda está dentro do vaso. Púrpura não branqueia. É o teste que define.' },
      { passo: 'Meça e classifique: petéquias, púrpura ou equimoses; e feche os olhos e passe o dedo — é palpável?', detalhe: 'Petéquias planas: plaquetas. Púrpura palpável: vasculite. Equimoses grandes em locais de trauma: coagulação ou fragilidade.' },
      { passo: 'Mapeie a distribuição.', detalhe: 'Pernas e nádegas (áreas dependentes): vasculite de pequenos vasos e trombocitopenia. Face e pescoço após vômito ou tosse: pressão. Antebraços do idoso: púrpura senil. Retiforme: oclusão.' },
      { passo: 'Procure sangramento de mucosa, febre, dor articular e abdominal, e conte plaquetas.', detalhe: 'Petéquias com gengivorragia e plaquetas < 20 mil é urgência hematológica. Petéquias com febre e hipotensão é meningococcemia — antibiótico antes de qualquer outro exame.' },
    ],
    mecanismo:
      'O sangue sai do vaso por três razões. Falta de plaquetas ou plaquetas que não funcionam: os microvasos sofrem microtraumas contínuos e, sem plaqueta para tampar, cada um vira uma petéquia — pequena, plana, nas áreas onde a pressão hidrostática é maior (pernas). Parede do vaso inflamada (vasculite): imunocomplexos depositados nas vênulas pós-capilares atraem neutrófilos que destroem a parede, o sangue extravasa e o infiltrado inflamatório eleva a lesão — a púrpura palpável. Parede frágil ou coagulação deficiente: os vasos rompem com trauma mínimo e o sangramento não para, formando equimoses grandes. A oclusão de vasos maiores da derme (trombose, êmbolo, crioglobulina) infarta a área irrigada, e o padrão segue a rede vascular — retiforme.',
    significado:
      'Púrpura é sinal que pede plaquetas e coagulograma no mesmo dia, e em três situações não pode esperar: petéquias com febre (meningococcemia, sepse com coagulação intravascular), petéquias difusas com plaquetas muito baixas e sangramento de mucosa (púrpura trombocitopênica imune, leucemia, PTT quando há anemia e neurologia), e púrpura retiforme com necrose (púrpura fulminante, calcifilaxia, coagulação intravascular). Púrpura palpável em pernas de adulto após infecção ou fármaco é vasculite de pequenos vasos — em criança com dor abdominal e artralgia, IgA (Henoch-Schönlein). Púrpura senil e por corticoide não precisa de investigação além do reconhecimento.',
    armadilhas: [
      'Não fazer a vitropressão e chamar eritema ou telangiectasia de púrpura — ou o inverso.',
      'Púrpura senil (antebraços de idoso, plana, sem outras lesões) é fragilidade capilar e não pede investigação hematológica.',
      'Em pele escura a púrpura é mais difícil de ver; examine conjuntivas, palato e leitos ungueais, onde as petéquias se destacam.',
      'Petéquias só acima do pescoço após vômito, tosse ou parto são mecânicas, não hematológicas — se as plaquetas estão normais.',
    ],
    causas: [
      { titulo: 'Não palpável — plaquetas', mecanismo: 'Poucas plaquetas ou plaquetas disfuncionais.', itens: ['Púrpura trombocitopênica imune', 'Leucemias, aplasia, quimioterapia', 'Coagulação intravascular disseminada', 'PTT e síndrome hemolítico-uremica', 'Dengue', 'Antiagregantes, uremia, doença de von Willebrand'] },
      { titulo: 'Não palpável — vaso frágil ou coagulação', mecanismo: 'Parede que rompe ao trauma ou coágulo que não se forma.', itens: ['Púrpura senil e por corticoide', 'Escorbuto', 'Amiloidose', 'Anticoagulantes, hemofilia, hepatopatia'] },
      { titulo: 'Palpável — vasculite', mecanismo: 'Inflamação da parede das vênulas.', itens: ['Vasculite por IgA (Henoch-Schönlein)', 'Vasculite de hipersensibilidade (fármaco, infecção)', 'Vasculites ANCA', 'Crioglobulinemia (hepatite C)', 'Endocardite'] },
      { titulo: 'Retiforme — oclusão', mecanismo: 'Vaso obstruído; infarto da área irrigada.', itens: ['Púrpura fulminante meningocócica', 'Calcifilaxia', 'Síndrome antifosfolípide', 'Necrose por varfarina', 'Embolia de colesterol', 'Crioglobulinemia tipo I'] },
    ],
    ilustracao: { id: 'pele', params: { lesao: 'purpura', valor: 2 }, alt: 'Pele com múltiplas manchas vermelho-arroxeadas puntiformes que não desaparecem à pressão' },
    patologias: ['purpura-trombocitopenica-imune', 'meningite-bacteriana', 'vasculite-por-iga'],
    referencias: ['Piette WW. Purpura: mechanisms and differential diagnosis. In: Bolognia JL et al. Dermatology, 4ª ed.', 'Wetter DA, Dutz JP, Shinkai K, Fox LP. Cutaneous vasculitis. In: Bolognia JL et al. Dermatology, 4ª ed.'],
  },
  {
    slug: 'urticaria',
    nome: 'Urticária',
    sinonimos: ['Urticas', 'Vergões', 'Placas urticariformes'],
    sistema: 'pele',
    resumo: 'Placas elevadas, rosadas, que coçam muito e desaparecem em horas sem deixar marca, enquanto outras nascem em outro lugar — histamina na derme superficial, e a pergunta é se há angioedema ou anafilaxia junto.',
    definicao:
      'Erupção de urticas (pápulas ou placas edematosas, eritematosas ou pálidas no centro com halo vermelho, de tamanho e forma variáveis), intensamente pruriginosas, cada uma durando menos de 24 horas e desaparecendo sem deixar marca, com lesões novas surgindo em outros locais. Aguda: < 6 semanas. Crônica: > 6 semanas, com lesões quase diárias. Angioedema (edema profundo de face, lábios, língua, genitais) acompanha em ~40%. Não é urticária: lesão fixa por mais de 24 horas, lesão que deixa púrpura ou pigmentação, lesão que dói em vez de coçar.',
    comoProcurar: [
      { passo: 'Circule uma ou duas lesões com caneta e reveja em algumas horas.', detalhe: 'Urtica verdadeira some e outra nasce fora do círculo. Lesão que permanece 24 horas dentro do círculo é vasculite urticariforme ou outra coisa — biópsia.' },
      { passo: 'Pressione: branqueia? Deixa marca ao sumir?', detalhe: 'Urticária branqueia e não deixa marca. Púrpura residual é vasculite.' },
      { passo: 'Examine lábios, língua, pálpebras e pergunte sobre rouquidão, dificuldade de engolir, chiado, tontura.', detalhe: 'Angioedema de via aérea ou qualquer sintoma sistêmico transforma urticária em anafilaxia: adrenalina intramuscular agora.' },
      { passo: 'Pergunte por gatilhos das últimas horas (alimento, fármaco, picada, infecção viral) e por gatilhos físicos (frio, pressão, calor, exercício).', detalhe: 'Na aguda, a causa costuma estar nas 2 horas anteriores; na crônica, raramente se encontra uma e a busca exaustiva não ajuda.' },
    ],
    mecanismo:
      'Mastócitos da derme superficial liberam histamina e outros mediadores — por IgE ligada a alérgeno, por ativação direta (opioides, contraste, frio, pressão), por complemento ou, na crônica espontânea, por autoanticorpos contra o receptor de IgE. A histamina dilata os vasos (eritema), aumenta a permeabilidade (edema localizado: a urtica) e estimula terminações nervosas C (prurido). O reflexo axonal espalha a vasodilatação ao redor (o halo). Como a histamina é degradada em minutos e o edema drena, cada lesão dura horas e desaparece sem deixar traço — a fugacidade é o mecanismo tornado visível. Quando os mastócitos ativados estão na derme profunda e no subcutâneo, o edema é angioedema; quando a ativação é sistêmica, é anafilaxia.',
    significado:
      'Urticária isolada é benigna e incômoda: anti-histamínico não sedante, em dose até quatro vezes a habitual na crônica, e evitar o gatilho quando há um. O que importa é a triagem de gravidade: urticária com angioedema de via aérea, dispneia, hipotensão ou sintomas gastrointestinais é anafilaxia, e o anti-histamínico não trata anafilaxia — adrenalina trata. E a triagem de identidade: lesão que dura mais de 24 horas ou deixa púrpura é vasculite urticariforme (lúpus, hepatite, fármaco), que pede investigação e biópsia; urticária com febre e artralgia pode ser doença de Still ou síndrome autoinflamatória.',
    armadilhas: [
      'Dar anti-histamínico a quem tem urticária e rouquidão ou chiado. É anafilaxia; adrenalina primeiro.',
      'Pedir bateria de alergia na urticária crônica. A maioria é espontânea (autoimune), e a investigação extensa não muda a conduta.',
      'Lesão urticariforme fixa e dolorosa que dura dias é vasculite; a caneta em volta da lesão resolve a dúvida em 24 horas.',
      'Eritema multiforme, picadas de inseto e dermatite de contato são confundidos com urticária; nenhum deles some em horas.',
    ],
    causas: [
      { titulo: 'Aguda', mecanismo: 'Ativação de mastócitos por IgE ou direta.', itens: ['Infecções virais (a causa mais comum em crianças)', 'Alimentos (leite, ovo, amendoim, frutos do mar)', 'Fármacos (antibióticos, AINEs, opioides, contraste)', 'Picadas de inseto', 'Látex'] },
      { titulo: 'Crônica', mecanismo: 'Autoimune ou estímulo físico repetido.', itens: ['Urticária crônica espontânea (autoanticorpos anti-FcεRI)', 'Urticárias induzíveis: dermografismo, frio, pressão, colinérgica, solar', 'Doença tireoidiana autoimune associada'] },
      { titulo: 'Simuladores com lesão fixa', mecanismo: 'Não é urticária embora pareça.', itens: ['Vasculite urticariforme', 'Síndromes autoinflamatórias (Schnitzler, CAPS)', 'Doença de Still', 'Reação a fármaco fixa'] },
    ],
    ilustracao: { id: 'pele', params: { lesao: 'urticaria', valor: 30 }, alt: 'Pele com placas edematosas irregulares, pálidas no centro e com halo vermelho' },
    patologias: ['urticaria', 'anafilaxia'],
    referencias: ['Zuberbier T et al. The international EAACI/GA²LEN/EuroGuiDerm/APAAACI guideline for the definition, classification, diagnosis, and management of urticaria. Allergy, 2022.', 'Kaplan AP. Urticaria and angioedema. In: Middleton’s Allergy, 9ª ed.'],
  },
  {
    slug: 'angioedema-de-lingua',
    nome: 'Angioedema de língua',
    sinonimos: ['Edema de língua', 'Macroglossia aguda', 'Angioedema orofaríngeo'],
    sistema: 'pele',
    resumo: 'A língua cresce em minutos a horas, não cabe na boca, a voz fica abafada — e o que decide o tratamento é se coça (histamina) ou não (bradicinina).',
    definicao:
      'Edema agudo, não inflamatório, da submucosa e dos tecidos profundos da língua, assimétrico ou difuso, sem eritema nem prurido locais, que se instala em minutos a horas e dura 24 a 72 horas. Pode estender-se ao assoalho da boca, lábios, úvula e laringe. Graduação clínica pela via aérea: língua aumentada mas contida (fala normal); língua que protrui e altera a voz ("voz de batata quente", disfagia); estridor, sialorreia, incapacidade de deitar — via aérea crítica.',
    comoProcurar: [
      { passo: 'Olhe a língua em repouso e peça para protruir; note se cabe na boca e se há marcas dos dentes.', detalhe: 'Língua que não protrui além dos lábios ou que os dentes marcam é edema significativo.' },
      { passo: 'Ouça a voz e peça para engolir saliva.', detalhe: 'Voz abafada, dificuldade de engolir e saliva escorrendo são sinais de que o assoalho e a faringe estão envolvidos. Estridor é via aérea em fechamento.' },
      { passo: 'Procure urticária e prurido, e pergunte por alérgeno recente.', detalhe: 'Com urticas e coceira: histaminérgico, responde a adrenalina e anti-histamínico. Sem urticas, sem prurido: bradicinínico — IECA, hereditário — não responde.' },
      { passo: 'Pergunte pela lista de medicamentos (IECA, sacubitril, gliptinas), episódios prévios e história familiar.', detalhe: 'Angioedema de língua em paciente com IECA, mesmo depois de anos de uso, é o IECA. História familiar de edemas recorrentes é angioedema hereditário.' },
    ],
    mecanismo:
      'Duas vias produzem o mesmo edema. Na histaminérgica, mastócitos da submucosa liberam histamina — por alergia ou ativação direta —, os vasos dilatam e vazam plasma para o tecido profundo; acompanha urticária e prurido e responde a adrenalina, anti-histamínico e corticoide. Na bradicinínica, a bradicinina acumula porque a enzima que a degrada está inibida (IECA, e o sacubitril) ou porque falta o inibidor de C1 que freia sua produção (angioedema hereditário ou adquirido); a bradicinina aumenta a permeabilidade vascular sem envolver mastócitos — não há prurido, não há urticária, e adrenalina, anti-histamínico e corticoide não funcionam. A língua é vulnerável porque tem submucosa frouxa e rica em vasos, e porque edema ali ocupa a via aérea.',
    significado:
      'Angioedema de língua é emergência de via aérea: a progressão pode levar à obstrução em minutos, e a intubação de uma língua edemaciada é difícil — o plano precisa incluir via aérea cirúrgica. Distinguir a via decide o tratamento: histaminérgico recebe adrenalina intramuscular, anti-histamínico e corticoide; bradicinínico por IECA recebe suspensão definitiva do fármaco e, se grave, icatibanto ou concentrado de inibidor de C1 (quando disponíveis) ou plasma; hereditário recebe concentrado de C1 ou icatibanto e profilaxia. Em todos, observação até a resolução e nunca alta com edema em progressão.',
    armadilhas: [
      'Dar adrenalina e anti-histamínico a angioedema por IECA e esperar melhora. Não vai melhorar; garanta a via aérea e trate a bradicinina.',
      'Descartar o IECA porque "usa há dez anos". O angioedema por IECA pode surgir a qualquer momento do uso, e recorre se o fármaco continuar.',
      'Confundir com abscesso de assoalho (angina de Ludwig): esse tem febre, dor, trismo, endurecimento do assoalho e origem dentária.',
      'Dar alta cedo. O pico do edema bradicinínico pode levar 24 horas, e a recorrência bifásica da anafilaxia existe.',
    ],
    causas: [
      { titulo: 'Histaminérgico (com urticária e prurido)', mecanismo: 'Mastócitos.', itens: ['Anafilaxia e alergia alimentar ou a fármaco', 'Urticária crônica com angioedema', 'AINEs (mecanismo não IgE)', 'Idiopático histaminérgico'] },
      { titulo: 'Bradicinínico (sem urticária, sem prurido)', mecanismo: 'Excesso de bradicinina.', itens: ['Inibidores da ECA (0,1–0,7% dos usuários; mais em negros e fumantes)', 'Sacubitril/valsartana, inibidores de DPP-4', 'Angioedema hereditário (deficiência de inibidor de C1)', 'Angioedema adquirido (linfoproliferativo, autoimune)', 'Ativador de plasminogênio (após trombólise)'] },
    ],
    ilustracao: { id: 'face', params: { achado: 'angioedema-lingua', valor: 40 }, alt: 'Boca aberta com a língua edemaciada, aumentada e protruindo além dos dentes' },
    patologias: ['anafilaxia', 'angioedema-hereditario'],
    referencias: ['Bernstein JA et al. Angioedema in the emergency department: a practical guide to differential diagnosis and management. Int J Emerg Med, 2017.', 'Zuraw BL. Hereditary angioedema. N Engl J Med, 2008.'],
  },
]

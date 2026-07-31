import type { DeepDiveMap } from './types'

/** Arritmias ventriculares — da extrassístole isolada à parada cardíaca. */
export const DEEP_DIVE_VENTRICULARES: DeepDiveMap = {
  'pvc-unifocal': {
    emUmaFrase:
      'Todas as extrassístoles do traçado têm exatamente a mesma forma: um único foco ventricular, disparando repetidamente pelo mesmo caminho.',
    secoes: [
      {
        titulo: 'O que significa “unifocal”',
        texto:
          'Monomorfismo indica origem única. Se cada extrassístole tem a mesma morfologia e o mesmo intervalo de acoplamento com o batimento sinusal precedente, o impulso está nascendo sempre no mesmo ponto e percorrendo sempre o mesmo trajeto pelo miocárdio. Isso, por si, é um dado tranquilizador: extrassístoles monomórficas em coração estruturalmente normal são a forma mais benigna de ectopia ventricular. O contraste é com as multifocais (polimórficas), em que morfologias diferentes revelam focos diferentes e sugerem um miocárdio doente, isquêmico ou eletrolíticamente instável.',
      },
      {
        titulo: 'Lendo a origem no traçado',
        texto:
          'A morfologia permite localizar o foco com boa aproximação. Padrão de bloqueio de ramo esquerdo (QRS negativo em V1) significa que o ventrículo direito despolarizou primeiro, portanto o foco está no VD; padrão de bloqueio de ramo direito (QRS positivo em V1) aponta origem no VE. O eixo no plano frontal completa a localização: eixo inferior, com R altas em DII, DIII e aVF, indica via de saída (a via de saída do ventrículo direito é a origem mais comum das extrassístoles idiopáticas, sobretudo em mulheres jovens, com boa resposta à ablação); eixo superior indica origem apical ou inferior. Um QRS de transição precoce em V1–V2 sugere origem no lado esquerdo, incluindo a cúspide aórtica.',
      },
      {
        titulo: 'Estratificação: quando parar de tranquilizar',
        texto:
          'A investigação deve ser aprofundada diante de: cardiopatia estrutural conhecida, síncope, história familiar de morte súbita precoce, extrassístoles que aumentam com o esforço (as benignas tipicamente desaparecem quando a frequência sinusal sobe), morfologias múltiplas, salvas, fenômeno R sobre T e carga elevada em 24 horas. O ponto de corte de 10% da carga total é o mais citado para risco de miocardiopatia induzida por extrassístoles, uma disfunção ventricular que regride quando a arritmia é suprimida — e que é frequentemente confundida com miocardiopatia dilatada primária. A avaliação inicial inclui ecocardiograma, Holter com quantificação, eletrólitos, função tireoidiana e teste de esforço; a ressonância magnética entra quando há suspeita de cicatriz, displasia arritmogênica ou miocardite.',
      },
      {
        titulo: 'Tratamento',
        texto:
          'Assintomático com coração normal: reassegurar, reduzir cafeína, álcool e nicotina, corrigir potássio e magnésio, tratar apneia do sono e ansiedade. Sintomático: betabloqueador em primeira linha, ou bloqueador de canal de cálcio não di-hidropiridínico. Carga alta com disfunção ventricular, ou sintomas refratários: ablação por cateter do foco, com resultados excelentes nas extrassístoles de via de saída. Antiarrítmicos de classe IC estão contraindicados na presença de doença coronariana ou cicatriz — a lição do estudo CAST, que mostrou aumento de mortalidade ao suprimir extrassístoles pós-infarto com flecainida e encainida, é uma das mais importantes da cardiologia moderna.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Sinusal de base com batimentos largos precoces, todos idênticos entre si.' },
      { onda: 'Onda P', achado: 'Ausente antes da extrassístole; a P sinusal pode aparecer dissociada dentro do QRS ectópico.' },
      { onda: 'QRS ectópico', achado: 'Largo (acima de 120 ms), bizarro, com morfologia constante em todo o traçado.' },
      { onda: 'Acoplamento', achado: 'Intervalo fixo entre o QRS sinusal e a extrassístole — reforça foco único.' },
      { onda: 'Onda T', achado: 'Discordante do QRS ectópico.' },
      { onda: 'Pausa', achado: 'Compensatória completa na maioria dos casos.' },
    ],
    roteiro: [
      'Localize as extrassístoles e compare suas formas: são todas iguais?',
      'Meça o intervalo de acoplamento: fixo confirma foco único.',
      'Olhe V1 para definir o ventrículo de origem.',
      'Olhe o eixo nas derivações inferiores para definir via de saída ou não.',
      'Quantifique a carga e procure cardiopatia estrutural.',
    ],
    separando: [
      { de: 'Extrassístoles multifocais', chave: 'Morfologias e acoplamentos diferentes indicam focos diferentes e maior gravidade.' },
      { de: 'Extrassístole atrial com aberrância', chave: 'Procure a P precoce escondida na T anterior e a pausa incompleta.' },
      { de: 'Batimento de fusão', chave: 'Morfologia intermediária entre o sinusal e o ectópico, com P na frente.' },
    ],
    fixacao: [
      'Monomórfica = um foco = geralmente benigna. Polimórfica = vários focos = investigue.',
      'V1 negativo → foco no VD; V1 positivo → foco no VE.',
      'Lição do CAST: suprimir extrassístole pós-infarto com classe IC aumenta mortalidade.',
    ],
  },

  'pvc-bigeminy': {
    emUmaFrase:
      'Cada batimento sinusal é seguido de uma extrassístole ventricular, formando pares que se repetem indefinidamente — o pulso fica lento e o traçado, inconfundível.',
    secoes: [
      {
        titulo: 'Por que o padrão se repete tão fielmente',
        texto:
          'O bigeminismo geralmente decorre de um foco ectópico com automatismo próprio e de um fenômeno de reentrada ou de bloqueio de saída que o mantém acoplado ao batimento sinusal — cada batimento normal “dispara” a próxima extrassístole depois de um intervalo constante. A regra do bigeminismo, descrita há décadas, observa que ciclos longos tendem a perpetuar a ectopia: a pausa compensatória alonga o ciclo, o alongamento favorece a próxima extrassístole, e o padrão se autoalimenta. Isso explica por que o bigeminismo é mais evidente em frequências cardíacas baixas e frequentemente desaparece quando o paciente se exercita e a frequência sinusal aumenta.',
      },
      {
        titulo: 'A repercussão hemodinâmica: o déficit de pulso',
        texto:
          'A extrassístole ocorre precocemente, quando o ventrículo ainda não teve tempo de encher. O volume ejetado é baixo e pode não abrir a valva aórtica de forma efetiva, de modo que aquele batimento não gera onda de pulso palpável. Na prática, um paciente com bigeminismo e frequência de 80 bpm no ECG pode ter apenas 40 pulsos palpáveis por minuto — e ser erroneamente classificado como bradicárdico. Esse é o clássico déficit de pulso, e o corolário prático é simples: em qualquer arritmia, ausculte ou registre o ECG; não confie no pulso radial isolado. Alguns pacientes descrevem a sensação de “falha no coração” — que corresponde não à extrassístole em si, mas ao batimento pós-pausa, mais vigoroso pelo enchimento aumentado.',
      },
      {
        titulo: 'Significado e conduta',
        texto:
          'Bigeminismo não é, por si só, sinal de gravidade. Ele apenas descreve um padrão de acoplamento. O que determina a conduta é o mesmo que nas extrassístoles isoladas: presença de cardiopatia estrutural, carga total em 24 horas, sintomas, comportamento ao esforço e morfologia. Bigeminismo persistente merece atenção especial na quantificação da carga: por definição, se mantido, corresponde a 50% dos batimentos serem ectópicos — muito acima do limiar de 10% associado à miocardiopatia induzida por extrassístoles. Nesses casos a ablação do foco costuma ser oferecida, e a função ventricular reavaliada após alguns meses, com frequência mostrando recuperação completa. Causas reversíveis a procurar: hipocalemia, hipomagnesemia, isquemia, intoxicação digitálica, hipertireoidismo, estimulantes e apneia do sono.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Alternância rigorosa entre um batimento sinusal e uma extrassístole ventricular.' },
      { onda: 'Onda P', achado: 'Presente antes de cada batimento sinusal; ausente antes de cada extrassístole.' },
      { onda: 'QRS', achado: 'Alternando estreito (sinusal) e largo/bizarro (ectópico), com morfologia ectópica constante.' },
      { onda: 'Acoplamento', achado: 'Intervalo fixo entre o QRS sinusal e a extrassístole que o segue.' },
      { onda: 'Pausa', achado: 'Compensatória completa após cada extrassístole, gerando o padrão em pares.' },
    ],
    roteiro: [
      'Reconheça a alternância 1:1 entre batimento normal e largo.',
      'Confirme que as extrassístoles são todas iguais e com acoplamento fixo.',
      'Compare a frequência do ECG com o pulso palpado (déficit de pulso).',
      'Estime a carga: bigeminismo sustentado significa 50% de batimentos ectópicos.',
      'Procure hipocalemia, hipomagnesemia, isquemia, digoxina e estimulantes.',
    ],
    separando: [
      { de: 'Trigeminismo', chave: 'Duas batidas sinusais para cada extrassístole em vez de uma.' },
      { de: 'Bigeminismo atrial', chave: 'A extrassístole é precedida de P prematura e tem QRS estreito.' },
      { de: 'Ritmo alternante por bloqueio', chave: 'No BAV 2:1 as ondas P bloqueadas são visíveis e não há QRS largo ectópico.' },
    ],
    fixacao: [
      'Bigeminismo sustentado = 50% de carga ectópica: quantifique sempre em Holter.',
      'Déficit de pulso é a regra, não a exceção — nunca conte frequência só pelo pulso.',
      'Padrão que some com o esforço costuma ser benigno.',
    ],
  },

  'vt-monomorphic': {
    emUmaFrase:
      'Três ou mais batimentos ventriculares consecutivos, todos com a mesma forma, acima de 100 bpm e durando mais de 30 segundos ou causando instabilidade: emergência com risco de morte.',
    secoes: [
      {
        titulo: 'O substrato: cicatriz e reentrada',
        texto:
          'A taquicardia ventricular monomórfica sustentada é, na maioria esmagadora dos casos, uma reentrada em torno de uma cicatriz miocárdica — tipicamente a de um infarto prévio. Dentro da zona de fibrose sobrevivem feixes de miócitos viáveis formando canais de condução lenta; um impulso que entre por esse canal pode sair do outro lado quando o tecido circundante já se recuperou, fechando o circuito e girando indefinidamente. Como o circuito é fixo e anatômico, cada giro produz exatamente a mesma sequência de ativação — daí o monomorfismo. Outros substratos: miocardiopatia dilatada, displasia arritmogênica do ventrículo direito, sarcoidose cardíaca, doença de Chagas (importante no Brasil, com aneurisma apical característico) e, em corações estruturalmente normais, TVs idiopáticas de via de saída e a TV fascicular sensível ao verapamil.',
      },
      {
        titulo: 'Reconhecendo no ECG: os achados que cravam o diagnóstico',
        texto:
          'A tríade que praticamente sela origem ventricular é: dissociação AV (ondas P marchando em frequência própria, mais lenta, independentes dos QRS), batimentos de captura (um QRS estreito isolado no meio da taquicardia, quando um impulso sinusal consegue atravessar) e batimentos de fusão (morfologia intermediária, quando impulso sinusal e ectópico ativam o ventrículo simultaneamente). Achados adicionais fortemente sugestivos: QRS acima de 160 ms, eixo no quadrante noroeste (entre −90° e ±180°), concordância precordial (todos os QRS positivos ou todos negativos de V1 a V6), ausência de complexos RS em todas as precordiais e intervalo do início do R ao nadir do S superior a 100 ms em qualquer precordial. Esses são os pilares dos algoritmos de Brugada e Vereckei.',
      },
      {
        titulo: 'Manejo agudo',
        texto:
          'A primeira pergunta é sempre sobre pulso e estabilidade. Sem pulso: protocolo de parada, desfibrilação imediata com choque não sincronizado, compressões de alta qualidade, adrenalina e amiodarona. Com pulso mas instável (hipotensão, alteração da consciência, dor isquêmica, congestão): cardioversão elétrica sincronizada com sedação. Com pulso e estável: antiarrítmico intravenoso — procainamida mostrou superioridade sobre amiodarona no estudo PROCAMIO em eficácia e eventos adversos; amiodarona e lidocaína são alternativas —, sempre com desfibrilador ao lado. Em paralelo, corrigir potássio e magnésio, tratar isquemia aguda e revisar drogas. Uma exceção importante: a TV fascicular idiopática responde a verapamil, mas essa é uma decisão para quem tem certeza do diagnóstico, jamais uma aposta na emergência.',
      },
      {
        titulo: 'Depois do episódio',
        texto:
          'A avaliação estrutural é obrigatória: ecocardiograma, pesquisa de isquemia, e ressonância magnética para caracterizar cicatriz e substrato. A grande decisão de longo prazo é o cardiodesfibrilador implantável. Ele está indicado em prevenção secundária para sobreviventes de TV sustentada com instabilidade ou de fibrilação ventricular sem causa reversível, e em prevenção primária para pacientes com fração de ejeção reduzida em terapia médica otimizada, conforme os critérios das diretrizes. A ablação por cateter do circuito reduz recorrências e choques, e a terapia antiarrítmica de manutenção (amiodarona, sotalol) complementa. Reverter a causa quando existir — isquemia, distúrbio eletrolítico, droga — pode mudar completamente a indicação de dispositivo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular ou levemente irregular, com frequência entre 100 e 250 bpm.' },
      { onda: 'QRS', achado: 'Largo, monomórfico, frequentemente acima de 140–160 ms.' },
      { onda: 'Onda P', achado: 'Dissociada quando visível — sinal de altíssimo valor diagnóstico.' },
      { onda: 'Capturas e fusões', achado: 'Batimentos estreitos ou intermediários no meio da taquicardia confirmam origem ventricular.' },
      { onda: 'Precordiais', achado: 'Concordância positiva ou negativa em V1–V6 aponta fortemente para TV.' },
      { onda: 'Onda T', achado: 'Discordante e frequentemente difícil de delimitar na frequência alta.' },
    ],
    roteiro: [
      'Taquicardia de QRS largo? Assuma TV.',
      'Procure ondas P dissociadas em DII longo e em V1.',
      'Procure batimentos de captura e de fusão.',
      'Avalie concordância precordial e largura do QRS.',
      'Cheque pulso e estabilidade — isso define o tratamento imediato.',
      'Corrija potássio, magnésio e isquemia; programe estratificação com eco e ressonância.',
    ],
    separando: [
      { de: 'TSV com aberrância', chave: 'Ausência de dissociação, morfologia trifásica em V1 e QRS igual ao do ECG basal favorecem aberrância.' },
      { de: 'RIVA', chave: 'O RIVA fica entre 50 e 110 bpm e é bem tolerado.' },
      { de: 'FA pré-excitada', chave: 'Ritmo irregular, larguras variáveis, frequência acima de 200 bpm.' },
      { de: 'Torsades', chave: 'Na torsades o QRS é polimórfico, gira em torno da linha de base e há QT longo de base.' },
    ],
    fixacao: [
      'Dissociação AV, captura e fusão: os três selos de origem ventricular.',
      'Sem pulso, choque não sincronizado; com pulso e instável, cardioversão sincronizada.',
      'Nunca use verapamil numa taquicardia de QRS largo de origem incerta.',
    ],
  },

  torsades: {
    emUmaFrase:
      'Taquicardia ventricular polimórfica cujos QRS parecem torcer-se em torno da linha de base, sempre em terreno de QT longo — a arritmia que se trata com magnésio, não com antiarrítmico convencional.',
    secoes: [
      {
        titulo: 'A mecânica das pós-despolarizações precoces',
        texto:
          'Quando a repolarização se prolonga — por bloqueio de correntes de potássio, hipocalemia, hipomagnesemia, bradicardia ou canalopatia congênita —, os canais de cálcio tipo L têm tempo de reativar-se ainda durante o platô do potencial de ação. Isso gera oscilações de voltagem chamadas pós-despolarizações precoces. Se uma delas atingir o limiar, dispara um batimento ectópico que cai sobre a onda T do batimento anterior — o fenômeno R sobre T — e deflagra a taquicardia. A dispersão transmural da repolarização, com camadas do miocárdio repolarizando em tempos muito diferentes, fornece o substrato para a reentrada funcional que mantém a arritmia. O nome descreve o que se vê: a amplitude e o eixo dos QRS variam ciclicamente, dando a impressão de que o complexo gira ao redor da linha de base.',
      },
      {
        titulo: 'A sequência pausa-dependente',
        texto:
          'A torsades adquirida tem uma assinatura temporal característica: extrassístole ventricular, pausa compensatória, batimento pós-pausa com QT ainda mais longo e onda T ou U aumentada, e então a nova extrassístole que cai sobre essa T e deflagra a arritmia. É a sequência curto–longo–curto. Reconhecê-la explica por que a bradicardia é fator de risco e por que acelerar a frequência (marca-passo provisório a 90–110 bpm ou isoproterenol) é uma estratégia terapêutica eficaz: com ciclos mais curtos, o QT encurta e as pausas desaparecem.',
      },
      {
        titulo: 'As causas: uma lista que precisa estar na cabeça',
        texto:
          'Fármacos que prolongam o QT são a causa mais comum: antiarrítmicos de classe IA e III (quinidina, procainamida, sotalol, ibutilida, dofetilida), antipsicóticos (haloperidol, quetiapina, ziprasidona), antidepressivos (citalopram em altas doses, tricíclicos), antieméticos (ondansetrona, domperidona), macrolídeos e fluoroquinolonas, antifúngicos azólicos, metadona, e antimaláricos. Somam-se hipocalemia, hipomagnesemia, hipocalcemia, bradiarritmias, hipotireoidismo, dieta de inanição e hemorragia subaracnóidea. E há as formas congênitas: síndrome do QT longo, com fenótipos que respondem a gatilhos diferentes — esforço e natação no tipo 1, estímulo auditivo súbito e emoção no tipo 2, sono e repouso no tipo 3. A interação medicamentosa é uma armadilha frequente: dois fármacos com efeito modesto isoladamente podem, juntos, ultrapassar o limiar de risco.',
      },
      {
        titulo: 'Tratamento: por que magnésio',
        texto:
          'Sulfato de magnésio 1 a 2 g intravenoso, mesmo com magnesemia normal, é a terapia de escolha: ele estabiliza a membrana e suprime as pós-despolarizações precoces sem prolongar ainda mais o QT. Corrija potássio agressivamente, mirando faixa alta da normalidade (4,5 a 5 mEq/L). Suspenda todos os fármacos que prolongam QT. Se a arritmia for recorrente e pausa-dependente, acelere a frequência com marca-passo transvenoso ou isoproterenol. Se houver degeneração para fibrilação ventricular ou perda de pulso, desfibrile. Um erro grave a evitar: amiodarona, procainamida e sotalol prolongam o QT e podem piorar a torsades — não são a resposta aqui, ao contrário do que ocorre na TV monomórfica. Na forma congênita, o tratamento crônico envolve betabloqueador (nadolol, propranolol), evitar gatilhos e fármacos proibidos, e cardiodesfibrilador nos casos de alto risco.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Taquicardia polimórfica, geralmente 200–250 bpm, em salvas autolimitadas ou sustentada.' },
      { onda: 'QRS', achado: 'Amplitude e eixo variando ciclicamente — o complexo parece torcer em torno da linha de base.' },
      { onda: 'QT basal', achado: 'Prolongado nos batimentos sinusais (QTc acima de 500 ms indica alto risco).' },
      { onda: 'Onda T/U', achado: 'Ampla, entalhada ou com onda U proeminente, especialmente no batimento pós-pausa.' },
      { onda: 'Deflagração', achado: 'Sequência curto–longo–curto com extrassístole caindo sobre a onda T.' },
    ],
    roteiro: [
      'Identifique taquicardia de QRS largo com morfologia mutante.',
      'Procure o traçado de base: o QT está longo?',
      'Procure a sequência curto–longo–curto que a deflagrou.',
      'Administre magnésio imediatamente e corrija potássio.',
      'Suspenda todos os fármacos que prolongam o QT; acelere a frequência se for pausa-dependente.',
      'Desfibrile se houver perda de pulso.',
    ],
    separando: [
      { de: 'TV monomórfica', chave: 'Na monomórfica todos os QRS são iguais e o QT basal é normal; o tratamento antiarrítmico é oposto.' },
      { de: 'Fibrilação ventricular', chave: 'Na FV não há QRS identificáveis nem periodicidade — é caos elétrico total.' },
      { de: 'TV polimórfica com QT normal', chave: 'Quando o QT é normal, pense em isquemia aguda: o tratamento é revascularização, não magnésio.' },
      { de: 'Artefato', chave: 'Procure QRS marchando por baixo do ruído e correlacione com o estado do paciente.' },
    ],
    fixacao: [
      'Torsades = magnésio. Amiodarona e sotalol pioram.',
      'QTc acima de 500 ms é o sinal amarelo; revise a lista de fármacos do paciente.',
      'Curto–longo–curto é a assinatura de deflagração pausa-dependente.',
    ],
  },

  vfib: {
    emUmaFrase:
      'Ondulações caóticas, sem QRS, sem onda T, sem qualquer periodicidade: o ventrículo treme e não bombeia — parada cardíaca com indicação imediata de desfibrilação.',
    secoes: [
      {
        titulo: 'O que acontece eletricamente',
        texto:
          'Múltiplas frentes de onda de reentrada funcional fragmentam-se continuamente pelo miocárdio ventricular, em wavelets que se dividem e se recombinam. Não há despolarização organizada nem sequência de ativação reprodutível, portanto nenhuma contração coordenada: o ventrículo apenas fibrila. O débito cardíaco cai a zero instantaneamente, a consciência se perde em segundos e a lesão cerebral começa em poucos minutos. A causa mais comum é a isquemia miocárdica aguda; seguem-se cicatriz de infarto prévio, miocardiopatias, canalopatias (síndrome do QT longo, Brugada, TV polimórfica catecolaminérgica), distúrbios eletrolíticos graves, hipóxia, hipotermia, eletrocussão, afogamento e commotio cordis — impacto torácico sobre a onda T, em jovens atletas.',
      },
      {
        titulo: 'Grossa e fina: o que a amplitude informa',
        texto:
          'Nos primeiros minutos, a fibrilação ventricular costuma ser de ondas amplas (grossa), refletindo miocárdio ainda energizado; com o passar do tempo e a depleção de substrato, as ondas diminuem de amplitude (fina) e o traçado se aproxima da assistolia. A amplitude tem valor prognóstico — FV fina responde pior ao choque — mas a conduta é a mesma: desfibrilar. Diante de um traçado plano ou quase plano, é obrigatório verificar ganho, conexões e checar em pelo menos duas derivações, porque uma FV fina não deve ser confundida com assistolia, e o inverso também é verdadeiro.',
      },
      {
        titulo: 'A cadeia de sobrevivência',
        texto:
          'A chance de sobrevida cai cerca de 7% a 10% a cada minuto sem desfibrilação. Por isso a sequência é: reconhecer a parada e chamar ajuda; iniciar compressões torácicas de alta qualidade (100 a 120 por minuto, 5 a 6 cm de profundidade, permitindo o retorno completo do tórax, com interrupções mínimas); desfibrilar assim que o equipamento chegar, com choque não sincronizado na energia máxima recomendada pelo fabricante; retomar compressões imediatamente após o choque, sem checar pulso; adrenalina 1 mg a cada 3 a 5 minutos; amiodarona 300 mg (ou lidocaína) após o terceiro choque em FV refratária. Durante toda a reanimação, procurar e tratar as causas reversíveis — os 5 H e 5 T: hipóxia, hipovolemia, hidrogênio (acidose), hipo/hipercalemia, hipotermia; tensão no tórax (pneumotórax hipertensivo), tamponamento, toxinas, trombose coronariana e trombose pulmonar.',
      },
      {
        titulo: 'Depois do retorno da circulação',
        texto:
          'Os cuidados pós-parada determinam boa parte do prognóstico neurológico: controle direcionado de temperatura, otimização hemodinâmica e ventilatória evitando hiperóxia e hipocapnia, coronariografia de urgência quando há suspeita de causa isquêmica, e neuroprognóstico multimodal adiado por pelo menos 72 horas. Para os sobreviventes de FV sem causa reversível identificada, o cardiodesfibrilador implantável é indicação de prevenção secundária — e a investigação familiar torna-se necessária quando se identifica ou se suspeita de canalopatia ou miocardiopatia hereditária.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Caótico, sem qualquer periodicidade identificável.' },
      { onda: 'Onda P', achado: 'Ausente.' },
      { onda: 'QRS', achado: 'Ausente — não há complexos discerníveis, apenas ondulações irregulares.' },
      { onda: 'Onda T', achado: 'Ausente; não há repolarização organizada.' },
      { onda: 'Amplitude', achado: 'Grossa nos primeiros minutos, tornando-se fina com o tempo e aproximando-se da assistolia.' },
    ],
    roteiro: [
      'Cheque o paciente antes do monitor: responsivo? Respira? Tem pulso?',
      'Confirme o ritmo em duas derivações e verifique ganho e eletrodos.',
      'Inicie compressões de alta qualidade imediatamente.',
      'Desfibrile assim que possível, com choque não sincronizado.',
      'Reassuma compressões sem checar pulso; adrenalina e amiodarona conforme o algoritmo.',
      'Procure ativamente os 5 H e 5 T.',
    ],
    separando: [
      { de: 'Artefato de movimento', chave: 'No artefato há QRS marchando por baixo do ruído e o paciente está consciente — sempre olhe o paciente.' },
      { de: 'TV polimórfica', chave: 'Na TV polimórfica ainda se identificam complexos; na FV não há nenhum.' },
      { de: 'Assistolia', chave: 'FV fina pode parecer linha reta: aumente o ganho e confirme em outra derivação.' },
    ],
    fixacao: [
      'Cada minuto sem desfibrilação custa cerca de 10% de chance de sobrevida.',
      'Nunca trate um monitor: trate um paciente sem pulso.',
      'FV fina não é assistolia — aumente o ganho antes de decidir.',
    ],
  },

  asystole: {
    emUmaFrase:
      'Ausência completa de atividade elétrica ventricular: linha isoelétrica plana no monitor — ritmo não chocável, de prognóstico reservado, em que o tratamento é RCP e causa reversível.',
    secoes: [
      {
        titulo: 'O que a linha reta significa',
        texto:
          'A assistolia representa a cessação total da atividade elétrica ventricular. Pode ser o desfecho final de uma fibrilação ventricular prolongada e não tratada, de uma bradiarritmia extrema, de hipóxia sustentada, de hipercalemia grave, de intoxicação, de tamponamento ou de qualquer causa de parada não revertida. Existe uma variante importante: a assistolia com ondas P (chamada parada ventricular ou P-wave asystole), em que os átrios continuam despolarizando mas nenhum impulso alcança os ventrículos — situação em que a estimulação transcutânea pode, excepcionalmente, ter algum papel se instituída muito precocemente.',
      },
      {
        titulo: 'Confirmar antes de concluir',
        texto:
          'Antes de assumir assistolia, é obrigatório excluir causas técnicas: eletrodo desconectado, cabo rompido, ganho no mínimo, derivação escolhida com vetor perpendicular, monitor em modo inadequado. O protocolo prático é conferir o paciente, checar conexões, aumentar o ganho e confirmar em duas derivações diferentes. Essa verificação existe por uma razão concreta: uma fibrilação ventricular fina pode aparecer como linha quase reta em uma derivação e ser claramente chocável em outra. Chamar de assistolia o que é FV fina significa deixar de dar o único tratamento que salva.',
      },
      {
        titulo: 'Tratamento e limites',
        texto:
          'Assistolia é ritmo não chocável: desfibrilar não tem efeito e apenas interrompe as compressões. O tratamento consiste em RCP de alta qualidade com interrupções mínimas, adrenalina 1 mg a cada 3 a 5 minutos administrada o mais precocemente possível, manejo de via aérea e busca sistemática das causas reversíveis (5 H e 5 T). Marca-passo transcutâneo não está indicado na assistolia estabelecida — não há evidência de benefício. Atropina foi retirada dos algoritmos por falta de eficácia. O prognóstico é sombrio: as taxas de sobrevida com bom estado neurológico são muito baixas, e a decisão de encerrar os esforços deve considerar o tempo de parada sem circulação, a ausência de causa reversível, o CO2 exalado persistentemente baixo (abaixo de 10 mmHg após 20 minutos de reanimação de qualidade) e o contexto clínico e ético do paciente.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Ausente — linha isoelétrica, sem atividade organizada.' },
      { onda: 'Onda P', achado: 'Geralmente ausente; quando presente sem QRS, trata-se de parada ventricular com átrio ativo.' },
      { onda: 'QRS', achado: 'Ausente.' },
      { onda: 'Verificação', achado: 'Sempre conferir eletrodos, ganho e uma segunda derivação antes de firmar o diagnóstico.' },
    ],
    roteiro: [
      'Confirme ausência de responsividade, respiração e pulso.',
      'Cheque cabos, eletrodos e ganho do monitor.',
      'Confirme em pelo menos duas derivações.',
      'Inicie ou mantenha RCP de alta qualidade; adrenalina precoce.',
      'Não desfibrile; procure ativamente os 5 H e 5 T.',
    ],
    separando: [
      { de: 'Fibrilação ventricular fina', chave: 'Aumente o ganho e olhe outra derivação — se houver ondulação, é chocável.' },
      { de: 'Eletrodo desconectado', chave: 'A linha fica perfeitamente reta, sem qualquer ruído de base, e o paciente pode estar bem.' },
      { de: 'AESP', chave: 'Na atividade elétrica sem pulso existe atividade organizada no monitor, mas sem pulso palpável.' },
    ],
    fixacao: [
      'Assistolia não se choca: RCP, adrenalina e causa reversível.',
      'Duas derivações e ganho máximo antes de aceitar linha reta.',
      'Procure os 5 H e 5 T em toda parada — é onde estão as reversíveis.',
    ],
  },

  'pvc-trigeminy': {
    emUmaFrase:
      'Padrão repetitivo em que a cada dois batimentos sinusais surge uma extrassístole ventricular (trigeminismo) ou a cada três (quadrigeminismo).',
    secoes: [
      {
        titulo: 'A lógica dos padrões de acoplamento',
        texto:
          'Bigeminismo, trigeminismo e quadrigeminismo descrevem apenas a periodicidade com que a extrassístole aparece em relação aos batimentos sinusais — respectivamente uma para cada batimento normal, uma para cada dois e uma para cada três. Esses padrões existem porque o foco ectópico tem um relacionamento fixo com o ritmo de base, seja por reentrada com bloqueio de saída em proporção fixa, seja por automatismo com acoplamento constante. A repetição rigorosa é o que dá ao traçado seu aspecto característico e permite reconhecê-lo à distância, antes mesmo de analisar a morfologia.',
      },
      {
        titulo: 'Quantificação: o que o padrão diz sobre a carga',
        texto:
          'A relevância prática está na aritmética. Trigeminismo sustentado significa que cerca de 33% dos batimentos são ectópicos; quadrigeminismo, cerca de 25%. Ambos estão bem acima do limiar aproximado de 10% da carga em 24 horas associado ao risco de miocardiopatia induzida por extrassístoles. Isso transforma um achado aparentemente decorativo em indicação formal de Holter com quantificação e de ecocardiograma. Quando a função ventricular está reduzida e a carga é alta, a ablação do foco frequentemente devolve a fração de ejeção ao normal em poucos meses — um dos desfechos mais gratificantes da eletrofisiologia.',
      },
      {
        titulo: 'Investigação e conduta',
        texto:
          'A abordagem segue a das demais extrassístoles ventriculares: procurar cardiopatia estrutural, quantificar a carga, avaliar o comportamento ao esforço, corrigir potássio e magnésio, revisar estimulantes, álcool, cafeína e apneia do sono. Betabloqueador é a primeira linha para sintomáticos. Um detalhe importante para não errar: padrões de acoplamento também existem com extrassístoles atriais — trigeminismo atrial produz batimentos precoces de QRS estreito precedidos de P prematura. A distinção é a mesma de sempre: procure a onda P antes do batimento precoce.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Padrão repetitivo: dois sinusais e uma extrassístole (trigeminismo) ou três e uma (quadrigeminismo).' },
      { onda: 'Onda P', achado: 'Presente nos batimentos sinusais, ausente antes das extrassístoles.' },
      { onda: 'QRS ectópico', achado: 'Largo, bizarro e de morfologia constante quando o foco é único.' },
      { onda: 'Acoplamento', achado: 'Intervalo fixo entre o último batimento sinusal e a extrassístole.' },
      { onda: 'Carga estimada', achado: 'Cerca de 33% no trigeminismo e 25% no quadrigeminismo, se sustentados.' },
    ],
    roteiro: [
      'Reconheça a repetição do padrão e conte a proporção.',
      'Confirme ausência de P antes dos batimentos largos.',
      'Verifique se as extrassístoles são monomórficas.',
      'Estime a carga e solicite Holter com quantificação.',
      'Avalie função ventricular por ecocardiograma se a carga for alta.',
    ],
    separando: [
      { de: 'Bigeminismo', chave: 'No bigeminismo a proporção é 1:1 e a carga estimada chega a 50%.' },
      { de: 'Trigeminismo atrial', chave: 'Batimento precoce com P prematura e QRS estreito.' },
      { de: 'BAV 3:1', chave: 'No bloqueio há ondas P bloqueadas visíveis e nenhum batimento largo ectópico.' },
    ],
    fixacao: [
      'Trigeminismo ≈ 33% de carga; quadrigeminismo ≈ 25%. Ambos exigem quantificação.',
      'Cardiomiopatia induzida por extrassístoles é reversível — procure-a com ecocardiograma.',
      'A pergunta continua sendo a mesma: existe P antes do batimento precoce?',
    ],
  },

  'pvc-multifocal': {
    emUmaFrase:
      'Extrassístoles ventriculares com morfologias diferentes no mesmo traçado: mais de um foco disparando, sinal de miocárdio instável.',
    secoes: [
      {
        titulo: 'Por que morfologias diferentes preocupam mais',
        texto:
          'Cada morfologia corresponde a um sítio de origem e a um trajeto de ativação distintos. Quando surgem duas ou mais formas, isso significa que múltiplas regiões do ventrículo estão eletricamente instáveis o suficiente para gerar impulsos por conta própria. Isso raramente acontece em coração saudável: as causas típicas são isquemia aguda, distúrbio eletrolítico (hipocalemia e hipomagnesemia à frente), intoxicação digitálica, hipóxia, acidose, miocardiopatia, miocardite e efeito de catecolaminas. Extrassístoles polimórficas também aumentam a probabilidade de fenômenos de reentrada e podem preceder taquicardia ventricular polimórfica e fibrilação ventricular, especialmente em contexto de isquemia aguda ou QT longo.',
      },
      {
        titulo: 'A leitura correta do traçado',
        texto:
          'Compare as extrassístoles em uma mesma derivação — comparar formas em derivações diferentes é um erro conceitual comum, pois qualquer batimento tem morfologia distinta em derivações distintas. Verifique também o intervalo de acoplamento: acoplamentos variáveis reforçam focos independentes, enquanto acoplamento fixo com morfologias diferentes pode indicar um único foco com saídas alternativas ou graus variáveis de fusão com o batimento sinusal. Um cuidado adicional: batimentos de fusão têm morfologia intermediária e podem ser confundidos com um segundo foco; a presença de onda P precedente os identifica.',
      },
      {
        titulo: 'Conduta orientada pela urgência',
        texto:
          'Em contexto agudo, extrassístoles polimórficas são um chamado à ação: eletrocardiograma completo procurando isquemia, troponina, potássio, magnésio, cálcio, gasometria, revisão de fármacos e da digoxinemia, e monitorização contínua. Corrigir potássio para a faixa alta da normalidade e repor magnésio são medidas rápidas e de alto rendimento. O tratamento antiarrítmico específico é reservado para arritmias sustentadas ou instabilidade — suprimir extrassístoles por si só, sobretudo com classe IC em coração isquêmico, é contraindicado. Em contexto ambulatorial, o achado exige investigação estrutural com ecocardiograma e, frequentemente, ressonância magnética.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Sinusal de base com extrassístoles de formas diferentes intercaladas.' },
      { onda: 'QRS ectópicos', achado: 'Duas ou mais morfologias na mesma derivação — critério do diagnóstico.' },
      { onda: 'Acoplamento', achado: 'Frequentemente variável, reforçando origem em focos distintos.' },
      { onda: 'Onda T', achado: 'Discordante em cada extrassístole; avalie o QT dos batimentos sinusais.' },
      { onda: 'Contexto', achado: 'Procure supradesnivelamento, ondas T apiculadas, U proeminentes e QT longo no mesmo traçado.' },
    ],
    roteiro: [
      'Compare as extrassístoles sempre na mesma derivação.',
      'Conte quantas morfologias distintas existem.',
      'Meça os intervalos de acoplamento.',
      'Procure a causa aguda: isquemia, potássio, magnésio, digoxina, hipóxia.',
      'Monitorize — o risco de progressão para arritmia sustentada é real.',
    ],
    separando: [
      { de: 'Extrassístoles unifocais', chave: 'Morfologia única e acoplamento fixo, muito mais benignas.' },
      { de: 'Batimentos de fusão', chave: 'Morfologia intermediária COM onda P precedente.' },
      { de: 'Artefato', chave: 'Deflexões que não interrompem o ritmo de base e não têm onda T correspondente.' },
    ],
    fixacao: [
      'Polimorfismo = múltiplos focos = miocárdio instável. Procure a causa aguda.',
      'Compare formas na mesma derivação, nunca entre derivações diferentes.',
      'Potássio na faixa alta do normal e magnésio reposto são medidas de baixo custo e alto impacto.',
    ],
  },

  'pvc-ron-t': {
    emUmaFrase:
      'A extrassístole cai exatamente sobre a onda T do batimento anterior — no período vulnerável da repolarização — e pode deflagrar taquicardia ventricular polimórfica ou fibrilação ventricular.',
    secoes: [
      {
        titulo: 'O período vulnerável',
        texto:
          'Durante a fase ascendente e o pico da onda T, diferentes regiões do miocárdio estão em estados de recuperação heterogêneos: algumas células já podem ser excitadas, outras ainda estão refratárias, e um terceiro grupo está em refratariedade relativa. Um estímulo aplicado nesse instante encontra um mosaico elétrico ideal para que a frente de onda se fragmente, contorne áreas refratárias e se reentre — o que pode se organizar em fibrilação ventricular. É o mesmo princípio pelo qual a cardioversão precisa ser sincronizada com o QRS: um choque não sincronizado que caia sobre a onda T pode induzir fibrilação ventricular num paciente que estava apenas com uma taquicardia organizada.',
      },
      {
        titulo: 'Quando o fenômeno é realmente perigoso',
        texto:
          'Em coração normal, extrassístoles com acoplamento curto ocorrem e não desencadeiam nada — o fenômeno R sobre T isolado, em paciente sem doença, tem valor preditivo baixo. O risco aumenta enormemente quando existe substrato: isquemia miocárdica aguda, QT prolongado (congênito ou por fármacos), hipocalemia e hipomagnesemia, síndrome de Brugada, TV polimórfica catecolaminérgica e infarto agudo em evolução. Nessas condições, a dispersão da repolarização já está aumentada e o estímulo precoce encontra terreno fértil. Existe ainda o commotio cordis, em que um impacto torácico de baixa energia — uma bolada em jovem atleta — atinge o tórax exatamente durante o período vulnerável e produz fibrilação ventricular em coração absolutamente saudável.',
      },
      {
        titulo: 'Como agir',
        texto:
          'O achado exige monitorização contínua e busca ativa da causa: ECG de 12 derivações procurando isquemia e medindo o QT, potássio, magnésio, cálcio, troponina, revisão completa de fármacos que prolongam o QT. Corrigir potássio para 4,5–5 mEq/L e administrar magnésio são medidas iniciais. Se houver QT longo, tratar como risco de torsades — magnésio, suspensão dos fármacos causadores, e aceleração da frequência se pausa-dependente. Se houver isquemia aguda, o tratamento é a reperfusão. Desfibrilador deve estar imediatamente disponível. E o cuidado técnico permanente: toda cardioversão elétrica em ritmo organizado deve ser sincronizada, precisamente para evitar produzir um R sobre T iatrogênico.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Ritmo de base com extrassístole de acoplamento muito curto.' },
      { onda: 'Acoplamento', achado: 'A extrassístole cai sobre a onda T do batimento precedente — índice de acoplamento curto.' },
      { onda: 'QRS ectópico', achado: 'Largo e bizarro, com frequência deformando completamente a onda T que o precede.' },
      { onda: 'QT basal', achado: 'Avalie sempre: QT longo transforma o achado em risco elevado de torsades.' },
      { onda: 'Consequência', achado: 'Pode ser seguido de salva ventricular, TV polimórfica ou fibrilação ventricular.' },
    ],
    roteiro: [
      'Localize a extrassístole e observe onde ela cai em relação à T anterior.',
      'Meça o QT dos batimentos sinusais.',
      'Procure sinais de isquemia aguda no traçado completo.',
      'Dose potássio, magnésio e troponina; revise fármacos que prolongam QT.',
      'Monitorize com desfibrilador disponível.',
    ],
    separando: [
      { de: 'Extrassístole tardia', chave: 'Cai depois da onda T, no período diastólico seguro, e não tem o mesmo significado.' },
      { de: 'Batimento de escape', chave: 'É tardio e protetor, não precoce e perigoso.' },
      { de: 'Artefato sobre a onda T', chave: 'O artefato não é seguido de pausa e não altera o ritmo subsequente.' },
    ],
    fixacao: [
      'O período vulnerável fica na subida e no pico da onda T.',
      'R sobre T em QT longo ou isquemia aguda é sinal de perigo iminente.',
      'É por isso que a cardioversão deve ser sincronizada.',
    ],
  },

  nsvt: {
    emUmaFrase:
      'Três ou mais batimentos ventriculares consecutivos acima de 100 bpm que terminam espontaneamente em menos de 30 segundos e sem instabilidade hemodinâmica.',
    secoes: [
      {
        titulo: 'A definição e por que ela é rigorosa',
        texto:
          'A TV não sustentada exige três critérios simultâneos: pelo menos três batimentos ventriculares consecutivos, frequência acima de 100 bpm e duração inferior a 30 segundos com término espontâneo, sem provocar instabilidade. Se durar mais de 30 segundos ou exigir intervenção por instabilidade, passa a ser sustentada — e o significado clínico muda completamente. A precisão dessa definição importa porque ela é a fronteira entre um achado que se estratifica ambulatorialmente e uma emergência que pode indicar cardiodesfibrilador.',
      },
      {
        titulo: 'O significado depende inteiramente do coração',
        texto:
          'Este é o ponto central. Em coração estruturalmente normal, com função ventricular preservada, TV não sustentada assintomática tem prognóstico benigno e frequentemente corresponde a arritmias idiopáticas de via de saída, sensíveis a betabloqueador e curáveis por ablação. Em paciente com infarto prévio e fração de ejeção reduzida, o mesmo traçado é marcador independente de risco de morte súbita. Em miocardiopatia hipertrófica, a TV não sustentada em Holter é um dos fatores que entram no cálculo de risco de morte súbita e pode inclinar a decisão para cardiodesfibrilador. Nas canalopatias e na displasia arritmogênica, tem peso semelhante. O mesmo desenho no papel, portanto, muda de significado conforme a doença de base — e é por isso que a resposta correta diante de uma TV não sustentada nunca é olhar apenas para o traçado.',
      },
      {
        titulo: 'Investigação e conduta',
        texto:
          'A avaliação mínima inclui ecocardiograma com função ventricular, ECG de 12 derivações em ritmo sinusal (procurando cicatriz, pré-excitação, QT longo, padrão de Brugada, sinais de displasia arritmogênica), eletrólitos incluindo magnésio, função tireoidiana, pesquisa de isquemia e Holter com quantificação. Ressonância magnética cardíaca é frequentemente decisiva ao demonstrar realce tardio, que sinaliza cicatriz arritmogênica. História familiar de morte súbita muda a estratificação. O tratamento é da doença de base: revascularização quando há isquemia, otimização da terapia da insuficiência cardíaca, betabloqueador como base do controle sintomático, e cardiodesfibrilador conforme os critérios de prevenção primária. Corrigir potássio e magnésio, suspender fármacos pró-arrítmicos e tratar apneia do sono e hipertireoidismo são medidas obrigatórias em todos os casos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Salva de três ou mais QRS largos consecutivos, acima de 100 bpm, com término espontâneo.' },
      { onda: 'Duração', achado: 'Menos de 30 segundos — o critério que a separa da TV sustentada.' },
      { onda: 'QRS', achado: 'Largo; monomórfico (mais comum) ou polimórfico (mais preocupante).' },
      { onda: 'Onda P', achado: 'Pode haver dissociação AV durante a salva, confirmando origem ventricular.' },
      { onda: 'Ritmo de base', achado: 'Analise o traçado sinusal: QT longo, ondas Q de infarto, ondas épsilon e padrão de Brugada mudam o prognóstico.' },
    ],
    roteiro: [
      'Conte os batimentos largos consecutivos: três ou mais?',
      'Meça a frequência (acima de 100 bpm) e a duração (menos de 30 s).',
      'Verifique se houve instabilidade — se houve, não é não sustentada.',
      'Analise o ECG basal em busca de substrato.',
      'Solicite ecocardiograma, Holter, eletrólitos e, conforme o caso, ressonância.',
    ],
    separando: [
      { de: 'TV sustentada', chave: 'Duração acima de 30 s ou necessidade de intervenção por instabilidade.' },
      { de: 'RIVA', chave: 'O RIVA fica entre 50 e 110 bpm; a TVNS está acima de 100 e costuma ser mais rápida.' },
      { de: 'Salva de extrassístoles supraventriculares com aberrância', chave: 'Procure P precedendo cada complexo e morfologia trifásica em V1.' },
    ],
    fixacao: [
      'Três batimentos, mais de 100 bpm, menos de 30 segundos: a definição inteira.',
      'O prognóstico está no coração, não na salva: função ventricular e cicatriz mandam.',
      'TVNS em miocardiopatia hipertrófica entra no cálculo de risco de morte súbita.',
    ],
  },
}

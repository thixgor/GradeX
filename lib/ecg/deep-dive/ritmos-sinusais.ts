import type { DeepDiveMap } from './types'

/** Ritmos sinusais — o padrão de referência e suas variações. */
export const DEEP_DIVE_SINUSAIS: DeepDiveMap = {
  'sinus-normal': {
    emUmaFrase:
      'Cada batimento nasce no nó sinusal, percorre o caminho anatômico completo e chega ao ventrículo no tempo certo — é o traçado contra o qual todos os outros são comparados.',
    secoes: [
      {
        titulo: 'O que acontece dentro do coração',
        texto:
          'O nó sinoatrial (NSA) fica no teto do átrio direito, perto da desembocadura da veia cava superior. Suas células não têm potencial de repouso estável: durante a diástole, uma corrente de entrada lenta (a chamada corrente funny, If, somada às correntes de cálcio tipo T e L) despolariza espontaneamente a membrana até o limiar. Como esse processo é mais rápido no NSA do que em qualquer outro marca-passo do coração, ele dispara primeiro e “sobrescreve” todos os demais — é o fenômeno de supressão por overdrive. A frequência resultante não é fixa: o vago freia (acetilcolina abre canais de potássio e torna a inclinação diastólica mais lenta) e o simpático acelera. Por isso 72 bpm em repouso e 150 bpm subindo escada são o mesmo ritmo.',
      },
      {
        titulo: 'Como esse fenômeno vira desenho no papel',
        texto:
          'A despolarização atrial se espalha do alto do átrio direito para baixo e para a esquerda, em direção ao átrio esquerdo e ao nó AV. Esse vetor aponta para perto de +60°, ou seja, quase exatamente na direção de DII — e é por isso que a onda P sinusal é obrigatoriamente positiva em DII, DIII e aVF, e obrigatoriamente negativa em aVR, cujo eletrodo olha o coração do ombro direito, de costas para o vetor. Em seguida o impulso encontra o nó AV, que o segura por cerca de 100 ms: esse atraso fisiológico é o que dá tempo à sístole atrial de terminar de encher os ventrículos, e é a maior parte do intervalo PR. Depois disso a condução é explosiva — feixe de His, ramos e Purkinje conduzem a até 4 m/s — e os dois ventrículos despolarizam em menos de 120 ms, gerando um QRS estreito. A repolarização ventricular ocorre do epicárdio para o endocárdio, sentido oposto ao da despolarização; duas inversões se cancelam e a onda T acaba positiva, do mesmo lado do QRS.',
      },
      {
        titulo: 'Os números que definem o normal',
        texto:
          'Frequência entre 60 e 100 bpm; intervalo RR constante, com variação inferior a 10%; PR entre 120 e 200 ms; QRS abaixo de 120 ms; QTc até cerca de 440 ms em homens e 460 ms em mulheres; eixo do QRS entre −30° e +90°. Nas precordiais, a onda R cresce progressivamente de V1 a V6 e a transição (ponto em que R e S se igualam) acontece em V3 ou V4 — reflexo do vetor septal inicial, da esquerda para a direita, seguido do vetor principal da massa do ventrículo esquerdo, para a esquerda e para trás. Uma onda q pequena e estreita em DI, aVL, V5 e V6 é normal: é o septo despolarizando no sentido oposto ao eletrodo.',
      },
      {
        titulo: 'Por que estudar o normal com cuidado',
        texto:
          'Praticamente todo erro de interpretação de ECG é, na origem, um normal mal conhecido: chamar de bloqueio um PR de 190 ms, de isquemia uma T invertida em V1 (normal), de sobrecarga uma R alta em V5 de paciente magro e jovem. O traçado normal também é o comparador de si mesmo ao longo do tempo — um ECG antigo do próprio paciente vale mais que qualquer critério populacional. Antes de decorar padrões exóticos, treine até conseguir descrever este traçado de olhos fechados: ritmo, frequência, eixo, intervalos, ondas, segmentos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, uma P para cada QRS e um QRS para cada P — relação 1:1 mantida em todo o traçado.' },
      { onda: 'Onda P', achado: 'Positiva em DII/DIII/aVF, negativa em aVR, arredondada, até 2,5 mm de altura e menos de 120 ms de duração.' },
      { onda: 'Intervalo PR', achado: '120–200 ms, constante batimento a batimento — o tempo do nó AV segurando o impulso.' },
      { onda: 'QRS', achado: 'Menor que 120 ms, eixo entre −30° e +90°, progressão de R com transição em V3–V4.' },
      { onda: 'Segmento ST', achado: 'Isoelétrico, alinhado ao segmento TP, sem elevação nem depressão significativas.' },
      { onda: 'Onda T', achado: 'Positiva e assimétrica (subida lenta, descida rápida), concordante com o QRS; pode ser negativa em V1 e em aVR.' },
      { onda: 'Intervalo QT', achado: 'QTc até 440–460 ms; grosseiramente, o QT ocupa menos da metade do RR em frequências normais.' },
    ],
    roteiro: [
      'Olhe DII longo: existe P antes de cada QRS?',
      'A P é positiva em DII e negativa em aVR? Então é sinusal.',
      'Meça o RR: constante e entre 3 e 5 quadrados grandes (60–100 bpm)?',
      'Meça PR (3 a 5 quadradinhos) e QRS (menos de 3 quadradinhos).',
      'Percorra ST e T em todas as 12 derivações procurando desvios.',
      'Confira eixo em DI e aVF: ambos positivos = eixo normal.',
    ],
    separando: [
      { de: 'Ritmo atrial ectópico', chave: 'A P sinusal é positiva em DII; se a P for negativa ou bifásica em DII/aVF, o foco não é o nó sinusal.' },
      { de: 'Ritmo juncional acelerado', chave: 'No juncional a P some, vem depois do QRS ou é retrógrada; aqui ela precede sempre.' },
      { de: 'Taquicardia atrial', chave: 'A frequência sinusal varia com o contexto e sobe/desce gradualmente; a atrial começa e termina de forma abrupta.' },
    ],
    fixacao: [
      'P positiva em DII é a assinatura do nó sinusal: sem ela, não chame de sinusal.',
      'Regra dos 300: 300, 150, 100, 75, 60, 50 — conte os quadrados grandes entre dois R.',
      'Calibração padrão: 25 mm/s e 10 mm/mV. Um quadradinho = 40 ms e 0,1 mV; um quadradão = 200 ms e 0,5 mV.',
    ],
  },

  'sinus-brady': {
    emUmaFrase:
      'Ritmo sinusal íntegro em câmera lenta: tudo no lugar, P antes de cada QRS, mas o nó sinusal dispara menos de 60 vezes por minuto.',
    secoes: [
      {
        titulo: 'Por que o nó sinusal desacelera',
        texto:
          'A frequência de disparo do NSA depende da inclinação da despolarização diastólica lenta. Qualquer coisa que achate essa rampa reduz a frequência. O caminho mais comum é o vagal: a acetilcolina liberada nas terminações do nervo vago abre canais de potássio (IKACh), hiperpolariza a célula e afasta o potencial de membrana do limiar. É o que ocorre no sono, no atleta treinado (que tem tônus vagal aumentado em repouso e volume sistólico alto, exigindo menos batimentos por minuto), durante vômito, dor visceral, aspiração traqueal ou manobra de Valsalva. Outras causas achatam a rampa por vias diferentes: betabloqueadores e verapamil/diltiazem bloqueiam as correntes de cálcio; a ivabradina bloqueia diretamente a corrente funny; a digoxina age por tônus vagal; o hipotireoidismo e a hipotermia reduzem o metabolismo celular; a hipertensão intracraniana desencadeia bradicardia reflexa; e a doença degenerativa do nó (fibrose senil, isquemia da artéria do nó sinusal) reduz de vez a população de células marca-passo.',
      },
      {
        titulo: 'Como fica o traçado',
        texto:
          'Não há nada de anormal na forma das ondas — só na distância entre elas. A onda P mantém morfologia sinusal, o PR é normal ou levemente alargado (o vago também deprime a condução AV), o QRS é estreito e o RR fica longo: 6 quadrados grandes já significam 50 bpm; 7,5 quadrados, 40 bpm. Um efeito colateral importante da bradicardia é o alongamento do QT absoluto — em 40 bpm um QT de 480 ms pode ser perfeitamente normal depois de corrigido. Outro é o desmascaramento de escapes: com o sinusal lento, focos juncionais (40–60 bpm) podem competir e produzir batimentos de captura ou dissociação isorrítmica, o que às vezes é lido erroneamente como bloqueio.',
      },
      {
        titulo: 'A pergunta que decide a conduta',
        texto:
          'Bradicardia sinusal não é diagnóstico, é achado. A pergunta clínica é: esta frequência está gerando débito cardíaco suficiente? Um maratonista com 42 bpm assintomático não precisa de nada. Um idoso com 42 bpm, tontura, hipotensão e congestão precisa de atropina 0,5–1 mg IV (repetível até 3 mg), marca-passo transcutâneo e, se refratário, infusão de dopamina ou epinefrina — a sequência do algoritmo de bradicardia do ACLS. Entre esses dois extremos está a maior parte da prática: revisar fármacos bradicardizantes, dosar TSH, eletrólitos e troponina, considerar isquemia inferior (a artéria coronária direita irriga o nó sinusal em cerca de 60% das pessoas) e programar Holter se os sintomas forem intermitentes.',
      },
      {
        titulo: 'A armadilha clássica',
        texto:
          'Antes de escrever “bradicardia sinusal”, procure ondas P bloqueadas. Um BAV 2:1 com átrio a 80 bpm produz ventrículos a 40 bpm e, se as P bloqueadas estiverem escondidas dentro da onda T, o traçado parece bradicardia sinusal simples. A pista é uma T de morfologia estranha, empinada ou com entalhe, que se repete idêntica em todos os batimentos. Meça o intervalo entre duas P visíveis e verifique se cabe exatamente uma P adicional dentro da T. Essa distinção muda tudo: bradicardia sinusal vagal é benigna; BAV 2:1 infra-hissiano é indicação de marca-passo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular e lento; RR longo mas constante, com relação P:QRS 1:1 preservada.' },
      { onda: 'Frequência', achado: 'Menor que 60 bpm, tipicamente entre 40 e 59; abaixo de 40, suspeite de bloqueio ou escape.' },
      { onda: 'Onda P', achado: 'Morfologia sinusal intacta — positiva em DII, negativa em aVR. É o que garante que a origem continua no NSA.' },
      { onda: 'Intervalo PR', achado: 'Normal ou no limite superior (o mesmo tônus vagal que freia o nó sinusal também lentifica o nó AV).' },
      { onda: 'QRS', achado: 'Estreito, salvo bloqueio de ramo associado.' },
      { onda: 'Onda T / QT', achado: 'QT absoluto longo pela frequência baixa — sempre corrija antes de falar em QT longo.' },
    ],
    roteiro: [
      'Confirme que existe uma P sinusal antes de cada QRS.',
      'Conte a frequência: menos de 60 bpm.',
      'Percorra as ondas T procurando P escondidas (descartar BAV 2:1).',
      'Verifique se o RR é constante (irregular sugere doença do nó ou pausas).',
      'Pergunte à beira do leito: há sintomas ou instabilidade?',
      'Revise a lista de fármacos e peça TSH, eletrólitos e ECG comparativo.',
    ],
    separando: [
      { de: 'BAV 2:1', chave: 'Procure P bloqueadas dentro da T; no BAV a frequência atrial é o dobro da ventricular.' },
      { de: 'Ritmo juncional', chave: 'No juncional não há P sinusal antes do QRS — ela some, é retrógrada ou aparece após o QRS.' },
      { de: 'Bloqueio sinoatrial', chave: 'No bloqueio SA há pausas que são múltiplos exatos do PP basal; aqui o RR é uniformemente longo.' },
      { de: 'Doença do nó sinusal', chave: 'A bradicardia da doença do nó é inapropriada ao contexto (não sobe ao esforço) e alterna com taquiarritmias.' },
    ],
    fixacao: [
      'Bradicardia sinusal + atleta jovem + assintomático = fisiologia, não doença.',
      'Trate o paciente, não o número: sintomas e perfusão mandam mais que a frequência.',
      'Sempre olhe dentro da onda T antes de assinar “bradicardia sinusal”.',
    ],
  },

  'sinus-tachy': {
    emUmaFrase:
      'Ritmo sinusal acima de 100 bpm — quase sempre a resposta correta do coração a um problema que está em outro lugar do corpo.',
    secoes: [
      {
        titulo: 'Mecanismo: aceleração fisiológica, não arritmia',
        texto:
          'A taquicardia sinusal resulta de estímulo simpático, retirada vagal ou ação direta de catecolaminas e hormônios sobre o NSA. A noradrenalina, por receptores beta-1, aumenta a corrente funny e as correntes de cálcio, tornando mais íngreme a rampa diastólica: a célula chega ao limiar mais cedo e a frequência sobe. Como o comando continua vindo do nó sinusal, a sequência de ativação é a mesma do ritmo normal — o traçado é normal, só que comprimido no tempo. Por isso ela quase nunca é a doença: é febre, dor, hipovolemia, anemia, hipoxemia, sepse, tromboembolismo pulmonar, hipertireoidismo, abstinência, cafeína, salbutamol, cocaína, ansiedade ou simplesmente exercício. A frequência máxima esperada aproxima-se de 220 menos a idade; valores acima disso em repouso pedem outra explicação.',
      },
      {
        titulo: 'O que muda no papel quando a frequência sobe',
        texto:
          'Encurta-se principalmente a diástole, e o primeiro efeito visível é a aproximação da onda P ao final da onda T anterior. Em 130–150 bpm a P frequentemente se funde à T, criando uma onda única de aparência bizarra e levando o observador a achar que “não há P”. A manobra correta é comparar a morfologia da T em derivações diferentes e procurar a deformidade sistemática que denuncia a P embutida. O segundo efeito é a depressão do ponto J e do segmento ST com concavidade e ascensão rápida (depressão “tipo Ta”, causada pela onda de repolarização atrial), que não deve ser lida como isquemia. O terceiro é o encurtamento fisiológico do QT.',
      },
      {
        titulo: 'A pergunta de ouro: 150 bpm é sinusal ou flutter?',
        texto:
          'Uma frequência travada perto de 150 bpm, que não oscila com estímulos nem com o repouso, deve levantar a suspeita de flutter atrial com condução 2:1 — o átrio a 300 bpm e o ventrículo a 150. A taquicardia sinusal, ao contrário, é “viva”: varia alguns batimentos a cada respiração, sobe com a dor, cai com a analgesia, começa e termina de modo gradual. A manobra vagal ou a adenosina em bolus resolvem a dúvida: no flutter, o aumento transitório do bloqueio AV expõe as ondas F em serrote; na taquicardia sinusal, a frequência apenas desacelera brevemente e volta, com a P sinusal sempre visível.',
      },
      {
        titulo: 'Conduta: trate a causa, não o número',
        texto:
          'Frear a frequência sem entender por que ela subiu pode matar. Numa hemorragia, num choque séptico ou num tamponamento, a taquicardia é o mecanismo compensatório que mantém o débito cardíaco (DC = volume sistólico × frequência); administrar betabloqueador nesse cenário derruba a pressão. A investigação segue o corpo, não o traçado: temperatura, hemoglobina, volemia, saturação, D-dímero e escore de probabilidade para TEP, TSH, exame de tórax, revisão de medicações e drogas. A taquicardia sinusal inapropriada — persistente, sem causa, em geral em mulheres jovens, com frequência de repouso acima de 100 bpm e média nas 24 horas acima de 90 — é diagnóstico de exclusão e aí sim se trata a frequência, com ivabradina ou betabloqueador.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com início e término graduais; a frequência “respira” junto com o contexto clínico.' },
      { onda: 'Frequência', achado: 'Entre 100 e cerca de 180 bpm no adulto (limite aproximado de 220 − idade).' },
      { onda: 'Onda P', achado: 'Sinusal, mas frequentemente fundida à onda T precedente — procure a deformidade da T.' },
      { onda: 'Intervalo PR', achado: 'Normal ou levemente encurtado pelo estímulo simpático sobre o nó AV.' },
      { onda: 'QRS', achado: 'Estreito, morfologia inalterada em relação ao traçado basal do paciente.' },
      { onda: 'Segmento ST', achado: 'Pode haver depressão de ponto J ascendente por repolarização atrial — não confundir com isquemia.' },
    ],
    roteiro: [
      'Confirme P sinusal antes de cada QRS (procure dentro da T se necessário).',
      'Frequência entre 100 e 180 bpm, variando com o contexto.',
      'Frequência fixa em ~150 bpm? Pense em flutter 2:1 e faça manobra vagal.',
      'Compare com um ECG antigo: a morfologia do QRS deve ser a mesma.',
      'Vá ao paciente procurar a CAUSA: febre, dor, sangramento, hipóxia, TEP, tireoide, drogas.',
    ],
    separando: [
      { de: 'Flutter atrial 2:1', chave: 'Frequência travada em 150 e ondas F em serrote em DII/DIII/aVF após adenosina.' },
      { de: 'Taquicardia atrial focal', chave: 'Onda P de morfologia diferente da sinusal e início/fim abruptos.' },
      { de: 'AVNRT', chave: 'Frequência 150–250, início e término súbitos, P ausente ou pseudo-r′ em V1.' },
    ],
    fixacao: [
      'Taquicardia sinusal é sintoma, não doença — o diagnóstico está fora do ECG.',
      '“FC fixa em 150” é a senha para procurar flutter.',
      'Nunca betabloqueie uma taquicardia compensatória antes de excluir hipovolemia e choque.',
    ],
  },

  'sinus-arrhythmia': {
    emUmaFrase:
      'O intervalo entre os batimentos aumenta e diminui em fase com a respiração — irregularidade que é sinal de saúde, não de doença.',
    secoes: [
      {
        titulo: 'A fisiologia por trás da irregularidade',
        texto:
          'Durante a inspiração, a pressão intratorácica cai, o retorno venoso aumenta e o tônus vagal é transitoriamente inibido; a frequência sobe. Na expiração ocorre o oposto: o vago volta a dominar e a frequência cai. Somam-se a isso o reflexo de Bainbridge (o estiramento do átrio direito pelo maior retorno venoso acelera o nó sinusal) e a modulação barorreflexa. O resultado é uma oscilação cíclica do intervalo PP, sincronizada com o ciclo respiratório. É a base fisiológica da variabilidade da frequência cardíaca — quanto maior a arritmia sinusal respiratória, melhor o tônus vagal e, em populações, melhor o prognóstico cardiovascular. Ela é mais evidente em crianças, adolescentes e adultos jovens, e diminui com a idade, com a neuropatia autonômica do diabetes e na insuficiência cardíaca.',
      },
      {
        titulo: 'Como reconhecer no traçado',
        texto:
          'Tudo permanece sinusal: a onda P tem sempre a mesma morfologia (positiva em DII, negativa em aVR), o PR é constante e o QRS é estreito. O que varia é apenas o intervalo PP/RR, e varia de modo gradual e cíclico — encurta progressivamente ao longo de vários batimentos e depois alonga progressivamente, formando “ondas” de frequência. Considera-se significativa uma variação do PP maior que 120 ms, ou uma diferença de mais de 10% entre o maior e o menor intervalo. A distinção da fibrilação atrial é simples e absoluta: aqui há onda P, e a irregularidade é rítmica e previsível; na FA não há P e a irregularidade é caótica, sem padrão.',
      },
      {
        titulo: 'A variante não respiratória',
        texto:
          'Existe uma arritmia sinusal não relacionada à respiração, mais comum em idosos, em portadores de doença cardíaca e sob efeito de digoxina — a variação do PP não segue o ciclo respiratório. Há também a arritmia sinusal ventriculofásica, vista no BAV total: os intervalos PP que contêm um QRS são discretamente mais curtos que os que não contêm, provavelmente porque o enchimento mecânico do ventrículo melhora a perfusão da artéria do nó sinusal. Nenhuma dessas variantes muda a conduta, mas reconhecê-las evita diagnósticos falsos de bloqueio sinoatrial ou de extrassistolia.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregular de modo cíclico: acelera na inspiração, desacelera na expiração.' },
      { onda: 'Onda P', achado: 'Sempre sinusal e sempre com a mesma morfologia — é o que exclui foco ectópico.' },
      { onda: 'Intervalo PR', achado: 'Constante em todos os batimentos, apesar da variação do RR.' },
      { onda: 'QRS', achado: 'Estreito e idêntico batimento a batimento.' },
      { onda: 'Intervalo PP', achado: 'Variação maior que 120 ms entre o mais curto e o mais longo, em fase com a respiração.' },
    ],
    roteiro: [
      'Veja que o RR varia — e resista ao impulso de chamar de fibrilação atrial.',
      'Procure a onda P: presente, sinusal e igual em todos os batimentos.',
      'Confira que o PR é constante (exclui bloqueio e ectopias).',
      'Observe se a variação é gradual e cíclica, não aleatória.',
      'Peça ao paciente que prenda a respiração: a irregularidade desaparece.',
    ],
    separando: [
      { de: 'Fibrilação atrial', chave: 'Na FA não há onda P e a irregularidade é totalmente imprevisível.' },
      { de: 'Extrassístoles atriais', chave: 'A extrassístole é um batimento precoce e isolado com P de outra morfologia, não uma variação suave.' },
      { de: 'Bloqueio sinoatrial', chave: 'No bloqueio SA a pausa é abrupta e múltipla do PP basal, não uma oscilação gradual.' },
    ],
    fixacao: [
      'Irregular COM onda P constante e cíclica = arritmia sinusal; irregular SEM onda P = fibrilação atrial.',
      'Prender a respiração é o teste de cabeceira que confirma o diagnóstico.',
      'A ausência total de variabilidade num jovem é mais preocupante que a presença dela.',
    ],
  },

  'sinus-pause': {
    emUmaFrase:
      'O nó sinusal simplesmente falha por um instante: nenhuma P, nenhum QRS, uma linha reta no meio de um ritmo até então normal.',
    secoes: [
      {
        titulo: 'Dois mecanismos, um mesmo desenho',
        texto:
          'A interrupção pode ocorrer por falha de geração — o NSA não dispara, é a parada (arresto) sinusal — ou por falha de saída, quando o impulso é gerado mas não consegue atravessar a junção sinoatrial, o bloqueio sinoatrial. A distinção é matemática: na parada sinusal a pausa não guarda relação aritmética com o ciclo basal, porque o marca-passo simplesmente “pulou” um tempo indeterminado; no bloqueio SA de segundo grau tipo II a pausa é um múltiplo exato do PP prévio (duas, três vezes), já que o relógio continuou funcionando e apenas o impulso não saiu. No bloqueio SA tipo I (Wenckebach sinoatrial), o PP encurta progressivamente antes da pausa, e a pausa é menor que o dobro do PP mais curto — o mesmo comportamento de Wenckebach que se vê no nó AV, um andar acima.',
      },
      {
        titulo: 'Por que a pausa é perigosa (ou não)',
        texto:
          'O coração tem marca-passos subsidiários: a junção AV dispara a 40–60 bpm e o sistema His-Purkinje a 20–40 bpm. Se um deles assumir rapidamente, a pausa termina com um batimento de escape (QRS estreito se juncional, largo se ventricular) e o paciente nem percebe. O problema aparece quando os escapes também estão doentes — o que é comum na doença degenerativa do nó, porque o processo fibrótico raramente poupa só um andar. Aí a pausa se prolonga, o fluxo cerebral cai e vem a síncope de Stokes-Adams: perda súbita da consciência, sem pródromo, com recuperação igualmente súbita. O ponto de corte clássico é 3 segundos em vigília (ou mais de 5 segundos na fibrilação atrial), mas o que define a gravidade é a correlação com sintomas, não o cronômetro isolado.',
      },
      {
        titulo: 'Causas reversíveis antes de pensar em marca-passo',
        texto:
          'Hipertonia vagal (dor, vômito, micção, tosse, síncope neuromediada, atleta durante o sono), fármacos (betabloqueador, verapamil, diltiazem, digoxina, amiodarona, ivabradina, lítio, clonidina), isquemia da coronária direita, hipercalemia, hipotireoidismo, hipotermia, apneia obstrutiva do sono e infecções como doença de Lyme e miocardite. Todas devem ser buscadas e corrigidas antes de indicar dispositivo — o marca-passo definitivo é para pausa sintomática sem causa reversível. Quando os sintomas são esporádicos, a documentação exige monitorização prolongada: Holter de 24–48 horas, monitor de eventos, e, nos casos mais difíceis, monitor cardíaco implantável.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Sinusal regular interrompido por um intervalo sem qualquer atividade elétrica.' },
      { onda: 'Onda P', achado: 'Ausente durante a pausa — é isso que a diferencia do bloqueio AV, em que a P aparece e não conduz.' },
      { onda: 'QRS', achado: 'Ausente na pausa; pode retornar como batimento de escape juncional (estreito) ou ventricular (largo).' },
      { onda: 'Duração da pausa', achado: 'Pausas maiores que 3 s em vigília são relevantes; correlacione sempre com sintomas.' },
      { onda: 'Aritmética da pausa', achado: 'Múltiplo exato do PP = bloqueio SA; sem relação matemática = parada sinusal.' },
    ],
    roteiro: [
      'Identifique o intervalo sem P e sem QRS.',
      'Meça o PP basal e verifique se a pausa é múltipla dele.',
      'Procure onda P dentro da pausa: se houver P sem QRS, o problema é AV, não sinusal.',
      'Veja como a pausa termina: escape juncional, escape ventricular ou retorno sinusal.',
      'Correlacione com sintoma (síncope, tontura) e revise fármacos e eletrólitos.',
    ],
    separando: [
      { de: 'BAV de 2º grau', chave: 'No BAV existe onda P bloqueada dentro da pausa; aqui não há P nenhuma.' },
      { de: 'Extrassístole atrial bloqueada', chave: 'Procure uma P precoce escondida na onda T antes da pausa — é a causa mais comum de pausa em ECG ambulatorial.' },
      { de: 'Arritmia sinusal', chave: 'A arritmia sinusal é oscilação gradual e cíclica; a pausa é súbita e isolada.' },
    ],
    fixacao: [
      'Pausa SEM onda P = problema do nó sinusal. Pausa COM onda P = problema do nó AV.',
      'Antes de indicar marca-passo, procure a extrassístole atrial bloqueada escondida na T.',
      'Pausa de 3 segundos acordado, ou 5 segundos em FA, merece investigação formal.',
    ],
  },

  'pac-isolated': {
    emUmaFrase:
      'Um batimento adiantado nascido em algum ponto do átrio que não é o nó sinusal: P de forma diferente, QRS estreito e uma pausa incompleta depois.',
    secoes: [
      {
        titulo: 'De onde vem a extrassístole atrial',
        texto:
          'Um foco atrial ectópico — com frequência nas mangas musculares que envolvem a desembocadura das veias pulmonares, mas também na crista terminal, no seio coronário ou no anel tricúspide — atinge o limiar antes do próximo disparo sinusal e captura o átrio. Como esse foco fica em posição diferente do NSA, o vetor de despolarização atrial é diferente e a onda P resultante tem outra morfologia: pode ser mais baixa, entalhada, bifásica ou até negativa em DII, dependendo de quão inferior ou esquerdo é o foco. Os gatilhos habituais são cafeína, álcool, nicotina, estresse, privação de sono, distúrbio eletrolítico, hipertireoidismo, doença pulmonar e distensão atrial de qualquer causa.',
      },
      {
        titulo: 'Os três destinos de uma extrassístole atrial',
        texto:
          'Primeiro destino: conduzir normalmente. O impulso encontra o nó AV e o sistema His-Purkinje recuperados, atravessa e produz um QRS idêntico ao sinusal — é o caso mais comum. Segundo destino: conduzir com aberrância. Se a extrassístole for muito precoce, o ramo direito (cujo período refratário é o mais longo) ainda não terá se recuperado, e o impulso desce apenas pelo ramo esquerdo — o QRS sai largo com padrão de bloqueio de ramo direito, imitando uma extrassístole ventricular. A pista salvadora é a onda P precoce deformando a T anterior: se ela existe, a origem é supraventricular. Terceiro destino: não conduzir. Se ainda mais precoce, o nó AV inteiro estará refratário e não haverá QRS — a extrassístole atrial bloqueada, causa número um de pausa súbita em ECG ambulatorial e frequente responsável por diagnósticos equivocados de bloqueio ou parada sinusal.',
      },
      {
        titulo: 'A pausa: por que é incompleta',
        texto:
          'O impulso ectópico não apenas despolariza o átrio: ele também penetra retrogradamente no nó sinusal e o reinicia (reset). Assim, o próximo batimento sinusal sai contando o tempo a partir da extrassístole, e não do último batimento normal. O resultado é uma pausa compensatória incompleta — o intervalo entre o batimento anterior à extrassístole e o posterior a ela é menor que o dobro do RR basal. Isso contrasta com a extrassístole ventricular, que geralmente não penetra o nó sinusal e produz pausa compensatória completa. Medir esse intervalo com o paquímetro é um dos truques mais úteis para classificar uma ectopia duvidosa.',
      },
      {
        titulo: 'Significado clínico',
        texto:
          'Extrassístoles atriais isoladas são extremamente comuns e, em coração estruturalmente normal, benignas — a maioria das pessoas tem algumas por dia. Merecem atenção quando são muito frequentes (mais de 500 por 24 horas, ou salvas repetidas), porque nesse cenário são marcador independente de risco para fibrilação atrial futura e para eventos embólicos, sinalizando uma miocardiopatia atrial subjacente. A abordagem é remover gatilhos, corrigir eletrólitos (potássio e magnésio), tratar apneia do sono e hipertireoidismo, e reservar betabloqueador para os sintomáticos. Palpitações descritas como “falha” ou “tranco” costumam corresponder não à extrassístole em si, mas ao batimento pós-pausa, mais forte pelo maior enchimento diastólico.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Sinusal de base interrompido por batimentos precoces isolados.' },
      { onda: 'Onda P ectópica', achado: 'Prematura e com morfologia diferente da sinusal; procure-a deformando a onda T anterior.' },
      { onda: 'Intervalo PR', achado: 'Pode ser normal, longo (condução lenta pelo nó AV parcialmente refratário) ou a P pode não conduzir.' },
      { onda: 'QRS', achado: 'Estreito e idêntico ao sinusal — a menos que haja aberrância, quando assume padrão de bloqueio de ramo direito.' },
      { onda: 'Pausa', achado: 'Compensatória incompleta: o intervalo em torno da extrassístole é menor que dois RR basais.' },
    ],
    roteiro: [
      'Localize o batimento adiantado no traçado.',
      'Procure a onda P prematura — inclusive dentro da onda T do batimento anterior.',
      'Compare a morfologia dessa P com a P sinusal: é diferente.',
      'Veja se o QRS é estreito (condução normal) ou largo (aberrância).',
      'Meça a pausa: incompleta reforça origem atrial.',
      'Conte quantas há no traçado e pergunte sobre cafeína, álcool, sono e sintomas.',
    ],
    separando: [
      { de: 'Extrassístole ventricular', chave: 'Na ventricular não há P precedendo o batimento largo e a pausa é compensatória completa.' },
      { de: 'Arritmia sinusal', chave: 'A arritmia sinusal varia gradualmente; a extrassístole é um evento súbito e isolado.' },
      { de: 'Parada sinusal', chave: 'Se houver pausa, procure a P precoce bloqueada dentro da T — extrassístole atrial bloqueada é a causa mais frequente.' },
    ],
    fixacao: [
      'Toda pausa inexplicada pede uma inspeção com lupa das ondas T que a precedem.',
      'P precoce diferente + QRS estreito + pausa incompleta = extrassístole atrial.',
      'Extrassístoles atriais muito frequentes são um aviso de fibrilação atrial no futuro.',
    ],
  },

  'pvc-isolated': {
    emUmaFrase:
      'Um batimento largo e bizarro que chega antes da hora, sem onda P na frente, seguido de pausa compensatória completa.',
    secoes: [
      {
        titulo: 'Por que o QRS é largo e feio',
        texto:
          'O impulso nasce abaixo da bifurcação do feixe de His — no miocárdio ventricular ou na rede distal de Purkinje. Sem acesso à autoestrada do His-Purkinje desde o início, a ativação se propaga em boa parte músculo a músculo, a cerca de 0,4 m/s em vez de 4 m/s. O ventrículo de origem despolariza primeiro e o outro depois, sequencialmente e não em paralelo. Isso produz três marcas registradas: QRS largo (acima de 120 ms, com frequência acima de 140 ms), morfologia bizarra que não corresponde a nenhum padrão de bloqueio de ramo típico, e onda T em direção oposta à do QRS — a chamada discordância apropriada, consequência da repolarização também caminhar por trajeto anormal.',
      },
      {
        titulo: 'Lendo a origem pelo desenho',
        texto:
          'A morfologia diz de onde veio. Extrassístole com padrão de bloqueio de ramo esquerdo (QRS predominantemente negativo em V1) nasce no ventrículo direito; com padrão de bloqueio de ramo direito (positivo em V1) nasce no ventrículo esquerdo. O eixo no plano frontal indica se é de via de saída (eixo inferior, ondas R altas em DII, DIII e aVF — típico da via de saída do ventrículo direito, a origem mais comum das extrassístoles idiopáticas) ou apical/inferior (eixo superior). Extrassístoles da via de saída do VD, em coração normal, têm excelente prognóstico e respondem bem à ablação quando sintomáticas.',
      },
      {
        titulo: 'A pausa compensatória completa',
        texto:
          'O impulso ventricular geralmente não consegue atravessar o nó AV em sentido retrógrado com força suficiente para reiniciar o nó sinusal. O NSA continua contando o tempo normalmente: a P seguinte chega no horário previsto, mas encontra o ventrículo refratário e não conduz; o batimento sinusal seguinte é o primeiro visível. O resultado é que o intervalo entre o batimento pré e o pós-extrassístole é exatamente o dobro do RR basal — pausa compensatória completa. Quando a extrassístole cai entre dois batimentos sinusais sem alterar nenhum deles, chama-se interpolada, um sinal de frequência de base lenta.',
      },
      {
        titulo: 'Quando se preocupar',
        texto:
          'Em coração estruturalmente normal, extrassístoles ventriculares isoladas são benignas — presentes em até 75% dos adultos em Holter de 24 horas. A investigação se torna obrigatória quando há: cardiopatia estrutural conhecida, história familiar de morte súbita, síncope, extrassístoles polimórficas, fenômeno R sobre T, salvas repetidas, ou carga elevada (acima de 10% dos batimentos em 24 horas, limiar a partir do qual pode surgir miocardiopatia induzida por extrassístoles, reversível com ablação). A avaliação mínima nesses casos inclui ecocardiograma, Holter com quantificação de carga, eletrólitos, teste ergométrico (extrassístoles que aumentam com o esforço preocupam mais que as que desaparecem) e, conforme o contexto, ressonância magnética cardíaca.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Sinusal de base com batimentos largos precoces intercalados.' },
      { onda: 'Onda P', achado: 'Ausente antes da extrassístole — é o achado que a separa da atrial com aberrância.' },
      { onda: 'QRS', achado: 'Largo (acima de 120 ms), bizarro, sem padrão típico de bloqueio de ramo.' },
      { onda: 'Onda T', achado: 'Oposta à deflexão principal do QRS (discordância apropriada).' },
      { onda: 'Pausa', achado: 'Compensatória completa: RR pré + RR pós = 2 × RR basal.' },
      { onda: 'Morfologia', achado: 'Padrão de bloqueio de ramo esquerdo aponta origem no VD; de ramo direito, origem no VE.' },
    ],
    roteiro: [
      'Ache o batimento largo e precoce.',
      'Confirme que NÃO há onda P imediatamente antes dele.',
      'Verifique a onda T oposta ao QRS.',
      'Meça a pausa: completa (dobro do RR) reforça origem ventricular.',
      'Olhe V1: negativo (origem VD) ou positivo (origem VE)?',
      'Conte a carga e procure sinais de cardiopatia estrutural.',
    ],
    separando: [
      { de: 'Extrassístole atrial com aberrância', chave: 'Procure a P precoce na T anterior e a pausa incompleta — se houver, é supraventricular.' },
      { de: 'Batimento de escape ventricular', chave: 'O escape vem TARDE (depois de uma pausa); a extrassístole vem CEDO.' },
      { de: 'Batimento de fusão', chave: 'A fusão tem morfologia intermediária entre o QRS sinusal e o ectópico, com P na frente.' },
    ],
    fixacao: [
      'Largo + precoce + sem P + pausa completa = extrassístole ventricular.',
      'Precoce é extrassístole; tardio é escape. Nunca suprima um escape.',
      'Carga acima de 10% em 24 h pode causar miocardiopatia reversível — quantifique sempre.',
    ],
  },

  'sick-sinus': {
    emUmaFrase:
      'O nó sinusal doente perde a capacidade de ajustar a frequência à demanda: alterna bradicardia inapropriada, pausas e surtos de taquiarritmia atrial no mesmo paciente.',
    secoes: [
      {
        titulo: 'O que é a doença do nó sinusal',
        texto:
          'É uma síndrome, não um traçado único. O substrato é a degeneração fibrótica progressiva do nó sinusal e do miocárdio atrial adjacente, associada ao envelhecimento, à hipertensão, à isquemia, a cirurgia cardíaca prévia, a amiloidose, a doenças infiltrativas e a canalopatias familiares (mutações em HCN4 e SCN5A). O tecido nodal remanescente perde células marca-passo e a condução sinoatrial se torna irregular. O resultado é um espectro de manifestações que podem coexistir no mesmo paciente ao longo do dia: bradicardia sinusal persistente e inapropriada, parada sinusal, bloqueio sinoatrial, incompetência cronotrópica (a frequência não sobe adequadamente ao esforço — não atinge 80% da máxima prevista) e a síndrome bradi-taqui, em que episódios de fibrilação ou flutter atrial terminam em pausas longas antes de o nó sinusal reassumir.',
      },
      {
        titulo: 'A síndrome bradi-taqui e o perigo da pausa de conversão',
        texto:
          'A fibrilação atrial suprime o nó sinusal por overdrive: durante minutos ou horas de estímulo atrial rápido, as células nodais ficam ainda mais deprimidas. Quando a arritmia termina, o nó sinusal doente demora a retomar — e é justamente aí, na pausa de conversão, que ocorre a síncope. Esse é o cenário clínico mais característico: paciente idoso com palpitações rápidas que terminam com escurecimento visual ou desmaio. O paradoxo terapêutico está montado: os fármacos necessários para controlar a taquiarritmia (betabloqueador, amiodarona, verapamil) agravam a bradicardia e as pausas, e frequentemente é o marca-passo definitivo que permite tratar adequadamente a taquiarritmia.',
      },
      {
        titulo: 'Diagnóstico: correlacionar sintoma e traçado',
        texto:
          'Um ECG isolado raramente fecha o diagnóstico, porque as alterações são intermitentes. O padrão-ouro prático é a correlação entre sintoma e ritmo documentada por Holter de 24–48 horas, monitor de eventos ou monitor cardíaco implantável. O teste ergométrico avalia a competência cronotrópica. Antes de rotular, é obrigatório excluir causas reversíveis — sobretudo fármacos (betabloqueador, verapamil, diltiazem, digoxina, amiodarona, ivabradina, lítio, clonidina), hipotireoidismo, isquemia, hipercalemia e apneia obstrutiva do sono. O estudo eletrofisiológico com medida do tempo de recuperação do nó sinusal tem baixa sensibilidade e hoje se restringe a casos selecionados.',
      },
      {
        titulo: 'Tratamento e prognóstico',
        texto:
          'Assintomático não trata. Sintomático com correlação documentada e sem causa reversível: marca-passo definitivo, indicação classe I — preferencialmente com estimulação atrial ou bicameral, que reduz fibrilação atrial e síndrome do marca-passo em comparação com a estimulação ventricular isolada. O risco embólico é real: a doença do nó anda junto com a miocardiopatia atrial e a fibrilação atrial, e a anticoagulação segue o CHA2DS2-VASc, não a decisão sobre o dispositivo. A mortalidade da doença do nó em si é baixa; a morbidade vem das quedas, das síncopes e dos eventos embólicos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Variável no mesmo traçado: bradicardia sinusal, pausas, escapes e surtos de taquiarritmia atrial.' },
      { onda: 'Frequência', achado: 'Bradicardia inapropriada para o contexto e que não sobe ao esforço (incompetência cronotrópica).' },
      { onda: 'Onda P', achado: 'Sinusal nos períodos lentos; ausente ou substituída por ondas f/F durante os surtos de FA ou flutter.' },
      { onda: 'Pausas', achado: 'Longas, sobretudo ao término dos episódios de taquiarritmia (pausa de conversão).' },
      { onda: 'QRS', achado: 'Habitualmente estreito; escapes juncionais frequentes aparecem depois das pausas.' },
    ],
    roteiro: [
      'Procure a coexistência de ritmos lentos e rápidos no mesmo registro.',
      'Meça as pausas, com atenção especial às que sucedem episódios de FA.',
      'Verifique se a frequência responde ao esforço ou permanece travada.',
      'Exclua causas reversíveis — fármacos em primeiro lugar.',
      'Correlacione cada sintoma relatado com o ritmo do mesmo horário no Holter.',
    ],
    separando: [
      { de: 'Bradicardia sinusal fisiológica', chave: 'A fisiológica é apropriada ao contexto e sobe normalmente ao esforço.' },
      { de: 'Bradicardia por fármacos', chave: 'Reversível: reavalie após suspender betabloqueador, verapamil, digoxina ou amiodarona.' },
      { de: 'Bloqueio AV', chave: 'No BAV o problema está abaixo do átrio, com P bloqueadas; aqui a falha é na própria geração do impulso.' },
    ],
    fixacao: [
      'Síncope logo após palpitações rápidas em idoso = pense em pausa de conversão da síndrome bradi-taqui.',
      'Marca-passo trata a bradicardia; anticoagulação segue o CHA2DS2-VASc, independentemente do dispositivo.',
      'Nenhum diagnóstico sem correlação entre sintoma e ritmo documentada.',
    ],
  },
}

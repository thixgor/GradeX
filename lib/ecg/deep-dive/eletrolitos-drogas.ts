import type { DeepDiveMap } from './types'

/** Eletrólitos, fármacos e temperatura — quando o meio interno reescreve o traçado. */
export const DEEP_DIVE_ELETROLITOS: DeepDiveMap = {
  hyperkalemia: {
    emUmaFrase:
      'O potássio alto altera o potencial de repouso e a repolarização em sequência previsível: T apiculadas, depois P que some e PR que alarga, depois QRS que se alarga até a onda sinusoidal.',
    secoes: [
      {
        titulo: 'A cascata eletrofisiológica',
        texto:
          'O potássio extracelular determina o potencial de repouso da membrana. Quando ele sobe, o potencial de repouso torna-se menos negativo, o que produz dois efeitos sucessivos e aparentemente contraditórios. Primeiro, a repolarização fica mais rápida — a condutância ao potássio aumenta —, encurtando o potencial de ação e produzindo ondas T altas, estreitas e simétricas. Depois, com o potencial de repouso cada vez menos negativo, os canais de sódio rápidos passam a estar parcialmente inativados: a velocidade de despolarização cai, a condução se torna lenta e o QRS alarga. O átrio, que tem células mais sensíveis, deixa de despolarizar antes do ventrículo, e a onda P desaparece enquanto ainda existe condução até o ventrículo — a paralisia atrial com ritmo sinoventricular.',
      },
      {
        titulo: 'A progressão que se pode ler como um termômetro',
        texto:
          'Em torno de 5,5 a 6,5 mEq/L: ondas T apiculadas, altas, simétricas e de base estreita, mais evidentes nas precordiais, com encurtamento do QT. Entre 6,5 e 8: achatamento e desaparecimento da onda P, prolongamento do intervalo PR e início do alargamento do QRS. Acima de 8: QRS progressivamente mais largo e bizarro, fusão do QRS com a onda T formando a onda sinusoidal — sinal pré-terminal —, seguida de fibrilação ventricular ou assistolia. Essa correlação é apenas orientativa: a velocidade de instalação importa tanto quanto o valor absoluto, e pacientes com hipercalemia crônica podem tolerar valores altos com poucas alterações, enquanto elevações agudas produzem alterações graves com números menores. Um alerta prático essencial: cerca de metade dos pacientes com hipercalemia significativa não apresenta as alterações clássicas — ECG normal jamais exclui hipercalemia.',
      },
      {
        titulo: 'Padrões enganosos',
        texto:
          'A hipercalemia é uma grande imitadora. Pode produzir supradesnivelamento do ST em V1–V2 semelhante ao padrão de Brugada (o chamado padrão de pseudo-Brugada), imitar infarto com supradesnivelamento, gerar bradicardias com QRS largo que parecem ritmo idioventricular e bloqueios de ramo que aparecem e desaparecem conforme o potássio. Diante de qualquer traçado com QRS largo e bizarro sem explicação, sobretudo em paciente com doença renal crônica, diabetes, uso de inibidores do sistema renina-angiotensina, espironolactona ou histórico de rabdomiólise, o potássio deve ser dosado imediatamente — e o tratamento não deve esperar o resultado quando o traçado é sugestivo e o quadro é compatível.',
      },
      {
        titulo: 'Tratamento em três frentes',
        texto:
          'Primeira: estabilizar a membrana com gluconato ou cloreto de cálcio intravenoso. O cálcio não reduz o potássio, mas restaura a diferença entre o potencial de repouso e o limiar, revertendo as alterações elétricas em minutos; é a medida que evita a parada cardíaca e deve ser a primeira em qualquer traçado com alargamento do QRS. Segunda: deslocar o potássio para dentro da célula com insulina associada a glicose, beta-agonista inalatório em dose alta e, quando houver acidose, bicarbonato. Terceira: remover potássio do organismo com diuréticos, resinas ou novos quelantes e, definitivamente, com diálise, indicada na hipercalemia grave e refratária ou na presença de insuficiência renal. Em paralelo, suspender todas as fontes e todos os fármacos que retêm potássio.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda T', achado: 'Alta, apiculada, simétrica e de BASE ESTREITA — o primeiro sinal.' },
      { onda: 'Onda P', achado: 'Achata e desaparece à medida que o potássio sobe (paralisia atrial).' },
      { onda: 'Intervalo PR', achado: 'Prolonga-se antes de a P sumir.' },
      { onda: 'QRS', achado: 'Alarga progressivamente e torna-se bizarro; pode simular bloqueio de ramo.' },
      { onda: 'Intervalo QT', achado: 'Encurta nas fases iniciais.' },
      { onda: 'Fase terminal', achado: 'Onda sinusoidal pela fusão de QRS e T — pré-parada.' },
    ],
    roteiro: [
      'Olhe as ondas T: apiculadas de base estreita?',
      'Procure a onda P: presente, achatada ou ausente?',
      'Meça o PR e a largura do QRS.',
      'Considere hipercalemia em qualquer QRS largo inexplicado.',
      'Dê cálcio imediatamente se houver alargamento do QRS, sem esperar o laboratório.',
      'Siga com insulina e glicose, beta-agonista e remoção do potássio.',
    ],
    separando: [
      { de: 'T hiperaguda isquêmica', chave: 'Na isquemia a T é larga na base e regional; na hipercalemia é estreita e difusa.' },
      { de: 'Bloqueio de ramo verdadeiro', chave: 'O bloqueio tem morfologia típica e é estável; o da hipercalemia é bizarro e reverte com cálcio.' },
      { de: 'Síndrome de Brugada', chave: 'O padrão de pseudo-Brugada da hipercalemia desaparece com a correção do potássio.' },
      { de: 'Ritmo idioventricular', chave: 'Dose o potássio antes de assumir bradiarritmia primária.' },
    ],
    fixacao: [
      'Sequência: T apiculada → P some → QRS alarga → onda sinusoidal.',
      'Cálcio primeiro: estabiliza a membrana em minutos e ganha tempo.',
      'ECG normal NÃO exclui hipercalemia — dose o potássio.',
    ],
  },

  hypokalemia: {
    emUmaFrase:
      'O potássio baixo prolonga a repolarização: onda T achatada, infradesnivelamento do ST e, sobretudo, onda U proeminente que se funde à T e simula um QT gigante.',
    secoes: [
      {
        titulo: 'Por que aparece a onda U',
        texto:
          'A hipocalemia prolonga o potencial de acão e retarda a repolarização, especialmente das células M do miocárdio médio e das fibras de Purkinje. Essa repolarização tardia se manifesta no traçado como uma deflexão que sucede a onda T: a onda U. Normalmente ela existe e é pequena, mas na hipocalemia torna-se proeminente, podendo igualar ou superar a amplitude da T e fundir-se a ela. O resultado prático é a dificuldade de medir o QT — o que se mede acaba sendo o intervalo QU, que parece enormemente prolongado. Essa dispersão temporal da repolarização é exatamente o substrato que favorece pós-despolarizações precoces e torsades de pointes.',
      },
      {
        titulo: 'A progressão dos achados',
        texto:
          'Com potássio em torno de 3,0 mEq/L: achatamento da onda T e aparecimento de onda U. Abaixo disso: infradesnivelamento do ST, onda U progressivamente maior que a T, e prolongamento aparente do QT. Em valores muito baixos: extrassístoles atriais e ventriculares, taquicardia atrial, fibrilação atrial, taquicardia ventricular e torsades. Um agravante frequente é a associação com hipomagnesemia — as duas costumam andar juntas (perdas por diuréticos, diarreia, vômitos, alcoolismo, síndromes de realimentação) e a hipocalemia é refratária enquanto o magnésio não é reposto, porque o magnésio é cofator da bomba de sódio e potássio e regula os canais de potássio.',
      },
      {
        titulo: 'Contextos de alto risco',
        texto:
          'Dois cenários merecem atenção especial. O primeiro é o paciente em uso de digoxina: a hipocalemia aumenta a ligação da digoxina à bomba de sódio e potássio e potencializa sua toxicidade, podendo desencadear arritmias graves mesmo com digoxinemia dentro da faixa terapêutica. O segundo é o paciente com infarto agudo ou com QT já prolongado por fármacos: a hipocalemia soma-se ao substrato e aumenta substancialmente o risco de arritmia ventricular. Em ambos, a meta de potássio deve ser a faixa alta da normalidade, entre 4,0 e 4,5 mEq/L, e não apenas “dentro do normal”.',
      },
      {
        titulo: 'Reposição',
        texto:
          'A reposição oral é preferida quando possível. Na via intravenosa, a velocidade deve respeitar limites de segurança e a concentração depende do tipo de acesso — soluções mais concentradas exigem acesso central e monitorização. É essencial repor magnésio simultaneamente quando houver suspeita de depleção, corrigir a causa (diuréticos, perdas digestivas, hiperaldosteronismo, alcalose, insulina, beta-agonistas) e monitorizar o eletrocardiograma e o potássio seriadamente, sobretudo em pacientes com arritmias, insuficiência renal ou uso de digoxina. Nas arritmias ventriculares associadas a QT longo, o sulfato de magnésio é a terapia inicial, independentemente do nível sérico de magnésio.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda T', achado: 'Achatada, de baixa amplitude, podendo tornar-se invertida.' },
      { onda: 'Onda U', achado: 'Proeminente, frequentemente maior que a T, fundindo-se a ela — o achado mais característico.' },
      { onda: 'Segmento ST', achado: 'Infradesnivelamento difuso.' },
      { onda: 'Intervalo QT', achado: 'Aparentemente prolongado; na prática mede-se o QU pela fusão T–U.' },
      { onda: 'Ritmo', achado: 'Extrassístoles atriais e ventriculares, taquiarritmias e risco de torsades.' },
      { onda: 'Onda P', achado: 'Pode aumentar de amplitude e duração.' },
    ],
    roteiro: [
      'Procure ondas T achatadas e ondas U proeminentes, especialmente em V2–V3.',
      'Verifique se a U supera a T em amplitude.',
      'Avalie o intervalo QT com cuidado, ciente da fusão T–U.',
      'Procure extrassístoles e sinais de instabilidade elétrica.',
      'Reponha potássio E magnésio; revise diuréticos, perdas e uso de digoxina.',
    ],
    separando: [
      { de: 'QT longo por fármacos', chave: 'Na hipocalemia a onda U é o achado dominante; dose potássio e magnésio.' },
      { de: 'Isquemia subendocárdica', chave: 'Infra isquêmico é regional e dinâmico; o da hipocalemia é difuso e acompanha a onda U.' },
      { de: 'Efeito digitálico', chave: 'Infra em colher com QT curto; podem coexistir e a hipocalemia potencializa a toxicidade.' },
      { de: 'Onda U fisiológica', chave: 'Pequena, presente em bradicardia e atletas, sem alterações associadas.' },
    ],
    fixacao: [
      'Onda U grande é a assinatura da hipocalemia.',
      'Sem magnésio, o potássio não sobe: reponha os dois.',
      'Hipocalemia + digoxina = toxicidade mesmo com nível sérico terapêutico.',
    ],
  },

  hypercalcemia: {
    emUmaFrase:
      'O cálcio alto acelera a fase de platô do potencial de ação: o segmento ST encurta ou desaparece e a onda T parece nascer diretamente do QRS — QT curto.',
    secoes: [
      {
        titulo: 'A física do encurtamento',
        texto:
          'A fase 2 do potencial de ação — o platô — é sustentada pela entrada de cálcio pelos canais tipo L. Quando a concentração extracelular de cálcio aumenta, a inativação desses canais ocorre mais rapidamente e o platô encurta. Como o segmento ST corresponde exatamente ao platô, ele encurta ou desaparece, e a onda T parece emergir imediatamente após o QRS. O intervalo QT diminui, e o QTc pode cair abaixo de 350 ms. A onda T, em si, costuma manter morfologia e duração normais — o que muda é o tempo entre o fim do QRS e o início dela. Em hipercalcemias muito graves, pode surgir uma onda Osborn semelhante à da hipotermia, além de alentecimento da condução.',
      },
      {
        titulo: 'Correlação clínica',
        texto:
          'As causas mais comuns de hipercalcemia são o hiperparatireoidismo primário no ambiente ambulatorial e a malignidade no ambiente hospitalar — mieloma múltiplo, metástases ósseas, produção tumoral de peptídeo relacionado ao paratormônio. Outras causas incluem intoxicação por vitamina D, doenças granulomatosas como a sarcoidose, imobilização prolongada, uso de tiazídicos e de lítio. Clinicamente, manifesta-se por poliúria, polidipsia, desidratação, náuseas, constipação, dor abdominal, litíase renal, fraqueza muscular, confusão e, nos casos graves, coma. O ECG contribui como pista: um QT curto inexplicado deve sempre motivar dosagem de cálcio.',
      },
      {
        titulo: 'Tratamento e cuidados',
        texto:
          'A base do tratamento da hipercalcemia sintomática é a hidratação vigorosa com soro fisiológico, que restaura o volume e aumenta a excreção renal de cálcio; diuréticos de alça só têm papel após a reposição volêmica e em situações específicas. Bisfosfonatos intravenosos e calcitonina atuam sobre a reabsorção óssea, com tempos de início diferentes — a calcitonina age em horas, os bisfosfonatos em dias. Corticoide é útil nas hipercalcemias mediadas por vitamina D, e a diálise fica reservada aos casos graves com insuficiência renal. Uma cautela eletrofisiológica importante: pacientes hipercalcêmicos podem ter maior sensibilidade à digoxina, e o uso de cálcio intravenoso em digitalizados exige cuidado.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Encurtado ou virtualmente ausente — o achado central.' },
      { onda: 'Intervalo QT', achado: 'Curto, com QTc frequentemente abaixo de 350 ms.' },
      { onda: 'Onda T', achado: 'Morfologia e duração habitualmente normais, mas parece nascer logo após o QRS.' },
      { onda: 'Onda J', achado: 'Pode surgir onda de Osborn em hipercalcemias graves.' },
      { onda: 'Ritmo', achado: 'Bradicardia e distúrbios de condução podem ocorrer em casos graves.' },
    ],
    roteiro: [
      'Meça o QT e calcule o QTc: valores baixos chamam atenção.',
      'Observe se o segmento ST praticamente desapareceu.',
      'Confirme que a onda T tem morfologia preservada.',
      'Dose cálcio total, cálcio iônico e albumina.',
      'Investigue hiperparatireoidismo, malignidade e fármacos; hidrate se sintomático.',
    ],
    separando: [
      { de: 'Efeito digitálico', chave: 'Também encurta o QT, mas produz infra em colher; verifique uso de digoxina.' },
      { de: 'Hipercalemia inicial', chave: 'Também encurta o QT, porém com T apiculada de base estreita.' },
      { de: 'Síndrome do QT curto congênito', chave: 'QTc muito baixo persistente com história familiar e síncope ou arritmias.' },
    ],
    fixacao: [
      'QT curto com ST quase inexistente: dose o cálcio.',
      'Hidratação com soro fisiológico é a primeira medida da hipercalcemia sintomática.',
      'No hospital, hipercalcemia é malignidade até prova em contrário.',
    ],
  },

  hypocalcemia: {
    emUmaFrase:
      'O cálcio baixo prolonga o platô do potencial de ação: o segmento ST se alonga e o QT aumenta, mas a onda T mantém forma e duração normais.',
    secoes: [
      {
        titulo: 'Um QT longo com assinatura própria',
        texto:
          'Na hipocalcemia, a redução do cálcio extracelular prolonga a fase de platô e, portanto, o segmento ST. O intervalo QT aumenta às custas quase exclusivamente do segmento ST — a onda T permanece com largura e morfologia normais, apenas deslocada para a direita. Essa é a diferença essencial em relação ao QT longo de outras causas: na hipocalemia, o prolongamento se deve a onda U proeminente e alargamento da fase terminal; nos fármacos e nas canalopatias, a onda T costuma ser larga, entalhada ou de morfologia alterada. Reconhecer o padrão do ST longo com T normal permite suspeitar de hipocalcemia apenas olhando o traçado.',
      },
      {
        titulo: 'Causas e quadro clínico',
        texto:
          'Hipoparatireoidismo (pós-cirúrgico, sobretudo após tireoidectomia, é a causa clássica), deficiência de vitamina D, doença renal crônica, pancreatite aguda, sepse, transfusões maciças com citrato, rabdomiólise, síndrome da lise tumoral e hipomagnesemia — esta última funciona como causa e como fator de refratariedade, porque o magnésio é necessário para a secreção e a ação do paratormônio. Clinicamente, predomina a irritabilidade neuromuscular: parestesias periorais e em extremidades, cãibras, espasmo carpopedal, tetania, sinais de Chvostek e de Trousseau, laringoespasmo, convulsões e, no coração, prolongamento do QT com risco de arritmias e insuficiência cardíaca reversível em casos graves e prolongados.',
      },
      {
        titulo: 'Tratamento',
        texto:
          'Hipocalcemia sintomática ou grave exige cálcio intravenoso — gluconato de cálcio diluído, em infusão lenta e com monitorização eletrocardiográfica —, seguido de infusão contínua quando necessário. É indispensável corrigir simultaneamente o magnésio, sem o que a correção do cálcio não se sustenta. Nos casos crônicos, o tratamento envolve cálcio oral e vitamina D ativa (calcitriol), com monitorização periódica de cálcio, fósforo e função renal. Em pacientes digitalizados, o cálcio intravenoso deve ser administrado com cautela. E, como sempre, tratar a causa: repor vitamina D, ajustar o manejo da doença renal, acompanhar a função paratireoidiana no pós-operatório de cirurgia cervical.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Alongado — é ele que carrega o prolongamento do QT.' },
      { onda: 'Intervalo QT', achado: 'Prolongado, com QTc acima dos limites normais.' },
      { onda: 'Onda T', achado: 'Morfologia e duração NORMAIS — a chave para diferenciar de outras causas de QT longo.' },
      { onda: 'Onda U', achado: 'Habitualmente ausente ou discreta, ao contrário da hipocalemia.' },
      { onda: 'Ritmo', achado: 'Risco de arritmias ventriculares, embora torsades seja menos frequente que na hipocalemia.' },
    ],
    roteiro: [
      'Meça o QT e calcule o QTc.',
      'Verifique QUAL componente está alongado: o ST ou a onda T.',
      'ST longo com T normal aponta para hipocalcemia.',
      'Dose cálcio iônico, magnésio, fósforo e albumina.',
      'Reponha cálcio e magnésio; investigue hipoparatireoidismo e vitamina D.',
    ],
    separando: [
      { de: 'Hipocalemia', chave: 'Onda U proeminente e T achatada; o prolongamento é do QU.' },
      { de: 'QT longo por fármacos', chave: 'Onda T larga ou entalhada; revise a lista de medicações.' },
      { de: 'Síndrome do QT longo congênito', chave: 'História familiar, síncope com gatilhos típicos e T de morfologia anormal.' },
      { de: 'Hipotermia', chave: 'Onda J de Osborn com bradicardia e tremor muscular.' },
    ],
    fixacao: [
      'ST longo com T normal = hipocalcemia. U grande = hipocalemia.',
      'Sem magnésio, o cálcio não se corrige.',
      'Pós-tireoidectomia com parestesias periorais: dose cálcio imediatamente.',
    ],
  },

  digoxin: {
    emUmaFrase:
      'O efeito digitálico desenha um infradesnivelamento côncavo em colher de pedreiro com QT curto — presente em dose terapêutica e que não deve ser confundido com toxicidade nem com isquemia.',
    secoes: [
      {
        titulo: 'Efeito não é intoxicação',
        texto:
          'A digoxina inibe a bomba de sódio e potássio, aumentando o sódio intracelular e, por troca, o cálcio intracelular — daí seu efeito inotrópico positivo. Também aumenta o tônus vagal, o que lentifica a condução pelo nó AV. As alterações eletrocardiográficas decorrentes desse mecanismo são chamadas de efeito digitálico e estão presentes em pacientes adequadamente digitalizados: infradesnivelamento do ST com concavidade característica, comparada a uma colher de pedreiro ou ao bigode de Salvador Dalí; encurtamento do intervalo QT; achatamento, inversão ou aspecto bifásico da onda T; e aumento discreto da amplitude da onda U. Esses achados não indicam toxicidade e não se correlacionam com o nível sérico — a confusão entre efeito e intoxicação é um dos erros mais frequentes na leitura do traçado.',
      },
      {
        titulo: 'Como se manifesta a intoxicação',
        texto:
          'A toxicidade digitálica combina automatismo aumentado com bloqueio da condução — e essa dupla assinatura é o que a caracteriza. Os padrões clássicos são: extrassístoles ventriculares (a manifestação mais comum), bigeminismo, taquicardia atrial com bloqueio AV, ritmo juncional acelerado, bloqueios atrioventriculares de qualquer grau, fibrilação atrial com resposta ventricular lenta e regularizada (sinal de bloqueio AV completo com escape juncional), e a arritmia mais específica de todas, a taquicardia ventricular bidirecional, em que o eixo do QRS alterna a cada batimento. Fatores precipitantes: insuficiência renal, hipocalemia, hipomagnesemia, hipercalcemia, hipotireoidismo, idade avançada e interações medicamentosas (amiodarona, verapamil, quinidina, claritromicina, espironolactona).',
      },
      {
        titulo: 'Tratamento da intoxicação',
        texto:
          'Suspender a digoxina, monitorizar continuamente, corrigir potássio e magnésio — com atenção especial: na intoxicação aguda com hipercalemia, o cálcio intravenoso é tradicionalmente evitado pelo risco teórico de agravar a sobrecarga de cálcio intracelular. O antídoto específico é o fragmento Fab de anticorpo antidigoxina, indicado em arritmias ventriculares potencialmente letais, bradiarritmias instáveis, hipercalemia significativa na intoxicação aguda e níveis séricos muito elevados. Cardioversão elétrica deve ser evitada sempre que possível, pois pode desencadear arritmias ventriculares refratárias nesse contexto; quando indispensável, usa-se a menor energia possível. A diálise não remove digoxina de forma eficaz.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Infradesnivelamento côncavo em colher de pedreiro, tipicamente nas derivações laterais e inferiores.' },
      { onda: 'Intervalo QT', achado: 'Encurtado.' },
      { onda: 'Onda T', achado: 'Achatada, bifásica ou invertida, frequentemente fundida ao ST.' },
      { onda: 'Onda U', achado: 'Pode tornar-se mais evidente.' },
      { onda: 'Intervalo PR', achado: 'Prolongado pelo efeito vagal sobre o nó AV.' },
      { onda: 'Ritmo', achado: 'Na toxicidade: extrassístoles, taquicardia atrial com bloqueio, junção acelerada e TV bidirecional.' },
    ],
    roteiro: [
      'Reconheça o infra côncavo em colher e o QT curto: efeito, não toxicidade.',
      'Procure sinais de automatismo aumentado somado a bloqueio.',
      'Avalie a resposta ventricular na fibrilação atrial: lenta e regular é sinal de alarme.',
      'Dose digoxinemia, potássio, magnésio, cálcio e função renal.',
      'Suspenda o fármaco, corrija eletrólitos e considere anticorpo antidigoxina se houver arritmia grave.',
    ],
    separando: [
      { de: 'Isquemia subendocárdica', chave: 'Infra isquêmico é horizontal ou descendente e dinâmico; o digitálico é côncavo e estável.' },
      { de: 'Sobrecarga ventricular esquerda', chave: 'Alterações proporcionais à voltagem elevada, sem QT curto.' },
      { de: 'Hipocalemia', chave: 'Onda U proeminente com QT aparentemente longo; pode coexistir e agravar a toxicidade.' },
      { de: 'Hipercalcemia', chave: 'QT curto sem infradesnivelamento em colher.' },
    ],
    fixacao: [
      'Efeito digitálico não mede dose: colher de pedreiro com QT curto é esperado.',
      'Automatismo aumentado + bloqueio = intoxicação digitálica.',
      'Taquicardia ventricular bidirecional é quase patognomônica.',
    ],
  },

  hypothermia: {
    emUmaFrase:
      'A onda J de Osborn — um entalhe positivo na junção entre o QRS e o segmento ST — somada a bradicardia, tremor muscular e prolongamento de todos os intervalos.',
    secoes: [
      {
        titulo: 'A onda J e sua origem',
        texto:
          'Na hipotermia, a repolarização precoce do epicárdio ocorre de forma desigual em relação ao endocárdio, criando um gradiente transmural de voltagem no fim da despolarização. Esse gradiente aparece no traçado como uma deflexão positiva no ponto J — a onda de Osborn, também chamada onda J ou onda em camelo. Sua amplitude é inversamente proporcional à temperatura: quanto mais frio o paciente, maior a onda. É mais evidente nas derivações laterais e inferiores, especialmente em V4 a V6 e DII. Ela não é exclusiva da hipotermia — pode aparecer na hipercalcemia, na hemorragia subaracnóidea, na sepse e no padrão de repolarização precoce —, mas no contexto adequado é altamente sugestiva.',
      },
      {
        titulo: 'O restante do traçado',
        texto:
          'A hipotermia lentifica todos os processos elétricos: bradicardia sinusal progressiva (que evolui para ritmo juncional), prolongamento do PR, alargamento do QRS e aumento do QT. O tremor muscular do calafrio superpõe artefato de alta frequência ao traçado, o que às vezes dificulta a leitura e pode ser confundido com fibrilação atrial ou até com fibrilação ventricular. Arritmias são frequentes e seguem uma ordem previsível conforme a temperatura cai: abaixo de 32 °C, fibrilação atrial de resposta lenta é comum; abaixo de 28 °C, o miocárdio torna-se irritável e o risco de fibrilação ventricular aumenta muito — inclusive desencadeada por manipulação brusca do paciente, o que justifica a regra de mobilizar vítimas de hipotermia com extremo cuidado.',
      },
      {
        titulo: 'Princípios de manejo',
        texto:
          'O reaquecimento é o tratamento, e sua modalidade depende da gravidade: passivo externo nas formas leves; ativo externo e ativo interno (soros aquecidos, lavagem de cavidades, e circulação extracorpórea nas formas graves com instabilidade ou parada). Durante a reanimação de um paciente hipotérmico em parada, algumas regras específicas se aplicam: o miocárdio frio responde mal à desfibrilação e aos fármacos, e as diretrizes orientam limitar tentativas e adiar ou espaçar medicações abaixo de determinadas temperaturas, mantendo a reanimação até o reaquecimento. A máxima clínica consagrada — “ninguém está morto até estar quente e morto” — resume o fato de que há relatos de recuperação neurológica completa após períodos prolongados de parada em hipotermia profunda.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda J (Osborn)', achado: 'Entalhe positivo na junção QRS–ST, mais evidente em V4–V6 e DII; amplitude proporcional à gravidade.' },
      { onda: 'Ritmo', achado: 'Bradicardia sinusal progressiva, evoluindo para ritmo juncional; fibrilação atrial lenta é comum.' },
      { onda: 'Intervalos', achado: 'PR, QRS e QT todos prolongados.' },
      { onda: 'Linha de base', achado: 'Artefato de tremor muscular que pode simular fibrilação atrial ou ventricular.' },
      { onda: 'Risco', achado: 'Abaixo de 28 °C, alta irritabilidade ventricular com risco de fibrilação ventricular.' },
    ],
    roteiro: [
      'Procure o entalhe positivo no ponto J nas derivações laterais e inferiores.',
      'Meça a frequência e todos os intervalos: tudo tende a estar prolongado.',
      'Reconheça o artefato de tremor e não o confunda com arritmia.',
      'Meça a temperatura central com termômetro apropriado.',
      'Reaqueça conforme a gravidade e mobilize o paciente com extremo cuidado.',
    ],
    separando: [
      { de: 'Repolarização precoce', chave: 'Entalhe no ponto J sem bradicardia, sem prolongamento de intervalos e em paciente normotérmico.' },
      { de: 'Síndrome de Brugada', chave: 'Supra em cúpula restrito a V1–V2, sem bradicardia nem tremor.' },
      { de: 'Hipercalcemia', chave: 'Também pode gerar onda J, mas com QT curto e cálcio elevado.' },
      { de: 'Infarto com supradesnivelamento', chave: 'Supra regional com reciprocidade e evolução característica.' },
    ],
    fixacao: [
      'Onda J de Osborn: quanto mais alta, mais frio o paciente.',
      'Abaixo de 28 °C, manuseie com cuidado extremo — o coração é irritável.',
      '“Ninguém está morto até estar quente e morto.”',
    ],
  },
}

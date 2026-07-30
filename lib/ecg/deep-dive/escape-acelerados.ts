import type { DeepDiveMap } from './types'

/** Escape e ritmos acelerados — quando o comando muda de andar. */
export const DEEP_DIVE_ESCAPE: DeepDiveMap = {
  'junctional-escape': {
    emUmaFrase:
      'O nó sinusal falhou e a junção AV assumiu o comando na sua frequência natural de 40–60 bpm: QRS estreito, sem P na frente — ou com P retrógrada.',
    secoes: [
      {
        titulo: 'A hierarquia dos marca-passos',
        texto:
          'O coração é redundante por projeto. O nó sinusal dispara a 60–100 bpm, a junção AV a 40–60 bpm e a rede de His-Purkinje a 20–40 bpm. Quem tiver a frequência intrínseca mais alta comanda, e suprime os demais por overdrive. Quando o nó sinusal para, lentifica demais ou o impulso não chega à junção, as células juncionais deixam de ser suprimidas, atingem o limiar espontaneamente e assumem. O ritmo de escape juncional não é a doença — é o mecanismo de proteção que impede a assistolia. Esta é uma distinção clínica fundamental: nunca se suprime um escape. Tratar o escape significa tratar a causa da bradicardia que o gerou.',
      },
      {
        titulo: 'Por que o QRS é estreito e onde está a onda P',
        texto:
          'O foco fica acima da bifurcação do feixe de His, portanto o impulso desce pela via normal de condução e ativa os dois ventrículos simultaneamente: o QRS é estreito e idêntico ao sinusal do paciente. Simultaneamente, o impulso tenta subir pelo nó AV e despolarizar os átrios de baixo para cima — condução retrógrada. O vetor atrial fica invertido, e é por isso que a onda P, quando visível, é negativa em DII, DIII e aVF, e positiva em aVR. Sua posição depende da velocidade relativa das conduções anterógrada e retrógrada: se o átrio despolariza antes do ventrículo, a P aparece imediatamente antes do QRS com PR curto (menor que 120 ms); se ao mesmo tempo, a P fica escondida dentro do QRS e não é vista; se depois, aparece deformando o segmento ST ou a onda T. Nenhuma dessas três variantes muda o significado.',
      },
      {
        titulo: 'Contexto clínico e conduta',
        texto:
          'Escape juncional aparece na bradicardia sinusal acentuada, na parada sinusal, no bloqueio sinoatrial, no bloqueio AV de alto grau (com átrio e ventrículo dissociados), na intoxicação digitálica, na hipercalemia, no hipotireoidismo, no infarto inferior (isquemia do nó AV pela coronária direita) e após cirurgia cardíaca. A conduta é sempre em dois tempos: primeiro avaliar a estabilidade hemodinâmica — se houver hipotensão, síncope, angina ou congestão, seguir o algoritmo de bradicardia com atropina e marca-passo transcutâneo; segundo, procurar a causa — revisar fármacos bradicardizantes, dosar potássio, TSH e digoxinemia, e pesquisar isquemia. A perda da contribuição atrial ao enchimento ventricular (o chamado kick atrial, cerca de 20% do débito) explica por que alguns pacientes ficam sintomáticos mesmo com frequência aceitável.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, lento, com frequência entre 40 e 60 bpm — a faixa intrínseca da junção AV.' },
      { onda: 'Onda P', achado: 'Ausente, retrógrada (negativa em DII/DIII/aVF) ou dissociada do QRS.' },
      { onda: 'Intervalo PR', achado: 'Menor que 120 ms quando a P retrógrada precede o QRS; inexistente quando ela está oculta.' },
      { onda: 'QRS', achado: 'Estreito e idêntico ao QRS sinusal do paciente — a origem está acima da bifurcação do His.' },
      { onda: 'Onda T', achado: 'Normal, salvo alteração de causa associada (isquemia, hipercalemia).' },
    ],
    roteiro: [
      'Frequência entre 40 e 60 bpm com QRS estreito: pense em junção.',
      'Procure a onda P antes, dentro e depois do QRS.',
      'Se a P existir e for negativa em DII, é retrógrada — confirma origem juncional.',
      'Verifique se há dissociação AV (P sinusais marchando independentes).',
      'Avalie estabilidade hemodinâmica e busque a causa da falha sinusal.',
    ],
    separando: [
      { de: 'Bradicardia sinusal', chave: 'Na sinusal existe P positiva em DII antes de cada QRS.' },
      { de: 'Escape ventricular', chave: 'O escape ventricular tem QRS largo e frequência de 20–40 bpm.' },
      { de: 'BAV total', chave: 'No BAV total as P sinusais continuam marchando, dissociadas do escape; aqui pode não haver P alguma.' },
      { de: 'Ritmo juncional acelerado', chave: 'Acima de 60 bpm não é mais escape — é usurpação do comando por automatismo anormal.' },
    ],
    fixacao: [
      'Escape é herói, não vilão: nunca o suprima; trate a causa da bradicardia.',
      'QRS estreito e lento = junção. QRS largo e mais lento ainda = ventrículo.',
      'P negativa em DII significa despolarização atrial de baixo para cima.',
    ],
  },

  aivr: {
    emUmaFrase:
      'Ritmo ventricular largo entre 50 e 110 bpm — rápido demais para ser escape, lento demais para ser taquicardia ventricular: o marcador clássico de reperfusão.',
    secoes: [
      {
        titulo: 'O mecanismo: automatismo ventricular exaltado',
        texto:
          'No ritmo idioventricular acelerado (RIVA), um foco de Purkinje ou do miocárdio ventricular aumenta seu automatismo até superar a frequência sinusal. Não é reentrada, como na taquicardia ventricular clássica: é despolarização diastólica espontânea acelerada, frequentemente pela sopa metabólica da reperfusão — cálcio intracelular elevado, catecolaminas locais, estiramento e correntes de lesão em tecido recém-reperfundido. Por isso o RIVA aparece caracteristicamente nos primeiros minutos ou horas após trombólise bem-sucedida ou angioplastia primária, e é considerado um dos marcadores mais específicos de reperfusão coronariana. Como o foco tem frequência próxima à sinusal, os dois ritmos competem: são comuns batimentos de fusão no início e no fim do episódio, com morfologia intermediária, e o ritmo tende a começar e terminar de modo gradual.',
      },
      {
        titulo: 'Como se apresenta no traçado',
        texto:
          'QRS largo (acima de 120 ms) e monomórfico, frequência entre 50 e 110 bpm — o critério que define a faixa —, ritmo regular ou levemente irregular, onda T discordante do QRS. As ondas P, quando visíveis, marcham independentes: há dissociação AV, porque o átrio segue no comando sinusal enquanto o ventrículo obedece ao foco. Encontrar batimentos de captura (um QRS estreito no meio dos largos, quando um impulso sinusal consegue passar) ou de fusão é altamente sugestivo de origem ventricular e ajuda a confirmar o diagnóstico. A duração dos episódios costuma ser curta, de alguns segundos a poucos minutos, alternando com o ritmo sinusal.',
      },
      {
        titulo: 'Por que geralmente não se trata',
        texto:
          'A frequência é próxima da fisiológica e o débito cardíaco costuma ser preservado, ainda que sem a contribuição atrial. Além disso, o ritmo é autolimitado. Suprimi-lo com antiarrítmico pode ser perigoso: se o RIVA estiver funcionando como ritmo de escape num paciente com nó sinusal deprimido, aboli-lo produz assistolia. A conduta padrão é observar e monitorizar. Se o paciente tiver sintomas atribuíveis à perda da sincronia AV, a estratégia correta é acelerar o ritmo sinusal para que ele retome o comando por overdrive — atropina ou estimulação atrial —, e não suprimir o foco ventricular. Em outros contextos (miocardite, intoxicação digitálica, distúrbios eletrolíticos, cardiopatia estrutural, uso de cocaína), o RIVA perde o valor de marcador de reperfusão e exige investigação da causa de base.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com QRS largo, entre 50 e 110 bpm — a faixa é o critério diagnóstico.' },
      { onda: 'Onda P', achado: 'Dissociada quando visível: as P sinusais marcham independentes dos QRS ventriculares.' },
      { onda: 'QRS', achado: 'Largo, monomórfico, aspecto de extrassístole ventricular repetida em série.' },
      { onda: 'Batimentos de fusão', achado: 'Comuns no início e no fim do episódio, com morfologia intermediária — assinatura da competição de ritmos.' },
      { onda: 'Onda T', achado: 'Discordante do QRS; alterações isquêmicas de base podem coexistir.' },
    ],
    roteiro: [
      'Identifique o ritmo de QRS largo.',
      'Meça a frequência: entre 50 e 110 bpm afasta escape (mais lento) e TV (mais rápido).',
      'Procure dissociação AV, fusões e capturas.',
      'Contextualize: houve trombólise ou angioplastia nas últimas horas?',
      'Observe e monitorize; evite antiarrítmico.',
    ],
    separando: [
      { de: 'Taquicardia ventricular', chave: 'A TV tem frequência acima de 100–120 bpm e costuma passar de 130; o RIVA fica abaixo de 110.' },
      { de: 'Escape ventricular', chave: 'O escape é mais lento (20–40 bpm) e surge por falência dos marca-passos superiores.' },
      { de: 'Ritmo de marca-passo', chave: 'No ritmo estimulado há espícula precedendo cada QRS largo.' },
    ],
    fixacao: [
      'RIVA após reperfusão = boa notícia. Observe, não trate.',
      'Faixa mágica: 50 a 110 bpm com QRS largo.',
      'Se precisar tratar, acelere o sinusal — não suprima o ventrículo.',
    ],
  },

  'ventricular-escape': {
    emUmaFrase:
      'O último marca-passo disponível: um foco no His-Purkinje distal ou no miocárdio ventricular batendo a 20–40 bpm, com QRS largo — a linha entre a vida e a assistolia.',
    secoes: [
      {
        titulo: 'Quando o coração chega ao último recurso',
        texto:
          'O ritmo idioventricular puro (escape ventricular) surge quando falham tanto o nó sinusal quanto a junção AV, ou quando o impulso supraventricular não consegue alcançar os ventrículos — bloqueio AV total com bloqueio simultâneo do escape juncional, parada sinusal com junção deprimida, hipercalemia grave, intoxicação por betabloqueador ou bloqueador de canal de cálcio, hipóxia profunda e as fases finais da parada cardíaca. A frequência de 20 a 40 bpm quase nunca sustenta perfusão cerebral adequada: o paciente costuma estar hipotenso, confuso, em pré-síncope ou já inconsciente. É um ritmo de emergência por definição.',
      },
      {
        titulo: 'O desenho no papel',
        texto:
          'QRS largo, geralmente acima de 140 ms, morfologia bizarra e onda T discordante, exatamente como uma extrassístole ventricular — mas repetida de forma regular e lenta, e sempre TARDIA, nunca precoce. A distinção temporal é o que separa escape de extrassístole: o escape aparece depois de uma pausa, como resgate; a extrassístole se antecipa ao próximo batimento esperado. Ondas P, se presentes, estão dissociadas (no BAV total) ou ausentes (na parada sinusal). Um ritmo idioventricular que se alarga progressivamente, com frequência caindo e ondas T apiculadas, sugere fortemente hipercalemia grave — situação em que gluconato de cálcio intravenoso pode reverter dramaticamente o traçado.',
      },
      {
        titulo: 'Conduta imediata',
        texto:
          'Trata-se de bradicardia instável até prova em contrário: oxigênio, acesso venoso, monitorização, atropina (que costuma ser pouco eficaz quando o bloqueio é infra-hissiano), marca-passo transcutâneo com sedação e analgesia, e infusão de epinefrina ou dopamina como ponte até o marca-passo transvenoso. Paralelamente, corrigir o corrigível: potássio, isquemia aguda (o infarto anterior extenso que causa BAV com escape ventricular é de altíssima mortalidade), intoxicação por fármacos (glucagon e insulina em altas doses conforme o agente), hipóxia e hipotermia. Nunca administrar antiarrítmicos — lidocaína ou amiodarona podem abolir o único marca-passo que ainda funciona e produzir assistolia.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular e muito lento: 20–40 bpm.' },
      { onda: 'Onda P', achado: 'Ausente ou dissociada, marchando em frequência própria sem relação com os QRS.' },
      { onda: 'QRS', achado: 'Muito largo (frequentemente acima de 140 ms) e de morfologia bizarra.' },
      { onda: 'Onda T', achado: 'Ampla e oposta ao QRS; apiculada e simétrica levanta a suspeita de hipercalemia.' },
      { onda: 'Tempo', achado: 'Batimento sempre tardio, surgindo após pausa — é o que o define como escape.' },
    ],
    roteiro: [
      'Frequência abaixo de 40 bpm com QRS largo: pense em escape ventricular.',
      'Confirme que os batimentos são tardios, não precoces.',
      'Procure P dissociadas para identificar BAV total associado.',
      'Avalie perfusão imediatamente — quase sempre instável.',
      'Marca-passo transcutâneo e correção de potássio, isquemia e drogas.',
    ],
    separando: [
      { de: 'RIVA', chave: 'O RIVA bate entre 50 e 110 bpm e é bem tolerado; o escape puro fica em 20–40 bpm e é instável.' },
      { de: 'Escape juncional', chave: 'O juncional tem QRS estreito e frequência de 40–60 bpm.' },
      { de: 'Extrassístoles ventriculares em série', chave: 'Extrassístole é precoce; escape é tardio — meça a relação com o batimento anterior.' },
    ],
    fixacao: [
      'Escape ventricular é o último degrau antes da assistolia: nunca suprima.',
      'QRS que se alarga com T apiculada e bradicardia = hipercalemia até prova em contrário.',
      'Precoce = extrassístole; tardio = escape. Essa única regra evita erros graves.',
    ],
  },

  'ectopic-atrial-rhythm': {
    emUmaFrase:
      'O comando continua no átrio, mas não no nó sinusal: onda P de morfologia diferente — muitas vezes negativa em DII — precedendo QRS estreitos em frequência normal ou baixa.',
    secoes: [
      {
        titulo: 'Onde nasce e por quê',
        texto:
          'Um foco atrial fora do nó sinusal assume o ritmo, seja porque tem automatismo aumentado, seja porque o nó sinusal está deprimido e deixa de suprimi-lo. Os locais mais comuns são a porção inferior do átrio direito (próximo ao seio coronário), o átrio esquerdo e as veias pulmonares. Como o sítio de origem muda, muda o vetor de despolarização atrial e, portanto, a forma da onda P. Foco atrial baixo produz P negativa em DII, DIII e aVF com PR frequentemente curto — o clássico ritmo atrial baixo. Foco no átrio esquerdo pode gerar P negativa em DI e aVL, ou o padrão “dome and dart” em V1. Em jovens e atletas com tônus vagal elevado, o achado é comum, alterna com ritmo sinusal e não tem qualquer significado patológico.',
      },
      {
        titulo: 'Diferenciar do ritmo juncional',
        texto:
          'Os dois podem ter P negativa em DII. A chave está no intervalo PR e na frequência. No ritmo atrial ectópico, o impulso ainda precisa atravessar o nó AV inteiro, então o PR é maior ou igual a 120 ms; no juncional, a origem já está na junção e a condução retrógrada para o átrio é rápida, produzindo PR menor que 120 ms — ou P ausente ou pós-QRS. A frequência também ajuda: o ritmo atrial ectópico pode assumir qualquer frequência entre 60 e 100 bpm, enquanto o escape juncional é caracteristicamente de 40 a 60. Quando o mesmo traçado mostra três ou mais morfologias diferentes de P com PR variáveis em frequência normal, o diagnóstico muda para marca-passo atrial migratório — e, se a frequência ultrapassa 100 bpm, para taquicardia atrial multifocal.',
      },
      {
        titulo: 'Significado e conduta',
        texto:
          'Isolado e assintomático, em coração normal, não requer tratamento nem investigação extensa. Deve-se atentar quando aparece em contexto de doença pulmonar crônica, distúrbio eletrolítico, intoxicação digitálica, cardiopatia estrutural ou pós-operatório de cirurgia cardíaca, situações em que costuma preceder outras arritmias atriais. O maior valor prático de identificá-lo é evitar dois erros: chamar de ritmo sinusal (perdendo a informação de que o átrio está anormal) e chamar de ritmo juncional (mudando desnecessariamente a linha de raciocínio para bradiarritmia por doença do nó AV).',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com frequência habitualmente entre 50 e 100 bpm.' },
      { onda: 'Onda P', achado: 'Presente antes de cada QRS, mas com morfologia diferente da sinusal — frequentemente negativa em DII/DIII/aVF.' },
      { onda: 'Intervalo PR', achado: 'Igual ou maior que 120 ms — é o que o separa do ritmo juncional.' },
      { onda: 'QRS', achado: 'Estreito e normal, pois a condução distal ao nó AV está preservada.' },
      { onda: 'Onda T', achado: 'Normal, salvo alterações de causas associadas.' },
    ],
    roteiro: [
      'Confirme que há P antes de cada QRS.',
      'Compare a morfologia da P com o padrão sinusal esperado — está diferente?',
      'Meça o PR: maior ou igual a 120 ms mantém o diagnóstico atrial.',
      'Verifique se a P é negativa em DII (foco atrial baixo).',
      'Conte quantas morfologias de P existem: três ou mais mudam o diagnóstico.',
    ],
    separando: [
      { de: 'Ritmo sinusal', chave: 'A P sinusal é obrigatoriamente positiva em DII e negativa em aVR.' },
      { de: 'Ritmo juncional', chave: 'PR menor que 120 ms, ou P ausente/pós-QRS, e frequência de 40–60 bpm.' },
      { de: 'Marca-passo atrial migratório', chave: 'Três ou mais morfologias de P com PR variável no mesmo traçado.' },
    ],
    fixacao: [
      'P diferente com PR normal = átrio ectópico. P diferente com PR curto = junção.',
      'P negativa em DII significa ativação atrial de baixo para cima.',
      'Em jovem assintomático, é achado sem doença — apenas descreva corretamente.',
    ],
  },

  'accelerated-junctional': {
    emUmaFrase:
      'A junção AV não está resgatando ninguém: ela acelerou acima da sua faixa normal (60–100 bpm) e roubou o comando do nó sinusal.',
    secoes: [
      {
        titulo: 'Escape versus usurpação',
        texto:
          'A junção AV tem automatismo intrínseco de 40 a 60 bpm. Quando algo exalta esse automatismo e ela passa a disparar entre 60 e 100 bpm, deixa de ser escape passivo e passa a ser ritmo juncional acelerado — chamado também de taquicardia juncional não paroxística. A frequência não é impressionante, mas a origem é anormal: o marca-passo natural foi superado sem que houvesse falha. As causas clássicas são intoxicação digitálica (mecanismo de automatismo deflagrado por sobrecarga de cálcio), infarto agudo inferior (isquemia da região nodal), miocardite, febre reumática aguda, pós-operatório de cirurgia cardíaca (especialmente correção de cardiopatias congênitas), hipercalemia e uso de teofilina ou catecolaminas.',
      },
      {
        titulo: 'O traçado e a dissociação isorrítmica',
        texto:
          'O QRS é estreito, porque a origem é supra-hissiana; o ritmo é regular; a frequência fica entre 60 e 100 bpm. As ondas P podem estar ausentes, retrógradas (negativas em DII, antes ou depois do QRS) ou dissociadas do QRS. Um fenômeno frequente e didático é a dissociação isorrítmica: a frequência juncional e a sinusal são tão próximas que as ondas P parecem “deslizar” lentamente para dentro e para fora do QRS ao longo do traçado, sem que haja bloqueio AV. Reconhecer isso evita o diagnóstico equivocado de BAV total — no bloqueio, a frequência atrial é claramente maior que a ventricular e não há qualquer condução; na dissociação isorrítmica, as frequências são semelhantes e a condução pode voltar a acontecer assim que o sinusal acelerar.',
      },
      {
        titulo: 'Conduta orientada pela causa',
        texto:
          'O ritmo em si raramente causa instabilidade — a frequência está na faixa normal. O que importa é o que ele denuncia. Diante desse achado, a primeira pergunta é sobre digoxina: dosar nível sérico, avaliar função renal e potássio, e considerar anticorpo antidigoxina se houver toxicidade grave, sobretudo quando associada a arritmias ventriculares ou bloqueio. A segunda é sobre isquemia inferior aguda. A terceira, sobre o pós-operatório recente. Corrigida a causa, o ritmo desaparece. Cardioversão elétrica não tem papel — não é uma arritmia reentrante — e pode ser perigosa na intoxicação digitálica.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com frequência entre 60 e 100 bpm — acima da faixa de escape juncional.' },
      { onda: 'Onda P', achado: 'Ausente, retrógrada (negativa em DII) ou dissociada, deslizando ao longo do traçado.' },
      { onda: 'Intervalo PR', achado: 'Curto quando a P retrógrada precede o QRS; ausente quando ela está oculta ou dissociada.' },
      { onda: 'QRS', achado: 'Estreito, idêntico ao basal do paciente.' },
      { onda: 'Início e fim', achado: 'Graduais (aquecimento e desaquecimento), diferentemente das taquicardias por reentrada.' },
    ],
    roteiro: [
      'Ritmo regular, QRS estreito, frequência entre 60 e 100 bpm.',
      'Procure a onda P: ausente, retrógrada ou dissociada?',
      'Verifique se a frequência ventricular supera a atrial (usurpação).',
      'Pergunte imediatamente sobre digoxina e sobre infarto inferior recente.',
      'Confirme início gradual, o que afasta arritmia paroxística por reentrada.',
    ],
    separando: [
      { de: 'Escape juncional', chave: 'Escape é passivo e fica entre 40 e 60 bpm; aqui a junção acelerou e assumiu.' },
      { de: 'BAV total', chave: 'No BAV a frequência atrial é maior que a ventricular; na dissociação isorrítmica elas são semelhantes.' },
      { de: 'AVNRT', chave: 'A AVNRT é paroxística, começa e termina de repente e bate acima de 150 bpm.' },
      { de: 'Ritmo sinusal', chave: 'Falta a P sinusal positiva em DII precedendo cada QRS com PR normal.' },
    ],
    fixacao: [
      'Ritmo juncional acelerado + digoxina = intoxicação digitálica até prova em contrário.',
      'Junção acima de 60 bpm não é escape, é usurpação.',
      'Dissociação isorrítmica não é bloqueio: as frequências apenas se cruzaram.',
    ],
  },
}

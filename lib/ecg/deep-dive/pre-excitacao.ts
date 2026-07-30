import type { DeepDiveMap } from './types'

/** Pré-excitação — vias acessórias e as taquicardias que elas produzem. */
export const DEEP_DIVE_PRE_EXCITACAO: DeepDiveMap = {
  wpw: {
    emUmaFrase:
      'Uma ponte muscular congênita liga átrio e ventrículo por fora do nó AV: PR curto, onda delta empastando o início do QRS e alterações secundárias da repolarização.',
    secoes: [
      {
        titulo: 'A via acessória',
        texto:
          'Durante o desenvolvimento embrionário, o esqueleto fibroso dos anéis atrioventriculares deve isolar eletricamente átrios e ventrículos, deixando o nó AV como única passagem. Quando um feixe muscular remanescente atravessa esse isolamento — o feixe de Kent —, existe um segundo caminho, capaz de conduzir rapidamente e sem o atraso fisiológico do nó AV. Em ritmo sinusal, o impulso desce simultaneamente pelas duas vias: a acessória chega primeiro e começa a despolarizar uma parte do ventrículo diretamente pelo músculo, de forma lenta; enquanto isso, o impulso que desceu pelo nó AV emerge pelo His-Purkinje e despolariza o resto do ventrículo rapidamente. O QRS resultante é uma fusão desses dois modos de ativação — e cada um dos três achados clássicos decorre diretamente disso.',
      },
      {
        titulo: 'Os três achados e sua origem',
        texto:
          'PR curto, abaixo de 120 ms: o impulso não esperou o atraso do nó AV, pois parte dele já passou pela via acessória. Onda delta: o empastamento inicial do QRS corresponde à despolarização muscular lenta da região pré-excitada, antes que o sistema His-Purkinje assuma. QRS alargado: não por bloqueio de ramo, mas porque o complexo começa mais cedo — o intervalo do início da P ao fim do QRS permanece essencialmente normal, um detalhe elegante que ajuda a entender o fenômeno. Somam-se alterações secundárias de repolarização, com ST e T frequentemente opostos à onda delta, que podem simular isquemia ou infarto prévio. Ondas delta negativas em derivações inferiores, por exemplo, imitam ondas Q de infarto inferior — uma armadilha clássica.',
      },
      {
        titulo: 'Padrão versus síndrome',
        texto:
          'A distinção terminológica é clinicamente relevante. Padrão de Wolff-Parkinson-White é o achado eletrocardiográfico em paciente assintomático. Síndrome de Wolff-Parkinson-White é o achado eletrocardiográfico associado a taquiarritmias documentadas. A maioria dos portadores do padrão permanece assintomática, e o risco de morte súbita é baixo, embora não nulo — algo em torno de 0,1% ao ano. O mecanismo temido é a fibrilação atrial conduzida pela via acessória: se a via tiver período refratário curto, ela pode transmitir centenas de impulsos por minuto diretamente ao ventrículo, degenerando em fibrilação ventricular. Marcadores de baixo risco incluem o desaparecimento abrupto da pré-excitação durante exercício (indicando via com período refratário longo) e a pré-excitação intermitente no Holter.',
      },
      {
        titulo: 'A regra terapêutica que precisa ser decorada',
        texto:
          'Em fibrilação atrial pré-excitada — traçado irregular, muito rápido (frequentemente acima de 200 bpm) e com QRS de larguras variáveis —, é proibido usar bloqueadores do nó AV: adenosina, verapamil, diltiazem, betabloqueadores e digoxina. Ao bloquear a única via que ainda “filtrava” impulsos, eles favorecem a condução exclusiva pela via acessória e podem precipitar fibrilação ventricular. O tratamento correto é cardioversão elétrica sincronizada se houver instabilidade, e procainamida (ou ibutilida) se estável. No longo prazo, a ablação por cateter da via acessória é curativa, com taxas de sucesso superiores a 95%, e está indicada em pacientes sintomáticos e em portadores assintomáticos com profissões de risco ou marcadores de via de alto risco.',
      },
    ],
    ondaAOnda: [
      { onda: 'Intervalo PR', achado: 'Menor que 120 ms — o impulso pulou o atraso nodal.' },
      { onda: 'Onda delta', achado: 'Empastamento lento no início do QRS, representando a despolarização muscular direta.' },
      { onda: 'QRS', achado: 'Maior que 120 ms por começar mais cedo, e não por bloqueio de ramo.' },
      { onda: 'ST e T', achado: 'Alterações secundárias, frequentemente opostas à onda delta — podem simular isquemia.' },
      { onda: 'Ondas Q falsas', achado: 'Delta negativa em derivações inferiores ou laterais imita infarto antigo.' },
    ],
    roteiro: [
      'Meça o PR: menor que 120 ms.',
      'Olhe o início do QRS procurando o empastamento da onda delta.',
      'Confirme o alargamento do QRS.',
      'Interprete ST e T como secundários e evite diagnosticar isquemia por eles.',
      'Pergunte sobre palpitações: padrão assintomático e síndrome sintomática têm condutas diferentes.',
    ],
    separando: [
      { de: 'Bloqueio de ramo', chave: 'No bloqueio o PR é normal e não há onda delta.' },
      { de: 'Infarto prévio', chave: 'A pseudo-onda Q é, na verdade, delta negativa; o PR curto denuncia.' },
      { de: 'Hipertrofia ventricular', chave: 'Voltagem alta sem PR curto nem empastamento inicial.' },
      { de: 'Padrão tipo LGL', chave: 'PR curto SEM onda delta e com QRS estreito.' },
    ],
    fixacao: [
      'PR curto + delta + QRS largo = pré-excitação.',
      'FA pré-excitada: nada de adenosina, verapamil, diltiazem, betabloqueador ou digoxina.',
      'Ablação da via acessória cura mais de 95% dos casos.',
    ],
  },

  'avrt-orthodromic': {
    emUmaFrase:
      'Taquicardia por reentrada que desce pelo nó AV e sobe pela via acessória: QRS estreito, regular, 150–250 bpm, com onda P retrógrada visível depois do QRS.',
    secoes: [
      {
        titulo: 'O circuito ortodrômico',
        texto:
          'Ortodrômico significa “no sentido correto”: o impulso desce pelo caminho fisiológico (nó AV e His-Purkinje), ativa os ventrículos de modo normal e depois sobe de volta ao átrio pela via acessória, fechando o circuito. Como a despolarização ventricular usa o sistema especializado, o QRS é ESTREITO — e é por isso que a AVRT ortodrômica se apresenta como uma taquicardia supraventricular comum, indistinguível à primeira vista da AVNRT. Ela responde por cerca de 90% das taquicardias reentrantes associadas a vias acessórias. Um detalhe importante: durante a taquicardia ortodrômica, não há onda delta, pois a via acessória está sendo usada apenas no sentido retrógrado. A pré-excitação só aparece no traçado em ritmo sinusal — e pode nem existir, no caso das vias ocultas, que conduzem exclusivamente de baixo para cima.',
      },
      {
        titulo: 'Como diferenciar da AVNRT no traçado',
        texto:
          'A pista está na localização da onda P retrógrada. Na AVNRT típica, átrio e ventrículo despolarizam quase simultaneamente e a P fica escondida dentro do QRS, aparecendo no máximo como pseudo-r′ em V1 ou pseudo-S em DII. Na AVRT ortodrômica, o impulso precisa percorrer o ventrículo, alcançar a via acessória e subir — o que leva mais tempo. A P retrógrada aparece depois do QRS, tipicamente no segmento ST, com intervalo RP maior que 70 ms, ainda que menor que o intervalo PR. Outro achado sugestivo é a alternância elétrica do QRS durante a taquicardia, mais comum na AVRT. E há um sinal quase patognomônico: se a taquicardia mudar de frequência quando surge um bloqueio de ramo, isso indica que aquele ramo faz parte do circuito, o que só é possível na AVRT com via acessória do mesmo lado.',
      },
      {
        titulo: 'Tratamento agudo e definitivo',
        texto:
          'Como o nó AV é parte obrigatória do circuito, bloqueá-lo interrompe a arritmia: manobra vagal (Valsalva modificada) e, se necessário, adenosina 6 mg em bolus rápido, seguida de 12 mg. Verapamil, diltiazem e betabloqueadores também funcionam. Instabilidade hemodinâmica indica cardioversão sincronizada. A ressalva de segurança permanece: se o ritmo for irregular e de QRS largo, a hipótese muda para fibrilação atrial pré-excitada, e os bloqueadores do nó AV passam a ser contraindicados. Para prevenção de recorrências, a ablação por cateter da via acessória é o tratamento definitivo, com alta taxa de sucesso e baixa taxa de complicações, e é hoje preferida ao tratamento farmacológico crônico na maioria dos pacientes sintomáticos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com início e término abruptos.' },
      { onda: 'Frequência', achado: 'Entre 150 e 250 bpm.' },
      { onda: 'QRS', achado: 'Estreito — a ativação ventricular usa o sistema His-Purkinje normalmente.' },
      { onda: 'Onda P retrógrada', achado: 'Visível após o QRS, no segmento ST, com RP maior que 70 ms e menor que o PR.' },
      { onda: 'Onda delta', achado: 'Ausente durante a taquicardia; procure-a no ECG em ritmo sinusal.' },
      { onda: 'Alternância', achado: 'Variação cíclica da amplitude do QRS é sugestiva de AVRT.' },
    ],
    roteiro: [
      'Taquicardia regular de QRS estreito entre 150 e 250 bpm.',
      'Procure a P retrógrada dentro do segmento ST.',
      'Meça o RP: maior que 70 ms favorece AVRT sobre AVNRT.',
      'Procure alternância elétrica do QRS.',
      'Manobra vagal e adenosina; depois, busque pré-excitação no ECG basal e considere ablação.',
    ],
    separando: [
      { de: 'AVNRT', chave: 'Na AVNRT a P está dentro do QRS (pseudo-r′ em V1); na AVRT ela aparece depois, no ST.' },
      { de: 'Taquicardia atrial', chave: 'Persiste apesar de bloqueio AV e não termina com adenosina.' },
      { de: 'Flutter 2:1', chave: 'Frequência travada em 150 bpm com serrote revelado pela adenosina.' },
      { de: 'AVRT antidrômica', chave: 'QRS LARGO, porque o impulso desce pela via acessória.' },
    ],
    fixacao: [
      'Ortodrômica = desce pelo nó, sobe pela via = QRS estreito.',
      'P retrógrada no segmento ST com RP acima de 70 ms aponta AVRT.',
      'Ablação da via é curativa; procure a pré-excitação no traçado em ritmo sinusal.',
    ],
  },

  'wpw-type-a': {
    emUmaFrase:
      'Pré-excitação com onda delta positiva e R dominante em V1: a via acessória está do lado esquerdo, e o traçado imita bloqueio de ramo direito ou infarto posterior.',
    secoes: [
      {
        titulo: 'Por que V1 fica positivo',
        texto:
          'Na classificação clássica, o tipo A corresponde às vias acessórias do lado esquerdo — parede livre do ventrículo esquerdo ou região posterosseptal esquerda. Como a região pré-excitada fica posterior e à esquerda, o vetor inicial de despolarização aponta para a frente e para a direita, na direção de V1. Isso produz onda delta positiva e complexo predominantemente positivo em V1 e V2, com onda R dominante. O padrão resultante lembra bloqueio de ramo direito, e a combinação de R alta em V1 com onda delta pode ser confundida com infarto posterior antigo, hipertrofia ventricular direita ou até com a própria progressão de R anormal.',
      },
      {
        titulo: 'A utilidade e os limites da localização pelo ECG',
        texto:
          'A polaridade da onda delta nas 12 derivações permite estimar a localização da via acessória com acurácia razoável, e existem vários algoritmos para isso (Arruda, Milstein, entre outros). Delta positiva em V1 aponta para o lado esquerdo; delta negativa em V1 aponta para o lado direito; a polaridade nas derivações inferiores separa vias posteriores (delta negativa nas inferiores) das anteriores. Essa estimativa é útil para planejar o procedimento de ablação — por exemplo, antecipando a necessidade de acesso transeptal ou retroaórtico para vias esquerdas. Seus limites, porém, são reais: pré-excitação parcial, múltiplas vias acessórias e variações anatômicas reduzem a precisão, e o mapeamento eletrofisiológico continua sendo o padrão definitivo.',
      },
      {
        titulo: 'O que muda na prática',
        texto:
          'A conduta é a mesma da pré-excitação em geral: identificar se há sintomas, estratificar risco e considerar ablação. O ponto mais importante do tipo A é evitar erros de interpretação — não diagnosticar bloqueio de ramo direito, infarto posterior ou hipertrofia ventricular direita em um traçado que apenas mostra pré-excitação esquerda. A âncora é sempre a mesma: PR curto e empastamento inicial do QRS. Encontrando os dois, todo o restante do traçado deve ser interpretado à luz da pré-excitação, incluindo as alterações de ST e T, que são secundárias.',
      },
    ],
    ondaAOnda: [
      { onda: 'Intervalo PR', achado: 'Menor que 120 ms.' },
      { onda: 'Onda delta', achado: 'Positiva em V1 — assinatura da via acessória esquerda.' },
      { onda: 'V1 e V2', achado: 'Complexo predominantemente positivo, com R dominante, simulando bloqueio de ramo direito.' },
      { onda: 'QRS', achado: 'Alargado pelo início precoce da despolarização.' },
      { onda: 'ST e T', achado: 'Alterações secundárias, tipicamente opostas à onda delta.' },
    ],
    roteiro: [
      'Confirme PR curto e onda delta.',
      'Olhe V1: delta positiva e R dominante indicam via esquerda.',
      'Verifique a polaridade da delta nas inferiores para refinar a localização.',
      'Evite diagnosticar BRD, infarto posterior ou HVD nesse contexto.',
      'Estratifique sintomas e encaminhe para avaliação de ablação quando indicado.',
    ],
    separando: [
      { de: 'Bloqueio de ramo direito', chave: 'PR normal, ausência de delta e padrão rSR′ com S larga em V6.' },
      { de: 'Infarto posterior', chave: 'R alta em V1 sem PR curto nem empastamento inicial; procure imagem em espelho em V7–V9.' },
      { de: 'WPW tipo B', chave: 'Delta negativa e complexo negativo em V1 — via do lado direito.' },
      { de: 'Hipertrofia de VD', chave: 'Desvio do eixo à direita e sinais de sobrecarga, sem delta.' },
    ],
    fixacao: [
      'Tipo A = V1 positivo = via esquerda.',
      'PR curto com delta reinterpreta todo o resto do traçado.',
      'Nunca chame de infarto posterior sem antes excluir pré-excitação.',
    ],
  },

  'wpw-type-b': {
    emUmaFrase:
      'Pré-excitação com onda delta negativa e complexo predominantemente negativo em V1: via acessória do lado direito, com traçado que imita bloqueio de ramo esquerdo.',
    secoes: [
      {
        titulo: 'Por que V1 fica negativo',
        texto:
          'No tipo B, a via acessória localiza-se no lado direito — parede livre do ventrículo direito ou região anterosseptal direita. A pré-excitação começa, portanto, no ventrículo direito, e o vetor inicial aponta para a esquerda e para trás, afastando-se de V1. O resultado é onda delta negativa e complexo predominantemente negativo em V1 e V2, com padrão que lembra bloqueio de ramo esquerdo. Como no tipo A, o erro a evitar é interpretar o traçado como bloqueio de ramo verdadeiro, o que levaria a conclusões equivocadas sobre cardiopatia estrutural e sobre a interpretabilidade da repolarização.',
      },
      {
        titulo: 'Associações clínicas importantes',
        texto:
          'Vias acessórias do lado direito têm associação particular com a anomalia de Ebstein, malformação em que a valva tricúspide é deslocada para o interior do ventrículo direito. Nesses pacientes, vias acessórias direitas são frequentes e podem ser múltiplas, o que complica tanto o diagnóstico eletrocardiográfico quanto a ablação. A presença de pré-excitação com padrão tipo B, sobretudo em paciente jovem com cardiomegalia, bloqueio de ramo direito de base ou sinais de sobrecarga atrial direita importante, deve motivar ecocardiograma dirigido. Vias posterosseptais direitas também são frequentes e, em geral, acessíveis à ablação com bom índice de sucesso.',
      },
      {
        titulo: 'Conduta',
        texto:
          'A abordagem é a da pré-excitação em geral: distinguir padrão de síndrome, estratificar o risco da via e considerar ablação em pacientes sintomáticos, em profissões de risco ou com marcadores de via de alto risco. Nos episódios de taquicardia, valem as mesmas regras: taquicardia regular de QRS estreito responde a manobras vagais e adenosina; fibrilação atrial pré-excitada, irregular e de QRS largo, exige cardioversão elétrica ou procainamida, jamais bloqueadores do nó AV. E, como sempre na pré-excitação, o ECG basal deve ser guardado e comparado ao longo do tempo — a pré-excitação intermitente é informação prognóstica valiosa.',
      },
    ],
    ondaAOnda: [
      { onda: 'Intervalo PR', achado: 'Menor que 120 ms.' },
      { onda: 'Onda delta', achado: 'Negativa em V1 — assinatura da via acessória direita.' },
      { onda: 'V1 e V2', achado: 'Complexo predominantemente negativo, simulando bloqueio de ramo esquerdo.' },
      { onda: 'QRS', achado: 'Alargado por início precoce da ativação ventricular.' },
      { onda: 'ST e T', achado: 'Alterações secundárias opostas à onda delta.' },
    ],
    roteiro: [
      'Confirme PR curto e presença de onda delta.',
      'Olhe V1: delta negativa e complexo negativo indicam via direita.',
      'Evite diagnosticar bloqueio de ramo esquerdo verdadeiro.',
      'Considere ecocardiograma para pesquisar anomalia de Ebstein.',
      'Estratifique sintomas e encaminhe para avaliação eletrofisiológica.',
    ],
    separando: [
      { de: 'Bloqueio de ramo esquerdo', chave: 'PR normal, sem onda delta, com R entalhada em V6 e ausência de q septal.' },
      { de: 'WPW tipo A', chave: 'Delta positiva e R dominante em V1 — via esquerda.' },
      { de: 'Ritmo de marca-passo', chave: 'Espícula precedendo o QRS.' },
      { de: 'Extrassistolia ventricular', chave: 'Batimentos precoces sem onda P e sem PR curto.' },
    ],
    fixacao: [
      'Tipo B = V1 negativo = via direita.',
      'Via direita levanta a hipótese de anomalia de Ebstein.',
      'A regra da FA pré-excitada não muda: nada de bloqueadores do nó AV.',
    ],
  },

  'avrt-antidromic': {
    emUmaFrase:
      'O circuito gira ao contrário: desce pela via acessória e sobe pelo nó AV, produzindo taquicardia regular de QRS LARGO totalmente pré-excitado.',
    secoes: [
      {
        titulo: 'Por que o QRS é largo',
        texto:
          'Antidrômico significa “no sentido contrário”. Aqui o impulso desce pela via acessória, ativando o ventrículo inteiramente por propagação muscular, sem usar o sistema His-Purkinje; depois sobe pelo nó AV de volta ao átrio, fechando o circuito. Como toda a despolarização ventricular ocorre pelo caminho lento, o QRS é máximo em pré-excitação: largo, bizarro e essencialmente idêntico a uma onda delta gigante. Essa forma representa apenas cerca de 5% a 10% das taquicardias reentrantes por via acessória, mas tem importância desproporcional porque é uma das grandes imitadoras da taquicardia ventricular.',
      },
      {
        titulo: 'O desafio diagnóstico',
        texto:
          'Diante de taquicardia regular de QRS largo, os diagnósticos possíveis são taquicardia ventricular, taquicardia supraventricular com aberrância e taquicardia antidrômica. A regra de segurança permanece: trate como ventricular até prova em contrário. Pistas que sugerem antidrômica são: paciente jovem sem cardiopatia estrutural, história de palpitações desde a adolescência, e sobretudo um ECG basal prévio mostrando pré-excitação, com morfologia do QRS na taquicardia semelhante à do QRS pré-excitado em ritmo sinusal. Achados que apontam para taquicardia ventricular — dissociação AV, batimentos de captura e de fusão, concordância precordial — devem prevalecer sobre qualquer suposição.',
      },
      {
        titulo: 'Tratamento seguro',
        texto:
          'Instabilidade indica cardioversão elétrica sincronizada, que é segura e eficaz nos três diagnósticos possíveis. Em paciente estável com diagnóstico incerto, a escolha farmacológica segura é a procainamida, que atua na via acessória e é adequada tanto para taquicardia ventricular quanto para arritmias pré-excitadas. Bloqueadores do nó AV devem ser evitados enquanto persistir dúvida diagnóstica: além do risco na fibrilação atrial pré-excitada, verapamil pode causar colapso hemodinâmico se o ritmo for taquicardia ventricular. O tratamento definitivo é a ablação da via acessória, que elimina o substrato tanto da taquicardia antidrômica quanto da ortodrômica e da fibrilação atrial pré-excitada.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com frequência entre 150 e 250 bpm.' },
      { onda: 'QRS', achado: 'Largo e bizarro, correspondendo à pré-excitação máxima.' },
      { onda: 'Onda P', achado: 'Retrógrada e frequentemente difícil de identificar dentro do complexo largo.' },
      { onda: 'ECG basal', achado: 'Mostra pré-excitação com morfologia semelhante à da taquicardia — a pista mais valiosa.' },
      { onda: 'Dissociação AV', achado: 'Ausente; se presente, o diagnóstico passa a ser taquicardia ventricular.' },
    ],
    roteiro: [
      'Reconheça a taquicardia regular de QRS largo.',
      'Procure dissociação AV, capturas e fusões — se houver, é TV.',
      'Busque ECG basal com pré-excitação e compare morfologias.',
      'Instável? Cardioversão sincronizada.',
      'Estável com dúvida? Procainamida; evite bloqueadores do nó AV.',
    ],
    separando: [
      { de: 'Taquicardia ventricular', chave: 'Dissociação AV, fusões, capturas e concordância precordial apontam TV.' },
      { de: 'TSV com aberrância', chave: 'Morfologia típica de bloqueio de ramo e QRS igual ao do ECG basal com o mesmo bloqueio.' },
      { de: 'AVRT ortodrômica', chave: 'QRS estreito — o circuito gira no sentido oposto.' },
      { de: 'FA pré-excitada', chave: 'Ritmo irregular com larguras variáveis de QRS.' },
    ],
    fixacao: [
      'Antidrômica = desce pela via = QRS largo = imita TV.',
      'O ECG basal com pré-excitação é a chave do diagnóstico.',
      'Procainamida é a escolha segura na dúvida; cardioversão resolve qualquer hipótese.',
    ],
  },

  lgl: {
    emUmaFrase:
      'PR curto, abaixo de 120 ms, sem onda delta e com QRS estreito — um achado descritivo cuja explicação anatômica tradicional não se sustentou.',
    secoes: [
      {
        titulo: 'História e revisão do conceito',
        texto:
          'A síndrome de Lown-Ganong-Levine foi descrita como PR curto sem pré-excitação associada a taquicardias paroxísticas, e atribuída a supostas fibras de James que conectariam o átrio diretamente ao feixe de His, pulando o nó AV. Estudos eletrofisiológicos posteriores não confirmaram essa via anatômica de forma consistente, e hoje o conceito de LGL como entidade específica é considerado obsoleto. O que se mantém válido é a descrição eletrocardiográfica: PR curto com QRS estreito e sem onda delta, que pode ter explicações variadas — condução acelerada pelo nó AV (nó AV de vias rápidas, comum em jovens e em estados adrenérgicos), nó AV anatomicamente pequeno, ou variações fisiológicas do tônus autonômico.',
      },
      {
        titulo: 'A distinção essencial',
        texto:
          'O ponto que realmente importa na prática é diferenciar esse padrão da pré-excitação verdadeira. Na pré-excitação por feixe de Kent, além do PR curto, existe onda delta e o QRS é alargado, porque parte do ventrículo é despolarizada pelo músculo. No padrão tipo LGL, o QRS é estreito e o início é limpo, sem empastamento — o impulso, uma vez chegado ao sistema His-Purkinje, se distribui normalmente. Essa diferença tem consequência direta: sem via acessória capaz de conduzir do átrio ao ventrículo por fora do nó, não existe o risco de fibrilação atrial pré-excitada, que é o principal perigo do Wolff-Parkinson-White, e as restrições farmacológicas correspondentes não se aplicam.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Em paciente assintomático, o achado isolado de PR curto com QRS estreito não requer investigação nem tratamento — é frequentemente uma variação do normal, sobretudo em jovens, atletas e em estados de tônus simpático elevado. Também pode ocorrer em ritmos de origem atrial baixa ou juncional, e nessas situações a onda P tem morfologia alterada, o que ajuda a explicar o PR curto sem qualquer anomalia de condução. Se houver taquicardias documentadas, a investigação segue o caminho habitual das taquicardias supraventriculares, com estudo eletrofisiológico quando indicado — e é ele, e não o ECG basal, que define o mecanismo e a possibilidade de ablação.',
      },
    ],
    ondaAOnda: [
      { onda: 'Intervalo PR', achado: 'Menor que 120 ms.' },
      { onda: 'Onda delta', achado: 'AUSENTE — a diferença fundamental em relação ao WPW.' },
      { onda: 'QRS', achado: 'Estreito, com início limpo e sem empastamento.' },
      { onda: 'Onda P', achado: 'Avalie a morfologia: P não sinusal explica PR curto por origem atrial baixa ou juncional.' },
      { onda: 'ST e T', achado: 'Normais, sem as alterações secundárias típicas da pré-excitação.' },
    ],
    roteiro: [
      'Meça o PR: menor que 120 ms.',
      'Procure onda delta no início do QRS: não há.',
      'Confirme que o QRS é estreito.',
      'Avalie a morfologia da onda P para excluir ritmo atrial baixo ou juncional.',
      'Sem sintomas, não investigue além; com taquicardias, siga a rota das TSV.',
    ],
    separando: [
      { de: 'WPW', chave: 'Na pré-excitação verdadeira existe onda delta e o QRS é largo.' },
      { de: 'Ritmo juncional', chave: 'P ausente, retrógrada ou pós-QRS, com frequência de 40–60 bpm.' },
      { de: 'Ritmo atrial baixo', chave: 'P negativa nas derivações inferiores explicando o PR curto.' },
    ],
    fixacao: [
      'PR curto SEM delta e com QRS estreito: sem via acessória ventricular, sem o risco do WPW.',
      'O conceito clássico de LGL foi abandonado; o valor está na descrição do traçado.',
      'Sempre olhe a morfologia da P antes de considerar anomalia de condução.',
    ],
  },
}

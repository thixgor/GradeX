import type { DeepDiveMap } from './types'

/** Hipertrofias e sobrecargas — quando a câmara cresce, o vetor cresce junto. */
export const DEEP_DIVE_HIPERTROFIAS: DeepDiveMap = {
  lvh: {
    emUmaFrase:
      'Massa muscular aumentada do ventrículo esquerdo gera vetores maiores: ondas R altas nas laterais, S profundas nas precordiais direitas e, quando há strain, infradesnivelamento com T assimétrica invertida.',
    secoes: [
      {
        titulo: 'Da parede espessa ao traçado',
        texto:
          'A hipertrofia ventricular esquerda é resposta adaptativa à sobrecarga crônica: pressórica, como na hipertensão e na estenose aórtica, ou volumétrica, como na insuficiência aórtica e mitral. Mais miócitos hipertrofiados significam mais corrente elétrica gerada na mesma direção — o vetor principal do QRS, que já apontava para a esquerda e para trás, torna-se maior. As derivações que olham a parede lateral (DI, aVL, V5 e V6) registram ondas R mais altas; as que ficam do lado oposto (V1 e V2) registram ondas S mais profundas. Além da amplitude, a hipertrofia prolonga o tempo de ativação ventricular (o tempo do início do QRS ao pico da R nas laterais passa de 50 ms), pode alargar discretamente o QRS e desviar o eixo para a esquerda.',
      },
      {
        titulo: 'Os critérios e suas limitações',
        texto:
          'Sokolow-Lyon: S em V1 somada à R em V5 ou V6 maior ou igual a 35 mm, ou R em aVL maior ou igual a 11 mm. Cornell: R em aVL somada à S em V3 maior que 28 mm em homens e 20 mm em mulheres — critério com melhor desempenho global. Romhilt-Estes: sistema de pontos que soma amplitude, alterações de repolarização, sobrecarga atrial esquerda, desvio do eixo, duração do QRS e tempo de ativação ventricular; 5 pontos indicam hipertrofia e 4 sugerem probabilidade. Todos compartilham a mesma limitação: alta especificidade e baixa sensibilidade. Pacientes magros, jovens e atletas produzem voltagens altas sem hipertrofia; obesos, portadores de DPOC e de derrame pericárdico atenuam as voltagens e escondem hipertrofias reais. O ecocardiograma é o exame que define massa e geometria; o ECG serve para levantar a suspeita e, sobretudo, para estratificar risco.',
      },
      {
        titulo: 'O padrão de strain e por que ele importa',
        texto:
          'Nas derivações que olham a parede hipertrofiada (DI, aVL, V5, V6), pode aparecer infradesnivelamento do ST com concavidade para baixo e onda T invertida assimétrica — descida lenta e retorno rápido. Essa é a chamada sobrecarga ventricular esquerda, ou padrão de strain, resultante de alteração da sequência de repolarização e de isquemia subendocárdica relativa na parede espessa. Sua presença não é um detalhe estético: indica hipertrofia mais avançada e associa-se a maior risco cardiovascular. A distinção em relação à isquemia se faz pela assimetria (a T da isquemia costuma ser simétrica), pela distribuição concordante com as derivações de alta voltagem, e pela estabilidade em traçados seriados.',
      },
      {
        titulo: 'Significado clínico',
        texto:
          'A hipertrofia ventricular esquerda ao eletrocardiograma é preditor independente de eventos cardiovasculares, insuficiência cardíaca, fibrilação atrial e morte — e sua regressão com o tratamento anti-hipertensivo associa-se a melhora do prognóstico, o que faz do ECG seriado uma ferramenta útil de acompanhamento. Diante do achado, a investigação deve buscar a causa: medida adequada da pressão arterial, ecocardiograma para avaliar geometria, função diastólica e valvas, e atenção a diagnósticos específicos como miocardiopatia hipertrófica (voltagens muito altas com ondas Q septais estreitas e profundas, T gigantes negativas na variante apical) e doenças infiltrativas — na amiloidose, tipicamente ocorre o inverso, com paredes espessas ao ecocardiograma e baixa voltagem ao ECG, uma dissociação que é uma das pistas diagnósticas mais valiosas da cardiologia.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS (amplitude)', achado: 'R altas em DI, aVL, V5 e V6; S profundas em V1 e V2; aplique Sokolow e Cornell.' },
      { onda: 'Eixo', achado: 'Frequentemente desviado para a esquerda.' },
      { onda: 'Tempo de ativação', achado: 'Maior que 50 ms em V5–V6 (do início do QRS ao pico da onda R).' },
      { onda: 'ST e T', achado: 'Padrão de strain: infra com concavidade inferior e T invertida assimétrica nas laterais.' },
      { onda: 'Onda P', achado: 'Sobrecarga atrial esquerda frequentemente associada (P entalhada e alargada em DII, componente negativo em V1).' },
      { onda: 'QRS (duração)', achado: 'Pode alargar discretamente, sem atingir critério de bloqueio de ramo.' },
    ],
    roteiro: [
      'Meça S em V1 e R em V5–V6 e aplique Sokolow-Lyon.',
      'Meça R em aVL e S em V3 e aplique Cornell, ajustando por sexo.',
      'Avalie o eixo e o tempo de ativação ventricular.',
      'Procure o padrão de strain nas derivações laterais.',
      'Avalie a onda P e considere ecocardiograma para confirmar e caracterizar.',
    ],
    separando: [
      { de: 'Isquemia', chave: 'A T da isquemia é simétrica e pode ser dinâmica; a do strain é assimétrica e estável.' },
      { de: 'Bloqueio de ramo esquerdo', chave: 'No BRE o QRS é maior ou igual a 120 ms com R entalhada e sem q septal em V6.' },
      { de: 'Voltagem alta fisiológica', chave: 'Jovem magro ou atleta, sem alterações de repolarização nem sobrecarga atrial.' },
      { de: 'Miocardiopatia hipertrófica', chave: 'Ondas Q septais estreitas e profundas; T gigantes negativas na variante apical.' },
    ],
    fixacao: [
      'Sokolow: S(V1) + R(V5 ou V6) ≥ 35 mm. Cornell: R(aVL) + S(V3) > 28 mm (homens) ou > 20 mm (mulheres).',
      'Strain assimétrico nas laterais é sinal de hipertrofia avançada.',
      'Parede espessa no eco com baixa voltagem no ECG = suspeite de amiloidose.',
    ],
  },

  rvh: {
    emUmaFrase:
      'O ventrículo direito hipertrofiado inverte a dominância elétrica: onda R alta em V1, desvio do eixo para a direita e padrão de sobrecarga nas precordiais direitas.',
    secoes: [
      {
        titulo: 'Invertendo a relação normal',
        texto:
          'Em condições normais, a massa do ventrículo esquerdo é várias vezes maior que a do direito, e o vetor resultante aponta para a esquerda e para trás — daí a onda S dominante em V1 e a R dominante em V6. Quando o ventrículo direito hipertrofia por sobrecarga crônica de pressão (hipertensão pulmonar, estenose pulmonar, DPOC avançada, cardiopatias congênitas, tromboembolismo crônico) ou de volume (comunicação interatrial, insuficiência tricúspide), sua contribuição elétrica cresce e o vetor médio gira para a frente e para a direita. O resultado é a inversão do padrão precordial: onda R dominante em V1 (relação R/S maior que 1) e S persistente em V5 e V6.',
      },
      {
        titulo: 'Critérios e achados associados',
        texto:
          'R/S maior que 1 em V1, com R maior ou igual a 7 mm; desvio do eixo para a direita além de +110°; padrão de strain do ventrículo direito, com infradesnivelamento e T invertida em V1 a V3 e nas derivações inferiores; onda S persistente em V5 e V6; padrão qR em V1, altamente sugestivo de hipertensão pulmonar significativa; e sinais de sobrecarga atrial direita (P pulmonale — P apiculada maior que 2,5 mm em DII). O padrão S1S2S3 e o bloqueio incompleto de ramo direito também podem acompanhar. A sensibilidade dos critérios é baixa, sobretudo na doença pulmonar obstrutiva, em que a hiperinsuflação atenua todos os sinais — nesse cenário, achados como baixa voltagem, eixo verticalizado, P pulmonale e progressão pobre de R são pistas complementares.',
      },
      {
        titulo: 'Contexto clínico e diferenciais',
        texto:
          'O achado deve orientar a busca da causa: doença pulmonar crônica e cor pulmonale, hipertensão arterial pulmonar, tromboembolismo pulmonar crônico, valvopatias do coração direito, cardiopatias congênitas e apneia obstrutiva do sono. O ecocardiograma é o próximo passo natural, estimando pressão sistólica de artéria pulmonar, avaliando as dimensões e a função do ventrículo direito e procurando shunts. Do ponto de vista eletrocardiográfico, a lista de diagnósticos diferenciais de R dominante em V1 deve ser percorrida com cuidado: infarto posterior (com infra de ST e T positiva em V1–V3), bloqueio de ramo direito (padrão rSR′ com S larga em V6), pré-excitação tipo A (PR curto com onda delta), distrofia muscular de Duchenne, dextrocardia e simples posicionamento incorreto dos eletrodos precordiais.',
      },
    ],
    ondaAOnda: [
      { onda: 'V1', achado: 'Onda R dominante, com relação R/S maior que 1 e R maior ou igual a 7 mm.' },
      { onda: 'Eixo', achado: 'Desviado para a direita, além de +110°.' },
      { onda: 'V5 e V6', achado: 'Onda S persistente, refletindo forças direitas aumentadas.' },
      { onda: 'ST e T', achado: 'Strain de ventrículo direito: infra e T invertida em V1–V3 e nas inferiores.' },
      { onda: 'Onda P', achado: 'P pulmonale — apiculada, maior que 2,5 mm em DII.' },
      { onda: 'Padrão qR em V1', achado: 'Sugestivo de hipertensão pulmonar significativa.' },
    ],
    roteiro: [
      'Olhe V1: a onda R é dominante?',
      'Calcule o eixo: desviado para a direita?',
      'Procure S persistente em V5–V6 e strain em V1–V3.',
      'Avalie a onda P em DII procurando P pulmonale.',
      'Percorra os diferenciais de R alta em V1 antes de concluir; solicite ecocardiograma.',
    ],
    separando: [
      { de: 'Infarto posterior', chave: 'Infra de ST em V1–V3 com T positiva; confirme com V7–V9.' },
      { de: 'Bloqueio de ramo direito', chave: 'Padrão rSR′ com S larga em V6 e QRS maior ou igual a 120 ms.' },
      { de: 'WPW tipo A', chave: 'PR curto com onda delta positiva em V1.' },
      { de: 'Eletrodos mal posicionados', chave: 'Refaça o exame com V1 e V2 no quarto espaço intercostal.' },
    ],
    fixacao: [
      'R dominante em V1 tem uma lista curta de causas — percorra-a antes de concluir.',
      'qR em V1 sugere hipertensão pulmonar significativa.',
      'Na DPOC, a hiperinsuflação esconde os critérios: valorize P pulmonale e baixa voltagem.',
    ],
  },

  lae: {
    emUmaFrase:
      'O átrio esquerdo aumentado prolonga a segunda metade da despolarização atrial: onda P larga e entalhada em DII e componente negativo profundo e prolongado em V1.',
    secoes: [
      {
        titulo: 'Como a onda P se forma',
        texto:
          'A onda P é a soma de dois eventos sequenciais: primeiro despolariza o átrio direito, depois o esquerdo. Sua duração normal é inferior a 120 ms, e sua morfologia em DII é arredondada e única. Quando o átrio esquerdo aumenta — por sobrecarga de pressão ou volume —, o segundo componente demora mais, e a onda P se alarga e adquire dois picos separados por um entalhe. Em V1, que está próximo dos átrios e registra bem os vetores anteroposteriores, a P normal é bifásica: componente inicial positivo (átrio direito, anterior) e terminal negativo (átrio esquerdo, posterior). Com o aumento do átrio esquerdo, esse componente negativo terminal fica mais profundo e mais longo.',
      },
      {
        titulo: 'Critérios objetivos',
        texto:
          'Em DII: duração da onda P maior ou igual a 120 ms, com entalhe cujos picos estão separados por mais de 40 ms — a clássica P mitrale. Em V1: índice de Morris, definido como um componente negativo terminal da P com profundidade maior ou igual a 1 mm e duração maior ou igual a 40 ms (área maior ou igual a 1 mm por 40 ms, ou seja, um quadradinho). O índice de Morris é o critério mais específico e o mais fácil de aplicar na prática — vale a pena treinar o olho para ele. O nome “P mitrale” lembra a causa clássica, a estenose mitral, mas a origem mais comum hoje é a hipertensão arterial e a disfunção diastólica.',
      },
      {
        titulo: 'Significado clínico',
        texto:
          'A sobrecarga atrial esquerda é a manifestação eletrocardiográfica da miopatia atrial e um marcador de doença estrutural. Suas causas incluem hipertensão com disfunção diastólica, valvopatia mitral (estenose e insuficiência), miocardiopatias, hipertrofia ventricular esquerda de qualquer origem e insuficiência cardíaca. Seu valor prognóstico está bem estabelecido: associa-se a maior incidência de fibrilação atrial, de acidente vascular cerebral e de eventos cardiovasculares. Por isso, encontrar P mitrale num ECG de rotina não é um detalhe descritivo — é um convite a avaliar pressão arterial, função diastólica e valva mitral, e a manter atenção redobrada para arritmias atriais no seguimento.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda P em DII', achado: 'Duração maior ou igual a 120 ms, com entalhe e picos separados por mais de 40 ms.' },
      { onda: 'Onda P em V1', achado: 'Componente negativo terminal com profundidade e duração maiores ou iguais a 1 mm e 40 ms (índice de Morris).' },
      { onda: 'Amplitude', achado: 'Habitualmente normal — o que aumenta é a duração, não a altura.' },
      { onda: 'Ritmo', achado: 'Vigie extrassístoles atriais e fibrilação atrial, complicações frequentes.' },
      { onda: 'Contexto', achado: 'Frequentemente acompanha hipertrofia ventricular esquerda no mesmo traçado.' },
    ],
    roteiro: [
      'Meça a duração da onda P em DII: 120 ms ou mais.',
      'Procure o entalhe e meça a distância entre os picos.',
      'Olhe V1 e avalie o componente negativo terminal.',
      'Aplique o índice de Morris: 1 mm de profundidade por 40 ms de duração.',
      'Correlacione com hipertensão, valva mitral e função diastólica.',
    ],
    separando: [
      { de: 'Sobrecarga atrial direita', chave: 'P alta e apiculada (maior que 2,5 mm em DII), com duração normal.' },
      { de: 'Distúrbio de condução interatrial', chave: 'P muito larga com componente terminal negativo em DII, DIII e aVF (bloqueio de Bachmann).' },
      { de: 'Artefato ou linha de base instável', chave: 'Reavalie o traçado com boa qualidade técnica antes de medir.' },
    ],
    fixacao: [
      'P mitrale: larga e entalhada em DII, negativa profunda em V1.',
      'Índice de Morris: um quadradinho negativo em V1 fecha o diagnóstico.',
      'É marcador de risco de fibrilação atrial e AVC, não apenas um achado descritivo.',
    ],
  },

  rae: {
    emUmaFrase:
      'O átrio direito aumentado amplifica o primeiro componente da onda P: P alta e apiculada, maior que 2,5 mm em DII — a P pulmonale.',
    secoes: [
      {
        titulo: 'Amplitude, não duração',
        texto:
          'Como o átrio direito despolariza primeiro, seu aumento afeta a primeira metade da onda P. Os vetores dos dois átrios continuam se sobrepondo no tempo — o átrio direito maior simplesmente produz um vetor maior, que soma amplitude à porção inicial. Por isso a onda P fica mais alta e pontiaguda, mas a duração total permanece normal, abaixo de 120 ms. Essa é a diferença conceitual essencial em relação à sobrecarga atrial esquerda, que alarga a P sem necessariamente aumentar sua altura. Em V1, a sobrecarga direita aumenta o componente inicial positivo, que pode ultrapassar 1,5 mm.',
      },
      {
        titulo: 'Critérios e o contexto pulmonar',
        texto:
          'Onda P com amplitude maior que 2,5 mm em DII, DIII ou aVF; componente inicial positivo maior que 1,5 mm em V1; e eixo da onda P desviado para a direita, frequentemente além de +75°. O nome P pulmonale reflete a causa mais comum: doença pulmonar crônica com cor pulmonale. Também aparece na hipertensão arterial pulmonar, no tromboembolismo pulmonar agudo (em que pode ser transitória), nas valvopatias tricúspide e pulmonar, nas cardiopatias congênitas e na anomalia de Ebstein — nesta última, as ondas P podem ser gigantescas, chegando a ultrapassar a amplitude do QRS, num traçado bastante característico.',
      },
      {
        titulo: 'Achados que costumam acompanhar',
        texto:
          'Raramente a sobrecarga atrial direita aparece sozinha. Procure no mesmo traçado: desvio do eixo do QRS para a direita, onda R dominante em V1 e padrão de strain de ventrículo direito, sugerindo hipertrofia ventricular direita associada; baixa voltagem difusa e progressão pobre de R nas precordiais, típicas da hiperinsuflação pulmonar; taquicardia sinusal e taquicardia atrial multifocal, arritmias características do pneumopata descompensado. Esse conjunto de achados desenha o perfil eletrocardiográfico do paciente com doença pulmonar avançada e deve orientar a avaliação com ecocardiograma, espirometria e investigação de hipertensão pulmonar.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda P em DII', achado: 'Amplitude maior que 2,5 mm, apiculada e simétrica — a P pulmonale.' },
      { onda: 'Duração da P', achado: 'Normal, abaixo de 120 ms — é a altura que muda, não a largura.' },
      { onda: 'Onda P em V1', achado: 'Componente inicial positivo maior que 1,5 mm.' },
      { onda: 'Eixo da P', achado: 'Desviado para a direita, frequentemente além de +75°.' },
      { onda: 'Achados associados', achado: 'Eixo do QRS à direita, R dominante em V1, baixa voltagem e progressão pobre de R.' },
    ],
    roteiro: [
      'Meça a amplitude da onda P em DII: maior que 2,5 mm.',
      'Confirme que a duração da P é normal.',
      'Avalie o componente inicial da P em V1.',
      'Procure sinais associados de sobrecarga ventricular direita.',
      'Correlacione com doença pulmonar, hipertensão pulmonar e valvopatias direitas.',
    ],
    separando: [
      { de: 'Sobrecarga atrial esquerda', chave: 'P larga e entalhada, com componente negativo profundo em V1.' },
      { de: 'Taquicardia sinusal', chave: 'A frequência alta aumenta a amplitude da P sem indicar sobrecarga estrutural.' },
      { de: 'Ritmo atrial ectópico', chave: 'P de morfologia diferente da sinusal, podendo ser negativa em DII.' },
    ],
    fixacao: [
      'P pulmonale: alta e pontuda. P mitrale: larga e entalhada.',
      'Sobrecarga direita aumenta amplitude; esquerda aumenta duração.',
      'P gigante em jovem com cardiomegalia levanta a hipótese de anomalia de Ebstein.',
    ],
  },

  biatrial: {
    emUmaFrase:
      'Os dois átrios sobrecarregados no mesmo traçado: onda P simultaneamente alta e larga, com componente inicial proeminente e componente terminal negativo profundo em V1.',
    secoes: [
      {
        titulo: 'Somando os dois padrões',
        texto:
          'A sobrecarga biatrial ocorre quando ambos os átrios estão aumentados, e o eletrocardiograma exibe, no mesmo traçado, características das duas sobrecargas: aumento da amplitude (componente direito) e aumento da duração com entalhe (componente esquerdo). Em DII, a onda P fica alta e larga ao mesmo tempo — habitualmente com amplitude maior que 2,5 mm e duração maior ou igual a 120 ms. Em V1, o padrão é ainda mais característico: componente inicial positivo proeminente, maior que 1,5 mm, seguido de componente terminal negativo profundo e prolongado, atendendo ao índice de Morris. Essa combinação bifásica exagerada em V1 é o achado mais específico.',
      },
      {
        titulo: 'Quando esperar esse padrão',
        texto:
          'A sobrecarga biatrial aparece em situações de doença cardíaca avançada ou de comprometimento simultâneo dos dois lados: valvopatia mitral com hipertensão pulmonar secundária (mecanismo clássico — o átrio esquerdo aumenta primeiro e a pressão retrógrada sobrecarrega o coração direito), miocardiopatia dilatada, cardiopatias congênitas complexas, insuficiência cardíaca avançada e miocardiopatias restritivas. Nesse contexto, o achado eletrocardiográfico é marcador de doença estrutural significativa e de alto risco de fibrilação atrial — quando ela se instala, as ondas P desaparecem e a informação da sobrecarga se perde, o que dá valor a traçados antigos.',
      },
      {
        titulo: 'Como não errar',
        texto:
          'A dificuldade prática é que a sobreposição dos vetores pode mascarar um dos componentes. Uma sobrecarga atrial direita muito acentuada pode aumentar a amplitude e dificultar a percepção do alargamento; e a presença de bloqueio interatrial pode alargar a P sem que haja aumento real do átrio esquerdo. Por isso, o diagnóstico deve ser feito com critérios objetivos aplicados em pelo menos duas derivações, e sempre correlacionado ao ecocardiograma, que mede diretamente os volumes atriais. Vale também considerar que os critérios eletrocardiográficos de sobrecarga atrial têm sensibilidade limitada: sua ausência não exclui átrios aumentados.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda P em DII', achado: 'Simultaneamente alta (maior que 2,5 mm) e larga (120 ms ou mais).' },
      { onda: 'Onda P em V1', achado: 'Componente inicial positivo maior que 1,5 mm com componente terminal negativo profundo e prolongado.' },
      { onda: 'Morfologia', achado: 'Frequentemente entalhada, refletindo a assincronia entre os dois átrios.' },
      { onda: 'Contexto', achado: 'Procure sinais de hipertrofia ventricular esquerda e direita no mesmo traçado.' },
      { onda: 'Ritmo', achado: 'Alto risco de fibrilação atrial — sua instalação apaga o achado.' },
    ],
    roteiro: [
      'Meça amplitude e duração da onda P em DII.',
      'Verifique se ambos os critérios estão presentes simultaneamente.',
      'Analise V1: componente inicial alto e terminal negativo profundo.',
      'Procure sinais de sobrecarga ventricular associados.',
      'Solicite ecocardiograma para medir os volumes atriais e definir a causa.',
    ],
    separando: [
      { de: 'Sobrecarga atrial esquerda isolada', chave: 'P larga sem aumento significativo de amplitude.' },
      { de: 'Sobrecarga atrial direita isolada', chave: 'P alta com duração normal.' },
      { de: 'Bloqueio interatrial avançado', chave: 'P muito larga com componente terminal negativo nas derivações inferiores.' },
    ],
    fixacao: [
      'Alta E larga na mesma onda P: pense em sobrecarga biatrial.',
      'A P bifásica exagerada em V1 é o achado mais específico.',
      'É marcador de doença estrutural avançada e de risco elevado de fibrilação atrial.',
    ],
  },

  'rv-strain': {
    emUmaFrase:
      'Inversão da onda T em V1 a V4 e nas derivações inferiores, com desvio do eixo para a direita: o ventrículo direito sob pressão excessiva, agudo ou crônico.',
    secoes: [
      {
        titulo: 'O que é strain do ventrículo direito',
        texto:
          'O padrão de sobrecarga (strain) do ventrículo direito reflete alteração da repolarização de uma parede submetida a pressão sistólica elevada. Como o ventrículo direito é fino e trabalha normalmente contra baixa resistência, ele tolera mal aumentos súbitos de pós-carga: dilata, sofre isquemia subendocárdica relativa e altera sua sequência de repolarização. No eletrocardiograma, isso aparece como inversão das ondas T nas derivações que olham o ventrículo direito (V1 a V4) e frequentemente também nas derivações inferiores, muitas vezes com infradesnivelamento do ST. Nas formas crônicas, o padrão acompanha hipertrofia; nas agudas, aparece sem ela.',
      },
      {
        titulo: 'Agudo versus crônico',
        texto:
          'A causa aguda mais importante é o tromboembolismo pulmonar, em que o padrão pode surgir em horas, acompanhado de taquicardia sinusal, S1Q3T3, bloqueio de ramo direito novo (frequentemente incompleto), desvio do eixo para a direita e, ocasionalmente, fibrilação atrial. A extensão da inversão da T nas precordiais direitas correlaciona-se com a gravidade da sobrecarga e tem valor prognóstico. As causas crônicas incluem hipertensão arterial pulmonar, DPOC com cor pulmonale, tromboembolismo pulmonar crônico, estenose pulmonar, cardiopatias congênitas e valvopatias direitas — nesses casos, o padrão vem acompanhado de sinais de hipertrofia ventricular direita e de sobrecarga atrial direita, e é estável ao longo do tempo.',
      },
      {
        titulo: 'A armadilha diagnóstica',
        texto:
          'Ondas T invertidas em V1 a V4 também ocorrem na isquemia anterior — e a distinção tem consequências graves, porque uma leva à investigação de tromboembolismo pulmonar e a outra à coronariografia. Alguns elementos ajudam: no tromboembolismo, a inversão da T costuma envolver simultaneamente as precordiais direitas e as derivações inferiores (especialmente DIII), acompanha-se de taquicardia sinusal e sinais de sobrecarga direita, e o quadro clínico traz dispneia súbita, dor pleurítica e fatores de risco tromboembólicos. Na isquemia anterior, a inversão tende a concentrar-se nas precordiais, pode haver o padrão de Wellens e o contexto é de dor anginosa. Ecocardiograma à beira do leito, mostrando ventrículo direito dilatado e hipocinético com septo retificado, e a dosagem de D-dímero orientam a decisão.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda T', achado: 'Invertida em V1–V4 e frequentemente também em DII, DIII e aVF.' },
      { onda: 'Segmento ST', achado: 'Infradesnivelamento nas mesmas derivações, refletindo sobrecarga.' },
      { onda: 'Eixo', achado: 'Desviado para a direita.' },
      { onda: 'QRS', achado: 'Bloqueio de ramo direito completo ou incompleto é frequente.' },
      { onda: 'Onda P', achado: 'P pulmonale quando a sobrecarga é crônica.' },
      { onda: 'Ritmo', achado: 'Taquicardia sinusal é a regra nas formas agudas.' },
    ],
    roteiro: [
      'Identifique a inversão de T em V1–V4.',
      'Verifique se também há inversão nas derivações inferiores.',
      'Avalie o eixo e procure bloqueio de ramo direito.',
      'Diferencie agudo de crônico pelo contexto clínico e por traçados antigos.',
      'Considere ecocardiograma à beira do leito e investigação de tromboembolismo pulmonar.',
    ],
    separando: [
      { de: 'Isquemia anterior', chave: 'Inversão concentrada nas precordiais, com contexto anginoso e sem sinais de sobrecarga direita.' },
      { de: 'Síndrome de Wellens', chave: 'T bifásica ou profundamente invertida em V2–V3 em paciente sem dor.' },
      { de: 'Displasia arritmogênica do VD', chave: 'T invertida em V1–V3 em jovem, com onda épsilon e arritmias ventriculares.' },
      { de: 'Padrão juvenil de T', chave: 'T invertida em V1–V3 em jovens e crianças, sem sintomas nem sinais de sobrecarga.' },
    ],
    fixacao: [
      'T invertida em V1–V4 MAIS derivações inferiores aponta sobrecarga direita, não isquemia anterior.',
      'Taquicardia + S1Q3T3 + T invertida precordial direita = investigue tromboembolismo pulmonar.',
      'A extensão da inversão precordial tem valor prognóstico no TEP.',
    ],
  },
}

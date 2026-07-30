import type { DeepDiveMap } from './types'

/** Bloqueios de ramo e fasciculares — a condução intraventricular desorganizada. */
export const DEEP_DIVE_BLOQUEIOS_RAMO: DeepDiveMap = {
  rbbb: {
    emUmaFrase:
      'O ramo direito não conduz: o ventrículo direito é ativado tardiamente, célula a célula, gerando QRS acima de 120 ms com padrão rSR′ em V1 e onda S alargada em DI e V6.',
    secoes: [
      {
        titulo: 'A sequência de ativação alterada',
        texto:
          'Com o ramo direito bloqueado, o impulso desce apenas pelo ramo esquerdo. As duas primeiras fases da ativação ventricular permanecem quase normais: primeiro o septo despolariza da esquerda para a direita (gerando a pequena onda r inicial em V1 e a onda q em V6), depois a massa do ventrículo esquerdo despolariza (gerando a onda S em V1 e a R em V6). A terceira fase é que muda: o ventrículo direito, que deveria ter despolarizado simultaneamente, só é alcançado depois, por propagação transeptal lenta, músculo a músculo. Esse vetor tardio aponta para a frente e para a direita — exatamente na direção de V1 e aVR, e afastando-se de DI e V6. Daí nascem os dois achados que definem o bloqueio: o R′ tardio em V1 e a onda S larga e arrastada em DI, aVL e V6.',
      },
      {
        titulo: 'Os critérios e a alteração secundária da repolarização',
        texto:
          'QRS maior ou igual a 120 ms; padrão rsr′, rsR′ ou rSR′ em V1 ou V2, com o R′ habitualmente mais alto que o r inicial; onda S de duração maior que a da onda R, ou maior que 40 ms, em DI e V6; tempo de ativação ventricular (início do QRS ao pico do R) maior que 50 ms em V1. Junto com isso, aparece a alteração secundária da repolarização: depressão do segmento ST e onda T invertida em V1 a V3 — as chamadas alterações secundárias, esperadas e apropriadas, porque a repolarização segue um caminho tão anormal quanto a despolarização. Reconhecê-las como secundárias evita o erro de diagnosticar isquemia anterior em todo portador de bloqueio de ramo direito. O que não é esperado é T invertida nas derivações laterais ou supradesnivelamento de ST — esses merecem investigação.',
      },
      {
        titulo: 'Significado clínico',
        texto:
          'O bloqueio de ramo direito é comum e frequentemente benigno: ocorre em cerca de 1% da população adulta, aumenta com a idade e pode existir em corações estruturalmente normais. Adquire significado quando é novo, quando acompanha sintomas ou quando surge em contexto agudo. Novo bloqueio de ramo direito no infarto anterior indica comprometimento septal proximal e pior prognóstico. Em tromboembolismo pulmonar agudo, pode aparecer por sobrecarga aguda do ventrículo direito, ao lado do padrão S1Q3T3. Outras associações: doença pulmonar crônica, cardiopatias congênitas (comunicação interatrial, anomalia de Ebstein), doença de Chagas, miocardiopatias e doença degenerativa do sistema de condução. Uma distinção crucial: um padrão rSR′ em V1 com supradesnivelamento em cúpula levanta a suspeita de síndrome de Brugada, e não de bloqueio simples.',
      },
      {
        titulo: 'A grande vantagem diagnóstica',
        texto:
          'Diferentemente do bloqueio de ramo esquerdo, o bloqueio de ramo direito não impede a leitura de isquemia. A ativação inicial do ventrículo esquerdo permanece normal, de modo que ondas Q patológicas, supradesnivelamento e infradesnivelamento continuam interpretáveis nas derivações laterais e inferiores. Por isso, diante de dor torácica e bloqueio de ramo direito, o ECG mantém boa parte do seu valor — e um supradesnivelamento associado deve ser levado a sério e conduzido como infarto com supradesnivelamento.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Preservado; o bloqueio afeta a condução intraventricular, não o ritmo.' },
      { onda: 'Onda P e PR', achado: 'Normais, salvo bloqueio AV associado.' },
      { onda: 'QRS', achado: 'Maior ou igual a 120 ms, com padrão rSR′ em V1–V2 (o clássico “orelhas de coelho”).' },
      { onda: 'DI, aVL e V6', achado: 'Onda S larga e arrastada, com duração superior à da onda R.' },
      { onda: 'ST e T', achado: 'Infradesnivelamento e T invertida em V1–V3 — alteração secundária esperada.' },
      { onda: 'Isquemia', achado: 'As demais derivações continuam interpretáveis para isquemia.' },
    ],
    roteiro: [
      'Meça o QRS: maior ou igual a 120 ms.',
      'Olhe V1: existe rSR′ com R′ dominante?',
      'Olhe DI e V6: a onda S é larga e arrastada?',
      'Interprete a T invertida em V1–V3 como alteração secundária.',
      'Compare com traçados antigos: bloqueio novo tem significado diferente.',
    ],
    separando: [
      { de: 'Síndrome de Brugada', chave: 'Supradesnivelamento em cúpula seguido de T negativa em V1–V2, sem onda S larga em V6.' },
      { de: 'Bloqueio incompleto', chave: 'Mesma morfologia, mas QRS entre 110 e 120 ms.' },
      { de: 'Hipertrofia de ventrículo direito', chave: 'R alta em V1 sem o entalhe rSR′ e com desvio do eixo para a direita.' },
      { de: 'Displasia arritmogênica do VD', chave: 'Procure onda épsilon e T invertida em V1–V3 em paciente jovem com arritmia ventricular.' },
    ],
    fixacao: [
      '“Orelhas de coelho” em V1 e S larga em V6 = bloqueio de ramo direito.',
      'T invertida em V1–V3 no BRD é esperada; T invertida lateral não é.',
      'BRD não impede o diagnóstico de infarto — ao contrário do BRE.',
    ],
  },

  lbbb: {
    emUmaFrase:
      'O ramo esquerdo não conduz: toda a ativação do ventrículo esquerdo depende de propagação transeptal lenta, produzindo QRS largo, R entalhada em DI e V6 e repolarização completamente distorcida.',
    secoes: [
      {
        titulo: 'Por que o traçado muda tanto',
        texto:
          'O ramo esquerdo é responsável por ativar a maior massa muscular do coração e por gerar o vetor septal inicial. Bloqueado, o impulso desce pelo ramo direito, ativa primeiro o ventrículo direito e depois atravessa o septo da direita para a esquerda — o inverso do normal. Duas consequências imediatas: desaparece a onda q septal normal de DI, aVL, V5 e V6, e a ativação do ventrículo esquerdo passa a ser lenta e sequencial, produzindo QRS largo, monofásico e entalhado nas derivações laterais. Em V1 e V2, que olham o ventrículo direito e ficam de costas para o vetor principal, o complexo é predominantemente negativo, com padrão QS ou rS profundo.',
      },
      {
        titulo: 'Critérios e o conceito de discordância apropriada',
        texto:
          'QRS maior ou igual a 120 ms; onda R larga, monofásica e frequentemente entalhada em DI, aVL, V5 e V6; ausência de onda q nessas derivações laterais; complexos predominantemente negativos em V1–V2; tempo de ativação ventricular acima de 60 ms em V5–V6. A repolarização acompanha: o segmento ST e a onda T apontam na direção OPOSTA à deflexão principal do QRS. Assim, nas derivações com QRS positivo (laterais), espera-se infradesnivelamento e T negativa; nas derivações com QRS negativo (V1–V3), espera-se supradesnivelamento e T positiva. Essa discordância é apropriada e não significa isquemia. O erro clássico é diagnosticar infarto com supradesnivelamento a partir do supra fisiológico de V1–V3 num bloqueio de ramo esquerdo.',
      },
      {
        titulo: 'Infarto no bloqueio de ramo esquerdo: os critérios de Sgarbossa',
        texto:
          'Como o bloqueio distorce toda a repolarização, o diagnóstico de infarto exige critérios próprios. Os critérios de Sgarbossa são: supradesnivelamento de ST maior ou igual a 1 mm CONCORDANTE com a deflexão do QRS (5 pontos); infradesnivelamento maior ou igual a 1 mm em V1, V2 ou V3 (3 pontos); e supradesnivelamento discordante maior ou igual a 5 mm (2 pontos). Uma pontuação igual ou superior a 3 tem alta especificidade para infarto agudo. A modificação de Smith substitui o terceiro critério por uma proporção: supradesnivelamento discordante com relação ST/S menor ou igual a −0,25 (ou seja, o supra excede 25% da profundidade da onda S), o que melhora substancialmente a sensibilidade. É importante saber que as diretrizes atuais não tratam mais o bloqueio de ramo esquerdo novo como equivalente automático de infarto com supradesnivelamento — a decisão de ativar a hemodinâmica deve considerar o quadro clínico, os critérios de Sgarbossa e, quando disponível, o ecocardiograma à beira do leito.',
      },
      {
        titulo: 'Implicações clínicas e terapêuticas',
        texto:
          'Diferentemente do bloqueio de ramo direito, o bloqueio de ramo esquerdo raramente ocorre em coração normal: costuma indicar cardiopatia estrutural — hipertensão de longa data, doença coronariana, miocardiopatia dilatada, estenose aórtica, doença degenerativa do sistema de condução. Além de marcador, é causa: a dessincronia entre os ventrículos e entre as paredes do ventrículo esquerdo reduz a eficiência mecânica e pode, ao longo do tempo, produzir ou agravar disfunção sistólica. É exatamente esse mecanismo que fundamenta a terapia de ressincronização cardíaca — pacientes com insuficiência cardíaca, fração de ejeção reduzida e QRS largo com morfologia de bloqueio de ramo esquerdo são os que mais se beneficiam do marca-passo biventricular, com melhora de sintomas, remodelamento reverso e redução de mortalidade.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS', achado: 'Maior ou igual a 120 ms, com R larga, monofásica e entalhada em DI, aVL, V5 e V6.' },
      { onda: 'Onda q septal', achado: 'Ausente nas derivações laterais — a inversão do vetor septal a elimina.' },
      { onda: 'V1–V2', achado: 'Complexos predominantemente negativos (QS ou rS profundo).' },
      { onda: 'ST e T', achado: 'Discordantes do QRS: supra em V1–V3 e infra com T negativa nas laterais — esperado.' },
      { onda: 'Eixo', achado: 'Frequentemente desviado para a esquerda.' },
      { onda: 'Isquemia', achado: 'Aplique os critérios de Sgarbossa e a modificação de Smith.' },
    ],
    roteiro: [
      'Meça o QRS: maior ou igual a 120 ms.',
      'Olhe V6: onda R larga e entalhada, sem q inicial?',
      'Olhe V1: complexo predominantemente negativo?',
      'Verifique se ST e T são discordantes — isso é o esperado.',
      'Diante de dor torácica, aplique Sgarbossa e Sgarbossa modificado por Smith.',
      'Compare com ECG antigo e avalie função ventricular por ecocardiograma.',
    ],
    separando: [
      { de: 'Ritmo de marca-passo ventricular', chave: 'Há espícula antes de cada QRS; a morfologia lembra bloqueio de ramo esquerdo.' },
      { de: 'Bloqueio de ramo direito', chave: 'No direito o padrão é rSR′ em V1 com S larga em V6 — o oposto.' },
      { de: 'Infarto com supradesnivelamento', chave: 'Use Sgarbossa: supra concordante ou desproporcional ao QRS é que indica infarto.' },
      { de: 'Hipertrofia ventricular esquerda', chave: 'Voltagem alta com QRS abaixo de 120 ms e sem entalhe da R lateral.' },
    ],
    fixacao: [
      'No BRE tudo é discordante — o supra de V1–V3 é fisiológico, não infarto.',
      'Sgarbossa: concordante ≥1 mm, infra em V1–V3 ≥1 mm, discordante ≥5 mm (ou ST/S ≤ −0,25).',
      'BRE raramente é normal: procure a cardiopatia estrutural por trás dele.',
    ],
  },

  lafb: {
    emUmaFrase:
      'O fascículo anterossuperior esquerdo não conduz: o eixo do QRS gira acentuadamente para a esquerda, com qR em DI/aVL e rS em DII/DIII/aVF, sem alargar o QRS.',
    secoes: [
      {
        titulo: 'A anatomia que explica o desvio do eixo',
        texto:
          'O ramo esquerdo se divide em dois fascículos principais: o anterossuperior, fino, longo e irrigado por um único vaso — portanto vulnerável — que se dirige à parede anterolateral e à região superior do ventrículo esquerdo; e o posteroinferior, curto, espesso e com irrigação dupla, dirigido à parede inferoposterior. Quando o anterossuperior é bloqueado, a ativação começa pela região inferoposterior (pelo fascículo posterior íntegro) e só depois alcança a região anterossuperior, por propagação lenta. O vetor resultante final aponta para cima e para a esquerda: eixo entre −45° e −90°. Como a ativação ainda usa boa parte do sistema especializado, o QRS permanece estreito ou apenas discretamente alargado (abaixo de 120 ms).',
      },
      {
        titulo: 'Os critérios que evitam falso-positivos',
        texto:
          'Eixo do QRS entre −45° e −90°; padrão qR em DI e aVL; padrão rS em DII, DIII e aVF, com a onda S de DIII mais profunda que a de DII; duração do QRS abaixo de 120 ms; tempo de ativação ventricular em aVL maior que 45 ms. Antes de firmar o diagnóstico, é obrigatório excluir outras causas de desvio do eixo para a esquerda, sobretudo o infarto inferior antigo (que produz ondas Q em DII, DIII e aVF, e não ondas r iniciais), a hipertrofia ventricular esquerda e o coração horizontalizado em obesos e gestantes. Também vale lembrar que o hemibloqueio anterior pode reduzir a amplitude das ondas R nas precordiais direitas, criando uma falsa impressão de progressão pobre de R e simulando infarto anterior antigo.',
      },
      {
        titulo: 'Significado clínico',
        texto:
          'É o distúrbio de condução intraventricular mais comum, presente em cerca de 4% dos idosos, e isoladamente costuma ter pouco significado prognóstico. Associa-se a hipertensão, doença coronariana, doença degenerativa do sistema de condução, miocardiopatias, estenose aórtica calcificada e doença de Chagas. A relevância aumenta quando se combina a outros bloqueios: com bloqueio de ramo direito forma o bloqueio bifascicular, e a soma com BAV de primeiro grau configura o padrão frequentemente chamado de trifascicular. Isolado e assintomático, não requer tratamento nem restrição; sua principal utilidade prática é ser reconhecido para não ser confundido com infarto inferior antigo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Eixo', achado: 'Entre −45° e −90° — desvio acentuado para a esquerda, o achado central.' },
      { onda: 'DI e aVL', achado: 'Padrão qR, com onda R dominante.' },
      { onda: 'DII, DIII e aVF', achado: 'Padrão rS, com S de DIII mais profunda que a de DII.' },
      { onda: 'QRS', achado: 'Abaixo de 120 ms — o hemibloqueio não alarga significativamente o complexo.' },
      { onda: 'Precordiais', achado: 'Pode haver redução da amplitude de R em V1–V3, simulando progressão pobre.' },
    ],
    roteiro: [
      'Olhe DI e aVF: DI positivo e aVF negativo indicam desvio à esquerda.',
      'Quantifique o eixo: entre −45° e −90°.',
      'Confirme qR em DI/aVL e rS em DII/DIII/aVF.',
      'Meça o QRS: deve estar abaixo de 120 ms.',
      'Exclua infarto inferior antigo procurando ondas Q (e não r) nas inferiores.',
    ],
    separando: [
      { de: 'Infarto inferior antigo', chave: 'Ondas Q patológicas em DII, DIII e aVF; no hemibloqueio há onda r inicial.' },
      { de: 'Hemibloqueio posterior', chave: 'É o espelho: eixo para a direita, com rS em DI e qR nas inferiores.' },
      { de: 'Hipertrofia ventricular esquerda', chave: 'Critérios de voltagem elevados, sem o padrão rS típico das inferiores.' },
      { de: 'Bloqueio de ramo esquerdo', chave: 'No BRE o QRS é maior ou igual a 120 ms com R entalhada em V6.' },
    ],
    fixacao: [
      'Eixo muito à esquerda com QRS estreito: pense primeiro em hemibloqueio anterior.',
      'qR em DI/aVL e rS nas inferiores é a assinatura.',
      'A onda r inicial nas inferiores é o que o separa do infarto inferior antigo.',
    ],
  },

  bifascicular: {
    emUmaFrase:
      'Bloqueio de ramo direito somado a hemibloqueio anterior esquerdo: dois dos três caminhos para o ventrículo estão interrompidos, e toda a condução depende do fascículo posteroinferior.',
    secoes: [
      {
        titulo: 'A conta dos três fascículos',
        texto:
          'Abaixo do feixe de His, o impulso pode alcançar os ventrículos por três vias: o ramo direito, o fascículo anterossuperior esquerdo e o fascículo posteroinferior esquerdo. No bloqueio bifascicular clássico, duas delas estão comprometidas — o ramo direito e o fascículo anterior — e todo o coração passa a depender do fascículo posteroinferior, que é o mais robusto e mais bem irrigado dos três. Essa é ao mesmo tempo a explicação de por que muitos pacientes permanecem estáveis por anos e a razão da preocupação: se o último fascículo falhar, o resultado é bloqueio atrioventricular completo com escape ventricular lento e instável.',
      },
      {
        titulo: 'Como reconhecer no traçado',
        texto:
          'A leitura é a soma de dois conjuntos de critérios. Do bloqueio de ramo direito: QRS maior ou igual a 120 ms, padrão rSR′ em V1 e onda S larga em DI e V6. Do hemibloqueio anterior: eixo entre −45° e −90°, qR em DI e aVL, rS em DII, DIII e aVF. Ver os dois no mesmo traçado fecha o diagnóstico. Vale registrar que a combinação de bloqueio de ramo direito com desvio de eixo para a esquerda é bem mais comum que a combinação com hemibloqueio posterior, porque o fascículo anterior é fino e tem irrigação única, enquanto o posterior é espesso e recebe suprimento duplo.',
      },
      {
        titulo: 'Quando o achado se torna urgente',
        texto:
          'Isolado e assintomático, o bloqueio bifascicular tem taxa de progressão para bloqueio total relativamente baixa (na ordem de 1% a 2% ao ano), e não indica marca-passo por si só. O quadro muda radicalmente quando existe síncope. Síncope inexplicada em paciente com bloqueio bifascicular é considerada, até prova em contrário, bloqueio atrioventricular paroxístico — e essa combinação é indicação de investigação agressiva ou de marca-passo. As opções incluem estudo eletrofisiológico com medida do intervalo HV (valores acima de 70 ms, e sobretudo acima de 100 ms, indicam alto risco), monitor cardíaco implantável para documentar o evento, ou implante empírico de marca-passo, conforme o cenário clínico. Outro contexto de urgência é o bloqueio bifascicular NOVO em infarto agudo anterior: indica necrose septal extensa, alto risco de bloqueio total e mortalidade elevada.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS', achado: 'Maior ou igual a 120 ms, com padrão rSR′ em V1 (bloqueio de ramo direito).' },
      { onda: 'DI e V6', achado: 'Onda S larga e arrastada, completando o padrão de bloqueio de ramo direito.' },
      { onda: 'Eixo', achado: 'Entre −45° e −90°, indicando o hemibloqueio anterior associado.' },
      { onda: 'DII, DIII e aVF', achado: 'Padrão rS, com S de DIII mais profunda que a de DII.' },
      { onda: 'Intervalo PR', achado: 'Se prolongado, configura o padrão comumente chamado de trifascicular.' },
    ],
    roteiro: [
      'Confirme o bloqueio de ramo direito em V1 e V6.',
      'Calcule o eixo: desviado para a esquerda além de −45°.',
      'Confirme qR em DI/aVL e rS nas inferiores.',
      'Meça o PR: prolongado agrega mais um andar de doença.',
      'Pergunte sobre síncope — a resposta muda completamente a conduta.',
    ],
    separando: [
      { de: 'BRD isolado', chave: 'Sem desvio acentuado do eixo para a esquerda.' },
      { de: 'BRD + hemibloqueio posterior', chave: 'Eixo desviado para a DIREITA, com rS em DI e qR nas inferiores.' },
      { de: 'Bloqueio de ramo esquerdo', chave: 'No BRE não há rSR′ em V1 nem S larga em V6.' },
      { de: 'Infarto inferior + BRD', chave: 'Procure ondas Q patológicas nas inferiores em vez de ondas r iniciais.' },
    ],
    fixacao: [
      'Dois fascículos bloqueados, um sustentando o coração inteiro.',
      'Síncope + bloqueio bifascicular = pense em BAV paroxístico e investigue com urgência.',
      'Bifascicular novo em infarto anterior é sinal de necrose septal extensa.',
    ],
  },

  lpfb: {
    emUmaFrase:
      'O fascículo posteroinferior esquerdo não conduz: eixo desviado para a direita, rS em DI e aVL, qR em DII, DIII e aVF, com QRS estreito — e sempre por exclusão.',
    secoes: [
      {
        titulo: 'Por que é raro',
        texto:
          'O fascículo posteroinferior é curto, espesso e recebe irrigação de dois territórios coronarianos, o que o torna notavelmente resistente. Seu bloqueio isolado é, portanto, incomum, e quando ocorre costuma indicar doença extensa do sistema de condução ou lesão significativa. A ativação passa a começar pela região anterossuperior, conduzida pelo fascículo anterior íntegro, e só depois alcança a região inferoposterior — o vetor resultante aponta para baixo e para a direita, produzindo o desvio do eixo característico, entre +90° e +180°.',
      },
      {
        titulo: 'Um diagnóstico de exclusão',
        texto:
          'Esta é a regra mais importante deste padrão: o desvio do eixo para a direita tem causas muito mais comuns que o hemibloqueio posterior, e todas precisam ser afastadas antes. São elas: biotipo longilíneo e coração verticalizado, hipertrofia ventricular direita, doença pulmonar crônica com cor pulmonale, tromboembolismo pulmonar agudo, infarto lateral (que elimina forças laterais e desloca o eixo), dextrocardia e troca de eletrodos dos membros. Só depois de excluir essas possibilidades, e com achados eletrocardiográficos compatíveis, o hemibloqueio posterior deve ser diagnosticado. Os critérios são: eixo entre +90° e +180°, padrão rS em DI e aVL, padrão qR em DII, DIII e aVF, QRS abaixo de 120 ms e ausência de outra causa de desvio à direita.',
      },
      {
        titulo: 'Relevância clínica',
        texto:
          'Isolado, é raro e geralmente reflete doença degenerativa avançada do sistema de condução, doença coronariana significativa ou miocardiopatia. Sua maior importância prática está na associação com bloqueio de ramo direito, formando o bloqueio bifascicular do tipo mais preocupante: como o fascículo posterior é o mais resistente, seu comprometimento sinaliza doença mais extensa, e o risco de progressão para bloqueio atrioventricular total é considerado maior do que na combinação com hemibloqueio anterior. Nesse contexto, síncope torna a investigação urgente e a indicação de marca-passo mais provável.',
      },
    ],
    ondaAOnda: [
      { onda: 'Eixo', achado: 'Entre +90° e +180° — desvio para a direita.' },
      { onda: 'DI e aVL', achado: 'Padrão rS, com onda S dominante.' },
      { onda: 'DII, DIII e aVF', achado: 'Padrão qR, com onda R dominante.' },
      { onda: 'QRS', achado: 'Abaixo de 120 ms.' },
      { onda: 'Contexto', achado: 'Obrigatoriamente sem hipertrofia de VD, doença pulmonar, infarto lateral ou biotipo longilíneo.' },
    ],
    roteiro: [
      'Identifique o desvio do eixo para a direita (DI negativo, aVF positivo).',
      'Confirme rS em DI/aVL e qR nas inferiores.',
      'Meça o QRS: abaixo de 120 ms.',
      'Exclua hipertrofia de VD, DPOC, TEP, infarto lateral, longilíneo e troca de eletrodos.',
      'Verifique se há bloqueio de ramo direito associado.',
    ],
    separando: [
      { de: 'Hipertrofia ventricular direita', chave: 'R dominante em V1, sinais de sobrecarga direita e P pulmonale.' },
      { de: 'Infarto lateral', chave: 'Ondas Q em DI e aVL com contexto clínico e evolução compatíveis.' },
      { de: 'Troca de eletrodos dos membros', chave: 'P negativa em DI e o padrão se corrige ao refazer o exame.' },
      { de: 'Hemibloqueio anterior', chave: 'É o espelho: eixo para a esquerda, qR em DI/aVL e rS nas inferiores.' },
    ],
    fixacao: [
      'Hemibloqueio posterior é diagnóstico de exclusão — sempre.',
      'Fascículo posterior é grosso e bem irrigado: seu bloqueio indica doença séria.',
      'É o espelho exato do hemibloqueio anterior.',
    ],
  },

  'bifascicular-hpe': {
    emUmaFrase:
      'Bloqueio de ramo direito somado a hemibloqueio posterior esquerdo: a combinação bifascicular mais rara e de maior risco, porque compromete o fascículo mais resistente.',
    secoes: [
      {
        titulo: 'Por que essa combinação preocupa mais',
        texto:
          'O fascículo posteroinferior é curto, espesso e recebe irrigação de dois territórios coronarianos. Para bloqueá-lo, é necessária doença mais difusa ou lesão mais significativa do que a que basta para comprometer o fascículo anterior, fino e de irrigação única. Quando isso se soma ao bloqueio do ramo direito, resta apenas o fascículo anterossuperior — o mais frágil dos três — sustentando toda a condução ventricular. A taxa de progressão para bloqueio atrioventricular total é considerada maior nesta combinação, e o limiar para investigação e para indicação de marca-passo é correspondentemente mais baixo.',
      },
      {
        titulo: 'Leitura do traçado',
        texto:
          'A soma dos dois conjuntos de critérios: bloqueio de ramo direito (QRS maior ou igual a 120 ms, rSR′ em V1, S larga em DI e V6) e hemibloqueio posterior (eixo entre +90° e +180°, rS em DI e aVL, qR em DII, DIII e aVF). Como sempre que se cogita hemibloqueio posterior, é indispensável excluir as causas comuns de desvio do eixo à direita — hipertrofia ventricular direita, doença pulmonar crônica, tromboembolismo pulmonar, infarto lateral, biotipo longilíneo e troca de eletrodos. Um cuidado adicional: o próprio bloqueio de ramo direito com sobrecarga de ventrículo direito pode desviar o eixo, o que torna a distinção mais difícil e reforça a necessidade de correlação clínica.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Assintomático: acompanhamento clínico, ECG seriado, investigação de cardiopatia estrutural e isquêmica. Com síncope inexplicada: tratar como bloqueio atrioventricular paroxístico até prova em contrário — estudo eletrofisiológico com medida do intervalo HV, monitor cardíaco implantável ou implante de marca-passo, dependendo do risco. Em contexto de infarto agudo, sobretudo anterior, o surgimento novo desse padrão indica necrose septal extensa, risco elevado de bloqueio total e necessidade de monitorização em unidade coronariana com marca-passo em prontidão. Suspender fármacos bloqueadores do nó AV e corrigir eletrólitos são medidas obrigatórias em qualquer cenário.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS', achado: 'Maior ou igual a 120 ms com padrão rSR′ em V1.' },
      { onda: 'DI e V6', achado: 'Onda S larga e arrastada (bloqueio de ramo direito).' },
      { onda: 'Eixo', achado: 'Desviado para a direita, entre +90° e +180°.' },
      { onda: 'DII, DIII e aVF', achado: 'Padrão qR, indicando o hemibloqueio posterior.' },
      { onda: 'Intervalo PR', achado: 'Se prolongado, soma mais um nível de comprometimento da condução.' },
    ],
    roteiro: [
      'Confirme bloqueio de ramo direito em V1 e V6.',
      'Calcule o eixo: desviado para a direita.',
      'Confirme rS em DI/aVL e qR nas inferiores.',
      'Exclua causas alternativas de eixo à direita.',
      'Investigue síncope, isquemia e cardiopatia estrutural.',
    ],
    separando: [
      { de: 'BRD + hemibloqueio anterior', chave: 'Eixo desviado para a ESQUERDA — combinação mais comum e de menor risco relativo.' },
      { de: 'Hipertrofia ventricular direita com BRD', chave: 'Sinais de sobrecarga direita, P pulmonale e contexto de doença pulmonar.' },
      { de: 'TEP agudo', chave: 'Quadro clínico agudo, S1Q3T3, taquicardia e T invertida em V1–V4.' },
    ],
    fixacao: [
      'É a combinação bifascicular mais rara — e a mais preocupante.',
      'Restou o fascículo mais fino sustentando o coração.',
      'Síncope aqui é bandeira vermelha imediata.',
    ],
  },

  trifascicular: {
    emUmaFrase:
      'Bloqueio bifascicular somado a BAV de primeiro grau: os três caminhos mostram comprometimento, embora o termo “trifascicular” seja, a rigor, impreciso.',
    secoes: [
      {
        titulo: 'O que o termo realmente significa',
        texto:
          'Na prática clínica, chama-se de bloqueio trifascicular o achado de bloqueio bifascicular (habitualmente ramo direito mais um hemibloqueio) acompanhado de prolongamento do intervalo PR. O raciocínio implícito é de que o atraso adicional representaria condução lentificada no terceiro fascículo. A crítica válida é que o PR prolongado pode decorrer de atraso no nó AV, e não no fascículo remanescente — e apenas o estudo eletrofisiológico, medindo o intervalo HV, é capaz de localizar o atraso com precisão. Verdadeiro bloqueio trifascicular alternante — quando o traçado mostra, em momentos diferentes, bloqueio de ramo direito e bloqueio de ramo esquerdo, ou hemibloqueios alternantes — é achado muito mais específico de doença grave do sistema His-Purkinje e indicação forte de marca-passo.',
      },
      {
        titulo: 'Leitura do traçado',
        texto:
          'Procure três elementos: bloqueio de ramo (rSR′ em V1 com S larga em V6 para o direito, ou R entalhada em V6 sem q septal para o esquerdo), desvio de eixo compatível com hemibloqueio (para a esquerda no anterior, para a direita no posterior) e intervalo PR acima de 200 ms. Em traçados seriados, atente para alternância de padrões de bloqueio — é o achado de maior peso. Também merece registro o bloqueio de ramo alternante batimento a batimento, situação de altíssimo risco.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Assintomático com o padrão clássico (bifascicular mais PR longo): acompanhamento, ECG seriado, investigação de cardiopatia estrutural e revisão de fármacos bloqueadores do nó AV. Sintomático — sobretudo com síncope — ou com bloqueio de ramo alternante documentado: indicação de marca-passo definitivo, dada a probabilidade elevada de bloqueio atrioventricular completo. Estudo eletrofisiológico com medida do HV auxilia nos casos duvidosos: HV acima de 70 ms sugere risco aumentado, e acima de 100 ms é considerado indicação de estimulação mesmo sem sintomas claros. Como sempre, causas reversíveis precisam ser afastadas antes: fármacos, isquemia aguda, hipercalemia, hipotireoidismo, doença de Lyme e processos infiltrativos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Intervalo PR', achado: 'Maior que 200 ms — o componente que se soma ao bifascicular.' },
      { onda: 'QRS', achado: 'Maior ou igual a 120 ms, com padrão de bloqueio de ramo.' },
      { onda: 'Eixo', achado: 'Desviado, indicando o hemibloqueio associado.' },
      { onda: 'Alternância', achado: 'Bloqueios de ramo alternantes em traçados seriados indicam doença grave do His-Purkinje.' },
      { onda: 'Ritmo', achado: 'Sinusal com relação 1:1 preservada; a progressão para bloqueio avançado é o risco central.' },
    ],
    roteiro: [
      'Identifique o bloqueio de ramo.',
      'Calcule o eixo e identifique o hemibloqueio.',
      'Meça o PR: acima de 200 ms completa o padrão.',
      'Compare com traçados anteriores procurando alternância de bloqueios.',
      'Pergunte sobre síncope e considere estudo eletrofisiológico ou marca-passo.',
    ],
    separando: [
      { de: 'Bloqueio bifascicular isolado', chave: 'PR normal; menor grau de comprometimento.' },
      { de: 'BAV de 1º grau isolado', chave: 'PR longo com QRS estreito e eixo normal.' },
      { de: 'BAV total', chave: 'Ausência completa de relação entre P e QRS.' },
    ],
    fixacao: [
      'O termo é impreciso: só o estudo eletrofisiológico localiza o atraso com certeza.',
      'Bloqueio de ramo ALTERNANTE é o achado que realmente indica marca-passo.',
      'Síncope transforma um achado de acompanhamento em indicação de dispositivo.',
    ],
  },

  'rbbb-incomplete': {
    emUmaFrase:
      'Mesma morfologia do bloqueio de ramo direito, mas com QRS entre 110 e 120 ms: atraso parcial da condução, muito frequentemente uma variante do normal.',
    secoes: [
      {
        titulo: 'Atraso, não bloqueio',
        texto:
          'O bloqueio incompleto de ramo direito representa lentificação da condução pelo ramo direito, e não sua interrupção. O ventrículo direito ainda é ativado pelo sistema especializado, apenas com atraso, e por isso a morfologia lembra o bloqueio completo — padrão rSR′ em V1 — mas o alargamento do QRS é discreto, ficando entre 110 e 120 ms. Em crianças, adolescentes e adultos jovens magros, o padrão é extremamente comum e considerado variante do normal. Muitas vezes reflete apenas a ativação tardia da crista supraventricular, uma região do ventrículo direito que normalmente despolariza por último.',
      },
      {
        titulo: 'Quando não é apenas variante',
        texto:
          'O padrão adquire significado quando acompanha sinais de sobrecarga do ventrículo direito ou surge em contexto clínico sugestivo. A associação clássica é a comunicação interatrial: o padrão rSR′ em V1 com sobrecarga de volume do ventrículo direito é achado quase esperado nesses pacientes, e sua presença em jovem com sopro sistólico e desdobramento fixo da segunda bulha deve motivar ecocardiograma. Outras situações: doença pulmonar crônica, tromboembolismo pulmonar (em que pode ser agudo e transitório), hipertensão pulmonar, atletas com remodelamento fisiológico do ventrículo direito e displasia arritmogênica do ventrículo direito, esta última exigindo atenção especial em jovens com arritmia ventricular ou síncope.',
      },
      {
        titulo: 'O diferencial que não pode passar',
        texto:
          'Um padrão rSR′ em V1 e V2 obriga a olhar para o segmento ST. Se houver supradesnivelamento com formato em cúpula (coved), descendendo para uma onda T negativa, o diagnóstico a considerar é síndrome de Brugada tipo 1, e não bloqueio incompleto — situação com risco de morte súbita e conduta inteiramente diferente. Também é preciso lembrar que eletrodos precordiais posicionados um ou dois espaços intercostais acima do correto podem criar um falso padrão rSR′ ou acentuar um existente. Refazer o exame com posicionamento cuidadoso resolve boa parte das dúvidas.',
      },
    ],
    ondaAOnda: [
      { onda: 'QRS', achado: 'Entre 110 e 120 ms — mais largo que o normal, mas sem atingir o critério de bloqueio completo.' },
      { onda: 'V1', achado: 'Padrão rSR′ ou rsr′, geralmente com R′ de amplitude modesta.' },
      { onda: 'DI e V6', achado: 'Onda S presente, porém menos larga e menos arrastada que no bloqueio completo.' },
      { onda: 'ST e T', achado: 'Habitualmente normais; supradesnivelamento em cúpula muda o diagnóstico para Brugada.' },
      { onda: 'Contexto', achado: 'Comum e benigno em jovens e atletas; investigue se houver sinais de sobrecarga direita.' },
    ],
    roteiro: [
      'Reconheça o padrão rSR′ em V1.',
      'Meça o QRS: entre 110 e 120 ms define o incompleto.',
      'Olhe o segmento ST em V1–V2 para excluir padrão de Brugada.',
      'Procure sinais de sobrecarga de ventrículo direito.',
      'Confirme o posicionamento dos eletrodos precordiais.',
    ],
    separando: [
      { de: 'BRD completo', chave: 'QRS maior ou igual a 120 ms com S nitidamente larga em DI e V6.' },
      { de: 'Síndrome de Brugada tipo 1', chave: 'Supradesnivelamento em cúpula seguido de T negativa em V1–V2.' },
      { de: 'Eletrodos mal posicionados', chave: 'Padrão desaparece ao reposicionar V1 e V2 no quarto espaço intercostal.' },
      { de: 'Hipertrofia de VD', chave: 'R dominante em V1 com desvio do eixo à direita e sinais de sobrecarga.' },
    ],
    fixacao: [
      'Em jovem magro e assintomático, quase sempre é variante do normal.',
      'rSR′ em V1 pede sempre uma olhada no segmento ST — Brugada mora ali.',
      'Eletrodo alto demais cria rSR′ falso: confira o posicionamento.',
    ],
  },
}

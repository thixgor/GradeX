import type { DeepDiveMap } from './types'

/** Isquemia, infarto e seus grandes imitadores. */
export const DEEP_DIVE_ISQUEMIA: DeepDiveMap = {
  'stemi-anterior': {
    emUmaFrase:
      'Supradesnivelamento do ST em V1 a V4 com imagem em espelho nas derivações inferiores: oclusão da artéria descendente anterior, com o septo e a parede anterior em necrose iminente.',
    secoes: [
      {
        titulo: 'Da oclusão ao supradesnivelamento',
        texto:
          'Quando um trombo oclui a artéria descendente anterior, a região por ela irrigada — septo interventricular e parede anterior do ventrículo esquerdo — deixa de receber fluxo. As células isquêmicas perdem a capacidade de manter os gradientes iônicos: o potássio sai, o potencial de repouso fica menos negativo e o platô do potencial de ação encurta. Cria-se uma diferença de potencial entre miocárdio isquêmico e miocárdio sadio — a corrente de lesão — que desloca o segmento ST na direção da área lesada. Como as derivações V1 a V4 estão diretamente sobre a parede anterior, elas registram esse deslocamento como supradesnivelamento. As derivações inferiores, que olham o coração do lado oposto, registram o mesmo fenômeno de costas, produzindo a imagem em espelho: infradesnivelamento em DII, DIII e aVF.',
      },
      {
        titulo: 'Critérios e reconhecimento',
        texto:
          'Os critérios universais exigem supradesnivelamento no ponto J em duas derivações contíguas: maior ou igual a 2,5 mm em homens com menos de 40 anos, 2 mm em homens com 40 anos ou mais e 1,5 mm em mulheres, quando medido em V2 e V3; e 1 mm nas demais derivações. Além do número, importa a morfologia: o supra isquêmico é convexo para cima (em cúpula ou “tombstone”), diferente da concavidade típica da repolarização precoce e da pericardite. A evolução temporal é característica e ajuda a datar o evento: ondas T hiperagudas nos primeiros minutos, supradesnivelamento nas primeiras horas, aparecimento de ondas Q patológicas e inversão da onda T ao longo de horas a dias, e normalização parcial do ST com persistência das ondas Q na fase crônica. Supradesnivelamento persistente por semanas, com ondas Q, sugere aneurisma ventricular.',
      },
      {
        titulo: 'Localizando a lesão dentro da descendente anterior',
        texto:
          'Detalhes do traçado sugerem o nível da oclusão. Supradesnivelamento em V1 a V4 com envolvimento de aVR e bloqueio de ramo direito novo aponta para oclusão proximal, antes do primeiro ramo septal — o pior cenário, com grande área em risco. Supradesnivelamento em V1–V4 acompanhado de elevação em DI e aVL indica comprometimento também do primeiro ramo diagonal. Já um infarto anterior que poupa V1 e apresenta infradesnivelamento nas inferiores sugere oclusão mais distal. Reconhecer esses padrões ajuda a antecipar complicações: oclusões proximais associam-se a maior risco de choque cardiogênico, bloqueios de ramo e bloqueio atrioventricular infra-hissiano, arritmias ventriculares e complicações mecânicas como ruptura septal.',
      },
      {
        titulo: 'O relógio da reperfusão',
        texto:
          'Miocárdio é tempo. A meta é angioplastia primária com tempo porta-balão de até 90 minutos, ou até 120 minutos quando o paciente precisa ser transferido para um centro com hemodinâmica. Se esse prazo não for factível, indica-se trombólise em até 30 minutos da chegada, seguida de transferência para estratégia fármaco-invasiva com coronariografia entre 3 e 24 horas. O tratamento adjuvante inclui antiagregação dupla, anticoagulação e as demais medidas de acordo com as diretrizes. Duas cautelas eletrocardiográficas: nitrato deve ser evitado se houver suspeita de infarto de ventrículo direito, e o ECG deve ser repetido e comparado seriadamente — um traçado inicial não diagnóstico em paciente com dor persistente não exclui oclusão coronariana.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento convexo em V1–V4, com ponto J elevado.' },
      { onda: 'Imagem em espelho', achado: 'Infradesnivelamento em DII, DIII e aVF — confirma que o supra é isquêmico.' },
      { onda: 'Onda T', achado: 'Hiperaguda na fase inicial; inverte-se ao longo da evolução.' },
      { onda: 'Onda Q', achado: 'Surge horas depois, indicando necrose transmural estabelecida.' },
      { onda: 'Progressão de R', achado: 'Perda progressiva da amplitude de R nas precordiais anteriores.' },
      { onda: 'Ritmo', achado: 'Vigie arritmias ventriculares e bloqueios — o infarto anterior tende a bloqueios infra-hissianos.' },
    ],
    roteiro: [
      'Percorra V1 a V4 procurando supradesnivelamento em derivações contíguas.',
      'Avalie a morfologia: convexa favorece isquemia.',
      'Confirme a imagem em espelho nas derivações inferiores.',
      'Procure ondas Q e avalie a progressão de R.',
      'Acione a reperfusão imediatamente e repita o ECG seriadamente.',
    ],
    separando: [
      { de: 'Repolarização precoce', chave: 'Supra côncavo, difuso, com entalhe no ponto J, sem imagem em espelho e estável no tempo.' },
      { de: 'Pericardite', chave: 'Supra difuso côncavo com infradesnivelamento de PR e sem território coronariano definido.' },
      { de: 'Aneurisma ventricular', chave: 'Supra persistente com ondas Q profundas, em paciente sem dor aguda e com ECG antigo idêntico.' },
      { de: 'Bloqueio de ramo esquerdo', chave: 'Aplique os critérios de Sgarbossa antes de concluir.' },
    ],
    fixacao: [
      'Supra convexo em V1–V4 com infra inferior = oclusão da descendente anterior.',
      'A imagem em espelho é o melhor argumento a favor de isquemia.',
      'Tempo é músculo: 90 minutos porta-balão, 120 se houver transferência.',
    ],
  },

  'stemi-inferior': {
    emUmaFrase:
      'Supradesnivelamento em DII, DIII e aVF com infradesnivelamento em DI e aVL: oclusão da coronária direita (ou da circunflexa), com risco de bradiarritmias e de envolvimento do ventrículo direito.',
    secoes: [
      {
        titulo: 'Qual artéria está ocluída',
        texto:
          'A parede inferior é irrigada pela artéria descendente posterior, que se origina da coronária direita em cerca de 85% das pessoas (dominância direita) e da circunflexa nas demais. Duas pistas eletrocardiográficas ajudam a distinguir: se o supradesnivelamento em DIII for maior que o de DII e houver infradesnivelamento em DI e aVL, a culpada é quase sempre a coronária direita, porque o vetor de lesão aponta mais para a direita; se o supra em DII for maior ou igual ao de DIII, e houver supradesnivelamento em DI, aVL, V5 e V6, a circunflexa é mais provável. Essa distinção não é acadêmica: a coronária direita irriga o nó sinusal em cerca de 60% e o nó AV em cerca de 90% das pessoas, além do ventrículo direito — o que explica todo o perfil de complicações do infarto inferior.',
      },
      {
        titulo: 'As derivações que faltam',
        texto:
          'Todo infarto inferior exige duas ampliações do ECG padrão. A primeira é V3R e V4R, para pesquisar infarto de ventrículo direito, presente em até 40% dos casos de oclusão proximal da coronária direita — supradesnivelamento em V4R é o achado mais específico, e deve ser buscado precocemente, pois desaparece em poucas horas. A segunda é V7, V8 e V9, para pesquisar extensão posterior, sugerida por infradesnivelamento em V1 a V3 com ondas R proeminentes. Registrar essas derivações leva menos de dois minutos e muda a conduta imediata: no infarto de ventrículo direito, o paciente é dependente de pré-carga, e nitrato, morfina e diuréticos podem causar hipotensão profunda; o tratamento inicial da hipotensão é volume.',
      },
      {
        titulo: 'Bradiarritmias e o reflexo de Bezold-Jarisch',
        texto:
          'Bradicardia sinusal e bloqueios atrioventriculares são frequentes no infarto inferior, por dois mecanismos: isquemia direta do nó sinusal e do nó AV, irrigados pela coronária direita, e aumento do tônus vagal desencadeado por receptores da parede inferoposterior — o reflexo de Bezold-Jarisch, que produz bradicardia, hipotensão e vasodilatação. Diferentemente do infarto anterior, o bloqueio atrioventricular aqui costuma ser nodal, com escape juncional de QRS estreito, responsivo à atropina e habitualmente transitório, resolvendo-se com a reperfusão. Isso não significa ausência de risco: bloqueio de alto grau no contexto de infarto inferior identifica infarto de maior extensão e requer monitorização e, às vezes, marca-passo provisório.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Reperfusão imediata, com os mesmos prazos do infarto anterior. Antes de administrar nitrato, verificar V4R e a pressão arterial. Na hipotensão associada a infarto de ventrículo direito, expandir com cristaloide e evitar vasodilatadores e diuréticos; se necessário, usar inotrópico. Monitorização contínua pelas bradiarritmias, com atropina disponível e marca-passo transcutâneo em prontidão. Vale lembrar que uma proporção significativa dos infartos inferiores tem componente posterior ou de ventrículo direito não reconhecido justamente por não se registrarem as derivações adicionais — e que essa omissão é uma das causas mais comuns de subestimação da extensão do infarto.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento em DII, DIII e aVF; compare a magnitude entre DIII e DII.' },
      { onda: 'Imagem em espelho', achado: 'Infradesnivelamento em DI e aVL — altamente sugestivo de oclusão da coronária direita.' },
      { onda: 'V4R', achado: 'Supradesnivelamento indica infarto de ventrículo direito — registre sempre e precocemente.' },
      { onda: 'V1–V3', achado: 'Infradesnivelamento com R proeminente sugere extensão posterior; registre V7–V9.' },
      { onda: 'Ritmo', achado: 'Bradicardia sinusal e bloqueios AV nodais são frequentes e geralmente transitórios.' },
    ],
    roteiro: [
      'Confirme supra em DII, DIII e aVF.',
      'Compare DIII e DII e veja se há infra em DI e aVL.',
      'Registre V3R–V4R imediatamente.',
      'Registre V7–V9 se houver infra em V1–V3.',
      'Cuidado com nitrato; monitorize bradiarritmias e acione a reperfusão.',
    ],
    separando: [
      { de: 'Pericardite', chave: 'Supra difuso, sem imagem em espelho, com infradesnivelamento de PR.' },
      { de: 'Hemibloqueio anterior', chave: 'Ondas r iniciais nas inferiores, e não ondas Q com supra.' },
      { de: 'Repolarização precoce inferior', chave: 'Supra côncavo estável, sem reciprocidade e sem evolução.' },
    ],
    fixacao: [
      'Infarto inferior pede V4R e V7–V9 — sempre.',
      'DIII maior que DII com infra em DI/aVL = coronária direita.',
      'Hipotensão no infarto inferior: pense em VD e dê volume, não nitrato.',
    ],
  },

  'stemi-lateral': {
    emUmaFrase:
      'Supradesnivelamento em DI, aVL, V5 e V6 com imagem em espelho nas derivações inferiores: comprometimento da parede lateral, geralmente por circunflexa ou ramo diagonal.',
    secoes: [
      {
        titulo: 'Anatomia e territórios',
        texto:
          'A parede lateral do ventrículo esquerdo é irrigada pela artéria circunflexa e por ramos diagonais da descendente anterior. As derivações que a enxergam são DI e aVL (parede lateral alta) e V5 e V6 (parede lateral baixa ou apical). O padrão de supradesnivelamento nessas derivações, com infradesnivelamento recíproco em DII, DIII e aVF, define o infarto lateral. Quando o supra aparece apenas em DI e aVL, com infra em DIII e aVF, fala-se em infarto lateral alto, frequentemente por oclusão do primeiro ramo diagonal — um padrão facilmente subestimado porque envolve poucas derivações e amplitudes modestas.',
      },
      {
        titulo: 'O território eleitoralmente silencioso',
        texto:
          'A circunflexa é conhecida como a artéria “silenciosa” do eletrocardiograma: suas oclusões produzem alterações discretas ou ausentes no ECG de 12 derivações em uma proporção significativa dos casos, o que atrasa o diagnóstico e a reperfusão. Por isso, diante de dor torácica típica com ECG pouco alterado, três atitudes aumentam a acurácia: procurar infradesnivelamento em V1 a V3 com ondas R proeminentes (sinal de comprometimento posterior, território frequentemente da circunflexa); registrar V7, V8 e V9; e repetir o ECG seriadamente. Ecocardiograma à beira do leito, mostrando alteração segmentar da contratilidade, também é um recurso valioso nesses casos.',
      },
      {
        titulo: 'Conduta e evolução',
        texto:
          'A abordagem é a de qualquer infarto com supradesnivelamento: reperfusão com angioplastia primária dentro dos prazos recomendados, ou trombólise seguida de estratégia fármaco-invasiva quando a angioplastia não é factível a tempo, além da terapia antitrombótica e das medidas de suporte. Do ponto de vista evolutivo, o infarto lateral tende a produzir ondas Q em DI, aVL, V5 e V6 e, na fase crônica, perda de forças laterais que pode desviar o eixo para a direita. Complicações incluem insuficiência mitral por disfunção de músculo papilar e, na oclusão de circunflexa dominante, extensão inferior e posterior significativas.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento em DI, aVL, V5 e V6.' },
      { onda: 'Imagem em espelho', achado: 'Infradesnivelamento em DII, DIII e aVF.' },
      { onda: 'V1–V3', achado: 'Infradesnivelamento com R proeminente sugere extensão posterior — registre V7–V9.' },
      { onda: 'Onda Q', achado: 'Aparece nas mesmas derivações laterais na evolução.' },
      { onda: 'Amplitudes', achado: 'Alterações frequentemente sutis — repita o traçado e compare com o anterior.' },
    ],
    roteiro: [
      'Procure supra em DI, aVL, V5 e V6.',
      'Confirme a imagem em espelho nas derivações inferiores.',
      'Avalie V1–V3 para extensão posterior e registre V7–V9.',
      'Repita o ECG a cada 10–15 minutos se a dor persistir.',
      'Acione reperfusão e considere ecocardiograma à beira do leito.',
    ],
    separando: [
      { de: 'Pericardite', chave: 'Supra difuso sem território definido e sem imagem em espelho.' },
      { de: 'Hipertrofia ventricular esquerda', chave: 'Alterações de repolarização proporcionais à voltagem, sem evolução aguda.' },
      { de: 'Repolarização precoce', chave: 'Supra côncavo estável, comum em jovens, sem reciprocidade.' },
    ],
    fixacao: [
      'A circunflexa é a artéria silenciosa: dor típica com ECG pobre exige V7–V9.',
      'DI e aVL com infra em DIII e aVF é o padrão lateral alto do ramo diagonal.',
      'Repetir o ECG é um exame diagnóstico, não uma formalidade.',
    ],
  },

  'stemi-posterior': {
    emUmaFrase:
      'Nenhuma derivação padrão olha diretamente a parede posterior: o infarto aparece em espelho, como infradesnivelamento em V1 a V3 com ondas R altas — e só se confirma em V7 a V9.',
    secoes: [
      {
        titulo: 'A imagem em espelho como diagnóstico',
        texto:
          'O eletrocardiograma de 12 derivações não possui eletrodos posteriores. Quando a parede posterior (ou inferobasal) infarta, o vetor de lesão aponta para trás, afastando-se de V1 a V3 — e essas derivações registram a imagem invertida do que aconteceria se elas estivessem do outro lado. Assim, o supradesnivelamento posterior aparece como infradesnivelamento em V1–V3; a onda Q de necrose aparece como onda R alta e larga; e a inversão da onda T aparece como onda T positiva e proeminente. Reconhecer essa inversão mental é o que permite fazer o diagnóstico com o traçado padrão. O raciocínio prático é: infradesnivelamento em V1–V3 com R dominante e T positiva, especialmente se a relação R/S em V2 for maior que 1, deve ser tratado como infarto posterior até prova em contrário.',
      },
      {
        titulo: 'A confirmação: derivações V7, V8 e V9',
        texto:
          'A confirmação exige eletrodos nas costas, no mesmo plano horizontal de V6: V7 na linha axilar posterior, V8 na linha médio-escapular e V9 na borda paravertebral esquerda. Nessas derivações, o critério de supradesnivelamento é mais baixo — 0,5 mm é suficiente em duas derivações contíguas (0,5 mm em homens com menos de 40 anos, e valores igualmente baixos nas demais faixas) — porque a distância entre o coração e o eletrodo atenua o sinal. Esse detalhe é essencial: aplicar o critério de 1 mm em V7–V9 leva a falsos negativos e a perda de indicação de reperfusão.',
      },
      {
        titulo: 'Por que esse diagnóstico muda o desfecho',
        texto:
          'O infarto posterior isolado responde por cerca de 3% a 4% dos infartos e, com frequência, é classificado erroneamente como “infarto sem supradesnivelamento” — o que significa não acionar a reperfusão imediata a que o paciente teria direito. Como habitualmente decorre de oclusão da circunflexa ou de ramo marginal obtuso, o território comprometido pode ser extenso. Quando associado a infarto inferior, indica maior área em risco e pior prognóstico. Por isso, a recomendação prática é simples e vale a pena ser incorporada como reflexo: infradesnivelamento em V1–V3 obriga a registrar V7–V9 antes de qualquer conclusão.',
      },
    ],
    ondaAOnda: [
      { onda: 'V1–V3 (ST)', achado: 'Infradesnivelamento horizontal — a imagem em espelho do supra posterior.' },
      { onda: 'V1–V3 (QRS)', achado: 'Ondas R altas e largas, com relação R/S maior que 1 em V2.' },
      { onda: 'V1–V3 (T)', achado: 'Onda T positiva e proeminente — espelho da T invertida posterior.' },
      { onda: 'V7–V9', achado: 'Supradesnivelamento maior ou igual a 0,5 mm confirma o diagnóstico.' },
      { onda: 'Derivações inferiores', achado: 'Frequentemente há infarto inferior associado — avalie DII, DIII e aVF.' },
    ],
    roteiro: [
      'Diante de infra em V1–V3, não conclua nada antes de olhar a morfologia do QRS.',
      'Verifique se há R alta e larga com T positiva.',
      'Registre V7, V8 e V9 imediatamente.',
      'Use o critério de 0,5 mm nessas derivações.',
      'Avalie parede inferior associada e acione reperfusão.',
    ],
    separando: [
      { de: 'Isquemia subendocárdica anterior', chave: 'Infra difuso, sem R alta em V1–V3 e sem supra em V7–V9.' },
      { de: 'Bloqueio de ramo direito', chave: 'R′ com padrão rSR′ e S larga em V6, sem infra de ST associado.' },
      { de: 'Hipertrofia ventricular direita', chave: 'R dominante em V1 com desvio do eixo à direita e sinais de sobrecarga.' },
      { de: 'WPW tipo A', chave: 'PR curto com onda delta positiva em V1.' },
    ],
    fixacao: [
      'Infra em V1–V3 com R alta e T positiva = infarto posterior até prova em contrário.',
      'Critério em V7–V9 é 0,5 mm, não 1 mm.',
      'É o infarto mais subdiagnosticado — e o que mais perde reperfusão por isso.',
    ],
  },

  nstemi: {
    emUmaFrase:
      'Infradesnivelamento horizontal ou descendente do ST e inversão da onda T, sem supradesnivelamento: isquemia subendocárdica, com diagnóstico definido pela curva de troponina.',
    secoes: [
      {
        titulo: 'Por que o subendocárdio sofre primeiro',
        texto:
          'A camada subendocárdica é a mais vulnerável do miocárdio: recebe fluxo predominantemente na diástole, está sujeita à maior tensão parietal e é a mais distante das artérias epicárdicas. Quando a oferta de oxigênio cai — por suboclusão coronariana, trombo não oclusivo, embolia, espasmo — ou quando a demanda sobe (taquiarritmia, anemia grave, sepse, crise hipertensiva, estenose aórtica), é ela que entra em isquemia antes das camadas externas. A corrente de lesão gerada aponta do endocárdio para o centro da cavidade, afastando-se dos eletrodos de superfície: por isso o traçado mostra infradesnivelamento, e não supradesnivelamento.',
      },
      {
        titulo: 'Lendo o infradesnivelamento corretamente',
        texto:
          'A morfologia importa tanto quanto a magnitude. Infradesnivelamento horizontal ou descendente, de pelo menos 0,5 mm em duas derivações contíguas, é o padrão isquêmico. Já o infradesnivelamento ascendente rápido, comum na taquicardia, costuma ser inespecífico. A onda T pode inverter-se de forma simétrica e pontiaguda. Diferentemente do infarto com supradesnivelamento, o infradesnivelamento não localiza bem a artéria culpada — a distribuição das alterações tende a ser difusa. Uma exceção conceitual crucial: infradesnivelamento difuso, mais evidente em DI, DII e V4–V6, associado a supradesnivelamento em aVR, sugere obstrução de tronco de coronária esquerda ou doença triarterial grave, e configura um cenário de alto risco que exige avaliação invasiva precoce e não deve ser tratado como um “NSTEMI comum”.',
      },
      {
        titulo: 'Diagnóstico e estratificação',
        texto:
          'O que separa NSTEMI de angina instável não é o ECG, e sim a troponina: a elevação com curva compatível define infarto. Os protocolos modernos usam troponina ultrassensível com algoritmos de 0 e 1 hora ou 0 e 2 horas, que permitem descartar ou confirmar rapidamente. A estratificação de risco é feita por escores como o GRACE, que orientam o momento da estratégia invasiva: imediata (menos de 2 horas) em pacientes com instabilidade hemodinâmica ou elétrica, dor refratária ou alterações dinâmicas do ST; precoce (em até 24 horas) nos de alto risco; e seletiva nos de baixo risco. O tratamento clínico inclui antiagregação, anticoagulação, antianginosos e estatina de alta potência, conforme as diretrizes.',
      },
      {
        titulo: 'Armadilhas frequentes',
        texto:
          'Primeira: rotular como NSTEMI um infarto posterior — sempre registrar V7 a V9 diante de infra em V1–V3. Segunda: atribuir o infradesnivelamento à digoxina, à hipertrofia ventricular esquerda ou ao bloqueio de ramo sem considerar isquemia sobreposta; nesses casos, a comparação com traçados prévios e a repetição seriada são decisivas. Terceira: esquecer que a isquemia pode ser secundária a uma condição sistêmica — anemia, taquiarritmia, sepse, tireotoxicose —, situação em que o tratamento da causa é parte central do manejo. Quarta: interpretar um ECG normal como exclusão de síndrome coronariana; até um terço dos pacientes com NSTEMI pode ter traçado inicial sem alterações diagnósticas.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Infradesnivelamento horizontal ou descendente, maior ou igual a 0,5 mm em duas derivações contíguas.' },
      { onda: 'Onda T', achado: 'Inversão simétrica, frequentemente profunda; alterações dinâmicas têm alto valor.' },
      { onda: 'aVR', achado: 'Supradesnivelamento com infra difuso sugere tronco de coronária esquerda ou doença triarterial.' },
      { onda: 'V1–V3', achado: 'Infra com R alta obriga a registrar V7–V9 para excluir infarto posterior.' },
      { onda: 'Onda Q', achado: 'Habitualmente ausente na fase aguda; sua presença sugere infarto prévio.' },
    ],
    roteiro: [
      'Identifique o infradesnivelamento e classifique sua morfologia.',
      'Verifique aVR: supra ali com infra difuso muda o nível de urgência.',
      'Registre V7–V9 se houver infra em V1–V3.',
      'Colete troponina seriada segundo o protocolo institucional.',
      'Calcule o risco (GRACE) e defina o momento da estratégia invasiva.',
    ],
    separando: [
      { de: 'Infarto posterior', chave: 'Infra em V1–V3 com R alta e T positiva; confirme com V7–V9.' },
      { de: 'Efeito digitálico', chave: 'Infra em colher de pedreiro, côncavo, com QT curto e contexto de uso de digoxina.' },
      { de: 'Sobrecarga ventricular esquerda', chave: 'Infra assimétrico proporcional à voltagem, estável ao longo do tempo.' },
      { de: 'Isquemia de demanda', chave: 'Taquiarritmia, anemia ou sepse como causa primária; corrija o gatilho e reavalie.' },
    ],
    fixacao: [
      'Infra difuso + supra em aVR = pense em tronco ou triarterial.',
      'A troponina define infarto; o ECG define urgência e localização.',
      'ECG normal não exclui síndrome coronariana aguda.',
    ],
  },

  wellens: {
    emUmaFrase:
      'Ondas T bifásicas ou profundamente invertidas em V2 e V3, em paciente SEM dor no momento do exame: marcador de suboclusão crítica da descendente anterior proximal.',
    secoes: [
      {
        titulo: 'Um padrão de reperfusão, não de oclusão',
        texto:
          'A síndrome de Wellens é um dos conceitos mais elegantes da eletrocardiografia clínica. O padrão aparece tipicamente quando o paciente já não tem dor — é o registro elétrico de um miocárdio que foi isquêmico e foi reperfundido espontaneamente, mas cuja artéria permanece criticamente estenosada. Descrita originalmente em pacientes com angina instável, corresponde a suboclusão proximal da artéria descendente anterior em altíssima proporção dos casos. O detalhe fundamental é justamente a dissociação entre um paciente que parece bem, sem dor, com enzimas normais ou minimamente elevadas, e um traçado que anuncia um infarto anterior extenso iminente.',
      },
      {
        titulo: 'Os dois tipos e os critérios',
        texto:
          'Tipo A (cerca de 25% dos casos): ondas T bifásicas em V2 e V3, com componente inicial positivo e terminal negativo. Tipo B (cerca de 75%): ondas T profunda e simetricamente invertidas em V2 e V3, podendo estender-se a V1 e V4. Os critérios completos exigem: história recente de dor torácica anginosa, ECG registrado em período sem dor, segmento ST isoelétrico ou com elevação mínima (menor que 1 mm), ausência de ondas Q e progressão de R preservada nas precordiais, e marcadores de necrose normais ou apenas discretamente elevados. A preservação da onda R é importante: sua perda indicaria que a necrose já ocorreu.',
      },
      {
        titulo: 'Por que o teste ergométrico é perigoso aqui',
        texto:
          'A conduta correta é coronariografia. Testes provocativos de isquemia — ergometria, ecocardiograma de estresse — são contraindicados nesses pacientes, porque o aumento da demanda em presença de uma estenose crítica proximal da descendente anterior pode desencadear infarto anterior extenso durante o exame. Essa é uma das poucas situações em que o padrão eletrocardiográfico, por si, contraindica formalmente um exame amplamente utilizado. Também é importante lembrar que o padrão pode desaparecer temporariamente se a dor retornar (a onda T pode pseudonormalizar durante um novo episódio isquêmico), o que não significa melhora — pelo contrário.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda T em V2–V3', achado: 'Bifásica (tipo A) ou profundamente invertida e simétrica (tipo B).' },
      { onda: 'Segmento ST', achado: 'Isoelétrico ou com elevação mínima, menor que 1 mm.' },
      { onda: 'Onda Q', achado: 'Ausente — sua presença indicaria necrose já estabelecida.' },
      { onda: 'Progressão de R', achado: 'Preservada nas precordiais.' },
      { onda: 'Contexto', achado: 'Paciente SEM dor no momento do registro, com história de angina recente.' },
    ],
    roteiro: [
      'Olhe V2 e V3 procurando T bifásica ou profundamente invertida.',
      'Confirme que o ST está praticamente isoelétrico.',
      'Verifique ausência de ondas Q e boa progressão de R.',
      'Pergunte: o paciente teve dor recentemente e está sem dor agora?',
      'Encaminhe para coronariografia e NÃO solicite teste de esforço.',
    ],
    separando: [
      { de: 'Isquemia ativa', chave: 'Alterações do ST durante a dor; em Wellens o traçado se manifesta sem dor.' },
      { de: 'Sobrecarga ventricular esquerda', chave: 'T invertida assimétrica nas laterais, com voltagem aumentada.' },
      { de: 'TEP', chave: 'T invertida em V1–V4 com taquicardia, S1Q3T3 e contexto clínico compatível.' },
      { de: 'Padrão de De Winter', chave: 'Infra ascendente com T hiperaguda — este indica oclusão ATIVA e é emergência imediata.' },
    ],
    fixacao: [
      'Paciente sem dor com T bifásica em V2–V3 é uma bomba-relógio da descendente anterior.',
      'Nunca peça ergometria em Wellens.',
      'Preservação da onda R é parte do critério — sua perda muda o diagnóstico.',
    ],
  },

  'de-winter': {
    emUmaFrase:
      'Infradesnivelamento ascendente do ponto J em V1 a V6 continuado por ondas T altas e simétricas, com discreta elevação em aVR: equivalente de oclusão aguda da descendente anterior.',
    secoes: [
      {
        titulo: 'Um padrão sem supradesnivelamento que exige reperfusão',
        texto:
          'O padrão de De Winter foi descrito em pacientes com oclusão total aguda da artéria descendente anterior proximal que, no entanto, não apresentavam supradesnivelamento clássico. Estima-se que ocorra em cerca de 2% dos casos de oclusão dessa artéria. A hipótese fisiopatológica envolve particularidades da condução transmural e do sistema de Purkinje endocárdico em determinados pacientes, que fazem a corrente de lesão manifestar-se como infradesnivelamento ascendente em vez de supradesnivelamento. Clinicamente, o essencial é reconhecer que se trata de oclusão coronariana aguda — e, portanto, de indicação de reperfusão imediata, exatamente como um infarto com supradesnivelamento.',
      },
      {
        titulo: 'Os critérios',
        texto:
          'Infradesnivelamento do ponto J de 1 a 3 mm em V1 a V6, com morfologia ascendente (upsloping); ondas T altas, positivas e simétricas imediatamente após esse infradesnivelamento; ausência de supradesnivelamento nas precordiais; frequentemente supradesnivelamento discreto (0,5 a 1 mm) em aVR; e QRS geralmente estreito e sem ondas Q. O padrão costuma ser estático — permanece enquanto a artéria estiver ocluída — e não evolui para supradesnivelamento, o que contribui para que passe despercebido em traçados seriados por quem espera ver o supra aparecer.',
      },
      {
        titulo: 'O erro que se quer evitar',
        texto:
          'O risco é interpretar o traçado como isquemia subendocárdica comum e conduzir o paciente como síndrome coronariana sem supradesnivelamento, com estratégia invasiva em até 24 horas. Nesse intervalo, o miocárdio anterior está necrosando. Por isso o padrão de De Winter integra a lista dos chamados equivalentes de infarto com supradesnivelamento, ao lado do infarto posterior isolado, do padrão de tronco de coronária esquerda com supra em aVR e infra difuso, e do infarto com bloqueio de ramo esquerdo que preenche critérios de Sgarbossa. Reconhecê-los é o que transforma o eletrocardiograma numa ferramenta de decisão terapêutica, e não apenas descritiva.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ponto J', achado: 'Infradesnivelamento de 1 a 3 mm em V1–V6, com morfologia ascendente.' },
      { onda: 'Onda T', achado: 'Alta, positiva e simétrica, emergindo diretamente do infradesnivelamento.' },
      { onda: 'aVR', achado: 'Supradesnivelamento discreto, de 0,5 a 1 mm.' },
      { onda: 'Supradesnivelamento precordial', achado: 'Ausente — e é justamente isso que torna o padrão traiçoeiro.' },
      { onda: 'QRS', achado: 'Estreito, sem ondas Q — a necrose ainda não se estabeleceu.' },
    ],
    roteiro: [
      'Percorra V1 a V6 procurando infra ascendente do ponto J.',
      'Observe se as ondas T são altas e simétricas logo após o infra.',
      'Confirme discreto supra em aVR.',
      'Reconheça como equivalente de infarto com supradesnivelamento.',
      'Acione reperfusão imediata — não aguarde o supra aparecer.',
    ],
    separando: [
      { de: 'Isquemia subendocárdica comum', chave: 'Infra horizontal ou descendente, sem as T altas e simétricas características.' },
      { de: 'Hipercalemia', chave: 'T apiculadas de base estreita, com P achatada e QRS alargado; dose o potássio.' },
      { de: 'Repolarização precoce', chave: 'Supra côncavo com entalhe no ponto J, sem infra e sem contexto de dor.' },
      { de: 'Síndrome de Wellens', chave: 'T bifásica ou invertida, em paciente SEM dor — padrão de reperfusão, não de oclusão.' },
    ],
    fixacao: [
      'De Winter é oclusão ativa: reperfusão agora, não em 24 horas.',
      'Infra ascendente + T alta e simétrica + supra em aVR é a tríade.',
      'Equivalentes de supra: De Winter, posterior isolado, aVR com infra difuso e Sgarbossa positivo.',
    ],
  },

  pericarditis: {
    emUmaFrase:
      'Supradesnivelamento côncavo difuso, sem território coronariano, acompanhado de infradesnivelamento do segmento PR e de supra de PR em aVR: a inflamação do saco pericárdico vista no papel.',
    secoes: [
      {
        titulo: 'Por que as alterações são difusas',
        texto:
          'O pericárdio envolve todo o coração. A inflamação, portanto, não respeita territórios coronarianos: a corrente de lesão subepicárdica é gerada em quase toda a superfície ventricular, produzindo supradesnivelamento em derivações de múltiplas paredes simultaneamente — inferiores, laterais e precordiais — sem imagem em espelho, exceto em aVR e às vezes em V1, que são os polos opostos ao vetor médio. Esse é o traço mais distintivo em relação ao infarto: no infarto, o supra é regional e obrigatoriamente vem acompanhado de reciprocidade; na pericardite, é difuso e sem reciprocidade.',
      },
      {
        titulo: 'O sinal do PR e os estágios de Spodick',
        texto:
          'A inflamação atinge também o átrio, produzindo uma corrente de lesão atrial que desloca o segmento PR: infradesnivelamento de PR nas derivações em que o QRS é positivo, e supradesnivelamento de PR em aVR — este último considerado bastante específico. A evolução clássica descrita por Spodick tem quatro estágios: estágio I, supradesnivelamento difuso côncavo com alterações do PR; estágio II, normalização do ST e achatamento das ondas T; estágio III, inversão difusa das ondas T; estágio IV, normalização. A progressão pode levar semanas, e nem todos os pacientes percorrem todos os estágios. Um detalhe útil: na pericardite, a inversão da T ocorre depois que o ST já normalizou, enquanto no infarto a T se inverte enquanto o ST ainda está elevado.',
      },
      {
        titulo: 'A razão ST/T e os diferenciais',
        texto:
          'Para distinguir pericardite de repolarização precoce, usa-se a relação entre a altura do supradesnivelamento do ST e a amplitude da onda T em V6 (ou em DI): razão maior que 0,25 favorece pericardite; menor, repolarização precoce. O diferencial mais crítico, no entanto, continua sendo o infarto: diante de supradesnivelamento, a pergunta obrigatória é se existe imagem em espelho e se a distribuição respeita um território arterial. Errar nessa distinção tem consequências graves nos dois sentidos — anticoagular e levar ao cateterismo um paciente com pericardite, ou tratar como pericardite um infarto em evolução. Na dúvida, o ecocardiograma à beira do leito, a curva de troponina e a repetição do ECG orientam.',
      },
      {
        titulo: 'Clínica e tratamento',
        texto:
          'Dor torácica tipicamente pleurítica, que piora ao deitar e melhora ao sentar-se inclinado para a frente, frequentemente precedida de quadro viral. O atrito pericárdico é o achado semiológico clássico, embora intermitente. O tratamento de primeira linha combina anti-inflamatório não esteroidal (ou aspirina em altas doses, preferida quando há infarto recente) com colchicina, que reduz significativamente a recorrência. Corticoide fica reservado a situações específicas por aumentar a taxa de recidiva. É indispensável avaliar derrame pericárdico por ecocardiograma e vigiar sinais de tamponamento — hipotensão, turgência jugular, bulhas abafadas, pulso paradoxal e, no ECG, alternância elétrica com baixa voltagem.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento difuso e côncavo, sem respeitar território coronariano.' },
      { onda: 'Segmento PR', achado: 'Infradesnivelamento difuso, com supradesnivelamento de PR em aVR — bastante específico.' },
      { onda: 'Imagem em espelho', achado: 'Ausente, exceto em aVR e eventualmente V1.' },
      { onda: 'Onda T', achado: 'Inicialmente normal; inverte-se apenas depois que o ST normaliza.' },
      { onda: 'Onda Q', achado: 'Ausente — a pericardite não produz necrose transmural.' },
      { onda: 'Voltagem', achado: 'Baixa voltagem e alternância elétrica sugerem derrame significativo ou tamponamento.' },
    ],
    roteiro: [
      'Verifique se o supra é difuso e côncavo.',
      'Procure ausência de imagem em espelho (exceto aVR).',
      'Procure infradesnivelamento de PR e supra de PR em aVR.',
      'Calcule a razão ST/T em V6 para diferenciar de repolarização precoce.',
      'Solicite ecocardiograma e avalie derrame; inicie AINE ou aspirina com colchicina.',
    ],
    separando: [
      { de: 'Infarto com supradesnivelamento', chave: 'Supra regional, convexo, com imagem em espelho e evolução com ondas Q.' },
      { de: 'Repolarização precoce', chave: 'Razão ST/T em V6 menor que 0,25, entalhe no ponto J, sem alteração de PR.' },
      { de: 'Miocardite', chave: 'Alterações semelhantes com troponina desproporcionalmente elevada e disfunção ventricular.' },
      { de: 'Tamponamento', chave: 'Baixa voltagem com alternância elétrica e quadro hemodinâmico compatível.' },
    ],
    fixacao: [
      'Supra difuso + PR deprimido + sem espelho = pericardite.',
      'Supra de PR em aVR é o achado mais específico do traçado.',
      'Colchicina é o que previne recorrência; corticoide aumenta recidiva.',
    ],
  },

  'early-repol': {
    emUmaFrase:
      'Supradesnivelamento côncavo com entalhe ou empastamento no ponto J, sobretudo nas precordiais, em jovem assintomático: variante do normal na grande maioria dos casos.',
    secoes: [
      {
        titulo: 'A base eletrofisiológica',
        texto:
          'A repolarização precoce reflete um gradiente transmural de voltagem no início da repolarização, ligado à corrente transitória de saída de potássio (Ito), mais expressa no epicárdio que no endocárdio. Isso produz uma elevação do ponto J e do segmento ST inicial. O padrão é mais comum em homens jovens, atletas, indivíduos de origem africana e pessoas com tônus vagal elevado — e tende a ser mais evidente em frequências cardíacas baixas, atenuando-se com o exercício e com o aumento da frequência, um comportamento útil na prática.',
      },
      {
        titulo: 'Como reconhecer o padrão benigno',
        texto:
          'Elevação do ponto J de pelo menos 1 mm em duas derivações contíguas, tipicamente em V2 a V5 e nas derivações inferiores; entalhe (notch) ou empastamento (slur) no final do QRS; segmento ST com concavidade superior; ondas T altas, assimétricas e concordantes com o QRS; ausência de imagem em espelho; e estabilidade ao longo do tempo — traçados antigos idênticos são o argumento mais forte a favor de benignidade. A razão entre a altura do ST e a amplitude da onda T em V6 costuma ser menor que 0,25, ajudando a separar de pericardite.',
      },
      {
        titulo: 'Quando o padrão preocupa: a síndrome de repolarização precoce',
        texto:
          'Estudos das últimas décadas identificaram um subgrupo em que o padrão se associa a risco aumentado de fibrilação ventricular idiopática — a chamada síndrome de repolarização precoce, distinta do padrão benigno. Os marcadores de risco incluem: localização nas derivações inferiores ou inferolaterais (e não apenas nas precordiais anteriores), elevação do ponto J maior que 2 mm, segmento ST horizontal ou descendente após o entalhe (em vez de ascendente), ondas J proeminentes e, sobretudo, história de síncope inexplicada ou de morte súbita em familiares jovens. A imensa maioria das pessoas com o padrão nunca terá evento; a estratificação, portanto, se apoia muito mais na história clínica e familiar do que no traçado isolado.',
      },
      {
        titulo: 'O diferencial que salva vidas',
        texto:
          'Diante de dor torácica aguda, repolarização precoce e infarto anterior inicial podem parecer semelhantes. Argumentos a favor de repolarização precoce: concavidade do ST, entalhe no ponto J, ondas T proporcionalmente altas, ausência de reciprocidade, boa progressão de R e estabilidade em traçados seriados. Argumentos a favor de oclusão: convexidade, ondas T desproporcionalmente grandes em relação ao QRS, perda de amplitude da onda R em V2–V4, reciprocidade e alterações dinâmicas. Existem fórmulas que combinam variáveis (altura do ST em V3, amplitude da R em V4, QTc e voltagem em V2) para auxiliar essa distinção; nenhuma substitui a repetição do ECG, a troponina e o julgamento clínico.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ponto J', achado: 'Elevado, com entalhe ou empastamento característico no final do QRS.' },
      { onda: 'Segmento ST', achado: 'Supradesnivelamento côncavo, geralmente menor que 3 mm, mais evidente em V2–V5.' },
      { onda: 'Onda T', achado: 'Alta, assimétrica e concordante com o QRS.' },
      { onda: 'Imagem em espelho', achado: 'Ausente — não há reciprocidade.' },
      { onda: 'Comportamento', achado: 'Atenua-se com o aumento da frequência cardíaca e permanece estável ao longo de anos.' },
    ],
    roteiro: [
      'Confirme a concavidade do supradesnivelamento.',
      'Procure o entalhe ou empastamento no ponto J.',
      'Verifique ausência de imagem em espelho.',
      'Compare com traçados antigos.',
      'Pergunte sobre síncope e história familiar de morte súbita precoce.',
    ],
    separando: [
      { de: 'Infarto com supradesnivelamento', chave: 'Supra convexo, com reciprocidade, perda de R e alterações dinâmicas.' },
      { de: 'Pericardite', chave: 'Supra difuso com infradesnivelamento de PR e razão ST/T em V6 maior que 0,25.' },
      { de: 'Síndrome de Brugada', chave: 'Supra em cúpula em V1–V2 seguido de T negativa.' },
      { de: 'Hipercalemia', chave: 'T apiculadas de base estreita com P achatada e QRS alargado.' },
    ],
    fixacao: [
      'Côncavo com entalhe no ponto J e sem espelho: quase sempre variante do normal.',
      'ST horizontal ou descendente após o entalhe, nas inferiores, é o subgrupo a vigiar.',
      'Traçado antigo idêntico é o melhor exame complementar.',
    ],
  },

  'stemi-anterior-extenso': {
    emUmaFrase:
      'Supradesnivelamento de V1 a V6 somado a DI e aVL: oclusão proximal da descendente anterior, com o maior território em risco de todos os infartos.',
    secoes: [
      {
        titulo: 'Extensão anatômica e consequências',
        texto:
          'Quando a oclusão ocorre na descendente anterior antes da origem do primeiro ramo septal e do primeiro diagonal, o território comprometido inclui septo, parede anterior, ápice e parede lateral — daí o supradesnivelamento cobrindo de V1 a V6 e alcançando DI e aVL. Trata-se do infarto de maior área em risco, associado a mortalidade hospitalar elevada, alta incidência de choque cardiogênico, disfunção ventricular grave e complicações mecânicas. A imagem em espelho aparece em DII, DIII e aVF, e o supradesnivelamento em aVR sugere comprometimento muito proximal.',
      },
      {
        titulo: 'Marcadores eletrocardiográficos de gravidade',
        texto:
          'Alguns achados no mesmo traçado indicam pior prognóstico: bloqueio de ramo direito novo, especialmente associado a hemibloqueio anterior — sinal de necrose septal com destruição dos ramos, e preditor de bloqueio atrioventricular completo; supradesnivelamento muito acentuado com morfologia em lápide (tombstone), que se correlaciona com grande área de lesão; e ondas Q que aparecem precocemente, indicando necrose já estabelecida. Também importa a soma total de milímetros de supradesnivelamento, que se correlaciona com o tamanho do infarto. Diferentemente do infarto inferior, o bloqueio atrioventricular aqui é infra-hissiano, com escape ventricular lento e instável, e não responde a atropina.',
      },
      {
        titulo: 'Conduta e complicações a antecipar',
        texto:
          'Reperfusão imediata é a prioridade absoluta, com angioplastia primária preferencial e trombólise quando os prazos não puderem ser cumpridos. Ao mesmo tempo, o paciente deve ser tratado como de alto risco desde o primeiro momento: monitorização em unidade coronariana, acesso venoso adequado, marca-passo transcutâneo em prontidão, atenção a sinais de baixo débito e a arritmias ventriculares. Nos dias seguintes, vigiar complicações mecânicas — ruptura do septo interventricular (novo sopro holossistólico com choque), ruptura de parede livre, aneurisma ventricular (supradesnivelamento persistente com ondas Q) e trombo apical, que pode exigir anticoagulação. A disfunção sistólica residual define a necessidade posterior de terapias como cardiodesfibrilador e ressincronização.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento de V1 a V6 e também em DI e aVL — território extenso.' },
      { onda: 'Imagem em espelho', achado: 'Infradesnivelamento em DII, DIII e aVF.' },
      { onda: 'aVR', achado: 'Supradesnivelamento sugere oclusão muito proximal.' },
      { onda: 'QRS', achado: 'Bloqueio de ramo direito novo com hemibloqueio anterior é marcador de necrose septal extensa.' },
      { onda: 'Onda Q', achado: 'Aparecimento precoce indica necrose já estabelecida e maior área comprometida.' },
    ],
    roteiro: [
      'Verifique a extensão do supra: V1 a V6 mais DI e aVL.',
      'Confirme a reciprocidade nas derivações inferiores.',
      'Procure bloqueio de ramo direito e hemibloqueio novos.',
      'Acione reperfusão imediatamente e trate como alto risco.',
      'Prepare monitorização, marca-passo em prontidão e suporte hemodinâmico.',
    ],
    separando: [
      { de: 'Infarto anterior localizado', chave: 'Supra restrito a V1–V4, sem envolvimento lateral.' },
      { de: 'Pericardite', chave: 'Supra difuso côncavo, sem reciprocidade, com alterações de PR.' },
      { de: 'Aneurisma ventricular', chave: 'Supra persistente com ondas Q em paciente estável e ECG antigo idêntico.' },
    ],
    fixacao: [
      'V1 a V6 mais DI e aVL = descendente anterior proximal = maior área em risco.',
      'BRD novo com hemibloqueio anterior anuncia bloqueio total infra-hissiano.',
      'Atropina não resolve bloqueio infra-hissiano: prepare marca-passo.',
    ],
  },

  'stemi-rv': {
    emUmaFrase:
      'Supradesnivelamento em V4R, quase sempre associado a infarto inferior: o ventrículo direito é dependente de pré-carga, e nitrato pode derrubar a pressão.',
    secoes: [
      {
        titulo: 'Por que o ventrículo direito é diferente',
        texto:
          'O ventrículo direito é uma câmara de paredes finas, complacente, que trabalha contra uma resistência baixa. Quando infarta, perde a capacidade de gerar pressão suficiente para encher adequadamente o ventrículo esquerdo — e o débito cardíaco passa a depender criticamente do volume que chega a ele, isto é, da pré-carga. Essa fisiologia explica a tríade clássica: hipotensão, turgência jugular e campos pulmonares limpos. Também explica a regra terapêutica: qualquer fármaco que reduza a pré-carga — nitrato, morfina, diurético — pode precipitar hipotensão grave, e o tratamento inicial da hipotensão é expansão volêmica com cristaloide.',
      },
      {
        titulo: 'Como fazer o diagnóstico',
        texto:
          'A pista inicial é o infarto inferior, sobretudo quando o supradesnivelamento em DIII é maior que em DII e há infra em DI e aVL — padrão de oclusão proximal da coronária direita. Outra pista, presente no ECG padrão, é o supradesnivelamento em V1, a única derivação convencional que olha parcialmente o ventrículo direito; a combinação de supra em V1 com infra em V2 é sugestiva. A confirmação vem das derivações direitas: V3R e V4R, obtidas espelhando o posicionamento precordial do lado direito do tórax. Supradesnivelamento de pelo menos 0,5 mm em V4R é o critério mais utilizado e o achado com melhor acurácia. Um detalhe temporal importante: essas alterações são fugazes e podem desaparecer em poucas horas, de modo que o registro deve ser feito o quanto antes.',
      },
      {
        titulo: 'Manejo e complicações',
        texto:
          'Reperfusão imediata, como em qualquer infarto com supradesnivelamento. Do ponto de vista hemodinâmico: expandir com cristaloide, evitar nitrato, morfina e diuréticos, e usar inotrópico (dobutamina) se a expansão não for suficiente. Bradiarritmias são frequentes, tanto pela isquemia nodal quanto pelo reflexo vagal, e a perda da sincronia atrioventricular é particularmente mal tolerada — pacientes com infarto de ventrículo direito dependem da contribuição atrial, de modo que fibrilação atrial e bloqueio atrioventricular podem causar deterioração desproporcional, e a estimulação, quando necessária, idealmente deve ser atrioventricular sequencial. Com a reperfusão, a função do ventrículo direito costuma recuperar-se substancialmente ao longo de dias a semanas — o prognóstico a médio prazo é melhor do que a gravidade inicial sugere.',
      },
    ],
    ondaAOnda: [
      { onda: 'V4R', achado: 'Supradesnivelamento maior ou igual a 0,5 mm — o critério diagnóstico principal.' },
      { onda: 'Derivações inferiores', achado: 'Supradesnivelamento em DII, DIII e aVF, com DIII maior que DII.' },
      { onda: 'DI e aVL', achado: 'Infradesnivelamento recíproco, sugerindo coronária direita proximal.' },
      { onda: 'V1', achado: 'Supradesnivelamento discreto, com V2 infradesnivelado, é pista no ECG padrão.' },
      { onda: 'Ritmo', achado: 'Bradiarritmias e bloqueios AV frequentes; a perda da sincronia AV é mal tolerada.' },
    ],
    roteiro: [
      'Diante de qualquer infarto inferior, registre V3R e V4R imediatamente.',
      'Procure supra maior ou igual a 0,5 mm em V4R.',
      'Avalie a tríade clínica: hipotensão, jugulares distendidas, pulmões limpos.',
      'Expanda com cristaloide e evite nitrato, morfina e diuréticos.',
      'Acione reperfusão e monitorize bradiarritmias.',
    ],
    separando: [
      { de: 'Infarto inferior isolado', chave: 'Sem supra em V4R e sem a fisiologia dependente de pré-carga.' },
      { de: 'Tromboembolismo pulmonar', chave: 'Sobrecarga direita aguda com S1Q3T3 e T invertida em V1–V4, sem supra em V4R.' },
      { de: 'Tamponamento', chave: 'Baixa voltagem com alternância elétrica e pulso paradoxal.' },
    ],
    fixacao: [
      'Infarto inferior + hipotensão = pense em ventrículo direito antes de dar nitrato.',
      'V4R é obrigatório e deve ser registrado cedo: o achado é fugaz.',
      'O tratamento da hipotensão aqui é volume, não vasodilatador.',
    ],
  },

  't-hyperacute': {
    emUmaFrase:
      'Ondas T amplas, largas e simétricas, desproporcionais ao QRS: a primeira manifestação elétrica da oclusão coronariana, minutos antes do supradesnivelamento.',
    secoes: [
      {
        titulo: 'A janela de ouro',
        texto:
          'Nos primeiros minutos após a oclusão coronariana, antes que a corrente de lesão seja intensa o suficiente para deslocar o segmento ST, a repolarização do miocárdio isquêmico já está alterada. O resultado são ondas T que crescem em amplitude e, sobretudo, em largura e área — mais do que simplesmente “pontudas”, elas ficam gordas, simétricas e desproporcionais ao complexo QRS que as precede. Essa fase costuma durar de minutos a poucas horas e é frequentemente perdida, seja porque o paciente ainda não chegou ao serviço, seja porque o traçado é interpretado como normal. Reconhecê-la significa iniciar a reperfusão na janela em que o benefício é máximo.',
      },
      {
        titulo: 'Como distinguir da T da hipercalemia',
        texto:
          'As duas produzem ondas T altas, mas são visualmente diferentes. A T da hipercalemia é estreita na base, pontiaguda, de aspecto “em tenda”, geralmente simétrica e distribuída de forma difusa; acompanha-se de achatamento e depois desaparecimento da onda P, prolongamento do PR e alargamento do QRS. A T hiperaguda da isquemia é larga na base, ocupa área maior, é assimétrica ou levemente simétrica, aparece em derivações contíguas de um mesmo território e vem acompanhada de retificação do segmento ST, perda da concavidade normal e, às vezes, discreta redução da amplitude da onda R. Diante da dúvida, a conduta é simples e barata: dosar potássio e repetir o eletrocardiograma em poucos minutos.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Diante de dor torácica compatível e ondas T hiperagudas, o paciente deve ser tratado como portador de oclusão coronariana em evolução: monitorização, acesso venoso, ECG seriado a cada 10 a 15 minutos, troponina e discussão imediata com a hemodinâmica. Não se deve esperar o supradesnivelamento “aparecer” para acionar a reperfusão quando o quadro clínico é convincente e o traçado evolui. Comparar com um ECG antigo é especialmente útil, porque a proporção entre a onda T e o QRS é individual. Ecocardiograma à beira do leito, quando disponível, pode demonstrar alteração segmentar e reforçar a decisão.',
      },
    ],
    ondaAOnda: [
      { onda: 'Onda T', achado: 'Ampla, larga na base, simétrica e desproporcional à amplitude do QRS.' },
      { onda: 'Segmento ST', achado: 'Retificado ou com perda da concavidade normal, ainda sem supradesnivelamento franco.' },
      { onda: 'Distribuição', achado: 'Em derivações contíguas de um mesmo território coronariano.' },
      { onda: 'Onda R', achado: 'Pode haver discreta redução de amplitude nas precordiais afetadas.' },
      { onda: 'Evolução', achado: 'Traçados seriados mostram progressão para supradesnivelamento em minutos a horas.' },
    ],
    roteiro: [
      'Compare a amplitude da T com a do QRS na mesma derivação.',
      'Avalie a largura da base da T — larga sugere isquemia.',
      'Verifique se a distribuição respeita um território coronariano.',
      'Dose o potássio para excluir hipercalemia.',
      'Repita o ECG em 10–15 minutos e acione a hemodinâmica se o quadro for convincente.',
    ],
    separando: [
      { de: 'Hipercalemia', chave: 'T em tenda, base estreita, difusa, com P achatada, PR longo e QRS alargado.' },
      { de: 'Repolarização precoce', chave: 'Entalhe no ponto J, supra côncavo, traçado estável ao longo do tempo.' },
      { de: 'Padrão de De Winter', chave: 'T alta precedida por infradesnivelamento ascendente do ponto J.' },
      { de: 'Sobrecarga ventricular esquerda', chave: 'T assimétricas com voltagem aumentada e padrão estável.' },
    ],
    fixacao: [
      'T hiperaguda é a primeira pista do infarto — e a mais perdida.',
      'Isquemia: T larga e gorda. Hipercalemia: T estreita e pontuda.',
      'Traçado seriado é o exame que confirma o diagnóstico.',
    ],
  },

  myocarditis: {
    emUmaFrase:
      'Alterações eletrocardiográficas difusas e variadas em paciente jovem com troponina elevada e coronárias normais: a inflamação do músculo, e não do vaso.',
    secoes: [
      {
        titulo: 'O grande imitador',
        texto:
          'A miocardite pode reproduzir praticamente qualquer padrão eletrocardiográfico: supradesnivelamento difuso semelhante ao da pericardite (quando há miopericardite), supradesnivelamento regional que imita infarto, inversões difusas de onda T, distúrbios de condução — inclusive bloqueio atrioventricular de alto grau —, arritmias atriais e ventriculares, e alterações inespecíficas de repolarização. Essa versatilidade é justamente o que a torna perigosa do ponto de vista diagnóstico: paciente jovem, dor torácica, troponina alta e supradesnivelamento levam naturalmente à hipótese de infarto, e é frequentemente a coronariografia normal que redireciona o raciocínio.',
      },
      {
        titulo: 'Pistas que apontam para miocardite',
        texto:
          'Idade jovem, ausência de fatores de risco coronarianos, pródromo viral nas semanas anteriores, troponina elevada de forma desproporcional às alterações do ECG, alterações que não respeitam território arterial, e a coexistência de derrame pericárdico. Ao ecocardiograma, disfunção ventricular global ou segmentar que não corresponde a um território coronariano. A confirmação diagnóstica moderna é a ressonância magnética cardíaca, com os critérios de Lake Louise — edema em T2, realce precoce e realce tardio de padrão não isquêmico, tipicamente subepicárdico ou mesocárdico, diferente do padrão subendocárdico da isquemia. A biópsia endomiocárdica fica reservada a casos graves ou de evolução atípica, como a miocardite fulminante e a de células gigantes.',
      },
      {
        titulo: 'Sinais de gravidade e conduta',
        texto:
          'Alguns achados eletrocardiográficos identificam pacientes de maior risco: QRS alargado, bloqueio atrioventricular avançado, arritmias ventriculares, QT prolongado e ondas Q patológicas. A presença desses marcadores, associada a disfunção ventricular, indica internação com monitorização contínua. O tratamento é primariamente de suporte: manejo de insuficiência cardíaca com as terapias recomendadas, monitorização de arritmias, e restrição de exercício físico por período prolongado — habitualmente três a seis meses —, pois o esforço em miocárdio inflamado é um gatilho reconhecido de arritmias e de morte súbita em jovens atletas. Terapias imunossupressoras têm papel em formas específicas, e as formas fulminantes podem requerer suporte circulatório mecânico. O prognóstico é variável: muitos se recuperam completamente, mas uma parcela evolui para miocardiopatia dilatada.',
      },
    ],
    ondaAOnda: [
      { onda: 'Segmento ST', achado: 'Supradesnivelamento difuso (miopericardite) ou regional imitando infarto.' },
      { onda: 'Onda T', achado: 'Inversões difusas e alterações inespecíficas, frequentemente sem território definido.' },
      { onda: 'QRS', achado: 'Pode alargar; QRS largo é marcador de pior prognóstico.' },
      { onda: 'Condução', achado: 'Bloqueios atrioventriculares de qualquer grau podem surgir e regredir.' },
      { onda: 'Ritmo', achado: 'Taquicardia sinusal desproporcional, arritmias atriais e ventriculares.' },
      { onda: 'Intervalo QT', achado: 'Pode prolongar-se, aumentando o risco arrítmico.' },
    ],
    roteiro: [
      'Reconheça alterações difusas que não respeitam território coronariano.',
      'Correlacione com idade jovem, pródromo viral e ausência de fatores de risco.',
      'Compare a magnitude da troponina com a extensão das alterações do ECG.',
      'Solicite ecocardiograma e, quando disponível, ressonância magnética cardíaca.',
      'Monitorize arritmias, trate a insuficiência cardíaca e restrinja exercício.',
    ],
    separando: [
      { de: 'Infarto com supradesnivelamento', chave: 'Território arterial definido, imagem em espelho e coronariografia com oclusão.' },
      { de: 'Pericardite isolada', chave: 'Troponina normal ou minimamente elevada e função ventricular preservada.' },
      { de: 'Takotsubo', chave: 'Balonamento apical típico ao ecocardiograma, gatilho emocional e QT muito prolongado.' },
      { de: 'Repolarização precoce', chave: 'Padrão estável, sem troponina elevada e sem sintomas agudos.' },
    ],
    fixacao: [
      'Jovem + troponina alta + coronárias normais = pense em miocardite.',
      'Realce tardio subepicárdico na ressonância é o padrão não isquêmico.',
      'Restrição de exercício por meses faz parte do tratamento.',
    ],
  },
}

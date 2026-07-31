import type { DeepDiveMap } from './types'

/** Bloqueios atrioventriculares — a comunicação entre átrio e ventrículo falhando por graus. */
export const DEEP_DIVE_BLOQUEIOS_AV: DeepDiveMap = {
  'av-block-1': {
    emUmaFrase:
      'Todo impulso atrial chega ao ventrículo, mas demora demais: PR maior que 200 ms, constante, com relação 1:1 preservada.',
    secoes: [
      {
        titulo: 'Um nome enganoso',
        texto:
          'Chamar de “bloqueio” é impreciso: nada é bloqueado. Trata-se de um atraso na condução, quase sempre dentro do próprio nó AV, onde a condução é lenta e dependente de correntes de cálcio e do tônus autonômico. Como todo impulso atinge o ventrículo, a relação P:QRS permanece 1:1 e a frequência ventricular é igual à atrial. A definição é puramente métrica: intervalo PR acima de 200 ms no adulto (acima de 220 ms em idosos, e acima de 180 ms em crianças), constante em todos os batimentos. Quando o PR ultrapassa 300 ms, fala-se em BAV de primeiro grau marcado, e quando supera o intervalo RR — situação rara — o PR pode chegar a acomodar a onda P dentro da onda T do batimento anterior, criando o fenômeno de “P saltada”.',
      },
      {
        titulo: 'Onde está o atraso e por que isso importa',
        texto:
          'Um PR longo com QRS estreito indica, na maioria dos casos, atraso nodal — território dependente do vago, responsivo à atropina e de excelente prognóstico. Um PR longo com QRS largo levanta a possibilidade de a lentidão estar no sistema His-Purkinje, situação de comportamento clínico bem diferente, com maior risco de progressão para bloqueios avançados. Essa correlação entre largura do QRS e nível do bloqueio é um dos raciocínios mais úteis de toda a eletrocardiografia de bloqueios: quanto mais alto o bloqueio (nodal), mais benigno e mais responsivo à atropina; quanto mais baixo (infra-hissiano), mais perigoso, menos responsivo e mais frequentemente indicativo de marca-passo.',
      },
      {
        titulo: 'Causas e conduta',
        texto:
          'Tônus vagal aumentado (atletas, jovens, sono), fármacos (betabloqueador, verapamil, diltiazem, digoxina, amiodarona), isquemia inferior aguda, miocardite — incluindo doença de Lyme, em que o bloqueio costuma ser reversível —, febre reumática, doença degenerativa do sistema de condução (Lev e Lenègre), hipercalemia e hipotireoidismo. Em pessoa assintomática, não requer tratamento nem restrições. A conduta é observação, revisão de fármacos e comparação com traçados prévios. A antiga percepção de que seria totalmente inócuo, entretanto, foi revista: dados populacionais mostram associação entre PR marcadamente prolongado e maior incidência de fibrilação atrial, necessidade futura de marca-passo e mortalidade. PR muito longo com sintomas semelhantes aos da síndrome do marca-passo, por perda da sincronia AV, é situação rara em que a estimulação pode ser considerada.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com relação P:QRS de 1:1 — nenhuma onda P deixa de conduzir.' },
      { onda: 'Onda P', achado: 'Sinusal e normal, precedendo cada QRS.' },
      { onda: 'Intervalo PR', achado: 'Maior que 200 ms e constante em todos os batimentos — é o achado que define o diagnóstico.' },
      { onda: 'QRS', achado: 'Estreito na maioria; se largo, considere que o atraso pode ser infra-hissiano.' },
      { onda: 'Frequência', achado: 'Igual à frequência atrial; o bloqueio não reduz a frequência ventricular.' },
    ],
    roteiro: [
      'Confirme que cada P é seguida de um QRS.',
      'Meça o PR em uma derivação com P e QRS bem definidos (DII costuma ser a melhor).',
      'Verifique se o PR é constante em todos os batimentos.',
      'Observe a largura do QRS para inferir o nível do bloqueio.',
      'Revise fármacos, eletrólitos e procure isquemia inferior.',
    ],
    separando: [
      { de: 'BAV 2º grau Mobitz I', chave: 'No Mobitz I o PR aumenta progressivamente até uma P bloquear; aqui ele é fixo e nada bloqueia.' },
      { de: 'BAV 2:1', chave: 'No 2:1 metade das P não conduz; aqui todas conduzem.' },
      { de: 'PR curto (pré-excitação)', chave: 'Situação oposta: PR abaixo de 120 ms com onda delta.' },
    ],
    fixacao: [
      'Primeiro grau é atraso, não bloqueio: nenhuma P é perdida.',
      'PR maior que 200 ms com QRS estreito costuma ser nodal e benigno.',
      'QRS largo em qualquer bloqueio sugere doença infra-hissiana e muda o prognóstico.',
    ],
  },

  'mobitz-1': {
    emUmaFrase:
      'O PR aumenta progressivamente batimento a batimento até que uma onda P não conduz; depois o ciclo recomeça — o fenômeno de Wenckebach, geralmente nodal e benigno.',
    secoes: [
      {
        titulo: 'A fisiologia da fadiga progressiva',
        texto:
          'As células do nó AV apresentam recuperação lenta e progressiva da excitabilidade. A cada batimento conduzido, o tecido nodal fica um pouco mais refratário do que estava no anterior, e o impulso seguinte demora mais para atravessar — daí o alongamento sucessivo do PR. Chega um momento em que o impulso encontra o nó completamente refratário e não passa: aquela onda P fica sem QRS. A pausa que se segue dá tempo para o nó AV se recuperar plenamente, e o ciclo recomeça com o PR mais curto da série. Esse é o mecanismo de Wenckebach, e o padrão de agrupamento de batimentos que ele produz é uma das assinaturas visuais mais reconhecíveis do eletrocardiograma.',
      },
      {
        titulo: 'As três regras clássicas do Wenckebach',
        texto:
          'Primeira: o PR aumenta progressivamente, mas o incremento diminui a cada batimento — o maior salto acontece do primeiro para o segundo PR do ciclo. Segunda: como consequência da primeira, o intervalo RR encurta progressivamente ao longo da sequência, o que parece contraintuitivo mas decorre diretamente do incremento decrescente. Terceira: a pausa que contém a P bloqueada é menor que o dobro do RR precedente. Essas três regras permitem reconhecer Wenckebach mesmo em traçados ruins, e explicam o aspecto de “batimentos agrupados” — um padrão repetitivo de grupos separados por pausas. Sempre que houver agrupamento no traçado, meça os PR dentro do grupo: Wenckebach é a causa mais comum.',
      },
      {
        titulo: 'Significado clínico e conduta',
        texto:
          'O bloqueio é quase sempre nodal, com QRS estreito, frequentemente relacionado a tônus vagal elevado — é comum em atletas, durante o sono e em jovens, sem qualquer significado patológico. Também aparece com fármacos bloqueadores do nó AV, no infarto inferior agudo (isquemia da coronária direita, com bloqueio tipicamente transitório e responsivo à atropina), na miocardite e na intoxicação digitálica. Assintomático não requer tratamento. Sintomático: atropina costuma funcionar justamente porque o bloqueio é nodal, e a suspensão de fármacos frequentemente resolve. Marca-passo definitivo é excepcional, reservado a casos sintomáticos refratários sem causa reversível ou quando o estudo eletrofisiológico demonstra que o bloqueio, apesar do padrão de Wenckebach, é infra-hissiano — o que ocorre em uma minoria, sobretudo com QRS largo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregular com padrão de agrupamento repetitivo (batimentos agrupados separados por pausas).' },
      { onda: 'Onda P', achado: 'Regulares e em frequência constante — o intervalo PP não se altera.' },
      { onda: 'Intervalo PR', achado: 'Aumenta progressivamente até que uma P bloqueia; o primeiro PR do ciclo seguinte é o mais curto.' },
      { onda: 'Intervalo RR', achado: 'Encurta progressivamente dentro do ciclo, porque o incremento do PR diminui.' },
      { onda: 'Pausa', achado: 'Menor que o dobro do RR precedente.' },
      { onda: 'QRS', achado: 'Estreito na grande maioria — indica bloqueio nodal.' },
    ],
    roteiro: [
      'Perceba o agrupamento dos batimentos.',
      'Confirme que as ondas P marcham regulares (PP constante).',
      'Meça os PR em sequência: eles aumentam?',
      'Localize a P sem QRS e confira se o PR seguinte é o mais curto do traçado.',
      'Verifique a largura do QRS e revise fármacos e isquemia inferior.',
    ],
    separando: [
      { de: 'Mobitz II', chave: 'No Mobitz II o PR é constante antes da falha; a distinção é justamente medir os PR.' },
      { de: 'Extrassístole atrial bloqueada', chave: 'Procure a P prematura escondida na onda T; ela não faz parte de um padrão progressivo.' },
      { de: 'BAV 2:1', chave: 'No 2:1 não é possível observar progressão do PR, pois não há dois batimentos conduzidos seguidos.' },
      { de: 'Arritmia sinusal', chave: 'Na arritmia sinusal o PP varia; no Wenckebach o PP é constante e o PR é que varia.' },
    ],
    fixacao: [
      '“Alonga, alonga, alonga e falta” — a frase que define Wenckebach.',
      'RR encurtando dentro do grupo é a pista contraintuitiva que confirma o diagnóstico.',
      'Nodal e responsivo à atropina: em geral benigno e sem indicação de marca-passo.',
    ],
  },

  'mobitz-2': {
    emUmaFrase:
      'Ondas P que subitamente deixam de conduzir, sem qualquer alongamento prévio do PR: a falha é abrupta, o bloqueio é infra-hissiano e a indicação de marca-passo é a regra.',
    secoes: [
      {
        titulo: 'Falha do tipo tudo ou nada',
        texto:
          'O Mobitz II reflete doença do sistema His-Purkinje, e não do nó AV. Ao contrário do tecido nodal, que conduz de forma decremental e “avisa” antes de falhar, o sistema His-Purkinje funciona no modo tudo ou nada: ou o impulso passa com condução rápida, ou não passa. Por isso o PR permanece exatamente constante nos batimentos conduzidos e, de repente, uma onda P simplesmente não gera QRS. O substrato é habitualmente estrutural e irreversível — fibrose degenerativa do sistema de condução (doenças de Lev e de Lenègre), infarto anterior extenso com necrose septal, doenças infiltrativas como amiloidose e sarcoidose, calcificação do esqueleto fibroso do coração, doença de Chagas, e lesão cirúrgica ou por procedimentos como TAVI.',
      },
      {
        titulo: 'Por que é perigoso',
        texto:
          'O risco central é a progressão súbita e imprevisível para bloqueio atrioventricular total. E quando isso ocorre num bloqueio infra-hissiano, o ritmo de escape disponível é ventricular — lento (20 a 40 bpm), instável e de QRS largo —, incapaz de sustentar perfusão adequada. O resultado clínico é a síncope de Stokes-Adams, sem pródromos, com risco de assistolia e morte súbita. Diferentemente do Mobitz I, o comportamento com estímulos ajuda a caracterizar: a atropina, ao acelerar a frequência sinusal, pode piorar o grau de bloqueio infra-hissiano (mais impulsos chegando a um sistema doente), enquanto o exercício ou a atropina tendem a melhorar o Wenckebach nodal. Esse teste é diagnóstico e não terapêutico.',
      },
      {
        titulo: 'Conduta: marca-passo é a regra',
        texto:
          'Diante de Mobitz II, o paciente deve ser monitorizado continuamente, com marca-passo transcutâneo em prontidão e material de reanimação disponível. Fármacos bloqueadores do nó AV devem ser suspensos; isquemia aguda deve ser investigada e tratada; eletrólitos, incluindo potássio, e função tireoidiana devem ser avaliados. Excluídas causas reversíveis, a indicação de marca-passo definitivo é classe I mesmo em pacientes assintomáticos, precisamente porque a progressão é imprevisível e o primeiro sintoma pode ser a morte súbita. Essa é uma das indicações mais claramente estabelecidas de estimulação cardíaca permanente e um dos pontos mais cobrados em provas.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregular pelas falhas súbitas de condução; pode haver padrão fixo (3:2, 4:3) ou aleatório.' },
      { onda: 'Onda P', achado: 'Regulares, com PP constante; algumas simplesmente não são seguidas de QRS.' },
      { onda: 'Intervalo PR', achado: 'Rigorosamente CONSTANTE nos batimentos conduzidos — não há alongamento progressivo.' },
      { onda: 'QRS', achado: 'Frequentemente largo, refletindo doença associada do sistema His-Purkinje.' },
      { onda: 'Pausa', achado: 'Habitualmente múltipla exata do intervalo PP.' },
    ],
    roteiro: [
      'Localize as ondas P sem QRS correspondente.',
      'Meça os PR dos batimentos conduzidos imediatamente antes e depois da falha.',
      'PR constante confirma Mobitz II; PR crescente indica Mobitz I.',
      'Avalie a largura do QRS.',
      'Monitorize, suspenda bloqueadores nodais e prepare marca-passo.',
    ],
    separando: [
      { de: 'Mobitz I', chave: 'Meça os PR: no Mobitz I eles crescem progressivamente antes da falha.' },
      { de: 'Extrassístole atrial bloqueada', chave: 'A P que falha é prematura e deforma a onda T anterior; no Mobitz II a P chega no tempo previsto.' },
      { de: 'BAV total', chave: 'No total não há qualquer relação entre P e QRS; aqui os batimentos conduzidos têm PR fixo.' },
      { de: 'Pausa sinusal', chave: 'Na pausa sinusal não há onda P dentro do intervalo; no Mobitz II há P bloqueada.' },
    ],
    fixacao: [
      'PR fixo + P que some de repente = Mobitz II = marca-passo.',
      'Atropina pode PIORAR o bloqueio infra-hissiano — é teste, não tratamento.',
      'A indicação de marca-passo vale mesmo para o assintomático.',
    ],
  },

  'av-block-3': {
    emUmaFrase:
      'Nenhum impulso atravessa o nó AV: átrios e ventrículos batem em frequências próprias e independentes, com o ventrículo sustentado por um escape juncional de QRS estreito.',
    secoes: [
      {
        titulo: 'Dissociação completa',
        texto:
          'No bloqueio atrioventricular total não existe condução anterógrada. O nó sinusal continua comandando os átrios em sua frequência habitual, enquanto um marca-passo subsidiário assume os ventrículos. As duas frequências são independentes: a atrial é mais rápida (tipicamente 60 a 100 bpm) e a ventricular é mais lenta (a do escape). O intervalo PR é aleatório e varia a cada batimento, porque as ondas P caem onde calham — antes, dentro ou depois dos QRS. É importante entender que a irregularidade aparente do PR aqui não é bloqueio progressivo: é ausência total de relação. Ao mesmo tempo, os intervalos PP são regulares entre si e os intervalos RR também são regulares entre si — dois relógios independentes, ambos funcionando.',
      },
      {
        titulo: 'O escape juncional e o que ele indica',
        texto:
          'Quando o escape tem QRS estreito e frequência de 40 a 60 bpm, sua origem está na junção AV, acima da bifurcação do feixe de His. Isso significa que o bloqueio é supra-hissiano ou intra-hissiano alto, situação relativamente mais estável: o escape é confiável, responde parcialmente à atropina e às catecolaminas, e o quadro pode ser transitório — sobretudo no infarto inferior agudo, em que a isquemia da coronária direita produz bloqueio que costuma reverter em dias, e na intoxicação por fármacos. Já um escape de QRS largo e frequência de 20 a 40 bpm indica origem ventricular e bloqueio infra-hissiano, com escape instável e prognóstico bem pior.',
      },
      {
        titulo: 'Manifestações e conduta',
        texto:
          'Fadiga, tontura, intolerância ao esforço, insuficiência cardíaca e síncope de Stokes-Adams. Ao exame, bradicardia regular, ondas A em canhão intermitentes no pulso venoso jugular (quando o átrio contrai contra a tricúspide fechada) e variação da intensidade da primeira bulha, ambas consequências diretas da dissociação AV. A conduta aguda segue o algoritmo de bradicardia: monitorização, atropina (com resposta melhor no bloqueio nodal), marca-passo transcutâneo e infusão de dopamina ou epinefrina como ponte, seguidos de marca-passo transvenoso. Investigar e tratar causas reversíveis é obrigatório: isquemia (especialmente inferior), fármacos bloqueadores do nó AV, hipercalemia, hipotireoidismo, doença de Lyme, endocardite com abscesso valvar e miocardite. Excluídas essas causas, o marca-passo definitivo é indicação classe I, independentemente de sintomas.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Duas cadências independentes: P regulares e QRS regulares, sem relação entre si.' },
      { onda: 'Onda P', achado: 'Frequência atrial maior que a ventricular; algumas P ficam sepultadas dentro de QRS e ondas T.' },
      { onda: 'Intervalo PR', achado: 'Variável e aleatório — não existe relação de condução.' },
      { onda: 'QRS', achado: 'Estreito neste padrão, indicando escape juncional e bloqueio mais alto.' },
      { onda: 'Frequência ventricular', achado: 'Entre 40 e 60 bpm, característica do automatismo juncional.' },
    ],
    roteiro: [
      'Marque todas as ondas P com o paquímetro: elas marcham regulares?',
      'Marque todos os QRS: também marcham regulares, em frequência menor?',
      'Verifique se o PR varia sem padrão — isso confirma dissociação.',
      'Avalie a largura do QRS para inferir o nível do bloqueio.',
      'Trate como bradicardia instável se houver sintomas e busque causas reversíveis.',
    ],
    separando: [
      { de: 'BAV 2:1', chave: 'No 2:1 existe relação fixa: metade das P conduz com PR constante.' },
      { de: 'Dissociação AV isorrítmica', chave: 'Ali as frequências atrial e ventricular são semelhantes e a condução pode retornar; aqui o átrio é claramente mais rápido.' },
      { de: 'Taquicardia juncional com dissociação', chave: 'Nela a frequência ventricular é MAIOR que a atrial.' },
      { de: 'Bradicardia sinusal', chave: 'Na sinusal cada P conduz com PR fixo.' },
    ],
    fixacao: [
      'P marcha, QRS marcha, ninguém se fala: bloqueio total.',
      'Escape estreito de 40–60 bpm = juncional = bloqueio mais alto e mais estável.',
      'Ondas A em canhão no pulso jugular são o sinal semiológico da dissociação AV.',
    ],
  },

  'av-2-1': {
    emUmaFrase:
      'Uma onda P conduz e a seguinte não, de forma alternada: relação 2:1 fixa, que impede classificar o bloqueio em Mobitz I ou II apenas por este traçado.',
    secoes: [
      {
        titulo: 'O problema da classificação',
        texto:
          'Os critérios que separam Mobitz I de Mobitz II dependem de comparar PR de batimentos consecutivos conduzidos. No bloqueio 2:1, nunca há dois batimentos conduzidos seguidos — logo, não é possível verificar se o PR aumentaria ou permaneceria constante. Por isso o 2:1 é uma categoria própria, e o traçado isolado não permite dizer se o bloqueio é nodal ou infra-hissiano. Como essa distinção determina desde a conduta ambulatorial até a indicação de marca-passo, o esforço diagnóstico consiste em obter informações adicionais que revelem o nível do bloqueio.',
      },
      {
        titulo: 'Pistas que indicam o nível',
        texto:
          'Favorecem bloqueio nodal (comportamento tipo Mobitz I): QRS estreito, PR longo nos batimentos conduzidos, presença de Wenckebach típico em outros trechos do mesmo registro ou em Holter, melhora da condução com exercício ou atropina (mais impulsos passam, chegando a 3:2 ou 1:1) e piora com manobra vagal. Favorecem bloqueio infra-hissiano (comportamento tipo Mobitz II): QRS largo com bloqueio de ramo associado, PR normal nos batimentos conduzidos, piora da condução com atropina ou exercício, melhora com manobra vagal — um comportamento paradoxal e altamente sugestivo, pois a redução da frequência sinusal dá mais tempo para o sistema His-Purkinje doente se recuperar. Quando a dúvida persiste e a decisão terapêutica depende dela, o estudo eletrofisiológico com registro do intervalo HV define a questão.',
      },
      {
        titulo: 'Consequências práticas',
        texto:
          'A frequência ventricular resultante é exatamente metade da atrial: átrio a 80 bpm produz ventrículo a 40 bpm — a razão pela qual esse padrão é uma das principais causas de bradicardia mal diagnosticada como bradicardia sinusal. As ondas P bloqueadas costumam esconder-se dentro das ondas T, deformando-as sutilmente. O manejo depende do nível: se nodal e assintomático, observação e revisão de fármacos; se infra-hissiano, ou se houver sintomas, síncope ou QRS largo, a conduta é de bloqueio avançado — monitorização, suspensão de bloqueadores nodais, correção de causas reversíveis e indicação de marca-passo definitivo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com frequência ventricular exatamente metade da atrial.' },
      { onda: 'Onda P', achado: 'Frequência atrial regular; uma P conduz e a seguinte é bloqueada, alternadamente.' },
      { onda: 'P oculta', achado: 'A P bloqueada frequentemente se esconde dentro da onda T, deformando-a de modo repetitivo.' },
      { onda: 'Intervalo PR', achado: 'Constante nos batimentos conduzidos — mas isso não permite classificar em Mobitz I ou II.' },
      { onda: 'QRS', achado: 'Estreito sugere nodal; largo sugere infra-hissiano.' },
    ],
    roteiro: [
      'Suspeite diante de bradicardia com frequência “redonda” (40, 45, 50 bpm).',
      'Meça o intervalo PP e verifique se cabe exatamente uma P dentro de cada onda T.',
      'Confirme a relação 2:1.',
      'Avalie a largura do QRS e o PR dos batimentos conduzidos.',
      'Se possível, registre durante exercício ou após atropina para revelar o nível do bloqueio.',
    ],
    separando: [
      { de: 'Bradicardia sinusal', chave: 'A P bloqueada escondida na T é o que distingue — procure-a sempre.' },
      { de: 'Mobitz I', chave: 'No Wenckebach há dois ou mais batimentos conduzidos seguidos, com PR crescente.' },
      { de: 'BAV total', chave: 'No total não há relação fixa; aqui a relação 2:1 é rigorosa.' },
      { de: 'Extrassístoles atriais bloqueadas em bigeminismo', chave: 'As P bloqueadas são prematuras e de morfologia diferente.' },
    ],
    fixacao: [
      'Bloqueio 2:1 não é Mobitz I nem II: é uma categoria à parte.',
      'Frequência ventricular exatamente metade da atrial é a assinatura.',
      'Melhora com vago e piora com atropina indica bloqueio infra-hissiano — o comportamento paradoxal que denuncia perigo.',
    ],
  },

  'av-block-3-vent': {
    emUmaFrase:
      'Bloqueio atrioventricular total em que o escape é ventricular: QRS largo a 20–40 bpm, ritmo instável e de altíssimo risco de assistolia.',
    secoes: [
      {
        titulo: 'Por que o escape é largo e lento',
        texto:
          'Quando o bloqueio ocorre abaixo da bifurcação do feixe de His, nenhum marca-passo juncional consegue assumir — o bloqueio está abaixo dele. O comando cabe então a células do sistema His-Purkinje distal ou do próprio miocárdio ventricular, cujo automatismo intrínseco é de apenas 20 a 40 bpm e cuja ativação se propaga lentamente, produzindo QRS largo e bizarro. Esse escape é intrinsecamente instável: pode falhar sem aviso, gerando pausas prolongadas ou assistolia, e responde mal ou não responde a atropina, já que o tecido infra-hissiano tem pouca inervação vagal. É a forma mais perigosa de bloqueio atrioventricular.',
      },
      {
        titulo: 'O contexto clínico típico',
        texto:
          'O cenário mais temido é o infarto agudo anterior extenso: a oclusão proximal da artéria descendente anterior necrosa o septo interventricular, onde correm os ramos, e o bloqueio que surge indica destruição extensa de miocárdio. Nesse contexto, o bloqueio total com escape ventricular é marcador de infarto de grande área, associado a mortalidade elevada, e não costuma ser reversível. Outras causas: doença degenerativa avançada do sistema de condução, doenças infiltrativas (amiloidose, sarcoidose), Chagas, calcificação valvar, complicações de cirurgia cardíaca e de TAVI, hipercalemia grave e intoxicações. Na hipercalemia, o quadro pode reverter dramaticamente com cálcio intravenoso — vale sempre lembrar dessa possibilidade antes de assumir irreversibilidade.',
      },
      {
        titulo: 'Emergência: o que fazer imediatamente',
        texto:
          'O paciente é considerado instável até prova em contrário. Monitorização contínua, acesso venoso, oxigênio, pás de marca-passo transcutâneo posicionadas antes de qualquer coisa dar errado, sedação e analgesia para a estimulação, e infusão de dopamina ou epinefrina como ponte. Atropina pode ser tentada, mas a expectativa de resposta é baixa. O objetivo é chegar rapidamente ao marca-passo transvenoso provisório e, definida a irreversibilidade, ao marca-passo definitivo — indicação classe I. Em paralelo, avaliação urgente de isquemia com eventual reperfusão, dosagem de potássio, revisão de fármacos e pesquisa de causas infecciosas e infiltrativas. Antiarrítmicos são proibidos: aboliriam o único ritmo que mantém o paciente vivo.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Dissociação AV completa, com ventrículo muito lento e regular.' },
      { onda: 'Onda P', achado: 'Regulares, em frequência claramente maior que a ventricular, sem relação com os QRS.' },
      { onda: 'QRS', achado: 'Largo (acima de 120 ms) e bizarro — escape de origem ventricular.' },
      { onda: 'Frequência ventricular', achado: '20 a 40 bpm, insuficiente para perfusão adequada na maioria dos pacientes.' },
      { onda: 'Onda T', achado: 'Discordante do QRS; observe também sinais de isquemia anterior no traçado.' },
    ],
    roteiro: [
      'Reconheça a dissociação AV (P e QRS marchando independentes).',
      'Meça a frequência ventricular: abaixo de 40 bpm com QRS largo.',
      'Avalie perfusão imediatamente — assuma instabilidade.',
      'Posicione marca-passo transcutâneo e prepare o transvenoso.',
      'Investigue infarto anterior, hipercalemia e fármacos; jamais use antiarrítmicos.',
    ],
    separando: [
      { de: 'BAV total com escape juncional', chave: 'QRS estreito e 40–60 bpm indicam bloqueio mais alto e mais estável.' },
      { de: 'Ritmo idioventricular acelerado', chave: 'O RIVA bate entre 50 e 110 bpm e não há bloqueio da condução.' },
      { de: 'Ritmo de marca-passo', chave: 'Há espícula precedendo cada QRS largo.' },
      { de: 'Hipercalemia grave', chave: 'Procure ondas T apiculadas, P achatada e QRS que se alarga progressivamente — pode reverter com cálcio.' },
    ],
    fixacao: [
      'Escape largo e lento = bloqueio abaixo do His = emergência.',
      'Atropina raramente funciona no infra-hissiano: vá para o marca-passo.',
      'BAV total no infarto anterior significa infarto extenso e prognóstico ruim.',
    ],
  },

  'av-block-advanced': {
    emUmaFrase:
      'Duas ou mais ondas P consecutivas bloqueadas, com alguma condução ainda preservada: um degrau entre o bloqueio de segundo grau e o bloqueio total.',
    secoes: [
      {
        titulo: 'Definição e por que existe essa categoria',
        texto:
          'Fala-se em BAV avançado, ou de alto grau, quando duas ou mais ondas P consecutivas são bloqueadas (relações 3:1, 4:1 ou piores), mas ainda existem batimentos conduzidos — o que o distingue do bloqueio total, em que nenhuma P conduz. A presença de condução ocasional é justamente o que permite reconhecê-lo: um batimento com PR fixo, seguido de várias P bloqueadas, seguido de novo batimento conduzido. Entre as P bloqueadas costumam aparecer batimentos de escape juncionais ou ventriculares, que evitam pausas longas demais.',
      },
      {
        titulo: 'Como não confundir com bloqueio total',
        texto:
          'A distinção exige paciência com o paquímetro. No bloqueio total, o PR é aleatório em todos os batimentos e as duas cadências são absolutamente independentes. No avançado, existe pelo menos um batimento — às vezes poucos em todo o traçado — cujo PR é constante e reprodutível, demonstrando condução real. Um erro comum é interpretar um batimento de escape que coincidentemente cai após uma onda P como “condução”; a checagem é ver se o mesmo intervalo PR se repete em outros batimentos conduzidos. A relevância prática é grande: o bloqueio avançado tende a progredir para total, e a conduta é praticamente a mesma.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Monitorização contínua, suspensão de fármacos bloqueadores do nó AV, investigação de isquemia, potássio, função tireoidiana, doença de Lyme e causas infiltrativas. Marca-passo transcutâneo em prontidão, com atropina e catecolaminas conforme o algoritmo de bradicardia, com a ressalva de que a resposta à atropina é pobre quando o bloqueio é infra-hissiano — o que é sugerido por QRS largo e por escape ventricular. Excluídas causas reversíveis, o marca-passo definitivo é indicação classe I, mesmo em paciente pouco sintomático, pela imprevisibilidade da progressão. Um contexto especial merece nota: na fibrilação atrial, o equivalente do bloqueio avançado é uma resposta ventricular lenta e regularizada — quando a FA fica regular e lenta, suspeite de bloqueio AV avançado, frequentemente por intoxicação digitálica.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregular, com sequências de várias P bloqueadas intercaladas por batimentos conduzidos ou de escape.' },
      { onda: 'Onda P', achado: 'Regulares em frequência constante; duas ou mais consecutivas não conduzem.' },
      { onda: 'Intervalo PR', achado: 'Constante nos poucos batimentos realmente conduzidos — é o que exclui bloqueio total.' },
      { onda: 'QRS', achado: 'Estreito se a condução e o escape forem juncionais; largo indica doença infra-hissiana.' },
      { onda: 'Escapes', achado: 'Batimentos juncionais ou ventriculares aparecem para evitar pausas prolongadas.' },
    ],
    roteiro: [
      'Conte quantas P consecutivas ficam sem QRS: duas ou mais define avançado.',
      'Procure batimentos conduzidos e verifique se o PR se repete.',
      'Diferencie batimentos conduzidos de batimentos de escape.',
      'Avalie a largura do QRS e a frequência dos escapes.',
      'Monitorize, corrija causas reversíveis e prepare estimulação.',
    ],
    separando: [
      { de: 'BAV total', chave: 'No total nenhum batimento é conduzido e o PR é sempre aleatório.' },
      { de: 'Mobitz II', chave: 'No Mobitz II falha uma P isolada por vez; aqui falham duas ou mais consecutivas.' },
      { de: 'Pausa sinusal', chave: 'Na pausa não há ondas P; aqui elas estão presentes e visíveis, apenas não conduzem.' },
    ],
    fixacao: [
      'Duas ou mais P bloqueadas seguidas, com alguma condução preservada: bloqueio avançado.',
      'Achar UM batimento com PR reprodutível é o que separa avançado de total.',
      'FA que fica lenta e regular = bloqueio AV avançado, pense em digoxina.',
    ],
  },
}

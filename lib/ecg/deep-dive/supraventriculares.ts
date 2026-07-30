import type { DeepDiveMap } from './types'

/** Arritmias supraventriculares — tudo que nasce acima da bifurcação do His. */
export const DEEP_DIVE_SUPRAVENTRICULARES: DeepDiveMap = {
  'afib-controlled': {
    emUmaFrase:
      'Ausência absoluta de onda P substituída por ondulações finas da linha de base, com intervalos RR completamente irregulares e frequência ventricular dentro da faixa aceitável.',
    secoes: [
      {
        titulo: 'O caos elétrico atrial',
        texto:
          'Na fibrilação atrial, múltiplas frentes de onda circulam simultaneamente pelo miocárdio atrial, mantidas por rotores e por focos deflagradores localizados sobretudo nas mangas musculares que penetram as veias pulmonares. Em vez de uma despolarização organizada de cima para baixo, o átrio recebe 400 a 600 impulsos por minuto, em direções aleatórias. Nenhum deles é grande o bastante para gerar uma onda P: o que aparece no papel é apenas o somatório flutuante desses microvetores, as ondas f, mais bem vistas em V1. O átrio não contrai de forma efetiva — perde-se o kick atrial, responsável por até 20% a 30% do enchimento ventricular, o que explica a queda do débito e o risco de estase e trombo no apêndice atrial esquerdo.',
      },
      {
        titulo: 'Por que o RR é irregularmente irregular',
        texto:
          'O nó AV funciona como um filtro imperfeito. Bombardeado por centenas de impulsos por minuto, ele bloqueia a maioria de forma imprevisível, dependendo do estado refratário momentâneo de cada fibra e do fenômeno de condução oculta — impulsos que entram parcialmente no nó, não chegam ao ventrículo, mas deixam o tecido refratário e alteram a passagem do impulso seguinte. Daí a marca registrada da FA: RR sem padrão algum, sem repetição, sem grupamento. É uma irregularidade diferente da arritmia sinusal (cíclica), da extrassistolia (interrupções isoladas em ritmo regular) e do bloqueio Wenckebach (grupamentos repetitivos). Se a fibrilação atrial se tornar regular, desconfie: pode significar bloqueio AV total com escape, ritmo juncional acelerado (clássico da intoxicação digitálica) ou ritmo de marca-passo.',
      },
      {
        titulo: 'Resposta controlada: o que significa e por que importa',
        texto:
          'Fala-se em resposta controlada quando a frequência ventricular média fica aproximadamente entre 60 e 110 bpm em repouso. O estudo RACE II mostrou que o controle leniente (frequência de repouso abaixo de 110 bpm) não é inferior ao controle estrito em desfechos clínicos para muitos pacientes, o que simplificou a prática. A frequência importa por duas razões: taquicardia persistente por semanas a meses pode causar taquicardiomiopatia, uma disfunção sistólica reversível com o controle da frequência; e frequências muito baixas podem indicar doença do nó AV ou excesso de fármacos.',
      },
      {
        titulo: 'As três decisões da fibrilação atrial',
        texto:
          'Primeira e mais importante: anticoagulação, definida pelo escore CHA2DS2-VASc (insuficiência cardíaca, hipertensão, idade acima de 75 anos valendo 2 pontos, diabetes, AVC ou AIT prévio valendo 2 pontos, doença vascular, idade de 65 a 74 anos, sexo feminino como modificador de risco). A decisão não depende de a FA ser paroxística, persistente ou permanente, nem de o paciente estar em ritmo sinusal no momento da consulta. Segunda: controle de frequência, com betabloqueador ou bloqueador de canal de cálcio não di-hidropiridínico, e digoxina como adjuvante em pacientes sedentários ou com insuficiência cardíaca. Terceira: controle de ritmo, hoje indicado precocemente em pacientes sintomáticos, jovens ou com insuficiência cardíaca, por antiarrítmico ou ablação de veias pulmonares. Além disso, tratar o substrato — hipertensão, apneia do sono, obesidade, álcool, hipertireoidismo — é parte central do tratamento moderno, não um detalhe.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregularmente irregular — a característica que define a FA no traçado.' },
      { onda: 'Onda P', achado: 'Ausente em todas as derivações; substituída por ondas f finas, mais visíveis em V1.' },
      { onda: 'Linha de base', achado: 'Ondulante e irregular, sem qualquer periodicidade; não confundir com o serrote regular do flutter.' },
      { onda: 'QRS', achado: 'Estreito, salvo bloqueio de ramo prévio ou aberrância (fenômeno de Ashman).' },
      { onda: 'Frequência ventricular', achado: 'Entre 60 e 110 bpm na resposta controlada; conte um traçado longo, pois a variação é grande.' },
    ],
    roteiro: [
      'Procure onda P em DII e V1 — não há.',
      'Marque três ou quatro intervalos RR com o paquímetro: nenhum se repete.',
      'Verifique se a linha de base tem ondulação fina (f) e não serrote regular (F).',
      'Calcule a frequência média num traçado de pelo menos 10 segundos.',
      'Calcule o CHA2DS2-VASc antes de sair da beira do leito.',
    ],
    separando: [
      { de: 'Flutter atrial com condução variável', chave: 'No flutter existem ondas F regulares em serrote a ~300 bpm entre os QRS.' },
      { de: 'Taquicardia atrial multifocal', chave: 'Na TAM existem ondas P visíveis, com três ou mais morfologias distintas.' },
      { de: 'Arritmia sinusal / extrassístoles', chave: 'Ambas mantêm onda P e alguma previsibilidade do ritmo.' },
    ],
    fixacao: [
      'Sem P + RR irregularmente irregular = fibrilação atrial.',
      'FA que fica regular é sinal de alarme: pense em BAV total ou intoxicação digitálica.',
      'A anticoagulação depende do CHA2DS2-VASc, não do tipo nem da duração da FA.',
    ],
  },

  'afib-rvr': {
    emUmaFrase:
      'A mesma fibrilação atrial, agora com o nó AV deixando passar impulsos demais: frequência ventricular acima de 110–120 bpm, irregular, com o paciente frequentemente sintomático.',
    secoes: [
      {
        titulo: 'Por que a resposta ventricular dispara',
        texto:
          'O átrio já estava fibrilando a 400–600 bpm; o que mudou foi o filtro. Qualquer coisa que encurte o período refratário do nó AV ou aumente o tônus simpático permite que mais impulsos passem: febre, sepse, hipovolemia, dor, anemia, tromboembolismo pulmonar, hipertireoidismo, abstinência alcoólica, insuficiência cardíaca descompensada, isquemia, uso de simpaticomiméticos. Essa lista é a razão pela qual a FA com resposta rápida raramente é um problema isolado do coração: em boa parte dos casos ela é a manifestação cardíaca de outra doença aguda. Tratar apenas a frequência sem procurar o gatilho é a receita para o insucesso terapêutico.',
      },
      {
        titulo: 'Consequências hemodinâmicas',
        texto:
          'Duas perdas se somam. A primeira é a da contribuição atrial ao enchimento ventricular. A segunda é a do tempo diastólico: em 160 bpm, a diástole encurta desproporcionalmente, reduzindo tanto o enchimento quanto a perfusão coronariana, que ocorre predominantemente na diástole. Em corações com hipertrofia, estenose aórtica, disfunção diastólica ou doença coronariana, essa combinação precipita edema agudo de pulmão, angina e hipotensão. O paciente típico chega com palpitação, dispneia, dor torácica e mal-estar; a irregularidade do pulso é palpável, e há déficit de pulso — a frequência do pulso radial é menor que a auscultada, porque batimentos com enchimento insuficiente não geram onda de pulso periférica.',
      },
      {
        titulo: 'Conduta: estabilidade define tudo',
        texto:
          'Instabilidade — hipotensão, alteração do nível de consciência, dor torácica isquêmica, choque, edema agudo — indica cardioversão elétrica sincronizada imediata, com sedação. Se estável, controla-se a frequência com betabloqueador (metoprolol) ou diltiazem intravenoso; evita-se o diltiazem na disfunção sistólica grave, preferindo-se amiodarona ou digoxina. A duração do episódio é decisiva para o ritmo: acima de 48 horas (ou incerta), a cardioversão eletiva exige anticoagulação por três semanas antes ou ecocardiograma transesofágico excluindo trombo, seguida de quatro semanas de anticoagulação após o procedimento, porque o átrio permanece atordoado e trombogênico mesmo depois de restaurado o ritmo sinusal. Duas armadilhas devem ser lembradas: nunca usar bloqueador do nó AV (verapamil, diltiazem, betabloqueador, digoxina, adenosina) em FA pré-excitada — o bloqueio nodal favorece a condução pela via acessória e pode degenerar em fibrilação ventricular; e sempre reavaliar se a taquicardia é causa ou consequência do quadro clínico.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregularmente irregular e rápido; em frequências muito altas a irregularidade fica sutil — meça com paquímetro.' },
      { onda: 'Onda P', achado: 'Ausente; as ondas f podem ficar difíceis de ver na frequência alta.' },
      { onda: 'QRS', achado: 'Estreito na maioria; QRS largo aqui obriga a pensar em aberrância, bloqueio prévio ou pré-excitação.' },
      { onda: 'Frequência', achado: 'Acima de 110–120 bpm, podendo passar de 180 bpm.' },
      { onda: 'Segmento ST', achado: 'Depressão de demanda é comum e não significa necessariamente doença coronariana obstrutiva.' },
    ],
    roteiro: [
      'Confirme a ausência de P e a irregularidade do RR.',
      'Meça a frequência média e avalie a perfusão imediatamente.',
      'Instável? Cardioversão sincronizada agora.',
      'Estável? Betabloqueador ou diltiazem — e procure o gatilho: febre, TEP, sepse, tireoide, álcool.',
      'QRS largo e muito rápido, irregular? Pense em FA pré-excitada e evite bloqueadores do nó AV.',
    ],
    separando: [
      { de: 'Taquicardia atrial multifocal', chave: 'A TAM tem P visíveis com três ou mais morfologias; costuma acompanhar DPOC.' },
      { de: 'Flutter com condução variável', chave: 'Procure ondas F em serrote a 300 bpm em DII, DIII e aVF.' },
      { de: 'FA pré-excitada', chave: 'QRS largo, muito rápido (acima de 200 bpm) e com larguras variáveis — emergência distinta.' },
    ],
    fixacao: [
      'FA rápida quase sempre tem um motivo fora do coração — procure-o.',
      'Instável = choque elétrico sincronizado, sem espera.',
      'Regra dos 48 h: acima disso, anticoagule ou faça eco transesofágico antes de cardioverter.',
    ],
  },

  'aflutter-2-1': {
    emUmaFrase:
      'Circuito macrorreentrante organizado no átrio direito a cerca de 300 bpm, com o nó AV conduzindo um de cada dois impulsos — resultado: taquicardia regular travada em torno de 150 bpm.',
    secoes: [
      {
        titulo: 'O circuito anatômico',
        texto:
          'O flutter atrial típico é uma macrorreentrada que percorre o átrio direito em torno do anel tricúspide, passando obrigatoriamente por uma zona estreita de condução lenta entre a valva tricúspide e a veia cava inferior: o istmo cavotricuspídeo. É essa dependência anatômica que torna o flutter típico curável por ablação com taxas de sucesso superiores a 90% — basta criar uma linha de bloqueio no istmo. Na forma anti-horária, a mais comum, o circuito sobe pelo septo interatrial e desce pela parede lateral, gerando ondas F negativas em DII, DIII e aVF (o clássico dente de serra) e positivas em V1. Na forma horária, o circuito gira ao contrário e as ondas F ficam positivas na parede inferior e negativas em V1.',
      },
      {
        titulo: 'Por que 150 bpm é a frequência assinatura',
        texto:
          'A frequência atrial do flutter típico é notavelmente constante, entre 250 e 350 bpm, tipicamente 300. O nó AV não consegue conduzir 1:1 nessa velocidade em adultos com condução normal, e o bloqueio fisiológico mais comum é o 2:1 — daí a frequência ventricular de aproximadamente 150 bpm. Essa constância cria a regra prática mais útil da eletrocardiografia de emergência: toda taquicardia regular de QRS estreito travada perto de 150 bpm é flutter até prova em contrário. O problema é que, no 2:1, uma das ondas F fica escondida dentro do QRS e a outra dentro da onda T, e o traçado parece uma taquicardia sinusal comum. O erro é frequente e evitável.',
      },
      {
        titulo: 'Como desmascarar o flutter',
        texto:
          'Aumente transitoriamente o bloqueio AV e as ondas F aparecem sozinhas. Isso pode ser feito com manobra vagal (Valsalva modificada, com elevação passiva das pernas após o esforço, é a de maior rendimento) ou com adenosina 6 mg em bolus rápido seguido de flush, com o traçado rodando em papel contínuo — o registro durante a adenosina é o exame diagnóstico, não apenas um tratamento. Outros recursos: olhar V1, onde as ondas F costumam ser mais discretas mas visíveis; usar derivação de Lewis; e medir a distância entre duas ondas F suspeitas para verificar se são exatamente regulares a 300 bpm. Importante: a adenosina não converte o flutter — o circuito não passa pelo nó AV —, ela apenas o revela.',
      },
      {
        titulo: 'Tratamento',
        texto:
          'O controle de frequência no flutter é notoriamente mais difícil que na fibrilação atrial, porque a condução tende a saltar de 2:1 para 1:1 ou cair para 3:1 em degraus, e não de forma gradual. Por isso, e por sua ablação ser altamente eficaz, o flutter típico costuma seguir estratégia de controle de ritmo mais cedo. A cardioversão elétrica sincronizada funciona com energias baixas (50 a 100 J bifásicos), e a estimulação atrial rápida é alternativa em pacientes com marca-passo. As regras de anticoagulação são as mesmas da fibrilação atrial — o risco tromboembólico é comparável, e as duas arritmias frequentemente coexistem no mesmo paciente. Uma armadilha grave: antiarrítmicos da classe IC (propafenona, flecainida) lentificam a frequência atrial do flutter para perto de 200 bpm, faixa em que o nó AV pode conduzir 1:1, produzindo taquicardia ventricularizada de 200 bpm — por isso nunca se usa classe IC sem bloqueio concomitante do nó AV.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com frequência ventricular travada em torno de 150 bpm.' },
      { onda: 'Ondas F', achado: 'Em dente de serra, regulares a ~300 bpm, negativas em DII/DIII/aVF no flutter típico anti-horário.' },
      { onda: 'Linha de base', achado: 'Nunca isoelétrica entre os QRS nas derivações inferiores — o serrote é contínuo.' },
      { onda: 'QRS', achado: 'Estreito, salvo bloqueio de ramo ou aberrância.' },
      { onda: 'Relação AV', achado: '2:1 na maioria; 4:1 nos tratados; 1:1 é emergência (frequência de 300 bpm).' },
    ],
    roteiro: [
      'Taquicardia regular de QRS estreito perto de 150 bpm: suspeite.',
      'Olhe DII, DIII, aVF e V1 procurando o serrote.',
      'Marque a distância entre duas ondas F e confirme regularidade a ~300 bpm.',
      'Se em dúvida, faça manobra vagal ou adenosina com registro contínuo.',
      'Decida entre controle de frequência, cardioversão e ablação de istmo; aplique as regras de anticoagulação da FA.',
    ],
    separando: [
      { de: 'Taquicardia sinusal', chave: 'A sinusal varia com o contexto e tem P visível; o flutter fica travado em 150 bpm.' },
      { de: 'AVNRT', chave: 'A AVNRT costuma bater acima de 160 bpm, sem serrote, com pseudo-r′ em V1.' },
      { de: 'Fibrilação atrial', chave: 'A FA é irregular e tem ondulação caótica; o flutter é regular e organizado.' },
    ],
    fixacao: [
      '“FC de 150? Procure o serrote.” É a regra que mais salva diagnósticos na emergência.',
      'Adenosina no flutter é diagnóstica, não terapêutica.',
      'Classe IC sem bloqueador do nó AV pode transformar flutter 2:1 em flutter 1:1 a 200 bpm.',
    ],
  },

  avnrt: {
    emUmaFrase:
      'Reentrada dentro do próprio nó AV: taquicardia regular de QRS estreito, 150–250 bpm, de início e término súbitos, com a onda P escondida dentro do QRS.',
    secoes: [
      {
        titulo: 'A dupla via nodal',
        texto:
          'Cerca de um terço das pessoas possui, na região do nó AV, duas vias funcionalmente distintas: a via rápida, de condução veloz e período refratário longo, e a via lenta, de condução vagarosa e período refratário curto. Em ritmo sinusal, o impulso desce pela via rápida e o PR é normal. Quando uma extrassístole atrial chega no momento exato em que a via rápida ainda está refratária, ela desce pela via lenta — o PR desse batimento se alonga subitamente — e, ao chegar embaixo, encontra a via rápida já recuperada e sobe por ela. Ao voltar ao topo, reencontra a via lenta disponível e desce de novo. Está montado o circuito: um giro fechado dentro do nó AV, que se autoperpetua a 150–250 bpm. É a taquicardia supraventricular paroxística mais comum, típica de mulheres jovens sem cardiopatia estrutural.',
      },
      {
        titulo: 'Por que a onda P desaparece',
        texto:
          'Como o circuito é minúsculo e está localizado no nó AV, átrios e ventrículos são despolarizados quase simultaneamente. A onda P retrógrada acontece ao mesmo tempo que o QRS e fica sepultada dentro dele na maioria dos casos. Quando emerge parcialmente, produz as duas assinaturas clássicas: a pseudo-onda r′ no final do QRS em V1 e a pseudo-onda S em DII, DIII e aVF — deflexões que não existiam no ECG basal do paciente e que aparecem só durante a taquicardia. Comparar o traçado da taquicardia com o traçado em ritmo sinusal do mesmo paciente é o método mais elegante de demonstrá-las. Na forma atípica (lenta-rápida invertida, cerca de 5–10% dos casos), a P retrógrada aparece bem depois do QRS, com RP longo.',
      },
      {
        titulo: 'Como interromper o circuito',
        texto:
          'Diferentemente do flutter, aqui o nó AV faz parte do circuito — bloqueá-lo termina a arritmia. Começa-se com manobras vagais: a Valsalva modificada (sopro contra resistência por 15 segundos, seguido de decúbito e elevação passiva das pernas a 45 graus por mais 15 segundos) tem eficácia bem superior à Valsalva convencional. Se falhar, adenosina 6 mg em bolus rápido por veia calibrosa com flush imediato de soro, seguida de 12 mg se necessário; o paciente deve ser avisado da sensação de opressão torácica e mal-estar transitórios, e o traçado deve estar sendo registrado. Alternativas: verapamil, diltiazem ou betabloqueador intravenoso. Instabilidade hemodinâmica indica cardioversão sincronizada. No longo prazo, a ablação da via lenta cura mais de 95% dos casos, com risco de bloqueio AV inferior a 1%, e é hoje a primeira escolha para pacientes com episódios recorrentes.',
      },
      {
        titulo: 'Uma ressalva importante',
        texto:
          'Nem toda taquicardia regular de QRS estreito é AVNRT, e o diagnóstico definitivo por vezes só é possível no estudo eletrofisiológico. Mas há uma regra de segurança que vale mais que a precisão diagnóstica: diante de taquicardia de QRS LARGO, não presuma aberrância. Trate como taquicardia ventricular até prova em contrário, especialmente se o paciente tiver cardiopatia estrutural ou infarto prévio. Usar verapamil numa taquicardia ventricular pode causar colapso hemodinâmico.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Perfeitamente regular, com início e término abruptos (característica paroxística).' },
      { onda: 'Frequência', achado: 'Entre 150 e 250 bpm, tipicamente 180–200.' },
      { onda: 'Onda P', achado: 'Não visível na forma típica — está dentro do QRS; procure pseudo-r′ em V1 e pseudo-S em DII.' },
      { onda: 'QRS', achado: 'Estreito, a menos que haja aberrância ou bloqueio de ramo preexistente.' },
      { onda: 'Segmento ST', achado: 'Depressão difusa por demanda é comum durante a crise e regride após a reversão.' },
    ],
    roteiro: [
      'Taquicardia regular, estreita, entre 150 e 250 bpm.',
      'Procure onda P: não a encontra? Suspeite de AVNRT.',
      'Olhe V1 procurando pseudo-r′ e DII procurando pseudo-S.',
      'Compare com o ECG basal do paciente se disponível.',
      'Manobra vagal, depois adenosina, com registro contínuo do traçado.',
    ],
    separando: [
      { de: 'Taquicardia sinusal', chave: 'A sinusal tem P visível, sobe e desce gradualmente e raramente ultrapassa 180 bpm no adulto.' },
      { de: 'Flutter 2:1', chave: 'Frequência travada em 150 bpm e ondas F em serrote reveladas pela adenosina.' },
      { de: 'AVRT ortodrômica', chave: 'Na AVRT o circuito usa uma via acessória e a P retrógrada aparece depois do QRS (RP curto, mas visível); procure pré-excitação no ECG basal.' },
      { de: 'Taquicardia ventricular', chave: 'QRS largo muda toda a abordagem — trate como TV até prova em contrário.' },
    ],
    fixacao: [
      'Mulher jovem, palpitação de início e fim súbitos, 180 bpm, QRS estreito, sem P = AVNRT.',
      'A adenosina interrompe o que passa pelo nó AV: reverte AVNRT e AVRT, apenas revela flutter e taquicardia atrial.',
      'Pseudo-r′ em V1 que não existia no ECG basal é onda P retrógrada disfarçada.',
    ],
  },

  mat: {
    emUmaFrase:
      'Três ou mais morfologias diferentes de onda P, com PR variáveis e frequência acima de 100 bpm — a taquicardia do pneumopata grave.',
    secoes: [
      {
        titulo: 'Múltiplos focos competindo',
        texto:
          'A taquicardia atrial multifocal (TAM) resulta de vários focos atriais ectópicos disparando de forma independente, cada um gerando uma onda P de morfologia própria e um intervalo PR próprio. O mecanismo predominante é o automatismo deflagrado por atividade adrenérgica, hipoxemia, hipercapnia, acidose, distensão atrial direita, hipocalemia, hipomagnesemia e efeito de teofilina e beta-agonistas. Não à toa, o cenário clássico é o paciente com DPOC exacerbada em uso de broncodilatadores — mas também aparece na insuficiência cardíaca descompensada, na sepse, no pós-operatório e em pacientes críticos em geral. Quando o mesmo padrão ocorre com frequência abaixo de 100 bpm, chama-se marca-passo atrial migratório, que é sua contraparte benigna.',
      },
      {
        titulo: 'Distinguir da fibrilação atrial: a confusão mais comum',
        texto:
          'Os dois ritmos são irregulares e rápidos, e a TAM é rotineiramente confundida com FA — inclusive por algoritmos automáticos. A diferença é categórica e está na existência da onda P. Na TAM há ondas P discretas, identificáveis, separadas por linha de base isoelétrica, com pelo menos três morfologias diferentes e PR variáveis; na FA não existe onda P alguma. Essa distinção não é acadêmica: muda o tratamento. A TAM não responde a cardioversão elétrica (não é reentrante, e o choque não muda focos automáticos) e não tem, por si, indicação de anticoagulação; a FA tem ambos. Erro comum é chocar uma TAM.',
      },
      {
        titulo: 'Tratamento é tratar a doença de base',
        texto:
          'Corrigir hipoxemia, acidose e broncoespasmo; repor potássio e sobretudo magnésio, que estabiliza a membrana atrial e pode reduzir a frequência de forma isolada; revisar a dose de teofilina e de beta-agonistas. Quando é necessário reduzir a frequência ventricular, o verapamil e o diltiazem são preferíveis, porque o betabloqueador é frequentemente contraindicado pela doença broncoespástica — quando não houver contraindicação, o metoprolol é eficaz. A amiodarona tem papel limitado. Em última análise, a TAM é um marcador de gravidade da doença de base: sua presença correlaciona-se com mortalidade hospitalar elevada, e é ela, não a arritmia, que deve receber a atenção terapêutica.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Irregular, mas com ondas P claramente identificáveis antes de cada QRS.' },
      { onda: 'Onda P', achado: 'Pelo menos três morfologias diferentes na mesma derivação — critério diagnóstico obrigatório.' },
      { onda: 'Intervalo PR', achado: 'Variável de batimento a batimento, acompanhando a mudança de foco.' },
      { onda: 'Frequência', achado: 'Acima de 100 bpm (abaixo disso, chama-se marca-passo atrial migratório).' },
      { onda: 'Linha de base', achado: 'Isoelétrica entre as ondas P — diferentemente da ondulação contínua da FA.' },
      { onda: 'QRS', achado: 'Estreito; pode haver sinais de sobrecarga direita (P pulmonale, desvio do eixo) pela doença pulmonar.' },
    ],
    roteiro: [
      'Taquicardia irregular: primeiro procure onda P.',
      'Encontrou P? Conte as morfologias diferentes: três ou mais fecham o diagnóstico.',
      'Verifique se o PR também varia.',
      'Confirme linha de base isoelétrica entre as P.',
      'Vá para a doença de base: gasometria, potássio, magnésio, teofilina, broncoespasmo.',
    ],
    separando: [
      { de: 'Fibrilação atrial', chave: 'Na FA não existe onda P; na TAM elas existem e são polimórficas.' },
      { de: 'Extrassístoles atriais frequentes', chave: 'Nas extrassístoles há um ritmo de base sinusal identificável, interrompido por batimentos precoces.' },
      { de: 'Marca-passo atrial migratório', chave: 'Mesmo padrão, mas com frequência abaixo de 100 bpm.' },
    ],
    fixacao: [
      'DPOC exacerbada + taquicardia irregular = procure as três morfologias de P antes de dizer FA.',
      'TAM não se choca e não se anticoagula por si só: trate o pulmão e o magnésio.',
      'Magnésio é o eletrólito subestimado desta arritmia.',
    ],
  },

  'afib-ashman': {
    emUmaFrase:
      'Dentro de uma fibrilação atrial, um batimento sai largo com cara de bloqueio de ramo direito — não é extrassístole ventricular, é aberrância por ciclo longo seguido de ciclo curto.',
    secoes: [
      {
        titulo: 'A física do fenômeno',
        texto:
          'O período refratário do sistema His-Purkinje não é fixo: ele é proporcional à duração do ciclo cardíaco precedente. Depois de um RR longo, o período refratário do batimento seguinte se alonga; se, logo em seguida, chegar um impulso muito precoce (RR curto), ele encontrará parte do sistema de condução ainda refratária. Como o ramo direito tem o período refratário mais longo, é ele quem costuma falhar: o impulso desce apenas pelo ramo esquerdo e o ventrículo direito é ativado tardiamente, músculo a músculo. O resultado é um QRS largo com morfologia de bloqueio de ramo direito. Na fibrilação atrial, com sua sucessão aleatória de ciclos, a sequência ciclo longo–ciclo curto acontece o tempo todo — daí a frequência do fenômeno de Ashman nessa arritmia.',
      },
      {
        titulo: 'Por que importa não confundir com extrassístole ventricular',
        texto:
          'A consequência prática do erro é considerável: um paciente com fibrilação atrial e batimentos largos rotulados como extrassístoles ventriculares pode receber antiarrítmico desnecessário, investigação de cardiopatia estrutural e mudança de conduta injustificada — quando, na verdade, apenas conduziu com aberrância. Os sinais a favor de aberrância de Ashman são: morfologia trifásica típica de bloqueio de ramo direito em V1 (rSR′, com o R′ mais alto que o r inicial), sequência ciclo longo–ciclo curto imediatamente antes do batimento, primeiro vetor do QRS idêntico ao dos batimentos normais (porque a ativação começa pelo mesmo caminho), e ausência de pausa compensatória. Já a extrassístole ventricular tende a ter morfologia monofásica ou bifásica, com início lento e empastado, vetor inicial diferente e pausa após o batimento.',
      },
      {
        titulo: 'Limites do critério',
        texto:
          'A regra de Ashman é sugestiva, não infalível: extrassístoles ventriculares também podem ocorrer após ciclos longos, e a aberrância pode assumir padrão de bloqueio de ramo esquerdo em alguns pacientes. Séries de batimentos largos consecutivos em FA devem ser interpretadas com cautela — se houver instabilidade ou dúvida razoável sobre taquicardia ventricular, a segurança manda tratar como ventricular. Um recurso útil é comparar com ECGs anteriores: se o paciente já apresentava bloqueio de ramo direito intermitente dependente de frequência, o achado se explica sozinho.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Fibrilação atrial de base — irregularmente irregular, sem onda P.' },
      { onda: 'Batimento aberrante', achado: 'QRS largo isolado, precedido por sequência ciclo longo–ciclo curto.' },
      { onda: 'Morfologia em V1', achado: 'rSR′ trifásico típico de bloqueio de ramo direito, com R′ mais alto que o r inicial.' },
      { onda: 'Vetor inicial', achado: 'Os primeiros 40 ms do QRS são iguais aos dos batimentos conduzidos normalmente.' },
      { onda: 'Pausa', achado: 'Ausente ou não compensatória — na FA, a análise de pausa perde valor, mas a ausência ajuda.' },
    ],
    roteiro: [
      'Reconheça a fibrilação atrial de base.',
      'Localize o batimento largo isolado.',
      'Meça os dois ciclos anteriores: longo seguido de curto?',
      'Olhe V1: rSR′ trifásico favorece aberrância.',
      'Compare o início do QRS com os batimentos normais.',
      'Na dúvida com instabilidade, trate como ventricular.',
    ],
    separando: [
      { de: 'Extrassístole ventricular', chave: 'Morfologia bizarra, início empastado, vetor inicial diferente e ausência da sequência longo–curto.' },
      { de: 'Taquicardia ventricular', chave: 'Vários batimentos largos consecutivos em ritmo regular, com dissociação AV — situação diferente e mais grave.' },
      { de: 'FA pré-excitada', chave: 'QRS largos e muito rápidos, com larguras variáveis e frequência acima de 200 bpm.' },
    ],
    fixacao: [
      'Ciclo longo, ciclo curto, batimento largo: pense em Ashman antes de pensar em extrassístole.',
      'O ramo direito tem o período refratário mais longo — é sempre o primeiro a falhar.',
      'Aberrância imita ventricular, mas o vetor inicial do QRS a denuncia.',
    ],
  },

  'aflutter-variable': {
    emUmaFrase:
      'Ondas F regulares em serrote a cerca de 300 bpm, mas com o nó AV alternando bloqueios 2:1, 3:1 e 4:1 — o resultado é uma taquicardia irregular que imita fibrilação atrial.',
    secoes: [
      {
        titulo: 'O átrio é regular, o ventrículo não',
        texto:
          'Esta é a lição central: no flutter, a atividade atrial é sempre organizada e regular; a irregularidade, quando existe, vem inteiramente do comportamento do nó AV. Ele pode bloquear em proporções fixas (2:1, 3:1, 4:1) ou alternar entre elas, produzindo um RR variável. As causas de condução variável incluem fármacos bloqueadores do nó AV, tônus vagal flutuante, doença do sistema de condução e o próprio fenômeno de condução oculta, em que impulsos que penetram parcialmente o nó alteram a refratariedade para o próximo. Um detalhe elegante: mesmo com bloqueio variável, os intervalos RR costumam ser múltiplos aproximados do ciclo atrial — se o ciclo F é de 200 ms, os RR tendem a ser 400, 600 ou 800 ms, e não valores aleatórios como na fibrilação atrial.',
      },
      {
        titulo: 'Por que se confunde com fibrilação atrial',
        texto:
          'À primeira vista, ambos parecem taquicardias irregulares de QRS estreito. A distinção exige procurar deliberadamente a atividade atrial em DII, DIII, aVF e V1, e verificar se a linha de base tem periodicidade. Uma técnica prática é medir a distância entre duas deflexões atriais suspeitas e “andar” com o paquímetro por todo o traçado: no flutter, as marcas caem exatamente sobre cada onda F, inclusive as que estão parcialmente escondidas dentro dos QRS e das T. Na fibrilação atrial nada se encaixa, porque não há periodicidade. Essa manobra do paquímetro é uma das mais úteis do arsenal de quem interpreta ECG.',
      },
      {
        titulo: 'Implicações clínicas',
        texto:
          'A conduta é praticamente idêntica à do flutter típico: controle de frequência é difícil, ablação de istmo cavotricuspídeo é altamente eficaz, cardioversão elétrica funciona com baixa energia, e as regras de anticoagulação são as mesmas da fibrilação atrial. Distinguir corretamente flutter de FA, entretanto, muda a estratégia de longo prazo — o flutter tem uma cura anatômica que a FA não tem — e permite antecipar o comportamento da frequência, que no flutter tende a mudar em degraus abruptos em vez de variar suavemente.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Ventricular irregular, mas atividade atrial perfeitamente regular.' },
      { onda: 'Ondas F', achado: 'Serrote contínuo a ~300 bpm, melhor visto em DII, DIII, aVF e V1.' },
      { onda: 'Relação AV', achado: 'Alternante entre 2:1, 3:1 e 4:1, produzindo RR que são múltiplos do ciclo atrial.' },
      { onda: 'Linha de base', achado: 'Nunca isoelétrica nas derivações inferiores — há sempre onda F acontecendo.' },
      { onda: 'QRS', achado: 'Estreito, com morfologia constante.' },
    ],
    roteiro: [
      'Diante de taquicardia irregular, procure atividade atrial organizada.',
      'Marque dois picos de F com o paquímetro e caminhe pelo traçado inteiro.',
      'Se todas as marcas caírem sobre ondas F, é flutter, não FA.',
      'Verifique se os RR são múltiplos aproximados do ciclo atrial.',
      'Aplique conduta de flutter: frequência, cardioversão, ablação, anticoagulação.',
    ],
    separando: [
      { de: 'Fibrilação atrial', chave: 'Sem periodicidade atrial; o paquímetro não encaixa em nada.' },
      { de: 'Taquicardia atrial multifocal', chave: 'P discretas com três ou mais morfologias e linha de base isoelétrica entre elas.' },
      { de: 'Flutter 2:1', chave: 'No 2:1 o RR é fixo em torno de 150 bpm; aqui varia em degraus.' },
    ],
    fixacao: [
      'Flutter é sempre regular no átrio: a irregularidade é culpa do nó AV.',
      'Truque do paquímetro: marque duas F e caminhe pelo traçado.',
      'RR múltiplos do ciclo atrial = flutter; RR aleatórios = fibrilação.',
    ],
  },

  'aflutter-atypical': {
    emUmaFrase:
      'Macrorreentrada atrial organizada que não usa o istmo cavotricuspídeo: ondas atriais regulares, mas com morfologia e eixo que não correspondem ao serrote clássico.',
    secoes: [
      {
        titulo: 'O que torna um flutter atípico',
        texto:
          'A definição é negativa e anatômica: qualquer macrorreentrada atrial cujo circuito não seja dependente do istmo cavotricuspídeo. Os cenários mais frequentes são circuitos no átrio esquerdo em pacientes já submetidos a ablação de fibrilação atrial (reentradas em torno das veias pulmonares, do anel mitral ou do teto atrial), cicatrizes de cirurgia cardíaca prévia — particularmente correções de cardiopatias congênitas, atriotomias e canulações —, e áreas de fibrose extensa em átrios muito dilatados. Como o circuito é diferente, a morfologia da onda atrial também é: as ondas podem ser positivas nas derivações inferiores, ter aparência mais sinusoidal do que em dente de serra, ou apresentar linha isoelétrica entre elas, e a frequência atrial pode variar mais amplamente, de 200 a 350 bpm.',
      },
      {
        titulo: 'Como suspeitar no traçado',
        texto:
          'A pista é a combinação de atividade atrial regular e organizada com morfologia que não fecha com o flutter típico. Quando as ondas F são positivas em DII, DIII e aVF, pensa-se em flutter típico reverso (horário) ou em circuito atrial esquerdo; quando são de baixa amplitude e difíceis de identificar, sobretudo em paciente com ablação prévia ou cirurgia cardíaca, a suspeita de flutter atípico deve ser alta. Vale lembrar que a superfície corporal tem limitações: o ECG sugere, mas o mapeamento eletroanatômico durante o estudo eletrofisiológico é que define o circuito.',
      },
      {
        titulo: 'Por que a distinção muda a conduta',
        texto:
          'A ablação do flutter típico é um procedimento relativamente simples, com alvo anatômico definido e alta taxa de sucesso. O flutter atípico exige mapeamento detalhado, frequentemente acesso ao átrio esquerdo por punção transeptal, e tem taxas de sucesso menores e maior recorrência. O controle farmacológico da frequência costuma ser difícil, e a anticoagulação segue as mesmas regras da fibrilação atrial — com atenção redobrada, já que esses pacientes têm átrios doentes e frequentemente história de FA. Reconhecer que o flutter é atípico ajuda a calibrar as expectativas do paciente e a encaminhar corretamente ao eletrofisiologista.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Atividade atrial regular e organizada; resposta ventricular regular ou variável.' },
      { onda: 'Ondas atriais', achado: 'Frequência de 200–350 bpm com morfologia que não é o serrote clássico — muitas vezes positivas nas inferiores.' },
      { onda: 'Linha de base', achado: 'Pode haver segmento isoelétrico entre as ondas, diferentemente do flutter típico.' },
      { onda: 'QRS', achado: 'Estreito, salvo bloqueio de ramo associado.' },
      { onda: 'Contexto', achado: 'Ablação de FA prévia ou cirurgia cardíaca na história aumenta muito a probabilidade.' },
    ],
    roteiro: [
      'Confirme que a atividade atrial é regular e organizada.',
      'Meça a frequência atrial: 200–350 bpm.',
      'Avalie a morfologia: não bate com o serrote típico negativo nas inferiores.',
      'Pergunte sobre ablação prévia e cirurgia cardíaca.',
      'Encaminhe para avaliação eletrofisiológica e aplique as regras de anticoagulação.',
    ],
    separando: [
      { de: 'Flutter típico', chave: 'Serrote negativo em DII/DIII/aVF, positivo em V1, dependente do istmo cavotricuspídeo.' },
      { de: 'Taquicardia atrial focal', chave: 'Na focal há linha isoelétrica clara entre P discretas e frequência geralmente menor (150–250 bpm).' },
      { de: 'Fibrilação atrial', chave: 'A FA não tem organização nem periodicidade atrial.' },
    ],
    fixacao: [
      'Flutter atípico é diagnóstico de contexto: ablação prévia ou cirurgia cardíaca na história.',
      'Serrote fora do padrão clássico deve levantar a hipótese.',
      'A ablação é mais complexa e menos eficaz que a do flutter típico — ajuste as expectativas.',
    ],
  },

  'focal-atrial-tachy': {
    emUmaFrase:
      'Um único foco atrial dispara rapidamente e assume o comando: ondas P uniformes, de morfologia diferente da sinusal, separadas por linha de base isoelétrica, a 150–250 bpm.',
    secoes: [
      {
        titulo: 'Mecanismo e locais preferenciais',
        texto:
          'A taquicardia atrial focal pode surgir por automatismo aumentado, atividade deflagrada ou microrreentrada em torno de um ponto. O foco tem localizações prediletas: crista terminal no átrio direito, óstios das veias pulmonares, anel tricúspide e mitral, seio coronário e apêndices atriais. A morfologia da onda P permite estimar a origem — P negativa em V1 sugere átrio direito, positiva em V1 sugere átrio esquerdo; P positiva nas inferiores indica foco alto, negativa indica foco baixo. Diferentemente da reentrada nodal, a taquicardia atrial pode ter fenômeno de aquecimento (a frequência aumenta progressivamente nos primeiros batimentos) e desaquecimento, típico dos mecanismos automáticos.',
      },
      {
        titulo: 'A resposta à adenosina como ferramenta diagnóstica',
        texto:
          'Como o circuito não depende do nó AV, a adenosina em geral não termina a taquicardia atrial — ela apenas aumenta o bloqueio AV e revela as ondas P, que passam a aparecer isoladas, sem QRS. Esse comportamento é diagnóstico e a separa da AVNRT e da AVRT, que terminam abruptamente com a droga. Algumas taquicardias atriais focais de mecanismo deflagrado são sensíveis à adenosina e podem terminar, o que é uma exceção conhecida. Outro achado importante: a taquicardia atrial pode existir com bloqueio AV (por exemplo, 2:1) sem que isso a interrompa — a presença de bloqueio AV durante uma taquicardia supraventricular praticamente exclui AVNRT e AVRT, cujos circuitos exigem condução AV íntegra.',
      },
      {
        titulo: 'Contextos e tratamento',
        texto:
          'Ocorre em corações normais, mas também na intoxicação digitálica (a clássica taquicardia atrial com bloqueio), na doença pulmonar, no pós-operatório cardíaco, na miocardiopatia e em pacientes com cicatrizes atriais. Quando incessante, pode causar taquicardiomiopatia — disfunção ventricular reversível com o controle da arritmia, motivo pelo qual taquicardias atriais persistentes merecem tratamento definitivo mesmo se pouco sintomáticas. As opções incluem betabloqueador e bloqueador de canal de cálcio para controle, antiarrítmicos de classe IC ou III em casos selecionados, e ablação por cateter do foco, com boas taxas de sucesso quando o mapeamento localiza bem a origem.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com possível aquecimento inicial da frequência.' },
      { onda: 'Onda P', achado: 'Uniforme, de morfologia diferente da sinusal, sempre igual a si mesma.' },
      { onda: 'Linha de base', achado: 'Isoelétrica entre as P — diferença fundamental em relação ao flutter.' },
      { onda: 'Frequência atrial', achado: '150–250 bpm; a condução AV pode ser 1:1 ou apresentar bloqueio.' },
      { onda: 'QRS', achado: 'Estreito; a presença de bloqueio AV durante a taquicardia afasta AVNRT e AVRT.' },
    ],
    roteiro: [
      'Identifique ondas P uniformes com morfologia não sinusal.',
      'Confirme linha de base isoelétrica entre elas.',
      'Meça a frequência atrial e a relação AV.',
      'Se houver dúvida, use adenosina: revela P sem terminar a arritmia.',
      'Investigue digoxina, doença pulmonar e função ventricular.',
    ],
    separando: [
      { de: 'Flutter atrial', chave: 'O flutter é mais rápido (~300 bpm) e não tem linha isoelétrica nas derivações inferiores.' },
      { de: 'Taquicardia sinusal', chave: 'A morfologia da P é diferente da sinusal — compare com um ECG basal.' },
      { de: 'AVNRT / AVRT', chave: 'Terminam com adenosina e não toleram bloqueio AV; a taquicardia atrial persiste.' },
      { de: 'TAM', chave: 'Na multifocal há três ou mais morfologias de P; aqui há apenas uma.' },
    ],
    fixacao: [
      'Taquicardia atrial COM bloqueio AV = pense em digoxina.',
      'Adenosina que revela P sem terminar a taquicardia aponta para origem atrial.',
      'Taquicardia incessante causa cardiomiopatia reversível — não a deixe correr por meses.',
    ],
  },

  'svt-aberrancy': {
    emUmaFrase:
      'Uma taquicardia supraventricular que desce com bloqueio de ramo funcional: QRS largo, regular e rápido — o grande simulador da taquicardia ventricular.',
    secoes: [
      {
        titulo: 'Por que o QRS alarga sendo supraventricular',
        texto:
          'Em frequências altas, o sistema His-Purkinje pode não conseguir recuperar-se a tempo entre um impulso e outro. O ramo com período refratário mais longo — habitualmente o direito — deixa de conduzir, e o ventrículo correspondente é ativado por propagação transeptal, célula a célula. O resultado é um QRS largo, com morfologia de bloqueio de ramo, apesar de a origem do ritmo ser inteiramente supraventricular. Isso pode acontecer em AVNRT, AVRT ortodrômica, taquicardia atrial, flutter e fibrilação atrial rápida. Some-se a isso o paciente que já tinha bloqueio de ramo em ritmo sinusal: nele, qualquer taquicardia supraventricular será de QRS largo desde o primeiro batimento.',
      },
      {
        titulo: 'A regra de segurança e os critérios',
        texto:
          'A regra prática mais importante da eletrocardiografia de emergência: toda taquicardia de QRS largo é ventricular até prova em contrário. Cerca de 80% delas são TV, proporção que sobe para mais de 90% em pacientes com infarto prévio ou cardiopatia estrutural. Existem critérios morfológicos e algoritmos (Brugada, Vereckei, critério de aVR) que ajudam a inclinar a balança, mas nenhum é perfeito. Os achados que praticamente cravam origem ventricular são: dissociação AV, batimentos de captura e de fusão, concordância positiva ou negativa em todas as precordiais, QRS acima de 160 ms e eixo no quadrante noroeste. A favor de aberrância pesam: morfologia trifásica típica em V1 (rSR′ para bloqueio de ramo direito), QRS idêntico ao do ECG basal do paciente durante ritmo sinusal, e resposta à adenosina.',
      },
      {
        titulo: 'Conduta segura',
        texto:
          'Se o paciente estiver instável, cardioversão elétrica sincronizada resolve os dois diagnósticos. Se estável e a dúvida persistir, o caminho seguro é tratar como taquicardia ventricular: amiodarona ou procainamida (esta com melhor desempenho no estudo PROCAMIO), evitando verapamil e diltiazem, que podem causar colapso hemodinâmico numa TV. A adenosina pode ser usada com cautela em taquicardia regular e monomórfica de origem incerta, funcionando como teste diagnóstico — mas é contraindicada quando a taquicardia é irregular ou há suspeita de pré-excitação. Buscar ECGs antigos é uma das medidas mais úteis e mais esquecidas: um traçado prévio com o mesmo bloqueio de ramo em ritmo sinusal resolve o caso em segundos.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular e rápido, tipicamente 150–220 bpm.' },
      { onda: 'QRS', achado: 'Largo, com morfologia de bloqueio de ramo — procure rSR′ trifásico em V1 a favor de aberrância.' },
      { onda: 'Dissociação AV', achado: 'Ausente na aberrância; se presente, o diagnóstico é taquicardia ventricular.' },
      { onda: 'Onda P', achado: 'Pode haver P retrógrada; a relação AV 1:1 não exclui TV, mas é compatível com supraventricular.' },
      { onda: 'Comparação', achado: 'QRS igual ao do ECG basal em ritmo sinusal é forte evidência de aberrância.' },
    ],
    roteiro: [
      'Identifique taquicardia regular de QRS largo.',
      'Procure dissociação AV, capturas e fusões — se houver, é TV.',
      'Avalie a morfologia em V1 e V6 e a concordância precordial.',
      'Busque ECG antigo com o mesmo bloqueio de ramo.',
      'Na dúvida, trate como TV: procainamida ou amiodarona; instável, cardioverta.',
    ],
    separando: [
      { de: 'Taquicardia ventricular', chave: 'Dissociação AV, fusões, capturas, concordância precordial e QRS acima de 160 ms apontam TV.' },
      { de: 'FA pré-excitada', chave: 'Ritmo irregular com QRS de larguras variáveis e frequência acima de 200 bpm.' },
      { de: 'Ritmo de marca-passo', chave: 'Espículas precedendo cada QRS largo.' },
    ],
    fixacao: [
      'QRS largo + taquicardia = TV até prova em contrário. A estatística está do seu lado.',
      'Verapamil em TV pode matar. Procainamida ou amiodarona são as escolhas seguras.',
      'O ECG antigo do paciente vale mais que qualquer algoritmo morfológico.',
    ],
  },

  'junctional-tachy': {
    emUmaFrase:
      'A junção AV dispara acima de 100 bpm por automatismo anormal: taquicardia regular de QRS estreito, sem P precedente ou com P retrógrada, de início e término graduais.',
    secoes: [
      {
        titulo: 'Automatismo, não reentrada',
        texto:
          'A taquicardia juncional verdadeira, também chamada taquicardia juncional focal, decorre de automatismo exaltado ou de atividade deflagrada em células da junção AV. Isso a distingue radicalmente da AVNRT, que é reentrante: aqui não há circuito, e por isso a arritmia não começa nem termina de forma abrupta, não responde a manobras vagais com terminação e não é revertida por cardioversão elétrica. O padrão é de aquecimento gradual, frequência que oscila com o tônus autonômico e desaquecimento ao final. As causas clássicas são intoxicação digitálica, isquemia miocárdica (especialmente infarto inferior), miocardite, febre reumática, distúrbio eletrolítico, uso de catecolaminas e o pós-operatório de cirurgia cardíaca — na criança, a taquicardia juncional ectópica pós-operatória é uma complicação temida.',
      },
      {
        titulo: 'Traçado e dissociação',
        texto:
          'QRS estreito, ritmo regular, frequência entre 100 e 130 bpm no adulto (podendo ser bem mais alta em crianças). As ondas P podem estar ausentes, retrógradas ou completamente dissociadas — e aqui está o ponto fino: quando existe dissociação AV com frequência ventricular MAIOR que a atrial e QRS estreito, o diagnóstico é taquicardia juncional, não bloqueio. No bloqueio AV total, a relação é inversa: átrio rápido, ventrículo lento. Confundir os dois leva a condutas opostas, já que a taquicardia juncional pede tratamento da causa (com frequência a suspensão da digoxina) enquanto o bloqueio pede marca-passo.',
      },
      {
        titulo: 'Conduta',
        texto:
          'Corrigir a causa é o tratamento. Suspender digoxina e considerar anticorpo antidigoxina em toxicidade grave; corrigir potássio e magnésio; tratar isquemia; reduzir catecolaminas exógenas quando possível. Betabloqueadores e amiodarona podem ser usados para reduzir a frequência em casos refratários, e no pós-operatório pediátrico o resfriamento e a amiodarona têm papel estabelecido. Cardioversão elétrica não está indicada — além de ineficaz, é potencialmente perigosa no contexto de intoxicação digitálica, em que pode desencadear arritmias ventriculares.',
      },
    ],
    ondaAOnda: [
      { onda: 'Ritmo', achado: 'Regular, com início e término graduais (aquecimento e desaquecimento).' },
      { onda: 'Frequência', achado: 'Acima de 100 bpm, tipicamente 100–130 no adulto.' },
      { onda: 'Onda P', achado: 'Ausente, retrógrada (negativa em DII) ou dissociada, com frequência atrial MENOR que a ventricular.' },
      { onda: 'QRS', achado: 'Estreito, idêntico ao basal — confirma origem supra-hissiana.' },
      { onda: 'Resposta a manobras', achado: 'Vago e adenosina podem lentificar transitoriamente, mas não terminam a arritmia.' },
    ],
    roteiro: [
      'Taquicardia regular de QRS estreito com P ausente ou retrógrada.',
      'Verifique se o início foi gradual (contra reentrada).',
      'Se houver dissociação, compare frequências: ventricular maior que atrial = juncional.',
      'Pergunte sobre digoxina, isquemia e pós-operatório recente.',
      'Trate a causa; evite cardioversão elétrica.',
    ],
    separando: [
      { de: 'AVNRT', chave: 'A AVNRT é paroxística, começa e termina de repente e é revertida por adenosina.' },
      { de: 'Taquicardia sinusal', chave: 'Na sinusal existe P positiva em DII antes de cada QRS.' },
      { de: 'BAV total', chave: 'No bloqueio a frequência atrial é MAIOR que a ventricular; aqui é o contrário.' },
      { de: 'Ritmo juncional acelerado', chave: 'Mesmo mecanismo, apenas mais lento (60–100 bpm).' },
    ],
    fixacao: [
      'Dissociação AV com ventrículo mais rápido que o átrio e QRS estreito = taquicardia juncional.',
      'Não reverte com adenosina nem com choque: é automatismo, não circuito.',
      'Digoxina é a primeira suspeita a ser afastada.',
    ],
  },
}

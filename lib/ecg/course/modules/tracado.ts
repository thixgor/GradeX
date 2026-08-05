/**
 * Módulos 3, 4 e 5: as ondas (e seus nomes), o papel milimetrado e os
 * intervalos/segmentos com seus valores normais e significados.
 */
import type { CourseModule } from '../types'

export const MODULO_ONDAS: CourseModule = {
  id: 'ondas',
  title: 'As ondas',
  tagline: 'Construa o traçado do zero, onda por onda',
  color: 'violet',
  lessons: [
    /* ───────────────────────────── 3.1 ───────────────────────────── */
    {
      id: 'por-que-pqrst',
      title: 'Por que P, Q, R, S, T?',
      subtitle: 'A história (e a matemática) por trás das letras',
      minutes: 7,
      xp: 25,
      steps: [
        {
          kind: 'teach',
          title: 'Antes de Einthoven, era A-B-C-D',
          lead: 'Em 1887, Augustus Waller registrou o primeiro eletrocardiograma humano com um eletrômetro capilar de mercúrio e chamou as deflexões de A, B, C e D.',
          body: [
            'O aparelho de Waller era mecanicamente lento: a coluna de mercúrio tinha inércia e distorcia as curvas. As deflexões registradas eram uma versão deformada da atividade elétrica real.',
            'Willem Einthoven, em 1895, aplicou uma correção matemática às curvas distorcidas do eletrômetro. Ao publicar a curva CORRIGIDA, ele precisava distingui-la da curva original A-B-C-D — e não podia reusar as mesmas letras sem gerar confusão.',
            'Em 1901 ele criou o galvanômetro de corda, com fidelidade real, e as letras corrigidas ficaram. Einthoven ganhou o Nobel de Medicina em 1924.',
          ],
        },
        {
          kind: 'teach',
          title: 'Por que começar no P',
          lead: 'A escolha não foi aleatória — foi convenção matemática, importada da geometria analítica de Descartes.',
          body: [
            'Na tradição matemática da época, pontos sobre uma curva eram rotulados a partir de P (de "ponto"): P, Q, R, S, T… É a mesma convenção que faz o professor de geometria chamar os pontos de P e Q até hoje.',
            'Einthoven precisava de letras no MEIO do alfabeto, e não no começo, por um motivo prático: se aparecessem deflexões antes da primeira onda conhecida, ele teria letras livres à esquerda (O, N, M) para nomeá-las. Começar em A não deixaria espaço.',
            'A previsão se mostrou útil: quando a onda que segue a T foi descoberta, bastou seguir o alfabeto e chamá-la de U. E ainda há espaço à esquerda — a onda "Ta" (repolarização atrial) e a onda de His são nomeadas fora dessa sequência exatamente porque a sequência foi bem planejada.',
          ],
          widget: { id: 'letters-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'A frase para nunca mais esquecer',
              text: '"P de Ponto, no meio do alfabeto para sobrar letra dos dois lados." Einthoven usou a convenção cartesiana de nomear pontos de curva a partir do P, e deixou O, N, M livres à esquerda e U, V livres à direita.',
            },
            {
              kind: 'prova',
              text: 'Se a questão perguntar quem registrou o primeiro ECG humano: Waller (1887). Quem criou o galvanômetro de corda, as derivações D1/D2/D3 e ganhou o Nobel: Einthoven (1901/1924). Quem criou as unipolares aumentadas: Goldberger. Quem criou o terminal central e as precordiais: Wilson.',
            },
          ],
        },
        {
          kind: 'quiz',
          question: 'Por que Einthoven não manteve as letras A, B, C e D de Waller?',
          options: [
            { text: 'Porque as letras já eram usadas na física para outras grandezas' },
            { text: 'Porque suas curvas eram a versão corrigida matematicamente das de Waller e precisavam ser distinguidas', correct: true },
            { text: 'Porque descobriu quatro ondas a mais do que Waller' },
            { text: 'Porque as letras iniciais eram reservadas às derivações' },
          ],
          explain: 'Einthoven corrigiu a distorção mecânica do eletrômetro capilar. A curva corrigida era um objeto novo, e ele adotou letras a partir de P — convenção cartesiana para pontos de curva —, deixando de propósito letras livres antes e depois.',
        },
      ],
    },

    /* ───────────────────────────── 3.2 ───────────────────────────── */
    {
      id: 'construindo-o-eletro',
      title: 'Construindo o eletro, onda por onda',
      subtitle: 'O laboratório principal: cada peça aparece quando você entende de onde ela veio',
      minutes: 15,
      xp: 60,
      steps: [
        {
          kind: 'teach',
          title: 'A ideia: nada aparece antes da hora',
          lead: 'Você vai montar um batimento completo do zero. A cada passo, uma parte do traçado é desenhada — e ao lado, o coração mostra exatamente qual estrutura está despolarizando naquele instante.',
          body: [
            'Não avance rápido. Em cada etapa, olhe três coisas: (1) o que está acontecendo dentro do coração, (2) que forma isso produz no papel e (3) quanto tempo dura. Essas três colunas são a leitura de ECG inteira.',
          ],
        },
        {
          kind: 'lab',
          title: 'Monte o batimento',
          intro: 'Avance passo a passo. Você pode voltar, deixar rodando sozinho ou clicar direto na etapa que quiser revisar.',
          widget: { id: 'wave-builder' },
          outro: 'Repare no detalhe que quase todo mundo erra: o segmento PR é isoelétrico não porque "nada acontece", e sim porque o nó AV é pequeno demais para gerar voltagem detectável na superfície. Há atividade — só não há sinal.',
          callouts: [
            {
              kind: 'porque',
              title: 'Cadê a repolarização atrial?',
              text: 'Ela existe: chama-se onda Ta e é uma deflexão de sentido oposto à P. Só que ela é pequena (a massa atrial é pequena) e ocorre justamente durante o QRS, que a soterra. Você só a enxerga quando o QRS não vem — no bloqueio AV total e na taquicardia atrial — ou como falso infra de PR na pericardite.',
            },
          ],
        },
        {
          kind: 'order',
          question: 'Ordene os eventos elétricos de um batimento normal',
          items: [
            'Onda P — despolarização atrial (direito e depois esquerdo, via Bachmann)',
            'Segmento PR — atraso no nó AV, isoelétrico na superfície',
            'Onda Q — despolarização do septo, da esquerda para a direita',
            'Onda R — despolarização da massa ventricular, do endocárdio ao epicárdio',
            'Onda S — despolarização das porções basais e posterobasais',
            'Ponto J e segmento ST — platô, todo o ventrículo despolarizado',
            'Onda T — repolarização ventricular, do epicárdio ao endocárdio',
            'Onda U — repolarização tardia (Purkinje / células M)',
          ],
          explain: 'A onda Q septal vem ANTES da R porque o septo é a primeira porção ventricular a despolarizar, e o faz da esquerda para a direita — sentido oposto ao vetor principal. É por isso que existe uma q pequena e estreita em D1, aVL, V5 e V6 no ECG normal: a ausência dela é que é anormal (bloqueio de ramo esquerdo, bloqueio do fascículo septal).',
        },
        {
          kind: 'quiz',
          question: 'Por que a onda T é POSITIVA se a repolarização é o inverso da despolarização?',
          options: [
            { text: 'Porque a repolarização gera vetor de mesmo sentido que a despolarização' },
            { text: 'Porque a repolarização caminha do epicárdio para o endocárdio — sentido oposto ao da despolarização — e, sendo um processo de sinal invertido, o produto de duas inversões dá deflexão positiva', correct: true },
            { text: 'Porque a onda T é gerada pelos átrios, não pelos ventrículos' },
            { text: 'Porque o aparelho inverte automaticamente o sinal após o QRS' },
          ],
          explain: 'Duas inversões que se cancelam. Primeira: repolarização afastando-se do eletrodo daria deflexão positiva (o inverso da regra da despolarização). Segunda: o epicárdio repolariza ANTES do endocárdio, porque tem potencial de ação mais curto e está mais quente e menos pressionado — então a frente caminha de fora para dentro. Resultado: T concordante com o QRS. Quando esse gradiente se perde (isquemia subepicárdica), a T inverte.',
        },
      ],
    },

    /* ───────────────────────────── 3.3 ───────────────────────────── */
    {
      id: 'nomenclatura-qrs',
      title: 'Nomenclatura do QRS',
      subtitle: 'q ou Q? R ou r? Quando é QS e quando é R linha',
      minutes: 8,
      xp: 30,
      steps: [
        {
          kind: 'teach',
          title: 'As três regras da nomenclatura',
          lead: 'Nem todo QRS tem Q, R e S. O nome do complexo descreve exatamente quais deflexões ele tem — e o tamanho da letra diz o tamanho da onda.',
          bullets: [
            { t: 'Q', d: 'A PRIMEIRA deflexão negativa, e só se vier ANTES de qualquer deflexão positiva. Se houver uma onda positiva antes, a negativa seguinte não é Q — é S.' },
            { t: 'R', d: 'QUALQUER deflexão positiva. A primeira é R; se houver uma segunda positiva depois de uma negativa, ela é R′ (R linha); uma terceira é R″.' },
            { t: 'S', d: 'Qualquer deflexão negativa que venha DEPOIS de uma positiva.' },
            { t: 'Maiúscula × minúscula', d: 'Maiúscula para a onda dominante (grande, geralmente ≥ 5 mm); minúscula para a pequena. "qRs" = q pequena, R grande, s pequena. "rSR′" = r pequena, S grande, R′ pequena.' },
            { t: 'QS', d: 'Complexo inteiramente negativo, sem nenhuma deflexão positiva. Não é "Q seguida de S": é uma deflexão negativa única. Padrão QS em V1–V3 pode ser infarto anterosseptal antigo.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'A pergunta única',
              text: 'Para nomear qualquer complexo, pergunte só uma coisa em cada deflexão negativa: "veio alguma coisa positiva antes de mim?" NÃO → é Q. SIM → é S. Positivas são sempre R (com linhas para as repetidas).',
            },
            {
              kind: 'prova',
              title: 'rSR′ em V1',
              text: 'É a assinatura do bloqueio de ramo direito — "orelhas de coelho" ou "M" em V1. Se o QRS tem ≥ 120 ms, é BRD completo; entre 110 e 119 ms, incompleto. rSR′ com QRS < 110 ms em V1 é variante normal em muita gente jovem.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Onda Q: quando é normal e quando é infarto',
          lead: 'Todo mundo tem alguma onda Q. A questão é o tamanho e a companhia.',
          bullets: [
            { t: 'Q septal (normal)', d: 'Pequena e estreita: < 40 ms de duração e < 25% da altura da R que a segue. Aparece em D1, aVL, V5 e V6 (e às vezes D2/D3/aVF). É o septo despolarizando da esquerda para a direita.' },
            { t: 'Q patológica', d: '≥ 40 ms de duração OU ≥ 25% da amplitude do R, em duas derivações contíguas. Significa tecido eletricamente morto: a região necrosada não gera vetor, e o eletrodo enxerga o vetor da parede oposta se afastando.' },
            { t: 'Q em D3 e aVR', d: 'Q isolada em D3 pode ser posicional (some na inspiração profunda). Q em aVR é normal e esperada — aVR vê tudo se afastando.' },
            { t: 'Perda de Q septal', d: 'Ausência de q em V5/V6 sugere bloqueio de ramo esquerdo, bloqueio do fascículo septal ou fibrose septal.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Regra 40/25',
              text: 'Q patológica = 40 ms de largura OU 25% da altura do R. "Quarenta e vinte e cinco" — e sempre em pelo menos DUAS derivações contíguas, senão é achado isolado sem valor.',
            },
          ],
        },
        {
          kind: 'match',
          question: 'Nomeie cada complexo',
          pairs: [
            { left: 'Só uma deflexão, totalmente negativa', right: 'QS' },
            { left: 'Negativa pequena, positiva grande, negativa pequena', right: 'qRs' },
            { left: 'Positiva pequena, negativa grande, positiva pequena', right: 'rSr′' },
            { left: 'Positiva grande sem nenhuma negativa', right: 'R' },
            { left: 'Negativa grande seguida de positiva pequena', right: 'Qr' },
          ],
          explain: 'A letra depende da ORDEM (positiva antes = a próxima negativa é S) e o tamanho da letra depende da AMPLITUDE. Note "rSr′": a segunda positiva ganha a linha porque veio depois de uma negativa.',
        },
      ],
    },

    /* ───────────────────────────── 3.4 ───────────────────────────── */
    {
      id: 'ondas-especiais',
      title: 'Ondas com nome e sobrenome',
      subtitle: 'U, J de Osborn, delta, épsilon, f, F e Ta',
      minutes: 9,
      xp: 35,
      steps: [
        {
          kind: 'teach',
          title: 'As ondas extras que aparecem no traçado',
          lead: 'Além de P-QRS-T, o ECG tem um vocabulário de ondas que só surgem em situações específicas. Reconhecê-las já entrega o diagnóstico.',
          bullets: [
            { t: 'Onda U', d: 'Pequena deflexão após a T, melhor vista em V2–V3. Origem provável: repolarização tardia do Purkinje ou das células M do meio da parede. Normal se < 25% da altura da T. AUMENTA na hipocalemia, hipercalcemia, bradicardia, hipertrofia de VE e com quinidina/amiodarona. INVERTE na isquemia (achado sutil e específico de doença de tronco/DA) e na hipertensão.' },
            { t: 'Onda J (de Osborn)', d: 'Entalhe/corcova no ponto J, no fim do QRS. Clássica da HIPOTERMIA (aparece abaixo de 32 °C e cresce conforme a temperatura cai), mas também na hipercalcemia, na lesão de SNC e na síndrome de repolarização precoce.' },
            { t: 'Onda delta', d: 'Empastamento no início do QRS, com PR curto (< 120 ms) e QRS alargado. É a pré-excitação: o feixe de Kent despolariza parte do ventrículo antes do impulso que passou pelo nó AV. Padrão de Wolff-Parkinson-White.' },
            { t: 'Onda épsilon', d: 'Pequena deflexão logo após o QRS em V1–V2. Marcador da displasia arritmogênica do ventrículo direito (condução muito lenta na região fibrogordurosa). Critério maior da doença.' },
            { t: 'Ondas f (minúsculo)', d: 'Ondulações irregulares e caóticas da linha de base na FIBRILAÇÃO atrial, a 350–600 por minuto, sem P identificável.' },
            { t: 'Ondas F (maiúsculo)', d: 'Ondas em "dente de serra" do FLUTTER atrial, regulares, a ~300/min, melhor vistas em D2, D3, aVF e V1.' },
            { t: 'Onda Ta', d: 'Repolarização atrial. Deflexão oposta à P, escondida sob o QRS. Visível como infra de PR na pericardite e como falso infra de ST em taquicardia sinusal (pseudo-isquemia do teste ergométrico).' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'As ondas do frio e do potássio',
              text: 'Onda J de OSBORN = OSSO gelado → hipotermia. Onda U proeminente = "U de queda de potássio" (hipocalemia) — e onda T apiculada em tenda = "T de tesouro" da hipercalemia. Sobe potássio, sobe T; desce potássio, sobe U.',
            },
            {
              kind: 'prova',
              text: 'Delta + PR curto + QRS largo = WPW. Se somar taquicardia paroxística, é síndrome de WPW (padrão + sintoma). Em fibrilação atrial com WPW, JAMAIS use bloqueador de nó AV (adenosina, verapamil, diltiazem, betabloqueador, digoxina): bloquear a via nodal empurra tudo pela via acessória e degenera em fibrilação ventricular. Use procainamida ou cardioversão elétrica.',
            },
          ],
          widget: { id: 'wave-doctor', props: { focus: 'especiais' } },
        },
        {
          kind: 'quiz',
          stem: 'Homem resgatado de afogamento em água fria, temperatura central de 30 °C, tremendo. ECG: bradicardia a 42 bpm, PR e QT prolongados, artefato de tremor e um entalhe positivo no fim do QRS em várias derivações.',
          question: 'Qual é o achado eletrocardiográfico característico?',
          options: [
            { text: 'Onda delta' },
            { text: 'Onda épsilon' },
            { text: 'Onda J de Osborn', correct: true },
            { text: 'Onda U proeminente' },
          ],
          explain: 'Onda J de Osborn: entalhe no ponto J, típico de hipotermia abaixo de 32 °C, com amplitude proporcional à queda de temperatura. Vem acompanhada de bradicardia, prolongamento de todos os intervalos (PR, QRS, QT) e tremor muscular no traçado. Cuidado: coração hipotérmico é irritável — manipulação brusca pode deflagrar fibrilação ventricular.',
        },
      ],
    },
  ],
}

export const MODULO_PAPEL: CourseModule = {
  id: 'papel',
  title: 'O papel',
  tagline: 'Tempo, voltagem, calibração e artefatos',
  color: 'cyan',
  lessons: [
    {
      id: 'papel-milimetrado',
      title: 'Ler o papel milimetrado',
      subtitle: 'Quadradinho, quadradão e o que cada eixo significa',
      minutes: 8,
      xp: 30,
      steps: [
        {
          kind: 'teach',
          title: 'Dois eixos, duas grandezas',
          lead: 'Horizontal é TEMPO. Vertical é VOLTAGEM. Toda medida de ECG sai daí.',
          table: {
            head: ['Elemento', 'Horizontal (tempo)', 'Vertical (voltagem)'],
            rows: [
              ['Quadradinho (1 mm)', '0,04 s = 40 ms', '0,1 mV'],
              ['Quadradão (5 mm)', '0,20 s = 200 ms', '0,5 mV'],
              ['5 quadradões (25 mm)', '1 segundo', '2,5 mV'],
              ['Folha padrão (10 s)', '250 mm', '—'],
            ],
            numericFrom: 1,
          },
          body: [
            'Esses números pressupõem a calibração padrão: velocidade de 25 mm/s e ganho de 10 mm/mV. Se o traçado sair com outra configuração, TODAS as medidas mudam — e é por isso que a primeira coisa a olhar em um ECG é o pulso de calibração no canto.',
            'A 50 mm/s (usada para detalhar ondas), cada quadradinho passa a valer 20 ms e o traçado parece "esticado": PR e QRS aparentam o dobro. A 5 mm/mV (usado quando o QRS é gigante e sai do papel), as amplitudes aparentam metade — e você pode perder um critério de hipertrofia.',
          ],
          widget: { id: 'paper-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'A regra dos "4 zeros"',
              text: 'Quadradinho pequeno: 0,04 s e 0,1 mV. Quadradão: 0,20 s e 0,5 mV. Se você lembrar só de "0,04 e 0,1", multiplica por 5 e chega no quadradão.',
            },
            {
              kind: 'atencao',
              title: 'O pulso de calibração',
              text: 'O retângulo no início do traçado deve ter 10 mm de altura (= 1 mV) e 200 ms de largura. Metade da altura = ganho reduzido a 5 mm/mV. Se ele estiver arredondado em vez de retangular, o aparelho está com filtro errado ou eletrodo com má impedância — o ST não é confiável.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Artefatos: o que não é do paciente',
          lead: 'Antes de diagnosticar arritmia, exclua o traçado ruim. Muito "ECG grave" é eletrodo solto.',
          bullets: [
            { t: 'Tremor muscular', d: 'Oscilação fina e irregular, alta frequência. Simula fibrilação atrial ou flutter. Comum em Parkinson, frio e ansiedade. Peça para relaxar, aqueça o paciente.' },
            { t: 'Interferência de rede (50/60 Hz)', d: 'Ondulação perfeitamente regular e uniforme em todas as derivações. Vem da tomada. Afaste cabos de aparelhos, verifique aterramento.' },
            { t: 'Oscilação da linha de base', d: 'Ondulação lenta, em geral respiratória ou por eletrodo mal aderido. Distorce o segmento ST e cria falso supra/infra.' },
            { t: 'Troca de eletrodos braço direito/esquerdo', d: 'D1 inteiramente invertida, aVR positivo e aVL negativo, com precordiais NORMAIS. Se as precordiais também estiverem alteradas com progressão de R invertida, pense em dextrocardia de verdade.' },
            { t: 'Eletrodo precordial mal posicionado', d: 'V1 e V2 colocados alto demais (2º espaço) criam pseudo-padrão de Brugada, r′ e T invertida. Reposicione no 4º espaço intercostal antes de assustar o paciente.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Troca de eletrodos × dextrocardia',
              text: 'Ambos dão D1 invertida e aVR positivo. A diferença está nas PRECORDIAIS: troca de braços mantém progressão de R normal; dextrocardia tem R que MINGUA de V1 a V6. Colocou as precordiais do lado direito e ficou tudo normal? Dextrocardia.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Você mede um intervalo PR que ocupa 5 quadradinhos pequenos, no traçado padrão.',
          question: 'Quanto vale esse PR?',
          options: [
            { text: '100 ms' },
            { text: '200 ms', correct: true },
            { text: '250 ms' },
            { text: '500 ms' },
          ],
          explain: '5 × 40 ms = 200 ms — exatamente um quadradão, o limite superior do PR normal. Uma boa referência visual: PR normal cabe em um quadradão. Se ele passa de um quadradão, é bloqueio AV de 1º grau.',
        },
        {
          kind: 'fill',
          question: 'Complete',
          sentence: 'Na velocidade de 50 mm/s, cada quadradinho pequeno passa a valer ___ ms.',
          options: ['10', '20', '40', '80'],
          answer: '20',
          explain: 'Dobrar a velocidade do papel corta o tempo por milímetro pela metade: 40 ms → 20 ms. O traçado parece esticado e os intervalos parecem o dobro do que são. Sempre confira a velocidade impressa no rodapé antes de medir.',
        },
      ],
    },
  ],
}

export const MODULO_INTERVALOS: CourseModule = {
  id: 'intervalos',
  title: 'Intervalos e segmentos',
  tagline: 'Quanto dura o normal e o que significa aumentar ou encurtar',
  color: 'amber',
  lessons: [
    /* ───────────────────────────── 5.1 ───────────────────────────── */
    {
      id: 'intervalo-vs-segmento',
      title: 'Intervalo não é segmento',
      subtitle: 'A diferença que organiza toda a medição',
      minutes: 6,
      xp: 25,
      steps: [
        {
          kind: 'teach',
          title: 'A definição que resolve tudo',
          lead: 'SEGMENTO é a linha ENTRE duas ondas — não inclui nenhuma onda. INTERVALO inclui pelo menos uma onda mais uma linha.',
          bullets: [
            { t: 'Segmento PR', d: 'Do FIM da P ao INÍCIO do QRS. Só a linha. Reflete o atraso no nó AV. Costuma ser isoelétrico; infra de PR é achado de pericardite.' },
            { t: 'Intervalo PR', d: 'Do INÍCIO da P ao INÍCIO do QRS. Inclui a onda P + o segmento PR. É o que se mede na prática e na prova.' },
            { t: 'Segmento ST', d: 'Do ponto J ao início da onda T. Só a linha. É a fase 2, o platô.' },
            { t: 'Intervalo QT', d: 'Do INÍCIO do QRS ao FIM da T. Inclui QRS + ST + T. É a sístole elétrica ventricular inteira.' },
            { t: 'Intervalo RR', d: 'De um pico de R ao próximo. É o ciclo cardíaco — a base de todo cálculo de frequência.' },
            { t: 'Segmento TP', d: 'Do fim da T ao início da P seguinte. É a diástole elétrica, a única linha realmente isoelétrica do traçado. É a REFERÊNCIA para medir supra e infra de ST.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'Segmento é "seco", intervalo é "cheio"',
              text: 'Segmento = só reta, sem onda. Intervalo = tem onda dentro. Se o nome tem duas letras que são ondas (PR, QT), pergunte: a medida começa no INÍCIO da primeira onda (intervalo) ou no FIM dela (segmento)?',
            },
            {
              kind: 'atencao',
              title: 'A linha de base correta',
              text: 'Meça desnível de ST usando o segmento TP como zero — não o PR e nem "o olho". Em taquicardia, o TP some e aí usa-se o PR, sabendo que a onda Ta pode empurrá-lo para baixo e criar falso infra.',
            },
          ],
        },
        {
          kind: 'match',
          question: 'Segmento ou intervalo?',
          pairs: [
            { left: 'Do início da P ao início do QRS', right: 'Intervalo PR' },
            { left: 'Do fim da P ao início do QRS', right: 'Segmento PR' },
            { left: 'Do ponto J ao início da T', right: 'Segmento ST' },
            { left: 'Do início do QRS ao fim da T', right: 'Intervalo QT' },
            { left: 'Do fim da T ao início da P', right: 'Segmento TP' },
          ],
          explain: 'Repare que PR aparece nas duas formas — e é a única medida em que a distinção realmente confunde. Quando alguém fala "PR" sem qualificar, está falando do INTERVALO PR (do início da P ao início do QRS).',
        },
      ],
    },

    /* ───────────────────────────── 5.2 ───────────────────────────── */
    {
      id: 'medidas-normais',
      title: 'Valores normais e o que os altera',
      subtitle: 'PR, QRS, QT, QTc — aumentado, diminuído e por quê',
      minutes: 14,
      xp: 50,
      steps: [
        {
          kind: 'teach',
          title: 'A tabela que você precisa saber de cor',
          table: {
            head: ['Medida', 'Normal', 'Aumentado significa', 'Diminuído significa'],
            rows: [
              [
                'Onda P',
                '< 120 ms e < 2,5 mm',
                'Larga/entalhada: sobrecarga atrial esquerda, bloqueio interatrial (Bayés). Alta/apiculada: sobrecarga atrial direita',
                'Ausente: fibrilação atrial, ritmo juncional, parada sinusal, hipercalemia grave (paralisia atrial)',
              ],
              [
                'Intervalo PR',
                '120–200 ms',
                '> 200 ms: bloqueio AV de 1º grau (vagal, isquemia inferior, drogas AV-bloqueadoras, Lyme, febre reumática)',
                '< 120 ms: pré-excitação (WPW, com delta) ou ritmo juncional/atrial baixo (sem delta, P invertida)',
              ],
              [
                'Complexo QRS',
                '< 120 ms (60–100 ms)',
                '≥ 120 ms: bloqueio de ramo, ritmo ventricular, marca-passo, hipercalemia, drogas classe I, WPW',
                'Nunca é "curto demais"; QRS de baixa AMPLITUDE (< 5 mm nos membros) sugere derrame, obesidade, DPOC, mixedema, amiloidose',
              ],
              [
                'Intervalo QT',
                'Depende da FC — use o QTc',
                '—',
                '—',
              ],
              [
                'QTc (Bazett)',
                '≤ 450 ms (homem) / ≤ 460 ms (mulher)',
                '> 500 ms = risco alto de torsades. Causas: hipocalemia, hipomagnesemia, hipocalcemia, antiarrítmicos III, antipsicóticos, macrolídeos, síndrome do QT longo congênito, hipotermia, isquemia',
                '< 340–360 ms: hipercalcemia, digital, hipertermia, síndrome do QT curto congênito (risco de FV)',
              ],
              [
                'Segmento ST',
                'Isoelétrico (± 1 mm)',
                'Supra ≥ 1 mm em 2 derivações contíguas (≥ 2 mm em V2–V3 em homens): oclusão coronariana, pericardite, repolarização precoce, aneurisma',
                'Infra ≥ 0,5 mm: isquemia subendocárdica, sobrecarga ventricular, digital ("colher"), hipocalemia',
              ],
              [
                'Onda T',
                'Concordante com o QRS; até 5 mm nos membros e 10 mm nas precordiais',
                'Apiculada e simétrica: hipercalemia ou isquemia hiperaguda. Gigante e invertida: isquemia, lesão de SNC',
                'Achatada: hipocalemia, hipotireoidismo, pericardite em resolução',
              ],
              [
                'Intervalo RR',
                'Regular, variação < 10%',
                'Longo: bradicardia, pausas, bloqueios',
                'Curto: taquicardia; irregularmente irregular = fibrilação atrial',
              ],
            ],
          },
          widget: { id: 'interval-lab' },
        },
        {
          kind: 'teach',
          title: 'QT e QTc — a medida mais mal feita do ECG',
          lead: 'O QT encurta quando a frequência sobe e alonga quando ela cai. Comparar QTs de frequências diferentes sem corrigir é comparar coisas distintas.',
          bullets: [
            { t: 'Bazett', d: 'QTc = QT / √(RR em segundos). É a mais usada e a que cai em prova. Superestima o QTc em taquicardia e subestima em bradicardia — cuidado acima de 100 bpm.' },
            { t: 'Fridericia', d: 'QTc = QT / ∛(RR). Mais confiável em frequências extremas; preferida em estudos de segurança de drogas.' },
            { t: 'Framingham', d: 'QTc = QT + 154 × (1 − RR). Linear, boa performance clínica.' },
            { t: 'Hodges', d: 'QTc = QT + 1,75 × (FC − 60). Fácil de fazer de cabeça.' },
            { t: 'Onde medir', d: 'Em D2 ou V5 (as maiores ondas T), na derivação com o QT mais longo. Use o método da tangente: trace a tangente à porção mais íngreme do ramo descendente da T; onde ela cruza a linha de base é o fim da T. Onda U NÃO entra na medida (a menos que esteja fundida à T).' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'O olhômetro do QT',
              text: 'Em frequências normais (60–100), o QT deve ser MENOR QUE METADE do intervalo RR. Se o QT passa da metade do RR, é longo até prova em contrário. É o teste de 1 segundo que salva na emergência.',
            },
            {
              kind: 'clinica',
              title: 'QTc > 500 ms',
              text: 'É o número que muda conduta: risco significativo de torsades de pointes. Revise TODAS as drogas, reponha potássio (alvo > 4,0) e magnésio (alvo > 2,0), corrija bradicardia. Na torsades instalada: sulfato de magnésio IV, mesmo com magnésio normal.',
            },
            {
              kind: 'atencao',
              text: 'Em bloqueio de ramo, o QRS largo infla o QT sem que a repolarização esteja realmente prolongada. Uma correção usada é o QT modificado: QTc − (QRS − 100 ms), ou avaliar o intervalo JT em vez do QT.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Mulher de 34 anos em uso de fluoxetina e ondansetrona, com vômitos há 3 dias. FC 60 bpm, QT medido de 520 ms. K⁺ 2,9 mEq/L.',
          question: 'Qual é o QTc por Bazett e qual a conduta imediata mais importante?',
          options: [
            { text: 'QTc 520 ms — repor potássio e magnésio e revisar as drogas', correct: true },
            { text: 'QTc 260 ms — normal, apenas observar' },
            { text: 'QTc 1040 ms — indicar marca-passo definitivo' },
            { text: 'QTc 450 ms — liberar com retorno ambulatorial' },
          ],
          explain: 'A 60 bpm, o RR é exatamente 1 s, e √1 = 1: o QTc é IGUAL ao QT medido, 520 ms. Acima de 500 ms há risco alto de torsades. Aqui há três fatores somados — dois fármacos que prolongam o QT e hipocalemia por vômitos. Reponha K⁺ (alvo > 4,0) e Mg²⁺ (alvo > 2,0) e suspenda o que der.',
        },
        {
          kind: 'fill',
          question: 'Complete a regra prática',
          sentence: 'Em frequência normal, um QT que ultrapassa ___ do intervalo RR deve ser considerado prolongado.',
          options: ['um quarto', 'metade', 'dois terços', 'o dobro'],
          answer: 'metade',
          explain: 'A regra da metade do RR funciona entre 60 e 100 bpm e serve de triagem visual em segundos. Confirmada a suspeita, meça direito e corrija pela fórmula — porque é o QTc, e não o QT bruto, que orienta a conduta.',
        },
      ],
    },
  ],
}

/**
 * Módulos 6 e 7: as 12 derivações (o que cada uma enxerga), o eixo elétrico e
 * os métodos de cálculo da frequência cardíaca.
 */
import type { CourseModule } from '../types'

export const MODULO_DERIVACOES: CourseModule = {
  id: 'derivacoes',
  title: 'As derivações',
  tagline: 'Doze câmeras apontadas para o mesmo coração',
  color: 'rose',
  lessons: [
    /* ───────────────────────────── 6.1 ───────────────────────────── */
    {
      id: 'plano-frontal',
      title: 'Plano frontal: Einthoven e Goldberger',
      subtitle: 'D1, D2, D3, aVR, aVL, aVF — quem olha para onde',
      minutes: 11,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'O triângulo de Einthoven',
          lead: 'Três eletrodos (braço direito, braço esquerdo e perna esquerda) formam um triângulo equilátero com o coração no centro. Cada lado é uma derivação bipolar.',
          bullets: [
            { t: 'D1', d: 'Braço direito (−) → braço esquerdo (+). Vetor a 0°. Olha a parede LATERAL ALTA do ventrículo esquerdo.' },
            { t: 'D2', d: 'Braço direito (−) → perna esquerda (+). Vetor a +60°. Olha a parede INFERIOR. É a derivação mais paralela ao eixo normal do coração — por isso é a melhor para ver ondas P e a escolhida para o monitor.' },
            { t: 'D3', d: 'Braço esquerdo (−) → perna esquerda (+). Vetor a +120°. Olha a parede INFERIOR.' },
          ],
          body: [
            'A lei de Einthoven diz que D2 = D1 + D3, em qualquer instante. É verdade porque as três derivações formam um circuito fechado (lei de Kirchhoff das tensões). Serve como conferência de qualidade: se em um traçado D2 ≠ D1 + D3, há eletrodo trocado ou mal conectado.',
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'D2 = D1 + D3',
              text: 'Some as alturas de R em D1 e D3: tem que dar a de D2. Se não der, confira os eletrodos antes de laudar qualquer coisa.',
            },
            {
              kind: 'macete',
              title: 'A ordem dos ângulos',
              text: 'D1 = 0°, D2 = +60°, D3 = +120°. De 60 em 60, no sentido horário do relógio deitado. E os aVs preenchem os vãos: aVL = −30°, aVR = −150°, aVF = +90°.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'As unipolares aumentadas de Goldberger',
          lead: 'aVR, aVL e aVF medem a voltagem de UM membro contra a média dos outros dois. O "a" é de aumentada.',
          bullets: [
            { t: 'aVR', d: 'Braço direito, a −150°. Olha o coração de cima e da direita — praticamente da cavidade ventricular. Tudo se afasta dela, então P, QRS e T são NEGATIVOS no ECG normal. Supra de ST em aVR ≥ 1 mm com infra difuso sugere lesão de tronco de coronária esquerda ou triarterial.' },
            { t: 'aVL', d: 'Braço esquerdo, a −30°. Parede LATERAL ALTA, junto com D1.' },
            { t: 'aVF', d: 'Perna esquerda, a +90°. Parede INFERIOR, junto com D2 e D3.' },
          ],
          widget: { id: 'leads-explorer', props: { plane: 'frontal' } },
          callouts: [
            {
              kind: 'atencao',
              title: 'aVR positivo em ritmo sinusal',
              text: 'Não existe em coração normal. Três causas: eletrodos de braço trocados, dextrocardia ou ritmo não sinusal (ectópico baixo/juncional retrógrado). Antes de laudar, confira os cabos.',
            },
          ],
        },
        {
          kind: 'match',
          question: 'Relacione a derivação à parede que ela enxerga',
          pairs: [
            { left: 'D2, D3, aVF', right: 'Parede inferior' },
            { left: 'D1, aVL', right: 'Parede lateral alta' },
            { left: 'V1, V2', right: 'Septo interventricular' },
            { left: 'V3, V4', right: 'Parede anterior' },
            { left: 'V5, V6', right: 'Parede lateral baixa (apical)' },
            { left: 'aVR', right: 'Cavidade ventricular / via de saída' },
          ],
          explain: 'Guarde os grupos como blocos, não como derivações soltas — o critério de infarto exige duas derivações CONTÍGUAS, e contíguo significa "do mesmo bloco" (ou vizinhas na sequência V1→V6, ou vizinhas no círculo hexaxial).',
        },
      ],
    },

    /* ───────────────────────────── 6.2 ───────────────────────────── */
    {
      id: 'precordiais',
      title: 'Precordiais: o plano horizontal',
      subtitle: 'V1 a V6, posicionamento, transição e as derivações extras',
      minutes: 11,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'Onde colar cada eletrodo (e por que isso importa)',
          lead: 'Um centímetro fora do lugar muda a morfologia e cria diagnósticos que não existem.',
          bullets: [
            { t: 'V1', d: '4º espaço intercostal, borda esternal DIREITA.' },
            { t: 'V2', d: '4º espaço intercostal, borda esternal ESQUERDA.' },
            { t: 'V4', d: '5º espaço intercostal, linha hemiclavicular esquerda. Coloque V4 ANTES de V3.' },
            { t: 'V3', d: 'No meio do caminho entre V2 e V4 — por isso V4 vem primeiro.' },
            { t: 'V5', d: 'Mesma altura horizontal de V4, na linha axilar ANTERIOR.' },
            { t: 'V6', d: 'Mesma altura horizontal de V4, na linha axilar MÉDIA.' },
          ],
          body: [
            'V5 e V6 seguem a linha horizontal de V4, e não o espaço intercostal — porque as costelas descem lateralmente. Esse é o erro de posicionamento mais frequente na prática.',
            'Nas mulheres, os eletrodos vão ABAIXO da mama, não sobre ela: o tecido mamário atenua a voltagem e pode simular baixa amplitude ou perda de progressão de R.',
          ],
          widget: { id: 'leads-explorer', props: { plane: 'horizontal' } },
          callouts: [
            {
              kind: 'macete',
              title: 'A ordem de colocação',
              text: 'V1, V2, V4, V3, V5, V6 — o "salto do V3". Marque V1/V2 no 4º espaço, desça para V4 no 5º hemiclavicular, encaixe V3 no meio e siga a horizontal de V4 para V5 (axilar anterior) e V6 (axilar média).',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'Progressão de R e zona de transição',
          lead: 'De V1 a V6, a onda R deve crescer e a onda S deve encolher. É o vetor ventricular se aproximando do eletrodo à medida que caminhamos para a esquerda.',
          bullets: [
            { t: 'Zona de transição', d: 'Onde R e S ficam do mesmo tamanho (R/S = 1). Normalmente em V3 ou V4.' },
            { t: 'Transição precoce (V1–V2)', d: 'Rotação anti-horária. Pense em infarto posterior, hipertrofia de VD, WPW tipo A ou variante normal em jovem magro.' },
            { t: 'Transição tardia (V5–V6)', d: 'Rotação horária. Pense em DPOC, hipertrofia de VE, infarto anterior antigo, bloqueio de ramo esquerdo.' },
            { t: 'Má progressão de R', d: 'R ≤ 3 mm em V3. Causas: infarto anterior, hipertrofia de VE, DPOC, cardiomiopatia, posicionamento errado dos eletrodos.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'A escadinha',
              text: 'A R sobe de V1 a V5 e cai um pouco em V6; a S faz o contrário. Se em V1 já tem R grande, pergunte: infarto posterior (imagem em espelho), hipertrofia de VD, BRD ou WPW tipo A? São essas quatro.',
            },
          ],
        },
        {
          kind: 'teach',
          title: 'As derivações que ninguém pede — e deveria',
          bullets: [
            { t: 'V3R e V4R (direitas)', d: 'Espelham V3/V4 no hemitórax direito. Obrigatórias em TODO infarto inferior: supra em V4R ≥ 1 mm diagnostica infarto de ventrículo direito. Muda a conduta — esse paciente é pré-carga dependente, precisa de volume e NÃO pode receber nitrato nem morfina em excesso.' },
            { t: 'V7, V8, V9 (posteriores)', d: 'Na linha axilar posterior, ponta da escápula e paravertebral esquerda, na altura de V6. Supra ≥ 0,5 mm confirma infarto posterior — que em V1–V3 aparece só como imagem em espelho (infra de ST, R alta, T positiva).' },
            { t: 'Derivação de Lewis (S5)', d: 'Braço direito no manúbrio, braço esquerdo no 5º espaço paraesternal direito, lendo D1. Amplifica a onda P — resgata ondas de flutter escondidas e ajuda a achar dissociação AV na taquicardia de QRS largo.' },
          ],
          callouts: [
            {
              kind: 'clinica',
              title: 'A regra do infarto inferior',
              text: 'Supra em D2, D3 e aVF? Peça V3R/V4R e V7–V9 ANTES de medicar. Infarto de VD contraindica nitrato: a queda de pré-carga leva o paciente a colapso hemodinâmico. E supra em D3 > D2 com infra em D1/aVL aponta a coronária direita como culpada.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'Homem, 58 anos, dor precordial. ECG: infra de ST de 2 mm em V1, V2 e V3, com ondas R altas em V1–V2 e ondas T positivas nessas derivações. Sem supra em nenhuma derivação padrão.',
          question: 'Qual a hipótese e qual o próximo passo?',
          options: [
            { text: 'Isquemia subendocárdica anterior — tratar como síndrome coronariana sem supra' },
            { text: 'Infarto POSTERIOR com imagem em espelho — registrar V7, V8 e V9', correct: true },
            { text: 'Hipertrofia de ventrículo direito — solicitar ecocardiograma eletivo' },
            { text: 'Repolarização precoce — liberar do pronto-socorro' },
          ],
          explain: 'A tríade infra em V1–V3 + R alta + T positiva é a imagem em espelho do supra posterior: como não há eletrodo nas costas no ECG padrão, o supra vira infra e a Q vira R. Registre V7–V9: supra ≥ 0,5 mm fecha infarto com supra e indica reperfusão IMEDIATA. É um dos infartos mais perdidos da emergência.',
        },
      ],
    },

    /* ───────────────────────────── 6.3 ───────────────────────────── */
    {
      id: 'eixo-eletrico',
      title: 'O eixo elétrico',
      subtitle: 'Sistema hexaxial e três formas de calcular em segundos',
      minutes: 10,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'O que é o eixo',
          lead: 'É a direção média do vetor de despolarização ventricular no plano frontal — para onde a maior parte da corrente aponta durante o QRS.',
          body: [
            'Ele depende da posição anatômica do coração, da massa de cada ventrículo e da integridade dos fascículos. Como o ventrículo esquerdo tem muito mais massa, o vetor normal aponta para baixo e para a esquerda: entre −30° e +90°.',
            'Deslocando as seis derivações dos membros para o centro do coração, obtém-se o sistema hexaxial: um círculo com marcas de 30 em 30 graus. aVL −30°, D1 0°, D2 +60°, aVF +90°, D3 +120°, aVR −150° (ou +210°).',
          ],
          table: {
            head: ['Faixa', 'Classificação', 'Principais causas'],
            rows: [
              ['−30° a +90°', 'Normal', '—'],
              ['−30° a −90°', 'Desvio para a esquerda', 'BDAS, hipertrofia de VE, infarto inferior, obesidade, gestação, marca-passo'],
              ['+90° a +180°', 'Desvio para a direita', 'BDPI, hipertrofia de VD, DPOC, embolia pulmonar, infarto lateral, dextrocardia, criança normal'],
              ['−90° a ±180°', 'Desvio extremo ("noroeste")', 'Taquicardia ventricular, hipercalemia, marca-passo, eletrodos trocados'],
            ],
          },
          widget: { id: 'axis-lab' },
        },
        {
          kind: 'teach',
          title: 'Três métodos, do mais rápido ao mais exato',
          bullets: [
            { t: '1. Método dos quadrantes (D1 e aVF)', d: 'Olhe só se o QRS é predominantemente positivo (+) ou negativo (−). D1+ e aVF+ = eixo NORMAL. D1+ e aVF− = desvio à ESQUERDA (confirmar com D2). D1− e aVF+ = desvio à DIREITA. D1− e aVF− = desvio EXTREMO.' },
            { t: '2. Método da isodifásica', d: 'Ache a derivação mais isodifásica (positiva e negativa iguais). O eixo é PERPENDICULAR a ela — e aponta para o lado da derivação que estiver mais positiva.' },
            { t: '3. Método da derivação mais positiva', d: 'O eixo aponta aproximadamente na direção da derivação com o maior QRS positivo. Rápido e suficiente para a maioria dos casos.' },
          ],
          callouts: [
            {
              kind: 'macete',
              title: 'O "polegar" de D1 e aVF',
              text: 'Faça dois polegares. D1 para cima e aVF para cima = os polegares se encontram no meio = NORMAL. Só D1 para cima = eixo à ESQUERDA ("apontam para a esquerda"). Só aVF para cima = eixo à DIREITA. Nenhum para cima = terra de ninguém, eixo extremo.',
            },
            {
              kind: 'macete',
              title: 'Esquerda de verdade × esquerda fisiológica',
              text: 'D1+ com aVF− pode ser eixo entre 0° e −30° (ainda normal). Confirme em D2: se D2 também for NEGATIVO, o eixo passou de −30° e o desvio é real — pense em BDAS.',
            },
            {
              kind: 'prova',
              title: 'S1Q3T3',
              text: 'S em D1, Q em D3 e T invertida em D3 é o padrão clássico de sobrecarga aguda de VD na embolia pulmonar — mas aparece em só ~20% dos casos. Mais comum na TEP é taquicardia sinusal, e o achado mais específico é T invertida em V1–V4 com desvio do eixo à direita.',
            },
          ],
        },
        {
          kind: 'quiz',
          stem: 'ECG com QRS positivo em D1, negativo em aVF e negativo em D2. QRS de 90 ms.',
          question: 'Como está o eixo e qual a causa mais provável?',
          options: [
            { text: 'Normal — variação posicional' },
            { text: 'Desvio à esquerda além de −30°, sugerindo bloqueio divisional anterossuperior', correct: true },
            { text: 'Desvio à direita, sugerindo hipertrofia de ventrículo direito' },
            { text: 'Desvio extremo, sugerindo taquicardia ventricular' },
          ],
          explain: 'D1+ / aVF− já joga o eixo para a esquerda; D2 negativo confirma que passou de −30°. Com QRS estreito (90 ms), a causa mais comum é BDAS — que exige, além do eixo entre −45° e −90°, padrão qR em D1/aVL e rS em D2, D3 e aVF, com QRS < 120 ms.',
        },
      ],
    },
  ],
}

export const MODULO_FREQUENCIA: CourseModule = {
  id: 'frequencia',
  title: 'Frequência cardíaca',
  tagline: 'Quatro métodos e quando usar cada um',
  color: 'lime',
  lessons: [
    {
      id: 'medir-fc',
      title: 'Como medir a frequência cardíaca',
      subtitle: 'Regra dos 300, regra dos 1500, regra dos 6 segundos',
      minutes: 10,
      xp: 40,
      steps: [
        {
          kind: 'teach',
          title: 'Quatro métodos',
          bullets: [
            { t: 'Regra dos 300 (sequência 300-150-100-75-60-50)', d: 'Ache uma R sobre uma linha grossa e conte os QUADRADÕES até a próxima R, recitando a sequência. Rápido, só serve para ritmo REGULAR. A sequência é 300 ÷ 1, 2, 3, 4, 5, 6.' },
            { t: 'Regra dos 1500', d: 'FC = 1500 ÷ número de QUADRADINHOS entre duas R. É o método mais preciso para ritmo regular. Sai de 1500 quadradinhos por minuto (25 mm/s × 60 s ÷ 1 mm).' },
            { t: 'Regra dos 6 segundos', d: 'Conte os QRS em 6 segundos (30 quadradões, ou 15 cm) e multiplique por 10. É o método OBRIGATÓRIO para ritmo irregular — fibrilação atrial, extrassístoles frequentes.' },
            { t: 'Regra dos 10 segundos', d: 'Conte todos os QRS da folha inteira (que tem 10 s) e multiplique por 6. Mais estável ainda para ritmos muito irregulares.' },
          ],
          widget: { id: 'hr-lab' },
          callouts: [
            {
              kind: 'macete',
              title: 'De onde vem cada número',
              text: '1500 quadradinhos por minuto (25 mm/s × 60 s). 300 quadradões por minuto (5 mm/s × 60 s). Todos os métodos são a mesma conta: minuto dividido pelo ciclo.',
            },
            {
              kind: 'macete',
              title: 'A escadinha de cor',
              text: '300 — 150 — 100 — 75 — 60 — 50. Repare: as três primeiras caem pela metade e as três últimas caem devagar. Se a R cai entre dois marcos, interpole: entre 75 e 60 é ~68.',
            },
            {
              kind: 'atencao',
              title: 'Atrial e ventricular podem ser diferentes',
              text: 'Em BAVT, flutter e bloqueios de 2º grau, meça as DUAS frequências: a atrial (intervalo P-P) e a ventricular (intervalo R-R). Reportar só uma esconde o diagnóstico.',
            },
          ],
        },
        {
          kind: 'lab',
          title: 'Treine no traçado',
          intro: 'O laboratório sorteia um ritmo e você calcula. Use o método que quiser — e compare a resposta com a medida real do sinal.',
          widget: { id: 'hr-lab', props: { mode: 'practice' } },
          outro: 'Erros de até 5 bpm são normais e clinicamente irrelevantes. O que importa é acertar a FAIXA: bradicardia (< 60), normal, taquicardia (> 100).',
        },
        {
          kind: 'quiz',
          stem: 'Ritmo regular, com 4 quadradões exatos entre duas ondas R consecutivas.',
          question: 'Qual é a frequência cardíaca?',
          options: [
            { text: '100 bpm' },
            { text: '75 bpm', correct: true },
            { text: '60 bpm' },
            { text: '50 bpm' },
          ],
          explain: '300 ÷ 4 = 75 bpm — o quarto degrau da sequência 300-150-100-75-60-50. Conferindo pela regra dos 1500: 4 quadradões = 20 quadradinhos; 1500 ÷ 20 = 75. Os dois métodos sempre batem em ritmo regular.',
        },
        {
          kind: 'fill',
          question: 'Complete',
          sentence: 'Em fibrilação atrial, o método de escolha para calcular a frequência é a regra dos ___.',
          options: ['300', '1500', '6 segundos', 'quadradões'],
          answer: '6 segundos',
          explain: 'Em ritmo irregular, cada intervalo RR é diferente: medir um par isolado dá um número que não representa nada. Contar QRS em 6 s (ou na folha de 10 s) faz a média de vários ciclos, que é o que importa clinicamente.',
        },
      ],
    },
  ],
}

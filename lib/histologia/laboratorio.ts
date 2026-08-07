import type { Referencia } from './esquemas'

/**
 * Laboratório virtual — conteúdo autoral.
 *
 * ## Sobre a origem deste conteúdo
 *
 * Diferente das lâminas (que vêm do acervo do Digital Histology), o texto deste
 * módulo foi **escrito para o Manual da Histologia**. Ele descreve o
 * processamento histológico de rotina, que é conhecimento estabelecido e
 * consensual entre os manuais da área — mas isso não dispensa fonte, e cada
 * módulo declara as suas em `referencias`.
 *
 * O estado editorial continua `pendente-de-revisao` até um revisor biomédico
 * assinar. Escrever com fonte não é o mesmo que ter sido revisado, e a
 * interface não confunde os dois.
 *
 * ## O que a simulação pode e não pode fazer
 *
 * Estes módulos ensinam **modelos e consequências**: por que a autólise começa
 * antes da fixação, por que o chatter aparece em corte de bloco frio demais, o
 * que a hematoxilina de fato liga. Eles não simulam óptica nem reação química —
 * um desfoque arbitrário não é aberração e uma cor inventada não é
 * histoquímica. Onde a simulação para, o texto diz que parou.
 */

export interface EtapaDoProcesso {
  id: string
  titulo: string
  /** O que acontece com o tecido, fisicamente. */
  oQueAcontece: string
  /** Por que a etapa existe — o problema que ela resolve. */
  porQue: string
  /** O que se vê na lâmina quando esta etapa falha. */
  seFalhar: string
  duracaoTipica: string
}

export interface Artefato {
  id: string
  nome: string
  /** Como o artefato se apresenta na lâmina. */
  aparencia: string
  /** Etapa responsável — é a resposta do exercício. */
  etapaCulpada: string
  causa: string
  correcao: string
  /** Com o que costuma ser confundido — a armadilha real. */
  confundeCom: string
}

export interface ModuloDeLaboratorio {
  id: string
  titulo: string
  resumo: string
  objetivos: string[]
  minutos: number
  referencias: Referencia[]
}

/* ─────────────────── Da coleta à lâmina ─────────────────── */

export const ETAPAS_DO_PROCESSAMENTO: EtapaDoProcesso[] = [
  {
    id: 'coleta',
    titulo: 'Coleta e tempo de isquemia',
    oQueAcontece:
      'A peça é retirada e, a partir desse instante, deixa de receber oxigênio. As enzimas lisossômicas continuam ativas dentro das próprias células.',
    porQue:
      'O relógio da autólise começa aqui, não no laboratório. O intervalo entre a retirada e a imersão no fixador é a variável que mais afeta a qualidade final e a única que não dá para corrigir depois.',
    seFalhar:
      'Autólise: núcleos pálidos e mal delimitados, citoplasma granular, descolamento do epitélio da membrana basal. O tecido parece "derretido" nas bordas.',
    duracaoTipica: 'o menor possível — minutos',
  },
  {
    id: 'fixacao',
    titulo: 'Fixação',
    oQueAcontece:
      'O fixador penetra no tecido e estabiliza as proteínas. O formaldeído forma pontes de metileno entre grupos amino de proteínas vizinhas; o glutaraldeído, com dois grupos aldeído, faz ligações cruzadas mais extensas.',
    porQue:
      'Interrompe a autólise, impede a proliferação bacteriana e dá rigidez para o tecido suportar as etapas seguintes. Sem fixação não há histologia — só decomposição.',
    seFalhar:
      'Fixação insuficiente deixa o centro da peça autolisado enquanto a periferia está preservada — o padrão clássico de peça grossa demais para o tempo dado. Fixação excessiva endurece o tecido e reduz a marcação em imuno-histoquímica.',
    duracaoTipica: '6 a 24 h em formalina tamponada a 10%',
  },
  {
    id: 'desidratacao',
    titulo: 'Desidratação',
    oQueAcontece:
      'A água do tecido é substituída por álcool, em banhos de concentração crescente (70%, 80%, 95%, 100%).',
    porQue:
      'A parafina não se mistura com água. A troca é gradual porque passar direto do tecido hidratado para o álcool absoluto provocaria retração brusca — as correntes osmóticas colapsariam a arquitetura que se quer preservar.',
    seFalhar:
      'Desidratação incompleta impede a próxima etapa: o tecido fica mole, o bloco não corta e a fita se esfarela. Desidratação prolongada em álcool absoluto endurece e torna o tecido quebradiço.',
    duracaoTipica: '1 a 2 h por banho',
  },
  {
    id: 'diafanizacao',
    titulo: 'Diafanização (clareamento)',
    oQueAcontece:
      'O álcool é substituído por um solvente miscível tanto com álcool quanto com parafina — classicamente o xilol. O tecido fica translúcido, e é daí que vem o nome.',
    porQue:
      'É a ponte química entre o meio alcoólico e a parafina. Sem esse intermediário não há como levar o tecido de um ao outro.',
    seFalhar:
      'Clareamento insuficiente deixa álcool residual, que bloqueia a infiltração da parafina: aparecem áreas moles e opacas no bloco, que se soltam ao corte.',
    duracaoTipica: '1 a 2 h',
  },
  {
    id: 'inclusao',
    titulo: 'Impregnação e inclusão',
    oQueAcontece:
      'O tecido vai para parafina líquida (56–60 °C), que preenche todos os espaços antes ocupados por água. Depois é orientado num molde e a parafina solidifica, formando o bloco.',
    porQue:
      'Dá ao tecido a consistência uniforme necessária para cortes de poucos micrômetros. E a orientação escolhida aqui define, para sempre, o plano de corte daquela peça.',
    seFalhar:
      'Impregnação incompleta gera buracos no corte. Orientação errada é o erro mais irreversível de todos: um intestino incluído fora do eixo nunca mostrará as camadas em sequência, por melhor que seja o resto.',
    duracaoTipica: '2 a 4 h de impregnação',
  },
  {
    id: 'microtomia',
    titulo: 'Microtomia',
    oQueAcontece:
      'O bloco é aparado e cortado no micrótomo em fitas de 3 a 5 µm para rotina — a espessura em que a maior parte das células é seccionada uma única vez.',
    porQue:
      'A luz precisa atravessar o corte. Acima de ~10 µm as células se sobrepõem e a imagem embaralha; abaixo de ~2 µm sobra pouco material para corar.',
    seFalhar:
      'Chatter (estrias paralelas ao fio da lâmina) por bloco frio demais ou faca frouxa; dobras e rasgos por ângulo incorreto; cortes de espessura irregular por faca cega.',
    duracaoTipica: 'minutos por bloco',
  },
  {
    id: 'banho',
    titulo: 'Banho-maria e montagem na lâmina',
    oQueAcontece:
      'A fita é depositada em água aquecida a cerca de 45 °C, onde a parafina relaxa e as dobras se desfazem. O corte é então "pescado" com a lâmina.',
    porQue:
      'O corte sai do micrótomo comprimido no sentido do corte. O calor devolve as dimensões originais — sem essa etapa, toda medida morfométrica estaria errada.',
    seFalhar:
      'Água fria demais deixa dobras permanentes; quente demais superdistende o corte e separa as células. Bolhas sob o corte viram artefatos redondos e vazios.',
    duracaoTipica: 'segundos',
  },
  {
    id: 'coloracao',
    titulo: 'Coloração',
    oQueAcontece:
      'A parafina é removida (xilol), o corte é reidratado até a água, corado, desidratado de novo e clarificado.',
    porQue:
      'Tecido sem cor é praticamente transparente à luz branca. Os corantes criam o contraste que transforma o corte em imagem interpretável — e a escolha do corante é a escolha do que se quer ver.',
    seFalhar:
      'Subcoloração deixa núcleos pálidos e apaga a cromatina; supercoloração escurece tudo e some com o detalhe nuclear. Desparafinização incompleta deixa áreas que não coram, com aparência "lavada".',
    duracaoTipica: '30 a 60 min',
  },
  {
    id: 'montagem',
    titulo: 'Montagem e conservação',
    oQueAcontece:
      'Uma gota de meio de montagem, com índice de refração próximo ao do vidro, e a lamínula por cima.',
    porQue:
      'Preenche o espaço entre corte e lamínula, elimina a dispersão de luz nas interfaces com ar e protege o corte. Uma lâmina bem montada dura décadas.',
    seFalhar:
      'Bolhas de ar aparecem como círculos escuros de borda nítida. Meio insuficiente deixa o corte secar e retrair, criando fendas que imitam espaços vasculares.',
    duracaoTipica: 'minutos; secagem de horas',
  },
]

/* ─────────────────── Artefatos ─────────────────── */

export const ARTEFATOS: Artefato[] = [
  {
    id: 'dobra',
    nome: 'Dobra',
    aparencia:
      'Faixa alongada, mais escura que o restante, onde o tecido aparece em dupla espessura. As bordas são nítidas e retilíneas.',
    etapaCulpada: 'banho',
    causa: 'O corte não se distendeu por completo no banho-maria — água fria demais ou tempo curto.',
    correcao: 'Elevar a temperatura do banho para perto de 45 °C e dar tempo à fita antes de pescá-la.',
    confundeCom:
      'Área de hipercelularidade ou infiltrado. A pista é a geometria: infiltrado não faz linha reta com borda abrupta.',
  },
  {
    id: 'chatter',
    nome: 'Chatter (vibração)',
    aparencia:
      'Estrias finas, paralelas entre si e perpendiculares ao sentido do corte, distribuídas por todo o campo com espaçamento regular.',
    etapaCulpada: 'microtomia',
    causa: 'Vibração da faca: bloco frio demais, faca ou porta-bloco frouxos, velocidade de corte irregular.',
    correcao:
      'Reapertar a faca e o porta-bloco, deixar o bloco atingir a temperatura de trabalho e manter a velocidade constante.',
    confundeCom:
      'Estriações musculares. A diferença: chatter atravessa tecidos diferentes na mesma direção e com o mesmo passo, o que nenhuma estrutura biológica faz.',
  },
  {
    id: 'rasgo',
    nome: 'Rasgo',
    aparencia: 'Solução de continuidade irregular, com bordas afastadas e sem revestimento celular.',
    etapaCulpada: 'microtomia',
    causa: 'Falha na faca, material duro no bloco (calcificação, sutura) ou tecido pouco impregnado.',
    correcao: 'Trocar a região da faca, descalcificar quando indicado, reprocessar se a impregnação falhou.',
    confundeCom:
      'Espaço vascular ou linfático. O critério é o revestimento: vaso tem endotélio, rasgo não tem célula nenhuma na borda.',
  },
  {
    id: 'compressao',
    nome: 'Compressão',
    aparencia:
      'Tecido achatado numa direção, com núcleos ovalados alinhados no mesmo eixo e arquitetura amassada.',
    etapaCulpada: 'microtomia',
    causa: 'Faca cega ou ângulo de incidência inadequado comprimem o corte em vez de seccioná-lo.',
    correcao: 'Trocar a faca e ajustar o ângulo de folga.',
    confundeCom:
      'Fibrose ou tecido denso. A pista é a uniformidade da direção: compressão deforma tudo no mesmo eixo, inclusive as estruturas que não deveriam se alinhar.',
  },
  {
    id: 'precipitado',
    nome: 'Precipitado de corante',
    aparencia:
      'Grânulos escuros, refringentes, de tamanho variado, sobre o corte e também sobre o vidro em volta dele.',
    etapaCulpada: 'coloracao',
    causa: 'Corante oxidado, filtração inadequada ou lâmina que secou entre banhos.',
    correcao: 'Filtrar ou trocar o corante e evitar que a lâmina seque durante a bateria.',
    confundeCom:
      'Pigmento hemático ou material particulado. O sinal decisivo: precipitado também está fora do tecido, sobre o vidro nu — pigmento biológico, nunca.',
  },
  {
    id: 'subcoloracao',
    nome: 'Subcoloração',
    aparencia:
      'Núcleos pálidos, azul-acinzentados, com cromatina apagada; contraste geral fraco entre núcleo e citoplasma.',
    etapaCulpada: 'coloracao',
    causa: 'Hematoxilina esgotada, tempo curto ou diferenciação em álcool-ácido prolongada demais.',
    correcao: 'Renovar o corante, aumentar o tempo e reduzir a diferenciação.',
    confundeCom:
      'Necrose ou cariólise. A distinção é global: subcoloração afeta a lâmina inteira por igual, incluindo áreas comprovadamente viáveis.',
  },
  {
    id: 'supercoloracao',
    nome: 'Supercoloração',
    aparencia:
      'Núcleos muito escuros, quase pretos, sem detalhe de cromatina; citoplasma avermelhado intenso.',
    etapaCulpada: 'coloracao',
    causa: 'Tempo excessivo ou diferenciação insuficiente.',
    correcao: 'Reduzir o tempo em hematoxilina e ajustar a diferenciação.',
    confundeCom:
      'Hipercromasia neoplásica. O critério é o mesmo da subcoloração: alteração real é focal, artefato de coloração é da lâmina toda.',
  },
  {
    id: 'retracao',
    nome: 'Retração',
    aparencia:
      'Halo claro em volta de células ou grupos celulares, separando-os do estroma vizinho — como se cada ilha tivesse encolhido.',
    etapaCulpada: 'desidratacao',
    causa: 'Desidratação brusca ou excessiva, com perda de água estrutural.',
    correcao: 'Refazer a série alcoólica de forma gradual, respeitando o tempo de cada banho.',
    confundeCom:
      'Espaço pericelular verdadeiro, lacuna de condrócito, invasão vascular. A pergunta útil: o halo respeita algum limite anatômico? Retração não respeita.',
  },
  {
    id: 'autolise',
    nome: 'Autólise',
    aparencia:
      'Núcleos pálidos e mal definidos, citoplasma granular e eosinofílico, epitélio descolado da membrana basal, perda de nitidez nas bordas da peça.',
    etapaCulpada: 'coleta',
    causa: 'Intervalo longo entre a retirada da peça e a fixação — as enzimas lisossômicas seguiram ativas.',
    correcao:
      'Nenhuma, depois de instalada. Só se previne: fixar imediatamente e fatiar peças grandes para o fixador penetrar.',
    confundeCom:
      'Necrose. A diferença é de contexto: a autólise é difusa, mais intensa no centro da peça e sem reação inflamatória — necrose in vivo recruta células.',
  },
]

/* ─────────────────── Módulos ─────────────────── */

const REFERENCIAS_BASE: Referencia[] = [
  {
    citacao:
      'Junqueira LC, Carneiro J. Histologia Básica: Texto e Atlas. 13ª ed. Rio de Janeiro: Guanabara Koogan, 2017. Capítulo 1 — Métodos de estudo.',
  },
  {
    citacao:
      'Ross MH, Pawlina W. Histology: A Text and Atlas. 8th ed. Philadelphia: Wolters Kluwer, 2020. Chapter 1 — Methods.',
  },
  {
    citacao:
      'Bancroft JD, Layton C. The hematoxylins and eosin. In: Suvarna SK, Layton C, Bancroft JD (eds). Bancroft’s Theory and Practice of Histological Techniques. 8th ed. Elsevier, 2019.',
  },
]

export const MODULOS_DE_LABORATORIO: ModuloDeLaboratorio[] = [
  {
    id: 'da-coleta-a-lamina',
    titulo: 'Da coleta à lâmina',
    resumo:
      'As nove etapas do processamento, o que cada uma faz com o tecido e o que aparece na lâmina quando falha.',
    objetivos: [
      'Explicar a finalidade de cada etapa do processamento histológico de rotina.',
      'Relacionar uma falha de processamento ao aspecto que ela produz na lâmina.',
      'Justificar por que a desidratação é gradual e por que o corte passa pelo banho-maria.',
    ],
    minutos: 12,
    referencias: REFERENCIAS_BASE,
  },
  {
    id: 'ordem-impossivel',
    titulo: 'Ordem impossível',
    resumo:
      'Organize as etapas na sequência correta. Cada erro devolve a consequência química ou física de tê-las trocado.',
    objetivos: [
      'Ordenar corretamente as etapas do processamento.',
      'Explicar por que certas inversões são quimicamente impossíveis, e não apenas indesejáveis.',
    ],
    minutos: 8,
    referencias: REFERENCIAS_BASE,
  },
  {
    id: 'bancada-de-coloracoes',
    titulo: 'Bancada de colorações',
    resumo:
      'H&E e as demais técnicas presentes no acervo: finalidade, afinidade química e resultado esperado.',
    objetivos: [
      'Distinguir basofilia de acidofilia a partir da química do corante, não da memorização.',
      'Escolher a coloração adequada a um objetivo de observação.',
    ],
    minutos: 10,
    referencias: REFERENCIAS_BASE,
  },
  {
    id: 'diagnostico-de-artefatos',
    titulo: 'Diagnóstico de artefatos',
    resumo:
      'Nove artefatos clássicos: identifique a etapa responsável, corrija o processo e saiba com o que cada um se confunde.',
    objetivos: [
      'Reconhecer os artefatos mais comuns pela aparência.',
      'Atribuir cada artefato à etapa de processamento responsável.',
      'Diferenciar artefato de alteração tecidual verdadeira.',
    ],
    minutos: 15,
    referencias: [
      ...REFERENCIAS_BASE,
      {
        citacao:
          'Chatterjee S. Artefacts in histopathology. Journal of Oral and Maxillofacial Pathology, 2014;18(Suppl 1):S111–S116.',
        url: 'https://doi.org/10.4103/0973-029X.141346',
      },
    ],
  },
]

export function obterModulo(id: string): ModuloDeLaboratorio | undefined {
  return MODULOS_DE_LABORATORIO.find((m) => m.id === id)
}

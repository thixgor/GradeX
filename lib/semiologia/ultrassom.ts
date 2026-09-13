import type { JanelaUltrassom } from './esquemas'

/**
 * As janelas do ultrassom à beira do leito.
 *
 * ## Por que POCUS mora na Semiologia, e não na Radiologia
 *
 * O Manual de Radiologia ensina a **interpretar** um exame que outra pessoa
 * adquiriu: a tomografia já veio, os cortes estão prontos, o trabalho é ler.
 * O ultrassom à beira do leito é outro gênero — quem faz é quem examina, na
 * hora, com a pergunta já formulada, e a imagem só existe se a mão souber onde
 * encostar. Isso o aproxima muito mais do exame físico do que do laudo.
 *
 * A pergunta também é diferente. O radiologista responde "o que há neste
 * exame?". O POCUS responde uma pergunta **binária** que o próprio examinador
 * fez: tem líquido livre? tem derrame pericárdico? desliza ou não desliza? A
 * resposta muda a conduta nos minutos seguintes, e é por isso que cada janela
 * aqui declara explicitamente a sua pergunta.
 *
 * ## Sobre o que é desenhado
 *
 * As cenas são esquemas paramétricos nossos, como no resto do módulo — um
 * setor de ultrassom com as camadas na proporção certa, as linhas A no
 * espaçamento certo, o artefato de cauda de cometa saindo da linha pleural.
 * Isso ensina o **padrão**. O olho para a variação real — ganho mal ajustado,
 * paciente obeso, janela ruim entre costelas — se treina em acervo de vídeo, e
 * cada janela indica onde (The POCUS Atlas, Radiopaedia).
 */
export const JANELAS_ULTRASSOM: JanelaUltrassom[] = [
  {
    slug: 'pulmao-linhas',
    nome: 'Ultrassom pulmonar — linhas A e B',
    protocolo: 'BLUE / Lung US',
    transdutor: 'linear',
    posicao:
      'Sonda perpendicular à parede, no plano longitudinal, cruzando duas costelas na linha hemiclavicular anterior. O marcador aponta para a cabeça.',
    pergunta: 'Este pulmão está seco ou molhado? E está deslizando?',
    profundidade: '4 a 6 cm com a linear; até 12 cm com a convexa para ver base e derrame.',
    comoFazer: [
      {
        passo: 'Encontre o "sinal do morcego" antes de qualquer coisa.',
        detalhe:
          'Duas costelas com sombra acústica e, entre elas e um pouco mais profunda, a linha pleural hiperecogênica. Esse desenho garante que você está olhando pleura de verdade, e não uma interface qualquer. Sem ele, todo o resto é interpretação de artefato aleatório.',
      },
      {
        passo: 'Olhe a linha pleural por alguns ciclos respiratórios.',
        detalhe:
          'O deslizamento (lung sliding) é o brilho cintilante da pleura visceral correndo sobre a parietal. É movimento, não estrutura — por isso a avaliação exige tempo, não uma foto.',
      },
      {
        passo: 'Conte as linhas B em cada campo.',
        detalhe:
          'Linha B é o artefato vertical que parte da linha pleural, vai até o fim da tela sem se apagar, apaga as linhas A e se move junto com o deslizamento. Três ou mais num campo definem campo positivo.',
      },
      {
        passo: 'Examine ao menos quatro campos por hemitórax.',
        detalhe:
          'Anterossuperior, anteroinferior, lateral e posterolateral. A distribuição importa tanto quanto a presença: bilateral e difusa aponta para congestão; focal e irregular, para pneumonia ou contusão.',
      },
      {
        passo: 'Confirme com modo M quando a dúvida for pneumotórax.',
        detalhe:
          'Pleura deslizando produz o padrão "praia" (linhas paradas acima, granulado abaixo). Sem deslizamento, o granulado some e ficam só linhas horizontais — o "código de barras". É a forma de registrar e revisar um achado que, no modo B, depende do olho do examinador.',
      },
    ],
    estruturas: [
      { slug: 'costela', nome: 'Costelas com sombra acústica', original: 'rib shadow', nota: 'As duas âncoras laterais do sinal do morcego. A sombra existe porque o osso reflete quase tudo.', x: 22, y: 30 },
      { slug: 'linha-pleural', nome: 'Linha pleural', original: 'pleural line', nota: 'Linha hiperecogênica entre as sombras costais, cerca de 0,5 cm mais profunda que elas. É a única estrutura real da imagem — tudo abaixo dela é artefato.', x: 50, y: 34 },
      { slug: 'linha-a', nome: 'Linhas A', original: 'A-lines', nota: 'Repetições horizontais da linha pleural, igualmente espaçadas, por reverberação. Indicam ar abaixo da pleura — pulmão normal **ou** pneumotórax. Sozinhas não distinguem os dois; quem distingue é o deslizamento.', x: 50, y: 62 },
      { slug: 'linha-b', nome: 'Linhas B', original: 'B-lines', nota: 'Artefato vertical em cauda de cometa, que vai até o fundo da tela, apaga as linhas A e acompanha o deslizamento. Traduz septo interlobular espessado por líquido ou fibrose.', x: 68, y: 62 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Padrão A com deslizamento — pulmão seco',
        estado: 'normal',
        diagnostico: 'Interface pleural normal, pulmão aerado.',
        achado: 'Sinal do morcego presente, linha pleural fina e brilhante com deslizamento evidente, linhas A horizontais e regulares, menos de três linhas B por campo. Modo M com padrão de praia.',
        leitura: ['Confirme o sinal do morcego.', 'Observe o deslizamento por alguns ciclos.', 'Conte as linhas B: até duas por campo é normal.', 'Registre o modo M se for documentar.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em dispneia, padrão A bilateral com deslizamento afasta edema pulmonar cardiogênico e desloca para DPOC, asma e embolia.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'pulmao-normal' }, alt: 'Setor de ultrassom pulmonar com sinal do morcego, linha pleural e linhas A' },
      },
      {
        id: 'sindrome-intersticial',
        titulo: 'Padrão B bilateral — pulmão molhado',
        estado: 'alterado',
        diagnostico: 'Síndrome intersticial: edema pulmonar cardiogênico na maioria dos casos.',
        achado: 'Três ou mais linhas B por campo, em vários campos e nos dois hemitórax, com deslizamento preservado. As linhas A desaparecem onde as B dominam.',
        leitura: [
          'Confirme que são linhas B verdadeiras: partem da pleura, vão até o fim da tela, apagam as A e se movem com o deslizamento.',
          'Mapeie a distribuição: bilateral, simétrica e gravitacional sugere congestão.',
          'Compare com a veia cava e com a função cardíaca antes de concluir.',
        ],
        diferencaDoNormal:
          'No pulmão seco o ar reverbera e produz linhas A **horizontais**. Quando o septo interlobular se enche de líquido, a interface ar-líquido gera ressonância vertical — e a imagem troca de eixo. É literalmente essa mudança de horizontal para vertical que se está lendo.',
        conduta: 'Em dispneia aguda, padrão B bilateral com veia cava distendida apoia edema cardiogênico: diurético, vasodilatador e suporte ventilatório conforme a gravidade. Distribuição focal e irregular sugere pneumonia ou contusão.',
        diferencial: ['Pneumonia (padrão B focal)', 'SDRA (padrão B irregular com áreas poupadas e pleura irregular)', 'Fibrose pulmonar', 'Contusão pulmonar'],
        ilustracao: { id: 'ultrassom', params: { cena: 'pulmao-linhas-b' }, alt: 'Múltiplas linhas B verticais partindo da linha pleural até o fundo da tela' },
        patologia: 'edema-agudo-de-pulmao',
      },
      {
        id: 'pneumotorax',
        titulo: 'Ausência de deslizamento — pneumotórax',
        estado: 'alterado',
        diagnostico: 'Ar no espaço pleural separando os folhetos.',
        achado: 'Linhas A presentes com **ausência de deslizamento** e ausência de linhas B. Modo M com padrão de código de barras (estratosfera). O ponto pulmonar — transição entre área que desliza e área que não desliza — é específico.',
        leitura: [
          'Ache o sinal do morcego e fixe a linha pleural.',
          'Observe por vários ciclos: não há cintilação.',
          'Confirme ausência de linhas B — uma única linha B afasta pneumotórax naquele ponto, porque exige os dois folhetos em contato.',
          'Procure o ponto pulmonar deslizando a sonda lateralmente.',
          'Documente no modo M.',
        ],
        diferencaDoNormal:
          'A imagem estática é quase idêntica à do pulmão normal — as mesmas linhas A. O que mudou foi o **movimento**: com ar entre os folhetos, a pleura visceral não corre mais sob a parietal. É o exemplo mais claro de por que ultrassom pulmonar não se avalia em foto parada.',
        conduta:
          'Pneumotórax hipertensivo é diagnóstico clínico e a descompressão não espera imagem. No estável, confirmar e tratar conforme o tamanho e a repercussão. Atenção: ausência de deslizamento também ocorre em intubação seletiva, apneia, aderência pleural, SDRA grave e fibrose.',
        diferencial: ['Intubação seletiva', 'Bolha enfisematosa grande', 'Aderências pleurais', 'Apneia ou pausa respiratória'],
        ilustracao: { id: 'ultrassom', params: { cena: 'pneumotorax' }, alt: 'Modo M com padrão de código de barras indicando ausência de deslizamento pleural' },
        patologia: 'pneumotorax',
      },
      {
        id: 'derrame-pleural',
        titulo: 'Derrame pleural',
        estado: 'alterado',
        diagnostico: 'Líquido no espaço pleural.',
        achado: 'Espaço anecoico entre diafragma e pulmão, com o pulmão atelectasiado flutuando dentro dele ("sinal da medusa"). O sinal da coluna aparece: a coluna vertebral, normalmente invisível acima do diafragma pelo ar, passa a ser vista através do líquido.',
        leitura: [
          'Coloque a sonda na linha axilar posterior e encontre o diafragma.',
          'Identifique fígado ou baço abaixo dele como referência.',
          'Procure o espaço anecoico acima do diafragma.',
          'Procure o sinal da coluna — é o achado mais confiável para separar derrame de consolidação.',
          'Avalie septações: sugerem exsudato complicado e mudam a conduta.',
        ],
        diferencaDoNormal:
          'No tórax normal o ar impede a passagem do som acima do diafragma, e a coluna simplesmente desaparece ali. O líquido recria a janela acústica — a coluna reaparece. Enxergar vértebra acima do diafragma é, por si só, o diagnóstico.',
        conduta: 'Toracocentese diagnóstica guiada quando indicada; drenagem se empiema ou derrame parapneumônico complicado. O ultrassom marca o ponto de punção e reduz complicação.',
        diferencial: ['Consolidação com hepatização', 'Atelectasia', 'Elevação diafragmática', 'Ascite (abaixo do diafragma)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'derrame-pleural' }, alt: 'Espaço anecoico acima do diafragma com pulmão atelectasiado flutuando' },
        patologia: 'derrame-pleural',
      },
    ],
    armadilhas: [
      'Linhas A não distinguem pulmão normal de pneumotórax. Quem distingue é o deslizamento.',
      'Uma linha B verdadeira exclui pneumotórax naquele ponto — ela só existe com os folhetos em contato.',
      'Ausência de deslizamento tem muitas causas além de pneumotórax: intubação seletiva, apneia, aderência, SDRA, fibrose. Interprete com o quadro.',
      'Enfisema subcutâneo impede o exame por completo e simula o que quiser.',
      'Ganho mal ajustado cria e apaga linhas B. Padronize o ganho antes de contar.',
    ],
    ondeVerFoto: [
      { titulo: 'The POCUS Atlas', url: 'https://www.thepocusatlas.com/', oQueProcurar: 'Vídeos de lung sliding, linhas B, ponto pulmonar e derrame — o acervo de referência para o padrão em movimento.', nota: 'Acervo de terceiro; verifique a licença antes de reutilizar qualquer imagem.' },
      { titulo: 'Radiopaedia', url: 'https://radiopaedia.org/', oQueProcurar: 'Correlação entre achados de ultrassom pulmonar e tomografia de tórax no mesmo paciente.' },
    ],
    referencias: [
      'Lichtenstein DA, Mezière GA. Relevance of Lung Ultrasound in the Diagnosis of Acute Respiratory Failure: the BLUE Protocol. Chest, 2008;134(1):117-25.',
      'Volpicelli G et al. International evidence-based recommendations for point-of-care lung ultrasound. Intensive Care Med, 2012.',
    ],
  },

  {
    slug: 'fast-morrison',
    nome: 'FAST — recesso hepatorrenal (Morrison)',
    protocolo: 'FAST / eFAST',
    transdutor: 'convexo',
    posicao:
      'Linha axilar média a posterior direita, entre a 10ª e a 11ª costelas, marcador para a cabeça, sonda no plano coronal.',
    pergunta: 'Há líquido livre na cavidade peritoneal?',
    profundidade: '14 a 20 cm — a janela precisa incluir fígado, rim e diafragma.',
    comoFazer: [
      { passo: 'Comece alto, perto da axila, e desça.', detalhe: 'Começar baixo é o erro mais comum: a janela fica atrás da crista ilíaca e o recesso não aparece.' },
      { passo: 'Enquadre fígado, rim e diafragma na mesma imagem.', detalhe: 'Sem as três referências, não há garantia de estar no recesso certo; a interface hepatorrenal é onde o líquido se acumula primeiro no trauma em decúbito.' },
      { passo: 'Varra o rim de polo a polo.', detalhe: 'Uma imagem parada no meio do rim perde coleções pequenas nos polos. A varredura completa é o exame; a foto é só o registro.' },
      { passo: 'Olhe também acima do diafragma.', detalhe: 'A mesma janela mostra derrame pleural direito de graça — no eFAST, é achado que muda a conduta.' },
      { passo: 'Repita o exame se o quadro mudar.', detalhe: 'FAST negativo em paciente que se instabiliza deve ser refeito: sangramento em curso pode não ter atingido volume detectável na primeira passada.' },
    ],
    estruturas: [
      { slug: 'figado', nome: 'Fígado', original: 'hepar', nota: 'Janela acústica do exame: textura homogênea, referência de ecogenicidade para comparar com o rim.', x: 32, y: 40 },
      { slug: 'rim-direito', nome: 'Rim direito', original: 'ren dexter', nota: 'Córtex levemente hipoecoico em relação ao fígado, seio central hiperecogênico. Deve ser varrido de polo a polo.', x: 58, y: 56 },
      { slug: 'recesso-hepatorrenal', nome: 'Recesso hepatorrenal (bolsa de Morrison)', original: 'recessus hepatorenalis', nota: 'Interface entre fígado e rim. É o ponto mais dependente do abdome superior em decúbito dorsal — e por isso o primeiro a acumular líquido livre.', x: 46, y: 48 },
      { slug: 'diafragma', nome: 'Diafragma', original: 'diaphragma', nota: 'Linha hiperecogênica curva no topo da imagem. Acima dele, procure derrame pleural.', x: 40, y: 20 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'FAST negativo',
        estado: 'normal',
        diagnostico: 'Sem líquido livre detectável no recesso hepatorrenal.',
        achado: 'Fígado e rim em contato direto, com a interface aparecendo como linha hiperecogênica fina e contínua. Nenhuma faixa anecoica entre os órgãos. Sem líquido acima do diafragma.',
        leitura: ['Enquadre fígado, rim e diafragma.', 'Siga a interface hepatorrenal de ponta a ponta.', 'Varra o rim de polo a polo.', 'Olhe acima do diafragma.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'FAST negativo **não** exclui lesão. Em trauma com mecanismo importante, seguir o protocolo: tomografia no estável, reavaliação seriada, e nunca dar alta baseado apenas neste exame.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'fast-normal' }, alt: 'Recesso hepatorrenal normal, com fígado e rim em contato' },
      },
      {
        id: 'liquido-livre',
        titulo: 'FAST positivo — líquido livre',
        estado: 'alterado',
        diagnostico: 'Líquido livre no recesso hepatorrenal (hemoperitônio, no contexto de trauma).',
        achado: 'Faixa **anecoica** entre fígado e rim, com bordas angulares que acompanham o contorno dos órgãos. Volumes maiores estendem-se ao polo inferior do rim e ao espaço subfrênico.',
        leitura: [
          'Confirme que a faixa é anecoica e que está **entre** os dois órgãos.',
          'Repare no formato: líquido livre tem bordas angulares e se molda aos órgãos; coleção organizada é arredondada.',
          'Estime a extensão — líquido que alcança o polo inferior do rim indica volume maior.',
          'Complete as outras janelas do FAST antes de concluir.',
        ],
        diferencaDoNormal:
          'No normal, fígado e rim se tocam e a interface é uma linha só. Aqui os dois órgãos estão **separados** por uma faixa preta. A cor preta é a informação: líquido não reflete o som, e portanto não gera eco.',
        conduta:
          'Paciente instável com FAST positivo em trauma: laparotomia. Estável: tomografia com contraste. Fora do trauma, líquido livre tem outro cardápio — ascite, ruptura de cisto ovariano, gravidez ectópica rota, perfuração.',
        diferencial: ['Ascite preexistente', 'Líquido perinefrético', 'Vesícula biliar ou alça líquida confundidas com coleção', 'Gordura perirrenal hipoecoica'],
        ilustracao: { id: 'ultrassom', params: { cena: 'fast-positivo' }, alt: 'Faixa anecoica entre fígado e rim indicando líquido livre' },
        patologia: 'trauma-abdominal-fechado',
      },
    ],
    armadilhas: [
      'FAST negativo não exclui lesão de víscera sólida nem de víscera oca. É um exame para encontrar líquido, não para excluir dano.',
      'Ascite preexistente torna o FAST inespecífico em trauma — cirrótico com FAST positivo pode não ter sangramento nenhum.',
      'Gordura perirrenal hipoecoica simula líquido. Líquido é **anecoico**, com bordas angulares; gordura é hipoecoica e homogênea.',
      'Começar a janela baixo demais é o erro técnico mais frequente.',
      'Exame único em paciente que se deteriora: repita.',
    ],
    ondeVerFoto: [
      { titulo: 'The POCUS Atlas', url: 'https://www.thepocusatlas.com/', oQueProcurar: 'Casos de FAST positivo e negativo em vídeo, com variações de janela e de habitus.', nota: 'Acervo de terceiro; verifique a licença antes de reutilizar.' },
      { titulo: 'Radiopaedia', url: 'https://radiopaedia.org/', oQueProcurar: 'Correlação entre FAST positivo e tomografia de abdome no trauma.' },
    ],
    referencias: [
      'Rozycki GS et al. Surgeon-performed ultrasound for the assessment of truncal injuries. Ann Surg, 1998.',
      'ATLS — Advanced Trauma Life Support, 10ª ed.',
    ],
  },

  {
    slug: 'veia-cava-inferior',
    nome: 'Veia cava inferior',
    protocolo: 'RUSH / avaliação volêmica',
    transdutor: 'convexo',
    posicao: 'Subxifoide, plano longitudinal, marcador para a cabeça, com a cava seguida até 2 cm distal à junção com o átrio direito.',
    pergunta: 'A pressão de enchimento direita está alta ou baixa?',
    profundidade: '14 a 18 cm.',
    comoFazer: [
      { passo: 'Encontre o fígado e siga a cava até o átrio direito.', detalhe: 'A entrada no átrio confirma que é cava e não aorta. Aorta é pulsátil, tem parede espessa e fica à esquerda da linha média; cava colaba com a respiração e desemboca no átrio.' },
      { passo: 'Meça 2 cm distal à junção cavo-atrial, ou logo após a veia hepática.', detalhe: 'Ponto padronizado. Medir em lugar diferente a cada exame torna a comparação seriada inútil.' },
      { passo: 'Observe a variação respiratória em respiração espontânea tranquila.', detalhe: 'Respiração forçada colaba a cava de qualquer paciente e produz falso "hipovolêmico".' },
      { passo: 'Interprete junto com o resto.', detalhe: 'A cava isolada é um dos piores preditores de resposta a volume. Ela vale dentro de um protocolo — com pulmão, coração e clínica.' },
    ],
    estruturas: [
      { slug: 'cava', nome: 'Veia cava inferior', original: 'vena cava inferior', nota: 'Tubular, anecoica, de paredes finas, colaba na inspiração. Atravessa o fígado e desemboca no átrio direito.', x: 48, y: 52 },
      { slug: 'juncao-atrial', nome: 'Junção cavo-atrial', original: 'ostium venae cavae inferioris', nota: 'Ponto de referência da medida — 2 cm distal a ela.', x: 70, y: 36 },
      { slug: 'veia-hepatica', nome: 'Veia hepática', original: 'vena hepatica', nota: 'Desemboca na cava pouco antes do átrio; serve de referência alternativa para o ponto de medida.', x: 58, y: 44 },
      { slug: 'figado-cava', nome: 'Fígado', original: 'hepar', nota: 'Janela acústica da janela subxifoide.', x: 30, y: 60 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Cava de calibre normal',
        estado: 'normal',
        diagnostico: 'Pressão de átrio direito estimada em torno de 3 mmHg.',
        achado: 'Diâmetro entre 1,5 e 2,1 cm com colapso inspiratório superior a 50%.',
        leitura: ['Confirme que é cava seguindo até o átrio.', 'Meça no ponto padronizado.', 'Observe a variação em respiração tranquila.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma isoladamente. A cava informa pressão de enchimento, não responsividade a volume.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'cava-normal' }, alt: 'Veia cava inferior de calibre normal com colapso inspiratório' },
      },
      {
        id: 'cava-colabada',
        titulo: 'Cava colabada',
        estado: 'alterado',
        diagnostico: 'Pressão de átrio direito baixa — compatível com hipovolemia.',
        achado: 'Diâmetro menor que 1,5 cm com colapso inspiratório maior que 50%, chegando à obliteração completa da luz.',
        leitura: ['Confirme respiração espontânea tranquila.', 'Repita a medida em dois ciclos.', 'Correlacione com pulmão seco e com a clínica.'],
        diferencaDoNormal: 'A cava normal mantém luz visível durante todo o ciclo. Aqui ela desaparece na inspiração — a pressão intratorácica negativa esvazia um vaso já pouco preenchido.',
        conduta: 'Em choque com cava colabada e pulmão seco, a prova de volume é razoável. Em ventilação mecânica a interpretação se inverte e o limiar muda — não transponha os números.',
        diferencial: ['Ventilação mecânica (interpretação invertida)', 'Respiração forçada', 'Manobra de Valsalva'],
        ilustracao: { id: 'ultrassom', params: { cena: 'cava-colabada' }, alt: 'Veia cava inferior estreitada, colabando completamente na inspiração' },
        patologia: 'choque-hipovolemico',
      },
      {
        id: 'cava-plectorica',
        titulo: 'Cava distendida e sem variação',
        estado: 'alterado',
        diagnostico: 'Pressão de átrio direito elevada — congestão ou obstrução.',
        achado: 'Diâmetro maior que 2,1 cm com colapso inspiratório menor que 50%, frequentemente sem nenhuma variação ("cava plectórica").',
        leitura: ['Meça no ponto padronizado.', 'Observe se há qualquer variação respiratória.', 'Vá imediatamente para a janela cardíaca: tamponamento e disfunção de ventrículo direito precisam ser excluídos.'],
        diferencaDoNormal: 'A cava normal varia com a respiração porque a pressão do átrio direito é baixa e a mecânica torácica a modula. Distendida e imóvel, ela indica que a pressão a montante está tão alta que a respiração já não a move.',
        conduta: 'Não expandir volume sem outra justificativa. Procurar tamponamento, disfunção de ventrículo direito, tromboembolismo, pneumotórax hipertensivo e congestão por insuficiência cardíaca.',
        diferencial: ['Tamponamento cardíaco', 'Tromboembolismo pulmonar', 'Insuficiência cardíaca direita', 'Pneumotórax hipertensivo', 'Ventilação com PEEP elevada'],
        ilustracao: { id: 'ultrassom', params: { cena: 'cava-plectorica' }, alt: 'Veia cava inferior distendida e sem variação respiratória' },
        patologia: 'tamponamento-cardiaco',
      },
    ],
    armadilhas: [
      'Confundir cava com aorta. Aorta é pulsátil, de parede espessa, e não desemboca no átrio.',
      'Medir em ponto diferente a cada exame destrói a comparação seriada.',
      'A cava isolada prediz mal resposta a volume. Use dentro de um protocolo, junto com pulmão e coração.',
      'Em ventilação mecânica, a fisiologia se inverte: a inspiração distende a cava em vez de colabá-la.',
      'Corte oblíquo subestima o diâmetro — alinhe o plano antes de medir.',
    ],
    ondeVerFoto: [
      { titulo: 'The POCUS Atlas', url: 'https://www.thepocusatlas.com/', oQueProcurar: 'Vídeos de cava colabada, normal e plectórica, com a variação respiratória em tempo real.', nota: 'Acervo de terceiro; verifique a licença antes de reutilizar.' },
    ],
    referencias: [
      'Perera P et al. The RUSH exam: Rapid Ultrasound in SHock. Emerg Med Clin North Am, 2010.',
      'Rudski LG et al. ASE Guidelines for the Echocardiographic Assessment of the Right Heart, 2010.',
    ],
  },

  {
    slug: 'subxifoide-pericardio',
    nome: 'Janela subxifoide — pericárdio',
    protocolo: 'FAST / RUSH',
    transdutor: 'setorial',
    posicao: 'Subxifoide, sonda quase deitada sobre o abdome, apontando para o ombro esquerdo, marcador à direita do paciente.',
    pergunta: 'Há derrame pericárdico? Ele está comprimindo o coração?',
    profundidade: '16 a 20 cm — o coração está longe nesta janela.',
    comoFazer: [
      { passo: 'Deite a sonda quase paralela à pele.', detalhe: 'Sonda em pé mostra fígado. A janela subxifoide exige ângulo raso, com o feixe passando por baixo do rebordo costal.' },
      { passo: 'Use o fígado como janela acústica.', detalhe: 'É o fígado que carrega o som até o coração. Deslizar um pouco para a direita do paciente costuma melhorar a imagem, não piorar.' },
      { passo: 'Peça uma inspiração profunda sustentada.', detalhe: 'O diafragma desce e traz o coração para dentro da janela. É a manobra que salva a maioria das janelas ruins.' },
      { passo: 'Procure a faixa anecoica circunferencial.', detalhe: 'Derrame pericárdico contorna o coração. Coleção apenas anterior e localizada costuma ser gordura epicárdica.' },
      { passo: 'Procure colapso diastólico do ventrículo direito.', detalhe: 'É o sinal ecocardiográfico de tamponamento. Tamponamento, porém, é diagnóstico clínico-ecocardiográfico: a tríade hemodinâmica manda mais que o milímetro medido.' },
    ],
    estruturas: [
      { slug: 'ventriculo-direito', nome: 'Ventrículo direito', original: 'ventriculus dexter', nota: 'A câmara mais próxima da sonda nesta janela, logo abaixo do fígado. Paredes finas — colapsa primeiro quando a pressão pericárdica sobe.', x: 44, y: 40 },
      { slug: 'ventriculo-esquerdo', nome: 'Ventrículo esquerdo', original: 'ventriculus sinister', nota: 'Mais profundo, com parede espessa e cavidade menor.', x: 60, y: 56 },
      { slug: 'pericardio', nome: 'Pericárdio', original: 'pericardium', nota: 'Linha hiperecogênica brilhante que contorna o coração. O derrame aparece como faixa anecoica entre os folhetos.', x: 52, y: 30 },
      { slug: 'figado-janela', nome: 'Fígado', original: 'hepar', nota: 'A janela acústica. Sem ele, o ar do estômago e do cólon impede o exame.', x: 26, y: 56 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Pericárdio normal',
        estado: 'normal',
        diagnostico: 'Sem derrame pericárdico.',
        achado: 'Pericárdio como linha hiperecogênica única contornando o coração, sem separação entre folhetos. Ventrículo direito com enchimento normal.',
        leitura: ['Enquadre as quatro câmaras pela janela subxifoide.', 'Siga o pericárdio ao redor do coração.', 'Observe o ventrículo direito ao longo do ciclo.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em choque indiferenciado, a ausência de derrame exclui tamponamento e o protocolo segue.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'pericardio-normal' }, alt: 'Janela subxifoide com pericárdio normal, sem separação de folhetos' },
      },
      {
        id: 'derrame-pericardico',
        titulo: 'Derrame pericárdico com tamponamento',
        estado: 'alterado',
        diagnostico: 'Derrame pericárdico com repercussão hemodinâmica.',
        achado: 'Faixa anecoica circunferencial ao redor do coração, com **colapso diastólico do ventrículo direito**, coração hipercinético "balançando" dentro do líquido (swinging heart) e cava distendida sem variação respiratória.',
        leitura: [
          'Confirme que o líquido é circunferencial.',
          'Observe a parede livre do ventrículo direito na diástole — o colapso é o achado de repercussão.',
          'Vá para a cava: distendida e sem variação completa o quadro.',
          'Some a clínica: hipotensão, turgência jugular e bulhas abafadas.',
        ],
        diferencaDoNormal:
          'No normal os folhetos pericárdicos são uma linha só. Aqui há líquido entre eles — e o que transforma derrame em tamponamento não é o volume, é a **velocidade**: o pericárdio acomoda um litro se acumulado em meses, e descompensa com 150 mL acumulados em minutos.',
        conduta: 'Tamponamento é emergência: pericardiocentese guiada por ultrassom, expansão volêmica como ponte, evitar ventilação com pressão positiva antes da drenagem quando possível.',
        diferencial: ['Gordura epicárdica (anterior, ecogênica, não circunferencial)', 'Derrame pleural esquerdo', 'Cisto pericárdico', 'Ascite (fica abaixo do diafragma)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'derrame-pericardico' }, alt: 'Derrame pericárdico circunferencial com colapso do ventrículo direito' },
        patologia: 'tamponamento-cardiaco',
      },
    ],
    armadilhas: [
      'Gordura epicárdica simula derrame — mas é anterior, ecogênica e não contorna o coração.',
      'Derrame pleural esquerdo aparece na mesma janela; o pericárdio o separa do coração, e a aorta descendente é a referência para distinguir.',
      'Tamponamento é clínico-ecocardiográfico. Derrame grande sem repercussão não é tamponamento; derrame pequeno de instalação rápida pode ser.',
      'Janela subxifoide ruim não é exame negativo. Tente paraesternal e apical antes de concluir.',
    ],
    ondeVerFoto: [
      { titulo: 'The POCUS Atlas', url: 'https://www.thepocusatlas.com/', oQueProcurar: 'Vídeos de derrame pericárdico, colapso de câmaras direitas e swinging heart.', nota: 'Acervo de terceiro; verifique a licença antes de reutilizar.' },
      { titulo: 'Radiopaedia', url: 'https://radiopaedia.org/', oQueProcurar: 'Correlação entre derrame pericárdico no ultrassom e na tomografia de tórax.' },
    ],
    referencias: [
      'Perera P et al. The RUSH exam. Emerg Med Clin North Am, 2010.',
      'Klein AL et al. ASE Recommendations for Pericardial Disease, 2013.',
    ],
  },
]

export const TOTAL_DE_JANELAS = JANELAS_ULTRASSOM.length
export const TOTAL_DE_CENAS_ULTRASSOM = JANELAS_ULTRASSOM.reduce((total, janela) => total + janela.cenas.length, 0)

export function janelaPorSlug(slug: string): JanelaUltrassom | undefined {
  return JANELAS_ULTRASSOM.find((janela) => janela.slug === slug)
}

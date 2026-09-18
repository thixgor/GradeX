import type { CenaClinica, JanelaUltrassom } from './esquemas'
import { CENAS_PERICARDIO, CENAS_PULMAO } from './ultrassom-torax'
import { CENAS_APICAL, CENAS_CAVA, CENAS_PLAX, CENAS_PSAX } from './ultrassom-coracao'
import {
  CENAS_ABDOME_AGUDO,
  CENAS_AORTA,
  CENAS_BEXIGA,
  CENAS_FAST,
  CENAS_RINS,
  CENAS_VEIAS,
  CENAS_VESICULA,
} from './ultrassom-vasos-abdome'
import { CENAS_OBSTETRICO, CENAS_PARTES_MOLES, JANELA_OLHO } from './ultrassom-pelve-msk-olho'
import {
  CENAS_CARDIO_LEVA_4,
  JANELA_BLOQUEIOS,
  JANELA_DOPPLER,
  JANELA_OBSTETRICO_TARDIO,
  JANELA_PARTES_PEQUENAS,
  JANELA_PROCEDIMENTOS,
} from './ultrassom-leva-4'

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
 * paciente obeso, janela ruim entre costelas — se treina em acervo de vídeo.
 *
 * Desde as autorizações escritas do **The POCUS Atlas** e do **Radiopaedia**,
 * esse acervo deixou de ser apenas um ponteiro para fora: as duas fontes
 * concederam exceção expressa à cláusula NonCommercial em favor da DomineAqui,
 * e o caso real pode ser exibido aqui dentro, ao lado do esquema, com o crédito
 * que elas exigem (ver `direitos.ts` e `midia.ts`).
 */
const JANELAS_BASE: JanelaUltrassom[] = [
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
      {
        id: 'consolidacao',
        titulo: 'Consolidação pulmonar',
        estado: 'alterado',
        diagnostico: 'Pneumonia ou atelectasia — alvéolos cheios de líquido ou colapsados.',
        achado: 'Área subpleural com textura de tecido, semelhante ao fígado ("hepatização"), com pontos e traços brilhantes no interior (broncogramas aéreos) e borda profunda irregular contra o pulmão aerado (sinal do fragmento). As linhas A somem no local; podem restar linhas B ao redor.',
        leitura: [
          'Confirme que a área tem textura de víscera, e não é sombra nem derrame.',
          'Procure os broncogramas aéreos — dinâmicos, movendo-se com a respiração, apontam pneumonia; estáticos ou ausentes, atelectasia.',
          'Olhe a borda profunda: irregular (fragmentada) é consolidação; lisa e regular é derrame.',
          'Mapeie o resto do pulmão: consolidação com padrão A ao redor é focal, e a causa é local.',
        ],
        diferencaDoNormal:
          'O pulmão normal é invisível: o ar reflete o feixe na pleura e tudo abaixo é artefato. Quando o alvéolo se enche, o parênquima vira um tecido sólido que o som atravessa — e aparece, pela primeira vez, com a textura de um órgão. Os brilhos dentro dele são o pouco ar que restou nos brônquios. É a única situação em que se enxerga o pulmão de verdade, e é exatamente por isso que está doente.',
        conduta: 'Em dispneia com febre, apoia pneumonia: antibiótico conforme gravidade e contexto. Broncogramas estáticos com volume reduzido sugerem atelectasia — fisioterapia, aspiração, revisão do tubo. Consolidação com derrame associado pede avaliação do derrame (parapneumônico complicado?). Radiografia ou tomografia se a evolução não for a esperada.',
        diferencial: ['Atelectasia (broncogramas estáticos, volume reduzido)', 'Contusão pulmonar (trauma)', 'Infarto pulmonar (subpleural, em cunha, sem broncograma)', 'Tumor', 'Derrame com pulmão colabado adjacente'],
        ilustracao: { id: 'ultrassom', params: { cena: 'consolidacao', profundidade: 3 }, alt: 'Consolidação subpleural com textura hepática, broncogramas aéreos e borda irregular' },
        patologia: 'pneumonia-adquirida-na-comunidade',
      },
      {
        id: 'sindrome-intersticial-focal',
        titulo: 'Síndrome intersticial focal',
        estado: 'alterado',
        diagnostico: 'Processo pulmonar localizado — pneumonia inicial, contusão ou infarto — e não edema difuso.',
        achado: 'Três ou mais linhas B agrupadas em um espaço intercostal ou região, com padrão A preservado nos campos vizinhos e no hemitórax contralateral. A pleura na área pode estar irregular ou espessada; pequenas consolidações subpleurais podem acompanhar.',
        leitura: [
          'Conte as linhas B no campo positivo e confirme que são verdadeiras.',
          'Varra os demais campos dos dois lados: a distribuição é a resposta.',
          'Olhe a pleura na região — irregular, espessada ou com microconsolidação fala por pneumonia.',
          'Repita em 24 a 48 horas: a focal que vira consolidação confirma o diagnóstico.',
        ],
        diferencaDoNormal:
          'A mesma linha B que, bilateral e simétrica, significa congestão, quando aparece **em um só lugar** significa outra coisa: o interstício está molhado ali por um processo local. A imagem no campo positivo é idêntica à do edema; o que muda é o mapa. Ler ultrassom pulmonar é ler distribuição, não contar artefato.',
        conduta: 'Afasta edema cardiogênico como explicação principal e desloca o raciocínio para pneumonia inicial, contusão (no trauma), infarto pulmonar ou atelectasia. Trate a causa provável e reavalie: a consolidação costuma aparecer nas 24 a 48 horas seguintes.',
        diferencial: ['Pneumonia em fase inicial', 'Contusão pulmonar', 'Infarto pulmonar', 'Atelectasia por hipoventilação', 'Doença intersticial localizada (fibrose, com pleura irregular)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'pulmao-linhas-b-focal', linhasB: 5 }, alt: 'Linhas B agrupadas em uma região do espaço intercostal, com padrão A ao redor' },
      },
      {
        id: 'atelectasia',
        titulo: 'Atelectasia',
        estado: 'alterado',
        diagnostico: 'Colapso alveolar — obstrução brônquica, compressão ou hipoventilação.',
        achado:
          'Área de pulmão compacto, com textura de tecido, de borda lisa e regular, geralmente na base e acompanhada de pequeno derrame; volume reduzido, com o diafragma elevado e as estruturas puxadas em direção ao colapso. Broncogramas aéreos escassos e estáticos — ou ausentes, na obstrução completa. Linhas B ao redor.',
        leitura: [
          'Confirme a textura de tecido e compare o volume com o lado oposto: o colapso encolhe.',
          'Olhe os broncogramas por alguns ciclos: parados ou ausentes falam por atelectasia; dinâmicos, por pneumonia.',
          'Veja a borda: lisa e regular, diferente do fragmento da consolidação.',
          'Procure a causa: derrame que comprime, tampão que obstrui, dor que impede a respiração profunda.',
        ],
        diferencaDoNormal:
          'A consolidação pneumônica e a atelectasia têm a mesma textura — pulmão sem ar parece fígado nos dois casos. A diferença é o que aconteceu com o ar: na pneumonia ele foi substituído por exsudato, e o volume se mantém; na atelectasia ele foi absorvido, e o volume some. Broncogramas que se movem são brônquios ainda ventilados; brônquios parados são brônquios fechados.',
        conduta:
          'Tratar a causa: fisioterapia respiratória, analgesia que permita respirar fundo, mobilização e, se houver tampão, aspiração broncoscópica. Derrame compressivo drena-se se sintomático. Atelectasia que não reexpande em dias, em fumante, pede investigação de obstrução brônquica.',
        diferencial: ['Pneumonia (broncogramas dinâmicos, volume preservado)', 'Contusão pulmonar', 'Tumor obstrutivo com atelectasia distal', 'Derrame com pulmão colabado (a atelectasia é a consequência)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'atelectasia', extensao: 50 }, alt: 'Pulmão colabado de borda lisa sobre o diafragma elevado, com broncogramas estáticos' },
      },
      {
        id: 'derrame-pleural-complexo',
        titulo: 'Derrame pleural complexo',
        estado: 'alterado',
        diagnostico: 'Exsudato complicado, empiema ou hemotórax — líquido que não é só água.',
        achado:
          'Coleção pleural com ecos internos flutuantes, septos finos ou espessos dividindo o líquido em lojas, detritos que se depositam e se movem com a respiração, e pleura espessada ou irregular. O líquido pode ser homogeneamente ecogênico (sangue, pus).',
        leitura: [
          'Aumente o ganho e olhe dentro do líquido: anecoico é simples; com ecos, é complexo.',
          'Procure septos — são o que faz a drenagem por agulha falhar.',
          'Veja a pleura: espessada e irregular sugere empiema ou neoplasia.',
          'Correlacione: febre e pneumonia apontam empiema; trauma, hemotórax.',
        ],
        diferencaDoNormal:
          'O derrame simples é água: preto, homogêneo, com o pulmão flutuando dentro. Quando o líquido é sangue, pus ou exsudato rico em fibrina, ele carrega partículas que refletem o som — ecos — e a fibrina forma paredes que o dividem em compartimentos. Cada septo é um bolsão que uma agulha não alcança.',
        conduta:
          'Toracocentese diagnóstica guiada; empiema e derrame parapneumônico complicado (pH < 7,2, glicose baixa, pus) drenam com dreno torácico, com fibrinolítico intrapleural se septado, e cirurgia se falhar. Hemotórax drena-se; volume inicial e débito horário decidem a toracotomia. Antibiótico conforme a etiologia.',
        diferencial: ['Derrame simples com artefato de ganho alto', 'Consolidação (não muda com a respiração como o líquido)', 'Tumor pleural', 'Hérnia diafragmática com conteúdo abdominal'],
        ilustracao: { id: 'ultrassom', params: { cena: 'derrame-pleural-complexo', debris: 2 }, alt: 'Derrame pleural com septos e detritos ecogênicos dentro do líquido' },
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
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/',
        oQueProcurar: 'Vídeos de lung sliding, linhas B, ponto pulmonar e derrame — o acervo de referência para o padrão em movimento.',
        licenciada: 'pocus-atlas',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre achados de ultrassom pulmonar e tomografia de tórax no mesmo paciente.',
        licenciada: 'radiopaedia',
      },
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
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/',
        oQueProcurar: 'Casos de FAST positivo e negativo em vídeo, com variações de janela e de habitus.',
        licenciada: 'pocus-atlas',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre FAST positivo e tomografia de abdome no trauma.',
        licenciada: 'radiopaedia',
      },
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
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/',
        oQueProcurar: 'Vídeos de cava colabada, normal e plectórica, com a variação respiratória em tempo real.',
        licenciada: 'pocus-atlas',
      },
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
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/',
        oQueProcurar: 'Vídeos de derrame pericárdico, colapso de câmaras direitas e swinging heart.',
        licenciada: 'pocus-atlas',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre derrame pericárdico no ultrassom e na tomografia de tórax.',
        licenciada: 'radiopaedia',
      },
    ],
    referencias: [
      'Perera P et al. The RUSH exam. Emerg Med Clin North Am, 2010.',
      'Klein AL et al. ASE Recommendations for Pericardial Disease, 2013.',
    ],
  },

  {
    slug: 'paraesternal-eixo-longo',
    nome: 'Coração — paraesternal eixo longo',
    protocolo: 'RUSH / ecocardiografia focada',
    transdutor: 'setorial',
    posicao: 'Terceiro ou quarto espaço intercostal esquerdo, junto ao esterno, marcador para o ombro direito do paciente. Paciente em decúbito lateral esquerdo, se tolerar.',
    pergunta: 'O ventrículo esquerdo contrai bem, mal ou muito mal?',
    profundidade: '12 a 16 cm.',
    comoFazer: [
      { passo: 'Encoste a sonda à esquerda do esterno e procure o ventrículo esquerdo em corte longo.', detalhe: 'A imagem certa mostra, de cima para baixo: ventrículo direito, septo, cavidade do VE, parede posterior. À direita, a via de saída com a aorta e o átrio esquerdo.' },
      { passo: 'Ajuste até a mitral e a aórtica aparecerem no mesmo plano.', detalhe: 'É o critério de que o corte passa pelo centro do ventrículo. Corte tangencial faz a cavidade parecer pequena e a contração parecer boa.' },
      { passo: 'Olhe três ciclos e estime a fração de ejeção a olho.', detalhe: 'A pergunta é grosseira de propósito: normal (> 50%), reduzida (30 a 50%) ou gravemente reduzida (< 30%). A precisão do ecocardiograma formal não é o objetivo à beira do leito.' },
      { passo: 'Repare se o folheto anterior da mitral chega perto do septo.', detalhe: 'Na diástole, o folheto normal quase toca o septo (EPSS < 7 mm). Um folheto que fica longe é um ventrículo que se enche pouco por contrair mal.' },
    ],
    estruturas: [
      { slug: 'vd-plax', nome: 'Ventrículo direito', original: 'ventriculus dexter', nota: 'A câmara mais superficial, no topo da tela. Só a via de saída aparece neste corte — não julgue o tamanho do VD aqui.', x: 50, y: 16 },
      { slug: 'septo', nome: 'Septo interventricular', original: 'septum interventriculare', nota: 'Linha brilhante entre VD e VE. Espessa-se na sístole junto com a parede posterior; quando só um dos dois se move, há segmento acinético.', x: 50, y: 24 },
      { slug: 've-plax', nome: 'Ventrículo esquerdo', original: 'ventriculus sinister', nota: 'A cavidade que se estima. Diâmetro diastólico acima de 5,5 a 6 cm é dilatação; as paredes devem espessar visivelmente a cada sístole.', x: 42, y: 50 },
      { slug: 'mitral', nome: 'Valva mitral', original: 'valva mitralis', nota: 'Entre VE e átrio esquerdo. O folheto anterior abre em direção ao septo na diástole — a distância que sobra é o EPSS.', x: 62, y: 44 },
      { slug: 'aorta-plax', nome: 'Aorta e átrio esquerdo', original: 'aorta · atrium sinistrum', nota: 'A raiz da aorta sai do VE para a direita da tela; o átrio esquerdo fica abaixo dela. Raiz acima de 4 cm pede investigação.', x: 82, y: 46 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Contração normal',
        estado: 'normal',
        diagnostico: 'Função sistólica do ventrículo esquerdo preservada.',
        achado: 'Cavidade do VE de dimensões normais, com redução de mais da metade do diâmetro entre diástole e sístole e espessamento simétrico do septo e da parede posterior. Folheto anterior da mitral quase encostando no septo na diástole.',
        leitura: ['Confirme o plano: mitral e aórtica visíveis juntas.', 'Compare o diâmetro diastólico com o sistólico.', 'Veja se septo e parede posterior engrossam ao mesmo tempo.', 'Confira o EPSS.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em choque, VE hiperdinâmico com cavidade quase obliterada na sístole aponta para hipovolemia ou vasoplegia, não para falência de bomba.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'plax-normal' }, alt: 'Paraesternal eixo longo com ventrículo esquerdo de contração normal' },
      },
      {
        id: 'disfuncao-sistolica-ve',
        titulo: 'Disfunção sistólica do ventrículo esquerdo',
        estado: 'alterado',
        diagnostico: 'Fração de ejeção reduzida — falência de bomba.',
        achado: 'Cavidade do VE dilatada ou de dimensões normais, com variação mínima de diâmetro entre diástole e sístole. Paredes que quase não espessam. Folheto anterior da mitral longe do septo (EPSS > 7 mm). Átrio esquerdo frequentemente aumentado.',
        leitura: [
          'Confirme que o corte está no centro do ventrículo antes de julgar — corte tangencial mente para os dois lados.',
          'Classifique em normal, reduzida ou gravemente reduzida. Não tente dar um número exato.',
          'Meça o EPSS se a estimativa visual ficar em dúvida.',
          'Some ao resto do protocolo: cava plectórica e linhas B bilaterais fecham o quadro de congestão.',
        ],
        diferencaDoNormal:
          'No coração normal a cavidade some pela metade a cada batida. Aqui ela quase não muda de tamanho — a imagem parece congelada mesmo com o coração batendo. E, como o ventrículo que ejeta mal se enche mais para compensar, a cavidade também cresce: um VE grande e parado é o retrato da insuficiência sistólica.',
        conduta: 'Em choque, reduz muito a probabilidade de hipovolemia isolada e desloca o manejo para suporte inotrópico e cautela com volume. Em dispneia, apoia insuficiência cardíaca descompensada: diurético e vasodilatador conforme a pressão. Peça ecocardiograma formal para etiologia e quantificação.',
        diferencial: ['Cardiomiopatia dilatada', 'Infarto extenso com acinesia', 'Miocardite', 'Cardiomiopatia séptica (disfunção reversível)', 'Taquicardiomiopatia'],
        ilustracao: { id: 'ultrassom', params: { cena: 'plax-disfuncao-ve', fracaoEjecao: 25 }, alt: 'Paraesternal eixo longo com ventrículo esquerdo dilatado e contração global reduzida' },
        patologia: 'insuficiencia-cardiaca',
      },
    ],
    armadilhas: [
      'Corte tangencial (fora do centro do ventrículo) faz a cavidade parecer pequena e hipercontrátil. Confirme o plano pela mitral e pela aórtica.',
      'Hipertrofia com cavidade pequena engana para o outro lado: a parede espessa se move pouco, mas a fração de ejeção pode estar preservada.',
      'Segmento acinético isolado não é disfunção global. O eixo longo mostra só o septo e a parede posterior — infarto de parede lateral pode passar.',
      'Fração de ejeção preservada não exclui insuficiência cardíaca: a disfunção diastólica não aparece neste exame.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/echocardiography',
        oQueProcurar: 'Clipes de eixo longo normal e com disfunção sistólica grave, lado a lado — o olho calibra a estimativa visual.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Perera P et al. The RUSH exam: Rapid Ultrasound in SHock. Emerg Med Clin North Am, 2010.',
      'McKaigney CJ et al. E-point septal separation: a bedside tool for emergency physician assessment of left ventricular ejection fraction. Am J Emerg Med, 2014.',
    ],
  },

  {
    slug: 'paraesternal-eixo-curto',
    nome: 'Coração — paraesternal eixo curto',
    protocolo: 'RUSH / avaliação do ventrículo direito',
    transdutor: 'setorial',
    posicao: 'Mesma posição do eixo longo, com a sonda girada 90° no sentido horário, marcador para o ombro esquerdo. Nível dos músculos papilares.',
    pergunta: 'O ventrículo direito está sobrecarregado?',
    profundidade: '12 a 16 cm.',
    comoFazer: [
      { passo: 'A partir do eixo longo, gire a sonda 90° no sentido horário.', detalhe: 'O VE vira um anel; o VD, uma meia-lua encostada nele. Incline até ver os dois músculos papilares dentro do anel — é o nível padrão.' },
      { passo: 'Compare o tamanho das duas cavidades.', detalhe: 'O VD normal tem menos de dois terços do VE. Igual ou maior é dilatação.' },
      { passo: 'Olhe a forma do VE ao longo do ciclo.', detalhe: 'Redondo o tempo todo é normal. Achatado no lado do septo — o "D" — é pressão alta do lado direito.' },
      { passo: 'Verifique a contração segmentar do VE ao mesmo tempo.', detalhe: 'Este é o único corte que mostra todas as paredes do VE ao redor de um centro; um segmento que não engrossa aponta o território coronariano.' },
    ],
    estruturas: [
      { slug: 'vd-psax', nome: 'Ventrículo direito', original: 'ventriculus dexter', nota: 'Meia-lua de parede fina, anterior e à esquerda do VE na tela. Cresce e perde a forma de crescente quando sobrecarregado.', x: 28, y: 42 },
      { slug: 'septo-psax', nome: 'Septo interventricular', original: 'septum interventriculare', nota: 'A parede compartilhada. Convexa para o VD no normal; achatada ou invertida quando a pressão direita ultrapassa a esquerda.', x: 44, y: 58 },
      { slug: 've-psax', nome: 'Ventrículo esquerdo', original: 'ventriculus sinister', nota: 'O anel espesso e redondo. Todas as paredes visíveis ao mesmo tempo — é o corte para procurar segmento acinético.', x: 64, y: 50 },
      { slug: 'papilares', nome: 'Músculos papilares', original: 'musculi papillares', nota: 'Dois nódulos dentro do anel, às 4 e às 8 horas. Confirmam o nível do corte: acima deles é a mitral, abaixo é o ápice.', x: 58, y: 68 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Ventrículo direito de tamanho normal',
        estado: 'normal',
        diagnostico: 'Sem sobrecarga do ventrículo direito.',
        achado: 'VE em anel redondo com dois músculos papilares; VD em meia-lua fina, com menos de dois terços da área do VE; septo convexo para o VD durante todo o ciclo.',
        leitura: ['Confirme o nível pelos papilares.', 'Compare as áreas de VD e VE.', 'Acompanhe a curvatura do septo na sístole e na diástole.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em dispneia ou choque, VD normal reduz a probabilidade de embolia pulmonar com repercussão hemodinâmica.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'psax-normal' }, alt: 'Paraesternal eixo curto com ventrículo esquerdo redondo e ventrículo direito em meia-lua' },
      },
      {
        id: 'dilatacao-vd',
        titulo: 'Dilatação do ventrículo direito',
        estado: 'alterado',
        diagnostico: 'Sobrecarga aguda de pressão do ventrículo direito — embolia pulmonar no contexto certo.',
        achado: 'VD igual ou maior que o VE, perdendo o formato de meia-lua. Septo achatado, deformando o VE em "D" — na diástole, na sístole ou nas duas. Parede livre do VD hipocinética, com o ápice poupado (sinal de McConnell) na embolia aguda.',
        leitura: [
          'Meça a razão VD/VE no mesmo corte: acima de 1 é dilatação franca.',
          'Veja em que fase o septo achata: na sístole é sobrecarga de pressão; só na diástole é sobrecarga de volume.',
          'Observe a parede livre do VD: hipocinesia com ápice poupado é sugestiva de embolia.',
          'Complete com cava, pulmão e veias das pernas antes de fechar o raciocínio.',
        ],
        diferencaDoNormal:
          'O VE normal é redondo porque a pressão dentro dele vence a do VD e empurra o septo para fora. Quando a pressão direita sobe de repente, o septo perde esse abaulamento e vira uma parede reta: o círculo vira um D. Ao mesmo tempo, o VD — que é fino e se dilata fácil — deixa de ser um crescente e ocupa metade da tela.',
        conduta: 'Em choque ou dispneia súbita, aumenta muito a suspeita de embolia pulmonar com repercussão hemodinâmica: angiotomografia se estável; se instável e sem outra explicação, discutir trombólise. Evite volume em excesso — o VD sobrecarregado piora com ele. Diferencie de sobrecarga crônica pelo espessamento da parede livre.',
        diferencial: ['Hipertensão pulmonar crônica (parede livre espessa, > 5 mm)', 'Infarto de VD', 'SDRA com hipertensão pulmonar aguda', 'Cardiopatia congênita com shunt', 'Tamponamento (colapso, não dilatação)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'psax-vd-dilatado', razaoVdVe: 1.2 }, alt: 'Paraesternal eixo curto com ventrículo direito dilatado e septo achatado em D' },
        patologia: 'tromboembolismo-pulmonar',
      },
    ],
    armadilhas: [
      'Corte oblíquo faz o VD parecer maior. Confirme o nível pelos dois papilares antes de comparar.',
      'Dilatação de VD não é sinônimo de embolia: DPOC, hipertensão pulmonar crônica e infarto de VD produzem a mesma imagem. A parede livre espessa fala por cronicidade.',
      'VD normal não exclui embolia pulmonar — exclui embolia com repercussão hemodinâmica, que é a pergunta que importa no choque.',
      'Sinal de McConnell tem especificidade menor do que se propagou; não decida trombólise por ele sozinho.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/echocardiography',
        oQueProcurar: 'Clipes de dilatação de VD com sinal do D em embolia pulmonar confirmada, e o eixo curto normal para comparação.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Perera P et al. The RUSH exam. Emerg Med Clin North Am, 2010.',
      'Dresden S et al. Right ventricular dilatation on bedside echocardiography performed by emergency physicians aids in the diagnosis of pulmonary embolism. Ann Emerg Med, 2014.',
    ],
  },

  {
    slug: 'aorta-abdominal',
    nome: 'Aorta abdominal',
    protocolo: 'Rastreamento de aneurisma / dor abdominal',
    transdutor: 'convexo',
    posicao: 'Epigástrio, plano transverso, marcador para a direita do paciente. Siga a aorta de baixo do processo xifoide até a bifurcação, um pouco acima do umbigo.',
    pergunta: 'A aorta abdominal mede mais de 3 cm?',
    profundidade: '15 a 20 cm.',
    comoFazer: [
      { passo: 'Encontre a sombra da coluna vertebral e a aorta logo à frente dela.', detalhe: 'A vértebra é o arco brilhante com sombra atrás, no fundo da tela. A aorta é o círculo pulsátil imediatamente anterior e à esquerda dela; a cava é a estrutura oval à direita, que se achata com a compressão.' },
      { passo: 'Varra em transverso da aorta proximal até a bifurcação.', detalhe: 'O aneurisma costuma ser infrarrenal e pode estar só nos últimos centímetros. Parar no epigástrio deixa passar a maioria.' },
      { passo: 'Meça o diâmetro externo, de parede externa a parede externa, no maior ponto.', detalhe: 'Inclua o trombo mural. Medir só a luz que o Doppler colore subestima o aneurisma em centímetros.' },
      { passo: 'Confirme em corte longitudinal.', detalhe: 'O transverso oblíquo superestima o diâmetro; o longitudinal fora do centro subestima. Os dois juntos corrigem um ao outro.' },
    ],
    estruturas: [
      { slug: 'vertebra', nome: 'Corpo vertebral', original: 'corpus vertebrae', nota: 'O arco brilhante com sombra acústica completa atrás. É o ponto de referência: a aorta está sempre logo à frente dele.', x: 50, y: 76 },
      { slug: 'aorta', nome: 'Aorta abdominal', original: 'aorta abdominalis', nota: 'Círculo de parede espessa e brilhante, pulsátil, que não se deforma com a compressão. Normal até 2 cm; aneurisma a partir de 3 cm.', x: 58, y: 56 },
      { slug: 'cava-aorta', nome: 'Veia cava inferior', original: 'vena cava inferior', nota: 'À direita do paciente (esquerda da tela), oval, de parede fina, achata com a compressão e varia com a respiração. Confundir cava com aorta é o erro clássico do iniciante.', x: 30, y: 60 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Aorta de calibre normal',
        estado: 'normal',
        diagnostico: 'Sem aneurisma de aorta abdominal.',
        achado: 'Aorta circular, de parede brilhante, com diâmetro externo menor que 3 cm em toda a extensão até a bifurcação. Luz anecoica sem trombo mural.',
        leitura: ['Identifique vértebra, aorta e cava.', 'Varra até a bifurcação.', 'Meça o diâmetro externo no maior ponto.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em dor abdominal ou lombar com hipotensão, aorta normal em toda a extensão afasta ruptura de aneurisma como causa.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'aorta-normal' }, alt: 'Aorta abdominal transversa de calibre normal anterior ao corpo vertebral' },
      },
      {
        id: 'aneurisma',
        titulo: 'Aneurisma de aorta abdominal',
        estado: 'alterado',
        diagnostico: 'Dilatação da aorta abdominal acima de 3 cm.',
        achado: 'Aorta com diâmetro externo maior que 3 cm, em geral infrarrenal. Frequentemente com trombo mural em meia-lua, ecogênico, estreitando a luz anecoica. Perde a relação de calibre com a cava.',
        leitura: [
          'Meça de parede externa a parede externa, incluindo o trombo.',
          'Registre o maior diâmetro e a extensão.',
          'Confirme no longitudinal.',
          'Em paciente sintomático, não perca tempo procurando ruptura: o ultrassom raramente a vê. O aneurisma somado à dor ou ao choque já é a resposta.',
        ],
        diferencaDoNormal:
          'A aorta normal é um círculo pequeno, menor que a cava ao lado. No aneurisma ela vira a maior estrutura da tela — e, a partir de 4 a 5 cm, ganha uma camada cinza dentro da parede, o trombo, que faz a luz colorida pelo Doppler parecer enganosamente normal. É por isso que se mede a parede, não a luz.',
        conduta: 'Sintomático (dor abdominal, lombar ou hipotensão) com aneurisma: cirurgia vascular imediatamente, sem esperar tomografia se instável. Assintomático: acima de 5,5 cm (homens) ou 5 cm (mulheres), ou crescimento rápido, indicação de reparo eletivo; entre 3 e 5,5 cm, vigilância seriada e controle dos fatores de risco.',
        diferencial: ['Aorta tortuosa (medida oblíqua)', 'Massa retroperitoneal periaórtica', 'Dissecção de aorta (membrana intimal na luz)', 'Linfonodomegalia para-aórtica'],
        ilustracao: { id: 'ultrassom', params: { cena: 'aneurisma-aorta', diametro: 5.5 }, alt: 'Aorta abdominal dilatada com trombo mural em corte transverso' },
        patologia: 'aneurisma-de-aorta-abdominal',
      },
    ],
    armadilhas: [
      'Gás intestinal esconde a aorta: comprima gradualmente com a sonda para afastar as alças, ou tente a janela lateral pelo flanco.',
      'Confundir cava com aorta: a cava é oval, achata com pressão e varia com a respiração; a aorta é redonda, pulsátil e não deforma.',
      'Medir a luz e não a parede externa subestima o aneurisma com trombo em vários centímetros.',
      'O ultrassom não vê ruptura retroperitoneal na maioria das vezes. Aneurisma mais sintoma é ruptura até prova em contrário.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/aorta',
        oQueProcurar: 'Aneurismas com trombo mural em transverso e longitudinal, e a aorta normal ao lado da cava.',
        licenciada: 'pocus-atlas',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Correlação entre o aneurisma no ultrassom e na angiotomografia, incluindo sinais de ruptura.',
        licenciada: 'radiopaedia',
      },
    ],
    referencias: [
      'Rubano E et al. Systematic review: emergency department bedside ultrasonography for diagnosing suspected abdominal aortic aneurysm. Acad Emerg Med, 2013.',
      'Chaikof EL et al. SVS practice guidelines on the care of patients with an abdominal aortic aneurysm. J Vasc Surg, 2018.',
    ],
  },

  {
    slug: 'vesicula-biliar',
    nome: 'Vesícula e vias biliares',
    protocolo: 'Dor no quadrante superior direito',
    transdutor: 'convexo',
    posicao: 'Hipocôndrio direito, subcostal ou intercostal, marcador para a cabeça. Peça inspiração profunda para o fígado descer e trazer a vesícula até a sonda.',
    pergunta: 'Há cálculo? A parede está espessa? O colédoco está dilatado?',
    profundidade: '12 a 16 cm.',
    comoFazer: [
      { passo: 'Encontre a vesícula: estrutura em pera, anecoica, dentro do fígado.', detalhe: 'Siga a fissura interlobar principal — a linha brilhante que sai da veia porta — até o colo da vesícula. É o atalho quando ela não aparece de imediato.' },
      { passo: 'Varra a vesícula inteira em dois planos, do fundo ao colo.', detalhe: 'O cálculo impactado no colo é o que mais importa e o que mais se perde, porque fica escondido atrás da sombra da parede.' },
      { passo: 'Meça a parede na face anterior, contra o fígado.', detalhe: 'A parede posterior tem reforço acústico e mede errado. Normal até 3 mm.' },
      { passo: 'Pressione a sonda sobre a vesícula e pergunte se dói.', detalhe: 'Murphy ultrassonográfico: a dor máxima exatamente sobre a vesícula visualizada. Mais específico que o Murphy manual.' },
      { passo: 'Procure o colédoco no hilo, à frente da veia porta.', detalhe: 'Doppler colore a porta e não o colédoco — é assim que se separam. Normal até 6 mm.' },
    ],
    estruturas: [
      { slug: 'vesicula', nome: 'Vesícula biliar', original: 'vesica biliaris', nota: 'Anecoica, em pera, com parede fina e reforço acústico atrás. Distendida acima de 4 cm de largura no jejum sugere obstrução do colo.', x: 54, y: 48 },
      { slug: 'parede-vesicular', nome: 'Parede', original: 'tunica muscularis', nota: 'Linha fina e brilhante, até 3 mm. Engrossa com edema na colecistite — e também em hepatite, insuficiência cardíaca e hipoalbuminemia.', x: 40, y: 38 },
      { slug: 'colo', nome: 'Colo e infundíbulo', original: 'collum vesicae biliaris', nota: 'A saída da vesícula, próxima ao hilo. É onde o cálculo impacta e onde a colecistite começa.', x: 80, y: 48 },
      { slug: 'reforco', nome: 'Reforço acústico posterior', nota: 'Faixa mais clara atrás da vesícula. Existe porque o líquido não atenua o som — e é a prova de que a estrutura é cística.', x: 56, y: 82 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Vesícula normal',
        estado: 'normal',
        diagnostico: 'Vesícula sem cálculo, parede fina, colédoco de calibre normal.',
        achado: 'Vesícula anecoica em pera, parede fina (menor que 3 mm), sem cálculo, sem líquido ao redor; reforço acústico posterior. Colédoco até 6 mm à frente da veia porta.',
        leitura: ['Varra do fundo ao colo em dois planos.', 'Meça a parede anterior.', 'Localize o colédoco à frente da porta e meça.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em dor no quadrante superior direito, vesícula normal e sem cálculo desloca a investigação para hepatite, úlcera, pancreatite e causas torácicas.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'vesicula-normal' }, alt: 'Vesícula biliar anecoica de parede fina em corte longitudinal' },
      },
      {
        id: 'colelitiase',
        titulo: 'Colelitíase',
        estado: 'alterado',
        diagnostico: 'Cálculo na vesícula biliar sem sinais de inflamação.',
        achado: 'Um ou mais focos hiperecogênicos na parede dependente da vesícula, com sombra acústica posterior limpa e mobilidade com a mudança de decúbito. Parede fina, sem líquido pericolecístico.',
        leitura: [
          'Confirme os três critérios: brilhante, sombra limpa, móvel.',
          'Mude o paciente de decúbito e veja o cálculo rolar.',
          'Procure especificamente no colo: o cálculo impactado é o que muda a conduta.',
          'Meça a parede e procure líquido ao redor para separar de colecistite.',
        ],
        diferencaDoNormal:
          'A vesícula normal é um saco preto de conteúdo uniforme. O cálculo é o oposto do líquido: reflete quase todo o som — por isso brilha — e não deixa nada passar — por isso a faixa preta atrás dele. Essa sombra, mais que o brilho, é a assinatura da pedra; pólipo brilha sem sombra, lama sombreia mal e se deposita em nível.',
        conduta: 'Com cólica biliar típica: analgesia e colecistectomia eletiva. Cálculo assintomático achado ao acaso não se opera, como regra. Se houver parede espessa, líquido pericolecístico ou Murphy ultrassonográfico, a cena é outra — colecistite.',
        diferencial: ['Pólipo vesicular (sem sombra, sem mobilidade)', 'Lama biliar (sem sombra, nível líquido)', 'Vesícula em porcelana (parede calcificada)', 'Gás na parede (colecistite enfisematosa)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'colelitiase', calculos: 3 }, alt: 'Vesícula com cálculos hiperecogênicos e sombra acústica posterior' },
        patologia: 'colelitiase',
      },
      {
        id: 'colecistite',
        titulo: 'Colecistite aguda',
        estado: 'alterado',
        diagnostico: 'Inflamação aguda da vesícula, quase sempre por cálculo impactado no colo.',
        achado: 'Parede espessada acima de 3 mm, frequentemente em camadas (edema entre duas linhas brilhantes), vesícula distendida, cálculo impactado no colo que não se move, líquido pericolecístico e Murphy ultrassonográfico positivo.',
        leitura: [
          'Meça a parede anterior — acima de 3 mm.',
          'Procure o cálculo no colo e confirme que ele não rola.',
          'Procure a faixa anecoica ao redor da vesícula.',
          'Comprima sobre a vesícula e pergunte pela dor.',
          'Some os achados: parede espessa isolada tem muitas causas; parede espessa mais cálculo impactado mais dor local é colecistite.',
        ],
        diferencaDoNormal:
          'A parede normal é uma linha fina. Na colecistite ela engrossa e ganha uma camada escura no meio — edema — que a divide em duas linhas brilhantes. O cálculo, em vez de rolar pelo fundo, fica preso no colo; a vesícula que não esvazia se distende; e o líquido que vaza aparece como uma faixa preta do lado de fora. Cada um desses sinais é a mesma obstrução vista por um ângulo.',
        conduta: 'Internação, analgesia, antibiótico se sinais sistêmicos, e colecistectomia precoce (idealmente nas primeiras 72 horas). Em paciente sem condição cirúrgica, colecistostomia percutânea. Se o colédoco também estiver dilatado, investigue coledocolitíase antes de operar.',
        diferencial: ['Parede espessa por hepatite, insuficiência cardíaca ou hipoalbuminemia (sem cálculo, sem dor local)', 'Colecistite alitiásica (paciente grave, sem cálculo)', 'Adenomiomatose', 'Carcinoma de vesícula'],
        ilustracao: { id: 'ultrassom', params: { cena: 'colecistite', parede: 6 }, alt: 'Vesícula distendida com parede espessada em camadas, cálculo impactado e líquido pericolecístico' },
        patologia: 'colecistite-aguda',
      },
      {
        id: 'coledoco-dilatado',
        titulo: 'Dilatação do colédoco',
        estado: 'alterado',
        diagnostico: 'Obstrução biliar — coledocolitíase, estenose ou neoplasia periampular.',
        achado: 'Colédoco com diâmetro maior que 6 mm correndo à frente e paralelo à veia porta — o "cano duplo". Sem fluxo ao Doppler, o que o distingue da porta. Vias biliares intra-hepáticas podem estar dilatadas ao lado dos ramos portais.',
        leitura: [
          'Encontre a veia porta no hilo e olhe imediatamente à frente dela.',
          'Ligue o Doppler: o vaso que colore é a porta; o que não colore é o colédoco.',
          'Meça de parede interna a parede interna. Acima de 6 mm é dilatado; some 1 mm por década após os 60 e tolere até 10 mm após colecistectomia.',
          'Procure a causa: cálculo no colédoco distal, massa na cabeça do pâncreas.',
        ],
        diferencaDoNormal:
          'No hilo normal a veia porta é a estrutura grande e o colédoco é um fio quase invisível colado a ela. Dilatado, ele se iguala à porta — dois tubos paralelos do mesmo calibre. É a duplicação que chama a atenção; e o Doppler resolve a dúvida de qual é qual, porque bile não tem fluxo.',
        conduta: 'Sugere obstrução biliar: laboratório (bilirrubinas, fosfatase alcalina, GGT), e imagem para a causa — colangiorressonância ou ecoendoscopia se cálculo, tomografia se suspeita de massa. Com febre e icterícia, é colangite até prova em contrário: antibiótico e drenagem por CPRE.',
        diferencial: ['Dilatação residual pós-colecistectomia', 'Dilatação do idoso sem obstrução', 'Artéria hepática (colore ao Doppler)', 'Cisto de colédoco'],
        ilustracao: { id: 'ultrassom', params: { cena: 'coledoco-dilatado', diametro: 11 }, alt: 'Colédoco dilatado paralelo à veia porta no hilo hepático' },
      },
    ],
    armadilhas: [
      'Vesícula contraída após refeição parece ter parede espessa. Examine em jejum ou interprete com cautela.',
      'Cálculo no colo se esconde atrás da própria sombra. Varra o colo em mais de um plano e mude o decúbito.',
      'Parede espessa isolada não é colecistite: hepatite, insuficiência cardíaca, cirrose e hipoalbuminemia engrossam a parede sem inflamação.',
      'Alça de duodeno com gás encostada na vesícula simula cálculo com sombra. Gás tem sombra "suja", com reverberação; cálculo tem sombra limpa.',
      'Colédoco normal não exclui coledocolitíase em obstrução recente ou intermitente.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/hepatobiliary',
        oQueProcurar: 'Cálculos com sombra, cálculo impactado com parede em camadas, e o cano duplo do colédoco dilatado.',
        licenciada: 'pocus-atlas',
      },
      {
        titulo: 'Radiopaedia',
        url: 'https://radiopaedia.org/',
        oQueProcurar: 'Colecistite aguda com correlação tomográfica, e coledocolitíase na colangiorressonância.',
        licenciada: 'radiopaedia',
      },
    ],
    referencias: [
      'Yokoe M et al. Tokyo Guidelines 2018: diagnostic criteria and severity grading of acute cholecystitis. J Hepatobiliary Pancreat Sci, 2018.',
      'Ross M et al. Emergency physician-performed ultrasound to diagnose cholelithiasis: a systematic review. Acad Emerg Med, 2011.',
    ],
  },

  {
    slug: 'rins',
    nome: 'Rins',
    protocolo: 'Dor lombar / insuficiência renal aguda',
    transdutor: 'convexo',
    posicao: 'Flanco, linha axilar posterior, plano longitudinal coronal, marcador para a cabeça. À direita use o fígado como janela; à esquerda, o baço — e a sonda vai mais posterior e mais alta do que se imagina.',
    pergunta: 'O sistema coletor está dilatado?',
    profundidade: '14 a 18 cm.',
    comoFazer: [
      { passo: 'Encontre o rim em corte longitudinal, com os polos superior e inferior no mesmo plano.', detalhe: 'O rim tem 10 a 12 cm; se parecer menor, o corte é oblíquo. Balance a sonda até o comprimento máximo.' },
      { passo: 'Identifique córtex e seio renal.', detalhe: 'Córtex cinza, um pouco mais escuro que o fígado; seio central brilhante — gordura e vasos. As pirâmides são triângulos escuros no córtex, e enganam o iniciante como se fossem cálices dilatados.' },
      { passo: 'Procure líquido anecoico dentro do seio.', detalhe: 'O sinal da hidronefrose é preto onde deveria ser branco: pelve e cálices cheios de urina no meio do seio ecogênico.' },
      { passo: 'Compare com o rim contralateral e olhe a bexiga.', detalhe: 'Hidronefrose bilateral com bexiga cheia é retenção, não obstrução ureteral — e a conduta é uma sonda vesical, não um cateter duplo J.' },
    ],
    estruturas: [
      { slug: 'cortex', nome: 'Córtex renal', original: 'cortex renalis', nota: 'A casca cinza-escura do rim, um pouco menos ecogênica que o fígado. Afina na obstrução crônica e fica mais brilhante na doença renal crônica.', x: 50, y: 42 },
      { slug: 'seio', nome: 'Seio renal', original: 'sinus renalis', nota: 'O miolo brilhante: gordura, vasos e o sistema coletor colabado. Só ele não tem líquido no rim normal.', x: 50, y: 60 },
      { slug: 'piramides', nome: 'Pirâmides medulares', original: 'pyramides renales', nota: 'Triângulos hipoecoicos no córtex, apontando para o seio. São a armadilha número um: parecem cálices dilatados, mas não se comunicam com a pelve.', x: 28, y: 50 },
      { slug: 'figado-rim', nome: 'Fígado', original: 'hepar', nota: 'A janela acústica do rim direito. Serve de referência de ecogenicidade: córtex mais brilhante que o fígado é doença renal crônica.', x: 50, y: 12 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Rim sem dilatação',
        estado: 'normal',
        diagnostico: 'Sistema coletor colabado.',
        achado: 'Rim de 10 a 12 cm com córtex homogêneo, um pouco menos ecogênico que o fígado, pirâmides hipoecoicas e seio renal central hiperecogênico sem qualquer área anecoica.',
        leitura: ['Obtenha o comprimento máximo.', 'Confira que o seio é todo brilhante.', 'Não confunda pirâmides com cálices.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em cólica renal, ausência de hidronefrose não exclui cálculo — mas cálculo sem dilatação raramente precisa de intervenção urgente.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'rim-normal' }, alt: 'Rim em corte longitudinal com seio renal hiperecogênico e sem dilatação' },
      },
      {
        id: 'hidronefrose',
        titulo: 'Hidronefrose',
        estado: 'alterado',
        diagnostico: 'Dilatação do sistema coletor por obstrução ao fluxo urinário.',
        achado: 'Áreas anecoicas dentro do seio renal, comunicantes entre si, formando um padrão ramificado: pelve dilatada (leve), cálices arredondados (moderada), rim transformado em bolsas com o córtex afinado (grave).',
        leitura: [
          'Confirme que o líquido está no seio, e não no córtex.',
          'Veja se as áreas escuras se comunicam — cálices dilatados desembocam na pelve; cistos não.',
          'Gradue: leve, moderada ou grave, pelo quanto o seio foi substituído e pelo estado do córtex.',
          'Olhe a bexiga e o outro rim antes de concluir onde está a obstrução.',
        ],
        diferencaDoNormal:
          'No rim normal o centro é a parte mais brilhante da imagem. Na hidronefrose o centro escurece de dentro para fora: primeiro a pelve, depois os cálices, que se abrem em ramos pretos onde antes havia só gordura branca. O córtex é o último a ceder — quando afina, a obstrução já é antiga.',
        conduta: 'Com cólica renal e função normal: analgesia, hidratação, e decisão sobre o cálculo pelo tamanho e pela posição. Com febre (pielonefrite obstrutiva), rim único ou insuficiência renal aguda: desobstrução urgente — cateter duplo J ou nefrostomia — porque o rim obstruído e infectado é uma sepse em curso. Bilateral com bexiga distendida: sonda vesical.',
        diferencial: ['Cistos parapiélicos (não se comunicam)', 'Pelve extrarrenal (variante normal)', 'Bexiga cheia com refluxo (esvazie e repita)', 'Diurese forçada ou gestação (dilatação fisiológica leve)', 'Pirâmides proeminentes no jovem'],
        ilustracao: { id: 'ultrassom', params: { cena: 'hidronefrose', grau: 3 }, alt: 'Rim com pelve e cálices anecoicos dilatados em padrão ramificado' },
      },
    ],
    armadilhas: [
      'Pirâmides medulares proeminentes, sobretudo em jovens e crianças, simulam cálices dilatados. Cálice se comunica com a pelve; pirâmide não.',
      'Bexiga cheia produz dilatação leve bilateral. Esvazie e repita antes de chamar de hidronefrose.',
      'Ausência de hidronefrose não exclui cálculo ureteral, em especial nas primeiras horas e no paciente desidratado.',
      'Cisto parapiélico é a sósia mais fiel da hidronefrose leve. Em dúvida, tomografia.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/renal',
        oQueProcurar: 'Hidronefrose leve, moderada e grave lado a lado, e as armadilhas — pirâmides e cistos parapiélicos.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Smith-Bindman R et al. Ultrasonography versus computed tomography for suspected nephrolithiasis. N Engl J Med, 2014.',
      'Onen A. Grading of hydronephrosis: an ongoing challenge. Front Pediatr, 2020.',
    ],
  },

  {
    slug: 'bexiga',
    nome: 'Bexiga',
    protocolo: 'Retenção urinária / volume vesical',
    transdutor: 'convexo',
    posicao: 'Suprapúbico, logo acima da sínfise, sonda angulada para baixo em direção à pelve. Transverso com marcador para a direita; longitudinal com marcador para a cabeça.',
    pergunta: 'A bexiga está cheia — e quanto?',
    profundidade: '10 a 15 cm.',
    comoFazer: [
      { passo: 'Encoste acima do púbis e aponte a sonda para os pés.', detalhe: 'A bexiga fica atrás da sínfise; apontar reto para dentro encontra osso. A angulação caudal é o que abre a janela.' },
      { passo: 'Meça largura e altura no transverso e profundidade no longitudinal.', detalhe: 'Volume ≈ largura × altura × profundidade × 0,52. A maioria dos aparelhos calcula; o que importa é a ordem de grandeza.' },
      { passo: 'Olhe o conteúdo e a parede.', detalhe: 'Urina é anecoica. Ecos internos são coágulo, pus ou sedimento; parede espessa e trabeculada fala por obstrução crônica.' },
      { passo: 'Suba para os rins se o volume for grande.', detalhe: 'Retenção importante dilata os ureteres e os rins. É a hidronefrose bilateral que se resolve com uma sonda.' },
    ],
    estruturas: [
      { slug: 'bexiga-lumen', nome: 'Bexiga', original: 'vesica urinaria', nota: 'Estrutura anecoica na linha média, arredondada quando pouco cheia e quadrangular quando sob tensão. É a janela para tudo o que fica atrás dela.', x: 50, y: 42 },
      { slug: 'parede-vesical', nome: 'Parede vesical', original: 'tunica muscularis vesicae', nota: 'Linha fina e brilhante; até 3 mm quando distendida. Espessa e irregular é bexiga de esforço ou tumor.', x: 30, y: 30 },
      { slug: 'reforco-vesical', nome: 'Reforço acústico posterior', nota: 'A faixa clara atrás da bexiga. É o que torna a bexiga cheia uma janela ideal para o útero e a próstata.', x: 50, y: 78 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Bexiga pouco cheia',
        estado: 'normal',
        diagnostico: 'Volume vesical fisiológico.',
        achado: 'Bexiga anecoica, de contorno arredondado, com parede fina e volume estimado abaixo de 300 mL. Sem ecos internos. Rins sem dilatação.',
        leitura: ['Angule para a pelve.', 'Meça nos dois planos.', 'Confira conteúdo e parede.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em anúria ou oligúria com bexiga vazia, o problema é antes da bexiga — renal ou pré-renal, não obstrutivo.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'bexiga-normal' }, alt: 'Bexiga anecoica pouco cheia em corte transverso suprapúbico' },
      },
      {
        id: 'retencao',
        titulo: 'Retenção urinária',
        estado: 'alterado',
        diagnostico: 'Bexiga distendida por incapacidade de esvaziar.',
        achado: 'Bexiga muito distendida, de contorno quadrangular sob tensão, ocupando a pelve e subindo em direção ao umbigo, com volume estimado acima de 400 a 500 mL. Rins podem mostrar hidronefrose bilateral.',
        leitura: [
          'Estime o volume — a bexiga que sai do campo da sonda já passa de 500 mL.',
          'Procure a causa na própria imagem: próstata protruindo no assoalho, coágulo, cálculo.',
          'Suba aos rins.',
          'Depois de sondar, meça o resíduo — se pouco saiu, a sonda pode estar fora da bexiga.',
        ],
        diferencaDoNormal:
          'A bexiga pouco cheia é uma sombra redonda e discreta atrás do púbis. Cheia sob tensão, ela perde a curvatura — as paredes ficam retas e os cantos, quadrados — e vira a maior estrutura do abdome inferior. É o mesmo globo que a mão sente maciço e doloroso acima do púbis.',
        conduta: 'Cateterismo vesical de alívio, com esvaziamento gradual se o volume for muito grande. Investigue a causa: hiperplasia prostática, medicamento anticolinérgico, bexiga neurogênica, coágulo, cálculo. Se houver hidronefrose bilateral, reavalie a função renal após o alívio — a poliúria pós-obstrutiva pode desidratar.',
        diferencial: ['Cisto ovariano volumoso (não é medial nem se comunica com a uretra)', 'Ascite loculada', 'Útero gravídico (sólido, com feto)', 'Linfocele pós-operatória'],
        ilustracao: { id: 'ultrassom', params: { cena: 'retencao-urinaria', volume: 800 }, alt: 'Bexiga muito distendida, de contorno quadrangular, em corte transverso' },
      },
    ],
    armadilhas: [
      'Ascite na pelve parece bexiga. Bexiga tem parede própria e é medial; ascite contorna as alças e não tem parede.',
      'Cisto ovariano ou linfocele simulam bexiga distendida. Procure a bexiga verdadeira separada da coleção.',
      'Volume estimado erra em até 20%; não decida por 50 mL de diferença.',
      'Sonda vesical que não drena com bexiga cheia ao ultrassom está fora da bexiga ou obstruída — o exame resolve a dúvida em segundos.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/renal',
        oQueProcurar: 'Bexiga distendida com hidronefrose bilateral, e a estimativa de volume passo a passo.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Daurat A et al. Diagnosis of postoperative urinary retention using a simplified ultrasound bladder measurement. Anesth Analg, 2015.',
      'Cardiovascular and Renal Ultrasound — ACEP Emergency Ultrasound Guidelines, 2023.',
    ],
  },

  {
    slug: 'veias-profundas',
    nome: 'Veias profundas do membro inferior',
    protocolo: 'Compressão em dois pontos / suspeita de TVP',
    transdutor: 'linear',
    posicao: 'Transverso sobre a veia femoral comum, logo abaixo do ligamento inguinal, marcador para a direita do paciente; depois na fossa poplítea, com o joelho fletido. Cada ponto é comprimido a cada 1 a 2 cm.',
    pergunta: 'A veia colaba quando comprimida?',
    profundidade: '4 a 6 cm.',
    comoFazer: [
      { passo: 'Encontre o par artéria-veia na virilha.', detalhe: 'Artéria lateral, redonda, pulsátil, de parede espessa. Veia medial, maior, oval, de parede fina, que aumenta com a manobra de Valsalva.' },
      { passo: 'Comprima com a sonda até as paredes da veia se tocarem.', detalhe: 'A pressão certa é a que fecha a veia antes de deformar a artéria. Se a artéria deforma e a veia não fecha, há trombo.' },
      { passo: 'Siga a femoral comum até a bifurcação em femoral e femoral profunda, comprimindo a cada 1 a 2 cm.', detalhe: 'A junção com a safena magna e a bifurcação são os pontos de maior rendimento na coxa.' },
      { passo: 'Repita na poplítea, incluindo a trifurcação.', detalhe: 'A veia poplítea fica **por cima** da artéria na tela quando se examina por trás do joelho — o contrário da virilha.' },
    ],
    estruturas: [
      { slug: 'arteria-femoral', nome: 'Artéria femoral comum', original: 'arteria femoralis', nota: 'Lateral, circular, pulsátil, de parede espessa e brilhante. Não deforma com a compressão que fecha a veia — é a referência de pressão.', x: 16, y: 44 },
      { slug: 'veia-femoral', nome: 'Veia femoral comum', original: 'vena femoralis', nota: 'Medial à artéria, maior e oval, de parede fina. Colaba por completo com compressão leve quando está livre.', x: 32, y: 44 },
      { slug: 'compressao', nome: 'Metade comprimida', nota: 'A imagem à direita da linha tracejada mostra o mesmo ponto sob compressão. É nessa metade que a resposta está.', x: 75, y: 44 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Veia compressível',
        estado: 'normal',
        diagnostico: 'Sem trombose venosa profunda nos pontos examinados.',
        achado: 'Veia femoral comum e poplítea de luz anecoica, que colabam por completo — parede contra parede — com compressão leve, antes de a artéria ao lado deformar.',
        leitura: ['Identifique artéria e veia.', 'Comprima até a veia sumir.', 'Repita a cada 1 a 2 cm nos dois pontos.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma pelo exame. Com probabilidade clínica alta, repita em uma semana ou complete com exame de toda a perna — a compressão em dois pontos não vê a veia femoral no meio da coxa nem as veias da panturrilha.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'veia-normal' }, alt: 'Veia femoral comum ao lado da artéria, colabando por completo sob compressão' },
      },
      {
        id: 'tvp',
        titulo: 'Trombose venosa profunda',
        estado: 'alterado',
        diagnostico: 'Trombo ocupando a luz da veia femoral ou poplítea.',
        achado: 'Veia que não colaba com a compressão, mantendo a luz aberta enquanto a artéria ao lado já deforma. A veia costuma estar distendida, maior que a artéria, e o trombo pode aparecer como material ecogênico na luz — ou ser quase anecoico nos primeiros dias, invisível sem a compressão.',
        leitura: [
          'Comprima até a artéria deformar: se a veia continua aberta, é trombo.',
          'Não confie no que vê dentro da veia — trombo recente é da cor da urina.',
          'Registre o ponto e a extensão.',
          'Não comprima com força sobre um trombo flutuante mais que o necessário para o diagnóstico.',
        ],
        diferencaDoNormal:
          'A veia normal é uma bolha que estoura sob o dedo: aperta, some. A veia trombosada é um tubo cheio — aperta e ela fica lá, redonda, enquanto a artéria vizinha, que tem parede muito mais grossa, já se deforma. É a **resistência à compressão**, e não a imagem do coágulo, que faz o diagnóstico; o coágulo em si pode ser invisível.',
        conduta: 'Anticoagulação imediata conforme o contexto clínico (risco de sangramento, função renal, gestação). Em dispneia ou hipotensão associadas, o achado somado à clínica sustenta embolia pulmonar sem necessidade de angiotomografia para iniciar o tratamento. Investigue trombofilia ou neoplasia oculta conforme a idade e a ausência de fator provocador.',
        diferencial: ['Linfonodo inguinal (redondo, com hilo ecogênico, não segue o vaso)', 'Cisto de Baker roto (poplíteo, fora da veia)', 'Hematoma muscular', 'Trombose superficial da safena (pode se estender à femoral — registre a distância da junção)', 'Trombo crônico recanalizado (parede espessa, luz parcial)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'tvp', compressibilidade: 10 }, alt: 'Veia femoral que não colaba sob compressão, com trombo ecogênico na luz' },
        patologia: 'trombose-venosa-profunda',
      },
    ],
    armadilhas: [
      'Compressão insuficiente cria falso positivo. Aperte até a artéria começar a deformar; se ela deforma e a veia fecha, está livre.',
      'Compressão excessiva ou oblíqua fecha veia trombosada de forma parcial e cria falso negativo. Mantenha a sonda perpendicular.',
      'O exame de dois pontos não vê a femoral no meio da coxa nem as veias da panturrilha. Probabilidade alta com exame negativo pede exame completo ou repetição em 5 a 7 dias.',
      'Linfonodo inguinal não colaba e engana. Ele é redondo em todos os planos e tem hilo brilhante; a veia é um tubo que continua para cima e para baixo.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/dvt',
        oQueProcurar: 'Clipes com e sem compressão de veia livre e trombosada, incluindo trombo anecoico recente.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Bernardi E et al. Serial 2-point ultrasonography plus D-dimer vs whole-leg color and duplex ultrasonography for diagnosing suspected symptomatic deep vein thrombosis. JAMA, 2008.',
      'Pomero F et al. Accuracy of emergency physician-performed ultrasonography in the diagnosis of deep-vein thrombosis: a systematic review and meta-analysis. Thromb Haemost, 2013.',
    ],
  },

  {
    slug: 'partes-moles',
    nome: 'Partes moles',
    protocolo: 'Celulite versus abscesso',
    transdutor: 'linear',
    posicao: 'Diretamente sobre a área de eritema ou flutuação, em dois planos perpendiculares, com gel abundante e pressão mínima. Compare com a pele sã contralateral.',
    pergunta: 'Há coleção drenável embaixo disso?',
    profundidade: '3 a 5 cm.',
    comoFazer: [
      { passo: 'Comece pela pele normal ao lado e reconheça as camadas.', detalhe: 'Pele brilhante, subcutâneo cinza com lóbulos de gordura, fáscia como linha branca, músculo estriado embaixo. É contra isso que a lesão se compara.' },
      { passo: 'Deslize para o centro da lesão e procure a cavidade.', detalhe: 'Coleção é uma área mais escura, irregular, com ecos internos e uma faixa mais clara atrás dela — o reforço.' },
      { passo: 'Comprima de leve sobre a área e veja se o conteúdo se move.', detalhe: 'O redemoinho de ecos sob compressão é líquido — pus. Tecido inflamado não roda.' },
      { passo: 'Meça a coleção e a profundidade da pele até ela.', detalhe: 'É o que decide o instrumento, a anestesia e se dá para drenar à beira do leito ou precisa de sala.' },
    ],
    estruturas: [
      { slug: 'pele', nome: 'Pele', original: 'cutis', nota: 'A linha brilhante mais superficial, fina e uniforme. Espessa-se com edema na celulite.', x: 50, y: 4 },
      { slug: 'subcutaneo', nome: 'Subcutâneo', original: 'tela subcutanea', nota: 'Lóbulos de gordura cinza. Na celulite as fendas entre eles se enchem de líquido — o "calçamento de pedras" (cobblestoning). Sem cavidade, não é abscesso.', x: 50, y: 22 },
      { slug: 'fascia', nome: 'Fáscia', original: 'fascia', nota: 'Linha branca contínua entre subcutâneo e músculo. Líquido correndo ao longo dela, com gás, é o alarme de fasciíte necrosante.', x: 50, y: 40 },
      { slug: 'musculo', nome: 'Músculo', original: 'musculus', nota: 'Padrão estriado, em penas, abaixo da fáscia. Coleção dentro dele é abscesso muscular — outra profundidade, outra drenagem.', x: 50, y: 60 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Partes moles normais',
        estado: 'normal',
        diagnostico: 'Sem coleção; camadas preservadas.',
        achado: 'Pele fina e brilhante, subcutâneo homogêneo com lóbulos de gordura bem definidos e sem líquido entre eles, fáscia contínua, músculo estriado. Sem área hipoecoica, sem reforço posterior anômalo.',
        leitura: ['Reconheça as quatro camadas.', 'Compare com o lado contralateral.', 'Confirme a ausência de cavidade em dois planos.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em eritema sem coleção, o tratamento é antibiótico — não bisturi.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'partes-moles-normal' }, alt: 'Partes moles normais com pele, subcutâneo, fáscia e músculo em camadas' },
      },
      {
        id: 'abscesso',
        titulo: 'Abscesso cutâneo',
        estado: 'alterado',
        diagnostico: 'Coleção purulenta drenável no subcutâneo.',
        achado: 'Cavidade hipoecoica ou anecoica, de contorno irregular, com ecos internos que se movem sob compressão, reforço acústico posterior e halo de subcutâneo edemaciado ao redor. Frequentemente cobblestoning na periferia.',
        leitura: [
          'Confirme a cavidade em dois planos.',
          'Comprima e veja o conteúdo rodar.',
          'Meça diâmetro e profundidade.',
          'Procure gás (pontos brilhantes com sombra suja) e líquido ao longo da fáscia — mudam a urgência.',
        ],
        diferencaDoNormal:
          'A celulite muda a textura do subcutâneo sem criar espaço: os lóbulos de gordura ficam separados por fendas de líquido, mas continuam lá. O abscesso é um buraco — uma área onde o tecido foi substituído por líquido com detritos, e que por isso deixa passar mais som e clareia o que está atrás. A diferença entre os dois é a diferença entre antibiótico e drenagem, e o exame clínico erra essa diferença em um de cada quatro casos.',
        conduta: 'Incisão e drenagem, guiada pela medida e pela profundidade; cultura se recorrente ou em imunossuprimido. Antibiótico associado quando há celulite extensa, sinais sistêmicos, imunossupressão ou localização de risco. Coleção profunda, próxima a vasos ou em face e mãos: drenagem em ambiente cirúrgico.',
        diferencial: ['Celulite sem coleção (cobblestoning sem cavidade)', 'Linfonodo inflamado (forma de rim, hilo brilhante, fluxo ao Doppler)', 'Cisto epidérmico infectado', 'Hematoma', 'Fasciíte necrosante (líquido e gás ao longo da fáscia — emergência cirúrgica)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'abscesso', diametro: 4 }, alt: 'Coleção hipoecoica irregular no subcutâneo com ecos internos e reforço posterior' },
      },
      {
        id: 'drenagem-guiada',
        titulo: 'Drenagem de coleção guiada',
        estado: 'alterado',
        diagnostico: 'Procedimento: agulha ou dreno dentro da coleção sob visão direta.',
        achado:
          'Agulha hiperecogênica atravessando o subcutâneo em plano com o feixe, com artefato de reverberação atrás dela, e a ponta — o ponto mais brilhante — dentro da coleção hipoecoica. Ao aspirar, a coleção diminui em tempo real.',
        leitura: [
          'Escolha o trajeto mais curto que evite vasos e nervos, e confirme com Doppler.',
          'Mantenha a agulha inteira no plano do feixe: se só a ponta some, é a ponta que está fora do plano.',
          'Confirme a ponta dentro da coleção antes de aspirar.',
          'Veja a cavidade colabar — é a prova de que drenou.',
        ],
        diferencaDoNormal:
          'A diferença aqui não é entre normal e doente: é entre cego e guiado. Sem imagem, a agulha vai onde a mão acha que a coleção está; com imagem, vai onde ela está — e o operador vê, ao mesmo tempo, o que não deve furar. A taxa de sucesso sobe e a de complicação cai porque a hipótese virou observação.',
        conduta:
          'Antissepsia, anestesia local ao longo do trajeto, agulha ou dreno conforme a viscosidade e o tamanho; cultura do material. Coleção profunda, próxima a vasos, no pescoço ou com septos: radiologia intervencionista ou cirurgia. Reavaliar em 24 a 48 horas se persistir febre.',
        diferencial: ['Coleção não drenável (flegmão, hematoma organizado)', 'Estrutura vascular confundida com coleção (Doppler antes de furar)', 'Linfonodo necrótico', 'Cisto'],
        ilustracao: { id: 'ultrassom', params: { cena: 'drenagem-guiada', profundidade: 3 }, alt: 'Agulha hiperecogênica em plano com a ponta dentro de uma coleção subcutânea' },
      },
    ],
    armadilhas: [
      'Abscesso muito espesso pode ser isoecoico ao tecido ao redor e passar despercebido. A compressão que faz o conteúdo rodar é o que o revela.',
      'Linfonodo inguinal ou cervical inflamado parece abscesso. Ele tem forma de rim, hilo brilhante e fluxo central ao Doppler; o abscesso não tem fluxo dentro.',
      'Pressão excessiva com a sonda esvazia a coleção para fora do campo e apaga o diagnóstico. Use gel em excesso e mão leve.',
      'Gás no subcutâneo e líquido ao longo da fáscia não são abscesso: são fasciíte necrosante até prova em contrário, e o tratamento é o centro cirúrgico agora.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/softtissuemsk',
        oQueProcurar: 'Abscesso com ecos rodando sob compressão, cobblestoning da celulite, e os sinais de alarme da fasciíte.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Subramaniam S et al. Point-of-care ultrasound for diagnosis of abscess in skin and soft tissue infections. Acad Emerg Med, 2016.',
      'Stevens DL et al. IDSA practice guidelines for the diagnosis and management of skin and soft tissue infections. Clin Infect Dis, 2014.',
    ],
  },

  {
    slug: 'apical-quatro-camaras',
    nome: 'Coração — apical quatro câmaras',
    protocolo: 'Ecocardiografia focada / RUSH',
    transdutor: 'setorial',
    posicao: 'Ápice cardíaco (ictus, em geral quinto espaço intercostal na linha hemiclavicular ou axilar anterior), marcador para a esquerda do paciente, sonda apontada para o ombro direito. Decúbito lateral esquerdo ajuda.',
    pergunta: 'As quatro câmaras têm tamanho proporcional — e alguma está sendo esmagada?',
    profundidade: '14 a 18 cm.',
    comoFazer: [
      { passo: 'Encontre o ictus com a mão antes de encostar a sonda.', detalhe: 'A janela apical é a mais dependente de posição: um espaço acima ou abaixo mostra um corte oblíquo que distorce os tamanhos.' },
      { passo: 'Ajuste até ver as quatro câmaras com o septo vertical e os dois anéis valvares no mesmo plano.', detalhe: 'O ápice fica no topo da tela; ventrículos em cima, átrios embaixo; o coração direito à esquerda da tela.' },
      { passo: 'Compare o VD com o VE e olhe os átrios ao longo do ciclo.', detalhe: 'O VD normal tem até dois terços do VE. O átrio direito que invagina durante mais de um terço do ciclo é sinal de tamponamento.' },
      { passo: 'Estime o enchimento: as paredes do VE se tocam na sístole?', detalhe: 'Cavidade que oblitera é hipovolemia ou vasoplegia — não é o mesmo que função boa.' },
    ],
    estruturas: [
      { slug: 've-apical', nome: 'Ventrículo esquerdo', original: 'ventriculus sinister', nota: 'À direita da tela, em cima. Elíptico, de parede espessa; a área diastólica ao nível dos papilares é a medida do enchimento.', x: 62, y: 40 },
      { slug: 'vd-apical', nome: 'Ventrículo direito', original: 'ventriculus dexter', nota: 'À esquerda da tela, triangular, com a banda moderadora. Menor que o VE; igual ou maior é sobrecarga.', x: 38, y: 38 },
      { slug: 'ad-apical', nome: 'Átrio direito', original: 'atrium dextrum', nota: 'Embaixo, à esquerda. É a câmara de menor pressão — a primeira a colabar quando o pericárdio aperta.', x: 62, y: 72 },
      { slug: 'ae-apical', nome: 'Átrio esquerdo', original: 'atrium sinistrum', nota: 'Embaixo, à direita. Aumentado na insuficiência cardíaca crônica e na fibrilação atrial.', x: 38, y: 72 },
      { slug: 'pericardio-apical', nome: 'Pericárdio', original: 'pericardium', nota: 'A linha brilhante que contorna o coração. O derrame é a faixa preta entre ela e o miocárdio; mede-se na diástole.', x: 22, y: 30 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Quatro câmaras normais',
        estado: 'normal',
        diagnostico: 'Câmaras proporcionais, sem derrame, enchimento adequado.',
        achado: 'VD com até dois terços do VE, átrios de tamanho semelhante entre si, septo reto, valvas abrindo e fechando, sem faixa anecoica ao redor do coração. O VE encolhe pela metade na sístole sem obliterar.',
        leitura: ['Confira o plano pelos dois anéis valvares.', 'Compare VD e VE.', 'Olhe os átrios ao longo do ciclo.', 'Veja o pericárdio em toda a volta.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma. Em choque, quatro câmaras normais afastam tamponamento, cor pulmonale agudo e falência de bomba — o problema está fora do coração.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'apical-normal' }, alt: 'Apical de quatro câmaras normal com ventrículos e átrios proporcionais' },
      },
      {
        id: 'derrame-sem-tamponamento',
        titulo: 'Derrame pericárdico sem tamponamento',
        estado: 'alterado',
        diagnostico: 'Líquido no pericárdio sem repercussão hemodinâmica.',
        achado:
          'Faixa anecoica circundando o coração, medida na diástole: pequena (< 10 mm), moderada (10 a 20 mm) ou grande (> 20 mm). Câmaras direitas de contorno preservado ao longo de todo o ciclo, veia cava com variação respiratória normal, sem oscilação exagerada do coração.',
        leitura: [
          'Meça a lâmina na diástole, no ponto mais espesso.',
          'Confirme que circunda o coração — líquido só anterior pode ser gordura epicárdica.',
          'Olhe o átrio e o ventrículo direitos por vários ciclos: sem invaginação, sem tamponamento.',
          'Confira a cava: colapsando normalmente, a pressão pericárdica ainda não venceu.',
        ],
        diferencaDoNormal:
          'O pericárdio normal tem uma película de líquido invisível ao ultrassom. Aqui ela virou uma faixa preta ao redor do coração — mas as câmaras continuam com o formato de sempre, porque o saco pericárdico se distendeu devagar e acomodou o volume. É a velocidade, não a quantidade, que decide o tamponamento: um litro em meses não aperta; cem mililitros em minutos apertam.',
        conduta:
          'Investigar a causa (infecção viral, uremia, neoplasia, hipotireoidismo, autoimune, pós-infarto) e tratar; anti-inflamatório e colchicina na pericardite. Vigilância ecocardiográfica: derrame grande ou que cresce merece reavaliação em dias. Pericardiocentese só se houver repercussão, suspeita de pus ou necessidade diagnóstica.',
        diferencial: ['Gordura epicárdica (anterior, ecogênica, move-se com o coração)', 'Derrame pleural esquerdo (passa por trás da aorta descendente; o pericárdico passa pela frente)', 'Ascite junto ao coração na janela subxifoide', 'Cisto pericárdico'],
        ilustracao: { id: 'ultrassom', params: { cena: 'apical-derrame', derrame: 15 }, alt: 'Faixa anecoica circundando o coração sem deformar as câmaras direitas' },
      },
      {
        id: 'colapso-atrio-direito',
        titulo: 'Colapso de átrio direito',
        estado: 'alterado',
        diagnostico: 'Tamponamento cardíaco — a pressão pericárdica venceu a da câmara de menor pressão.',
        achado:
          'Derrame com a parede livre do átrio direito invaginando para dentro da cavidade no final da diástole e começo da sístole ventricular, por mais de um terço do ciclo cardíaco. Costuma vir com colapso diastólico do VD, cava plectórica sem variação e coração oscilando dentro do líquido. Taquicardia, hipotensão, pulso paradoxal.',
        leitura: [
          'Congele o ciclo e conte: invaginação atrial que dura mais de um terço do ciclo é específica.',
          'Procure o colapso diastólico do VD — mais específico ainda.',
          'Olhe a cava: plectórica e fixa fecha o quadro.',
          'Não espere o coração oscilar para agir; o colapso vem antes.',
        ],
        diferencaDoNormal:
          'O átrio direito é a câmara de pressão mais baixa do coração — três, cinco milímetros de mercúrio. Quando o pericárdio se enche depressa, a pressão dentro dele passa a desse valor primeiro, e a parede do átrio, que é fina, afunda para dentro no momento em que ele está mais vazio. É a mesma faixa preta do derrame sem tamponamento; o que mudou é que agora ela empurra.',
        conduta:
          'Tamponamento é diagnóstico clínico-ecocardiográfico: derrame com colapso de câmara e paciente instável. Pericardiocentese guiada por ultrassom, de urgência; volume endovenoso enquanto se prepara; evitar ventilação com pressão positiva e vasodilatador. Tamponamento por dissecção ou trauma: cirurgia, não agulha.',
        diferencial: ['Derrame grande sem tamponamento (sem colapso)', 'Pericardite constritiva', 'Hipovolemia grave com átrio pequeno (sem derrame)', 'Cor pulmonale agudo (VD dilatado, não colabado)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'apical-colapso-atrial', colapso: 40 }, alt: 'Derrame pericárdico com a parede do átrio direito invaginando para dentro da câmara' },
        patologia: 'tamponamento-cardiaco',
      },
      {
        id: 'hipovolemia',
        titulo: 'Hipovolemia com cavidades pequenas',
        estado: 'alterado',
        diagnostico: 'Volume circulante baixo — o coração bombeia bem um sangue que não existe.',
        achado:
          'Ventrículos pequenos, hiperdinâmicos, com as paredes do VE quase se tocando ou se tocando na sístole ("beijo dos papilares"); área diastólica do VE reduzida; átrios pequenos; sem derrame. Cava fina e colabada.',
        leitura: [
          'Veja a sístole: paredes que se tocam é o sinal.',
          'Estime a área diastólica do VE — abaixo de 10 cm² no adulto é cavidade pequena.',
          'Confirme com a cava colabada e o pulmão seco.',
          'Diferencie de vasoplegia: a imagem é igual; a resposta ao volume e o contexto separam.',
        ],
        diferencaDoNormal:
          'O ventrículo normal se enche até uma área confortável e ejeta metade. Sem volume para enchê-lo, ele parte de uma cavidade pequena e a esvazia inteira — a fração de ejeção parece excelente, e é justamente o excesso de eficiência que denuncia o vazio. Contração vigorosa com cavidade vazia é o coração pedindo sangue.',
        conduta:
          'Volume, guiado pela resposta: reavaliar a cava, o pulmão e o VE após cada alíquota. Em choque, cavidades pequenas e hiperdinâmicas apontam hipovolemia (hemorragia, desidratação) ou vasoplegia (sepse, anafilaxia) — procurar a fonte de perda e tratar a causa. Vasopressor quando o volume foi reposto e a pressão não sobe.',
        diferencial: ['Sepse com vasoplegia (mesma imagem, cava variável)', 'Cardiomiopatia hipertrófica com obstrução (paredes espessas)', 'Anemia grave', 'Taquicardia extrema encurtando o enchimento'],
        ilustracao: { id: 'ultrassom', params: { cena: 'apical-hipovolemia', area: 8 }, alt: 'Ventrículos pequenos e hiperdinâmicos com paredes do VE quase se tocando' },
        patologia: 'choque-hipovolemico',
      },
    ],
    armadilhas: [
      'Corte oblíquo faz o VD parecer maior ou menor. Confirme o plano pelos dois anéis valvares.',
      'Gordura epicárdica anterior simula derrame: é ecogênica, não circunda o coração e se move com ele.',
      'Derrame grande sem colapso não é tamponamento; derrame pequeno com colapso pode ser.',
      'Cavidade pequena hiperdinâmica não é "função ótima": é hipovolemia ou vasoplegia até prova em contrário.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/echocardiography',
        oQueProcurar: 'Apical de quatro câmaras normal, derrames com e sem colapso de câmaras, e o VE hiperdinâmico da hipovolemia.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Klein AL et al. ASE Recommendations for Multimodality Cardiovascular Imaging of Patients with Pericardial Disease. J Am Soc Echocardiogr, 2013.',
      'Perera P et al. The RUSH exam. Emerg Med Clin North Am, 2010.',
    ],
  },

  {
    slug: 'fast-pelve',
    nome: 'FAST — pelve',
    protocolo: 'FAST / eFAST',
    transdutor: 'convexo',
    posicao: 'Suprapúbico, transverso e sagital, com a bexiga cheia como janela. Se a bexiga está vazia, a janela some — pinçar a sonda vesical ajuda.',
    pergunta: 'Há líquido livre atrás ou ao lado da bexiga?',
    profundidade: '12 a 16 cm.',
    comoFazer: [
      { passo: 'Encoste acima do púbis e angule para a pelve.', detalhe: 'A bexiga cheia é a janela; sem ela, o gás das alças esconde tudo.' },
      { passo: 'Varra em transverso e em sagital.', detalhe: 'O líquido se acumula no fundo de saco (atrás do útero na mulher, atrás da bexiga no homem) e nos lados da bexiga.' },
      { passo: 'Procure a faixa anecoica de bordas angulares.', detalhe: 'Líquido livre se insinua entre estruturas e faz ângulos agudos; coleção com parede própria é outra coisa.' },
      { passo: 'Não confunda a bexiga com o líquido, nem as vesículas seminais com coleção.', detalhe: 'A bexiga tem parede; o líquido livre não. As vesículas são pares e simétricas.' },
    ],
    estruturas: [
      { slug: 'bexiga-fast', nome: 'Bexiga', original: 'vesica urinaria', nota: 'A janela: anecoica, com parede fina e brilhante. O líquido livre fica fora dela, atrás ou ao lado.', x: 50, y: 36 },
      { slug: 'fundo-de-saco', nome: 'Fundo de saco (recesso retovesical ou retouterino)', original: 'excavatio rectovesicalis · rectouterina', nota: 'O ponto mais dependente da pelve em decúbito dorsal. É onde o líquido livre aparece primeiro.', x: 50, y: 60 },
      { slug: 'utero-fast', nome: 'Útero (ou reto)', original: 'uterus · rectum', nota: 'A estrutura sólida atrás da bexiga. Na mulher, o líquido fica entre o útero e o reto — o fundo de saco de Douglas.', x: 50, y: 70 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Pelve sem líquido livre',
        estado: 'normal',
        diagnostico: 'FAST pélvico negativo.',
        achado: 'Bexiga anecoica com parede fina, útero ou reto encostados nela, sem faixa anecoica entre as estruturas nem nos flancos da bexiga, em dois planos.',
        leitura: ['Confirme a janela pela bexiga.', 'Varra transverso e sagital.', 'Olhe atrás e dos lados.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Nenhuma pelo achado. FAST negativo em trauma não exclui lesão: repita se o paciente piorar, e a tomografia decide no estável.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'fast-pelve-normal' }, alt: 'Bexiga cheia em corte transverso sem líquido livre ao redor' },
      },
      {
        id: 'liquido-livre',
        titulo: 'Líquido livre pélvico',
        estado: 'alterado',
        diagnostico: 'Hemoperitônio (no trauma) ou outro líquido intraperitoneal na pelve.',
        achado: 'Faixa anecoica de bordas angulares atrás da bexiga, no fundo de saco, ou nos flancos vesicais, insinuando-se entre alças e útero. Na mulher jovem, uma lâmina mínima no fundo de saco pode ser fisiológica; mais que isso, ou em trauma, é positivo.',
        leitura: [
          'Diga onde está: fundo de saco, paravesical ou ambos.',
          'Estime a lâmina em milímetros.',
          'Confira as outras janelas do FAST — a pelve positiva isolada é possível.',
          'Em mulher em idade fértil sem trauma, pense em ectópica rota e cisto roto.',
        ],
        diferencaDoNormal:
          'Na pelve normal, as estruturas se encostam sem nada entre elas. O líquido livre é o que se coloca no meio: ele não tem parede, escorre para o ponto mais baixo e ocupa os ângulos — por isso as bordas são agudas. Sangue recente é anecoico como urina; a diferença é que a bexiga tem parede, e o sangue não.',
        conduta:
          'Trauma instável com FAST positivo: laparotomia. Estável: tomografia. Fora do trauma, a pelve positiva em mulher com beta-hCG positivo é gestação ectópica rota até prova em contrário; em paciente febril, abscesso ou perfuração; em cirrótico, ascite. O líquido é o sinal — a causa está no contexto.',
        diferencial: ['Líquido fisiológico do fundo de saco (lâmina mínima, mulher jovem)', 'Bexiga (tem parede)', 'Vesículas seminais e cisto ovariano (têm parede e forma própria)', 'Ascite', 'Coleção pélvica (parede, ecos)'],
        ilustracao: { id: 'ultrassom', params: { cena: 'fast-pelve-liquido', lamina: 12 }, alt: 'Faixa anecoica de bordas angulares atrás da bexiga, no fundo de saco' },
        patologia: 'trauma-abdominal-fechado',
      },
    ],
    armadilhas: [
      'Bexiga vazia é janela fechada: o FAST pélvico negativo com bexiga vazia não vale.',
      'Vesículas seminais e ovários simulam líquido; são estruturas com parede e forma constante.',
      'Lâmina fisiológica no fundo de saco de mulher jovem não é FAST positivo; no trauma, considere positivo e reavalie.',
      'Líquido livre não diz o que é: sangue, urina, ascite e pus têm a mesma cara.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/trauma',
        oQueProcurar: 'Janela pélvica do FAST negativa e positiva, em transverso e sagital.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Rozycki GS et al. Surgeon-performed ultrasound for the assessment of truncal injuries. Ann Surg, 1998.',
      'ATLS — Advanced Trauma Life Support, 10ª ed.',
    ],
  },

  {
    slug: 'abdome-agudo',
    nome: 'Abdome agudo — apêndice e coleções',
    protocolo: 'Dor abdominal / fossa ilíaca direita',
    transdutor: 'linear',
    posicao: 'Sobre o ponto de maior dor na fossa ilíaca direita, com compressão graduada; sonda linear no magro e na criança, convexa no obeso. Para coleções, sobre a área dolorosa ou o local da cirurgia.',
    pergunta: 'É apendicite? Há coleção drenável?',
    profundidade: '5 a 8 cm (linear) ou 10 a 14 cm (convexo).',
    comoFazer: [
      { passo: 'Peça ao paciente para apontar a dor e comece por ali.', detalhe: 'O apêndice inflamado está debaixo do dedo do paciente na maioria das vezes.' },
      { passo: 'Comprima gradualmente até afastar as alças e ver o psoas e os vasos ilíacos.', detalhe: 'A compressão esvazia o gás das alças normais; o apêndice inflamado não comprime e dói.' },
      { passo: 'Procure a estrutura tubular cega, sem peristalse, saindo do ceco.', detalhe: 'Meça o diâmetro externo em transverso: até 6 mm é normal. Veja a parede, a gordura ao redor e o líquido.' },
      { passo: 'Coleção: procure parede, conteúdo e o que está ao redor.', detalhe: 'Coleção com parede definida e conteúdo heterogêneo entre alças ou junto a órgão é abscesso até prova em contrário.' },
    ],
    estruturas: [
      { slug: 'apendice', nome: 'Apêndice', original: 'appendix vermiformis', nota: 'Tubo cego que sai do ceco, com parede em camadas. Normal até 6 mm, compressível, sem peristalse — e frequentemente invisível quando sadio.', x: 50, y: 50 },
      { slug: 'gordura-mesenterica', nome: 'Gordura mesentérica', nota: 'Escura e discreta no normal. Inflamada, fica brilhante, espessa e parece abraçar o apêndice — é o sinal de que a inflamação saiu da parede.', x: 50, y: 24 },
      { slug: 'psoas', nome: 'Músculo psoas', original: 'musculus psoas major', nota: 'A referência profunda: o apêndice fica entre a parede abdominal e ele.', x: 50, y: 84 },
    ],
    cenas: [
      {
        id: 'normal',
        titulo: 'Apêndice normal',
        estado: 'normal',
        diagnostico: 'Apêndice de calibre normal, compressível, sem sinais inflamatórios.',
        achado: 'Estrutura tubular cega, de até 6 mm de diâmetro externo, com parede em camadas, que se comprime com a sonda, sem líquido ao redor nem gordura ecogênica. Muitas vezes não é encontrado — e não encontrá-lo não é o mesmo que excluí-lo.',
        leitura: ['Identifique o ceco e siga até o fundo cego.', 'Meça em transverso.', 'Comprima e veja colabar.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Apêndice normal visualizado afasta apendicite com boa segurança. Apêndice não visualizado com dor persistente pede tomografia ou reavaliação em horas.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'apendice-normal' }, alt: 'Apêndice normal em corte longitudinal, tubular, cego e compressível' },
      },
      {
        id: 'apendicite',
        titulo: 'Apendicite',
        estado: 'alterado',
        diagnostico: 'Inflamação aguda do apêndice — cirurgia na maioria dos casos.',
        achado:
          'Apêndice com mais de 6 mm de diâmetro externo, não compressível, doloroso sob a sonda, com parede espessada e às vezes perda das camadas; gordura mesentérica ecogênica ao redor, lâmina de líquido periapendicular, apendicolito com sombra no interior. Hiperfluxo na parede ao Doppler ("anel de fogo"). Perfurado: perda da parede, coleção e gás.',
        leitura: [
          'Meça o diâmetro externo em transverso: acima de 6 mm.',
          'Comprima: não colaba e dói exatamente ali.',
          'Olhe a gordura ao redor — brilhante é inflamação que saiu do apêndice.',
          'Procure apendicolito, líquido e coleção: mudam o risco de perfuração.',
        ],
        diferencaDoNormal:
          'O apêndice normal é um tubo mole e vazio que a sonda esmaga. Obstruído — por fecalito, hiperplasia linfoide —, ele se enche, a pressão dentro sobe, a parede incha e o sangue arterial para de entrar: o tubo fica rígido, largo e doloroso, e a gordura ao redor acende porque a inflamação já a alcançou. Cada sinal é a mesma obstrução vista de um ponto diferente.',
        conduta:
          'Apendicectomia (laparoscópica) na apendicite não complicada com cirurgião disponível; antibiótico isolado é alternativa em casos selecionados. Perfuração com abscesso: antibiótico, drenagem percutânea e apendicectomia de intervalo ou imediata conforme o caso. Tomografia quando o ultrassom é inconclusivo, sobretudo no adulto.',
        diferencial: ['Adenite mesentérica (linfonodos, apêndice normal)', 'Ileíte terminal (Crohn, infecciosa)', 'Torção ou cisto ovariano, doença inflamatória pélvica, gestação ectópica', 'Diverticulite cecal ou de Meckel', 'Cólica renal direita'],
        ilustracao: { id: 'ultrassom', params: { cena: 'apendicite', diametro: 9 }, alt: 'Apêndice espessado, não compressível, com apendicolito e gordura ecogênica ao redor' },
      },
      {
        id: 'abscesso-intra-abdominal',
        titulo: 'Abscesso intra-abdominal',
        estado: 'alterado',
        diagnostico: 'Coleção purulenta na cavidade ou junto a um órgão — pós-operatória, por perfuração ou diverticulite.',
        achado:
          'Coleção hipoecoica ou heterogênea, de paredes definidas e irregulares, com ecos internos, septos ou nível líquido-detritos, e às vezes gás (pontos brilhantes com sombra suja). Alças ao redor deslocadas; dor localizada sob a sonda. Febre, leucocitose, íleo.',
        leitura: [
          'Diferencie de alça cheia de líquido: a alça tem peristalse e parede em camadas.',
          'Procure gás dentro — é o sinal mais específico de pus.',
          'Meça e descreva a relação com os órgãos vizinhos.',
          'Avalie se há trajeto seguro para drenagem percutânea.',
        ],
        diferencaDoNormal:
          'O abdome normal é um mosaico de alças com gás e vísceras sólidas, sem coleção alguma. O abscesso é uma cavidade que o corpo construiu ao redor de uma infecção que não conseguiu resolver: parede de fibrina e tecido de granulação, conteúdo de pus e detritos. Ele desloca o que está ao redor porque ocupa um espaço que não existia.',
        conduta:
          'Antibiótico de amplo espectro e drenagem: percutânea guiada por ultrassom ou tomografia quando há trajeto seguro, cirúrgica quando não há, quando é multiloculada ou quando a fonte precisa de correção (perfuração, deiscência). Cultura do material. Tomografia com contraste para mapear coleções múltiplas e a fonte.',
        diferencial: ['Alça de intestino com líquido', 'Hematoma', 'Seroma ou linfocele pós-operatórios', 'Cisto complexo', 'Tumor necrosado'],
        ilustracao: { id: 'ultrassom', params: { cena: 'abscesso-abdominal', diametro: 6 }, alt: 'Coleção heterogênea de paredes definidas com ecos internos entre alças intestinais' },
      },
    ],
    armadilhas: [
      'Apêndice não visualizado não é apêndice normal. É exame inconclusivo.',
      'Alça do íleo terminal comprimida simula apêndice — mas tem peristalse e não termina em fundo cego.',
      'Apêndice retrocecal escapa da compressão graduada; use a janela lateral ou a tomografia.',
      'Coleção pós-operatória sem febre pode ser seroma; a punção decide, não a imagem.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/bowel',
        oQueProcurar: 'Apêndice normal e apendicite em transverso e longitudinal, com apendicolito e anel de fogo; coleções intra-abdominais.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'Puylaert JB. Acute appendicitis: US evaluation using graded compression. Radiology, 1986.',
      'Di Saverio S et al. Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines. World J Emerg Surg, 2020.',
    ],
  },

  {
    slug: 'obstetrico-primeiro-trimestre',
    nome: 'Obstétrico — primeiro trimestre',
    protocolo: 'Dor ou sangramento com beta-hCG positivo',
    transdutor: 'convexo',
    posicao: 'Transabdominal suprapúbico com bexiga cheia, sagital e transverso; transvaginal quando a transabdominal não define. Marcador para a cabeça no sagital.',
    pergunta: 'A gestação está dentro do útero?',
    profundidade: '12 a 16 cm (transabdominal).',
    comoFazer: [
      { passo: 'Encontre o útero atrás da bexiga, em sagital, e identifique o endométrio.', detalhe: 'A faixa brilhante central é a referência: o saco gestacional verdadeiro fica dentro dela, excêntrico, com anel ecogênico.' },
      { passo: 'Procure o saco, a vesícula vitelina e o embrião — nessa ordem.', detalhe: 'Só a vesícula vitelina ou o embrião confirmam gestação intrauterina. Saco vazio pode ser pseudossaco de ectópica.' },
      { passo: 'Se não há gestação intrauterina, olhe os anexos e o fundo de saco.', detalhe: 'Massa anexial separada do ovário e líquido livre, com beta-hCG positivo, é ectópica até prova em contrário.' },
      { passo: 'Confirme a posição do útero antes de chamar de intrauterina.', detalhe: 'Gestação cornual, cervical ou em cicatriz de cesárea parece "dentro" no corte errado. Veja o miométrio ao redor do saco em todas as direções.' },
    ],
    estruturas: [
      { slug: 'utero', nome: 'Útero', original: 'uterus', nota: 'Atrás da bexiga, em pera invertida no sagital. O miométrio homogêneo deve envolver o saco por todos os lados.', x: 60, y: 46 },
      { slug: 'endometrio', nome: 'Endométrio', original: 'endometrium', nota: 'A faixa brilhante central. Espessado e sem saco, com beta-hCG positivo, é o cenário da ectópica.', x: 60, y: 40 },
      { slug: 'saco-gestacional', nome: 'Saco gestacional', original: 'saccus gestationis', nota: 'Área anecoica excêntrica no endométrio, com anel ecogênico (sinal do duplo anel decidual). Visível a partir de 4,5 a 5 semanas.', x: 60, y: 47 },
      { slug: 'anexo', nome: 'Anexo (tuba e ovário)', original: 'adnexa uteri', nota: 'Lateral ao útero. O ovário tem folículos; a massa da ectópica é separada dele e pode ter o próprio anel.', x: 86, y: 70 },
      { slug: 'fundo-de-saco-ob', nome: 'Fundo de saco de Douglas', original: 'excavatio rectouterina', nota: 'Atrás do útero. Líquido ecogênico ali é sangue — a ectópica rota.', x: 66, y: 84 },
    ],
    cenas: [
      {
        id: 'gravidez-intrauterina',
        titulo: 'Gravidez intrauterina',
        estado: 'normal',
        diagnostico: 'Gestação dentro do útero — afasta ectópica, salvo heterotópica.',
        achado: 'Saco gestacional excêntrico no endométrio, com anel ecogênico, contendo vesícula vitelina (a partir de 5 semanas) e embrião com batimento (a partir de 6 semanas). Miométrio ao redor do saco em todas as direções.',
        leitura: ['Localize o saco dentro do endométrio.', 'Procure a vesícula vitelina — é o que confirma.', 'Veja o embrião e o batimento.', 'Confirme miométrio ao redor em todos os cortes.'],
        diferencaDoNormal: 'É a referência.',
        conduta: 'Confirmada a gestação intrauterina, a dor ou o sangramento passam a ter outras causas (ameaça de aborto, cisto de corpo lúteo). Heterotópica é rara, mas real em fertilização assistida. Datar pelo comprimento cabeça-nádega e encaminhar ao pré-natal.',
        diferencial: [],
        ilustracao: { id: 'ultrassom', params: { cena: 'gravidez-intrauterina', semanas: 7 }, alt: 'Saco gestacional com vesícula vitelina e embrião dentro do endométrio' },
      },
      {
        id: 'gestacao-ectopica',
        titulo: 'Gestação ectópica',
        estado: 'alterado',
        diagnostico: 'Gestação fora do útero — tubária na maioria — com risco de rotura e hemorragia.',
        achado:
          'Útero sem saco gestacional (ou com pseudossaco central, sem anel), endométrio espessado, e massa anexial separada do ovário: anel tubário ecogênico, saco com embrião fora do útero ou massa heterogênea. Líquido livre no fundo de saco, ecogênico se já sangrou. Beta-hCG acima da zona discriminatória sem gestação intrauterina fecha a suspeita.',
        leitura: [
          'Confirme que o útero está vazio de verdade, em dois planos.',
          'Procure a massa anexial e veja se ela se move separada do ovário ("sinal do deslizamento").',
          'Olhe o fundo de saco e o recesso hepatorrenal: sangue lá é rotura.',
          'Correlacione com o beta-hCG: acima de 1.500 a 2.000 sem saco intrauterino é ectópica até prova em contrário.',
        ],
        diferencaDoNormal:
          'Na gestação normal, o embrião se implanta no endométrio e o útero cresce ao redor dele. Na ectópica, ele parou no caminho — na tuba, quase sempre — e cresce num lugar que não distende: a tuba se rompe em semanas. O útero recebe os hormônios e espessa o endométrio, mas está vazio; e é o vazio, junto com o beta-hCG, que faz o diagnóstico antes mesmo de se ver a massa.',
        conduta:
          'Instável ou com líquido livre abundante: cirurgia imediata (salpingectomia ou salpingostomia), com reposição volêmica e sangue. Estável, massa pequena, sem batimento e beta-hCG baixo: metotrexato com seguimento seriado. Rh negativo recebe imunoglobulina. Beta-hCG indeterminado sem instabilidade: repetir em 48 horas — a subida lenta é o padrão da ectópica.',
        diferencial: ['Gestação intrauterina muito precoce (saco ainda invisível)', 'Aborto completo (útero vazio, beta-hCG caindo)', 'Cisto de corpo lúteo (no ovário, não separado dele)', 'Gestação heterotópica', 'Massa anexial de outra natureza'],
        ilustracao: { id: 'ultrassom', params: { cena: 'gestacao-ectopica', massa: 25 }, alt: 'Útero vazio com endométrio espessado e massa anexial em anel fora do útero' },
      },
      {
        id: 'liquido-livre-gestante',
        titulo: 'Líquido livre em gestante com dor',
        estado: 'alterado',
        diagnostico: 'Hemoperitônio por gestação ectópica rota até prova em contrário.',
        achado:
          'Líquido no fundo de saco de Douglas, em volume maior que a lâmina fisiológica, frequentemente ecogênico ou com coágulos, e que sobe ao recesso hepatorrenal quando o volume é grande. Útero sem gestação intrauterina; massa anexial pode ou não ser visível. Dor, sangramento vaginal, síncope, taquicardia.',
        leitura: [
          'Estime o volume: só no fundo de saco é pouco; chegando a Morrison é muito.',
          'Olhe a ecogenicidade: sangue com coágulo não é anecoico como a lâmina fisiológica.',
          'Procure a gestação — dentro ou fora do útero.',
          'Não gaste tempo procurando a massa se o paciente está instável: o líquido mais o beta-hCG já decidem.',
        ],
        diferencaDoNormal:
          'Uma lâmina mínima de líquido no fundo de saco é normal em mulher jovem — é o que sobra da ovulação. O que muda tudo é o volume e o conteúdo: sangue de rotura tubária é abundante, tem coágulos e sobe pelos recessos até o fígado. Numa mulher com beta-hCG positivo, líquido em Morrison é uma tuba rota até que alguém prove o contrário.',
        conduta:
          'Duas veias calibrosas, tipagem e reserva de sangue, ginecologia imediata para laparoscopia ou laparotomia. Não aguardar tomografia nem beta-hCG quantitativo se instável. Imunoglobulina anti-D se Rh negativo. Estável com pouco líquido e ectópica pequena: internar e discutir conduta conservadora com vigilância rigorosa.',
        diferencial: ['Cisto ovariano roto (com ou sem gestação)', 'Corpo lúteo hemorrágico', 'Lâmina fisiológica do fundo de saco', 'Ascite de outra causa', 'Trauma'],
        ilustracao: { id: 'ultrassom', params: { cena: 'liquido-livre-gestante', volume: 500 }, alt: 'Líquido ecogênico no fundo de saco atrás do útero vazio' },
      },
    ],
    armadilhas: [
      'Chamar pseudossaco de gestação intrauterina: o pseudossaco é central, sem anel, sem vesícula vitelina.',
      'Confundir gestação cornual ou cervical com intrauterina. Confirme miométrio ao redor do saco em todos os planos.',
      'Esperar a massa anexial para diagnosticar: útero vazio com beta-hCG acima da zona discriminatória já basta para agir.',
      'Beta-hCG abaixo da zona discriminatória não exclui ectópica — exclui apenas que ela devesse ser visível.',
    ],
    ondeVerFoto: [
      {
        titulo: 'The POCUS Atlas',
        url: 'https://www.thepocusatlas.com/obgyn',
        oQueProcurar: 'Gestação intrauterina com vesícula vitelina e batimento, anel tubário da ectópica, e líquido livre da ectópica rota.',
        licenciada: 'pocus-atlas',
      },
    ],
    referencias: [
      'ACOG Practice Bulletin No. 193: Tubal Ectopic Pregnancy. Obstet Gynecol, 2018.',
      'Doubilet PM et al. Diagnostic criteria for nonviable pregnancy early in the first trimester. N Engl J Med, 2013.',
    ],
  },
]

/**
 * As cenas da segunda leva moram em arquivos próprios, por janela, e são
 * anexadas aqui na leitura. Nenhuma tem esquema: são achados que só existem
 * em movimento ou cuja textura o desenho não reproduz, e o caso real do
 * The POCUS Atlas é a figura. As janelas continuam com uma cena normal só —
 * a primeira leva — porque é ela que ancora o comparador.
 */
const CENAS_EXTRA: Record<string, CenaClinica[]> = {
  'pulmao-linhas': CENAS_PULMAO,
  'subxifoide-pericardio': CENAS_PERICARDIO,
  'paraesternal-eixo-longo': [...CENAS_PLAX, ...CENAS_CARDIO_LEVA_4['paraesternal-eixo-longo']],
  'paraesternal-eixo-curto': CENAS_PSAX,
  'apical-quatro-camaras': [...CENAS_APICAL, ...CENAS_CARDIO_LEVA_4['apical-quatro-camaras']],
  'veia-cava-inferior': CENAS_CAVA,
  'veias-profundas': CENAS_VEIAS,
  'aorta-abdominal': CENAS_AORTA,
  'vesicula-biliar': CENAS_VESICULA,
  rins: CENAS_RINS,
  bexiga: CENAS_BEXIGA,
  'abdome-agudo': CENAS_ABDOME_AGUDO,
  'fast-morrison': CENAS_FAST,
  'obstetrico-primeiro-trimestre': CENAS_OBSTETRICO,
  'partes-moles': CENAS_PARTES_MOLES,
}

export const JANELAS_ULTRASSOM: JanelaUltrassom[] = [
  ...JANELAS_BASE.map((janela) => ({ ...janela, cenas: [...janela.cenas, ...(CENAS_EXTRA[janela.slug] ?? [])] })),
  JANELA_OLHO,
  JANELA_BLOQUEIOS,
  JANELA_PROCEDIMENTOS,
  JANELA_PARTES_PEQUENAS,
  JANELA_DOPPLER,
  JANELA_OBSTETRICO_TARDIO,
]

export const TOTAL_DE_JANELAS = JANELAS_ULTRASSOM.length
export const TOTAL_DE_CENAS_ULTRASSOM = JANELAS_ULTRASSOM.reduce((total, janela) => total + janela.cenas.length, 0)

export function janelaPorSlug(slug: string): JanelaUltrassom | undefined {
  return JANELAS_ULTRASSOM.find((janela) => janela.slug === slug)
}

import { NOTAS_ESTRUTURAS, notaDeFallback, type NotaEstrutura } from './estruturas'

export type { NotaEstrutura } from './estruturas'

export type RegiaoRaioX =
  | 'torax'
  | 'cabeca'
  | 'abdome'
  | 'ombro'
  | 'membro-inferior'
  | 'pelve'
  | 'coluna-cervical'
  | 'membro-superior'
  | 'coluna-lombar'

export interface EstruturaRaioX {
  nome: string
  original: string
  sobreposicao: string
  /** Identificador estável para deep-link (`?estrutura=`) e para chaves de lista. */
  slug: string
}

export interface EstudoRaioX {
  id: string
  regiao: RegiaoRaioX
  regiaoTitulo: string
  titulo: string
  incidencia: string
  /**
   * Qual camada anatômica esta série demarca. É o que separa, por exemplo, as
   * três séries de tórax entre si — e o rótulo que o catálogo usa para não
   * empilhar "vários botões só pra tórax" sem explicar a diferença.
   */
  camada: string
  /** Uma linha para o card do catálogo: o que o aluno ganha ao abrir. */
  resumo: string
  foco: string
  imagem: string
  fonte: string
  estruturas: EstruturaRaioX[]
}

export interface GuiaRegiaoRaioX {
  contexto: string
  tecnica: string
  qualidade: string[]
  roteiro: { passo: string; detalhe: string }[]
  armadilhas: string[]
  perolas: string[]
  /** Números de referência que o aluno costuma procurar e não achar. */
  medidas: { rotulo: string; valor: string; nota: string }[]
  /** Onde a radiografia simples acaba e outro método começa. */
  quandoAvancar: string
}

const ROOT = 'https://www.clinicalanatomy.ca/radiology'

type EstruturaBruta = [arquivo: string, nome: string, original: string]

export function slugEstrutura(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function montarEstudo({
  id,
  regiao,
  regiaoTitulo,
  titulo,
  incidencia,
  camada,
  resumo,
  foco,
  pasta,
  imagem,
  estruturas,
}: Omit<EstudoRaioX, 'imagem' | 'fonte' | 'estruturas'> & {
  pasta: string
  imagem: string
  estruturas: EstruturaBruta[]
}): EstudoRaioX {
  const usados = new Map<string, number>()
  return {
    id,
    regiao,
    regiaoTitulo,
    titulo,
    incidencia,
    camada,
    resumo,
    foco,
    imagem: `${ROOT}/${pasta}/${imagem}`,
    fonte: `${ROOT}/${id}.html`,
    estruturas: estruturas.map(([arquivo, nome, original]) => {
      const base = slugEstrutura(nome)
      const repetido = usados.get(base) ?? 0
      usados.set(base, repetido + 1)
      return {
        nome,
        original,
        sobreposicao: `${ROOT}/${pasta}/${arquivo}`,
        slug: repetido ? `${base}-${repetido + 1}` : base,
      }
    }),
  }
}

export const ESTUDOS_RAIO_X: EstudoRaioX[] = [
  montarEstudo({
    id: 'thoraxBones', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Arcabouço ósseo e marcos torácicos', incidencia: 'PA', pasta: 'thorax', imagem: 'thoraxPA.png',
    camada: 'Ossos e marcos',
    resumo: 'A base de tudo: onde medir rotação, inspiração e índice cardiotorácico antes de procurar doença.',
    foco: 'Use esta incidência para dominar primeiro a qualidade técnica e o arcabouço torácico. A largura cardíaca só é interpretável em PA bem inspirada; ângulos costofrênicos, bolha gástrica e sombras mamárias devem ser reconhecidos antes de procurar doença.',
    estruturas: [
      ['Clav.png', 'Clavículas', 'clavicles'], ['Man.png', 'Manúbrio do esterno', 'manubrium of sternum'],
      ['Scap.png', 'Escápulas', 'scapulae'], ['SP.png', 'Processos espinhosos', 'spinous processes'],
      ['VB.png', 'Corpos vertebrais', 'vertebral bodies'], ['BS.png', 'Sombras mamárias', 'breast shadows'],
      ['CW.png', 'Largura cardíaca', 'cardiac width'], ['CA.png', 'Ângulos costofrênicos', 'costophrenic angles'],
      ['GB.png', 'Bolha gástrica', 'gastric bubble'], ['TW.png', 'Largura torácica', 'thoracic width'],
    ],
  }),
  montarEstudo({
    id: 'thoraxMedia', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Contornos mediastinais e cardíacos', incidencia: 'PA', pasta: 'thorax', imagem: 'thoraxMed.png',
    camada: 'Mediastino e coração',
    resumo: 'Os arcos do mediastino em ordem, para saber qual câmara ou vaso está fazendo cada borda.',
    foco: 'Leia os contornos mediastinais de cima para baixo: traqueia, botão aórtico, hilo esquerdo e bordas cardíacas. A sequência dos arcos ajuda a localizar aumento de câmaras, dilatação vascular e deslocamentos do mediastino.',
    estruturas: [
      ['AA.png', 'Arco aórtico', 'aortic arch'], ['Dia.png', 'Diafragma', 'diaphragm'], ['Hila.png', 'Hilos pulmonares', 'hila'],
      ['LAA.png', 'Apêndice atrial esquerdo', 'left atrial appendage'], ['LV.png', 'Ventrículo esquerdo', 'left ventricle'],
      ['RA.png', 'Átrio direito', 'right atrium'], ['Conf.png', 'Confluência VCS-ázigos', 'SVC-azygous confluence'],
      ['Trac.png', 'Traqueia', 'trachea'],
    ],
  }),
  montarEstudo({
    id: 'thoraxLat', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Perfil do tórax', incidencia: 'Perfil', pasta: 'thorax', imagem: 'thoraxLat.png',
    camada: 'Espaços claros e câmaras posteriores',
    resumo: 'O que a PA esconde: retroesternal, retrocardíaco, seios posteriores e o ventrículo direito.',
    foco: 'O perfil separa estruturas sobrepostas no PA. Observe espaços retroesternal e retrocardíaco, continuidade da coluna, cúpulas e recessos costofrênicos; a borda anterior do coração é sobretudo ventricular direita e a posterior, atrial e ventricular esquerda.',
    estruturas: [
      ['CAlat.png', 'Ângulos costofrênicos', 'costophrenic angles'], ['LAlat.png', 'Átrio esquerdo', 'left atrium'],
      ['LVlat.png', 'Ventrículo esquerdo', 'left ventricle'], ['Ped.png', 'Pedículos', 'pedicles'],
      ['RV.png', 'Ventrículo direito', 'right ventricle'], ['ScapLat.png', 'Escápula', 'scapula'],
      ['Ster.png', 'Esterno', 'sternum'], ['TracLat.png', 'Traqueia', 'trachea'], ['VBlat.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'skullBones', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Ossos do crânio e da face', incidencia: 'AP', pasta: 'head', imagem: 'skull.png',
    camada: 'Calota e maciço facial',
    resumo: 'Comparação bilateral da calota, órbitas, zigomas e mandíbula em projeção frontal.',
    foco: 'A projeção frontal exige comparação bilateral. Siga a calota, órbitas, zigomas, maxilas e mandíbula; assimetrias de rotação podem simular diferença de volume e obscurecer linhas de fratura.',
    estruturas: [
      ['FB.png', 'Osso frontal', 'frontal bone'], ['Man.png', 'Mandíbula', 'mandible'], ['Max.png', 'Maxila', 'maxilla'],
      ['NS.png', 'Septo nasal', 'nasal septum'], ['TB.png', 'Osso temporal', 'temporal bone'], ['Zyg.png', 'Osso zigomático', 'zygomatic bone'],
    ],
  }),
  montarEstudo({
    id: 'skullLat', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Crânio em perfil e suturas', incidencia: 'Perfil', pasta: 'head', imagem: 'skullLat.png',
    camada: 'Calota, base e suturas',
    resumo: 'Onde aprender a diferenciar sutura de fratura e a reconhecer a sela túrcica.',
    foco: 'No perfil, reconheça calota e suturas antes da base do crânio. A sela túrcica é um reparo central; frontal, parietal, temporal, esfenoide e occipital devem formar contornos contínuos, apesar da sobreposição bilateral.',
    estruturas: [
      ['FBlat.png', 'Osso frontal', 'frontal bone'], ['FSlat.png', 'Seio frontal', 'frontal sinus'], ['MP.png', 'Processo mastoide', 'mastoid process'],
      ['OBlat.png', 'Osso occipital', 'occipital bone'], ['PBlat.png', 'Osso parietal', 'parietal bone'], ['ST.png', 'Sela túrcica', 'sella turcica'],
      ['SBlat.png', 'Osso esfenoide', 'sphenoid bone'], ['TBlat.png', 'Osso temporal', 'temporal bone'],
      ['CS.png', 'Sutura coronal', 'coronal suture'], ['LS.png', 'Sutura lambdoide', 'lambdoid suture'],
    ],
  }),
  montarEstudo({
    id: 'skullSinus', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Seios paranasais e cavidades aeradas', incidencia: 'AP', pasta: 'head', imagem: 'skull.png',
    camada: 'Seios e mastoides',
    resumo: 'Transparência, simetria e níveis líquidos nas cavidades aeradas da face.',
    foco: 'Compare transparência, contorno e simetria dos seios. Opacificação, nível líquido ou espessamento mucoso devem ser correlacionados com técnica e clínica; a radiografia tem sobreposição importante e a TC é superior quando há dúvida ou complicação.',
    estruturas: [
      ['EAC.png', 'Células etmoidais', 'ethmoid air cells'], ['FS.png', 'Seio frontal', 'frontal sinus'], ['MAC.png', 'Células mastoideas', 'mastoid air cells'],
      ['MS.png', 'Seio maxilar', 'maxillary sinus'], ['OF.png', 'Lâmina cribriforme / teto olfatório', 'olfactory floor'], ['SS.png', 'Seio esfenoidal', 'sphenoid sinus'],
    ],
  }),
  montarEstudo({
    id: 'abdomenAP', regiao: 'abdome', regiaoTitulo: 'Abdome', titulo: 'Abdome e pelve — visão geral', incidencia: 'AP', pasta: 'abdomen', imagem: 'abdomen.png',
    camada: 'Vísceras sólidas e esqueleto',
    resumo: 'Fígado, baço, rins, psoas e todo o esqueleto incluído no campo.',
    foco: 'Comece pelo padrão gasoso e pela distribuição das alças; depois avalie partes moles, bordas dos psoas, rins e vísceras, calcificações e todo o esqueleto incluído. A radiografia simples mostra padrões, não substitui avaliação seccional quando há gravidade.',
    estruturas: [
      ['Gas.png', 'Gás na flexura hepática', 'gas in hepatic flexure'], ['Kid.png', 'Rins', 'kidneys'], ['Liv.png', 'Fígado', 'liver'],
      ['PM.png', 'Músculos psoas', 'psoas muscles'], ['Sple.png', 'Baço', 'spleen'], ['Stom.png', 'Estômago', 'stomach'],
      ['Ace.png', 'Acetábulos', 'acetabula'], ['FH.png', 'Cabeças femorais', 'femoral heads'], ['IC.png', 'Cristas ilíacas', 'iliac crests'],
      ['Rect.png', 'Reto', 'rectum'], ['SIJ.png', 'Articulações sacroilíacas', 'sacro-iliac joints'],
    ],
  }),
  montarEstudo({
    id: 'abdomenIntes', regiao: 'abdome', regiaoTitulo: 'Abdome', titulo: 'Alças intestinais: delgado × cólon', incidencia: 'AP', pasta: 'abdomen', imagem: 'abdomenIntes.png',
    camada: 'Padrão gasoso',
    resumo: 'A distinção que decide o raciocínio de obstrução: válvulas coniventes contra haustrações.',
    foco: 'Diferencie delgado de cólon pelo calibre, pela posição e pelas pregas: válvulas coniventes atravessam toda a luz do delgado; haustra são mais espaçadas e não cruzam completamente o cólon.',
    estruturas: [
      ['Haus.png', 'Haustrações', 'haustra'], ['LI.png', 'Intestino grosso', 'large intestine'],
      ['SI.png', 'Intestino delgado', 'small intestine'], ['VC.png', 'Válvulas coniventes', 'valvulae conniventes'],
    ],
  }),
  montarEstudo({
    id: 'shoulderAP', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Úmero proximal e glenoide', incidencia: 'AP', pasta: 'shoulder', imagem: 'shoulderAP.png',
    camada: 'Articulação glenoumeral',
    resumo: 'Congruência glenoumeral, tubérculos e os dois colos do úmero — onde estão as fraturas.',
    foco: 'Trace clavícula, articulação acromioclavicular, glenoide e úmero proximal. A congruência glenoumeral e a continuidade cortical dos colos anatômico e cirúrgico são o eixo da leitura.',
    estruturas: [
      ['ClavA.png', 'Extremidade acromial da clavícula', 'acromial end'], ['ClavS.png', 'Extremidade esternal da clavícula', 'sternal end'],
      ['AN.png', 'Colo anatômico do úmero', 'anatomical neck'], ['GT.png', 'Tubérculo maior', 'greater tuberosity'], ['HH.png', 'Cabeça do úmero', 'head'],
      ['LT.png', 'Tubérculo menor', 'lesser tuberosity'], ['SN.png', 'Colo cirúrgico do úmero', 'surgical neck'],
      ['CorProc.png', 'Processo coracoide', 'coracoid process'], ['GF.png', 'Cavidade glenoidal', 'glenoid fossa'],
      ['IGT.png', 'Tubérculo infraglenoidal', 'infraglenoid tubercle'], ['SGT.png', 'Tubérculo supraglenoidal', 'supraglenoid tubercle'],
    ],
  }),
  montarEstudo({
    id: 'shoulderScapula', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Escápula: bordas e ângulos', incidencia: 'AP', pasta: 'shoulder', imagem: 'shoulderAP.png',
    camada: 'Anel escapular',
    resumo: 'A lâmina escapular sobreposta ao gradil — e a linha que mais gera falso pneumotórax.',
    foco: 'A escápula é uma lâmina sobreposta às costelas. Siga seus bordos e ângulos até a glenoide; descontinuidades, assimetria ou degraus devem ser confirmados em incidências complementares.',
    estruturas: [
      ['IA.png', 'Ângulo inferior', 'inferior angle'], ['LA.png', 'Ângulo lateral', 'lateral angle'], ['LB.png', 'Borda lateral', 'lateral border'],
      ['MB.png', 'Borda medial', 'medial border'], ['SA.png', 'Ângulo superior', 'superior angle'], ['SB.png', 'Borda superior', 'superior border'],
    ],
  }),
  montarEstudo({
    id: 'shoulderHumerus', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Diáfise umeral e incisura escapular', incidencia: 'AP', pasta: 'shoulder', imagem: 'humerus.png',
    camada: 'Fora da articulação',
    resumo: 'Dois reparos que a leitura centrada na articulação costuma deixar de fora.',
    foco: 'Amplie a inspeção além da articulação: a tuberosidade deltoidea marca a diáfise lateral do úmero e a incisura escapular superior situa-se medial ao processo coracoide.',
    estruturas: [['DT.png', 'Tuberosidade deltoidea', 'deltoid tuberosity'], ['SSN.png', 'Incisura da escápula', 'suprascapular notch']],
  }),
  montarEstudo({
    id: 'kneeAP', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Joelho', incidencia: 'AP', pasta: 'leg', imagem: 'kneeAP.png',
    camada: 'Côndilos, platôs e interlinhas',
    resumo: 'Alinhamento femorotibial e as superfícies de carga onde moram as fraturas de platô.',
    foco: 'Avalie alinhamento femorotibial, interlinhas medial e lateral, côndilos, platôs e espinhas tibiais. A cabeça da fíbula ajuda a orientar o lado lateral; rotação altera artificialmente a largura das interlinhas.',
    estruturas: [
      ['LFC.png', 'Côndilo femoral lateral', 'lateral femoral condyle'], ['MFC.png', 'Côndilo femoral medial', 'medial femoral condyle'],
      ['Pat.png', 'Patela', 'patella'], ['FibH.png', 'Cabeça da fíbula', 'head'], ['FibN.png', 'Colo da fíbula', 'neck'],
      ['LTP.png', 'Platô tibial lateral', 'lateral tibial plateau'], ['LTS.png', 'Espinha tibial lateral', 'lateral tibial spine'],
      ['MTP.png', 'Platô tibial medial', 'medial tibial plateau'], ['MTS.png', 'Espinha tibial medial', 'medial tibial spine'],
    ],
  }),
  montarEstudo({
    id: 'kneeLat', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Joelho', incidencia: 'Perfil', pasta: 'leg', imagem: 'kneeLat.png',
    camada: 'Derrame, coxins e aparelho extensor',
    resumo: 'O perfil que revela derrame articular e fratura oculta antes de qualquer traço aparecer.',
    foco: 'No perfil verdadeiro, côndilos femorais ficam quase sobrepostos. Examine patela, tendões, coxins adiposos e recesso suprapatelar; deslocamento dos coxins pode ser o primeiro sinal de derrame ou fratura oculta.',
    estruturas: [
      ['FP.png', 'Coxins adiposos', 'fat pads'], ['Fem.png', 'Fêmur', 'femur'], ['Fib.png', 'Fíbula', 'fibula'], ['PatLat.png', 'Patela', 'patella'],
      ['PT.png', 'Tendão patelar', 'patellar tendon'], ['QT.png', 'Tendão do quadríceps', 'quadriceps tendon'],
      ['SP.png', 'Recesso suprapatelar', 'suprapatellar pouch'], ['Tib.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'legAP', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Perna', incidencia: 'AP', pasta: 'leg', imagem: 'legAP.png',
    camada: 'Osso longo de articulação a articulação',
    resumo: 'Por que a radiografia de perna precisa incluir joelho e tornozelo no mesmo filme.',
    foco: 'Uma radiografia da perna deve incluir joelho e tornozelo. Siga cada cortical da tíbia e da fíbula em toda a extensão e confirme alinhamento nas articulações proximal e distal.',
    estruturas: [
      ['Calc.png', 'Calcâneo', 'calcaneus'], ['FemLeg.png', 'Fêmur', 'femur'], ['FibLeg.png', 'Fíbula', 'fibula'],
      ['MT.png', 'Metatarsos', 'metatarsals'], ['PatLeg.png', 'Patela', 'patella'], ['Tal.png', 'Tálus', 'talus'], ['TibLeg.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'legLat', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Perna', incidencia: 'Perfil', pasta: 'leg', imagem: 'legLat.png',
    camada: 'Deslocamento e angulação',
    resumo: 'A incidência ortogonal que mostra o desvio anteroposterior invisível na AP.',
    foco: 'O perfil revela deslocamento anteroposterior e angulação não visíveis em AP. Confirme que as articulações adjacentes foram incluídas e percorra as corticais sem saltos.',
    estruturas: [
      ['CalcLat.png', 'Calcâneo', 'calcaneus'], ['FemLat.png', 'Fêmur', 'femur'], ['FibLat.png', 'Fíbula', 'fibula'],
      ['MTlat.png', 'Metatarsos', 'metatarsals'], ['PatLegLat.png', 'Patela', 'patella'], ['TalLat.png', 'Tálus', 'talus'], ['TibLat.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'pelvisBones', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Anel pélvico: ílio, ísquio e púbis', incidencia: 'AP', pasta: 'pelvis', imagem: 'pelvisBones.png',
    camada: 'Anel ósseo completo',
    resumo: 'O anel percorrido por inteiro — porque ele quase nunca se quebra em um ponto só.',
    foco: 'Use um anel sistemático: asas ilíacas, sacro e sacroilíacas, acetábulos, ramos púbicos e sínfise. Uma interrupção do anel deve motivar busca ativa por uma segunda lesão.',
    estruturas: [
      ['AIIS.png', 'Espinha ilíaca anteroinferior', 'anterior inferior iliac spine'], ['Pubis.png', 'Corpo do púbis', 'body of pubis'],
      ['Cocc.png', 'Cóccix', 'coccyx'], ['Ileum.png', 'Ílio', 'ileum'], ['IC.png', 'Crista ilíaca', 'iliac crest'],
      ['IPR.png', 'Ramo inferior do púbis', 'inferior pubic ramus'], ['IS.png', 'Espinha isquiática', 'ischial spine'],
      ['IT.png', 'Tuberosidade isquiática', 'ischial tuberosity'], ['PS.png', 'Sínfise púbica', 'pubic symphysis'],
      ['PT.png', 'Tubérculo púbico', 'pubic tuberosity'], ['Sacr.png', 'Sacro', 'sacrum'], ['SPR.png', 'Ramo superior do púbis', 'superior pubic ramus'],
    ],
  }),
  montarEstudo({
    id: 'pelvisAP', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Quadris e fêmur proximal', incidencia: 'AP', pasta: 'pelvis', imagem: 'pelvisAP.png',
    camada: 'Simetria e linhas de Shenton',
    resumo: 'Comparação lado a lado: altura das cabeças, interlinhas e o sinal de rotação do trocânter menor.',
    foco: 'Compare altura das cabeças femorais, interlinhas coxofemorais, linhas de Shenton e simetria dos forames obturatórios. O trocânter menor excessivamente visível sugere rotação externa.',
    estruturas: [
      ['Acet.png', 'Acetábulo', 'acetabulum'], ['ASIS.png', 'Espinha ilíaca anterossuperior', 'anterior superior iliac spine'],
      ['OF.png', 'Forame obturatório', 'obturator foramen'], ['PI.png', 'Estreito superior da pelve', 'pelvic inlet'], ['SIJ.png', 'Articulação sacroilíaca', 'sacroiliac joint'],
      ['GT.png', 'Trocânter maior', 'greater trochanter'], ['Fhead.png', 'Cabeça do fêmur', 'head'], ['LT.png', 'Trocânter menor', 'lesser trochanter'], ['Fneck.png', 'Colo do fêmur', 'neck'],
    ],
  }),
  montarEstudo({
    id: 'pelvisHip', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Quadril em abdução', incidencia: 'Rã (frog-leg)', pasta: 'pelvis', imagem: 'pelvisHip.png',
    camada: 'Perfil do colo femoral',
    resumo: 'A posição que perfila colo e cabeça — e que é contraindicada na suspeita de fratura instável.',
    foco: 'A abdução e rotação externa perfilam colo e cabeça femoral. Avalie congruência, interlinha e junção cabeça-colo; esta posição não deve ser forçada quando há suspeita de fratura aguda.',
    estruturas: [
      ['AcetHip.png', 'Acetábulo', 'acetabulum'], ['ASIShip.png', 'Espinha ilíaca anterossuperior', 'anterior superior iliac spine'],
      ['HJS.png', 'Espaço articular do quadril', 'hip joint space'], ['IChip.png', 'Crista ilíaca', 'iliac crest'], ['OFhip.png', 'Forame obturatório', 'obturator foramen'],
      ['GThip.png', 'Trocânter maior', 'greater trochanter'], ['FH.png', 'Cabeça do fêmur', 'head'], ['LThip.png', 'Trocânter menor', 'lesser trochanter'], ['FN.png', 'Colo do fêmur', 'neck'],
    ],
  }),
  montarEstudo({
    id: 'neckAP', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'AP', pasta: 'neck', imagem: 'neckAP.png',
    camada: 'Simetria e coluna aérea',
    resumo: 'Alinhamento dos espinhosos, simetria de pedículos e a coluna de ar traqueal.',
    foco: 'Centralização adequada alinha processos espinhosos. Compare pedículos e processos transversos bilateralmente, conte corpos vertebrais e observe a coluna aérea traqueal.',
    estruturas: [
      ['Ped.png', 'Pedículos', 'pedicles'], ['SPap.png', 'Processos espinhosos', 'spinous processes'], ['Trach.png', 'Traqueia', 'trachea'],
      ['TPap.png', 'Processos transversos', 'transverse processes'], ['VBap.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'neckLatl', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Perfil esquerdo', pasta: 'neck', imagem: 'neckLatl.png',
    camada: 'Quatro linhas de alinhamento',
    resumo: 'A incidência mais importante do trauma cervical: C1 até a junção C7-T1, linha por linha.',
    foco: 'Siga quatro linhas: anterior dos corpos, posterior dos corpos, espinolaminar e pontas dos espinhosos. Inclua C1 até a junção C7-T1 e avalie partes moles pré-vertebrais.',
    estruturas: [
      ['AA.png', 'Arco anterior do atlas (C1)', 'anterior arch of atlas (c1)'], ['IAP.png', 'Processos articulares inferiores', 'inferior articular processes'],
      ['PI.png', 'Pars interarticularis', 'pars interarticularis'], ['PA.png', 'Arco posterior do atlas (C1)', 'posterior arch of atlas (c1)'],
      ['SAP.png', 'Processos articulares superiores', 'superior articular processes'], ['ZJ.png', 'Articulações zigapofisárias', 'zygopophyseal joints'],
    ],
  }),
  montarEstudo({
    id: 'neckLatr', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Perfil direito', pasta: 'neck', imagem: 'neckLatr.png',
    camada: 'Alturas e espaços discais',
    resumo: 'Depois do alinhamento: altura dos corpos, espaços discais e partes moles pré-vertebrais.',
    foco: 'Além do alinhamento, compare alturas dos corpos e espaços discais. A perda focal de altura, o degrau de uma linha ou o aumento pré-vertebral merecem correlação urgente com trauma e TC.',
    estruturas: [
      ['AAA.png', 'Arco anterior do atlas (C1)', 'anterior arch of atlas (c1)'], ['IDS.png', 'Espaços discais intervertebrais', 'intervertebral disc spaces'],
      ['SP.png', 'Processos espinhosos', 'spinous processes'], ['TP.png', 'Processos transversos', 'transverse processes'], ['VB.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'neckOblq', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Oblíqua', pasta: 'neck', imagem: 'neckOblq.png',
    camada: 'Forames de conjugação',
    resumo: 'A única incidência simples que abre os forames por onde saem as raízes.',
    foco: 'A oblíqua abre os forames intervertebrais. Compare calibre e contornos por nível, reconhecendo que rotação inadequada pode produzir estreitamento aparente.',
    estruturas: [['IVF.png', 'Forames intervertebrais', 'intervertebral foramina'], ['PedOb.png', 'Pedículos', 'pedicles'], ['VBob.png', 'Corpos vertebrais', 'vertebral bodies']],
  }),
  montarEstudo({
    id: 'neckOdon', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'C1-C2 e processo odontoide', incidencia: 'Transoral', pasta: 'neck', imagem: 'neckOdon.png',
    camada: 'Junção atlantoaxial',
    resumo: 'Boca aberta para ver o dente e as massas laterais sem sobreposição dentária.',
    foco: 'A boca aberta deve expor odontoide e massas laterais de C1 sem sobreposição dentária. Compare os espaços entre o dente e as massas laterais; assimetria técnica deve ser distinguida de desalinhamento verdadeiro.',
    estruturas: [
      ['AF.png', 'Facetas articulares', 'articular facets'], ['Dens.png', 'Processo odontoide (dente)', 'dens'],
      ['LM1.png', 'Massas laterais do atlas (C1)', 'lateral masses of atlas (c1)'], ['LM2.png', 'Massas laterais do áxis (C2)', 'lateral masses of axis (c2)'],
      ['SPod.png', 'Processo espinhoso do áxis (C2)', 'spinous process of axis (c2)'],
    ],
  }),
  montarEstudo({
    id: 'elbowAP', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Cotovelo', incidencia: 'AP', pasta: 'arm', imagem: 'elbowAP.png',
    camada: 'Úmero distal e rádio proximal',
    resumo: 'Epicôndilos, capítulo, tróclea e a linha radiocapitelar que nunca deve ser esquecida.',
    foco: 'Inspecione úmero distal, cabeça e colo do rádio e ulna proximal. A linha radiocapitelar deve atravessar o capítulo em todas as projeções; perda dessa relação sugere desalinhamento.',
    estruturas: [
      ['Cap.png', 'Capítulo do úmero', 'capitulum'], ['LE.png', 'Epicôndilo lateral', 'lateral epicondyle'], ['LSR.png', 'Crista supracondilar lateral', 'lateral supracondylar ridge'],
      ['ME.png', 'Epicôndilo medial', 'medial epicondyle'], ['MSR.png', 'Crista supracondilar medial', 'medial supracondylar ridge'], ['OF.png', 'Fossa do olécrano', 'olecranon fossa'],
      ['Troc.png', 'Tróclea do úmero', 'trochlea'], ['RH.png', 'Cabeça do rádio', 'head of radius'], ['NR.png', 'Colo do rádio', 'neck of radius'],
      ['RT.png', 'Tuberosidade do rádio', 'radial tubercle'], ['RNU.png', 'Incisura radial da ulna', 'radial notch of ulna'],
    ],
  }),
  montarEstudo({
    id: 'elbowLat', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Cotovelo', incidencia: 'Perfil', pasta: 'arm', imagem: 'elbowLat.png',
    camada: 'Coxins adiposos e congruência',
    resumo: 'Onde um coxim posterior visível já significa fratura, mesmo sem traço nenhum aparente.',
    foco: 'O perfil a 90° evidencia congruência e derrame. Observe coxins adiposos anterior e posterior, olécrano e incisura troclear; um coxim posterior visível em adulto é anormal até prova em contrário.',
    estruturas: [
      ['CP.png', 'Processo coronoide', 'coronoid process'], ['HumLat.png', 'Úmero', 'humerus'], ['Ole.png', 'Olécrano', 'olecranon'],
      ['RadLat.png', 'Rádio', 'radius'], ['TN.png', 'Incisura troclear', 'trochlear notch'], ['UlnaLat.png', 'Ulna', 'ulna'], ['UT.png', 'Tuberosidade da ulna', 'ulnar tuberosity'],
    ],
  }),
  montarEstudo({
    id: 'handAP', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Mão e punho', incidencia: 'PA', pasta: 'arm', imagem: 'handAP.png',
    camada: 'Carpo completo e raios digitais',
    resumo: 'Os oito ossos do carpo, os arcos de Gilula e o escafoide que não se pode perder.',
    foco: 'Percorra falanges, metacarpos e duas fileiras do carpo. Os arcos de Gilula devem ser suaves e paralelos; interrupção, alargamento escafolunar ou desalinhamento sugere lesão ligamentar ou luxação.',
    estruturas: [
      ['MC.png', 'Metacarpos', 'metacarpals'], ['RS.png', 'Processo estiloide do rádio', 'radial styloid'], ['RadHand.png', 'Rádio', 'radius'], ['UlnaHand.png', 'Ulna', 'ulna'], ['US.png', 'Processo estiloide da ulna', 'ulnar styloid'],
      ['Capit.png', 'Capitato', 'capitate'], ['Ham.png', 'Hamato', 'hamate'], ['Lun.png', 'Semilunar', 'lunate'], ['Pisi.png', 'Pisiforme', 'pisiform'],
      ['Scaph.png', 'Escafoide', 'scaphoid'], ['Trapzm.png', 'Trapézio', 'trapezium'], ['Trapzd.png', 'Trapezoide', 'trapezoid'], ['Triqu.png', 'Piramidal', 'triquetrum'],
      ['DP.png', 'Falanges distais', 'distal'], ['MP.png', 'Falanges médias', 'middle'], ['PP.png', 'Falanges proximais', 'proximal'],
    ],
  }),
  montarEstudo({
    id: 'handLat', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Mão e punho', incidencia: 'Perfil', pasta: 'arm', imagem: 'handLat.png',
    camada: 'Eixo rádio-semilunar-capitato',
    resumo: 'A coluna central do punho: onde a luxação perilunar aparece e a AP engana.',
    foco: 'O perfil mostra alinhamento rádio-semilunar-capitato e relações do polegar. Os metacarpos tendem a se sobrepor; desalinhamento do carpo no eixo central é sinal de instabilidade.',
    estruturas: [
      ['DP1.png', 'Falange distal do polegar', '1st distal phalanx'], ['MC1.png', 'Primeiro metacarpo', '1st metacarpal'], ['PP1.png', 'Falange proximal do polegar', '1st proximal phalanx'],
      ['RadHandL.png', 'Rádio', 'radius'], ['UlnaHandL.png', 'Ulna', 'ulna'], ['USlat.png', 'Processo estiloide da ulna', 'ulnar styloid'],
      ['captL.png', 'Capitato', 'capitate'], ['lunL.png', 'Semilunar', 'lunate'], ['pisL.png', 'Pisiforme', 'pisiform'],
      ['scapL.png', 'Escafoide', 'scaphoid'], ['tzmL.png', 'Trapézio', 'trapezium'], ['tzdL.png', 'Trapezoide', 'trapezoid'], ['triqL.png', 'Piramidal', 'triquetrum'],
    ],
  }),
  montarEstudo({
    id: 'backAP', regiao: 'coluna-lombar', regiaoTitulo: 'Coluna lombar', titulo: 'Coluna lombar', incidencia: 'AP', pasta: 'back', imagem: 'back.png',
    camada: 'Corpos, pedículos e transição lombossacra',
    resumo: 'Contagem de níveis, simetria de pedículos e a transição para o sacro.',
    foco: 'Conte as vértebras, confira alinhamento dos processos espinhosos e simetria dos pedículos, depois compare corpos, espaços discais, processos transversos, sacro e articulações sacroilíacas.',
    estruturas: [
      ['IVD.png', 'Espaços discais intervertebrais', 'intervertebral discs'], ['Ped.png', 'Pedículos', 'pedicles'], ['Rib.png', 'Costelas', 'ribs'],
      ['Sacr.png', 'Sacro', 'sacrum'], ['SP.png', 'Processos espinhosos', 'spinous processes'], ['TP.png', 'Processos transversos', 'transverse processes'],
    ],
  }),
]

export const GUIAS_RAIO_X: Record<RegiaoRaioX, GuiaRegiaoRaioX> = {
  torax: {
    contexto:
      'Na radiografia de tórax, dezenas de estruturas tridimensionais são projetadas em uma imagem bidimensional. O que se vê não é um órgão, e sim a soma das densidades que o feixe atravessou — por isso duas estruturas de densidades diferentes em contato geram uma borda, e duas de mesma densidade em contato apagam essa borda (o sinal da silhueta). A leitura segura depende de técnica, comparação bilateral e uma sequência fixa que cubra vias aéreas, mediastino, hilos, pulmões, pleuras, diafragma, ossos e partes moles.',
    tecnica:
      'Prefira PA em ortostase, com o paciente encostado no detector, e perfil esquerdo quando ele coopera. A distância foco-filme de 1,80 m minimiza a magnificação cardíaca; o feixe AP portátil, feito a 1 m e com o coração mais distante do detector, amplia a silhueta e nunca deve ser usado para diagnosticar cardiomegalia. Inspiração adequada costuma mostrar 9 a 10 arcos costais posteriores acima do diafragma; a rotação é estimada pela distância entre os processos espinhosos e as extremidades mediais das clavículas.',
    qualidade: [
      'Identifique projeção (PA, AP, perfil), posição (ortostase ou decúbito) e o marcador de lado antes de qualquer descrição.',
      'Inspiração: 9 a 10 arcos costais posteriores ou 5 a 6 anteriores acima do hemidiafragma direito.',
      'Rotação: os processos espinhosos devem estar equidistantes das extremidades mediais das clavículas.',
      'Penetração: os corpos vertebrais devem ser discretamente visíveis através da silhueta cardíaca, e os vasos, visíveis até a periferia.',
      'Movimento: bordas do diafragma e do coração nítidas; borramento indica exposição durante o ciclo respiratório.',
      'Cobertura: ápices e ambos os seios costofrênicos inteiramente incluídos no campo.',
    ],
    roteiro: [
      { passo: 'A — via aérea', detalhe: 'Traqueia central ou com desvio fisiológico mínimo à direita; carina em torno de T4-T5; brônquios principais simétricos.' },
      { passo: 'B — respiração', detalhe: 'Compare transparência dos dois pulmões por zonas, siga a trama vascular até a periferia e procure a linha pleural visceral nos ápices.' },
      { passo: 'C — circulação', detalhe: 'Índice cardiotorácico, sequência dos arcos mediastinais, calibre dos vasos hilares e redistribuição de fluxo para os ápices.' },
      { passo: 'D — diafragma', detalhe: 'Cúpulas, altura relativa, nitidez dos contornos, seios costofrênicos e a região subdiafragmática à procura de ar livre.' },
      { passo: 'E — extras', detalhe: 'Ossos (costelas, clavículas, úmeros, coluna), partes moles, enfisema subcutâneo e todos os dispositivos: tubo, cateteres, sondas, eletrodos.' },
      { passo: 'R — revisão dos cantos', detalhe: 'Volte deliberadamente às quatro áreas mais esquecidas: ápices, região retrocardíaca, abaixo dos diafragmas e seios costofrênicos.' },
    ],
    armadilhas: [
      'AP portátil e baixa inspiração ampliam a silhueta cardíaca e criam "cardiomegalia" que não existe.',
      'Mamilo, dobra de pele, cabelo trançado e borda de escápula simulam nódulo, pneumotórax ou opacidade.',
      'Pneumotórax em decúbito não sobe para o ápice: ele se acumula anteriormente e aparece como seio costofrênico anormalmente profundo (deep sulcus sign).',
      'A rotação desloca aparentemente traqueia e mediastino e cria assimetria de transparência pulmonar.',
      'Um filme subpenetrado escurece as bases e "cria" opacidade retrocardíaca inexistente.',
    ],
    perolas: [
      'O sinal da silhueta localiza a lesão: opacidade que apaga a borda cardíaca direita está no lobo médio; que apaga a borda esquerda, na língula; que preserva a borda e apaga o diafragma, nos lobos inferiores.',
      'O hilo esquerdo está normalmente 1 a 2 cm mais alto que o direito — hilos no mesmo nível já são um dado.',
      'Broncograma aéreo dentro de uma opacidade indica preenchimento alveolar com via aérea pérvia: consolidação, e não massa nem derrame.',
      'Ar livre subdiafragmático só é confiável em ortostase mantida por alguns minutos; em decúbito, procure o sinal da parede dupla (Rigler).',
      'Uma radiografia normal não exclui embolia pulmonar — o valor dela ali é excluir alternativas.',
    ],
    medidas: [
      { rotulo: 'Índice cardiotorácico', valor: '< 0,50 em PA', nota: 'Só interpretável em PA ortostática bem inspirada.' },
      { rotulo: 'Arcos costais posteriores', valor: '9 a 10', nota: 'Critério de inspiração adequada.' },
      { rotulo: 'Veia ázigos', valor: '≤ 10 mm em ortostase', nota: 'Aumenta em hipervolemia e em decúbito.' },
      { rotulo: 'Traqueia', valor: 'Central, desvio mínimo à direita', nota: 'Desvio maior exige explicar volume ou massa.' },
      { rotulo: 'Derrame visível na PA', valor: 'A partir de ~200 mL', nota: 'O perfil detecta a partir de ~50 mL no seio posterior.' },
    ],
    quandoAvancar:
      'A tomografia entra quando a radiografia mostra achado indeterminado (nódulo, massa, opacidade persistente), quando a suspeita é vascular (embolia, dissecção, lesão aórtica traumática), quando há discordância entre clínica grave e filme pouco alterado, e sempre que a decisão terapêutica depender de caracterizar o que a projeção apenas sugeriu. A ultrassonografia à beira do leito supera a radiografia para derrame, pneumotórax e guia de punção.',
  },
  cabeca: {
    contexto:
      'A radiografia de crânio é uma projeção de sobreposição extrema: em cada ponto do filme somam-se tábua externa, díploe, tábua interna, base e o lado oposto do crânio. Isso a torna um bom instrumento didático para reconhecer calota, base, ossos da face, suturas e cavidades aeradas — e um mau instrumento diagnóstico no trauma, onde o alvo real é o conteúdo intracraniano, que ela não mostra. O objetivo aqui é anatômico: saber o que é osso, o que é sutura, o que é sulco vascular e o que é ar.',
    tecnica:
      'Centralização rigorosa e ausência de rotação são essenciais, porque toda a leitura se apoia em comparação bilateral. Na incidência frontal, a simetria das órbitas e a posição das porções petrosas dentro delas indicam a angulação; no perfil verdadeiro, os dois rochedos temporais e as duas órbitas se sobrepõem. As incidências de seios exigem posição ortostática com raio horizontal, sem o que os níveis líquidos desaparecem.',
    qualidade: [
      'Simetria bilateral: órbitas de mesmo tamanho e rochedos temporais na mesma altura.',
      'No perfil, sobreposição dos ramos mandibulares, das órbitas e dos assoalhos da fossa anterior.',
      'Exposição que mostre simultaneamente a calota fina e a base densa — em geral exige duas janelas de leitura.',
      'Incidência de seios feita em ortostase e com raio horizontal, sob pena de perder níveis líquidos.',
      'Todo o crânio incluído, do vértice à junção craniocervical.',
    ],
    roteiro: [
      { passo: 'Calota', detalhe: 'Percorra a curva externa completa procurando degrau, afundamento e linha radiotransparente que cruze sulcos.' },
      { passo: 'Suturas', detalhe: 'Identifique coronal, sagital e lambdoide e memorize seus trajetos — é o que impede chamá-las de fratura.' },
      { passo: 'Base e sela', detalhe: 'Avalie o assoalho das fossas, o contorno da sela túrcica e os processos clinoides.' },
      { passo: 'Cavidades aeradas', detalhe: 'Compare frontais, etmoidais, maxilares, esfenoidal e mastoides quanto a transparência, paredes e níveis.' },
      { passo: 'Face', detalhe: 'Órbitas, zigomas, arcos, maxila, septo nasal e mandíbula, sempre comparando os dois lados.' },
      { passo: 'Partes moles e ar', detalhe: 'Procure edema, corpos estranhos radiopacos e ar intracraniano — pneumoencéfalo é sinal indireto de fratura com comunicação.' },
    ],
    armadilhas: [
      'Suturas e sulcos vasculares são as duas causas mais comuns de falsa fratura: suturas têm trajeto conhecido, serrilhado e bordas escleróticas; sulcos vasculares ramificam e afilam.',
      'Ossos wormianos na sutura lambdoide parecem fragmentos ósseos livres.',
      'Rotação mínima cria assimetria orbitária e zigomática convincente o suficiente para gerar diagnóstico de afundamento inexistente.',
      'Um crânio radiograficamente normal não exclui hematoma epidural, subdural ou contusão — a decisão no trauma é clínica e tomográfica.',
      'Velamento sinusal em criança é achado extremamente comum e frequentemente inespecífico.',
    ],
    perolas: [
      'Fratura é retilínea, mais radiotransparente que uma sutura e não respeita limites ósseos; sutura respeita.',
      'Nível líquido no seio esfenoidal em politrauma é um dos melhores sinais indiretos de fratura de base de crânio.',
      'Desvio da glândula pineal calcificada da linha média sugere efeito de massa — um dos poucos sinais intracranianos da radiografia simples.',
      'Na fratura tripé, procure três pontos: borda infraorbitária, sutura frontozigomática e arco zigomático, com hemossinus maxilar homolateral.',
      'Fratura mandibular tende a ser dupla: achou uma, procure a segunda, com atenção ao côndilo contralateral.',
    ],
    medidas: [
      { rotulo: 'Espessura da calota', valor: '~4 a 8 mm no adulto', nota: 'Varia muito por região e idade.' },
      { rotulo: 'Sela túrcica', valor: 'Até ~16 mm de diâmetro anteroposterior', nota: 'Alargamento com duplo assoalho sugere massa selar.' },
      { rotulo: 'Glândula pineal calcificada', valor: 'Na linha média', nota: 'Calcifica em boa parte dos adultos; desvio indica massa.' },
      { rotulo: 'Espaço pré-vertebral em C2', valor: '≤ 7 mm', nota: 'Avaliado no perfil que inclui a junção craniocervical.' },
    ],
    quandoAvancar:
      'No trauma de crânio, a decisão de imagem segue regras clínicas (Canadian CT Head, NEXUS) e o exame indicado é a tomografia sem contraste, não a radiografia. Suspeita de fratura de base, de osso temporal, de assoalho orbitário ou de complicação de sinusite pede tomografia; suspeita de lesão de partes moles intracranianas, de nervo óptico ou de lesão vascular pede ressonância ou angiotomografia.',
  },
  abdome: {
    contexto:
      'A radiografia simples do abdome é uma visão global de gás, gordura, partes moles, calcificações e esqueleto. O que a torna legível é o contraste natural entre esses quatro tons: o gás intraluminal desenha as alças, e a gordura peritoneal e retroperitoneal desenha os contornos de fígado, rins, psoas e bexiga. Seu valor real está em reconhecer padrões — obstrução, íleo, pneumoperitônio, corpo estranho, posição de dispositivo — e não em caracterizar doença de órgão.',
    tecnica:
      'A incidência AP em decúbito dorsal deve incluir dos hemidiafragmas à sínfise púbica. Quando a pergunta é ar livre ou nível hidroaéreo, acrescente ortostase (ou decúbito lateral esquerdo com raio horizontal no paciente que não fica em pé) e mantenha a posição por alguns minutos antes do disparo, para que o ar migre. Uma radiografia de tórax em ortostase costuma ser mais sensível para pneumoperitônio que a própria radiografia de abdome.',
    qualidade: [
      'Cobertura completa: cúpulas diafragmáticas e sínfise púbica dentro do campo.',
      'Ausência de rotação, julgada pela simetria das asas ilíacas e dos forames obturatórios.',
      'Exposição suficiente para ver contornos de psoas, rins e corpos vertebrais sem apagar o padrão gasoso.',
      'Ausência de borramento por movimento, que apaga justamente os contornos de partes moles.',
      'Incidência com raio horizontal registrada como tal, sob pena de níveis serem interpretados fora de contexto.',
    ],
    roteiro: [
      { passo: 'Gás', detalhe: 'Localize estômago, delgado, cólon e reto; avalie calibre, distribuição e presença de gás distal ao ponto suspeito.' },
      { passo: 'Onde o gás não deveria estar', detalhe: 'Procure ar livre subdiafragmático, ar na parede intestinal, na árvore biliar, na porta e no retroperitônio.' },
      { passo: 'Partes moles', detalhe: 'Contornos hepático, esplênico, renais, dos psoas e da bexiga; procure massas e apagamento assimétrico.' },
      { passo: 'Calcificações', detalhe: 'Defina localização e forma: flebólitos pélvicos, cálculos urinários, calcificação vascular, pancreática ou vesicular.' },
      { passo: 'Osso', detalhe: 'Costelas inferiores, coluna, sacro, pelve e quadris — fraturas e lesões líticas se escondem nas bordas do filme.' },
      { passo: 'Dispositivos', detalhe: 'Confira posição de sondas, cateteres, drenos, stents e material cirúrgico, e compare com exames anteriores.' },
    ],
    armadilhas: [
      'Conteúdo fecal cria padrão moteado que imita massa, pneumatose e coleção.',
      'Flebólitos pélvicos (arredondados, com centro claro) são confundidos com cálculos ureterais distais.',
      'A interposição do cólon entre fígado e diafragma (Chilaiditi) imita pneumoperitônio: procure haustrações dentro da transparência.',
      'Cálculos de ácido úrico são radiotransparentes: uma radiografia sem cálculo não exclui litíase.',
      'Radiografia normal não exclui obstrução precoce, isquemia mesentérica, apendicite nem perfuração coberta.',
    ],
    perolas: [
      'Pregas do delgado (válvulas coniventes) atravessam toda a luz; haustrações do cólon não — é o que separa os dois padrões de obstrução.',
      'Delgado é central e de calibre menor; cólon é periférico, maior e com conteúdo fecal.',
      'Imagem em "grão de café" apontando do quadrante inferior esquerdo para o hipocôndrio direito é volvo de sigmoide até prova em contrário.',
      'O sinal de Rigler (parede intestinal visível dos dois lados) indica pneumoperitônio em filme feito em decúbito.',
      'Ar na árvore biliar é central e ramificado; ar na veia porta é periférico e chega à cápsula hepática — o segundo é muito mais grave.',
    ],
    medidas: [
      { rotulo: 'Delgado dilatado', valor: '> 3 cm', nota: 'Com níveis escalonados e cólon vazio, sugere obstrução de delgado.' },
      { rotulo: 'Cólon dilatado', valor: '> 6 cm', nota: 'Limiar geral do cólon transverso.' },
      { rotulo: 'Ceco dilatado', valor: '> 9 cm', nota: 'Risco de perfuração por tensão de parede.' },
      { rotulo: 'Rim normal', valor: '~3 corpos vertebrais de altura', nota: 'Direito discretamente mais baixo que o esquerdo.' },
      { rotulo: 'Pneumoperitônio em ortostase', valor: 'Detectável a partir de ~1 a 2 mL', nota: 'Exige alguns minutos em pé antes do disparo.' },
    ],
    quandoAvancar:
      'A tomografia com contraste é o exame de escolha no abdome agudo com sinais de gravidade, na suspeita de isquemia, na obstrução para definir nível e causa e no trauma estável. A ultrassonografia é primeira linha em dor de hipocôndrio direito, suspeita de apendicite em criança e gestante, e em toda pergunta sobre vesícula, vias biliares e pelve feminina.',
  },
  ombro: {
    contexto:
      'A cintura escapular combina três articulações verdadeiras (esternoclavicular, acromioclavicular e glenoumeral) e um plano de deslizamento escapulotorácico, com ossos que se sobrepõem em quase toda incidência. Ler o ombro é ler relações: a cabeça umeral deve estar centrada na glenoide, a clavícula deve estar alinhada com o acrômio, e o espaço subacromial deve ter altura suficiente. A anatomia demarcada aqui existe para que essas relações deixem de ser abstratas.',
    tecnica:
      'Uma única AP não avalia o ombro traumatizado, porque a luxação posterior pode parecer congruente nessa projeção. O conjunto mínimo é AP verdadeira (com o tórax rodado cerca de 40°, o que abre o espaço glenoumeral) somada a uma segunda incidência ortogonal — axilar ou escapular em Y. Rotação externa perfila o tubérculo maior; rotação interna perfila o menor. Quando a dor impede a axilar, a incidência de Velpeau é a alternativa.',
    qualidade: [
      'AP verdadeira: espaço glenoumeral aberto, sem sobreposição entre cabeça umeral e borda glenoidal.',
      'Segunda incidência ortogonal presente — sem ela, a luxação posterior é sistematicamente perdida.',
      'Clavícula inteira e articulação acromioclavicular incluídas.',
      'Exposição que mostre trabeculado do úmero proximal sem apagar as partes moles do manguito.',
      'Ápice pulmonar e arcos costais superiores dentro do campo, porque lesão de ombro e pneumotórax convivem.',
    ],
    roteiro: [
      { passo: 'Alinhamento', detalhe: 'Cabeça umeral centrada na glenoide; borda inferior da clavícula alinhada à borda inferior do acrômio.' },
      { passo: 'Osso a osso', detalhe: 'Clavícula inteira, acrômio, coracoide, corpo e colo da escápula, glenoide, cabeça, tubérculos e colos do úmero.' },
      { passo: 'Espaços', detalhe: 'Espaço glenoumeral, acromioclavicular e subacromial; a redução do subacromial sugere ruptura crônica do manguito.' },
      { passo: 'Superfície articular', detalhe: 'Procure impactação posterolateral da cabeça (Hill-Sachs) e defeito da borda glenoidal anteroinferior (Bankart ósseo).' },
      { passo: 'Partes moles', detalhe: 'Calcificações peritendíneas, corpos livres, enfisema e assimetria de contorno muscular.' },
      { passo: 'Além do ombro', detalhe: 'Revise ápice pulmonar, costelas e coluna cervical incluídos — trauma de alta energia raramente é local.' },
    ],
    armadilhas: [
      'Luxação posterior parece congruente na AP: o sinal da "lâmpada" (cabeça arredondada em rotação interna fixa) e o alargamento do espaço glenoumeral são as pistas.',
      'A borda medial da escápula sobreposta ao pulmão é o falso pneumotórax mais comum da radiografia de tórax.',
      'Em rotação interna, o tubérculo maior gira para posterior e a fratura pode sumir do filme.',
      'O processo coracoide sobreposto à cabeça umeral cria uma densidade que imita lesão de Hill-Sachs.',
      'Fratura de escápula é sinal de alta energia: interpretá-la isoladamente faz perder lesões torácicas associadas.',
    ],
    perolas: [
      'Fratura de colo cirúrgico é a mais comum do úmero proximal no idoso, e o nervo axilar corre ali: teste a sensibilidade sobre o deltoide antes e depois de qualquer manobra.',
      'Fratura do colo anatômico é rara mas ameaça a vascularização da cabeça — a distinção entre os dois colos muda o prognóstico.',
      'Espaço subacromial menor que 7 mm sugere ruptura crônica e completa do manguito rotador.',
      'Avulsão do tubérculo menor é o marcador ósseo clássico da luxação posterior.',
      'Fratura de colo da escápula com fratura de clavícula ipsilateral configura ombro flutuante e muda a indicação cirúrgica.',
    ],
    medidas: [
      { rotulo: 'Espaço glenoumeral', valor: '~4 a 6 mm na AP verdadeira', nota: 'Alargamento sugere luxação posterior ou derrame.' },
      { rotulo: 'Espaço subacromial', valor: '7 a 14 mm', nota: 'Abaixo de 7 mm indica ruptura crônica do manguito.' },
      { rotulo: 'Articulação acromioclavicular', valor: '≤ 6 a 8 mm', nota: 'Compare sempre com o lado contralateral.' },
      { rotulo: 'Desvio do tubérculo maior', valor: '> 5 mm', nota: 'Limiar habitual para indicação cirúrgica.' },
    ],
    quandoAvancar:
      'A tomografia define fraturas complexas do úmero proximal e da glenoide e quantifica perda óssea na instabilidade recidivante. A ressonância é o exame do manguito rotador, do lábio glenoidal e do tendão do bíceps, e a ultrassonografia dinâmica é uma alternativa acessível para o manguito em mãos experientes.',
  },
  'membro-inferior': {
    contexto:
      'Joelho, perna e tornozelo formam uma cadeia de carga: a energia que fratura um segmento frequentemente se dissipa em outro. A radiografia avalia bem alinhamento, continuidade cortical, interlinhas e, indiretamente, o líquido articular pelos planos adiposos. O que ela não avalia é o que mais dói: menisco, ligamentos e cartilagem. Saber ler os sinais indiretos — derrame, lipo-hemartrose, deslocamento de coxins — é o que transforma um filme "normal" em um diagnóstico.',
    tecnica:
      'AP e perfil verdadeiros são o mínimo, e em osso longo as duas articulações adjacentes precisam estar no campo. No joelho, o perfil deve ser feito com raio horizontal quando se procura lipo-hemartrose, porque só assim o nível gorduroso aparece. A radiografia de joelho com carga (em ortostase) é a que mede corretamente o espaço articular na artrose; feita deitado, ela subestima o estreitamento.',
    qualidade: [
      'Perfil verdadeiro do joelho: côndilos femorais quase sobrepostos — se não estão, medidas de alinhamento perdem valor.',
      'AP sem rotação: patela centrada sobre a região intercondilar.',
      'Osso longo com joelho e tornozelo incluídos no mesmo filme.',
      'Perfil com raio horizontal quando a pergunta é derrame ou lipo-hemartrose.',
      'Exposição que mostre trabeculado subcondral sem apagar os planos adiposos.',
    ],
    roteiro: [
      { passo: 'Alinhamento', detalhe: 'Eixo femorotibial, congruência articular e relação da patela com a tróclea.' },
      { passo: 'Osso', detalhe: 'Percorra cada cortical de ponta a ponta nas duas incidências, procurando degrau, banda de esclerose e reação periosteal.' },
      { passo: 'Superfície articular', detalhe: 'Platôs tibiais: procure depressão e degrau, que definem a indicação cirúrgica.' },
      { passo: 'Cartilagem e interlinha', detalhe: 'Compare medial e lateral; em ortostase, o estreitamento assimétrico é o dado da artrose.' },
      { passo: 'Partes moles', detalhe: 'Recesso suprapatelar, coxins adiposos, tendões quadricipital e patelar, edema focal e corpos estranhos.' },
      { passo: 'Revisão', detalhe: 'Volte às áreas de sobreposição — cabeça da fíbula, espinhas tibiais, patela no perfil — e cheque a incidência ortogonal.' },
    ],
    armadilhas: [
      'Patela bipartita no quadrante superolateral, com bordas corticais arredondadas, é variante normal e o falso-positivo mais comum.',
      'Fossa intercondilar e sulcos vasculares criam transparências que imitam lesão lítica.',
      'A rotação altera a largura aparente das interlinhas e invalida a comparação medial-lateral.',
      'Fratura de platô com depressão pura é sutil na AP e frequentemente só é dimensionada na tomografia.',
      'Radiografia de tornozelo isolada não exclui fratura de Maisonneuve — sem incluir a fíbula proximal, a lesão passa.',
    ],
    perolas: [
      'Derrame no recesso suprapatelar maior que 5 mm em trauma agudo é fratura intra-articular até prova em contrário.',
      'Lipo-hemartrose (nível gordura-sangue no perfil com raio horizontal) é praticamente patognomônica de fratura intra-articular.',
      'A cabeça da fíbula marca o lado lateral e orienta toda a leitura do joelho.',
      'Avulsão da estilóide fibular (sinal do arqueado) indica lesão do canto posterolateral, frequentemente subestimada.',
      'Fratura de calcâneo por queda obriga a radiografar coluna toracolombar e o calcâneo contralateral.',
    ],
    medidas: [
      { rotulo: 'Derrame no recesso suprapatelar', valor: '> 5 mm', nota: 'Medido no perfil, entre os coxins adiposos.' },
      { rotulo: 'Degrau articular do platô tibial', valor: '> 2 mm', nota: 'Limiar habitual de indicação cirúrgica.' },
      { rotulo: 'Índice de Insall-Salvati', valor: '0,8 a 1,2', nota: 'Razão entre comprimento do tendão patelar e altura da patela.' },
      { rotulo: 'Ângulo de Böhler (calcâneo)', valor: '20° a 40°', nota: 'Redução indica fratura com afundamento.' },
    ],
    quandoAvancar:
      'A ressonância é o exame de menisco, ligamentos cruzados e colaterais, cartilagem e fratura oculta por estresse. A tomografia dimensiona depressão de platô, fraturas complexas do pilão tibial e do calcâneo. As regras de Ottawa para joelho e tornozelo continuam sendo o melhor filtro para decidir se a radiografia é sequer necessária.',
  },
  pelve: {
    contexto:
      'A pelve é um anel osteoligamentar: mecanicamente, um anel não se rompe em um ponto só. Essa única ideia organiza toda a leitura — encontrada uma fratura, existe uma segunda lesão até prova em contrário, e ela costuma estar no arco posterior (sacro, articulação sacroilíaca), que é exatamente onde o sangramento acontece e onde a radiografia frontal é menos sensível. Sobre o anel se apoia a leitura do quadril, com suas linhas e arcos previsíveis.',
    tecnica:
      'Na AP de rotina os membros inferiores são rodados internamente cerca de 15°, para perfilar os colos femorais — manobra que não se faz na suspeita de fratura. A simetria dos forames obturatórios e das asas ilíacas indica rotação; a relação entre sínfise e cóccix indica inclinação. As incidências inlet e outlet avaliam deslocamento anteroposterior e vertical do anel; a incidência em rã perfila o colo femoral, mas é contraindicada quando há suspeita de fratura instável.',
    qualidade: [
      'Simetria dos forames obturatórios e das asas ilíacas — pré-requisito de qualquer comparação.',
      'Cóccix alinhado com a sínfise púbica, indicando ausência de inclinação excessiva.',
      'Trocânteres menores igualmente visíveis, sinal de rotação simétrica dos membros.',
      'Cobertura das cristas ilíacas aos trocânteres menores.',
      'Exposição que revele o trabeculado do colo femoral e as linhas acetabulares.',
    ],
    roteiro: [
      { passo: 'Anel', detalhe: 'Percorra o estreito superior por inteiro: promontório, linhas arqueadas, ramos púbicos e sínfise.' },
      { passo: 'Arco posterior', detalhe: 'Sacro (linhas dos forames), articulações sacroilíacas e asas ilíacas — é onde estão as lesões que sangram.' },
      { passo: 'Acetábulos', detalhe: 'Cheque as seis linhas de Judet: iliopectínea, ilioisquiática, teto, gota de lágrima, parede anterior e parede posterior.' },
      { passo: 'Quadris', detalhe: 'Altura e esfericidade das cabeças, espaço articular, linha de Shenton e continuidade das corticais do colo.' },
      { passo: 'Rotação e simetria', detalhe: 'Trocânteres menores, forames obturatórios e distância entre cabeça femoral e teto acetabular dos dois lados.' },
      { passo: 'Partes moles', detalhe: 'Gordura pericapsular, contorno vesical e calcificações; e o esqueleto restante incluído no campo.' },
    ],
    armadilhas: [
      'Rotação da pelve altera simetria de asas, forames e espaço articular do quadril, criando achados inexistentes.',
      'Fratura sacral por insuficiência no idoso é frequentemente invisível na radiografia, mesmo com dor incapacitante.',
      'A sincondrose isquiopúbica da criança é irregular e assimétrica por natureza — não é fratura nem lesão lítica.',
      'Gás intestinal sobreposto à asa ilíaca e ao sacro imita e esconde traços de fratura.',
      'A incidência em rã não deve ser forçada em suspeita de fratura de colo: ela pode desviar uma fratura impactada.',
    ],
    perolas: [
      'Linha de Shenton — arco contínuo entre a borda inferior do colo femoral e a borda superior do forame obturatório — quebrada significa fratura ou luxação.',
      'Trocânter menor muito proeminente indica rotação externa do membro, achado clássico da fratura de quadril.',
      'Fratura isolada do trocânter menor em adulto sem trauma é lesão patológica até prova em contrário.',
      'Diástase da sínfise maior que 2,5 cm implica ruptura do assoalho pélvico e lesão do arco posterior.',
      'Na epifisiólise proximal do fêmur, a linha de Klein deixa de cruzar a epífise — e o achado costuma ser visível apenas na incidência em rã.',
    ],
    medidas: [
      { rotulo: 'Sínfise púbica', valor: '≤ 5 mm no adulto', nota: 'Acima de 25 mm indica lesão em livro aberto.' },
      { rotulo: 'Articulação sacroilíaca', valor: '2 a 4 mm', nota: 'Assimetria após trauma sugere disjunção.' },
      { rotulo: 'Espaço articular do quadril', valor: '3 a 5 mm, simétrico', nota: 'Redução superolateral é o padrão da artrose.' },
      { rotulo: 'Ângulo centro-borda (Wiberg)', valor: '> 25°', nota: 'Abaixo de 20° indica displasia acetabular.' },
    ],
    quandoAvancar:
      'A tomografia é obrigatória na fratura pélvica de alta energia, para caracterizar arco posterior e acetábulo, e é o exame que orienta a cirurgia. A ressonância detecta fratura oculta de colo femoral e fratura sacral por insuficiência quando a radiografia é normal e a dor persiste — cenário frequente no idoso após queda.',
  },
  'coluna-cervical': {
    contexto:
      'A coluna cervical deve ser lida como uma unidade de C1 até a junção C7-T1, e não como vértebras isoladas. A leitura se apoia em quatro linhas de alinhamento no perfil, na altura dos corpos e discos, na relação entre C1 e o odontoide e na espessura das partes moles pré-vertebrais. O nível C7-T1 é o mais frequentemente lesado e o mais frequentemente cortado do filme — a coincidência dessas duas frases é a razão pela qual lesões cervicais são perdidas.',
    tecnica:
      'A série clássica é perfil, AP e transoral; oblíquas perfilam os forames. O perfil precisa incluir a junção C7-T1: se não incluir, tracione os ombros ou faça a incidência do nadador — ou, na prática atual, indique tomografia. Em trauma, as regras NEXUS e a Canadian C-Spine Rule definem quem precisa de imagem, e a tomografia substituiu a radiografia como exame de escolha na maioria dos serviços.',
    qualidade: [
      'O perfil deve mostrar de C1 até a face superior de T1 — um perfil que para em C6 não é um exame, é um exame incompleto.',
      'Na AP, os processos espinhosos devem estar alinhados na linha média.',
      'Na transoral, odontoide e massas laterais de C1 livres de sobreposição dos incisivos e do occipital.',
      'Ausência de rotação, julgada pela sobreposição das colunas articulares no perfil.',
      'Exposição que permita ver simultaneamente partes moles pré-vertebrais e o osso.',
    ],
    roteiro: [
      { passo: 'Alinhamento — 4 linhas', detalhe: 'Anterior dos corpos, posterior dos corpos, espinolaminar e pontas dos processos espinhosos; todas devem formar curvas suaves.' },
      { passo: 'Ossos', detalhe: 'Contorno de cada corpo, altura anterior e posterior, pedículos, lâminas e processos espinhosos.' },
      { passo: 'Cartilagem e discos', detalhe: 'Altura dos espaços discais e paralelismo dos platôs, comparando níveis vizinhos.' },
      { passo: 'Articulações', detalhe: 'Pilares articulares empilhados como telhas; espaço atlanto-odontoide e articulações atlantoaxiais laterais simétricas.' },
      { passo: 'Partes moles', detalhe: 'Espessura pré-vertebral: aumento é sinal indireto de hematoma e pode ser a única alteração visível.' },
      { passo: 'Junção C7-T1', detalhe: 'Confirme explicitamente que o nível foi visto; sua ausência invalida a exclusão de lesão.' },
    ],
    armadilhas: [
      'Um perfil que não mostra C7-T1 não exclui lesão, por melhor que pareça o restante.',
      'Rotação da cabeça na transoral cria assimetria dos espaços entre o dente e as massas laterais e imita subluxação.',
      'A sobreposição dos incisivos e do occipital gera linhas transparentes que imitam fratura da base do odontoide.',
      'Pseudossubluxação de C2 sobre C3 é fisiológica na criança e segue a linha espinolaminar — que permanece contínua.',
      'Defeito congênito de fusão do arco posterior de C1 tem bordas corticais lisas e não é fratura.',
    ],
    perolas: [
      'Espaço pré-vertebral: até cerca de 7 mm em C2 e até cerca de 22 mm em C6 no adulto — aumento é bandeira vermelha.',
      'Intervalo atlanto-odontoide até 3 mm no adulto e até 5 mm na criança; acima disso, pense em lesão do ligamento transverso.',
      'A linha espinolaminar é a mais confiável das quatro: seu degrau maior que 2 mm indica lesão real.',
      'O "sinal da gravata borboleta" no perfil — parte da coluna oblíqua e parte em perfil verdadeiro — indica luxação facetária unilateral.',
      'Fratura de processo transverso cervical envolve o forame transversário e levanta suspeita de lesão de artéria vertebral.',
    ],
    medidas: [
      { rotulo: 'Espaço pré-vertebral em C2', valor: '≤ 7 mm', nota: 'Regra prática: até 1/3 da largura do corpo vertebral.' },
      { rotulo: 'Espaço pré-vertebral em C6', valor: '≤ 22 mm no adulto', nota: 'Na criança, até ~14 mm.' },
      { rotulo: 'Intervalo atlanto-odontoide', valor: '≤ 3 mm (adulto) / ≤ 5 mm (criança)', nota: 'Alargamento indica lesão do ligamento transverso.' },
      { rotulo: 'Deslocamento lateral de C1 sobre C2', valor: 'Soma > 7 mm', nota: 'Fratura de Jefferson com ruptura ligamentar.' },
      { rotulo: 'Degrau na linha espinolaminar', valor: '> 2 mm', nota: 'Sugere lesão estrutural, não variação.' },
    ],
    quandoAvancar:
      'Em trauma com indicação de imagem pelas regras clínicas, a tomografia é hoje o exame de primeira linha: ela é mais sensível que a radiografia e cobre a junção cervicotorácica sem depender de posicionamento. A ressonância entra quando há déficit neurológico, suspeita de lesão ligamentar ou medular, e na avaliação de lesão sem alteração radiográfica evidente.',
  },
  'membro-superior': {
    contexto:
      'Cotovelo, punho e mão concentram muitos ossos pequenos, interlinhas estreitas e relações que precisam ser memorizadas para serem verificadas: a linha radiocapitelar no cotovelo, os três arcos de Gilula no punho, o eixo rádio-semilunar-capitato no perfil. A radiografia é excelente nesse território — desde que a leitura seja de relações e planos adiposos, e não apenas a caça de um traço de fratura.',
    tecnica:
      'Duas incidências ortogonais verdadeiras são obrigatórias. No cotovelo, o perfil deve ser feito a 90° de flexão, com o antebraço em supinação neutra, porque só assim os coxins adiposos são interpretáveis. No punho, a PA deve ser feita com o ombro em abdução de 90° e o cotovelo fletido, para padronizar a variância ulnar; a incidência do escafoide (PA com desvio ulnar) alonga o osso e revela traços ocultos na PA convencional.',
    qualidade: [
      'Perfil verdadeiro do cotovelo a 90°, com os coxins adiposos avaliáveis.',
      'PA do punho padronizada: sem rotação e com a ulna e o rádio paralelos.',
      'Dedos individualizados nos perfis digitais — perfil da mão inteira não avalia um dedo específico.',
      'Todas as articulações relevantes incluídas: fratura de antebraço exige ver cotovelo e punho.',
      'Exposição que mostre córtex e trabeculado dos ossos pequenos sem apagar os planos adiposos.',
    ],
    roteiro: [
      { passo: 'Alinhamento e relações', detalhe: 'Linha radiocapitelar no cotovelo; três arcos de Gilula e eixo rádio-semilunar-capitato no punho.' },
      { passo: 'Osso por osso', detalhe: 'Percorra cada cortical: os oito ossos do carpo, os cinco metacarpos e cada falange, nas duas incidências.' },
      { passo: 'Espaços articulares', detalhe: 'Compare intervalos intercarpais — o escafolunar acima de 3 mm indica dissociação.' },
      { passo: 'Planos adiposos', detalhe: 'Coxins do cotovelo e do punho: seu deslocamento pode ser o único sinal de fratura oculta.' },
      { passo: 'Superfície articular distal do rádio', detalhe: 'Meça inclinação radial, altura radial e inclinação volar antes e depois de qualquer redução.' },
      { passo: 'Revisão dirigida', detalhe: 'Volte à tabaqueira anatômica (escafoide), à base do quinto metacarpo e à cabeça do rádio — os pontos mais perdidos.' },
    ],
    armadilhas: [
      'Dor na tabaqueira com radiografia normal é fratura de escafoide até prova em contrário: imobilizar e reavaliar não é excesso, é conduta.',
      'Coxim adiposo posterior visível no cotovelo em perfil a 90° é sempre anormal, mesmo sem traço visível.',
      'Fratura isolada da diáfise ulnar pode ser Monteggia: sem avaliar a cabeça do rádio, a luxação passa.',
      'Fratura do hâmulo do hamato é mal vista na PA e exige incidência de túnel do carpo ou tomografia.',
      'Na criança, a sequência de ossificação (CRITOE) precisa ser conhecida: um "núcleo troclear" sem núcleo do epicôndilo medial é, na verdade, um epicôndilo avulsionado dentro da articulação.',
    ],
    perolas: [
      'A linha radiocapitelar cruza o capítulo em toda e qualquer incidência — se não cruza, há luxação da cabeça do rádio.',
      'Os três arcos de Gilula devem ser contínuos e paralelos; uma quebra indica lesão ligamentar ou luxação carpal.',
      'Semilunar triangular na PA em vez de quadrangular é o sinal da luxação do semilunar.',
      'Espaço escafolunar acima de 3 mm ("sinal de Terry Thomas") indica dissociação escafolunar.',
      'Rotação residual dos dedos, e não angulação, é o que causa cruzamento na flexão — e isso se avalia clinicamente, não no filme.',
    ],
    medidas: [
      { rotulo: 'Espaço escafolunar', valor: '≤ 3 mm', nota: 'Acima disso, dissociação escafolunar.' },
      { rotulo: 'Inclinação radial (PA)', valor: '~22°', nota: 'Referência para avaliar redução do rádio distal.' },
      { rotulo: 'Altura radial', valor: '~11 mm', nota: 'Encurtamento indica impactação.' },
      { rotulo: 'Inclinação volar (perfil)', valor: '~11°', nota: 'Inversão para dorsal caracteriza a deformidade de Colles.' },
      { rotulo: 'Ângulo escafolunar (perfil)', valor: '30° a 60°', nota: 'Acima de 60° sugere instabilidade DISI.' },
    ],
    quandoAvancar:
      'Ressonância ou tomografia definem fratura oculta de escafoide quando a clínica persiste com radiografia normal. A tomografia caracteriza fraturas intra-articulares complexas do rádio distal, do coronoide e do hamato; a ressonância é o exame dos ligamentos intrínsecos do carpo e do complexo da fibrocartilagem triangular.',
  },
  'coluna-lombar': {
    contexto:
      'A radiografia lombar mostra alinhamento coronal e sagital, corpos, pedículos, processos, espaços discais e a transição lombossacra. Ela é boa para estrutura óssea, alinhamento e contagem de níveis — e ruim para tudo que causa a maior parte das lombalgias: disco, canal, raízes e musculatura. Reconhecer essa fronteira é parte do aprendizado: a maioria das lombalgias agudas sem bandeira vermelha não precisa de imagem alguma.',
    tecnica:
      'A AP deve incluir de T12 ao sacro, com rotação mínima, julgada pela simetria dos pedículos e das articulações sacroilíacas. O perfil complementa a avaliação de alinhamento sagital, altura discal e da pars interarticularis; oblíquas mostram o "cachorrinho escocês". Na avaliação de instabilidade, incidências dinâmicas em flexão e extensão são feitas em ortostase, e é a diferença entre elas que informa, não cada filme isolado.',
    qualidade: [
      'Cobertura de T12 ao sacro, com um reparo confiável para contar os níveis.',
      'Pedículos simétricos e processos espinhosos centrados, confirmando ausência de rotação.',
      'Exposição que revele platôs vertebrais e pedículos sem apagar as partes moles paravertebrais.',
      'Perfil verdadeiro, com os corpos vertebrais sem duplo contorno posterior.',
      'Ortostase quando a pergunta envolve alinhamento, listese ou instabilidade.',
    ],
    roteiro: [
      { passo: 'Contagem e transição', detalhe: 'Conte a partir de um reparo confiável e identifique vértebras de transição antes de nomear qualquer nível.' },
      { passo: 'Alinhamento', detalhe: 'Na AP, os processos espinhosos na linha média; no perfil, as bordas anterior e posterior formando curvas contínuas.' },
      { passo: 'Corpos e platôs', detalhe: 'Compare altura anterior e posterior, densidade e integridade dos platôs em todos os níveis.' },
      { passo: 'Arco posterior', detalhe: 'Pedículos (simetria e presença), lâminas, facetas, processos transversos e a pars interarticularis.' },
      { passo: 'Discos e sacro', detalhe: 'Altura dos espaços discais, transição lombossacra e articulações sacroilíacas.' },
      { passo: 'Partes moles e resto do filme', detalhe: 'Contornos dos psoas, calcificação aórtica e os órgãos e ossos incluídos nas bordas do campo.' },
    ],
    armadilhas: [
      'Vértebras de transição fazem errar o nível: numerar sem um reparo confiável é a origem de cirurgias no segmento errado.',
      'Gás intestinal sobreposto imita e esconde lesões líticas e traços de fratura.',
      'Achados degenerativos são quase universais após a meia-idade e correlacionam-se mal com a dor.',
      'Fratura por insuficiência do sacro raramente é vista na radiografia, mesmo com dor intensa no idoso.',
      'Radiografia normal não exclui hérnia discal, estenose de canal, espondilodiscite precoce nem metástase inicial.',
    ],
    perolas: [
      'A distância interpedicular aumenta suavemente de L1 a L5: alargamento abrupto em um nível sugere fratura por explosão.',
      'Pedículo ausente ou erodido ("coruja piscando") é sinal clássico de metástase.',
      'Estreitamento discal com erosão dos platôs adjacentes sugere espondilodiscite; com esclerose e osteófitos, sugere degeneração.',
      'Espondilolistese ístmica de L5 sobre S1 nasce de defeito bilateral da pars — procure a "coleira" na oblíqua ou o degrau no perfil.',
      'Fratura de processo transverso lombar não é achado inocente: procure lesão renal e hematoma retroperitoneal.',
    ],
    medidas: [
      { rotulo: 'Distância interpedicular', valor: 'Aumento gradual de L1 a L5', nota: 'Alargamento focal sugere fratura por explosão.' },
      { rotulo: 'Perda de altura vertebral', valor: '> 20%', nota: 'Limiar habitual para fratura por compressão.' },
      { rotulo: 'Grau de listese (Meyerding)', valor: 'I a IV, por quartos do platô', nota: 'Medido no perfil em ortostase.' },
      { rotulo: 'Translação em dinâmicas', valor: '> 4 mm ou > 10° entre flexão e extensão', nota: 'Sugere instabilidade segmentar.' },
    ],
    quandoAvancar:
      'A ressonância é o exame da lombalgia com bandeira vermelha — déficit neurológico, síndrome da cauda equina, suspeita de infecção ou neoplasia, trauma com déficit — e o único que mostra disco, canal, raízes e medula. A tomografia caracteriza melhor o osso e define fraturas; a cintilografia e a ressonância detectam fratura por insuficiência que a radiografia não mostra.',
  },
}

// ────────────────────────────── Acesso e busca ──────────────────────────────

export interface RegiaoInfo {
  id: RegiaoRaioX
  titulo: string
  /** Uma linha que responde "por que abrir esta região?". */
  resumo: string
  totalEstudos: number
  totalEstruturas: number
  incidencias: string[]
  /** Imagem representativa (primeiro estudo da região). */
  capa: string
}

/** Ordem didática: do tronco para as extremidades. */
const ORDEM_REGIOES: RegiaoRaioX[] = [
  'torax',
  'abdome',
  'cabeca',
  'coluna-cervical',
  'coluna-lombar',
  'ombro',
  'membro-superior',
  'pelve',
  'membro-inferior',
]

const RESUMO_REGIAO: Record<RegiaoRaioX, string> = {
  torax: 'A radiografia mais pedida do mundo: técnica, arcos mediastinais e o roteiro ABCDE.',
  abdome: 'Padrão gasoso, vísceras sólidas e a diferença entre delgado e cólon.',
  cabeca: 'Calota, base, suturas e as cavidades aeradas da face.',
  'coluna-cervical': 'As quatro linhas de alinhamento e a junção C7-T1 que não pode faltar.',
  'coluna-lombar': 'Contagem de níveis, pedículos e a transição lombossacra.',
  ombro: 'Congruência glenoumeral, tubérculos e os dois colos do úmero.',
  'membro-superior': 'Cotovelo, punho e mão: linha radiocapitelar, arcos de Gilula e o escafoide.',
  pelve: 'O anel pélvico e o quadril, com as linhas de Judet e de Shenton.',
  'membro-inferior': 'Joelho e perna: platôs, coxins adiposos e derrame articular.',
}

export const REGIOES_RAIO_X: RegiaoInfo[] = ORDEM_REGIOES.map((id) => {
  const estudos = ESTUDOS_RAIO_X.filter((estudo) => estudo.regiao === id)
  return {
    id,
    titulo: estudos[0]?.regiaoTitulo ?? id,
    resumo: RESUMO_REGIAO[id],
    totalEstudos: estudos.length,
    totalEstruturas: estudos.reduce((total, estudo) => total + estudo.estruturas.length, 0),
    incidencias: Array.from(new Set(estudos.map((estudo) => estudo.incidencia))),
    capa: estudos[0]?.imagem ?? '',
  }
})

export const TOTAL_ESTRUTURAS_RAIO_X = ESTUDOS_RAIO_X.reduce((total, estudo) => total + estudo.estruturas.length, 0)

export function getEstudoRaioX(id: string): EstudoRaioX | undefined {
  return ESTUDOS_RAIO_X.find((estudo) => estudo.id === id)
}

export function estudosDaRegiao(regiao: RegiaoRaioX): EstudoRaioX[] {
  return ESTUDOS_RAIO_X.filter((estudo) => estudo.regiao === regiao)
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function buscarEstudosRaioX(termo: string, regiao?: RegiaoRaioX | 'todas'): EstudoRaioX[] {
  const consulta = normalizar(termo.trim())
  return ESTUDOS_RAIO_X.filter((estudo) => {
    if (regiao && regiao !== 'todas' && estudo.regiao !== regiao) return false
    if (!consulta) return true
    return normalizar(
      [estudo.titulo, estudo.incidencia, estudo.camada, estudo.regiaoTitulo, estudo.foco, ...estudo.estruturas.map((estrutura) => `${estrutura.nome} ${estrutura.original}`)].join(' '),
    ).includes(consulta)
  })
}

export interface ResultadoEstrutura {
  estudo: EstudoRaioX
  estrutura: EstruturaRaioX
  indice: number
}

/**
 * Busca no nível da estrutura, e não do exame.
 *
 * É o que permite digitar "escafoide" e cair direto na demarcação certa, em vez
 * de receber "Mão e punho (PA)" e ter de caçar o item na lista lateral.
 */
export function buscarEstruturasRaioX(termo: string, limite = 24): ResultadoEstrutura[] {
  const consulta = normalizar(termo.trim())
  if (consulta.length < 2) return []
  const exatos: ResultadoEstrutura[] = []
  const parciais: ResultadoEstrutura[] = []
  for (const estudo of ESTUDOS_RAIO_X) {
    estudo.estruturas.forEach((estrutura, indice) => {
      const alvo = normalizar(`${estrutura.nome} ${estrutura.original}`)
      if (!alvo.includes(consulta)) return
      const destino = normalizar(estrutura.nome).startsWith(consulta) ? exatos : parciais
      destino.push({ estudo, estrutura, indice })
    })
  }
  return [...exatos, ...parciais].slice(0, limite)
}

export function notaEstrutura(estudo: EstudoRaioX, estrutura: EstruturaRaioX): NotaEstrutura {
  return NOTAS_ESTRUTURAS[estrutura.nome] ?? notaDeFallback(estrutura.nome, estudo.regiaoTitulo)
}

/** Compatibilidade: versão em texto corrido do dossiê da estrutura. */
export function descricaoEstrutura(estudo: EstudoRaioX, estrutura: EstruturaRaioX): string {
  const nota = notaEstrutura(estudo, estrutura)
  return [nota.resumo, nota.identificar, nota.clinica, nota.alerta].filter(Boolean).join(' ')
}

export const CREDITO_CLINICAL_ANATOMY = {
  nome: 'ClinicalAnatomy - RADIOLOGICAL ATLAS',
  url: `${ROOT}.html`,
  autorizacao: 'AUTH-CA-RA-2026-0811',
  nota: 'Imagens, demarcações e nomenclatura-base reproduzidas e adaptadas com autorização formal. Tradução, organização e aprofundamento didático: DomineAqui.',
}

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
}

export interface EstudoRaioX {
  id: string
  regiao: RegiaoRaioX
  regiaoTitulo: string
  titulo: string
  incidencia: string
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
}

const ROOT = 'https://www.clinicalanatomy.ca/radiology'

type EstruturaBruta = [arquivo: string, nome: string, original: string]

function montarEstudo({
  id,
  regiao,
  regiaoTitulo,
  titulo,
  incidencia,
  foco,
  pasta,
  imagem,
  estruturas,
}: Omit<EstudoRaioX, 'imagem' | 'fonte' | 'estruturas'> & {
  pasta: string
  imagem: string
  estruturas: EstruturaBruta[]
}): EstudoRaioX {
  return {
    id,
    regiao,
    regiaoTitulo,
    titulo,
    incidencia,
    foco,
    imagem: `${ROOT}/${pasta}/${imagem}`,
    fonte: `${ROOT}/${id}.html`,
    estruturas: estruturas.map(([arquivo, nome, original]) => ({
      nome,
      original,
      sobreposicao: `${ROOT}/${pasta}/${arquivo}`,
    })),
  }
}

export const ESTUDOS_RAIO_X: EstudoRaioX[] = [
  montarEstudo({
    id: 'thoraxBones', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Ossos e marcos do tórax', incidencia: 'PA', pasta: 'thorax', imagem: 'thoraxPA.png',
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
    id: 'thoraxMedia', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Mediastino', incidencia: 'PA', pasta: 'thorax', imagem: 'thoraxMed.png',
    foco: 'Leia os contornos mediastinais de cima para baixo: traqueia, botão aórtico, hilo esquerdo e bordas cardíacas. A sequência dos arcos ajuda a localizar aumento de câmaras, dilatação vascular e deslocamentos do mediastino.',
    estruturas: [
      ['AA.png', 'Arco aórtico', 'aortic arch'], ['Dia.png', 'Diafragma', 'diaphragm'], ['Hila.png', 'Hilos pulmonares', 'hila'],
      ['LAA.png', 'Apêndice atrial esquerdo', 'left atrial appendage'], ['LV.png', 'Ventrículo esquerdo', 'left ventricle'],
      ['RA.png', 'Átrio direito', 'right atrium'], ['Conf.png', 'Confluência VCS-ázigos', 'SVC-azygous confluence'],
      ['Trac.png', 'Traqueia', 'trachea'],
    ],
  }),
  montarEstudo({
    id: 'thoraxLat', regiao: 'torax', regiaoTitulo: 'Tórax', titulo: 'Mediastino', incidencia: 'Perfil', pasta: 'thorax', imagem: 'thoraxLat.png',
    foco: 'O perfil separa estruturas sobrepostas no PA. Observe espaços retroesternal e retrocardíaco, continuidade da coluna, cúpulas e recessos costofrênicos; a borda anterior do coração é sobretudo ventricular direita e a posterior, atrial e ventricular esquerda.',
    estruturas: [
      ['CAlat.png', 'Ângulos costofrênicos', 'costophrenic angles'], ['LAlat.png', 'Átrio esquerdo', 'left atrium'],
      ['LVlat.png', 'Ventrículo esquerdo', 'left ventricle'], ['Ped.png', 'Pedículos', 'pedicles'],
      ['RV.png', 'Ventrículo direito', 'right ventricle'], ['ScapLat.png', 'Escápula', 'scapula'],
      ['Ster.png', 'Esterno', 'sternum'], ['TracLat.png', 'Traqueia', 'trachea'], ['VBlat.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'skullBones', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Ossos do crânio', incidencia: 'AP', pasta: 'head', imagem: 'skull.png',
    foco: 'A projeção frontal exige comparação bilateral. Siga a calota, órbitas, zigomas, maxilas e mandíbula; assimetrias de rotação podem simular diferença de volume e obscurecer linhas de fratura.',
    estruturas: [
      ['FB.png', 'Osso frontal', 'frontal bone'], ['Man.png', 'Mandíbula', 'mandible'], ['Max.png', 'Maxila', 'maxilla'],
      ['NS.png', 'Septo nasal', 'nasal septum'], ['TB.png', 'Osso temporal', 'temporal bone'], ['Zyg.png', 'Osso zigomático', 'zygomatic bone'],
    ],
  }),
  montarEstudo({
    id: 'skullLat', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Crânio', incidencia: 'Perfil', pasta: 'head', imagem: 'skullLat.png',
    foco: 'No perfil, reconheça calota e suturas antes da base do crânio. A sela túrcica é um reparo central; frontal, parietal, temporal, esfenoide e occipital devem formar contornos contínuos, apesar da sobreposição bilateral.',
    estruturas: [
      ['FBlat.png', 'Osso frontal', 'frontal bone'], ['FSlat.png', 'Seio frontal', 'frontal sinus'], ['MP.png', 'Processo mastoide', 'mastoid process'],
      ['OBlat.png', 'Osso occipital', 'occipital bone'], ['PBlat.png', 'Osso parietal', 'parietal bone'], ['ST.png', 'Sela túrcica', 'sella turcica'],
      ['SBlat.png', 'Osso esfenoide', 'sphenoid bone'], ['TBlat.png', 'Osso temporal', 'temporal bone'],
      ['CS.png', 'Sutura coronal', 'coronal suture'], ['LS.png', 'Sutura lambdoide', 'lambdoid suture'],
    ],
  }),
  montarEstudo({
    id: 'skullSinus', regiao: 'cabeca', regiaoTitulo: 'Cabeça', titulo: 'Seios da face', incidencia: 'AP', pasta: 'head', imagem: 'skull.png',
    foco: 'Compare transparência, contorno e simetria dos seios. Opacificação, nível líquido ou espessamento mucoso devem ser correlacionados com técnica e clínica; a radiografia tem sobreposição importante e a TC é superior quando há dúvida ou complicação.',
    estruturas: [
      ['EAC.png', 'Células etmoidais', 'ethmoid air cells'], ['FS.png', 'Seio frontal', 'frontal sinus'], ['MAC.png', 'Células mastoideas', 'mastoid air cells'],
      ['MS.png', 'Seio maxilar', 'maxillary sinus'], ['OF.png', 'Lâmina cribriforme / teto olfatório', 'olfactory floor'], ['SS.png', 'Seio esfenoidal', 'sphenoid sinus'],
    ],
  }),
  montarEstudo({
    id: 'abdomenAP', regiao: 'abdome', regiaoTitulo: 'Abdome', titulo: 'Abdome e pelve', incidencia: 'AP', pasta: 'abdomen', imagem: 'abdomen.png',
    foco: 'Comece pelo padrão gasoso e pela distribuição das alças; depois avalie partes moles, bordas dos psoas, rins e vísceras, calcificações e todo o esqueleto incluído. A radiografia simples mostra padrões, não substitui avaliação seccional quando há gravidade.',
    estruturas: [
      ['Gas.png', 'Gás na flexura hepática', 'gas in hepatic flexure'], ['Kid.png', 'Rins', 'kidneys'], ['Liv.png', 'Fígado', 'liver'],
      ['PM.png', 'Músculos psoas', 'psoas muscles'], ['Sple.png', 'Baço', 'spleen'], ['Stom.png', 'Estômago', 'stomach'],
      ['Ace.png', 'Acetábulos', 'acetabula'], ['FH.png', 'Cabeças femorais', 'femoral heads'], ['IC.png', 'Cristas ilíacas', 'iliac crests'],
      ['Rect.png', 'Reto', 'rectum'], ['SIJ.png', 'Articulações sacroilíacas', 'sacro-iliac joints'],
    ],
  }),
  montarEstudo({
    id: 'abdomenIntes', regiao: 'abdome', regiaoTitulo: 'Abdome', titulo: 'Alças intestinais', incidencia: 'AP', pasta: 'abdomen', imagem: 'abdomenIntes.png',
    foco: 'Diferencie delgado de cólon pelo calibre, pela posição e pelas pregas: válvulas coniventes atravessam toda a luz do delgado; haustra são mais espaçadas e não cruzam completamente o cólon.',
    estruturas: [
      ['Haus.png', 'Haustrações', 'haustra'], ['LI.png', 'Intestino grosso', 'large intestine'],
      ['SI.png', 'Intestino delgado', 'small intestine'], ['VC.png', 'Válvulas coniventes', 'valvulae conniventes'],
    ],
  }),
  montarEstudo({
    id: 'shoulderAP', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Estruturas ósseas', incidencia: 'AP', pasta: 'shoulder', imagem: 'shoulderAP.png',
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
    id: 'shoulderScapula', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Marcos da escápula', incidencia: 'AP', pasta: 'shoulder', imagem: 'shoulderAP.png',
    foco: 'A escápula é uma lâmina sobreposta às costelas. Siga seus bordos e ângulos até a glenoide; descontinuidades, assimetria ou degraus devem ser confirmados em incidências complementares.',
    estruturas: [
      ['IA.png', 'Ângulo inferior', 'inferior angle'], ['LA.png', 'Ângulo lateral', 'lateral angle'], ['LB.png', 'Borda lateral', 'lateral border'],
      ['MB.png', 'Borda medial', 'medial border'], ['SA.png', 'Ângulo superior', 'superior angle'], ['SB.png', 'Borda superior', 'superior border'],
    ],
  }),
  montarEstudo({
    id: 'shoulderHumerus', regiao: 'ombro', regiaoTitulo: 'Ombro', titulo: 'Úmero e cintura escapular', incidencia: 'AP', pasta: 'shoulder', imagem: 'humerus.png',
    foco: 'Amplie a inspeção além da articulação: a tuberosidade deltoidea marca a diáfise lateral do úmero e a incisura escapular superior situa-se medial ao processo coracoide.',
    estruturas: [['DT.png', 'Tuberosidade deltoidea', 'deltoid tuberosity'], ['SSN.png', 'Incisura da escápula', 'suprascapular notch']],
  }),
  montarEstudo({
    id: 'kneeAP', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Joelho', incidencia: 'AP', pasta: 'leg', imagem: 'kneeAP.png',
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
    foco: 'No perfil verdadeiro, côndilos femorais ficam quase sobrepostos. Examine patela, tendões, coxins adiposos e recesso suprapatelar; deslocamento dos coxins pode ser o primeiro sinal de derrame ou fratura oculta.',
    estruturas: [
      ['FP.png', 'Coxins adiposos', 'fat pads'], ['Fem.png', 'Fêmur', 'femur'], ['Fib.png', 'Fíbula', 'fibula'], ['PatLat.png', 'Patela', 'patella'],
      ['PT.png', 'Tendão patelar', 'patellar tendon'], ['QT.png', 'Tendão do quadríceps', 'quadriceps tendon'],
      ['SP.png', 'Recesso suprapatelar', 'suprapatellar pouch'], ['Tib.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'legAP', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Perna', incidencia: 'AP', pasta: 'leg', imagem: 'legAP.png',
    foco: 'Uma radiografia da perna deve incluir joelho e tornozelo. Siga cada cortical da tíbia e da fíbula em toda a extensão e confirme alinhamento nas articulações proximal e distal.',
    estruturas: [
      ['Calc.png', 'Calcâneo', 'calcaneus'], ['FemLeg.png', 'Fêmur', 'femur'], ['FibLeg.png', 'Fíbula', 'fibula'],
      ['MT.png', 'Metatarsos', 'metatarsals'], ['PatLeg.png', 'Patela', 'patella'], ['Tal.png', 'Tálus', 'talus'], ['TibLeg.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'legLat', regiao: 'membro-inferior', regiaoTitulo: 'Membro inferior', titulo: 'Perna', incidencia: 'Perfil', pasta: 'leg', imagem: 'legLat.png',
    foco: 'O perfil revela deslocamento anteroposterior e angulação não visíveis em AP. Confirme que as articulações adjacentes foram incluídas e percorra as corticais sem saltos.',
    estruturas: [
      ['CalcLat.png', 'Calcâneo', 'calcaneus'], ['FemLat.png', 'Fêmur', 'femur'], ['FibLat.png', 'Fíbula', 'fibula'],
      ['MTlat.png', 'Metatarsos', 'metatarsals'], ['PatLegLat.png', 'Patela', 'patella'], ['TalLat.png', 'Tálus', 'talus'], ['TibLat.png', 'Tíbia', 'tibia'],
    ],
  }),
  montarEstudo({
    id: 'pelvisBones', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Estruturas ósseas', incidencia: 'AP', pasta: 'pelvis', imagem: 'pelvisBones.png',
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
    id: 'pelvisAP', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Pelve e fêmur proximal', incidencia: 'AP', pasta: 'pelvis', imagem: 'pelvisAP.png',
    foco: 'Compare altura das cabeças femorais, interlinhas coxofemorais, linhas de Shenton e simetria dos forames obturatórios. O trocânter menor excessivamente visível sugere rotação externa.',
    estruturas: [
      ['Acet.png', 'Acetábulo', 'acetabulum'], ['ASIS.png', 'Espinha ilíaca anterossuperior', 'anterior superior iliac spine'],
      ['OF.png', 'Forame obturatório', 'obturator foramen'], ['PI.png', 'Estreito superior da pelve', 'pelvic inlet'], ['SIJ.png', 'Articulação sacroilíaca', 'sacroiliac joint'],
      ['GT.png', 'Trocânter maior', 'greater trochanter'], ['Fhead.png', 'Cabeça do fêmur', 'head'], ['LT.png', 'Trocânter menor', 'lesser trochanter'], ['Fneck.png', 'Colo do fêmur', 'neck'],
    ],
  }),
  montarEstudo({
    id: 'pelvisHip', regiao: 'pelve', regiaoTitulo: 'Pelve', titulo: 'Articulação do quadril', incidencia: 'Rã (frog-leg)', pasta: 'pelvis', imagem: 'pelvisHip.png',
    foco: 'A abdução e rotação externa perfilam colo e cabeça femoral. Avalie congruência, interlinha e junção cabeça-colo; esta posição não deve ser forçada quando há suspeita de fratura aguda.',
    estruturas: [
      ['AcetHip.png', 'Acetábulo', 'acetabulum'], ['ASIShip.png', 'Espinha ilíaca anterossuperior', 'anterior superior iliac spine'],
      ['HJS.png', 'Espaço articular do quadril', 'hip joint space'], ['IChip.png', 'Crista ilíaca', 'iliac crest'], ['OFhip.png', 'Forame obturatório', 'obturator foramen'],
      ['GThip.png', 'Trocânter maior', 'greater trochanter'], ['FH.png', 'Cabeça do fêmur', 'head'], ['LThip.png', 'Trocânter menor', 'lesser trochanter'], ['FN.png', 'Colo do fêmur', 'neck'],
    ],
  }),
  montarEstudo({
    id: 'neckAP', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'AP', pasta: 'neck', imagem: 'neckAP.png',
    foco: 'Centralização adequada alinha processos espinhosos. Compare pedículos e processos transversos bilateralmente, conte corpos vertebrais e observe a coluna aérea traqueal.',
    estruturas: [
      ['Ped.png', 'Pedículos', 'pedicles'], ['SPap.png', 'Processos espinhosos', 'spinous processes'], ['Trach.png', 'Traqueia', 'trachea'],
      ['TPap.png', 'Processos transversos', 'transverse processes'], ['VBap.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'neckLatl', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Perfil esquerdo', pasta: 'neck', imagem: 'neckLatl.png',
    foco: 'Siga quatro linhas: anterior dos corpos, posterior dos corpos, espinolaminar e pontas dos espinhosos. Inclua C1 até a junção C7-T1 e avalie partes moles pré-vertebrais.',
    estruturas: [
      ['AA.png', 'Arco anterior do atlas (C1)', 'anterior arch of atlas (c1)'], ['IAP.png', 'Processos articulares inferiores', 'inferior articular processes'],
      ['PI.png', 'Pars interarticularis', 'pars interarticularis'], ['PA.png', 'Arco posterior do atlas (C1)', 'posterior arch of atlas (c1)'],
      ['SAP.png', 'Processos articulares superiores', 'superior articular processes'], ['ZJ.png', 'Articulações zigapofisárias', 'zygopophyseal joints'],
    ],
  }),
  montarEstudo({
    id: 'neckLatr', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Perfil direito', pasta: 'neck', imagem: 'neckLatr.png',
    foco: 'Além do alinhamento, compare alturas dos corpos e espaços discais. A perda focal de altura, o degrau de uma linha ou o aumento pré-vertebral merecem correlação urgente com trauma e TC.',
    estruturas: [
      ['AAA.png', 'Arco anterior do atlas (C1)', 'anterior arch of atlas (c1)'], ['IDS.png', 'Espaços discais intervertebrais', 'intervertebral disc spaces'],
      ['SP.png', 'Processos espinhosos', 'spinous processes'], ['TP.png', 'Processos transversos', 'transverse processes'], ['VB.png', 'Corpos vertebrais', 'vertebral bodies'],
    ],
  }),
  montarEstudo({
    id: 'neckOblq', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'Coluna cervical', incidencia: 'Oblíqua', pasta: 'neck', imagem: 'neckOblq.png',
    foco: 'A oblíqua abre os forames intervertebrais. Compare calibre e contornos por nível, reconhecendo que rotação inadequada pode produzir estreitamento aparente.',
    estruturas: [['IVF.png', 'Forames intervertebrais', 'intervertebral foramina'], ['PedOb.png', 'Pedículos', 'pedicles'], ['VBob.png', 'Corpos vertebrais', 'vertebral bodies']],
  }),
  montarEstudo({
    id: 'neckOdon', regiao: 'coluna-cervical', regiaoTitulo: 'Coluna cervical', titulo: 'C1-C2 e processo odontoide', incidencia: 'Transoral', pasta: 'neck', imagem: 'neckOdon.png',
    foco: 'A boca aberta deve expor odontoide e massas laterais de C1 sem sobreposição dentária. Compare os espaços entre o dente e as massas laterais; assimetria técnica deve ser distinguida de desalinhamento verdadeiro.',
    estruturas: [
      ['AF.png', 'Facetas articulares', 'articular facets'], ['Dens.png', 'Processo odontoide (dente)', 'dens'],
      ['LM1.png', 'Massas laterais do atlas (C1)', 'lateral masses of atlas (c1)'], ['LM2.png', 'Massas laterais do áxis (C2)', 'lateral masses of axis (c2)'],
      ['SPod.png', 'Processo espinhoso do áxis (C2)', 'spinous process of axis (c2)'],
    ],
  }),
  montarEstudo({
    id: 'elbowAP', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Cotovelo', incidencia: 'AP', pasta: 'arm', imagem: 'elbowAP.png',
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
    foco: 'O perfil a 90° evidencia congruência e derrame. Observe coxins adiposos anterior e posterior, olécrano e incisura troclear; um coxim posterior visível em adulto é anormal até prova em contrário.',
    estruturas: [
      ['CP.png', 'Processo coronoide', 'coronoid process'], ['HumLat.png', 'Úmero', 'humerus'], ['Ole.png', 'Olécrano', 'olecranon'],
      ['RadLat.png', 'Rádio', 'radius'], ['TN.png', 'Incisura troclear', 'trochlear notch'], ['UlnaLat.png', 'Ulna', 'ulna'], ['UT.png', 'Tuberosidade da ulna', 'ulnar tuberosity'],
    ],
  }),
  montarEstudo({
    id: 'handAP', regiao: 'membro-superior', regiaoTitulo: 'Membro superior', titulo: 'Mão e punho', incidencia: 'PA', pasta: 'arm', imagem: 'handAP.png',
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
    foco: 'Conte as vértebras, confira alinhamento dos processos espinhosos e simetria dos pedículos, depois compare corpos, espaços discais, processos transversos, sacro e articulações sacroilíacas.',
    estruturas: [
      ['IVD.png', 'Espaços discais intervertebrais', 'intervertebral discs'], ['Ped.png', 'Pedículos', 'pedicles'], ['Rib.png', 'Costelas', 'ribs'],
      ['Sacr.png', 'Sacro', 'sacrum'], ['SP.png', 'Processos espinhosos', 'spinous processes'], ['TP.png', 'Processos transversos', 'transverse processes'],
    ],
  }),
]

const GUIA_ESQUELETO: Pick<GuiaRegiaoRaioX, 'qualidade' | 'roteiro' | 'armadilhas'> = {
  qualidade: [
    'A anatomia de interesse deve estar inteiramente incluída, sem corte das articulações relevantes.',
    'Rotação e angulação precisam ser reconhecidas antes de comparar espaços articulares ou simetria.',
    'A exposição deve permitir ver córtex e trabeculado sem apagar partes moles.',
  ],
  roteiro: [
    { passo: 'Alinhamento', detalhe: 'Confirme eixo, congruência e relações articulares antes de procurar linhas sutis.' },
    { passo: 'Osso', detalhe: 'Siga cada cortical de ponta a ponta; examine trabeculado, densidade e contornos.' },
    { passo: 'Cartilagem', detalhe: 'Use a interlinha radiográfica como marcador indireto da cartilagem e da posição articular.' },
    { passo: 'Partes moles', detalhe: 'Procure edema, deslocamento de coxins, calcificações, gás e corpos estranhos.' },
    { passo: 'Revisão', detalhe: 'Volte aos pontos de maior sobreposição e compare com a incidência ortogonal.' },
  ],
  armadilhas: [
    'Rotação pode produzir falsa assimetria, estreitamento aparente da interlinha ou sobreposição incomum.',
    'Centros de ossificação, sesamoides, canais vasculares e suturas podem simular fragmentos ou fraturas.',
    'Uma única incidência não exclui fratura: correlação com perfil, oblíquas, TC ou RM pode ser necessária.',
  ],
}

export const GUIAS_RAIO_X: Record<RegiaoRaioX, GuiaRegiaoRaioX> = {
  torax: {
    contexto: 'Na radiografia de tórax, dezenas de estruturas tridimensionais são projetadas em uma imagem bidimensional. A leitura segura depende de técnica, comparação bilateral e uma sequência fixa que cubra vias aéreas, mediastino, hilos, pulmões, pleuras, diafragma, ossos e partes moles.',
    tecnica: 'Prefira PA em ortostase e perfil esquerdo quando o paciente coopera. Inspiração adequada costuma mostrar cerca de 9-10 arcos costais posteriores; rotação é estimada pela distância entre processos espinhosos e extremidades mediais das clavículas. AP portátil amplia a silhueta cardíaca.',
    qualidade: ['Identifique projeção, posição e marcador de lado.', 'Cheque inspiração, rotação, penetração e movimento.', 'Confirme inclusão dos ápices e dos ângulos costofrênicos.'],
    roteiro: [
      { passo: 'A - via aérea', detalhe: 'Traqueia central ou discretamente à direita, carina e brônquios principais.' },
      { passo: 'B - respiração', detalhe: 'Compare transparência, vasos, hilos, pleuras e espaços extrapleurais.' },
      { passo: 'C - circulação', detalhe: 'Leia tamanho e contornos cardíacos, aorta e vasos hilares.' },
      { passo: 'D - diafragma', detalhe: 'Compare cúpulas, ângulos costofrênicos e região subdiafragmática.' },
      { passo: 'E - extras', detalhe: 'Revise ossos, partes moles, dispositivos e áreas ocultas.' },
    ],
    armadilhas: ['AP portátil pode simular cardiomegalia.', 'Baixa inspiração aumenta densidade basal e silhueta cardíaca.', 'Mamilo, dobra de pele e escápula podem simular nódulo, pneumotórax ou opacidade.'],
    perolas: ['Índice cardiotorácico é mais confiável em PA bem inspirada.', 'O hilo esquerdo costuma estar discretamente mais alto que o direito.', 'Os quatro cantos esquecidos: ápices, retrocardíaco, abaixo dos diafragmas e costofrênicos.'],
  },
  cabeca: {
    contexto: 'A radiografia do crânio é uma projeção de alta sobreposição. O objetivo didático é reconhecer calota, base, ossos da face, suturas e cavidades aeradas; no trauma e em muitas doenças, a TC é o método preferencial.',
    tecnica: 'Centralização e ausência de rotação são essenciais. Compare estruturas pareadas e use incidências ortogonais; a posição do rochedo temporal e a simetria orbitária ajudam a julgar a técnica.',
    ...GUIA_ESQUELETO,
    perolas: ['Suturas têm trajeto previsível e bordas corticais; fraturas tendem a ser agudas e não escleróticas.', 'Compare seios e mastoides lado a lado.', 'Não use radiografia simples para excluir lesão intracraniana.'],
  },
  abdome: {
    contexto: 'A radiografia simples do abdome é uma visão global de gás, órgãos, calcificações, partes moles e esqueleto. Seu valor está em reconhecer padrões; achados e limitações devem ser integrados à clínica e, quando necessário, à ultrassonografia ou TC.',
    tecnica: 'A AP em decúbito inclui hemidiafragmas a sínfise púbica. Ortostase ou decúbito lateral com raio horizontal acrescentam pesquisa de níveis e ar livre quando indicados.',
    qualidade: ['Inclua todo o abdome e a pelve.', 'Evite movimento e rotação.', 'Confirme exposição suficiente para psoas, rins e coluna.'],
    roteiro: [
      { passo: 'Gás', detalhe: 'Localize estômago, delgado, cólon e reto; compare calibre e distribuição.' },
      { passo: 'Partes moles', detalhe: 'Procure fígado, baço, rins, psoas e bexiga quando visíveis.' },
      { passo: 'Calcificações', detalhe: 'Defina localização, forma e relação com trato urinário, vasos e vesícula.' },
      { passo: 'Osso', detalhe: 'Revise costelas inferiores, coluna, sacro, pelve e quadris.' },
      { passo: 'Dispositivos', detalhe: 'Cheque posição de sondas, cateteres, drenos e material cirúrgico.' },
    ],
    armadilhas: ['Conteúdo fecal pode criar padrão moteado e ocultar estruturas.', 'Flebolitos pélvicos podem simular cálculos ureterais.', 'Radiografia normal não exclui obstrução inicial, isquemia ou inflamação.'],
    perolas: ['Pregas do delgado cruzam toda a luz; haustrações colônicas não.', 'O cólon costuma ser mais periférico e o delgado, mais central.', 'Perda unilateral do contorno do psoas é inespecífica e deve ser contextualizada.'],
  },
  ombro: {
    contexto: 'A cintura escapular combina articulações e ossos sobrepostos. A leitura deve integrar clavícula, articulações acromioclavicular e glenoumeral, escápula e úmero proximal.',
    tecnica: 'Uma AP isolada é incompleta quando há trauma. Incidências axilar ou escapular em Y ajudam a confirmar alinhamento; rotação interna e externa perfilam tubérculos diferentes.',
    ...GUIA_ESQUELETO,
    perolas: ['A cabeça umeral deve estar congruente e centrada na glenoide.', 'O colo cirúrgico é ponto frequente de fratura.', 'Revise costelas, ápice pulmonar e partes moles incluídas.'],
  },
  'membro-inferior': {
    contexto: 'Joelho e perna exigem duas incidências ortogonais e inclusão das articulações. Alinhamento, continuidade cortical, interlinhas e partes moles devem ser avaliados sistematicamente.',
    tecnica: 'AP e perfil verdadeiros minimizam distorção. Em ossos longos, inclua as articulações proximal e distal; em trauma, não force posicionamento doloroso.',
    ...GUIA_ESQUELETO,
    perolas: ['A cabeça da fíbula marca o lado lateral.', 'Derrame do joelho distende o recesso suprapatelar.', 'Siga tíbia e fíbula inteiras: uma segunda lesão pode estar longe do ponto doloroso.'],
  },
  pelve: {
    contexto: 'A pelve funciona como um anel; a leitura combina simetria, continuidade dos arcos, congruência dos quadris e avaliação do fêmur proximal.',
    tecnica: 'Na AP, membros inferiores costumam ser rodados internamente para perfilar os colos femorais, salvo contraindicação por trauma. Simetria dos forames obturatórios e asas ilíacas ajuda a julgar rotação.',
    ...GUIA_ESQUELETO,
    perolas: ['Uma ruptura do anel pélvico deve levar à procura de outra.', 'A linha de Shenton deve formar arco suave.', 'A incidência em rã é contraindicada quando há suspeita de fratura instável.'],
  },
  'coluna-cervical': {
    contexto: 'A coluna cervical deve ser lida como uma unidade de C1 a C7-T1. Linhas de alinhamento, alturas, espaços discais, articulações e partes moles pré-vertebrais são indissociáveis.',
    tecnica: 'AP, perfil e transoral respondem a perguntas diferentes; oblíquas perfilam forames. Em trauma, a TC é mais sensível e posicionamentos forçados devem ser evitados.',
    ...GUIA_ESQUELETO,
    perolas: ['Não aceite um perfil que pare em C6: a junção C7-T1 precisa ser vista.', 'O odontoide deve estar íntegro e equidistante das massas laterais de C1.', 'Um degrau em qualquer linha de alinhamento merece investigação.'],
  },
  'membro-superior': {
    contexto: 'Cotovelo, mão e punho concentram pequenos reparos e interlinhas. Uma leitura por alinhamento, osso, articulação e partes moles reduz fraturas e luxações perdidas.',
    tecnica: 'Obtenha pelo menos duas incidências ortogonais. Perfis verdadeiros e posicionamento sem rotação são essenciais para avaliar congruência e arcos do carpo.',
    ...GUIA_ESQUELETO,
    perolas: ['A linha radiocapitelar deve cruzar o capítulo.', 'Coxim adiposo posterior no cotovelo adulto sugere derrame.', 'No punho, os três arcos de Gilula devem ser contínuos.'],
  },
  'coluna-lombar': {
    contexto: 'A AP lombar mostra alinhamento coronal, corpos, pedículos, processos, espaços discais e transição lombossacra. A radiografia avalia estrutura óssea e alinhamento, mas não caracteriza adequadamente disco, canal ou raízes.',
    tecnica: 'Inclua de T12 ao sacro, com rotação mínima. Exposição deve revelar pedículos e platôs vertebrais sem perder partes moles.',
    ...GUIA_ESQUELETO,
    perolas: ['Pedículos simétricos ajudam a confirmar ausência de rotação.', 'Conte a partir de um reparo confiável antes de nomear níveis.', 'Compare altura discal e dos corpos em toda a sequência.'],
  },
}

const NOTAS: Record<string, string> = {
  'Ângulos costofrênicos': 'Recessos entre diafragma e parede torácica. Devem ser agudos; apagamento pode refletir líquido pleural, espessamento ou técnica.',
  'Largura cardíaca': 'Meça o maior diâmetro transversal da silhueta e compare com o tórax interno apenas em PA adequada; AP e baixa inspiração ampliam artificialmente.',
  'Hilos pulmonares': 'Formados principalmente por artérias pulmonares. Compare altura, densidade e calibre; o esquerdo costuma estar discretamente mais alto.',
  'Arco aórtico': 'O botão aórtico forma o primeiro arco superior esquerdo do mediastino. Alongamento e ectasia aumentam com idade e hipertensão.',
  'Traqueia': 'Coluna aérea central, com discreto desvio fisiológico à direita junto ao arco aórtico. Desvio maior exige correlação com volume pulmonar e massa.',
  'Processo odontoide (dente)': 'Projeção superior de C2 que articula com C1. Avalie continuidade cortical, centralização e espaço atlanto-odontoide.',
  'Forames intervertebrais': 'Canais de saída das raízes nervosas, melhor perfilados nas oblíquas. Compare calibre por nível, descontando rotação.',
  'Espaços discais intervertebrais': 'Representam indiretamente a altura dos discos. Estreitamento focal deve ser avaliado com alinhamento e alterações dos platôs.',
  'Pedículos': 'Estruturas ovais pareadas que conectam corpo e arco posterior. Simetria ajuda a julgar rotação; ausência ou erosão é achado relevante.',
  'Cabeça do fêmur': 'Deve ser esférica, com córtex contínuo e congruente com o acetábulo. Compare densidade, contorno e posição com o lado oposto.',
  'Colo do fêmur': 'Ponte entre cabeça e região trocantérica; percorra as corticais superior e inferior, local frequente de fraturas sutis.',
  'Espaço articular do quadril': 'Marcador indireto da cartilagem. Deve ser relativamente uniforme; rotação e carga modificam sua aparência.',
  'Acetábulo': 'Cavidade formada por ílio, ísquio e púbis. Avalie teto, paredes e congruência com a cabeça femoral.',
  'Patela': 'Osso sesamoide anterior ao joelho. Avalie altura, posição, continuidade cortical e relação com a tróclea.',
  'Recesso suprapatelar': 'Extensão superior da cavidade articular; distensão ou deslocamento dos planos adiposos sugere derrame.',
  'Platô tibial lateral': 'Superfície de carga lateral da tíbia proximal. Procure depressão, degrau e irregularidade subcondral.',
  'Platô tibial medial': 'Superfície de carga medial, normalmente mais côncava. Compare altura e continuidade com o lado lateral.',
  'Cabeça do rádio': 'Articula-se com o capítulo e gira na pronação-supinação. Siga o contorno e a linha radiocapitelar.',
  'Olécrano': 'Projeção proximal posterior da ulna que se encaixa na fossa do olécrano; avalie continuidade e congruência.',
  'Escafoide': 'Osso radial da fileira proximal do carpo. Fraturas podem ser discretas e têm risco vascular; dor clínica pode exigir incidências ou imagem avançada.',
  'Semilunar': 'Osso central da fileira proximal. Deve alinhar-se com rádio e capitato no perfil.',
  'Capitato': 'Maior osso do carpo e eixo central da mão; no perfil deve alinhar-se com semilunar e rádio.',
  'Sela túrcica': 'Depressão do esfenoide que abriga a hipófise. No perfil, avalie contorno e dimensões sem confundir sobreposição.',
  'Seio maxilar': 'Maior seio paranasal. Compare aeração e paredes; nível líquido ou opacificação precisa de correlação clínica e técnica.',
  'Células etmoidais': 'Conjunto de pequenas cavidades entre órbitas e fossas nasais; sobreposição limita a radiografia simples.',
  'Válvulas coniventes': 'Pregas do intestino delgado que atravessam toda a luz, úteis para diferenciá-lo do cólon.',
  'Haustrações': 'Saculações do cólon, mais espaçadas e sem cruzar completamente a luz.',
  'Músculos psoas': 'Contornos retroperitoneais pares. Assimetria ou apagamento é inespecífico e depende de técnica e contexto.',
}

export function descricaoEstrutura(estudo: EstudoRaioX, estrutura: EstruturaRaioX): string {
  return NOTAS[estrutura.nome] || `A sobreposição demarca ${estrutura.nome.toLowerCase()} nesta incidência. Confirme a estrutura pela posição e pelas relações com os reparos vizinhos; depois avalie simetria, continuidade do contorno, densidade e alinhamento dentro do roteiro de ${estudo.regiaoTitulo.toLowerCase()}.`
}

export function getEstudoRaioX(id: string): EstudoRaioX | undefined {
  return ESTUDOS_RAIO_X.find((estudo) => estudo.id === id)
}

export const REGIOES_RAIO_X = Array.from(
  new Map(ESTUDOS_RAIO_X.map((estudo) => [estudo.regiao, estudo.regiaoTitulo])).entries(),
).map(([id, titulo]) => ({ id: id as RegiaoRaioX, titulo }))

export const TOTAL_ESTRUTURAS_RAIO_X = ESTUDOS_RAIO_X.reduce((total, estudo) => total + estudo.estruturas.length, 0)

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function buscarEstudosRaioX(termo: string, regiao?: RegiaoRaioX | 'todas'): EstudoRaioX[] {
  const consulta = normalizar(termo.trim())
  return ESTUDOS_RAIO_X.filter((estudo) => {
    if (regiao && regiao !== 'todas' && estudo.regiao !== regiao) return false
    if (!consulta) return true
    return normalizar(
      [estudo.titulo, estudo.incidencia, estudo.regiaoTitulo, estudo.foco, ...estudo.estruturas.map((estrutura) => `${estrutura.nome} ${estrutura.original}`)].join(' '),
    ).includes(consulta)
  })
}

export const CREDITO_CLINICAL_ANATOMY = {
  nome: 'ClinicalAnatomy - RADIOLOGICAL ATLAS',
  url: `${ROOT}.html`,
  autorizacao: 'AUTH-CA-RA-2026-0811-V2',
  nota: 'Imagens, demarcações e nomenclatura-base reproduzidas e adaptadas com autorização formal. Tradução, organização e aprofundamento didático: DomineAqui.',
}

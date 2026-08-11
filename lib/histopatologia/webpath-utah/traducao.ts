import { modalidadeDaEntradaWebPathUtah } from './catalogo.ts'

const FRASES: Array<[string, string]> = [
  ['severe calcific coronary atherosclerosis', 'aterosclerose coronariana calcificada grave'],
  ['coronary artery atherosclerosis', 'aterosclerose da artéria coronária'],
  ['coronary artery thrombosis', 'trombose da artéria coronária'],
  ['coronary artery', 'artéria coronária'],
  ['coronary thrombosis', 'trombose coronariana'],
  ['left ventricular aneurysm', 'aneurisma ventricular esquerdo'],
  ['left ventricle', 'ventrículo esquerdo'],
  ['right ventricle', 'ventrículo direito'],
  ['lipid streaks', 'estrias lipídicas'],
  ['hemorrhagic pulmonary infarction', 'infarto pulmonar hemorrágico'],
  ['petechial hemorrhages', 'hemorragias petequiais'],
  ['fibrin thrombus', 'trombo de fibrina'],
  ['fibrin thrombi', 'trombos de fibrina'],
  ['cholesterol emboli', 'êmbolos de colesterol'],
  ['contraction band necrosis', 'necrose em bandas de contração'],
  ['transmural myocardial infarction', 'infarto transmural do miocárdio'],
  ['coronary artery bypass graft', 'enxerto de revascularização coronariana'],
  ['cardiac tamponade', 'tamponamento cardíaco'],
  ['hemopericardium', 'hemopericárdio'],
  ['cystic medial necrosis', 'degeneração cística da média'],
  ['mitral valve prolapse', 'prolapso da valva mitral'],
  ['splinter hemorrhages', 'hemorragias subungueais em lasca'],
  ['splinter hemorrhage', 'hemorragia subungueal em lasca'],
  ['non-bacterial thrombotic endocarditis', 'endocardite trombótica não bacteriana'],
  ['rheumatic mitral stenosis', 'estenose mitral reumática'],
  ['acute rheumatic carditis', 'cardite reumática aguda'],
  ['viral myocarditis', 'miocardite viral'],
  ['atrial myxoma', 'mixoma atrial'],
  ['paradoxical embolus', 'êmbolo paradoxal'],
  ['probe patent foramen ovale', 'forame oval patente à sondagem'],
  ['coarctation of aorta', 'coarctação da aorta'],
  ['dilated cardiomyopathy', 'cardiomiopatia dilatada'],
  ['hypertrophic cardiomyopathy', 'cardiomiopatia hipertrófica'],
  ['restrictive cardiomyopathy', 'cardiomiopatia restritiva'],
  ['apple-green birefringence', 'birrefringência verde-maçã'],
  ['polarized light', 'luz polarizada'],
  ['mechanical valve prosthesis', 'prótese valvar mecânica'],
  ['giant cell arteritis', 'arterite de células gigantes'],
  ['thrombotic thrombocytopenic purpura', 'púrpura trombocitopênica trombótica'],
  ['varicose veins', 'veias varicosas'],
  ['normal comparison', 'comparação com o normal'],
  ['normal versus', 'normal em comparação com'],
  ['foreign body', 'corpo estranho'],
  ['foreign bodies', 'corpos estranhos'],
  ['abscess formation', 'formação de abscesso'],
  ['caseating granuloma', 'granuloma caseoso'],
  ['caseating granulomas', 'granulomas caseosos'],
  ['reactive hyperplasia', 'hiperplasia reativa'],
  ['nodular hyperplasia', 'hiperplasia nodular'],
  ['follicular hyperplasia', 'hiperplasia folicular'],
  ['sickle cell anemia', 'anemia falciforme'],
  ['iron deficiency anemia', 'anemia ferropriva'],
  ['megaloblastic anemia', 'anemia megaloblástica'],
  ['aplastic anemia', 'anemia aplásica'],
  ['small lymphocytic lymphoma', 'linfoma linfocítico de pequenas células'],
  ['large cell lymphoma', 'linfoma de grandes células'],
  ['acute lymphoblastic leukemia', 'leucemia linfoblástica aguda'],
  ['acute myelogenous leukemia', 'leucemia mieloide aguda'],
  ['chronic myelogenous leukemia', 'leucemia mieloide crônica'],
  ['chronic lymphocytic leukemia', 'leucemia linfocítica crônica'],
  ['end stage kidney', 'rim em estágio terminal'],
  ['horseshoe kidney', 'rim em ferradura'],
  ['multicystic dysplastic kidney', 'rim displásico multicístico'],
  ['renal calculus', 'cálculo renal'],
  ['renal calculi', 'cálculos renais'],
  ['transitional epithelium', 'epitélio urotelial'],
  ['cervical intraepithelial neoplasia', 'neoplasia intraepitelial cervical'],
  ['endometrial polyp', 'pólipo endometrial'],
  ['ectopic pregnancy', 'gestação ectópica'],
  ['gestational trophoblastic disease', 'doença trofoblástica gestacional'],
  ['mucinous cystadenoma', 'cistadenoma mucinoso'],
  ['serous cystadenoma', 'cistadenoma seroso'],
  ['granulosa cell tumor', 'tumor de células da granulosa'],
  ['linitis plastica', 'linite plástica'],
  ['signet ring cell', 'célula em anel de sinete'],
  ['gastric mucosa', 'mucosa gástrica'],
  ['small intestine', 'intestino delgado'],
  ['large intestine', 'intestino grosso'],
  ['mesenteric artery', 'artéria mesentérica'],
  ['hepatitis with bridging necrosis', 'hepatite com necrose em ponte'],
  ['hepatocellular steatosis', 'esteatose hepatocelular'],
  ['centrilobular necrosis', 'necrose centrolobular'],
  ['portal tract', 'trato portal'],
  ['bronchial mucosa', 'mucosa brônquica'],
  ['alveolar septa', 'septos alveolares'],
  ['honeycomb lung', 'pulmão em favo de mel'],
  ['oat cell carcinoma', 'carcinoma de pequenas células'],
  ['pleural effusion', 'derrame pleural'],
  ['cerebral hemisphere', 'hemisfério cerebral'],
  ['white matter', 'substância branca'],
  ['gray matter', 'substância cinzenta'],
  ['lacunar infarct', 'infarto lacunar'],
  ['watershed infarction', 'infarto de zona limítrofe'],
  ['brain stem', 'tronco encefálico'],
  ['neurofibrillary tangles', 'emaranhados neurofibrilares'],
  ['lewy bodies', 'corpos de Lewy'],
  ['wallerian degeneration', 'degeneração walleriana'],
  ['placental infarction', 'infarto placentário'],
  ['placenta previa', 'placenta prévia'],
  ['velamentous insertion', 'inserção velamentosa'],
  ['nuchal cord', 'circular de cordão'],
  ['neonatal respiratory distress', 'desconforto respiratório neonatal'],
  ['sudden infant death syndrome', 'síndrome da morte súbita do lactente'],
  ['shaken baby syndrome', 'síndrome do bebê sacudido'],
  ['gunshot wound', 'ferida por projétil de arma de fogo'],
  ['stab wound', 'ferida por instrumento perfurocortante'],
  ['incised wound', 'ferida incisa'],
  ['blunt force trauma', 'trauma por força contundente'],
  ['thermal injury', 'lesão térmica'],
  ["hashimoto's thyroiditis", 'tireoidite de Hashimoto'],
  ["marfan's syndrome", 'síndrome de Marfan'],
  ["cushing's syndrome", 'síndrome de Cushing'],
  ["graves' disease", 'doença de Graves'],
  ["parkinson's disease", 'doença de Parkinson'],
  ["addison's disease", 'doença de Addison'],
  ["non-hodgkin's lymphoma", 'linfoma não Hodgkin'],
  ['renal hyperplastic arteriolosclerosis', 'arteriolosclerose hiperplásica renal'],
  ['renal hyaline arteriolosclerosis', 'arteriolosclerose hialina renal'],
  ['renal arterial fibrinoid necrosis', 'necrose fibrinoide arterial renal'],
  ["monckeberg's medial calcific arteriosclerosis", 'arteriosclerose calcificada da média de Mönckeberg'],
  ["monckeberg's medial calcific sclerosis", 'esclerose calcificada da média de Mönckeberg'],
  ['recent thrombus', 'trombo recente'],
  ['atherosclerotic narrowing', 'estreitamento aterosclerótico'],
  ['recanalized thrombosis', 'trombose recanalizada'],
  ['calcific atherosclerosis', 'aterosclerose calcificada'],
  ['occlusive atherosclerosis', 'aterosclerose oclusiva'],
  ['hypertensive emergency', 'emergência hipertensiva'],
  ['fibrin stain', 'coloração para fibrina'],
  ['aortas with mild, moderate, and severe atherosclerosis', 'aortas com aterosclerose leve, moderada e grave'],
  ['acute myocardial infarction', 'infarto agudo do miocárdio'],
  ['remote myocardial infarction', 'infarto antigo do miocárdio'],
  ['mild coronary atherosclerosis', 'aterosclerose coronariana leve'],
  ['severe coronary atherosclerosis', 'aterosclerose coronariana grave'],
  ['atherosclerotic aneurysm', 'aneurisma aterosclerótico'],
  ['renal vein thrombosis', 'trombose da veia renal'],
  ['fat embolism', 'embolia gordurosa'],
  ['subdural hematoma', 'hematoma subdural'],
  ['epidural hematoma', 'hematoma epidural'],
  ['chronic abscess', 'abscesso crônico'],
  ['acute abscess', 'abscesso agudo'],
  ['adrenal gland', 'glândula suprarrenal'],
  ['lower extremity', 'membro inferior'],
  ['upper extremity', 'membro superior'],
  ["crohn's disease", 'doença de Crohn'],
  ["hodgkin's disease", 'linfoma de Hodgkin'],
  ["alzheimer's disease", 'doença de Alzheimer'],
  ['wilms tumor', 'tumor de Wilms'],
  ['libman-sacks endocarditis', 'endocardite de Libman-Sacks'],
  ['rheumatic valvulitis', 'valvulite reumática'],
  ['congo red stain', 'coloração pelo vermelho Congo'],
  ['silver stain', 'coloração pela prata'],
  ['trichrome stain', 'coloração tricrômica'],
  ['periodic acid schiff stain', 'coloração PAS'],
  ['immunohistochemical stain', 'coloração imuno-histoquímica'],
  ['renal transplant rejection', 'rejeição de transplante renal'],
  ['cardiac transplant rejection', 'rejeição de transplante cardíaco'],
  ['bone marrow transplant', 'transplante de medula óssea'],
  ['twin-twin transfusion', 'transfusão feto-fetal'],
  ['fetal demise', 'óbito fetal'],
  ['hydrops fetalis', 'hidropisia fetal'],
  ['placental villi', 'vilosidades placentárias'],
  ['chorionic villi', 'vilosidades coriônicas'],
  ['septal defect', 'defeito septal'],
  ['atrial septal defect', 'comunicação interatrial'],
  ['ventricular septal defect', 'comunicação interventricular'],
  ['mitral valve', 'valva mitral'],
  ['aortic valve', 'valva aórtica'],
  ['glomerulosclerosis', 'glomeruloesclerose'],
  ['glomerulonephritis', 'glomerulonefrite'],
  ['tubulointerstitial nephritis', 'nefrite tubulointersticial'],
  ['interstitial nephritis', 'nefrite intersticial'],
  ['pericarditis', 'pericardite'],
  ['cardiomyopathy', 'cardiomiopatia'],
  ['thyroiditis', 'tireoidite'],
  ['endometriosis', 'endometriose'],
  ['leiomyoma', 'leiomioma'],
  ['leiomyosarcoma', 'leiomiossarcoma'],
  ['diverticulosis', 'diverticulose'],
  ['diverticulitis', 'diverticulite'],
  ['pseudomembranous colitis', 'colite pseudomembranosa'],
  ['tuberculosis', 'tuberculose'],
  ['amyloidosis', 'amiloidose'],
  ['vasculitis', 'vasculite'],
  ['scleroderma', 'esclerodermia'],
  ['sclerodactyly', 'esclerodactilia'],
  ['pheochromocytoma', 'feocromocitoma'],
  ['neuroblastoma', 'neuroblastoma'],
  ['schwannoma', 'schwannoma'],
  ['meningioma', 'meningioma'],
  ['teratoma', 'teratoma'],
  ['holoprosencephaly', 'holoprosencefalia'],
  ['anencephaly', 'anencefalia'],
  ['cerebral contusions', 'contusões cerebrais'],
  ['cerebral contusion', 'contusão cerebral'],
  ['erythema', 'eritema'],
  ['gangrenous necrosis', 'necrose gangrenosa'],
  ['bladder', 'bexiga'],
  ['larynx', 'laringe'],
  ['disseminated intravascular coagulopathy', 'coagulação intravascular disseminada'],
  ['chronic obstructive pulmonary disease', 'doença pulmonar obstrutiva crônica'],
  ['acute respiratory distress syndrome', 'síndrome do desconforto respiratório agudo'],
  ['adult respiratory distress syndrome', 'síndrome do desconforto respiratório do adulto'],
  ['squamous cell carcinoma', 'carcinoma de células escamosas'],
  ['transitional cell carcinoma', 'carcinoma urotelial'],
  ['renal cell carcinoma', 'carcinoma de células renais'],
  ['small cell carcinoma', 'carcinoma de pequenas células'],
  ['large cell carcinoma', 'carcinoma de grandes células'],
  ['hepatocellular carcinoma', 'carcinoma hepatocelular'],
  ['papillary thyroid carcinoma', 'carcinoma papilífero da tireoide'],
  ['endometrial adenocarcinoma', 'adenocarcinoma endometrial'],
  ['prostatic adenocarcinoma', 'adenocarcinoma prostático'],
  ['metastatic adenocarcinoma', 'adenocarcinoma metastático'],
  ['metastatic carcinoma', 'carcinoma metastático'],
  ['bronchogenic carcinoma', 'carcinoma broncogênico'],
  ['invasive ductal carcinoma', 'carcinoma ductal invasivo'],
  ['ductal carcinoma in situ', 'carcinoma ductal in situ'],
  ['lobular carcinoma in situ', 'carcinoma lobular in situ'],
  ['malignant melanoma', 'melanoma maligno'],
  ['basal cell carcinoma', 'carcinoma basocelular'],
  ['yolk sac tumor', 'tumor do saco vitelino'],
  ['germ cell tumor', 'tumor de células germinativas'],
  ['myocardial infarction', 'infarto do miocárdio'],
  ['pulmonary infarction', 'infarto pulmonar'],
  ['cerebral infarction', 'infarto cerebral'],
  ['ischemic infarction', 'infarto isquêmico'],
  ['hemorrhagic infarction', 'infarto hemorrágico'],
  ['pulmonary thromboembolus', 'tromboêmbolo pulmonar'],
  ['pulmonary embolus', 'êmbolo pulmonar'],
  ['coronary atherosclerosis', 'aterosclerose coronariana'],
  ['atheromatous plaque', 'placa ateromatosa'],
  ['hyaline arteriolosclerosis', 'arteriolosclerose hialina'],
  ['hyperplastic arteriolosclerosis', 'arteriolosclerose hiperplásica'],
  ['fibrinoid necrosis', 'necrose fibrinoide'],
  ['coagulative necrosis', 'necrose coagulativa'],
  ['liquefactive necrosis', 'necrose liquefativa'],
  ['caseous necrosis', 'necrose caseosa'],
  ['fat necrosis', 'necrose gordurosa'],
  ['acute inflammation', 'inflamação aguda'],
  ['chronic inflammation', 'inflamação crônica'],
  ['granulomatous inflammation', 'inflamação granulomatosa'],
  ['foreign body giant cell', 'célula gigante de corpo estranho'],
  ['giant cell', 'célula gigante'],
  ['granulation tissue', 'tecido de granulação'],
  ['acute appendicitis', 'apendicite aguda'],
  ['chronic cholecystitis', 'colecistite crônica'],
  ['acute cholecystitis', 'colecistite aguda'],
  ['chronic pancreatitis', 'pancreatite crônica'],
  ['acute pancreatitis', 'pancreatite aguda'],
  ['chronic pyelonephritis', 'pielonefrite crônica'],
  ['acute pyelonephritis', 'pielonefrite aguda'],
  ['glomerular crescent', 'crescente glomerular'],
  ['chronic glomerulonephritis', 'glomerulonefrite crônica'],
  ['membranous nephropathy', 'nefropatia membranosa'],
  ['diabetic nephropathy', 'nefropatia diabética'],
  ['polycystic kidney disease', 'doença renal policística'],
  ['end stage renal disease', 'doença renal em estágio terminal'],
  ['fatty change', 'esteatose'],
  ['fatty liver', 'esteatose hepática'],
  ['chronic hepatitis', 'hepatite crônica'],
  ['acute hepatitis', 'hepatite aguda'],
  ['viral hepatitis', 'hepatite viral'],
  ['biliary cirrhosis', 'cirrose biliar'],
  ['portal cirrhosis', 'cirrose portal'],
  ['sclerosing cholangitis', 'colangite esclerosante'],
  ['chronic ulcerative colitis', 'retocolite ulcerativa crônica'],
  ['ulcerative colitis', 'retocolite ulcerativa'],
  ['crohn disease', 'doença de Crohn'],
  ['peptic ulcer', 'úlcera péptica'],
  ['gastric ulcer', 'úlcera gástrica'],
  ['esophageal varices', 'varizes esofágicas'],
  ['barrett esophagus', 'esôfago de Barrett'],
  ['adenomatous polyp', 'pólipo adenomatoso'],
  ['hyperplastic polyp', 'pólipo hiperplásico'],
  ['bowel obstruction', 'obstrução intestinal'],
  ['meconium aspiration', 'aspiração de mecônio'],
  ['hyaline membrane disease', 'doença da membrana hialina'],
  ['bronchopulmonary dysplasia', 'displasia broncopulmonar'],
  ['bronchial asthma', 'asma brônquica'],
  ['bronchiectasis', 'bronquiectasia'],
  ['bronchopneumonia', 'broncopneumonia'],
  ['lobar pneumonia', 'pneumonia lobar'],
  ['interstitial pneumonitis', 'pneumonite intersticial'],
  ['pulmonary edema', 'edema pulmonar'],
  ['pulmonary emphysema', 'enfisema pulmonar'],
  ['pulmonary fibrosis', 'fibrose pulmonar'],
  ['hyaline membranes', 'membranas hialinas'],
  ['lymph node', 'linfonodo'],
  ['bone marrow', 'medula óssea'],
  ['hodgkin disease', 'linfoma de Hodgkin'],
  ['reed sternberg cells', 'células de Reed-Sternberg'],
  ['multiple myeloma', 'mieloma múltiplo'],
  ['acute leukemia', 'leucemia aguda'],
  ['chronic leukemia', 'leucemia crônica'],
  ['endometrial hyperplasia', 'hiperplasia endometrial'],
  ['prostatic hyperplasia', 'hiperplasia prostática'],
  ['benign prostatic hyperplasia', 'hiperplasia prostática benigna'],
  ['hydatidiform mole', 'mola hidatiforme'],
  ['placental abruption', 'descolamento prematuro da placenta'],
  ['placenta accreta', 'placenta acreta'],
  ['chorioamnionitis', 'corioamnionite'],
  ['umbilical cord', 'cordão umbilical'],
  ['neural tube defect', 'defeito do tubo neural'],
  ['congenital heart disease', 'cardiopatia congênita'],
  ['rheumatic heart disease', 'cardiopatia reumática'],
  ['bacterial endocarditis', 'endocardite bacteriana'],
  ['infective endocarditis', 'endocardite infecciosa'],
  ['left ventricular hypertrophy', 'hipertrofia ventricular esquerda'],
  ['congestive heart failure', 'insuficiência cardíaca congestiva'],
  ['alzheimer disease', 'doença de Alzheimer'],
  ['multiple sclerosis', 'esclerose múltipla'],
  ['subarachnoid hemorrhage', 'hemorragia subaracnóidea'],
  ['intracerebral hemorrhage', 'hemorragia intracerebral'],
  ['cerebral edema', 'edema cerebral'],
  ['brain abscess', 'abscesso cerebral'],
  ['bacterial meningitis', 'meningite bacteriana'],
  ['viral meningitis', 'meningite viral'],
  ['papillary carcinoma', 'carcinoma papilífero'],
  ['follicular adenoma', 'adenoma folicular'],
  ['follicular carcinoma', 'carcinoma folicular'],
  ['adrenal cortical adenoma', 'adenoma cortical da suprarrenal'],
  ['adrenal cortical carcinoma', 'carcinoma cortical da suprarrenal'],
  ['islet cell adenoma', 'adenoma de células das ilhotas'],
  ['cerebral hemisphere', 'hemisfério cerebral'],
  ['coronal section', 'corte coronal'],
  ['cross section', 'corte transversal'],
  ['cross sections', 'cortes transversais'],
  ['lines of zahn', 'linhas de Zahn'],
  ['high power', 'grande aumento'],
  ['medium power', 'aumento intermediário'],
  ['low power', 'pequeno aumento'],
]

const PALAVRAS: Record<string, string> = {
  acute: 'agudo', chronic: 'crônico', severe: 'grave', mild: 'leve', moderate: 'moderado',
  remote: 'antigo', recent: 'recente', early: 'inicial', late: 'tardio', diffuse: 'difuso',
  focal: 'focal', multifocal: 'multifocal', massive: 'maciço', extensive: 'extenso',
  benign: 'benigno', malignant: 'maligno', metastatic: 'metastático', invasive: 'invasivo',
  well: 'bem', poorly: 'pouco', differentiated: 'diferenciado', undifferentiated: 'indiferenciado',
  gross: 'macroscopia', microscopic: 'microscopia', stain: 'coloração', stained: 'corado',
  section: 'corte', smear: 'esfregaço', tissue: 'tecido', cells: 'células', cell: 'célula',
  artery: 'artéria', arteries: 'artérias', arterial: 'arterial', vein: 'veia', veins: 'veias',
  vascular: 'vascular', coronary: 'coronariano', aorta: 'aorta', aortic: 'aórtico',
  heart: 'coração', myocardium: 'miocárdio', myocardial: 'miocárdico', epicardium: 'epicárdio',
  pericardium: 'pericárdio', valve: 'valva', ventricular: 'ventricular', atrial: 'atrial',
  thrombus: 'trombo', thrombi: 'trombos', thrombosis: 'trombose', embolus: 'êmbolo',
  embolism: 'embolia', atherosclerosis: 'aterosclerose', atherosclerotic: 'aterosclerótico',
  dissection: 'dissecção', hypertensive: 'hipertensivo', hypertension: 'hipertensão',
  hemorrhage: 'hemorragia', hemorrhages: 'hemorragias', infarct: 'infarto', infarction: 'infarto',
  ischemic: 'isquêmico', ischemia: 'isquemia', congestion: 'congestão', edema: 'edema',
  necrosis: 'necrose', fibrosis: 'fibrose', sclerosis: 'esclerose', calcification: 'calcificação',
  calcific: 'calcificado', hyaline: 'hialino', fibrin: 'fibrina', fibrinoid: 'fibrinoide',
  inflammation: 'inflamação', inflammatory: 'inflamatório', abscess: 'abscesso', granuloma: 'granuloma',
  fibrinous: 'fibrinoso', purulent: 'purulento', interstitial: 'intersticial',
  granulomatous: 'granulomatoso', infection: 'infecção', bacterial: 'bacteriano', viral: 'viral',
  fungal: 'fúngico', parasite: 'parasita', pneumonia: 'pneumonia', hepatitis: 'hepatite',
  lung: 'pulmão', pulmonary: 'pulmonar', bronchial: 'brônquico', pleura: 'pleura',
  liver: 'fígado', hepatic: 'hepático', gallbladder: 'vesícula biliar', pancreas: 'pâncreas',
  pancreatic: 'pancreático', stomach: 'estômago', gastric: 'gástrico', esophagus: 'esôfago',
  esophageal: 'esofágico', intestine: 'intestino', intestinal: 'intestinal', bowel: 'intestino',
  colon: 'cólon', colonic: 'colônico', appendix: 'apêndice', rectum: 'reto',
  kidney: 'rim', renal: 'renal', glomerulus: 'glomérulo', glomeruli: 'glomérulos',
  glomerular: 'glomerular', tubular: 'tubular', tubules: 'túbulos', pelvis: 'pelve',
  brain: 'cérebro', cerebral: 'cerebral', cerebrum: 'cérebro', cerebellum: 'cerebelo',
  spinal: 'espinal', cord: 'medula', meninges: 'meninges', meningeal: 'meníngeo',
  nerve: 'nervo', neuronal: 'neuronal', white: 'branca', gray: 'cinzenta',
  subdural: 'subdural', epidural: 'epidural', hemorrhagic: 'hemorrágico',
  skin: 'pele', cutaneous: 'cutâneo', dermal: 'dérmico', epidermal: 'epidérmico',
  bone: 'osso', marrow: 'medula', soft: 'mole', muscle: 'músculo',
  thyroid: 'tireoide', parathyroid: 'paratireoide', adrenal: 'suprarrenal', pituitary: 'hipófise',
  prostate: 'próstata', prostatic: 'prostático', testis: 'testículo', testicular: 'testicular',
  uterus: 'útero', uterine: 'uterino', cervix: 'colo uterino', cervical: 'cervical',
  ovary: 'ovário', ovarian: 'ovariano', fallopian: 'tubário', vagina: 'vagina', vulva: 'vulva',
  placenta: 'placenta', placental: 'placentário', fetal: 'fetal', fetus: 'feto',
  breast: 'mama', mammary: 'mamário', lymph: 'linfático', node: 'nodo', spleen: 'baço',
  gland: 'glândula', duct: 'ducto', ducts: 'ductos', cyst: 'cisto', cystic: 'cístico',
  tumor: 'tumor', tumors: 'tumores', neoplasm: 'neoplasia', carcinoma: 'carcinoma',
  serous: 'seroso', embryonal: 'embrionário', urothelial: 'urotelial', cortical: 'cortical',
  adenocarcinoma: 'adenocarcinoma', adenoma: 'adenoma', sarcoma: 'sarcoma', lymphoma: 'linfoma',
  leukemia: 'leucemia', melanoma: 'melanoma', metastasis: 'metástase', dysplasia: 'displasia',
  hyperplasia: 'hiperplasia', hypertrophy: 'hipertrofia', atrophy: 'atrofia', polyp: 'pólipo',
  ulcer: 'úlcera', erosion: 'erosão', perforation: 'perfuração', obstruction: 'obstrução',
  rupture: 'ruptura', aneurysm: 'aneurisma', plaque: 'placa', nodule: 'nódulo', nodules: 'nódulos',
  deposits: 'depósitos', deposition: 'deposição', amyloid: 'amiloide', pigment: 'pigmento',
  fat: 'gordura', fatty: 'gorduroso', iron: 'ferro', cholesterol: 'colesterol',
  injury: 'lesão', disease: 'doença', syndrome: 'síndrome', congenital: 'congênito',
  patient: 'paciente', twin: 'gêmeo', pregnancy: 'gestação', rejection: 'rejeição',
  transplantation: 'transplante', transplant: 'transplante', demise: 'óbito', hydrops: 'hidropisia',
  atresia: 'atresia', recessive: 'recessivo', dominant: 'dominante', exudate: 'exsudato',
  acquired: 'adquirido', trauma: 'trauma', wound: 'ferida', gunshot: 'arma de fogo',
  exit: 'saída', entrance: 'entrada', fracture: 'fratura', burn: 'queimadura',
  with: 'com', without: 'sem', and: 'e', of: 'de', in: 'em', into: 'na', from: 'de',
  on: 'em', to: 'para', by: 'por', involving: 'envolvendo', associated: 'associado',
  left: 'esquerdo', right: 'direito', anterior: 'anterior', posterior: 'posterior',
  external: 'externo', internal: 'interno', bilateral: 'bilateral', multiple: 'múltiplos',
  type: 'tipo', stage: 'estágio', grade: 'grau', pattern: 'padrão', changes: 'alterações',
  change: 'alteração', reaction: 'reação', formation: 'formação', cavity: 'cavidade',
  wall: 'parede', surface: 'superfície', lumen: 'luz', capsule: 'cápsula',
  lobe: 'lobo', peripheral: 'periférico', blood: 'sangue', anemia: 'anemia',
  metastases: 'metástases', ulceration: 'ulceração',
  islet: 'ilhota', view: 'vista', light: 'luz', range: 'campo', contact: 'contato',
  following: 'após', vessel: 'vaso', vessels: 'vasos', invasion: 'invasão',
  marked: 'acentuado', reactive: 'reativo', infiltrating: 'infiltrativo',
  torsion: 'torção', ruptured: 'rompido', bodies: 'corpos', glands: 'glândulas',
  lipid: 'lipídico', streaks: 'estrias', intermediate: 'intermediário',
  abnormal: 'anormal', abnormalities: 'anormalidades', abrasions: 'abrasões', abscesses: 'abscessos',
  abscessing: 'abscedado', accessory: 'acessório', acid: 'ácido', acoustic: 'acústico', age: 'idade',
  ages: 'idades', agenesis: 'agenesia', alcoholic: 'alcoólico', allograft: 'aloenxerto',
  alveolar: 'alveolar', amnion: 'âmnio', amnionic: 'amniótico', amniotic: 'amniótico',
  ampulla: 'ampola', anaphylaxis: 'anafilaxia', anaplastic: 'anaplásico',
  anastomosis: 'anastomose', antibody: 'anticorpo', antiphospholipid: 'antifosfolípide',
  antitrypsin: 'antitripsina', apoptosis: 'apoptose', arch: 'arco', area: 'área',
  arising: 'originado', arm: 'braço', arteriolar: 'arteriolar', arteriole: 'arteríola',
  arteriolitis: 'arteriolite', arteriopathy: 'arteriopatia', arteriosclerosis: 'arteriosclerose',
  arteritis: 'arterite', asphyxia: 'asfixia', aspiration: 'aspiração', asthma: 'asma',
  astrocytoma: 'astrocitoma', atheroma: 'ateroma', atherosis: 'aterose', atrophic: 'atrófico',
  atypical: 'atípico', automatic: 'automático', autosomal: 'autossômico', axonal: 'axonal',
  baby: 'bebê', bacteria: 'bactérias', band: 'banda', basal: 'basal', base: 'base',
  basophilic: 'basofílico', bicuspid: 'bicúspide', bifid: 'bífido', biliary: 'biliar',
  bilirubin: 'bilirrubina', bilobed: 'bilobado', bioprosthesis: 'bioprótese',
  birefringence: 'birrefringência', blade: 'lâmina', blister: 'bolha', blue: 'azul',
  blunt: 'contundente', borderline: 'limítrofe', brainstem: 'tronco encefálico',
  bridging: 'em ponte', bronchitis: 'bronquite', bronchus: 'brônquio', bullet: 'projétil',
  bullets: 'projéteis', bullous: 'bolhoso', butterfly: 'borboleta', bypass: 'revascularização',
  calculus: 'cálculo', cancer: 'câncer', cardiac: 'cardíaco',
  carditis: 'cardite', carotid: 'carótida', caseating: 'caseoso', caseation: 'caseificação',
  caudate: 'caudado', cavities: 'cavidades', cecum: 'ceco', cellular: 'celular',
  centrilobular: 'centrolobular', cerebrospinal: 'cerebrospinal', characteristics: 'características',
  childhood: 'infância', cholangitis: 'colangite', cholestasis: 'colestase',
  chylous: 'quiloso', circular: 'circular', cirrhosis: 'cirrose', cleaved: 'clivado',
  cleft: 'fenda', close: 'próximo', coarctation: 'coarctação', collapse: 'colapso',
  colloid: 'coloide', column: 'coluna', columnar: 'colunar', common: 'comum',
  compared: 'comparado', comparison: 'comparação', complex: 'complexo', compression: 'compressão',
  conjoined: 'conjugado', conjunctival: 'conjuntival', contrecoup: 'contragolpe',
  contusion: 'contusão', contusions: 'contusões', cords: 'cordões', cranial: 'craniano',
  crescents: 'crescentes', crypt: 'cripta', crystals: 'cristais', damage: 'dano', days: 'dias',
  death: 'morte', decidual: 'decidual', decreased: 'diminuído', deficiency: 'deficiência',
  deformed: 'deformado', deformities: 'deformidades', degeneration: 'degeneração',
  degrees: 'graus', demonstrating: 'demonstrando', dermatitis: 'dermatite', descending: 'descendente',
  desquamative: 'descamativo', destruction: 'destruição', diabetic: 'diabético', diagram: 'diagrama',
  dialysis: 'diálise', diamnionic: 'diamniótico', diapedesis: 'diapedese',
  diaphragmatic: 'diafragmático', dichorionic: 'dicoriônico', difference: 'diferença',
  different: 'diferente', dilated: 'dilatado', discs: 'discos', disk: 'disco', disorder: 'distúrbio',
  distribution: 'distribuição', diverticulum: 'divertículo', double: 'duplo', drowning: 'afogamento',
  drug: 'fármaco', ductal: 'ductal', duodenal: 'duodenal', dura: 'dura-máter',
  dystrophic: 'distrófico', ear: 'orelha', ecchymoses: 'equimoses', ectopic: 'ectópico',
  edge: 'borda', effect: 'efeito', effusion: 'derrame', effusions: 'derrames',
  electrocution: 'eletrocussão', emboli: 'êmbolos', embolization: 'embolização', embryo: 'embrião',
  embryos: 'embriões', emergency: 'emergência', emphysema: 'enfisema', empyema: 'empiema',
  epithelium: 'epitélio', erosions: 'erosões', esophagitis: 'esofagite', exogenous: 'exógeno',
  explanted: 'explantado', extrahepatic: 'extra-hepático', exudation: 'exsudação', eye: 'olho',
  facial: 'facial', familial: 'familiar', features: 'características', feet: 'pés',
  ferruginous: 'ferruginoso', fever: 'febre', fibers: 'fibras', fibrous: 'fibroso',
  finger: 'dedo', fingernails: 'unhas', fire: 'fogo', fistula: 'fístula', floor: 'assoalho',
  fluid: 'líquido', follicular: 'folicular', foot: 'pé', forearm: 'antebraço', forehead: 'fronte',
  fractures: 'fraturas', fragmented: 'fragmentado', friction: 'fricção', frontal: 'frontal',
  fungus: 'fungo', ganglia: 'gânglios', gastritis: 'gastrite', gastrointestinal: 'gastrointestinal',
  gastropathy: 'gastropatia', germinal: 'germinativo', gestational: 'gestacional',
  gliosis: 'gliose', globules: 'glóbulos', graft: 'enxerto', granulomas: 'granulomas',
  granulomatosis: 'granulomatose', green: 'verde', gun: 'arma de fogo', hand: 'mão',
  hands: 'mãos', head: 'cabeça',
  healing: 'cicatrização', hematoma: 'hematoma', hemochromatosis: 'hemocromatose',
  hemoglobin: 'hemoglobina', hemolytic: 'hemolítico', hemorrhoids: 'hemorroidas',
  hemosiderin: 'hemossiderina', hemosiderosis: 'hemossiderose', hepatocytes: 'hepatócitos',
  hereditary: 'hereditário', hernia: 'hérnia', herniation: 'herniação', hilar: 'hilar',
  histologically: 'histologicamente', horizontal: 'horizontal', horn: 'corno',
  horseshoe: 'em ferradura', host: 'hospedeiro', hydrocele: 'hidrocele',
  hydrocephalus: 'hidrocefalia', hydronephrosis: 'hidronefrose', hydroureter: 'hidroureter',
  hypercalcemia: 'hipercalcemia', hyperinflation: 'hiperinsuflação', hypersegmented: 'hipersegmentado',
  hypersensitivity: 'hipersensibilidade', hypertrophic: 'hipertrófico', hypochromic: 'hipocrômico',
  hypoplasia: 'hipoplasia', icterus: 'icterícia', ileum: 'íleo', ileus: 'íleo paralítico',
  immunostain: 'imunocoloração', incised: 'inciso', inclusions: 'inclusões', increased: 'aumentado',
  induced: 'induzido', infant: 'lactente', inferior: 'inferior', ingestion: 'ingestão',
  injection: 'injeção', ink: 'tinta', insertion: 'inserção', intestinalis: 'intestinal',
  intracranial: 'intracraniano', intraepithelial: 'intraepitelial', intrahepatic: 'intra-hepático',
  intrauterine: 'intrauterino', intravenous: 'intravenoso', intraventricular: 'intraventricular',
  involution: 'involução', irregular: 'irregular', jaundice: 'icterícia', joint: 'articulação',
  junction: 'junção', kidneys: 'rins', knife: 'faca', knot: 'nó', laceration: 'laceração',
  lacerations: 'lacerações', lacunar: 'lacunar', large: 'grande', laryngeal: 'laríngeo',
  lateral: 'lateral', leg: 'perna', legs: 'pernas', lesion: 'lesão', lesions: 'lesões',
  limb: 'membro', lip: 'lábio', localized: 'localizado', longitudinal: 'longitudinal',
  loss: 'perda', lungs: 'pulmões', macrophage: 'macrófago', macrophages: 'macrófagos',
  major: 'maior', malar: 'malar', malformation: 'malformação', mass: 'massa', maternal: 'materno',
  matrix: 'matriz', matter: 'substância', mature: 'maduro', mechanical: 'mecânico',
  mechanism: 'mecanismo', meconium: 'mecônio', medial: 'medial', medullary: 'medular',
  membranes: 'membranas', mesenteric: 'mesentérico', mixed: 'misto', mucin: 'mucina',
  mucinous: 'mucinoso', mucosa: 'mucosa', mucus: 'muco', mural: 'mural', muscular: 'muscular',
  narrowing: 'estreitamento', necrotizing: 'necrosante', neonatal: 'neonatal',
  nephritis: 'nefrite', nephropathy: 'nefropatia', neuroendocrine: 'neuroendócrino',
  neurofibrillary: 'neurofibrilar', neurons: 'neurônios', neutrophil: 'neutrófilo',
  neutrophilia: 'neutrofilia', neutrophils: 'neutrófilos', newborn: 'recém-nascido',
  nodes: 'nodos', nodular: 'nodular', non: 'não', normal: 'normal', nucleated: 'nucleado',
  nucleus: 'núcleo', occlusive: 'oclusivo', one: 'um', oral: 'oral', organized: 'organizado',
  organizing: 'em organização', overdose: 'superdose', pallidum: 'pálido', papillary: 'papilífero',
  paradoxical: 'paradoxal', partial: 'parcial', passive: 'passivo', patent: 'patente',
  patterned: 'padronizado', penetrating: 'penetrante', pericardial: 'pericárdico',
  perineural: 'perineural', peritoneal: 'peritoneal', peritoneum: 'peritônio',
  peritonitis: 'peritonite', petechiae: 'petéquias', petechial: 'petequial',
  phagocytosis: 'fagocitose', pigmentation: 'pigmentação', pigmented: 'pigmentado',
  placentas: 'placentas', plaques: 'placas', pleural: 'pleural', poisoning: 'intoxicação',
  polarizable: 'polarizável', polarized: 'polarizado', polycystic: 'policístico',
  polyps: 'pólipos', portal: 'portal', positive: 'positivo', positivity: 'positividade',
  postpartum: 'pós-parto', precursor: 'precursor', predominantly: 'predominantemente',
  preparation: 'preparação', primary: 'primário', progressive: 'progressivo', prolapse: 'prolapso',
  prolapsed: 'prolapsado', prominent: 'proeminente', prostatitis: 'prostatite', prosthesis: 'prótese',
  proximity: 'proximidade', pseudocyst: 'pseudocisto', resection: 'ressecção', resected: 'ressecado',
  rare: 'raro', recanalized: 'recanalizado', reflux: 'refluxo',
  respiratory: 'respiratório', restrictive: 'restritivo', retinal: 'retiniano',
  retraction: 'retração', retroperitoneum: 'retroperitônio', rheumatic: 'reumático',
  ridge: 'crista', roots: 'raízes', round: 'redondo', sac: 'saco', sagittal: 'sagital',
  salivary: 'salivar', satellite: 'satélite', scalding: 'escaldadura', scalp: 'couro cabeludo',
  scar: 'cicatriz', scarring: 'cicatrização', scars: 'cicatrizes', second: 'segundo',
  segmental: 'segmentar', senile: 'senil', separate: 'separado', septal: 'septal',
  septum: 'septo', serosa: 'serosa', shaken: 'sacudido', shift: 'desvio', shooting: 'disparo',
  simple: 'simples', single: 'único', site: 'local', size: 'tamanho', skull: 'crânio',
  small: 'pequeno', specimen: 'espécime', splenic: 'esplênico', splenomegaly: 'esplenomegalia',
  spreading: 'disseminação', squamous: 'escamoso', staining: 'coloração', stalk: 'pedículo',
  status: 'estado', stem: 'tronco', stenosis: 'estenose', stool: 'fezes',
  streptococcal: 'estreptocócico', subacute: 'subagudo', sudden: 'súbito', suture: 'sutura',
  systemic: 'sistêmico', tamponade: 'tamponamento', tear: 'rotura', temporal: 'temporal',
  terminal: 'terminal', thermal: 'térmico', thickness: 'espessura', third: 'terceiro',
  three: 'três', thrombotic: 'trombótico', through: 'através de', thymus: 'timo',
  tonsillar: 'tonsilar', track: 'trajeto', transmural: 'transmural', transurethral: 'transuretral',
  trimester: 'trimestre', true: 'verdadeiro', tube: 'tuba', twins: 'gêmeos', two: 'dois',
  ulcers: 'úlceras', uremic: 'urêmico', ureters: 'ureteres', uric: 'úrico', varicose: 'varicoso',
  various: 'diversos', vegetations: 'vegetações', ventricle: 'ventrículo', versus: 'versus',
  victim: 'vítima', views: 'vistas', villitis: 'vilite', villous: 'viloso', virus: 'vírus',
  volvulus: 'vólvulo', vulvar: 'vulvar', watershed: 'zona limítrofe', week: 'semana',
  the: 'o', weeks: 'semanas', whipworm: 'tricocéfalo', wounds: 'feridas',
  xanthogranulomatous: 'xantogranulomatoso',
  ball: 'esfera', body: 'corpo', cut: 'corte', model: 'modelo', red: 'vermelho',
  seen: 'observado', toenail: 'unha do pé',
}

function escaparRegExp(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function capitalizar(valor: string): string {
  return valor.length > 0 ? valor[0].toLocaleUpperCase('pt-BR') + valor.slice(1) : valor
}

export function traduzirTituloWebPathUtah(tituloOriginal: string): string {
  let titulo = tituloOriginal
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s*\[[A-Z][A-Z0-9 ,/-]*\]\s*/g, ' ')
    .replace(/,?\s*high power microscopic\s*$/i, ' — microscopia em grande aumento')
    .replace(/,?\s*medium power microscopic\s*$/i, ' — microscopia em aumento intermediário')
    .replace(/,?\s*low power microscopic\s*$/i, ' — microscopia em pequeno aumento')
    .replace(/,?\s*microscopic\s*$/i, ' — microscopia')
    .replace(/,?\s*gross\s*$/i, ' — macroscopia')

  const traducoesProtegidas: string[] = []
  for (const [origem, traducao] of FRASES) {
    titulo = titulo.replace(new RegExp(`\\b${escaparRegExp(origem)}\\b`, 'gi'), () => {
      const indice = traducoesProtegidas.push(traducao) - 1
      return `§${indice}§`
    })
  }

  titulo = titulo.replace(/\b[A-Za-z]+\b/g, (palavra) => PALAVRAS[palavra.toLowerCase()] ?? palavra)
  titulo = titulo
    .replace(/§(\d+)§/g, (_marcador, indice: string) => traducoesProtegidas[Number(indice)])
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+—\s+/g, ' — ')
    .trim()

  return capitalizar(titulo)
}

export function traduzirSecaoWebPathUtah(secaoOriginal: string): string {
  const traduzida = traduzirTituloWebPathUtah(secaoOriginal)
  return traduzida.replace(/\s+—\s+(?:macro|micro)scopia.*$/i, '')
}

export interface LeituraDidaticaWebPathUtah {
  descricao: string
  observacoes: string[]
}

function contextoAnatomico(tituloOriginal: string): string {
  if (/heart|myocard|coronary|aort|valve|ventric|atrial|pericard/i.test(tituloOriginal)) {
    return 'No eixo cardiovascular, relacione parede, luz, território perfundido e adaptação das câmaras: a topografia permite distinguir lesão primariamente vascular, miocárdica, valvar ou pericárdica.'
  }
  if (/lung|pulmon|bronch|alveol|pleur|pneumo/i.test(tituloOriginal)) {
    return 'No pulmão, separe via aérea, alvéolo, interstício, vaso e pleura. A ocupação alveolar, o espessamento septal e a remodelação brônquica produzem mecanismos funcionais diferentes e não devem ser descritos como um único padrão.'
  }
  if (/kidney|renal|glomer|tubul|ureter|bladder/i.test(tituloOriginal)) {
    return 'No rim e trato urinário, examine glomérulos, túbulos, interstício e vasos como compartimentos independentes; depois integre distribuição cortical ou medular, cronicidade e repercussão obstrutiva.'
  }
  if (/liver|hepat|portal|biliar|gallbladder|cholang/i.test(tituloOriginal)) {
    return 'No fígado e vias biliares, preserve a orientação portal–lobular–centrolobular. Interface, sinusóides, canalículos, padrão da fibrose e distribuição da necrose situam o mecanismo e a fase da doença.'
  }
  if (/stomach|gastric|esoph|intestin|bowel|colon|rect|appendix|duoden|ileum|cecum/i.test(tituloOriginal)) {
    return 'No tubo digestivo, determine segmento, camada e profundidade. Mucosa, criptas ou glândulas, submucosa, muscular e serosa explicam tanto o padrão de extensão quanto as complicações de ulceração, obstrução e perfuração.'
  }
  if (/brain|cerebr|cerebell|mening|spinal|neuron|glio|ventricle/i.test(tituloOriginal)) {
    return 'No sistema nervoso, a localização é parte do diagnóstico: diferencie substância cinzenta, substância branca, meninges e sistema ventricular, procurando perda neuronal, gliose, desmielinização, edema e efeito de massa.'
  }
  if (/thyroid|parathyroid|adrenal|pituitary|islet|pancrea|pheochromo/i.test(tituloOriginal)) {
    return 'Em órgãos endócrinos, compare a arquitetura glandular residual, o padrão de crescimento e a relação com cápsula e vasos. A aparência precisa ser integrada à função hormonal, porque atividade clínica e atipia morfológica não são equivalentes.'
  }
  if (/uter|cervi|endometr|ovar|fallopian|vulva|vagina|prostat|testis|testicular|penis/i.test(tituloOriginal)) {
    return 'No trato genital, interprete epitélio, glândulas, estroma e musculatura no contexto de idade e função. A fronteira entre hiperplasia, displasia e invasão exige atenção à membrana basal e à resposta estromal.'
  }
  if (/placent|chorio|villi|umbilical|fetal|newborn|neonatal/i.test(tituloOriginal)) {
    return 'Na patologia perinatal, idade gestacional e compartimento materno, fetal ou placentário mudam o significado do achado. Maturação, perfusão e inflamação devem ser descritas separadamente antes da correlação clínica.'
  }
  if (/marrow|lymph|spleen|leuk|lymphoma|myeloma|anemia/i.test(tituloOriginal)) {
    return 'Na hematopatologia, comece por celularidade e arquitetura, depois compare as linhagens e o grau de maturação. Uma população aparentemente dominante só ganha significado quando distribuição, citologia e contexto periférico concordam.'
  }
  if (/wound|gunshot|stab|burn|fracture|contusion|asphyxia|drowning/i.test(tituloOriginal)) {
    return 'Na leitura médico-legal, descreva forma, bordas, profundidade e distribuição sem antecipar o mecanismo. Reação vital, temporalidade, trajeto e artefatos pós-morte precisam ser avaliados em conjunto.'
  }
  return 'Use o tecido normal do mesmo local como controle interno e relacione distribuição, intensidade e temporalidade; essa sequência reduz o risco de supervalorizar um detalhe visual isolado.'
}

export function leituraDidaticaWebPathUtah(tituloOriginal: string): LeituraDidaticaWebPathUtah {
  const modalidade = modalidadeDaEntradaWebPathUtah(tituloOriginal)
  const titulo = traduzirTituloWebPathUtah(tituloOriginal).replace(/\s+—\s+.*$/, '')
  const contexto = contextoAnatomico(tituloOriginal)
  const base =
    modalidade === 'macroscopia'
      ? `Na referência intitulada “${titulo}”, oriente primeiro o órgão e a distribuição da lesão. Cor, consistência, limites, relação com cápsula, vasos, ductos e parênquima residual definem onde a amostragem microscópica deve ser concentrada. ${contexto}`
      : `Na referência intitulada “${titulo}”, comece pela arquitetura e pelo compartimento atingido antes de ampliar. Depois caracterize população celular, matriz, necrose, vasos e interface com o tecido preservado; um detalhe isolado não deve substituir a leitura do conjunto. ${contexto}`

  if (/carcinoma|adenocarcinoma|sarcoma|melanoma|lymphoma|leukemia|tumou?r|neoplasm|metasta/i.test(tituloOriginal)) {
    return {
      descricao: `${base} A pergunta central é se existe crescimento expansivo ou infiltrativo, qual diferenciação o tumor conserva e onde aparecem necrose, invasão vascular ou disseminação. A imagem ensina padrão morfológico; classificação e graduação exigem amostragem e critérios completos.`,
      observacoes: modalidade === 'macroscopia'
        ? ['interface entre massa e órgão', 'heterogeneidade por necrose ou hemorragia', 'extensão a cápsula, margem, vaso ou estrutura adjacente']
        : ['arquitetura tumoral predominante', 'atipia, mitoses e diferenciação celular', 'invasão estromal, vascular ou perineural'],
    }
  }

  if (/infarct|ischemi|atherosclero|thromb|embol|aneurysm|arteriolo|vascul/i.test(tituloOriginal)) {
    return {
      descricao: `${base} Reconstrua a sequência hemodinâmica: alteração da parede ou do fluxo, redução da luz, trombose e repercussão no território dependente. A idade da lesão modifica cor, celularidade, organização e fibrose, portanto o estágio precisa ser lido junto da topografia.`,
      observacoes: modalidade === 'macroscopia'
        ? ['vaso ou território vascular responsável', 'grau de obstrução e extensão do dano', 'cor e consistência que sugerem a idade da lesão']
        : ['parede vascular, endotélio e conteúdo luminal', 'padrão e idade da necrose', 'organização, recanalização ou reparo fibroso'],
    }
  }

  if (/pneumonia|abscess|infection|itis\b|inflamm|granuloma|fung|bacter|viral|parasite|tuberc/i.test(tituloOriginal)) {
    return {
      descricao: `${base} Defina se a resposta é aguda, crônica, granulomatosa ou necrosante e em qual compartimento ela se concentra. O padrão restringe o diferencial, mas a etiologia depende da demonstração do agente, de colorações apropriadas e do contexto clínico.`,
      observacoes: modalidade === 'macroscopia'
        ? ['distribuição focal, multifocal ou difusa', 'exsudato, cavitação, necrose ou fibrose', 'vias anatômicas de extensão da inflamação']
        : ['célula inflamatória predominante', 'relação entre agente, necrose e resposta do hospedeiro', 'sinais de resolução, organização ou cronicidade'],
    }
  }

  if (/hemorrhage|hematoma|ecchym|petechi|bleed/i.test(tituloOriginal)) {
    return {
      descricao: `${base} Determine onde o sangue se acumula, qual estrutura perdeu integridade e se há reação tecidual capaz de estimar temporalidade. Hemorragia é um achado final comum a trauma, distúrbio vascular, coagulopatia e neoplasia; a distribuição é mais informativa que a cor isolada.`,
      observacoes: ['compartimento anatômico da hemorragia', 'fonte vascular ou lesão associada', 'coágulo recente, hemossiderina, organização e resposta tecidual'],
    }
  }

  if (/necrosis|atrophy|degener|calcif|amyloid|fatty|edema|fibrosis|sclerosis|injury/i.test(tituloOriginal)) {
    return {
      descricao: `${base} Separe alteração reversível, morte celular e reparo. A preservação ou perda dos contornos, a natureza do material acumulado e a resposta inflamatória ou fibrosa permitem ligar a morfologia ao mecanismo e à duração da agressão.`,
      observacoes: modalidade === 'macroscopia'
        ? ['distribuição e limites da alteração', 'mudança de cor, volume e consistência', 'relação com tecido viável e cicatriz']
        : ['alterações citoplasmáticas e nucleares', 'preservação da arquitetura de base', 'inflamação, macrófagos, calcificação ou fibrose associada'],
    }
  }

  if (/placent|chorio|villi|umbilical|fetal|meconium|newborn|congenital|gestational/i.test(tituloOriginal)) {
    return {
      descricao: `${base} Interprete o achado à luz da idade gestacional e separe os compartimentos materno, fetal e placentário. Maturação, perfusão, inflamação e desenvolvimento anômalo precisam ser integrados antes de atribuir consequência fetal.`,
      observacoes: ['idade gestacional e maturação esperada', 'compartimento materno ou fetal predominante', 'má perfusão, inflamação, malformação ou resposta reparativa'],
    }
  }

  return {
    descricao: `${base} Compare a referência com o padrão normal do mesmo órgão e formule a descrição em três níveis: localização, arquitetura e detalhe celular. A conclusão deve indicar o processo demonstrado e seus limites, sem transformar uma única imagem em laudo completo.`,
    observacoes: modalidade === 'macroscopia'
      ? ['órgão, orientação e distribuição', 'limites, cor, superfície e consistência', 'áreas prioritárias para amostragem histológica']
      : ['compartimento e arquitetura predominante', 'população celular, matriz e vasos', 'interface com tecido preservado e possíveis complicações'],
  }
}

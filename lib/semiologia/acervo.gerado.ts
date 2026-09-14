/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/semiologia/curar-acervo.mjs
//
// Mídia clínica real das fontes licenciadas, indexada por `janela/cena`.
//
// Está separado dos arquivos de conteúdo (`vistas.ts`, `ultrassom.ts`) de
// propósito: aqueles são prosa escrita e revisada por gente, e um script que
// reescreve prosa é um script que um dia apaga a revisão de alguém. O gerador
// só toca neste arquivo; o merge acontece em `acervo.ts`, na leitura.

import type { MidiaClinica } from './midia'

export const ACERVO_DE_MIDIA: Record<string, MidiaClinica[]> = {
  "aorta-abdominal/aneurisma": [
    {
      "id": "tpa-aneurisma-trombo-mural",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1533301315652-K0953URVLMT7A9U8251R/Mural+thrombus+AAA.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/aorta/9wpzzsqkpvq9nfd9cqujsamyerme8j",
      "legenda": "Aneurisma de 5,6 cm em corte transverso: a parede externa é muito maior que a luz, porque um trombo mural em meia-lua preenche boa parte do vaso. Medir só a luz subestimaria em centímetros.",
      "autoria": "Juliana Jaramillo, MD — Kings County Emergency Medicine",
      "sha256": "b24cc210478c8982d4cf5f966625de8f009f7f4f12460bd4505505704aac1122",
      "ext": "gif"
    }
  ],
  "aorta-abdominal/normal": [
    {
      "id": "tpa-aorta-normal-transversa",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1605900628281-U6ENHWPSV0WUGQJ01TOA/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/aorta/normal-aorta-iliac-arteries-transverse",
      "legenda": "Aorta distal de calibre normal, redonda e de parede brilhante, logo à frente da sombra do corpo vertebral; ao deslizar a sonda para baixo, ela se divide nas duas ilíacas.",
      "autoria": "Dr. Felipe Urriola — Hospital de Puerto Aysén, Patagônia chilena",
      "sha256": "71a95dbca2a4748042412488859060615bf1f3e5caa5e2932e943f2388264a37",
      "ext": "gif"
    }
  ],
  "bexiga/normal": [
    {
      "id": "rp-bexiga-normal-efast",
      "tipo": "imagem",
      "fonte": "radiopaedia",
      "urlOrigem": "https://prod-images-static.radiopaedia.org/images/62650338/dca4aa8b1e5c97e9a8cc73f8f8df4fd9506151631f969f9fa57e02e13e756971_big_gallery.jpeg",
      "urlDoCaso": "https://radiopaedia.org/cases/focused-assessment-with-sonography-for-trauma-negative-efast",
      "legenda": "Bexiga de enchimento fisiológico, em dois planos, num eFAST negativo: anecoica, de contorno arredondado, parede fina e nada de líquido livre ao redor.",
      "autoria": "Dennis Odhiambo Agolah (Radiopaedia.org)",
      "sha256": "a9fe3526f1e3452629cacc84192c5c745312430262534d8f0f8a21b50dfc9608",
      "ext": "jpg"
    }
  ],
  "bexiga/retencao": [
    {
      "id": "tpa-bexiga-cheia-prostata",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1513456702001-83ULDCTCWKJVVJ2DIG9B/ezgif.com-optimize+%285%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/renal/0rytmzuy3i74pibarmd1szwjlu6xkr",
      "legenda": "Bexiga cheia em corte transverso com a próstata uniformemente aumentada logo atrás dela — retenção urinária por hiperplasia prostática, com a causa na mesma imagem.",
      "autoria": "Sukh Singh, MD",
      "sha256": "5619c6e0a9aaa87b4eac9c9de1ff808dcf19eae8bd2ece7a1a09ea7826f8c1b4",
      "ext": "gif"
    }
  ],
  "fast-morrison/liquido-livre": [
    {
      "id": "tpa-fast-positivo-morrison",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1507764821960-DCBRFWPTSR5S0QQ2OQME/bowra+pos+RUQ+fast.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/trauma/g6302hr5hk6l2cu7vgvwu4yf57y9jn",
      "legenda": "Faixa anecoica entre o fígado e o rim: líquido livre no recesso de Morrison em trauma contuso. O fígado parece flutuar; complete a varredura até a ponta hepática.",
      "autoria": "Dr. Justin Bowra",
      "sha256": "96265e688ad62f5070c4b996029a05ec7a84a81575a18087ce9f44569f4ff5ff",
      "ext": "gif"
    },
    {
      "id": "tpa-fast-positivo-lesao-esplenica",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1618249348272-UF298COQGGRYD71107VN/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/trauma/fast-in-morrisons-pouch-from-splenic-injury",
      "legenda": "Líquido livre no recesso de Morrison após queda de escada; a tomografia mostrou lesão esplênica. O sangue se acumula aqui mesmo quando a lesão é do lado esquerdo.",
      "autoria": "Dr. Greg Wiener — Denver Health Emergency Medicine",
      "sha256": "83c4a872a489f8c12689a47c1b15103cf32657427d41bcd6d0c0569faa6999e1",
      "ext": "gif"
    }
  ],
  "fast-morrison/normal": [
    {
      "id": "tpa-fast-negativo",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1507764829491-PDTO9VHHH83GTZFGJCN5/bowra+neg+fast+ruq.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/trauma/ig43kl6sn8h0ohqr0ss0njkaa8fqs9",
      "legenda": "Fígado e rim em contato direto no recesso hepatorrenal, sem faixa anecoica entre eles. FAST negativo no quadrante superior direito.",
      "autoria": "Dr. Justin Bowra",
      "sha256": "c4e944e3f17bb34a9f220820ec51f645c95411b3f179f22fd4387e9e0ea7d2c5",
      "ext": "gif"
    }
  ],
  "fundoscopia/normal": [
    {
      "id": "rp-fundo-de-olho-normal",
      "tipo": "imagem",
      "fonte": "radiopaedia",
      "urlOrigem": "https://prod-images-static.radiopaedia.org/images/69758074/6bd97a7bfc54c2c794ad08771ce8f9e9223486f21d922934cfc11cb01b2efdae_big_gallery.jpeg",
      "urlDoCaso": "https://radiopaedia.org/cases/optic-disc-fundoscopy-3",
      "legenda": "Retinografia do olho direito sem alterações: mácula ao centro, disco óptico do lado nasal (à direita na imagem) com bordas nítidas, veias mais escuras e um pouco mais largas que as artérias. A pigmentação na borda temporal do disco é achado normal.",
      "autoria": "Frank Gaillard (Radiopaedia.org) — fotografia de Mikael Häggström, domínio público",
      "sha256": "7e5e4a638dcfca38415efd68f7af32ac1f0d3be65061f5046571921d456fed5f",
      "ext": "jpg"
    }
  ],
  "paraesternal-eixo-curto/dilatacao-vd": [
    {
      "id": "tpa-sinal-do-d",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1735939424463-9C9UGK106BQSVFZX4Q83/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/right-ventricular-dysfunction/d-sign-in-right-heart-strain",
      "legenda": "Embolia pulmonar aguda: o septo achatado transforma o círculo do ventrículo esquerdo em um \"D\", enquanto o ventrículo direito dilatado ocupa a metade superior da tela.",
      "autoria": "Dimitri Livshits, DO; Jane Belyavskaya, MD; Chris Hanuscin, MD — Kings County/SUNY Downstate",
      "sha256": "0dff26c5fc3add4ed36b686f1491747257228f52a939222edda9924762e206b4",
      "ext": "gif"
    }
  ],
  "paraesternal-eixo-curto/normal": [
    {
      "id": "tpa-psax-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1604501874660-0IU60BXMGI6IPAFZ2YMQ/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/normal-cardiac-anatomy/normal-parasternal-short-axis-view",
      "legenda": "Eixo curto no nível dos papilares: o ventrículo esquerdo é um anel espesso e perfeitamente redondo; o direito, fino, aparece em meia-lua encostado nele.",
      "autoria": "Dr. Felipe Urriola — Hospital de Puerto Aysén, Patagônia chilena",
      "sha256": "d4c343056fedce1295ad87cca20ab323b6d1611a8a88b610b21682c74ac4fe6c",
      "ext": "gif"
    }
  ],
  "paraesternal-eixo-longo/disfuncao-sistolica-ve": [
    {
      "id": "tpa-plax-fe-reduzida",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1625940462925-KVN90L18AO6440SB2I8K/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/left-ventricular-dysfunction/reduced-ejection-fraction-parasternal-long-axis-view",
      "legenda": "Insuficiência cardíaca com fração de ejeção reduzida: o ventrículo esquerdo quase não muda de tamanho entre diástole e sístole, e o folheto anterior da mitral fica longe do septo.",
      "autoria": "Nigist Taddese, MBChB — John H. Stroger Hospital of Cook County",
      "sha256": "e36c0957661677f82668a7a320aa21030893f798b4096afdd2418a210ed482c9",
      "ext": "gif"
    }
  ],
  "paraesternal-eixo-longo/normal": [
    {
      "id": "tpa-plax-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1533340755751-28DSIIEOY3LCLELVB8FQ/parasternal+long+axis+normal.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/normal-cardiac-anatomy/c2ucvsrd88ew93pri6g7razha6rgtb",
      "legenda": "Eixo longo normal: ventrículo direito no topo, septo, ventrículo esquerdo que encolhe pela metade a cada sístole, mitral abrindo em direção ao septo, aorta saindo à direita e átrio esquerdo abaixo dela.",
      "autoria": "Hannah Kopinski; Dr. Lindsay Davis — NYU/Bellevue; Dr. Matthew Riscinti — Kings County",
      "sha256": "1a5f51b25ad40c0695e402af8fba0662fe2a9a8c1f234793edb6baf3ad382b3b",
      "ext": "gif"
    }
  ],
  "partes-moles/abscesso": [
    {
      "id": "tpa-abscesso-grande",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1614377374224-ER4JSXI0ED8ZXSY9G27I/ezgif.com-gif-maker+%2822%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/softtissuemsk/abscess",
      "legenda": "Abscesso volumoso de partes moles: coleção bem delimitada ocupando a tela, com partículas ecogênicas em suspensão que denunciam o conteúdo purulento.",
      "autoria": "Michael Macias, MD",
      "sha256": "05b1dc560053c508a0e1fad943dc3fafd046f873bc6a06a89e68bd321e9abc69",
      "ext": "gif"
    }
  ],
  "partes-moles/normal": [
    {
      "id": "rp-subcutaneo-normal",
      "tipo": "imagem",
      "fonte": "radiopaedia",
      "urlOrigem": "https://prod-images-static.radiopaedia.org/images/71902744/29ea8f0c9f3528976e068c74490cda033d76524ba83bf163c9dd39cd986feba8.jpg",
      "urlDoCaso": "https://radiopaedia.org/cases/normal-subcutaneous-tissue-ultrasound-2",
      "legenda": "Subcutâneo normal com sonda linear: gordura hipoecoica em camadas organizadas, atravessada por septos fibrosos finos e contínuos, sobre a fáscia e o músculo.",
      "autoria": "Deise Vargas (Radiopaedia.org)",
      "sha256": "29ea8f0c9f3528976e068c74490cda033d76524ba83bf163c9dd39cd986feba8",
      "ext": "jpg"
    }
  ],
  "pulmao-linhas/consolidacao": [
    {
      "id": "tpa-pneumonia-classica",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1579192545463-0HXZQSGW8W4DO7YKDDYM/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/pneumonia",
      "legenda": "Os achados clássicos juntos: consolidação subpleural com textura de tecido, broncogramas aéreos dinâmicos, sinal do fragmento na borda profunda, pequeno derrame parapneumônico e linhas B ao redor.",
      "autoria": "Aaron Inouye, PA-C — North Canyon Medical Center",
      "sha256": "542e2b699c2b1e43c8a3020ec53ba5cff4588f1ab88e2c3ee4b77b5769b13a2a",
      "ext": "gif"
    },
    {
      "id": "tpa-broncogramas-dinamicos",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1554690459917-19ZKHAFJURT3HJ4JAASJ/pneumonia+.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/air-bronchograms",
      "legenda": "Broncogramas aéreos dinâmicos: as bolhas de ar sobem e descem pelos brônquios dentro da consolidação a cada respiração — o que separa pneumonia de atelectasia, onde o ar fica parado.",
      "autoria": "Dr. Trauer",
      "sha256": "45e0b50e6ee1f1bfb032b8266bcbc8f093dcd988671ee68e15f4dd67389613e7",
      "ext": "gif"
    }
  ],
  "pulmao-linhas/derrame-pleural": [
    {
      "id": "tpa-derrame-sinal-da-coluna",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1735037422893-MMGEHX6D4CFUEC55GYJA/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/pleural-effusion-with-compressed-lung-and-spine-sign",
      "legenda": "Coleção anecoica acima do diafragma com o pulmão atelectasiado flutuando dentro dela. A coluna vertebral continua visível acima do diafragma — o sinal da coluna.",
      "autoria": "Dimitri Livshits, DO; Jane Belyavskaya, MD; Chris Hanuscin, MD — Kings County/SUNY Downstate",
      "sha256": "f0dbc4331c91472e5f6ff61047cc470f830be0c53da10eea78f6ebd71b2f1af3",
      "ext": "gif"
    }
  ],
  "pulmao-linhas/normal": [
    {
      "id": "tpa-deslizamento-linear",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1516115148732-GXZ0W4TGSF2E08DAXBFI/normal+lung+slide+riscinti.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/2018/1/16/normal-lung-slide",
      "legenda": "Sonda linear entre duas costelas: a linha pleural hiperecogênica cintila com a respiração — o deslizamento pleural, as \"formigas marchando\". Tudo abaixo dela é artefato.",
      "autoria": "Dr. Matthew Riscinti — Kings County Emergency Medicine",
      "sha256": "8e14e71c993be6fec7d249626d0bdfda2c0612a43e11ff20a588b851463fa963",
      "ext": "gif"
    },
    {
      "id": "tpa-deslizamento-linhas-a",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1534352523609-CMQC96GJFLP9V7L196XU/lung+sliding+and+a-lines.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/skfn1nk408w1wvqph7pxsc5fr6pbs9",
      "legenda": "Linha pleural em movimento com uma linha A logo abaixo, paralela e à mesma distância — reverberação da pleura. Deslizamento com linhas A é o padrão do pulmão aerado.",
      "sha256": "cb587d60e141e92c9882fd3c215ef6edd967b22de4521c9f40db81a436f174d2",
      "ext": "gif"
    }
  ],
  "pulmao-linhas/pneumotorax": [
    {
      "id": "tpa-ponto-pulmonar",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1502564140190-U8XUOTGVSQ89P7VRMXD0/ezgif.com-gif-maker+%281%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/ftdbu61923rlre4jj2aj6yec8c57ei",
      "legenda": "Ponto pulmonar: à esquerda a pleura desliza; à direita, não. A fronteira se move com a inspiração — é onde o ar começa a separar os folhetos, e é específico de pneumotórax.",
      "autoria": "Dr. Justin Bowra et al.",
      "sha256": "ace3d28c549de19afde32dee6ed2a9d1df295a6ab3d6fea62fa7b1d412458a08",
      "ext": "gif"
    },
    {
      "id": "tpa-modo-m-praia-codigo-de-barras",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1504715986493-6CRPHIQGW5FX8WC00W1P/roseman+ptx.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/b1i9ct527pxn4ekt6n1ymhxiq8jt8t",
      "legenda": "Modo M lado a lado no mesmo paciente: à esquerda, sinal da praia no pulmão normal; à direita, código de barras — ausência de deslizamento no hemitórax com pneumotórax espontâneo.",
      "autoria": "Dr. Eric Roseman — Kings County Emergency/Internal Medicine",
      "sha256": "02caeecaf3e42349758f4282c520ca80fccc6e6066ef8b379398cd45e77b3c13",
      "ext": "gif"
    }
  ],
  "pulmao-linhas/sindrome-intersticial": [
    {
      "id": "tpa-linhas-b-edema",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1501946036256-HUUF1I144FJTBB5ZSR7R/ezgif.com-optimize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/9kalmbf8y6j0nrspwvv876nyem83t5",
      "legenda": "Sonda convexa: múltiplas linhas B partindo da linha pleural até o fundo da tela, apagando as linhas A e acompanhando o deslizamento. Três ou mais no mesmo espaço intercostal tornam a região positiva.",
      "autoria": "Dr. Justin Bowra et al. (Dr. D. Browne e Dr. J. Knights)",
      "sha256": "fb5ebbaa7b6619680b878cad33ae9879993c821d2969e0be138f2faa26e9dc50",
      "ext": "gif"
    }
  ],
  "pulmao-linhas/sindrome-intersticial-focal": [
    {
      "id": "tpa-linhas-b-pleura-irregular",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1611517283226-9ELGE825XRTVRLCE9R6N/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/lung/pneumonia-b-lines",
      "legenda": "Sonda linear: linhas B em placas partindo de uma linha pleural irregular e espessada. A distribuição em manchas, com pleura alterada, fala por pneumonia — viral ou bacteriana — e não por congestão.",
      "autoria": "Robert Jones, DO, FACEP — MetroHealth Medical Center",
      "sha256": "35bd792d46b5d5c12849de273e9d22d77363f406dce098e6f082ef4e06f80f6d",
      "ext": "gif"
    }
  ],
  "rins/hidronefrose": [
    {
      "id": "tpa-hidronefrose-moderada",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1513457363149-2DCO14INH2OJ9F51FUL7/ezgif.com-gif-maker.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/renal/sj5gym7u45n6u405h98plkjvpiqis7",
      "legenda": "Hidronefrose moderada (grau 2): pelve e cálices dilatados, escuros e comunicantes no meio do seio, com o parênquima ainda de espessura preservada.",
      "autoria": "Sukh Singh, MD (legenda de Matthew Riscinti, MD)",
      "sha256": "d78567909bfdb80d8b465a746a8bacb1ee94b96c7a0b5b0fd2c17fa7a77b9667",
      "ext": "gif"
    },
    {
      "id": "tpa-hidronefrose-grave",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1502561663514-6PQZEX9V2BDRH194N61V/ezgif.com-optimize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/renal/7yriu2o1fkh8fenx05ay0q52qe7td4",
      "legenda": "Hidronefrose grave (grau 4): pelve e cálices em balão e o córtex atrofiado, reduzido a uma lâmina fina — a obstrução aqui é antiga.",
      "autoria": "Dr. Justin Bowra et al. (Dr. Browne e Dr. Knights)",
      "sha256": "48238504db36e04448740864d81382b024d0fd10bc559f64fb1c614468ff5289",
      "ext": "gif"
    }
  ],
  "rins/normal": [
    {
      "id": "tpa-rim-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1513457507178-SFIVJPQLRQEGAYB77BJA/ezgif.com-optimize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/renal/mieoe51z86rvt3yw1npb3eaqvxe1t6",
      "legenda": "Rim esquerdo em eixo longo: córtex homogêneo ao redor de um seio renal central brilhante, sem nenhuma área anecoica dentro dele.",
      "autoria": "Sukh Singh, MD",
      "sha256": "75d2a025d5d36337289ea1c2bd948df3e93ec2ec6524f8e117fa57eb9f0f25e9",
      "ext": "gif"
    }
  ],
  "subxifoide-pericardio/derrame-pericardico": [
    {
      "id": "tpa-tamponamento-subxifoide",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1515543755104-USLPQ1E3MZ3CE2A6K49O/ezgif.com-optimize+%285%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/pericardial-disease/xmkggwuxkly8f3958i6jxfhwee2hko",
      "legenda": "Derrame pericárdico moderado na janela subxifoide com colapso diastólico do ventrículo direito — o sinal ecocardiográfico que sugere tamponamento.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al.",
      "sha256": "6b49926346c7f16fc5c031a736fbe70616fd23d7c9b5d0e99d0c865c8d675d7b",
      "ext": "gif"
    },
    {
      "id": "tpa-derrame-circunferencial",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1616075126653-C8MY1A30G7C0Z7C0IX4L/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/pericardial-disease/circumferential-pericardial-tamponade",
      "legenda": "Derrame circunferencial em paciente com instabilidade hemodinâmica: faixa anecoica ao redor de todo o coração, colapso das câmaras direitas e função sistólica hiperdinâmica.",
      "autoria": "Rupinder Sekhon, MD — Central Michigan University, Emergency Medicine",
      "sha256": "15dd32a62548974173fcb60d69bb79672b7f55b396aba10711b25eefd0a41405",
      "ext": "gif"
    }
  ],
  "subxifoide-pericardio/normal": [
    {
      "id": "tpa-subxifoide-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1533340837831-96B9SO0G3BZYRAU7H8F6/subxi+normal+2.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/normal-cardiac-anatomy/l09bsm1aaruqvdr0x9ah8de4dyq815",
      "legenda": "Janela subxifoide normal: o fígado como janela acústica, o diafragma e, logo abaixo, o ventrículo direito — a câmara mais próxima da sonda. Pericárdio como linha brilhante, sem separação de folhetos.",
      "autoria": "Hannah Kopinski; Dr. Lindsay Davis — NYU/Bellevue; Dr. Matthew Riscinti — Kings County",
      "sha256": "9083e793ab54ade370a882b092dee4076196001b6dc967b4dd7943035a829641",
      "ext": "gif"
    }
  ],
  "veia-cava-inferior/cava-colabada": [
    {
      "id": "tpa-cava-colabada",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1515618507674-50PYVQUN7RCDLLOV1A47/ezgif.com-optimize+%2812%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/ivc-abnormal-venous-waveforms/hb54v9bphs5viutpykc443qvfad8zu",
      "legenda": "Cava de calibre reduzido que colaba quase por completo na inspiração — pressão de átrio direito baixa, compatível com hipovolemia.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al.",
      "sha256": "b8bcbfd34149bde816859b982ea2f7f0cb9f1fc1a002804a16916af3938bab0e",
      "ext": "gif"
    }
  ],
  "veia-cava-inferior/cava-plectorica": [
    {
      "id": "tpa-cava-plectorica",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1515543540010-EDUITWSMBCYYP082IFD7/ezgif.com-optimize+%283%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/ivc-abnormal-venous-waveforms/1oeh74m8vui52avz2wrol5ijnxhlb0",
      "legenda": "Cava dilatada com colapso inspiratório mínimo e veia hepática distendida desembocando nela — pressões de enchimento muito altas na insuficiência cardíaca aguda.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al. (Dr. Vahtrick)",
      "sha256": "0b94c3bdd4ff4ed54428043bbeda453e2ad47c7fa6ffe1cfe56aa5166e051b15",
      "ext": "gif"
    }
  ],
  "veia-cava-inferior/normal": [
    {
      "id": "tpa-cava-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1515618754085-8GLR2N3BJNYT4C9SUCSY/ezgif.com-optimize+%2816%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/normal-cardiac-anatomy/guuuzcqegl0excdpub25hb0gohsol5",
      "legenda": "Veia cava inferior em corte longitudinal desembocando no átrio direito, com calibre normal e variação respiratória preservada.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al.",
      "sha256": "7a466dc48b0405709016c50be480ac24d0c28a7138c5066e5b9a765485846d7e",
      "ext": "gif"
    }
  ],
  "veias-profundas/normal": [
    {
      "id": "tpa-compressao-poplitea-normal",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1534890699588-U1YAQQBMRR9CHH33H5X5/popliteal+compression+est.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/dvt/wvi6cxyr0v95tkupisecs3ha61yg1d",
      "legenda": "Teste de compressão na fossa poplítea, descendo em direção à panturrilha: a veia some a cada compressão; o vaso que não colaba, profundo e medial a ela, é a artéria.",
      "autoria": "Hannah Kopinski; Dr. Lindsay Davis — NYU Emergency Medicine",
      "sha256": "ee9862982806b6d9a7a191905b67fad0089ea0edc11dc9489e2344fe7b74091f",
      "ext": "gif"
    }
  ],
  "veias-profundas/tvp": [
    {
      "id": "tpa-tvp-femoral-compressao",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1511631840053-5KVWQ2BWD93FK1WDI2PN/Sukh+-+common+fem+dvt.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/dvt/yyk54hhc04aplmfoyrtlobookgi87i",
      "legenda": "Compressão sobre a femoral: a artéria pulsátil continua aberta e a veia ao lado não fecha por completo — a porção que resiste à compressão é o trombo.",
      "autoria": "Sukh Singh, MD",
      "sha256": "f131da9bf1a07d019c4f3435b6cfca73f21e501af42a0275ce973d560913829c",
      "ext": "gif"
    },
    {
      "id": "tpa-tvp-femoral-esquerda",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1502378869283-T8RBI0NR6GWZH6ZTNCNR/ezgif.com-optimize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/dvt/ja2wyu1cejm6pg6rzkm5c72cf8qjx7",
      "legenda": "Trombose da veia femoral comum esquerda em paciente com dor e edema de todo o membro: veia distendida, cheia de material ecogênico, que não colaba sob a sonda.",
      "autoria": "Dr. Justin Bowra et al.",
      "sha256": "f6667a5559238fce5852547b54c4bcaf8a3c5c2d6b562a17155dd8d5887bf423",
      "ext": "gif"
    }
  ],
  "vesicula-biliar/colecistite": [
    {
      "id": "tpa-colecistite-parede-e-liquido",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1501699211694-E472ZSB51OIGA7IE4NYO/ezgif.com-resize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/w0fwn8iet0q1qn4klkttoegsn2pae7",
      "legenda": "Imagem anotada de colecistite aguda: parede espessada (medida na face anterior, contra o fígado) e faixa de líquido pericolecístico do lado de fora.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al.",
      "sha256": "3192d3acca2b45e1e26e6180ac83d46314efcfbd725338be9bc96d5a6e44b06c",
      "ext": "gif"
    },
    {
      "id": "tpa-colecistite-calculo-impactado",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1501698956853-B7BBNV9VFDG8AZPM4E99/ezgif.com-optimize.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/d0eqh3xfhgqb9jv6spud3uqt3zn5er",
      "legenda": "O cálculo preso no colo da vesícula, com sombra atrás — a causa da colecistite. O colo não aparece de primeira; é preciso varrer a vesícula em dois planos para não perdê-lo.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al.",
      "sha256": "c0fe35131e06599eef7459b045eddb95a64869efac3cf52da515db040c9f9bb1",
      "ext": "gif"
    }
  ],
  "vesicula-biliar/coledoco-dilatado": [
    {
      "id": "tpa-coledoco-dilatado-medida",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1501697190288-YZR8OCZAXQ0DMNB9VGWJ/ezgif.com-gif-maker.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/837oxd7ko4uk6awtz1l01zg3fpr2o9",
      "legenda": "Colédoco medido em 9,8 mm, à frente da veia porta, em paciente com padrão obstrutivo nas enzimas hepáticas. Nenhum cálculo visível — a dilatação, por si, já aponta obstrução.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al. (Dr. Ken Lee)",
      "sha256": "7f8e99ad768b8772cfc20e9202bd768c6f03980ca4d1eac4354e81ec296cf61b",
      "ext": "gif"
    },
    {
      "id": "tpa-coledoco-dilatado-doppler",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1513452494752-8IH0JWSOKT519ZJRXZX3/ezgif.com-gif-maker.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/t3wnjlkhflo25fremayvgwy2u0d429",
      "legenda": "Colédoco de 1,89 cm — grosseiramente dilatado. O Doppler colorido pinta a veia porta ao lado e deixa o colédoco sem cor: é assim que se prova que o tubo dilatado é ducto, e não vaso.",
      "autoria": "Sukh Singh, MD",
      "sha256": "d69d50184ad659f1f0f7b8a8e0bff2b4a32882475a3ffaf480542175a2365705",
      "ext": "gif"
    }
  ],
  "vesicula-biliar/colelitiase": [
    {
      "id": "tpa-colelitiase-calculo-unico",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1616080221978-J4HVEF4BPZRXNNB0GYK4/image-asset.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/cholelithiasis",
      "legenda": "Cálculo único: foco brilhante na parede dependente com sombra acústica limpa atrás. Parede fina, sem líquido ao redor, sem dilatação de ducto — colelitíase sem colecistite.",
      "autoria": "Rupinder Sekhon, MD; Peter Biggane, MD — Central Michigan University",
      "sha256": "7523bfe2c70d1ad20096713594dc88865002fc6e56c3ee03a0f825718e38998b",
      "ext": "gif"
    },
    {
      "id": "tpa-colelitiase-multiplos",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1501723211698-YLUPCF40MJG7180WCVA1/ezgif.com-optimize+%281%29.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/vtvdkkfmpydj28ymmcqpz943a561c4",
      "legenda": "Muitos cálculos empilhados no fundo da vesícula, cada um com sua sombra. Parede não espessada, sem líquido pericolecístico e sem Murphy ultrassonográfico.",
      "autoria": "Justin Bowra, MBBS, FACEM, CCPU — RNSH et al. (Dr. Ken Lee)",
      "sha256": "6c9664a35897c0eda31167922199df4054cbeecb5b5747c41a28ef019beab58d",
      "ext": "gif"
    }
  ],
  "vesicula-biliar/normal": [
    {
      "id": "tpa-vesicula-e-coledoco-normais",
      "tipo": "imagem",
      "fonte": "pocus-atlas",
      "urlOrigem": "https://images.squarespace-cdn.com/content/v1/58118909e3df282037abfad7/1534358770117-FJW54FJ1SKTJLEXZ928T/GB+CBD.gif",
      "urlDoCaso": "https://www.thepocusatlas.com/hepatobiliary/tun1mewevm5gzej0n5yihvb8fwtxb3",
      "legenda": "Vesícula anecoica em eixo longo no centro, veia porta em corte transverso à esquerda dela e, correndo logo acima da porta, o colédoco fino — como deve ser.",
      "autoria": "Hannah Kopinski; Dr. Lindsay Davis — NYU Emergency Medicine",
      "sha256": "a4f9cc65be218101ad2b9d829daa88c1e9ade0608acb7acbe894fdaa49abd302",
      "ext": "gif"
    }
  ],
}

/** Quando o acervo foi gerado pela última vez. */
export const GERADO_EM: string | null = "2026-09-14"

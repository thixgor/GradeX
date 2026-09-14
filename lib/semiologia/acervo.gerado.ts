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
}

/** Quando o acervo foi gerado pela última vez. */
export const GERADO_EM: string | null = "2026-09-14"

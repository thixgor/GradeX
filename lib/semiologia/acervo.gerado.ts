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
  "colonoscopia/angiodisplasia": [
    {
      "id": "wc-angiodisplasia",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Angiodysplasie.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Angiodysplasie.jpg",
      "legenda": "Angiodisplasia do cólon: mancha vermelho-viva com vasos finos irradiando do centro, sobre mucosa normal — a lesão que sangra sem doer.",
      "autoria": "Joachim Guntau · CC BY-SA 3.0",
      "sha256": "2271583ebb2c86e1f111de4f04f62157795fd3465ded5467c8aba0d8db13aed2",
      "ext": "jpg"
    }
  ],
  "colonoscopia/cancer-colorretal": [
    {
      "id": "wc-cancer-reto-estenosante",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Rektum-Ca_Stenose.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Rektum-Ca_Stenose.jpg",
      "legenda": "Carcinoma de reto estenosante: massa irregular e friável, sangrando ao toque, que estreita o lúmen — o aparelho não passa.",
      "autoria": "Joachim Guntau · CC BY-SA 3.0",
      "sha256": "5d37d5f37b80b21a624d90c8b02e277d8512f846e04001e7e046531d66418044",
      "ext": "jpg"
    }
  ],
  "colonoscopia/colite-ulcerativa": [
    {
      "id": "wc-colite-ulcerativa-ativa",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/7/72/Ulcerative_colitis.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Ulcerative_colitis.jpg",
      "legenda": "Retocolite ulcerativa em atividade: mucosa difusamente eritematosa, granular e friável, sem padrão vascular, com erosões e exsudato.",
      "autoria": "Sebb · CC BY-SA 3.0",
      "sha256": "d6b3a08c7ef2ca5097469c89352c0c67b77adb692eae44b3b9bbccdf69859de2",
      "ext": "jpg"
    }
  ],
  "colonoscopia/diverticulose": [
    {
      "id": "wc-diverticulose-guntau",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/54/Divertikel.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Divertikel.jpg",
      "legenda": "Diverticulose do sigmoide: múltiplos orifícios escuros e arredondados na parede, cada um abrindo para uma bolsa cega — o oposto do pólipo.",
      "autoria": "Joachim Guntau · CC BY-SA 3.0",
      "sha256": "c969930dddf4c492287770470065600e7f331901f2b838dfb935f9a7373049e0",
      "ext": "jpg"
    },
    {
      "id": "wc-dois-diverticulos",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Diverticulosis_%28two_diverticula%29_02.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Diverticulosis_(two_diverticula)_02.jpg",
      "legenda": "Dois divertículos vistos de perto: os orifícios entre os haustros, com mucosa ao redor normal — diverticulose, não diverticulite.",
      "autoria": "Jmarchn · CC BY-SA 3.0",
      "sha256": "049faf07b5852cf8a1ff7bc1a8e57a67356cc2610a95f4524faec8a29932dc22",
      "ext": "jpg"
    }
  ],
  "colonoscopia/normal": [
    {
      "id": "wc-colon-normal-flexura",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/0/04/Colonoscopy_splenic_flexure.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Colonoscopy_splenic_flexure.jpg",
      "legenda": "Cólon normal na flexura esplênica: mucosa rosada e transparente, com o padrão vascular submucoso nítido e ramificado — o que some primeiro na colite.",
      "autoria": "melvil · CC BY-SA 4.0",
      "sha256": "d9db7fd638db7c62230501d3435a687710130a9d61aa48feba2ba19007a421dc",
      "ext": "jpg"
    }
  ],
  "colonoscopia/polipo-adenomatoso": [
    {
      "id": "wc-polipo-pediculado",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Colon-Polyp.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Colon-Polyp.jpg",
      "legenda": "Pólipo pediculado do cólon: cabeça avermelhada e lobulada sobre uma haste de mucosa normal, projetando-se para o lúmen.",
      "autoria": "邱鈺鋒 · CC BY-SA 4.0",
      "sha256": "34c2b1d82bb7d52a693c5335af33da1127548e75df6e74b526f8218b95022d43",
      "ext": "jpg"
    },
    {
      "id": "wc-polipo-guntau",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/6/67/Polyp.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Polyp.jpg",
      "legenda": "Pólipo colônico à colonoscopia: elevação bem delimitada, mais vermelha que a mucosa vizinha, candidata a polipectomia na mesma sessão.",
      "autoria": "Joachim Guntau · domínio público",
      "sha256": "25a8fe2aca7f29ec8182b3f9ddd2c56f967472c649e3bc44dcf15aeaeb53110c",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/barrett": [
    {
      "id": "wc-barrett-biopsias-seattle",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Seattle_Protocol_Biopsies.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Seattle_Protocol_Biopsies.jpg",
      "legenda": "Esôfago de Barrett: línguas de mucosa salmão subindo sobre o esôfago pálido, com os pontos de biópsia em quatro quadrantes do protocolo de Seattle — sem histologia o diagnóstico não existe.",
      "autoria": "Samir · CC BY-SA 4.0",
      "sha256": "028bb0c139646359319821ce462b86bdcbd74d979b5bd92ee89869a420151660",
      "ext": "jpg"
    },
    {
      "id": "wc-barrett-segmento-curto-cancer",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/2/23/Esophageal_cancer-2626-02.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Esophageal_cancer-2626-02.jpg",
      "legenda": "Barrett de segmento curto na junção gastroesofágica, em mulher de 81 anos: a mucosa colunar irregular acima da junção já abrigava um adenocarcinoma — o desfecho que a vigilância existe para antecipar.",
      "autoria": "melvil · CC BY-SA 4.0",
      "sha256": "60c68e8d31ab2f25228743be27d4807e3c882cb28c00e6d4417d08ba031a0df2",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/cancer-gastrico": [
    {
      "id": "wc-cancer-gastrico-avancado",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/1/18/Magenkrebs.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Magenkrebs.jpg",
      "legenda": "Câncer gástrico avançado: massa ulcerada e irregular, de bordas elevadas, base necrótica e mucosa friável, deformando o estômago.",
      "autoria": "Boreali · domínio público",
      "sha256": "e7d96df33ffbde95750842730f583bf8ba0aa46fc6c25d807d42807130e7ced6",
      "ext": "jpg"
    },
    {
      "id": "wc-ulcera-gastrica-maligna",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Gastric_ulcer_3.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Gastric_ulcer_3.jpg",
      "legenda": "Úlcera gástrica cuja biópsia revelou adenocarcinoma: a borda irregular e a base suja são o motivo de toda úlcera gástrica ser biopsiada.",
      "autoria": "Samir · CC BY-SA 3.0",
      "sha256": "18efd1a3ac0c650157bb36063ba67025291ba2ff6c25fc1b8c86d3b13971942c",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/corpo-estranho-esofagico": [
    {
      "id": "wc-corpo-estranho-esofago",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/57/Foreign_Body.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Foreign_Body.jpg",
      "legenda": "Corpo estranho no esôfago à endoscopia, em dois momentos: o objeto alojado no lúmen e sua apreensão com a pinça para retirada.",
      "autoria": "Samir · domínio público",
      "sha256": "5dc9f36a8eae53d09730354072974e03eab4bdd16f27da72693d5125927863af",
      "ext": "jpg"
    },
    {
      "id": "wc-bolo-alimentar-impactado",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/2/24/Food_bolus_obstruction.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Food_bolus_obstruction.jpg",
      "legenda": "Impactação de bolo alimentar no esôfago: o alimento ocupa o lúmen e o líquido acima dele não desce — a causa costuma ser uma estenose ou anel por baixo.",
      "autoria": "Wikimedia Commons · CC BY 3.0",
      "sha256": "4fbf8218aee9ce1381a6483735fde923f7de97b9ac0cfa2f042ea9247cfa70fb",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/gastrite-erosiva": [
    {
      "id": "wc-gastrite-erosiva",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/2/28/Gastritis_erosiva.2278.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Gastritis_erosiva.2278.jpg",
      "legenda": "Gastrite erosiva: múltiplas erosões superficiais de centro esbranquiçado e halo vermelho, espalhadas sobre a mucosa gástrica hiperemiada.",
      "autoria": "Amadalvarez · CC BY-SA 4.0",
      "sha256": "ed773f716a24ac1ad8099fe227159d0dd16d258875d0a0a00076ff703306b313",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/normal": [
    {
      "id": "wc-estomago-normal-1",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/9/9f/Stomach_endoscopy_1.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Stomach_endoscopy_1.jpg",
      "legenda": "Estômago normal à endoscopia: rugas alaranjadas, lisas e brilhantes, com o lago mucoso claro e o lúmen se abrindo com a insuflação.",
      "autoria": "Ignis · CC BY-SA 3.0",
      "sha256": "77c35e2178b3fe5a4ac742b955f85bcea7fdcaec055698740179117b4382ab03",
      "ext": "jpg"
    },
    {
      "id": "wc-estomago-normal-3",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/9/9b/Stomach_endoscopy_3.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Stomach_endoscopy_3.jpg",
      "legenda": "Retrovisão gástrica: o aparelho vira sobre si mesmo e mostra a cárdia abraçando o tubo, com o fundo e a pequena curvatura alta — a parte que a visão direta não alcança.",
      "autoria": "Ignis · CC BY-SA 3.0",
      "sha256": "802a7b5ed97589c78d022ec795dcf295bf03f257fb976a35048d545b058c2537",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/ulcera-gastrica": [
    {
      "id": "wc-ulcera-antral",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/1/13/Peptic_ulcer.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Peptic_ulcer.jpg",
      "legenda": "Úlcera péptica no antro gástrico: cratera de base branca de fibrina, bordas regulares e mucosa ao redor edemaciada — a lesão da digestão ácido-péptica.",
      "autoria": "Dr. Gannavarapu Narasimha Murthy · CC0",
      "sha256": "5dfcad079a3dbf14f9c3a0b60ba8e46aefda5b089798b03cd16902210cd8d43b",
      "ext": "jpg"
    }
  ],
  "endoscopia-digestiva-alta/varizes-esofagicas": [
    {
      "id": "wc-varizes-sangrando",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Bleeding_esophageal_varices.png",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Bleeding_esophageal_varices.png",
      "legenda": "Varizes esofágicas sangrando: os cordões azulados abaulando para o lúmen e o jato de sangue vindo da variz no canto superior direito da imagem.",
      "autoria": "Jeremias · CC BY-SA 4.0",
      "sha256": "75f8b963113998257f532a7c6f9b8fb70702dcbeeaae3e724a7d0f7892f779e9",
      "ext": "png"
    },
    {
      "id": "wc-varizes-tortuosas",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/4/48/%E0%B0%85%E0%B0%A8%E0%B1%8D%E0%B0%A8%E0%B0%B5%E0%B0%BE%E0%B0%B9%E0%B0%BF%E0%B0%95%E0%B0%B2%E0%B1%8B_%E0%B0%89%E0%B0%AC%E0%B1%8D%E0%B0%AC%E0%B1%81%E0%B0%B8%E0%B0%BF%E0%B0%B0%E0%B0%B2%E0%B1%81_%28Esophageal_varices%29.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:%E0%B0%85%E0%B0%A8%E0%B1%8D%E0%B0%A8%E0%B0%B5%E0%B0%BE%E0%B0%B9%E0%B0%BF%E0%B0%95%E0%B0%B2%E0%B1%8B_%E0%B0%89%E0%B0%AC%E0%B1%8D%E0%B0%AC%E0%B1%81%E0%B0%B8%E0%B0%BF%E0%B0%B0%E0%B0%B2%E0%B1%81_(Esophageal_varices).jpg",
      "legenda": "Varizes esofágicas: veias dilatadas e tortuosas serpenteando pela parede do esôfago distal, por hipertensão portal.",
      "autoria": "Dr. Gannavarapu Narasimha Murthy · CC0",
      "sha256": "782478984ec772af92d01b489af5e40f5e80f17c6e13cd95145340f2f66c0c45",
      "ext": "jpg"
    },
    {
      "id": "wc-varizes-sinais-vermelhos",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Esophageal_varices_-_wale.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Esophageal_varices_-_wale.jpg",
      "legenda": "Varizes com sinais vermelhos (\"red wale marks\") na superfície — as estrias que marcam a variz prestes a sangrar e indicam ligadura profilática.",
      "autoria": "Samir · domínio público",
      "sha256": "7463d9b82f8a0ec783c612d7c79554a2f44662494892f2dc168425f57c97a999",
      "ext": "jpg"
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
  "fundoscopia/descolamento-de-retina": [
    {
      "id": "wc-descolamento-nei",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/b/b0/Slit_lamp_photograph_showing_retinal_detachment_in_Von_Hippel-Lindau_disease_EDA08.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Slit_lamp_photograph_showing_retinal_detachment_in_Von_Hippel-Lindau_disease_EDA08.JPG",
      "legenda": "Descolamento de retina visto pela pupila: a retina solta aparece como uma membrana cinza-esbranquiçada, ondulada, com os vasos correndo sobre as dobras, em paciente com doença de von Hippel-Lindau.",
      "autoria": "National Eye Institute / NIH · domínio público",
      "sha256": "2a34511176ebe11bbdb2a0b8fa25a700e8789df4483251c572983c551d2f8536",
      "ext": "jpg"
    },
    {
      "id": "wc-descolamento-regmatogenico",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Rhegmatogene_amotio_retinae.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Rhegmatogene_amotio_retinae.jpg",
      "legenda": "Descolamento regmatogênico em imagem de campo amplo: a retina elevada e esbranquiçada, com a rasgadura em ferradura que a originou.",
      "autoria": "Amaris5 · CC BY-SA 4.0",
      "sha256": "48a0a1c921796ef46e57d56d5e3bd4fa837108c12f3d8453a6f5da225ca2e17c",
      "ext": "jpg"
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
  "fundoscopia/oclusao-arterial-central": [
    {
      "id": "wc-oacr-cereja-bisht",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/0/07/Cherry_red_spot_in_patient_with_central_retinal_artery_occlusion_%28CRAO%29.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Cherry_red_spot_in_patient_with_central_retinal_artery_occlusion_(CRAO).jpg",
      "legenda": "Oclusão da artéria central da retina: retina difusamente pálida e edemaciada, arteríolas afiladas e a mácula vermelho-cereja no centro — o único pedaço de fundo que ficou com a cor de antes.",
      "autoria": "Dr. Gopal Bisht · CC BY-SA 4.0",
      "sha256": "162812bc8af9208f69798d3e32740ba73732cdbc3e46ff2fcb8fe14850e96679",
      "ext": "jpg"
    },
    {
      "id": "wc-oacr-cereja-fiess",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Cherry_Red_Spot_Fiess.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Cherry_Red_Spot_Fiess.jpg",
      "legenda": "Oclusão típica da artéria central da retina: mancha vermelho-cereja, edema retiniano e estreitamento dos vasos.",
      "autoria": "Fieß A, Cal Ö, Kehrein S et al. · CC BY 2.0",
      "sha256": "722b5a07acdf9a89f9eeb6f93ecd9c94d5cacf25f5ef30aabfa7e49f5e5b1cd8",
      "ext": "jpg"
    }
  ],
  "fundoscopia/oclusao-venosa-central": [
    {
      "id": "wc-ovcr-veias-tortuosas",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/e/ee/A_2022_case_report_of_central_retinal_vein_occlusion_was_likely_caused_by_a_four-year_history_of_e-cigarette_usage.png",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:A_2022_case_report_of_central_retinal_vein_occlusion_was_likely_caused_by_a_four-year_history_of_e-cigarette_usage.png",
      "legenda": "Oclusão da veia central da retina: veias dilatadas e tortuosas (asteriscos), hemorragias em ponto e borrão nos quatro quadrantes e manchas de Roth, em homem de 23 anos.",
      "autoria": "Balinski AM, Harvey RN, Ko RB et al. — Cureus, 2022 · CC BY 4.0",
      "sha256": "188b0e2c6dfed4b961948fbd0a55d3486feade795b3f0a6a034ec96e44a510cd",
      "ext": "png"
    }
  ],
  "fundoscopia/papila-palida": [
    {
      "id": "wc-atrofia-optica",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Photographic_image_of_the_patient_right_eye_showing_optic_atrophy_without_diabetic_retinopathy_Wolfram_syndrome.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Photographic_image_of_the_patient_right_eye_showing_optic_atrophy_without_diabetic_retinopathy_Wolfram_syndrome.jpg",
      "legenda": "Atrofia óptica: disco branco-giz, de bordas nítidas, sem o rosa da vascularização normal, em paciente com síndrome de Wolfram. A retina ao redor está preservada.",
      "autoria": "Manaviat MR, Rashidi M, Mohammadi SM — Cases Journal, 2009 · CC BY 2.0",
      "sha256": "023bf00e1dcf370f58d41132b9cd48fdce2e917a220312bd3de24e024952c837",
      "ext": "jpg"
    }
  ],
  "fundoscopia/papiledema": [
    {
      "id": "wc-papiledema-grave",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Fundal_photograph_showing_severe_papilloedema_in_the_right_eye.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Fundal_photograph_showing_severe_papilloedema_in_the_right_eye.jpg",
      "legenda": "Papiledema grave no olho direito: disco elevado e hiperemiado, de bordas apagadas, com os vasos mergulhando na borda edemaciada e hemorragias peripapilares.",
      "autoria": "Bansal S, Dabbs T, Long V — J Med Case Reports, 2008 · CC BY 2.0",
      "sha256": "d6ced3265c3f7392521113f3ef21ff3cf15a94080595a46fd660f7ab3f72809a",
      "ext": "jpg"
    },
    {
      "id": "wc-papiledema-trobe",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Papilledema.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Papilledema.jpg",
      "legenda": "Papiledema: o disco óptico inchado e borrado pela hipertensão intracraniana, com vasos ingurgitados e hemorragias em chama ao redor.",
      "autoria": "Jonathan Trobe, MD — Kellogg Eye Center · CC BY 3.0",
      "sha256": "367c722b170732af93ae5a0ae98b153de4bf9861fcf7fbf17924163b43513cfe",
      "ext": "jpg"
    }
  ],
  "fundoscopia/retinopatia-diabetica": [
    {
      "id": "wc-rd-exsudatos-hemorragias",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/0/00/%D0%94%D0%B8%D0%B0%D0%B1%D0%B5%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B0%D1%8F_%D1%80%D0%B5%D1%82%D0%B8%D0%BD%D0%BE%D0%BF%D0%B0%D1%82%D0%B8%D1%8F.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:%D0%94%D0%B8%D0%B0%D0%B1%D0%B5%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B0%D1%8F_%D1%80%D0%B5%D1%82%D0%B8%D0%BD%D0%BE%D0%BF%D0%B0%D1%82%D0%B8%D1%8F.jpg",
      "legenda": "Retinopatia diabética com edema macular: exsudatos duros amarelos, hemorragias em borrão e microaneurismas concentrados no polo posterior.",
      "autoria": "Mark Panin · CC BY-SA 4.0",
      "sha256": "dc43482e7ea6d918b21c701229f8c9a256ff3800427ba4446f2a46f79cf5c2ca",
      "ext": "jpg"
    },
    {
      "id": "wc-rd-inicial",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/0/07/Fundus_-_diabetic_retinopathy.png",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Fundus_-_diabetic_retinopathy.png",
      "legenda": "Retinopatia diabética não proliferativa: exsudatos duros dispersos (pontos amarelados), microaneurismas ao longo dos vasos e pequenas hemorragias — o estágio em que o rastreamento faz diferença.",
      "autoria": "Hao S, Liu C, Li N et al. · CC BY 4.0",
      "sha256": "16464305b3686e2fa318cdf56ece15d24fa5f8dd2328aaaeeb687b2c9e070ef5",
      "ext": "png"
    }
  ],
  "fundoscopia/retinopatia-hipertensiva": [
    {
      "id": "wc-retinopatia-hipertensiva",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/ff/Hypertensiveretinopathy.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Hypertensiveretinopathy.jpg",
      "legenda": "Retinopatia hipertensiva: arteríolas estreitadas e retificadas, com aumento do reflexo dorsal e cruzamentos arteriovenosos patológicos.",
      "autoria": "Frank Wood · CC BY 3.0",
      "sha256": "6c0466ea0f19aedbac569c059548d18a3c2a7765f8a1eaa4e9a42fb6ba7e8b17",
      "ext": "jpg"
    }
  ],
  "laringoscopia/normal": [
    {
      "id": "wc-laringe-normal-welleschik",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/7/70/Larynx_normal1a.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Larynx_normal1a.jpg",
      "legenda": "Laringe normal vista de cima: as duas pregas vocais brancas e lisas abertas em V na inspiração, a epiglote no alto e os aritenoides atrás.",
      "autoria": "Welleschik · CC BY-SA 3.0",
      "sha256": "01718f33232acecea99238b520bbff9f41694854530b0e2f5cbce22445985dd6",
      "ext": "jpg"
    },
    {
      "id": "wc-pregas-vocais-melvil",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Vocal_folds-201611.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Vocal_folds-201611.jpg",
      "legenda": "Pregas vocais normais à videolaringoscopia: bordas retas, superfície lisa e simétrica, glote amplamente aberta.",
      "autoria": "melvil · CC BY-SA 4.0",
      "sha256": "5b4941ac8b51831dc491cc56f01ca9b376b921574586f8c904b1d764fae35b09",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/abscesso-peritonsilar": [
    {
      "id": "wc-abscesso-peritonsilar",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/3/39/PeritonsilarAbsess.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:PeritonsilarAbsess.jpg",
      "legenda": "Abscesso peritonsilar à direita do paciente: abaulamento do palato mole acima da amígdala (seta), com a úvula empurrada para o lado oposto — a assimetria é o diagnóstico.",
      "autoria": "James Heilman, MD · CC BY-SA 3.0",
      "sha256": "780ab0c6ee9974d508313013c50a00d79a5532b8509478375a7ba7bd18d3699a",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/candidiase-oral": [
    {
      "id": "wc-candidiase-cdc",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Oral_thrush_Aphthae_Candida_albicans._PHIL_1217_lores.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Oral_thrush_Aphthae_Candida_albicans._PHIL_1217_lores.jpg",
      "legenda": "Candidíase oral pseudomembranosa: placas brancas cremosas sobre mucosa vermelha, que se destacam à raspagem.",
      "autoria": "CDC / Public Health Image Library · domínio público",
      "sha256": "43ece7b83ba8bc41031b02d732cd407706e61bb217a3f5687e2c5c9352a5b95b",
      "ext": "jpg"
    },
    {
      "id": "wc-candidiase-lactente",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/3/33/Thrush2010.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Thrush2010.JPG",
      "legenda": "Candidíase oral (\"sapinho\") em lactente: placas brancas aderidas à língua e à mucosa dos lábios.",
      "autoria": "James Heilman, MD · CC BY-SA 3.0",
      "sha256": "ddc29004f6041575269586cb58386f92bb8053c72155bfabe4ba3d4c8eb63dc5",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/epiglotite": [
    {
      "id": "wc-epiglotite-endoscopia",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Epiglottitis_endoscopy.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Epiglottitis_endoscopy.jpg",
      "legenda": "Epiglotite aguda à endoscopia: a epiglote edemaciada e vermelha ocupando a entrada da laringe. Imagem obtida por quem sabe garantir a via aérea — não é exame de abaixador de língua.",
      "autoria": "藤澤孝志 · CC BY-SA 3.0",
      "sha256": "60cfa4c2858b69f49c53d9c2009b0d22f66cf2020b68c8a8945459fbf0fcf4ee",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/faringite-estreptococica": [
    {
      "id": "wc-estrepto-exsudato-heilman",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Pos_strep.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Pos_strep.JPG",
      "legenda": "Faringoamigdalite estreptocócica com cultura positiva: amígdalas aumentadas e hiperemiadas, cobertas de exsudato branco-amarelado nas criptas.",
      "autoria": "James Heilman, MD · CC BY-SA 3.0",
      "sha256": "21427f2cdf4877e294d083c9fb43d7460f43faf78ccab25f7cf21e119f5bd05b",
      "ext": "jpg"
    },
    {
      "id": "wc-estrepto-crianca",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/4/4f/Strep_throat2010.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Strep_throat2010.JPG",
      "legenda": "Estreptococo do grupo A em criança de 8 anos: o exsudato amigdaliano típico sobre amígdalas vermelhas e edemaciadas.",
      "autoria": "James Heilman, MD · CC BY-SA 3.0",
      "sha256": "10d37933978a951e106c44a837bfae2a511f44d9fadc4d26f4de7e7aa4c84117",
      "ext": "jpg"
    },
    {
      "id": "wc-estrepto-uvula-edemaciada",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/3/30/Streptococcal_pharyngitis_1.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Streptococcal_pharyngitis_1.jpg",
      "legenda": "Faringite estreptocócica: hiperemia intensa da orofaringe com a úvula edemaciada e as amígdalas aumentadas.",
      "autoria": "RescueFF · domínio público",
      "sha256": "ef9c53b900360abed8925bfed48700a4c84227f330fe058ccd901126d72876ee",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/moniliase-extensa": [
    {
      "id": "wc-moniliase-extensa-hiv",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/2/26/CandidiasisFromCDCinJPEG03-18-06.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:CandidiasisFromCDCinJPEG03-18-06.JPG",
      "legenda": "Candidíase pseudomembranosa extensa, cobrindo palato e orofaringe, em paciente com HIV: a extensão das placas denuncia o hospedeiro que não se defende.",
      "autoria": "Sol Silverman Jr., DDS — CDC · domínio público",
      "sha256": "9f908a259e284261c9d90772ca9c235454e7f8512b32d9b9fea23c38b2143e6a",
      "ext": "jpg"
    }
  ],
  "orofaringoscopia/normal": [
    {
      "id": "wc-orofaringe-normal",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/0/05/Throat_with_Tonsils_0012J.jpeg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Throat_with_Tonsils_0012J.jpeg",
      "legenda": "Orofaringe normal: úvula central, pilares simétricos, amígdalas pequenas e sem exsudato, mucosa rósea e úmida.",
      "autoria": "Klem · CC BY 3.0",
      "sha256": "c45e69356a5af6efe2a5c280a7eda755708f4009c1316a81f1c206a013aa184a",
      "ext": "jpg"
    }
  ],
  "otoscopia/cerume-obstrutivo": [
    {
      "id": "wc-rolha-de-cerume",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/9/98/BouchonCerumen.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:BouchonCerumen.jpg",
      "legenda": "Rolha de cerume ocupando o conduto auditivo externo, vista pela entrada do meato. Nada da membrana é visível: o exame ainda não foi feito.",
      "autoria": "Didier Descouens · CC BY-SA 3.0",
      "sha256": "8f57761e37c51fe4d283f5b54d8e16098bde98646cc0e91b041288ac587d12a0",
      "ext": "jpg"
    }
  ],
  "otoscopia/colesteatoma": [
    {
      "id": "wc-colesteatoma-perfuracao-ampla",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/52/Cholesteatoma_and_large_perforation_left_ear.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Cholesteatoma_and_large_perforation_left_ear.jpg",
      "legenda": "Colesteatoma: a massa branca de queratina no quadrante superior do tímpano esquerdo, com uma perfuração ampla ao lado — a maior parte da membrana já não existe.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "51907bb6ea5e11d02220ffe762dd048b42097022688261a816a16a4b55c657b1",
      "ext": "jpg"
    },
    {
      "id": "wc-colesteatoma-atico",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Attic_Cholesteatoma.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Attic_Cholesteatoma.jpg",
      "legenda": "Colesteatoma de ático: a pequena massa vermelho-cereja de granulação nascendo da pars flaccida denuncia o colesteatoma escondido atrás dela. É a região que a otoscopia apressada não olha.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "1fcf3e93ddade9804f9cef1436554e057e2dfb55fa5c2a2a2fcc369982547792",
      "ext": "jpg"
    }
  ],
  "otoscopia/normal": [
    {
      "id": "wc-timpano-esquerdo-normal",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Normal_Left_Tympanic_Membrane.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Normal_Left_Tympanic_Membrane.jpg",
      "legenda": "Membrana timpânica esquerda normal: translúcida e cinza-perolada, com o cabo do martelo descendo até o umbo e o cone de luz ântero-inferior. O promontório se adivinha por transparência.",
      "autoria": "Michael Hawke, MD · CC BY-SA 4.0",
      "sha256": "cd8cd6bcc8437974779916245070085bb2b6da636473668907ed2864ef23937d",
      "ext": "jpg"
    },
    {
      "id": "wc-timpano-direito-corda-do-timpano",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/8/85/Normal_Tympanic_Membrane_Chorda_Tympani_Nerve_Visible.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Normal_Tympanic_Membrane_Chorda_Tympani_Nerve_Visible.jpg",
      "legenda": "Tímpano direito normal, tão translúcido que se vê o nervo corda do tímpano passando lateralmente ao ramo longo da bigorna, atrás da membrana.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "92ce51581f35c3802ebc5d6e4d98887c82fef72490d4b7faeda38c0ff893ce3d",
      "ext": "jpg"
    }
  ],
  "otoscopia/otite-externa": [
    {
      "id": "wc-otite-externa-grave",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/9/94/OtitisExterna10.JPG",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:OtitisExterna10.JPG",
      "legenda": "Otite externa grave vista de fora: o meato está edemaciado e fechado, com secreção e crostas na entrada do conduto. O otoscópio não passa — e não deve ser forçado.",
      "autoria": "James Heilman, MD · CC BY 3.0",
      "sha256": "4a3deac96ccb642d33f1519c84f40e381a2168c140f7aed5a064d2cf4c129027",
      "ext": "jpg"
    }
  ],
  "otoscopia/otite-media-aguda": [
    {
      "id": "wc-oma-exsudato-abaulando",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Acute_Otitis_Media_Stage_of_Resolution.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Acute_Otitis_Media_Stage_of_Resolution.jpg",
      "legenda": "Otite média aguda: o ouvido médio cheio de exsudato mucopurulento cremoso empurra a membrana para fora. Os vasos radiais estão dilatados e o cone de luz desapareceu.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "adb7219f330ee1971137ae7f236bc05fcced403802426b705f3b1d306de1f507",
      "ext": "jpg"
    },
    {
      "id": "wc-oma-abaulada-vermelha",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/58/Otitis_media_entdifferenziert2.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Otitis_media_entdifferenziert2.jpg",
      "legenda": "Otite média aguda em fase plena: membrana abaulada, vermelha e opaca, sem nenhum ponto de referência reconhecível — nem cabo do martelo, nem cone de luz.",
      "autoria": "B. Welleschik · CC BY-SA 3.0",
      "sha256": "c2611f8066570e00327dd9b7d199997d3fd38c479f1bd7b63ef6499d4e1bd013",
      "ext": "jpg"
    }
  ],
  "otoscopia/otite-media-com-efusao": [
    {
      "id": "wc-ome-serosa-adulto",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Adult_Serous_Otitis_Media.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Adult_Serous_Otitis_Media.jpg",
      "legenda": "Otite média com efusão em adulto: a membrana ganha cor amarelo-dourada pelo líquido seroso, cor de palha, que enche o ouvido médio. Sem hiperemia, sem abaulamento — é líquido, não infecção.",
      "autoria": "Michael Hawke, MD · CC BY-SA 4.0",
      "sha256": "1b8bc0cb7c407888135de753d9f2201007f1b40a05d9ff9237b69fd47fd79e23",
      "ext": "jpg"
    }
  ],
  "otoscopia/otite-media-cronica": [
    {
      "id": "wc-perfuracao-subtotal",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Subtotal_Perforation_of_the_right_tympanic_membrane.tif/lossy-page1-1920px-Subtotal_Perforation_of_the_right_tympanic_membrane.tif.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Subtotal_Perforation_of_the_right_tympanic_membrane.tif",
      "legenda": "Otite média crônica: perfuração subtotal do tímpano direito, de bordas espessadas, com a cadeia ossicular e a mucosa do ouvido médio expostas — o tímpano perdeu a capacidade de fechar.",
      "autoria": "Michael Hawke, MD · CC BY-SA 4.0",
      "sha256": "e6dcafc4d59f368372a7bc31338f10638a6a651076f65db560d5ce799ffb2e5d",
      "ext": "jpg"
    }
  ],
  "otoscopia/perfuracao": [
    {
      "id": "wc-perfuracao-traumatica",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/4/4c/Traumatic_Perforation_of_the_Tympanic_Membrane.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Traumatic_Perforation_of_the_Tympanic_Membrane.jpg",
      "legenda": "Perfuração traumática recente da pars tensa: bordas finas e irregulares, com sangue na margem. Este tipo costuma fechar sozinho em semanas.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "bb52b616953dc163d7babb9660a013ea655f0002796e5917e4857864da30430e",
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
  "pupilas/anisocoria-fisiologica": [
    {
      "id": "wc-anisocoria",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/5/51/Anisocoria_in_human_eyes.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Anisocoria_in_human_eyes.jpg",
      "legenda": "Anisocoria: pupilas de tamanhos diferentes na mesma condição de luz. Se a diferença for a mesma no claro e no escuro, com reflexos normais, é fisiológica.",
      "autoria": "Avemokh · CC BY-SA 4.0",
      "sha256": "aaae06d2f658472ab49768e3c01d9a13c5cd203b7a5f009f839c41a539b30f7f",
      "ext": "jpg"
    }
  ],
  "rinoscopia-anterior/polipo-nasal": [
    {
      "id": "wc-polipo-meato-medio",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/8/8b/Middle_meatus_polyp.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Middle_meatus_polyp.jpg",
      "legenda": "Pólipo nasal à endoscopia: massa lisa, translúcida e acinzentada emergindo do meato médio, entre o corneto médio e a parede lateral.",
      "autoria": "Mustafa Kapadia · CC BY-SA 4.0",
      "sha256": "d40ba0478b1363c5a463ded1e2d02b733998e0dc305a1f75d59ebfb36eeab023",
      "ext": "jpg"
    },
    {
      "id": "wc-polipo-narina",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/b/b5/Polype_nasal.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:Polype_nasal.jpg",
      "legenda": "Pólipo nasal visível pela narina direita: massa pálida e brilhante que desce até o vestíbulo — é insensível ao toque, ao contrário do corneto.",
      "autoria": "MathieuMD · CC BY-SA 3.0",
      "sha256": "5d1db22c387be6959ba89446801f87016cbce52c0561f526f4fa62f639f8dc5d",
      "ext": "jpg"
    },
    {
      "id": "wc-polipo-coanal",
      "tipo": "imagem",
      "fonte": "wikimedia-commons",
      "urlOrigem": "https://upload.wikimedia.org/wikipedia/commons/f/fd/CHOANAL_POLYP_PerfectlyClear.jpg",
      "urlDoCaso": "https://commons.wikimedia.org/wiki/File:CHOANAL_POLYP_PerfectlyClear.jpg",
      "legenda": "Pólipo antrocoanal: visto pela endoscopia da fossa nasal esquerda, a massa redonda e lisa preenche a coana ao fundo — nasce no seio maxilar e cresce para trás.",
      "autoria": "Michael Hawke, MD · CC BY 4.0",
      "sha256": "e55907ecd297223efe3bde97b09261f9dfd1f02615050ccc4e59ac1b65455f89",
      "ext": "jpg"
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
export const GERADO_EM: string | null = "2026-09-15"

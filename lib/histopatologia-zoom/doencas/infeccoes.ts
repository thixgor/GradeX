import type { DoencaZoom } from '../tipos'

/** Doenças infecciosas e granulomatosas. */
export const DOENCAS_INFECCOES: DoencaZoom[] = [
  {
    id: 'tuberculose',
    nome: 'Tuberculose',
    sinonimos: ['linfadenite tuberculosa', 'escrófula', 'tuberculose ganglionar', 'tuberculose miliar'],
    nomesEmIngles: ['tuberculosis', 'tuberculous lymphadenitis', 'caseating granulomatous inflammation'],
    sistema: 'linfoide',
    orgao: 'linfonodo',
    prioridade: 1,
    resumo:
      'Infecção por Mycobacterium tuberculosis que provoca inflamação granulomatosa com necrose caseosa: granulomas de macrófagos epitelioides, células gigantes de Langhans e linfócitos em torno de um centro de necrose amorfa.',
    epidemiologia:
      'Cerca de um quarto da população mundial tem infecção latente; o Brasil está entre os países de alta carga, com mais de 80 mil casos novos por ano. Risco maior em HIV, desnutrição, diabetes, uso de imunossupressores (anti-TNF) e populações privadas de liberdade. A forma ganglionar é a extrapulmonar mais comum, sobretudo cervical.',
    patogenese: [
      'O bacilo inalado é fagocitado por macrófagos alveolares, mas bloqueia a fusão do fagossomo com o lisossomo e se multiplica dentro deles.',
      'Após 2–3 semanas, linfócitos T CD4 Th1 específicos secretam IFN-γ, que ativa os macrófagos: eles viram células epitelioides e se fundem em células gigantes de Langhans.',
      'O TNF organiza o granuloma, que contém a infecção; no centro, a resposta imune mata macrófagos infectados e o tecido — necrose caseosa.',
      'Pelos linfáticos, o bacilo chega aos linfonodos regionais, que aumentam, caseificam e podem fistulizar para a pele (escrófula).',
      'Se a imunidade falha, o bacilo se espalha pelo sangue e semeia granulomas pequenos em vários órgãos (tuberculose miliar).',
    ],
    roteiro: [
      'Panorâmico: o linfonodo perdeu a arquitetura de folículos e seios; grandes áreas rosa-pálidas, amorfas e confluentes (caseose) estão cercadas por uma faixa arroxeada.',
      'Médio aumento: na borda da necrose, procure a coroa de macrófagos epitelioides e as células gigantes.',
      'Grande aumento: células de Langhans com núcleos em ferradura; macrófagos epitelioides de núcleo alongado; linfócitos por fora.',
      'No tecido linfoide residual, procure granulomas pequenos, ainda sem necrose, em formação.',
      'Lembre: o bacilo não se vê em H&E — confirme com Ziehl-Neelsen (BAAR), cultura ou PCR.',
    ],
    achados: [
      {
        achado: 'necrose-caseosa',
        tipo: 'especifico',
        comoAparece: 'Áreas extensas de necrose amorfa, eosinofílica e granular, sem arquitetura, no centro dos granulomas confluentes.',
        peso: 'criterio',
      },
      {
        achado: 'granuloma-epitelioide',
        tipo: 'especifico',
        comoAparece: 'Macrófagos epitelioides em paliçada ao redor da necrose e granulomas pequenos em formação.',
        peso: 'criterio',
      },
      {
        achado: 'celula-gigante-de-langhans',
        tipo: 'especifico',
        comoAparece: 'Células gigantes com núcleos em ferradura na borda dos granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Coroa de linfócitos em torno dos granulomas.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Fibrose e calcificação nas lesões antigas ou tratadas.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Sarcoidose',
        comoSeparar: 'Granulomas "nus", compactos, bem delimitados e SEM necrose caseosa, com poucos linfócitos; pesquisa de BAAR e fungos negativa.',
      },
      {
        nome: 'Infecção fúngica (histoplasmose, criptococose, paracoccidioidomicose)',
        comoSeparar: 'Pode ter necrose; as leveduras aparecem no PAS ou na prata (Grocott). A paracoccidioidomicose, frequente no Brasil, mostra leveduras com brotamento múltiplo ("roda de leme").',
      },
      {
        nome: 'Doença da arranhadura do gato',
        comoSeparar: 'Granulomas com necrose SUPURATIVA (neutrófilos no centro), em forma estrelada.',
      },
      {
        nome: 'Linfoma com necrose',
        comoSeparar: 'Necrose tumoral cercada por células atípicas, não por granulomas epitelioides e células de Langhans.',
      },
    ],
    correlacaoClinica: [
      'Forma ganglionar: linfonodos cervicais aumentados, endurecidos e confluentes, às vezes fistulizados para a pele; pode haver febre vespertina, sudorese noturna e emagrecimento.',
      'Diagnóstico: biópsia (granuloma caseoso), BAAR, cultura, teste molecular rápido (GeneXpert); investigar HIV em todo caso.',
      'Tratamento: RIPE (rifampicina, isoniazida, pirazinamida e etambutol) por 2 meses, seguido de RI por 4 meses; notificação compulsória.',
      'Antes de anti-TNF, rastrear tuberculose latente — o TNF é o que mantém o granuloma organizado.',
    ],
    comparacaoComNormal: [
      'O linfonodo normal tem cápsula, seio subcapsular, folículos linfoides no córtex, paracórtex e cordões e seios medulares — todos formados por células pequenas e escuras.',
      'Na tuberculose, grande parte do linfonodo vira necrose rosa e amorfa, e o tecido linfoide que resta é invadido por granulomas pálidos.',
    ],
  },
  {
    id: 'esquistossomose',
    nome: 'Esquistossomose (vesical)',
    sinonimos: ['esquistossomíase', 'bilharziose', 'barriga d’água (forma hepatoesplênica)', 'xistose'],
    nomesEmIngles: ['schistosomiasis', 'bilharzia'],
    sistema: 'urinario',
    orgao: 'bexiga',
    prioridade: 2,
    resumo:
      'Infecção pelo trematódeo Schistosoma, cujos ovos ficam presos nos tecidos e provocam inflamação rica em eosinófilos, granulomas e fibrose; na bexiga (S. haematobium) causa hematúria, e no fígado (S. mansoni) causa fibrose periportal e hipertensão portal.',
    epidemiologia:
      'Mais de 200 milhões de infectados no mundo. S. mansoni é a espécie do Brasil (Nordeste e Minas Gerais), da África e do Caribe — forma intestinal e hepatoesplênica. S. haematobium: África e Oriente Médio — forma urinária (esta lâmina). Transmissão por contato com água doce contaminada por cercárias liberadas por caramujos (Biomphalaria no Brasil).',
    patogenese: [
      'Cercárias penetram a pele na água (dermatite do nadador), migram pelo pulmão e amadurecem no sistema porta.',
      'Os casais de vermes se instalam nas veias: plexo vesical (S. haematobium) ou mesentéricas (S. mansoni); a fêmea põe centenas de ovos por dia.',
      'Os ovos atravessam a parede para sair na urina ou nas fezes; os que ficam presos liberam antígenos e induzem resposta Th2: eosinófilos, granulomas epitelioides em volta de cada ovo e, depois, fibrose.',
      'Na bexiga: pólipos, úlceras, hematúria, fibrose e calcificação, metaplasia escamosa e risco de carcinoma escamoso. No fígado: fibrose periportal "em haste de cachimbo" (de Symmers), hipertensão portal com varizes e esplenomegalia, com função hepática preservada.',
    ],
    roteiro: [
      'Panorâmico: mucosa e parede com inflamação intensa; procure estruturas ovais rosadas agrupadas.',
      'Médio aumento: ovos com casca refringente; em volta, eosinófilos, granulomas e às vezes células gigantes.',
      'Grande aumento: miracídio dentro do ovo (viável) ou casca colapsada e calcificada (ovo morto); procure a espícula.',
      'Avalie o urotélio: hiperplasia, metaplasia escamosa, displasia ou carcinoma associado.',
    ],
    achados: [
      {
        achado: 'ovos-de-schistosoma',
        tipo: 'especifico',
        comoAparece: 'Ovos com casca e miracídio, isolados ou em grupos, na lâmina própria e na parede.',
        peso: 'criterio',
      },
      {
        achado: 'eosinofilos-teciduais',
        tipo: 'geral',
        comoAparece: 'Infiltrado rico em eosinófilos em volta dos ovos (cistite eosinofílica).',
        peso: 'frequente',
      },
      {
        achado: 'granuloma-epitelioide',
        tipo: 'geral',
        comoAparece: 'Granulomas com células gigantes envolvendo ovos, sobretudo nos mortos.',
        peso: 'frequente',
      },
      {
        achado: 'fibrose-cicatricial',
        tipo: 'geral',
        comoAparece: 'Fibrose e calcificação da parede na infecção crônica.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Cistite eosinofílica de outras causas (alergia, drogas, tumor)',
        comoSeparar: 'Os mesmos eosinófilos, mas sem ovos: procure-os em vários níveis de corte.',
      },
      {
        nome: 'Carcinoma urotelial ou escamoso',
        comoSeparar: 'A esquistossomose pode formar massa (pólipo inflamatório); o carcinoma tem células atípicas invasivas — e os dois podem coexistir.',
      },
    ],
    correlacaoClinica: [
      'Urinária: hematúria terminal em jovem de área endêmica (como neste caso); ovos na urina de fim de micção ao meio-dia.',
      'Mansônica: diarreia, dor abdominal; forma hepatoesplênica com esplenomegalia, varizes de esôfago e hemorragia digestiva; ovos nas fezes (Kato-Katz).',
      'Tratamento: praziquantel. Prevenção: saneamento, evitar contato com água de rios e lagos contaminados, controle dos caramujos.',
    ],
    comparacaoComNormal: [
      'Na bexiga normal, o urotélio repousa sobre uma lâmina própria frouxa, com poucas células inflamatórias.',
      'Na esquistossomose, a lâmina própria fica tomada por ovos do parasita cercados de eosinófilos — o tecido reage aos ovos presos.',
    ],
  },
  {
    id: 'giardiase',
    nome: 'Giardíase',
    sinonimos: ['giardíase intestinal', 'lambliase'],
    nomesEmIngles: ['giardiasis'],
    sistema: 'digestorio',
    orgao: 'duodeno',
    prioridade: 3,
    resumo:
      'Infecção do intestino delgado pelo protozoário flagelado Giardia, que vive na luz aderido às vilosidades sem invadir; a mucosa costuma ser normal ou pouco alterada, e o diagnóstico está nos trofozoítos em forma de foice na superfície.',
    epidemiologia:
      'Parasitose intestinal por protozoário mais comum no mundo; muito frequente em crianças de creches e em áreas sem saneamento. Transmissão fecal-oral por água (resistente ao cloro), alimentos e contato pessoal. Mais grave e persistente na deficiência de IgA e na imunodeficiência comum variável.',
    patogenese: [
      'Ingestão de 10–100 cistos basta; no duodeno eles liberam trofozoítos.',
      'Os trofozoítos se prendem ao epitélio pelo disco ventral e se multiplicam por divisão binária, sem invadir.',
      'Lesam as microvilosidades e ativam linfócitos: perda de dissacaridases e de área absortiva; em casos intensos, atrofia vilositária.',
      'Resultado: diarreia gordurosa e fétida, flatulência e má absorção (lactose, vitaminas); os cistos saem nas fezes.',
    ],
    roteiro: [
      'Panorâmico: arquitetura vilositária geralmente preservada — não conclua "normal" antes de olhar a superfície.',
      'Médio aumento: percorra a luz entre as vilosidades e o muco sobre a borda em escova.',
      'Grande aumento: trofozoítos em foice ou pera, com dois núcleos; avalie atrofia e linfócitos intraepiteliais.',
      'Veja se há plasmócitos na lâmina própria (a falta deles sugere imunodeficiência).',
    ],
    achados: [
      {
        achado: 'trofozoitos-de-giardia',
        tipo: 'especifico',
        comoAparece: 'Trofozoítos em foice ou piriformes na luz e sobre a superfície das vilosidades.',
        peso: 'criterio',
      },
      {
        achado: 'atrofia-vilositaria',
        tipo: 'geral',
        comoAparece: 'Vilosidades encurtadas em parte dos casos, sobretudo com infecção intensa ou imunodeficiência.',
        peso: 'ocasional',
      },
      {
        achado: 'infiltrado-linfoplasmocitario',
        tipo: 'geral',
        comoAparece: 'Aumento discreto de linfócitos e plasmócitos na lâmina própria, às vezes ausente.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Doença celíaca',
        comoSeparar: 'Atrofia vilositária com linfócitos intraepiteliais aumentados e sem parasitas; anticorpo antitransglutaminase positivo.',
      },
      {
        nome: 'Muco e células descamadas (artefato)',
        comoSeparar: 'Formas irregulares e variadas; os trofozoítos são uniformes, em crescente, e se repetem.',
      },
      {
        nome: 'Criptosporidiose',
        comoSeparar: 'Pontos basofílicos de 2–5 µm aderidos à borda em escova, e não formas em foice na luz.',
      },
    ],
    correlacaoClinica: [
      'Diarreia aquosa ou esteatorreica, cólicas, distensão, flatulência; forma crônica com perda de peso e intolerância à lactose. Em idosos, pode se manifestar só como anemia ou má absorção, como neste caso.',
      'Diagnóstico: antígeno ou PCR nas fezes, exame parasitológico seriado; na biópsia duodenal, os trofozoítos.',
      'Tratamento: metronidazol, tinidazol ou nitazoxanida; água tratada e higiene das mãos.',
    ],
    comparacaoComNormal: [
      'O duodeno normal tem vilosidades altas revestidas por enterócitos com borda em escova e células caliciformes, e a luz entre elas vazia.',
      'Na giardíase, a mucosa pode ser igual à normal — a diferença são pequenos parasitas em forma de foice colados à superfície e soltos na luz.',
    ],
  },
  {
    id: 'amebiase',
    nome: 'Amebíase intestinal (colite amebiana)',
    sinonimos: ['disenteria amebiana', 'colite amebiana', 'amebíase invasiva'],
    nomesEmIngles: ['amoebic colitis', 'amoebiasis'],
    sistema: 'digestorio',
    orgao: 'colon',
    prioridade: 14,
    resumo:
      'Infecção invasiva do cólon pelo protozoário Entamoeba histolytica: úlceras com exsudato necrótico onde se veem trofozoítos grandes, de citoplasma espumoso, que fagocitam hemácias.',
    epidemiologia:
      'Comum em regiões tropicais com saneamento precário (inclusive no Brasil); transmissão fecal-oral de cistos. A maioria dos infectados é assintomática. Formas graves em crianças, gestantes, desnutridos e em usuários de corticoide.',
    patogenese: [
      'Cistos ingeridos resistem ao ácido gástrico e liberam trofozoítos no íleo terminal e cólon.',
      'Os trofozoítos aderem à mucosa (lectina Gal/GalNAc) e matam as células por contato com amebaporos e cisteíno-proteases.',
      'Invadem a submucosa e se espalham lateralmente: úlcera em "botão de camisa", com borda de mucosa quase normal.',
      'Podem entrar em vênulas e chegar ao fígado pela porta: abscesso hepático ("pasta de anchova").',
    ],
    roteiro: [
      'Panorâmico: mucosa do cólon com áreas de úlcera e exsudato; entre elas, mucosa relativamente preservada.',
      'Médio aumento: exsudato necrótico, fibrina e neutrófilos sobre a úlcera — é ali que as amebas ficam.',
      'Grande aumento: trofozoítos grandes, espumosos, com núcleo pequeno redondo e hemácias no citoplasma. Confirme com PAS.',
      'Separe de doença inflamatória intestinal (distorção de criptas, plasmocitose basal) antes de qualquer corticoide.',
    ],
    achados: [
      {
        achado: 'trofozoitos-de-entamoeba',
        tipo: 'especifico',
        comoAparece: 'Trofozoítos com citoplasma espumoso e hemácias fagocitadas no exsudato da úlcera.',
        peso: 'criterio',
      },
      {
        achado: 'ulceracao-da-mucosa',
        tipo: 'geral',
        comoAparece: 'Úlceras com exsudato necrótico e fibrina, com mucosa relativamente preservada entre elas.',
        peso: 'frequente',
      },
      {
        achado: 'infiltrado-neutrofilico',
        tipo: 'geral',
        comoAparece: 'Neutrófilos no exsudato e na lâmina própria vizinha à úlcera.',
        peso: 'frequente',
      },
    ],
    diferenciais: [
      {
        nome: 'Doença inflamatória intestinal (colite ulcerativa, Crohn)',
        comoSeparar: 'Cronicidade: distorção das criptas, plasmocitose basal, metaplasia de Paneth; sem amebas.',
      },
      {
        nome: 'Colite infecciosa bacteriana',
        comoSeparar: 'Inflamação aguda com criptas preservadas, sem trofozoítos.',
      },
      {
        nome: 'Macrófagos no exsudato',
        comoSeparar: 'Núcleo maior e irregular, raramente com hemácias; PAS mais fraco.',
      },
    ],
    correlacaoClinica: [
      'Diarreia com sangue e muco, cólicas e tenesmo, em geral de instalação gradual; febre é menos comum que na disenteria bacteriana.',
      'Diagnóstico: antígeno ou PCR nas fezes (diferencia E. histolytica da E. dispar não patogênica), sorologia, colonoscopia com biópsia.',
      'Tratamento: metronidazol (forma tecidual) seguido de agente luminal (paromomicina). Nunca dar corticoide antes de excluir amebíase.',
    ],
    comparacaoComNormal: [
      'No cólon normal, criptas retas cheias de células caliciformes e uma superfície íntegra, sem exsudato.',
      'Na colite amebiana, a superfície é substituída por úlcera com exsudato, e nele aparecem células grandes e espumosas: as amebas.',
    ],
  },
  {
    id: 'enterobiase',
    nome: 'Enterobíase (oxiuríase)',
    sinonimos: ['oxiuríase', 'oxiúro', 'enterobíase apendicular'],
    nomesEmIngles: ['enterobiasis', 'pinworm infection'],
    sistema: 'digestorio',
    orgao: 'apendice',
    prioridade: 15,
    resumo:
      'Infecção pelo nematódeo Enterobius vermicularis, que vive no ceco e no apêndice; na apendicectomia aparecem vermes na luz com asas laterais cuticulares, geralmente sem apendicite aguda.',
    epidemiologia:
      'A helmintíase mais comum em países de clima temperado; afeta sobretudo crianças em idade escolar, com transmissão intradomiciliar fácil (mãos, roupas de cama, poeira). Encontrado em 1–4 % dos apêndices removidos.',
    patogenese: [
      'Ovos ingeridos eclodem no duodeno; as larvas amadurecem e os adultos vivem no ceco, apêndice e cólon ascendente.',
      'À noite, as fêmeas grávidas migram até a pele perianal e põem milhares de ovos, que se tornam infectantes em horas — o prurido leva à autoinfecção pelas mãos.',
      'No apêndice, os vermes ficam na luz; a mucosa em geral não é invadida. Podem obstruir a luz e causar dor, e raramente migram ao trato genital feminino (granulomas).',
    ],
    roteiro: [
      'Panorâmico: apêndice com a luz ocupada por vários cortes transversais de vermes.',
      'Médio aumento: cutícula espessa e brilhante com duas asas laterais; musculatura e tubo digestivo do verme.',
      'Grande aumento: nas fêmeas, útero com ovos ovais achatados de um lado.',
      'Avalie a parede: neutrófilos na muscular (apendicite aguda associada) ou apêndice sem inflamação.',
    ],
    achados: [
      {
        achado: 'enterobius-vermicularis',
        tipo: 'especifico',
        comoAparece: 'Vermes na luz com cutícula eosinofílica e asas laterais pontiagudas.',
        peso: 'criterio',
      },
      {
        achado: 'inflamacao-aguda-transmural',
        tipo: 'geral',
        comoAparece: 'Apendicite aguda coexistente em uma minoria dos casos.',
        peso: 'ocasional',
      },
      {
        achado: 'eosinofilos-teciduais',
        tipo: 'geral',
        comoAparece: 'Eosinófilos na mucosa, quando há contato ou invasão.',
        peso: 'ocasional',
      },
    ],
    diferenciais: [
      {
        nome: 'Apendicite aguda sem parasitas',
        comoSeparar: 'Neutrófilos na muscular própria e periapendicite; sem vermes na luz.',
      },
      {
        nome: 'Outros helmintos (Ascaris, Strongyloides, Trichuris)',
        comoSeparar: 'Ascaris é muito maior; Strongyloides invade as criptas com larvas pequenas; Trichuris tem a extremidade anterior embutida na mucosa. As asas laterais apontam oxiúro.',
      },
    ],
    correlacaoClinica: [
      'Prurido anal noturno, irritabilidade e sono agitado em crianças; às vezes dor na fossa ilíaca direita que leva à apendicectomia, como neste caso.',
      'Diagnóstico: fita adesiva perianal pela manhã (método de Graham); os ovos raramente aparecem nas fezes.',
      'Tratamento: albendazol ou mebendazol em dose única, repetido em 2 semanas, para toda a família; lavar roupas de cama e cortar as unhas.',
    ],
    comparacaoComNormal: [
      'No apêndice normal, a luz é pequena, com muco e fezes, cercada por criptas e muito tecido linfoide.',
      'Na enterobíase, a mesma mucosa aparece íntegra, mas a luz está cheia de cortes do verme, cada um com sua cutícula e asas laterais.',
    ],
  },
]

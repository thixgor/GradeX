import type { Sinal } from './esquemas'

/**
 * Quinta leva, parte 6 — seis fichas de malformações e lesões que se
 * diagnosticam à inspeção, completando a leva (substituem temas que já
 * existiam no manual sob outro nome).
 */
export const SINAIS_LEVA_5_EXTRA: Sinal[] = [
  {
    slug: 'polidactilia-e-sindactilia',
    nome: 'Polidactilia e sindactilia',
    sinonimos: ['Dedo extranumerário', 'Dedos fundidos', 'Polidactilia pós-axial e pré-axial', 'Sindactilia simples e complexa'],
    sistema: 'pediatrico',
    resumo: 'Um sexto dedo pendurado por um pedículo ao lado do mínimo (pós-axial, a mais comum e quase sempre isolada), um polegar duplicado (pré-axial, que pede ortopedia) ou dois dedos unidos por pele ou por osso (sindactilia) — malformações que se veem no primeiro exame e que às vezes anunciam uma síndrome.',
    definicao: 'Polidactilia: dedo supranumerário nas mãos ou nos pés — pós-axial (lado ulnar/fibular; tipo A com dedo bem formado e articulado, tipo B rudimentar e pediculado — 10 vezes mais comum em afrodescendentes, geralmente familiar e isolada), pré-axial (duplicação do polegar/hálux, classificada por Wassel; mais em brancos e asiáticos; associada a síndromes), central (rara). Sindactilia: fusão de dois ou mais dedos — simples (só pele e partes moles) ou complexa (união óssea), completa (até a ponta) ou incompleta; mais comum entre 3º e 4º dedos da mão e 2º e 3º dos pés; isolada e familiar ou sindrômica (Apert — sindactilia complexa em "luva" com craniossinostose; Poland — sindactilia com ausência do peitoral). Contar os dedos e verificar a mobilidade de cada um faz parte do exame do recém-nascido.',
    comoProcurar: [
      { passo: 'Conte os dedos de cada mão e pé e observe se cada um tem unha, articulações e movimento.', detalhe: 'Pós-axial tipo B: pedículo fino, sem osso — a ligadura no berçário é discutida; excisão eletiva é mais segura.' },
      { passo: 'Polegar duplicado ou dedo extra do lado radial: radiografia e ortopedia pediátrica — a reconstrução define a função da pinça.', detalhe: 'Pré-axial é a que mais se associa a síndromes (Holt-Oram com cardiopatia, Fanconi).' },
      { passo: 'Sindactilia: toque a membrana e mova os dedos separadamente; radiografia se houver suspeita de fusão óssea.', detalhe: 'Olhe crânio, face e tórax: Apert, Poland, Saethre-Chotzen.' },
    ],
    mecanismo: 'Entre a 5ª e a 8ª semana, o broto do membro forma raios digitais sob controle da zona de atividade polarizante (Sonic hedgehog) e a apoptose separa os dedos; excesso de sinalização produz dedos extras, e falha da apoptose interdigital deixa a membrana (sindactilia); mutações em GLI3 (Greig, Pallister-Hall), FGFR2 (Apert) e outras vias explicam as formas sindrômicas.',
    significado: 'As malformações congênitas mais comuns dos membros (1 a 2 por 1.000 nascidos). A pós-axial isolada é benigna e cosmética; a pré-axial e as sindactilias complexas exigem cirurgia planejada para preservar função; qualquer uma com outra anomalia (crânio, coração, rim) pede avaliação genética.',
    armadilhas: ['Ligar o dedo rudimentar com fio no berçário: neuroma doloroso e coto residual.', 'Polidactilia bilateral dos pés + obesidade + retinose: Bardet-Biedl.', 'Sindactilia do 2º e 3º dedos do pé: comum e benigna, mas na trissomia e no Smith-Lemli-Opitz é pista.', 'Bandas amnióticas: amputações e sindactilias assimétricas com sulcos constritivos — mecanismo diferente.'],
    causas: [
      { titulo: 'Isolada', mecanismo: 'Herança autossômica dominante ou esporádica.', itens: ['Polidactilia pós-axial familiar', 'Sindactilia familiar (tipos I a V)'] },
      { titulo: 'Sindrômica', mecanismo: 'Vias de padronização do membro.', itens: ['Apert, Pfeiffer, Saethre-Chotzen (craniossinostoses)', 'Poland', 'Greig, Pallister-Hall (GLI3)', 'Bardet-Biedl, Ellis-van Creveld, Meckel-Gruber', 'Trissomia 13, Holt-Oram, Fanconi'] },
    ],
    referencias: ['Malik S. Polydactyly: phenotypes, genetics and classification. Clin Genet, 2014.', 'Kozin SH. Syndactyly. J Am Soc Surg Hand, 2001.'],
  },
  {
    slug: 'onfalocele-e-gastrosquise',
    nome: 'Onfalocele e gastrosquise',
    sinonimos: ['Defeito da parede abdominal', 'Exonfalia', 'Laparosquise', 'Vísceras expostas no recém-nascido'],
    sistema: 'pediatrico',
    resumo: 'Alças intestinais nuas, edemaciadas e cobertas de fibrina saindo por um orifício à direita de um cordão umbilical normal (gastrosquise) — ou um saco translúcido, com o cordão inserido no ápice, contendo intestino e fígado (onfalocele): dois defeitos da parede que se distinguem num olhar e têm prognósticos opostos.',
    definicao: 'Gastrosquise: defeito paraumbilical pequeno (2 a 5 cm), quase sempre à direita do cordão, sem saco, com intestino eviscerado, espessado, edemaciado e coberto por película fibrinosa (exposição ao líquido amniótico); mãe jovem; anomalias associadas raras (atresia intestinal em 10%); sobrevida > 90%. Onfalocele: herniação de conteúdo abdominal (intestino, fígado, baço) pela base do cordão, coberta por saco de âmnio e peritônio (que pode romper), com o cordão inserido no ápice do saco; defeito de 4 a 12 cm (gigante quando contém fígado); anomalias associadas em 50 a 70% (cardíacas, cromossômicas — trissomias 13 e 18 —, Beckwith-Wiedemann com macroglossia e hipoglicemia, pentalogia de Cantrell); prognóstico depende delas. Ambas diagnosticadas no ultrassom pré-natal na maioria.',
    comoProcurar: [
      { passo: 'Onde está o cordão? Inserido normalmente ao lado do defeito = gastrosquise; no ápice de um saco = onfalocele.', detalhe: 'Saco íntegro protege as vísceras; rompido, o aspecto se confunde — procure resíduos de membrana.' },
      { passo: 'Cubra as vísceras com plástico estéril (saco de vísceras ou filme), mantenha a criança em decúbito lateral, sonda gástrica aberta, acesso venoso e aquecimento.', detalhe: 'A perda de calor e de líquido pelas alças expostas é o risco imediato.' },
      { passo: 'Onfalocele: exame completo, ecocardiograma, glicemia (Beckwith-Wiedemann), cariótipo.', detalhe: 'Gastrosquise: cirurgia (fechamento primário ou silo) nas primeiras horas; onfalocele gigante pode ser tratada com epitelização e fechamento tardio.' },
    ],
    mecanismo: 'Onfalocele: falha do retorno do intestino herniado fisiologicamente para a cavidade abdominal entre a 10ª e a 12ª semana — a hérnia do cordão persiste, coberta pelas membranas do cordão. Gastrosquise: ruptura da parede abdominal junto à base do cordão (involução anormal da veia umbilical direita ou da artéria onfalomesentérica), com evisceração para o líquido amniótico, que inflama e espessa as alças; associada a mãe adolescente, tabagismo e vasoconstritores.',
    significado: 'Diferenciar os dois no berçário (ou no ultrassom) define a investigação e a conversa com os pais: gastrosquise é problema cirúrgico com ótimo prognóstico; onfalocele é marcador de síndrome e de malformação cardíaca, e o prognóstico é o das anomalias associadas. A incidência de gastrosquise vem aumentando no mundo.',
    armadilhas: ['Onfalocele com saco roto tratada como gastrosquise: as anomalias associadas não são investigadas.', 'Hérnia de cordão umbilical pequena (< 4 cm) clampeada junto com o cordão: lesão de alça.', 'Extrofia de bexiga e de cloaca: defeito infraumbilical — outro espectro.', 'Hipoglicemia na onfalocele: Beckwith-Wiedemann até prova contrária.'],
    causas: [
      { titulo: 'Onfalocele', mecanismo: 'Falha do retorno do intestino herniado.', itens: ['Isolada', 'Trissomias 13, 18 e 21', 'Beckwith-Wiedemann', 'Pentalogia de Cantrell, OEIS'] },
      { titulo: 'Gastrosquise', mecanismo: 'Ruptura paraumbilical da parede.', itens: ['Mãe adolescente', 'Tabagismo, álcool, vasoconstritores na gestação', 'Isolada na quase totalidade'] },
    ],
    referencias: ['Ledbetter DJ. Congenital abdominal wall defects and reconstruction in pediatric surgery: gastroschisis and omphalocele. Surg Clin North Am, 2012.'],
  },
  {
    slug: 'mielomeningocele',
    nome: 'Mielomeningocele',
    sinonimos: ['Espinha bífida aberta', 'Disrafismo espinhal aberto', 'Meningocele', 'Defeito do tubo neural'],
    sistema: 'pediatrico',
    resumo: 'Na linha média lombossacra do recém-nascido, uma placa vermelha e úmida de tecido nervoso exposto (placódio) no centro de um saco ou de uma área sem pele, às vezes vazando líquor, com pernas frouxas e sem reflexos abaixo do nível — o tubo neural que não fechou e que hoje se opera antes ou logo depois do nascimento.',
    definicao: 'Defeito de fechamento do tubo neural posterior com protrusão de meninges e medula pela falha dos arcos vertebrais: lesão cística ou plana na linha média dorsal (lombossacra em 75%), com placódio neural exposto (tecido vermelho-róseo, sem pele, no centro), circundado por zona epitelial fina e depois pele normal; saída de líquor; paralisia flácida, anestesia e arreflexia abaixo do nível da lesão (nível funcional: torácico — sem movimento de pernas; L3 — flete quadril e estende joelho; L4-L5 — dorsiflexão; sacral — só pé e esfíncteres), pé torto, luxação de quadril, bexiga e intestino neurogênicos, hidrocefalia em 80 a 90% (Chiari II — verificar fontanela e perímetro cefálico) e estridor, apneia ou disfagia pelo tronco cerebral comprimido. Meningocele: só meninges no saco, coberto por pele, sem déficit. Formas fechadas (lipomielomeningocele, medula presa): tufo de pelos, lipoma, fosseta ou hemangioma na linha média.',
    comoProcurar: [
      { passo: 'Inspeção do dorso em todo recém-nascido: lesão aberta é evidente; procure também tufo de pelos, lipoma, fosseta profunda ou hemangioma na linha média (disrafismo oculto).', detalhe: 'Cubra a lesão aberta com gaze estéril úmida, decúbito ventral, sem látex.' },
      { passo: 'Defina o nível: observe movimento espontâneo e à estimulação de quadril, joelho, tornozelo e dedos; reflexos; tônus anal.', detalhe: 'O nível funcional prediz a marcha (L3 ou abaixo: deambulação possível com órteses).' },
      { passo: 'Meça o perímetro cefálico, palpe a fontanela, ouça a respiração (estridor) e observe a sucção.', detalhe: 'Ultrassom transfontanelar e ressonância; derivação ventricular quando indicada; cirurgia do defeito em 24 a 72 h.' },
    ],
    mecanismo: 'Falha do fechamento do neuróporo posterior entre o 21º e o 28º dia de gestação, antes de a mulher saber que está grávida — por deficiência de folato, hipertermia, diabetes materno, ácido valproico/carbamazepina e predisposição genética (MTHFR); a medula exposta ao líquido amniótico sofre lesão progressiva ("two-hit"), e a fuga de líquor pelo defeito arrasta o tronco cerebral para baixo (Chiari II) e obstrui a circulação liquórica (hidrocefalia).',
    significado: 'A malformação grave mais comum compatível com a vida (1 por 1.000 nascidos, menos onde há fortificação com ácido fólico — o Brasil fortifica farinhas desde 2004); o ácido fólico periconcepcional previne 70%. A cirurgia fetal (antes de 26 semanas) reduz hidrocefalia e melhora a função motora. O exame neurológico do recém-nascido define o nível e o prognóstico funcional para a família e a equipe multidisciplinar.',
    armadilhas: ['Alergia ao látex: desde o nascimento, todo material sem látex — anafilaxia é frequente nesses pacientes.', 'Disrafismo oculto (tufo de pelos, lipoma) ignorado: medula presa com deterioração na infância — ultrassom de coluna no recém-nascido.', 'Fosseta sacral simples (< 5 mm, dentro da prega glútea, fundo visível): benigna, não exige exame.', 'Teratoma sacrococcígeo: massa coberta por pele, sem déficit.'],
    causas: [
      { titulo: 'Falha de fechamento do tubo neural', mecanismo: 'Multifatorial no primeiro mês.', itens: ['Deficiência de folato', 'Ácido valproico, carbamazepina', 'Diabetes materno, obesidade, hipertermia', 'Polimorfismos do metabolismo do folato (MTHFR)', 'Trissomias 13 e 18'] },
    ],
    referencias: ['Copp AJ et al. Spina bifida. Nat Rev Dis Primers, 2015.', 'Adzick NS et al. A randomized trial of prenatal versus postnatal repair of myelomeningocele (MOMS). N Engl J Med, 2011.'],
  },
  {
    slug: 'anquiloglossia',
    nome: 'Anquiloglossia (língua presa)',
    sinonimos: ['Língua presa', 'Freio lingual curto', 'Teste da linguinha', 'Frênulo lingual encurtado'],
    sistema: 'pediatrico',
    resumo: 'A ponta da língua que faz um "coração" quando o bebê tenta projetá-la, um freio curto e espesso que a prende ao assoalho da boca e uma língua que não sobe até o palato — a anquiloglossia, que prejudica a pega e a amamentação em alguns e é achado sem consequência em muitos.',
    definicao: 'Freio lingual anormalmente curto, espesso ou inserido próximo à ponta da língua, que restringe sua mobilidade: ponta em coração ou entalhada à protrusão, incapacidade de projetar a língua além da gengiva inferior, elevação limitada (não toca o palato com a boca aberta), língua "presa" ao assoalho; na amamentação, pega superficial, estalos, mamadas longas e ineficazes, fissuras mamilares e ganho de peso lento; classificação anatômica (Coryllos, Kotlow) e funcional (Hazelbaker, protocolo de Bristol — BTAT); avaliação pelo "teste da linguinha" (lei 13.002/2014 no Brasil); prevalência de 4 a 10%.',
    comoProcurar: [
      { passo: 'Levante a língua com os dois indicadores sob as bordas: veja onde o freio se insere e quanto a língua sobe.', detalhe: 'Freio fino e translúcido inserido na ponta (anterior) ou espesso e posterior.' },
      { passo: 'Estimule a protrusão (toque o lábio inferior): ponta em coração; e a sucção no dedo: movimento de ondulação e vedação.', detalhe: 'Use um escore funcional; a anatomia sozinha não indica cirurgia.' },
      { passo: 'Observe uma mamada com quem sabe (banco de leite, consultora): a pega e a dor materna são o que importa.', detalhe: 'Frenotomia só se houver prejuízo funcional que não melhora com a correção da pega.' },
    ],
    mecanismo: 'Falha na apoptose das células do freio lingual durante a embriogênese deixa um remanescente de tecido fibroso mais extenso; a restrição mecânica reduz a elevação e a extensão da língua necessárias para vedar a aréola e ordenhar o seio; a hereditariedade é frequente (formas ligadas ao X e TBX22).',
    significado: 'A anquiloglossia é comum e a maioria dos bebês mama bem apesar dela; a frenotomia (corte simples, sem anestesia geral, no consultório) resolve a dor materna e a ineficiência da pega quando há restrição funcional real. O sobrediagnóstico — e as frenotomias desnecessárias, inclusive "posteriores" — é o problema atual; a indicação é funcional, avaliada durante a mamada.',
    armadilhas: ['Operar pela anatomia sem dificuldade de mamada.', 'Atribuir à língua presa toda dificuldade de amamentação: pega incorreta, mamilo plano e baixa produção são mais comuns.', 'Freio labial superior espesso: em geral não interfere na mamada.', 'Anquiloglossia com fenda palatina ou outras anomalias: síndromes (Van der Woude, Opitz).'],
    causas: [
      { titulo: 'Congênita', mecanismo: 'Persistência do tecido do freio.', itens: ['Isolada (familiar em parte)', 'Associada a fenda palatina e síndromes (raro)'] },
    ],
    referencias: ['Messner AH et al. Clinical consensus statement: ankyloglossia in children. Otolaryngol Head Neck Surg, 2020.', 'Ingram J et al. The development of a tongue assessment tool to assist with tongue-tie identification (BTAT). Arch Dis Child Fetal Neonatal Ed, 2015.'],
  },
  {
    slug: 'ranula-e-mucocele',
    nome: 'Rânula e mucocele',
    sinonimos: ['Cisto de retenção de muco', 'Rânula mergulhante', 'Mucocele labial', 'Fenômeno de extravasamento de muco'],
    sistema: 'cabeca-pescoco',
    resumo: 'Uma bolha azulada, translúcida e mole no assoalho da boca, ao lado do freio, que empurra a língua para cima — a rânula, "barriga de rã", da glândula sublingual; ou a mesma bolha pequena no lábio inferior de um adolescente que morde o lábio — a mucocele, que estoura e volta.',
    definicao: 'Mucocele: pseudocisto de extravasamento de muco por ruptura de ducto de glândula salivar menor após trauma (mordida), pápula ou nódulo de 2 a 10 mm, mole, flutuante, azulado ou translúcido (róseo se profundo), no lábio inferior (75%), mucosa jugal, ventre da língua ou assoalho; indolor, cresce e rompe repetidamente, drenando líquido viscoso. Rânula: mucocele do assoalho da boca originada da glândula sublingual, tumefação azulada, translúcida, unilateral, lateral ao freio lingual, de 1 a 5 cm, que eleva a língua e pode atrapalhar a fala e a deglutição; rânula mergulhante (plunging) quando o muco atravessa o milo-hióideo e aparece como massa mole submandibular ou cervical, com ou sem componente oral. Diagnóstico clínico; ultrassom ou TC para a mergulhante.',
    comoProcurar: [
      { passo: 'Olhe e palpe: mole, flutuante, translúcida, sem dor e sem sinais inflamatórios.', detalhe: 'Pergunte se já "estourou" — a história de recidiva é típica da mucocele.' },
      { passo: 'Rânula: peça para levantar a língua; a lesão fica lateral ao freio, de um lado só.', detalhe: 'Massa cervical mole com ou sem lesão oral: mergulhante — imagem.' },
      { passo: 'Tratamento: mucocele — excisão com a glândula menor envolvida; rânula — marsupialização ou excisão da glândula sublingual (menor recidiva).', detalhe: 'Não puncione apenas: recidiva.' },
    ],
    mecanismo: 'Trauma do ducto de uma glândula salivar menor (mordida do lábio) ou obstrução/ruptura do ducto sublingual extravasa muco para o tecido conjuntivo, onde forma uma cavidade sem revestimento epitelial (pseudocisto) cercada por tecido de granulação; a mucocele de retenção verdadeira (com epitélio) é mais rara. Na rânula mergulhante, o muco disseca através de deiscências do milo-hióideo até o pescoço.',
    significado: 'Lesões benignas e comuns (mucocele é a lesão mais frequente da mucosa oral em jovens) cujo valor está em reconhecê-las sem exames e distingui-las de tumores de glândula salivar (nódulo firme, fixo, crescimento contínuo — o palato é o local dos tumores de glândulas menores), hemangiomas e cisto dermoide do assoalho (mediano, pastoso).',
    armadilhas: ['Nódulo firme no palato ou no lábio superior: tumor de glândula salivar menor (adenoma pleomorfo, carcinoma) — mucoceles no lábio superior são raras.', 'Cisto dermoide do assoalho: mediano, pastoso, não translúcido.', 'Hemangioma e linfangioma: compressíveis, vasculares.', 'Rânula mergulhante confundida com higroma cístico ou cisto branquial.'],
    causas: [
      { titulo: 'Extravasamento de muco', mecanismo: 'Trauma ou obstrução ductal.', itens: ['Mordida do lábio (mucocele)', 'Trauma ou obstrução do ducto sublingual (rânula)', 'Rânula mergulhante (deiscência do milo-hióideo)', 'Rânula congênita (rara)'] },
    ],
    referencias: ['Harrison JD. Modern management and pathophysiology of ranula: literature review. Head Neck, 2010.'],
  },
  {
    slug: 'queratoacantoma',
    nome: 'Queratoacantoma',
    sinonimos: ['Ceratoacantoma', 'Molusco sebáceo', 'Tumor em cratera', 'Carcinoma espinocelular tipo queratoacantoma'],
    sistema: 'pele',
    resumo: 'Um nódulo em cúpula, cor da pele ou róseo, com uma cratera central cheia de queratina, que cresceu de nada a 1 ou 2 cm em poucas semanas na pele exposta ao sol de um idoso — o queratoacantoma, que pode regredir sozinho, mas que se trata como carcinoma espinocelular porque a clínica e a histologia não os separam com segurança.',
    definicao: 'Tumor epitelial de crescimento rápido (semanas), nódulo firme, em cúpula, simétrico, de 1 a 2,5 cm, com borda lisa e brilhante (às vezes com telangiectasias) e cratera central preenchida por rolha de queratina; em áreas fotoexpostas (face, dorso das mãos, antebraços) de adultos de pele clara acima dos 50 anos; evolução clássica em três fases — proliferativa (4 a 8 semanas), estável e involutiva (regressão espontânea em 4 a 6 meses, deixando cicatriz deprimida); variantes: gigante (> 3 cm), centrífugo marginado, múltiplos (Ferguson-Smith, Grzybowski, Muir-Torre com tumores viscerais); histologia de carcinoma espinocelular bem diferenciado com arquitetura em cratera.',
    comoProcurar: [
      { passo: 'Pergunte a velocidade: "quando apareceu?" — semanas, não anos.', detalhe: 'Carcinoma espinocelular convencional cresce em meses; ceratose seborreica, anos.' },
      { passo: 'Olhe a arquitetura: cúpula simétrica, borda lisa, cratera com rolha córnea.', detalhe: 'Dermatoscopia: vasos em grampo e lineares na periferia, massa central de queratina.' },
      { passo: 'Biópsia excisional com margem (ou biópsia profunda que inclua a base) — não raspe a superfície.', detalhe: 'Trate como carcinoma espinocelular: excisão; imunossuprimidos e lesões periorificiais não esperam regressão.' },
    ],
    mecanismo: 'Proliferação de queratinócitos do infundíbulo folicular, desencadeada por radiação UV, trauma, HPV, carcinógenos químicos e fármacos (inibidores de BRAF, imunossupressores), com mutações em TP53 e HRAS; a regressão espontânea resulta de diferenciação terminal e resposta imune — o que a distingue biologicamente do carcinoma espinocelular, embora a histologia seja sobreponível.',
    significado: 'Considerado hoje uma variante de carcinoma espinocelular bem diferenciado com potencial de regressão: excisão completa é o padrão, porque não se pode prever qual regredirá e alguns invadem e metastatizam (raro). Múltiplos queratoacantomas pedem investigação de Muir-Torre (câncer de cólon) e revisão de fármacos.',
    armadilhas: ['Biópsia superficial (shave) que mostra "queratoacantoma" e deixa a base: recidiva e invasão.', 'Esperar a regressão em lesão do nariz, pálpebra ou lábio: destruição local.', 'Carcinoma espinocelular verdadeiro rotulado de queratoacantoma pelo aspecto.', 'Molusco contagioso gigante e verruga hiperceratósica no diferencial.'],
    causas: [
      { titulo: 'Solitário', mecanismo: 'UV, trauma e mutações somáticas.', itens: ['Fotoexposição crônica', 'Trauma local, cicatriz, tatuagem', 'Imunossupressão', 'Inibidores de BRAF (vemurafenibe), sorafenibe'] },
      { titulo: 'Múltiplos', mecanismo: 'Predisposição genética.', itens: ['Ferguson-Smith (TGFBR1)', 'Grzybowski (eruptivo)', 'Muir-Torre (Lynch — MSH2, MLH1)', 'Xeroderma pigmentoso'] },
    ],
    referencias: ['Kwiek B, Schwartz RA. Keratoacanthoma (KA): an update and review. J Am Acad Dermatol, 2016.'],
  },
]

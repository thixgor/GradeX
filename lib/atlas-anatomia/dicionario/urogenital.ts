import type { EntradaDicionario } from './tipos'

/**
 * Sistemas urinário e genital.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const UROGENITAL: EntradaDicionario[] = [
  {
    termos: ['Rim'],
    resumo: 'Órgãos retroperitoneais em forma de feijão, responsáveis pela filtração do sangue e pela formação da urina.',
    localizacao: 'Entre T12 e L3, o direito mais baixo pelo fígado, envolvidos por cápsula, gordura perirrenal e fáscia renal (de Gerota).',
    funcao: 'Filtram o plasma, regulam volume, eletrólitos e equilíbrio acidobásico e produzem eritropoetina, renina e calcitriol.',
    vascularizacao: 'Artéria renal (L1–L2) e suas segmentares terminais; veia renal para a cava, com a esquerda passando entre aorta e mesentérica superior.',
    inervacao: 'Plexo renal (T10–L1); a dor renal é referida ao flanco e ao ângulo costovertebral.',
    clinica:
      'O sinal de Giordano (punho-percussão do ângulo costovertebral) sugere pielonefrite. A biópsia renal é feita no polo inferior, que tem menos vasos. As artérias segmentares serem terminais explica os infartos renais segmentares bem delimitados.',
    pontos: ['T12–L3, retroperitoneais; direito mais baixo', 'Artérias segmentares terminais', 'Sinal de Giordano'],
  },
  {
    termos: ['Ureter'],
    resumo: 'Tubo muscular retroperitoneal de 25–30 cm que conduz a urina do rim à bexiga.',
    localizacao: 'Desce sobre o psoas maior, cruza os vasos ilíacos na bifurcação e entra obliquamente na parede da bexiga.',
    funcao: 'Conduz a urina por peristalse, e sua entrada oblíqua na bexiga funciona como válvula antirrefluxo.',
    vascularizacao: 'Ramos das artérias renal, gonadal, aorta, ilíacas e vesical inferior — irrigação segmentar longitudinal.',
    inervacao: 'Plexos renal, aórtico e hipogástrico; a dor é referida em cólica do flanco à região inguinal e à genitália.',
    relacoes: 'Na mulher, passa sob a artéria uterina ("a água passa sob a ponte"); no homem, sob o ducto deferente.',
    clinica:
      'Os três estreitamentos — junção ureteropélvica, cruzamento dos vasos ilíacos e junção ureterovesical — são onde o cálculo impacta. A relação com a artéria uterina é a causa clássica de lesão ureteral em histerectomia.',
    pontos: [
      'Três estreitamentos anatômicos',
      '"A água passa sob a ponte" (ureter sob a artéria uterina)',
      'Entrada oblíqua na bexiga é antirrefluxo',
    ],
  },
  {
    termos: ['Próstata'],
    resumo: 'Glândula acessória masculina que envolve a uretra prostática, abaixo da bexiga.',
    localizacao: 'Entre o colo vesical e o diafragma urogenital, atrás da sínfise púbica e à frente do reto — palpável ao toque retal.',
    funcao: 'Produz a secreção alcalina que compõe cerca de 30% do sêmen, protegendo os espermatozoides da acidez vaginal.',
    vascularizacao: 'Artérias vesicais inferiores e retais médias; plexo venoso prostático comunicante com o plexo vertebral de Batson.',
    inervacao: 'Plexo prostático, com os feixes neurovasculares posterolaterais responsáveis pela ereção.',
    clinica:
      'A hiperplasia benigna acomete a zona de transição e obstrui a uretra; o adenocarcinoma nasce na zona periférica, e por isso é palpável ao toque retal. A comunicação com o plexo de Batson explica as metástases vertebrais osteoblásticas. A preservação dos feixes neurovasculares é o objetivo da prostatectomia nerve-sparing.',
    pontos: [
      'Zona de transição = hiperplasia; zona periférica = câncer',
      'Palpável ao toque retal',
      'Plexo de Batson e metástase vertebral osteoblástica',
    ],
  },
  {
    termos: ['Útero'],
    resumo: 'Órgão muscular oco da pelve feminina, onde se implanta e se desenvolve o embrião.',
    localizacao: 'Entre a bexiga e o reto, em anteversoflexão na maioria das mulheres, com fundo, corpo, istmo e colo, sustentado pelos ligamentos largo, redondo e uterossacrais.',
    funcao: 'Recebe o blastocisto, abriga a gestação e, pelo miométrio, gera as contrações do parto.',
    vascularizacao: 'Artéria uterina (ilíaca interna), que cruza por cima do ureter, com anastomose com a artéria ovárica.',
    inervacao: 'Plexo uterovaginal; a dor do corpo sobe por T10–L1 e a do colo, por S2–S4 — base da analgesia em dois tempos no trabalho de parto.',
    linfaticos: 'Fundo para linfonodos lombares; corpo para ilíacos externos; colo para ilíacos internos, obturatórios e sacrais.',
    clinica:
      'A relação ureter–artéria uterina é a causa clássica de lesão ureteral em histerectomia. A drenagem linfática distinta explica os campos de linfadenectomia no câncer de colo e de endométrio. O ligamento redondo termina no lábio maior, o que explica a dor inguinal na gestação.',
    pontos: [
      '"A água passa sob a ponte": ureter sob a artéria uterina',
      'Dor do corpo T10–L1; do colo S2–S4',
      'Drenagem linfática diferente por segmento',
    ],
  },
  {
    termos: ['Testículo'],
    resumo: 'Gônada masculina, alojada no escroto, produtora de espermatozoides e testosterona.',
    localizacao: 'No escroto, envolvido pela túnica vaginal, com o epidídimo em sua face posterolateral e o funículo espermático acima.',
    funcao: 'Espermatogênese nos túbulos seminíferos e produção de testosterona pelas células intersticiais.',
    vascularizacao: 'Artéria testicular, ramo direto da aorta em L2; plexo pampiniforme e veia testicular — direita para a cava, esquerda para a renal esquerda.',
    inervacao: 'Plexo testicular (T10–T11); a dor testicular é referida à região periumbilical.',
    linfaticos: 'Linfonodos lombares (para-aórticos) — a pele do escroto é que drena para os inguinais.',
    clinica:
      'A dissociação linfática é decisiva no estadiamento: tumor de testículo se estadia no retroperitônio. A torção testicular é emergência de horas, com abolição do reflexo cremastérico e elevação do testículo — o sinal de Prehn ajuda a diferenciar de epididimite.',
    pontos: [
      'Vasos e linfáticos acompanham a origem abdominal (L2)',
      'Testículo drena para para-aórticos; escroto para inguinais',
      'Torção: reflexo cremastérico abolido, emergência cirúrgica',
    ],
  },
  {
    termos: ['Bexiga Urinária', 'Bexiga'],
    resumo: 'Reservatório muscular da urina, na pelve, atrás da sínfise púbica.',
    localizacao: 'Subperitoneal; vazia, é pélvica, e ao encher sobe para o abdome, descolando o peritônio da parede anterior.',
    funcao: 'Armazena a urina em baixa pressão pela complacência do detrusor e a expulsa na micção coordenada com o relaxamento esfincteriano.',
    vascularizacao: 'Artérias vesicais superior e inferior, ramos da ilíaca interna.',
    inervacao:
      'Parassimpático S2–S4 contrai o detrusor (esvaziamento); simpático L1–L2 mantém o enchimento e fecha o esfíncter interno; nervo pudendo comanda o esfíncter externo voluntário.',
    clinica:
      'A bexiga cheia sobe acima do púbis, permitindo punção suprapúbica sem atravessar o peritônio. O trígono é a região de maior incidência de tumor urotelial. A bexiga neurogênica se explica pelo mapa de inervação acima.',
    pontos: ['Cheia, sobe acima do púbis: punção suprapúbica', 'S2–S4 esvazia; simpático enche', 'Trígono: sítio dos tumores uroteliais'],
  },
  {
    termos: ['Corpo do Pênis', 'Glande do Pênis'],
    classe: 'viscera',
    resumo: 'Porção livre e extremidade do pênis, formadas pelos corpos eréteis revestidos por pele móvel.',
    localizacao:
      'O corpo contém os dois corpos cavernosos dorsais e o corpo esponjoso ventral; a glande é a expansão distal do esponjoso, com a coroa e o colo marcando sua base e o óstio externo da uretra na ponta.',
    funcao: 'Os cavernosos garantem a rigidez da ereção; o esponjoso mantém a uretra pérvia durante a ereção, e a glande concentra a inervação sensitiva.',
    vascularizacao: 'Artérias profundas do pênis (cavernosos) e do bulbo (esponjoso), ramos da pudenda interna; drenagem pela veia dorsal profunda para o plexo prostático.',
    inervacao: 'Nervo dorsal do pênis, ramo do pudendo (S2–S4); ereção parassimpática pelos nervos cavernosos e ejaculação simpática.',
    clinica:
      'A fimose e a parafimose se explicam pelo anel prepucial no colo da glande — na parafimose, o prepúcio retraído estrangula e exige redução imediata. O priapismo isquêmico acomete os cavernosos e poupa a glande, e é emergência de horas pelo risco de fibrose e disfunção erétil definitiva.',
    pontos: [
      'Cavernosos = rigidez; esponjoso = uretra pérvia',
      'Parafimose estrangula no colo da glande',
      'Priapismo isquêmico poupa a glande',
    ],
  },
  {
    termos: ['Escroto'],
    classe: 'viscera',
    resumo: 'Bolsa cutânea que aloja os testículos fora da cavidade abdominal, mantendo-os alguns graus mais frios.',
    localizacao: 'Suspensa abaixo da sínfise púbica, dividida por um septo interno e marcada externamente pela rafe escrotal; suas camadas repetem, uma a uma, as da parede abdominal.',
    funcao: 'Regula a temperatura testicular pelo músculo dartos, que enruga a pele, e pelo cremaster, que aproxima ou afasta o testículo do corpo.',
    vascularizacao: 'Artérias pudendas externas (femoral) na frente e pudenda interna atrás.',
    inervacao: 'Ramo genital do genitofemoral (L1–L2) para o cremaster, ílio-inguinal na frente e ramos do pudendo atrás.',
    linfaticos: 'Linfonodos inguinais superficiais — diferente do testículo, que drena para os lombares.',
    clinica:
      'Essa diferença de drenagem é decisiva: tumor de testículo estadia-se no retroperitônio, mas câncer de pele do escroto vai para a virilha. O reflexo cremastérico (L1–L2) desaparece na torção testicular, e a transiluminação separa hidrocele de massa sólida.',
    pontos: [
      'Camadas espelham a parede abdominal',
      'Escroto drena para inguinais; testículo para lombares',
      'Reflexo cremastérico abolido na torção',
    ],
  },
  {
    termos: ['Tuba Uterina Direita', 'Tuba Uterina Esquerda'],
    classe: 'viscera',
    resumo: 'Conduto par que capta o ovócito e o leva ao útero — e onde a fecundação de fato acontece.',
    localizacao:
      'Na margem livre do ligamento largo, com quatro partes: intramural, istmo, ampola e infundíbulo com as fímbrias, que abraçam o ovário e abrem na cavidade peritoneal.',
    funcao: 'As fímbrias capturam o ovócito na ovulação, e o batimento ciliar somado à peristalse o conduz até o útero, geralmente em três a quatro dias.',
    vascularizacao: 'Ramos tubários das artérias uterina e ovárica.',
    inervacao: 'Plexos ovárico e uterovaginal.',
    relacoes: 'É o único ponto do corpo em que a cavidade peritoneal se comunica com o meio externo — pela vagina, útero e tuba.',
    clinica:
      'A fecundação ocorre na ampola, o sítio mais comum de gravidez ectópica: quando rompe, dá abdome agudo hemorrágico. Essa comunicação com o peritônio é também a via da doença inflamatória pélvica ascendente e da peri-hepatite de Fitz-Hugh-Curtis.',
    pontos: [
      'Fecundação na ampola; ectópica no mesmo lugar',
      'Única comunicação do peritônio com o exterior',
      'Via ascendente da doença inflamatória pélvica',
    ],
  },
  {
    termos: ['Fórnice da Vagina'],
    classe: 'viscera',
    resumo: 'Recesso circular entre o colo do útero e a parede vaginal, dividido em fórnices anterior, posterior e laterais.',
    localizacao: 'Em torno da porção vaginal do colo; o fórnice posterior é o mais profundo, e logo atrás dele está a escavação retouterina.',
    funcao: 'Acomoda a projeção do colo dentro da vagina e é onde se depositam as secreções cervicais.',
    clinica:
      'A profundidade do fórnice posterior é o que permite a culdocentese — puncionar o fundo de saco de Douglas pela vagina para confirmar hemoperitônio, como na ruptura de gravidez ectópica. É também por ali que se palpa a espinha isquiática para o bloqueio do pudendo.',
    pontos: [
      'Fórnice posterior é o mais profundo',
      'Acesso ao fundo de saco de Douglas',
      'Referência do bloqueio do nervo pudendo',
    ],
  },
]

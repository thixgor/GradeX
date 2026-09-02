import type { EntradaDicionario } from './tipos'

/**
 * Sistema genital feminino e mama.
 *
 * A pelve feminina tem uma característica que nenhuma outra região do corpo
 * tem: uma cavidade peritoneal aberta para o exterior, pela tuba, pelo útero e
 * pela vagina. Essa continuidade explica a peritonite de origem genital, a
 * gravidez ectópica e a disseminação do câncer de ovário — e é por ela que
 * começam as fichas desta seção.
 */
export const GENITAL_FEMININO: EntradaDicionario[] = [
  /* ─────────────────── Ovário e tuba ─────────────────── */
  {
    termos: ['Ovário Direito', 'Ovário Esquerdo'],
    classe: 'glandula',
    resumo: 'Gônadas femininas, do tamanho de uma amêndoa, suspensas na parede lateral da pelve.',
    localizacao: 'Na fossa ovárica, entre os vasos ilíacos externos e internos; sua superfície é a única víscera abdominal não revestida por peritônio.',
    funcao: 'Produzem os oócitos e os hormônios sexuais; a ovulação rompe a superfície do ovário e libera o oócito diretamente na cavidade peritoneal.',
    vascularizacao: 'Artéria ovárica, ramo direto da aorta em L2, e ramo ovárico da artéria uterina — dupla irrigação com anastomose.',
    linfaticos: 'Linfonodos lombares (para-aórticos), como o testículo, pela mesma razão embrionária.',
    relacoes: 'O nervo obturatório corre no assoalho da fossa ovárica, imediatamente lateral ao ovário.',
    clinica:
      'A ausência de revestimento peritoneal é o que permite ao câncer de ovário disseminar-se livremente pela cavidade, com carcinomatose e ascite antes de qualquer sintoma local — a razão do diagnóstico habitualmente tardio. E a vizinhança com o nervo obturatório explica a dor referida na face medial da coxa em processos inflamatórios ovarianos, sinal sutil que costuma passar despercebido.',
    memoria:
      'O ovário é o único órgão que "abre" na cavidade peritoneal a cada ciclo. É por essa porta que o tumor se espalha.',
    pontos: [
      'Por que o ovário não é revestido por peritônio?',
      'Para onde drena sua linfa e por quê?',
      'Que nervo corre na fossa ovárica?',
    ],
  },
  {
    termos: ['Ligamento Suspensor do Ovário'],
    classe: 'ligamento',
    resumo: 'Prega peritoneal que leva os vasos ováricos da parede pélvica ao ovário — o ligamento infundibulopélvico.',
    localizacao: 'Da parede lateral da pelve à extremidade tubária do ovário, cruzando os vasos ilíacos externos.',
    funcao: 'Conduz a artéria e a veia ováricas, os linfáticos e os nervos ovarianos.',
    relacoes: 'Cruza o ureter perto da bifurcação ilíaca — relação de poucos milímetros.',
    clinica:
      'Essa proximidade é a razão de o ureter ser lesado na ligadura do infundibulopélvico durante a ooforectomia, uma das complicações urológicas mais frequentes da ginecologia. E é a torção desse pedículo que produz a torção anexial: dor pélvica súbita, náusea e ovário aumentado com fluxo alterado ao Doppler — emergência em que a destorção precoce salva a gônada.',
    memoria:
      'Ligar o infundibulopélvico sem ver o ureter é o erro clássico. Identifique o ureter antes de qualquer pinça.',
    pontos: [
      'Que estruturas o ligamento suspensor conduz?',
      'Que estrutura ele cruza e por que isso importa?',
      'O que é a torção anexial?',
    ],
  },
  {
    termos: ['Ligamento Útero-ovárico'],
    classe: 'ligamento',
    resumo: 'Cordão fibromuscular que liga o ovário ao ângulo do útero, dentro do ligamento largo.',
    localizacao: 'Da extremidade uterina do ovário ao corno uterino, abaixo e atrás da tuba.',
    funcao:
      'É o remanescente superior do gubernáculo, cuja porção inferior se torna o ligamento redondo do útero. Não sustenta o ovário — apenas o mantém em relação ao útero.',
    relacoes: 'Contém o ramo ovárico da artéria uterina.',
    clinica:
      'A continuidade embrionária entre ligamento útero-ovárico e ligamento redondo explica a dor referida na virilha em processos ovarianos e a possibilidade de endometriose no canal inguinal. Cirurgicamente, na histerectomia com preservação dos ovários, é esse ligamento que se secciona — enquanto o infundibulopélvico é poupado, para manter a irrigação ovariana.',
    memoria:
      'Gubernáculo virou dois ligamentos: o de cima liga ovário ao útero, o de baixo vai até a virilha. Um cordão cortado ao meio pelo útero.',
    pontos: [
      'De que estrutura embrionária deriva o ligamento útero-ovárico?',
      'Que ligamento é sua continuação inferior?',
      'Que ligamento se secciona na histerectomia com preservação ovariana?',
    ],
  },
  {
    termos: ['Ligamento Largo do Útero'],
    classe: 'ligamento',
    resumo: 'Prega peritoneal dupla que se estende do útero às paredes laterais da pelve.',
    localizacao: 'Do útero à parede pélvica lateral, dividido em mesossalpinge (para a tuba), mesovário (para o ovário) e mesométrio (a maior parte).',
    funcao:
      'Não é um ligamento de sustentação: é uma prega peritoneal que transporta estruturas. Contém a tuba uterina, o ligamento redondo, o ligamento útero-ovárico, os vasos uterinos e ováricos, o plexo nervoso e restos embrionários.',
    relacoes: 'Na sua base, a artéria uterina cruza por cima do ureter, a cerca de 2 cm lateralmente ao colo.',
    clinica:
      'Esse cruzamento é o passo mais perigoso da histerectomia: a lesão ureteral ocorre mais frequentemente ali do que em qualquer outro ponto. E os restos embrionários no mesossalpinge — epoóforo e paroóforo, remanescentes do ducto mesonéfrico — são a origem dos cistos paratubários, incluindo a hidátide de Morgagni, achado comum e benigno que pode torcer.',
    memoria:
      '"A água passa por baixo da ponte": ureter por baixo, artéria uterina por cima, dois centímetros do colo.',
    pontos: [
      'Que estruturas o ligamento largo contém?',
      'Quais são suas três porções?',
      'Onde a artéria uterina cruza o ureter?',
    ],
  },
  {
    termos: ['Extremidade Tubária', 'Extremidade Uterina', 'Margem Livre do Ovário'],
    classe: 'glandula',
    resumo: 'Polos e borda do ovário, cada um com sua fixação e sua relação vascular.',
    localizacao:
      'A extremidade tubária, superior, recebe o ligamento suspensor e a fímbria ovárica; a uterina, inferior, o ligamento útero-ovárico; a margem livre é posterior, e a mesovárica, anterior.',
    funcao: 'A margem mesovárica é o hilo do ovário, por onde entram os vasos; a margem livre é onde a ovulação ocorre.',
    relacoes: 'A fímbria ovárica, mais longa das fímbrias, prende-se à extremidade tubária.',
    clinica:
      'Que os vasos entrem por uma margem e o oócito saia pela outra tem consequência prática: na cistectomia ovariana, a dissecção pela margem livre preserva o hilo e a reserva folicular. E a fímbria ovárica, ao aproximar a tuba do ovário, é o que torna possível a captação do oócito — sua aderência por doença inflamatória pélvica é uma das causas de infertilidade tubária.',
    memoria:
      'Vasos entram na frente, óvulo sai atrás. Duas margens, duas funções opostas.',
    pontos: [
      'Que estruturas se fixam em cada extremidade do ovário?',
      'Onde fica o hilo do ovário?',
      'Qual o papel da fímbria ovárica?',
    ],
  },
  {
    termos: ['Infundíbulo', 'Fímbrias', 'Óstio Abdominal'],
    classe: 'viscera',
    resumo: 'Extremidade em funil da tuba uterina, franjada por fímbrias e aberta na cavidade peritoneal.',
    localizacao: 'Extremidade lateral da tuba, próxima ao ovário, com o óstio abdominal no seu centro.',
    funcao:
      'As fímbrias varrem a superfície do ovário no momento da ovulação e captam o oócito. O óstio abdominal é o ponto em que a cavidade peritoneal se comunica com o exterior — via tuba, útero e vagina.',
    relacoes: 'A fímbria ovárica é a mais longa e se fixa ao ovário.',
    clinica:
      'Essa comunicação é única no corpo humano e explica a peritonite pélvica de origem ascendente: gonococo e clamídia sobem da vagina e alcançam o peritônio, produzindo a síndrome de Fitz-Hugh-Curtis, com peri-hepatite e aderências em corda de violino. É também por essa via que a endometriose se dissemina por menstruação retrógrada, e é nas fímbrias que hoje se reconhece a origem da maioria dos carcinomas serosos "de ovário" — o que motivou a salpingectomia oportunista como estratégia preventiva.',
    memoria:
      'A cavidade peritoneal da mulher tem uma porta para fora. É por ela que a infecção sobe e o câncer de tuba se disfarça de ovário.',
    pontos: [
      'Qual a função das fímbrias?',
      'O que é a síndrome de Fitz-Hugh-Curtis?',
      'Por que se propõe a salpingectomia oportunista?',
    ],
  },
  {
    termos: ['Ampola'],
    classe: 'viscera',
    resumo: 'Porção mais longa e mais larga da tuba uterina, onde ocorre a fecundação.',
    localizacao: 'Entre o infundíbulo e o istmo, ocupando cerca de dois terços do comprimento tubário.',
    funcao:
      'Sua mucosa tem pregas altas e ramificadas e epitélio ciliado abundante, que criam o ambiente e o transporte necessários ao encontro dos gametas. É aqui que a fecundação normalmente acontece.',
    relacoes: 'Sua parede muscular é mais fina que a do istmo.',
    clinica:
      'É o sítio de cerca de 70% das gravidezes ectópicas — e a parede fina explica a rotura com hemoperitônio, que é a principal causa de morte materna no primeiro trimestre. A tríade de atraso menstrual, dor pélvica e sangramento em mulher em idade fértil obriga a dosar beta-HCG antes de qualquer outra hipótese.',
    memoria:
      'A fecundação acontece na ampola — e é por isso que a maioria das ectópicas também. O embrião fica onde foi feito.',
    pontos: [
      'Onde ocorre normalmente a fecundação?',
      'Por que a ampola é o sítio mais comum de gravidez ectópica?',
      'Que tríade sugere gravidez ectópica?',
    ],
  },
  {
    termos: ['Istmo da Tuba Uterina'],
    classe: 'viscera',
    resumo: 'Porção estreita e de parede espessa da tuba, próxima ao útero.',
    localizacao: 'Entre a ampola e a parte uterina (intramural) da tuba.',
    funcao: 'Sua musculatura espessa funciona como esfíncter funcional, retendo o embrião até que o endométrio esteja receptivo.',
    relacoes: 'É a porção de menor calibre da tuba, fora da parte intramural.',
    clinica:
      'É o segmento de eleição para a laqueadura tubária: a ligadura e secção do istmo é simples, tem baixa taxa de falha e preserva a maior parte da tuba, o que facilita a reversão. Sua obstrução por salpingite ístmica nodosa é causa reconhecida de infertilidade e de gravidez ectópica.',
    memoria:
      'O istmo é o segmento estreito e forte perto do útero. É lá que se corta a trompa.',
    pontos: [
      'Que característica a parede do istmo tem?',
      'Que função ela desempenha?',
      'Por que o istmo é escolhido na laqueadura?',
    ],
  },
  /* ─────────────────── Útero ─────────────────── */
  {
    termos: ['Fundo do Útero'],
    classe: 'viscera',
    resumo: 'Porção superior arredondada do útero, acima da linha que une os óstios tubários.',
    localizacao: 'Parte mais alta do corpo uterino, entre os dois cornos.',
    funcao: 'É a região de maior massa muscular e onde o embrião mais frequentemente se implanta.',
    relacoes: 'Coberto por peritônio, em contato com alças intestinais.',
    clinica:
      'A altura do fundo uterino medida da sínfise púbica é o parâmetro mais simples de acompanhamento do crescimento fetal: entre a 20ª e a 34ª semana, a medida em centímetros corresponde aproximadamente à idade gestacional em semanas. E a manobra de Kristeller sobre o fundo é hoje contraindicada, pelo risco de rotura uterina e de descolamento — o conhecimento anatômico revertendo uma prática consagrada.',
    memoria:
      'Da 20ª à 34ª semana, altura uterina em centímetros é igual à idade gestacional em semanas. Uma fita métrica vale por um ultrassom.',
    pontos: [
      'Que limites definem o fundo do útero?',
      'Como se mede a altura uterina e o que ela indica?',
      'Por que a manobra de Kristeller é contraindicada?',
    ],
  },
  {
    termos: ['Corpo do Útero', 'Cavidade do Útero'],
    classe: 'viscera',
    resumo: 'Porção principal do útero, com uma cavidade triangular e virtual entre as paredes anterior e posterior.',
    localizacao: 'Entre o fundo e o istmo; normalmente em anteversoflexão sobre a bexiga.',
    funcao: 'A cavidade uterina é virtual — as paredes se tocam —, com apenas cerca de 6 cm de comprimento e capacidade de 5 mL fora da gravidez, expandindo-se até 5 litros no termo.',
    relacoes: 'A anteversão é a angulação entre o colo e a vagina; a anteflexão, entre o corpo e o colo.',
    clinica:
      'A anteversoflexão é o que determina a direção de introdução de qualquer instrumento uterino, e é sua desconsideração que causa a perfuração uterina na curetagem e na inserção de DIU — motivo pelo qual se histerometriza antes. Em um útero retrovertido, a direção é oposta, e não reconhecer isso multiplica o risco. A capacidade de expansão de mil vezes é uma das mais notáveis de qualquer órgão.',
    memoria:
      'Antes de entrar no útero, saiba para que lado ele aponta. Perfuração quase sempre é instrumento indo na direção errada.',
    pontos: [
      'Qual a diferença entre anteversão e anteflexão?',
      'Que capacidade a cavidade uterina atinge na gravidez?',
      'Por que a versão uterina importa nos procedimentos?',
    ],
  },
  {
    termos: ['Istmo do Útero'],
    classe: 'viscera',
    resumo: 'Segmento estreito de cerca de 1 cm entre o corpo e o colo do útero.',
    localizacao: 'Entre o corpo e o colo, correspondendo internamente ao óstio interno anatômico.',
    funcao: 'Fora da gravidez é apenas uma transição; na gestação, distende-se e forma o segmento inferior do útero.',
    relacoes: 'O peritônio é frouxamente aderido nessa altura, formando a prega vesicouterina.',
    clinica:
      'Essa frouxidão peritoneal é o que torna o segmento inferior o local da histerotomia na cesariana: abre-se o peritônio, rebaixa-se a bexiga e incisa-se um segmento fino, pouco contrátil e de melhor cicatrização — a incisão de Kerr, que reduziu drasticamente a rotura uterina em gestações subsequentes em comparação com a incisão corporal clássica. A insuficiência istmocervical, por sua vez, causa perdas gestacionais do segundo trimestre.',
    memoria:
      'A cesariana é feita no segmento inferior porque ali a parede é fina, o peritônio descola e a cicatriz aguenta a próxima gravidez.',
    pontos: [
      'O que o istmo se torna na gestação?',
      'Por que a cesariana é feita no segmento inferior?',
      'O que é insuficiência istmocervical?',
    ],
  },
  {
    termos: ['Colo do Útero', 'Colo Uterino', 'Óstio Uterino'],
    classe: 'viscera',
    resumo: 'Porção inferior e cilíndrica do útero, que se projeta na vagina, com o óstio externo no seu centro.',
    localizacao: 'Entre o istmo e a vagina, com porção supravaginal e porção vaginal (ectocérvice); o canal cervical liga o óstio interno ao externo.',
    funcao:
      'O canal é revestido por epitélio colunar e a ectocérvice por escamoso; a fronteira entre eles é a junção escamocolunar, que se desloca ao longo da vida e cria a zona de transformação por metaplasia.',
    vascularizacao: 'Ramos cervicovaginais da artéria uterina.',
    clinica:
      'A zona de transformação é onde nascem praticamente todas as neoplasias cervicais, e é por isso que a coleta citológica precisa incluí-la — uma amostra sem células endocervicais é uma amostra inadequada. É também o alvo da colposcopia e da conização. O muco cervical, que se torna filante e cristaliza em folha de samambaia no período periovulatório, é um marcador clínico de estrogênio.',
    memoria:
      'Todo câncer de colo nasce na zona de transformação. Coleta que não pega ela é coleta que não serviu.',
    pontos: [
      'O que é a zona de transformação e por que ela importa?',
      'Que epitélios revestem o canal e a ectocérvice?',
      'Por que a amostra citológica precisa de células endocervicais?',
    ],
  },
  {
    termos: ['Endométrio'],
    classe: 'viscera',
    resumo: 'Mucosa que reveste a cavidade uterina, com camada funcional descamável e camada basal permanente.',
    localizacao: 'Camada mais interna da parede uterina, sobre o miométrio.',
    funcao:
      'A camada funcional prolifera sob estrogênio, secreta sob progesterona e descama na menstruação; a camada basal, irrigada pelas artérias retas, é preservada e regenera o endométrio a cada ciclo.',
    vascularizacao: 'Artérias espiraladas para a camada funcional — sensíveis a hormônios — e artérias retas para a basal.',
    clinica:
      'Essa divisão vascular é a menstruação explicada: a queda da progesterona contrai as artérias espiraladas, isquemia a camada funcional e a faz descamar, enquanto as artérias retas mantêm a basal viva. A destruição da camada basal por curetagem agressiva ou infecção produz sinéquias intrauterinas — a síndrome de Asherman, com amenorreia e infertilidade, em que o endométrio simplesmente não tem mais de onde se regenerar.',
    memoria:
      'Artéria espiralada responde a hormônio e mata a camada de cima; artéria reta não responde e salva a de baixo. Menstruação é isquemia programada.',
    pontos: [
      'Que camadas compõem o endométrio?',
      'Como a vascularização explica a menstruação?',
      'O que é a síndrome de Asherman?',
    ],
  },
  {
    termos: ['Miométrio'],
    classe: 'viscera',
    resumo: 'Camada muscular espessa do útero, com fibras entrelaçadas em três planos.',
    localizacao: 'Entre o endométrio e o perimétrio; sua camada média é a mais espessa e a mais vascularizada.',
    funcao:
      'A disposição entrelaçada das fibras da camada média forma as "ligaduras vivas de Pinard": ao se contrair após o parto, o músculo comprime os vasos que o atravessam e estanca o sangramento do sítio placentário.',
    vascularizacao: 'Artérias arqueadas na camada média, das quais partem as radiais para o endométrio.',
    clinica:
      'É a razão de a atonia uterina ser a principal causa de hemorragia pós-parto: sem contração, não há ligadura viva, e o sangramento do leito placentário é arterial e maciço. Toda a conduta — massagem, ocitocina, misoprostol, balão, sutura de B-Lynch — visa restaurar essa contração. Os leiomiomas, tumores benignos dessa camada, são as neoplasias mais comuns da mulher.',
    memoria:
      'O útero não fecha os vasos com pinça: ele os aperta com o próprio músculo. Útero mole é útero que sangra.',
    pontos: [
      'O que são as ligaduras vivas de Pinard?',
      'Por que a atonia uterina causa hemorragia?',
      'Que tumor benigno nasce no miométrio?',
    ],
  },
  {
    termos: ['Perimétrio'],
    classe: 'serosa',
    resumo: 'Revestimento peritoneal do útero, aderido ao fundo e ao corpo e frouxo sobre o istmo.',
    localizacao: 'Cobre o fundo, o corpo e a face posterior até a porção supravaginal do colo, refletindo-se para a bexiga à frente e para o reto atrás.',
    funcao: 'Delimita as escavações vesicouterina e retouterina e continua-se lateralmente com o ligamento largo.',
    relacoes: 'É frouxamente aderido na região do istmo — a prega vesicouterina —, o que permite descolar a bexiga.',
    clinica:
      'Esse plano de clivagem é o que torna a cesariana segmentar possível e é o mesmo plano dissecado na histerectomia. Sua obliteração por cesarianas prévias, endometriose ou infecção transforma uma cirurgia de rotina em procedimento de risco, com lesão vesical — e é por isso que o número de cesarianas anteriores muda o planejamento cirúrgico.',
    memoria:
      'Sobre o corpo do útero o peritônio está colado; sobre o istmo, solto. É no solto que o cirurgião entra.',
    pontos: [
      'Onde o perimétrio é frouxo e por que isso importa?',
      'Que escavações ele delimita?',
      'O que a obliteração desse plano acarreta?',
    ],
  },
  {
    termos: ['Escavação Vesicouterina'],
    classe: 'serosa',
    resumo: 'Recesso peritoneal raso entre a bexiga e a face anterior do útero.',
    localizacao: 'Entre a face posterossuperior da bexiga e a face anterior do útero, ao nível do istmo.',
    funcao: 'É a mais rasa das escavações pélvicas femininas e permanece vazia na maior parte do tempo.',
    relacoes: 'Corresponde à prega vesicouterina, aberta na cesariana e na histerectomia.',
    clinica:
      'Ser rasa é o que a torna pouco relevante como local de coleção — ao contrário da escavação retouterina. Sua importância é cirúrgica: é a porta de entrada para descolar a bexiga do segmento inferior. Uma bexiga alta e aderida, por cesarianas prévias, é fator de risco para lesão vesical e sinal indireto de acretismo placentário.',
    memoria:
      'A escavação da frente é rasa e cirúrgica; a de trás é funda e clínica. Uma serve ao bisturi, a outra à agulha.',
    pontos: [
      'Que estruturas delimitam a escavação vesicouterina?',
      'Por que ela é rasa?',
      'Qual sua importância cirúrgica?',
    ],
  },
  {
    termos: ['Escavação Retouterina'],
    classe: 'serosa',
    resumo: 'Fundo de saco de Douglas: o ponto mais baixo da cavidade peritoneal na mulher.',
    localizacao: 'Entre a face posterior do útero e o fundo da vagina, à frente, e o reto, atrás.',
    funcao: 'Por ser o ponto mais declive da cavidade peritoneal, recebe qualquer líquido livre em posição ortostática ou sentada.',
    relacoes: 'Separado da vagina apenas pela parede vaginal posterior e por uma fina camada de tecido.',
    clinica:
      'Essa combinação — ponto mais baixo e separado da vagina por milímetros — fez da culdocentese o exame clássico para diagnosticar hemoperitônio na gravidez ectópica rota antes da era do ultrassom, e faz do fundo de saco a janela para drenagem de abscessos pélvicos. É também onde a endometriose profunda mais se instala, produzindo dispareunia profunda e nodularidade palpável ao toque.',
    memoria:
      'Tudo que é líquido na pelve da mulher escorre para o Douglas. E o Douglas está a um centímetro da vagina.',
    pontos: [
      'Por que a escavação retouterina é o ponto mais baixo do peritônio?',
      'Que procedimentos usam essa proximidade com a vagina?',
      'Onde a endometriose profunda se instala preferencialmente?',
    ],
  },
  {
    termos: ['Vagina', 'Canal Vaginal'],
    classe: 'viscera',
    resumo: 'Canal fibromuscular de cerca de 8 cm que liga o colo do útero ao vestíbulo.',
    localizacao: 'Entre a bexiga e a uretra, à frente, e o reto, atrás; suas paredes anterior e posterior se tocam em H no corte transversal.',
    funcao:
      'Sem glândulas próprias, é lubrificada pelo transudato da parede e pelo muco cervical; seu epitélio escamoso estratificado não queratinizado é rico em glicogênio, que os lactobacilos convertem em ácido láctico, mantendo o pH abaixo de 4,5.',
    vascularizacao: 'Artérias vaginais, uterinas, retais médias e pudendas internas.',
    inervacao: 'O terço inferior pelo nervo pudendo, sensível; os dois terços superiores por fibras autonômicas, pouco sensíveis à dor.',
    clinica:
      'Essa diferença de inervação explica por que procedimentos no colo e no fundo vaginal são bem tolerados com pouca anestesia, enquanto o terço inferior exige bloqueio. E o pH ácido é a principal defesa contra infecções: sua elevação — na menopausa, com uso de duchas ou após antibióticos — é o que permite a vaginose bacteriana, cujo diagnóstico inclui justamente a medida do pH.',
    memoria:
      'Terço de baixo dói (pudendo); dois terços de cima não (autonômico). E o pH ácido é o porteiro da vagina.',
    pontos: [
      'Como a vagina é lubrificada, se não tem glândulas?',
      'Por que o pH vaginal é ácido e o que o mantém assim?',
      'Como a inervação difere entre os terços da vagina?',
    ],
  },
  /* ─────────────────── Vulva ─────────────────── */
  {
    termos: ['Monte Púbico'],
    classe: 'viscera',
    resumo: 'Elevação de tecido adiposo sobre a sínfise púbica, coberta de pelos após a puberdade.',
    localizacao: 'À frente da sínfise púbica, continuando-se abaixo com os lábios maiores.',
    funcao: 'Amortece a sínfise púbica e é uma das áreas de distribuição pilosa dependente de androgênios.',
    inervacao: 'Nervos ilioinguinal e ramo genital do genitofemoral (L1).',
    clinica:
      'O padrão de pelos pubianos é um marcador clínico: triangular com borda superior horizontal na mulher, losangular com extensão até o umbigo no homem — e a masculinização desse padrão, no hirsutismo, é um dos sinais da síndrome dos ovários policísticos e de hiperandrogenismo. O desenvolvimento dos pelos pubianos define os estágios de Tanner da puberdade.',
    memoria:
      'Pelo pubiano feminino tem borda reta em cima; masculino sobe em losango até o umbigo. Padrão que muda é padrão hormonal.',
    pontos: [
      'Qual a diferença no padrão de pelos entre os sexos?',
      'Que nervos inervam o monte púbico?',
      'Que estadiamento usa o desenvolvimento piloso?',
    ],
  },
  {
    termos: ['Lábios Maiores', 'Lábio Maior', 'Lábio  Maior'],
    classe: 'viscera',
    resumo: 'Duas pregas cutâneas com gordura e pelos que delimitam lateralmente a rima do pudendo.',
    localizacao: 'Do monte púbico ao períneo, homólogas ao escroto masculino.',
    funcao: 'Protegem as estruturas do vestíbulo; contêm a terminação do ligamento redondo do útero e, ocasionalmente, o processo vaginal (canal de Nuck).',
    inervacao: 'Face anterior pelo ilioinguinal (L1); posterior pelos ramos labiais posteriores do pudendo (S3).',
    clinica:
      'A persistência do processo vaginal na mulher produz o cisto do canal de Nuck e permite a hérnia inguinal com conteúdo no lábio maior — o equivalente feminino da hérnia escrotal. E o carcinoma de vulva, mais frequente nos lábios maiores, drena para os linfonodos inguinais superficiais, e não para os pélvicos, o que define a linfadenectomia inguinofemoral como parte do tratamento.',
    memoria:
      'Lábio maior é o escroto que não fechou. Por isso hérnia inguinal na mulher aparece ali.',
    pontos: [
      'A que estrutura masculina os lábios maiores são homólogos?',
      'Que estrutura embrionária pode persistir neles?',
      'Para onde drena a linfa da vulva?',
    ],
  },
  {
    termos: ['Lábios Menores', 'Lábio Menor'],
    classe: 'viscera',
    resumo: 'Pregas cutâneas finas, sem pelos e sem gordura, que delimitam o vestíbulo da vagina.',
    localizacao: 'Mediais aos lábios maiores; unem-se anteriormente formando o prepúcio e o frênulo do clitóris.',
    funcao: 'São ricamente vascularizadas e inervadas, com glândulas sebáceas mas sem folículos pilosos; homólogas à pele da uretra esponjosa masculina.',
    inervacao: 'Nervo pudendo e ramos labiais posteriores.',
    clinica:
      'Sua vascularização abundante faz as lacerações sangrarem muito no parto e no trauma. E é a fusão anterior deles que forma o prepúcio do clitóris, sede das aderências e do líquen escleroso — doença inflamatória crônica que apaga a arquitetura vulvar, causa dispareunia e aumenta o risco de carcinoma espinocelular, exigindo acompanhamento.',
    memoria:
      'Lábios menores não têm pelo nem gordura, mas têm sangue e nervo de sobra. Cortou, sangra; tocou, dói.',
    pontos: [
      'Que estruturas os lábios menores formam anteriormente?',
      'Por que suas lacerações sangram muito?',
      'Que doença apaga a arquitetura vulvar?',
    ],
  },
  {
    termos: ['Clitóris'],
    classe: 'viscera',
    resumo: 'Órgão erétil feminino, homólogo do pênis, formado por dois corpos cavernosos, ramos e glande.',
    localizacao: 'Sob a comissura anterior dos lábios menores; apenas a glande é visível, e o corpo e os ramos se estendem por vários centímetros no períneo.',
    funcao:
      'É exclusivamente sensorial e erétil — não é atravessado pela uretra. A glande do clitóris tem cerca de 8.000 terminações nervosas, a maior densidade do corpo humano.',
    vascularizacao: 'Artérias profunda e dorsal do clitóris, ramos da pudenda interna.',
    inervacao: 'Nervo dorsal do clitóris, ramo do pudendo (S2–S4).',
    clinica:
      'A extensão real do clitóris, muito maior que a porção visível, só foi bem descrita em imagens de ressonância a partir dos anos 1990 — um exemplo notável de como uma estrutura pode ser subdescrita por razões culturais e não anatômicas. Clinicamente, o nervo dorsal é preservado nas cirurgias de redução de clitoromegalia, e o bloqueio pudendo anestesia todo o território.',
    memoria:
      'O que se vê do clitóris é a ponta: o corpo e os ramos continuam por baixo, abraçando a vagina.',
    pontos: [
      'A que estrutura masculina o clitóris é homólogo?',
      'Por que ele não é atravessado pela uretra?',
      'Que nervo o inerva?',
    ],
  },
  {
    termos: ['Vestíbulo da Vagina', 'Óstio da Vagina', 'Rima do Pudendo'],
    classe: 'viscera',
    resumo: 'Espaço entre os lábios menores, onde se abrem a uretra, a vagina e os ductos das glândulas vestibulares.',
    localizacao: 'Entre os lábios menores; a rima do pudendo é a fenda entre os lábios maiores.',
    funcao:
      'Recebe o óstio externo da uretra, à frente, o óstio da vagina, atrás, e os ductos das glândulas vestibulares maiores (de Bartholin), nas posições de 4 e 8 horas.',
    inervacao: 'Nervo pudendo, com sensibilidade somática muito desenvolvida.',
    clinica:
      'A posição das glândulas de Bartholin — posterolateral ao óstio vaginal — é o que permite reconhecer o cisto e o abscesso à inspeção, e é ali que se faz a marsupialização. A vestibulodínia localizada, dor à pressão do vestíbulo sem lesão visível, é hoje reconhecida como causa comum de dispareunia de entrada, e seu mapeamento por pressão com cotonete é um exame puramente anatômico.',
    memoria:
      'Bartholin fica às 4 e às 8 horas do óstio vaginal. Cisto nessas posições tem nome antes mesmo do exame.',
    pontos: [
      'Que estruturas se abrem no vestíbulo da vagina?',
      'Onde se localizam as glândulas de Bartholin?',
      'O que é a vestibulodínia localizada?',
    ],
  },
  /* ─────────────────── Mama ─────────────────── */
  {
    termos: ['Tecido Mamário'],
    classe: 'glandula',
    resumo: 'Glândula sudorípara apócrina modificada, com 15 a 20 lobos drenados por ductos lactíferos independentes.',
    localizacao: 'Da 2ª à 6ª costela, entre o esterno e a linha axilar média, sobre a fáscia peitoral.',
    funcao:
      'Cada lobo é uma glândula independente, com seu ducto próprio abrindo-se na papila. Os ligamentos suspensores de Cooper, septos fibrosos entre a pele e a fáscia peitoral, sustentam a mama.',
    vascularizacao: 'Artéria torácica interna (60%), torácica lateral, torácica superior e perfurantes intercostais.',
    linfaticos: 'Cerca de 75% para os linfonodos axilares; o restante para os paraesternais, sobretudo dos quadrantes mediais.',
    clinica:
      'Os ligamentos de Cooper explicam dois sinais semiológicos clássicos: a retração cutânea, quando um tumor os traciona, e a pele em casca de laranja, quando o bloqueio linfático edemacia a pele ao redor de ligamentos que a mantêm presa. Já a independência dos lobos é o que faz a descarga papilar sanguinolenta ser de um único ducto — e o que orienta a ductografia e a exérese seletiva.',
    memoria:
      'Casca de laranja é pele inchada presa por cordas. As cordas são os ligamentos de Cooper.',
    pontos: [
      'Como o tecido mamário se organiza em lobos e ductos?',
      'O que são os ligamentos de Cooper?',
      'Que sinais semiológicos eles explicam?',
    ],
  },
  {
    termos: ['Papila Mamária', 'Aréola Mamária'],
    classe: 'glandula',
    resumo: 'Projeção central onde se abrem os ductos lactíferos e a área pigmentada que a circunda.',
    localizacao: 'Geralmente no 4º espaço intercostal na nulípara; a aréola contém os tubérculos de Montgomery.',
    funcao:
      'Os 15 a 20 ductos lactíferos abrem-se independentemente na papila. As glândulas areolares de Montgomery secretam um lubrificante que protege a pele durante a amamentação e emite odor que orienta o recém-nascido.',
    inervacao: 'Ramo cutâneo lateral do 4º nervo intercostal, principal responsável pela sensibilidade da papila.',
    clinica:
      'Preservar esse ramo é o objetivo das técnicas de mamoplastia com pedículo inferior — a perda da sensibilidade papilar é uma das queixas mais frequentes do pós-operatório. A doença de Paget da mama manifesta-se como eczema unilateral e persistente da papila, e qualquer lesão eczematosa papilar que não responde a tratamento tópico em duas semanas exige biópsia: é carcinoma intraductal até prova em contrário.',
    memoria:
      'Eczema em um mamilo só, que não sara: não é dermatite. É doença de Paget até a biópsia dizer o contrário.',
    pontos: [
      'Quantos ductos se abrem na papila mamária?',
      'Que nervo dá a sensibilidade papilar?',
      'O que é a doença de Paget da mama?',
    ],
  },
  {
    termos: ['Quadrante Superior Lateral', 'Processo Axilar da Mama'],
    classe: 'glandula',
    resumo: 'Quadrante superolateral da mama e seu prolongamento axilar — a cauda de Spence.',
    localizacao: 'Porção superior e externa da mama, com o processo axilar atravessando o forame de Langer na fáscia axilar.',
    funcao: 'Concentra a maior quantidade de tecido glandular de toda a mama.',
    linfaticos: 'Drena predominantemente para os linfonodos axilares.',
    clinica:
      'Concentrar mais tecido glandular é a razão de cerca de metade dos carcinomas de mama surgirem neste quadrante — informação que orienta tanto o autoexame quanto a leitura da mamografia. O processo axilar, por ser tecido mamário verdadeiro dentro da axila, pode desenvolver câncer e ser confundido com linfonodo aumentado, e ingurgita dolorosamente na amamentação.',
    memoria:
      'Metade dos tumores de mama nasce no quadrante de cima e de fora — porque é onde há mais glândula.',
    pontos: [
      'Por que o quadrante superolateral concentra mais tumores?',
      'O que é a cauda de Spence?',
      'Para onde drena a linfa desse quadrante?',
    ],
  },
  {
    termos: ['Quadrante Superior Medial', 'Quadrante Inferior Medial'],
    classe: 'glandula',
    resumo: 'Quadrantes internos da mama, com drenagem linfática predominantemente paraesternal.',
    localizacao: 'Metade medial da mama, entre a papila e o esterno.',
    funcao: 'Drenam, em boa parte, para os linfonodos paraesternais (da cadeia torácica interna), e não para a axila.',
    relacoes: 'A cadeia torácica interna acompanha os vasos torácicos internos, atrás das cartilagens costais.',
    clinica:
      'Essa drenagem alternativa é a razão de tumores mediais poderem ter axila negativa e metástase paraesternal — o que motivou, historicamente, a mastectomia radical estendida e, hoje, a atenção à drenagem extra-axilar na linfocintilografia do linfonodo sentinela. Um tumor medial com axila livre não significa doença localizada.',
    memoria:
      'Tumor do lado de dentro pode fugir da axila e ir para a cadeia mamária interna. Axila negativa não é sinônimo de tudo bem.',
    pontos: [
      'Para onde drenam preferencialmente os quadrantes mediais?',
      'Que implicação isso tem no estadiamento?',
      'Onde corre a cadeia torácica interna?',
    ],
  },
  {
    termos: ['Quadrante Inferior Lateral'],
    classe: 'glandula',
    resumo: 'Quadrante inferoexterno da mama, com menor densidade glandular.',
    localizacao: 'Porção inferior e externa da mama, acima do sulco inframamário.',
    funcao: 'Contém proporcionalmente mais tecido adiposo que glandular.',
    relacoes: 'Delimitado abaixo pelo sulco inframamário, estrutura ligamentar bem definida.',
    clinica:
      'O sulco inframamário é uma referência anatômica essencial em cirurgia plástica e oncológica: sua posição define o resultado estético da reconstrução e da mastopexia, e sua violação produz a deformidade em "dupla bolha" nos implantes. A divisão em quadrantes, por sua vez, é a linguagem padrão de localização de achados em mamografia e ultrassonografia.',
    memoria:
      'Quadrantes existem para todo mundo falar a mesma língua: quem examina, quem faz a imagem e quem opera.',
    pontos: [
      'Que composição predomina no quadrante inferolateral?',
      'Qual a importância do sulco inframamário?',
      'Por que a divisão em quadrantes é padronizada?',
    ],
  },
  {
    termos: ['Fáscia Peitoral', 'Pele'],
    classe: 'fascia',
    resumo: 'Fáscia que recobre o músculo peitoral maior e o espaço retromamário que a separa da mama.',
    localizacao: 'Sobre o peitoral maior; entre ela e a face profunda da mama existe o espaço retromamário, de tecido areolar frouxo.',
    funcao: 'O espaço retromamário permite que a mama deslize sobre a parede torácica — é o que dá mobilidade à glândula.',
    relacoes: 'A pele, por sua vez, é fixada à glândula pelos ligamentos de Cooper.',
    clinica:
      'A mobilidade da mama sobre a fáscia é um dado semiológico direto: um tumor que invade a fáscia ou o músculo fixa a mama à parede e reduz sua mobilidade à manobra de contração do peitoral — sinal de doença localmente avançada (T4a). É também no espaço retromamário que se posicionam os implantes na técnica subglandular, e é ele que se dissecа na mastectomia.',
    memoria:
      'Peça para a paciente empurrar a cintura com as mãos: se o nódulo prende, o tumor pegou o músculo.',
    pontos: [
      'O que é o espaço retromamário e qual sua função?',
      'Como se avalia clinicamente a fixação de um tumor?',
      'Que estruturas fixam a pele à glândula?',
    ],
  },
  {
    termos: ['Intestino Grosso'],
    classe: 'viscera',
    sistemas: ['genital-feminino'],
    resumo: 'Alças do colo e do reto que ocupam a pelve atrás do útero e dos anexos.',
    localizacao: 'O colo sigmoide desce à esquerda da pelve e continua no reto, atrás do útero e da escavação retouterina.',
    funcao: 'Nesta prancha, aparece como referência de vizinhança dos órgãos genitais internos.',
    relacoes: 'O sigmoide costuma aderir ao anexo esquerdo; o reto está separado do útero pela escavação retouterina.',
    clinica:
      'Essa vizinhança é a razão de a endometriose profunda acometer preferencialmente o sigmoide e o septo retovaginal, com dor à evacuação durante a menstruação e, em casos avançados, sangramento retal cíclico. E é por ela que a doença inflamatória pélvica e a diverticulite se confundem no diagnóstico diferencial da dor em fossa ilíaca esquerda da mulher.',
    memoria:
      'Dor para evacuar que só aparece na menstruação não é intestino: é endometriose colada no reto.',
    pontos: [
      'Que porções do intestino grosso ocupam a pelve feminina?',
      'Onde a endometriose profunda se instala?',
      'Que diagnósticos se confundem na fossa ilíaca esquerda?',
    ],
  },
]

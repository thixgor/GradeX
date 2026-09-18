import type { Ferramenta, Nivel, Resultado } from '../tipos'
import {
  campoIdade,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtPct,
  num,
  numOu,
  opc,
  pts,
  sim,
  somaSimNao,
} from '../helpers'

const reticulocitos: Ferramenta = {
  id: 'reticulocitos-corrigidos',
  nome: 'Reticulócitos corrigidos e índice de produção reticulocitária',
  sinonimos: ['reticulocitos', 'ipr', 'indice reticulocitario', 'resposta medular'],
  resumo: 'Diz se a medula está respondendo à anemia — o primeiro passo da investigação.',
  categorias: ['hematologia'],
  campos: [
    campoNum('retic', 'Reticulócitos', { unidade: '%', min: 0, max: 40, passo: 0.1, normalMin: 0.5, normalMax: 2, ajuda: 'O percentual do laudo, não o absoluto. Este número sozinho engana na anemia: ele é uma fração de um denominador que encolheu.' }),
    campoNum('ht', 'Hematócrito', { unidade: '%', min: 5, max: 65, passo: 0.1, ajuda: 'Do mesmo hemograma que forneceu os reticulócitos. Usar hematócrito de outra data invalida as duas correções.' }),
    campoNum('htNormal', 'Hematócrito de referência', { unidade: '%', min: 35, max: 50, passo: 0.5, padrao: '45', ajuda: '45% em homens, 40% em mulheres.' }),
    campoNum('reticAbs', 'Reticulócitos absolutos', { unidade: '×10⁹/L', min: 0, max: 800, passo: 1, opcional: true, ajuda: 'Se o laboratório já informa o valor absoluto, ele dispensa a correção pelo hematócrito.' }),
  ],
  calcular: (v) => {
    const retic = num(v, 'retic')
    const ht = num(v, 'ht')
    const htN = numOu(v, 'htNormal', 45)
    const abs = num(v, 'reticAbs')
    if (retic === null || ht === null || htN <= 0) return null
    const corrigido = retic * (ht / htN)
    const fatorMaturacao = ht >= 35 ? 1 : ht >= 25 ? 1.5 : ht >= 20 ? 2 : 2.5
    const ipr = corrigido / fatorMaturacao
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Reticulócitos corrigidos', valor: fmtPct(corrigido, 2), nota: 'Corrige o percentual pelo grau de anemia — sem isso, a anemia infla o percentual apenas por reduzir o denominador.' },
      { rotulo: 'Fator de maturação', valor: fmt(fatorMaturacao, 1), nota: `Para hematócrito de ${fmt(ht, 1)}%. Na anemia, reticulócitos são liberados precocemente e permanecem mais tempo no sangue, o que superestima a produção.` },
      { rotulo: 'Índice de produção reticulocitária', valor: fmt(ipr, 2), nota: 'IPR ≥ 2 a 3 indica resposta medular adequada (anemia hemolítica ou hemorrágica). IPR < 2 indica resposta inadequada (anemia hipoproliferativa).', nivel: ipr >= 2 ? 'ok' : 'alerta' },
    ]
    if (abs !== null) detalhes.push({ rotulo: 'Reticulócitos absolutos', valor: `${fmtInt(abs)} ×10⁹/L`, nota: 'Referência 25 a 100 ×10⁹/L. Acima de 100 indica resposta medular vigorosa; é a medida mais confiável e dispensa correções.', nivel: abs > 100 ? 'ok' : abs < 25 ? 'alerta' : 'neutro' })
    const nivel: Nivel = ipr >= 2 ? 'ok' : 'alerta'
    return {
      titulo: 'Índice de produção reticulocitária',
      valor: fmt(ipr, 2),
      nivel,
      rotuloNivel: ipr >= 2 ? 'Resposta medular adequada' : 'Resposta medular inadequada',
      detalhes,
      interpretacao: [
        'Esta é a **primeira bifurcação** da investigação de qualquer anemia, e vem antes até do volume corpuscular médio: a medula está respondendo ou não?',
        ipr >= 2
          ? '**Resposta adequada (IPR ≥ 2 a 3):** a medula está produzindo. A anemia decorre de perda ou destruição — hemorragia aguda ou hemólise. Investigue com desidrogenase láctica, bilirrubina indireta, haptoglobina, esfregaço de sangue periférico (esquizócitos, esferócitos) e teste de Coombs direto.'
          : '**Resposta inadequada (IPR < 2):** a medula não está produzindo o suficiente. Investigue por volume corpuscular médio — microcítica (ferropenia, talassemia, doença crônica, sideroblástica), normocítica (doença crônica, renal, endócrina, aplasia, infiltração medular) ou macrocítica (deficiência de B12 ou folato, síndrome mielodisplásica, álcool, hipotireoidismo, medicamentos).',
        'A dupla correção existe porque o percentual de reticulócitos tem dois vieses na anemia: o denominador (hemácias totais) está reduzido, e a hipóxia estimula a eritropoetina a liberar reticulócitos imaturos, que sobrevivem mais tempo na circulação. A primeira correção resolve o denominador; o fator de maturação resolve o tempo de permanência.',
        'Vale detalhar o segundo viés, porque é o menos intuitivo e o que mais infla resultados. O eritroblasto normalmente expulsa o núcleo e permanece cerca de **três dias maturando dentro da medula** antes de sair, passando apenas o último dia como reticulócito circulante. Na anemia, a eritropoetina — produzida pelas células intersticiais peritubulares renais em resposta à hipóxia, por estabilização do fator induzível por hipóxia HIF-2α — encurta esse tempo de residência medular e antecipa a liberação. O reticulócito sai mais imaturo, com mais RNA residual, e agora permanece dois, três ou até quatro dias no sangue em vez de um. Como a contagem é uma fotografia de quantos estão circulando, e não de quantos foram produzidos por dia, dobrar o tempo de permanência dobra a contagem sem que a medula tenha produzido uma única célula a mais. O fator de maturação (1,0 a 2,5, crescendo conforme a anemia piora) desfaz exatamente essa ilusão. É por isso que os analisadores modernos preferem informar a **fração de reticulócitos imaturos** (IRF): quanto mais imaturos na circulação, maior o estímulo eritropoetínico, e esse é o indicador mais precoce de resposta medular — sobe antes do próprio IPR.',
      ],
      conduta: ipr >= 2
        ? [
            'Confirme e caracterize a hemólise: desidrogenase láctica e bilirrubina indireta elevadas com haptoglobina baixa formam o tripé laboratorial. A haptoglobina é o marcador mais específico — ela se consome ligando hemoglobina livre e cai precocemente na hemólise intravascular.',
            'Peça **esfregaço de sangue periférico** e leia-o você mesmo ou com o hematologista. Ele frequentemente entrega o diagnóstico: esquizócitos apontam microangiopatia (PTT, SHU, CIVD, hipertensão maligna, valva mecânica), esferócitos indicam esferocitose hereditária ou hemólise autoimune, células em alvo e corpúsculos de Heinz sugerem deficiência de G6PD, e hemácias falciformes dispensam apresentação.',
            'Teste de Coombs direto para separar hemólise autoimune de não imune. Se positivo, investigue a causa: linfoproliferativa, doença autoimune, medicamento, infecção. Se negativo com esquizócitos, **é emergência** — considere PTT e calcule o PLASMIC, porque plasmaférese precoce muda a mortalidade.',
            'Se não houver hemólise, procure sangramento: toque retal com pesquisa de sangue oculto, investigação endoscópica, e lembre que hemorragia interna (retroperitônio, coxa, cavidade abdominal) pode não ser óbvia. Reticulocitose com ferritina baixa é hemorragia crônica já em resposta.',
          ]
        : [
            'Prossiga pelo **volume corpuscular médio**, que é a segunda bifurcação. Microcítico (VCM < 80): dose ferritina, saturação de transferrina e receptor solúvel de transferrina; se o ferro estiver normal, pense em talassemia (aplique o índice de Mentzer) e em anemia de doença crônica. Normocítico: função renal, TSH, proteína C reativa, e considere doença crônica ou infiltração medular. Macrocítico (VCM > 100): B12, folato, TSH, história de álcool e revisão de medicamentos.',
            'Verifique se há **outras linhagens acometidas**. Anemia isolada tem cardápio diferente de bicitopenia ou pancitopenia — nesta última, aplasia, mielodisplasia, leucemia, infiltração neoplásica, deficiência grave de B12 e infecção (HIV, parvovírus B19, leishmaniose visceral) entram na lista, e a indicação de mielograma com biópsia de medula fica muito mais forte.',
            'Repita a contagem 5 a 7 dias após iniciar reposição de ferro, B12 ou folato: a **crise reticulocitária** é a confirmação diagnóstica mais elegante e mais barata que existe. Se o IPR não subir nesse prazo, o diagnóstico ou a adesão estão errados.',
            'Não transfunda por número. Reserve a transfusão para instabilidade hemodinâmica, isquemia sintomática ou hemoglobina abaixo do gatilho institucional (habitualmente 7 g/dL, ou 8 em cardiopata) — e nunca antes de colher os exames que o diagnóstico exige, porque a transfusão apaga as pistas por semanas.',
          ],
      alertas: [
        'Reticulocitose leva 3 a 5 dias para se estabelecer. Contagem baixa nas primeiras 48 horas de uma hemorragia aguda ou de uma hemólise recém-iniciada **não** significa medula incompetente — repita antes de concluir.',
        'IPR alto com esquizócitos no esfregaço e plaquetopenia é emergência hematológica, não achado a investigar ambulatorialmente: púrpura trombocitopênica trombótica tem mortalidade acima de 90% sem plasmaférese e cerca de 10% com ela.',
        'Se o laboratório informa reticulócitos absolutos, use esse valor e ignore as correções — elas existem apenas para contornar as limitações do percentual.',
      ],
      tabela: {
        titulo: 'Fator de maturação por hematócrito',
        colunas: ['Hematócrito', 'Fator', 'Por quê'],
        linhas: [
          ['≥ 35%', '1,0', 'Permanência circulante normal, cerca de 1 dia'],
          ['25 – 34%', '1,5', 'Liberação antecipada, permanência ~1,5 dia'],
          ['20 – 24%', '2,0', 'Estímulo eritropoetínico intenso, ~2 dias'],
          ['< 20%', '2,5', 'Reticulócitos de estresse, até 2,5 dias em circulação'],
        ],
        destaque: ht >= 35 ? 0 : ht >= 25 ? 1 : ht >= 20 ? 2 : 3,
      },
    }
  },
  formula: [
    'Reticulócitos corrigidos = % reticulócitos × (hematócrito / hematócrito normal)',
    'IPR = reticulócitos corrigidos / fator de maturação',
    'Fator: Ht ≥ 35 → 1,0 | 25–34 → 1,5 | 20–24 → 2,0 | < 20 → 2,5',
  ],
  fundamento:
    'O reticulócito é a hemácia recém-liberada, ainda com RNA ribossômico residual, e permanece cerca de 1 dia na circulação em condições normais. Contá-los mede diretamente a taxa de produção eritroide dos últimos dias — é o equivalente hematológico de olhar para a linha de produção em vez do estoque. Essa distinção entre fluxo e estoque é o conceito central: a hemoglobina e o hematócrito são estoque, e um estoque baixo não diz se o problema está na produção, na perda ou na destruição. O reticulócito é fluxo, e responde justamente a essa pergunta. Hillman e Finch formalizaram o índice em 1967 ao perceber que o percentual bruto de reticulócitos era sistematicamente enganoso na anemia, por dois motivos somados. Primeiro, é uma razão cujo denominador encolheu: 2% de reticulócitos num hematócrito de 15% representa metade das células que 2% num hematócrito de 45%. Segundo, a eritropoetina elevada antecipa a saída do reticulócito da medula, prolongando sua permanência circulante de um para até dois e meio dias — e uma célula que fica o dobro do tempo é contada duas vezes nas fotografias sucessivas, inflando a estimativa de produção sem nenhuma produção extra. O IPR corrige os dois vieses em sequência e entrega uma estimativa de quantas vezes a produção basal a medula está entregando. O corte de 2 a 3 não é arbitrário: a medula normal tem capacidade de expandir a eritropoiese em seis a oito vezes quando o ferro, a B12, o folato e o estroma estão intactos, de modo que uma medula sadia diante de anemia estabelecida deveria estar produzindo pelo menos o dobro do basal. Não estar é, por si, uma anormalidade a explicar.',
  armadilhas: [
    'Se o laboratório informa o valor **absoluto**, use-o: ele já contorna os dois vieses e não precisa de correção.',
    'Reticulocitose leva 3 a 5 dias para aparecer após uma hemorragia aguda ou após o início do tratamento de uma carência. Contagem baixa nas primeiras 48 horas não exclui capacidade de resposta.',
    'Reticulócitos e hematócrito precisam ser do mesmo hemograma. Combinar um percentual de hoje com um hematócrito de ontem, ou com o hematócrito pós-transfusional, produz um IPR sem significado.',
    'Transfusão recente invalida a interpretação: as hemácias transfundidas elevam o hematócrito e diluem o percentual de reticulócitos, e além disso a correção da anemia desliga o estímulo eritropoetínico. Colha antes de transfundir.',
    'IPR normal ou alto não exclui deficiência de ferro ou de B12 parcialmente tratada — quem já iniciou reposição está em crise reticulocitária, e a contagem alta é a resposta ao tratamento, não ausência de carência.',
    'A contagem manual por microscopia tem imprecisão considerável em valores baixos, justamente a faixa em que a distinção entre 0,5% e 1,5% muda a conduta. Prefira contagem automatizada por citometria de fluxo quando houver.',
    'Na doença renal crônica o IPR será baixo por deficiência de eritropoetina, e isso é esperado, não achado novo a investigar. O mesmo vale para a medula em quimioterapia recente.',
  ],
  referencias: [
    { texto: 'Hillman RS, Finch CA. Erythropoiesis: normal and abnormal. Semin Hematol. 1967;4(4):327-336.' },
    { texto: 'Piva E, Brugnara C, Spolaore F, Plebani M. Clinical utility of reticulocyte parameters. Clin Lab Med. 2015;35(1):133-163.' },
  ],
}

const hemogramaAbs: Ferramenta = {
  id: 'valores-absolutos-hemograma',
  nome: 'Valores absolutos do hemograma e neutropenia',
  sinonimos: ['neutrofilos absolutos', 'linfocitos absolutos', 'neutropenia', 'ancc', 'relacao neutrofilo linfocito'],
  resumo: 'Converte os percentuais do leucograma em valores absolutos, que são os que importam.',
  categorias: ['hematologia', 'infectologia'],
  campos: [
    campoNum('leucocitos', 'Leucócitos totais', { unidade: '/mm³', min: 50, max: 500000, passo: 100, normalMin: 4000, normalMax: 11000, ajuda: 'Em /mm³ (equivale a /µL). Se o laudo vier em ×10⁹/L, multiplique por 1000 — 7,2 ×10⁹/L são 7.200/mm³.' }),
    campoNum('neutro', 'Neutrófilos segmentados', { unidade: '%', min: 0, max: 100, passo: 0.1, ajuda: 'Apenas os segmentados. Os bastonetes vão no campo seguinte e são somados automaticamente para o cálculo dos neutrófilos absolutos.' }),
    campoNum('bastoes', 'Bastonetes', { unidade: '%', min: 0, max: 60, passo: 0.1, padrao: '0', ajuda: 'Neutrófilos jovens, de núcleo não segmentado. Entram na contagem absoluta de neutrófilos porque são funcionalmente competentes — ao contrário de metamielócitos e mielócitos, que não contam.' }),
    campoNum('linfo', 'Linfócitos', { unidade: '%', min: 0, max: 100, passo: 0.1, ajuda: 'Inclui linfócitos típicos e atípicos. Linfocitose com atipia sugere infecção viral, sobretudo mononucleose.' }),
    campoNum('mono', 'Monócitos', { unidade: '%', min: 0, max: 60, passo: 0.1, opcional: true, ajuda: 'Opcional. Monocitose persistente é pista de leucemia mielomonocítica crônica, tuberculose e endocardite.' }),
    campoNum('eos', 'Eosinófilos', { unidade: '%', min: 0, max: 60, passo: 0.1, opcional: true, ajuda: 'Opcional. Lembre que corticoide em uso zera os eosinófilos e pode mascarar parasitose, reação a fármaco e vasculite.' }),
  ],
  calcular: (v) => {
    const leuco = num(v, 'leucocitos')
    const neutro = num(v, 'neutro')
    const bast = numOu(v, 'bastoes', 0)
    const linfo = num(v, 'linfo')
    const mono = num(v, 'mono')
    const eos = num(v, 'eos')
    if (leuco === null || neutro === null || linfo === null) return null
    const nAbs = (leuco * (neutro + bast)) / 100
    const lAbs = (leuco * linfo) / 100
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Neutrófilos absolutos', valor: `${fmtInt(nAbs)} /mm³`, nota: 'Referência 1.500 a 8.000/mm³. Inclui segmentados e bastonetes.', nivel: nAbs < 500 ? 'critico' : nAbs < 1000 ? 'alerta' : nAbs < 1500 ? 'atencao' : 'ok' },
      { rotulo: 'Linfócitos absolutos', valor: `${fmtInt(lAbs)} /mm³`, nota: 'Referência 1.000 a 4.000/mm³. Abaixo de 1.000 é linfopenia; abaixo de 500 associa-se a imunossupressão significativa.', nivel: lAbs < 500 ? 'alerta' : lAbs < 1000 ? 'atencao' : 'ok' },
      { rotulo: 'Relação neutrófilo/linfócito', valor: lAbs > 0 ? fmt(nAbs / lAbs, 2) : '—', nota: 'Referência 1 a 3. Acima de 6 a 9 associa-se a inflamação sistêmica, gravidade de infecção e pior prognóstico em várias doenças, inclusive oncológicas.', nivel: lAbs > 0 && nAbs / lAbs > 9 ? 'alerta' : 'neutro' },
      { rotulo: 'Relação bastonetes/neutrófilos totais', valor: neutro + bast > 0 ? fmt(bast / (neutro + bast), 3) : '—', nota: 'Acima de 0,2 é o "desvio à esquerda" com significado clínico, sugerindo infecção bacteriana.' },
    ]
    if (mono !== null) detalhes.push({ rotulo: 'Monócitos absolutos', valor: `${fmtInt((leuco * mono) / 100)} /mm³`, nota: 'Referência 200 a 1.000/mm³. Monocitose persistente acima de 1.000 com mais de 10% levanta suspeita de leucemia mielomonocítica crônica.' })
    if (eos !== null) {
      const eAbs = (leuco * eos) / 100
      detalhes.push({ rotulo: 'Eosinófilos absolutos', valor: `${fmtInt(eAbs)} /mm³`, nota: eAbs > 1500 ? 'Acima de 1.500/mm³: hipereosinofilia. Investigue parasitose, reação a fármaco, doença atópica grave, vasculite eosinofílica e neoplasia.' : 'Referência até 500/mm³.', nivel: eAbs > 1500 ? 'alerta' : 'neutro' })
    }
    const nivel: Nivel = nAbs < 500 ? 'critico' : nAbs < 1000 ? 'alerta' : nAbs < 1500 ? 'atencao' : 'ok'
    return {
      titulo: 'Neutrófilos absolutos',
      valor: fmtInt(nAbs),
      unidade: '/mm³',
      nivel,
      rotuloNivel: nAbs < 500 ? 'Neutropenia grave' : nAbs < 1000 ? 'Neutropenia moderada' : nAbs < 1500 ? 'Neutropenia leve' : 'Contagem normal',
      detalhes,
      interpretacao: [
        '**O percentual isolado não significa nada.** Um paciente com 20% de neutrófilos e 20.000 leucócitos tem 4.000 neutrófilos — contagem normal. Outro com 70% de neutrófilos e 900 leucócitos tem 630 — neutropenia grave. Só o valor absoluto orienta conduta.',
        nAbs < 500
          ? '**Neutropenia grave (< 500/mm³).** Febre nesse contexto é **emergência médica**: colha hemoculturas de dois sítios e inicie antibiótico de amplo espectro com cobertura antipseudomonas em até 1 hora (cefepima, piperacilina-tazobactam ou meropeném). Não espere exame algum. Estratifique com o escore MASCC para decidir tratamento ambulatorial em casos de baixo risco.'
          : nAbs < 1000
            ? 'Neutropenia moderada: risco infeccioso aumentado. Investigue causa medicamentosa (o mecanismo mais comum), infecciosa (viral), autoimune, carencial e medular.'
            : 'Contagem de neutrófilos adequada.',
        'A **neutropenia étnica benigna**, ligada a variantes do gene DARC/ACKR1, é comum em pessoas de ascendência africana e cursa com neutrófilos entre 1.000 e 1.500/mm³ sem qualquer risco infeccioso aumentado. Reconhecê-la evita investigações desnecessárias.',
        'A linfopenia é um marcador prognóstico subestimado: associa-se independentemente a mortalidade em sepse, em covid-19 e em várias neoplasias.',
        'A fisiologia dos compartimentos explica quase todas as armadilhas do neutrograma. O neutrófilo existe em quatro reservatórios: o **pool proliferativo** medular (mieloblasto a mielócito, cerca de 2 dias de divisões), o **pool de reserva** medular (metamielócitos, bastonetes e segmentados maduros já formados, com aproximadamente 10 a 15 vezes a quantidade circulante), o **pool circulante** e o **pool marginado** — neutrófilos aderidos ao endotélio de capilares pulmonares e esplâncnicos, que não aparecem no hemograma e representam metade ou mais do total intravascular. O hemograma mede apenas o pool circulante, e é por isso que ele muda em minutos por redistribuição sem que nenhuma célula tenha sido produzida ou destruída. Corticoide, adrenalina, exercício e estresse causam **desmarginação**: as células soltam do endotélio e migram para o compartimento circulante, dobrando a contagem sem melhorar em nada a capacidade de defesa. Infecção bacteriana, ao contrário, esvazia o pool de reserva — e como esse pool é liberado do mais maduro para o menos maduro, o aparecimento de bastonetes (o "desvio à esquerda") indica que a reserva está sendo consumida. Quando surgem metamielócitos e mielócitos, a reserva acabou e a medula está despejando o pool proliferativo: é o achado de maior gravidade do leucograma.',
      ],
      conduta: nAbs < 500
        ? [
            'Se houver febre (≥ 38,3 °C em uma medida ou ≥ 38,0 °C por uma hora), trate como **neutropenia febril**, que é emergência médica: hemoculturas de dois sítios — incluindo cada lúmen de cateter central — e antibiótico de amplo espectro com cobertura antipseudomonas na primeira hora. Cefepima, piperacilina-tazobactam ou meropeném em monoterapia. Não aguarde exame nenhum.',
            'Estratifique com o escore **MASCC** ou o **CISNE**: MASCC ≥ 21 identifica baixo risco e permite considerar tratamento oral ambulatorial com ciprofloxacino associado a amoxicilina-clavulanato, desde que haja suporte, adesão e retorno garantido.',
            'Acrescente vancomicina apenas com indicação definida: instabilidade hemodinâmica, suspeita de infecção de cateter, celulite, pneumonia, mucosite grave ou colonização conhecida por MRSA. Reavalie em 48 a 72 horas e descale conforme cultura — cobertura ampla indefinida seleciona resistência e favorece infecção fúngica.',
            'Isolamento protetor, higiene rigorosa das mãos e dieta com alimentos cozidos. Fator estimulador de colônias de granulócitos (G-CSF) não é rotina no tratamento da neutropenia febril já instalada; seu papel é a profilaxia primária em esquemas com risco de neutropenia febril acima de 20%.',
            'Suspenda ou substitua todo fármaco potencialmente causador se a neutropenia não for de quimioterapia: dipirona, metamizol, metimazol e propiltiouracila, sulfassalazina, clozapina, carbamazepina, ticlopidina e sulfas são os agentes classicamente implicados.',
          ]
        : nAbs < 1500
          ? [
              'Repita o hemograma em 1 a 2 semanas antes de investigar a fundo: neutropenia leve transitória após infecção viral é comum e se resolve sozinha. Neutropenia persistente ou progressiva é que merece investigação.',
              'Revise a lista de medicamentos item por item — agranulocitose induzida por fármaco é a causa mais comum de neutropenia isolada relevante no adulto, e a única em que a suspensão resolve. Inclua o que o paciente não considera medicamento: dipirona em automedicação, fitoterápicos e suplementos.',
              'Considere **neutropenia étnica benigna** em pessoas de ascendência africana com neutrófilos entre 1.000 e 1.500/mm³, sem infecções de repetição e com o restante do hemograma normal. Pesquise o histórico familiar e hemogramas antigos: se a contagem é baixa há anos sem consequência, o diagnóstico está feito e nenhuma investigação adicional é necessária.',
              'Investigue conforme o contexto: sorologias virais (HIV, hepatites, EBV, CMV, parvovírus B19), B12 e folato, autoanticorpos, TSH e função hepática. Peça esfregaço de sangue periférico. Neutropenia acompanhada de anemia ou plaquetopenia muda o cenário e fortalece a indicação de mielograma com biópsia de medula.',
              'Oriente o paciente a medir a temperatura e procurar atendimento imediato se houver febre — em neutropenia, o retardo do antibiótico é o que mata, e o paciente precisa saber disso antes de ficar febril.',
            ]
          : [
              'Contagem de neutrófilos adequada. Se o motivo da avaliação foi leucocitose, distinga reação de doença: relação bastonetes/neutrófilos totais acima de 0,2, presença de metamielócitos e mielócitos, ou leucocitose acima de 30.000/mm³ pedem esfregaço e avaliação hematológica.',
              'Use a **relação neutrófilo/linfócito** como marcador de inflamação sistêmica de baixo custo, mas apenas como contexto: valores acima de 6 a 9 associam-se a pior prognóstico em sepse, síndrome coronariana e neoplasia, sem definir conduta isoladamente.',
              lAbs < 1000
                ? 'Há linfopenia associada, que é um marcador prognóstico subestimado. Investigue HIV, corticoterapia, desnutrição, doença autoimune, linfoma e imunodeficiência; em linfopenia abaixo de 500/mm³ considere profilaxia para Pneumocystis conforme o contexto e a causa.'
                : 'Se houver eosinofilia acima de 1.500/mm³, investigue parasitose (estrongiloidíase antes de qualquer corticoide), reação a fármaco, atopia grave, vasculite eosinofílica e neoplasia mieloide com rearranjo de PDGFRA/PDGFRB.',
            ],
      alertas: [
        'Percentual não decide nada. Nenhuma conduta — nem antibiótico, nem isolamento, nem investigação — deve ser tomada sobre percentual de neutrófilos sem converter para valor absoluto.',
        'Corticoide em uso eleva os neutrófilos por desmarginação, sem qualquer ganho de função. Um paciente corticoidado com 8.000 neutrófilos pode estar tão vulnerável quanto antes, e a leucocitose não exclui infecção grave.',
        'Metamielócitos e mielócitos **não** entram na contagem de neutrófilos absolutos, mas a presença deles é mais grave que a de bastonetes: indica esgotamento do pool de reserva medular.',
        nAbs < 500
          ? 'Febre em neutropenia grave não admite espera por hemograma de controle, radiografia ou avaliação de especialista. Antibiótico na primeira hora, e depois se investiga.'
          : 'Neutropenia com anemia ou plaquetopenia concomitantes não é neutropenia isolada: a investigação passa a incluir aplasia, mielodisplasia, leucemia e infiltração medular, com indicação forte de mielograma.',
      ],
      tabela: {
        titulo: 'Graus de neutropenia e risco infeccioso',
        colunas: ['Neutrófilos absolutos', 'Grau', 'Risco', 'Conduta na febre'],
        linhas: [
          ['≥ 1.500/mm³', 'Normal', 'Basal', 'Conduta habitual'],
          ['1.000 – 1.499/mm³', 'Leve', 'Pouco aumentado', 'Investigação usual, vigilância'],
          ['500 – 999/mm³', 'Moderada', 'Aumentado', 'Antibiótico precoce, considerar internação'],
          ['< 500/mm³', 'Grave', 'Alto', 'Emergência: antibiótico na 1ª hora'],
        ],
        destaque: nAbs >= 1500 ? 0 : nAbs >= 1000 ? 1 : nAbs >= 500 ? 2 : 3,
      },
    }
  },
  formula: ['Neutrófilos absolutos = leucócitos × (% segmentados + % bastonetes) / 100', 'Linfócitos absolutos = leucócitos × % linfócitos / 100'],
  fundamento:
    'O leucograma diferencial é reportado em percentuais por razões históricas do método manual, mas a defesa do organismo depende do número de células, não da proporção. Converter para valor absoluto é o passo mais simples e mais frequentemente esquecido da leitura do hemograma. A razão de o valor absoluto ser o que importa é mecanicista: a defesa contra bactérias e fungos depende de o neutrófilo chegar em número suficiente ao sítio de infecção, aderir ao endotélio, migrar pelo interstício, fagocitar e produzir a explosão respiratória. Cada uma dessas etapas consome células, e o consumo é proporcional à carga microbiana, não à fração que os neutrófilos representam no leucograma. O limiar de 500/mm³ não é convenção administrativa: abaixo dele a incidência de bacteremia sobe abruptamente e o paciente perde a capacidade de formar pus, o que tem consequência diagnóstica direta — a pneumonia pode não consolidar na radiografia, a infecção urinária pode não ter piúria, o abscesso pode não flutuar. A ausência dos sinais clássicos de inflamação em paciente neutropênico é a regra, não a exceção, e é por isso que a febre isolada basta para acionar o protocolo. A contagem também precisa ser lida em duas dimensões: o número atual e a **velocidade de queda**, porque um paciente descendo rapidamente de 3.000 para 800 tem risco diferente de outro estável em 800 há meses. Por fim, vale saber que os bastonetes entram na conta e os metamielócitos não — não por convenção, mas porque o bastonete já é funcionalmente competente para fagocitose, enquanto formas mais imaturas não são, e sua presença no sangue sinaliza esgotamento da reserva medular em vez de reforço da defesa.',
  armadilhas: [
    'Contadores automatizados podem classificar mal células imaturas. Diante de citopenia importante ou de desvio acentuado, peça revisão do esfregaço por microscopia.',
    'A contagem de neutrófilos oscila com corticoide (que a eleva por desmarginação, sem melhorar a função), com exercício, com estresse e ao longo do dia.',
  ],
  referencias: [
    { texto: 'Freifeld AG, Bow EJ, Sepkowitz KA, et al. Clinical practice guideline for the use of antimicrobial agents in neutropenic patients with cancer. Clin Infect Dis. 2011;52(4):e56-e93.' },
    { texto: 'Atallah-Yunes SA, Ready A, Newburger PE. Benign ethnic neutropenia. Blood Rev. 2019;37:100586.' },
  ],
}

const classificacaoAnemias: Ferramenta = {
  id: 'classificacao-anemias',
  nome: 'Classificação automatizada das anemias',
  sinonimos: ['anemia', 'vcm', 'microcitica', 'macrocitica', 'interpretacao do hemograma'],
  resumo: 'Cruza hemoglobina, VCM, RDW e ferro para restringir o diferencial da anemia.',
  categorias: ['hematologia'],
  campos: [
    campoSexo(),
    campoNum('hb', 'Hemoglobina', { unidade: 'g/dL', min: 2, max: 22, passo: 0.1 }),
    campoNum('vcm', 'Volume corpuscular médio', { unidade: 'fL', min: 50, max: 140, passo: 0.1, normalMin: 80, normalMax: 100 }),
    campoNum('rdw', 'RDW', { unidade: '%', min: 8, max: 35, passo: 0.1, normalMin: 11.5, normalMax: 14.5 }),
    campoNum('hemacias', 'Hemácias', { unidade: '×10⁶/µL', min: 1, max: 9, passo: 0.01, opcional: true, ajuda: 'Permite calcular o índice de Mentzer, que separa ferropenia de talassemia.' }),
    campoNum('ferritina', 'Ferritina', { unidade: 'ng/mL', min: 1, max: 5000, passo: 1, opcional: true }),
    campoNum('sat', 'Saturação de transferrina', { unidade: '%', min: 1, max: 100, passo: 1, opcional: true }),
    campoNum('retic', 'Reticulócitos', { unidade: '%', min: 0, max: 40, passo: 0.1, opcional: true }),
  ],
  calcular: (v) => {
    const hb = num(v, 'hb')
    const vcm = num(v, 'vcm')
    const rdw = num(v, 'rdw')
    const hemacias = num(v, 'hemacias')
    const ferritina = num(v, 'ferritina')
    const sat = num(v, 'sat')
    const retic = num(v, 'retic')
    if (hb === null || vcm === null || rdw === null) return null
    const f = opc(v, 'sexo') === 'f'
    const limite = f ? 12 : 13
    const anemia = hb < limite
    const gravidade = hb < 7 ? 'grave' : hb < 10 ? 'moderada' : hb < limite ? 'leve' : 'ausente'
    const morfologia = vcm < 80 ? 'Microcítica' : vcm > 100 ? 'Macrocítica' : 'Normocítica'
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Limite inferior de hemoglobina', valor: `${limite} g/dL`, nota: f ? 'Referência para mulheres (OMS).' : 'Referência para homens (OMS).' },
      { rotulo: 'Morfologia', valor: `${morfologia} (VCM ${fmt(vcm, 1)} fL)` },
      { rotulo: 'RDW', valor: fmtPct(rdw, 1), nota: rdw > 14.5 ? 'Elevado: população heterogênea de hemácias, o que sugere carência (ferro, B12, folato) e fala contra talassemia.' : 'Normal: população homogênea, compatível com talassemia, doença crônica e anemia normocítica.' },
    ]
    const hipoteses: string[] = []
    if (morfologia === 'Microcítica') {
      if (hemacias !== null && hemacias > 0) {
        const mentzer = vcm / hemacias
        detalhes.push({ rotulo: 'Índice de Mentzer (VCM/hemácias)', valor: fmt(mentzer, 1), nota: mentzer < 13 ? 'Abaixo de 13 sugere **traço talassêmico** — a talassemia produz muitas hemácias pequenas.' : 'Acima de 13 sugere **ferropenia** — na carência de ferro, o número de hemácias cai junto com o tamanho.' })
      }
      hipoteses.push(
        rdw > 14.5
          ? '**Anemia ferropriva** é a hipótese principal (microcitose com RDW alto). Confirme com ferritina — abaixo de 30 ng/mL fecha o diagnóstico; entre 30 e 100 com saturação de transferrina abaixo de 20% também, sobretudo se houver inflamação. Ferropenia em homem ou em mulher pós-menopausa exige investigação do trato digestivo.'
          : '**Traço talassêmico** ou **anemia de doença crônica** (microcitose com RDW normal). Eletroforese de hemoglobina e ferritina separam as duas.',
      )
      hipoteses.push('As quatro causas de microcitose cabem na mnemônica **TAIS**: **T**alassemia, **A**nemia de doença crônica, **I**ntoxicação por chumbo e ferropenia (**I**ron), **S**ideroblástica.')
    } else if (morfologia === 'Macrocítica') {
      hipoteses.push('**Macrocitose.** Separe megaloblástica de não megaloblástica: a megaloblástica (deficiência de B12 ou folato, medicamentos antifolato) cursa com neutrófilos hipersegmentados, desidrogenase láctica muito elevada e bilirrubina indireta alta por eritropoese ineficaz. A não megaloblástica inclui álcool, hepatopatia, hipotireoidismo, síndrome mielodisplásica, reticulocitose intensa e medicamentos (hidroxiureia, zidovudina, metformina).')
      if (vcm > 115) hipoteses.push('VCM acima de 115 fL restringe fortemente o diferencial a deficiência de B12 ou folato e a síndrome mielodisplásica.')
      hipoteses.push('Deficiência de B12 com hemograma **normal** existe: as manifestações neurológicas (parestesias, ataxia, degeneração combinada subaguda) podem preceder a anemia e são irreversíveis se o tratamento demorar. Ácido metilmalônico e homocisteína elevados confirmam quando a B12 está limítrofe.')
    } else {
      hipoteses.push('**Normocítica.** Aqui o índice de produção reticulocitária é decisivo: reticulócitos altos apontam hemólise ou hemorragia; reticulócitos baixos apontam anemia de doença crônica, doença renal (deficiência de eritropoetina), endocrinopatia, aplasia ou infiltração medular. Considere também a anemia mista — ferropenia somada a deficiência de B12 pode dar VCM normal com RDW muito alto.')
    }
    if (ferritina !== null) {
      detalhes.push({
        rotulo: 'Ferritina',
        valor: `${fmtInt(ferritina)} ng/mL`,
        nota: ferritina < 30 ? 'Abaixo de 30: ferropenia confirmada, com especificidade praticamente total.' : ferritina < 100 ? 'Entre 30 e 100: zona cinzenta. Em presença de inflamação, ferropenia ainda é possível — avalie saturação de transferrina e receptor solúvel de transferrina.' : 'Acima de 100: ferropenia isolada improvável. Lembre que a ferritina é proteína de fase aguda e sobe na inflamação, mascarando carência real.',
        nivel: ferritina < 30 ? 'alerta' : 'neutro',
      })
    }
    if (sat !== null) detalhes.push({ rotulo: 'Saturação de transferrina', valor: fmtPct(sat, 0), nota: sat < 20 ? 'Abaixo de 20%: aporte de ferro insuficiente para a eritropoese, mesmo com ferritina normal (ferropenia funcional).' : 'Adequada.' })
    if (retic !== null) detalhes.push({ rotulo: 'Reticulócitos', valor: fmtPct(retic, 1), nota: 'Use a calculadora de índice de produção reticulocitária para interpretar corretamente.' })
    const nivel: Nivel = hb < 7 ? 'critico' : hb < 10 ? 'alerta' : anemia ? 'atencao' : 'ok'
    return {
      titulo: anemia ? `Anemia ${gravidade} ${morfologia.toLowerCase()}` : 'Sem anemia',
      valor: `${fmt(hb, 1)} g/dL`,
      nivel,
      rotuloNivel: anemia ? `${morfologia}, RDW ${rdw > 14.5 ? 'elevado' : 'normal'}` : 'Hemoglobina dentro da referência',
      detalhes,
      interpretacao: hipoteses,
      alertas: hb < 7 ? ['Hemoglobina abaixo de 7 g/dL é o limiar transfusional na maioria dos contextos (8 g/dL em coronariopatia e no perioperatório ortopédico). Transfunda **uma unidade por vez** e reavalie — a estratégia restritiva é superior à liberal em praticamente todos os cenários estudados.'] : undefined,
    }
  },
  formula: ['Índice de Mentzer = VCM / hemácias (×10⁶/µL)', 'Anemia (OMS): Hb < 13 g/dL em homens, < 12 g/dL em mulheres'],
  fundamento:
    'A classificação morfológica pelo VCM sobrevive porque é eficiente: com um único número, o diferencial da anemia se reduz de dezenas de causas a três grupos. O RDW acrescenta uma segunda dimensão — a heterogeneidade —, e é o que separa dentro de cada grupo o que é carencial (populações mistas de hemácias, RDW alto) do que é constitucional ou de doença crônica (população homogênea, RDW normal).',
  armadilhas: [
    'VCM normal não exclui anemia carencial: a combinação de ferropenia (microcítica) com deficiência de B12 (macrocítica) produz VCM normal e RDW muito alto.',
    'Reticulocitose intensa eleva o VCM, porque o reticulócito é maior que a hemácia madura.',
    'Aglutininas frias falseiam VCM e contagem de hemácias — o resultado se corrige aquecendo a amostra.',
  ],
  referencias: [
    { texto: 'Cascio MJ, DeLoughery TG. Anemia: evaluation and diagnostic tests. Med Clin North Am. 2017;101(2):263-284.' },
    { texto: 'Camaschella C. Iron deficiency. Blood. 2019;133(1):30-39.' },
  ],
}

const plaquetasCorrigidas: Ferramenta = {
  id: 'plaquetas-corrigidas',
  nome: 'Incremento corrigido de plaquetas e resposta transfusional',
  sinonimos: ['cci', 'plaquetas corrigidas', 'refratariedade plaquetaria', 'transfusao de plaquetas'],
  resumo: 'Avalia se a transfusão de plaquetas funcionou e identifica refratariedade.',
  categorias: ['hematologia'],
  campos: [
    campoNum('pre', 'Plaquetas antes da transfusão', { unidade: '×10⁹/L', min: 0, max: 300, passo: 1, ajuda: 'Colhida imediatamente antes de iniciar a infusão. Usar um hemograma de horas antes já invalida o cálculo, porque a contagem pode ter caído no intervalo.' }),
    campoNum('pos', 'Plaquetas após a transfusão', { unidade: '×10⁹/L', min: 0, max: 500, passo: 1, ajuda: 'O momento da coleta é o que define qual corte se aplica — escolha-o no campo abaixo. Coleta fora das duas janelas não é interpretável.' }),
    campoNum('sc', 'Superfície corporal', { unidade: 'm²', min: 0.2, max: 3, passo: 0.01, ajuda: 'Normaliza pelo volume sanguíneo: a mesma dose eleva mais a contagem de uma pessoa pequena. Calcule por Mosteller — raiz de (peso × altura / 3600).' }),
    campoNum('unidades', 'Unidades transfundidas', { min: 1, max: 12, passo: 1, padrao: '1', ajuda: '1 unidade de aférese equivale a cerca de 6 unidades de plaquetas randômicas, com 3 a 4 ×10¹¹ plaquetas.' }),
    campoSeg('tipo', 'Tipo de concentrado', [
      { valor: 'aferese', rotulo: 'Aférese (3,0 ×10¹¹ por unidade)' },
      { valor: 'randomica', rotulo: 'Randômica (0,55 ×10¹¹ por unidade)' },
    ]),
    campoSeg('tempo', 'Momento da coleta pós-transfusional', [
      { valor: '1h', rotulo: '10 min a 1 hora' },
      { valor: '24h', rotulo: '18 a 24 horas' },
    ]),
  ],
  calcular: (v) => {
    const pre = num(v, 'pre')
    const pos = num(v, 'pos')
    const sc = num(v, 'sc')
    const un = numOu(v, 'unidades', 1)
    if (pre === null || pos === null || sc === null || sc <= 0) return null
    const porUnidade = opc(v, 'tipo') === 'aferese' ? 3.0 : 0.55
    const totalPlaquetas = un * porUnidade
    const incremento = pos - pre
    const cci = (incremento * sc) / totalPlaquetas
    const uma = opc(v, 'tempo') === '1h'
    const corte = uma ? 7.5 : 4.5
    const adequado = cci >= corte
    return {
      titulo: 'Incremento corrigido (CCI)',
      valor: fmtInt(cci),
      nivel: adequado ? 'ok' : 'alerta',
      rotuloNivel: adequado ? 'Resposta adequada' : 'Resposta inadequada',
      detalhes: [
        { rotulo: 'Incremento absoluto', valor: `${fmtInt(incremento)} ×10⁹/L` },
        { rotulo: 'Conteúdo plaquetário transfundido', valor: `${fmt(totalPlaquetas, 2)} ×10¹¹` },
        { rotulo: 'Corte de resposta adequada', valor: `≥ ${fmt(corte, 1)}`, nota: uma ? 'Para coleta de 10 min a 1 hora.' : 'Para coleta de 18 a 24 horas.' },
      ],
      interpretacao: [
        adequado
          ? 'Resposta transfusional adequada.'
          : '**Resposta inadequada.** Refratariedade plaquetária é definida por dois CCIs consecutivos abaixo do corte, em transfusões de plaquetas ABO compatíveis e frescas.',
        '**Causas não imunes** respondem por cerca de 80% da refratariedade e devem ser excluídas primeiro: febre, sepse, esplenomegalia, coagulação intravascular disseminada, sangramento ativo, anfotericina B, vancomicina, heparina, doença do enxerto contra o hospedeiro e microangiopatia. Nessas, o CCI de 1 hora costuma ser adequado e o de 24 horas cai — o consumo é periférico.',
        '**Causa imune** (aloimunização HLA ou HPA) tipicamente derruba já o CCI de 1 hora. Confirme com pesquisa de anticorpos anti-HLA e trate com plaquetas HLA-compatíveis ou compatibilizadas por prova cruzada. Leucorredução universal dos hemocomponentes reduziu muito a incidência de aloimunização.',
        'A superfície corporal entra na fórmula para normalizar pelo volume sanguíneo — a mesma dose de plaquetas eleva mais a contagem de uma pessoa pequena.',
        'A razão de existirem **duas** coletas com dois cortes diferentes é puramente fisiológica, e é o que transforma o CCI num teste que localiza o problema. A plaqueta transfundida tem sobrevida normal de 4 a 5 dias, e cerca de um terço do total é sequestrado no baço em equilíbrio dinâmico com a circulação. A coleta de 10 minutos a 1 hora mede **recuperação**: quantas das plaquetas infundidas chegaram ao compartimento circulante. Já passou tempo suficiente para a distribuição esplênica se equilibrar, mas não para consumo significativo. Um CCI de 1 hora baixo significa, portanto, que as plaquetas foram destruídas ou sequestradas imediatamente — e destruição imediata é assinatura de mecanismo **imune**: anticorpo anti-HLA de classe I preexistente liga o antígeno na plaqueta transfundida e a remove pelo sistema retículo-endotelial em minutos. Esplenomegalia volumosa é a outra causa de recuperação baixa, por sequestro puramente mecânico. A coleta de 18 a 24 horas mede **sobrevida**: um CCI de 1 hora adequado que desaba em 24 horas indica que as plaquetas chegaram e foram consumidas depois, o que aponta para consumo periférico — febre, sepse, coagulação intravascular disseminada, sangramento ativo ou fármaco. Esse padrão de dissociação entre as duas medidas é a informação mais útil do exame, e se perde quando apenas uma coleta é feita.',
      ],
      conduta: adequado
        ? [
            'Resposta adequada: mantenha o gatilho transfusional institucional. Habitualmente 10 ×10⁹/L na profilaxia do paciente estável, 20 ×10⁹/L com febre, sepse ou uso de anticoagulante, 50 ×10⁹/L para procedimento invasivo ou sangramento ativo, e 100 ×10⁹/L para neurocirurgia ou sangramento em sistema nervoso central.',
            'Não transfunda por número em paciente estável e sem sangramento acima do gatilho: cada exposição aumenta o risco de aloimunização HLA, que é justamente o que torna as transfusões futuras ineficazes. A estratégia restritiva está bem estabelecida.',
            'Registre o CCI no prontuário. Só com o valor anterior documentado é possível caracterizar refratariedade depois, que exige **dois** resultados consecutivos inadequados.',
          ]
        : [
            'Antes de rotular como refratariedade, confirme que as condições do teste foram adequadas: concentrado ABO compatível, armazenado por menos de 72 horas, e coleta no intervalo correto. Plaqueta ABO incompatível ou próxima do fim da validade produz CCI baixo sem nenhuma aloimunização.',
            'Exclua as **causas não imunes** primeiro — elas respondem por cerca de 80% dos casos e são as tratáveis: febre e sepse (trate a infecção), esplenomegalia, coagulação intravascular disseminada (dose fibrinogênio, D-dímero e aplique o escore ISTH), sangramento ativo, microangiopatia, doença do enxerto contra o hospedeiro e fármacos — anfotericina B, vancomicina, heparina (calcule o 4Ts), linezolida, sulfas.',
            uma
              ? 'O CCI de 1 hora inadequado aponta para destruição imediata: solicite **pesquisa de anticorpos anti-HLA classe I** (PRA) e, se positiva, providencie plaquetas HLA-compatíveis ou selecionadas por prova cruzada. Se a pesquisa for negativa, considere anticorpo anti-HPA, que é mais raro e exige painel específico.'
              : 'O CCI de 1 hora adequado com queda em 24 horas indica consumo periférico, não aloimunização. A conduta é tratar a causa do consumo — pesquisa de anti-HLA nesse padrão tende a ser negativa e a transfusão HLA-compatível não resolve.',
            'Enquanto a causa é investigada, mantenha suporte transfusional conforme o sangramento e não conforme o número, e considere antifibrinolítico (ácido tranexâmico) como adjuvante em sangramento mucoso — com a ressalva de evitá-lo em hematúria e em coagulação intravascular disseminada com trombose predominante.',
            'Solicite avaliação do hematologista e do serviço de hemoterapia. Refratariedade confirmada muda a logística do cuidado: exige doador compatibilizado, planejamento antecipado para procedimentos e, em alguns casos, imunoglobulina ou imunossupressão.',
          ],
      alertas: [
        'O CCI avalia a **eficácia da transfusão**, não a necessidade dela. Um CCI excelente não justifica transfundir um paciente estável acima do gatilho, e um CCI ruim não justifica transfundir mais em quem não sangra.',
        'Refratariedade exige **dois** CCIs consecutivos abaixo do corte, com concentrados ABO compatíveis e frescos. Um único resultado ruim é insuficiente e costuma ter explicação técnica.',
        'A fórmula depende do conteúdo plaquetário real do concentrado, que varia entre serviços. Os valores usados aqui (3,0 ×10¹¹ por aférese e 0,55 ×10¹¹ por randômica) são estimativas — se a bolsa informa o conteúdo medido, prefira esse dado.',
      ],
      tabela: {
        titulo: 'Como o padrão das duas coletas localiza a causa',
        colunas: ['CCI de 1 hora', 'CCI de 24 horas', 'Mecanismo', 'Conduta'],
        linhas: [
          ['Adequado', 'Adequado', 'Resposta normal', 'Manter gatilho transfusional'],
          ['Adequado', 'Baixo', 'Consumo periférico', 'Tratar febre, sepse, CIVD, sangramento, fármaco'],
          ['Baixo', 'Baixo', 'Destruição imediata ou sequestro', 'Pesquisar anti-HLA; avaliar esplenomegalia'],
        ],
        destaque: adequado ? 0 : uma ? 2 : 1,
      },
    }
  },
  formula: ['CCI = [(plaquetas pós − plaquetas pré) × superfície corporal] ÷ número de plaquetas transfundidas (×10¹¹)'],
  fundamento:
    'A contagem pós-transfusional bruta não permite comparar resposta entre pacientes nem entre doses. O CCI normaliza pelas duas variáveis que confundem a leitura — o tamanho do receptor e a dose transfundida —, permitindo dizer se a plaqueta transfundida sobreviveu ou foi destruída. A construção é simples e vale entendê-la: o incremento absoluto é multiplicado pela superfície corporal (que é o substituto prático do volume sanguíneo, num paciente em que medir volemia é inviável) e dividido pelo número de plaquetas efetivamente infundidas, em unidades de 10¹¹. O resultado é uma medida de eficiência da transfusão, independente do tamanho do paciente e da dose — e é por isso que um incremento de 20 ×10⁹/L pode ser excelente numa mulher de 1,5 m² recebendo uma randômica e péssimo num homem de 2,0 m² recebendo duas aféreses. A grande virtude clínica do CCI, porém, não está no número isolado, e sim no contraste entre as duas janelas de coleta. A plaqueta transfundida tem sobrevida normal de 4 a 5 dias e distribui-se com cerca de um terço sequestrado no baço; a coleta de 10 minutos a 1 hora já capta o equilíbrio esplênico mas nenhum consumo relevante, medindo portanto **recuperação**, enquanto a de 18 a 24 horas mede **sobrevida**. Recuperação baixa é destruição imediata, assinatura do mecanismo imune — o anticorpo anti-HLA de classe I preexistente liga o antígeno na plaqueta transfundida e o sistema retículo-endotelial a remove em minutos. Recuperação normal com sobrevida curta é consumo periférico, que é o padrão da febre, da sepse, da coagulação intravascular disseminada e do sangramento ativo. Historicamente, a leucorredução universal dos hemocomponentes reduziu de forma acentuada a incidência de aloimunização HLA, porque o leucócito do doador — e não a plaqueta — é o principal apresentador de antígeno de classe II que desencadeia a resposta. Isso deslocou o peso relativo das causas, e hoje aproximadamente 80% da refratariedade é não imune, o que inverte a ordem correta de investigação: procure febre, sepse, esplenomegalia e fármaco antes de pedir painel de anticorpos.',
  armadilhas: [
    'Colher a amostra pós-transfusional pelo mesmo cateter usado para transfundir contamina o resultado.',
    'Transfusão profilática de plaquetas está indicada abaixo de 10 ×10⁹/L em paciente estável; limiares maiores (20, 50 ou 100) valem conforme procedimento, sangramento e comorbidade.',
    'Concentrado ABO incompatível ou armazenado por mais de 72 horas produz CCI baixo sem nenhuma aloimunização. Confirme as duas condições antes de rotular refratariedade — caso contrário o teste mede a logística do banco de sangue, não o paciente.',
    'Coleta fora das duas janelas validadas não é interpretável. Entre 2 e 17 horas o resultado mistura recuperação e sobrevida e não permite distinguir mecanismo imune de consumo periférico.',
    'Refratariedade exige dois CCIs consecutivos inadequados. Agir sobre um único resultado leva a pedidos desnecessários de plaquetas HLA-compatíveis, que são escassas e de logística difícil.',
    'O conteúdo plaquetário usado na conta é estimado (3,0 ×10¹¹ por aférese, 0,55 ×10¹¹ por randômica) e varia entre serviços. Se a bolsa traz o conteúdo medido, use-o — a diferença altera o CCI proporcionalmente.',
    'Pedir painel de anticorpos anti-HLA antes de excluir febre, sepse, esplenomegalia e fármaco inverte a probabilidade: cerca de 80% da refratariedade é não imune desde a leucorredução universal.',
  ],
  referencias: [
    { texto: 'Kaufman RM, Djulbegovic B, Gernsheimer T, et al. Platelet transfusion: a clinical practice guideline from the AABB. Ann Intern Med. 2015;162(3):205-213.' },
    { texto: 'Stanworth SJ, Navarrete C, Estcourt L, Marsh J. Platelet refractoriness: practical approaches and ongoing dilemmas in patient management. Br J Haematol. 2015;171(3):297-305.' },
  ],
}

const padua: Ferramenta = {
  id: 'padua',
  nome: 'Escore de Pádua',
  sinonimos: ['padua', 'profilaxia tromboembolica', 'tromboprofilaxia clinica'],
  resumo: 'Indica tromboprofilaxia em pacientes clínicos internados.',
  categorias: ['hematologia', 'cirurgia'],
  campos: [
    campoSimNao('cancer', 'Neoplasia ativa', 3, 'Metástases ou quimioterapia/radioterapia nos últimos 6 meses.'),
    campoSimNao('tev', 'Tromboembolismo venoso prévio', 3, 'Excluindo trombose de veia superficial.'),
    campoSimNao('mobilidade', 'Mobilidade reduzida', 3, 'Restrito ao leito, com ida ao banheiro, por pelo menos 3 dias.'),
    campoSimNao('trombofilia', 'Trombofilia conhecida', 3),
    campoSimNao('trauma', 'Trauma ou cirurgia recente (≤ 1 mês)', 2),
    campoSimNao('idade', 'Idade ≥ 70 anos', 1),
    campoSimNao('cardioResp', 'Insuficiência cardíaca ou respiratória', 1),
    campoSimNao('iamAvc', 'Infarto agudo do miocárdio ou AVC isquêmico', 1),
    campoSimNao('infeccao', 'Infecção aguda ou doença reumatológica', 1),
    campoSimNao('obesidade', 'Obesidade (IMC ≥ 30)', 1),
    campoSimNao('hormonio', 'Tratamento hormonal em curso', 1),
  ],
  calcular: (v) => {
    const total = somaSimNao(v, [
      { id: 'cancer', pontos: 3 },
      { id: 'tev', pontos: 3 },
      { id: 'mobilidade', pontos: 3 },
      { id: 'trombofilia', pontos: 3 },
      { id: 'trauma', pontos: 2 },
      { id: 'idade', pontos: 1 },
      { id: 'cardioResp', pontos: 1 },
      { id: 'iamAvc', pontos: 1 },
      { id: 'infeccao', pontos: 1 },
      { id: 'obesidade', pontos: 1 },
      { id: 'hormonio', pontos: 1 },
    ])
    const alto = total >= 4
    return {
      titulo: 'Escore de Pádua',
      valor: String(total),
      unidade: 'de 20 pontos',
      nivel: alto ? 'alerta' : 'ok',
      rotuloNivel: alto ? 'Alto risco — tromboprofilaxia indicada' : 'Baixo risco',
      detalhes: [
        { rotulo: 'Ponto de corte', valor: '≥ 4 pontos' },
        { rotulo: 'Risco de tromboembolismo em 90 dias sem profilaxia', valor: alto ? '11,0%' : '0,3%', nota: 'Coorte de derivação de Barbar et al. (2010).' },
      ],
      interpretacao: [
        alto
          ? '**Tromboprofilaxia farmacológica indicada** na ausência de contraindicação: enoxaparina 40 mg por via subcutânea uma vez ao dia (ajustar para 30 mg/dia se clearance de creatinina < 30 mL/min), heparina não fracionada 5.000 UI a cada 8 ou 12 horas, ou fondaparinux 2,5 mg/dia.'
          : 'Baixo risco: profilaxia farmacológica não indicada de rotina. Estimule deambulação precoce.',
        '**Avalie o risco de sangramento antes de prescrever.** Contraindicações: sangramento ativo, plaquetas abaixo de 25 a 50 ×10⁹/L, coagulopatia grave, hipertensão descontrolada, punção lombar ou anestesia neuroaxial recente, e sangramento intracraniano.',
        'Em contraindicação à profilaxia farmacológica, use compressão pneumática intermitente. Meia elástica isolada não é suficiente e não deve ser usada em AVC (o ensaio CLOTS 1 mostrou dano).',
        'Pádua é para pacientes **clínicos**. Em cirúrgicos, use Caprini; em oncológicos ambulatoriais, Khorana.',
      ],
    }
  },
  formula: ['Soma ponderada de 11 fatores; ≥ 4 pontos define alto risco'],
  fundamento:
    'O escore foi derivado em Pádua com pacientes clínicos internados e validado prospectivamente, mostrando uma diferença de risco de mais de trinta vezes entre as categorias. Sua estrutura reconhece que o risco trombótico é a soma de três elementos da tríade de Virchow: estase (mobilidade reduzida, insuficiência cardíaca), hipercoagulabilidade (câncer, trombofilia, hormônio, inflamação) e lesão endotelial (trauma, cirurgia).',
  armadilhas: [
    'A profilaxia deve ser reavaliada diariamente — o risco muda com a mobilidade, com a plaquetometria e com procedimentos.',
    'Estender a profilaxia após a alta em pacientes clínicos não mostrou benefício líquido nos ensaios, por aumento de sangramento.',
  ],
  referencias: [
    { texto: 'Barbar S, Noventa F, Rossetto V, et al. A risk assessment model for the identification of hospitalized medical patients at risk for venous thromboembolism: the Padua Prediction Score. J Thromb Haemost. 2010;8(11):2450-2457.' },
  ],
}

const caprini: Ferramenta = {
  id: 'caprini',
  nome: 'Escore de Caprini',
  sinonimos: ['caprini', 'risco trombose cirurgia', 'tromboprofilaxia cirurgica'],
  resumo: 'Estratifica o risco de tromboembolismo venoso em pacientes cirúrgicos.',
  categorias: ['hematologia', 'cirurgia'],
  campos: [
    campoOpc('idade', 'Idade', [
      { valor: '0', rotulo: '≤ 40 anos', pontos: 0 },
      { valor: '1', rotulo: '41 a 60 anos', pontos: 1 },
      { valor: '2', rotulo: '61 a 74 anos', pontos: 2 },
      { valor: '3', rotulo: '≥ 75 anos', pontos: 3 },
    ]),
    campoSimNao('cirurgiaMenor', 'Cirurgia de pequeno porte', 1, 'Procedimento de menos de 45 minutos. Marque apenas um dos dois itens de porte cirúrgico, não os dois.'),
    campoSimNao('cirurgiaMaior', 'Cirurgia de grande porte (> 45 min) ou laparoscópica > 45 min', 2, 'A duração é o que pesa, não a via: laparoscopia longa vale o mesmo que laparotomia, porque o pneumoperitônio também reduz o retorno venoso femoral.'),
    campoSimNao('artroplastia', 'Artroplastia eletiva de membro inferior', 5, 'Item de 5 pontos: sem profilaxia, a incidência de trombose venosa profunda em artroplastia de quadril e joelho passa de 40% em séries históricas com flebografia.'),
    campoSimNao('fraturaQuadril', 'Fratura de quadril, pelve ou membro inferior', 5, 'Soma lesão endotelial direta, imobilidade e resposta inflamatória — os três vértices da tríade de Virchow num só evento.'),
    campoSimNao('avcAgudo', 'AVC agudo (< 1 mês)', 5, 'A paralisia abole a bomba muscular da panturrilha no membro plégico, onde a estase é máxima. Atenção ao risco hemorrágico no AVC hemorrágico ou pós-trombólise.'),
    campoSimNao('medular', 'Lesão medular aguda (< 1 mês)', 5, 'É o cenário de maior risco trombótico da medicina: paralisia, perda do tônus vasomotor simpático abaixo da lesão e imobilidade prolongada.'),
    campoSimNao('tevPrevio', 'Tromboembolismo venoso prévio', 3, 'O fator de risco isolado mais forte para recorrência. Registre se o evento anterior foi provocado ou não provocado — isso muda a duração do tratamento se houver novo evento.'),
    campoSimNao('historiaFamiliar', 'História familiar de tromboembolismo', 3),
    campoSimNao('trombofilia', 'Trombofilia laboratorial (fator V de Leiden, anticoagulante lúpico, anticardiolipina, mutação da protrombina, hiper-homocisteinemia)', 3),
    campoSimNao('obesidade', 'IMC > 25', 1, 'Corte baixo nesta versão do escore. Na obesidade com IMC acima de 40, além de pontuar, a dose profilática precisa ser ajustada — 40 mg de enoxaparina são insuficientes.'),
    campoSimNao('imobilizacao', 'Repouso no leito por mais de 72 h', 2, 'Repouso efetivo, não prescrito. Paciente que senta na poltrona e caminha ao banheiro não está imobilizado.'),
    campoSimNao('gesso', 'Imobilização gessada', 2),
    campoSimNao('cateter', 'Acesso venoso central', 2, 'Inclui cateter de inserção periférica (PICC), que tem risco de trombose de membro superior maior que o cateter central de inserção central.'),
    campoSimNao('cancer', 'Neoplasia maligna atual ou prévia', 2, 'O tumor gera fator tecidual, micropartículas circulantes e mucinas que ativam plaquetas diretamente. Em oncológico com cateter e quimioterapia, o risco supera a soma das partes — considere também o escore de Khorana.'),
    campoSimNao('varizes', 'Varizes de membros inferiores', 1, 'Insuficiência valvar significa estase crônica nos seios valvares, que é exatamente onde a trombose venosa profunda se inicia.'),
    campoSimNao('edema', 'Edema de membros inferiores', 1),
    campoSimNao('sepse', 'Sepse (< 1 mês)', 1, 'A sepse é pró-trombótica por ativação de fator tecidual em monócitos, consumo de anticoagulantes naturais e supressão da fibrinólise.'),
    campoSimNao('pulmonar', 'Doença pulmonar grave ou pneumonia (< 1 mês)', 1),
    campoSimNao('gestacao', 'Gestação ou puerpério (< 1 mês)', 1),
    campoSimNao('anticoncepcional', 'Contraceptivo oral ou terapia hormonal', 1),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    if (idade === null) return null
    const total =
      idade +
      somaSimNao(v, [
        { id: 'cirurgiaMenor', pontos: 1 },
        { id: 'cirurgiaMaior', pontos: 2 },
        { id: 'artroplastia', pontos: 5 },
        { id: 'fraturaQuadril', pontos: 5 },
        { id: 'avcAgudo', pontos: 5 },
        { id: 'medular', pontos: 5 },
        { id: 'tevPrevio', pontos: 3 },
        { id: 'historiaFamiliar', pontos: 3 },
        { id: 'trombofilia', pontos: 3 },
        { id: 'obesidade', pontos: 1 },
        { id: 'imobilizacao', pontos: 2 },
        { id: 'gesso', pontos: 2 },
        { id: 'cateter', pontos: 2 },
        { id: 'cancer', pontos: 2 },
        { id: 'varizes', pontos: 1 },
        { id: 'edema', pontos: 1 },
        { id: 'sepse', pontos: 1 },
        { id: 'pulmonar', pontos: 1 },
        { id: 'gestacao', pontos: 1 },
        { id: 'anticoncepcional', pontos: 1 },
      ])
    const faixa = total === 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : total <= 8 ? 3 : 4
    const rotulos = ['Risco muito baixo', 'Risco baixo', 'Risco moderado', 'Risco alto', 'Risco muito alto']
    const risco = ['< 0,5%', '1,5%', '3,0%', '6,0%', '> 10%'][faixa]
    const conduta = [
      'Deambulação precoce; profilaxia mecânica ou farmacológica não indicada.',
      'Profilaxia mecânica (compressão pneumática intermitente).',
      'Profilaxia farmacológica **ou** mecânica.',
      'Profilaxia farmacológica **e** mecânica.',
      'Profilaxia farmacológica e mecânica, com **extensão por 28 a 35 dias** após alta em cirurgia oncológica abdominopélvica e em artroplastia de grandes articulações.',
    ][faixa]
    return {
      titulo: 'Escore de Caprini',
      valor: String(total),
      unidade: 'pontos',
      nivel: (['ok', 'ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: rotulos[faixa],
      detalhes: [
        { rotulo: 'Risco de tromboembolismo sem profilaxia', valor: risco },
        { rotulo: 'Conduta recomendada', valor: conduta },
      ],
      interpretacao: [
        conduta,
        'O Caprini é o modelo de avaliação de risco mais validado em cirurgia geral, plástica, ortopédica e urológica, com dezenas de estudos de validação externa. Sua granularidade — mais de 30 fatores na versão completa — é ao mesmo tempo sua força e sua fraqueza: captura bem o risco, mas é demorado de aplicar.',
        '**A decisão final combina risco trombótico e risco hemorrágico.** Em neurocirurgia, cirurgia oftalmológica e procedimentos com anestesia neuroaxial, os prazos e as escolhas mudam substancialmente.',
        'Momento de início: enoxaparina 12 horas antes ou 12 a 24 horas após a cirurgia, conforme o protocolo. Em anestesia neuroaxial, respeite os intervalos entre a última dose e a punção ou retirada do cateter — 12 horas para dose profilática e 24 horas para dose terapêutica de heparina de baixo peso molecular.',
        'Os itens do escore são, no fundo, a **tríade de Virchow** desdobrada em fatores contáveis, e enxergar isso torna o escore memorizável em vez de decorável. A **estase** aparece na imobilidade, no repouso prolongado, na cirurgia de mais de 45 minutos, na imobilização gessada e na paralisia — em todos, o retorno venoso deixa de contar com a bomba muscular da panturrilha, e o sangue estagna preferencialmente nos seios valvares da panturrilha, onde a trombose venosa profunda quase sempre começa. A estase causa hipóxia local no endotélio valvar, que responde expressando P-selectina e fator tecidual, transformando uma superfície antitrombótica em pró-trombótica. A **lesão endotelial** aparece no trauma, na cirurgia, no cateter venoso central e na fratura. E a **hipercoagulabilidade** aparece na neoplasia (por fator tecidual tumoral, micropartículas circulantes e mucinas que ativam plaquetas diretamente), na gravidez e no puerpério, no estrogênio exógeno, na sepse, na doença inflamatória intestinal e nas trombofilias hereditárias. A cirurgia é peculiar porque ativa os três vértices simultaneamente: imobiliza, lesa o endotélio e desencadeia resposta inflamatória sistêmica com elevação de fibrinogênio, fator VIII e inibidor do ativador de plasminogênio — ou seja, reduz também a fibrinólise. É por isso que o risco cirúrgico não termina na alta: o estado pró-trombótico persiste por semanas, e é esse fato que fundamenta a profilaxia estendida por 28 a 35 dias na artroplastia e na cirurgia oncológica abdominopélvica.',
      ],
      conduta: faixa === 0
        ? [
            'Nenhuma profilaxia farmacológica ou mecânica é necessária. A conduta é **deambulação precoce** e hidratação adequada — o que não é placebo: a contração da musculatura da panturrilha é a bomba que impede a estase nos seios valvares onde a trombose se inicia.',
            'Reavalie o escore se algo mudar: complicação pós-operatória, infecção, reoperação, imobilização não planejada ou internação prolongada deslocam o paciente de faixa, e o Caprini da admissão não vale para sempre.',
          ]
        : faixa === 1
          ? [
              'Profilaxia **mecânica**: compressão pneumática intermitente ou meia elástica de compressão graduada, iniciada no intraoperatório e mantida enquanto houver restrição de mobilidade.',
              'Deambulação precoce e progressiva é parte da profilaxia, não um complemento dela.',
              'Reavalie diariamente: a maioria dos pacientes de baixo risco que desenvolve trombose mudou de faixa durante a internação e ninguém recalculou.',
            ]
          : faixa === 2
            ? [
                'Profilaxia **farmacológica ou mecânica**, conforme o risco hemorrágico. Enoxaparina 40 mg por via subcutânea uma vez ao dia é o esquema padrão; heparina não fracionada 5.000 UI a cada 8 ou 12 horas é alternativa aceitável e preferível na insuficiência renal grave.',
                'Ajuste a dose pelo peso e pela função renal: na obesidade com IMC ≥ 40 considere enoxaparina 40 mg a cada 12 horas ou 0,5 mg/kg/dia; com clearance abaixo de 30 mL/min reduza para 20 mg/dia ou use heparina não fracionada.',
                'Se o risco hemorrágico for proibitivo, use profilaxia mecânica e reavalie diariamente a possibilidade de introduzir a farmacológica assim que a hemostasia permitir.',
              ]
            : [
                'Profilaxia **farmacológica somada à mecânica** — a combinação é superior a qualquer das duas isoladamente nesta faixa. Enoxaparina 40 mg/dia por via subcutânea mais compressão pneumática intermitente.',
                'Início: 12 horas antes ou 12 a 24 horas após a cirurgia, conforme protocolo institucional e hemostasia. Em anestesia neuroaxial, respeite 12 horas entre a última dose profilática e a punção ou retirada do cateter, e 24 horas se a dose for terapêutica — punção com heparina circulante é a via para hematoma espinhal e paraplegia.',
                faixa === 4
                  ? 'Considere **profilaxia estendida** por 28 a 35 dias após a alta: é formalmente indicada em artroplastia de quadril e joelho e em cirurgia oncológica abdominopélvica, cenários em que o estado pró-trombótico persiste muito além da internação e a maioria dos eventos ocorre depois da alta.'
                  : 'Mantenha a profilaxia durante toda a internação e reavalie a indicação de estendê-la após a alta conforme o procedimento e a mobilidade.',
                'Investigue e trate o que é modificável antes da cirurgia eletiva quando possível: suspensão de estrogênio ou contraceptivo combinado 4 a 6 semanas antes, compensação de insuficiência cardíaca, tratamento de infecção ativa e otimização da anemia.',
              ],
      alertas: [
        'O Caprini estima risco **trombótico** e não diz nada sobre risco hemorrágico. A decisão final é sempre a comparação entre os dois — e em neurocirurgia, cirurgia oftalmológica, cirurgia de grande porte com hemostasia difícil ou plaquetopenia, o risco de sangrar pode superar o de trombosar mesmo com escore alto.',
        'O escore é da admissão, e o paciente muda. Reoperação, infecção, imobilização não prevista, internação em terapia intensiva e cateter central novo elevam a faixa — recalcule.',
        'Existem versões de 2005, 2010 e 2013 com itens e pesos diferentes, e a comparação entre serviços que usam versões distintas não é válida. Padronize uma versão e registre qual foi usada.',
        'Não se aplica a pacientes clínicos não cirúrgicos, para os quais o escore validado é o de Pádua, nem substitui a avaliação específica da gestante, que tem escore próprio da RCOG.',
      ],
      tabela: {
        titulo: 'Estratificação de Caprini',
        colunas: ['Pontos', 'Risco', 'Incidência', 'Conduta'],
        linhas: [
          ['0', 'Muito baixo', '< 0,5%', 'Deambulação'],
          ['1 – 2', 'Baixo', '1,5%', 'Mecânica'],
          ['3 – 4', 'Moderado', '3,0%', 'Farmacológica ou mecânica'],
          ['5 – 8', 'Alto', '6,0%', 'Farmacológica + mecânica'],
          ['≥ 9', 'Muito alto', '> 10%', 'Farmacológica + mecânica, profilaxia estendida'],
        ],
        destaque: faixa,
      },
    }
  },
  formula: ['Soma ponderada de fatores de risco (1, 2, 3 ou 5 pontos cada)'],
  fundamento:
    'Caprini construiu o modelo nos anos 1990 a partir da literatura de fatores de risco, atribuindo pesos proporcionais à magnitude da associação. Os itens de 5 pontos — artroplastia, fratura de quadril, AVC e lesão medular — são justamente aqueles cujo risco de trombose sem profilaxia supera 40% em séries históricas. A lógica de agregação é a de um modelo aditivo de fatores independentes, e é aí que reside tanto sua força quanto sua limitação: o escore assume que os riscos se somam, quando na prática alguns se multiplicam — neoplasia com cateter central e quimioterapia, por exemplo, tem risco superior à soma das partes. Ainda assim o modelo funciona porque os itens mapeiam a **tríade de Virchow** de forma bastante completa. A estase entra pela imobilidade, pelo repouso, pela duração cirúrgica e pela paralisia, e importa porque o retorno venoso depende da bomba muscular da panturrilha: sem ela, o sangue estagna nos seios valvares, o endotélio local fica hipóxico e passa a expressar P-selectina e fator tecidual, convertendo uma superfície antitrombótica em pró-trombótica. A lesão endotelial entra pelo trauma, pela cirurgia, pela fratura e pelo cateter. A hipercoagulabilidade entra pela neoplasia — que gera fator tecidual tumoral, micropartículas circulantes e mucinas ativadoras de plaqueta —, pela gravidez, pelo estrogênio, pela sepse, pela doença inflamatória intestinal e pelas trombofilias. A cirurgia é o único item que aciona os três vértices ao mesmo tempo, e ainda acrescenta um quarto elemento: a resposta inflamatória sistêmica eleva fibrinogênio, fator VIII e inibidor do ativador de plasminogênio, o que reduz a fibrinólise. Esse estado persiste por semanas depois da alta, e é o fundamento fisiopatológico da profilaxia estendida por 28 a 35 dias em artroplastia e em cirurgia oncológica abdominopélvica — a maioria dos eventos nesses grupos ocorre após a saída do hospital, quando ninguém está mais olhando.',
  armadilhas: [
    'Existem múltiplas versões (2005, 2010, 2013) com itens e pesos diferentes. Padronize uma no serviço.',
    'A idade é contada uma única vez, na faixa correspondente — não é cumulativa.',
    'O escore não mede risco hemorrágico, e a decisão de profilaxia farmacológica é sempre a comparação entre os dois riscos. Escore alto com hemostasia precária não indica anticoagulante automaticamente.',
    'Calculado na admissão e nunca recalculado, o escore envelhece mal: reoperação, infecção, internação em UTI, cateter novo e imobilização não prevista mudam a faixa e a conduta.',
    'É um escore de paciente **cirúrgico**. Para o paciente clínico internado o instrumento validado é o de Pádua, e aplicar Caprini nesse cenário superestima sistematicamente a indicação.',
    'O modelo é aditivo e portanto subestima combinações sinérgicas, sobretudo neoplasia somada a cateter venoso central e quimioterapia. No paciente oncológico, considere também o escore de Khorana.',
  ],
  referencias: [
    { texto: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon. 2005;51(2-3):70-78.' },
    { texto: 'Gould MK, Garcia DA, Wren SM, et al. Prevention of VTE in nonorthopedic surgical patients. Chest. 2012;141(2 Suppl):e227S-e277S.' },
  ],
}

const quatroT: Ferramenta = {
  id: 'escore-4ts',
  nome: 'Escore 4Ts para trombocitopenia induzida por heparina',
  sinonimos: ['4ts', 'hit', 'trombocitopenia heparina', 'tih'],
  resumo: 'Probabilidade pré-teste de trombocitopenia induzida por heparina.',
  categorias: ['hematologia'],
  campos: [
    campoOpc('trombocitopenia', 'Trombocitopenia (magnitude da queda)', [
      { valor: '2', rotulo: 'Queda > 50% e nadir ≥ 20 ×10⁹/L', pontos: 2 },
      { valor: '1', rotulo: 'Queda de 30 a 50%, ou nadir de 10 a 19 ×10⁹/L', pontos: 1 },
      { valor: '0', rotulo: 'Queda < 30% ou nadir < 10 ×10⁹/L', pontos: 0 },
    ]),
    campoOpc('tempo', 'Tempo de início da queda', [
      { valor: '2', rotulo: 'Entre 5 e 10 dias, ou ≤ 1 dia com exposição a heparina nos últimos 30 dias', pontos: 2 },
      { valor: '1', rotulo: 'Compatível com 5 a 10 dias mas mal documentado, após o 10º dia, ou ≤ 1 dia com exposição entre 30 e 100 dias', pontos: 1 },
      { valor: '0', rotulo: 'Queda em ≤ 4 dias sem exposição prévia', pontos: 0 },
    ]),
    campoOpc('trombose', 'Trombose ou outra sequela', [
      { valor: '2', rotulo: 'Nova trombose confirmada, necrose cutânea no local da injeção, ou reação sistêmica aguda após bolus endovenoso', pontos: 2 },
      { valor: '1', rotulo: 'Trombose progressiva ou recorrente, lesões cutâneas eritematosas, trombose suspeita não confirmada', pontos: 1 },
      { valor: '0', rotulo: 'Nenhuma', pontos: 0 },
    ]),
    campoOpc('outras', 'Outras causas de trombocitopenia', [
      { valor: '2', rotulo: 'Nenhuma outra causa aparente', pontos: 2 },
      { valor: '1', rotulo: 'Possível outra causa', pontos: 1 },
      { valor: '0', rotulo: 'Outra causa definida', pontos: 0 },
    ]),
  ],
  calcular: (v) => {
    const ids = ['trombocitopenia', 'tempo', 'trombose', 'outras']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total <= 3 ? 0 : total <= 5 ? 1 : 2
    const prob = ['< 1%', '10 a 14%', '~64%'][faixa]
    return {
      titulo: 'Escore 4Ts',
      valor: String(total),
      unidade: 'de 8 pontos',
      nivel: (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Probabilidade baixa', 'Probabilidade intermediária', 'Probabilidade alta'][faixa],
      detalhes: [{ rotulo: 'Probabilidade de trombocitopenia induzida por heparina', valor: prob }],
      interpretacao: [
        faixa === 0
          ? '**Probabilidade baixa (0 a 3 pontos).** O valor preditivo negativo é alto — próximo de 99%. Nessa faixa, o diagnóstico está praticamente excluído, a heparina pode ser mantida e a investigação laboratorial não é necessária.'
          : '**Probabilidade intermediária ou alta.** Três ações simultâneas: (1) **suspender toda heparina imediatamente**, inclusive lavagem de cateter e heparina de baixo peso molecular; (2) iniciar anticoagulante alternativo em **dose plena** — argatroban, bivalirudina ou fondaparinux; (3) solicitar imunoensaio para anticorpos anti-PF4/heparina e, se positivo, teste funcional (liberação de serotonina ou agregação induzida por heparina).',
        'O paradoxo definidor: apesar da plaquetopenia, a trombocitopenia induzida por heparina é um estado **protrombótico** intenso, com risco de trombose de 30 a 50% se não tratada. Trombose venosa é mais comum que arterial.',
        '**Nunca inicie varfarina isoladamente na fase aguda:** a queda rápida da proteína C precipita gangrena venosa de membro e necrose cutânea. Espere as plaquetas se recuperarem acima de 150 ×10⁹/L, sobreponha por pelo menos 5 dias com o anticoagulante parenteral e só então retire.',
        '**Não transfunda plaquetas** profilaticamente — pode alimentar a trombose. Reserve para sangramento significativo.',
      ],
      alertas: faixa > 0 ? ['Não espere o resultado do laboratório para suspender a heparina. O imunoensaio tem sensibilidade alta e especificidade baixa; o teste funcional é confirmatório mas demora.'] : undefined,
    }
  },
  formula: ['4 domínios (Trombocitopenia, Tempo, Trombose, ouTras causas), 0 a 2 pontos cada'],
  fundamento:
    'A trombocitopenia induzida por heparina é mediada por anticorpos IgG contra o complexo formado entre heparina e fator plaquetário 4. Esses imunocomplexos ativam plaquetas pelo receptor FcγRIIa, gerando micropartículas procoagulantes e trombina em excesso — daí a trombose com plaqueta baixa. O intervalo de 5 a 10 dias reflete o tempo de produção dos anticorpos, e é essa cinética que faz do "tempo" um dos quatro domínios.',
  armadilhas: [
    'O imunoensaio (ELISA) é muito sensível e pouco específico: anticorpos aparecem em até 50% dos pacientes de cirurgia cardíaca sem a síndrome. Positividade isolada não faz diagnóstico.',
    'Trombocitopenia induzida por heparina "de início tardio" pode surgir dias após a alta, com a heparina já suspensa.',
  ],
  referencias: [
    { texto: 'Lo GK, Juhl D, Warkentin TE, et al. Evaluation of pretest clinical score (4 T’s) for the diagnosis of heparin-induced thrombocytopenia. J Thromb Haemost. 2006;4(4):759-765.' },
    { texto: 'Cuker A, Arepally GM, Chong BH, et al. American Society of Hematology 2018 guidelines for management of venous thromboembolism: heparin-induced thrombocytopenia. Blood Adv. 2018;2(22):3360-3392.' },
  ],
}

const isth: Ferramenta = {
  id: 'isth-civd',
  nome: 'Escore ISTH para coagulação intravascular disseminada',
  sinonimos: ['civd', 'cid', 'isth', 'coagulacao intravascular disseminada'],
  resumo: 'Diagnostica CIVD manifesta em quatro variáveis laboratoriais.',
  categorias: ['hematologia', 'emergencia'],
  campos: [
    campoOpc('plaquetas', 'Plaquetas', [
      { valor: '0', rotulo: '≥ 100 ×10⁹/L', pontos: 0 },
      { valor: '1', rotulo: '50 a 99 ×10⁹/L', pontos: 1 },
      { valor: '2', rotulo: '< 50 ×10⁹/L', pontos: 2 },
    ]),
    campoOpc('dimero', 'Marcadores de fibrina (D-dímero ou produtos de degradação)', [
      { valor: '0', rotulo: 'Sem aumento', pontos: 0 },
      { valor: '2', rotulo: 'Aumento moderado', pontos: 2 },
      { valor: '3', rotulo: 'Aumento acentuado', pontos: 3 },
    ]),
    campoOpc('tp', 'Prolongamento do tempo de protrombina', [
      { valor: '0', rotulo: '< 3 s', pontos: 0 },
      { valor: '1', rotulo: '3 a 6 s', pontos: 1 },
      { valor: '2', rotulo: '> 6 s', pontos: 2 },
    ]),
    campoOpc('fibrinogenio', 'Fibrinogênio', [
      { valor: '0', rotulo: '≥ 100 mg/dL', pontos: 0 },
      { valor: '1', rotulo: '< 100 mg/dL', pontos: 1 },
    ]),
    campoSimNao('condicao', 'Existe condição de base associada a CIVD', 1, 'Sepse, trauma grave, neoplasia, complicação obstétrica, hemólise, aneurisma, hepatopatia grave, reação transfusional.'),
  ],
  calcular: (v) => {
    const ids = ['plaquetas', 'dimero', 'tp', 'fibrinogenio']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const temCondicao = sim(v, 'condicao')
    const manifesta = temCondicao && total >= 5
    return {
      titulo: manifesta ? 'CIVD manifesta' : 'Critérios não preenchidos',
      valor: String(total),
      unidade: 'de 8 pontos',
      nivel: manifesta ? 'critico' : total >= 3 ? 'alerta' : 'ok',
      rotuloNivel: !temCondicao ? '⚠ Sem condição de base — o escore não se aplica' : manifesta ? 'Escore ≥ 5' : 'Escore < 5 — repetir em 24 a 48 h',
      detalhes: [
        { rotulo: 'Condição de base presente', valor: temCondicao ? 'Sim' : 'Não', nota: 'É pré-requisito absoluto: sem doença de base compatível, o escore não deve ser aplicado.', nivel: temCondicao ? 'alerta' : 'atencao' },
        { rotulo: 'Ponto de corte', valor: '≥ 5 pontos' },
      ],
      interpretacao: [
        manifesta
          ? '**CIVD manifesta.** A mortalidade é alta e determinada sobretudo pela doença de base.'
          : temCondicao
            ? 'Escore abaixo de 5: pode ser CIVD não manifesta (fase compensada). **Repita o escore em 24 a 48 horas** — a tendência importa mais do que o valor isolado.'
            : 'Sem condição de base compatível, procure outra explicação para as alterações: hepatopatia, deficiência de vitamina K, anticoagulante, microangiopatia trombótica.',
        '**O tratamento é o da causa.** Nenhuma medida hematológica reverte a CIVD enquanto o gatilho persistir — antibiótico e controle de foco na sepse, esvaziamento uterino na complicação obstétrica, quimioterapia na leucemia promielocítica.',
        '**Transfusão é guiada por sangramento, não por número.** Plasma fresco congelado se houver sangramento com INR alargado; crioprecipitado se fibrinogênio abaixo de 100 a 150 mg/dL; plaquetas se abaixo de 50 ×10⁹/L com sangramento (ou abaixo de 20 sem sangramento, em alto risco).',
        'Heparina em dose profilática está indicada quando predomina o **fenótipo trombótico** e não há sangramento — CIVD crônica de neoplasia, púrpura fulminante, tromboembolismo associado. Na CIVD hemorrágica aguda, contraindicada.',
        'A leucemia promielocítica aguda é a exceção clássica: cursa com CIVD hiperfibrinolítica, sangramento grave e mortalidade precoce alta. O ácido all-trans-retinoico deve ser iniciado **na suspeita**, antes da confirmação citogenética.',
      ],
    }
  },
  formula: ['Soma de 4 variáveis laboratoriais; ≥ 5 pontos define CIVD manifesta, exigindo condição de base compatível'],
  fundamento:
    'A CIVD é a ativação sistêmica e desregulada da coagulação, com consumo simultâneo de plaquetas e fatores. O escore mede as quatro consequências laboratoriais desse consumo: plaquetas caem, produtos de degradação de fibrina sobem, o tempo de protrombina alarga e o fibrinogênio cai. A exigência de uma condição de base é deliberada — sem gatilho, não há CIVD, e a especificidade despencaria.',
  armadilhas: [
    'O fibrinogênio é proteína de fase aguda e pode estar **normal ou alto** na CIVD associada à sepse, mesmo com consumo intenso. Valor normal não exclui.',
    'Hepatopatia grave imita CIVD em todos os parâmetros. O fator VIII ajuda a separar: normal ou alto na hepatopatia (é produzido no endotélio), baixo na CIVD.',
  ],
  referencias: [
    { texto: 'Taylor FB Jr, Toh CH, Hoots WK, et al. Towards definition, clinical and laboratory criteria, and a scoring system for disseminated intravascular coagulation. Thromb Haemost. 2001;86(5):1327-1330.' },
    { texto: 'Levi M, Toh CH, Thachil J, Watson HG. Guidelines for the diagnosis and management of disseminated intravascular coagulation. Br J Haematol. 2009;145(1):24-33.' },
  ],
}

const ganzoni: Ferramenta = {
  id: 'ganzoni',
  nome: 'Reposição de ferro pela fórmula de Ganzoni',
  sinonimos: ['ganzoni', 'ferro endovenoso', 'deficit de ferro', 'ferropenia tratamento'],
  resumo: 'Calcula o déficit total de ferro e a dose de reposição oral ou endovenosa.',
  categorias: ['hematologia', 'nutricao'],
  campos: [
    campoPeso(),
    campoNum('hbAtual', 'Hemoglobina atual', { unidade: 'g/dL', min: 3, max: 16, passo: 0.1 }),
    campoNum('hbAlvo', 'Hemoglobina alvo', { unidade: 'g/dL', min: 10, max: 16, passo: 0.1, padrao: '15', ajuda: '15 g/dL para adultos com peso acima de 35 kg; 13 g/dL para os abaixo.' }),
    campoNum('reserva', 'Ferro de reserva a repor', { unidade: 'mg', min: 0, max: 1000, passo: 50, padrao: '500', ajuda: '500 mg em adultos com peso acima de 35 kg; 15 mg/kg nos abaixo.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const hbA = num(v, 'hbAtual')
    const hbAlvo = numOu(v, 'hbAlvo', 15)
    const reserva = numOu(v, 'reserva', 500)
    if (peso === null || hbA === null) return null
    const deficit = peso * (hbAlvo - hbA) * 2.4 + reserva
    const carboximaltose = Math.ceil(deficit / 500) * 500
    const sacarato = Math.ceil(deficit / 200)
    return {
      titulo: 'Déficit total de ferro',
      valor: fmtInt(deficit),
      unidade: 'mg',
      nivel: 'neutro',
      rotuloNivel: `Para elevar a hemoglobina de ${fmt(hbA, 1)} a ${fmt(hbAlvo, 1)} g/dL`,
      detalhes: [
        { rotulo: 'Ferro para corrigir a anemia', valor: `${fmtInt(peso * (hbAlvo - hbA) * 2.4)} mg` },
        { rotulo: 'Ferro para repor o estoque', valor: `${fmtInt(reserva)} mg` },
        { rotulo: 'Carboximaltose férrica', valor: `${fmtInt(carboximaltose)} mg`, nota: 'Até 1000 mg por infusão, em 15 min. Habitualmente 1 a 2 aplicações resolvem. Monitorize fosfato — hipofosfatemia é efeito adverso comum e às vezes prolongado.' },
        { rotulo: 'Sacarato férrico', valor: `${sacarato} aplicações de 200 mg`, nota: 'Máximo de 200 mg por sessão, até 3 vezes por semana. Mais barato e mais disponível, ao custo de mais visitas.' },
        { rotulo: 'Ferro oral (sulfato ferroso)', valor: `${fmtInt(deficit / 0.1)} mg de ferro elementar ingeridos`, nota: 'Assumindo absorção de apenas 10%. Um comprimido de sulfato ferroso 300 mg contém 60 mg de ferro elementar.' },
      ],
      interpretacao: [
        '**A dose oral mudou.** A administração em **dias alternados e em dose única diária** absorve mais ferro total do que a dose fracionada diária: cada dose eleva a hepcidina por 24 a 48 horas, bloqueando a absorção das doses seguintes. Estudos de Moretti e Stoffel demonstraram que 60 mg de ferro elementar em dias alternados absorve mais do que 60 mg duas vezes ao dia.',
        '**Indicações de ferro endovenoso:** intolerância ou falha do ferro oral, má absorção (doença celíaca, gastrectomia, cirurgia bariátrica, doença inflamatória intestinal ativa), necessidade de correção rápida (pré-operatório, gestação avançada), perda contínua que supera a absorção, doença renal crônica e insuficiência cardíaca com deficiência de ferro.',
        'Na **insuficiência cardíaca com fração de ejeção reduzida**, a carboximaltose férrica melhora sintomas e reduz hospitalizações mesmo **sem anemia**, desde que haja deficiência de ferro (ferritina < 100, ou 100 a 299 com saturação < 20%).',
        'A resposta esperada ao tratamento adequado: reticulocitose em 5 a 7 dias, elevação de cerca de 1 g/dL de hemoglobina a cada 2 a 3 semanas. Mantenha por 3 meses após normalizar a hemoglobina para repor o estoque.',
      ],
      alertas: ['**Ferropenia em homem adulto ou em mulher pós-menopausa exige investigação do trato digestivo** — endoscopia alta e colonoscopia. Repor ferro sem investigar a causa pode mascarar neoplasia colorretal por meses.'],
    }
  },
  formula: ['Déficit (mg) = peso (kg) × (Hb alvo − Hb atual) × 2,4 + ferro de reserva'],
  fundamento:
    'O fator 2,4 vem da aritmética do ferro corporal: o volume sanguíneo é cerca de 7% do peso (70 mL/kg), e cada grama de hemoglobina contém 3,4 mg de ferro. Multiplicando 0,07 dL/kg por 3,4 mg/g e por 10 (conversão de unidades), chega-se a 2,4. O termo de reserva existe porque corrigir só a hemoglobina deixa o estoque vazio e a anemia recidiva.',
  armadilhas: [
    'Ferro oral tem absorção baixa e efeitos gastrointestinais frequentes, que comprometem a adesão. Sulfato, gluconato e fumarato têm quantidades diferentes de ferro elementar — confira antes de calcular.',
    'Vitamina C aumenta modestamente a absorção; cálcio, chá, café, antiácido e inibidor de bomba de prótons a reduzem.',
    'Reações de hipersensibilidade ao ferro endovenoso são raras com as formulações modernas, mas exigem observação por 30 minutos após a infusão.',
  ],
  referencias: [
    { texto: 'Ganzoni AM. Intravenous iron-dextran: therapeutic and experimental possibilities. Schweiz Med Wochenschr. 1970;100(7):301-303.' },
    { texto: 'Stoffel NU, Cercamondi CI, Brittenham G, et al. Iron absorption from oral iron supplements given on consecutive versus alternate days. Lancet Haematol. 2017;4(11):e524-e533.' },
    { texto: 'Ponikowski P, Kirwan BA, Anker SD, et al. Ferric carboxymaltose for iron deficiency at discharge after acute heart failure (AFFIRM-AHF). Lancet. 2020;396(10266):1895-1904.' },
  ],
}

const liseTumoral: Ferramenta = {
  id: 'sindrome-lise-tumoral',
  nome: 'Risco e critérios de síndrome de lise tumoral',
  sinonimos: ['lise tumoral', 'cairo bishop', 'rasburicase', 'acido urico'],
  resumo: 'Estratifica o risco e aplica os critérios de Cairo-Bishop.',
  categorias: ['hematologia', 'nefrologia'],
  campos: [
    campoOpc('risco', 'Categoria tumoral', [
      { valor: 'alto', rotulo: 'Alto risco — leucemia de Burkitt, leucemia linfoblástica aguda com leucócitos > 100.000, linfoma de Burkitt avançado, leucemia mieloide aguda com leucócitos > 100.000' },
      { valor: 'intermediario', rotulo: 'Risco intermediário — linfomas agressivos, leucemia mieloide aguda com leucócitos de 25.000 a 100.000, tumor sólido muito quimiossensível e volumoso' },
      { valor: 'baixo', rotulo: 'Baixo risco — maioria dos tumores sólidos, linfomas indolentes, leucemias crônicas' },
    ]),
    campoNum('acidoUrico', 'Ácido úrico', { unidade: 'mg/dL', min: 1, max: 30, passo: 0.1, normalMin: 3, normalMax: 7 }),
    campoNum('potassio', 'Potássio', { unidade: 'mEq/L', min: 2, max: 9, passo: 0.1 }),
    campoNum('fosforo', 'Fósforo', { unidade: 'mg/dL', min: 1, max: 15, passo: 0.1, normalMin: 2.5, normalMax: 4.5 }),
    campoNum('calcio', 'Cálcio corrigido', { unidade: 'mg/dL', min: 3, max: 15, passo: 0.1 }),
    campoNum('creatinina', 'Creatinina', { unidade: 'mg/dL', min: 0.1, max: 15, passo: 0.01 }),
    campoNum('creatininaBasal', 'Creatinina basal', { unidade: 'mg/dL', min: 0.1, max: 8, passo: 0.01, padrao: '1' }),
  ],
  calcular: (v) => {
    const risco = opc(v, 'risco')
    const au = num(v, 'acidoUrico')
    const k = num(v, 'potassio')
    const p = num(v, 'fosforo')
    const ca = num(v, 'calcio')
    const cr = num(v, 'creatinina')
    const crB = numOu(v, 'creatininaBasal', 1)
    if (au === null || k === null || p === null || ca === null || cr === null) return null
    const criterios = [au >= 8, k >= 6, p >= 4.5, ca <= 7].filter(Boolean).length
    const laboratorial = criterios >= 2
    const clinica = laboratorial && (cr >= 1.5 * crB || false)
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Ácido úrico ≥ 8 mg/dL', valor: au >= 8 ? `Sim (${fmt(au, 1)})` : `Não (${fmt(au, 1)})`, nivel: au >= 8 ? 'alerta' : 'ok' },
      { rotulo: 'Potássio ≥ 6 mEq/L', valor: k >= 6 ? `Sim (${fmt(k, 1)})` : `Não (${fmt(k, 1)})`, nivel: k >= 6 ? 'critico' : 'ok' },
      { rotulo: 'Fósforo ≥ 4,5 mg/dL', valor: p >= 4.5 ? `Sim (${fmt(p, 1)})` : `Não (${fmt(p, 1)})`, nivel: p >= 4.5 ? 'alerta' : 'ok' },
      { rotulo: 'Cálcio corrigido ≤ 7 mg/dL', valor: ca <= 7 ? `Sim (${fmt(ca, 1)})` : `Não (${fmt(ca, 1)})`, nivel: ca <= 7 ? 'alerta' : 'ok' },
      { rotulo: 'Creatinina ≥ 1,5 × basal', valor: cr >= 1.5 * crB ? 'Sim' : 'Não', nota: 'Critério clínico, junto com arritmia, convulsão ou morte súbita.', nivel: cr >= 1.5 * crB ? 'critico' : 'ok' },
      { rotulo: 'Produto cálcio × fósforo', valor: fmt(ca * p, 1), nota: 'Acima de 60 mg²/dL² há risco de precipitação de fosfato de cálcio nos túbulos renais e nos tecidos.', nivel: ca * p > 60 ? 'alerta' : 'ok' },
    ]
    const nivel: Nivel = clinica ? 'critico' : laboratorial ? 'alerta' : risco === 'alto' ? 'atencao' : 'ok'
    return {
      titulo: clinica ? 'Síndrome de lise tumoral clínica' : laboratorial ? 'Síndrome de lise tumoral laboratorial' : 'Critérios não preenchidos',
      valor: `${criterios} de 4 critérios laboratoriais`,
      nivel,
      rotuloNivel: `Categoria tumoral de ${risco === 'alto' ? 'alto' : risco === 'intermediario' ? 'risco intermediário' : 'baixo'} risco`,
      detalhes,
      interpretacao: [
        '**Cairo-Bishop:** a forma **laboratorial** exige 2 ou mais alterações metabólicas (ácido úrico, potássio, fósforo ou cálcio) entre 3 dias antes e 7 dias após o início da quimioterapia. A forma **clínica** acrescenta pelo menos uma consequência: lesão renal aguda, arritmia, convulsão ou morte súbita.',
        risco === 'alto'
          ? '**Alto risco: hidratação vigorosa (2 a 3 L/m²/dia) + rasburicase.** A rasburicase é urato oxidase recombinante: converte ácido úrico em alantoína, que é muito mais solúvel, e reduz o urato em horas — muito mais rápido que o alopurinol, que apenas bloqueia a formação de novo urato.'
          : risco === 'intermediario'
            ? '**Risco intermediário: hidratação + alopurinol.** Reserve a rasburicase para quem desenvolver hiperuricemia apesar da profilaxia.'
            : 'Baixo risco: hidratação adequada e monitorização laboratorial costumam bastar.',
        '**Alcalinização urinária não é mais recomendada.** Ela aumenta a solubilidade do ácido úrico mas **reduz** a do fosfato de cálcio, favorecendo nefrocalcinose — e a rasburicase tornou a manobra desnecessária.',
        '**Não corrija a hipocalcemia assintomática.** Com o fósforo alto, repor cálcio precipita fosfato de cálcio nos tecidos. Trate apenas se houver tetania, convulsão ou arritmia.',
        'Monitorize eletrólitos, ácido úrico, fósforo, cálcio e creatinina a cada 4 a 8 horas nos pacientes de alto risco durante os primeiros dias de tratamento.',
      ],
      alertas: ['Rasburicase é contraindicada na deficiência de glicose-6-fosfato desidrogenase — causa hemólise grave e metemoglobinemia. Rastreie antes em populações de risco. Amostras para dosagem de ácido úrico após rasburicase devem ser transportadas em gelo, ou o resultado vem falsamente baixo.'],
    }
  },
  formula: ['Laboratorial: 2 ou mais de — ácido úrico ≥ 8 | K ≥ 6 | fósforo ≥ 4,5 | cálcio ≤ 7', 'Clínica: laboratorial + creatinina ≥ 1,5× basal, arritmia, convulsão ou morte súbita'],
  fundamento:
    'A síndrome resulta da lise maciça e súbita de células tumorais, que despejam na circulação o conteúdo intracelular: potássio, fósforo e ácidos nucleicos. Os ácidos nucleicos são catabolizados a ácido úrico, que precipita nos túbulos renais em pH ácido. O fósforo liberado se liga ao cálcio, causando hipocalcemia e precipitando fosfato de cálcio nos rins. O resultado é lesão renal aguda por dois mecanismos simultâneos.',
  armadilhas: [
    'Pode ocorrer **espontaneamente**, antes de qualquer tratamento, em tumores de altíssima taxa proliferativa — Burkitt é o exemplo clássico.',
    'Hipocalcemia sintomática nesse contexto é uma armadilha terapêutica: a reposição pode piorar a lesão renal.',
  ],
  referencias: [
    { texto: 'Cairo MS, Bishop M. Tumour lysis syndrome: new therapeutic strategies and classification. Br J Haematol. 2004;127(1):3-11.' },
    { texto: 'Coiffier B, Altman A, Pui CH, Younes A, Cairo MS. Guidelines for the management of pediatric and adult tumor lysis syndrome. J Clin Oncol. 2008;26(16):2767-2778.' },
  ],
}

const conversorHemato: Ferramenta = {
  id: 'conversor-unidades-hematologicas',
  nome: 'Conversor de unidades hematológicas',
  sinonimos: ['conversao hemograma', 'unidades si', 'hemoglobina mmol'],
  resumo: 'Converte entre unidades convencionais e do sistema internacional.',
  categorias: ['hematologia'],
  campos: [
    campoOpc('parametro', 'Parâmetro', [
      { valor: 'hb', rotulo: 'Hemoglobina (g/dL ↔ g/L ↔ mmol/L)' },
      { valor: 'plaquetas', rotulo: 'Plaquetas (/mm³ ↔ ×10⁹/L)' },
      { valor: 'leucocitos', rotulo: 'Leucócitos (/mm³ ↔ ×10⁹/L)' },
      { valor: 'ferritina', rotulo: 'Ferritina (ng/mL ↔ µg/L ↔ pmol/L)' },
      { valor: 'ferro', rotulo: 'Ferro sérico (µg/dL ↔ µmol/L)' },
      { valor: 'b12', rotulo: 'Vitamina B12 (pg/mL ↔ pmol/L)' },
      { valor: 'folato', rotulo: 'Folato (ng/mL ↔ nmol/L)' },
    ], { ajuda: 'Escolha o analito primeiro: cada um tem seu próprio fator, derivado do peso molecular. Contagens celulares (plaquetas e leucócitos) não têm fator de verdade — só mudam de potência de dez.' }),
    campoNum('valor', 'Valor a converter', { min: 0, max: 1000000, passo: 0.01, ajuda: 'Digite o número exatamente como está no laudo, sem converter mentalmente. Para plaquetas e leucócitos, informe em /mm³ (ex.: 250000, não 250).' }),
  ],
  calcular: (v) => {
    const p = opc(v, 'parametro')
    const x = num(v, 'valor')
    if (x === null) return null
    const tabelas: Record<string, { linhas: string[][]; nota: string }> = {
      hb: {
        linhas: [
          ['g/dL', fmt(x, 2)],
          ['g/L', fmt(x * 10, 1)],
          ['mmol/L', fmt(x * 0.6206, 2)],
        ],
        nota: 'Referência: 13 a 17 g/dL em homens, 12 a 15 g/dL em mulheres. O fator 0,6206 assume peso molecular do monômero de hemoglobina.',
      },
      plaquetas: {
        linhas: [
          ['/mm³ (= /µL)', fmtInt(x)],
          ['×10⁹/L', fmt(x / 1000, 1)],
          ['×10³/µL', fmt(x / 1000, 1)],
        ],
        nota: 'Referência: 150.000 a 450.000/mm³, ou 150 a 450 ×10⁹/L. São o mesmo número em escalas diferentes.',
      },
      leucocitos: {
        linhas: [
          ['/mm³', fmtInt(x)],
          ['×10⁹/L', fmt(x / 1000, 2)],
        ],
        nota: 'Referência: 4.000 a 11.000/mm³.',
      },
      ferritina: {
        linhas: [
          ['ng/mL', fmt(x, 1)],
          ['µg/L', fmt(x, 1)],
          ['pmol/L', fmt(x * 2.247, 1)],
        ],
        nota: 'ng/mL e µg/L são numericamente idênticos. Referência: 30 a 300 ng/mL em homens, 15 a 200 em mulheres.',
      },
      ferro: {
        linhas: [
          ['µg/dL', fmt(x, 1)],
          ['µmol/L', fmt(x * 0.179, 2)],
        ],
        nota: 'Referência: 60 a 170 µg/dL. Sofre variação circadiana ampla — colha pela manhã, em jejum.',
      },
      b12: {
        linhas: [
          ['pg/mL', fmtInt(x)],
          ['pmol/L', fmt(x * 0.738, 1)],
        ],
        nota: 'Referência: 200 a 900 pg/mL. Entre 200 e 350 é zona indeterminada — dose ácido metilmalônico e homocisteína.',
      },
      folato: {
        linhas: [
          ['ng/mL', fmt(x, 2)],
          ['nmol/L', fmt(x * 2.266, 2)],
        ],
        nota: 'Referência: acima de 4 ng/mL. O folato eritrocitário reflete melhor o estoque que o sérico.',
      },
    }
    const t = tabelas[p]
    return {
      titulo: 'Conversão',
      valor: t.linhas[1][1],
      unidade: t.linhas[1][0],
      nivel: 'neutro',
      detalhes: t.linhas.map(([u, val]) => ({ rotulo: u, valor: val })),
      interpretacao: [
        t.nota,
        'O sistema internacional é o padrão na Europa; o convencional predomina no Brasil e nos Estados Unidos. Sempre confira a unidade antes de comparar resultados de laboratórios diferentes ou de artigos internacionais.',
        'Há duas naturezas distintas de conversão aqui, e confundi-las é a origem dos erros graves. **Concentrações de massa** (hemoglobina, ferritina, ferro, B12, folato) convertem para concentração molar dividindo pelo peso molecular do analito — daí os fatores quebrados como 0,179 para o ferro (peso atômico 55,85) e 0,738 para a B12 (peso molecular 1.355). Já **contagens celulares** (plaquetas, leucócitos) não são massa nem mol: são número de partículas por volume, e a passagem de /mm³ para ×10⁹/L é apenas a troca de um volume de referência por outro (1 mm³ = 1 µL = 10⁻⁶ L), ou seja, uma divisão por mil. Nenhuma química está envolvida, apenas notação — e é justamente por ser trivial que o erro passa.',
        p === 'hb'
          ? 'O caso da hemoglobina merece atenção especial: existem **dois** fatores de conversão para mmol/L em circulação. O fator 0,6206 usado aqui assume o monômero (peso molecular de aproximadamente 16.114 Da, um grupo heme). Alguns laboratórios europeus usam o tetrâmero (peso molecular ~64.500 Da), cujo fator é quatro vezes menor (0,1551). Uma hemoglobina de 14 g/dL vira 8,7 mmol/L pela convenção do monômero e 2,2 mmol/L pela do tetrâmero. Ao ler literatura holandesa, escandinava ou alemã, confirme qual convenção o laudo usa antes de concluir que o paciente está anêmico.'
          : p === 'ferritina'
            ? 'A identidade numérica entre ng/mL e µg/L não é coincidência: 1 ng/mL = 1 µg/L exatamente, porque tanto o numerador quanto o denominador foram multiplicados por mil. O mesmo vale para µg/dL e outras duplas equivalentes — quando um laudo troca de unidade sem trocar o número, geralmente é esse o motivo, e não erro.'
            : 'Quando duas unidades diferentes exibem o mesmo número (como ng/mL e µg/L), é porque numerador e denominador foram escalados pelo mesmo fator. Não é erro de digitação do laboratório.',
      ],
      conduta: [
        'Ao receber exame de fora do país ou comparar com valor de referência de artigo internacional, converta **antes** de interpretar, e registre no prontuário a unidade usada. A maioria dos erros de conduta por unidade nasce de comparar um valor convertido com uma referência não convertida.',
        p === 'plaquetas'
          ? 'Plaquetas: antes de agir sobre uma contagem muito baixa, descarte **pseudotrombocitopenia** por agregação plaquetária dependente de EDTA — pedindo esfregaço de sangue periférico e, se confirmada a agregação, recoleta em citrato. É a causa mais comum de "plaquetopenia grave" em paciente assintomático, e já motivou transfusões e internações desnecessárias.'
          : p === 'b12'
            ? 'B12 entre 200 e 350 pg/mL é zona indeterminada e não deve ser interpretada isoladamente: dose **ácido metilmalônico** e **homocisteína**, que se elevam na deficiência tecidual real antes de a dosagem sérica cair. Em paciente com manifestação neurológica compatível, trate mesmo com B12 sérica normal — o dano medular é potencialmente irreversível e a reposição é inócua.'
            : p === 'ferro'
              ? 'Ferro sérico isolado não diagnostica nada: tem variação circadiana de até 30% e cai em qualquer inflamação aguda por ação da hepcidina. Interprete sempre junto com ferritina, transferrina e índice de saturação, e prefira coleta matinal em jejum.'
              : p === 'ferritina'
                ? 'Ferritina é reagente de fase aguda e sobe na inflamação, na hepatopatia e na neoplasia, podendo mascarar deficiência de ferro real. Em contexto inflamatório, o corte de deficiência sobe de 30 para 100 ng/mL (ou até 300 com saturação de transferrina < 20%). Dose proteína C reativa junto.'
                : p === 'folato'
                  ? 'Folato sérico reflete ingestão recente e normaliza com uma única refeição adequada; para avaliar estoque, peça folato eritrocitário. E nunca reponha folato antes de excluir deficiência de B12: o folato corrige a anemia megaloblástica e deixa a degeneração medular progredir sem o aviso hematológico.'
                  : 'Confira a unidade do laudo contra a faixa de referência impressa no próprio laudo — laboratórios idôneos sempre informam as duas juntas, e essa é a checagem mais rápida contra erro de escala.',
        'Ao prescrever ou ajustar conduta com base num valor convertido, escreva as duas unidades na evolução (por exemplo, "Hb 14 g/dL = 8,7 mmol/L"). Isso torna o erro visível para o próximo leitor em vez de invisível.',
      ],
      alertas: [
        'Erro de potência de dez em plaquetas é a confusão de unidade com maior potencial de dano deste conversor: ler 250 ×10⁹/L como 250/mm³ sugere plaquetopenia catastrófica onde a contagem é normal, e o inverso pode deixar passar uma trombocitopenia grave.',
        'Este conversor faz aritmética, não interpretação laboratorial. Nenhum valor convertido substitui a faixa de referência do laboratório que realizou o exame, que varia com método, equipamento e população.',
      ],
      tabela: {
        titulo: 'Fatores de conversão usados',
        colunas: ['Analito', 'Convencional', 'SI', 'Fator'],
        linhas: [
          ['Hemoglobina', 'g/dL', 'g/L', '× 10'],
          ['Hemoglobina', 'g/dL', 'mmol/L', '× 0,6206 (monômero)'],
          ['Plaquetas e leucócitos', '/mm³', '×10⁹/L', '÷ 1000'],
          ['Ferritina', 'ng/mL', 'µg/L', '× 1 (idênticos)'],
          ['Ferro sérico', 'µg/dL', 'µmol/L', '× 0,179'],
          ['Vitamina B12', 'pg/mL', 'pmol/L', '× 0,738'],
          ['Folato', 'ng/mL', 'nmol/L', '× 2,266'],
        ],
        destaque: p === 'hb' ? 0 : p === 'plaquetas' || p === 'leucocitos' ? 2 : p === 'ferritina' ? 3 : p === 'ferro' ? 4 : p === 'b12' ? 5 : 6,
      },
    }
  },
  formula: ['Hb: g/dL × 10 = g/L | g/dL × 0,6206 = mmol/L', 'Ferro: µg/dL × 0,179 = µmol/L', 'B12: pg/mL × 0,738 = pmol/L'],
  fundamento:
    'Os fatores de conversão derivam do peso molecular de cada analito: converter uma concentração de massa (g/dL) em concentração molar (mmol/L) é dividir pela massa de um mol da substância, e é dessa divisão que saem os números quebrados. O ferro tem fator 0,179 porque seu peso atômico é 55,85; a vitamina B12 tem fator 0,738 porque a cianocobalamina pesa 1.355 Da. Para grandezas que são apenas contagens — plaquetas, leucócitos —, não há conversão de fato, apenas mudança de potência de dez, o que é fonte frequente de erro de leitura de exames importados: 1 mm³ é exatamente 1 µL e exatamente 10⁻⁶ L, de modo que dividir por mil é toda a operação. A razão de o sistema internacional existir é boa: expressar concentrações em mol permite comparar diretamente quantidades de moléculas que reagem entre si, o que importa em estequiometria e em fisiologia de transporte. A razão de ele não ter sido adotado universalmente também é boa: as faixas de referência, os protocolos e a memória clínica de gerações de médicos estão em unidades convencionais, e trocar a unidade sem trocar o hábito produz mais erro do que precisão. O resultado é que a medicina convive com dois sistemas, e a conversão deixou de ser curiosidade acadêmica para se tornar habilidade de segurança do paciente — sobretudo com laudos de laboratórios internacionais, literatura europeia e calculadoras online que não declaram qual convenção adotam.',
  armadilhas: [
    'Plaquetas de 250 ×10⁹/L são 250.000/mm³, não 250/mm³. Confundir as escalas gera pânico injustificado ou falsa tranquilidade.',
    'Existem duas convenções para hemoglobina em mmol/L: monômero (fator 0,6206) e tetrâmero (fator 0,1551). Uma Hb de 14 g/dL é 8,7 ou 2,2 mmol/L conforme a convenção, e a diferença de quatro vezes já foi confundida com anemia grave.',
    'ng/mL e µg/L são numericamente idênticos, assim como /mm³ e /µL. Quando o laudo troca a unidade e mantém o número, não é erro — é equivalência.',
    'Converter não valida: um valor mal colhido, hemolisado ou de tubo errado continua errado em qualquer unidade. Ferro sérico colhido à tarde e ferritina em vigência de infecção são exemplos clássicos.',
    'Faixas de referência não são universais. Variam com método analítico, equipamento, altitude, idade, sexo e gestação — use a do laboratório emissor, não a da memória.',
  ],
  referencias: [
    { texto: 'Kratz A, Ferraro M, Sluss PM, Lewandrowski KB. Laboratory reference values. N Engl J Med. 2004;351(15):1548-1563.' },
    { texto: 'Bureau International des Poids et Mesures. The International System of Units (SI). 9th edition, 2019.' },
    { texto: 'Clinical and Laboratory Standards Institute. Defining, Establishing, and Verifying Reference Intervals in the Clinical Laboratory. CLSI EP28-A3c.' },
  ],
}

const inrEstimado: Ferramenta = {
  id: 'inr-tempo-protrombina',
  nome: 'INR, atividade de protrombina e reversão da anticoagulação',
  sinonimos: ['inr', 'tempo de protrombina', 'rni', 'varfarina', 'reversao', 'escore de sangramento'],
  resumo: 'Converte entre INR, atividade e razão, e orienta a reversão da anticoagulação.',
  categorias: ['hematologia'],
  campos: [
    campoNum('inr', 'INR', { min: 0.8, max: 15, passo: 0.01 }),
    campoNum('isi', 'ISI do reagente', { min: 0.9, max: 2.5, passo: 0.01, padrao: '1.0', ajuda: 'Índice de sensibilidade internacional do reagente de tromboplastina usado pelo laboratório.' }),
    campoSeg('cenario', 'Cenário clínico', [
      { valor: 'sem-sangramento', rotulo: 'Sem sangramento' },
      { valor: 'sangramento-menor', rotulo: 'Sangramento menor' },
      { valor: 'sangramento-maior', rotulo: 'Sangramento maior ou cirurgia de urgência' },
    ]),
    campoPeso({ opcional: true }),
  ],
  calcular: (v) => {
    const inr = num(v, 'inr')
    const isi = numOu(v, 'isi', 1)
    const peso = num(v, 'peso')
    if (inr === null || inr <= 0) return null
    const razao = Math.pow(inr, 1 / isi)
    const atividade = Math.max(0, Math.min(100, 100 / Math.pow(inr, 1.6)))
    const cenario = opc(v, 'cenario')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Razão TP paciente / TP controle', valor: fmt(razao, 2), nota: `INR = (razão)^ISI, com ISI = ${fmt(isi, 2)}.` },
      { rotulo: 'Atividade de protrombina estimada', valor: fmtPct(atividade, 0), nota: 'Estimativa aproximada; a relação exata depende do reagente e do método.' },
      { rotulo: 'Faixa terapêutica usual da varfarina', valor: '2,0 a 3,0', nota: 'Prótese valvar mecânica mitral e alguns casos de síndrome antifosfolípide: 2,5 a 3,5.' },
    ]
    let conduta: string[] = []
    if (cenario === 'sangramento-maior') {
      const ccp = peso !== null ? `${fmtInt(peso * (inr > 6 ? 50 : inr > 4 ? 35 : 25))} UI` : '25 a 50 UI/kg conforme o INR'
      conduta = [
        `**Reversão imediata:** complexo protrombínico de 4 fatores (${ccp}) **mais** vitamina K 5 a 10 mg endovenosa lenta.`,
        'O complexo protrombínico age em minutos mas tem meia-vida curta; a vitamina K sustenta a reversão por dias. **As duas são obrigatórias em conjunto** — dar só o complexo produz rebote em 6 a 12 horas.',
        'Plasma fresco congelado é alternativa inferior: exige volume grande (15 mL/kg), demora a ser descongelado e reverte de forma incompleta.',
      ]
    } else if (cenario === 'sangramento-menor') {
      conduta = ['Suspenda a varfarina, considere vitamina K 1 a 2,5 mg por via oral, aplique medidas locais de hemostasia e reavalie o INR em 24 horas.']
    } else {
      if (inr > 10) conduta = ['INR acima de 10 sem sangramento: suspenda a varfarina e administre vitamina K 2,5 a 5 mg **por via oral**. Reavalie em 24 horas.']
      else if (inr > 4.5) conduta = ['INR entre 4,5 e 10 sem sangramento: suspenda 1 a 2 doses e reavalie. **Vitamina K de rotina não é recomendada** nessa faixa — não reduz sangramento e atrasa a reanticoagulação.']
      else if (inr >= 2) conduta = ['INR na faixa terapêutica. Mantenha a dose e o intervalo de controle.']
      else conduta = ['INR abaixo da faixa: risco trombótico. Ajuste a dose semanal em 10 a 20% e reavalie em 1 semana.']
    }
    const nivel: Nivel = inr > 5 ? 'critico' : inr > 3.5 ? 'alerta' : inr >= 2 ? 'ok' : 'atencao'
    return {
      titulo: 'INR',
      valor: fmt(inr, 2),
      nivel,
      rotuloNivel: inr > 4.5 ? 'Muito acima da faixa' : inr > 3 ? 'Acima da faixa' : inr >= 2 ? 'Dentro da faixa terapêutica' : 'Abaixo da faixa',
      detalhes,
      interpretacao: [
        ...conduta,
        'O INR foi criado para padronizar o tempo de protrombina entre laboratórios: cada lote de tromboplastina tem sensibilidade diferente, e o ISI corrige essa variação em relação a um padrão da Organização Mundial da Saúde.',
        '**O INR não mede risco de sangramento em quem não usa varfarina.** Em hepatopatia, o INR alargado reflete queda simultânea de fatores pró e anticoagulantes — o cirrótico não está "anticoagulado", e transfundir plasma para "corrigir" o INR antes de procedimento de baixo risco é prática sem benefício e com risco de sobrecarga.',
        'Anticoagulantes orais diretos podem alterar o INR de forma imprevisível e o exame **não** serve para monitorá-los.',
      ],
      alertas: inr > 4.5 ? ['Vitamina K endovenosa deve ser infundida lentamente (em 20 a 30 minutos, diluída) pelo risco de reação anafilactoide. A via intramuscular é evitada em anticoagulados pelo risco de hematoma.'] : undefined,
    }
  },
  formula: ['INR = (TP paciente / TP controle)^ISI', 'Atividade de protrombina ≈ 100 / INR^1,6'],
  fundamento:
    'O tempo de protrombina avalia a via extrínseca e a via comum, dependendo dos fatores VII, X, V, II e do fibrinogênio. Como o fator VII tem a meia-vida mais curta (4 a 6 horas), o tempo de protrombina é o primeiro a se alterar na deficiência de vitamina K, na hepatopatia aguda e no início da varfarina — o que explica por que a varfarina prolonga o INR antes de anticoagular de fato, e por que a sobreposição com heparina é necessária nos primeiros dias.',
  armadilhas: [
    'Nos primeiros dias de varfarina existe um estado **pró-trombótico transitório**: proteína C e proteína S têm meia-vida curta e caem antes dos fatores procoagulantes. Daí a necrose cutânea induzida por varfarina e a necessidade de sobreposição com heparina por pelo menos 5 dias.',
    'Tubo de coleta mal preenchido altera a relação citrato-plasma e prolonga falsamente o tempo de protrombina.',
  ],
  referencias: [
    { texto: 'Ageno W, Gallus AS, Wittkowsky A, et al. Oral anticoagulant therapy: antithrombotic therapy and prevention of thrombosis, 9ª ed. Chest. 2012;141(2 Suppl):e44S-e88S.' },
    { texto: 'Tripodi A, Mannucci PM. The coagulopathy of chronic liver disease. N Engl J Med. 2011;365(2):147-156.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  reticulocitos,
  hemogramaAbs,
  classificacaoAnemias,
  plaquetasCorrigidas,
  padua,
  caprini,
  quatroT,
  isth,
  ganzoni,
  liseTumoral,
  conversorHemato,
  inrEstimado,
]

export default ferramentas

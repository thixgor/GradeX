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
    campoNum('retic', 'Reticulócitos', { unidade: '%', min: 0, max: 40, passo: 0.1, normalMin: 0.5, normalMax: 2 }),
    campoNum('ht', 'Hematócrito', { unidade: '%', min: 5, max: 65, passo: 0.1 }),
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
      ],
    }
  },
  formula: [
    'Reticulócitos corrigidos = % reticulócitos × (hematócrito / hematócrito normal)',
    'IPR = reticulócitos corrigidos / fator de maturação',
    'Fator: Ht ≥ 35 → 1,0 | 25–34 → 1,5 | 20–24 → 2,0 | < 20 → 2,5',
  ],
  fundamento:
    'O reticulócito é a hemácia recém-liberada, ainda com RNA ribossômico residual, e permanece cerca de 1 dia na circulação em condições normais. Contá-los mede diretamente a taxa de produção eritroide dos últimos dias — é o equivalente hematológico de olhar para a linha de produção em vez do estoque.',
  armadilhas: [
    'Se o laboratório informa o valor **absoluto**, use-o: ele já contorna os dois vieses e não precisa de correção.',
    'Reticulocitose leva 3 a 5 dias para aparecer após uma hemorragia aguda ou após o início do tratamento de uma carência. Contagem baixa nas primeiras 48 horas não exclui capacidade de resposta.',
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
    campoNum('leucocitos', 'Leucócitos totais', { unidade: '/mm³', min: 50, max: 500000, passo: 100, normalMin: 4000, normalMax: 11000 }),
    campoNum('neutro', 'Neutrófilos segmentados', { unidade: '%', min: 0, max: 100, passo: 0.1 }),
    campoNum('bastoes', 'Bastonetes', { unidade: '%', min: 0, max: 60, passo: 0.1, padrao: '0' }),
    campoNum('linfo', 'Linfócitos', { unidade: '%', min: 0, max: 100, passo: 0.1 }),
    campoNum('mono', 'Monócitos', { unidade: '%', min: 0, max: 60, passo: 0.1, opcional: true }),
    campoNum('eos', 'Eosinófilos', { unidade: '%', min: 0, max: 60, passo: 0.1, opcional: true }),
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
      ],
    }
  },
  formula: ['Neutrófilos absolutos = leucócitos × (% segmentados + % bastonetes) / 100', 'Linfócitos absolutos = leucócitos × % linfócitos / 100'],
  fundamento:
    'O leucograma diferencial é reportado em percentuais por razões históricas do método manual, mas a defesa do organismo depende do número de células, não da proporção. Converter para valor absoluto é o passo mais simples e mais frequentemente esquecido da leitura do hemograma.',
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
    campoNum('pre', 'Plaquetas antes da transfusão', { unidade: '×10⁹/L', min: 0, max: 300, passo: 1 }),
    campoNum('pos', 'Plaquetas após a transfusão', { unidade: '×10⁹/L', min: 0, max: 500, passo: 1 }),
    campoNum('sc', 'Superfície corporal', { unidade: 'm²', min: 0.2, max: 3, passo: 0.01 }),
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
      ],
    }
  },
  formula: ['CCI = [(plaquetas pós − plaquetas pré) × superfície corporal] ÷ número de plaquetas transfundidas (×10¹¹)'],
  fundamento:
    'A contagem pós-transfusional bruta não permite comparar resposta entre pacientes nem entre doses. O CCI normaliza pelas duas variáveis que confundem a leitura — o tamanho do receptor e a dose transfundida —, permitindo dizer se a plaqueta transfundida sobreviveu ou foi destruída.',
  armadilhas: [
    'Colher a amostra pós-transfusional pelo mesmo cateter usado para transfundir contamina o resultado.',
    'Transfusão profilática de plaquetas está indicada abaixo de 10 ×10⁹/L em paciente estável; limiares maiores (20, 50 ou 100) valem conforme procedimento, sangramento e comorbidade.',
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
    campoSimNao('cirurgiaMenor', 'Cirurgia de pequeno porte', 1),
    campoSimNao('cirurgiaMaior', 'Cirurgia de grande porte (> 45 min) ou laparoscópica > 45 min', 2),
    campoSimNao('artroplastia', 'Artroplastia eletiva de membro inferior', 5),
    campoSimNao('fraturaQuadril', 'Fratura de quadril, pelve ou membro inferior', 5),
    campoSimNao('avcAgudo', 'AVC agudo (< 1 mês)', 5),
    campoSimNao('medular', 'Lesão medular aguda (< 1 mês)', 5),
    campoSimNao('tevPrevio', 'Tromboembolismo venoso prévio', 3),
    campoSimNao('historiaFamiliar', 'História familiar de tromboembolismo', 3),
    campoSimNao('trombofilia', 'Trombofilia laboratorial (fator V de Leiden, anticoagulante lúpico, anticardiolipina, mutação da protrombina, hiper-homocisteinemia)', 3),
    campoSimNao('obesidade', 'IMC > 25', 1),
    campoSimNao('imobilizacao', 'Repouso no leito por mais de 72 h', 2),
    campoSimNao('gesso', 'Imobilização gessada', 2),
    campoSimNao('cateter', 'Acesso venoso central', 2),
    campoSimNao('cancer', 'Neoplasia maligna atual ou prévia', 2),
    campoSimNao('varizes', 'Varizes de membros inferiores', 1),
    campoSimNao('edema', 'Edema de membros inferiores', 1),
    campoSimNao('sepse', 'Sepse (< 1 mês)', 1),
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
    'Caprini construiu o modelo nos anos 1990 a partir da literatura de fatores de risco, atribuindo pesos proporcionais à magnitude da associação. Os itens de 5 pontos — artroplastia, fratura de quadril, AVC e lesão medular — são justamente aqueles cujo risco de trombose sem profilaxia supera 40% em séries históricas.',
  armadilhas: [
    'Existem múltiplas versões (2005, 2010, 2013) com itens e pesos diferentes. Padronize uma no serviço.',
    'A idade é contada uma única vez, na faixa correspondente — não é cumulativa.',
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
    ]),
    campoNum('valor', 'Valor a converter', { min: 0, max: 1000000, passo: 0.01 }),
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
      interpretacao: [t.nota, 'O sistema internacional é o padrão na Europa; o convencional predomina no Brasil e nos Estados Unidos. Sempre confira a unidade antes de comparar resultados de laboratórios diferentes ou de artigos internacionais.'],
    }
  },
  formula: ['Hb: g/dL × 10 = g/L | g/dL × 0,6206 = mmol/L', 'Ferro: µg/dL × 0,179 = µmol/L', 'B12: pg/mL × 0,738 = pmol/L'],
  fundamento:
    'Os fatores de conversão derivam do peso molecular de cada analito. Para grandezas que são apenas contagens — plaquetas, leucócitos —, não há conversão de fato, apenas mudança de potência de dez, o que é fonte frequente de erro de leitura de exames importados.',
  armadilhas: ['Plaquetas de 250 ×10⁹/L são 250.000/mm³, não 250/mm³. Confundir as escalas gera pânico injustificado ou falsa tranquilidade.'],
  referencias: [{ texto: 'Kratz A, Ferraro M, Sluss PM, Lewandrowski KB. Laboratory reference values. N Engl J Med. 2004;351(15):1548-1563.' }],
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

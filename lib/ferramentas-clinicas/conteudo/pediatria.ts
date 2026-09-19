import type { Campo, Ferramenta, Nivel, Resultado } from '../tipos'
import {
  bsaDuBois,
  bsaMosteller,
  campoAltura,
  campoNum,
  campoOpc,
  campoPeso,
  campoSeg,
  campoSexo,
  campoSimNao,
  fmt,
  fmtInt,
  fmtLivre,
  fmtPct,
  num,
  numOu,
  opc,
  ptsOpc,
  sim,
  somaSimNao,
} from '../helpers'

const dosePediatrica: Ferramenta = {
  id: 'dose-pediatrica',
  nome: 'Dose pediátrica por peso e por superfície corporal',
  sinonimos: ['dose crianca', 'mg/kg', 'superficie corporal', 'dose por peso', 'prescricao pediatrica'],
  resumo: 'Calcula dose por quilo e por metro quadrado, com teto de dose de adulto.',
  categorias: ['pediatria', 'farmacologia'],
  campos: [
    campoPeso({ min: 0.4, max: 120 }),
    campoAltura({ min: 30, max: 200, opcional: true, ajuda: 'Necessária apenas para dose por superfície corporal.' }),
    campoNum('mgkg', 'Dose prescrita', { ajuda: 'Dose prescrita em mg/kg por tomada, conforme a referência usada. Confira se a referência dá a dose por tomada ou por dia — confundir as duas multiplica ou divide a prescrição.', unidade: 'mg/kg/dose', min: 0.001, max: 500, passo: 0.001 }),
    campoNum('tomadas', 'Tomadas por dia', { ajuda: 'Número de tomadas por dia, para converter entre dose diária e dose por tomada.', min: 1, max: 8, passo: 1, padrao: '3' }),
    campoNum('maxDose', 'Dose máxima por tomada (teto de adulto)', { ajuda: 'Teto de adulto por tomada. Nunca ultrapasse a dose máxima do adulto, por maior que seja o peso — é o erro mais comum e mais perigoso da dose pediátrica.', unidade: 'mg', min: 1, max: 10000, passo: 1, opcional: true }),
    campoNum('concentracao', 'Concentração da apresentação', { unidade: 'mg/mL', min: 0.1, max: 1000, passo: 0.1, opcional: true, ajuda: 'Converte a dose em mililitros da solução ou suspensão.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const altura = num(v, 'altura')
    const mgkg = num(v, 'mgkg')
    const tomadas = numOu(v, 'tomadas', 3)
    const maxDose = num(v, 'maxDose')
    const conc = num(v, 'concentracao')
    if (peso === null || mgkg === null) return null
    const porDose = peso * mgkg
    const limitada = maxDose !== null ? Math.min(porDose, maxDose) : porDose
    const diaria = limitada * tomadas
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Dose por tomada', valor: `${fmtLivre(limitada, 2)} mg`, nota: maxDose !== null && porDose > maxDose ? `⚠ Dose calculada (${fmtLivre(porDose, 2)} mg) excede o teto de adulto — limitada a ${fmtLivre(maxDose, 2)} mg.` : undefined, nivel: maxDose !== null && porDose > maxDose ? 'alerta' : 'neutro' },
      { rotulo: 'Dose diária total', valor: `${fmtLivre(diaria, 2)} mg/dia`, nota: `${fmtLivre(diaria / peso, 2)} mg/kg/dia` },
      { rotulo: 'Intervalo', valor: `${fmtInt(24 / tomadas)}/${fmtInt(24 / tomadas)} h` },
    ]
    if (conc !== null && conc > 0) {
      detalhes.push({ rotulo: 'Volume por tomada', valor: `${fmtLivre(limitada / conc, 2)} mL`, nota: `Apresentação de ${fmtLivre(conc, 2)} mg/mL.` })
      detalhes.push({ rotulo: 'Volume diário', valor: `${fmtLivre(diaria / conc, 2)} mL/dia` })
    }
    if (altura !== null) {
      const scMosteller = bsaMosteller(peso, altura)
      const scDuBois = bsaDuBois(peso, altura)
      detalhes.push({ rotulo: 'Superfície corporal (Mosteller)', valor: `${fmt(scMosteller, 3)} m²`, nota: '√(peso × altura / 3600). A mais simples e praticamente idêntica às demais.' })
      detalhes.push({ rotulo: 'Superfície corporal (Du Bois)', valor: `${fmt(scDuBois, 3)} m²`, nota: 'A clássica em oncologia.' })
      detalhes.push({ rotulo: 'Dose se prescrita por m²', valor: `${fmtLivre(scMosteller * mgkg, 2)} mg`, nota: `Se a prescrição fosse ${fmtLivre(mgkg, 2)} mg/m².` })
      detalhes.push({ rotulo: 'Fração da superfície corporal do adulto', valor: fmtPct((scMosteller / 1.73) * 100, 0), nota: 'Superfície de referência do adulto: 1,73 m².' })
    }
    return {
      titulo: 'Dose por tomada',
      valor: fmtLivre(limitada, 2),
      unidade: 'mg',
      nivel: 'neutro',
      rotuloNivel: `${fmtLivre(mgkg, 3)} mg/kg × ${fmt(peso, 2)} kg`,
      detalhes,
      conduta: [
        'Use **dose por peso (mg/kg) para a maioria dos fármacos** e **dose por superfície corporal (mg/m²) para quimioterápicos e alguns imunossupressores**, que é onde a relação com o volume de distribuição e com o clearance é mais fiel. Misturar as duas lógicas é a origem de erros de ordem de grandeza.',
        '**Nunca ultrapasse a dose máxima do adulto**, por maior que seja o peso da criança. Adolescentes obesos atingem rapidamente pesos que, multiplicados pela dose por quilo, geram prescrições supraterapêuticas — esse é o erro mais comum e mais perigoso da dose pediátrica.',
        'Em **obesidade**, escolha o descritor de peso conforme a lipossolubilidade: fármacos hidrofílicos (aminoglicosídeos, betalactâmicos, bloqueadores neuromusculares) dosam-se por peso ideal ou ajustado; lipofílicos (propofol, benzodiazepínicos) aproximam-se do peso real. Usar peso real indiscriminadamente superdosa.',
        'Confira sempre a **concentração da apresentação disponível** e prescreva em miligramas **e** em mililitros, com a concentração explícita. A maior parte dos erros graves de medicação em pediatria nasce da conversão entre mg e mL feita mentalmente por quem administra.',
        'Adote a **dupla checagem independente** para fármacos de alto risco — insulina, opioides, quimioterápicos, eletrólitos concentrados, digoxina, anticoagulantes — e tenha à mão uma fita de emergência baseada no comprimento (tipo Broselow) para situações em que não há peso aferido. Estimar peso \'de olho\' em parada cardiorrespiratória erra em média 20% e compromete todas as doses.',
      ],
      interpretacao: [
        '**A criança não é um adulto em escala.** A dose por quilo funciona para a maioria dos fármacos porque a depuração acompanha aproximadamente a massa corporal, mas os extremos falham: o neonato tem enzimas hepáticas imaturas e filtração glomerular reduzida (metade da do adulto ao nascer, atingindo valores de adulto por volta dos 2 anos), e o lactente tem proporcionalmente mais água corporal, o que aumenta o volume de distribuição de fármacos hidrofílicos.',
        '**Superfície corporal é preferível a peso** quando o fármaco tem janela terapêutica estreita e a depuração escala melhor com a área — é o caso da quimioterapia, de alguns imunossupressores e de reposições hidroeletrolíticas. Para a maioria dos antimicrobianos e analgésicos, o peso basta.',
        '**Nunca ultrapasse a dose de adulto.** Adolescentes com 80 kg calculados a 50 mg/kg chegariam a 4 g de amoxicilina por tomada — o teto existe justamente para isso.',
        'Registre a dose em mg **e** em mL na prescrição, e a concentração da apresentação. Erro de dose por confusão entre mg e mL é uma das causas mais frequentes de evento adverso grave em pediatria.',
      ],
      alertas: ['Confira sempre se a dose prescrita é por **dose** ou por **dia**. "50 mg/kg/dia divididos em 3" e "50 mg/kg/dose 3 vezes ao dia" diferem por um fator de três.'],
    }
  },
  formula: ['Dose = peso × mg/kg', 'SC (Mosteller) = √(peso × altura / 3600)', 'SC (Du Bois) = 0,007184 × peso^0,425 × altura^0,725'],
  fundamento:
    'A superfície corporal correlaciona-se melhor com a taxa metabólica basal, o débito cardíaco e a filtração glomerular do que o peso isolado — daí seu uso em oncologia. A fórmula de Du Bois, de 1916, foi derivada de nove indivíduos com moldes de gesso; a de Mosteller, de 1987, é uma simplificação algébrica que concorda com ela dentro de poucos por cento e cabe numa calculadora simples. A dose por quilo funciona na maior parte da infância porque o clearance de muitos fármacos acompanha aproximadamente a massa, mas a relação não é linear nos extremos: o **neonato** tem enzimas de fase I e II imaturas, barreira hematoencefálica mais permeável, maior água corporal total e menor ligação a proteínas plasmáticas, enquanto o **lactente e o pré-escolar** chegam a ter clearance por quilo **maior** que o adulto, porque fígado e rim são proporcionalmente maiores em relação ao corpo.',
  armadilhas: [
    'Em obesidade, dose por peso real pode gerar superdosagem de fármacos hidrofílicos. Considere peso ideal ou ajustado.',
    'Prematuros e neonatos exigem tabelas próprias, com intervalos alargados conforme a idade pós-menstrual.',
  ],
  referencias: [
    { texto: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098.' },
    { texto: 'Kearns GL, Abdel-Rahman SM, Alander SW, et al. Developmental pharmacology — drug disposition, action, and therapy in infants and children. N Engl J Med. 2003;349(12):1157-1167.' },
  ],
}

const hidratacao: Ferramenta = {
  id: 'hidratacao-pediatrica',
  nome: 'Hidratação pediátrica: manutenção, déficit e perdas',
  sinonimos: ['holliday segal', 'holliday-segar', 'manutencao hidrica', 'soro de manutencao', 'regra 4-2-1'],
  resumo: 'Calcula manutenção por Holliday-Segar, déficit por grau de desidratação e o plano de 24 horas.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoPeso({ min: 1, max: 80 }),
    campoOpc('desidratacao', 'Grau de desidratação', [
      { valor: '0', rotulo: 'Sem desidratação', pontos: 0 },
      { valor: '5', rotulo: 'Leve (3 a 5%)', pontos: 5 },
      { valor: '8', rotulo: 'Moderada (6 a 9%)', pontos: 8 },
      { valor: '12', rotulo: 'Grave (≥ 10%)', pontos: 12 },
    ], { ajuda: 'Estime pelo percentual de perda de peso corporal quando houver peso prévio; na sua falta, use o escore clínico de desidratação.' }),
    campoNum('perdas', 'Perdas continuadas estimadas em 24 h', { unidade: 'mL', min: 0, max: 5000, passo: 10, padrao: '0', opcional: true, ajuda: 'Vômitos, diarreia, drenos, febre (acrescente 10 a 12% da manutenção para cada grau acima de 37,5 °C).' }),
    campoSeg('via', 'Via preferencial', [
      { valor: 'oral', rotulo: 'Oral / sonda' },
      { valor: 'ev', rotulo: 'Endovenosa' },
    ], { ajuda: 'A reidratação oral é tão eficaz quanto a venosa na desidratação leve a moderada, com menos complicações. Vômito não é contraindicação.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const grau = num(v, 'desidratacao')
    const perdas = numOu(v, 'perdas', 0)
    if (peso === null || grau === null) return null
    let manutencao = 0
    if (peso <= 10) manutencao = peso * 100
    else if (peso <= 20) manutencao = 1000 + (peso - 10) * 50
    else manutencao = 1500 + (peso - 20) * 20
    const manutencaoHora = peso <= 10 ? peso * 4 : peso <= 20 ? 40 + (peso - 10) * 2 : 60 + (peso - 20) * 1
    const deficit = (grau / 100) * peso * 1000
    const total = manutencao + deficit + perdas
    const via = opc(v, 'via')
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Manutenção (Holliday-Segar)', valor: `${fmtInt(manutencao)} mL/24 h`, nota: '100 mL/kg para os primeiros 10 kg, 50 mL/kg para os 10 kg seguintes, 20 mL/kg para cada kg acima de 20.' },
      { rotulo: 'Manutenção por hora (regra 4-2-1)', valor: `${fmtInt(manutencaoHora)} mL/h` },
      { rotulo: 'Déficit estimado', valor: `${fmtInt(deficit)} mL`, nota: `${grau}% do peso corporal. 1% de desidratação ≈ 10 mL/kg.` },
      { rotulo: 'Perdas continuadas', valor: `${fmtInt(perdas)} mL/24 h` },
      { rotulo: 'Volume total em 24 h', valor: `${fmtInt(total)} mL`, nota: `Aproximadamente ${fmtInt(total / 24)} mL/h.`, nivel: 'alerta' },
      { rotulo: 'Necessidades de eletrólitos', valor: 'Na⁺ 2 a 3 mEq/kg/dia · K⁺ 1 a 2 mEq/kg/dia', nota: 'Só reponha potássio com diurese presente.' },
    ]
    if (grau >= 8) {
      detalhes.push({ rotulo: 'Expansão inicial (se choque ou desidratação grave)', valor: `${fmtInt(peso * 20)} mL`, nota: '20 mL/kg de solução isotônica em bolus, repetindo conforme a resposta. Reavalie após cada bolus.', nivel: 'critico' })
    }
    if (via === 'oral') {
      detalhes.push({ rotulo: 'Terapia de reidratação oral — plano B', valor: `${fmtInt(peso * 75)} mL em 4 h`, nota: '75 mL/kg de sais de reidratação oral de osmolaridade reduzida, oferecidos em pequenos volumes frequentes.' })
    }
    return {
      titulo: 'Volume total em 24 horas',
      valor: fmtInt(total),
      unidade: 'mL',
      nivel: grau >= 10 ? 'critico' : grau > 0 ? 'alerta' : 'neutro',
      rotuloNivel: grau === 0 ? 'Apenas manutenção' : `Manutenção + déficit de ${grau}%`,
      detalhes,
      conduta: [
        'Separe as três parcelas antes de prescrever: **manutenção** (regra de Holliday-Segar: 100 mL/kg/dia até 10 kg, mais 50 mL/kg para o intervalo de 10 a 20 kg, mais 20 mL/kg acima de 20 kg), **déficit** (percentual de desidratação × peso) e **perdas em curso** (diarreia, vômito, drenos, febre).',
        'Use **solução isotônica para manutenção** — soro fisiológico a 0,9% ou Ringer lactato com glicose —, não soluções hipotônicas. As hipotônicas causaram hiponatremia iatrogênica grave e mortes em crianças hospitalizadas, e as diretrizes mudaram por causa disso.',
        'Prefira a **reidratação oral** na desidratação leve a moderada: 50–100 mL/kg de solução de reidratação oral em 4 horas, em pequenos volumes frequentes. Ela é tão eficaz quanto a via venosa, tem menos complicações e evita a punção — vômito não é contraindicação, e ondansetrona em dose única aumenta o sucesso.',
        'Na desidratação **grave ou com choque**, faça **bolus de 20 mL/kg de cristaloide isotônico em 5–20 minutos**, repetindo até 2 a 3 vezes conforme a resposta (perfusão, frequência cardíaca, nível de consciência, diurese). Em desnutrição grave e em cardiopatia, reduza o volume e a velocidade — o bolus padrão pode precipitar insuficiência cardíaca.',
        'Corrija o sódio no ritmo certo: na **hipernatremia**, não mais que 10–12 mEq/L em 24 h, pelo risco de edema cerebral; na **hiponatremia sintomática**, salina a 3% em bolus de 3–5 mL/kg. Redose eletrólitos a cada 4–6 h durante a correção e reintroduza dieta assim que possível — o jejum prolongado não tem indicação na gastroenterite.',
      ],
      interpretacao: [
        '**A terapia de reidratação oral é a primeira escolha** na desidratação leve e moderada, inclusive com vômitos — é tão eficaz quanto a endovenosa, tem menos complicações e menos internações. Ondansetrona em dose única facilita a via oral em crianças com vômitos.',
        '**Solução isotônica é o padrão para manutenção endovenosa.** As soluções hipotônicas clássicas, derivadas do artigo original de Holliday e Segar, causam hiponatremia iatrogênica em crianças hospitalizadas — cuja secreção de hormônio antidiurético está aumentada por dor, náusea, estresse e doença. As diretrizes atuais recomendam soro isotônico (salina 0,9% ou solução balanceada) com glicose.',
        'Holliday e Segar derivaram as constantes do **gasto energético**, não do peso diretamente: cada 100 kcal metabolizadas exigem cerca de 100 mL de água. A regra escalonada reflete a queda da taxa metabólica por quilo conforme a criança cresce.',
        'A **reavaliação clínica frequente** vale mais que qualquer cálculo. Peso seriado, diurese, perfusão, estado mental e mucosas orientam melhor do que a fórmula.',
      ],
      alertas: [
        'Na desidratação hipernatrêmica (sódio acima de 150 mEq/L), corrija lentamente — não mais que 10 a 12 mEq/L em 24 horas — pelo risco de edema cerebral.',
        'Só acrescente potássio ao soro depois de confirmar diurese.',
      ],
    }
  },
  formula: [
    'Manutenção: 100 mL/kg (primeiros 10 kg) + 50 mL/kg (10 a 20 kg) + 20 mL/kg (acima de 20 kg)',
    'Por hora (4-2-1): 4 mL/kg/h + 2 mL/kg/h + 1 mL/kg/h nas mesmas faixas',
    'Déficit (mL) = % de desidratação × peso (kg) × 10',
  ],
  fundamento:
    'Holliday e Segar publicaram a regra em 1957 relacionando necessidade hídrica ao gasto energético: crianças gastam cerca de 100 kcal/kg/dia nos primeiros 10 kg, 50 nos 10 kg seguintes e 20 acima disso. Como cada caloria metabolizada consome aproximadamente 1 mL de água (perdas insensíveis mais urina), os números coincidem. A regra 4-2-1 é a mesma conta dividida por 24. O lactente desidrata mais rápido que o adulto por três razões fisiológicas somadas: a **relação superfície corporal/massa** é muito maior, o que multiplica as perdas insensíveis; a **taxa metabólica por quilo** é mais alta, elevando a produção de calor e a demanda de água; e a **capacidade de concentrar urina é imatura** no primeiro ano, limitando a osmolalidade urinária máxima a cerca de metade da do adulto e obrigando o rim a gastar mais água para excretar a mesma carga de solutos.',
  armadilhas: [
    'A regra pressupõe criança com metabolismo, função renal e estado de hidratação normais. Não se aplica a recém-nascidos, cardiopatas, nefropatas, queimados nem a pacientes em ventilação mecânica.',
    'A estimativa clínica do grau de desidratação é imprecisa. A diferença de peso antes e depois do quadro, quando disponível, é o padrão-ouro.',
  ],
  referencias: [
    { texto: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832.' },
    { texto: 'Feld LG, Neuspiel DR, Foster BA, et al. Clinical practice guideline: maintenance intravenous fluids in children. Pediatrics. 2018;142(6):e20183083.' },
  ],
}

const desidratacaoEscore: Ferramenta = {
  id: 'escore-desidratacao',
  nome: 'Escore clínico de desidratação',
  sinonimos: ['desidratacao', 'cds', 'gorelick', 'diarreia crianca'],
  resumo: 'Gradua a desidratação por quatro sinais, com melhor reprodutibilidade que a impressão global.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoOpc('aparencia', 'Aparência geral', [
      { valor: '0', rotulo: 'Normal', pontos: 0 },
      { valor: '1', rotulo: 'Sedenta, inquieta ou letárgica, mas irritável ao toque', pontos: 1 },
      { valor: '2', rotulo: 'Sonolenta, flácida, fria ou sudoreica; comatosa ou não', pontos: 2 },
    ], { ajuda: 'Normal, sedento ou inquieto, ou letárgico. A prostração aparece por último, quando a compensação por vasoconstrição periférica já se esgotou.' }),
    campoOpc('olhos', 'Olhos', [
      { valor: '0', rotulo: 'Normais', pontos: 0 },
      { valor: '1', rotulo: 'Discretamente encovados', pontos: 1 },
      { valor: '2', rotulo: 'Muito encovados', pontos: 2 },
    ], { ajuda: 'Normais, levemente encovados ou muito encovados — reflete a perda de água do tecido periorbital.' }),
    campoOpc('mucosas', 'Mucosas (língua)', [
      { valor: '0', rotulo: 'Úmidas', pontos: 0 },
      { valor: '1', rotulo: 'Pegajosas', pontos: 1 },
      { valor: '2', rotulo: 'Secas', pontos: 2 },
    ], { ajuda: 'Avalie a língua, não o lábio: respiração bucal resseca o lábio em criança bem hidratada e gera falso positivo.' }),
    campoOpc('lagrimas', 'Lágrimas', [
      { valor: '0', rotulo: 'Lágrimas presentes', pontos: 0 },
      { valor: '1', rotulo: 'Lágrimas reduzidas', pontos: 1 },
      { valor: '2', rotulo: 'Ausência de lágrimas', pontos: 2 },
    ], { ajuda: 'Presentes, reduzidas ou ausentes durante o choro.' }),
    campoSimNao('enchimento', 'Tempo de enchimento capilar > 2 segundos', 0, 'Não pontua no escore, mas é um dos preditores individuais mais úteis de desidratação significativa.'),
    campoSimNao('turgor', 'Turgor cutâneo reduzido (prega que desfaz lentamente)', 0, 'Prega cutânea no abdome que desfaz lentamente. Desnutrição grave e obesidade tornam o sinal pouco confiável.'),
  ],
  calcular: (v) => {
    const ids = ['aparencia', 'olhos', 'mucosas', 'lagrimas']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total === 0 ? 0 : total <= 4 ? 1 : 2
    const rotulos = ['Sem desidratação', 'Desidratação leve a moderada', 'Desidratação moderada a grave']
    const perda = ['< 3%', '3 a 6%', '≥ 6 a 9%'][faixa]
    return {
      titulo: 'Escore clínico de desidratação',
      valor: String(total),
      unidade: 'de 8 pontos',
      nivel: (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: rotulos[faixa],
      detalhes: [
        { rotulo: 'Perda de peso estimada', valor: perda },
        { rotulo: 'Enchimento capilar prolongado', valor: sim(v, 'enchimento') ? 'Sim' : 'Não', nota: 'Isoladamente, é um dos melhores preditores de desidratação de 5% ou mais.', nivel: sim(v, 'enchimento') ? 'alerta' : 'ok' },
        { rotulo: 'Turgor reduzido', valor: sim(v, 'turgor') ? 'Sim' : 'Não' },
      ],
      conduta: [
        '**Escore 0 (sem desidratação)**: mantenha a alimentação habitual e ofereça solução de reidratação oral após cada evacuação líquida (10 mL/kg, ou 50–100 mL na criança menor e 100–200 mL na maior). Oriente sinais de retorno e não prescreva jejum nem dieta restritiva.',
        '**Escore 1–4 (desidratação leve a moderada)**: reidratação oral supervisionada com 50–100 mL/kg em 4 horas, em colher ou seringa a cada poucos minutos. Reavalie ao final do período: a maioria recebe alta sem punção venosa.',
        '**Escore 5–8 (desidratação moderada a grave)**: via intravenosa com bolus de 20 mL/kg de cristaloide isotônico, repetido conforme resposta, e reavaliação clínica frequente. Colete eletrólitos, glicemia e gasometria — hipoglicemia e acidose são comuns e muitas vezes explicam a prostração.',
        'Não perca as **causas que imitam gastroenterite**: sepse, invaginação intestinal (dor em cólica, fezes em geleia de framboesa, massa palpável), apendicite, cetoacidose diabética de apresentação inicial, infecção urinária no lactente e erro inato do metabolismo. Vômito sem diarreia, vômito bilioso, distensão abdominal e alteração do nível de consciência devem interromper o raciocínio de gastroenterite.',
        'Evite as intervenções sem benefício: **antibiótico** não está indicado na gastroenterite viral (a maioria dos casos) e antidiarreicos são contraindicados em crianças. **Zinco por 10 a 14 dias** reduz duração e recorrência em áreas de risco nutricional, e ondansetrona em dose única facilita a reidratação oral.',
      ],
      interpretacao: [
        faixa === 0
          ? 'Sem desidastação clinicamente detectável: mantenha a alimentação habitual, ofereça líquidos e sais de reidratação oral após cada evacuação líquida, e oriente sinais de alarme.'
          : faixa === 1
            ? '**Plano B da terapia de reidratação oral:** 50 a 100 mL/kg de sais de reidratação oral em 4 horas, em pequenos volumes frequentes, com reavaliação. Zinco por 10 a 14 dias em menores de 5 anos reduz duração e gravidade da diarreia.'
            : '**Plano C:** desidratação grave com sinais de choque exige expansão endovenosa imediata com 20 mL/kg de solução isotônica em bolus, repetindo conforme a resposta. Se não houver acesso venoso, a via intraóssea é a alternativa; a hidratação por sonda nasogástrica também é opção validada.',
        'Os três sinais individuais com melhor desempenho para detectar desidratação de 5% ou mais são: **tempo de enchimento capilar prolongado**, **turgor cutâneo reduzido** e **padrão respiratório anormal**. Ressecamento de mucosa e olhos encovados são frequentes, mas menos específicos.',
        'A avaliação clínica isolada tem acurácia limitada. A **variação de peso** documentada é a medida mais confiável — peça o peso mais recente conhecido.',
      ],
      alertas: ['Diarreia com sangue, febre alta, dor abdominal intensa, distensão ou toxemia exige investigação — não é gastroenterite viral simples. Considere disenteria bacteriana, invaginação intestinal e apendicite.'],
    }
  },
  formula: ['Soma de 4 itens (0 a 2 pontos cada); 0 = sem desidratação, 1–4 = leve a moderada, 5–8 = moderada a grave'],
  fundamento:
    'A escala foi desenvolvida e validada em crianças de 1 a 36 meses com gastroenterite, buscando substituir a estimativa subjetiva do percentual de desidratação — que tem concordância ruim entre examinadores — por um instrumento reprodutível. Os quatro sinais escolhidos refletem os dois compartimentos comprometidos: intravascular (aparência, perfusão) e intersticial (olhos, mucosas, lágrimas). Os itens do escore são consequências diretas da contração do compartimento extracelular: o **turgor** cai porque o interstício perde água, as **mucosas** secam porque a secreção salivar depende de volume, os **olhos encovados** refletem a perda de água periorbital e a **lágrima ausente** a redução da secreção lacrimal. O estado geral se altera por último porque a perfusão cerebral é preservada por vasoconstrição periférica até que a compensação se esgote — motivo pelo qual a prostração já indica desidratação significativa.',
  armadilhas: [
    'Não foi validada em crianças acima de 3 anos nem em desidratação por causas não digestivas.',
    'A desidratação hipernatrêmica preserva o volume intravascular e engana o exame: a criança pode parecer melhor do que está.',
  ],
  referencias: [
    { texto: 'Goldman RD, Friedman JN, Parkin PC. Validation of the clinical dehydration scale for children with acute gastroenteritis. Pediatrics. 2008;122(3):545-549.' },
    { texto: 'Steiner MJ, DeWalt DA, Byerley JS. Is this child dehydrated? JAMA. 2004;291(22):2746-2754.' },
  ],
}

const pesoEstimado: Ferramenta = {
  id: 'peso-estimado-pediatrico',
  nome: 'Peso estimado pela idade e parâmetros de emergência',
  sinonimos: ['peso estimado', 'aplsformula', 'broselow', 'peso crianca'],
  resumo: 'Estima peso, pressão arterial mínima, tamanho de tubo e doses de emergência.',
  categorias: ['pediatria', 'emergencia'],
  campos: [
    campoNum('idade', 'Idade', { unidade: 'anos', min: 0, max: 18, passo: 0.1, ajuda: 'Idade em anos, usada nas fórmulas de peso, pressão mínima e calibre de tubo. Para menores de 1 ano, preencha também o campo de meses, que é mais preciso nessa faixa.' }),
    campoNum('meses', 'Idade em meses (para menores de 1 ano)', { unidade: 'meses', min: 0, max: 12, passo: 0.5, opcional: true, ajuda: 'Se preenchido e ≤ 12, tem prioridade sobre a idade em anos: no primeiro ano o peso muda rápido demais para a fórmula anual servir.' }),
    campoNum('pesoReal', 'Peso real, se conhecido', { unidade: 'kg', min: 0.5, max: 120, passo: 0.1, opcional: true, ajuda: 'Sempre que houver balança, informe. Peso real tem prioridade sobre qualquer estimativa, e a ferramenta mostra lado a lado o que a fórmula teria previsto — a diferença costuma surpreender.' }),
  ],
  calcular: (v) => {
    const idade = num(v, 'idade')
    const meses = num(v, 'meses')
    const pesoReal = num(v, 'pesoReal')
    if (idade === null && meses === null) return null
    let estimado: number
    let formulaUsada: string
    if (meses !== null && meses <= 12) {
      estimado = 0.5 * meses + 4
      formulaUsada = '(0,5 × meses) + 4 — lactentes até 12 meses'
    } else if (idade !== null && idade <= 5) {
      estimado = 2 * idade + 8
      formulaUsada = '(2 × idade) + 8 — 1 a 5 anos'
    } else if (idade !== null && idade <= 12) {
      estimado = 3 * idade + 7
      formulaUsada = '(3 × idade) + 7 — 6 a 12 anos'
    } else {
      estimado = 50
      formulaUsada = 'Acima de 12 anos, use o peso real ou considerações de adulto'
    }
    const peso = pesoReal ?? estimado
    const idadeAnos = idade ?? (meses ?? 0) / 12
    const pasMinima = idadeAnos < 1 ? 70 : idadeAnos <= 10 ? 70 + 2 * idadeAnos : 90
    const pas50 = 90 + 2 * idadeAnos
    const tuboSemBalao = idadeAnos / 4 + 4
    const tuboComBalao = idadeAnos / 4 + 3.5
    const profundidade = tuboSemBalao * 3
    return {
      titulo: pesoReal !== null ? 'Peso real informado' : 'Peso estimado',
      valor: fmt(peso, 1),
      unidade: 'kg',
      nivel: 'neutro',
      rotuloNivel: pesoReal !== null ? `Estimativa pela fórmula seria ${fmt(estimado, 1)} kg` : formulaUsada,
      detalhes: [
        { rotulo: 'Pressão sistólica mínima aceitável (percentil 5)', valor: `${fmtInt(pasMinima)} mmHg`, nota: '70 + (2 × idade) entre 1 e 10 anos; 70 mmHg abaixo de 1 ano; 90 mmHg acima de 10 anos. **Abaixo disso é hipotensão — sinal tardio de choque na criança.**', nivel: 'alerta' },
        { rotulo: 'Pressão sistólica no percentil 50', valor: `${fmtInt(pas50)} mmHg`, nota: '90 + (2 × idade).' },
        { rotulo: 'Tubo endotraqueal sem balonete', valor: `${fmt(tuboSemBalao, 1)} mm`, nota: '(idade / 4) + 4' },
        { rotulo: 'Tubo endotraqueal com balonete', valor: `${fmt(tuboComBalao, 1)} mm`, nota: '(idade / 4) + 3,5. Tubos com balonete são hoje aceitos em todas as idades, exceto neonatos, desde que a pressão do balonete seja monitorizada.' },
        { rotulo: 'Profundidade de fixação do tubo', valor: `${fmt(profundidade, 1)} cm`, nota: 'Diâmetro interno × 3, medido na rima labial.' },
        { rotulo: 'Adrenalina na parada (1:10.000)', valor: `${fmtLivre(peso * 0.01, 2)} mg = ${fmtLivre(peso * 0.1, 1)} mL`, nota: '0,01 mg/kg endovenoso ou intraósseo, a cada 3 a 5 minutos. Máximo de 1 mg.' },
        { rotulo: 'Desfibrilação', valor: `${fmtInt(peso * 2)} J (primeiro choque) e ${fmtInt(peso * 4)} J (seguintes)`, nota: '2 J/kg no primeiro choque, 4 J/kg nos subsequentes, podendo chegar a 10 J/kg ou à dose de adulto.' },
        { rotulo: 'Cardioversão sincronizada', valor: `${fmtLivre(peso * 0.5, 1)} a ${fmtInt(peso * 1)} J`, nota: '0,5 a 1 J/kg no primeiro choque; 2 J/kg se necessário.' },
        { rotulo: 'Expansão volêmica', valor: `${fmtInt(peso * 20)} mL`, nota: '20 mL/kg de cristaloide isotônico em bolus (10 mL/kg em cardiopatas e neonatos).' },
        { rotulo: 'Glicose na hipoglicemia', valor: `${fmtInt(peso * 2)} mL de glicose a 25%`, nota: '0,5 a 1 g/kg. Em lactentes, prefira glicose a 10% (5 mL/kg) pela osmolaridade.' },
      ],
      interpretacao: [
        'As fórmulas de peso estimado são para **emergência**, quando não há balança. Elas têm erro médio de 10 a 20% e tendem a subestimar em populações com sobrepeso — use o peso real sempre que possível.',
        'A **fita de Broselow**, baseada no comprimento, é mais acurada que as fórmulas de idade e traz doses pré-calculadas por faixa colorida.',
        '**Hipotensão é sinal tardio de choque na criança.** O débito cardíaco pediátrico depende sobretudo da frequência, e a vasoconstrição compensatória mantém a pressão até que a perda volêmica ultrapasse 30 a 40%. Reconheça o choque compensado: taquicardia, enchimento capilar lento, extremidades frias, pulsos periféricos finos, taquipneia e alteração do nível de consciência.',
        'A **bradicardia na criança quase sempre é hipóxia** até prova em contrário. A sequência é oxigenar e ventilar primeiro; se a frequência permanecer abaixo de 60 bpm com má perfusão apesar de ventilação adequada, inicie compressões.',
        'Por que a hipotensão chega tão tarde tem explicação hemodinâmica precisa, e é o conceito mais importante desta ferramenta. A pressão arterial média é o produto do débito cardíaco pela resistência vascular sistêmica. O débito é volume sistólico vezes frequência, e o **volume sistólico da criança é quase fixo**: o miocárdio imaturo tem menos miofibrilas por unidade de massa, retículo sarcoplasmático menos desenvolvido (dependendo mais do cálcio extracelular) e complacência ventricular reduzida, de modo que ele responde mal ao aumento de pré-carga — a curva de Frank-Starling é curta. Sobra à criança um único recurso para aumentar débito: **frequência**. E sobra um único recurso para sustentar pressão quando o débito cai: **vasoconstrição**, que a criança faz de forma muito mais intensa e sustentada que o adulto. O resultado é o choque compensado — taquicardia progressiva, extremidades frias, enchimento capilar lento, pulsos periféricos finos e diferença crescente entre pulso central e periférico, tudo isso com pressão arterial rigorosamente normal. Quando a vasoconstrição finalmente falha, a queda é abrupta e a parada vem em minutos. Daí a regra prática: na criança, os sinais de perfusão valem mais que o número da pressão, e a pressão só entra como confirmação tardia de que se perdeu tempo.',
        'A bradicardia segue a mesma lógica invertida. Como o débito depende da frequência, bradicardia na criança **é** baixo débito — e sua causa mais comum não é cardíaca, é hipóxia: a hipoxemia deprime diretamente o automatismo sinusal e a condução, além de aumentar o tônus vagal. Por isso a parada cardiorrespiratória pediátrica é tipicamente **asfíxica** e não arrítmica, ao contrário do adulto, evoluindo por hipoxemia progressiva até bradicardia, atividade elétrica sem pulso e assistolia. Isso explica dois pontos do protocolo pediátrico que parecem arbitrários: a ênfase absoluta em via aérea e ventilação antes de qualquer outra coisa, e o limiar de compressões torácicas em frequência abaixo de 60 bpm com má perfusão, mesmo havendo pulso — porque nessa faixa o débito já é insuficiente e aguardar a assistolia não traz benefício.',
      ],
      conduta: [
        pesoReal !== null
          ? `Peso real informado (${fmt(pesoReal, 1)} kg) — use-o para todas as doses. A estimativa pela fórmula seria ${fmt(estimado, 1)} kg, e a diferença de ${fmt(Math.abs(pesoReal - estimado), 1)} kg mostra por que pesar, quando possível, é sempre melhor.`
          : 'Use estas estimativas **apenas enquanto não houver balança**. Peça peso real na primeira oportunidade e recalcule as doses: o erro médio das fórmulas é de 10 a 20%, e elas subestimam em criança com sobrepeso. Se houver fita de Broselow disponível, ela é mais acurada que a fórmula de idade porque se baseia no comprimento.',
        'Avalie a perfusão **antes** de olhar a pressão: frequência cardíaca, tempo de enchimento capilar (normal até 2 segundos), temperatura das extremidades, amplitude dos pulsos central e periférico, nível de consciência e débito urinário. Choque compensado é o diagnóstico que se quer fazer, e ele cursa com pressão normal.',
        `Se houver sinais de choque, faça expansão com **${fmtInt(peso * 20)} mL** de cristaloide isotônico balanceado em bolus rápido (10 mL/kg em cardiopata, neonato e suspeita de cardiogênico) e **reavalie a perfusão após cada bolus**. Na sepse pediátrica, até 40 a 60 mL/kg podem ser necessários na primeira hora, sempre com reavaliação — procure ativamente hepatomegalia, estertores e aumento do trabalho respiratório como sinais de sobrecarga.`,
        'Se a bradicardia estiver presente, **oxigene e ventile primeiro** — não comece por atropina nem por adrenalina. Só se a frequência permanecer abaixo de 60 bpm com má perfusão apesar de ventilação adequada, inicie compressões torácicas. Atropina fica reservada a bradicardia de tônus vagal aumentado ou bloqueio atrioventricular.',
        `Prepare o material antes de precisar dele: tubo de ${fmt(tuboComBalao, 1)} mm com balonete (ou ${fmt(tuboSemBalao, 1)} mm sem balonete), com uma medida acima e uma abaixo à mão, fixação a ${fmt(profundidade, 1)} cm na rima labial, lâmina adequada e material de acesso intraósseo. Na criança, o intraósseo é a segunda tentativa e não o último recurso: após duas tentativas venosas falhas ou 90 segundos, puncione.`,
        `Cheque **glicemia capilar** em toda criança grave ou com alteração de consciência. Se houver hipoglicemia, administre ${fmtInt(peso * 5)} mL de glicose a 10% (5 mL/kg) no lactente — evite glicose a 25% ou 50% em veia periférica infantil pela osmolaridade — e recheque em 15 minutos.`,
        'Controle a temperatura e trate a dor. Hipotermia e dor aumentam a demanda metabólica e o consumo de oxigênio, e a criança pequena perde calor rapidamente pela relação superfície-massa desfavorável.',
      ],
      alertas: [
        'Estas fórmulas são para emergência sem balança, com erro de 10 a 20%. **Não** as use para calcular quimioterápico, anticoagulante, aminoglicosídeo, digoxina, insulina ou qualquer fármaco de janela terapêutica estreita — nesses casos, pese a criança.',
        'Hipotensão na criança é sinal **pré-terminal**. A pressão sistólica mínima calculada aqui é o percentil 5: abaixo dela o choque já está descompensado e a parada é iminente. Trate o choque compensado, não espere o número piorar.',
        'Bradicardia pediátrica é hipóxia até prova em contrário, e a parada pediátrica é tipicamente asfíxica. Via aérea e ventilação vêm antes de fármaco em praticamente todos os cenários.',
        'A fórmula do tubo é aproximação da cartilagem cricoide, a porção mais estreita da via aérea até cerca de 8 anos. Confirme a medida pela clínica — vazamento excessivo ou resistência à passagem indicam trocar de calibre.',
        'Dose máxima existe e é frequentemente ultrapassada em adolescente grande: adrenalina na parada não passa de 1 mg por dose. Confira sempre o teto de adulto ao aplicar mg/kg.',
        'Criança com desnutrição grave, cardiopatia, doença renal ou hepática exige ajuste de volume e de dose que estas fórmulas não contemplam.',
      ],
      tabela: {
        titulo: 'Parâmetros calculados para este peso',
        colunas: ['Parâmetro', 'Valor', 'Base do cálculo'],
        linhas: [
          ['Peso', `${fmt(peso, 1)} kg`, pesoReal !== null ? 'Peso real informado' : formulaUsada],
          ['PA sistólica mínima', `${fmtInt(pasMinima)} mmHg`, 'Percentil 5 — abaixo disso é hipotensão'],
          ['Tubo com balonete', `${fmt(tuboComBalao, 1)} mm`, '(idade / 4) + 3,5'],
          ['Expansão volêmica', `${fmtInt(peso * 20)} mL`, '20 mL/kg de cristaloide'],
          ['Adrenalina na parada', `${fmtLivre(peso * 0.1, 1)} mL de 1:10.000`, '0,01 mg/kg, máximo 1 mg'],
          ['Desfibrilação inicial', `${fmtInt(peso * 2)} J`, '2 J/kg; 4 J/kg nos seguintes'],
        ],
        destaque: 0,
      },
    }
  },
  formula: [
    'Lactente (≤ 12 meses): peso = (0,5 × meses) + 4',
    '1 a 5 anos: peso = (2 × idade) + 8',
    '6 a 12 anos: peso = (3 × idade) + 7',
    'PA sistólica mínima = 70 + (2 × idade) entre 1 e 10 anos',
    'Tubo sem balonete = (idade / 4) + 4',
  ],
  fundamento:
    'As fórmulas do Advanced Paediatric Life Support foram derivadas de curvas de crescimento populacionais e reajustadas ao longo dos anos para acompanhar a mudança de peso das populações pediátricas. A fórmula do tubo endotraqueal, de Cole, aproxima o diâmetro da cartilagem cricoide — a porção mais estreita da via aérea pediátrica até cerca de 8 anos. As fórmulas de estimativa existem porque, em parada cardiorrespiratória e em emergência, não há tempo nem condição de pesar — e porque a estimativa visual erra em média 20%, com erro que se propaga a todas as doses, joules e calibres. Os métodos baseados em **comprimento** (fita de Broselow e derivados) superam os baseados em idade porque o comprimento correlaciona-se melhor com massa magra e com volume de distribuição, que são o que de fato governa a farmacocinética.',
  armadilhas: [
    'Subestimam o peso em crianças com sobrepeso e superestimam em desnutridas.',
    'Não use para calcular dose de quimioterápico ou de fármaco com janela estreita — nesses casos, pese.',
  ],
  referencias: [
    { texto: 'Samuels M, Wieteska S (eds). Advanced Paediatric Life Support: A Practical Approach to Emergencies. 6ª ed. Wiley-Blackwell; 2016.' },
    { texto: 'Topjian AA, Raymond TT, Atkins D, et al. Part 4: Pediatric Basic and Advanced Life Support — 2020 AHA Guidelines for CPR and ECC. Circulation. 2020;142(16_suppl_2):S469-S523.' },
  ],
}

const apgar: Ferramenta = {
  id: 'apgar',
  nome: 'Escore de Apgar',
  sinonimos: ['apgar', 'boletim de apgar', 'vitalidade do recem-nascido'],
  resumo: 'Avalia a vitalidade do recém-nascido no primeiro e no quinto minuto.',
  categorias: ['pediatria', 'ginecologia'],
  campos: [
    campoOpc('fc', 'Frequência cardíaca', [
      { valor: '2', rotulo: '2 — acima de 100 bpm', pontos: 2 },
      { valor: '1', rotulo: '1 — abaixo de 100 bpm', pontos: 1 },
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
    ], { ajuda: 'É o último item a falhar e o melhor indicador de gravidade. Ausculte ou palpe a base do cordão por 6 segundos e multiplique por 10.' }),
    campoOpc('respiracao', 'Esforço respiratório', [
      { valor: '2', rotulo: '2 — choro forte, respiração regular', pontos: 2 },
      { valor: '1', rotulo: '1 — irregular, lenta, choro fraco', pontos: 1 },
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
    ], { ajuda: 'Ausente, irregular ou choro vigoroso. Não confunda gasping com esforço respiratório efetivo.' }),
    campoOpc('tonus', 'Tônus muscular', [
      { valor: '2', rotulo: '2 — movimentos ativos, boa flexão', pontos: 2 },
      { valor: '1', rotulo: '1 — alguma flexão de extremidades', pontos: 1 },
      { valor: '0', rotulo: '0 — flácido', pontos: 0 },
    ], { ajuda: 'Flácido, alguma flexão, ou movimento ativo. Prematuridade, sedação materna e doença neuromuscular reduzem o tônus por motivos alheios à asfixia.' }),
    campoOpc('irritabilidade', 'Irritabilidade reflexa', [
      { valor: '2', rotulo: '2 — choro, tosse, espirro', pontos: 2 },
      { valor: '1', rotulo: '1 — careta', pontos: 1 },
      { valor: '0', rotulo: '0 — sem resposta', pontos: 0 },
    ], { ajuda: 'Resposta à aspiração ou ao estímulo plantar: ausente, careta, ou choro e tosse.' }),
    campoOpc('cor', 'Coloração', [
      { valor: '2', rotulo: '2 — completamente rosado', pontos: 2 },
      { valor: '1', rotulo: '1 — corpo rosado com extremidades cianóticas', pontos: 1 },
      { valor: '0', rotulo: '0 — pálido ou cianótico', pontos: 0 },
    ], { ajuda: 'A acrocianose isolada é normal nos primeiros minutos e vale 1 ponto — não a confunda com cianose central.' }),
    campoSeg('momento', 'Momento da avaliação', [
      { valor: '1', rotulo: '1º minuto' },
      { valor: '5', rotulo: '5º minuto' },
      { valor: '10', rotulo: '10º minuto ou depois' },
    ], { ajuda: 'Registre em 1 e 5 minutos, e siga a cada 5 minutos até 20 se o escore do 5º minuto for menor que 7.' }),
  ],
  calcular: (v) => {
    const ids = ['fc', 'respiracao', 'tonus', 'irritabilidade', 'cor']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const momento = opc(v, 'momento')
    const faixa = total >= 8 ? 0 : total >= 4 ? 1 : 2
    const nivel: Nivel = (['ok', 'alerta', 'critico'] as Nivel[])[faixa]
    return {
      titulo: `Apgar no ${momento === '1' ? '1º' : momento === '5' ? '5º' : '10º'} minuto`,
      valor: String(total),
      unidade: 'de 10',
      nivel,
      rotuloNivel: ['Boa vitalidade (8 a 10)', 'Vitalidade intermediária (4 a 7)', 'Vitalidade gravemente comprometida (0 a 3)'][faixa],
      detalhes: [
        { rotulo: 'Mnemônica', valor: 'A parência, P ulso, G esticulação (irritabilidade reflexa), A tividade (tônus), R espiração' },
        { rotulo: 'Momento', valor: momento === '1' ? '1º minuto — reflete a condição intraparto' : momento === '5' ? '5º minuto — tem maior valor prognóstico' : '10º minuto ou além — avaliado a cada 5 min enquanto o escore for menor que 7' },
      ],
      conduta: [
        'Use o Apgar para **descrever a transição e documentar a resposta à reanimação**, jamais para decidir se reanima. A reanimação neonatal começa pela avaliação de respiração, frequência cardíaca e tônus nos primeiros segundos — esperar o Apgar de 1 minuto para agir é erro grave.',
        'Se o escore for **< 7 no 5º minuto**, continue registrando a cada 5 minutos até 20 minutos, e documente as intervenções em curso em cada momento. Essa série é o que permite reconstruir a evolução depois.',
        '**Apgar baixo isoladamente não diagnostica asfixia perinatal.** O diagnóstico exige a combinação de acidose metabólica grave em sangue de cordão (pH < 7,0 ou déficit de base ≥ 12 mmol/L), encefalopatia neonatal e disfunção de múltiplos órgãos. Atribuir sequelas a um Apgar baixo, sem esses elementos, é conclusão frequentemente incorreta — inclusive em contexto médico-legal.',
        'Diante de **encefalopatia hipóxico-isquêmica moderada a grave** em recém-nascido com 35 semanas ou mais, avalie **hipotermia terapêutica**, que deve ser iniciada nas primeiras 6 horas de vida e é a única intervenção com redução comprovada de morte e sequela neurológica. Isso torna o reconhecimento precoce uma urgência de transferência.',
        'Interprete com cautela o Apgar em **prematuros**, sedação materna, bloqueio neuromuscular, malformações e doenças neuromusculares: tônus e resposta a estímulo estão reduzidos por motivos que nada têm a ver com asfixia. Registre a circunstância junto ao escore.',
      ],
      interpretacao: [
        '**O Apgar não determina a necessidade de reanimação e nunca deve atrasá-la.** A decisão de reanimar se baseia em três perguntas feitas nos primeiros segundos — gestação a termo? respira ou chora? tônus bom? — e, na sequência, em frequência cardíaca e respiração. O Apgar é uma **descrição** do estado, aplicada com o cronômetro correndo em paralelo.',
        momento === '5' && total < 7
          ? 'Apgar abaixo de 7 no 5º minuto exige avaliação a cada 5 minutos até 20 minutos de vida, com registro de todos os valores.'
          : 'Registre os componentes separadamente, e não apenas o total.',
        '**Apgar baixo não é sinônimo de asfixia perinatal.** Prematuridade, medicações maternas (opioides, sulfato de magnésio, anestésicos), malformações, doença neuromuscular e infecção reduzem o escore sem hipóxia. O diagnóstico de asfixia exige acidemia metabólica grave em sangue de cordão (pH < 7,0 ou déficit de base ≥ 12 mmol/L), encefalopatia moderada a grave e disfunção de múltiplos órgãos.',
        'O valor prognóstico do Apgar isolado para desfecho neurológico é fraco. Apgar de 0 a 3 aos 10, 15 e 20 minutos, contudo, associa-se progressivamente a maior risco de paralisia cerebral e morte.',
      ],
      alertas: ['A cor é o componente menos confiável: praticamente todos os recém-nascidos têm acrocianose no primeiro minuto, e a avaliação visual da coloração tem concordância ruim. A oximetria de pulso pré-ductal (mão direita) é o parâmetro objetivo.'],
    }
  },
  formula: ['Soma de 5 itens, 0 a 2 pontos cada'],
  fundamento:
    'Virginia Apgar propôs o escore em 1953 — ela era anestesiologista e queria um método padronizado para avaliar o efeito da anestesia obstétrica sobre o recém-nascido. Sua genialidade foi escolher cinco sinais observáveis em segundos, sem equipamento, e com gradação de três níveis cada. O acrônimo em inglês com o próprio sobrenome veio depois, proposto por outro autor. Virginia Apgar propôs o escore em 1953 para padronizar uma avaliação que até então era impressionista, e os cinco itens foram escolhidos por refletirem, nessa ordem de vulnerabilidade, os sistemas que a asfixia compromete: a **frequência cardíaca** é o último a falhar e o melhor indicador de gravidade, o **esforço respiratório** vem em seguida, e **tônus, irritabilidade reflexa e cor** são os mais sensíveis à hipóxia leve porque dependem de perfusão e de função de tronco encefálico.',
  armadilhas: [
    'Em prematuros, o tônus e a resposta reflexa são fisiologicamente reduzidos, e o escore subestima a vitalidade.',
    'Não existe "Apgar de 10 no primeiro minuto" na prática — a acrocianose é quase universal.',
  ],
  referencias: [
    { texto: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.' },
    { texto: 'American Academy of Pediatrics, American College of Obstetricians and Gynecologists. The Apgar score. Pediatrics. 2015;136(4):819-822.' },
  ],
}

const capurro: Ferramenta = {
  id: 'capurro',
  nome: 'Método de Capurro',
  sinonimos: ['capurro', 'idade gestacional recem nascido', 'somatico'],
  resumo: 'Estima a idade gestacional pelo exame de sinais somáticos do recém-nascido.',
  categorias: ['pediatria', 'ginecologia'],
  campos: [
    campoOpc('orelha', 'Forma da orelha', [
      { valor: '0', rotulo: '0 — chata, disforme, pavilhão não encurvado', pontos: 0 },
      { valor: '8', rotulo: '8 — pavilhão parcialmente encurvado na borda superior', pontos: 8 },
      { valor: '16', rotulo: '16 — pavilhão parcialmente encurvado em toda a borda superior', pontos: 16 },
      { valor: '24', rotulo: '24 — pavilhão totalmente encurvado', pontos: 24 },
    ], { ajuda: 'Avalie o pavilhão: chato e disforme no prematuro, com incurvação progressiva da borda superior à medida que a cartilagem enrijece.' }),
    campoOpc('mamaria', 'Tamanho da glândula mamária', [
      { valor: '0', rotulo: '0 — não palpável', pontos: 0 },
      { valor: '5', rotulo: '5 — palpável, menor que 5 mm', pontos: 5 },
      { valor: '10', rotulo: '10 — entre 5 e 10 mm', pontos: 10 },
      { valor: '15', rotulo: '15 — maior que 10 mm', pontos: 15 },
    ], { ajuda: 'Palpe o tecido mamário, não olhe apenas. O nódulo prolifera sob estímulo estrogênico materno no terceiro trimestre.' }),
    campoOpc('mamilo', 'Formação do mamilo', [
      { valor: '0', rotulo: '0 — apenas visível', pontos: 0 },
      { valor: '5', rotulo: '5 — aréola pigmentada, diâmetro < 7,5 mm, borda não elevada', pontos: 5 },
      { valor: '10', rotulo: '10 — aréola pigmentada, diâmetro > 7,5 mm, borda não elevada', pontos: 10 },
      { valor: '15', rotulo: '15 — borda elevada, diâmetro > 7,5 mm', pontos: 15 },
    ], { ajuda: 'Apenas visível, aréola pontilhada, ou aréola elevada com borda definida.' }),
    campoOpc('pele', 'Textura da pele', [
      { valor: '0', rotulo: '0 — muito fina, gelatinosa', pontos: 0 },
      { valor: '5', rotulo: '5 — fina e lisa', pontos: 5 },
      { valor: '10', rotulo: '10 — algo mais grossa, discreta descamação superficial', pontos: 10 },
      { valor: '15', rotulo: '15 — grossa, sulcos superficiais, descamação de mãos e pés', pontos: 15 },
      { valor: '20', rotulo: '20 — grossa, apergaminhada, sulcos profundos', pontos: 20 },
    ], { ajuda: 'Fina e gelatinosa no prematuro extremo; espessa, apergaminhada e com fissuras no pós-termo.' }),
    campoOpc('plantares', 'Pregas plantares', [
      { valor: '0', rotulo: '0 — ausentes', pontos: 0 },
      { valor: '5', rotulo: '5 — marcas mal definidas na metade anterior', pontos: 5 },
      { valor: '10', rotulo: '10 — marcas bem definidas na metade anterior, sulcos no terço anterior', pontos: 10 },
      { valor: '15', rotulo: '15 — sulcos na metade anterior', pontos: 15 },
      { valor: '20', rotulo: '20 — sulcos em mais da metade anterior', pontos: 20 },
    ], { ajuda: 'As pregas surgem na porção anterior e avançam em direção ao calcâneo. Avalie nas primeiras horas: depois, a descamação simula pregas e superestima a idade.' }),
  ],
  calcular: (v) => {
    const ids = ['orelha', 'mamaria', 'mamilo', 'pele', 'plantares']
    let soma = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      soma += x
    }
    const dias = 204 + soma
    const semanas = dias / 7
    const semanasInt = Math.floor(semanas)
    const diasRestantes = Math.round((semanas - semanasInt) * 7)
    const classe = semanas < 37 ? 'Pré-termo' : semanas < 42 ? 'Termo' : 'Pós-termo'
    const nivel: Nivel = semanas < 34 ? 'critico' : semanas < 37 ? 'alerta' : semanas >= 42 ? 'alerta' : 'ok'
    return {
      titulo: 'Idade gestacional (Capurro somático)',
      valor: `${semanasInt}s ${diasRestantes}d`,
      nivel,
      rotuloNivel: classe,
      detalhes: [
        { rotulo: 'Soma dos pontos', valor: String(soma) },
        { rotulo: 'Idade gestacional em dias', valor: `${fmtInt(dias)} dias` },
        { rotulo: 'Idade gestacional em semanas', valor: fmt(semanas, 1) },
        { rotulo: 'Classificação', valor: semanas < 28 ? 'Prematuro extremo (< 28 semanas)' : semanas < 32 ? 'Muito prematuro (28 a 31 semanas)' : semanas < 34 ? 'Prematuro moderado (32 a 33 semanas)' : semanas < 37 ? 'Prematuro tardio (34 a 36 semanas)' : semanas < 39 ? 'Termo precoce (37 a 38 semanas)' : semanas < 41 ? 'Termo pleno (39 a 40 semanas)' : semanas < 42 ? 'Termo tardio (41 semanas)' : 'Pós-termo (≥ 42 semanas)' },
      ],
      interpretacao: [
        'O método de Capurro é o mais usado no Brasil pela rapidez: cinco sinais somáticos, sem necessidade de exame neurológico, o que permite aplicá-lo mesmo no recém-nascido gravemente doente ou sedado.',
        'A versão **somatoneurológica** (Capurro A) substitui um dos sinais somáticos por dois sinais neurológicos (sinal do xale e posição da cabeça ao levantar o corpo) e usa a constante 200 em vez de 204. Ela é ligeiramente mais acurada, mas exige recém-nascido em boas condições.',
        'A **melhor estimativa de idade gestacional continua sendo obstétrica**: ultrassonografia do primeiro trimestre, seguida da data da última menstruação confiável. Os métodos pós-natais são estimativas de reserva, com erro de ± 1 a 2 semanas.',
        semanas < 37 ? 'Prematuridade identificada: rastreie hipoglicemia, hipotermia, dificuldade alimentar, icterícia, apneia e desconforto respiratório, e reavalie o risco de retinopatia da prematuridade conforme o protocolo.' : semanas >= 42 ? 'Pós-termo: atenção a síndrome de aspiração meconial, hipoglicemia, policitemia e insuficiência placentária.' : 'Recém-nascido a termo.',
        'Cada um dos cinco sinais tem uma cronologia embriológica própria, e é isso que faz a soma funcionar como relógio. A **cartilagem auricular** só adquire elasticidade suficiente para manter o pavilhão encurvado quando a matriz de condroitina e o colágeno amadurecem, o que ocorre progressivamente entre 32 e 38 semanas — antes disso a orelha, dobrada, permanece dobrada. O **tecido mamário** responde ao estrogênio materno transferido pela placenta, e a transferência é cumulativa: o botão mamário só se torna palpável perto de 34 semanas e atinge mais de 10 mm no termo, razão pela qual o prematuro extremo não tem glândula palpável. A **pele** reflete a maturação da barreira epidérmica — o estrato córneo se queratiniza entre 32 e 34 semanas, e é essa queratinização que transforma a pele gelatinosa e translúcida do prematuro em pele espessa, com sulcos e descamação, no termo e no pós-termo. As **pregas plantares** aparecem no sentido anteroposterior, do terço anterior para o calcâneo, acompanhando o crescimento e a deposição de tecido conjuntivo no pé — ausência total sugere menos de 32 semanas, sulcos até o calcâneo sugerem termo ou pós-termo.',
        'Entender esses mecanismos explica de imediato as duas grandes limitações do método. Primeiro, o **piso**: abaixo de 29 semanas praticamente todos os sinais estão no valor zero, de modo que o escore satura e não discrimina — daí a superioridade do New Ballard, que inclui itens neuromusculares (postura, ângulo de flexão do punho, ângulo poplíteo, sinal do xale) capazes de distinguir 24 de 28 semanas. Segundo, a dependência do **estado nutricional e placentário**: na restrição de crescimento intrauterino, a perda de tecido subcutâneo e a redução de tecido mamário fazem o recém-nascido parecer mais prematuro do que é, enquanto a hidropisia, a infecção congênita e a maceração alteram a pele de forma imprevisível. O método mede maturação **somática**, e assume que ela caminhou junto com o tempo — premissa que a insuficiência placentária quebra.',
      ],
      conduta: [
        'Aplique nas **primeiras 24 horas** de vida, com o recém-nascido despido, em ambiente térmico neutro e com boa iluminação. Depois desse prazo a pele descama e as características mudam, comprometendo a estimativa de forma irreversível.',
        'Confronte o resultado com a **datação obstétrica** antes de aceitá-lo. Ultrassonografia de primeiro trimestre é a referência; data da última menstruação confiável vem depois. Se houver divergência maior que 2 semanas, prevaleça a datação obstétrica e investigue restrição de crescimento intrauterino como explicação da discrepância.',
        semanas < 34
          ? 'Abaixo de 34 semanas, o Capurro perde acurácia e satura. **Use o New Ballard Score**, que inclui itens neuromusculares e foi validado de 20 a 44 semanas — abaixo de 29 semanas ele é claramente superior.'
          : 'Nesta faixa o Capurro tem desempenho adequado, com erro esperado de ± 1 a 2 semanas. Registre a estimativa junto do método usado, para que o seguimento saiba de onde veio o número.',
        'Classifique também o **peso para a idade gestacional** usando as curvas de Fenton ou Intergrowth-21st: pequeno, adequado ou grande para a idade gestacional. É uma informação independente da maturidade e define riscos distintos — hipoglicemia e policitemia no pequeno, hipoglicemia e tocotraumatismo no grande.',
        semanas < 37
          ? 'Prematuridade confirmada aciona um pacote de cuidados: controle térmico rigoroso, glicemia capilar seriada nas primeiras horas, vigilância de icterícia com bilirrubina transcutânea ou sérica, monitorização de apneia, avaliação de desconforto respiratório pelo boletim de Silverman-Andersen, apoio à amamentação com suplementação se necessário, e programação do rastreio de retinopatia da prematuridade pela idade pós-menstrual.'
          : semanas >= 42
            ? 'Pós-termo exige atenção à insuficiência placentária e suas consequências: síndrome de aspiração meconial, hipoglicemia por depleção de glicogênio, policitemia com risco de hiperviscosidade e hiperbilirrubinemia. Avalie líquido meconial, glicemia e hematócrito.'
            : 'Recém-nascido a termo: cuidados de rotina, contato pele a pele, amamentação na primeira hora, vitamina K, triagem neonatal (teste do pezinho, teste do coraçãozinho, triagem auditiva e do reflexo vermelho) conforme o calendário.',
        'Registre a idade gestacional definitiva no prontuário, porque ela governa todo o seguimento: idade corrigida para crescimento e desenvolvimento, idade pós-menstrual para rastreio de retinopatia e protocolos de terapia intensiva, e idade cronológica para vacinação.',
      ],
      alertas: [
        'A avaliação deve ser feita nas primeiras 24 horas de vida. Depois disso, a pele se descama e as características somáticas mudam, comprometendo a estimativa.',
        'Abaixo de 29 semanas o escore **satura**: quase todos os itens valem zero e o método não discrimina. Use o New Ballard Score nessa faixa.',
        'Restrição de crescimento intrauterino, hidropisia, infecção congênita e desnutrição materna alteram os sinais somáticos e fazem o recém-nascido parecer mais prematuro do que é. O método assume que a maturação somática acompanhou o tempo gestacional.',
        'A datação obstétrica por ultrassonografia de primeiro trimestre é superior a qualquer método pós-natal. O Capurro é estimativa de reserva, para quando não há pré-natal documentado.',
        'Não confunda maturidade com peso: prematuro pode ser adequado para a idade gestacional e recém-nascido a termo pode ser pequeno. As duas classificações são independentes e definem riscos diferentes.',
      ],
      tabela: {
        titulo: 'Cronologia embriológica dos cinco sinais',
        colunas: ['Sinal', 'O que amadurece', 'Faixa em que discrimina'],
        linhas: [
          ['Orelha', 'Elasticidade da cartilagem auricular', '32 a 38 semanas'],
          ['Glândula mamária', 'Resposta cumulativa ao estrogênio materno', '34 semanas ao termo'],
          ['Mamilo e aréola', 'Pigmentação e elevação da borda', '34 semanas ao termo'],
          ['Pele', 'Queratinização do estrato córneo', '32 a 34 semanas em diante'],
          ['Pregas plantares', 'Deposição conjuntiva, do terço anterior ao calcâneo', '32 semanas ao pós-termo'],
        ],
        destaque: semanas < 34 ? 3 : 0,
      },
    }
  },
  formula: ['Idade gestacional (dias) = 204 + soma dos pontos', 'Semanas = dias / 7'],
  fundamento:
    'Capurro e colaboradores derivaram o método em 1978, correlacionando sinais de maturação somática com a idade gestacional conhecida. A lógica é que a maturação da pele, da cartilagem auricular, do tecido mamário e das pregas plantares segue uma cronologia previsível no terceiro trimestre — cada estrutura "marca" um momento da gestação. A base do método é que a maturação de estruturas superficiais segue um cronograma previsível independente do crescimento somático: a cartilagem da orelha enrijece, o tecido mamário prolifera sob estímulo estrogênico materno, as pregas plantares se aprofundam da porção anterior para o calcâneo e a pele perde o verniz e ganha descamação. São marcadores morfológicos de tempo, não de tamanho, o que permite datar um recém-nascido cujo peso não corresponde à idade.',
  armadilhas: [
    'Perde acurácia abaixo de 29 semanas, faixa em que o New Ballard é superior.',
    'Restrição de crescimento intrauterino, hidropisia e infecção congênita alteram as características somáticas.',
    'Existem duas versões com constantes diferentes: a somática (Capurro B, constante 204, cinco sinais) e a somatoneurológica (Capurro A, constante 200, que troca um sinal somático por dois neurológicos). Usar a constante errada desloca a estimativa em cerca de meia semana.',
    'Aplicado após 24 horas de vida, a descamação fisiológica da pele desloca o item cutâneo para valores mais altos e superestima a idade gestacional.',
    'O escore satura na ponta inferior: abaixo de 29 semanas quase tudo vale zero, e diferenciar 24 de 28 semanas exige itens neuromusculares que o Capurro não tem.',
    'Maturidade e peso são eixos independentes. Classifique também peso para a idade gestacional pelas curvas de Fenton ou Intergrowth-21st, porque pequeno e grande para a idade gestacional têm riscos próprios.',
  ],
  referencias: [
    { texto: 'Capurro H, Konichezky S, Fonseca D, Caldeyro-Barcia R. A simplified method for diagnosis of gestational age in the newborn infant. J Pediatr. 1978;93(1):120-122.' },
    { texto: 'Ballard JL, Khoury JC, Wedig K, et al. New Ballard Score, expanded to include extremely premature infants. J Pediatr. 1991;119(3):417-423.' },
    { texto: 'Committee on Obstetric Practice, AIUM, SMFM. Committee Opinion No. 700: Methods for Estimating the Due Date. Obstet Gynecol. 2017;129(5):e150-e154.' },
  ],
}

const ballard: Ferramenta = {
  id: 'ballard',
  nome: 'New Ballard Score',
  sinonimos: ['ballard', 'new ballard', 'maturidade neonatal', 'idade gestacional prematuro'],
  resumo: 'Estima idade gestacional de 20 a 44 semanas, incluindo prematuros extremos.',
  categorias: ['pediatria'],
  campos: [
    campoNum('neuromuscular', 'Soma dos 6 itens de maturidade neuromuscular', { min: -6, max: 30, passo: 1, ajuda: 'Postura, ângulo de flexão do punho, retração do braço, ângulo poplíteo, sinal do xale e calcanhar-orelha. Cada item vale de −1 a 5.' }),
    campoNum('fisica', 'Soma dos 6 itens de maturidade física', { min: -6, max: 30, passo: 1, ajuda: 'Pele, lanugo, superfície plantar, mama, olhos e orelha, genitália. Cada item vale de −1 a 5.' }),
  ],
  calcular: (v) => {
    const nm = num(v, 'neuromuscular')
    const fis = num(v, 'fisica')
    if (nm === null || fis === null) return null
    const total = nm + fis
    const semanas = 24 + 0.4 * total
    const semanasInt = Math.floor(semanas)
    const dias = Math.round((semanas - semanasInt) * 7)
    const nivel: Nivel = semanas < 32 ? 'critico' : semanas < 37 ? 'alerta' : semanas >= 42 ? 'alerta' : 'ok'
    return {
      titulo: 'Idade gestacional (New Ballard)',
      valor: `${semanasInt}s ${dias}d`,
      nivel,
      rotuloNivel: semanas < 37 ? 'Pré-termo' : semanas < 42 ? 'Termo' : 'Pós-termo',
      detalhes: [
        { rotulo: 'Escore neuromuscular', valor: String(nm) },
        { rotulo: 'Escore físico', valor: String(fis) },
        { rotulo: 'Escore total', valor: String(total), nota: 'Faixa de −10 a 50 pontos.' },
        { rotulo: 'Correspondência', valor: '−10 = 20 semanas · 0 = 24 · 20 = 32 · 35 = 38 · 50 = 44', nota: 'Cada 5 pontos correspondem a 2 semanas.' },
      ],
      conduta: [
        'Aplique o New Ballard entre **12 e 24 horas de vida** para melhor acurácia (a janela vai até 96 h, e em prematuros extremos idealmente nas primeiras 12 h). A margem de erro é de cerca de ± 2 semanas — por isso ele **não substitui** a datação obstétrica por última menstruação confiável ou ultrassonografia de primeiro trimestre, e só deve prevalecer quando essas faltam ou são discordantes.',
        'Combine a idade gestacional estimada com o **peso ao nascer** na curva de crescimento intrauterino para classificar em pequeno, adequado ou grande para a idade gestacional. É essa classificação, e não a idade isolada, que determina os riscos imediatos a rastrear.',
        'No **pequeno para a idade gestacional**, vigie hipoglicemia (reserva hepática de glicogênio reduzida), policitemia (resposta à hipóxia crônica), hipotermia e hipocalcemia. Inicie glicemia capilar seriada nas primeiras horas e alimentação precoce.',
        'No **grande para a idade gestacional**, procure diabetes materno não diagnosticado, e vigie hipoglicemia por hiperinsulinismo fetal, tocotraumatismo (fratura de clavícula, lesão de plexo braquial), policitemia e icterícia.',
        'Use a idade gestacional estimada para **posicionar os rastreios e cuidados do prematuro**: surfactante, cafeína para apneia da prematuridade, triagem de retinopatia (a partir de 4–6 semanas de vida em nascidos com menos de 32 semanas ou 1.500 g), ultrassonografia transfontanela para hemorragia intraventricular, e triagem auditiva. Registre também a **idade corrigida**, que deve ser usada para avaliar desenvolvimento até os 2 anos.',
      ],
      interpretacao: [
        'O New Ballard, publicado em 1991, estendeu o escore original de 1979 para baixo, permitindo avaliar prematuros extremos a partir de 20 semanas — faixa em que o Capurro e o Dubowitz não funcionam.',
        'Aplique **entre 12 e 20 horas de vida** para melhor acurácia em prematuros extremos; no recém-nascido a termo, a avaliação é confiável nas primeiras 96 horas. A margem de erro é de aproximadamente ± 2 semanas.',
        'O componente neuromuscular reflete a maturação do tônus flexor, que progride no sentido caudocranial: o prematuro extremo é hipotônico e extendido, o termo mantém flexão dos quatro membros em repouso.',
        'O componente físico reflete a maturação tecidual: pele gelatinosa e transparente no extremo prematuro, apergaminhada e descamativa no pós-termo; lanugo que aparece por volta de 24 semanas e desaparece próximo ao termo; pregas plantares que progridem do calcanhar em direção aos dedos.',
      ],
      alertas: ['Sedação, doença grave, uso materno de sulfato de magnésio e lesão neurológica prejudicam o componente neuromuscular. Nesses casos, o componente físico é mais confiável.'],
    }
  },
  formula: ['Idade gestacional (semanas) = 24 + 0,4 × escore total', 'Escore total = neuromuscular (−6 a 30) + físico (−6 a 30)'],
  fundamento:
    'O escore mede duas dimensões independentes da maturação fetal. A neuromuscular acompanha a mielinização e o desenvolvimento do tônus flexor, que é o último a se estabelecer. A física acompanha a maturação da pele, do tecido subcutâneo, da cartilagem e das estruturas anexas. Combinar as duas reduz o erro que cada uma teria isoladamente. A escala combina seis sinais **físicos** de maturação tegumentar e cartilaginosa com seis sinais **neuromusculares** que refletem o tônus flexor progressivo: o feto ganha tônus em sentido caudocefálico ao longo do terceiro trimestre, à medida que a mielinização descendente avança. A dupla avaliação é o que permite estender o método a prematuros extremos, em que os sinais físicos ainda são inespecíficos e o tônus quase ausente.',
  armadilhas: [
    'Avaliar tarde demais em prematuro extremo superestima a idade, porque as características amadurecem rapidamente ex utero.',
    'Não é confiável em recém-nascido com edema importante, hidropisia ou malformação.',
  ],
  referencias: [
    { texto: 'Ballard JL, Khoury JC, Wedig K, et al. New Ballard Score, expanded to include extremely premature infants. J Pediatr. 1991;119(3):417-423.' },
    { texto: 'Committee on Obstetric Practice, American Academy of Pediatrics. ACOG Committee Opinion No. 700: Methods for estimating the due date. Obstet Gynecol. 2017;129(5):e150-e154.' },
  ],
}

const silverman: Ferramenta = {
  id: 'silverman-andersen',
  nome: 'Boletim de Silverman-Andersen',
  sinonimos: ['silverman', 'desconforto respiratorio neonatal', 'boletim de silverman'],
  resumo: 'Gradua o desconforto respiratório do recém-nascido em cinco sinais.',
  categorias: ['pediatria'],
  campos: [
    campoOpc('toracoAbdominal', 'Movimento toracoabdominal', [
      { valor: '0', rotulo: '0 — sincrônico', pontos: 0 },
      { valor: '1', rotulo: '1 — tórax imóvel e abdome em movimento', pontos: 1 },
      { valor: '2', rotulo: '2 — dissociação (balancim)', pontos: 2 },
    ], { ajuda: 'Observe o recém-nascido despido e calmo, em decúbito dorsal, por pelo menos 30 segundos. O balancim (tórax deprime enquanto o abdome expande) reflete complacência pulmonar muito baixa somada a caixa torácica cartilaginosa que cede em vez de sustentar volume.' }),
    campoOpc('intercostal', 'Retração intercostal', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreta', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuada', pontos: 2 },
    ]),
    campoOpc('xifoide', 'Retração xifoide', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreta', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuada', pontos: 2 },
    ]),
    campoOpc('nasal', 'Batimento de aletas nasais', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — discreto', pontos: 1 },
      { valor: '2', rotulo: '2 — acentuado', pontos: 2 },
    ]),
    campoOpc('gemido', 'Gemido expiratório', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — audível à ausculta', pontos: 1 },
      { valor: '2', rotulo: '2 — audível sem estetoscópio', pontos: 2 },
    ], { ajuda: 'O sinal mais específico do boletim. É um CPAP autogerado: o recém-nascido fecha parcialmente a glote na expiração para manter pressão positiva e evitar colapso alveolar. Cuidado — o desaparecimento do gemido pode ser melhora OU exaustão da musculatura, e só o exame e a gasometria distinguem.' }),
  ],
  calcular: (v) => {
    const ids = ['toracoAbdominal', 'intercostal', 'xifoide', 'nasal', 'gemido']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const faixa = total === 0 ? 0 : total <= 3 ? 1 : total <= 6 ? 2 : 3
    return {
      titulo: 'Boletim de Silverman-Andersen',
      valor: String(total),
      unidade: 'de 10',
      nivel: (['ok', 'atencao', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Sem desconforto', 'Desconforto leve', 'Desconforto moderado', 'Desconforto grave — insuficiência respiratória iminente'][faixa],
      detalhes: [{ rotulo: 'Interpretação inversa', valor: 'Neste boletim, **quanto maior a pontuação, pior** — ao contrário do Apgar.' }],
      interpretacao: [
        faixa === 0
          ? 'Sem sinais de desconforto respiratório.'
          : faixa === 1
            ? 'Desconforto leve: observe de perto, monitorize saturação e reavalie com frequência.'
            : faixa === 2
              ? 'Desconforto moderado: considere suporte com pressão positiva contínua nasal (CPAP), oximetria contínua e gasometria.'
              : '**Desconforto grave**: suporte ventilatório imediato. Considere surfactante se houver síndrome do desconforto respiratório do prematuro.',
        'O **gemido expiratório** é o sinal mais específico: o recém-nascido fecha parcialmente a glote na expiração para gerar pressão positiva no fim da expiração e evitar o colapso alveolar. É um CPAP fisiológico — e explica por que o CPAP nasal funciona tão bem nesse cenário.',
        'A **respiração em balancim** (tórax deprime enquanto o abdome expande) reflete a complacência muito baixa do pulmão somada à caixa torácica extremamente complacente do prematuro.',
        'Principais causas de desconforto respiratório neonatal: síndrome do desconforto respiratório por deficiência de surfactante (prematuros), taquipneia transitória (retenção de líquido pulmonar, mais comum em cesariana eletiva), síndrome de aspiração meconial, pneumonia e sepse precoce, pneumotórax, cardiopatia congênita e hérnia diafragmática.',
        'Todo o boletim é a leitura clínica de um único problema: **tensão superficial alveolar não neutralizada**. O surfactante, produzido pelos pneumócitos tipo II a partir de 24 a 28 semanas e em quantidade adequada só perto de 34 a 36 semanas, é uma mistura de fosfolipídios (sobretudo dipalmitoilfosfatidilcolina) com proteínas SP-A a SP-D que se adsorve à interface ar-líquido e reduz a tensão superficial. Sem ele, a lei de Laplace passa a governar o pulmão: a pressão de colapso de um alvéolo é proporcional ao dobro da tensão superficial dividido pelo raio, de modo que **alvéolos menores colapsam primeiro** e esvaziam dentro dos maiores. O resultado é atelectasia progressiva e heterogênea, com shunt intrapulmonar, hipoxemia e queda acentuada da complacência. Para ventilar um pulmão assim, o recém-nascido precisa gerar pressões intrapleurais muito negativas — e é aí que a segunda peculiaridade entra: a caixa torácica neonatal é cartilaginosa e altamente complacente, de modo que ela cede em vez de sustentar volume. Daí as retrações intercostal e xifoide e a respiração em balancim, que não são sinais diferentes: são a mesma física vista em lugares diferentes.',
        'O **gemido** merece destaque porque é o único item que representa uma estratégia compensatória eficaz, e não apenas o custo do esforço. Ao fechar parcialmente a glote durante a expiração, o recém-nascido cria resistência e mantém pressão positiva no fim da expiração, preservando volume residual e impedindo o colapso completo dos alvéolos. É um CPAP autogerado — e é exatamente por isso que o **CPAP nasal** funciona tão bem nesse cenário: ele faz externamente o mesmo trabalho, poupando a musculatura. Isso também explica uma armadilha grave: o desaparecimento do gemido pode significar melhora **ou** exaustão da musculatura laríngea e respiratória. Nos dois casos o escore cai, e apenas o exame e a gasometria distinguem um do outro.',
      ],
      conduta: faixa === 0
        ? [
            'Sem sinais de desconforto. Mantenha em contato pele a pele com a mãe, garanta termorregulação (o recém-nascido perde calor rapidamente pela relação superfície-massa) e estimule amamentação precoce.',
            'Reavalie de forma seriada nas primeiras horas: a taquipneia transitória e a síndrome do desconforto respiratório podem se instalar progressivamente, e o escore zero da sala de parto não garante a próxima hora.',
          ]
        : faixa === 1
          ? [
              'Desconforto leve: oximetria contínua e reavaliação frequente do boletim, registrando o valor com horário. **A tendência decide** — escore que sobe em uma hora é mais informativo que o valor isolado.',
              'Garanta termorregulação, glicemia capilar e hidratação. Hipotermia e hipoglicemia agravam o desconforto e são causas corrigíveis em minutos.',
              'Considere oxigênio suplementar se a saturação estiver abaixo do alvo, respeitando os alvos neonatais (habitualmente 90 a 95% no prematuro) — hiperóxia no prematuro aumenta risco de retinopatia e de displasia broncopulmonar.',
              'Avalie a causa: idade gestacional, via de parto, bolsa rota prolongada, febre materna, líquido meconial e fatores de risco para sepse precoce definem a investigação e a necessidade de antibiótico.',
            ]
          : faixa === 2
            ? [
                '**CPAP nasal** é o suporte de escolha: ele reproduz externamente o que o gemido tenta fazer, mantendo pressão positiva no fim da expiração, recrutando alvéolos colapsados e reduzindo o trabalho respiratório. Inicie com 5 a 6 cmH₂O e titule pela resposta clínica e pela saturação.',
                'Colha **gasometria** e radiografia de tórax. A gasometria informa o que o escore não vê (oxigenação e ventilação), e a radiografia diferencia as causas: infiltrado reticulogranular com broncograma aéreo na doença de membrana hialina, trama vascular aumentada e líquido nas cissuras na taquipneia transitória, infiltrado grosseiro na aspiração meconial, hipertransparência na síndrome de escape de ar.',
                'Investigue e trate **sepse precoce** se houver fator de risco: hemocultura e antibiótico empírico (ampicilina com gentamicina) conforme protocolo. Desconforto respiratório é a apresentação mais comum de sepse neonatal, e a distinção clínica com doença de membrana hialina é inconfiável.',
                'Mantenha o recém-nascido em ambiente térmico neutro, com acesso venoso, glicemia monitorizada e aporte hídrico adequado. Considere sonda gástrica e suspensão da dieta enteral enquanto o esforço respiratório for significativo, pelo risco de aspiração.',
              ]
            : [
                '**Suporte ventilatório imediato.** Escore acima de 6 indica insuficiência respiratória iminente: escale para ventilação mecânica se houver apneia, acidose respiratória progressiva, hipoxemia refratária ao CPAP ou exaustão.',
                'Considere **surfactante exógeno** precocemente se houver síndrome do desconforto respiratório do prematuro — administração precoce reduz mortalidade, pneumotórax e displasia broncopulmonar. Use a estratégia INSURE ou LISA (intubar, administrar, extubar para CPAP; ou administração menos invasiva) quando o serviço dominar a técnica.',
                'Descarte de imediato as causas que exigem intervenção específica e não respondem a surfactante nem a CPAP: **pneumotórax** (assimetria de ausculta, desvio de traqueia, deterioração súbita — considere transiluminação e drenagem), **hérnia diafragmática** (abdome escavado, ausculta de ruídos hidroaéreos no tórax; contraindica ventilação com bolsa e máscara), **cardiopatia congênita** (teste do coraçãozinho, teste de hiperóxia, ecocardiograma) e obstrução de via aérea alta.',
                'Acione a unidade de terapia intensiva neonatal e, se necessário, transporte em incubadora com suporte ventilatório. Nesse escore, o tempo até o suporte definitivo é o que determina o desfecho.',
                'Gasometria seriada, radiografia, monitorização contínua e reavaliação do escore em intervalos curtos — mas lembre que, nesta faixa, o exame clínico e a gasometria prevalecem sobre o número.',
              ],
      alertas: [
        'O escore avalia **esforço, não oxigenação**. Um prematuro exausto pontua baixo por já não conseguir gerar esforço, e isso é gravidade extrema disfarçada de melhora. Escore que cai junto com piora clínica, apneia ou acidose é sinal de falência iminente.',
        'A interpretação é **inversa à do Apgar**: aqui, quanto maior a pontuação, pior. Confundir os dois na passagem de plantão já produziu conduta invertida.',
        'Nenhum valor do boletim substitui oximetria, gasometria e radiografia. Em desconforto respiratório neonatal, hipoxemia grave pode coexistir com escore modesto.',
        'Deterioração súbita em recém-nascido em ventilação com pressão positiva obriga a pensar em **pneumotórax** antes de ajustar parâmetros — a caixa torácica complacente e o pulmão heterogêneo favorecem escape de ar.',
        'Alvos de saturação no prematuro são mais baixos que no termo (habitualmente 90 a 95%). Hiperóxia aumenta risco de retinopatia da prematuridade e de displasia broncopulmonar — oxigênio é fármaco com dose e teto.',
      ],
      tabela: {
        titulo: 'Faixas do boletim e suporte correspondente',
        colunas: ['Pontos', 'Gravidade', 'Suporte'],
        linhas: [
          ['0', 'Sem desconforto', 'Contato pele a pele, reavaliação seriada'],
          ['1 – 3', 'Leve', 'Oximetria contínua, O₂ se necessário'],
          ['4 – 6', 'Moderado', 'CPAP nasal, gasometria, radiografia'],
          ['7 – 10', 'Grave', 'Ventilação mecânica, considerar surfactante'],
        ],
        destaque: faixa,
      },
    }
  },
  formula: ['Soma de 5 sinais, 0 a 2 pontos cada; quanto maior, pior'],
  fundamento:
    'Silverman e Andersen publicaram o boletim em 1956, correlacionando sinais clínicos de esforço respiratório com a gravidade da doença de membrana hialina. Os cinco sinais medem o mesmo fenômeno de ângulos diferentes: quando a complacência pulmonar cai, o recém-nascido gera pressões intratorácicas muito negativas, e a caixa torácica cartilaginosa cede — daí retrações e movimento paradoxal. Os cinco sinais traduzem a mesma física: sem surfactante, a tensão superficial alveolar não é reduzida e, pela **lei de Laplace**, os alvéolos menores colapsam para dentro dos maiores, exigindo pressões de abertura crescentes a cada ciclo. O recém-nascido compensa recrutando musculatura acessória (tiragem intercostal e retração xifóidea), aumentando a pressão inspiratória (batimento de asa do nariz, balancim toracoabdominal) e gerando PEEP própria pelo fechamento parcial da glote na expiração — que é o gemido.',
  armadilhas: [
    'O escore avalia esforço, não oxigenação. Um prematuro exausto pode ter escore baixo por não conseguir mais gerar esforço — isso é sinal de gravidade extrema, não de melhora.',
    'Sempre correlacione com saturação, frequência respiratória, gasometria e radiografia.',
    'Interpretação inversa à do Apgar: aqui a pontuação alta é ruim. É a confusão mais comum na passagem de plantão.',
    'O desaparecimento do gemido é ambíguo — pode ser melhora ou exaustão da musculatura laríngea. Somente exame e gasometria distinguem.',
    'Não diferencia as causas. Doença de membrana hialina, taquipneia transitória, sepse precoce, pneumotórax, hérnia diafragmática e cardiopatia congênita produzem o mesmo escore e exigem condutas distintas.',
    'Foi derivado em prematuros com doença de membrana hialina. Em recém-nascido a termo, e sobretudo pós-termo com aspiração meconial, a calibração é menos estudada.',
    'Um valor isolado informa pouco. Registre o boletim em série, com horário, porque é a trajetória que indica necessidade de escalar suporte.',
  ],
  referencias: [
    { texto: 'Silverman WA, Andersen DH. A controlled clinical trial of effects of water mist on obstructive respiratory signs, death rate and necropsy findings among premature infants. Pediatrics. 1956;17(1):1-10.' },
    { texto: 'Hedstrom AB, Gove NE, Mayock DE, Batra M. Performance of the Silverman Andersen Respiratory Severity Score. J Perinatol. 2018;38(5):505-511.' },
  ],
}

const fototerapia: Ferramenta = {
  id: 'bilirrubina-fototerapia',
  nome: 'Bilirrubina neonatal e indicação de fototerapia',
  sinonimos: ['ictericia neonatal', 'fototerapia', 'bilirrubina', 'exsanguineotransfusao', 'bhutani'],
  resumo: 'Compara a bilirrubina com o limiar de fototerapia por idade, idade gestacional e risco.',
  categorias: ['pediatria'],
  campos: [
    campoNum('bilirrubina', 'Bilirrubina total sérica', { unidade: 'mg/dL', min: 0.5, max: 40, passo: 0.1 }),
    campoNum('horas', 'Idade pós-natal', { unidade: 'horas', min: 12, max: 336, passo: 1 }),
    campoNum('ig', 'Idade gestacional ao nascer', { unidade: 'semanas', min: 32, max: 42, passo: 1 }),
    campoSimNao('risco', 'Fator de risco de neurotoxicidade presente', 1, 'Doença hemolítica isoimune, deficiência de glicose-6-fosfato desidrogenase, asfixia, letargia significativa, instabilidade térmica, sepse, acidose, ou albumina < 3,0 g/dL.'),
  ],
  calcular: (v) => {
    const bili = num(v, 'bilirrubina')
    const horas = num(v, 'horas')
    const ig = num(v, 'ig')
    if (bili === null || horas === null || ig === null) return null
    const comRisco = sim(v, 'risco')
    // Aproximação linear das curvas da AAP 2022: o limiar sobe com as horas até um platô,
    // e desce com a prematuridade e com a presença de fator de risco de neurotoxicidade.
    const igEfetiva = Math.min(Math.max(ig, 35), 38)
    const baseIg = 21 - (38 - igEfetiva) * 1.5
    const fatorHoras = Math.min(horas, 96) / 96
    let limiar = baseIg * (0.5 + 0.5 * fatorHoras)
    if (comRisco) limiar -= 2
    const limiarExsanguineo = limiar + 5
    const indicada = bili >= limiar
    const detalhes: Resultado['detalhes'] = [
      { rotulo: 'Limiar aproximado de fototerapia', valor: `${fmt(limiar, 1)} mg/dL`, nota: 'Estimativa didática a partir das curvas da Academia Americana de Pediatria de 2022.' },
      { rotulo: 'Diferença para o limiar', valor: `${bili - limiar >= 0 ? '+' : ''}${fmt(bili - limiar, 1)} mg/dL`, nivel: indicada ? 'alerta' : 'ok' },
      { rotulo: 'Limiar aproximado de exsanguineotransfusão', valor: `${fmt(limiarExsanguineo, 1)} mg/dL`, nota: 'Também aproximado. Nível a 2 mg/dL do limiar de exsanguineotransfusão é indicação de fototerapia intensiva e escalada imediata.', nivel: bili >= limiarExsanguineo ? 'critico' : 'neutro' },
      { rotulo: 'Idade gestacional considerada', valor: `${fmtInt(ig)} semanas`, nota: ig < 35 ? '⚠ Abaixo de 35 semanas, os limiares seguem protocolos específicos para prematuros, bem mais baixos do que os aqui estimados.' : undefined, nivel: ig < 35 ? 'alerta' : 'neutro' },
    ]
    const nivel: Nivel = bili >= limiarExsanguineo ? 'critico' : indicada ? 'alerta' : 'ok'
    return {
      titulo: indicada ? 'Fototerapia indicada' : 'Abaixo do limiar de fototerapia',
      valor: `${fmt(bili, 1)} mg/dL`,
      nivel,
      rotuloNivel: `${fmtInt(horas)} h de vida · ${fmtInt(ig)} semanas${comRisco ? ' · com fator de risco' : ''}`,
      detalhes,
      conduta: [
        'Plote sempre o valor na curva **pela idade em horas de vida, não em dias**, e no nomograma correspondente ao risco (idade gestacional e fatores de neurotoxicidade: doença hemolítica, deficiência de glicose-6-fosfato desidrogenase, asfixia, sepse, acidose, albumina < 3,0 g/dL). Um mesmo valor pode ser normal às 72 h e indicação de fototerapia às 24 h.',
        'Indicada a **fototerapia**, garanta que ela seja eficaz: irradiância adequada (≥ 30 µW/cm²/nm na fototerapia intensiva), distância correta, máxima superfície corporal exposta, olhos protegidos e amamentação mantida ou aumentada. Fototerapia mal montada é a causa mais comum de falha aparente.',
        '**Icterícia nas primeiras 24 horas de vida é sempre patológica.** Investigue imediatamente com bilirrubinas total e frações, tipagem sanguínea e Coombs direto da mãe e do bebê, hemograma com reticulócitos e pesquisa de glicose-6-fosfato desidrogenase — e trate a causa, não apenas o número.',
        'Considere **exsanguineotransfusão** quando o valor ultrapassar o limiar da curva correspondente, quando houver sinais de **encefalopatia bilirrubínica aguda** (letargia, hipotonia seguida de hipertonia, choro agudo, opistótono, febre) ou quando a bilirrubina subir apesar de fototerapia intensiva. Nesses casos, o tempo é neurônio: acione a unidade neonatal imediatamente. Imunoglobulina intravenosa pode reduzir a necessidade de exsanguineotransfusão na doença hemolítica isoimune.',
        'Diferencie **hiperbilirrubinemia indireta** (a comum, do recém-nascido, que a fototerapia trata) de **direta ou conjugada** (bilirrubina direta > 1,0 mg/dL, ou > 20% do total). Esta última **nunca** é fisiológica e não responde à fototerapia: investigue atresia de vias biliares com urgência, porque a portoenterostomia de Kasai tem resultado muito melhor quando feita antes dos 60 dias de vida.',
      ],
      interpretacao: [
        '⚠ **Esta ferramenta é uma aproximação didática das curvas oficiais.** A decisão real deve ser tomada sobre o nomograma da Academia Americana de Pediatria de 2022 ou o protocolo institucional, que são curvas contínuas por idade gestacional e hora de vida. Use este resultado para raciocinar, não para prescrever.',
        '**Sempre investigue a causa** quando a icterícia surge nas primeiras 24 horas de vida, quando a bilirrubina sobe mais de 0,2 mg/dL por hora, quando persiste além de 2 semanas, ou quando há colestase (bilirrubina direta acima de 1 mg/dL ou acima de 20% do total). Icterícia nas primeiras 24 horas é **sempre patológica**.',
        'Investigação mínima: tipagem sanguínea materna e do recém-nascido, Coombs direto, hemograma com reticulócitos, esfregaço, bilirrubinas frações e, conforme a suspeita, dosagem de glicose-6-fosfato desidrogenase.',
        'A **bilirrubinometria transcutânea** é excelente para rastreio e reduz punções, mas perde acurácia acima de 15 mg/dL e após o início da fototerapia — nesses casos, confirme com dosagem sérica.',
        'O **kernicterus** é raro e integralmente prevenível. Os sinais de encefalopatia bilirrubínica aguda — letargia, hipotonia, sucção fraca, evoluindo para hipertonia, retrocolo, opistótono, febre e choro agudo — exigem exsanguineotransfusão de urgência, independentemente do valor.',
      ],
      alertas: ['Fototerapia intensiva (irradiância ≥ 30 µW/cm²/nm, com máxima superfície corporal exposta) é diferente de fototerapia convencional. Se o nível estiver próximo do limiar de exsanguineotransfusão, use a intensiva e reavalie em 2 a 4 horas.'],
    }
  },
  formula: ['Limiares por idade pós-natal, idade gestacional e fatores de risco de neurotoxicidade (aproximação das curvas AAP 2022)'],
  fundamento:
    'A bilirrubina não conjugada é lipossolúvel e, quando excede a capacidade de ligação da albumina, atravessa a barreira hematoencefálica e se deposita preferencialmente nos gânglios da base — o que dá nome ao kernicterus. A fototerapia atua por fotoisomerização: a luz azul (comprimento de onda de 460 a 490 nm) converte a bilirrubina em lumirrubina, um isômero hidrossolúvel excretado sem conjugação hepática.',
  armadilhas: [
    'Não se guie pela avaliação visual da icterícia — ela subestima sistematicamente, sobretudo em pele mais pigmentada e sob luz artificial.',
    'A icterícia do leite materno (tardia, com bom ganho de peso) difere da icterícia por baixa oferta de leite (precoce, com perda de peso e desidratação). A segunda se trata otimizando a amamentação, não suspendendo-a.',
  ],
  referencias: [
    { texto: 'Kemper AR, Newman TB, Slaughter JL, et al. Clinical practice guideline revision: management of hyperbilirubinemia in the newborn infant 35 or more weeks of gestation. Pediatrics. 2022;150(3):e2022058859.' },
    { texto: 'Bhutani VK, Johnson L, Sivieri EM. Predictive ability of a predischarge hour-specific serum bilirubin for subsequent significant hyperbilirubinemia. Pediatrics. 1999;103(1):6-14.' },
  ],
}

const idadeCorrigida: Ferramenta = {
  id: 'idade-corrigida',
  nome: 'Idade corrigida do prematuro',
  sinonimos: ['idade corrigida', 'prematuro', 'idade gestacional corrigida'],
  resumo: 'Corrige a idade cronológica pela prematuridade, para avaliar crescimento e desenvolvimento.',
  categorias: ['pediatria'],
  campos: [
    campoNum('igNascimento', 'Idade gestacional ao nascer', { unidade: 'semanas', min: 22, max: 42, passo: 1, ajuda: 'Semanas completas ao nascimento, pela melhor datação disponível — ultrassonografia de primeiro trimestre é a mais confiável, seguida da data da última menstruação e, por último, dos métodos somáticos (Capurro, New Ballard).' }),
    campoNum('igDias', 'Dias adicionais na idade gestacional', { unidade: 'dias', min: 0, max: 6, passo: 1, padrao: '0', ajuda: 'A fração de semana, de 0 a 6 dias. Um recém-nascido de 32 semanas e 5 dias tem 32 aqui e 5 neste campo — a precisão importa no prematuro extremo, em que cada semana muda a curva de referência.' }),
    campoNum('idadeCronologica', 'Idade cronológica atual', { unidade: 'meses', min: 0, max: 48, passo: 0.5, ajuda: 'Meses desde o NASCIMENTO, não desde a alta da unidade neonatal. É esta idade, e não a corrigida, que governa o calendário vacinal.' }),
  ],
  calcular: (v) => {
    const ig = num(v, 'igNascimento')
    const igDias = numOu(v, 'igDias', 0)
    const cronologica = num(v, 'idadeCronologica')
    if (ig === null || cronologica === null) return null
    const semanasPrematuro = 40 - (ig + igDias / 7)
    const mesesDesconto = semanasPrematuro / 4.345
    const corrigida = cronologica - mesesDesconto
    const idadePosMenstrual = ig + igDias / 7 + cronologica * 4.345
    return {
      titulo: 'Idade corrigida',
      valor: corrigida >= 0 ? `${fmt(corrigida, 1)} meses` : `${fmt(corrigida * 4.345, 1)} semanas antes do termo`,
      nivel: 'neutro',
      rotuloNivel: `Nasceu com ${fmt(semanasPrematuro, 1)} semanas de antecipação`,
      detalhes: [
        { rotulo: 'Idade cronológica', valor: `${fmt(cronologica, 1)} meses`, nota: 'Contada a partir do nascimento. É a que vale para o calendário vacinal.' },
        { rotulo: 'Desconto pela prematuridade', valor: `${fmt(mesesDesconto, 1)} meses` },
        { rotulo: 'Idade corrigida', valor: `${fmt(corrigida, 1)} meses`, nota: 'É a que vale para avaliar crescimento, marcos do desenvolvimento e introdução alimentar.' },
        { rotulo: 'Idade pós-menstrual', valor: `${fmt(idadePosMenstrual, 1)} semanas`, nota: 'Idade gestacional ao nascer + idade cronológica. É a usada nos protocolos de terapia intensiva neonatal e no rastreio de retinopatia da prematuridade.' },
        { rotulo: 'Até quando corrigir', valor: 'Até 2 anos (24 meses)', nota: 'Alguns serviços corrigem até 3 anos em prematuros extremos, sobretudo para perímetro cefálico e desenvolvimento neurológico.' },
      ],
      interpretacao: [
        '**A idade corrigida vale para crescimento e desenvolvimento. A idade cronológica vale para vacinas.** Essa é a distinção que mais gera erro na prática: o prematuro é vacinado pela idade cronológica, com as doses e o esquema habituais, independentemente do peso ou da idade corrigida (com exceções pontuais na hepatite B e no BCG conforme o peso).',
        'Sem a correção, todo prematuro parece ter atraso de crescimento e de desenvolvimento nos primeiros dois anos. Plotar um bebê de 6 meses nascido com 28 semanas na curva de 6 meses produz um diagnóstico falso de desnutrição e de atraso motor.',
        'Para prematuros, use as curvas de **Fenton** ou **Intergrowth-21st** até 50 semanas de idade pós-menstrual, e só então migre para as curvas da OMS com idade corrigida.',
        'Prematuros exigem seguimento estruturado: rastreio de retinopatia (a partir de 4 a 6 semanas de vida ou 31 semanas de idade pós-menstrual), triagem auditiva, avaliação do neurodesenvolvimento, suplementação de ferro e vitamina D, e vigilância nutricional.',
        'Existem **três idades** diferentes em uso no prematuro, e confundi-las é a origem de quase todos os erros de seguimento. A **cronológica** conta desde o nascimento e governa o calendário vacinal, porque o sistema imune responde ao tempo de exposição ao ambiente extrauterino: a maturação de linfócitos B e T e a resposta a antígenos vacinais dependem do estímulo pós-natal, não da idade gestacional. A **corrigida** desconta as semanas de prematuridade e governa crescimento, marcos do desenvolvimento e introdução alimentar, porque a mielinização, a sinaptogênese e a poda sináptica seguem o relógio contado desde a concepção — um bebê de 6 meses nascido com 28 semanas tem cérebro de 3 meses de idade corrigida. A **pós-menstrual** soma a idade gestacional à cronológica e governa os protocolos de terapia intensiva neonatal e o rastreio de retinopatia da prematuridade, porque a vascularização retiniana progride da papila à periferia em cronologia fixa desde a concepção e só se completa em torno de 40 a 44 semanas pós-menstruais.',
        'Há um motivo mecanístico para o prematuro precisar de mais ferro, e ele explica a suplementação de rotina. Cerca de **80% do estoque de ferro fetal é transferido no terceiro trimestre**, sobretudo após 30 semanas, de modo que o prematuro nasce com reserva proporcionalmente menor. A isso se somam crescimento pós-natal acelerado (que dilui a hemoglobina num compartimento em expansão rápida), flebotomias repetidas da internação e resposta eritropoetínica imatura — o rim fetal produz eritropoetina de forma menos eficiente e a transição hepática para renal é lenta. O resultado é a anemia da prematuridade, distinta da anemia fisiológica do lactente a termo e que justifica ferro profilático mais precoce e em dose maior.',
      ],
      conduta: [
        'Plote crescimento e desenvolvimento **pela idade corrigida** até os 2 anos — 3 anos em prematuro extremo, sobretudo para perímetro cefálico e marcos neurológicos. Use as curvas de **Fenton** ou **Intergrowth-21st** até 50 semanas de idade pós-menstrual e só então migre para as curvas da OMS com idade corrigida.',
        '**Vacine pela idade cronológica**, com doses e intervalos habituais, independentemente do peso ou da idade corrigida. As exceções são pontuais e dizem respeito ao peso: BCG a partir de 2 kg e a dose de hepatite B ao nascer em recém-nascido de mãe HBsAg positiva com menos de 2 kg, que exige esquema de quatro doses com imunoglobulina. Adiar vacina em prematuro é erro comum e os deixa desprotegidos justamente quando mais vulneráveis.',
        'Programe o **rastreio de retinopatia da prematuridade** pela idade pós-menstrual: primeiro exame com 4 a 6 semanas de vida ou 31 semanas pós-menstruais, o que vier depois, em nascidos com menos de 32 semanas ou menos de 1.500 g. Perder essa janela custa visão de forma irreversível.',
        'Suplemente **ferro** (2 a 4 mg/kg/dia, iniciando por volta de 4 a 6 semanas de vida e mantendo até 12 meses de idade corrigida) e **vitamina D** (400 UI/dia). Ajuste a dose de ferro ao peso de nascimento — quanto mais prematuro, maior a necessidade.',
        'Mantenha seguimento multiprofissional estruturado: triagem auditiva neonatal com reteste, avaliação oftalmológica, fisioterapia e terapia ocupacional quando indicadas, fonoaudiologia para disfagia e avaliação formal do neurodesenvolvimento em marcos definidos (6, 12, 18 e 24 meses de idade corrigida).',
        'Explique a diferença entre as idades à família, por escrito. Pai e mãe que entendem que "o bebê tem 6 meses de vida e 3 de idade corrigida" param de comparar com o primo a termo, aderem melhor ao seguimento e param de atrasar vacina por conta própria.',
      ],
      alertas: [
        'Não corrija a idade para o calendário vacinal. Adiar vacinas em prematuros é erro comum, frequente e prejudicial — eles têm maior risco de doença invasiva, não menor.',
        'Idade corrigida negativa significa que o bebê ainda não alcançou a data provável do parto. Nessa fase, use **idade pós-menstrual** para tudo: nutrição, protocolos de terapia intensiva e rastreio de retinopatia.',
        'A correção não é diagnóstico. Atraso de desenvolvimento persistente **pela idade corrigida**, ou perda de marco já adquirido, exige investigação e não mais desconto de prematuridade.',
        'O rastreio de retinopatia segue a idade pós-menstrual e tem janela crítica. Nenhuma outra idade serve para programá-lo.',
      ],
      tabela: {
        titulo: 'As três idades do prematuro e para que serve cada uma',
        colunas: ['Idade', 'Como calcular', 'Para que serve'],
        linhas: [
          ['Cronológica', 'Tempo desde o nascimento', 'Calendário vacinal'],
          ['Corrigida', 'Cronológica − semanas de prematuridade', 'Crescimento, marcos, introdução alimentar'],
          ['Pós-menstrual', 'IG ao nascer + cronológica', 'Protocolos de UTI neonatal e rastreio de ROP'],
        ],
        destaque: 1,
      },
    }
  },
  formula: [
    'Semanas de prematuridade = 40 − idade gestacional ao nascer',
    'Idade corrigida = idade cronológica − semanas de prematuridade',
    'Idade pós-menstrual = idade gestacional ao nascer + idade cronológica',
  ],
  fundamento:
    'A correção existe porque o desenvolvimento neurológico e o crescimento seguem o relógio biológico contado desde a concepção, não desde o nascimento. Um bebê nascido com 28 semanas passou 12 semanas fora do útero fazendo o que faria dentro dele — e comparar seu desenvolvimento com o de um nascido a termo da mesma idade cronológica é comparar organismos com idades biológicas distintas. A correção existe porque o desenvolvimento neurológico é contado a partir da **concepção**, não do nascimento: a mielinização, a sinaptogênese e a poda sináptica seguem um cronograma intrauterino que o parto prematuro interrompe mas não acelera. Avaliar um prematuro de 28 semanas pela idade cronológica o compara com uma criança que teve três meses a mais de maturação cerebral, e produz diagnóstico falso de atraso — motivo pelo qual a correção se mantém até os 2 a 3 anos, quando a diferença se dilui.',
  armadilhas: [
    'Não corrija a idade para o calendário vacinal. Adiar vacinas em prematuros é erro comum e os deixa desprotegidos justamente quando estão mais vulneráveis.',
    'A correção é habitualmente feita para nascidos com menos de 37 semanas; o benefício é maior quanto mais prematuro.',
    'Confundir idade corrigida com idade pós-menstrual troca o protocolo. A pós-menstrual é a que programa o rastreio de retinopatia e governa as decisões de terapia intensiva neonatal; a corrigida é a de crescimento e desenvolvimento.',
    'Atraso que persiste pela idade corrigida não é mais efeito da prematuridade e exige investigação. Usar a correção como explicação indefinida atrasa diagnóstico de paralisia cerebral, autismo e deficiência sensorial.',
    'A correção até 2 anos é convenção prática, não um corte biológico. Em prematuro extremo, perímetro cefálico e desenvolvimento neurológico se beneficiam de correção até 3 anos.',
    'Introdução alimentar segue a idade corrigida, porque depende de maturação neuromuscular da deglutição e do controle cervical — oferecer sólidos aos 6 meses cronológicos de um prematuro de 28 semanas é oferecer a um bebê de 3 meses corrigidos.',
  ],
  referencias: [
    { texto: 'Engle WA; American Academy of Pediatrics Committee on Fetus and Newborn. Age terminology during the perinatal period. Pediatrics. 2004;114(5):1362-1364.' },
    { texto: 'Fenton TR, Kim JH. A systematic review and meta-analysis to revise the Fenton growth chart for preterm infants. BMC Pediatr. 2013;13:59.' },
  ],
}

const percentis: Ferramenta = {
  id: 'percentis-crescimento',
  nome: 'Percentis e escore-z de crescimento',
  sinonimos: ['percentil', 'z-score', 'curva de crescimento', 'perimetro cefalico', 'imc por idade'],
  resumo: 'Converte medida em escore-z e percentil, com os marcos de crescimento de referência.',
  categorias: ['pediatria', 'nutricao'],
  campos: [
    campoSeg('parametro', 'Parâmetro', [
      { valor: 'peso', rotulo: 'Peso para a idade' },
      { valor: 'estatura', rotulo: 'Estatura para a idade' },
      { valor: 'pc', rotulo: 'Perímetro cefálico' },
      { valor: 'imc', rotulo: 'IMC para a idade' },
    ]),
    campoNum('medida', 'Medida da criança', { min: 0.5, max: 200, passo: 0.1, ajuda: 'kg para peso, cm para estatura e perímetro cefálico, kg/m² para IMC.' }),
    campoNum('mediana', 'Mediana da curva de referência para a idade e o sexo', { min: 0.5, max: 200, passo: 0.1, ajuda: 'Leia o valor do percentil 50 na curva da OMS correspondente.' }),
    campoNum('dp', 'Desvio-padrão da curva', { min: 0.05, max: 30, passo: 0.01, ajuda: 'Diferença entre o percentil 50 e o escore-z de +1 (ou entre −1 e a mediana).' }),
  ],
  calcular: (v) => {
    const medida = num(v, 'medida')
    const mediana = num(v, 'mediana')
    const dp = num(v, 'dp')
    const par = opc(v, 'parametro')
    if (medida === null || mediana === null || dp === null || dp <= 0) return null
    const z = (medida - mediana) / dp
    // Aproximação de Zelen & Severo para a função de distribuição normal padrão.
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp((-z * z) / 2)
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    p = z > 0 ? 1 - p : p
    const percentil = p * 100
    const rotulos: Record<string, [string, string, string]> = {
      peso: ['Peso muito baixo para a idade (z < −3)', 'Peso baixo para a idade (z entre −3 e −2)', 'Peso adequado'],
      estatura: ['Estatura muito baixa (z < −3)', 'Estatura baixa (z entre −3 e −2)', 'Estatura adequada'],
      pc: ['Microcefalia (z < −3)', 'Perímetro cefálico abaixo do esperado', 'Perímetro cefálico adequado'],
      imc: ['Magreza acentuada (z < −3)', 'Magreza (z entre −3 e −2)', 'Eutrofia'],
    }
    const r = rotulos[par]
    let classificacao = r[2]
    let nivel: Nivel = 'ok'
    if (z < -3) { classificacao = r[0]; nivel = 'critico' }
    else if (z < -2) { classificacao = r[1]; nivel = 'alerta' }
    else if (par === 'imc' && z > 3) { classificacao = 'Obesidade (z > +3)'; nivel = 'alerta' }
    else if (par === 'imc' && z > 2) { classificacao = 'Sobrepeso (z entre +2 e +3)'; nivel = 'atencao' }
    else if (par === 'pc' && z > 2) { classificacao = 'Macrocefalia (z > +2)'; nivel = 'alerta' }
    return {
      titulo: 'Escore-z',
      valor: `${z >= 0 ? '+' : ''}${fmt(z, 2)}`,
      nivel,
      rotuloNivel: classificacao,
      detalhes: [
        { rotulo: 'Percentil', valor: percentil < 0.1 ? '< 0,1' : percentil > 99.9 ? '> 99,9' : fmt(percentil, 1) },
        { rotulo: 'Diferença para a mediana', valor: `${medida - mediana >= 0 ? '+' : ''}${fmt(medida - mediana, 2)}` },
        { rotulo: 'Correspondências úteis', valor: 'z = −2 → percentil 2,3 · z = −1 → 15,9 · z = 0 → 50 · z = +1 → 84,1 · z = +2 → 97,7' },
      ],
      conduta: [
        'Interprete a **trajetória, não o ponto**: uma criança que cresce consistentemente no percentil 5 e mantém o canal é provavelmente normal, enquanto uma que cai do percentil 75 para o 25 em poucos meses precisa de investigação, mesmo estando \'dentro da normalidade\'. O cruzamento de dois canais principais é o sinal de alarme.',
        'Escolha a **curva certa**: OMS de 0 a 5 anos (padrão de como crianças **devem** crescer, derivado de crianças amamentadas em condições ideais) e OMS de 5 a 19 anos depois. Use curvas específicas quando indicado — prematuros com idade corrigida até os 2 anos (ou curvas de Fenton/INTERGROWTH), síndrome de Down, acondroplasia, síndrome de Turner.',
        'Prefira o **escore-z ao percentil** nos extremos: entre o percentil 0,1 e o 3 todos aparecem colados na mesma linha, enquanto o escore-z distingue −2 de −4 desvios padrão, diferença que muda completamente a urgência e a conduta.',
        'Diante de **baixa estatura**, calcule a **estatura-alvo parental** e a **velocidade de crescimento** (o parâmetro mais sensível), e solicite **idade óssea**. Velocidade normal com estatura baixa e idade óssea atrasada sugere atraso constitucional; velocidade reduzida obriga investigar hipotireoidismo, doença celíaca, doença renal crônica, deficiência de hormônio de crescimento e síndrome de Turner em meninas.',
        'Na **desnutrição aguda grave** (peso para altura com escore-z < −3, perímetro braquial < 11,5 cm entre 6 e 59 meses, ou edema bilateral), siga o protocolo da OMS: estabilização com atenção a hipoglicemia, hipotermia e infecção, reidratação com solução específica de baixo sódio e alto potássio, e realimentação **cautelosa** pelo risco de síndrome de realimentação. E não ignore o outro extremo: sobrepeso e obesidade pedem intervenção familiar precoce e rastreio de comorbidade metabólica.',
      ],
      interpretacao: [
        '**A tendência vale mais que o ponto.** Uma criança consistentemente no percentil 10 desde o nascimento provavelmente é apenas pequena; uma que cai do percentil 50 para o 10 em seis meses tem um problema, mesmo permanecendo dentro da faixa "normal". Sempre plote a curva inteira.',
        '**Marcos de referência úteis:** o peso de nascimento dobra por volta de 4 a 5 meses e triplica com 1 ano; o comprimento aumenta cerca de 25 cm no primeiro ano (de 50 para 75 cm), 12 cm no segundo e 6 a 8 cm por ano até a puberdade; o perímetro cefálico cresce cerca de 2 cm por mês nos primeiros 3 meses, 1 cm por mês de 4 a 6 meses e 0,5 cm por mês de 7 a 12 meses (de 35 cm para 47 cm no primeiro ano).',
        'A **perda de peso fisiológica** do recém-nascido chega a 7 a 10% nos primeiros dias, com recuperação até o 10º ao 14º dia. Perda maior que 10% ou não recuperação até o 14º dia exige avaliação da amamentação.',
        'Use as curvas da **OMS** (2006 e 2007), que são prescritivas — descrevem como crianças em condições ideais **devem** crescer, e não como uma população específica cresce.',
      ],
      alertas: ['Meça corretamente: comprimento deitado até 24 meses (com régua antropométrica e duas pessoas), estatura em pé a partir dos 2 anos. A diferença entre os dois métodos é de cerca de 0,7 cm.'],
    }
  },
  formula: ['Escore-z = (medida − mediana) / desvio-padrão', 'Percentil = função de distribuição normal acumulada do escore-z'],
  fundamento:
    'O escore-z expressa quantos desvios-padrão a medida está da mediana da população de referência. Ele é superior ao percentil nos extremos: entre os percentis 1 e 0,1 há uma diferença clínica enorme que a escala de percentis comprime, enquanto o escore-z continua discriminando (z de −2,3 contra −3,1). Por isso a OMS adota escores-z para classificação nutricional. A curva da OMS de 0 a 5 anos é **prescritiva**, e não descritiva: foi construída a partir de crianças amamentadas, em condições ambientais e nutricionais ideais, em seis países, e descreve como crianças **devem** crescer, não como crescem em média. Essa escolha metodológica é o que torna legítimo comparar populações diferentes contra o mesmo padrão, e é o que muda o ponto de corte em relação às curvas descritivas antigas.',
  armadilhas: [
    'A distribuição de peso e IMC é assimétrica, e as curvas oficiais usam o método LMS (com parâmetro de assimetria). A conversão simples aqui é uma aproximação — boa perto da mediana, menos precisa nos extremos.',
    'Prematuros devem ser avaliados por idade corrigida ou por curvas específicas (Fenton, Intergrowth-21st).',
  ],
  referencias: [
    { texto: 'WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards. Acta Paediatr Suppl. 2006;450:1-101.' },
    { texto: 'de Onis M, Onyango AW, Borghi E, et al. Development of a WHO growth reference for school-aged children and adolescents. Bull World Health Organ. 2007;85(9):660-667.' },
  ],
}

const glasgowPed: Ferramenta = {
  id: 'glasgow-pediatrico',
  nome: 'Escala de Coma de Glasgow pediátrica',
  sinonimos: ['glasgow pediatrico', 'coma crianca', 'gcs pediatrico'],
  resumo: 'Adapta os componentes verbal e motor para lactentes e pré-verbais.',
  categorias: ['pediatria', 'neurologia', 'emergencia'],
  campos: [
    campoOpc('ocular', 'Abertura ocular', [
      { valor: '4', rotulo: '4 — espontânea', pontos: 4 },
      { valor: '3', rotulo: '3 — ao som ou à fala', pontos: 3 },
      { valor: '2', rotulo: '2 — à dor', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ], { ajuda: 'Único componente idêntico ao do adulto. Edema palpebral importante torna o item inavaliável — registre a limitação em vez de pontuar 1.' }),
    campoOpc('verbal', 'Resposta verbal (adaptada para lactentes)', [
      { valor: '5', rotulo: '5 — balbucia, palavras adequadas, sorri, segue objetos', pontos: 5 },
      { valor: '4', rotulo: '4 — choro consolável, interação reduzida', pontos: 4 },
      { valor: '3', rotulo: '3 — choro inconsolável, gemido à dor', pontos: 3 },
      { valor: '2', rotulo: '2 — agitação, irritabilidade, inquietação', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ], { ajuda: 'Use esta versão apenas em pré-verbais (até cerca de 4 anos). Acima disso, com linguagem estabelecida, aplique a escala do adulto — a versão de lactente superestima. Sob intubação ou sedação o item é inavaliável: registre \'V não avaliável\' em vez de atribuir 1. O divisor de águas é a consolabilidade: choro que cede ao acolhimento exige integração cortical.' }),
    campoOpc('motora', 'Melhor resposta motora', [
      { valor: '6', rotulo: '6 — movimentos espontâneos e propositais', pontos: 6 },
      { valor: '5', rotulo: '5 — retira ao toque / localiza a dor', pontos: 5 },
      { valor: '4', rotulo: '4 — retira à dor', pontos: 4 },
      { valor: '3', rotulo: '3 — flexão anormal (decorticação)', pontos: 3 },
      { valor: '2', rotulo: '2 — extensão anormal (descerebração)', pontos: 2 },
      { valor: '1', rotulo: '1 — ausente', pontos: 1 },
    ], { ajuda: 'Pontue a MELHOR resposta de qualquer membro, não a média nem a do lado pior. No pré-verbal, movimento espontâneo proposital (levar a mão a um objeto, afastar-se do estímulo) substitui a obediência a comandos, porque exige planejamento motor cortical mesmo sem compreender a instrução. Flexão e extensão anormais indicam lesão de tronco e são achado de urgência.' }),
  ],
  calcular: (v) => {
    const o = num(v, 'ocular')
    const ve = num(v, 'verbal')
    const m = num(v, 'motora')
    if (o === null || ve === null || m === null) return null
    const total = o + ve + m
    const nivel: Nivel = total <= 8 ? 'critico' : total <= 12 ? 'alerta' : total < 15 ? 'atencao' : 'ok'
    return {
      titulo: 'Glasgow pediátrico',
      valor: String(total),
      unidade: 'de 15',
      nivel,
      rotuloNivel: total <= 8 ? 'Grave' : total <= 12 ? 'Moderado' : 'Leve',
      detalhes: [
        { rotulo: 'Componentes', valor: `O${o} V${ve} M${m}` },
        { rotulo: 'Limiar de via aérea definitiva', valor: '≤ 8', nota: 'Mesmo limiar do adulto, com a ressalva de que a criança dessatura muito mais rápido — pré-oxigene bem.' },
      ],
      interpretacao: [
        'A adaptação pediátrica altera apenas os componentes **verbal** e **motor**, porque o lactente não fala nem obedece a comandos. A abertura ocular é idêntica à do adulto.',
        'Em crianças abaixo de 2 anos, o item verbal se baseia na qualidade do choro e na interação. Choro consolável e interação preservada indicam função cortical mantida.',
        'Como no adulto, registre os três componentes separadamente. E lembre que hipoglicemia, hipóxia, intoxicação e crise convulsiva não convulsiva são causas reversíveis de rebaixamento que devem ser excluídas antes de qualquer conclusão.',
        'A criança não é um adulto pequeno, e três diferenças fisiológicas mudam completamente a urgência do rebaixamento. A primeira é a **reserva de oxigênio**: o consumo basal do lactente é de 6 a 8 mL/kg/min contra 3 a 4 no adulto, enquanto a capacidade residual funcional por quilo é menor e a complacência da caixa torácica é alta (costelas cartilaginosas, que colapsam em vez de sustentar volume). O resultado é que o tempo de apneia segura é de segundos, não minutos, e a dessaturação durante uma intubação é abrupta. A segunda é a **dinâmica intracraniana**: no lactente com fontanela aberta e suturas não fundidas existe complacência extra que atrasa a elevação da pressão intracraniana, de modo que a criança pode acumular hematoma volumoso mantendo Glasgow razoável — e depois descompensar de forma súbita quando essa reserva se esgota. A terceira é o **padrão de resposta ao choque**: a criança mantém a pressão arterial por vasoconstrição intensa e taquicardia até perder cerca de 30 a 40% da volemia, e a hipotensão é sinal pré-terminal. Por isso a alteração de consciência aparece frequentemente **antes** da hipotensão e é um dos sinais mais precoces de choque pediátrico — o que faz o Glasgow funcionar, na criança, também como monitor de perfusão.',
      ],
      conduta: total <= 8
        ? [
            '**Via aérea definitiva.** O limiar é o mesmo do adulto, mas o preparo não: pré-oxigene bem (a reserva é de segundos), escolha o tubo pelo peso ou pela fórmula da idade, tenha à mão uma medida acima e uma abaixo, e use lâmina e ventilador com parâmetros pediátricos calculados antes de sedar.',
            '**Glicemia capilar agora**, antes de qualquer imagem. Hipoglicemia é a causa reversível mais frequente e mais rapidamente letal de rebaixamento em criança pequena: trate com glicose 10% 2 a 5 mL/kg no lactente (evite glicose 50%, que é hiperosmolar para veia periférica infantil) e recheque em 15 minutos.',
            'Percorra as causas reversíveis em paralelo: hipóxia, hipercapnia, hipotensão, hipotermia, intoxicação (incluindo medicamento de adulto ingerido em casa), distúrbio eletrolítico, hiperamonemia, **estado de mal não convulsivo** e infecção do sistema nervoso central. Em criança pequena, rebaixamento de causa infecciosa ou metabólica é mais comum que traumático.',
            'Se houver trauma, aplique a **regra PECARN** para decidir tomografia e procure sinais de hipertensão intracraniana — bradicardia com hipertensão (a tríade de Cushing é tardia na criança), anisocoria, postura anormal, abaulamento de fontanela. Mantenha cabeceira a 30° com cabeça neutra, normocapnia, normotermia e normoglicemia.',
            'Considere **maus-tratos** diante de rebaixamento sem mecanismo de trauma compatível, sobretudo em lactente: procure hemorragia retiniana, lesões em estágios diferentes de cicatrização e incoerência entre a história e o achado. É diagnóstico de notificação obrigatória.',
          ]
        : total <= 12
          ? [
              'Monitorize continuamente e reavalie o Glasgow em intervalos curtos, registrando os três componentes com horário. **A tendência decide**: queda de 2 pontos ou mais, ou queda de qualquer magnitude no componente motor, exige reavaliação imediata da via aérea, porque a criança com fontanela aberta descompensa de forma abrupta depois de um período aparentemente estável.',
              'Glicemia capilar, oximetria, sinais vitais completos com pressão arterial (aferida com manguito de tamanho correto) e temperatura. Procure foco infeccioso, avalie hidratação e considere punção lombar se houver suspeita de infecção do sistema nervoso central e não houver contraindicação.',
              'Garanta acesso venoso e mantenha a criança em jejum até definir a conduta. Corrija hipoglicemia, hipovolemia e febre — todos elevam a demanda metabólica cerebral e pioram o rebaixamento.',
              'Se houver trauma, aplique a regra PECARN e defina explicitamente quem reavalia e em quanto tempo. Rebaixamento moderado é a faixa em que a observação estruturada substitui, com segurança, a tomografia em boa parte dos casos.',
            ]
          : [
              'Glasgow preservado não encerra a avaliação. Meça glicemia capilar se houver qualquer alteração de comportamento, e compare o comportamento atual com o habitual **segundo o cuidador** — quem melhor detecta a criança "diferente" é quem convive com ela.',
              'Se houve trauma craniano, aplique a **regra PECARN** para decidir entre tomografia, observação ou alta: em criança de baixo risco, a observação estruturada por 4 a 6 horas evita irradiar um cérebro em desenvolvimento sem perder lesão clinicamente importante.',
              'Oriente a família por escrito sobre sinais de alarme que obrigam retorno imediato: vômitos persistentes, sonolência progressiva ou dificuldade de despertar, irritabilidade que não cede, cefaleia crescente, convulsão, marcha alterada, assimetria pupilar ou saída de sangue ou líquido claro pelo nariz ou ouvido.',
              'Registre o valor com os três componentes. Um Glasgow 14 por abertura ocular ao som é clinicamente diferente de um Glasgow 14 por resposta motora reduzida, e o total sozinho apaga essa distinção.',
            ],
      alertas: [
        'A causa mais comum de rebaixamento em criança pequena é infecciosa ou metabólica, não traumática. Glicemia capilar imediata é obrigatória.',
        'A criança dessatura em segundos, não em minutos: consumo de oxigênio por quilo quase o dobro do adulto, capacidade residual funcional menor e caixa torácica complacente. Pré-oxigenação e preparo completo antes de sedar não são opcionais.',
        'Fontanela aberta e suturas não fundidas dão complacência intracraniana extra, e a criança pode manter Glasgow razoável com hematoma volumoso até descompensar de forma súbita. Reavalie em série; um valor isolado tranquiliza mal.',
        'Hipotensão na criança é sinal **pré-terminal** de choque — ela compensa por taquicardia e vasoconstrição até perder 30 a 40% da volemia. Alteração de consciência costuma vir antes, e é por isso que o Glasgow também funciona como monitor de perfusão.',
        'Rebaixamento sem mecanismo de trauma compatível em lactente exige considerar maus-tratos, com exame de fundo de olho, avaliação de lesões em estágios diferentes e notificação obrigatória.',
        'A escala não substitui o exame pupilar, a avaliação de sinais focais nem a busca das causas reversíveis. Ela mede nível de consciência, não o que o causou.',
      ],
      tabela: {
        titulo: 'Faixas de gravidade e consequência prática',
        colunas: ['Total', 'Gravidade', 'Conduta imediata'],
        linhas: [
          ['13 – 15', 'Leve', 'Glicemia, PECARN se trauma, orientação de alarme'],
          ['9 – 12', 'Moderado', 'Monitorização contínua e reavaliação em série'],
          ['≤ 8', 'Grave', 'Via aérea definitiva, glicemia, causas reversíveis'],
        ],
        destaque: total >= 13 ? 0 : total >= 9 ? 1 : 2,
      },
    }
  },
  formula: ['GCS pediátrico = ocular (1–4) + verbal adaptada (1–5) + motora adaptada (1–6)'],
  fundamento:
    'A escala original de Glasgow pressupõe linguagem e obediência a comandos, o que a torna inaplicável abaixo de 2 anos. A adaptação pediátrica substitui esses marcadores por equivalentes desenvolvimentais: interação social e qualidade do choro no lugar da orientação verbal; movimento espontâneo proposital no lugar da obediência. A escolha desses substitutos não é arbitrária — ela segue a maturação do sistema nervoso central. A interação social do lactente (sorriso social a partir de 2 meses, seguimento visual, reconhecimento do cuidador) depende de córtex funcionante e de vias sensoriais íntegras, exatamente o que a orientação verbal testa no adulto. A qualidade do choro discrimina bem porque o choro **consolável** exige integração cortical do estímulo de acolhimento, enquanto o choro inconsolável indica processamento cortical comprometido ou dor não modulada, e o gemido sinaliza função predominantemente subcortical. No componente motor, o movimento espontâneo proposital ocupa o lugar da obediência a comandos por um motivo simples: dirigir a mão a um objeto ou afastá-la de um estímulo exige planejamento motor cortical, ainda que a criança não compreenda a instrução. Três diferenças fisiológicas fazem, porém, com que o mesmo número signifique mais urgência na criança do que no adulto. A reserva de oxigênio é menor — consumo basal de 6 a 8 mL/kg/min contra 3 a 4, capacidade residual funcional reduzida por quilo e caixa torácica cartilaginosa e complacente —, o que encurta o tempo de apneia segura a segundos. A dinâmica intracraniana é diferente, porque fontanela aberta e suturas não fundidas oferecem complacência extra que atrasa a elevação da pressão e permite descompensação súbita. E o padrão de choque é distinto: a criança sustenta a pressão arterial por taquicardia e vasoconstrição até perder 30 a 40% da volemia, de modo que a alteração de consciência frequentemente **precede** a hipotensão e o Glasgow acaba funcionando também como monitor precoce de perfusão.',
  armadilhas: [
    'Criança que dorme normalmente pode parecer rebaixada. Avalie com a criança desperta e, se possível, com o cuidador presente para julgar o comportamento habitual.',
    'A adaptação verbal é para pré-verbais. Em criança acima de 4 a 5 anos, com linguagem estabelecida, use a escala do adulto — aplicar a versão de lactente superestima a pontuação.',
    'Intubação, sedação e bloqueio neuromuscular tornam o componente verbal inavaliável. Registre "V não avaliável (tubo)" em vez de atribuir 1, e não reporte um total que embute esse zero arbitrário.',
    'O total esconde informação clínica decisiva. Glasgow 14 por abertura ocular ao som e Glasgow 14 por queda motora têm prognósticos diferentes — sempre registre os três componentes.',
    'Autismo, paralisia cerebral, atraso do desenvolvimento e surdez alteram a linha de base. A comparação é com o basal da criança relatado pelo cuidador, não com a normalidade para a idade.',
    'Um valor isolado tem valor limitado, sobretudo no lactente com fontanela aberta: é a série de medidas que detecta a deterioração antes da descompensação.',
    'Glasgow ≤ 8 não é, por si, indicação de tomografia imediata em todo trauma pediátrico — mas rebaixamento persistente é critério de alto risco na regra PECARN e praticamente sempre a indica.',
  ],
  referencias: [
    { texto: 'Holmes JF, Palchak MJ, MacFarlane T, Kuppermann N. Performance of the pediatric Glasgow Coma Scale in children with blunt head trauma. Acad Emerg Med. 2005;12(9):814-819.' },
    { texto: 'Kuppermann N, Holmes JF, Dayan PS, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study (PECARN). Lancet. 2009;374(9696):1160-1170.' },
    { texto: 'Kochanek PM, Tasker RC, Carney N, et al. Guidelines for the Management of Pediatric Severe Traumatic Brain Injury, 3rd Edition. Pediatr Crit Care Med. 2019;20(3S):S1-S82.' },
  ],
}

const bronquiolite: Ferramenta = {
  id: 'gravidade-bronquiolite',
  nome: 'Escore de gravidade da bronquiolite',
  sinonimos: ['bronquiolite', 'vsr', 'sibilancia lactente', 'wang'],
  resumo: 'Gradua a bronquiolite aguda e orienta a decisão de internar.',
  categorias: ['pediatria'],
  campos: [
    campoOpc('fr', 'Frequência respiratória', [
      { valor: '0', rotulo: '0 — abaixo de 30 irpm', pontos: 0 },
      { valor: '1', rotulo: '1 — 31 a 45 irpm', pontos: 1 },
      { valor: '2', rotulo: '2 — 46 a 60 irpm', pontos: 2 },
      { valor: '3', rotulo: '3 — acima de 60 irpm', pontos: 3 },
    ], { ajuda: 'Conte 60 segundos com a criança calma. Taquipneia é o sinal mais sensível de gravidade, e a contagem apressada é a principal fonte de erro.' }),
    campoOpc('sibilos', 'Sibilância', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — apenas no fim da expiração ou com estetoscópio', pontos: 1 },
      { valor: '2', rotulo: '2 — em toda a expiração ou audível na expiração sem estetoscópio', pontos: 2 },
      { valor: '3', rotulo: '3 — inspiratória e expiratória, audível sem estetoscópio', pontos: 3 },
    ], { ajuda: 'Sibilos audíveis só à ausculta, audíveis à distância, ou tórax silencioso — este último é o mais grave, porque indica fluxo insuficiente para gerar som.' }),
    campoOpc('retracao', 'Retração', [
      { valor: '0', rotulo: '0 — ausente', pontos: 0 },
      { valor: '1', rotulo: '1 — intercostal apenas', pontos: 1 },
      { valor: '2', rotulo: '2 — intercostal e supraclavicular', pontos: 2 },
      { valor: '3', rotulo: '3 — intercostal, supraclavicular e batimento de aletas nasais', pontos: 3 },
    ], { ajuda: 'Subcostal, intercostal, supraesternal ou de fúrcula. A retração generalizada com batimento de asa do nariz indica esforço próximo à exaustão.' }),
    campoOpc('estado', 'Estado geral', [
      { valor: '0', rotulo: '0 — normal', pontos: 0 },
      { valor: '3', rotulo: '3 — irritado, letárgico ou com dificuldade alimentar', pontos: 3 },
    ]),
    campoNum('spo2', 'SpO₂ em ar ambiente', { ajuda: 'Medida em ar ambiente, com a criança calma. O limiar de oxigênio suplementar é 90 a 92% — não persiga saturação de 100%.', unidade: '%', min: 60, max: 100, passo: 1 }),
    campoNum('idadeMeses', 'Idade', { ajuda: 'Abaixo de 12 semanas, o limiar de internação é mais baixo, e apneia pode ser a primeira manifestação.', unidade: 'meses', min: 0, max: 24, passo: 0.5 }),
    campoSimNao('apneia', 'Episódios de apneia', 1, 'Apneia pode preceder qualquer outro sinal no lactente muito jovem e justifica internação isoladamente.'),
    campoSimNao('comorbidade', 'Prematuridade, cardiopatia, pneumopatia crônica ou imunodeficiência', 1, 'Prematuridade, cardiopatia hemodinamicamente significativa, doença pulmonar crônica, imunodeficiência ou doença neuromuscular baixam o limiar de internação.'),
  ],
  calcular: (v) => {
    const ids = ['fr', 'sibilos', 'retracao', 'estado']
    let total = 0
    for (const id of ids) {
      const x = num(v, id)
      if (x === null) return null
      total += x
    }
    const spo2 = num(v, 'spo2')
    const idade = num(v, 'idadeMeses')
    if (spo2 === null || idade === null) return null
    const faixa = total <= 3 ? 0 : total <= 7 ? 1 : 2
    const internar = spo2 < 90 || total >= 8 || sim(v, 'apneia') || (idade < 3 && total >= 5) || (sim(v, 'comorbidade') && total >= 5)
    return {
      titulo: 'Gravidade da bronquiolite',
      valor: String(total),
      unidade: 'de 12 pontos',
      nivel: internar ? 'critico' : (['ok', 'alerta', 'critico'] as Nivel[])[faixa],
      rotuloNivel: ['Leve', 'Moderada', 'Grave'][faixa],
      detalhes: [
        { rotulo: 'SpO₂', valor: fmtPct(spo2, 0), nota: 'Abaixo de 90 a 92% em ar ambiente é indicação de oxigenoterapia e de internação na maioria dos protocolos.', nivel: spo2 < 90 ? 'critico' : spo2 < 92 ? 'alerta' : 'ok' },
        { rotulo: 'Apneia', valor: sim(v, 'apneia') ? 'Presente' : 'Ausente', nota: 'Apneia é indicação de internação independentemente do escore, sobretudo abaixo de 2 meses.', nivel: sim(v, 'apneia') ? 'critico' : 'ok' },
        { rotulo: 'Decisão sugerida', valor: internar ? 'Internação' : 'Observação e possível alta', nivel: internar ? 'critico' : 'ok' },
      ],
      conduta: [
        'Na forma **leve**, a conduta é de suporte e desospitalização: hidratação, higiene nasal com soro fisiológico, aleitamento fracionado e orientação de sinais de alarme. **Não prescreva** broncodilatador, corticoide, antibiótico, antileucotrieno nem fisioterapia respiratória — nenhum deles alterou desfecho em bronquiolite, e todos têm efeito adverso.',
        'Na forma **moderada**, interne e mantenha o suporte: oxigênio para manter saturação **≥ 90–92%**, hidratação por via oral, sonda ou intravenosa conforme a aceitação, e monitorização. A aspiração de vias aéreas superiores antes das mamadas melhora a aceitação alimentar mais do que qualquer fármaco.',
        'Na forma **grave**, com desconforto importante, apneia, hipoxemia refratária ou exaustão, inicie **cânula nasal de alto fluxo (1–2 L/kg/min)** e considere ventilação não invasiva ou intubação. Transfira para unidade de terapia intensiva pediátrica com limiar baixo em lactentes de alto risco.',
        'Identifique os **grupos de risco** que mudam o limiar de internação: idade abaixo de 12 semanas, prematuridade, cardiopatia congênita hemodinamicamente significativa, doença pulmonar crônica, imunodeficiência e doença neuromuscular. **Apneia** pode ser a primeira manifestação no lactente muito jovem e justifica internação isolada.',
        'Lembre da **prevenção**, que é o que efetivamente reduz hospitalização: **nirsevimabe** (anticorpo monoclonal de dose única) para lactentes na primeira temporada, ou palivizumabe mensal nos grupos de alto risco onde disponível, e vacinação materna contra o vírus sincicial respiratório na gestação. Some higiene das mãos, aleitamento materno e evitar exposição a tabaco e a aglomerações.',
      ],
      interpretacao: [
        '**O tratamento da bronquiolite é de suporte, e a lista do que NÃO fazer é mais longa que a do que fazer.** Não há benefício demonstrado para broncodilatador (nem beta-agonista, nem adrenalina inalatória em uso rotineiro), corticoide sistêmico ou inalatório, antibiótico sem infecção bacteriana documentada, fisioterapia respiratória, ou antileucotrieno.',
        '**O que funciona:** oxigênio se saturação abaixo de 90 a 92%, hidratação (oral, por sonda ou endovenosa), aspiração nasal superficial de secreções, e suporte respiratório escalonado (cateter nasal de alto fluxo ou CPAP) nos casos graves.',
        'A **solução salina hipertônica a 3%** inalatória tem evidência conflitante; pode reduzir marginalmente o tempo de internação em pacientes já hospitalizados, mas não é recomendada de rotina na emergência.',
        '**Critérios de internação:** saturação persistentemente abaixo de 90 a 92%, apneia, desconforto respiratório significativo, incapacidade de manter hidratação por via oral, idade abaixo de 2 a 3 meses, comorbidade relevante e condições sociais que impeçam o retorno.',
        'Prevenção: **palivizumabe** para grupos de alto risco conforme protocolo, e o anticorpo monoclonal de meia-vida estendida **nirsevimabe**, que ampliou a proteção para lactentes saudáveis em vários países.',
      ],
      alertas: ['Bronquiolite em lactente abaixo de 2 meses tem risco aumentado de apneia, que pode ser a primeira manifestação. Considere monitorização mesmo em quadros aparentemente leves.'],
    }
  },
  formula: ['Soma de 4 domínios clínicos (0 a 12 pontos), integrada à saturação, idade e comorbidades'],
  fundamento:
    'A bronquiolite é uma inflamação e obstrução das pequenas vias aéreas, sobretudo pelo vírus sincicial respiratório. A obstrução é por edema, muco e debris celulares — não por broncoespasmo —, e é essa diferença fisiopatológica em relação à asma que explica a falha consistente dos broncodilatadores nos ensaios clínicos. O mecanismo explica por que broncodilatador não funciona: a obstrução da bronquiolite é por **necrose do epitélio respiratório, edema submucoso e rolhas de debris celulares e muco**, não por broncoespasmo de musculatura lisa — que no lactente é escassa e pouco reativa. A via aérea do lactente tem raio pequeno, e pela lei de Poiseuille a resistência varia com a quarta potência do raio: 1 mm de edema circunferencial multiplica a resistência por dezesseis.',
  armadilhas: [
    'A saturação oscila muito, sobretudo durante o sono e a alimentação. Uma leitura isolada baixa não obriga internação se a criança está bem e a leitura se recupera.',
    'Radiografia de tórax de rotina não é recomendada: aumenta prescrição de antibiótico sem melhorar desfecho.',
  ],
  referencias: [
    { texto: 'Ralston SL, Lieberthal AS, Meissner HC, et al. Clinical practice guideline: the diagnosis, management, and prevention of bronchiolitis. Pediatrics. 2014;134(5):e1474-e1502.' },
    { texto: 'Wang EE, Milner RA, Navas L, Maj H. Observer agreement for respiratory signs and oximetry in infants hospitalized with lower respiratory infections. Am Rev Respir Dis. 1992;145(1):106-109.' },
  ],
}

const anestesicoLocal: Ferramenta = {
  id: 'dose-maxima-anestesico-local',
  nome: 'Dose máxima de anestésico local',
  sinonimos: ['lidocaina', 'bupivacaina', 'anestesico local', 'intoxicacao por anestesico', 'lipid rescue'],
  resumo: 'Calcula a dose máxima segura em mg e em mL, e resume o tratamento da intoxicação.',
  categorias: ['pediatria', 'emergencia', 'cirurgia', 'farmacologia'],
  campos: [
    campoPeso({ min: 1, max: 200 }),
    campoOpc('farmaco', 'Anestésico', [
      { valor: 'lidocaina', rotulo: 'Lidocaína' },
      { valor: 'bupivacaina', rotulo: 'Bupivacaína' },
      { valor: 'ropivacaina', rotulo: 'Ropivacaína' },
      { valor: 'mepivacaina', rotulo: 'Mepivacaína' },
      { valor: 'prilocaina', rotulo: 'Prilocaína' },
    ], { ajuda: 'Converta a concentração corretamente: solução a 1% contém 10 mg/mL. Em lactentes abaixo de 6 meses, reduza o teto pela menor ligação a proteínas e pelo metabolismo hepático imaturo.' }),
    campoSeg('vaso', 'Com vasoconstritor (adrenalina)', [
      { valor: 'nao', rotulo: 'Não' },
      { valor: 'sim', rotulo: 'Sim' },
    ], { ajuda: 'A adrenalina eleva a dose máxima por reduzir a absorção sistêmica, mas é contraindicada em extremidades de circulação terminal.' }),
    campoNum('concentracao', 'Concentração da solução', { unidade: '%', min: 0.125, max: 5, passo: 0.125, padrao: '1', ajuda: 'Uma solução a 1% contém 10 mg/mL; a 2%, 20 mg/mL; a 0,5%, 5 mg/mL.' }),
  ],
  calcular: (v) => {
    const peso = num(v, 'peso')
    const conc = num(v, 'concentracao')
    const farmaco = opc(v, 'farmaco')
    const comVaso = sim(v, 'vaso')
    if (peso === null || conc === null || conc <= 0) return null
    const doses: Record<string, { sem: number; com: number; nome: string; obs: string }> = {
      lidocaina: { sem: 4.5, com: 7, nome: 'Lidocaína', obs: 'Início rápido (2 a 5 min), duração de 1 a 2 h (até 3 a 4 h com vasoconstritor). É o anestésico local mais usado e o de menor toxicidade cardíaca entre os de duração intermediária.' },
      bupivacaina: { sem: 2, com: 3, nome: 'Bupivacaína', obs: '**A mais cardiotóxica.** Alta afinidade pelos canais de sódio do miocárdio, com dissociação lenta — a parada cardíaca por bupivacaína é notoriamente refratária. Duração longa (4 a 8 h).' },
      ropivacaina: { sem: 3, com: 3.5, nome: 'Ropivacaína', obs: 'Isômero levógiro puro, com menor cardiotoxicidade que a bupivacaína e maior bloqueio sensitivo relativo ao motor. Duração longa.' },
      mepivacaina: { sem: 5, com: 7, nome: 'Mepivacaína', obs: 'Perfil semelhante ao da lidocaína, com duração discretamente maior.' },
      prilocaina: { sem: 6, com: 8, nome: 'Prilocaína', obs: 'Risco de metemoglobinemia acima de 600 mg no adulto — evitar em lactentes abaixo de 6 meses e em portadores de deficiência de glicose-6-fosfato desidrogenase. O tratamento é azul de metileno.' },
    }
    const d = doses[farmaco]
    const mgkg = comVaso ? d.com : d.sem
    const doseMax = peso * mgkg
    const mgPorMl = conc * 10
    const volumeMax = doseMax / mgPorMl
    return {
      titulo: `Dose máxima de ${d.nome.toLowerCase()}`,
      valor: fmtLivre(doseMax, 1),
      unidade: 'mg',
      nivel: 'alerta',
      rotuloNivel: `${fmt(mgkg, 1)} mg/kg ${comVaso ? 'com' : 'sem'} vasoconstritor`,
      detalhes: [
        { rotulo: 'Concentração da solução', valor: `${fmt(conc, 3)}% = ${fmt(mgPorMl, 1)} mg/mL` },
        { rotulo: 'Volume máximo', valor: `${fmtLivre(volumeMax, 1)} mL`, nivel: 'alerta' },
        { rotulo: 'Dose máxima sem vasoconstritor', valor: `${fmtLivre(peso * d.sem, 1)} mg (${fmtLivre((peso * d.sem) / mgPorMl, 1)} mL)` },
        { rotulo: 'Dose máxima com vasoconstritor', valor: `${fmtLivre(peso * d.com, 1)} mg (${fmtLivre((peso * d.com) / mgPorMl, 1)} mL)` },
        { rotulo: 'Características', valor: d.obs },
      ],
      conduta: [
        'Calcule a dose máxima **antes** de aspirar a seringa, e converta corretamente: uma solução a **1% contém 10 mg/mL**. Os tetos usuais são lidocaína 4,5 mg/kg (7 mg/kg com adrenalina), bupivacaína 2,5 mg/kg (3 mg/kg com adrenalina) e ropivacaína 3 mg/kg. Em crianças pequenas, esses limites são atingidos com volumes surpreendentemente baixos.',
        'Injete **sempre com aspiração prévia e de forma fracionada**, observando o paciente entre as frações. A toxicidade grave decorre quase sempre de injeção intravascular inadvertida, não da dose total — e o fracionamento é o que permite interromper antes do colapso.',
        'Reconheça o **pródromo neurológico**: gosto metálico, dormência perioral, zumbido, tontura, agitação, fala arrastada. Ele precede convulsão e colapso cardiovascular. Ao primeiro sintoma, **pare a injeção imediatamente**, administre oxigênio e prepare o resgate — esperar para \'ver se melhora\' é o erro que transforma um susto em parada.',
        'Tenha **emulsão lipídica a 20% disponível** onde quer que se use anestésico local em dose relevante. Na toxicidade sistêmica: bolus de 1,5 mL/kg em 1 minuto, seguido de infusão de 0,25 mL/kg/min, repetindo o bolus até duas vezes se persistir a instabilidade. Na parada associada, reduza a adrenalina para menos de 1 µg/kg e **evite** anestésicos locais, betabloqueadores, bloqueadores de canal de cálcio e vasopressina.',
        'Reduza a dose máxima em **lactentes abaixo de 6 meses** (menor alfa-1-glicoproteína ácida, portanto maior fração livre, e metabolismo hepático imaturo), em insuficiência hepática, insuficiência cardíaca e acidose. Evite adrenalina em extremidades com circulação terminal, e lembre que a prilocaína e a benzocaína podem causar **metemoglobinemia** — risco particularmente relevante no lactente.',
      ],
      interpretacao: [
        'O vasoconstritor eleva a dose máxima porque reduz a absorção sistêmica, prolonga o efeito e melhora a hemostasia local. **A antiga proibição de adrenalina em extremidades ("dedos, nariz, orelhas, pênis") foi refutada** — não há caso documentado de necrose digital com soluções comerciais diluídas, e revisões sistemáticas apoiam o uso.',
        '**A velocidade de absorção depende do sítio**, e isso muda o risco com a mesma dose. Em ordem decrescente: intravenoso > traqueal > intercostal > caudal > paracervical > epidural > plexo braquial > ciático > subcutâneo.',
        '**Sinais de intoxicação sistêmica**, em ordem de aparecimento: gosto metálico, dormência perioral, zumbido, tontura, alterações visuais, disartria, fasciculações, convulsão; depois depressão do sistema nervoso central, e por fim toxicidade cardíaca — bradicardia, bloqueios, alargamento do QRS, arritmias ventriculares e assistolia.',
        '**Tratamento da intoxicação sistêmica:** parar a injeção imediatamente; via aérea e oxigênio a 100%; benzodiazepínico para convulsão (evitar propofol em dose alta se houver instabilidade); e **emulsão lipídica a 20%** — bolus de 1,5 mL/kg em 1 minuto, seguido de infusão de 0,25 mL/kg/min, repetindo o bolus até duas vezes se persistir instabilidade, com dose total máxima em torno de 12 mL/kg. Na parada cardíaca, use adrenalina em doses reduzidas (≤ 1 µg/kg) e **evite** vasopressina, bloqueadores de canal de cálcio, betabloqueadores e anestésicos locais.',
      ],
      alertas: [
        'Aspire antes de cada injeção e injete de forma fracionada e lenta, com contato verbal contínuo com o paciente.',
        'Tenha emulsão lipídica a 20% disponível em qualquer local onde se façam bloqueios com anestésico local em volume significativo.',
      ],
    }
  },
  formula: [
    'Dose máxima (mg) = peso (kg) × dose máxima (mg/kg)',
    'Concentração: solução a X% = X × 10 mg/mL',
    'Volume máximo (mL) = dose máxima (mg) ÷ concentração (mg/mL)',
  ],
  fundamento:
    'Os anestésicos locais bloqueiam canais de sódio voltagem-dependentes, impedindo a propagação do potencial de ação. A toxicidade sistêmica ocorre quando a concentração plasmática atinge os mesmos canais no sistema nervoso central e no miocárdio. A bupivacaína é a mais perigosa porque se liga aos canais cardíacos com alta afinidade e se dissocia lentamente — permanece bloqueando durante a diástole, quando os demais já se desligaram.',
  armadilhas: [
    'As doses máximas são orientativas e derivadas de infiltração subcutânea. Em sítios de absorção rápida, o risco é maior com a mesma dose.',
    'A conversão percentual é a fonte mais comum de erro grave: 2% são 20 mg/mL, não 2 mg/mL. Um erro de dez vezes nessa conta é potencialmente fatal.',
  ],
  referencias: [
    { texto: 'Neal JM, Neal EJ, Weinberg GL. American Society of Regional Anesthesia and Pain Medicine local anesthetic systemic toxicity checklist: 2020 version. Reg Anesth Pain Med. 2021;46(1):81-82.' },
    { texto: 'Ilfeld BM, Häuser N, Gadsden J. Local anesthetic systemic toxicity. Anesthesiology Clin. 2020;38(1):17-31.' },
  ],
}

/* ═════════════════════ UTICalc — probabilidade de ITU no lactente ═════════════════════ */

const uticalcCampos: Campo[] = [
  campoSeg('etapa', 'Etapa', [
    { valor: 'pre', rotulo: 'Antes da urinálise' },
    { valor: 'pos', rotulo: 'Depois da urinálise' },
  ], { ajuda: 'O cálculo tem duas etapas: a primeira decide **se vale a pena coletar urina**, e a segunda, já com a urinálise em mãos, decide **se vale a pena tratar** enquanto a cultura não sai. Usar só a segunda desperdiça a função principal da ferramenta, que é evitar sondagem desnecessária.' }),
  campoNum('idadeMeses', 'Idade', { unidade: 'meses', min: 2, max: 23, passo: 1, ajuda: 'A calculadora é validada de 2 a 23 meses. Abaixo de 2 meses o lactente entra nos protocolos de febre sem foco do neonato (Rochester, Filadélfia, AAP 2021), que são mais conservadores e pedem punção lombar em boa parte dos casos.' }),
  campoSeg('sexoCirc', 'Sexo e circuncisão', [
    { valor: 'f', rotulo: 'Menina' },
    { valor: 'mnc', rotulo: 'Menino não circuncidado' },
    { valor: 'mc', rotulo: 'Menino circuncidado' },
  ], { ajuda: 'A circuncisão reduz o risco de infecção urinária em cerca de 10 vezes no primeiro ano — o prepúcio é reservatório de uropatógenos. É o item que mais muda a probabilidade em meninos.' }),
  campoNum('tempFebre', 'Temperatura máxima', { unidade: '°C', min: 37.5, max: 42, passo: 0.1, ajuda: 'Temperatura máxima aferida, em casa ou no serviço. Quanto mais alta, maior a probabilidade — a febre alta sem foco em lactente é justamente o cenário em que a infecção urinária domina o diagnóstico diferencial.' }),
  campoNum('duracaoFebre', 'Duração da febre', { unidade: 'horas', min: 0, max: 240, passo: 1, ajuda: 'Horas desde o início da febre. Febre com mais de 48 h sem foco aumenta a probabilidade de infecção urinária.' }),
  campoSimNao('outraFonte', 'Há outra fonte evidente de febre ao exame', 0, 'Otite média aguda inequívoca, amigdalite exsudativa, quadro viral característico com exantema, bronquiolite típica. A presença de outra fonte reduz a probabilidade, mas **não a zera** — coinfecção existe, sobretudo abaixo de 6 meses.'),
  campoSeg('leuco', 'Esterase leucocitária na fita', [
    { valor: 'neg', rotulo: 'Negativa ou traços' },
    { valor: 'pos', rotulo: 'Positiva (1+ ou mais)' },
  ], { padrao: 'neg', mostrarSe: (v) => opc(v, 'etapa') === 'pos', ajuda: 'É o item isolado de maior peso da segunda etapa. Esterase positiva multiplica a probabilidade várias vezes; negativa a reduz de forma expressiva, mas não a zera em lactente muito jovem.' }),
  campoSimNao('nitrito', 'Nitrito positivo', 0, 'Muito específico e pouco sensível: exige que a bactéria reduza nitrato a nitrito e que a urina tenha ficado na bexiga por 4 horas — o que raramente acontece em lactente, que esvazia a bexiga com frequência. Nitrito positivo praticamente confirma; negativo não afasta nada.'),
  campoSimNao('gram', 'Bacilos gram-negativos na bacterioscopia', 0, 'Quando disponível, a bacterioscopia da urina não centrifugada acrescenta acurácia à urinálise e antecipa a escolha do antimicrobiano.'),
]

/**
 * UTICalc — probabilidade de infecção urinária em lactentes febris.
 *
 * Os coeficientes abaixo reproduzem a estrutura do modelo de regressão de
 * Shaikh e colaboradores, e a ferramenta é apresentada como **estimativa
 * de apoio**, não como reprodução certificada da calculadora original: o
 * valor está em percorrer as variáveis certas na ordem certa e em mostrar
 * que a decisão de sondar tem um limiar explícito.
 */
const uticalc: Ferramenta = {
  id: 'uticalc',
  nome: 'UTICalc — probabilidade de infecção urinária em lactentes febris',
  sigla: 'UTICalc',
  sinonimos: ['uticalc', 'itu lactente', 'infeccao urinaria bebe', 'febre sem foco', 'itu febril'],
  resumo: 'Estima a probabilidade de infecção urinária entre 2 e 23 meses, antes e depois da urinálise, e define quem precisa de coleta por sondagem.',
  categorias: ['pediatria', 'infectologia'],
  campos: uticalcCampos,
  calcular: (v) => {
    const idade = num(v, 'idadeMeses')
    const temp = num(v, 'tempFebre')
    const duracao = num(v, 'duracaoFebre')
    if (idade === null || temp === null || duracao === null) return null
    const sexoCirc = opc(v, 'sexoCirc') ?? 'f'
    const pos = opc(v, 'etapa') === 'pos'

    // Etapa 1: variáveis clínicas. Logito construído sobre os fatores do modelo.
    let logito = -2.4
    if (idade < 12) logito += 0.6
    if (sexoCirc === 'f') logito += 1.1
    else if (sexoCirc === 'mnc') logito += 1.4
    // menino circuncidado é a referência: acrescenta 0
    logito += 0.5 * Math.max(0, temp - 38.5)
    if (duracao >= 48) logito += 0.5
    if (sim(v, 'outraFonte')) logito -= 1.0

    if (pos) {
      logito += opc(v, 'leuco') === 'pos' ? 2.5 : -1.3
      if (sim(v, 'nitrito')) logito += 2.3
      if (sim(v, 'gram')) logito += 2.0
    }

    const prob = 1 / (1 + Math.exp(-logito))
    const pct = prob * 100

    const nivel: Nivel = pct >= 5 ? 'alerta' : pct >= 2 ? 'atencao' : 'ok'
    const rotulo = pos
      ? pct >= 5 ? 'Tratar enquanto aguarda a cultura' : 'Aguardar a cultura'
      : pct >= 2 ? 'Coletar urina por sondagem' : 'Coleta dispensável'

    const interpretacao: string[] = [
      `**Probabilidade estimada de ${fmtPct(pct, 1)}**, na etapa ${pos ? 'pós-urinálise' : 'pré-urinálise'}.`,
    ]
    if (!pos) {
      interpretacao.push(
        'Na etapa pré-urinálise, o limiar de decisão usual é **2%**: abaixo disso, a coleta de urina por sondagem ou punção suprapúbica pode ser dispensada, porque o desconforto, o custo e a taxa de contaminação superam o benefício de investigar. Acima de 2%, colha.',
        'A regra tem valor justamente por **evitar procedimento**: aplicada de forma sistemática, ela reduz em torno de 8% as sondagens vesicais sem deixar de detectar infecções, num cenário em que a prática habitual é sondar quase todo lactente febril sem foco.',
      )
    } else {
      interpretacao.push(
        'Na etapa pós-urinálise, o limiar usual é **5%** para iniciar antimicrobiano empírico enquanto a urocultura não fica pronta. Abaixo disso, é razoável aguardar a cultura e reavaliar.',
        'Lembre que **a urinálise não faz o diagnóstico** — quem faz é a urocultura. Piúria pode existir sem infecção (febre alta, desidratação, vulvovaginite, corpo estranho, doença de Kawasaki) e faltar em infecção comprovada, especialmente no lactente muito jovem e em infecção por germe não produtor de nitrito.',
      )
    }
    interpretacao.push(
      sexoCirc === 'mc'
        ? 'Menino circuncidado tem risco muito baixo de infecção urinária após o primeiro ano — a circuncisão reduz o risco em cerca de 10 vezes, por eliminar o reservatório prepucial de uropatógenos.'
        : sexoCirc === 'mnc'
          ? 'Menino **não circuncidado** tem o maior risco entre os três grupos no primeiro ano de vida, pelo reservatório prepucial de uropatógenos.'
          : 'Em meninas, o risco se mantém relevante ao longo de toda a faixa de 2 a 23 meses, e cresce com a duração e a intensidade da febre.',
      sim(v, 'outraFonte')
        ? 'Foi assinalada outra fonte de febre, o que reduz a probabilidade — mas **não a elimina**: coinfecção entre infecção urinária e quadro viral é bem documentada, sobretudo abaixo de 6 meses, e bronquiolite comprovada não dispensa a investigação nessa faixa.'
        : 'Sem outra fonte identificada ao exame, a infecção urinária permanece como principal hipótese em lactente febril — ela responde por 5 a 7% das febres sem foco nessa faixa etária.',
    )

    const conduta: string[] = []
    if (!pos) {
      conduta.push(
        pct >= 2
          ? '**Colha urina por sondagem vesical ou punção suprapúbica.** Saco coletor serve apenas para triagem negativa: a taxa de contaminação chega a 60%, e uma cultura positiva colhida em saco não autoriza diagnóstico nem tratamento — obriga recoleta.'
          : '**A coleta pode ser dispensada nesta probabilidade.** Mantenha reavaliação clínica: se a febre persistir sem foco por mais 24 a 48 h, recalcule e colha.',
      )
    } else {
      conduta.push(
        pct >= 5
          ? '**Inicie antimicrobiano empírico** após colher a urocultura. Em lactente sem toxemia e com boa aceitação oral, a via oral é tão eficaz quanto a intravenosa: cefalexina, cefuroxima, amoxicilina-clavulanato ou sulfametoxazol-trimetoprima conforme o perfil de resistência local. Duração de 7 a 10 dias na infecção febril.'
          : '**Aguarde a urocultura** antes de tratar, mantendo o lactente em reavaliação. Tratar às cegas nessa probabilidade expõe a efeito adverso e a resistência sem benefício proporcional.',
      )
      conduta.push('Internação e via intravenosa ficam reservadas a: idade abaixo de 2 meses, toxemia, desidratação com recusa alimentar, vômitos incoercíveis, imunossupressão, uropatia conhecida ou falha do tratamento oral em 48 a 72 h.')
    }
    conduta.push(
      'Peça **ultrassonografia de rins e vias urinárias** após a primeira infecção urinária febril em menores de 2 anos. Ela é não invasiva e busca hidronefrose, dilatação ureteral, duplicidade e alteração do parênquima.',
      'Indique **uretrocistografia miccional** de forma seletiva, e não rotineira: ultrassonografia alterada, infecção por germe não habitual, segunda infecção febril, ou quadro atípico. A abordagem de rastrear todos foi abandonada porque a maioria dos refluxos de baixo grau resolve sozinha e a profilaxia contínua tem benefício modesto ao custo de resistência.',
      'Oriente a família sobre **reconhecimento precoce de nova febre** e sobre a importância de colher urina antes de iniciar antibiótico — o antimicrobiano administrado antes da coleta negativa a cultura e inviabiliza o diagnóstico por semanas.',
    )

    return {
      titulo: pos ? 'UTICalc — pós-urinálise' : 'UTICalc — pré-urinálise',
      valor: fmtPct(pct, 1),
      unidade: 'de probabilidade',
      nivel,
      rotuloNivel: rotulo,
      detalhes: [
        { rotulo: 'Idade', valor: `${fmtInt(idade)} meses`, nivel: (idade < 12 ? 'atencao' : 'ok') as Nivel },
        { rotulo: 'Sexo e circuncisão', valor: sexoCirc === 'f' ? 'Menina' : sexoCirc === 'mnc' ? 'Menino não circuncidado' : 'Menino circuncidado' },
        { rotulo: 'Temperatura máxima', valor: `${fmt(temp, 1)} °C` },
        { rotulo: 'Duração da febre', valor: `${fmtInt(duracao)} h`, nivel: (duracao >= 48 ? 'atencao' : 'ok') as Nivel },
        { rotulo: 'Outra fonte de febre', valor: sim(v, 'outraFonte') ? 'Sim' : 'Não' },
        ...(pos
          ? [
              { rotulo: 'Esterase leucocitária', valor: opc(v, 'leuco') === 'pos' ? 'Positiva' : 'Negativa', nivel: (opc(v, 'leuco') === 'pos' ? 'alerta' : 'ok') as Nivel },
              { rotulo: 'Nitrito', valor: sim(v, 'nitrito') ? 'Positivo' : 'Negativo', nivel: (sim(v, 'nitrito') ? 'alerta' : 'ok') as Nivel },
              { rotulo: 'Bacterioscopia', valor: sim(v, 'gram') ? 'Gram-negativos presentes' : 'Sem bacilos' },
            ]
          : []),
        { rotulo: 'Limiar de decisão', valor: pos ? '5% para tratar' : '2% para colher' },
      ],
      interpretacao,
      conduta,
      alertas: [
        '**Urina de saco coletor não serve para diagnóstico.** A contaminação chega a 60%, e uma cultura positiva assim obriga recoleta por sondagem ou punção suprapúbica antes de rotular a criança como tendo infecção urinária — um diagnóstico que a acompanha por anos e desencadeia investigação de imagem.',
        'Abaixo de **2 meses**, esta calculadora não se aplica: o lactente entra nos protocolos de febre sem foco do neonato, que consideram infecção bacteriana invasiva e frequentemente exigem punção lombar, hemocultura e internação.',
        'Bronquiolite ou outro quadro viral comprovado **não dispensa** a investigação de infecção urinária em lactente jovem com febre — a coinfecção é bem documentada.',
      ],
    }
  },
  formula: ['Modelo logístico com idade, sexo e circuncisão, temperatura, duração da febre e presença de outra fonte', 'Segunda etapa acrescenta esterase leucocitária, nitrito e bacterioscopia', 'Limiares usuais: 2% para coletar urina, 5% para tratar empiricamente'],
  fundamento:
    'A infecção urinária do lactente é quase sempre **ascendente**: uropatógenos da flora perineal e intestinal — *Escherichia coli* em 80 a 90% dos casos — colonizam a região periuretral e sobem pela uretra, que é curta em meninas e protegida de forma incompleta em meninos não circuncidados, cujo prepúcio funciona como reservatório. A cepa uropatogênica expressa fímbrias P e tipo 1, que aderem a receptores glicolipídicos do urotélio e permitem que a bactéria resista ao fluxo urinário; daí ela pode ascender ao rim e produzir pielonefrite, com risco real de cicatriz renal, hipertensão e doença renal crônica no futuro — e é essa consequência tardia que justifica investigar a febre sem foco em vez de esperar. O UTICalc existe porque a prática anterior era binária e cara: sondar praticamente todo lactente febril sem foco, um procedimento doloroso, com taxa de insucesso e de contaminação relevantes. O modelo transforma variáveis que o pediatra já tem à mão — idade, sexo, circuncisão, altura e duração da febre, presença de outra fonte — numa probabilidade explícita, e coloca o limiar de decisão na mesa em vez de deixá-lo implícito no hábito do serviço.',
  armadilhas: [
    'Piúria isolada não é diagnóstico: febre alta, desidratação, vulvovaginite, corpo estranho, apendicite e doença de Kawasaki produzem piúria estéril.',
    'Nitrito negativo não afasta nada em lactente: a conversão de nitrato a nitrito exige 4 horas de permanência da urina na bexiga, e o lactente esvazia com muito mais frequência.',
    'Antimicrobiano administrado antes da coleta negativa a urocultura e inviabiliza o diagnóstico — colha sempre antes da primeira dose.',
    'A calculadora foi derivada e validada em população norte-americana. O perfil de resistência local e a prevalência de circuncisão diferem, e a escolha do antimicrobiano empírico deve seguir o antibiograma acumulado do serviço.',
  ],
  referencias: [
    { texto: 'Shaikh N, Hoberman A, Hum SW, et al. Development and validation of a calculator for estimating the probability of urinary tract infection in young febrile children. JAMA Pediatr. 2018;172(6):550-556.' },
    { texto: 'Roberts KB; Subcommittee on Urinary Tract Infection. Urinary tract infection: clinical practice guideline for the diagnosis and management of the initial UTI in febrile infants and children 2 to 24 months. Pediatrics. 2011;128(3):595-610 (reafirmada em 2016).' },
    { texto: 'Shaikh N, Lee MC, Stokes LR, et al. Reassessment of the role of race in calculating the risk for urinary tract infection: a systematic review and meta-analysis. JAMA Pediatr. 2022;176(6):569-575.' },
  ],
}

/* ═════════════════════ Escore de Westley — crupe ═════════════════════ */

const westleyCampos: Campo[] = [
  campoOpc('estridor', 'Estridor inspiratório', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '1', rotulo: 'Ao agitar-se', pontos: 1 },
    { valor: '2', rotulo: 'Em repouso', pontos: 2 },
  ], { padrao: '0', ajuda: 'Estridor **em repouso** é o divisor prático da gravidade: ele indica que o estreitamento subglótico já compromete o fluxo mesmo sem esforço adicional, e é o gatilho para adrenalina nebulizada.' }),
  campoOpc('retracao', 'Retração (tiragem)', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '1', rotulo: 'Leve', pontos: 1 },
    { valor: '2', rotulo: 'Moderada', pontos: 2 },
    { valor: '3', rotulo: 'Grave', pontos: 3 },
  ], { padrao: '0', ajuda: 'Avalie tiragem supraesternal, intercostal e subcostal. A retração traduz o aumento da pressão negativa intratorácica necessária para vencer a obstrução alta.' }),
  campoOpc('ar', 'Entrada de ar', [
    { valor: '0', rotulo: 'Normal', pontos: 0 },
    { valor: '1', rotulo: 'Diminuída', pontos: 1 },
    { valor: '2', rotulo: 'Muito diminuída', pontos: 2 },
  ], { padrao: '0' }),
  campoOpc('cianose', 'Cianose', [
    { valor: '0', rotulo: 'Ausente', pontos: 0 },
    { valor: '4', rotulo: 'Ao agitar-se', pontos: 4 },
    { valor: '5', rotulo: 'Em repouso', pontos: 5 },
  ], { padrao: '0', ajuda: 'Cianose pontua muito alto porque é achado tardio e pré-terminal na obstrução de via aérea superior — quando aparece, a reserva já se esgotou.' }),
  campoOpc('consciencia', 'Nível de consciência', [
    { valor: '0', rotulo: 'Normal, inclusive dormindo', pontos: 0 },
    { valor: '5', rotulo: 'Desorientado ou letárgico', pontos: 5 },
  ], { padrao: '0', ajuda: 'Letargia em criança com crupe é sinal de exaustão e de hipercapnia, e não de melhora. A criança que "acalmou" depois de horas de agitação pode estar entrando em falência.' }),
]

const westley: Ferramenta = {
  id: 'westley-crupe',
  nome: 'Escore de Westley — gravidade do crupe',
  sinonimos: ['westley', 'crupe', 'laringotraqueite', 'estridor', 'tosse ladrante'],
  resumo: 'Gradua a laringotraqueíte aguda em cinco itens e define quem precisa de adrenalina nebulizada e observação prolongada.',
  categorias: ['pediatria', 'emergencia'],
  campos: westleyCampos,
  calcular: (v) => {
    const ids = ['estridor', 'retracao', 'ar', 'cianose', 'consciencia']
    const pontos = ids.map((id) => ptsOpc(westleyCampos, v, id))
    if (pontos.some((p) => p === null)) return null
    const total = (pontos as number[]).reduce((a, b) => a + b, 0)
    const estridorRepouso = (pontos[0] as number) === 2

    const nivel: Nivel = total >= 12 ? 'critico' : total >= 6 ? 'alerta' : total >= 3 ? 'atencao' : 'ok'
    const faixa = total >= 12 ? 'Iminência de falência respiratória' : total >= 6 ? 'Grave' : total >= 3 ? 'Moderado' : 'Leve'

    const conduta: string[] = []
    conduta.push(
      '**Dexametasona 0,15 a 0,6 mg/kg em dose única, por via oral, para todos os graus — inclusive o leve.** Ela reduz consultas de retorno, internação e tempo de sintomas, e a via oral é tão eficaz quanto a intramuscular. Budesonida nebulizada é alternativa quando há vômitos.',
    )
    if (total >= 3) {
      conduta.push('**Adrenalina nebulizada** (L-adrenalina 1:1000, 0,5 mL/kg até 5 mL, ou adrenalina racêmica a 2,25%, 0,05 mL/kg): indicada a partir do crupe moderado e sempre que houver estridor em repouso. O efeito começa em 10 a 30 minutos e dura 2 horas.')
      conduta.push('**Observe por pelo menos 2 a 4 horas após a adrenalina.** O efeito é transitório, e o fenômeno de rebote — retorno do estridor quando a vasoconstrição cede — é a razão de não dar alta imediatamente após a melhora aparente. Alta só com criança sem estridor em repouso, hidratada, e com corticoide já administrado.')
    } else {
      conduta.push('**Crupe leve:** dexametasona e alta com orientação. Adrenalina não é necessária. Oriente sinais de retorno: estridor em repouso, tiragem, recusa alimentar, sonolência ou palidez.')
    }
    if (total >= 12) {
      conduta.push('**Iminência de falência:** mantenha a criança calma e no colo do cuidador, ofereça oxigênio sem incomodar, e prepare via aérea com o profissional mais experiente disponível. Use tubo de calibre menor que o previsto para a idade, porque o estreitamento é subglótico. Chame anestesia e otorrinolaringologia antes de tentar.')
    }
    conduta.push(
      '**Não agite a criança.** Exame invasivo, punção venosa, aspiração e exames desnecessários aumentam o esforço respiratório e podem precipitar obstrução completa. Mantenha-a no colo, em posição confortável, e conduza o exame em etapas.',
      'Não prescreva o que não funciona: **umidificação, broncodilatador, antibiótico e anti-histamínico não têm eficácia no crupe**. A nebulização com soro apenas agita a criança.',
      'Reveja o diagnóstico se houver sialorreia, disfagia, voz abafada, posição de tripé, febre alta com toxemia ou ausência de tosse ladrante: **epiglotite, traqueíte bacteriana, abscesso retrofaríngeo e corpo estranho** têm apresentação parecida e conduta completamente diferente.',
    )

    return {
      titulo: 'Escore de Westley',
      valor: fmtInt(total),
      unidade: 'de 17 pontos',
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Estridor', valor: ['Ausente', 'Ao agitar-se', 'Em repouso'][pontos[0] as number] ?? '—', nivel: (estridorRepouso ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Retração', valor: fmtInt(pontos[1] as number) },
        { rotulo: 'Entrada de ar', valor: fmtInt(pontos[2] as number) },
        { rotulo: 'Cianose', valor: (pontos[3] as number) > 0 ? 'Presente' : 'Ausente', nivel: ((pontos[3] as number) > 0 ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Consciência', valor: (pontos[4] as number) > 0 ? 'Alterada' : 'Normal', nivel: ((pontos[4] as number) > 0 ? 'critico' : 'ok') as Nivel },
        { rotulo: 'Faixa', valor: faixa, nota: '≤ 2 leve · 3-5 moderado · 6-11 grave · ≥ 12 falência iminente' },
      ],
      interpretacao: [
        `**${total} de 17 pontos — crupe ${faixa.toLowerCase()}.** As faixas são: até 2 leve, 3 a 5 moderado, 6 a 11 grave e 12 ou mais com iminência de falência respiratória.`,
        estridorRepouso
          ? '**Há estridor em repouso**, que é o divisor prático: ele indica estreitamento subglótico suficiente para comprometer o fluxo mesmo sem esforço adicional, e é o gatilho clássico para adrenalina nebulizada.'
          : 'Sem estridor em repouso, a obstrução é de menor grau e a adrenalina nebulizada geralmente não é necessária.',
        'A maior parte dos casos é **leve** e viral — parainfluenza é o agente mais comum —, com pico entre 6 meses e 3 anos, predomínio no outono e no inverno, e tosse ladrante de início noturno que melhora sozinha em 3 a 7 dias.',
        (pontos[3] as number) > 0 || (pontos[4] as number) > 0
          ? '**Cianose ou alteração de consciência são achados tardios** na obstrução de via aérea alta: quando aparecem, a reserva já se esgotou. Trate como emergência de via aérea.'
          : 'Sem cianose nem alteração de consciência, que são os dois achados de pior prognóstico da escala.',
      ],
      conduta,
      alertas: [
        '**Criança que "acalmou" depois de horas de estridor e agitação pode estar entrando em falência**, não melhorando. Letargia em obstrução de via aérea superior é exaustão e hipercapnia.',
        'Agitar a criança pode precipitar obstrução completa: nada de exame invasivo, punção ou aspiração antes de estabilizar. O exame de orofaringe com abaixador é contraindicado quando há suspeita de epiglotite.',
      ],
    }
  },
  formula: ['Westley = estridor (0-2) + retração (0-3) + entrada de ar (0-2) + cianose (0/4/5) + consciência (0/5)'],
  fundamento:
    'O crupe é uma inflamação viral da região subglótica, e toda a sua clínica decorre de um detalhe anatômico: a **cartilagem cricoide é o único anel completo da via aérea**, de modo que o edema da mucosa ali só pode crescer para dentro do lúmen. Pela lei de Poiseuille, a resistência ao fluxo varia com a quarta potência do raio — em um lactente cuja subglote tem cerca de 4 mm de diâmetro, 1 mm de edema circunferencial reduz o raio à metade e multiplica a resistência por dezesseis. É isso que explica por que uma inflamação leve produz estridor dramático em criança pequena e apenas rouquidão em adulto. O estridor inspiratório aparece porque, na inspiração, a pressão negativa intratorácica colapsa ainda mais o segmento extratorácico estreitado; a tosse ladrante vem da vibração da mucosa edemaciada das cordas vocais e da subglote. O corticoide funciona reduzindo o edema da mucosa em algumas horas, e a adrenalina nebulizada age em minutos por vasoconstrição alfa-adrenérgica da mucosa — efeito potente e transitório, o que explica tanto a melhora rápida quanto o rebote em duas horas.',
  armadilhas: [
    'O escore não foi feito para decidir alta isoladamente: a resposta ao tratamento e a possibilidade de retorno ao serviço pesam tanto quanto a pontuação.',
    'Radiografia com o "sinal da torre" é sugestiva mas dispensável: o diagnóstico é clínico, e o transporte ao raio-X agita a criança sem benefício.',
    'Crupe recorrente ou que não responde ao tratamento habitual exige investigar estenose subglótica, anel vascular, hemangioma subglótico e refluxo — sobretudo abaixo de 6 meses ou acima de 6 anos, faixas atípicas para crupe viral.',
    'Adrenalina nebulizada melhora rápido e engana: dar alta antes de 2 a 4 horas de observação expõe a criança ao rebote em casa.',
  ],
  referencias: [
    { texto: 'Westley CR, Cotton EK, Brooks JG. Nebulized racemic epinephrine by IPPB for the treatment of croup. Am J Dis Child. 1978;132(5):484-487.' },
    { texto: 'Bjornson CL, Johnson DW. Croup in children. CMAJ. 2013;185(15):1317-1323.' },
    { texto: 'Gates A, Gates M, Vandermeer B, et al. Glucocorticoids for croup in children. Cochrane Database Syst Rev. 2018;8(8):CD001955.' },
  ],
}

/* ═════════════════════ Escore de Kocher — quadril séptico ═════════════════════ */

const kocher: Ferramenta = {
  id: 'kocher',
  nome: 'Escore de Kocher — artrite séptica do quadril na criança',
  sinonimos: ['kocher', 'artrite septica quadril', 'sinovite transitoria', 'caird', 'claudicacao crianca'],
  resumo: 'Separa artrite séptica de sinovite transitória do quadril em quatro critérios, e define quem precisa de punção articular.',
  categorias: ['pediatria', 'especialidades', 'emergencia'],
  campos: [
    campoSimNao('febre', 'Febre relatada ou aferida acima de 38,5 °C', 1, 'Vale a febre relatada pelos pais, e não apenas a aferida no serviço — a criança pode ter recebido antitérmico antes da consulta.'),
    campoSimNao('carga', 'Incapacidade de sustentar o peso no membro afetado', 1, 'Recusa em andar ou em apoiar o pé no chão. Na sinovite transitória a criança costuma mancar, mas anda; na artrite séptica ela em geral se recusa a apoiar.'),
    campoSimNao('vhs', 'VHS acima de 40 mm/h', 1, 'Velocidade de hemossedimentação. Ela sobe mais devagar que a proteína C-reativa e permanece elevada por mais tempo, o que a torna útil também no acompanhamento.'),
    campoSimNao('leuco', 'Leucócitos acima de 12.000/mm³', 1, 'Leucograma periférico. Em lactentes e em imunossuprimidos, a artrite séptica pode cursar sem leucocitose.'),
    campoNum('pcr', 'PCR', { unidade: 'mg/L', min: 0, max: 400, passo: 0.1, opcional: true, ajuda: 'Critério de Caird, acrescentado ao Kocher original: **PCR acima de 20 mg/L** é o preditor independente mais forte de artrite séptica, e a PCR abaixo de 10 mg/L com os demais critérios negativos torna o diagnóstico muito improvável.' }),
  ],
  calcular: (v) => {
    const criterios: [string, string][] = [
      ['Febre > 38,5 °C', 'febre'],
      ['Não sustenta o peso', 'carga'],
      ['VHS > 40 mm/h', 'vhs'],
      ['Leucócitos > 12.000', 'leuco'],
    ]
    const total = somaSimNao(v, criterios.map(([, id]) => ({ id, pontos: 1 })))
    const pcr = num(v, 'pcr')
    const caird = pcr !== null && pcr > 20
    const totalCaird = total + (caird ? 1 : 0)

    const probabilidades = [2, 9.5, 35, 73, 93]
    const prob = probabilidades[Math.min(total, 4)]
    const nivel: Nivel = total >= 3 ? 'critico' : total === 2 ? 'alerta' : total === 1 ? 'atencao' : 'ok'

    const conduta: string[] = []
    if (total >= 3) {
      conduta.push('**Três ou quatro critérios: trate como artrite séptica até prova em contrário.** Acione a ortopedia para **punção articular guiada por imagem com urgência** — a análise do líquido (contagem de células, Gram, cultura) é o que confirma, e o atraso na drenagem é o que produz destruição da cartilagem e necrose avascular da cabeça femoral.')
      conduta.push('Colha **hemoculturas antes do antimicrobiano** (positivas em 30 a 50% dos casos) e inicie cobertura empírica para *Staphylococcus aureus*, incluindo cepas resistentes à oxacilina conforme a epidemiologia local, e para *Kingella kingae* em menores de 4 anos, que responde a betalactâmico.')
    } else if (total === 2) {
      conduta.push('**Dois critérios: zona de indefinição, com probabilidade em torno de 35%.** É exatamente aqui que a PCR e a ultrassonografia mudam a conduta. Solicite **ultrassonografia do quadril** para documentar derrame e, havendo derrame com PCR elevada, prossiga para punção.')
    } else {
      conduta.push('**Zero ou um critério: sinovite transitória é a hipótese principal.** Trate com anti-inflamatório, repouso relativo e reavaliação clínica em 24 a 48 horas. A sinovite transitória costuma seguir um quadro viral e resolve em 1 a 2 semanas.')
    }
    conduta.push(
      'Use a **ultrassonografia como primeiro exame de imagem**: ela detecta derrame com alta sensibilidade, é rápida e não irradia. Ausência de derrame praticamente afasta artrite séptica do quadril e redireciona a investigação.',
      'Considere os diagnósticos que o escore não cobre e que exigem conduta própria: **osteomielite** (que pode coexistir), **doença de Legg-Calvé-Perthes**, **epifisiólise proximal do fêmur** (sobretudo no adolescente obeso, em que o quadro é mais arrastado), **artrite idiopática juvenil**, **leucemia** e **abscesso do psoas**.',
      'Confirmada a artrite séptica, o tratamento é **drenagem cirúrgica ou punções repetidas mais antimicrobiano**, com transição para via oral guiada pela resposta clínica e pela queda da PCR. A duração habitual é de 3 a 4 semanas no total.',
      'Acompanhe com **PCR seriada**: ela cai mais rápido que a VHS e é o melhor marcador de resposta. PCR que não cai após 48 a 72 h de tratamento sugere drenagem insuficiente, osteomielite associada ou agente resistente.',
    )

    return {
      titulo: 'Escore de Kocher',
      valor: fmtInt(total),
      unidade: 'de 4 critérios',
      nivel,
      rotuloNivel: `Probabilidade aproximada de ${prob}%`,
      detalhes: [
        ...criterios.map(([rotulo, id]) => ({
          rotulo,
          valor: sim(v, id) ? 'Presente' : 'Ausente',
          nivel: (sim(v, id) ? 'alerta' : 'ok') as Nivel,
        })),
        ...(pcr !== null
          ? [{ rotulo: 'PCR > 20 mg/L (critério de Caird)', valor: caird ? `Sim (${fmt(pcr, 1)} mg/L)` : `Não (${fmt(pcr, 1)} mg/L)`, nivel: (caird ? 'alerta' : 'ok') as Nivel }]
          : []),
        ...(pcr !== null ? [{ rotulo: 'Total com Caird', valor: `${fmtInt(totalCaird)} de 5` }] : []),
      ],
      interpretacao: [
        `**${total} de 4 critérios — probabilidade aproximada de ${prob}%.** A série original de Kocher mostrou: 0 critérios, 0,2 a 2%; 1 critério, 3 a 9,5%; 2 critérios, 35 a 40%; 3 critérios, 73 a 93%; 4 critérios, 93 a 99%. As validações posteriores encontraram números mais baixos, o que reforça que o escore estratifica, mas não decide sozinho.`,
        pcr !== null
          ? caird
            ? '**PCR acima de 20 mg/L** — o critério de Caird, acrescentado ao Kocher original, é o preditor independente mais forte de artrite séptica e eleva a probabilidade acima do que os quatro critérios clássicos indicam.'
            : `PCR de ${fmt(pcr, 1)} mg/L, abaixo do limiar de Caird. PCR abaixo de 10 mg/L com os demais critérios negativos torna a artrite séptica bastante improvável.`
          : 'A PCR não foi informada. Ela é o preditor isolado mais forte e vale a pena obtê-la: acima de 20 mg/L (critério de Caird) desloca a probabilidade de forma importante.',
        'A distinção clínica importa porque os dois diagnósticos têm desfechos opostos: a **sinovite transitória** é autolimitada e resolve em 1 a 2 semanas com anti-inflamatório, enquanto a **artrite séptica** destrói cartilagem em dias e pode levar a necrose avascular da cabeça femoral e a sequela funcional permanente.',
        'O escore foi derivado em população específica e **perde acurácia em lactentes, imunossuprimidos e crianças que já receberam antibiótico** — esse último cenário atenua febre, leucocitose e PCR, e produz escore falsamente baixo.',
      ],
      conduta,
      alertas: [
        '**Escore baixo não exclui artrite séptica.** Diante de quadril doloroso com derrame, limitação importante da rotação interna e piora progressiva, a punção articular se justifica independentemente da pontuação — o custo de perder o diagnóstico é uma articulação.',
        'Antibiótico administrado antes da punção reduz a chance de isolar o agente e atenua todos os marcadores. Colha hemoculturas e, sempre que possível, o líquido articular **antes** da primeira dose.',
      ],
    }
  },
  formula: ['Kocher = febre > 38,5 °C + não sustenta peso + VHS > 40 mm/h + leucócitos > 12.000/mm³', 'Critério de Caird acrescenta PCR > 20 mg/L'],
  fundamento:
    'A artrite séptica do quadril na criança chega à articulação por três rotas: **disseminação hematogênica** (a mais comum, favorecida pelas alças capilares lentas da metáfise em crescimento), **extensão direta** de uma osteomielite metafisária — e aqui há uma particularidade anatômica decisiva, porque a metáfise proximal do fêmur é **intra-articular**, de modo que uma osteomielite ali drena diretamente para dentro da articulação — e **inoculação direta** por trauma ou punção. Uma vez dentro, a bactéria desencadeia resposta inflamatória com liberação de enzimas proteolíticas por neutrófilos e sinoviócitos: a cartilagem articular, que é avascular e se nutre por difusão do líquido sinovial, começa a ser degradada em 8 horas e sofre dano irreversível em poucos dias. O derrame sob pressão ainda comprime os vasos retinaculares que irrigam a cabeça femoral, somando **necrose avascular** ao dano cartilaginoso. É essa janela curta que faz do escore de Kocher uma ferramenta de triagem para um procedimento — a punção — e não um instrumento de diagnóstico definitivo: o custo de esperar é desproporcional ao custo de puncionar.',
  armadilhas: [
    'A artrite séptica pode coexistir com osteomielite, e o tratamento da primeira sem reconhecer a segunda leva a recidiva e a PCR que não cai.',
    'Em menores de 4 anos, *Kingella kingae* é agente frequente, cresce mal em meio convencional e exige inoculação do líquido em frasco de hemocultura ou pesquisa por PCR — cultura negativa não afasta infecção.',
    'Antibiótico prévio atenua febre, leucocitose, VHS e PCR e produz escore falsamente tranquilizador.',
    'O escore foi derivado para o **quadril**. Aplicá-lo a joelho, tornozelo ou ombro não é validado, ainda que o raciocínio clínico seja análogo.',
  ],
  referencias: [
    { texto: 'Kocher MS, Zurakowski D, Kasser JR. Differentiating between septic arthritis and transient synovitis of the hip in children: an evidence-based clinical prediction algorithm. J Bone Joint Surg Am. 1999;81(12):1662-1670.' },
    { texto: 'Caird MS, Flynn JM, Leung YL, et al. Factors distinguishing septic arthritis from transient synovitis of the hip in children: a prospective study. J Bone Joint Surg Am. 2006;88(6):1251-1257.' },
    { texto: 'Woods CR, Bradley JS, Chatterjee A, et al. Clinical Practice Guideline by the Pediatric Infectious Diseases Society and the Infectious Diseases Society of America: 2023 Guideline on Diagnosis and Management of Acute Bacterial Arthritis in Pediatrics. J Pediatric Infect Dis Soc. 2024;13(1):1-59.' },
  ],
}

/* ═══════════════ PECARN — tomografia no trauma cranioencefálico pediátrico ═══════════════ */

const pecarnCampos: Campo[] = [
  campoSeg('faixa', 'Faixa etária', [
    { valor: 'menor2', rotulo: 'Menor de 2 anos' },
    { valor: 'maior2', rotulo: '2 anos ou mais' },
  ], { ajuda: 'As duas regras têm itens diferentes porque o lactente não relata sintoma, tem crânio mais maleável e sutura aberta, e apresenta hematoma de couro cabeludo como marcador de fratura — achado que perde valor depois dos 2 anos.' }),
  campoSimNao('gcs14', 'Glasgow de 14, ou alteração do estado mental', 0, 'Alteração do estado mental inclui agitação, sonolência, resposta lenta ou repetição de perguntas. Junto com fratura palpável ou sinais de fratura de base, é **critério de alto risco** e indica tomografia diretamente.'),
  campoSimNao('fraturaPalpavel', 'Fratura de crânio palpável (menores de 2 anos)', 0, 'Depressão, degrau ou crepitação à palpação. Em maiores de 2 anos o item equivalente são os **sinais de fratura de base**: hemotímpano, equimose periorbital em óculos, equimose retroauricular (sinal de Battle) e otorreia ou rinorreia de líquor.'),
  campoSimNao('hematomaOccipital', 'Hematoma de couro cabeludo occipital, temporal ou parietal (menores de 2 anos)', 0, 'Hematoma **frontal isolado** não conta: ele é o de menor associação com lesão intracraniana. Occipital, temporal e parietal são os que importam, e o tamanho também pesa.'),
  campoSimNao('perdaConsciencia', 'Perda de consciência (≥ 5 s em menores de 2 anos; qualquer duração em maiores)', 0, 'Em menores de 2 anos, só conta se durou 5 segundos ou mais; em maiores de 2 anos, qualquer perda de consciência conta como fator de risco intermediário.'),
  campoSimNao('mecanismoGrave', 'Mecanismo de trauma grave', 0, 'Acidente automobilístico com ejeção, morte de outro ocupante ou capotamento; atropelamento de pedestre ou ciclista sem capacete; queda de mais de **0,9 m** em menores de 2 anos ou de mais de **1,5 m** em maiores; impacto por objeto de alto impacto.'),
  campoSimNao('comportamento', 'Comportamento anormal segundo os pais (menores de 2 anos)', 0, 'Os pais são a melhor fonte para "ele não está ele mesmo" — esse relato tem valor preditivo real nessa faixa e deve ser perguntado explicitamente.'),
  campoSimNao('vomitos', 'Vômitos (maiores de 2 anos)', 0, 'Fator de risco intermediário. Vômito isolado, sem outros fatores, raramente indica lesão — mas vômito persistente ou que começa tardiamente muda o quadro.'),
  campoSimNao('cefaleiaGrave', 'Cefaleia intensa (maiores de 2 anos)', 0, 'Fator de risco intermediário.'),
  campoSimNao('anticoagulante', 'Uso de anticoagulante ou distúrbio de coagulação', 0, 'Não faz parte da regra PECARN original, mas eleva substancialmente o risco de hemorragia tardia e justifica limiar mais baixo para imagem e para observação prolongada.'),
]

const pecarn: Ferramenta = {
  id: 'pecarn-tce',
  nome: 'PECARN — tomografia de crânio no trauma pediátrico',
  sigla: 'PECARN',
  sinonimos: ['pecarn', 'tce pediatrico', 'tomografia crianca', 'trauma cranio crianca', 'traumatismo craniano'],
  resumo: 'Identifica a criança com trauma craniano leve que pode dispensar tomografia, com valor preditivo negativo próximo de 100%.',
  categorias: ['pediatria', 'emergencia', 'neurologia'],
  campos: pecarnCampos,
  calcular: (v) => {
    const menor2 = opc(v, 'faixa') === 'menor2'
    const anticoagulante = sim(v, 'anticoagulante')

    const altoRisco = sim(v, 'gcs14') || sim(v, 'fraturaPalpavel')
    const intermediario = menor2
      ? sim(v, 'hematomaOccipital') || sim(v, 'perdaConsciencia') || sim(v, 'mecanismoGrave') || sim(v, 'comportamento')
      : sim(v, 'perdaConsciencia') || sim(v, 'vomitos') || sim(v, 'mecanismoGrave') || sim(v, 'cefaleiaGrave')

    const categoria = altoRisco ? 'alto' : intermediario ? 'intermediario' : 'baixo'
    const risco = altoRisco ? '4,4%' : intermediario ? '0,9%' : menor2 ? '0,02%' : '0,05%'
    const nivel: Nivel = altoRisco ? 'critico' : intermediario ? 'atencao' : 'ok'

    const conduta: string[] = []
    if (altoRisco) {
      conduta.push('**Alto risco: solicite tomografia de crânio sem contraste.** O risco de lesão cerebral clinicamente importante é de aproximadamente 4,4%, alto o bastante para que a imagem se justifique sem discussão.')
    } else if (intermediario) {
      conduta.push(
        '**Risco intermediário (cerca de 0,9%): decisão compartilhada entre tomografia e observação.** A observação por 4 a 6 horas na emergência é uma alternativa legítima e reduz o uso de tomografia sem aumentar lesões perdidas — a maioria das lesões clinicamente importantes se manifesta nesse período.',
        'Pesem a favor da **tomografia**: múltiplos fatores presentes, piora durante a observação, idade abaixo de 3 meses, vômitos persistentes, preferência dos pais por definição, ou impossibilidade de retorno rápido ao serviço.',
        'Pesem a favor da **observação**: fator isolado, mecanismo leve, criança ativa e brincando, experiência do médico com o quadro, e disponibilidade de reavaliação.',
      )
    } else {
      conduta.push(
        '**Baixo risco: tomografia não está indicada.** O risco de lesão cerebral clinicamente importante é de cerca de 0,02% em menores de 2 anos e 0,05% em maiores — abaixo do risco atribuível de câncer induzido por radiação nessa faixa etária.',
        'Dê alta com **orientação escrita** de sinais de retorno: vômitos repetidos, sonolência progressiva, dificuldade de despertar, confusão, convulsão, cefaleia que piora, assimetria de pupilas, fraqueza ou alteração da fala, e saída de líquido claro pelo nariz ou ouvido.',
      )
    }
    if (anticoagulante) {
      conduta.push('**Uso de anticoagulante ou distúrbio de coagulação:** o PECARN não contempla esse fator, e ele eleva muito o risco de hemorragia tardia. Baixe o limiar para tomografia e considere observação prolongada e tomografia de controle, mesmo com regra negativa.')
    }
    conduta.push(
      '**Radiografia de crânio não tem lugar** na avaliação do trauma craniano: ela não afasta lesão intracraniana e sua normalidade produz falsa segurança. A exceção estreita é a investigação de maus-tratos, em que a série óssea faz parte do protocolo.',
      'Considere **maus-tratos** quando a história for inconsistente com a lesão, mudar a cada relato, ou houver atraso na procura de atendimento — sobretudo em lactentes que ainda não deambulam, em que qualquer fratura ou hematoma significativo exige investigação.',
      'Na criança que faz tomografia e ela vem normal, com exame neurológico normal, **a alta é segura**: deterioração após tomografia normal é rara, e não há indicação de tomografia de controle de rotina.',
    )

    return {
      titulo: `PECARN — ${menor2 ? 'menores de 2 anos' : '2 anos ou mais'}`,
      valor: categoria === 'alto' ? 'Tomografia indicada' : categoria === 'intermediario' ? 'Tomografia ou observação' : 'Tomografia dispensável',
      nivel,
      rotuloNivel: `Risco de lesão clinicamente importante ≈ ${risco}`,
      detalhes: [
        { rotulo: 'Alto risco', valor: altoRisco ? 'Presente' : 'Ausente', nivel: (altoRisco ? 'critico' : 'ok') as Nivel, nota: 'Glasgow 14 / alteração do estado mental, ou fratura palpável (ou de base)' },
        { rotulo: 'Risco intermediário', valor: intermediario ? 'Presente' : 'Ausente', nivel: (intermediario ? 'atencao' : 'ok') as Nivel },
        { rotulo: 'Anticoagulação ou coagulopatia', valor: anticoagulante ? 'Sim' : 'Não', nivel: (anticoagulante ? 'alerta' : 'ok') as Nivel, nota: 'Fora da regra original' },
        { rotulo: 'Risco estimado', valor: risco },
      ],
      interpretacao: [
        `**Categoria de ${categoria === 'alto' ? 'alto risco' : categoria === 'intermediario' ? 'risco intermediário' : 'baixo risco'}, com risco estimado de lesão cerebral clinicamente importante em torno de ${risco}.** O PECARN foi derivado e validado em mais de 42 mil crianças e é a maior regra de decisão pediátrica já construída.`,
        'O desfecho que a regra prediz é **lesão cerebral clinicamente importante**, e essa definição é deliberadamente restrita: morte, necessidade de neurocirurgia, intubação por mais de 24 horas ou internação de 2 noites ou mais por causa do trauma. Ela **não** prediz qualquer achado tomográfico — pequenas hemorragias sem consequência clínica não entram, e essa escolha é o que permite dispensar imagem com segurança.',
        menor2
          ? 'Na faixa **abaixo de 2 anos**, o hematoma de couro cabeludo **não frontal** é um item próprio, porque o crânio é mais maleável e a fratura linear subjacente se manifesta assim. E o relato dos pais de que a criança "não está ela mesma" entra como critério formal, já que o lactente não descreve sintoma.'
          : 'Na faixa de **2 anos ou mais**, o hematoma de couro cabeludo sai da regra e entram vômitos, cefaleia intensa e perda de consciência de qualquer duração como fatores intermediários.',
        categoria === 'baixo'
          ? '**Baixo risco: o valor preditivo negativo da regra é próximo de 100%**, e essa segurança precisa ser confrontada com o dano da tomografia — uma tomografia de crânio na infância acrescenta risco pequeno mas real de neoplasia, e o encéfalo em desenvolvimento é mais radiossensível. Em muitos casos, a tomografia ainda exige sedação, que traz risco próprio.'
          : 'A regra identifica risco; ela não substitui o julgamento clínico nem a reavaliação seriada, que continua sendo o instrumento mais sensível de todos.',
      ],
      conduta,
      alertas: [
        '**Radiografia de crânio não afasta lesão intracraniana** e não deve ser usada para essa finalidade.',
        'O PECARN vale para trauma **leve** — Glasgow 14 ou 15 — nas primeiras 24 horas. Glasgow abaixo de 14, trauma penetrante, tumor cerebral conhecido, derivação ventricular ou distúrbio de coagulação ficam fora da regra e pedem imagem.',
        'História inconsistente com a lesão, relato que muda, atraso na procura de atendimento ou lesão significativa em lactente que não deambula: investigue **maus-tratos**.',
      ],
    }
  },
  formula: [
    'Menores de 2 anos — alto risco: Glasgow 14 ou alteração do estado mental, ou fratura palpável',
    'Menores de 2 anos — intermediário: hematoma não frontal, perda de consciência ≥ 5 s, mecanismo grave, comportamento anormal segundo os pais',
    'Maiores de 2 anos — alto risco: Glasgow 14 ou alteração do estado mental, ou sinais de fratura de base',
    'Maiores de 2 anos — intermediário: perda de consciência, vômitos, mecanismo grave, cefaleia intensa',
  ],
  fundamento:
    'A criança difere do adulto no trauma craniano por razões anatômicas concretas, e o PECARN foi construído em torno delas. O crânio do lactente é **maleável e com suturas abertas**, o que permite deformação sem fratura e, ao mesmo tempo, transmite energia ao parênquima com menos dissipação; a cabeça representa proporção muito maior da massa corporal, deslocando o centro de gravidade e tornando o mecanismo de aceleração-desaceleração mais eficiente; o espaço subaracnóideo é relativamente maior, permitindo maior movimentação do encéfalo dentro da caixa; e a mielinização incompleta torna o tecido mais suscetível a lesão axonal difusa. Some-se a isso que o lactente **não relata sintoma** — não há cefaleia, tontura ou amnésia a colher —, o que obriga a regra a se apoiar em achados objetivos (hematoma não frontal, fratura palpável) e no relato dos pais. Do outro lado da balança está o custo da imagem: o encéfalo em desenvolvimento é mais radiossensível, a expectativa de vida é longa o bastante para que o risco estocástico de neoplasia se manifeste, e a tomografia frequentemente exige sedação. O PECARN resolve essa tensão restringindo o desfecho a **lesão clinicamente importante** — não qualquer achado de imagem —, o que é o que permite dispensar a tomografia com segurança em quem não precisa dela.',
  armadilhas: [
    'A regra vale para trauma leve nas primeiras 24 horas; aplicá-la fora disso, ou a Glasgow abaixo de 14, é uso incorreto.',
    'Hematoma **frontal** isolado em menores de 2 anos não conta como fator: só occipital, temporal ou parietal.',
    'Distúrbio de coagulação e uso de anticoagulante não fazem parte da regra e elevam o risco de hemorragia tardia — exigem limiar próprio.',
    'A observação estruturada é alternativa validada à tomografia no grupo intermediário, e é subutilizada: a maioria das lesões importantes se manifesta em 4 a 6 horas.',
  ],
  referencias: [
    { texto: 'Kuppermann N, Holmes JF, Dayan PS, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma: a prospective cohort study. Lancet. 2009;374(9696):1160-1170.' },
    { texto: 'Holmes JF, Yen K, Ugalde IT, et al. PECARN prediction rules for CT imaging of children presenting to the emergency department with blunt abdominal or minor head trauma: a multicentre prospective validation study. Lancet Child Adolesc Health. 2024;8(5):339-347.' },
    { texto: 'Dayan PS, Holmes JF, Atabaki S, et al. Association of traumatic brain injuries with vomiting in children with blunt head trauma. Ann Emerg Med. 2014;63(6):657-665.' },
  ],
}


/* ═══════════════════ Estadiamento de Tanner ═══════════════════ */

const tannerCampos: Campo[] = [
  campoSexo('sexo', 'Sexo biológico'),
  campoNum('idadeAnos', 'Idade', { unidade: 'anos', min: 5, max: 20, passo: 0.5, ajuda: 'A idade serve para confrontar o estágio encontrado com a janela esperada — é a **discordância** entre os dois que define puberdade precoce ou atrasada, não o estágio em si.' }),
  campoOpc('mama', 'Mamas (M)', [
    { valor: '1', rotulo: 'M1 — Pré-púbere: apenas elevação da papila', pontos: 1 },
    { valor: '2', rotulo: 'M2 — Broto mamário: elevação da mama e da papila, aréola alargada', pontos: 2 },
    { valor: '3', rotulo: 'M3 — Maior aumento de mama e aréola, sem separação de contornos', pontos: 3 },
    { valor: '4', rotulo: 'M4 — Aréola e papila formam segunda saliência sobre a mama', pontos: 4 },
    { valor: '5', rotulo: 'M5 — Mama adulta: só a papila se projeta', pontos: 5 },
  ], { padrao: '1', mostrarSe: (v) => opc(v, 'sexo') === 'f', ajuda: 'O **M2 é o marco inicial** da puberdade feminina e deve ser confirmado por palpação, não só por inspeção: a lipomastia da obesidade simula broto mamário à inspeção e é a causa mais comum de encaminhamento indevido por puberdade precoce.' }),
  campoOpc('genital', 'Genitália (G)', [
    { valor: '1', rotulo: 'G1 — Pré-púbere: testículos < 4 mL, pênis infantil', pontos: 1 },
    { valor: '2', rotulo: 'G2 — Testículos de 4 a 8 mL, escroto avermelhado e com textura alterada', pontos: 2 },
    { valor: '3', rotulo: 'G3 — Testículos de 9 a 12 mL, pênis aumenta em comprimento', pontos: 3 },
    { valor: '4', rotulo: 'G4 — Testículos de 12 a 15 mL, pênis aumenta em diâmetro, glande desenvolvida', pontos: 4 },
    { valor: '5', rotulo: 'G5 — Adulto: testículos > 15 mL', pontos: 5 },
  ], { padrao: '1', mostrarSe: (v) => opc(v, 'sexo') === 'm', ajuda: 'O marco inicial da puberdade masculina é o **volume testicular de 4 mL** (ou eixo maior de 2,5 cm), medido com orquidômetro de Prader. Pelos pubianos sem aumento testicular indicam adrenarca, não puberdade verdadeira — a distinção é central.' }),
  campoOpc('pelos', 'Pelos pubianos (P)', [
    { valor: '1', rotulo: 'P1 — Ausentes ou velus', pontos: 1 },
    { valor: '2', rotulo: 'P2 — Pelos longos, levemente pigmentados, lisos ou pouco encaracolados', pontos: 2 },
    { valor: '3', rotulo: 'P3 — Pelos mais escuros, grossos e encaracolados, espalhando-se pelo púbis', pontos: 3 },
    { valor: '4', rotulo: 'P4 — Tipo adulto, sem atingir a face interna das coxas', pontos: 4 },
    { valor: '5', rotulo: 'P5 — Adulto, estendendo-se à face interna das coxas', pontos: 5 },
  ], { padrao: '1', ajuda: 'Os pelos pubianos dependem de **androgênios adrenais** (adrenarca) e evoluem de forma parcialmente independente do eixo gonadal. Por isso o estágio de pelos pode discordar do de mama ou genitália — e essa discordância é informativa.' }),
  campoSimNao('menarca', 'Já teve menarca', 0, 'A menarca ocorre tipicamente no estágio M4, cerca de 2 a 2,5 anos após o broto mamário, e já **depois do pico de velocidade de crescimento** na menina — restam em média 5 a 7 cm de estatura após ela.'),
]

const tanner: Ferramenta = {
  id: 'tanner',
  nome: 'Estadiamento de Tanner — maturação sexual',
  sinonimos: ['tanner', 'estadiamento puberal', 'maturacao sexual', 'puberdade', 'telarca', 'pubarca'],
  resumo: 'Estadia a maturação sexual e confronta o estágio com a janela etária esperada, que é o que define precocidade ou atraso.',
  categorias: ['pediatria', 'endocrinologia'],
  campos: tannerCampos,
  calcular: (v) => {
    const feminino = opc(v, 'sexo') === 'f'
    const idade = num(v, 'idadeAnos')
    if (idade === null) return null
    const principal = ptsOpc(tannerCampos, v, feminino ? 'mama' : 'genital')
    const pelos = ptsOpc(tannerCampos, v, 'pelos')
    if (principal === null || pelos === null) return null

    const iniciado = principal >= 2
    const limiteInferior = feminino ? 8 : 9
    const limiteSuperior = feminino ? 13 : 14
    const precoce = iniciado && idade < limiteInferior
    const atrasada = !iniciado && idade > limiteSuperior
    const discordancia = Math.abs(principal - pelos) >= 2

    const nivel: Nivel = precoce || atrasada ? 'alerta' : discordancia ? 'atencao' : 'ok'
    const rotulo = precoce ? 'Puberdade precoce a investigar' : atrasada ? 'Puberdade atrasada a investigar' : iniciado ? 'Puberdade em curso' : 'Pré-púbere'

    const interpretacao: string[] = [
      `**${feminino ? `M${principal}` : `G${principal}`}, P${pelos}, aos ${fmt(idade, 1)} anos — ${rotulo.toLowerCase()}.** Os estágios de mama ou genitália e de pelos são registrados **separadamente** porque dependem de eixos hormonais diferentes: o gonadal (gonadarca) e o adrenal (adrenarca).`,
      feminino
        ? `Na menina, a puberdade começa pelo **broto mamário (M2)**, tipicamente entre 8 e 13 anos. O pico de velocidade de crescimento ocorre cedo, em M2 a M3, e a **menarca vem depois dele**, em torno de M4 — o que significa que, após a primeira menstruação, restam em média apenas 5 a 7 cm de estatura.`
        : `No menino, a puberdade começa pelo **aumento testicular para 4 mL ou mais (G2)**, tipicamente entre 9 e 14 anos. O pico de velocidade de crescimento é **tardio**, em G4, e é por isso que meninos em atraso constitucional continuam crescendo depois que as colegas pararam — e acabam mais altos.`,
      precoce
        ? `**Início antes de ${limiteInferior} anos configura puberdade precoce** e exige investigação. Separe a **central** (dependente de gonadotrofinas, com aumento testicular bilateral ou telarca progressiva) da **periférica** (independente, por tumor, cisto ovariano, hiperplasia adrenal congênita, exposição exógena a esteroides, ou síndrome de McCune-Albright).`
        : atrasada
          ? `**Ausência de sinais puberais depois de ${limiteSuperior} anos configura puberdade atrasada.** A causa mais comum é o **atraso constitucional do crescimento e da puberdade**, que é variante do normal e costuma ter história familiar — mas é diagnóstico de exclusão. Investigue hipogonadismo hipogonadotrófico (incluindo síndrome de Kallmann, com anosmia), hipergonadotrófico (Turner, Klinefelter), doença crônica, desnutrição, transtorno alimentar e excesso de exercício.`
          : 'A cronologia está dentro da janela esperada para a idade.',
      discordancia
        ? '**Há discordância importante entre o estágio gonadal e o de pelos**, o que aponta dissociação entre adrenarca e gonadarca. Pelos avançados com gônadas pré-púberes sugerem adrenarca precoce isolada, hiperplasia adrenal congênita não clássica ou tumor produtor de androgênio; gônadas avançadas com poucos pelos podem ocorrer em insuficiência adrenal.'
        : 'Os estágios gonadal e de pelos evoluem de forma concordante, como é o padrão habitual.',
    ]

    return {
      titulo: 'Estadiamento de Tanner',
      valor: `${feminino ? 'M' : 'G'}${principal} P${pelos}`,
      nivel,
      rotuloNivel: rotulo,
      detalhes: [
        { rotulo: feminino ? 'Mamas' : 'Genitália', valor: `${feminino ? 'M' : 'G'}${principal}` },
        { rotulo: 'Pelos pubianos', valor: `P${pelos}` },
        { rotulo: 'Idade', valor: `${fmt(idade, 1)} anos` },
        { rotulo: 'Janela esperada de início', valor: `${limiteInferior} a ${limiteSuperior} anos`, nota: feminino ? 'Telarca (M2)' : 'Testículos ≥ 4 mL (G2)' },
        ...(feminino ? [{ rotulo: 'Menarca', valor: sim(v, 'menarca') ? 'Presente' : 'Ausente' }] : []),
        { rotulo: 'Pico de velocidade de crescimento', valor: feminino ? 'Precoce (M2-M3), antes da menarca' : 'Tardio (G4)' },
      ],
      interpretacao,
      conduta: [
        precoce
          ? '**Investigue puberdade precoce:** idade óssea (radiografia de mão e punho esquerdos), LH e FSH basais, estradiol ou testosterona, e **teste de estímulo com GnRH** quando os basais forem inconclusivos — resposta puberal do LH confirma a forma central. Ressonância de sela é obrigatória em meninos e em meninas abaixo de 6 anos, pela frequência de causa orgânica.'
          : atrasada
            ? '**Investigue puberdade atrasada:** idade óssea, LH, FSH, testosterona ou estradiol, TSH, prolactina, hemograma, função renal e hepática, e rastreio de doença celíaca. **LH e FSH elevados** apontam falência gonadal (peça cariótipo: Turner em meninas, Klinefelter em meninos); **baixos ou normais** apontam causa central ou atraso constitucional, e a diferenciação frequentemente exige acompanhamento.'
            : 'Acompanhe com estadiamento e **velocidade de crescimento** a cada 6 meses. A velocidade é mais sensível que a estatura absoluta para detectar desvios, e a associação entre estágio de Tanner e velocidade de crescimento é o que permite prever o estirão.',
        'Calcule a **estatura-alvo parental** e compare com o canal de crescimento atual: soma das estaturas dos pais dividida por 2, mais 6,5 cm para meninos e menos 6,5 cm para meninas.',
        'Use a **idade óssea** para prever estatura final e para distinguir os quadros: idade óssea avançada em relação à cronológica acelera o fechamento das epífises e reduz a estatura final (típico da precocidade); idade óssea atrasada preserva o potencial de crescimento e é característica do atraso constitucional.',
        'Cuidado com a **lipomastia** do menino e da menina obesos, que simula telarca à inspeção — palpe sempre para confirmar tecido glandular. E com a **telarca precoce isolada**, comum entre 1 e 3 anos, benigna e não progressiva, que não exige tratamento.',
        'Aborde o **impacto psicossocial**, que é parte do problema e não um detalhe: puberdade precoce associa-se a sofrimento e a maior vulnerabilidade; atraso puberal, sobretudo em meninos, associa-se a baixa autoestima e a bullying. Explique a trajetória esperada ao adolescente e à família.',
      ],
      alertas: [
        '**Pelos pubianos isolados não são puberdade verdadeira.** No menino, o marco é o volume testicular de 4 mL; na menina, o broto mamário palpável. Pelos com gônadas pré-púberes são adrenarca e pedem outra investigação.',
        'O estadiamento exige exame físico com **consentimento, privacidade e acompanhante**, e deve ser feito com objetivo clínico claro. Em adolescentes, explique antes o que será examinado e por quê.',
        'Puberdade precoce em **meninos** é muito mais frequentemente orgânica que em meninas — neuroimagem é obrigatória nesse grupo.',
      ],
    }
  },
  formula: ['Meninas: M1 a M5 (mamas) e P1 a P5 (pelos) · marco inicial M2 entre 8 e 13 anos', 'Meninos: G1 a G5 (genitália) e P1 a P5 · marco inicial testículos ≥ 4 mL entre 9 e 14 anos'],
  fundamento:
    'A puberdade é a reativação de um eixo que funcionou no feto e no lactente e depois foi suprimido: o gerador de pulsos de GnRH do núcleo arqueado hipotalâmico entra em quiescência na infância e volta a disparar, primeiro à noite, por desinibição que envolve o sistema **kisspeptina-neurocinina B-dinorfina** — a descoberta de que mutações no receptor da kisspeptina causam hipogonadismo hipogonadotrófico foi o que revelou esse mecanismo. Os pulsos de GnRH estimulam LH e FSH, que por sua vez ativam as gônadas: nos testículos, o LH age nas células de Leydig produzindo testosterona e o FSH nas células de Sertoli promovendo a espermatogênese — e é o crescimento dos túbulos seminíferos, e não a produção hormonal, que responde por quase todo o aumento do volume testicular, razão pela qual ele é o primeiro sinal mensurável. Nos ovários, o FSH recruta folículos e o estradiol produz a telarca. A **adrenarca** é um processo separado e anterior, decorrente da maturação da zona reticular da suprarrenal e da produção de DHEA e androstenediona, e é ela que gera pelos pubianos e axilares — daí o estadiamento registrar os dois eixos em separado, e daí a dissociação entre eles ser um achado diagnóstico e não um erro de medida. A diferença na cronologia do estirão entre os sexos — precoce na menina, tardio no menino — explica a diferença de estatura final adulta: o menino cresce por mais anos antes do fechamento epifisário mediado pelo estradiol, que em ambos os sexos é o hormônio que fecha as placas.',
  armadilhas: [
    'Estadiar por inspeção sem palpação confunde lipomastia com telarca e é a causa mais comum de encaminhamento indevido por puberdade precoce.',
    'A autoavaliação por desenhos tem concordância apenas moderada com o exame do profissional, e superestima em obesos.',
    'Telarca precoce isolada entre 1 e 3 anos é benigna, não progressiva e não exige tratamento — não confundir com puberdade precoce central.',
    'A idade média da telarca vem caindo nas últimas décadas, e há variação por etnia; os limites de 8 e 9 anos continuam sendo os operacionais, mas com julgamento clínico sobre progressão e velocidade de crescimento.',
  ],
  referencias: [
    { texto: 'Marshall WA, Tanner JM. Variations in pattern of pubertal changes in girls. Arch Dis Child. 1969;44(235):291-303.' },
    { texto: 'Marshall WA, Tanner JM. Variations in the pattern of pubertal changes in boys. Arch Dis Child. 1970;45(239):13-23.' },
    { texto: 'Carel JC, Léger J. Clinical practice. Precocious puberty. N Engl J Med. 2008;358(22):2366-2377.' },
  ],
}

/* ═══════════════════ Escalas de dor pediátrica ═══════════════════ */

const dorPedCampos: Campo[] = [
  campoSeg('escala', 'Escala', [
    { valor: 'flacc', rotulo: 'FLACC (2 meses a 7 anos)' },
    { valor: 'nips', rotulo: 'NIPS (neonato)' },
    { valor: 'faces', rotulo: 'Faces / numérica (≥ 4 a 7 anos)' },
  ], { ajuda: 'A escolha é por **idade e capacidade de autorrelato**: neonato usa NIPS, criança pré-verbal ou não cooperativa usa FLACC, e a partir de 4 a 7 anos o autorrelato por faces é preferível — autorrelato sempre supera observação quando disponível.' }),
  campoOpc('face', 'Face', [
    { valor: '0', rotulo: '0 — Nenhuma expressão particular ou sorriso', pontos: 0 },
    { valor: '1', rotulo: '1 — Careta ou sobrancelha franzida ocasional, retraído', pontos: 1 },
    { valor: '2', rotulo: '2 — Tremor frequente do queixo, mandíbula cerrada', pontos: 2 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'flacc' }),
  campoOpc('pernas', 'Pernas (Legs)', [
    { valor: '0', rotulo: '0 — Posição normal ou relaxada', pontos: 0 },
    { valor: '1', rotulo: '1 — Inquietas, agitadas, tensas', pontos: 1 },
    { valor: '2', rotulo: '2 — Chutando ou esticadas', pontos: 2 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'flacc' }),
  campoOpc('atividadeF', 'Atividade', [
    { valor: '0', rotulo: '0 — Deitada quieta, posição normal, move-se facilmente', pontos: 0 },
    { valor: '1', rotulo: '1 — Contorcendo-se, movendo-se para trás e para frente, tensa', pontos: 1 },
    { valor: '2', rotulo: '2 — Curvada, rígida ou com movimentos bruscos', pontos: 2 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'flacc' }),
  campoOpc('choro', 'Choro', [
    { valor: '0', rotulo: '0 — Sem choro (acordada ou dormindo)', pontos: 0 },
    { valor: '1', rotulo: '1 — Gemidos ou choramingos, queixa ocasional', pontos: 1 },
    { valor: '2', rotulo: '2 — Choro persistente, grito, soluço, queixa frequente', pontos: 2 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'flacc', ajuda: 'Atenção: **choro ausente não significa ausência de dor**. A criança exausta, deprimida ou com dor crônica pode não chorar — a chamada "quietude patológica" é sinal de dor intensa e prolongada, não de conforto.' }),
  campoOpc('consolabilidade', 'Consolabilidade', [
    { valor: '0', rotulo: '0 — Satisfeita, relaxada', pontos: 0 },
    { valor: '1', rotulo: '1 — Tranquilizada por toque, abraço ou conversa; distraível', pontos: 1 },
    { valor: '2', rotulo: '2 — Difícil de consolar ou confortar', pontos: 2 },
  ], { padrao: '0', mostrarSe: (v) => opc(v, 'escala') === 'flacc' }),
  campoNum('nips', 'NIPS — pontuação total', { min: 0, max: 7, passo: 1, mostrarSe: (v) => opc(v, 'escala') === 'nips', ajuda: 'Some os seis itens: expressão facial (0-1), choro (0-2), padrão respiratório (0-1), braços (0-1), pernas (0-1) e estado de alerta (0-1). Total de 0 a 7, com corte de **3 ou mais** indicando dor.' }),
  campoNum('faces', 'Faces ou escala numérica (0 a 10)', { min: 0, max: 10, passo: 1, mostrarSe: (v) => opc(v, 'escala') === 'faces', ajuda: 'Na escala de faces de Wong-Baker, ancore nas extremidades ("esta carinha não tem dor nenhuma" e "esta tem a pior dor possível") e **não** associe as faces a choro ou a felicidade — a criança pode escolher a face triste por estar assustada, e não por dor.' }),
]

const dorPediatrica: Ferramenta = {
  id: 'dor-pediatrica',
  nome: 'Dor pediátrica: FLACC, NIPS e escala de faces',
  sinonimos: ['flacc', 'nips', 'wong baker', 'escala de faces', 'dor crianca', 'dor neonatal'],
  resumo: 'Mede dor por faixa etária e converte a pontuação em conduta analgésica, incluindo as medidas não farmacológicas do neonato.',
  categorias: ['pediatria', 'emergencia'],
  campos: dorPedCampos,
  calcular: (v) => {
    const escala = opc(v, 'escala') ?? 'flacc'
    let total: number | null = null
    let maximo = 10

    if (escala === 'flacc') {
      const ids = ['face', 'pernas', 'atividadeF', 'choro', 'consolabilidade']
      const pontos = ids.map((id) => ptsOpc(dorPedCampos, v, id))
      if (pontos.some((p) => p === null)) return null
      total = (pontos as number[]).reduce((a, b) => a + b, 0)
      maximo = 10
    } else if (escala === 'nips') {
      total = num(v, 'nips')
      maximo = 7
    } else {
      total = num(v, 'faces')
      maximo = 10
    }
    if (total === null) return null

    const corte = escala === 'nips' ? 3 : 4
    const intensa = escala === 'nips' ? total >= 5 : total >= 7
    const nivel: Nivel = intensa ? 'alerta' : total >= corte ? 'atencao' : 'ok'
    const faixa = intensa ? 'Dor intensa' : total >= corte ? 'Dor moderada' : total > 0 ? 'Dor leve' : 'Sem dor'

    const conduta: string[] = []
    if (escala === 'nips') {
      conduta.push(
        '**No neonato, comece pelas medidas não farmacológicas, que têm eficácia comprovada** e são sistematicamente subutilizadas: **sacarose a 24% (0,5 a 2 mL, 2 minutos antes do procedimento)**, sucção não nutritiva, contato pele a pele (método canguru), amamentação durante o procedimento, contenção facilitada e enrolamento. A combinação delas supera cada uma isolada.',
        'Para procedimentos, acrescente anestésico tópico quando houver tempo de latência (lidocaína-prilocaína exige 60 minutos) e prefira a **punção de calcanhar com lanceta automática** à punção manual.',
      )
    }
    if (total >= corte) {
      conduta.push(
        '**Dor moderada a intensa: trate agora e reavalie.** Paracetamol 10 a 15 mg/kg ou dipirona 10 a 25 mg/kg; ibuprofeno 5 a 10 mg/kg a partir de 6 meses (evite em desidratação, lesão renal e suspeita de dengue). Na dor intensa, **opioide**: morfina 0,05 a 0,1 mg/kg por via intravenosa, com reavaliação em 15 a 30 minutos.',
        '**Reavalie com a mesma escala** após o intervalo esperado de ação — 30 a 60 minutos para via oral, 15 a 30 para intravenosa. Medir uma vez e não remedir é o erro que transforma prescrição em ritual.',
      )
    } else {
      conduta.push('**Dor leve ou ausente pelo escore.** Mantenha reavaliação periódica, porque a dor flutua com procedimentos, manipulação e horário da última dose. Confronte o escore com o relato dos pais, que conhecem o basal da criança.')
    }
    conduta.push(
      '**Prescreva analgesia em horário fixo, não "se necessário"**, quando a dor é previsível — pós-operatório, trauma, mucosite. Esquema conforme necessidade deixa a criança esperar a dor voltar para receber a próxima dose, e a dor já instalada é mais difícil de controlar.',
      'Combine analgesia farmacológica com **medidas não farmacológicas**, que funcionam em todas as idades: presença dos pais, distração (bolhas, vídeo, música), posicionamento confortável, ambiente calmo e explicação apropriada à idade sobre o que vai acontecer.',
      'Use **anestésico tópico e bloqueios** para procedimentos, e não subestime o acúmulo: cada punção mal manejada sensibiliza a criança para as próximas, e a experiência dolorosa repetida na infância altera o processamento da dor a longo prazo.',
      'Registre a dor como **sinal vital**, com escala, valor, horário e resposta ao tratamento. O que não é medido não é tratado — e a dor pediátrica é historicamente subtratada por presumir-se que a criança "não sente" ou "não lembra".',
    )

    return {
      titulo: escala === 'flacc' ? 'FLACC' : escala === 'nips' ? 'NIPS' : 'Escala de faces / numérica',
      valor: fmtInt(total),
      unidade: `de ${maximo} pontos`,
      nivel,
      rotuloNivel: faixa,
      detalhes: [
        { rotulo: 'Escala aplicada', valor: escala === 'flacc' ? 'FLACC (observacional, 2 meses a 7 anos)' : escala === 'nips' ? 'NIPS (neonatal)' : 'Autorrelato (≥ 4 a 7 anos)' },
        { rotulo: 'Corte para intervenção', valor: `≥ ${corte}` },
        { rotulo: 'Faixa', valor: faixa },
      ],
      interpretacao: [
        `**${total} de ${maximo} pontos — ${faixa.toLowerCase()}.** ${escala === 'nips' ? 'No NIPS, 3 ou mais indica dor.' : 'Nas escalas de 0 a 10, a leitura usual é 1 a 3 leve, 4 a 6 moderada e 7 a 10 intensa.'}`,
        escala === 'flacc'
          ? 'O FLACC é **observacional** e avalia cinco domínios comportamentais: face, pernas, atividade, choro e consolabilidade. Ele é o instrumento para a criança que não relata — pré-verbal, com atraso de desenvolvimento, sedada ou intubada — e tem versão revisada para crianças com comprometimento cognitivo, que incorpora comportamentos individuais descritos pelos pais.'
          : escala === 'nips'
            ? 'O NIPS mede seis parâmetros no recém-nascido: expressão facial, choro, padrão respiratório, braços, pernas e estado de alerta. O neonato **sente dor** — as vias nociceptivas estão funcionais desde cerca de 24 semanas de gestação, enquanto as vias inibitórias descendentes ainda são imaturas, o que significa que ele pode sentir **mais** dor e modulá-la menos que o adulto.'
            : 'O **autorrelato é o padrão-ouro** sempre que a criança conseguir fornecê-lo, tipicamente a partir dos 4 a 7 anos. Escalas observacionais tendem a subestimar a dor em comparação ao autorrelato, e devem ser reservadas a quem não pode relatar.',
        'Escores observacionais medem **comportamento**, não nocicepção: ansiedade, fome, sono e medo do ambiente elevam a pontuação sem dor, e a criança exausta ou com dor crônica pode pontuar baixo estando com dor intensa — a chamada quietude patológica.',
        'Nenhuma escala substitui o **relato dos pais**, que conhecem o comportamento basal da criança. Quando o escore e a percepção dos pais divergem, vale investigar antes de confiar no número.',
      ],
      conduta,
      alertas: [
        '**Choro ausente não é ausência de dor.** A criança exausta, deprimida ou com dor prolongada pode ficar quieta — e essa quietude é sinal de gravidade, não de conforto.',
        'O neonato sente dor e a modula menos que o adulto: as vias nociceptivas estão prontas desde cerca de 24 semanas, e as inibitórias descendentes ainda não. Procedimento sem analgesia no neonato não é inócuo.',
        'Dor pediátrica é historicamente **subtratada**. Medir com escala apropriada, prescrever em horário fixo quando a dor é previsível e reavaliar são as três medidas que mais mudam isso.',
      ],
    }
  },
  formula: ['FLACC = 5 itens de 0 a 2 (total 0 a 10)', 'NIPS = 6 itens (total 0 a 7), corte ≥ 3', 'Faces/numérica: 0 a 10, com autorrelato a partir de 4 a 7 anos'],
  fundamento:
    'A ideia de que o recém-nascido não sente dor sustentou, até os anos 1980, a prática de operar neonatos apenas com bloqueador neuromuscular. Ela era falsa em todos os níveis. As **vias nociceptivas periféricas e espinhais estão funcionais desde cerca de 24 semanas de gestação**, e as conexões talamocorticais necessárias à percepção se estabelecem por volta de 25 a 26 semanas. O que de fato é imaturo no neonato são as **vias inibitórias descendentes**, que partem do tronco encefálico e modulam o corno dorsal — ou seja, ele recebe o estímulo e o modula pior, com campos receptivos mais amplos e limiares mais baixos. Pior ainda, a exposição repetida a dor no período neonatal produz **sensibilização de longo prazo**: alteração da arborização de fibras aferentes, hiperalgesia persistente e resposta alterada a dor meses e anos depois. Essa fisiologia justifica tanto a existência de escalas específicas quanto a eficácia surpreendente das medidas não farmacológicas — a sacarose oral ativa vias opioides endógenas por mecanismo gustativo, e o contato pele a pele e a sucção não nutritiva recrutam modulação por vias táteis e oxitocinérgicas. Nas crianças maiores, o problema muda de natureza: elas sentem e expressam, mas o comportamento é um proxy imperfeito da nocicepção, contaminado por medo, fadiga e contexto — e é por isso que o autorrelato, quando disponível, supera qualquer escala observacional.',
  armadilhas: [
    'Aplicar escala observacional a criança capaz de relatar subestima a dor: use o autorrelato sempre que possível.',
    'Escalas de faces que misturam dor com emoção (faces chorando ou sorrindo) confundem medo com dor — ancore nas extremidades e explique que se trata de dor, não de sentimento.',
    'Ansiedade, fome, sono e privação de contato elevam o FLACC sem dor; tratar tudo com analgésico deixa a causa real sem manejo.',
    'Em crianças com comprometimento cognitivo, o comportamento basal é atípico e o FLACC padrão erra — use a versão revisada, construída com a descrição dos pais sobre como aquela criança expressa dor.',
  ],
  referencias: [
    { texto: 'Merkel SI, Voepel-Lewis T, Shayevitz JR, Malviya S. The FLACC: a behavioral scale for scoring postoperative pain in young children. Pediatr Nurs. 1997;23(3):293-297.' },
    { texto: 'Lawrence J, Alcock D, McGrath P, et al. The development of a tool to assess neonatal pain (NIPS). Neonatal Netw. 1993;12(6):59-66.' },
    { texto: 'Committee on Fetus and Newborn and Section on Anesthesiology and Pain Medicine. Prevention and Management of Procedural Pain in the Neonate: An Update. Pediatrics. 2016;137(2):e20154271.' },
  ],
}

/* ═══════════ Febre no lactente de até 60 dias — AAP 2021 ═══════════ */

const febreLactenteCampos: Campo[] = [
  campoNum('idadeDias', 'Idade', { unidade: 'dias', min: 0, max: 90, passo: 1, ajuda: 'O algoritmo da AAP de 2021 vale de **8 a 60 dias** em recém-nascidos a termo e previamente hígidos. Abaixo de 8 dias, o lactente entra no protocolo de sepse neonatal precoce e recebe investigação completa e antibiótico sempre.' }),
  campoNum('temp', 'Temperatura retal máxima', { unidade: '°C', min: 37, max: 42, passo: 0.1, ajuda: 'Febre é definida como **temperatura retal de 38,0 °C ou mais**, aferida em casa ou no serviço. A retal é o padrão nessa faixa etária: a axilar e a timpânica não são confiáveis no lactente.' }),
  campoSimNao('aparencia', 'Aparência doente (toxemia)', 0, 'Irritabilidade que não cede ao colo, letargia, gemência, má perfusão, palidez ou moteamento, taquipneia, recusa alimentar importante. Aparência doente **encerra o algoritmo**: investigação completa, antibiótico e internação, em qualquer idade da faixa.'),
  campoSimNao('prematuro', 'Prematuridade (< 37 semanas), internação neonatal prévia ou comorbidade', 0, 'Qualquer um desses tira o lactente do algoritmo, que foi derivado e validado apenas em recém-nascidos a termo previamente hígidos.'),
  campoNum('pcr', 'PCR', { unidade: 'mg/L', min: 0, max: 400, passo: 0.1, opcional: true, ajuda: 'Marcador inflamatório do algoritmo, com corte de **20 mg/L**. Ele sobe mais lentamente que a procalcitonina e pode estar normal nas primeiras horas de uma infecção bacteriana invasiva.' }),
  campoNum('procalcitonina', 'Procalcitonina', { unidade: 'ng/mL', min: 0, max: 100, passo: 0.01, opcional: true, ajuda: 'O melhor marcador isolado do algoritmo, com corte de **0,5 ng/mL**. Sobe em 4 horas, antes da PCR, e discrimina melhor infecção bacteriana invasiva de doença viral.' }),
  campoNum('neutrofilos', 'Neutrófilos absolutos', { unidade: '/mm³', min: 0, max: 40000, passo: 100, opcional: true, ajuda: 'Corte de **4.000 a 5.200/mm³** conforme o serviço. Use a contagem absoluta de neutrófilos, e não o leucograma total, que discrimina pior.' }),
  campoSimNao('urinaliseAlterada', 'Urinálise alterada (esterase, nitrito ou piúria)', 0, 'A infecção urinária é a infecção bacteriana mais comum nessa faixa e, isoladamente, não exige punção lombar em lactentes acima de 21 dias com os demais marcadores normais.'),
]

const febreLactente: Ferramenta = {
  id: 'febre-lactente-60d',
  nome: 'Febre no lactente de até 60 dias (AAP 2021)',
  sinonimos: ['febre sem foco', 'lactente febril', 'rochester', 'filadelfia', 'aap 2021', 'sepse neonatal tardia'],
  resumo: 'Aplica o algoritmo da AAP por faixa etária e define quem precisa de punção lombar, antibiótico e internação.',
  categorias: ['pediatria', 'infectologia', 'emergencia'],
  campos: febreLactenteCampos,
  calcular: (v) => {
    const idade = num(v, 'idadeDias')
    const temp = num(v, 'temp')
    if (idade === null || temp === null) return null
    const doente = sim(v, 'aparencia')
    const foraDoAlgoritmo = sim(v, 'prematuro') || idade < 8 || idade > 60
    const febre = temp >= 38

    const pcr = num(v, 'pcr')
    const pct = num(v, 'procalcitonina')
    const neutro = num(v, 'neutrofilos')
    const urina = sim(v, 'urinaliseAlterada')

    // Qualquer marcador informado e acima do corte já eleva o risco. Marcador
    // não informado não conta como normal — a ausência dos três é tratada à
    // parte na interpretação, porque o algoritmo depende deles a partir do 22º dia.
    const marcadorAlterado =
      (pct !== null && pct > 0.5) || (pcr !== null && pcr > 20) || (neutro !== null && neutro > 4000)

    const semMarcadores = pct === null && pcr === null && neutro === null

    const faixa = idade <= 21 ? '8 a 21 dias' : idade <= 28 ? '22 a 28 dias' : '29 a 60 dias'
    const nivel: Nivel = doente || foraDoAlgoritmo || idade <= 21 ? 'critico' : marcadorAlterado ? 'alerta' : 'atencao'

    const interpretacao: string[] = []
    if (!febre) {
      interpretacao.push(`Temperatura de ${fmt(temp, 1)} °C está **abaixo do limiar de febre** (38,0 °C retal). O algoritmo se aplica a lactentes febris; sem febre documentada, a conduta é guiada pelo quadro clínico.`)
    }
    if (doente) {
      interpretacao.push('**Aparência doente encerra o algoritmo.** Investigação completa — hemograma, hemocultura, urinálise e urocultura, punção lombar com cultura —, antibiótico parenteral de amplo espectro e internação, em qualquer idade da faixa.')
    } else if (foraDoAlgoritmo) {
      interpretacao.push(
        idade < 8
          ? '**Abaixo de 8 dias, o algoritmo não se aplica.** Esse lactente entra no protocolo de **sepse neonatal precoce**, que considera fatores de risco maternos (colonização por estreptococo do grupo B, corioamnionite, ruptura prolongada de membranas, febre materna) e cuja conduta padrão é investigação completa com antibiótico.'
          : idade > 60
            ? 'Acima de 60 dias o algoritmo não se aplica. A conduta passa a ser guiada por foco identificável, estado vacinal e ferramentas como o UTICalc para infecção urinária.'
            : '**Prematuridade, internação neonatal prévia ou comorbidade excluem o lactente do algoritmo**, que foi derivado apenas em recém-nascidos a termo previamente hígidos. Trate como de maior risco: investigação completa e antibiótico.',
      )
    } else {
      interpretacao.push(`**Faixa de ${faixa}.** O algoritmo da AAP de 2021 divide os lactentes em três faixas, e a diferença entre elas está sobretudo em **quem precisa de punção lombar** e em quem pode ir para casa.`)
      if (idade <= 21) {
        interpretacao.push('**De 8 a 21 dias, todos recebem investigação completa** — hemograma, marcadores inflamatórios, hemocultura, urinálise e urocultura e **punção lombar** —, antibiótico parenteral e internação, independentemente do resultado dos marcadores. A prevalência de infecção bacteriana invasiva e de meningite nessa faixa é alta demais para estratificar.')
      } else if (idade <= 28) {
        interpretacao.push('**De 22 a 28 dias**, com marcadores inflamatórios normais e urinálise normal, a punção lombar passa a ser **opcional** — pode ser feita ou não conforme a avaliação. Com qualquer marcador alterado, ela é indicada, junto com antibiótico.')
      } else {
        interpretacao.push('**De 29 a 60 dias**, com todos os marcadores normais e urinálise normal, **a punção lombar não é indicada** e o lactente pode receber alta com reavaliação em 24 horas, desde que haja acompanhamento confiável. Com marcador alterado, punção lombar e antibiótico entram.')
      }
      if (semMarcadores) {
        interpretacao.push('Os marcadores inflamatórios não foram informados. O algoritmo depende deles a partir dos 22 dias — **procalcitonina acima de 0,5 ng/mL, PCR acima de 20 mg/L ou neutrófilos absolutos acima de 4.000 a 5.200/mm³** definem risco aumentado.')
      } else if (marcadorAlterado) {
        interpretacao.push('**Há marcador inflamatório alterado.** Isso eleva o risco de infecção bacteriana invasiva e indica punção lombar e antibiótico parenteral em qualquer faixa acima de 21 dias.')
      } else {
        interpretacao.push('Marcadores inflamatórios informados estão dentro dos limites, o que sustenta a estratificação de menor risco na faixa correspondente.')
      }
      if (urina) {
        interpretacao.push('**Urinálise alterada** aponta infecção urinária, que é a infecção bacteriana mais comum nessa faixa. Acima de 21 dias, com marcadores inflamatórios normais, ela **não obriga** punção lombar — mas exige urocultura colhida por sondagem ou punção suprapúbica e antibiótico.')
      }
    }
    interpretacao.push('A mudança conceitual de 2021 em relação aos critérios antigos (Rochester, Filadélfia, Boston) foi substituir o leucograma por **procalcitonina e PCR**, que discriminam melhor, e permitir explicitamente decisão compartilhada com a família na faixa intermediária.')

    const conduta: string[] = []
    if (doente || idade <= 21 || foraDoAlgoritmo) {
      conduta.push('**Investigação completa e antibiótico parenteral, com internação.** Hemograma, marcadores inflamatórios, hemocultura, urinálise e urocultura por sondagem ou punção suprapúbica, e punção lombar com cultura, celularidade, glicose, proteína e PCR viral.')
      conduta.push('**Ampicilina mais gentamicina** ou **ampicilina mais cefotaxima** cobrem os agentes desta faixa: estreptococo do grupo B, *Escherichia coli* e *Listeria monocytogenes*. Acrescente **aciclovir** diante de vesículas, convulsão, alteração hepática, pleocitose com cultura negativa, parto vaginal com lesão herpética materna ou aparência séptica — a encefalite herpética neonatal é rapidamente fatal e o tratamento empírico é barato em comparação ao desfecho.')
    } else if (marcadorAlterado) {
      conduta.push('**Marcador alterado: punção lombar e antibiótico parenteral**, com internação. Ceftriaxona é opção acima de 28 dias; abaixo disso, evite-a pelo risco de encefalopatia bilirrubínica por deslocamento da bilirrubina.')
    } else if (idade > 28) {
      conduta.push('**29 a 60 dias com marcadores e urinálise normais:** punção lombar dispensável, e a alta é possível com **reavaliação garantida em 24 horas** e comunicação clara com a família. Colha hemocultura e urocultura antes de liberar, e deixe o resultado sendo acompanhado.')
    } else {
      conduta.push('**22 a 28 dias com marcadores normais:** punção lombar opcional, e a decisão deve ser compartilhada com a família, explicando o risco residual. Se a punção não for feita, mantenha em observação hospitalar com hemocultura e urocultura em andamento.')
    }
    conduta.push(
      '**Colha as culturas antes da primeira dose de antibiótico.** Uma dose administrada antes negativa hemocultura e cultura de líquor e inviabiliza o diagnóstico etiológico por semanas.',
      'Pesquise **vírus** quando houver quadro compatível: painel respiratório, enterovírus no líquor (causa importante de meningite asséptica nessa faixa, sobretudo no verão) e herpes. Identificar o vírus encurta o antibiótico e a internação.',
      'Lembre que **bronquiolite ou outro quadro viral comprovado não exclui infecção bacteriana** no lactente muito jovem — a coinfecção com infecção urinária é bem documentada abaixo de 60 dias.',
      'Oriente a família com **precisão sobre sinais de retorno** e garanta que a reavaliação em 24 horas é realmente exequível. O algoritmo de alta pressupõe esse acompanhamento; sem ele, a estratificação não se sustenta.',
    )

    return {
      titulo: 'Febre no lactente de até 60 dias',
      valor: doente ? 'Investigação completa' : foraDoAlgoritmo ? 'Fora do algoritmo' : faixa,
      nivel,
      rotuloNivel: doente ? 'Aparência doente' : foraDoAlgoritmo ? 'Protocolo próprio' : idade <= 21 ? 'Investigação completa obrigatória' : marcadorAlterado ? 'Marcador alterado' : 'Menor risco',
      detalhes: [
        { rotulo: 'Idade', valor: `${fmtInt(idade)} dias`, nota: faixa },
        { rotulo: 'Temperatura retal', valor: `${fmt(temp, 1)} °C`, nivel: (febre ? 'alerta' : 'ok') as Nivel, nota: 'Febre ≥ 38,0 °C' },
        { rotulo: 'Aparência', valor: doente ? 'Doente' : 'Bem', nivel: (doente ? 'critico' : 'ok') as Nivel },
        ...(pct !== null ? [{ rotulo: 'Procalcitonina', valor: `${fmt(pct, 2)} ng/mL`, nivel: (pct > 0.5 ? 'alerta' : 'ok') as Nivel, nota: 'Corte 0,5' }] : []),
        ...(pcr !== null ? [{ rotulo: 'PCR', valor: `${fmt(pcr, 1)} mg/L`, nivel: (pcr > 20 ? 'alerta' : 'ok') as Nivel, nota: 'Corte 20' }] : []),
        ...(neutro !== null ? [{ rotulo: 'Neutrófilos absolutos', valor: `${fmtInt(neutro)}/mm³`, nivel: (neutro > 4000 ? 'alerta' : 'ok') as Nivel, nota: 'Corte 4.000-5.200' }] : []),
        { rotulo: 'Urinálise', valor: urina ? 'Alterada' : 'Normal', nivel: (urina ? 'alerta' : 'ok') as Nivel },
        { rotulo: 'Punção lombar', valor: doente || foraDoAlgoritmo || idade <= 21 || marcadorAlterado ? 'Indicada' : idade <= 28 ? 'Opcional' : 'Não indicada' },
      ],
      interpretacao,
      conduta,
      alertas: [
        '**Aparência doente encerra qualquer algoritmo.** Nenhum marcador normal autoriza tranquilizar um lactente toxemiado.',
        'Abaixo de **8 dias** o algoritmo não se aplica: é protocolo de sepse neonatal precoce, com investigação completa e antibiótico.',
        'Colha culturas **antes** do antibiótico. Uma dose prévia negativa hemocultura e líquor por semanas.',
        'Considere **aciclovir empírico** diante de vesículas, convulsão, alteração de transaminases, pleocitose com cultura negativa ou aparência séptica — a encefalite herpética neonatal mata rápido.',
      ],
    }
  },
  formula: [
    '8 a 21 dias: investigação completa com punção lombar, antibiótico e internação para todos',
    '22 a 28 dias: punção lombar opcional se marcadores e urinálise normais',
    '29 a 60 dias: punção lombar não indicada se marcadores e urinálise normais; alta possível com reavaliação em 24 h',
    'Marcadores: procalcitonina > 0,5 ng/mL · PCR > 20 mg/L · neutrófilos > 4.000-5.200/mm³',
  ],
  fundamento:
    'A febre sem foco no lactente de até 60 dias é um dos problemas mais antigos e mais estudados da pediatria de emergência, e sua dificuldade nasce de duas características do sistema imune nessa idade. A primeira é a **imaturidade da resposta imune**: a produção de anticorpos contra antígenos polissacarídicos é deficiente até os 2 anos, a função de opsonização e a atividade do complemento são reduzidas, e a reserva de neutrófilos medulares se esgota rapidamente — de modo que a bacteremia progride a sepse e a meningite com velocidade muito maior que no adulto. A segunda é a **ausência de sinais localizatórios**: o lactente não relata sintoma, e a resposta inflamatória local que produziria os sinais clássicos é limitada, o que faz com que meningite, pielonefrite e bacteremia se apresentem igualmente como "febre e nada mais". Os agentes refletem a transmissão perinatal e a colonização intestinal precoce — estreptococo do grupo B, *Escherichia coli* e *Listeria* —, e é essa etiologia que dita a escolha empírica. A evolução dos critérios ao longo de quarenta anos, de Rochester e Filadélfia até a AAP de 2021, foi na direção de substituir marcadores grosseiros por outros de melhor desempenho: o leucograma total, que discrimina mal, deu lugar à **procalcitonina**, que sobe em 4 horas e reflete especificamente a resposta bacteriana, e à PCR. Essa troca é o que permitiu poupar punções lombares na faixa de 29 a 60 dias sem perder meningites.',
  armadilhas: [
    'Febre aferida em casa por método confiável conta, mesmo que a criança chegue afebril — a ausência de febre no serviço não invalida o relato.',
    'Antitérmico administrado antes não muda a conduta: a resposta à medicação não distingue infecção bacteriana de viral.',
    'O algoritmo pressupõe recém-nascido a termo e previamente hígido; prematuridade e comorbidade exigem investigação mais agressiva.',
    'A alta em 29 a 60 dias depende de reavaliação garantida em 24 horas — sem esse acompanhamento, a estratificação não se sustenta.',
  ],
  referencias: [
    { texto: 'Pantell RH, Roberts KB, Adams WG, et al. Evaluation and Management of Well-Appearing Febrile Infants 8 to 60 Days Old. Pediatrics. 2021;148(2):e2021052228.' },
    { texto: 'Kuppermann N, Dayan PS, Levine DA, et al. A Clinical Prediction Rule to Identify Febrile Infants 60 Days and Younger at Low Risk for Serious Bacterial Infections. JAMA Pediatr. 2019;173(4):342-351.' },
    { texto: 'Jaskiewicz JA, McCarthy CA, Richardson AC, et al. Febrile infants at low risk for serious bacterial infection — an appraisal of the Rochester criteria. Pediatrics. 1994;94(3):390-396.' },
  ],
}

export const ferramentas: Ferramenta[] = [
  dosePediatrica,
  hidratacao,
  desidratacaoEscore,
  pesoEstimado,
  apgar,
  capurro,
  ballard,
  silverman,
  fototerapia,
  idadeCorrigida,
  percentis,
  glasgowPed,
  bronquiolite,
  anestesicoLocal,
  uticalc,
  westley,
  kocher,
  pecarn,
  tanner,
  dorPediatrica,
  febreLactente,
]

export default ferramentas

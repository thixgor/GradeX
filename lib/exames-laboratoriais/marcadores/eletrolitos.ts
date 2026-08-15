import type { Marcador } from '../tipos'

/**
 * Eletrólitos e minerais.
 *
 * A regra que atravessa todo este grupo: concentração plasmática não é
 * conteúdo corporal. O sódio informa sobre água, não sobre sal; o potássio
 * plasmático representa 2% do potássio do corpo; o cálcio total depende da
 * albumina. Quem lê o número sem essa distinção erra a conduta na direção
 * oposta — repõe sódio em quem tem água demais, e supõe hipocalcemia em quem
 * só tem albumina baixa.
 */
export const marcadores: Marcador[] = [
  {
    id: 'sodio',
    nome: 'Sódio',
    sigla: 'Na⁺',
    sinonimos: ['natremia', 'na', 'hiponatremia', 'hipernatremia'],
    grupo: 'eletrolitos',
    sistemas: ['renal', 'metabolico'],
    material: 'Soro ou plasma',
    unidade: 'mEq/L',
    referencias: [{ rotulo: 'Adultos', minimo: 135, maximo: 145, unidade: 'mEq/L' }],
    resumo:
      'O principal cátion extracelular — e, contra a intuição, um marcador de água, não de sal. Sódio baixo quase sempre significa água em excesso.',
    entenda:
      'A concentração de sódio é uma razão: quantidade de sódio dividida pela quantidade de água. O corpo regula essas duas grandezas por caminhos independentes — o sódio pela aldosterona e o volume, a água pela ADH e a sede. Por isso a natremia informa sobre o balanço de água livre, e o estado de volume informa sobre o balanço de sódio. Um paciente pode estar hipervolêmico e hiponatrêmico (insuficiência cardíaca), hipovolêmico e hiponatrêmico (perdas com reposição hipotônica), ou euvolêmico e hiponatrêmico (SIADH). São três doenças diferentes com o mesmo número.',
    aprofundar: [
      'A investigação da hiponatremia tem uma sequência que resolve quase todos os casos. Primeiro: a osmolalidade plasmática está baixa? Se não estiver, trata-se de pseudo-hiponatremia (hiperlipidemia, hiperproteinemia) ou de hiponatremia com osmolalidade normal ou alta (hiperglicemia, manitol) — em que a água foi puxada para o extracelular. Segundo: a osmolalidade urinária está baixa (< 100 mOsm/kg)? Se sim, o rim está excretando água livre corretamente e a causa é excesso de ingesta (polidipsia, potomania). Terceiro: qual é o estado de volume e o sódio urinário? Hipovolemia com sódio urinário baixo aponta perdas extrarrenais; euvolemia com sódio urinário alto e urina concentrada aponta SIADH.',
      'A velocidade de correção importa mais que o alvo. Na hiponatremia crônica, o cérebro adaptou-se exportando osmóis: corrigir rápido demais retira água do neurônio bruscamente e causa síndrome de desmielinização osmótica, muitas vezes irreversível. O limite habitual é de 8 a 10 mEq/L em 24 horas, ainda mais conservador em desnutridos, etilistas, hipocalêmicos e hepatopatas. Na hiponatremia aguda sintomática (convulsão, coma), a lógica se inverte: o risco é o edema cerebral, e salina hipertônica está indicada de imediato.',
      'A hiperglicemia produz hiponatremia verdadeira e apropriada: a glicose é osmoticamente ativa e puxa água do intracelular para o plasma, diluindo o sódio. A correção habitual soma 1,6 mEq/L ao sódio medido para cada 100 mg/dL de glicose acima de 100. Corrigir esse sódio "baixo" com salina, sem corrigir a glicemia, trata um problema que não existe.',
    ],
    fisiologia: {
      oQueE: 'Cátion monovalente predominante no líquido extracelular, principal determinante da osmolalidade plasmática.',
      origem: 'Ingestão dietética; distribuição controlada pela bomba Na⁺/K⁺-ATPase.',
      funcao: 'Determinar a osmolalidade e, portanto, a distribuição de água entre os compartimentos; gerar o potencial de membrana e permitir o transporte acoplado de glicose e aminoácidos.',
      eliminacao: 'Renal, regulada pela aldosterona, pelos peptídeos natriuréticos e pela pressão de perfusão.',
      orgaosEnvolvidos: ['Rim', 'Hipotálamo (ADH e sede)', 'Adrenal (aldosterona)', 'Coração (peptídeos natriuréticos)'],
      percurso: ['Osmorreceptores hipotalâmicos', 'ADH e sede', 'reabsorção de água no ducto coletor', 'concentração plasmática de sódio'],
    },
    aumento: {
      resumo: 'Hipernatremia é sempre déficit de água livre — por perda de água ou por falta de acesso a ela.',
      significado:
        'Hipernatremia significa hiperosmolaridade: a água sai da célula, incluindo o neurônio. Em adulto consciente com sede preservada e acesso à água, ela praticamente não ocorre — sua presença aponta para alguém que não pode beber ou não sente sede.',
      mecanismos: [
        {
          titulo: 'Perda de água livre',
          explicacao: 'Perde-se mais água que sódio, e a concentração sobe.',
          exemplos: [
            { causa: 'Diabetes insipidus central ou nefrogênico', etapas: ['ADH ausente ou rim que não responde a ela', 'perda de água livre pela urina', 'urina diluída com hipernatremia'], nota: 'Poliúria com urina de baixa densidade e sódio plasmático alto: o par que define o quadro.' },
            { causa: 'Diurese osmótica (hiperglicemia, manitol, alta carga proteica)', etapas: ['soluto osmoticamente ativo no túbulo', 'arraste de água', 'perda de água livre'] },
            { causa: 'Perdas insensíveis aumentadas (febre, queimadura, taquipneia, calor)', etapas: ['perda de água sem sódio', 'hipernatremia se não houver reposição'] },
            { causa: 'Diarreia e vômitos', etapas: ['perdas hipotônicas', 'perde-se mais água que sódio', 'hipernatremia'] },
          ],
        },
        {
          titulo: 'Falta de acesso à água',
          explicacao: 'O mecanismo da sede é a defesa mais eficaz contra hipernatremia. Quando ele falha ou não pode ser atendido, ela se instala.',
          exemplos: [{ causa: 'Idoso acamado, lactente, paciente sedado ou com rebaixamento de consciência', etapas: ['sede ausente ou não atendida', 'perdas mantidas sem reposição', 'hipernatremia'], nota: 'É a causa mais comum de hipernatremia hospitalar.' }],
        },
        {
          titulo: 'Ganho de sódio',
          explicacao: 'Raro, e quase sempre iatrogênico.',
          exemplos: [{ causa: 'Salina hipertônica, bicarbonato de sódio, hiperaldosteronismo', etapas: ['carga de sódio ↑', 'hipernatremia com expansão volêmica'] }],
        },
      ],
    },
    reducao: {
      resumo: 'Hiponatremia é quase sempre excesso de água livre. O estado de volume e a osmolalidade urinária dizem por quê.',
      significado:
        'A hiponatremia desloca água para dentro da célula. No cérebro, isso é edema — e a gravidade dos sintomas depende muito mais da velocidade de instalação que do valor.',
      mecanismos: [
        {
          titulo: 'Hiponatremia hipovolêmica',
          explicacao: 'Perdeu-se sódio e água, e a reposição foi hipotônica. A hipovolemia estimula a ADH mesmo à custa da osmolalidade — o corpo prioriza volume sobre concentração.',
          exemplos: [
            { causa: 'Vômitos, diarreia, diuréticos tiazídicos, perdas para terceiro espaço', etapas: ['perda de sódio e água', 'hipovolemia', 'ADH ↑ apesar da hipo-osmolalidade', 'retenção de água livre', 'hiponatremia'], nota: 'Tiazídico é a causa medicamentosa mais comum de hiponatremia — atua no túbulo distal e não prejudica a capacidade de concentração.' },
            { causa: 'Insuficiência adrenal', etapas: ['aldosterona ↓ e cortisol ↓', 'perda renal de sódio e perda da supressão da ADH', 'hiponatremia com hipercalemia'], nota: 'Hiponatremia com hipercalemia e eosinofilia deve sugerir insuficiência adrenal.' },
          ],
        },
        {
          titulo: 'Hiponatremia euvolêmica — SIADH',
          explicacao: 'A ADH é secretada apesar de a osmolalidade estar baixa. O rim retém água livre, e a urina permanece inapropriadamente concentrada.',
          exemplos: [
            { causa: 'Neoplasias (sobretudo pulmão de pequenas células), doenças do SNC, pneumopatias, fármacos (ISRS, carbamazepina, antipsicóticos)', etapas: ['secreção inapropriada de ADH', 'retenção de água livre', 'hiponatremia euvolêmica com osmolalidade urinária > 100 mOsm/kg e sódio urinário > 40 mEq/L'], nota: 'Ácido úrico baixo reforça o diagnóstico; função tireoidiana e adrenal precisam ser normais para firmá-lo.' },
            { causa: 'Hipotireoidismo grave', etapas: ['débito cardíaco ↓ e clearance de água livre ↓', 'hiponatremia'] },
          ],
        },
        {
          titulo: 'Hiponatremia hipervolêmica',
          explicacao: 'Há sódio e água em excesso no corpo, mas o volume arterial efetivo está reduzido — e isso ativa a ADH. Retém-se proporcionalmente mais água que sódio.',
          exemplos: [
            { causa: 'Insuficiência cardíaca, cirrose com ascite, síndrome nefrótica', etapas: ['volume arterial efetivo ↓ apesar do edema', 'ADH e SRAA ↑', 'retenção de água > retenção de sódio', 'hiponatremia com edema'], nota: 'Na insuficiência cardíaca, a hiponatremia é marcador prognóstico independente.' },
            { causa: 'Doença renal avançada', etapas: ['incapacidade de excretar água livre', 'hiponatremia'] },
          ],
        },
        {
          titulo: 'Excesso de ingesta e pseudo-hiponatremia',
          explicacao: 'Ou entrou água demais para o rim excretar, ou o sódio não está realmente baixo.',
          exemplos: [
            { causa: 'Polidipsia psicogênica, potomania do bebedor de cerveja', etapas: ['ingesta de água excede a capacidade de excreção', 'osmolalidade urinária < 100 mOsm/kg', 'hiponatremia'], nota: 'Urina maximamente diluída é o achado que separa este grupo do SIADH.' },
            { causa: 'Hipertrigliceridemia grave, hiperproteinemia (mieloma)', etapas: ['fase sólida do plasma aumentada', 'artefato do método indireto de fotometria de chama', 'sódio falsamente baixo com osmolalidade normal'], nota: 'Pseudo-hiponatremia: a osmolalidade medida é normal. Métodos com eletrodo direto não sofrem esse erro.' },
            { causa: 'Hiperglicemia grave, manitol', etapas: ['soluto osmoticamente ativo no extracelular', 'água sai da célula', 'hiponatremia verdadeira com osmolalidade alta'], nota: 'Corrigir somando 1,6 mEq/L por 100 mg/dL de glicose acima de 100.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['Diuréticos tiazídicos', 'SIADH', 'Insuficiência cardíaca e cirrose'],
        comuns: ['Vômitos e diarreia', 'Hiperglicemia', 'Fármacos psiquiátricos'],
        menosComuns: ['Insuficiência adrenal', 'Polidipsia psicogênica', 'Hipotireoidismo grave'],
        naoEsquecer: ['Pseudo-hiponatremia por hipertrigliceridemia ou mieloma', 'Neoplasia oculta como causa de SIADH'],
        emergencias: ['Hiponatremia aguda sintomática (convulsão, coma)', 'Correção rápida demais, com risco de desmielinização osmótica'],
      },
    },
    comparacoes: [
      {
        id: 'hiponatremia-por-volemia',
        titulo: 'Hiponatremia: hipovolêmica × euvolêmica (SIADH) × hipervolêmica',
        pergunta: 'O sódio está baixo. Falta volume, sobra hormônio, ou sobra água e sal juntos?',
        hipoteses: ['Hipovolêmica', 'Euvolêmica (SIADH)', 'Hipervolêmica'],
        linhas: [
          { marcador: 'Exame clínico', celulas: ['desidratado', 'euvolêmico', 'edemaciado'] },
          { marcador: 'Sódio urinário', celulas: ['< 20 (perda extrarrenal)', '> 40', '< 20'] },
          { marcador: 'Osmolalidade urinária', celulas: ['> 300', '> 100 (inapropriadamente alta)', '> 300'] },
          { marcador: 'Ácido úrico', celulas: ['normal ou ↑', '↓', 'normal ou ↑'] },
          { marcador: 'Ureia', celulas: ['↑', '↓ ou normal', '↑'] },
          { marcador: 'Tratamento', celulas: ['salina isotônica', 'restrição hídrica', 'restrição de água e sal + diurético'] },
        ],
        leitura:
          'Os três grupos compartilham a ADH elevada — o que muda é o motivo. Na hipovolemia ela é apropriada (o corpo escolhe volume em vez de osmolalidade) e vem com ureia e ácido úrico altos, marcas da avidez tubular. No SIADH ela é inapropriada, sem estímulo volêmico: a expansão discreta faz o rim excretar sódio e urato, e por isso ácido úrico e ureia ficam baixos. Na hipervolêmica, o volume total está aumentado mas o arterial efetivo caiu, e o resultado bioquímico se parece com o da hipovolemia, com o paciente edemaciado à beira do leito.',
        limites: 'Uso de diurético invalida o sódio urinário. Avaliação de volemia é a etapa mais subjetiva e a que mais erra — na dúvida, uma prova de volume com salina isotônica separa hipovolemia de SIADH pela resposta.',
      },
    ],
    relacionados: [
      { titulo: 'Para investigar hiponatremia', ids: ['osmolalidade-urinaria', 'sodio-urinario', 'acido-urico', 'ureia'], leitura: 'Osmolalidade urinária separa excesso de ingesta de retenção de água; sódio urinário e ácido úrico separam SIADH de hipovolemia.' },
      { titulo: 'Antes de fechar SIADH', ids: ['tsh', 'cortisol'], leitura: 'Hipotireoidismo e insuficiência adrenal produzem hiponatremia e precisam ser excluídos — o diagnóstico de SIADH é de exclusão.' },
    ],
    interferentes: {
      preAnalitico: ['Coleta em membro com infusão de soro altera grosseiramente o resultado.'],
      metodo: ['Métodos indiretos (potenciometria com diluição) sofrem pseudo-hiponatremia em hiperlipidemia e hiperproteinemia; o eletrodo direto, não.'],
      medicamentos: ['Tiazídicos, ISRS, carbamazepina, antipsicóticos, AINEs e desmopressina causam hiponatremia; lítio e demeclociclina causam diabetes insipidus nefrogênico.'],
    },
    normalizacao: [
      { cenario: 'Hiponatremia hipovolêmica', caminho: 'Repor volume com salina isotônica. Restaurada a volemia, a ADH cai sozinha e o rim excreta a água livre retida — o sódio pode subir rápido demais nessa hora, e é aí que a correção precisa ser vigiada.', prazo: 'Horas; monitorar para não ultrapassar 8 a 10 mEq/L em 24h.' },
      { cenario: 'SIADH', caminho: 'Restrição hídrica e tratamento da causa (fármaco, neoplasia, doença do SNC). Repor salina isotônica pode paradoxalmente piorar, porque o rim excreta o sódio e retém a água.', prazo: 'Dias.' },
      { cenario: 'Hiponatremia da insuficiência cardíaca e da cirrose', caminho: 'Melhorar o volume arterial efetivo tratando a doença de base, com restrição de água e sal. O sódio é marcador da gravidade — o alvo é a doença.', prazo: 'Acompanha a compensação clínica.' },
    ],
    utilidade: ['diagnostico', 'prognostico', 'acompanhamento'],
    padroes: ['siadh'],
    estudarTambem: ['potassio', 'osmolalidade-urinaria', 'sodio-urinario', 'cortisol'],
  },

  {
    id: 'potassio',
    nome: 'Potássio',
    sigla: 'K⁺',
    sinonimos: ['calemia', 'k', 'hipercalemia', 'hipocalemia', 'hipopotassemia'],
    grupo: 'eletrolitos',
    sistemas: ['renal', 'cardiovascular'],
    material: 'Soro ou plasma',
    unidade: 'mEq/L',
    referencias: [{ rotulo: 'Adultos', minimo: 3.5, maximo: 5.0, unidade: 'mEq/L', observacao: 'O soro tem valores discretamente mais altos que o plasma, pela liberação plaquetária durante a coagulação.' }],
    resumo:
      'O principal cátion intracelular. Apenas 2% do potássio corporal está no plasma — e é justamente esse 2% que determina a excitabilidade cardíaca.',
    entenda:
      'O gradiente de potássio entre o interior e o exterior da célula define o potencial de repouso da membrana. Alterações pequenas na concentração plasmática produzem efeitos cardíacos grandes, e é por isso que o potássio é um dos poucos exames em que o valor isolado pode indicar tratamento imediato. A concentração depende de duas coisas independentes: o balanço externo (o que entra pela dieta e sai pelo rim) e a distribuição interna entre os compartimentos, regulada por insulina, catecolaminas e pH.',
    aprofundar: [
      'Todo distúrbio de potássio exige separar redistribuição de déficit ou excesso corporal, porque a conduta é oposta. Na cetoacidose diabética, o potássio plasmático costuma estar normal ou alto — a acidose e a falta de insulina o tiraram da célula — enquanto o potássio corporal total está gravemente depletado pela diurese osmótica. Iniciar insulina sem repor potássio joga o íon de volta para dentro da célula e produz hipocalemia grave. O inverso vale na paralisia periódica hipocalêmica: o potássio corporal é normal, e repor demais causa hipercalemia de rebote.',
      'A hipomagnesemia é a causa mais negligenciada de hipocalemia refratária. O magnésio inibe os canais ROMK do túbulo coletor; sem ele, o rim perde potássio continuamente e nenhuma reposição sustenta o nível. Hipocalemia que não corrige apesar de reposição adequada tem uma pergunta obrigatória: qual é o magnésio?',
      'As alterações eletrocardiográficas da hipercalemia seguem uma progressão razoavelmente previsível — ondas T apiculadas, achatamento e desaparecimento da onda P, alargamento do QRS e, por fim, padrão sinusoidal e assistolia. Mas a correlação com o valor é imperfeita, e a velocidade de instalação pesa mais que o número: um dialítico crônico tolera 6,5 mEq/L que mataria alguém que chegou lá em horas. Por isso a decisão de tratar é clínica e eletrocardiográfica, não puramente laboratorial.',
    ],
    fisiologia: {
      oQueE: 'Principal cátion intracelular: 98% do potássio corporal está dentro das células, sobretudo musculares.',
      origem: 'Dieta (frutas, verduras, leguminosas, carnes).',
      funcao: 'Estabelecer o potencial de repouso da membrana e, com isso, governar a excitabilidade de músculo cardíaco, esquelético e neurônios.',
      metabolismo: 'A distribuição entre compartimentos é regulada pela Na⁺/K⁺-ATPase, estimulada por insulina, catecolaminas beta-2 e alcalose.',
      eliminacao: '90% renal, sob controle da aldosterona no túbulo coletor; 10% intestinal, fração que cresce na doença renal crônica.',
      orgaosEnvolvidos: ['Rim', 'Adrenal (aldosterona)', 'Músculo (reservatório)', 'Pâncreas (insulina)', 'Intestino'],
      percurso: ['Dieta', 'absorção intestinal', 'distribuição intra/extracelular (insulina, catecolaminas, pH)', 'secreção no túbulo coletor sob aldosterona', 'urina'],
    },
    aumento: {
      resumo: 'Excreta-se pouco, sai da célula, ou o exame está errado. Pseudo-hipercalemia é a primeira hipótese diante de valor alto sem contexto.',
      significado: 'Hipercalemia despolariza parcialmente a membrana, inativa canais de sódio e reduz a excitabilidade — o risco é bradiarritmia, bloqueio e assistolia.',
      mecanismos: [
        {
          titulo: 'Excreção renal reduzida',
          explicacao: 'A secreção de potássio ocorre no túbulo coletor e depende de fluxo distal, aldosterona e integridade tubular.',
          exemplos: [
            { causa: 'Doença renal aguda ou crônica avançada', etapas: ['TFG ↓', 'fluxo distal ↓', 'secreção de potássio ↓', 'hipercalemia'], nota: 'Costuma tornar-se problema com TFG abaixo de 20 a 30 mL/min, salvo se houver oligúria.' },
            { causa: 'IECA, BRA, espironolactona, AINEs, heparina, trimetoprima', etapas: ['bloqueio do eixo renina-angiotensina-aldosterona ou dos canais de sódio distais', 'secreção de potássio ↓', 'hipercalemia'], nota: 'É a causa mais frequente em ambulatório — e a combinação IECA + espironolactona + AINE é especialmente perigosa.' },
            { causa: 'Insuficiência adrenal e acidose tubular renal tipo 4', etapas: ['aldosterona ausente ou ineficaz', 'secreção distal comprometida', 'hipercalemia com acidose metabólica hiperclorêmica'], nota: 'Frequente no diabético com nefropatia (hipoaldosteronismo hiporreninêmico).' },
          ],
        },
        {
          titulo: 'Saída do potássio da célula',
          explicacao: 'O potássio corporal total pode estar normal, mas ele migrou para o extracelular.',
          exemplos: [
            { causa: 'Acidose metabólica', etapas: ['excesso de H⁺ entra na célula', 'K⁺ sai em troca', 'hipercalemia com déficit corporal possível'] },
            { causa: 'Deficiência de insulina (cetoacidose diabética)', etapas: ['sem insulina, a Na⁺/K⁺-ATPase trabalha menos', 'K⁺ permanece fora', 'hipercalemia com depleção corporal total'], nota: 'Iniciar insulina sem prever a queda do potássio é um erro clássico.' },
            { causa: 'Betabloqueadores, digoxina em intoxicação, exercício extenuante', etapas: ['redução da captação celular de potássio', 'hipercalemia'] },
          ],
        },
        {
          titulo: 'Liberação por destruição celular',
          explicacao: 'A célula rompida despeja seu conteúdo — e ela é rica em potássio.',
          exemplos: [
            { causa: 'Rabdomiólise, hemólise maciça, síndrome de lise tumoral, grandes queimados', etapas: ['destruição celular maciça', 'liberação de K⁺, fósforo e ácido úrico', 'hipercalemia com CK ou LDH ↑'], nota: 'Na lise tumoral, hipercalemia, hiperfosfatemia, hiperuricemia e hipocalcemia aparecem juntas.' },
          ],
        },
        {
          titulo: 'Pseudo-hipercalemia',
          explicacao: 'O potássio saiu das células dentro do tubo, não dentro do paciente.',
          exemplos: [
            { causa: 'Hemólise da amostra, garrote prolongado, punho cerrado durante a coleta, trombocitose ou leucocitose extremas, demora no processamento', etapas: ['liberação in vitro de potássio celular', 'valor falsamente alto'], nota: 'Hipercalemia inesperada em paciente assintomático e com ECG normal: recolher antes de tratar.' },
          ],
        },
      ],
      causas: {
        muitoComuns: ['IECA/BRA e espironolactona', 'Doença renal crônica', 'Pseudo-hipercalemia por hemólise'],
        comuns: ['Acidose metabólica', 'AINEs', 'Cetoacidose diabética'],
        menosComuns: ['Insuficiência adrenal', 'Acidose tubular renal tipo 4'],
        naoEsquecer: ['Trimetoprima e heparina como causa medicamentosa esquecida'],
        emergencias: ['Hipercalemia com alteração eletrocardiográfica', 'Síndrome de lise tumoral', 'Rabdomiólise'],
      },
    },
    reducao: {
      resumo: 'Perde-se (rim ou trato digestivo), entra na célula, ou não se ingere. E, se não corrige, o problema costuma ser o magnésio.',
      significado: 'A hipocalemia hiperpolariza a membrana e prolonga a repolarização: risco de arritmia ventricular, sobretudo em uso de digoxina ou com QT longo.',
      mecanismos: [
        {
          titulo: 'Perda renal',
          explicacao: 'O aumento do fluxo distal e do estímulo mineralocorticoide aceleram a secreção de potássio.',
          exemplos: [
            { causa: 'Diuréticos tiazídicos e de alça', etapas: ['aumento da oferta distal de sódio', 'troca Na⁺/K⁺ acelerada no coletor', 'caliurese', 'hipocalemia'], nota: 'A causa mais frequente na prática.' },
            { causa: 'Hiperaldosteronismo primário', etapas: ['aldosterona autônoma', 'reabsorção de sódio e secreção de potássio ↑', 'hipocalemia com hipertensão e alcalose metabólica'], nota: 'Hipertensão com hipocalemia espontânea pede dosagem de aldosterona e renina.' },
            { causa: 'Síndrome de Cushing, vômitos com alcalose, acidose tubular renal tipos 1 e 2, anfotericina B', etapas: ['perda renal de potássio por mecanismos diversos', 'hipocalemia'] },
          ],
        },
        {
          titulo: 'Perda digestiva',
          explicacao: 'O conteúdo intestinal é rico em potássio; o gástrico, menos — nos vômitos, a perda é sobretudo renal, secundária à alcalose.',
          exemplos: [
            { causa: 'Diarreia, fístulas, laxantes, adenoma viloso', etapas: ['perda intestinal direta de potássio', 'hipocalemia com acidose metabólica hiperclorêmica'] },
            { causa: 'Vômitos e aspiração gástrica', etapas: ['alcalose metabólica e hipovolemia', 'aldosterona ↑ e bicarbonatúria', 'caliurese', 'hipocalemia com alcalose'], nota: 'A perda de potássio no vômito é pequena: quem o elimina é o rim.' },
          ],
        },
        {
          titulo: 'Redistribuição para dentro da célula',
          explicacao: 'O potássio corporal é normal; ele apenas mudou de compartimento.',
          exemplos: [
            { causa: 'Insulina, beta-2-agonistas, alcalose, refeeding syndrome', etapas: ['estímulo da Na⁺/K⁺-ATPase', 'entrada de K⁺ na célula', 'hipocalemia sem déficit corporal'], nota: 'Na síndrome de realimentação, potássio, fósforo e magnésio caem juntos e podem ser fatais.' },
            { causa: 'Paralisia periódica hipocalêmica, tireotoxicose', etapas: ['entrada maciça de potássio na célula', 'paralisia flácida aguda com potássio muito baixo'], nota: 'Repor com cautela: o potássio retorna ao extracelular na resolução do episódio.' },
          ],
        },
        {
          titulo: 'Hipomagnesemia associada',
          explicacao: 'Sem magnésio, o canal ROMK do túbulo coletor fica desinibido e o rim perde potássio continuamente.',
          exemplos: [{ causa: 'Hipomagnesemia (diuréticos, álcool, inibidores de bomba de prótons, diarreia crônica)', etapas: ['magnésio ↓', 'desinibição do ROMK', 'perda renal de potássio mantida', 'hipocalemia refratária à reposição'], nota: 'Toda hipocalemia que não corrige exige dosar magnésio.' }],
        },
      ],
      causas: {
        muitoComuns: ['Diuréticos', 'Diarreia e vômitos', 'Beta-2-agonistas'],
        comuns: ['Hipomagnesemia', 'Insulina', 'Alcalose metabólica'],
        menosComuns: ['Hiperaldosteronismo primário', 'Acidose tubular renal', 'Síndrome de Bartter e de Gitelman'],
        naoEsquecer: ['Hipomagnesemia na hipocalemia refratária', 'Síndrome de realimentação'],
        emergencias: ['Hipocalemia grave (< 2,5 mEq/L) com arritmia ou paralisia', 'Hipocalemia em uso de digoxina'],
      },
    },
    relacionados: [
      { titulo: 'Sempre junto', ids: ['magnesio', 'bicarbonato', 'creatinina'], leitura: 'Magnésio explica hipocalemia refratária; o pH explica redistribuição; a creatinina explica retenção. Nenhum distúrbio de potássio se interpreta sem esses três.' },
      { titulo: 'Se houver hipertensão associada', ids: ['aldosterona'], leitura: 'Hipocalemia espontânea com hipertensão sugere hiperaldosteronismo primário — a relação aldosterona/renina é o rastreio.' },
    ],
    interferentes: {
      preAnalitico: ['Hemólise, garrote prolongado, punho cerrado, demora no processamento e refrigeração da amostra elevam falsamente.', 'Trombocitose e leucocitose extremas elevam o potássio sérico (não o plasmático).'],
      medicamentos: ['IECA/BRA, espironolactona, AINEs, heparina e trimetoprima elevam; diuréticos, beta-2-agonistas, insulina e anfotericina reduzem.'],
    },
    normalizacao: [
      { cenario: 'Hipercalemia por medicamento', caminho: 'Suspender ou ajustar o agente, corrigir acidose e volemia. Em emergência, a sequência é estabilizar a membrana (gluconato de cálcio), redistribuir (insulina com glicose, beta-2) e remover (diurético, resina, diálise).', prazo: 'Minutos a horas na emergência; dias no ajuste ambulatorial.' },
      { cenario: 'Hipocalemia por diurético', caminho: 'Repor potássio e corrigir o magnésio junto. Considerar diurético poupador ou ajuste de dose se recorrente.', prazo: 'Dias — a reposição do estoque corporal é lenta.' },
      { cenario: 'Hipocalemia por redistribuição', caminho: 'Tratar a causa (retirar o beta-2-agonista, corrigir a alcalose, tratar a tireotoxicose). Repor com cautela: o potássio volta ao plasma quando o estímulo cessa.', prazo: 'Horas.' },
    ],
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['lesao-renal-aguda', 'cetoacidose-diabetica'],
    estudarTambem: ['magnesio', 'creatinina', 'bicarbonato', 'aldosterona'],
  },

  {
    id: 'calcio',
    nome: 'Cálcio total',
    sigla: 'Ca',
    sinonimos: ['calcemia', 'calcio serico', 'hipercalcemia', 'hipocalcemia'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 8.5, maximo: 10.5, unidade: 'mg/dL', observacao: 'Corrigir pela albumina: somar 0,8 mg/dL para cada 1,0 g/dL de albumina abaixo de 4,0 g/dL.' }],
    resumo:
      'Cerca de metade circula ligada à albumina e metade está livre. O cálcio total engana em toda alteração de albumina — o ionizado é o que age.',
    entenda:
      'O cálcio plasmático divide-se em três frações: ionizado (~50%, biologicamente ativo), ligado à albumina (~40%) e complexado a ânions (~10%). Como o laboratório costuma dosar o total, qualquer queda de albumina derruba o resultado sem que o cálcio ativo tenha mudado — situação corriqueira em internados, cirróticos e nefróticos. A correção pela albumina resolve a maioria dos casos; em situações críticas, o correto é dosar o cálcio ionizado diretamente.',
    aprofundar: [
      'Diante de hipercalcemia verdadeira, o PTH divide o diagnóstico em dois grupos que quase não se sobrepõem. PTH alto ou inapropriadamente normal: hiperparatireoidismo primário — a causa mais comum no ambulatório, tipicamente assintomática e descoberta por acaso. PTH suprimido: a hipercalcemia é PTH-independente, e o diferencial passa a ser malignidade (a causa mais comum no hospital, por PTHrP, metástases líticas ou linfoma produtor de calcitriol), intoxicação por vitamina D, doenças granulomatosas, hipertireoidismo, imobilização prolongada e fármacos.',
      'O pH altera a fração ionizada sem alterar o total. A alcalose aumenta a ligação do cálcio à albumina e reduz o cálcio ionizado — é por isso que a hiperventilação causa parestesias periorais e espasmo carpopedal com cálcio total perfeitamente normal. A acidose faz o inverso. Em paciente com distúrbio ácido-base, o cálcio total é particularmente enganoso.',
    ],
    fisiologia: {
      oQueE: 'Cátion divalente essencial, 99% depositado no osso como hidroxiapatita e 1% distribuído entre plasma e líquido intracelular.',
      origem: 'Dieta, com absorção intestinal dependente de vitamina D; o osso funciona como reservatório.',
      funcao: 'Contração muscular, acoplamento excitação-contração no miocárdio, liberação de neurotransmissores, coagulação (fator IV), mineralização óssea e sinalização intracelular.',
      metabolismo: 'Regulado pelo PTH (que aumenta a reabsorção óssea, a reabsorção tubular renal e a ativação da vitamina D) e pelo calcitriol (que aumenta a absorção intestinal).',
      eliminacao: 'Renal, com reabsorção tubular estimulada pelo PTH; e intestinal.',
      orgaosEnvolvidos: ['Paratireoides', 'Osso', 'Rim', 'Intestino', 'Fígado e rim (ativação da vitamina D)'],
      percurso: ['Cálcio ionizado baixo', 'sensor de cálcio da paratireoide', 'PTH ↑', 'reabsorção óssea, reabsorção tubular e calcitriol ↑', 'cálcio plasmático normaliza'],
    },
    aumento: {
      resumo: 'Hiperparatireoidismo (PTH alto) ou causas PTH-independentes, com malignidade à frente. O PTH é a primeira bifurcação.',
      mecanismos: [
        {
          titulo: 'Excesso de PTH',
          explicacao: 'O PTH mobiliza cálcio do osso, aumenta sua reabsorção renal e ativa a vitamina D — três frentes elevando a calcemia.',
          exemplos: [
            { causa: 'Hiperparatireoidismo primário (adenoma de paratireoide)', etapas: ['secreção autônoma de PTH', 'reabsorção óssea e tubular ↑', 'hipercalcemia com fósforo baixo e PTH alto'], nota: 'Cálcio alto com fósforo baixo é a assinatura: o PTH é fosfatúrico.' },
            { causa: 'Hipercalcemia hipocalciúrica familiar', etapas: ['mutação do receptor sensor de cálcio', 'set point deslocado', 'hipercalcemia leve com calciúria baixa e PTH normal-alto'], nota: 'Benigna: a relação cálcio/creatinina urinária baixa a distingue do hiperparatireoidismo e evita paratireoidectomia desnecessária.' },
          ],
        },
        {
          titulo: 'Hipercalcemia da malignidade',
          explicacao: 'O tumor mobiliza cálcio do osso por três vias diferentes — e em todas o PTH está suprimido.',
          exemplos: [
            { causa: 'Secreção de PTHrP (pulmão escamoso, mama, rim)', etapas: ['PTHrP mimetiza o PTH nos receptores ósseos e renais', 'reabsorção óssea ↑', 'hipercalcemia com PTH suprimido'], nota: 'É a causa mais comum de hipercalcemia hospitalar e marca doença avançada.' },
            { causa: 'Metástases osteolíticas e mieloma múltiplo', etapas: ['ativação local de osteoclastos', 'liberação de cálcio ósseo', 'hipercalcemia'] },
            { causa: 'Linfomas produtores de calcitriol', etapas: ['1-alfa-hidroxilase ectópica', 'calcitriol ↑', 'absorção intestinal de cálcio ↑'] },
          ],
        },
        {
          titulo: 'Excesso de vitamina D e granulomatoses',
          explicacao: 'A absorção intestinal de cálcio aumenta por excesso de calcitriol.',
          exemplos: [{ causa: 'Intoxicação por vitamina D, sarcoidose, tuberculose, histoplasmose', etapas: ['produção extrarrenal de calcitriol pelo macrófago do granuloma', 'absorção intestinal ↑', 'hipercalcemia com PTH suprimido'] }],
        },
        {
          titulo: 'Outras causas',
          explicacao: 'Aumento do turnover ósseo ou redução da excreção.',
          exemplos: [{ causa: 'Hipertireoidismo, imobilização prolongada, tiazídicos, lítio, síndrome leite-álcali', etapas: ['reabsorção óssea ↑ ou excreção renal ↓', 'hipercalcemia'] }],
        },
      ],
      causas: {
        muitoComuns: ['Hiperparatireoidismo primário (ambulatório)', 'Malignidade (hospital)'],
        comuns: ['Tiazídicos', 'Intoxicação por vitamina D'],
        menosComuns: ['Sarcoidose', 'Hipertireoidismo', 'Lítio'],
        naoEsquecer: ['Hipercalcemia hipocalciúrica familiar antes de indicar cirurgia'],
        emergencias: ['Cálcio > 14 mg/dL com rebaixamento de consciência, desidratação e arritmia'],
      },
    },
    reducao: {
      resumo: 'Antes de tudo: é hipoalbuminemia? Se não for, o eixo é PTH, vitamina D, magnésio ou quelação.',
      mecanismos: [
        {
          titulo: 'Pseudo-hipocalcemia por hipoalbuminemia',
          explicacao: 'O cálcio ligado caiu; o ionizado está normal. Não há distúrbio a tratar.',
          exemplos: [{ causa: 'Cirrose, síndrome nefrótica, desnutrição, doença crítica', etapas: ['albumina ↓', 'fração ligada ↓', 'cálcio total ↓ com ionizado normal'], nota: 'Corrigir pela fórmula ou dosar o ionizado antes de repor cálcio.' }],
        },
        {
          titulo: 'Deficiência ou resistência ao PTH',
          explicacao: 'Sem PTH, o cálcio não é mobilizado do osso nem reabsorvido no túbulo, e o fósforo se acumula.',
          exemplos: [
            { causa: 'Hipoparatireoidismo pós-tireoidectomia', etapas: ['remoção ou lesão das paratireoides', 'PTH ↓', 'hipocalcemia com hiperfosfatemia'], nota: 'Complicação clássica: parestesias e tetania nas primeiras 24 a 72 horas do pós-operatório.' },
            { causa: 'Hipomagnesemia', etapas: ['magnésio necessário para a secreção e a ação do PTH', 'PTH ↓ e resistência periférica', 'hipocalcemia refratária'], nota: 'Não corrige enquanto o magnésio não for reposto.' },
          ],
        },
        {
          titulo: 'Deficiência de vitamina D',
          explicacao: 'Sem calcitriol, a absorção intestinal de cálcio cai e o PTH sobe para compensar.',
          exemplos: [{ causa: 'Deficiência nutricional, má absorção, doença renal crônica, doença hepática', etapas: ['calcitriol ↓', 'absorção intestinal ↓', 'PTH ↑ compensatório', 'hipocalcemia com fósforo baixo (ou alto, na DRC)'] }],
        },
        {
          titulo: 'Quelação e sequestro',
          explicacao: 'O cálcio está no plasma, mas ligado a outra coisa.',
          exemplos: [
            { causa: 'Pancreatite aguda', etapas: ['saponificação do cálcio com ácidos graxos na necrose gordurosa', 'hipocalcemia'], nota: 'Compõe os critérios de gravidade da pancreatite.' },
            { causa: 'Transfusão maciça (citrato), rabdomiólise, síndrome de lise tumoral, alcalose', etapas: ['quelação por citrato ou fosfato, ou maior ligação à albumina', 'cálcio ionizado ↓'], nota: 'Na alcalose respiratória, o cálcio total é normal e só o ionizado cai — daí a tetania da hiperventilação.' },
          ],
        },
      ],
    },
    relacionados: [
      { titulo: 'Sempre com', ids: ['albumina', 'calcio-ionizado', 'pth', 'fosforo', 'vitamina-d'], leitura: 'Albumina para corrigir, PTH para bifurcar o diagnóstico, fósforo para caracterizar (PTH alto derruba o fósforo; hipoparatireoidismo o eleva) e vitamina D para a causa nutricional.' },
      { titulo: 'Se o magnésio não for dosado', ids: ['magnesio'], leitura: 'Hipocalcemia refratária à reposição é hipomagnesemia até prova em contrário.' },
    ],
    interferentes: {
      preAnalitico: ['Garrote prolongado eleva por hemoconcentração.', 'Tubo com EDTA quela o cálcio e produz valores absurdamente baixos.'],
      fisiologico: ['Alcalose reduz a fração ionizada; acidose a aumenta — com cálcio total inalterado.'],
      medicamentos: ['Tiazídicos, lítio e vitamina D elevam; bisfosfonatos, denosumabe, furosemida, anticonvulsivantes e inibidores de bomba de prótons reduzem.'],
    },
    utilidade: ['diagnostico', 'rastreamento'],
    estudarTambem: ['calcio-ionizado', 'pth', 'fosforo', 'vitamina-d', 'albumina'],
  },

  {
    id: 'calcio-ionizado',
    nome: 'Cálcio ionizado',
    sinonimos: ['calcio livre', 'ca ionico', 'ica'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'endocrino'],
    material: 'Sangue arterial ou venoso, anaeróbio',
    unidade: 'mmol/L',
    referencias: [{ rotulo: 'Adultos', minimo: 1.12, maximo: 1.32, unidade: 'mmol/L' }],
    resumo: 'A fração fisiologicamente ativa do cálcio. É ela que age no músculo, no nervo e na coagulação — e a única confiável quando a albumina ou o pH estão alterados.',
    entenda:
      'Sempre que o cálcio total for duvidoso — hipoalbuminemia, distúrbio ácido-base, transfusão maciça, doença crítica, cirurgia cardíaca — o ionizado é o exame correto. Ele dispensa correção por albumina, mas é sensível ao pH: a amostra precisa ser anaeróbia e processada rápido, porque a perda de CO₂ alcaliniza o plasma e reduz falsamente o resultado.',
    fisiologia: {
      oQueE: 'Fração de cálcio livre, não ligada a proteínas nem complexada a ânions.',
      origem: 'Equilíbrio dinâmico com o cálcio ligado à albumina, deslocado pelo pH.',
      funcao: 'É a fração que participa da contração muscular, da transmissão sináptica, da coagulação e da sinalização intracelular.',
      percurso: ['Cálcio total', 'equilíbrio com albumina (dependente do pH)', 'cálcio ionizado — a fração ativa'],
    },
    aumento: { resumo: 'As mesmas causas da hipercalcemia total, sem o ruído da albumina.', mecanismos: [{ titulo: 'Hipercalcemia verdadeira', explicacao: 'Excesso de PTH ou causa PTH-independente.', exemplos: [{ causa: 'Hiperparatireoidismo, malignidade, intoxicação por vitamina D, acidose', etapas: ['mobilização óssea ou menor ligação proteica', 'cálcio ionizado ↑'] }] }] },
    reducao: {
      resumo: 'Hipocalcemia verdadeira ou alcalose — e é o único exame que distingue as duas.',
      mecanismos: [
        {
          titulo: 'Redução da fração livre por alcalose',
          explicacao: 'O pH alto aumenta as cargas negativas da albumina e ela liga mais cálcio.',
          exemplos: [{ causa: 'Hiperventilação, alcalose metabólica', etapas: ['pH ↑', 'maior ligação à albumina', 'cálcio ionizado ↓ com total normal', 'parestesias e espasmo carpopedal'], nota: 'Explica a tetania da crise de ansiedade com cálcio total perfeitamente normal.' }],
        },
        {
          titulo: 'Quelação',
          explicacao: 'Ânions ligam o cálcio livre.',
          exemplos: [{ causa: 'Citrato de hemocomponentes, transfusão maciça, hemodiálise com citrato, hiperfosfatemia', etapas: ['quelação do cálcio livre', 'ionizado ↓ com total pouco alterado'], nota: 'Motivo pelo qual se monitora o ionizado durante transfusão maciça.' }],
        },
      ],
    },
    relacionados: [{ titulo: 'Quando preferir ao total', ids: ['calcio', 'albumina', 'ph'], leitura: 'Hipoalbuminemia, distúrbio ácido-base, transfusão maciça e doença crítica invalidam o cálcio total — nesses cenários, dose o ionizado.' }],
    interferentes: {
      preAnalitico: ['Amostra exposta ao ar perde CO₂, alcaliniza e reduz falsamente o resultado.', 'Heparina em excesso quela cálcio e reduz o valor.'],
      fisiologico: ['O pH altera o resultado em tempo real — interpretar sempre junto à gasometria.'],
    },
    utilidade: ['diagnostico'],
    estudarTambem: ['calcio', 'albumina', 'pth', 'magnesio'],
  },

  {
    id: 'magnesio',
    nome: 'Magnésio',
    sigla: 'Mg²⁺',
    sinonimos: ['magnesemia', 'mg', 'hipomagnesemia'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'cardiovascular'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [{ rotulo: 'Adultos', minimo: 1.7, maximo: 2.4, unidade: 'mg/dL' }],
    resumo:
      'O eletrólito mais esquecido — e a explicação para a maioria das hipocalemias e hipocalcemias que não corrigem com reposição.',
    entenda:
      'Apenas 1% do magnésio corporal está no plasma; o resto está no osso e dentro das células. Isso significa que magnésio sérico normal não exclui depleção corporal. Ele é cofator de mais de 300 enzimas, participa de toda reação que envolva ATP e é indispensável para a secreção e a ação do PTH e para a retenção renal de potássio. Daí a regra prática: hipocalemia e hipocalcemia refratárias exigem dosar e repor magnésio antes de qualquer outra coisa.',
    fisiologia: {
      oQueE: 'Cátion divalente intracelular, segundo mais abundante dentro da célula depois do potássio.',
      origem: 'Dieta (vegetais verdes, oleaginosas, cereais integrais), com absorção sobretudo no intestino delgado.',
      funcao: 'Cofator de enzimas dependentes de ATP, estabilizador de membrana, antagonista fisiológico do cálcio nos canais e essencial para a secreção do PTH.',
      eliminacao: 'Renal, com reabsorção principalmente na alça de Henle.',
      orgaosEnvolvidos: ['Intestino', 'Rim', 'Osso', 'Paratireoides'],
      percurso: ['Dieta', 'absorção intestinal', 'plasma (1% do total)', 'reabsorção na alça de Henle', 'urina'],
    },
    aumento: {
      resumo: 'Quase sempre iatrogênico ou por insuficiência renal — o rim normal excreta o excesso com facilidade.',
      mecanismos: [
        {
          titulo: 'Excreção reduzida com aporte aumentado',
          explicacao: 'O rim é o único regulador relevante; com TFG baixa, qualquer carga se acumula.',
          exemplos: [
            { causa: 'Doença renal crônica com uso de antiácidos ou laxantes com magnésio', etapas: ['excreção ↓ com aporte ↑', 'hipermagnesemia'], nota: 'Causa evitável e frequente em idoso nefropata.' },
            { causa: 'Sulfato de magnésio na pré-eclâmpsia', etapas: ['infusão terapêutica', 'hipermagnesemia esperada'], nota: 'Monitora-se com reflexo patelar, frequência respiratória e diurese: a perda do reflexo precede a depressão respiratória.' },
          ],
        },
      ],
    },
    reducao: {
      resumo: 'Perda renal (diuréticos, álcool), perda digestiva (diarreia, inibidores de bomba de prótons) ou redistribuição.',
      mecanismos: [
        {
          titulo: 'Perda renal',
          explicacao: 'A reabsorção na alça de Henle é bloqueada por fármacos ou lesada por toxicidade tubular.',
          exemplos: [{ causa: 'Diuréticos de alça e tiazídicos, álcool, cisplatina, anfotericina, aminoglicosídeos, inibidores de calcineurina', etapas: ['reabsorção tubular ↓', 'magnesúria ↑', 'hipomagnesemia'] }],
        },
        {
          titulo: 'Perda ou absorção digestiva reduzida',
          explicacao: 'A absorção intestinal é comprometida ou as perdas superam o aporte.',
          exemplos: [
            { causa: 'Diarreia crônica, síndromes de má absorção, ressecção intestinal', etapas: ['absorção ↓ e perdas ↑', 'hipomagnesemia'] },
            { causa: 'Inibidores de bomba de prótons em uso prolongado', etapas: ['comprometimento do transporte intestinal ativo de magnésio', 'hipomagnesemia'], nota: 'Causa reconhecida e subdiagnosticada — considerar em uso crônico com hipocalemia associada.' },
          ],
        },
        {
          titulo: 'Redistribuição',
          explicacao: 'O magnésio entra rapidamente na célula ou é consumido.',
          exemplos: [{ causa: 'Síndrome de realimentação, pancreatite aguda, correção de cetoacidose', etapas: ['captação celular acelerada', 'magnésio plasmático ↓'], nota: 'Na realimentação, cai junto com fósforo e potássio.' }],
        },
      ],
    },
    relacionados: [
      { titulo: 'O trio inseparável', ids: ['potassio', 'calcio'], leitura: 'A hipomagnesemia causa hipocalemia (por perda renal) e hipocalcemia (por falha do PTH). Repor os três isoladamente sem corrigir o magnésio não funciona.' },
    ],
    interferentes: { preAnalitico: ['Hemólise eleva falsamente — o magnésio é intracelular.'] },
    utilidade: ['diagnostico'],
    estudarTambem: ['potassio', 'calcio', 'fosforo'],
  },

  {
    id: 'fosforo',
    nome: 'Fósforo',
    sinonimos: ['fosfato', 'fosfatemia', 'p', 'hipofosfatemia', 'hiperfosfatemia'],
    grupo: 'eletrolitos',
    sistemas: ['metabolico', 'renal'],
    material: 'Soro',
    unidade: 'mg/dL',
    referencias: [
      { rotulo: 'Adultos', minimo: 2.5, maximo: 4.5, unidade: 'mg/dL' },
      { rotulo: 'Crianças', minimo: 4.0, maximo: 7.0, unidade: 'mg/dL', observacao: 'Mais alto durante o crescimento ósseo.' },
    ],
    resumo: 'Componente do ATP, do DNA e do osso. Move-se em espelho com o cálcio e é o marcador que denuncia doença renal crônica e síndrome de realimentação.',
    entenda:
      'A regulação do fósforo é feita por PTH e FGF-23, ambos fosfatúricos. Isso explica dois padrões clássicos: no hiperparatireoidismo primário, cálcio alto com fósforo baixo (o PTH aumenta a excreção); no hipoparatireoidismo, cálcio baixo com fósforo alto. Na doença renal crônica, a perda de excreção retém fosfato, que estimula FGF-23 e PTH — o eixo que produz o distúrbio mineral e ósseo e a calcificação vascular.',
    fisiologia: {
      oQueE: 'Ânion presente sobretudo como fosfato inorgânico; 85% do fósforo corporal está no osso.',
      origem: 'Dieta (laticínios, carnes, cereais, refrigerantes de cola e conservantes com fosfato).',
      funcao: 'Compõe o ATP, os ácidos nucleicos, os fosfolipídios de membrana e o 2,3-DPG da hemácia; participa do sistema tampão urinário e da mineralização óssea.',
      eliminacao: 'Renal, aumentada por PTH e FGF-23.',
      orgaosEnvolvidos: ['Rim', 'Osso', 'Intestino', 'Paratireoides'],
      percurso: ['Dieta', 'absorção intestinal (calcitriol-dependente)', 'plasma', 'excreção renal regulada por PTH e FGF-23'],
    },
    aumento: {
      resumo: 'Excreção renal reduzida, liberação celular maciça ou excesso de aporte.',
      mecanismos: [
        {
          titulo: 'Excreção renal reduzida',
          explicacao: 'Com queda da TFG, o fosfato se acumula apesar do aumento compensatório de FGF-23 e PTH.',
          exemplos: [
            { causa: 'Doença renal crônica', etapas: ['TFG ↓', 'retenção de fosfato', 'FGF-23 e PTH ↑', 'hiperparatireoidismo secundário e calcificação vascular'], nota: 'A hiperfosfatemia é fator de risco independente para mortalidade cardiovascular no renal crônico.' },
            { causa: 'Hipoparatireoidismo', etapas: ['PTH ↓', 'excreção renal de fosfato ↓', 'fósforo ↑ com cálcio ↓'] },
          ],
        },
        {
          titulo: 'Liberação celular maciça',
          explicacao: 'O fósforo é predominantemente intracelular: qualquer destruição celular o despeja no plasma.',
          exemplos: [{ causa: 'Síndrome de lise tumoral, rabdomiólise, hemólise maciça, acidose', etapas: ['destruição ou saída celular', 'fósforo ↑ com potássio ↑ e cálcio ↓'], nota: 'A hiperfosfatemia da lise tumoral quela o cálcio e pode precipitar nos túbulos, agravando a lesão renal.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Redistribuição para dentro da célula (a causa mais comum em internados), perda renal ou má absorção.',
      mecanismos: [
        {
          titulo: 'Redistribuição intracelular',
          explicacao: 'A glicólise consome fosfato para formar intermediários fosforilados. Qualquer estímulo anabólico agudo derruba o fósforo plasmático.',
          exemplos: [
            { causa: 'Síndrome de realimentação', etapas: ['reintrodução de carboidrato após jejum prolongado', 'insulina ↑', 'captação celular maciça de fosfato, potássio e magnésio', 'hipofosfatemia grave com risco de insuficiência respiratória e arritmia'], nota: 'Complicação potencialmente fatal em desnutridos, etilistas e pós-bariátricos. Repor antes e durante a realimentação.' },
            { causa: 'Tratamento da cetoacidose diabética, alcalose respiratória', etapas: ['insulina e alcalose estimulam a glicólise', 'consumo de fosfato', 'hipofosfatemia'] },
          ],
        },
        {
          titulo: 'Perda renal',
          explicacao: 'A reabsorção tubular proximal é bloqueada por excesso de PTH ou FGF-23, ou por lesão tubular.',
          exemplos: [
            { causa: 'Hiperparatireoidismo primário', etapas: ['PTH ↑', 'reabsorção tubular de fosfato ↓', 'fósforo ↓ com cálcio ↑'] },
            { causa: 'Síndrome de Fanconi, osteomalácia oncogênica (FGF-23), diuréticos', etapas: ['perda tubular de fosfato', 'hipofosfatemia com glicosúria e aminoacidúria na Fanconi'] },
          ],
        },
        {
          titulo: 'Absorção reduzida',
          explicacao: 'Falta aporte ou o fosfato é quelado no lúmen.',
          exemplos: [{ causa: 'Alcoolismo, desnutrição, quelantes de fosfato, antiácidos com alumínio, deficiência de vitamina D', etapas: ['absorção intestinal ↓', 'hipofosfatemia'] }],
        },
      ],
    },
    relacionados: [
      { titulo: 'O eixo mineral', ids: ['calcio', 'pth', 'vitamina-d', 'fosfatase-alcalina'], leitura: 'Fósforo e cálcio movem-se em direções opostas sob ação do PTH; a leitura conjunta com PTH e vitamina D define o distúrbio mineral.' },
      { titulo: 'Na realimentação', ids: ['potassio', 'magnesio'], leitura: 'Fósforo, potássio e magnésio caem juntos e devem ser repostos juntos.' },
    ],
    interferentes: { preAnalitico: ['Hemólise eleva falsamente.'], fisiologico: ['Ritmo circadiano: valores mais baixos pela manhã.'] },
    utilidade: ['diagnostico', 'acompanhamento'],
    estudarTambem: ['calcio', 'pth', 'magnesio', 'creatinina'],
  },

  {
    id: 'cloro',
    nome: 'Cloro',
    sigla: 'Cl⁻',
    sinonimos: ['cloreto', 'cloremia', 'cl'],
    grupo: 'eletrolitos',
    sistemas: ['renal', 'respiratorio', 'metabolico'],
    material: 'Soro',
    unidade: 'mEq/L',
    referencias: [{ rotulo: 'Adultos', minimo: 98, maximo: 107, unidade: 'mEq/L' }],
    resumo: 'O principal ânion extracelular. Sozinho diz pouco; sua função é entrar no cálculo do ânion gap e caracterizar as acidoses metabólicas.',
    entenda:
      'O cloro acompanha o sódio na maioria das situações e se move em direção oposta ao bicarbonato para manter a eletroneutralidade. Isso o torna a chave da classificação das acidoses metabólicas: acidose com cloro alto (hiperclorêmica) tem ânion gap normal e aponta perda de bicarbonato — diarreia, acidose tubular renal, excesso de salina 0,9%. Acidose com cloro normal tem ânion gap aumentado e aponta acúmulo de ácido — lactato, cetoácidos, uremia, intoxicações.',
    fisiologia: {
      oQueE: 'Ânion monovalente predominante no líquido extracelular.',
      origem: 'Dieta, como cloreto de sódio.',
      funcao: 'Manter a eletroneutralidade e a osmolalidade, compor o ácido clorídrico gástrico e participar do transporte tubular renal e do desvio de cloreto na hemácia durante o transporte de CO₂.',
      eliminacao: 'Renal, acompanhando o sódio; e gástrica.',
      percurso: ['Dieta', 'absorção intestinal', 'plasma junto ao sódio', 'reabsorção tubular acoplada ao sódio', 'urina'],
    },
    aumento: {
      resumo: 'Acidose metabólica hiperclorêmica, perda de água livre ou infusão de salina em grande volume.',
      mecanismos: [
        {
          titulo: 'Troca por bicarbonato',
          explicacao: 'Quando se perde bicarbonato, o cloro é retido para manter a eletroneutralidade — o ânion gap permanece normal.',
          exemplos: [
            { causa: 'Diarreia, acidose tubular renal, fístula pancreática', etapas: ['perda de bicarbonato', 'retenção compensatória de cloro', 'acidose metabólica com ânion gap normal'] },
            { causa: 'Infusão de grandes volumes de salina 0,9%', etapas: ['carga de cloro (154 mEq/L)', 'acidose hiperclorêmica dilucional'], nota: 'Motivo pelo qual soluções balanceadas são preferidas em ressuscitação volêmica de grande volume.' },
          ],
        },
        { titulo: 'Perda de água livre', explicacao: 'Concentra sódio e cloro juntos.', exemplos: [{ causa: 'Desidratação, diabetes insipidus', etapas: ['perda de água livre', 'sódio e cloro ↑ juntos'] }] },
      ],
    },
    reducao: {
      resumo: 'Vômitos, alcalose metabólica e diuréticos.',
      mecanismos: [
        {
          titulo: 'Perda gástrica',
          explicacao: 'O suco gástrico é rico em ácido clorídrico: vomitar é perder cloro e H⁺.',
          exemplos: [{ causa: 'Vômitos e aspiração nasogástrica', etapas: ['perda de HCl', 'alcalose metabólica hipoclorêmica com hipocalemia'], nota: 'Cloro urinário baixo indica alcalose responsiva a cloreto — corrige com salina.' }],
        },
        { titulo: 'Perda renal', explicacao: 'Diuréticos bloqueiam a reabsorção de sódio e cloro.', exemplos: [{ causa: 'Diuréticos de alça e tiazídicos', etapas: ['reabsorção de cloro ↓', 'hipocloremia com alcalose metabólica'] }] },
      ],
    },
    relacionados: [{ titulo: 'Para classificar a acidose', ids: ['bicarbonato', 'anion-gap', 'sodio'], leitura: 'O cloro só ganha sentido dentro do ânion gap: Na⁺ − (Cl⁻ + HCO₃⁻). Ele é quem separa acidose com gap normal de acidose com gap aumentado.' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['bicarbonato', 'anion-gap', 'sodio', 'potassio'],
  },

  {
    id: 'bicarbonato',
    nome: 'Bicarbonato',
    sigla: 'HCO₃⁻',
    sinonimos: ['hco3', 'bicarbonato serico', 'co2 total', 'reserva alcalina'],
    grupo: 'gasometria',
    sistemas: ['renal', 'respiratorio', 'metabolico'],
    material: 'Soro (CO₂ total) ou gasometria',
    unidade: 'mEq/L',
    referencias: [{ rotulo: 'Adultos', minimo: 22, maximo: 26, unidade: 'mEq/L' }],
    resumo: 'O principal tampão extracelular. Seu valor diz se existe distúrbio metabólico — e, junto ao pH e à PaCO₂, se ele é primário ou compensatório.',
    entenda:
      'O bicarbonato é o componente metabólico da equação de Henderson-Hasselbalch: o pH depende da razão entre bicarbonato (regulado pelo rim, em dias) e PaCO₂ (regulado pelo pulmão, em minutos). Bicarbonato baixo significa acidose metabólica ou compensação de alcalose respiratória; bicarbonato alto significa alcalose metabólica ou compensação de acidose respiratória. É o pH que decide qual dos dois é o distúrbio primário.',
    fisiologia: {
      oQueE: 'Base conjugada do ácido carbônico e principal sistema tampão do líquido extracelular.',
      origem: 'Gerado no túbulo proximal renal a partir de CO₂ e água, pela anidrase carbônica.',
      funcao: 'Tamponar ácidos fixos e manter o pH plasmático entre 7,35 e 7,45.',
      eliminacao: 'Reabsorvido em 85% no túbulo proximal; a regeneração ocorre no túbulo distal com excreção de H⁺ como amônio e acidez titulável.',
      orgaosEnvolvidos: ['Rim (regulação lenta, em dias)', 'Pulmão (regulação do CO₂, em minutos)'],
      percurso: ['CO₂ + H₂O', 'anidrase carbônica', 'H₂CO₃', 'H⁺ + HCO₃⁻', 'reabsorção tubular proximal', 'tamponamento plasmático'],
    },
    aumento: {
      resumo: 'Alcalose metabólica primária ou compensação renal de acidose respiratória crônica.',
      mecanismos: [
        {
          titulo: 'Perda de ácido ou ganho de base',
          explicacao: 'Perde-se H⁺ pelo estômago ou pelo rim, ou administra-se álcali.',
          exemplos: [
            { causa: 'Vômitos, aspiração gástrica, diuréticos, hiperaldosteronismo', etapas: ['perda de H⁺ e cloro', 'reabsorção compensatória de bicarbonato', 'alcalose metabólica com hipocalemia'] },
            { causa: 'Administração de bicarbonato ou citrato (transfusão maciça)', etapas: ['ganho exógeno de álcali', 'bicarbonato ↑'] },
          ],
        },
        {
          titulo: 'Compensação renal de hipercapnia crônica',
          explicacao: 'O rim retém bicarbonato para compensar a acidose respiratória. Leva de 3 a 5 dias para se estabelecer.',
          exemplos: [{ causa: 'DPOC avançada, síndrome de hipoventilação da obesidade', etapas: ['PaCO₂ ↑ crônica', 'reabsorção renal de bicarbonato ↑', 'bicarbonato ↑ com pH próximo do normal'], nota: 'Bicarbonato alto com pH normal e PaCO₂ alta é compensação, não alcalose — e diz que a hipercapnia é crônica.' }],
        },
      ],
    },
    reducao: {
      resumo: 'Acidose metabólica — por acúmulo de ácido (ânion gap alto) ou perda de bicarbonato (ânion gap normal) — ou compensação de alcalose respiratória.',
      mecanismos: [
        {
          titulo: 'Consumo por ácidos fixos (ânion gap aumentado)',
          explicacao: 'O bicarbonato é gasto tamponando um ácido que se acumulou; o ânion não medido ocupa seu lugar e o gap sobe.',
          exemplos: [
            { causa: 'Acidose lática (choque, sepse, isquemia, metformina)', etapas: ['metabolismo anaeróbio', 'lactato ↑', 'consumo de bicarbonato', 'ânion gap ↑'] },
            { causa: 'Cetoacidose diabética ou alcoólica', etapas: ['lipólise e cetogênese', 'beta-hidroxibutirato ↑', 'bicarbonato ↓ com ânion gap ↑'] },
            { causa: 'Uremia, intoxicação por metanol, etilenoglicol ou salicilato', etapas: ['acúmulo de ácidos não medidos', 'bicarbonato ↓ com gap ↑'], nota: 'Ânion gap muito alto sem lactato nem cetonas obriga a pensar em intoxicação — calcular o gap osmolar.' },
          ],
        },
        {
          titulo: 'Perda de bicarbonato (ânion gap normal)',
          explicacao: 'O bicarbonato sai do corpo e o cloro o substitui — o gap não muda.',
          exemplos: [
            { causa: 'Diarreia', etapas: ['perda intestinal de bicarbonato', 'acidose hiperclorêmica com gap normal'] },
            { causa: 'Acidose tubular renal', etapas: ['falha na reabsorção proximal (tipo 2) ou na secreção distal de H⁺ (tipo 1)', 'acidose com gap normal'], nota: 'O ânion gap urinário ajuda a separar diarreia (negativo) de acidose tubular renal (positivo).' },
          ],
        },
        {
          titulo: 'Compensação de alcalose respiratória',
          explicacao: 'O rim excreta bicarbonato para compensar a hipocapnia crônica.',
          exemplos: [{ causa: 'Hiperventilação crônica, gestação, altitude', etapas: ['PaCO₂ ↓', 'excreção renal de bicarbonato ↑', 'bicarbonato ↓ com pH próximo do normal'] }],
        },
      ],
    },
    relacionados: [
      { titulo: 'A leitura ácido-base completa', ids: ['ph', 'paco2', 'anion-gap', 'lactato'], leitura: 'pH define acidemia ou alcalemia; PaCO₂ e bicarbonato definem se é respiratório ou metabólico; o ânion gap e o lactato dizem qual ácido se acumulou.' },
    ],
    interferentes: {
      preAnalitico: ['Amostra venosa exposta ao ar perde CO₂ e reduz o CO₂ total.', 'Demora no processamento reduz o valor pelo metabolismo celular continuado.'],
    },
    utilidade: ['diagnostico', 'acompanhamento'],
    padroes: ['acidose-metabolica-anion-gap-alto', 'acidose-metabolica-hiperclorenica'],
    estudarTambem: ['ph', 'paco2', 'anion-gap', 'cloro', 'lactato'],
  },

  {
    id: 'osmolalidade-urinaria',
    nome: 'Osmolalidade urinária',
    sinonimos: ['osmolaridade urinaria', 'osmu'],
    grupo: 'renal',
    sistemas: ['renal'],
    material: 'Amostra isolada de urina',
    unidade: 'mOsm/kg',
    referencias: [{ rotulo: 'Faixa possível', texto: '50 a 1.200', unidade: 'mOsm/kg', observacao: 'O valor esperado depende inteiramente do contexto: com sede, deve ser alta; com excesso de água, deve ser baixa.' }],
    resumo: 'Mede a capacidade do rim de concentrar ou diluir a urina. É o exame que separa causas de hiponatremia e de poliúria.',
    entenda:
      'Diante de hiponatremia, a pergunta é: o rim está excretando o excesso de água como deveria? Osmolalidade urinária abaixo de 100 mOsm/kg significa que sim — a urina está maximamente diluída e a causa é ingesta excessiva (polidipsia, potomania). Acima disso, a ADH está agindo, apropriada (hipovolemia, insuficiência cardíaca) ou inapropriadamente (SIADH). Diante de poliúria, o raciocínio é análogo: urina diluída aponta diabetes insipidus ou diurese aquosa; urina concentrada aponta diurese osmótica (glicose, ureia, manitol).',
    fisiologia: {
      oQueE: 'Concentração total de solutos osmoticamente ativos na urina.',
      origem: 'Resulta da ação da ADH sobre os ductos coletores e do gradiente osmótico medular gerado pela alça de Henle.',
      funcao: 'Traduz diretamente a capacidade de concentração e diluição renal.',
      percurso: ['Osmolalidade plasmática', 'ADH', 'aquaporinas no ducto coletor', 'reabsorção de água', 'osmolalidade urinária'],
    },
    aumento: {
      resumo: 'ADH agindo: hipovolemia, SIADH, insuficiência cardíaca, cirrose — ou diurese osmótica.',
      mecanismos: [
        {
          titulo: 'ADH elevada',
          explicacao: 'As aquaporinas são inseridas no ducto coletor e a água é reabsorvida, concentrando a urina.',
          exemplos: [
            { causa: 'Hipovolemia', etapas: ['estímulo barorreceptor', 'ADH ↑ apropriada', 'urina concentrada com sódio urinário baixo'] },
            { causa: 'SIADH', etapas: ['ADH inapropriada', 'urina concentrada apesar de hiponatremia', 'sódio urinário alto'] },
          ],
        },
        { titulo: 'Diurese osmótica', explicacao: 'Solutos no túbulo arrastam água e mantêm a osmolalidade urinária alta apesar da poliúria.', exemplos: [{ causa: 'Hiperglicemia, manitol, alta carga de ureia', etapas: ['soluto não reabsorvido no túbulo', 'poliúria com urina relativamente concentrada'] }] },
      ],
    },
    reducao: {
      resumo: 'ADH ausente ou ineficaz, ou excesso de água a excretar.',
      mecanismos: [
        {
          titulo: 'Falta ou resistência à ADH',
          explicacao: 'A água não é reabsorvida no ducto coletor.',
          exemplos: [{ causa: 'Diabetes insipidus central ou nefrogênico', etapas: ['ADH ausente ou rim que não responde', 'urina diluída em grande volume', 'hipernatremia se a sede não compensar'] }],
        },
        { titulo: 'Excreção apropriada de água livre', explicacao: 'O rim está funcionando: recebeu água demais e a está eliminando.', exemplos: [{ causa: 'Polidipsia primária, potomania', etapas: ['ingesta hídrica excessiva', 'ADH suprimida', 'urina maximamente diluída (< 100 mOsm/kg)'], nota: 'É o achado que separa esse grupo do SIADH.' }] },
      ],
    },
    relacionados: [{ titulo: 'Na investigação da hiponatremia', ids: ['sodio', 'sodio-urinario', 'acido-urico'], leitura: 'Osmolalidade urinária primeiro (excesso de ingesta versus retenção), sódio urinário depois (SIADH versus hipovolemia).' }],
    utilidade: ['diagnostico'],
    estudarTambem: ['sodio', 'sodio-urinario', 'densidade-urinaria'],
  },
]

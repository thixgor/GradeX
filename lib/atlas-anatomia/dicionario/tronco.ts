import type { EntradaDicionario } from './tipos'

/**
 * Parede do tronco e diafragma.
 *
 * Cada entrada responde por títulos exatos do acervo. Ver `tipos.ts` para a
 * régua de redação e para o motivo de o casamento ser por igualdade.
 */
export const TRONCO: EntradaDicionario[] = [
  {
    termos: ['Músculo Trapézio'],
    resumo: 'Grande músculo triangular do dorso superior, que move a escápula em três direções.',
    localizacao: 'Da linha nucal superior, do ligamento nucal e dos processos espinhosos de C7 a T12 até a clavícula, o acrômio e a espinha da escápula.',
    funcao: 'As fibras superiores elevam a escápula, as médias a retraem e as inferiores a deprimem e ajudam na rotação superior durante a abdução do braço.',
    vascularizacao: 'Artéria transversa do pescoço (cervical transversa).',
    inervacao: 'Nervo acessório (XI), com contribuição sensitiva de C3–C4.',
    clinica:
      'A lesão do nervo acessório — clássica em biópsia de linfonodo no trígono cervical posterior — causa queda do ombro, dificuldade de abduzir acima de 90° e escápula alada discreta. Testa-se pedindo elevação dos ombros contra resistência.',
    pontos: ['Três porções com ações distintas', 'Nervo acessório (XI)', 'Lesão em cirurgia do trígono cervical posterior'],
  },
  {
    termos: ['Músculo Latíssimo do Dorso'],
    resumo: 'O músculo mais largo do corpo, que liga o tronco ao úmero.',
    localizacao: 'Da fáscia toracolombar, dos processos espinhosos de T7 ao sacro, da crista ilíaca e das costelas inferiores até o sulco intertubercular do úmero.',
    funcao: 'Extensão, adução e rotação medial do braço — o movimento de puxar o corpo para cima (barra) e de nadar.',
    vascularizacao: 'Artéria toracodorsal, ramo da subescapular.',
    inervacao: 'Nervo toracodorsal (C6–C8), do fascículo posterior do plexo braquial.',
    clinica: 'É o retalho miocutâneo de escolha na reconstrução mamária e de grandes defeitos de parede torácica, justamente pelo pedículo toracodorsal longo e confiável.',
    pontos: ['Extensão, adução e rotação medial do braço', 'Nervo toracodorsal', 'Retalho miocutâneo de reconstrução'],
  },
  {
    termos: ['Músculo Peitoral Maior'],
    resumo: 'Grande músculo em leque da parede torácica anterior, que forma a prega axilar anterior.',
    localizacao: 'Da clavícula, do esterno e das cartilagens costais até a crista do tubérculo maior do úmero, com as fibras torcendo-se na inserção.',
    funcao: 'Adução e rotação medial do braço; a porção clavicular flexiona e a esternocostal estende o braço fletido.',
    vascularizacao: 'Artéria toracoacromial (ramo peitoral) e artéria torácica lateral.',
    inervacao: 'Nervos peitorais lateral e medial (C5–T1).',
    clinica:
      'Sua borda inferior forma a prega axilar anterior, reparo do exame da axila e da mama. A ausência congênita integra a síndrome de Poland. A ruptura do tendão ocorre em levantamento de peso e deforma o contorno axilar.',
    pontos: ['Forma a prega axilar anterior', 'Adução e rotação medial do braço', 'Nervos peitorais lateral e medial'],
  },
  {
    termos: ['Músculo Serrátil Anterior'],
    resumo: 'Músculo em digitações na parede lateral do tórax, que fixa a escápula ao gradil costal.',
    localizacao: 'Das oito ou nove primeiras costelas até a borda medial da escápula, passando por baixo dela.',
    funcao: 'Protrai a escápula e a mantém aplicada à parede torácica; faz a rotação superior que permite elevar o braço acima da cabeça.',
    vascularizacao: 'Artéria torácica lateral.',
    inervacao: 'Nervo torácico longo (C5–C7), que desce superficialmente sobre o músculo.',
    clinica:
      'A lesão do nervo torácico longo — em esvaziamento axilar, trauma ou mochila pesada — produz a escápula alada clássica, evidenciada ao empurrar a parede com os braços estendidos.',
    pontos: ['Protrai a escápula e permite elevar o braço acima de 90°', 'Nervo torácico longo (C5, C6, C7)', 'Escápula alada na lesão'],
  },
  {
    termos: ['Músculo Reto do Abdome'],
    resumo: 'Músculo longo e segmentado da parede abdominal anterior, dentro da bainha do reto.',
    localizacao: 'Da sínfise e da crista púbica até as cartilagens costais 5 a 7 e o processo xifoide, dividido por intersecções tendíneas.',
    funcao: 'Flexiona o tronco, aumenta a pressão intra-abdominal e estabiliza a pelve.',
    vascularizacao: 'Artérias epigástricas superior (torácica interna) e inferior (ilíaca externa), que se anastomosam dentro da bainha.',
    inervacao: 'Nervos toracoabdominais (T7–T12), que entram pela margem lateral.',
    clinica:
      'A linha arqueada marca onde a bainha perde o folheto posterior: abaixo dela, a parede posterior é apenas fáscia transversal — ponto de fraqueza. O retalho TRAM usa este músculo e a epigástrica inferior profunda na reconstrução mamária. A diástase dos retos é comum no pós-parto.',
    pontos: ['Bainha do reto e linha arqueada', 'Anastomose epigástrica superior-inferior', 'Retalho TRAM e diástase dos retos'],
  },
  {
    termos: ['Músculo Oblíquo Externo', 'Músculo Oblíquo Interno'],
    resumo: 'Os três músculos planos da parede anterolateral do abdome, com fibras em direções cruzadas.',
    localizacao:
      'Sobrepostos em camadas: oblíquo externo com fibras "para dentro do bolso", oblíquo interno em direção oposta e transverso com fibras horizontais. Suas aponeuroses formam a bainha do reto e a linha alba.',
    funcao: 'Comprimem as vísceras, elevam a pressão intra-abdominal (tosse, defecação, parto), flexionam e giram o tronco.',
    vascularizacao: 'Artérias intercostais inferiores, subcostal, lombares e circunflexa ilíaca profunda.',
    inervacao: 'Nervos toracoabdominais (T7–T11), subcostal (T12), ílio-hipogástrico e ilioinguinal (L1).',
    clinica:
      'O bloqueio TAP deposita anestésico no plano entre o oblíquo interno e o transverso, onde correm os nervos. As camadas aponeuróticas definem os anéis inguinais e o trajeto das hérnias; o tendão conjunto reforça a parede posterior do canal inguinal.',
    pontos: ['Três camadas com fibras cruzadas', 'Formam a bainha do reto e a linha alba', 'Plano do bloqueio TAP entre oblíquo interno e transverso'],
  },
  {
    termos: ['Músculo Eretor da Espinha', 'Músculo Iliocostal', 'Músculo Longuíssimo'],
    resumo: 'Coluna muscular profunda do dorso, dividida em iliocostal (lateral), longuíssimo (intermédio) e espinal (medial).',
    localizacao: 'De uma origem comum no sacro, na crista ilíaca e nos processos espinhosos lombares, sobe em três colunas até costelas, processos transversos e crânio.',
    funcao: 'Estende e inclina lateralmente a coluna; em pé, trabalha excentricamente para controlar a flexão do tronco contra a gravidade.',
    vascularizacao: 'Ramos dorsais das artérias segmentares.',
    inervacao: 'Ramos dorsais dos nervos espinais — a marca de todo músculo intrínseco do dorso.',
    clinica:
      'O espasmo do eretor da espinha acompanha a maioria das lombalgias mecânicas. O plano do bloqueio ESP (erector spinae plane) é a face profunda desse músculo, sobre o processo transverso.',
    pontos: ['Três colunas: iliocostal, longuíssimo e espinal', 'Inervação por ramos dorsais', 'Trabalha excentricamente no controle da flexão'],
  },
  {
    termos: ['Diafragma'],
    resumo: 'O músculo respiratório principal — uma cúpula musculotendínea que separa tórax e abdome.',
    localizacao:
      'Insere-se no processo xifoide, nas seis últimas cartilagens costais e nos pilares que descem até L1–L3, convergindo para o centro tendíneo.',
    funcao:
      'Ao contrair, achata-se e aumenta o diâmetro vertical do tórax, gerando a pressão negativa da inspiração — responde por cerca de 70% do volume corrente em repouso.',
    vascularizacao: 'Artérias frênicas inferiores (aorta abdominal), pericardicofrênica e musculofrênica.',
    inervacao: 'Nervo frênico (C3–C5) para toda a porção motora; a periferia recebe sensibilidade dos nervos intercostais inferiores.',
    relacoes: 'Hiato da veia cava em T8 (no centro tendíneo), hiato esofágico em T10 (nos pilares, com os troncos vagais) e hiato aórtico em T12 (atrás dos pilares, com o ducto torácico e a veia ázigo).',
    clinica:
      'A irritação da cúpula refere dor ao ombro (C3–C5) — sinal de Kehr. A lesão medular acima de C3 abole a ventilação espontânea. O hiato esofágico é a sede da hérnia de hiato e do refluxo gastroesofágico.',
    pontos: ['C3, C4 e C5 mantêm o diafragma vivo', 'Hiatos: cava T8, esôfago T10, aorta T12', 'Dor referida no ombro por irritação diafragmática'],
  },
]

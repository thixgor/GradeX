import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 350, caso 13 — "Diffuse alveolar damage".
salvar('dano-alveolar-difuso-2', [
    pat('membranas', 'membranas-hialinas', seta(0.5000, 0.5050, 225),
        rotulo='Membranas hialinas: placas rosa vítreas moldando as paredes alveolares',
        nota='Faixas densas, homogêneas e vítreas de material eosinofílico encostadas nas paredes dos alvéolos e ductos alveolares, acompanhando o contorno do espaço aéreo. São proteínas plasmáticas e fibrina que vazaram pelo endotélio lesado, misturadas aos restos dos pneumócitos tipo I mortos. É a marca da fase exsudativa (primeira semana) da síndrome do desconforto respiratório agudo.',
        vista=(0.495, 0.495, 0.510, 0.510)),
    pat('membranas-2', 'membranas-hialinas', seta(0.4900, 0.4700, 135),
        rotulo='Membranas em vários alvéolos vizinhos — o dano é difuso',
        vista=(0.450, 0.450, 0.530, 0.530)),
    pat('edema', 'hiperemia-e-congestao', seta(0.5100, 0.5150, 315),
        rotulo='Edema proteináceo e capilares cheios nos septos',
        nota='Além das membranas, os alvéolos têm líquido rosa-pálido (edema rico em proteína) e os capilares dos septos estão congestos — o pulmão fica pesado, "molhado", e a troca gasosa falha.',
        vista=(0.500, 0.500, 0.525, 0.525)),
    pat('pneumocitos', 'hiperplasia-de-pneumocitos-tipo-ii', seta(0.3300, 0.2800, 225),
        rotulo='Septos espessados e celulares, com pneumócitos reativos',
        nota='Em outras áreas os septos estão espessados por células inflamatórias e pneumócitos tipo II aumentados, cúbicos, que começam a recobrir as paredes desnudadas — o início da fase de reparo.',
        vista=(0.300, 0.250, 0.360, 0.310)),
    est('arteria', 'arteria-muscular', seta(0.2650, 0.1950, 45),
        rotulo='Ramo arterial pulmonar',
        vista=(0.240, 0.170, 0.290, 0.220)),
], achados=[
    achado('membranas-hialinas', 'presente', ['membranas', 'membranas-2'],
           'Membranas hialinas densas moldando as paredes alveolares em áreas extensas.'),
    achado('hiperplasia-de-pneumocitos-tipo-ii', 'presente', ['pneumocitos'],
           'Pneumócitos tipo II reativos em septos espessados e celulares.'),
    achado('tecido-de-granulacao', 'nao-avaliavel', [],
           'Os septos estão espessados sobretudo por células inflamatórias; nos campos conferidos não se separa com segurança a proliferação fibroblástica mixoide da fase organizante.'),
    achado('hiperemia-e-congestao', 'presente', ['edema'],
           'Edema proteináceo intra-alveolar e capilares congestos.'),
], conferencias=3, resumo='Dano alveolar difuso (substrato da SDRA): membranas hialinas densas moldando as paredes de alvéolos e ductos alveolares em todo o corte, com edema proteináceo, capilares congestos e septos espessados por células inflamatórias e pneumócitos tipo II reativos — fase exsudativa passando à de reparo.')
print('ok')

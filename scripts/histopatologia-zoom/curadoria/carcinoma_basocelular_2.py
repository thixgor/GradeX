import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

# Rosai Collection, seminário 93, caso 17 — "Basal cell carcinoma".
salvar('carcinoma-basocelular-2', [
    pat('ninho', 'ninhos-basaloides', seta(0.3900, 0.0700, 225),
        rotulo='Ninho de células basaloides, contínuo com a epiderme',
        nota='Uma massa de células pequenas, de núcleo oval escuro e quase sem citoplasma — semelhantes às células da camada basal da epiderme e do folículo piloso, das quais o tumor deriva — desce da epiderme para a derme. Os ninhos são vários, unidos à epiderme ao longo de toda a lâmina.',
        vista=(0.350, 0.035, 0.450, 0.105)),
    pat('palicada', 'paliçada-periferica', seta(0.3770, 0.0860, 315),
        rotulo='Paliçada: núcleos alinhados como estacas na borda',
        nota='Na periferia de cada ninho os núcleos ficam alongados, perpendiculares à borda, lado a lado como estacas de cerca. É o arranjo que mais ajuda a reconhecer o basocelular: imita a camada basal, que também se organiza assim contra a membrana basal.',
        vista=(0.360, 0.075, 0.400, 0.100)),
    pat('estroma-mixoide', 'fenda-de-retracao', seta(0.4010, 0.0780, 180),
        rotulo='Estroma frouxo e pálido entre os lóbulos do tumor',
        nota='O estroma que acompanha os ninhos é frouxo, mixoide, mais claro que a derme vizinha. Ele é produzido junto com o tumor — o basocelular depende desse estroma para crescer, e é por isso que quase nunca dá metástase. No processamento, o estroma mixoide se retrai e abre as fendas que separam ninho e derme.',
        vista=(0.395, 0.070, 0.415, 0.085)),
    pat('infiltrado', 'infiltrado-linfoplasmocitario', seta(0.3560, 0.0700, 0),
        rotulo='Linfócitos e plasmócitos na derme em volta',
        vista=(0.350, 0.055, 0.370, 0.095)),
    pat('invasao', 'invasao-estromal', seta(0.4100, 0.0990, 270),
        rotulo='Borda inferior do tumor empurrando a derme',
        vista=(0.380, 0.085, 0.440, 0.105)),
    est('epiderme', 'epiderme', seta(0.3600, 0.0500, 90),
        rotulo='Epiderme sobre o tumor',
        vista=(0.350, 0.040, 0.380, 0.060)),
    est('glandulas-sudoriparas', 'glandula-sudoripara-ecrina', seta(0.4650, 0.1400, 45),
        rotulo='Glândulas sudoríparas écrinas na derme profunda',
        vista=(0.440, 0.120, 0.500, 0.160)),
], achados=[
    achado('ninhos-basaloides', 'presente', ['ninho'],
           'Ninhos basaloides múltiplos, presos à epiderme ao longo de toda a amostra.'),
    achado('paliçada-periferica', 'presente', ['palicada'],
           'Paliçada nítida na periferia dos ninhos.'),
    achado('fenda-de-retracao', 'presente', ['estroma-mixoide'],
           'Estroma mixoide pálido em torno dos ninhos, com pequenas fendas de retração.'),
    achado('invasao-estromal', 'presente', ['invasao'],
           'Os ninhos ocupam a derme papilar e o topo da reticular, com bordas arredondadas (padrão nodular/superficial, não infiltrativo).'),
    achado('ulceracao-da-mucosa', 'ausente', [],
           'A epiderme sobre o tumor está íntegra, com camada córnea.'),
    achado('infiltrado-linfoplasmocitario', 'presente', ['infiltrado'],
           'Infiltrado linfocitário e plasmocitário na derme ao redor dos ninhos.'),
], conferencias=3, resumo='Pele com carcinoma basocelular: ninhos de células basaloides que descem da epiderme para a derme ao longo de toda a amostra, com paliçada periférica, estroma mixoide pálido e infiltrado linfocitário em volta. A epiderme está íntegra; glândulas sudoríparas e gordura preservadas na profundidade.')
print('ok')

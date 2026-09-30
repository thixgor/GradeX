import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('congestao-hepatica-cronica-1', [
    pat('faixas', 'congestao-centrolobular', seta(0.4660, 0.3430, 45),
        rotulo='Faixa congesta: sinusoides dilatados com hemácias',
        vista=(0.440, 0.320, 0.480, 0.360)),
    pat('hemossiderina', 'congestao-centrolobular', seta(0.4592, 0.3322, 45),
        rotulo='Hemossiderina em macrófago e hepatócitos',
        vista=(0.450, 0.325, 0.462, 0.337)),
    pat('sinusoide', 'hiperemia-e-congestao', seta(0.4668, 0.3405, 45),
        rotulo='Sinusoide com hemácias acumuladas',
        vista=(0.460, 0.336, 0.472, 0.348)),
    pat('esteatose', 'esteatose-macrovesicular', seta(0.4450, 0.3536, 45),
        rotulo='Gotas de gordura em hepatócitos hipóxicos',
        vista=(0.440, 0.346, 0.452, 0.358)),
    est('hepatocitos', 'hepatocito', seta(0.4547, 0.3305, 45), rotulo='Hepatócito',
        vista=(0.450, 0.325, 0.462, 0.337)),
], achados=[
    achado('congestao-centrolobular', 'presente', ['faixas', 'hemossiderina'], 'Sinusoides dilatados e cheios de hemácias, com trabéculas atróficas, em faixas que ligam as veias centrais.'),
    achado('hiperemia-e-congestao', 'presente', ['sinusoide'], 'Congestão vascular difusa, com hemácias acumuladas nos sinusoides.'),
    achado('esteatose-macrovesicular', 'presente', ['esteatose'], 'Gotas isoladas de gordura em hepatócitos na transição entre áreas congestas e preservadas.'),
], conferencias=3, resumo='Fígado de mulher de 50 anos com insuficiência cardíaca: congestão passiva crônica ("noz-moscada"), com sinusoides dilatados, atrofia das placas e hemossiderina.')
print('ok')

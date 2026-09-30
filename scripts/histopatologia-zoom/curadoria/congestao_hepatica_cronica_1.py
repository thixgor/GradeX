import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('congestao-hepatica-cronica-1', [], achados=[
    achado('congestao-centrolobular', 'presente', [], 'Sinusoides centrolobulares dilatados e cheios de hemácias, com trabéculas atróficas e macrófagos com hemossiderina; zona periportal preservada.'),
    achado('hiperemia-e-congestao', 'presente', [], 'Congestão vascular difusa, formando faixas vermelhas que ligam as veias centrais.'),
    achado('esteatose-macrovesicular', 'presente', [], 'Gotas isoladas de gordura em hepatócitos na transição entre áreas congestas e preservadas.'),
], conferencias=3, sem_marcacoes=True, resumo='Fígado de mulher de 50 anos com insuficiência cardíaca: congestão passiva crônica ("noz-moscada"), com sinusoides centrolobulares dilatados, atrofia das placas e hemossiderina.')
print('ok')

import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1]))
from leeds import *

salvar('meningioma-1', [], achados=[
    achado('espirais-meningoteliais', 'presente', [], 'Lóbulos de células meningoteliais sinciciais com redemoinhos.'),
    achado('corpos-psamomatosos', 'presente', [], 'Corpos psamomatosos calcificados espalhados pelo tumor.'),
], conferencias=3, sem_marcacoes=True, resumo='Meningioma grau 1 da OMS de mulher de 55 anos (massa extra-axial): lóbulos e redemoinhos de células meningoteliais com corpos psamomatosos.')
print('ok')
